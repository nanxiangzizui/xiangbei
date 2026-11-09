#!/usr/bin/env node
"use strict";

// 步骤十七：行囊未满二次确认（v1.7+）。
// 序章 p024「系好行囊」时四格没装满 → #bag-confirm-modal：「是」结算并继续，
// 「否」退回多选且保留已选。覆盖：空行囊/半满/装满/带门板、Tab/Esc/Enter、
// 遮罩挡点击、移动 844×390 热区、file://。
// 用法：node project/tools/_pw-step17.js --url=http --case=all --out=docs/evidence/step-17

const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const COPY = "行囊尚未装满，长征路途艰险，确定要继续吗？";

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
  const runId = "step17-" + args.url + "-" + (mobile ? "mobile-" : "") + caseName + "-" + stamp();
  const OUT = path.resolve(args.out || path.join(ROOT, "docs", "evidence", "step-17", runId));
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
    ok(name, String(haystack).indexOf(needle) !== -1, "在「" + String(haystack).slice(0, 160) + "」里找「" + needle + "」");
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
    await page.waitForTimeout(110);
  }
  async function fresh(query) {
    // ?reset=1 先清存档与历史：直接 clear 会被上一页 unload 的 flush 写回。
    await boot("reset=1");
    await boot(query);
  }
  async function activeId() {
    return page.evaluate(() => (document.activeElement && document.activeElement.id) || "");
  }
  const opt = (id) => '.xb-multi-option[data-multi-id="' + id + '"]';
  async function checkedCount() {
    return page.$$eval(".xb-multi-option.is-checked", (els) => els.length);
  }
  async function advanceOnce() {
    if (mobile) {
      await page.touchscreen.tap(422, 330);
    } else {
      await page.locator("#scene-vn").click({ position: { x: 640, y: 560 } });
    }
    await page.waitForTimeout(220);
  }
  async function enterP024() {
    await fresh("chapter=prologue&node=p024");
    if (await vis("#vn-title-card")) await click("#vn-title-card");
    await page.waitForSelector("#vn-multichoice", { state: "visible" });
    await page.waitForTimeout(120);
  }
  async function advanceToMultichoice(maxSteps) {
    for (let i = 0; i < (maxSteps || 12); i += 1) {
      if (await vis("#vn-multichoice")) return true;
      await advanceOnce();
    }
    return await vis("#vn-multichoice");
  }
  async function openBagModal() {
    if (mobile) await page.tap("#vn-multi-confirm");
    else await click("#vn-multi-confirm");
    await page.waitForTimeout(120);
  }

  try {
    if (caseName === "all" || caseName === "file") {
      // 1) 空行囊：状态行、默认隐藏、弹窗内容与焦点
      await enterP024();
      eq("进入 p024 多选可见", await vis("#vn-multichoice"), true);
      eq("提示窗默认隐藏", await vis("#bag-confirm-modal"), false);
      eq("初始状态行", await text("#vn-multi-status"), "行囊 0/4 格 · 已选 0 样，最多 5 样");
      eq("确认键文案", await text("#vn-multi-confirm"), "系好行囊");
      await openBagModal();
      eq("空行囊点确认弹提示", await vis("#bag-confirm-modal"), true);
      eq("提示窗标题", await text("#bag-confirm-title"), "行囊");
      eq("提示文案逐字", await text("#bag-confirm-body"), COPY);
      eq("「是」文案", await text("#bag-confirm-yes"), "是");
      eq("「否」文案", await text("#bag-confirm-no"), "否");
      eq("默认焦点在「是」", await activeId(), "bag-confirm-yes");
      eq("弹窗下方仍是多选", await vis("#vn-multichoice"), true);
      eq("弹窗期间物资未结算", await checkedCount(), 0);
      await shot("01-empty-confirm");

      // 2) 遮罩挡住下面的确认键
      const under = await page.locator("#vn-multi-confirm").boundingBox();
      if (under) {
        await page.mouse.click(under.x + under.width / 2, under.y + under.height / 2);
        await page.waitForTimeout(120);
      }
      eq("点遮罩不误触下面的确认", await vis("#bag-confirm-modal"), true);

      // 3) Tab 锁在「是/否」之间
      if (!mobile) {
        await page.keyboard.press("Tab");
        eq("Tab 到「否」", await activeId(), "bag-confirm-no");
        await page.keyboard.press("Tab");
        eq("Tab 回到「是」", await activeId(), "bag-confirm-yes");
      }

      // 4) Esc = 否：关窗、焦点回确认、不动已选
      if (!mobile) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(120);
      } else {
        await page.tap("#bag-confirm-no");
        await page.waitForTimeout(120);
      }
      eq("Esc/否 关闭提示", await vis("#bag-confirm-modal"), false);
      eq("关闭后焦点回确认键", await activeId(), "vn-multi-confirm");
      eq("关闭后仍在多选", await vis("#vn-multichoice"), true);
      eq("关闭后状态行不变", await text("#vn-multi-status"), "行囊 0/4 格 · 已选 0 样，最多 5 样");

      // 5) 选两样再点确认 → 弹窗 → 点「否」保留已选
      await click(opt("medicine"));
      await click(opt("barley"));
      eq("两样占一格", await text("#vn-multi-status"), "行囊 1/4 格 · 已选 2 样，最多 5 样");
      await openBagModal();
      eq("半满也弹提示", await vis("#bag-confirm-modal"), true);
      await click("#bag-confirm-no");
      eq("点「否」关窗", await vis("#bag-confirm-modal"), false);
      eq("点「否」后仍选着两样", await checkedCount(), 2);
      eq("点「否」后状态行不变", await text("#vn-multi-status"), "行囊 1/4 格 · 已选 2 样，最多 5 样");
      eq("点「否」后焦点回确认键", await activeId(), "vn-multi-confirm");

      // 6) 退回后还能继续补选
      await click(opt("shoes"));
      eq("退回后可继续补选", await text("#vn-multi-status"), "行囊 2/4 格 · 已选 3 样，最多 5 样");
      await click(opt("shoes"));
      await shot("02-after-no-multichoice");

      // 7) 「是」→ 结算 → 出发前物资页 → 结算页
      await openBagModal();
      await shot("03-before-yes");
      await click("#bag-confirm-yes");
      eq("点「是」立即关窗", await vis("#bag-confirm-modal"), false);
      await page.waitForSelector("#pack-panel", { state: "visible", timeout: 3000 });
      eq("「是」后到出发前物资页", await text("#pack-title"), "出发前");
      has("物资页列出药", await text("#pack-list"), "药");
      has("物资页列出青稞", await text("#pack-list"), "青稞");
      has("物资页行囊 1 格 / 4 格", await text("#pack-summary"), "行囊 1 格 / 4 格");
      ok("没有带的东西不在行囊", (await text("#pack-list")).indexOf("铁锅") === -1, await text("#pack-list"));
      await shot("04-after-yes-pack");
      await click("#pack-close");
      await page.waitForSelector("#vn-result", { state: "visible", timeout: 3000 });
      const resultText = await text("#vn-result");
      has("结算页有药", resultText, "药");
      has("结算页有青稞", resultText, "青稞");
      await shot("05-result");
      await click("#vn-result .vn-result__more");
      await page.waitForTimeout(260);
      has("继续到 p026 旁白", await text("#vn-text"), "天快亮时，行囊定了");

      // 8) 四格装满：不弹提示，直接出发
      await enterP024();
      for (const id of ["medicine", "barley", "shoes", "homepot"]) await click(opt(id));
      eq("四样正好装满", await text("#vn-multi-status"), "行囊 4/4 格 · 已选 4 样，最多 5 样");
      await openBagModal();
      eq("装满不弹提示", await vis("#bag-confirm-modal"), false);
      await page.waitForSelector("#pack-panel", { state: "visible", timeout: 3000 });
      eq("装满直接到出发前", await text("#pack-title"), "出发前");
      has("铁锅进包", await text("#pack-list"), "铁锅");
      await shot("06-full-no-modal");
      await click("#pack-close");
      await page.waitForSelector("#vn-result", { state: "visible", timeout: 3000 });

      // 9) 空行囊选「是」：照样能走（没有物资的组合）
      await enterP024();
      await openBagModal();
      await click("#bag-confirm-yes");
      await page.waitForSelector("#pack-panel", { state: "visible", timeout: 3000 });
      has("空行囊照样出发", await text("#pack-summary"), "行囊 0 格 / 4 格");
      has("空行囊没有可用组合", await text("#pack-list"), "没有能用的组合");
      await shot("07-empty-yes-pack");
      await click("#pack-close");
      await page.waitForSelector("#vn-result", { state: "visible", timeout: 3000 });
      const emptyText = await text("#vn-result");
      has("空行囊结算页有随身物", emptyText, "花名册和铅笔一直贴身带着");
      has("空行囊结算页写 0/4 格", emptyText, "行囊 0/4 格");

      // 10) 带门板（2 格）：选两样 3/4 弹窗；补鞋到 4/4 不弹
      await fresh("chapter=prologue&node=p021");
      await page.waitForSelector("#vn-choices", { state: "visible" });
      await click('#vn-choices [data-key="A"]');
      ok("带门板后到 p024", await advanceToMultichoice(10));
      eq("门板占两格", await text("#vn-multi-status"), "行囊 2/4 格 · 已选 0 样，最多 5 样");
      await click(opt("medicine"));
      await click(opt("barley"));
      eq("门板加两样为三格", await text("#vn-multi-status"), "行囊 3/4 格 · 已选 2 样，最多 5 样");
      await openBagModal();
      eq("带门板未满也弹提示", await vis("#bag-confirm-modal"), true);
      await shot("08-door-partial-confirm");
      await click("#bag-confirm-no");
      eq("带门板退回仍在多选", await vis("#vn-multichoice"), true);
      eq("带门板退回仍选两样", await checkedCount(), 2);
      await click(opt("shoes"));
      eq("补鞋后四格满", await text("#vn-multi-status"), "行囊 4/4 格 · 已选 3 样，最多 5 样");
      await openBagModal();
      eq("带门板装满不弹提示", await vis("#bag-confirm-modal"), false);
      await page.waitForSelector("#pack-panel", { state: "visible", timeout: 3000 });
      has("物资页标注门板占两格", await text("#pack-summary"), "门板占两格");
      await shot("09-door-full-pack");
      await click("#pack-close");
      await page.waitForSelector("#vn-result", { state: "visible", timeout: 3000 });

      // 11) 键盘：Enter 落在「是」上即继续
      await enterP024();
      await click(opt("medicine"));
      await openBagModal();
      eq("键盘测试焦点在是", await activeId(), "bag-confirm-yes");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(260);
      eq("Enter 接受后关窗", await vis("#bag-confirm-modal"), false);
      await page.waitForSelector("#pack-panel", { state: "visible", timeout: 3000 });
      await shot("10-enter-yes");

      // 12) 二次点击确认不会重复结算
      await enterP024();
      await openBagModal();
      await click("#bag-confirm-yes");
      await page.waitForTimeout(60);
      const toastNow = await text("#toast");
      ok("连点不会报重复结算", toastNow.indexOf("这一步没有记下来") === -1, toastNow);
      await page.waitForSelector("#pack-panel", { state: "visible", timeout: 3000 });
      eq("连点后仍只有一次出发前", await text("#pack-title"), "出发前");
    } else if (caseName === "mobile") {
      await enterP024();
      await page.tap("#vn-multi-confirm");
      await page.waitForTimeout(150);
      eq("移动端弹提示", await vis("#bag-confirm-modal"), true);
      eq("移动端文案逐字", await text("#bag-confirm-body"), COPY);
      const yes = await page.locator("#bag-confirm-yes").boundingBox();
      const no = await page.locator("#bag-confirm-no").boundingBox();
      ok("移动端「是」热区 >= 44 CSS px", yes && yes.height >= 44 && yes.width >= 44, JSON.stringify(yes));
      ok("移动端「否」热区 >= 44 CSS px", no && no.height >= 44 && no.width >= 44, JSON.stringify(no));
      ok("移动端两个键都在视口内",
        yes && no && yes.x >= 0 && no.x >= 0 && yes.y >= 0 && no.y >= 0 &&
        yes.x + yes.width <= 845 && no.x + no.width <= 845 &&
        yes.y + yes.height <= 391 && no.y + no.height <= 391,
        JSON.stringify({ yes, no }));
      const modal = await page.locator("#bag-confirm-modal .xb-door").boundingBox();
      ok("移动端弹窗不出界", modal && modal.x >= 0 && modal.y >= 0 && modal.width <= 844,
        JSON.stringify(modal));
      const bodyBox = await page.$eval("#bag-confirm-body", (el) => ({ sw: el.scrollWidth, cw: el.clientWidth, fs: getComputedStyle(el).fontSize }));
      ok("移动端提示文案不横向溢出", bodyBox.sw <= bodyBox.cw + 1, JSON.stringify(bodyBox));
      ok("移动端提示字号 >= 14 CSS px", parseFloat(bodyBox.fs) >= 14, bodyBox.fs);
      await shot("11-mobile-confirm");
      await page.tap("#bag-confirm-no");
      await page.waitForTimeout(150);
      eq("移动端点「否」关窗", await vis("#bag-confirm-modal"), false);
      eq("移动端点「否」回多选", await vis("#vn-multichoice"), true);
      await page.tap(opt("medicine"));
      await page.waitForTimeout(120);
      await page.tap("#vn-multi-confirm");
      await page.waitForTimeout(150);
      await shot("12-mobile-before-yes");
      await page.tap("#bag-confirm-yes");
      await page.waitForSelector("#pack-panel", { state: "visible", timeout: 3000 });
      eq("移动端点「是」到出发前", await text("#pack-title"), "出发前");
      const closeBtn = await page.locator("#pack-close").boundingBox();
      ok("移动端出发前出口热区 >= 44 CSS px", closeBtn && closeBtn.height >= 44 && closeBtn.width >= 44, JSON.stringify(closeBtn));
      await shot("13-mobile-pack");
      await page.tap("#pack-close");
      await page.waitForSelector("#vn-result", { state: "visible", timeout: 3000 });
      has("移动端结算页有药", await text("#vn-result"), "药");
    }

    ok("全程 0 console error", errors.length === 0, errors.join(" | "));
    ok("全程 0 失败请求", failed.length === 0, failed.join(" | "));
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
