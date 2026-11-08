# 《向北》发布记录（v1.0.0 历史 + v1.1.0 / v1.1.1 已部署）

> 本文件记录步骤八（打包与交差）的版本、基线、交付物、门禁与例外；v1.0.0 历史见 §1–§9，v1.1.0 素材/阅读增强与部署见 §10。
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

## 10. v1.1.0 素材/阅读增强（2026-11-04，已部署）

> 本节记录 v1.1.0 的范围、交付物、回归与部署；§1–§9 保留为 v1.0.0 历史。公网自 2026-11-04 起为 v1.1.0，部署提交 `f8b2045`。

### 10.1 范围

| 项 | 内容 |
|---|---|
| 背景 | 12 张 1920×1080 双色调/版画化底图；湘江战役旧地图作第一章标题卡；1 张豆包 Seedream 生成的标题插画（虚构红军小战士/于都河，非史料人物/现场；右下角“豆包AI生成”水印已修补，底边另加暗部） |
| 字体 | 随包 OFL 1.1 子集：`XB Smiley` 158,048 B + `XB Zhuque` 394,452 B；大标题/印章用得意黑，章节/正文/图鉴用朱雀仿宋；保留 `?fonts=fallback` |
| 环境音 | 5 条 CC0 循环（风、河、雨、鸟、火），MP3；与既有 Web Audio 合成床叠加 |
| 配乐 | 8 首 CC0/CC-BY 现代配乐，MP3 统一归一化 RMS≈0.10、peak≤0.95；musicBus 0.62、gains 1.5；file:// 直连回退并修正旧曲复响 |
| 阅读/演出 | 6 张照片章首卡（日期/地点）、7 张图鉴缩略图 + 照片年代说明、照片 28s 缓慢推拉 + 预加载、总/配乐/环境三档音量、暂停花名册、file:// 1.4s 淡入淡出 |
| 未做 | 第 8 项清理/兼容性专项（未用 `plate_loushan`、Chrome/Safari/真机补测、移动 WebP 变体）留到后续；不写成已完成 |

### 10.2 交付物（已部署）

| 项 | 路径 | 字节/数量 |
|---|---|---:|
| 发布站点 | `dist/site/` | 47 文件 / 27,888,240 B |
| 离线包目录 | `dist/xiangbei-v1.1.0/` | 48 文件 / 27,890,417 B |
| 离线 ZIP | `dist/xiangbei-v1.1.0-offline.zip` | 49 条目 / 27,347,934 B |
| 设计说明 PDF | `dist/design-note.pdf` | 1 页 / 299,941 B |
| 制作名单 | `project/CREDITS.txt` | 9,438 B |
| 哈希清单 | `dist/SHA256SUMS.txt` | 97 文件 / 11,105 B（含 PDF/ZIP/site/package） |

`python project/tools/release.py verify` 已通过：site 47 文件、package 48 文件、ZIP 49 条目、PDF 1 页、CREDITS 9,438 B。

### 10.3 门禁与回归

| 项 | 结果 |
|---|---|
| 语法 | `node --check` × 4 个 JS 通过 |
| 构建自检 | `check-build.js` **38/38** |
| 状态烟测 | `smoke.js` **46/46** |
| 剧本红线 | `check-script.js docs/script` OK：7 剧本 / 禁用词 0 / 真实人物 0 / 结构完整 |
| 阅读层专项 | Edge http **21/21**；照片卡、图鉴缩略图/年代说明、三档音量、花名册、file:// 标题/字体/图 |
| 完整流程 http | 201.585 秒 / 405 行；四关均有结果；5 卡 / 4 亮 / 7 名 / 0 划名；0 console error / pageerror / 404 / 外部请求 |
| 完整流程 file:// | 197.639 秒 / 406 行；5 卡 / 4 亮 / 7 名 / 0 划名；0 错误 |
| 完整流程 844×390 | 207.978 秒 / 405 行；触摸；5 卡 / 4 亮 / 7 名 / 0 划名；0 错误 |
| 四关 | **20/20**；门板 0.1s、弃物 1.0s、渡船 89.3s（12/18 趟，37 船工）、攀索 29.9s（16 过 / 6 暗） |
| 章节卡 | **6/6** `has-photo`，地点与底图匹配；湘江为 `is-map` + `plate_xiangjiang_map.jpg` |
| 移动阅读层 | 844×390 标题/章首卡/图鉴/花名册在舞台内；7 缩略图全部加载；花名册 7 行 + 返回可见 |

