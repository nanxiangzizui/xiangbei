#!/usr/bin/env node
// 纯状态层烟测（开发期脚本，不进运行时）：node project/tools/smoke.js
// 不依赖浏览器：把四个脚本按页面顺序放进 vm，只调 XB.core 与 XB.story。
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { BANNED, REAL } = require("./redlines");

const PROJECT_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(PROJECT_DIR, "..");
const GAME_FILES = ["art.js", "story.js", "minigames.js", "engine.js"];

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
  assertEqual(XB.core.SCENES, ["title", "map", "vn"], "SCENES");
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
  save.version = 2;
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
  assertEqual(XB.core.locate("prologue", "p020").index, 19, "p020");
  assertEqual(XB.core.locate("prologue", "p021").index, 20, "p021");
  assertEqual(XB.core.locate("prologue", "p900").index, 47, "p900");
  assertEqual(XB.core.locate("prologue", "nope"), null, "未知节点");
});

check("S06", "startChapter 按 id 定位（无栈）", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.startChapter(state, "prologue"), true, "返回值");
  assertEqual(state.scene, "vn", "scene");
  assertEqual(state.nodeId, "p001", "nodeId");
  assertEqual(state.stack, undefined, "不再写栈");
  assertEqual(XB.core.startChapter(state, "prologue", "p012"), true, "指定节点");
  assertEqual(state.nodeId, "p012", "按 id 落点");
});

