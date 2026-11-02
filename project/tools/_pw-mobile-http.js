
const path = require("path");
const fs = require("fs");
const http = require("http");
const { chromium } = require("C:\\Users\\nanxiangzi\\AppData\\Local\\Temp\\xb-step5-pw\\node_modules\\playwright-core");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(__dirname, "..", "..", "docs", "evidence", "step-05");
const SAVE_KEY = "xiangbei.save.v1";
const PROGRESS = path.join(OUT, "_pw-mobile-http.log");
const checks = [];
function log(text) { const line = new Date().toISOString() + " " + text; console.log(line); fs.appendFileSync(PROGRESS, line + "\n"); }
function check(name, ok, detail) { checks.push({ name, ok: !!ok, detail }); log("CHECK " + (ok ? "OK" : "FAIL") + " " + name + (detail === undefined ? "" : " :: " + detail)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function mime(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

(async () => {
  fs.writeFileSync(PROGRESS, "");
  const evidence = JSON.parse(fs.readFileSync(path.join(OUT, "_pw-extra.json"), "utf8"));
  const endingSave = evidence.endingSave;
  check("ending snapshot read from evidence", endingSave && endingSave.scene === "ending", endingSave && endingSave.scene);

  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = path.resolve(ROOT, relative);
    if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, "index.html")) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "Content-Type": mime(file), "Cache-Control": "no-store" });
      res.end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = "http://127.0.0.1:" + port + "/";
  log("http " + base);

  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"], timeout: 15000 });
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });
  page.on("dialog", (d) => d.accept());
  page.setDefaultTimeout(8000);

  await page.goto(base + "?debug=1", { waitUntil: "load" });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(endingSave)]);
  await page.reload({ waitUntil: "load" });
  await page.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(900);

  check("http scene is ending", await page.locator("#scene-ending").isVisible());
  const cardCount = await page.locator(".xb-ending__card").count();
  const nameCount = await page.locator(".xb-ending__name").count();
  check("mobile ending five cards", cardCount === 5, cardCount);
  check("mobile ending seven names", nameCount === 7, nameCount);
  const stageBox = await page.locator("#stage").boundingBox();
  const panelBox = await page.locator("#ending-panel").boundingBox();
  log("stage " + JSON.stringify(stageBox) + " panel " + JSON.stringify(panelBox));
  check("stage fits 844x390", stageBox && stageBox.width <= 845 && stageBox.height <= 391, JSON.stringify(stageBox));
  check("ending panel inside viewport", panelBox && panelBox.x >= 0 && panelBox.y >= 0 && panelBox.x + panelBox.width <= 844 && panelBox.y + panelBox.height <= 390, JSON.stringify(panelBox));
  const overflowing = await page.evaluate(() => Array.from(document.querySelectorAll("#ending-panel *")).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1 || r.top < -1 || r.bottom > window.innerHeight + 1); }).map((el) => el.className || el.id).slice(0, 8));
  check("no ending descendants outside viewport", overflowing.length === 0, JSON.stringify(overflowing));
  await page.screenshot({ path: path.join(OUT, "13-mobile-ending.png") });

  await page.locator("#ending-codex").tap(); await sleep(350);
  check("touch opens gallery", await page.locator("#codex-gallery").isVisible());
  check("mobile gallery seven cards", await page.locator(".xb-gallery__card").count() === 7);
  await page.screenshot({ path: path.join(OUT, "14-mobile-gallery.png") });
  await page.locator("#gallery-close").tap(); await sleep(250);
  check("touch closes gallery", !(await page.locator("#codex-gallery").isVisible()));

  await page.locator("#ending-home").tap(); await sleep(350);
  check("touch ending home returns title", await page.locator("#scene-title").isVisible());
  await page.screenshot({ path: path.join(OUT, "15-mobile-title.png") });

  const startBox = await page.locator('#title-menu [data-action="start"]').boundingBox();
  await page.touchscreen.tap(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
  await sleep(1600);
  check("touch starts new game", await page.locator("#scene-vn").isVisible());
  const firstText = await page.locator("#vn-text").innerText().catch(() => "");
  check("first line after touch start", /1934/.test(firstText), firstText);
  await page.screenshot({ path: path.join(OUT, "16-mobile-prologue.png") });

  check("no console errors", errors.length === 0, errors.join(" | "));
  fs.writeFileSync(path.join(OUT, "_pw-mobile-http.json"), JSON.stringify({ checks, stageBox, panelBox, overflowing, errors }, null, 2));
  console.log("CHECKS " + checks.filter(c => c.ok).length + "/" + checks.length);
  console.log(JSON.stringify(checks.filter(c => !c.ok), null, 2));
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  if (checks.some(c => !c.ok)) process.exitCode = 2;
})().catch((err) => { console.error("FAILED", err && err.stack || err); process.exit(1); });