证据目录：
- http 完整流程 `docs/evidence/step-07/edge-http-20261104-181721`
- file:// 完整流程 `docs/evidence/step-07/edge-file-20261104-182136`
- 移动完整流程 `docs/evidence/step-07/edge-http-20261104-182136-mobile`
- 四关 `docs/evidence/step-07/edge-http-20261104-minigames-unique`
- 章节卡 `docs/evidence/step-07/edge-http-20261104-titlecards`
- 移动阅读层 `docs/evidence/step-07/edge-mobile-20261104-feature`

### 10.4 素材例外（必须如实说明）

- **吴起底图**是 1967 年《人民画报》的陕北杨家岭窑洞村，不是吴起镇；作“陕北地域示意”，不是 1935 年现场。
- **湘江底图**是湖南湘江边河镇，不是广西界首战场；只作时代氛围，不指认具体战场。第一章标题卡用 1934 年红军旧地图，是史料影像，不是战场照片。
- **1967 年《人民画报》**的娄山关/泸定桥影像摄于 1967 年，不是 1935 年现场。
- **遵义会议会址**照片摄于 2005 年，建筑经修缮；**遵义老城**图实际是红军遵义警备司令部旧址大门，不是街道。
- **无 1930 年代历史录音**；环境音与配乐均为现代 CC0/CC-BY 录音/作曲，未冒充历史音频。
- 标题插画由豆包 Seedream 生成，已去除右下角生成水印并在底边加暗部；画面人物与场景为虚构，不是史料人物/现场。授权与逐张署名见 `project/CREDITS.txt`、`docs/credits.md`、`resource/README.md`。

### 10.5 部署状态（已执行）

- **已部署**：2026-11-04 18:42 +08:00，`nanxiangzizui/xiangbei` 的 `main` / root 更新到 `f8b20451cd2ec42766ed6140c1391a44a9c72459`；公网 https://nanxiangzizui.github.io/xiangbei/ 已返回 v1.1.0 文件。
- 部署方式：把 `dist/site/` 47 个文件与 `.nojekyll` 写入独立部署仓库 `dist/_gh-pages`，提交后 push；网站文件不包含 `project/`、`docs/`、`step/`、`tools/` 或测试证据。
- 认证：使用 GitHub OAuth device flow（scope `public_repo`），token 只存在于部署进程内存，未写入仓库/文件；部署完成后建议用户在 GitHub Settings → Applications 撤销该 OAuth 授权。
- 公网验证：用 `curl --resolve nanxiangzizui.github.io:443:185.199.108.153 --ssl-no-revoke` 绕过本机 DNS/CRL 问题；8 个关键文件 HTTP 200 且 SHA256 与本机 `dist/site` 一致——`index.html` 13,659 B、`plate_title.jpg` 529,043 B、`zhuque-game.woff2` 394,452 B、`shangri_river.mp3` 871,862 B、`plate_xiangjiang_map.jpg` 680,080 B、`smiley-game.woff2` 158,048 B、`CREDITS.txt` 9,438 B、`design-note.pdf` 299,941 B。
- **未做**：v1.1.0 公网浏览器 live smoke、完整流程、四关、移动端、96/96 全用例均未在公网重跑；这些结果来自本地 `dist/site` / ZIP / 开发服务器，不能写成“公网完整流程通过”。
- 回滚：如需回到 v1.0.0，把 `main` 退回 `7dbe2b4`；不要删除部署仓库历史。


## 11. v1.1.1 慢网/竖屏适配（2026-11-05，已部署）

### 11.1 范围与改动

