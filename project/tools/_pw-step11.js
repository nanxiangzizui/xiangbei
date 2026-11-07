#!/usr/bin/env node
"use strict";

// 步骤十自动化：三次危机、四路线、空页 coda、名册回廊、旧档迁移、多选 maxWhen、完整流程、移动端。
// 用法：node project/tools/_pw-step10.js --url=http --case=all --out=docs/evidence/step-10
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
const ROSTER_KEY = "xiangbei.roster.v1";
const CHAPTERS = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi", "coda", "badend"];

function parseArgs(argv) {
  const args = { url: "http", case: "all", out: "", mobile: false, headed: false, pace: "55" };
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
  const runId = "step11-" + args.url + "-" + (args.mobile ? "mobile-" : "") + args.case + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-11", runId));
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
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
    await page.evaluate((key) => localStorage.removeItem(key), LEGACY_SAVE_KEY);
  }
  async function seedRaw(version, partial) {
    await page.goto(baseUrl, { waitUntil: "load" });
    const state = Object.assign({
      version, scene: "vn", chapterId: "prologue", nodeId: "p001",
      flags: {}, inventory: { door: false, items: ["roster", "pencil"] }, choices: [], codex: [],
      settings: {}, unlockedChapters: CHAPTERS.slice(), ending: null
    }, partial || {});
    state.version = version;
    if (version === 1) {
      await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
      await page.evaluate(([key, value]) => localStorage.setItem(key, value), [LEGACY_SAVE_KEY, JSON.stringify(state)]);
    } else {
      await page.evaluate((key) => localStorage.removeItem(key), LEGACY_SAVE_KEY);
      await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
    }
  }
  async function readLegacySave() {
    return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), LEGACY_SAVE_KEY);
  }
  async function readSave() {
    return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), SAVE_KEY);
  }
  async function readRoster() {
    return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), ROSTER_KEY);
  }
  async function clearRoster() {
    await page.goto(baseUrl, { waitUntil: "load" });
    await page.evaluate((key) => localStorage.removeItem(key), ROSTER_KEY);
  }
  async function info() {
    const text = await page.locator("#debug").innerText().catch(() => "");
    const node = text.match(/node\s+(\S+)\s+\((\w+)\)/);
    const chapter = text.match(/chapter\s+(\S+)/);
    return { node: node && node[1], type: node && node[2], chapter: chapter && chapter[1], raw: text };
  }
  async function waitNode(id, timeout) {
    const deadline = Date.now() + (timeout || 8000);
    let last = null;
    while (Date.now() < deadline) {
      const d = await info();
      last = d;
      if (d.node === id) return true;
      await sleep(100);
    }
    log("WAIT-MISS " + id + " last=" + (last && last.node) + " raw=" + (last && last.raw || ""));
    return false;
  }
  async function waitVisible(selector, timeout) {
    const deadline = Date.now() + (timeout || 8000);
    while (Date.now() < deadline) {
      if (await visible(selector)) return true;
      await sleep(100);
    }
    return false;
  }
  async function shot(name) {
    const file = path.join(OUT, name + ".png");
    await page.screenshot({ path: file });
    return path.relative(ROOT, file).replace(/\\/g, "/");
  }
  function hit(locator, options) {
    return args.mobile ? locator.tap(options) : locator.click(options);
  }
  async function nextLine() {
    const before = (await info()).node;
    await hit(page.locator("#vn-dialogue"), args.mobile ? undefined : { position: { x: 420, y: 120 } });
    await sleep(260);
    if ((await info()).node === before) {
      await hit(page.locator("#vn-dialogue"), args.mobile ? undefined : { position: { x: 420, y: 120 } });
      await sleep(320);
    }
  }
  async function openChapter(chapter, node) {
    await gotoTitle("?reset=1&chapter=" + chapter + "&node=" + node + "&debug=1");
  }
  async function choiceCount() {
    return page.locator("#vn-choices .xb-choice").count();
  }
  async function pickChoice(index) {
    const options = page.locator("#vn-choices .xb-choice");
    await hit(options.nth(index));
    await sleep(450);
  }
  async function closeCodexIfOpen() {
    if (await visible("#codex")) { await hit(page.locator("#codex-close")); await sleep(200); return true; }
    return false;
  }
  async function answerVisible() {
    const answer = page.locator("#interact-answer");
    if (await answer.isVisible().catch(() => false)) {
      await hit(answer).catch(() => {});
      await sleep(220);
      return true;
    }
    return false;
  }
  async function handleInteract() {
    const deadline = Date.now() + 70000;
    while (Date.now() < deadline) {
      if (!(await visible("#vn-interact"))) return true;
      if (!(await answerVisible())) await sleep(160);
    }
    return false;
  }

  async function openAt(chapter, node, flags, inventory) {
    await seed({ scene: "vn", chapterId: chapter, nodeId: node, flags: flags || {}, inventory: inventory || {} });
    await gotoTitle("?debug=1");
    await sleep(300);
  }
  async function closeCodex() {
    if (await visible("#codex")) {
      await hit(page.locator("#codex-close"));
      await sleep(300);
      return true;
    }
    return false;
  }
  async function advanceUntil(id, max) {
    for (let i = 0; i < (max || 10); i += 1) {
      if ((await info()).node === id) return true;
      if (await visible("#codex")) { await hit(page.locator("#codex-close")); await sleep(300); continue; }
      if (await visible("#vn-dialogue")) { await nextLine(); continue; }
      await sleep(200);
    }
    return (await info()).node === id;
  }
  async function waitEnding(timeout) {
    return waitVisible("#scene-ending", timeout || 16000);
  }
  async function endingData() {
    const route = (await page.locator("#ending-route").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    const names = await page.locator("#ending-names .xb-ending__name").count();
    const cards = await page.locator("#ending-cards .xb-ending__card").count();
    const stats = (await page.locator("#ending-stats").innerText().catch(() => "")).replace(/\s+/g, " ");
    const save = await readSave();
    return { route, names, cards, stats, save, ending: save && save.ending };
  }
  async function useRecipe(key) {
    const button = page.locator('[data-action="pack-use"][data-pack-use="' + key + '"]');
    if (!(await button.count())) return false;
    await hit(button.first());
    await sleep(500);
    return true;
  }
  async function routeCase(label, slug, partial, expect) {
    await seed(partial);
    await gotoTitle("?debug=1");
    await sleep(500);
    if (expect.chapter === "coda") {
      check(label + " 起点 c011", await waitNode("c011"), (await info()).raw);
      await nextLine();
    } else if (expect.chapter === "badend") {
      // b006 是 end，载入即结算。
    } else {
      await closeCodex();
    }
    const reached = await waitEnding(16000);
    check(label + " 到结局", reached, (await info()).raw);
    const data = await endingData();
    const routeOk = expect.bad
      ? /^坏结局 · 没有走出草地/.test(data.route)
      : data.route.indexOf("结局" + expect.label + "（" + expect.title + "）") === 0;
    check(label + " 路线行", routeOk, data.route);
    const savedNames = data.ending && Array.isArray(data.ending.names) ? data.ending.names.length : -1;
    check(label + " 名册人数", savedNames === expect.names, savedNames);
    check(label + " 五卡", data.cards === 5, data.cards);
    check(label + " 到吴起人数", data.stats.indexOf("到吴起 " + expect.companyEnd + " 人") !== -1, data.stats);
    check(label + " 快照 route", data.ending && data.ending.route === expect.route, data.ending && data.ending.route);
    check(label + " 快照编号", data.ending && data.ending.routeIndex === expect.index, data.ending && data.ending.routeIndex);
    check(label + " 快照 companyEnd", data.ending && data.ending.stats && data.ending.stats.companyEnd === expect.companyEnd, data.ending && data.ending.stats && data.ending.stats.companyEnd);
    check(label + " 快照玩家", data.ending && data.ending.fate && data.ending.fate.player === (expect.bad || expect.route === "door_others" ? "dead" : "alive"), data.ending && data.ending.fate && data.ending.fate.player);
    check(label + " 已记录名册", data.ending && data.ending.recorded === true, data.ending && data.ending.recorded);
    await shot("ending-" + slug);
    return data;
  }

  async function caseRoutes() {
    await clearRoster();
    const common = { "had.door": false, "item.door": false, doorOutcome: "none", "fate.player.dead": false, rescues: 0, condition: 3 };
    const withDoor = { "had.door": true, "item.door": true, doorOutcome: "carried" };
    await routeCase("7(1)", "7-1", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, withDoor, { condition: 4 }) }, { label: "7(1)", title: "门板", route: "door_excellent", index: 1, names: 7, companyEnd: 19 });
    await routeCase("7(2)", "7-2", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, { "had.door": true, doorOutcome: "grass", rescues: 1, condition: 3 }) }, { label: "7(2)", title: "门板", route: "door_grass_one", index: 2, names: 7, companyEnd: 19 });
    await routeCase("7(3)", "7-3", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, withDoor, { rescues: 2, condition: 2 }) }, { label: "7(3)", title: "门板", route: "door_carry_two", index: 3, names: 7, companyEnd: 19 });
    await routeCase("7(4)", "7-4", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, { "had.door": true, doorOutcome: "grass", rescues: 2, condition: 2 }) }, { label: "7(4)", title: "门板", route: "door_grass_many", index: 4, names: 7, companyEnd: 19 });
    await routeCase("7(5)", "7-5", { scene: "vn", chapterId: "coda", nodeId: "c011", flags: Object.assign({}, common, { "had.door": true, doorOutcome: "others", rescues: 3, condition: 0, "fate.player.dead": true }) }, { label: "7(5)", title: "空页", route: "door_others", index: 5, names: 8, companyEnd: 18, chapter: "coda" });
    await routeCase("8(1)", "8-1", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, { rescues: 0, condition: 3 }) }, { label: "8(1)", title: "空手", route: "no_door_zero", index: 6, names: 7, companyEnd: 19 });
    await routeCase("8(2)", "8-2", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, { rescues: 1, condition: 3 }) }, { label: "8(2)", title: "空手", route: "no_door_one", index: 7, names: 7, companyEnd: 19 });
    await routeCase("8(3)", "8-3", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, { rescues: 2, condition: 2 }) }, { label: "8(3)", title: "空手", route: "no_door_two", index: 8, names: 7, companyEnd: 19 });
    await routeCase("8(4)", "8-4", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, { rescues: 3, condition: 2 }) }, { label: "8(4)", title: "空手", route: "no_door_three", index: 9, names: 7, companyEnd: 19 });
    await routeCase("8(5)", "8-5", { scene: "vn", chapterId: "wuqi", nodeId: "w041", flags: Object.assign({}, common, { rescues: 3, condition: 4 }) }, { label: "8(5)", title: "空手", route: "no_door_three_excellent", index: 10, names: 7, companyEnd: 19 });
    await routeCase("坏结局", "bad", { scene: "vn", chapterId: "badend", nodeId: "b006", flags: Object.assign({}, common, { rescues: 0, condition: 0, "fate.player.dead": true }) }, { label: "坏结局", title: "没有走出草地", route: "bad_end", index: 11, names: 0, companyEnd: 18, bad: true, chapter: "badend" });

    const roster = await readRoster();
    check("名册保留最近 8 页", roster && roster.version === 1 && roster.pages.length === 8, roster && roster.pages.length);
    check("名册保留 50 行", roster && roster.pages.reduce((sum, page) => sum + page.names.length, 0) === 50, roster && roster.pages.reduce((sum, page) => sum + page.names.length, 0));
    await gotoTitle("?reset=1&debug=1");
    await hit(page.locator('#title-menu [data-action="roster-gallery"]'));
    check("名册回廊打开", await waitVisible("#roster-gallery"));
    check("名册回廊 8 页", (await page.locator("#roster-gallery-pages .xb-roster-page").count()) === 8, await page.locator("#roster-gallery-pages .xb-roster-page").count());
    check("名册回廊 50 行", (await page.locator("#roster-gallery-pages .xb-roster-page__name").count()) === 50, await page.locator("#roster-gallery-pages .xb-roster-page__name").count());
    check("坏结局页写名册没翻到", (await page.locator("#roster-gallery-pages").innerText()).indexOf("名册没有翻到吴起") !== -1);
    await shot("roster-gallery");
    await hit(page.locator("#roster-gallery-close"));
  }

  async function caseCoda() {
    await clearRoster();
    await openAt("coda", "c001", {
      "had.door": true, "item.door": false, doorOutcome: "others",
      rescues: 3, condition: 0, "fate.player.dead": true,
      "fate.feimao.dead": false, "fate.zaowang.dead": false, "fate.dongsheng.dead": false,
      "quality.feimao": 3, "quality.zaowang": 3, "quality.dongsheng": 3
    }, { door: false, items: ["roster", "pencil"] });
    check("空页 c001 标题卡", await waitVisible("#vn-title-card"));
    await hit(page.locator("#vn-title-card"));
    await sleep(300);
    check("空页 c002 满崽没有到吴起", (await page.locator("#vn-text").innerText()).indexOf("满崽没有到吴起") !== -1, await page.locator("#vn-text").innerText());
    await nextLine(); await nextLine(); await nextLine(); await nextLine(); await nextLine();
    check("空页 c006 点名", await waitVisible("#vn-interact"), (await info()).raw);
    await shot("coda-rollcall");
    check("空页点名完成", await handleInteract());
    check("空页 c007 冬生代答", await waitNode("c007"), (await info()).raw);
    await sleep(900);
    check("空页 c007 文本", (await page.locator("#vn-text").innerText()).indexOf("冬生答") !== -1, await page.locator("#vn-text").innerText());
    await nextLine(); await nextLine(); await nextLine();
    if (await visible("#codex")) { await hit(page.locator("#codex-close")); await sleep(250); }
    await nextLine();
    check("空页 c012 到结局", await waitVisible("#scene-ending", 12000), (await info()).raw);
    const data = await endingData();
    check("空页路线行 7(5)", data.route.indexOf("结局7(5)（空页）") === 0, data.route);
    check("空页八名", data.names === 8, data.names);
    check("空页满崽由冬生代答", /满崽[\s\S]*冬生 代答/.test((await page.locator("#ending-panel").innerText()).replace(/\s+/g, " ")));
    check("空页到吴起 18 人", data.stats.indexOf("到吴起 18 人") !== -1, data.stats);
    check("空页牺牲卡", /你把自己，留在了草地尽头/.test(await page.locator("#ending-panel").innerText()));
    check("空页快照 route", data.ending && data.ending.route === "door_others", data.ending && data.ending.route);
    check("空页林先生死", data.ending && data.ending.fate.lin === "dead", data.ending && data.ending.fate.lin);
    await shot("ending-7-5-coda");
  }

  async function caseCrises() {
    await clearRoster();

    await openAt("luding", "l019", { "item.door": true, "had.door": true, "item.medicine": true }, { door: true, items: ["roster", "pencil", "medicine"] });
    check("飞毛腿有板三选", (await choiceCount()) === 3, await choiceCount());
    check("飞毛腿第三项抱板", (await page.locator("#vn-choices .xb-choice").nth(2).innerText()).indexOf("抱着门板先过桥") !== -1);
    await pickChoice(0);
    check("铺桥到 l019a", await waitNode("l019a"), (await info()).raw);
    let s = await readSave();
    check("铺桥门板留在桥上", s && s.flags["item.door"] === false && s.flags.doorOutcome === "bridge" && s.inventory.door === false);
    check("铺桥救一人", s && s.flags.rescues === 1 && s.flags.condition === 3);
    check("铺桥飞毛腿良好", s && s.flags["quality.feimao"] === 3 && s.flags["fate.feimao.dead"] === false);

    await openAt("luding", "l019", { "item.door": true, "had.door": true, "item.medicine": true }, { door: true, items: ["roster", "pencil", "medicine"] });
    await pickChoice(1);
    check("喂药到 l019b", await waitNode("l019b"), (await info()).raw);
    s = await readSave();
    check("喂药耗药", s && s.flags["item.medicine"] === false && s.flags.rescues === 1 && s.flags.condition === 3);
    check("喂药飞毛腿勉强", s && s.flags["quality.feimao"] === 2);
    await nextLine();
    check("喂药后 l019c", await waitNode("l019c"), (await info()).raw);

    await openAt("luding", "l019", { "item.door": true, "had.door": true, "item.medicine": false }, { door: true, items: ["roster", "pencil"] });
    check("飞毛腿无药两项", (await choiceCount()) === 2, await choiceCount());
    await pickChoice(1);
    check("抱板走先到 l019b", await waitNode("l019b"), (await info()).raw);
    check("抱板走到 l019d", await advanceUntil("l019d", 6), (await info()).raw);
    s = await readSave();
    check("抱板走飞毛腿死", s && s.flags["fate.feimao.dead"] === true && s.flags.rescues === 0);

    await openAt("luding", "l019x", { "item.door": false, "had.door": true, "item.medicine": false }, { door: false, items: ["roster", "pencil"] });
    check("无板无药一项", (await choiceCount()) === 1, await choiceCount());
    await pickChoice(0);
    check("无板无药先到 l020", await waitNode("l020"), (await info()).raw);
    check("无板无药到 l019d", await advanceUntil("l019d", 6), (await info()).raw);
    s = await readSave();
    check("无板无药飞毛腿死", s && s.flags["fate.feimao.dead"] === true);

    await openAt("luding", "l019x", { "item.door": false, "had.door": true, "item.medicine": true }, { door: false, items: ["roster", "pencil", "medicine"] });
    check("无板有药两项", (await choiceCount()) === 2, await choiceCount());
    await pickChoice(0);
    check("无板喂药到 l020", await waitNode("l020"), (await info()).raw);
    s = await readSave();
    check("无板喂药耗药", s && s.flags["item.medicine"] === false && s.flags.rescues === 1);
    await nextLine();
    check("无板喂药到 l019c", await waitNode("l019c"), (await info()).raw);

    await openAt("grass", "g018x", { "item.barley": true, "item.homepot": true, "had.door": false }, { door: false, items: ["roster", "pencil", "barley", "homepot"] });
    check("灶王三选", (await choiceCount()) === 3, await choiceCount());
    await pickChoice(0);
    check("灶王青稞到 g019a", await waitNode("g019a"), (await info()).raw);
    s = await readSave();
    check("灶王青稞耗粮", s && s.flags["item.barley"] === false && s.flags.rescues === 1);
    check("灶王青稞勉强", s && s.flags["quality.zaowang"] === 2 && s.flags["fate.zaowang.dead"] === false);

    await openAt("grass", "g018x", { "item.barley": true, "item.homepot": true, "had.door": false }, { door: false, items: ["roster", "pencil", "barley", "homepot"] });
    await pickChoice(1);
    check("灶王铁锅到 g019a", await waitNode("g019a"), (await info()).raw);
    s = await readSave();
    check("灶王铁锅耗锅", s && s.flags["item.homepot"] === false && s.flags.rescues === 1);
    check("灶王铁锅良好", s && s.flags["quality.zaowang"] === 3);

    await openAt("grass", "g018x", { "item.barley": true, "item.homepot": true, "had.door": false }, { door: false, items: ["roster", "pencil", "barley", "homepot"] });
    await pickChoice(2);
    check("灶王不救到 g019", await waitNode("g019"), (await info()).raw);
    s = await readSave();
    check("灶王不救死", s && s.flags["fate.zaowang.dead"] === true && s.flags.rescues === 0);

    await openAt("grass", "g026x", { "item.shoes": true, "item.raincloth": true, "had.door": false }, { door: false, items: ["roster", "pencil", "shoes", "raincloth"] });
    check("冬生三选", (await choiceCount()) === 3, await choiceCount());
    await pickChoice(0);
    check("冬生布鞋到 g026y", await waitNode("g026y"), (await info()).raw);
    s = await readSave();
    check("冬生布鞋耗鞋", s && s.flags["item.shoes"] === false && s.flags.rescues === 1);
    check("冬生布鞋赠青稞", s && s.flags["inventory.giftBarley"] === true && s.inventory.giftBarley === true);
    check("冬生良好", s && s.flags["quality.dongsheng"] === 3);

    await openAt("grass", "g026x", { "item.shoes": true, "item.raincloth": true, "had.door": false }, { door: false, items: ["roster", "pencil", "shoes", "raincloth"] });
    await pickChoice(1);
    check("冬生雨布到 g026y", await waitNode("g026y"), (await info()).raw);
    s = await readSave();
    check("冬生雨布耗雨布", s && s.flags["item.raincloth"] === false && s.flags.rescues === 1);

    await openAt("grass", "g026x", { "item.shoes": true, "item.raincloth": true, "had.door": false }, { door: false, items: ["roster", "pencil", "shoes", "raincloth"] });
    await pickChoice(2);
    check("冬生不救先到 g027", await waitNode("g027", 10000), (await info()).raw);
    await nextLine();
    check("冬生不救到 g028a", await waitNode("g028a", 10000), (await info()).raw);
    s = await readSave();
    check("冬生不救死", s && s.flags["fate.dongsheng.dead"] === true && s.flags.rescues === 0);

    await openAt("grass", "g027", { condition: 2, rescues: 3, "help.used": false, "had.door": false }, { door: false, items: ["roster", "pencil"] });
    await nextLine();
    check("三人帮助到 g028b", await waitNode("g028b", 10000), (await info()).raw);
    s = await readSave();
    check("三人帮助回到勉强", s && s.flags.condition === 2 && s.flags["help.used"] === true && s.flags["memory.help"] === true);

    await openAt("grass", "g027", { condition: 2, rescues: 0, "had.door": false, "item.medicine": true, "item.barley": true }, { door: false, items: ["roster", "pencil", "medicine", "barley"] });
    await nextLine();
    check("差警告面板", await waitVisible("#pack-panel"), (await info()).raw);
    check("差警告文案", (await page.locator("#pack-warning").innerText()).indexOf("你现在是“差”") !== -1);
    check("差警告用双青稞组合", await useRecipe("barley+medicine"));
    check("差警告后能走", await waitNode("g028b", 10000), (await info()).raw);
    s = await readSave();
    check("差警告状态回到勉强", s && s.flags.condition === 2 && s.flags["item.medicine"] === false && s.flags["item.barley"] === false);

    await openAt("grass", "g027", { condition: 2, rescues: 1, "had.door": true, "item.door": true, "item.medicine": true, "item.barley": true }, { door: true, items: ["roster", "pencil", "medicine", "barley"] });
    await nextLine();
    check("门板警告面板", await waitVisible("#pack-panel"), (await info()).raw);
    check("门板警告用双青稞", await useRecipe("barley+medicine"));
    check("门板弹窗", await waitVisible("#door-modal"), (await info()).raw);
    await hit(page.locator("#door-discard"));
    check("舍弃门板到 g028b", await waitNode("g028b", 10000), (await info()).raw);
    s = await readSave();
    check("舍弃门板落草地", s && s.flags.doorOutcome === "grass" && s.flags["item.door"] === false);

    await openAt("grass", "g027", { condition: 1, rescues: 3, "had.door": true, "item.door": true }, { door: true, items: ["roster", "pencil"] });
    await nextLine();
    check("7(5) 到空页 c001", await advanceUntil("c001", 14), (await info()).raw);
    s = await readSave();
    check("7(5) 玩家死", s && s.flags["fate.player.dead"] === true);
    check("7(5) 门板他人带出", s && s.flags.doorOutcome === "others" && s.flags["item.door"] === false);

    await openAt("grass", "g027", { condition: 1, rescues: 0, "had.door": false }, { door: false, items: ["roster", "pencil"] });
    await nextLine();
    check("坏结局到 b001", await advanceUntil("b001", 14), (await info()).raw);
    s = await readSave();
    check("坏结局玩家死", s && s.flags["fate.player.dead"] === true && s.flags["fate.badend"] === true);
  }

  async function casePack() {
    await clearRoster();
    await openAt("prologue", "p024", { "item.door": true, "had.door": true }, { door: true, items: ["roster", "pencil"] });
    check("p024 带板打开", await waitVisible("#vn-multichoice"));
    check("p024 带板五项", (await page.locator("#vn-multi-options .xb-multi-option").count()) === 5);
    check("p024 初始行囊 2/4", (await page.locator("#vn-multi-status").innerText()).indexOf("2/4 格") !== -1, await page.locator("#vn-multi-status").innerText());
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(0));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(1));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(4));
    await sleep(200);
    check("p024 带板可选药粮鞋", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 3, await page.locator("#vn-multi-status").innerText());
    check("p024 带板行囊 4/4", (await page.locator("#vn-multi-status").innerText()).indexOf("4/4 格") !== -1, await page.locator("#vn-multi-status").innerText());
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(3));
    await sleep(160);
    check("p024 带板第四件放不下", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 3 && (await page.locator("#vn-multi-status").innerText()).indexOf("行囊放不下") !== -1, await page.locator("#vn-multi-status").innerText());
    await shot("p024-door-four-units");
    await hit(page.locator("#vn-multi-confirm"));
    check("p024 带板出发前面板", await waitVisible("#pack-panel"), (await info()).raw);
    check("p024 面板行囊 4/4", (await page.locator("#pack-summary").innerText()).indexOf("行囊 4 格 / 4 格") !== -1, await page.locator("#pack-summary").innerText());
    check("p024 面板门板不可用", (await page.locator('#pack-list [data-pack-use="door"]').count()) === 0);
    check("p024 面板药+青稞", await useRecipe("barley+medicine"));
    check("p024 用药到优秀", (await readSave()).flags.condition === 4, (await readSave()).flags.condition);
    await hit(page.locator("#pack-close"));
    check("p024 关面板到 p025", await waitVisible("#vn-result"), (await info()).raw);
    const after = await readSave();
    check("p024 药粮已耗", after && after.flags["item.medicine"] === false && after.flags["item.barley"] === false);
    check("p024 只剩门板布鞋", after && after.inventory.items.indexOf("shoes") !== -1 && after.inventory.items.indexOf("medicine") === -1, JSON.stringify(after && after.inventory.items));

    await openAt("prologue", "p024", { "item.door": false, "had.door": false }, { door: false, items: ["roster", "pencil"] });
    check("p024 无板打开", await waitVisible("#vn-multichoice"));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(0));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(1));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(3));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(4));
    await sleep(200);
    check("p024 无板四件 4/4", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 4 && (await page.locator("#vn-multi-status").innerText()).indexOf("4/4 格") !== -1, await page.locator("#vn-multi-status").innerText());
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(2));
    await sleep(160);
    check("p024 无板第五件放不下", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 4 && (await page.locator("#vn-multi-status").innerText()).indexOf("行囊放不下") !== -1, await page.locator("#vn-multi-status").innerText());
    await hit(page.locator("#vn-multi-confirm"));
    check("p024 无板出发前面板", await waitVisible("#pack-panel"), (await info()).raw);
    await hit(page.locator("#pack-close"));
    check("p024 无板到 p025", await waitVisible("#vn-result"), (await info()).raw);
    const noDoor = await readSave();
    const packIds = ["medicine", "barley", "raincloth", "shoes", "homepot"];
    check("p024 无板四件落档", noDoor && noDoor.inventory.items.filter((id) => packIds.indexOf(id) !== -1).length === 4 && noDoor.flags.load === 8, noDoor && JSON.stringify(noDoor.inventory.items));
  }

  async function caseMigration() {
    await clearRoster();
    await seedRaw(1, {
      scene: "vn", chapterId: "wuqi", nodeId: "w041",
      flags: { strain: 1, "item.door": true, "choice.prologue.door": true, load: 2 },
      inventory: { door: true, items: ["roster", "pencil"] }
    });
    await gotoTitle("?debug=1");
    await sleep(800);
    let s = await readSave();
    check("旧档 v2 已写", s && s.version === 2, s && s.version);
    check("旧档 v1 仍在", !!(await readLegacySave()));
    check("旧档吴起 rescues1", s && s.flags.rescues === 1, s && s.flags.rescues);
    check("旧档吴起 condition2", s && s.flags.condition === 2, s && s.flags.condition);
    check("旧档吴起 had.door", s && s.flags["had.door"] === true);
    check("旧档吴起 quality", s && s.flags["quality.feimao"] === 0 && s.flags["quality.zaowang"] === 0 && s.flags["quality.dongsheng"] === 2, s && [s.flags["quality.feimao"], s.flags["quality.zaowang"], s.flags["quality.dongsheng"]]);
    check("旧档吴起门板在", s && s.flags.doorOutcome === "carried");

    await seedRaw(1, {
      scene: "vn", chapterId: "grass", nodeId: "g028",
      flags: { strain: 0, "item.door": false, "choice.prologue.door": false },
      inventory: { door: false, items: ["roster", "pencil"] }
    });
    await gotoTitle("?debug=1");
    await sleep(800);
    s = await readSave();
    check("旧档草地 condition2", s && s.flags.condition === 2, s && s.flags.condition);
    check("旧档草地未死", s && s.flags["fate.player.dead"] === false);
    check("旧档草地无板", s && s.flags.doorOutcome === "none", s && s.flags.doorOutcome);

    await openAt("coda", "c011", {
      "had.door": true, "item.door": false, doorOutcome: "others",
      rescues: 3, condition: 0, "fate.player.dead": true,
      "quality.feimao": 3, "quality.zaowang": 3, "quality.dongsheng": 3
    }, { door: false, items: ["roster", "pencil"] });
    await nextLine();
    check("旧档空页结局生成", await waitVisible("#scene-ending", 12000), (await info()).raw);
    const snap = await readSave();
    const legacy = JSON.parse(JSON.stringify(snap));
    legacy.version = 1;
    legacy.flags.strain = 3;
    legacy.ending.route = "kongye";
    legacy.ending.routeTitle = "空页";
    legacy.ending.routeLede = "名册上多了一个名字，又划掉了。";
    delete legacy.ending.routeIndex;
    delete legacy.ending.routeLabel;
    delete legacy.ending.condition;
    delete legacy.ending.rescues;
    delete legacy.ending.doorOutcome;
    await page.goto(baseUrl, { waitUntil: "load" });
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [LEGACY_SAVE_KEY, JSON.stringify(legacy)]);
    await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
    await gotoTitle("?debug=1");
    await sleep(900);
    s = await readSave();
    check("旧 ending 补 legacy", s && s.ending && s.ending.route === "legacy", s && s.ending && s.ending.route);
    check("旧 ending 玩家死", s && s.flags["fate.player.dead"] === true);
    check("旧 ending 不重算编号", s && s.ending.routeIndex === 0, s && s.ending.routeIndex);
    check("旧 ending 保留名册", s && s.ending.names.length === 8, s && s.ending.names.length);
  }

  async function caseRefresh() {
    await clearRoster();
    await openAt("grass", "g027", { condition: 2, rescues: 0, "item.shoes": true, "had.door": false }, { door: false, items: ["roster", "pencil", "shoes"] });
    await nextLine();
    check("刷新前警告", await waitVisible("#pack-panel"), (await info()).raw);
    check("刷新前用鞋", await useRecipe("shoes"));
    check("刷新前到 g028b", await waitNode("g028b", 10000), (await info()).raw);
    let s = await readSave();
    check("刷新前状态 2", s && s.flags.condition === 2);
    check("刷新前已结算", s && s.flags["grass.settled"] === true);
    await page.reload({ waitUntil: "load" });
    await sleep(700);
    check("刷新后仍在 g028b", await waitNode("g028b", 8000), (await info()).raw);
    s = await readSave();
    check("刷新后状态不重复扣", s && s.flags.condition === 2, s && s.flags.condition);
    check("刷新后鞋仍消耗", s && s.flags["item.shoes"] === false);
    check("刷新后无警告面板", !(await visible("#pack-panel")));
    await shot("refresh-g027a");
  }

  async function caseMobile() {
    await clearRoster();
    await openAt("prologue", "p024", { "item.door": true, "had.door": true }, { door: true, items: ["roster", "pencil"] });
    check("移动端 p024", await waitVisible("#vn-multichoice"));
    const optionBox = await page.locator("#vn-multi-options .xb-multi-option").first().boundingBox();
    const confirmBox = await page.locator("#vn-multi-confirm").boundingBox();
    check("移动端选项高 ≥44", optionBox && optionBox.height >= 44, optionBox && optionBox.height);
    check("移动端确认高 ≥44", confirmBox && confirmBox.height >= 44, confirmBox && confirmBox.height);
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(0));
    await hit(page.locator("#vn-multi-confirm"));
    check("移动端出发面板", await waitVisible("#pack-panel"), (await info()).raw);
    const closeBox = await page.locator("#pack-close").boundingBox();
    check("移动端面板关闭高 ≥44", closeBox && closeBox.height >= 44, closeBox && closeBox.height);
    await shot("mobile-pack");
    await hit(page.locator("#pack-close"));
    await sleep(300);
    await openAt("luding", "l019", { "item.door": true, "had.door": true, "item.medicine": true }, { door: true, items: ["roster", "pencil", "medicine"] });
    check("移动端 l019", await waitVisible("#vn-choices"));
    const choiceBox = await page.locator("#vn-choices .xb-choice").first().boundingBox();
    check("移动端选项高 ≥44", choiceBox && choiceBox.height >= 44, choiceBox && choiceBox.height);
    await shot("mobile-l019");
  }

  async function caseFlow() {
    await clearRoster();
    await gotoTitle("?reset=1&debug=1");
    await hit(page.locator('#title-menu [data-action="start"]'));
    const started = Date.now();
    let ended = false;
    let guard = 0;
    while (Date.now() - started < 260000 && !ended && guard < 900) {
      guard += 1;
      if (guard % 25 === 0) log("FLOW-STEP " + guard + " " + JSON.stringify(await info()));
      if (await visible("#scene-ending")) { ended = true; break; }
      if (await visible("#vn-title-card")) { await hit(page.locator("#vn-title-card")); await sleep(220); continue; }
      if (await visible("#codex")) { await hit(page.locator("#codex-close")); await sleep(220); continue; }
      if (await visible("#pack-panel")) {
        const warning = await visible("#pack-warning");
        const use = page.locator('#pack-list [data-action="pack-use"]:not([disabled])').first();
        if (await use.count()) { await hit(use); await sleep(420); }
        else if (warning) { await hit(page.locator("#pack-continue")); await sleep(300); }
        else { await hit(page.locator("#pack-close")); await sleep(300); }
        continue;
      }
      if (await visible("#door-modal")) { await hit(page.locator("#door-discard")); await sleep(300); continue; }
      if (await visible("#vn-result")) { await hit(page.locator("#vn-result button")); await sleep(260); continue; }
      if (await visible("#vn-choices")) {
        await pickChoice(0);
        continue;
      }
      if (await visible("#vn-multichoice")) {
        const options = page.locator("#vn-multi-options .xb-multi-option");
        const count = await options.count();
        for (let i = 0; i < Math.min(count, 4); i += 1) {
          if (!(await page.locator("#vn-multi-confirm").isDisabled())) break;
          await hit(options.nth(i));
          await sleep(120);
        }
        if (await page.locator("#vn-multi-confirm").isDisabled()) {
          for (let i = 0; i < count; i += 1) {
            await hit(options.nth(i));
            await sleep(120);
          }
        }
        await hit(page.locator("#vn-multi-confirm"));
        await sleep(350);
        continue;
      }
      if (await visible("#vn-interact")) { await handleInteract(); continue; }
      if (await visible("#vn-dialogue")) { await nextLine(); continue; }
      await sleep(150);
    }
    if (!ended) ended = await waitVisible("#scene-ending", 8000);
    const seconds = Math.round((Date.now() - started) / 1000);
    check("完整流程到结局", ended, (await info()).raw);
    check("完整流程 ≤ 20 分钟", seconds <= 1200, seconds);
    const data = await endingData();
    check("完整流程路线行", /^(结局[78]\([1-5]\)（|坏结局 · )/.test(data.route), data.route);
    check("完整流程五卡", data.cards === 5, data.cards);
    check("完整流程名册", [0, 7, 8].indexOf(data.names) !== -1, data.names);
    check("完整流程快照", data.ending && data.ending.recorded === true, data.ending && data.ending.recorded);
    await shot("flow-ending");
    log("FLOW seconds=" + seconds + " line=" + guard + " route=" + data.route + " names=" + data.names);
  }

  try {
    const mode = args.case;
    if (mode === "routes" || mode === "all") await caseRoutes();
    if (mode === "coda" || mode === "all") await caseCoda();
    if (mode === "crises" || mode === "all") await caseCrises();
    if (mode === "pack" || mode === "all") await casePack();
    if (mode === "migration" || mode === "all") await caseMigration();
    if (mode === "refresh" || mode === "all") await caseRefresh();
    if (mode === "mobile" || mode === "all" || args.mobile) await caseMobile();
    if (mode === "flow" || mode === "all") await caseFlow();

    check("minigames.js 已不存在", !fs.existsSync(path.join(PROJECT, "minigames.js")));
    check("控制台 0 error", logs.consoleErrors.length === 0, logs.consoleErrors.join(" | "));
    check("页面 0 pageerror", logs.pageErrors.length === 0, logs.pageErrors.join(" | "));
    check("0 失败请求", logs.requestFailed.length === 0, logs.requestFailed.join(" | "));
    check("0 HTTP 错误", logs.httpErrors.length === 0, logs.httpErrors.join(" | "));
    check("0 外部请求", logs.external.length === 0, logs.external.join(" | "));
  } catch (error) {
    result.error = String(error && error.stack || error);
    check("测试执行无异常", false, result.error.split("\n")[0]);
    log("ERROR " + result.error);
    await shot("error").catch(() => {});
  }

  result.logs = logs;
  result.endedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  await browser.close();
  if (serverInfo) serverInfo.server.close();
  const failed = checks.filter((item) => !item.ok);
  log("SUMMARY " + (checks.length - failed.length) + "/" + checks.length + " passed; failed=" + failed.length);
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(2);
});
