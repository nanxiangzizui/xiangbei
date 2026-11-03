# 《向北》发布记录（v1.0.0）

> 本文件记录步骤八（打包与交差）的版本、基线、交付物、门禁与例外。
> 状态源仍是 `.claude/CLAUDE.md`；测试历史见 `docs/test-record.md`，本文件不覆盖步骤七结论。

## 1. 版本与基线

| 项 | 值 |
|---|---|
| 内部版本 | v1.0.0 |
| 交付日期 | 2026-11-03 |
| RELEASE_BASE（步骤七 tag 提交） | `4bb389098511407a9a4a39e1f218a9b76ad7883f`（step-7-done） |
| 发布提交 | 见 `step-8-done` tag / `git log -1`；本文件随发布提交更新 |
| 平台 | 纯静态；首选 Cloudflare Pages Direct Upload；备选 GitHub Pages 子路径 |
| 浏览器基线 | Edge 156.0.4314.58（步骤七 + 步骤八发布包实测）；Chrome/Safari 例外见 §6 |
| 项目名/URL 前缀 | xiangbei |
| 游戏内版本行 | “试玩版 · 人物虚构，非史料人物”（未改标题/印章/菜单） |

## 2. 用户确认（2026-11-03）

| # | 输入 | 结论 |
|---|---|---|
| 1 | 制作名单姓名/化名与角色 | 全部署名为 **刘子政**；不写学校、地址、账号 |
| 2 | 是否打包字体 | **不打包**；系统回退；credits/design-note/README 三处一致 |
| 3 | 部署平台 | Cloudflare Pages（Direct Upload）为建议；用户自行上传 |
| 4 | 账号/部署授权 | **未提供**；本步不部署、不创建 remote、不 push；交付 `dist/site` 与 ZIP |
| 5 | 视频是否公开 | **用户明确取消演示视频**（“不录视频，且去除录视频这一项，不视为未完成”）；本版不生成 MP4，不列为缺口 |
| 6 | 是否接受 P1 例外 | 继续 carry（X1–X5、X7、X10、X12 等，见 §6） |
| 7 | 所有路径是否必须 ≤20:00 | 不裁剪；按 T20/静态/极端三口径如实写 |
| 8 | 项目名/URL 前缀 | xiangbei |

> 以上为 2026-11-03 用户答复；没有把“待定”写成“可以”。部署与公开视频两项不可逆动作均未执行。

## 3. 运行时与交付物冻结（SHA256）

| 文件 | 字节 | SHA256 |
|---|---:|---|
| project/index.html | 11802 | `77b13915af2feefd2c4ee4e8c044ec545e5a4a775c9a80a5ffc5a05a6918dce8` |
| project/style.css | 49211 | `4ac757a3ecd8b547f1d74740dadb5c491848c395190203b0894c8e0425c11d89` |
| project/engine.js | 131479 | `049bdff9050913053a70031c772244a1a56118bbef4b88fe7f25fbe0a0db7ae1` |
| project/story.js | 56372 | `d894dfd0317275c9e4c82b6039dee545355a86df8c4745f18597a05e761f689b` |
| project/minigames.js | 80063 | `d7bf59dd22b4dcdce7b43f37a9cf11a48c36f456d18d3f0d1ce26fd0d03e186b` |
| project/art.js | 49613 | `b2a00d481e459bb9cb39d61dd7eded66f75dcffa12169923eb719068d1c78a7b` |
| project/CREDITS.txt | 2025 | `3370c5efc0e1bb96676e604a33dbc5c2e62df91d233b71d99cd59b013354b629` |
| dist/design-note.pdf | 291770 | `57b2a51373277d88cef328619e639cfc843e29a5215a942f5dea55957f3b6c46` |
| dist/xiangbei-v1.0.0-offline.zip | 376880 | `e6895ce3fbef8d268fe4d7a822557607535f7bd9e32e1629fae835a9ab952cfe` |

