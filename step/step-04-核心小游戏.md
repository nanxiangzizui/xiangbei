# 步骤四执行卡 · 核心小游戏（4 关）

> **所属步骤**：步骤四 核心小游戏（对应《向北-项目计划书》执行步骤 6）。
> **状态源**：进度、步骤表与红线以 .claude/CLAUDE.md 为准；本文件只写“怎么做、做到什么算完成”，不另存进度。
> **当前状态**：步骤零、一、二、三 ✅（tag 分别为 step-0-done、step-1-done、step-2-done、step-3-done）；步骤四 ⬜ 未开始。本文件是步骤四的执行计划，执行前不应把步骤四改成 ✅。
> **本步骤出口（逐字引 CLAUDE.md）**：4 关可独立试玩（第 5 关探路/分粮可选）；每关 60–90 秒；失败只结算代价；触摸单手可玩。
> **时间盒**：标准 11 小时（660 分钟）；压缩 6 小时 11 分（371 分钟）。时间盒只含本步 T4.0–T4.10，不含步骤五章节接入。
> **不可逆动作**：本步没有。部署上线、覆盖线上版本、重置存档格式、公开发布视频都不在本步；提交与打 tag 是本地版本动作，执行前仍按项目规则确认。
> **证据级别**：A 浏览器实测（截图/录屏/控制台）；B 代码完成未跑；C 设计稿/口述；D 未验证。没有实际运行就写“未验证”，不把“写了”说成“能玩”。
> **基线时点**：本计划按 2026-11-01 步骤三完成后的工作区写成。执行前先核对第 1.3 节的体积、工具项数和 story 节点数；若代码已经变化，先改本计划再动手。

## 0 一页速览

### 0.1 本步到底做什么

把 p024 的“门板小游戏 · 步骤四接入”占位，升级成四个可独立试玩、也能接回序章的 Canvas 小游戏：

1. **一套共享引擎**：minigames.js 提供统一的生命周期、rAF 循环、暂停、DPR、指针换算、键盘、倒计时、结果契约和错误降级；四个游戏只实现 init / update / draw / onPointer / onKey / end，不各写一套计时器。
2. **门板**：75 秒内把门板、药、青稞、锅、雨布、布鞋装进 6 格行囊；门板固定占 2 格，花名册和铅笔随身不占格；时间到按当前选择结算，写 inventory.items 与 item.pot。
3. **弃物**：80 秒、两批、每批 3 件，把 6 件物资和可能存在的门板分批带上船；追兵 45 秒从第一次发船起算，每带 1 件重物提前 8 秒；写 choice.xiangjiang.abandoned 与 item.door，弃药箱 fire−15。
4. **渡船**：90 秒调度 6 条船，每船 8 人、每船 3 名船工；trust 决定船工数、可用船数和单程时间；疲劳、休息、追兵远景都要看得见；写 choice.jinsha.trips。
5. **攀索**：75 秒、3 段铁索、22 个光点；按节奏点中推进，点空熄一个光点；第 6/12/18 步触发火墙连点；写 lights_lost 与 fire，不点名、不显示害死谁。
6. **接回 VN**：p024 的 config 原样保留；结束后写既有旗标、推进到 p025；p025 的结果页按实际携带动态渲染，不再只认静态两栏；刷新后能按旗标重建结果。
7. **可验证**：?minigame=door|abandon|boat|climb 可单关试玩；check-build 从 17 项到 23 项；smoke 从 26 项到 33 项；Edge B19–B30 留证据。

### 0.2 任务总表

| 卡 | 任务 | 主要产出 | 完成判据 | 标准 min | 压缩 min |
|---|---|---|---|---:|---:|
| T4.0 | 先改文档与数值 | docs/minigame-system.md；tuning/schema/ui/test/quality/script 同步 | 四关规则、结果契约、旗标、坐标都有唯一出处；代码未动 | 40 | 25 |
| T4.1 | 共享限时分配引擎 | minigames.js 的 API、循环、输入、暂停、结果、降级 | 不启动具体关也能跑通 start/stop/resize；无第二套计时器 | 70 | 40 |
| T4.2 | 门板关 | 3×2 行囊、拖拽/点选、容量、倒计时、结果 | p024→p025 动态清单；带/不带门板两路径正确 | 75 | 42 |
| T4.3 | 弃物关 | 两批配额、重物惩罚、追兵、门板特殊卡 | 重物必弃才稳；item.door 与 abandoned 正确 | 80 | 45 |
| T4.4 | 渡船关 | 6 船、船工、疲劳、休息、班次、结果 | trust 0 只有 4 船；疲劳与休息可复现 | 85 | 48 |
| T4.5 | 攀索关 | 22 光点、命中窗、3 段、火墙连点、结果 | 失误熄灯不重开；lights_lost/fire 正确 | 75 | 42 |
| T4.6 | VN 接入、结果、调试 | engine 接入；p025 动态；?minigame 单关 | 四关都能从 VN 入口进出；刷新可重建 | 65 | 35 |
| T4.7 | DOM/CSS/可访问性 | 全屏覆盖层、HUD、帮助、live、焦点、96px 热区 | 三档不出界；手机横屏可单手完成 | 45 | 25 |
| T4.8 | 工具与测试 | check-build C18–C23；smoke S27–S33；负例 | 23/23、33/33；四个负例报红 | 45 | 25 |
| T4.9 | 浏览器实测 | Edge B19–B30；截图/run-log | A 级证据；Console 0 error | 55 | 31 |
| T4.10 | 复核与交班 | §11 回填；CLAUDE 步骤表；提交/tag | step-4-done；欠账写清 | 25 | 12 |
| **合计** |  |  |  | **660** | **371** |

### 0.3 本步完成定义（可逐条勾）

1. 四个单关入口都能从 ?minigame=door|abandon|boat|climb 进入、完成、看到结果，并从结果回到标题或再玩一次；四关各有 A 级截图。
2. 从序章 p021 选“带门板”进入 p024，门板关结束到 p025；p025 的“带走/留下”按实际结果变化，不显示成功/失败、不评分、不弹 Game Over，继续后剧情不断。
3. 四条失败路径都只改变代价：门板时间到少带、弃物追兵到少带/门板留江、渡船少渡船次、攀索熄灯；都不会重开本关，也不会改历史结局。
4. 暂停、切标签页、页面隐藏时计时冻结；恢复后不跳秒；p024 刷新重开本关，p025 刷新按旗标重建结果。
5. 1280×720、1366×768、844×390 手机横屏三档不出界；小游戏内可点目标逻辑尺寸至少 96×96，实际像素在 844×390 下至少 52×52；触摸可单手完成核心操作。
6. check-build 23/23、smoke 33/33、check-script 通过；四个负例能报红；Edge B19–B30 全部有结果（B25 疲劳 100 记例外）、Console 0 error；file:// 与本地 http 都可玩。
7. 明确记录：第 5 关探路/分粮、音频、完整七章、结局五卡、20 分钟全流程实测都不在本步完成。

### 0.4 先文档后代码

T4.0 必须先落盘，理由是：结果契约、旗标类型、疲劳数值、门板/弃物语义会同时影响 minigames.js、engine.js、story.js、check-build、smoke 和步骤五；如果先在代码里试，文档一定分叉。T4.0 只改文档，不改代码；完成后再进 T4.1。

## 1 起点盘点

### 1.1 已经有的

| 资产 | 现状 | 本步怎么用 |
|---|---|---|
| 舞台与场景 | 1280×720，#stage，title/map/vn，#stage-art 单画布 | 不改舞台比例；小游戏在 #scene-vn 内加全屏覆盖层 |
| VN 引擎 | engine.js 1779 行；扁平条件节点图；line/choice/minigame/result/title/codex/end 分派 | 只改 minigame 分派、result 渲染、输入守卫和 go 清理 |
| 序章数据 | p021 门板选择；p024 minigame door；p025 静态 result；p900 next=xiangjiang | p024 config 原样；p025 加 source/game，文本不动 |
| 组件库 | 10 类 xb-* 壳；--paper/--ink/--cinnabar/--ember/--night；--paper-texture | 小游戏颜色只读令牌；按钮/面板尽量复用 |
| 程序化美术 | art.js 四场景；#stage-art；DPR 上限 2 | 不改 art.js；小游戏自己画夜景/木纹/铁索，不新增图片 |
| 存档 | xiangbei.save.v1；11 个持久键；normalize 夹取；每 beat 保存 | 不升版本、不加键；只扩展白名单内的 list flag |
| 工具 | check-build 17 项；smoke 26 项；check-script；count-words | 扩到 23/33；同步改 C07/S25 等受影响项 |
| 文档 | minigame-tuning、state-schema、ui-layout、test-cases、quality-bar、script 七章 | T4.0 修改；数值必须同名 |
| 证据 | docs/evidence/step-03/run-log.md；仅 Edge headless | 本步继续只报 Edge；Chrome/Safari/真机留步骤七 |

### 1.2 当前的硬缺口

| 缺口 | 具体表现 | 影响 |
|---|---|---|
| p024 只是 seam | #vn-minigame 是 560×260 的“步骤四接入”面板 | 不能玩；T08–T12 不成立 |
| minigames.js 是空壳 | 只有 XB.minigames = {} | 没有 API、循环、输入、结果 |
| 没有结果契约 | p025 只有静态 lists；没有 carried/left/stats | 结果与选择脱节 |
| 没有 list flag | normalize 只收 boolean/string/number，数组会被丢弃 | choice.xiangjiang.abandoned 写不进 |
| lights_lost 语义冲突 | 遵义漏记与攀索都写 lights_lost | 终章数字会被两种含义污染 |
| 渡船数值不闭合 | 90 秒内按 +8/趟很难到 80 疲劳；船工数没有落到船 | 疲劳机制形同虚设 |
| 弃物语义反了 | “每留 1 件重物提前 8s”与“带重物拖慢”相反 | 玩家会做出相反决策 |
| 追兵 120s > 天亮 90s | 追兵永远追不上 | 不能当失败条件，只能做远景 |
| 输入会打架 | #scene-vn 的 pointerdown 会推进对话；canvas 不在 isControlFocused | 点小游戏会跳句 |
| 覆盖层层级不够 | #vn-minigame 原为 560×260；.vn-pause 无 z-index | 全屏游戏会盖住暂停/结果 |
| 手机热区不足 | 步骤三 B16：48 逻辑px 在 844×390 实际 26px | 小游戏不能沿用 48px 热区 |
| 单关试玩参数未接 | readParams 有 ?debug/?reset/?minigame 的入口，但无 solo 逻辑 | T08–T12 无法独立测 |

