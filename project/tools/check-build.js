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
const JS_FILES = ["art.js", "story.js", "engine.js"];
const SCRIPT_ORDER = ["art.js", "story.js", "engine.js"];
// 与 engine.js 的 REQUIRED_IDS 对齐：缺一个引擎就抛错，所以列表必须逐字一致
const REQUIRED_IDS = [
  "stage", "stage-art", "scene-title", "scene-map", "scene-vn", "scene-ending", "fx-layer",
  "ending-title", "ending-date", "ending-lede", "ending-names", "ending-stats", "ending-cards",
  "ending-achievements", "ending-achievements-title", "ending-achievements-count", "ending-achievement-chips",
  "ending-disclaimer", "ending-home", "ending-codex",
  "pause", "pause-menu", "toast", "debug", "orientation",
  "title-menu", "map-stations", "map-route",
  "vn-chapter", "vn-toolbar", "vn-auto", "vn-skip", "vn-dialogue", "vn-name", "vn-text", "vn-next",
  "vn-choice-prompt", "vn-choices", "vn-result",
  "vn-multichoice", "vn-multi-prompt", "vn-multi-options", "vn-multi-status", "vn-multi-confirm",
  "vn-interact", "interact-kicker", "interact-name", "interact-status", "interact-progress",
  "interact-names", "interact-answer", "interact-live",
  "vn-title-card", "vn-title-chapter", "vn-title-sub", "vn-title-place", "vn-measure",
  "vn-settings", "set-speed", "set-speed-value", "set-scale", "set-volume", "set-volume-value",
  "set-music-volume", "set-music-volume-value", "set-env-volume", "set-env-volume-value",
  "set-muted", "set-motion", "set-skip",
  "vn-roster", "roster-list", "roster-foot",
  "codex", "codex-title", "codex-badges", "codex-figure", "codex-body", "codex-note", "codex-source",
  "codex-image-note", "codex-close",
  "codex-gallery", "gallery-close", "gallery-title", "gallery-count", "gallery-grid",
  "branch-map", "branch-title", "branch-count", "branch-chapters", "branch-live",
  "branch-endings-door", "branch-endings-nodoor", "branch-endings-bad", "branch-close",
  "branch-detail", "branch-detail-close", "branch-detail-kicker", "branch-detail-title",
  "branch-detail-sub", "branch-detail-body", "ending-branch",
  "achievement-panel", "achievement-title", "achievement-count", "achievement-tabs",
  "achievement-grid", "achievement-close", "achievement-detail", "achievement-detail-close",
  "achievement-detail-kicker", "achievement-detail-title", "achievement-detail-body"
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
  "--z-art", "--z-scene", "--z-dialogue", "--z-pause", "--z-gallery", "--z-codex", "--z-toast", "--z-orientation",
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

// 在独立上下文里加载脚本，拿到 XB 命名空间（不执行 init：DOMContentLoaded 不会触发）
function loadGame(files) {
  const sandbox = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    document: { addEventListener: function () {} },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  (files || JS_FILES).forEach(function (file) {
    vm.runInContext(readProject(file), sandbox, { filename: file });
  });
  return sandbox.XB;
}

// 剧情节点里的“人会读到/听到的字”：台词、旁白、选项、结算清单
function storyTexts(story) {
  const texts = [];
  (story.chapters || []).forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      [node.text, node.speaker, node.prompt, node.title, node.sub].forEach(function (value) {
        if (typeof value === "string" && value) texts.push(value);
      });
      (node.options || []).forEach(function (option) {
        if (option.text) texts.push(option.text);
        if (option.cost) texts.push(option.cost);
      });
      (node.lists || []).forEach(function (list) {
        if (list.heading) texts.push(list.heading);
        (list.items || []).forEach(function (item) {
          texts.push(item);
        });
      });
    });
  });
  return texts;
}


function checkCompile() {
  JS_FILES.forEach(function (file) {
    try {
      new vm.Script(readProject(file), { filename: file });
    } catch (err) {
      fail("C01", file + " 编译失败：" + err.message);
    }
  });
  notes.push("C01 OK 3 个 JS 可编译");
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
  notes.push("C03 OK 必需 id 齐全、画布在场景前、脚本顺序 art → story → engine");
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

// C06：真实人物只许进图鉴，不进剧情；禁用词一个都不许有
function checkStoryWords() {
  var story = loadGame(["story.js"]).story;
  var texts = storyTexts(story);
  if (!texts.length) fail("C06", "story.js 没读到剧情文本");
  texts.forEach(function (text) {
    BANNED.concat(REAL).forEach(function (word) {
      if (text.indexOf(word) !== -1) fail("C06", "剧情文本含「" + word + "」：" + text.slice(0, 18));
    });
  });
  (story.codex || []).forEach(function (card) {
    BANNED.forEach(function (word) {
      if ((card.body || "").indexOf(word) !== -1) fail("C06", "图鉴 " + card.id + " 含「" + word + "」");
    });
  });
  notes.push("C06 OK 剧情 " + texts.length + " 段文本无禁用词/真实人物；图鉴无禁用词");
}

function checkPlaceholders() {
  var art = readProject("art.js");
  ["SCENES: SCENES", "mount: mount", "paint: paint", "resize: resize", "rng: rng"].forEach(function (needle) {
    if (art.indexOf(needle) === -1) fail("C07", "art.js 缺契约 " + needle);
  });
  var engine = stripComments(readProject("engine.js"));
  if (!/XB\.art\b/.test(engine)) fail("C07", "engine.js 未接入 XB.art");
  notes.push("C07 OK art.js 五项契约就位、engine 已接入 XB.art");
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

  // 步骤三新增：阅读层规格、容器表、选择日志字段都要落到文档上，代码不能成为唯一规格
  var reading = readRoot(path.join("docs", "visual-reading.md"));
  ["## 1.", "## 2.", "## 3.", "## 4.", "## 5.", "## 6.", "## 7.", "## 8."].forEach(function (heading) {
    if (reading.indexOf(heading) === -1) fail("C08", "visual-reading.md 缺 " + heading + " 一节");
  });
  if (ui.indexOf("## 7.") === -1) fail("C08", "ui-layout.md 缺 §7 步骤三容器表");
  ["timedOut", "inventory.door"].forEach(function (needle) {
    if (schema.indexOf(needle) === -1) fail("C08", "state-schema.md 缺 " + needle);
  });
  notes.push("C08 OK 六份文档已同步（state-schema / ui-layout §1.5+§6+§7 / visual-system / credits / visual-reading / script README）");
}

function checkAssets() {
  var sources = ["index.html", "style.css"].concat(JS_FILES);
  var seen = {};
  sources.forEach(function (file) {
    var code = readProject(file);
    var matches = code.match(/["'](\.\/assets\/[^"']+)["']/g) || [];
    matches.forEach(function (quoted) {
      var rel = quoted.slice(1, -1);
      if (seen[rel]) return;
      seen[rel] = true;
      if (!/^\.\/assets\/(?:backgrounds|fonts|audio)\//.test(rel)) {
        fail("C09", file + " 的资源不在 assets 白名单：" + rel);
      }
      if (!fs.existsSync(path.join(PROJECT_DIR, rel.slice(2)))) {
        fail("C09", file + " 引用的资源不存在：" + rel);
      }
    });
  });
  if (/<audio\b|<img\b/i.test(readProject("index.html"))) fail("C09", "index.html 含 audio/img 标签");
  notes.push("C09 OK 资源均位于 assets 且文件存在（" + Object.keys(seen).length + " 个）");
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
  var expectedScenes = ["title", "map", "yudu_river", "yudu_night",
    "xiangjiang_ford", "xiangjiang_dawn", "xiangjiang_map",
    "zunyi_hall", "zunyi_street",
    "jinsha_river", "jinsha_night", "luding_bridge", "luding_after",
    "grass_marsh", "grass_dawn", "wuqi_dawn", "wuqi_wall"];
  if (art.SCENES.length !== expectedScenes.length) fail("C11", "SCENES 应为 17 个，实际 " + art.SCENES.length);
  expectedScenes.forEach(function (id) {
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
    if (!/local\(/.test(block) && !/url\(/.test(block)) fail("C12", "@font-face 缺 local()/url()");
    var urls = block.match(/url\(["']?([^"')]+)["']?\)/g) || [];
    urls.forEach(function (item) {
      var rel = /url\(["']?([^"')]+)["']?\)/.exec(item)[1];
      if (rel.indexOf("./assets/fonts/") !== 0) fail("C12", "@font-face 字体路径不在 assets/fonts：" + rel);
      if (!/\.woff2$/i.test(rel)) fail("C12", "@font-face 只允许 woff2 子集：" + rel);
      if (!fs.existsSync(path.join(PROJECT_DIR, rel.slice(2)))) fail("C12", "字体文件缺失：" + rel);
    });
  });
  var fontDir = path.join(PROJECT_DIR, "assets", "fonts");
  if (!fs.existsSync(fontDir)) {
    fail("C12", "缺 assets/fonts");
  } else {
    var fontFiles = fs.readdirSync(fontDir).filter(function (name) {
      return /\.(woff2?|ttf|otf|eot)$/i.test(name);
    });
    if (fontFiles.length < 2) fail("C12", "assets/fonts 至少需要两套子集");
    fontFiles.forEach(function (name) {
      if (!/\.woff2$/i.test(name)) fail("C12", "assets/fonts 只允许 woff2：" + name);
    });
  }
  notes.push("C12 OK 预览页 10 类组件唯一、只引 ../style.css、字体为本地 woff2 子集");
}

// C13：序章节点图结构（步骤三出口：一章能从头播到尾）
function checkPrologueGraph() {
  var XB = loadGame();
  var story = XB.story;
  if (story.version !== 2) fail("C13", "story.version 应为 2，实际 " + story.version);
  var chapter = XB.core.chapterById("prologue");
  if (!chapter) {
    fail("C13", "找不到序章");
    return;
  }
  var nodes = chapter.nodes;
  var counts = {};
  nodes.forEach(function (node) {
    counts[node.type] = (counts[node.type] || 0) + 1;
  });
  var expected = { line: 82, choice: 2, multichoice: 1, result: 1, title: 1, codex: 1, end: 1 };
  if (nodes.length !== 89) fail("C13", "序章节点应为 89，实际 " + nodes.length);
  Object.keys(expected).forEach(function (type) {
    if ((counts[type] || 0) !== expected[type]) {
      fail("C13", type + " 节点应为 " + expected[type] + "，实际 " + (counts[type] || 0));
    }
  });
  var ids = nodes.map(function (node) {
    return node.id;
  });
  for (var i = 0; i < 11; i += 1) {
    var expectedId = "p" + String(i + 1).padStart(3, "0");
    if (ids[i] !== expectedId) fail("C13", "第 " + (i + 1) + " 个节点应为 " + expectedId + "，实际 " + ids[i]);
  }
  if (new Set(ids).size !== ids.length) fail("C13", "节点 id 有重复");
  ["p013", "p018", "p021", "p024", "p039a", "p039b"].forEach(function (id) {
    if (ids.indexOf(id) === -1) fail("C13", "缺节点 " + id);
  });
  var last = nodes[nodes.length - 1];
  if (last.id !== "p900") fail("C13", "末节点应为 p900，实际 " + last.id);
  if (last.next !== "xiangjiang") fail("C13", "p900.next 应为 xiangjiang，实际 " + last.next);
  notes.push("C13 OK 序章 " + nodes.length + " 节点（line 82 / choice 2 / multichoice 1 / result 1 / title 1 / codex 1 / end 1；p039a/b）");
}

var SET_KEY_EXACT = [
  "item.door", "item.pot", "item.medicine", "item.barley", "item.homepot", "item.raincloth", "item.shoes",
  "load", "trust", "fire", "lights_lost",
  "had.door", "strain", "condition", "rescues", "help.used", "doorOutcome", "inventory.giftBarley",
  "fate.feimao.dead", "fate.zaowang.dead", "fate.dongsheng.dead", "fate.lin.dead", "fate.all.dead",
  "fate.player.dead", "quality.feimao", "quality.zaowang", "quality.dongsheng"
];

function isAllowedCondition(text) {
  if (typeof text !== "string" || !text.trim()) return false;
  return text.split("&&").every(function (part) {
    var key = part.trim().replace(/^!/, "");
    return /^(item\.[a-z_]+|strain(\.[a-z]+)?|fate\.[a-z.]+|had\.door|condition|rescues|help\.used|doorOutcome|inventory\.giftBarley|quality\.[a-z]+|grass\.settled|memory\.[a-z0-9_]+|choice\.[a-z0-9._]+)$/.test(key);
  });
}

function isAllowedSetKey(key) {
  return (
    SET_KEY_EXACT.indexOf(key) !== -1 || key.indexOf("memory.") === 0 || key.indexOf("choice.") === 0
  );
}

// C14：全章选项契约——2–3 项、key 连续、文本/代价长度受控、timeout 可选、set 白名单
function checkChoiceRules() {
  var XB = loadGame();
  var total = 0;
  var records = [];
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).filter(function (node) {
      return node.type === "choice";
    }).forEach(function (node) {
      total += 1;
      var timed = node.timeout !== undefined;
      if (timed && !(node.timeout >= 1 && node.timeout <= 30)) fail("C14", node.id + " timeout 应在 1–30 秒");
      if (timed && !node.defaultOption) fail("C14", node.id + " 限时但缺 defaultOption");
      if (!timed && node.defaultOption) fail("C14", node.id + " 不计时却写了 defaultOption");
      if (!node.prompt) fail("C14", node.id + " 缺 prompt");
      if (node.record !== undefined) {
        if (typeof node.record !== "string" || node.record.indexOf("choice.") !== 0) fail("C14", node.id + " record 应是 choice.* 旗标名");
        var duplicate = records.filter(function (entry) { return entry.record === node.record; })[0];
        if (duplicate && (!node.when || !duplicate.when)) fail("C14", node.id + " record 重复：" + node.record);
        records.push({ record: node.record, when: !!node.when });
      }
      if (!Array.isArray(node.options) || node.options.length < 2 || node.options.length > 4) {
        fail("C14", node.id + " 应有 2–4 个选项");
        return;
      }
      var keys = node.options.map(function (option) { return option.key; });
      var expectedKeys = ["A", "B", "C", "D"].slice(0, node.options.length);
      if (keys.join(",") !== expectedKeys.join(",")) fail("C14", node.id + " 选项 key 应为 " + expectedKeys.join(",") + "，实际 " + keys.join(","));
      if (node.defaultOption && keys.indexOf(node.defaultOption) === -1) fail("C14", node.id + " defaultOption 不在选项里");
      node.options.forEach(function (option) {
        if (!option.text) fail("C14", node.id + option.key + " 缺 text");
        else if (Array.from(option.text).length > 14) fail("C14", node.id + option.key + " 文案超过 14 字");
        if (!option.cost) fail("C14", node.id + option.key + " 缺 cost（超时要有代价可说）");
        else if (Array.from(option.cost).length > 22) fail("C14", node.id + option.key + " 代价超过 22 字");
        if (option.value === undefined) fail("C14", node.id + option.key + " 缺 value");
        if (option.when !== undefined) fail("C14", node.id + option.key + " 不允许 option.when（只用节点级 when）");
        if (option.requires !== undefined && !isAllowedCondition(option.requires)) {
          fail("C14", node.id + option.key + " requires 写法非法：" + option.requires);
        }
        Object.keys(option.set || {}).forEach(function (key) {
          if (!isAllowedSetKey(key)) fail("C14", node.id + option.key + " 写了未登记旗标 " + key);
        });
        if (option.setIf !== undefined) {
          if (!Array.isArray(option.setIf)) {
            fail("C14", node.id + option.key + " setIf 应为数组");
          } else {
            option.setIf.forEach(function (rule) {
              if (!rule || !isAllowedCondition(rule.when) || !rule.set) {
                fail("C14", node.id + option.key + " setIf 条件或 set 非法");
                return;
              }
              Object.keys(rule.set).forEach(function (key) {
                if (!isAllowedSetKey(key)) fail("C14", node.id + option.key + " setIf 写了未登记旗标 " + key);
              });
            });
          }
        }
      });
    });
  });
  if (total !== 17) fail("C14", "全章 choice 应为 17 个，实际 " + total);
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.type === "multichoice" && node.maxWhen !== undefined) {
        if (!Array.isArray(node.maxWhen)) fail("C14", node.id + " maxWhen 应为数组");
        else node.maxWhen.forEach(function (rule) {
          if (!isAllowedCondition(rule.when) || !(rule.max >= 0)) fail("C14", node.id + " maxWhen 写法非法");
        });
      }
      if (node.requires !== undefined && !isAllowedCondition(node.requires)) fail("C14", node.id + " 节点 requires 写法非法");
    });
  });
  notes.push("C14 OK 全章 " + total + " 个选择：2–4 项、key 连续、requires/maxWhen、文案/代价受控、timeout 与 defaultOption 配对、set 白名单");
}