- 底图三档：480×270 WebP 占位图（先出）→ 1600×900 WebP（替换）→ 1920 JPEG（兜底）；标题占位图 16,754 B，由 `index.html` 预加载。
- `art.js` 增加 `PLATE_FULL_DIR` / `PLATE_THUMB_DIR` / `PLATE_FALLBACK_DIR` 与 `plateSrc(sceneId, kind)`；`getThumb` 先加载缩略图，再加载大图；大图失败回退 JPEG，再失败回退程序化版画。
- 竖屏遮罩加提示：“如果转动手机没有反应，请点右上角菜单，选择‘在浏览器打开’。”
- `release.py` 的 `REQUIRED_ASSETS` 增列 12 张 1600 WebP 与 12 张 480 占位图。

### 11.2 构建与部署

| 项 | 结果 |
|---|---|
| 发布站点 | `dist/site` 73 文件 / 31,356,254 B |
| 离线包 | `dist/xiangbei-v1.1.1` 74 文件 / 31,358,431 B |
| 离线 ZIP | 75 条目 / 30,818,357 B |
| 设计说明 | 1 页 / 303,713 B / 含 ToUnicode |
| CREDITS | 9,667 B |
| SHA256SUMS | 149 文件 |

- **已部署**：2026-11-05 18:35 +08:00，`nanxiangzizui/xiangbei` 的 `main` / root 更新到 `88771d3f1baee74e8adfdfa51679924dbb00ac53`；公网 https://nanxiangzizui.github.io/xiangbei/ 已返回 v1.1.1 文件。
- 部署方式：将 `dist/site/` 73 个文件与 `.nojekyll` 写入独立部署仓库 `dist/_gh-pages`，提交后 push；网站文件不含 `project/`、`docs/`、`step/`、`tools/` 或测试证据。
- 源码：本地源码提交 `0290d58940d0c30d1f71bdeb9d0c891d9d94426c`，tag `v1.1.1`；未配置源码远程，部署仓库单独推送。

### 11.3 验证

- `node --check` 4/4；`check-build.js` 38/38；`smoke.js` 46/46；`check-script.js` OK；`release.py verify` OK。
- 本地 7 个章节场景（于都/湘江/遵义/金沙江/泸定/草地/吴起）全部到达 `is-photo`；0 console error / failed request。
- 本地慢网模拟：占位图约 32ms 出现，1600 WebP 约 5s 替换；390×844 竖屏提示、844×390 横屏舞台、`file://` 标题/字体/底图均通过。
- 公网浏览器：标题页 1.74s 可交互；占位图 1.75s（`is-photo is-placeholder`），全图 3.28s（`is-photo`）；两份字体加载成功；0 console error / pageerror / 404。
- 公网竖屏：390×844 显示“请把手机横过来”和“在浏览器打开”；横屏 844×390 已在本地发布包验证。
- 公网关键文件 7/7 HTTP 200 + SHA256 与 `dist/site` 一致：`index.html` 14,000 B、标题占位图 16,754 B、标题大图 175,126 B、`zhuque-game.woff2` 394,452 B、`shangri_river.mp3` 871,862 B、`CREDITS.txt` 9,667 B、`design-note.pdf` 303,713 B。
- 证据：`docs/evidence/step-07/responsive-20261105/`、`docs/evidence/step-07/live-v1.1.1/`。

### 11.4 未做与回滚

- **未做**：公网完整流程、四关、移动端完整流程、96/96 全用例没有在公网重跑；本地也未因“只改底图加载”重跑 200 秒完整流程。以上结果不能写成“公网完整流程通过”。
- 回滚：如需回到 v1.1.0，把 `main` 退回 `f8b2045`；不要删除部署仓库历史。

## 12. Netlify 主站（2026-11-05，已上线）

