#!/usr/bin/env node
"use strict";

// P3 分享卡 / 本周目统计 / 测试模式自动化。
// 用法：node project/tools/_pw-step20.js --url=http --out=docs/evidence/p3-share-stats-dev

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVES_KEY = "xiangbei.saves.v1";

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
function stamp() { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const { pw, resolved } = loadPlaywright();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "p3-share-stats-dev"));
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
  const context = await browser.newContext({ viewport: args.mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 }, deviceScaleFactor: 1, hasTouch: !!args.mobile, locale: "zh-CN", acceptDownloads: true });
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
  async function gotoTitle(query) { await page.goto(baseUrl + query, { waitUntil: "load" }); await page.waitForSelector("#stage", { state: "attached", timeout: 10000 }); await sleep(350); }
  async function finishDevRoute(routeId) {
    await gotoTitle("?dev=1");
    await page.click("#dev-toggle");
    await waitVisible("#dev-panel");
    await page.click('#dev-routes [data-route="' + routeId + '"]');
    await waitVisible("#codex", 10000);
    if (await visible("#codex")) { await page.click("#codex-close"); }
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if ((await scene()) === "ending") return true;
      await sleep(150);
    }
    return false;
  }

  await gotoTitle("?dev=1&reset=1");
  check("dev 开关仅在 ?dev=1 出现", await visible("#dev-toggle"));
  check("普通标题不显示测试模式", !(await visible("#dev-panel")));
  await shot("01-title-dev-toggle");
  await page.click("#dev-toggle");
  check("测试面板打开", await waitVisible("#dev-panel"));
  check("七章跳转", await page.locator("#dev-chapters [data-chapter]").count() === 7, await page.locator("#dev-chapters [data-chapter]").count());
  check("11 条结局预置", await page.locator("#dev-routes [data-route]").count() === 11, await page.locator("#dev-routes [data-route]").count());
  await shot("02-dev-panel");
  await page.keyboard.press("Escape");
  check("Esc 关闭测试面板", !(await visible("#dev-panel")));

  const started = await finishDevRoute("door_excellent");
  check("预置 1/11 直接到结局", started, "scene=" + await scene());
  const routeHeading = await page.locator("#ending-route").innerText();
  check("结局页显示 1/11", routeHeading.indexOf("1/11") !== -1, routeHeading);
  check("结局页有分享卡入口", await visible("#ending-share"));
  check("结局页有统计入口", await visible("#ending-run-stats"));

  // 结局细则在面板内滚动；先把底部入口滚到可视区，再走分享/统计。
  await page.locator("#ending-panel").evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await sleep(150);
  await page.click("#ending-share");
  check("分享卡打开", await waitVisible("#share-card"));
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector("#share-card-canvas");
    const ctx = c.getContext("2d");
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4 * 997) {
      if (data[i] < 200 || data[i+1] < 200 || data[i+2] < 200) ink += 1;
    }
    const css = getComputedStyle(c);
    return { width: c.width, height: c.height, cssWidth: parseFloat(css.width), cssHeight: parseFloat(css.height), ink, dataUrlLength: c.toDataURL("image/png").length };
  });
  check("分享卡 1080×1440", canvasInfo.width === 1080 && canvasInfo.height === 1440, JSON.stringify(canvasInfo));
  check("分享卡有内容", canvasInfo.ink > 10, "ink=" + canvasInfo.ink);
  check("分享卡预览约 330×440", Math.abs(canvasInfo.cssWidth - 330) <= 2 && Math.abs(canvasInfo.cssHeight - 440) <= 2, canvasInfo.cssWidth + "×" + canvasInfo.cssHeight);
  await shot("03-share-card");
  let downloaded = false;
  let downloadName = "";
  try {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.click("#share-download")]);
    downloadName = download.suggestedFilename();
    const target = path.join(OUT, "share-card-download.png");
    await download.saveAs(target);
    const bytes = fs.statSync(target).size;
    downloaded = bytes > 10000;
    check("分享卡可保存 PNG", downloaded, downloadName + " / " + bytes + " B");
  } catch (error) {
    check("分享卡可保存 PNG", false, String(error && error.message || error));
  }
  await page.keyboard.press("Escape");
  check("Esc 关闭分享卡", !(await visible("#share-card")));
  check("关闭后焦点回分享入口", await page.evaluate(() => document.activeElement && document.activeElement.id) === "ending-share", await page.evaluate(() => document.activeElement && document.activeElement.id));

  await page.click("#ending-run-stats");
  check("本周目统计打开", await waitVisible("#run-stats"));
  check("统计七段", await page.locator("#run-stats-chapters .xb-runstats__chip").count() === 7, await page.locator("#run-stats-chapters .xb-runstats__chip").count());
  check("统计五名同伴", await page.locator("#run-stats-fates .xb-runstats__chip").count() === 5, await page.locator("#run-stats-fates .xb-runstats__chip").count());
  check("统计七条点名", await page.locator("#run-stats-names li").count() === 7, await page.locator("#run-stats-names li").count());
  check("统计五张精神卡", await page.locator("#run-stats-cards .xb-runstats__chip").count() === 5, await page.locator("#run-stats-cards .xb-runstats__chip").count());
  const statsText = await page.locator("#run-stats-panel").innerText();
  check("统计写清门板去向", statsText.indexOf("门板到了吴起") !== -1, statsText.slice(0, 80));
  check("统计写清救人/状态", statsText.indexOf("救了 0 人") !== -1 && statsText.indexOf("优秀") !== -1, "");
  check("统计不做完成度百分比", !/[0-9]+\s*%/.test(statsText) && statsText.indexOf("不做完成度百分比") !== -1, "");
  await shot("04-run-stats");
  await page.keyboard.press("Escape");
  check("Esc 关闭统计", !(await visible("#run-stats")));

  await gotoTitle("?dev=1");
  await page.click("#dev-toggle");
  await page.click('#dev-chapters [data-chapter="xiangjiang"]');
  await sleep(500);
  const chapterText = await page.evaluate(() => document.querySelector("#vn-chapter").textContent);
  check("测试模式跳章到湘江", chapterText.indexOf("湘江") !== -1 && (await scene()) === "vn", chapterText + " / scene=" + (await scene()));

  const result = { urlMode: args.url, checks, logs, canvasInfo, downloadName, runAt: new Date().toISOString() };
  result.failed = checks.filter((item) => !item.ok).map((item) => item.name);
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(OUT, "run.log"), logLines.join("\n") + "\n");
  log("SUMMARY " + (checks.length - result.failed.length) + "/" + checks.length + " passed; consoleErrors=" + logs.consoleErrors.length + " pageErrors=" + logs.pageErrors.length + " requestFailed=" + logs.requestFailed.length + " httpErrors=" + logs.httpErrors.length);
  await browser.close();
  if (serverInfo) serverInfo.server.close();
  process.exit(result.failed.length === 0 && !logs.pageErrors.length ? 0 : 1);
})().catch((error) => { console.error(error); process.exit(1); });
