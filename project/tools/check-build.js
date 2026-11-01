#!/usr/bin/env node
// 构建期自检（开发期脚本，不进运行时）：node project/tools/check-build.js
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");
const { BANNED, REAL } = require("./redlines");

const PROJECT_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(PROJECT_DIR, "..");
const JS_FILES = ["art.js", "story.js", "minigames.js", "engine.js"];
const SCRIPT_ORDER = ["art.js", "story.js", "minigames.js", "engine.js"];
const REQUIRED_IDS = [
  "stage", "scene-title", "scene-map", "scene-vn", "pause", "toast", "debug", "orientation",
  "title-menu", "map-stations", "map-route",
  "vn-bg", "vn-chapter", "vn-name", "vn-text", "vn-next"
];

const failures = [];
const notes = [];

function fail(id, message) {
  failures.push(id + " " + message);
}

function readProject(relative) {
  return fs.readFileSync(path.join(PROJECT_DIR, relative), "utf8");
}

function readRoot(relative) {
  return fs.readFileSync(path.join(ROOT_DIR, relative), "utf8");
}

// 去掉注释后再查禁用 API，避免注释里的字样误报
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

function checkCompile() {
  JS_FILES.forEach(function (file) {
    try {
      new vm.Script(readProject(file), { filename: file });
    } catch (err) {
      fail("C01", file + " 编译失败：" + err.message);
    }
  });
  notes.push("C01 OK 4 个 JS 可编译");
}

