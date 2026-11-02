# 《向北》视觉系统（步骤二）

> 本文件是视觉的唯一规格：设计令牌、字体、组件壳、画布契约、构图与性能预算。
> 坐标只在 `docs/ui-layout.md`；存档只在 `docs/state-schema.md`；冲突时以「计划书 → .claude/CLAUDE.md → ui-layout/state-schema → 本文件」处理，不静默分叉。
> 状态：步骤二定稿（2026-11-01）；步骤六追加动效令牌与特效层（2026-11-02）。步骤三–八只在本文件上追加，不改令牌含义。

## 1. 目的与边界

- 管：五色与派生色、字体栈与回退、字号/间距/层级令牌、10 类组件壳、单画布 art API、四场景构图、对比度与性能预算。
- 不管：具体坐标（ui-layout）、存档字段（state-schema）、剧情文本（docs/script）、小游戏数值（minigame-tuning）、音频（步骤六）。
- 原则：**组件只写壳**。本文件描述的 selected/timeout/locked 都是类名与静态标记；打字机、计时、旗标结算属于步骤三，图鉴正文与结局数据属于步骤五，粒子/转场属于步骤六。
- 视觉母题：纸（纸白底 + 极淡纸纹）、墨（山形与剪影）、朱砂（印章与序号）、火（火把与暖窗）。版画只用线条与色块，不画人物正脸，不用图片素材。

## 2. 色彩

### 2.1 五色与派生

| 令牌 | 值 | 用途 | 备注 |
|---|---|---|---|
| `--paper` | `#E8E1D0` | 舞台纸底 | 承载纸纹；不直接压朱砂小字 |
| `--paper-hi` | `#F1EBDD` | 对话框、面板、按钮底 | 朱砂对比度 5.59 |
| `--paper-lo` | `#DCD2BC` | 锁定卡、次级底 | 朱砂对比度 4.43，禁止朱砂文字 |
| `--ink` | `#1A1714` | 正文、标题、边框 | 纸白上 13.69 |
| `--ink-muted` | `#5C564D` | 副题、注释、状态字 | 纸白上 5.57 |
| `--cinnabar` | `#A8322D` | 印章、序号、强调、上沿条 | 纸白 5.10；夜蓝 2.35 **禁止做文字** |
| `--ember` | `#D97A2B` | 火把、夜底计时数字 | 夜蓝 5.05；纸白 2.38 只做装饰 |
| `--night` | `#1B2430` | VN 夜底 | 纸白字 12.01 |
| `--night-deep` | `#10161D` | 夜空深处 | 不承载正文 |

派生色（只在本表定义，组件里一律 `var()`）：

| 令牌 | 值 | 用途 |
|---|---|---|
| `--scrim` | `rgba(16,22,29,.62)` | 章节名底片、夜底按钮底 |
| `--overlay` | `rgba(16,22,29,.78)` | 暂停遮罩 |
| `--shadow` | `rgba(26,23,20,.18)` | 面板 4px 4px 0 投影 |
| `--ink-a12` | `rgba(26,23,20,.12)` | 细边、印章投影 |
| `--ink-a20` | `rgba(26,23,20,.20)` | 纸边内框 |
| `--ink-a30` | `rgba(26,23,20,.30)` | 路线虚线、禁用边 |
| `--ink-a45` | `rgba(26,23,20,.45)` | 禁用文字、次级装饰 |
| `--paper-a72` | `rgba(232,225,208,.72)` | 夜底按钮边 |
| `--focus-color` / `--focus-gap` | `#A8322D` / `#F1EBDD` | 焦点内环 / 纸白内衬 |

纸纹 `--paper-texture`：两层 `repeating-linear-gradient` + 一层极淡径向光，alpha ≤0.03；不用图片、不用 data URI、不引用外部地址。

### 2.2 对比度基线（决定“什么颜色能写字”）

| 组合 | 对比度 | 用法 |
|---|---|---|
| ink / paper | 13.69 | 正文、标题 |
| ink / paper-hi | 15.02 | 对话框、面板正文 |
| cinnabar / paper | 5.10 | 16px 以上正文、印章旁注 |
| cinnabar / paper-hi | 5.59 | 姓名签、选项序号 |
| cinnabar / paper-lo | 4.43 | **不用**于文字 |
| cinnabar / night | 2.35 | **禁止**文字；只做装饰方块 |
| ember / paper | 2.38 | 只做装饰 / ≥24px 大字 |
| ember / night | 5.05 | 夜蓝上的计时数字 |
| ink-muted / paper | 5.57 | 副题、注释 |
| paper / night | 12.01 | VN 章节名、夜底正文 |
| paper-hi / cinnabar | 5.59 | 印章文字 |

