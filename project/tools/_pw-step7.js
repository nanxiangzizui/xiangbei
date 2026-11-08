#!/usr/bin/env node
"use strict";

// 步骤七自动化：真实浏览器跑完整流程、存档/图鉴/结局、四关、分辨率与隐私降级。
// 用法：node project/tools/_pw-step7.js --browser=edge --url=file --case=all
// 依赖解析顺序：PW_CORE → my-playwright-project/node_modules/playwright-core → 本仓库 node_modules。

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
let PROJECT = path.join(ROOT, "project");
const OUT_BASE = path.join(ROOT, "docs", "evidence", "step-07");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVE_KEY = "xiangbei.save.v1";
const CHAPTERS = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];
const CHAPTER_GAME = { prologue: "door", xiangjiang: "abandon", jinsha: "boat", luding: "climb" };

function parseArgs(argv) {
  const args = { browser: "edge", url: "file", case: "all", game: "", project: "", offline: false, idle: false, mobile: false, out: null, headed: false, trace: false };
  argv.forEach((raw) => {
    const m = /^--([a-z]+)(?:=(.*))?$/.exec(raw);
    if (!m) return;
    const key = m[1];
    const value = m[2] === undefined ? true : m[2];
    if (key === "headed" || key === "trace" || key === "offline" || key === "idle" || key === "mobile") args[key] = value === true || value === "1";
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
    try {
      return { pw: require(candidate), resolved: candidate };
    } catch (error) {
      failures.push(candidate + " (" + error.code + ")");
    }
  }
  throw new Error("找不到 playwright-core；试过：" + failures.join("；") + "。可设 PW_CORE 指向模块目录。");
}

function mimeFor(file) {
  return {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp3": "audio/mpeg",
    ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8"
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
  const port = server.address().port;
  return { server, base: "http://127.0.0.1:" + port };
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.project) PROJECT = path.resolve(args.project);
  const { pw, resolved } = loadPlaywright();
  const runId = args.browser + "-" + args.url + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(OUT_BASE, runId));
  fs.mkdirSync(OUT, { recursive: true });
  const LOG = path.join(OUT, "run.log");
  const checks = [];
  const result = { runId, browser: args.browser, urlMode: args.url, case: args.case, startedAt: new Date().toISOString(), playwright: resolved, checks, artifacts: {} };

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
  const baseUrl = args.url === "http" ? serverInfo.base + "/index.html" : pathToFileURL(path.join(PROJECT, "index.html")).href;
  const allowedOrigin = args.url === "http" ? serverInfo.base : "file://";
  log("playwright=" + resolved + " base=" + baseUrl);

  async function launch() {
    const common = { headless: !args.headed, args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] };
    if (args.browser === "edge") {
      if (!fs.existsSync(EDGE)) throw new Error("Edge 不存在：" + EDGE);
      return pw.chromium.launch({ ...common, executablePath: EDGE });
    }
    if (args.browser === "chrome") return pw.chromium.launch({ ...common, channel: "chrome" });
    if (args.browser === "chromium") return pw.chromium.launch(common);
    if (args.browser === "webkit") return pw.webkit.launch({ headless: !args.headed });
    throw new Error("未知浏览器：" + args.browser);
  }

  let browser;
  try {
    browser = await launch();
    result.browserVersion = browser.version();
  } catch (error) {
    result.browserError = String(error && error.message || error);
    log("LAUNCH FAILED " + result.browserError);
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
    if (serverInfo) serverInfo.server.close();
    process.exit(3);
  }
  log("browser=" + result.browserVersion);

  function attach(page, logs) {
    page.on("console", (msg) => {
      if (msg.type() === "error") logs.consoleErrors.push(msg.text());
    });
    page.on("pageerror", (error) => logs.pageErrors.push(String(error && error.stack || error)));
    page.on("requestfailed", (request) => {
      logs.requestFailed.push(request.url() + " :: " + (request.failure() ? request.failure().errorText : "?"));
    });
    page.on("response", (response) => {
      if (response.status() >= 400) logs.httpErrors.push(response.status() + " " + response.url());
    });
    page.on("request", (request) => {
      const url = request.url();
      if (/^(file:|data:|blob:|about:)/.test(url)) return;
      if (serverInfo && url.startsWith(serverInfo.base)) return;
      if (!serverInfo && url.startsWith("file:")) return;
      logs.external.push(url);
    });
    page.on("dialog", (dialog) => { logs.dialogs.push(dialog.type() + ":" + dialog.message()); dialog.accept().catch(() => {}); });
  }

  async function newSession(opts) {
    opts = opts || {};
    const context = await browser.newContext({
      viewport: opts.viewport || { width: 1366, height: 768 },
      deviceScaleFactor: opts.deviceScaleFactor || 1,
      hasTouch: !!opts.hasTouch,
      isMobile: !!opts.isMobile,
      locale: "zh-CN",
      reducedMotion: opts.reducedMotion || "no-preference"
    });
    if (opts.initScript) await context.addInitScript(opts.initScript);
    if (args.offline) {
      await context.setOffline(true);
      await context.route(/^https?:/i, (route) => route.abort());
    }
    const page = await context.newPage();
    const logs = { consoleErrors: [], pageErrors: [], requestFailed: [], httpErrors: [], external: [], dialogs: [] };
    attach(page, logs);
    return { context, page, logs };
  }

  async function gotoTitle(page, query) {
    await page.goto(baseUrl + (query || "?debug=1"), { waitUntil: "load" });
    await page.waitForSelector("#stage", { state: "attached", timeout: 10000 });
    await sleep(300);
  }
  function endingCards(lit) {
    return [
      { id: "ideal", lit, line: lit ? "最冷的那一夜，你还留着火。" : "火种，剩得不多了。" },
      { id: "sacrifice", lit, line: lit ? "你把最后一批人，留在了江东岸。" : "你按命令过了江。" },
      { id: "truth", lit, line: lit ? "你在遵义，承认了自己走错的那一步。" : "错误卡上，你自己的那条最短。" },
      { id: "overall", lit, line: lit ? "主力先过江，你排到最后。" : "你先渡了最急的人。" },
      { id: "people", lit, line: lit ? "三十七个船工的名字，你记下了。" : "江边的名字，你没记下几个。" }
    ];
  }
  const ENDING_STATS = { companyStart: 104, companyEnd: 19, redStart: 86000, redEnd: 7000 };
  async function seed(page, partial) {
    await page.goto(baseUrl, { waitUntil: "load" });
    const state = Object.assign({
      version: 1, scene: "title", chapterId: "prologue", nodeId: null,
      flags: {}, inventory: { door: false, items: [] }, choices: [], codex: [],
      settings: {}, unlockedChapters: CHAPTERS.slice(), ending: null
    }, partial || {});
    state.inventory = Object.assign({ door: !!state.flags["item.door"], items: [] }, partial && partial.inventory || {});
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
  }
  async function openSeeded(page, partial, query) {
    await seed(page, partial);
    await gotoTitle(page, query || "?debug=1");
  }
  async function visible(page, selector) {
    const loc = page.locator(selector);
    if (await loc.count() === 0) return false;
    return loc.first().isVisible().catch(() => false);
  }
  async function info(page) {
    const text = await page.locator("#debug").innerText().catch(() => "");
    const node = text.match(/node\s+(\S+)\s+\((\w+)\)/);
    const chapter = text.match(/chapter\s+(\S+)/);
    const scene = text.match(/scene\s+(\S+)/);
    return { node: node && node[1], type: node && node[2], chapter: chapter && chapter[1], scene: scene && scene[1], raw: text };
  }
  async function shot(page, name) {
    const file = path.join(OUT, name + ".png");
    await page.screenshot({ path: file });
    return file;
  }
  async function waitForEnding(page, timeout) {
    const deadline = Date.now() + (timeout || 120000);
    while (Date.now() < deadline) {
      if (await visible(page, "#scene-ending")) return true;
      await sleep(200);
    }
    return false;
  }

  async function handleInteract(page) {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      if (!(await visible(page, "#vn-interact"))) return;
      const answer = page.locator("#interact-answer");
      if (await answer.isVisible().catch(() => false)) {
        await answer.click({ timeout: 3000 }).catch(() => {});
        await sleep(240);
      } else {
        await sleep(180);
      }
    }
  }

  async function waitMinigameDone(page, timeout) {
    const deadline = Date.now() + (timeout || 110000);
    let lastLog = Date.now();
    while (Date.now() < deadline) {
      if (!(await visible(page, "#vn-minigame"))) return true;
      if (Date.now() - lastLog > 12000) {
        lastLog = Date.now();
        const state = await page.evaluate(() => ({
          active: !!(window.XB && XB.minigames && XB.minigames.isActive()),
          hidden: document.getElementById("vn-minigame").hidden,
          result: !document.getElementById("vn-result").hidden,
          paused: !document.getElementById("pause").hidden,
          hud: document.getElementById("minigame-hud").textContent,
          live: document.getElementById("minigame-live").textContent,
          hiddenDoc: document.hidden,
          now: Math.round(performance.now())
        })).catch(() => ({}));
        log("MGWAIT " + JSON.stringify(state));
      }
      await sleep(250);
    }
    return false;
  }

  async function playMinigame(page, gameId) {
    const canvas = page.locator("#minigame-canvas");
    await canvas.click({ position: { x: 30, y: 30 } }).catch(() => {});
    if (gameId === "door") {
      await page.keyboard.press("Digit1");
      await page.keyboard.press("Digit2");
      await page.keyboard.press("Enter");
      return waitMinigameDone(page, 20000);
    }
    if (gameId === "abandon") {
      for (let i = 1; i <= 3; i += 1) await page.keyboard.press("Digit" + i);
      await page.keyboard.press("Enter");
      await sleep(900);
      for (let i = 1; i <= 2; i += 1) await page.keyboard.press("Digit" + i);
      await page.keyboard.press("Enter");
      return waitMinigameDone(page, 20000);
    }
    if (gameId === "boat") {
      for (let wave = 0; wave < 4; wave += 1) {
        if (!(await visible(page, "#vn-minigame"))) { log("BOAT wave " + wave + " already hidden"); return true; }
        await page.evaluate(() => {
          window.__boatMarks = window.__boatMarks || [];
          const state = window.XB && XB.minigames && XB.minigames.__debugState ? XB.minigames.__debugState() : null;
          return state;
        }).catch(() => {});
        log("BOAT wave " + wave + " keys");
        for (let i = 1; i <= 6; i += 1) await page.keyboard.press("Digit" + i);
        log("BOAT wave " + wave + " keys done, sleep");
        await sleep(17000);
        log("BOAT wave " + wave + " slept");
      }
      log("BOAT wait result");
      return waitMinigameDone(page, 30000);
    }
    if (gameId === "climb") {
      const deadline = Date.now() + 75000;
      while (Date.now() < deadline) {
        if (!(await visible(page, "#vn-minigame"))) return true;
        await page.keyboard.press("Enter");
        await sleep(1550);
      }
      return waitMinigameDone(page, 5000);
    }
    return waitMinigameDone(page, 90000);
  }

  async function fullFlow(page, mobile) {
    const hit = (locator, options) => mobile ? locator.tap(options) : locator.click(options);
    const started = Date.now();
    await gotoTitle(page, "?reset=1&debug=1");
    await hit(page.locator('#title-menu [data-action="start"]'));
    await sleep(400);
    let chapter = "prologue";
    const minigames = [];
    let lines = 0;
    let lastNode = null;
    let iteration = 0;
    const deadline = Date.now() + 10 * 60 * 1000;
    while (Date.now() < deadline) {
      iteration += 1;
      if (iteration % 20 === 0) {
        const diag = await info(page);
        log("FULL step=" + iteration + " chapter=" + chapter + " node=" + diag.node + " type=" + diag.type + " scene=" + diag.scene + " lines=" + lines);
      }
      if (await visible(page, "#scene-ending")) {
        const cards = await page.locator("#ending-cards .xb-ending__card").count();
        const lit = await page.locator("#ending-cards .xb-ending__card.is-lit").count();
        const names = await page.locator("#ending-names .xb-ending__name").count();
        const missed = await page.locator("#ending-names .is-missed").count();
        const text = await page.locator("#ending-panel").innerText();
        await sleep(1200);
        await shot(page, "full-ending");
        return { ok: true, ms: Date.now() - started, lines, minigames, cards, lit, names, missed, text: text.slice(0, 800), lastNode };
      }
      if (await visible(page, "#scene-map")) {
        const idx = CHAPTERS.indexOf(chapter);
        const next = CHAPTERS[idx + 1];
        if (!next) throw new Error("地图已到最后一章但没有 ending：" + chapter);
        const station = page.locator('.map-station[data-chapter="' + next + '"]');
        await station.waitFor({ state: "visible", timeout: 8000 });
        await hit(station);
        await sleep(400);
        chapter = next;
        continue;
      }
      if (await visible(page, "#vn-title-card")) {
        await hit(page.locator("#vn-title-card"));
        await sleep(120);
        continue;
      }
      if (await visible(page, "#codex")) {
        await hit(page.locator("#codex-close"));
        await sleep(120);
        continue;
      }
      if (await visible(page, "#vn-result")) {
        await hit(page.locator(".vn-result__more"));
        await sleep(180);
        continue;
      }
      if (await visible(page, "#vn-choices")) {
        const first = page.locator("#vn-choices .xb-choice").first();
        await hit(first);
        await sleep(420);
        continue;
      }
      if (await visible(page, "#vn-interact")) {
        await handleInteract(page);
        continue;
      }
      if (await visible(page, "#vn-minigame")) {
        const d = await info(page);
        const gameId = CHAPTER_GAME[d.chapter] || CHAPTER_GAME[chapter];
        const mgStart = Date.now();
        log("FULL minigame start " + gameId);
        const done = await playMinigame(page, gameId);
        log("FULL minigame end " + gameId + " done=" + done + " ms=" + (Date.now() - mgStart));
        minigames.push({ gameId, ms: Date.now() - mgStart, done });
        if (!done) throw new Error("小游戏未结束：" + gameId);
        continue;
      }
      const d = await info(page);
      chapter = d.chapter || chapter;
      lastNode = d.node || lastNode;
      if (!(await visible(page, "#vn-dialogue"))) {
        await sleep(180);
        continue;
      }
      await hit(page.locator("#vn-dialogue"), mobile ? undefined : { position: { x: 420, y: 120 } });
      lines += 1;
      await sleep(65);
    }
    throw new Error("完整流程超时，停在 " + JSON.stringify(await info(page)));
  }

  const cases = {
    async smoke(page, logs) {
      await gotoTitle(page, "?reset=1&debug=1");
      check("标题可见", await visible(page, "#scene-title"));
      check("虚构声明存在", /人物虚构/.test(await page.locator(".title-version").innerText()));
      await page.locator('#title-menu [data-action="start"]').click();
      await sleep(400);
      check("标题卡出现", await visible(page, "#vn-title-card"));
      await page.locator("#vn-title-card").click();
      await sleep(300);
      const text1 = await page.locator("#vn-text").innerText();
      check("第一句非空", text1.length > 0, text1.slice(0, 30));
      await page.locator("#vn-dialogue").click({ position: { x: 300, y: 80 } });
      await sleep(100);
      await page.locator("#vn-dialogue").click({ position: { x: 300, y: 80 } });
      await sleep(250);
      const text2 = await page.locator("#vn-text").innerText();
      check("推进到下一句", text2 !== text1, text2.slice(0, 30));
      await page.keyboard.press("Escape");
      await sleep(200);
      check("Esc 打开暂停", await visible(page, "#pause"));
      await page.keyboard.press("Escape");
      await sleep(250);
      check("Esc 关闭暂停", !(await visible(page, "#pause")));
      await shot(page, "smoke-vn");
      return { text1, text2 };
    },

    async save(page, logs) {
      await gotoTitle(page, "?reset=1&debug=1");
      await page.locator('#title-menu [data-action="start"]').click();
      await sleep(300);
      await page.locator("#vn-title-card").click();
      for (let i = 0; i < 9; i += 1) {
        if (await visible(page, "#vn-dialogue")) await page.locator("#vn-dialogue").click({ position: { x: 300, y: 80 } });
        await sleep(90);
      }
      const before = await info(page);
      await gotoTitle(page, "?debug=1");
      await sleep(700);
      const after = await info(page);
      check("刷新回到同一节点", before.node === after.node && after.scene === "vn", before.node + " -> " + after.node);
      await shot(page, "save-reload");

      const bad = [
        ["非法 JSON", "{not-json"],
        ["版本过新", JSON.stringify({ version: 99, scene: "vn", chapterId: "prologue", nodeId: "p001" })],
        ["未知节点", JSON.stringify({ version: 1, scene: "vn", chapterId: "prologue", nodeId: "pXXX" })]
      ];
      for (const [name, raw] of bad) {
        await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, raw]);
        await page.reload({ waitUntil: "load" });
        await sleep(500);
        const title = await visible(page, "#scene-title");
        const bodyText = await page.locator("body").innerText();
        check("坏档恢复：" + name, title && bodyText.length > 20, "title=" + title);
      }
      await shot(page, "save-bad");
    },

    async gallery(page, logs) {
      await gotoTitle(page, "?reset=1&debug=1");
      await page.locator('#title-menu [data-action="codex"]').click();
      await sleep(300);
      check("标题入口打开图鉴", await visible(page, "#codex-gallery"));
      const count0 = await page.locator("#gallery-count").innerText();
      check("0/7 计数", count0.replace(/\s/g, "") === "0/7", count0);
      const locked = page.locator(".xb-gallery__card").first();
      await locked.click({ force: true });
      await sleep(250);
      const toast = await page.locator("#toast").innerText().catch(() => "");
      check("锁卡提示章节", /序章解锁/.test(toast), toast);
      await shot(page, "gallery-empty");
      await page.locator("#gallery-close").click();
      await sleep(200);

      const ids = ["yudu", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];
      await openSeeded(page, { scene: "title", codex: ids }, "?debug=1");
      await page.locator('#title-menu [data-action="codex"]').click();
      await sleep(300);
      const count7 = await page.locator("#gallery-count").innerText();
      check("7/7 计数", count7.replace(/\s/g, "") === "7/7", count7);
      check("7 张卡", await page.locator(".xb-gallery__card").count() === 7);
      await page.locator(".xb-gallery__card").first().click();
      await sleep(250);
      check("解锁卡打开正文", await visible(page, "#codex"));
      await page.locator("#codex-close").click();
      await sleep(250);
      check("关闭回图鉴", await visible(page, "#codex-gallery"));
      await shot(page, "gallery-full");

      // 暂停入口：图鉴打开后仍能关回暂停，不丢当前局。
      await gotoTitle(page, "?debug=1");
      await page.locator('#title-menu [data-action="start"]').click();
      await sleep(350);
      if (await visible(page, "#vn-title-card")) { await page.locator("#vn-title-card").click(); await sleep(250); }
      await page.locator(".vn-pause").click();
      await sleep(250);
      await page.locator('#pause-menu [data-action="codex"]').click();
      await sleep(300);
      check("暂停入口打开图鉴", await visible(page, "#codex-gallery"));
      await page.locator("#gallery-close").click();
      await sleep(250);
      check("图鉴关闭回暂停", await visible(page, "#pause"));
      await page.keyboard.press("Escape");
      await sleep(200);

      // 结局入口：图鉴是 overlay，看完关回仍停在结局。
      const names = [
        { id: "he", name: "何指导员", status: "remote" }, { id: "ximei", name: "细妹", status: "self" },
        { id: "lin", name: "林先生", status: "self" }, { id: "zhou", name: "老周", status: "player" },
        { id: "zaowang", name: "灶王", status: "player" }, { id: "feimao", name: "飞毛腿", status: "player" },
        { id: "dongsheng", name: "冬生", status: "self" }
      ];
      await openSeeded(page, { scene: "ending", chapterId: "wuqi", nodeId: null, flags: { "item.door": true, fire: 30, trust: 3 }, ending: { names, answered: 3, missed: 0, cards: endingCards(true), stats: ENDING_STATS } }, "?debug=1");
      await sleep(500);
      await page.locator("#ending-codex").click();
      await sleep(300);
      check("结局入口打开图鉴", await visible(page, "#codex-gallery"));
      await page.locator("#gallery-close").click();
      await sleep(250);
      check("图鉴关闭回结局", await visible(page, "#scene-ending"));
    },

    async ending(page, logs) {
      const namesFull = [
        { id: "he", name: "何指导员", status: "remote" },
        { id: "ximei", name: "细妹", status: "self" },
        { id: "lin", name: "林先生", status: "self" },
        { id: "zhou", name: "老周", status: "player" },
        { id: "zaowang", name: "灶王", status: "player" },
        { id: "feimao", name: "飞毛腿", status: "player" },
        { id: "dongsheng", name: "冬生", status: "self" }
      ];
      const flagsFull = { "item.door": true, fire: 30, trust: 3, "memory.zhang": true, "choice.xiangjiang.hold": true, "choice.zunyi.admit": 2, "choice.jinsha.priority": "main" };
      await openSeeded(page, { scene: "ending", chapterId: "wuqi", nodeId: null, flags: flagsFull, inventory: { door: true, items: [] }, ending: { names: namesFull, answered: 3, missed: 0, cards: endingCards(true), stats: ENDING_STATS } }, "?debug=1");
      await sleep(500);
      check("直接载入 ending", await visible(page, "#scene-ending"));
      check("五卡全亮", await page.locator(".xb-ending__card.is-lit").count() === 5);
      check("七人名单", await page.locator("#ending-names .xb-ending__name").count() === 7);
      check("无人划名", await page.locator("#ending-names .is-missed").count() === 0);
      await shot(page, "ending-full");
      const save = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      check("ending 存档 <4096B", save && save.length < 4096, save && save.length);

      const namesGray = namesFull.map((n) => ({ ...n, status: n.id === "zhou" || n.id === "zaowang" || n.id === "feimao" ? "missed" : n.status }));
      const flagsGray = { "item.door": false, fire: 10, trust: 0, "memory.zhang": false, "choice.xiangjiang.hold": false, "choice.zunyi.admit": 0, "choice.jinsha.priority": "wounded" };
      await openSeeded(page, { scene: "ending", chapterId: "wuqi", nodeId: null, flags: flagsGray, ending: { names: namesGray, answered: 0, missed: 3, cards: endingCards(false), stats: ENDING_STATS } }, "?debug=1");
      await sleep(500);
      check("五卡全灰", await page.locator(".xb-ending__card.is-unlit").count() === 5);
      check("三人划名", await page.locator("#ending-names .is-missed").count() === 3);
      const grayText = await page.locator("#ending-panel").innerText();
      check("灰卡文案", /火种，剩得不多了/.test(grayText));
      await shot(page, "ending-gray");
      return { saveLength: save && save.length, grayText: grayText.slice(0, 300) };
    },

    async minigames(page, logs) {
      const runs = [];
      const single = async (gameId, query, play, expectText) => {
        log("SINGLE " + gameId + " goto");
        await gotoTitle(page, "?minigame=" + gameId + "&debug=1" + (query || ""));
        log("SINGLE " + gameId + " ready");
        await sleep(500);
        const started = Date.now();
        log("SINGLE " + gameId + " play");
        const done = await play(page);
        log("SINGLE " + gameId + " done=" + done + " ms=" + (Date.now() - started));
        const text = await page.locator("#vn-result").innerText().catch(() => "");
        const hasRetry = await visible(page, '[data-action="solo-replay"]');
        runs.push({ gameId, done, ms: Date.now() - started, text: text.slice(0, 300), hasRetry });
        check(gameId + " 有结果", done && text.length > 0, text.slice(0, 80));
        check(gameId + " 无评分/成功大字", !/完美|成功|得分|通关/.test(text));
        check(gameId + " 可再来一次", hasRetry);
        if (expectText) check(gameId + " 结果含 " + expectText, text.indexOf(expectText) !== -1, text.slice(0, 80));
        await shot(page, "mg-" + gameId);
      };
      const only = args.game || "";
      const play = args.idle ? ((p) => waitMinigameDone(p, 95000)) : playMinigame;
      if (!only || only === "door") await single("door", "&door=1", (p) => play(p, "door"), "调试试玩");
      if (!only || only === "abandon") await single("abandon", "&door=1", (p) => play(p, "abandon"), "调试试玩");
      if (!only || only === "boat") await single("boat", "&trust=6", (p) => play(p, "boat"), "调试试玩");
      if (!only || only === "climb") await single("climb", "", (p) => play(p, "climb"), "调试试玩");
      return runs;
    },

    async viewport(page, logs) {
      const rows = [];
      const sizes = [
        { name: "1920x1080", width: 1920, height: 1080 },
        { name: "1366x768", width: 1366, height: 768 },
        { name: "1280x720", width: 1280, height: 720 },
        { name: "844x390", width: 844, height: 390, touch: true },
        { name: "390x844", width: 390, height: 844, touch: true }
      ];
      for (const size of sizes) {
        const session = await newSession({ viewport: { width: size.width, height: size.height }, hasTouch: !!size.touch, isMobile: !!size.touch });
        const p = session.page;
        await gotoTitle(p, "?debug=1");
        const metrics = await p.evaluate(() => {
          const stageEl = document.getElementById("stage");
          const stage = stageEl.getBoundingClientRect();
          const orientation = document.getElementById("orientation");
          const style = getComputedStyle(orientation);
          const orect = orientation.getBoundingClientRect();
          return {
            vw: innerWidth, vh: innerHeight,
            stage: { x: stage.x, y: stage.y, w: stage.width, h: stage.height },
            stageDisplay: getComputedStyle(stageEl).display,
            scale: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || null,
            orientationShown: style.display !== "none" && style.visibility !== "hidden" && orect.width > 0 && orect.height > 0,
            orientationDisplay: style.display,
            orientationRect: { x: orect.x, y: orect.y, w: orect.width, h: orect.height },
            docScrollW: document.documentElement.scrollWidth,
            docScrollH: document.documentElement.scrollHeight
          };
        });
        const expected = Math.min(size.width / 1280, size.height / 720);
        let ok = false;
        if (size.width < size.height) {
          check(size.name + " 舞台隐藏", metrics.stageDisplay === "none" && metrics.stage.w === 0, metrics.stageDisplay);
          check(size.name + " 竖屏提示覆盖视口", metrics.orientationShown && metrics.orientationRect.w >= size.width - 1 && metrics.orientationRect.h >= size.height - 1, JSON.stringify(metrics.orientationRect));
        } else {
          ok = metrics.stage.w > 0 && Math.abs(metrics.stage.w - 1280 * expected) <= 1.5 &&
            metrics.stage.x >= -1 && metrics.stage.y >= -1 &&
            metrics.stage.x + metrics.stage.w <= size.width + 1 && metrics.stage.y + metrics.stage.h <= size.height + 1;
          check(size.name + " 舞台等比不出界", ok, JSON.stringify(metrics.stage) + " expectedScale=" + expected.toFixed(4));
          await p.screenshot({ path: path.join(OUT, "viewport-" + size.name + ".png") });

          // 正文层：不只量标题，确保对话框在舞台内且不横向溢出。
          await openSeeded(p, { scene: "vn", chapterId: "prologue", nodeId: "p005" }, "?debug=1");
          await sleep(450);
          const vn = await p.evaluate(() => {
            const stage = document.getElementById("stage").getBoundingClientRect();
            const d = document.querySelector(".vn-dialogue").getBoundingClientRect();
            const text = document.getElementById("vn-text");
            return { stage: { x: stage.x, y: stage.y, r: stage.right, b: stage.bottom }, d: { x: d.x, y: d.y, r: d.right, b: d.bottom }, overflowX: text.scrollWidth > text.clientWidth + 1 };
          });
          check(size.name + " VN 对话框在舞台内", vn.d.x >= vn.stage.x - 1 && vn.d.y >= vn.stage.y - 1 && vn.d.r <= vn.stage.r + 1 && vn.d.b <= vn.stage.b + 1, JSON.stringify(vn));
          check(size.name + " VN 正文不横向溢出", !vn.overflowX, "scrollWidth<=clientWidth");

          // 结局层：五卡面板在舞台内；手机面板允许纵向滚动。
          const names = [
            { id: "he", name: "何指导员", status: "remote" }, { id: "ximei", name: "细妹", status: "self" },
            { id: "lin", name: "林先生", status: "self" }, { id: "zhou", name: "老周", status: "player" },
            { id: "zaowang", name: "灶王", status: "player" }, { id: "feimao", name: "飞毛腿", status: "player" },
            { id: "dongsheng", name: "冬生", status: "self" }
          ];
          await openSeeded(p, { scene: "ending", chapterId: "wuqi", nodeId: null, flags: { "item.door": true, fire: 30, trust: 3 }, ending: { names, answered: 3, missed: 0, cards: endingCards(true), stats: ENDING_STATS } }, "?debug=1");
          await sleep(450);
          const end = await p.evaluate(() => {
            const stage = document.getElementById("stage").getBoundingClientRect();
            const panel = document.querySelector(".xb-ending");
            const r = panel.getBoundingClientRect();
            return { stage: { x: stage.x, y: stage.y, r: stage.right, b: stage.bottom }, r: { x: r.x, y: r.y, r: r.right, b: r.bottom }, scroll: panel.scrollHeight > panel.clientHeight };
          });
          check(size.name + " ending 面板在舞台内", end.r.x >= end.stage.x - 1 && end.r.y >= end.stage.y - 1 && end.r.r <= end.stage.r + 1 && end.r.b <= end.stage.b + 1, JSON.stringify(end));
          await p.screenshot({ path: path.join(OUT, "viewport-" + size.name + "-ending.png") });
        }
        rows.push({ size: size.name, metrics, expectedScale: expected, ok });
        await session.context.close();
      }
      return rows;
    },

    async mobile(page, logs) {
      const session = await newSession({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      const p = session.page;
      await gotoTitle(p, "?reset=1&debug=1");
      await p.locator('#title-menu [data-action="start"]').tap();
      await sleep(500);
      if (await visible(p, "#vn-title-card")) { await p.locator("#vn-title-card").tap(); await sleep(250); }
      const pause = await p.locator(".vn-pause").boundingBox();
      check("手机暂停热区 ≥44 CSS px", pause && pause.width >= 44 && pause.height >= 44, JSON.stringify(pause));
      const fontSize = await p.evaluate(() => parseFloat(getComputedStyle(document.getElementById("vn-text")).fontSize));
      check("手机正文 ≥14 CSS px", fontSize >= 14, fontSize);
      await p.locator(".vn-pause").tap();
      await sleep(250);
      check("触摸打开暂停", await visible(p, "#pause"));
      await p.locator('#pause-menu [data-action="resume"]').tap();
      await sleep(250);
      await shot(p, "mobile-vn");

      const names = [
        { id: "he", name: "何指导员", status: "remote" }, { id: "ximei", name: "细妹", status: "self" },
        { id: "lin", name: "林先生", status: "self" }, { id: "zhou", name: "老周", status: "player" },
        { id: "zaowang", name: "灶王", status: "player" }, { id: "feimao", name: "飞毛腿", status: "player" },
        { id: "dongsheng", name: "冬生", status: "self" }
      ];
      await openSeeded(p, { scene: "ending", chapterId: "wuqi", nodeId: null, flags: { "item.door": true, fire: 30, trust: 3, "choice.xiangjiang.hold": true, "choice.zunyi.admit": 3, "choice.jinsha.priority": "main" }, ending: { names, answered: 3, missed: 0, cards: endingCards(true), stats: ENDING_STATS } }, "?debug=1");
      await sleep(600);
      const metrics = await p.evaluate(() => {
        const panel = document.getElementById("ending-panel");
        const r = panel.getBoundingClientRect();
        const fs = (sel) => { const el = document.querySelector(sel); return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
        const scale = document.getElementById("stage").getBoundingClientRect().width / 1280;
        const fonts = { title: fs("#ending-title"), lede: fs("#ending-lede"), name: fs("#ending-names .xb-ending__name"), cardH3: fs("#ending-cards .xb-ending__card h3"), cardP: fs("#ending-cards .xb-ending__card p"), stats: fs("#ending-stats") };
        const physical = {};
        Object.keys(fonts).forEach((key) => { physical[key] = fonts[key] === null ? null : Math.round(fonts[key] * scale * 100) / 100; });
        return {
          panel: { x: r.x, y: r.y, w: r.width, h: r.height, scrollH: panel.scrollHeight, clientH: panel.clientHeight, overflowY: getComputedStyle(panel).overflowY },
          vw: innerWidth, vh: innerHeight, scale,
          fonts, physical
        };
      });
      check("手机 ending 面板在视口内", metrics.panel.x >= 0 && metrics.panel.y >= 0 && metrics.panel.x + metrics.panel.w <= metrics.vw + 1 && metrics.panel.y + metrics.panel.h <= metrics.vh + 1, JSON.stringify(metrics.panel));
      check("手机 ending 可滚动", metrics.panel.overflowY === "auto" || metrics.panel.overflowY === "scroll", metrics.panel.overflowY);
      check("手机 ending 正文 ≥14 CSS px", metrics.physical.lede >= 14, JSON.stringify(metrics.physical));
      check("手机 ending 姓名 ≥14 CSS px", metrics.physical.name >= 14, JSON.stringify(metrics.physical));
      check("手机 ending 卡句 ≥14 CSS px", metrics.physical.cardP >= 14, JSON.stringify(metrics.physical));
      await shot(p, "mobile-ending");

      // 五卡不在首屏，滚到底证明最后一张与按钮可达。
      await p.evaluate(() => { const el = document.getElementById("ending-panel"); el.scrollTop = el.scrollHeight; });
      await sleep(350);
      const bottom = await p.evaluate(() => {
        const cards = document.querySelectorAll("#ending-cards .xb-ending__card");
        const last = cards[cards.length - 1];
        const r = last.getBoundingClientRect();
        return { count: cards.length, top: r.top, bottom: r.bottom, vh: innerHeight };
      });
      check("手机 ending 五卡滚动可达", bottom.count === 5 && bottom.top < bottom.vh && bottom.bottom > 0, JSON.stringify(bottom));
      await shot(p, "mobile-ending-bottom");
      await session.context.close();
      return metrics;
    },

    async privacy(page, logs) {
      const session = await newSession({
        viewport: { width: 1366, height: 768 },
        initScript: () => {
          const proto = window.Storage.prototype;
          ["getItem", "setItem", "removeItem", "clear", "key"].forEach((name) => {
            proto[name] = function () { throw new DOMException("storage disabled", "SecurityError"); };
          });
        }
      });
      const p = session.page;
      await p.goto(baseUrl + "?debug=1", { waitUntil: "load" });
      await sleep(700);
      await p.locator('#title-menu [data-action="start"]').click();
      await sleep(500);
      const text = await p.locator("body").innerText();
      check("存储不可用有提示", /本局无法存档/.test(text), text.slice(0, 160));
      check("存储不可用仍能开始", await visible(p, "#vn-title-card"));
      await p.locator("#vn-title-card").click();
      await sleep(300);
      const t = await p.locator("#vn-text").innerText();
      check("存储不可用可继续阅读", t.length > 0, t.slice(0, 30));
      check("存储不可用无 pageerror", session.logs.pageErrors.length === 0, session.logs.pageErrors.join(" | "));
      result.privacy = { text: text.slice(0, 200), logs: session.logs };
      await p.screenshot({ path: path.join(OUT, "privacy.png") });
      await session.context.close();
    },

    async audio(page, logs) {
      await gotoTitle(page, "?reset=1&debug=1");
      const before = await page.evaluate(() => ({
        ready: XB.audio.isReady(),
        state: XB.audio.stats().state,
        beds: XB.audio.BEDS.length,
        cues: XB.audio.CUES.length,
        scenes: Object.keys(XB.audio.BED_BY_SCENE).length,
        motif: XB.audio.MOTIF.length
      }));
      check("首次手势前音频 locked", before.ready === false && before.state === "locked", JSON.stringify(before));
      check("9 床 / 12 cue / 17 场景 / 五音", before.beds === 9 && before.cues === 12 && before.scenes >= 17 && before.motif === 5, JSON.stringify(before));
      await page.locator('#title-menu [data-action="start"]').click();
      await sleep(800);
      const after = await page.evaluate(() => ({
        ready: XB.audio.isReady(), state: XB.audio.stats().state,
        activeBeds: XB.audio.stats().activeBeds, scene: XB.audio.stats().scene, bed: XB.audio.stats().bed
      }));
      check("首次手势后音频 ready", after.ready === true && after.state === "ready", JSON.stringify(after));
      check("同时最多 2 条床", after.activeBeds <= 2, String(after.activeBeds));
      await page.locator("#vn-title-card").click();
      await sleep(350);
      const inScene = await page.evaluate(() => XB.audio.stats());
      check("序章有床与场景", !!inScene.bed && !!inScene.scene, JSON.stringify({ scene: inScene.scene, bed: inScene.bed }));

      await page.keyboard.press("Escape");
      await sleep(300);
      const duckPause = await page.evaluate(() => XB.audio.stats().duck);
      check("暂停 duck 0.3", Math.abs(duckPause - 0.3) < 0.001, String(duckPause));
      await page.keyboard.press("Escape");
      await sleep(300);
      const duckBack = await page.evaluate(() => XB.audio.stats().duck);
      check("继续 duck 1", Math.abs(duckBack - 1) < 0.001, String(duckBack));

      const vis = await page.evaluate(async () => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
        await new Promise((resolve) => setTimeout(resolve, 120));
        const suspended = XB.audio.stats().state;
        const paused = !document.getElementById("pause").hidden;
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { suspended, paused, resumed: XB.audio.stats().state };
      });
      check("后台暂停并 suspend（属性模拟）", vis.suspended === "suspended" && vis.paused, JSON.stringify(vis));
      check("回前台 resume", vis.resumed === "ready", JSON.stringify(vis));
      if (await visible(page, "#pause")) { await page.keyboard.press("Escape"); await sleep(200); }
      result.audio = { before, after, inScene: { scene: inScene.scene, bed: inScene.bed, duck: inScene.duck }, vis };
    },

    async keyboard(page, logs) {
      await gotoTitle(page, "?reset=1&debug=1");
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-action"));
      check("Tab 焦点在菜单", focused === "start", focused);
      await page.keyboard.press("Enter");
      await sleep(450);
      check("Enter 开始", await visible(page, "#vn-title-card"));
      await page.keyboard.press("Space");
      await sleep(300);
      const t1 = await page.locator("#vn-text").innerText();
      check("空格推进首句", t1.length > 0, t1.slice(0, 20));
      await page.keyboard.press("Escape");
      await sleep(200);
      check("Esc 暂停", await visible(page, "#pause"));
      await page.keyboard.press("Escape");
      await sleep(250);
      for (let i = 0; i < 90; i += 1) {
        if (await visible(page, "#vn-choices")) break;
        if (await visible(page, "#vn-dialogue")) await page.locator("#vn-dialogue").click({ position: { x: 300, y: 80 } });
        await sleep(55);
      }
      check("到达序章选项", await visible(page, "#vn-choices"));
      const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").flags["item.door"], SAVE_KEY);
      await page.keyboard.press("Digit1");
      await sleep(600);
      const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").flags["item.door"], SAVE_KEY);
      check("数字键选择并写旗标", after === true && before !== true, String(before) + " -> " + String(after));
      await shot(page, "keyboard-choice");
    }
  };

  const wanted = args.case === "all" ? ["smoke", "save", "gallery", "ending", "minigames", "viewport", "mobile", "privacy", "audio", "keyboard"] : args.case.split(",");
  const session = await newSession(args.mobile
    ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1366, height: 768 } });
  const { page, logs } = session;

  try {
    for (const name of wanted) {
      if (!cases[name] && name !== "full") throw new Error("未知用例：" + name);
      log("CASE " + name);
      const started = Date.now();
      try {
        result[name] = name === "full" ? await fullFlow(page, args.mobile) : await cases[name](page, logs);
        log("CASE " + name + " done in " + (Date.now() - started) + "ms");
      } catch (error) {
        result[name] = { error: String(error && error.stack || error) };
        check(name + " 用例完成", false, String(error && error.message || error));
        await shot(page, "fail-" + name).catch(() => {});
      }
    }
  } finally {
    await session.context.close();
    await browser.close();
    if (serverInfo) serverInfo.server.close();
  }

  result.logs = logs;
  result.finishedAt = new Date().toISOString();
  result.passed = checks.filter((c) => c.ok).length;
  result.failed = checks.filter((c) => !c.ok).length;
  // 坏档用例会刻意触发 [XB] 的 console.error；正常路径仍要求 0。
  const expectedStorageErrors = /\[XB\] 存档(不是合法 JSON|版本过新|校验失败：node)/;
  const unexpectedConsole = logs.consoleErrors.filter((text) => !expectedStorageErrors.test(text));
  result.expectedConsoleErrors = logs.consoleErrors.filter((text) => expectedStorageErrors.test(text));
  check("0 console error（正常路径）", unexpectedConsole.length === 0, unexpectedConsole.join(" | "));
  check("0 pageerror", logs.pageErrors.length === 0, logs.pageErrors.join(" | "));
  check("0 404", logs.httpErrors.length === 0, logs.httpErrors.join(" | "));
  check("0 外部请求", logs.external.length === 0, logs.external.join(" | "));
  result.passed = checks.filter((c) => c.ok).length;
  result.failed = checks.filter((c) => !c.ok).length;
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  log("RESULT " + result.passed + " passed / " + result.failed + " failed -> " + OUT);
  if (result.failed) process.exitCode = 2;
})().catch((error) => {
  console.error("FATAL", error && error.stack || error);
  process.exit(1);
});
