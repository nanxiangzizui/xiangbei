#!/usr/bin/env node
"use strict";

// 步骤八发布包专项检查：制作名单入口、字体回退、fps、外部请求、PDF 可访问。
// 仅做步骤七未覆盖的发布项；完整 VN 流程仍用 _pw-step7.js。
// 用法：node project/tools/_pw-step8.js --project=dist/site --url=http --out=docs/evidence/step-08

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
let PROJECT = path.join(ROOT, "dist", "site");

function parseArgs(argv) {
  const args = { project: "", url: "http", out: "", mobile: false, headed: false };
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
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml"
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
  if (args.project) PROJECT = path.resolve(args.project);
  const { pw, resolved } = loadPlaywright();
  const runId = "step8-" + args.url + "-" + (args.mobile ? "mobile-" : "") + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-08", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const LOG = path.join(OUT, "run.log");
  const checks = [];
  const result = { runId, project: PROJECT, urlMode: args.url, mobile: args.mobile, playwright: resolved, checks, startedAt: new Date().toISOString() };

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
  const allowedOrigin = args.url === "http" ? serverInfo.base : "file://";
  log("playwright=" + resolved + " project=" + PROJECT + " base=" + baseUrl);

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
  const logs = { consoleErrors: [], pageErrors: [], requestFailed: [], httpErrors: [], external: [], fontRequests: [] };
  page.on("console", (msg) => { if (msg.type() === "error") logs.consoleErrors.push(msg.text()); });
  page.on("pageerror", (error) => logs.pageErrors.push(String(error && error.stack || error)));
  page.on("requestfailed", (request) => logs.requestFailed.push(request.url() + " :: " + (request.failure() ? request.failure().errorText : "?")));
  page.on("response", (response) => { if (response.status() >= 400) logs.httpErrors.push(response.status() + " " + response.url()); });
  page.on("request", (request) => {
    const url = request.url();
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(url)) logs.fontRequests.push(url);
    if (/^(file:|data:|blob:|about:)/.test(url)) return;
    if (serverInfo && url.startsWith(serverInfo.base)) return;
    if (!serverInfo && url.startsWith("file:")) return;
    logs.external.push(url);
  });

  async function gotoTitle(query) {
    await page.goto(baseUrl + (query || "?debug=1"), { waitUntil: "load" });
    await page.waitForSelector("#stage", { state: "attached", timeout: 10000 });
    await sleep(350);
  }
  async function shot(name) {
    const file = path.join(OUT, name + ".png");
    await page.screenshot({ path: file, fullPage: false });
    return path.relative(ROOT, file).replace(/\\/g, "/");
  }
  function stageScale() {
    return page.evaluate(() => {
      const stage = document.getElementById("stage");
      const rect = stage.getBoundingClientRect();
      return { width: rect.width, height: rect.height, scale: rect.width / 1280 };
    });
  }

  try {
    await gotoTitle("?debug=1&fonts=fallback");
    await page.waitForSelector("#scene-title", { state: "visible", timeout: 10000 });
    check("标题可见", await page.locator("#scene-title").isVisible());
    check("虚构声明存在", /人物虚构/.test(await page.locator(".title-version").innerText()));
    check("制作名单链接存在", await page.locator(".title-credits").count() === 1);
    const link = page.locator(".title-credits");
    check("制作名单链接可见", await link.isVisible());
    const href = await link.getAttribute("href");
    check("制作名单 href=./CREDITS.txt", href === "./CREDITS.txt", href);

    const box = await link.boundingBox();
    const stage = await stageScale();
    const logicalHeight = box ? box.height / stage.scale : 0;
    check("制作名单逻辑热区 ≥44px", logicalHeight >= 44, "logical=" + logicalHeight.toFixed(1) + "px, css=" + (box ? box.height.toFixed(1) : "?") + "px, scale=" + stage.scale.toFixed(3));
    if (args.mobile) {
      result.mobilePhysicalHit = box ? { width: Number(box.width.toFixed(1)), height: Number(box.height.toFixed(1)) } : null;
      log("MOBILE physical hit " + JSON.stringify(result.mobilePhysicalHit) + " (logical 100×44; B16 同类例外如 <44 physical)");
    }

    // 键盘焦点：从标题开始 Tab，直到链接获得焦点；同时确认 focus-visible 不会被 CSS 去掉。
    let focused = false;
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("Tab");
      const active = await page.evaluate(() => document.activeElement && document.activeElement.className || "");
      if (/title-credits/.test(active)) { focused = true; break; }
    }
    check("制作名单可键盘聚焦", focused);
    if (focused) {
      const focusStyle = await page.evaluate(() => {
        const el = document.activeElement;
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor };
      });
      check("制作名单焦点可见", focusStyle.outlineStyle !== "none" || focusStyle.outlineWidth !== "0px", JSON.stringify(focusStyle));
      await shot("title-credits-focus");
    }

    // 点击打开 CREDITS；file:// 与 http 都要求新标签。
    const popupPromise = context.waitForEvent("page", { timeout: 5000 }).catch(() => null);
    if (args.mobile) await link.tap(); else await link.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState("load").catch(() => {});
      const text = await popup.locator("body").innerText().catch(() => "");
      check("制作名单新标签打开", true, popup.url());
      check("CREDITS 含刘子政/虚构声明", /刘子政/.test(text) && /虚构人物/.test(text), text.slice(0, 80).replace(/\s+/g, " "));
      await popup.close();
    } else {
      check("制作名单新标签打开", false, "未捕获 popup；当前 URL=" + page.url());
    }
    await page.bringToFront();

    // 字体：本版不打包；只读 local()，缺失回退系统字体。字体请求必须为 0。
    const fonts = await page.evaluate(() => {
      const faces = [];
      document.fonts.forEach((face) => faces.push({ family: face.family, status: face.status, style: face.style, weight: face.weight }));
      const stage = document.getElementById("stage");
      return {
        bodyFamily: getComputedStyle(document.body).fontFamily,
        stageFamily: getComputedStyle(stage).fontFamily,
        titleFamily: getComputedStyle(document.querySelector(".title-logo") || stage).fontFamily,
        smiley: document.fonts.check('16px "Smiley Sans"'),
        wenkai: document.fonts.check('16px "LXGW WenKai"'),
        xbBody: document.fonts.check('16px "XB Body"'),
        xbTitle: document.fonts.check('16px "XB Title"'),
        fallbackYahei: document.fonts.check('16px "Microsoft YaHei"'),
        faces
      };
    });
    result.fonts = fonts;
    check("无字体文件请求", logs.fontRequests.length === 0, logs.fontRequests.join(" | "));
    check("正文有系统回退", /Microsoft YaHei|Songti|SimSun|Noto/i.test(fonts.stageFamily), fonts.stageFamily);
    check("字体声明不含外部 URL", fonts.faces.every((face) => !/https?:/.test(face.family)));
    await page.screenshot({ path: path.join(OUT, "title-fonts-fallback.png") });

    // 资源审计：Performance 里不应出现外部 origin。
    const resources = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
    const externalResources = resources.filter((url) => {
      if (url.startsWith("data:") || url.startsWith("blob:")) return false;
      if (args.url === "file") return !url.startsWith("file:");
      return !url.startsWith(serverInfo.base);
    });
    check("Performance 无外部资源", externalResources.length === 0, externalResources.join(" | "));
    result.resources = resources;

    // fps：标题 10 秒 + 游戏内 10 秒；只测标题页不足以代表 Canvas 负载。
    async function sampleFps(duration) {
      const frameData = await page.evaluate(async (ms) => {
        return await new Promise((resolve) => {
          const deltas = [];
          let last = performance.now();
          const start = last;
          function tick(now) {
            deltas.push(now - last);
            last = now;
            if (now - start < ms) requestAnimationFrame(tick);
            else resolve(deltas);
          }
          requestAnimationFrame(tick);
        });
      }, duration);
      const sorted = frameData.slice(1).sort((a, b) => a - b);
      const meanDelta = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] || 0;
      const minFps = 1000 / Math.max(1, sorted[sorted.length - 1] || 1);
      return {
        frames: sorted.length,
        meanFps: Number((1000 / meanDelta).toFixed(1)),
        p95FrameMs: Number(p95.toFixed(1)),
        minFps: Number(minFps.toFixed(1))
      };
    }

    result.fpsTitle = await sampleFps(10000);
    check("标题 fps 达到可玩阈值", result.fpsTitle.meanFps >= (args.mobile ? 30 : 50), JSON.stringify(result.fpsTitle));

    await page.goto(baseUrl + "?minigame=climb&debug=1", { waitUntil: "load" });
    await page.waitForSelector("#minigame-canvas", { state: "visible", timeout: 10000 });
    await sleep(400);
    result.fpsGame = await sampleFps(10000);
    check("游戏内 fps 达到可玩阈值", result.fpsGame.meanFps >= (args.mobile ? 30 : 50), JSON.stringify(result.fpsGame));
    log("FPS title=" + JSON.stringify(result.fpsTitle) + " game=" + JSON.stringify(result.fpsGame));

    // dist/site 的 CREDITS 与 PDF 必须可访问（HTTP），file:// 用 fs 检查。
    if (args.url === "http") {
      const creditsRes = await context.request.get(serverInfo.base + "/CREDITS.txt");
      const creditsBody = await creditsRes.text();
      check("HTTP CREDITS 200", creditsRes.status() === 200 && /刘子政/.test(creditsBody), creditsRes.status() + " " + creditsRes.headers()["content-type"]);
      const pdfRes = await context.request.get(serverInfo.base + "/design-note.pdf");
      const pdfBody = await pdfRes.body();
      check("HTTP design-note.pdf 200", pdfRes.status() === 200 && pdfBody.slice(0, 5).toString() === "%PDF-", pdfRes.status() + " " + pdfBody.length + "B");
    } else {
      const creditsText = fs.readFileSync(path.join(PROJECT, "CREDITS.txt"), "utf8");
      const pdfHead = fs.readFileSync(path.join(PROJECT, "design-note.pdf")).slice(0, 5).toString();
      check("file:// CREDITS 可读", /刘子政/.test(creditsText));
      check("file:// design-note.pdf 可读", pdfHead === "%PDF-", pdfHead);
    }

    check("0 console error", logs.consoleErrors.length === 0, logs.consoleErrors.join(" | "));
    check("0 pageerror", logs.pageErrors.length === 0, logs.pageErrors.join(" | "));
    check("0 404", logs.httpErrors.length === 0, logs.httpErrors.join(" | "));
    check("0 外部请求", logs.external.length === 0, logs.external.join(" | "));

    result.logs = logs;
    result.artifacts = { title: await shot("title"), screenshot: path.relative(ROOT, path.join(OUT, "title-fonts-fallback.png")).replace(/\\/g, "/") };
    result.finishedAt = new Date().toISOString();
    result.passed = checks.filter((c) => c.ok).length;
    result.failed = checks.filter((c) => !c.ok).length;
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
    log("RESULT " + result.passed + " passed / " + result.failed + " failed -> " + OUT);
    if (result.failed) process.exitCode = 2;
  } catch (error) {
    result.fatal = String(error && error.stack || error);
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
    console.error("FATAL", result.fatal);
    process.exitCode = 1;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    if (serverInfo) serverInfo.server.close();
  }
})().catch((error) => {
  console.error("FATAL", error && error.stack || error);
  process.exit(1);
});
