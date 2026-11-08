#!/usr/bin/env node
"use strict";

// 专项：双击推进剧情不得选中文字（T11-20）。用法：node project/tools/_pw-select.js

const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function loadPlaywright() {
  const candidates = [
    process.env.PW_CORE,
    path.join(ROOT, "my-playwright-project", "node_modules", "playwright-core"),
    path.join(ROOT, "node_modules", "playwright-core"),
    "playwright-core"
  ].filter(Boolean);
  const failures = [];
  for (const candidate of candidates) {
    try { return { pw: require(candidate), resolved: candidate }; }
    catch (error) { failures.push(candidate + " (" + error.code + ")"); }
  }
  throw new Error("找不到 playwright-core；试过：" + failures.join("；"));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

(async () => {
  const { pw, resolved } = loadPlaywright();
  const OUT = path.join(ROOT, "docs", "evidence", "step-11", "select-none-" + stamp());
  fs.mkdirSync(OUT, { recursive: true });
  const log = [];
  const checks = [];
  const errors = [];
  function note(text) { const line = new Date().toISOString() + " " + text; console.log(line); log.push(line); }
  function check(name, ok, detail) {
    checks.push({ name, ok: !!ok, detail: detail === undefined ? "" : String(detail) });
    note((ok ? "PASS " : "FAIL ") + name + (detail ? " | " + detail : ""));
  }

  const browser = await pw.chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"]
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: "zh-CN" });
  const page = await context.newPage();
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (error) => errors.push(String(error && error.stack || error)));
  const base = pathToFileURL(path.join(PROJECT, "index.html")).href;
  note("playwright=" + resolved + " browser=" + browser.version() + " base=" + base);

  await page.goto(base + "?chapter=prologue&node=p001&debug=1", { waitUntil: "load" });
  await page.waitForSelector("#scene-vn:not([hidden])", { timeout: 10000 });
  await sleep(700);
  const firstText = (await page.textContent("#vn-text")) || "";
  check("对话节点已加载", firstText.trim().length > 0, firstText.trim().slice(0, 18));

  const computed = await page.evaluate(() => {
    const el = document.querySelector("#vn-text");
    const slot = document.querySelector("#vn-chapter");
    const cs = getComputedStyle(el);
    return {
      textUserSelect: cs.userSelect || cs.webkitUserSelect,
      chapterUserSelect: getComputedStyle(slot).userSelect
    };
  });
  check("正文 user-select: none", computed.textUserSelect === "none", computed.textUserSelect);
  check("章名 user-select: none", computed.chapterUserSelect === "none", computed.chapterUserSelect);

  const textBox = await page.locator("#vn-text").boundingBox();
  await page.mouse.dblclick(textBox.x + textBox.width / 2, textBox.y + textBox.height / 2);
  await sleep(180);
  const selectionAfterDouble = await page.evaluate(() => String(window.getSelection() || ""));
  const afterText = (await page.textContent("#vn-text")) || "";
  check("双击正文无选中文本", selectionAfterDouble === "", JSON.stringify(selectionAfterDouble.slice(0, 30)));
  check("双击后仍在对话节点", afterText.trim().length > 0, afterText.trim().slice(0, 18));
  await page.screenshot({ path: path.join(OUT, "dialogue-after-dblclick.png") });

  const chapterBox = await page.locator("#vn-chapter").boundingBox();
  await page.mouse.click(chapterBox.x + 8, chapterBox.y + chapterBox.height / 2, { clickCount: 3 });
  await sleep(120);
  const selectionAfterTriple = await page.evaluate(() => String(window.getSelection() || ""));
  check("三击章名无选中文本", selectionAfterTriple === "", JSON.stringify(selectionAfterTriple.slice(0, 30)));

  await page.goto(base + "?reset=1", { waitUntil: "load" });
  await page.waitForSelector("#scene-title:not([hidden])", { timeout: 10000 });
  await sleep(500);
  const titleBox = await page.locator(".title-main").boundingBox();
  await page.mouse.dblclick(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
  await sleep(150);
  const selectionOnTitle = await page.evaluate(() => String(window.getSelection() || ""));
  check("双击标题无选中文本", selectionOnTitle === "", JSON.stringify(selectionOnTitle.slice(0, 30)));
  await page.screenshot({ path: path.join(OUT, "title-after-dblclick.png") });

  check("0 console/pageerror", errors.length === 0, errors.join(" | ").slice(0, 200));

  const failed = checks.filter((item) => !item.ok).length;
  const result = {
    runId: path.basename(OUT), playwright: resolved, browser: browser.version(),
    checks, failed, errors, startedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(OUT, "run.log"), log.join("\n") + "\n");
  note("SUMMARY " + (checks.length - failed) + "/" + checks.length + " passed, failed=" + failed);
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
