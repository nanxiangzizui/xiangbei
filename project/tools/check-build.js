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
  "stage-art", "vn-chapter", "vn-name", "vn-text", "vn-next"
];

const PREVIEW_UI = [
  "btn", "dialog", "choice", "title-card", "codex",
  "ending", "pause", "settings", "hud", "feedback"
];

const REQUIRED_TOKENS = [
  "--paper", "--paper-hi", "--paper-lo", "--ink", "--ink-muted",
  "--cinnabar", "--ember", "--night", "--night-deep",
  "--scrim", "--overlay", "--shadow", "--ink-a12", "--ink-a45", "--paper-a72",
  "--focus-color", "--focus-gap", "--paper-texture",
  "--font-title", "--font-body", "--font-num",
  "--fs-title", "--fs-body", "--fs-small",
  "--z-art", "--z-scene", "--z-dialogue", "--z-pause", "--z-toast", "--z-orientation",
  "--dur-fast", "--dur-med", "--ease-out",
  "--stage-w", "--stage-h", "--scale"
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
  // 画布必须在场景之前：透明底的标题/地图要能透出插画
  var artIndex = html.indexOf('id="stage-art"');
  var titleIndex = html.indexOf('id="scene-title"');
  if (artIndex === -1 || titleIndex === -1 || artIndex > titleIndex) {
    fail("C03", "#stage-art 必须在 #scene-title 之前");
  }
  notes.push("C03 OK 必需 id 齐全、画布在场景前、脚本顺序 art → story → minigames → engine");
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
  var art = readProject("art.js");
  ["SCENES: SCENES", "mount: mount", "paint: paint", "resize: resize", "rng: rng"].forEach(function (needle) {
    if (art.indexOf(needle) === -1) fail("C07", "art.js 缺契约 " + needle);
  });
  if (readProject("minigames.js").indexOf("XB.minigames = {}") === -1) fail("C07", "minigames.js 不是空命名空间占位");
  var engine = stripComments(readProject("engine.js"));
  if (!/XB\.art\b/.test(engine)) fail("C07", "engine.js 未接入 XB.art");
  if (/XB\.minigames\b/.test(engine)) fail("C07", "engine.js 引用了 XB.minigames");
  notes.push("C07 OK art.js 五项契约就位、engine 已接入、minigames 仍占位");
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

  var visual = readRoot(path.join("docs", "visual-system.md"));
  ["--cinnabar", "--paper-hi", "13.69", "5.10", "prefers-reduced-motion"].forEach(function (needle) {
    if (visual.indexOf(needle) === -1) fail("C08", "visual-system.md 缺 " + needle);
  });
  ["--z-art", "#stage-art"].forEach(function (needle) {
    if (ui.indexOf(needle) === -1) fail("C08", "ui-layout.md 缺 " + needle);
  });
  if (ui.indexOf("96px") === -1) fail("C08", "ui-layout.md 标题字号未同步 96px");
  if (!/^## 6\.\s/m.test(ui)) fail("C08", "ui-layout.md 缺 §6 组件壳尺寸");

  var credits = readRoot(path.join("docs", "credits.md"));
  if (credits.indexOf("步骤二状态") === -1) fail("C08", "credits.md 缺步骤二字体状态");
  if (credits.indexOf("local(") === -1) fail("C08", "credits.md 未说明只用 local()");
  notes.push("C08 OK 四份文档已同步（state-schema / ui-layout §1.5+§6 / visual-system / credits）");
}

function checkAssets() {
  ["index.html", "style.css"].concat(JS_FILES).forEach(function (file) {
    if (/\.(mp3|wav|png|jpe?g)\b/i.test(readProject(file))) fail("C09", file + " 引用了音频/图片文件");
  });
  if (/<audio\b|<img\b/i.test(readProject("index.html"))) fail("C09", "index.html 含 audio/img 标签");
  notes.push("C09 OK 无音频/图片文件引用");
}

// C10：色值只能出现在 :root；组件规则一律 var()
function checkTokens() {
  var css = readProject("style.css").replace(/\/\*[\s\S]*?\*\//g, " ");
  var rootMatch = /:root\s*\{([^}]*)\}/.exec(css);
  if (!rootMatch) {
    fail("C10", "style.css 缺 :root 令牌块");
  } else {
    REQUIRED_TOKENS.forEach(function (name) {
      if (rootMatch[1].indexOf(name + ":") === -1) fail("C10", ":root 缺 " + name);
    });
    if (!/:root\s*\{[^}]*--paper-texture/.test(css)) fail("C10", ":root 缺 --paper-texture");
  }
  var rest = css.replace(/:root\s*\{[^}]*\}/g, " ");
  var bodies = rest.match(/\{[^{}]*\}/g) || [];
  bodies.forEach(function (body) {
    body.slice(1, -1).split(";").forEach(function (declaration) {
      var colon = declaration.indexOf(":");
      if (colon === -1) return;
      var value = declaration.slice(colon + 1).replace(/var\([^)]*\)/g, " ");
      if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(value)) {
        fail("C10", "组件里写了色值：" + declaration.trim());
      }
    });
  });
  notes.push("C10 OK 令牌集中在 :root，组件只写 var()");
}

