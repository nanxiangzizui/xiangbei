# 步骤八 · 打包与交差 —— 详细执行计划

> 本文件是**执行计划**，不是项目状态源。范围与排期看 **向北-项目计划书.md**；当前进度只看 **.claude/CLAUDE.md**。
> 本计划只描述怎么做，不在写计划时部署、打包、录视频、改代码。
> 当前状态（写计划时）：步骤零至七已完成，step-7-done；步骤八未开始。步骤七结论为“有条件交差”，P1 例外仍有效，不能在本步被写成“全部通过”。
>
> **执行口径（2026-11-03 用户确认，覆盖下文原计划中的链接与视频两项）**：制作名单全部署名“刘子政”；**不打包字体**（系统回退）；**不部署**，交付可上传的 `dist/site` 与离线 ZIP，由用户上传；**演示视频取消**，不列为缺口。因此本步按“可上传站点 + ZIP + PDF + 名单/字体清单”验收，仍打 `step-8-done`；不得写成“已部署”或“已录视频”。实际记录见 §11。

## 元信息

| 项 | 内容 |
|---|---|
| 所属步骤 | 八 · 打包与交差 |
| 对应计划书 | 第 10 步（部署、ZIP 离线版、一页设计说明、3 分钟演示、制作名单与字体授权） |
| 当前状态源 | **.claude/CLAUDE.md** 2026-11-02 版：步骤零至七 ✅；步骤八 ⬜ 未开始 |
| 步骤七 tag | **step-7-done**（4bb389098511407a9a4a39e1f218a9b76ad7883f） |
| 本步出口（逐字引用） | **链接 + ZIP + 设计说明 + 演示视频 + 字体授权清单** |
| 计划书出口展开 | Cloudflare Pages / GitHub Pages；ZIP 离线版；一页设计说明（史实出处表 + 精神对照表 + 操作说明）；3 分钟演示；制作名单与字体授权 |
| 时间盒 | 标准 600 分钟（10 小时）；压缩 370 分钟（6 小时 10 分）；视频返工、部署审核等待另计 |
| 不可逆动作 | 部署上线、覆盖线上版本、公开发布视频、打包他人字体/素材；四项都必须先得到用户明确确认 |
| 本步性质 | 收口、证明、交付；不是继续加玩法，不是重写游戏 |

### 本步完成定义

> 2026-11-03 用户调整：第 1 项“链接”改为“交付可上传站点，由用户上传”，第 4 项“视频”取消、不计缺口；其余四项照旧。下文保留原始定义，执行时以本注和 §11 为准。

只有同时满足以下六条，步骤八才算完成：

