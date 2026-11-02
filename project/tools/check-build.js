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
  "stage", "stage-art", "scene-title", "scene-map", "scene-vn", "scene-ending",
  "ending-title", "ending-date", "ending-lede", "ending-names", "ending-stats", "ending-cards",
  "ending-disclaimer", "ending-home", "ending-codex",
  "pause", "pause-menu", "toast", "debug", "orientation",
  "title-menu", "map-stations", "map-route",
  "vn-chapter", "vn-toolbar", "vn-auto", "vn-skip", "vn-dialogue", "vn-name", "vn-text", "vn-next",
  "vn-choice-prompt", "vn-choices", "vn-minigame", "vn-result",
  "minigame-canvas", "minigame-hud", "minigame-help", "minigame-live", "minigame-pause", "minigame-fallback",
  "vn-interact", "interact-kicker", "interact-name", "interact-status", "interact-progress",
  "interact-names", "interact-answer", "interact-live",
  "vn-title-card", "vn-title-chapter", "vn-title-sub", "vn-measure",
  "vn-settings", "set-speed", "set-speed-value", "set-scale", "set-volume", "set-volume-value",
  "set-muted", "set-motion", "set-skip",
  "codex", "codex-title", "codex-badges", "codex-body", "codex-note", "codex-source", "codex-close",
  "codex-gallery", "gallery-close", "gallery-title", "gallery-count", "gallery-grid"
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
  var minigames = loadGame().minigames;
  if (!minigames || typeof minigames.start !== "function") fail("C07", "minigames.js 没有 XB.minigames.start");
  var engine = stripComments(readProject("engine.js"));
  if (!/XB\.art\b/.test(engine)) fail("C07", "engine.js 未接入 XB.art");
  if (!/XB\.minigames\b/.test(engine)) fail("C07", "engine.js 未接入 XB.minigames");
  notes.push("C07 OK art.js 五项契约就位、minigames API 可加载、engine 已接入两者");
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
  var expectedScenes = ["title", "map", "yudu_river", "yudu_night",
    "xiangjiang_ford", "xiangjiang_dawn", "zunyi_hall", "zunyi_street",
    "jinsha_river", "jinsha_night", "luding_bridge", "luding_after",
    "grass_marsh", "grass_dawn", "wuqi_dawn", "wuqi_wall"];
  if (art.SCENES.length !== expectedScenes.length) fail("C11", "SCENES 应为 16 个，实际 " + art.SCENES.length);
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
  var expected = { line: 42, choice: 2, minigame: 1, result: 1, title: 1, codex: 1, end: 1 };
  if (nodes.length !== 49) fail("C13", "序章节点应为 49，实际 " + nodes.length);
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
  if (!ids.includes("p039a") || !ids.includes("p039b")) fail("C13", "缺 p039a/p039b 门板分支");
  var last = nodes[nodes.length - 1];
  if (last.id !== "p900") fail("C13", "末节点应为 p900，实际 " + last.id);
  if (last.next !== "xiangjiang") fail("C13", "p900.next 应为 xiangjiang，实际 " + last.next);
  notes.push("C13 OK 序章 " + nodes.length + " 节点（line 42 / choice 2 / minigame 1 / result 1 / title 1 / codex 1 / end 1；p039a/b）");
}

