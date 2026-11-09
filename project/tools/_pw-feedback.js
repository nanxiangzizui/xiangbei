#!/usr/bin/env node
"use strict";

// 评审反馈回归：P1 结局 1 真实可达、P3 分享卡间距/最后一步、P4 新档 HUD 残留、状态原因收起。
// 用法：node project/tools/_pw-feedback.js --url=http --out=docs/evidence/feedback
//      node project/tools/_pw-feedback.js --url=file --out=docs/evidence/feedback-file

const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVES_KEY = "xiangbei.saves.v1";

function parseArgs(argv) {
  const args = { url: "http", out: "", headed: false };
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
    try { return require(candidate); } catch (error) { /* next */ }
  }
  throw new Error("找不到 playwright-core");
}
function mimeFor(file) {
  return {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2",
    ".mp3": "audio/mpeg"
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
function stamp() { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const pw = loadPlaywright();
  const runId = "feedback-" + args.url + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "feedback", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const checks = [];
  const logLines = [];
  function log(text) { const line = new Date().toISOString() + " " + text; console.log(line); logLines.push(line); }
  function check(name, ok, detail) { const entry = { name, ok: !!ok, detail: detail === undefined ? "" : String(detail) }; checks.push(entry); log((entry.ok ? "PASS " : "FAIL ") + name + (entry.detail ? " | " + entry.detail : "")); return entry.ok; }

  const serverInfo = args.url === "http" ? await startServer() : null;
  const baseUrl = args.url === "http" ? serverInfo.base + "/index.html" : pathToFileURL(path.join(PROJECT, "index.html")).href;
  log("base=" + baseUrl + " out=" + OUT);

  const browser = await pw.chromium.launch({
    executablePath: EDGE,
    headless: !args.headed,
    args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"]
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    locale: "zh-CN",
    acceptDownloads: true
  });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
  page.on("requestfailed", (req) => { if (!/audio/i.test(req.url())) failed.push(req.url()); });

  async function visible(selector) {
    const loc = page.locator(selector);
    if (await loc.count() === 0) return false;
    return loc.first().isVisible().catch(() => false);
  }
  async function waitVisible(selector, timeout) {
    const deadline = Date.now() + (timeout || 8000);
    while (Date.now() < deadline) { if (await visible(selector)) return true; await sleep(100); }
    return false;
  }
  async function text(selector) { return page.$eval(selector, (el) => el.textContent.replace(/\s+/g, " ").trim()); }
  async function shot(name) { await page.screenshot({ path: path.join(OUT, name + ".png") }); }
  async function scene() { return page.evaluate(() => document.querySelector("#stage").dataset.scene); }
  async function boot(query) {
    await page.goto(baseUrl + (query ? "?" + query : ""), { waitUntil: "load" });
    await page.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 10000 });
    await sleep(420);
  }
  async function click(selector) {
    const loc = page.locator(selector).first();
    await loc.click();
    await sleep(150);
  }
  async function resumeSeededSlot() {
    await click('#title-menu [data-action="saves"]');
    if (!(await waitVisible("#saves-panel"))) throw new Error("存档面板未打开");
    await click('#saves-list [data-action="save-slot"]');
    if (await waitVisible("#save-confirm", 2500)) await click("#save-confirm-yes");
    await sleep(700);
  }
  async function seedOldRun() {
    await page.evaluate(([key]) => {
      const settings = XB.core.DEFAULT_SETTINGS;
      const state = XB.core.defaults();
      state.version = 2;
      state.settings = JSON.parse(JSON.stringify(settings));
      state.scene = "vn";
      state.chapterId = "grass";
      state.nodeId = "g027";
      state.flags.condition = 3;
      state.flags.rescues = 0;
      state.flags.doorOutcome = "none";
      state.flags["had.door"] = false;
      state.flags["item.door"] = false;
      state.flags["grass.settled"] = false;
      state.flags["fate.player.dead"] = false;
      state.inventory.door = false;
      state.inventory.items = ["roster", "pencil"];
      state.unlockedChapters = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];
      const now = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify({
        version: 1,
        activeId: "slot-p4",
        settings: JSON.parse(JSON.stringify(settings)),
        slots: [{ id: "slot-p4", createdAt: now, updatedAt: now, state: XB.core.serialize(state) }]
      }));
    }, [SAVES_KEY]);
  }

  // ---- P4：上一局草地结算原因 → 回标题开新档，HUD 不得残留 ----
  await boot("debug=1&reset=1");
  await seedOldRun();
  await boot("debug=1");
  await resumeSeededSlot();
  check("P4 旧档进入草地", (await scene()) === "vn", "scene=" + await scene());
  let reasonLabel = "";
  const reasonDeadline = Date.now() + 12000;
  while (Date.now() < reasonDeadline) {
    if (await visible("#vn-title-card")) { await click("#vn-title-card"); continue; }
    if (await visible("#codex")) { await click("#codex-close"); continue; }
    if (await visible("#vn-dialogue")) {
      const label = await text("#vn-condition").catch(() => "");
      if (label.indexOf("断了粮") !== -1) { reasonLabel = label; break; }
      await click("#vn-dialogue");
      continue;
    }
    if (await visible("#vn-result")) { await click("#vn-result button"); continue; }
    await sleep(120);
  }
  check("P4 草地结算后 HUD 显示原因", reasonLabel.indexOf("断了粮") !== -1, reasonLabel);
  await shot("01-hud-reason-before-new");
  if (reasonLabel) {
    await sleep(6600);
    const collapsed = await text("#vn-condition");
    check("状态原因 6 秒后收起", collapsed.indexOf("断了粮") === -1, collapsed);
    await shot("02-hud-reason-collapsed");
  } else {
    check("状态原因 6 秒后收起", false, "未先出现原因，跳过折叠断言");
  }
  await click("#vn-condition");
  const pauseOpen = await waitVisible("#pause-menu", 3000);
  const logOpen = await page.$eval("#pause-status-log", (el) => el.open).catch(() => false);
  check("P4 点状态 HUD 打开本周目状态记录", pauseOpen && logOpen, "pause=" + pauseOpen + " log=" + logOpen);
  await shot("03b-status-log");
  await click('[data-action="pause-title"]');
  await waitVisible("#scene-title", 5000);
  await click('#title-menu [data-action="saves"]');
  await waitVisible("#saves-panel");
  await click("#save-new");
  await waitVisible("#save-confirm", 3000);
  await click("#save-confirm-yes");
  await sleep(260);
  const freshHud = await text("#vn-condition");
  check("P4 新档 HUD 立即为良好", freshHud.replace(/\s+/g, "") === "状态良好", freshHud);
  check("P4 新档 HUD 不残留草地原因", freshHud.indexOf("草地") === -1 && freshHud.indexOf("断了粮") === -1, freshHud);
  await shot("03-new-game-hud");

  // ---- P1：从新档真实走到 1/11，草地尽头用两件 +1 累计补满 ----
  const expected = ["A", "B", "B", "A", "A", "A", "A", "A", "C", "A", "B", "C", "C", "A"];
  let choiceIndex = 0;
  let doorPanelSeen = false;
  let doorKeys = [];
  let shoesHud = "";
  let comboHud = "";
  let usedShoes = false;
  let usedCombo = false;
  const started = Date.now();
  let guard = 0;
  while (Date.now() - started < 900000 && guard < 6000 && !(await visible("#scene-ending"))) {
    guard += 1;
    if (guard % 200 === 0) {
      const dbg = await page.$eval("#debug", (el) => el.textContent.replace(/\s+/g, " ").slice(0, 160)).catch(() => "");
      log("progress guard=" + guard + " choice=" + choiceIndex + " debug=" + dbg);
    }
    if (await visible("#vn-title-card")) { await click("#vn-title-card"); continue; }
    if (await visible("#codex")) { await click("#codex-close"); continue; }
    if (await visible("#bag-confirm-modal")) { await click("#bag-confirm-yes"); continue; }
    if (await visible("#door-modal")) {
      check("P1 真实路径不应出现门板舍弃", false, "在草地尽头被判门板留草地");
      await click("#door-discard");
      continue;
    }
    if (await visible("#danger-modal")) { await click("#danger-accept"); continue; }
    if (await visible("#pack-panel")) {
      const title = await text("#pack-title");
      if (title === "草地尽头") {
        doorPanelSeen = true;
        log("SURFACE 草地尽头 guard=" + guard + " choice=" + choiceIndex);
        if (!doorKeys.length) doorKeys = await page.$$eval('#pack-list [data-action="pack-use"]', (els) => els.map((el) => el.getAttribute("data-pack-use")));
        if (!usedShoes) {
          await shot("04-grass-end-pack-panel");
          const shoes = page.locator('#pack-list [data-action="pack-use"][data-pack-use="shoes"]');
          if (await shoes.count()) {
            await shoes.first().click();
            await sleep(280);
            shoesHud = await text("#vn-condition");
            usedShoes = true;
            await shot("05-grass-end-after-shoes");
          }
          continue;
        }
        if (!usedCombo) {
          const combo = page.locator('#pack-list [data-action="pack-use"][data-pack-use="barley+medicine"]');
          if (!(await combo.count())) {
            check("P1 草地尽头列出青稞+药组合", false, doorKeys.join(","));
            await click("#pack-close");
            continue;
          }
          await combo.first().click();
          await sleep(320);
          comboHud = await text("#vn-condition");
          usedCombo = true;
          await shot("06-grass-end-after-combo");
          continue;
        }
        await click("#pack-close");
        continue;
      }
      if (title === "出发前") { await click("#pack-close"); continue; }
      const close = page.locator("#pack-close");
      if (await close.isVisible().catch(() => false)) { await click("#pack-close"); continue; }
      if (await visible("#pack-continue")) { await click("#pack-continue"); continue; }
      continue;
    }
    if (await visible("#vn-multichoice")) {
      const ids = await page.$$eval("#vn-multi-options .xb-multi-option", (els) => els.map((el) => el.getAttribute("data-multi-id")));
      let wanted = [];
      if (ids.indexOf("xray") !== -1) wanted = ["xray", "press", "files"];
      else if (ids.indexOf("homepot") !== -1) wanted = ["shoes", "medicine", "barley"];
      else wanted = ids.filter((id) => id !== "roster" && id !== "pencil").slice(0, 3);
      log("MULTI guard=" + guard + " ids=" + ids.join(",") + " wanted=" + wanted.join(","));
      for (const id of wanted) {
        const option = page.locator('#vn-multi-options [data-multi-id="' + id + '"]');
        if (!(await option.count())) continue;
        const checked = await option.first().getAttribute("aria-checked");
        if (checked !== "true") await option.first().click();
        await sleep(80);
      }
      const confirm = page.locator("#vn-multi-confirm");
      if (await confirm.isDisabled()) { await sleep(250); continue; }
      await confirm.click();
      await sleep(620);
      continue;
    }
    if (await visible("#vn-choices")) {
      const want = expected[choiceIndex] || "A";
      const exact = page.locator('#vn-choices .xb-choice[data-key="' + want + '"]:not([disabled])');
      if (await exact.count()) {
        log("CHOICE guard=" + guard + " #" + (choiceIndex + 1) + "=" + want);
        await exact.first().click();
        choiceIndex += 1;
        await sleep(360);
        continue;
      }
      const available = await page.$$eval("#vn-choices .xb-choice:not([disabled])", (els) => els.map((el) => el.getAttribute("data-key")));
      check("P1 选择键符合预期", false, "第 " + (choiceIndex + 1) + " 次期望 " + want + "，可选 " + available.join(","));
      const fallback = page.locator("#vn-choices .xb-choice:not([disabled])").first();
      if (await fallback.count()) { await fallback.first().click(); choiceIndex += 1; await sleep(360); continue; }
    }
    if (await visible("#vn-interact")) {
      if (await visible("#interact-answer")) { await page.locator("#interact-answer").click().catch(() => {}); await sleep(240); }
      else await sleep(180);
      continue;
    }
    if (await visible("#vn-result")) { await click("#vn-result button"); continue; }
    if (await visible("#vn-dialogue")) { await click("#vn-dialogue"); continue; }
    await sleep(140);
  }
  check("P1 真实路径到达结局", await visible("#scene-ending"), "guard=" + guard + " seconds=" + Math.round((Date.now() - started) / 1000));
  check("P1 草地尽头物资窗出现", doorPanelSeen, "keys=" + doorKeys.join(","));
  check("P1 物资窗列出布鞋 +1", doorKeys.indexOf("shoes") !== -1, doorKeys.join(","));
  check("P1 物资窗列出青稞+药 +1", doorKeys.indexOf("barley+medicine") !== -1, doorKeys.join(","));
  check("P1 用布鞋后状态良好", shoesHud.indexOf("良好") !== -1, shoesHud);
  check("P1 再用青稞+药后状态优秀", comboHud.indexOf("优秀") !== -1, comboHud);
  check("P1 14 个单选全部按预期", choiceIndex === expected.length, "choiceIndex=" + choiceIndex);

  const routeHeading = (await text("#ending-route")).replace(/\s+/g, " ");
  check("P1 结局页为 1/11", routeHeading.indexOf("1/11") !== -1, routeHeading);
  check("P1 结局名为门至人散", routeHeading.indexOf("门至人散") !== -1, routeHeading);
  check("P1 点名 7 人", (await page.locator("#ending-names li").count()) === 7, await page.locator("#ending-names li").count());
  check("P1 五张精神卡", (await page.locator("#ending-cards .xb-ending__card").count()) === 5, await page.locator("#ending-cards .xb-ending__card").count());
  const snapshot = await page.evaluate(([key]) => {
    const store = JSON.parse(localStorage.getItem(key) || "null");
    if (!store || !store.activeId) return null;
    const slot = (store.slots || []).find((item) => item.id === store.activeId);
    return slot && slot.state.ending ? slot.state.ending : null;
  }, [SAVES_KEY]);
  check("P1 快照路线 door_excellent", !!(snapshot && snapshot.route === "door_excellent"), snapshot && snapshot.route);
  check("P1 快照状态优秀", !!(snapshot && snapshot.condition === 4), snapshot && snapshot.condition);
  check("P1 快照救 0 人", !!(snapshot && snapshot.rescues === 0), snapshot && snapshot.rescues);
  check("P1 快照最后一步", !!(snapshot && snapshot.lastChoice === "把门板留在吴起"), snapshot && snapshot.lastChoice);
  await shot("07-ending-1-11");

  // ---- P3：分享卡状态行/最后一步 ----
  await page.locator("#ending-panel").evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await sleep(200);
  await page.evaluate(() => {
    window.__shareTexts = [];
    const proto = CanvasRenderingContext2D.prototype;
    if (proto.__xbFeedbackPatched) return;
    const original = proto.fillText;
    proto.fillText = function (value) {
      if (this.canvas && this.canvas.id === "share-card-canvas") window.__shareTexts.push(String(value));
      return original.apply(this, arguments);
    };
    proto.__xbFeedbackPatched = true;
  });
  await click("#ending-share");
  check("P3 分享卡打开", await waitVisible("#share-card"));
  await sleep(400);
  const shareTexts = await page.evaluate(() => window.__shareTexts.slice());
  const shareJoined = shareTexts.join("\n");
  check("P3 状态行统一间距", shareJoined.indexOf("状态：优秀 · 救下 0 人") !== -1, shareTexts.filter((t) => t.indexOf("状态：") !== -1).join(" | "));
  check("P3 分享卡有最后一步", shareJoined.indexOf("最后一步：把门板留在吴起") !== -1, shareTexts.filter((t) => t.indexOf("最后一步") !== -1).join(" | "));
  await shot("08-share-card");
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector("#share-card-canvas");
    return { width: c.width, height: c.height, dataUrl: c.toDataURL("image/png").length };
  });
  check("P3 分享卡 1080×1440", canvasInfo.width === 1080 && canvasInfo.height === 1440, JSON.stringify(canvasInfo));
  try {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.click("#share-download")]);
    const target = path.join(OUT, "share-card.png");
    await download.saveAs(target);
    check("P3 分享卡可保存", fs.statSync(target).size > 10000, download.suggestedFilename() + " / " + fs.statSync(target).size + " B");
  } catch (error) {
    check("P3 分享卡可保存", false, String(error && error.message || error));
  }

  check("全程 0 console error", errors.length === 0, errors.slice(0, 6).join(" | "));
  check("全程 0 失败请求", failed.length === 0, failed.slice(0, 6).join(" | "));

  const passed = checks.filter((item) => item.ok).length;
  const result = {
    urlMode: args.url,
    checks,
    snapshot,
    doorKeys,
    shoesHud,
    comboHud,
    shareTexts,
    errors,
    failed,
    runAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(OUT, "run.log"), logLines.join("\n") + "\n");
  console.log("SUMMARY " + passed + "/" + checks.length + " · errors " + errors.length + " · failed " + failed.length);
  console.log("OUT " + OUT);
  await browser.close();
  if (serverInfo) serverInfo.server.close();
  process.exit(passed === checks.length && errors.length === 0 ? 0 : 1);
})().catch((error) => { console.error(error); process.exit(1); });
