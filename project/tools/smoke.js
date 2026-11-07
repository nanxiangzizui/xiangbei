#!/usr/bin/env node
// 纯状态层烟测（开发期脚本，不进运行时）：node project/tools/smoke.js
// 不依赖浏览器：把三个脚本按页面顺序放进 vm，只调 XB.core 与 XB.story。
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { BANNED, REAL } = require("./redlines");

const PROJECT_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(PROJECT_DIR, "..");
const GAME_FILES = ["art.js", "story.js", "engine.js"];

const sandbox = {
  console: console,
  document: { addEventListener: function () {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
sandbox.window = sandbox;
vm.createContext(sandbox);
GAME_FILES.forEach(function (file) {
  vm.runInContext(fs.readFileSync(path.join(PROJECT_DIR, file), "utf8"), sandbox, { filename: file });
});
const XB = sandbox.XB;

const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message + "：期望 " + JSON.stringify(expected) + "，实际 " + JSON.stringify(actual));
  }
}

function check(id, title, fn) {
  try {
    fn();
    console.log(id + " OK " + title);
  } catch (err) {
    failures.push(id + " " + title + "：" + err.message);
  }
}

// 负向用例会走 console.error，这里接住并断言确实报错，免得把预期报错混进运行日志。
function captureConsoleError(fn) {
  var original = console.error;
  var messages = [];
  console.error = function (message) {
    messages.push(String(message));
  };
  try {
    fn();
  } finally {
    console.error = original;
  }
  return messages;
}

function chapter() {
  return XB.core.chapterById("prologue");
}

function nodesOfType(type) {
  return chapter().nodes.filter(function (node) {
    return node.type === type;
  });
}

function nodeById(id) {
  return XB.core.locate("prologue", id).node;
}

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

function walkToEnd(state) {
  var guard = 0;
  while (guard < 200 && XB.core.currentNode(state).type !== "end") {
    XB.core.advance(state);
    guard += 1;
  }
  return guard;
}

check("S01", "defaults 形状与持久字段", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.SCENES, ["title", "map", "vn", "ending"], "SCENES");
  assertEqual(state.scene, "title", "scene");
  assertEqual(state.nodeId, null, "nodeId");
  assertEqual(state.chapterId, "prologue", "chapterId");
  assertEqual(state.stack, undefined, "不再有 stack");
  assertEqual(state.paused, false, "paused");
  assertEqual(XB.core.PERSIST_KEYS.length, 11, "持久字段数");
  assertEqual(Object.keys(XB.core.serialize(state)), XB.core.PERSIST_KEYS, "serialize 键");
});

check("S02", "合法存档 normalize 通过", function () {
  var result = XB.core.normalize(XB.core.serialize(XB.core.defaults()));
  assertEqual(result.issue, null, "issue");
  assertEqual(result.state.scene, "title", "scene");
  var roundTrip = XB.core.normalize(JSON.parse(JSON.stringify(XB.core.serialize(XB.core.defaults()))));
  assertEqual(roundTrip.issue, null, "JSON 往返 issue");
});

check("S03", "version-too-new", function () {
  var save = XB.core.serialize(XB.core.defaults());
  save.version = XB.core.SAVE_VERSION + 1;
  assertEqual(XB.core.normalize(save).issue, "version-too-new", "issue");
});

check("S04", "scene=vn 但节点不存在", function () {
  var save = XB.core.serialize(XB.core.defaults());
  save.scene = "vn";
  save.nodeId = "p999";
  assertEqual(XB.core.normalize(save).issue, "node", "issue");
});

check("S05", "locate 下标与未知节点", function () {
  assertEqual(XB.core.locate("prologue", "p001").index, 0, "p001");
  assertEqual(XB.core.locate("prologue", "p020").index, 17, "p020");
  assertEqual(XB.core.locate("prologue", "p021").index, 18, "p021");
  assertEqual(XB.core.locate("prologue", "p900").index, 49, "p900");
  assertEqual(XB.core.locate("prologue", "nope"), null, "未知节点");
});

check("S06", "startChapter 按 id 定位（无栈）", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.startChapter(state, "prologue"), true, "返回值");
  assertEqual(state.scene, "vn", "scene");
  assertEqual(state.nodeId, "p001", "nodeId");
  assertEqual(state.stack, undefined, "不再写栈");
  assertEqual(XB.core.startChapter(state, "prologue", "p013"), true, "指定节点");
  assertEqual(state.nodeId, "p013", "按 id 落点");
});

check("S07", "20 句推进到第一个选择节点", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  var guard = 0;
  while (XB.core.currentNode(state).type !== "choice" && guard < 40) {
    XB.core.advance(state);
    guard += 1;
  }
  assertEqual(XB.core.currentNode(state).id, "p021", "第一个选择节点");
  assertEqual(XB.core.currentNode(state).type, "choice", "p021 是选择");
});

check("S08", "serialize → JSON → normalize 往返", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  XB.core.advance(state);
  XB.core.advance(state);
  XB.core.setFlag(state, "item.door", true);
  state.codex.push("yudu");
  state.choices.push({
    chapter: "prologue",
    nodeId: "p021",
    option: "A",
    text: "带上这块门板",
    timedOut: false
  });
  var save = JSON.parse(JSON.stringify(XB.core.serialize(state)));
  var result = XB.core.normalize(save);
  assertEqual(result.issue, null, "issue");
  assertEqual(XB.core.serialize(result.state), save, "往返后的持久字段");
});