var SET_KEY_EXACT = ["item.door", "item.pot", "load", "trust", "fire", "lights_lost"];

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
      if (!Array.isArray(node.options) || node.options.length < 2 || node.options.length > 3) {
        fail("C14", node.id + " 应有 2–3 个选项");
        return;
      }
      var keys = node.options.map(function (option) { return option.key; });
      var expectedKeys = node.options.length === 2 ? ["A", "B"] : ["A", "B", "C"];
      if (keys.join(",") !== expectedKeys.join(",")) fail("C14", node.id + " 选项 key 应为 " + expectedKeys.join(",") + "，实际 " + keys.join(","));
      if (node.defaultOption && keys.indexOf(node.defaultOption) === -1) fail("C14", node.id + " defaultOption 不在选项里");
      node.options.forEach(function (option) {
        if (!option.text) fail("C14", node.id + option.key + " 缺 text");
        else if (Array.from(option.text).length > 14) fail("C14", node.id + option.key + " 文案超过 14 字");
        if (!option.cost) fail("C14", node.id + option.key + " 缺 cost（超时要有代价可说）");
        else if (Array.from(option.cost).length > 22) fail("C14", node.id + option.key + " 代价超过 22 字");
        if (option.value === undefined) fail("C14", node.id + option.key + " 缺 value");
        if (option.when !== undefined) fail("C14", node.id + option.key + " 不允许 option.when（只用节点级 when）");
        Object.keys(option.set || {}).forEach(function (key) {
          if (!isAllowedSetKey(key)) fail("C14", node.id + option.key + " 写了未登记旗标 " + key);
        });
      });
    });
  });
  if (total !== 13) fail("C14", "全章 choice 应为 13 个，实际 " + total);
  notes.push("C14 OK 全章 " + total + " 个选择：2–3 项、key 连续、文案/代价受控、timeout 与 defaultOption 配对、set 白名单");
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
  var allowedWhen = Object.keys(XB.core.FLAG_DEFAULTS)
    .concat(XB.core.WUQI_MEMORY)
    .concat(Object.keys(XB.core.CHAPTER_MEMORY).map(function (chapterId) { return XB.core.CHAPTER_MEMORY[chapterId]; }))
    .concat(["memory.zhang", "memory.door", "memory.luding_unknown", "memory.rollcall_missed_any"]);
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

// C18：四关 API、冻结的数值/物品表、纯函数契约
function checkMinigameApi() {
  var XB = loadGame();
  var mg = XB.minigames;
  if (!mg || typeof mg !== "object") {
    fail("C18", "找不到 XB.minigames");
    return;
  }
  if (mg.SCENES.join(",") !== "door,abandon,boat,climb") fail("C18", "SCENES 应为 door/abandon/boat/climb，实际 " + mg.SCENES.join(","));
  if (!Object.isFrozen(mg.SCENES)) fail("C18", "SCENES 未冻结");
  if (!Object.isFrozen(mg.RULES) || !Object.isFrozen(mg.RULES.door)) fail("C18", "RULES 未深冻结");
  if (!Object.isFrozen(mg.ITEMS) || !Object.isFrozen(mg.ITEMS.door)) fail("C18", "ITEMS 未深冻结");
  ["start", "stop", "isActive", "resize", "labelFor", "itemIds", "crewForTrust", "usedSlots", "canPack"].forEach(function (name) {
    if (typeof mg[name] !== "function") fail("C18", "XB.minigames." + name + " 不是函数");
  });
  if (mg.itemIds("door").length !== 8) fail("C18", "门板物品应为 8 件，实际 " + mg.itemIds("door").length);
  if (mg.itemIds("abandon").length !== 7) fail("C18", "弃物物品应为 7 件，实际 " + mg.itemIds("abandon").length);
  if (mg.usedSlots(["pot"], true) !== 4) fail("C18", "门板+铁锅应占 4 格");
  if (mg.canPack(["pot", "medicine", "barley"], "raincloth", true) !== false) fail("C18", "门板+锅+药+青稞+雨布应放不下");
  if (mg.crewForTrust(0) !== 12 || mg.crewForTrust(6) !== 37) fail("C18", "船工表端点应为 12/37");
  notes.push("C18 OK 四关 API、深冻结、8+7 物品、容量/船工纯函数");
}

// C19：结果对象没有 success/score/Game Over，只允许 reason/carried/left/stats
function checkMinigameResultContract() {
  var code = stripComments(readProject("minigames.js"));
  ["success", "score", "gameOver", "game_over"].forEach(function (word) {
    if (new RegExp("\\b" + word + "\\b", "i").test(code)) fail("C19", "minigames.js 出现结果字段 " + word);
  });
  ["reason", "elapsed", "carried", "left", "stats"].forEach(function (field) {
    if (code.indexOf(field + ":") === -1) fail("C19", "结果对象缺字段 " + field);
  });
  notes.push("C19 OK 结果只有 reason/elapsed/carried/left/stats，无成功失败分");
}

