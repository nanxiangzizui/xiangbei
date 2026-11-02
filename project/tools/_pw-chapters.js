const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright-core");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const INDEX = pathToFileURL(path.resolve(__dirname, "..", "index.html")).href;
const OUT = path.resolve(__dirname, "..", "..", "docs", "evidence", "step-05");
const SAVE_KEY = "xiangbei.save.v1";

const PROGRESS = path.resolve(__dirname, "..", "..", "docs", "evidence", "step-05", "_pw-progress.log");
function log(text) {
  const line = new Date().toISOString() + " " + text;
  console.log(line);
  fs.appendFileSync(PROGRESS, line + "\n");
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function seed(page, flags, opts) {
  const state = {
    version: 1,
    scene: "title",
    chapterId: "prologue",
    nodeId: null,
    flags: flags || {},
    inventory: { door: !!(flags && flags["item.door"]), items: [] },
    choices: (opts && opts.choices) || [],
    codex: (opts && opts.codex) || [],
    settings: {},
    unlockedChapters: ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
    ending: (opts && opts.ending) || null
  };
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(state)]);
}

async function openChapter(page, chapter, node, flags, opts) {
  await page.goto(INDEX);
  await seed(page, flags, opts);
  await page.goto(INDEX + "?chapter=" + chapter + (node ? "&node=" + node : "") + "&debug=1");
  await page.addStyleTag({ content: "#debug{display:none!important}" });
  await sleep(350);
  log("opened " + chapter + "/" + node + " -> " + JSON.stringify(await info(page)));
}

async function info(page) {
  const text = await page.locator("#debug").innerText().catch(() => "");
  const node = text.match(/node\s+(\S+)\s+\((\w+)\)/);
  const chapter = text.match(/chapter\s+(\S+)/);
  const scene = text.match(/scene\s+(\S+)/);
  return { text, node: node && node[1], type: node && node[2], chapter: chapter && chapter[1], scene: scene && scene[1] };
}

async function visible(page, sel) {
  const loc = page.locator(sel);
  return (await loc.count()) > 0 && await loc.first().isVisible().catch(() => false);
}

async function advance(page, stopTypes, max) {
  for (let i = 0; i < (max || 90); i++) {
    const d = await info(page);
    if (!d.node) {
      if (await visible(page, "#scene-ending")) return { type: "ending" };
      if (await visible(page, "#scene-map")) return { type: "map" };
    }
    if (stopTypes && stopTypes.indexOf(d.type) !== -1) return d;
    if (await visible(page, "#vn-title-card")) {
      await page.locator("#vn-title-card").click();
      await sleep(180);
      continue;
    }
    if (await visible(page, "#codex")) {
      await page.locator("#codex-close").click();
      await sleep(160);
      continue;
    }
    if (await visible(page, "#vn-result")) {
      await page.locator(".vn-result__more").click();
      await sleep(180);
      continue;
    }
    if (await visible(page, "#vn-choices")) return { ...d, type: "choice" };
    if (await visible(page, "#vn-interact")) return { ...d, type: "interact" };
    await page.locator("#vn-dialogue").click();
    await sleep(105);
  }
  throw new Error("advance did not reach stop: " + JSON.stringify(await info(page)));
}

async function choose(page, key) {
  await page.locator('[data-action="choose"][data-key="' + key + '"]').click();
  await sleep(500);
}

