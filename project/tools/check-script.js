#!/usr/bin/env node
// 剧本红线自检：node project/tools/check-script.js docs/script
const fs = require("node:fs");
const path = require("node:path");
const { BANNED, REAL } = require("./redlines");

const DIR = process.argv[2] || "docs/script";
const files = fs.readdirSync(DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();

const found = [];
let hasDisclaimer = false;
const chapterIds = [];
const endTargets = [];

files.forEach((file, index) => {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const lines = raw.split(/\r?\n/);
  if (raw.includes("虚构声明")) hasDisclaimer = true;
  const header = /^- id:\s*([a-z]+)/m.exec(raw);
  if (header) {
    if (chapterIds.indexOf(header[1]) !== -1) found.push(`${file} 章节 id 重复：${header[1]}`);
    chapterIds.push(header[1]);
  } else {
    found.push(`${file} 缺 - id:`);
  }
  const endLine = /^【结束】next=([a-z]+)\s*$/m.exec(raw);
  if (endLine) endTargets.push({ file, next: endLine[1] });
  else found.push(`${file} 缺带 next 的【结束】`);
  if (raw.includes("【交互】") && !raw.includes("【结算】")) found.push(`${file} 有【交互】但缺【结算】`);

  lines.forEach((line, i) => {
    for (const w of BANNED) if (line.includes(w)) found.push(`${file}:${i + 1} 禁用词「${w}」`);
    for (const w of REAL) if (line.includes(w)) found.push(`${file}:${i + 1} 真实人物「${w}」`);
    if (/^[ABC]｜/.test(line) && !line.includes("cost:")) found.push(`${file}:${i + 1} 选项缺 cost`);
    if (/^[ABC]｜/.test(line) && !line.includes("set:")) found.push(`${file}:${i + 1} 选项缺 set`);
    if (/^>>\s*选项/.test(line) && line.includes("限时") && !line.includes("默认")) found.push(`${file}:${i + 1} 限时选项缺默认项`);
  });

  for (const [tag, label] of [["【史实注】", "史实注"], ["【结束】", "结束"], ["- id:", "文件头"]]) {
    if (!raw.includes(tag)) found.push(`${file} 缺 ${label}`);
  }
  // 最后一章不需要标题卡（没有下一章）
  if (index < files.length - 1 && !raw.includes("【标题卡】")) found.push(`${file} 缺标题卡`);

  const ifs = (raw.match(/\[\[if:/g) || []).length;
  const ends = (raw.match(/\[\[end\]\]/g) || []).length;
  if (ifs !== ends) found.push(`${file} [[if]] ${ifs} 与 [[end]] ${ends} 不配对`);
});

if (!hasDisclaimer) found.push("全部剧本缺“虚构声明”");
if (files.length !== 7) found.push(`剧本应为 7 章，实际 ${files.length}`);
endTargets.forEach((item) => {
  if (item.next !== "ending" && item.next !== "map" && chapterIds.indexOf(item.next) === -1) {
    found.push(`${item.file} 的 next=${item.next} 不是章节/ending/map`);
  }
});

if (found.length === 0) {
  console.log(`OK：${files.length} 个剧本文件；禁用词 0；真实人物 0；选项缺项 0；结构完整；声明已标注`);
} else {
  for (const f of found) console.log("× " + f);
  console.log(`\n共 ${found.length} 处问题`);
  process.exitCode = 1;
}