### 1.3 当前基线数字（写计划与验收时引用）

- story.js：48 个序章节点 = 41 line + 2 choice + 1 minigame（p024）+ 1 result（p025）+ 1 title + 1 codex + 1 end；version=2；只有序章 playable。
- 体积：index.html 8005 B；style.css 32717 B（gzip 6927）；engine.js 56077 B（gzip 15253）；story.js 15860 B（gzip 5605）；art.js 15763 B（gzip 5293）；minigames.js 179 B（空壳）。
- 工具：check-build 17 项；smoke 26 项；check-script 通过；四文件语法通过。
- 四关目标与上限：门板 45s / 75s；弃物 50s / 80s；渡船 60s / 90s；攀索 50s / 75s。目标合计 205s；结算面板按 20s/关，合计 80s；四关目标总 285s。
- 全文时长：19:44；余量 16s；上限情形 22:30。20 分钟是硬验收，步骤七实测；本步只保证四关不超 285s 目标、不把上限当目标。
- 预算：JS gzip ≤150 KB；CSS ≤30 KB；字体 ≤300 KB；0 外部图片/音频。本步不打包字体、不新增图片/音频。
- 时长口径：**“每关 60–90 秒”按“进入关卡→结算面板点继续”计，含结算阅读；45/50/60/50 是可玩段目标，75/80/90/75 是保险丝上限，不是要求玩家用满。** 首次正常试玩应在 60–90；熟练玩家低于 60 记为快路径，不判失败。

### 1.4 先修的文档矛盾（T4.0 必须落盘）

| # | 现状 | 决定 | 落到哪 |
|---|---|---|---|
| 1 | 弃物“每留 1 件重物提前 8s” | 改为“每带上 1 件重物，追兵提前 8s”；留下不罚，带走才拖慢 | docs/minigame-tuning.md；docs/script/01-xiangjiang.md |
| 2 | 渡船 fatigue +8/趟，90s 内难到 80 | 改为每腿 +12（调参范围 4–12）；补 crewPerBoat=3、plannedTrips=18 | tuning；script/03；state-schema 不涉 |
| 3 | 追兵 120s > 天亮 90s | 追兵只做远景小字，不驱动失败；天亮 90s 结束 | tuning；ui-layout |
| 4 | lights_lost 被遵义与攀索共用 | 遵义改 choice.zunyi.missed（0/1）；lights_lost 只归攀索，范围 0–22 | state-schema；script/02；story-bible §5 不动 |
| 5 | choice.xiangjiang.abandoned 是数组，代码不收 | 只对这一个路径开放 list flag，最大 7 个 id；不做通用数组 | state-schema；engine FLAG_LIST_KEYS |
| 6 | 每关 60–90 与目标 45/50/60/50 看似冲突 | 按 1.3 的“含结算”口径；目标+20s=65/70/80/70 | tuning；本文件 §7 E3 |

**规则**：以上六条没有进 docs 之前，不写进 minigames.js。代码里不得出现 docs 里没有同名数字的“新创意”。

## 2 不变量（做任何任务卡都不能破）

### 2.1 叙事与史实

1. 不改七段结构；不新增分支结局；不出现 Game Over；失败只改变代价。
2. 不虚构真实领导人台词；小游戏里不出现真实人物姓名；22 位勇士不点名、不做个人对应、不做血腥特写。
3. “三百斤的箱子”只写重量，不点名 X 光机；内部 id 可用 xray，UI 文案不得出现“X 光机”。
4. 牺牲不做分数：不出现 score、rank、星级、完美通关、成功/失败大字；结果只写“带走/留下/已渡/暗了”。
5. 敌人不脸谱化：弃物关只有远处火光与追兵计时，不画敌人脸、不做击杀。
6. 不把《七根火柴》《金色的鱼钩》等文学当史料；本步不新增史实断言。

### 2.2 结构与存档

1. 存档键仍是 xiangbei.save.v1；不升 SAVE_VERSION；不新增持久键；PERSIST_KEYS 仍 11 个。
2. 场景仍只用 title/map/vn；小游戏是 VN 内的覆盖层，不改 state.scene。
3. 不保存小游戏中间态；p024 刷新重开本关；p025 刷新按旗标重建结果。
4. 只写 state-schema 白名单内的旗标；inventory.items 只放合法 id；item.door 继续镜像 inventory.door。
5. 每关结束、结果推进、设置变更、结局保存；保存失败只提示一次，不白屏。
6. 不把 success、score、elapsed、carried、left 写进 flags；这些只存在于运行时结果对象。

### 2.3 表现与交互

1. 1280×720 设计坐标；不新增第二张舞台背景画布；#stage-art 仍是唯一背景画布；小游戏画布是内容层，结束隐藏。
2. 颜色只在 :root；JS 只读 CSS 令牌；不在 minigames.js 写 hex。
3. 小游戏内可点目标逻辑尺寸至少 96×96；844×390 下实际至少 52×52；不沿用 48px 的 .vn-pause 做游戏内暂停。
4. pointer 事件；不依赖 hover；触摸坐标用 getBoundingClientRect 换算；canvas 加 touch-action:none。
5. 键盘可用：1–8 选项、Enter/空格确认、Esc 暂停、Tab 焦点；canvas 可聚焦。
6. prefers-reduced-motion 与 settings.reducedMotion 生效：不做闪白、抖动、频闪；火墙用静态橙色环与文字提示。
7. 不做音频；最后 10 秒只做视觉脉冲与文字“天快亮了”，心跳/鸡鸣留步骤六。

### 2.4 范围

1. 不做第 5 关探路/分粮；SCENES 只允许 door/abandon/boat/climb 四个 id；不做空壳预留。
2. 不做音频、转场、粒子系统、结局五卡、7 卡图鉴页、完整章节。
3. 不新增第七个运行时 JS 文件；不引入框架、构建链、CDN、ES module、fetch。
4. 不 deploy、不发布视频、不打字体包、不改线上版本。

## 3 文件级产出清单

### 3.1 新建

| 文件 | 作用 | 是否进运行时 |
|---|---|---|
| docs/minigame-system.md | 四关架构、状态机、结果契约、输入、暂停、调试、可访问性、边界 | 否（文档） |
| docs/evidence/step-04/run-log.md | B19–B30 的日期、环境、结果、截图名、例外 | 否（gitignored 证据） |
| step/step-04-核心小游戏.md | 本执行计划 | 否（过程文档） |

### 3.2 修改

| 文件 | 内容 | 验收 | 下游消费者 |
|---|---|---|---|
| project/minigames.js | 共享引擎 + 四关；RULES/ITEMS/API；结果契约 | C18、S27–S31 | engine、步骤五/六 |
| project/engine.js | startMinigame/finish/apply；result 动态；输入守卫；go 清理；solo | C20、S32/S33 | 序章、步骤五 |
| project/index.html | #vn-minigame 全屏；canvas/HUD/help/live/pause/fallback | C03/C19 | engine、CSS |
| project/style.css | 覆盖层、HUD、帮助、结果、焦点、96px 热区、reduced-motion | C19、C10 | 全部 |
| project/story.js | p025 加 source/game；p024 与文本不动 | C13/C20 | engine |
| project/tools/check-build.js | C03/C07 改；C18–C23 增 | 23/23 | 步骤五–八 |
| project/tools/smoke.js | S25 改；S27–S33 增 | 33/33 | 步骤五–八 |
| docs/minigame-tuning.md | RULES 表、四关数值、时长口径、弃物语义、第 5 关边界 | C22 | minigames.js |
| docs/state-schema.md | list flag、trips、missed、lights_lost 0–22、items 合法 id | C21 | engine/步骤五 |
| docs/ui-layout.md | 全屏覆盖层、HUD、帮助、结果 560×380、暂停 96、层级 | C19 | index/style |
| docs/test-cases.md | T08–T12 的具体步骤与参数 | §7 | 步骤七 |
| docs/quality-bar.md | canvas 键盘/live/DPR/96px/reduced-motion | E6/E7 | 步骤七 |
| docs/script/01-xiangjiang.md | 弃物配置与重物措辞 | C22 | story 誊写 |
| docs/script/02-zunyi.md | 第 45 行 lights_lost 改 choice.zunyi.missed | C21 | 步骤五 |
| docs/script/03-jinsha.md | 渡船 fatigue 12、crew 3、planned 18 | C22 | 步骤五 |
| docs/script/04-luding.md | 攀索 step/fire 参数（不改 22/0.35） | C22 | 步骤五 |
| docs/script/README.md | minigame config 字段与结果字段 | C22 | 步骤五 |
| .claude/CLAUDE.md | 步骤四状态、欠账、tag | E14 | 全项目 |

### 3.3 不碰

- project/art.js：四场景与 #stage-art 不动；小游戏自己画内容层。
- story p001–p024、p026–p900 的文本：不改；p025 只加 source/game 两个字段。
- docs/codex.md、docs/story-bible.md 的史实正文：不改；五卡与结局留步骤五。
- 字体、音频、部署配置：不碰。
- 第 5 关：不做。

## 4 关键决策（写代码前先认这些）

### S1 一个全屏游戏覆盖层，一张游戏画布

- #vn-minigame 从 560×260 占位改为 position:absolute; inset:0; z-index: var(--z-choice)；内部 #minigame-canvas 1280×720，CSS 100%，按 DPR 上限 2 放大。
- 不新增第二张舞台背景画布；#stage-art 继续在 z0，游戏层在 z40 盖住它；结束后隐藏游戏层，不销毁 #stage-art。
- #minigame-canvas 是唯一游戏画布；不按关卡各建一张 canvas。
- 理由：三张全屏 canvas 内存高、resize 路径三套；单画布 + 每关 draw 足够。

### S2 共享“限时分配”引擎，不写四个独立引擎

