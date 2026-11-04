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
  var SCENES = ["title", "map", "vn", "ending"];
  var LEGACY_SCENES = ["choice", "minigame", "result", "codex"];

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
    musicVolume: 1,
    ambienceVolume: 1,
    muted: false,
    reducedMotion: false,
    skipSeen: false
  };

  // 十条基础旗标：缺省值即“还没做选择”的状态，normalize 会把旧档补齐。
  var FLAG_DEFAULTS = {
    "item.door": false,
    "item.pot": false,
    load: 0,
    trust: 0,
    fire: 50,
    lights_lost: 0,
    "choice.xiangjiang.abandoned": [],
    "choice.zunyi.missed": 0,
    "choice.zunyi.admit": 0,
    "choice.jinsha.trips": 0
  };

  // 数值旗标的上限下限：fire 是火种，trust 是民心（0–6 段），load 是行囊格数。
  var FLAG_LIMITS = {
    fire: [0, 100],
    trust: [0, 6],
    load: [0, 99],
    lights_lost: [0, 22],
    "choice.zunyi.missed": [0, 1],
    "choice.zunyi.admit": [0, 3],
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
    "choice.zunyi.admit",
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

  var CARD_IDS = ["ideal", "sacrifice", "truth", "overall", "people"];
  var NAME_STATUS = ["self", "remote", "player", "missed"];
  var ENDING_STATS = { companyStart: 104, companyEnd: 19, redStart: 86000, redEnd: 7000 };
  // 章末记忆：只置 true，不覆盖已有的 true；金沙江记名与吴起门板另有交互写。
  var CHAPTER_MEMORY = {
    xiangjiang: "memory.zhou",
    zunyi: "memory.he",
    luding: "memory.feimao",
    grass: "memory.zaowang"
  };
  var WUQI_MEMORY = ["memory.ximei", "memory.dongsheng", "memory.lin"];

  function validEndingNames(names) {
    if (!Array.isArray(names) || names.length !== 7) return false;
    var seen = {};
    return names.every(function (entry) {
      if (!isPlainObject(entry)) return false;
      if (typeof entry.id !== "string" || !entry.id || seen[entry.id]) return false;
      if (typeof entry.name !== "string" || !entry.name) return false;
      if (NAME_STATUS.indexOf(entry.status) === -1) return false;
      seen[entry.id] = true;
      return true;
    });
  }

  function validEndingCards(cards) {
    if (!Array.isArray(cards) || cards.length !== CARD_IDS.length) return false;
    var seen = {};
    return cards.every(function (entry) {
      if (!isPlainObject(entry)) return false;
      if (CARD_IDS.indexOf(entry.id) === -1 || seen[entry.id]) return false;
      if (typeof entry.lit !== "boolean" || typeof entry.line !== "string") return false;
      seen[entry.id] = true;
      return true;
    });
  }

  function validEndingStats(stats) {
    if (!isPlainObject(stats)) return false;
    var keys = Object.keys(stats);
    if (keys.length !== 4 || keys.some(function (key) { return !(key in ENDING_STATS); })) return false;
    return Object.keys(ENDING_STATS).every(function (key) {
      return isFiniteNumber(stats[key]) && stats[key] >= 0;
    });
  }

  // 点名结束会先写 names/answered/missed，结尾再补 stats/cards；两种形状都收，但键必须干净。
  function normalizeEnding(value) {
    if (!isPlainObject(value)) return null;
    var allowed = ["stats", "names", "answered", "missed", "cards"];
    var keys = Object.keys(value);
    if (keys.some(function (key) { return allowed.indexOf(key) === -1; })) return null;
    var clean = {};
    if (value.names !== undefined) {
      if (!validEndingNames(value.names)) return null;
      clean.names = value.names.map(function (entry) {
        return { id: entry.id, name: entry.name, status: entry.status };
      });
    }
    if (value.answered !== undefined) {
      if (!isFiniteNumber(value.answered) || value.answered < 0 || value.answered > 3) return null;
      clean.answered = Math.round(value.answered);
    }
    if (value.missed !== undefined) {
      if (!isFiniteNumber(value.missed) || value.missed < 0 || value.missed > 3) return null;
      clean.missed = Math.round(value.missed);
    }
    if (value.cards !== undefined) {
      if (!validEndingCards(value.cards)) return null;
      clean.cards = value.cards.map(function (entry) {
        return { id: entry.id, lit: entry.lit, line: entry.line };
      });
    }
    if (value.stats !== undefined) {
      if (!validEndingStats(value.stats)) return null;
      clean.stats = {
        companyStart: value.stats.companyStart,
        companyEnd: value.stats.companyEnd,
        redStart: value.stats.redStart,
        redEnd: value.stats.redEnd
      };
    }
    return clean;
  }

  function isFullEnding(ending) {
    return !!(ending && ending.stats && ending.names && ending.cards &&
      isFiniteNumber(ending.answered) && isFiniteNumber(ending.missed));
  }

  function rollcallEntries() {
    var chapter = chapterById("wuqi");
    var node = null;
    ((chapter && chapter.nodes) || []).some(function (item) {
      if (item.type === "interact" && item.mode === "rollcall") {
        node = item;
        return true;
      }
      return false;
    });
    return (node && node.names) || [];
  }

  // 没走到点名就进结局（调试/异常档）时的默认：不在场的人按“没应”算，不伪造替答。
  function defaultEndingNames() {
    var answered = 0;
    var missed = 0;
    var names = rollcallEntries().map(function (entry) {
      var status = entry.status === "absent" ? "missed" : entry.status;
      if (status === "missed") missed += 1;
      if (status === "player") answered += 1;
      return { id: entry.id, name: entry.name, status: status };
    });
    return { names: names, answered: answered, missed: missed };
  }

  // 五卡只算一次：finishChapter 调 buildEnding 落成快照，重进结局直接读快照。
  function buildEnding(state) {
    var storyEnding = (XB.story && XB.story.ending) || {};
    var flags = state.flags || {};
    var previous = normalizeEnding(state.ending) || {};
    var fallback = defaultEndingNames();
    var names = previous.names || fallback.names;
    var answered = previous.answered !== undefined ? previous.answered : fallback.answered;
    var missed = previous.missed !== undefined ? previous.missed : fallback.missed;

    var conditions = {
      ideal: isFiniteNumber(flags.fire) && flags.fire >= 20,
      sacrifice: flags["choice.xiangjiang.hold"] === true,
      truth: Number(flags["choice.zunyi.admit"] || 0) >= 2,
      overall: flags["choice.jinsha.priority"] === "main",
      people: Number(flags.trust || 0) >= 3 && flags["memory.zhang"] === true
    };

    var cards = ((storyEnding.cards) || []).map(function (card) {
      var lit = conditions[card.id] === true;
      return { id: card.id, lit: lit, line: lit ? card.litLine : card.unlitLine };
    });

    return {
      stats: {
        companyStart: ENDING_STATS.companyStart,
        companyEnd: ENDING_STATS.companyEnd,
        redStart: ENDING_STATS.redStart,
        redEnd: ENDING_STATS.redEnd
      },
      names: names,
      answered: answered,
      missed: missed,
      cards: cards
    };
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
    settings.musicVolume = clamp(settings.musicVolume, 0, 1);
    settings.ambienceVolume = clamp(settings.ambienceVolume, 0, 1);
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

    state.ending = normalizeEnding(save.ending);

    if (save.nodeId !== null && save.nodeId !== undefined && typeof save.nodeId !== "string") {
      return { issue: "node", state: defaults() };
    }
    state.nodeId = save.nodeId === undefined ? null : save.nodeId;

    if (state.scene === "ending") {
      // 结局是只读快照：缺一块、带了节点、或不在吴起章，都回地图并报告，不半截显示。
      if (state.chapterId !== "wuqi" || state.nodeId !== null || !isFullEnding(state.ending)) {
        var fallback = defaults();
        fallback.scene = "map";
        return { issue: "ending", state: fallback };
      }
      return { issue: null, state: state };
    }

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
    CARD_IDS: CARD_IDS,
    NAME_STATUS: NAME_STATUS,
    CHAPTER_MEMORY: CHAPTER_MEMORY,
    WUQI_MEMORY: WUQI_MEMORY,
    defaults: defaults,
    normalize: normalize,
    buildEnding: buildEnding,
    isFullEnding: isFullEnding,
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
     XB.audio：Web Audio 合成层
     首次用户手势前不创建 AudioContext；所有声音由振荡器/噪声实时合成。
     ===================================================================== */

  var BEDS = {
    wind_title: {
      layers: [
        { type: "lowpass", freq: 650, q: 0.7, gain: 0.12, lfo: { rate: 0.07, depth: 120 } },
        { type: "lowpass", freq: 320, q: 0.5, gain: 0.05, lfo: { rate: 0.05, depth: 40 } }
      ],
      tones: [{ freq: 46, gain: 0.018, type: "sine" }]
    },
    yudu: {
      layers: [
        { type: "bandpass", freq: 850, q: 0.9, gain: 0.12, lfo: { rate: 0.14, depth: 90 } },
        { type: "lowpass", freq: 700, q: 0.6, gain: 0.05, lfo: { rate: 0.08, depth: 100 } }
      ],
      tones: []
    },
    xiangjiang: {
      layers: [
        { type: "bandpass", freq: 700, q: 0.8, gain: 0.13, lfo: { rate: 0.16, depth: 110 } },
        { type: "lowpass", freq: 900, q: 0.6, gain: 0.04, lfo: { rate: 0.07, depth: 80 } }
      ],
      tones: [{ freq: 48, gain: 0.04, type: "sine" }]
    },
    zunyi: {
      layers: [
        { type: "lowpass", freq: 350, q: 0.5, gain: 0.06, lfo: { rate: 0.06, depth: 50 } },
        { type: "bandpass", freq: 520, q: 0.8, gain: 0.04, lfo: { rate: 0.09, depth: 60 } }
      ],
      tones: [{ freq: 98, gain: 0.018, type: "sine" }]
    },
    jinsha: {
      layers: [
        { type: "bandpass", freq: 1100, q: 0.9, gain: 0.14, lfo: { rate: 0.18, depth: 140 } },
        { type: "lowpass", freq: 800, q: 0.6, gain: 0.03, lfo: { rate: 0.06, depth: 70 } }
      ],
      tones: []
    },
    luding: {
      layers: [
        { type: "lowpass", freq: 1200, q: 0.5, gain: 0.13, lfo: { rate: 0.1, depth: 180 } },
        { type: "bandpass", freq: 2400, q: 4, gain: 0.035, lfo: { rate: 0.13, depth: 120 } }
      ],
      tones: []
    },
    grass: {
      layers: [
        { type: "lowpass", freq: 600, q: 0.6, gain: 0.12, lfo: { rate: 0.06, depth: 90 } },
        { type: "bandpass", freq: 500, q: 0.8, gain: 0.05, lfo: { rate: 0.1, depth: 50 } }
      ],
      tones: []
    },
    wuqi: {
      layers: [
        { type: "lowpass", freq: 700, q: 0.6, gain: 0.1, lfo: { rate: 0.07, depth: 100 } },
        { type: "bandpass", freq: 420, q: 0.7, gain: 0.04, lfo: { rate: 0.05, depth: 40 } }
      ],
      tones: [{ freq: 45, gain: 0.03, type: "sine" }]
    },
    ending: {
      layers: [
        { type: "lowpass", freq: 600, q: 0.6, gain: 0.09, lfo: { rate: 0.06, depth: 80 } },
        { type: "bandpass", freq: 480, q: 0.7, gain: 0.03, lfo: { rate: 0.04, depth: 30 } }
      ],
      tones: [{ freq: 42, gain: 0.025, type: "sine" }]
    }
  };

  // 外置环境声与配乐：只走 HTMLAudioElement -> MediaElementSource -> 既有总线，
  // 不引入 fetch/XHR/ES module；file:// 离线包同样可用。
  var ENV_DEFS = {
    wind: { src: "./assets/audio/ambience/wind_loop.mp3", gain: 1.15 },
    river: { src: "./assets/audio/ambience/river_loop.mp3", gain: 1.0 },
    rain: { src: "./assets/audio/ambience/rain_loop.mp3", gain: 1.0 },
    birds: { src: "./assets/audio/ambience/birds_loop.mp3", gain: 0.7 },
    fire: { src: "./assets/audio/ambience/fire_loop.mp3", gain: 1.25 }
  };

  // 场景权重：1 为基准；风声、火声在对应章节抬得更高。
  var ENV_BY_SCENE = {
    title: { wind: 0.9 },
    map: { wind: 0.8 },
    yudu_river: { river: 0.9, birds: 0.5 },
    yudu_night: { river: 0.55, wind: 0.6 },
    xiangjiang_ford: { river: 1.0, wind: 0.55 },
    xiangjiang_dawn: { river: 0.8, birds: 0.25 },
    xiangjiang_map: { wind: 0.45 },
    zunyi_hall: { wind: 0.6, birds: 0.15 },
    zunyi_street: { wind: 0.7, birds: 0.15 },
    jinsha_river: { river: 1.15, wind: 0.5 },
    jinsha_night: { river: 0.85, wind: 0.65 },
    luding_bridge: { river: 1.2, wind: 0.9, fire: 1.0 },
    luding_after: { river: 0.8, wind: 0.55, fire: 0.35 },
    grass_marsh: { wind: 1.25, rain: 0.45 },
    grass_dawn: { wind: 1.1, rain: 0.2 },
    wuqi_dawn: { wind: 1.0, birds: 0.2 },
    wuqi_wall: { wind: 0.85, birds: 0.15 },
    ending: { wind: 0.7 }
  };

  var MUSIC_DEFS = {
    shangri_river: { src: "./assets/audio/music/shangri_river.mp3", gain: 1.5 },
    oriental: { src: "./assets/audio/music/oriental.mp3", gain: 1.5 },
    a_bitter_hope: { src: "./assets/audio/music/a_bitter_hope.mp3", gain: 1.5 },
    visions_of_freedom: { src: "./assets/audio/music/visions_of_freedom.mp3", gain: 1.5 },
    sunrise_dynasty: { src: "./assets/audio/music/sunrise_dynasty.mp3", gain: 1.5 },
    final_heros_monologue: { src: "./assets/audio/music/final_heros_monologue.mp3", gain: 1.5 },
    misty_mountains: { src: "./assets/audio/music/misty_mountains.mp3", gain: 1.5 },
    frozen_orchard: { src: "./assets/audio/music/frozen_orchard.mp3", gain: 1.5 }
  };

  // file:// 下 Chromium/Safari 可能把外置音频视为跨源，MediaElementSource 会静音；
  // 此时退回 <audio> 直连，音量由设置/duck 手动计算。
  var DIRECT_EXTERNAL = typeof location !== "undefined" && location.protocol === "file:";

  var MUSIC_BY_SCENE = {
    title: "shangri_river",
    map: "shangri_river",
    yudu_river: "oriental",
    yudu_night: "oriental",
    xiangjiang_ford: "a_bitter_hope",
    xiangjiang_dawn: "a_bitter_hope",
    xiangjiang_map: "a_bitter_hope",
    zunyi_hall: "visions_of_freedom",
    zunyi_street: "visions_of_freedom",
    jinsha_river: "sunrise_dynasty",
    jinsha_night: "sunrise_dynasty",
    luding_bridge: "final_heros_monologue",
    luding_after: "final_heros_monologue",
    grass_marsh: "misty_mountains",
    grass_dawn: "misty_mountains",
    wuqi_dawn: "frozen_orchard",
    wuqi_wall: "frozen_orchard",
    ending: "shangri_river"
  };

  var BED_BY_SCENE = {
    title: "wind_title",
    map: "wind_title",
    yudu_river: "yudu",
    yudu_night: "yudu",
    xiangjiang_ford: "xiangjiang",
    xiangjiang_dawn: "xiangjiang",
    xiangjiang_map: "xiangjiang",
    zunyi_hall: "zunyi",
    zunyi_street: "zunyi",
    jinsha_river: "jinsha",
    jinsha_night: "jinsha",
    luding_bridge: "luding",
    luding_after: "luding",
    grass_marsh: "grass",
    grass_dawn: "grass",
    wuqi_dawn: "wuqi",
    wuqi_wall: "wuqi",
    ending: "ending"
  };

  var CUES = [
    "chapter", "choice-select", "choice-timeout", "codex", "drum", "rollcall-answer",
    "rollcall-miss", "result", "door-place", "boat-oar", "climb-fire", "ending"
  ];

  var MOTIF = [
    { note: "D4", freq: 293.66, start: 0, dur: 0.45 },
    { note: "F4", freq: 349.23, start: 0.55, dur: 0.25 },
    { note: "G4", freq: 392.00, start: 0.90, dur: 0.45 },
    { note: "A4", freq: 440.00, start: 1.45, dur: 0.25 },
    { note: "C5", freq: 523.25, start: 1.80, dur: 0.90 }
  ];

  var audioState = {
    ctx: null,
    supported: null,
    settings: {
      volume: DEFAULT_SETTINGS.volume,
      musicVolume: DEFAULT_SETTINGS.musicVolume,
      ambienceVolume: DEFAULT_SETTINGS.ambienceVolume,
      muted: DEFAULT_SETTINGS.muted
    },
    ambienceBus: null,
    sfxBus: null,
    musicBus: null,
    masterGain: null,
    compressor: null,
    analyser: null,
    noise: null,
    sceneId: null,
    bedId: null,
    voices: [],
    fading: [],
    env: {},
    envStarted: false,
    music: {},
    musicCurrent: null,
    externalWarned: false,
    duck: 1,
    lastCue: {},
    warned: false,
    unknownWarned: false
  };

  function clampAudio(value, min, max) {
    var number = Number(value);
    if (!isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }

  function audioToast(message) {
    if (typeof toast === "function") toast(message);
  }

  function externalMasterLevel() {
    return audioState.settings.muted ? 0 : 0.87 * audioState.settings.volume;
  }

  function directEnvLevel(id) {
    var weights = ENV_BY_SCENE[audioState.sceneId] || { wind: 0.5 };
    var target = ENV_DEFS[id].gain * (weights[id] || 0);
    target *= audioState.settings.ambienceVolume;
    return clampAudio(target * 0.35 * externalMasterLevel() * audioState.duck, 0, 1);
  }

  function directMusicLevel(entry) {
    return clampAudio(entry.base * 0.62 * audioState.settings.musicVolume * externalMasterLevel() * audioState.duck, 0, 1);
  }

  function applyDirectExternalLevels() {
    Object.keys(audioState.env).forEach(function (id) {
      var voice = audioState.env[id];
      if (voice.direct) voice.el.volume = directEnvLevel(id);
    });
    Object.keys(audioState.music).forEach(function (id) {
      var entry = audioState.music[id];
      if (!entry.direct) return;
      if (entry.fadeRaf) {
        cancelAnimationFrame(entry.fadeRaf);
        entry.fadeRaf = 0;
      }
      // 只给当前曲目音量；淡出中的旧曲目保持静音，避免取消静音时两首同时响。
      entry.el.volume = entry === audioState.musicCurrent ? directMusicLevel(entry) : 0;
    });
  }

  function getNoiseBuffer() {
    if (audioState.noise) return audioState.noise;
    var ctx = audioState.ctx;
    var length = Math.floor(ctx.sampleRate * 2);
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    audioState.noise = buffer;
    return buffer;
  }

  function buildAudioGraph() {
    var ctx = audioState.ctx;
    var master = ctx.createGain();
    master.gain.value = 0;
    var compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    master.connect(compressor);
    compressor.connect(ctx.destination);

    var ambience = ctx.createGain();
    ambience.gain.value = 0.35 * audioState.settings.ambienceVolume;
    ambience.connect(master);
    var sfx = ctx.createGain();
    sfx.gain.value = 0.55;
    sfx.connect(master);
    var music = ctx.createGain();
    music.gain.value = 0.62 * audioState.settings.musicVolume;
    music.connect(master);

    if (debugEnabled) {
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      master.connect(analyser);
      audioState.analyser = analyser;
    }

    audioState.masterGain = master;
    audioState.compressor = compressor;
    audioState.ambienceBus = ambience;
    audioState.sfxBus = sfx;
    audioState.musicBus = music;
    audioState.duck = 1;
  }

  function warnExternalAudio(message) {
    if (audioState.externalWarned) return;
    audioState.externalWarned = true;
    console.warn("[audio] " + message);
  }

  function createAudioElement(def) {
    var el = document.createElement("audio");
    el.src = def.src;
    el.loop = true;
    el.preload = "auto";
    // 直连模式先静音，等总线级算好再起播，避免起播爆音。
    el.volume = DIRECT_EXTERNAL ? 0 : 1;
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    return el;
  }

  function playExternalElement(el, label) {
    var result = el.play();
    if (result && result.catch) {
      result.catch(function (error) {
        warnExternalAudio(label + "未能播放：" + (error && error.message ? error.message : "未知原因"));
      });
    }
  }

  function startEnvVoice(id) {
    var def = ENV_DEFS[id];
    var el = createAudioElement(def);
    var source = null;
    var direct = DIRECT_EXTERNAL;
    if (!direct) {
      try {
        source = audioState.ctx.createMediaElementSource(el);
      } catch (error) {
        warnExternalAudio("环境声接入失败，改用直连：" + id + " " + error.message);
        direct = true;
      }
    }
    var entry = { id: id, el: el, source: source, gain: null, direct: direct, base: def.gain };
    if (direct) {
      el.volume = 0;
    } else {
      var gain = audioState.ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(audioState.ambienceBus);
      entry.gain = gain;
    }
    audioState.env[id] = entry;
    playExternalElement(el, "环境声 " + id + " ");
    if (direct) el.volume = directEnvLevel(id);
  }

  function startExternalAudio() {
    if (audioState.envStarted || !audioState.ctx) return false;
    audioState.envStarted = true;
    Object.keys(ENV_DEFS).forEach(startEnvVoice);
    return true;
  }

  function setEnvironment(sceneId) {
    if (!audioState.ctx) return false;
    var weights = ENV_BY_SCENE[sceneId] || { wind: 0.5 };
    var now = audioState.ctx.currentTime;
    Object.keys(audioState.env).forEach(function (id) {
      var voice = audioState.env[id];
      if (voice.direct) {
        voice.el.volume = directEnvLevel(id);
        return;
      }
      var target = ENV_DEFS[id].gain * (weights[id] || 0);
      voice.gain.gain.setTargetAtTime(target, now, 0.6);
    });
    return true;
  }

  function getMusicEntry(id) {
    if (audioState.music[id]) return audioState.music[id];
    var def = MUSIC_DEFS[id];
    if (!def) return null;
    var el = createAudioElement(def);
    var source = null;
    var direct = DIRECT_EXTERNAL;
    if (!direct) {
      try {
        source = audioState.ctx.createMediaElementSource(el);
      } catch (error) {
        warnExternalAudio("配乐接入失败，改用直连：" + id + " " + error.message);
        direct = true;
      }
    }
    var entry = { id: id, el: el, source: source, gain: null, direct: direct, base: def.gain };
    if (direct) {
      el.volume = 0;
    } else {
      var gain = audioState.ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(audioState.musicBus);
      entry.gain = gain;
    }
    audioState.music[id] = entry;
    return entry;
  }

  // file:// 直连模式没有 GainNode，只能手写淡入淡出；取消旧动画，避免两首歌同时被写音量。
  function fadeDirectElement(entry, target, duration) {
    if (!entry || !entry.direct || !entry.el) return;
    if (entry.fadeRaf) cancelAnimationFrame(entry.fadeRaf);
    var from = entry.el.volume;
    var start = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      entry.el.volume = clampAudio(from + (target - from) * t, 0, 1);
      if (t < 1) entry.fadeRaf = requestAnimationFrame(tick);
      else entry.fadeRaf = 0;
    }
    entry.fadeRaf = requestAnimationFrame(tick);
  }

  function setMusic(sceneId) {
    if (!audioState.ctx) return false;
    var id = MUSIC_BY_SCENE[sceneId] || null;
    if (!id) {
      if (audioState.musicCurrent) {
        var previous = audioState.musicCurrent;
        if (previous.direct) {
          fadeDirectElement(previous, 0, 1.4);
        } else {
          var previousNow = audioState.ctx.currentTime;
          previous.gain.gain.cancelScheduledValues(previousNow);
          previous.gain.gain.setTargetAtTime(0.0001, previousNow, 0.5);
        }
        audioState.musicCurrent = null;
        window.setTimeout(function () {
          if (audioState.musicCurrent !== previous) {
            previous.el.pause();
            previous.el.currentTime = 0;
          }
        }, 1600);
      }
      return true;
    }
    var entry = getMusicEntry(id);
    if (!entry) return false;
    if (audioState.musicCurrent === entry) return true;
    var old = audioState.musicCurrent;
    var now = audioState.ctx.currentTime;
    // 先切当前曲目，再淡出旧曲；否则设置音量时 applyDirectExternalLevels 会把旧曲又提起来。
    audioState.musicCurrent = entry;
    if (old) {
      if (old.direct) {
        fadeDirectElement(old, 0, 1.4);
      } else {
        old.gain.gain.cancelScheduledValues(now);
        old.gain.gain.setTargetAtTime(0.0001, now, 0.5);
      }
      window.setTimeout(function () {
        if (audioState.musicCurrent !== old) {
          old.el.pause();
          old.el.currentTime = 0;
        }
      }, 1600);
    }
    entry.el.currentTime = 0;
    if (entry.direct) entry.el.volume = 0;
    playExternalElement(entry.el, "配乐 " + id + " ");
    if (entry.direct) {
      fadeDirectElement(entry, directMusicLevel(entry), 1.4);
    } else {
      entry.gain.gain.cancelScheduledValues(now);
      entry.gain.gain.setValueAtTime(0.0001, now);
      entry.gain.gain.linearRampToValueAtTime(entry.base, now + 1.4);
    }
    return true;
  }

  function pauseExternalAudio() {
    Object.keys(audioState.env).forEach(function (id) {
      audioState.env[id].el.pause();
    });
    if (audioState.musicCurrent) audioState.musicCurrent.el.pause();
  }

  function resumeExternalAudio() {
    Object.keys(audioState.env).forEach(function (id) {
      playExternalElement(audioState.env[id].el, "环境声 " + id + " ");
    });
    if (audioState.musicCurrent) {
      playExternalElement(audioState.musicCurrent.el, "配乐 " + audioState.musicCurrent.id + " ");
    }
  }

  function unlockAudio() {
    if (audioState.ctx) {
      if (audioState.ctx.state === "suspended") resumeAudio();
      return true;
    }
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      audioState.supported = false;
      if (!audioState.warned) {
        audioState.warned = true;
        audioToast("本机无法播放声音，游戏可继续");
      }
      return false;
    }
    try {
      audioState.ctx = new Ctor();
    } catch (error) {
      audioState.supported = false;
      console.error("[audio] AudioContext 创建失败", error);
      if (!audioState.warned) {
        audioState.warned = true;
        audioToast("声音启动失败，游戏可继续");
      }
      return false;
    }
    audioState.supported = true;
    buildAudioGraph();
    applyAudioSettings(audioState.settings);
    if (audioState.ctx.state === "suspended") resumeAudio();
    startExternalAudio();
    if (audioState.sceneId) setScene(audioState.sceneId);
    return true;
  }

  function applyAudioSettings(next) {
    if (next) {
      if (next.volume !== undefined) audioState.settings.volume = clampAudio(next.volume, 0, 1);
      if (next.musicVolume !== undefined) audioState.settings.musicVolume = clampAudio(next.musicVolume, 0, 1);
      if (next.ambienceVolume !== undefined) audioState.settings.ambienceVolume = clampAudio(next.ambienceVolume, 0, 1);
      if (next.muted !== undefined) audioState.settings.muted = !!next.muted;
    }
    if (!audioState.ctx || !audioState.masterGain) return false;
    var now = audioState.ctx.currentTime;
    audioState.masterGain.gain.setTargetAtTime(externalMasterLevel(), now, 0.04);
    audioState.ambienceBus.gain.setTargetAtTime(0.35 * audioState.settings.ambienceVolume * audioState.duck, now, 0.04);
    audioState.musicBus.gain.setTargetAtTime(0.62 * audioState.settings.musicVolume * audioState.duck, now, 0.04);
    applyDirectExternalLevels();
    return true;
  }

  function startBedVoice(id) {
    var ctx = audioState.ctx;
    var def = BEDS[id];
    var output = ctx.createGain();
    output.gain.value = 0.0001;
    output.connect(audioState.ambienceBus);
    var sources = [];

    def.layers.forEach(function (layer) {
      var source = ctx.createBufferSource();
      source.buffer = getNoiseBuffer();
      source.loop = true;
      var filter = ctx.createBiquadFilter();
      filter.type = layer.type;
      filter.frequency.value = layer.freq;
      filter.Q.value = layer.q;
      var gain = ctx.createGain();
      gain.gain.value = layer.gain;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      source.start(0);
      sources.push(source);
      if (layer.lfo) {
        var lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        lfo.frequency.value = layer.lfo.rate;
        lfoGain.gain.value = layer.lfo.depth;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(0);
        sources.push(lfo);
      }
    });

    (def.tones || []).forEach(function (tone) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = tone.type || "sine";
      osc.frequency.value = tone.freq;
      gain.gain.value = tone.gain;
      osc.connect(gain);
      gain.connect(output);
      osc.start(0);
      sources.push(osc);
    });

    output.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8);
    return { id: id, gain: output, sources: sources, stopping: false };
  }

  function stopBedVoice(voice, fadeMs) {
    if (!voice || voice.stopping) return;
    voice.stopping = true;
    var ctx = audioState.ctx;
    var now = ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
    window.setTimeout(function () {
      voice.sources.forEach(function (source) {
        if (!source.__xbStopped) {
          source.__xbStopped = true;
          source.stop();
        }
      });
      voice.gain.disconnect();
      var index = audioState.fading.indexOf(voice);
      if (index >= 0) audioState.fading.splice(index, 1);
    }, fadeMs + 60);
  }

  function setBed(id) {
    var bedId = BEDS[id] ? id : "wind_title";
    audioState.bedId = bedId;
    if (!audioState.ctx) return false;
    var current = audioState.voices[0];
    if (current && current.id === bedId && !current.stopping) return true;

    var voice = startBedVoice(bedId);
    audioState.voices.forEach(function (old) {
      audioState.fading.push(old);
      stopBedVoice(old, 800);
    });
    audioState.voices = [voice];

    while (audioState.fading.length > 2) {
      var oldest = audioState.fading.shift();
      stopBedVoice(oldest, 120);
    }
    return true;
  }

  function setScene(sceneId) {
    var hasScene = Object.prototype.hasOwnProperty.call(BED_BY_SCENE, sceneId);
    if (!hasScene && !audioState.unknownWarned) {
      audioState.unknownWarned = true;
      console.warn("[audio] 未知场景，回落 title：" + sceneId);
    }
    audioState.sceneId = sceneId;
    setEnvironment(sceneId);
    setMusic(sceneId);
    return setBed(hasScene ? BED_BY_SCENE[sceneId] : BED_BY_SCENE.title);
  }

  function bedForScene(sceneId) {
    return Object.prototype.hasOwnProperty.call(BED_BY_SCENE, sceneId)
      ? BED_BY_SCENE[sceneId]
      : BED_BY_SCENE.title;
  }

  function setDuck(level) {
    audioState.duck = clampAudio(level, 0, 1);
    if (!audioState.ctx) return false;
    var now = audioState.ctx.currentTime;
    audioState.ambienceBus.gain.setTargetAtTime(0.35 * audioState.settings.ambienceVolume * audioState.duck, now, 0.08);
    audioState.musicBus.gain.setTargetAtTime(0.62 * audioState.settings.musicVolume * audioState.duck, now, 0.08);
    applyDirectExternalLevels();
    return true;
  }

  function toneAt(freq, start, duration, peak, type, bus) {
    var ctx = audioState.ctx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + Math.min(0.02, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function noiseAt(start, duration, filterType, freq, q, peak, bus) {
    var ctx = audioState.ctx;
    var source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer();
    var filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + Math.min(0.02, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  function drumAt(start, peak) {
    var ctx = audioState.ctx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(92, start);
    osc.frequency.exponentialRampToValueAtTime(48, start + 0.3);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
    osc.connect(gain);
    gain.connect(audioState.sfxBus);
    osc.start(start);
    osc.stop(start + 0.45);
  }

  function playMotif(count) {
    var ctx = audioState.ctx;
    var start = ctx.currentTime + 0.02;
    var total = Math.min(count, MOTIF.length);
    for (var i = 0; i < total; i += 1) {
      var note = MOTIF[i];
      var at = start + note.start;
      var triangle = ctx.createOscillator();
      var sine = ctx.createOscillator();
      var triangleGain = ctx.createGain();
      var sineGain = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      var envelope = ctx.createGain();
      triangle.type = "triangle";
      sine.type = "sine";
      triangle.frequency.value = note.freq;
      sine.frequency.value = note.freq;
      triangleGain.gain.value = 0.7;
      sineGain.gain.value = 0.3;
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      triangle.connect(triangleGain);
      sine.connect(sineGain);
      triangleGain.connect(filter);
      sineGain.connect(filter);
      filter.connect(envelope);
      envelope.connect(audioState.musicBus);
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(0.2, at + 0.03);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + note.dur);

      var lfo = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      lfo.frequency.value = 5;
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(triangle.detune);
      lfoGain.connect(sine.detune);
      triangle.start(at);
      sine.start(at);
      lfo.start(at);
      triangle.stop(at + note.dur + 0.02);
      sine.stop(at + note.dur + 0.02);
      lfo.stop(at + note.dur + 0.02);
    }
  }

  function playCue(name) {
    var ctx = audioState.ctx;
    var start = ctx.currentTime + 0.01;
    switch (name) {
      case "chapter":
        playMotif(3);
        drumAt(start, 0.12);
        break;
      case "choice-select":
        toneAt(520, start, 0.07, 0.14, "triangle", audioState.sfxBus);
        noiseAt(start, 0.06, "highpass", 1800, 0.7, 0.05, audioState.sfxBus);
        break;
      case "choice-timeout":
        toneAt(180, start, 0.35, 0.13, "sine", audioState.sfxBus);
        noiseAt(start, 0.25, "lowpass", 500, 0.7, 0.05, audioState.sfxBus);
        break;
      case "codex":
        noiseAt(start, 0.32, "highpass", 2200, 0.6, 0.06, audioState.sfxBus);
        noiseAt(start + 0.12, 0.18, "bandpass", 900, 1.2, 0.04, audioState.sfxBus);
        break;
      case "drum":
        drumAt(start, 0.22);
        break;
      case "rollcall-answer":
        toneAt(660, start, 0.09, 0.16, "triangle", audioState.sfxBus);
        toneAt(990, start + 0.06, 0.12, 0.09, "sine", audioState.sfxBus);
        break;
      case "rollcall-miss":
        toneAt(92, start, 0.5, 0.18, "sine", audioState.sfxBus);
        noiseAt(start, 0.3, "lowpass", 320, 0.7, 0.05, audioState.sfxBus);
        break;
      case "result":
        drumAt(start, 0.14);
        noiseAt(start + 0.04, 0.36, "bandpass", 700, 0.8, 0.05, audioState.sfxBus);
        break;
      case "door-place":
        toneAt(118, start, 0.18, 0.18, "triangle", audioState.sfxBus);
        noiseAt(start, 0.14, "lowpass", 420, 0.7, 0.09, audioState.sfxBus);
        break;
      case "boat-oar":
        noiseAt(start, 0.45, "bandpass", 760, 0.9, 0.1, audioState.sfxBus);
        noiseAt(start + 0.18, 0.3, "bandpass", 980, 1.1, 0.07, audioState.sfxBus);
        break;
      case "climb-fire":
        noiseAt(start, 0.22, "highpass", 1500, 0.6, 0.1, audioState.sfxBus);
        toneAt(70, start, 0.22, 0.12, "sine", audioState.sfxBus);
        break;
      case "ending":
        playMotif(5);
        drumAt(start, 0.12);
        noiseAt(start, 1.4, "lowpass", 600, 0.7, 0.04, audioState.sfxBus);
        break;
      default:
        return false;
    }
    return true;
  }

  function cue(name) {
    if (CUES.indexOf(name) === -1) return false;
    if (!audioState.ctx || audioState.settings.muted) return false;
    var now = Date.now();
    if (audioState.lastCue[name] && now - audioState.lastCue[name] < 100) return false;
    audioState.lastCue[name] = now;
    return playCue(name);
  }

  function suspendAudio() {
    if (!audioState.ctx || audioState.ctx.state !== "running") return false;
    pauseExternalAudio();
    var result = audioState.ctx.suspend();
    if (result && result.catch) {
      result.catch(function (error) {
        console.warn("[audio] suspend 未完成", error);
      });
    }
    return true;
  }

  function resumeAudio() {
    if (!audioState.ctx) return false;
    if (audioState.ctx.state !== "suspended") return true;
    var result = audioState.ctx.resume();
    if (result && result.then) {
      result.then(function () {
        resumeExternalAudio();
      }).catch(function (error) {
        console.warn("[audio] resume 未完成", error);
      });
    } else {
      resumeExternalAudio();
    }
    return true;
  }

  function readPeak() {
    if (!audioState.analyser) return 0;
    var data = new Float32Array(audioState.analyser.fftSize);
    audioState.analyser.getFloatTimeDomainData(data);
    var peak = 0;
    for (var i = 0; i < data.length; i += 1) {
      var value = Math.abs(data[i]);
      if (value > peak) peak = value;
    }
    return Math.round(peak * 1000) / 1000;
  }

  function audioStats() {
    var ctx = audioState.ctx;
    var state;
    if (!ctx) state = audioState.supported === false ? "off" : "locked";
    else if (ctx.state === "suspended") state = "suspended";
    else if (ctx.state === "closed") state = "off";
    else state = "ready";
    return {
      supported: audioState.supported !== false,
      ready: !!ctx,
      state: state,
      scene: audioState.sceneId,
      bed: audioState.bedId,
      duck: audioState.duck,
      env: Object.keys(audioState.env),
      music: audioState.musicCurrent ? audioState.musicCurrent.id : null,
      activeBeds: audioState.voices.length + audioState.fading.length,
      volume: audioState.settings.volume,
      muted: audioState.settings.muted,
      peak: readPeak()
    };
  }

  XB.audio = {
    BEDS: Object.keys(BEDS),
    BED_BY_SCENE: BED_BY_SCENE,
    CUES: CUES,
    MOTIF: MOTIF,
    unlock: unlockAudio,
    applySettings: applyAudioSettings,
    setScene: setScene,
    bedForScene: bedForScene,
    setDuck: setDuck,
    cue: cue,
    suspend: suspendAudio,
    resume: resumeAudio,
    stats: audioStats,
    isReady: function () { return !!audioState.ctx; }
  };

  /* =====================================================================
     XB.fx：转场、闪白、震动、墨迹划名
     ===================================================================== */

  var FX_LIMITS = {
    wipeMs: 480,
    flashMs: 120,
    flashGapMs: 2000,
    flashOpacity: 0.12,
    shakeMs: 180,
    shakePx: 2,
    strikeMs: 420,
    strikeStaggerMs: 90
  };

  var fxState = {
    layer: null,
    stage: null,
    reduced: false,
    lastFlash: 0,
    lastShake: 0,
    lastWipe: 0,
    wipeTimer: 0,
    flashTimer: 0,
    shakeTimer: 0,
    strikeTimer: 0,
    strikePlayed: false
  };

  function fxReduced() {
    return !!(fxState.reduced ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  }

  function fxInit(options) {
    var opts = options || {};
    fxState.layer = opts.layer || null;
    fxState.stage = opts.stage || null;
  }

  function fxSetReduced(value) {
    fxState.reduced = !!value;
  }

  function fxTransition(sceneName) {
    if (!fxState.layer || fxReduced()) return false;
    fxState.lastWipe = Date.now();
    var layer = fxState.layer;
    layer.classList.remove("is-paper", "is-night", "is-wiping");
    layer.classList.add(sceneName === "title" || sceneName === "map" ? "is-paper" : "is-night");
    void layer.offsetWidth;
    layer.classList.add("is-wiping");
    window.clearTimeout(fxState.wipeTimer);
    fxState.wipeTimer = window.setTimeout(function () {
      layer.classList.remove("is-wiping");
    }, FX_LIMITS.wipeMs + 40);
    return true;
  }

  function fxFlash() {
    if (!fxState.layer || fxReduced()) return false;
    var now = Date.now();
    if (now - fxState.lastFlash < FX_LIMITS.flashGapMs) return false;
    fxState.lastFlash = now;
    var layer = fxState.layer;
    layer.classList.remove("is-flashing");
    void layer.offsetWidth;
    layer.classList.add("is-flashing");
    window.clearTimeout(fxState.flashTimer);
    fxState.flashTimer = window.setTimeout(function () {
      layer.classList.remove("is-flashing");
    }, FX_LIMITS.flashMs + 30);
    return true;
  }

  function fxShake() {
    if (!fxState.stage || fxReduced()) return false;
    var now = Date.now();
    if (now - fxState.lastShake < 300) return false;
    fxState.lastShake = now;
    var stage = fxState.stage;
    stage.classList.remove("is-shaking");
    void stage.offsetWidth;
    stage.classList.add("is-shaking");
    window.clearTimeout(fxState.shakeTimer);
    fxState.shakeTimer = window.setTimeout(function () {
      stage.classList.remove("is-shaking");
    }, FX_LIMITS.shakeMs + 30);
    return true;
  }

  function fxStrike() {
    if (!document.querySelectorAll) return false;
    if (fxState.strikePlayed) return false;
    var rows = document.querySelectorAll("#ending-names li.is-missed");
    if (!rows.length) return false;
    fxState.strikePlayed = true;
    var list = Array.prototype.slice.call(rows);
    var reduced = fxReduced();
    function paint() {
      list.forEach(function (row, index) {
        row.style.setProperty("--strike-delay", (reduced ? 0 : index * FX_LIMITS.strikeStaggerMs) + "ms");
        row.classList.add("is-struck");
      });
    }
    if (reduced) {
      paint();
      return true;
    }
    window.clearTimeout(fxState.strikeTimer);
    fxState.strikeTimer = window.setTimeout(paint, 500);
    return true;
  }

  function fxReset() {
    window.clearTimeout(fxState.wipeTimer);
    window.clearTimeout(fxState.flashTimer);
    window.clearTimeout(fxState.shakeTimer);
    window.clearTimeout(fxState.strikeTimer);
    if (fxState.layer) fxState.layer.classList.remove("is-wiping", "is-flashing", "is-paper", "is-night");
    if (fxState.stage) fxState.stage.classList.remove("is-shaking");
    if (document.querySelectorAll) {
      var struck = document.querySelectorAll("#ending-names li.is-struck");
      Array.prototype.forEach.call(struck, function (row) {
        row.classList.remove("is-struck");
        row.style.removeProperty("--strike-delay");
      });
    }
    fxState.strikePlayed = false;
    fxState.lastFlash = 0;
    fxState.lastShake = 0;
    fxState.lastWipe = 0;
  }

  XB.fx = {
    LIMITS: FX_LIMITS,
    init: fxInit,
    setReduced: fxSetReduced,
    isReduced: fxReduced,
    transition: fxTransition,
    flash: fxFlash,
    shake: fxShake,
    strike: fxStrike,
    reset: fxReset
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

  // 章首卡直接用照片做 CSS 背景，不再依赖画布；键是 story 里的 bg 场景名。
  var TITLE_CARD_BG = {
    yudu_river: "./assets/backgrounds/plate_yudu.jpg",
    yudu_night: "./assets/backgrounds/plate_yudu.jpg",
    xiangjiang_ford: "./assets/backgrounds/plate_xiangjiang.jpg",
    xiangjiang_map: "./assets/backgrounds/plate_xiangjiang_map.jpg",
    zunyi_hall: "./assets/backgrounds/plate_zunyi_hall.jpg",
    zunyi_street: "./assets/backgrounds/plate_zunyi_street.jpg",
    jinsha_river: "./assets/backgrounds/plate_jinsha.jpg",
    jinsha_night: "./assets/backgrounds/plate_jinsha.jpg",
    luding_bridge: "./assets/backgrounds/plate_luding.jpg",
    luding_after: "./assets/backgrounds/plate_luding_after.jpg",
    grass_marsh: "./assets/backgrounds/plate_grass.jpg",
    grass_dawn: "./assets/backgrounds/plate_grass_dawn.jpg",
    wuqi_dawn: "./assets/backgrounds/plate_wuqi.jpg",
    wuqi_wall: "./assets/backgrounds/plate_wuqi.jpg"
  };

  // 图鉴列表用 480×270 小图，避免打开图鉴时一次拉 7 张 1920 原图。
  var CODEX_THUMBS = {
    yudu: "./assets/backgrounds/thumbs/codex_yudu.jpg",
    xiangjiang: "./assets/backgrounds/thumbs/codex_xiangjiang.jpg",
    zunyi: "./assets/backgrounds/thumbs/codex_zunyi.jpg",
    jinsha: "./assets/backgrounds/thumbs/codex_jinsha.jpg",
    luding: "./assets/backgrounds/thumbs/codex_luding.jpg",
    grass: "./assets/backgrounds/thumbs/codex_grass.jpg",
    wuqi: "./assets/backgrounds/thumbs/codex_wuqi.jpg"
  };

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
    "fx-layer",
    "scene-title",
    "scene-map",
    "scene-vn",
    "scene-ending",
    "ending-title",
    "ending-date",
    "ending-lede",
    "ending-names",
    "ending-stats",
    "ending-cards",
    "ending-disclaimer",
    "ending-home",
    "ending-codex",
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
    "vn-interact",
    "interact-kicker",
    "interact-name",
    "interact-status",
    "interact-progress",
    "interact-names",
    "interact-answer",
    "interact-live",
    "vn-title-card",
    "vn-title-chapter",
    "vn-title-sub",
    "vn-title-place",
    "vn-measure",
    "vn-settings",
    "set-speed",
    "set-speed-value",
    "set-scale",
    "set-volume",
    "set-volume-value",
    "set-music-volume",
    "set-music-volume-value",
    "set-env-volume",
    "set-env-volume-value",
    "set-muted",
    "set-motion",
    "set-skip",
    "vn-roster",
    "roster-list",
    "roster-foot",
    "codex",
    "codex-title",
    "codex-badges",
    "codex-figure",
    "codex-body",
    "codex-note",
    "codex-source",
    "codex-image-note",
    "codex-close",
    "codex-gallery",
    "gallery-close",
    "gallery-title",
    "gallery-count",
    "gallery-grid"
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
  var lastScene = null;
  var ludingFlashed = false;
  var endingCuePlayed = false;

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
  var galleryState = { open: false, previousFocus: null };

  // 点名/记名交互：只活在本次页面；点名结果在结束时落进 ending 快照。
  var interactRun = {
    active: false,
    mode: "",
    node: null,
    entries: [],
    cursor: 0,
    phase: "",
    phaseRemaining: 0,
    total: 0,
    remaining: 0,
    lastTs: 0,
    lastSecond: -1,
    rafId: 0,
    answered: 0,
    missed: 0,
    finished: false
  };
  var lastInteractResult = null;

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
    XB.fx.init({ layer: els.fxLayer, stage: els.stage });
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

    // 调试跳章：?chapter=xiangjiang&node=x001；只定位，不补记忆、不跳章末。
    var debugChapter = params.get("chapter");
    if (debugChapter && chapterById(debugChapter)) {
      if (startChapter(state, debugChapter, params.get("node"))) saveExists = true;
    }

    applySettings();
    applyStartScene();
    render();
    updateDebug();
    setupFxDebug(params);
  }

  function setupFxDebug(params) {
    var effect = params.get("fx");
    if (["wipe", "flash", "shake", "strike"].indexOf(effect) === -1) return;
    window.setTimeout(function () {
      if (effect === "wipe") XB.fx.transition("map");
      else if (effect === "flash") XB.fx.flash();
      else if (effect === "shake") XB.fx.shake();
      else if (!XB.fx.strike()) toast("划名需要先到达结局名单");
    }, 600);
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
    if (state.scene === "title" || state.scene === "map" || state.scene === "ending") return;
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
      "ending  " + (state.ending ? (state.ending.cards ? "snapshot" : "partial") : "—"),
      "choice  " + describeFlag("choice.prologue.door") + " / lookback=" + describeFlag("choice.prologue.lookback"),
      "log     " + state.choices.length
    ];
    var audio = XB.audio.stats();
    lines.push("audio   " + audio.state + " bed=" + (audio.bed || "—") + " duck=" + audio.duck.toFixed(2) + " beds=" + audio.activeBeds + " peak=" + audio.peak.toFixed(3));
    lines.push("canvas  " + els.stageArt.width + "×" + els.stageArt.height);
    if (debugExtra) lines.push("· " + debugExtra);
    els.debug.hidden = false;
    els.debug.textContent = lines.join("\n");
  }

  function describeFlag(key) {
    var value = state.flags[key];
    return value === undefined ? "—" : String(value);
  }

  function showScene(name) {
    var changed = lastScene !== name;
    els.stage.dataset.scene = name;
    els.sceneTitle.hidden = name !== "title";
    els.sceneMap.hidden = name !== "map";
    els.sceneVn.hidden = name !== "vn";
    els.sceneEnding.hidden = name !== "ending";
    if (!changed) return;
    if (name === "ending") {
      XB.fx.reset();
      endingCuePlayed = false;
    }
    if (lastScene !== null) XB.fx.transition(name);
    lastScene = name;
  }

  function render() {
    if (!state) return;
    if (state.scene !== "vn") {
      cancelTyping();
      cancelChoiceTimer();
      stopInteract();
    }
    showScene(state.scene);
    if (state.scene === "title") renderTitle();
    else if (state.scene === "map") renderMap();
    else if (state.scene === "vn") renderVn(currentNode(state));
    else if (state.scene === "ending") renderEnding();
    updateDebug();
  }

  function renderTitle() {
    XB.audio.setScene("title");
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
    XB.audio.setScene("map");
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
    els.vnInteract.hidden = true;
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
    if (bg) {
      paintStage(bg);
      XB.audio.setScene(bg);
      if (bg === "luding_bridge" && !ludingFlashed) {
        ludingFlashed = true;
        XB.fx.flash();
      }
    }

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
      case "interact":
        startInteract(found.node);
        break;
      case "title":
        showTitleCard(found.node.text, found.node.sub, advanceVn, {
          bg: found.node.bg,
          place: found.node.place
        });
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
    els.vnNext.textContent = "";
    var mark = document.createElement("span");
    mark.className = "vn-next__mark";
    mark.textContent = "▼";
    els.vnNext.appendChild(mark);
    if (!lastPage) {
      els.vnNext.appendChild(document.createTextNode(" " + (vnRun.pageIndex + 1) + "/" + vnRun.pages.length));
    }
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
    XB.audio.cue(timedOut ? "choice-timeout" : "choice-select");
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
        onCue: function (name) {
          XB.audio.cue(name);
        },
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

    XB.audio.cue("result");
    if (result && result.gameId === "climb" && Number(result.stats && result.stats.lost) > 0) XB.fx.shake();

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

  function buildZunyiCard(node) {
    var recent = state.choices.filter(function (entry) {
      return entry.chapter === "zunyi";
    }).slice(-3);
    var admit = Math.max(0, Math.min(3, Number(state.flags["choice.zunyi.admit"]) || 0));
    var view = {
      title: node.title || "错误卡",
      note: node.note || "",
      stats: "",
      lists: []
    };
    if (recent.length < 3) {
      // 调试跳章时没有完整日志；宁可说记录不全，也不替玩家补答案。
      view.stats = "记录不全";
      view.lists.push({ heading: "记录不全", items: ["只找到 " + recent.length + " 条遵义记录。"] });
      return view;
    }
    view.stats = (node.conclusions && node.conclusions[admit]) || "";
    recent.forEach(function (entry, index) {
      view.lists.push({
        heading: (node.questions && node.questions[index]) || "第 " + (index + 1) + " 条",
        items: [entry.text]
      });
    });
    return view;
  }

  function buildResultView(node) {
    var gameId = node.game || (lastMinigameResult && lastMinigameResult.gameId) || null;
    if (node.source === "zunyi") return buildZunyiCard(node);
    var runtime = lastMinigameResult && (!gameId || lastMinigameResult.gameId === gameId) ? lastMinigameResult : null;
    var view = {
      title: node.title || "结算",
      note: node.note || "",
      stats: "",
      lists: []
    };

    if (node.source === "interact") {
      var picked = lastInteractResult;
      var count = picked ? picked.count : (state.flags["memory.zhang"] === true ? 1 : 0);
      view.stats = count ? "抄下 " + count + " 个名字" : "一个没抄";
      if (picked && picked.count && picked.name) {
        view.lists.push({ heading: "抄下的名字", items: [picked.name] });
      }
      (node.lists || []).forEach(function (list) {
        if (!evalWhen(state, list.when)) return;
        view.lists.push({ heading: list.heading, items: (list.items || []).slice() });
      });
      return view;
    }

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

  /* ---------------- 结局 ---------------- */

  var ENDING_STATUS_TEXT = {
    self: "答到",
    remote: "在别的连答到",
    player: "替他答到",
    missed: "未应"
  };

  function renderEnding() {
    var storyEnding = (XB.story && XB.story.ending) || {};
    XB.audio.setScene("ending");
    if (!endingCuePlayed) {
      endingCuePlayed = true;
      XB.audio.cue("ending");
    }
    if (!isFullEnding(state.ending)) {
      state.ending = buildEnding(state);
      saveNow();
    }
    paintStage("wuqi_wall");
    els.endingTitle.textContent = storyEnding.title || "向北";
    els.endingDate.textContent = (storyEnding.date || "") + " · 吴起镇";
    els.endingLede.textContent = storyEnding.lede || "";

    els.endingNames.textContent = "";
    state.ending.names.forEach(function (entry) {
      var row = document.createElement("li");
      row.className = "xb-ending__name is-" + entry.status;
      var name = document.createElement("span");
      name.className = "xb-ending__name-text";
      name.textContent = entry.name;
      var status = document.createElement("span");
      status.className = "xb-ending__name-status";
      status.textContent = ENDING_STATUS_TEXT[entry.status] || entry.status;
      row.append(name, status);
      els.endingNames.append(row);
    });

    var statsData = state.ending.stats;
    els.endingStats.textContent =
      "全连：出发 " + statsData.companyStart + " 人，到吴起 " + statsData.companyEnd + " 人（虚构连队，非史料统计）\n" +
      "中央红军：出发 " + statsData.redStart.toLocaleString("en-US") + " 余人，到陕北 " + statsData.redEnd.toLocaleString("en-US") + " 余人（史实）";

    var byId = {};
    state.ending.cards.forEach(function (card) {
      byId[card.id] = card;
    });
    els.endingCards.textContent = "";
    (storyEnding.cards || []).forEach(function (def) {
      var snapshot = byId[def.id];
      if (!snapshot) return;
      var card = document.createElement("article");
      card.className = "xb-ending__card " + (snapshot.lit ? "is-lit" : "is-unlit");
      var title = document.createElement("h3");
      title.textContent = def.title;
      var line = document.createElement("p");
      line.textContent = snapshot.line;
      card.append(title, line);
      els.endingCards.append(card);
    });

    els.endingDisclaimer.textContent = storyEnding.disclaimer || "本作人物与连队均为虚构，非史料人物。";
    XB.fx.strike();
    els.endingHome.focus({ preventScroll: true });
  }

  /* ---------------- 点名 / 记名 ---------------- */

  function startInteract(node) {
    stopInteract();
    hidePanels();
    els.vnInteract.hidden = false;
    els.sceneVn.classList.add("is-interacting");
    els.vnToolbar.hidden = true;
    interactRun.active = true;
    interactRun.mode = node.mode;
    interactRun.node = node;
    interactRun.finished = false;
    interactRun.answered = 0;
    interactRun.missed = 0;
    interactRun.cursor = -1;
    interactRun.phase = "";
    interactRun.phaseRemaining = 0;
    interactRun.total = (Number(node.duration) || 0) * 1000;
    interactRun.remaining = interactRun.total;
    interactRun.lastTs = 0;
    interactRun.lastSecond = -1;
    interactRun.entries = [];
    lastInteractResult = null;
    interactRun.rafId = 0;

    if (node.mode === "rollcall") {
      els.interactKicker.textContent = "点名";
      interactRun.entries = (node.names || []).map(function (entry) {
        return { id: entry.id, name: entry.name, base: entry.status || "self", status: entry.status || "self", done: false };
      });
      els.interactAnswer.textContent = "替他答到";
      els.interactAnswer.hidden = true;
      renderRollcallChips();
      nextRollcall();
    } else if (node.mode === "namepick") {
      els.interactKicker.textContent = "记名";
      els.interactName.textContent = "抄名字";
      els.interactAnswer.textContent = "跳过";
      els.interactAnswer.hidden = false;
      buildNamepick(node);
    } else {
      console.error("[XB] 未知交互模式：" + node.mode);
      stopInteract();
      advanceVn();
      return;
    }
    interactRun.rafId = requestAnimationFrame(stepInteract);
  }

  function stopInteract() {
    interactRun.active = false;
    if (interactRun.rafId) cancelAnimationFrame(interactRun.rafId);
    interactRun.rafId = 0;
    if (els.vnInteract) els.vnInteract.hidden = true;
    if (els.sceneVn) els.sceneVn.classList.remove("is-interacting");
  }

  function setInteractProgress(ratio) {
    var percent = Math.max(0, Math.min(1, ratio)) * 100;
    els.interactProgress.style.width = percent.toFixed(2) + "%";
  }

  function announceInteract(text) {
    els.interactLive.textContent = text;
  }

  function renderRollcallChips() {
    els.interactNames.textContent = "";
    interactRun.entries.forEach(function (entry) {
      var chip = document.createElement("span");
      chip.className = "interact-chip is-" + entry.status + (entry.done ? " is-done" : "");
      chip.textContent = entry.name;
      els.interactNames.append(chip);
    });
  }

  function nextRollcall() {
    if (!interactRun.active || interactRun.finished) return;
    interactRun.cursor += 1;
    if (interactRun.cursor >= interactRun.entries.length) {
      finishRollcall();
      return;
    }
    var entry = interactRun.entries[interactRun.cursor];
    els.interactName.textContent = entry.name;
    if (entry.base === "remote" || entry.base === "self") {
      interactRun.phase = "auto";
      interactRun.phaseRemaining = 700;
      els.interactStatus.textContent = entry.base === "remote" ? "在别的连，那边有人应了一声" : "答到";
      els.interactAnswer.hidden = true;
      announceInteract("念到 " + entry.name + "，" + (entry.base === "remote" ? "别的连有人应了" : "答到"));
    } else {
      interactRun.phase = "wait";
      interactRun.phaseRemaining = 4000;
      els.interactStatus.textContent = "没有人应 · 4";
      els.interactAnswer.hidden = false;
      announceInteract("念到 " + entry.name + "，没有人应");
    }
    interactRun.lastSecond = -1;
    renderRollcallChips();
  }

  function answerRollcall() {
    if (!interactRun.active || interactRun.mode !== "rollcall" || interactRun.phase !== "wait") return;
    var entry = interactRun.entries[interactRun.cursor];
    if (!entry || entry.done) return;
    entry.status = "player";
    entry.done = true;
    interactRun.answered += 1;
    announceInteract("替 " + entry.name + " 答到");
    nextRollcall();
  }

  function finishRollcall() {
    if (interactRun.finished) return;
    interactRun.finished = true;
    interactRun.entries.forEach(function (entry) {
      if (entry.done) return;
      entry.status = entry.base === "remote" || entry.base === "self" ? entry.base : "missed";
      entry.done = true;
    });
    var names = interactRun.entries.map(function (entry) {
      return { id: entry.id, name: entry.name, status: entry.status };
    });
    var answered = names.filter(function (entry) { return entry.status === "player"; }).length;
    var missed = names.filter(function (entry) { return entry.status === "missed"; }).length;
    state.ending = { names: names, answered: answered, missed: missed };
    setFlag(state, "memory.rollcall_missed_any", missed > 0);
    lastInteractResult = null;
    saveNow();
    stopInteract();
    advanceVn();
  }

  function buildNamepick(node) {
    interactRun.entries = (node.names || []).map(function (entry) {
      return { id: entry.id, name: entry.name, status: "none", done: false };
    });
    els.interactName.textContent = "抄名字";
    els.interactStatus.textContent = "还有 " + Math.ceil(interactRun.remaining / 1000) + " 秒";
    els.interactNames.textContent = "";
    interactRun.entries.forEach(function (entry) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "interact-name-button";
      button.dataset.action = "pick-name";
      button.dataset.nameId = entry.id;
      button.textContent = entry.name;
      els.interactNames.append(button);
    });
    setInteractProgress(1);
    announceInteract("点选要抄下的名字，不选即跳过");
  }

  function pickName(nameId) {
    if (!interactRun.active || interactRun.mode !== "namepick" || interactRun.finished) return;
    var entry = null;
    interactRun.entries.forEach(function (candidate) {
      if (candidate.id === nameId) entry = candidate;
    });
    if (!entry) return;
    interactRun.finished = true;
    if (nameId === "zhang") setFlag(state, "memory.zhang", true);
    lastInteractResult = { count: 1, name: entry.name, id: entry.id };
    announceInteract("记下 " + entry.name);
    stopInteract();
    advanceVn();
  }

  function skipNamepick() {
    if (!interactRun.active || interactRun.mode !== "namepick" || interactRun.finished) return;
    interactRun.finished = true;
    lastInteractResult = { count: 0, name: "", id: "" };
    announceInteract("一个没抄");
    stopInteract();
    advanceVn();
  }

  function stepInteract(timestamp) {
    if (!interactRun.active || interactRun.finished) return;
    if (state.paused) {
      interactRun.lastTs = 0;
      interactRun.rafId = requestAnimationFrame(stepInteract);
      return;
    }
    if (!interactRun.lastTs) interactRun.lastTs = timestamp;
    var dt = Math.min(timestamp - interactRun.lastTs, 50);
    interactRun.lastTs = timestamp;
    interactRun.remaining -= dt;
    setInteractProgress(interactRun.remaining / interactRun.total);

    if (interactRun.mode === "rollcall") {
      if (interactRun.remaining <= 0) {
        finishRollcall();
        return;
      }
      interactRun.phaseRemaining -= dt;
      var seconds = Math.ceil(interactRun.phaseRemaining / 1000);
      if (interactRun.phase === "wait" && seconds !== interactRun.lastSecond) {
        interactRun.lastSecond = seconds;
        els.interactStatus.textContent = "没有人应 · " + Math.max(0, seconds);
      }
      if (interactRun.phaseRemaining <= 0) {
        var entry = interactRun.entries[interactRun.cursor];
        if (entry && !entry.done) {
          if (interactRun.phase === "auto") {
            entry.status = entry.base;
          } else {
            entry.status = "missed";
            announceInteract("念到 " + entry.name + "，没有应");
          }
          entry.done = true;
        }
        nextRollcall();
      }
    } else if (interactRun.mode === "namepick") {
      var left = Math.ceil(interactRun.remaining / 1000);
      if (left !== interactRun.lastSecond) {
        interactRun.lastSecond = left;
        els.interactStatus.textContent = "还有 " + Math.max(0, left) + " 秒";
      }
      if (interactRun.remaining <= 0) {
        skipNamepick();
        return;
      }
    }
    interactRun.rafId = requestAnimationFrame(stepInteract);
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

  function applyChapterMemory(chapterId) {
    var key = CHAPTER_MEMORY[chapterId];
    if (!key) return;
    if (state.flags[key] !== true) setFlag(state, key, true);
  }

  // 章末三种出口：下一章（解锁并直接接上）/ 地图 / 结局快照。
  function finishChapter(node) {
    applyChapterMemory(state.chapterId);
    var nextId = node.next || null;

    if (nextId === "ending") {
      state.ending = buildEnding(state);
      state.scene = "ending";
      state.nodeId = null;
      saveExists = true;
      saveNow();
      render();
      return;
    }

    if (!nextId || nextId === "map") {
      state.nodeId = null;
      go("map");
      return;
    }

    var chapter = chapterById(nextId);
    if (!chapter || !chapter.playable) {
      state.nodeId = null;
      go("map");
      return;
    }
    if (state.unlockedChapters.indexOf(nextId) === -1) {
      state.unlockedChapters.push(nextId);
      toast("「" + chapter.title + "」已解锁");
    }
    if (nextId === "wuqi") {
      WUQI_MEMORY.forEach(function (key) {
        if (state.flags[key] !== true) setFlag(state, key, true);
      });
    }
    if (startChapter(state, nextId)) {
      saveExists = true;
      render();
      saveNow();
      return;
    }
    state.nodeId = null;
    go("map");
  }

  /* ---------------- 标题卡与史实注 ---------------- */

  function showTitleCard(text, sub, onClose, options) {
    options = options || {};
    var bg = options.bg || null;
    var place = options.place || "";
    var plate = TITLE_CARD_BG[bg] || null;
    var isMap = bg === "xiangjiang_map";
    XB.audio.cue("chapter");
    titleCardState.open = true;
    titleCardState.onClose = onClose || null;
    els.vnTitleChapter.textContent = text || "";
    els.vnTitleSub.textContent = sub || "";
    els.vnTitleSub.hidden = !sub;
    els.vnTitlePlace.textContent = place;
    els.vnTitlePlace.hidden = !place;
    els.vnTitleCard.classList.toggle("has-photo", !!plate);
    els.vnTitleCard.classList.toggle("is-map", isMap);
    if (plate) {
      els.vnTitleCard.style.setProperty("--title-card-image", 'url("' + plate + '")');
      if (XB.art && XB.art.preload) XB.art.preload(bg);
    } else {
      els.vnTitleCard.style.removeProperty("--title-card-image");
    }
    var vnScene = els.vnTitleCard.parentElement;
    if (vnScene) vnScene.classList.add("is-title-card");
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
    els.vnTitleCard.classList.remove("has-photo", "is-map");
    els.vnTitleCard.style.removeProperty("--title-card-image");
    els.vnTitlePlace.textContent = "";
    els.vnTitlePlace.hidden = true;
    var vnScene = els.vnTitleCard.parentElement;
    if (vnScene) vnScene.classList.remove("is-title-card");
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
    XB.audio.cue("codex");
    refreshAudioDuck();
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

    els.codexFigure.textContent = "";
    if (card.image) {
      var image = document.createElement("img");
      image.src = card.image;
      image.alt = card.title + " 场景示意";
      var caption = document.createElement("figcaption");
      caption.textContent = "场景示意";
      els.codexFigure.append(image, caption);
      els.codexFigure.hidden = false;
      els.codexImageNote.textContent = card.imageNote ||
        "照片说明：部分场景图为1967年或当代拍摄，作历史氛围示意，非1935年现场。";
      els.codexImageNote.hidden = false;
    } else {
      els.codexFigure.hidden = true;
      els.codexImageNote.hidden = true;
    }

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
    refreshAudioDuck();

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

  function galleryGateLabel(card) {
    var chapters = (XB.story && XB.story.chapters) || [];
    var cards = (XB.story && XB.story.codex) || [];
    var index = cards.indexOf(card);
    if (index < 0 || !chapters[index]) return "继续往北解锁";
    return index === 0 ? "序章解锁" : "第 " + index + " 章解锁";
  }

  function renderGallery() {
    var cards = (XB.story && XB.story.codex) || [];
    els.galleryCount.textContent = state.codex.length + " / " + cards.length;
    els.galleryGrid.textContent = "";
    cards.forEach(function (card, index) {
      var unlocked = state.codex.indexOf(card.id) !== -1;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "xb-gallery__card " + (unlocked ? "is-unlocked" : "is-locked");
      button.dataset.action = "gallery-card";
      button.dataset.codex = card.id;
      if (!unlocked) button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-label", card.title + (unlocked ? "，已解锁" : "，未解锁，" + galleryGateLabel(card)));

      var thumb = document.createElement("img");
      thumb.className = "xb-gallery__thumb";
      thumb.src = CODEX_THUMBS[card.id] || "";
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.decoding = "async";
      var order = document.createElement("span");
      order.className = "xb-gallery__card-order";
      order.textContent = index + 1 < 10 ? "0" + (index + 1) : String(index + 1);
      var title = document.createElement("h3");
      title.textContent = card.title;
      var type = document.createElement("p");
      type.className = "xb-gallery__card-type";
      type.textContent = card.type;
      var gate = document.createElement("span");
      gate.className = "xb-gallery__card-state";
      gate.textContent = unlocked ? "已记入" : galleryGateLabel(card);
      button.append(thumb, order, title, type, gate);
      els.galleryGrid.append(button);
    });
  }

  function openGallery() {
    if (galleryState.open) return;
    galleryState.open = true;
    XB.audio.cue("codex");
    refreshAudioDuck();
    galleryState.previousFocus = document.activeElement;
    renderGallery();
    els.codexGallery.hidden = false;
    els.galleryClose.focus();
  }

  function closeGallery() {
    if (!galleryState.open) return;
    galleryState.open = false;
    els.codexGallery.hidden = true;
    refreshAudioDuck();
    var previous = galleryState.previousFocus;
    galleryState.previousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus();
  }

  // 暂停、图鉴、史实注可能叠在一起，取最安静的一档，不叠乘。
  function refreshAudioDuck() {
    var duck = 1;
    if (codexState.open || galleryState.open) duck = Math.min(duck, 0.45);
    if (state && state.paused) duck = Math.min(duck, 0.3);
    XB.audio.setDuck(duck);
  }

  function openGalleryCard(id) {
    var card = codexById(id);
    if (!card) {
      toast("史实注缺失：" + id);
      return;
    }
    if (state.codex.indexOf(id) === -1) {
      toast(galleryGateLabel(card) + "后可在图鉴查看");
      return;
    }
    openCodex(id, { unlock: false });
  }

  /* ---------------- 场景与暂停 ---------------- */

  function go(scene) {
    stopMinigame();
    stopInteract();
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
    }, { bg: "yudu_river", place: "赣南 · 于都河" });
  }

  function resumeGame() {
    stopMinigame();
    if (state.scene !== "title") {
      render();
      return;
    }
    if (!state.nodeId && isFullEnding(state.ending)) {
      state.scene = "ending";
      render();
      saveNow();
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
    ["pause-map", "pause-title", "open-roster"].forEach(function (action) {
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
    refreshAudioDuck();
    lastFocused = document.activeElement;
    cancelAuto();
    if (vnRun.typing) {
      cancelTyping();
      vnRun.paused = true;
    }
    els.pause.hidden = false;
    els.pauseMenu.hidden = false;
    els.vnSettings.hidden = true;
    els.vnRoster.hidden = true;
    var first = els.pauseMenu.querySelector("button");
    if (first) first.focus();
  }

  function closePause() {
    if (!state || !state.paused) return;
    state.paused = false;
    refreshAudioDuck();
    els.pause.hidden = true;
    els.vnSettings.hidden = true;
    els.vnRoster.hidden = true;
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
    els.vnRoster.hidden = true;
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

  // 花名册只读现有数据：点名前的名字一律“在册”，点名后才显示应/未应，避免提前剧透。
  function renderRoster() {
    var ended = !!(state.ending && Array.isArray(state.ending.names) && state.ending.names.length);
    var rows = ended
      ? state.ending.names
      : rollcallEntries().map(function (entry) {
          return { id: entry.id, name: entry.name, status: "unknown" };
        });
    var labels = {
      self: "在",
      remote: "在别的连",
      player: "你替他答了",
      missed: "未应",
      unknown: "在册"
    };
    els.rosterList.textContent = "";
    var missed = 0;
    rows.forEach(function (entry) {
      var li = document.createElement("li");
      li.className = "xb-roster__item";
      if (entry.status === "missed") {
        li.classList.add("is-missed");
        missed += 1;
      } else if (entry.status === "player") {
        li.classList.add("is-answered");
      } else if (entry.status === "remote") {
        li.classList.add("is-remote");
      }
      var name = document.createElement("span");
      name.className = "xb-roster__name";
      name.textContent = entry.name;
      var status = document.createElement("span");
      status.className = "xb-roster__status";
      status.textContent = labels[entry.status] || labels.unknown;
      li.append(name, status);
      els.rosterList.append(li);
    });
    if (!ended) {
      els.rosterFoot.textContent = "点名之后，这里会记下谁应了，谁没有。";
    } else if (missed > 0) {
      els.rosterFoot.textContent = "还有 " + missed + " 个名字，没有人应。";
    } else {
      els.rosterFoot.textContent = "所有名字都有人应。";
    }
  }

  function openRoster() {
    renderRoster();
    els.pauseMenu.hidden = true;
    els.vnSettings.hidden = true;
    els.vnRoster.hidden = false;
    els.vnRoster.scrollTop = 0;
    els.vnRoster.focus();
  }

  function closeRoster() {
    els.vnRoster.hidden = true;
    els.pauseMenu.hidden = false;
    var first = els.pauseMenu.querySelector("button");
    if (first) first.focus();
  }

  function onVisibilityChange() {
    // 切走标签页时停表：倒计时和打字机都不该在看不见时偷跑。
    if (document.hidden) {
      XB.audio.suspend();
      if (state && state.scene === "vn" && !state.paused) openPause();
      return;
    }
    XB.audio.resume();
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
      XB.audio.applySettings({ volume: state.settings.volume });
      saveNow();
    });
    els.setMusicVolume.addEventListener("input", function () {
      state.settings.musicVolume = Number(els.setMusicVolume.value) / 100;
      els.setMusicVolumeValue.textContent = els.setMusicVolume.value;
      XB.audio.applySettings({ musicVolume: state.settings.musicVolume });
      saveNow();
    });
    els.setEnvVolume.addEventListener("input", function () {
      state.settings.ambienceVolume = Number(els.setEnvVolume.value) / 100;
      els.setEnvVolumeValue.textContent = els.setEnvVolume.value;
      XB.audio.applySettings({ ambienceVolume: state.settings.ambienceVolume });
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
    els.setMusicVolume.value = String(Math.round(settings.musicVolume * 100));
    els.setMusicVolumeValue.textContent = String(Math.round(settings.musicVolume * 100));
    els.setEnvVolume.value = String(Math.round(settings.ambienceVolume * 100));
    els.setEnvVolumeValue.textContent = String(Math.round(settings.ambienceVolume * 100));
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
    XB.audio.applySettings(state.settings);
    XB.fx.setReduced(state.settings.reducedMotion === true);
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
    els.codexGallery.addEventListener("click", function (event) {
      if (event.target === els.codexGallery) closeGallery();
    });
    // 标题卡不单独绑 pointerdown：document 上的 onPointerDown 已经负责关它并 return，
    // 两处都绑会让同一次点击关完卡片后继续把 p001 的第一页“补全”，第一句等于没打。
  }

  function onPointerDown(event) {
    XB.audio.unlock();
    if (event.button !== undefined && event.button !== 0) return;
    var target = event.target;
    if (!target || !target.closest) return;
    if (target.closest("[data-action]")) return; // 按钮交给 click，避免一次点击走两条路
    if (titleCardState.open) {
      closeTitleCard();
      return;
    }
    if (codexState.open || galleryState.open) return;
    if (interactRun.active) return;
    if (!state || state.scene !== "vn" || state.paused) return;
    if (XB.minigames && XB.minigames.isActive()) return;
    if (target.closest("#vn-dialogue, #scene-vn")) advanceInput();
  }

  function onClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var actionElement = target.closest("[data-action]");
    if (!actionElement) return;
    var actionName = actionElement.dataset.action;
    if (actionElement.getAttribute("aria-disabled") === "true" && actionName !== "skip" && actionName !== "gallery-card") return;
    handleAction(actionElement.dataset.action, actionElement);
  }

  function onKeyDown(event) {
    XB.audio.unlock();
    if (event.key === "Escape") {
      if (codexState.open) {
        closeCodex();
        event.preventDefault();
        return;
      }
      if (galleryState.open) {
        closeGallery();
        event.preventDefault();
        return;
      }
      if (titleCardState.open) {
        closeTitleCard();
        event.preventDefault();
        return;
      }
      if (state && state.paused && els.vnRoster && !els.vnRoster.hidden) {
        closeRoster();
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
    if (event.key === "Tab" && galleryState.open) {
      trapFocus(event, els.codexGallery);
      return;
    }
    if (galleryState.open) return;

    if (interactRun.active) {
      var answerKey = event.key === " " || event.key === "Enter" || event.key === "Spacebar";
      if (answerKey && !event.repeat && !state.paused && interactRun.mode === "rollcall" &&
          interactRun.phase === "wait" && !isControlFocused()) {
        event.preventDefault();
        answerRollcall();
      }
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
        openGallery();
        break;
      case "gallery-close":
        closeGallery();
        break;
      case "gallery-card":
        openGalleryCard(target.dataset.codex);
        break;
      case "interact-answer":
        if (interactRun.mode === "rollcall") answerRollcall();
        else skipNamepick();
        break;
      case "pick-name":
        pickName(target.dataset.nameId);
        break;
      case "ending-home":
        go("title");
        break;
      case "ending-codex":
        openGallery();
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
      case "open-roster":
        openRoster();
        break;
      case "close-roster":
        closeRoster();
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