check("S09", "九章元数据", function () {
  var chapters = XB.story.chapters;
  assertEqual(chapters.map(function (c) { return c.id; }), ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi", "coda", "badend"], "章节 id");
  assertEqual(chapters.map(function (c) { return c.order; }), [1, 2, 3, 4, 5, 6, 7, 8, 9], "顺序");
  assertEqual(chapters.map(function (c) { return c.playable; }), [true, true, true, true, true, true, true, true, true], "九章全部可玩");
  assertEqual(chapters.map(function (c) { return c.nodes.length; }), [50, 51, 30, 42, 46, 51, 56, 13, 6], "九章节点数");
  assertEqual(chapters.map(function (c) { return c.hidden === true; }), [false, false, false, false, false, false, false, true, true], "只有 coda 与 badend 隐藏");
});

check("S10", "序章节点 id 唯一、七种类型齐全", function () {
  var nodes = chapter().nodes;
  assertEqual(nodes.length, 50, "节点数");
  var ids = nodes.map(function (node) { return node.id; });
  assertEqual(ids.length, new Set(ids).size, "id 唯一");
  var types = nodes.map(function (node) { return node.type; });
  var unique = types.filter(function (type, index) { return types.indexOf(type) === index; }).sort();
  assertEqual(unique, ["choice", "codex", "end", "line", "multichoice", "result", "title"], "类型集合");
  assertEqual(nodes[49].type, "end", "末节点是 end");
});

check("S11", "背景指令落在四处换景", function () {
  assertEqual(nodeById("p001").bg, "yudu_river", "p001.bg");
  assertEqual(nodeById("p006").bg, "yudu_night", "p006.bg");
  assertEqual(nodeById("p031").bg, "yudu_river", "p031.bg");
  assertEqual(nodeById("p039a").bg, "yudu_night", "p039a.bg");
  assertEqual(nodeById("p039b").bg, "yudu_night", "p039b.bg");
  assertEqual(nodeById("p043").bg, "xiangjiang_map", "p043.bg");
  var others = chapter().nodes.filter(function (node) {
    return node.bg && ["p001", "p006", "p031", "p039a", "p039b", "p043"].indexOf(node.id) === -1;
  });
  assertEqual(others.length, 0, "不该有第六处 bg");
});

check("S12", "序章全部台词与剧本源逐字一致", function () {
  var raw = fs.readFileSync(path.join(ROOT_DIR, "docs", "script", "00-prologue.md"), "utf8");
  var expected = [];
  raw.split(/\r?\n/).forEach(function (line) {
    var match = /^【([^】]+)】(.*)$/.exec(line);
    if (!match) return;
    if (["小游戏", "结算", "演出", "标题卡", "史实注", "结束"].indexOf(match[1]) !== -1) return;
    if (match[1].indexOf("if:") === 0) return;
    expected.push({ speaker: match[1], text: match[2] });
  });
  var actual = nodesOfType("line").map(function (node) {
    return { speaker: node.speaker, text: node.text };
  });
  assertEqual(actual, expected, "逐句比对");
});

check("S13", "台词长度与红线", function () {
  nodesOfType("line").forEach(function (node) {
    assert(typeof node.text === "string" && node.text.length > 0, node.id + " 空台词");
    assert(Array.from(node.text).length <= 40, node.id + " 超过 40 字");
    BANNED.concat(REAL).forEach(function (word) {
      assert(node.text.indexOf(word) === -1, node.id + " 含「" + word + "」");
    });
  });
});

check("S14", "存档体积与字段", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  for (var i = 0; i < 9; i += 1) XB.core.advance(state);
  state.settings.volume = 0.42;
  var json = JSON.stringify(XB.core.serialize(state));
  var bytes = new TextEncoder().encode(json).length;
  assert(bytes < 4096, "存档 " + bytes + " 字节");
  assertEqual(Object.keys(JSON.parse(json)), XB.core.PERSIST_KEYS, "存档字段");
});

check("S15", "art.js 契约：SCENES 与四个方法", function () {
  assert(XB.art && typeof XB.art === "object", "XB.art 缺失");
  assert(Array.isArray(XB.art.SCENES), "SCENES 不是数组");
  ["mount", "paint", "resize", "rng"].forEach(function (name) {
    assert(typeof XB.art[name] === "function", name + " 不是函数");
  });
});

check("S16", "rng 同种子同序列、异种子不同", function () {
  var first = [];
  var second = [];
  var other = [];
  var a = XB.art.rng("title");
  var b = XB.art.rng("title");
  var c = XB.art.rng("map");
  for (var i = 0; i < 8; i += 1) {
    first.push(a());
    second.push(b());
    other.push(c());
  }
  assertEqual(first, second, "同种子应一致");
  assert(JSON.stringify(first) !== JSON.stringify(other), "异种子应不同");
  first.forEach(function (value) {
    assert(value >= 0 && value < 1, "随机数应在 [0,1)");
  });
});