minigames.js 只暴露一个命名空间：

| 成员 | 作用 |
|---|---|
| SCENES | 固定 ['door','abandon','boat','climb']，顺序即测试顺序 |
| RULES | 四关数值唯一来源；冻结对象；调参只改这里 |
| ITEMS | 门板/弃物物品表；id、label、slots、heavy、fixed |
| start(opts) | 校验并启动一关；返回 boolean；失败给出可见错误 |
| stop(reason) | 幂等停止；取消 rAF、解绑事件、清 live；不回调 onEnd |
| isActive() | 引擎输入守卫用 |
| resize() | 重算 DPR 与画布尺寸；保留当前局面 |
| labelFor(id) | 结果页显示名 |
| itemIds(gameId) | 结果重建用 |
| crewForTrust(trust) | 渡船纯函数；S30 用 |
| usedSlots(items, door) | 门板纯函数；S28 用 |
| canPack(items, add, door) | 门板纯函数；S28 用 |

生命周期：idle → running → ending → ended；暂停是 running 上的布尔，不是第五个状态。

- 每个游戏是普通对象，不写 class 继承、Factory、Strategy、事件总线；共享循环与绘制 helper 就够了。
- 结果对象固定：

  gameId、reason（time/done/quit/error）、elapsed、carried[]、left[]、stats{}

  不写 success；不写 score；不写 Game Over。reason=done 只表示“提前完成”，不是“成功”。
- start(opts) 的 opts：gameId、config、canvas、hud、help、live、callbacks{onEnd,isPaused,isReducedMotion,toast,onEvent}。
- onEnd 只调用一次；引擎去重；stop 不触发 onEnd。
- 共享循环：rAF；dt=min(50ms, now-last)；暂停时 lastTs=now 且不 update；结束取消 rAF。
- 共享输入：canvas pointerdown/move/up + keydown；坐标换算；pointer capture；点击/拖动阈值 8px。
- 共享绘制：readPalette 只读 CSS 令牌；roundRect、text、card、timerBar、pips、chain 等小 helper；不写通用 UI 框架。
- 共享错误：start 校验失败返回 false；draw/update 抛错捕获一次，console.error + toast + 结束为 error；不白屏。

### S3 输入、焦点与触摸

- 坐标：x=(clientX-rect.left)*1280/rect.width；y 同理；不用 offsetX。
- canvas 设 touch-action:none；pointerdown 时 setPointerCapture；pointerup/cancel 释放。
- 点击：pointerup 且移动 <8px；拖动：超过 8px 进入拖拽；不依赖 click/hover。
- 键盘：1–8 对应物品/船/选项；Enter/空格确认；Esc 交给引擎暂停；Tab 正常走焦点。
- canvas tabindex=0；启动后 focus；结束后焦点到结果页“继续”。
- #minigame-live 是 aria-live=polite 的屏外区；状态播报节流 500ms，不逐帧读。
- 引擎在小游戏 active 时对 #scene-vn 的推进输入早退；canvas 内事件 stopPropagation；暂停按钮单独处理。

### S4 门板关

- 75 秒；容量 6 格；门板固定占 2 格且不可丢；花名册、铅笔随身不占格。
- 可选 5 件：药 1 格、青稞 1 格、锅 2 格、雨布 1 格、布鞋 1 格；加门板共 6 张可选卡，总格 8；必须取舍。
- 无门板时 5 件总格 6，正好装满——这是“没有门板反而装得下”的代价交换，不是奖励。
- 布局：3 列 ×2 行，共 6 格；门板 2×1，锅 1×2，其余 1×1；朝向固定，不做旋转。
- 拖拽到行囊高亮格；无合法位置时红框 + live“放不下”；点选自动放第一个合法位；再点行囊内物品取出；键盘 1–5 切换。
- 门板卡固定在行囊左上；花名册/铅笔在“随身”条，不占格、不可操作。
- 时间到或点“系好行囊”结束；按当前选择结算；不重开。
- 写 inventory.items = ['roster','pencil'] + 选中的可选 id（不含 door）；item.pot = 是否带锅；item.door 不由本关改。
- p025：带走 = 门板（若有）+ 选中可选；留下 = 未选可选；固定两件用一句 note 说明，不列进两栏。
- 失败例：时间到只带走门板与药；p025 如实显示，不提示“失败”。

### S5 弃物关

- 80 秒上限；两批，每批最多 3 件；6 件基础物资 + 门板（若 item.door）。
- 内部 id：xray（三百斤的箱子）、press（印刷机）、files（文件箱）、medkit（药箱）、radio（电台）、silver（银元）、door（门板）。
- UI 只写“三百斤的箱子”，绝不写 X 光机；重物 = xray/press/files。
- 每件初始“留在岸上”；点一下改为“带上船”；每批最多 3 件；点“发船”结算本批，1–3 件都可发，0 件不可发。
- 追兵 45 秒从第一次发船开始；每带上 1 件重物，追兵剩余 −8 秒；第一批带 3 件重物，追兵只剩 21 秒，第二批必须极快。
- 追兵到 0：立即结束；本批已上船的有效，未上的全部留下；不重开、不 Game Over。
- 门板特殊卡：item.door=true 才出现；不占“重物”惩罚；若最终未上船，item.door=false；若上船则保持 true，不把无门板路径“复活”。
- 药箱留下：fire−15；药箱上船不扣。银元/电台/文件箱/印刷机/三百斤箱子不留 fire 惩罚，只影响后续叙事与代价。
- 第一批已上船的 3 件从桌面移除，不能反悔；第二批从剩余里选；这是“先装什么”的核心取舍。
- 写 choice.xiangjiang.abandoned = 最终留下的 id 数组（含 door 若留下），最多 7 个；不写 kept、不写对错、不评分。
- 结果页两栏“带过江/留在江那边”；不显示“成功/失败”。

### S6 渡船关

- 90 秒；6 条船；每船 8 人；每船 3 名船工；计划 18 个载人航次（6 船 ×3 趟）。
- trust 0–5 → 船工 12/18/24/30/37；可用船 = min(6, floor(船工/3))：trust 0 只有 4 条，trust 1 起 6 条。
- 单程基础 12 秒；每 12 名船工 −1 秒，最低 9 秒；返程固定 12 秒；船在返程时不可再派。
- 疲劳 0–100；每完成一程（出程或回程）+12；≥80 时出程 +4 秒；=100 必须休息，不能派船。
- 休息 12 秒，疲劳 −12；休息中船不可派；可以同时多船休息，但会占时间。
- 点船即装 8 人出发；点船上的“歇”小按钮休息；键盘 1–6 派船，Shift+1–6 休息。
- 每完成一次出程 trips+1；到 18 或 90 秒结束；结果写 choice.jinsha.trips（0–18）。
- HUD 主计时“天亮 90s”；“已渡 X/18”；“船工 N/37”；追兵 120s 只作远景小字，不跳动、不驱动失败。
- 失败=少渡几批，不显示谁没上船的名字；不写 memory.*，不写死亡。
- trust 0 的 4 船是真实代价：玩家会看到两条船“船工不够”，而不是被 UI 骗。

### S7 攀索关

- 75 秒；3 段铁索；22 个光点；每一步 1.8 秒节奏；命中窗 0.35 秒。
- 光点总数 22：点中推进一格并点亮一个；点空熄一个；第 6/12/18 步触发火墙，1.5 秒内连点 3 次，失败熄一个。
- 当 reached + lost = 22 或时间到或 lost=22 时结束；不重开。
- 结果 stats：reached、lost、unlit=22−reached−lost；不显示“牺牲人数”，只写“过去 X 个光点，暗了 Y 个”。
- 写 lights_lost = lost（set，不 +=）；fire −5×min(lost,3)；不写 memory.names、不写 memory.luding_unknown（后者是步骤五选择）。
- 22 人不点名、不做个人对应、不做血；火墙是抽象橙色环，不是燃烧的人。
- 键鼠：空格/Enter/点击任意处；触摸点下半屏；单手可完成。

### S8 结果契约与刷新重建

- 运行时结果：lastMinigameResult；只在内存；不写档。
- p025 的 renderResult：node.source==='minigame' 时优先用运行时结果；刷新后按 node.game 从 flags/inventory 重建。
- 重建规则：
  - door：inventory.items + item.door；固定 roster/pencil 单独 note；left=全部可选−已带。
  - abandon：choice.xiangjiang.abandoned；carried=全部（含 door）−left；item.door 以 flags 为准。
  - boat：choice.jinsha.trips；结果只显示已渡/计划，不列人名。
  - climb：lights_lost；结果只显示 reached/lost/unlit。
- 无数据时回退 node.lists 静态两栏；不白屏、不报错。
- 应用结果：
  - door：inventory.items、item.pot；不动 item.door。
  - abandon：choice.xiangjiang.abandoned、item.door（仅在 door 留下时置 false）、medkit 留下 fire−15。
  - boat：choice.jinsha.trips。
  - climb：lights_lost、fire 惩罚。
- 应用函数返回 ok/issues；issue 只 toast/console，不中断剧情。
- 结果页不显示 success/score；标题固定“行囊/渡口/铁索”，由 node 或 game 决定。

### S9 引擎接入

- renderVn 的 minigame 分支：不再 renderSeam，改调 startMinigame(node)；保留 XB.minigames 缺失时的 fallback。
- startMinigame：隐藏对话/工具条/选项/结果/标题卡；显示 #vn-minigame；给 #scene-vn 加 .is-minigame；调 start；失败显示 fallback 面板“小游戏加载失败 / 继续剧情”，不白屏。
- finishMinigame：去重；stop；隐藏覆盖层；apply；advance 到 p025；renderVn；saveNow；恢复焦点。
- go/startNewGame：先 stop('navigate')，清 lastMinigameResult；避免旧游戏在后台继续计时。
- resize：art.resize 之后调 XB.minigames.resize；暂停/设置变化不需要重开。
- 输入：active 时 onPointerDown 对 #scene-vn 推进早退；onKeyDown 除 Esc 外早退；canvas 的事件 stopPropagation；暂停按钮单独处理。
- 暂停：复用 openPause；#vn-minigame 的 z=40，暂停 80，toast 90；游戏内 #minigame-pause 96×96，z=41；.is-minigame 时保证暂停可点。
- 页面隐藏：onVisibilityChange 已有 openPause；小游戏 isPaused 读 state.paused；恢复不跳秒。
- 不保存小游戏中间态；p024 刷新重开；p025 刷新重建。

