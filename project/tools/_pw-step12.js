#!/usr/bin/env node
"use strict";

// 步骤十二：剧情分支收纳。空态、暂停实时态、结算落档、标题历史、移动端热区、键盘与坏档降级。
// 用法：node project/tools/_pw-step12.js --url=http --case=all --out=docs/evidence/step-12

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVE_KEY = "xiangbei.save.v2";
const BRANCH_KEY = "xiangbei.branches.v1";
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
  const runId = "step12-" + args.url + "-" + (args.mobile ? "mobile-" : "") + args.case + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-12", runId));
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
  async function goto(query) {
    await page.goto(baseUrl + (query || "?debug=1"), { waitUntil: "load" });
    await page.waitForSelector("#stage", { state: "attached", timeout: 10000 });
    await sleep(400);
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
    log("shot " + path.relative(ROOT, file).replace(/\\/g, "/"));
    return file;
  }
  function hit(locator, options) {
    return args.mobile ? locator.tap(options) : locator.click(options);
  }
  async function clearStorage() {
    await goto("");
    await page.evaluate(([save, branch]) => {
      localStorage.removeItem(save);
      localStorage.removeItem(branch);
      localStorage.removeItem(branch + ".bad");
    }, [SAVE_KEY, BRANCH_KEY]);
  }
  const BASE_FLAGS = {
    "item.door": false, "item.medicine": false, "item.barley": false, "item.homepot": false,
    "item.raincloth": false, "item.shoes": false, "item.pot": false,
    load: 0, trust: 0, fire: 50, condition: 3, rescues: 0,
    "help.used": false, "memory.help": false,
    "had.door": false, doorOutcome: "none",
    "fate.feimao.dead": false, "fate.zaowang.dead": false, "fate.dongsheng.dead": false,
    "fate.lin.dead": false, "fate.player.dead": false, "grass.settled": false,
    "quality.feimao": 2, "quality.zaowang": 2, "quality.dongsheng": 2,
    "inventory.giftBarley": false, strain: 3
  };
  async function seedSave(partial) {
    const state = Object.assign({
      version: 2, scene: "vn", chapterId: "prologue", nodeId: "p001",
      flags: {}, inventory: { door: false, items: ["roster", "pencil"] }, choices: [], codex: [],
      settings: {}, unlockedChapters: CHAPTERS.slice(), ending: null
    }, partial || {});
    state.version = 2;
    state.flags = Object.assign({}, BASE_FLAGS, (partial && partial.flags) || {});
    if (state.flags["item.door"] === true) state.flags["had.door"] = true;
    if (state.flags.condition === 0) state.flags["fate.player.dead"] = true;
    state.flags.strain = 3 - (Number(state.flags.rescues) || 0);
    state.inventory = Object.assign({ door: state.flags["item.door"] === true, items: [], giftBarley: false }, (partial && partial.inventory) || {});
    state.inventory.door = state.flags["item.door"] === true;
    await goto("");
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
    await page.evaluate((key) => localStorage.removeItem(key), BRANCH_KEY);
    await goto("?debug=1");
  }
  async function readBranch() {
    return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), BRANCH_KEY);
  }
  async function box(selector) {
    return page.locator(selector).first().boundingBox();
  }
  async function openTitleBranch() {
    await hit(page.locator('.title-menu [data-action="branch"]'));
    return waitVisible("#branch-map");
  }

  const LIVE_CHOICES = [
    { chapter: "prologue", nodeId: "p021", option: "A", text: "带上这块门板", timedOut: false },
    { chapter: "prologue", nodeId: "p024", option: "MULTI", text: "药、青稞、布鞋", timedOut: false },
    { chapter: "prologue", nodeId: "p037", option: "A", text: "回头看一眼", timedOut: false }
  ];

  const FULL_CHOICES = LIVE_CHOICES.concat([
    { chapter: "xiangjiang", nodeId: "x015", option: "MULTI", text: "X 光机、药箱、电台", timedOut: false },
    { chapter: "xiangjiang", nodeId: "x025a", option: "C", text: "门板横在桥头", timedOut: false },
    { chapter: "zunyi", nodeId: "z019", option: "A", text: "承认东西带得太多", timedOut: false },
    { chapter: "zunyi", nodeId: "z022", option: "A", text: "承认湘江那条路走错了", timedOut: false },
    { chapter: "zunyi", nodeId: "z025", option: "A", text: "承认漏记过名字", timedOut: false },
    { chapter: "zunyi", nodeId: "z028e", option: "A", text: "写下向北", timedOut: false },
    { chapter: "jinsha", nodeId: "j024", option: "A", text: "先渡主力", timedOut: false },
    { chapter: "luding", nodeId: "l019", option: "C", text: "抱着门板先过桥", timedOut: false },
    { chapter: "luding", nodeId: "l027", option: "A", text: "记下数字", timedOut: false },
    { chapter: "grass", nodeId: "g008", option: "A", text: "青稞给伤员", timedOut: false },
    { chapter: "grass", nodeId: "g018x", option: "A", text: "青稞入锅", timedOut: false },
    { chapter: "grass", nodeId: "g021", option: "A", text: "背走小锅", timedOut: false },
    { chapter: "grass", nodeId: "g026x", option: "A", text: "布鞋给冬生", timedOut: false },
    { chapter: "wuqi", nodeId: "w013", option: "A", text: "门板留吴起", timedOut: false }
  ]);

  const DEEP_CHOICES = FULL_CHOICES.filter(function (choice) {
    return choice.nodeId !== "l019";
  }).map(function (choice) {
    return choice.nodeId === "g018x" ? Object.assign({}, choice, { option: "B", text: "铁锅架火" }) : choice;
  }).concat([
    { chapter: "luding", nodeId: "l019x", option: "B", text: "继续走", timedOut: false }
  ]);

  async function expandBranchDetail() {
    const toggles = page.locator('#branch-detail-body [data-action="branch-node"]');
    for (let i = 0; i < await toggles.count(); i++) {
      await toggles.nth(i).click();
    }
  }

  async function caseDeep() {
    await seedSave({
      scene: "vn", chapterId: "wuqi", nodeId: "w001",
      unlockedChapters: CHAPTERS.slice(),
      flags: { "item.door": false, rescues: 2, condition: 2, "memory.zhang": true },
      inventory: { door: false, items: ["roster", "pencil", "medicine", "barley"] },
      choices: DEEP_CHOICES
    });
    check("深度态暂停可见", await waitVisible(".vn-pause"));
    await hit(page.locator(".vn-pause"));
    await hit(page.locator('#pause-menu [data-action="branch"]'));
    check("深度态歧路图", await waitVisible("#branch-map"));

    await hit(page.locator('#branch-chapters [data-chapter="xiangjiang"]'));
    await expandBranchDetail();
    const xy = await page.locator("#branch-detail-body").innerText();
    check("弃物多选只列选中项", xy.indexOf("弃物」的选择中，你选择了「X 光机、药箱、电台」") !== -1 && xy.indexOf("X 光机过了江") !== -1 && xy.indexOf("药箱过了江") !== -1 && xy.indexOf("一箱银元过了江") === -1);
    check("桥头 C 因果", xy.indexOf("门板横在桥头") !== -1 && xy.indexOf("老周回来了") !== -1);
    await hit(page.locator("#branch-detail-close"));

    await hit(page.locator('#branch-chapters [data-chapter="luding"]'));
    await expandBranchDetail();
    const ld = await page.locator("#branch-detail-body").innerText();
    check("l019x 语义映射", ld.indexOf("在这个「泸定桥」的选择中，你选择了「继续走」") !== -1 && ld.indexOf("飞毛腿留在桥头") !== -1);
    check("泸定记数字后果", ld.indexOf("你记下数字，不写名字") !== -1);
    await hit(page.locator("#branch-detail-close"));

    await hit(page.locator('#branch-chapters [data-chapter="jinsha"]'));
    await expandBranchDetail();
    const js = await page.locator("#branch-detail-body").innerText();
    check("记名事件已发生", js.indexOf("你抄下了张老幺的名字") !== -1);
    await hit(page.locator("#branch-detail-close"));

    await hit(page.locator('#branch-chapters [data-chapter="grass"]'));
    await expandBranchDetail();
    const gr = await page.locator("#branch-detail-body").innerText();
    check("灶王铁锅映射", gr.indexOf("你把家里的铁锅架上去") !== -1 && gr.indexOf("灶王活了下来") !== -1);
    await shot("deep-grass");
    await hit(page.locator("#branch-detail-close"));
    await hit(page.locator("#branch-close"));
  }

  const ROUTES = ["door_excellent", "door_grass_one", "door_carry_two", "door_grass_many", "door_others", "no_door_zero", "no_door_one", "no_door_two", "no_door_three", "no_door_three_excellent", "bad_end"];

  async function seedBranchRoutes(routes) {
    await page.evaluate(([key, list]) => {
      const now = Date.now();
      const chapters = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];
      const store = { version: 1, updatedAt: now, runs: [], endings: {}, chapters: {}, options: {} };
      list.forEach((route, index) => {
        const runId = "seed-" + route;
        store.runs.push({ id: runId, at: now + index, route, chapters, choices: [], summary: { hadDoor: route.indexOf("door") === 0, rescues: 1, condition: 3 }, events: {} });
        store.endings[route] = { at: now + index, runId, count: 1 };
      });
      chapters.forEach((chapterId) => { store.chapters[chapterId] = { at: now, runId: "seed-" + list[0] }; });
      localStorage.setItem(key, JSON.stringify(store));
    }, [BRANCH_KEY, routes]);
  }

  async function caseRoutes() {
    await clearStorage();
    await goto("?debug=1");
    await seedBranchRoutes(ROUTES.slice(0, 10));
    check("十路线标题入口", await openTitleBranch());
    check("十路线计数", (await page.locator("#branch-count").innerText()).indexOf("10 / 11") !== -1);
    check("十路线十张亮", await page.locator(".xb-branch-ending.is-unlocked").count() === 10);
    check("十路线一张灰", await page.locator(".xb-branch-ending.is-locked").count() === 1);
    check("坏结局仍锁", await page.locator('.xb-branch-ending[data-route="bad_end"].is-locked').count() === 1);
    check("带板组 5 张", await page.locator("#branch-endings-door .xb-branch-ending").count() === 5);
    check("空手组 5 张", await page.locator("#branch-endings-nodoor .xb-branch-ending").count() === 5);
    check("坏结局组 1 张", await page.locator("#branch-endings-bad .xb-branch-ending").count() === 1);
    await hit(page.locator('.xb-branch-ending[data-route="no_door_two"]'));
    check("空手路线详情", (await page.locator("#branch-detail-title").innerText()).indexOf("结局 8 / 11") !== -1);
    await hit(page.locator("#branch-detail-close"));
    await hit(page.locator("#branch-close"));
    await sleep(100);
    await seedBranchRoutes(ROUTES);
    check("十一路线重开", await openTitleBranch());
    check("十一路线全亮", await page.locator(".xb-branch-ending.is-unlocked").count() === 11 && await page.locator(".xb-branch-ending.is-locked").count() === 0);
    const badCard = page.locator('.xb-branch-ending[data-route="bad_end"]');
    check("坏结局卡片解锁", (await badCard.getAttribute("class")).indexOf("is-unlocked") !== -1, await badCard.getAttribute("class"));
    check("坏结局卡片标题", (await badCard.innerText()).indexOf("没有走出草地") !== -1, await badCard.innerText());
    await shot("routes-all");
    await hit(badCard);
    const bad = await page.locator("#branch-detail-title").innerText();
    check("坏结局详情", bad.indexOf("结局 11 / 11 · 没有走出草地") !== -1, bad);
    await shot("routes-bad-detail");
    await hit(page.locator("#branch-detail-close"));
    await hit(page.locator("#branch-close"));
  }

  async function casePrivate() {
    await clearStorage();
    await page.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "xiangbei.branches.v1") throw new Error("quota");
        return original.call(this, key, value);
      };
    });
    await seedSave({
      scene: "vn", chapterId: "wuqi", nodeId: "w900",
      unlockedChapters: CHAPTERS.slice(),
      flags: {
        "item.door": true, doorOutcome: "carried", rescues: 1, condition: 4,
        "fate.feimao.dead": false, "fate.zaowang.dead": true, "fate.dongsheng.dead": true,
        "fate.lin.dead": false, "fate.player.dead": false
      },
      inventory: { door: true, items: ["roster", "pencil"] },
      choices: []
    });
    check("隐私模式仍进结局", await waitVisible("#scene-ending", 10000));
    check("隐私模式有降级提示", await visible("#toast") && (await page.locator("#toast").innerText()).indexOf("本机无法保存剧情分支") !== -1);
    await hit(page.locator("#ending-branch"));
    check("隐私模式本次仍可回看", await waitVisible("#branch-map") && (await page.locator("#branch-count").innerText()).indexOf("1 / 11") !== -1);
    await hit(page.locator('.xb-branch-ending[data-route="door_excellent"]'));
    check("隐私模式详情可用", await waitVisible("#branch-detail") && (await page.locator("#branch-detail-body").innerText()).indexOf("门板") !== -1);
    await hit(page.locator("#branch-detail-close"));
    await hit(page.locator("#branch-close"));
    await goto("?debug=1");
    check("刷新后隐私模式不白屏", await visible("#scene-ending"));
    await hit(page.locator("#ending-branch"));
    check("刷新后分支记录归零", (await page.locator("#branch-count").innerText()).indexOf("0 / 11") !== -1);
    await hit(page.locator("#branch-close"));
  }

  async function caseEmpty() {
    await clearStorage();
    await goto("?debug=1");
    check("标题菜单 5 项", await page.locator(".title-menu [data-action]").count() === 5);
    check("剧情分支按钮可见", await visible('.title-menu [data-action="branch"]'));
    check("打开歧路图", await openTitleBranch());
    check("空态 0/11", (await page.locator("#branch-count").innerText()).indexOf("0 / 11") !== -1);
    check("七章卡", await page.locator("#branch-chapters .xb-branch-chapter").count() === 7);
    check("十一章结局卡", await page.locator(".xb-branch-ending").count() === 11);
    check("十一章全锁", await page.locator(".xb-branch-ending.is-locked").count() === 11);
    check("七章全锁", await page.locator("#branch-chapters .xb-branch-chapter.is-locked").count() === 7);
    const lockedLedes = await page.locator(".xb-branch-ending.is-locked .xb-branch-ending__lede").allInnerTexts();
    check("未解锁卡不写未解锁", lockedLedes.length === 11 && lockedLedes.every((text) => text.trim() !== "未解锁"), lockedLedes.join(" | "));
    check("带板未解锁给门板线索", lockedLedes.filter((text) => text.indexOf("门板还在不在") !== -1).length === 5, lockedLedes.join(" | "));
    check("空手未解锁给名字线索", lockedLedes.filter((text) => text.indexOf("空着手") !== -1).length === 5, lockedLedes.join(" | "));
    check("坏结局未解锁给草底线索", lockedLedes.filter((text) => text.indexOf("草地有没有尽头") !== -1).length === 1, lockedLedes.join(" | "));
    await shot("empty-map");

    await hit(page.locator('#branch-chapters [data-chapter="prologue"]'));
    check("章节详情打开", await waitVisible("#branch-detail"));
    const chapterText = await page.locator("#branch-detail-body").innerText();
    check("章节详情列三门板/行囊/回头", chapterText.indexOf("门板") !== -1 && chapterText.indexOf("行囊") !== -1 && chapterText.indexOf("回头") !== -1);
    check("未走到不泄露选项", chapterText.indexOf("带上这块门板") === -1 && chapterText.indexOf("尚未走到") !== -1);
    await shot("empty-chapter");
    await hit(page.locator("#branch-detail-close"));
    await sleep(120);

    await hit(page.locator('.xb-branch-ending[data-route="door_excellent"]'));
    check("结局详情打开", await waitVisible("#branch-detail"));
    const routeTitle = await page.locator("#branch-detail-title").innerText();
    const routeText = await page.locator("#branch-detail-body").innerText();
    check("结局未解锁提示", routeTitle.indexOf("尚未抵达") !== -1, routeTitle);
    check("结局未解锁只给模糊提示", routeText.indexOf("带上门板") === -1 && routeText.indexOf("救下了一个人") === -1 && routeText.indexOf("救下了两个人") === -1 && routeText.indexOf("救下了三个人") === -1, routeText);
    await shot("empty-route");
    await hit(page.locator("#branch-detail-close"));
    await sleep(120);
    await hit(page.locator('.xb-branch-ending[data-route="no_door_three"]'));
    check("空手未解锁详情打开", await waitVisible("#branch-detail"));
    const noDoorText = await page.locator("#branch-detail-body").innerText();
    check("空手未解锁详情不泄露人数", noDoorText.indexOf("救下了一个人") === -1 && noDoorText.indexOf("救下了两个人") === -1 && noDoorText.indexOf("救下了三个人") === -1, noDoorText);
    check("空手未解锁详情保留方向", noDoorText.indexOf("空着手") !== -1, noDoorText);
    await hit(page.locator("#branch-detail-close"));
    await sleep(120);
    await hit(page.locator("#branch-close"));
    await sleep(150);
    check("关闭歧路图", !(await visible("#branch-map")));
  }

  async function caseLive() {
    await seedSave({
      scene: "vn", chapterId: "xiangjiang", nodeId: "x001",
      unlockedChapters: ["prologue", "xiangjiang"],
      flags: { "item.door": true, load: 2, fire: 55 },
      inventory: { door: true, items: ["roster", "pencil", "medicine", "barley", "shoes"] },
      choices: LIVE_CHOICES
    });
    check("暂停按钮可见", await waitVisible(".vn-pause"));
    await shot("live-vn");
    await hit(page.locator(".vn-pause"));
    check("暂停菜单含剧情分支", await waitVisible('#pause-menu [data-action="branch"]'));
    await shot("live-pause");
    await hit(page.locator('#pause-menu [data-action="branch"]'));
    check("暂停打开歧路图", await waitVisible("#branch-map"));
    check("暂停态七章", await page.locator("#branch-chapters .xb-branch-chapter").count() === 7);
    check("序章走过", await page.locator('#branch-chapters [data-chapter="prologue"].is-this-run').count() === 1);
    check("湘江本次", await page.locator('#branch-chapters [data-chapter="xiangjiang"].is-current').count() === 1);
    check("后续五章仍锁", await page.locator("#branch-chapters .xb-branch-chapter.is-locked").count() === 5);
    check("历史结局仍 0/11", (await page.locator("#branch-count").innerText()).indexOf("0 / 11") !== -1);
    const liveText = await page.locator("#branch-live").innerText();
    check("暂停实时句", liveText.indexOf("湘江") !== -1 && liveText.indexOf("现在") !== -1, liveText);
    await shot("live-map");

    await hit(page.locator('#branch-chapters [data-chapter="prologue"]'));
    check("序章详情打开", await waitVisible("#branch-detail"));
    const toggles = page.locator('#branch-detail-body [data-action="branch-node"]');
    for (let i = 0; i < await toggles.count(); i++) {
      await toggles.nth(i).click();
    }
    const body = await page.locator("#branch-detail-body").innerText();
    check("门板句式", body.indexOf("在这个「门板」的选择中，你选择了「带上这块门板」，因此——") !== -1);
    check("多选列后果", body.indexOf("药在泸定") !== -1 && body.indexOf("青稞能在草地") !== -1);
    check("回头句式", body.indexOf("在这个「回头」的选择中，你选择了「回头看一眼」，因此——") !== -1);
    await shot("live-chapter");
    await hit(page.locator("#branch-detail-close"));
    await sleep(120);

    await hit(page.locator('#branch-chapters [data-chapter="xiangjiang"]'));
    check("湘江详情打开", await waitVisible("#branch-detail"));
    const futureBody = await page.locator("#branch-detail-body").innerText();
    check("未来节点不泄露选项", futureBody.indexOf("尚未走到") !== -1 && futureBody.indexOf("X 光机") === -1);
    await hit(page.locator("#branch-detail-close"));
    await sleep(120);
    await hit(page.locator("#branch-close"));
    await sleep(150);
    check("关闭后回暂停", await visible("#pause-menu"));
    await hit(page.locator('#pause-menu [data-action="resume"]'));
    await sleep(150);
    check("继续回游戏", await visible("#vn-dialogue"));
  }

  async function caseEnding() {
    await seedSave({
      scene: "vn", chapterId: "wuqi", nodeId: "w900",
      unlockedChapters: CHAPTERS.slice(),
      flags: {
        "item.door": true, doorOutcome: "carried", rescues: 1, condition: 4,
        "fate.feimao.dead": false, "fate.zaowang.dead": true, "fate.dongsheng.dead": true,
        "fate.lin.dead": false, "fate.player.dead": false
      },
      inventory: { door: true, items: ["roster", "pencil"] },
      choices: FULL_CHOICES
    });
    check("结算进入结局页", await waitVisible("#scene-ending", 10000));
    const store = await readBranch();
    check("分支落档存在", !!store && store.version === 1, JSON.stringify(store && Object.keys(store.endings)));
    check("落档一局", !!store && store.runs.length === 1);
    check("落档保留全部抉择", !!store && store.runs[0].choices.length === 17, store && store.runs[0].choices.length);
    check("落档路线 1/11", !!store && !!store.endings.door_excellent);
    check("落档七章", !!store && Object.keys(store.chapters).length === 7);
    await shot("ending-page");

    await hit(page.locator("#ending-branch"));
    check("结局页打开歧路图", await waitVisible("#branch-map"));
    check("已抵达 1/11", (await page.locator("#branch-count").innerText()).indexOf("1 / 11") !== -1);
    check("一张已解锁", await page.locator(".xb-branch-ending.is-unlocked").count() === 1);
    check("本次路线高亮", await page.locator('.xb-branch-ending[data-route="door_excellent"].is-current').count() === 1);
    check("七章都走过", await page.locator("#branch-chapters .xb-branch-chapter.is-locked").count() === 0);
    await shot("ending-map");

    await hit(page.locator('.xb-branch-ending[data-route="door_excellent"]'));
    check("路线详情打开", await waitVisible("#branch-detail"));
    const routeBody = await page.locator("#branch-detail-body").innerText();
    check("路线详情含门板与救人", routeBody.indexOf("门板") !== -1 && routeBody.indexOf("救") !== -1, routeBody.slice(0, 160));
    check("路线详情列出全部抉择", routeBody.indexOf("这一局的抉择没有留在记录里") === -1 && routeBody.indexOf("门板：带上这块门板") !== -1 && routeBody.indexOf("先渡谁：先渡主力") !== -1, routeBody.slice(0, 220));
    await shot("ending-route-detail");
    await hit(page.locator("#branch-detail-close"));
    await sleep(120);
    await hit(page.locator("#branch-close"));
    await sleep(150);

    await hit(page.locator("#ending-home"));
    await sleep(300);
    check("回标题", await visible(".title-menu"));
    check("标题入口打开历史", await openTitleBranch());
    check("历史 1/11", (await page.locator("#branch-count").innerText()).indexOf("1 / 11") !== -1);
    check("历史一张已解锁", await page.locator(".xb-branch-ending.is-unlocked").count() === 1);
    await shot("title-history");
    await hit(page.locator("#branch-close"));
    await sleep(150);
    check("清主档不清分支", true);
    await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
    await goto("?debug=1");
    check("清档后标题入口仍在", await openTitleBranch());
    check("清档后分支仍在", (await page.locator("#branch-count").innerText()).indexOf("1 / 11") !== -1);
    await hit(page.locator("#branch-close"));
    await sleep(150);
  }

  async function caseKeyboard() {
    await clearStorage();
    await goto("?debug=1");
    await page.locator('.title-menu [data-action="branch"]').focus();
    await page.keyboard.press("Enter");
    check("键盘打开歧路图", await waitVisible("#branch-map"));
    check("焦点在关闭键", await page.evaluate(() => document.activeElement && document.activeElement.id === "branch-close"));
    await page.keyboard.press("Tab");
    check("Tab 仍在遮罩内", await page.evaluate(() => {
      const map = document.getElementById("branch-map");
      return !!map && map.contains(document.activeElement);
    }));
    await hit(page.locator('#branch-chapters [data-chapter="prologue"]'));
    check("键盘打开章节详情", await waitVisible("#branch-detail"));
    check("详情焦点在关闭键", await page.evaluate(() => document.activeElement && document.activeElement.id === "branch-detail-close"));
    await page.keyboard.press("Escape");
    await sleep(120);
    check("Escape 先关详情", !(await visible("#branch-detail")) && await visible("#branch-map"));
    await hit(page.locator('#branch-chapters [data-chapter="prologue"]'));
    await page.locator("#branch-detail-body").evaluate((el) => { el.scrollTop = 120; });
    await hit(page.locator("#branch-detail-close"));
    await hit(page.locator('#branch-chapters [data-chapter="xiangjiang"]'));
    check("详情重新打开滚动归零", await page.locator("#branch-detail-body").evaluate((el) => el.scrollTop === 0));
    await page.mouse.click(8, 8);
    await sleep(120);
    check("点详情背景关闭详情", !(await visible("#branch-detail")) && await visible("#branch-map"));
    await page.keyboard.press("Escape");
    await sleep(150);
    check("Escape 关闭歧路图", !(await visible("#branch-map")));
    check("焦点回入口", await page.evaluate(() => document.activeElement && document.activeElement.dataset.action === "branch"));
  }

  async function caseReduce() {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await clearStorage();
    await goto("?debug=1");
    check("缩动效可开歧路图", await openTitleBranch());
    const durations = await page.evaluate(() => {
      const nodes = document.querySelectorAll(".xb-branch-ending, .xb-branch-chapter, #branch-detail");
      return Array.prototype.map.call(nodes, (node) => {
        const style = getComputedStyle(node);
        return style.transitionDuration + " / " + style.animationDuration;
      });
    });
    check("缩动效无过渡", durations.every((value) => value === "0s / 0s"), durations.slice(0, 3).join("；"));
    await hit(page.locator('#branch-chapters [data-chapter="prologue"]'));
    check("缩动效详情可用", await waitVisible("#branch-detail"));
    await hit(page.locator("#branch-detail-close"));
    await hit(page.locator("#branch-close"));
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }

  async function caseBadStore() {
    await goto("");
    await page.evaluate(([save, branch]) => {
      localStorage.removeItem(save);
      localStorage.setItem(branch, "{broken");
      localStorage.removeItem(branch + ".bad");
    }, [SAVE_KEY, BRANCH_KEY]);
    await goto("?debug=1");
    check("坏档不白屏", await visible(".title-menu"));
    check("坏档可开空图", await openTitleBranch());
    check("坏档显示 0/11", (await page.locator("#branch-count").innerText()).indexOf("0 / 11") !== -1);
    const backup = await page.evaluate((key) => localStorage.getItem(key + ".bad"), BRANCH_KEY);
    check("坏档备份 .bad", backup === "{broken");
    await shot("bad-store");
    await hit(page.locator("#branch-close"));
    await sleep(150);
  }

  const enabled = args.case === "all" ? ["deep", "routes", "empty", "live", "ending", "keyboard", "reduce", "bad", "private"] : [args.case];
  if (enabled.indexOf("deep") !== -1) await caseDeep();
  if (enabled.indexOf("routes") !== -1) await caseRoutes();
  if (enabled.indexOf("empty") !== -1) await caseEmpty();
  if (enabled.indexOf("live") !== -1) await caseLive();
  if (enabled.indexOf("ending") !== -1) await caseEnding();
  if (enabled.indexOf("keyboard") !== -1) await caseKeyboard();
  if (enabled.indexOf("reduce") !== -1) await caseReduce();
  if (enabled.indexOf("bad") !== -1) await caseBadStore();
  if (enabled.indexOf("private") !== -1) await casePrivate();

  if (args.mobile) {
    await clearStorage();
    await goto("?debug=1");
    check("移动端标题 5 项", await page.locator(".title-menu [data-action]").count() === 5);
    const menuBox = await box('.title-menu [data-action="branch"]');
    check("移动端入口热区 >=44 CSS", menuBox && menuBox.height >= 43.5, menuBox && (menuBox.width + "x" + menuBox.height));
    check("移动端打开歧路图", await openTitleBranch());
    const chapterBox = await box("#branch-chapters .xb-branch-chapter");
    const endingBox = await box(".xb-branch-ending");
    const closeBox = await box("#branch-close");
    check("移动端章节卡 >=44 CSS", chapterBox && chapterBox.height >= 43.5, chapterBox && chapterBox.height);
    check("移动端结局卡 >=44 CSS", endingBox && endingBox.height >= 43.5, endingBox && endingBox.height);
    check("移动端关闭热区 >=44 CSS", closeBox && closeBox.width >= 43.5 && closeBox.height >= 43.5, closeBox && (closeBox.width + "x" + closeBox.height));
    await shot("mobile-map");
    await hit(page.locator('#branch-chapters [data-chapter="prologue"]'));
    check("移动端详情打开", await waitVisible("#branch-detail"));
    const detailClose = await box("#branch-detail-close");
    check("移动端详情关闭 >=44 CSS", detailClose && detailClose.width >= 43.5 && detailClose.height >= 43.5, detailClose && (detailClose.width + "x" + detailClose.height));
    const nodeBox = await box(".xb-branch-node__toggle");
    check("移动端节点行 >=44 CSS", nodeBox && nodeBox.height >= 43.5, nodeBox && nodeBox.height);
    await shot("mobile-detail");
    await hit(page.locator("#branch-detail-close"));
    await sleep(120);
    await hit(page.locator("#branch-close"));
    await sleep(120);
  }

  result.logs = logs;
  result.finishedAt = new Date().toISOString();
  result.pass = checks.filter((c) => c.ok).length;
  result.fail = checks.length - result.pass;
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  log("RESULT " + result.pass + "/" + checks.length + " failed=" + result.fail);
  log("consoleErrors=" + logs.consoleErrors.length + " pageErrors=" + logs.pageErrors.length + " requestFailed=" + logs.requestFailed.length + " httpErrors=" + logs.httpErrors.length + " external=" + logs.external.length);
  if (logs.consoleErrors.length) log("CONSOLE " + logs.consoleErrors.slice(0, 5).join(" || "));
  if (logs.pageErrors.length) log("PAGEERROR " + logs.pageErrors.slice(0, 3).join(" || "));
  await browser.close();
  if (serverInfo) serverInfo.server.close();
  process.exit(result.fail === 0 && !logs.consoleErrors.length && !logs.pageErrors.length ? 0 : 1);
})().catch((error) => { console.error(error); process.exit(1); });