check("S17", "SCENES 覆盖四场景，story 背景全部命中", function () {
  assertEqual(XB.art.SCENES.length, 17, "SCENES 数量");
  ["title", "map", "yudu_river", "yudu_night", "xiangjiang_ford", "xiangjiang_map", "zunyi_hall", "jinsha_river", "luding_bridge", "grass_marsh", "wuqi_dawn", "wuqi_wall"].forEach(function (id) {
    assert(XB.art.SCENES.indexOf(id) !== -1, "SCENES 缺 " + id);
  });
  XB.story.chapters.forEach(function (item) {
    item.nodes.forEach(function (node) {
      if (node.bg) assert(XB.art.SCENES.indexOf(node.bg) !== -1, node.id + " 的 bg 不在 SCENES");
    });
  });
});

check("S18", "47 条旗标与八项设置默认值", function () {
  var flags = XB.core.FLAG_DEFAULTS;
  assertEqual(Object.keys(flags).sort(), [
    "choice.jinsha.kettle", "choice.jinsha.main", "choice.jinsha.trips", "choice.jinsha.wounded",
    "choice.luding.door", "choice.xiangjiang.abandoned",
    "choice.xiangjiang.take.files", "choice.xiangjiang.take.medkit", "choice.xiangjiang.take.press",
    "choice.xiangjiang.take.radio", "choice.xiangjiang.take.silver", "choice.xiangjiang.take.xray",
    "choice.zunyi.admit", "choice.zunyi.missed", "condition", "doorOutcome",
    "fate.all.dead", "fate.badend", "fate.dongsheng.dead", "fate.feimao.dead", "fate.lin.dead",
    "fate.player.dead", "fate.seven5", "fate.zaowang.dead", "fire", "grass.settled", "had.door",
    "help.used", "inventory.giftBarley",
    "item.barley", "item.door", "item.homepot", "item.medicine", "item.pot", "item.raincloth", "item.shoes",
    "lights_lost", "load", "memory.help", "quality.dongsheng", "quality.feimao", "quality.zaowang",
    "rescues", "strain", "strain.dying", "strain.hurt", "trust"
  ], "旗标键");
  ["item.door", "item.pot", "item.medicine", "item.barley", "item.homepot", "item.raincloth", "item.shoes"].forEach(function (key) {
    assertEqual(flags[key], false, key);
  });
  ["choice.jinsha.main", "choice.jinsha.wounded", "choice.jinsha.kettle", "choice.luding.door"].forEach(function (key) {
    assertEqual(flags[key], false, key);
  });
  ["fate.all.dead", "fate.badend", "fate.dongsheng.dead", "fate.feimao.dead", "fate.lin.dead",
    "fate.player.dead", "fate.seven5", "fate.zaowang.dead", "grass.settled", "had.door",
    "help.used", "inventory.giftBarley", "memory.help", "strain.dying", "strain.hurt"].forEach(function (key) {
    assertEqual(flags[key], false, key);
  });
  assertEqual(flags.load, 0, "load");
  assertEqual(flags.trust, 0, "trust");
  assertEqual(flags.strain, 0, "strain");
  assertEqual(flags.rescues, 0, "rescues");
  assertEqual(flags.condition, 3, "condition");
  assertEqual(flags["quality.feimao"], 0, "quality.feimao");
  assertEqual(flags.doorOutcome, "none", "doorOutcome");
  assertEqual(flags.fire, 50, "fire");
  assertEqual(flags.lights_lost, 0, "lights_lost");
  assertEqual(flags["choice.xiangjiang.abandoned"], [], "abandoned");
  assertEqual(flags["choice.zunyi.missed"], 0, "missed");
  assertEqual(flags["choice.zunyi.admit"], 0, "admit");
  assertEqual(flags["choice.jinsha.trips"], 0, "trips");
  assertEqual(Object.keys(XB.core.DEFAULT_SETTINGS).sort(), ["ambienceVolume", "musicVolume", "muted", "reducedMotion", "skipSeen", "textScale", "textSpeed", "volume"], "设置键");
  assertEqual(XB.core.DEFAULT_SETTINGS.textSpeed, 30, "textSpeed");
  assertEqual(XB.core.DEFAULT_SETTINGS.textScale, 1, "textScale");
});

check("S19", "setFlag 增量、夹取与拒绝", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.setFlag(state, "item.door", true), true, "写布尔");
  assertEqual(state.flags["item.door"], true, "item.door 值");
  assertEqual(state.inventory.door, true, "inventory.door 镜像");
  assertEqual(XB.core.setFlag(state, "fire", "+10"), true, "增量");
  assertEqual(state.flags.fire, 60, "50+10");
  assertEqual(XB.core.setFlag(state, "fire", "+100"), true, "上限增量");
  assertEqual(state.flags.fire, 100, "夹到 100");
  assertEqual(XB.core.setFlag(state, "trust", "-5"), true, "下限增量");
  assertEqual(state.flags.trust, 0, "夹到 0");
  assertEqual(XB.core.setFlag(state, "load", "+2"), true, "行囊增量");
  assertEqual(state.flags.load, 2, "行囊 2");
  var rejected = captureConsoleError(function () {
    assertEqual(XB.core.setFlag(state, "ending.done", true), false, "拒绝 ending.*");
    assertEqual(XB.core.setFlag(state, "card.x", true), false, "拒绝 card.*");
  });
  assertEqual(rejected.length, 2, "越权写入应报错两次");
  assert(rejected[0].indexOf("ending.done") !== -1, "报错信息带路径");
  assertEqual(state.flags["ending.done"], undefined, "没写进去");
  assertEqual(XB.core.setFlag(state, "memory.mother", true), true, "记忆旗标可写");
});

