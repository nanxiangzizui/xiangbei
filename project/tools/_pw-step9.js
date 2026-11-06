#!/usr/bin/env node
"use strict";

// 步骤九自动化：四段选择、刷新回写、旧档迁移、完整流程、file:// 与 844×390。
// 用法：node project/tools/_pw-step9.js --url=http --case=all --out=docs/evidence/step-09
// 依赖：my-playwright-project/node_modules/playwright-core；浏览器用本机 Edge。

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVE_KEY = "xiangbei.save.v1";
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
  const runId = "step9-" + args.url + "-" + (args.mobile ? "mobile-" : "") + args.case + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-09", runId));
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
  async function info() {
    const text = await page.locator("#debug").innerText().catch(() => "");
    const node = text.match(/node\s+(\S+)\s+\((\w+)\)/);
    const chapter = text.match(/chapter\s+(\S+)/);
    return { node: node && node[1], type: node && node[2], chapter: chapter && chapter[1], raw: text };
  }
  async function waitNode(id, timeout) {
    const deadline = Date.now() + (timeout || 8000);
    while (Date.now() < deadline) {
      const d = await info();
      if (d.node === id) return true;
      await sleep(100);
    }
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
  async function clickOption(index) {
    const options = page.locator("#vn-multi-options .xb-multi-option");
    await hit(options.nth(index));
    await sleep(80);
  }
  async function confirmMulti() {
    await hit(page.locator("#vn-multi-confirm"));
    await sleep(500);
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

  async function caseTarget() {
    await openChapter("prologue", "p024");
    check("p024 打开多选", await waitVisible("#vn-multichoice"));
    check("p024 五个选项", await page.locator("#vn-multi-options .xb-multi-option").count() === 5);
    check("p024 提示句", /行囊还能塞三件/.test(await page.locator("#vn-multi-prompt").innerText()));
    check("p024 0 件可确认", !(await page.locator("#vn-multi-confirm").isDisabled()));
    await clickOption(0); await clickOption(1); await clickOption(2);
    check("p024 已选 3 件", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 3);
    check("p024 状态栏计数", /已选 3 样，最多 3 样/.test(await page.locator("#vn-multi-status").innerText()));
    await clickOption(3);
    check("p024 满额后再点不增加", (await page.locator("#vn-multi-options .xb-multi-option.is-checked").count()) === 3);
    check("p024 满额提示", /最多 3 样/.test(await page.locator("#vn-multi-status").innerText()));
    await shot("p024-three");
    await confirmMulti();
    check("p024 进入结算", await waitVisible("#vn-result"));
    const text = await page.locator("#vn-result").innerText();
    check("行囊统计 3/6 格", /行囊 3\/6 格/.test(text), text.replace(/\s+/g, " ").slice(0, 160));
    check("行囊带走三件", /带走[\s\S]*药[\s\S]*青稞[\s\S]*铁锅/.test(text));
    check("行囊留下雨布布鞋", /留下[\s\S]*雨布[\s\S]*布鞋/.test(text));
    const beforeReload = text.replace(/\s+/g, " ").trim();
    await gotoTitle("?debug=1");
    await sleep(700);
    check("p025 刷新仍在结算", await visible("#vn-result"));
    const afterReload = (await page.locator("#vn-result").innerText()).replace(/\s+/g, " ").trim();
    check("p025 刷新清单一致", beforeReload === afterReload);

    await openChapter("prologue", "p024");
    await waitVisible("#vn-multichoice");
    await page.keyboard.press("Digit1");
    await page.keyboard.press("Digit2");
    await page.keyboard.press("Enter");
    check("键盘多选确认进结算", await waitVisible("#vn-result"));
    check("键盘行囊 2/6 格", /行囊 2\/6 格/.test(await page.locator("#vn-result").innerText()));

    await openChapter("xiangjiang", "x015");
    check("x015 打开多选", await waitVisible("#vn-multichoice"));
    check("x015 六个选项", await page.locator("#vn-multi-options .xb-multi-option").count() === 6);
    check("x015 初始不可确认", await page.locator("#vn-multi-confirm").isDisabled());
    await clickOption(0); await clickOption(1); await clickOption(2);
    check("x015 恰好三样可确认", !(await page.locator("#vn-multi-confirm").isDisabled()));
    await confirmMulti();
    check("x015 进入弃物结算", await waitVisible("#vn-result"));
    const xt = await page.locator("#vn-result").innerText();
    check("弃物统计 3/3", /带上船 3 样 · 留在岸上 3 样/.test(xt), xt.replace(/\s+/g, " ").slice(0, 160));
    check("弃物带上船三样", /带上船[\s\S]*X 光机[\s\S]*印刷机[\s\S]*文件/.test(xt));
    check("弃物留岸三样", /留在岸上[\s\S]*药箱[\s\S]*电台[\s\S]*银元/.test(xt));
    await shot("x016-result");
    await gotoTitle("?debug=1");
    await sleep(700);
    check("x016 刷新仍在结算", await visible("#vn-result"));
    check("x016 刷新清单一致", /留在岸上[\s\S]*药箱[\s\S]*电台[\s\S]*银元/.test(await page.locator("#vn-result").innerText()));
  }

  async function caseSegments() {
    await openChapter("jinsha", "j024");
    check("金沙江 choice 出现", await waitVisible("#vn-choices"));
    await hit(page.locator("#vn-choices .xb-choice").first());
    await sleep(500);
    check("金沙江选后进入 j024a", await waitNode("j024a"));
    check("金沙江主力回写", /主力先上/.test(await page.locator("#vn-text").innerText()));

    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, load: 2 }, inventory: { door: true, items: ["roster", "pencil"] } });
    await gotoTitle("?debug=1");
    check("泸定 choice 出现", await waitVisible("#vn-choices"));
    await hit(page.locator("#vn-choices .xb-choice").first());
    await sleep(500);
    check("铺门板后进入 l019a", await waitNode("l019a"));
    check("铺门板回写", /桥面多了一块板/.test(await page.locator("#vn-text").innerText()));
    await nextLine();
    check("过桥后到 l021", await waitNode("l021"));
    await nextLine();
    check("l021a 门板回写", await waitNode("l021a"));
    await sleep(800);
    check("门板成了桥板", /有一块板，是我家的门/.test(await page.locator("#vn-text").innerText()), await page.locator("#vn-text").innerText());

    await seed({ scene: "vn", chapterId: "luding", nodeId: "l019", flags: { "item.door": true, load: 2 }, inventory: { door: true, items: ["roster", "pencil", "shoes"] } });
    await gotoTitle("?debug=1");
    await waitVisible("#vn-choices");
    await hit(page.locator("#vn-choices .xb-choice").nth(1));
    await sleep(500);
    check("抱门板后进入 l019b", await waitNode("l019b"));
    check("抱门板回写", /门板压在背上/.test(await page.locator("#vn-text").innerText()));
  }

  async function caseMigration() {
    await seed({
      scene: "vn", chapterId: "jinsha", nodeId: "j010",
      flags: { "item.door": true, load: 2, "choice.xiangjiang.abandoned": ["xray", "medkit", "radio"] },
      inventory: { door: true, items: ["roster", "pencil", "medicine", "pot"] }
    });
    await gotoTitle("?debug=1");
    await sleep(500);
    check("j010 旧档迁到 j012", await waitNode("j012"));
    const toast = await page.locator("#toast").innerText().catch(() => "");
    check("金沙江迁移提示", /旧存档已接回金沙江/.test(toast), toast);
    const savedJ = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    check("迁移后存档已写 j012", savedJ && savedJ.nodeId === "j012", savedJ && savedJ.nodeId);
    check("旧背包回填 item.medicine", savedJ && savedJ.flags["item.medicine"] === true);
    check("旧背包回填 item.homepot", savedJ && savedJ.flags["item.homepot"] === true);
    check("留岸反推 take.press", savedJ && savedJ.flags["choice.xiangjiang.take.press"] === true);
    check("留岸反推 take.xray=false", savedJ && savedJ.flags["choice.xiangjiang.take.xray"] === false);

    await seed({
      scene: "vn", chapterId: "luding", nodeId: "l013",
      flags: { "item.door": true, load: 2, "choice.xiangjiang.abandoned": ["xray", "medkit", "radio"] },
      inventory: { door: true, items: ["roster", "pencil"] }
    });
    await gotoTitle("?debug=1");
    await sleep(500);
    check("l013 旧档迁到 l015", await waitNode("l015"));
    const toast2 = await page.locator("#toast").innerText().catch(() => "");
    check("泸定迁移提示", /旧存档已接回泸定/.test(toast2), toast2);
    const savedL = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
    check("泸定迁移后写 l015", savedL && savedL.nodeId === "l015", savedL && savedL.nodeId);

    await gotoTitle("?debug=1");
    await sleep(500);
    check("迁移只提示一次", !(await visible("#toast")) || !/旧存档已接回/.test(await page.locator("#toast").innerText()));
  }

  async function handleInteract() {
    const deadline = Date.now() + 70000;
    while (Date.now() < deadline) {
      if (!(await visible("#vn-interact"))) return true;
      const answer = page.locator("#interact-answer");
      if (await answer.isVisible().catch(() => false)) {
        await hit(answer).catch(() => {});
        await sleep(220);
      } else {
        await sleep(160);
      }
    }
    return false;
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
    let lastNode = "";
    const deadline = Date.now() + 9 * 60 * 1000;
    while (Date.now() < deadline) {
      iteration += 1;
      if (iteration % 30 === 0) {
        const d = await info();
        log("FLOW step=" + iteration + " chapter=" + chapter + " node=" + d.node + " type=" + d.type + " lines=" + lines);
      }
      if (await visible("#scene-ending")) {
        await sleep(800);
        const cards = await page.locator("#ending-cards .xb-ending__card").count();
        const lit = await page.locator("#ending-cards .xb-ending__card.is-lit").count();
        const names = await page.locator("#ending-names .xb-ending__name").count();
        const text = await page.locator("#ending-panel").innerText();
        await shot("flow-ending");
        return { ok: true, ms: Date.now() - started, lines, multis, choices, cards, lit, names, text: text.replace(/\s+/g, " ").slice(0, 900), lastNode };
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
        const options = page.locator("#vn-multi-options .xb-multi-option");
        const count = await options.count();
        const pick = Math.min(3, count);
        for (let i = 0; i < pick; i += 1) await clickOption(i);
        await confirmMulti();
        multis += 1;
        continue;
      }
      if (await visible("#vn-interact")) { await handleInteract(); continue; }
      const d = await info();
      chapter = d.chapter || chapter;
      lastNode = d.node || lastNode;
      if (!(await visible("#vn-dialogue"))) { await sleep(160); continue; }
      await hit(page.locator("#vn-dialogue"), args.mobile ? undefined : { position: { x: 420, y: 120 } });
      lines += 1;
      await sleep(pace);
    }
    throw new Error("完整流程超时，停在 " + JSON.stringify(await info()));
  }

  try {
    let flow = null;
    if (args.case === "target" || args.case === "all") await caseTarget();
    if (args.case === "segments" || args.case === "all") await caseSegments();
    if (args.case === "migration" || args.case === "all") await caseMigration();
    if (args.case === "flow" || args.case === "all") flow = await caseFlow();

    check("minigames.js 已不存在", !fs.existsSync(path.join(PROJECT, "minigames.js")));
    const html = fs.readFileSync(path.join(PROJECT, "index.html"), "utf8");
    check("index.html 无 minigame 入口", html.indexOf("minigame") === -1);
    check("页面无小游戏画布", (await page.locator("#minigame-canvas, #vn-minigame").count()) === 0);
    check("控制台 0 error", logs.consoleErrors.length === 0, logs.consoleErrors.join(" | "));
    check("页面 0 pageerror", logs.pageErrors.length === 0, logs.pageErrors.join(" | "));
    check("0 失败请求", logs.requestFailed.length === 0, logs.requestFailed.join(" | "));
    check("0 HTTP 错误", logs.httpErrors.length === 0, logs.httpErrors.join(" | "));
    check("0 外部请求", logs.external.length === 0, logs.external.join(" | "));

    if (flow) {
      result.flow = flow;
      check("完整流程到结局", flow.ok);
      check("完整流程四段多选/单选都出现", flow.multis >= 2 && flow.choices >= 2, "multis=" + flow.multis + " choices=" + flow.choices);
      check("结局五张精神卡", flow.cards === 5, flow.cards);
      check("结局七名点名", flow.names === 7, flow.names);
      check("结局无渡船趟数", !/\/18 趟|船工 \d+ 人/.test(flow.text), flow.text.slice(0, 160));
      check("完整流程 ≤20 分钟", flow.ms <= 20 * 60 * 1000, Math.round(flow.ms / 1000) + "s");
      result.durationSec = Math.round(flow.ms / 1000);
    }
    if (args.mobile) {
      await openChapter("prologue", "p024");
      await waitVisible("#vn-multichoice");
      const stage = await page.evaluate(() => {
        const r = document.getElementById("stage").getBoundingClientRect();
        const c = document.getElementById("vn-multi-confirm").getBoundingClientRect();
        const o = document.querySelector(".xb-multi-option").getBoundingClientRect();
        return { stage: { w: r.width, h: r.height }, confirm: { w: c.width, h: c.height }, option: { w: o.width, h: o.height } };
      });
      check("844×390 舞台缩放入界", stage.stage.w <= 844 && stage.stage.h <= 390, JSON.stringify(stage.stage));
      check("确认按钮物理热区 ≥44px", stage.confirm.h >= 44, JSON.stringify(stage.confirm));
      check("多选选项物理热区 ≥44px", stage.option.h >= 44, JSON.stringify(stage.option));
      result.mobileStage = stage;
    }
  } catch (error) {
    result.error = String(error && error.stack || error);
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