1. **链接**：有一个可公开访问的网址，打开就是可玩的《向北》，不是仓库首页、不是设计说明、不是 404。
2. **ZIP**：一个断网解压后能直接打开 index.html 的离线包；只含运行时文件、字体（如有）、许可证、README、CREDITS、设计说明，不含开发工具与测试证据。
3. **设计说明**：一页 A4 PDF，包含 7 条史实出处、5 条精神机制、操作说明、20 分钟口径、已知例外、制作名单；不是把 docs 整个打印出来。
4. **演示视频**：≤3:00 的 MP4，能看清标题、门板、湘江、泸定、点名、五卡；旁白与字幕的数字与 **docs/sources.md** 一致；不伪装成一次连续通关。
5. **字体授权清单**：**docs/credits.md** 与 **LICENSES/** 完整；打包字体时附 OFL 原文、来源、版本、SHA256、子集说明；不打包时明确写“本版未打包字体，使用系统回退”。
6. **证据与记录**：check-build、smoke、check-script、发布包回归、链接检查、ZIP 断网测试都有记录；**docs/release-record.md** 写清版本、提交、哈希、链接、例外；**.claude/CLAUDE.md** 步骤表更新，提交并打 **step-8-done**。

> 以上任何一项没做到，只能写“有条件完成”，不能写“全部完成”。步骤七的 P1 例外（Chrome/Safari、真机、音频听感等）继续保留，除非本步真的补测。

---

## 0. 任务总表

| 编号 | 任务 | 主要产出 | 前置 | 标准/压缩（分钟） | 门禁 |
|---|---|---|---|---|---|
| T8.0 | 发布口径与输入锁定 | 版本、基线提交、授权/姓名/平台清单 | 步骤七完成 | 30 / 20 | G0 |
| T8.1 | 史实、文案与口径收口 | sources、demo-script、quality-bar 修订 | T8.0 | 60 / 35 | G1 |
| T8.2 | 字体子集与授权 | woff2、OFL、FONT-MANIFEST、C12 更新 | T8.1 | 75 / 45 | G1 |
| T8.3 | 一页设计说明 | docs/design-note.md、dist/design-note.pdf | T8.1 | 90 / 60 | G2 |
| T8.4 | 制作名单、README、游戏内入口 | project/CREDITS.txt、标题页链接、README | T8.3 | 45 / 30 | G2 |
| T8.5 | 发布包与离线 ZIP | dist/site、dist/xiangbei-v1.0.0-offline.zip、哈希 | T8.2–T8.4 | 65 / 40 | G3 |
| T8.6 | 发布包回归 | 发布包实测记录、截图、ZIP 断网证据 | T8.5 | 45 / 30 | G3 |
| T8.7 | 部署上线 | 可访问 URL、部署记录 | T8.6 + 用户确认 | 55 / 35 | G4 |
| T8.8 | 3 分钟演示视频 | MP4、字幕/旁白、哈希 | T8.6 + 用户确认公开范围 | 90 / 55 | G4 |
| T8.9 | 复核、提交与 tag | CLAUDE 更新、release-record、tag | T8.7/T8.8 | 45 / 20 | G5 |

**门禁说明**

- G0：版本、基线提交、制作名单、是否公开视频、部署平台、是否打包字体、项目名、20 分钟口径八项有结论；没有结论的项写“待定”，不擅自默认。
- G1：史实与字体两项至少一项完全收口；不允许“先部署再补来源”。
- G2：设计说明与制作名单可交付；PDF 一页；名称无占位符。
- G3：发布包验证通过；check-build 38/38、smoke 46/46、check-script OK、release verify OK。
- G4：用户明确同意部署/公开视频；没有同意就停在 G3。
- G5：链接、ZIP、PDF、视频、授权清单五项齐全；例外如实记录。

---

## 1. 起点盘点

### 1.1 已有资产

| 资产 | 现状 | 本步怎么用 |
|---|---|---|
| project/index.html | 11,702B；单舞台、#stage-art、四场景、经典 script；link rel="icon" href="data:,"；标题版本“试玩版 · 人物虚构，非史料人物” | 作为发布包唯一入口；T8.4 只加标题页制作名单链接 |
| project/style.css | 48,497B；:root 令牌、10 类 xb-* 组件、@font-face 目前只用 local() | T8.2 如需打包字体，只改 @font-face；T8.4 加一个 44px 链接样式 |
| project/engine.js | 131,479B；VN、存档、图鉴、结局、音频、FX、调试参数 | **不改**；发布回归覆盖 |
| project/story.js | 56,372B；七章、7 张图鉴、12 抉择、9 限时 | **不改**；只核对文案 |
| project/minigames.js | 80,063B；共享限时分配引擎 + 四关 | **不改**；发布回归覆盖四关 |
| project/art.js | 49,613B；四场景程序化版画 | **不改** |
| project/tools/ | check-build 36 项、smoke 46 项、check-script、_pw-step7 等 | 复用；本步只扩展发布检查与回归 |
| docs/test-record.md | 187 行；步骤七结论“有条件交差”；P1 例外 X1–X11 | 作为本步例外清单与证据基线；不改写历史结论 |
| docs/test-cases.md | T01–T51 | 本步验收沿用，不新增并行测试编号 |
| docs/sources.md | A1–A7、S1–S15；S4 空缺；S13 链接待核 | T8.1 收口 |
| docs/story-bible.md | 名册、五卡、fire/trust 规则 | 设计说明的精神机制表来源 |
| docs/demo-script.md | 3 分钟逐字稿；有“点名少一个到”等错句 | T8.1 修正，T8.8 按最终稿录 |
| docs/credits.md | 字体授权、素材说明、§5 姓名占位、§6 检查清单 | T8.4 定稿 |
| docs/quality-bar.md | 末行写“游戏内有制作名单”，但当前游戏内没有 | T8.4 补标题页链接并改文档口径 |
| docs/ui-layout.md | 标题、VN、地图坐标 | T8.4 补制作名单链接坐标 |

### 1.2 缺口

| 缺口 | 影响 | 本步处理 |
|---|---|---|
| 无 docs/design-note.md、无 PDF | 交差缺“一页设计说明” | T8.3 新建 |
| 无 project/CREDITS.txt、标题页无制作名单入口 | quality-bar 的“游戏内有制作名单”不成立 | T8.4 新建 + 标题页静态链接 |
| 无 project/assets/fonts/ | 字体只有 local()，评审机可能落系统字体 | T8.2 尝试子集打包；失败则明确记录 |
| 无根 README.md | 评审拿到仓库/ZIP 不知道怎么玩 | T8.4 新建 |
| 无 dist/、无正式 ZIP | 交差缺断网包 | T8.5 新建 |
| 无线上链接、无 remote | 交差缺“链接” | T8.7；无账号/无授权就如实写例外 |
| 无演示视频 | 交差缺 3 分钟演示 | T8.8 |
| docs/sources.md S4 空缺、S13 链接待核 | 设计说明出处表不干净 | T8.1 |
| 步骤七 P1 例外仍在 | 容易误写“全过” | T8.0/T8.6/T8.9 明确 carry |
| 根目录/发布包可能混入 docs/evidence、project/tools/_pw* | 发布包泄漏开发文件 | T8.5 白名单 + release verify |

### 1.3 当前可复用工具与环境事实

- project/tools/_pw-step7.js:13–14 定义 ROOT 与 PROJECT；:93 支持 --project；:116 支持 --url=file|http。发布包回归可优先复用它，不另写一套完整流程。
- project/tools/check-build.js:346–383 的 C12 目前**禁止**字体文件：:374 见到 url( 直接失败；:375 要求 local(；:377–380 见到 project/assets/fonts 里的 .woff2/.ttf/.otf/.eot 直接失败。T8.2 必须改这条，否则打包字体后自检必红。
- project/engine.js 已有调试参数：?debug=1、?fonts=fallback、?reset=1、?minigame=door|abandon|boat|climb、?chapter=章节id&node=节点id、?fx=wipe|flash|shake|strike；**没有** ?ending 直接跳结局。演示与测试不得假设有 ?ending。
- ENDING_STATS = { companyStart: 104, companyEnd: 19, redStart: 86000, redEnd: 7000 }；buildEnding 读 7 个 previous.names 与 flags；五卡条件为 fire≥20、choice.xiangjiang.hold===true、choice.zunyi.admit≥2、choice.jinsha.priority==="main"、trust≥3 且 memory.zhang。lights_lost 不参与 ending 的 names/cards，只影响攀索结果与 fire 扣减。
- 因此 docs/demo-script.md 现有“泸定暗一个光点 → 终章点名少一个‘到’”**不成立**，必须改；不能为了脚本效果去改代码。
- 步骤七记录：全流程 Edge headless 190.75s / 407 line；手机 844×390 200.9s / 406 line；T20 四次 04:52–08:33；静态慢读 19:48；所有限时项超时且翻倍的极端等待约 23:44。设计说明必须同时写清这三个口径，不能只写“20 分钟”。
- 环境：Windows；Edge 156.0.4314.58；Node 24.21.0；Playwright 1.64.1；Chrome 未安装、Safari 无设备；默认沙箱下 pwsh 子进程可能初始化失败 0xC0000142，node/git 在 danger-full-access 下可用。执行时先验证，不要假设。

---

## 2. 不变量

1. **不改剧情事实、旗标、结局与存档 schema**。湘江必败、遵义必开、泸定必夺；单一结局 + 可变细节；不给真实领导人写台词。
2. **六个运行时文件仍是 index.html / style.css / engine.js / story.js / minigames.js / art.js**。本步只允许新增 project/CREDITS.txt 与字体资源；不新增第七个 JS/CSS，不拆模块。
3. **不引入框架、构建链、CDN、外部请求、分析统计**。发布包仍是 file:// 可打开、GitHub Pages 子路径可用的纯静态站点。
4. **字体只在有授权、有来源、有哈希时打包**；只打包子集，不打包完整字体；没有字体文件时必须回退系统字体并明确记录。
5. **不把未授权图片、影视截图、游戏素材、音乐放进网页、PDF、视频**。截图只能来自本项目自己的运行画面。
6. **不伪造测试**。Chrome/Safari、真机触摸、音频听感、真实后台、fps 没测就写“未验证/例外”，不写“通过”。
7. **不改写 docs/test-record.md 的历史结论**。本步新增 docs/release-record.md；测试记录只在末尾加“发布记录见 …”的指引，不覆盖原数据。
8. **没有用户明确确认，不部署、不覆盖线上、不公开视频、不打包他人字体**。本计划只准备，不执行不可逆动作。
9. **发布包白名单**：运行时六文件 + 可选字体 + LICENSES/ + CREDITS.txt + README.txt + design-note.pdf；不含 project/tools/、docs/、step/、docs/evidence/、.git/、dist/、测试脚本、截图、录屏、临时文件。
10. **20 分钟口径不夸大**：设计上限 20:00；T20 真人四次 04:52–08:33；静态慢读 19:48；极端等待 23:44 单列。不能把自动化 191 秒（约 03:11）当真人计时。
11. **运行时冻结**：T8.2/T8.4 允许改 style.css 的 @font-face 与标题页链接、index.html 的标题页链接；除此之外不改 engine.js/story.js/minigames.js/art.js。发现 bug 先记录，由用户决定是否破例。
12. **标题 96px、印章 360,150、菜单 120,360 不动**；不加暂停菜单制作名单、不加第四项主菜单、不做制作名单弹窗，避免步骤七后的 UI 回归。

---

## 3. 产出清单（文件级）

| 路径 | 新建/修改 | 内容 | 验收 | 下游消费者 |
|---|---|---|---|---|
| docs/design-note.md | 新建 | 一页设计说明源文本：七段、四机制、史实表、五卡、操作、20 分钟口径、例外、制作名单 | PDF 一页；表格数字与 sources/story-bible 一致 | 评审、T8.3 PDF |
| dist/design-note.pdf | 生成 | A4 一页 PDF；字体嵌入或标准字体；链接可点 | 1 页；≤2MB；文字可复制 | 链接、ZIP、交差 |
| project/CREDITS.txt | 新建 | 纯文本制作名单、字体 OFL、素材说明、虚构声明 | 无“姓名”占位；可在浏览器打开 | 标题页链接、ZIP、site |
| project/index.html | 修改 | 标题页底部右侧加“制作名单”链接，href="./CREDITS.txt"，target="_blank"、rel="noopener" | 44px 热区；键盘可见焦点；三档不溢出 | 运行时、site、ZIP |
| project/style.css | 修改 | .title-credits 样式；可选 @font-face 的 url() | 不遮挡版本行；回退可用 | 运行时 |
| project/assets/fonts/SmileySans-Oblique-subset.woff2 | 新建（可选） | 标题子集，≤80KB | 有字形覆盖；OFL 文件 | 运行时 |
| project/assets/fonts/LXGWWenKai-Regular-subset.woff2 | 新建（可选） | 正文子集，≤220KB | 有字形覆盖；OFL 文件 | 运行时 |
| project/assets/fonts/LICENSES/OFL-SmileySans.txt | 新建（可选） | OFL 1.1 原文 | 完整、未改 | 发布包 |
| project/assets/fonts/LICENSES/OFL-LXGWWenKai.txt | 新建（可选） | OFL 1.1 原文 | 完整、未改 | 发布包 |
| project/assets/fonts/FONT-MANIFEST.md | 新建（可选） | 来源 URL、tag/日期、SHA256、子集命令、字符数、大小、许可 | 与文件哈希一致 | credits/PDF |
| project/tools/check-build.js | 修改 | C12 允许受控字体；新增 C37 制作名单、C38 无外部引用；36→38 | 38/38；负例仍红 | 发布门禁 |
| project/tools/release.py | 新建 | staging、ZIP、字体复制、哈希、白名单校验 | stage/zip/verify 三命令可重复 | 发布包 |
| project/tools/_pw-step8.js | 新建 | 发布包字体、制作名单、fps、外部请求、ZIP 断网检查 | 输出 JSON/截图 | 发布证据 |
| project/tools/_pw-step7.js | 修改（小） | 增加 --out，让发布包回归写入 step-08 证据目录 | 默认行为不变 | 回归 |
| README.md（根） | 新建 | 项目简介、链接、运行、操作、测试摘要、例外、字体、目录、制作名单 | 评审 1 分钟能看懂 | 仓库、交差 |
| project/README.txt | 不新建 | 由 release.py 从 README 生成短版放入 ZIP | 断网可读 | ZIP |
| docs/credits.md | 修改 | §5 姓名/角色定稿；§6 清单勾选；字体文件/未打包说明 | 无占位；与 CREDITS 一致 | PDF、README、ZIP |
| docs/sources.md | 修改 | S4 空缺说明；S13 链接核校；访问日期；链接状态 | 7 锚点、每条 ≥2 出处 | 设计说明 |
| docs/demo-script.md | 修改 | 修正数字与“点名少一个到”；保留作现场演示稿，本版不录 | 与代码一致；不冒充连续通关 | T8.8（取消） |
| docs/quality-bar.md | 修改 | “游戏内制作名单可打开”；字体已打包/未打包；发布口径 | 与实现一致 | 验收 |
| docs/ui-layout.md | 修改 | 标题页 title-credits 坐标/热区 | 1280 坐标明确 | 实现 |
| docs/release-record.md | 新建 | 版本、提交、链接、哈希、门禁、例外、确认记录 | 可复核 | 交差 |
| .claude/CLAUDE.md | 修改 | 步骤八 ✅、交付物、链接、例外、下一步 | 状态表准确 | 项目状态 |
| step/step-08-打包与交差.md | 修改 | 执行时回填 §11 | 有日期/证据/结论 | 过程记录 |
| dist/xiangbei-v1.0.0-offline.zip | 生成 | 断网包 | 解压可玩；白名单 | 交差 |
| dist/向北-3分钟演示-v1.0.0.mp4 | **不生成** | 用户 2026-11-03 取消 | 不列为缺口 | 交差 |
| dist/SHA256SUMS.txt | 生成 | ZIP/PDF/site/package 哈希（本版无 MP4） | 可复核 | 交差 |

> dist/ 已被 .gitignore 忽略；不要把 ZIP、MP4、字体完整源文件提交进 Git。字体子集与许可证可以进仓库，总量 ≤300KB。

---

## 4. 关键决策

### P1 版本与命名

- 内部版本：v1.0.0；交付物文件名用 v1.0.0；游戏标题页仍保留“试玩版 · 人物虚构，非史料人物”，**不**在最后一刻改 96px 标题或版本行（避免字体子集/截图/测试全部返工）。
- 版本只出现在 README、设计说明、发布记录、ZIP 文件名；不把 v1.0.0 硬塞进标题页。
- 基线提交：T8.0 执行 git rev-parse HEAD 记为 RELEASE_BASE；**不得**沿用步骤七的 de01755 冒充当前提交。

### P2 设计说明一页

- 唯一源文件 docs/design-note.md；交付 PDF dist/design-note.pdf。
- A4 纵向、12mm 页边距、正文 9–10pt、标题 18–22pt；最多一张本项目自己的截图（可选，宽 ≤70mm）；表格行高紧凑。
- 必含：一句话定位、七段表、7 条史实出处、5 条精神机制、操作说明、20 分钟口径、已知例外、制作名单/字体。
- 不写技术实现细节（DOM/Canvas/状态机），那些放 README；设计说明是给老师看的，不是开发文档。
- 一页排不下时，先删“技术细节”和“图片来源”，不删史实表、五卡、例外。

### P3 字体策略：先尝试打包，失败就明确回退

- 默认尝试打包 **子集**：标题 Smiley Sans（得意黑）≤80KB，正文 LXGW WenKai（霞鹜文楷）≤220KB，合计 ≤300KB。
- 来源只用官方仓库发布页：Smiley Sans（atelier-anchor/smiley-sans）、LXGW WenKai（lxgw/LxgwWenKai）；记录 tag、日期、下载 URL、SHA256。不要用来路不明的字体站。
- 只打包 .woff2 子集；完整 .ttf/.otf 放 .tools/fonts/（已忽略），不进仓库、不进 ZIP。
- @font-face 顺序：local("Smiley Sans") / local("得意黑") 在前，url("./assets/fonts/…woff2") 在后；font-display: swap；保留原字体名，不做字形修改，仅子集化；若上游声明 Reserved Font Name，按 OFL 要求改名并在 manifest 说明。
- 若下载、授权、子集、字形覆盖任一失败：**不打包**，保留 local()，在 docs/credits.md、设计说明、README 写“本版未打包字体，使用系统回退”；ZIP 仍可玩，不伪装成已打包。
- 打包后必须验证：document.fonts.check、无豆腐块、?fonts=fallback 仍可读、三档分辨率、字体总大小、无外部请求。

### P4 制作名单：标题页静态链接，不做弹窗

- 在标题页底部右侧加一个纯文本链接“制作名单”，指向 ./CREDITS.txt；新标签打开；无 JS、无弹窗、无暂停菜单入口、不加第四项主菜单。
- 热区 ≥44×44 CSS px；:focus-visible 有 2px 朱砂焦点环；不遮版本行、不遮门板。
- project/CREDITS.txt 是纯文本，内容含：项目名/版本、制作角色与姓名（或经用户同意的化名）、字体与 OFL、程序化图像/音频说明、史料来源指引、虚构声明。
- 这样 docs/quality-bar.md 的“游戏内有制作名单”有真实入口；同时不改运行时逻辑。
- 如果三档实测发现链接溢出/遮挡，回退方案：只保留版本行，把 quality-bar 改为“交差材料内有制作名单”，并在 release-record 记录原因；**不要**为了一个链接重排标题。

### P5 发布包：site 与 ZIP 分开

- dist/site/：给线上部署用。运行时六文件 + 可选字体 + LICENSES/ + CREDITS.txt + design-note.pdf；不含 README、tools、docs、证据。
- dist/xiangbei-v1.0.0/：给 ZIP 用。在 site 基础上加 README.txt；根目录就是游戏入口。
- dist/xiangbei-v1.0.0-offline.zip：根目录 xiangbei-v1.0.0/，解压后打开 index.html；不含 dist/、project/、docs/、step/、.git/、tools/、evidence/、测试脚本、临时文件。
- design-note.pdf 同时放进 site 和 ZIP，评审拿到任一入口都能看说明。
- README.txt 只写：怎么打开、操作、离线注意（localStorage）、制作名单/字体、版本；不写开发命令。

### P6 部署：先确认，再上传

- 首选 Cloudflare Pages 直接上传 dist/site；无构建命令、无环境变量、无 Functions、无分析统计。
- 备选 GitHub Pages：需要用户提供/创建仓库与权限，部署到 gh-pages 或专用分支；所有路径必须相对 ./，子路径可跑。
- 当前 .git/config **无 remote**；不要在未确认时创建公开仓库、不要 push。
- 不把账号、token、邮箱、Cookie 写进仓库或截图。
- 部署后必须用无痕窗口打开，检查：标题、字体、CREDITS、PDF、四关入口、7 图鉴、结局五卡、手机横屏、控制台 0 error/404、无外部请求。
- 若没有账号/授权：T8.7 记为“未部署（P0 例外，待用户提供）”；仍可交 ZIP/PDF/视频，但**不能**在最终答复里写“链接已交付”。

### P7 视频：分段录制，明确剪辑

- 默认不公开；只交文件或私密链接。公开上传（B 站/YouTube 等）必须先得到用户确认。
- 1920×1080、30fps、H.264 + AAC；浏览器 100%，隐藏书签栏、通知、调试面板；系统声 + 麦克风，或 Playwright 无声录制 + 后期旁白。
- 使用 ?reset=1 开新档；湘江/泸定/结局可用 ?chapter 或预置存档分段录；**不伪装一次连续通关**；片头或说明里写“演示为分段录制”。
- 3:00 以内；字幕写关键数字；旁白用项目自己的话，不用未授权音乐。
- 现有脚本必须改三处：①“全程 20 分钟”改为“设计上限 20 分钟，实测首玩 5–9 分钟”；②“过江后剩 3 万”改为“8.6 万余人出发，过江后 3 万余人”；③“暗一个光点 → 点名少一个到”改为“暗一个光点只改变结算里的一句话，不改历史，也不改点名人数”。
- 视频中不出现真实姓名、学校、地址、账号；如需署名，用用户同意的化名。

### P8 20 分钟口径

- 设计上限：20:00。
- 步骤七 T20 真人四次：04:52、06:42、07:36、08:33（最大 08:33）。
- 静态慢读预算：19:48（步骤七记录，仅余 12 秒）。
- 极端等待：9 个限时项全部超时且翻倍，约 23:44；这是压力上限，不是常速目标。
- 设计说明、README、最终答复都按这四条写；**不**把 03:10 自动化基线当真人，**不**只写“20 分钟”而不给口径。
- 如果用户要求“所有路径必须 ≤20:00”：触发裁剪决策（草地 → 金沙江 → 遵义改纯对话），需要改剧情/测试/视频，属于新范围，先确认再动；本计划默认不做。

### P9 史实与来源收口

- docs/sources.md 的 S4 空缺：在 §2 表补一个已核出处，或注明“预留未采用（原因待查）”；编号保留避免全库重编号，并在 §5 说明；不要静默留空。
- S13 的 http://www.81.mil.cn/... 逐条点开；若 404/域名不对，改为可访问的中国军网页面或纸质出处；**不凭记忆改 URL**。
- 每条锚点至少 2 个出处；网页 + 权威书；记录访问日期 2026-11-03；不能点开的链接在表中标注“仅书目/待补”，并在设计说明用书名，不用死链。
- 争议继续标注“有不同说法”：X 光机、22 勇士姓名/牺牲数、金沙江船数、于都渡口数、草地减员、夹金山高度；游戏正文不展开。
- 文学不当史料；真实人物只进史实注；虚构人物声明在标题页、CREDITS、设计说明三处出现。

### P10 例外 carry-forward

- 步骤七 P1 例外：X1 Chrome 未装、X2 Safari 无设备、X3 真机触摸未验、X4 音频听感未验、X5 真实后台/锁屏未验、X6 字体未打包、X7 C/D 版本未注明、X8 三位试玩为联合访谈、X10 遵义第三刀未决、X11 fps 未采样。
- 本步可关闭的：X6（若字体打包）、X7（用当前提交重录发布回归）、X11（fps 采样）。其余未补测就继续列为例外。
- 不得把“用户接受 P0 例外”改写成“P0 通过”；docs/release-record.md 单列“例外与用户确认”。

### P11 测试工具：复用为主

- _pw-step7.js 已有 --project 与 --url，发布包回归优先复用；只加 --out 让证据写到 docs/evidence/step-08。
- 新 _pw-step8.js 只做 step7 没覆盖的：字体加载/回退、CREDITS 链接、fps 采样、外部请求审计、ZIP 解压路径检查；不复制完整 VN 流程。
- release.py 只做文件系统/哈希/ZIP，不启动浏览器，不引入运行时依赖。
- check-build 新增 C37/C38 后 38 项；smoke 仍 46 项；不新增 T52+。

### P12 发布包不做的三件事

1. 不把 docs/ 整个放进 site/ZIP（只放 design-note.pdf、CREDITS.txt、README.txt）。
2. 不把 project/tools/ 或 _pw-*.js 放进任何交付物。
3. 不在 site 上放测试截图、证据视频、原始录音、调试页面。

---

## 5. 任务卡

### T8.0 发布口径与输入锁定（30 / 20 分钟）

**目的**：在动文件之前，把版本、基线、姓名、平台、公开范围定下来；避免做到一半发现署名/账号/授权不对。

**输入**：.claude/CLAUDE.md、向北-项目计划书.md、docs/test-record.md、docs/credits.md、当前 git status / git rev-parse HEAD。

**动作**

1. 记录 RELEASE_BASE（当前 HEAD 短哈希）、日期、版本 v1.0.0；写进 docs/release-record.md 草稿。
2. 向用户确认八项（附录 H）：①制作名单姓名/化名与角色；②是否打包字体；③Cloudflare 还是 GitHub Pages；④是否有账号/是否授权部署；⑤视频是否公开；⑥是否接受步骤七 P1 例外继续 carry；⑦项目名/URL 前缀；⑧是否要求所有路径 ≤20:00。
3. 明确“未确认就不做”的项：没有姓名就用“《向北》课程项目组”（需用户同意）；没有账号就 T8.7 记例外；没有公开授权就只交文件。
4. 建立发布检查清单（G0–G5）与证据目录 docs/evidence/step-08/（gitignored）。
5. 冻结运行时：记录六个文件哈希；之后只允许 T8.2/T8.4 的 index.html/style.css 小改。

**产出**：docs/release-record.md 头部（版本/基线/输入/确认状态）；六文件 SHA256 清单。

**完成判据**：八项都有“已确认/待定/不做”的明确状态；版本与基线可复核；没有不可逆动作已发生。

**常见坑**：沿用步骤七的 de01755 当当前基线；未问姓名就编一个；未确认就上传；把“待定”写成“默认可以”。

---

### T8.1 史实、文案与口径收口（60 / 35 分钟）

**目的**：让设计说明、README、视频里的每个数字都能在 docs/sources.md 找到；清掉已知错句与死链。

**输入**：docs/sources.md、docs/codex.md、docs/story-bible.md、docs/demo-script.md、docs/quality-bar.md、docs/test-record.md、project/story.js。

**动作**

1. **S4 空缺**：在 docs/sources.md §2 表补一个已核出处，或注明“预留未采用（原因待查）”；编号保留避免全库重编号，并在 §5 写一句。不要静默留空，也不要贸然重编号 S5–S15。
2. **S13 链接**：逐条打开 S1–S15；S13 的 81.mil.cn 若不可用，改为可访问页面或纸质书目；记录访问日期与状态。不能点开的，在表里标“仅书目/待补”，设计说明用书名。
3. **数字对齐**：8.6 万→3 万余人；遵义约 3.7 万；金沙江 6 条船（另有 7 条说）、37 船工、7 天 7 夜；泸定 22 人、13 根铁索、240 余里；吴起 1935-10-19、约 7000 人；草地近 800（回忆录）。与 story-bible 数字台账、codex.md 同源。
4. **改 demo-script 三处错**：20 分钟口径；“剩 3 万”；“点名少一个到”。改成 T8.8 可照读的句子。
5. **20 分钟口径**：把 P8 的四条写进 docs/quality-bar.md 或设计说明草稿；不掩盖 23:44。
6. **红线复核**：跑 project/tools/redlines.js（或等价 grep）；确认真实人物无台词、文学不当史料、争议标注、虚构声明存在；结果写 release-record。
7. **不改剧情**：如果发现的是文案错误，先改 docs/；只有明确事实错误才改 story.js，改后必须重跑 check-script/smoke/全流程，并记录。

**产出**：sources/demo-script/quality-bar 修订；来源审计表；红线结果。

**完成判据**：7 条锚点每条 ≥2 出处；S4 有说明；S13 有结论；demo 三处错已改；红线 10/10；没有未核数字进入设计说明。

**常见坑**：把网页标题当原文；用“待补”链接做 PDF；只改 demo 不改设计说明；为了“好看”把 8.6 万说成“30 万”；把回忆录当史实。

---

### T8.2 字体子集与授权（75 / 45 分钟）

**目的**：让评审机即使没装得意黑/霞鹜文楷，也能看到设计字体；同时不违反 OFL、不超预算。

**输入**：docs/credits.md、project/style.css、官方字体发布页、pyftsubset/fonttools（如可用）、project/tools/check-build.js:346–383。

**动作**

1. **先判定**：能否访问官方发布页、能否取得 OFL、能否在 45 分钟内完成子集。任一不能，直接走“不打包”分支，不硬凑。
2. **下载**：Smiley Sans 与 LXGW WenKai 官方 release；记录 URL、tag、日期、文件 SHA256；完整字体放 .tools/fonts/，不提交。
3. **字符集**：用 release.py 或脚本从六个运行时文件 + CREDITS.txt 提取所有字符；标题字体只保留标题/章节字（“向北”、七章名、序号、标点）；正文字体保留全部正文/UI/人名/数字/标点；加 ASCII、常用全角标点、·、—、……、引号。
4. **子集**：pyftsubset 输出 woff2；标题 ≤80KB、正文 ≤220KB、合计 ≤300KB；保留必要 layout features；不做字形改绘。
5. **落盘**：project/assets/fonts/ 两个 woff2；LICENSES/ 两份 OFL 原文；FONT-MANIFEST.md 写来源/哈希/命令/字符数/大小。
6. **改 CSS**：只改 @font-face 的 src，加 url("./assets/fonts/…woff2") format("woff2")；保留 local() 在前、font-display: swap；--font-title/--font-body 不动。
7. **改 C12**：允许 ./assets/fonts/*.woff2；仍禁止 http、禁止 .ttf/.otf/.eot 完整字体；校验总量 ≤300KB、OFL 文件存在、manifest 存在。若没有字体，要求 local-only 且不得有 url。
8. **验证**：document.fonts.check("16px 'LXGW WenKai'", "向北") 之类；?fonts=fallback 截图；三档分辨率；无豆腐块；无外部请求；C12 绿。
9. **不打包分支**：不改 CSS 的 src；在 credits/设计说明/README 写“本版未打包字体，使用系统回退”；X6 继续 carry；ZIP 0 字体文件也合法。

**产出**：字体子集/许可证/manifest（或明确未打包）；style.css 小改；C12 更新；字体验证记录。

**完成判据**：打包时总 ≤300KB、OFL 完整、无完整字体、无外部 URL、无豆腐；不打包时文档三处一致；C12 对应分支通过。

**常见坑**：子集漏了“崽/幺/皎/泸/岷”等字；标题字体复用正文导致体积大；把完整 TTF 打进 ZIP；url() 放在 local() 前导致本地字体不优先；忘记 font-display；C12 仍报“本步不打包字体”；字体名带空格没引号。

---

### T8.3 一页设计说明（90 / 60 分钟）

**目的**：让老师在 60 秒内看懂“这是什么、史实在哪、精神怎么变成机制、怎么玩、已知限制”。

**输入**：T8.1 的 sources、story-bible 五卡、test-record、codex、release-record 草稿。

**动作**

1. 写 docs/design-note.md，按附录 A 的骨架；先写内容，再排版。
2. 七段表：序章于都 / 湘江 / 遵义 / 金沙江 / 泸定 / 草地 / 吴起·点名；每段一句“史实锚点 + 玩家动作 + 机制”。
3. 史实表：A1–A7，列“时间/地点/关键事实/出处”；争议在事实后加“（有不同说法）”；不写游戏里没有的细节。
4. 五卡表：卡名 / 触发条件 / 玩家机制 / 对应精神；写“全灰合法，不改变结局”。
5. 操作说明：点击/空格推进；1–3 选项；Esc 暂停；四关的操作一句话；手机横屏；无 Game Over。
6. 20 分钟：设计上限/T20 四次/静态 19:48/极端 23:44；用一张小表，不用大段辩解。
7. 例外：Chrome/Safari、真机、音频听感、fps 等，按实际写“未验证/例外”，不写“通过”。
8. 制作名单/字体：姓名/化名、OFL、程序化素材、工具；与 CREDITS 一致。
9. 排版：A4 一页；标题 20pt、正文 9.5pt、表格 8.5–9pt；页边距 12mm；最多一张 70mm 宽截图；导出 PDF；检查页数=1、文字可复制、链接可点。
10. 如果一页放不下：先删技术细节/截图，不删史实、五卡、例外；仍放不下就改两页并在 release-record 说明（但这与“一页”出口冲突，需用户确认）。

**产出**：docs/design-note.md；dist/design-note.pdf。

**完成判据**：PDF 1 页；7 条史实 + 5 条机制 + 操作 + 20 分钟 + 例外 + 名单齐全；数字与 sources 一致；无死链；≤2MB；A 级目测通过。

**常见坑**：写成开发总结；史实表只有 5 条；五卡写成口号；把 23:44 藏掉；PDF 两页；字体未嵌入导致打印乱码；截图带浏览器 UI/个人信息；链接是 localhost。

---

### T8.4 制作名单、README、游戏内入口（45 / 30 分钟）

**目的**：让“谁做的、用了什么、怎么玩”在游戏内、ZIP、仓库三处都能找到；消掉 quality-bar 与实现的矛盾。

**输入**：T8.3 设计说明、credits、用户确认的姓名/化名、字体 manifest、项目结构。

**动作**

1. **CREDITS.txt**：写项目名/版本、制作角色（剧本/程序/美术/测试/史料核对）、姓名或化名、字体与 OFL、程序化图像/音频、史料来源指引、虚构声明、工具（Playwright 仅测试）。纯文本，UTF-8，≤2KB。
2. **标题页链接**：index.html 标题场景底部右侧加一个 a 标签（class 为 title-credits，href 为 ./CREDITS.txt，target 为 _blank，rel 为 noopener），文字为“制作名单”；不加 JS；不加入 #title-menu；不动三个主按钮。
3. **CSS**：绝对定位右下（建议 right: 24px; bottom: 10px;），min-height:44px，display:inline-flex; align-items:center; padding:0 8px；14px；墨色/纸白底；:focus-visible 2px 朱砂；不遮版本行（版本在左下）。在 docs/ui-layout.md 补坐标（建议 1156,666,100×44，执行时以实测为准）。手机 844×390 下链接会随舞台缩放；若物理像素低于 44×44，按步骤七 B16 同类例外记录，不为此重排标题。
4. **README.md**：项目一句话；交付物表（链接/ZIP/PDF/视频，链接未定写“待部署”）；怎么运行（双击/本地服务）；操作；七段/四关/七图鉴/五卡；测试摘要与例外；字体/素材/史料；目录；制作名单。
5. **quality-bar**：把“游戏内有制作名单”改成“标题页‘制作名单’链接可打开 project/CREDITS.txt；ZIP/site 内含 CREDITS.txt”；字体行按实际写“已打包 ≤300KB”或“未打包，系统回退”。
6. **check-build C37**：project/CREDITS.txt 存在、index.html 有 href="./CREDITS.txt"、无尖括号姓名占位/TODO/待填；C38：运行时无 http(s)://、无 fetch/XMLHttpRequest/type=module。总数 38。
7. **实测**：标题页 1280/1366/1920、844×390；键盘 Tab 到链接有焦点；触摸可点；打开是文本；不遮挡；控制台 0 error。

**产出**：CREDITS.txt、index/style 小改、README.md、credits/quality-bar/ui-layout 修订、C37/C38。

**完成判据**：三处名单一致；无占位；链接 44px、可打开；三档不出界；C37/C38 绿；无新增 JS。

**常见坑**：把链接放进主菜单导致第四项；用 JS 弹窗；target=_blank 在 file:// 打不开（实测，不行就改同窗打开）；热区只有文字高度；遮挡版本行；CREDITS 里写真实学校/地址；README 承诺未验证的 Chrome/Safari。

---

### T8.5 发布包与离线 ZIP（65 / 40 分钟）

**目的**：生成一个干净、可复现、可校验的 site 与 ZIP；不把开发垃圾带出去。

**输入**：T8.2–T8.4 的文件、.gitignore、六个运行时文件、README/CREDITS/PDF。

**动作**

1. 写 project/tools/release.py（Python 3 标准库）：
   - stage --version 1.0.0：清空/重建 dist/site 与 dist/xiangbei-v1.0.0；按白名单复制。
   - zip --version 1.0.0：生成 dist/xiangbei-v1.0.0-offline.zip；根目录 xiangbei-v1.0.0/；固定时间戳/顺序，便于复现。
   - verify --version 1.0.0：白名单、必需文件、无 tools/docs/evidence/.git、无完整字体、无外部 URL、大小/哈希。
   - hash：写 dist/SHA256SUMS.txt。
2. 白名单：六运行时 + 可选两 woff2 + LICENSES/ + CREDITS.txt + README.txt（ZIP） + design-note.pdf；site 不含 README.txt。
3. 检查 index.html 引用：./style.css、四个 ./*.js、./CREDITS.txt、字体 ./assets/fonts/…；全部存在；没有 http、没有绝对路径。
4. 生成 README.txt：双击 index.html；推荐本地服务；操作；离线 localStorage 提示；CREDITS/PDF；版本。
5. 解压 ZIP 到临时目录，确认根目录就是 xiangbei-v1.0.0/，打开 index.html 能到标题；不依赖父目录。
6. 记录 ZIP 条目数、总大小、哈希；与 site 文件逐一比对（除 README.txt）。

**产出**：dist/site/、dist/xiangbei-v1.0.0/、dist/xiangbei-v1.0.0-offline.zip、dist/SHA256SUMS.txt。

**完成判据**：release verify 通过；ZIP 白名单；根目录正确；解压可打开；无外部；哈希记录；文件数/大小合理。

**常见坑**：复制整个 project/ 把 tools/ 带进去；把 docs/evidence 带进去；ZIP 多一层 dist/；中文根目录名导致老 Windows 解压乱码（用 ASCII 根名）；漏 CREDITS.txt 导致游戏内链接 404；把完整字体放进 ZIP；把 __pycache__ 带进去。

---

### T8.6 发布包回归（45 / 30 分钟）

**目的**：证明“发布包”而不是“开发目录”能玩；证明断网 ZIP 能玩；证明字体/制作名单/来源没有回归。

**输入**：dist/site、ZIP、project/tools/_pw-step7.js、_pw-step8.js、Edge、Node。

**动作**

1. **静态检查**：node --check 四个 JS；node project/tools/check-build.js 目标 38/38；node project/tools/smoke.js 46/46；node project/tools/check-script.js；python project/tools/release.py verify。
2. **site/http**：python -m http.server 8088 --directory dist/site；Edge 打开；完整流程（可用 _pw-step7.js --project=dist/site --url=http --case=all --out=docs/evidence/step-08）；0 console error/pageerror/404/外部请求。
3. **file://**：解压 ZIP 到临时目录；Edge 打开 index.html；至少走到序章结束、四关独立入口、图鉴、结局；确认 localStorage 可用/降级提示。
4. **移动**：844×390 触摸模拟；标题、对话框、四关、ending、制作名单链接；竖屏提示。
5. **字体**：document.fonts.check；?fonts=fallback 截图；无豆腐；字体总大小 ≤300KB（如打包）。
6. **制作名单**：标题页链接可见、44px、键盘可聚焦、点击打开文本；三段分辨率不溢出。
7. **fps（T49/X11）**：_pw-step8.js fps 采样 10s 桌面 + 10s 移动模拟；记录均值/最低；桌面目标 60fps、手机 ≥30fps；不达标就记录，不伪造。
8. **真机/音频**：有设备就补 X3/X4/X5；没有就继续 carry；不要把模拟写成真机。
9. **证据**：截图/JSON/日志写 docs/evidence/step-08/；release-record 填 gate 表。

**产出**：发布回归记录、截图、fps 数据、ZIP 断网证据。

**完成判据**：发布包完整流程通过；ZIP 断网可玩；字体/CREDITS/PDF 可访问；无外部；例外如实；check-build 38/38、smoke 46/46。

**常见坑**：测 project/ 而不是 dist/site；浏览器缓存旧文件；拿开发目录的 localStorage 污染测试；用 http 测完就宣称 file:// 通过；把 844×390 模拟写成真机；fps 只看标题页。

---

### T8.7 部署上线（55 / 35 分钟，必须先确认）

**目的**：交付一个老师点开就能玩的链接；不泄漏开发文件，不覆盖别人的线上版本。

**输入**：dist/site、用户确认、Cloudflare/GitHub 账号、release-record。

**动作**

1. **确认门禁**：用户明确同意部署；确认平台、项目名、是否公开、是否覆盖已有项目；确认账号可用。没有确认就停。
2. **Cloudflare Pages（首选）**：登录 → Create project → Direct Upload → 上传 dist/site（或 zip）→ 无构建命令 → 部署；项目名建议 xiangbei 或用户指定；记录 deployment URL/ID/时间。
3. **GitHub Pages（备选）**：仅在用户提供仓库/权限时；建 gh-pages 或专用分支；不要动 main 历史；确认子路径资源；记录 URL。
4. **线上验证**：无痕窗口打开；标题、字体、CREDITS、/design-note.pdf、四关入口、图鉴、结局、手机横屏；0 error/404/外部请求；硬刷新看缓存。
5. **安全检查**：不暴露 docs/、step/、tools/、.git/、evidence；不显示账号/邮箱；不启用分析统计。
6. **记录**：URL、部署 ID、时间、上传文件哈希、验证结果；写 release-record；截图存 evidence。
7. **失败处理**：无账号/无权限/平台故障 → 记“未部署（P0 例外）”；不要用临时文件分享站冒充正式链接；不要公开仓库来换 Pages。

**产出**：可访问 URL；部署记录；线上截图。

**完成判据**：URL 可访问；游戏/字体/CREDITS/PDF 正常；无外部/404/console error；用户确认记录在案；没有泄漏开发文件。

**常见坑**：上传仓库根目录把 docs/evidence 公开；构建命令填错导致 404；项目名冲突；覆盖旧版本；缓存导致旧 JS；自定义域名没配；把 token 写进命令历史/截图。

---

### T8.8 3 分钟演示视频（90 / 55 分钟）——**2026-11-03 用户取消，本节不执行**

> 保留原始方案供以后需要时参考；本版不生成 MP4、不公开视频，不列为缺口。`docs/demo-script.md` 仅保留作现场演示稿。

**目的**：用 3 分钟让评审看到最好的文本与演出：门板、湘江、泸定、点名；不靠字幕解释一切。

**输入**：T8.1 修正后的 demo-script、发布包、录屏工具、安静环境、预置存档。

**动作**

1. **定稿脚本**：按附录 E 的 6 段；总长 2:45–3:00；旁白逐字写；数字核对 sources。
2. **准备存档**：新档 ?reset=1 录序章/门板；湘江、泸定各自用 ?chapter 或预置存档；结局用预置 ending 存档（7 个名字 + 五卡）；图鉴 7/7 用预置存档。所有预置存档由正常流程生成，不手改 DOM。
3. **录屏**：1920×1080、30fps；浏览器 100%；隐藏书签/通知/调试；不出现 ?debug=1、控制台、真实姓名。系统声 + 麦克风，或无声 + 后期旁白。
4. **剪辑**：片头标题/虚构声明；段落字幕；关键数字；结尾“一块门板，两万五千里”。不伪装一次连续通关；片头或说明写“分段演示”。
5. **音频**：游戏原声或静音 + 旁白；不用未授权音乐；峰值不爆；人声清楚。
6. **导出**：H.264/AAC，MP4；文件名 向北-3分钟演示-v1.0.0.mp4；≤3:00；≤200MB；SHA256。
7. **验收**：完整看两遍；检查错字/数字/姓名/隐私；ffprobe 或播放器看时长/分辨率/音轨；备份到 dist/ 和另一个本地目录。

**产出**：dist/向北-3分钟演示-v1.0.0.mp4；最终 docs/demo-script.md；录制日志。

**完成判据**：≤3:00；声画正常；四个记忆点齐全；数字正确；不冒充连续通关；无未授权素材/隐私；文件可播放；哈希记录。

**常见坑**：超过 3 分钟；把“20 分钟”说成“全程 20 分钟整”；“点名少一个到”；录到调试面板/通知；背景音乐侵权；只录标题页；手机竖屏；人声太小；没有字幕；文件损坏。

---

### T8.9 复核、提交与 tag（45 / 20 分钟）

**目的**：把交付物、证据、状态、版本一次收口；让后来的人能复现。

**输入**：所有产出；release-record；CLAUDE；git。

**动作**

1. 按 §7 逐项勾验收；未过项写例外，不写“通过”。
2. 更新 docs/release-record.md：版本、RELEASE_BASE、链接、ZIP/PDF/MP4/字体哈希、gate 结果、用户确认、例外。
3. 更新 .claude/CLAUDE.md：步骤八按实际写 ✅ 或 🚧（有条件）；当前进度；交付物路径/链接；遗留例外；下一步（维护/展示）。
4. 更新本文件 §11 复核记录（日期/证据/结论）。
5. 检查 git status：不含 dist/、ZIP、MP4、完整字体、账号信息、截图；字体子集/许可证/README/CREDITS/文档可提交。
6. 提交 release: 打包与交差（步骤八）；按 2026-11-03 用户口径，链接由用户上传、视频取消，**不作为 step-8-done 的前置条件**，但在 release-record 记“未部署/视频取消”；除这两项外六项定义满足后打 tag step-8-done。若用户未作此调整，才按“链接缺失即 step-8-conditional”的旧规则。
7. 最终自检：ZIP、PDF、CREDITS/字体清单可打开；链接与视频按用户口径记“未部署/取消”；最终答复用客观口径，不把例外写成通过。

**产出**：commit、tag、CLAUDE 更新、release-record 定稿。

**完成判据**：§7 全部有结论；git 干净；tag 指向发布提交；五项交付可访问；无秘密/大文件。

**常见坑**：tag 打在测试前；把 ZIP/MP4 提交；忘记更新 CLAUDE；把“有条件”写成“全部完成”；把线上 URL 写成 localhost；force push。

---

## 6. 时间盒

| 任务 | 标准 | 压缩 | 备注 |
|---|---:|---:|---|
| T8.0 发布口径 | 30 | 20 | 用户确认最花时间 |
| T8.1 史实/文案 | 60 | 35 | 链接逐条点 |
| T8.2 字体 | 75 | 45 | 下载/子集失败就走回退 |
| T8.3 设计说明 | 90 | 60 | PDF 排版最易返工 |
| T8.4 名单/README/入口 | 45 | 30 | 三档实测 |
| T8.5 发布包 | 65 | 40 | 脚本一次写对 |
| T8.6 发布回归 | 45 | 30 | 复用 step7 |
| T8.7 部署 | 55 | 35 | 等待审核另计 |
| T8.8 视频 | 90 | 55 | 返工另计 30–60 |
| T8.9 复核/tag | 45 | 20 | 文档收口 |
| **合计** | **600** | **370** | 约 10h / 6h10 |

**压缩版取舍顺序**（只能按此顺序砍）：

1. 字体打包改为“不打包 + 系统回退”（省 30 分钟，X6 carry）。
2. 视频改为无声录屏 + 字幕/后期旁白（省 20 分钟，但必须有字幕）。
3. 设计说明先出 Markdown/HTML 打印版，PDF 排版后补（省 15 分钟，但交差前必须有 PDF）。
4. 不砍：史实核对、发布包回归、断网 ZIP、制作名单、链接可访问。

---

## 7. 验收清单

> 证据分级：A 浏览器实测；B 代码/文件完成未跑；C 设计稿/口述；D 未验证。没有 A 就写 B/C/D，不写“通过”。

### E1 链接（P0）

- [ ] 公网 URL 可访问，打开是游戏标题，不是仓库/404/登录页。
- [ ] 无痕窗口/手机网络各开一次；无 console error、无 404、无外部请求。
- [ ] URL、部署 ID、时间、截图在 release-record。
- [ ] 没有账号/授权时：明确写“未部署（P0 例外）”，不伪造链接。

### E2 ZIP 断网（P0）

- [ ] dist/xiangbei-v1.0.0-offline.zip 解压后根目录有 index.html。
- [ ] 飞行模式/断网双击打开，能到标题、能玩序章、能进四关、能到结局。
- [ ] 无外部请求；localStorage 不可用时提示而不白屏。
- [ ] ZIP 白名单：无 tools/docs/step/evidence/.git/dist/测试脚本/完整字体。
- [ ] SHA256 记录在 dist/SHA256SUMS.txt 与 release-record。

### E3 设计说明（P0）

- [ ] dist/design-note.pdf 1 页 A4。
- [ ] 7 条史实锚点 + 每条出处；五卡/五精神机制表；操作说明；20 分钟口径；例外；制作名单。
- [ ] 数字与 sources/story-bible 一致；争议有“有不同说法”；无死链。
- [ ] 文字可复制；字体不乱码；≤2MB；链接可点。

### E4 字体授权（P0）

- [ ] 打包：仅 woff2 子集；标题 ≤80KB、正文 ≤220KB、合计 ≤300KB；OFL 原文；manifest；无完整字体。
- [ ] 未打包：credits/设计说明/README 三处写“未打包，系统回退”；X6 carry。
- [ ] 字体加载失败不影响阅读；?fonts=fallback 可读；无豆腐块。
- [ ] 无外部字体请求；C12 通过。

### E5 演示视频（P0）

- [ ] ≤3:00；1920×1080；H.264/AAC；声画正常。
- [ ] 包含标题、门板、湘江、泸定、点名、五卡。
- [ ] 数字正确；不出现“点名少一个到”；不冒充连续通关。
- [ ] 无未授权音乐/图片；无真实姓名/学校/地址；文件哈希记录。

### E6 制作名单与 README（P0）

- [ ] project/CREDITS.txt 存在；无尖括号姓名占位/TODO/待填；角色/字体/素材/虚构声明齐全。
- [ ] 标题页“制作名单”链接可见、44px、键盘焦点、点击可打开；三档不溢出。
- [ ] 根 README.md 有链接/ZIP/PDF/视频/运行/操作/测试摘要/例外/字体/目录。
- [ ] ZIP 内 README.txt 与 CREDITS.txt 可读。

### E7 史实与来源（P0）

- [ ] A1–A7 每条 ≥2 出处；网页 + 权威书。
- [ ] S4 有说明；S13 有结论；访问日期记录。
- [ ] 真实人物无台词；文学不当史料；争议标注；虚构声明三处。
- [ ] check-script 通过；redlines 10/10。

### E8 无未授权素材（P0）

- [ ] 0 外部图片/音频/图标/CDN/字体 URL。
- [ ] 图像全部 Canvas/SVG 程序化；音频全部 Web Audio；截图只来自本项目。
- [ ] 视频/PDF 无未授权素材；音乐无版权问题。

### E9 发布包干净（P0）

- [ ] site/ZIP 无 tools/、docs/、step/、evidence/、.git/、dist/、_pw-*。
- [ ] 无 __pycache__、.DS_Store、临时文件、完整字体。
- [ ] 所有引用相对路径；index.html 在根；无绝对路径。

### E10 机器检查（P0）

- [ ] node --check 四个 JS 全过。
- [ ] node project/tools/check-build.js 38/38。
- [ ] node project/tools/smoke.js 46/46。
- [ ] node project/tools/check-script.js OK。
- [ ] python project/tools/release.py verify OK。
- [ ] check-build 负例（外链字体/缺 OFL/完整 ttf/缺 CREDITS/外链 http）仍能红。

### E11 发布回归（P0）

- [ ] Edge file:// + http 完整流程；407 line 左右；190–210s 量级。
- [ ] 手机 844×390 全流程；标题/对话/四关/ending/制作名单不溢出。
- [ ] 四关正常 + 失败路径；7 图鉴；结局点名 + 7000 + 五卡。
- [ ] 0 console error/pageerror/404/外部请求。
- [ ] 字体/CREDITS/PDF 可访问；硬刷新无缓存问题。

### E12 20 分钟口径（P0）

- [ ] 设计说明/README 同时写：20:00 上限、04:52–08:33 四次、19:48 静态、23:44 极端。
- [ ] 没有把 191 秒自动化（约 03:11）当真人；没有只写“20 分钟”。
- [ ] 如用户要求所有路径 ≤20，已确认裁剪或明确例外；不擅自改剧情。

### E13 例外如实（P0）

- [ ] X1–X11 逐项有状态：已关闭/继续 carry/用户接受。
- [ ] Chrome/Safari/真机/音频/fps 没测就写“未验证”，不写“通过”。
- [ ] release-record 有“例外与用户确认”段。

### E14 版本与记录（P0）

- [ ] RELEASE_BASE、版本、日期、链接、哈希、文件数在 release-record。
- [ ] .claude/CLAUDE.md 步骤八状态 ✅ 或 🚧（有条件）、交付物、例外、下一步。
- [ ] 本文件 §11 回填。
- [ ] 提交 release: 打包与交差（步骤八）；只有完成定义六项齐全才 tag step-8-done，否则不伪造。
- [ ] git 不含 dist/ZIP/MP4/完整字体/秘密。

### E15 最终答复（P0）

- [ ] 用“已交付/有条件/未验证”三档表述；不把例外写成通过。
- [ ] 列出 ZIP、PDF、CREDITS/字体清单；链接与视频按 2026-11-03 口径写“未部署/取消”，不伪造。
- [ ] 给出复核路径与哈希。

---

## 8. 风险与返工触发

| 风险 | 触发信号 | 处理 | 返工 |
|---|---|---|---|
| 字体下载/授权失败 | 官方页打不开、无 OFL、子集缺字 | 走不打包分支；三处文档一致；X6 carry | 不改 CSS 的 url；C12 local-only |
| 字体超 300KB | 合计 >300KB | 减标题字/去标题字体；优先正文 | 重新子集 + 字体测试 |
| 设计说明两页 | PDF 页数 2 | 删技术细节/截图；压表格 | 重排/重导出 |
| 来源链接失效 | 404/证书错误 | 换官方页/纸书；标“仅书目” | 更新 sources/PDF |
| 20 分钟被质疑 | 评审按 23:44 最坏路径 | 说明口径；用户决定是否裁剪 | 裁剪需改剧情/测试/视频 |
| 部署无账号/权限 | 登录失败/无项目 | 记 P0 例外；不伪造链接 | 用户提供后再部署 |
| 视频超时/音质差 | >3:00/爆音/听不清 | 剪短、重录旁白、降噪 | 重录对应段 |
| 运行时回归 | C37/C38 红、标题页溢出 | 回退链接样式；不改 engine | 重新实测 |
| ZIP 带开发文件 | verify 报 extra | 修白名单/重打 | 重跑 E2/E9 |
| 线上缓存旧版 | 页面仍旧 JS | 硬刷新/加版本查询/重新部署 | 重新验证 |
| 名单隐私 | 真实学校/地址/姓名 | 用化名；删个人信息 | 重导 PDF/视频 |
| 文件路径含空格/中文 | ZIP/命令失败 | 命令加引号；ZIP 根名 ASCII | 重跑 release |

**返工原则**：先修根因，不靠“再截一张图”掩盖；每次返工重跑对应 gate；不删旧证据。

---

## 9. 禁区

1. 不在这场步骤里改剧情、加关卡、加角色、加结局、改旗标、改存档 schema。
2. 不给真实领导人写台词；不把《七根火柴》《金色的鱼钩》当史料；不把争议写成定论。
3. 不加 React/Vue/Svelte、Vite/Webpack、npm 运行时依赖、CDN、ES module、fetch 剧情。
4. 不加登录/后端/数据库/排行榜/多人/战斗/养成/商店/BOSS/角色选择。
5. 不自动播放音频；不依赖 hover；不把热区做小于 44px。
6. 不打包完整字体、未授权字体、未授权图片/音乐/影视素材。
7. 不在未确认时部署、覆盖线上、公开视频、创建公开仓库、push 到远程。
8. 不把 docs/、step/、tools/、evidence/、.git/ 放进 site/ZIP。
9. 不伪造 Chrome/Safari/真机/音频/fps 结果；不把模拟写成真机；不把“用户接受例外”写成“通过”。
10. 不删除/改写步骤七证据与 test-record 历史；不 force push；不把 ZIP/MP4 提交进 Git。
11. 不用 ?debug=1、控制台、调试面板出镜；不在视频/PDF 里出现真实姓名/学校/地址/账号。
12. 不把“20 分钟”写成没有口径的口号；不把 191 秒自动化（约 03:11）当真人；不隐藏 23:44。
13. 不在最后一刻改标题 96px/印章/菜单/组件类名；不为制作名单新增弹窗/暂停入口/主菜单第四项。
14. 不把“写了脚本”说成“录了视频”；不把“本地打开”说成“线上可访问”。

---

## 10. 交接接口

### 给评审/老师

- 先看 README.md 的交付物表；点链接玩 3 分钟；看 design-note.pdf 的史实表/五卡；需要离线就解压 ZIP 双击 index.html。
- 游戏内标题页右下“制作名单”可打开 CREDITS.txt；字体/素材授权在 docs/credits.md 与 LICENSES/。
- 例外在 docs/release-record.md 单列；不要把它读成“全部通过”。

### 给维护者

- 版本升级：改 README/design-note/release-record 的版本；重跑 release.py stage/zip/verify；重打 ZIP；如部署，重新上传。
- 字体升级：替换 woff2 + OFL + manifest；改 C12 哈希（如需要）；重跑字体/回归。
- 部署回滚：Cloudflare 控制台回滚到上一个 deployment；GitHub Pages 回滚分支；记录时间。
- 视频重录：先改 docs/demo-script.md，再按附录 E 录；不要直接改字幕不改旁白。

### 给下一步（维护/展示）

- 本步是交付终点，不是新功能起点；任何新玩法先改计划书并确认。
- 若后续补 Chrome/Safari/真机/音频/fps，关闭 X1–X5/X11，更新 release-record，不覆盖旧结论。

---

## 11. 复核记录（执行时回填）

### 11.1 基本信息

- 执行日期：2026-11-03
- 执行人：刘子政（按用户指定署名）
- RELEASE_BASE（git HEAD）：`4bb389098511407a9a4a39e1f218a9b76ad7883f`（step-7-done）
- 版本：v1.0.0
- 平台/浏览器/设备：Windows；Edge 156.0.4314.58（Playwright headless）；Node 24.21.0；Python 3.14.6；844×390 触摸模拟
- 证据目录：`docs/evidence/step-08/`

### 11.2 交付物

| 项 | 路径/URL | 大小/时长 | SHA256 | 状态 |
|---|---|---|---|---|
| 链接 | — | — | — | **未部署；用户自行上传**（不伪造 URL） |
| 发布站点 | `dist/site/` | 8 文件 / 672,335 B | 见 `dist/SHA256SUMS.txt` | 已生成并回归 |
| ZIP | `dist/xiangbei-v1.0.0-offline.zip` | 10 条目 / 376,880 B | `e6895ce3…` | 已生成并回归 |
| 设计说明 PDF | `dist/design-note.pdf` | 1 页 / 291,770 B | `57b2a513…` | 已生成；结构/ToUnicode 已查 |
| 演示视频 | — | — | — | **用户 2026-11-03 取消，不计缺口** |
| 字体清单 | `docs/credits.md` / `project/CREDITS.txt` | 0 字节字体 | — | 本版不打包，系统回退 |
| 制作名单 | `project/CREDITS.txt` | 2,025 B | `3370c5ef…` | 标题页可打开 |
| 哈希清单 | `dist/SHA256SUMS.txt` | 19 行 | — | 已生成 |

### 11.3 门禁

| 门禁 | 结果 | 证据 |
|---|---|---|
| G0 输入 | 通过 | 八项用户输入均有结论（release-record §2） |
| G1 史实/字体 | 通过（字体走不打包分支） | sources 链接复核；红线 10/10；X6 |
| G2 说明/名单 | 通过 | PDF 1 页 / 291,770 B；CREDITS 2,025 B；无占位；标题链接逻辑 44px |
| G3 发布包 | 通过 | `release.py verify`；白名单 10 条目；逐文件哈希一致 |
| G4 部署/视频 | 部署未执行（用户上传）；视频取消 | 用户 2026-11-03 明确选择 |
| G5 最终 | 通过（带例外） | check-build 38/38；smoke 46/46；发布包 http/file 全流程；96/96 |

### 11.4 例外

| 编号 | 例外 | 状态 | 用户确认 |
|---|---|---|---|
| X1 | Chrome 未装 | carry | 2026-11-02 接受 P0 环境例外 |
| X2 | Safari 无设备 | carry | 同上 |
| X3 | 真机触摸未验 | carry | 仅 844×390 模拟 |
| X4 | 音频听感未验 | carry | 只证路由/上限 |
| X5 | 真实后台/锁屏未验 | carry | 仅 visibility 模拟 |
| X6 | 字体未打包 | **本步决定不打包** | 2026-11-03 用户确认；三处文档一致 |
| X7 | 计时版本未注明 | carry | 四次 04:52–08:33；不把自动化 191 秒当真人 |
| X8 | 试玩访谈限制 | 已接受 P0 例外 | 2026-11-02 用户接受 |
| X10 | 遵义第三刀未决 | carry | 未超 20 分钟，不裁剪 |
| X11 | fps 未采样 | **本步补测** | 桌面 60.0/60.0；移动 60.0/48.7（min 29.9） |
| X12 | 制作名单移动物理热区 <44 | **本步记录** | 逻辑 100×44；844×390 物理 41.2×24.4；按 B16 同类例外 |
| — | 演示视频 | **用户取消** | 2026-11-03 明确；不生成 |
| — | 公网链接 | **未部署** | 用户自行上传；不伪造 |

### 11.5 结论

- 完成/有条件完成/未完成：**完成（按 2026-11-03 用户调整口径）**；链接待用户上传、视频取消、字体不打包。
- 未完成项：公网部署（用户执行）；发布包上的移动完整流程未重跑（沿用步骤七 200.9s/406 line）；Chrome/Safari/真机/音频听感/真实后台按 §11.4 carry；PDF 未做人工复制粘贴。
- 需要用户确认的事项：上传 `dist/site/` 后把 URL/部署时间/哈希填回 `docs/release-record.md` §4；不要再要求“演示视频”。
- tag/commit：Git 已恢复（2.45.1.windows.1）；提交本步文件后打 annotated tag `step-8-done`，提交号以 `git rev-parse step-8-done^{}` / `git log -1` 为准；不在文档里伪造提交号。

---

## 附录 A：设计说明骨架

    向北 —— 一块门板，两万五千里
    16 岁红军文书 · 七段 · 四个小游戏 · 20 分钟设计上限
    虚构人物，非史料人物；历史结局不可改

    1. 一句话
    2. 怎么玩（点击/空格/1–3/Esc；手机横屏；无 Game Over）
    3. 七段与机制（表）
    4. 史实锚点（A1–A7 表）
    5. 五张精神卡（表：条件/机制/精神）
    6. 20 分钟口径（表：上限/四次/静态/极端）
    7. 已知例外（Chrome/Safari/真机/音频/fps）
    8. 制作名单/字体/素材

**七段表建议**

| 段 | 史实锚点 | 玩家动作 | 机制 |
|---|---|---|---|
| 序章·于都 | 1934.10 于都河，8.6 万余人，门板/床板/寿材架桥 | 从家里锯门板，选带什么 | 门板容量 6 格，门板占 2 格 |
| 一·湘江 | 1934.11 末–12 初，8.6 万→3 万余人，红 34 师断后 | 弃物/断后 | 限时弃物，X 光机 300 斤，追兵 45s |
| 二·遵义 | 1935.1.15–17，约 3.7 万人 | 复盘，承认错误 | 3 条复盘，admit≥2 才会亮“独立自主” |
| 三·金沙江 | 1935.5 皎平渡，6 条船（有 7 条说）、37 船工、7 天 7 夜 | 调度渡船，先渡谁 | 6 船、3 船工/船、疲劳、追兵 120s |
| 四·泸定 | 1935.5.29，22 人、13 根铁索、240 余里 | 攀索，点亮 22 个光点 | 3 道命中窗 0.35s；失误扣火种 |
| 五·草地 | 1935.8 松潘→班佑，7 天，近 800（回忆录） | 分粮/抬人 | 纯对话 + 资源选择，无小游戏 |
| 终·吴起 | 1935.10.19，约 7000 人 | 点名，看五卡 | 名字被划掉；数字；五卡 |

**五卡表建议**

| 卡 | 条件 | 机制 | 精神 |
|---|---|---|---|
| 火种 | fire ≥20 | 资源/火种 | 理想信念 |
| 断后 | choice.xiangjiang.hold===true | 限时抉择 | 不怕牺牲 |
| 复盘 | choice.zunyi.admit≥2 | 遵义复盘 | 独立自主 |
| 先渡 | choice.jinsha.priority==="main" | 渡船调度 | 顾全大局 |
| 船工 | trust≥3 且 memory.zhang | 民心→船工 | 依靠人民 |

> 全灰合法；五卡不改变结局，只改变你记得什么。

---

## 附录 B：来源审计表（执行时填）

| 编号 | 出处 | 链接状态（2026-11-03） | 用途 | 备注 |
|---|---|---|---|---|
| S1 | 求是网 于都 |  | A1 |  |
| S2 | 中国军网 于都夜渡 |  | A1 |  |
| S3 | 中国军网 遵义 |  | A3 |  |
| S4 | 待处理：补已核出处，或注明“预留未采用（原因待查）” | — | — | 编号保留；不贸然重编号 |
| S5 | 《中国共产党历史》第一卷 | 纸书 | A1/A2/A3 |  |
| S6 | 《红军长征史》 | 纸书 | A2/A5/A6/A7 |  |
| S7 | 人民网 解读长征(10) |  | A3/A7 |  |
| S8 | 中国军网 金沙江 37 船工 |  | A4 |  |
| S9 | 中国军网 听涛泸定桥 |  | A5 |  |
| S10 | 中国军网 铁索铭记铁血青春 |  | A5 |  |
| S11 | 中国军网 班佑河畔 |  | A6 |  |
| S12 | 中国军网 吴起的晨曦 |  | A7 |  |
| S13 | 中国军网 夹金山 4114 |  | 补充 | 域名/URL 待核 |
| S14 | 人民网 湘江战役 |  | A2 |  |
| S15 | 人民网 震古烁今的伟大远征 |  | A2 |  |

**规则**：链接点开才算“已核”；点不开写“仅书目/待补”；设计说明只用已核内容；S4 不静默留空。

---

## 附录 C：字体子集与 manifest

**目录**

    project/assets/fonts/
    ├─ SmileySans-Oblique-subset.woff2   （可选，≤80KB）
    ├─ LXGWWenKai-Regular-subset.woff2   （可选，≤220KB）
    ├─ FONT-MANIFEST.md
    └─ LICENSES/
       ├─ OFL-SmileySans.txt
       └─ OFL-LXGWWenKai.txt

**命令示例（在 .tools/fonts/ 下执行，完整字体不进仓库）**

    pyftsubset SmileySans-Oblique.ttf --text-file=chars-title.txt --flavor=woff2 --output-file=SmileySans-Oblique-subset.woff2 --layout-features='*' --no-hinting
    pyftsubset LXGWWenKai-Regular.ttf --text-file=chars-body.txt --flavor=woff2 --output-file=LXGWWenKai-Regular-subset.woff2 --layout-features='*' --no-hinting

**manifest 必填**

| 字段 | 示例 |
|---|---|
| 字体名 | Smiley Sans / 得意黑 |
| 来源 | GitHub release URL + tag |
| 下载日期 | 2026-11-03 |
| 原始文件 SHA256 | … |
| 子集文件 | SmileySans-Oblique-subset.woff2 |
| 子集大小 | ≤80KB |
| 字符数 | … |
| 子集命令 | 上方命令 |
| 许可 | OFL 1.1，附原文 |
| 修改说明 | 仅子集化，未改字形 |

**CSS 目标形态**

    @font-face {
      font-family: "Smiley Sans";
      src: local("Smiley Sans"), local("得意黑"),
           url("./assets/fonts/SmileySans-Oblique-subset.woff2") format("woff2");
      font-display: swap;
      font-style: normal;
      font-weight: 400;
    }
    @font-face {
      font-family: "LXGW WenKai";
      src: local("LXGW WenKai"), local("霞鹜文楷"),
           url("./assets/fonts/LXGWWenKai-Regular-subset.woff2") format("woff2");
      font-display: swap;
      font-style: normal;
      font-weight: 400;
    }

> 不打包时删除 url(...)，保留 local()；三种文档（credits/design-note/README）必须一致。

---

## 附录 D：发布包树与白名单

    dist/
    ├─ site/                              # 上传 Cloudflare Pages
    │  ├─ index.html
    │  ├─ style.css
    │  ├─ engine.js
    │  ├─ story.js
    │  ├─ minigames.js
    │  ├─ art.js
    │  ├─ CREDITS.txt
    │  ├─ design-note.pdf
    │  ├─ assets/fonts/…                  # 可选
    │  └─ LICENSES/…
    ├─ xiangbei-v1.0.0/                   # ZIP 根
    │  ├─ index.html
    │  ├─ style.css
    │  ├─ engine.js
    │  ├─ story.js
    │  ├─ minigames.js
    │  ├─ art.js
    │  ├─ CREDITS.txt
    │  ├─ README.txt
    │  ├─ design-note.pdf
    │  ├─ assets/fonts/…                  # 可选
    │  └─ LICENSES/…
    ├─ xiangbei-v1.0.0-offline.zip
    └─ SHA256SUMS.txt

**禁止出现**：project/tools/、docs/、step/、docs/evidence/、.git/、dist/、_pw-*.js、__pycache__、*.zip（嵌套）、*.mp4、完整 .ttf/.otf。

**release.py 白名单（伪代码）**

    RUNTIME = ["index.html", "style.css", "engine.js", "story.js", "minigames.js", "art.js"]
    OPTIONAL = ["CREDITS.txt", "README.txt", "design-note.pdf"]
    FONT_DIR = "assets/fonts"
    LICENSE_DIR = "LICENSES"
    # 只复制存在且在白名单内的文件；其他一律 fail，不静默跳过

---

## 附录 E：3 分钟演示分镜（修正版）

| 时间 | 画面 | 旁白/字幕 |
|---|---|---|
| 0:00–0:12 | 标题页；虚构声明 | “《向北》。一块门板，两万五千里。设计上限 20 分钟；这是 3 分钟演示。” |
| 0:12–0:50 | 序章门板；拖动物品；结算 | “16 岁文书满崽，从于都门上锯下这块板。门板占两格，带什么，后面就得放下什么。” |
| 0:50–1:25 | 湘江弃物；X 光机；图鉴 | “1934 年 11 月末，湘江。八万六千余人出发，过江后三万余人。X 光机三百斤，追兵四十五秒。” |
| 1:25–2:00 | 泸定攀索；22 个光点；一次失误 | “1935 年 5 月 29 日，泸定。二十二位勇士，十三根铁索。暗一个光点，只改结算里的一句话；历史不改，点名人数也不改。” |
| 2:00–2:40 | 吴起；点名；五卡 | “1935 年 10 月 19 日，吴起镇，约七千人。七个名字，五张卡。火种、断后、复盘、先渡、船工——五种机制，不是五句口号。” |
| 2:40–2:55 | 门板特写/路线 | “他一路背着门板，也一路记下名字。我记一下。” |
| 2:55–3:00 | 结束卡：虚构声明/制作名单 | “虚构人物，非史料人物。制作名单与出处见说明。” |

**录制备注**

- 分段录，不伪装连续；片头或说明写“演示为分段录制”。
- 门板关拖“药箱/青稞/花名册”三件即可，不必全拖。
- 湘江展示 X 光机 300 斤 + 一次放弃；不展示全部 6 件。
- 泸定必须有一次失误，才能解释“代价”，但不要暗示点名少人。
- 结局用预置存档；五卡全亮或至少 3 亮；不要展示 ?debug。
- 字幕数字与 sources 一致；不用“30 万”“6.8 万”等停用说法。

---

## 附录 F：部署检查清单

**Cloudflare Pages**

- [ ] 用户确认；项目名不冲突；不覆盖旧版本。
- [ ] Direct Upload；无构建命令；输出 dist/site。
- [ ] 上传后打开根 URL；标题/字体/CREDITS/PDF。
- [ ] 无痕窗口 + 手机网络；0 error/404/外部请求。
- [ ] 记录 URL/deployment ID/时间/哈希。
- [ ] 不启用 Analytics/Web Analytics；不加 Functions。

**GitHub Pages（备选）**

- [ ] 用户提供仓库/权限；不擅自创建公开仓库。
- [ ] 专用分支；不动 main 历史；相对路径。
- [ ] 子路径测试：https://user.github.io/repo/。
- [ ] 记录 URL/commit；回滚方案。

**回滚**

- Cloudflare：控制台 → Deployments → 选上一个 → Rollback。
- GitHub Pages：回退分支/commit；重新发布。
- 回滚后重跑标题/CREDITS/PDF/控制台检查。

---

## 附录 G：执行命令清单

    cd "D:\deepseek harness\新建文件夹"

    # 语法与静态检查
    node --check project/engine.js
    node --check project/story.js
    node --check project/minigames.js
    node --check project/art.js
    node project/tools/check-build.js
    node project/tools/smoke.js
    node project/tools/check-script.js

    # 发布包
    python project/tools/release.py stage --version 1.0.0
    python project/tools/release.py zip --version 1.0.0
    python project/tools/release.py verify --version 1.0.0
    python project/tools/release.py hash

    # 本地站点
    python -m http.server 8088 --directory dist/site
    # 浏览器打开 http://127.0.0.1:8088/

    # 发布回归（示例；以脚本实际参数为准）
    node project/tools/_pw-step7.js --browser=edge --project=dist/site --url=http --case=all --out=docs/evidence/step-08
    node project/tools/_pw-step7.js --browser=edge --project=解压目录/xiangbei-v1.0.0 --url=file --case=all --out=docs/evidence/step-08

    # 本版视频取消，以下命令不执行（保留供以后需要时参考）
    # ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,codec_name "dist/向北-3分钟演示-v1.0.0.mp4"

> 本机默认沙箱下 pwsh 子进程可能失败；node/git 在 danger-full-access 下重试。命令路径含空格，必须引号。

---

## 附录 H：需要用户确认的输入

| # | 输入 | 默认（未确认时） | 影响 |
|---|---|---|---|
| 1 | 制作名单姓名/化名与角色 | “《向北》课程项目组”（需同意） | CREDITS/PDF/视频 |
| 2 | 是否打包字体 | 尝试；失败回退 | 字体/体积/授权 |
| 3 | 部署平台 | Cloudflare Pages | 链接 |
| 4 | 账号/部署授权 | 未授权则不部署 | 链接 |
| 5 | 视频是否公开 | 不公开，只交文件 | 发布范围 |
| 6 | 是否接受 P1 例外 | 继续 carry | 最终结论 |
| 7 | 所有路径是否必须 ≤20:00 | 按 T20 口径，不裁剪 | 剧情/测试/视频 |
| 8 | 项目名/URL 前缀 | xiangbei | 链接 |

> 这八项在 T8.0 记录；没有确认的项不得由执行者擅自 default 成“可以”。

---

## 附录 I：本步文件树（执行后）

    .
    ├─ README.md                         # 新建：交付入口
    ├─ docs/
    │  ├─ design-note.md                 # 新建：一页说明源
    │  ├─ release-record.md              # 新建：发布记录
    │  ├─ credits.md                     # 修改：名单/字体/清单
    │  ├─ sources.md                     # 修改：S4/S13/访问日期
    │  ├─ demo-script.md                 # 修改：修正数字/错句
    │  ├─ quality-bar.md                 # 修改：制作名单/字体口径
    │  └─ ui-layout.md                   # 修改：title-credits 坐标
    ├─ project/
    │  ├─ index.html                     # 修改：标题页制作名单链接
    │  ├─ style.css                      # 修改：链接样式 + 可选 @font-face url
    │  ├─ CREDITS.txt                    # 新建：纯文本名单
    │  ├─ assets/fonts/…                 # 可选：woff2 + OFL + manifest
    │  └─ tools/
    │     ├─ check-build.js              # 修改：C12/C37/C38
    │     ├─ release.py                  # 新建
    │     ├─ _pw-step8.js                # 新建
    │     └─ _pw-step7.js                # 小改：--out
    ├─ dist/                             # 生成，gitignored
    │  ├─ site/
    │  ├─ xiangbei-v1.0.0/
    │  ├─ xiangbei-v1.0.0-offline.zip
    │  ├─ design-note.pdf
    │  ├─ 向北-3分钟演示-v1.0.0.mp4   # 本版不生成（用户取消）
    │  └─ SHA256SUMS.txt
    └─ .claude/CLAUDE.md                 # 修改：步骤八状态

---

## 附录 J：一句话提醒

**步骤八不是“再做一个页面”，而是把已经能玩的东西，变成老师能打开、能离线、能看懂、能相信的东西。**

数字要能追溯，例外要能看见，链接要真的能开，ZIP 要真的断网能玩。
