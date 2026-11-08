const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");
const { chromium } = require("C:\\Users\\nanxiangzi\\AppData\\Local\\Temp\\xb-step5-pw\\node_modules\\playwright-core");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PROJECT = path.resolve(__dirname, "..");
const INDEX = pathToFileURL(path.join(PROJECT, "index.html")).href;
const OUT = path.resolve(PROJECT, "..", "docs", "evidence", "step-06");
const SAVE_KEY = "xiangbei.save.v1";
const PROGRESS = path.join(OUT, "_pw-step6.log");
const errors = [];
const checks = [];
function log(text) { const line = new Date().toISOString() + " " + text; console.log(line); fs.appendFileSync(PROGRESS, line + "\n"); }
function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
function check(name, ok, detail) { checks.push({ name: name, ok: !!ok, detail: detail === undefined ? "" : String(detail) }); log((ok ? "CHECK OK " : "CHECK FAIL ") + name + (detail ? " :: " + detail : "")); }
function fullEnding() {
  return {
    stats: { companyStart: 104, companyEnd: 19, redStart: 86000, redEnd: 7000 },
    names: [
      { id: "he", name: "何指导员", status: "remote" },
      { id: "ximei", name: "细妹", status: "self" },
      { id: "lin", name: "林先生", status: "self" },
      { id: "zhou", name: "老周", status: "missed" },
      { id: "zaowang", name: "灶王", status: "missed" },
      { id: "feimao", name: "飞毛腿", status: "missed" },
      { id: "dongsheng", name: "冬生", status: "self" }
    ],
    answered: 0,
    missed: 3,
    cards: [
      { id: "ideal", lit: false, line: "火种，剩得不多了。" },
      { id: "sacrifice", lit: false, line: "桥头那一步，没人替你走。" },
      { id: "truth", lit: false, line: "错的那几条，还没认全。" },
      { id: "overall", lit: false, line: "先过江的人，替后面的人争了时间。" },
      { id: "people", lit: false, line: "名字没抄全。" }
    ]
  };
}
async function seed(page, flags, opts) {
  const options = opts || {};
  const state = {
    version: 1,
    scene: options.scene || "title",
    chapterId: options.chapterId || "prologue",
    nodeId: options.nodeId || null,
    flags: flags || {},
    inventory: { door: !!(flags && flags["item.door"]), items: [] },
    choices: options.choices || [],
    codex: options.codex || [],
    settings: options.settings || {},
    unlockedChapters: ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
    ending: options.ending || null
  };
  await page.evaluate(function (pair) { localStorage.setItem(pair[0], pair[1]); }, [SAVE_KEY, JSON.stringify(state)]);
}
async function openPage(page, query, flags, opts) {
  await page.goto(INDEX);
  await seed(page, flags, opts);
  await page.goto(INDEX + (query || "?debug=1"));
  await page.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(400);
}
async function audio(page) { return page.evaluate(function () { return XB.audio.stats(); }); }
async function waitAudio(page, timeout) {
  await page.waitForFunction(function () { return XB.audio && XB.audio.stats().state !== "locked"; }, null, { timeout: timeout || 3000 });
}
async function saveState(page) { return page.evaluate(function (key) { return JSON.parse(localStorage.getItem(key) || "null"); }, SAVE_KEY); }
async function installFxLog(page) {
  await page.addInitScript(function () {
    window.__fxLog = [];
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (!record.target || !record.target.className) return;
        var id = record.target.id || record.target.tagName;
        window.__fxLog.push({ id: String(id), cls: String(record.target.className), t: Math.round(performance.now()) });
      });
    });
    observer.observe(document, { subtree: true, attributes: true, attributeFilter: ["class"] });
  });
}
async function openSettings(page) {
  await page.locator(".vn-pause").click();
  await sleep(160);
  await page.locator('#pause-menu [data-action="open-settings"]').click();
  await sleep(160);
}
async function closeSettings(page) {
  await page.locator('#vn-settings [data-action="close-settings"]').click();
  await sleep(120);
  await page.locator('#pause-menu [data-action="resume"]').click();
  await sleep(160);
}

