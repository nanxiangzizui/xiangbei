#!/usr/bin/env node
"use strict";

// 步骤十五：存档与读档（v1.6）。标题唯一入口、新档/上次玩到/删除、章末覆盖、已完结回顾、
// 初始化清四类记录但保留设置、跨档分支成就隔离、隐私降级、移动与 file://。
// 用法：node project/tools/_pw-step15.js --url=http --case=all --out=docs/evidence/step-15

const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SAVES_KEY = "xiangbei.saves.v1";
const BRANCH_KEY = "xiangbei.branches.v1";
const ACH_KEY = "xiangbei.achievements.v1";
const ROSTER_KEY = "xiangbei.roster.v1";

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
  const runId = "step15-" + args.url + "-" + (args.mobile ? "mobile-" : "") + args.case + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-15", runId));
  fs.mkdirSync(OUT, { recursive: true });
  const fileBase = "file:///" + path.join(PROJECT, "index.html").replace(/\\/g, "/");
  const serverInfo = args.url === "http" ? await startServer() : null;
  const origin = serverInfo ? serverInfo.base : null;

  const browser = await pw.chromium.launch({ executablePath: EDGE, headless: !args.headed });
  const viewport = args.mobile ? { width: 844, height: 390 } : { width: 1366, height: 768 };
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: args.mobile });
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
  async function shot(name) {
    await page.screenshot({ path: path.join(OUT, name + ".png") });
  }
  async function boot(query) {
    const url = (args.url === "file" ? fileBase : origin + "/index.html") + (query ? "?" + query : "");
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
    await page.waitForTimeout(150);
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
    await page.waitForTimeout(90);
  }
  async function clickIf(selector) {
    if (!(await vis(selector))) return false;
    await click(selector);
    return true;
  }
  async function store() {
    return page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (err) { return "bad-json"; }
    }, SAVES_KEY);
  }
  async function keyRaw(key) {
    return page.evaluate((k) => localStorage.getItem(k), key);
  }
  async function openSaves() {
    await click('#title-menu [data-action="saves"]');
    await page.waitForSelector("#saves-panel", { state: "visible" });
  }

  try {
    if (args.case === "migration") {
      await boot("");
      await page.evaluate(() => localStorage.clear());
      const legacy = await page.evaluate(() => {
        const st = XB.core.defaults();
        st.chapterId = "prologue";
        st.nodeId = "p010";
        st.scene = "vn";
        localStorage.setItem("xiangbei.save.v2", JSON.stringify(XB.core.serialize(st)));
        return st.nodeId;
      });
      eq("预置旧档节点", legacy, "p010");
      await boot("");
      await page.waitForTimeout(250);
      const migrated = await store();
      ok("旧档迁移成第 1 档", migrated && migrated.slots.length === 1, JSON.stringify(migrated && migrated.slots.length));
      eq("旧档迁移保留节点", migrated && migrated.slots[0].state.nodeId, "p010");
      eq("旧档键已删除", await keyRaw("xiangbei.save.v2"), null);
      ok("迁移提示", (await text("#toast")).indexOf("旧存档已收进存档列表") !== -1, await text("#toast"));
      await openSaves();
      eq("迁移后列表 1 档", await text("#saves-count"), "已存 1 档 · 其中 0 档已完结");
      await shot("migration");
    } else if (args.case === "privacy") {
      const pctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
      await pctx.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          get() { throw new DOMException("blocked", "SecurityError"); }
        });
      });
      const ppage = await pctx.newPage();
      const perrors = [];
      ppage.on("pageerror", (err) => perrors.push(err.message));
      ppage.on("console", (msg) => { if (msg.type() === "error") perrors.push(msg.text()); });
      const url = args.url === "file" ? fileBase : origin + "/index.html";
      await ppage.goto(url, { waitUntil: "load" });
      await ppage.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
      await ppage.waitForTimeout(200);
      ok("隐私模式标题可交互", await ppage.isVisible(".title-main__button"));
      await ppage.click('#title-menu [data-action="saves"]');
      await ppage.waitForTimeout(150);
      const hint = (await ppage.textContent("#saves-hint")) || "";
      ok("隐私模式提示本局无法存档", hint.indexOf("本局无法存档") !== -1, hint);
      await ppage.click("#save-new");
      await ppage.waitForTimeout(100);
      await ppage.click("#save-confirm-yes");
      await ppage.waitForTimeout(250);
      ok("隐私模式仍能开局", await ppage.isVisible("#scene-vn"));
      await ppage.screenshot({ path: path.join(OUT, "privacy.png") });
      ok("隐私模式无 pageerror", perrors.filter((line) => /pageerror|Uncaught/.test(line)).length === 0, perrors.join(" | "));
      await pctx.close();
    } else if (args.case === "mobile") {
      await boot("");
      ok("移动端标题可见", await vis(".title-main__button"));
      await openSaves();
      const box = await page.locator("#saves-panel .xb-saves__panel").boundingBox();
      ok("移动端面板不出界", box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 845 && box.y + box.height <= 391, JSON.stringify(box));
      const rowHeight = await page.$eval("#save-new", (el) => el.getBoundingClientRect().height);
      ok("移动端主按钮热区 >= 44 CSS px", rowHeight >= 44, rowHeight.toFixed(2));
      await shot("mobile-empty");
      await click("#save-new");
      await shot("mobile-confirm");
      await click("#save-confirm-yes");
      await page.waitForTimeout(300);
      ok("移动端开新档进入剧情", await vis("#scene-vn"));
      if (await vis("#vn-title-card")) await click("#vn-title-card");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      ok("移动端暂停可见", await vis("#pause"));
      await shot("mobile-pause");
      await click('#pause-menu [data-action="pause-title"]');
      await page.waitForTimeout(200);
      await openSaves();
      const rowH = await page.$eval("#saves-list .xb-saves__row", (el) => el.getBoundingClientRect().height);
      ok("移动端存档行热区 >= 44 CSS px", rowH >= 44, rowH.toFixed(2));
      await click("#save-delete");
      const delH = await page.$eval("#saves-delete-confirm", (el) => el.getBoundingClientRect().height);
      ok("移动端删除确认热区 >= 44 CSS px", delH >= 44, delH.toFixed(2));
      await click("#saves-list .xb-saves__row");
      await shot("mobile-delete");
      await click("#saves-delete-cancel");
      await click("#saves-close");
      ok("移动端关闭存档面板", !(await vis("#saves-panel")));
      ok("移动端 0 pageerror", errors.filter((line) => /pageerror/.test(line)).length === 0, errors.join(" | "));
    } else {
      // 清空所有本地记录，从空态开始
      await boot("");
      await page.evaluate(() => localStorage.clear());
      await boot("");

      const menuActions = await page.$$eval("#title-menu [data-action]", (els) => els.map((el) => el.dataset.action));
      eq("标题菜单只剩存档 + 四个图鉴入口", JSON.stringify(menuActions), JSON.stringify(["saves", "codex", "roster-gallery", "branch", "achievements"]));
      ok("标题无开始/继续", menuActions.indexOf("start") === -1 && menuActions.indexOf("continue") === -1);
      const titleButton = await page.$eval(".title-main__button", (el) => ({ text: el.textContent.trim(), action: el.dataset.action }));
      eq("向北两字是初始化按钮", JSON.stringify(titleButton), JSON.stringify({ text: "向北", action: "init-game" }));
      await shot("title");

      await openSaves();
      eq("空态计数", await text("#saves-count"), "还没有存档");
      ok("空态提示可见", await vis("#saves-empty"));
      eq("空态行数", await page.$$eval("#saves-list .xb-saves__row", (els) => els.length), 0);
      eq("空态上次玩到置灰", await page.getAttribute("#save-latest", "aria-disabled"), "true");
      eq("空态删除置灰", await page.getAttribute("#save-delete", "aria-disabled"), "true");
      await shot("saves-empty");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
      ok("Esc 关闭存档面板", !(await vis("#saves-panel")));

      // 开启新档：否 → 留在面板；是 → 新槽 + 从头开始
      await openSaves();
      await click("#save-new");
      eq("开新档确认标题", await text("#save-confirm-title"), "是否重新开始长征？");
      ok("开新档无补充正文", !(await vis("#save-confirm-body")));
      await shot("confirm-new");
      await click("#save-confirm-no");
      ok("否返回存档界面", (await vis("#saves-panel")) && !(await vis("#save-confirm")));
      await click("#save-new");
      await click("#save-confirm-yes");
      await page.waitForTimeout(350);
      ok("是新档后进入剧情", await vis("#scene-vn"));
      const first = await store();
      ok("新档写入列表", first && first.slots.length === 1 && first.activeId === first.slots[0].id, JSON.stringify(first && { slots: first.slots.length, activeId: first.activeId }));
      eq("新档从序章开始", first && first.slots[0].state.chapterId, "prologue");
      ok("新档播放序章标题卡", await vis("#vn-title-card"));
      await shot("new-game-titlecard");
      await click("#vn-title-card");
      await page.waitForTimeout(200);

      // 逐句推进：没有手动保存，档仍停在章首
      const firstLine = await text("#vn-text");
      for (let i = 0; i < 6; i += 1) {
        await click("#vn-dialogue");
        await page.waitForTimeout(140);
      }
      ok("逐句推进改变当前对话", (await text("#vn-text")) !== firstLine, await text("#vn-text"));
      const afterClicks = await store();
      eq("逐句推进不自动保存", afterClicks.slots[0].state.nodeId, "p001");

      // 设置改动只写全局 settings，不覆盖当前对话
      await page.evaluate(() => {
        const input = document.querySelector("#set-volume");
        input.value = "40";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const afterSetting = await store();
      eq("改设置不改对话进度", afterSetting.slots[0].state.nodeId, "p001");
      eq("改设置写入全局设置", Number(afterSetting.settings.volume), 0.4);

      // 手动「保存」：记下当前对话
      await page.waitForTimeout(2000);
      const manualText = await text("#vn-text");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      ok("暂停菜单可见", await vis("#pause"));
      ok("暂停有保存入口", await page.locator('#pause-menu [data-action="save"]').count() === 1);
      const beforeManual = afterSetting.slots[0].updatedAt;
      await click('#pause-menu [data-action="save"]');
      const savedToast = await text("#toast");
      ok("手动保存有提示", savedToast.indexOf("已保存：") === 0, savedToast);
      const afterManual = await store();
      const manualNode = afterManual.slots[0].state.nodeId;
      ok("手动保存记下当前节点", manualNode && manualNode !== "p001", manualNode);
      eq("手动保存不新增档", afterManual.slots.length, 1);
      ok("手动保存刷新时间", afterManual.slots[0].updatedAt >= beforeManual, afterManual.slots[0].updatedAt + " / " + beforeManual);
      await shot("pause-save");
      await click('#pause-menu [data-action="resume"]');

      // 退出重进：回到手动保存的那句，而不是章首
      await boot("");
      await openSaves();
      await click("#saves-list .xb-saves__row");
      await click("#save-confirm-yes");
      await page.waitForTimeout(2200);
      ok("重进回到手动保存的对话", (await text("#vn-text")) === manualText, (await text("#vn-text")) + " / " + manualText);
      eq("读档不改存档节点", (await store()).slots[0].state.nodeId, manualNode);

      // 章末自动保存：借 p900 走完序章，覆盖同一档
      await boot("resume=1&chapter=prologue&node=p900");
      let chapterId = "";
      for (let i = 0; i < 40; i += 1) {
        if (await clickIf("#vn-title-card")) continue;
        if (await clickIf("#codex-close")) continue;
        const current = await store();
        chapterId = current && current.slots[0] ? current.slots[0].state.chapterId : "";
        if (chapterId === "xiangjiang") break;
        await page.waitForTimeout(120);
        await click("#vn-dialogue");
      }
      const afterChapter = await store();
      eq("章末自动保存仍是同一档", afterChapter.slots.length, 1);
      eq("章末自动保存记录了章节", afterChapter.slots[0].state.chapterId, "xiangjiang");
      ok("章末自动保存沿用 activeId", afterChapter.activeId === afterChapter.slots[0].id);
      const chapterStartNode = afterChapter.slots[0].state.nodeId;
      ok("章末存档落在下一章开头", chapterStartNode && chapterStartNode !== "p900", chapterStartNode);
      await shot("chapter-saved");

      const notice = await page.locator("#autosave-notice").evaluate((el) => ({
        text: el.textContent.trim(),
        visible: el.classList.contains("is-visible"),
        top: Math.round(el.getBoundingClientRect().top),
        opacity: getComputedStyle(el).opacity
      }));
      ok("章末提示文案", notice.text === "已自动存档", JSON.stringify(notice));
      ok("章末提示在屏幕上方", notice.visible && notice.top >= 0 && notice.top < 200, String(notice.top));
      await page.waitForTimeout(3600);
      ok("章末提示 3.5 秒后淡出", !(await page.locator("#autosave-notice").evaluate((el) => el.classList.contains("is-visible"))), await page.locator("#autosave-notice").getAttribute("aria-hidden"));

      // 刷新只进开始菜单
      await boot("");
      ok("刷新后只进开始菜单", (await vis("#scene-title")) && !(await vis("#saves-panel")) && !(await vis("#scene-vn")));

      // 列表长条格式 + 未完结点击确认
      await openSaves();
      const rowText = await text("#saves-list .xb-saves__row .xb-saves__row-main");
      ok("列表主行格式", /^\d{4}年\d{2}月\d{2}日的存档（未完结）$/.test(rowText), rowText);
      const subText = await text("#saves-list .xb-saves__row .xb-saves__row-sub");
      ok("列表副行含章节与保存时间", subText.indexOf("湘江") !== -1 && subText.indexOf("上次保存") !== -1, subText);
      await shot("saves-list");
      await click("#saves-list .xb-saves__row");
      eq("未完结点击确认标题", await text("#save-confirm-title"), "是否继续长征？");
      await click("#save-confirm-no");
      ok("否返回存档界面", await vis("#saves-panel"));
      await click("#saves-list .xb-saves__row");
      await click("#save-confirm-yes");
      await page.waitForTimeout(300);
      ok("是读档进入剧情", await vis("#scene-vn"));
      eq("读档回到保存章节", await text("#vn-chapter"), "第一章 · 湘江");

      // 读档后推进仍不落盘；回到标题也不覆盖章首
      if (await vis("#vn-title-card")) await click("#vn-title-card");
      for (let i = 0; i < 4; i += 1) {
        await click("#vn-dialogue");
        await page.waitForTimeout(140);
      }
      eq("读档后推进不自动保存", (await store()).slots[0].state.nodeId, chapterStartNode);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      await click('#pause-menu [data-action="pause-title"]');
      await page.waitForTimeout(250);
      eq("回到标题不覆盖章首", (await store()).slots[0].state.nodeId, chapterStartNode);

      // 造一个已完结档：用 core 快照，避免为了测回顾真跑 20 分钟
      const crafted = await page.evaluate((key) => {
        const store = JSON.parse(localStorage.getItem(key));
        const st = XB.core.defaults();
        st.chapterId = "wuqi";
        st.ending = XB.core.buildEnding(st);
        st.scene = "ending";
        st.nodeId = null;
        const payload = XB.core.serialize(st);
        const at = new Date(Date.now() - 86400000).toISOString();
        store.slots.push({ id: "slot-test-ended", createdAt: at, updatedAt: at, state: payload });
        localStorage.setItem(key, JSON.stringify(store));
        return { full: XB.core.isFullEnding(st.ending), routeLabel: st.ending.routeLabel, routeTitle: st.ending.routeTitle };
      }, SAVES_KEY);
      ok("构造已完结档有效", crafted.full, JSON.stringify(crafted));
      await boot("");
      await openSaves();
      eq("两档计数", await text("#saves-count"), "已存 2 档 · 其中 1 档已完结");
      const endedRow = '#saves-list [data-id="slot-test-ended"]';
      const endedMain = await text(endedRow + " .xb-saves__row-main");
      ok("已完结行格式", /^\d{4}年\d{2}月\d{2}日的存档（已完结）$/.test(endedMain), endedMain);
      await shot("saves-two");

      // 已完结 → 整页结局回顾，只读，不覆盖存档
      const storeBeforeReview = await store();
      await click(endedRow);
      await page.waitForTimeout(350);
      ok("已完结打开结局页", (await vis("#scene-ending")) && !(await vis("#saves-panel")));
      eq("回顾按钮文案", await text("#ending-home"), "返回存档");
      ok("回顾隐藏剧情分支", !(await vis("#ending-branch")));
      ok("回顾隐藏史实图鉴", !(await vis("#ending-codex")));
      const storeAfterReview = await store();
      eq("回顾不改存档列表", JSON.stringify(storeAfterReview), JSON.stringify(storeBeforeReview));
      await shot("ending-review");
      await click("#ending-home");
      await page.waitForTimeout(250);
      ok("返回存档面板", (await vis("#saves-panel")) && (await vis("#scene-title")));

      // 上次玩到
      await click("#save-latest");
      eq("上次玩到确认标题", await text("#save-confirm-title"), "是否继续未竟的长征？");
      await click("#save-confirm-no");
      ok("否返回存档界面（上次玩到）", await vis("#saves-panel"));
      await click("#save-latest");
      await click("#save-confirm-yes");
      await page.waitForTimeout(300);
      ok("上次玩到进入剧情", await vis("#scene-vn"));
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      await click('#pause-menu [data-action="pause-title"]');
      await page.waitForTimeout(250);

      // 删除：选中加深 → 取消 → 二次确认 → 否 → 是
      await openSaves();
      await click("#save-delete");
      const roles = await page.$$eval("#saves-list .xb-saves__row", (els) => els.map((el) => el.getAttribute("role")));
      eq("删除模式所有行可选中", JSON.stringify(roles), JSON.stringify(["checkbox", "checkbox"]));
      await click(endedRow);
      eq("选中 aria-checked", await page.getAttribute(endedRow, "aria-checked"), "true");
      ok("选中行加深", await page.$eval(endedRow, (el) => el.classList.contains("is-selected")));
      await shot("delete-selected");
      await click("#saves-delete-cancel");
      eq("取消退出删除模式", await page.getAttribute("#saves-list .xb-saves__row", "role"), null);
      await click("#save-delete");
      await click(endedRow);
      await click("#saves-delete-confirm");
      eq("删除二次确认标题", await text("#save-confirm-title"), "确定要删除这些存档吗？");
      await click("#save-confirm-no");
      eq("否不删档", (await store()).slots.length, 2);
      await click("#saves-delete-confirm");
      await click("#save-confirm-yes");
      await page.waitForTimeout(250);
      eq("是删除选中档", (await store()).slots.length, 1);
      eq("删除后计数", await text("#saves-count"), "已存 1 档 · 其中 0 档已完结");
      ok("删除后有提示", (await text("#toast")).indexOf("已删除 1 个存档") === 0, await text("#toast"));
      await shot("after-delete");

      // 跨档隔离：分支/成就/名册标记在开新档、删档后都不变
      await page.evaluate((keys) => {
        localStorage.setItem(keys.branch, JSON.stringify({ version: 1, runs: [], marker: "keep-branch" }));
        localStorage.setItem(keys.ach, JSON.stringify({ version: 1, ids: [], marker: "keep-ach" }));
        localStorage.setItem(keys.roster, JSON.stringify({ version: 1, pages: [] }));
      }, { branch: BRANCH_KEY, ach: ACH_KEY, roster: ROSTER_KEY });
      await click("#save-new");
      await click("#save-confirm-yes");
      await page.waitForTimeout(350);
      eq("开新档不改分支记录", await keyRaw(BRANCH_KEY).then((raw) => JSON.parse(raw).marker), "keep-branch");
      eq("开新档不改成就记录", await keyRaw(ACH_KEY).then((raw) => JSON.parse(raw).marker), "keep-ach");
      await click("#vn-title-card");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      await click('#pause-menu [data-action="pause-title"]');
      await page.waitForTimeout(250);
      await openSaves();
      eq("新档叠加旧档", (await store()).slots.length, 2);
      await click("#save-delete");
      await click("#saves-list .xb-saves__row");
      await click("#saves-delete-confirm");
      await click("#save-confirm-yes");
      await page.waitForTimeout(250);
      eq("删档后只剩旧档", (await store()).slots.length, 1);
      eq("删档不改分支记录", await keyRaw(BRANCH_KEY).then((raw) => JSON.parse(raw).marker), "keep-branch");
      eq("删档不改成就记录", await keyRaw(ACH_KEY).then((raw) => JSON.parse(raw).marker), "keep-ach");

      // 设置保留：写一个非默认音量与文字速度，再初始化
      await page.evaluate((key) => {
        const store = JSON.parse(localStorage.getItem(key));
        store.settings.volume = 0.4;
        store.settings.textSpeed = 45;
        localStorage.setItem(key, JSON.stringify(store));
      }, SAVES_KEY);
      await boot("");
      eq("设置读回音量", await page.inputValue("#set-volume"), "40");
      eq("设置读回文字速度", await page.inputValue("#set-speed"), "45");
      await click(".title-main__button");
      eq("初始化确认标题", await text("#save-confirm-title"), "是否初始化游戏？");
      eq("初始化确认正文", await text("#save-confirm-body"), "这意味着你的存档、剧情分支、成就和回顾记录会被全部清空");
      await shot("confirm-init");
      await click("#save-confirm-no");
      ok("否保留存档", (await store()).slots.length === 1);
      ok("否保留分支记录", (await keyRaw(BRANCH_KEY)) !== null);
      await click(".title-main__button");
      await click("#save-confirm-yes");
      await page.waitForTimeout(300);
      const afterInit = await store();
      eq("初始化清空存档", afterInit && afterInit.slots.length, 0);
      ok("初始化清空成就", (await keyRaw(ACH_KEY)) === null);
      ok("初始化清空分支", (await keyRaw(BRANCH_KEY)) === null);
      ok("初始化清空名册", (await keyRaw(ROSTER_KEY)) === null);
      eq("初始化保留音量设置", Number(afterInit.settings.volume), 0.4);
      eq("初始化保留文字速度", Number(afterInit.settings.textSpeed), 45);
      eq("初始化后仍在标题", await page.getAttribute("#stage", "data-scene"), "title");
      ok("初始化提示", (await text("#toast")).indexOf("已初始化") === 0, await text("#toast"));
      await openSaves();
      eq("初始化后空态", await text("#saves-count"), "还没有存档");
      await shot("after-init");
      await page.keyboard.press("Escape");
    }

    if (args.case !== "privacy" && !args.mobile) {
      ok("全程 0 console error", errors.length === 0, errors.join(" | "));
      ok("全程 0 失败请求", failed.length === 0, failed.join(" | "));
    }
  } catch (err) {
    results.push({ name: "脚本异常", ok: false, detail: err && err.stack ? err.stack : String(err) });
  } finally {
    const summary = {
      runId, url: args.url, case: args.case, mobile: args.mobile,
      passed: results.filter((r) => r.ok).length,
      total: results.length,
      failed: results.filter((r) => !r.ok),
      results, errors, failedRequests: failed
    };
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(summary, null, 2));
    console.log("== " + runId + " ==");
    results.forEach((r) => console.log((r.ok ? "PASS " : "FAIL ") + r.name + (r.ok ? "" : " :: " + r.detail)));
    console.log("SUMMARY " + summary.passed + "/" + summary.total + " · errors " + errors.length + " · failed requests " + failed.length);
    console.log("OUT " + OUT);
    await browser.close();
    if (serverInfo) serverInfo.server.close();
    if (summary.passed !== summary.total) process.exitCode = 1;
  }
})();
