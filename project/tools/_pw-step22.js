#!/usr/bin/env node
"use strict";

// 步骤二十二：物资消耗提示。验证剧情扣物资与行囊主动使用都会在对话框上方弹窗。
// 用法：node project/tools/_pw-step22.js --url=http --case=all --out=docs/evidence/step-22
// 依赖：my-playwright-project/node_modules/playwright-core；浏览器用本机 Edge。

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVE_KEY = "xiangbei.save.v2";
const LEGACY_SAVE_KEY = "xiangbei.save.v1";
const SAVES_KEY = "xiangbei.saves.v1";
const CHAPTERS = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi", "coda", "badend"];

function parseArgs(argv) {
  const args = { url: "http", case: "all", out: "", mobile: false, headed: false };
  argv.forEach((raw) => {
    const m = /^--([a-z]+)(?:=(.*))?$/.exec(raw);
    if (!m) return;
    const key = m[1];
    const value = m[2] === undefined ? true : m[2];
    if (key === "mobile" || key === "headed") args[key] = value === true || value === "1";
    else if (key in args) args[key] = value;
  });
  return args;
}

function loadPlaywright() {
  const candidates = [
    process.env.PW_CORE,
    path.join(ROOT, "my-playwright-project", "node_modules", "playwright-core"),
    path.join(ROOT, "node_modules", "playwright-core"),
    "playwright-core"
  ].filter(Boolean);
  const failures = [];
  for (const candidate of candidates) {
    try { return { pw: require(candidate), resolved: candidate }; }
    catch (error) { failures.push(candidate + " (" + error.code + ")"); }
  }
  throw new Error("找不到 playwright-core；试过：" + failures.join("；"));
}

function mimeFor(file) {
  return {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2",
    ".mp3": "audio/mpeg", ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8"
  }[path.extname(file).toLowerCase()] || "application/octet-stream";
}