const run = (async function () {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(PROGRESS, "");
  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--mute-audio=false"]
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(15000);
  page.on("console", function (msg) { if (msg.type() === "error") errors.push("CONSOLE " + msg.text()); });
  page.on("pageerror", function (err) { errors.push("PAGEERROR " + err.message); });
  await installFxLog(page);
  const result = {};

  log("B45 first gesture / no autoplay");
  await page.goto(INDEX + "?reset=1&debug=1");
  await page.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(300);
  result.beforeGesture = await audio(page);
  result.audioTags = await page.locator("audio, video").count();
  check("B45 loaded locked", result.beforeGesture.state === "locked" && result.beforeGesture.ready === false, JSON.stringify(result.beforeGesture));
  check("B45 no audio element", result.audioTags === 0, result.audioTags);
  await page.screenshot({ path: path.join(OUT, "01-title-locked.png") });
  await page.locator('#title-menu [data-action="start"]').click();
  await sleep(350);
  await waitAudio(page);
  result.afterGesture = await audio(page);
  result.startScene = await page.locator("#stage").getAttribute("data-scene");
  result.startTitleCard = await page.locator("#vn-title-card").isVisible();
  check("B45 first click ready", result.afterGesture.state === "ready", JSON.stringify(result.afterGesture));
  check("B45 start enters VN", result.startScene === "vn" && result.startTitleCard === true, result.startScene + "/card=" + result.startTitleCard);
  await page.locator("#vn-title-card").click();
  await sleep(350);
  result.startBed = await audio(page);
  check("B45 VN bed yudu", result.startBed.bed === "yudu", result.startBed.bed);
  await page.screenshot({ path: path.join(OUT, "02-map-audio-ready.png") });

  log("B50 wipe transition");
  await page.goto(INDEX + "?reset=1&debug=1");
  await page.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(300);
  await page.locator('#title-menu [data-action="start"]').click();
  await sleep(60);
  result.wipeClass = await page.locator("#fx-layer").getAttribute("class");
  result.wipeDuration = await page.locator("#fx-layer .fx-wipe").evaluate(function (el) { return getComputedStyle(el).animationDuration; });
  check("B50 wipe class", /is-wiping/.test(result.wipeClass) && /is-night/.test(result.wipeClass), result.wipeClass);
  check("B50 wipe 480ms", result.wipeDuration === "0.48s", result.wipeDuration);
  await page.screenshot({ path: path.join(OUT, "03-wipe.png") });
  await sleep(650);
  result.wipeAfter = await page.locator("#fx-layer").getAttribute("class");
  check("B50 wipe clears", !/is-wiping/.test(result.wipeAfter), result.wipeAfter);

  log("B46 settings persistence");
  await openPage(page, "?chapter=prologue&node=p001&debug=1", {}, {});
  await page.locator(".vn-pause").click();
  await sleep(160);
  await page.locator('#pause-menu [data-action="open-settings"]').click();
  await sleep(180);
  await page.locator("#set-volume").evaluate(function (el) { el.value = "35"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.locator("#set-muted").click();
  await sleep(220);
  result.setSave = await saveState(page);
  result.setAudio = await audio(page);
  check("B46 volume saved 0.35", result.setSave.settings.volume === 0.35, result.setSave.settings.volume);
  check("B46 muted saved", result.setSave.settings.muted === true, result.setSave.settings.muted);
  check("B46 audio muted target", result.setAudio.muted === true && Math.abs(result.setAudio.volume - 0.35) < 0.001, JSON.stringify(result.setAudio));
  await page.screenshot({ path: path.join(OUT, "04-settings.png") });
  await page.goto(INDEX + "?chapter=prologue&node=p001&debug=1");
  await page.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(350);
  await page.locator(".vn-pause").click();
  await sleep(160);
  await page.locator('#pause-menu [data-action="open-settings"]').click();
  await sleep(180);
  result.reloadVolume = await page.locator("#set-volume").inputValue();
  result.reloadMuted = await page.locator("#set-muted").getAttribute("aria-checked");
  result.reloadAudio = await audio(page);
  check("B46 reload volume 35", result.reloadVolume === "35", result.reloadVolume);
  check("B46 reload muted true", result.reloadMuted === "true", result.reloadMuted);
  check("B46 reload audio values", result.reloadAudio.muted === true && Math.abs(result.reloadAudio.volume - 0.35) < 0.001, JSON.stringify(result.reloadAudio));
  await page.locator("#set-muted").click();
  await sleep(180);
  result.unmuted = await audio(page);
  check("B46 unmute updates target", result.unmuted.muted === false, result.unmuted.muted);
  await closeSettings(page);

  log("B47 bed mapping (17 scenes / 9 beds)");
  const bedCases = [
    { name: "title", query: "?debug=1", opts: {}, click: "blank", bed: "wind_title" },
    { name: "map", query: "?debug=1", opts: { scene: "map" }, click: "blank", bed: "wind_title" },
    { name: "yudu_river", query: "?chapter=prologue&node=p001&debug=1", opts: {}, click: "pause", bed: "yudu" },
    { name: "yudu_night", query: "?chapter=prologue&node=p006&debug=1", opts: {}, click: "pause", bed: "yudu" },
    { name: "xiangjiang_ford", query: "?chapter=xiangjiang&node=x001&debug=1", opts: {}, click: "pause", bed: "xiangjiang" },
    { name: "xiangjiang_dawn", query: "?chapter=xiangjiang&node=x019&debug=1", opts: {}, click: "pause", bed: "xiangjiang" },
    { name: "zunyi_hall", query: "?chapter=zunyi&node=z001&debug=1", opts: {}, click: "pause", bed: "zunyi" },
    { name: "zunyi_street", query: "?chapter=zunyi&node=z017&debug=1", opts: {}, click: "pause", bed: "zunyi" },
    { name: "jinsha_river", query: "?chapter=jinsha&node=j001&debug=1", opts: {}, click: "pause", bed: "jinsha" },
    { name: "jinsha_night", query: "?chapter=jinsha&node=j025&debug=1", opts: {}, click: "pause", bed: "jinsha" },
    { name: "luding_bridge", query: "?chapter=luding&node=l001&debug=1", opts: {}, click: "pause", bed: "luding" },
    { name: "luding_after", query: "?chapter=luding&node=l021&debug=1", opts: {}, click: "pause", bed: "luding" },
    { name: "grass_marsh", query: "?chapter=grass&node=g001&debug=1", opts: {}, click: "pause", bed: "grass" },
    { name: "grass_dawn", query: "?chapter=grass&node=g024&debug=1", opts: {}, click: "pause", bed: "grass" },
    { name: "wuqi_dawn", query: "?chapter=wuqi&node=w001&debug=1", opts: {}, click: "pause", bed: "wuqi" },
    { name: "wuqi_wall", query: "?chapter=wuqi&node=w017&debug=1", opts: {}, click: "pause", bed: "wuqi" },
    { name: "ending", query: "?debug=1", opts: { scene: "ending", chapterId: "wuqi", ending: fullEnding() }, click: "blank", bed: "ending" }
  ];
  const bedSeen = [];
  for (const item of bedCases) {
    await openPage(page, item.query, {}, item.opts);
    if (item.click === "pause") { await page.locator(".vn-pause").click(); await sleep(220); }
    else if (item.name === "ending") {
      await page.locator("#scene-ending").waitFor({ state: "visible", timeout: 3000 });
      await page.locator("#ending-codex").click();
      await sleep(220);
      await page.locator("#gallery-close").click();
      await sleep(220);
    }
    else { await page.mouse.click(8, 8); await sleep(220); }
    const stats = await audio(page);
    bedSeen.push({ name: item.name, bed: stats.bed, activeBeds: stats.activeBeds, state: stats.state });
    check("B47 " + item.name + " -> " + item.bed, stats.bed === item.bed, stats.bed + " / beds=" + stats.activeBeds);
    check("B47 " + item.name + " beds<=2", stats.activeBeds <= 2, stats.activeBeds);
  }
  result.beds = bedSeen;
  await openPage(page, "?chapter=prologue&node=p001&debug=1", {}, {});
  await page.locator(".vn-pause").click(); await sleep(220);
  await page.screenshot({ path: path.join(OUT, "05-bed-pause.png") });

  log("B48 duck / suspend");
  result.duckPause = (await audio(page)).duck;
  check("B48 pause duck 0.3", Math.abs(result.duckPause - 0.3) < 0.001, result.duckPause);
  await page.locator('#pause-menu [data-action="codex"]').click(); await sleep(220);
  await page.locator('#gallery-close').click(); await sleep(220);
  await page.locator('#pause-menu [data-action="resume"]').click(); await sleep(220);
  result.duckResume = (await audio(page)).duck;
  check("B48 resume duck 1", Math.abs(result.duckResume - 1) < 0.001, result.duckResume);
  await openPage(page, "?debug=1", {}, { codex: ["yudu"] });
  await page.mouse.click(8, 8); await sleep(180);
  await page.locator('#title-menu [data-action="codex"]').click(); await sleep(220);
  result.duckGallery = (await audio(page)).duck;
  check("B48 gallery duck 0.45", Math.abs(result.duckGallery - 0.45) < 0.001, result.duckGallery);
  await page.locator('#gallery-close').click(); await sleep(200);
  result.duckGalleryClosed = (await audio(page)).duck;
  check("B48 gallery close duck 1", Math.abs(result.duckGalleryClosed - 1) < 0.001, result.duckGalleryClosed);
  await openPage(page, "?chapter=prologue&node=p001&debug=1", {}, {});
  await page.mouse.click(8, 8); await sleep(220);
  await page.evaluate(function () {
    Object.defineProperty(document, "hidden", { configurable: true, get: function () { return true; } });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await sleep(300);
  result.hiddenState = await audio(page);
  result.hiddenPause = await page.locator("#pause").isVisible();
  check("B48 hidden suspends", result.hiddenState.state === "suspended", JSON.stringify(result.hiddenState));
  check("B48 hidden opens pause", result.hiddenPause === true, result.hiddenPause);
  await page.evaluate(function () {
    Object.defineProperty(document, "hidden", { configurable: true, get: function () { return false; } });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await sleep(300);
  result.visibleState = await audio(page);
  check("B48 visible resumes", result.visibleState.state === "ready", JSON.stringify(result.visibleState));

  log("B51 luding flash");
  await openPage(page, "?chapter=luding&node=l001&debug=1", {}, {});
  await page.mouse.click(8, 8); await sleep(300);
  result.fxLogLuding = await page.evaluate(function () { return window.__fxLog || []; });
  result.flashSeen = new Set(result.fxLogLuding.filter(function (entry) { return /is-flashing/.test(entry.cls); }).map(function (entry) { return entry.t; })).size;
  check("B51 luding flashes once", result.flashSeen === 1, result.flashSeen);
  result.flashSecond = await page.evaluate(function () { return XB.fx.flash(); });
  check("B51 flash gap rejects second", result.flashSecond === false, result.flashSecond);
  await page.screenshot({ path: path.join(OUT, "06-luding.png") });

  log("B49/B52 climb misses, shake, peak");
  await openPage(page, "?minigame=climb&debug=1", {}, {});
  await page.evaluate(function () {
    window.__peak = 0;
    window.__peakTimer = setInterval(function () { var p = XB.audio.stats().peak; if (p > window.__peak) window.__peak = p; }, 20);
    window.__shakeCalls = 0;
    var originalShake = XB.fx.shake;
    XB.fx.shake = function () { window.__shakeCalls += 1; return originalShake.apply(this, arguments); };
  });
  const canvas = page.locator("#minigame-canvas");
  await page.locator("#vn-minigame").waitFor({ state: "visible", timeout: 3000 });
  await page.mouse.click(640, 430);
  for (let i = 0; i < 22; i += 1) {
    await page.mouse.click(640, 430);
    await sleep(70);
  }
  await sleep(180);
  result.shakeCalls = await page.evaluate(function () { return window.__shakeCalls; });
  result.shakeLog = await page.evaluate(function () { return (window.__fxLog || []).filter(function (entry) { return entry.id === "stage" && /is-shaking/.test(entry.cls); }).length; });
  result.shakeDuration = await page.evaluate(function () { return getComputedStyle(document.documentElement).getPropertyValue("--dur-shake").trim() + " / " + XB.fx.LIMITS.shakeMs; });
  result.peak = await page.evaluate(function () { clearInterval(window.__peakTimer); return window.__peak; });
  result.climbSave = await saveState(page);
  check("B52 climb failure shakes", result.shakeCalls >= 1 && result.shakeLog >= 1, "calls=" + result.shakeCalls + " log=" + result.shakeLog);
  check("B52 shake 180ms", result.shakeDuration === "180ms / 180", result.shakeDuration);
  check("B49 peak < 0.99", result.peak < 0.99, result.peak);
  await page.screenshot({ path: path.join(OUT, "07-climb-result.png") });

  log("B53 ending strike");
  await openPage(page, "?debug=1", {}, { scene: "ending", chapterId: "wuqi", ending: fullEnding() });
  await page.mouse.click(8, 8); await sleep(250);
  await sleep(500);
  result.strikeRows = await page.locator("#ending-names li.is-missed.is-struck").count();
  result.strikeDelays = await page.locator("#ending-names li.is-missed").evaluateAll(function (rows) { return rows.map(function (row) { return row.style.getPropertyValue("--strike-delay"); }); });
  result.strikeAnim = await page.locator("#ending-names li.is-missed .xb-ending__name-text").first().evaluate(function (el) { return getComputedStyle(el, "::after").animationDuration + " / " + getComputedStyle(el, "::after").animationName; });
  result.strikeLine = await page.locator("#ending-names li.is-missed .xb-ending__name-text").first().evaluate(function (el) { return getComputedStyle(el).textDecorationLine; });
  result.strikeAgain = await page.evaluate(function () { return XB.fx.strike(); });
  check("B53 three missed rows struck", result.strikeRows === 3, result.strikeRows);
  check("B53 stagger 0/90/180", result.strikeDelays.join(",") === "0ms,90ms,180ms", result.strikeDelays.join(","));
  check("B53 strike 420ms", /0.42s/.test(result.strikeAnim), result.strikeAnim);
  check("B53 line-through fallback", /line-through/.test(result.strikeLine), result.strikeLine);
  check("B53 strike one shot", result.strikeAgain === false, result.strikeAgain);
  await page.screenshot({ path: path.join(OUT, "08-ending-strike.png") });
  await openPage(page, "?debug=1", {}, { scene: "ending", chapterId: "wuqi", ending: fullEnding(), settings: { reducedMotion: true } });
  await page.mouse.click(8, 8); await sleep(180);
  result.reducedRows = await page.locator("#ending-names li.is-missed.is-struck").count();
  result.reducedDelays = await page.locator("#ending-names li.is-missed").evaluateAll(function (rows) { return rows.map(function (row) { return row.style.getPropertyValue("--strike-delay"); }); });
  result.reducedAnim = await page.locator("#ending-names li.is-missed .xb-ending__name-text").first().evaluate(function (el) { return getComputedStyle(el, "::after").animationName + " / " + getComputedStyle(el, "::after").transform; });
  check("B53 reduced immediate strike", result.reducedRows === 3, result.reducedRows);
  check("B53 reduced delay 0", result.reducedDelays.join(",") === "0ms,0ms,0ms", result.reducedDelays.join(","));
  check("B53 reduced no animation", /none/.test(result.reducedAnim), result.reducedAnim);
  await page.screenshot({ path: path.join(OUT, "09-ending-reduced.png") });

  log("B56 minigame onCue + bed churn");
  await openPage(page, "?minigame=door&door=1&debug=1", {}, {});
  await page.evaluate(function () {
    window.__cues = [];
    const original = XB.audio.cue;
    XB.audio.cue = function (name) { window.__cues.push(name); return original.apply(this, arguments); };
  });
  await page.locator("#minigame-canvas").focus();
  await page.keyboard.press("1"); await sleep(300);
  result.doorCues = await page.evaluate(function () { return window.__cues.slice(); });
  check("B56 door-place cue", result.doorCues.indexOf("door-place") !== -1, result.doorCues.join(","));
  await page.keyboard.press("Enter"); await sleep(450);
  result.resultCues = await page.evaluate(function () { return window.__cues.slice(); });
  check("B56 result cue", result.resultCues.indexOf("result") !== -1, result.resultCues.join(","));
  await openPage(page, "?debug=1", {}, {});
  await page.mouse.click(8, 8); await sleep(220);
  const scenes = ["yudu_river", "xiangjiang_ford", "zunyi_hall", "jinsha_river", "luding_bridge", "grass_marsh", "wuqi_dawn", "yudu_night", "ending"];
  await page.evaluate(function (list) {
    list.forEach(function (name) { XB.audio.setScene(name); });
  }, scenes);
  await sleep(1100);
  result.churn = await audio(page);
  check("B56 bed churn <=2", result.churn.activeBeds <= 2, result.churn.activeBeds);
  check("B56 final bed ending", result.churn.bed === "ending", result.churn.bed);

  log("B54 mobile 844x390");
  const mobileContext = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const mobile = await mobileContext.newPage();
  mobile.on("console", function (msg) { if (msg.type() === "error") errors.push("MOBILE CONSOLE " + msg.text()); });
  mobile.on("pageerror", function (err) { errors.push("MOBILE PAGEERROR " + err.message); });
  await mobile.goto(INDEX + "?chapter=prologue&node=p001&debug=1");
  await mobile.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(400);
  result.mobileStage = await mobile.locator("#stage").boundingBox();
  await mobile.locator(".vn-pause").tap(); await sleep(220);
  result.mobilePause = await mobile.locator("#pause").isVisible();
  await mobile.locator('#pause-menu [data-action="open-settings"]').tap(); await sleep(220);
  result.mobileSettings = await mobile.locator("#vn-settings").isVisible();
  result.mobileAudio = await audio(mobile);
  check("B54 stage 693x390", Math.abs(result.mobileStage.width - 693) < 2 && Math.abs(result.mobileStage.height - 390) < 2, JSON.stringify(result.mobileStage));
  check("B54 touch pause/settings", result.mobilePause && result.mobileSettings, result.mobilePause + "/" + result.mobileSettings);
  check("B54 mobile audio ready", result.mobileAudio.state !== "locked", JSON.stringify(result.mobileAudio));
  await mobile.screenshot({ path: path.join(OUT, "10-mobile-settings.png") });
  await mobileContext.close();

  log("B55 local http");
  const server = http.createServer(function (req, res) {
    var urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    var file = path.join(PROJECT, urlPath.replace(/^\/+/, ""));
    if (file.indexOf(PROJECT) !== 0) { res.writeHead(403); res.end("forbidden"); return; }
    fs.readFile(file, function (err, data) {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      const ext = path.extname(file);
      const type = ext === ".html" ? "text/html; charset=utf-8" : ext === ".css" ? "text/css; charset=utf-8" : ext === ".js" ? "application/javascript; charset=utf-8" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      res.end(data);
    });
  });
  await new Promise(function (resolve) { server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  const httpPage = await context.newPage();
  httpPage.on("console", function (msg) { if (msg.type() === "error") errors.push("HTTP CONSOLE " + msg.text()); });
  httpPage.on("pageerror", function (err) { errors.push("HTTP PAGEERROR " + err.message); });
  await httpPage.goto("http://127.0.0.1:" + port + "/index.html?debug=1");
  await httpPage.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(400);
  result.httpBefore = await audio(httpPage);
  await httpPage.locator('#title-menu [data-action="start"]').click();
  await sleep(300);
  result.httpAfter = await audio(httpPage);
  check("B55 http loads", result.httpBefore.state === "locked", JSON.stringify(result.httpBefore));
  check("B55 http audio ready", result.httpAfter.state === "ready", JSON.stringify(result.httpAfter));
  await httpPage.screenshot({ path: path.join(OUT, "11-http.png") });
  await httpPage.close();
  await new Promise(function (resolve) { server.close(resolve); });

  result.errors = errors;
  check("B56 no console errors", errors.length === 0, errors.join(" | "));
  result.checks = checks;
  fs.writeFileSync(path.join(OUT, "_pw-step6.json"), JSON.stringify(result, null, 2));
  log("CHECKS " + checks.filter(function (c) { return c.ok; }).length + "/" + checks.length);
  console.log("CHECKS " + checks.filter(function (c) { return c.ok; }).length + "/" + checks.length);
  if (checks.some(function (c) { return !c.ok; })) console.log(JSON.stringify(checks.filter(function (c) { return !c.ok; }), null, 2));
  await browser.close();
  if (checks.some(function (c) { return !c.ok; })) process.exitCode = 2;
})();
module.exports = run.catch(function (err) { console.error("FAILED", err && err.stack || err); process.exit(1); });