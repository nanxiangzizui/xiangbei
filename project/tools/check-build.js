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
// 与 engine.js 的 REQUIRED_IDS 对齐：缺一个引擎就抛错，所以列表必须逐字一致
const REQUIRED_IDS = [
  "stage", "stage-art", "scene-title", "scene-map", "scene-vn",
  "pause", "pause-menu", "toast", "debug", "orientation",
  "title-menu", "map-stations", "map-route",
  "vn-chapter", "vn-toolbar", "vn-auto", "vn-skip", "vn-dialogue", "vn-name", "vn-text", "vn-next",
  "vn-choice-prompt", "vn-choices", "vn-minigame", "vn-result",
  "vn-title-card", "vn-title-chapter", "vn-title-sub", "vn-measure",
  "vn-settings", "set-speed", "set-speed-value", "set-scale", "set-volume", "set-volume-value",
  "set-muted", "set-motion", "set-skip",
  "codex", "codex-title", "codex-badges", "codex-body", "codex-note", "codex-source", "codex-close"
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
  var expected = { line: 41, choice: 2, minigame: 1, result: 1, title: 1, codex: 1, end: 1 };
  if (nodes.length !== 48) fail("C13", "序章节点应为 48，实际 " + nodes.length);
  Object.keys(expected).forEach(function (type) {
    if ((counts[type] || 0) !== expected[type]) {
      fail("C13", type + " 节点应为 " + expected[type] + "，实际 " + (counts[type] || 0));
    }
  });
  var ids = nodes.map(function (node) {
    return node.id;
  });
  for (var i = 0; i < 20; i += 1) {
    var expectedId = "p" + String(i + 1).padStart(3, "0");
    if (ids[i] !== expectedId) fail("C13", "第 " + (i + 1) + " 个节点应为 " + expectedId + "，实际 " + ids[i]);
  }
  if (new Set(ids).size !== ids.length) fail("C13", "节点 id 有重复");
  var last = nodes[nodes.length - 1];
  if (last.id !== "p900") fail("C13", "末节点应为 p900，实际 " + last.id);
  if (last.next !== "xiangjiang") fail("C13", "p900.next 应为 xiangjiang，实际 " + last.next);
  notes.push("C13 OK 序章 " + nodes.length + " 节点（line 41 / choice 2 / minigame 1 / result 1 / title 1 / codex 1 / end 1）");
}

var SET_KEY_EXACT = ["item.door", "item.pot", "load", "trust", "fire", "lights_lost"];

function isAllowedSetKey(key) {
  return (
    SET_KEY_EXACT.indexOf(key) !== -1 || key.indexOf("memory.") === 0 || key.indexOf("choice.") === 0
  );
}

// C14：选项契约——两个限时选项、字段齐全、文本与代价长度受控、set 只写白名单
function checkChoiceRules() {
  var XB = loadGame();
  var nodes = XB.core.chapterById("prologue").nodes;
  var choices = nodes.filter(function (node) {
    return node.type === "choice";
  });
  if (choices.length !== 2) fail("C14", "序章应有 2 个选择节点，实际 " + choices.length);
  var records = [];
  choices.forEach(function (node) {
    if (typeof node.record !== "string" || node.record.indexOf("choice.") !== 0) {
      fail("C14", node.id + " record 应是 choice.* 旗标名");
    }
    if (!(node.timeout >= 1 && node.timeout <= 30)) fail("C14", node.id + " timeout 应在 1–30 秒");
    if (!node.prompt) fail("C14", node.id + " 缺 prompt");
    if (!Array.isArray(node.options) || node.options.length !== 2) fail("C14", node.id + " 应有 2 个选项");
    var keys = (node.options || []).map(function (option) {
      return option.key;
    });
    if (keys.join(",") !== "A,B") fail("C14", node.id + " 选项 key 应为 A,B，实际 " + keys.join(","));
    if (keys.indexOf(node.defaultOption) === -1) fail("C14", node.id + " defaultOption 不在选项里");
    (node.options || []).forEach(function (option) {
      if (!option.text) fail("C14", node.id + option.key + " 缺 text");
      else if (Array.from(option.text).length > 14) fail("C14", node.id + option.key + " 文案超过 14 字");
      if (!option.cost) fail("C14", node.id + option.key + " 缺 cost（超时要有代价可说）");
      else if (Array.from(option.cost).length > 22) fail("C14", node.id + option.key + " 代价超过 22 字");
      if (option.value === undefined) fail("C14", node.id + option.key + " 缺 value");
      Object.keys(option.set || {}).forEach(function (key) {
        if (!isAllowedSetKey(key)) fail("C14", node.id + option.key + " 写了未登记旗标 " + key);
      });
    });
    records.push(node.record);
  });
  if (records.join("|") !== "choice.prologue.door|choice.prologue.lookback") {
    fail("C14", "两个选择的 record 应是 door / lookback，实际 " + records.join("|"));
  }
  notes.push("C14 OK 2 个限时选择：字段齐全、A/B 默认项合法、set 只在白名单内");
}

// C15：阅读层容器、标题版本行、量具不能 display:none
function checkReadingDom() {
  var html = readProject("index.html");
  ["vn-toolbar", "vn-choices", "vn-choice-prompt", "vn-title-card", "vn-minigame", "vn-result", "vn-measure", "vn-settings", "codex"].forEach(function (id) {
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
  var allowedWhen = ["item.door", "item.pot", "choice.prologue.door", "choice.prologue.lookback"];
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
      if (node.type === "end" && node.next && !XB.core.chapterById(node.next)) {
        fail("C17", node.id + " 的 next 指向不存在的章节 " + node.next);
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
  notes.push("C17 OK 7 张图鉴齐全、存档 11 键冻结、p001→p900 可走通、剧情内联");
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
  console.log("OK：构建自检 17 项全绿");
}
