#!/usr/bin/env node
// 统计 docs/script/*.md 的正文口播字数（只算【…】行里 】之后的字）
// 用法: node project/tools/count-words.js docs/script
const fs = require("node:fs");
const path = require("node:path");

const DIR = process.argv[2] || "docs/script";
const SPEAKER = /^【([^】]+)】(.*)$/;
// 指令行：不算正文
const DIRECTIVE = new Set(["小游戏", "史实注", "标题卡", "结算", "交互", "结束"]);
const A_SEC = 0.166;
const B_SEC = 0.258;

const files = fs.readdirSync(DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
let total = 0;
const rows = [];
for (const file of files) {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  let chars = 0;
  let beats = 0;
  let choices = 0;
  let timed = 0;
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(SPEAKER);
    if (m) {
      if (DIRECTIVE.has(m[1])) continue;
      const text = m[2].replace(/\s/g, "");
      chars += Array.from(text).length;
      beats += 1;
      continue;
    }
    if (/^>>\s*选项/.test(line)) {
      choices += /限时/.test(line) ? 1 : 0;
      timed += /限时/.test(line) ? 1 : 0;
    }
  }
  rows.push({ file, chars, beats, choices, timed });
  total += chars;
}
for (const r of rows) {
  console.log(`${r.file.padEnd(20)} ${String(r.chars).padStart(5)} 字  beat ${String(r.beats).padStart(3)}  限时选项 ${r.timed}`);
}
const sec = Math.round(total * A_SEC);
const slow = Math.round(total * B_SEC);
console.log(`\n合计 ${total} 字｜A 口径 ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}｜B 口径 ${Math.floor(slow / 60)}:${String(slow % 60).padStart(2, "0")}`);
