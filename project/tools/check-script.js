#!/usr/bin/env node
// 剧本红线自检：node project/tools/check-script.js docs/script
const fs = require("node:fs");
const path = require("node:path");
const { BANNED, REAL } = require("./redlines");

const DIR = process.argv[2] || "docs/script";
const files = fs.readdirSync(DIR).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();

const found = [];
let hasDisclaimer = false;

files.forEach((file, index) => {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const lines = raw.split(/\r?\n/);
  if (raw.includes("虚构声明")) hasDisclaimer = true;

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

if (found.length === 0) {
  console.log(`OK：${files.length} 个剧本文件；禁用词 0；真实人物 0；选项缺项 0；结构完整；声明已标注`);
} else {
  for (const f of found) console.log("× " + f);
  console.log(`\n共 ${found.length} 处问题`);
  process.exitCode = 1;
}