**硬规则**：夜蓝上不出现朱砂小字；朱砂字只在 paper / paper-hi 上；ember 不做正文。

## 3. 字体

| 角色 | 令牌 | 栈 |
|---|---|---|
| 标题 | `--font-title` | "Smiley Sans","得意黑","Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif |
| 正文 | `--font-body` | "LXGW WenKai","霞鹜文楷","Songti SC","SimSun","Noto Serif CJK SC",serif |
| 数字 | `--font-num` | "Consolas","SFMono-Regular",monospace |

- `@font-face` 只用 `src: local(...)`，`font-display: swap`；**不写 url()**，不打包字体文件，不下载字体，不引 CDN。
- 本机缺少得意黑 / 霞鹜文楷时落到回退栈；验收按回退字体看，不按“装了字体才好看”。
- `html.fonts-fallback`（由 `?fonts=fallback` 触发）把两个字体变量覆盖为系统回退，用于对照与低配验收。
- 步骤八再做子集化 + `url(./assets/fonts/...)` + LICENSE；欠账记在 `docs/credits.md`。

## 4. 尺寸与层级令牌

| 组 | 令牌 |
|---|---|
| 字号 | `--fs-title` 96、`--fs-subtitle` 20、`--fs-chapter` 44、`--fs-h2` 28、`--fs-body` 26、`--fs-choice` 22、`--fs-name` 18、`--fs-note` 18、`--fs-small` 14 |
| 行高 | `--lh-title` 1、`--lh-body` 1.8、`--lh-choice` 1.45、`--lh-note` 1.7 |
| 字距 | `--ls-title` 12px、`--ls-chapter` 8px、`--ls-button` 4px |
| 间距 | `--space-1`…`--space-8` = 4/8/12/16/24/32/64 |
| 边框 | `--border` 1px、`--border-strong` 2px、`--border-accent` 4px、`--radius` 2px |
| 层级 | art 0 → scene 1 → figure 10 → hud 20 → dialogue 30 → choice 40 → modal 50 → transition 60 → pause 80 → toast 90 → debug 95 → orientation 100 |
| 动效 | `--dur-fast` 120ms、`--dur-med` 240ms、`--dur-slow` 480ms；`--dur-transition` 480ms、`--dur-flash` 120ms、`--dur-shake` 180ms、`--dur-strike` 420ms、`--strike-stagger` 90ms；`--ease-out`、`--ease-in` |
| 焦点 | `--focus-w` 2px、`--focus-offset` 2px、`--focus-color`、`--focus-gap` |
| 舞台 | `--stage-w` 1280、`--stage-h` 720、`--scale` 1（由引擎写入） |

- 组件规则里只允许 `var()`、`transparent`、`currentColor`、`inherit`；不允许 `#hex`、`rgb()`、`rgba()`、`hsl()`。机器检查 C10 兜底。
- 焦点环 = 2px 朱砂 + 2px 纸白内衬（`box-shadow`），保证夜蓝与纸白上都可见；不靠颜色单独表达。

## 5. 组件壳（10 类）

统一 `xb-` 前缀；旧类名 `menu-button` / `pause-button` 保留作兼容，样式由 `xb-btn` 承担。