check("S20", "when 可见性与跳过不可见节点", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.isVisible(state, nodeById("p022b")), true, "默认走 b 支");
  assertEqual(XB.core.isVisible(state, nodeById("p022a")), false, "默认不走 a 支");
  // nextVisible 的 fromIndex 是“从这一下标开始找”，所以 p021 的后继从它的下标 +1 起算
  var afterP021 = XB.core.locate("prologue", "p021").index + 1;
  assertEqual(XB.core.nextVisible(state, chapter(), afterP021).id, "p022b", "p021 之后是 p022b");
  XB.core.setFlag(state, "item.door", true);
  assertEqual(XB.core.isVisible(state, nodeById("p022a")), true, "有门板走 a 支");
  assertEqual(XB.core.isVisible(state, nodeById("p022b")), false, "有门板不走 b 支");
  assertEqual(XB.core.nextVisible(state, chapter(), afterP021).id, "p022a", "p021 之后是 p022a");
  var state2 = XB.core.defaults();
  XB.core.setFlag(state2, "choice.prologue.lookback", true);
  assertEqual(XB.core.isVisible(state2, nodeById("p038a")), true, "回头看走 a 支");
  assertEqual(XB.core.isVisible(state2, nodeById("p038b")), false, "回头看不走 b 支");
});

check("S21", "applyChoice 写旗标与选择日志", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue", "p021");
  var option = XB.core.applyChoice(state, XB.core.currentNode(state), "A", false);
  assert(option, "结算返回选项");
  assertEqual(state.flags["item.door"], true, "item.door");
  assertEqual(state.flags["choice.prologue.door"], true, "record 旗标");
  assertEqual(state.flags.load, 2, "load");
  assertEqual(state.flags.fire, 60, "fire");
  assertEqual(state.choices.length, 1, "日志 1 条");
  assertEqual(state.choices[0], {
    chapter: "prologue",
    nodeId: "p021",
    option: "A",
    text: "带上这块门板",
    timedOut: false
  }, "日志字段");

  var state2 = XB.core.defaults();
  XB.core.startChapter(state2, "prologue", "p037");
  XB.core.applyChoice(state2, XB.core.currentNode(state2), "B", true);
  assertEqual(state2.flags["choice.prologue.lookback"], false, "record 写 false");
  assertEqual(state2.choices[0].timedOut, true, "超时标记");
  var rejected = captureConsoleError(function () {
    assertEqual(XB.core.applyChoice(state2, XB.core.currentNode(state2), "Z", false), null, "未知选项返回 null");
  });
  assertEqual(rejected.length, 1, "未知选项应报错一次");
  assertEqual(state2.choices.length, 1, "未知选项不写日志");
});

check("S22", "序章结构统计与分支同位置", function () {
  var nodes = chapter().nodes;
  assertEqual(nodes.length, 50, "节点数");
  assertEqual(nodesOfType("line").length, 43, "line");
  assertEqual(nodesOfType("choice").length, 2, "choice");
  assertEqual(nodesOfType("multichoice").length, 1, "multichoice");
  assertEqual(nodesOfType("result").length, 1, "result");
  assertEqual(nodesOfType("title").length, 1, "title");
  assertEqual(nodesOfType("codex").length, 1, "codex");
  assertEqual(nodesOfType("end").length, 1, "end");
  // a/b 两支必须相邻，运行期只会落一个
  [["p022a", "p022b"], ["p029a", "p029b"], ["p038a", "p038b"], ["p039a", "p039b"]].forEach(function (pair) {
    var first = XB.core.locate("prologue", pair[0]).index;
    var second = XB.core.locate("prologue", pair[1]).index;
    assert(second === first + 2 || second === first + 1, pair.join("/") + " 不相邻");
  });
});

check("S23", "存档 roundtrip 保留选择与图鉴", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue", "p021");
  XB.core.applyChoice(state, XB.core.currentNode(state), "B", true);
  state.codex.push("yudu");
  state.settings.textScale = 1.15;
  state.settings.skipSeen = true;
  var save = JSON.parse(JSON.stringify(XB.core.serialize(state)));
  var result = XB.core.normalize(save);
  assertEqual(result.issue, null, "issue");
  assertEqual(result.state.choices[0].timedOut, true, "超时保留");
  assertEqual(result.state.codex, ["yudu"], "图鉴保留");
  assertEqual(result.state.settings.textScale, 1.15, "设置保留");
  assertEqual(XB.core.serialize(result.state), save, "整体往返");
});

