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

// requires 只做格式校验；旗标白名单由 check-build 深入检查。
function validRequires(text) {
  return text.split("&&").every((part) => {
    const key = part.trim().replace(/^!/, "");
    return /^[a-z][a-z0-9.]*$/.test(key);
  });
}

files.forEach((file) => {
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
  const endLine = /^【结束】next=([a-z]+)(?:\s*｜.*)?\s*$/m.exec(raw);
  let endNext = null;
  if (endLine) {
    endNext = endLine[1];
    endTargets.push({ file, next: endNext });
  } else {
    found.push(`${file} 缺带 next 的【结束】`);
  }
  // 隐藏终章 coda 的交互结果写在后续旁白里，不另设【结算】。
  if (raw.includes("【交互】") && !raw.includes("【结算】") && !raw.includes("coda:true")) {
    found.push(`${file} 有【交互】但缺【结算】`);
  }

  lines.forEach((line, i) => {
    for (const w of BANNED) if (line.includes(w)) found.push(`${file}:${i + 1} 禁用词「${w}」`);
    for (const w of REAL) if (line.includes(w)) found.push(`${file}:${i + 1} 真实人物「${w}」`);
    if (/^[ABCD]｜/.test(line) && !line.includes("cost:")) found.push(`${file}:${i + 1} 选项缺 cost`);
    if (/^[ABCD]｜/.test(line) && !line.includes("set:")) found.push(`${file}:${i + 1} 选项缺 set`);
    if (/^>>\s*选项/.test(line) && line.includes("限时") && !line.includes("默认")) {
      found.push(`${file}:${i + 1} 限时选项缺默认项`);
    }
    const requires = /｜requires:\s*([^｜]+)/.exec(line);
    if (requires && !validRequires(requires[1].trim())) {
      found.push(`${file}:${i + 1} requires 条件格式不合法`);
    }
  });

  for (const [tag, label] of [["【结束】", "结束"], ["- id:", "文件头"]]) {
    if (!raw.includes(tag)) found.push(`${file} 缺 ${label}`);
  }
  // 隐藏章 badend 不弹史实注；其余章每章一张。
  if (header && header[1] !== "badend" && !raw.includes("【史实注】")) found.push(`${file} 缺 史实注`);
  // 以 ending/map/coda 收束的章不需要下一章标题卡（吴起、隐藏终章）。
  const needsTitle = endNext && endNext !== "ending" && endNext !== "map" && endNext !== "coda";
  if (needsTitle && !raw.includes("【标题卡】")) found.push(`${file} 缺标题卡`);

  const ifs = (raw.match(/\[\[if:/g) || []).length;
  const ends = (raw.match(/\[\[end\]\]/g) || []).length;
  if (ifs !== ends) found.push(`${file} [[if]] ${ifs} 与 [[end]] ${ends} 不配对`);
});

if (!hasDisclaimer) found.push("全部剧本缺“虚构声明”");
if (files.length !== 9) found.push(`剧本应为 9 章，实际 ${files.length}`);

const byId = {};
for (const file of files) {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const id = /^- id:\s*([a-z]+)/m.exec(raw);
  if (id) byId[id[1]] = raw;
}
if (!byId.luding || !byId.luding.includes(">> 选项｜限时 12s｜默认 C") || !byId.luding.includes(">> 选项｜限时 12s｜默认 B")) {
  found.push("泸定危机缺有板默认 C / 无板默认 B");
}
if (!byId.grass || (byId.grass.match(/默认 C/g) || []).length < 2) {
  found.push("草地两次危机应各有一个默认 C（不救）");
}
if (!byId.wuqi || !byId.wuqi.includes("隐藏章: coda")) {
  found.push("吴起章缺隐藏章 coda 标记");
}
if (!byId.coda || !byId.coda.includes("八人点名") || !byId.coda.includes("满崽由冬生代答")) {
  found.push("隐藏终章缺点名八人/满崽代答");
}
if (!byId.badend || !byId.badend.includes("隐藏章")) {
  found.push("坏结局缺隐藏章 badend");
}

endTargets.forEach((item) => {
  if (item.next !== "ending" && item.next !== "map" && chapterIds.indexOf(item.next) === -1) {
    found.push(`${item.file} 的 next=${item.next} 不是章节/ending/map`);
  }
});

if (found.length === 0) {
  console.log(`OK：${files.length} 个剧本文件；禁用词 0；真实人物 0；选项缺项 0；requires 格式合法；危机默认与隐藏 coda/badend 完整；声明已标注`);
} else {
  for (const f of found) console.log("× " + f);
  console.log(`\n共 ${found.length} 处问题`);
  process.exitCode = 1;
}