function checkForbiddenApis() {
  var patterns = [
    [/fetch\s*\(/, "fetch("],
    [/XMLHttpRequest/, "XMLHttpRequest"],
    [/\bimport\s*\(/, "import("],
    [/type\s*=\s*["']module["']/, "type=module"],
    [/\beval\s*\(/, "eval("],
    [/\.innerHTML\b/, "innerHTML"],
    [/document\.write\s*\(/, "document.write"]
  ];
  JS_FILES.forEach(function (file) {
    var code = stripComments(readProject(file));
    patterns.forEach(function (pair) {
      if (pair[0].test(code)) fail("C02", file + " 含 " + pair[1]);
    });
  });
  notes.push("C02 OK 无 fetch / XHR / ESM / eval / innerHTML / document.write");
}

function checkHtml() {
  var html = readProject("index.html");
  REQUIRED_IDS.forEach(function (id) {
    if (html.indexOf('id="' + id + '"') === -1) fail("C03", "index.html 缺 #" + id);
  });
  var tags = html.match(/<script\b[^>]*>/g) || [];
  var srcs = [];
  tags.forEach(function (tag) {
    var found = /src="([^"]+)"/.exec(tag);
    if (!found) {
      fail("C03", "index.html 有内联 script：" + tag);
      return;
    }
    srcs.push(path.basename(found[1]));
  });
  if (srcs.join(",") !== SCRIPT_ORDER.join(",")) {
    fail("C03", "脚本顺序应为 " + SCRIPT_ORDER.join(" → ") + "，实际 " + srcs.join(" → "));
  }
  if (/\son[a-z]+\s*=/i.test(html)) fail("C03", "index.html 含内联事件属性");
  if (html.indexOf('data-scene="title"') === -1) fail("C03", "index.html 缺 data-scene 初始值");
  notes.push("C03 OK 必需 id 齐全、脚本顺序 art → story → minigames → engine");
}

function checkPaths() {
  var html = readProject("index.html");
  var refs = [];
  var re = /(?:src|href)="([^"]+)"/g;
  var found;
  while ((found = re.exec(html))) refs.push(found[1]);
  refs.forEach(function (ref) {
    if (ref.indexOf("data:") === 0) return;
    if (ref.indexOf("./") !== 0) fail("C04", "资源不是 ./ 相对路径：" + ref);
  });
  ["index.html", "style.css"].concat(JS_FILES).forEach(function (file) {
    if (/https?:\/\//.test(readProject(file))) fail("C04", file + " 含外部地址");
  });
  notes.push("C04 OK 全部资源相对路径，无 CDN");
}

function checkBudget() {
  var jsBytes = 0;
  JS_FILES.forEach(function (file) {
    jsBytes += zlib.gzipSync(fs.readFileSync(path.join(PROJECT_DIR, file))).length;
  });
  var cssBytes = zlib.gzipSync(fs.readFileSync(path.join(PROJECT_DIR, "style.css"))).length;
  if (jsBytes > 150 * 1024) fail("C05", "JS gzip " + jsBytes + "B 超过 150KB");
  if (cssBytes > 30 * 1024) fail("C05", "CSS gzip " + cssBytes + "B 超过 30KB");
  notes.push("C05 OK JS gzip " + Math.round(jsBytes / 1024) + "KB / CSS gzip " + Math.round(cssBytes / 1024) + "KB");
}

function checkStoryWords() {
  var story = readProject("story.js");
  BANNED.concat(REAL).forEach(function (word) {
    if (story.indexOf(word) !== -1) fail("C06", "story.js 含「" + word + "」");
  });
  notes.push("C06 OK story.js 无禁用词与真实人物");
}

function checkPlaceholders() {
  if (readProject("art.js").indexOf("XB.art = {}") === -1) fail("C07", "art.js 不是空命名空间占位");
  if (readProject("minigames.js").indexOf("XB.minigames = {}") === -1) fail("C07", "minigames.js 不是空命名空间占位");
  var engine = stripComments(readProject("engine.js"));
  if (/XB\.art\b/.test(engine)) fail("C07", "engine.js 引用了 XB.art");
  if (/XB\.minigames\b/.test(engine)) fail("C07", "engine.js 引用了 XB.minigames");
  notes.push("C07 OK 占位命名空间就位，engine.js 不引用未实现模块");
}

function checkDocs() {
  var schema = readRoot(path.join("docs", "state-schema.md"));
  if (schema.indexOf('"scene"') === -1) fail("C08", "state-schema.md 缺 scene");
  if (!/"nodeId":\s*"j\d{3}"/.test(schema)) fail("C08", "state-schema.md 缺字符串 nodeId 示例");
  if (schema.indexOf("beat") === -1) fail("C08", "state-schema.md 缺 beat 存档说明");

  var ui = readRoot(path.join("docs", "ui-layout.md"));
  if (!/^## 1\.5\s/m.test(ui)) fail("C08", "ui-layout.md 缺 §1.5");
  ["于都", "湘江", "遵义", "金沙江", "泸定", "草地", "吴起"].forEach(function (name) {
    if (ui.indexOf(name) === -1) fail("C08", "ui-layout.md 缺站点 " + name);
  });

  var readme = readRoot(path.join("docs", "script", "README.md"));
  if (!/^## 7\.\s/m.test(readme)) fail("C08", "script/README.md 缺 §7");
  notes.push("C08 OK 三份文档已同步（state-schema / ui-layout §1.5 / script README §7）");
}

function checkAssets() {
  ["index.html", "style.css"].concat(JS_FILES).forEach(function (file) {
    if (/\.(mp3|wav|png|jpe?g)\b/i.test(readProject(file))) fail("C09", file + " 引用了音频/图片文件");
  });
  if (/<audio\b|<img\b/i.test(readProject("index.html"))) fail("C09", "index.html 含 audio/img 标签");
  notes.push("C09 OK 无音频/图片文件引用");
}

checkCompile();
checkForbiddenApis();
checkHtml();
checkPaths();
checkBudget();
checkStoryWords();
checkPlaceholders();
checkDocs();
checkAssets();

notes.forEach(function (line) {
  console.log(line);
});

if (failures.length) {
  failures.forEach(function (line) {
    console.log("× " + line);
  });
  console.log("\n共 " + failures.length + " 处问题");
  process.exitCode = 1;
} else {
  console.log("OK：构建自检 9 项全绿");
}
