/* 《向北》engine.js —— 步骤一：工程骨架
 * 上半 XB.core：纯状态层（不碰 document / localStorage，可在 vm 里无头跑）
 * 下半 XB.engine：DOM、场景、输入、存档
 * 文件职责固定，见 .cursor/rules/xiangbei.mdc §5；不得拆成 core.js。
 */
(function (XB) {
  "use strict";

  /* ============================================================
   * XB.core —— 纯状态层
   * ============================================================ */

  var SAVE_VERSION = 1;
  var SCENE_VALUES = ["title", "map", "vn", "choice", "minigame", "result", "codex", "ending"];
  var DEFAULT_SETTINGS = {
    textSpeed: 30,
    textScale: 1,
    volume: 0.6,
    muted: false,
    reducedMotion: false,
    skipSeen: false
  };
  // 持久字段（顺序即 JSON 顺序）：paused / stack / storageOk 是运行时字段，不进存档
  var PERSIST_KEYS = ["version", "scene", "chapterId", "nodeId", "flags", "inventory", "choices", "codex", "settings", "unlockedChapters", "ending"];

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function cloneJson(value) {
    if (value === null || value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    if (typeof value !== "number" || isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function chapterById(chapterId) {
    var chapters = XB.story && XB.story.chapters ? XB.story.chapters : [];
    for (var i = 0; i < chapters.length; i += 1) {
      if (chapters[i].id === chapterId) return chapters[i];
    }
    return null;
  }

  function defaults() {
    return {
      version: SAVE_VERSION,
      scene: "title",
      chapterId: "prologue",
      nodeId: null,
      flags: {},
      inventory: { door: false, items: [] },
      choices: [],
      codex: [],
      settings: cloneJson(DEFAULT_SETTINGS),
      unlockedChapters: ["prologue"],
      ending: null,
      paused: false,
      stack: [],
      storageOk: true
    };
  }

  // 只处理版本号；结构校验在 normalize。任何失败都返回 issue，不抛异常（file:// 下抛错会白屏）
  function migrate(raw) {
    if (!isPlainObject(raw)) return { save: null, issue: "shape" };
    if (raw.version === SAVE_VERSION) return { save: raw, issue: null };
    if (typeof raw.version === "number" && raw.version > SAVE_VERSION) {
      return { save: null, issue: "version-too-new" };
    }
    return { save: null, issue: "shape" };
  }

  function normalize(raw) {
    if (!isPlainObject(raw)) return { state: null, issue: "shape" };
    var migrated = migrate(raw);
    if (migrated.issue) return { state: null, issue: migrated.issue };

    var src = migrated.save;
    var state = defaults();

    if (SCENE_VALUES.indexOf(src.scene) === -1) return { state: null, issue: "scene" };
    state.scene = src.scene;

    if (typeof src.chapterId === "string" && chapterById(src.chapterId)) {
      state.chapterId = src.chapterId;
    } else if (src.chapterId !== undefined && src.chapterId !== null) {
      return { state: null, issue: "chapter" };
    }

    if (src.nodeId === null || src.nodeId === undefined) {
      state.nodeId = null;
    } else if (typeof src.nodeId === "string") {
      state.nodeId = src.nodeId;
    } else {
      // 旧开发存档的数字下标：v1 内部修订，备份 .bad 后重置（state-schema §5）
      return { state: null, issue: "node" };
    }

    if (isPlainObject(src.flags)) state.flags = cloneJson(src.flags);

    if (isPlainObject(src.inventory)) {
      if (typeof src.inventory.door === "boolean") state.inventory.door = src.inventory.door;
      if (Array.isArray(src.inventory.items)) {
        state.inventory.items = src.inventory.items.filter(function (item) {
          return typeof item === "string";
        });
      }
    }

    if (Array.isArray(src.choices)) {
      state.choices = src.choices.filter(isPlainObject).map(cloneJson);
    }

    if (Array.isArray(src.codex)) {
      state.codex = src.codex.filter(function (id) {
        return typeof id === "string";
      });
    }

    // settings 逐键合并：不能用 Object.assign 浅合并，否则旧档整块覆盖新默认键
    if (isPlainObject(src.settings)) {
      Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
        if (typeof src.settings[key] === typeof DEFAULT_SETTINGS[key]) {
          state.settings[key] = src.settings[key];
        }
      });
    }
    state.settings.textSpeed = clamp(state.settings.textSpeed, 10, 60);
    state.settings.textScale = clamp(state.settings.textScale, 1, 1.3);
    state.settings.volume = clamp(state.settings.volume, 0, 1);

    if (Array.isArray(src.unlockedChapters)) {
      state.unlockedChapters = src.unlockedChapters.filter(function (id) {
        return typeof id === "string" && !!chapterById(id);
      });
    }
    if (state.unlockedChapters.indexOf("prologue") === -1) state.unlockedChapters.unshift("prologue");

    if (src.ending === null || src.ending === undefined) state.ending = null;
    else if (isPlainObject(src.ending)) state.ending = cloneJson(src.ending);

    if (state.scene === "vn") {
      var chapter = chapterById(state.chapterId);
      if (!chapter || !chapter.playable) return { state: null, issue: "chapter" };
      if (!state.nodeId || !locate(state.chapterId, state.nodeId)) return { state: null, issue: "node" };
    } else if (state.scene === "map") {
      if (state.nodeId !== null) return { state: null, issue: "node" };
    } else if (state.nodeId !== null && !locate(state.chapterId, state.nodeId)) {
      return { state: null, issue: "node" };
    }

    return { state: state, issue: null };
  }

  function currentChapter(state) {
    return chapterById(state.chapterId);
  }

  function locate(chapterId, nodeId) {
    var chapter = chapterById(chapterId);
    if (!chapter || !chapter.playable || !nodeId) return null;
    for (var i = 0; i < chapter.nodes.length; i += 1) {
      if (chapter.nodes[i].id === nodeId) return { chapter: chapter, index: i, node: chapter.nodes[i] };
    }
    return null;
  }

  function startChapter(state, chapterId, nodeId) {
    var chapter = chapterById(chapterId);
    if (!chapter || !chapter.playable || !chapter.nodes.length) return false;
    var index = 0;
    if (nodeId) {
      var found = locate(chapterId, nodeId);
      if (!found) return false;
      index = found.index;
    }
    state.scene = "vn";
    state.chapterId = chapterId;
    state.nodeId = chapter.nodes[index].id;
    state.stack = [{ list: chapter.nodes, index: index }];
    return true;
  }

  function topFrame(state) {
    return state.stack.length ? state.stack[state.stack.length - 1] : null;
  }

  function currentNode(state) {
    var frame = topFrame(state);
    if (!frame) return null;
    return frame.list[frame.index] || null;
  }

  function advance(state) {
    var frame = topFrame(state);
    if (!frame) return null;
    var current = frame.list[frame.index];
    // end 不再前进，由引擎执行 next
    if (current && current.type === "end") return current;
    frame.index += 1;
    if (frame.index >= frame.list.length) {
      state.stack.pop();
      var parent = topFrame(state);
      return parent ? parent.list[parent.index] || null : null;
    }
    return frame.list[frame.index];
  }

  function serialize(state) {
    var save = {
      version: SAVE_VERSION,
      scene: state.scene,
      chapterId: state.chapterId,
      nodeId: state.nodeId,
      flags: cloneJson(state.flags),
      inventory: { door: !!state.inventory.door, items: state.inventory.items.slice() },
      choices: cloneJson(state.choices),
      codex: state.codex.slice(),
      settings: cloneJson(state.settings),
      unlockedChapters: state.unlockedChapters.slice(),
      ending: state.ending === null ? null : cloneJson(state.ending)
    };
    return save;
  }

  XB.core = {
    SCENES: SCENE_VALUES.slice(),
    PERSIST_KEYS: PERSIST_KEYS.slice(),
    defaults: defaults,
    migrate: migrate,
    normalize: normalize,
    chapterById: chapterById,
    currentChapter: currentChapter,
    locate: locate,
    startChapter: startChapter,
    currentNode: currentNode,
    advance: advance,
    serialize: serialize
  };

  /* ============================================================
   * XB.engine —— DOM / 场景 / 输入 / 存档
   * ============================================================ */

  var SAVE_KEY = "xiangbei.save.v1";
  var MAX_SAVE_BYTES = 4096;
  // 步骤一未实现的场景：调用时明确提示并退回，不静默
  var UNIMPLEMENTED = {
    choice: "选项场景由步骤三接入",
    minigame: "小游戏由步骤四接入",
    result: "结算场景由步骤四接入",
    codex: "史实图鉴在步骤五接入",
    ending: "结局面板由步骤五接入"
  };
  // 地图坐标唯一源：docs/ui-layout.md §1.5；与文档不一致时先改文档
  var MAP_STATIONS = [
    { chapterId: "prologue", order: 1, x: 120, y: 560 },
    { chapterId: "xiangjiang", order: 2, x: 280, y: 500 },
    { chapterId: "zunyi", order: 3, x: 440, y: 450 },
    { chapterId: "jinsha", order: 4, x: 610, y: 380 },
    { chapterId: "luding", order: 5, x: 760, y: 300 },
    { chapterId: "grass", order: 6, x: 920, y: 220 },
    { chapterId: "wuqi", order: 7, x: 1080, y: 130 }
  ];
  var STATION_WIDTH = 132;
  var STATION_HEIGHT = 64;

  var REQUIRED_IDS = [
    "stage", "scene-title", "scene-map", "scene-vn", "pause", "toast", "debug", "orientation",
    "title-menu", "map-stations", "map-route",
    "stage-art", "vn-chapter", "vn-name", "vn-text", "vn-next"
  ];

  var state = null;
  var storageOk = true;
  var debugEnabled = false;
  var toastTimer = null;
  var stationsBuilt = false;
  var lastFocused = null;
  var artWarned = false;
  var artResizeFrame = 0;
  var artResizeScale = 1;
  var els = {};

  function cacheElements() {
    REQUIRED_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) throw new Error("index.html 缺少必需元素 #" + id);
      els[id.replace(/-([a-z])/g, function (match, letter) { return letter.toUpperCase(); })] = el;
    });
  }

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function utf8Bytes(text) {
    return new TextEncoder().encode(text).length;
  }

  function readParams() {
    return new URLSearchParams(window.location.search || "");
  }

  function init() {
    if (!XB.story || !XB.core) throw new Error("engine.js 依赖 story.js 先加载");
    cacheElements();
    mountArt();
    bindInput();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    var params = readParams();
    debugEnabled = params.get("debug") === "1";
    els.debug.hidden = !debugEnabled;
    // ?fonts=fallback：强制走系统回退字体，做低配/对照验收
    if (params.get("fonts") === "fallback") {
      document.documentElement.classList.add("fonts-fallback");
    }

    if (params.get("reset") === "1") {
      try {
        window.localStorage.removeItem(SAVE_KEY);
      } catch (err) {
        storageOk = false;
        toast("本次游玩不保存（浏览器限制）");
      }
    }

    var loaded = loadSave();
    state = loaded.state || XB.core.defaults();
    if (!storageOk) state.storageOk = false;
    if (loaded.issue === "storage") toast("本次游玩不保存（浏览器限制）");

    applyStartScene();
    render();
    updateDebug("save=" + (loaded.state ? "loaded" : "none"));
  }

  function loadSave() {
    var raw;
    try {
      raw = window.localStorage.getItem(SAVE_KEY);
    } catch (err) {
      storageOk = false;
      return { state: null, issue: "storage" };
    }
    if (!raw) return { state: null, issue: null };

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      backupSave(".bad");
      toast("存档损坏，已重置");
      return { state: null, issue: "parse" };
    }

    var result = XB.core.normalize(parsed);
    if (result.issue === "version-too-new") {
      backupSave(".bak");
      toast("存档来自更新版本，已备份");
      return { state: null, issue: result.issue };
    }
    if (result.issue) {
      backupSave(".bad");
      toast("存档与当前版本不匹配，已重置");
      return { state: null, issue: result.issue };
    }
    return { state: result.state, issue: null };
  }

  // 坏档先备份再删主键：备份失败也不能白屏，只降级为“本局不保存”
  function backupSave(suffix) {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      if (raw !== null) window.localStorage.setItem(SAVE_KEY + suffix, raw);
      window.localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      storageOk = false;
      toast("存档备份失败，本次游玩不保存");
    }
  }

  function saveNow() {
    if (!state || storageOk === false) return;
    var payload = XB.core.serialize(state);
    var json = JSON.stringify(payload);
    var bytes = utf8Bytes(json);
    if (bytes > MAX_SAVE_BYTES) {
      console.error("存档 " + bytes + " 字节，超过 " + MAX_SAVE_BYTES + " 字节上限");
      toast("存档异常");
      return;
    }
    try {
      window.localStorage.setItem(SAVE_KEY, json);
    } catch (err) {
      storageOk = false;
      state.storageOk = false;
      toast("本次游玩不保存（浏览器限制）");
    }
    updateDebug("save=" + bytes + "B");
  }

  function applyStartScene() {
    if (UNIMPLEMENTED[state.scene]) {
      toast(UNIMPLEMENTED[state.scene]);
      state.scene = resumeNode() ? "vn" : "map";
    }
    if (state.scene === "vn" && !XB.core.startChapter(state, state.chapterId, state.nodeId)) {
      toast("找不到上次的进度，回到地图");
      state.scene = "map";
      state.nodeId = null;
    }
  }

  function resumeNode() {
    if (!state || !state.nodeId) return null;
    return XB.core.locate(state.chapterId, state.nodeId);
  }

  function resize() {
    // 用布局视口而不是 innerWidth：手机横屏首次渲染时 #stage 是 1280 原生宽，
    // Chrome 的 shrink-to-fit 会把 innerWidth 放大（实测 844 → 1062），舞台就跟着出界。
    var docEl = document.documentElement;
    var viewportW = docEl.clientWidth || window.innerWidth;
    var viewportH = docEl.clientHeight || window.innerHeight;
    var scale = Math.min(viewportW / 1280, viewportH / 720);
    document.documentElement.style.setProperty("--scale", String(scale));
    scheduleArtResize(scale);
  }

  // ---------- 插画（单画布 art.js） ----------

  function mountArt() {
    if (!XB.art || typeof XB.art.mount !== "function") {
      console.error("art.js 未提供 mount：本局不画背景");
      return;
    }
    try {
      XB.art.mount(els.stageArt);
    } catch (err) {
      console.error("插画初始化失败", err);
      hideStageArt();
    }
  }

  function hideStageArt() {
    if (els.stageArt) els.stageArt.hidden = true;
  }

  // 插画失败只降级：隐藏画布 + 一次性提示，页面回落到 CSS 纸白/夜蓝底，不白屏
  function paintStage(sceneId) {
    if (!els.stageArt || !XB.art || typeof XB.art.paint !== "function") return;
    var painted = false;
    try {
      painted = XB.art.paint(els.stageArt, sceneId);
    } catch (err) {
      console.error("插画绘制异常：" + sceneId, err);
      painted = false;
    }
    if (painted) {
      els.stageArt.hidden = false;
      return;
    }
    hideStageArt();
    if (!artWarned) {
      artWarned = true;
      toast("插画加载失败");
    }
  }

  // 拖动窗口时合并成一次重绘，避免每帧整幅重画。
  // debug 行必须等画布真正改过尺寸再写，否则读到的是上一帧的像素尺寸。
  function scheduleArtResize(scale) {
    if (!els.stageArt || !XB.art || typeof XB.art.resize !== "function") {
      updateDebug("");
      return;
    }
    artResizeScale = scale;
    if (typeof window.requestAnimationFrame !== "function") {
      try {
        XB.art.resize(artResizeScale);
      } catch (err) {
        console.error("插画缩放失败", err);
        hideStageArt();
      }
      updateDebug("");
      return;
    }
    if (artResizeFrame) return;
    artResizeFrame = window.requestAnimationFrame(function () {
      artResizeFrame = 0;
      try {
        XB.art.resize(artResizeScale);
      } catch (err) {
        console.error("插画缩放失败", err);
        hideStageArt();
      }
      updateDebug("");
    });
  }

  function updateDebug(extra) {
    if (!debugEnabled || !els.debug) return;
    var scale = parseFloat(document.documentElement.style.getPropertyValue("--scale"));
    if (isNaN(scale)) scale = 1;
    var parts = [];
    if (state) parts.push("scene=" + state.scene, "chapter=" + state.chapterId, "node=" + String(state.nodeId));
    parts.push("scale=" + scale.toFixed(3));
    if (els.stageArt) parts.push("canvas=" + els.stageArt.width + "x" + els.stageArt.height);
    if (extra) parts.push(extra);
    els.debug.textContent = parts.join(" · ");
  }

  function render() {
    els.stage.dataset.scene = state.scene;
    els.sceneTitle.hidden = state.scene !== "title";
    els.sceneMap.hidden = state.scene !== "map";
    els.sceneVn.hidden = state.scene !== "vn";
    if (state.scene === "title") renderTitle();
    else if (state.scene === "map") renderMap();
    else if (state.scene === "vn") renderVn();
    updateDebug("");
  }

  function renderTitle() {
    paintStage("title");
    var continueButton = els.titleMenu.querySelector('[data-action="continue"]');
    if (!continueButton) return;
    continueButton.setAttribute("aria-disabled", resumeNode() ? "false" : "true");
  }

  function buildStations() {
    MAP_STATIONS.forEach(function (place) {
      var chapter = XB.core.chapterById(place.chapterId);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "map-station";
      button.dataset.action = "station";
      button.dataset.chapter = place.chapterId;
      button.style.left = place.x + "px";
      button.style.top = place.y + "px";
      button.style.width = STATION_WIDTH + "px";
      button.style.height = STATION_HEIGHT + "px";

      var order = document.createElement("span");
      order.className = "station-order";
      order.textContent = pad2(place.order);

      var name = document.createElement("span");
      name.className = "station-name";
      name.textContent = chapter ? chapter.short : place.chapterId;

      var status = document.createElement("span");
      status.className = "station-state";
      var playable = !!chapter && chapter.playable;
      status.textContent = playable ? "可走" : "未接上";
      if (!playable) {
        button.classList.add("is-locked");
        button.setAttribute("aria-disabled", "true");
      }
      button.setAttribute("aria-label", pad2(place.order) + " " + name.textContent + "，" + status.textContent);

      button.appendChild(order);
      button.appendChild(name);
      button.appendChild(status);
      els.mapStations.appendChild(button);
    });
    stationsBuilt = true;
  }

  function renderMap() {
    paintStage("map");
    if (!stationsBuilt) buildStations();
  }

  function backgroundAt(chapter, index) {
    for (var i = index; i >= 0; i -= 1) {
      if (chapter.nodes[i].bg) return chapter.nodes[i].bg;
    }
    return "";
  }

  function renderVn() {
    var located = XB.core.locate(state.chapterId, state.nodeId);
    if (!located) {
      toast("找不到这一段，回到地图");
      go("map");
      return;
    }
    if (located.node.type === "end") {
      finishChapter();
      return;
    }
    els.vnChapter.textContent = located.chapter.title;
    paintStage(backgroundAt(located.chapter, located.index) || "yudu_night");
    if (!located.node.speaker || located.node.speaker === "旁白") {
      els.vnName.hidden = true;
      els.vnName.textContent = "";
    } else {
      els.vnName.hidden = false;
      els.vnName.textContent = located.node.speaker;
    }
    els.vnText.textContent = located.node.text;
  }

  function advanceVn() {
    if (!state || state.scene !== "vn" || state.paused) return;
    var node = XB.core.currentNode(state);
    if (!node) {
      go("map");
      return;
    }
    if (node.type === "end") {
      finishChapter();
      return;
    }
    var next = XB.core.advance(state);
    if (!next) {
      finishChapter();
      return;
    }
    state.nodeId = next.id;
    saveNow();
    if (next.type === "end") {
      finishChapter();
      return;
    }
    renderVn();
  }

  function finishChapter() {
    var chapter = XB.core.chapterById(state.chapterId);
    toast((chapter ? chapter.title : "本章") + "（试片）到此");
    go("map");
  }

  function go(nextScene, payload) {
    if (!state) return false;
    if (UNIMPLEMENTED[nextScene]) {
      toast(UNIMPLEMENTED[nextScene]);
      return false;
    }
    if (nextScene === "vn") {
      var chapterId = payload && payload.chapterId ? payload.chapterId : state.chapterId;
      var nodeId = (payload && payload.nodeId) || state.nodeId;
      if (!XB.core.startChapter(state, chapterId, nodeId)) {
        toast("这一段还没接上");
        return false;
      }
    } else if (nextScene === "map") {
      state.nodeId = null;
      state.stack = [];
    } else if (nextScene !== "title") {
      toast("场景未接入：" + nextScene);
      return false;
    }
    state.scene = nextScene;
    state.paused = false;
    els.pause.hidden = true;
    render();
    saveNow();
    return true;
  }

  function startNewGame() {
    var hasProgress = state.nodeId !== null || state.scene !== "title";
    if (hasProgress && !window.confirm("已有进度，重新开始？")) return;
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      storageOk = false;
    }
    state = XB.core.defaults();
    if (!storageOk) state.storageOk = false;
    go("map");
  }

  function resumeGame() {
    if (!resumeNode()) {
      toast("还没有可以继续的进度");
      return;
    }
    go("vn");
  }

  function enterStation(button) {
    var chapterId = button.dataset.chapter;
    var chapter = XB.core.chapterById(chapterId);
    if (!chapter || !chapter.playable || !chapter.nodes.length) {
      toast("这一段还没接上");
      return;
    }
    go("vn", { chapterId: chapterId, nodeId: chapter.nodes[0].id });
  }

  function openPause() {
    if (!state || state.scene !== "vn" || state.paused) return;
    state.paused = true;
    lastFocused = document.activeElement;
    els.pause.hidden = false;
    var resumeButton = els.pause.querySelector('[data-action="resume"]');
    if (resumeButton) resumeButton.focus();
  }

  function closePause() {
    if (!state || !state.paused) return;
    state.paused = false;
    els.pause.hidden = true;
    // 不把焦点还给暂停按钮：恢复后按 Space 应该是「下一句」，不是再开暂停
    if (lastFocused && typeof lastFocused.blur === "function") lastFocused.blur();
    lastFocused = null;
  }

  function toast(text) {
    if (!els.toast) return;
    els.toast.textContent = text;
    els.toast.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      els.toast.classList.remove("is-visible");
      els.toast.textContent = "";
    }, 2500);
  }

  function handleAction(action, element) {
    switch (action) {
      case "start":
        startNewGame();
        break;
      case "continue":
        resumeGame();
        break;
      case "codex":
        toast("史实图鉴在步骤五接入");
        break;
      case "station":
        enterStation(element);
        break;
      case "pause":
        openPause();
        break;
      case "resume":
        closePause();
        break;
      case "pause-map":
        closePause();
        go("map");
        break;
      case "pause-title":
        closePause();
        go("title");
        break;
      default:
        toast("未接入的操作：" + action);
    }
  }

  function isControlFocused() {
    var active = document.activeElement;
    if (!active || active === document.body) return false;
    var tag = active.tagName;
    if (tag !== "BUTTON" && tag !== "A" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return false;
    // 隐藏场景里的按钮不该吞键盘：点「于都」进对话后，Space 必须是「下一句」
    var rect = active.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function onPointerDown(event) {
    if (!state) return;
    if (event.button !== undefined && event.button !== 0) return;
    var target = event.target;
    if (!(target instanceof Element)) return;
    // 按钮交给 click 处理，pointerdown 这里不推进，避免一次点击走两句
    if (target.closest("[data-action]")) return;
    if (target.closest("button")) return;
    if (state.scene === "vn" && !state.paused) advanceVn();
  }

  function onClick(event) {
    if (!state) return;
    var target = event.target;
    if (!(target instanceof Element)) return;
    var actionElement = target.closest("[data-action]");
    if (!actionElement) return;
    handleAction(actionElement.dataset.action, actionElement);
  }

  function onKeyDown(event) {
    if (!state || event.repeat) return;
    if (event.key === "Escape") {
      if (state.scene === "vn") {
        event.preventDefault();
        if (state.paused) closePause();
        else openPause();
      }
      return;
    }
    if (state.scene !== "vn" || state.paused) return;
    if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
      if (isControlFocused()) return;
      if (event.key !== "Enter") event.preventDefault();
      advanceVn();
    }
  }

  function bindInput() {
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
  }

  XB.engine = {
    init: init,
    go: go,
    render: render,
    toast: toast,
    resize: resize,
    handleAction: handleAction
  };

  document.addEventListener("DOMContentLoaded", init);
})(window.XB = window.XB || {});
