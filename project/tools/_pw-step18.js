#!/usr/bin/env node
"use strict";

// 步骤十八：标题设置入口与门板单一状态（v1.7.2-dev）。
// 覆盖：纯标题 / 开始·继续开存档 / 标题设置与危险操作初始化 /
// 暂停设置不显示危险操作 / 六个剧情门板写点 / http 与 file://。
// 用法：node project/tools/_pw-step18.js --url=http --case=all --out=docs/evidence/step-18

const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVES_KEY = "xiangbei.saves.v1";
const LEGACY_KEY = "xiangbei.save.v2";

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
  for (const candidate of candidates) {
    try { return require(candidate); } catch (err) { /* next */ }
  }
  throw new Error("找不到 playwright-core");
}

function mimeFor(file) {
  return {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2",
    ".mp3": "audio/mpeg", ".txt": "text/plain; charset=utf-8"
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

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const pw = loadPlaywright();
  const caseName = args.case;
  const mobile = args.mobile || caseName === "mobile";
  const runId = "step18-" + args.url + "-" + (mobile ? "mobile-" : "") + caseName + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-18", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const fileBase = "file:///" + path.join(PROJECT, "index.html").replace(/\\/g, "/");
  const serverInfo = args.url === "http" ? await startServer() : null;
  const origin = serverInfo ? serverInfo.base : null;

  const browser = await pw.chromium.launch({ executablePath: EDGE, headless: !args.headed });
  const context = await browser.newContext({
    viewport: mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    hasTouch: mobile
  });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
  page.on("requestfailed", (req) => failed.push(req.url() + " " + (req.failure() && req.failure().errorText)));

  const results = [];
  function ok(name, cond, detail) {
    results.push({ name, ok: !!cond, detail: detail === undefined ? "" : String(detail) });
  }
  function eq(name, actual, expected) {
    ok(name, actual === expected, "实际 " + JSON.stringify(actual) + " / 期望 " + JSON.stringify(expected));
  }
  function has(name, haystack, needle) {
    ok(name, String(haystack).indexOf(needle) !== -1, "在「" + String(haystack).slice(0, 160) + "」里找「" + needle + "」");
  }
  async function shot(name) {
    await page.screenshot({ path: path.join(OUT, name + ".png") });
  }
  async function boot(query) {
    const url = (args.url === "file" ? fileBase : origin + "/index.html") + (query ? "?" + query : "");
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
    await page.waitForTimeout(180);
  }
  async function vis(selector) {
    return page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el || el.hidden) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, selector);
  }
  async function text(selector) {
    return page.$eval(selector, (el) => el.textContent.trim());
  }
  async function click(selector) {
    await page.locator(selector).first().click();
    await page.waitForTimeout(120);
  }
  async function fresh(query) {
    await boot("reset=1");
    await boot(query);
  }
  async function activeId() {
    return page.evaluate(() => (document.activeElement && document.activeElement.id) || "");
  }
  async function activeAction() {
    return page.evaluate(() => (document.activeElement && document.activeElement.getAttribute("data-action")) || "");
  }
  async function waitChoice() {
    await page.waitForSelector("#vn-choices .xb-choice", { state: "visible", timeout: 5000 });
    await page.waitForTimeout(80);
  }
  async function pick(key) {
    await page.locator('#vn-choices .xb-choice[data-key="' + key + '"]').click();
    await page.waitForTimeout(320);
  }
  async function seedDoor(outcome, chapterId, nodeId, extraFlags) {
    await boot("");
    await page.evaluate(([key, outcome, chapterId, nodeId, extra]) => {
      const state = XB.core.defaults();
      state.version = 2;
      state.scene = "vn";
      state.chapterId = chapterId;
      state.nodeId = nodeId;
      state.flags.doorOutcome = outcome;
      Object.keys(extra || {}).forEach((name) => { state.flags[name] = extra[name]; });
      XB.core.syncDerivedFlags(state);
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify(state));
    }, [LEGACY_KEY, outcome, chapterId, nodeId, extraFlags || {}]);
    await boot("resume=1&chapter=" + chapterId + "&node=" + nodeId);
    await page.waitForSelector("#scene-vn", { state: "visible", timeout: 5000 });
    await page.waitForTimeout(150);
  }
  async function manualSaveAndRead() {
    await page.keyboard.press("Escape");
    await page.waitForSelector("#pause", { state: "visible", timeout: 3000 });
    await click('#pause-menu [data-action="save"]');
    await page.waitForTimeout(320);
    const store = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), SAVES_KEY);
    const slot = store && store.slots && (store.slots.find((item) => item.id === store.activeId) || store.slots[0]);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(160);
    return slot ? slot.state : null;
  }
  function doorOf(state) {
    if (!state) return null;
    return {
      outcome: state.flags.doorOutcome,
      had: state.flags["had.door"],
      item: state.flags["item.door"],
      inventory: state.inventory && state.inventory.door
    };
  }
  async function expectDoor(label, expected) {
    const state = await manualSaveAndRead();
    const door = doorOf(state);
    eq(label + " · outcome", door && door.outcome, expected.outcome);
    eq(label + " · had.door 派生", door && door.had, expected.had);
    eq(label + " · item.door 派生", door && door.item, expected.item);
    eq(label + " · inventory.door 派生", door && door.inventory, expected.item);
    return state;
  }

  try {
    if (caseName === "all" || caseName === "ui") {
      await fresh("");
      eq("标题是纯文本 h1", await text("#scene-title h1.title-main"), "向北");
      eq("h1 内没有按钮", await page.locator("#scene-title h1 button").count(), 0);
      eq("首项文案「开始 / 继续」", await text('#title-menu [data-action="saves"]'), "开始 / 继续");
      eq("标题没有旧 init-game 按钮", await page.locator('#scene-title [data-action="init-game"]').count(), 0);
      eq("标题有设置入口", await page.locator("#scene-title .title-settings").count(), 1);
      await shot("01-title");

      await click('#title-menu [data-action="saves"]');
      eq("点「开始 / 继续」开存档面板", await vis("#saves-panel"), true);
      eq("存档面板标题", await text("#saves-title"), "存档");
      await shot("02-saves");
      await click("#saves-close");
      eq("关存档回标题", await vis("#scene-title"), true);

      await click(".title-settings");
      eq("标题设置借用遮罩", await vis("#pause"), true);
      eq("标题设置隐藏暂停菜单", await vis("#pause-menu"), false);
      eq("标题设置面板可见", await vis("#vn-settings"), true);
      eq("标题设置显示危险操作", await vis("#settings-danger"), true);
      eq("标题设置焦点在文字速度", await activeId(), "set-speed");
      await shot("03-settings-title");

      await click("#settings-init-game");
      eq("初始化打开二选一", await vis("#save-confirm"), true);
      has("初始化正文覆盖存档", await text("#save-confirm-body"), "存档");
      has("初始化正文覆盖分支成就回顾", await text("#save-confirm-body"), "剧情分支、成就和回顾记录");
      has("初始化正文声明不可撤销", await text("#save-confirm-body"), "此操作不可撤销");
      await shot("04-init-confirm");
      await click("#save-confirm-no");
      eq("点「否」关确认", await vis("#save-confirm"), false);
      eq("点「否」回设置", await vis("#vn-settings"), true);
      eq("点「否」焦点回初始化", await activeId(), "settings-init-game");

      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
      eq("Esc 关标题设置", await vis("#vn-settings"), false);
      eq("Esc 后遮罩收起", await vis("#pause"), false);
      eq("Esc 后焦点回设置入口", await activeAction(), "open-settings");

      await click(".title-settings");
      await click("#settings-init-game");
      await click("#save-confirm-yes");
      await page.waitForTimeout(420);
      eq("初始化后回标题", await vis("#scene-title"), true);
      eq("初始化后设置收起", await vis("#vn-settings"), false);
      eq("初始化后遮罩收起", await vis("#pause"), false);
      eq("初始化后焦点回标题首项", await activeAction(), "saves");
      await shot("05-after-init");

      // 暂停态设置不出现危险操作，返回路径回暂停菜单。
      await fresh("chapter=prologue&node=p001");
      await page.keyboard.press("Escape");
      await page.waitForSelector("#pause", { state: "visible", timeout: 3000 });
      await click('#pause-menu [data-action="open-settings"]');
      eq("暂停设置可见", await vis("#vn-settings"), true);
      eq("暂停设置隐藏危险操作", await vis("#settings-danger"), false);
      await shot("06-settings-pause");
      await click('#vn-settings [data-action="close-settings"]');
      eq("暂停设置返回暂停菜单", await vis("#pause-menu"), true);
      eq("暂停设置返回焦点回设置入口", await activeAction(), "open-settings");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(150);
      eq("Esc 从暂停回剧情", await vis("#pause"), false);
    }

    if (caseName === "all" || caseName === "door") {
      // p021 A：剧情只写 doorOutcome，其余派生。
      await fresh("chapter=prologue&node=p021");
      await waitChoice();
      await pick("A");
      const prologue = await expectDoor("p021 A", { outcome: "carried", had: true, item: true });
      eq("p021 A · fire", prologue && prologue.flags.fire, 60);
      eq("p021 A · load", prologue && prologue.flags.load, 2);

      await fresh("chapter=prologue&node=p021");
      await waitChoice();
      await pick("B");
      await expectDoor("p021 B", { outcome: "none", had: false, item: false });

      await seedDoor("carried", "xiangjiang", "x025a");
      await waitChoice();
      await pick("C");
      await expectDoor("x025a C", { outcome: "bridge", had: true, item: false });

      await seedDoor("carried", "luding", "l019");
      await waitChoice();
      await pick("A");
      const luding = await expectDoor("l019 A", { outcome: "bridge", had: true, item: false });
      eq("l019 A · 救人计数", luding && luding.flags.rescues, 1);

      await seedDoor("carried", "wuqi", "w013");
      await waitChoice();
      await pick("A");
      await expectDoor("w013 A", { outcome: "wuqi", had: true, item: false });

      await seedDoor("carried", "wuqi", "w013");
      await waitChoice();
      await pick("B");
      await expectDoor("w013 B", { outcome: "carried", had: true, item: true });
    }

    if (caseName === "mobile") {
      await fresh("");
      const titleSettings = await page.locator(".title-settings").boundingBox();
      ok("移动端设置入口热区 >= 44 CSS px", titleSettings && titleSettings.height >= 44 && titleSettings.width >= 44, JSON.stringify(titleSettings));
      await page.tap(".title-settings");
      await page.waitForTimeout(150);
      eq("移动端标题设置可见", await vis("#vn-settings"), true);
      const initBox = await page.locator("#settings-init-game").boundingBox();
      ok("移动端初始化热区 >= 44 CSS px", initBox && initBox.height >= 44 && initBox.width >= 44, JSON.stringify(initBox));
      const settingsBox = await page.locator("#vn-settings").boundingBox();
      ok("移动端设置面板不出界", settingsBox && settingsBox.x >= 0 && settingsBox.y >= 0 &&
        settingsBox.width <= 844 && settingsBox.height <= 390, JSON.stringify(settingsBox));
      await shot("07-mobile-settings");
    }

    ok("全程 0 console error", errors.length === 0, errors.join(" | "));
    ok("全程 0 失败请求", failed.length === 0, failed.join(" | "));
  } catch (err) {
    results.push({ name: "脚本异常", ok: false, detail: err && err.stack ? err.stack : String(err) });
  } finally {
    const summary = {
      runId, url: args.url, case: caseName, mobile,
      passed: results.filter((r) => r.ok).length,
      total: results.length,
      failed: results.filter((r) => !r.ok),
      results, errors, failedRequests: failed
    };
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(OUT, "run.log"), results.map((r) => (r.ok ? "PASS " : "FAIL ") + r.name + (r.ok ? "" : " :: " + r.detail)).join("\n") + "\n");
    console.log("== " + runId + " ==");
    results.forEach((r) => console.log((r.ok ? "PASS " : "FAIL ") + r.name + (r.ok ? "" : " :: " + r.detail)));
    console.log("SUMMARY " + summary.passed + "/" + summary.total + " · errors " + errors.length + " · failed requests " + failed.length);
    console.log("OUT " + OUT);
    await browser.close();
    if (serverInfo) serverInfo.server.close();
    if (summary.passed !== summary.total) process.exitCode = 1;
  }
})();
