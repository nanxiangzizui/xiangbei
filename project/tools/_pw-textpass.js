#!/usr/bin/env node
"use strict";

// 文本改版专项验证：超时叙事、行囊/状态、暂停状态记录、结局路线/命运句、存档标签、成就代价。
// 用法：node project/tools/_pw-textpass.js --url=http --out=docs/evidence/text-pass

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function parseArgs(argv) {
  const args = { url: "http", out: "", headed: false, mobile: false };
  argv.forEach((raw) => {
    const m = /^--([a-z]+)(?:=(.*))?$/.exec(raw);
    if (!m) return;
    if (m[1] === "headed") args.headed = m[2] === undefined || m[2] === "1";
    else if (m[1] in args) args[m[1]] = m[2] === undefined ? true : m[2];
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
    try { return { pw: require(candidate), resolved: candidate }; }
    catch (error) { /* 试下一个 */ }
  }
  throw new Error("找不到 playwright-core");
}
function mimeFor(file) {
  return {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
    ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp3": "audio/mpeg"
  }[path.extname(file).toLowerCase()] || "application/octet-stream";
}
async function startServer() {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname === "/") pathname = "/index.html";
    const file = path.resolve(PROJECT, "." + pathname);
    if (file !== PROJECT && !file.startsWith(PROJECT + path.sep)) { res.writeHead(403).end("forbidden"); return; }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end("not found"); return; }
      res.writeHead(200, { "Content-Type": mimeFor(file), "Cache-Control": "no-store" });
      res.end(data);
    });
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { server, base: "http://127.0.0.1:" + server.address().port };
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const { pw, resolved } = loadPlaywright();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "text-pass"));
  fs.mkdirSync(OUT, { recursive: true });
  const checks = [];
  const logLines = [];
  function log(text) { const line = new Date().toISOString() + " " + text; console.log(line); logLines.push(line); }
  function check(name, ok, detail) { const entry = { name, ok: !!ok, detail: detail === undefined ? "" : String(detail) }; checks.push(entry); log((entry.ok ? "PASS " : "FAIL ") + name + (entry.detail ? " | " + entry.detail : "")); return entry.ok; }

  let serverInfo = null;
  if (args.url === "http") serverInfo = await startServer();
  const baseUrl = args.url === "http" ? serverInfo.base + "/index.html" : pathToFileURL(path.join(PROJECT, "index.html")).href;
  log("playwright=" + resolved + " base=" + baseUrl);

  const browser = await pw.chromium.launch({ executablePath: EDGE, headless: !args.headed, args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
  const context = await browser.newContext({ viewport: args.mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 }, deviceScaleFactor: 1, hasTouch: !!args.mobile, locale: "zh-CN" });
  const page = await context.newPage();
  const logs = { consoleErrors: [], pageErrors: [], requestFailed: [], httpErrors: [] };
  page.on("console", (msg) => { if (msg.type() === "error") logs.consoleErrors.push(msg.text()); });
  page.on("pageerror", (error) => logs.pageErrors.push(String(error && error.stack || error)));
  page.on("requestfailed", (request) => logs.requestFailed.push(request.url()));
  page.on("response", (response) => { if (response.status() >= 400) logs.httpErrors.push(response.status() + " " + response.url()); });

  async function visible(selector) { const loc = page.locator(selector); if (await loc.count() === 0) return false; return loc.first().isVisible().catch(() => false); }
  async function waitVisible(selector, timeout) { const deadline = Date.now() + (timeout || 8000); while (Date.now() < deadline) { if (await visible(selector)) return true; await sleep(100); } return false; }
  async function scene() { return page.evaluate(() => document.querySelector("#stage").dataset.scene); }
  async function shot(name) {
    const file = path.join(OUT, name + ".png");
    await page.screenshot({ path: file });
    return path.relative(ROOT, file).replace(/\\/g, "/");
  }
  async function goto(query) { await page.goto(baseUrl + query, { waitUntil: "load" }); await page.waitForSelector("#stage", { state: "attached", timeout: 12000 }); await sleep(450); }
  async function text(sel) { const loc = page.locator(sel); if (await loc.count() === 0) return ""; return (await loc.first().innerText()).trim(); }

  // A. 泸定入场：HUD 行囊/状态原因 + 暂停状态记录
  await goto("?reset=1&chapter=luding&node=l001");
  await waitVisible("#scene-vn", 8000);
  await sleep(900);
  const packButton = await text("#vn-pack-button");
  check("HUD 写行囊与格", /行囊/.test(packButton) && /格/.test(packButton), packButton);
  await page.click(".vn-pause");
  check("暂停打开", await waitVisible("#pause", 3000));
  const logSummary = await text("#pause-status-log summary");
  check("暂停有本周目状态记录", logSummary === "本周目状态记录", logSummary);
  await page.click("#pause-status-log summary");
  await sleep(350);
  const statusLines = await page.locator("#pause-status-log-list li").allInnerTexts();
  check("状态记录三条同伴原因", statusLines.length === 3 && statusLines.every((line) => /连续行军/.test(line)), statusLines.join(" | "));
  await shot("01-hud-status-log");
  await page.click('#pause [data-action="resume"]');

  // A2. 草地状态下降：HUD 的状态名后带短原因
  await goto("?chapter=grass&node=g027a");
  await waitVisible("#scene-vn", 8000);
  await sleep(1200);
  const grassCondition = await text("#vn-condition");
  check("HUD 状态带下降原因", /勉强/.test(grassCondition) && /草地走到第七天/.test(grassCondition), grassCondition);
  await shot("01b-hud-reason");

  // B. 限时超时：叙事句替换提示，停留约 2 秒，不弹系统 toast
  await goto("?chapter=luding&node=l027");
  check("直达限时选项", await waitVisible("#vn-choices .xb-choice", 8000));
  const promptBefore = await text("#vn-choice-prompt");
  check("选项前有当前处境", promptBefore.length > 4, promptBefore);
  const stakesBefore = await text("#vn-choice-stakes");
  check("选项前有代价提示", /写错/.test(stakesBefore), stakesBefore);
  await shot("02-choice-before");
  const deadline = Date.now() + 16000;
  let timed = false;
  while (Date.now() < deadline) {
    if (await page.locator("#vn-choice-head.is-timeout").count()) { timed = true; break; }
    await sleep(150);
  }
  check("超时进入叙事反馈", timed);
  const timeoutPrompt = await text("#vn-choice-prompt");
  check("超时文案为剧情句", /握着笔|纸洇开/.test(timeoutPrompt), timeoutPrompt);
  const stakesHidden = await page.locator("#vn-choice-stakes").evaluate((el) => el.hidden && getComputedStyle(el).display === "none");
  check("超时后隐藏代价提示", stakesHidden);
  check("超时不弹系统 toast", await page.locator(".xb-toast").count() === 0, await page.locator(".xb-toast").count());
  await shot("03-choice-timeout");
  await sleep(2300);
  check("超时约 2 秒后继续", await page.locator("#vn-choice-head.is-timeout").count() === 0 && (await text("#vn-text")).length > 0, await text("#vn-text"));

  // C. 成就代价：p021 A -> 暂停成就详情
  await goto("?reset=1&chapter=prologue&node=p021");
  check("门板选择出现", await waitVisible("#vn-choices .xb-choice", 8000));
  await page.locator('#vn-choices [data-key="A"]').click();
  await sleep(900);
  await page.click(".vn-pause");
  await waitVisible("#pause", 3000);
  await page.click('#pause [data-action="achievements"]');
  check("成就面板打开", await waitVisible("#achievement-panel", 5000));
  const unlockedCard = page.locator('.xb-achievement-card.is-unlocked[data-id="p021-A"]');
  check("门板成就在本局解锁", await unlockedCard.count() === 1);
  await unlockedCard.click();
  check("成就详情打开", await waitVisible("#achievement-detail", 4000));
  const detail = await text("#achievement-detail");
  check("成就详情有章与代价", /序章/.test(detail) && /代价：/.test(detail) && /多背三十斤/.test(detail), detail.slice(0, 220));
  await shot("04-achievement-cost");
  await page.click("#achievement-detail-close");
  await page.click("#achievement-close");
  await page.click('#pause [data-action="save"]');
  await sleep(600);
  await page.click('#pause [data-action="pause-title"]');
  await sleep(600);
  await page.click('#title-menu [data-action="saves"]');
  check("存档面板打开", await waitVisible("#saves-panel", 5000));
  const unfinishedMain = await text(".xb-saves__row-main");
  const unfinishedSub = await text(".xb-saves__row-sub");
  check("未完结存档主行含章与未完结", /未完结/.test(unfinishedMain), unfinishedMain);
  check("未完结存档副行含最后选择与时间", /最后：/.test(unfinishedSub) && /\d{2}-\d{2} \d{2}:\d{2}/.test(unfinishedSub), unfinishedSub);
  await shot("05-save-unfinished");

  // D. 结局：8/11 两人成行 + 动态短描述/命运句/收束句 + 已完成存档标签
  await page.click("#saves-close");
  await goto("?dev=1&reset=1");
  await page.click("#dev-toggle");
  await waitVisible("#dev-panel", 4000);
  await page.click('#dev-routes [data-route="no_door_two"]');
  await waitVisible("#codex", 10000).catch(() => false);
  if (await visible("#codex")) await page.click("#codex-close");
  const endingReached = await (async () => { const until = Date.now() + 10000; while (Date.now() < until) { if ((await scene()) === "ending") return true; await sleep(150); } return false; })();
  check("8/11 到达结局", endingReached, await scene());
  await sleep(1200);
  const routeText = await text("#ending-route");
  const summaryText = await text("#ending-summary");
  const fatesText = await text("#ending-fates");
  const closingText = await text("#ending-closing");
  check("结局标题为 8/11 两人成行", /8\/11/.test(routeText) && /两人成行/.test(routeText), routeText);
  check("结局短描述写两个人到达", /两个人/.test(summaryText) && /吴起/.test(summaryText), summaryText);
  check("命运句写到达与未到达", !/门板/.test(fatesText) && /到了/.test(fatesText) && /没能走到吴起/.test(fatesText), fatesText);
  check("结局收束句写替两个人挡路", /两个人/.test(closingText) && /挡过/.test(closingText), closingText);
  await shot("06-ending-no-door-two");
  await page.click("#ending-home");
  await sleep(700);
  await page.click('#title-menu [data-action="saves"]');
  await waitVisible("#saves-panel", 5000);
  const allMain = await page.locator(".xb-saves__row-main").allInnerTexts();
  const allSub = await page.locator(".xb-saves__row-sub").allInnerTexts();
  check("已完结存档主行含结局编号与路线", allMain.some((line) => /8\/11/.test(line) && /两人成行/.test(line)), allMain.join(" | "));
  check("已完结存档副行含章与时间", allSub.some((line) => /草地|吴起|终章/.test(line) && /\d{2}-\d{2} \d{2}:\d{2}/.test(line)), allSub.join(" | "));
  await shot("07-save-finished");

  // E. 1/11 路线名
  await page.click("#saves-close");
  await goto("?dev=1");
  await page.click("#dev-toggle");
  await waitVisible("#dev-panel", 4000);
  await page.click('#dev-routes [data-route="door_excellent"]');
  await waitVisible("#codex", 10000).catch(() => false);
  if (await visible("#codex")) await page.click("#codex-close");
  const reached1 = await (async () => { const until = Date.now() + 10000; while (Date.now() < until) { if ((await scene()) === "ending") return true; await sleep(150); } return false; })();
  check("1/11 到达结局", reached1, await scene());
  await sleep(1200);
  const route1 = await text("#ending-route");
  const summary1 = await text("#ending-summary");
  const fates1 = await text("#ending-fates");
  const closing1 = await text("#ending-closing");
  check("1/11 标题门至人散", /门至人散/.test(route1), route1);
  check("1/11 短描述写一个人也没带回来", /一扇门/.test(summary1) && /不是一路的人/.test(summary1), summary1);
  check("1/11 命运句写三个都没到", !/门板/.test(fates1) && /一个也没到/.test(fates1), fates1);
  check("1/11 收束句回收娘的话", /娘说/.test(closing1) && /完整地背回来/.test(closing1), closing1);
  await shot("08-ending-door-excellent");

  const result = {
    ok: checks.every((c) => c.ok),
    checks,
    logs,
    screenshots: fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).sort()
  };
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(OUT, "run.log"), logLines.join("\n") + "\n");
  console.log("RESULT " + (result.ok ? "PASS" : "FAIL") + " " + checks.filter((c) => c.ok).length + "/" + checks.length);
  console.log(JSON.stringify(logs, null, 2));
  await browser.close();
  if (serverInfo) serverInfo.server.close();
  process.exit(result.ok && !logs.pageErrors.length && !logs.consoleErrors.length ? 0 : 1);
})().catch((error) => { console.error(error); process.exit(2); });