// C15：阅读层容器、标题版本行、量具不能 display:none
function checkReadingDom() {
  var html = readProject("index.html");
  ["vn-toolbar", "vn-choices", "vn-choice-prompt", "vn-title-card", "vn-multichoice", "vn-result", "vn-measure", "vn-settings", "codex"].forEach(function (id) {
    if (html.indexOf('id="' + id + '"') === -1) fail("C15", "index.html 缺阅读层容器 #" + id);
  });
  if (html.indexOf("试玩版 · 人物虚构，非史料人物") === -1) fail("C15", "标题版本行未改成「试玩版 · 人物虚构，非史料人物」");
  if (html.indexOf("步骤二") !== -1) fail("C15", "index.html 仍写着「步骤二」");
  var css = readProject("style.css");
  var measure = /\.vn-measure\s*\{[^}]*\}/.exec(css);
  if (!measure) fail("C15", "style.css 缺 .vn-measure");
  else if (/display:\s*none/.test(measure[0])) fail("C15", ".vn-measure 不能 display:none，否则量不出行高");
  if (!/--choice-progress/.test(css)) fail("C15", "style.css 缺 --choice-progress 计时条");
  notes.push("C15 OK 九个阅读层容器就位、版本行已换、量具可用 CSS 量高");
}

// C16：when/set 白名单，以及 item.door → inventory.door 镜像确实生效
function checkConditionWhitelist() {
  var XB = loadGame();
  var allowedWhen = Object.keys(XB.core.FLAG_DEFAULTS)
    .concat(XB.core.WUQI_MEMORY)
    .concat(Object.keys(XB.core.CHAPTER_MEMORY).map(function (chapterId) { return XB.core.CHAPTER_MEMORY[chapterId]; }))
    .concat([
      "memory.zhang", "memory.door", "memory.luding_unknown", "memory.rollcall_missed_any",
      "memory.fly_bridge", "memory.fly_medicine", "memory.fly_leave",
      "memory.zaowang_barley", "memory.zaowang_pot", "memory.zaowang_body",
      "memory.dongsheng_shoes", "memory.dongsheng_cloth", "memory.dongsheng_body",
      "memory.lin_north", "memory.lin_self",
      "memory.grass_share",
      "memory.xiangjiang.barley_lost", "memory.xiangjiang.binding_lost"
    ]);
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.type === "choice" && node.record) allowedWhen.push(node.record);
    });
  });
  allowedWhen = allowedWhen.filter(function (key, index) { return allowedWhen.indexOf(key) === index; });
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (!node.when) return;
      node.when.split("&&").forEach(function (term) {
        var key = term.trim().replace(/^!/, "").trim();
        if (allowedWhen.indexOf(key) === -1) fail("C16", node.id + " 的 when 用了未登记旗标 " + key);
      });
    });
  });

  var state = XB.core.defaults();
  if (!XB.core.startChapter(state, "prologue", "p021")) {
    fail("C16", "定位不到 p021");
    return;
  }
  var option = XB.core.applyChoice(state, XB.core.currentNode(state), "A", false);
  if (!option) {
    fail("C16", "p021 选 A 结算失败");
    return;
  }
  if (state.flags["item.door"] !== true) fail("C16", "p021 选 A 没写 item.door");
  if (state.inventory.door !== true) fail("C16", "inventory.door 没有镜像 flags.item.door");
  if (state.flags.fire !== 60) fail("C16", "p021 选 A 火种应为 60，实际 " + state.flags.fire);
  if (state.flags.load !== 2) fail("C16", "p021 选 A 行囊应为 2，实际 " + state.flags.load);
  XB.core.setFlag(state, "fire", "+100");
  if (state.flags.fire !== 100) fail("C16", "fire 没夹到 100，实际 " + state.flags.fire);
  XB.core.setFlag(state, "trust", "-5");
  if (state.flags.trust !== 0) fail("C16", "trust 没夹到 0，实际 " + state.flags.trust);
  if (XB.core.setFlag(state, "ending.done", true) !== false) fail("C16", "没拦住 ending.* 写入");
  notes.push("C16 OK when 只用登记旗标；item.door 同步镜像；fire/trust 夹取；ending 拒写");
}

// C17：七张图鉴、存档字段冻结、end.next 合法、剧情内联
function checkSaveAndCodex() {
  var XB = loadGame();
  var ids = XB.story.codex.map(function (card) {
    return card.id;
  });
  var expected = ["yudu", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];
  if (ids.join(",") !== expected.join(",")) fail("C17", "图鉴 id 应为 7 张固定顺序，实际 " + ids.join(","));
  XB.story.codex.forEach(function (card) {
    ["title", "type", "body", "source"].forEach(function (field) {
      if (!card[field]) fail("C17", "图鉴 " + card.id + " 缺 " + field);
    });
    if (/\bhttps?:/.test(card.body)) fail("C17", "图鉴 " + card.id + " 正文里塞了网址");
  });
  if (
    XB.core.PERSIST_KEYS.join(",") !==
    "version,scene,chapterId,nodeId,flags,inventory,choices,codex,settings,unlockedChapters,ending"
  ) {
    fail("C17", "PERSIST_KEYS 被改动了：" + XB.core.PERSIST_KEYS.join(","));
  }
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.type === "end" && node.next && node.next !== "ending" && node.next !== "map" && !XB.core.chapterById(node.next)) {
        fail("C17", node.id + " 的 next 指向不存在的章节/ending：" + node.next);
      }
    });
  });

  // 用默认旗标从 p001 一路走到 end：确认没有走不到的隐藏节点
  var state = XB.core.defaults();
  if (!XB.core.startChapter(state, "prologue")) {
    fail("C17", "序章起不来");
    return;
  }
  var guard = 0;
  while (guard < 200 && XB.core.currentNode(state).type !== "end") {
    XB.core.advance(state);
    guard += 1;
  }
  if (guard >= 200) fail("C17", "默认旗标下走不到 end");
  else if (XB.core.currentNode(state).id !== "p900") fail("C17", "走到 " + XB.core.currentNode(state).id + " 就断了");

  var story = stripComments(readProject("story.js"));
  if (/fetch\s*\(|XMLHttpRequest|import\s*\(/.test(story)) fail("C17", "story.js 含外部加载");
  if (/https?:\/\//.test(story)) fail("C17", "story.js 含外部 URL");
  notes.push("C17 OK 7 张图鉴齐全、存档 11 键冻结、p001→p900 可走通、end.next 允许章节/ending/map、剧情内联");
}

// C18：多选组件与纯函数契约（行囊/弃物）
function checkMultichoiceApi() {
  var XB = loadGame();
  if (typeof XB.core.applyMultiChoice !== "function") {
    fail("C18", "XB.core.applyMultiChoice 不是函数");
    return;
  }
  var engine = stripComments(readProject("engine.js"));
  ["renderMultiChoice", "toggleMultiChoice", "resolveMultiChoice", "aria-checked", "recordMode", "canAddMultiOption", "multi-toggle", "multi-confirm", "vn-multichoice"].forEach(function (needle) {
    if (engine.indexOf(needle) === -1) fail("C18", "engine.js 缺多选标记 " + needle);
  });
  var p024 = XB.core.locate("prologue", "p024").node;
  if (!p024 || p024.type !== "multichoice") fail("C18", "p024 不是 multichoice 节点");
  else {
    if (p024.min !== 0 || p024.max !== 5) fail("C18", "p024 min/max 应为 0/5");
    if (p024.options.length !== 5) fail("C18", "p024 应有 5 个选项");
    if (p024.slotLoad !== undefined || p024.maxWhen !== undefined) fail("C18", "p024 应改由 8 半格容量校验");
  }
  var state = XB.core.defaults();
  if (!XB.core.startChapter(state, "prologue", "p024")) {
    fail("C18", "定位不到 p024");
    return;
  }
  var picked = XB.core.applyMultiChoice(state, p024, ["medicine", "homepot"]);
  if (!picked) fail("C18", "p024 选两件结算失败");
  if (state.flags["item.medicine"] !== true || state.flags["item.homepot"] !== true) fail("C18", "p024 没有写 item.* 布尔");
  if (state.flags.load !== 5) fail("C18", "药 1 + 铁锅 4 应占 5 半格，实际 " + state.flags.load);
  if (state.inventory.items.join(",") !== "roster,pencil,medicine,pot") fail("C18", "p024 背包回填不对：" + state.inventory.items.join(","));
  if (state.choices[state.choices.length - 1].option !== "MULTI") fail("C18", "p024 没有记 MULTI 日志");
  if (XB.core.applyMultiChoice(state, p024, ["medicine", "barley", "homepot", "raincloth", "shoes"]) !== null) fail("C18", "p024 超过 8 半格仍结算");
  if (XB.core.applyMultiChoice(state, p024, ["nope"]) !== null) fail("C18", "p024 未知选项仍结算");
  var x015 = XB.core.locate("xiangjiang", "x015").node;
  var xstate = XB.core.defaults();
  if (!XB.core.startChapter(xstate, "xiangjiang", "x015")) {
    fail("C18", "定位不到 x015");
    return;
  }
  var left = XB.core.applyMultiChoice(xstate, x015, ["xray", "press", "files"]);
  if (!left || left.left.join(",") !== "medkit,radio,silver") fail("C18", "x015 留在岸上的三样不对");
  if (xstate.flags["choice.xiangjiang.abandoned"].join(",") !== "medkit,radio,silver") fail("C18", "x015 没有写 abandoned");
  if (xstate.flags["choice.xiangjiang.take.xray"] !== true || xstate.flags["choice.xiangjiang.take.medkit"] !== false) fail("C18", "x015 take 布尔不对");
  notes.push("C18 OK applyMultiChoice 校验 min/max/8 半格容量/未知 id、写 item.*/take.*、重算行囊、MULTI 日志");
}

// C19：四段选择的数据契约与即时/后续回写节点
function checkChoiceSegments() {
  var XB = loadGame();
  var nodes = {};
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) { nodes[node.id] = node; });
  });
  ["j010", "j011", "l013", "l014"].forEach(function (id) {
    if (nodes[id]) fail("C19", "已删除的小游戏节点还在：" + id);
  });
  Object.keys(nodes).forEach(function (id) {
    if (nodes[id].type === "minigame") fail("C19", "剧情还有 minigame 节点：" + id);
  });
  var p024 = nodes.p024;
  var x015 = nodes.x015;
  if (!p024 || p024.type !== "multichoice" || p024.options.length !== 5) fail("C19", "序章行囊多选不完整");
  if (!x015 || x015.type !== "multichoice" || x015.options.length !== 6) fail("C19", "湘江弃物多选不完整");
  if (!x015 || x015.min !== 3 || x015.max !== 3 || x015.record !== "choice.xiangjiang.abandoned" || x015.recordMode !== "left") fail("C19", "x015 的 3 选/recordMode 不对");
  if (nodes.p025.source !== "items" || nodes.x016.source !== "abandon") fail("C19", "结算页 source 应为 items/abandon");
  var j024 = nodes.j024;
  if (!j024 || j024.type !== "choice" || j024.options.length !== 3) fail("C19", "金沙江先渡谁不是三选一");
  else {
    var mirrors = j024.options.map(function (option) {
      return option.set && option.set["choice.jinsha.main"] === true ? "main" :
        option.set && option.set["choice.jinsha.wounded"] === true ? "wounded" :
        option.set && option.set["choice.jinsha.kettle"] === true ? "kettle" : "none";
    });
    if (mirrors.join(",") !== "main,wounded,kettle") fail("C19", "j024 缺 choice.jinsha.* 镜像布尔");
  }
  ["j024a", "j024b", "j024c", "j026a", "j026b", "j026c", "j029a", "j029b", "j029c"].forEach(function (id) {
    if (!nodes[id]) fail("C19", "金沙江回写节点缺失：" + id);
  });
  if (!nodes.j024a || nodes.j024a.when !== "choice.jinsha.main") fail("C19", "j024a 的 when 不对");
  var l019 = nodes.l019;
  if (!l019 || l019.type !== "choice" || l019.record !== "choice.luding.door") fail("C19", "泸定门板选择不完整");
  ["l019a", "l019b", "l021a", "l021b", "l021c"].forEach(function (id) {
    if (!nodes[id]) fail("C19", "泸定回写节点缺失：" + id);
  });
  if (nodes.l020.when !== "!item.door && !choice.luding.door") fail("C19", "l020 的 when 应排除已铺门板");
  var story = stripComments(readProject("story.js"));
  if (story.indexOf("choice.jinsha.trips") !== -1) fail("C19", "story 仍在写 choice.jinsha.trips");
  notes.push("C19 OK 四段选择齐全；j010/j011/l013/l014 与 minigame 节点消失；金沙江/泸定镜像与回写节点就位");
}

