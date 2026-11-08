#!/usr/bin/env node
"use strict";

// 步骤十四：成就系统（v1.5.1）标题/暂停/结局三入口、选择与记名解锁、锁定不泄露、移动端。
// 用法：node project/tools/_pw-step14.js --url=http --case=all --out=docs/evidence/step-14

const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVE_KEY = "xiangbei.save.v2";
const ACH_KEY = "xiangbei.achievements.v1";
const CHAPTERS = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi", "coda", "badend"];

function parseArgs(argv) {
  const args = { url: "http", case: "all", out: "", mobile: false, headed: false };
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
  for (const candidate of candidates) {
    try { return require(candidate); } catch (err) { /* next */ }
  }
  throw new Error("找不到 playwright-core");
}

function mimeFor(file) {
  return {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2",
    ".mp3": "audio/mpeg", ".txt": "text/plain; charset=utf-8"
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

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

const FULL_CHOICES = [
  { chapter: "prologue", nodeId: "p021", option: "A", text: "带上这块门板", timedOut: false },
  { chapter: "prologue", nodeId: "p024", option: "MULTI", text: "药、青稞、布鞋", timedOut: false },
  { chapter: "prologue", nodeId: "p037", option: "A", text: "回头看一眼", timedOut: false },
  { chapter: "xiangjiang", nodeId: "x015", option: "MULTI", text: "X 光机、药箱、电台", timedOut: false },
  { chapter: "xiangjiang", nodeId: "x025a", option: "C", text: "门板横在桥头", timedOut: false },
  { chapter: "zunyi", nodeId: "z019", option: "A", text: "承认东西带得太多", timedOut: false },
  { chapter: "zunyi", nodeId: "z022", option: "A", text: "承认湘江那条路走错了", timedOut: false },
  { chapter: "zunyi", nodeId: "z025", option: "A", text: "承认漏记过名字", timedOut: false },
  { chapter: "zunyi", nodeId: "z028e", option: "A", text: "写下向北", timedOut: false },
  { chapter: "jinsha", nodeId: "j024", option: "A", text: "先渡主力", timedOut: false },
  { chapter: "luding", nodeId: "l019", option: "C", text: "抱着门板先过桥", timedOut: false },
  { chapter: "luding", nodeId: "l027", option: "A", text: "记下数字", timedOut: false },
  { chapter: "grass", nodeId: "g008", option: "A", text: "青稞给伤员", timedOut: false },
  { chapter: "grass", nodeId: "g018x", option: "A", text: "青稞入锅", timedOut: false },
  { chapter: "grass", nodeId: "g021", option: "A", text: "背走小锅", timedOut: false },
  { chapter: "grass", nodeId: "g026x", option: "A", text: "布鞋给冬生", timedOut: false },
  { chapter: "wuqi", nodeId: "w013", option: "A", text: "门板留吴起", timedOut: false }
];

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const pw = loadPlaywright();
  const runId = "step14-" + args.url + "-" + (args.mobile ? "mobile-" : "") + args.case + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-14", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const base = args.url === "file" ? "file:///" + path.join(PROJECT, "index.html").replace(/\\/g, "/") : null;
  const serverInfo = args.url === "http" ? await startServer() : null;
  const origin = serverInfo ? serverInfo.base : null;

  const browser = await pw.chromium.launch({ executablePath: EDGE, headless: !args.headed });
  const context = await browser.newContext({ viewport: args.mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 }, deviceScaleFactor: 1, hasTouch: args.mobile });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
  page.on("requestfailed", (req) => failed.push(req.url() + " " + (req.failure() && req.failure().errorText)));

  const results = [];
  function check(name, ok, detail) {
    results.push({ name, ok: !!ok, detail: detail === undefined ? "" : String(detail) });
    console.log((ok ? "OK " : "FAIL ") + name + (ok || detail === undefined ? "" : " :: " + String(detail)));
  }
  async function goto(query) {
    const url = base ? base + (query ? (base.indexOf("?") === -1 ? "?" : "&") + query : "") : origin + "/" + (query ? "?" + query : "");
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
  }
  async function visible(selector) { return page.locator(selector).first().isVisible(); }
  async function waitVisible(selector, timeout) {
    try { await page.locator(selector).first().waitFor({ state: "visible", timeout: timeout || 8000 }); return true; }
    catch (err) { return false; }
  }
  async function hit(locator) { await locator.first().click(); await page.waitForTimeout(120); }
  async function shot(name) { await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage: false }); }
  function readStore(key) {
    return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
  }
  const BASE_FLAGS = {
    "item.door": false, "item.medicine": false, "item.barley": false, "item.homepot": false,
    "item.raincloth": false, "item.shoes": false, "item.pot": false,
    load: 0, trust: 0, fire: 50, condition: 3, rescues: 0,
    "help.used": false, "memory.help": false, "memory.help_door": false, "memory.namepick_done": false,
    "had.door": false, doorOutcome: "none",
    "fate.feimao.dead": false, "fate.zaowang.dead": false, "fate.dongsheng.dead": false,
    "fate.lin.dead": false, "fate.player.dead": false, "grass.settled": false,
    "quality.feimao": 2, "quality.zaowang": 2, "quality.dongsheng": 2,
    "inventory.giftBarley": false, strain: 3
  };
  async function seedSave(partial) {
    const state = Object.assign({
      version: 2, scene: "vn", chapterId: "prologue", nodeId: "p001",
      flags: {}, inventory: { door: false, items: ["roster", "pencil"] }, choices: [], codex: [],
      settings: {}, unlockedChapters: CHAPTERS.slice(), ending: null
    }, partial || {});
    state.version = 2;
    state.flags = Object.assign({}, BASE_FLAGS, (partial && partial.flags) || {});
    if (state.flags["item.door"] === true) state.flags["had.door"] = true;
    if (state.flags.condition === 0) state.flags["fate.player.dead"] = true;
    state.flags.strain = 3 - (Number(state.flags.rescues) || 0);
    state.inventory = Object.assign({ door: state.flags["item.door"] === true, items: [], giftBarley: false }, (partial && partial.inventory) || {});
    state.inventory.door = state.flags["item.door"] === true;
    await goto("");
    await page.evaluate(([key, value, ach]) => {
      localStorage.setItem(key, value);
      localStorage.removeItem(ach);
    }, [SAVE_KEY, JSON.stringify(state), ACH_KEY]);
    await goto("?debug=1");
  }
  async function clearAll() {
    await goto("");
    await page.evaluate(([save, ach]) => {
      localStorage.removeItem(save);
      localStorage.removeItem(ach);
      localStorage.removeItem(ach + ".bad");
    }, [SAVE_KEY, ACH_KEY]);
  }

  async function caseTitle() {
    await clearAll();
    await goto("");
    check("标题有解锁成就入口", await visible('.title-menu [data-action="achievements"]'));
    await hit(page.locator('.title-menu [data-action="achievements"]'));
    check("成就面板打开", await waitVisible("#achievement-panel"));
    check("计数 0/48", (await page.locator("#achievement-count").innerText()).indexOf("0 / 48") !== -1);
    check("七个章节标签", await page.locator("#achievement-tabs .xb-achievements__tab").count() === 7);
    check("序章 0/9", (await page.locator("#achievement-tabs .xb-achievements__tab").first().innerText()).indexOf("0/9") !== -1);
    check("序章九张卡", await page.locator("#achievement-grid .xb-achievement-card").count() === 9);
    check("九张锁定", await page.locator("#achievement-grid .xb-achievement-card.is-locked").count() === 9);
    const first = page.locator("#achievement-grid .xb-achievement-card").first();
    await hit(first);
    check("锁定详情打开", await waitVisible("#achievement-detail"));
    const body = await page.locator("#achievement-detail-body").innerText();
    check("锁定说明", body.indexOf("还没有解锁") !== -1);
    check("锁定不泄露选项", body.indexOf("带上这块门板") === -1 && body.indexOf("行囊只剩两格") === -1, body);
    await shot("locked-detail");
    await hit(page.locator("#achievement-detail-close"));
    await hit(page.locator("#achievement-close"));
    check("关闭回标题", await visible(".title-menu"));
  }

  async function caseChoice() {
    await clearAll();
    await seedSave({ scene: "vn", chapterId: "prologue", nodeId: "p021" });
    await goto("?debug=1&chapter=prologue&node=p021");
    check("到门板选择", await waitVisible("#vn-choices .xb-choice"));
    await hit(page.locator('#vn-choices .xb-choice[data-key="A"]'));
    await page.waitForTimeout(700);
    let store = await readStore(ACH_KEY);
    check("单选即时解锁 p021-A", !!(store && store.unlocked && store.unlocked["p021-A"]), JSON.stringify(store && Object.keys(store.unlocked || {})));
    check("单选未误解锁 B", !!(store && store.unlocked && !store.unlocked["p021-B"]));
    await hit(page.locator('.vn-pause[data-action="pause"]'));
    check("暂停打开", await visible("#pause-menu"));
    await hit(page.locator('#pause-menu [data-action="achievements"]'));
    check("暂停成就入口打开", await waitVisible("#achievement-panel"));
    check("序章 1/9", (await page.locator("#achievement-tabs .xb-achievements__tab").first().innerText()).indexOf("1/9") !== -1);
    const unlocked = page.locator("#achievement-grid .xb-achievement-card.is-unlocked");
    check("一张已解锁", await unlocked.count() === 1);
    await hit(unlocked.first());
    const body = await page.locator("#achievement-detail-body").innerText();
    check("详情含选择原句", body.indexOf("带上这块门板") !== -1);
    check("详情含原因与词条", body.indexOf("行囊只剩两格") !== -1 && body.indexOf("因此，你解锁了「门板在背」") !== -1, body);
    await shot("unlocked-detail");
    await hit(page.locator("#achievement-detail-close"));
    await hit(page.locator("#achievement-close"));
    check("关闭回暂停", await visible("#pause-menu"));
    await hit(page.locator('#pause-menu [data-action="resume"]'));
    check("继续回阅读", await visible("#vn-dialogue"));
  }

  async function caseMulti() {
    await clearAll();
    await seedSave({ scene: "vn", chapterId: "prologue", nodeId: "p024", flags: { condition: 4 } });
    await goto("?debug=1&chapter=prologue&node=p024");
    check("到行囊多选", await waitVisible("#vn-multichoice"));
    for (const id of ["medicine", "barley", "shoes"]) {
      await hit(page.locator('.xb-multi-option[data-multi-id="' + id + '"]'));
    }
    await hit(page.locator("#vn-multi-confirm"));
    await page.waitForTimeout(700);
    const store = await readStore(ACH_KEY);
    check("多选三项各解锁", !!(store && store.unlocked && store.unlocked["p024-medicine"] && store.unlocked["p024-barley"] && store.unlocked["p024-shoes"]));
    check("多选未选不误解锁", !!(store && store.unlocked && !store.unlocked["p024-homepot"]));
    await hit(page.locator('.vn-pause[data-action="pause"]'));
    await hit(page.locator('#pause-menu [data-action="achievements"]'));
    check("行囊 3/9", (await page.locator("#achievement-tabs .xb-achievements__tab").first().innerText()).indexOf("3/9") !== -1);
    await shot("multi-unlocked");
    await hit(page.locator("#achievement-close"));
    await hit(page.locator('#pause-menu [data-action="resume"]'));
  }

  async function caseNamepick() {
    await clearAll();
    await seedSave({ scene: "vn", chapterId: "jinsha", nodeId: "j018" });
    await goto("?debug=1&chapter=jinsha&node=j018");
    check("到记名", await waitVisible("#vn-interact"));
    await hit(page.locator('#interact-names .interact-name-button').first());
    await page.waitForTimeout(300);
    let store = await readStore(ACH_KEY);
    check("记名 done 解锁", !!(store && store.unlocked && store.unlocked["j018-done"]));
    check("记名 skip 未解锁", !!(store && store.unlocked && !store.unlocked["j018-skip"]));
    await seedSave({ scene: "vn", chapterId: "jinsha", nodeId: "j018" });
    await goto("?debug=1&chapter=jinsha&node=j018");
    await waitVisible("#vn-interact");
    await hit(page.locator("#interact-answer"));
    await page.waitForTimeout(300);
    store = await readStore(ACH_KEY);
    check("记名 skip 解锁", !!(store && store.unlocked && store.unlocked["j018-skip"]));
    check("记名 skip 不误解锁 done", !!(store && store.unlocked && !store.unlocked["j018-done"]));
  }

  async function caseEnding() {
    await clearAll();
    await seedSave({
      scene: "vn", chapterId: "wuqi", nodeId: "w900", unlockedChapters: CHAPTERS.slice(),
      flags: {
        "item.door": true, doorOutcome: "carried", rescues: 1, condition: 4,
        "fate.feimao.dead": false, "fate.zaowang.dead": true, "fate.dongsheng.dead": true,
        "fate.lin.dead": false, "fate.player.dead": false,
        "memory.namepick_done": true, "memory.zhang": true
      },
      inventory: { door: true, items: ["roster", "pencil"] },
      choices: FULL_CHOICES
    });
    await goto("?debug=1&chapter=wuqi&node=w900");
    check("结算进入结局", await waitVisible("#scene-ending", 12000));
    check("结局成就区在", await visible("#ending-achievements"));
    check("结局标题精确", (await page.locator("#ending-achievements-title").innerText()).replace(/\s/g, "") === "此周目解锁的成就有：");
    const chips = await page.locator("#ending-achievement-chips .xb-ending__achievement").count();
    check("结局本局词条 >= 10", chips >= 10, chips);
    const save = await readStore(SAVE_KEY);
    check("主档 ending.achievements", !!(save && save.ending && Array.isArray(save.ending.achievements) && save.ending.achievements.length === chips), save && save.ending && save.ending.achievements && save.ending.achievements.length);
    await shot("ending-achievements-section");
    const first = page.locator("#ending-achievement-chips .xb-ending__achievement").first();
    await hit(first);
    check("结局词条可点开", await waitVisible("#achievement-detail"));
    const body = await page.locator("#achievement-detail-body").innerText();
    check("结局详情含原因", body.indexOf("因此，你解锁了") !== -1, body.slice(0, 200));
    await shot("ending-achievement-detail");
    await hit(page.locator("#achievement-detail-close"));
    await hit(page.locator("#achievement-close"));
    check("关闭回结局", await visible("#scene-ending"));
    await hit(page.locator("#ending-home"));
    await page.waitForTimeout(300);
    check("回标题", await visible(".title-menu"));
    await hit(page.locator('.title-menu [data-action="achievements"]'));
    check("累计成就保留", (await page.locator("#achievement-count").innerText()).indexOf("0 / 48") === -1);
    await shot("title-accumulated");
    await hit(page.locator("#achievement-close"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    // 刷新会回到已结算的结局场景；先确认重进时本局快照没有被 flags 里的记名覆盖成 1 条。
    if (await visible("#scene-ending")) {
      const reloadedChips = await page.locator("#ending-achievement-chips .xb-ending__achievement").count();
      check("重进结局本局成就保留", reloadedChips >= 10, reloadedChips);
      await hit(page.locator("#ending-home"));
    }
    await hit(page.locator('.title-menu [data-action="achievements"]'));
    check("刷新后累计保留", (await page.locator("#achievement-count").innerText()).indexOf("0 / 48") === -1);
    await hit(page.locator("#achievement-close"));
  }

  async function caseCoverage() {
    await clearAll();
    const coverage = await page.evaluate(() => {
      const list = XB.story.achievements;
      const failures = [];
      list.forEach((ach) => {
        let ids = [];
        if (ach.kind === "interact") {
          ids = XB.core.collectRunAchievements({
            choices: [],
            flags: { "memory.namepick_done": true, "memory.zhang": ach.outcome === "done" }
          });
        } else {
          const decision = XB.story.branchMap.decisions[ach.decision];
          const nodeId = decision.nodes[0];
          const found = XB.core.locate(ach.chapter, nodeId);
          const node = found && found.node;
          let choice = null;
          if (node && node.type === "multichoice") {
            const option = (node.options || []).find((item) => item.id === ach.key);
            choice = { chapter: ach.chapter, nodeId, option: "MULTI", text: option ? option.text : ach.key, timedOut: false };
          } else {
            const map = (decision.optionKeys && decision.optionKeys[nodeId]) || {};
            const key = Object.keys(map).find((id) => map[id] === ach.key) || ach.key;
            choice = { chapter: ach.chapter, nodeId, option: key, text: "", timedOut: false };
          }
          ids = XB.core.collectRunAchievements({ choices: [choice], flags: {} });
        }
        if (ids.indexOf(ach.id) === -1) failures.push({ id: ach.id, ids });
      });
      return { total: list.length, failures };
    });
    check("48 条均能从选择映射", coverage.total === 48 && coverage.failures.length === 0, JSON.stringify(coverage));
  }

  async function caseMobile() {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    await clearAll();
    await goto("");
    await hit(page.locator('.title-menu [data-action="achievements"]'));
    check("移动端面板打开", await waitVisible("#achievement-panel"));
    const panel = await page.locator(".xb-achievements__panel").boundingBox();
    check("移动端面板不出界", !!panel && panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= 844 && panel.y + panel.height <= 390, JSON.stringify(panel));
    const card = await page.locator(".xb-achievement-card").first().boundingBox();
    check("移动端卡片热区 >=44 CSS", !!card && card.height >= 43.5, card && card.height);
    const close = await page.locator("#achievement-close").boundingBox();
    check("移动端关闭热区 >=44 CSS", !!close && close.width >= 43.5 && close.height >= 43.5, JSON.stringify(close));
    await hit(page.locator(".xb-achievement-card").first());
    check("移动端详情打开", await waitVisible("#achievement-detail"));
    await shot("mobile-locked-detail");
    await hit(page.locator("#achievement-detail-close"));
    await hit(page.locator("#achievement-close"));

    await seedSave({ scene: "vn", chapterId: "prologue", nodeId: "p001" });
    await goto("?debug=1&chapter=prologue&node=p001");
    await hit(page.locator('.vn-pause[data-action="pause"]'));
    check("移动端暂停打开", await visible("#pause-menu"));
    const pauseBox = await page.locator("#pause-menu").boundingBox();
    check("移动端暂停面板不出界", !!pauseBox && pauseBox.x >= 0 && pauseBox.y >= 0 && pauseBox.x + pauseBox.width <= 844 && pauseBox.y + pauseBox.height <= 390, JSON.stringify(pauseBox));
    const pauseAch = page.locator('#pause-menu [data-action="achievements"]');
    const pauseAchBox = await pauseAch.boundingBox();
    check("移动端暂停成就热区 >=44 CSS", await pauseAch.isVisible() && !!pauseAchBox && pauseAchBox.height >= 43.5, JSON.stringify(pauseAchBox));
    await hit(pauseAch);
    check("移动端暂停入口可开", await waitVisible("#achievement-panel"));
    await hit(page.locator("#achievement-close"));
  }

  const enabled = args.case === "all" ? ["coverage", "title", "choice", "multi", "namepick", "ending", "mobile"] : [args.case];
  try {
    for (const name of enabled) {
      if (name === "coverage") await caseCoverage();
      else if (name === "title") await caseTitle();
      else if (name === "choice") await caseChoice();
      else if (name === "multi") await caseMulti();
      else if (name === "namepick") await caseNamepick();
      else if (name === "ending") await caseEnding();
      else if (name === "mobile") await caseMobile();
      else throw new Error("未知 case: " + name);
    }
    check("console 0 error", errors.length === 0, errors.join(" | "));
    check("无失败请求", failed.length === 0, failed.join(" | "));
  } catch (err) {
    check("流程异常", false, err && err.stack || err);
  } finally {
    const passed = results.filter(r => r.ok).length;
    const report = { runId, url: args.url, mobile: args.mobile, at: new Date().toISOString(), passed, total: results.length, results, errors, failed };
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(report, null, 2));
    console.log("\n" + passed + "/" + results.length + " · " + OUT);
    await browser.close();
    if (serverInfo) serverInfo.server.close();
    process.exit(passed === results.length ? 0 : 1);
  }
})();