check("S07", "20 句推进到第一个选择节点", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  for (var i = 0; i < 20; i += 1) XB.core.advance(state);
  assertEqual(XB.core.currentNode(state).id, "p021", "第 20 次推进后");
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

check("S09", "七章元数据", function () {
  var chapters = XB.story.chapters;
  assertEqual(chapters.map(function (c) { return c.id; }), ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"], "章节 id");
  assertEqual(chapters.map(function (c) { return c.order; }), [1, 2, 3, 4, 5, 6, 7], "顺序");
  assertEqual(chapters[0].playable, true, "序章可玩");
  chapters.slice(1).forEach(function (item) {
    assertEqual(item.playable, false, item.id + " 未接上");
    assertEqual(item.nodes.length, 0, item.id + " 节点应为空");
  });
});

check("S10", "序章节点 id 唯一、七种类型齐全", function () {
  var nodes = chapter().nodes;
  assertEqual(nodes.length, 48, "节点数");
  var ids = nodes.map(function (node) { return node.id; });
  assertEqual(ids.length, new Set(ids).size, "id 唯一");
  var types = nodes.map(function (node) { return node.type; });
  var unique = types.filter(function (type, index) { return types.indexOf(type) === index; }).sort();
  assertEqual(unique, ["choice", "codex", "end", "line", "minigame", "result", "title"], "类型集合");
  assertEqual(nodes[47].type, "end", "末节点是 end");
});

check("S11", "背景指令落在四处换景", function () {
  assertEqual(nodeById("p001").bg, "yudu_river", "p001.bg");
  assertEqual(nodeById("p006").bg, "yudu_night", "p006.bg");
  assertEqual(nodeById("p031").bg, "yudu_river", "p031.bg");
  assertEqual(nodeById("p039").bg, "yudu_night", "p039.bg");
  var others = chapter().nodes.filter(function (node) {
    return node.bg && ["p001", "p006", "p031", "p039"].indexOf(node.id) === -1;
  });
  assertEqual(others.length, 0, "不该有第五处 bg");
});

check("S12", "前 20 句与剧本源逐字一致", function () {
  var raw = fs.readFileSync(path.join(ROOT_DIR, "docs", "script", "00-prologue.md"), "utf8");
  var lines = raw.split(/\r?\n/);
  var expected = [];
  for (var i = 8; i <= 30; i += 1) {
    var line = lines[i];
    if (!line) continue;
    var match = /^【([^】]+)】(.*)$/.exec(line);
    if (!match) continue;
    expected.push({ speaker: match[1], text: match[2] });
  }
  assertEqual(expected.length, 20, "源文件句数");
  var actual = nodesOfType("line").slice(0, 20).map(function (node) {
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
  ["title", "map", "yudu_river", "yudu_night"].forEach(function (id) {
    assert(XB.art.SCENES.indexOf(id) !== -1, "SCENES 缺 " + id);
  });
  assert(XB.art.SCENES.length >= 4, "SCENES 少于 4 个");
  XB.story.chapters.forEach(function (item) {
    item.nodes.forEach(function (node) {
      if (node.bg) assert(XB.art.SCENES.indexOf(node.bg) !== -1, node.id + " 的 bg 不在 SCENES");
    });
  });
});

check("S18", "九条旗标与六项设置默认值", function () {
  var flags = XB.core.FLAG_DEFAULTS;
  assertEqual(Object.keys(flags).sort(), ["choice.jinsha.trips", "choice.xiangjiang.abandoned", "choice.zunyi.missed", "fire", "item.door", "item.pot", "lights_lost", "load", "trust"], "旗标键");
  assertEqual(flags["item.door"], false, "item.door");
  assertEqual(flags["item.pot"], false, "item.pot");
  assertEqual(flags.load, 0, "load");
  assertEqual(flags.trust, 0, "trust");
  assertEqual(flags.fire, 50, "fire");
  assertEqual(flags.lights_lost, 0, "lights_lost");
  assertEqual(flags["choice.xiangjiang.abandoned"], [], "abandoned");
  assertEqual(flags["choice.zunyi.missed"], 0, "missed");
  assertEqual(flags["choice.jinsha.trips"], 0, "trips");
  assertEqual(Object.keys(XB.core.DEFAULT_SETTINGS).sort(), ["muted", "reducedMotion", "skipSeen", "textScale", "textSpeed", "volume"], "设置键");
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
  // nextVisible 的 fromIndex 是“从这一下标开始找”，所以 p021 的后继从 21 起算
  assertEqual(XB.core.nextVisible(state, chapter(), 21).id, "p022b", "p021 之后是 p022b");
  XB.core.setFlag(state, "item.door", true);
  assertEqual(XB.core.isVisible(state, nodeById("p022a")), true, "有门板走 a 支");
  assertEqual(XB.core.isVisible(state, nodeById("p022b")), false, "有门板不走 b 支");
  assertEqual(XB.core.nextVisible(state, chapter(), 21).id, "p022a", "p021 之后是 p022a");
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
  assertEqual(nodes.length, 48, "节点数");
  assertEqual(nodesOfType("line").length, 41, "line");
  assertEqual(nodesOfType("choice").length, 2, "choice");
  assertEqual(nodesOfType("minigame").length, 1, "minigame");
  assertEqual(nodesOfType("result").length, 1, "result");
  assertEqual(nodesOfType("title").length, 1, "title");
  assertEqual(nodesOfType("codex").length, 1, "codex");
  assertEqual(nodesOfType("end").length, 1, "end");
  // a/b 两支必须相邻，运行期只会落一个
  [["p022a", "p022b"], ["p029a", "p029b"], ["p038a", "p038b"]].forEach(function (pair) {
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
  assertEqual(XB.core.chapterById("xiangjiang").playable, false, "湘江仍未接上");
});

check("S25", "engine 已接 minigames、无外部加载", function () {
  var engine = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "engine.js"), "utf8"));
  assert(/XB\.minigames\b/.test(engine), "engine 没接 XB.minigames");
  assert(/XB\.art\b/.test(engine), "engine 没接 XB.art");
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

check("S27", "小游戏 API 与四关注册", function () {
  var mg = XB.minigames;
  assert(mg && typeof mg === "object", "XB.minigames 缺失");
  assertEqual(mg.SCENES, ["door", "abandon", "boat", "climb"], "SCENES");
  ["start", "stop", "isActive", "resize", "labelFor", "itemIds", "crewForTrust", "usedSlots", "canPack"].forEach(function (name) {
    assert(typeof mg[name] === "function", name + " 不是函数");
  });
  assert(Object.isFrozen(mg.RULES), "RULES 未冻结");
  assert(Object.isFrozen(mg.ITEMS), "ITEMS 未冻结");
  assertEqual(mg.itemIds("door").length, 8, "门板 8 件");
  assertEqual(mg.itemIds("abandon").length, 7, "弃物 7 件");
});

check("S28", "门板容量与船工纯函数", function () {
  assertEqual(XB.minigames.usedSlots([], true), 2, "空手+门板 2 格");
  assertEqual(XB.minigames.usedSlots(["medicine", "pot"], true), 5, "门板+药+锅 5 格");
  assertEqual(XB.minigames.canPack(["pot", "medicine", "barley"], "raincloth", true), false, "再装雨布超 6 格");
  assertEqual(XB.minigames.canPack(["pot", "medicine", "barley"], "raincloth", false), true, "无门板 5 格可装");
  assertEqual(XB.minigames.crewForTrust(-1), 12, "trust 下限");
  assertEqual(XB.minigames.crewForTrust(0), 12, "trust 0");
  assertEqual(XB.minigames.crewForTrust(5), 37, "trust 5");
  assertEqual(XB.minigames.crewForTrust(6), 37, "trust 6 按 5");
});

check("S29", "start 失败可降级、stop/resize 幂等", function () {
  var errors = captureConsoleError(function () {
    assertEqual(XB.minigames.start({ gameId: "nope" }), false, "非法 id");
    assertEqual(XB.minigames.start({ gameId: "door" }), false, "无画布");
  });
  assert(errors.length >= 2, "失败应报错并返回 false");
  assertEqual(XB.minigames.isActive(), false, "未启动");
  XB.minigames.stop();
  XB.minigames.stop();
  XB.minigames.resize();
  XB.minigames.resize();
});

check("S30", "九条旗标：abandoned 数组、trips/missed/lights 夹取", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.setFlag(state, "choice.xiangjiang.abandoned", ["silver", "door", "silver", "xray"]), true, "写 abandoned");
  assertEqual(state.flags["choice.xiangjiang.abandoned"], ["xray", "silver", "door"], "去重固定顺序");
  assertEqual(XB.core.setFlag(state, "choice.jinsha.trips", 99), true, "写 trips");
  assertEqual(state.flags["choice.jinsha.trips"], 18, "trips 夹到 18");
  assertEqual(XB.core.setFlag(state, "choice.zunyi.missed", 5), true, "写 missed");
  assertEqual(state.flags["choice.zunyi.missed"], 1, "missed 夹到 1");
  assertEqual(XB.core.setFlag(state, "lights_lost", 99), true, "写 lights");
  assertEqual(state.flags.lights_lost, 22, "lights 夹到 22");
  var errors = captureConsoleError(function () {
    assertEqual(XB.core.setFlag(state, "choice.xiangjiang.abandoned", "xray"), false, "abandoned 只收数组");
  });
  assertEqual(errors.length, 1, "非数组应报错一次");
});

check("S31", "p024 config 与 p025 结果来源", function () {
  var p024 = XB.core.locate("prologue", "p024").node;
  assertEqual(p024.type, "minigame", "p024 类型");
  assertEqual(p024.game, "door", "p024 game");
  assertEqual(p024.config, { duration: 75, capacity: 6, doorCost: 2, items: 8 }, "p024 config");
  var p025 = XB.core.locate("prologue", "p025").node;
  assertEqual(p025.type, "result", "p025 类型");
  assertEqual(p025.source, "minigame", "p025 source");
  assertEqual(p025.game, "door", "p025 game");
});

check("S32", "结算重建与结果页字段", function () {
  var engine = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "engine.js"), "utf8"));
  ["applyMinigameResult", "buildResultView", "node.source !== \"minigame\"", "choice.xiangjiang.abandoned", "choice.jinsha.trips", "lights_lost", "vn-result__stats"].forEach(function (needle) {
    assert(engine.indexOf(needle) !== -1, "缺 " + needle);
  });
  assert(!/\bsuccess\b|\bscore\b/i.test(engine), "engine 结果出现 success/score");
});

check("S33", "四关代码无外部加载、无禁用画面词", function () {
  var code = stripComments(fs.readFileSync(path.join(PROJECT_DIR, "minigames.js"), "utf8"));
  assert(!/fetch\s*\(|XMLHttpRequest|import\s*\(|type\s*=\s*["']module["']|document\.write|\.innerHTML\b/.test(code), "minigames.js 含禁用 API");
  ["X 光机", "X光机", "Game Over", "gameOver", "牺牲"].forEach(function (word) {
    assert(code.indexOf(word) === -1, "出现「" + word + "」");
  });
  var parts = code.split("drawText(");
  parts.slice(1).forEach(function (part) {
    var call = part.slice(0, part.indexOf(");"));
    assert(!/成功|失败/.test(call), "画面出现成功/失败大字");
  });
});

if (failures.length) {
  failures.forEach(function (line) {
    console.log("× " + line);
  });
  console.log("\n共 " + failures.length + " 项失败");
  process.exitCode = 1;
} else {
  console.log("OK：纯状态层烟测 33 项全绿");
}
