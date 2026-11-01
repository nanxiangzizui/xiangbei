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

function lineNodes() {
  return XB.core.chapterById("prologue").nodes.filter(function (node) {
    return node.type === "line";
  });
}

function nodeById(id) {
  return XB.core.locate("prologue", id).node;
}

check("S01", "defaults 形状与持久字段", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.SCENES, ["title", "map", "vn", "choice", "minigame", "result", "codex", "ending"], "SCENES");
  assertEqual(state.scene, "title", "scene");
  assertEqual(state.nodeId, null, "nodeId");
  assertEqual(state.chapterId, "prologue", "chapterId");
  assertEqual(state.stack, [], "stack");
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
  assertEqual(XB.core.locate("prologue", "p900").index, 20, "p900");
  assertEqual(XB.core.locate("prologue", "nope"), null, "未知节点");
});

check("S06", "startChapter 重建栈", function () {
  var state = XB.core.defaults();
  assertEqual(XB.core.startChapter(state, "prologue"), true, "返回值");
  assertEqual(state.scene, "vn", "scene");
  assertEqual(state.nodeId, "p001", "nodeId");
  assertEqual(state.stack.length, 1, "stack 长度");
});

check("S07", "20 句推进到 end 后不再前进", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  for (var i = 0; i < 20; i += 1) XB.core.advance(state);
  assertEqual(XB.core.currentNode(state).id, "p900", "第 20 次推进后");
  assertEqual(XB.core.advance(state).id, "p900", "end 再推进");
  assertEqual(XB.core.currentNode(state).id, "p900", "end 不移动");
});

check("S08", "serialize → JSON → normalize 往返", function () {
  var state = XB.core.defaults();
  XB.core.startChapter(state, "prologue");
  XB.core.advance(state);
  XB.core.advance(state);
  state.flags.hasDoorPlank = true;
  state.inventory.door = true;
  state.codex.push("yudu");
  state.choices.push({ id: "prologue.door", value: "A" });
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
  chapters.slice(1).forEach(function (chapter) {
    assertEqual(chapter.playable, false, chapter.id + " 未接上");
    assertEqual(chapter.nodes.length, 0, chapter.id + " 节点应为空");
  });
});

check("S10", "序章节点 id 唯一、类型合法", function () {
  var nodes = XB.core.chapterById("prologue").nodes;
  assertEqual(nodes.length, 21, "节点数");
  var ids = nodes.map(function (node) { return node.id; });
  assertEqual(ids.length, new Set(ids).size, "id 唯一");
  nodes.forEach(function (node) {
    assert(node.type === "line" || node.type === "end", node.id + " 类型");
  });
  var end = nodes[nodes.length - 1];
  assertEqual(end.type, "end", "末节点是 end");
  assertEqual(end.next, "map", "end.next");
});

check("S11", "背景指令落在 p001 / p006", function () {
  var nodes = lineNodes();
  assertEqual(nodeById("p001").bg, "yudu_river", "p001.bg");
  assertEqual(nodeById("p006").bg, "yudu_night", "p006.bg");
  nodes.forEach(function (node) {
    if (node.id === "p001" || node.id === "p006") return;
    assert(node.bg === undefined, node.id + " 不应有 bg");
  });
});

check("S12", "20 句与剧本源逐字一致", function () {
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
  var actual = lineNodes().map(function (node) {
    return { speaker: node.speaker, text: node.text };
  });
  assertEqual(actual, expected, "逐句比对");
});

check("S13", "台词长度与红线", function () {
  lineNodes().forEach(function (node) {
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
  state.flags.hasDoorPlank = true;
  var json = JSON.stringify(XB.core.serialize(state));
  var bytes = new TextEncoder().encode(json).length;
  assert(bytes < 4096, "存档 " + bytes + " 字节");
  assertEqual(Object.keys(JSON.parse(json)), XB.core.PERSIST_KEYS, "存档字段");
});

if (failures.length) {
  failures.forEach(function (line) {
    console.log("× " + line);
  });
  console.log("\n共 " + failures.length + " 项失败");
  process.exitCode = 1;
} else {
  console.log("OK：纯状态层烟测 14 项全绿");
}