### S10 调试试玩

- ?minigame=door|abandon|boat|climb：直接进单关；不写档、不推进剧情；结果页“调试试玩”+“再玩一次/回标题”。只有调试允许重开，叙事内不允许。
- 可配：?reset=1、?debug=1、?trust=0..5（boat）、?door=0/1（door/abandon）、?fire=0..100、?lights=0..22（climb）。
- 不提供 ?duration= 覆盖；时长测试用真实等待或 Playwright 时钟，避免测试专用参数漂移进正式逻辑。
- 非法 gameId：toast + 回标题；不抛异常。
- solo 模式不 load/save 剧情；?reset=1 只清调试起点；回标题后正常读档。
- 结果页的“再玩一次”只在 solo 出现；序章 p025 不出现。

### S11 视觉、可访问性与单手

- 门板：纸色晨光 + 木纹门板 + 6 格行囊；暖窗/鸡鸣用静态图形；最后 10 秒 HUD 脉冲（reduced-motion 关闭）。
- 弃物：夜江 + 纸色物资卡 + 远处火光；重物卡更沉、更暗；不做敌人脸。
- 渡船：夜蓝江面 + 6 条船 + 船工点 + 疲劳条 + 火把；船工不够的船压暗。
- 攀索：夜色 + 13 根铁索 + 22 个光点 + 橙色火墙环；不做血、不做燃烧的人。
- 所有文字用纸白/火橙；朱砂只放纸色卡上；夜蓝上不用朱砂小字。
- 小游戏内可点目标 ≥96×96；844×390 下 ≥52×52；核心操作在下半屏；暂停在右上但非完成必需。
- 字体用 --font-body/--font-title；失败回退系统宋体；不打包字体。
- reducedMotion：关闭脉冲、抖动、闪白；火墙只留静态环 + 文字。
- 不加音频；最后 10 秒只视觉提示。

### S12 文档先行

T4.0 新建 docs/minigame-system.md，并同步 tuning/schema/ui/test/quality/script；每一条 RULES 数值必须在 docs 有同名值。代码提交前先跑 C22；docs 与 RULES 不一致就不得提交。

## 5 任务卡

### T4.0 先改文档与数值（40 / 25 分钟）

**目的**：把四关规则、结果契约、旗标、坐标、时长口径先写死，避免代码与 docs 分叉。

**输入**：docs/minigame-tuning.md；docs/state-schema.md；docs/ui-layout.md；docs/test-cases.md；docs/quality-bar.md；docs/script/01/02/03/04；docs/story-bible.md §4.4/§5；project/story.js 的 p024/p025。

**动作**：

1. 新建 docs/minigame-system.md，至少十二节：范围与不做、共享架构、状态机、start/stop 契约、结果对象、输入与坐标、暂停/可见性、四关规则、结果重建、调试参数、可访问性、文档与数值台账。
2. 改 docs/minigame-tuning.md：
   - 四关表加“目标/上限/结算面板/含结算目标”四列；写清 45/50/60/50 +20s 的口径；
   - 门板容量 6、门板 2、可选 5 件、总格 8；
   - 弃物两批/每批 3、追兵 45、重物 +8 秒的措辞改为“带上重物才提前”；
   - 渡船 fatiguePerLeg 12、crewPerBoat 3、plannedTrips 18、可用船公式、休息 −12；
   - 攀索 22 光点、stepMs 1800、fireAt 6/12/18、fireWindow 1500、fireTaps 3；
   - 明确第 5 关不做；心跳/鸡鸣是步骤六音频目标，本步只视觉。
3. 改 docs/state-schema.md：
   - choice.xiangjiang.abandoned 为 string[]，只允许 door/xray/press/files/medkit/radio/silver，最多 7；
   - choice.jinsha.trips 0–18；choice.zunyi.missed 0/1；
   - lights_lost 0–22，只归攀索，set 不 +=；
   - inventory.items 合法 id 表；item.pot；item.door 镜像；
   - 明确 list flag 只开这一个路径，不做通用数组。
4. 改 docs/ui-layout.md：
   - #vn-minigame 全屏 inset:0，z=--z-choice；#minigame-canvas 1280×720；
   - HUD 0–72；帮助 0,660,1280×60；#minigame-pause 96×96；#vn-result 改为 560×380 at 360,170；按钮 96 高；
   - 层级：art0/scene1/game40/pause80/toast90；
   - 手机横屏 844×390 的实际像素热区说明。
5. 改 docs/test-cases.md：把 T08–T12 写成可执行步骤（参数、动作、预期、证据），不改 T 编号，不加 T21+。
6. 改 docs/quality-bar.md：canvas 键盘、aria-live、DPR、96px、reduced-motion、无 hover。
7. 改 docs/script/01、03、04、README 的 minigame 配置行；改 02-zunyi 第 45 行为 choice.zunyi.missed=+1；不改 22/0.35/6 船等史实锚点。
8. 不改代码；不改 story.js；不改 p024 config；不改 p025 文本。

**产出**：docs/minigame-system.md；六份 docs 的 diff。

**完成判据**：一个没看过代码的人，只读 minigame-system + tuning + schema + ui-layout，能回答“四关怎么玩、结果对象长什么样、旗标写什么、每个可点目标在哪、失败怎么结算”。所有 RULES 数值能在 docs 找到同名值。

**常见坑**：

- 把“每关 60–90”写成可玩段 60–90，与 45/50/60/50 打架。
- 保留“每留 1 件重物提前 8s”的旧句。
- 把 list flag 写成通用数组，导致 normalize 以后收进任意脏数据。
- 把 22 个光点写成 22 位勇士的名字列表——红线。
- 在 docs 里写 X 光机，UI 也跟着写——红线。

### T4.1 共享限时分配引擎（70 / 40 分钟）

**目的**：让四关共用一个计时、输入、绘制、暂停、结果、降级内核；四关只写规则。

**输入**：T4.0 的 minigame-system；minigames.js 空壳；engine.js 的 isPaused/visibility；style.css 令牌。

**动作**：

1. minigames.js 用 IIFE + window.XB；加载时不访问 DOM；只定义 SCENES/RULES/ITEMS/API。
2. 冻结 RULES/ITEMS；四个 game 对象实现 init/update/draw/onPointer/onKey/end；不写 class 继承。
3. 实现 start/stop/isActive/resize；start 校验 gameId、canvas、callbacks；失败返回 false 并给错误。
4. 实现 rAF 循环、dt clamp 50ms、暂停不累计、结束取消；stop 幂等。
5. 实现坐标换算、pointer capture、8px 阈值、键盘分派、focus、live 播报节流。
6. 实现结果对象与 end 一次；reason 只允许 time/done/quit/error；不写 success/score。
7. 实现 readPalette（只读 CSS 令牌）、roundRect/text/card/timerBar/pips/chain 等小 helper；缺令牌时抛错，由引擎 fallback。
8. 先写一个 door 空壳跑通 start/stop/resize；再写其他关；单元自测放草稿，T4.8 进 smoke。

**产出**：minigames.js 的 API 与共享循环；一个可启动的空壳关。

**完成判据**：Node 里能加载 minigames.js 且不报 DOM 错；SCENES 长度 4；start 非法参数返回 false；stop 两次不抛；resize 不重置局面；结果无 success/score。

**常见坑**：

- 四个游戏各写 requestAnimationFrame——L1 已否决。
- 把暂停做成 stop/restart——会丢局面。
- 用 offsetX 或 CSS 像素直接当设计坐标——缩放后错位。
- 在加载时 getComputedStyle——Node 测试会炸。
- 把 96px 热区只写在 CSS，canvas 内仍用 44 逻辑像素。

### T4.2 门板关（75 / 42 分钟）

**目的**：把 p024 的 config 变成可玩的门板装载关，并让 p025 动态显示带走/留下。

**输入**：p024 config（75/6/2/8）；docs/script/00-prologue.md；minigame-tuning 门板表；T4.1 引擎。

**动作**：

1. 布局：HUD；3×2 行囊（6 格）；门板 2×1 固定左上；锅 1×2；其余 1×1；底部 5 张可选卡 + 随身条。
2. 状态：selected 集合；usedSlots；door 是否存在；phase；timeLeft；lastTenPulse。
3. 交互：拖拽到合法格；点选自动放第一个合法位；再点取出；键盘 1–5；空格/Enter“系好行囊”。
4. 容量：usedSlots>6 拒绝；门板不计入选择；无门板时 5 件正好 6 格。
5. 计时：75 秒；最后 10 秒 HUD 脉冲与“天快亮了”；reduced-motion 关闭脉冲；不新增音频。
6. 结束：时间到/手动；result.carried 含门板+选中；result.left 未选；固定 roster/pencil 只在 note。
7. 写 inventory.items、item.pot；不写 item.door；p025 加 source/game；动态两栏。
8. 测试：带门板/不带门板、装锅/不装锅、超时、手动完成；p025 文本与清单。

**产出**：门板关；p025 动态结果；inventory/item.pot 正确。

**完成判据**：带门板最多 6 格；无门板 5 件全装；时间到不重开；p025 两栏与实际一致；不出现“成功/失败/评分”。

**常见坑**：

- 把花名册/铅笔算进 6 格——它们随身。
- 把门板当可丢——p021 的选择被推翻。
- 门板关写 item.door=false——越权。
- 结果页写“你成功了”——红线。
- 锅 2 格算成 1 格——容量全错。

### T4.3 弃物关（80 / 45 分钟）

**目的**：两批配额 + 追兵 + 重物惩罚，让“带什么过江”有真实代价。

**输入**：docs/script/01-xiangjiang.md；minigame-tuning 弃物表；T4.1 引擎；state-schema list flag。

**动作**：

