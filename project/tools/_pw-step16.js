#!/usr/bin/env node
"use strict";

// 步骤十六：剧情回顾（v1.7）。入口、全屏只读层、选择金色加粗、超时/冻结、跨刷新、
// 跨档隔离、隐私降级、坏档、移动与 file://。
// 用法：node project/tools/_pw-step16.js --url=http --case=all --out=docs/evidence/step-16

const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const HISTORY_KEY = "xiangbei.history.v1";
const SAVES_KEY = "xiangbei.saves.v1";

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
  const runId = "step16-" + args.url + "-" + (mobile ? "mobile-" : "") + caseName + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-16", runId));
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
    await page.waitForTimeout(90);
  }
  async function historyData() {
    return page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (err) { return "bad-json"; }
    }, HISTORY_KEY);
  }
  async function historyRows() {
    return page.$$eval("#history-list .xb-history__text", (els) => els.map((el) => ({
      text: el.textContent,
      choice: el.classList.contains("is-choice"),
      color: getComputedStyle(el).color,
      weight: getComputedStyle(el).fontWeight,
      size: getComputedStyle(el).fontSize,
      userSelect: getComputedStyle(el).userSelect
    })));
  }
  async function openHistory() {
    await click('#vn-history-button');
    await page.waitForSelector("#history-panel", { state: "visible" });
    await page.waitForTimeout(120);
  }
  async function closeHistory() {
    await click("#history-close");
    await page.waitForTimeout(100);
  }
  async function fresh(query) {
    // 先经 ?reset=1 清掉上一场景的存档与回顾：直接 localStorage.clear() 会被
    // 上一页 unload 时的 historyFlush 又写回去（页面隐藏会 flush）。
    await boot("reset=1");
    await boot(query);
  }
  async function startNewGame() {
    await boot("reset=1");
    await boot("");
    await click('#title-menu [data-action="saves"]');
    await page.waitForSelector("#saves-panel", { state: "visible" });
    await click("#save-new");
    await click("#save-confirm-yes");
    await page.waitForTimeout(350);
    if (await vis("#vn-title-card")) {
      await click("#vn-title-card");
      await page.waitForTimeout(250);
    }
  }
  async function advanceOnce() {
    if (mobile) {
      await page.touchscreen.tap(422, 300);
    } else {
      await page.locator("#scene-vn").click({ position: { x: 640, y: 560 } });
    }
    await page.waitForTimeout(220);
  }

  try {
    if (caseName === "privacy") {
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
      const url = (args.url === "file" ? fileBase : origin + "/index.html") + "?chapter=prologue&node=p009";
      await ppage.goto(url, { waitUntil: "load" });
      await ppage.waitForFunction(() => !!(window.XB && window.XB.engine), null, { timeout: 8000 });
      await ppage.waitForTimeout(700);
      ok("隐私模式回顾入口可见", await ppage.isVisible("#vn-history-button"));
      await ppage.click("#vn-history-button");
      await ppage.waitForTimeout(150);
      ok("隐私模式仍可打开回顾", await ppage.isVisible("#history-panel"));
      ok("隐私模式内存里仍有当前句", (await ppage.textContent("#history-list")).indexOf("娘，门没了") !== -1, await ppage.textContent("#history-list"));
      ok("隐私模式只提示无法保存回顾", ((await ppage.textContent("#toast")) || "").indexOf("无法保存回顾记录") !== -1, await ppage.textContent("#toast"));
      await ppage.screenshot({ path: path.join(OUT, "privacy.png") });
      ok("隐私模式无 pageerror", perrors.filter((line) => /pageerror|Uncaught/.test(line)).length === 0, perrors.join(" | "));
      await pctx.close();
    } else if (caseName === "mobile") {
      await fresh("chapter=prologue&node=p009");
      ok("移动端回顾入口可见", await vis("#vn-history-button"));
      const btn = await page.locator("#vn-history-button").boundingBox();
      ok("移动端入口热区 >= 44 CSS px", btn && btn.height >= 44 && btn.width >= 44, JSON.stringify(btn));
      await openHistory();
      const close = await page.locator("#history-close").boundingBox();
      ok("移动端 X 热区 >= 44 CSS px", close && close.height >= 44 && close.width >= 44, JSON.stringify(close));
      ok("移动端关闭键在视口内", close && close.x >= 0 && close.y >= 0 && close.x + close.width <= 845 && close.y + close.height <= 391, JSON.stringify(close));
      const body = await page.$eval("#history-body", (el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
      ok("移动端回顾正文不横向溢出", body.sw <= body.cw + 1, JSON.stringify(body));
      const fs = await page.$eval(".xb-history__text", (el) => getComputedStyle(el).fontSize);
      ok("移动端回顾正文固定字号", fs === "28px", fs);
      await shot("mobile-history");
      await page.tap("#history-close");
      await page.waitForTimeout(120);
      ok("移动端点 X 关闭", !(await vis("#history-panel")));
      const before = await text("#vn-text");
      await advanceOnce();
      ok("移动端关闭后可继续", (await text("#vn-text")) !== before, (await text("#vn-text")) + " / " + before);
      await shot("mobile-after-close");
      ok("移动端 0 pageerror", errors.filter((line) => /pageerror/.test(line)).length === 0, errors.join(" | "));
    } else if (caseName === "all") {
      // 1) 正常新档：入口只在剧情里出现；打开、读当前句、X 关闭、焦点回入口。
      await startNewGame();
      ok("新档进入剧情", await vis("#scene-vn"));
      ok("剧情里出现回顾入口", await vis("#vn-history-button"));
      eq("回顾入口文案", await text("#vn-history-button"), "回顾");

      await openHistory();
      ok("回顾层打开", await vis("#history-panel"));
      eq("回顾标题", await text("#history-title"), "剧情回顾");
      ok("回顾层默认焦点在 X", await page.evaluate(() => document.activeElement && document.activeElement.id) === "history-close");
      ok("空态在第一条后被隐藏", !(await vis("#history-empty")));
      eq("章节分隔", await text("#history-list .xb-history__chapter"), "序章 · 于都");
      let rows = await historyRows();
      ok("历史含当前第一句", rows.length >= 1 && rows[0].text.indexOf("1934年10月17日") !== -1, JSON.stringify(rows[0]));
      const bodyBg = await page.$eval("#history-panel", (el) => getComputedStyle(el).backgroundColor);
      ok("全屏回顾底色为实色", bodyBg !== "rgba(0, 0, 0, 0)" && bodyBg !== "transparent", bodyBg);
      await shot("history-open");
      await closeHistory();
      ok("X 关闭回顾层", !(await vis("#history-panel")));
      eq("关闭后焦点回入口", await page.evaluate(() => document.activeElement && document.activeElement.id), "vn-history-button");
      const beforeAdvance = await text("#vn-text");
      await advanceOnce();
      ok("关闭后剧情可继续", (await text("#vn-text")) !== beforeAdvance, (await text("#vn-text")) + " / " + beforeAdvance);

      // 2) 手动保存→刷新读档：回顾跟主档同一检查点；同一节点重渲染不重复。
      await advanceOnce();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      await click('#pause-menu [data-action="save"]');
      await page.waitForTimeout(250);
      const savedStore = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVES_KEY);
      const activeId = savedStore.activeId;
      const savedNode = savedStore.slots.find((slot) => slot.id === activeId).state.nodeId;
      const savedHistory = await historyData();
      const savedRun = savedHistory.runs[activeId];
      ok("回顾按存档槽隔离", !!savedRun, activeId + " / " + Object.keys(savedHistory.runs).join(","));
      ok("手动保存推进检查点", savedRun && savedRun.checkpoint === savedRun.entries.length, savedRun && savedRun.checkpoint + "/" + savedRun.entries.length);
      ok("主存档不复制回顾记录", JSON.stringify(savedStore).indexOf(HISTORY_KEY) === -1 && JSON.stringify(savedStore).indexOf('"entries"') === -1);
      const savedCount = savedRun.entries.length;
      await boot("resume=1");
      await openHistory();
      rows = await historyRows();
      eq("刷新后历史仍在", rows.length, savedCount);
      ok("刷新后仍是同一章", (await text("#history-list .xb-history__chapter")) === "序章 · 于都");
      await closeHistory();
      eq("刷新回原句", (await text("#vn-text")) !== "", true);

      // 3) 单选：选 A / 选 B 都以金色加粗文本进入历史。
      await fresh("chapter=prologue&node=p021");
      await click('.xb-choice[data-key="A"]');
      await page.waitForTimeout(700);
      await openHistory();
      rows = await historyRows();
      const aRow = rows.find((row) => row.choice && row.text.indexOf("带上这块门板") !== -1);
      ok("单选 A 写入历史", !!aRow, JSON.stringify(rows));
      eq("选择用金色", aRow && aRow.color, "rgb(242, 196, 92)");
      eq("选择加粗", aRow && aRow.weight, "700");
      ok("选择行带箭头", aRow && aRow.text.indexOf("➤") !== -1, aRow && aRow.text);
      ok("选择 prompt 也保留", (await text("#history-list")).indexOf("娘把锯子搁下，等你说。") !== -1);
      const style = await page.$eval("#history-list .xb-history__text.is-choice", (el) => ({
        size: getComputedStyle(el).fontSize,
        userSelect: getComputedStyle(el).userSelect,
        editable: document.querySelectorAll("[contenteditable]").length
      }));
      eq("回顾正文固定字号", style.size, "22px");
      eq("回顾正文不可选", style.userSelect, "none");
      eq("页面无 contenteditable", style.editable, 0);
      const box = await page.locator("#history-list .xb-history__text").first().boundingBox();
      await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
      eq("回顾里双击不选中正文", await page.evaluate(() => window.getSelection().toString()), "");
      await page.keyboard.press("Control+A");
      eq("回顾里 Ctrl+A 不选中正文", await page.evaluate(() => window.getSelection().toString()), "");
      await shot("history-choice-a");
      await closeHistory();

      await fresh("chapter=prologue&node=p021");
      await click('.xb-choice[data-key="B"]');
      await page.waitForTimeout(700);
      await openHistory();
      rows = await historyRows();
      ok("单选 B 写入历史", rows.some((row) => row.choice && row.text.indexOf("只带花名册") !== -1), JSON.stringify(rows));
      await closeHistory();

      // 4) 多选：三项以“、”连接；未选项不出现。
      await fresh("chapter=xiangjiang&node=x015");
      await page.waitForSelector("#vn-multichoice", { state: "visible" });
      await click('[data-multi-id="xray"]');
      await click('[data-multi-id="press"]');
      await click('[data-multi-id="files"]');
      await click("#vn-multi-confirm");
      await page.waitForTimeout(120);
      await openHistory();
      rows = await historyRows();
      const multiRow = rows.find((row) => row.choice);
      ok("多选写入历史", !!multiRow, JSON.stringify(rows));
      ok("多选用顿号连接", multiRow && multiRow.text.indexOf("X 光机、印刷机、文件") !== -1, multiRow && multiRow.text);
      ok("未选项不写入历史", multiRow && multiRow.text.indexOf("药箱") === -1, multiRow && multiRow.text);
      await shot("history-multi");
      await closeHistory();

      // 5) 记名：显示玩家抄下的名字。
      await fresh("chapter=jinsha&node=j018");
      await page.waitForSelector(".interact-name-button", { state: "visible" });
      await click('.interact-name-button[data-name-id="zhang"]');
      await page.waitForTimeout(500);
      await openHistory();
      rows = await historyRows();
      ok("记名写入历史", rows.some((row) => row.choice && row.text.indexOf("抄下「张老幺」的名字") !== -1), JSON.stringify(rows));
      await shot("history-namepick");
      await closeHistory();

      // 6) 限时冻结 + 12 秒超时默认项标记。l027 默认 A“记下数字，不写名字”。
      await fresh("chapter=luding&node=l027");
      await page.waitForSelector(".xb-choice", { state: "visible" });
      await page.waitForTimeout(350);
      const progressBefore = Number(await page.$eval("#vn-choices", (el) => getComputedStyle(el).getPropertyValue("--choice-progress")));
      await openHistory();
      await page.waitForTimeout(2000);
      const progressOpen = Number(await page.$eval("#vn-choices", (el) => getComputedStyle(el).getPropertyValue("--choice-progress")));
      ok("回顾打开时倒计时冻结", Math.abs(progressOpen - progressBefore) < 0.01, progressBefore + " → " + progressOpen);
      await page.keyboard.press("1");
      await page.waitForTimeout(120);
      eq("回顾层内数字键不穿透", await page.$$eval("#vn-choices .is-selected", (els) => els.length), 0);
      // 默认焦点在 X：空格会激活按钮关闭面板，这是按钮语义，不算穿透；
      // 把焦点放到正文再按空格，确认剧情不会推进。
      await page.evaluate(() => document.querySelector("#history-body").focus());
      const textBeforeSpace = await text("#vn-text");
      await page.keyboard.press("Space");
      await page.waitForTimeout(120);
      ok("回顾层内空格不穿透剧情", (await vis("#history-panel")) && (await text("#vn-text")) === textBeforeSpace);
      await page.evaluate(() => document.querySelector("#history-close").focus());
      await page.keyboard.press("Shift+Tab");
      ok("Shift+Tab 焦点留在回顾层", await page.evaluate(() => document.querySelector("#history-panel").contains(document.activeElement)));
      await page.keyboard.press("Tab");
      ok("Tab 焦点留在回顾层", await page.evaluate(() => document.querySelector("#history-panel").contains(document.activeElement)));
      await closeHistory();
      await page.waitForTimeout(250);
      const progressAfter = Number(await page.$eval("#vn-choices", (el) => getComputedStyle(el).getPropertyValue("--choice-progress")));
      ok("关闭后倒计时恢复且未被偷走", progressAfter > progressBefore - 0.05, progressBefore + " → " + progressOpen + " → " + progressAfter);
      await page.waitForFunction(() => {
        const toast = document.querySelector("#toast");
        return toast && toast.textContent.indexOf("超时：已按默认选项结算") !== -1;
      }, null, { timeout: 14000 });
      await page.waitForTimeout(900);
      await openHistory();
      rows = await historyRows();
      const timeoutRow = rows.find((row) => row.choice && row.text.indexOf("记下数字，不写名字") !== -1);
      ok("超时默认项写入历史", !!timeoutRow, JSON.stringify(rows));
      ok("超时项带时间到了标记", timeoutRow && timeoutRow.text.indexOf("时间到了，默认项") !== -1, timeoutRow && timeoutRow.text);
      await shot("history-timeout");
      await closeHistory();

      // 7) 字号设置只影响正文，不影响回顾；剧情正文也不可选中。
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      await click('#pause-menu [data-action="open-settings"]');
      await click('#set-scale [data-scale="1.3"]');
      eq("正文允许切换字号", await page.$eval("#stage", (el) => getComputedStyle(el).getPropertyValue("--text-scale").trim()), "1.3");
      await click('#vn-settings [data-action="close-settings"]');
      await click('#pause-menu [data-action="resume"]');
      await openHistory();
      eq("回顾字号不跟设置变化", await page.$eval(".xb-history__text", (el) => getComputedStyle(el).fontSize), "22px");
      await closeHistory();
      const vnSelect = await page.$eval("#vn-text", (el) => getComputedStyle(el).userSelect);
      eq("剧情正文不可选", vnSelect, "none");
      const vnBox = await page.locator("#vn-text").boundingBox();
      await page.mouse.dblclick(vnBox.x + vnBox.width / 2, vnBox.y + vnBox.height / 2);
      eq("剧情正文双击不选中", await page.evaluate(() => window.getSelection().toString()), "");

      // 8) 刷新保留同一节点不重复；记录独立于主档键。
      await fresh("chapter=prologue&node=p002");
      await page.waitForTimeout(600);
      await openHistory();
      rows = await historyRows();
      const p2Count = rows.length;
      eq("会话回顾有一条", p2Count, 1);
      await closeHistory();
      await page.waitForTimeout(500);
      const beforeReload = await historyData();
      await boot("chapter=prologue&node=p002");
      await openHistory();
      rows = await historyRows();
      eq("刷新后历史保留", rows.length, p2Count);
      const afterReload = await historyData();
      eq("刷新不重复同节点", JSON.stringify(afterReload.runs.session.entries), JSON.stringify(beforeReload.runs.session.entries));
      await closeHistory();

      // 9) 坏回顾档：备份 .bad，不白屏；新一轮只显示新记录。
      // 先 reset 清掉内存里的旧 run，避免上一页 unload flush 把坏值覆盖。
      await boot("reset=1");
      await page.evaluate((key) => localStorage.setItem(key, "{bad"), HISTORY_KEY);
      await boot("chapter=prologue&node=p001");
      await page.waitForTimeout(250);
      ok("坏回顾档有提示", ((await text("#toast")) || "").indexOf("回顾记录损坏") !== -1, await text("#toast"));
      eq("坏回顾档已备份", await page.evaluate((key) => localStorage.getItem(key + ".bad"), HISTORY_KEY), "{bad");
      await openHistory();
      ok("坏档后仍能打开回顾", await vis("#history-panel"));
      eq("坏档后从头记录", (await historyRows()).length, 1);
      await closeHistory();
      ok("坏档无 pageerror", errors.filter((line) => /pageerror|Uncaught/.test(line)).length === 0, errors.join(" | "));
    }

    if (caseName === "all" || caseName === "mobile") {
      ok("全程 0 console error（坏档分支除外）", errors.filter((line) => line.indexOf("不是合法 JSON") === -1).length === 0, errors.join(" | "));
      ok("全程 0 失败请求", failed.length === 0, failed.join(" | "));
    }
  } catch (err) {
    results.push({ name: "脚本异常", ok: false, detail: err && err.stack ? err.stack : String(err) });
  } finally {
    const summary = {
      runId, url: args.url, case: caseName, mobile,
      passed: results.filter((r) => r.ok).length,
      total: results.length,
      failed: results.filter((r) => !r.ok),
      results, errors, failedRequests: failed
    };
    fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(OUT, "run.log"), results.map((r) => (r.ok ? "PASS " : "FAIL ") + r.name + (r.ok ? "" : " :: " + r.detail)).join("\n") + "\n");
    console.log("== " + runId + " ==");
    results.forEach((r) => console.log((r.ok ? "PASS " : "FAIL ") + r.name + (r.ok ? "" : " :: " + r.detail)));
    console.log("SUMMARY " + summary.passed + "/" + summary.total + " · errors " + errors.length + " · failed requests " + failed.length);
    console.log("OUT " + OUT);
    await browser.close();
    if (serverInfo) serverInfo.server.close();
    if (summary.passed !== summary.total) process.exitCode = 1;
  }
})();
