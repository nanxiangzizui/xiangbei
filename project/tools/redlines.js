#!/usr/bin/env node
// 剧本红线词表：check-script.js / check-build.js / smoke.js 共用；改词表只改这里
"use strict";

const BANNED = ["打鬼子", "共匪", "大捷", "完胜", "全歼", "血流成河", "逆袭", "开挂", "爽文", "燃爆", "这就是长征精神", "同志们，冲"];
// 真实人物只许出现在图鉴（docs/codex.md），剧本正文不得出现
const REAL = ["毛泽东", "周恩来", "朱德", "刘伯承", "陈树湘", "杨成武", "黄开湘", "林彪", "彭德怀", "博古", "李德", "张闻天", "王稼祥", "王平"];

module.exports = { BANNED, REAL };
