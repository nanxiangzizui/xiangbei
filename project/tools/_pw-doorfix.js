#!/usr/bin/env node
"use strict";

// 门板 Bug 回归：湘江 C 提前把门板留在浮桥后，草地不应再弹“舍弃门板”，
// 结局应为 2/11（桥板），而不是 2/11（门板）· 门板留在了草地。
// 用法：node project/tools/_pw-doorfix.js --url=http --out=docs/evidence/door-fix

const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVES_KEY = "xiangbei.saves.v1";

function parseArgs(argv) {
  const args = { url: "http", out: "", headed: false };
  argv.forEach((raw) => {
    const m = /^--([a-z]+)(?:=(.*))?$/.exec(raw);
    if (!m) return;
    const key = m[1];
    const value = m[2] === undefined ? true : m[2];
    if (key === "headed") args[key] = value === true || value === "1";
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
  const runId = "doorfix-" + args.url + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "door-fix", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const serverInfo = args.url === "http" ? await startServer() : null;
  if (!serverInfo) throw new Error("本回归只跑 http；file:// 由发布包冒烟覆盖");
  const base = serverInfo.base;

  const browser = await pw.chromium.launch({ executablePath: EDGE, headless: !args.headed });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
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
  async function shot(name) {
    await page.screenshot({ path: path.join(OUT, name + ".png") });
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
  async function sleep(ms) {
    await page.waitForTimeout(ms);
  }
  async function nodeId() {
    const debug = await text("#debug").catch(() => "");
    const m = /node\s+(\S+)/.exec(debug);
    return m ? m[1] : "";
  }
  async function clickScene() {
    await page.locator("#scene-vn").click({ position: { x: 640, y: 560 } });
    await sleep(350);
  }
  async function readStore() {
    return page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (err) { return "bad-json"; }
    }, SAVES_KEY);
  }
  function activeSlot(store) {
    if (!store || !Array.isArray(store.slots)) return null;
    return store.slots.find((slot) => slot.id === store.activeId) || store.slots[0] || null;
  }

  try {
    // 用户档的形状：湘江 C 已丢门板，但 doorOutcome 还是 none；choices 里明确有 x025a C。
    const state = {
      version: 2,
      scene: "vn",
      chapterId: "grass",
      nodeId: "g027",
      flags: {
        "had.door": true,
        "item.door": false,
        doorOutcome: "none",
        "choice.xiangjiang.hold": true,
        "choice.prologue.door": true,
        condition: 3,
        rescues: 1,
        fire: 50,
        load: 4,
        "fate.player.dead": false,
        "fate.dongsheng.dead": false,
        "grass.settled": false
      },
      inventory: { door: false, items: ["roster", "pencil"] },
      choices: [
        { chapter: "xiangjiang", nodeId: "x025a", option: "C", text: "把门板横在桥头挡一下", timedOut: false }
      ],
      codex: [],
      unlockedChapters: ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
      settings: {},
      ending: null
    };
    const store = {
      version: 1,
      activeId: "slot-doorfix",
      settings: {},
      slots: [{
        id: "slot-doorfix",
        createdAt: "2026-11-09T00:00:00.000Z",
        updatedAt: "2026-11-09T00:00:00.000Z",
        state
      }]
    };

    await page.goto(base + "/index.html", { waitUntil: "load" });
    await page.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVES_KEY, value: store });

    await page.goto(base + "/index.html?resume=1&debug=1", { waitUntil: "load" });
    await page.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
    await sleep(500);
    ok("从草地 g027 读档", (await nodeId()) === "g027", await nodeId());
    await shot("grass-before");

    let reached = "";
    for (let i = 0; i < 4; i += 1) {
      if (await vis("#door-modal")) break;
      await clickScene();
      reached = await nodeId();
      if (reached === "g028b") break;
    }
    const modalVisible = await vis("#door-modal");
    ok("草地结尾不再弹「必须舍弃门板」", !modalVisible, "door-modal visible=" + modalVisible);
    ok("草地结算后继续到 g028b", reached === "g028b", reached);
    await shot("grass-after");

    // 暂停 → 保存，读回槽位，验证读档修复已落进当前局。
    await page.locator(".vn-pause").click();
    await page.waitForSelector("#pause", { state: "visible" });
    await page.locator('#pause [data-action="save"]').click();
    await sleep(350);
    let saved = activeSlot(await readStore());
    ok("暂停保存后落档", !!saved, saved && saved.id);
    ok("落档 doorOutcome 为 bridge", saved && saved.state && saved.state.flags.doorOutcome === "bridge", saved && saved.state && saved.state.flags.doorOutcome);
    ok("落档 item.door 已移除", saved && saved.state && saved.state.flags["item.door"] === false, saved && saved.state && saved.state.flags["item.door"]);

    // 跳到吴起 codex 前，关掉图鉴后到 w900 结局；用同一档验证 2/11（桥板）。
    await page.goto(base + "/index.html?resume=1&chapter=wuqi&node=w041&debug=1", { waitUntil: "load" });
    await page.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
    await sleep(500);
    if (await vis("#codex")) {
      await page.locator("#codex-close").click();
      await sleep(500);
    }
    for (let i = 0; i < 3 && !(await vis("#scene-ending")); i += 1) {
      if (await vis("#scene-vn")) await clickScene();
      await sleep(300);
    }
    const endingVisible = await vis("#scene-ending");
    ok("到达吴起结局", endingVisible);
    const routeText = endingVisible ? await text("#ending-route") : "";
    ok("结局为 2/11（桥板）", routeText.indexOf("2/11（桥板）") !== -1, routeText);
    ok("结局说明门板留在桥上", routeText.indexOf("门板留在了桥上") !== -1, routeText);
    ok("结局不再写门板留在草地", routeText.indexOf("门板留在了草地") === -1, routeText);
    await shot("ending");

    const endingStore = await readStore();
    const endingSlot = activeSlot(endingStore);
    const ending = endingSlot && endingSlot.state && endingSlot.state.ending;
    ok("结局快照 route 为 door_grass_one", ending && ending.route === "door_grass_one", ending && ending.route);
    ok("结局快照 routeTitle 为桥板", ending && ending.routeTitle === "桥板", ending && ending.routeTitle);
    ok("结局快照 routeLede 写桥上", ending && String(ending.routeLede || "").indexOf("门板留在了桥上") !== -1, ending && ending.routeLede);
    ok("结局快照 doorOutcome 为 bridge", endingSlot && endingSlot.state.flags.doorOutcome === "bridge", endingSlot && endingSlot.state.flags.doorOutcome);

    ok("0 console error", errors.length === 0, errors.join(" | "));
    ok("0 失败请求", failed.length === 0, failed.join(" | "));
  } finally {
    const summary = {
      runId,
      url: args.url,
      at: new Date().toISOString(),
      total: results.length,
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok),
      results,
      consoleErrors: errors,
      failedRequests: failed
    };
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(summary, null, 2));
    console.log("门板回归 " + summary.passed + "/" + summary.total);
    results.forEach((r) => {
      console.log((r.ok ? "PASS " : "FAIL ") + r.name + (r.detail ? " :: " + r.detail : ""));
    });
    console.log("证据 " + OUT);
    await browser.close();
    serverInfo.server.close();
    if (summary.failed.length) process.exitCode = 1;
  }
})().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