1. 布局：HUD“第 1/2 批、追兵、0/3”；中间 6+门板卡；下方 3 个船上槽；右下“发船”96 高。
2. 初始全部“留在岸上”；点卡切换“带上船”；每批最多 3；0 件不能发；1–3 可发。
3. 第一批发船：启动追兵 45；每带 1 件重物剩余 −8；移除已上船 3 件；进入第二批。
4. 第二批发船/时间到/追兵到 0：结算；未上的留下；door 留下则 item.door=false；medkit 留下 fire−15。
5. 写 choice.xiangjiang.abandoned（含 door 若留下）；不写 kept、不写对错。
6. 结果页“带过江/留在江那边”；显示重物数量与追兵剩余；不显示“失败”。
7. 测试：三件重物第一批、药箱留下、门板留下、无门板路径、追兵提前到 0。

**产出**：弃物关；abandoned/item.door/fire 正确。

**完成判据**：重物带上才罚；两批最多 6 件；有门板必有一件留下；门板留在江上后 item.door=false；药箱留下 fire−15；不评分。

**常见坑**：

- 把“留下重物”当成惩罚——语义反了。
- 追兵 45 从入场就开始，玩家还没发船就结束。
- 第一批上了 3 件还能反悔。
- 门板留下但 item.door 仍 true，后续 [[if]] 全错。
- 把 abandoned 写成 kept 或对象。

### T4.4 渡船关（85 / 48 分钟）

**目的**：把 trust→船工→可用船→单程时间→疲劳串成一条可理解的调度链。

**输入**：docs/script/03-jinsha.md；minigame-tuning 渡船表；T4.0 的 crew/疲劳数值；T4.1 引擎。

**动作**：

1. 布局：HUD 天亮/已渡/船工/追兵小字；6 条船 2×3；每条 8 个乘客点、疲劳条、“歇”96×96。
2. trust 0–5 映射船工 12/18/24/30/37；可用船 min(6,floor/3)；船工不够的船压暗并显示原因。
3. 点船：装 8 人出发；单程 max(9,12−floor(船工/12))，疲劳≥80 +4；返程 12；返程不可派。
4. 每程疲劳 +12；100 不能派；休息 12 秒 −12；休息中不可派；可多船同时休息。
5. trips 到 18 或 90 秒结束；写 choice.jinsha.trips；结果“已渡 X/18”不列人名。
6. HUD 追兵 120s 只作远景小字，不跳动、不驱动失败。
7. 测试：trust0 4 船、trust5 6 船、速度 9/11、疲劳 80/100、休息、18 趟上限。

**产出**：渡船关；trips 正确；疲劳可复现。

**完成判据**：trust0 只有 4 船；每船 8 人；18 趟上限；疲劳不飘；休息不偷时间；结果不显示谁没上船。

**常见坑**：

- 把 37 名船工平均分给 6 船但不校验可用船——trust0 仍 6 船。
- 疲劳只加不减或休息回满——数值失控。
- 90 秒内追兵 120 先到——时序反了。
- 结果写“死了多少人”——红线。
- 把记名 8s 塞进本关——步骤五。

### T4.5 攀索关（75 / 42 分钟）

**目的**：用节奏点击与火墙连点表现“22 个光点”，失误只熄灯、不重开。

**输入**：docs/script/04-luding.md；minigame-tuning 攀索表；T4.1 引擎。

**动作**：

1. 布局：3 段铁索、13 根链、22 个光点沿路径；HUD 段/光点；底部提示。
2. 节奏：每步 1.8 秒；命中窗 0.35 秒；点中 step+1 点亮点；点空 lost+1 熄一个；不推进。
3. 火墙：step 到 6/12/18 触发 1.5 秒连点 3 次；失败 lost+1；恢复后继续。
4. 结束：step+lost=22、lost=22、时间到；result reached/lost/unlit；不显示名字。
5. 写 lights_lost=lost；fire−5×min(lost,3)；不写 memory.names/luding_unknown。
6. reduced-motion：火墙静态环，不闪白；点击反馈用描边，不抖动。
7. 测试：全中、点空 3 次、火墙失败、时间到、lost=22。

**产出**：攀索关；lights_lost/fire 正确。

**完成判据**：点空不重开；22 光点不超；火墙 3 次；结果无姓名；lights_lost 只归本关。

**常见坑**：

- 点空退回上一步——玩家可以无限刷。
- 火墙失败直接 Game Over——红线。
- 结果写“你害死了 3 个人”——红线。
- 把 lights_lost 写成 +=，刷新后翻倍。
- 22 个光点画成 22 张脸/名字——红线。

### T4.6 VN 接入、结果与调试（65 / 35 分钟）

**目的**：让四关从 VN 进出，p025 动态，刷新可重建，单关可试玩。

**输入**：engine.js 的 renderVn/renderResult/go/openPause/onPointerDown/onKeyDown；index.html；story.js p024/p025；T4.1 API。

**动作**：

1. cacheElements 加 minigame 容器、canvas、hud、help、live、pause、fallback、result；REQUIRED_IDS 同步。
2. renderVn 的 minigame 分支：startMinigame(node)；删 renderSeam 的“步骤四接入”文案；保留 fallback。
3. startMinigame：隐藏阅读层；显示覆盖层；加 .is-minigame；调 start；失败显示 fallback；focus canvas。
4. finishMinigame：去重；stop；隐藏；applyMinigameResult；advance；renderVn；saveNow；focus 继续。
5. applyMinigameResult：door/abandon/boat/climb 五条写旗标规则；list flag；issue 只提示。
6. renderResult：source=minigame 时动态；刷新按 game 重建；无数据回退静态 lists；无 success/score。
7. go/startNewGame 先 stop('navigate')；resize 调 XB.minigames.resize。
8. 输入守卫：active 时 #scene-vn 推进早退；Esc 仍开暂停；canvas stopPropagation。
9. solo：?minigame 直接进；不写档；结果“调试试玩/再玩一次/回标题”；非法 id 回标题。
10. story p025 只加 source:'minigame'、game:'door'；p024 config 不变；文本不动。

**产出**：engine 接入；p025 动态；单关入口。

**完成判据**：p024→四关→p025 不断；刷新 p024 重开、p025 重建；暂停冻结；点小游戏不跳句；fallback 不白屏。

**常见坑**：

- startMinigame 不隐藏 #vn-dialogue，游戏下面还在打字。
- finish 被调用两次，旗标翻倍。
- go 不 stop，旧游戏后台继续计时。
- p025 只认静态 lists，选择被忽略。
- solo 模式写档，污染正式存档。

### T4.7 DOM/CSS/可访问性（45 / 25 分钟）

**目的**：全屏覆盖层、HUD、帮助、结果、焦点、96px 热区、手机横屏都能落地。

**输入**：index.html；style.css；ui-layout T4.0 版；T4.6 的 engine 接入。

**动作**：

1. index.html 在 #scene-vn 内加 #vn-minigame，含 canvas（1280×720、tabindex=0、aria-describedby）、#minigame-hud、#minigame-help、#minigame-live（aria-live=polite、sr-only）、#minigame-pause（96×96）、#minigame-fallback（hidden）。
2. #vn-minigame 全屏 inset:0；z=--z-choice；canvas 100%；background night；[hidden] 必须 display:none。
3. HUD 0–72；帮助 0,660,1280×60；结果 560×380 at 360,170；继续按钮 96 高；暂停 96×96。
4. .is-minigame 时 #vn-pause/工具条/对话/选项全部隐藏；#minigame-pause 显示并 z=41；暂停遮罩 z=80。
5. 加 .xb-sr-only；焦点 2px 朱砂 + 2px 纸白内衬；结果页/暂停焦点陷阱。
6. 颜色全 var；小游戏画布内的颜色从令牌读；不加 hex、不加图片/字体。
7. reduced-motion：关闭脉冲/抖动/闪白；帮助文字仍显示。
8. 三档：1280、1366、844×390；竖屏仍走 #orientation。

**产出**：DOM/CSS 完整；覆盖层不遮暂停；结果页可读。

**完成判据**：C03/C19 过；元素不越界；96px 热区；键盘可达；手机横屏实际 ≥52px。

**常见坑**：

- #vn-minigame 设 hidden 但 CSS display:flex 覆盖，游戏一直挡着。
- canvas CSS 100% 但内部 width/height 未按 DPR，模糊。
- 暂停按钮被 z40 盖住。
- 结果页 300 高放不下 6 行 + 96 按钮。
- 只做 hover，不做点按。

### T4.8 工具与测试（45 / 25 分钟）

**目的**：把四关契约变成机器检查，防回归。

**输入**：check-build 17 项；smoke 26 项；T4.0 文档；minigames/engine/index/story。

**动作**：

1. check-build C03：REQUIRED_IDS 加 minigame-canvas/minigame-hud/minigame-help/minigame-live/minigame-pause；#vn-minigame 保留；去掉 seam 占位依赖。
2. C07：minigames 必须有 SCENES/RULES/start/stop/isActive/resize；engine 必须引用 XB.minigames.start；不再要求空壳；art 仍不被 engine 重写。
3. C18：SCENES 恰好 4；RULES 四关；结果契约无 success/score/Game Over；start/stop 幂等。
4. C19：#vn-minigame 全屏；canvas 1280×720；aria-live；help；pause 96；result 380。
5. C20：p024 config 仍 75/6/2/8；p025 source=minigame、game=door；无“步骤四接入”。
6. C21：list flag 只允许 abandoned；trips 0–18；missed 0/1；lights_lost 0–22；无新持久键。
7. C22：docs 数值与 RULES 同名同值（duration/capacity/quota/boats/lights/hitWindow/fatigue/crew/planned）。
8. C23：无外部图片/音频/字体；无 http/fetch/Audio/Image；UI 无 X 光机/牺牲人数/Game Over/成功失败大字。
9. smoke S27–S33；同步改 S25（不再要求空壳）；S27 API、S28 门板、S29 弃物、S30 渡船、S31 攀索、S32 结果、S33 接入。
10. 四个负例：duration 120；结果写 success；去掉 canvas；lights_lost 变字符串；每个都要报红，跑完恢复。

**产出**：check-build 23 项；smoke 33 项；负例记录。

**完成判据**：23/23、33/33；负例全红；check-script 通过；不把红项改 skip。

**常见坑**：

- 把 C07 继续写成“minigames 必须空壳”。
- C22 只查 tuning 不查 script，配置行漂移。
- 负例改到正式文件忘了恢复。
- C19 只查 id 不查 96/380。
- smoke 直接 new DOM，Node 跑不了。