// C11：art.js 场景注册表与 story.js 背景指令必须对得上
function checkArtScenes() {
  var sandbox = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    document: { addEventListener: function () {} },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  try {
    ["art.js", "story.js"].forEach(function (file) {
      vm.runInContext(readProject(file), sandbox, { filename: file });
    });
  } catch (err) {
    fail("C11", "art.js/story.js 无法在同一上下文加载：" + err.message);
    return;
  }
  var art = sandbox.XB && sandbox.XB.art;
  if (!art || !Array.isArray(art.SCENES)) {
    fail("C11", "XB.art.SCENES 不是数组");
    return;
  }
  ["title", "map", "yudu_river", "yudu_night"].forEach(function (id) {
    if (art.SCENES.indexOf(id) === -1) fail("C11", "SCENES 缺 " + id);
  });
  var chapterList = (sandbox.XB.story && sandbox.XB.story.chapters) || [];
  chapterList.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.bg && art.SCENES.indexOf(node.bg) === -1) {
        fail("C11", "story.js " + node.id + " 的 bg「" + node.bg + "」不在 SCENES");
      }
    });
  });
  notes.push("C11 OK SCENES = " + art.SCENES.join(" / "));
}

// C12：组件预览页与字体策略
function checkPreview() {
  var htmlPath = path.join(PROJECT_DIR, "tools", "ui-preview.html");
  var jsPath = path.join(PROJECT_DIR, "tools", "ui-preview.js");
  if (!fs.existsSync(htmlPath)) {
    fail("C12", "缺 tools/ui-preview.html");
    return;
  }
  if (!fs.existsSync(jsPath)) fail("C12", "缺 tools/ui-preview.js");
  var html = fs.readFileSync(htmlPath, "utf8");
  if (html.indexOf('href="../style.css"') === -1) fail("C12", "预览页没有引用 ../style.css");
  if (/https?:\/\//.test(html)) fail("C12", "预览页含外部地址");
  if (/<(img|audio|video|iframe)\b/i.test(html)) fail("C12", "预览页含图片/音频/视频/内嵌页");
  var matches = html.match(/data-ui="([^"]+)"/g) || [];
  var ids = matches.map(function (item) {
    return item.slice(9, -1);
  });
  PREVIEW_UI.forEach(function (ui) {
    var count = ids.filter(function (id) { return id === ui; }).length;
    if (count !== 1) fail("C12", 'data-ui="' + ui + '" 出现 ' + count + ' 次（应 1 次）');
  });
  ids.forEach(function (id) {
    if (PREVIEW_UI.indexOf(id) === -1) fail("C12", "预览页有未知组件 data-ui=" + id);
  });

  var fontBlocks = readProject("style.css").match(/@font-face\s*\{[^}]*\}/g) || [];
  if (!fontBlocks.length) fail("C12", "style.css 没有 @font-face");
  fontBlocks.forEach(function (block) {
    if (/url\(/.test(block)) fail("C12", "@font-face 用了 url()（本步不打包字体）");
    if (!/local\(/.test(block)) fail("C12", "@font-face 缺 local()");
  });
  var fontDir = path.join(PROJECT_DIR, "assets", "fonts");
  if (fs.existsSync(fontDir)) {
    fs.readdirSync(fontDir).forEach(function (name) {
      if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) fail("C12", "assets/fonts 混入字体文件：" + name);
    });
  }
  notes.push("C12 OK 预览页 10 类组件唯一、只引 ../style.css、字体只用 local()");
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
checkTokens();
checkArtScenes();
checkPreview();

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
  console.log("OK：构建自检 12 项全绿");
}
