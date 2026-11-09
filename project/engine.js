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

  var SAVE_VERSION = 2;

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

  // 基础旗标：缺省值即“还没做选择”的状态，normalize 会把旧档补齐。
  // 行囊五件、湘江六样“带上船”、金沙江先渡谁、泸定门板都留了布尔位；
  // choice.jinsha.trips / lights_lost 只为读旧档保留，v1.2.0 不再写、不再显示。
  var FLAG_DEFAULTS = {
    "item.door": false,
    "item.pot": false,
    "item.medicine": false,
    "item.barley": false,
    "item.homepot": false,
    "item.raincloth": false,
    "item.shoes": false,
    load: 0,
    trust: 0,
    fire: 50,
    lights_lost: 0,
    "choice.xiangjiang.abandoned": [],
    "choice.xiangjiang.take.xray": false,
    "choice.xiangjiang.take.press": false,
    "choice.xiangjiang.take.files": false,
    "choice.xiangjiang.take.medkit": false,
    "choice.xiangjiang.take.radio": false,
    "choice.xiangjiang.take.silver": false,
    "choice.zunyi.missed": 0,
    "choice.zunyi.admit": 0,
    "choice.jinsha.trips": 0,
    "choice.jinsha.main": false,
    "choice.jinsha.wounded": false,
    "choice.jinsha.kettle": false,
    "choice.luding.door": false,
    // v1.3.0 人物命运：三次救人危机的生死、救了几次的消耗、序章有没有带门板。
    "fate.feimao.dead": false,
    "fate.zaowang.dead": false,
    "fate.dongsheng.dead": false,
    "fate.lin.dead": false,
    "fate.all.dead": false,
    "had.door": false,
    // v1.4.0：状态 0–4、成功救人数、三人帮助、我是否倒下、门板去向。
    condition: 3,
    rescues: 0,
    "help.used": false,
    "memory.help": false,
    "memory.help_door": false,
    // v1.5.1 金沙江记名：pick/skip 都写，配合 memory.zhang 区分两条成就。
    "memory.namepick_done": false,
    "fate.player.dead": false,
    // 由引擎派生：7(5) 与坏结局是互斥出口，剧本条件语法没有 OR。
    "fate.seven5": false,
    "fate.badend": false,
    "grass.settled": false,
    "quality.feimao": 3,
    "quality.zaowang": 3,
    "quality.dongsheng": 3,
    doorOutcome: "none",
    "inventory.giftBarley": false,
    // v1.3 兼容：strain 只由引擎按 3-rescues 反推，剧本不再写。
    strain: 0,
    "strain.hurt": false,
    "strain.dying": false
  };

  // 数值旗标的上限下限：fire 是火种，trust 是民心（0–6 段），load 是行囊格数，strain 是救人的消耗。
  var FLAG_LIMITS = {
    fire: [0, 100],
    trust: [0, 6],
    load: [0, 99],
    lights_lost: [0, 22],
    "choice.zunyi.missed": [0, 1],
    "choice.zunyi.admit": [0, 3],
    "choice.jinsha.trips": [0, 18],
    condition: [0, 4],
    rescues: [0, 3],
    "quality.feimao": [0, 3],
    "quality.zaowang": [0, 3],
    "quality.dongsheng": [0, 3],
    strain: [0, 3]
  };

  // 剧情只允许写这些旗标：ending/card/unlockedChapters 由引擎自己管。
  var FLAG_KEYS = [
    "item.pot",
    "item.medicine",
    "item.barley",
    "item.homepot",
    "item.raincloth",
    "item.shoes",
    "load",
    "trust",
    "fire",
    "lights_lost",
    "choice.xiangjiang.abandoned",
    "choice.zunyi.missed",
    "choice.zunyi.admit",
    "choice.jinsha.trips",
    "strain",
    "condition",
    "rescues",
    "help.used",
    "fate.player.dead",
    "doorOutcome",
    "inventory.giftBarley"
  ];

  // 唯一允许的 list flag：弃物留下清单。顺序也是存档与结果页的排序。
  var ABANDON_ORDER = ["xray", "press", "files", "medkit", "radio", "silver", "door"];
  var INVENTORY_IDS = ["roster", "pencil", "medicine", "barley", "pot", "raincloth", "shoes"];
  // v1.4 行囊四格＝八个半格；门板单独占四单位。旧档超重不裁剪，UI 用 max(4, 已占) 兜底。
  var PACK_SLOTS = 4;
  var PACK_UNITS = 8;
  var ITEM_UNITS = {
    roster: 0,
    pencil: 0,
    medicine: 1,
    barley: 1,
    pot: 4,
    raincloth: 4,
    shoes: 2
  };
  var DOOR_UNITS = 4;
  var DOOR_OUTCOMES = ["none", "carried", "bridge", "grass", "wuqi", "others"];
  // 行囊五件：p024 多选直接写这五个布尔。item.pot 仍是草地“灶王的小锅”，别混用。
  var ITEM_FLAGS = ["item.medicine", "item.barley", "item.homepot", "item.raincloth", "item.shoes"];
  var ITEM_FLAG_BY_INVENTORY = {
    medicine: "item.medicine",
    barley: "item.barley",
    pot: "item.homepot",
    raincloth: "item.raincloth",
    shoes: "item.shoes"
  };
  // 反向表：剧本只写 item.*，物资栏读 inventory.items，靠 setFlag 把两边钉在一起。
  var INVENTORY_BY_ITEM_FLAG = {
    "item.medicine": "medicine",
    "item.barley": "barley",
    "item.homepot": "pot",
    "item.raincloth": "raincloth",
    "item.shoes": "shoes"
  };
  // 湘江六样：旧档只存“留在岸上”的数组，take 布尔由它反推。
  var ABANDON_TAKE_FLAGS = {
    xray: "choice.xiangjiang.take.xray",
    press: "choice.xiangjiang.take.press",
    files: "choice.xiangjiang.take.files",
    medkit: "choice.xiangjiang.take.medkit",
    radio: "choice.xiangjiang.take.radio",
    silver: "choice.xiangjiang.take.silver"
  };
  // fate.* 由三次救人危机写生死；strain 是救人消耗，had.door 记“序章带过门板”。
  var FLAG_PREFIXES = ["memory.", "choice.", "fate.", "quality."];
  // 引擎派生布尔：只由 syncDerivedFlags 写，剧本只读。
  // 门板三态里 doorOutcome 是唯一权威；had.door / item.door 只是它派生的只读副本。
  var DERIVED_FLAGS = [
    "had.door", "item.door",
    "fate.lin.dead", "fate.all.dead", "fate.seven5", "fate.badend", "strain.hurt", "strain.dying"
  ];
  var BOOLEAN_FLAGS = [
    "fate.feimao.dead",
    "fate.zaowang.dead",
    "fate.dongsheng.dead",
    "fate.player.dead",
    "grass.settled",
    "help.used",
    "inventory.giftBarley",
    "memory.namepick_done"
  ].concat(DERIVED_FLAGS);
  var CHOICE_LOG_LIMIT = 64;
  var STATUS_EVENT_LIMIT = 32;
  var statusEvents = [];
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

  function isDoorHeld(state) {
    return state.flags["item.door"] === true || state.inventory.door === true;
  }

  function packUnitsForIds(state, ids) {
    var units = isDoorHeld(state) ? DOOR_UNITS : 0;
    (ids || []).forEach(function (id) {
      units += isFiniteNumber(ITEM_UNITS[id]) ? ITEM_UNITS[id] : 0;
    });
    return units;
  }

  // 物资占格按半格单位算：门板 4，药/青稞 1，鞋 2，锅/雨布 4。
  function packUsage(state) {
    return packUnitsForIds(state, state.inventory.items);
  }

  function packCapacity(state) {
    return Math.max(PACK_UNITS, packUsage(state));
  }

  function optionUnits(option) {
    if (!option) return 0;
    if (option.inventoryId && isFiniteNumber(ITEM_UNITS[option.inventoryId])) {
      return ITEM_UNITS[option.inventoryId];
    }
    if (isFiniteNumber(option.units)) return option.units;
    if (isFiniteNumber(option.slots)) return option.slots * 2;
    return 0;
  }

  // selectedOptions 传选项对象而不是 id：多选 id 与 inventoryId 不一定同名（homepot/pot）。
  function canAddMultiOption(state, option, selectedOptions) {
    if (!option) return false;
    var chosen = Array.isArray(selectedOptions) ? selectedOptions : [];
    var ids = state.inventory.items.slice();
    var extra = 0;
    chosen.forEach(function (item) {
      if (item && item.inventoryId) ids.push(item.inventoryId);
      else if (item) extra += optionUnits(item);
    });
    return packUnitsForIds(state, ids) + extra + optionUnits(option) <= PACK_UNITS;
  }

  var CONDITION_LABELS = ["0", "差", "勉强", "良好", "优秀"];
  var COMPANION_NAMES = { feimao: "飞毛腿", zaowang: "灶王", dongsheng: "冬生" };
  function conditionLabel(value) {
    var at = Math.round(clamp(isFiniteNumber(value) ? value : 3, 0, 4));
    return CONDITION_LABELS[at];
  }
  // 状态弹窗的 0 不用 HUD 的占位“0”：同伴是牺牲，我则是倒下。
  function companionStatusLabel(value) {
    var at = Math.round(clamp(isFiniteNumber(value) ? value : 0, 0, 3));
    return at === 0 ? "牺牲" : conditionLabel(at);
  }
  function playerStatusLabel(value) {
    var at = Math.round(clamp(isFiniteNumber(value) ? value : 3, 0, 4));
    return at === 0 ? "倒下" : conditionLabel(at);
  }

  // 救第 n 人的累计惩罚：无板 0/1/1，有板 0/1/2。用差值写回 condition，避免剧本重复写公式。
  function rescuePenalty(rescues, hasDoor) {
    var count = Math.round(clamp(isFiniteNumber(rescues) ? rescues : 0, 0, 3));
    if (count <= 1) return 0;
    if (count === 2) return 1;
    return hasDoor ? 2 : 1;
  }

  function doorCarried(state) {
    var outcome = state.flags.doorOutcome;
    return outcome === "carried" || outcome === "wuqi" || outcome === "others";
  }

  // 门板 A/B/C 三条件并列：优秀；4 人存活且一人良好；3 人存活且两人良好（我可计入）。
  function doorCanCarry(state) {
    var flags = state.flags;
    if (flags["had.door"] !== true) return false;
    if (flags.condition === 4) return true;
    var good = [flags["quality.feimao"], flags["quality.zaowang"], flags["quality.dongsheng"]].filter(function (q) {
      return q === 3;
    }).length;
    if (flags.rescues === 3) return good >= 1;
    if (flags.rescues === 2) return good + (flags.condition >= 3 ? 1 : 0) >= 2;
    return false;
  }

  function hasPackItem(state, id) {
    if (id === "giftBarley") return state.inventory.giftBarley === true;
    return state.inventory.items.indexOf(id) !== -1;
  }

  function consumePackItem(state, id) {
    if (id === "giftBarley") {
      state.inventory.giftBarley = false;
      state.flags["inventory.giftBarley"] = false;
      return;
    }
    state.inventory.items = state.inventory.items.filter(function (item) {
      return item !== id;
    });
    var flag = ITEM_FLAG_BY_INVENTORY[id];
    if (flag) state.flags[flag] = false;
  }

  // 剧本用 item.* 表示“用掉了/拿到了”，物资栏与 packUsage 读 inventory.items。
  // 旗标是权威，清单只是镜像：写旗标时同步，免得药喂给飞毛腿后面板里还挂着一包。
  function mirrorPackItem(state, flag, value) {
    var id = INVENTORY_BY_ITEM_FLAG[flag];
    if (!id || !state.inventory || !Array.isArray(state.inventory.items)) return;
    var at = state.inventory.items.indexOf(id);
    if (value === true) {
      if (at === -1) state.inventory.items.push(id);
      return;
    }
    if (at !== -1) {
      state.inventory.items = state.inventory.items.filter(function (item) {
        return item !== id;
      });
    }
  }

  // 旧档修复：v1.4 早期的危机只写了 item.* = false，清单里那件东西还留着。
  // 只认存档里明确写过的 false，没写过的键不动，免得误伤 v1.3 迁移上来的行囊。
  function repairPackMirror(state, savedFlags) {
    if (!isPlainObject(savedFlags) || !Array.isArray(state.inventory.items)) return;
    state.inventory.items = state.inventory.items.filter(function (id) {
      var flag = ITEM_FLAG_BY_INVENTORY[id];
      return !(flag && hasOwn(savedFlags, flag) && savedFlags[flag] === false);
    });
  }

  // 物资使用：组合合法才扣；优秀时不给用，避免把“状态足够”误写成消耗。
  function usePackItems(state, ids) {
    var asked = Array.isArray(ids) ? ids.filter(function (id, index, list) {
      return typeof id === "string" && list.indexOf(id) === index;
    }) : [];
    var recipe = null;
    var key = asked.slice().sort().join("+");
    if (key === "shoes") recipe = { delta: 1, items: ["shoes"], label: "布鞋" };
    else if (key === "pot") recipe = { delta: 2, items: ["pot"], label: "铁锅" };
    else if (key === "raincloth") recipe = { delta: 1, items: ["raincloth"], label: "雨布" };
    else if (key === "barley+medicine") recipe = { delta: 1, items: ["barley", "medicine"], label: "青稞和药" };
    else if (key === "barley+giftBarley") recipe = { delta: 2, items: ["barley", "giftBarley"], label: "青稞" };
    else if (key === "giftBarley+medicine") recipe = { delta: 1, items: ["giftBarley", "medicine"], label: "冬生的青稞和药" };
    if (!recipe) return { ok: false, reason: "不认识这组物资。" };
    if (recipe.items.indexOf("raincloth") !== -1 && state.chapterId !== "grass") {
      return { ok: false, reason: "雨布只能在草地使用。" };
    }
    if (state.flags.condition >= 4) return { ok: false, reason: "状态已足够。" };
    for (var i = 0; i < recipe.items.length; i += 1) {
      if (!hasPackItem(state, recipe.items[i])) return { ok: false, reason: "行囊里没有这件东西。" };
    }
    recipe.items.forEach(function (id) {
      consumePackItem(state, id);
    });
    setFlag(state, "condition", "+" + recipe.delta, "你用了" + recipe.label);
    state.flags.load = packUsage(state);
    syncDerivedFlags(state);
    return { ok: true, delta: recipe.delta, used: recipe.items, condition: state.flags.condition };
  }

  // 草地结束：先 -1，再看救满 3 人的帮助；0 直接判死（7(5) 例外由 settleDoor 收口）。
  function settleGrass(state) {
    var flags = state.flags;
    if (flags["grass.settled"] === true) {
      return {
        condition: flags.condition,
        dead: flags["fate.player.dead"] === true,
        needPack: flags.condition === 1,
        doorCarry: doorCanCarry(state)
      };
    }
    flags["grass.settled"] = true;
    setFlag(state, "condition", "-1", "草地走到第七天，队伍断了粮");
    if (flags.rescues === 3 && flags["help.used"] !== true && flags.condition === 1) {
      setFlag(state, "condition", "+1", "三个人把你从地上架起来");
      flags["help.used"] = true;
      flags["memory.help"] = true;
    }
    if (flags.condition === 0) flags["fate.player.dead"] = true;
    // 7(5) 只成立在“人死在草地时门板还在身上”。湘江桥头/泸定桥上的板子
    // 已经不在草地里，不能因为救满三人就被改写成“别人带到吴起”。
    var doorOnBody = flags.doorOutcome === "carried";
    if (flags["fate.player.dead"] === true && flags["had.door"] === true && doorOnBody && flags.rescues === 3) {
      flags.doorOutcome = "others";
    }
    syncDerivedFlags(state);
    return {
      condition: flags.condition,
      dead: flags["fate.player.dead"] === true,
      needPack: flags.condition === 1,
      doorCarry: doorCanCarry(state)
    };
  }

  // 差状态关闭物资面板/选择“继续”时调用：仍 <=1 就死；7(5) 已是 others，不再重复判。
  // 走 setFlag 是为了让顶部状态弹窗记录 1→0（“你牺牲了”）；直接改旗标不会产生事件。
  function resolveGrassWarning(state) {
    if (state.flags.condition <= 1 && state.flags["fate.player.dead"] !== true) {
      setFlag(state, "fate.player.dead", true, "没能补充物资");
    }
    syncDerivedFlags(state);
  }

  // 草地末门板去向只读 doorOutcome：桥板/吴起板保留；死了且板还在身上走 7(5) others；
  // 活着且能带则 carried；其余落草地。item.door / had.door 由 syncDerivedFlags 重算。
  function settleDoor(state) {
    var flags = state.flags;
    if (flags.doorOutcome === "none") return "none";
    if (flags.doorOutcome === "bridge" || flags.doorOutcome === "wuqi") return flags.doorOutcome;
    if (flags["fate.player.dead"] === true) {
      if (flags.rescues === 3 && flags.doorOutcome === "carried") flags.doorOutcome = "others";
      else if (flags.doorOutcome !== "others") flags.doorOutcome = "grass";
    } else if (flags.doorOutcome !== "carried" || !doorCanCarry(state)) {
      flags.doorOutcome = "grass";
    }
    syncDerivedFlags(state);
    return flags.doorOutcome;
  }

  // v1.1.1 及以前的档没有 item.* / take.* 布尔：只在“一个新增键都没有”的旧档上反推一次。
  // 新档的布尔由多选结算写入，读档时不覆盖，免得刷新把玩家刚取消的选择又补回来。
  function backfillLegacyFlags(save, flags) {
    var source = isPlainObject(save.flags) ? save.flags : {};
    var hasItemFlags = ITEM_FLAGS.some(function (key) {
      return Object.prototype.hasOwnProperty.call(source, key);
    });
    var hasTakeFlags = Object.keys(ABANDON_TAKE_FLAGS).some(function (id) {
      return Object.prototype.hasOwnProperty.call(source, ABANDON_TAKE_FLAGS[id]);
    });
    if (hasItemFlags || hasTakeFlags) return;

    var items = save.inventory && Array.isArray(save.inventory.items) ? save.inventory.items : [];
    items.forEach(function (id) {
      var flag = ITEM_FLAG_BY_INVENTORY[id];
      if (flag) flags[flag] = true;
    });

    var abandoned = flags["choice.xiangjiang.abandoned"];
    if (abandoned.length) {
      Object.keys(ABANDON_TAKE_FLAGS).forEach(function (id) {
        flags[ABANDON_TAKE_FLAGS[id]] = abandoned.indexOf(id) === -1;
      });
    }
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  // 旧档迁移按“节点在章内的位置”判断，不写死章节号。
  function passedNode(state, chapterId, markerId) {
    var chapter = chapterById(chapterId);
    var current = chapterById(state.chapterId);
    if (!chapter || !current) return false;
    if (current.id !== chapter.id) return current.order > chapter.order;
    if (state.nodeId === null) return state.scene === "map";
    var nodes = chapter.nodes || [];
    var at = -1;
    var marker = -1;
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].id === state.nodeId) at = i;
      if (nodes[i].id === markerId) marker = i;
    }
    return at !== -1 && marker !== -1 && at >= marker;
  }

  // v1.3→v1.4 迁移：旧档的 strain 实际是“救过几人”，不是剩余体力；rescues 直接取它。
  // 生死按“停在哪儿”补，不反推具体选择；旧 ending 快照只补 legacy，不重算。
  // 湘江 x025a 的 A 也写 choice.xiangjiang.hold=true，只有“节点 + C”能区分门板横桥头。
  function choseXiangjiangDoorBridge(save) {
    var choices = save && save.choices;
    if (!Array.isArray(choices)) return false;
    return choices.some(function (entry) {
      return isPlainObject(entry) && entry.nodeId === "x025a" && entry.option === "C";
    });
  }

  // 旧档没有 doorOutcome 时，只在这里从 item/had/memory/choice 反推一次；
  // 反推后 item.door / had.door 一律由 syncDerivedFlags 重算，不再作为独立状态。
  function inferDoorOutcomeFromLegacy(source, save, flags) {
    if (flags.doorOutcome !== "none") return false;
    var sourceHadDoor = source["had.door"] === true ||
      source["item.door"] === true ||
      source["choice.prologue.door"] === true ||
      source["choice.luding.door"] === true;
    if (!sourceHadDoor) return false;
    if (source["item.door"] === true) flags.doorOutcome = "carried";
    else if (source["memory.door"] === true) flags.doorOutcome = "wuqi";
    else if (source["choice.luding.door"] === true) flags.doorOutcome = "bridge";
    else if (choseXiangjiangDoorBridge(save)) flags.doorOutcome = "bridge";
    // v1.4 早期湘江 C 只写 item.door=false：有 item.door 键、板已不在背上，却没有去向。
    else if (hasOwn(source, "item.door")) flags.doorOutcome = "bridge";
    // v1.3 没有 item.door 键；板默认还在背上，旧逻辑到草地才收口。
    else flags.doorOutcome = "grass";
    return true;
  }

  function migrateLegacyFate(state, save) {
    var source = isPlainObject(save.flags) ? save.flags : {};
    var flags = state.flags;
    var legacyVersion = save.version < 2;
    var changed = null;
    if (inferDoorOutcomeFromLegacy(source, save, flags)) changed = "fate";
    flags["had.door"] = flags.doorOutcome !== "none";
    flags["item.door"] = flags.doorOutcome === "carried";
    if (!hasOwn(source, "fate.feimao.dead")) {
      if (state.chapterId === "wuqi" || state.chapterId === "coda") {
        flags["fate.feimao.dead"] = true;
        flags["fate.zaowang.dead"] = true;
        flags["fate.dongsheng.dead"] = false;
        flags.strain = 1;
        changed = "fate";
      } else if (passedNode(state, "luding", "l022") && flags["fate.feimao.dead"] !== true) {
        flags["fate.feimao.dead"] = true;
        flags.strain = 0;
        changed = "fate";
      }
      if (passedNode(state, "grass", "g019") && flags["fate.zaowang.dead"] !== true) {
        flags["fate.zaowang.dead"] = true;
        changed = "fate";
      }
    }

    if (legacyVersion || !hasOwn(source, "rescues")) {
      // 不要拿 flags.strain 兜底：上面的 syncDerivedFlags 已按新档重算过它。
      var oldStrain = isFiniteNumber(source.strain) ? source.strain : 0;
      var oldRescues = Math.round(clamp(oldStrain, 0, 3));
      flags.rescues = oldRescues;
      // 旧档没有状态：按累计救人惩罚回推，再按是否过了草地补 -1。
      flags.condition = Math.round(clamp(3 - rescuePenalty(oldRescues, flags["had.door"] === true), 0, 4));
      if (passedNode(state, "grass", "g027")) flags.condition = Math.round(clamp(flags.condition - 1, 0, 4));
      changed = "fate";
    }
    if (!hasOwn(source, "fate.player.dead")) {
      // 读原始快照：normalizeEnding 已把 v1.3 的 kongye 折成 legacy，拿它判断会漏掉空页。
      var oldRoute = save.ending && save.ending.route;
      flags["fate.player.dead"] = source["strain.dying"] === true ||
        state.chapterId === "coda" ||
        oldRoute === "kongye";
      if (flags["fate.player.dead"] === true && flags.condition > 0 && !hasOwn(source, "condition")) {
        // 旧空页是明确死亡；旧档其他情况没有 player.dead，不在这里硬改 condition。
        flags.condition = state.chapterId === "coda" || oldRoute === "kongye" ? 0 : flags.condition;
      }
      changed = "fate";
    }
    if (legacyVersion || !hasOwn(source, "quality.feimao")) {
      flags["quality.feimao"] = flags["fate.feimao.dead"] === true ? 0 : 2;
      flags["quality.zaowang"] = flags["fate.zaowang.dead"] === true ? 0 : 2;
      flags["quality.dongsheng"] = flags["fate.dongsheng.dead"] === true ? 0 : 2;
      changed = "fate";
    }
    if (legacyVersion) {
      flags["help.used"] = false;
      flags["memory.help"] = false;
    }
    // 旧空页（7(5)）门板是“别人带到吴起”，不能落成草地；这条要压过通用推断。
    if (legacyVersion && flags["fate.player.dead"] === true && flags.rescues === 3 && flags["had.door"] === true) {
      flags.doorOutcome = "others";
    }
    // 已经结算成 grass/others 的 v1.4 早期档：只认 x025a C 日志；A 也写 hold=true，不能单看旗标。
    var choseXiangjiangC = choseXiangjiangDoorBridge(save);
    if (choseXiangjiangC && flags["had.door"] === true &&
        (flags.doorOutcome === "grass" || flags.doorOutcome === "others")) {
      flags.doorOutcome = "bridge";
      changed = changed || "door";
    }
    // 返回非空值会触发一次即时落档与“已补记人物命运”提示；否则旧档要等到下一句才写入。
    return changed;
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
  // v1.4：11 个结局标签；legacy 只给 v1.3 及以前的旧快照补位，不参与新一局判定。
  var ROUTE_IDS = [
    "door_excellent",
    "door_grass_one",
    "door_carry_two",
    "door_grass_many",
    "door_others",
    "no_door_zero",
    "no_door_one",
    "no_door_two",
    "no_door_three",
    "no_door_three_excellent",
    "bad_end",
    "legacy"
  ];
  var ROUTE_DEFS = {
    door_excellent: { index: 1, label: "1", title: "门板", lede: "门板到了吴起。你也是。" },
    door_grass_one: {
      index: 2,
      label: "2",
      title: "门板",
      lede: "门板留在了草地。你到了吴起。",
      bridgeTitle: "桥板",
      bridgeLede: "门板留在了桥上。你到了吴起。"
    },
    door_carry_two: { index: 3, label: "3", title: "门板", lede: "门板到了吴起。你也是。" },
    door_grass_many: {
      index: 4,
      label: "4",
      title: "门板",
      lede: "门板留在了草地。你到了吴起。",
      bridgeTitle: "桥板",
      bridgeLede: "门板留在了桥上。你到了吴起。"
    },
    door_others: { index: 5, label: "5", title: "空页", lede: "名册上多了一个名字，又划掉了。" },
    no_door_zero: { index: 6, label: "6", title: "空手", lede: "你空着手，走到了吴起。" },
    no_door_one: { index: 7, label: "7", title: "空手", lede: "你空着手，走到了吴起。" },
    no_door_two: { index: 8, label: "8", title: "空手", lede: "你空着手，走到了吴起。" },
    no_door_three: { index: 9, label: "9", title: "空手", lede: "你空着手，走到了吴起。" },
    no_door_three_excellent: { index: 10, label: "10", title: "空手", lede: "你空着手，走到了吴起。" },
    bad_end: { index: 11, label: "11", title: "没有走出草地", lede: "草地没有尽头。" },
    legacy: { index: 0, label: "旧档", title: "旧档", lede: "" }
  };
  var LEGACY_ROUTES = ["sidao", "menban", "qiaoban", "kongye"];
  var ENDING_STATS = { companyStart: 104, companyEnd: 19, redStart: 86000, redEnd: 7000 };
  // 章末记忆：只置 true，不覆盖已有的 true；金沙江记名与吴起门板另有交互写。
  var CHAPTER_MEMORY = {
    xiangjiang: "memory.zhou",
    zunyi: "memory.he",
    luding: "memory.feimao",
    grass: "memory.zaowang"
  };
  var WUQI_MEMORY = ["memory.ximei", "memory.dongsheng", "memory.lin"];

  // 吴起是 7 人，空页 coda 是 8 人（多一个由冬生代答的满崽）。
  function validEndingNames(names) {
    // 0 名只用于坏结局：没有走到吴起，名册没有翻开。
    if (!Array.isArray(names) || (names.length !== 0 && names.length !== 7 && names.length !== 8)) return false;
    var seen = {};
    return names.every(function (entry) {
      if (!isPlainObject(entry)) return false;
      if (typeof entry.id !== "string" || !entry.id || seen[entry.id]) return false;
      if (typeof entry.name !== "string" || !entry.name) return false;
      if (NAME_STATUS.indexOf(entry.status) === -1) return false;
      if (entry.answeredBy !== undefined && (typeof entry.answeredBy !== "string" || !entry.answeredBy)) return false;
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

  function validEndingFate(fate) {
    if (!isPlainObject(fate)) return false;
    var required = ["feimao", "zaowang", "dongsheng", "lin"];
    if (!required.every(function (key) {
      return fate[key] === "dead" || fate[key] === "alive";
    })) return false;
    if (Object.keys(fate).length === required.length) return true;
    var keys = required.concat(["player"]);
    return keys.every(function (key) {
      return fate[key] === "dead" || fate[key] === "alive";
    }) && Object.keys(fate).length === keys.length;
  }

  // 点名结束会先写 names/answered/missed，结尾再补 stats/cards；两种形状都收，但键必须干净。
  function normalizeEnding(value) {
    if (!isPlainObject(value)) return null;
    var allowed = [
      "stats", "names", "answered", "missed", "cards",
      "route", "routeIndex", "routeLabel", "routeTitle", "routeLede",
      "fate", "condition", "rescues", "doorOutcome", "strain", "recorded",
      "achievements"
    ];
    var keys = Object.keys(value);
    if (keys.some(function (key) { return allowed.indexOf(key) === -1; })) return null;
    var clean = {};
    if (value.names !== undefined) {
      if (!validEndingNames(value.names)) return null;
      clean.names = value.names.map(function (entry) {
        var row = { id: entry.id, name: entry.name, status: entry.status };
        if (entry.answeredBy !== undefined) row.answeredBy = entry.answeredBy;
        return row;
      });
    }
    if (value.answered !== undefined) {
      if (!isFiniteNumber(value.answered) || value.answered < 0 || value.answered > 8) return null;
      clean.answered = Math.round(value.answered);
    }
    if (value.missed !== undefined) {
      if (!isFiniteNumber(value.missed) || value.missed < 0 || value.missed > 8) return null;
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
    if (value.route !== undefined) {
      if (typeof value.route !== "string") return null;
      if (ROUTE_IDS.indexOf(value.route) === -1 && LEGACY_ROUTES.indexOf(value.route) === -1) return null;
      if (LEGACY_ROUTES.indexOf(value.route) !== -1) {
        clean.route = "legacy";
        clean.routeTitle = "旧档";
        clean.routeLede = "";
      } else {
        clean.route = value.route;
      }
    }
    if (clean.route === "legacy") {
      clean.routeIndex = 0;
      clean.routeLabel = "旧档";
    }
    if (value.routeIndex !== undefined) {
      if (!isFiniteNumber(value.routeIndex) || value.routeIndex < 0 || value.routeIndex > 11) return null;
      clean.routeIndex = Math.round(value.routeIndex);
    }
    if (value.routeLabel !== undefined) {
      if (typeof value.routeLabel !== "string") return null;
      clean.routeLabel = value.routeLabel;
    }
    if (value.routeTitle !== undefined) {
      if (typeof value.routeTitle !== "string") return null;
      clean.routeTitle = value.routeTitle;
    }
    if (value.routeLede !== undefined) {
      if (typeof value.routeLede !== "string") return null;
      clean.routeLede = value.routeLede;
    }
    if (value.fate !== undefined) {
      if (!validEndingFate(value.fate)) return null;
      clean.fate = {
        feimao: value.fate.feimao,
        zaowang: value.fate.zaowang,
        dongsheng: value.fate.dongsheng,
        lin: value.fate.lin,
        // v1.3 快照没有 player 键；空页即玩家已死，其余路线补 alive。
        player: value.fate.player || (value.route === "kongye" ? "dead" : "alive")
      };
    }
    if (value.condition !== undefined) {
      if (!isFiniteNumber(value.condition) || value.condition < 0 || value.condition > 4) return null;
      clean.condition = Math.round(value.condition);
    }
    if (value.rescues !== undefined) {
      if (!isFiniteNumber(value.rescues) || value.rescues < 0 || value.rescues > 3) return null;
      clean.rescues = Math.round(value.rescues);
    }
    if (value.doorOutcome !== undefined) {
      if (DOOR_OUTCOMES.indexOf(value.doorOutcome) === -1) return null;
      clean.doorOutcome = value.doorOutcome;
    }
    if (value.strain !== undefined) {
      if (!isFiniteNumber(value.strain) || value.strain < 0 || value.strain > 3) return null;
      clean.strain = Math.round(value.strain);
    }
    if (value.recorded !== undefined) {
      if (typeof value.recorded !== "boolean") return null;
      clean.recorded = value.recorded;
    }
    if (value.achievements !== undefined) {
      if (!Array.isArray(value.achievements) || value.achievements.length > 48) return null;
      var known = achievementIds();
      var seen = [];
      for (var i = 0; i < value.achievements.length; i += 1) {
        var id = value.achievements[i];
        if (typeof id !== "string" || known.indexOf(id) === -1 || seen.indexOf(id) !== -1) return null;
        seen.push(id);
      }
      clean.achievements = seen;
    }
    return clean;
  }

  function isFullEnding(ending) {
    return !!(ending && ending.stats && ending.names && ending.cards &&
      isFiniteNumber(ending.answered) && isFiniteNumber(ending.missed));
  }

  // 点名名单按生死动态生成：老周必没到，林先生看 strain，三次危机看各自 fate。
  var ROLLCALL_PEOPLE = [
    { id: "he", name: "何指导员", kind: "remote" },
    { id: "ximei", name: "细妹", kind: "self" },
    { id: "lin", name: "林先生", kind: "fate" },
    { id: "zhou", name: "老周", kind: "absent" },
    { id: "zaowang", name: "灶王", kind: "fate" },
    { id: "feimao", name: "飞毛腿", kind: "fate" },
    { id: "dongsheng", name: "冬生", kind: "fate" }
  ];

  function resolveRollCall(state, coda) {
    var flags = (state && state.flags) || {};
    var rows = ROLLCALL_PEOPLE.map(function (person) {
      var status = person.kind;
      if (person.kind === "fate") {
        status = flags["fate." + person.id + ".dead"] === true ? "absent" : "self";
      }
      return { id: person.id, name: person.name, status: status };
    });
    if (coda) rows.push({ id: "manzi", name: "满崽", status: "absent", answeredBy: "dongsheng" });
    return rows;
  }

  function rollcallEntries(state) {
    var dead = !!(state && state.flags && state.flags["fate.player.dead"] === true);
    return resolveRollCall(state || defaults(), dead);
  }

  // 没走到点名就进结局（调试/异常档）时的默认：不在场的人按“没应”算；有代答人的按代答算。
  function defaultEndingNames(state) {
    var answered = 0;
    var missed = 0;
    var names = rollcallEntries(state).map(function (entry) {
      var status = entry.answeredBy ? "player" : entry.status === "absent" ? "missed" : entry.status;
      if (status === "missed") missed += 1;
      if (status === "player") answered += 1;
      var row = { id: entry.id, name: entry.name, status: status };
      if (entry.answeredBy) row.answeredBy = entry.answeredBy;
      return row;
    });
    return { names: names, answered: answered, missed: missed };
  }

  // v1.4 路线只在结局算一次：先判死（7(5) 优先），再判无板 8(1)–(5)，最后判带板 7(1)–(4)。
  function routeOf(flags) {
    var f = flags || {};
    var rescues = Math.round(clamp(isFiniteNumber(f.rescues) ? f.rescues : 0, 0, 3));
    var outcome = f.doorOutcome || "none";
    var dead = f["fate.player.dead"] === true;
    if (dead) {
      // 5/11 是“人死、门板由别人带到吴起”；bridge/wuqi 表示门板早已留在桥上或墙上。
      return outcome === "others" ? "door_others" : "bad_end";
    }
    if (outcome === "none") {
      if (rescues === 0) return "no_door_zero";
      if (rescues === 1) return "no_door_one";
      if (rescues === 2) return "no_door_two";
      return f.condition === 4 ? "no_door_three_excellent" : "no_door_three";
    }
    var carried = outcome === "carried" || outcome === "wuqi" || outcome === "others";
    if (rescues <= 1) {
      return carried && f.condition === 4 ? "door_excellent" : "door_grass_one";
    }
    return carried ? "door_carry_two" : "door_grass_many";
  }

  // 五卡只算一次：finishChapter 调 buildEnding 落成快照，重进结局直接读快照。
  function buildEnding(state) {
    var storyEnding = (XB.story && XB.story.ending) || {};
    var flags = state.flags || {};
    var previous = normalizeEnding(state.ending) || {};
    var route = routeOf(flags);
    var baseDef = ROUTE_DEFS[route] || {};
    var storyDef = ((storyEnding.routes) || {})[route] || {};
    var routeTitle = storyDef.title || baseDef.title || "";
    var routeLede = storyDef.lede || baseDef.lede || "";
    // 7(2)/7(4) 的同一“没带出”，门板留在桥上时叫桥板，留草地时叫门板。
    if ((route === "door_grass_one" || route === "door_grass_many") && flags.doorOutcome === "bridge") {
      routeTitle = storyDef.bridgeTitle || baseDef.bridgeTitle || routeTitle;
      routeLede = storyDef.bridgeLede || baseDef.bridgeLede || routeLede;
    }
    var isBad = route === "bad_end";
    var fallback = defaultEndingNames(state);
    var names = isBad ? [] : (previous.names || fallback.names);
    // 7(5) 必是 8 名；旧快照若只有 7 名（异常档），以当前点名补齐。
    if (route === "door_others" && names.length !== 8) names = fallback.names;
    var answered = isBad ? 0 : (previous.answered !== undefined ? previous.answered : fallback.answered);
    var missed = isBad ? 0 : (previous.missed !== undefined ? previous.missed : fallback.missed);

    // 本局成就必须在 finishChapter 清空 choices 之前采集；旧快照没有 choices 时沿用已有列表。
    var runAchievements = collectRunAchievements(state);
    // 重进已结算的结局时 choices 已清空，但 flags 里的记名仍会产出 1 条；不能因此丢掉快照里的其余成就。
    if (!state.choices.length && previous.achievements) {
      previous.achievements.forEach(function (id) {
        if (runAchievements.indexOf(id) === -1) runAchievements.push(id);
      });
    }

    var conditions = {
      ideal: isFiniteNumber(flags.fire) && flags.fire >= 60,
      sacrifice: flags["fate.player.dead"] === true || flags["choice.xiangjiang.hold"] === true,
      truth: Number(flags["choice.zunyi.admit"] || 0) >= 2,
      overall: flags["choice.jinsha.priority"] === "main",
      people: Number(flags.trust || 0) >= 3 && flags["memory.zhang"] === true
    };

    var cards = ((storyEnding.cards) || []).map(function (card) {
      var lit = conditions[card.id] === true;
      var line = lit ? card.litLine : card.unlitLine;
      if (card.id === "sacrifice" && lit && flags["fate.player.dead"] === true) {
        line = storyEnding.kongyeSacrificeLine || storyEnding.sacrificeLine || line;
      }
      return { id: card.id, lit: lit, line: line };
    });

    return {
      stats: {
        companyStart: ENDING_STATS.companyStart,
        companyEnd: (route === "door_others" || isBad) ? 18 : ENDING_STATS.companyEnd,
        redStart: ENDING_STATS.redStart,
        redEnd: ENDING_STATS.redEnd
      },
      names: names,
      answered: answered,
      missed: missed,
      cards: cards,
      route: route,
      routeIndex: baseDef.index || 0,
      routeLabel: baseDef.label || "",
      routeTitle: routeTitle,
      routeLede: routeLede,
      fate: {
        feimao: flags["fate.feimao.dead"] === true ? "dead" : "alive",
        zaowang: flags["fate.zaowang.dead"] === true ? "dead" : "alive",
        dongsheng: flags["fate.dongsheng.dead"] === true ? "dead" : "alive",
        lin: flags["fate.lin.dead"] === true ? "dead" : "alive",
        player: flags["fate.player.dead"] === true ? "dead" : "alive"
      },
      condition: isFiniteNumber(flags.condition) ? flags.condition : 3,
      rescues: isFiniteNumber(flags.rescues) ? flags.rescues : 0,
      doorOutcome: flags.doorOutcome || "none",
      strain: isFiniteNumber(flags.strain) ? flags.strain : 0,
      recorded: previous.recorded === true,
      achievements: runAchievements
    };
  }

  function defaults() {
    return {
      version: SAVE_VERSION,
      scene: "title",
      chapterId: "prologue",
      nodeId: null,
      flags: cloneJson(FLAG_DEFAULTS),
      inventory: { door: false, items: [], giftBarley: false },
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
    if (save.version < 1) return { issue: "version-old", state: defaults() };

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
    flags["item.pot"] = flags["item.pot"] === true;
    ITEM_FLAGS.forEach(function (key) {
      flags[key] = flags[key] === true;
    });
    BOOLEAN_FLAGS.forEach(function (key) {
      flags[key] = flags[key] === true;
    });
    if (DOOR_OUTCOMES.indexOf(flags.doorOutcome) === -1) flags.doorOutcome = "none";
    Object.keys(ABANDON_TAKE_FLAGS).forEach(function (id) {
      flags[ABANDON_TAKE_FLAGS[id]] = flags[ABANDON_TAKE_FLAGS[id]] === true;
    });
    flags["choice.xiangjiang.abandoned"] = normalizeAbandoned(flags["choice.xiangjiang.abandoned"]);
    backfillLegacyFlags(save, flags);
    syncDerivedFlags({ flags: flags });
    state.flags = flags;

    var items = save.inventory && save.inventory.items;
    state.inventory.items = Array.isArray(items)
      ? items.filter(function (item, index, list) {
          return typeof item === "string" &&
            INVENTORY_IDS.indexOf(item) !== -1 &&
            list.indexOf(item) === index;
        }).slice(0, 32)
      : [];
    // 修 v1.4 早期残档：危机扣了物资却只写旗标，清单里还挂着药/青稞/锅/雨布/鞋。
    repairPackMirror(state, save.flags);

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
    if (state.ending && !state.ending.route) {
      // 旧结局快照只补一个“旧档”标签，不重算路线，也不改已显示的点名与五卡。
      state.ending.route = "legacy";
      state.ending.routeTitle = "旧档";
      state.ending.routeLede = "";
    }

    if (save.nodeId !== null && save.nodeId !== undefined && typeof save.nodeId !== "string") {
      return { issue: "node", state: defaults() };
    }
    state.nodeId = save.nodeId === undefined ? null : save.nodeId;

    // 旧档停在已删除的小游戏/结算节点：接回该章下一句，而不是判定坏档。
    var migrated = null;
    if (state.nodeId === "j010" || state.nodeId === "j011") {
      state.nodeId = "j012";
      migrated = "jinsha";
    } else if (state.nodeId === "l013" || state.nodeId === "l014") {
      state.nodeId = "l015";
      migrated = "luding";
    }

    var fateMigrated = migrateLegacyFate(state, save);
    if (fateMigrated && !migrated) migrated = fateMigrated;
    syncDerivedFlags(state);

    if (state.scene === "ending") {
      // 结局是只读快照：缺一块、带了节点、或不在吴起/空页章，都回地图并报告，不半截显示。
      if ((state.chapterId !== "wuqi" && state.chapterId !== "coda") || state.nodeId !== null || !isFullEnding(state.ending)) {
        var fallback = defaults();
        fallback.scene = "map";
        return { issue: "ending", state: fallback };
      }
      return { issue: null, state: state, migrated: migrated };
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
    return { issue: null, state: state, migrated: migrated };
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

  // 派生只在这里写：condition/rescues 夹取，quality 与 fate 互镜，strain 仅保留兼容。
  function syncDerivedFlags(state) {
    var flags = state.flags;
    // 门板只认 doorOutcome；had.door 记“带过板”，item.door 记“板还在身上”。
    flags["had.door"] = flags.doorOutcome !== "none";
    flags["item.door"] = flags.doorOutcome === "carried";
    flags.condition = Math.round(clamp(isFiniteNumber(flags.condition) ? flags.condition : 3, 0, 4));
    flags.rescues = Math.round(clamp(isFiniteNumber(flags.rescues) ? flags.rescues : 0, 0, 3));
    flags["help.used"] = flags["help.used"] === true;
    flags["fate.player.dead"] = flags["fate.player.dead"] === true || flags.condition === 0;
    ["feimao", "zaowang", "dongsheng"].forEach(function (id) {
      var key = "quality." + id;
      flags[key] = Math.round(clamp(isFiniteNumber(flags[key]) ? flags[key] : 0, 0, 3));
      if (flags["fate." + id + ".dead"] === true) flags[key] = 0;
    });
    flags["fate.lin.dead"] = flags["fate.player.dead"] === true;
    // 7(5) 只在门板还在草地上（身上，或已结算成 others）时成立；
    // 湘江桥头/泸定桥上的板子不在草地，死了也只能走坏结局。
    var seven5Door = flags.doorOutcome === "others" ||
      (flags["item.door"] === true && flags.doorOutcome !== "bridge" && flags.doorOutcome !== "wuqi");
    flags["fate.seven5"] = flags["fate.player.dead"] === true &&
      flags["had.door"] === true &&
      flags.rescues === 3 &&
      seven5Door;
    flags["fate.badend"] = flags["fate.player.dead"] === true && flags["fate.seven5"] !== true;
    flags["fate.all.dead"] = flags["fate.feimao.dead"] === true &&
      flags["fate.zaowang.dead"] === true &&
      flags["fate.dongsheng.dead"] === true;
    // v1.3 的 strain 是“救过几人”；v1.4 反过来只当作剩余体力，供旧句兼容。
    flags.strain = 3 - flags.rescues;
    flags["strain.hurt"] = flags.rescues >= 2;
    flags["strain.dying"] = flags["fate.player.dead"] === true;
    if (state.inventory) {
      state.inventory.door = flags["item.door"];
      state.inventory.giftBarley = flags["inventory.giftBarley"] === true;
    }
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

  // 选项可见性：requires 与节点 when 同一套语法；超时默认项必须在可见项里。
  function optionVisible(state, option) {
    if (!option) return false;
    return evalWhen(state, option.requires);
  }

  function visibleOptions(state, node) {
    return ((node && node.options) || []).filter(function (option) {
      return optionVisible(state, option);
    });
  }

  function defaultOptionKey(state, node) {
    var options = visibleOptions(state, node);
    if (!options.length) return null;
    for (var i = 0; i < options.length; i += 1) {
      if (options[i].key === node.defaultOption) return options[i].key;
    }
    // 数据写错时的兜底：宁可让玩家先看到第一项，也不让倒计时结算一个看不见的选项。
    return options[0].key;
  }

  // 行囊多选：门板占两格，带板时只装得下一件（maxWhen 由剧本声明）。
  function effectiveMultiMax(state, node) {
    var max = isFiniteNumber(node.max) ? node.max : ((node.options || []).length);
    ((node && node.maxWhen) || []).forEach(function (rule) {
      if (!rule || !isFiniteNumber(rule.max)) return;
      if (evalWhen(state, rule.when)) max = Math.min(max, rule.max);
    });
    return Math.max(0, max);
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

  // 状态变化弹窗只认“真的变了”：setFlag 前后各拍一张快照，normalize/读档不会误报。
  function statusSnapshot(flags) {
    return {
      // “差且已判死”也要能记录 1→0，否则拒绝补给的死亡会被漏掉。
      player: flags["fate.player.dead"] === true ? 0 : flags.condition,
      feimao: flags["quality.feimao"],
      zaowang: flags["quality.zaowang"],
      dongsheng: flags["quality.dongsheng"]
    };
  }

  function defaultStatusReason(kind, from, to) {
    if (kind === "player") return to < from ? "连续行军和救人" : "你补充了物资";
    if (to === 0) return "他没能再站起来";
    return to < from ? "他撑不住了" : "你把他扶起来";
  }

  function recordStatusDiff(before, after, reason, sourcePath) {
    Object.keys(before).forEach(function (kind) {
      if (before[kind] === after[kind]) return;
      var text = typeof reason === "string" ? reason.trim() : "";
      statusEvents.push({
        kind: kind,
        from: before[kind],
        to: after[kind],
        reason: text || defaultStatusReason(kind, before[kind], after[kind]),
        source: sourcePath || ""
      });
    });
    if (statusEvents.length > STATUS_EVENT_LIMIT) {
      statusEvents = statusEvents.slice(-STATUS_EVENT_LIMIT);
    }
  }

  function takeStatusEvents() {
    var events = statusEvents.slice();
    statusEvents = [];
    return events;
  }

  // set 的三种写法：赋布尔、赋数值、"+N"/"-N" 增量；数值旗标一律夹在范围内。
  // reason 只给状态弹窗用；不写进旗标，也不参与存档。
  function setFlag(state, path, value, reason) {
    var beforeStatus = statusSnapshot(state.flags);
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

    if (BOOLEAN_FLAGS.indexOf(path) !== -1 || path === "item.pot" || ITEM_FLAGS.indexOf(path) !== -1) {
      next = next === true;
    } else if (path === "doorOutcome") {
      if (DOOR_OUTCOMES.indexOf(next) === -1) {
        console.error("[XB] 门板去向不认识：" + next);
        return false;
      }
    } else if (FLAG_LIMITS[path]) {
      if (!isFiniteNumber(next)) {
        console.error("[XB] 数值旗标收到非数值：" + path);
        return false;
      }
      var range = FLAG_LIMITS[path];
      next = Math.round(clamp(next, range[0], range[1]));
    }

    // 救人数增加时按“第几人”补扣状态；剧本只写 rescues，不重复写 condition。
    if (path === "rescues") {
      var oldRescues = Math.round(clamp(isFiniteNumber(state.flags.rescues) ? state.flags.rescues : 0, 0, 3));
      var newRescues = Math.round(clamp(next, 0, 3));
      if (newRescues > oldRescues) {
        var hasDoor = state.flags["had.door"] === true;
        var penalty = rescuePenalty(newRescues, hasDoor) - rescuePenalty(oldRescues, hasDoor);
        state.flags.condition = Math.round(clamp((isFiniteNumber(state.flags.condition) ? state.flags.condition : 3) - penalty, 0, 4));
        // 救满第三人时如果已跌到“差”，三人当场把人架起来：先回一格，草地结算再掉下去时才是警告。
        // 有门板走这条；无门板结算时才跌到差，由 settleGrass 补同一段帮助（memory.help）。
        if (newRescues === 3 && state.flags.condition === 1 && state.flags["help.used"] !== true) {
          state.flags.condition = 2;
          state.flags["help.used"] = true;
          state.flags["memory.help"] = true;
          state.flags["memory.help_door"] = true;
        }
      }
      next = newRescues;
    }

    state.flags[path] = next;
    if (path === "inventory.giftBarley") state.inventory.giftBarley = next === true;
    mirrorPackItem(state, path, next);
    syncDerivedFlags(state);
    recordStatusDiff(beforeStatus, statusSnapshot(state.flags), reason, path);
    return true;
  }

  function applySet(state, set, sourceId, reason) {
    if (!set) return;
    Object.keys(set).forEach(function (key) {
      if (!setFlag(state, key, set[key], reason)) {
        console.error("[XB] " + sourceId + " 写入旗标失败：" + key);
      }
    });
    syncDerivedFlags(state);
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
    if (!optionVisible(state, option)) {
      console.error("[XB] " + (node && node.id) + " 选项不可见：" + optionKey);
      return null;
    }
    var statusReason = option.statusReason || option.text;
    applySet(state, option.set, node.id, statusReason);
    // 条件代价：先按选择前的状态判条件，再统一写入；避免前一条改了旗标、后一条被误触发。
    if (Array.isArray(option.setIf)) {
      option.setIf.filter(function (rule) {
        return rule && evalWhen(state, rule.when);
      }).forEach(function (rule) {
        applySet(state, rule.set, node.id, statusReason);
      });
    }
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

  // 多选结算：先全部还原 setOff，再给选中项 setOn；不写单选 record，不碰倒计时。
  // selectedIds 来自界面；未知 id、越界数量一律拒绝并留控制台记录，由界面保持原状。
  function applyMultiChoice(state, node, selectedIds) {
    var options = (node && node.options) || [];
    var asked = Array.isArray(selectedIds) ? selectedIds : [];
    var chosen = [];
    var unknown = [];
    asked.forEach(function (id) {
      var matched = null;
      for (var i = 0; i < options.length; i += 1) {
        if (options[i].id === id) matched = options[i];
      }
      if (!matched) unknown.push(id);
      else if (chosen.indexOf(matched) === -1) chosen.push(matched);
    });
    if (unknown.length) {
      console.error("[XB] " + (node && node.id) + " 没有多选项 " + unknown.join(","));
      return null;
    }
    var min = isFiniteNumber(node.min) ? node.min : 0;
    var max = effectiveMultiMax(state, node);
    if (chosen.length < min || chosen.length > max) {
      console.error("[XB] " + node.id + " 选择数量越界：" + chosen.length);
      return null;
    }
    var chosenExtraUnits = 0;
    var chosenInventoryIds = [];
    chosen.forEach(function (option) {
      if (option.inventoryId) chosenInventoryIds.push(option.inventoryId);
      else chosenExtraUnits += optionUnits(option);
    });
    if (packUnitsForIds(state, state.inventory.items.concat(chosenInventoryIds)) + chosenExtraUnits > PACK_UNITS) {
      console.error("[XB] " + node.id + " 行囊超重");
      return null;
    }

    options.forEach(function (option) {
      applySet(state, option.setOff, node.id);
    });
    chosen.forEach(function (option) {
      applySet(state, option.setOn, node.id);
    });

    var left = options.filter(function (option) {
      return chosen.indexOf(option) === -1;
    }).map(function (option) {
      return option.id;
    });

    if (node.record) {
      if (node.recordMode !== "left") {
        console.error("[XB] " + node.id + " 只支持 recordMode left");
        return null;
      }
      if (!setFlag(state, node.record, left)) return null;
    }

    if (Array.isArray(node.inventoryBase)) {
      var packed = node.inventoryBase.slice();
      chosen.forEach(function (option) {
        if (option.inventoryId) packed.push(option.inventoryId);
      });
      state.inventory.items = packed;
    }
    setFlag(state, "load", packUsage(state));

    state.choices.push({
      chapter: state.chapterId,
      nodeId: node.id,
      option: "MULTI",
      text: chosen.map(function (option) {
        return option.text;
      }).join("、"),
      timedOut: false
    });
    if (state.choices.length > CHOICE_LOG_LIMIT) state.choices.shift();

    return { selected: chosen.map(function (option) { return option.id; }), left: left };
  }

  function serialize(state) {
    var save = {};
    PERSIST_KEYS.forEach(function (key) {
      save[key] = cloneJson(state[key]);
    });
    save.inventory = {
      door: !!state.inventory.door,
      items: cloneJson(state.inventory.items),
      giftBarley: state.inventory.giftBarley === true
    };
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
    achievementIds: achievementIds,
    collectRunAchievements: collectRunAchievements,
    chapterById: chapterById,
    codexById: codexById,
    locate: locate,
    currentChapter: currentChapter,
    currentNode: currentNode,
    evalWhen: evalWhen,
    isVisible: isVisible,
    firstVisible: firstVisible,
    nextVisible: nextVisible,
    optionVisible: optionVisible,
    visibleOptions: visibleOptions,
    defaultOptionKey: defaultOptionKey,
    effectiveMultiMax: effectiveMultiMax,
    optionUnits: optionUnits,
    packUsage: packUsage,
    packCapacity: packCapacity,
    canAddMultiOption: canAddMultiOption,
    usePackItems: usePackItems,
    conditionLabel: conditionLabel,
    playerStatusLabel: playerStatusLabel,
    companionStatusLabel: companionStatusLabel,
    takeStatusEvents: takeStatusEvents,
    doorCanCarry: doorCanCarry,
    doorCarried: doorCarried,
    settleGrass: settleGrass,
    resolveGrassWarning: resolveGrassWarning,
    settleDoor: settleDoor,
    syncDerivedFlags: syncDerivedFlags,
    resolveRollCall: resolveRollCall,
    routeOf: routeOf,
    startChapter: startChapter,
    advance: advance,
    setFlag: setFlag,
    applySet: applySet,
    applyChoice: applyChoice,
    applyMultiChoice: applyMultiChoice,
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

  // v1.6 起存档改成列表（xiangbei.saves.v1），一档一个槽位；v2/v1 只在首次启动迁移时读。
  var SAVES_KEY = "xiangbei.saves.v1";
  var SAVE_KEY = "xiangbei.save.v2";
  var LEGACY_SAVE_KEY = "xiangbei.save.v1";
  var SAVE_SLOT_MAX = 20;
  var MAX_SAVE_BYTES = 4096;
  var MAX_SAVES_BYTES = 512 * 1024;
  // 剧情回顾与主档分开存：只记节点引用，不复制台词；按存档槽隔离。
  var HISTORY_KEY = "xiangbei.history.v1";
  var HISTORY_MAX_ENTRIES = 800;
  var HISTORY_MAX_RUNS = 24;
  // 从章节重玩需要“本章开始前”的完整状态；物资使用不进 choices，不能靠重放推演。
  // 单独一个键，避免每次 saveNow 都把七章快照塞进 512KB 的主存档列表。
  var CHAPTERS_KEY = "xiangbei.chapters.v1";
  var MAX_CHAPTERS_BYTES = 2 * 1024 * 1024;
  var PAGE_HEIGHT = 66;
  var INPUT_LOCK_MS = 100;
  var CHOICE_SETTLE_MS = 240;
  var TIMEOUT_SETTLE_MS = 300;
  var AUTO_DELAY_MS = 1200;
  var SKIP_DELAY_MS = 120;

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
  // 章末自动存档提示：独立于普通 toast，固定停留 3.5 秒。
  var AUTOSAVE_NOTICE_MS = 3500;
  // 状态弹窗比普通 toast 多留一会儿；用户要求单条至少 6 秒，多行再按行数延长。
  var STATUS_NOTICE_MS = 6000;
  var STATUS_NOTICE_LINE_MS = 700;
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
    "ending-route",
    "ending-names",
    "ending-stats",
    "ending-cards",
    "ending-achievements",
    "ending-achievements-title",
    "ending-achievements-count",
    "ending-achievement-chips",
    "ending-disclaimer",
    "ending-home",
    "ending-codex",
    "ending-branch",
    "saves-panel",
    "saves-kicker",
    "saves-title",
    "saves-count",
    "saves-list",
    "saves-empty",
    "saves-close",
    "saves-back",
    "save-new",
    "save-latest",
    "save-delete",
    "saves-delete-bar",
    "saves-delete-count",
    "saves-delete-confirm",
    "saves-delete-cancel",
    "saves-hint",
    "save-confirm",
    "save-confirm-title",
    "save-confirm-body",
    "save-confirm-yes",
    "save-confirm-no",
    "history-panel",
    "history-title",
    "history-body",
    "history-list",
    "history-empty",
    "history-close",
    "pause",
    "pause-menu",
    "toast",
    "autosave-notice",
    "debug",
    "orientation",
    "title-menu",
    "map-stations",
    "map-route",
    "vn-chapter",
    "vn-condition",
    "vn-pack-button",
    "vn-pack-count",
    "vn-history-button",
    "vn-toolbar",
    "vn-auto",
    "vn-skip",
    "vn-dialogue",
    "vn-name",
    "vn-text",
    "vn-next",
    "vn-choice-prompt",
    "vn-choices",
    "vn-multichoice",
    "vn-multi-prompt",
    "vn-multi-options",
    "vn-multi-status",
    "vn-multi-confirm",
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
    "status-notice",
    "status-notice-list",
    "vn-measure",
    "vn-settings",
    "settings-danger",
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
    "gallery-grid",
    "roster-gallery",
    "roster-gallery-close",
    "roster-gallery-count",
    "roster-gallery-pages",
    "branch-map",
    "branch-title",
    "branch-count",
    "branch-chapters",
    "branch-live",
    "branch-endings-door",
    "branch-endings-nodoor",
    "branch-endings-bad",
    "branch-close",
    "branch-detail",
    "branch-detail-close",
    "branch-detail-kicker",
    "branch-detail-title",
    "branch-detail-sub",
    "branch-detail-body",
    "branch-detail-actions",
    "achievement-panel",
    "achievement-title",
    "achievement-count",
    "achievement-tabs",
    "achievement-grid",
    "achievement-close",
    "achievement-detail",
    "achievement-detail-close",
    "achievement-detail-kicker",
    "achievement-detail-title",
    "achievement-detail-body",
    "pack-panel",
    "pack-warning",
    "pack-title",
    "pack-summary",
    "pack-list",
    "pack-note",
    "pack-close",
    "pack-continue",
    "door-modal",
    "door-title",
    "door-discard",
    "danger-modal",
    "danger-accept",
    "danger-refuse",
    "bag-confirm-modal",
    "bag-confirm-title",
    "bag-confirm-body",
    "bag-confirm-yes",
    "bag-confirm-no"
  ];

  var state = null;
  var els = {};
  // 存档列表是唯一持久层：settings 全局一份，slots 里只放原 v2 的 11 键快照。
  var savesStore = { version: 1, activeId: null, settings: null, slots: [] };
  var savesStorageOk = true;
  var savesStorageWarned = false;
  var savePanelState = {
    open: false,
    mode: "list",
    selected: {},
    previousFocus: null,
    chapterId: null,
    targetId: null
  };
  var confirmState = { open: false, kind: "", slotId: null, previousFocus: null };
  // 设置面板挂在 #pause 里；标题态借同一遮罩显示，关闭时按来源还原。
  var settingsState = { open: false, from: "", previousFocus: null };
  var endingReview = { active: false, backup: null };
  var debugEnabled = false;
  var debugExtra = "";
  var toastTimer = 0;
  var autosaveNoticeTimer = 0;
  var statusNoticeTimer = 0;
  var statusNoticeOpen = false;
  var statusQueue = [];
  var stationsBuilt = false;
  var lastFocused = null;
  var artWarned = false;
  var packState = { open: false, mode: "browse", onClose: null, previousFocus: null };
  var doorState = { open: false, previousFocus: null };
  var dangerState = { open: false, previousFocus: null };
  // 行囊未满的二次确认：只盖在多选面板上，不写档，也不进回顾
  var bagConfirmState = { open: false, previousFocus: null };
  // 回顾层只读、按槽隔离；内存副本保证隐私模式下本局仍能翻看。
  var historyStore = { version: 1, runs: {} };
  var historyState = { open: false, previousFocus: null };
  var historyStorageOk = true;
  var historyStorageWarned = false;
  var historySaveTimer = 0;
  // 章节起点快照：按存档槽隔离，只服务“从某一章重新开始”，不参与主档 11 键。
  var chapterStore = { version: 1, updatedAt: 0, slots: {} };
  var chapterStorageOk = true;
  var chapterStorageWarned = false;
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

  // 多选：没有倒计时，确认前可以反复改；selected 只存选项 id。
  var multiRun = { node: null, selected: [], locked: false };

  var titleCardState = { open: false, timer: 0, onClose: null };
  var codexState = { open: false, id: null, unlock: false, onClose: null, previousFocus: null };
  var galleryState = { open: false, previousFocus: null };
  var rosterGalleryState = { open: false, previousFocus: null };
  // 剧情分支只读收纳：与主档/名册分开；内存副本保证隐私模式也能看完当前一局。
  var BRANCH_KEY = "xiangbei.branches.v1";
  var BRANCH_MAX_RUNS = 20;
  var branchState = {
    open: false,
    source: "title",
    store: null,
    run: null,
    currentRoute: null,
    detailKind: null,
    detailId: null,
    detailPreviousFocus: null,
    previousFocus: null
  };
  var branchMemory = null;
  var branchStorageOk = true;
  var branchStorageWarned = false;
  var branchLastRun = null;
  var branchRecordedEnding = null;

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

    var loaded = loadSavesAtBoot();
    savesStore = loaded.store;
    historyStore = historyLoadAtBoot();
    chapterStore = chapterLoadAtBoot();
    chapterPrune();
    state = defaults();
    state.settings = cloneJson(savesStore.settings);

    // 测试后门：?resume=1 直接进最近一个未完结档；正式入口只有标题「存档」。
    if (params.get("resume") === "1") {
      var resumeSlot = latestUnfinishedSlot();
      if (resumeSlot) {
        var resumed = normalize(resumeSlot.state);
        if (!resumed.issue) {
          state = resumed.state;
          state.settings = cloneJson(savesStore.settings);
          savesStore.activeId = resumeSlot.id;
          state.scene = resumeSceneFor(state);
        }
      }
    }

    // 调试跳章：?chapter=xiangjiang&node=x001；只定位，不补记忆、不跳章末。
    // 与 ?resume=1 同用时保留 activeId，让章末自动保存落在同一档上。
    var debugChapter = params.get("chapter");
    if (debugChapter && chapterById(debugChapter)) {
      startChapter(state, debugChapter, params.get("node"));
    }

    applySettings();
    render();
    if (loaded.migrated) toast("旧存档已收进存档列表");
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

  function readStorage(key) {
    try {
      return { ok: true, raw: window.localStorage.getItem(key) };
    } catch (err) {
      console.error("[XB] 读取存档失败：" + err.message);
      return { ok: false, raw: null };
    }
  }

  function normalizeStoreSettings(raw) {
    var settings = cloneJson(DEFAULT_SETTINGS);
    if (isPlainObject(raw)) {
      Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
        if (typeof raw[key] === typeof DEFAULT_SETTINGS[key]) settings[key] = raw[key];
      });
    }
    settings.textSpeed = Math.round(clamp(settings.textSpeed, 10, 60));
    settings.textScale = TEXT_SCALES.indexOf(settings.textScale) === -1 ? 1 : settings.textScale;
    settings.volume = clamp(settings.volume, 0, 1);
    settings.musicVolume = clamp(settings.musicVolume, 0, 1);
    settings.ambienceVolume = clamp(settings.ambienceVolume, 0, 1);
    return settings;
  }

  function emptySavesStore() {
    return { version: 1, activeId: null, settings: cloneJson(DEFAULT_SETTINGS), slots: [] };
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function createSlotRecord(payload) {
    var at = nowIso();
    var random = Math.random().toString(36).slice(2, 7);
    return {
      id: "slot-" + Date.now().toString(36) + "-" + random,
      createdAt: at,
      updatedAt: at,
      state: payload
    };
  }

  // 单档仍走同一套 normalize；坏档整槽丢掉，不让一档坏档拖垮整个列表。
  function normalizeSlot(raw) {
    if (!isPlainObject(raw)) return null;
    if (typeof raw.id !== "string" || raw.id.indexOf("slot-") !== 0) return null;
    if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string") return null;
    var result = normalize(raw.state);
    if (result.issue) return null;
    return { id: raw.id, createdAt: raw.createdAt, updatedAt: raw.updatedAt, state: result.state };
  }

  function normalizeSavesStore(raw) {
    if (!isPlainObject(raw) || raw.version !== 1 || !Array.isArray(raw.slots)) return null;
    var store = emptySavesStore();
    store.settings = normalizeStoreSettings(raw.settings);
    var seen = {};
    raw.slots.slice(0, SAVE_SLOT_MAX * 2).forEach(function (entry) {
      var slot = normalizeSlot(entry);
      if (!slot || seen[slot.id]) return;
      seen[slot.id] = true;
      store.slots.push(slot);
    });
    store.slots.sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
    store.slots = store.slots.slice(0, SAVE_SLOT_MAX);
    if (typeof raw.activeId === "string" && seen[raw.activeId]) store.activeId = raw.activeId;
    return store;
  }

  function writeSavesStore(store) {
    var json = "";
    try {
      json = JSON.stringify(store);
    } catch (err) {
      console.error("[XB] 存档列表无法序列化：" + err.message);
      toast("存档异常：本局无法继续保存");
      return false;
    }
    var bytes = utf8Bytes(json);
    if (bytes > MAX_SAVES_BYTES) {
      console.error("[XB] 存档列表 " + bytes + " 字节，超过上限 " + MAX_SAVES_BYTES);
      toast("存档空间已满，请先删除旧存档");
      return false;
    }
    try {
      window.localStorage.setItem(SAVES_KEY, json);
      savesStorageOk = true;
      savesStorageWarned = false;
      return true;
    } catch (err) {
      console.error("[XB] 写入存档列表失败：" + err.message);
      if (!savesStorageWarned) {
        savesStorageWarned = true;
        toast("本局无法存档（浏览器限制），进度只在本次有效");
      }
      savesStorageOk = false;
      return false;
    }
  }

  // 首次启动：列表不存在时才去读 v2/v1，迁移成第 1 档；旧键在写入成功后删除。
  function loadSavesAtBoot() {
    var read = readStorage(SAVES_KEY);
    if (!read.ok) {
      savesStorageOk = false;
      return { store: emptySavesStore(), migrated: false };
    }
    if (read.raw) {
      var parsed = null;
      try {
        parsed = JSON.parse(read.raw);
      } catch (err) {
        console.error("[XB] 存档列表不是合法 JSON：" + err.message);
        backupSave("bad", SAVES_KEY);
        toast("存档列表损坏，已备份");
        return { store: emptySavesStore(), migrated: false };
      }
      var store = normalizeSavesStore(parsed);
      if (!store) {
        backupSave("bad", SAVES_KEY);
        console.error("[XB] 存档列表校验失败");
        toast("存档列表与当前版本不匹配，已备份");
        return { store: emptySavesStore(), migrated: false };
      }
      if (store.slots.length < parsed.slots.length) {
        console.error("[XB] 有 " + (parsed.slots.length - store.slots.length) + " 个存档无法读取，已跳过");
      }
      return { store: store, migrated: false };
    }
    var migratedStore = migrateLegacySave();
    return { store: migratedStore || emptySavesStore(), migrated: !!migratedStore };
  }

  function migrateLegacySave() {
    var keys = [SAVE_KEY, LEGACY_SAVE_KEY];
    for (var i = 0; i < keys.length; i += 1) {
      var read = readStorage(keys[i]);
      if (!read.ok) return null;
      if (!read.raw) continue;
      var parsed = null;
      try {
        parsed = JSON.parse(read.raw);
      } catch (err) {
        console.error("[XB] 旧存档不是合法 JSON：" + err.message);
        backupSave("bad", keys[i]);
        continue;
      }
      var result = normalize(parsed);
      if (result.issue) {
        console.error("[XB] 旧存档校验失败：" + result.issue);
        backupSave("bad", keys[i]);
        continue;
      }
      var store = emptySavesStore();
      var slot = createSlotRecord(serialize(result.state));
      store.slots.push(slot);
      store.activeId = slot.id;
      store.settings = normalizeStoreSettings(result.state.settings);
      if (!writeSavesStore(store)) return null;
      try {
        window.localStorage.removeItem(SAVE_KEY);
        window.localStorage.removeItem(LEGACY_SAVE_KEY);
      } catch (err) {
        console.error("[XB] 删除旧存档键失败：" + err.message);
      }
      return store;
    }
    return null;
  }

  function activeSlot() {
    if (!savesStore.activeId) return null;
    for (var i = 0; i < savesStore.slots.length; i += 1) {
      if (savesStore.slots[i].id === savesStore.activeId) return savesStore.slots[i];
    }
    return null;
  }

  function slotById(id) {
    for (var i = 0; i < savesStore.slots.length; i += 1) {
      if (savesStore.slots[i].id === id) return savesStore.slots[i];
    }
    return null;
  }

  function slotEnded(slot) {
    return !!slot && isFullEnding(slot.state && slot.state.ending);
  }

  function latestUnfinishedSlot() {
    var best = null;
    savesStore.slots.forEach(function (slot) {
      if (slotEnded(slot)) return;
      if (!best || String(slot.updatedAt) > String(best.updatedAt)) best = slot;
    });
    return best;
  }

  function backupSave(suffix, key) {
    var target = key || SAVE_KEY;
    try {
      var raw = window.localStorage.getItem(target);
      if (raw === null) return;
      window.localStorage.setItem(target + "." + suffix, raw);
      window.localStorage.removeItem(target);
    } catch (err) {
      console.error("[XB] 备份存档失败：" + err.message);
    }
  }

  /* ---------------- 章节起点：从某一章重玩的状态底片 ---------------- */

  function emptyChapterStore() {
    return { version: 1, updatedAt: 0, slots: {} };
  }

  function normalizeChapterSnapshot(raw) {
    if (!isPlainObject(raw) || typeof raw.at !== "string") return null;
    var result = normalize(raw.state);
    if (result.issue) return null;
    var snapshot = result.state;
    if (snapshot.scene !== "vn" || !snapshot.chapterId || !snapshot.nodeId) return null;
    if (branchChapterIds().indexOf(snapshot.chapterId) === -1) return null;
    return { at: raw.at, state: serialize(snapshot) };
  }

  function normalizeChapterSlot(raw) {
    if (!isPlainObject(raw) || !isPlainObject(raw.chapters)) return null;
    var chapters = {};
    Object.keys(raw.chapters).forEach(function (chapterId) {
      if (branchChapterIds().indexOf(chapterId) === -1) return;
      var snapshot = normalizeChapterSnapshot(raw.chapters[chapterId]);
      if (!snapshot || snapshot.state.chapterId !== chapterId) return;
      chapters[chapterId] = snapshot;
    });
    if (!Object.keys(chapters).length) return null;
    return {
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso(),
      chapters: chapters
    };
  }

  function normalizeChapterStore(raw) {
    if (!isPlainObject(raw) || raw.version !== 1 || !isPlainObject(raw.slots)) return null;
    var store = emptyChapterStore();
    store.updatedAt = isFiniteNumber(raw.updatedAt) ? Math.round(raw.updatedAt) : 0;
    Object.keys(raw.slots).forEach(function (slotId) {
      if (slotId.indexOf("slot-") !== 0) return;
      var slot = normalizeChapterSlot(raw.slots[slotId]);
      if (slot) store.slots[slotId] = slot;
    });
    return store;
  }

  function writeChapterStore(store) {
    var json = "";
    try {
      json = JSON.stringify(store);
    } catch (err) {
      console.error("[XB] 章节记录无法序列化：" + err.message);
      return false;
    }
    if (utf8Bytes(json) > MAX_CHAPTERS_BYTES) {
      console.error("[XB] 章节记录超过上限 " + MAX_CHAPTERS_BYTES);
      if (!chapterStorageWarned) {
        chapterStorageWarned = true;
        toast("章节记录空间不足，从章节重玩暂不可用");
      }
      return false;
    }
    try {
      window.localStorage.setItem(CHAPTERS_KEY, json);
      chapterStorageOk = true;
      chapterStorageWarned = false;
      return true;
    } catch (err) {
      console.error("[XB] 写入章节记录失败：" + err.message);
      chapterStorageOk = false;
      if (!chapterStorageWarned) {
        chapterStorageWarned = true;
        toast("本机无法保存章节记录，从章节重玩暂不可用");
      }
      return false;
    }
  }

  function chapterLoadAtBoot() {
    var read = readStorage(CHAPTERS_KEY);
    if (!read.ok) {
      chapterStorageOk = false;
      return emptyChapterStore();
    }
    if (!read.raw) return emptyChapterStore();
    var parsed = null;
    try {
      parsed = JSON.parse(read.raw);
    } catch (err) {
      console.error("[XB] 章节记录不是合法 JSON：" + err.message);
      backupSave("bad", CHAPTERS_KEY);
      toast("章节记录损坏，已备份");
      return emptyChapterStore();
    }
    var store = normalizeChapterStore(parsed);
    if (!store) {
      console.error("[XB] 章节记录校验失败");
      backupSave("bad", CHAPTERS_KEY);
      toast("章节记录与当前版本不匹配，已备份");
      return emptyChapterStore();
    }
    return store;
  }

  function chapterSnapshotState(slotId, chapterId) {
    var slot = chapterStore.slots[slotId];
    if (!slot || !slot.chapters[chapterId]) return null;
    return cloneJson(slot.chapters[chapterId].state);
  }

  // 只在真正的章节起点调用：新档序章、章末进入下一章、章节重玩成功。
  function chapterCapture(slotId, chapterId) {
    if (!slotId || !state || branchChapterIds().indexOf(chapterId) === -1) return false;
    if (!chapterById(chapterId)) return false;
    var payload = serialize(state);
    payload.scene = "vn";
    payload.chapterId = chapterId;
    payload.ending = null;
    var at = nowIso();
    var slot = chapterStore.slots[slotId] || { updatedAt: at, chapters: {} };
    slot.chapters[chapterId] = { at: at, state: payload };
    slot.updatedAt = at;
    chapterStore.slots[slotId] = slot;
    chapterStore.updatedAt = Date.now();
    return writeChapterStore(chapterStore);
  }

  // 把来源档的前情快照整段搬到目标档；目标档本章及以后一律作废。
  function chapterCopyPrefix(sourceId, targetId, chapterId) {
    var order = branchChapterIds();
    var targetIndex = order.indexOf(chapterId);
    if (targetIndex === -1) return false;
    var source = chapterStore.slots[sourceId];
    var chapters = {};
    if (source) {
      order.forEach(function (id, index) {
        if (index <= targetIndex && source.chapters[id]) {
          chapters[id] = cloneJson(source.chapters[id]);
        }
      });
    }
    chapterStore.slots[targetId] = { updatedAt: nowIso(), chapters: chapters };
    chapterStore.updatedAt = Date.now();
    return writeChapterStore(chapterStore);
  }

  function chapterRemoveSlots(ids) {
    var changed = false;
    ids.forEach(function (id) {
      if (chapterStore.slots[id]) {
        delete chapterStore.slots[id];
        changed = true;
      }
    });
    if (changed) {
      chapterStore.updatedAt = Date.now();
      writeChapterStore(chapterStore);
    }
  }

  // 主存档被删/被初始化后，章节底片跟着走，避免留下无法再到达的旧路线。
  function chapterPrune() {
    var live = {};
    savesStore.slots.forEach(function (slot) { live[slot.id] = true; });
    var changed = false;
    Object.keys(chapterStore.slots).forEach(function (id) {
      if (!live[id]) {
        delete chapterStore.slots[id];
        changed = true;
      }
    });
    if (!changed) return;
    chapterStore.updatedAt = Date.now();
    writeChapterStore(chapterStore);
  }

  /* ---------------- 剧情回顾：独立只读记录 ---------------- */

  function emptyHistoryStore() {
    return { version: 1, runs: {} };
  }

  function normalizeHistoryEntry(raw) {
    if (!isPlainObject(raw)) return null;
    if (typeof raw.c !== "string" || typeof raw.n !== "string") return null;
    if (raw.t === "line") return { t: "line", c: raw.c, n: raw.n };
    if (raw.t === "prompt") {
      if (["choice", "multi", "namepick"].indexOf(raw.k) === -1) return null;
      return { t: "prompt", c: raw.c, n: raw.n, k: raw.k };
    }
    if (raw.t === "choice") {
      if (typeof raw.key !== "string") return null;
      return { t: "choice", c: raw.c, n: raw.n, k: "choice", key: raw.key, timedOut: raw.timedOut === true };
    }
    if (raw.t === "multi") {
      if (!Array.isArray(raw.ids)) return null;
      var ids = raw.ids.filter(function (id) { return typeof id === "string"; }).slice(0, 16);
      return { t: "multi", c: raw.c, n: raw.n, ids: ids };
    }
    if (raw.t === "namepick") {
      return {
        t: "namepick",
        c: raw.c,
        n: raw.n,
        nameId: typeof raw.nameId === "string" ? raw.nameId : "",
        timedOut: raw.timedOut === true
      };
    }
    return null;
  }

  function normalizeHistoryRun(raw) {
    if (!isPlainObject(raw) || !Array.isArray(raw.entries)) return null;
    var total = raw.entries.length;
    var kept = raw.entries.slice(-HISTORY_MAX_ENTRIES);
    var dropped = total - kept.length;
    var entries = kept.map(normalizeHistoryEntry).filter(Boolean);
    var claimed = isFiniteNumber(raw.checkpoint) ? Math.floor(raw.checkpoint) - dropped : entries.length;
    return {
      entries: entries,
      checkpoint: clamp(claimed, 0, entries.length),
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso()
    };
  }

  function normalizeHistoryStore(raw) {
    if (!isPlainObject(raw) || raw.version !== 1 || !isPlainObject(raw.runs)) return null;
    var store = emptyHistoryStore();
    Object.keys(raw.runs).forEach(function (key) {
      if (key.length > 96) return;
      var run = normalizeHistoryRun(raw.runs[key]);
      if (run) store.runs[key] = run;
    });
    var all = Object.keys(store.runs);
    all.sort(function (a, b) {
      return String(store.runs[b].updatedAt).localeCompare(String(store.runs[a].updatedAt));
    });
    all.slice(HISTORY_MAX_RUNS).forEach(function (key) {
      delete store.runs[key];
    });
    return store;
  }

  function historyLoadAtBoot() {
    var read = readStorage(HISTORY_KEY);
    if (!read.ok) {
      historyStorageOk = false;
      return emptyHistoryStore();
    }
    if (!read.raw) return emptyHistoryStore();
    var parsed = null;
    try {
      parsed = JSON.parse(read.raw);
    } catch (err) {
      console.error("[XB] 回顾记录不是合法 JSON：" + err.message);
      backupSave("bad", HISTORY_KEY);
      toast("回顾记录损坏，已备份");
      return emptyHistoryStore();
    }
    var store = normalizeHistoryStore(parsed);
    if (!store) {
      console.error("[XB] 回顾记录校验失败");
      backupSave("bad", HISTORY_KEY);
      toast("回顾记录与当前版本不匹配，已备份");
      return emptyHistoryStore();
    }
    return store;
  }

  function historyRunKey() {
    return savesStore.activeId || "session";
  }

  function historyRun() {
    return historyStore.runs[historyRunKey()] || null;
  }

  function historyEnsureRun() {
    var key = historyRunKey();
    if (!historyStore.runs[key]) {
      historyStore.runs[key] = { entries: [], checkpoint: 0, updatedAt: nowIso() };
    }
    return historyStore.runs[key];
  }

  function historyTrimRuns() {
    var keep = historyRunKey();
    var keys = Object.keys(historyStore.runs);
    if (keys.length <= HISTORY_MAX_RUNS) return;
    var others = keys.filter(function (key) { return key !== keep; });
    others.sort(function (a, b) {
      return String(historyStore.runs[b].updatedAt).localeCompare(String(historyStore.runs[a].updatedAt));
    });
    var allowed = historyStore.runs[keep] ? HISTORY_MAX_RUNS - 1 : HISTORY_MAX_RUNS;
    others.slice(allowed).forEach(function (key) {
      delete historyStore.runs[key];
    });
  }

  function historyWrite() {
    var json = "";
    try {
      json = JSON.stringify(historyStore);
    } catch (err) {
      console.error("[XB] 回顾记录无法序列化：" + err.message);
      return false;
    }
    try {
      window.localStorage.setItem(HISTORY_KEY, json);
      historyStorageOk = true;
      historyStorageWarned = false;
      return true;
    } catch (err) {
      console.error("[XB] 写入回顾记录失败：" + err.message);
      if (!historyStorageWarned) {
        historyStorageWarned = true;
        toast("本局无法保存回顾记录（浏览器限制）");
      }
      historyStorageOk = false;
      return false;
    }
  }

  function historyFlush() {
    if (historySaveTimer) {
      clearTimeout(historySaveTimer);
      historySaveTimer = 0;
    }
    if (!historyStore.runs[historyRunKey()]) return true;
    historyTrimRuns();
    return historyWrite();
  }

  function historyScheduleWrite() {
    clearTimeout(historySaveTimer);
    historySaveTimer = window.setTimeout(function () {
      historySaveTimer = 0;
      historyWrite();
    }, 400);
  }

  function historyPush(entry) {
    var normalized = normalizeHistoryEntry(entry);
    if (!normalized) return;
    var run = historyEnsureRun();
    var last = run.entries[run.entries.length - 1];
    // 刷新会重渲染同一节点：连续同类型同节点只留一条。
    if (last && last.t === normalized.t && last.c === normalized.c && last.n === normalized.n) {
      run.updatedAt = nowIso();
      historyScheduleWrite();
      return;
    }
    if (run.entries.length >= HISTORY_MAX_ENTRIES) {
      run.entries.shift();
      if (run.checkpoint > 0) run.checkpoint -= 1;
    }
    run.entries.push(normalized);
    run.updatedAt = nowIso();
    historyTrimRuns();
    historyScheduleWrite();
  }

  function historyAdoptSession(slotId) {
    if (!slotId || !historyStore.runs.session) return;
    if (!historyStore.runs[slotId]) historyStore.runs[slotId] = historyStore.runs.session;
    delete historyStore.runs.session;
    historyWrite();
  }

  function historyResetForSlot(slotId) {
    if (historySaveTimer) {
      clearTimeout(historySaveTimer);
      historySaveTimer = 0;
    }
    delete historyStore.runs.session;
    historyStore.runs[slotId] = { entries: [], checkpoint: 0, updatedAt: nowIso() };
    historyTrimRuns();
    historyWrite();
  }

  function historyTruncateToCheckpoint(slotId) {
    var run = historyStore.runs[slotId];
    if (!run) return;
    if (run.entries.length > run.checkpoint) run.entries = run.entries.slice(0, run.checkpoint);
  }

  function historyDeleteRuns(ids) {
    ids.forEach(function (id) { delete historyStore.runs[id]; });
    historyTrimRuns();
    historyWrite();
  }

  // 从章节重玩：只把“本章之前”的回顾条目搬过来；本章重新走，不混入旧局台词。
  function historyCopyPrefix(sourceId, targetId, chapterId) {
    var order = branchChapterIds();
    var targetIndex = order.indexOf(chapterId);
    var entries = [];
    var source = historyStore.runs[sourceId];
    if (source && targetIndex > 0) {
      source.entries.forEach(function (entry) {
        var index = order.indexOf(entry.c);
        if (index !== -1 && index < targetIndex) entries.push(cloneJson(entry));
      });
    }
    delete historyStore.runs.session;
    historyStore.runs[targetId] = {
      entries: entries,
      checkpoint: entries.length,
      updatedAt: nowIso()
    };
    historyTrimRuns();
    historyWrite();
  }

  function historyResetAll() {
    if (historySaveTimer) {
      clearTimeout(historySaveTimer);
      historySaveTimer = 0;
    }
    historyStore = emptyHistoryStore();
    historyStorageOk = true;
    historyStorageWarned = false;
    historyState.open = false;
  }

  function historyClearStorage() {
    try {
      window.localStorage.removeItem(HISTORY_KEY);
    } catch (err) {
      console.error("[XB] 清除回顾记录失败：" + err.message);
    }
    historyResetAll();
  }

  function historyEntryView(entry) {
    var found = locate(entry.c, entry.n);
    if (!found) return null;
    var node = found.node;
    if (entry.t === "line") {
      return {
        kind: "line",
        speaker: node.speaker && node.speaker !== "旁白" ? node.speaker : "",
        text: node.text || ""
      };
    }
    if (entry.t === "prompt") {
      if (!node.prompt) return null;
      return { kind: "prompt", text: node.prompt };
    }
    if (entry.t === "choice") {
      var chosen = null;
      (node.options || []).forEach(function (option) {
        if (option.key === entry.key) chosen = option;
      });
      if (!chosen) return null;
      return {
        kind: "choice",
        text: chosen.text,
        meta: entry.timedOut ? "（时间到了，默认项）" : ""
      };
    }
    if (entry.t === "multi") {
      var picked = [];
      (entry.ids || []).forEach(function (id) {
        (node.options || []).forEach(function (option) {
          if (option.id === id) picked.push(option.text);
        });
      });
      return {
        kind: "choice",
        text: picked.length ? picked.join("、") : "没有选任何一样",
        meta: ""
      };
    }
    if (entry.t === "namepick") {
      var pickedName = null;
      (node.names || []).forEach(function (name) {
        if (name.id === entry.nameId) pickedName = name;
      });
      return {
        kind: "choice",
        text: pickedName ? "抄下「" + pickedName.name + "」的名字" : "一个名字也没抄",
        meta: entry.timedOut ? "（时间到了）" : ""
      };
    }
    return null;
  }

  function appendHistoryChapter(chapter) {
    var heading = document.createElement("p");
    heading.className = "xb-history__chapter";
    heading.textContent = chapter ? chapter.title : "路上";
    els.historyList.append(heading);
  }

  function appendHistoryTextRow(rowLabel, item) {
    var row = document.createElement("div");
    row.className = "xb-history__row";

    var speaker = document.createElement("p");
    speaker.className = "xb-history__speaker";
    speaker.textContent = rowLabel;
    if (!rowLabel) speaker.setAttribute("aria-hidden", "true");

    var rule = document.createElement("span");
    rule.className = "xb-history__rule";
    rule.setAttribute("aria-hidden", "true");

    var text = document.createElement("p");
    text.className = "xb-history__text" + (item.kind === "choice" ? " is-choice" : "");
    if (item.kind === "choice") {
      var arrow = document.createElement("span");
      arrow.className = "xb-history__arrow";
      arrow.textContent = "➤";
      arrow.setAttribute("aria-hidden", "true");
      text.append(arrow, document.createTextNode(item.text));
      if (item.meta) {
        var meta = document.createElement("span");
        meta.className = "xb-history__meta";
        meta.textContent = item.meta;
        text.append(meta);
      }
    } else {
      text.textContent = item.text;
    }

    row.append(speaker, rule, text);
    els.historyList.append(row);
  }

  function renderHistoryPanel() {
    els.historyList.textContent = "";
    var run = historyRun();
    var entries = run ? run.entries : [];
    var lastChapter = null;
    var hasVisible = false;
    entries.forEach(function (entry) {
      var item = historyEntryView(entry);
      if (!item) return;
      if (entry.c !== lastChapter) {
        appendHistoryChapter(chapterById(entry.c));
        lastChapter = entry.c;
      }
      hasVisible = true;
      if (item.kind === "prompt") {
        var row = document.createElement("div");
        row.className = "xb-history__row xb-history__row--prompt";
        var prompt = document.createElement("p");
        prompt.className = "xb-history__prompt";
        prompt.textContent = item.text;
        row.append(prompt);
        els.historyList.append(row);
        return;
      }
      appendHistoryTextRow(item.speaker || "", item);
    });
    els.historyEmpty.hidden = hasVisible;
  }

  function openHistory() {
    if (!state || state.scene !== "vn" || historyState.open) return;
    if (state.paused || titleCardState.open) return;
    if (savePanelState.open || confirmState.open || endingReview.active) return;
    if (packState.open || doorState.open || dangerState.open || bagConfirmState.open) return;
    if (codexState.open || galleryState.open || rosterGalleryState.open || branchState.open || achievementState.open) return;
    historyFlush();
    renderHistoryPanel();
    historyState.open = true;
    historyState.previousFocus = document.activeElement;
    state.paused = true;
    refreshAudioDuck();
    cancelAuto();
    if (vnRun.typing) {
      cancelTyping();
      vnRun.paused = true;
    }
    els.historyPanel.hidden = false;
    els.historyClose.focus({ preventScroll: true });
    requestAnimationFrame(function () {
      els.historyBody.scrollTop = els.historyBody.scrollHeight;
    });
  }

  function closeHistory() {
    if (!historyState.open) return;
    historyState.open = false;
    els.historyPanel.hidden = true;
    state.paused = false;
    refreshAudioDuck();
    if (vnRun.typing && vnRun.paused) {
      vnRun.paused = false;
      vnRun.lastTs = 0;
      vnRun.rafId = requestAnimationFrame(typeStep);
    }
    if (choiceRun.active) choiceRun.lastTs = 0;
    if (interactRun.active) interactRun.lastTs = 0;
    var previous = historyState.previousFocus;
    historyState.previousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus({ preventScroll: true });
    if (!vnRun.typing && (autoEnabled || skipEnabled)) scheduleAdvance(AUTO_DELAY_MS);
    historyFlush();
  }

  // ?reset=1 与调试用：只清存档、章节底片与回顾，不动分支/成就/名册（初始化在 initializeGame 里另清）。
  function clearSave() {
    try {
      window.localStorage.removeItem(SAVES_KEY);
      window.localStorage.removeItem(SAVE_KEY);
      window.localStorage.removeItem(LEGACY_SAVE_KEY);
      window.localStorage.removeItem(HISTORY_KEY);
      window.localStorage.removeItem(CHAPTERS_KEY);
    } catch (err) {
      console.error("[XB] 清除存档失败：" + err.message);
    }
    savesStore = emptySavesStore();
    savesStore.settings = normalizeStoreSettings(state ? state.settings : null);
    historyResetAll();
    chapterStore = emptyChapterStore();
    chapterStorageOk = true;
    chapterStorageWarned = false;
  }

  // 只在章末、结局与手动「保存」时调用：中途对话不落盘，退出后回到本章开头。
  function saveNow() {
    if (!state) return false;
    if (endingReview.active) return false;
    var payload = serialize(state);
    var json = JSON.stringify(payload);
    var bytes = utf8Bytes(json);
    if (bytes > MAX_SAVE_BYTES) {
      console.error("[XB] 存档 " + bytes + " 字节，超过上限 " + MAX_SAVE_BYTES);
      toast("存档异常：本局无法继续保存");
      debugExtra = "存档超限 " + bytes + " B";
      updateDebug();
      return false;
    }
    var slot = activeSlot();
    if (!slot) {
      slot = createSlotRecord(payload);
      savesStore.slots.unshift(slot);
      savesStore.activeId = slot.id;
      // 调试局（?chapter=）没有槽位，第一次落盘时把 session 桶迁到新槽。
      historyAdoptSession(slot.id);
    } else {
      slot.state = payload;
      slot.updatedAt = nowIso();
    }
    savesStore.settings = normalizeStoreSettings(payload.settings);
    var ok = writeSavesStore(savesStore);
    // 只有写档成功才推进 checkpoint：读档时截到这里，当前行由 render 重新记。
    if (ok) {
      var history = historyStore.runs[historyRunKey()];
      if (history) {
        history.checkpoint = history.entries.length;
        history.updatedAt = nowIso();
        historyFlush();
      }
    }
    debugExtra = "save=" + bytes + " B · " + savesStore.slots.length + " 档";
    updateDebug();
    return ok;
  }

  // 设置是全局一份：只写 store.settings，不动任何档的进度与「上次保存」时间。
  function saveSettingsOnly() {
    savesStore.settings = normalizeStoreSettings(state ? state.settings : null);
    return writeSavesStore(savesStore);
  }

  /* ---------------- 存档列表与确认弹窗 ---------------- */

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function formatSaveDate(iso) {
    var date = new Date(iso);
    if (!iso || isNaN(date.getTime())) return "时间不明";
    return date.getFullYear() + "年" + pad2(date.getMonth() + 1) + "月" + pad2(date.getDate()) + "日";
  }

  function formatSaveClock(iso) {
    var date = new Date(iso);
    if (!iso || isNaN(date.getTime())) return "时间不明";
    return pad2(date.getMonth() + 1) + "-" + pad2(date.getDate()) + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes());
  }

  function slotLabel(slot) {
    return formatSaveDate(slot.createdAt) + "的存档" + (slotEnded(slot) ? "（已完结）" : "（未完结）");
  }

  function slotSubLabel(slot) {
    if (slotEnded(slot)) {
      var ending = slot.state.ending;
      var numberLabel = ending.routeLabel || "";
      var head = numberLabel === "旧档" ? "旧档结局" : "结局" + numberLabel + "/11";
      return head + (ending.routeTitle ? " · " + ending.routeTitle : "") + " · 已完结";
    }
    var chapter = chapterById(slot.state.chapterId);
    return (chapter ? chapter.title : "长征途中") + " · 上次保存 " + formatSaveClock(slot.updatedAt);
  }

  function savePanelChapterMode() {
    return savePanelState.mode === "chapter-target" || savePanelState.mode === "chapter-source";
  }

  function chapterReplaySourceSlots(chapterId) {
    return savesStore.slots.filter(function (slot) {
      return slotEnded(slot) && !!chapterSnapshotState(slot.id, chapterId);
    });
  }

  function chapterReplayAvailability(chapterId) {
    if (chapterId === "prologue") {
      return { allowed: false, reason: "序章没有前情；直接开新档即可。", sources: 0 };
    }
    var completed = savesStore.slots.filter(slotEnded);
    if (!completed.length) {
      return { allowed: false, reason: "完成一周目后，可从这一章重新开始。", sources: 0 };
    }
    var sources = chapterReplaySourceSlots(chapterId).length;
    if (!sources) {
      return { allowed: false, reason: "已完结存档里还没有这一章的前情记录。再走一次完整周目后可用。", sources: 0 };
    }
    if (!latestUnfinishedSlot() && savesStore.slots.length >= SAVE_SLOT_MAX) {
      return { allowed: false, reason: "存档已满，请先删除一个存档。", sources: sources };
    }
    return { allowed: true, reason: "", sources: sources };
  }

  function openChapterTarget(chapterId, trigger) {
    var availability = chapterReplayAvailability(chapterId);
    if (!availability.allowed) {
      toast(availability.reason);
      return;
    }
    savePanelState.open = true;
    savePanelState.mode = "chapter-target";
    savePanelState.selected = {};
    savePanelState.chapterId = chapterId;
    savePanelState.targetId = null;
    savePanelState.previousFocus = trigger || document.activeElement;
    renderSavePanel();
    els.savesPanel.hidden = false;
    XB.audio.cue("codex");
    refreshAudioDuck();
    els.savesClose.focus({ preventScroll: true });
  }

  function openSaves() {
    if (!state || state.scene !== "title") return;
    savePanelState.open = true;
    savePanelState.mode = "list";
    savePanelState.selected = {};
    savePanelState.chapterId = null;
    savePanelState.targetId = null;
    savePanelState.previousFocus = document.activeElement;
    renderSavePanel();
    els.savesPanel.hidden = false;
    XB.audio.cue("codex");
    refreshAudioDuck();
    els.savesClose.focus({ preventScroll: true });
  }

  function closeSaves(silent) {
    if (!savePanelState.open) return;
    var previous = savePanelState.previousFocus;
    savePanelState.open = false;
    savePanelState.mode = "list";
    savePanelState.selected = {};
    savePanelState.chapterId = null;
    savePanelState.targetId = null;
    savePanelState.previousFocus = null;
    els.savesPanel.hidden = true;
    els.savesPanel.classList.remove("is-chapter");
    var panel = els.savesPanel.querySelector(".xb-saves__panel");
    if (panel) panel.classList.remove("is-chapter");
    refreshAudioDuck();
    if (!silent && previous && previous.focus) previous.focus({ preventScroll: true });
  }

  function chapterSaveBack() {
    if (savePanelState.mode === "chapter-source") {
      savePanelState.mode = "chapter-target";
      savePanelState.targetId = null;
      renderSavePanel();
      els.savesClose.focus({ preventScroll: true });
      return;
    }
    closeSaves();
  }

  function focusFirstChapterSource() {
    var first = els.savesList.querySelector('.xb-saves__row[aria-disabled="false"]');
    if (first) first.focus({ preventScroll: true });
    else els.savesClose.focus({ preventScroll: true });
  }

  function renderSavePanel() {
    var mode = savePanelState.mode;
    var chapterMode = savePanelChapterMode();
    var chapter = savePanelState.chapterId ? chapterById(savePanelState.chapterId) : null;
    var slots = savesStore.slots;
    if (mode === "chapter-target") {
      slots = slots.filter(function (slot) { return !slotEnded(slot); });
    } else if (mode === "chapter-source") {
      slots = slots.filter(slotEnded);
    }
    var readySources = mode === "chapter-source" ? chapterReplaySourceSlots(savePanelState.chapterId).length : 0;
    var endedCount = savesStore.slots.filter(slotEnded).length;

    els.savesPanel.classList.toggle("is-chapter", chapterMode);
    var panel = els.savesPanel.querySelector(".xb-saves__panel");
    if (panel) panel.classList.toggle("is-chapter", chapterMode);
    if (mode === "chapter-target") {
      els.savesKicker.textContent = "从此章开始 · 第 1 步 / 共 2 步";
      els.savesTitle.textContent = "请选择一个存档开始";
      els.savesCount.textContent = "章节：" + (chapter ? chapter.title : "") + " · 未完结 " + slots.length + " 档";
    } else if (mode === "chapter-source") {
      els.savesKicker.textContent = "从此章开始 · 第 2 步 / 共 2 步";
      els.savesTitle.textContent = "对于你选择的章节前的剧情走向，你希望走哪条路线？";
      els.savesCount.textContent = "章节：" + (chapter ? chapter.title : "") + " · 已完结 " + slots.length + " 档，其中 " + readySources + " 档可作前情";
    } else {
      els.savesKicker.textContent = "一块门板，两万五千里";
      els.savesTitle.textContent = "存档";
      els.savesCount.textContent = savesStore.slots.length
        ? "已存 " + savesStore.slots.length + " 档 · 其中 " + endedCount + " 档已完结"
        : "还没有存档";
    }

    els.savesList.textContent = "";
    slots.forEach(function (slot) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "xb-saves__row";
      row.dataset.action = "save-slot";
      row.dataset.id = slot.id;
      var main = document.createElement("span");
      main.className = "xb-saves__row-main";
      main.textContent = slotLabel(slot);
      var sub = document.createElement("span");
      sub.className = "xb-saves__row-sub";
      sub.textContent = slotSubLabel(slot);
      row.append(main, sub);

      if (mode === "chapter-source") {
        var ready = !!chapterSnapshotState(slot.id, savePanelState.chapterId);
        row.setAttribute("aria-disabled", ready ? "false" : "true");
        if (!ready) {
          row.classList.add("is-unavailable");
          sub.textContent += " · 缺少这一章前情";
        }
      }

      if (mode === "delete") {
        var checked = savePanelState.selected[slot.id] === true;
        row.setAttribute("role", "checkbox");
        row.setAttribute("aria-checked", checked ? "true" : "false");
        row.classList.add("is-selectable");
        if (checked) row.classList.add("is-selected");
      }
      els.savesList.append(row);
    });

    els.savesEmpty.hidden = slots.length > 0;
    if (mode === "chapter-target") {
      els.savesEmpty.textContent = "没有未完结的存档。点「开启新档」，从这一章重新出发。";
    } else if (mode === "chapter-source") {
      els.savesEmpty.textContent = slots.length
        ? "这些已完结存档都缺少这一章的前情记录。再走一次完整周目后可用。"
        : "还没有已完结的存档。先走完一周目。";
    } else {
      els.savesEmpty.textContent = "还没有存档。点「开启新档」，从于都河出发。";
    }

    var latest = latestUnfinishedSlot();
    els.saveLatest.setAttribute("aria-disabled", latest ? "false" : "true");
    els.saveDelete.setAttribute("aria-disabled", savesStore.slots.length ? "false" : "true");
    els.saveNew.setAttribute("aria-disabled", savesStore.slots.length >= SAVE_SLOT_MAX ? "true" : "false");
    els.saveNew.hidden = mode === "chapter-source";
    els.saveLatest.hidden = chapterMode;
    els.saveDelete.hidden = chapterMode;
    els.savesBack.hidden = !chapterMode;
    if (chapterMode) {
      els.savesBack.textContent = mode === "chapter-source" ? "返回上一步" : "返回章节";
      els.savesBack.dataset.action = "saves-back";
    }
    els.savesDeleteBar.hidden = mode !== "delete";
    var selectedCount = Object.keys(savePanelState.selected).length;
    els.savesDeleteCount.textContent = "已选 " + selectedCount + " 个";
    els.savesDeleteConfirm.setAttribute("aria-disabled", selectedCount ? "false" : "true");

    var disabledSources = mode === "chapter-source" ? slots.length - readySources : 0;
    els.savesHint.textContent = !savesStorageOk
      ? "本局无法存档（浏览器限制），进度只在本次有效。"
      : mode === "chapter-target"
        ? "只能选择未完结的存档；若没有，请开启新档。选定后进入第 2 步。"
        : mode === "chapter-source"
          ? "只拷贝所选章节之前的剧情线；本章及之后的进度会重新开始。" +
            (disabledSources ? " 旧版本存档缺少章节记录，不能作为来源。" : "")
          : mode === "delete"
            ? "点选要删除的存档，再按「确认」。"
            : "每过一章会自动保存；中途退出回到本章开头，想停在原处请点暂停「保存」。";
  }

  function chooseSaveSlot(id) {
    var slot = slotById(id);
    if (!slot || !savePanelState.open) return;
    if (savePanelState.mode === "delete") {
      toggleSaveSelection(id);
      return;
    }
    if (savePanelState.mode === "chapter-target") {
      if (slotEnded(slot)) return;
      savePanelState.targetId = slot.id;
      savePanelState.mode = "chapter-source";
      renderSavePanel();
      focusFirstChapterSource();
      return;
    }
    if (savePanelState.mode === "chapter-source") {
      if (!slotEnded(slot)) return;
      if (!chapterSnapshotState(slot.id, savePanelState.chapterId)) {
        toast("这个存档缺少这一章的前情记录");
        return;
      }
      applyChapterStart(slot, savePanelState.chapterId);
      return;
    }
    if (slotEnded(slot)) {
      openEndingReview(slot);
      return;
    }
    openConfirm("continue-slot", id);
  }

  function toggleSaveSelection(id) {
    if (savePanelState.selected[id]) delete savePanelState.selected[id];
    else savePanelState.selected[id] = true;
    renderSavePanel();
    var row = els.savesList.querySelector('[data-id="' + id + '"]');
    if (row) row.focus({ preventScroll: true });
  }

  function beginDeleteMode() {
    if (!savesStore.slots.length) return;
    savePanelState.mode = "delete";
    savePanelState.selected = {};
    renderSavePanel();
    var first = els.savesList.querySelector(".xb-saves__row");
    if (first) first.focus({ preventScroll: true });
  }

  function endDeleteMode() {
    savePanelState.mode = "list";
    savePanelState.selected = {};
    renderSavePanel();
    els.saveDelete.focus({ preventScroll: true });
  }

  function deleteSelectedSlots() {
    var ids = Object.keys(savePanelState.selected);
    if (!ids.length) return;
    var removedActive = ids.indexOf(savesStore.activeId) !== -1;
    savesStore.slots = savesStore.slots.filter(function (slot) {
      return ids.indexOf(slot.id) === -1;
    });
    if (removedActive) savesStore.activeId = null;
    writeSavesStore(savesStore);
    historyDeleteRuns(ids);
    chapterRemoveSlots(ids);
    savePanelState.mode = "list";
    savePanelState.selected = {};
    closeConfirm(true);
    renderSavePanel();
    els.saveDelete.focus({ preventScroll: true });
    toast("已删除 " + ids.length + " 个存档");
  }

  function confirmCopy(kind) {
    if (kind === "init") {
      return {
        title: "是否初始化游戏？",
        body: "这意味着你的存档、剧情分支、成就和回顾记录会被全部清空，名册也会清空；音量、字号等设置保留。此操作不可撤销。"
      };
    }
    if (kind === "new") return { title: "是否重新开始长征？", body: "" };
    if (kind === "continue") return { title: "是否继续未竟的长征？", body: "" };
    if (kind === "continue-slot") return { title: "是否继续长征？", body: "" };
    if (kind === "delete") return { title: "确定要删除这些存档吗？", body: "" };
    return { title: "", body: "" };
  }

  function openConfirm(kind, slotId) {
    confirmState.open = true;
    confirmState.kind = kind;
    confirmState.slotId = slotId || null;
    confirmState.previousFocus = document.activeElement;
    var copy = confirmCopy(kind);
    els.saveConfirmTitle.textContent = copy.title;
    els.saveConfirmBody.textContent = copy.body;
    els.saveConfirmBody.hidden = !copy.body;
    els.saveConfirm.hidden = false;
    refreshAudioDuck();
    els.saveConfirmNo.focus({ preventScroll: true });
  }

  function closeConfirm(silent) {
    if (!confirmState.open) return;
    var previous = confirmState.previousFocus;
    confirmState.open = false;
    confirmState.kind = "";
    confirmState.slotId = null;
    confirmState.previousFocus = null;
    els.saveConfirm.hidden = true;
    refreshAudioDuck();
    if (!silent && previous && previous.focus) previous.focus({ preventScroll: true });
  }

  function onConfirmYes() {
    var kind = confirmState.kind;
    var slotId = confirmState.slotId;
    if (kind === "init") {
      closeConfirm(true);
      closeSettings(true);
      initializeGame();
      return;
    }
    if (kind === "delete") {
      deleteSelectedSlots();
      return;
    }
    closeConfirm(false);
    if (kind === "new") {
      startNewGame();
      return;
    }
    var slot = kind === "continue" ? latestUnfinishedSlot() : slotById(slotId);
    if (slot) loadSlot(slot);
  }

  function onConfirmNo() {
    closeConfirm(false);
  }

  function resumeSceneFor(target) {
    if (target && isFullEnding(target.ending)) return "ending";
    if (target && target.nodeId && locate(target.chapterId, target.nodeId)) return "vn";
    return "map";
  }

  // 读档：快照进 state，设置用全局一份；只改 activeId，不改「上次保存」时间。
  function loadSlot(slot) {
    if (!slot) return;
    var result = normalize(slot.state);
    if (result.issue) {
      toast("这个存档与当前版本不匹配");
      return;
    }
    endingReview.active = false;
    endingReview.backup = null;
    state = result.state;
    state.settings = cloneJson(savesStore.settings);
    state.paused = false;
    historyFlush();
    savesStore.activeId = slot.id;
    historyTruncateToCheckpoint(slot.id);
    writeSavesStore(savesStore);
    closeSaves(true);
    applySettings();
    state.scene = resumeSceneFor(state);
    render();
    toast("已载入 " + slotLabel(slot));
  }

  // 从章节重玩：来源档的前情快照进目标档；目标档从本章第一句重新开始。
  function applyChapterStart(sourceSlot, chapterId) {
    var snapshot = chapterSnapshotState(sourceSlot.id, chapterId);
    if (!snapshot) {
      toast("这个存档缺少这一章的前情记录");
      return;
    }
    var result = normalize(snapshot);
    if (result.issue) {
      toast("这一章的前情记录与当前版本不匹配");
      return;
    }
    var chapter = chapterById(chapterId);
    if (!chapter || !chapter.playable) {
      toast("这一段还没接上");
      return;
    }
    var copied = result.state;
    copied.scene = "vn";
    copied.ending = null;
    copied.paused = false;
    copied.settings = cloneJson(savesStore.settings);
    if (!startChapter(copied, chapterId)) {
      toast("这一段没能载入");
      return;
    }
    if (copied.unlockedChapters.indexOf(chapterId) === -1) copied.unlockedChapters.push(chapterId);

    var target = savePanelState.targetId ? slotById(savePanelState.targetId) : null;
    if (!target && savesStore.slots.length >= SAVE_SLOT_MAX) {
      toast("存档已满，请先删除一个存档");
      return;
    }
    var payload = serialize(copied);
    var at = nowIso();
    var isNew = !target;
    if (target) {
      target.state = payload;
      target.updatedAt = at;
    } else {
      target = createSlotRecord(payload);
      savesStore.slots.unshift(target);
    }
    savesStore.activeId = target.id;
    savesStore.settings = normalizeStoreSettings(copied.settings);

    // 先把旧局的暂停/结局回顾收干净，再换 state；否则 closePause 会去碰新档。
    if (state && state.paused) closePause();
    if (endingReview.active) {
      endingReview.active = false;
      endingReview.backup = null;
    }
    closeSaves(true);
    closeBranch();

    historyCopyPrefix(sourceSlot.id, target.id, chapterId);
    chapterCopyPrefix(sourceSlot.id, target.id, chapterId);

    state = copied;
    state.scene = "vn";
    state.paused = false;
    branchLastRun = null;
    branchRecordedEnding = null;
    branchState.run = null;
    writeSavesStore(savesStore);
    applySettings();
    showScene("vn");
    render();
    chapterCapture(target.id, chapterId);
    saveNow();
    toast((isNew ? "已开新档" : "已覆盖这一档的后续进度") + "：从「" + chapter.title + "」重新开始");
  }

  // 已完结存档：借结局页做只读回顾，不重建、不记名册、不覆盖存档。
  function openEndingReview(slot) {
    var result = normalize(slot.state);
    if (result.issue || !isFullEnding(result.state.ending)) {
      toast("这个结局存档与当前版本不匹配");
      return;
    }
    endingReview.active = true;
    endingReview.backup = state;
    state = result.state;
    state.settings = cloneJson(savesStore.settings);
    state.scene = "ending";
    state.paused = false;
    els.savesPanel.hidden = true;
    render();
  }

  function closeEndingReview() {
    endingReview.active = false;
    state = endingReview.backup || defaults();
    endingReview.backup = null;
    if (state.scene === "ending") state.scene = "title";
    els.endingBranch.hidden = false;
    els.endingCodex.hidden = false;
    els.endingHome.textContent = "回到标题";
    render();
    if (savePanelState.open) {
      els.savesPanel.hidden = false;
      renderSavePanel();
      els.savesClose.focus({ preventScroll: true });
    }
  }

  // 初始化：清存档、分支、成就、名册；音量/字号/速度等设置保留。
  function initializeGame() {
    var keys = [SAVES_KEY, SAVE_KEY, LEGACY_SAVE_KEY, HISTORY_KEY, CHAPTERS_KEY, BRANCH_KEY, ACHIEVEMENT_KEY, ROSTER_KEY];
    var failures = 0;
    keys.forEach(function (key) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        failures += 1;
        console.error("[XB] 初始化无法清除 " + key + "：" + err.message);
      }
    });
    var settings = normalizeStoreSettings(state ? state.settings : null);
    savesStore = emptySavesStore();
    savesStore.settings = settings;
    savesStorageOk = failures === 0;
    savesStorageWarned = false;
    branchMemory = null;
    branchStorageOk = true;
    branchStorageWarned = false;
    branchState.store = null;
    branchState.run = null;
    branchLastRun = null;
    branchRecordedEnding = null;
    achievementMemory = null;
    achievementStorageOk = true;
    achievementStorageWarned = false;
    achievementState.store = null;
    achievementState.runIds = [];
    historyResetAll();
    chapterStore = emptyChapterStore();
    chapterStorageOk = failures === 0;
    chapterStorageWarned = false;
    endingReview.active = false;
    endingReview.backup = null;
    state = defaults();
    state.settings = settings;
    state.scene = "title";
    savePanelState.mode = "list";
    savePanelState.selected = {};
    closeSaves(true);
    // 空列表也要落盘：设置是全局的，初始化不清设置，刷新后还得在。
    writeSavesStore(savesStore);
    applySettings();
    render();
    var first = els.titleMenu.querySelector("button");
    if (first) first.focus({ preventScroll: true });
    if (failures) toast("初始化未完全成功：浏览器未允许清除全部记录");
    else toast("已初始化：存档、分支、成就、名册与回顾已清空");
  }

  function manualSave() {
    if (saveNow() && activeSlot()) toast("已保存：" + slotLabel(activeSlot()));
  }

  /* 名册回廊：xiangbei.roster.v1 与主存档分开，清档不清名册，名册也不影响路线。 */
  var ROSTER_KEY = "xiangbei.roster.v1";
  var ROSTER_MAX_PAGES = 8;

  function normalizeRosterPage(page) {
    if (!isPlainObject(page)) return null;
    if (page.route === "legacy") return null;
    if (ROUTE_IDS.indexOf(page.route) === -1 && LEGACY_ROUTES.indexOf(page.route) === -1) return null;
    if (typeof page.title !== "string" || typeof page.at !== "string" || typeof page.note !== "string") return null;
    if (!isFiniteNumber(page.companyEnd)) return null;
    // 坏结局是空名册；旧 v1.3 页保留 7 或 8 名。
    if (!Array.isArray(page.names) || [0, 7, 8].indexOf(page.names.length) === -1) return null;
    var names = [];
    for (var i = 0; i < page.names.length; i += 1) {
      var entry = page.names[i];
      if (!isPlainObject(entry) || typeof entry.id !== "string" || typeof entry.name !== "string") return null;
      if (NAME_STATUS.indexOf(entry.status) === -1) return null;
      var row = { id: entry.id, name: entry.name, status: entry.status };
      if (typeof entry.answeredBy === "string" && entry.answeredBy) row.answeredBy = entry.answeredBy;
      names.push(row);
    }
    return { route: page.route, title: page.title, at: page.at, companyEnd: page.companyEnd, note: page.note, names: names };
  }

  function readRosterPages() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(ROSTER_KEY);
    } catch (err) {
      console.error("[XB] 读取名册失败：" + err.message);
      return { ok: false, pages: [] };
    }
    if (!raw) return { ok: true, pages: [] };
    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("[XB] 名册不是合法 JSON：" + err.message);
      return { ok: true, pages: [] };
    }
    if (!isPlainObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.pages)) {
      return { ok: true, pages: [] };
    }
    var pages = [];
    parsed.pages.forEach(function (page) {
      var clean = normalizeRosterPage(page);
      if (clean) pages.push(clean);
    });
    return { ok: true, pages: pages.slice(-ROSTER_MAX_PAGES) };
  }

  // 一局只记一页：ending.recorded 落进快照，刷新结局不会重复追加。
  function recordEndingPage() {
    var ending = state.ending;
    if (!ending || ending.recorded === true) return;
    if (ending.route === "legacy") {
      ending.recorded = true;
      return;
    }
    var stored = readRosterPages();
    if (!stored.ok) {
      ending.recorded = true;
      toast("本机无法保存名册，本局仍可继续");
      return;
    }
    var page = {
      route: ending.route,
      title: ending.routeTitle || ending.route,
      at: new Date().toISOString().slice(0, 10),
      companyEnd: ending.stats.companyEnd,
      note: ending.routeLede || "",
      names: ending.names.map(function (entry) {
        var row = { id: entry.id, name: entry.name, status: entry.status };
        if (entry.answeredBy) row.answeredBy = entry.answeredBy;
        return row;
      })
    };
    var pages = stored.pages.concat([page]).slice(-ROSTER_MAX_PAGES);
    try {
      window.localStorage.setItem(ROSTER_KEY, JSON.stringify({ version: 1, pages: pages }));
    } catch (err) {
      console.error("[XB] 写入名册失败：" + err.message);
      ending.recorded = true;
      toast("本机无法保存名册，本局仍可继续");
      return;
    }
    ending.recorded = true;
  }

  function resize() {
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    if (!width || !height) return;
    var scale = Math.min(width / 1280, height / 720);
    document.documentElement.style.setProperty("--scale", String(scale));
    scheduleArtResize(scale);
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
      clearStatusNotice();
      if (packState.open) closePackPanel(true);
      if (bagConfirmState.open) closeBagConfirm(true);
      if (doorState.open) {
        doorState.open = false;
        els.doorModal.hidden = true;
      }
    }
    showScene(state.scene);
    if (state.scene === "title") renderTitle();
    else if (state.scene === "map") renderMap();
    else if (state.scene === "vn") renderVn(currentNode(state));
    else if (state.scene === "ending") renderEnding();
    updateHud();
    updateDebug();
  }

  function renderTitle() {
    XB.audio.setScene("title");
    paintStage("title");
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
    els.vnMultichoice.hidden = true;
    multiRun.node = null;
    multiRun.selected = [];
    multiRun.locked = false;
    els.vnResult.hidden = true;
    els.vnInteract.hidden = true;
    els.vnToolbar.hidden = true;
  }

  // 泸定开场统一把人打到“勉强”。只做一次；旧档若已经过了 l019，不回头改人物状态。
  var LUDING_STATUS_REASON = "连续行军，没吃上一顿热饭";
  function applyLudingEntryStatus() {
    if (!state || state.chapterId !== "luding" || state.flags["memory.luding_status"] === true) return;
    var here = XB.core.locate("luding", state.nodeId);
    var firstCrisis = XB.core.locate("luding", "l019");
    if (!here || !firstCrisis) return;
    if (here.index >= firstCrisis.index) {
      XB.core.setFlag(state, "memory.luding_status", true);
      return;
    }
    ["feimao", "zaowang", "dongsheng"].forEach(function (id) {
      if (state.flags["fate." + id + ".dead"] === true) return;
      XB.core.setFlag(state, "quality." + id, 2, LUDING_STATUS_REASON);
    });
    XB.core.setFlag(state, "memory.luding_status", true);
  }

  // 节点级状态：choice 在选项出现前写，line 在本句显示前写。
  // statusOnce 给“剧情事件只发生一次”的行用；刷新到同一节点不再重复加状态。
  function applyNodeStatus(node) {
    if (!node.status) return;
    if (node.statusOnce && state.flags[node.statusOnce] === true) return;
    XB.core.applySet(state, node.status, node.id + ":status", node.statusReason || "他撑不住了");
    if (node.statusOnce) XB.core.setFlag(state, node.statusOnce, true);
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
    applyLudingEntryStatus();
    applyNodeStatus(found.node);
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
      case "multichoice":
        renderMultiChoice(found.node);
        break;
      case "result":
        renderResult(found.node);
        break;
      case "settle":
        runGrassSettlement();
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
    updateHud();
    updateDebug();
    drainStatusEvents();
    flushStatusNotice();
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
    historyPush({ t: "line", c: state.chapterId, n: node.id });
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
    if (dangerState.open || packState.open || doorState.open || bagConfirmState.open) return;
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
    renderVn(next);
  }

  /* ---------------- 限时选项 ---------------- */

  function renderChoice(node) {
    historyPush({ t: "prompt", c: state.chapterId, n: node.id, k: "choice" });
    els.vnChoices.hidden = false;
    els.vnChoicePrompt.hidden = !node.prompt;
    els.vnChoicePrompt.textContent = node.prompt || "";
    els.vnChoices.textContent = "";
    els.vnChoices.style.setProperty("--choice-progress", "1");

    // 缺物资的条件选项也留在原位，置灰禁用；玩家能看到“本来可以怎么做”。
    (node.options || []).forEach(function (option) {
      var available = XB.core.optionVisible(state, option);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "xb-choice";
      button.dataset.action = "choose";
      button.dataset.key = option.key;
      if (!available) {
        button.disabled = true;
        button.classList.add("is-unavailable");
        button.setAttribute("aria-disabled", "true");
      }

      var index = document.createElement("span");
      index.className = "xb-choice__index";
      index.textContent = option.key;
      var label = document.createElement("span");
      label.className = "xb-choice__label";
      label.textContent = option.text;
      var timer = document.createElement("span");
      timer.className = "xb-choice__timer";
      var fill = document.createElement("i");
      timer.append(fill);

      if (option.cost && !node.hideCost) {
        var cost = document.createElement("span");
        cost.className = "xb-choice__cost";
        cost.textContent = "代价 · " + option.cost;
        button.append(index, label, cost, timer);
      } else {
        button.append(index, label, timer);
      }
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
    updateHud();
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
      resolveChoice(XB.core.defaultOptionKey(state, choiceRun.node), true);
      return;
    }
    choiceRun.rafId = requestAnimationFrame(stepChoiceTimer);
  }

  function cancelChoiceTimer() {
    choiceRun.active = false;
    updateHud();
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
    historyPush({ t: "choice", c: state.chapterId, n: node.id, k: "choice", key: key, timedOut: timedOut === true });
    recordChoiceAchievement(node, key, timedOut);
    XB.audio.cue(timedOut ? "choice-timeout" : "choice-select");
    markChoice(node, key, timedOut);
    if (timedOut) {
      var timeoutText = "超时：已按默认选项结算 —— " + option.text;
      if (option.cost && !node.hideCost) timeoutText += "（" + option.cost + "）";
      toast(timeoutText);
    }
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

  /* ---------------- 多选（行囊 / 弃物） ---------------- */

  function multiOptionById(node, id) {
    var options = (node && node.options) || [];
    for (var i = 0; i < options.length; i += 1) {
      if (options[i].id === id) return options[i];
    }
    return null;
  }

  function multiMax(node) {
    return XB.core.effectiveMultiMax(state, node);
  }

  // 行囊按半格计：已装的（含门板）加本次勾选的。8 个半格 = 4 格，满 4 格才算装满。
  function bagUnits(node) {
    var selected = multiRun.selected.reduce(function (sum, id) {
      return sum + XB.core.optionUnits(multiOptionById(node, id) || {});
    }, 0);
    return XB.core.packUsage(state) + selected;
  }

  function bagIsFull(node) {
    return bagUnits(node) >= XB.core.packCapacity(state);
  }

  function renderMultiChoice(node) {
    historyPush({ t: "prompt", c: state.chapterId, n: node.id, k: "multi" });
    els.vnMultichoice.hidden = false;
    els.vnDialogue.hidden = true;
    els.vnToolbar.hidden = true;
    els.vnMultiPrompt.textContent = node.prompt || "";
    els.vnMultiPrompt.hidden = !node.prompt;
    els.vnMultiOptions.textContent = "";

    multiRun.node = node;
    multiRun.selected = [];
    multiRun.locked = false;

    (node.options || []).forEach(function (option, index) {
      if (option.flag && state.flags[option.flag] === true) multiRun.selected.push(option.id);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "xb-multi-option";
      button.dataset.action = "multi-toggle";
      button.dataset.multiId = option.id;
      button.setAttribute("role", "checkbox");
      button.setAttribute("aria-checked", "false");

      var mark = document.createElement("span");
      mark.className = "xb-multi-option__mark";
      mark.setAttribute("aria-hidden", "true");

      var body = document.createElement("span");
      body.className = "xb-multi-option__body";
      var label = document.createElement("span");
      label.className = "xb-multi-option__label";
      label.textContent = option.text;
      body.append(label);

      if (option.note) {
        var note = document.createElement("span");
        note.className = "xb-multi-option__note";
        note.textContent = option.note;
        body.append(note);
      }

      var key = document.createElement("span");
      key.className = "xb-multi-option__key";
      key.textContent = String(index + 1);
      key.setAttribute("aria-hidden", "true");

      button.append(key, mark, body);
      els.vnMultiOptions.append(button);
    });

    var max = multiMax(node);
    if (multiRun.selected.length > max) multiRun.selected = multiRun.selected.slice(0, max);
    updateMultiChoice();
  }

  function updateMultiChoice() {
    var node = multiRun.node;
    if (!node) return;
    var max = multiMax(node);
    var min = isFiniteNumber(node.min) ? node.min : 0;
    var full = multiRun.selected.length >= max;

    Array.prototype.forEach.call(els.vnMultiOptions.querySelectorAll(".xb-multi-option"), function (button) {
      var checked = multiRun.selected.indexOf(button.dataset.multiId) !== -1;
      button.classList.toggle("is-checked", checked);
      button.classList.toggle("is-locked", !checked && full && !multiRun.locked);
      button.classList.toggle("is-disabled", multiRun.locked && !checked);
      button.setAttribute("aria-checked", checked ? "true" : "false");
      button.disabled = multiRun.locked;
    });

    var count = multiRun.selected.length;
    var usedSlots = bagUnits(node) / 2;
    var slotText = (usedSlots % 1 === 0 ? String(usedSlots) : usedSlots.toFixed(1)) + "/4 格";
    if (multiRun.locked) {
      els.vnMultiStatus.textContent = "记下了。";
    } else if (node.min === node.max) {
      els.vnMultiStatus.textContent = count < min
        ? "已选 " + count + " 样，还差 " + (min - count) + " 样"
        : "已选 " + count + " 样，可以确认";
    } else {
      els.vnMultiStatus.textContent = "行囊 " + slotText + " · 已选 " + count + " 样" + (max ? "，最多 " + max + " 样" : "");
    }

    els.vnMultiConfirm.disabled = multiRun.locked || count < min;
    els.vnMultiConfirm.textContent = node.confirmLabel || "确认";
  }

  function toggleMultiChoice(id) {
    var node = multiRun.node;
    if (!node || multiRun.locked) return;
    var option = multiOptionById(node, id);
    if (!option) return;
    var at = multiRun.selected.indexOf(id);
    if (at !== -1) {
      multiRun.selected.splice(at, 1);
    } else if (multiRun.selected.length >= multiMax(node)) {
      els.vnMultiStatus.textContent = "最多 " + multiMax(node) + " 样。先拿下一件，再放这一件。";
      return;
    } else if (!XB.core.canAddMultiOption(state, option, multiRun.selected.map(function (itemId) {
      return multiOptionById(node, itemId);
    }).filter(Boolean))) {
      els.vnMultiStatus.textContent = "行囊放不下。先放下一件，再拿这一件。";
      return;
    } else {
      multiRun.selected.push(id);
    }
    updateMultiChoice();
  }

  function resolveMultiChoice() {
    var node = multiRun.node;
    if (!node || multiRun.locked || bagConfirmState.open) return;
    var min = isFiniteNumber(node.min) ? node.min : 0;
    if (multiRun.selected.length < min) {
      toast("还要再选 " + (min - multiRun.selected.length) + " 样");
      return;
    }
    // 四格没装满先问一句；「是」才落档，「否」退回多选，已选的物资原样留着。
    if (node.confirmWhenNotFull && !bagIsFull(node)) {
      openBagConfirm();
      return;
    }
    commitMultiChoice(node);
  }

  function commitMultiChoice(node) {
    if (!node || multiRun.locked) return;
    var result = XB.core.applyMultiChoice(state, node, multiRun.selected);
    if (!result) {
      toast("这一步没有记下来，请再选一次");
      return;
    }
    multiRun.locked = true;
    updateMultiChoice();
    historyPush({ t: "multi", c: state.chapterId, n: node.id, ids: result.selected.slice() });
    recordMultiAchievements(node, result.selected);
    XB.audio.cue("choice-select");
    debugExtra = "multi=" + result.selected.join(",");
    updateDebug();

    var settle = function onSettle() {
      if (!state || state.scene !== "vn") return;
      if (state.paused) {
        window.setTimeout(settle, 200);
        return;
      }
      hideMultiPanel();
      if (node.id === "p024" && state.flags.condition < 4) {
        openPackPanel("start", advanceVn);
        return;
      }
      advanceVn();
    };
    window.setTimeout(settle, 300);
  }

  function hideMultiPanel() {
    closeBagConfirm(true);
    els.vnMultichoice.hidden = true;
    multiRun.node = null;
    multiRun.selected = [];
    multiRun.locked = false;
  }

  function openBagConfirm() {
    if (bagConfirmState.open) return;
    bagConfirmState.open = true;
    bagConfirmState.previousFocus = document.activeElement;
    els.bagConfirmModal.hidden = false;
    // 默认落在「是」：点确认本来就是要走，弹窗只是提醒
    els.bagConfirmYes.focus();
    refreshAudioDuck();
  }

  function closeBagConfirm(keepFocus) {
    if (!bagConfirmState.open) return;
    bagConfirmState.open = false;
    els.bagConfirmModal.hidden = true;
    var previous = bagConfirmState.previousFocus;
    bagConfirmState.previousFocus = null;
    if (!keepFocus && previous && previous.focus && previous !== document.body) previous.focus();
    refreshAudioDuck();
  }

  // 「否」：关掉提示，多选原样留着，焦点回确认键，玩家可以接着补选。
  function cancelBagConfirm() {
    if (!bagConfirmState.open) return;
    closeBagConfirm(true);
    if (els.vnMultiConfirm && !els.vnMultiConfirm.disabled) els.vnMultiConfirm.focus();
  }

  function acceptBagConfirm() {
    if (!bagConfirmState.open) return;
    var node = multiRun.node;
    closeBagConfirm(true);
    if (!node || multiRun.locked) return;
    commitMultiChoice(node);
  }

  /* ---------------- 选择结算 ---------------- */

  // 两段多选的物品清单：顺序即结算页的显示顺序，与 story 里的选项一一对应。
  var PACK_ITEMS = [
    { flag: "item.medicine", text: "药" },
    { flag: "item.barley", text: "青稞" },
    { flag: "item.homepot", text: "铁锅" },
    { flag: "item.raincloth", text: "雨布" },
    { flag: "item.shoes", text: "布鞋" }
  ];
  var ABANDON_ITEMS = [
    { flag: "choice.xiangjiang.take.xray", text: "X 光机" },
    { flag: "choice.xiangjiang.take.press", text: "印刷机" },
    { flag: "choice.xiangjiang.take.files", text: "文件" },
    { flag: "choice.xiangjiang.take.medkit", text: "药箱" },
    { flag: "choice.xiangjiang.take.radio", text: "电台" },
    { flag: "choice.xiangjiang.take.silver", text: "银元" }
  ];

  function createContinueButton(kind) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "xb-btn xb-btn--sm " + kind;
    button.dataset.action = "continue-node";
    button.textContent = "继续";
    return button;
  }

  // 结算页只读旗标，不依赖上一段选择的运行时对象；刷新到结算节点也能重建。
  function collectItemLabels(defs, want) {
    var labels = [];
    defs.forEach(function (def) {
      if ((state.flags[def.flag] === true) === want) labels.push(def.text);
    });
    return labels;
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
    if (node.source === "zunyi") return buildZunyiCard(node);
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

    if (node.source === "items") {
      var hasDoor = state.flags["item.door"] === true;
      var packed = collectItemLabels(PACK_ITEMS, true);
      var leftAtHome = collectItemLabels(PACK_ITEMS, false);
      var used = XB.core.packUsage(state) / 2;
      var capacity = Math.max(PACK_SLOTS, used);
      var usedText = used % 1 === 0 ? String(used) : used.toFixed(1);
      view.stats = "行囊 " + usedText + "/" + capacity + " 格" + (hasDoor ? " · 门板占 2 格" : "");
      view.note = (node.note || "") + " 花名册和铅笔一直贴身带着。";
      view.lists = [
        {
          heading: "带走的",
          items: (hasDoor ? ["门板"] : []).concat(["花名册", "铅笔"], packed)
        },
        { heading: "留下的", items: leftAtHome }
      ];
      return view;
    }

    if (node.source === "abandon") {
      var taken = collectItemLabels(ABANDON_ITEMS, true);
      var leftOnShore = collectItemLabels(ABANDON_ITEMS, false);
      view.stats = "带上船 " + taken.length + " 样 · 留在岸上 " + leftOnShore.length + " 样";
      view.lists = [
        { heading: "带上船", items: taken },
        { heading: "留在岸上", items: leftOnShore }
      ];
      return view;
    }

    (node.lists || []).forEach(function (list) {
      if (!evalWhen(state, list.when)) return;
      view.lists.push({ heading: list.heading, items: (list.items || []).slice() });
    });
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
    // 结局回顾读的是已完结快照：不重建、不记名册、不覆盖存档。
    if (!endingReview.active) {
      if (!isFullEnding(state.ending)) state.ending = buildEnding(state);
      recordEndingPage();
      saveNow();
    }
    paintStage("wuqi_wall");
    els.endingTitle.textContent = storyEnding.title || "向北";
    els.endingDate.textContent = (storyEnding.date || "") + " · 吴起镇";
    els.endingLede.textContent = storyEnding.lede || "";
    var numberLabel = state.ending.routeLabel || "";
    var routeName = state.ending.routeTitle || "";
    var routeHeading = "";
    if (numberLabel === "旧档") {
      routeHeading = routeName && routeName !== numberLabel ? numberLabel + " · " + routeName : numberLabel;
    } else if (numberLabel) {
      routeHeading = "结局" + numberLabel + "/11" + (routeName ? "（" + routeName + "）" : "");
    } else {
      routeHeading = routeName;
    }
    var showRouteLede = numberLabel !== "旧档";
    els.endingRoute.textContent = routeHeading
      ? routeHeading + (showRouteLede && state.ending.routeLede ? " · " + state.ending.routeLede : "")
      : "";
    els.endingRoute.hidden = !routeHeading;

    els.endingNames.textContent = "";
    if (!state.ending.names.length) {
      var noNames = document.createElement("li");
      noNames.className = "xb-ending__name is-missed";
      noNames.textContent = "名册没有翻到吴起。";
      els.endingNames.append(noNames);
    }
    state.ending.names.forEach(function (entry) {
      var row = document.createElement("li");
      row.className = "xb-ending__name is-" + entry.status;
      var name = document.createElement("span");
      name.className = "xb-ending__name-text";
      name.textContent = entry.name;
      var status = document.createElement("span");
      status.className = "xb-ending__name-status";
      var byName = entry.answeredBy === "dongsheng" ? "冬生" : entry.answeredBy === "you" ? "你" : entry.answeredBy || "";
      status.textContent = byName ? byName + " 代答" : (ENDING_STATUS_TEXT[entry.status] || entry.status);
      row.append(name, status);
      els.endingNames.append(row);
    });

    var statsData = state.ending.stats;
    els.endingStats.textContent =
      "全连：出发 " + statsData.companyStart + " 人，到吴起 " + statsData.companyEnd + " 人（虚构连队，非史料统计）\n" +
      "中央红军：出发 " + statsData.redStart.toLocaleString("en-US") + " 余人，到陕北 " + statsData.redEnd.toLocaleString("en-US") + " 余人（史实）";

    renderEndingAchievements();

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
    els.endingBranch.hidden = endingReview.active;
    els.endingCodex.hidden = endingReview.active;
    els.endingHome.textContent = endingReview.active ? "返回存档" : "回到标题";
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
      interactRun.entries = XB.core.resolveRollCall(state, node.coda === true).map(function (entry) {
        return {
          id: entry.id,
          name: entry.name,
          base: entry.status || "self",
          status: entry.status || "self",
          answeredBy: entry.answeredBy || "",
          done: false
        };
      });
      els.interactAnswer.textContent = "替他答到";
      els.interactAnswer.hidden = true;
      renderRollcallChips();
      nextRollcall();
    } else if (node.mode === "namepick") {
      historyPush({ t: "prompt", c: state.chapterId, n: node.id, k: "namepick" });
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
    if (entry.answeredBy) {
      interactRun.phase = "auto";
      interactRun.phaseRemaining = 700;
      els.interactStatus.textContent = "冬生替他答";
      els.interactAnswer.hidden = true;
      announceInteract("念到 " + entry.name + "，冬生替他答");
    } else if (entry.base === "remote" || entry.base === "self") {
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
    var coda = state.chapterId === "coda";
    var names = interactRun.entries.map(function (entry) {
      var row = { id: entry.id, name: entry.name, status: entry.status };
      if (entry.answeredBy) row.answeredBy = entry.answeredBy;
      else if (coda && entry.status === "player") row.answeredBy = "dongsheng";
      return row;
    });
    var answered = names.filter(function (entry) { return entry.status === "player"; }).length;
    var missed = names.filter(function (entry) { return entry.status === "missed"; }).length;
    state.ending = { names: names, answered: answered, missed: missed };
    setFlag(state, "memory.rollcall_missed_any", missed > 0);
    lastInteractResult = null;
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
    setFlag(state, "memory.namepick_done", true);
    if (nameId === "zhang") setFlag(state, "memory.zhang", true);
    recordAchievement("j018-done", false);
    lastInteractResult = { count: 1, name: entry.name, id: entry.id };
    historyPush({ t: "namepick", c: state.chapterId, n: interactRun.node.id, nameId: nameId, timedOut: false });
    announceInteract("记下 " + entry.name);
    stopInteract();
    advanceVn();
  }

  function skipNamepick(timedOut) {
    if (!interactRun.active || interactRun.mode !== "namepick" || interactRun.finished) return;
    interactRun.finished = true;
    setFlag(state, "memory.namepick_done", true);
    recordAchievement("j018-skip", timedOut === true);
    lastInteractResult = { count: 0, name: "", id: "" };
    historyPush({ t: "namepick", c: state.chapterId, n: interactRun.node.id, nameId: "", timedOut: timedOut === true });
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
            entry.status = entry.answeredBy ? "player" : entry.base;
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
        skipNamepick(true);
        return;
      }
    }
    interactRun.rafId = requestAnimationFrame(stepInteract);
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
      // 结算兜底：即时解锁写失败或旧档缺记录时，按本局 choices/记名补写。
      recordRunAchievements(state.ending);
      // 分支收纳需要这一局的选择日志；必须在主档清空 choices 之前抄一份。
      recordBranchRun(state.ending);
      // 结局只读快照已含全部决定；选择日志不再参与任何界面，清空以免整档超过 4096B。
      state.choices = [];
      state.scene = "ending";
      state.nodeId = null;
      saveNow();
      render();
      return;
    }

    if (!nextId || nextId === "map") {
      state.nodeId = null;
      go("map");
      saveChapterProgress();
      return;
    }

    var chapter = chapterById(nextId);
    if (!chapter || !chapter.playable) {
      state.nodeId = null;
      go("map");
      saveChapterProgress();
      return;
    }
    // 隐藏章（空页 coda）不进地图、不弹解锁；玩家从草地直接走进去。
    if (chapter.hidden !== true && state.unlockedChapters.indexOf(nextId) === -1) {
      state.unlockedChapters.push(nextId);
      toast("「" + chapter.title + "」已解锁");
    }
    if (nextId === "wuqi") {
      WUQI_MEMORY.forEach(function (key) {
        if (state.flags[key] !== true) setFlag(state, key, true);
      });
    }
    if (startChapter(state, nextId)) {
      render();
      saveChapterProgress();
      chapterCapture(savesStore.activeId, nextId);
      return;
    }
    state.nodeId = null;
    go("map");
    saveChapterProgress();
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
    titleCardState.timer = 0; // 不自动关：章首卡等玩家点一下 / 按回车再走
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
    drainStatusEvents();
    flushStatusNotice();
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

  /* ---------------- 名册回廊（标题页入口，只读） ---------------- */

  function renderRosterGallery() {
    var stored = readRosterPages();
    var pages = stored.pages;
    els.rosterGalleryCount.textContent = pages.length
      ? pages.length + " 页名册 · 每页记一局"
      : "还没有名册。走完一局，这里会记下应到的人。";
    els.rosterGalleryPages.textContent = "";
    pages.slice().reverse().forEach(function (page) {
      var section = document.createElement("section");
      section.className = "xb-roster-page";
      var title = document.createElement("h3");
      title.className = "xb-roster-page__title";
      title.textContent = page.title || page.route;
      var meta = document.createElement("p");
      meta.className = "xb-roster-page__meta";
      meta.textContent = page.at + " · 到吴起 " + page.companyEnd + " 人";
      if (!page.names.length) {
        var empty = document.createElement("p");
        empty.className = "xb-roster-page__note";
        empty.textContent = "名册没有翻到吴起。";
        section.append(title, meta, empty);
        els.rosterGalleryPages.append(section);
        return;
      }
      var list = document.createElement("ol");
      list.className = "xb-roster-page__names";
      page.names.forEach(function (entry) {
        var li = document.createElement("li");
        li.className = "xb-roster-page__name is-" + entry.status;
        var name = document.createElement("span");
        name.className = "xb-roster-page__name-text";
        name.textContent = entry.name;
        var mark = document.createElement("span");
        mark.className = "xb-roster-page__mark";
        mark.textContent = entry.answeredBy
          ? (entry.answeredBy === "dongsheng" ? "冬生代答" : "你代答")
          : entry.status === "missed" ? "未应" : entry.status === "remote" ? "别连" : "到";
        li.append(name, mark);
        list.append(li);
      });
      section.append(title, meta, list);
      if (page.note) {
        var note = document.createElement("p");
        note.className = "xb-roster-page__note";
        note.textContent = page.note;
        section.append(note);
      }
      els.rosterGalleryPages.append(section);
    });
  }

  function openRosterGallery() {
    if (rosterGalleryState.open) return;
    rosterGalleryState.open = true;
    rosterGalleryState.previousFocus = document.activeElement;
    renderRosterGallery();
    els.rosterGallery.hidden = false;
    els.rosterGallery.scrollTop = 0;
    els.rosterGalleryClose.focus();
  }

  function closeRosterGallery() {
    if (!rosterGalleryState.open) return;
    rosterGalleryState.open = false;
    els.rosterGallery.hidden = true;
    var previous = rosterGalleryState.previousFocus;
    rosterGalleryState.previousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus();
  }

  /* ---------------- 剧情分支收纳（只读，v1.5） ---------------- */

  var BRANCH_ROUTE_GROUPS = {
    door: ["door_excellent", "door_grass_one", "door_carry_two", "door_grass_many", "door_others"],
    nodoor: ["no_door_zero", "no_door_one", "no_door_two", "no_door_three", "no_door_three_excellent"],
    bad: ["bad_end"]
  };

  function branchMapData() {
    return (XB.story && XB.story.branchMap) || null;
  }

  function branchChapterIds() {
    var map = branchMapData();
    var authored = map && map.chapters ? map.chapters : {};
    return ((XB.story && XB.story.chapters) || []).map(function (chapter) {
      return chapter.id;
    }).filter(function (id) {
      return !!authored[id];
    });
  }

  function emptyBranchStore() {
    return { version: 1, updatedAt: 0, runs: [], endings: {}, chapters: {}, options: {} };
  }

  function branchMeta(meta, withCount) {
    if (!isPlainObject(meta)) return null;
    var clean = {
      at: isFiniteNumber(meta.at) ? Math.round(meta.at) : 0,
      runId: typeof meta.runId === "string" ? meta.runId : ""
    };
    if (withCount) clean.count = isFiniteNumber(meta.count) ? Math.max(1, Math.round(meta.count)) : 1;
    return clean;
  }

  function branchChoiceRecord(choice) {
    if (!isPlainObject(choice)) return null;
    if (typeof choice.nodeId !== "string" || !choice.nodeId) return null;
    var clean = {
      chapter: typeof choice.chapter === "string" ? choice.chapter : "",
      nodeId: choice.nodeId,
      option: typeof choice.option === "string" ? choice.option : "",
      text: typeof choice.text === "string" ? choice.text : "",
      timedOut: choice.timedOut === true
    };
    return clean;
  }

  function branchSummary(raw) {
    var value = isPlainObject(raw) ? raw : {};
    return {
      hadDoor: value.hadDoor === true,
      doorOutcome: DOOR_OUTCOMES.indexOf(value.doorOutcome) !== -1 ? value.doorOutcome : "none",
      rescues: isFiniteNumber(value.rescues) ? Math.max(0, Math.min(3, Math.round(value.rescues))) : 0,
      condition: isFiniteNumber(value.condition) ? Math.max(0, Math.min(4, Math.round(value.condition))) : 3,
      playerDead: value.playerDead === true,
      linDead: value.linDead === true,
      answered: isFiniteNumber(value.answered) ? Math.max(0, Math.round(value.answered)) : 0,
      missed: isFiniteNumber(value.missed) ? Math.max(0, Math.round(value.missed)) : 0,
      names: isFiniteNumber(value.names) ? Math.max(0, Math.round(value.names)) : 0,
      companyEnd: isFiniteNumber(value.companyEnd) ? Math.max(0, Math.round(value.companyEnd)) : 19
    };
  }

  function normalizeBranchRun(raw) {
    if (!isPlainObject(raw)) return null;
    if (typeof raw.route !== "string" || ROUTE_IDS.indexOf(raw.route) === -1 || raw.route === "legacy") return null;
    var def = ROUTE_DEFS[raw.route] || {};
    var chapters = Array.isArray(raw.chapters) ? raw.chapters.filter(function (id) {
      return branchChapterIds().indexOf(id) !== -1;
    }) : [];
    var choices = Array.isArray(raw.choices) ? raw.choices.map(branchChoiceRecord).filter(Boolean).slice(-64) : [];
    var events = isPlainObject(raw.events) ? raw.events : {};
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : "r-" + (isFiniteNumber(raw.at) ? raw.at : 0),
      at: isFiniteNumber(raw.at) ? Math.round(raw.at) : 0,
      route: raw.route,
      routeIndex: isFiniteNumber(raw.routeIndex) ? Math.round(raw.routeIndex) : (def.index || 0),
      routeTitle: typeof raw.routeTitle === "string" ? raw.routeTitle : (def.title || ""),
      routeLede: typeof raw.routeLede === "string" ? raw.routeLede : (def.lede || ""),
      chapters: chapters,
      choices: choices,
      summary: branchSummary(raw.summary),
      events: { zhang: events.zhang === true, rollcall: events.rollcall === true }
    };
  }

  function normalizeBranchStore(raw) {
    if (!isPlainObject(raw) || raw.version !== 1) return null;
    var store = emptyBranchStore();
    store.updatedAt = isFiniteNumber(raw.updatedAt) ? Math.round(raw.updatedAt) : 0;
    if (Array.isArray(raw.runs)) {
      store.runs = raw.runs.map(normalizeBranchRun).filter(Boolean).slice(-BRANCH_MAX_RUNS);
    }
    if (isPlainObject(raw.endings)) {
      Object.keys(raw.endings).forEach(function (route) {
        if (ROUTE_IDS.indexOf(route) === -1 || route === "legacy") return;
        var meta = branchMeta(raw.endings[route], true);
        if (meta) store.endings[route] = meta;
      });
    }
    if (isPlainObject(raw.chapters)) {
      Object.keys(raw.chapters).forEach(function (chapterId) {
        if (branchChapterIds().indexOf(chapterId) === -1) return;
        var meta = branchMeta(raw.chapters[chapterId], false);
        if (meta) store.chapters[chapterId] = meta;
      });
    }
    if (isPlainObject(raw.options)) {
      Object.keys(raw.options).forEach(function (nodeId) {
        if (nodeId === "__proto__" || nodeId === "constructor" || nodeId === "prototype") return;
        if (branchDecisionForNode(nodeId) === null) return;
        var bag = raw.options[nodeId];
        if (!isPlainObject(bag)) return;
        var cleanBag = {};
        Object.keys(bag).forEach(function (key) {
          if (key === "__proto__" || key === "constructor" || key === "prototype") return;
          var meta = branchMeta(bag[key], false);
          if (meta) cleanBag[key] = meta;
        });
        if (Object.keys(cleanBag).length) store.options[nodeId] = cleanBag;
      });
    }
    return store;
  }

  function backupBranchStore(raw) {
    try {
      window.localStorage.setItem(BRANCH_KEY + ".bad", raw);
      window.localStorage.removeItem(BRANCH_KEY);
    } catch (err) {
      console.error("[XB] 备份剧情分支失败：" + err.message);
    }
  }

  function readBranchStore() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(BRANCH_KEY);
    } catch (err) {
      console.error("[XB] 读取剧情分支失败：" + err.message);
      branchStorageOk = false;
      return { data: branchMemory || emptyBranchStore(), ok: false };
    }
    if (raw === null) return { data: branchMemory || emptyBranchStore(), ok: true };
    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn("[XB] 剧情分支不是合法 JSON：" + err.message);
      backupBranchStore(raw);
      return { data: emptyBranchStore(), ok: false };
    }
    var store = normalizeBranchStore(parsed);
    if (!store) {
      console.warn("[XB] 剧情分支版本或结构不符");
      backupBranchStore(raw);
      return { data: emptyBranchStore(), ok: false };
    }
    branchMemory = store;
    return { data: store, ok: true };
  }

  function writeBranchStore(store) {
    store.updatedAt = Date.now();
    branchMemory = store;
    try {
      window.localStorage.setItem(BRANCH_KEY, JSON.stringify(store));
      branchStorageOk = true;
      return true;
    } catch (err) {
      console.warn("[XB] 写入剧情分支失败：" + err.message);
      branchStorageOk = false;
      if (!branchStorageWarned) {
        branchStorageWarned = true;
        toast("本机无法保存剧情分支，本次回看只在本次有效");
      }
      return false;
    }
  }

  function branchStatementNode(nodeId) {
    var chapters = (XB.story && XB.story.chapters) || [];
    for (var i = 0; i < chapters.length; i += 1) {
      var nodes = chapters[i].nodes || [];
      for (var j = 0; j < nodes.length; j += 1) {
        if (nodes[j].id === nodeId) return { chapter: chapters[i], node: nodes[j] };
      }
    }
    return null;
  }

  function branchDecisionForNode(nodeId) {
    var map = branchMapData();
    if (!map) return null;
    var ids = Object.keys(map.decisions || {});
    for (var i = 0; i < ids.length; i += 1) {
      var decision = map.decisions[ids[i]];
      if (decision.nodes && decision.nodes.indexOf(nodeId) !== -1) return ids[i];
    }
    return null;
  }

  function branchDecisionChapter(decisionId) {
    var map = branchMapData();
    if (!map) return null;
    var ids = Object.keys(map.chapters || {});
    for (var i = 0; i < ids.length; i += 1) {
      var chapter = map.chapters[ids[i]];
      if (chapter.decisions && chapter.decisions.indexOf(decisionId) !== -1) return ids[i];
    }
    return null;
  }

  function branchDecisionPassed(decision, run, chapterId) {
    if (!run || !decision || run.chapters.indexOf(chapterId) === -1) return false;
    if (!run.live) return true;
    var current = chapterById(state.chapterId);
    var target = chapterById(chapterId);
    if (!current || !target || !state.nodeId) return false;
    if (current.order !== target.order) return current.order > target.order;
    var here = XB.core.locate(chapterId, state.nodeId);
    if (!here) return false;
    var targetIndex = null;
    decision.nodes.forEach(function (nodeId) {
      var found = XB.core.locate(chapterId, nodeId);
      if (found && (targetIndex === null || found.index < targetIndex)) targetIndex = found.index;
    });
    return targetIndex !== null && here.index > targetIndex;
  }

  function branchDecisionCurrent(decision, run, chapterId) {
    if (!run || !run.live || !decision || !state.nodeId || state.chapterId !== chapterId) return false;
    var here = XB.core.locate(chapterId, state.nodeId);
    if (!here) return false;
    var targetIndex = null;
    decision.nodes.forEach(function (nodeId) {
      var found = XB.core.locate(chapterId, nodeId);
      if (found && (targetIndex === null || found.index < targetIndex)) targetIndex = found.index;
    });
    return targetIndex !== null && here.index === targetIndex;
  }

  function branchChoiceFor(run, decision) {
    if (!run || !decision || !Array.isArray(run.choices)) return null;
    for (var i = run.choices.length - 1; i >= 0; i -= 1) {
      if (decision.nodes.indexOf(run.choices[i].nodeId) !== -1) return run.choices[i];
    }
    return null;
  }

  function branchEventDone(decisionId, run) {
    if (!run || !run.events) return false;
    if (decisionId === "j018") return run.events.zhang === true;
    if (decisionId === "w026") return run.events.rollcall === true;
    return false;
  }

  function branchRunForChapter(chapterId) {
    if (!branchState.run) {
      if (branchState.source === "title") {
        var store = branchState.store || emptyBranchStore();
        for (var i = store.runs.length - 1; i >= 0; i -= 1) {
          if (store.runs[i].chapters.indexOf(chapterId) !== -1) return store.runs[i];
        }
      }
      return null;
    }
    if (branchState.run.chapters.indexOf(chapterId) !== -1) return branchState.run;
    return null;
  }

  function branchChapterUnlocked(chapterId) {
    if (branchState.source !== "title") {
      return !!(branchState.run && branchState.run.chapters.indexOf(chapterId) !== -1);
    }
    var store = branchState.store || emptyBranchStore();
    return !!store.chapters[chapterId];
  }

  function branchLatestRunForRoute(store, route) {
    var meta = store.endings[route];
    if (meta && meta.runId) {
      for (var i = store.runs.length - 1; i >= 0; i -= 1) {
        if (store.runs[i].id === meta.runId) return store.runs[i];
      }
    }
    for (var j = store.runs.length - 1; j >= 0; j -= 1) {
      if (store.runs[j].route === route) return store.runs[j];
    }
    return null;
  }

  function branchDoorLabel(summary) {
    var s = branchSummary(summary);
    if (!s.hadDoor) return "空手";
    if (s.doorOutcome === "wuqi") return "门板留在吴起";
    if (s.doorOutcome === "bridge") return "门板留在桥上";
    if (s.doorOutcome === "grass") return "门板留在草地";
    if (s.doorOutcome === "carried") return "门板带回于都";
    if (s.doorOutcome === "others") return "门板由别人带出";
    return "门板没带到终点";
  }

  function branchRunSummaryFromState() {
    var flags = (state && state.flags) || {};
    var ending = (state && state.ending) || null;
    return {
      hadDoor: flags["had.door"] === true,
      doorOutcome: flags.doorOutcome || "none",
      rescues: isFiniteNumber(flags.rescues) ? flags.rescues : 0,
      condition: isFiniteNumber(flags.condition) ? flags.condition : 3,
      playerDead: flags["fate.player.dead"] === true,
      linDead: flags["fate.lin.dead"] === true,
      answered: ending ? ending.answered : 0,
      missed: ending ? ending.missed : 0,
      names: ending && Array.isArray(ending.names) ? ending.names.length : 0,
      companyEnd: ending && ending.stats ? ending.stats.companyEnd : 19
    };
  }

  function buildLiveBranchRun() {
    if (!state || !state.chapterId) return null;
    var chapters = (state.unlockedChapters || []).filter(function (id) {
      return branchChapterIds().indexOf(id) !== -1;
    });
    if (chapters.indexOf(state.chapterId) === -1 && branchChapterIds().indexOf(state.chapterId) !== -1) {
      chapters.push(state.chapterId);
    }
    var route = routeOf(state.flags);
    var def = ROUTE_DEFS[route] || {};
    return {
      id: "live",
      live: true,
      at: Date.now(),
      route: route,
      routeIndex: def.index || 0,
      routeTitle: def.title || "",
      routeLede: def.lede || "",
      chapters: chapters,
      choices: (state.choices || []).map(function (choice) {
        return branchChoiceRecord(choice);
      }).filter(Boolean),
      summary: branchRunSummaryFromState(),
      events: {
        zhang: state.flags["memory.zhang"] === true,
        rollcall: !!(state.ending && state.ending.names && state.ending.names.length)
      }
    };
  }

  function branchFallbackRunFromEnding(ending) {
    if (!ending) return null;
    var def = ROUTE_DEFS[ending.route] || {};
    return {
      id: "ending-fallback",
      live: false,
      at: Date.now(),
      route: ending.route,
      routeIndex: ending.routeIndex || def.index || 0,
      routeTitle: ending.routeTitle || def.title || "",
      routeLede: ending.routeLede || def.lede || "",
      chapters: (state.unlockedChapters || []).filter(function (id) {
        return branchChapterIds().indexOf(id) !== -1;
      }),
      choices: [],
      summary: branchRunSummaryFromState(),
      events: {
        zhang: state.flags["memory.zhang"] === true,
        rollcall: !!(ending.names && ending.names.length)
      }
    };
  }

  function branchCurrentRun(store) {
    if (branchState.source === "pause") return buildLiveBranchRun();
    if (branchState.source !== "ending") return null;
    if (branchLastRun && (!state.ending || branchLastRun.route === state.ending.route)) return branchLastRun;
    if (state.ending) {
      var found = branchLatestRunForRoute(store, state.ending.route);
      if (found) return found;
      return branchFallbackRunFromEnding(state.ending);
    }
    return null;
  }

  function branchMultiKeys(choice, decision, chapterId) {
    var found = branchStatementNode(choice.nodeId) || XB.core.locate(chapterId, choice.nodeId);
    var node = found && found.node ? found.node : null;
    var labels = String(choice.text || "").split("、");
    var keys = [];
    if (!node) return keys;
    (node.options || []).forEach(function (option) {
      var id = option.id || option.key;
      if (id && labels.indexOf(option.text) !== -1) keys.push(id);
    });
    return keys;
  }

  function branchSemanticKey(decision, nodeId, key) {
    var map = decision.optionKeys && decision.optionKeys[nodeId];
    if (map && map[key]) return map[key];
    return key;
  }

  function branchChoiceView(decision, choice, chapterId) {
    var found = branchStatementNode(choice.nodeId);
    var node = found ? found.node : null;
    var label = choice.text || "";
    if (node && choice.option !== "MULTI") {
      (node.options || []).forEach(function (option) {
        if ((option.key || option.id) === choice.option) label = option.text;
      });
    }
    var lines = [];
    if (choice.option === "MULTI") {
      var keys = branchMultiKeys(choice, decision, chapterId);
      keys.forEach(function (key) {
        if (decision.options && decision.options[key]) lines.push(decision.options[key]);
      });
      if (!lines.length && choice.text) lines.push("你带走了" + choice.text + "。");
    } else {
      var semantic = branchSemanticKey(decision, choice.nodeId, choice.option);
      if (decision.options && decision.options[semantic]) lines.push(decision.options[semantic]);
    }
    return { label: label, lines: lines, multi: choice.option === "MULTI" };
  }

  function branchFormatChoice(decision, choice, chapterId) {
    var view = branchChoiceView(decision, choice, chapterId);
    var prefix = choice.timedOut
      ? "时间到了，默认项「" + view.label + "」替你做了决定，因此——"
      : "在这个「" + decision.title + "」的选择中，你选择了「" + view.label + "」，因此——";
    return { prefix: prefix, lines: view.lines, multi: view.multi };
  }

  function recordBranchRun(ending) {
    if (!ending || ROUTE_IDS.indexOf(ending.route) === -1 || ending.route === "legacy") return null;
    if (branchRecordedEnding === ending) return branchLastRun;
    var store = readBranchStore().data;
    var now = Date.now();
    var chapters = (state.unlockedChapters || []).filter(function (id) {
      return branchChapterIds().indexOf(id) !== -1;
    });
    if (state.chapterId && branchChapterIds().indexOf(state.chapterId) !== -1 && chapters.indexOf(state.chapterId) === -1) {
      chapters.push(state.chapterId);
    }
    var run = {
      id: "r-" + now.toString(36) + "-" + Math.floor(Math.random() * 1296).toString(36),
      at: now,
      route: ending.route,
      routeIndex: ending.routeIndex,
      routeTitle: ending.routeTitle,
      routeLede: ending.routeLede,
      chapters: chapters,
      choices: (state.choices || []).map(branchChoiceRecord).filter(Boolean),
      summary: branchRunSummaryFromState(),
      events: {
        zhang: state.flags["memory.zhang"] === true,
        rollcall: !!(ending.names && ending.names.length)
      }
    };
    store.runs.push(run);
    if (store.runs.length > BRANCH_MAX_RUNS) store.runs = store.runs.slice(-BRANCH_MAX_RUNS);
    var meta = store.endings[ending.route] || { at: now, runId: run.id, count: 0 };
    meta.at = now;
    meta.runId = run.id;
    meta.count = (meta.count || 0) + 1;
    store.endings[ending.route] = meta;
    chapters.forEach(function (chapterId) {
      if (!store.chapters[chapterId]) store.chapters[chapterId] = { at: now, runId: run.id };
    });
    run.choices.forEach(function (choice) {
      var decisionId = branchDecisionForNode(choice.nodeId);
      if (!decisionId) return;
      var keys = [];
      if (choice.option === "MULTI") keys = branchMultiKeys(choice, branchMapData().decisions[decisionId], choice.chapter);
      else keys = [choice.option];
      if (!store.options[choice.nodeId]) store.options[choice.nodeId] = {};
      keys.forEach(function (key) {
        if (!key) return;
        store.options[choice.nodeId][key] = { at: now, runId: run.id };
      });
    });
    writeBranchStore(store);
    branchLastRun = run;
    branchRecordedEnding = ending;
    return run;
  }

  function branchElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function branchChapterStatus(chapterId) {
    var currentChapter = branchState.source === "pause" && state ? state.chapterId : "";
    var inRun = !!(branchState.run && branchState.run.chapters.indexOf(chapterId) !== -1);
    var current = currentChapter === chapterId;
    if (branchState.source === "title") {
      var store = branchState.store || emptyBranchStore();
      return { unlocked: !!store.chapters[chapterId], current: false, thisRun: false };
    }
    return { unlocked: inRun, current: current, thisRun: inRun };
  }

  function renderBranchMap() {
    var store = readBranchStore().data;
    branchState.store = store;
    branchState.run = branchCurrentRun(store);
    branchState.currentRoute = branchState.source === "ending" && state.ending ? state.ending.route : null;

    var unlockedEndings = Object.keys(store.endings).filter(function (route) {
      return ROUTE_IDS.indexOf(route) !== -1 && route !== "legacy";
    }).length;
    els.branchCount.textContent = "已抵达 " + unlockedEndings + " / 11 个结局";

    els.branchChapters.textContent = "";
    branchChapterIds().forEach(function (chapterId, index) {
      var chapter = chapterById(chapterId);
      if (!chapter) return;
      var map = branchMapData();
      var meta = map && map.chapters ? map.chapters[chapter.id] : null;
      var status = branchChapterStatus(chapter.id);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "xb-branch-chapter" +
        (status.unlocked ? "" : " is-locked") +
        (status.current ? " is-current" : "") +
        (status.thisRun && !status.current ? " is-this-run" : "");
      card.dataset.action = "branch-chapter";
      card.dataset.chapter = chapter.id;
      card.setAttribute("aria-label", chapter.title + (status.current ? "，本次所在" : status.unlocked ? "，已走过" : "，尚未走到") + "，点开看本章抉择");
      if (meta && meta.image) {
        var image = document.createElement("img");
        image.src = meta.image;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        card.append(image);
      }
      card.append(branchElement("span", "xb-branch-chapter__index", ("0" + (index + 1)).slice(-2)));
      card.append(branchElement("span", "xb-branch-chapter__title", chapter.short || chapter.title));
      card.append(branchElement("span", "xb-branch-chapter__state",
        status.current ? "本次" : status.unlocked ? "走过" : "未"));
      els.branchChapters.append(card);
    });

    renderBranchLive(unlockedEndings);
    renderBranchEndings(store);
  }

  function renderBranchLive(unlockedEndings) {
    if (branchState.source === "title") {
      var store = branchState.store || emptyBranchStore();
      var chapters = Object.keys(store.chapters).filter(function (id) {
        return branchChapterIds().indexOf(id) !== -1;
      }).length;
      els.branchLive.textContent = chapters
        ? "已走过 " + chapters + " 段 · 已抵达 " + unlockedEndings + " / 11 个结局。清档不会清掉这里。"
        : "还没有走过一段。开始向北，第一处分岔在序章。";
      return;
    }
    var run = branchState.run;
    if (!run) {
      els.branchLive.textContent = "这一局还没有留下记录。";
      return;
    }
    var currentChapter = branchState.source === "pause" && state ? chapterById(state.chapterId) : null;
    var summary = run.summary;
    var line = currentChapter ? "现在走到：" + currentChapter.title + "。" : "这一局走到了终点。";
    line += " " + branchDoorLabel(summary);
    line += " · 已救 " + summary.rescues + " 人";
    line += " · 状态 " + XB.core.playerStatusLabel(summary.condition);
    line += currentChapter ? "。后面的路仍在雾里。" : "。";
    els.branchLive.textContent = line;
  }

  function renderBranchEndings(store) {
    [["door", els.branchEndingsDoor], ["nodoor", els.branchEndingsNodoor], ["bad", els.branchEndingsBad]].forEach(function (pair) {
      var container = pair[1];
      container.textContent = "";
      BRANCH_ROUTE_GROUPS[pair[0]].forEach(function (route) {
        var def = ROUTE_DEFS[route] || {};
        var unlocked = !!store.endings[route];
        var run = unlocked ? branchLatestRunForRoute(store, route) : null;
        var title = unlocked ? (run && run.routeTitle ? run.routeTitle : def.title) : "尚未抵达";
        var lede = unlocked ? (run && run.routeLede ? run.routeLede : def.lede) : "未解锁";
        var button = document.createElement("button");
        button.type = "button";
        button.className = "xb-branch-ending " +
          (unlocked ? "is-unlocked" : "is-locked") +
          (branchState.currentRoute === route ? " is-current" : "");
        button.dataset.action = "branch-route";
        button.dataset.route = route;
        button.setAttribute("aria-label", unlocked
          ? "结局 " + def.index + "，已抵达，" + title + "，点开查看"
          : "结局 " + def.index + "，未解锁，点开查看提示");
        button.append(branchElement("span", "xb-branch-ending__num", def.index + " / 11"));
        button.append(branchElement("span", "xb-branch-ending__title", title));
        button.append(branchElement("span", "xb-branch-ending__lede", lede));
        container.append(button);
      });
    });
  }

  function openBranch(source) {
    if (branchState.open) return;
    var store = readBranchStore().data;
    branchState.store = store;
    branchState.open = true;
    branchState.source = source || "title";
    branchState.previousFocus = document.activeElement;
    branchState.detailKind = null;
    branchState.detailId = null;
    branchState.currentRoute = source === "ending" && state.ending ? state.ending.route : null;
    branchState.run = branchCurrentRun(store);
    renderBranchMap();
    XB.audio.cue("codex");
    refreshAudioDuck();
    els.branchMap.hidden = false;
    els.branchClose.focus();
  }

  function closeBranch() {
    if (!branchState.open) return;
    closeBranchDetail();
    branchState.open = false;
    branchState.detailKind = null;
    branchState.detailId = null;
    els.branchMap.hidden = true;
    refreshAudioDuck();
    var previous = branchState.previousFocus;
    branchState.previousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus();
  }

  function openBranchDetail(kind, id, trigger) {
    if (!branchState.open) return;
    branchState.detailKind = kind;
    branchState.detailId = id;
    branchState.detailPreviousFocus = trigger || document.activeElement;
    branchState.run = branchState.run || branchCurrentRun(branchState.store || emptyBranchStore());
    renderBranchDetail();
    els.branchDetail.hidden = false;
    els.branchDetailClose.focus();
  }

  function closeBranchDetail() {
    if (!branchState.detailKind) return;
    branchState.detailKind = null;
    branchState.detailId = null;
    els.branchDetail.hidden = true;
    var previous = branchState.detailPreviousFocus;
    branchState.detailPreviousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus();
  }

  function renderBranchDetail() {
    var kind = branchState.detailKind;
    var id = branchState.detailId;
    els.branchDetailBody.textContent = "";
    els.branchDetailBody.scrollTop = 0;
    els.branchDetailActions.textContent = "";
    els.branchDetailActions.hidden = kind !== "chapter";
    if (kind === "chapter") renderBranchChapterDetail(id);
    else if (kind === "route") renderBranchRouteDetail(id);
  }

  function renderBranchChapterStart(chapterId) {
    var availability = chapterReplayAvailability(chapterId);
    var wrap = branchElement("div", "xb-branch-start");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "xb-btn xb-btn--primary xb-branch-start__button";
    button.dataset.action = "branch-start";
    button.dataset.chapter = chapterId;
    button.setAttribute("aria-disabled", availability.allowed ? "false" : "true");
    if (!availability.allowed) button.classList.add("is-unavailable");
    button.textContent = "从此开始";
    var hint = branchElement("p", "xb-branch-start__hint",
      availability.reason || "有 " + availability.sources + " 条已完结路线可作这一章的前情。");
    wrap.append(button, hint);
    els.branchDetailActions.append(wrap);
  }

  function renderBranchChapterDetail(chapterId) {
    var chapter = chapterById(chapterId);
    var map = branchMapData();
    var meta = map && map.chapters ? map.chapters[chapterId] : null;
    if (!chapter || !meta) return;
    var decisions = meta.decisions || [];
    els.branchDetailKicker.textContent = "剧情分支 · 章节";
    els.branchDetailTitle.textContent = chapter.title;
    els.branchDetailSub.textContent = meta.intro + " 本章 " + decisions.length + " 个抉择。";
    var run = branchRunForChapter(chapterId);
    var unlocked = branchChapterUnlocked(chapterId);
    if (!unlocked) {
      var note = branchElement("p", "xb-branch-node__empty", "这一章还在雾里。下面的节点尚未走到。");
      els.branchDetailBody.append(note);
    }
    decisions.forEach(function (decisionId, index) {
      var decision = map.decisions[decisionId];
      if (!decision) return;
      var choice = branchChoiceFor(run, decision);
      var passed = branchDecisionPassed(decision, run, chapterId);
      var current = branchDecisionCurrent(decision, run, chapterId);
      var eventDone = decision.kind === "event" ? branchEventDone(decisionId, run) : false;
      var status = choice || eventDone ? "done" : current ? "current" : passed ? "skipped" : "future";
      var row = document.createElement("section");
      row.className = "xb-branch-node " + (status === "done" ? "is-done" : status === "future" ? "is-locked" : "");
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "xb-branch-node__toggle";
      toggle.dataset.action = "branch-node";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "branch-node-body-" + chapterId + "-" + decisionId);
      toggle.append(branchElement("span", "xb-branch-node__index", ("0" + (index + 1)).slice(-2)));
      toggle.append(branchElement("span", "xb-branch-node__title", decision.title));
      var statusText = status === "done" ? (choice ? "已选择" : "已发生") : status === "current" ? "正在这里" : status === "skipped" ? "未发生" : "尚未走到";
      toggle.append(branchElement("span", "xb-branch-node__status", statusText));
      var body = branchElement("div", "xb-branch-node__body");
      body.id = "branch-node-body-" + chapterId + "-" + decisionId;
      body.hidden = true;
      renderBranchDecisionBody(body, decisionId, decision, status, choice, chapterId, run);
      row.append(toggle, body);
      els.branchDetailBody.append(row);
    });
    renderBranchChapterStart(chapterId);
  }

  function renderBranchDecisionBody(container, decisionId, decision, status, choice, chapterId, run) {
    if (status === "future") {
      container.append(branchElement("p", "xb-branch-node__empty", "尚未走到。"));
      return;
    }
    if (decision.context) container.append(branchElement("p", "xb-branch-node__context", decision.context));
    if (status === "current") {
      container.append(branchElement("p", "xb-branch-node__empty", "你还在这里，没有做出选择。"));
      return;
    }
    if (status === "skipped") {
      var skip = decision.kind === "event" ? decision.skipText : (decision.skipText || "这一步没有发生。");
      container.append(branchElement("p", "xb-branch-node__empty", skip || "这一步没有发生。"));
      return;
    }
    if (decision.kind === "event") {
      var done = decision.doneText || "这一步发生了。";
      if (decisionId === "w026" && run && run.summary) {
        done += " 应到 " + run.summary.answered + " 人，未应 " + run.summary.missed + " 人。";
      }
      container.append(branchElement("p", "xb-branch-node__quote", done));
      return;
    }
    if (!choice) {
      container.append(branchElement("p", "xb-branch-node__empty", "这一处没有留下选择记录。"));
      return;
    }
    var text = branchFormatChoice(decision, choice, chapterId);
    container.append(branchElement("p", "xb-branch-node__quote", text.prefix));
    if (text.lines.length) {
      if (text.multi) {
        var list = document.createElement("ul");
        list.className = "xb-branch-node__list";
        text.lines.forEach(function (line) {
          list.append(branchElement("li", "", line));
        });
        container.append(list);
      } else {
        container.append(branchElement("p", "xb-branch-node__quote", text.lines.join("")));
      }
    }
  }

  function branchRouteDetailRun(store, route) {
    return branchLatestRunForRoute(store, route);
  }

  function renderBranchRouteDetail(route) {
    var store = branchState.store || emptyBranchStore();
    var def = ROUTE_DEFS[route] || {};
    var map = branchMapData();
    var meta = store.endings[route];
    var hint = map && map.endings && map.endings[route] ? map.endings[route].hint : "";
    els.branchDetailKicker.textContent = "剧情分支 · 结局";
    if (!meta) {
      els.branchDetailTitle.textContent = "结局 " + def.index + " / 11 · 尚未抵达";
      els.branchDetailSub.textContent = "这一条线还在雾里。";
      els.branchDetailBody.append(branchElement("p", "xb-branch-route__hint", hint || "继续往北，走到分岔的尽头。"));
      return;
    }
    var run = branchRouteDetailRun(store, route) || branchFallbackRunFromEnding(state.ending);
    var title = run && run.routeTitle ? run.routeTitle : def.title;
    var lede = run && run.routeLede ? run.routeLede : def.lede;
    els.branchDetailTitle.textContent = "结局 " + (def.index || run.routeIndex) + " / 11 · " + title;
    els.branchDetailSub.textContent = lede;
    if (!run) {
      els.branchDetailBody.append(branchElement("p", "xb-branch-node__empty", "这一条线的记录没有留下。"));
      return;
    }
    var chips = document.createElement("div");
    chips.className = "xb-branch-route__chips";
    [
      branchDoorLabel(run.summary),
      "救下 " + run.summary.rescues + " 人",
      "状态 " + XB.core.playerStatusLabel(run.summary.condition),
      "林先生 " + (run.summary.linDead ? "未等到" : "在"),
      run.summary.names ? "点名 " + run.summary.names + " 人" : "名册未翻开",
      "到吴起 " + run.summary.companyEnd + " 人"
    ].forEach(function (text) {
      chips.append(branchElement("span", "xb-branch-route__chip", text));
    });
    els.branchDetailBody.append(chips);

    var chapters = (run.chapters || []).map(function (id) {
      return chapterById(id) ? chapterById(id).short : id;
    }).filter(Boolean).join(" → ");
    var chapterSection = document.createElement("section");
    chapterSection.className = "xb-branch-route__section";
    chapterSection.append(branchElement("h4", "", "走过的路"));
    chapterSection.append(branchElement("p", "", chapters || "没有留下章节记录。"));
    els.branchDetailBody.append(chapterSection);

    var choiceSection = document.createElement("section");
    choiceSection.className = "xb-branch-route__section";
    choiceSection.append(branchElement("h4", "", "这一局的抉择"));
    if (run.choices && run.choices.length) {
      var list = document.createElement("ol");
      list.className = "xb-branch-route__list";
      run.choices.forEach(function (choice) {
        var decisionId = branchDecisionForNode(choice.nodeId);
        var decision = decisionId && map ? map.decisions[decisionId] : null;
        var label = decision ? decision.title : choice.nodeId;
        list.append(branchElement("li", "", label + "：" + choice.text));
      });
      choiceSection.append(list);
    } else {
      choiceSection.append(branchElement("p", "xb-branch-node__empty", "这一局的抉择没有留在记录里。"));
    }
    els.branchDetailBody.append(choiceSection);

    if (run.events && (run.events.zhang || run.events.rollcall)) {
      var eventSection = document.createElement("section");
      eventSection.className = "xb-branch-route__section";
      eventSection.append(branchElement("h4", "", "记下的事"));
      var eventList = document.createElement("ul");
      eventList.className = "xb-branch-route__list";
      if (run.events.zhang) eventList.append(branchElement("li", "", "金沙江边，你抄下了张老幺的名字。"));
      if (run.events.rollcall) eventList.append(branchElement("li", "", "吴起，名册翻开，点名发生。"));
      eventSection.append(eventList);
      els.branchDetailBody.append(eventSection);
    }
  }

  function toggleBranchNode(button) {
    if (!button) return;
    var row = button.closest(".xb-branch-node");
    if (!row) return;
    var body = row.querySelector(".xb-branch-node__body");
    if (!body) return;
    var open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", open ? "false" : "true");
    body.hidden = open;
  }

  // 只读收纳不改变当前局；脏数据在读取时已备份并回空。
  function branchSourceFromScene() {
    if (state && state.scene === "ending") return "ending";
    if (state && state.paused) return "pause";
    return "title";
  }

  /* ---------------- 成就（v1.5.1） ---------------- */

  var ACHIEVEMENT_KEY = "xiangbei.achievements.v1";
  var ACHIEVEMENT_MAX = 48;
  var achievementMemory = null;
  var achievementStorageOk = true;
  var achievementStorageWarned = false;
  var achievementState = {
    open: false,
    source: "title",
    chapter: "prologue",
    store: null,
    runIds: [],
    detailId: null,
    detailPreviousFocus: null,
    previousFocus: null
  };

  function achievementList() {
    return (XB.story && XB.story.achievements) || [];
  }

  function achievementIds() {
    return achievementList().map(function (item) { return item.id; });
  }

  function achievementById(id) {
    var list = achievementList();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function achievementByDecisionKey(decisionId, key) {
    var list = achievementList();
    for (var i = 0; i < list.length; i += 1) {
      var item = list[i];
      if (item.kind !== "interact" && item.decision === decisionId && item.key === key) return item;
    }
    return null;
  }

  function emptyAchievementStore() {
    return { version: 1, updatedAt: 0, unlocked: {} };
  }

  function normalizeAchievementStore(raw) {
    if (!isPlainObject(raw) || raw.version !== 1 || !isPlainObject(raw.unlocked)) return null;
    var known = achievementIds();
    var unlocked = {};
    Object.keys(raw.unlocked).forEach(function (id) {
      if (id === "__proto__" || id === "constructor" || id === "prototype") return;
      if (known.indexOf(id) === -1) return;
      var meta = raw.unlocked[id];
      if (!isPlainObject(meta) || !isFiniteNumber(meta.at)) return;
      unlocked[id] = {
        at: Math.max(0, Math.round(meta.at)),
        timedOut: meta.timedOut === true
      };
    });
    return {
      version: 1,
      updatedAt: isFiniteNumber(raw.updatedAt) ? Math.max(0, Math.round(raw.updatedAt)) : 0,
      unlocked: unlocked
    };
  }

  function backupAchievementStore(raw) {
    try {
      window.localStorage.setItem(ACHIEVEMENT_KEY + ".bad", raw);
      window.localStorage.removeItem(ACHIEVEMENT_KEY);
    } catch (err) {
      console.error("[XB] 备份成就档失败：" + err.message);
    }
  }

  function readAchievementStore() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(ACHIEVEMENT_KEY);
    } catch (err) {
      console.error("[XB] 读取成就档失败：" + err.message);
      achievementStorageOk = false;
      return { data: achievementMemory || emptyAchievementStore(), ok: false };
    }
    if (raw === null) return { data: achievementMemory || emptyAchievementStore(), ok: true };
    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn("[XB] 成就档不是合法 JSON：" + err.message);
      backupAchievementStore(raw);
      return { data: emptyAchievementStore(), ok: false };
    }
    var store = normalizeAchievementStore(parsed);
    if (!store) {
      console.warn("[XB] 成就档版本或结构不符");
      backupAchievementStore(raw);
      return { data: emptyAchievementStore(), ok: false };
    }
    achievementMemory = store;
    return { data: store, ok: true };
  }

  function writeAchievementStore(store) {
    store.updatedAt = Date.now();
    achievementMemory = store;
    try {
      window.localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(store));
      achievementStorageOk = true;
      return true;
    } catch (err) {
      console.warn("[XB] 写入成就档失败：" + err.message);
      achievementStorageOk = false;
      if (!achievementStorageWarned) {
        achievementStorageWarned = true;
        toast("本机无法保存成就，本局仍可继续");
      }
      return false;
    }
  }

  // 首次解锁才写；重复选择、超时重进都不覆盖第一次的时间和 timedOut。
  function recordAchievement(id, timedOut) {
    if (!achievementById(id)) {
      console.error("[XB] 未知成就：" + id);
      return false;
    }
    var store = readAchievementStore().data;
    if (store.unlocked[id]) return false;
    store.unlocked[id] = { at: Date.now(), timedOut: timedOut === true };
    return writeAchievementStore(store);
  }

  function recordChoiceAchievement(node, key, timedOut) {
    if (!node || !node.id) return;
    var decisionId = branchDecisionForNode(node.id);
    if (!decisionId) return;
    var decision = branchMapData().decisions[decisionId];
    if (!decision) return;
    var semantic = branchSemanticKey(decision, node.id, key);
    var item = achievementByDecisionKey(decisionId, semantic);
    if (item) recordAchievement(item.id, timedOut);
  }

  function recordMultiAchievements(node, selectedIds) {
    if (!node || !node.id) return;
    var decisionId = branchDecisionForNode(node.id);
    if (!decisionId) return;
    (selectedIds || []).forEach(function (id) {
      var item = achievementByDecisionKey(decisionId, id);
      if (item) recordAchievement(item.id, false);
    });
  }

  // 本局快照：choices 是权威；j018 不在 choices 里，用 namepick_done + memory.zhang 区分。
  function collectRunAchievements(runState) {
    var ids = [];
    var add = function (id) {
      if (id && ids.indexOf(id) === -1) ids.push(id);
    };
    ((runState && runState.choices) || []).forEach(function (choice) {
      var decisionId = branchDecisionForNode(choice.nodeId);
      if (!decisionId) return;
      var decision = branchMapData().decisions[decisionId];
      if (!decision) return;
      if (choice.option === "MULTI") {
        branchMultiKeys(choice, decision, choice.chapter || (runState && runState.chapterId)).forEach(function (key) {
          var item = achievementByDecisionKey(decisionId, key);
          if (item) add(item.id);
        });
      } else {
        var semantic = branchSemanticKey(decision, choice.nodeId, choice.option);
        var item = achievementByDecisionKey(decisionId, semantic);
        if (item) add(item.id);
      }
    });
    var flags = (runState && runState.flags) || {};
    if (flags["memory.namepick_done"] === true) {
      add(flags["memory.zhang"] === true ? "j018-done" : "j018-skip");
    } else if (flags["memory.zhang"] === true) {
      // 旧档只有 memory.zhang，没有 namepick_done；按 done 处理。
      add("j018-done");
    }
    return ids;
  }

  function recordRunAchievements(ending) {
    if (!ending || !Array.isArray(ending.achievements)) return;
    ending.achievements.forEach(function (id) {
      recordAchievement(id, false);
    });
  }

  function achievementDecision(ach) {
    var map = branchMapData();
    return ach && map && map.decisions ? map.decisions[ach.decision] : null;
  }

  function achievementChapterTitle(ach) {
    var chapter = chapterById(ach.chapter);
    return chapter ? chapter.title : ach.chapter;
  }

  function achievementOptionText(ach) {
    var decision = achievementDecision(ach);
    if (!decision) return "";
    var text = "";
    (decision.nodes || []).forEach(function (nodeId) {
      if (text) return;
      var found = branchStatementNode(nodeId);
      if (!found || !found.node) return;
      (found.node.options || []).forEach(function (option) {
        if (text) return;
        var key = option.id || option.key;
        var semantic = branchSemanticKey(decision, nodeId, option.key || option.id);
        if (key === ach.key || semantic === ach.key) text = option.text || "";
      });
    });
    return text || ach.key;
  }

  function achievementConsequence(ach) {
    var decision = achievementDecision(ach);
    if (!decision) return "";
    if (ach.kind === "interact") {
      return ach.outcome === "done" ? (decision.doneText || "") : (decision.skipText || "");
    }
    return (decision.options && decision.options[ach.key]) || "";
  }

  function achievementInteractName() {
    var found = branchStatementNode("j018");
    var names = found && found.node && found.node.names;
    return names && names.length ? names[0].name : "张老幺";
  }

  // 解锁后才有原因；锁定只给一句话，不提前泄露选项、决策组和后果。
  function achievementParagraphs(ach, meta) {
    if (!meta) {
      return ["这个成就还没有解锁。继续往前走，做完那个选择，就会记下来。"];
    }
    var chapterTitle = achievementChapterTitle(ach);
    var decision = achievementDecision(ach);
    var decisionTitle = decision ? decision.title : "";
    var consequence = achievementConsequence(ach);
    var intro = "";
    var timedOut = meta.timedOut === true;
    if (ach.kind === "interact") {
      if (ach.outcome === "done") {
        intro = "在「" + chapterTitle + "」的「" + decisionTitle + "」中，你蹲了半夜，把「" +
          achievementInteractName() + "」的名字抄在名册的边角上。";
      } else if (timedOut) {
        intro = "时间到了，你一个字没写。";
      } else {
        intro = "在「" + chapterTitle + "」的「" + decisionTitle + "」中，你蹲了半夜，没有动笔。";
      }
    } else {
      var optionText = achievementOptionText(ach);
      intro = timedOut
        ? "时间到了，默认项「" + optionText + "」替你做了决定。"
        : "在「" + chapterTitle + "」的「" + decisionTitle + "」选择中，你选择了「" + optionText + "」。";
    }
    var lines = [intro];
    if (consequence) lines.push(consequence);
    lines.push("因此，你解锁了「" + ach.title + "」。");
    return lines;
  }

  function achievementChapterEntries() {
    return ((XB.story && XB.story.chapters) || []).filter(function (chapter) {
      return achievementList().some(function (item) { return item.chapter === chapter.id; });
    });
  }

  function achievementCounts(chapterId, store, runIds) {
    var list = achievementList().filter(function (item) {
      return !chapterId || item.chapter === chapterId;
    });
    var unlocked = list.filter(function (item) {
      return achievementIsUnlocked(item.id, store, runIds);
    }).length;
    return { unlocked: unlocked, total: list.length };
  }

  function achievementIsUnlocked(id, store, runIds) {
    return !!((store && store.unlocked && store.unlocked[id]) ||
      (runIds && runIds.indexOf(id) !== -1));
  }

  function achievementMeta(id, store, runIds) {
    if (store && store.unlocked && store.unlocked[id]) return store.unlocked[id];
    if (runIds && runIds.indexOf(id) !== -1) return { at: 0, timedOut: false };
    return null;
  }

  function achievementTabLabel(chapter) {
    if (chapter.id === "prologue") return "序章";
    return chapter.short || chapter.title;
  }

  function achievementTimeText(at) {
    if (!at) return "";
    try {
      return new Date(at).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false
      });
    } catch (err) {
      return "";
    }
  }

  function renderAchievementPanel() {
    var store = readAchievementStore().data;
    achievementState.store = store;
    var runIds = achievementState.runIds || [];
    var total = achievementCounts(null, store, runIds);
    els.achievementCount.textContent = "已解锁 " + total.unlocked + " / " + total.total;
    els.achievementTabs.textContent = "";
    var chapters = achievementChapterEntries();
    if (!chapters.some(function (chapter) { return chapter.id === achievementState.chapter; })) {
      achievementState.chapter = chapters.length ? chapters[0].id : "prologue";
    }
    chapters.forEach(function (chapter) {
      var count = achievementCounts(chapter.id, store, runIds);
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "xb-achievements__tab" + (chapter.id === achievementState.chapter ? " is-active" : "");
      tab.dataset.action = "achievement-tab";
      tab.dataset.chapter = chapter.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", chapter.id === achievementState.chapter ? "true" : "false");
      tab.textContent = achievementTabLabel(chapter) + " " + count.unlocked + "/" + count.total;
      els.achievementTabs.append(tab);
    });

    els.achievementGrid.textContent = "";
    var items = achievementList().filter(function (item) {
      return item.chapter === achievementState.chapter;
    });
    items.forEach(function (ach) {
      var unlocked = achievementIsUnlocked(ach.id, store, runIds);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "xb-achievement-card " + (unlocked ? "is-unlocked" : "is-locked");
      card.dataset.action = "achievement-card";
      card.dataset.id = ach.id;
      card.setAttribute("aria-label", ach.title + (unlocked ? "，已解锁，点开查看" : "，未解锁，点开查看"));
      var title = document.createElement("span");
      title.className = "xb-achievement-card__title";
      title.textContent = ach.title;
      card.append(title);
      if (unlocked) {
        var decision = achievementDecision(ach);
        var meta = document.createElement("span");
        meta.className = "xb-achievement-card__meta";
        meta.textContent = decision ? decision.title : "";
        var stateMark = document.createElement("span");
        stateMark.className = "xb-achievement-card__state";
        stateMark.textContent = "已解锁";
        card.append(meta, stateMark);
      } else {
        var locked = document.createElement("span");
        locked.className = "xb-achievement-card__state";
        locked.textContent = "未解锁";
        card.append(locked);
      }
      els.achievementGrid.append(card);
    });
  }

  function renderAchievementDetail() {
    var ach = achievementById(achievementState.detailId);
    if (!ach) return;
    var store = achievementState.store || readAchievementStore().data;
    var meta = achievementMeta(ach.id, store, achievementState.runIds || []);
    var unlocked = !!meta;
    els.achievementDetailKicker.textContent = unlocked ? "成就 · 已解锁" : "成就 · 未解锁";
    els.achievementDetailTitle.textContent = ach.title;
    els.achievementDetailBody.textContent = "";
    achievementParagraphs(ach, meta).forEach(function (line, index) {
      var paragraph = document.createElement("p");
      paragraph.className = index === 0 ? "xb-achievement-detail__lead" : "xb-achievement-detail__text";
      paragraph.textContent = line;
      els.achievementDetailBody.append(paragraph);
    });
    if (meta && meta.at) {
      var time = document.createElement("p");
      time.className = "xb-achievement-detail__time";
      time.textContent = "首次解锁：" + achievementTimeText(meta.at);
      els.achievementDetailBody.append(time);
    }
  }

  function openAchievements(source, focusId) {
    if (achievementState.open) {
      if (focusId) openAchievementDetail(focusId, null);
      return;
    }
    var ach = focusId ? achievementById(focusId) : null;
    var from = source || branchSourceFromScene();
    achievementState.open = true;
    achievementState.source = from;
    achievementState.previousFocus = document.activeElement;
    achievementState.detailId = null;
    achievementState.detailPreviousFocus = null;
    achievementState.runIds = from === "ending" && state.ending && Array.isArray(state.ending.achievements)
      ? state.ending.achievements.slice()
      : [];
    achievementState.chapter = ach ? ach.chapter
      : (from === "pause" && state && state.chapterId ? state.chapterId : "prologue");
    renderAchievementPanel();
    els.achievementPanel.hidden = false;
    XB.audio.cue("codex");
    refreshAudioDuck();
    els.achievementClose.focus();
    if (ach) openAchievementDetail(ach.id, els.achievementClose);
  }

  function closeAchievementDetail() {
    if (!achievementState.detailId) return;
    achievementState.detailId = null;
    els.achievementDetail.hidden = true;
    var previous = achievementState.detailPreviousFocus;
    achievementState.detailPreviousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus();
  }

  function closeAchievements() {
    if (!achievementState.open) return;
    closeAchievementDetail();
    achievementState.open = false;
    achievementState.detailId = null;
    achievementState.runIds = [];
    els.achievementPanel.hidden = true;
    refreshAudioDuck();
    var previous = achievementState.previousFocus;
    achievementState.previousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus();
  }

  function openAchievementDetail(id, trigger) {
    if (!achievementState.open || !achievementById(id)) return;
    achievementState.detailId = id;
    achievementState.detailPreviousFocus = trigger || document.activeElement;
    renderAchievementDetail();
    els.achievementDetail.hidden = false;
    els.achievementDetailClose.focus();
  }

  function renderEndingAchievements() {
    if (!els.endingAchievements) return;
    var store = readAchievementStore().data;
    var hasField = !!(state.ending && Object.prototype.hasOwnProperty.call(state.ending, "achievements"));
    var ids = hasField && Array.isArray(state.ending.achievements) ? state.ending.achievements : null;
    var total = achievementCounts(null, store, ids || []);
    els.endingAchievementChips.textContent = "";
    if (ids === null) {
      els.endingAchievementsCount.textContent = "累计 " + total.unlocked + " / " + total.total;
      var oldNote = document.createElement("p");
      oldNote.className = "xb-ending__achievements-empty";
      oldNote.textContent = "旧档未记录本局成就。";
      els.endingAchievementChips.append(oldNote);
      return;
    }
    els.endingAchievementsCount.textContent = "本局 " + ids.length + " 条 · 累计 " + total.unlocked + " / " + total.total;
    if (!ids.length) {
      var empty = document.createElement("p");
      empty.className = "xb-ending__achievements-empty";
      empty.textContent = "这一局没有记下成就。";
      els.endingAchievementChips.append(empty);
      return;
    }
    ids.forEach(function (id) {
      var ach = achievementById(id);
      if (!ach) return;
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "xb-ending__achievement";
      chip.dataset.action = "ending-achievement";
      chip.dataset.id = id;
      chip.textContent = ach.title;
      els.endingAchievementChips.append(chip);
    });
  }

  /* ---------------- 状态与物资 ---------------- */

  function formatSlots(units) {
    var slots = units / 2;
    return (slots % 1 === 0 ? String(slots) : slots.toFixed(1)) + " 格";
  }

  function updateHud() {
    if (!state || !els.vnCondition) return;
    var condition = isFiniteNumber(state.flags.condition) ? state.flags.condition : 3;
    var label = XB.core.conditionLabel(condition);
    var text = els.vnCondition.querySelector("b");
    if (text) text.textContent = label;
    els.vnCondition.className = "vn-condition is-q" + condition;
    var units = XB.core.packUsage(state);
    var capacity = Math.max(4, units / 2);
    els.vnPackCount.textContent = (units / 2).toFixed(units % 2 === 0 ? 0 : 1) + "/" + capacity;
    els.vnPackButton.disabled = choiceRun.active || interactRun.active;
    els.vnPackButton.setAttribute("aria-disabled", els.vnPackButton.disabled ? "true" : "false");
  }

  function packItemRows() {
    var rows = [];
    var add = function (id, name, note, units) {
      rows.push({ id: id, name: name, note: note, units: units });
    };
    if (state.inventory.items.indexOf("roster") !== -1) add("roster", "花名册", "一直贴身带着，不占格。", 0);
    if (state.inventory.items.indexOf("pencil") !== -1) add("pencil", "铅笔", "记名字用的，不占格。", 0);
    if (state.flags["item.door"] === true) add("door", "门板", "占两格，不能当物资使用；剧情里可以铺桥、挡雨、当床板。", DOOR_UNITS);
    if (state.inventory.items.indexOf("medicine") !== -1) add("medicine", "药", "两包草药，油纸裹着。半格。", 1);
    if (state.inventory.items.indexOf("barley") !== -1) add("barley", "青稞", "一小袋炒青稞。半格。", 1);
    if (state.inventory.items.indexOf("shoes") !== -1) add("shoes", "布鞋", "新纳的底，针脚密。一格。", 2);
    if (state.inventory.items.indexOf("pot") !== -1) add("pot", "铁锅", "家里那口铁锅。两格。", 4);
    if (state.inventory.items.indexOf("raincloth") !== -1) add("raincloth", "雨布", "补过三次的油布。两格，只能在草地使用。", 4);
    if (state.inventory.giftBarley === true) add("giftBarley", "冬生的青稞", "他塞给我的，不占格。", 0);
    return rows;
  }

  function packRecipes() {
    var has = function (id) {
      if (id === "giftBarley") return state.inventory.giftBarley === true;
      return state.inventory.items.indexOf(id) !== -1;
    };
    var recipes = [];
    if (has("shoes")) recipes.push({ key: "shoes", label: "布鞋", delta: 1, disabled: false });
    if (has("pot")) recipes.push({ key: "pot", label: "铁锅", delta: 2, disabled: false });
    if (has("raincloth")) recipes.push({
      key: "raincloth",
      label: "雨布",
      delta: 1,
      disabled: state.chapterId !== "grass",
      reason: "雨布只能在草地使用。"
    });
    if (has("medicine") && has("barley")) recipes.push({ key: "barley+medicine", label: "药 + 青稞", delta: 1, disabled: false });
    if (has("barley") && has("giftBarley")) recipes.push({ key: "barley+giftBarley", label: "青稞 + 冬生的青稞", delta: 2, disabled: false });
    if (has("medicine") && has("giftBarley")) recipes.push({ key: "giftBarley+medicine", label: "药 + 冬生的青稞", delta: 1, disabled: false });
    return recipes;
  }

  function renderPack() {
    var warning = packState.mode === "warning";
    var intro = packState.mode === "start";
    els.packWarning.hidden = !warning;
    els.packWarning.textContent = warning
      ? "当前你的状态已不足以支撑继续行进，请立刻补充物资恢复体力。"
      : "";
    els.packTitle.textContent = intro ? "出发前" : "物资";
    var used = XB.core.packUsage(state);
    var capacity = Math.max(8, used);
    els.packSummary.textContent =
      "行囊 " + formatSlots(used) + " / " + formatSlots(capacity) +
      (state.flags["item.door"] === true ? "（门板占两格）" : "") +
      " · 状态 " + XB.core.conditionLabel(state.flags.condition);
    els.packList.textContent = "";
    packItemRows().forEach(function (row) {
      var item = document.createElement("div");
      item.className = "xb-pack__item";
      var name = document.createElement("span");
      name.className = "xb-pack__item-name";
      name.textContent = row.name;
      var units = document.createElement("span");
      units.className = "xb-pack__item-units";
      units.textContent = row.units ? formatSlots(row.units) : "不占格";
      var note = document.createElement("span");
      note.className = "xb-pack__item-note";
      note.textContent = row.note;
      item.append(name, units, note);
      els.packList.append(item);
    });

    var head = document.createElement("p");
    head.className = "xb-pack__subhead";
    head.textContent = "可以这样用";
    els.packList.append(head);
    var recipes = packRecipes();
    if (state.flags.condition >= 4) {
      var full = document.createElement("p");
      full.className = "xb-pack__empty";
      full.textContent = "状态已经是优秀，不需要再用物资。";
      els.packList.append(full);
    } else if (!recipes.length) {
      var none = document.createElement("p");
      none.className = "xb-pack__empty";
      none.textContent = "现在没有能用的组合。";
      els.packList.append(none);
    } else {
      var actions = document.createElement("div");
      actions.className = "xb-pack__recipes";
      recipes.forEach(function (recipe) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "xb-btn xb-btn--sm xb-pack__recipe";
        button.dataset.action = "pack-use";
        button.dataset.packUse = recipe.key;
        button.disabled = recipe.disabled || state.flags.condition >= 4;
        button.textContent = recipe.label + " · 状态 +" + recipe.delta + (recipe.disabled ? "（" + recipe.reason + "）" : "");
        actions.append(button);
      });
      els.packList.append(actions);
    }
    els.packNote.textContent = warning
      ? "用物资把状态提回“勉强”以上；不用就走不出去。"
      : intro
        ? "你当前的状态为良好。使用物资可以把状态提到优秀；不用也可以出发。"
        : "使用物资会消耗它；状态到优秀后不再需要。";
    els.packClose.textContent = intro ? "不用，出发" : "关闭";
    els.packClose.hidden = warning;
    els.packContinue.hidden = !warning;
    els.packContinue.textContent = warning
      ? (recipes.length ? "放弃补给，继续赶路" : "没有物资，继续赶路")
      : "继续（不使用）";
  }

  function openPackPanel(mode, onClose) {
    if (!state || state.scene !== "vn") return;
    packState.open = true;
    packState.mode = mode || "browse";
    packState.onClose = onClose || null;
    packState.previousFocus = document.activeElement;
    renderPack();
    els.packPanel.hidden = false;
    els.packClose.focus();
    refreshAudioDuck();
  }

  function closePackPanel(keepFocus) {
    if (!packState.open) return;
    packState.open = false;
    els.packPanel.hidden = true;
    var previous = packState.previousFocus;
    packState.previousFocus = null;
    if (!keepFocus && previous && previous.focus && previous !== document.body) previous.focus();
    refreshAudioDuck();
    drainStatusEvents();
    flushStatusNotice();
  }

  function finishPackPanel() {
    if (!packState.open) return;
    var mode = packState.mode;
    var callback = packState.onClose;
    if (mode === "warning") {
      XB.core.resolveGrassWarning(state);
    }
    closePackPanel(false);
    updateHud();
    if (callback) callback();
  }

  function usePackRecipe(key) {
    var result = XB.core.usePackItems(state, key.split("+"));
    if (!result.ok) {
      toast(result.reason);
      return;
    }
    XB.audio.cue("choice-select");
    drainStatusEvents();
    updateHud();
    if (packState.mode === "warning" && state.flags.condition > 1) {
      toast("状态回到" + XB.core.conditionLabel(state.flags.condition) + "，能走了。");
      finishPackPanel();
      return;
    }
    renderPack();
  }

  // 草地结束：先扣状态，再按 7(5)/坏结局/门板条件收口；刷新到 g027a 不重复扣。
  function runGrassSettlement() {
    var result = XB.core.settleGrass(state);
    updateHud();
    if (result.condition === 0) {
      finishGrassSettlement();
      return;
    }
    if (result.condition === 1) {
      openDangerModal();
      return;
    }
    finishGrassSettlement();
  }

  function finishGrassSettlement() {
    if (state.flags.condition <= 1) XB.core.resolveGrassWarning(state);
    var outcome = XB.core.settleDoor(state);
    XB.core.syncDerivedFlags(state);
    updateHud();
    var needsDoorModal = outcome === "grass" &&
      state.flags["had.door"] === true &&
      state.flags["fate.player.dead"] !== true;
    if (needsDoorModal) {
      doorState.open = true;
      doorState.previousFocus = document.activeElement;
      els.doorModal.hidden = false;
      els.doorDiscard.focus();
      refreshAudioDuck();
      return;
    }
    advanceVn();
  }

  function closeDoorModal() {
    if (!doorState.open) return;
    doorState.open = false;
    els.doorModal.hidden = true;
    var previous = doorState.previousFocus;
    doorState.previousFocus = null;
    if (previous && previous.focus && previous !== document.body) previous.focus();
    refreshAudioDuck();
    advanceVn();
  }

  // 差状态警告：同意去物资栏，拒绝直接按死亡收口；不提供“点空白关掉”，避免绕过取舍。
  function openDangerModal() {
    if (!state || state.scene !== "vn" || dangerState.open) return;
    dangerState.open = true;
    dangerState.previousFocus = document.activeElement;
    els.dangerModal.hidden = false;
    els.dangerAccept.focus();
    refreshAudioDuck();
  }

  function closeDangerModal(keepFocus) {
    if (!dangerState.open) return;
    dangerState.open = false;
    els.dangerModal.hidden = true;
    var previous = dangerState.previousFocus;
    dangerState.previousFocus = null;
    if (!keepFocus && previous && previous.focus && previous !== document.body) previous.focus();
    refreshAudioDuck();
  }

  function acceptDanger() {
    if (!dangerState.open) return;
    closeDangerModal(true);
    openPackPanel("warning", finishGrassSettlement);
  }

  function refuseDanger() {
    if (!dangerState.open) return;
    closeDangerModal(true);
    XB.core.resolveGrassWarning(state);
    updateHud();
    finishGrassSettlement();
  }

  // 暂停、图鉴、史实注可能叠在一起，取最安静的一档，不叠乘。
  function refreshAudioDuck() {
    var duck = 1;
    if (codexState.open || galleryState.open || rosterGalleryState.open || branchState.open || achievementState.open || historyState.open) duck = Math.min(duck, 0.45);
    if (packState.open || doorState.open || dangerState.open || bagConfirmState.open) {
      duck = Math.min(duck, 0.45);
    }
    if (savePanelState.open || confirmState.open) duck = Math.min(duck, 0.45);
    if (settingsState.open) duck = Math.min(duck, 0.45);
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
    stopInteract();
    cancelAuto();
    cancelChoiceTimer();
    cancelTyping();
    state.scene = scene;
    render();
  }

  // 开新档：只新建一个槽位，不动其它存档、分支与成就。
  function startNewGame() {
    if (savesStore.slots.length >= SAVE_SLOT_MAX) {
      toast("存档已满，请先删除旧存档");
      return;
    }
    clearStatusNotice();
    XB.core.takeStatusEvents();
    state = defaults();
    state.settings = cloneJson(savesStore.settings);
    branchLastRun = null;
    branchRecordedEnding = null;
    branchState.run = null;
    historyFlush();
    if (!startChapter(state, "prologue")) {
      toast("序章没能载入");
      return;
    }
    var slot = createSlotRecord(serialize(state));
    savesStore.slots.unshift(slot);
    savesStore.activeId = slot.id;
    historyResetForSlot(slot.id);
    writeSavesStore(savesStore);
    chapterCapture(slot.id, "prologue");
    closeSaves(true);
    applySettings();
    showScene("vn");
    els.vnChapter.textContent = chapterById("prologue").title;
    els.vnText.textContent = "";
    els.vnName.hidden = true;
    els.vnNext.textContent = "";
    els.vnToolbar.hidden = true;
    paintStage("yudu_river");
    saveNow();
    showTitleCard("序章 · 于都", "一九三四年 · 十月", function () {
      renderVn(currentNode(state));
    }, { bg: "yudu_river", place: "赣南 · 于都河" });
  }

  function enterStation(chapterId) {
    var chapter = chapterById(chapterId);
    if (!chapter || !chapter.playable) {
      toast("这一段还没接上");
      return;
    }
    var resume = state.chapterId === chapterId && state.nodeId ? locate(chapterId, state.nodeId) : null;
    if (resume && isVisible(state, resume.node)) {
      state.scene = "vn";
      render();
      return;
    }
    if (!startChapter(state, chapterId)) {
      toast("这一段没能载入");
      return;
    }
    render();
  }

  function openPause() {
    if (!state || state.scene !== "vn" || state.paused) return;
    state.paused = true;
    settingsState.open = false;
    settingsState.from = "";
    settingsState.previousFocus = null;
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
    if (settingsState.open) closeSettings(true);
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
    if (settingsState.open) return;
    var from = state && state.scene === "title" ? "title" : "pause";
    // 暂停态之外不凭空打开；标题态和暂停态共用 #pause 遮罩。
    if (from === "pause" && (!state || !state.paused)) return;
    settingsState.open = true;
    settingsState.from = from;
    settingsState.previousFocus = document.activeElement;
    els.pause.hidden = false;
    els.pauseMenu.hidden = true;
    els.vnRoster.hidden = true;
    els.settingsDanger.hidden = from !== "title";
    els.vnSettings.hidden = false;
    els.vnSettings.scrollTop = 0;
    syncSettingsUI();
    refreshAudioDuck();
    els.setSpeed.focus();
  }

  function closeSettings(silent) {
    if (!settingsState.open) {
      els.vnSettings.hidden = true;
      return;
    }
    var from = settingsState.from;
    var previous = settingsState.previousFocus;
    settingsState.open = false;
    settingsState.from = "";
    settingsState.previousFocus = null;
    els.vnSettings.hidden = true;
    els.pauseMenu.hidden = false;
    if (from === "title") els.pause.hidden = true;
    refreshAudioDuck();
    if (!silent && previous && previous.focus && previous !== document.body) {
      previous.focus({ preventScroll: true });
    } else if (!silent && from === "pause") {
      var first = els.pauseMenu.querySelector("button");
      if (first) first.focus();
    }
  }

  // 花名册只读现有数据：点名前的名字一律“在册”，点名后才显示应/未应，避免提前剧透。
  function renderRoster() {
    var ended = !!(state.ending && Array.isArray(state.ending.names) && state.ending.names.length);
    var rows = ended
      ? state.ending.names
      : rollcallEntries(state).map(function (entry) {
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
      status.textContent = entry.answeredBy === "dongsheng"
        ? "冬生代答"
        : entry.answeredBy === "you"
          ? "你替他答了"
          : labels[entry.status] || labels.unknown;
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
      historyFlush();
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
      saveSettingsOnly();
    });
    els.setVolume.addEventListener("input", function () {
      state.settings.volume = Number(els.setVolume.value) / 100;
      els.setVolumeValue.textContent = els.setVolume.value;
      XB.audio.applySettings({ volume: state.settings.volume });
      saveSettingsOnly();
    });
    els.setMusicVolume.addEventListener("input", function () {
      state.settings.musicVolume = Number(els.setMusicVolume.value) / 100;
      els.setMusicVolumeValue.textContent = els.setMusicVolume.value;
      XB.audio.applySettings({ musicVolume: state.settings.musicVolume });
      saveSettingsOnly();
    });
    els.setEnvVolume.addEventListener("input", function () {
      state.settings.ambienceVolume = Number(els.setEnvVolume.value) / 100;
      els.setEnvVolumeValue.textContent = els.setEnvVolume.value;
      XB.audio.applySettings({ ambienceVolume: state.settings.ambienceVolume });
      saveSettingsOnly();
    });
    els.setScale.addEventListener("click", function (event) {
      var button = event.target.closest("[data-scale]");
      if (!button) return;
      state.settings.textScale = Number(button.dataset.scale);
      applySettings();
      saveSettingsOnly();
    });
    els.setMuted.addEventListener("click", function () {
      state.settings.muted = !state.settings.muted;
      applySettings();
      saveSettingsOnly();
    });
    els.setMotion.addEventListener("click", function () {
      state.settings.reducedMotion = !state.settings.reducedMotion;
      applySettings();
      saveSettingsOnly();
      if (!state.settings.reducedMotion) return;
      if (vnRun.typing) finishPageNow();
    });
    els.setSkip.addEventListener("click", function () {
      state.settings.skipSeen = !state.settings.skipSeen;
      applySettings();
      saveSettingsOnly();
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
    els.rosterGallery.addEventListener("click", function (event) {
      if (event.target === els.rosterGallery) closeRosterGallery();
    });
    els.branchDetail.addEventListener("click", function (event) {
      if (event.target === els.branchDetail) closeBranchDetail();
    });
    els.achievementPanel.addEventListener("click", function (event) {
      if (event.target === els.achievementPanel) closeAchievements();
    });
    els.achievementDetail.addEventListener("click", function (event) {
      if (event.target === els.achievementDetail) closeAchievementDetail();
    });
    els.savesPanel.addEventListener("click", function (event) {
      if (event.target !== els.savesPanel) return;
      if (savePanelState.mode === "chapter-source") chapterSaveBack();
      else closeSaves();
    });
    // 点遮罩/窗身不该把焦点丢到 body：mousedown 默认行为才移动焦点，非按钮处一律拦下。
    // 提示窗也不因点遮罩关闭，免得误触抹掉“尚未装满”。
    els.bagConfirmModal.addEventListener("mousedown", function (event) {
      if (event.target !== els.bagConfirmYes && event.target !== els.bagConfirmNo) {
        event.preventDefault();
      }
    });
    // 标题卡不单独绑 pointerdown：document 上的 onPointerDown 已经负责关它并 return，
    // 两处都绑会让同一次点击关完卡片后继续把 p001 的第一页“补全”，第一句等于没打。
  }

  function onPointerDown(event) {
    XB.audio.unlock();
    if (event.button !== undefined && event.button !== 0) return;
    var target = event.target;
    if (!target || !target.closest) return;
    if (branchState.open || achievementState.open) return;
    if (savePanelState.open || confirmState.open || endingReview.active || settingsState.open) return;
    if (target.closest("[data-action]")) return; // 按钮交给 click，避免一次点击走两条路
    if (historyState.open) return;
    if (packState.open || doorState.open || dangerState.open || bagConfirmState.open) return;
    if (titleCardState.open) {
      closeTitleCard();
      return;
    }
    if (codexState.open || galleryState.open || rosterGalleryState.open) return;
    if (interactRun.active) return;
    if (!els.vnMultichoice.hidden) return;
    if (!state || state.scene !== "vn" || state.paused) return;
    if (target.closest("#vn-dialogue, #scene-vn")) advanceInput();
  }

  function onClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var actionElement = target.closest("[data-action]");
    if (!actionElement) return;
    var actionName = actionElement.dataset.action;
    if (actionElement.getAttribute("aria-disabled") === "true" && actionName !== "skip" && actionName !== "gallery-card") return;
    handleAction(actionName, actionElement);
  }

  function onKeyDown(event) {
    XB.audio.unlock();
    // 回顾层在最上面：Esc 关闭，Tab 只在关闭键与正文之间走，其余键不穿透。
    if (historyState.open) {
      if (event.key === "Escape") {
        closeHistory();
        event.preventDefault();
      } else if (event.key === "Tab") {
        trapFocus(event, els.historyPanel);
      }
      return;
    }
    // 确认弹窗 > 存档面板 > 结局回顾：各层自己锁焦点，避免键盘穿透到标题/剧情。
    if (confirmState.open) {
      if (event.key === "Tab") {
        trapFocus(event, els.saveConfirm);
        event.preventDefault();
      } else if (event.key === "Escape") {
        closeConfirm();
        event.preventDefault();
      }
      return;
    }
    if (settingsState.open) {
      if (event.key === "Escape") {
        closeSettings();
        event.preventDefault();
      } else if (event.key === "Tab") {
        trapFocus(event, els.vnSettings);
        event.preventDefault();
      }
      return;
    }
    if (savePanelState.open) {
      if (event.key === "Escape") {
        if (savePanelState.mode === "chapter-source") chapterSaveBack();
        else closeSaves();
        event.preventDefault();
        return;
      }
      if (event.key === "Tab") {
        trapFocus(event, els.savesPanel);
        event.preventDefault();
        return;
      }
      return;
    }
    if (endingReview.active) {
      if (event.key === "Escape") {
        closeEndingReview();
        event.preventDefault();
      }
      return;
    }
    if (dangerState.open) {
      if (event.key === "Tab") {
        trapFocus(event, els.dangerModal);
        event.preventDefault();
      }
      return;
    }
    // 行囊未满的提示：Tab 锁在两个键里，Esc 等同「否」（退回选物资）
    if (bagConfirmState.open) {
      if (event.key === "Tab") {
        // 兜底：焦点若已落在窗外（程序失焦等），先收回「是/否」再交给原生 Tab 或 trapFocus
        if (!els.bagConfirmModal.contains(document.activeElement)) {
          (event.shiftKey ? els.bagConfirmNo : els.bagConfirmYes).focus();
          event.preventDefault();
        } else {
          trapFocus(event, els.bagConfirmModal);
        }
      } else if (event.key === "Escape") {
        cancelBagConfirm();
        event.preventDefault();
      }
      return;
    }
    if (doorState.open) {
      if (event.key === "Escape" || event.key === "Enter") {
        closeDoorModal();
        event.preventDefault();
      }
      return;
    }
    if (packState.open) {
      if (event.key === "Escape") {
        if (packState.mode === "browse") closePackPanel(false);
        else finishPackPanel();
        event.preventDefault();
      }
      return;
    }
    if (branchState.open) {
      if (event.key === "Escape") {
        if (branchState.detailKind) closeBranchDetail();
        else closeBranch();
        event.preventDefault();
        return;
      }
      if (event.key === "Tab") {
        trapFocus(event, els.branchDetail.hidden ? els.branchMap : els.branchDetail);
        event.preventDefault();
        return;
      }
      return;
    }
    if (achievementState.open) {
      if (event.key === "Escape") {
        if (achievementState.detailId) closeAchievementDetail();
        else closeAchievements();
        event.preventDefault();
        return;
      }
      if (event.key === "Tab") {
        trapFocus(event, els.achievementDetail.hidden ? els.achievementPanel : els.achievementDetail);
        event.preventDefault();
        return;
      }
      return;
    }
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
      if (rosterGalleryState.open) {
        closeRosterGallery();
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

    if (event.key === "Tab" && codexState.open) {
      trapFocus(event, els.codex);
      return;
    }
    if (event.key === "Tab" && galleryState.open) {
      trapFocus(event, els.codexGallery);
      return;
    }
    if (event.key === "Tab" && rosterGalleryState.open) {
      trapFocus(event, els.rosterGallery);
      return;
    }
    if (galleryState.open) return;
    if (rosterGalleryState.open) return;

    // 多选：数字键切换，Enter 确认；焦点在选项/确认按钮上时交给按钮自己的原生行为。
    if (!els.vnMultichoice.hidden && multiRun.node && state && !state.paused) {
      if (/^[1-9]$/.test(event.key)) {
        var multiOption = (multiRun.node.options || [])[Number(event.key) - 1];
        if (multiOption) {
          event.preventDefault();
          toggleMultiChoice(multiOption.id);
        }
        return;
      }
      if (event.key === "Enter" && !event.repeat) {
        if (isControlFocused()) return;
        event.preventDefault();
        resolveMultiChoice();
        return;
      }
      if (event.key === " " || event.key === "Spacebar") {
        if (isControlFocused()) return;
        event.preventDefault();
        return;
      }
      return;
    }

    if (interactRun.active) {
      var answerKey = event.key === " " || event.key === "Enter" || event.key === "Spacebar";
      if (answerKey && !event.repeat && !state.paused && interactRun.mode === "rollcall" &&
          interactRun.phase === "wait" && !isControlFocused()) {
        event.preventDefault();
        answerRollcall();
      }
      return;
    }

    // 限时选项的数字快捷键：1–9 对应显示顺序；置灰的条件选项不能被数字键越过。
    if (/^[1-9]$/.test(event.key) && state && state.scene === "vn" && !state.paused &&
        choiceRun.active && !choiceRun.resolved) {
      var choiceNode = currentNode(state);
      if (choiceNode && choiceNode.type === "choice") {
        var picked = choiceNode.options[Number(event.key) - 1];
        if (!picked) return;
        event.preventDefault();
        if (XB.core.optionVisible(state, picked)) resolveChoice(picked.key, false);
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
      case "history":
        openHistory();
        break;
      case "history-close":
        closeHistory();
        break;
      case "saves":
        openSaves();
        break;
      case "saves-close":
        closeSaves();
        break;
      case "saves-back":
        chapterSaveBack();
        break;
      case "save-slot":
        chooseSaveSlot(target.dataset.id);
        break;
      case "save-new":
        if (savesStore.slots.length >= SAVE_SLOT_MAX) {
          toast("存档已满，请先删除旧存档");
        } else if (savePanelState.mode === "chapter-target") {
          savePanelState.targetId = null;
          savePanelState.mode = "chapter-source";
          renderSavePanel();
          focusFirstChapterSource();
        } else {
          openConfirm("new");
        }
        break;
      case "save-latest":
        if (latestUnfinishedSlot()) openConfirm("continue");
        break;
      case "save-delete":
        if (savesStore.slots.length) beginDeleteMode();
        break;
      case "save-delete-confirm":
        if (Object.keys(savePanelState.selected).length) openConfirm("delete");
        break;
      case "save-delete-cancel":
        endDeleteMode();
        break;
      case "save-confirm-yes":
        onConfirmYes();
        break;
      case "save-confirm-no":
        onConfirmNo();
        break;
      case "save":
        manualSave();
        break;
      case "init-game":
        openConfirm("init");
        break;
      case "codex":
        openGallery();
        break;
      case "branch":
        openBranch(branchSourceFromScene());
        break;
      case "achievements":
        openAchievements(branchSourceFromScene());
        break;
      case "ending-achievement":
        openAchievements("ending", target.dataset.id);
        break;
      case "achievement-close":
        closeAchievements();
        break;
      case "achievement-tab":
        achievementState.chapter = target.dataset.chapter;
        renderAchievementPanel();
        break;
      case "achievement-card":
        openAchievementDetail(target.dataset.id, target);
        break;
      case "achievement-detail-close":
        closeAchievementDetail();
        break;
      case "ending-branch":
        openBranch("ending");
        break;
      case "branch-close":
        closeBranch();
        break;
      case "branch-detail-close":
        closeBranchDetail();
        break;
      case "branch-chapter":
        openBranchDetail("chapter", target.dataset.chapter, target);
        break;
      case "branch-start":
        openChapterTarget(target.dataset.chapter, target);
        break;
      case "branch-route":
        openBranchDetail("route", target.dataset.route, target);
        break;
      case "branch-node":
        toggleBranchNode(target);
        break;
      case "gallery-close":
        closeGallery();
        break;
      case "gallery-card":
        openGalleryCard(target.dataset.codex);
        break;
      case "roster-gallery":
        openRosterGallery();
        break;
      case "roster-gallery-close":
        closeRosterGallery();
        break;
      case "pack":
        if (!els.vnPackButton.disabled) openPackPanel("browse", null);
        break;
      case "pack-use":
        usePackRecipe(target.dataset.packUse);
        break;
      case "pack-close":
        if (packState.mode === "browse") closePackPanel(false);
        else finishPackPanel();
        break;
      case "pack-continue":
        finishPackPanel();
        break;
      case "door-discard":
        closeDoorModal();
        break;
      case "danger-accept":
        acceptDanger();
        break;
      case "danger-refuse":
        refuseDanger();
        break;
      case "bag-confirm-yes":
        acceptBagConfirm();
        break;
      case "bag-confirm-no":
        cancelBagConfirm();
        break;
      case "interact-answer":
        if (interactRun.mode === "rollcall") answerRollcall();
        else skipNamepick(false);
        break;
      case "pick-name":
        pickName(target.dataset.nameId);
        break;
      case "ending-home":
        if (endingReview.active) closeEndingReview();
        else go("title");
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
      case "multi-toggle":
        toggleMultiChoice(target.dataset.multiId);
        break;
      case "multi-confirm":
        resolveMultiChoice();
        break;
      case "continue-node":
        advanceVn();
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

  // 章末自动存档后单独提示：不占用 toast，避免覆盖「章节已解锁」等章末消息。
  function showAutoSaveNotice() {
    els.autosaveNotice.textContent = "已自动存档";
    els.autosaveNotice.setAttribute("aria-hidden", "false");
    els.autosaveNotice.classList.add("is-visible");
    clearTimeout(autosaveNoticeTimer);
    autosaveNoticeTimer = window.setTimeout(function () {
      els.autosaveNotice.classList.remove("is-visible");
      els.autosaveNotice.setAttribute("aria-hidden", "true");
    }, AUTOSAVE_NOTICE_MS);
  }

  function saveChapterProgress() {
    if (!saveNow()) return false;
    showAutoSaveNotice();
    return true;
  }

  /* ---------------- 状态变化弹窗 ---------------- */

  var STATUS_NAMES = { feimao: "飞毛腿", zaowang: "灶王", dongsheng: "冬生" };

  function cleanStatusReason(reason) {
    return String(reason || "").replace(/[。！？!?；;]+$/g, "").trim() || "路上的情况变了";
  }

  function statusEventLine(event) {
    var reason = cleanStatusReason(event.reason);
    if (event.kind === "player") {
      if (event.to === 0) return "由于" + reason + "，你牺牲了。";
      return "由于" + reason + "，你的状态变为" + XB.core.playerStatusLabel(event.to) + "。";
    }
    var name = STATUS_NAMES[event.kind] || "他";
    if (event.to === 0) return "由于" + reason + "，" + name + "牺牲了。";
    return "由于" + reason + "，" + name + "的状态变为" + XB.core.companionStatusLabel(event.to) + "。";
  }

  function canShowStatusNotice() {
    if (!state || state.scene !== "vn") return false;
    if (titleCardState.open || packState.open || dangerState.open || doorState.open ||
        bagConfirmState.open) return false;
    if (codexState.open || achievementState.open) return false;
    if (els.pause && !els.pause.hidden) return false;
    return true;
  }

  function drainStatusEvents() {
    if (!XB.core || typeof XB.core.takeStatusEvents !== "function") return;
    var events = XB.core.takeStatusEvents();
    if (!events.length) return;
    statusQueue = statusQueue.concat(events).slice(-12);
    flushStatusNotice();
  }

  function flushStatusNotice() {
    if (statusNoticeOpen || !statusQueue.length || !canShowStatusNotice()) return;
    var batch = statusQueue.splice(0, 3);
    showStatusNotice(batch);
  }

  function showStatusNotice(events) {
    if (!els.statusNotice || !events.length) return;
    clearTimeout(statusNoticeTimer);
    els.statusNoticeList.textContent = "";
    events.forEach(function (event) {
      var row = document.createElement("li");
      row.textContent = statusEventLine(event);
      els.statusNoticeList.append(row);
    });
    els.statusNotice.hidden = false;
    statusNoticeOpen = true;
    statusNoticeTimer = window.setTimeout(function () {
      hideStatusNotice();
      flushStatusNotice();
    }, STATUS_NOTICE_MS + Math.max(0, events.length - 1) * STATUS_NOTICE_LINE_MS);
  }

  function hideStatusNotice() {
    clearTimeout(statusNoticeTimer);
    statusNoticeTimer = 0;
    statusNoticeOpen = false;
    if (els.statusNotice) els.statusNotice.hidden = true;
  }

  function clearStatusNotice() {
    statusQueue = [];
    hideStatusNotice();
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