check("S24", "p900 指向湘江且不再前进", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue", "p900");
  assertEqual(XB.core.currentNode(state).next, "xiangjiang", "next");
  assertEqual(XB.core.advance(state).id, "p900", "end 再推进返回自身");
  assertEqual(XB.core.currentNode(state).id, "p900", "end 不移动");
  assertEqual(XB.core.chapterById("xiangjiang").playable, true, "湘江已接上");
  assertEqual(XB.core.chapterById("xiangjiang").nodes[0].id, "x001", "湘江首节点");
});

check("S25", "engine 已接多选、无小游戏依赖", function () {
  var engine = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "engine.js"), "utf8"));
  assert(/XB\.art\b/.test(engine), "engine 没接 XB.art");
  assert(engine.indexOf("applyMultiChoice") !== -1 && engine.indexOf("renderMultiChoice") !== -1, "engine 没接多选");
  assert(!/XB\.minigames\b/.test(engine), "engine 仍接 XB.minigames");
  assert(!/fetch\s*\(|XMLHttpRequest|document\.write|\.innerHTML\b/.test(engine), "engine 含禁用 API");
  assert(!/type\s*=\s*["']module["']/.test(engine), "engine 不是 module");
});

check("S26", "默认旗标一路走到 p900，没有隐藏 end", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  var guard = walkToEnd(state);
  assert(guard < 200, "200 步内没走到 end");
  assertEqual(XB.core.currentNode(state).id, "p900", "终点");
  var state2 = XB.core.defaults();
  XB.core.setFlag(state2, "item.door", true);
  XB.core.setFlag(state2, "choice.prologue.lookback", true);
  XB.core.startChapter(state2, "prologue");
  var guard2 = walkToEnd(state2);
  assert(guard2 < 200, "带门板分支也走得到 end");
  assertEqual(XB.core.currentNode(state2).id, "p900", "带门板终点");
});

check("S27", "多选 API：行囊 4 格与半格单位回填", function () {
  assertEqual(typeof XB.core.applyMultiChoice, "function", "applyMultiChoice 缺失");
  var node = XB.core.locate("prologue", "p024").node;
  assertEqual(node.type, "multichoice", "p024 类型");
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue", "p024");
  var picked = XB.core.applyMultiChoice(state, node, ["medicine", "homepot"]);
  assert(picked, "结算失败");
  assertEqual(state.flags["item.medicine"], true, "medicine");
  assertEqual(state.flags["item.homepot"], true, "homepot");
  assertEqual(state.flags.load, 5, "药 1 + 铁锅 4 = 5 半格");
  assertEqual(state.inventory.items, ["roster", "pencil", "medicine", "pot"], "背包");
  assertEqual(state.choices[state.choices.length - 1].option, "MULTI", "MULTI 日志");
  assertEqual(XB.core.applyMultiChoice(state, node, ["medicine", "barley", "homepot", "raincloth", "shoes"]), null, "超过 8 半格应拒绝");
  assertEqual(XB.core.applyMultiChoice(state, node, ["nope"]), null, "未知 id 应拒绝");
});

check("S28", "弃物 3 选写留岸数组与 take 布尔", function () {
  var node = XB.core.locate("xiangjiang", "x015").node;
  assertEqual(node.type, "multichoice", "x015 类型");
  assertEqual([node.min, node.max], [3, 3], "恰好三样");
  var state = XB.core.defaults();
  XB.core.startChapter(state, "xiangjiang", "x015");
  var summary = XB.core.applyMultiChoice(state, node, ["xray", "press", "files"]);
  assert(summary, "结算失败");
  assertEqual(state.flags["choice.xiangjiang.abandoned"], ["medkit", "radio", "silver"], "留岸三样");
  assertEqual(state.flags["choice.xiangjiang.take.xray"], true, "xray 上船");
  assertEqual(state.flags["choice.xiangjiang.take.medkit"], false, "medkit 留岸");
  assertEqual(state.flags.load, 0, "弃物不重算行囊");
});

check("S29", "小游戏文件/入口已移除", function () {
  assert(!fs.existsSync(path.join(PROJECT_DIR, "minigames.js")), "minigames.js 还在");
  var html = fs.readFileSync(path.join(PROJECT_DIR, "index.html"), "utf8");
  assert(html.indexOf("minigame") === -1, "index.html 还有小游戏入口");
  var engine = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "engine.js"), "utf8"));
  assert(engine.indexOf("soloMode") === -1 && engine.indexOf("?minigame") === -1, "engine 还有小游戏调试入口");
  assert(!XB.minigames, "运行时仍挂 XB.minigames");
});