// C20：结算页只读持久旗标，刷新后能重建同一组带走/留下
function checkResultRebuild() {
  var engine = stripComments(readProject("engine.js"));
  ["PACK_ITEMS", "ABANDON_ITEMS", "collectItemLabels", 'node.source === "items"', 'node.source === "abandon"', "choice.xiangjiang.abandoned", "vn-result__stats"].forEach(function (needle) {
    if (engine.indexOf(needle) === -1) fail("C20", "engine.js 缺结算重建标记 " + needle);
  });
  ["lastMinigameResult", "applyMinigameResult", "XB.minigames"].forEach(function (needle) {
    if (engine.indexOf(needle) !== -1) fail("C20", "engine.js 仍依赖小游戏结果 " + needle);
  });
  notes.push("C20 OK 行囊/弃物结算只读 item.*/take.*/abandoned，刷新可重建");
}

// C21：小游戏文件、入口、DOM 与 CSS 全部移除
function checkMinigameRemoved() {
  if (fs.existsSync(path.join(PROJECT_DIR, "minigames.js"))) fail("C21", "project/minigames.js 仍存在");
  var html = readProject("index.html");
  ["vn-minigame", "minigame-canvas", "minigames.js", "?minigame"].forEach(function (needle) {
    if (html.indexOf(needle) !== -1) fail("C21", "index.html 仍有小游戏残留 " + needle);
  });
  var css = readProject("style.css");
  [".vn-minigame", ".minigame-canvas", ".minigame-pause", ".minigame-fallback"].forEach(function (needle) {
    if (css.indexOf(needle) !== -1) fail("C21", "style.css 仍有小游戏样式 " + needle);
  });
  var engine = stripComments(readProject("engine.js"));
  ["soloMode", "startSolo", "?minigame", "minigameRun", "MINIGAME_LABEL"].forEach(function (needle) {
    if (engine.indexOf(needle) !== -1) fail("C21", "engine.js 仍有小游戏入口 " + needle);
  });
  notes.push("C21 OK minigames.js 已删；无画布/小游戏入口/solo 调试/小游戏 CSS");
}

// C22：旧档接回——j010/j011→j012、l013/l014→l015，背包/弃物反推布尔
function checkLegacySaveMigration() {
  var XB = loadGame();
  var save = XB.core.serialize(XB.core.defaults());
  save.scene = "vn";
  save.chapterId = "jinsha";
  save.nodeId = "j010";
  save.flags = {};
  save.inventory = { door: false, items: ["roster", "pencil", "medicine", "pot"] };
  var first = XB.core.normalize(save);
  if (first.issue) fail("C22", "旧金沙江档被判坏档：" + first.issue);
  else {
    if (first.state.nodeId !== "j012") fail("C22", "j010 没有接回 j012，实际 " + first.state.nodeId);
    if (first.migrated !== "jinsha") fail("C22", "jinsha 迁移标记缺失");
    if (first.state.flags["item.medicine"] !== true || first.state.flags["item.homepot"] !== true) fail("C22", "旧背包没有反推 item.*");
  }
  var second = XB.core.serialize(XB.core.defaults());
  second.scene = "vn";
  second.chapterId = "luding";
  second.nodeId = "l013";
  second.flags = { "choice.xiangjiang.abandoned": ["medkit", "radio", "silver"] };
  second.inventory = { door: false, items: [] };
  var third = XB.core.normalize(second);
  if (third.issue) fail("C22", "旧泸定档被判坏档：" + third.issue);
  else {
    if (third.state.nodeId !== "l015") fail("C22", "l013 没有接回 l015，实际 " + third.state.nodeId);
    if (third.migrated !== "luding") fail("C22", "luding 迁移标记缺失");
    if (third.state.flags["choice.xiangjiang.take.xray"] !== true || third.state.flags["choice.xiangjiang.take.medkit"] !== false) fail("C22", "旧 abandoned 没有反推 take.*");
  }
  notes.push("C22 OK 旧档 j010/j011→j012、l013/l014→l015；背包/弃物反推布尔一次");
}