| # | data-ui | 类名 | 尺寸 | 状态 | 运行时接入 |
|---|---|---|---|---|---|
| 1 | btn | `xb-btn`（`--primary`/`--ghost`/`--danger`、`--sm`） | md 220×56 / sm 120×44 | default / hover / active / focus-visible / disabled | 标题、暂停、步骤三按钮 |
| 2 | dialog | `xb-panel xb-dialog` | 1160×118 | 旁白 / 有名 / 继续提示 | 步骤三 |
| 3 | choice | `xb-choice` | 560×64 | default / selected / disabled / timeout | 步骤三 |
| 4 | title-card | `xb-title-card` | 1280×720 | 进入（240ms 淡入，`prefers-reduced-motion` 关闭）/ 静止 | 步骤三 |
| 5 | codex | `xb-modal xb-codex` + `xb-codex-grid` | 900×560；卡 260×140 | 史实 / 回忆录 / 文学；锁定 / 解锁；滚动 | 步骤五 |
| 6 | ending | `xb-ending` | 760×480；卡 220×96 | 五卡 3+2；点名列表滚动；数字 | 步骤五 |
| 7 | pause | `xb-pause` | 280×300 | 打开 / 关闭 | 步骤三、六 |
| 8 | settings | `xb-settings` | 560×400 | 开关 / 滑杆 / 分段；热区 44 | 步骤六 |
| 9 | hud | `xb-hud` | 1280×72 | 章节 / 计时 / 火种 | 步骤四、五 |
| 10 | feedback | `xb-toast` / `xb-badge` / `xb-seal` / `xb-rule` | toast 640×auto；badge 72×28；seal 56 | 显示 / 隐藏；三种徽章 | 全步骤 |

**状态矩阵（壳级）**

| 组件 | default | hover（仅 hover:hover） | focus-visible | disabled | 特殊 |
|---|---|---|---|---|---|
| btn | 纸白高光底 + 墨边 | 上移 1px + 纸白 | 双环 | 虚线边 + opacity .55，仍可点 | primary 墨底纸字；danger 朱砂边字 |
| choice | 纸白底 + 墨边 | 朱砂左边条 | 双环 | opacity .55 | `.is-selected` 朱砂左边条 + 序号反白；`.is-timeout` 虚线 + 计时条火橙 |
| dialog | 纸白高光 + 上沿朱砂 | — | — | — | `.xb-dialog--narration` 无姓名签 |
| title-card | 夜蓝满屏 | — | — | — | 240ms 淡入；reduce 关闭 |
| codex | 纸白高光弹窗 | — | 关闭按钮双环 | — | `.is-locked` 斜线；徽章底色 + 墨字 |
| ending | 夜蓝纸白？否：纸白面板 | — | — | — | 五卡 3+2；不做评分 |
| pause | 遮罩 + 纸白面板 | — | 双环 | — | 不接焦点陷阱 |
| settings | 纸白面板 | — | 双环 | — | 开关/滑杆/分段均为 44 热区 |
| hud | 墨色半透明条 | — | — | — | 无血条、无分数、无排行 |
| feedback | 墨底纸白 toast | — | — | — | 徽章不用彩字；seal 56 朱砂底纸白字 |

**禁止**：组件内读 `XB.story` / `XB.core`；写计时/打字机逻辑；hover-only 交互；把牺牲做成数字或进度条。

## 6. 画布（单张 stage-art）

- 只有一张全屏 `canvas#stage-art`（1280×720，`z-index: var(--z-art)`，`pointer-events: none`，`aria-hidden="true"`），标题 / 地图 / VN 共用；不新增第二张背景画布。
- API（`XB.art`）：`mount(canvas)`、`paint(canvas, sceneId)`、`resize(displayScale)`、`rng(seed)`，常量 `SCENES`。
- 场景注册表：`title`、`map`、`yudu_river`、`yudu_night`；`story.js` 的 `bg` 必须是其中子集（C11 校验）。
- 尺寸：`renderScale = clamp(舞台缩放 × devicePixelRatio, 1, 2)`；内部像素 = 1280×720 × renderScale；绘制坐标永远是 1280×720 设计坐标。
- 绘制时机：`init` mount → `resize` → 各场景 render 时 paint；resize 用一次 `requestAnimationFrame` 合并；本步**不做** rAF 动画循环。
- 失败兜底：`paint` 返回 false 或抛错 → engine `console.error` + 隐藏画布 + 一次性 toast「插画加载失败」，页面回落到 CSS 纸白/夜蓝底色，不白屏。
- 种子：场景 id 字符串 → FNV-1a → mulberry32；同场景两次绘制路径一致，便于对比与回归。
- 文字安全区：标题左 0–340 / y 0–620；地图左下 64,660 提示区；VN 底部 560–720 允许画深（被对话框覆盖）。

