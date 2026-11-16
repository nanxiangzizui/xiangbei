#!/usr/bin/env node
"use strict";
const path = require("path");
const fs = require("fs");
const http = require("http");

const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
function loadPlaywright() {
  return require(path.join(ROOT, "my-playwright-project", "node_modules", "playwright-core"));
}
function mimeFor(file) {
  return { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".css": "text/css; charset=utf-8" }[path.extname(file).toLowerCase()] || "application/octet-stream";
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

const BASES = [
  "plate_title", "plate_yudu", "plate_xiangjiang", "plate_xiangjiang_map",
  "plate_zunyi_hall", "plate_zunyi_street", "plate_jinsha", "plate_luding",
  "plate_luding_after", "plate_grass", "plate_grass_dawn", "plate_wuqi"
];

(async () => {
  const outDir = path.resolve(__dirname, "..", "..", "docs", "evidence", "lqip-gen");
  fs.mkdirSync(outDir, { recursive: true });
  const { chromium } = loadPlaywright();
  const { server, base } = await startServer();
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(base + "/index.html?lqip=1", { waitUntil: "domcontentloaded" });
  const results = await page.evaluate(async (bases) => {
    const out = {};
    for (const name of bases) {
      const response = await fetch("./assets/backgrounds/placeholders/" + name + ".webp", { cache: "no-store" });
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      out[name] = {};
      for (const [w, h, q] of [[240, 135, 0.32], [240, 135, 0.4], [320, 180, 0.35], [320, 180, 0.45], [480, 270, 0.35]]) {
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0, w, h);
        const data = canvas.toDataURL("image/webp", q);
        out[name][w + "x" + h + "-q" + q] = { bytes: Math.round((data.length - data.indexOf(",") - 1) * 3 / 4), chars: data.length, data };
      }
    }
    return out;
  }, BASES);
  fs.writeFileSync(path.join(outDir, "lqip-variants.json"), JSON.stringify(results, null, 2));
  const summary = {};
  for (const baseName of BASES) {
    summary[baseName] = {};
    for (const key of Object.keys(results[baseName])) summary[baseName][key] = results[baseName][key].bytes;
  }
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
  server.close();
})().catch((err) => { console.error(err); process.exitCode = 1; });