### T4.9 浏览器实测（55 / 31 分钟）

**目的**：用 Edge 实测四关、失败、暂停、刷新、触摸、离线；只报实测，不报推测。

**输入**：check-build/smoke 全绿；Edge 156；file:// 与本地 http；Playwright 可选。

**动作**：

1. B19 门板 1280 成功路径；B20 844×390 触摸；B21 门板超时（Playwright 时钟或等待）。
2. B22 弃物正常；B23 弃物三件重物第一批、追兵提前。
3. B24 渡船 trust0 4 船；B25 疲劳 80/100 与休息。
4. B26 攀索全中；B27 点空/火墙失败。
5. B28 暂停/切标签 5 秒，计时不变；B29 p024 刷新重开、p025 刷新重建。
6. B30 控制台 0 error、无 404、file:// 可玩、无外部请求。
7. 截图命名 b19-door-1280.png 等；run-log 记录环境/步骤/结果/例外。
8. 三档分辨率；手机横屏；竖屏提示；键盘/触摸各一次。

**产出**：docs/evidence/step-04/run-log.md；截图。

**完成判据**：B19–B30 有结果；0 console error；p025 重建；不把 Edge 写成 Chrome/Safari。

**常见坑**：

- 只测桌面，不测 844×390。
- 超时测试加 ?duration= 而不是等时钟。
- 刷新 p025 看到空白就判失败，不查重建。
- 控制台有 error 还写全绿。
- 把 Edge headless 写成真机。

### T4.10 复核与交班（25 / 12 分钟）

**目的**：把实测、欠账、状态写回项目，避免“写了”冒充“能玩”。

**输入**：T4.9 证据；check-build/smoke；本文件 §11。

**动作**：

1. 回填 §11.1 用时、§11.2 E1–E15、§11.3 B19–B30、§11.4 偏差/欠账、§11.5 状态/提交、§11.6 一句话交接。
2. 更新 .claude/CLAUDE.md 步骤表：步骤四 ✅、tag step-4-done；写欠账（第 5 关、音频、Chrome/Safari、真机、20 分钟、字体）。
3. 提交 feat: 核心小游戏（步骤四）；按项目规则确认后打 tag step-4-done；不部署。
4. 检查 git diff：无大文件、无字体、无截图、无 evidence 入库。
5. 交接：步骤五拿 p025 动态、旗标、结果契约；步骤六拿事件名；步骤七拿 B19–B30 与欠账。

**产出**：§11；CLAUDE 更新；commit/tag。

**完成判据**：§11 无空白；CLAUDE 与 tag 一致；欠账不隐瞒。

**常见坑**：

- 没跑浏览器就写 A。
- 把 tag 打成 step-4（缺 -done）。
- 把 evidence/截图提交进仓库。
- 欠账只写“待优化”，不写具体项。

## 6 时间盒

### 6.1 标准（660 分钟 = 11h）

| 时段 | 任务 | 累计 |
|---|---|---:|
| 0:00–0:40 | T4.0 文档 | 40 |
| 0:40–1:50 | T4.1 共享引擎 | 110 |
| 1:50–3:05 | T4.2 门板 | 185 |
| 3:05–4:25 | T4.3 弃物 | 265 |
| 4:25–5:50 | T4.4 渡船 | 350 |
| 5:50–7:05 | T4.5 攀索 | 425 |
| 7:05–8:10 | T4.6 接入/结果/调试 | 490 |
| 8:10–8:55 | T4.7 DOM/CSS | 535 |
| 8:55–9:40 | T4.8 工具 | 580 |
| 9:40–10:35 | T4.9 浏览器 | 635 |
| 10:35–11:00 | T4.10 复核 | 660 |

### 6.2 压缩（371 分钟 = 6h11）

T4.0 25 → T4.1 40 → T4.2 42 → T4.3 45 → T4.4 48 → T4.5 42 → T4.6 35 → T4.7 25 → T4.8 25 → T4.9 31 → T4.10 12。

压缩只能砍“重复实测/美化/多余动效”，不能砍：结果契约、四关失败路径、暂停/刷新、96px 热区、控制台、check-build/smoke、p024/p025 连接。

### 6.3 脱离时间盒的触发

- T4.1 超过 90 分钟：先停，检查是否在写通用 UI 框架/事件总线；本步只需要循环、输入、绘制 helper。
- T4.2 超过 90 分钟：检查是否在追求拖拽动画/物理；先保证点选与容量正确。
- T4.4 超过 100 分钟：检查是否在写复杂寻路/人物动画；本关只需要船、疲劳、班次。
- T4.7 超过 60 分钟：先保 1280 与 844×390，1366 用比例推导；记录例外。
- T4.9 超过 70 分钟：先完成 B19–B25，B26–B30 记录未测，不假装全绿。

## 7 验收清单

### 7.1 E1–E15

| 编号 | 验收项 | 通过标准 | 对应 T/B | 证据 |
|---|---|---|---|---|
| E1 | 四关可独立试玩 | ?minigame=door/abandon/boat/climb 各自进入、完成、结果、回标题/再玩 | T4.2–T4.6；B19/B22/B24/B26 | 4 张截图 |
| E2 | 门板接入 | p021 带门板→p024→门板关→p025 动态两栏；不带门板路径同样可走 | T4.2/T4.6；B19/B29 | 截图 + flags |
| E3 | 60–90 秒 | 首次正常试玩含结算 60–90；四关目标 45/50/60/50 +20s；上限只作保险丝 | T4.0；B19–B27 | 计时记录 |
| E4 | 失败只结算代价 | 门板超时、弃物追兵、渡船少渡、攀索熄灯均不重开、不 Game Over | T4.2–T4.5；B21/B23/B25/B27 | 录屏/截图 |
| E5 | 不评分 | 无 success/score/星级/完美通关/成功失败大字 | T4.1/T4.8；C18/C23 | 源码 + 截图 |
| E6 | 触摸单手 | 844×390 可完成核心操作；96 逻辑px→≥52 实际px；无 hover | T4.7；B20 | 截图 + 尺寸 |
| E7 | 暂停/可见性 | 暂停/切页 5s 计时不变；恢复不跳秒；Esc 可开可关 | T4.6/T4.7；B28 | 录屏 |
| E8 | 刷新 | p024 刷新重开本关；p025 刷新按旗标重建；无新存档键 | T4.6/T4.8；B29 | 截图/存档 JSON |
| E9 | 旗标 | item.pot/item.door/abandoned/trips/lights_lost/fire 正确；无脏值 | T4.2–T4.6；S28–S32 | debug 截图 |
| E10 | 无外部素材 | 无图片/音频/字体请求；无 fetch/ESM；无第二张背景画布 | T4.8；C23/B30 | Console/Network |
| E11 | 工具 | check-build 23/23；smoke 33/33；四个负例报红 | T4.8 | 终端输出 |
| E12 | 浏览器 | Edge B19–B30 全绿；Console 0 error；file:// 与 http 都可玩 | T4.9 | run-log |
| E13 | 文档同步 | minigame-system/tuning/schema/ui/test/quality/script 与代码一致 | T4.0/T4.8；C22 | diff |
| E14 | 交付记录 | §11 回填；CLAUDE 步骤表；tag step-4-done | T4.10 | git tag |
| E15 | 时长预算 | 四关目标总 285s（205+80），不挤占 20 分钟；上限不超 400s | T4.0；B19–B27 | 计时表 |

### 7.2 本步不验收（留后续）

| 项 | 为什么不在本步 | 归属 |
|---|---|---|
| 第 5 关探路/分粮 | 核心版不做 | 完整版/步骤八决定 |
| 第一章到终章完整流程 | 步骤五 | 步骤五 |
| 7 卡图鉴页 / 结局五卡 / 点名 | 步骤五 | 步骤五 |
| 音频/静音实际发声 | 步骤六 | 步骤六 |
| Chrome/Safari/真机/隐私模式 | 步骤七 | 步骤七 |
| 20 分钟完整通关 | 步骤七 | 步骤七 |
| 字体打包 | 步骤八 | 步骤八 |

### 7.3 证据分级写法

- A：写“Edge 156.0.0.0，file://，B19 通过，截图 b19-door-1280.png，Console 0 error”。
- B：代码/工具完成但未开浏览器；写“B，未跑”。
- C：只画界面/只写计划；写“C，设计稿”。
- D：未验证；写“D，未测”，不要用“应该可以”。

## 8 风险与返工触发

| 风险 | 概率 | 影响 | 预防/触发 |
|---|---|---|---|
| 共享引擎抽象过度 | 中 | T4.1 超时 | 只做循环/输入/绘制/结果；不写事件总线/DI |
| 输入抢事件 | 高 | 点游戏跳句/暂停失效 | active 早退 + stopPropagation + canvas 聚焦 |
| 坐标缩放错 | 高 | 触摸点不中 | 只用 getBoundingClientRect；844×390 实测 |
| list flag 污染 | 中 | 坏档/白屏 | 只开 abandoned；normalize 过滤 + 限 7 |
| lights_lost 冲突 | 中 | 终章数字错 | 遵义改 missed；C21；set 不 += |
| 渡船数值不闭合 | 中 | 疲劳无意义/无法 18 趟 | 12/3/18；S30；trust0 实测 |
| 弃物语义反 | 中 | 玩家决策被误导 | “带上才罚”；C22 |
| 门板关无门板太简单 | 低 | 分支失衡 | 时间压力 + 结果差异；记录 |
| 96px 热区挤版 | 中 | 布局溢出 | 结果 380；三档实测 |
| 只测 Edge 写全绿 | 高 | 步骤七返工 | 明写仅 Edge；列欠账 |
| 结果页写成功/失败 | 中 | 红线 | C18/C23；人工复核 |
| 刷新后结果空白 | 中 | 体验断裂 | 重建 + 静态回退；B29 |

**返工触发**：

- p024 config 被改：立即回滚；C20。
- p025 文本被改：回滚，只保留 source/game。
- 出现 Game Over / success / score：停止，按红线修。
- 点游戏会推进对话：先修输入，不进入 T4.9。
- 刷新 p025 空白：不得声称“结果可重建”通过。
- check-build/smoke 红：先修，不 skip。
- Console error：先修，不用“已知问题”盖。