async function saveState(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), SAVE_KEY);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"]
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(10000);
  log("browser launched");
  const errors = [];
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", err => errors.push("PAGEERROR " + err.message));
  const result = {};

  // A. 遵义三选 + 错误卡
  log("BEGIN zunyi");
  await openChapter(page, "zunyi", "z019", {});
  result.zunyiStart = await info(page);
  await choose(page, "A");
  await advance(page, ["choice"]);
  result.zunyiSecond = await info(page);
  await choose(page, "A");
  await advance(page, ["choice"]);
  result.zunyiThird = await info(page);
  await choose(page, "A");
  await sleep(350);
  result.zunyiResult = await info(page);
  result.zunyiCardText = await page.locator("#vn-result").innerText();
  await page.screenshot({ path: path.join(OUT, "02-zunyi-card.png") });
  await advance(page, ["codex"]);
  result.zunyiCodex = await info(page);
  await page.locator("#codex-close").click();
  await sleep(180);
  await page.locator("#vn-dialogue").click();
  await sleep(500);
  result.afterZunyi = await info(page);
  result.afterZunyiSave = await saveState(page);

  log("BEGIN jinsha");
  // B. 金沙江记名
  await openChapter(page, "jinsha", "j018", {});
  result.jinshaStart = await info(page);
  await page.locator('[data-action="pick-name"][data-name-id="zhang"]').click();
  await sleep(400);
  result.jinshaResult = await info(page);
  result.jinshaResultText = await page.locator("#vn-result").innerText();
  await page.screenshot({ path: path.join(OUT, "03-jinsha-name.png") });
  result.jinshaSave = await saveState(page);

  log("BEGIN luding");
  // C. 泸定：有门板，保留门板；留白页
  await openChapter(page, "luding", "l019", { "item.door": true });
  result.ludingStart = await info(page);
  await choose(page, "B");
  await advance(page, ["choice"]);
  result.ludingNames = await info(page);
  await page.screenshot({ path: path.join(OUT, "04-luding-names.png") });
  await choose(page, "B");
  await sleep(300);
  result.ludingAfter = await info(page);
  result.ludingSave = await saveState(page);

  log("BEGIN grass");
  // D. 草地：分粮给伤员、背锅
  await openChapter(page, "grass", "g007", { "item.door": true });
  result.grassStart = await info(page);
  await advance(page, ["choice"]);
  await choose(page, "A");
  await advance(page, ["choice"]);
  result.grassPot = await info(page);
  await choose(page, "A");
  await sleep(400);
  result.grassAfter = await info(page);
  result.grassText = await page.locator("#vn-text").innerText();
  result.grassSave = await saveState(page);
  await page.screenshot({ path: path.join(OUT, "05-grass-pot.png") });

  log("BEGIN wuqi");
  // E. 吴起：有门板，留门板；点名替答老周，灶王/飞毛腿漏答；结局
  const wuqiFlags = {
    "item.door": true,
    "fire": 30,
    "trust": 3,
    "memory.zhang": true,
    "choice.xiangjiang.hold": true,
    "choice.zunyi.admit": 2,
    "choice.jinsha.priority": "main"
  };
  await openChapter(page, "wuqi", "w005", wuqiFlags);
  result.wuqiStart = await info(page);
  await advance(page, ["choice"]);
  result.wuqiChoice = await info(page);
  await choose(page, "A");
  await sleep(350);
  result.wuqiAfterChoice = await info(page);
  await advance(page, ["interact"]);
  result.rollcallStart = await info(page);
  await page.screenshot({ path: path.join(OUT, "06-rollcall.png") });
  // 等老周
  for (let i = 0; i < 40; i++) {
    const name = await page.locator("#interact-name").innerText();
    if (name === "老周") break;
    await sleep(200);
  }
  result.rollcallZhou = await page.locator("#interact-name").innerText();
  await page.locator("#interact-answer").click();
  await sleep(300);
  // 等结束时序：灶王、飞毛腿各 4s，冬生自动 0.7s
  for (let i = 0; i < 60; i++) {
    if (!(await visible(page, "#vn-interact"))) break;
    await sleep(250);
  }
  result.afterRollcall = await info(page);
  result.afterRollcallText = await page.locator("#vn-text").innerText().catch(() => "");
  result.afterRollcallSave = await saveState(page);
  await page.screenshot({ path: path.join(OUT, "07-rollcall-done.png") });

  await advance(page, ["codex"]);
  await page.locator("#codex-close").click();
  await sleep(900);
  result.endingScene = await info(page);
  result.endingSceneText = await page.locator("#ending-panel").innerText().catch(() => "");
  result.endingSave = await saveState(page);
  await page.screenshot({ path: path.join(OUT, "08-ending.png") });

  result.errors = errors;
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch(async (err) => {
  console.error("FAILED", err && err.stack || err);
  process.exit(1);
});