async function startServer() {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname === "/") pathname = "/index.html";
    const file = path.resolve(PROJECT, "." + pathname);
    if (file !== PROJECT && !file.startsWith(PROJECT + path.sep)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end("not found"); return; }
      res.writeHead(200, { "Content-Type": mimeFor(file), "Cache-Control": "no-store" });
      res.end(data);
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return { server, base: "http://127.0.0.1:" + server.address().port };
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const { pw, resolved } = loadPlaywright();
  const runId = "step22-" + args.url + "-" + (args.mobile ? "mobile-" : "") + args.case + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-22", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const LOG = path.join(OUT, "run.log");
  const checks = [];
  const result = { runId, urlMode: args.url, case: args.case, mobile: args.mobile, playwright: resolved, checks, startedAt: new Date().toISOString() };

  function log(text) {
    const line = new Date().toISOString() + " " + text;
    console.log(line);
    fs.appendFileSync(LOG, line + "\n");
  }
  function check(name, ok, detail) {
    const entry = { name, ok: !!ok, detail: detail === undefined ? "" : String(detail) };
    checks.push(entry);
    log((entry.ok ? "PASS " : "FAIL ") + name + (entry.detail ? " | " + entry.detail : ""));
    return entry.ok;
  }

  let serverInfo = null;
  if (args.url === "http") serverInfo = await startServer();
  const baseUrl = args.url === "http"
    ? serverInfo.base + "/index.html"
    : pathToFileURL(path.join(PROJECT, "index.html")).href;
  log("playwright=" + resolved + " base=" + baseUrl);

  const browser = await pw.chromium.launch({
    executablePath: EDGE,
    headless: !args.headed,
    args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"]
  });
  result.browserVersion = browser.version();
  log("browser=" + result.browserVersion);

  const context = await browser.newContext({
    viewport: args.mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 },
    deviceScaleFactor: args.mobile ? 2 : 1,
    hasTouch: !!args.mobile,
    isMobile: !!args.mobile,
    locale: "zh-CN"
  });
  const page = await context.newPage();
  const logs = { consoleErrors: [], pageErrors: [], requestFailed: [], httpErrors: [], external: [] };
  page.on("console", (msg) => { if (msg.type() === "error") logs.consoleErrors.push(msg.text()); });
  page.on("pageerror", (error) => logs.pageErrors.push(String(error && error.stack || error)));
  page.on("requestfailed", (request) => logs.requestFailed.push(request.url() + " :: " + (request.failure() ? request.failure().errorText : "?")));
  page.on("response", (response) => { if (response.status() >= 400) logs.httpErrors.push(response.status() + " " + response.url()); });
  page.on("request", (request) => {
    const url = request.url();
    if (/^(file:|data:|blob:|about:)/.test(url)) return;
    if (serverInfo && url.startsWith(serverInfo.base)) return;
    if (!serverInfo && url.startsWith("file:")) return;
    logs.external.push(url);
  });

  async function visible(selector) {
    const loc = page.locator(selector);
    if (await loc.count() === 0) return false;
    return loc.first().isVisible().catch(() => false);
  }
  async function waitVisible(selector, timeout) {
    const deadline = Date.now() + (timeout || 8000);
    while (Date.now() < deadline) {
      if (await visible(selector)) return true;
      await sleep(100);
    }
    return false;
  }
  async function hit(locator, options) {
    return args.mobile ? locator.tap(options) : locator.click(options);
  }
  async function shot(name) {
    const file = path.join(OUT, name + ".png");
    await page.evaluate(() => {
      const el = document.querySelector("#debug");
      if (el) el.style.visibility = "hidden";
    });
    await page.screenshot({ path: file });
    await page.evaluate(() => {
      const el = document.querySelector("#debug");
      if (el) el.style.visibility = "";
    });
    return path.relative(ROOT, file).replace(/\\/g, "/");
  }
  async function gotoTitle(query) {
    await page.goto(baseUrl + (query || "?debug=1"), { waitUntil: "load" });
    await page.waitForSelector("#stage", { state: "attached", timeout: 10000 });
    await sleep(350);
  }
  const BASE_FLAGS = {
    "item.door": false, "item.medicine": false, "item.barley": false, "item.homepot": false,
    "item.raincloth": false, "item.shoes": false, "item.pot": false,
    load: 0, trust: 0, fire: 50, condition: 3, rescues: 0,
    "help.used": false, "memory.help": false,
    "had.door": false, doorOutcome: "none",
    "fate.feimao.dead": false, "fate.zaowang.dead": false, "fate.dongsheng.dead": false,
    "fate.player.dead": false, "grass.settled": false,
    "quality.feimao": 2, "quality.zaowang": 2, "quality.dongsheng": 2,
    "inventory.giftBarley": false, strain: 3
  };
  async function seed(partial) {
    await page.goto(baseUrl, { waitUntil: "load" });
    const given = (partial && partial.flags) || {};
    const state = Object.assign({
      version: 2, scene: "title", chapterId: "prologue", nodeId: null,
      flags: {}, inventory: { door: false, items: [], giftBarley: false }, choices: [], codex: [],
      settings: {}, unlockedChapters: CHAPTERS.slice(), ending: null
    }, partial || {});
    state.version = 2;
    state.flags = Object.assign({}, BASE_FLAGS, given);
    if (state.flags["item.door"] === true) state.flags["had.door"] = true;
    if (state.flags.condition === 0) state.flags["fate.player.dead"] = true;
    state.flags.strain = 3 - (Number(state.flags.rescues) || 0);
    state.inventory = Object.assign({
      door: state.flags["item.door"] === true,
      items: [], giftBarley: state.flags["inventory.giftBarley"] === true
    }, (partial && partial.inventory) || {});
    state.inventory.door = state.flags["item.door"] === true;
    await page.evaluate((key) => localStorage.removeItem(key), SAVES_KEY);
    await page.evaluate((key) => localStorage.removeItem(key), "xiangbei.chapters.v1");
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
    await page.evaluate((key) => localStorage.removeItem(key), LEGACY_SAVE_KEY);
  }
  async function resumeSeededSlot() {
    await hit(page.locator('#title-menu [data-action="saves"]'));
    if (!(await waitVisible("#saves-panel"))) throw new Error("存档面板未打开");
    const rows = page.locator('#saves-list [data-action="save-slot"]');
    if (!(await rows.count())) throw new Error("seed 后存档列表为空");
    await hit(rows.first());
    if (await waitVisible("#save-confirm", 3000)) {
      await hit(page.locator("#save-confirm-yes"));
    }
    await sleep(600);
  }
  async function openAt(chapter, node, flags, inventory) {
    await seed({ scene: "vn", chapterId: chapter, nodeId: node, flags: flags || {}, inventory: inventory || {} });
    await gotoTitle("?debug=1");
    await sleep(300);
    await resumeSeededSlot();
  }
  async function noticeText() {
    return (await page.locator("#pack-notice").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  }
  async function geometry() {
    return page.evaluate(() => {
      const rect = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
      };
      const badge = document.querySelector("#vn-pack-used");
      return {
        stage: rect("#stage"),
        notice: rect("#pack-notice"),
        dialogue: rect("#vn-dialogue"),
        name: rect("#vn-name"),
        text: rect("#vn-text"),
        badge: rect("#vn-pack-used"),
        badgeKind: badge ? badge.dataset.kind || "" : "",
        fontSize: (() => {
          const li = document.querySelector("#pack-notice-list li");
          return li ? parseFloat(getComputedStyle(li).fontSize) : 0;
        })()
      };
    });
  }
  async function badgeInfo() {
    return page.evaluate(() => {
      const el = document.querySelector("#vn-pack-used");
      if (!el) return { exists: false };
      const r = el.getBoundingClientRect();
      return {
        exists: true,
        hidden: el.hidden,
        label: (el.innerText || "").replace(/\s+/g, " ").trim(),
        kind: el.dataset.kind || "",
        expanded: el.getAttribute("aria-expanded"),
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
      };
    });
  }
  async function detailInfo() {
    return page.evaluate(() => {
      const el = document.querySelector("#pack-used-detail");
      if (!el) return { exists: false };
      const r = el.getBoundingClientRect();
      return {
        exists: true,
        hidden: el.hidden,
        text: (el.innerText || "").replace(/\s+/g, " ").trim(),
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
      };
    });
  }
  async function checkBadge(label, expectedLabel, expectedKind) {
    const info = await badgeInfo();
    check(label + " 标识可见", info.exists && !info.hidden && info.rect.width > 20, JSON.stringify(info));
    check(label + " 标识文案", info.label === expectedLabel, info.label);
    if (expectedKind) check(label + " 标识类型", info.kind === expectedKind, info.kind);
    return info;
  }
  async function checkBadgeGeometry(label, info) {
    const geo = await geometry();
    if (!info || !info.exists || info.hidden || !geo.dialogue || !geo.text || !geo.stage) {
      check(label + " 标识几何可测", false, JSON.stringify({ info, geo }));
      return;
    }
    check(label + " 标识在对话框内", info.rect.left >= geo.dialogue.left - 1 && info.rect.right <= geo.dialogue.right + 1,
      "badge=" + info.rect.left.toFixed(2) + ".." + info.rect.right.toFixed(2) + " dialogue=" + geo.dialogue.left.toFixed(2) + ".." + geo.dialogue.right.toFixed(2));
    check(label + " 标识不压正文", info.rect.bottom <= geo.text.top + 1,
      "badge.bottom=" + info.rect.bottom.toFixed(2) + " text.top=" + geo.text.top.toFixed(2));
    check(label + " 标识在舞台内", info.rect.left >= geo.stage.left - 1 && info.rect.right <= geo.stage.right + 1 && info.rect.bottom <= geo.stage.bottom + 1,
      JSON.stringify({ badge: info.rect, stage: geo.stage }));
  }
  async function checkGeometry(label) {
    // 等 180ms 入场动画结束，否则 getBoundingClientRect 会读到位移中的 top/bottom。
    await sleep(250);
    const geo = await geometry();
    if (!geo.notice || !geo.dialogue || !geo.stage) {
      check(label + " 几何可测", false, JSON.stringify(geo));
      return geo;
    }
    check(label + " 弹窗在对话框上方", geo.notice.bottom <= geo.dialogue.top - 10, "notice.bottom=" + geo.notice.bottom.toFixed(2) + " dialogue.top=" + geo.dialogue.top.toFixed(2));
    // 旁白节点的人名层是隐藏的（top=0），只有有人名时才比较；否则用对话框上沿的 10px 净空判断。
    if (geo.name && geo.name.height > 0 && geo.name.top > 0) {
      check(label + " 弹窗不压人名", geo.notice.bottom <= geo.name.top - 3, "notice.bottom=" + geo.notice.bottom.toFixed(2) + " name.top=" + geo.name.top.toFixed(2));
    } else {
      check(label + " 旁白节点无人名可压", true, "name hidden");
    }
    check(label + " 弹窗在舞台内", geo.notice.top >= geo.stage.top - 1 && geo.notice.bottom <= geo.stage.bottom + 1, JSON.stringify({ notice: geo.notice, stage: geo.stage }));
    return geo;
  }

  let checksOk = true;
  async function runStoryCase() {
    await openAt("xiangjiang", "x025b", { "item.barley": true }, { items: ["roster", "pencil", "barley"] });
    check("湘江 x025b 选项出现", await waitVisible('#vn-choices .xb-choice[data-key="A"]'), await page.locator("#vn-choices").innerText().catch(() => ""));
    await hit(page.locator('#vn-choices .xb-choice[data-key="A"]'));
    check("剧情扣青稞后弹窗出现", await waitVisible("#pack-notice", 5000));
    const kicker = (await page.locator("#pack-notice-kicker").innerText().catch(() => "")).trim();
    check("剧情扣青稞 kicker 是物品名", kicker === "青稞", kicker);
    const text = await noticeText();
    check("剧情扣青稞文案", text.indexOf("由于回头接应老周，青稞已被消耗。") !== -1, text);
    // 向前点两三次，走到老周有名字的对白，验证弹窗底边不会压住人名。
    for (let i = 0; i < 8 && !(await visible("#vn-name")); i += 1) {
      await hit(page.locator("#vn-dialogue"));
      await sleep(180);
    }
    check("剧情推进到有人名的对白", await visible("#vn-name"), (await page.locator("#vn-name").innerText().catch(() => "")).trim());
    await checkGeometry("剧情扣青稞");
    // 中途不落档（步骤十五），只能看 HUD 的实时行囊计数：青稞 0.5 格被扣掉后应为 0/4 格。
    const packCount = await page.locator("#vn-pack-count").innerText().catch(() => "");
    check("青稞已从行囊计数扣除", packCount.indexOf("0/4") !== -1, packCount);
    const badge = await checkBadge("剧情扣青稞", "已消耗：青稞", "used");
    await checkBadgeGeometry("剧情扣青稞", badge);
    await sleep(320);
    result.screenshot = await shot("story-xiangjiang-pack-notice");
    await hit(page.locator("#vn-pack-used"));
    await sleep(250);
    const detail = await detailInfo();
    check("剧情扣青稞详情含后果", detail.exists && !detail.hidden && detail.text.indexOf("青稞能替你撑过断粮的那几天。") !== -1, JSON.stringify(detail));
    check("剧情扣青稞详情 aria-expanded", (await badgeInfo()).expanded === "true", JSON.stringify(await badgeInfo()));
    result.detailScreenshot = await shot("story-pack-detail");
    await hit(page.locator("#vn-pack-used"));
    await sleep(250);
    check("剧情扣青稞详情可关闭", (await detailInfo()).hidden === true, JSON.stringify(await detailInfo()));
  }

  async function runPanelCase() {
    await openAt("grass", "g007", { "item.shoes": true }, { items: ["roster", "pencil", "shoes"] });
    check("草地行囊按钮可用", await waitVisible("#vn-pack-button"));
    await hit(page.locator("#vn-pack-button"));
    check("行囊面板打开", await waitVisible("#pack-panel"));
    const use = page.locator('[data-action="pack-use"][data-pack-use="shoes"]');
    check("布鞋使用按钮存在", (await use.count()) === 1);
    await hit(use.first());
    await sleep(500);
    const usedRow = page.locator(".xb-pack__item.is-pack-used").filter({ hasText: "布鞋" }).first();
    check("面板里出现已消耗的布鞋行", (await usedRow.count()) >= 1, await page.locator("#pack-panel").innerText().catch(() => ""));
    const usedText = (await usedRow.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    check("已消耗行写明布鞋和已消耗", usedText.indexOf("布鞋") !== -1 && usedText.indexOf("已消耗") !== -1, usedText);
    result.panelUsedScreenshot = await shot("panel-shoes-used-row");
    await hit(page.locator("#pack-close"));
    check("使用布鞋后弹窗出现", await waitVisible("#pack-notice", 5000));
    const kicker = (await page.locator("#pack-notice-kicker").innerText().catch(() => "")).trim();
    check("使用布鞋 kicker 是物品名", kicker === "布鞋", kicker);
    const text = await noticeText();
    check("使用布鞋文案", text.indexOf("由于你拿它补充体力，布鞋已被消耗。") !== -1, text);
    await checkGeometry("使用布鞋");
    const badge = await checkBadge("使用布鞋", "已消耗：布鞋", "used");
    await checkBadgeGeometry("使用布鞋", badge);
    await sleep(320);
    result.panelScreenshot = await shot("panel-shoes-pack-notice");
    await hit(page.locator("#vn-pack-used"));
    await sleep(250);
    const detail = await detailInfo();
    check("布鞋详情含后果", detail.exists && !detail.hidden && detail.text.indexOf("布鞋能在草地那几天垫住脚") !== -1, JSON.stringify(detail));
    result.panelDetailScreenshot = await shot("panel-shoes-detail");
    await hit(page.locator("#vn-pack-used"));
    await sleep(200);
  }

  async function runMultiUseCase() {
    await openAt("grass", "g007", { "item.barley": true, "item.medicine": true }, { items: ["roster", "pencil", "barley", "medicine"] });
    await hit(page.locator("#vn-pack-button"));
    await waitVisible("#pack-panel");
    const use = page.locator('[data-action="pack-use"][data-pack-use="barley+medicine"]');
    check("青稞+药组合存在", (await use.count()) === 1);
    await hit(use.first());
    await sleep(500);
    check("面板里出现两件已消耗物资", (await page.locator(".xb-pack__item.is-pack-used").count()) >= 2, await page.locator("#pack-panel").innerText().catch(() => ""));
    await hit(page.locator("#pack-close"));
    check("多件物资弹窗出现", await waitVisible("#pack-notice", 5000));
    const kicker = (await page.locator("#pack-notice-kicker").innerText().catch(() => "")).trim();
    check("多件物资 kicker 列出物品", kicker === "青稞、药", kicker);
    const text = await noticeText();
    check("多件物资并成一行", text.indexOf("由于你拿它们补充体力，青稞、药已被消耗。") !== -1, text);
    const badge = await checkBadge("多件物资", "已消耗：青稞、药", "used");
    await checkBadgeGeometry("多件物资", badge);
    await sleep(320);
    result.multiScreenshot = await shot("multi-pack-notice");
    await hit(page.locator("#vn-pack-used"));
    await sleep(250);
    const detail = await detailInfo();
    check("多件详情含青稞后果", detail.text.indexOf("青稞能替你撑过断粮的那几天。") !== -1, detail.text);
    check("多件详情含药后果", detail.text.indexOf("药能让一个伤员多撑一夜。") !== -1, detail.text);
    result.multiDetailScreenshot = await shot("multi-pack-detail");
    await hit(page.locator("#vn-pack-used"));
    await sleep(200);
  }

  async function runLackCase() {
    await openAt("luding", "l019", { "item.door": true, "doorOutcome": "carried", "item.medicine": false }, { items: ["roster", "pencil", "door"] });
    check("泸定无药选项出现", await waitVisible('#vn-choices .xb-choice[data-key="B"]'), await page.locator("#vn-choices").innerText().catch(() => ""));
    const b = page.locator('#vn-choices .xb-choice[data-key="B"]');
    check("无药选项被禁用", await b.isDisabled(), await b.getAttribute("class"));
    check("无药选项有置灰样式", ((await b.getAttribute("class")) || "").indexOf("is-unavailable") !== -1, await b.getAttribute("class"));
    const cost = (await b.locator(".xb-choice__cost").innerText().catch(() => "")).trim();
    check("无药选项写明做不了的原因", cost === "没有药，飞毛腿背上的血止不住。", cost);
    check("无药原因用缺件样式", ((await b.locator(".xb-choice__cost").getAttribute("class")) || "").indexOf("is-lack") !== -1, await b.locator(".xb-choice__cost").getAttribute("class"));
    check("选项打开时不提前弹缺件提示", await page.locator("#pack-notice").evaluate((el) => el.hidden), "notice visible");
    await hit(page.locator('#vn-choices .xb-choice[data-key="C"]'));
    check("缺件提示在选项收起后出现", await waitVisible("#pack-notice", 5000));
    const kicker = (await page.locator("#pack-notice-kicker").innerText().catch(() => "")).trim();
    check("缺件提示 kicker 是药", kicker === "药", kicker);
    const text = await noticeText();
    check("缺件提示写明因果", text.indexOf("由于没有药，飞毛腿背上的血止不住。") !== -1, text);
    const info = await badgeInfo();
    check("缺件不产生右侧物资标识", info.exists === true && info.hidden === true, JSON.stringify(info));
    await checkGeometry("缺件提示");
    await sleep(320);
    result.lackScreenshot = await shot("lack-medicine-notice");
  }

  async function runGainCase() {
    await openAt("prologue", "p024", {}, { items: [] });
    check("序章行囊多选出现", await waitVisible("#vn-multichoice"));
    await hit(page.locator('[data-multi-id="medicine"]'));
    await hit(page.locator('[data-multi-id="barley"]'));
    await hit(page.locator("#vn-multi-confirm"));
    check("行囊未满确认出现", await waitVisible("#bag-confirm-modal", 5000));
    await hit(page.locator("#bag-confirm-yes"));
    check("出发前行囊面板出现", await waitVisible("#pack-panel", 5000));
    const gainedRows = page.locator(".xb-pack__item.is-pack-gained");
    check("面板标出获得的药和青稞", (await gainedRows.count()) >= 2, await page.locator("#pack-panel").innerText().catch(() => ""));
    result.gainPanelScreenshot = await shot("gain-panel-highlight");
    await hit(page.locator("#pack-close"));
    // p024 之后先落在 p025 的「行囊」结算页，正文与人名层要等「继续」进 p026 才出现。
    check("出发后先出现行囊结算页", await waitVisible(".vn-result__more", 5000), await page.locator("#vn-result").innerText().catch(() => ""));
    await hit(page.locator(".vn-result__more"));
    check("出发后出现获得标识", await waitVisible("#vn-pack-used", 5000));
    const badge = await badgeInfo();
    check("获得标识写获得", badge.label.indexOf("获得：") === 0 && badge.label.indexOf("药") !== -1 && badge.label.indexOf("青稞") !== -1, JSON.stringify(badge));
    check("获得标识类型", badge.kind === "gained", badge.kind);
    await checkBadgeGeometry("获得物资", badge);
    await hit(page.locator("#vn-pack-used"));
    await sleep(250);
    const detail = await detailInfo();
    check("获得详情写出药和青稞", detail.text.indexOf("你获得了") !== -1 && detail.text.indexOf("药能让") !== -1 && detail.text.indexOf("青稞能") !== -1, JSON.stringify(detail));
    await sleep(320);
    result.gainScreenshot = await shot("gain-pack-notice");
    result.gainDetailScreenshot = await shot("gain-pack-detail");
    await hit(page.locator("#vn-pack-used"));
    await sleep(200);
  }

  try {
    if (args.case === "all" || args.case === "story") await runStoryCase();
    if (args.case === "all" || args.case === "panel") await runPanelCase();
    if (args.case === "all" || args.case === "multi") await runMultiUseCase();
    if (args.case === "all" || args.case === "lack") await runLackCase();
    if (args.case === "all" || args.case === "gain") await runGainCase();
    check("无 console error", logs.consoleErrors.length === 0, logs.consoleErrors.join(" | "));
    check("无 pageerror", logs.pageErrors.length === 0, logs.pageErrors.join(" | "));
    check("无失败请求", logs.requestFailed.length === 0 && logs.httpErrors.length === 0, logs.requestFailed.concat(logs.httpErrors).join(" | "));
    check("无外部请求", logs.external.length === 0, logs.external.join(" | "));
    if (checks.some((entry) => !entry.ok)) checksOk = false;
  } catch (error) {
    checksOk = false;
    log("ERROR " + (error && error.stack || error));
  }

  result.checksOk = checksOk;
  result.finishedAt = new Date().toISOString();
  result.logs = logs;
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  await context.close();
  await browser.close();
  if (serverInfo) await new Promise((resolve) => serverInfo.server.close(resolve));
  log("RESULT " + (checksOk ? "PASS" : "FAIL") + " " + checks.filter((entry) => entry.ok).length + "/" + checks.length);
  if (!checksOk) process.exitCode = 1;
})();