## 9 禁区

1. 不做第 5 关；不加 SCENES 第五项；不写“以后扩展”的空壳。
2. 不做战斗、击杀、血腥、敌人脸；不做“打鬼子”。
3. 不把牺牲做分数；不写 success/score/rank/星级/完美通关；不弹 Game Over。
4. 不虚构真实领导人台词；不点 22 位勇士的名字；不写“害死了谁”。
5. UI 不写 X 光机；只写“三百斤的箱子”。
6. 不新增第七个运行时 JS 文件；不引入框架/构建链/CDN/ES module/fetch。
7. 不新增第二张舞台背景画布；不重写 art.js 四场景。
8. 不新增 SAVE_KEY/SAVE_VERSION/PERSIST_KEYS；不保存小游戏中间态。
9. 不在 :root 外写 hex；不引入图片/音频/字体；不自动播放。
10. 不改标题 96px、印章 360,150、菜单 120,360；不改 10 类 xb-* 类名。
11. 不用 hover 作为唯一交互；不把热区降到 96px 以下；不忽略键盘焦点。
12. 不 deploy、不发布视频、不打包字体；提交前检查大文件与未授权素材。
13. 不把“写了”写成“能玩”；不把 B 级写成 A；不隐瞒欠账。

## 10 交接接口

### 10.1 给步骤五（章节/图鉴/结局）

- p024 不变：type=minigame，game=door，config={duration:75,capacity:6,doorCost:2,items:8}。
- p025 只用 source:'minigame'、game:'door'；文本不动；动态/重建逻辑在 engine。
- 新旗标：
  - choice.xiangjiang.abandoned：string[]，含 door 若留下，最多 7；
  - choice.jinsha.trips：0–18；
  - choice.zunyi.missed：0/1；
  - lights_lost：0–22，只归攀索；
  - item.pot：boolean；inventory.items 合法 id。
- 渡船关还没有 result 节点/记名 8s；步骤五接 chapter 3 时用 trips + trust + memory.zhang。
- 攀索关不写 memory.luding_unknown；步骤五在泸定选择里写。
- 结果页契约复用：carried/left/stats；不要加 success/score。
- 7 张 codex、结局五卡、点名仍在步骤五；本步不做。

### 10.2 给步骤六（音频）

- 本步无音频；minigames 通过 callbacks.onEvent 发出 pack/unpack/deny/dispatch/rest/trip/lost/phase/time/end。
- 最后 10 秒已有视觉脉冲与“天快亮了”文本；步骤六可接心跳/鸡鸣，不新增音频文件。
- 暂停/可见性已冻结计时；音频 suspend/resume 接同一暂停入口。
- 不自动播放；首次点击后再创建 AudioContext。

### 10.3 给步骤七（测试）

- T08–T12 已写具体步骤；B19–B30 是 Edge 证据；Chrome/Safari/真机/隐私模式未测。
- 20 分钟完整通关未测；本步只测四关 285s 目标。
- 需补：真实手机横屏、触摸、减少动态、隐私模式禁存储、file:// 存档降级。
- 已知例外：全局 .vn-pause 仍 48 逻辑px（步骤三 B16）；小游戏内已用 96px，不沿用旧例外。

### 10.4 给步骤八（打包）

- 无新增图片/音频/字体；minigames.js 体积纳入 150KB gzip 预算。
- 四关是纯 Canvas 程序化绘制；ZIP 离线可玩；无 CDN。
- 不在本步 deploy；步骤八再决定字体子集与部署。

### 10.5 变更纪律

执行中若改 RULES 任一数值，先改 docs 再改代码；若改结果对象字段，先改 state-schema/minigame-system 再改 engine/check-build/smoke；不得只在代码里“试一下”。

## 11 复核记录（执行后回填）

### 11.1 任务实际用时

| 卡 | 计划标准 | 计划压缩 | 实际 | 偏差原因 |
|---|---:|---:|---:|---|
| T4.0 | 40 | 25 | 未精确计时 | 文档量大；落盘清单见 run-log |
| T4.1 | 70 | 40 | 未精确计时 | 共享引擎一次搭起后四关都复用 |
| T4.2 | 75 | 42 | 未精确计时 | 门板布局/拖拽调试占多 |
| T4.3 | 80 | 45 | 未精确计时 | 弃物两批与追兵规则 |
| T4.4 | 85 | 48 | 未精确计时 | 渡船状态机与疲劳 |
| T4.5 | 75 | 42 | 未精确计时 | 攀索火墙/自动失误 |
| T4.6 | 65 | 35 | 未精确计时 | 接入、结果重建、solo |
| T4.7 | 45 | 25 | 未精确计时 | 键盘/触摸/ARIA 实测 |
| T4.8 | 45 | 25 | 未精确计时 | 23 项 + 33 项 + 四负例 |
| T4.9 | 55 | 31 | 未精确计时 | 浏览器矩阵与截图 |
| T4.10 | 25 | 12 | 未精确计时 | 回填与提交 |
| 合计 | 660 | 371 | 会话约 60 min（08:59–09:56） | 工具等待占多；不把等待当有效工时 |

### 11.2 E1–E15 结果

| 编号 | 结果（通过/例外/未测） | 证据 | 备注 |
|---|---|---|---|
| E1 | 通过 | b19/b22/b24/b26 截图 | 四关各自进入、完成、结果、再玩/回标题 |
| E2 | 通过 | b29-normal-p024/p025、b29-nodoor-p025、存档 flags | 带门板与不带门板两条路径都到 p025；两栏动态 |
| E3 | 部分通过 | B21 75.0s、B25 90.0s；参数表 | 超时/上限实测；真人含结算 60–90s 未计时（步骤七） |
| E4 | 通过 | b21/b23/b25/b27 | 超时/追兵/少渡/熄灯都不重开、不 Game Over |
| E5 | 通过 | C18/C19/C23、结果截图 | 无 success/score/星级/成功失败大字 |
| E6 | 通过 | b20-*、b20-pause-touch | 844×390 触摸；暂停 52×52 物理；无 hover 依赖 |
| E7 | 通过 | b28-* | 暂停+hidden 5s 后 71.5s 仍 active；Esc 可开/关 |
| E8 | 通过 | b29-p024-refresh/p025-refresh | p024 重开、p025 重建；存档仍 11 键 |
| E9 | 部分通过 | S28–S32、b29 flags | 门板写回实测；弃物/渡船/攀索写回代码+烟测，章节留步骤五 |
| E10 | 通过 | B30 http/file、C23 | 0 外部请求；无图片/音频/字体；单画布 |
| E11 | 通过 | check-build 23/23、smoke 33/33、N1–N4 | 四负例均报红，恢复后 23/23 |
| E12 | 部分通过 | B19–B30、run-log | Edge 156 全部有结果（B25 例外）；Chrome/Safari/真机未测（步骤七） |
| E13 | 通过 | C22、run-log | tuning/schema/ui/test/quality/script 与代码一致 |
| E14 | 通过 | 本卡 §11.5 | 主提交 9a1cdc3；回填提交与 tag `step-4-done` 见 git log |
| E15 | 通过 | tuning 台账 | 目标 45+50+60+50+4×20=285s；上限 75/80/90/75 |

### 11.3 B19–B30 结果

| 编号 | 场景 | 环境 | 结果 | 截图 |
|---|---|---|---|---|
| B19 | 门板 1280 成功 | Edge/file | 通过：6/6；带门板/药/青稞/铁锅，留雨布/布鞋；无 success | b19-door-1280 / -result / -keyboard-result |
| B20 | 门板 844×390 触摸 | Edge/触摸模拟 | 通过：canvas 693×390；暂停 52×52；触摸完成；无横向滚动 | b20-door-844x390 / -result / b20-pause-touch |
| B21 | 门板超时 | Edge/时钟 | 通过：75.0s，reason=time；不重开 | b21-door-timeout |
| B22 | 弃物正常 | Edge/file | 通过：2 批（电台/银元→药箱）；追兵 45s | b22-abandon-first / -result |
| B23 | 弃物重物/追兵 | Edge/file | 通过：3 件重物→21.6s 追兵 0；无“X 光机” | b23-abandon-heavy / -enemy-zero |
| B24 | 渡船 trust0 | Edge/file | 通过：4 船，5/6 锁；1 趟 12s；90s 时间到 | b24-boat-trust0-depart / -arrive / b24-boat-result |
| B25 | 渡船疲劳/休息 | Edge/file | 通过（例外）：4 往返疲劳 96，出程 0:13；休息 72→60；100 硬闸 90s 内不可达 | b25-boat-fatigue96 / -soft-depart / -rest60 / -soft-result |
| B26 | 攀索全中 | Edge/file | 通过：22 步/36.0s；reached 22、lost 0；9 次火墙点击 | b26-climb-all-hit |
| B27 | 攀索点空/火墙 | Edge/file | 通过：2 次点空+火墙失败；继续空点至 lost 22；无姓名/血 | b27-climb-fire / -miss-result |
| B28 | 暂停/切页 | Edge/file | 通过：暂停+hidden 5s 不偷时间；71.5s 仍 active；Esc 可开/关 | b28-minigame-pause / -visibility-pause / -after-resume-71s |
| B29 | 刷新 p024/p025 | Edge/file | 通过：p024 刷新 active；p025 刷新重建；无门板空栏已修 | b29-normal-p024 / -p024-refresh / -normal-p025 / -p025-refresh / -nodoor-* |
| B30 | Console/离线 | Edge/file+http | 通过：0 console error、0 404、0 外部请求；DPR2 2560×1440；1366 无溢出 | b30-dpr2 / b30-1366x768 |

### 11.4 偏差与欠账