> 注：T8.4 只改 index.html 标题页链接与 style.css 的 `.title-credits` / `:focus-visible`；engine/story/minigames/art 未改。PDF 在补测 fps/X12 后于 2026-11-03 重新生成，上表是最终值，已与 `dist/site`、`dist/xiangbei-v1.0.0`、ZIP 逐文件比对。

## 4. 交付物

| 项 | 路径/URL | 状态 | 说明 |
|---|---|---|---|
| 链接 | — | **未部署（按用户选择由用户上传）** | 不伪造 URL；上传后把 URL 填回本表 |
| 发布站点 | `dist/site/` | **已生成并回归** | 8 文件 / 672,335 B；六运行时 + CREDITS.txt + design-note.pdf |
| 离线 ZIP | `dist/xiangbei-v1.0.0-offline.zip` | **已生成并回归** | 10 条目 / 376,880 B；根目录 `xiangbei-v1.0.0/`；含 README.txt |
| 设计说明 PDF | `dist/design-note.pdf` | **已生成并复核** | A4 一页 / 291,770 B；含 ToUnicode；人工复制粘贴未单独记录 |
| 演示视频 | — | **用户取消，不计缺口** | 不生成、不公开；`docs/demo-script.md` 保留作现场演示稿 |
| 字体清单 | `docs/credits.md` + `project/CREDITS.txt` | **完成** | 本版不打包字体；包内字体 0 字节；系统回退 |
| 制作名单 | `project/CREDITS.txt` + 标题页链接 | **完成** | 刘子政；2,025 B；标题页右下可打开 |
| 哈希清单 | `dist/SHA256SUMS.txt` | **完成** | 19 行；含 PDF/ZIP/site/package |

## 5. 门禁

| 门禁 | 结果 | 证据 |
|---|---|---|
| G0 输入 | 通过 | §2；八项均有结论 |
| G1 史实/字体 | 通过（字体走不打包分支） | `docs/sources.md` 2026-11-03 链接复核；红线 10/10；X6 |
| G2 说明/名单 | 通过 | PDF 1 页 / 291,770 B；CREDITS 2,025 B；无占位；标题链接 44 逻辑 px |
| G3 发布包 | 通过 | `python project/tools/release.py verify`；ZIP 白名单 10 条目；site/package 逐文件一致 |
| G4 部署/视频 | 部署未执行（用户上传）；视频用户取消 | §2；不在本步伪造 |
| G5 最终 | 通过（带 §6 例外） | check-build 38/38；smoke 46/46；发布包 http/file 完整流程；96/96 全用例 |

## 6. 例外与继承

| ID | 例外 | 本步状态 | 说明 |
|---|---|---|---|
| X1 | Chrome 未安装，完整流程未跑 | carry | 2026-11-02 用户接受 P0 环境例外；本步未补测 |
| X2 | Safari 无设备 | carry | 同上；不得写“Safari 通过” |
| X3 | 真机触摸未验 | carry | 仅 844×390 触摸模拟 |
| X4 | 音频主观听感未验 | carry | 只证 Web Audio 路由/峰值上限；未做真机耳机试听 |
| X5 | 真实后台/锁屏未验 | carry | 只用 visibility 模拟 |
| X6 | 字体未打包 | carry（本步明确决定） | 官方源不可达；系统回退；三处文档一致；字体 0 字节 |
| X7 | 计时版本未注明 | carry | 四次 04:52–08:33；C/D 版本注记仍缺；不把自动化 191 秒当真人 |
| X8 | 试玩为联合访谈 | 已由用户接受（P0 例外） | 不写成 3 份独立问卷 |
| X10 | 遵义第三刀未决 | carry | 未超 20 分钟，不裁剪 |
| X11 | fps 未采样 | **本步补测（带 caveat）** | 桌面标题 60.0 / 攀索 60.0；移动标题 60.0 / 攀索 48.7（最低 29.9、p95 33.4ms）；不写“稳定 60” |
| X12 | 制作名单移动物理热区 <44 | **本步记录** | 逻辑 100×44；桌面 45 逻辑 / 48 CSS px；844×390 下 41.2×24.4 CSS px；按 B16 同类例外，不重排标题 |
| — | 演示视频 | **用户取消** | 不视为未完成；不生成 MP4 |
| — | 公网链接 | **未部署（用户选择自行上传）** | 不伪造；README 给上传步骤 |

