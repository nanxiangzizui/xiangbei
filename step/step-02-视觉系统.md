# 步骤二执行计划：视觉系统

> **所属步骤**：二 · 视觉系统（对应 向北-项目计划书.md 执行步骤 4）
> **状态源**：.claude/CLAUDE.md「分步骤」表；本文件不另存状态，执行时只回填文末《复核记录》
> **当前状态（2026-11-01）**：步骤一 ✅ 完成，tag step-1-done；步骤二 ⬜ 未开始。本文件是执行前计划，所有条目均未执行；不得把本文件当成“视觉已完成”。
> **本步骤出口**（逐字引自 .claude/CLAUDE.md）：标题画面 + 一套 UI 组件库；三档分辨率不出界；字体回退可用。
> **时间盒**：标准版 8h30（510 min）／压缩版 4h50（290 min）
> **不可逆动作**：无。不部署、不打包字体、不发视频、不覆盖线上版本；提交与 tag 在 T2.9。

---

## 0. 一页速览：任务卡总表

| 编号 | 任务 | 主要产出 | 完成判据 | 预算 |
|---|---|---|---|---|
| T2.0 | 文档先行：视觉令牌、组件、画布契约 | docs/visual-system.md、ui-layout 增补、credits 说明 | 文档落地，代码未动 | 35 min |
| T2.1 | 设计令牌与纸墨基础层 | style.css 的 :root、字体、纸纹、焦点、按钮基类 | 令牌齐全；组件不散落 hex | 45 min |
| T2.2 | art.js 程序化版画 | 单画布 API + 四场景静态插画 | 四场景可画；同种子可复现 | 95 min |
| T2.3 | 标题画面 | index.html 标题区、stage-art、印章、菜单 | 1920/1366/844 不出界 | 50 min |
| T2.4 | 10 类组件壳与预览页 | style.css 组件段、tools/ui-preview.html、ui-preview.js | 10 类、全状态、无外部素材 | 85 min |
| T2.5 | 场景换皮与引擎接入 | engine.js 的 mount/paint/resize、CSS 场景层 | 标题/地图/VN 共用一张画布 | 60 min |
| T2.6 | 字体回退与授权记录 | 回退测试、credits 更新 | 禁用本地字体后仍可读 | 25 min |
| T2.7 | 静态检查与无头冒烟 | check-build C10–C12、C03/C07/C08；smoke S15–S17 | 全绿；负例会红 | 45 min |
| T2.8 | 浏览器实测与留证 | 三档、file://、http、触摸、字体回退 | B1–B14 有证据或明确标 D | 55 min |
| T2.9 | 复核、状态同步、提交 | 复核记录、CLAUDE.md、tag step-2-done | tag 与状态一致 | 15 min |

合计 510 min（8h30）。压缩版 290 min（见 §6），只保出口，不保工具与组件全状态。

**本步的完成定义**（三条同时成立才算完成，不是“CSS 写完了”）：

1. 标题画面在 1920×1080、1366×768、844×390 三档都不出界；门板、山形、印章、菜单在 1280×720 舞台内成立，菜单四态与焦点可见。
2. 标题、地图、于都河、于都夜四个场景共用一张 Canvas 程序化背景；VN 的章节名在夜蓝上可读；组件预览页能看全 10 类组件壳与主要状态。
3. 断网 file:// 打开 project/index.html，标题→地图→于都→读到 p006 夜背景，Console 无 error、无 404；禁用本地字体后仍能读。

**先文档后代码**：本步新增 4 类实现参数——设计令牌、标题 96px 与印章坐标、单画布 stage-art 契约、字体 local()/回退策略。它们必须先在 T2.0 写进 docs，T2.1 才开工；否则代码会成为唯一规格。

---

## 1. 起点盘点：已有资产 vs 缺口

| 已有 | 位置 | 状态 |
|---|---|---|
| 1280×720 固定舞台、三场景、缩放 | project/index.html、style.css、engine.js | 步骤一已完成；1920/1366/844×390 实测过 |
| 六运行文件与脚本顺序 | project/ 下 index/style/engine/story/minigames/art | 文件齐全；art.js 与 minigames.js 是空壳 |
| 序章 20 句试片 | project/story.js | 可走到 p020；bg 只有 yudu_river / yudu_night |
| 地图 7 站坐标与路线 | docs/ui-layout.md §1.5、engine.js MAP_STATIONS | 坐标已冻结；插画未画 |
| VN 坐标与标题坐标 | docs/ui-layout.md §1/§2 | 有坐标；标题仍是 72px；门板是虚线占位 |
| 五色与字体授权 | docs/credits.md、style-guide、quality-bar | 五色已定；无任何字体文件 |
| 存档与状态机 | engine.js XB.core、docs/state-schema.md | 本步不改 schema，不新增持久字段 |
| 静态检查 / 冒烟 | project/tools/check-build.js（C01–C09）、smoke.js（S01–S14） | 步骤一可用；C07 明确禁止 engine 引用 XB.art，需在本步放宽 |
| 浏览器证据 | docs/evidence/step-01/（gitignored） | 只有 Edge 156；Chrome/Safari/真机留步骤七 |

| 缺口 | 影响 | 本步处置 |
|---|---|---|
| 没有设计令牌；CSS 有 rgba 与渐变硬编码 | 颜色散落，组件无法复用 | T2.1 建 :root；T2.7 C10 检查 |
| art.js 是空壳；VN 背景是 CSS 渐变 | 没有版画与纸墨质感 | T2.2 写程序化版画；T2.5 接一张画布 |
| 标题 72px、正文无字体族、门板虚线占位 | 标题不成立，首 5 分钟弱 | T2.3 标题 96px + 印章 + 门板 |
| 没有组件库；只有三个原始按钮 | 步骤三/五会重复写样式 | T2.4 十类组件壳 + 预览页 |
| .vn-chapter 是朱砂 16px 字压在夜蓝上 | 对比度不足 | T2.1/T2.5 改纸白 + 墨色底片 + 朱砂方块 |
| 字体只有系统宋体回退，没有 local() 规则 | 标题与正文没有明确字体契约 | T2.1/T2.6 local() + ?fonts=fallback |
| check-build C07 禁止 XB.art | art.js 一写就红 | T2.5 同步改 C03/C07；T2.7 新增 C10–C12 |
| 没有组件预览页 | 组件状态靠猜，步骤三返工 | T2.4 建 tools/ui-preview.html |
| 只有 Edge 证据 | 不能声称三浏览器通过 | T2.8 只报 Edge；其余留步骤七 |

**关键判断**：这一步不是做 VN 逻辑，是“把纸、墨、朱砂立起来，并给步骤三一套可复用的壳”。打字机、选项计时、图鉴正文、结局数据、小游戏、音频都不在本步；本步只证明四件事：标题成立、四个背景能画、十个组件壳能复用、三档与字体回退不崩。

**三个高风险点**（§8 展开）：

1. 本机没有得意黑/霞鹜文楷文件，标题实际会落到微软雅黑/宋体回退。验收必须按回退字体看，不得把“装了字体才好看”当成通过。
2. 标题从 72 改 96 会改变标题/副题/印章的相对位置；必须先改 ui-layout，再改 CSS，最后用 boundingBox 实测，不能只在浏览器里挪。
3. 单画布 stage-art 会替换现有 vn-bg；engine、check-build、文档、测试脚本必须同一次改完，否则会出现“画布有了但引擎还在找 vn-bg”的半截状态。

---

## 2. 本步骤的不变量（先背下来再动手）

**内容**

1. 不改 docs/script 的任何正文；不改 story.js 的 20 句、id、bg、end；不改旗标名、存档键、schema。
2. 不虚构真实人物，不给真实人物画像，不把《七根火柴》《金色的鱼钩》当史料；组件预览页只用占位文案，不写新的史实断言。
3. 不画人物正脸，不做写实插画；版画只用山形、江面、雾、雪粒、铁索、屋脊、门板、芦苇、印章等环境与物件。
4. 标题文案仍是“向北”“一块门板，两万五千里”；版本行改为“试玩版 · 人物虚构，非史料人物”，不出现“步骤二”这种开发字样。
5. 组件壳不接任何剧情数据；图鉴/结局预览只用“史实注（占位）”“点名 — 人”等占位，不提前消费步骤五的正文。

**技术**

6. 六个运行文件固定为 project/index.html、style.css、engine.js、story.js、minigames.js、art.js；不新增运行时 JS 文件。
7. 只用经典 script + window.XB；不用 fetch/XHR/ES module/构建链/CDN；所有资源相对路径，file:// 可开。
8. 舞台固定 1280×720；所有坐标是舞台坐标；缩放仍由 --scale + transform 完成，不逐元素改 px。
9. 只保留一张全屏画布 #stage-art；标题/地图/VN 共用；不新增三张画布，不把画布放进 minigames。
10. Canvas 按 devicePixelRatio 放大，renderScale = clamp(舞台缩放 × DPR, 1, 2)；所有绘制用 1280×720 设计坐标。
11. 静态绘制：本步不引入 rAF 动画循环；只在 mount/paint/resize 重绘；resize 用一次 rAF 合并；不做粒子每帧噪声。
12. 设计令牌只在 :root 定义；组件不写 hex/rgb/rgba；字体只用 local() 或回退栈，不打包字体文件。
13. 输入仍只用 pointer/click/keydown；不依赖 hover；可点元素 ≥44×44；焦点环在纸白与夜蓝上都可见。
14. 控制台零 error、零 404；画布失败要有可见提示与 CSS 底色兜底，不白屏。

**范围**

15. 不做打字机、不做选项计时、不做小游戏、不做图鉴逻辑、不做结局数据、不做音频、不做转场系统；这些分别在步骤三/四/五/六。
16. 不做标题入场动画、不做纸纹粒子、不做闪白/震动；本步只做静态质感。
17. 不改项目目录结构；组件预览页是开发工具，不是第七个运行文件，不进入 index.html 的脚本顺序。
18. 不部署、不打包 ZIP、不发视频；不把截图/字体/大文件提交进仓库。

---

## 3. 产出清单（文件级）

| 路径 | 动作 | 内容 | 验收 | 下游 |
|---|---|---|---|---|
| docs/visual-system.md | 新建 | 令牌、字体、对比度、10 类组件、画布契约、构图坐标、性能预算 | T2.0 判据；C08 | 步骤三–八的视觉唯一源 |
| docs/ui-layout.md | 修改 | 标题 96px/新坐标、印章、stage-art 层、组件壳尺寸、对比度注记 | T2.0 判据；C08 | 步骤三/五接坐标 |
| docs/credits.md | 修改 | 字体 local() 策略、无文件状态、步骤八子集化欠账 | T2.6 判据 | 步骤八打包 |
| project/index.html | 修改 | 加 #stage-art、标题印章、菜单组件类、删 title-board | C03；标题实拍 | 步骤三/五加场景 |
| project/style.css | 修改 | :root 令牌、@font-face local、纸纹、标题、地图、VN、10 类组件 | C05/C10/C12；三档实拍 | 全项目样式 |
| project/art.js | 重写 | 单画布 API、四场景程序化版画、seeded RNG | C11；四场景实拍 | 步骤六加动效 |
| project/engine.js | 修改 | stage-art 缓存、mount/paint/resize、?fonts=fallback、调试尺寸 | 输出三条；C03/C07 | 步骤三/四/五 |
| project/tools/ui-preview.html | 新建 | 10 类组件全状态静态目录、字体回退对照 | C12；T2.4 实拍 | 步骤三/五查样式 |
| project/tools/ui-preview.js | 新建 | 预览页缩放工具条（开发期） | 相对路径；无外部请求 | 不进入运行时 |
| project/tools/check-build.js | 修改 | C03/C07 同步；新增 C10–C12；C08 扩文档 | 全绿 + 负例 | 步骤七回归 |
| project/tools/smoke.js | 修改 | 新增 S15–S17（art API/RNG/场景表） | 全绿 | 步骤四/七回归 |
| step/step-02-视觉系统.md | 修改 | 执行时回填 §11 复核记录 | T2.9 判据 | 交接 |
| .claude/CLAUDE.md | 修改 | 步骤表、当前进度、下一步 | T2.9 判据 | 唯一状态源 |