// C24：九章表、节点数、id 前缀/唯一、end、title/codex 位置与文档表一致
function checkChapterTable() {
  var XB = loadGame();
  var expected = [
    { id: "prologue", prefix: "p", count: 89, next: "xiangjiang", title: true },
    { id: "xiangjiang", prefix: "x", count: 114, next: "zunyi", title: true },
    { id: "zunyi", prefix: "z", count: 118, next: "jinsha", title: true },
    { id: "jinsha", prefix: "j", count: 86, next: "luding", title: true },
    { id: "luding", prefix: "l", count: 120, next: "grass", title: true, first: "l100" },
    { id: "grass", prefix: "g", count: 135, next: "wuqi", title: true, extraEnds: ["coda", "badend"] },
    { id: "wuqi", prefix: "w", count: 78, next: "ending", title: false },
    { id: "coda", prefix: "c", count: 18, next: "ending", title: true, hidden: true, last: "c012" },
    { id: "badend", prefix: "b", count: 8, next: "ending", title: true, hidden: true, last: "b006", codex: false }
  ];
  var doc = readRoot("docs/chapter-integration.md");
  var docCounts = {};
  (doc.split(/\r?\n/)).forEach(function (line) {
    var row = /^\|\s*(\d+)\s*\|\s*`?([a-z]+)[^|]*\|\s*([a-z])\s*\|\s*(\d+)\s*\|/.exec(line);
    if (row) docCounts[row[2]] = Number(row[4]);
  });
  var allIds = {};
  expected.forEach(function (item, index) {
    var chapter = XB.core.chapterById(item.id);
    if (!chapter) {
      fail("C24", "缺章节 " + item.id);
      return;
    }
    if (chapter.order !== index + 1) fail("C24", item.id + " order 应为 " + (index + 1));
    if (chapter.playable !== true) fail("C24", item.id + " 未设 playable");
    if ((chapter.hidden === true) !== (item.hidden === true)) fail("C24", item.id + " hidden 标记不符");
    if (chapter.nodes.length !== item.count) fail("C24", item.id + " 节点应为 " + item.count + "，实际 " + chapter.nodes.length);
    if (docCounts[item.id] !== item.count) fail("C24", "chapter-integration 表 " + item.id + " 应为 " + item.count + "，实际 " + docCounts[item.id]);
    var nodes = chapter.nodes;
    var firstId = item.first || item.prefix + "001";
    if (nodes[0].id !== firstId) fail("C24", item.id + " 首节点应为 " + firstId);
    var lastId = item.last || item.prefix + "900";
    if (nodes[nodes.length - 1].id !== lastId) fail("C24", item.id + " 末节点应为 " + lastId + "，实际 " + nodes[nodes.length - 1].id);
    var codexCount = nodes.filter(function (node) { return node.type === "codex"; }).length;
    if (codexCount !== (item.codex === false ? 0 : 1)) fail("C24", item.id + " codex 节点数不符，实际 " + codexCount);
    var titleCount = nodes.filter(function (node) { return node.type === "title"; }).length;
    if (titleCount !== (item.title ? 1 : 0)) fail("C24", item.id + " title 节点数不符");
    var end = nodes[nodes.length - 1];
    if (end.type !== "end" || end.next !== item.next) fail("C24", item.id + " end.next 应为 " + item.next);
    (item.extraEnds || []).forEach(function (target) {
      if (!nodes.some(function (node) { return node.type === "end" && node.next === target; })) {
        fail("C24", item.id + " 缺少 next=" + target + " 的 end");
      }
    });
    nodes.forEach(function (node) {
      if (!(new RegExp("^" + item.prefix + "\\d{3}[a-z]?$")).test(node.id)) fail("C24", item.id + " 节点 id 不合规则：" + node.id);
      if (allIds[node.id]) fail("C24", "节点 id 重复：" + node.id);
      allIds[node.id] = true;
    });
  });
  notes.push("C24 OK 九章 89/114/118/86/120/135/78/18/8 共 766 节点，id 前缀/唯一/end/title+codex 位置与 chapter-integration 一致");
}

// C25：7 个 codex 节点各一次，id 与 story.codex 一致；图鉴只读一份数据
function checkCodexNodes() {
  var XB = loadGame();
  var codexNodes = [];
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.type === "codex") codexNodes.push({ chapter: chapter.id, node: node });
    });
  });
  if (codexNodes.length !== 8) fail("C25", "codex 节点应为 8 个（吴起两份：w041 + coda c010），实际 " + codexNodes.length);
  var storyIds = XB.story.codex.map(function (card) { return card.id; });
  if (storyIds.join(",") !== "yudu,xiangjiang,zunyi,jinsha,luding,grass,wuqi") fail("C25", "story.codex 顺序/数量不对：" + storyIds.join(","));
  var seen = {};
  codexNodes.forEach(function (entry) {
    if (!entry.node.codexId) fail("C25", entry.node.id + " 缺 codexId");
    else if (storyIds.indexOf(entry.node.codexId) === -1) fail("C25", entry.node.id + " 的 codexId 不在 story.codex");
    else if (seen[entry.node.codexId]) {
      if (!(entry.node.codexId === "wuqi" && entry.chapter === "coda")) fail("C25", "codex 节点重复：" + entry.node.codexId);
    } else seen[entry.node.codexId] = true;
  });
  var engine = stripComments(readProject("engine.js"));
  ["XB.story.codex", "renderGallery", "gallery-card"].forEach(function (needle) {
    if (engine.indexOf(needle) === -1) fail("C25", "图鉴未从 story.codex 单一数据源生成，缺 " + needle);
  });
  notes.push("C25 OK 8 个 codex 节点一一对应 story.codex（吴起 + 空页各张一次）；图鉴单源");
}

// C26：ending 数据、w900→ending、SCENES 含 ending、五卡/七名/数字
function checkEndingData() {
  var XB = loadGame();
  var ending = XB.story.ending;
  if (!ending) {
    fail("C26", "story.ending 缺失");
    return;
  }
  ["title", "date", "lede", "disclaimer"].forEach(function (field) {
    if (!ending[field]) fail("C26", "story.ending 缺 " + field);
  });
  var cards = ending.cards || [];
  if (cards.length !== 5) fail("C26", "五卡应为 5 项，实际 " + cards.length);
  if (cards.map(function (card) { return card.id; }).join(",") !== "ideal,sacrifice,truth,overall,people") fail("C26", "五卡 id 顺序不对");
  cards.forEach(function (card) {
    ["title", "litLine", "unlitLine"].forEach(function (field) {
      if (!card[field]) fail("C26", card.id + " 缺 " + field);
    });
  });
  var w900 = XB.core.locate("wuqi", "w900").node;
  if (!w900 || w900.type !== "end" || w900.next !== "ending") fail("C26", "w900.next 应为 ending");
  if (XB.core.SCENES.indexOf("ending") === -1) fail("C26", "core SCENES 缺 ending");
  var built = XB.core.buildEnding(XB.core.defaults());
  var stats = built.stats;
  if (!stats || stats.companyStart !== 104 || stats.companyEnd !== 19 || stats.redStart !== 86000 || stats.redEnd !== 7000) {
    fail("C26", "ending stats 不是 104/19/86000/7000");
  }
  if (!built.cards || built.cards.length !== 5) fail("C26", "buildEnding 没产出五卡");
  if (!built.names || built.names.length !== 7) fail("C26", "默认路线 buildEnding 应产出七名");
  if (built.route !== "no_door_zero" || built.stats.companyEnd !== 19) fail("C26", "无板 0 救应为 8(1)、companyEnd 19，实际 " + built.route);
  var others = XB.core.defaults();
  ["fate.feimao.dead", "fate.zaowang.dead", "fate.dongsheng.dead"].forEach(function (key) { others.flags[key] = true; });
  others.flags["had.door"] = true;
  others.flags.rescues = 3;
  others.flags.condition = 0;
  XB.core.syncDerivedFlags(others);
  var seven5 = XB.core.buildEnding(others);
  if (seven5.route !== "door_others") fail("C26", "有板救 3 且倒下应判 7(5)，实际 " + seven5.route);
  if (seven5.names.length !== 8) fail("C26", "7(5) 应产出八名（含满崽）");
  if (seven5.stats.companyEnd !== 18) fail("C26", "7(5) companyEnd 应为 18，实际 " + seven5.stats.companyEnd);
  if (!built.stats || built.stats.redStart !== 86000) fail("C26", "buildEnding 没带数字");
  var cold = XB.core.defaults();
  cold.flags.fire = 10;
  var coldCards = XB.core.buildEnding(cold).cards;
  if (coldCards.filter(function (card) { return card.id === "ideal"; })[0].lit !== false) fail("C26", "fire=10 时 ideal 不应亮");
  if (/\bcard\./.test(stripComments(readProject("story.js")))) fail("C26", "story.js 写了 card.*");
  notes.push("C26 OK ending 五卡/七名/四位数字；w900→ending；engine SCENES 含 ending");
}

// C27：吴起 1 个 rollcall interact（45s、7 名），不评分
function checkRollcallData() {
  var XB = loadGame();
  var wuqi = XB.core.chapterById("wuqi");
  var interacts = (wuqi.nodes || []).filter(function (node) { return node.type === "interact"; });
  if (interacts.length !== 1) fail("C27", "吴起应有 1 个 interact，实际 " + interacts.length);
  var node = interacts[0];
  if (!node) return;
  if (node.mode !== "rollcall") fail("C27", "点名 mode 应为 rollcall");
  if (node.duration !== 45) fail("C27", "点名 duration 应为 45，实际 " + node.duration);
  if (node.names !== undefined) fail("C27", "点名 names 应动态解析，不写静态数组");
  var coda = XB.core.chapterById("coda");
  var codaInteracts = (coda.nodes || []).filter(function (item) { return item.type === "interact"; });
  if (codaInteracts.length !== 1 || codaInteracts[0].coda !== true) fail("C27", "空页章应有 1 个 coda 点名 interact");
  if (codaInteracts[0] && codaInteracts[0].duration !== 45) fail("C27", "空页点名 duration 应为 45");
  var six = XB.core.resolveRollCall(XB.core.defaults(), false);
  if (six.length !== 7) fail("C27", "常规点名应解析 7 名，实际 " + six.length);
  var seven = XB.core.resolveRollCall(XB.core.defaults(), true);
  if (seven.length !== 8) fail("C27", "空页点名应解析 8 名，实际 " + seven.length);
  var last = seven[seven.length - 1] || {};
  if (last.id !== "manzi" || last.status !== "absent" || last.answeredBy !== "dongsheng") fail("C27", "满崽应由冬生代答且缺席");
  var ids = {};
  six.forEach(function (entry) {
    if (ids[entry.id]) fail("C27", "点名 id 重复：" + entry.id);
    ids[entry.id] = true;
    if (XB.core.NAME_STATUS.indexOf(entry.status) === -1 && entry.status !== "absent") fail("C27", entry.id + " 状态非法：" + entry.status);
  });
  var raw = JSON.stringify(node);
  if (/\bsuccess\b|\bscore\b/i.test(raw)) fail("C27", "点名数据出现 success/score");
  var html = readProject("index.html");
  ["vn-interact", "interact-name", "interact-answer", "interact-progress"].forEach(function (id) {
    if (html.indexOf('id="' + id + '"') === -1) fail("C27", "index.html 缺 #" + id);
  });
  var css = readProject("style.css");
  if (css.indexOf(".vn-interact") === -1) fail("C27", "style.css 缺 .vn-interact");
  notes.push("C27 OK 吴起+空页点名 2 个 interact（45s）/ 动态 7→8 名 / 冬生代答 / 无评分；DOM 与样式就位");
}

// C28：图鉴 DOM、两处入口、7 卡样式
function checkGalleryDom() {
  var html = readProject("index.html");
  ["codex-gallery", "gallery-title", "gallery-count", "gallery-grid", "gallery-close"].forEach(function (id) {
    if (html.indexOf('id="' + id + '"') === -1) fail("C28", "index.html 缺 #" + id);
  });
  var entries = (html.match(/data-action="codex"/g) || []).length;
  if (entries < 2) fail("C28", "图鉴入口应至少 2 处（标题/暂停），实际 " + entries);
  if (html.indexOf('data-action="ending-codex"') === -1) fail("C28", "结局页缺图鉴入口");
  var css = readProject("style.css");
  [".xb-gallery", ".xb-gallery__grid", ".xb-gallery__card", ".xb-gallery__card.is-locked"].forEach(function (selector) {
    if (css.indexOf(selector) === -1) fail("C28", "style.css 缺 " + selector);
  });
  var engine = stripComments(readProject("engine.js"));
  ["openGallery", "closeGallery", "openGalleryCard", "galleryGateLabel"].forEach(function (name) {
    if (engine.indexOf(name) === -1) fail("C28", "engine.js 缺 " + name);
  });
  notes.push("C28 OK 图鉴全屏遮罩、标题/暂停/结局入口、7 卡样式与交互函数就位");
}

// C29：章末记忆与进入吴起前置；只置 true，不覆盖
function checkChapterMemory() {
  var XB = loadGame();
  var expected = {
    xiangjiang: "memory.zhou",
    zunyi: "memory.he",
    luding: "memory.feimao",
    grass: "memory.zaowang"
  };
  if (JSON.stringify(XB.core.CHAPTER_MEMORY) !== JSON.stringify(expected)) fail("C29", "CHAPTER_MEMORY 映射不对");
  if (XB.core.WUQI_MEMORY.join(",") !== "memory.ximei,memory.dongsheng,memory.lin") fail("C29", "WUQI_MEMORY 不对");
  var engine = stripComments(readProject("engine.js"));
  if (engine.indexOf("if (state.flags[key] !== true)") === -1) fail("C29", "章末记忆没有“只置 true”保护");
  if (engine.indexOf("WUQI_MEMORY.forEach") === -1) fail("C29", "进入吴起未写三条前置记忆");
  Object.keys(expected).forEach(function (chapterId) {
    if (!XB.core.chapterById(chapterId)) fail("C29", "章末记忆指向不存在的章节 " + chapterId);
  });
  notes.push("C29 OK 章末 4 条 + 吴起前置 3 条；只置 true；memory bool 走 setFlag");
}

// C30：ending 快照形状、11 键、ending 场景约束、4096B
function checkEndingSnapshot() {
  var XB = loadGame();
  if (XB.core.PERSIST_KEYS.join(",") !== "version,scene,chapterId,nodeId,flags,inventory,choices,codex,settings,unlockedChapters,ending") {
    fail("C30", "PERSIST_KEYS 应保持 11 键");
  }
  var state = XB.core.defaults();
  state.scene = "ending";
  state.chapterId = "wuqi";
  state.nodeId = null;
  state.ending = XB.core.buildEnding(state);
  if (!XB.core.isFullEnding(state.ending)) fail("C30", "buildEnding 不是完整快照");
  var save = JSON.parse(JSON.stringify(XB.core.serialize(state)));
  var result = XB.core.normalize(save);
  if (result.issue !== null || result.state.scene !== "ending") {
    fail("C30", "完整 ending 存档 normalize 失败：" + result.issue);
    return;
  }
  var a = result.state.ending;
  var b = state.ending;
  if (JSON.stringify(a.names) !== JSON.stringify(b.names) ||
      JSON.stringify(a.cards) !== JSON.stringify(b.cards) ||
      JSON.stringify(a.stats) !== JSON.stringify(b.stats) ||
      a.answered !== b.answered || a.missed !== b.missed) fail("C30", "ending 快照 roundtrip 不等");
  var tooMany = JSON.parse(JSON.stringify(save));
  tooMany.ending.extra = true;
  if (XB.core.normalize(tooMany).issue !== "ending") fail("C30", "ending 多键应判坏档");
  var noCards = JSON.parse(JSON.stringify(save));
  delete noCards.ending.cards;
  if (XB.core.normalize(noCards).issue !== "ending") fail("C30", "ending 缺 cards 应判坏档");
  var withNode = JSON.parse(JSON.stringify(save));
  withNode.nodeId = "p001";
  if (XB.core.normalize(withNode).issue !== "ending") fail("C30", "ending 带 nodeId 应判坏档");
  var bytes = new TextEncoder().encode(JSON.stringify(save)).length;
  if (bytes >= 4096) fail("C30", "ending 存档 " + bytes + "B 超过 4096");
  if (save.ending && save.ending.cards && save.ending.cards.length !== 5) fail("C30", "存档五卡不是 5 项");
  notes.push("C30 OK ending 快照 stats/names/cards/answered/missed 形状；11 键；" + bytes + "B < 4096");
}

// C31：无音频文件、无 new Audio，AudioContext 只在 engine.js 的 XB.audio
function checkAudioAssets() {
  var code = JS_FILES.map(function (file) {
    return stripComments(readProject(file));
  }).join("\n");
  var audioExt = /\.(mp3|wav|ogg|m4a|flac|aac|opus|weba)\b/i;
  var audioRefs = code.match(/["']([^"']+\.(?:mp3|wav|ogg|m4a|flac|aac|opus|weba))["']/gi) || [];
  audioRefs.forEach(function (quoted) {
    var rel = quoted.slice(1, -1);
    if (rel.indexOf("./assets/audio/") !== 0) fail("C31", "音频引用不在 assets/audio：" + rel);
    if (!fs.existsSync(path.join(PROJECT_DIR, rel.slice(2)))) fail("C31", "音频文件缺失：" + rel);
    if (!/\.mp3$/i.test(rel)) fail("C31", "运行时音频只允许 mp3：" + rel);
  });
  if (/\bnew\s+Audio\s*\(/.test(code)) fail("C31", "出现 new Audio(");
  JS_FILES.forEach(function (file) {
    if (file === "engine.js") return;
    var js = stripComments(readProject(file));
    if (/AudioContext|webkitAudioContext/.test(js)) fail("C31", file + " 创建了 AudioContext，应只在 XB.audio");
  });
  var engine = stripComments(readProject("engine.js"));
  if (engine.indexOf("var Ctor = window.AudioContext || window.webkitAudioContext;") === -1) fail("C31", "缺 AudioContext 构造点");
  if ((engine.match(/new Ctor\(\)/g) || []).length !== 1) fail("C31", "engine.js 应只有一个 new Ctor() 创建点");
  if (engine.indexOf("createMediaElementSource") === -1) fail("C31", "缺 createMediaElementSource");
  var html = readProject("index.html");
  if (/<audio\b/i.test(html)) fail("C31", "index.html 含 <audio>");
  if (audioExt.test(html)) fail("C31", "index.html 引用音频文件");
  var assetDir = path.join(PROJECT_DIR, "assets");
  var audioFiles = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
      var full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(mp3|wav|ogg|m4a|flac|aac|opus|weba)$/i.test(entry.name)) audioFiles.push(full);
    });
  }
  walk(assetDir);
  if (audioFiles.length < 10) fail("C31", "assets 音频文件过少，实际 " + audioFiles.length);
  audioFiles.forEach(function (file) {
    if (!/\.mp3$/i.test(file)) fail("C31", "运行时音频只允许 mp3：" + path.basename(file));
  });
  notes.push("C31 OK 外置音频 " + audioFiles.length + " 个（mp3）、无 new Audio、AudioContext 只在 XB.audio");
}

// C32：手势解锁、可见性暂停、压缩器、无 setInterval
function checkAudioLifecycle() {
  var engine = stripComments(readProject("engine.js"));
  if (engine.indexOf("function unlockAudio(") === -1) fail("C32", "缺 unlockAudio");
  if (!/function onPointerDown\(event\) \{\s*XB\.audio\.unlock\(\);/.test(engine)) fail("C32", "onPointerDown 首行未 unlock");
  if (!/function onKeyDown\(event\) \{\s*XB\.audio\.unlock\(\);/.test(engine)) fail("C32", "onKeyDown 首行未 unlock");
  if (engine.indexOf('document.addEventListener("visibilitychange"') === -1) fail("C32", "缺 visibilitychange");
  if (engine.indexOf("XB.audio.suspend()") === -1 || engine.indexOf("XB.audio.resume()") === -1) fail("C32", "可见性切换未 suspend/resume");
  if (engine.indexOf("setTargetAtTime") === -1) fail("C32", "增益未用 setTargetAtTime");
  if (engine.indexOf("createDynamicsCompressor") === -1) fail("C32", "缺 DynamicsCompressor");
  if (/setInterval\s*\(/.test(engine)) fail("C32", "engine.js 不应使用 setInterval");
  var applyStart = engine.indexOf("function applyAudioSettings(");
  var applyEnd = engine.indexOf("\n  function ", applyStart + 10);
  var applyBody = applyStart >= 0 ? engine.slice(applyStart, applyEnd > applyStart ? applyEnd : applyStart + 900) : "";
  if (!applyBody) fail("C32", "缺 applyAudioSettings");
  if (/unlock|AudioContext|new\s+Audio/.test(applyBody)) fail("C32", "applyAudioSettings 不应创建上下文或解锁");
  notes.push("C32 OK 首次手势解锁、hidden suspend/visible resume、压缩器、无 setInterval");
}

// C33：9 张床、17 个场景映射、未知回退
function checkAudioBeds() {
  var XB = loadGame();
  var beds = XB.audio.BEDS;
  var expectedBeds = ["wind_title", "yudu", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi", "ending"];
  if (beds.length !== 9) fail("C33", "BEDS 应为 9 张，实际 " + beds.length);
  expectedBeds.forEach(function (id) {
    if (beds.indexOf(id) === -1) fail("C33", "BEDS 缺 " + id);
  });
  var map = XB.audio.BED_BY_SCENE;
  if (!map || Object.keys(map).length !== 18) fail("C33", "BED_BY_SCENE 应为 18 项，实际 " + (map ? Object.keys(map).length : 0));
  ["title", "map", "ending"].forEach(function (scene) {
    if (!map || !map[scene]) fail("C33", "BED_BY_SCENE 缺显式场景 " + scene);
  });
  var bgs = {};
  XB.story.chapters.forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.bg) bgs[node.bg] = true;
    });
  });
  Object.keys(bgs).forEach(function (bg) {
    if (!map || !map[bg]) fail("C33", "剧情背景没有床：" + bg);
  });
  if (!map || map.luding_bridge !== "luding") fail("C33", "泸定桥应映射 luding");
  if (XB.audio.bedForScene("no_such_scene") !== "wind_title") fail("C33", "未知场景应回退 wind_title");
  if (XB.audio.CUES.length !== 12) fail("C33", "CUES 应为 12 个，实际 " + XB.audio.CUES.length);
  notes.push("C33 OK 9 床 / 18 场景 / " + Object.keys(bgs).length + " 个剧情背景全覆盖 / 未知回退");
}

// C34：设置接线，存档仍 11 键且不新增 audio 键
function checkAudioSettings() {
  var XB = loadGame();
  if (XB.core.PERSIST_KEYS.length !== 11) fail("C34", "PERSIST_KEYS 应仍为 11 键，实际 " + XB.core.PERSIST_KEYS.length);
  if (XB.core.PERSIST_KEYS.indexOf("audio") !== -1) fail("C34", "PERSIST_KEYS 不应新增 audio");
  var settingsKeys = Object.keys(XB.core.DEFAULT_SETTINGS);
  var allowedSettings = ["textSpeed", "textScale", "volume", "musicVolume", "ambienceVolume", "muted", "reducedMotion", "skipSeen"];
  if (settingsKeys.length !== allowedSettings.length) fail("C34", "settings 应为 8 键，实际 " + settingsKeys.length);
  settingsKeys.forEach(function (key) {
    if (allowedSettings.indexOf(key) === -1) fail("C34", "settings 含未知键 " + key);
  });
  var engine = stripComments(readProject("engine.js"));
  if (engine.indexOf("XB.audio.applySettings(state.settings)") === -1) fail("C34", "applySettings 未接音频");
  if (engine.indexOf("XB.audio.applySettings({ volume: state.settings.volume })") === -1) fail("C34", "总音量滑块未实时应用");
  if (engine.indexOf("XB.audio.applySettings({ musicVolume: state.settings.musicVolume })") === -1) fail("C34", "配乐滑块未实时应用");
  if (engine.indexOf("XB.audio.applySettings({ ambienceVolume: state.settings.ambienceVolume })") === -1) fail("C34", "环境音滑块未实时应用");
  if (engine.indexOf("XB.fx.setReduced(state.settings.reducedMotion === true)") === -1) fail("C34", "applySettings 未接 fx reduced");
  notes.push("C34 OK 总音量/配乐/环境音实时接线、设置 8 键、存档 11 键、无 audio 持久键");
}

// C35：特效层位置、样式、reduced 入口
function checkFxLayer() {
  var html = readProject("index.html");
  var css = readProject("style.css");
  var layerAt = html.indexOf('id="fx-layer"');
  var endingAt = html.indexOf('id="scene-ending"');
  var pauseAt = html.indexOf('id="pause"');
  if (layerAt === -1) fail("C35", "index.html 缺 #fx-layer");
  if (layerAt !== -1 && (layerAt < endingAt || layerAt > pauseAt)) fail("C35", "#fx-layer 应在 #scene-ending 之后、#pause 之前");
  if (layerAt !== -1) {
    var openTag = html.slice(layerAt, html.indexOf(">", layerAt) + 1);
    if (openTag.indexOf('aria-hidden="true"') === -1) fail("C35", "#fx-layer 应 aria-hidden");
    if (openTag.indexOf('class="fx-layer"') === -1) fail("C35", "#fx-layer 应带 fx-layer 类");
    if (html.indexOf('class="fx-wipe"') === -1 || html.indexOf('class="fx-flash"') === -1) fail("C35", "缺 fx-wipe/fx-flash 子层");
  }
  if (!/\.fx-layer\s*\{/.test(css)) fail("C35", "style.css 缺 .fx-layer");
  if (!/--z-transition\s*:\s*60/.test(css)) fail("C35", "--z-transition 应为 60");
  if (!/\.xb-ending__name\.is-struck/.test(css)) fail("C35", "style.css 缺 .is-struck 划名");
  if (css.indexOf("prefers-reduced-motion: reduce") === -1) fail("C35", "style.css 缺系统 reduced 规则");
  if (css.indexOf("html.reduce-motion") === -1) fail("C35", "style.css 缺设置 reduced 规则");
  notes.push("C35 OK #fx-layer 位置/aria、wipe/flash 子层、划名与两套 reduced 规则");
}

// C36：闪白/震动/划名上限，减少动效时不抛错
function checkFxLimits() {
  var XB = loadGame();
  var limits = XB.fx && XB.fx.LIMITS;
  if (!limits) {
    fail("C36", "缺 XB.fx.LIMITS");
    return;
  }
  if (!(limits.flashMs <= 150)) fail("C36", "flashMs 应 ≤150");
  if (!(limits.flashGapMs >= 2000)) fail("C36", "flashGapMs 应 ≥2000");
  if (!(limits.flashOpacity <= 0.12)) fail("C36", "flashOpacity 应 ≤0.12");
  if (!(limits.shakeMs <= 200)) fail("C36", "shakeMs 应 ≤200");
  if (!(limits.shakePx <= 2)) fail("C36", "shakePx 应 ≤2");
  if (!(limits.strikeMs <= 500)) fail("C36", "strikeMs 应 ≤500");
  if (!(limits.strikeMs > 0 && limits.wipeMs > 0)) fail("C36", "动效时长应为正数");
  try {
    XB.fx.setReduced(true);
    if (XB.fx.isReduced() !== true) fail("C36", "setReduced(true) 未生效");
    XB.fx.setReduced(false);
  } catch (error) {
    fail("C36", "setReduced 抛错：" + error.message);
  }
  var css = readProject("style.css");
  if (css.indexOf("prefers-reduced-motion") === -1) fail("C36", "CSS 缺系统 reduced 分支");
  var engine = stripComments(readProject("engine.js"));
  if ((engine.match(/fxReduced\(\)/g) || []).length < 3) fail("C36", "转场/闪白/震动应各有 reduced 守卫");
  notes.push("C36 OK 闪白 " + limits.flashMs + "ms/" + limits.flashOpacity + "、震动 " + limits.shakeMs + "ms/" + limits.shakePx + "px、划名 " + limits.strikeMs + "ms");
}

// C37：制作名单入口与文本完整性（步骤八）
function checkCredits() {
  var creditsPath = path.join(PROJECT_DIR, "CREDITS.txt");
  if (!fs.existsSync(creditsPath)) {
    fail("C37", "缺 project/CREDITS.txt");
    return;
  }
  var credits = fs.readFileSync(creditsPath, "utf8");
  var html = readProject("index.html");
  if (html.indexOf('href="./CREDITS.txt"') === -1) fail("C37", "index.html 缺 ./CREDITS.txt 链接");
  if (!/刘子政/.test(credits)) fail("C37", "CREDITS.txt 缺制作署名");
  if (/<[^>]*姓名|TODO|待填|待补|<老师>|<姓名>/.test(credits)) fail("C37", "CREDITS.txt 仍有姓名/待填占位");
  var creditsBytes = Buffer.byteLength(credits, "utf8");
  if (creditsBytes > 16384) fail("C37", "CREDITS.txt 超过 16KB（" + creditsBytes + " 字节）");
  if (credits.indexOf("虚构人物") === -1) fail("C37", "CREDITS.txt 缺虚构声明");
  ["OFL", "Wikimedia Commons", "CC BY-SA", "OpenGameArt"].forEach(function (needle) {
    if (credits.indexOf(needle) === -1) fail("C37", "CREDITS.txt 缺素材授权字段 " + needle);
  });
  notes.push("C37 OK CREDITS.txt " + credits.length + " 字符 / " + creditsBytes + " 字节、刘子政署名、虚构声明、字体/图像/音频授权、./CREDITS.txt 链接");
}

// C39：v1.4 十一条结局账本与结局快照
function checkEndingRoutes() {
  var XB = loadGame();
  function makeState(flags) {
    var state = XB.core.defaults();
    Object.keys(flags).forEach(function (key) { state.flags[key] = flags[key]; });
    XB.core.syncDerivedFlags(state);
    return state;
  }
  function expectRoute(label, flags, route, title, companyEnd, namesLen, routeLabel, routeIndex) {
    var ending = XB.core.buildEnding(makeState(flags));
    if (ending.route !== route) fail("C39", label + " 路线应为 " + route + "，实际 " + ending.route);
    if (ending.routeTitle !== title) fail("C39", label + " 标题应为 " + title + "，实际 " + ending.routeTitle);
    if (!ending.routeLede) fail("C39", label + " 缺路线引语");
    if (ending.routeLabel !== routeLabel) fail("C39", label + " 编号应为 " + routeLabel + "，实际 " + ending.routeLabel);
    if (ending.routeIndex !== routeIndex) fail("C39", label + " routeIndex 应为 " + routeIndex);
    if (companyEnd !== undefined && ending.stats.companyEnd !== companyEnd) fail("C39", label + " companyEnd 应为 " + companyEnd);
    if (namesLen !== undefined && ending.names.length !== namesLen) fail("C39", label + " 点名应为 " + namesLen + " 名");
    return ending;
  }
  expectRoute("7(1) 门板·一直优秀", { "had.door": true, "item.door": true, rescues: 0, condition: 4 }, "door_excellent", "门板", 19, 7, "1", 1);
  expectRoute("7(2) 门板留草地·救1", { "had.door": true, "item.door": false, doorOutcome: "grass", rescues: 1, condition: 1 }, "door_grass_one", "门板", 19, 7, "2", 2);
  expectRoute("7(2) 门板留桥上·救1", { "had.door": true, "item.door": false, doorOutcome: "bridge", rescues: 1, condition: 1 }, "door_grass_one", "桥板", 19, 7, "2", 2);
  expectRoute("7(3) 门板到吴起·救2", { "had.door": true, "item.door": true, rescues: 2, condition: 3 }, "door_carry_two", "门板", 19, 7, "3", 3);
  expectRoute("7(4) 门板留草地·救2", { "had.door": true, "item.door": false, doorOutcome: "grass", rescues: 2, condition: 2 }, "door_grass_many", "门板", 19, 7, "4", 4);
  expectRoute("7(4) 门板留桥上·救2", { "had.door": true, "item.door": false, doorOutcome: "bridge", rescues: 2, condition: 2 }, "door_grass_many", "桥板", 19, 7, "4", 4);
  var seven5 = expectRoute("7(5) 空页", { "had.door": true, "item.door": false, doorOutcome: "others", rescues: 3, condition: 0, "fate.feimao.dead": true, "fate.zaowang.dead": true, "fate.dongsheng.dead": true }, "door_others", "空页", 18, 8, "5", 5);
  if (seven5.fate.player !== "dead" || seven5.fate.dongsheng !== "dead") fail("C39", "7(5) fate 快照不对");
  var sacrifice = seven5.cards.filter(function (card) { return card.id === "sacrifice"; })[0];
  if (!sacrifice || sacrifice.lit !== true) fail("C39", "7(5) 牺牲卡应亮");
  if (sacrifice.line !== XB.story.ending.kongyeSacrificeLine) fail("C39", "7(5) 牺牲卡没用 kongyeSacrificeLine");
  expectRoute("8(1) 空手·救0", { rescues: 0, condition: 3 }, "no_door_zero", "空手", 19, 7, "6", 6);
  expectRoute("8(2) 空手·救1", { rescues: 1, condition: 2 }, "no_door_one", "空手", 19, 7, "7", 7);
  expectRoute("8(3) 空手·救2", { rescues: 2, condition: 2 }, "no_door_two", "空手", 19, 7, "8", 8);
  expectRoute("8(4) 空手·救3", { rescues: 3, condition: 3 }, "no_door_three", "空手", 19, 7, "9", 9);
  expectRoute("8(5) 空手·救3且优秀", { rescues: 3, condition: 4 }, "no_door_three_excellent", "空手", 19, 7, "10", 10);
  var bad = expectRoute("坏结局", { rescues: 1, condition: 0 }, "bad_end", "没有走出草地", 18, 0, "11", 11);
  if (bad.fate.player !== "dead" || bad.names.length !== 0) fail("C39", "坏结局应为无点名且我死");

  var state = makeState({ "had.door": true, "item.door": false, doorOutcome: "others", rescues: 3, condition: 0, "fate.feimao.dead": true, "fate.zaowang.dead": true, "fate.dongsheng.dead": true });
  state.scene = "ending";
  state.chapterId = "coda";
  state.nodeId = null;
  state.ending = XB.core.buildEnding(state);
  var result = XB.core.normalize(JSON.parse(JSON.stringify(XB.core.serialize(state))));
  if (result.issue !== null || !result.state.ending) {
    fail("C39", "7(5) ending 存档 normalize 失败：" + result.issue);
    return;
  }
  var snap = result.state.ending;
  if (snap.route !== "door_others" || snap.routeLabel !== "5" || snap.condition !== 0 || snap.rescues !== 3) {
    fail("C39", "ending 快照丢了 7(5) 的 route/condition/rescues");
  }
  if (!snap.fate || snap.fate.player !== "dead" || snap.fate.feimao !== "dead" || snap.fate.lin !== "dead") {
    fail("C39", "7(5) ending 快照 fate 不符");
  }
  notes.push("C39 OK 11 结局账本 7(1)–7(5)/8(1)–8(5)/坏结局；桥板/石墙按 doorOutcome；7(5) 18 人八名、坏结局零点名；快照保留 routeLabel/condition/rescues/fate");
}

// C40：requires/容量/物资/状态/迁移/名册
function checkFateMechanics() {
  var XB = loadGame();
  var state = XB.core.defaults();
  if (!XB.core.startChapter(state, "luding", "l019x")) {
    fail("C40", "定位不到 l019x");
    return;
  }
  var node = XB.core.currentNode(state);
  if (XB.core.visibleOptions(state, node).length !== 1) fail("C40", "无药时应只显示“继续走”1 项");
  if (XB.core.applyChoice(state, node, "A", false) !== null) fail("C40", "缺药也能选喂药");
  if (XB.core.currentNode(state).id !== "l019x") fail("C40", "被拒选项不应推进节点");
  XB.core.setFlag(state, "item.medicine", true);
  if (XB.core.visibleOptions(state, node).length !== 2) fail("C40", "有药时 l019x 应显示 2 项");
  if (!XB.core.applyChoice(state, XB.core.currentNode(state), "A", false)) fail("C40", "有药却不能选喂药");
  // 喂药要真的从行囊扣掉：旗标、清单、半格计数三处一致，别只写旗标。
  if (state.inventory.items.indexOf("medicine") !== -1) fail("C40", "喂药后行囊里还留着药");
  if (XB.core.packUsage(state) !== 0) fail("C40", "喂药后行囊半格没清零，实际 " + XB.core.packUsage(state));

  // 拒绝/无法补给的死亡也要产生状态事件，顶部提示才能写“你牺牲了”，不能静默改 fate。
  var doomed = XB.core.defaults();
  doomed.flags.condition = 1;
  XB.core.takeStatusEvents();
  XB.core.resolveGrassWarning(doomed);
  var deathEvents = XB.core.takeStatusEvents();
  var playerDeath = deathEvents.filter(function (event) { return event.kind === "player"; })[0];
  if (!playerDeath || playerDeath.to !== 0 || playerDeath.reason !== "没能补充物资") {
    fail("C40", "拒绝补给没有记录玩家 1→0 的状态事件");
  }

  // 同伴 0 也从 setFlag 统一记录；文案层再把它写成“牺牲了”，不再写“状态变为牺牲”。
  var loss = XB.core.defaults();
  if (!XB.core.startChapter(loss, "grass", "g018x")) {
    fail("C40", "定位不到 g018x");
  } else {
    XB.core.takeStatusEvents();
    if (!XB.core.applyChoice(loss, XB.core.currentNode(loss), "C", false)) fail("C40", "灶王不救选项失败");
    var lossEvents = XB.core.takeStatusEvents();
    var zaowangDeath = lossEvents.filter(function (event) { return event.kind === "zaowang"; })[0];
    if (!zaowangDeath || zaowangDeath.to !== 0) fail("C40", "灶王牺牲没有记录 quality 0 的状态事件");
  }

  // 湘江“回头接应老周”：带青稞才从清单扣，没带只落湿绑腿；代价不在选项上显示。
  var xyBarley = XB.core.defaults();
  xyBarley.flags["item.door"] = true;
  xyBarley.flags["had.door"] = true;
  xyBarley.flags["item.medicine"] = true;
  xyBarley.flags["item.barley"] = true;
  xyBarley.inventory.door = true;
  xyBarley.inventory.items = ["roster", "pencil", "medicine", "barley"];
  if (!XB.core.startChapter(xyBarley, "xiangjiang", "x025a")) {
    fail("C40", "定位不到 x025a");
  } else {
    var xyNode = XB.core.currentNode(xyBarley);
    if (!xyNode || xyNode.hideCost !== true) fail("C40", "x025a 应隐藏选项代价");
    if (!XB.core.applyChoice(xyBarley, xyNode, "A", false)) fail("C40", "x025a 带青稞却不能回头接应");
    if (xyBarley.inventory.items.indexOf("barley") !== -1) fail("C40", "回头接应后青稞没从清单扣掉");
    if (xyBarley.inventory.items.indexOf("medicine") === -1) fail("C40", "回头接应误扣了药");
    if (xyBarley.flags["memory.xiangjiang.barley_lost"] !== true) fail("C40", "带青稞没记 barley_lost");
    if (XB.core.packUsage(xyBarley) !== 5) fail("C40", "青稞扣掉后应剩门板 4 + 药 1");
  }

  var xyEmpty = XB.core.defaults();
  xyEmpty.flags["item.door"] = true;
  xyEmpty.flags["had.door"] = true;
  xyEmpty.flags["item.medicine"] = true;
  xyEmpty.inventory.door = true;
  xyEmpty.inventory.items = ["roster", "pencil", "medicine"];
  if (!XB.core.startChapter(xyEmpty, "xiangjiang", "x025a")) {
    fail("C40", "定位不到 x025a（无青稞）");
  } else {
    var xyEmptyNode = XB.core.currentNode(xyEmpty);
    if (!XB.core.applyChoice(xyEmpty, xyEmptyNode, "A", false)) fail("C40", "x025a 无青稞却不能回头接应");
    if (xyEmpty.inventory.items.length !== 3) fail("C40", "无青稞时回头接应不应动清单");
    if (xyEmpty.flags["memory.xiangjiang.binding_lost"] !== true) fail("C40", "无青稞没记 binding_lost");
    if (xyEmpty.flags["memory.xiangjiang.barley_lost"] === true) fail("C40", "无青稞却记了 barley_lost");
  }

  var xyNoDoor = XB.core.defaults();
  xyNoDoor.flags["item.barley"] = true;
  xyNoDoor.inventory.items = ["roster", "pencil", "barley"];
  if (!XB.core.startChapter(xyNoDoor, "xiangjiang", "x025b")) {
    fail("C40", "定位不到 x025b");
  } else {
    var xyNoDoorNode = XB.core.currentNode(xyNoDoor);
    if (!xyNoDoorNode || xyNoDoorNode.hideCost !== true) fail("C40", "x025b 应隐藏选项代价");
    if (!XB.core.applyChoice(xyNoDoor, xyNoDoorNode, "A", false)) fail("C40", "x025b 无门板却不能回头接应");
    if (xyNoDoor.inventory.items.indexOf("barley") !== -1) fail("C40", "x025b 回头接应后青稞没扣");
  }

  var repaired = XB.core.normalize({
    version: 2, scene: "vn", chapterId: "luding", nodeId: "l019x",
    flags: { "had.door": true, "item.medicine": false },
    inventory: { door: false, items: ["roster", "pencil", "medicine"] }
  });
  if (repaired.issue) fail("C40", "已吃药的旧残档被判坏档：" + repaired.issue);
  else if (repaired.state.inventory.items.indexOf("medicine") !== -1) fail("C40", "读档没修掉已经吃掉的药");
  var legacyPack = XB.core.normalize({
    version: 2, scene: "vn", chapterId: "luding", nodeId: "l019x",
    flags: { "had.door": true },
    inventory: { door: false, items: ["roster", "pencil", "medicine", "barley"] }
  });
  if (legacyPack.issue || legacyPack.state.inventory.items.length !== 4) fail("C40", "没有 item.* 键的旧行囊被误删");

  var fallback = XB.core.defaultOptionKey(state, {
    defaultOption: "A",
    options: [{ key: "A", requires: "item.door" }, { key: "B" }]
  });
  if (fallback !== "B") fail("C40", "默认项不可见时应回退到首个可见项，实际 " + fallback);

  var p024 = XB.core.locate("prologue", "p024").node;
  if (p024.min !== 0 || p024.max !== 5) fail("C40", "p024 应 0–5 件");
  if (XB.core.effectiveMultiMax(XB.core.defaults(), p024) !== 5) fail("C40", "无 maxWhen 时应回退 node.max=5");
  var optionById = {};
  p024.options.forEach(function (option) { optionById[option.id] = option; });
  var pack = XB.core.defaults();
  if (!XB.core.canAddMultiOption(pack, optionById.homepot, [])) fail("C40", "空行囊应能放铁锅");
  var four = [optionById.medicine, optionById.barley, optionById.shoes, optionById.homepot];
  if (XB.core.packUsage(pack) !== 0) fail("C40", "空行囊应为 0 半格");
  four.forEach(function (option) { if (!XB.core.canAddMultiOption(pack, option, four.filter(function (item) { return item !== option; }))) fail("C40", "四件仍应能放下：" + option.id); });
  if (XB.core.canAddMultiOption(pack, optionById.raincloth, four)) fail("C40", "四件后雨布应超 8 半格");
  pack.flags["item.door"] = true;
  if (!XB.core.canAddMultiOption(pack, optionById.shoes, [optionById.medicine, optionById.barley])) fail("C40", "带板 4+2+2=8 应还能放鞋");
  if (XB.core.canAddMultiOption(pack, optionById.homepot, [optionById.medicine, optionById.barley])) fail("C40", "带板加铁锅应超 8 半格");

  var use = XB.core.defaults();
  use.chapterId = "grass";
  use.inventory.items = ["roster", "pencil", "medicine", "barley"];
  use.flags["item.medicine"] = true;
  use.flags["item.barley"] = true;
  use.flags.load = XB.core.packUsage(use);
  var used = XB.core.usePackItems(use, ["medicine", "barley"]);
  if (!used.ok || use.flags.condition !== 4) fail("C40", "药+青稞应把良好升到优秀");
  if (use.inventory.items.indexOf("medicine") !== -1 || use.inventory.items.indexOf("barley") !== -1) fail("C40", "用过的物资没扣掉");
  if (XB.core.usePackItems(use, ["medicine", "barley"]).ok) fail("C40", "优秀后仍允许用物资");

  var settle = XB.core.defaults();
  settle.flags.condition = 2;
  settle.flags.rescues = 3;
  var settled = XB.core.settleGrass(settle);
  if (settled.condition !== 2 || settle.flags["help.used"] !== true || settle.flags["memory.help"] !== true) fail("C40", "救满三人应在差状态触发一次帮助");
  if (XB.core.settleGrass(settle).condition !== 2) fail("C40", "草地结算应幂等");

  // 有门板：救满第三人时若已跌到差，三人当场把人架起来（差→勉强），草地再 -1 才轮到警告。
  var doorAid = XB.core.defaults();
  doorAid.flags["had.door"] = true;
  doorAid.flags.condition = 2;
  doorAid.flags.rescues = 2;
  XB.core.setFlag(doorAid, "rescues", "+1");
  if (doorAid.flags.rescues !== 3 || doorAid.flags.condition !== 2) fail("C40", "有门板救第三人应扣到差再由三人帮助回到勉强，实际 " + doorAid.flags.condition);
  if (doorAid.flags["help.used"] !== true || doorAid.flags["memory.help_door"] !== true) fail("C40", "有门板救人帮助没写 help.used/memory.help_door");
  var doorSettled = XB.core.settleGrass(doorAid);
  if (doorSettled.condition !== 1 || doorSettled.needPack !== true) fail("C40", "有门板帮助后再结算应回到差并要补给");
  if (XB.core.settleGrass(doorAid).condition !== 1) fail("C40", "有门板草地结算应幂等");

  // 无门板：第三人不再扣状态，草地结算 -1 跌到差时补一次帮助，不写 help_door。
  var noDoorAid = XB.core.defaults();
  noDoorAid.flags.condition = 2;
  noDoorAid.flags.rescues = 2;
  XB.core.setFlag(noDoorAid, "rescues", "+1");
  if (noDoorAid.flags.condition !== 2 || noDoorAid.flags["help.used"] === true) fail("C40", "无门板第三人不应提前触发帮助");
  var noDoorSettled = XB.core.settleGrass(noDoorAid);
  if (noDoorSettled.condition !== 2 || noDoorAid.flags["memory.help"] !== true || noDoorAid.flags["memory.help_door"] === true) fail("C40", "无门板草地差状态应触发一次帮助");

  // 拒绝补给：状态停在差，由 settleDoor 收口到 7(5)（有门板救满）或坏结局。
  var refuse = XB.core.defaults();
  refuse.flags.condition = 1;
  refuse.flags.rescues = 1;
  XB.core.resolveGrassWarning(refuse);
  if (refuse.flags["fate.player.dead"] !== true) fail("C40", "拒绝补给应判死");
  var refuse7 = XB.core.defaults();
  refuse7.flags["had.door"] = true;
  refuse7.flags["item.door"] = true;
  refuse7.flags.condition = 1;
  refuse7.flags.rescues = 3;
  XB.core.resolveGrassWarning(refuse7);
  if (XB.core.settleDoor(refuse7) !== "others") fail("C40", "拒绝补给且救满三人应走空页");

  var door = XB.core.defaults();
  door.flags["had.door"] = true;
  door.flags["item.door"] = true;
  door.flags.condition = 4;
  if (XB.core.settleDoor(door) !== "carried") fail("C40", "优秀且活着应把门板带到吴起");
  var grassDoor = XB.core.defaults();
  grassDoor.flags["had.door"] = true;
  grassDoor.flags.rescues = 1;
  grassDoor.flags.condition = 2;
  if (XB.core.settleDoor(grassDoor) !== "grass") fail("C40", "救 1 人且状态不够应把门板留草地");

  function oldSave(chapterId, nodeId, flags) {
    var save = XB.core.serialize(XB.core.defaults());
    save.version = 1;
    save.scene = "vn";
    save.chapterId = chapterId;
    save.nodeId = nodeId;
    save.flags = flags || {};
    return XB.core.normalize(save);
  }
  var wuqi = oldSave("wuqi", "w022", { "choice.prologue.door": true, "item.door": true, strain: 1 });
  if (wuqi.issue) fail("C40", "吴起旧档被判坏档");
  else {
    if (wuqi.state.flags["fate.feimao.dead"] !== true || wuqi.state.flags["fate.zaowang.dead"] !== true) fail("C40", "吴起旧档没补飞毛腿/灶王");
    if (wuqi.state.flags["fate.dongsheng.dead"] !== false) fail("C40", "吴起旧档冬生应活");
    if (wuqi.state.flags.rescues !== 1 || wuqi.state.flags.condition !== 2) fail("C40", "吴起旧档 rescues/condition 迁移不对（过草地要 -1）");
    if (wuqi.state.flags["had.door"] !== true || wuqi.state.flags.doorOutcome !== "carried") fail("C40", "吴起旧档门板迁移不对");
    if (wuqi.migrated !== "fate") fail("C40", "吴起旧档迁移标记应为 fate");
  }
  var luding = oldSave("luding", "l022", { strain: 0, "choice.prologue.door": false });
  if (luding.issue) fail("C40", "泸定旧档被判坏档");
  else if (luding.state.flags["fate.feimao.dead"] !== true || luding.state.flags.rescues !== 0 || luding.state.flags.condition !== 3) fail("C40", "泸定 l022 旧档迁飞毛腿不对");
  var grass = oldSave("grass", "g028", { strain: 0, "choice.prologue.door": false });
  if (grass.issue) fail("C40", "草地旧档被判坏档");
  else if (grass.state.flags["fate.zaowang.dead"] !== true || grass.state.flags.condition !== 2) fail("C40", "草地 g028 旧档迁灶王/草地 -1 不对");
  var coda = oldSave("coda", "c011", { strain: 3, "had.door": true, "item.door": false });
  if (coda.issue) fail("C40", "空页旧档被判坏档");
  else {
    if (coda.state.flags["fate.player.dead"] !== true || coda.state.flags.condition !== 0) fail("C40", "空页旧档没判我死");
    if (coda.state.flags.doorOutcome !== "others") fail("C40", "空页旧档门板应由别人带出，实际 " + coda.state.flags.doorOutcome);
  }

  var engine = stripComments(readProject("engine.js"));
  ["xiangbei.roster.v1", "ROSTER_MAX_PAGES", "pages.slice(-ROSTER_MAX_PAGES)", "ending.recorded", "本机无法保存名册，本局仍可继续"].forEach(function (needle) {
    if (engine.indexOf(needle) === -1) fail("C40", "名册回廊缺 " + needle);
  });
  var html = readProject("index.html");
  ["roster-gallery", "roster-gallery-pages", "pack-panel", "vn-pack-button", "vn-condition"].forEach(function (id) {
    if (html.indexOf('id="' + id + '"') === -1) fail("C40", "index.html 缺 #" + id);
  });
  if (html.indexOf('data-action="roster-gallery"') === -1) fail("C40", "标题页缺名册入口");
  if (readProject("style.css").indexOf(".xb-roster-pages") === -1) fail("C40", "style.css 缺名册回廊样式");
  ["status-notice", "status-notice-list"].forEach(function (id) {
    if (html.indexOf('id="' + id + '"') === -1) fail("C40", "index.html 缺 #" + id);
  });
  if (html.indexOf("xb-status-notice") === -1) fail("C40", "index.html 缺状态弹窗样式类");
  if (readProject("style.css").indexOf(".xb-status-notice") === -1) fail("C40", "style.css 缺状态弹窗样式");
  if (engine.indexOf("takeStatusEvents") === -1 || engine.indexOf("recordStatusDiff") === -1) {
    fail("C40", "engine.js 缺状态事件记录/导出");
  }

  // 状态弹窗：只报真的变了；原因优先取 statusReason；读档/normalize 不报。
  // 草地分粮本身只扣粮，状态 +1 在 g008b 药膏回赠后发生，原因写“你与他人互相救助”。
  XB.core.takeStatusEvents();
  var statusShare = XB.core.defaults();
  statusShare.flags["item.barley"] = true;
  statusShare.inventory.items = ["roster", "pencil", "barley"];
  if (!XB.core.startChapter(statusShare, "grass", "g008")) {
    fail("C40", "定位不到 g008");
  } else {
    if (!XB.core.applyChoice(statusShare, XB.core.currentNode(statusShare), "A", false)) {
      fail("C40", "g008 A 分粮失败");
    }
    var shareEvents = XB.core.takeStatusEvents();
    if (shareEvents.length !== 0) {
      fail("C40", "分粮本身不应立即改状态，实际 " + JSON.stringify(shareEvents));
    } else if (statusShare.flags.condition !== 3) {
      fail("C40", "分粮本身不应加状态，实际 condition=" + statusShare.flags.condition);
    }
    var shareNode = XB.core.locate("grass", "g008b");
    if (!shareNode || !shareNode.node.status || shareNode.node.status.condition !== "+1") {
      fail("C40", "g008b 缺状态 +1 元数据");
    } else if (shareNode.node.statusOnce !== "memory.grass_mutual") {
      fail("C40", "g008b 缺 statusOnce 幂等标记");
    } else if (shareNode.node.statusReason !== "你与他人互相救助") {
      fail("C40", "g008b 状态原因不对：" + shareNode.node.statusReason);
    }
    if (engine.indexOf("function applyNodeStatus") === -1 || engine.indexOf("statusOnce") === -1) {
      fail("C40", "engine.js 缺节点级状态/幂等处理");
    }
    XB.core.applySet(statusShare, shareNode.node.status, "g008b:status", shareNode.node.statusReason);
    var shareAidEvents = XB.core.takeStatusEvents();
    if (shareAidEvents.length !== 1 || shareAidEvents[0].kind !== "player" || shareAidEvents[0].from !== 3 || shareAidEvents[0].to !== 4) {
      fail("C40", "互助回赠应只报一条我的状态 3→4，实际 " + JSON.stringify(shareAidEvents));
    } else if (shareAidEvents[0].reason !== "你与他人互相救助") {
      fail("C40", "互助回赠状态原因不对：" + shareAidEvents[0].reason);
    }
  }

  var statusUse = XB.core.defaults();
  statusUse.chapterId = "grass";
  statusUse.flags["item.shoes"] = true;
  statusUse.inventory.items = ["roster", "pencil", "shoes"];
  XB.core.usePackItems(statusUse, ["shoes"]);
  var useEvents = XB.core.takeStatusEvents();
  if (useEvents.length !== 1 || useEvents[0].kind !== "player" || useEvents[0].to !== 4) {
    fail("C40", "用布鞋回状态应报一条我的状态变化，实际 " + JSON.stringify(useEvents));
  } else if (useEvents[0].reason !== "你用了布鞋") {
    fail("C40", "用布鞋状态原因不对：" + useEvents[0].reason);
  }

  var statusSettle = XB.core.defaults();
  statusSettle.flags.condition = 2;
  XB.core.settleGrass(statusSettle);
  var settleEvents = XB.core.takeStatusEvents();
  if (settleEvents.length !== 1 || settleEvents[0].kind !== "player" || settleEvents[0].from !== 2 || settleEvents[0].to !== 1) {
    fail("C40", "草地结算应报一条我的状态 2→1，实际 " + JSON.stringify(settleEvents));
  } else if (settleEvents[0].reason.indexOf("草地走到第七天") === -1) {
    fail("C40", "草地结算状态原因不对：" + settleEvents[0].reason);
  }

  var statusPerson = XB.core.defaults();
  statusPerson.flags["quality.feimao"] = 3;
  XB.core.setFlag(statusPerson, "quality.feimao", 1, "飞毛腿倒在桥头");
  var hurtEvents = XB.core.takeStatusEvents();
  if (hurtEvents.length !== 1 || hurtEvents[0].kind !== "feimao" || hurtEvents[0].to !== 1) {
    fail("C40", "飞毛腿掉到差应报一条人物状态变化，实际 " + JSON.stringify(hurtEvents));
  }
  XB.core.setFlag(statusPerson, "fate.feimao.dead", true, "你没有停");
  var deathEvents = XB.core.takeStatusEvents();
  if (deathEvents.length !== 1 || deathEvents[0].kind !== "feimao" || deathEvents[0].to !== 0) {
    fail("C40", "飞毛腿牺牲应报一条人物状态变化，实际 " + JSON.stringify(deathEvents));
  }
  XB.core.setFlag(statusPerson, "quality.feimao", 0, "重复写入");
  if (XB.core.takeStatusEvents().length !== 0) fail("C40", "状态没变时不应报状态弹窗");

  notes.push("C40 OK requires 可见性/默认回退/8 半格容量/物资组合/草地结算/四类旧档迁移；名册与物资面板入口就位；状态事件只报真实变化");
}

// C41：剧情分支回看（v1.5）：19 个决策组覆盖 20 个结构节点，11 结局同一账本，结算先记录再清日志
function checkBranchMap() {
  var XB;
  try {
    XB = loadGame(["story.js", "engine.js"]);
  } catch (err) {
    fail("C41", "story/engine 无法在同一上下文加载：" + err.message);
    return;
  }
  var story = XB.story;
  var map = story && story.branchMap;
  if (!map || !map.chapters || !map.decisions || !map.endings) {
    fail("C41", "story.branchMap 缺 chapters/decisions/endings");
    return;
  }
  var chapterIds = Object.keys(map.chapters);
  if (chapterIds.length !== 7) fail("C41", "分支图应 7 章，实际 " + chapterIds.length);
  var decisionIds = Object.keys(map.decisions);
  if (decisionIds.length !== 19) fail("C41", "决策组应 19 个，实际 " + decisionIds.length);

  var byId = {};
  (story.chapters || []).forEach(function (chapter) {
    (chapter.nodes || []).forEach(function (node) {
      if (node.id) byId[node.id] = { chapter: chapter.id, node: node };
    });
  });

  var covered = {};
  var structured = [];
  Object.keys(byId).forEach(function (id) {
    var entry = byId[id];
    if (["choice", "multichoice", "interact"].indexOf(entry.node.type) !== -1) structured.push(entry);
  });

  decisionIds.forEach(function (id) {
    var decision = map.decisions[id];
    if (!decision || !Array.isArray(decision.nodes) || !decision.nodes.length) {
      fail("C41", "决策 " + id + " 缺 nodes");
      return;
    }
    if (!decision.title || !decision.context) fail("C41", "决策 " + id + " 缺 title/context");
    decision.nodes.forEach(function (nodeId) {
      var entry = byId[nodeId];
      if (!entry) {
        fail("C41", "决策 " + id + " 指向不存在的节点 " + nodeId);
        return;
      }
      if (covered[nodeId]) fail("C41", "节点 " + nodeId + " 被多个决策组覆盖");
      covered[nodeId] = id;
    });
    if (decision.kind === "event") {
      if (!decision.doneText || !decision.skipText) fail("C41", "事件决策 " + id + " 缺 doneText/skipText");
    } else if (!decision.options || !Object.keys(decision.options).length) {
      fail("C41", "选择决策 " + id + " 缺选项后果");
    }
    if (id === "p024" || id === "x015") {
      if (decision.multi !== true) fail("C41", id + " 应标记 multi");
    }
  });

  structured.forEach(function (entry) {
    if (!covered[entry.node.id]) fail("C41", "剧情节点 " + entry.node.id + " 没有收进分支图");
  });
  if (structured.length !== 22) fail("C41", "choice/multichoice/interact 应 22 个，实际 " + structured.length);

  chapterIds.forEach(function (chapterId) {
    var meta = map.chapters[chapterId];
    if (!meta.intro) fail("C41", "章节 " + chapterId + " 缺 intro");
    if (!meta.image || !fs.existsSync(path.join(PROJECT_DIR, meta.image.replace(/^\.\//, "")))) {
      fail("C41", "章节 " + chapterId + " 的缩略图不存在：" + meta.image);
    }
    (meta.decisions || []).forEach(function (decisionId) {
      if (!map.decisions[decisionId]) fail("C41", "章节 " + chapterId + " 指向未知决策 " + decisionId);
      else if (map.decisions[decisionId].nodes.some(function (nodeId) {
        return byId[nodeId] && byId[nodeId].chapter !== chapterId && chapterId !== "wuqi";
      })) {
        fail("C41", "章节 " + chapterId + " 的决策 " + decisionId + " 跨章");
      }
    });
  });

  var routeIds = Object.keys(story.ending.routes || {});
  if (routeIds.length !== 11) fail("C41", "ending.routes 应 11 条，实际 " + routeIds.length);
  routeIds.forEach(function (route) {
    if (!map.endings[route] || !map.endings[route].hint) fail("C41", "结局 " + route + " 缺回看提示");
  });
  Object.keys(map.endings).forEach(function (route) {
    if (routeIds.indexOf(route) === -1) fail("C41", "回看多出未知结局 " + route);
  });

  var engine = readProject("engine.js");
  if (engine.indexOf('BRANCH_KEY = "xiangbei.branches.v1"') === -1) fail("C41", "缺独立分支键 xiangbei.branches.v1");
  var recordAt = engine.indexOf("recordBranchRun(state.ending);");
  var clearAt = engine.indexOf("state.choices = [];", recordAt);
  if (recordAt === -1 || clearAt === -1 || clearAt < recordAt) fail("C41", "结算必须先 recordBranchRun 再清 choices");
  if (engine.indexOf("branchStorageOk") === -1 || engine.indexOf("openBranchDetail") === -1) fail("C41", "缺分支存储降级/详情逻辑");

  var html = readProject("index.html");
  if (html.indexOf('id="branch-map"') === -1) fail("C41", "index.html 缺 #branch-map");
  if ((html.match(/data-action="branch"/g) || []).length < 2) fail("C41", "标题/暂停应各有剧情分支入口");
  if (html.indexOf('data-action="ending-branch"') === -1) fail("C41", "结局页缺剧情分支入口");
  var css = readProject("style.css");
  [".xb-branch {", ".xb-branch__chapters", ".xb-branch__endings", ".xb-branch-detail", ".xb-branch-ending.is-locked"].forEach(function (needle) {
    if (css.indexOf(needle) === -1) fail("C41", "style.css 缺 " + needle);
  });
  notes.push("C41 OK 分支图 7 章 / 19 决策组覆盖 22 个结构节点 / 11 结局提示；独立键与三入口；结算先记录后清日志");
}

// C42：成就 48 条（17 个选择组 46 + 记名 2），词条/章节/入口/结算快照
function checkAchievements() {
  var XB;
  try {
    XB = loadGame(["story.js", "engine.js"]);
  } catch (err) {
    fail("C42", "story/engine 无法在同一上下文加载：" + err.message);
    return;
  }
  var story = XB.story;
  var list = story && story.achievements;
  if (!Array.isArray(list)) {
    fail("C42", "story.achievements 不是数组");
    return;
  }
  if (list.length !== 48) fail("C42", "成就应 48 条，实际 " + list.length);

  var ids = {};
  var titles = {};
  var chapters = { prologue: 0, xiangjiang: 0, zunyi: 0, jinsha: 0, luding: 0, grass: 0, wuqi: 0 };
  list.forEach(function (item) {
    if (!item || typeof item.id !== "string" || !item.id) fail("C42", "成就缺 id");
    else if (ids[item.id]) fail("C42", "成就 id 重复：" + item.id);
    else ids[item.id] = true;
    if (!item || typeof item.title !== "string" || !item.title) fail("C42", "成就缺词条：" + (item && item.id));
    else {
      var length = Array.from(item.title).length;
      if (length < 1 || length > 8) fail("C42", "词条应 1–8 字：" + item.id + " " + item.title);
      if (titles[item.title]) fail("C42", "词条重复：" + item.title);
      titles[item.title] = true;
    }
    if (!chapters.hasOwnProperty(item.chapter)) fail("C42", "成就章不认识：" + item.chapter);
    else chapters[item.chapter] += 1;
    if (!story.branchMap.decisions[item.decision]) fail("C42", "成就指向未知决策：" + item.id);
  });

  var expectedChapters = { prologue: 9, xiangjiang: 9, zunyi: 8, jinsha: 5, luding: 5, grass: 10, wuqi: 2 };
  Object.keys(expectedChapters).forEach(function (id) {
    if (chapters[id] !== expectedChapters[id]) {
      fail("C42", "章 " + id + " 成就数应为 " + expectedChapters[id] + "，实际 " + chapters[id]);
    }
  });

  var map = story.branchMap;
  var decisions = Object.keys(map.decisions).filter(function (id) {
    var decision = map.decisions[id];
    return decision.options && Object.keys(decision.options).length;
  });
  if (decisions.length !== 17) fail("C42", "有选项的决策组应 17 个，实际 " + decisions.length);
  var choiceCount = 0;
  decisions.forEach(function (decisionId) {
    var decision = map.decisions[decisionId];
    Object.keys(decision.options).forEach(function (key) {
      choiceCount += 1;
      var found = list.filter(function (item) {
        return item.kind !== "interact" && item.decision === decisionId && item.key === key;
      });
      if (found.length !== 1) fail("C42", decisionId + " 的选项 " + key + " 应恰好 1 条成就，实际 " + found.length);
    });
  });
  if (choiceCount !== 46) fail("C42", "选择成就应 46 条，实际 " + choiceCount);
  var choiceAchievements = list.filter(function (item) { return item.kind !== "interact"; });
  if (choiceAchievements.length !== 46) fail("C42", "kind=choice 的成就应 46 条");
  if (list.some(function (item) { return item.decision === "w026"; })) fail("C42", "点名不应有成就");

  var j018 = list.filter(function (item) { return item.kind === "interact"; });
  if (j018.length !== 2) fail("C42", "记名应 2 条成就，实际 " + j018.length);
  ["done", "skip"].forEach(function (outcome) {
    var found = j018.filter(function (item) { return item.decision === "j018" && item.outcome === outcome; });
    if (found.length !== 1) fail("C42", "记名 " + outcome + " 应 1 条成就");
  });

  var sample = XB.core.collectRunAchievements({
    chapterId: "prologue",
    choices: [
      { chapter: "prologue", nodeId: "p021", option: "A", text: "带上这块门板", timedOut: false },
      { chapter: "prologue", nodeId: "p024", option: "MULTI", text: "药、青稞", timedOut: false }
    ],
    flags: { "memory.namepick_done": true, "memory.zhang": true }
  });
  ["p021-A", "p024-medicine", "p024-barley", "j018-done"].forEach(function (id) {
    if (sample.indexOf(id) === -1) fail("C42", "collectRunAchievements 漏了 " + id + "：" + sample.join(","));
  });
  var skip = XB.core.collectRunAchievements({ choices: [], flags: { "memory.namepick_done": true, "memory.zhang": false } });
  if (skip.indexOf("j018-skip") === -1) fail("C42", "记名未动笔应收集 j018-skip");
  var oldDone = XB.core.collectRunAchievements({ choices: [], flags: { "memory.zhang": true } });
  if (oldDone.indexOf("j018-done") === -1) fail("C42", "旧档 memory.zhang 应收集 j018-done");

  var ending = XB.core.buildEnding(XB.core.defaults());
  if (!Array.isArray(ending.achievements)) fail("C42", "ending 快照缺 achievements 数组");

  var engine = readProject("engine.js");
  if (engine.indexOf('ACHIEVEMENT_KEY = "xiangbei.achievements.v1"') === -1) {
    fail("C42", "缺独立成就键 xiangbei.achievements.v1");
  }
  var recordAt = engine.indexOf("recordRunAchievements(state.ending);");
  var clearAt = engine.indexOf("state.choices = [];", recordAt);
  if (recordAt === -1 || clearAt === -1 || clearAt < recordAt) {
    fail("C42", "结算必须先记录成就再清 choices");
  }
  if (engine.indexOf("recordChoiceAchievement(") === -1 || engine.indexOf("recordMultiAchievements(") === -1) {
    fail("C42", "缺单选/多选即时解锁");
  }

  var html = readProject("index.html");
  if (html.indexOf('id="achievement-panel"') === -1) fail("C42", "index.html 缺 #achievement-panel");
  if ((html.match(/data-action="achievements"/g) || []).length < 2) {
    fail("C42", "标题/暂停应各有解锁成就入口");
  }
  if (html.indexOf('id="ending-achievements"') === -1) fail("C42", "结局缺本局成就区");
  if (html.indexOf("此周目解锁的成就有：") === -1) fail("C42", "结局成就标题不对");
  var css = readProject("style.css");
  [".xb-achievements", ".xb-achievement-card.is-locked", ".xb-achievement-detail", ".xb-ending__achievement"].forEach(function (needle) {
    if (css.indexOf(needle) === -1) fail("C42", "style.css 缺 " + needle);
  });
  notes.push("C42 OK 48 条（46 选择 + 记名 2）/ 词条唯一 / 17 组 1:1 / 章分布 9-9-8-5-5-10-2 / 三入口与结算快照");
}

// C38：发布运行时无外部请求/模块（步骤八冻结）
function checkReleaseRuntime() {
  var files = ["index.html", "style.css"].concat(JS_FILES);
  files.forEach(function (file) {
    var text = readProject(file);
    if (/https?:\/\//.test(text)) fail("C38", file + " 含 http(s) 外部地址");
    if (/\bfetch\s*\(|XMLHttpRequest|type\s*=\s*["']module/.test(text)) fail("C38", file + " 含外部加载/ES module");
  });
  // CREDITS 是纯文本署名，允许出现来源 URL；它不参与运行时加载。
  notes.push("C38 OK 六个运行时无 http(s)、无 fetch/XHR、无 type=module；CREDITS 仅文本署名");
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
checkPrologueGraph();
checkChoiceRules();
checkReadingDom();
checkConditionWhitelist();
checkSaveAndCodex();
checkMultichoiceApi();
checkChoiceSegments();
checkResultRebuild();
checkMinigameRemoved();
checkLegacySaveMigration();
checkChapterTable();
checkCodexNodes();
checkEndingData();
checkRollcallData();
checkGalleryDom();
checkChapterMemory();
checkEndingSnapshot();
checkEndingRoutes();
checkFateMechanics();
checkAudioAssets();
checkAudioLifecycle();
checkAudioBeds();
checkAudioSettings();
checkFxLayer();
checkFxLimits();
checkCredits();
checkBranchMap();
checkAchievements();
checkReleaseRuntime();

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
  console.log("OK：构建自检 " + notes.length + " 项全绿");
}
