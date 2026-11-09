#!/usr/bin/env node
"use strict";

// 步骤十九：一周目后从特定章节重新游玩。
// 覆盖：章节详情入口、两步存档面板、未完结/已完结过滤、旧档缺章节记录、
// 前情快照拷贝、新档开启、Esc 回退、http 与 file://。
// 用法：node project/tools/_pw-step19.js --url=http --case=all --out=docs/evidence/step-19

const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVES_KEY = "xiangbei.saves.v1";
const CHAPTERS_KEY = "xiangbei.chapters.v1";
const HISTORY_KEY = "xiangbei.history.v1";
const BRANCH_KEY = "xiangbei.branches.v1";

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

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const pw = loadPlaywright();
  const caseName = args.case;
  const mobile = args.mobile || caseName === "mobile";
  const runId = "step19-" + args.url + "-" + (mobile ? "mobile-" : "") + caseName + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-19", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const fileBase = "file:///" + path.join(PROJECT, "index.html").replace(/\\/g, "/");
  const serverInfo = args.url === "http" ? await startServer() : null;
  const origin = serverInfo ? serverInfo.base : null;

  const browser = await pw.chromium.launch({ executablePath: EDGE, headless: !args.headed });
  const context = await browser.newContext({
    viewport: mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    hasTouch: mobile
  });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
  page.on("requestfailed", (req) => failed.push(req.url() + " " + (req.failure() && req.failure().errorText)));

  const results = [];
  function ok(name, cond, detail) {
    results.push({ name, ok: !!cond, detail: detail === undefined ? "" : String(detail) });
  }
  function eq(name, actual, expected) {
    ok(name, actual === expected, "实际 " + JSON.stringify(actual) + " / 期望 " + JSON.stringify(expected));
  }
  function has(name, haystack, needle) {
    ok(name, String(haystack).indexOf(needle) !== -1, "在「" + String(haystack).slice(0, 180) + "」里找「" + needle + "」");
  }
  async function shot(name) {
    await page.screenshot({ path: path.join(OUT, name + ".png") });
  }
  async function boot(query) {
    const url = (args.url === "file" ? fileBase : origin + "/index.html") + (query ? "?" + query : "");
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
    await page.waitForTimeout(180);
  }
  async function vis(selector) {
    return page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el || el.hidden) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, selector);
  }
  async function text(selector) {
    return page.$eval(selector, (el) => el.textContent.trim());
  }
  async function click(selector) {
    await page.locator(selector).first().click();
    await page.waitForTimeout(140);
  }

  function seedScript() {
    return page.evaluate(([savesKey, chaptersKey, historyKey, branchKey]) => {
      const settings = XB.core.DEFAULT_SETTINGS;
      const now = new Date().toISOString();
      function makeState() {
        const s = XB.core.defaults();
        s.version = 2;
        s.settings = JSON.parse(JSON.stringify(settings));
        s.flags.doorOutcome = "carried";
        s.flags.rescues = 1;
        s.flags.condition = 2;
        s.flags["memory.zhang"] = true;
        s.inventory.door = true;
        s.inventory.items = ["medicine", "shoes"];
        s.flags["item.medicine"] = true;
        s.flags["item.shoes"] = true;
        s.inventory.giftBarley = true;
        s.codex = ["yudu", "xiangjiang"];
        s.choices = [
          { chapter: "prologue", nodeId: "p021", option: "A", text: "把门板背走", timedOut: false },
          { chapter: "prologue", nodeId: "p024", option: "MULTI", text: "门板、药、布鞋", timedOut: false }
        ];
        s.unlockedChapters = ["prologue", "xiangjiang"];
        return s;
      }
      const prologue = XB.core.defaults();
      prologue.version = 2;
      prologue.settings = JSON.parse(JSON.stringify(settings));
      XB.core.startChapter(prologue, "prologue");
      const sourceSnap = makeState();
      XB.core.startChapter(sourceSnap, "xiangjiang");
      const targetState = XB.core.defaults();
      targetState.version = 2;
      targetState.settings = JSON.parse(JSON.stringify(settings));
      targetState.unlockedChapters = ["prologue", "xiangjiang"];
      XB.core.startChapter(targetState, "xiangjiang");

      const completed = makeState();
      completed.scene = "ending";
      completed.chapterId = "wuqi";
      completed.nodeId = null;
      completed.unlockedChapters = ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"];
      completed.ending = XB.core.buildEnding(completed);
      const oldCompleted = JSON.parse(JSON.stringify(completed));
      oldCompleted.flags.condition = 1;
      oldCompleted.flags["memory.zhang"] = false;

      function slot(id, state, offset) {
        return {
          id,
          createdAt: new Date(Date.now() - offset).toISOString(),
          updatedAt: new Date(Date.now() - offset).toISOString(),
          state: XB.core.serialize(state)
        };
      }
      const sourceSlot = slot("slot-source", completed, 90000);
      const targetSlot = slot("slot-target", targetState, 60000);
      const oldSlot = slot("slot-old", oldCompleted, 30000);
      localStorage.setItem(savesKey, JSON.stringify({
        version: 1,
        activeId: null,
        settings: JSON.parse(JSON.stringify(settings)),
        slots: [sourceSlot, targetSlot, oldSlot]
      }));
      localStorage.setItem(chaptersKey, JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        slots: {
          "slot-source": {
            updatedAt: now,
            chapters: {
              prologue: { at: now, state: XB.core.serialize(prologue) },
              xiangjiang: { at: now, state: XB.core.serialize(sourceSnap) }
            }
          }
        }
      }));
      localStorage.setItem(historyKey, JSON.stringify({
        version: 1,
        runs: {
          "slot-source": {
            entries: [
              { t: "line", c: "prologue", n: "p001" },
              { t: "choice", c: "prologue", n: "p021", k: "choice", key: "A", timedOut: false }
            ],
            checkpoint: 2,
            updatedAt: now
          }
        }
      }));
      localStorage.setItem(branchKey, JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        runs: [],
        endings: { door_grass_one: { at: Date.now(), runId: "r-test", count: 1 } },
        chapters: {
          prologue: { at: Date.now(), runId: "r-test" },
          xiangjiang: { at: Date.now(), runId: "r-test" }
        },
        options: {}
      }));
    }, [SAVES_KEY, CHAPTERS_KEY, HISTORY_KEY, BRANCH_KEY]);
  }

  async function freshSeeded(options) {
    await boot("reset=1");
    await page.evaluate(() => localStorage.clear());
    await boot("");
    await seedScript();
    if (options && options.removeTarget) {
      await page.evaluate(([key]) => {
        const store = JSON.parse(localStorage.getItem(key));
        store.slots = store.slots.filter((s) => s.id !== "slot-target");
        localStorage.setItem(key, JSON.stringify(store));
      }, [SAVES_KEY]);
    }
    await boot("");
  }

  async function openBranchChapter(chapterId) {
    await click('#title-menu [data-action="branch"]');
    await page.waitForSelector("#branch-map", { state: "visible", timeout: 4000 });
    await click('#branch-chapters .xb-branch-chapter[data-chapter="' + chapterId + '"]');
    await page.waitForSelector("#branch-detail", { state: "visible", timeout: 4000 });
  }

  async function storeOf(key) {
    return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
  }

  try {
    if (caseName === "all" || caseName === "basic") {
      await freshSeeded();
      await openBranchChapter("xiangjiang");
      eq("章节详情显示从此开始", await text('#branch-detail-actions [data-action="branch-start"]'), "从此开始");
      eq("从此开始可用", await page.getAttribute('#branch-detail-actions [data-action="branch-start"]', "aria-disabled"), "false");
      await shot("01-branch-chapter-start");

      await click('#branch-detail-actions [data-action="branch-start"]');
      eq("第一步打开存档面板", await vis("#saves-panel"), true);
      eq("第一步标题逐字", await text("#saves-title"), "请选择一个存档开始");
      has("第一步提示两步", await text("#saves-kicker"), "第 1 步 / 共 2 步");
      const targetRows = await page.locator("#saves-list .xb-saves__row").count();
      eq("第一步只列未完结档", targetRows, 1);
      eq("第一步列出目标档", await page.locator('#saves-list [data-id="slot-target"]').count(), 1);
      eq("第一步不列已完结档", await page.locator('#saves-list [data-id="slot-source"]').count(), 0);
      await shot("02-step-target");

      await click('#saves-list [data-id="slot-target"]');
      eq("第二步标题逐字", await text("#saves-title"), "对于你选择的章节前的剧情走向，你希望走哪条路线？");
      has("第二步提示两步", await text("#saves-kicker"), "第 2 步 / 共 2 步");
      eq("第二步只列已完结档", await page.locator('#saves-list .xb-saves__row').count(), 2);
      eq("第二步可用的已完结档", await page.getAttribute('#saves-list [data-id="slot-source"]', "aria-disabled"), "false");
      eq("旧档缺少前情置灰", await page.getAttribute('#saves-list [data-id="slot-old"]', "aria-disabled"), "true");
      has("旧档置灰原因", await text('#saves-list [data-id="slot-old"]'), "缺少这一章前情");
      await shot("03-step-source");

      await click('#saves-list [data-id="slot-source"]');
      await page.waitForTimeout(420);
      eq("选择后回剧情", await vis("#scene-vn"), true);
      eq("选择后关卡存档面板", await vis("#saves-panel"), false);
      eq("选择后关分支图", await vis("#branch-map"), false);
      const saves = await storeOf(SAVES_KEY);
      const target = saves.slots.find((s) => s.id === "slot-target");
      const active = saves.slots.find((s) => s.id === saves.activeId);
      eq("目标档成为当前档", active && active.id, "slot-target");
      eq("前情旗标拷贝 rescues", target.state.flags.rescues, 1);
      eq("前情旗标拷贝 condition", target.state.flags.condition, 2);
      eq("前情物资拷贝物品", target.state.inventory.items.indexOf("medicine") !== -1, true);
      eq("前情选择日志拷贝", target.state.choices.some((c) => c.nodeId === "p021" && c.option === "A"), true);
      eq("前情图鉴拷贝", target.state.codex.indexOf("yudu") !== -1, true);
      eq("本章从湘江开始", target.state.chapterId, "xiangjiang");
      eq("未带旧结局", target.state.ending, null);
      eq("目标档仍为未完结", target.state.ending, null);
      const chapters = await storeOf(CHAPTERS_KEY);
      eq("目标档有章前记录", !!chapters.slots["slot-target"], true);
      eq("目标档拷贝序章底片", !!chapters.slots["slot-target"].chapters.prologue, true);
      eq("目标档拷贝湘江底片", !!chapters.slots["slot-target"].chapters.xiangjiang, true);
      const history = await storeOf(HISTORY_KEY);
      eq("目标档有回顾", !!history.runs["slot-target"], true);
      eq("回顾只含前情", history.runs["slot-target"].entries.length >= 1, true);
      await shot("04-after-replay");
    }

    if (caseName === "all" || caseName === "new") {
      await freshSeeded({ removeTarget: true });
      await openBranchChapter("xiangjiang");
      await click('#branch-detail-actions [data-action="branch-start"]');
      eq("无未完结档时第一步为空", await page.locator("#saves-list .xb-saves__row").count(), 0);
      has("无未完结档提示开新档", await text("#saves-empty"), "开启新档");
      await click("#save-new");
      eq("新档选择进入第二步", await text("#saves-title"), "对于你选择的章节前的剧情走向，你希望走哪条路线？");
      await click('#saves-list [data-id="slot-source"]');
      await page.waitForTimeout(420);
      const saves = await storeOf(SAVES_KEY);
      eq("新档已创建", saves.slots.length, 3);
      eq("新档成为当前档", saves.activeId !== "slot-source", true);
      const active = saves.slots.find((s) => s.id === saves.activeId);
      eq("新档从湘江开始", active.state.chapterId, "xiangjiang");
      eq("新档保留前情选择", active.state.choices.some((c) => c.nodeId === "p021"), true);
      const chapters = await storeOf(CHAPTERS_KEY);
      eq("新档有章前记录", !!chapters.slots[active.id], true);
      await shot("05-new-slot");
    }

    if (caseName === "all" || caseName === "back") {
      await freshSeeded();
      await openBranchChapter("xiangjiang");
      await click('#branch-detail-actions [data-action="branch-start"]');
      await click('#saves-list [data-id="slot-target"]');
      eq("第二步已到", await text("#saves-title"), "对于你选择的章节前的剧情走向，你希望走哪条路线？");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(160);
      eq("Esc 回第一步", await text("#saves-title"), "请选择一个存档开始");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(160);
      eq("再 Esc 关面板", await vis("#saves-panel"), false);
      eq("分支图仍在", await vis("#branch-map"), true);
      eq("焦点回从此开始", await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-action")), "branch-start");
      await shot("06-back");
    }

    if (caseName === "all" || caseName === "ending") {
      await freshSeeded();
      await page.evaluate(([chaptersKey, branchKey]) => {
        const saves = JSON.parse(localStorage.getItem("xiangbei.saves.v1"));
        const source = saves.slots.find((s) => s.id === "slot-source");
        const wuqi = JSON.parse(JSON.stringify(source.state));
        wuqi.scene = "vn";
        wuqi.ending = null;
        wuqi.nodeId = null;
        wuqi.chapterId = "wuqi";
        if (wuqi.unlockedChapters.indexOf("wuqi") === -1) wuqi.unlockedChapters.push("wuqi");
        XB.core.startChapter(wuqi, "wuqi");
        const at = new Date().toISOString();
        const chapters = JSON.parse(localStorage.getItem(chaptersKey));
        chapters.slots["slot-source"].chapters.wuqi = { at, state: XB.core.serialize(wuqi) };
        localStorage.setItem(chaptersKey, JSON.stringify(chapters));
        const branch = JSON.parse(localStorage.getItem(branchKey));
        branch.chapters.wuqi = { at: Date.now(), runId: "r-test" };
        localStorage.setItem(branchKey, JSON.stringify(branch));
      }, [CHAPTERS_KEY, BRANCH_KEY]);
      await boot("");
      await openBranchChapter("wuqi");
      eq("吴起章节可从本章开始", await page.getAttribute('#branch-detail-actions [data-action="branch-start"]', "aria-disabled"), "false");
      await click('#branch-detail-actions [data-action="branch-start"]');
      await click('#saves-list [data-id="slot-target"]');
      await click('#saves-list [data-id="slot-source"]');
      await page.waitForTimeout(420);
      eq("从吴起开始进入剧情", await vis("#scene-vn"), true);

      for (let i = 0; i < 600; i += 1) {
        if (await vis("#scene-ending")) break;
        if (await vis("#codex")) {
          await click("#codex-close");
          continue;
        }
        if (await vis("#vn-title-card")) {
          await page.locator("#vn-title-card").click();
          await page.waitForTimeout(40);
          continue;
        }
        if (await vis("#vn-choices")) {
          const choice = page.locator('#vn-choices .xb-choice:not([aria-disabled="true"])').first();
          if (await choice.count()) {
            await choice.click();
            await page.waitForTimeout(120);
            continue;
          }
        }
        if (await vis("#vn-interact")) {
          if (await vis("#interact-answer")) {
            await page.locator("#interact-answer").click();
            await page.waitForTimeout(120);
          } else {
            await page.waitForTimeout(80);
          }
          continue;
        }
        if (await vis("#vn-result")) {
          await page.keyboard.press("Space");
          await page.waitForTimeout(40);
          continue;
        }
        await page.keyboard.press("Space");
        await page.waitForTimeout(35);
      }
      if (!(await vis("#scene-ending"))) {
        await shot("08-ending-debug");
        const diag = await page.evaluate(() => {
          const shown = (sel) => {
            const el = document.querySelector(sel);
            if (!el || el.hidden) return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };
          const txt = (sel) => {
            const el = document.querySelector(sel);
            return el ? (el.textContent || "").trim().slice(0, 160) : "";
          };
          return {
            sceneVn: shown("#scene-vn"), sceneEnding: shown("#scene-ending"),
            title: shown("#vn-title-card"), choices: shown("#vn-choices"),
            interact: shown("#vn-interact"), answer: shown("#interact-answer"),
            result: shown("#vn-result"), codex: shown("#codex"),
            chapter: txt("#vn-chapter"), name: txt("#vn-name"), text: txt("#vn-text"),
            interactName: txt("#interact-name"), interactStatus: txt("#interact-status"),
            active: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : ""
          };
        });
        console.log("ENDING_DIAG " + JSON.stringify(diag));
      }
      eq("吴起路线可到结局", await vis("#scene-ending"), true);
      const saves = await storeOf(SAVES_KEY);
      const target = saves.slots.find((s) => s.id === "slot-target");
      eq("结局写入目标档", !!(target && target.state.ending), true);
      eq("结局路线已结算", target && target.state.ending && target.state.ending.route, "door_grass_one");
      const branch = await storeOf(BRANCH_KEY);
      eq("结局写入剧情分支", !!(branch && branch.runs && branch.runs.length >= 1), true);
      if (branch && branch.runs && branch.runs.length) {
        eq("分支记录含前情选择", branch.runs[branch.runs.length - 1].choices.some((c) => c.nodeId === "p021"), true);
      } else {
        ok("分支记录含前情选择", false, JSON.stringify(branch));
      }
      const achievements = await storeOf("xiangbei.achievements.v1");
      const endingAchievements = target && target.state.ending && target.state.ending.achievements;
      eq("结局快照写入成就", Array.isArray(endingAchievements) && endingAchievements.length > 0, true);
      eq("成就档写入成就", !!(achievements && achievements.unlocked), true);
      const chapters = await storeOf(CHAPTERS_KEY);
      eq("目标档保留吴起章前记录", !!chapters.slots["slot-target"].chapters.wuqi, true);
      await shot("08-ending");
    }

    if (caseName === "mobile") {
      await freshSeeded();
      await openBranchChapter("xiangjiang");
      const startBox = await page.locator('#branch-detail-actions [data-action="branch-start"]').boundingBox();
      ok("移动端从此开始热区 >= 44 CSS px", startBox && startBox.height >= 44 && startBox.width >= 44, JSON.stringify(startBox));
      await click('#branch-detail-actions [data-action="branch-start"]');
      const rowBox = await page.locator('#saves-list [data-id="slot-target"]').boundingBox();
      ok("移动端存档行热区 >= 44 CSS px", rowBox && rowBox.height >= 44 && rowBox.width >= 44, JSON.stringify(rowBox));
      await click('#saves-list [data-id="slot-target"]');
      const sourceBox = await page.locator('#saves-list [data-id="slot-source"]').boundingBox();
      ok("移动端路线行热区 >= 44 CSS px", sourceBox && sourceBox.height >= 44 && sourceBox.width >= 44, JSON.stringify(sourceBox));
      await shot("07-mobile-step-source");
    }

    if (caseName === "full") {
      await boot("reset=1&debug=1");
      await click('[data-action="saves"]');
      await click("#save-new");
      await click("#save-confirm-yes");
      const started = Date.now();
      let guard = 0;
      while (Date.now() - started < 900000 && guard < 3000 && !(await vis("#scene-ending"))) {
        guard += 1;
        if (await vis("#vn-title-card")) { await click("#vn-title-card"); continue; }
        if (await vis("#codex")) { await click("#codex-close"); continue; }
        if (await vis("#bag-confirm-modal")) { await click("#bag-confirm-yes"); continue; }
        if (await vis("#door-modal")) { await click("#door-discard"); continue; }
        if (await vis("#danger-modal")) { await click("#danger-accept"); continue; }
        if (await vis("#pack-panel")) {
          const use = page.locator('#pack-list [data-action="pack-use"]:not([disabled])').first();
          if (await use.count()) { await use.click(); await page.waitForTimeout(220); }
          else if (await vis("#pack-continue")) await click("#pack-continue");
          else await click("#pack-close");
          continue;
        }
        if (await vis("#vn-multichoice")) {
          const options = page.locator("#vn-multi-options .xb-multi-option");
          const count = await options.count();
          if (count && await options.first().isDisabled()) {
            await page.waitForTimeout(280);
            continue;
          }
          let selected = 0;
          for (let i = 0; i < count && selected < 3; i += 1) {
            const option = options.nth(i);
            const cls = String(await option.getAttribute("class"));
            if (cls.indexOf("is-disabled") !== -1) continue;
            if ((await option.getAttribute("aria-checked")) === "true") { selected += 1; continue; }
            if (cls.indexOf("is-locked") !== -1) continue;
            await option.click();
            selected += 1;
            await page.waitForTimeout(90);
          }
          const confirm = page.locator("#vn-multi-confirm");
          if (await confirm.isDisabled()) {
            await page.waitForTimeout(250);
            continue;
          }
          await confirm.click();
          await page.waitForTimeout(620);
          continue;
        }
        if (await vis("#vn-choices")) {
          const choice = page.locator('#vn-choices .xb-choice:not([disabled])').first();
          if (await choice.count()) {
            await choice.click();
            await page.waitForTimeout(340);
            continue;
          }
        }
        if (await vis("#vn-interact")) {
          if (await vis("#interact-answer")) {
            const label = await text("#interact-answer");
            if (label === "跳过") {
              const names = page.locator(".interact-name-button");
              if (await names.count()) await names.first().click();
              else await page.locator("#interact-answer").click();
            } else {
              await page.locator("#interact-answer").click();
            }
            await page.waitForTimeout(240);
          } else {
            await page.waitForTimeout(180);
          }
          continue;
        }
        if (await vis("#vn-result")) { await click("#vn-result button"); continue; }
        if (await vis("#vn-dialogue")) { await click("#vn-dialogue"); continue; }
        await page.waitForTimeout(150);
      }
      eq("完整周目到结局", await vis("#scene-ending"), true);
      const saves = await storeOf(SAVES_KEY);
      const sourceSlot = saves && saves.slots && saves.slots[0];
      eq("完整周目存档已完结", !!(sourceSlot && sourceSlot.state.ending), true);
      const chapters = await storeOf(CHAPTERS_KEY);
      const sourceChapters = chapters && sourceSlot && chapters.slots[sourceSlot.id];
      ok("完整周目留下多章底片", !!(sourceChapters && Object.keys(sourceChapters.chapters).length >= 5), sourceChapters && Object.keys(sourceChapters.chapters).join(","));
      eq("完整周目序章底片", !!(sourceChapters && sourceChapters.chapters.prologue), true);
      eq("完整周目泸定底片", !!(sourceChapters && sourceChapters.chapters.luding), true);
      await click("#ending-branch");
      await page.waitForSelector("#branch-map", { state: "visible" });
      await click('[data-action="branch-chapter"][data-chapter="luding"]');
      await page.waitForSelector("#branch-detail", { state: "visible" });
      eq("完整周目后泸定可从此开始", await page.getAttribute('#branch-detail-actions [data-action="branch-start"]', "aria-disabled"), "false");
      await click('#branch-detail-actions [data-action="branch-start"]');
      await click("#save-new");
      await click('#saves-list [data-id="' + sourceSlot.id + '"]');
      await page.waitForTimeout(500);
      eq("完整周目后从泸定进入剧情", await vis("#scene-vn"), true);
      const after = await storeOf(SAVES_KEY);
      const target = after.slots.find((s) => s.id === after.activeId);
      eq("完整周目重玩新档", !!(target && target.id !== sourceSlot.id), true);
      eq("重玩从泸定开始", target && target.state.chapterId, "luding");
      eq("重玩带走章前旗标", target && target.state.flags.condition, sourceChapters.chapters.luding.state.flags.condition);
      eq("重玩没有结局", target && target.state.ending, null);
      const afterChapters = await storeOf(CHAPTERS_KEY);
      ok("重玩档复制章前底片", !!(afterChapters && target && afterChapters.slots[target.id] && afterChapters.slots[target.id].chapters.prologue && afterChapters.slots[target.id].chapters.luding), true);
      await shot("09-full-replay");
      console.log("FULL guard=" + guard + " seconds=" + Math.round((Date.now() - started) / 1000));
    }

    const passed = results.filter((r) => r.ok).length;
    console.log("== " + runId + " ==");
    results.forEach((r) => console.log((r.ok ? "PASS " : "FAIL ") + r.name + (r.ok ? "" : " · " + r.detail)));
    ok("全程 0 console error", errors.length === 0, errors.join(" | "));
    ok("全程 0 失败请求", failed.length === 0, failed.join(" | "));
    const finalPassed = results.filter((r) => r.ok).length;
    console.log("SUMMARY " + finalPassed + "/" + results.length + " · errors " + errors.length + " · failed requests " + failed.length);
    console.log("OUT " + OUT);
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify({ runId, results, errors, failed }, null, 2));
    if (serverInfo) serverInfo.server.close();
    await browser.close();
    if (finalPassed !== results.length) process.exit(1);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    if (serverInfo) serverInfo.server.close();
    await browser.close();
    process.exit(1);
  }
})();