check("S30", "默认旗标：abandoned 数组、trips/missed/lights 夹取", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.setFlag(state, "choice.xiangjiang.abandoned", ["silver", "door", "silver", "xray"]), true, "写 abandoned");
  assertEqual(state.flags["choice.xiangjiang.abandoned"], ["xray", "silver", "door"], "去重固定顺序");
  assertEqual(XB.core.setFlag(state, "choice.jinsha.trips", 99), true, "写 trips");
  assertEqual(state.flags["choice.jinsha.trips"], 18, "trips 夹到 18");
  assertEqual(XB.core.setFlag(state, "choice.zunyi.admit", 2), true, "写 admit");
  assertEqual(state.flags["choice.zunyi.admit"], 2, "admit 2");
  assertEqual(XB.core.setFlag(state, "choice.zunyi.admit", 99), true, "admit 上限");
  assertEqual(state.flags["choice.zunyi.admit"], 3, "admit 夹到 3");
  assertEqual(XB.core.setFlag(state, "choice.zunyi.missed", 5), true, "写 missed");
  assertEqual(state.flags["choice.zunyi.missed"], 1, "missed 夹到 1");
  assertEqual(XB.core.setFlag(state, "lights_lost", 99), true, "写 lights");
  assertEqual(state.flags.lights_lost, 22, "lights 夹到 22");
  var errors = captureConsoleError(function () {
    assertEqual(XB.core.setFlag(state, "choice.xiangjiang.abandoned", "xray"), false, "abandoned 只收数组");
  });
  assertEqual(errors.length, 1, "非数组应报错一次");
});

check("S31", "p024 多选字段与 p025 结果来源", function () {
  var p024 = XB.core.locate("prologue", "p024").node;
  assertEqual(p024.type, "multichoice", "p024 类型");
  assertEqual([p024.min, p024.max], [0, 5], "p024 数量");
  assertEqual(p024.slotLoad, undefined, "p024 不再用静态 slotLoad");
  assertEqual(p024.options.length, 5, "p024 五件");
  var p025 = XB.core.locate("prologue", "p025").node;
  assertEqual(p025.type, "result", "p025 类型");
  assertEqual(p025.source, "items", "p025 source");
});

check("S32", "结算重建与结果页字段", function () {
  var engine = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "engine.js"), "utf8"));
  ["PACK_ITEMS", "ABANDON_ITEMS", "buildResultView", 'node.source === "items"', 'node.source === "abandon"', "choice.xiangjiang.abandoned", "vn-result__stats"].forEach(function (needle) {
    assert(engine.indexOf(needle) !== -1, "缺 " + needle);
  });
  assert(engine.indexOf("lastMinigameResult") === -1, "engine 仍依赖小游戏结果");
  assert(!/\bsuccess\b|\bscore\b/i.test(engine), "engine 结果出现 success/score");
});

check("S33", "四段选择无评分字段、无小游戏画面词", function () {
  var story = JSON.stringify(XB.story);
  assert(!/\bsuccess\b|\bscore\b|Game Over|gameOver/i.test(story), "剧情出现评分/Game Over");
  var engine = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "engine.js"), "utf8"));
  assert(!/成功|失败/.test(engine.slice(engine.indexOf("buildResultView"), engine.indexOf("renderResult"))), "结算页出现成功/失败大字");
});


check("S34", "七章默认路径 p001→w900→ending，无断链", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  var ends = [];
  var guard = 0;
  while (guard < 600) {
    var node = XB.core.currentNode(state);
    if (node.type === "end") {
      ends.push(node.id);
      if (node.next === "ending") break;
      assert(XB.core.startChapter(state, node.next), node.id + " 的下一章 " + node.next + " 起不来");
    } else {
      XB.core.advance(state);
    }
    guard += 1;
  }
  assert(guard < 600, "600 步内没走到 ending");
  assertEqual(ends, ["p900", "x900", "z900", "j900", "l900", "g900", "w900"], "七章章末");
  assertEqual(XB.core.currentNode(state).next, "ending", "w900.next");
});

check("S35", "遵义 admit 0–3 累计，record 不覆盖", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "zunyi", "z019");
  XB.core.applyChoice(state, XB.core.currentNode(state), "A", false);
  XB.core.startChapter(state, "zunyi", "z022");
  XB.core.applyChoice(state, XB.core.currentNode(state), "A", false);
  XB.core.startChapter(state, "zunyi", "z025");
  XB.core.applyChoice(state, XB.core.currentNode(state), "A", false);
  assertEqual(state.flags["choice.zunyi.admit"], 3, "三次 A 应累计到 3");
  assertEqual(state.flags["choice.zunyi.missed"], 1, "第三组 A 记漏名");
  assertEqual(state.choices.length, 3, "三条选择日志");
  XB.core.startChapter(state, "zunyi", "z019");
  XB.core.applyChoice(state, XB.core.currentNode(state), "A", false);
  assertEqual(state.flags["choice.zunyi.admit"], 3, "第四次 A 夹在 3");
  assertEqual(state.choices.length, 4, "日志继续追加");
  assertEqual(state.choices[0].chapter, "zunyi", "日志章 id");
  assertEqual(state.choices[0].timedOut, false, "不计时");
});

check("S36", "章末记忆与进入吴起前置", function () {
  var map = XB.core.CHAPTER_MEMORY;
  assertEqual(Object.keys(map), ["xiangjiang", "zunyi", "luding", "grass"], "CHAPTER_MEMORY 键");
  assertEqual(XB.core.WUQI_MEMORY, ["memory.ximei", "memory.dongsheng", "memory.lin"], "WUQI_MEMORY");
  var state = XB.core.defaults();
  Object.keys(map).forEach(function (chapterId) {
    var key = map[chapterId];
    assertEqual(key.indexOf("memory."), 0, chapterId + " 记忆不是 memory.*");
    XB.core.setFlag(state, key, true);
    assertEqual(state.flags[key], true, key + " 未置 true");
    XB.core.setFlag(state, key, true);
    assertEqual(state.flags[key], true, key + " 重复置 true 变了");
  });
  XB.core.WUQI_MEMORY.forEach(function (key) {
    XB.core.setFlag(state, key, true);
    assertEqual(state.flags[key], true, key + " 未置 true");
  });
  assertEqual(XB.core.setFlag(state, "memory.luding_unknown", false), true, "memory bool 可写 false");
  assertEqual(state.flags["memory.luding_unknown"], false, "memory bool 值");
});