| 场景 | 底 | 层序 | 不画 |
|---|---|---|---|
| title | 透明（纸纹透出） | 远山 .12 → 中山 .20 → 近山 .30 → 山脚 .45（x 780–1280）→ 芦苇 → 门板 760,120,360×480 | 人物、文字 |
| map | 透明 | 6 条等高线 .06 → 远山 .10 → 近山 .18 | 站点、路线（SVG 保留） |
| yudu_river | night→night-deep 渐变 | 远岸 420–470 → 浮桥 470–520 → 江面白线 520–720 → 雾 300–500 → 8 火把 → 顶部底片 0–90 | 人脸 |
| yudu_night | night-deep→night 渐变 | 星点 ≤24 → 屋脊 500–620 → 树影 → 暖窗 930,520 → 顶部底片 | 人脸 |

## 7. 构图与安全区

- 标题：标题块 120–340 宽、y 0–620 不被高对比图案压住；门板在 760 起，不越过 1280；版本行 32,680 下方留白。
- 地图：站点 132×64 按钮自带纸白高光底；左下 64,660 提示区留干净；插画只压右下。
- VN：章节名 32,24 用纸白 + `--scrim` 底片 + 8×8 朱砂方块；对话框 60,560,1160×118 覆盖底部，背景可深。
- 不画人物正脸；不写任何文字进画布（印章「北」由 DOM 的 span 负责）。

## 8. 验收与性能

| 项 | 判据 | 方式 |
|---|---|---|
| 三档不出界 | 1920×1080 / 1366×768 / 844×390 无滚动条、无裁切 | B1–B3 截图 + boundingBox |
| 组件库 | 10 个 `data-ui` 可见、主要状态齐全、无外部素材 | B11/B12、C12 |
| 字体回退 | `?fonts=fallback` 下标题/正文可读、不压印章 | B10 |
| 对比度 | 按 §2.2；夜蓝无朱砂小字 | 计算 + 截图 |
| 44px / 焦点 | 可点元素 ≥44×44；Tab 焦点双环可见；Enter/Space/Esc/触摸有效 | B13 |
| 无外部素材 | 无图片/音频/外部字体/CDN；无字体文件 | C09/C12 |
| 单帧预算 | 单场景 paint <16ms（1280×720，DPR≤2） | T2.8 performance.now |
| 静态 | 无每帧噪声、无入场动画 | 代码审查 |
| 零错误 | Console 0 error、0 404 | B1–B14 |

与 `docs/quality-bar.md` 对应：可读性 → §2.2/§4；可操作性 → §4 焦点与 44px；性能 → 本节单帧预算；无外部素材 → §3 + C09/C12。

## 9. 特效层（步骤六追加）

> 动效只为“换场、危险、记住名字”服务；不做装饰性粒子、不做持续闪烁、不做屏幕抖动循环。

| 层 | 位置/尺寸 | 令牌 | 规则 |
|---|---|---|---|
| `#fx-layer` | `#stage` 内 0,0,1280×720；`#scene-ending` 后、`#pause` 前 | `--z-transition` 60 | 绝对定位、`inset:0`、`overflow:hidden`、`pointer-events:none`、`aria-hidden="true"`；不接收点击 |
| `.fx-wipe` | 层内满屏 | `--dur-transition` 480ms | 纸白（title/map）或夜蓝（vn/ending）渐变横擦；首载不播；1.2s 内以最后一次为准；不阻塞输入 |
| `.fx-flash` | 层内满屏 | `--dur-flash` 120ms、`--fx-flash-opacity` .12 | 泸定桥首次进入闪一次；间隔 ≥2000ms；reduced 不闪 |
| `#stage.is-shaking` | 舞台整体 | `--dur-shake` 180ms、`--fx-shake-distance` 2px | 攀索 `stats.lost>0` 时；keyframes 保留 `scale(var(--scale))`，不破坏等比缩放 |
| `.xb-ending__name-text::after` | 名字文字内 | `--dur-strike` 420ms、`--strike-stagger` 90ms | 2px 墨线 `scaleX(0→1)` 划名；只对 `li.is-missed`；正常延迟 500ms + 90ms/行 |

- 划名保留 `text-decoration: line-through` 作无动画回退；reduced 时墨线立即到 `scaleX(1)`，不依赖全局 `animation:none`。
- 系统 reduced 与 `html.reduce-motion` 双入口都关闭 wipe/flash/shake；不把“减少动效”做成只关 CSS 不关 JS 的半套。
- 特效层不新增背景画布；不改变 §6 的单画布契约。