// C20：p024 的 config 只是作者元数据，必须与 RULES 起点一致；p025 标明结果来源
function checkMinigameStoryContract() {
  var XB = loadGame();
  var p024 = XB.core.locate("prologue", "p024").node;
  if (!p024 || p024.type !== "minigame" || p024.game !== "door") {
    fail("C20", "p024 不是 door 小游戏节点");
    return;
  }
  var config = p024.config || {};
  var expected = { duration: 75, capacity: 6, doorCost: 2, items: 8 };
  Object.keys(expected).forEach(function (key) {
    if (config[key] !== expected[key]) fail("C20", "p024.config." + key + " 应为 " + expected[key] + "，实际 " + config[key]);
  });
  var p025 = XB.core.locate("prologue", "p025").node;
  if (!p025 || p025.type !== "result") fail("C20", "p025 不是 result 节点");
  else {
    if (p025.source !== "minigame") fail("C20", "p025 缺 source=minigame");
    if (p025.game !== "door") fail("C20", "p025 缺 game=door");
  }
  notes.push("C20 OK p024 config 75/6/2/8 与 RULES 一致，p025 标明 minigame/door");
}

// C21：结算重建必须从旗标/背包出发，刷新后仍能说出同一组代价
function checkMinigameRebuild() {
  var engine = stripComments(readProject("engine.js"));
  ["applyMinigameResult", "buildResultView", "node.source !== \"minigame\"", "choice.xiangjiang.abandoned", "choice.jinsha.trips", "lights_lost", "inventory.items"].forEach(function (needle) {
    if (engine.indexOf(needle) === -1) fail("C21", "engine.js 缺重建标记 " + needle);
  });
  if (engine.indexOf("vn-result__stats") === -1) fail("C21", "结果页缺 stats DOM");
  // 旗标必须是数值区间；字符串边界会让夹取悄悄失效（负例 N4）。
  if (engine.indexOf("lights_lost: [0, 22]") === -1) fail("C21", "lights_lost 必须是数值区间 [0, 22]");
  if (engine.indexOf('"choice.jinsha.trips": [0, 18]') === -1) fail("C21", "choice.jinsha.trips 必须是数值区间 [0, 18]");
  notes.push("C21 OK 门板/弃物/渡船/攀索结果均按持久旗标重建");
}

// C22：RULES 是唯一数值源，tuning 的 §4 表必须逐行同值
function checkMinigameTuning() {
  var XB = loadGame();
  var tuning = readRoot("docs/minigame-tuning.md");
  var values = {};
  tuning.split(/\r?\n/).forEach(function (line) {
    var match = /^\|\s*((?:door|abandon|boat|climb)\.[a-zA-Z]+)\s*\|\s*([^|]+?)\s*\|/.exec(line);
    if (match) values[match[1]] = match[2].trim();
  });
  Object.keys(XB.minigames.RULES).forEach(function (gameId) {
    var group = XB.minigames.RULES[gameId];
    Object.keys(group).forEach(function (key) {
      var path = gameId + "." + key;
      if (!(path in values)) {
        fail("C22", "tuning 表缺 " + path);
        return;
      }
      var actual = group[key];
      var documented = values[path];
      if (Array.isArray(actual)) {
        var numbers = documented.replace(/[^0-9,]/g, "").split(",").filter(Boolean).map(Number);
        if (numbers.join(",") !== actual.join(",")) fail("C22", path + " 文档 " + documented + " 与 RULES " + actual.join(",") + " 不一致");
      } else if (Number(documented) !== actual) {
        fail("C22", path + " 文档 " + documented + " 与 RULES " + actual + " 不一致");
      }
    });
  });
  notes.push("C22 OK tuning §4 与 RULES 同名同值（" + Object.keys(values).length + " 行）");
}

// C23：小游戏画面不出现 X 光机、牺牲人数、Game Over、成功/失败大字
function checkMinigameWords() {
  var code = stripComments(readProject("minigames.js"));
  ["X 光机", "X光机", "Game Over", "gameOver", "牺牲"].forEach(function (word) {
    if (code.indexOf(word) !== -1) fail("C23", "minigames.js 出现禁用词「" + word + "」");
  });
  var parts = code.split("drawText(");
  parts.slice(1).forEach(function (part) {
    var call = part.slice(0, part.indexOf(");"));
    if (/成功|失败/.test(call)) fail("C23", "小游戏画面出现成功/失败大字");
  });
  notes.push("C23 OK 无 X 光机/牺牲/Game Over/成功失败大字");
}


