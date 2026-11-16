#!/usr/bin/env node
"use strict";
const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function loadPlaywright() {
  const p = path.join(ROOT, "my-playwright-project", "node_modules", "playwright-core");
  return require(p);
}
function mimeFor(file) {
  return { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".json": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8" }[path.extname(file).toLowerCase()] || "application/octet-stream";
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const args = process.argv.slice(2);
  const mode = (args.find((a) => a.startsWith("--mode=")) || "").split("=")[1] || "normal";
  const fileMode = args.includes("--file");
  const mobile = args.includes("--mobile");
  // 用户反馈的“界面延迟高”不只是网络慢：低端机/主线程阻塞时也要先出 LQIP。
  // 用 CDP 的 CPU 降速模拟，和 slow 模式叠加验证首屏。
  const cpuThrottle = Number((args.find((a) => a.startsWith("--cpu=")) || "").split("=")[1] || 0);
  const OUT = path.resolve((args.find((a) => a.startsWith("--out=")) || "").split("=")[1] || path.join(ROOT, "docs", "evidence", "artload-debug"));
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = loadPlaywright();
  let server = null;
  let base = "";
  if (!fileMode) {
    const started = await startServer();
    server = started.server;
    base = started.base;
  }
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const context = await browser.newContext({
    viewport: mobile ? { width: 844, height: 390 } : { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    hasTouch: mobile
  });
  const page = await context.newPage();
  if (cpuThrottle > 0) {
    const session = await context.newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottle });
  }
  const events = { console: [], pageErrors: [], failed: [], bgResponses: [], bgFinished: [] };
  page.on("console", (msg) => { if (["warning", "error"].includes(msg.type())) events.console.push(msg.type() + ": " + msg.text()); });
  page.on("pageerror", (err) => events.pageErrors.push(String(err && err.stack || err)));
  page.on("requestfailed", (req) => { if (req.url().includes("/assets/backgrounds/")) events.failed.push(req.url() + " :: " + (req.failure() ? req.failure().errorText : "?")); });
  page.on("response", (res) => {
    if (res.url().includes("/assets/backgrounds/")) events.bgResponses.push(res.status() + " " + res.url());
  });
  page.on("requestfinished", (req) => {
    if (req.url().includes("/assets/backgrounds/")) events.bgFinished.push(req.url());
  });
  if (mode === "slow") {
    await page.route("**/assets/backgrounds/**", async (route) => { await sleep(8000); await route.continue(); });
  } else if (mode === "abort" || mode === "recover" || mode === "scenes") {
    await page.route("**/assets/backgrounds/**", (route) => route.abort("failed"));
  }
  const titleMode = args.includes("--title");
  const query = titleMode ? "" : "?chapter=grass&node=g001&debug=1";
  const url = fileMode
    ? pathToFileURL(path.join(PROJECT, "index.html")).href + query
    : base + "/" + query;
  const started = Date.now();
  // slow 模式要测“图还没到”的首屏，不能等 load（那会等到所有延迟请求结束）。
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#stage", { state: "attached", timeout: 15000 });
  if (mode === "scenes") {
    const scenes = await page.evaluate(() => {
      const canvas = document.querySelector("#stage-art");
      return XB.art.SCENES.map((sceneId) => {
        const ok = XB.art.paint(canvas, sceneId);
        return {
          sceneId: sceneId,
          ok: ok,
          className: canvas.className,
          lqip: canvas.style.backgroundImage.indexOf("data:image/webp") !== -1,
          bgPrefix: canvas.style.backgroundImage.slice(0, 32)
        };
      });
    });
    fs.writeFileSync(path.join(OUT, "scenes.json"), JSON.stringify(scenes, null, 2));
    console.log(JSON.stringify(scenes, null, 2));
    await browser.close();
    if (server) server.close();
    return;
  }
  const snapshots = [];
  async function snap(label, waitMs) {
    if (waitMs) await sleep(waitMs);
    const data = await page.evaluate(() => {
      const art = document.querySelector("#stage-art");
      const card = document.querySelector("#vn-title-card");
      return {
        t: Math.round(performance.now()),
        artClass: art ? art.className : null,
        scene: art ? art.dataset.scene : null,
        artHidden: art ? art.hidden : null,
        hasLqip: art ? art.style.backgroundImage.indexOf("data:image/webp") !== -1 : false,
        bgPrefix: art ? art.style.backgroundImage.slice(0, 40) : null,
        bgBytes: art ? art.style.backgroundImage.length : 0,
        vnHidden: document.querySelector("#scene-vn").hidden,
        cardHidden: card ? card.hidden : null,
        chapter: (document.querySelector("#vn-chapter") || {}).textContent,
        text: (document.querySelector("#vn-text") || {}).textContent
      };
    });
    data.label = label;
    snapshots.push(data);
    await page.screenshot({ path: path.join(OUT, label + ".png") });
  }
  await snap("t0", 300);
  await snap("t1", 1000);
  await snap("t3", 2000);
  if (mode === "recover") {
    await page.unroute("**/assets/backgrounds/**");
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    try {
      await page.waitForFunction(() => {
        const art = document.querySelector("#stage-art");
        return !!art && art.classList.contains("is-photo");
      }, null, { timeout: 15000 });
    } catch (err) {
      events.console.push("warning: recover 等待 is-photo 超时");
    }
    await snap("recover", 0);
  }
  await snap("t9", 6000);
  await page.waitForTimeout(1500);
  await snap("t11", 0);
  const resources = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter((e) => e.name.includes("/assets/backgrounds/"))
    .map((e) => ({ name: e.name.split("/").slice(-2).join("/"), duration: Math.round(e.duration), transferSize: e.transferSize, initiator: e.initiatorType })));
  const result = { mode, cpuThrottle, url, startedAt: new Date().toISOString(), elapsed: Date.now() - started, snapshots, resources, events };
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (server) server.close();
})().catch((err) => { console.error(err); process.exitCode = 1; });
