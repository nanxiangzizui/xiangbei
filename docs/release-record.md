# 《向北》发布记录（v1.0.0）

> 本文件记录步骤八（打包与交差）的版本、基线、交付物、门禁与例外。
> 状态源仍是 `.claude/CLAUDE.md`；测试历史见 `docs/test-record.md`，本文件不覆盖步骤七结论。

## 1. 版本与基线

| 项 | 值 |
|---|---|
| 内部版本 | v1.0.0 |
| 交付日期 | 2026-11-03 |
| RELEASE_BASE（步骤七 tag 提交） | `4bb389098511407a9a4a39e1f218a9b76ad7883f`（step-7-done） |
| 发布提交 | 项目仓库 `d6c17e728fce1335d81474bffa80987c865b280e`（`step-8-done`）；公网部署提交 `7dbe2b48ff43da6be191d3b521e638540291f306`（GitHub Pages） |
| 平台 | **GitHub Pages**（`main` / root，2026-11-03 上线）；Cloudflare Pages Direct Upload 备选（OAuth 未完成，未部署） |
| 公网 URL | **https://nanxiangzizui.github.io/xiangbei/** |
| 浏览器基线 | Edge 156.0.4314.58（步骤七 + 步骤八发布包实测）；Chrome/Safari 例外见 §6 |
| 项目名/URL 前缀 | xiangbei |
| 游戏内版本行 | “试玩版 · 人物虚构，非史料人物”（未改标题/印章/菜单） |

## 2. 用户确认（2026-11-03）

| # | 输入 | 结论 |
|---|---|---|
| 1 | 制作名单姓名/化名与角色 | 全部署名为 **刘子政**；不写学校、地址、账号 |
| 2 | 是否打包字体 | **不打包**；系统回退；credits/design-note/README 三处一致 |
| 3 | 部署平台 | 用户先按“交付可上传站点”处理；2026-11-03 下午要求继续上传，最终选 **GitHub Pages**（`nanxiangzizui/xiangbei`，`main` / root）；Cloudflare OAuth 未完成，未部署 |
| 4 | 账号/部署授权 | 用户提供 fine-grained PAT（仅临时文件，不写入仓库）；push 成功；Pages 由用户在仓库 Settings 手动开启；部署后删除 token 并建议撤销 |
| 5 | 视频是否公开 | **用户明确取消演示视频**（“不录视频，且去除录视频这一项，不视为未完成”）；本版不生成 MP4，不列为缺口 |
| 6 | 是否接受 P1 例外 | 继续 carry（X1–X5、X7、X10、X12 等，见 §6） |
| 7 | 所有路径是否必须 ≤20:00 | 不裁剪；按 T20/静态/极端三口径如实写 |
| 8 | 项目名/URL 前缀 | xiangbei |

> 以上为 2026-11-03 用户答复；部署经用户明确要求后执行（GitHub Pages），公开视频未执行；没有把“待定”写成“可以”。

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
| dist/design-note.pdf | 291464 | `f9355b398cf93128226ce1656a74cffbeb87997a60a9d2364fb881bad2712740` |
| dist/xiangbei-v1.0.0-offline.zip | 375948 | `58de403dda9c0b271a7c609ccffaeadf09de40fa5e4e5e1ebf2e42cb7684a944` |

> 注：T8.4 只改 index.html 标题页链接与 style.css 的 `.title-credits` / `:focus-visible`；engine/story/minigames/art 未改。PDF 在补测 fps/X12 后于 2026-11-03 12:54 重新生成（加入 GitHub Pages 公网链接），上表是最终值，已与 `dist/site`、`dist/xiangbei-v1.0.0`、ZIP 逐文件比对；PDF 仅说明页变化，运行时不改。

## 4. 交付物

| 项 | 路径/URL | 状态 | 说明 |
|---|---|---|---|
| 链接 | **https://nanxiangzizui.github.io/xiangbei/** | **已上线（GitHub Pages）** | 2026-11-03；仓库 `nanxiangzizui/xiangbei`，`main` / root；部署提交 `7dbe2b4`；live smoke 16/16 |
| 发布站点 | `dist/site/` | **已生成并回归** | 8 文件 / 672,029 B；六运行时 + CREDITS.txt + design-note.pdf |
| 离线 ZIP | `dist/xiangbei-v1.0.0-offline.zip` | **已生成并回归** | 10 条目 / 375,948 B；根目录 `xiangbei-v1.0.0/`；含 README.txt |
| 设计说明 PDF | `dist/design-note.pdf` | **已生成并复核** | A4 一页 / 291,464 B；含 ToUnicode；人工复制粘贴未单独记录 |
| 演示视频 | — | **用户取消，不计缺口** | 不生成、不公开；`docs/demo-script.md` 保留作现场演示稿 |
| 字体清单 | `docs/credits.md` + `project/CREDITS.txt` | **完成** | 本版不打包字体；包内字体 0 字节；系统回退 |
| 制作名单 | `project/CREDITS.txt` + 标题页链接 | **完成** | 刘子政；2,025 B；标题页右下可打开 |
| 哈希清单 | `dist/SHA256SUMS.txt` | **完成** | 19 行；含 PDF/ZIP/site/package |