check("S37", "五卡五组边界与全灰/全亮", function () {
  function build(overrides) {
    var state = XB.core.defaults();
    Object.keys(overrides || {}).forEach(function (key) { state.flags[key] = overrides[key]; });
    return XB.core.buildEnding(state).cards;
  }
  function lit(cards, id) {
    return cards.filter(function (card) { return card.id === id; })[0].lit;
  }
  assertEqual(lit(build({ fire: 19 }), "ideal"), false, "fire 19 灰");
  assertEqual(lit(build({ fire: 20 }), "ideal"), true, "fire 20 亮");
  assertEqual(lit(build({ "choice.xiangjiang.hold": true }), "sacrifice"), true, "hold true 亮");
  assertEqual(lit(build({ "choice.zunyi.admit": 1 }), "truth"), false, "admit 1 灰");
  assertEqual(lit(build({ "choice.zunyi.admit": 2 }), "truth"), true, "admit 2 亮");
  assertEqual(lit(build({ "choice.jinsha.priority": "main" }), "overall"), true, "main 亮");
  assertEqual(lit(build({ "choice.jinsha.priority": "wounded" }), "overall"), false, "wounded 灰");
  assertEqual(lit(build({ trust: 3, "memory.zhang": true }), "people"), true, "trust3+记名亮");
  assertEqual(lit(build({ trust: 3, "memory.zhang": false }), "people"), false, "trust3 未记名灰");
  assertEqual(lit(build({ trust: 2, "memory.zhang": true }), "people"), false, "trust2 记名灰");
  var gray = build({ fire: 10, "choice.xiangjiang.hold": false, "choice.zunyi.admit": 0, "choice.jinsha.priority": "wounded", trust: 0, "memory.zhang": false });
  assertEqual(gray.filter(function (card) { return !card.lit; }).length, 5, "全灰 5 张");
  var all = build({ fire: 50, "choice.xiangjiang.hold": true, "choice.zunyi.admit": 2, "choice.jinsha.priority": "main", trust: 3, "memory.zhang": true });
  assertEqual(all.filter(function (card) { return card.lit; }).length, 5, "全亮 5 张");
});

check("S38", "ending normalize / 11 键 / 刷新", function () {
  var state = XB.core.defaults();
  state.scene = "ending";
  state.chapterId = "wuqi";
  state.nodeId = null;
  state.ending = XB.core.buildEnding(state);
  assertEqual(XB.core.isFullEnding(state.ending), true, "完整快照");
  var save = JSON.parse(JSON.stringify(XB.core.serialize(state)));
  var result = XB.core.normalize(save);
  assertEqual(result.issue, null, "normalize issue");
  assertEqual(result.state.scene, "ending", "scene");
  assertEqual(Object.keys(save), XB.core.PERSIST_KEYS, "11 键");
  var bytes = new TextEncoder().encode(JSON.stringify(save)).length;
  assert(bytes < 4096, "存档 " + bytes + "B");
  var broken = JSON.parse(JSON.stringify(save));
  delete broken.ending.cards;
  assertEqual(XB.core.normalize(broken).issue, "ending", "缺 cards 判 ending 坏档");
});