**不动的文件**：project/story.js、project/minigames.js、docs/state-schema.md、docs/script/*、docs/codex.md、docs/test-cases.md。若发现必须改，先停下来说明理由，不在本步顺手改。

---

## 4. 决策记录（S1–S11）

| # | 决定 | 为什么 | 代价 / 回退 |
|---|---|---|---|
| S1 | 用一张全屏 canvas#stage-art 承载标题/地图/VN 四个背景；删除 .vn-bg div 与 CSS 渐变 | 三张全屏画布内存高、三套 resize；单画布只有一条绘制路径，步骤六要交叉淡入时再加第二缓冲 | 场景切换时整张重绘；没有交叉淡入。回退：步骤六需要时加 #stage-art-b，不改成每个场景一张 |
| S2 | 本步不打包字体文件；@font-face 只用 local()，配合回退栈与 ?fonts=fallback | 没有授权文件、没有子集化，打包会超 300KB 预算；先锁字体契约，步骤八再换 url() | 本机没有得意黑/霞鹜文楷时，标题/正文落到雅黑/宋体；验收按回退看。回退：步骤八若字体超预算，继续用 local()+系统回退 |
| S3 | 组件预览用 project/tools/ui-preview.html + ui-preview.js，不用 ?ui=1 | 不把 demo 代码塞进 engine.js；六运行文件保持固定；预览页可用 file:// 直接开 | 预览页与运行时可能漂移；C12 检查 10 个 data-ui 标记与 ../style.css 引用 |
| S4 | 所有设计令牌只在 :root 定义；组件一律 var() | 颜色散落是步骤二最大返工源；令牌也让步骤三/五复用 | :root 变长；C10 做机器检查。回退：不得把 hex 挪进组件再豁免检查 |
| S5 | 朱砂小字只放纸白/纸白高光上；夜蓝上用纸白或火橙；.vn-chapter 改纸白 + 墨色底片 + 朱砂方块 | 实测 cinnabar/night = 2.35，现有章节名不过；不能靠“看起来还行” | 夜蓝上没有朱砂正文，少一点红；用纸白和火橙补层次 |
| S6 | 标题从 72 改 96px，位置 120,132；印章 56×56 放在 360,150；门板仍 760,120,360×480 | 首 5 分钟需要更强的标题；72px 在 1920 上偏小；96 在 72–96 规范内 | 副题/菜单/印章要重测；ui-layout 同步改。回退：若回退字体 96px 过宽，降到 88px 并同改文档 |
| S7 | 本步只做静态版画；不引入 rAF 动画循环 | 先证明构图与性能；粒子/雾动/转场是步骤六 | 标题没有入场动画；可接受。回退：步骤六加动画时不得每帧重绘整张背景 |
| S8 | art API 固定为 mount(canvas) / paint(canvas, sceneId) / resize(displayScale) / rng(seed)，SCENES 含 title/map/yudu_river/yudu_night | 引擎只认这四个方法；场景 id 与 story bg 可交叉校验；seeded RNG 可测 | API 窄，步骤六加动效需另加方法；回退：加方法不 breaking，不改 paint 签名 |
| S9 | engine 在 renderTitle/renderMap/renderVn 调 paintStage；resize 调 art.resize；失败隐藏画布 + 一次性 toast | 画布失败不能白屏；场景切换要重画；不改变 go/render/存档语义 | 多一层 try/catch；错误可见。回退：若 paint 性能不足，只在 bg 变化时重绘，保留 resize 重绘 |
| S10 | 组件库 10 类壳：btn、dialog、choice、title-card、codex（含 7 卡）、ending、pause、settings、hud、feedback（toast/badge/seal/rule） | 覆盖步骤三/五/六的最小复用集；不提前接逻辑 | 只做壳，步骤三/五要接行为；C12 只验静态标记。回退：缺哪类就在该步骤补，不临时造第二套类名 |
| S11 | 标题主菜单保持 3 项；设置组件只在预览库，运行时入口由步骤三接 | 避免加一个“点了只弹提示”的死按钮；标题布局不变 | 标题画面暂时没有设置入口；步骤三补暂停/设置。回退：若评审要求标题有设置，再加 44×44 文字按钮并接步骤三 |

**S1 的运行时模型**

- #stage-art 是 #stage 的第一个子元素，position:absolute; inset:0; width:1280; height:720; z-index:var(--z-art); pointer-events:none; aria-hidden=true。
- 三个 .scene 是 z-index:var(--z-scene) 的透明层；#stage[data-scene="vn"] 用夜蓝底色兜底。
- 同一时刻只有一张画布，只画当前场景；标题/地图是透明纸底，VN 是不透明夜底。
- 画布不接收指针；所有交互仍在 DOM 按钮/对话框上。

**S4 的令牌边界**

- 允许在 :root 出现的：五色、派生纸色、派生墨色 alpha、纸纹渐变、字体栈、字号、行高、间距、边框、圆角、z-index、动效时长、焦点环、底片色。
- 组件规则里只允许 var()、transparent、currentColor、inherit；不允许 #hex、rgb()、rgba()、hsl()。
- art.js 不复制色板：绘制前用 getComputedStyle(document.documentElement) 读令牌；无 document 时用内置 fallback 常量（只在 vm/极端情况下用）。

**S5 的对比度基线**

| 组合 | 对比度 | 用法 |
|---|---|---|
| ink / paper | 13.69 | 正文、标题 |
| ink / paper-hi | 15.02 | 对话框、面板 |
| cinnabar / paper | 5.10 | 16px 以上正文、印章旁注 |
| cinnabar / paper-hi | 5.59 | 姓名签、选项序号 |
| cinnabar / paper-lo | 4.43 | **不用**于文字 |
| cinnabar / night | 2.35 | **禁止**文字；只做装饰方块 |
| ember / paper | 2.38 | 只做装饰/≥24px 大字 |
| ember / night | 5.05 | 夜蓝上的计时数字 |
| ink-muted #5C564D / paper | 5.57 | 副题、注释 |
| paper / night | 12.01 | VN 章节名、夜底正文 |
| paper-hi / cinnabar | 5.59 | 印章文字 |

**S10 的组件范围**

- 只写样式与静态标记，不写打字机、不写选项状态机、不写计时、不读 story/codex/ending 数据。
- 组件类名统一 xb- 前缀；运行时旧类 menu-button / pause-button 可保留作兼容，但样式由 xb-btn 承担。
- 组件预览页可以用占位文案，但不得写新的史实结论、真实人物台词或具体牺牲人数。

---

## 5. 任务卡

### T2.0 文档先行：视觉令牌、组件、画布契约（35 min）

**目的**：把本步会写进 CSS/JS 的数字与规则先落到 docs，避免代码成为唯一规格。

**输入**：docs/style-guide.md、docs/quality-bar.md、docs/ui-layout.md、docs/credits.md、step/README.md 第 21–40 行。

**动作 1：新建 docs/visual-system.md**

必须包含以下八节，数字以本文件附录 A/B/C 为准：

1. 目的与边界：本文件管视觉令牌、组件壳、画布与构图；ui-layout 管坐标；state-schema 管存档；三者冲突时的顺序。
2. 色彩：五色、派生纸色（paper-hi/paper-lo）、ink-muted、夜底、底片、alpha、纸纹渐变；对比度表（含本文件 §4 S5 的 11 行）。
3. 字体：标题/正文/数字栈；local() 名称；font-display: swap；?fonts=fallback；无字体文件与步骤八欠账。
4. 字号/行高/字距/间距/边框/圆角/z-index/动效时长：全部具名令牌。
5. 组件：10 类的类名、尺寸、状态、允许的内容、禁止的行为；附状态矩阵。
6. 画布：单画布决定、art API、场景注册表、DPR 上限、绘制时机、失败兜底、种子规则。
7. 构图：标题/地图/于都河/于都夜的层与安全区；哪些区域不能压字；不画人物正脸。
8. 验收与性能：三档、44px、焦点、对比度、无外部素材、静态绘制、单帧预算；与 quality-bar 的对应关系。

**动作 2：修改 docs/ui-layout.md**

- 顶部第 4 行改为：视觉变量见 docs/visual-system.md §2；坐标仍以本文件为准。
- §1 增加一行：画布 #stage-art，0,0,1280,720，z0，程序化背景；章节名说明改为“纸白 + 墨色底片 + 朱砂 8×8 方块，不用朱砂小字压夜蓝”。
- §1 正文一行保留 26px/1.8，但加注：“现框高 66px 按单行设计；‘最多 3 行’与框高冲突，步骤三决定分页或增高，本步不改引擎。”不把冲突藏起来。
- §2 标题行改为：标题“向北” 120,132，96px，行高 96，字距 12；印章 360,150，56×56；副题 120,258；菜单 120,360；门板插画 760,120,360×480；版本 32,680。
- §3 字号表“游戏标题”改 96；章节 44 不变。
- §4 层级补：画布 0 → 场景 1 → 人物 10 → HUD 20 → 对话框 30 → 选项 40 → 弹窗 50 → 转场 60 → 暂停 80 → toast 90；焦点改为“2px 朱砂 + 2px 纸白内衬”，保证夜蓝上可见。
- 新增 §6“组件壳尺寸（步骤二，预览用；接入时以场景坐标为准）”：btn md 220×56 / sm 120×44；dialog 1160×118；choice 560×64；title-card 1280×720；codex-modal 900×560、codex-card 260×140；ending 760×480、ending-card 220×96；pause 280×300；settings 560×400；hud 1280×72；toast 640×auto。表里注明“这些是壳尺寸，不是步骤三/五的最终场景坐标”。

**动作 3：修改 docs/credits.md**

- 在字体表下加一段“步骤二状态”：本步不打包任何字体文件；只用 local() 读取系统已安装的 Smiley Sans/得意黑、LXGW WenKai/霞鹜文楷；缺失时回退 Songti SC/SimSun/serif 与 Microsoft YaHei/PingFang SC/sans-serif。
- 写明步骤八才做子集化与 LICENSE 随包；当前仓库无 assets/fonts/、无 .woff2/.ttf/.otf。
- 不把“OFL”写成“已打包”；授权核对仍以官方仓库 LICENSE 为准。

**产出**：三份文档修改。

**完成判据**：

- visual-system.md 八节齐全，含 11 行对比度表、10 类组件矩阵、四场景构图表、art API。
- ui-layout 标题坐标为 120,132/96px/印章 360,150；有 #stage-art 行与 §6 组件壳尺寸。
- credits 明确“无字体文件、步骤八再打包”。
- 没有改任何代码文件。

**常见坑**：

- 先写 CSS 再补文档，数字对不上。
- 把标题 96 只写进 CSS，不同步 ui-layout；步骤三按旧坐标接会错位。
- 在 visual-system 里复制一份地图 7 站坐标，造成第二坐标源；坐标只放 ui-layout。
- 把“正文最多 3 行”当成已实现；66px 框高只够一行，要留成步骤三的明确欠账。

---

### T2.1 设计令牌与纸墨基础层（45 min）

**目的**：让“纸、墨、朱砂、版画”先从变量与基础层成立；组件还没做全，但所有颜色/字体/层级已经有名字。

**输入**：docs/visual-system.md §2–§4、docs/ui-layout.md 新标题坐标、本文件附录 A。

**动作 1：style.css 顶部重建 :root**

必须包含（值见附录 A）：

- 五色：--paper、--ink、--cinnabar、--ember、--night。
- 派生：--paper-hi、--paper-lo、--ink-muted、--night-deep、--scrim、--overlay、--ink-a12/20/30/45、--paper-a72、--shadow。
- 纸纹：--paper-texture（两层 repeating-linear-gradient + 一层极淡径向光，不用图片、不用 data URI、不用 http）。
- 字体：--font-title、--font-body、--font-num。
- 字号/行高/字距：--fs-title 96、--fs-subtitle 20、--fs-chapter 44、--fs-h2 28、--fs-body 26、--fs-choice 22、--fs-name 18、--fs-note 18、--fs-small 14；--lh-title 1、--lh-body 1.8、--lh-choice 1.45、--lh-note 1.7；--ls-title 12px、--ls-chapter 8px、--ls-button 4px。
- 间距：--space-1 4、--space-2 8、--space-3 12、--space-4 16、--space-5 24、--space-6 32、--space-8 64。
- 边框/圆角：--border 1px、--border-strong 2px、--border-accent 4px、--radius 2px。
- 层级：--z-art 0、--z-scene 1、--z-figure 10、--z-hud 20、--z-dialogue 30、--z-choice 40、--z-modal 50、--z-transition 60、--z-pause 80、--z-toast 90、--z-debug 95、--z-orientation 100。
- 动效：--dur-fast 120ms、--dur-med 240ms、--dur-slow 480ms、--ease-out、--ease-in。
- 焦点：--focus-w 2px、--focus-offset 2px、--focus-color、--focus-gap。
- 舞台：--stage-w 1280、--stage-h 720、--scale 1。

**动作 2：@font-face 只用 local()**

    @font-face {
      font-family: "Smiley Sans";
      src: local("Smiley Sans"), local("得意黑");
      font-display: swap;
    }
    @font-face {
      font-family: "LXGW WenKai";
      src: local("LXGW WenKai"), local("霞鹜文楷");
      font-display: swap;
    }

- 不写 url()；不引用 assets/fonts；不下载字体。
- --font-title："Smiley Sans","得意黑","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif。
- --font-body："LXGW WenKai","霞鹜文楷","Songti SC","SimSun","Noto Serif CJK SC",serif。
- html.fonts-fallback 覆盖两条变量为回退栈；只用于 ?fonts=fallback 与预览页对照。

**动作 3：基础层与纸纹**

- #stage：background-color var(--paper)；background-image var(--paper-texture)；color var(--ink)；font-family var(--font-body)；保留原 1280×720/负 margin/scale。
- #stage[data-scene="vn"]：background: var(--night)（画布失败时的兜底；画布可见时被画布覆盖）。
- #stage::after：inset 8px、1px 墨色 20% 内框、pointer-events:none，做出纸边；不遮文字。
- .scene：z-index var(--z-scene)；背景透明。
- 按钮基类 .xb-btn：min-width 44、min-height 56（sm 44）、padding 0 20、1px 墨边、纸白高光底、墨字、字距 4；斜切只用伪元素切一个装饰角，不用 clip-path 裁焦点框。
- 焦点：outline 2px 朱砂 + outline-offset 2px + box-shadow 0 0 0 2px 纸白；夜蓝上至少纸白内衬可见；不靠颜色单独表达。
- 禁用：[aria-disabled="true"] 边框改虚线、opacity 0.55；仍可点击（步骤一语义），不改成 pointer-events:none。
- 纸纹只做静态背景；不加动画，不加每帧噪声。
- 保留 [hidden]{display:none !important} 与 prefers-reduced-motion 段；新增组件动画必须在 reduce 下关闭。

**产出**：style.css 顶部与基础层，约 160–220 行。

**完成判据**：

- :root 外没有新增 hex/rgb/rgba；旧 .vn-bg 渐变、menu-button 的 rgba 边框已改为 var() 或删除。
- 标题/菜单/地图/VN 仍按旧坐标可打开；标题仍 72px（T2.3 才改 96），先证明令牌没破坏布局。
- 三档打开无 console error；纸纹不遮字。
- C10 尚未加入；手工 grep 检查 :root 外的颜色值为 0。

**常见坑**：

- 把纸纹写成 data URI 的 SVG，里面带 http://www.w3.org 与 #，C04/C10 误报；本计划明确用 CSS 渐变。
- 用 background 简写把 background-color 重置掉。
- 把 96px 提前写进 CSS，文档还没改，T2.3 又改一次。
- 焦点环用朱砂单色，夜蓝上看不见；必须纸白内衬。
- 把 @font-face 写成 url(./assets/fonts/...)，本机 404。

---

### T2.2 art.js：程序化版画与四场景（95 min）

**目的**：用一张画布画出标题、地图、于都河、于都夜四个静态背景；画得克制、可复现、可 resize。

**输入**：docs/visual-system.md §6–§7、docs/ui-layout.md 标题/地图/VN 坐标、本文件附录 C。

**动作 1：API 与文件形态**

    (function (XB) {
      "use strict";
      XB.art = {
        SCENES: ["title", "map", "yudu_river", "yudu_night"],
        mount: mount,
        paint: paint,
        resize: resize,
        rng: rng
      };
    })(window.XB = window.XB || {});

- SCENES 必须含 title、map、yudu_river、yudu_night；顺序固定。
- mount(canvas)：只记录 canvas，不绘制；可重复调用时替换引用。
- paint(canvas, sceneId)：先 clear，再按场景绘制；成功返回 true；未知 sceneId 返回 false，并画纸白兜底。
- resize(displayScale)：只处理已 mount 的 canvas；计算 renderScale；设内部像素；重设 transform；重绘 canvas.dataset.scene 或 title。
- rng(seed)：纯函数，返回 0–1 的伪随机函数；同 seed 同序列；不读 DOM。
- 顶层不访问 document/window.getComputedStyle；这些只在 paint/resize 内调用，保证 vm 可加载。

**动作 2：画布尺寸**

    var renderScale = Math.min(2, Math.max(1, displayScale * (window.devicePixelRatio || 1)));
    canvas.width = Math.round(1280 * renderScale);
    canvas.height = Math.round(720 * renderScale);
    var sx = canvas.width / 1280;
    var sy = canvas.height / 720;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);

- 所有绘制坐标用 1280×720；不按 canvas.width 改坐标。
- clear 用 identity transform 清全幅，再设回设计 transform。
- DPR 上限 2；不因 4K/Retina 无限放大。

**动作 3：调色与种子**

- palette 从 :root 读 --paper/--ink/--cinnabar/--ember/--night/--paper-hi/--paper-lo/--night-deep；读不到用内置常量兜底。
- 透明度用 ctx.globalAlpha，不拼 rgba 字符串。
- 种子固定为场景 id 字符串；hash 用 FNV-1a，随机用 mulberry32；同场景两次绘制路径一致。
- 纹理不每帧生成；本步纸纹由 CSS 负责，canvas 不重复画纸纹；如需雾/雪，最多 3 层、每层固定点数。

**动作 4：四个场景的构图**

严格按附录 C 的坐标与层序；要点：

- title：透明纸底（不填纸色），4 层山形（基线约 660，峰 430–580，墨 alpha 0.12/0.2/0.3/0.45），左侧芦苇，右侧门板 760,120,360×480，轻微 rotate 1.5°，竖向木纹、9 道身高刻痕、两处铰链、一道裂缝、向右下投影；不画人物、不写字。
- map：透明纸底，6 条淡等高线（ink alpha 0.06），右下 3 层低山；左下 64,660 的提示区留干净；不画站点、不画路线（SVG 保留）。
- yudu_river：夜蓝渐变填满；远岸剪影在 420–470；浮桥横板 470–520；江面白线 520–720；雾带 300–500；8 个火把橙点；顶部加 scrim 保证章节名可读；不画人脸。
- yudu_night：近黑夜空，少量星点（paper alpha 0.5，最多 24 个），屋脊 500–620，树影，右侧 930,520 一扇 16×20 暖窗；不画人物。
- 所有文字安全区：title 左 0–340 / y 0–620 不被高对比图案压住；map 左下提示区不被山形压住；VN 底部 560–720 被对话框覆盖，背景可深。

**动作 5：失败与兜底**

- paint 遇到未知 sceneId：clear 后填 --paper，console.warn 一次，返回 false；engine 负责 toast。
- canvas 或 ctx 缺失：返回 false，不 throw 到白屏。
- 不在 art.js 里写 toast/DOM 文本；错误提示归 engine。

**产出**：project/art.js，约 260–360 行。

**完成判据**：

- 四个场景都能在浏览器中画出；标题/地图/于都河/于都夜各一张截图。
- 同场景连续 paint 两次，像素/路径一致（可用 rng 序列断言）。
- 1920 下 canvas.width=1920（DPR1）；844×390 下至少 1280；DPR 上限 2 生效。
- paint 单场景 <16ms（目标；T2.8 实测；超过就减层/减点）。
- check-build C11 通过；engine 尚未接入时 C07 仍红，属预期，T2.5 处理。

**常见坑**：

- 在顶层调用 getComputedStyle，vm 无 document 直接崩。
- 用 canvas.width 当 1280 画，resize 后坐标全错。
- 每帧 new 随机/每帧画 5000 个点，低端机掉帧。
- 把标题门板画成写实木门或贴图；只用线条/色块/刻痕。
- 让山形压住标题/菜单/地图提示；按安全区避让。
- 在 art.js 里写史实文字或人物姓名；画布只画环境。

---

### T2.3 标题画面：96px、印章、门板（50 min）

**目的**：把首 5 分钟的门面做成立：标题、印章、门板、山形、菜单四态；不改任何剧情行为。

**输入**：T2.1 令牌、T2.2 art.js、docs/ui-layout.md 新 §2。

**动作 1：index.html**

- 在 #stage 的第一个子元素位置加：

    <canvas id="stage-art" class="stage-art" width="1280" height="720" aria-hidden="true"></canvas>

- 标题区：
  - h1.title-main 保留“向北”。
  - h1 后加 span.title-seal aria-hidden="true"，文字“北”。
  - 删掉 .title-board 占位 div；门板由 stage-art 画。
  - 菜单三个 button 保留 data-action 与 role=menuitem，加类：开始 xb-btn xb-btn--primary；继续/史实图鉴 xb-btn xb-btn--ghost；保留 menu-button 类作兼容。
  - 版本行改为“试玩版 · 人物虚构，非史料人物”。
- 不新增设置按钮；设置组件只在预览库，运行时入口步骤三接（S11）。
- 不改地图/VN/暂停结构（T2.5 只把 vn-bg 替换进 stage-art 的引用）。

**动作 2：style.css 标题段**

- .title-main：left 120、top 132、margin 0、font-family var(--font-title)、font-size var(--fs-title) 96、line-height 1、letter-spacing 12、font-weight 700、color var(--ink)。
- .title-seal：left 360、top 150、width/height 56、display grid/place-items center、background var(--cinnabar)、color var(--paper-hi)、font-family var(--font-title)、font-size 32、line-height 1、transform rotate(-3deg)、box-shadow 6px 6px 0 var(--ink-a12)、aria-hidden 由 HTML 负责；不接收点击。
- .title-sub：left 120、top 258、font-size 20、letter-spacing 2、color var(--ink-muted)。
- .title-menu：left 120、top 360、width 220。
- .xb-btn 的 md 高 56；三项 + 10px 间距 = 188；菜单底 548，不碰版本行 680。
- 菜单状态：primary 墨底纸字；ghost 纸底墨字；hover 仅在 @media (hover:hover) 下变纸白高光/轻微上移 1px；active 回 0；focus-visible 双环；aria-disabled 虚线 + opacity .55，仍可点提示。
- 删 .title-board 规则；不要留下占位虚线。
- 标题不使用 text-shadow；不加入场动画（步骤六）。

**动作 3：视觉检查**

- 96px 回退字体（微软雅黑）下，标题宽度约 204–216；印章 360 起，间隙 ≥16。
- 标题底 228，副题 258，间隙 30；不重叠。
- 门板 760 起，与标题/菜单不重叠；门板阴影不越过 1280。
- 版本行 680 在纸白区；山形基线 660，不在版本文字下压深色。
- 菜单底 548 与门板底 600 不冲突；三项均可点，最小 44。

**产出**：index.html 标题区、style.css 标题/菜单段、art.js 标题场景。

**完成判据**：

- 1920/1366/844×390 标题实拍：标题、印章、副题、菜单、版本均在舞台内，无滚动条、无裁切。
- 菜单三态可读：默认、disabled（继续无档）、focus（Tab）；hover 只在有鼠标时增强。
- 标题在无得意黑/有得意黑两种情况下都不溢出（本机多半是回退，按回退验收）。
- Console 0 error；没有 .title-board 虚线残留。

**常见坑**：

- 只改 CSS 不改 ui-layout，步骤三按旧 150/72 接。
- 96px + 12 字距让标题宽于印章，印章压字；用实测 boundingBox，不靠目测。
- 印章用朱砂底纸白字，但纸白字太小；32px 起。
- 菜单背景透明，山形透过按钮影响阅读；按钮必须有纸白高光底。
- 给标题加入场动画，步骤六又要重做；本步不加。

---

### T2.4 十类组件壳与预览页（85 min）

**目的**：给步骤三/五/六一套可复用的静态壳；先看全状态，再接行为。

**输入**：docs/visual-system.md §5、ui-layout §6、本文件附录 B。

**动作 1：style.css 组件段**

按附录 B 写 10 类，类名统一 xb- 前缀。每类至少包含：

- xb-btn：primary/ghost/danger、md/sm、default/hover/active/focus-visible/disabled；斜切装饰角不裁焦点；danger 用朱砂边/字在纸白上（5.10）。
- xb-panel / xb-dialog：纸白高光底 + 纸纹、1px 墨边、上沿 4px 朱砂、4px 4px 0 墨影；对话框含姓名签、正文、继续提示；正文 26/1.8。
- xb-choice：560×64；左侧序号方块 40；文案 22；代价行 14；底部 4px 计时条；selected/disabled/timeout 状态；不写计时逻辑。
- xb-title-card：1280×720 夜蓝底、44px 章节名、18px 副题、朱砂小印、细横线；淡入 240ms，reduce 下关闭。
- xb-codex：900×560 弹窗；史实/回忆录/文学三种徽章（徽章用底色+墨字，不用彩字）；出处行 16；有不同说法提示；内容区滚动；关闭 44×44；附 7 卡网格（260×140，3+3+1，锁定斜线/解锁印章）。
- xb-ending：760×480；五卡 3+2（220×96，间距 16）；点名列表可滚动；数字用 14–18；不做评分。
- xb-pause：280×300 遮罩面板；继续/设置/回标题三行；按钮 44+；不接焦点陷阱。
- xb-settings：560×400；开关（44 热区）、滑杆（44 高）、分段控件（44）；标签 18；不接持久化。
- xb-hud：1280×72；章节/计时/火种三项；无血条、无分数、无排行榜。
- xb-feedback：toast 640×auto、badge 72×28、seal 56、rule 1px；toast 用纸白/墨底两种，角色仍由运行时 role=status 提供。

所有组件只做壳；selected/timeout 等状态用类名，不写 JS 状态机。

**动作 2：project/tools/ui-preview.html**

- 独立开发页，不是 index.html；head 只引 ../style.css；末尾引 ./ui-preview.js。
- 页面为 1280 宽的组件目录（#preview-sheet），每类一个 section，根元素带 data-ui：
  - btn、dialog、choice、title-card、codex、ending、pause、settings、hud、feedback（共 10 个唯一值）。
- 每个 section 展示该类主要状态；disabled 用 disabled 属性或 aria-disabled；focus 用真实 Tab 检查，不写假的 .is-focus 样式。
- 文案只用占位：“史实注（占位）”“点名 — 人”“全连 — 人”；不写具体数字/真实人物/牺牲人数。
- 字体回退对照：同一段标题/正文放两份，一份 .font-fallback 包裹，截图对比；不引外部字体。
- 顶部工具条：1280/1366/1920/844×390 四个按钮；只改 --preview-scale，不改组件尺寸。
- 页面不引图片、音频、字体文件、CDN；不用内联事件。

**动作 3：project/tools/ui-preview.js**

- 只做预览页缩放：按按钮设置 #preview-sheet 的 --preview-scale；窗口 resize 时按视口宽度自适应（最大 1，最小 0.542）。
- 不复制 engine 状态机，不读 localStorage，不引 story.js。
- 代码 <80 行；无 innerHTML；只用 textContent/classList/style。

**产出**：style.css 组件段、ui-preview.html、ui-preview.js。

**完成判据**：

- 预览页 file:// 可开；10 个 data-ui 各 1 个；无外部请求；Console 0 error。
- 每类的主要状态可见：btn 三型/disabled；choice 选中/禁用/超时；codex 三徽章/7 卡锁定；ending 五卡 3+2；settings 开关/滑杆/分段；hud 无分数。
- 三档预览不横向溢出；844×390 下可滚动阅读，按钮仍 44 舞台像素。
- Tab 能走到按钮/关闭/选项；焦点环在纸白与夜蓝上都可见。
- 组件壳没有引用 story/codex/ending 数据。

**常见坑**：

- 把组件样式写成只服务预览，运行时类名对不上；用同一套 xb-*。
- 只做默认态；disabled/focus 到步骤三才发现不可用。
- 用朱砂小字放在夜蓝上；徽章用底色+墨字。
- 用真实史实数字当占位；预览只写“—”。
- 预览页引 ../style.css 后又复制一份颜色；C12 会查外部引用，但不会查重复色，靠 C10 约束 style.css。

---

### T2.5 场景换皮与引擎接入（60 min）

**目的**：让 engine 用一张 stage-art 画四个背景；标题/地图/VN 都能看到版画，画布失败不白屏。

**输入**：T2.1 CSS、T2.2 art.js、T2.3 index 标题、T2.4 组件类、engine.js 现有 render/resize。

**动作 1：engine.js**

- REQUIRED_IDS 把 vn-bg 换成 stage-art；cacheElements 自动得到 els.stageArt。
- init()：cacheElements 后先 mountArt()，再 resize()；顺序不能反。
- 新增 artWarned、artResizeFrame 两个模块变量。
- mountArt()：尝试 XB.art.mount(els.stageArt)；失败 console.error + 一次性 toast“插画加载失败” + 隐藏画布。
- paintStage(sceneId)：
  - 先 els.stageArt.hidden=false；
  - 调 XB.art.paint(els.stageArt, sceneId)；
  - 返回 false 或抛错：console.error、隐藏画布、一次性 toast；不吞异常。
- resize()：保留原 --scale 计算；设完变量后 scheduleArtResize(scale)，用一次 requestAnimationFrame 合并；不引入循环。
- scheduleArtResize / resizeArt：调 XB.art.resize(scale)；同样 try/catch + 可见提示；不反复 toast。
- renderTitle()：在设置继续按钮前后都可，调用 paintStage("title")；不改变 resumeNode 语义。
- renderMap()：buildStations 后 paintStage("map")；不改变站点数据。
- renderVn()：取 bg = backgroundAt(...)；设置 els.stageArt.dataset.bg = bg；paintStage(bg || "yudu_night")；不再引用 els.vnBg。
- 用 dataset 防重复：如果 stageArt.dataset.scene === sceneId 且 bg 未变，可跳过 paint；但 resize 后必须重绘（由 resizeArt 负责）。
- init 的 params 读取后：if (params.get("fonts") === "fallback") document.documentElement.classList.add("fonts-fallback")；不写存档。
- updateDebug：有 stageArt 时加 canvas=宽×高，便于验证 DPR。
- 不改 go/render 状态、不改 saveNow/serialize、不改键盘/pointer、不改 pause 语义。

**动作 2：style.css 场景层**

- .stage-art：absolute inset 0；width/height 1280/720；display block；z-index var(--z-art)；pointer-events none；image-rendering auto。
- .scene：z-index var(--z-scene)。
- #stage[data-scene="vn"]：background var(--night)；标题/地图保持纸白纸纹。
- 删 .vn-bg 全部规则（含 data-bg 渐变）；不再有 div#vn-bg。
- .vn-chapter：color var(--paper)、background var(--scrim)、padding 4px 10px、font-size 16、letter-spacing 2；::before 8×8 朱砂方块；不再朱砂字压夜蓝。
- .vn-pause：color var(--paper)、border-color var(--paper-a72)、background var(--scrim)、48×48。
- .vn-dialogue：background-color var(--paper-hi)、background-image var(--paper-texture)、border 1px var(--ink)、border-top 4px var(--cinnabar)、box-shadow var(--shadow)；保留坐标。
- .vn-name：纸白高光底、墨边、朱砂字（5.59），18 粗体。
- 其他 VN 坐标/字号不动；正文仍 26/1.8。

**动作 3：同步 check-build（只改边界）**

- C03：必需 id 用 stage-art 替换 vn-bg；保留脚本顺序。
- C07：改成“art.js 必须有 SCENES/mount/paint/resize/rng；engine 可以引用 XB.art；minigames.js 仍为空壳且 engine 不引用 XB.minigames”。
- 此刻不新增 C10–C12（T2.7 做）；C03/C07 必须先绿，避免后续集成一直红。

**动作 4：手工验证**

- 打开 file:// 标题：看到门板/山形/印章；开始→地图：看到地图版画；于都：p001 河面，点到 p006 夜；暂停/返回正常。
- 改窗口大小：画布内部尺寸变化，不糊、不越界；Console 无 error。
- 临时把 stage-art 的 id 改坏：应 toast“插画加载失败”，页面仍有纸白/夜蓝底色，不白屏；改回。

**产出**：engine.js 接入、style.css 场景层、check-build C03/C07。

**完成判据**：

- 标题/地图/于都河/于都夜四个背景在运行时可见。
- p001 与 p006 背景不同；章节名在夜蓝上可读。
- 画布在 1920 下内部宽 1920（DPR1），1366 下 1366，844 下至少 1280。
- 画布失败兜底实测一次；无空 catch；Console 只有预期的 console.error + toast，不白屏。
- 存档、刷新、暂停、键盘推进与步骤一一致。

**常见坑**：

- init 先 resize 后 mount，art.resize 没 canvas，首屏空白。
- 忘记删 els.vnBg，运行时报 undefined；用 grep 搜 vnBg/vn-bg。
- 每次 renderVn（每句）都重画；用 dataset 防重复。
- 画布 z-index 高于文字，盖住标题/菜单；z0 + 场景 z1。
- 画布失败时只 console.error，页面还在等旧背景；必须隐藏 + 底色兜底。
- check-build C07 仍禁止 XB.art，集成后一直红。

---

### T2.6 字体回退与授权记录（25 min）

**目的**：证明没有得意黑/霞鹜文楷时，标题与正文仍可读、不溢出；把“步骤八才打包字体”写清楚。

**输入**：T2.1 local() 规则、T2.3 标题、T2.4 预览页。

**动作**：

- 浏览器 Console 运行：
  - document.fonts.check('16px "Smiley Sans"')
  - document.fonts.check('16px "LXGW WenKai"')
  - 记录 true/false；同时记录 document.fonts.status。
- 打开 project/index.html?fonts=fallback：html 加 fonts-fallback，标题/菜单/VN 正文全部走回退栈；截 1920 标题、844 标题、VN 正文各一张。
- 预览页的字体回退对照区截图；确认标题 96px 回退字体不压印章、不超 340 宽；正文 26px 三行内不溢出对话框（现框高只保证一行，按实际句子测）。
- 在 docs/credits.md 记录“本机是否装字体、实际回退到哪一族”；不写“已打包”。
- 如果系统有得意黑/霞鹜文楷：两种都截；如果没有：只截回退，验收按回退；不得用网络字体替代。

**完成判据**：

- ?fonts=fallback 下标题/副题/菜单/对话可读，无裁切；标题印章不压字。
- 有/无本地字体两种情况都有记录（没有就写“未安装”）。
- 无字体文件、无网络请求；credits 与事实一致。
- 回退下标题仍成立（不要求与得意黑完全一致）。

**常见坑**：

- 用 document.fonts.check 返回 true 就断言“得意黑已加载”；它可能只表示某族可用，必须看 computed font-family/截图。
- 用 CDN 字体救场；禁止。
- 回退字体下标题溢出仍写通过；用 boundingBox。
- 把 local() 字体文件复制进仓库；本步禁止。

---

### T2.7 静态检查与无头冒烟（45 min）

**目的**：让视觉系统能被机器判死：令牌不散落、art 契约在、预览页不引外部、story bg 与 art 场景一致。

**输入**：T2.1–T2.6 产物、check-build.js、smoke.js。

**动作 1：check-build 新增/修改**

| 编号 | 检查 | 失败示例 |
|---|---|---|
| C03 | 必需 id 含 stage-art，不含 vn-bg；脚本顺序不变；stage-art 在 scene-title 之前 | 漏 stage-art / 仍找 vn-bg |
| C07 | art.js 有 SCENES/mount/paint/resize/rng；engine 可引用 XB.art；minigames 仍空壳；engine 不引用 XB.minigames | art.js 仍空对象 / engine 提前接小游戏 |
| C08 | docs/visual-system.md 存在；ui-layout 含 96px 标题与 #stage-art；credits 含“步骤二”字体状态 | 跳过 T2.0 |
| C10 | CSS 的 :root 外无 hex/rgb/rgba/hsl；必需令牌齐全 | 组件里写 #A8322D |
| C11 | art.SCENES 含 title/map + story 全部 bg；story bg 是 SCENES 子集 | story 写 yudu_snow，art 没画 |
| C12 | 预览页存在；10 个 data-ui 唯一标记；引 ../style.css；无 http/img/audio/字体文件；@font-face 无 url() | 预览页引 CDN 字体 |

- C10 实现建议：去注释；逐字符跟踪花括号与声明值状态；只在“冒号后到分号/右花括号”的值里找颜色，不把 #stage 选择器误判；:root 块内放行；统计 :root 外的 hex/rgb/rgba/hsl，任何一处即失败。必需令牌至少含 --paper/--ink/--cinnabar/--ember/--night/--paper-hi/--font-title/--font-body/--fs-title/--fs-body/--z-art/--focus-color/--paper-texture。
- C11 实现：vm 里 stub window，按序执行 art.js、story.js；读 XB.art.SCENES；遍历 story chapters[].nodes[].bg，收集非空值；做子集判断；不调用 paint。
- C12 实现：读 ui-preview.html 原文，正则/字符串统计 data-ui 的 10 个唯一值；检查 ../style.css；检查无 http://、https://、<img、<audio、<video；检查 style.css 的 @font-face 块无 url(；检查 project/assets/fonts 无 .woff2/.ttf/.otf（本步应无目录）。
- C05 预算不放宽：JS gzip ≤150KB、CSS gzip ≤30KB；若超，先删组件重复规则，不删令牌。

**动作 2：smoke 新增**

| 编号 | 断言 |
|---|---|
| S15 | XB.art 存在；SCENES 是数组；mount/paint/resize/rng 都是函数 |
| S16 | rng("title") 连续 5 次与 rng("title") 另一次完全相同；rng("title") 与 rng("map") 序列不同 |
| S17 | SCENES 含 title/map/yudu_river/yudu_night，且长度 ≥4 |

- 不调用 paint（vm 无 canvas）；不引入 jsdom。

**动作 3：负例**

- 在 style.css 的 .xb-btn 里临时写 color:#A8322D，C10 应红；恢复。
- 把 art.SCENES 的 yudu_night 删掉，C11 应红；恢复。
- 把预览页一个 data-ui 改名，C12 应红；恢复。
- 把 index.html 的 stage-art 改成 vn-bg，C03 应红；恢复。
- 每次负例后复跑全绿；输出抄进 §11.2。

**动作 4：运行**

- 本机 shell 不可用时，用 run_code 的 import(pathToFileURL(...)) 或 vm 执行三个脚本；输出原样抄录；不得只写“通过”。
- 命令：node project/tools/check-build.js；node project/tools/smoke.js；node project/tools/check-script.js docs/script。

**完成判据**：

- check-build 12 项全绿；smoke 17 项全绿；check-script 仍绿。
- 四个负例都能红，恢复后复绿。
- C10 没有把选择器 #stage 误报；C12 没有把 ../style.css 误判外部。
- 输出贴进 §11.2。

**常见坑**：

- C10 用全局正则，把 #stage/#toast 选择器当 hex；必须只扫声明值。
- C11 在 vm 里没给 window，story.js 挂不上 XB。
- C12 把 ../style.css 当外部；只禁止 http(s) 与 img/audio，不禁止相对父路径。
- 负例改完忘记恢复，后面全红。
- 为了让 C10 过，把颜色挪到 JS/内联 style；组件仍会散落，禁止。

---

### T2.8 浏览器实测与留证（55 min）

**目的**：出口三条只能用浏览器证明；没跑过不写“视觉完成”。

**矩阵**：

| # | 环境 | 操作 | 期望 | 证据 |
|---|---|---|---|---|
| B1 | Edge file:// 1920×1080 | 打开标题 | 标题/印章/门板/菜单不出界；无滚动条 | 1920-title.png |
| B2 | Edge file:// 1366×768 | 打开标题 | 缩放 1.067；标题不压印章 | 1366-title.png |
| B3 | Edge file:// 844×390 触摸模拟 | 打开标题→开始→地图 | 缩放 0.542；菜单/站点可点；无横向滚动 | 844-title/map.png |
| B4 | Edge file:// 390×844 竖屏 | 打开 | 只显示“请把手机横过来” | 390-portrait.png |
| B5 | Edge file:// 1280×720 | 开始→地图 | 7 站可见、路线不被插画遮、提示可读 | 1280-map.png |
| B6 | Edge file:// 1280×720 | 点于都→p001 | yudu_river 河面/浮桥可见；章节名纸白可读 | 1280-vn-river.png |
| B7 | Edge file:// 1280×720 | 点到 p006 | yudu_night 屋脊/暖窗可见；对话框不发灰 | 1280-vn-night.png |
| B8 | Edge file:// 1280×720 | 暂停/继续/返回 | 暂停面板可读；继续回原句；Console 无错 | 1280-pause.png |
| B9 | Edge http://127.0.0.1:8123 | 同 B1/B6 | 与 file:// 一致；无 404 | http 截图 |
| B10 | Edge file:// | ?fonts=fallback 打开标题 | 回退字体可读；印章不压字；无溢出 | fallback-title.png |
| B11 | Edge file:// | 打开 tools/ui-preview.html | 10 类可见；Tab 焦点；无外部请求 | preview-1920.png |
| B12 | Edge 1920/1366/844 | 预览页四档缩放 | 不横向溢出；组件不裁切 | preview 三张 |
| B13 | Edge file:// | Tab/Enter/Space/Esc/触摸 | 菜单/暂停/站点可键盘与触摸操作；焦点环可见 | 记录 |
| B14 | Edge file:// | ?debug=1 看 canvas 尺寸 | 1920 下 1920×1080；1366 下 1366×768；844 下 ≥1280 | debug 截图/文本 |

- 每档记录浏览器版本、系统缩放、窗口尺寸；手机模拟开 touch。
- Console 收集 error/pageerror/requestfailed/≥400；0 error、0 404 才算过。
- 证据放 docs/evidence/step-02/（gitignored），§11.3 写文件名与结论。
- 性能：在 Console 里对 XB.art.paint 包 performance.now 各画一次；目标 <16ms/场景；超过就减层/减点并记录。不要用“看起来不卡”代替测时。
- 减少动效：emulateMedia reducedMotion=reduce 打开标题/暂停；不应有持续动画；画布本来就是静态。
- 浏览器范围：本机只有 Edge 就只报 Edge；Chrome/Safari/真机触摸/隐私模式写明“留步骤七”，不得写成通过。

**完成判据**：

- B1–B14 全过，或某一项明确标 D 并写原因；不能有空项。
- 三档标题、地图、两张 VN 背景、预览页、字体回退都有截图或记录。
- Console 0 error、0 404；画布尺寸与 DPR 符合。
- 性能目标记录；若超 16ms，记录优化前后。

**常见坑**：

- 只测 1920 就写“三档通过”。
- 只截标题，不截地图/VN 两张背景。
- 字体回退截图其实是本机装了字体的效果；用 ?fonts=fallback 强制。
- 844×390 下用鼠标点，没开 touch；触摸事件没验。
- 刷新后画布空白，但截图截在 resize 前；等一帧再截。
- 把 Chrome DevTools 设备模拟当“真机”；报告里写清楚是模拟。

---

### T2.9 复核、状态同步、提交（15 min）

**动作**：

1. 重跑 check-build / smoke / check-script，输出贴 §11.2。
2. 回填 §11.1 状态、§11.3 证据、§11.5 偏差；没有就写“无”。
3. 更新 .claude/CLAUDE.md：
   - 步骤表「二 视觉系统」改 ✅，出口列写：标题 + 10 类组件；三档不出界；字体回退可用；tag step-2-done。
   - 当前进度：步骤二完成日期；已有资产加 docs/visual-system.md、ui-preview、stage-art；下一步步骤三。
   - 已知欠账：字体文件未打包（步骤八）；Chrome/Safari/真机（步骤七）；正文 66px 只保证单行（步骤三）。
4. 提交：git add project docs step .claude → commit“feat: 视觉系统（步骤二）”→ tag step-2-done。
5. 本机 shell 不可用时，按步骤一 §11.6 的方式用 run_code + Git 可执行文件；仍不可用则手工对象法，记录 hash，真 shell 恢复后补 git fsck/status。
6. 不部署、不打包 ZIP、不发视频。

**完成判据**：tag 存在；CLAUDE.md 步骤表与当前进度一致；§11 无空项；工作区无未跟踪临时文件。

**常见坑**：

- 把 docs/evidence 截图提交；.gitignore 已忽略，别 git add -f。
- 提前把步骤三标 🚧。
- tag 打在错误 commit；tag 后回填文档需前移 tag，保持 tag 指向 HEAD。
- 把“组件壳完成”写成“步骤三可玩”。

---

## 6. 时间盒

| 任务 | 标准 | 压缩 | 压缩版取舍 |
|---|---|---|---|
| T2.0 文档 | 35 | 20 | visual-system 只写令牌/对比度/组件/画布四节；ui-layout 只改标题与 stage-art |
| T2.1 令牌 | 45 | 30 | 令牌 + 基础层 + local 字体；组件通用态暂不全 |
| T2.2 版画 | 95 | 55 | 四场景都画；山形 3 层、火把 6 个、屋脊简化 |
| T2.3 标题 | 50 | 30 | 96px/印章/门板/菜单；hover 微调省掉，focus 必须 |
| T2.4 组件 | 85 | 45 | 10 个标记都在；只做默认/禁用/选中，不铺满所有变体 |
| T2.5 接入 | 60 | 35 | stage-art + paint + resize；失败兜底必须 |
| T2.6 字体 | 25 | 15 | 只截 ?fonts=fallback 标题与 VN 正文 |
| T2.7 工具 | 45 | 20 | C03/C07/C10/C11/C12 + S15–S17；负例各一条 |
| T2.8 实测 | 55 | 30 | 1920/1366/844 + file:// + 两张 VN + 预览 + 回退；http 可标 D |
| T2.9 复核 | 15 | 10 | 记录从简，tag 必打 |
| **合计** | **510** | **290** | 约 4h50，允许 +10% |

压缩版仍必须满足出口三条；被砍的检查在 §11.5 记为欠账，步骤三开工前补。

---

## 7. 验收清单

| # | 验收项 | 判据 | 证据 | 结果 |
|---|---|---|---|---|
| E1 | 出口·标题画面 | 标题/印章/门板/山形/菜单成立；三档不出界 | B1–B3 | ☐ |
| E2 | 出口·组件库 | 10 类组件壳与主要状态可见；无外部素材 | B11/B12、C12 | ☐ |
| E3 | 出口·三档不出界 | 1920/1366/844×390 无滚动条、无裁切 | B1–B3 | ☐ |
| E4 | 出口·字体回退 | ?fonts=fallback 下标题/正文可读，不压印章 | B10、T2.6 | ☐ |
| E5 | 地图换皮 | 7 站可点；路线不被插画遮；提示可读 | B5 | ☐ |
| E6 | VN 两背景 | p001 河、p006 夜；章节名纸白可读 | B6/B7 | ☐ |
| E7 | 对比度 | 正文/纸 13.69；朱砂/纸 ≥5.10；夜蓝无朱砂小字 | §4 S5、截图/计算 | ☐ |
| E8 | 44px/焦点/键盘 | 按钮≥44；Tab 焦点可见；Enter/Space/Esc/触摸有效 | B13 | ☐ |
| E9 | 无外部素材 | 无图片/音频/外部字体/CDN；C09/C12 通过 | C09/C12 | ☐ |
| E10 | 性能 | 静态绘制；DPR≤2；单场景 paint <16ms；无每帧噪声 | B14、T2.8 计时 | ☐ |
| E11 | file:// + http | 两种打开方式一致；Console 0 error/0 404 | B1–B9 | ☐ |
| E12 | 检查与提交 | check-build 12 绿、smoke 17 绿；tag step-2-done | §11.2/§11.6 | ☐ |

**不算通过的情形**：只测 1920；只截标题不截地图/VN；字体回退没强制；组件只在 CSS 里写了类名但预览页没有；C10 靠把颜色挪到别处过；画布糊但“看着还行”；Console 有 404 但页面能开；把 Edge 结果写成三浏览器通过。

---

## 8. 风险与返工触发

| 风险 | 触发信号 | 处置 | 回退点 |
|---|---|---|---|
| 本机无得意黑/霞鹜文楷 | 标题落到雅黑，字形不如预期 | 按回退验收；标题设计不依赖单一字体；步骤八打包 | S2、T2.6 |
| 96px 标题压印章/副题 | boundingBox 重叠 | 降到 88px 并同改 ui-layout；不偷偷只改 CSS | S6 |
| 单画布盖住文字 | 标题/菜单看不见 | 画布 z0、场景 z1；检查 #stage-art 位置 | S1、T2.5 |
| resize 后画布糊/空白 | Canvas 内部尺寸不变或截图早于 rAF | 在 rAF 后重绘；B14 看 canvas 尺寸；截图等一帧 | S8、T2.5 |
| 纸纹压字/对比度下降 | 朱砂字在纹理上发灰 | 面板用 paper-hi；纸纹 alpha ≤0.03；朱砂小字只在干净面板 | S4/S5 |
| C10 误报 | #stage 选择器被当 hex | 只扫声明值；负例验证 | T2.7 |
| C07/C03 半改 | 画布已加、engine 还找 vn-bg | T2.5 同一次改 index/engine/check-build；grep vn-bg | T2.5 |
| 组件与运行时两套类名 | 预览好看、运行时对不上 | 统一 xb-*；C12 只验静态，人工比对 | S3/S10 |
| 画布内存过高 | 1920 下卡顿/崩溃 | 单画布；DPR 上限 2；不缓存多张全屏 | S1/S8 |
| 标题加动画/粒子蔓延 | 开始做淡入/雾动 | 停手；记步骤六 | §9 |
| 字体文件被顺手打包 | 仓库出现 .woff2 | 删除；记步骤八；C12 会红 | S2 |

**返工阈值**：出口三条任一不过，本步不算完成；返工只改本步文件，不顺手改剧本/小游戏/存档。若需改 schema 或 story，先改 docs 并说明，不在视觉步里做。

---

## 9. 禁区（本步不要做）

- 不做打字机、逐字动画、自动播放、跳过已读（步骤三）。
- 不做选项 UI 的状态机、限时计时、旗标结算（步骤三）。
- 不做门板/弃物/渡船/攀索，不写 RULES，不碰 minigames.js（步骤四）。
- 不做图鉴正文、7 张史实注内容、结局数据、点名名单（步骤三/五）。
- 不做音频、口琴动机、AudioContext、闪白/震动（步骤六）。
- 不做标题入场动画、纸纹粒子、雾动画、转场系统（步骤六）。
- 不打包字体、不下载字体、不引 CDN；不把未授权字体/图片/音频放进仓库。
- 不新增运行时 JS（core.js/helpers.js/scenes.js/art2.js 都不行）；预览页 JS 只能放 tools。
- 不做部署、不发视频、不打包 ZIP；不把截图/大文件提交。
- 不为了“更好看”改剧情正文、真实人物、牺牲数字；不画人物正脸。
- 不做多结局、战斗、养成、排行榜、登录、后端；不引入框架/构建链。

---

## 10. 交接接口（下游从本步拿什么）

| 下游 | 拿什么 | 位置 | 备注 |
|---|---|---|---|
| 步骤三 VN 引擎 | 10 类组件壳、令牌、stage-art、paint/resize、字体回退 | style.css、art.js、engine.js、visual-system §5 | 只接行为；不改标题 96/印章坐标；打字机/选项/标题卡在步骤三 |
| 步骤四 小游戏 | 画布 DPR 规则、单画布模式、颜色/纸纹令牌 | art.js、style.css、visual-system §6 | 小游戏用自己的 canvas；不共 stage-art 当游戏画布 |
| 步骤五 章节接入 | codex/ending 壳、7 卡网格、五卡 3+2、点名/数字占位 | style.css 组件段、ui-layout §6 | 只填 docs/codex 与 story-bible 数据；不新增颜色/字体 |
| 步骤六 音频与动效 | 静态 art API、四场景、纸纹/印章 | art.js、style.css | 加转场/粒子时保留 paint 签名；不每帧重绘整张背景 |
| 步骤七 测试 | 三档矩阵、字体回退、对比度表、C10–C12/S15–S17 | 本文件 §7/§11、tools | 扩成 T01–T20；Chrome/Safari/真机补齐 |
| 步骤八 打包 | local() 规则、credits 欠账、预览页/工具边界 | style.css、docs/credits.md | 子集化后把 local() 换成 url(./assets/fonts/...)，附 LICENSE；更新 C12 |

**给步骤三的三条硬约束**：

1. 不改标题 96px/印章 360,150/菜单 120,360；要改先改 ui-layout。
2. 不把组件壳重写成第二套类名；在 xb-* 上接行为。
3. 不把 stage-art 改成每个场景一张画布；需要交叉淡入时加第二缓冲，不破坏单画布默认路径。

---

## 11. 复核记录（执行时填写，不要留空）

> 复核日期：2026-11-01。执行人：DSH（DeepSeek Harness 编码代理）。证据目录：docs/evidence/step-02/（gitignored，含 run-log.json / run-log.md / B1–B14 截图）。

### 11.1 T2.0–T2.9 逐项状态

| 卡 | 判据 | 证据 | 结论 |
|---|---|---|---|
| T2.0 | 三份文档落地，代码未动 | 新建 docs/visual-system.md（7854 字符 / 168 行 / 8 节：色彩+11 行对比度、字体、令牌、10 类组件、单画布契约、构图安全区、验收）；ui-layout.md §1 加 #stage-art 行、§2 标题 96px/印章/门板、§4 层级令牌图、新增 §6 组件壳尺寸表；credits.md §1.1 步骤二状态 | ✅ |
| T2.1 | 令牌齐全；:root 外无颜色值 | style.css 1274 行；:root 含五色 + 14 个派生值 + 全字号/行高/字距/间距/边框/z-index/动效/舞台令牌 + --paper-texture；C10 静态证明 :root 外 0 处 #hex/rgba/hsl（仅 4 条负例曾红、已恢复） | ✅ |
| T2.2 | 四场景可画；种子可复现；DPR 正确 | art.js 519 行：SCENES 四场景，rng 用 FNV-1a → mulberry32（S16 同种子同序列）；backingScale = clamp(显示缩放 × DPR, 1, 2)，实测 1.5 / 1.07 / 1.08 三档；paint 失败返回 false 由 engine 降级 | ✅ |
| T2.3 | 标题 96/印章/门板；三档不出界 | index.html 加 span.title-seal「北」；标题 120,132 96px 字距 12；门板 Canvas 760,120,360×480 带 9 道刻痕与两铰链；B1/B2/B3/B14 三档 fits | ✅ |
| T2.4 | 10 类组件；预览页无外部 | tools/ui-preview.html + ui-preview.js：10 个 data-ui 唯一（btn/dialog/choice/title-card/codex/ending/pause/settings/hud/feedback）；只引 ../style.css，无外部资源、无 img/audio/video、@font-face 仅 local()（C12） | ✅ |
| T2.5 | 四背景接入；失败兜底；存档不变 | engine.js 830 行：REQUIRED_IDS 改 stage-art，init→cacheElements→mountArt→bindInput→resize；renderTitle/renderMap/renderVn 调 paintStage；失败隐藏画布 + 一次性 toast「插画加载失败」；SAVE_KEY 与 schema 未动（smoke S01–S14 全绿） | ✅ |
| T2.6 | 回退可读；无字体文件 | @font-face 只 local()；?fonts=fallback 实测 html.fonts-fallback=true，标题落 Microsoft YaHei……、正文落 Songti SC/SimSun……；project/assets/fonts 无字体文件（C12）；本机未装得意黑/霞鹜文楷，默认链实际已走回退（见 11.5） | ✅ |
| T2.7 | C10–C12/S15–S17 全绿 + 负例 | check-build 12/12、smoke 17/17、check-script OK；四条负例逐一变红并恢复（详见 11.2） | ✅ |
| T2.8 | B1–B14 有证据或标 D | Edge headless 跑完 14 项，0 error；截图 + run-log.json/md 落 docs/evidence/step-02/；Chrome/Safari/真机/隐私模式标 D 留步骤七 | ✅ |
| T2.9 | tag 与状态同步 | 本文件 §11 + .claude/CLAUDE.md 步骤表与当前进度已更新；提交并打 tag step-2-done（hash 见 11.6 与后续记录） | ✅ |

### 11.2 机械检查（原样粘贴输出）

    $ node project/tools/check-build.js
    C01 OK 4 个 JS 可编译
    C02 OK 无 fetch / XHR / ESM / eval / innerHTML / document.write
    C03 OK 必需 id 齐全、画布在场景前、脚本顺序 art → story → minigames → engine
    C04 OK 全部资源相对路径，无 CDN
    C05 OK JS gzip 15KB / CSS gzip 5KB
    C06 OK story.js 无禁用词与真实人物
    C07 OK art.js 五项契约就位、engine 已接入、minigames 仍占位
    C08 OK 四份文档已同步（state-schema / ui-layout §1.5+§6 / visual-system / credits）
    C09 OK 无音频/图片文件引用
    C10 OK 令牌集中在 :root，组件只写 var()
    C11 OK SCENES = title / map / yudu_river / yudu_night
    C12 OK 预览页 10 类组件唯一、只引 ../style.css、字体只用 local()
    OK：构建自检 12 项全绿

    $ node project/tools/smoke.js
    S01 OK defaults 形状与持久字段
    S02 OK 合法存档 normalize 通过
    S03 OK version-too-new
    S04 OK scene=vn 但节点不存在
    S05 OK locate 下标与未知节点
    S06 OK startChapter 重建栈
    S07 OK 20 句推进到 end 后不再前进
    S08 OK serialize → JSON → normalize 往返
    S09 OK 七章元数据
    S10 OK 序章节点 id 唯一、类型合法
    S11 OK 背景指令落在 p001 / p006
    S12 OK 20 句与剧本源逐字一致
    S13 OK 台词长度与红线
    S14 OK 存档体积与字段
    S15 OK art.js 契约：SCENES 与四个方法
    S16 OK rng 同种子同序列、异种子不同
    S17 OK SCENES 覆盖四场景，story 背景全部命中
    OK：纯状态层烟测 17 项全绿

    $ node project/tools/check-script.js docs/script
    OK：7 个剧本文件；禁用词 0；真实人物 0；选项缺项 0；结构完整；声明已标注

执行方式说明：本机 pwsh 与一切子进程创建仍失败（0xC0000142），因此三个脚本都在 run_code 进程内以 createRequire + 临时替换 process.stdout.write 的方式执行，输出与命令行等价；check-script 用临时 process.argv[2] = "docs/script" 传入目录。

负例记录（每条都是「改坏 → 跑 → 看到红 → 还原 → 复绿」）：

    1) 组件里写 color: #A8322D → C10 红（组件写死颜色，应走 var()）；恢复后绿
    2) 删 art.js 的 yudu_night 场景 → C11 红 2 条（SCENES 缺场景 + story 的 p006 bg 不在 SCENES）；恢复后绿
    3) 预览页 data-ui="feedback" 改成 "feedback-x" → C12 红 2 条（缺 feedback + 数量不符）；恢复后绿
    4) index.html 的 stage-art 改回 vn-bg → C03 红 2 条（缺 #stage-art + 画布不在场景之前）；恢复后绿

### 11.3 浏览器证据

浏览器：Edge headless（Playwright core 1.64.1，executablePath 指本机 msedge）。站点：本地 http（根目录 project/）+ file:// 对照。页面控制台 0 error。

| # | 环境/版本 | 操作 | 结果 | 文件 |
|---|---|---|---|---|
| B1 | 1920×1080 | 1920 标题 | canvas 1920×1080，renderScale 1.5，舞台 0,0,1920,1080，fits | B1-1920x1080-title.png |
| B2 | 1366×768 | 1366 标题 | canvas 1365×768（1280×min(1.067,1.067) 取整），renderScale 1.07，舞台右缘 1365.6 ≤ 1366，fits | B2-1366x768-title.png |
| B3 | 844×390 @2 touch | 844×390 触摸：点开始 | 前后都 fits（舞台 75.3,0,693.3,390）；scene title→map；首次 innerWidth 报 1062，改用 clientWidth 才拿到 844 | B3-844x390-title.png / B3-844x390-map.png |
| B4 | 390×844 @3 竖屏 | 390×844 竖屏 | #orientation display=flex、文案「请把手机横过来」、#stage display=none | B4-390x844-portrait.png |
| B5 | 1280×720 | 1280 地图 | 7 站：01 于都「可走」，02 湘江 / 03 遵义 / 04 金沙江 / 05 泸定 / 06 草地 / 07 吴起「未接上」 | B5-1280-map.png |
| B6 | 1280×720 | p001 河 | canvas scene=yudu_river；「1934年10月17日，于都河上起雾。」 | B6-1280-river-p001.png |
| B7 | 1280×720 | p006 夜 | Space×5 后 canvas scene=yudu_night；「我家的门，是村里最后一扇整门。」 | B7-1280-night-p006.png |
| B8 | 1280×720 | 暂停 | 面板 hidden=false，按钮 resume / pause-map / pause-title；Esc 关闭 true | B8-1280-pause.png |
| B9 | 1280×720 | http 与 file:// | 两层 toDataURL 采样完全一致（len 163310，hash 72555347）；file:// 下 localStorage 探针 ok（Edge 允许） | B9-file-protocol.png |
| B10 | 1280×720 | 字体回退 | html.fonts-fallback=true；标题 → Microsoft YaHei/PingFang SC/Noto Sans CJK SC；正文 → Songti SC/SimSun/Noto Serif CJK SC | B10-1280-fonts-fallback.png |
| B11 | 1440×900 | 预览页 | data-ui 10 个且唯一：btn/dialog/choice/title-card/codex/ending/pause/settings/hud/feedback；0 error | B11-ui-preview-full.png |
| B12 | 1440×900 | 预览三档 | transform 1 / 1.067 / 1.5 / 0.659；frame 宽 1280 / 1366 / 1920 / 844；整页高 5542 / 5913 / 8313 / 3652 | B12-ui-preview-scale-1.5.png |
| B13 | 1280×720 | 键盘/触摸 | Tab 顺序 start→continue→codex→BODY；Enter 进地图；点站进 VN；Space 推进；Esc 开暂停 | B13-1280-keyboard.png |
| B14 | 三档 + 运行中改窗口 | canvas 尺寸 | canvas 1920×1080 / 1365×768 / 1387×780，?debug=1 行与画布一致；844→1366→1920 动态改窗口三档 fits 且 debug 同步 | B14-1920-debug.png |

### 11.4 三读（视觉版）

| 读法 | 范围 | 要找什么 | 结果 |
|---|---|---|---|
| 自读 diff | style.css/index/engine/art | 颜色是否散落、画布是否盖字、旧 vn-bg 残留 | 颜色只在 :root（C10 静态证明，组件里 4 次负例全红）；画布 z-index 0、场景 z-index 1、pointer-events:none，不接点击也不盖字；index.html 与 engine 中 vn-bg 已无残留（C03 校验 #stage-art 且必须在 #scene-title 之前） |
| 对抗读 | 844×390 / 回退字体 / 夜蓝 | 是否裁切、是否看不清、焦点是否可见 | 844×390 舞台 693.3×390 居中不裁切（首轮曾出界，改 clientWidth 后修复）；回退字体下标题 216×96、正文 SimSun 可读（B10 截图）；朱砂小字不再上夜蓝，章节名改纸白 + --scrim 底片 + 8×8 朱砂块；键盘焦点为 2px 朱砂外环 + 2px 纸白内衬（B13 截图可见） |
| 性能读 | 四场景 / resize | paint 时间、canvas 尺寸、是否每帧重绘 | paint 绘制调用 headless 10 次平均：title 0.14ms / map 0.04ms / yudu_river 0.18ms / yudu_night 0.06ms，远低于 16ms；canvas ≤1920×1080（DPR 上限 2）；无 rAF 常驻循环，仅 resize 时经 rAF 合并重绘一次（动态改窗口实测三档正确） |

### 11.5 偏差与欠账

| 项 | 计划 | 实际 | 处置 |
|---|---|---|---|
| 字体 | 本步不打包 | 已验证不打包、只用 local()；但本机 FontFace local() 探针显示「Smiley Sans / 得意黑 / LXGW WenKai / 霞鹜文楷」均 missing，实际显示落在 Microsoft YaHei / SimSun。即：回退路径可用，设计字体未生效 | 步骤八决定是否子集打包（两款均 OFL）或另选可商用字体；在此之前截图与视频都以回退字呈现 |
| 浏览器 | 三浏览器 | 只 Edge headless 跑完 B1–B14 | 步骤七补 Chrome / Safari 完整流程 |
| 真机触摸 | 真机 | Chromium 移动模拟（hasTouch + tap + DPR 2/3） | 步骤七补真机 |
| 隐私模式 | 步骤七 | 只测了 file:// 下 localStorage 可用（Edge 返回 ok），未测禁存储 | 步骤七 |
| 正文 3 行 | ui-layout 旧注 | 66px 只保证单行（26×1.8=46.8px），两行需 93.6px、与对话条 118 高冲突 | 步骤三决定分页或增高，本步不上调 |
| 1366 画布宽 | 1366 | 1365（1280×min(1.067,1.067)=1365.33 取整） | 记录即可；舞台右缘 1365.6 ≤ 1366，不出界 |
| 预览页 favicon | — | 初测控制台 1 条 404，补 data: favicon 后 0 error | 已修并复测 |
| debug 画布尺寸 | — | 初测 ?debug=1 打印上一帧尺寸（1920 档写 1280x720、844 档写 2560x1440） | 已修：updateDebug 移入 scheduleArtResize 的 rAF 回调 |
| 其他 | 本步只做壳 | 组件无打字机、无选项计时、无音频、无转场；小游戏仍占位 | 按步骤三 / 四 接入 |

### 11.6 提交

- 提交信息：feat: 视觉系统（步骤二）
- commit：提交后回填（本机 pwsh/git 子进程全挂 0xC0000142，用手工 git 对象法：blob/tree/commit + zlib 写进 .git/objects，再写 refs）
- tag：step-2-done（轻量 tag，指向记录哈希的第二条提交）
- 未入库：docs/evidence/、node_modules/、my-playwright-project/、screenshots/、*.zip、.tools/
- 执行方式：run_code 内 Node 直接读写 .git（不经过 git 可执行文件）；提交后用自校验脚本重算 tree/commit 哈希核对引用一致；真 shell 恢复后需跑一次 git fsck + git status 复核（同步骤一欠账）

---

## 附录 A　设计令牌表

### A.1 颜色与对比度

| 令牌 | 值 | 用途 | 备注 |
|---|---|---|---|
| --paper | #E8E1D0 | 舞台纸底 | 不直接承载朱砂小字时注意纸纹 |
| --paper-hi | #F1EBDD | 对话框/面板 | 朱砂 5.59 |
| --paper-lo | #DCD2BC | 锁定/次级底 | 朱砂 4.43，禁止朱砂文字 |
| --ink | #1A1714 | 正文/标题 | 纸 13.69 |
| --ink-muted | #5C564D | 副题/注释 | 纸 5.57 |
| --cinnabar | #A8322D | 印章/强调/序号 | 纸 5.10；夜 2.35 禁文字 |
| --ember | #D97A2B | 火把/计时数字 | 夜 5.05；纸 2.38 只装饰 |
| --night | #1B2430 | VN 夜底 | 纸 12.01 |
| --night-deep | #10161D | 夜空深处 | 不承载正文 |
| --scrim | rgba(16,22,29,.62) | 章节名底片 | 夜蓝上纸白字 |
| --overlay | rgba(16,22,29,.78) | 暂停遮罩 | 面板纸白高光 |
| --shadow | rgba(26,23,20,.18) | 面板投影 | 4px 4px 0 |
| --ink-a12 | rgba(26,23,20,.12) | 细边/阴影 | 装饰 |
| --ink-a20 | rgba(26,23,20,.20) | 纸边 | 装饰 |
| --ink-a30 | rgba(26,23,20,.30) | 路线/虚线 | 装饰 |
| --ink-a45 | rgba(26,23,20,.45) | 禁用/次要 | 不承载关键文字 |
| --paper-a72 | rgba(232,225,208,.72) | 夜底按钮边 | 装饰 |
| --focus-color | #A8322D | 焦点内环 | 夜底配 paper 内衬 |
| --focus-gap | #F1EBDD | 焦点内衬 | 保证夜底可见 |

### A.2 字体/字号

| 令牌 | 值 | 用途 |
|---|---|---|
| --font-title | "Smiley Sans","得意黑","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif | 标题/章节大标题 |
| --font-body | "LXGW WenKai","霞鹜文楷","Songti SC","SimSun","Noto Serif CJK SC",serif | 正文/UI |
| --font-num | "Consolas","SFMono-Regular",monospace | 计时/数字 |
| --fs-title | 96px | 标题 |
| --fs-subtitle | 20px | 副题 |
| --fs-chapter | 44px | 章节卡/地图标题 |
| --fs-body | 26px | 正文 |
| --fs-choice | 22px | 选项 |
| --fs-name | 18px | 姓名 |
| --fs-note | 18px | 注释/史实注 |
| --fs-small | 14px | 版本/最小字 |
| --lh-title | 1 | 标题 |
| --lh-body | 1.8 | 正文 |
| --lh-choice | 1.45 | 选项 |
| --ls-title | 12px | 标题 |
| --ls-chapter | 8px | 章节 |

### A.3 间距/层级/动效

| 令牌 | 值 |
|---|---|
| --space-1…8 | 4/8/12/16/24/32/64 |
| --border / --border-strong / --border-accent | 1/2/4px |
| --radius | 2px |
| --z-art / --z-scene | 0 / 1 |
| --z-figure / --z-hud / --z-dialogue | 10 / 20 / 30 |
| --z-choice / --z-modal / --z-transition | 40 / 50 / 60 |
| --z-pause / --z-toast / --z-orientation | 80 / 90 / 100 |
| --dur-fast / --dur-med / --dur-slow | 120 / 240 / 480ms |
| --ease-out / --ease-in | cubic-bezier(.2,.7,.3,1) / cubic-bezier(.4,0,1,1) |
| --focus-w / --focus-offset | 2px / 2px |

---

## 附录 B　10 类组件矩阵

| # | data-ui | 类名 | 尺寸 | 主要状态 | 运行时接入 |
|---|---|---|---|---|---|
| 1 | btn | xb-btn（--primary/--ghost/--danger、--sm） | 220×56 / 120×44 | default/hover/active/focus/disabled | 标题/暂停/步骤三选项外的按钮 |
| 2 | dialog | xb-dialog | 1160×118 | 旁白/有名/继续提示 | 步骤三 |
| 3 | choice | xb-choice | 560×64 | default/selected/disabled/timeout | 步骤三 |
| 4 | title-card | xb-title-card | 1280×720 | 进入/静止 | 步骤三 |
| 5 | codex | xb-modal + xb-codex + xb-codex-grid | 900×560；卡 260×140 | 史实/回忆录/文学；锁定/解锁；滚动 | 步骤五 |
| 6 | ending | xb-ending | 760×480；卡 220×96 | 五卡 3+2；点名/数字 | 步骤五 |
| 7 | pause | xb-pause | 280×300 | 打开/关闭 | 步骤三/六 |
| 8 | settings | xb-settings | 560×400 | 开关/滑杆/分段；44 热区 | 步骤六 |
| 9 | hud | xb-hud | 1280×72 | 章节/计时/火种 | 步骤四/五 |
| 10 | feedback | xb-toast/xb-badge/xb-seal/xb-rule | toast 640×auto；badge 72×28；seal 56 | 显示/隐藏；三徽章 | 全步骤 |

**通用**：组件只做壳；不在组件里读 XB.story/XB.core；状态用类名/属性，不写计时/打字机；所有按钮 ≥44；焦点双环；禁止 hover-only。

---

## 附录 C　四场景构图（1280×720）

### C.1 title

| 层 | 内容 | 坐标/范围 | 颜色/透明度 | 安全区 |
|---|---|---|---|---|
| 0 | 纸底 | 全屏 | 透明（stage 纸纹透出） | — |
| 1 | 远山 | 基线 660，峰 430–500 | ink .12 | 不压标题 |
| 2 | 中山 | 基线 670，峰 480–540 | ink .20 | 不压菜单 |
| 3 | 近山 | 基线 680，峰 520–580 | ink .30 | 不压版本 |
| 4 | 山脚 | 基线 660 | ink .45 | 版本 32,680 留白 |
| 5 | 芦苇 | x 380–560，y 560–700 | ink .45，18 根 | 不碰菜单 |
| 6 | 门板 | 760,120,360×480；rotate 1.5° | paper-hi + ink 边/纹 | 右侧 |
| 7 | 门板刻痕 | 左侧 24，9 道 y 160–440 | ink .45 | 不写字 |
| 8 | 门板投影 | 偏移 10,12 | ink .12 | 不出 1280 |

- 不画人物、不写字；标题/印章/副题/菜单由 DOM 负责。

### C.2 map

| 层 | 内容 | 范围 | 颜色/透明度 | 安全区 |
|---|---|---|---|---|
| 0 | 纸底 | 全屏 | 透明 | — |
| 1 | 等高线 | 6 条弧，x 200–1100，y 160–560 | ink .06 | 不压站点文字 |
| 2 | 远山 | 基线 720，峰 560–620，x 600–1280 | ink .10 | 左下提示留白 |
| 3 | 近山 | 基线 720，峰 620–670，x 760–1280 | ink .18 | 右下 |
| — | 路线/站点 | SVG + DOM | ink .30 / 纸白高光 | 画布不画 |

- 左下 64,660 提示区留干净；站点按钮用纸白高光底，保证文字对比。

### C.3 yudu_river

| 层 | 内容 | 范围 | 颜色/透明度 | 备注 |
|---|---|---|---|---|
| 0 | 夜空 | 全屏 | night→night-deep 渐变 | 不透明 |
| 1 | 远岸 | y 420–470 | ink .55 | 剪影 |
| 2 | 浮桥 | y 470–520，横板 | paper .18 / ink .5 | 不画人 |
| 3 | 江面白线 | y 520–720，18–24 条 | paper .12–.22 | 不压对话框 |
| 4 | 雾带 | y 300–500，3 条 | paper .04 | 轻 |
| 5 | 火把 | 8 点，x 180–1080 | ember .8 | 小点，不发光污染 |
| 6 | 顶部底片 | y 0–90 | night .55 | 章节名可读 |

### C.4 yudu_night

| 层 | 内容 | 范围 | 颜色/透明度 | 备注 |
|---|---|---|---|---|
| 0 | 夜空 | 全屏 | night-deep→night | 不透明 |
| 1 | 星点 | 最多 24 个，y 80–300 | paper .5 | 种子固定 |
| 2 | 屋脊 | y 500–620，x 0–900 | ink .65 | 剪影 |
| 3 | 树影 | x 980–1120，y 420–660 | ink .55 | 线条 |
| 4 | 暖窗 | 930,520,16×20 | ember .85 | 唯一暖色 |
| 5 | 顶部底片 | y 0–90 | night .55 | 章节名可读 |

---

## 附录 D　字体/预览/回退

### D.1 本地字体探测

- Console：document.fonts.check('16px "Smiley Sans"')、document.fonts.check('16px "LXGW WenKai"')；记录 true/false 与 document.fonts.status。
- 打开 ?fonts=fallback，确认 html.fonts-fallback 覆盖变量；截标题/VN。
- 预览页 .font-fallback 区并排对照；不引外部字体。

### D.2 本机实测记录（执行时填）

| 项 | 结果 |
|---|---|
| 系统/浏览器 | 待填 |
| Smiley Sans 可用 | 待填 |
| LXGW WenKai 可用 | 待填 |
| 实际标题字体 | 待填 |
| 实际正文字体 | 待填 |
| 回退截图 | 待填 |

### D.3 步骤八欠账

- 子集化标题用字与正文常用字；总字体 ≤300KB；woff2；font-display: swap。
- 把 local() 换成 url(./assets/fonts/...); C12 改为允许字体文件但必须有 LICENSE 与 credits 记录。
- 不把未授权字体打进 ZIP；不引 CDN。

---

## 附录 E　步骤二完成后的文件树（只列相关）

    project/
    ├─ index.html            （stage-art、标题印章、menu 组件类）
    ├─ style.css             （令牌、字体、标题、地图、VN、10 类组件）
    ├─ engine.js             （stage-art mount/paint/resize、?fonts=fallback）
    ├─ story.js              （未改）
    ├─ art.js                （四场景 + API）
    ├─ minigames.js          （未改，仍空壳）
    └─ tools/
       ├─ check-build.js     （C03/C07/C08 + C10/C11/C12）
       ├─ smoke.js           （S15–S17）
       ├─ ui-preview.html    （新，开发期）
       └─ ui-preview.js      （新，开发期）

    docs/visual-system.md    （新）
    docs/ui-layout.md        （标题 96/印章/stage-art/§6 壳尺寸）
    docs/credits.md          （local() 与步骤八欠账）
    step/step-02-视觉系统.md （本文件，回填 §11）

**不产生**：assets/fonts/、任何 .woff2/.ttf/.otf、图片、音频、ZIP。