## 5. 门禁

| 门禁 | 结果 | 证据 |
|---|---|---|
| G0 输入 | 通过 | §2；八项均有结论 |
| G1 史实/字体 | 通过（字体走不打包分支） | `docs/sources.md` 2026-11-03 链接复核；红线 10/10；X6 |
| G2 说明/名单 | 通过 | PDF 1 页 / 291,464 B；CREDITS 2,025 B；无占位；标题链接 44 逻辑 px |
| G3 发布包 | 通过 | `python project/tools/release.py verify`；ZIP 白名单 10 条目；site/package 逐文件一致 |
| G4 部署/视频 | 通过（GitHub Pages 已上线）；视频用户取消 | §2/§4；Cloudflare OAuth 未完成，未部署；不比附为已完成 |
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
| — | 公网链接 | **已上线（GitHub Pages）** | https://nanxiangzizui.github.io/xiangbei/；2026-11-03；部署提交 `7dbe2b4` |
| — | Cloudflare Pages | **未部署** | OAuth 三次均超时（authorization_pending / 网络超时）；不写成已部署 |

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
| 公网 live smoke | Edge 156 headless，https://nanxiangzizui.github.io/xiangbei/ | **16/16**；标题、CREDITS、PDF、起步、localStorage、门板入口；0 console error / pageerror / requestfailed / HTTP≥400 / 外部请求 |
| 公网文件哈希 | 8 个站点文件 | **8/8**；index/story/minigames/art/CREDITS/PDF 精确一致；engine/style 远端为 LF，按 CRLF→LF 规范化后一致；PDF `f9355b39…` 精确一致 |

> 证据目录：`docs/evidence/step-08/`（site-http-full、zip-file-full、site-http-all、site-http-step8、site-mobile-step8、gh-pages-live、截图与 result.json）。
> PDF 在 `_pw-step8` 专项后补写 fps/X12 并重新生成；`release.py verify` 通过（291,464 B）。PDF 不参与运行时，完整流程证据对应同一组六运行时。

## 8. 结论

- 发布状态：**已交付并部署**（GitHub Pages，2026-11-03）；演示视频按用户取消；字体不打包。
- 公网入口：**https://nanxiangzizui.github.io/xiangbei/**；仓库 `nanxiangzizui/xiangbei`，`main` / root；部署提交 `7dbe2b4`。
- 不写“所有验收通过”：P0/P1 例外按 §6 carry；公网只做了 16/16 live smoke，完整流程/96 用例/移动四关仍在发布包本地证据中，不写成“公网完整流程通过”。
- 交付物：`dist/site/`（8 文件 / 672,029 B）；离线包 `dist/xiangbei-v1.0.0-offline.zip`（10 条目 / 375,948 B）；说明 `dist/design-note.pdf`（291,464 B）。
- 收尾：临时 token 文件已删除；建议用户在 GitHub 撤销该 fine-grained PAT；如需回滚，将 `main` 退回 `7f653fb`（初次部署）或上一提交。
- 如需补 Chrome/Safari/真机/音频/fps，先更新本文件再改结论；不要补写未发生的结果。

## 9. 部署记录（已执行）

1. 仓库：`https://github.com/nanxiangzizui/xiangbei`；分支 `main`；Pages Source = `main` / root。
2. 初次部署：`7f653fb`（2026-11-03 12:45 +08:00）；公网在 12:47 左右返回 200。
3. PDF/说明刷新：`7dbe2b4`（2026-11-03 12:54 +08:00）；Pages 自动重建，PDF 在 12:54:40 +08:00 更新为 291,464 B。
4. 验证：8 个文件哈希 8/8（engine/style 按 LF 规范化）；PDF SHA256 `f9355b39…` 精确一致；公网 live smoke 16/16。
5. 更新流程：覆盖 `dist/site/` → 提交并 push `main` → 等 Pages 重建 → 用 `README.md` “线上自检”复检；不要上传仓库根目录或开发文件。
6. 临时 token：`C:\Users\nanxiangzi\AppData\Local\Temp\xiangbei-gh-token.txt` 已于 2026-11-03 部署完成后删除（删除前 93 B）；token 不写入仓库、不写进本文件。建议用户在 GitHub 撤销该 fine-grained PAT。
