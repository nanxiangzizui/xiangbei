(function (XB) {
  "use strict";

  // 步骤四：四关共用一套“限时分配”引擎。
  // 加载时只建常量，不碰 DOM、不读 getComputedStyle——Node 契约测试可直接加载本文件。
  // 规则契约见 docs/minigame-system.md；代码里不出现第二套数值。

  var SCENES = ["door", "abandon", "boat", "climb"];
  var DESIGN_W = 1280;
  var DESIGN_H = 720;
  var DPR_MAX = 2;
  var LIVE_THROTTLE_MS = 500;
  var TAP_SLOP = 8;
  var DT_MAX_MS = 50;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) {
      deepFreeze(value[key]);
    });
    return Object.freeze(value);
  }

  // 唯一生效的数值表。剧情里的 config 只做契约核对，运行期不覆盖这里。
  var RULES = deepFreeze({
    door: {
      duration: 75,
      target: 45,
      settle: 20,
      capacity: 6,
      doorCost: 2,
      items: 8,
      warnAt: 10
    },
    abandon: {
      duration: 80,
      target: 50,
      settle: 20,
      batches: 2,
      quota: 3,
      items: 6,
      enemy: 45,
      heavyPenalty: 8
    },
    boat: {
      duration: 90,
      target: 60,
      settle: 20,
      boats: 6,
      capacity: 8,
      crewPerBoat: 3,
      plannedTrips: 18,
      crewByTrust: [12, 18, 24, 30, 37, 37, 37],
      outbound: 12,
      inbound: 12,
      tripMin: 9,
      crewStep: 12,
      fatiguePerLeg: 12,
      fatigueSoft: 80,
      fatigueHard: 100,
      rest: 12,
      restRecovery: 12,
      enemy: 120
    },
    climb: {
      duration: 75,
      target: 50,
      settle: 20,
      spans: 3,
      lights: 22,
      stepMs: 1800,
      hitWindow: 0.35,
      fireAt: [6, 12, 18],
      fireTaps: 3,
      fireWindowMs: 1500
    }
  });

  // 物品只在这里定义一次；id 与 docs/state-schema.md 的 inventory.items 白名单一致。
  var ITEMS = deepFreeze({
    door: [
      { id: "door", label: "门板", slots: 2, kind: "door" },
      { id: "roster", label: "花名册", slots: 0, kind: "keepsake" },
      { id: "pencil", label: "铅笔", slots: 0, kind: "keepsake" },
      { id: "medicine", label: "药", slots: 1, optional: true },
      { id: "barley", label: "青稞", slots: 1, optional: true },
      { id: "pot", label: "铁锅", slots: 2, optional: true },
      { id: "raincloth", label: "雨布", slots: 1, optional: true },
      { id: "shoes", label: "布鞋", slots: 1, optional: true }
    ],
    abandon: [
      { id: "xray", label: "三百斤的箱子", heavy: true },
      { id: "press", label: "印刷机", heavy: true },
      { id: "files", label: "文件箱", heavy: true },
      { id: "medkit", label: "药箱" },
      { id: "radio", label: "电台" },
      { id: "silver", label: "银元" },
      { id: "door", label: "门板" }
    ]
  });

  var DOOR_OPTIONAL_IDS = ["medicine", "barley", "pot", "raincloth", "shoes"];
  var ABANDON_ORDER = ["xray", "press", "files", "medkit", "radio", "silver", "door"];
  var ABANDON_HEAVY = ["xray", "press", "files"];

  function itemById(id) {
    var groups = [ITEMS.door, ITEMS.abandon];
    for (var i = 0; i < groups.length; i += 1) {
      for (var j = 0; j < groups[i].length; j += 1) {
        if (groups[i][j].id === id) return groups[i][j];
      }
    }
    return null;
  }

  function labelFor(id) {
    var item = itemById(id);
    return item ? item.label : String(id || "");
  }

  function itemIds(gameId) {
    var list = ITEMS[gameId];
    return list ? list.map(function (item) { return item.id; }) : [];
  }

  function crewForTrust(trust) {
    var value = Math.round(Number(trust));
    if (!isFinite(value)) value = 0;
    value = Math.max(0, Math.min(6, value));
    return RULES.boat.crewByTrust[Math.min(5, value)];
  }

  function usedSlots(selectedIds, hasDoor) {
    var selected = selectedIds || [];
    var used = hasDoor ? RULES.door.doorCost : 0;
    for (var i = 0; i < selected.length; i += 1) {
      var item = itemById(selected[i]);
      if (item && item.optional) used += item.slots;
    }
    return used;
  }

  function canPack(selectedIds, addId, hasDoor) {
    var item = itemById(addId);
    if (!item || !item.optional) return false;
    if ((selectedIds || []).indexOf(addId) >= 0) return true;
    return usedSlots(selectedIds, hasDoor) + item.slots <= RULES.door.capacity;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function finiteNumber(value, fallback) {
    var number = Number(value);
    return isFinite(number) ? number : fallback;
  }

  function formatClock(seconds) {
    var whole = Math.max(0, Math.ceil(seconds));
    return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
  }

  function refFor(id) {
    return { id: id, label: labelFor(id) };
  }

  function refsFor(ids) {
    return (ids || []).map(refFor);
  }

  function safeToast(callbacks, message) {
    if (!callbacks || typeof callbacks.toast !== "function") return;
    try {
      callbacks.toast(message);
    } catch (error) {
      console.error("[minigames] toast 失败", error);
    }
  }

  function emit(runtime, name, payload) {
    var callbacks = runtime.callbacks;
    if (!callbacks || typeof callbacks.onEvent !== "function") return;
    try {
      callbacks.onEvent(name, payload || {});
    } catch (error) {
      console.error("[minigames] onEvent 失败：" + name, error);
    }
  }

  function reducedMotion(runtime) {
    try {
      return !!(runtime.callbacks && runtime.callbacks.isReducedMotion && runtime.callbacks.isReducedMotion());
    } catch (error) {
      console.error("[minigames] isReducedMotion 失败", error);
      return true;
    }
  }

  function isPaused(runtime) {
    try {
      return !!(runtime.callbacks && runtime.callbacks.isPaused && runtime.callbacks.isPaused());
    } catch (error) {
      console.error("[minigames] isPaused 失败", error);
      return false;
    }
  }

  // ---------- 绘制 helper：只画共享形状，不含任何一关的规则 ----------

  function roundRect(context, x, y, width, height, radius) {
    var r = Math.min(radius || 0, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function fillRoundRect(context, x, y, width, height, radius, fill) {
    roundRect(context, x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
  }

  function strokeRoundRect(context, x, y, width, height, radius, stroke, lineWidth) {
    roundRect(context, x, y, width, height, radius);
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth || 1;
    context.stroke();
  }

  function drawText(context, text, x, y, options) {
    var opts = options || {};
    context.save();
    context.font = opts.font || "26px " + (opts.fontFamily || "serif");
    context.fillStyle = opts.fill || "#1A1714";
    context.textAlign = opts.align || "left";
    context.textBaseline = opts.baseline || "alphabetic";
    if (opts.alpha != null) context.globalAlpha = opts.alpha;
    if (opts.maxWidth) {
      context.fillText(String(text), x, y, opts.maxWidth);
    } else {
      context.fillText(String(text), x, y);
    }
    context.restore();
  }

  function drawCard(context, x, y, width, height, options) {
    var opts = options || {};
    var radius = opts.radius == null ? 4 : opts.radius;
    fillRoundRect(context, x, y, width, height, radius, opts.fill || "#F1EBDD");
    strokeRoundRect(
      context,
      x,
      y,
      width,
      height,
      radius,
      opts.stroke || "rgba(26,23,20,0.3)",
      opts.lineWidth || 1
    );
    if (opts.selected) {
      strokeRoundRect(context, x + 3, y + 3, width - 6, height - 6, radius, opts.accent || "#A8322D", 3);
    }
  }

  function drawTimerBar(context, x, y, width, height, ratio, color, track) {
    var safeRatio = clamp(ratio, 0, 1);
    fillRoundRect(context, x, y, width, height, height / 2, track || "rgba(26,23,20,0.22)");
    if (safeRatio > 0) {
      fillRoundRect(context, x, y, Math.max(height, width * safeRatio), height, height / 2, color || "#D97A2B");
    }
  }

  function drawPips(context, x, y, count, filled, gap, radius, color, empty) {
    for (var i = 0; i < count; i += 1) {
      context.beginPath();
      context.arc(x + i * (radius * 2 + gap), y, radius, 0, Math.PI * 2);
      context.fillStyle = i < filled ? color : empty;
      context.fill();
    }
  }

  function drawChain(context, x1, y1, x2, y2, color, width) {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = width || 2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.restore();
  }

  // ---------- 输入与生命周期 ----------

  function readPalette() {
    var styles = window.getComputedStyle(document.documentElement);
    var names = {
      paper: "--paper",
      paperHi: "--paper-hi",
      paperLo: "--paper-lo",
      ink: "--ink",
      inkMuted: "--ink-muted",
      cinnabar: "--cinnabar",
      ember: "--ember",
      night: "--night",
      nightDeep: "--night-deep",
      scrim: "--scrim",
      overlay: "--overlay",
      inkA12: "--ink-a12",
      inkA20: "--ink-a20",
      inkA30: "--ink-a30",
      inkA45: "--ink-a45",
      paperA72: "--paper-a72",
      fontBody: "--font-body",
      fontTitle: "--font-title",
      fontNum: "--font-num"
    };
    var palette = {};
    Object.keys(names).forEach(function (key) {
      var value = styles.getPropertyValue(names[key]).trim();
      if (!value) throw new Error("缺少设计令牌 " + names[key]);
      palette[key] = value;
    });
    return palette;
  }

  function designPoint(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (event.clientX - rect.left) * DESIGN_W / rect.width,
      y: (event.clientY - rect.top) * DESIGN_H / rect.height
    };
  }

  function applyCanvasSize(runtime) {
    var dpr = Math.min(DPR_MAX, Math.max(1, finiteNumber(window.devicePixelRatio, 1)));
    runtime.dpr = dpr;
    runtime.canvas.width = Math.round(DESIGN_W * dpr);
    runtime.canvas.height = Math.round(DESIGN_H * dpr);
    runtime.canvas.style.width = "100%";
    runtime.canvas.style.height = "100%";
    runtime.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function bind(runtime, target, type, listener, options) {
    target.addEventListener(type, listener, options);
    runtime.listeners.push([target, type, listener, options]);
  }

  function releasePointer(runtime) {
    var pointer = runtime.pointer;
    if (!pointer) return;
    try {
      if (runtime.canvas.hasPointerCapture && runtime.canvas.hasPointerCapture(pointer.id)) {
        runtime.canvas.releasePointerCapture(pointer.id);
      }
    } catch (error) {
      console.error("[minigames] 释放指针失败", error);
    }
    runtime.pointer = null;
  }

  function cleanup(runtime) {
    if (runtime.rafId) {
      window.cancelAnimationFrame(runtime.rafId);
      runtime.rafId = 0;
    }
    for (var i = 0; i < runtime.listeners.length; i += 1) {
      var entry = runtime.listeners[i];
      entry[0].removeEventListener(entry[1], entry[2], entry[3]);
    }
    runtime.listeners.length = 0;
    if (runtime.liveTimer) {
      window.clearTimeout(runtime.liveTimer);
      runtime.liveTimer = 0;
    }
    releasePointer(runtime);
  }

  function announce(runtime, message) {
    if (!runtime.live) return;
    var now = Date.now();
    var wait = LIVE_THROTTLE_MS - (now - runtime.lastLiveAt);
    if (wait <= 0) {
      // 立即播报时取消待发消息，否则旧定时器会在 500ms 后覆盖最新状态。
      if (runtime.liveTimer) {
        window.clearTimeout(runtime.liveTimer);
        runtime.liveTimer = 0;
      }
      runtime.pendingLive = "";
      runtime.live.textContent = message;
      runtime.lastLiveAt = now;
      return;
    }
    runtime.pendingLive = message;
    if (runtime.liveTimer) return;
    runtime.liveTimer = window.setTimeout(function () {
      runtime.liveTimer = 0;
      if (!runtime.live) return;
      runtime.live.textContent = runtime.pendingLive || "";
      runtime.pendingLive = "";
      runtime.lastLiveAt = Date.now();
    }, wait);
  }

  function buildResult(runtime, reason) {
    var extra;
    try {
      extra = runtime.game.end(runtime, reason) || {};
    } catch (error) {
      console.error("[minigames] end() 失败：" + runtime.gameId, error);
      extra = {};
      reason = "error";
    }
    var result = {
      gameId: runtime.gameId,
      reason: reason,
      elapsed: Math.round(clamp(runtime.elapsed, 0, RULES[runtime.gameId].duration) * 10) / 10,
      carried: Array.isArray(extra.carried) ? extra.carried : [],
      left: Array.isArray(extra.left) ? extra.left : [],
      stats: extra.stats && typeof extra.stats === "object" ? extra.stats : {}
    };
    return result;
  }

  function finish(runtime, reason) {
    if (!active || active !== runtime || runtime.ending) return;
    runtime.ending = true;
    var result = buildResult(runtime, reason);
    emit(runtime, "game:end", { gameId: runtime.gameId, reason: result.reason });
    cleanup(runtime);
    var onEnd = runtime.callbacks.onEnd;
    try {
      onEnd(result);
    } catch (error) {
      console.error("[minigames] onEnd 失败", error);
    }
    if (active === runtime) active = null;
  }

  function loop(now) {
    var runtime = active;
    if (!runtime || runtime.ending) return;
    if (isPaused(runtime)) {
      runtime.lastTs = now;
      try {
        runtime.game.draw(runtime, now);
      } catch (error) {
        console.error("[minigames] draw() 失败（暂停帧）", error);
        finish(runtime, "error");
        return;
      }
      runtime.rafId = window.requestAnimationFrame(loop);
      return;
    }
    var elapsedMs = Math.min(DT_MAX_MS, Math.max(0, now - runtime.lastTs));
    runtime.lastTs = now;
    runtime.elapsed = Math.min(RULES[runtime.gameId].duration, runtime.elapsed + elapsedMs / 1000);
    runtime.timeLeft = Math.max(0, RULES[runtime.gameId].duration - runtime.elapsed);
    try {
      runtime.game.update(runtime, elapsedMs / 1000);
    } catch (error) {
      console.error("[minigames] update() 失败：" + runtime.gameId, error);
      finish(runtime, "error");
      return;
    }
    if (runtime.ending) return;
    try {
      runtime.game.draw(runtime, now);
    } catch (error) {
      console.error("[minigames] draw() 失败：" + runtime.gameId, error);
      finish(runtime, "error");
      return;
    }
    if (runtime.timeLeft <= 0) {
      finish(runtime, "time");
      return;
    }
    runtime.rafId = window.requestAnimationFrame(loop);
  }

  function onPointerDown(runtime, event) {
    if (runtime.ending || isPaused(runtime)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    var point = designPoint(runtime.canvas, event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      runtime.canvas.focus({ preventScroll: true });
    } catch (error) {
      console.error("[minigames] 画布聚焦失败", error);
    }
    runtime.pointer = {
      id: event.pointerId,
      startX: point.x,
      startY: point.y,
      lastX: point.x,
      lastY: point.y,
      moved: false
    };
    try {
      runtime.canvas.setPointerCapture(event.pointerId);
    } catch (error) {
      console.error("[minigames] 捕获指针失败", error);
    }
    runtime.game.onPointer(runtime, { type: "down", x: point.x, y: point.y, pointerType: event.pointerType });
  }

  function onPointerMove(runtime, event) {
    if (!runtime.pointer || runtime.pointer.id !== event.pointerId || runtime.ending) return;
    var point = designPoint(runtime.canvas, event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    var pointer = runtime.pointer;
    pointer.lastX = point.x;
    pointer.lastY = point.y;
    if (Math.hypot(point.x - pointer.startX, point.y - pointer.startY) >= TAP_SLOP) {
      pointer.moved = true;
    }
    runtime.game.onPointer(runtime, { type: "move", x: point.x, y: point.y, moved: pointer.moved });
  }

  function onPointerUp(runtime, event) {
    if (!runtime.pointer || runtime.pointer.id !== event.pointerId || runtime.ending) return;
    var point = designPoint(runtime.canvas, event);
    if (!point) {
      releasePointer(runtime);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    var pointer = runtime.pointer;
    var moved = pointer.moved ||
      Math.hypot(point.x - pointer.startX, point.y - pointer.startY) >= TAP_SLOP;
    releasePointer(runtime);
    runtime.game.onPointer(runtime, {
      type: "up",
      x: point.x,
      y: point.y,
      moved: moved,
      tap: !moved
    });
  }

  function onPointerCancel(runtime, event) {
    if (!runtime.pointer || runtime.pointer.id !== event.pointerId) return;
    releasePointer(runtime);
    runtime.game.onPointer(runtime, { type: "cancel", x: 0, y: 0, moved: true, tap: false });
  }

  function onKeyDown(runtime, event) {
    if (runtime.ending) return;
    if (event.key === "Escape") return; // 交给引擎暂停
    if (isPaused(runtime)) return;
    var key = event.key;
    var confirm = key === "Enter" || key === " " || key === "Spacebar";
    var digit = /^[1-8]$/.test(key) ? Number(key) : 0;
    if (!confirm && !digit) return;
    event.preventDefault();
    event.stopPropagation();
    runtime.game.onKey(runtime, {
      key: key,
      digit: digit,
      shift: !!event.shiftKey,
      confirm: confirm
    });
  }

  function failStart(callbacks, message) {
    console.error("[minigames] " + message);
    safeToast(callbacks, message);
    return false;
  }

  var active = null;

  function start(options) {
    if (active) return failStart(options && options.callbacks, "小游戏已经在进行");
    var opts = options || {};
    var gameId = opts.gameId;
    var game = GAMES[gameId];
    if (!game) return failStart(opts.callbacks, "小游戏 id 无效：" + String(gameId));
    var canvas = opts.canvas;
    if (!canvas || typeof canvas.getContext !== "function") {
      return failStart(opts.callbacks, "小游戏画布缺失");
    }
    var callbacks = opts.callbacks || {};
    if (typeof callbacks.onEnd !== "function") {
      return failStart(callbacks, "小游戏缺少 onEnd");
    }
    var context = canvas.getContext("2d");
    if (!context) return failStart(callbacks, "小游戏画布不可用");
    var palette;
    try {
      palette = readPalette();
    } catch (error) {
      console.error("[minigames] 读取配色失败", error);
      return failStart(callbacks, "小游戏配色加载失败");
    }

    var runtime = {
      gameId: gameId,
      game: game,
      config: opts.config || {},
      canvas: canvas,
      ctx: context,
      hud: opts.hud || null,
      help: opts.help || null,
      live: opts.live || null,
      callbacks: callbacks,
      palette: palette,
      dpr: 1,
      elapsed: 0,
      timeLeft: RULES[gameId].duration,
      lastTs: window.performance.now(),
      rafId: 0,
      ending: false,
      listeners: [],
      pointer: null,
      liveTimer: 0,
      pendingLive: "",
      lastLiveAt: -Infinity,
      state: {},
      initial: opts.initial || {},
      lastNow: 0
    };
    active = runtime;
    try {
      applyCanvasSize(runtime);
      game.init(runtime);
    } catch (error) {
      console.error("[minigames] init() 失败：" + gameId, error);
      cleanup(runtime);
      active = null;
      safeToast(callbacks, "小游戏初始化失败");
      return false;
    }
    // init 内可能直接结束（例如 ?lights=22）。此时 onEnd 已结算，
    // 不再绑定监听、聚焦或排帧，避免留下只挂不用的画布监听。
    if (runtime.ending || active !== runtime) return true;

    canvas.tabIndex = 0;
    bind(runtime, canvas, "pointerdown", function (event) { onPointerDown(runtime, event); });
    bind(runtime, canvas, "pointermove", function (event) { onPointerMove(runtime, event); });
    bind(runtime, canvas, "pointerup", function (event) { onPointerUp(runtime, event); });
    bind(runtime, canvas, "pointercancel", function (event) { onPointerCancel(runtime, event); });
    bind(runtime, canvas, "keydown", function (event) { onKeyDown(runtime, event); });
    try {
      canvas.focus({ preventScroll: true });
    } catch (error) {
      console.error("[minigames] 起始聚焦失败", error);
    }
    emit(runtime, "game:start", { gameId: gameId });
    runtime.rafId = window.requestAnimationFrame(loop);
    return true;
  }

  function stop() {
    if (!active) return;
    var runtime = active;
    runtime.ending = true;
    cleanup(runtime);
    active = null;
  }

  function isActive() {
    return !!(active && !active.ending);
  }

  function resize() {
    if (!active) return;
    applyCanvasSize(active);
  }

  // ---------- 四关：普通对象，各自 init / update / draw / onPointer / onKey / end ----------

  var GAMES = {};

  var DOOR_BAG = { x: 120, y: 110, w: 820, h: 380 };
  var DOOR_SHELF = { x: 80, y: 530, w: 880, h: 140 };
  var DOOR_BUTTON = { x: 1000, y: 540, w: 200, h: 96 };
  var DOOR_GRID = { pad: 16, gap: 16, cols: 3, rows: 2 };

  function doorCellSize() {
    var width = (DOOR_BAG.w - DOOR_GRID.pad * 2 - DOOR_GRID.gap * (DOOR_GRID.cols - 1)) / DOOR_GRID.cols;
    var height = (DOOR_BAG.h - DOOR_GRID.pad * 2 - DOOR_GRID.gap * (DOOR_GRID.rows - 1)) / DOOR_GRID.rows;
    return { w: width, h: height };
  }

  function doorCellRect(col, row, spanCols, spanRows) {
    var cell = doorCellSize();
    var cols = spanCols || 1;
    var rows = spanRows || 1;
    return {
      x: DOOR_BAG.x + DOOR_GRID.pad + col * (cell.w + DOOR_GRID.gap),
      y: DOOR_BAG.y + DOOR_GRID.pad + row * (cell.h + DOOR_GRID.gap),
      w: cell.w * cols + DOOR_GRID.gap * (cols - 1),
      h: cell.h * rows + DOOR_GRID.gap * (rows - 1)
    };
  }

  function doorLayout(selected, hasDoor) {
    var occupied = [false, false, false, false, false, false];
    var layout = {};
    function occupy(id, col, row, w, h) {
      for (var r = row; r < row + h; r += 1) {
        for (var c = col; c < col + w; c += 1) occupied[r * 3 + c] = true;
      }
      layout[id] = { col: col, row: row, w: w, h: h };
    }
    if (selected.indexOf("pot") >= 0) occupy("pot", 2, 0, 1, 2);
    if (hasDoor) occupy("door", 0, 0, 2, 1);
    for (var i = 0; i < DOOR_OPTIONAL_IDS.length; i += 1) {
      var id = DOOR_OPTIONAL_IDS[i];
      if (id === "pot" || selected.indexOf(id) < 0) continue;
      for (var index = 0; index < 6; index += 1) {
        if (!occupied[index]) {
          var col = index % 3;
          var row = Math.floor(index / 3);
          occupy(id, col, row, 1, 1);
          break;
        }
      }
    }
    return layout;
  }

  function doorRectFor(layout, id) {
    var slot = layout[id];
    if (!slot) return null;
    return doorCellRect(slot.col, slot.row, slot.w, slot.h);
  }

  function doorShelfCardRect(index) {
    var gap = 12;
    var width = (DOOR_SHELF.w - gap * 4) / 5;
    return {
      x: DOOR_SHELF.x + index * (width + gap),
      y: DOOR_SHELF.y,
      w: width,
      h: DOOR_SHELF.h
    };
  }

  function pointInRect(x, y, rect) {
    return !!rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function doorHitShelf(x, y) {
    for (var i = 0; i < DOOR_OPTIONAL_IDS.length; i += 1) {
      if (pointInRect(x, y, doorShelfCardRect(i))) return DOOR_OPTIONAL_IDS[i];
    }
    return null;
  }

  function doorHitBag(runtime, x, y) {
    var state = runtime.state;
    if (!state) return null;
    var layout = doorLayout(state.selected, state.hasDoor);
    var ids = Object.keys(layout);
    for (var i = ids.length - 1; i >= 0; i -= 1) {
      if (pointInRect(x, y, doorRectFor(layout, ids[i]))) return ids[i];
    }
    return null;
  }

  function doorState(runtime) {
    return runtime.state;
  }

  function doorHas(runtime, id) {
    return doorState(runtime).selected.indexOf(id) >= 0;
  }

  function doorStatus(runtime) {
    var state = doorState(runtime);
    return "行囊 " + usedSlots(state.selected, state.hasDoor) + "/6 格。";
  }

  function doorSay(runtime, message) {
    var state = doorState(runtime);
    state.message = message;
    state.messageTtl = 1.8;
    announce(runtime, message + " " + doorStatus(runtime));
  }

  function doorAdd(runtime, id) {
    var state = doorState(runtime);
    if (doorHas(runtime, id)) return false;
    if (!canPack(state.selected, id, state.hasDoor)) {
      doorSay(runtime, "放不下：行囊只有 6 格");
      state.flashId = id;
      state.flashTtl = 0.7;
      return false;
    }
    state.selected.push(id);
    emit(runtime, "door:pack", { id: id });
    doorSay(runtime, "装入「" + labelFor(id) + "」");
    return true;
  }

  function doorRemove(runtime, id) {
    var state = doorState(runtime);
    var index = state.selected.indexOf(id);
    if (index < 0) return false;
    state.selected.splice(index, 1);
    emit(runtime, "door:unpack", { id: id });
    doorSay(runtime, "取出「" + labelFor(id) + "」");
    return true;
  }

  function doorToggle(runtime, id) {
    if (doorHas(runtime, id)) doorRemove(runtime, id);
    else doorAdd(runtime, id);
  }

  function doorEnd(runtime) {
    finish(runtime, "done");
  }

  function doorDrawItem(context, palette, rect, id, selected) {
    var item = itemById(id);
    var label = item ? item.label : labelFor(id);
    if (id === "door") {
      fillRoundRect(context, rect.x, rect.y, rect.w, rect.h, 3, palette.inkMuted);
      context.save();
      context.strokeStyle = palette.paperLo;
      context.lineWidth = 1;
      for (var x = rect.x + 22; x < rect.x + rect.w - 10; x += 28) {
        context.beginPath();
        context.moveTo(x, rect.y + 8);
        context.lineTo(x + 6, rect.y + rect.h - 8);
        context.stroke();
      }
      context.restore();
      drawText(context, "门板", rect.x + rect.w / 2, rect.y + rect.h / 2 - 2, {
        font: "28px " + palette.fontTitle,
        fill: palette.paperHi,
        align: "center",
        baseline: "middle"
      });
      drawText(context, "2 格 · 不能丢", rect.x + rect.w / 2, rect.y + rect.h / 2 + 30, {
        font: "20px " + palette.fontBody,
        fill: palette.paperLo,
        align: "center",
        baseline: "middle"
      });
      return;
    }
    drawCard(context, rect.x, rect.y, rect.w, rect.h, {
      fill: selected ? palette.paperHi : palette.paper,
      stroke: selected ? palette.cinnabar : palette.inkA30,
      lineWidth: selected ? 3 : 1,
      selected: false
    });
    var centerX = rect.x + rect.w / 2;
    var centerY = rect.y + rect.h / 2;
    drawText(context, label, centerX, centerY - 10, {
      font: "30px " + palette.fontBody,
      fill: palette.ink,
      align: "center",
      baseline: "middle",
      maxWidth: rect.w - 20
    });
    var cost = item && item.slots ? item.slots + " 格" : "随身";
    drawText(context, cost, centerX, centerY + 28, {
      font: "20px " + palette.fontNum,
      fill: palette.inkMuted,
      align: "center",
      baseline: "middle"
    });
  }

  function drawDoorBackdrop(runtime) {
    var context = runtime.ctx;
    var palette = runtime.palette;
    var gradient = context.createLinearGradient(0, 0, 0, DESIGN_H);
    gradient.addColorStop(0, palette.nightDeep);
    gradient.addColorStop(0.55, palette.night);
    gradient.addColorStop(1, palette.nightDeep);
    context.fillStyle = gradient;
    context.fillRect(0, 0, DESIGN_W, DESIGN_H);
    context.save();
    context.globalAlpha = 0.45;
    context.fillStyle = palette.paperA72;
    context.beginPath();
    context.arc(1100, 116, 54, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = palette.inkA45;
    context.beginPath();
    context.moveTo(0, 470);
    context.lineTo(190, 360);
    context.lineTo(340, 450);
    context.lineTo(520, 330);
    context.lineTo(700, 440);
    context.lineTo(900, 350);
    context.lineTo(1100, 430);
    context.lineTo(1280, 370);
    context.lineTo(1280, 720);
    context.lineTo(0, 720);
    context.closePath();
    context.fill();
    context.restore();
  }

  var doorGame = {
    init: function (runtime) {
      runtime.state.selected = [];
      runtime.state.hasDoor = runtime.initial.hasDoor !== false;
      runtime.state.drag = null;
      runtime.state.message = "";
      runtime.state.messageTtl = 0;
      runtime.state.flashId = null;
      runtime.state.flashTtl = 0;
      runtime.state.pulse = 0;
      runtime.state.pressedBag = null;
    },

    update: function (runtime, dt) {
      var state = runtime.state;
      state.pulse += dt;
      if (state.messageTtl > 0) state.messageTtl = Math.max(0, state.messageTtl - dt);
      if (state.flashTtl > 0) state.flashTtl = Math.max(0, state.flashTtl - dt);
      runtime.lastNow = window.performance.now();
    },

    draw: function (runtime) {
      var context = runtime.ctx;
      var palette = runtime.palette;
      var state = runtime.state;
      var layout = doorLayout(state.selected, state.hasDoor);
      var used = usedSlots(state.selected, state.hasDoor);
      var capacity = RULES.door.capacity;
      var reduced = reducedMotion(runtime);

      drawDoorBackdrop(runtime);

      drawText(context, "行囊", 120, 52, {
        font: "46px " + palette.fontTitle,
        fill: palette.paperHi
      });
      drawText(context, "一块门板，几件家当。带不走的，留在家里。", 122, 80, {
        font: "22px " + palette.fontBody,
        fill: palette.paperA72
      });

      // 行囊面板
      context.save();
      context.globalAlpha = 0.96;
      fillRoundRect(context, DOOR_BAG.x - 16, DOOR_BAG.y - 16, DOOR_BAG.w + 32, DOOR_BAG.h + 32, 6, palette.paper);
      context.restore();
      strokeRoundRect(context, DOOR_BAG.x - 16, DOOR_BAG.y - 16, DOOR_BAG.w + 32, DOOR_BAG.h + 32, 6, palette.inkA30, 1);
      drawText(context, "行囊 " + used + "/" + capacity + " 格", 1136, 80, {
        font: "20px " + palette.fontNum,
        fill: palette.paperHi,
        align: "right"
      });

      // 空格子
      for (var row = 0; row < DOOR_GRID.rows; row += 1) {
        for (var col = 0; col < DOOR_GRID.cols; col += 1) {
          var cell = doorCellRect(col, row, 1, 1);
          fillRoundRect(context, cell.x, cell.y, cell.w, cell.h, 3, palette.inkA12);
          strokeRoundRect(context, cell.x, cell.y, cell.w, cell.h, 3, palette.inkA20, 1);
        }
      }

      Object.keys(layout).forEach(function (id) {
        var rect = doorRectFor(layout, id);
        if (!rect) return;
        if (state.flashId === id && state.flashTtl > 0 && !reduced) {
          context.save();
          context.globalAlpha = 0.4 + 0.3 * Math.sin(state.flashTtl * 20);
          fillRoundRect(context, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 4, palette.cinnabar);
          context.restore();
        }
        doorDrawItem(context, palette, rect, id, true);
      });

      // 货架
      drawText(context, "家里带来的", DOOR_SHELF.x, DOOR_SHELF.y - 16, {
        font: "24px " + palette.fontBody,
        fill: palette.paperHi
      });
      for (var i = 0; i < DOOR_OPTIONAL_IDS.length; i += 1) {
        var id = DOOR_OPTIONAL_IDS[i];
        var rect = doorShelfCardRect(i);
        var picked = doorHas(runtime, id);
        drawCard(context, rect.x, rect.y, rect.w, rect.h, {
          fill: picked ? palette.paperHi : palette.paper,
          stroke: picked ? palette.cinnabar : palette.inkA20,
          lineWidth: picked ? 3 : 1
        });
        var item = itemById(id);
        drawText(context, String(i + 1), rect.x + 12, rect.y + 25, {
          font: "18px " + palette.fontNum,
          fill: palette.inkMuted
        });
        drawText(context, item.label, rect.x + rect.w / 2, rect.y + rect.h / 2 - 6, {
          font: "27px " + palette.fontBody,
          fill: palette.ink,
          align: "center",
          baseline: "middle",
          maxWidth: rect.w - 18
        });
        drawText(context, item.slots + " 格", rect.x + rect.w / 2, rect.y + rect.h / 2 + 28, {
          font: "19px " + palette.fontNum,
          fill: palette.inkMuted,
          align: "center",
          baseline: "middle"
        });
        if (picked) {
          drawText(context, "已装", rect.x + rect.w - 12, rect.y + 25, {
            font: "18px " + palette.fontBody,
            fill: palette.cinnabar,
            align: "right"
          });
        }
      }

      // 按钮
      var buttonFill = state.drag ? palette.cinnabar : palette.ember;
      fillRoundRect(context, DOOR_BUTTON.x, DOOR_BUTTON.y, DOOR_BUTTON.w, DOOR_BUTTON.h, 4, buttonFill);
      strokeRoundRect(context, DOOR_BUTTON.x, DOOR_BUTTON.y, DOOR_BUTTON.w, DOOR_BUTTON.h, 4, palette.paperHi, 1);
      drawText(context, "系好行囊", DOOR_BUTTON.x + DOOR_BUTTON.w / 2, DOOR_BUTTON.y + DOOR_BUTTON.h / 2 - 2, {
        font: "28px " + palette.fontTitle,
        fill: palette.paperHi,
        align: "center",
        baseline: "middle"
      });
      drawText(context, "空格 / Enter", DOOR_BUTTON.x + DOOR_BUTTON.w / 2, DOOR_BUTTON.y + DOOR_BUTTON.h + 22, {
        font: "18px " + palette.fontBody,
        fill: palette.paperA72,
        align: "center"
      });

      // 计时
      var ratio = runtime.timeLeft / RULES.door.duration;
      var warn = runtime.timeLeft <= RULES.door.warnAt;
      var timerColor = warn ? palette.cinnabar : palette.paperHi;
      var pulse = warn && !reduced ? 0.55 + 0.45 * Math.abs(Math.sin(state.pulse * 3.2)) : 1;
      context.save();
      context.globalAlpha = pulse;
      drawTimerBar(context, 900, 30, 220, 12, ratio, timerColor, palette.inkA30);
      context.restore();
      drawText(context, formatClock(runtime.timeLeft), 1136, 42, {
        font: "24px " + palette.fontNum,
        fill: timerColor,
        align: "right",
        baseline: "middle"
      });

      if (state.messageTtl > 0) {
        drawText(context, state.message, 120, 620, {
          font: "22px " + palette.fontBody,
          fill: palette.ember,
          maxWidth: 980
        });
      }
      drawText(context, "点选或拖到行囊；再点一次取出。", 120, 690, {
        font: "20px " + palette.fontBody,
        fill: palette.paperA72
      });

      if (state.drag) {
        var dragRect = { x: state.drag.x - 82, y: state.drag.y - 70, w: 164, h: 140 };
        context.save();
        context.globalAlpha = 0.88;
        drawCard(context, dragRect.x, dragRect.y, dragRect.w, dragRect.h, {
          fill: palette.paperHi,
          stroke: palette.cinnabar,
          lineWidth: 3
        });
        doorDrawItem(context, palette, dragRect, state.drag.id, true);
        context.restore();
      }
    },

    onPointer: function (runtime, event) {
      var state = runtime.state;
      if (event.type === "down") {
        var shelfId = doorHitShelf(event.x, event.y);
        if (shelfId) {
          state.drag = { id: shelfId, x: event.x, y: event.y };
        }
        state.pressedBag = doorHitBag(runtime, event.x, event.y);
        return;
      }
      if (event.type === "move") {
        if (state.drag) {
          state.drag.x = event.x;
          state.drag.y = event.y;
        }
        return;
      }
      if (event.type === "cancel") {
        state.drag = null;
        state.pressedBag = null;
        return;
      }
      if (event.type !== "up") return;
      if (state.drag) {
        var dragged = state.drag;
        state.drag = null;
        var insideBag = pointInRect(event.x, event.y, DOOR_BAG);
        if (insideBag) {
          if (dragged.id === "pot" && !doorHas(runtime, "pot")) {
            doorAdd(runtime, "pot");
          } else if (!doorHas(runtime, dragged.id)) {
            doorAdd(runtime, dragged.id);
          }
        } else if (!event.moved) {
          doorToggle(runtime, dragged.id);
        }
        state.pressedBag = null;
        return;
      }
      if (!event.tap) return;
      if (pointInRect(event.x, event.y, DOOR_BUTTON)) {
        doorEnd(runtime);
        return;
      }
      var shelf = doorHitShelf(event.x, event.y);
      if (shelf) {
        doorToggle(runtime, shelf);
        return;
      }
      var bagId = doorHitBag(runtime, event.x, event.y);
      if (bagId) {
        if (bagId === "door") doorSay(runtime, "门板不能丢。");
        else doorRemove(runtime, bagId);
      }
      state.pressedBag = null;
    },

    onKey: function (runtime, event) {
      if (event.confirm) {
        doorEnd(runtime);
        return;
      }
      if (event.digit >= 1 && event.digit <= DOOR_OPTIONAL_IDS.length) {
        doorToggle(runtime, DOOR_OPTIONAL_IDS[event.digit - 1]);
      }
    },

    end: function (runtime) {
      var state = runtime.state;
      var selected = DOOR_OPTIONAL_IDS.filter(function (id) { return doorHas(runtime, id); });
      var left = DOOR_OPTIONAL_IDS.filter(function (id) { return !doorHas(runtime, id); });
      var carried = [];
      if (state.hasDoor) carried.push(refFor("door"));
      selected.forEach(function (id) { carried.push(refFor(id)); });
      return {
        carried: carried,
        left: refsFor(left),
        stats: {
          capacity: RULES.door.capacity,
          used: usedSlots(state.selected, state.hasDoor),
          door: state.hasDoor
        }
      };
    }
  };

  GAMES.door = doorGame;

  var ABANDON_CARD = { w: 150, h: 180, gap: 10, x: 80, y: 180 };
  var ABANDON_SLOTS = { x: 200, y: 510, w: 180, h: 96, gap: 20 };
  var ABANDON_BUTTON = { x: 900, y: 540, w: 200, h: 96 };

  function abandonCardRect(index) {
    return {
      x: ABANDON_CARD.x + index * (ABANDON_CARD.w + ABANDON_CARD.gap),
      y: ABANDON_CARD.y,
      w: ABANDON_CARD.w,
      h: ABANDON_CARD.h
    };
  }

  function abandonSlotRect(index) {
    return {
      x: ABANDON_SLOTS.x + index * (ABANDON_SLOTS.w + ABANDON_SLOTS.gap),
      y: ABANDON_SLOTS.y,
      w: ABANDON_SLOTS.w,
      h: ABANDON_SLOTS.h
    };
  }

  function abandonState(runtime) {
    return runtime.state;
  }

  function abandonAvailable(runtime) {
    var state = abandonState(runtime);
    return state.items.filter(function (id) { return state.shipped.indexOf(id) < 0; });
  }

  function abandonHeavyCount(ids) {
    return ids.filter(function (id) { return ABANDON_HEAVY.indexOf(id) >= 0; }).length;
  }

  function abandonStatus(runtime) {
    var state = abandonState(runtime);
    var enemy = state.enemyLeft == null ? "追兵未至" : "追兵 " + Math.max(0, Math.ceil(state.enemyLeft)) + " 秒";
    var batch = state.batchIndex >= RULES.abandon.batches ? "两批已发" : "第 " + (state.batchIndex + 1) + " 批";
    return batch + "，本船 " + state.aboard.length + "/3 件，" + enemy + "。";
  }

  function abandonSay(runtime, message) {
    var state = abandonState(runtime);
    state.message = message;
    state.messageTtl = 1.8;
    announce(runtime, message + " " + abandonStatus(runtime));
  }

  function abandonToggle(runtime, id) {
    var state = abandonState(runtime);
    if (state.shipped.indexOf(id) >= 0) return;
    var aboardIndex = state.aboard.indexOf(id);
    if (aboardIndex >= 0) {
      state.aboard.splice(aboardIndex, 1);
      abandonSay(runtime, "留在岸上：" + labelFor(id));
      return;
    }
    if (state.aboard.length >= RULES.abandon.quota) {
      abandonSay(runtime, "这一船最多装 3 件");
      return;
    }
    state.aboard.push(id);
    abandonSay(runtime, "带上船：" + labelFor(id));
  }

  function abandonDispatch(runtime) {
    var state = abandonState(runtime);
    if (state.batchIndex >= RULES.abandon.batches) return;
    if (!state.aboard.length) {
      abandonSay(runtime, "先装一件，再发船");
      return;
    }
    var heavy = abandonHeavyCount(state.aboard);
    var ids = state.aboard.slice();
    state.shipped = state.shipped.concat(ids);
    state.aboard = [];
    state.batchIndex += 1;
    emit(runtime, "abandon:dispatch", { batch: state.batchIndex, ids: ids });
    if (state.batchIndex === 1) {
      state.enemyLeft = Math.max(0, RULES.abandon.enemy - heavy * RULES.abandon.heavyPenalty);
      abandonSay(runtime, "第一批离岸。追兵提前了。");
      if (state.enemyLeft <= 0) finish(runtime, "time");
      return;
    }
    state.enemyLeft = Math.max(0, (state.enemyLeft == null ? RULES.abandon.enemy : state.enemyLeft) - heavy * RULES.abandon.heavyPenalty);
    abandonSay(runtime, "第二批离岸。");
    if (state.enemyLeft <= 0) finish(runtime, "time");
    else finish(runtime, "done");
  }

  function abandonHitCard(runtime, x, y) {
    var available = abandonAvailable(runtime);
    for (var i = 0; i < available.length; i += 1) {
      if (pointInRect(x, y, abandonCardRect(i))) return available[i];
    }
    return null;
  }

  function abandonHitSlot(runtime, x, y) {
    var state = abandonState(runtime);
    for (var i = 0; i < state.aboard.length; i += 1) {
      if (pointInRect(x, y, abandonSlotRect(i))) return state.aboard[i];
    }
    return null;
  }

  function drawAbandonBackdrop(runtime) {
    var context = runtime.ctx;
    var palette = runtime.palette;
    var gradient = context.createLinearGradient(0, 0, 0, DESIGN_H);
    gradient.addColorStop(0, palette.nightDeep);
    gradient.addColorStop(0.6, palette.night);
    gradient.addColorStop(1, palette.nightDeep);
    context.fillStyle = gradient;
    context.fillRect(0, 0, DESIGN_W, DESIGN_H);
    context.save();
    context.globalAlpha = 0.5;
    context.fillStyle = palette.ember;
    context.beginPath();
    context.arc(1190, 160, 28, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.18;
    context.beginPath();
    context.arc(1190, 160, 72, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.save();
    context.strokeStyle = palette.inkA30;
    context.lineWidth = 2;
    for (var i = 0; i < 6; i += 1) {
      var y = 470 + i * 26;
      context.beginPath();
      context.moveTo(0, y);
      context.quadraticCurveTo(320, y - 10, 640, y + 2);
      context.quadraticCurveTo(960, y + 12, 1280, y - 4);
      context.stroke();
    }
    context.restore();
    context.save();
    context.fillStyle = palette.ink;
    context.beginPath();
    context.moveTo(120, 620);
    context.lineTo(860, 620);
    context.lineTo(800, 660);
    context.lineTo(180, 660);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawAbandonCard(context, palette, rect, id, selected, flash, index) {
    var heavy = ABANDON_HEAVY.indexOf(id) >= 0;
    drawCard(context, rect.x, rect.y, rect.w, rect.h, {
      fill: selected ? palette.paperHi : palette.paper,
      stroke: selected ? palette.cinnabar : (flash ? palette.ember : palette.inkA20),
      lineWidth: selected || flash ? 3 : 1
    });
    var lines = id === "xray" ? ["三百斤的", "箱子"] : [labelFor(id)];
    var lineY = rect.y + rect.h / 2 - (lines.length - 1) * 16 - (heavy ? 8 : 0);
    for (var i = 0; i < lines.length; i += 1) {
      drawText(context, lines[i], rect.x + rect.w / 2, lineY + i * 32, {
        font: "24px " + palette.fontBody,
        fill: palette.ink,
        align: "center",
        baseline: "middle",
        maxWidth: rect.w - 12
      });
    }
    if (heavy) {
      drawText(context, "重物 · 追兵 −8s", rect.x + rect.w / 2, rect.y + rect.h - 34, {
        font: "18px " + palette.fontBody,
        fill: palette.cinnabar,
        align: "center",
        baseline: "middle"
      });
    }
    if (selected) {
      drawText(context, "已上船", rect.x + rect.w / 2, rect.y + 26, {
        font: "20px " + palette.fontBody,
        fill: palette.cinnabar,
        align: "center",
        baseline: "middle"
      });
    }
    drawText(context, String(index + 1), rect.x + 10, rect.y + 22, {
      font: "18px " + palette.fontNum,
      fill: palette.inkMuted
    });
  }

  var abandonGame = {
    init: function (runtime) {
      var state = runtime.state;
      state.hasDoor = runtime.initial.hasDoor !== false;
      state.items = ABANDON_ORDER.filter(function (id) { return id !== "door" || state.hasDoor; });
      state.aboard = [];
      state.shipped = [];
      state.batchIndex = 0;
      state.enemyLeft = null;
      state.message = "";
      state.messageTtl = 0;
      state.flashId = null;
      state.flashTtl = 0;
      state.pulse = 0;
    },

    update: function (runtime, dt) {
      var state = runtime.state;
      state.pulse += dt;
      if (state.messageTtl > 0) state.messageTtl = Math.max(0, state.messageTtl - dt);
      if (state.flashTtl > 0) state.flashTtl = Math.max(0, state.flashTtl - dt);
      if (state.enemyLeft != null && state.batchIndex === 1) {
        state.enemyLeft = Math.max(0, state.enemyLeft - dt);
        if (state.enemyLeft <= 0) {
          finish(runtime, "time");
          return;
        }
      }
    },

    draw: function (runtime) {
      var context = runtime.ctx;
      var palette = runtime.palette;
      var state = runtime.state;
      var available = abandonAvailable(runtime);
      var reduced = reducedMotion(runtime);
      drawAbandonBackdrop(runtime);

      drawText(context, "弃物", 80, 52, {
        font: "46px " + palette.fontTitle,
        fill: palette.paperHi
      });
      drawText(context, "江那边，追兵的火光。带不走的，就留在这里。", 82, 82, {
        font: "22px " + palette.fontBody,
        fill: palette.paperA72
      });

      var timerColor = runtime.timeLeft <= 10 ? palette.cinnabar : palette.paperHi;
      drawTimerBar(context, 900, 30, 220, 12, runtime.timeLeft / RULES.abandon.duration, timerColor, palette.inkA30);
      drawText(context, formatClock(runtime.timeLeft), 1136, 42, {
        font: "24px " + palette.fontNum,
        fill: timerColor,
        align: "right",
        baseline: "middle"
      });

      var enemyText = state.enemyLeft == null ? "追兵未至" : "追兵 " + formatClock(state.enemyLeft);
      var enemyColor = state.enemyLeft != null && state.enemyLeft <= 10 ? palette.ember : palette.paperA72;
      drawText(context, enemyText, 960, 148, {
        font: "24px " + palette.fontNum,
        fill: enemyColor,
        align: "right",
        baseline: "middle"
      });

      var batchLabel = state.batchIndex === 0 ? "第一批" : (state.batchIndex === 1 ? "第二批" : "两批已发");
      drawText(context, batchLabel + " · 本船 " + state.aboard.length + "/" + RULES.abandon.quota, 80, 146, {
        font: "24px " + palette.fontBody,
        fill: palette.paperHi
      });

      if (!available.length) {
        drawText(context, "江岸空了。", 80, 300, {
          font: "30px " + palette.fontBody,
          fill: palette.paperA72
        });
      }
      for (var i = 0; i < available.length; i += 1) {
        var id = available[i];
        var rect = abandonCardRect(i);
        var selected = state.aboard.indexOf(id) >= 0;
        var flash = state.flashId === id && state.flashTtl > 0 && !reduced;
        drawAbandonCard(context, palette, rect, id, selected, flash, i);
      }

      // 船与三个位置
      drawText(context, "这一船", 200, 496, {
        font: "22px " + palette.fontBody,
        fill: palette.paperA72
      });
      for (var slot = 0; slot < RULES.abandon.quota; slot += 1) {
        var slotRect = abandonSlotRect(slot);
        fillRoundRect(context, slotRect.x, slotRect.y, slotRect.w, slotRect.h, 3, palette.inkA20);
        strokeRoundRect(context, slotRect.x, slotRect.y, slotRect.w, slotRect.h, 3, palette.paperA72, 1);
        if (state.aboard[slot]) {
          drawText(context, labelFor(state.aboard[slot]), slotRect.x + slotRect.w / 2, slotRect.y + slotRect.h / 2, {
            font: "22px " + palette.fontBody,
            fill: palette.paperHi,
            align: "center",
            baseline: "middle",
            maxWidth: slotRect.w - 12
          });
        } else {
          drawText(context, "空", slotRect.x + slotRect.w / 2, slotRect.y + slotRect.h / 2, {
            font: "22px " + palette.fontBody,
            fill: palette.paperA72,
            align: "center",
            baseline: "middle"
          });
        }
      }

      var buttonFill = state.batchIndex >= RULES.abandon.batches ? palette.inkMuted : palette.ember;
      fillRoundRect(context, ABANDON_BUTTON.x, ABANDON_BUTTON.y, ABANDON_BUTTON.w, ABANDON_BUTTON.h, 4, buttonFill);
      strokeRoundRect(context, ABANDON_BUTTON.x, ABANDON_BUTTON.y, ABANDON_BUTTON.w, ABANDON_BUTTON.h, 4, palette.paperHi, 1);
      drawText(context, state.batchIndex === 0 ? "发第一船" : "发第二船", ABANDON_BUTTON.x + ABANDON_BUTTON.w / 2, ABANDON_BUTTON.y + ABANDON_BUTTON.h / 2 - 2, {
        font: "28px " + palette.fontTitle,
        fill: palette.paperHi,
        align: "center",
        baseline: "middle"
      });
      drawText(context, "空格 / Enter", ABANDON_BUTTON.x + ABANDON_BUTTON.w / 2, ABANDON_BUTTON.y + ABANDON_BUTTON.h + 22, {
        font: "18px " + palette.fontBody,
        fill: palette.paperA72,
        align: "center"
      });

      if (state.messageTtl > 0) {
        drawText(context, state.message, 80, 700, {
          font: "22px " + palette.fontBody,
          fill: palette.ember,
          maxWidth: 800
        });
      } else {
        drawText(context, "点卡选择；每船最多 3 件；重物会让追兵更早到。", 80, 700, {
          font: "20px " + palette.fontBody,
          fill: palette.paperA72,
          maxWidth: 1000
        });
      }
    },

    onPointer: function (runtime, event) {
      if (event.type !== "up" || !event.tap) return;
      if (pointInRect(event.x, event.y, ABANDON_BUTTON)) {
        abandonDispatch(runtime);
        return;
      }
      var slotId = abandonHitSlot(runtime, event.x, event.y);
      if (slotId) {
        abandonToggle(runtime, slotId);
        return;
      }
      var cardId = abandonHitCard(runtime, event.x, event.y);
      if (cardId) abandonToggle(runtime, cardId);
    },

    onKey: function (runtime, event) {
      if (event.confirm) {
        abandonDispatch(runtime);
        return;
      }
      var available = abandonAvailable(runtime);
      if (event.digit >= 1 && event.digit <= available.length) {
        abandonToggle(runtime, available[event.digit - 1]);
      }
    },

    end: function (runtime) {
      var state = runtime.state;
      var carried = state.shipped.slice();
      var left = state.items.filter(function (id) { return state.shipped.indexOf(id) < 0; });
      return {
        carried: refsFor(carried),
        left: refsFor(left),
        stats: {
          batches: state.batchIndex,
          heavyCarried: abandonHeavyCount(state.shipped),
          enemyRemaining: state.enemyLeft == null ? RULES.abandon.enemy : Math.max(0, Math.round(state.enemyLeft))
        }
      };
    }
  };

  GAMES.abandon = abandonGame;

  var BOAT_CARD = { x: 80, y: 160, w: 340, h: 170, gapX: 20, gapY: 20 };

  function boatCardRect(index) {
    var col = index % 3;
    var row = Math.floor(index / 3);
    return {
      x: BOAT_CARD.x + col * (BOAT_CARD.w + BOAT_CARD.gapX),
      y: BOAT_CARD.y + row * (BOAT_CARD.h + BOAT_CARD.gapY),
      w: BOAT_CARD.w,
      h: BOAT_CARD.h
    };
  }

  function boatRestRect(index) {
    var card = boatCardRect(index);
    return { x: card.x + card.w - 108, y: card.y + card.h - 108, w: 96, h: 96 };
  }

  function boatState(runtime) {
    return runtime.state;
  }

  function boatOutboundSeconds(runtime, fatigue) {
    var base = Math.max(
      RULES.boat.tripMin,
      RULES.boat.outbound - Math.floor(runtime.state.crew / RULES.boat.crewStep)
    );
    return base + (fatigue >= RULES.boat.fatigueSoft ? 4 : 0);
  }

  function boatStatus(runtime) {
    var state = boatState(runtime);
    var top = 0;
    for (var i = 0; i < state.boats.length; i += 1) top = Math.max(top, state.boats[i].fatigue);
    return "已渡 " + state.trips + "/18 趟，船工 " + state.crew + " 人，可用船 " + state.available + " 条，最高疲劳 " + top + "。";
  }

  function boatSay(runtime, message) {
    var state = boatState(runtime);
    state.message = message;
    state.messageTtl = 1.8;
    announce(runtime, message + " " + boatStatus(runtime));
  }

  function boatStart(runtime, index) {
    var state = boatState(runtime);
    var boat = state.boats[index];
    if (!boat || !boat.enabled) {
      boatSay(runtime, "船工不够，这条船动不了");
      return;
    }
    if (boat.status !== "dock") {
      if (boat.status === "rest") boatSay(runtime, "这条船在歇");
      else boatSay(runtime, "这条船还在江上");
      return;
    }
    if (boat.fatigue >= RULES.boat.fatigueHard) {
      boatSay(runtime, "船工透支，先歇");
      return;
    }
    boat.status = "out";
    boat.timer = boatOutboundSeconds(runtime, boat.fatigue);
    emit(runtime, "boat:depart", { boat: index + 1 });
    boatSay(runtime, "第 " + (index + 1) + " 条船出程");
  }

  function boatRest(runtime, index) {
    var state = boatState(runtime);
    var boat = state.boats[index];
    if (!boat || !boat.enabled) {
      boatSay(runtime, "船工不够，这条船动不了");
      return;
    }
    if (boat.status !== "dock") {
      boatSay(runtime, "只能让靠岸的船歇");
      return;
    }
    boat.status = "rest";
    boat.timer = RULES.boat.rest;
    emit(runtime, "boat:rest", { boat: index + 1 });
    boatSay(runtime, "第 " + (index + 1) + " 条船歇一歇");
  }

  function boatArrive(runtime, boat) {
    var state = boatState(runtime);
    state.trips += 1;
    boat.fatigue = Math.min(RULES.boat.fatigueHard, boat.fatigue + RULES.boat.fatiguePerLeg);
    emit(runtime, "boat:return", { boat: boat.id });
    if (state.trips >= RULES.boat.plannedTrips) {
      finish(runtime, "done");
      return;
    }
    boat.status = "back";
    boat.timer = RULES.boat.inbound;
    boatSay(runtime, "已渡 " + state.trips + "/" + RULES.boat.plannedTrips + " 趟");
  }

  function boatDock(runtime, boat) {
    boat.fatigue = Math.min(RULES.boat.fatigueHard, boat.fatigue + RULES.boat.fatiguePerLeg);
    boat.status = "dock";
    boat.timer = 0;
    // 返程靠岸也要播报：否则读屏停在 12 秒前的疲劳值，玩家不知道船已可再派。
    boatSay(runtime, "第 " + boat.id + " 条船靠岸");
  }

  function boatRestDone(runtime, boat) {
    boat.fatigue = Math.max(0, boat.fatigue - RULES.boat.restRecovery);
    boat.status = "dock";
    boat.timer = 0;
    boatSay(runtime, "第 " + boat.id + " 条船歇好了");
  }

  function drawBoatBackdrop(runtime) {
    var context = runtime.ctx;
    var palette = runtime.palette;
    var gradient = context.createLinearGradient(0, 0, 0, DESIGN_H);
    gradient.addColorStop(0, palette.nightDeep);
    gradient.addColorStop(0.5, palette.night);
    gradient.addColorStop(1, palette.nightDeep);
    context.fillStyle = gradient;
    context.fillRect(0, 0, DESIGN_W, DESIGN_H);
    context.save();
    context.globalAlpha = 0.48;
    context.fillStyle = palette.paperA72;
    context.beginPath();
    context.arc(1110, 110, 38, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.35;
    context.fillStyle = palette.ember;
    context.beginPath();
    context.arc(1230, 150, 20, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.save();
    context.strokeStyle = palette.inkA30;
    context.lineWidth = 2;
    for (var i = 0; i < 7; i += 1) {
      var y = 560 + i * 22;
      context.beginPath();
      context.moveTo(0, y);
      context.quadraticCurveTo(300, y - 12, 640, y);
      context.quadraticCurveTo(960, y + 10, 1280, y - 2);
      context.stroke();
    }
    context.restore();
  }

  function drawBoatCard(runtime, index) {
    var context = runtime.ctx;
    var palette = runtime.palette;
    var state = runtime.state;
    var boat = state.boats[index];
    var rect = boatCardRect(index);
    var locked = !boat.enabled;
    context.save();
    if (locked) context.globalAlpha = 0.42;
    drawCard(context, rect.x, rect.y, rect.w, rect.h, {
      fill: palette.ink,
      stroke: boat.status === "out" || boat.status === "back" ? palette.ember : palette.paperA72,
      lineWidth: boat.status === "out" || boat.status === "back" ? 2 : 1
    });

    drawText(context, "第 " + (index + 1) + " 条", rect.x + 14, rect.y + 30, {
      font: "22px " + palette.fontBody,
      fill: palette.paperHi
    });

    var status = "待发";
    if (locked) status = "船工不够";
    else if (boat.status === "out") status = "出程 " + formatClock(boat.timer);
    else if (boat.status === "back") status = "返程 " + formatClock(boat.timer);
    else if (boat.status === "rest") status = "歇 " + formatClock(boat.timer);
    drawText(context, status, rect.x + rect.w - 12, rect.y + 30, {
      font: "20px " + palette.fontBody,
      fill: locked ? palette.paperA72 : (boat.status === "rest" ? palette.ember : palette.paperHi),
      align: "right"
    });

    // 船身与八个乘客点
    context.save();
    context.fillStyle = palette.inkMuted;
    context.beginPath();
    context.moveTo(rect.x + 26, rect.y + 94);
    context.lineTo(rect.x + rect.w - 28, rect.y + 94);
    context.lineTo(rect.x + rect.w - 48, rect.y + 124);
    context.lineTo(rect.x + 46, rect.y + 124);
    context.closePath();
    context.fill();
    context.restore();
    for (var p = 0; p < RULES.boat.capacity; p += 1) {
      var px = rect.x + 54 + (p % 4) * 26;
      var py = rect.y + 72 + Math.floor(p / 4) * 20;
      context.beginPath();
      context.arc(px, py, 7, 0, Math.PI * 2);
      context.fillStyle = boat.status === "out" || boat.status === "back" ? palette.paperHi : palette.inkA45;
      context.fill();
    }

    // 疲劳条
    drawText(context, "疲劳", rect.x + 14, rect.y + rect.h - 28, {
      font: "18px " + palette.fontBody,
      fill: palette.paperA72
    });
    drawTimerBar(context, rect.x + 54, rect.y + rect.h - 36, 150, 10, boat.fatigue / 100, palette.ember, palette.inkA45);
    drawText(context, String(boat.fatigue), rect.x + 214, rect.y + rect.h - 24, {
      font: "18px " + palette.fontNum,
      fill: palette.paperA72
    });

    var rest = boatRestRect(index);
    fillRoundRect(context, rest.x, rest.y, rest.w, rest.h, 4, boat.status === "rest" ? palette.ember : palette.inkMuted);
    strokeRoundRect(context, rest.x, rest.y, rest.w, rest.h, 4, palette.paperA72, 1);
    drawText(context, "歇", rest.x + rest.w / 2, rest.y + rest.h / 2 - 2, {
      font: "30px " + palette.fontBody,
      fill: palette.paperHi,
      align: "center",
      baseline: "middle"
    });
    context.restore();
  }

  var boatGame = {
    init: function (runtime) {
      var state = runtime.state;
      state.trust = Math.round(clamp(finiteNumber(runtime.initial.trust, 0), 0, 6));
      state.crew = crewForTrust(state.trust);
      state.available = Math.min(RULES.boat.boats, Math.floor(state.crew / RULES.boat.crewPerBoat));
      state.trips = 0;
      state.message = "";
      state.messageTtl = 0;
      state.boats = [];
      for (var i = 0; i < RULES.boat.boats; i += 1) {
        state.boats.push({
          id: i + 1,
          enabled: i < state.available,
          status: "dock",
          timer: 0,
          fatigue: 0
        });
      }
    },

    update: function (runtime, dt) {
      var state = runtime.state;
      if (state.messageTtl > 0) state.messageTtl = Math.max(0, state.messageTtl - dt);
      for (var i = 0; i < state.boats.length; i += 1) {
        var boat = state.boats[i];
        if (boat.status !== "out" && boat.status !== "back" && boat.status !== "rest") continue;
        boat.timer = Math.max(0, boat.timer - dt);
        if (boat.timer > 0) continue;
        if (boat.status === "out") {
          boatArrive(runtime, boat);
        } else if (boat.status === "back") {
          boatDock(runtime, boat);
        } else {
          boatRestDone(runtime, boat);
        }
        if (runtime.ending) return;
      }
    },

    draw: function (runtime) {
      var context = runtime.ctx;
      var palette = runtime.palette;
      var state = runtime.state;
      drawBoatBackdrop(runtime);
      drawText(context, "渡口", 80, 52, {
        font: "46px " + palette.fontTitle,
        fill: palette.paperHi
      });
      drawText(context, "六条船，十八趟。船工在岸上等。", 82, 82, {
        font: "22px " + palette.fontBody,
        fill: palette.paperA72
      });
      var timerColor = runtime.timeLeft <= 10 ? palette.cinnabar : palette.paperHi;
      drawTimerBar(context, 900, 30, 220, 12, runtime.timeLeft / RULES.boat.duration, timerColor, palette.inkA30);
      drawText(context, formatClock(runtime.timeLeft), 1136, 42, {
        font: "24px " + palette.fontNum,
        fill: timerColor,
        align: "right",
        baseline: "middle"
      });
      drawText(context, "已渡 " + state.trips + "/" + RULES.boat.plannedTrips + " 趟 · 船工 " + state.crew + " 人 · 可用船 " + state.available, 80, 122, {
        font: "24px " + palette.fontBody,
        fill: palette.paperHi
      });
      drawText(context, "追兵 120s（远景）", 960, 122, {
        font: "20px " + palette.fontNum,
        fill: palette.paperA72,
        align: "right"
      });
      for (var i = 0; i < state.boats.length; i += 1) drawBoatCard(runtime, i);
      if (state.messageTtl > 0) {
        drawText(context, state.message, 80, 690, {
          font: "22px " + palette.fontBody,
          fill: palette.ember,
          maxWidth: 900
        });
      } else {
        drawText(context, "点船出程；点「歇」让靠岸的船休息。", 80, 690, {
          font: "20px " + palette.fontBody,
          fill: palette.paperA72,
          maxWidth: 1000
        });
      }
    },

    onPointer: function (runtime, event) {
      if (event.type !== "up" || !event.tap) return;
      for (var i = 0; i < RULES.boat.boats; i += 1) {
        if (pointInRect(event.x, event.y, boatRestRect(i))) {
          boatRest(runtime, i);
          return;
        }
      }
      for (var j = 0; j < RULES.boat.boats; j += 1) {
        if (pointInRect(event.x, event.y, boatCardRect(j))) {
          boatStart(runtime, j);
          return;
        }
      }
    },

    onKey: function (runtime, event) {
      if (event.digit >= 1 && event.digit <= RULES.boat.boats) {
        if (event.shift) boatRest(runtime, event.digit - 1);
        else boatStart(runtime, event.digit - 1);
      }
    },

    end: function (runtime) {
      var state = runtime.state;
      return {
        carried: [],
        left: [],
        stats: {
          trips: state.trips,
          plannedTrips: RULES.boat.plannedTrips,
          boatmen: state.crew,
          boats: state.available
        }
      };
    }
  };

  GAMES.boat = boatGame;

  var CLIMB_DECK_Y = 430;
  var CLIMB_SPANS = [
    { start: 0, count: 8, x0: 100, x1: 440, label: "第一段" },
    { start: 8, count: 7, x0: 440, x1: 820, label: "第二段" },
    { start: 15, count: 7, x0: 820, x1: 1180, label: "第三段" }
  ];
  var CLIMB_ANCHORS = [100, 440, 820, 1180];

  function climbState(runtime) {
    return runtime.state;
  }

  function climbLightPos(index) {
    for (var i = 0; i < CLIMB_SPANS.length; i += 1) {
      var span = CLIMB_SPANS[i];
      if (index >= span.start && index < span.start + span.count) {
        var t = (index - span.start + 0.5) / span.count;
        return {
          x: span.x0 + (span.x1 - span.x0) * t,
          y: CLIMB_DECK_Y + Math.sin(Math.PI * t) * 62,
          span: i
        };
      }
    }
    return { x: 640, y: CLIMB_DECK_Y, span: 0 };
  }

  function climbStatus(runtime) {
    var state = climbState(runtime);
    return "已过 " + state.reached + "/22，暗了 " + state.lost + "，还亮着 " + Math.max(0, RULES.climb.lights - state.reached - state.lost) + "。";
  }

  function climbSay(runtime, message) {
    var state = climbState(runtime);
    state.message = message;
    state.messageTtl = 2;
    announce(runtime, message + " " + climbStatus(runtime));
  }

  function climbStartFire(runtime) {
    var state = climbState(runtime);
    state.fireActive = true;
    state.fireLeft = RULES.climb.fireWindowMs / 1000;
    state.fireTaps = 0;
    state.stepElapsed = 0;
    climbSay(runtime, "火墙！连点三下");
    emit(runtime, "climb:fire", { taps: 0, result: "start" });
  }

  function climbFireTap(runtime) {
    var state = climbState(runtime);
    if (!state.fireActive || runtime.ending) return;
    state.fireTaps += 1;
    emit(runtime, "climb:fire", { taps: state.fireTaps, result: "tap" });
    if (state.fireTaps >= RULES.climb.fireTaps) {
      state.fireActive = false;
      state.fireTaps = 0;
      state.stepElapsed = 0;
      climbSay(runtime, "火墙过去了");
      emit(runtime, "climb:fire", { taps: RULES.climb.fireTaps, result: "clear" });
    }
  }

  function climbMiss(runtime, why) {
    var state = climbState(runtime);
    if (runtime.ending) return;
    state.lost += 1;
    state.stepElapsed = 0;
    state.missFlashTtl = 0.45;
    state.missFlashPos = climbLightPos(state.reached + state.lost - 1);
    emit(runtime, "climb:miss", { lost: state.lost, why: why || "miss" });
    if (state.reached + state.lost >= RULES.climb.lights || state.lost >= RULES.climb.lights) {
      finish(runtime, "done");
      return;
    }
    climbSay(runtime, why === "fire" ? "火墙压过来，灭了一盏" : "点空了，灭了一盏");
  }

  function climbHit(runtime) {
    var state = climbState(runtime);
    if (runtime.ending) return;
    var index = state.reached + state.lost;
    if (index >= RULES.climb.lights) {
      finish(runtime, "done");
      return;
    }
    state.reached += 1;
    state.stepElapsed = 0;
    state.hitFlashTtl = 0.5;
    state.hitFlashPos = climbLightPos(index);
    emit(runtime, "climb:hit", { index: index, reached: state.reached });
    if (state.reached + state.lost >= RULES.climb.lights) {
      finish(runtime, "done");
      return;
    }
    var fireAt = RULES.climb.fireAt;
    if (state.fireIndex < fireAt.length && state.reached === fireAt[state.fireIndex]) {
      state.fireIndex += 1;
      climbStartFire(runtime);
      return;
    }
    climbSay(runtime, "亮了，第 " + state.reached + " 盏");
  }

  function climbTap(runtime, x, y) {
    var state = climbState(runtime);
    if (runtime.ending) return;
    if (state.fireActive) {
      climbFireTap(runtime);
      return;
    }
    var windowStart = (RULES.climb.stepMs - RULES.climb.hitWindow * 1000) / 1000;
    if (state.stepElapsed >= windowStart && state.stepElapsed < RULES.climb.stepMs / 1000) {
      climbHit(runtime);
    } else {
      state.missFlashPos = { x: x, y: y };
      climbMiss(runtime, "early");
    }
  }

  function climbBackdrop(runtime) {
    var context = runtime.ctx;
    var palette = runtime.palette;
    var gradient = context.createLinearGradient(0, 0, 0, DESIGN_H);
    gradient.addColorStop(0, palette.nightDeep);
    gradient.addColorStop(0.55, palette.night);
    gradient.addColorStop(1, "#0F141B");
    context.fillStyle = gradient;
    context.fillRect(0, 0, DESIGN_W, DESIGN_H);

    context.save();
    context.globalAlpha = 0.4;
    context.fillStyle = palette.paperA72;
    context.beginPath();
    context.arc(1090, 96, 34, 0, Math.PI * 2);
    context.fill();
    context.restore();

    // 远山与江面：只留剪影和白线，不做写实
    context.save();
    context.fillStyle = palette.inkMuted;
    context.globalAlpha = 0.7;
    context.beginPath();
    context.moveTo(0, 330);
    context.lineTo(150, 260);
    context.lineTo(300, 320);
    context.lineTo(470, 245);
    context.lineTo(700, 320);
    context.lineTo(900, 250);
    context.lineTo(1100, 315);
    context.lineTo(1280, 260);
    context.lineTo(1280, 560);
    context.lineTo(0, 560);
    context.closePath();
    context.fill();
    context.restore();

    context.save();
    context.strokeStyle = palette.paperA72;
    context.globalAlpha = 0.35;
    context.lineWidth = 2;
    for (var w = 0; w < 6; w += 1) {
      var wy = 590 + w * 18;
      context.beginPath();
      context.moveTo(0, wy);
      context.quadraticCurveTo(330, wy - 10, 640, wy);
      context.quadraticCurveTo(960, wy + 8, 1280, wy - 4);
      context.stroke();
    }
    context.restore();

    // 十三根铁索，斜着压过江面
    context.save();
    context.lineWidth = 1.6;
    for (var i = 0; i < 13; i += 1) {
      context.strokeStyle = i % 3 === 0 ? palette.inkA45 : palette.inkA30;
      context.beginPath();
      context.moveTo(54, 250 + i * 8);
      context.quadraticCurveTo(640, 250 + i * 8 + 72 + i * 3, 1226, 250 + i * 8);
      context.stroke();
    }
    context.restore();

    // 四座桥墩
    context.save();
    for (var a = 0; a < CLIMB_ANCHORS.length; a += 1) {
      var ax = CLIMB_ANCHORS[a];
      context.fillStyle = palette.inkMuted;
      context.fillRect(ax - 15, 250, 30, 300);
      context.fillStyle = palette.ink;
      context.fillRect(ax - 20, 250, 40, 16);
      context.fillStyle = palette.cinnabar;
      context.fillRect(ax - 18, 266, 36, 4);
    }
    context.restore();

    // 三段下垂的桥面主索
    context.save();
    context.strokeStyle = palette.paperA72;
    context.lineWidth = 2.5;
    for (var s = 0; s < CLIMB_SPANS.length; s += 1) {
      var span = CLIMB_SPANS[s];
      context.beginPath();
      context.moveTo(span.x0, CLIMB_DECK_Y);
      context.quadraticCurveTo((span.x0 + span.x1) / 2, CLIMB_DECK_Y + 124, span.x1, CLIMB_DECK_Y);
      context.stroke();
    }
    context.restore();

    context.save();
    for (var t = 0; t < CLIMB_SPANS.length; t += 1) {
      var mid = (CLIMB_SPANS[t].x0 + CLIMB_SPANS[t].x1) / 2;
      drawText(context, CLIMB_SPANS[t].label, mid, 218, {
        font: "18px " + palette.fontBody,
        fill: palette.paperA72,
        align: "center"
      });
    }
    context.restore();
  }

  function climbDrawLights(runtime) {
    var context = runtime.ctx;
    var palette = runtime.palette;
    var state = runtime.state;
    var target = state.reached + state.lost;
    for (var i = 0; i < RULES.climb.lights; i += 1) {
      var pos = climbLightPos(i);
      var lit = i < state.reached;
      var lost = i >= state.reached && i < state.reached + state.lost;
      context.save();
      if (lit) {
        if (!reducedMotion(runtime)) {
          context.globalAlpha = 0.18;
          context.fillStyle = palette.ember;
          context.beginPath();
          context.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = 1;
        context.fillStyle = palette.paperHi;
        context.beginPath();
        context.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
        context.fill();
      } else if (lost) {
        context.strokeStyle = palette.inkA45;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.moveTo(pos.x - 4, pos.y - 4);
        context.lineTo(pos.x + 4, pos.y + 4);
        context.stroke();
      } else {
        context.strokeStyle = palette.paperA72;
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        context.stroke();
      }
      context.restore();
    }

    if (target < RULES.climb.lights && !state.fireActive) {
      var targetPos = climbLightPos(target);
      var progress = clamp(state.stepElapsed / (RULES.climb.stepMs / 1000), 0, 1);
      var inWindow = progress >= (RULES.climb.stepMs - RULES.climb.hitWindow * 1000) / RULES.climb.stepMs;
      var radius = 56 - 34 * progress;
      context.save();
      context.lineWidth = inWindow ? 4 : 2;
      context.strokeStyle = inWindow ? palette.ember : palette.paperA72;
      if (inWindow && !reducedMotion(runtime)) {
        context.globalAlpha = 0.65 + Math.sin(runtime.elapsed * 18) * 0.25;
      }
      context.beginPath();
      context.arc(targetPos.x, targetPos.y, radius, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 0.85;
      context.strokeStyle = inWindow ? palette.ember : palette.inkA45;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(targetPos.x, targetPos.y, radius + 8, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (state.hitFlashTtl > 0 && state.hitFlashPos) {
      context.save();
      context.globalAlpha = clamp(state.hitFlashTtl / 0.5, 0, 1) * 0.7;
      context.strokeStyle = palette.ember;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(state.hitFlashPos.x, state.hitFlashPos.y, 26, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
    if (state.missFlashTtl > 0 && state.missFlashPos) {
      context.save();
      context.globalAlpha = clamp(state.missFlashTtl / 0.45, 0, 1) * 0.65;
      context.strokeStyle = palette.cinnabar;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(state.missFlashPos.x, state.missFlashPos.y, 24, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  function climbDrawFire(runtime) {
    var context = runtime.ctx;
    var palette = runtime.palette;
    var state = runtime.state;
    if (!state.fireActive) return;
    context.save();
    context.globalAlpha = 0.2;
    context.fillStyle = palette.ember;
    context.fillRect(0, 0, DESIGN_W, DESIGN_H);
    context.globalAlpha = 1;
    context.strokeStyle = palette.ember;
    context.lineWidth = 3;
    context.strokeRect(60, 240, 1160, 260);
    drawText(context, "火墙", 640, 320, {
      font: "64px " + palette.fontTitle,
      fill: palette.paperHi,
      align: "center"
    });
    drawText(context, "连点三下", 640, 360, {
      font: "24px " + palette.fontBody,
      fill: palette.ember,
      align: "center"
    });
    for (var i = 0; i < RULES.climb.fireTaps; i += 1) {
      var cx = 550 + i * 90;
      context.beginPath();
      context.arc(cx, 430, 30, 0, Math.PI * 2);
      context.fillStyle = i < state.fireTaps ? palette.ember : palette.inkA45;
      context.fill();
      context.strokeStyle = palette.paperA72;
      context.lineWidth = 2;
      context.stroke();
    }
    drawText(context, "剩 " + Math.max(0, state.fireLeft).toFixed(1) + "s", 640, 500, {
      font: "20px " + palette.fontNum,
      fill: palette.paperHi,
      align: "center"
    });
    context.restore();
  }

  var climbGame = {
    init: function (runtime) {
      var state = runtime.state;
      state.reached = 0;
      // ?lights 只用于调试试玩：把若干盏灯预设为已暗，便于检查结果重建。
      state.lost = Math.round(clamp(Number(runtime.initial.lights) || 0, 0, RULES.climb.lights));
      state.stepElapsed = 0;
      state.fireActive = false;
      state.fireLeft = 0;
      state.fireTaps = 0;
      state.fireIndex = 0;
      state.message = "";
      state.messageTtl = 0;
      state.hitFlashTtl = 0;
      state.hitFlashPos = null;
      state.missFlashTtl = 0;
      state.missFlashPos = null;
      if (state.lost >= RULES.climb.lights) finish(runtime, "done");
    },

    update: function (runtime, dt) {
      var state = runtime.state;
      if (state.messageTtl > 0) state.messageTtl = Math.max(0, state.messageTtl - dt);
      if (state.hitFlashTtl > 0) state.hitFlashTtl = Math.max(0, state.hitFlashTtl - dt);
      if (state.missFlashTtl > 0) state.missFlashTtl = Math.max(0, state.missFlashTtl - dt);
      if (state.fireActive) {
        state.fireLeft = Math.max(0, state.fireLeft - dt);
        if (state.fireLeft <= 0) {
          state.fireActive = false;
          emit(runtime, "climb:fire", { taps: state.fireTaps, result: "fail" });
          climbMiss(runtime, "fire");
        }
        return;
      }
      state.stepElapsed += dt;
      if (state.stepElapsed >= RULES.climb.stepMs / 1000) {
        climbMiss(runtime, "late");
      }
    },

    draw: function (runtime) {
      var context = runtime.ctx;
      var palette = runtime.palette;
      var state = runtime.state;
      climbBackdrop(runtime);
      climbDrawLights(runtime);

      drawText(context, "铁索", 80, 52, {
        font: "46px " + palette.fontTitle,
        fill: palette.paperHi
      });
      drawText(context, "二十二盏灯，三节铁索。", 82, 82, {
        font: "22px " + palette.fontBody,
        fill: palette.paperA72
      });
      var timerColor = runtime.timeLeft <= 10 ? palette.cinnabar : palette.paperHi;
      drawTimerBar(context, 900, 30, 220, 12, runtime.timeLeft / RULES.climb.duration, timerColor, palette.inkA30);
      drawText(context, formatClock(runtime.timeLeft), 1136, 42, {
        font: "24px " + palette.fontNum,
        fill: timerColor,
        align: "right",
        baseline: "middle"
      });
      drawText(
        context,
        "已过 " + state.reached + "/" + RULES.climb.lights +
          " · 暗了 " + state.lost +
          " · 还亮着 " + Math.max(0, RULES.climb.lights - state.reached - state.lost),
        80,
        122,
        { font: "24px " + palette.fontBody, fill: palette.paperHi }
      );

      climbDrawFire(runtime);

      if (state.messageTtl > 0) {
        drawText(context, state.message, 80, 620, {
          font: "22px " + palette.fontBody,
          fill: palette.ember,
          maxWidth: 1000
        });
      }
      drawText(
        context,
        state.fireActive ? "快！连点三下。" : "等光圈收拢，点一下；点空会熄一盏。",
        80,
        690,
        {
          font: "20px " + palette.fontBody,
          fill: state.fireActive ? palette.ember : palette.paperA72,
          maxWidth: 1000
        }
      );
    },

    onPointer: function (runtime, event) {
      if (event.type !== "up" || !event.tap) return;
      climbTap(runtime, event.x, event.y);
    },

    onKey: function (runtime, event) {
      if (!event.confirm) return;
      climbTap(runtime, 640, 430);
    },

    end: function (runtime) {
      var state = runtime.state;
      return {
        carried: [],
        left: [],
        stats: {
          reached: state.reached,
          lost: state.lost,
          unlit: Math.max(0, RULES.climb.lights - state.reached - state.lost)
        }
      };
    }
  };

  GAMES.climb = climbGame;

  XB.minigames = {
    SCENES: deepFreeze(SCENES.slice()),
    RULES: RULES,
    ITEMS: ITEMS,
    start: start,
    stop: stop,
    isActive: isActive,
    resize: resize,
    labelFor: labelFor,
    itemIds: itemIds,
    crewForTrust: crewForTrust,
    usedSlots: usedSlots,
    canPack: canPack,
    design: { width: DESIGN_W, height: DESIGN_H }
  };
})(window.XB = window.XB || {});