check("S39", "图鉴 0/7–7/7 与单一数据源", function () {
  var ids = XB.story.codex.map(function (card) { return card.id; });
  assertEqual(ids, ["yudu", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"], "七卡 id");
  assertEqual(new Set(ids).size, 7, "id 唯一");
  var state = XB.core.defaults();
  assertEqual(state.codex.length, 0, "初始 0/7");
  var normalized = XB.core.normalize(XB.core.serialize(state));
  assertEqual(normalized.state.codex.length, 0, "0/7 往返");
  state.codex = ids.slice();
  var seven = XB.core.normalize(XB.core.serialize(state));
  assertEqual(seven.issue, null, "7/7 issue");
  assertEqual(seven.state.codex, ids, "7/7 往返");
  ids.forEach(function (id) {
    assert(XB.core.codexById(id), "codexById 缺 " + id);
  });
});

check("S40", "点名状态机数据：动态 7/8 名、替答/漏答、快照保留", function () {
  var node = XB.core.locate("wuqi", "w026").node;
  assertEqual(node.type, "interact", "w026 类型");
  assertEqual(node.mode, "rollcall", "mode");
  assertEqual(node.duration, 45, "duration");
  assertEqual(node.names, undefined, "静态 names 应已删除");
  var six = XB.core.resolveRollCall(XB.core.defaults(), false);
  assertEqual(six.length, 7, "常规 7 名");
  assertEqual(six.filter(function (entry) { return entry.status === "absent"; }).map(function (entry) { return entry.id; }), ["zhou"], "默认只有老周缺席");
  var eight = XB.core.resolveRollCall(XB.core.defaults(), true);
  assertEqual(eight.length, 8, "空页 8 名");
  var manzi = eight[7];
  assertEqual({ id: manzi.id, status: manzi.status, answeredBy: manzi.answeredBy }, { id: "manzi", status: "absent", answeredBy: "dongsheng" }, "满崽由冬生代答");
  var state = XB.core.defaults();
  state.ending = { names: six.map(function (entry) { return { id: entry.id, name: entry.name, status: "player" }; }), answered: 7, missed: 0 };
  var full = XB.core.buildEnding(state);
  assertEqual(full.answered, 7, "全答 answered");
  assertEqual(full.missed, 0, "全答 missed");
  assertEqual(full.names.length, 7, "全答 names");
  state.ending = { names: six.map(function (entry) { return { id: entry.id, name: entry.name, status: "missed" }; }), answered: 0, missed: 7 };
  var missed = XB.core.buildEnding(state);
  assertEqual(missed.missed, 7, "漏答 missed");
  assertEqual(missed.answered, 0, "漏答 answered");
  assertEqual(XB.core.setFlag(state, "memory.rollcall_missed_any", true), true, "漏答旗标");
  assert(!/\bsuccess\b|\bscore\b/i.test(JSON.stringify(node)), "点名不评分");
});

check("S41", "音频 API / 9 床 / 12 cue", function () {
  assertEqual(XB.audio.BEDS.length, 9, "BEDS");
  assertEqual(XB.audio.CUES.length, 12, "CUES");
  ["unlock", "applySettings", "setScene", "bedForScene", "setDuck", "cue", "suspend", "resume", "stats", "isReady"].forEach(function (name) {
    assertEqual(typeof XB.audio[name], "function", "XB.audio." + name);
  });
  assertEqual(XB.audio.isReady(), false, "加载时不创建 AudioContext");
});

check("S42", "原创五音动机频率与顺序", function () {
  var motif = XB.audio.MOTIF;
  assertEqual(motif.map(function (note) { return note.note; }), ["D4", "F4", "G4", "A4", "C5"], "音名");
  assertEqual(motif.map(function (note) { return note.freq; }), [293.66, 349.23, 392.00, 440.00, 523.25], "频率");
  assertEqual(motif.map(function (note) { return note.start; }), [0, 0.55, 0.90, 1.45, 1.80], "起点");
  assertEqual(motif.map(function (note) { return note.dur; }), [0.45, 0.25, 0.45, 0.25, 0.90], "时值");
});

check("S43", "15 个剧情背景全部有床", function () {
  var bgs = {};
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.bg) bgs[node.bg] = true;
    });
  });
  assertEqual(Object.keys(bgs).length, 15, "剧情背景数");
  Object.keys(bgs).forEach(function (bg) {
    assert(XB.audio.BED_BY_SCENE[bg], "缺床 " + bg);
  });
  ["title", "map", "ending"].forEach(function (scene) {
    assert(XB.audio.BED_BY_SCENE[scene], "缺显式场景 " + scene);
  });
  assertEqual(XB.audio.bedForScene("no_such_scene"), "wind_title", "未知回退");
});

check("S44", "cue 白名单与无 setInterval", function () {
  assertEqual(new Set(XB.audio.CUES).size, 12, "cue 唯一");
  assertEqual(XB.audio.cue("no_such_cue"), false, "白名单外不发声");
  assertEqual(XB.audio.cue("chapter"), false, "无 ctx 不发声");
  var engine = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "engine.js"), "utf8"));
  assert(!/setInterval\s*\(/.test(engine), "engine 不应 setInterval");
});

check("S45", "无上下文时 applySettings 不抛错", function () {
  XB.audio.applySettings({ volume: 0.33, muted: true });
  assertEqual(XB.audio.stats().volume, 0.33, "音量已记录");
  assertEqual(XB.audio.stats().muted, true, "静音已记录");
  assertEqual(XB.audio.stats().state, "locked", "无 ctx 仍 locked");
  XB.audio.applySettings({ volume: 0.6, muted: false });
});

check("S46", "fx 上限与 reduced 分支不抛错", function () {
  var limits = XB.fx.LIMITS;
  assert(limits.flashMs <= 150 && limits.flashGapMs >= 2000, "闪白上限");
  assert(limits.shakeMs <= 200 && limits.shakePx <= 2, "震动上限");
  assert(limits.strikeMs <= 500, "划名上限");
  XB.fx.setReduced(true);
  assertEqual(XB.fx.isReduced(), true, "reduced 开");
  assertEqual(XB.fx.transition("title"), false, "reduced 不转场");
  assertEqual(XB.fx.flash(), false, "reduced 不闪白");
  assertEqual(XB.fx.shake(), false, "reduced 不震动");
  XB.fx.reset();
  XB.fx.setReduced(false);
  assertEqual(XB.fx.isReduced(), false, "reduced 关");
});

if (failures.length) {
  failures.forEach(function (line) {
    console.log("× " + line);
  });
  console.log("\n共 " + failures.length + " 项失败");
  process.exitCode = 1;
} else {
  console.log("OK：纯状态层烟测 46 项全绿");
}
