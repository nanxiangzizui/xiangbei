/* 《向北》步骤三：VN 引擎
 * XB.core   —— 纯状态层：条件节点图、when/set、旗标、选择结算、存档形状
 * XB.engine —— DOM 层：打字机/分页、限时选项、标题卡、史实注、自动/跳过、暂停与设置
 * 规格：docs/visual-reading.md、docs/script/README.md §6、docs/state-schema.md、docs/ui-layout.md §7
 */
(function (XB) {
  "use strict";

  /* =====================================================================
     XB.core：纯状态层（不碰 DOM，可在 Node/vm 里单独测）
     ===================================================================== */

  var SAVE_VERSION = 1;

  // 场景只用于“现在该显示哪一层”；剧情推进本身按 nodeId 定位，不用栈。
  // 小游戏/结算/选项都是 vn 视图内的分派，不再单独占 scene 值。
  var SCENES = ["title", "map", "vn"];
  var LEGACY_SCENES = ["choice", "minigame", "result", "codex", "ending"];

  // 存档字段固定 11 个：加字段先改 docs/state-schema.md 与工具 C17。
  var PERSIST_KEYS = [
    "version",
    "scene",
    "chapterId",
    "nodeId",
    "flags",
    "inventory",
    "choices",
    "codex",
    "settings",
    "unlockedChapters",
    "ending"
  ];

  var DEFAULT_SETTINGS = {
    textSpeed: 30,
    textScale: 1,
    volume: 0.6,
    muted: false,
    reducedMotion: false,
    skipSeen: false
  };

  // 九条基础旗标：缺省值即“还没做选择”的状态，normalize 会把旧档补齐。
  var FLAG_DEFAULTS = {
    "item.door": false,
    "item.pot": false,
    load: 0,
    trust: 0,
    fire: 50,
    lights_lost: 0,
    "choice.xiangjiang.abandoned": [],
    "choice.zunyi.missed": 0,
    "choice.jinsha.trips": 0
  };

  // 数值旗标的上限下限：fire 是火种，trust 是民心（0–6 段），load 是行囊格数。
  var FLAG_LIMITS = {
    fire: [0, 100],
    trust: [0, 6],
    load: [0, 99],
    lights_lost: [0, 22],
    "choice.zunyi.missed": [0, 1],
    "choice.jinsha.trips": [0, 18]
  };

  // 剧情只允许写这些旗标：ending/card/unlockedChapters 由引擎自己管。
  var FLAG_KEYS = [
    "item.door",
    "item.pot",
    "load",
    "trust",
    "fire",
    "lights_lost",
    "choice.xiangjiang.abandoned",
    "choice.zunyi.missed",
    "choice.jinsha.trips"
  ];

  // 唯一允许的 list flag：弃物留下清单。顺序也是存档与结果页的排序。
  var ABANDON_ORDER = ["xray", "press", "files", "medkit", "radio", "silver", "door"];
  var INVENTORY_IDS = ["roster", "pencil", "medicine", "barley", "pot", "raincloth", "shoes"];
  var DOOR_OPTIONAL_IDS = ["medicine", "barley", "pot", "raincloth", "shoes"];
  var FLAG_PREFIXES = ["memory.", "choice."];
  var CHOICE_LOG_LIMIT = 64;
  var TEXT_SCALES = [1, 1.15, 1.3];

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function cloneJson(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  // list flag 只在边界收一次：只认 7 个 id，去重并按固定顺序排，避免存档里出现自由文本。
  function normalizeAbandoned(value) {
    if (!Array.isArray(value)) return [];
    var seen = {};
    value.forEach(function (id) {
      if (ABANDON_ORDER.indexOf(id) !== -1) seen[id] = true;
    });
    return ABANDON_ORDER.filter(function (id) {
      return seen[id] === true;
    });
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function chapterById(id) {
    var chapters = (XB.story && XB.story.chapters) || [];
    for (var i = 0; i < chapters.length; i += 1) {
      if (chapters[i].id === id) return chapters[i];
    }
    return null;
  }

  function codexById(id) {
    var cards = (XB.story && XB.story.codex) || [];
    for (var i = 0; i < cards.length; i += 1) {
      if (cards[i].id === id) return cards[i];
    }
    return null;
  }

  function codexIds() {
    return ((XB.story && XB.story.codex) || []).map(function (card) {
      return card.id;
    });
  }

  function defaults() {
    return {
      version: SAVE_VERSION,
      scene: "title",
      chapterId: "prologue",
      nodeId: null,
      flags: cloneJson(FLAG_DEFAULTS),
      inventory: { door: false, items: [] },
      choices: [],
      codex: [],
      settings: cloneJson(DEFAULT_SETTINGS),
      unlockedChapters: ["prologue"],
      ending: null,
      // 运行时字段：不写档（paused 只活在本次会话）
      paused: false
    };
  }

  // 读档校验：任何一处不认就整体回默认，由引擎备份坏档并提示，不半信半疑地继续。
  function normalize(save) {
    if (!isPlainObject(save)) return { issue: "shape", state: defaults() };
    if (!isFiniteNumber(save.version)) return { issue: "version", state: defaults() };
    if (save.version > SAVE_VERSION) return { issue: "version-too-new", state: defaults() };
    if (save.version < SAVE_VERSION) return { issue: "version-old", state: defaults() };

    var state = defaults();

    if (SCENES.indexOf(save.scene) === -1 && LEGACY_SCENES.indexOf(save.scene) === -1) {
      return { issue: "shape", state: defaults() };
    }
    // 旧档里的 choice/minigame/result/codex 都归一到 vn；具体类型由 node.type 分派。
    state.scene = SCENES.indexOf(save.scene) === -1 ? "vn" : save.scene;

    var chapter = chapterById(save.chapterId);
    if (!chapter) return { issue: "chapter", state: defaults() };
    state.chapterId = chapter.id;

    if (save.flags !== undefined && !isPlainObject(save.flags)) return { issue: "shape", state: defaults() };
    var flags = cloneJson(FLAG_DEFAULTS);
    if (isPlainObject(save.flags)) {
      Object.keys(save.flags).forEach(function (key) {
        var value = save.flags[key];
        if (
          typeof value === "boolean" ||
          typeof value === "string" ||
          isFiniteNumber(value) ||
          (key === "choice.xiangjiang.abandoned" && Array.isArray(value))
        ) {
          flags[key] = value;
        }
      });
    }
    Object.keys(FLAG_LIMITS).forEach(function (key) {
      if (!isFiniteNumber(flags[key])) flags[key] = FLAG_DEFAULTS[key];
      else flags[key] = Math.round(clamp(flags[key], FLAG_LIMITS[key][0], FLAG_LIMITS[key][1]));
    });
    flags["item.door"] = flags["item.door"] === true;
    flags["item.pot"] = flags["item.pot"] === true;
    flags["choice.xiangjiang.abandoned"] = normalizeAbandoned(flags["choice.xiangjiang.abandoned"]);
    state.flags = flags;
    // inventory.door 只是 flags 的镜像，避免两处状态打架。
    state.inventory.door = flags["item.door"];

    var items = save.inventory && save.inventory.items;
    state.inventory.items = Array.isArray(items)
      ? items.filter(function (item, index, list) {
          return typeof item === "string" &&
            INVENTORY_IDS.indexOf(item) !== -1 &&
            list.indexOf(item) === index;
        }).slice(0, 32)
      : [];

    state.choices = Array.isArray(save.choices)
      ? save.choices
          .filter(function (entry) {
            return (
              isPlainObject(entry) &&
              typeof entry.nodeId === "string" &&
              typeof entry.option === "string" &&
              typeof entry.text === "string"
            );
          })
          .slice(-CHOICE_LOG_LIMIT)
          .map(function (entry) {
            return {
              chapter: typeof entry.chapter === "string" ? entry.chapter : "",
              nodeId: entry.nodeId,
              option: entry.option,
              text: entry.text,
              timedOut: entry.timedOut === true
            };
          })
      : [];

    var knownCodex = codexIds();
    state.codex = Array.isArray(save.codex)
      ? save.codex.filter(function (id, index, list) {
          return knownCodex.indexOf(id) !== -1 && list.indexOf(id) === index;
        })
      : [];

    if (save.settings !== undefined && !isPlainObject(save.settings)) return { issue: "shape", state: defaults() };
    var settings = cloneJson(DEFAULT_SETTINGS);
    if (isPlainObject(save.settings)) {
      Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
        if (typeof save.settings[key] === typeof DEFAULT_SETTINGS[key]) settings[key] = save.settings[key];
      });
    }
    settings.textSpeed = Math.round(clamp(settings.textSpeed, 10, 60));
    settings.textScale = TEXT_SCALES.indexOf(settings.textScale) === -1 ? 1 : settings.textScale;
    settings.volume = clamp(settings.volume, 0, 1);
    state.settings = settings;

    var chapterIds = ((XB.story && XB.story.chapters) || []).map(function (item) {
      return item.id;
    });
    var unlocked = Array.isArray(save.unlockedChapters)
      ? save.unlockedChapters.filter(function (id) {
          return chapterIds.indexOf(id) !== -1;
        })
      : [];
    if (unlocked.indexOf("prologue") === -1) unlocked.unshift("prologue");
    state.unlockedChapters = unlocked;

    state.ending = isPlainObject(save.ending) ? save.ending : null;

    if (save.nodeId !== null && save.nodeId !== undefined && typeof save.nodeId !== "string") {
      return { issue: "node", state: defaults() };
    }
    state.nodeId = save.nodeId === undefined ? null : save.nodeId;

    if (state.nodeId !== null) {
      var found = locate(state.chapterId, state.nodeId);
      if (!found || !isVisible(state, found.node)) {
        // 标题/地图允许带着“上次位置”，坏了就丢掉；进了剧情则必须能定位。
        if (state.scene === "vn") {
          return { issue: "node", state: defaults() };
        }
        state.nodeId = null;
      }
    }
    if (state.scene !== "title" && state.scene !== "map" && state.nodeId === null) {
      return { issue: "node", state: defaults() };
    }
    return { issue: null, state: state };
  }

  function locate(chapterId, nodeId) {
    var chapter = chapterById(chapterId);
    if (!chapter) return null;
    var nodes = chapter.nodes || [];
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].id === nodeId) return { chapter: chapter, index: i, node: nodes[i] };
    }
    return null;
  }

  function currentChapter(state) {
    return chapterById(state.chapterId);
  }

  function currentNode(state) {
    var found = locate(state.chapterId, state.nodeId);
    return found ? found.node : null;
  }

  // when 只支持“旗标真/假 + &&”：条件表在 docs/script/README.md §6，越权写法由工具 C16 拦。
  function evalWhen(state, expression) {
    if (!expression) return true;
    var terms = String(expression).split("&&");
    for (var i = 0; i < terms.length; i += 1) {
      var term = terms[i].trim();
      if (!term) continue;
      var negated = term.charAt(0) === "!";
      var key = negated ? term.slice(1).trim() : term;
      var value = state.flags[key] === true;
      if (negated ? value : !value) return false;
    }
    return true;
  }

  function isVisible(state, node) {
    if (!node) return false;
    return evalWhen(state, node.when);
  }

  function nextVisible(state, chapter, fromIndex) {
    var nodes = chapter.nodes || [];
    for (var i = fromIndex; i < nodes.length; i += 1) {
      if (isVisible(state, nodes[i])) return nodes[i];
    }
    return null;
  }

  function firstVisible(state, chapter) {
    return nextVisible(state, chapter, 0);
  }

  function startChapter(state, chapterId, nodeId) {
    var chapter = chapterById(chapterId);
    if (!chapter || !chapter.playable) {
      console.error("[XB] 章节不可进入：" + chapterId);
      return false;
    }
    var node = null;
    if (nodeId) {
      var found = locate(chapterId, nodeId);
      if (found && isVisible(state, found.node)) node = found.node;
    }
    if (!node) node = firstVisible(state, chapter);
    if (!node) {
      console.error("[XB] 章节没有可见节点：" + chapterId);
      return false;
    }
    state.scene = "vn";
    state.chapterId = chapterId;
    state.nodeId = node.id;
    return true;
  }

  // 推进 = 从当前位置往后找第一个可见节点；同位置的 a/b 分支由 when 决定，运行期只有一条线。
  function advance(state) {
    var found = locate(state.chapterId, state.nodeId);
    if (!found) return null;
    var node = nextVisible(state, found.chapter, found.index + 1);
    if (!node) return found.node;
    state.nodeId = node.id;
    return node;
  }

  function isAllowedFlag(path) {
    if (FLAG_KEYS.indexOf(path) !== -1) return true;
    for (var i = 0; i < FLAG_PREFIXES.length; i += 1) {
      if (path.indexOf(FLAG_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  // set 的三种写法：赋布尔、赋数值、"+N"/"-N" 增量；数值旗标一律夹在范围内。
  function setFlag(state, path, value) {
    if (!isAllowedFlag(path)) {
      console.error("[XB] 禁止写入旗标：" + path);
      return false;
    }
    if (path === "choice.xiangjiang.abandoned") {
      if (!Array.isArray(value)) {
        console.error("[XB] list flag 只接受数组：" + path);
        return false;
      }
      state.flags[path] = normalizeAbandoned(value);
      return true;
    }

    var current = state.flags[path];
    var next;

    if (typeof value === "boolean") {
      next = value;
    } else if (isFiniteNumber(value)) {
      next = value;
    } else if (typeof value === "string" && (value.charAt(0) === "+" || value.charAt(0) === "-")) {
      var delta = Number(value.slice(1));
      if (!isFinite(Number(current)) || isNaN(delta)) {
        console.error("[XB] 增量旗标缺少数值底：" + path + " " + value);
        return false;
      }
      next = Number(current) + (value.charAt(0) === "-" ? -delta : delta);
    } else if (typeof value === "string") {
      next = value;
    } else {
      console.error("[XB] 旗标值类型不支持：" + path);
      return false;
    }

    if (path === "item.door" || path === "item.pot") {
      next = next === true;
    } else if (FLAG_LIMITS[path]) {
      if (!isFiniteNumber(next)) {
        console.error("[XB] 数值旗标收到非数值：" + path);
        return false;
      }
      var range = FLAG_LIMITS[path];
      next = Math.round(clamp(next, range[0], range[1]));
    }

    state.flags[path] = next;
    if (path === "item.door") state.inventory.door = next;
    return true;
  }

  function applySet(state, set, sourceId) {
    if (!set) return;
    Object.keys(set).forEach(function (key) {
      if (!setFlag(state, key, set[key])) {
        console.error("[XB] " + sourceId + " 写入旗标失败：" + key);
      }
    });
  }

  // 记一条选择：旗标写 record（= 选项 value），历史写 choices（供后面的错误卡/点名引用）。
  function applyChoice(state, node, optionKey, timedOut) {
    var options = (node && node.options) || [];
    var option = null;
    for (var i = 0; i < options.length; i += 1) {
      if (options[i].key === optionKey) option = options[i];
    }
    if (!option) {
      console.error("[XB] " + (node && node.id) + " 没有选项 " + optionKey);
      return null;
    }
    applySet(state, option.set, node.id);
    if (node.record) setFlag(state, node.record, option.value);
    state.choices.push({
      chapter: state.chapterId,
      nodeId: node.id,
      option: option.key,
      text: option.text,
      timedOut: timedOut === true
    });
    if (state.choices.length > CHOICE_LOG_LIMIT) state.choices.shift();
    return option;
  }

  function serialize(state) {
    var save = {};
    PERSIST_KEYS.forEach(function (key) {
      save[key] = cloneJson(state[key]);
    });
    save.inventory = { door: !!state.inventory.door, items: cloneJson(state.inventory.items) };
    return save;
  }

  XB.core = {
    SAVE_VERSION: SAVE_VERSION,
    SCENES: SCENES,
    PERSIST_KEYS: PERSIST_KEYS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    FLAG_DEFAULTS: FLAG_DEFAULTS,
    FLAG_LIMITS: FLAG_LIMITS,
    defaults: defaults,
    normalize: normalize,
    chapterById: chapterById,
    codexById: codexById,
    locate: locate,
    currentChapter: currentChapter,
    currentNode: currentNode,
    evalWhen: evalWhen,
    isVisible: isVisible,
    firstVisible: firstVisible,
    nextVisible: nextVisible,
    startChapter: startChapter,
    advance: advance,
    setFlag: setFlag,
    applySet: applySet,
    applyChoice: applyChoice,
    serialize: serialize
  };

  /* =====================================================================
     XB.engine：DOM 层
     ===================================================================== */

  var SAVE_KEY = "xiangbei.save.v1";
  var MAX_SAVE_BYTES = 4096;
  var PAGE_HEIGHT = 66;
  var INPUT_LOCK_MS = 100;
  var CHOICE_SETTLE_MS = 240;
  var TIMEOUT_SETTLE_MS = 300;
  var AUTO_DELAY_MS = 1200;
  var SKIP_DELAY_MS = 120;
  var TITLE_CARD_MS = 1200;
  var TOAST_MS = 2500;
  var STATION_WIDTH = 132;
  var STATION_HEIGHT = 64;

  var MAP_STATIONS = [
    { id: "prologue", order: "一", name: "于都", x: 120, y: 560 },
    { id: "xiangjiang", order: "二", name: "湘江", x: 280, y: 500 },
    { id: "zunyi", order: "三", name: "遵义", x: 440, y: 450 },
    { id: "jinsha", order: "四", name: "金沙江", x: 610, y: 380 },
    { id: "luding", order: "五", name: "泸定", x: 760, y: 300 },
    { id: "grass", order: "六", name: "草地", x: 920, y: 220 },
    { id: "wuqi", order: "七", name: "吴起", x: 1060, y: 110 }
  ];

  // 与 index.html 一一对应；缺一个就报错，不静默降级（页面结构是我们自己写的）。
  var REQUIRED_IDS = [
    "stage",
    "stage-art",
    "scene-title",
    "scene-map",
    "scene-vn",
    "pause",
    "pause-menu",
    "toast",
    "debug",
    "orientation",
    "title-menu",
    "map-stations",
    "map-route",
    "vn-chapter",
    "vn-toolbar",
    "vn-auto",
    "vn-skip",
    "vn-dialogue",
    "vn-name",
    "vn-text",
    "vn-next",
    "vn-choice-prompt",
    "vn-choices",
    "vn-minigame",
    "minigame-canvas",
    "minigame-hud",
    "minigame-help",
    "minigame-live",
    "minigame-pause",
    "minigame-fallback",
    "vn-result",
    "vn-title-card",
    "vn-title-chapter",
    "vn-title-sub",
    "vn-measure",
    "vn-settings",
    "set-speed",
    "set-speed-value",
    "set-scale",
    "set-volume",
    "set-volume-value",
    "set-muted",
    "set-motion",
    "set-skip",
    "codex",
    "codex-title",
    "codex-badges",
    "codex-body",
    "codex-note",
    "codex-source",
    "codex-close"
  ];

  var state = null;
  var els = {};
  var storageOk = true;
  var saveExists = false;
  var debugEnabled = false;
  var debugExtra = "";
  var toastTimer = 0;
  var stationsBuilt = false;
  var lastFocused = null;
  var artWarned = false;
  var artResizeFrame = 0;
  var artResizeScale = 1;
  var inputLockUntil = 0;

  var autoEnabled = false;
  var skipEnabled = false;
  var autoTimer = 0;
  var seenNodes = {};

  var vnRun = {
    nodeId: null,
    pages: [""],
    pageIndex: 0,
    pageChars: [],
    charIndex: 0,
    acc: 0,
    lastTs: 0,
    typing: false,
    rafId: 0,
    paused: false,
    seen: false
  };

  var choiceRun = {
    active: false,
    node: null,
    total: 0,
    remaining: 0,
    lastTs: 0,
    rafId: 0,
    resolved: false
  };

  var titleCardState = { open: false, timer: 0, onClose: null };
  var codexState = { open: false, id: null, unlock: false, onClose: null, previousFocus: null };

  // 小游戏运行时：lastMinigameResult 只活在本页；刷新后由 p025 从 flags/inventory 重建。
  var lastMinigameResult = null;
  var minigameRun = null;
  var soloMode = false;
  var soloGameId = null;
  var soloParams = null;

  function camelize(id) {
    return id.replace(/-([a-z])/g, function (_, letter) {
      return letter.toUpperCase();
    });
  }

  function cacheElements() {
    var missing = [];
    els = {};
    REQUIRED_IDS.forEach(function (id) {
      var element = document.getElementById(id);
      if (!element) {
        missing.push(id);
        return;
      }
      els[camelize(id)] = element;
    });
    if (missing.length) {
      throw new Error("index.html 缺少元素：" + missing.join(", "));
    }
  }

  function utf8Bytes(text) {
    return new TextEncoder().encode(text).length;
  }

  function readParams() {
    return new URLSearchParams(window.location.search);
  }

  function init() {
    cacheElements();
    mountArt();
    bindInput();
    bindSettings();
    bindOverlays();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    var params = readParams();
    debugEnabled = params.get("debug") === "1";
    if (params.get("fonts") === "fallback") document.documentElement.classList.add("fonts-fallback");
    if (params.get("reset") === "1") clearSave();

    var loaded = loadSave();
    state = loaded.state;
    storageOk = loaded.storageOk;
    saveExists = loaded.exists;

    // 调试试玩：?minigame=door|abandon|boat|climb 直接进单关，不写档、不推进剧情。
    var soloGame = params.get("minigame");
    if (soloGame) {
      startSolo(soloGame, readSoloOptions(params));
      return;
    }

    applySettings();
    applyStartScene();
    render();
    updateDebug();
  }

  function loadSave() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(SAVE_KEY);
    } catch (err) {
      console.error("[XB] 读取存档失败：" + err.message);
      return { state: defaults(), storageOk: false, exists: false };
    }
    if (!raw) return { state: defaults(), storageOk: true, exists: false };

    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("[XB] 存档不是合法 JSON：" + err.message);
      backupSave("bad");
      toast("存档损坏，已重置");
      return { state: defaults(), storageOk: true, exists: false };
    }

    var result = normalize(parsed);
    if (result.issue === "version-too-new") {
      backupSave("bak");
      console.error("[XB] 存档版本过新：" + parsed.version);
      toast("存档来自更新的版本，已备份");
      return { state: defaults(), storageOk: true, exists: false };
    }
    if (result.issue) {
      backupSave("bad");
      console.error("[XB] 存档校验失败：" + result.issue);
      toast("存档与当前版本不匹配，已重置");
      return { state: defaults(), storageOk: true, exists: false };
    }
    return { state: result.state, storageOk: true, exists: true };
  }

  function backupSave(suffix) {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      if (raw === null) return;
      window.localStorage.setItem(SAVE_KEY + "." + suffix, raw);
      window.localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      console.error("[XB] 备份存档失败：" + err.message);
    }
  }

  function clearSave() {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      console.error("[XB] 清除存档失败：" + err.message);
    }
    saveExists = false;
  }

  function saveNow() {
    if (!state) return;
    if (soloMode) return;
    var json = JSON.stringify(serialize(state));
    var bytes = utf8Bytes(json);
    if (bytes > MAX_SAVE_BYTES) {
      console.error("[XB] 存档 " + bytes + " 字节，超过上限 " + MAX_SAVE_BYTES);
      toast("存档异常：本局无法继续保存");
      debugExtra = "存档超限 " + bytes + " B";
      updateDebug();
      return;
    }
    try {
      window.localStorage.setItem(SAVE_KEY, json);
      storageOk = true;
    } catch (err) {
      console.error("[XB] 写入存档失败：" + err.message);
      storageOk = false;
      toast("本局无法存档（浏览器限制），进度只在本次有效");
    }
    debugExtra = "save=" + bytes + " B";
    updateDebug();
  }

  // 刷新后的落点：vn 就回到原句，title/map 保持原样；定位不到的档已在 normalize 里回默认。
  function applyStartScene() {
    if (state.scene === "title" || state.scene === "map") return;
    if (state.scene !== "vn") {
      state.scene = "map";
      return;
    }
    var node = currentNode(state);
    if (node && isVisible(state, node)) return;
    if (!startChapter(state, state.chapterId)) state = defaults();
  }

  function resize() {
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    if (!width || !height) return;
    var scale = Math.min(width / 1280, height / 720);
    document.documentElement.style.setProperty("--scale", String(scale));
    scheduleArtResize(scale);
    if (XB.minigames && typeof XB.minigames.resize === "function" && XB.minigames.isActive()) {
      XB.minigames.resize();
    }
  }

  function mountArt() {
    if (!XB.art || typeof XB.art.mount !== "function") {
      console.error("[XB] art.js 未就位");
      return;
    }
    try {
      XB.art.mount(els.stageArt);
    } catch (err) {
      console.error("[XB] 画布挂载失败：" + err.message);
      els.stageArt.hidden = true;
    }
  }

  function paintStage(sceneId) {
    if (!sceneId || !XB.art || typeof XB.art.paint !== "function") return;
    try {
      XB.art.paint(els.stageArt, sceneId);
    } catch (err) {
      console.error("[XB] 版画绘制失败（" + sceneId + "）：" + err.message);
      els.stageArt.hidden = true;
      if (!artWarned) {
        artWarned = true;
        toast("插画加载失败，文字照常可读");
      }
    }
  }

  // 尺寸更新用 rAF 合并：resize 事件一秒钟可能来几十次，画布只该重画一次。
  function scheduleArtResize(scale) {
    artResizeScale = scale;
    if (artResizeFrame) return;
    artResizeFrame = requestAnimationFrame(function () {
      artResizeFrame = 0;
      if (!XB.art || typeof XB.art.resize !== "function") return;
      try {
        XB.art.resize(artResizeScale);
      } catch (err) {
        console.error("[XB] 画布尺寸更新失败：" + err.message);
      }
      updateDebug();
    });
  }

  function updateDebug() {
    if (!debugEnabled) {
      els.debug.hidden = true;
      return;
    }
    var node = currentNode(state);
    var lines = [
      "scene   " + state.scene,
      "chapter " + state.chapterId,
      "node    " + (state.nodeId || "—") + (node ? " (" + node.type + ")" : ""),
      "door    " + state.flags["item.door"] + "  fire=" + state.flags.fire + "  load=" + state.flags.load,
      "choice  " + describeFlag("choice.prologue.door") + " / lookback=" + describeFlag("choice.prologue.lookback"),
      "log     " + state.choices.length,
      "canvas  " + els.stageArt.width + "×" + els.stageArt.height
    ];
    if (debugExtra) lines.push("· " + debugExtra);
    els.debug.hidden = false;
    els.debug.textContent = lines.join("\n");
  }

  function describeFlag(key) {
    var value = state.flags[key];
    return value === undefined ? "—" : String(value);
  }

  function showScene(name) {
    els.stage.dataset.scene = name;
    els.sceneTitle.hidden = name !== "title";
    els.sceneMap.hidden = name !== "map";
    els.sceneVn.hidden = name !== "vn";
  }

  function render() {
    if (!state) return;
    if (state.scene !== "vn") {
      cancelTyping();
      cancelChoiceTimer();
    }
    showScene(state.scene);
    if (state.scene === "title") renderTitle();
    else if (state.scene === "map") renderMap();
    else if (state.scene === "vn") renderVn(currentNode(state));
    updateDebug();
  }

  function renderTitle() {
    paintStage("title");
    var button = els.titleMenu.querySelector('[data-action="continue"]');
    if (button) button.setAttribute("aria-disabled", saveExists ? "false" : "true");
  }

  function buildStations() {
    if (stationsBuilt) return;
    MAP_STATIONS.forEach(function (station) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "map-station";
      button.style.left = station.x + "px";
      button.style.top = station.y + "px";
      button.style.width = STATION_WIDTH + "px";
      button.style.height = STATION_HEIGHT + "px";
      button.dataset.action = "station";
      button.dataset.chapter = station.id;

      var order = document.createElement("span");
      order.className = "station-order";
      order.textContent = station.order;
      var name = document.createElement("span");
      name.className = "station-name";
      name.textContent = station.name;
      var status = document.createElement("span");
      status.className = "station-state";

      button.append(order, name, status);
      els.mapStations.append(button);
    });
    stationsBuilt = true;
  }

  function renderMap() {
    paintStage("map");
    buildStations();
    Array.prototype.forEach.call(els.mapStations.querySelectorAll(".map-station"), function (button) {
      var chapter = chapterById(button.dataset.chapter);
      if (!chapter) return;
      var unlocked = state.unlockedChapters.indexOf(chapter.id) !== -1;
      var playable = chapter.playable === true && unlocked;
      // 未接入的章节只要解锁就允许点：进去会明确告诉玩家「这一段还没接上」，而不是装作没有站。
      button.classList.toggle("is-locked", !unlocked);
      button.setAttribute("aria-disabled", unlocked ? "false" : "true");
      button.querySelector(".station-state").textContent = playable ? "可进入" : unlocked ? "待续" : "未解锁";
      button.setAttribute("aria-label", chapter.title + (playable ? "，可进入" : unlocked ? "，待接入" : "，未解锁"));
    });
  }

  // 背景沿章节顺序往前找最近一条 bg 指令：作者只在换景处写一次。
  function backgroundAt(chapter, index) {
    var nodes = chapter.nodes || [];
    for (var i = index; i >= 0; i -= 1) {
      if (nodes[i] && nodes[i].bg) return nodes[i].bg;
    }
    return null;
  }

  function hidePanels() {
    els.vnChoices.hidden = true;
    els.vnChoicePrompt.hidden = true;
    els.vnMinigame.hidden = true;
    els.vnResult.hidden = true;
    els.vnToolbar.hidden = true;
  }

  function renderVn(node) {
    var found = locate(state.chapterId, state.nodeId);
    if (!found) {
      console.error("[XB] 节点丢失：" + state.nodeId);
      toast("剧情定位失败，回到地图");
      go("map");
      return;
    }
    if (!isVisible(state, found.node)) {
      // 理论上不会发生：advance/startChapter 只落在可见节点上。
      console.error("[XB] 落到了不可见节点：" + found.node.id);
    }
    els.vnChapter.textContent = found.chapter.title;
    var bg = backgroundAt(found.chapter, found.index);
    if (bg) paintStage(bg);

    hidePanels();
    vnRun.nodeId = found.node.id;

    switch (found.node.type) {
      case "line":
        renderLine(found.node);
        break;
      case "choice":
        renderChoice(found.node);
        break;
      case "minigame":
        startMinigameForNode(found.node);
        break;
      case "result":
        renderResult(found.node);
        break;
      case "title":
        showTitleCard(found.node.text, found.node.sub, advanceVn);
        break;
      case "codex":
        openCodex(found.node.codexId, { unlock: true, onClose: advanceVn });
        break;
      case "end":
        finishChapter(found.node);
        break;
      default:
        console.error("[XB] 未知节点类型：" + found.node.type + "（" + found.node.id + "）");
        toast("节点类型未接入：" + found.node.type);
    }
    updateDebug();
  }

  /* ---------------- 打字机与分页 ---------------- */

  function charMsForSpeed() {
    return clamp(1000 / state.settings.textSpeed, 12, 100);
  }

  function prefersReduced() {
    if (state.settings.reducedMotion) return true;
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function renderLine(node) {
    els.vnDialogue.hidden = false;
    els.vnToolbar.hidden = false;
    updateToolbar();
    els.vnName.textContent = node.speaker || "";
    els.vnName.hidden = !node.speaker || node.speaker === "旁白";

    vnRun.seen = seenNodes[node.id] === true;
    seenNodes[node.id] = true;
    vnRun.pages = paginate(node.text || "");
    vnRun.pageIndex = 0;
    startPage();
    if (skipEnabled && vnRun.seen) {
      finishPageNow();
      scheduleAdvance(SKIP_DELAY_MS);
    }
  }

  // 按字符二分：把整段文本切成“填满正文框”的若干页。
  function paginate(text) {
    var chars = Array.from(text || "");
    if (!chars.length) return [""];
    var pages = [];
    var rest = chars;
    while (rest.length) {
      var take = fitChars(rest);
      pages.push(rest.slice(0, take).join(""));
      rest = rest.slice(take);
    }
    return pages;
  }

  function fitChars(chars) {
    var low = 1;
    var high = chars.length;
    var best = 1;
    while (low <= high) {
      var mid = Math.floor((low + high) / 2);
      els.vnMeasure.textContent = chars.slice(0, mid).join("");
      if (els.vnMeasure.scrollHeight <= PAGE_HEIGHT) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return best;
  }

  function startPage() {
    var page = vnRun.pages[vnRun.pageIndex] || "";
    vnRun.pageChars = Array.from(page);
    vnRun.charIndex = 0;
    vnRun.acc = 0;
    vnRun.lastTs = 0;
    vnRun.typing = true;
    vnRun.paused = false;
    els.vnText.textContent = "";
    els.vnNext.textContent = "";
    if (prefersReduced()) {
      finishPageNow();
      return;
    }
    cancelTyping();
    vnRun.rafId = requestAnimationFrame(typeStep);
  }

  function typeStep(timestamp) {
    if (!vnRun.typing || state.paused) return;
    if (!vnRun.lastTs) vnRun.lastTs = timestamp;
    vnRun.acc += timestamp - vnRun.lastTs;
    vnRun.lastTs = timestamp;
    var charMs = charMsForSpeed();
    var add = Math.floor(vnRun.acc / charMs);
    if (add > 0) {
      vnRun.acc -= add * charMs;
      vnRun.charIndex = Math.min(vnRun.charIndex + add, vnRun.pageChars.length);
      els.vnText.textContent = vnRun.pageChars.slice(0, vnRun.charIndex).join("");
    }
    if (vnRun.charIndex >= vnRun.pageChars.length) {
      finishPageNow();
      return;
    }
    vnRun.rafId = requestAnimationFrame(typeStep);
  }

  function finishPageNow() {
    vnRun.typing = false;
    cancelTyping();
    vnRun.charIndex = vnRun.pageChars.length;
    els.vnText.textContent = vnRun.pages[vnRun.pageIndex] || "";
    var lastPage = vnRun.pageIndex >= vnRun.pages.length - 1;
    els.vnNext.textContent = lastPage ? "▼" : "▼ " + (vnRun.pageIndex + 1) + "/" + vnRun.pages.length;
    if (skipEnabled && vnRun.seen) scheduleAdvance(SKIP_DELAY_MS);
    else if (autoEnabled) scheduleAdvance(AUTO_DELAY_MS);
  }

  function cancelTyping() {
    if (vnRun.rafId) cancelAnimationFrame(vnRun.rafId);
    vnRun.rafId = 0;
  }

  function cancelAuto() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = 0;
    }
  }

  function scheduleAdvance(delay) {
    cancelAuto();
    autoTimer = window.setTimeout(function () {
      autoTimer = 0;
      if (autoEnabled || skipEnabled) advanceInput();
    }, delay);
  }

  // 一次点击三种意思：补全本页 → 翻下一页 → 下一句。
  function advanceInput() {
    if (!state || state.scene !== "vn" || state.paused) return;
    if (titleCardState.open || codexState.open) return;
    if (performance.now() < inputLockUntil) return;
    var node = currentNode(state);
    if (!node || node.type !== "line") return;
    cancelAuto();
    if (vnRun.typing) {
      finishPageNow();
      return;
    }
    if (vnRun.pageIndex < vnRun.pages.length - 1) {
      vnRun.pageIndex += 1;
      startPage();
      return;
    }
    advanceVn();
  }

  function advanceVn() {
    cancelAuto();
    inputLockUntil = performance.now() + INPUT_LOCK_MS;
    var next = advance(state);
    if (!next) {
      toast("这段到此为止");
      return;
    }
    saveNow();
    renderVn(next);
  }

  /* ---------------- 限时选项 ---------------- */

  function renderChoice(node) {
    els.vnChoices.hidden = false;
    els.vnChoicePrompt.hidden = !node.prompt;
    els.vnChoicePrompt.textContent = node.prompt || "";
    els.vnChoices.textContent = "";
    els.vnChoices.style.setProperty("--choice-progress", "1");

    (node.options || []).forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "xb-choice";
      button.dataset.action = "choose";
      button.dataset.key = option.key;

      var index = document.createElement("span");
      index.className = "xb-choice__index";
      index.textContent = option.key;
      var label = document.createElement("span");
      label.className = "xb-choice__label";
      label.textContent = option.text;
      var cost = document.createElement("span");
      cost.className = "xb-choice__cost";
      cost.textContent = "代价 · " + option.cost;
      var timer = document.createElement("span");
      timer.className = "xb-choice__timer";
      var fill = document.createElement("i");
      timer.append(fill);

      button.append(index, label, cost, timer);
      els.vnChoices.append(button);
    });

    choiceRun.node = node;
    choiceRun.resolved = false;
    startChoiceTimer(node);
  }

  function startChoiceTimer(node) {
    cancelChoiceTimer();
    if (!node.timeout) return;
    choiceRun.active = true;
    choiceRun.total = node.timeout * 1000;
    choiceRun.remaining = choiceRun.total;
    choiceRun.lastTs = 0;
    choiceRun.resolved = false;
    choiceRun.rafId = requestAnimationFrame(stepChoiceTimer);
  }

  // 倒计时用 rAF 累计时间：暂停时把 lastTs 清零跳过这一段，恢复后不会“偷走”时间。
  function stepChoiceTimer(timestamp) {
    if (!choiceRun.active || choiceRun.resolved) return;
    if (state.paused) {
      choiceRun.lastTs = 0;
      choiceRun.rafId = requestAnimationFrame(stepChoiceTimer);
      return;
    }
    if (!choiceRun.lastTs) choiceRun.lastTs = timestamp;
    choiceRun.remaining = Math.max(0, choiceRun.remaining - (timestamp - choiceRun.lastTs));
    choiceRun.lastTs = timestamp;
    els.vnChoices.style.setProperty("--choice-progress", String(choiceRun.total ? choiceRun.remaining / choiceRun.total : 0));
    if (choiceRun.remaining <= 0) {
      resolveChoice(choiceRun.node.defaultOption, true);
      return;
    }
    choiceRun.rafId = requestAnimationFrame(stepChoiceTimer);
  }

  function cancelChoiceTimer() {
    choiceRun.active = false;
    if (choiceRun.rafId) cancelAnimationFrame(choiceRun.rafId);
    choiceRun.rafId = 0;
  }

  function resolveChoice(key, timedOut) {
    var node = currentNode(state);
    if (!node || node.type !== "choice") return;
    if (choiceRun.resolved) return;
    choiceRun.resolved = true;
    cancelChoiceTimer();

    var option = applyChoice(state, node, key, timedOut);
    if (!option) {
      toast("选项数据异常，已按默认项继续");
      return;
    }
    markChoice(node, key, timedOut);
    saveNow();
    if (timedOut) toast("超时：已按默认选项结算 —— " + option.text + "（" + option.cost + "）");
    debugExtra = "choice=" + key + (timedOut ? " 超时" : "");
    updateDebug();

    var settle = timedOut ? TIMEOUT_SETTLE_MS : CHOICE_SETTLE_MS;
    window.setTimeout(function onSettle() {
      if (!state || state.scene !== "vn" || !choiceRun.resolved) return;
      if (state.paused) {
        window.setTimeout(onSettle, 200);
        return;
      }
      hideChoicePanel();
      advanceVn();
    }, settle);
  }

  function markChoice(node, key, timedOut) {
    Array.prototype.forEach.call(els.vnChoices.querySelectorAll(".xb-choice"), function (button) {
      var selected = button.dataset.key === key;
      button.classList.toggle("is-selected", selected);
      button.classList.toggle("is-disabled", !selected);
      button.classList.toggle("is-timeout", selected && timedOut);
    });
  }

  function hideChoicePanel() {
    cancelChoiceTimer();
    els.vnChoices.hidden = true;
    els.vnChoicePrompt.hidden = true;
  }

  /* ---------------- 小游戏接入与结算 ---------------- */

  var MINIGAME_LABEL = { door: "门板", abandon: "弃物", boat: "渡口", climb: "铁索" };
  var MINIGAME_HELP = {
    door: "行囊 6 格；门板占 2 格，不能丢。点或拖动货架上的物品装进/取出；按 1–5 也能切换。空格或 Enter 系好行囊。",
    abandon: "两批船，每批最多 3 件；点物品上船或下船。第一船发出后追兵开始逼近，带重物会拖慢。空格或 Enter 发船。",
    boat: "点船派 8 人过江；点船卡右下「歇」让一条船休息。按 1–6 派船，Shift+1–6 歇。渡满 18 趟或时间到结束。",
    climb: "等光圈收拢到目标时点一下；点空会熄灭一盏。火墙出现时连点三下。空格或 Enter 也可以点。"
  };

  function createContinueButton(kind) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "xb-btn xb-btn--sm " + kind;
    button.dataset.action = "continue-node";
    button.textContent = "继续";
    return button;
  }

  function minigameLabel(id) {
    if (XB.minigames && typeof XB.minigames.labelFor === "function") {
      var label = XB.minigames.labelFor(id);
      if (label) return label;
    }
    return id;
  }

  function idsFromRefs(refs) {
    var ids = [];
    (refs || []).forEach(function (ref) {
      var id = typeof ref === "string" ? ref : ref && ref.id;
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  function refsFromIds(ids) {
    return (ids || []).map(function (id) {
      return { id: id, label: minigameLabel(id) };
    });
  }

  function listFromRefs(refs) {
    return (refs || []).map(function (ref) {
      return typeof ref === "string" ? minigameLabel(ref) : ref.label || minigameLabel(ref.id);
    });
  }

  function resultReasonText(reason) {
    if (reason === "time") return "时间到";
    if (reason === "quit") return "提前收手";
    if (reason === "error") return "出错后按当前结果继续";
    return "完成";
  }

  function stopMinigame() {
    if (XB.minigames && typeof XB.minigames.stop === "function" && XB.minigames.isActive()) {
      XB.minigames.stop();
    }
    minigameRun = null;
    if (els.vnMinigame) els.vnMinigame.hidden = true;
    if (els.minigamePause) els.minigamePause.hidden = true;
    if (els.minigameFallback) els.minigameFallback.hidden = true;
  }

  function beginMinigame(gameId, options) {
    options = options || {};
    if (!XB.minigames || typeof XB.minigames.start !== "function") {
      console.error("[XB] minigames.js 未就位");
      return false;
    }
    var node = options.node || null;
    var initial = options.initial || {};
    if (options.solo !== true) lastMinigameResult = null;
    minigameRun = { gameId: gameId, nodeId: node ? node.id : null, solo: options.solo === true };
    soloMode = options.solo === true;

    els.vnMinigame.hidden = false;
    els.minigameFallback.hidden = true;
    els.minigamePause.hidden = false;
    els.minigameHud.textContent = MINIGAME_LABEL[gameId] || gameId;
    els.minigameHelp.textContent = MINIGAME_HELP[gameId] || "";
    els.minigameLive.textContent = "";
    els.minigameCanvas.setAttribute("aria-label", (MINIGAME_LABEL[gameId] || "小游戏") + "画面：" + (MINIGAME_HELP[gameId] || ""));

    var started = XB.minigames.start({
      gameId: gameId,
      canvas: els.minigameCanvas,
      config: node ? node.config : null,
      hud: els.minigameHud,
      help: els.minigameHelp,
      live: els.minigameLive,
      initial: {
        hasDoor: initial.hasDoor !== undefined ? initial.hasDoor === true : state.flags["item.door"] === true,
        trust: initial.trust !== undefined ? Number(initial.trust) || 0 : Number(state.flags.trust) || 0,
        fire: initial.fire !== undefined ? Number(initial.fire) || 0 : Number(state.flags.fire) || 0,
        lights: initial.lights !== undefined ? Number(initial.lights) || 0 : Number(state.flags.lights_lost) || 0
      },
      callbacks: {
        onEnd: handleMinigameEnd,
        isPaused: function () {
          return !!(state && state.paused);
        },
        isReducedMotion: prefersReduced,
        toast: toast
      }
    });

    if (!started) {
      minigameRun = null;
      soloMode = false;
      els.vnMinigame.hidden = true;
      els.minigamePause.hidden = true;
      els.minigameFallback.hidden = false;
      return false;
    }
    return true;
  }

  function startMinigameForNode(node) {
    if (!node || !node.game) {
      console.error("[XB] 小游戏节点缺少 game：" + (node && node.id));
      toast("小游戏数据缺失，按剧情继续");
      advance(state);
      render();
      return;
    }
    if (minigameRun && minigameRun.nodeId === node.id && XB.minigames && XB.minigames.isActive()) {
      els.vnMinigame.hidden = false;
      els.minigamePause.hidden = false;
      return;
    }
    stopMinigame();
    if (!beginMinigame(node.game, { node: node })) {
      toast("小游戏未能启动，按剧情继续");
      var fallback = advance(state);
      if (!fallback) {
        go("map");
        return;
      }
      saveNow();
      render();
    }
  }

  function handleMinigameEnd(result) {
    var run = minigameRun;
    minigameRun = null;
    els.vnMinigame.hidden = true;
    els.minigamePause.hidden = true;
    els.minigameFallback.hidden = true;
    if (!run) return;

    if (run.solo || soloMode) {
      soloMode = true;
      renderSoloResult(result || { gameId: run.gameId, reason: "error", carried: [], left: [], stats: {} });
      return;
    }

    if (!state || state.scene !== "vn") return;
    lastMinigameResult = result || null;
    if (result) applyMinigameResult(result);
    if (result && result.reason === "error") toast("小游戏出错，已按当前结果继续");
    var next = advance(state);
    if (!next) {
      console.error("[XB] 小游戏之后没有结果节点");
      go("map");
      return;
    }
    saveNow();
    render();
  }

  function applyMinigameResult(result) {
    var stats = result.stats || {};
    if (result.gameId === "door") {
      var doorIds = idsFromRefs(result.carried);
      var selected = doorIds.filter(function (id) {
        return DOOR_OPTIONAL_IDS.indexOf(id) !== -1;
      });
      var items = ["roster", "pencil"];
      selected.forEach(function (id) {
        if (items.indexOf(id) === -1) items.push(id);
      });
      state.inventory.items = items;
      setFlag(state, "item.pot", selected.indexOf("pot") !== -1);
      return;
    }
    if (result.gameId === "abandon") {
      var left = idsFromRefs(result.left);
      setFlag(state, "choice.xiangjiang.abandoned", left);
      if (left.indexOf("door") !== -1) setFlag(state, "item.door", false);
      if (left.indexOf("medkit") !== -1) setFlag(state, "fire", "-15");
      return;
    }
    if (result.gameId === "boat") {
      setFlag(state, "choice.jinsha.trips", Number(stats.trips) || 0);
      return;
    }
    if (result.gameId === "climb") {
      var lost = Number(stats.lost) || 0;
      setFlag(state, "lights_lost", lost);
      setFlag(state, "fire", "-" + 5 * Math.min(lost, 3));
    }
  }

  function buildResultView(node) {
    var gameId = node.game || (lastMinigameResult && lastMinigameResult.gameId) || null;
    var runtime = lastMinigameResult && (!gameId || lastMinigameResult.gameId === gameId) ? lastMinigameResult : null;
    var view = {
      title: node.title || "结算",
      note: node.note || "",
      stats: "",
      lists: []
    };

    if (node.source !== "minigame" || !gameId) {
      (node.lists || []).forEach(function (list) {
        if (!evalWhen(state, list.when)) return;
        view.lists.push({ heading: list.heading, items: (list.items || []).slice() });
      });
      return view;
    }

    if (gameId === "door") {
      var carriedIds = runtime ? idsFromRefs(runtime.carried) : [];
      var leftIds = runtime ? idsFromRefs(runtime.left) : [];
      if (!runtime) {
        carriedIds = (state.inventory.door ? ["door"] : []).concat(
          state.inventory.items.filter(function (id) {
            return DOOR_OPTIONAL_IDS.indexOf(id) !== -1;
          })
        );
        leftIds = DOOR_OPTIONAL_IDS.filter(function (id) {
          return carriedIds.indexOf(id) === -1;
        });
      }
      var hasDoor = carriedIds.indexOf("door") !== -1;
      var selected = carriedIds.filter(function (id) {
        return DOOR_OPTIONAL_IDS.indexOf(id) !== -1;
      });
      var used = XB.minigames && typeof XB.minigames.usedSlots === "function"
        ? XB.minigames.usedSlots(selected, hasDoor)
        : 0;
      view.stats = "行囊 " + used + "/6 格" + (hasDoor ? " · 门板占 2 格" : "");
      view.note = (node.note || "") + " 花名册和铅笔一直贴身带着。";
      view.lists = [
        { heading: "带走的", items: listFromRefs(refsFromIds(carriedIds)) },
        { heading: "留下的", items: listFromRefs(refsFromIds(leftIds)) }
      ];
      return view;
    }

    if (gameId === "abandon") {
      var leftAbandon = runtime ? idsFromRefs(runtime.left) : (state.flags["choice.xiangjiang.abandoned"] || []);
      var carriedAbandon = ABANDON_ORDER.filter(function (id) {
        return leftAbandon.indexOf(id) === -1 && (id !== "door" || state.inventory.door === true);
      });
      view.stats = runtime
        ? "两船已发 · 追兵 " + (runtime.stats && runtime.stats.enemyRemaining !== null ? Math.round(runtime.stats.enemyRemaining) + " 秒" : "未至")
        : "两船已发";
      view.lists = [
        { heading: "带上船", items: listFromRefs(refsFromIds(carriedAbandon)) },
        { heading: "留在岸上", items: listFromRefs(refsFromIds(leftAbandon)) }
      ];
      return view;
    }

    if (gameId === "boat") {
      var trips = runtime && runtime.stats ? Number(runtime.stats.trips) || 0 : Number(state.flags["choice.jinsha.trips"]) || 0;
      view.stats = "已渡 " + trips + "/18 趟";
      if (runtime && runtime.stats) {
        view.stats += " · 船工 " + (Number(runtime.stats.boatmen) || 0) + " 人";
      }
      return view;
    }

    if (gameId === "climb") {
      var lostLights = runtime && runtime.stats ? Number(runtime.stats.lost) || 0 : Number(state.flags.lights_lost) || 0;
      if (runtime && runtime.stats && typeof runtime.stats.reached === "number") {
        view.stats = "过去 " + runtime.stats.reached + " 个 · 暗了 " + lostLights + " 个 · 其余 " + Math.max(0, 22 - runtime.stats.reached - lostLights) + " 亮着";
      } else {
        view.stats = "暗了 " + lostLights + " 个，其余 " + Math.max(0, 22 - lostLights) + " 亮着";
      }
      return view;
    }

    return view;
  }

  function renderResult(node) {
    var view = buildResultView(node);
    els.vnResult.hidden = false;
    els.vnResult.textContent = "";

    var title = document.createElement("p");
    title.className = "vn-result__title";
    title.textContent = view.title;
    var note = document.createElement("p");
    note.className = "vn-result__note";
    note.textContent = view.note;
    var stats = document.createElement("p");
    stats.className = "vn-result__stats";
    stats.textContent = view.stats;
    var lists = document.createElement("div");
    lists.className = "vn-result__lists";

    view.lists.forEach(function (list) {
      // 没有内容的栏不画标题：不带门板时五件家当全带走，"留下的"会是空栏。
      if (!list.items || !list.items.length) return;
      var column = document.createElement("div");
      var heading = document.createElement("h3");
      heading.className = "vn-result__heading";
      heading.textContent = list.heading;
      var items = document.createElement("ul");
      items.className = "vn-result__items";
      list.items.forEach(function (text) {
        var item = document.createElement("li");
        item.textContent = text;
        items.append(item);
      });
      column.append(heading, items);
      lists.append(column);
    });

    els.vnResult.append(title, note);
    if (view.stats) els.vnResult.append(stats);
    if (view.lists.length) els.vnResult.append(lists);
    var more = createContinueButton("vn-result__more");
    els.vnResult.append(more);
    // 焦点落在结算容器而不是底部按钮：结果区可滚动，直接 focus 按钮会把标题滚出首屏。
    els.vnResult.tabIndex = -1;
    els.vnResult.focus({ preventScroll: true });
  }

  function soloStatsText(result) {
    var stats = result.stats || {};
    if (result.gameId === "door") {
      var ids = idsFromRefs(result.carried);
      var selected = ids.filter(function (id) {
        return DOOR_OPTIONAL_IDS.indexOf(id) !== -1;
      });
      var used = XB.minigames && typeof XB.minigames.usedSlots === "function"
        ? XB.minigames.usedSlots(selected, ids.indexOf("door") !== -1)
        : 0;
      return "行囊 " + used + "/6 格";
    }
    if (result.gameId === "abandon") {
      var enemy = stats.enemyRemaining;
      return "追兵 " + (enemy === null || enemy === undefined ? "未至" : Math.round(enemy) + " 秒") + " · 已发 " + (Number(stats.batches) || 0) + " 船";
    }
    if (result.gameId === "boat") {
      return "已渡 " + (Number(stats.trips) || 0) + "/18 趟 · 船工 " + (Number(stats.boatmen) || 0) + " 人";
    }
    if (result.gameId === "climb") {
      return "过去 " + (Number(stats.reached) || 0) + " 个 · 暗了 " + (Number(stats.lost) || 0) + " 个 · 其余 " + (Number(stats.unlit) || 0) + " 亮着";
    }
    return "";
  }

  function renderSoloResult(result) {
    var gameId = result.gameId || soloGameId;
    els.vnResult.hidden = false;
    els.vnResult.textContent = "";

    var title = document.createElement("p");
    title.className = "vn-result__title";
    title.textContent = "调试试玩";
    var note = document.createElement("p");
    note.className = "vn-result__note";
    note.textContent = (MINIGAME_LABEL[gameId] || gameId) + " · " + resultReasonText(result.reason);
    var stats = document.createElement("p");
    stats.className = "vn-result__stats";
    var soloStats = soloStatsText(result);
    stats.textContent = "用时 " + (Number(result.elapsed) || 0).toFixed(1) + " 秒" + (soloStats ? " · " + soloStats : "");

    var lists = document.createElement("div");
    lists.className = "vn-result__lists";
    if (result.carried && result.carried.length) {
      var carried = document.createElement("div");
      var carriedHeading = document.createElement("h3");
      carriedHeading.className = "vn-result__heading";
      carriedHeading.textContent = "带走的";
      var carriedList = document.createElement("ul");
      carriedList.className = "vn-result__items";
      listFromRefs(result.carried).forEach(function (text) {
        var item = document.createElement("li");
        item.textContent = text;
        carriedList.append(item);
      });
      carried.append(carriedHeading, carriedList);
      lists.append(carried);
    }
    if (result.left && result.left.length) {
      var left = document.createElement("div");
      var leftHeading = document.createElement("h3");
      leftHeading.className = "vn-result__heading";
      leftHeading.textContent = "留下的";
      var leftList = document.createElement("ul");
      leftList.className = "vn-result__items";
      listFromRefs(result.left).forEach(function (text) {
        var item = document.createElement("li");
        item.textContent = text;
        leftList.append(item);
      });
      left.append(leftHeading, leftList);
      lists.append(left);
    }

    var replay = document.createElement("button");
    replay.type = "button";
    replay.className = "xb-btn xb-btn--sm";
    replay.dataset.action = "solo-replay";
    replay.textContent = "再玩一次";
    var home = document.createElement("button");
    home.type = "button";
    home.className = "xb-btn xb-btn--sm";
    home.dataset.action = "solo-title";
    home.textContent = "回标题";
    var actions = document.createElement("div");
    actions.className = "vn-result__actions";
    actions.append(replay, home);

    els.vnResult.append(title, note, stats);
    if (lists.childNodes.length) els.vnResult.append(lists);
    els.vnResult.append(actions);
    els.vnResult.tabIndex = -1;
    els.vnResult.focus({ preventScroll: true });
  }

  function finishChapter(node) {
    var nextId = node.next || null;
    if (nextId) {
      var chapter = chapterById(nextId);
      if (chapter && state.unlockedChapters.indexOf(nextId) === -1) {
        state.unlockedChapters.push(nextId);
        toast("「" + chapter.title + "」已解锁；本步只做到序章");
      } else {
        toast("序章到此（试玩版）");
      }
    }
    state.nodeId = null;
    go("map");
  }

  /* ---------------- 标题卡与史实注 ---------------- */

  function showTitleCard(text, sub, onClose) {
    titleCardState.open = true;
    titleCardState.onClose = onClose || null;
    els.vnTitleChapter.textContent = text || "";
    els.vnTitleSub.textContent = sub || "";
    els.vnTitleSub.hidden = !sub;
    els.vnTitleCard.hidden = false;
    els.vnToolbar.hidden = true;
    cancelAuto();
    cancelTyping();
    vnRun.typing = false;
    clearTimeout(titleCardState.timer);
    titleCardState.timer = window.setTimeout(closeTitleCard, TITLE_CARD_MS);
  }

  function closeTitleCard() {
    if (!titleCardState.open) return;
    titleCardState.open = false;
    clearTimeout(titleCardState.timer);
    titleCardState.timer = 0;
    els.vnTitleCard.hidden = true;
    var callback = titleCardState.onClose;
    titleCardState.onClose = null;
    if (callback) callback();
  }

  function badgeClassFor(text) {
    if (text.indexOf("史实") !== -1) return "xb-badge--fact";
    if (text.indexOf("回忆录") !== -1) return "xb-badge--memoir";
    if (text.indexOf("文学") !== -1) return "xb-badge--literature";
    return "xb-badge--memoir";
  }

  function openCodex(id, options) {
    var card = codexById(id);
    if (!card) {
      console.error("[XB] 找不到史实注：" + id);
      toast("史实注缺失：" + id);
      return;
    }
    codexState.open = true;
    codexState.id = id;
    codexState.unlock = !!(options && options.unlock);
    codexState.onClose = (options && options.onClose) || null;
    codexState.previousFocus = document.activeElement;

    els.codexTitle.textContent = card.title;
    els.codexBadges.textContent = "";
    String(card.type)
      .split("＋")
      .forEach(function (part) {
        var text = part.trim();
        if (!text) return;
        var badge = document.createElement("span");
        badge.className = "xb-badge " + badgeClassFor(text);
        badge.textContent = text;
        els.codexBadges.append(badge);
      });

    els.codexBody.textContent = "";
    var paragraph = document.createElement("p");
    paragraph.textContent = card.body;
    els.codexBody.append(paragraph);
    els.codexNote.hidden = !card.note;
    els.codexNote.textContent = card.note || "";
    els.codexSource.textContent = "出处：" + card.source;
    els.codexBody.scrollTop = 0;
    els.codex.hidden = false;
    els.codexClose.focus();
  }

  function closeCodex() {
    if (!codexState.open) return;
    codexState.open = false;
    els.codex.hidden = true;
    if (codexState.unlock && codexState.id) unlockCodex(codexState.id);

    var previous = codexState.previousFocus;
    var callback = codexState.onClose;
    codexState.id = null;
    codexState.unlock = false;
    codexState.onClose = null;
    codexState.previousFocus = null;

    if (previous && previous.focus && previous !== document.body) previous.focus();
    if (callback) callback();
  }

  function unlockCodex(id) {
    if (state.codex.indexOf(id) !== -1) return;
    state.codex.push(id);
    saveNow();
    toast("史实注已记入图鉴：" + codexById(id).title);
  }

  /* ---------------- 场景与暂停 ---------------- */

  function go(scene) {
    stopMinigame();
    cancelAuto();
    cancelChoiceTimer();
    cancelTyping();
    state.scene = scene;
    render();
    saveNow();
  }

  function startNewGame() {
    if (saveExists && !window.confirm("开始新游戏会清空当前进度，确定吗？")) return;
    stopMinigame();
    soloMode = false;
    soloGameId = null;
    soloParams = null;
    lastMinigameResult = null;
    setSoloPauseButtons(false);
    clearSave();
    state = defaults();
    if (!startChapter(state, "prologue")) {
      toast("序章没能载入");
      return;
    }
    applySettings();
    showScene("vn");
    els.vnChapter.textContent = chapterById("prologue").title;
    els.vnText.textContent = "";
    els.vnName.hidden = true;
    els.vnNext.textContent = "";
    els.vnToolbar.hidden = true;
    paintStage("yudu_river");
    saveNow();
    saveExists = true;
    showTitleCard("序章 · 于都", "一九三四年 · 十月", function () {
      renderVn(currentNode(state));
    });
  }

  function resumeGame() {
    stopMinigame();
    if (state.scene !== "title") {
      render();
      return;
    }
    var found = state.nodeId ? locate(state.chapterId, state.nodeId) : null;
    if (!found || !isVisible(state, found.node)) {
      toast("没有可以继续的进度");
      return;
    }
    state.scene = "vn";
    render();
    saveNow();
  }

  function enterStation(chapterId) {
    stopMinigame();
    var chapter = chapterById(chapterId);
    if (!chapter || !chapter.playable) {
      toast("这一段还没接上");
      return;
    }
    var resume = state.chapterId === chapterId && state.nodeId ? locate(chapterId, state.nodeId) : null;
    if (resume && isVisible(state, resume.node)) {
      state.scene = "vn";
      render();
      saveNow();
      return;
    }
    if (!startChapter(state, chapterId)) {
      toast("这一段没能载入");
      return;
    }
    render();
    saveNow();
  }

  function readSoloOptions(params) {
    var doorParam = params.get("door");
    return {
      hasDoor: doorParam !== "0",
      trust: clamp(Math.round(Number(params.get("trust")) || 0), 0, 6),
      fire: clamp(Math.round(Number(params.get("fire")) || 50), 0, 100),
      lights: clamp(Math.round(Number(params.get("lights")) || 0), 0, 22)
    };
  }

  function setSoloPauseButtons(hidden) {
    if (!els.pauseMenu) return;
    ["pause-map", "pause-title"].forEach(function (action) {
      var button = els.pauseMenu.querySelector('[data-action="' + action + '"]');
      if (button) button.hidden = hidden;
    });
  }

  function startSolo(gameId, options) {
    if (!XB.minigames || XB.minigames.SCENES.indexOf(gameId) === -1) {
      soloMode = false;
      soloGameId = null;
      soloParams = null;
      state = defaults();
      state.scene = "title";
      els.vnResult.hidden = true;
      els.vnMinigame.hidden = true;
      els.minigameFallback.hidden = true;
      applySettings();
      render();
      toast("未知的小游戏：" + gameId);
      return;
    }

    options = options || {};
    soloMode = true;
    soloGameId = gameId;
    soloParams = options;
    lastMinigameResult = null;
    state = defaults();
    state.scene = "vn";
    state.chapterId = "prologue";
    state.nodeId = null;
    state.flags["item.door"] = options.hasDoor !== false;
    state.inventory.door = state.flags["item.door"];
    state.flags.trust = Number(options.trust) || 0;
    state.flags.fire = Number(options.fire) || 0;
    state.flags.lights_lost = Number(options.lights) || 0;

    applySettings();
    showScene("vn");
    els.vnChapter.textContent = "调试试玩 · " + (MINIGAME_LABEL[gameId] || gameId);
    els.vnDialogue.hidden = true;
    els.vnToolbar.hidden = true;
    els.vnChoices.hidden = true;
    els.vnChoicePrompt.hidden = true;
    els.vnResult.hidden = true;
    els.vnTitleCard.hidden = true;
    els.vnText.textContent = "";
    els.vnName.hidden = true;
    els.vnNext.textContent = "";
    setSoloPauseButtons(true);
    paintStage("yudu_night");

    if (!beginMinigame(gameId, { solo: true, node: null })) {
      renderSoloResult({ gameId: gameId, reason: "error", elapsed: 0, carried: [], left: [], stats: {} });
    }
    updateDebug();
  }

  function replaySolo() {
    if (!soloGameId) return;
    stopMinigame();
    startSolo(soloGameId, soloParams || {});
  }

  function exitSolo() {
    stopMinigame();
    soloMode = false;
    soloGameId = null;
    soloParams = null;
    minigameRun = null;
    state = defaults();
    state.scene = "title";
    state.paused = false;
    setSoloPauseButtons(false);
    els.vnResult.hidden = true;
    els.pause.hidden = true;
    render();
  }

  function openPause() {
    if (!state || state.scene !== "vn" || state.paused) return;
    setSoloPauseButtons(soloMode);
    state.paused = true;
    lastFocused = document.activeElement;
    cancelAuto();
    if (vnRun.typing) {
      cancelTyping();
      vnRun.paused = true;
    }
    els.pause.hidden = false;
    els.pauseMenu.hidden = false;
    els.vnSettings.hidden = true;
    var first = els.pauseMenu.querySelector("button");
    if (first) first.focus();
  }

  function closePause() {
    if (!state || !state.paused) return;
    state.paused = false;
    els.pause.hidden = true;
    els.vnSettings.hidden = true;
    els.pauseMenu.hidden = false;
    if (vnRun.typing && vnRun.paused) {
      vnRun.paused = false;
      vnRun.lastTs = 0;
      vnRun.rafId = requestAnimationFrame(typeStep);
    }
    if (lastFocused && lastFocused.focus && lastFocused !== document.body) lastFocused.focus();
    lastFocused = null;
    if (choiceRun.active) choiceRun.lastTs = 0;
    if (!vnRun.typing && (autoEnabled || skipEnabled)) scheduleAdvance(AUTO_DELAY_MS);
  }

  function openSettings() {
    els.pauseMenu.hidden = true;
    els.vnSettings.hidden = false;
    syncSettingsUI();
    els.setSpeed.focus();
  }

  function closeSettings() {
    els.vnSettings.hidden = true;
    els.pauseMenu.hidden = false;
    var first = els.pauseMenu.querySelector("button");
    if (first) first.focus();
  }

  function onVisibilityChange() {
    // 切走标签页时停表：倒计时和打字机都不该在看不见时偷跑。
    if (document.hidden && state && state.scene === "vn" && !state.paused) openPause();
  }

  /* ---------------- 设置 ---------------- */

  function bindSettings() {
    els.setSpeed.addEventListener("input", function () {
      state.settings.textSpeed = Number(els.setSpeed.value);
      els.setSpeedValue.textContent = state.settings.textSpeed + " 字/秒";
      saveNow();
    });
    els.setVolume.addEventListener("input", function () {
      state.settings.volume = Number(els.setVolume.value) / 100;
      els.setVolumeValue.textContent = els.setVolume.value;
      saveNow();
    });
    els.setScale.addEventListener("click", function (event) {
      var button = event.target.closest("[data-scale]");
      if (!button) return;
      state.settings.textScale = Number(button.dataset.scale);
      applySettings();
      saveNow();
    });
    els.setMuted.addEventListener("click", function () {
      state.settings.muted = !state.settings.muted;
      applySettings();
      saveNow();
    });
    els.setMotion.addEventListener("click", function () {
      state.settings.reducedMotion = !state.settings.reducedMotion;
      applySettings();
      saveNow();
      if (!state.settings.reducedMotion) return;
      if (vnRun.typing) finishPageNow();
    });
    els.setSkip.addEventListener("click", function () {
      state.settings.skipSeen = !state.settings.skipSeen;
      applySettings();
      saveNow();
    });
  }

  function setSwitch(element, value) {
    element.setAttribute("aria-checked", value ? "true" : "false");
  }

  function syncSettingsUI() {
    var settings = state.settings;
    els.setSpeed.value = String(settings.textSpeed);
    els.setSpeedValue.textContent = settings.textSpeed + " 字/秒";
    els.setVolume.value = String(Math.round(settings.volume * 100));
    els.setVolumeValue.textContent = String(Math.round(settings.volume * 100));
    Array.prototype.forEach.call(els.setScale.querySelectorAll("[data-scale]"), function (button) {
      button.setAttribute("aria-pressed", Number(button.dataset.scale) === settings.textScale ? "true" : "false");
    });
    setSwitch(els.setMuted, settings.muted);
    setSwitch(els.setMotion, settings.reducedMotion);
    setSwitch(els.setSkip, settings.skipSeen);
  }

  function applySettings() {
    els.stage.style.setProperty("--text-scale", String(state.settings.textScale));
    document.documentElement.classList.toggle("reduce-motion", state.settings.reducedMotion === true);
    syncSettingsUI();
    updateToolbar();
  }

  function updateToolbar() {
    els.vnAuto.setAttribute("aria-pressed", autoEnabled ? "true" : "false");
    els.vnSkip.setAttribute("aria-pressed", skipEnabled ? "true" : "false");
    els.vnSkip.setAttribute("aria-disabled", state.settings.skipSeen ? "false" : "true");
  }

  function toggleAuto() {
    autoEnabled = !autoEnabled;
    updateToolbar();
    if (autoEnabled && !vnRun.typing) scheduleAdvance(AUTO_DELAY_MS);
    else if (!autoEnabled) cancelAuto();
  }

  function toggleSkip() {
    if (!state.settings.skipSeen) {
      toast("跳过只对已读开放：先在设置里打开「跳读已读」");
      return;
    }
    skipEnabled = !skipEnabled;
    updateToolbar();
    if (skipEnabled) {
      if (vnRun.typing) finishPageNow();
      else scheduleAdvance(SKIP_DELAY_MS);
    } else {
      cancelAuto();
    }
  }

  /* ---------------- 输入 ---------------- */

  function isControlFocused() {
    var active = document.activeElement;
    if (!active || active === document.body) return false;
    if (["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].indexOf(active.tagName) === -1) return false;
    var rect = active.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function trapFocus(event, container) {
    var focusable = container.querySelectorAll("button, [tabindex]:not([tabindex='-1'])");
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }

  function bindInput() {
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
  }

  function bindOverlays() {
    els.codexClose.addEventListener("click", function () {
      closeCodex();
    });
    // 标题卡不单独绑 pointerdown：document 上的 onPointerDown 已经负责关它并 return，
    // 两处都绑会让同一次点击关完卡片后继续把 p001 的第一页“补全”，第一句等于没打。
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    var target = event.target;
    if (!target || !target.closest) return;
    if (target.closest("[data-action]")) return; // 按钮交给 click，避免一次点击走两条路
    if (titleCardState.open) {
      closeTitleCard();
      return;
    }
    if (codexState.open) return;
    if (!state || state.scene !== "vn" || state.paused) return;
    if (XB.minigames && XB.minigames.isActive()) return;
    if (target.closest("#vn-dialogue, #scene-vn")) advanceInput();
  }

  function onClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var actionElement = target.closest("[data-action]");
    if (!actionElement) return;
    if (actionElement.getAttribute("aria-disabled") === "true" && actionElement.dataset.action !== "skip") return;
    handleAction(actionElement.dataset.action, actionElement);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      if (codexState.open) {
        closeCodex();
        event.preventDefault();
        return;
      }
      if (titleCardState.open) {
        closeTitleCard();
        event.preventDefault();
        return;
      }
      if (state && state.paused) {
        closePause();
        event.preventDefault();
        return;
      }
      if (state && state.scene === "vn") {
        openPause();
        event.preventDefault();
      }
      return;
    }

    if (XB.minigames && XB.minigames.isActive()) return;

    if (event.key === "Tab" && codexState.open) {
      trapFocus(event, els.codex);
      return;
    }

    // 限时选项的数字快捷键：1/2 对应 A/B，方便单手键盘操作（B15）。
    if ((event.key === "1" || event.key === "2") && state && state.scene === "vn" && !state.paused &&
        choiceRun.active && !choiceRun.resolved) {
      var choiceNode = currentNode(state);
      if (choiceNode && choiceNode.type === "choice") {
        var picked = choiceNode.options[Number(event.key) - 1];
        if (picked) {
          event.preventDefault();
          resolveChoice(picked.key, false);
        }
      }
      return;
    }

    if (event.key !== " " && event.key !== "Enter" && event.key !== "Spacebar") return;
    if (event.repeat) return;
    if (titleCardState.open) {
      closeTitleCard();
      event.preventDefault();
      return;
    }
    if (codexState.open) return;
    if (!state || state.scene !== "vn" || state.paused) return;
    if (isControlFocused()) return; // 焦点在按钮上时让按钮自己处理回车/空格
    if (event.key === " ") event.preventDefault();
    advanceInput();
  }

  function handleAction(action, target) {
    switch (action) {
      case "start":
        startNewGame();
        break;
      case "continue":
        resumeGame();
        break;
      case "codex":
        toast("完整图鉴在步骤五接入；本步只在剧情里解锁单张史实注");
        break;
      case "station":
        enterStation(target.dataset.chapter);
        break;
      case "pause":
        openPause();
        break;
      case "resume":
        closePause();
        break;
      case "open-settings":
        openSettings();
        break;
      case "close-settings":
        closeSettings();
        break;
      case "pause-map":
        closePause();
        go("map");
        break;
      case "pause-title":
        closePause();
        go("title");
        break;
      case "auto":
        toggleAuto();
        break;
      case "skip":
        toggleSkip();
        break;
      case "choose":
        resolveChoice(target.dataset.key, false);
        break;
      case "continue-node":
        advanceVn();
        break;
      case "solo-replay":
        replaySolo();
        break;
      case "solo-title":
        exitSolo();
        break;
      default:
        console.error("[XB] 未知动作：" + action);
    }
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, TOAST_MS);
  }

  XB.engine = {
    init: init,
    render: render,
    go: go,
    toast: toast,
    resize: resize,
    handleAction: handleAction
  };

  document.addEventListener("DOMContentLoaded", init);
})(window.XB = window.XB || {});