- **B25 疲劳 100 硬闸不可达（中）**：90s 内最多 4 个完整往返 + 第 5 次出程，疲劳上限 96；`fatigueHard=100` 只有代码守卫，玩家在时限内触发不了。影响：休息机制可验证，但“疲劳到 100 必须歇”只在代码层成立。归属：步骤七若仍有时间，考虑 fatiguePerLeg 16 或 duration 100，先改 docs/RULES 再改代码；本步不擅自改数值。
- **B27 空点自动累计（低）**：火墙失败后不再点击，系统每 1.8s 自动熄一盏，最终 lost 16 结束；这是“站着不动”的合理失败，不是重复惩罚。T12 另测 2 次点空 + 20 次命中 → lost 2 / reached 20，证明可控失败。
- **E3 真人时长未测（中）**：只测了参数与超时（75/90s），没有真人从进入玩到结算的 60–90s 计时；步骤七完整通关时补。
- **E9 后三关写回未走章节（中）**：弃物/渡船/攀索的 `applyMinigameResult` 只有代码与烟测，第一章起未接入，无法在正常流程写 flags；步骤五接章节后补 B 级→A 级。
- **浏览器只有 Edge（中）**：Chrome/Safari、真机触摸、隐私模式禁存储未测；步骤七补。
- **20 分钟完整通关未测（高）**：本步只测四关 285s 目标；步骤七用完整流程计时。
- **第 5 关/音频未做（按计划）**：探路/分粮留完整版；音频步骤六；不在本步验收。
- **全局 48px 暂停热区仍在（低）**：步骤三 B16 例外；小游戏内已用 96 逻辑（844×390 下 52 物理），不沿用旧例外。
- **文案欠账**：`docs/demo-script.md` 第 30 行仍写“拖 X 光机”，步骤八演示前必须改为“三百斤的箱子”。
- **实现取舍**：结果页焦点落在 `#vn-result`（tabindex=-1）而不是底部按钮，避免 560×380 可滚区域把标题滚出首屏；Tab 仍可到“继续/再玩”。
- **文档口径**：本卡附录 A 写“trust 0–5 → 12/18/24/30/37”，实现与 tuning 是 trust 0–6 → 12/18/24/30/37/37/37；trust 6 视同上限，不影响本步四关。

### 11.5 状态更新与提交

- 2026-11-02 更新 `.claude/CLAUDE.md` 步骤表与“当前进度”；提交范围：`project/`、`docs/`（含 minigame-system/run-log 证据）、`step/step-04-核心小游戏.md`。
- commit/tag：主提交 `9a1cdc3`（步骤四代码与文档）；回填本卡后另提交一次并打 tag `step-4-done`。证据截图在 `docs/evidence/step-04/`，按项目规则 gitignored，不入库。
- 提交前检查：`git status` 只含本步预期文件；无字体/zip/大图入库；检查脚本 23/23、33/33、check-script 全绿。

### 11.6 一句话交接

- 四关已可独立试玩并接入 p024→p025，失败只结算代价、不重开；p025 动态两栏且刷新可重建；欠账是 fatigue 100 在 90s 内不可达、后三关章节写回、真人时长与 Chrome/Safari/真机。

## 附录 A 数值表（RULES 唯一来源）

| 关 | duration | 其他 | 目标 | 结算 | 含结算目标 |
|---|---:|---|---:|---:|---:|
| door | 75 | capacity 6；doorCost 2；items 8；warnAt 10 | 45 | 20 | 65 |
| abandon | 80 | batches 2；quota 3；items 6；enemy 45；heavyPenalty 8 | 50 | 20 | 70 |
| boat | 90 | boats 6；capacity 8；crewPerBoat 3；plannedTrips 18；outbound 12；inbound 12；fatiguePerLeg 12；fatigueSoft 80；fatigueHard 100；rest 12；restRecovery 12；enemy 120 | 60 | 20 | 80 |
| climb | 75 | spans 3；lights 22；stepMs 1800；hitWindow 0.35；fireAt 6/12/18；fireTaps 3；fireWindowMs 1500 | 50 | 20 | 70 |

渡船公式：

- 船工 = trust 0–5 → 12/18/24/30/37。
- 可用船 = min(6, floor(船工/3))。
- 单程 = max(9, 12 − floor(船工/12))；疲劳≥80 再 +4；返程 12。
- 18 趟 = 6 船 ×3 趟；到 18 提前结束。

门板公式：

- usedSlots = door?2:0 + Σ item.slots；capacity 6。
- 固定 roster/pencil slots 0；item.door 不由本关改。

攀索公式：

- unlit = 22 − reached − lost；reached+lost ≤22。
- fire 惩罚 = −5 × min(lost,3)。

## 附录 B 物品表

### B1 门板

| id | 显示 | 格 | 固定 | 说明 |
|---|---|---:|---|---|
| door | 门板 | 2 | 是 | item.door=true 才出现；不可丢；不占选择 |
| roster | 花名册 | 0 | 是 | 随身；结果 note |
| pencil | 铅笔 | 0 | 是 | 随身；结果 note |
| medicine | 药 | 1 | 否 | 少带影响湘江代价 |
| barley | 青稞 | 1 | 否 | 少带影响体力叙事 |
| pot | 铁锅 | 2 | 否 | item.pot |
| raincloth | 雨布 | 1 | 否 | 无 flag |
| shoes | 布鞋 | 1 | 否 | 无 flag |

### B2 弃物

| id | UI 显示 | 重物 | 说明 |
|---|---|---|---|
| xray | 三百斤的箱子 | 是 | 不写 X 光机 |
| press | 印刷机 | 是 | 重物 |
| files | 文件箱 | 是 | 重物 |
| medkit | 药箱 | 否 | 留下 fire−15 |
| radio | 电台 | 否 | 可保 |
| silver | 银元 | 否 | 可保 |
| door | 门板 | 否 | 仅 item.door=true 出现；留下则 item.door=false |

## 附录 C 坐标与界面

| 元素 | 坐标/尺寸 | 备注 |
|---|---|---|
| 画布 | 0,0,1280×720 | 设计坐标；DPR 上限 2 |
| HUD | 0,0,1280×72 | 标题/计时/计数；aria-hidden |
| 帮助 | 0,660,1280×60 | 一行操作提示；26px |
| 暂停 | 1168,24,96×96 | #minigame-pause；z41 |
| 门板行囊 | 120,90,820×380 | 3×2 格；门板 2×1；锅 1×2 |
| 门板货架 | 80,500,880×140 | 5 张 160×120；间隙 20 |
| 门板按钮 | 1000,540,200×96 | 系好行囊 |
| 弃物卡区 | 80,180,1120×300 | 7 张 150×180；间隙 12 |
| 弃物船上槽 | 200,510,600×100 | 3 个 180×96 |
| 弃物发船 | 900,540,200×96 | 1–3 件可发 |
| 渡船船区 | 80,160,1120×380 | 2×3；每船 340×170 |
| 渡船休息 | 船内右下 96×96 | 不派船 |
| 攀索 | 全画布 | 点击任意处；核心在下半屏 |
| 结果 | 360,170,560×380 | 两栏 + note + 继续 96 |
| 暂停遮罩 | 全屏 z80 | 复用 #pause |
| toast | 全屏 z90 | 复用 |

## 附录 D 结果对象示例

门板：

  { gameId: "door", reason: "time", elapsed: 74.2,
    carried: [{id:"door",label:"门板"},{id:"medicine",label:"药"}],
    left: [{id:"pot",label:"铁锅"},{id:"barley",label:"青稞"}],
    stats: { capacity:6, used:3, door:true } }

弃物：

  { gameId: "abandon", reason: "done", elapsed: 41.8,
    carried: [{id:"medkit",label:"药箱"},{id:"radio",label:"电台"}],
    left: [{id:"xray",label:"三百斤的箱子"},{id:"door",label:"门板"}],
    stats: { batches:2, heavyCarried:0, enemyRemaining:45 } }

渡船：

  { gameId: "boat", reason: "time", elapsed: 90,
    carried: [], left: [],
    stats: { trips:12, plannedTrips:18, boatmen:12, boats:4 } }

攀索：

  { gameId: "climb", reason: "done", elapsed: 51.3,
    carried: [], left: [],
    stats: { reached:19, lost:3, unlit:0 } }

以上对象都不含 success/score；reason 只表示结束方式。

## 附录 E 测试矩阵

### E1 用例

| 用例 | 入口 | 关键动作 | 预期 |
|---|---|---|---|
| T08 | ?minigame=door&door=1 | 门板+锅+2 件；完成 | carried 5 卡；p025 动态；无评分 |
| T09 | ?minigame=door&door=0 | 不选，等超时 | 只带固定；不重开；可继续 |
| T10 | ?minigame=abandon&door=1 | 第一批三件重物；追兵 | 追兵 21s；第二批紧张；door 留下则 false |
| T11 | ?minigame=boat&trust=0 | 派 4 船；休息；再派 | 只有 4 船；疲劳/休息可见；trips 正确 |
| T12 | ?minigame=climb | 故意点空 3 次；火墙失败 | lost 增加；不重开；无姓名 |

### E2 负例

| 负例 | 注入 | 期望 |
|---|---|---|
| N1 | RULES.door.duration=120 | C18/C22 报红 |
| N2 | result 加 success:true | C18 报红 |
| N3 | 删除 #minigame-canvas | C03/C19 报红 |
| N4 | lights_lost 写成字符串 | C21/S31 报红 |

### E3 浏览器

B19 门板 1280；B20 门板 844×390 触摸；B21 门板超时；B22 弃物正常；B23 弃物重物；B24 渡船 trust0；B25 渡船疲劳；B26 攀索全中；B27 攀索失误；B28 暂停/切页；B29 刷新；B30 Console/离线。

## 附录 F 文件树与命令

  project/
    index.html
    style.css
    engine.js
    story.js
    minigames.js
    art.js
    tools/
      check-build.js
      smoke.js
      check-script.js
      count-words.js
  docs/
    minigame-system.md
    minigame-tuning.md
    state-schema.md
    ui-layout.md
    test-cases.md
    quality-bar.md
    script/
    evidence/step-04/run-log.md
  step/
    step-04-核心小游戏.md

命令（开发期，不进运行时）：

  node --check project/minigames.js
  node --check project/engine.js
  node --check project/story.js
  node project/tools/check-build.js
  node project/tools/smoke.js
  node project/tools/check-script.js docs/script

浏览器：

  Start-Process ".\project\index.html"
  python -m http.server 8080 --directory project

本计划到此结束。执行时先做 T4.0，不要先写 minigames.js。