- **公网**：https://xiangbei.netlify.app/ （用户认领的 Netlify 站点，站点名 `xiangbei`；2026-11-05 上线）。
- **部署方式**：把 `dist/site/` 73 个文件静态直传 Netlify（先以 `netlify deploy --allow-anonymous` 生成可认领站点，用户用 GitHub 登录认领后改为公开并命名 `xiangbei`）；不经过 Git，不使用构建命令。
- **与发布包差异**：Netlify 在 `index.html` 注入约 326 B 的托管说明注释（`index.html` 14,326 B vs `dist/site` 14,000 B）；其他关键文件体积一致。
- **验证**：标题页约 2.0s 出 480×270 占位图；点击“开始”进入序章，文本“1934年10月17日，于都河上起雾。”正确；0 console error / 0 404；无密码页。
- **未做**：公网完整流程、四关、移动完整流程、96/96 全用例未在 Netlify 重跑；这些结果仍来自本地发布包。完整流程/公网四关不能写成“已通过”。
- **维护**：Netlify 站点由用户账号持有；后续更新需用 Netlify 账号/CLI 重新上传 `dist/site`。GitHub Pages 备站仍为 https://nanxiangzizui.github.io/xiangbei/ （v1.1.1，部署提交 `88771d3`）。

## 13. v1.7.0-dev 本地打包（2026-11-08，未部署）

- **触发**：用户 2026-11-08 要求“把当前项目工程打包，打 tag 并提交仓库”；本次只打本地包与本地提交，不部署、不改线上。
- **基线**：分支 `v1.4-dev`，步骤十六「剧情回顾」完成后；源码提交与 tag 见 §13.3。
- **版本**：`project/tools/release.py` 的 `VERSION = "1.7.0-dev"`；离线包 README 改写为现行玩法（四段选择 + 三次危机、行囊 4 格/状态 0–4、11 条人物结局、存档列表 `xiangbei.saves.v1`、剧情分支/成就/回顾三个独立键），删除 v1.1.1 的“四个小游戏 / xiangbei.save.v1”描述。
- **交付物**：

| 项 | 路径 | 结果 |
|---|---|---|
| 发布站点 | `dist/site/` | 72 文件 / 31,600,743 B |
| 离线包目录 | `dist/xiangbei-v1.7.0-dev/` | 73 文件 / 31,603,691 B（比站点多 README.txt） |
| 离线 ZIP | `dist/xiangbei-v1.7.0-dev-offline.zip` | 74 条目 / 30,871,186 B / SHA256 `9F548CEEAE4D9307231FC751A02C8167AE97381316235F7F10FA74B9D31A6DB2` |
| 设计说明 | `dist/design-note.pdf` | 303,713 B（沿用 v1.1.1 的一页 PDF，内容仍是 v1.0 设计说明，本轮未重制） |
| 校验清单 | `dist/SHA256SUMS.txt` | 147 行 |
| 制作名单 | `project/CREDITS.txt` | 9,667 B |

- **门禁**：`check-build` 48/48、`smoke` 47/47、`check-script` 9 文件 OK、`release.py verify` OK（站点与包逐文件一致、ZIP 条目与白名单一致、无外链、PDF 1 页含 ToUnicode）。
- **打包冒烟**（`dist/_smoke-package.js`，仅本地、不入库）：http 与 file:// 共 21 项全绿，0 console error / pageerror / failed request。覆盖标题菜单（存档 / 史实图鉴 / 名册 / 剧情分支 / 解锁成就）、存档面板空态、开新档“是/否”确认、进入序章并推进 6 句、右上“回顾”入口与章节条目、暂停菜单、`xiangbei.saves.v1` 与 `xiangbei.history.v1` 落键、`file://` 字体与标题。证据 `docs/evidence/package-v1.7.0/`（gitignored）。
- **未做**：部署（Netlify / GitHub Pages 仍是 v1.1.1 四关版）；20 分钟真人计时、11 条结局代表路线、Chrome/Safari/真机、844×390 打包冒烟、隐私模式均未在打包产物上重跑；设计说明 PDF 未按 v1.7 重制。
- **仓库范围**：`.gitignore` 新增 `resource/`（134 MB 素材源库）、`.netlify/`、`docs/script.bak-expand/`、`project/story.js.bak-expand`、`project/tools/_pw-debug-*.js`；`dist/` 与 `*.zip` 原本即不入库。
- **回滚**：删除 `dist/xiangbei-v1.7.0-dev*` 与 `dist/site` 即可重建；不影响已上线站点。
