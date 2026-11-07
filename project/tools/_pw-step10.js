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
const SAVE_KEY = "xiangbei.save.v1";
const ROSTER_KEY = "xiangbei.roster.v1";
const CHAPTERS = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];

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
  const runId = "step10-" + args.url + "-" + (args.mobile ? "mobile-" : "") + args.case + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-10", runId));
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
  async function seed(partial) {
    await page.goto(baseUrl, { waitUntil: "load" });
    const state = Object.assign({
      version: 1, scene: "title", chapterId: "prologue", nodeId: null,
      flags: {}, inventory: { door: false, items: [] }, choices: [], codex: [],
      settings: {}, unlockedChapters: CHAPTERS.slice(), ending: null
    }, partial || {});
    state.inventory = Object.assign({ door: !!state.flags["item.door"], items: [] }, partial && partial.inventory || {});
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
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

  async function caseCrises() {
    // 泸定：有门板三选，铺桥 / 喂药 / 抱板走。
    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, load: 2, "item.medicine": true }, inventory: { door: true, items: ["roster", "pencil", "medicine"] } });
    await gotoTitle("?debug=1");
    check("l019 有板三项", await choiceCount() === 3, await choiceCount());
    check("l019 第三项是抱板走", /抱着门板先过桥/.test(await page.locator("#vn-choices").innerText()));
    await shot("l019-three");
    await pickChoice(0);
    check("l019 铺桥进入 l019a", await waitNode("l019a"));
    const bridge = await readSave();
    check("铺桥：门板放下", bridge && bridge.flags["item.door"] === false && bridge.inventory.door === false);
    check("铺桥：strain 1 且飞毛腿活", bridge && bridge.flags.strain === 1 && bridge.flags["fate.feimao.dead"] === false);
    check("铺桥：桥板记忆", bridge && bridge.flags["memory.fly_bridge"] === true);

    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, load: 2, "item.medicine": true }, inventory: { door: true, items: ["roster", "pencil", "medicine"] } });
    await gotoTitle("?debug=1");
    await pickChoice(1);
    check("l019 喂药后门板仍在背上", await waitNode("l019b"));
    await nextLine();
    check("l019 喂药进入 l019c", await waitNode("l019c"));
    const med = await readSave();
    check("喂药：药已用掉", med && med.flags["item.medicine"] === false);
    check("喂药：strain 1 且飞毛腿活", med && med.flags.strain === 1 && med.flags["fate.feimao.dead"] === false);
    check("喂药：药记忆", med && med.flags["memory.fly_medicine"] === true);
    await shot("l019c-medicine");

    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, load: 2, "item.medicine": false }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    check("l019 无药两项", await choiceCount() === 2, await choiceCount());
    await pickChoice(1);
    check("l019 抱板走后门板仍在背上", await waitNode("l019b"));
    await nextLine(); await nextLine(); await nextLine();
    check("l019 抱板走进入 l019d", await waitNode("l019d"));
    const leave = await readSave();
    check("抱板走：飞毛腿死", leave && leave.flags["fate.feimao.dead"] === true);
    check("抱板走：strain 0", leave && leave.flags.strain === 0);

    // 泸定：无门板两选，有药才能喂。
    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019x", flags: { "item.door": false, "item.medicine": false }, inventory: { door: false, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    check("l019x 无药仅一项", await choiceCount() === 1, await choiceCount());
    check("l019x 缺药不显示喂药", !/喂药/.test(await page.locator("#vn-choices").innerText()));
    await pickChoice(0);
    check("l019x 继续走过桥", await waitNode("l020"));
    await nextLine(); await nextLine(); await nextLine();
    check("l019x 继续走进入 l019d", await waitNode("l019d"));
    const lx = await readSave();
    check("l019x 继续走：飞毛腿死", lx && lx.flags["fate.feimao.dead"] === true);

    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019x", flags: { "item.door": false, "item.medicine": true }, inventory: { door: false, items: ["roster", "pencil", "medicine"] } });
    await gotoTitle("?debug=1");
    check("l019x 有药两项", await choiceCount() === 2, await choiceCount());
    await pickChoice(0);
    check("l019x 喂药后到桥头", await waitNode("l020"));
    await nextLine();
    check("l019x 喂药进入 l019c", await waitNode("l019c"));
    const lxm = await readSave();
    check("l019x 喂药：strain 1 且活", lxm && lxm.flags.strain === 1 && lxm.flags["fate.feimao.dead"] === false);

    // 草地灶王：四选。
    const zaowangSeed = { scene: "vn", chapterId: "grass", nodeId: "g018x", flags: { "item.barley": true, "item.homepot": true, "item.door": false, fire: 20 }, inventory: { door: false, items: ["roster", "pencil", "barley", "pot"] } };
    await seed(zaowangSeed);
    await gotoTitle("?debug=1");
    check("g018x 四项", await choiceCount() === 4, await choiceCount());
    check("g018x 第四项是不救", /不救/.test(await page.locator("#vn-choices .xb-choice").nth(3).innerText()));
    await shot("g018x-four");
    await pickChoice(0);
    check("灶王青稞救活进 g019a", await waitNode("g019a"));
    const zA = await readSave();
    check("灶王青稞：粮用掉", zA && zA.flags["item.barley"] === false);
    check("灶王青稞：strain 1 且活", zA && zA.flags.strain === 1 && zA.flags["fate.zaowang.dead"] === false);
    check("灶王青稞：记忆", zA && zA.flags["memory.zaowang_barley"] === true);

    await seed(zaowangSeed);
    await gotoTitle("?debug=1");
    await pickChoice(1);
    check("灶王铁锅救活进 g019a", await waitNode("g019a"));
    const zB = await readSave();
    check("灶王铁锅：锅用掉", zB && zB.flags["item.homepot"] === false);
    check("灶王铁锅：记忆", zB && zB.flags["memory.zaowang_pot"] === true);

    await seed({ scene: "vn", chapterId: "grass", nodeId: "g018x", flags: { "item.door": false, fire: 20 }, inventory: { door: false, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    check("灶王无粮无锅仍有替蹲风口", await choiceCount() === 2, await choiceCount());
    await pickChoice(0);
    check("灶王替蹲风口进 g019a", await waitNode("g019a"));
    const zC = await readSave();
    check("灶王替蹲风口：火 -10", zC && zC.flags.fire === 10);
    check("灶王替蹲风口：strain 1 且活", zC && zC.flags.strain === 1 && zC.flags["fate.zaowang.dead"] === false);

    await seed(zaowangSeed);
    await gotoTitle("?debug=1");
    await pickChoice(3);
    check("灶王不救进 g019", await waitNode("g019"));
    const zD = await readSave();
    check("灶王不救：死亡", zD && zD.flags["fate.zaowang.dead"] === true);
    check("灶王不救：strain 0", zD && zD.flags.strain === 0);
    await shot("g019-dead");

    // 草地冬生：四选。
    const dongshengSeed = { scene: "vn", chapterId: "grass", nodeId: "g026x", flags: { "item.shoes": true, "item.raincloth": true, "item.door": false, fire: 20 }, inventory: { door: false, items: ["roster", "pencil", "shoes", "raincloth"] } };
    await seed(dongshengSeed);
    await gotoTitle("?debug=1");
    check("g026x 四项", await choiceCount() === 4, await choiceCount());
    await pickChoice(0);
    check("冬生布鞋后到 g027", await waitNode("g027"));
    await nextLine();
    check("冬生布鞋救活进 g028b", await waitNode("g028b"));
    const dA = await readSave();
    check("冬生布鞋：鞋用掉", dA && dA.flags["item.shoes"] === false);
    check("冬生布鞋：strain 1 且活", dA && dA.flags.strain === 1 && dA.flags["fate.dongsheng.dead"] === false);
    check("冬生布鞋：记忆", dA && dA.flags["memory.dongsheng_shoes"] === true);

    await seed(dongshengSeed);
    await gotoTitle("?debug=1");
    await pickChoice(1);
    check("冬生雨布后到 g027", await waitNode("g027"));
    await nextLine();
    check("冬生雨布救活进 g028b", await waitNode("g028b"));
    const dB = await readSave();
    check("冬生雨布：雨布用掉", dB && dB.flags["item.raincloth"] === false);
    check("冬生雨布：记忆", dB && dB.flags["memory.dongsheng_cloth"] === true);

    await seed({ scene: "vn", chapterId: "grass", nodeId: "g026x", flags: { "item.door": false, fire: 20 }, inventory: { door: false, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    await pickChoice(0);
    check("冬生背他走后到 g027", await waitNode("g027"));
    await nextLine();
    check("冬生背他走进 g028b", await waitNode("g028b"));
    const dC = await readSave();
    check("冬生背他走：火 -10", dC && dC.flags.fire === 10);
    check("冬生背他走：strain 1 且活", dC && dC.flags.strain === 1 && dC.flags["fate.dongsheng.dead"] === false);

    await seed(dongshengSeed);
    await gotoTitle("?debug=1");
    await pickChoice(3);
    check("冬生不救后到 g027", await waitNode("g027"));
    await nextLine();
    check("冬生不救进 g028a", await waitNode("g028a"));
    const dD = await readSave();
    check("冬生不救：死亡", dD && dD.flags["fate.dongsheng.dead"] === true);
    check("冬生不救：strain 0", dD && dD.flags.strain === 0);

    // 草地倒下段落：strain 3 从 g028 走到 coda。
    await seed({ scene: "vn", chapterId: "grass", nodeId: "g028", flags: { strain: 3, "fate.feimao.dead": false, "fate.zaowang.dead": false, "fate.dongsheng.dead": false }, inventory: { door: false, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    await nextLine();
    check("倒下段进入 g028d", await waitNode("g028d"));
    await nextLine(); await nextLine(); await nextLine();
    await nextLine();
    check("倒下后跳过 g029 到史实注", await visible("#codex") || (await info()).node === "g030", (await info()).raw);
    if (await visible("#codex")) { await hit(page.locator("#codex-close")); await sleep(400); }
    check("倒下段进入隐藏章 coda", await waitVisible("#vn-title-card") && (await info()).node === "c001", (await info()).raw);
  }

  async function reachEndingFromW041() {
    if (await waitVisible("#codex", 3000)) {
      await hit(page.locator("#codex-close"));
      await sleep(250);
    }
    for (let i = 0; i < 10; i += 1) {
      if (await visible("#scene-ending")) return true;
      if (await closeCodexIfOpen()) continue;
      if (await visible("#vn-dialogue")) { await nextLine(); continue; }
      await sleep(150);
    }
    return visible("#scene-ending");
  }

  async function routeCase(label, flags, expect) {
    await seed({ scene: "vn", chapterId: "wuqi", nodeId: "w041", flags, inventory: { door: flags["item.door"] === true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    const reached = await reachEndingFromW041();
    check(label + " 到结局", reached, (await info()).raw);
    if (!reached) return;
    const title = (await page.locator("#ending-route").innerText()).trim();
    const names = await page.locator("#ending-names .xb-ending__name").count();
    const cards = await page.locator("#ending-cards .xb-ending__card").count();
    const text = (await page.locator("#ending-panel").innerText()).replace(/\s+/g, " ");
    const save = await readSave();
    check(label + " 路线行", title.indexOf(expect.title) === 0, title);
    check(label + " 名册人数", names === expect.names, names);
    check(label + " 五卡", cards === 5, cards);
    check(label + " 全连到吴起", text.indexOf("到吴起 " + expect.companyEnd + " 人") !== -1, text.slice(0, 260));
    check(label + " 快照路线", save && save.ending && save.ending.route === expect.route, save && save.ending && save.ending.route);
    check(label + " 快照 strain", save && save.ending && save.ending.strain === expect.strain, save && save.ending && save.ending.strain);
    check(label + " 快照人物", save && save.ending && save.ending.fate && save.ending.fate.lin === expect.lin, JSON.stringify(save && save.ending && save.ending.fate));
    if (expect.sacrifice) check(label + " 牺牲卡空页文案", /你把自己，留在了草地尽头/.test(text), text.slice(0, 400));
    await shot(label);
  }

  async function caseRoutes() {
    await clearRoster();
    await routeCase("sidao", { "item.door": true, "had.door": true, strain: 0, "fate.feimao.dead": true, "fate.zaowang.dead": true, "fate.dongsheng.dead": true }, { title: "四道划痕", route: "sidao", names: 7, companyEnd: 19, strain: 0, lin: "alive" });
    await routeCase("menban", { "item.door": true, "had.door": true, strain: 1, "fate.feimao.dead": true, "fate.zaowang.dead": true, "fate.dongsheng.dead": false }, { title: "门板", route: "menban", names: 7, companyEnd: 19, strain: 1, lin: "alive" });
    await routeCase("qiaoban-bridge", { "item.door": false, "had.door": true, strain: 2, "fate.feimao.dead": true, "fate.zaowang.dead": false, "fate.dongsheng.dead": false }, { title: "桥板", route: "qiaoban", names: 7, companyEnd: 19, strain: 2, lin: "dead" });
    await routeCase("qiaoban-wall", { "item.door": false, "had.door": false, strain: 1, "fate.feimao.dead": false, "fate.zaowang.dead": false, "fate.dongsheng.dead": false }, { title: "石墙", route: "qiaoban", names: 7, companyEnd: 19, strain: 1, lin: "alive" });

    const roster = await readRoster();
    check("名册回廊累计四页", roster && roster.version === 1 && roster.pages.length === 4, roster && roster.pages.length);
    await gotoTitle("?reset=1&debug=1");
    await hit(page.locator('#title-menu [data-action="roster-gallery"]'));
    check("名册回廊打开", await waitVisible("#roster-gallery"));
    const pages = await page.locator("#roster-gallery-pages .xb-roster-page").count();
    const galleryText = (await page.locator("#roster-gallery").innerText()).replace(/\s+/g, " ");
    check("名册回廊四页", pages === 4, pages);
    check("名册回廊四路线标题", ["四道划痕", "门板", "桥板", "石墙"].every((t) => galleryText.indexOf(t) !== -1), galleryText.slice(0, 300));
    // 普通路线一页 7 个名字，空页 8 个；"每页八行"是上限，不是固定行数。
    check("名册回廊四页二十八行", (await page.locator("#roster-gallery-pages .xb-roster-page__name").count()) === 28, await page.locator("#roster-gallery-pages .xb-roster-page__name").count());
    await shot("roster-gallery");
    await hit(page.locator("#roster-gallery-close"));
    check("名册回廊关闭", !(await visible("#roster-gallery")));
  }

  async function caseCoda() {
    await clearRoster();
    await seed({ scene: "vn", chapterId: "coda", nodeId: "c001", flags: { strain: 3, "item.door": false, "had.door": true, "fate.feimao.dead": false, "fate.zaowang.dead": false, "fate.dongsheng.dead": false }, inventory: { door: false, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    check("空页 c001 标题卡", await waitVisible("#vn-title-card"));
    await hit(page.locator("#vn-title-card"));
    await sleep(300);
    check("空页 c002 满崽没有到吴起", (await page.locator("#vn-text").innerText()).indexOf("满崽没有到吴起") !== -1, await page.locator("#vn-text").innerText());
    await nextLine(); await nextLine(); await nextLine(); await nextLine();
    check("空页 c006 点名", await waitVisible("#vn-interact"), (await info()).raw);
    await shot("coda-rollcall");
    check("空页点名完成", await handleInteract());
    check("空页 c007 冬生代答", await waitNode("c007"), (await info()).raw);
    await nextLine(); await nextLine(); await nextLine();
    // 关闭 c010 史实注时 onClose 已推进到 c011，只需要再点一次进 c012；c012 是 end，会直接结算。
    if (await visible("#codex")) { await hit(page.locator("#codex-close")); await sleep(250); }
    await nextLine();
    check("空页到结局", await waitVisible("#scene-ending", 10000), (await info()).raw);
    const title = (await page.locator("#ending-route").innerText()).trim();
    const names = await page.locator("#ending-names .xb-ending__name").count();
    const text = (await page.locator("#ending-panel").innerText()).replace(/\s+/g, " ");
    const save = await readSave();
    check("空页路线行", title.indexOf("空页") === 0, title);
    check("空页八名", names === 8, names);
    check("空页满崽由冬生代答", /满崽[\s\S]*冬生 代答/.test(text), text.slice(0, 500));
    check("空页全连十八人", text.indexOf("到吴起 18 人") !== -1, text.slice(0, 260));
    check("空页牺牲卡文案", /你把自己，留在了草地尽头/.test(text));
    check("空页快照 strain 3", save && save.ending && save.ending.strain === 3);
    check("空页快照 route kongye", save && save.ending && save.ending.route === "kongye");
    await shot("kongye-ending");
  }

  async function caseMigration() {
    await seed({ scene: "vn", chapterId: "wuqi", nodeId: "w022", flags: { "item.door": true, "choice.prologue.door": true, load: 2 }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    await sleep(700);
    const toast = await page.locator("#toast").innerText().catch(() => "");
    check("吴起旧档迁移提示", /旧存档已按原路线补记人物命运/.test(toast), toast);
    const w = await readSave();
    check("吴起旧档：飞毛腿/灶王死", w && w.flags["fate.feimao.dead"] === true && w.flags["fate.zaowang.dead"] === true);
    check("吴起旧档：冬生活", w && w.flags["fate.dongsheng.dead"] === false);
    check("吴起旧档：strain 1", w && w.flags.strain === 1);
    check("吴起旧档：had.door", w && w.flags["had.door"] === true);

    await seed({ scene: "vn", chapterId: "luding", nodeId: "l022", flags: { "item.door": true, "choice.prologue.door": true, load: 2 }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    await sleep(700);
    const l = await readSave();
    check("泸定旧档：飞毛腿死", l && l.flags["fate.feimao.dead"] === true);
    check("泸定旧档：strain 0", l && l.flags.strain === 0);
    check("泸定旧档：had.door", l && l.flags["had.door"] === true);

    await seed({ scene: "vn", chapterId: "grass", nodeId: "g019", flags: { "item.door": true, "choice.prologue.door": true, load: 2 }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    await sleep(700);
    const g = await readSave();
    check("草地旧档：灶王死", g && g.flags["fate.zaowang.dead"] === true);
    check("草地旧档：飞毛腿死", g && g.flags["fate.feimao.dead"] === true);
    check("草地旧档：strain 0", g && g.flags.strain === 0);
  }

  async function caseMaxWhen() {
    await seed({ scene: "vn", chapterId: "prologue", nodeId: "p024", flags: { "item.door": true }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    check("p024 带板打开", await waitVisible("#vn-multichoice"));
    check("p024 带板五项", (await page.locator("#vn-multi-options .xb-multi-option").count()) === 5);
    const status = await page.locator("#vn-multi-status").innerText();
    check("p024 带板上限 1", /最多 1 样/.test(status), status);
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(0));
    await sleep(120);
    check("p024 带板选一件", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 1);
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(1));
    await sleep(120);
    check("p024 带板第二件被挡", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 1);
    check("p024 带板可确认", !(await page.locator("#vn-multi-confirm").isDisabled()));
    await shot("p024-door-max1");
    await hit(page.locator("#vn-multi-confirm"));
    check("p024 带板结算", await waitVisible("#vn-result"));
    check("p024 带板行囊 3/3 格", /行囊 3\/3 格/.test(await page.locator("#vn-result").innerText()));

    await seed({ scene: "vn", chapterId: "prologue", nodeId: "p024", flags: { "item.door": false }, inventory: { door: false, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    await waitVisible("#vn-multichoice");
    check("p024 无板上限 3", /最多 3 样/.test(await page.locator("#vn-multi-status").innerText()));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(0));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(1));
    await hit(page.locator("#vn-multi-options .xb-multi-option").nth(2));
    await sleep(120);
    check("p024 无板选三件", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 3);
    await hit(page.locator("#vn-multi-confirm"));
    check("p024 无板结算", await waitVisible("#vn-result"));
    check("p024 无板行囊 3/3 格", /行囊 3\/3 格/.test(await page.locator("#vn-result").innerText()));
    await shot("p024-no-door-three");
  }

  async function caseTimeoutRefresh() {
    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, load: 2, "item.medicine": false }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    check("超时前 l019 两项", await choiceCount() === 2, await choiceCount());
    await sleep(13600);
    check("超时按默认 C 进 l019b", await waitNode("l019b"));
    const timed = await readSave();
    const lastChoice = timed && timed.choices[timed.choices.length - 1];
    check("超时记录 timedOut", lastChoice && lastChoice.timedOut === true, JSON.stringify(lastChoice));
    check("超时抱板走：飞毛腿死", timed && timed.flags["fate.feimao.dead"] === true);
    await shot("l019-timeout");

    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, load: 2, "item.medicine": true }, inventory: { door: true, items: ["roster", "pencil", "medicine"] } });
    await gotoTitle("?debug=1");
    await pickChoice(0);
    check("刷新前已到 l019a", await waitNode("l019a"));
    await page.reload({ waitUntil: "load" });
    await sleep(500);
    check("刷新后回到 l019a", await waitNode("l019a"));
    const afterReload = await readSave();
    check("刷新后门板仍放下", afterReload && afterReload.flags["item.door"] === false && afterReload.inventory.door === false);
    check("刷新后 strain 仍为 1", afterReload && afterReload.flags.strain === 1);
  }

  async function caseFlow() {
    const started = Date.now();
    const pace = Math.max(55, Number(args.pace) || 55);
    await gotoTitle("?reset=1&debug=1");
    await hit(page.locator('#title-menu [data-action="start"]'));
    await sleep(400);
    let chapter = "prologue";
    let lines = 0;
    let multis = 0;
    let choices = 0;
    let iteration = 0;
    const deadline = Date.now() + 9 * 60 * 1000;
    while (Date.now() < deadline) {
      iteration += 1;
      if (iteration % 40 === 0) {
        const d = await info();
        log("FLOW step=" + iteration + " chapter=" + chapter + " node=" + d.node + " type=" + d.type + " lines=" + lines);
      }
      if (await visible("#scene-ending")) {
        await sleep(800);
        const cards = await page.locator("#ending-cards .xb-ending__card").count();
        const names = await page.locator("#ending-names .xb-ending__name").count();
        const route = (await page.locator("#ending-route").innerText()).trim();
        const text = (await page.locator("#ending-panel").innerText()).replace(/\s+/g, " ");
        await shot("flow-ending");
        return { ok: true, ms: Date.now() - started, lines, multis, choices, cards, names, route, text: text.slice(0, 900) };
      }
      if (await visible("#scene-map")) {
        const idx = CHAPTERS.indexOf(chapter);
        const next = CHAPTERS[idx + 1];
        if (!next) throw new Error("地图已到最后一章但没有 ending：" + chapter);
        const station = page.locator('.map-station[data-chapter="' + next + '"]');
        await station.waitFor({ state: "visible", timeout: 8000 });
        await hit(station);
        await sleep(350);
        chapter = next;
        continue;
      }
      if (await visible("#vn-title-card")) { await hit(page.locator("#vn-title-card")); await sleep(140); continue; }
      if (await visible("#codex")) { await hit(page.locator("#codex-close")); await sleep(140); continue; }
      if (await visible("#vn-result")) { await hit(page.locator(".vn-result__more")); await sleep(180); continue; }
      if (await visible("#vn-choices")) { await hit(page.locator("#vn-choices .xb-choice").first()); choices += 1; await sleep(450); continue; }
      if (await visible("#vn-multichoice")) {
        // 序章行囊 min 0、湘江弃物 min 3：逐件点到“确认”可用为止，不写死件数。
        const confirm = page.locator("#vn-multi-confirm");
        const optionCount = await page.locator("#vn-multi-options .xb-multi-option").count();
        for (let i = 0; i < optionCount; i += 1) {
          if (await confirm.isEnabled()) break;
          await hit(page.locator("#vn-multi-options .xb-multi-option").nth(i));
          await sleep(80);
        }
        await hit(confirm);
        await sleep(400);
        multis += 1;
        continue;
      }
      if (await visible("#vn-interact")) { await handleInteract(); continue; }
      const d = await info();
      chapter = d.chapter || chapter;
      if (!(await visible("#vn-dialogue"))) { await sleep(160); continue; }
      await hit(page.locator("#vn-dialogue"), args.mobile ? undefined : { position: { x: 420, y: 120 } });
      lines += 1;
      await sleep(pace);
    }
    throw new Error("完整流程超时，停在 " + JSON.stringify(await info()));
  }

  async function caseMobile() {
    await seed({ scene: "vn", chapterId: "prologue", nodeId: "p024", flags: { "item.door": true }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    await waitVisible("#vn-multichoice");
    const metrics = await page.evaluate(() => {
      const stage = document.getElementById("stage").getBoundingClientRect();
      const option = document.querySelector(".xb-multi-option").getBoundingClientRect();
      const confirm = document.getElementById("vn-multi-confirm").getBoundingClientRect();
      return { stage: { w: stage.width, h: stage.height }, option: { w: option.width, h: option.height }, confirm: { w: confirm.width, h: confirm.height } };
    });
    check("844×390 舞台入界", metrics.stage.w <= 844 && metrics.stage.h <= 390, JSON.stringify(metrics.stage));
    check("844×390 选项热区 ≥44px", metrics.option.h >= 44, JSON.stringify(metrics.option));
    check("844×390 确认热区 ≥44px", metrics.confirm.h >= 44, JSON.stringify(metrics.confirm));
    check("844×390 带板上限 1", /最多 1 样/.test(await page.locator("#vn-multi-status").innerText()));
    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, "item.medicine": true, load: 2 }, inventory: { door: true, items: ["roster", "pencil", "medicine"] } });
    await gotoTitle("?debug=1");
    check("844×390 泸定三项", await choiceCount() === 3);
    const choiceBox = await page.locator("#vn-choices .xb-choice").first().boundingBox();
    check("844×390 危机选项热区 ≥44px", choiceBox && choiceBox.height >= 44, JSON.stringify(choiceBox));
    await shot("mobile-l019");
  }

  try {
    const mode = args.case;
    let flow = null;
    if (mode === "crises" || mode === "all") await caseCrises();
    if (mode === "routes" || mode === "all") await caseRoutes();
    if (mode === "coda" || mode === "all") await caseCoda();
    if (mode === "migration" || mode === "all") await caseMigration();
    if (mode === "maxwhen" || mode === "all") await caseMaxWhen();
    if (mode === "timeout" || mode === "all") await caseTimeoutRefresh();
    if (mode === "mobile" || mode === "all" || args.mobile) await caseMobile();
    if (mode === "flow" || mode === "all") flow = await caseFlow();

    check("minigames.js 已不存在", !fs.existsSync(path.join(PROJECT, "minigames.js")));
    check("控制台 0 error", logs.consoleErrors.length === 0, logs.consoleErrors.join(" | "));
    check("页面 0 pageerror", logs.pageErrors.length === 0, logs.pageErrors.join(" | "));
    check("0 失败请求", logs.requestFailed.length === 0, logs.requestFailed.join(" | "));
    check("0 HTTP 错误", logs.httpErrors.length === 0, logs.httpErrors.join(" | "));
    check("0 外部请求", logs.external.length === 0, logs.external.join(" | "));

    if (flow) {
      result.flow = flow;
      check("完整流程到结局", flow.ok);
      check("完整流程出现多选/单选", flow.multis >= 2 && flow.choices >= 3, "multis=" + flow.multis + " choices=" + flow.choices);
      check("完整流程结局五卡", flow.cards === 5, flow.cards);
      check("完整流程结局七或八名", flow.names === 7 || flow.names === 8, flow.names);
      check("完整流程有路线行", /四道划痕|门板|桥板|石墙|空页/.test(flow.route), flow.route);
      check("完整流程 ≤20 分钟", flow.ms <= 20 * 60 * 1000, Math.round(flow.ms / 1000) + "s");
      result.durationSec = Math.round(flow.ms / 1000);
    }
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