// C24：七章表、节点数、id 前缀/唯一、end、title/codex 位置与文档表一致
function checkChapterTable() {
  var XB = loadGame();
  var expected = [
    { id: "prologue", prefix: "p", count: 49, next: "xiangjiang" },
    { id: "xiangjiang", prefix: "x", count: 43, next: "zunyi" },
    { id: "zunyi", prefix: "z", count: 33, next: "jinsha" },
    { id: "jinsha", prefix: "j", count: 35, next: "luding" },
    { id: "luding", prefix: "l", count: 36, next: "grass" },
    { id: "grass", prefix: "g", count: 32, next: "wuqi" },
    { id: "wuqi", prefix: "w", count: 49, next: "ending" }
  ];
  var doc = readRoot("docs/chapter-integration.md");
  var docCounts = {};
  (doc.split(/\r?\n/)).forEach(function (line) {
    var row = /^\|\s*(\d+)\s*\|\s*`?([a-z]+)`?\s*\|\s*([a-z])\s*\|\s*(\d+)\s*\|/.exec(line);
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
    if (chapter.nodes.length !== item.count) fail("C24", item.id + " 节点应为 " + item.count + "，实际 " + chapter.nodes.length);
    if (docCounts[item.id] !== item.count) fail("C24", "chapter-integration 表 " + item.id + " 应为 " + item.count + "，实际 " + docCounts[item.id]);
    var nodes = chapter.nodes;
    if (nodes[0].id !== item.prefix + "001") fail("C24", item.id + " 首节点应为 " + item.prefix + "001");
    if (nodes[nodes.length - 1].id !== item.prefix + "900") fail("C24", item.id + " 末节点应为 " + item.prefix + "900");
    if (nodes[nodes.length - 2].type !== "codex") fail("C24", item.id + " 倒数第二节点应为 codex");
    if (item.id === "wuqi") {
      if (nodes[nodes.length - 3].type === "title") fail("C24", "吴起不应有标题卡");
    } else if (nodes[nodes.length - 3].type !== "title") {
      fail("C24", item.id + " 倒数第三节点应为 title");
    }
    var end = nodes[nodes.length - 1];
    if (end.type !== "end" || end.next !== item.next) fail("C24", item.id + " end.next 应为 " + item.next);
    nodes.forEach(function (node) {
      if (!(new RegExp("^" + item.prefix + "\\d{3}[abc]?$")).test(node.id)) fail("C24", item.id + " 节点 id 不合规则：" + node.id);
      if (allIds[node.id]) fail("C24", "节点 id 重复：" + node.id);
      allIds[node.id] = true;
    });
  });
  notes.push("C24 OK 七章 49/43/33/35/36/32/49 共 277 节点，id 前缀/唯一/end/title+codex 位置与 chapter-integration 一致");
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
  if (codexNodes.length !== 7) fail("C25", "codex 节点应为 7 个，实际 " + codexNodes.length);
  var storyIds = XB.story.codex.map(function (card) { return card.id; });
  if (storyIds.join(",") !== "yudu,xiangjiang,zunyi,jinsha,luding,grass,wuqi") fail("C25", "story.codex 顺序/数量不对：" + storyIds.join(","));
  var seen = {};
  codexNodes.forEach(function (entry) {
    if (!entry.node.codexId) fail("C25", entry.node.id + " 缺 codexId");
    else if (storyIds.indexOf(entry.node.codexId) === -1) fail("C25", entry.node.id + " 的 codexId 不在 story.codex");
    else if (seen[entry.node.codexId]) fail("C25", "codex 节点重复：" + entry.node.codexId);
    else seen[entry.node.codexId] = true;
  });
  var engine = stripComments(readProject("engine.js"));
  ["XB.story.codex", "renderGallery", "gallery-card"].forEach(function (needle) {
    if (engine.indexOf(needle) === -1) fail("C25", "图鉴未从 story.codex 单一数据源生成，缺 " + needle);
  });
  notes.push("C25 OK 7 个 codex 节点一一对应 story.codex；图鉴单源");
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
  if (!built.names || built.names.length !== 7) fail("C26", "buildEnding 没产出七名");
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
  if (!Array.isArray(node.names) || node.names.length !== 7) fail("C27", "点名 names 应为 7 项");
  var ids = {};
  (node.names || []).forEach(function (entry) {
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
  notes.push("C27 OK 吴起点名 1 个 interact / 45s / 7 名 / 无评分；DOM 与样式就位");
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
checkMinigameApi();
checkMinigameResultContract();
checkMinigameStoryContract();
checkMinigameRebuild();
checkMinigameTuning();
checkMinigameWords();
checkChapterTable();
checkCodexNodes();
checkEndingData();
checkRollcallData();
checkGalleryDom();
checkChapterMemory();
checkEndingSnapshot();

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
  console.log("OK：构建自检 30 项全绿");
}
