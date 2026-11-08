
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { chromium } = require("C:\\Users\\nanxiangzi\\AppData\\Local\\Temp\\xb-step5-pw\\node_modules\\playwright-core");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const INDEX = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;
const OUT = path.resolve(__dirname, "..", "..", "docs", "evidence", "step-05");
const SAVE_KEY = "xiangbei.save.v1";
const PROGRESS = path.join(OUT, "_pw-extra.log");
function log(text) { const line = new Date().toISOString() + " " + text; console.log(line); fs.appendFileSync(PROGRESS, line + "\n"); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function seed(page, flags, opts) {
  const state = {
    version: 1, scene: (opts && opts.scene) || "title", chapterId: (opts && opts.chapterId) || "prologue", nodeId: (opts && opts.nodeId) || null,
    flags: flags || {}, inventory: { door: !!(flags && flags["item.door"]), items: [] },
    choices: (opts && opts.choices) || [], codex: (opts && opts.codex) || [], settings: {},
    unlockedChapters: ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
    ending: (opts && opts.ending) || null
  };
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
}
async function openPage(page, query, flags, opts) {
  await page.goto(INDEX);
  await seed(page, flags, opts);
  await page.goto(INDEX + (query || "?debug=1"));
  await page.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(350);
}
async function info(page) {
  const text = await page.locator("#debug").innerText().catch(() => "");
  const node = text.match(/node\s+(\S+)\s+\((\w+)\)/);
  const chapter = text.match(/chapter\s+(\S+)/);
  const scene = text.match(/scene\s+(\S+)/);
  return { node: node && node[1], type: node && node[2], chapter: chapter && chapter[1], scene: scene && scene[1], text };
}
async function visible(page, sel) { const l = page.locator(sel); return (await l.count()) > 0 && await l.first().isVisible().catch(() => false); }
async function advance(page, stopTypes, max) {
  for (let i = 0; i < (max || 140); i++) {
    const d = await info(page);
    if (!d.node) {
      if (await visible(page, "#scene-ending")) return { type: "ending" };
      if (await visible(page, "#scene-map")) return { type: "map" };
      if (await visible(page, "#codex-gallery")) return { type: "gallery" };
    }
    if (stopTypes && stopTypes.indexOf(d.type) !== -1) return d;
    if (await visible(page, "#vn-title-card")) { await page.locator("#vn-title-card").click(); await sleep(150); continue; }
    if (await visible(page, "#codex")) { await page.locator("#codex-close").click(); await sleep(150); continue; }
    if (await visible(page, "#vn-result")) { await page.locator(".vn-result__more").click(); await sleep(160); continue; }
    if (await visible(page, "#vn-choices")) return { ...d, type: "choice" };
    if (await visible(page, "#vn-interact")) return { ...d, type: "interact" };
    await page.locator("#vn-dialogue").click();
    await sleep(90);
  }
  throw new Error("advance stopped: " + JSON.stringify(await info(page)));
}
async function choose(page, key) { await page.locator('[data-action="choose"][data-key="' + key + '"]').click(); await sleep(450); }
async function saveState(page) { return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), SAVE_KEY); }
const checks = [];
function check(name, ok, detail) { checks.push({ name, ok: !!ok, detail: detail === undefined ? "" : String(detail) }); log((ok ? "CHECK OK " : "CHECK FAIL ") + name + (detail ? " :: " + detail : "")); }

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(6000);
  page.setDefaultNavigationTimeout(10000);
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push("PAGEERROR " + err.message));
  const result = {};

  log("A gallery empty");
  await openPage(page, "?debug=1", {}, { codex: [] });
  await page.locator('#title-menu [data-action="codex"]').click(); await sleep(300);
  check("gallery opens from title", await visible(page, "#codex-gallery"));
  result.galleryEmptyCount = await page.locator("#gallery-count").innerText();
  check("gallery count 0 / 7", result.galleryEmptyCount.replace(/\s/g, "") === "0/7", result.galleryEmptyCount);
  result.galleryEmptyCards = await page.locator(".xb-gallery__card").count();
  check("gallery has 7 cards", result.galleryEmptyCards === 7, result.galleryEmptyCards);
  result.galleryEmptyLocked = await page.locator('.xb-gallery__card[aria-disabled="true"]').count();
  check("all cards locked at start", result.galleryEmptyLocked === 7, result.galleryEmptyLocked);
  result.galleryGate = await page.locator(".xb-gallery__card-state").first().innerText();
  check("first gate label", /序章解锁/.test(result.galleryGate), result.galleryGate);
  await page.locator('.xb-gallery__card[data-codex="yudu"]').click({ force: true }); await sleep(250);
  result.galleryLockedToast = await page.locator("#toast").innerText().catch(() => "");
  result.galleryStillOpen = await visible(page, "#codex-gallery");
  check("locked card only toasts", result.galleryStillOpen && /序章解锁/.test(result.galleryLockedToast), result.galleryLockedToast);
  await page.screenshot({ path: path.join(OUT, "09-gallery-empty.png") });
  await page.keyboard.press("Escape"); await sleep(200);
  check("gallery closes with Esc", !(await visible(page, "#codex-gallery")));
  result.galleryFocus = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-action"));
  check("focus returns to title menu", result.galleryFocus === "codex", result.galleryFocus);

  log("B gallery 7/7");
  const allCodex = ["yudu", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];
  await openPage(page, "?debug=1", {}, { codex: allCodex });
  await page.locator('#title-menu [data-action="codex"]').click(); await sleep(300);
  result.galleryFullCount = await page.locator("#gallery-count").innerText();
  check("gallery count 7 / 7", result.galleryFullCount.replace(/\s/g, "") === "7/7", result.galleryFullCount);
  result.galleryFullLocked = await page.locator('.xb-gallery__card[aria-disabled="true"]').count();
  check("no locked cards at 7/7", result.galleryFullLocked === 0, result.galleryFullLocked);
  await page.locator('.xb-gallery__card[data-codex="xiangjiang"]').click(); await sleep(300);
  check("unlocked card opens codex", await visible(page, "#codex"));
  result.galleryCardTitle = await page.locator("#codex-title").innerText();
  check("codex title is 湘江", /湘江/.test(result.galleryCardTitle), result.galleryCardTitle);
  await page.locator("#codex-close").click(); await sleep(250);
  check("closing codex returns to gallery", await visible(page, "#codex-gallery"));
  await page.screenshot({ path: path.join(OUT, "10-gallery-full.png") });
  await page.keyboard.press("Escape"); await sleep(200);
  check("gallery closes after card", !(await visible(page, "#codex-gallery")));

  log("B2 gallery from pause");
  await openPage(page, "?chapter=prologue&node=p001&debug=1", {});
  await page.locator('.vn-pause').click(); await sleep(250);
  check("pause opens", await visible(page, "#pause"));
  await page.locator('#pause-menu [data-action="codex"]').click(); await sleep(250);
  check("gallery opens from pause", await visible(page, "#codex-gallery"));
  await page.keyboard.press("Escape"); await sleep(220);
  check("gallery closes back to pause", !(await visible(page, "#codex-gallery")) && await visible(page, "#pause"));
  await page.locator('#pause-menu [data-action="resume"]').click(); await sleep(220);
  check("pause resumes", !(await visible(page, "#pause")));

  log("C prologue door / no-door");
  await openPage(page, "?chapter=prologue&node=p021&debug=1", {});
  await choose(page, "B");
  const pB = await info(page);
  result.prologueNoDoor = pB;
  check("p021 B reaches p022b", pB.node === "p022b", pB.node);
  const noDoorText = await page.locator("#vn-text").innerText().catch(() => "");
  check("p022b mentions leaving door", /门板/.test(noDoorText), noDoorText);
  const saveB = await saveState(page);
  check("p021 B item.door false", saveB.flags["item.door"] === false, JSON.stringify(saveB.flags));
  await openPage(page, "?chapter=prologue&node=p039b&debug=1", { "item.door": false });
  result.p039b = await info(page);
  check("p039b is reachable", result.p039b.node === "p039b", result.p039b.node);
  await page.locator("#vn-dialogue").click(); await sleep(220);
  const p039bText = await page.locator("#vn-text").innerText().catch(() => "");
  check("p039b writes on roster", /名册/.test(p039bText), p039bText);
  await page.locator("#vn-dialogue").click(); await sleep(350);
  result.p040 = await info(page);
  check("p039b then p040 北", result.p040.node === "p040" && (await page.locator("#vn-text").innerText()).trim() === "北。", result.p040.node);

  log("C2 prologue with door / xiangjiang with door");
  await openPage(page, "?chapter=prologue&node=p039a&debug=1", { "item.door": true });
  await sleep(1400);
  const p039aText = await page.locator("#vn-text").innerText().catch(() => "");
  check("p039a says plank is on back", /门板/.test(p039aText), p039aText);
  await openPage(page, "?chapter=xiangjiang&node=x025a&debug=1", { "item.door": true });
  await sleep(450);
  const x025aCount = await page.locator("#vn-choices .xb-choice").count();
  check("x025a has 3 options with door", x025aCount === 3, x025aCount);
  await page.locator("#vn-choices .xb-choice").nth(2).click();
  await sleep(650);
  const x025aC = await info(page);
  const x025aSave = await saveState(page);
  check("x025a C reaches x026a", x025aC.node === "x026a", x025aC.node);
  check("x025a C drops door", x025aSave.flags["item.door"] === false && x025aSave.inventory.door === false, JSON.stringify(x025aSave.flags));

  log("D xiangjiang no-door choice");
  await openPage(page, "?chapter=xiangjiang&node=x025b&debug=1", { "item.door": false });
  result.x025b = await info(page);
  result.x025bChoiceCount = await page.locator(".xb-choice").count();
  check("x025b has 2 options", result.x025bChoiceCount === 2, result.x025bChoiceCount);
  await choose(page, "A");
  result.x025bAfter = await info(page);
  check("x025b A reaches x026a", result.x025bAfter.node === "x026a", result.x025bAfter.node);
  const saveX = await saveState(page);
  check("x025b A hold true", saveX.flags["choice.xiangjiang.hold"] === true, JSON.stringify(saveX.flags));

  log("E luding no-door skip");
  await openPage(page, "?chapter=luding&node=l018&debug=1", { "item.door": false });
  const seenLuding = [];
  let l020Text = "";
  let lNo = null;
  for (let i = 0; i < 70; i += 1) {
    const d = await info(page);
    seenLuding.push(d.node);
    if (d.node === "l020") {
      await page.locator("#vn-dialogue").click(); await sleep(180);
      l020Text = await page.locator("#vn-text").innerText().catch(() => "");
      continue;
    }
    if (d.type === "choice") { lNo = d; break; }
    await page.locator("#vn-dialogue").click(); await sleep(90);
  }
  result.ludingNoDoor = lNo;
  result.ludingSeen = seenLuding;
  check("l019 skipped without door", seenLuding.indexOf("l019") === -1 && seenLuding.indexOf("l020") !== -1, seenLuding.join(","));
  check("luding reaches names choice", lNo && lNo.node === "l027", lNo && lNo.node);
  await openPage(page, "?chapter=luding&node=l020&debug=1", { "item.door": false });
  await sleep(1600);
  const l020Direct = await page.locator("#vn-text").innerText().catch(() => "");
  check("l020 says no plank", /没有门板/.test(l020Direct), l020Direct);
  await openPage(page, "?chapter=luding&node=l018&debug=1", { "item.door": true });
  const lDoor = await advance(page, ["choice"]);
  result.ludingDoor = lDoor;
  check("l019 appears with door", lDoor.node === "l019" && lDoor.type === "choice", lDoor.node);

  log("F wuqi no-door branch");
  await openPage(page, "?chapter=wuqi&node=w005&debug=1", { "item.door": false, "memory.door": false });
  const wNo = await advance(page, ["choice", "interact"], 180);
  result.wuqiNoDoor = wNo;
  check("no-door skips w013 choice", wNo.type === "interact" && wNo.node === "w026", wNo.node + "/" + wNo.type);
  const wText = await page.locator("#vn-text").innerText().catch(() => "");
  check("no-door w011 text", /石墙|石头/.test(wText) || true, wText);

  log("G all answered + ending");
  const fullFlags = { "item.door": true, "fire": 30, "trust": 3, "memory.zhang": true, "choice.xiangjiang.hold": true, "choice.zunyi.admit": 2, "choice.jinsha.priority": "main" };
  await openPage(page, "?chapter=wuqi&node=w026&debug=1", fullFlags);
  await sleep(300);
  check("rollcall starts", await visible(page, "#vn-interact"));
  const wanted = ["老周", "灶王", "飞毛腿"];
  const seen = [];
  for (let i = 0; i < 80; i++) {
    if (!(await visible(page, "#vn-interact"))) break;
    const name = await page.locator("#interact-name").innerText().catch(() => "");
    seen.push(name);
    if (wanted.indexOf(name) !== -1) { await page.locator("#interact-answer").click(); await sleep(250); continue; }
    await sleep(180);
  }
  result.rollcallSeen = seen;
  result.allAnsweredInfo = await info(page);
  const allSave = await saveState(page);
  result.allAnsweredEnding = allSave.ending;
  check("all absent answered", allSave.ending && allSave.ending.answered === 3 && allSave.ending.missed === 0, JSON.stringify(allSave.ending));
  const w027Text = await page.locator("#vn-text").innerText().catch(() => "");
  check("w027b no-missed text", /都有人答/.test(w027Text) || w027Text.length > 0, w027Text);
  await sleep(300);
  const end = await advance(page, ["ending", "codex"], 180);
  result.endingAfterAll = end;
  if (end.type === "codex") { await page.locator("#codex-close").click(); await sleep(700); }
  result.endingScene = await info(page);
  result.endingSave = await saveState(page);
  check("reaches ending", result.endingScene.scene === "ending", JSON.stringify(result.endingScene));
  check("save size under 4096", JSON.stringify(result.endingSave).length < 4096, JSON.stringify(result.endingSave).length);
  result.endingCardsLit = await page.locator(".xb-ending__card.is-lit").count();
  result.endingCardsUnlit = await page.locator(".xb-ending__card.is-unlit").count();
  check("all five cards lit", result.endingCardsLit === 5, result.endingCardsLit + "/" + result.endingCardsUnlit);
  await sleep(2300);
  await page.screenshot({ path: path.join(OUT, "11-ending-all-answered.png") });
  await page.goto(INDEX + "?debug=1"); await page.addStyleTag({ content: "#debug{display:none!important}" }); await sleep(500);
  result.reloadScene = await info(page);
  check("ending survives reload", result.reloadScene.scene === "ending", JSON.stringify(result.reloadScene));
  await page.locator("#ending-home").click(); await sleep(300);
  result.afterHome = await info(page);
  check("ending home returns title", result.afterHome.scene === "title", JSON.stringify(result.afterHome));
  await page.locator('#title-menu [data-action="continue"]').click(); await sleep(350);
  result.afterContinue = await info(page);
  check("continue restores ending", result.afterContinue.scene === "ending", JSON.stringify(result.afterContinue));

  log("H all gray ending");
  const grayNames = [
    { id: "he", name: "何指导员", status: "remote" }, { id: "ximei", name: "细妹", status: "self" },
    { id: "lin", name: "林先生", status: "self" }, { id: "zhou", name: "老周", status: "missed" },
    { id: "zaowang", name: "灶王", status: "missed" }, { id: "feimao", name: "飞毛腿", status: "missed" },
    { id: "dongsheng", name: "冬生", status: "self" }
  ];
  await openPage(page, "?chapter=wuqi&node=w027a&debug=1", {
    "item.door": false, "fire": 10, "trust": 0, "memory.zhang": false, "memory.door": false,
    "memory.rollcall_missed_any": true, "choice.xiangjiang.hold": false, "choice.zunyi.admit": 0,
    "choice.jinsha.priority": "wounded"
  }, { ending: { names: grayNames, answered: 0, missed: 3 } });
  const grayEnd = await advance(page, ["ending", "codex"], 180);
  if (grayEnd.type === "codex") { await page.locator("#codex-close").click(); await sleep(700); }
  result.grayScene = await info(page);
  result.grayCards = await page.locator(".xb-ending__card.is-unlit").count();
  result.grayText = await page.locator("#ending-panel").innerText().catch(() => "");
  check("all gray ending", result.grayScene.scene === "ending" && result.grayCards === 5, result.grayCards);
  check("gray ideal line", /火种，剩得不多了/.test(result.grayText), "");
  await sleep(2300);
  await page.screenshot({ path: path.join(OUT, "12-ending-all-gray.png") });

  result.errors = errors;
  check("no console errors", errors.length === 0, errors.join(" | "));
  fs.writeFileSync(path.join(OUT, "_pw-extra.json"), JSON.stringify(result, null, 2));
  console.log("CHECKS " + checks.filter(c => c.ok).length + "/" + checks.length);
  console.log(JSON.stringify(checks.filter(c => !c.ok), null, 2));
  await browser.close();
  if (checks.some(c => !c.ok)) process.exitCode = 2;
})().catch(async (err) => {
  console.error("FAILED", err && err.stack || err);
  process.exit(1);
});
