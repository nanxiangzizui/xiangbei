#!/usr/bin/env node
"use strict";
const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");
const ROOT = path.resolve(__dirname, "..", "..");
const PROJECT = path.join(ROOT, "project");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
function loadPlaywright() {
  const candidates = [process.env.PW_CORE, path.join(ROOT, "my-playwright-project", "node_modules", "playwright-core"), path.join(ROOT, "node_modules", "playwright-core"), "playwright-core"].filter(Boolean);
  for (const candidate of candidates) { try { return require(candidate); } catch (error) {} }
  throw new Error("no playwright-core");
}
function mimeFor(file) {
  return { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp", ".woff2":"font/woff2", ".mp3":"audio/mpeg", ".txt":"text/plain; charset=utf-8" }[path.extname(file).toLowerCase()] || "application/octet-stream";
}
async function startServer() {
  const server = http.createServer((req,res)=>{
    let p = decodeURIComponent((req.url||"/").split("?")[0]); if (p==="/") p="/index.html";
    const file = path.resolve(PROJECT, "."+p);
    if (!file.startsWith(PROJECT+path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file,(e,d)=>{ if(e){res.writeHead(404).end();return;} res.writeHead(200,{"Content-Type":mimeFor(file),"Cache-Control":"no-store"}); res.end(d); });
  });
  await new Promise((r,j)=>{server.once("error",j);server.listen(0,"127.0.0.1",r);});
  return { server, base:"http://127.0.0.1:"+server.address().port };
}
(async()=>{
  const pw = loadPlaywright();
  const serverInfo = await startServer();
  const browser = await pw.chromium.launch({ executablePath: EDGE, headless: true, args:["--no-sandbox","--disable-gpu","--allow-file-access-from-files"] });
  const context = await browser.newContext({ viewport:{width:1366,height:768}, locale:"zh-CN" });
  const page = await context.newPage();
  const errors=[]; page.on("console",m=>{if(m.type()==="error")errors.push(m.text());}); page.on("pageerror",e=>errors.push(String(e)));
  await page.goto(serverInfo.base+"/index.html",{waitUntil:"load"});
  await page.waitForTimeout(400);
  const menu = await page.locator(".title-menu [data-action]").count();
  console.log("menu buttons",menu);
  await page.locator('.title-menu [data-action="branch"]').click();
  await page.waitForTimeout(300);
  console.log("branch visible",await page.locator("#branch-map").isVisible());
  console.log("count",await page.locator("#branch-count").innerText());
  console.log("chapters",await page.locator("#branch-chapters .xb-branch-chapter").count());
  console.log("endings",await page.locator(".xb-branch-ending").count());
  console.log("locked endings",await page.locator(".xb-branch-ending.is-locked").count());
  await page.locator("#branch-chapters .xb-branch-chapter").first().click();
  await page.waitForTimeout(250);
  console.log("detail visible",await page.locator("#branch-detail").isVisible());
  console.log("detail title",await page.locator("#branch-detail-title").innerText());
  console.log("detail body",(await page.locator("#branch-detail-body").innerText()).slice(0,220));
  await page.locator("#branch-detail-close").click();
  await page.waitForTimeout(150);
  console.log("detail closed",!(await page.locator("#branch-detail").isVisible()));
  await page.locator("#branch-close").click();
  await page.waitForTimeout(150);
  console.log("map closed",!(await page.locator("#branch-map").isVisible()));
  console.log("errors",JSON.stringify(errors));
  await browser.close(); serverInfo.server.close();
})().catch(e=>{console.error(e);process.exit(1);});