## 7. 发布回归（2026-11-03）

| 项 | 命令/对象 | 结果 |
|---|---|---|
| 语法 | `node --check` × 4 个 JS | 通过 |
| 构建自检 | `node project/tools/check-build.js` | **38/38** |
| 状态烟测 | `node project/tools/smoke.js` | **46/46** |
| 剧本红线 | `node project/tools/check-script.js docs/script` | OK：7 剧本 / 禁用词 0 / 真实人物 0 / 结构完整 |
| 发布包 | `python project/tools/release.py all` | stage / zip / verify / hash 全通过 |
| 发布站点 http 完整流程 | Edge 156 headless，`dist/site` | 191.1 秒 / 407 行；四关均有结果；5 卡 / 4 亮 / 7 名 / 0 划名；0 console error / pageerror / 404 / 外部请求 |
| 离线 ZIP file:// | 断网 + 解压 `dist/_unzip-test` | 191.1 秒 / 408 行；四关均有结果；5 卡 / 4 亮 / 7 名 / 0 划名；0 console error / pageerror / 404 / 外部请求 |
| 发布站点全用例 | `_pw-step7.js --case=all` | **96/96**（smoke/save/gallery/ending/minigames/viewport/mobile/privacy/audio/keyboard） |
| 发布专项桌面 | `_pw-step8.js --url=http` | **22/22**；CREDITS 新标签、键盘焦点、字体回退、PDF 200、fps |
| 发布专项移动 | `_pw-step8.js --url=http --mobile=1` | **22/22**；物理热区 41.2×24.4（X12） |
| 移动 844×390 | 发布站点 mobile 用例 + 步骤七移动全流程 | 标题/对话/ending/制作名单/触摸通过；四关触摸证据沿用步骤七 200.9 秒 / 406 行（发布包未逐一重跑四关） |

> 证据目录：`docs/evidence/step-08/`（site-http-full、zip-file-full、site-http-all、site-http-step8、site-mobile-step8、截图与 result.json）。
> PDF 在 `_pw-step8` 专项后补写 fps/X12 并重新生成；`release.py verify` 通过（291,770 B）。PDF 不参与运行时，完整流程证据对应同一组六运行时。

## 8. 结论

- 发布状态：**按用户 2026-11-03 调整口径完成交付准备**；链接由用户上传，演示视频取消。
- 不写“所有验收通过”：P0/P1 例外按 §6 carry；未跑的浏览器/真机项不写成通过。
- 本版可上传目录：`dist/site/`；离线包：`dist/xiangbei-v1.0.0-offline.zip`；说明：`dist/design-note.pdf`。
- 下一步（用户）：上传 `dist/site/` 后，按 `README.md` “线上自检”逐项勾选；把 URL 填回 §4，并保留部署 ID/时间。
- 如需补 Chrome/Safari/真机/音频/fps，先更新本文件再改结论；不要补写未发生的结果。

## 9. 上传清单（用户执行）

1. Cloudflare Pages → Create project → Direct Upload。
2. 上传 `dist/site/`，不要上传仓库根目录；构建命令留空。
3. 上传后检查：标题、制作名单、`design-note.pdf`、四关入口、七图鉴、ending、手机横屏、控制台 0 error/404、无外部请求。
4. 把 URL、部署时间、上传文件哈希写回 §4；若有失败，记“未部署/部分通过”，不要用临时文件分享站冒充正式链接。
