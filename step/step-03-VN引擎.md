# 步骤三执行卡 · VN 引擎

> **所属步骤**：步骤三 VN 引擎（对应《向北-项目计划书》执行步骤 5）。
> **状态源**：进度、步骤表与红线以 .claude/CLAUDE.md 为准；本文件只写“怎么做、做到什么算完成”，不另存进度。
> **当前状态**：步骤零、步骤一、步骤二 ✅（tag 分别为 step-0-done、step-1-done、step-2-done）；步骤三 ⬜ 未开始。本文件是步骤三的执行计划，执行前不应把步骤三改成 ✅。
> **本步骤出口（逐字引 CLAUDE.md）**：完整播放一章；旗标生效；存档/读档；超时选项有代价。
> **时间盒**：标准 9 小时 30 分（570 分钟）；压缩 5 小时 20 分（320 分钟）。时间盒只含本步 T3.0–T3.11，不含步骤四小游戏。
> **不可逆动作**：本步没有。部署上线、覆盖线上版本、重置存档格式、公开发布视频都不在本步；提交与打 tag 是本地版本动作，执行前仍按项目规则确认。
> **证据级别**：A 浏览器实测（截图/录屏/控制台）；B 代码完成未跑；C 设计稿/口述；D 未验证。没有实际运行就写“未验证”，不把“写了”说成“能玩”。

## 0 一页速览

### 0.1 本步到底做什么

把步骤一的“能翻 20 句”升级成“能完整演完序章”的 VN 引擎：

1. **节点图**：把只能线性推进的 stack 结构，换成“固定顺序数组 + 可选 when 条件 + 按 nodeId 恢复”的扁平节点图；存档只存 nodeId，刷新能回到原句，分支能跳。
2. **序章全量**：p001–p020 保持逐字不动；追加 p021–p044，覆盖两个限时选项、门板/不留门板两条分支、回头/不回头两条分支、小游戏 seam、结算、标题卡、史实注、end；p900 改为 next=xiangjiang。
3. **阅读器**：打字机、点击/空格推进、自动、跳过、分页；正文仍是一行 66px 的框，但长句按页显示，不破版。
4. **选项**：8 秒倒计时、默认项、超时结算、cost 始终可见、choice.* 旗标、choices 日志严格按 state-schema。
5. **仪式层**：新游戏章节标题卡、p043“第一章 · 湘江”标题卡、史实注弹窗、暂停、设置面板、结果页。
6. **存档**：继续用 xiangbei.save.v1，不新增存档键、不升级版本；补 flags 默认值、choices/codex 校验、inventory.door 镜像；旧档能打开。
7. **验证**：check-build 从 12 项到 17 项（新增 C13–C17）；smoke 从 17 项到 26 项（新增 S18–S26，并同步改 S06/S07/S10/S12/S14）；浏览器 B1–B18。

### 0.2 任务总表

| 卡 | 任务 | 主要产出 | 完成判据 | 标准 min | 压缩 min |
|---|---|---|---|---:|---:|
| T3.0 | 先改文档 | script/README 节点契约；state-schema 默认值/日志；ui-layout 新坐标 | 三份文档能回答“节点长什么样、存档写什么、界面在哪” | 40 | 25 |
| T3.1 | 核心节点图 | engine.js 的 XB.core：when、setFlag、applyChoice、firstVisible、按 id 恢复 | Node 单元全绿；不再依赖 stack | 60 | 35 |
| T3.2 | 序章数据 | story.js version 2；p021–p044；7 张 codex；p900 | 48 节点 / 41 line / 2 choice；p001–p020 逐字不变 | 50 | 30 |
| T3.3 | DOM 与样式 | index.html 九个新容器；style.css 阅读器/选项/弹窗/设置样式 | 开发者工具中元素齐全；44px 热区；无散落 hex | 35 | 20 |
| T3.4 | 打字机与分页 | 逐字显示、补全、翻页、measure 分页；textScale | T03 过；1.0/1.15/1.3 三档不溢出不裁字 | 55 | 30 |
| T3.5 | 选项与限时 | 2 个 choice 渲染；8s 计时；超时默认；choices 日志 | T04、T05 过；B3/B4 四路径旗标正确 | 55 | 30 |
| T3.6 | 标题卡与史实注 | 新游戏章节卡；p043；#codex 弹窗；7 张数据 | T02 过；B10 过；关闭后能到 p900 | 55 | 30 |
| T3.7 | 暂停与设置 | 暂停第 4 按钮；设置 6 项；字号/速度即时生效 | 设置改后立即生效、刷新保留；Esc 可开可关 | 50 | 30 |
| T3.8 | 自动/跳过/结果/seam | auto、skip、seen；p025 result；p024 minigame seam | B7/B8/B9 过；seam 明示步骤四；无评分 | 40 | 20 |
| T3.9 | 工具与测试 | check-build C13–C17；smoke S18–S26；负例 | 17/17、26/26；四个负例能报红 | 50 | 25 |
| T3.10 | 浏览器实测 | Edge B1–B18；截图/run-log | A 级证据；控制台 0 error | 60 | 35 |
| T3.11 | 复核与交班 | §11 回填；CLAUDE 步骤表；提交/tag | step-3-done；欠账写清 | 20 | 10 |
| **合计** |  |  |  | **570** | **320** |

### 0.3 本步完成定义（可逐条勾）

1. 从标题点“开始”，出现“序章 · 于都”标题卡，读完 p001–p044，p900 结束回地图；带门板/不带门板、回头/不回头四条路径都能走通；两次通关能覆盖 41 个 line 节点。
2. 两个选择都能选 A/B；选后 debug 里 item.door / choice.prologue.lookback / fire / load 正确；限时 8 秒倒计时到 0 时按默认项结算，choices 日志的 option、text、timedOut 正确，cost 始终看得见。
3. 在 p020 或选项节点刷新，回到原节点；settings、codex、flags、choices 保留；坏档不白屏。
4. 打字机、点击/空格、自动、跳过、暂停、设置、标题卡、史实注弹窗、结果页都能操作；Console 0 error；check-build 17/17、smoke 26/26。
5. 明确记录：门板小游戏在 p024 是**可见 seam**，不是已实现小游戏；7 张图鉴页、完整第一章、音频、20 分钟实测都不在本步完成。

### 0.4 先文档后代码

T3.0 必须先落盘，理由是：节点图契约会同时影响 story.js、engine.js、check-build、smoke 和后续步骤四/五；如果先在代码里试，文档会和实现分叉。T3.0 只改文档，不改代码，完成后再进 T3.1。

## 1 起点盘点

### 1.1 已经有的

| 资产 | 现状 | 本步怎么用 |
|---|---|---|
| 舞台与场景 | 1280×720，#stage，title/map/vn，#stage-art 单画布 | 不动舞台比例；新增 VN 内层容器 |
| 三个主场景 | 标题、地图、VN 显隐；暂停遮罩 | 保留；VN 增加工具条/选项/标题卡/弹窗 |
| XB.core | 830 行 engine.js 上半；线性 stack；每 beat 存档 | 替换为扁平节点图；保留存档键与公开 API 风格 |
| 序章 20 句 | p001–p020 逐字；p001 河、p006 夜 | 逐字保留；从 p021 继续 |
| 存档 | xiangbei.save.v1；11 个持久键；坏档 .bad/.bak | 继续 v1；补 flags 默认与日志校验 |
| 场景美术 | art.js 四场景 title/map/yudu_river/yudu_night | 新增 VN 节点只用这两个 bg；不改 art.js |
| 组件壳 | 10 类 xb-*；ui-preview；对比度已修 | 直接用；只补运行时需要的布局 |
| 工具 | check-build 12 项；smoke 17 项；check-script；count-words | 扩到 17/26；同步改受影响旧项 |
| 文档 | script/README、state-schema、ui-layout、codex、test-cases | T3.0 修改三份；codex 作为数据源 |

### 1.2 当前的硬缺口

| 缺口 | 具体表现 | 影响 |
|---|---|---|
| 不能按 id 恢复分支 | core 用 stack，stack 不存档；advance 只 index+1 | 选项后无法跳分支，刷新无法回到分支中间 |
| 没有 when/set | 只能靠函数里手写 if；没有通用条件/赋值 | 双门板、双回头、后续章节都要复制逻辑 |
| 只有 20 句 | story.js 只到 p020 + p900 | 序章 41 beat 只演一半；T02/T03/T04/T05 无法验收 |
| 没有 choice 运行时 | UNIMPLEMENTED 包含 choice | 点了没有选项；T04/T05 不成立 |
| 没有打字机/分页 | 直接 textContent 整句 | 不是 VN；长句在 66px 框里可能被裁 |
| 没有标题卡/史实注 | 只有组件壳 | T02 不成立；7 张图鉴没有入口 |
| 没有设置 UI | settings 有字段，但无面板、无应用 | textScale/textSpeed 改了不生效 |
| p900 next=map | finishChapter 只 toast | 完成序章不能解锁湘江；T07 不成立 |
| 标题版本行旧 | index 仍写“步骤二 · 人物虚构，非史料人物” | 交付文案过期 |
| 测试依赖旧结构 | S06/S07/S10/S12/S14 依赖 20 句/stack | 改 core 后会红，必须同步改 |
| 证据只有 Edge | 步骤二 B1–B14 是 Edge headless | Chrome/Safari/真机触摸留步骤七；本步只报 Edge |

### 1.3 当前基线数字（写计划与验收时引用）

- 剧本总量：4108 字 / 229 beat / 12 抉择点 / 26 选项 / 9 限时；A 口径 11:22；整章含小游戏 19:44。
- 序章：837 字 / 41 line beat / 2 抉择 / 4 选项 / 2 限时；口播 2:19，文档头标 3:33（含演出余量）。
- 本步 story：48 节点 = 41 line + 2 choice + 1 minigame seam + 1 result + 1 title + 1 codex + 1 end。
- 本步 tool：check-build 17 项；smoke 26 项。
- 当前体积：style.css 26042 B（gzip 5537）；engine.js 26485 B（gzip 7968）；story.js 4159 B（gzip 1626）；index.html 3493 B（gzip 1470）。
- 预算：JS ≤150 KB gzip、CSS ≤30 KB、字体 ≤300 KB、0 外部图片/音频。本步不打包字体，不新增图片/音频。

## 2 不变量（做任何任务卡都不能破）

### 2.1 叙事与史实

1. 不改七段结构；不新增分支结局；不出现 Game Over；失败只改变代价。
2. p001–p020 逐字保留；p021–p044 只从 docs/script/00-prologue.md 誊写，不改写、不加现代梗、不让真实领导人开口。
3. 不把《七根火柴》《金色的鱼钩》等文学当史料；7 张史实注只用 docs/codex.md 原文，标注类型/出处/争议/虚构声明。
4. 门板/回头两条分支是道德取舍，不是“正确/错误”；结果页不评分、不打勾、不给星级。
5. 小游戏 seam 必须明示“步骤四接入”；不能在标题、HUD 或验收里暗示小游戏已可玩。

### 2.2 结构与存档

1. 存档键仍是 xiangbei.save.v1；不加键、不升版本、不重置格式；旧档必须能打开。
2. 场景仍只用 title/map/vn；choice/codex/title/result/minigame 是 VN 内的覆盖层，不改 scene 值。
3. 节点 id 全局唯一；p001–p020 不改名；p900 保留 id，只改 next。
4. 持久化只写 state-schema 里的键；不把临时 UI 状态写进 flags。
5. 每句 line 推进、每个选项结算、小游戏 end、设置变更、结局都要 saveNow；保存失败只提示一次，不白屏。

### 2.3 表现与交互

1. 1280×720 设计坐标；不新增第二张全屏画布；#stage-art 仍是唯一全屏画布。
2. 标题 96px、印章 360,150、菜单 120,360 不动；10 类 xb-* 类名不改；只加运行时布局。
3. 正文框仍 60,560,1160×118；正文区 86,586,1108×66；一行 26px/1.8；分页解决长句，不靠缩小字号硬塞。
4. 颜色只在 :root；组件只用 var()；朱砂小字只放纸白/paper-hi；夜蓝上用纸白/火橙。
5. 热区 ≥44px；pointer 事件；不依赖 hover；焦点 2px 朱砂 + 2px 纸白内衬；Esc/Enter/空格/1–3/Tab 可用。
6. prefers-reduced-motion 与 settings.reducedMotion 生效：不做打字机逐字、不做自动延迟以外的动画。

### 2.4 范围

1. 不写门板/弃物/渡船/攀索小游戏；不引入 XB.minigames 调用；p024 只显示 seam。
2. 不做 7 卡图鉴页；只做单张史实注弹窗 + 7 张内联数据。
3. 不做音频；settings 的音量/静音先存值，面板明示“步骤六接入音频”。
4. 不做结局五卡/点名；ending 场景留步骤五。
5. 不 deploy、不发布视频、不打字体包、不改 state-schema 键名。

## 3 文件级产出清单

### 3.1 新建

| 文件 | 作用 | 是否进运行时 |
|---|---|---|
| docs/visual-reading.md | VN 阅读器/分页/选项/标题卡/弹窗/设置的实现说明与边界 | 否（文档） |
| docs/evidence/step-03/run-log.md | B1–B18 的日期、环境、结果、截图名、例外 | 否（gitignored 证据） |

### 3.2 修改

| 文件 | 改什么 | 不改什么 |
|---|---|---|
| docs/script/README.md | 节点契约、when/set、choice 字段、步骤三只追加规则 | 不改 4108/229/41 等统计；不改已有正文 |
| docs/state-schema.md | flags 默认表、choices 日志、inventory.door 镜像、v1 兼容 | 不新增键、不升版本、不改五卡触发 |
| docs/ui-layout.md | 工具条/选项/标题卡/史实注/结果/seam/设置坐标；标题版本行 | 不改 1280×720 与已有三场景大坐标 |
| project/index.html | 新容器与按钮；脚本顺序不变；标题版本行 | 不新增第七个运行时文件；不改 #stage 结构 |
| project/style.css | VN 阅读器/选项/标题卡/弹窗/设置/结果/seam 样式 | 不改 :root 外的颜色；不重写 10 类组件壳 |
| project/engine.js | core 节点图 + engine 渲染/输入/计时/设置/存档 | 不改 SAVE_KEY、PERSIST_KEYS、场景 8 值、错误卡逻辑 |
| project/story.js | version 2；p021–p044；codex 7；p900 next | 不改 p001–p020；不写小游戏逻辑 |
| project/tools/check-build.js | C13–C17；C03/C07 同步 | 不降已有 C01–C12 标准 |
| project/tools/smoke.js | S18–S26；改 S06/S07/S10/S12/S14 | 不删原有覆盖点 |
| .claude/CLAUDE.md | 步骤三完成后的状态、证据、欠账 | 执行前不改状态 |

### 3.3 不碰

- project/art.js：四场景已够用；本步只调用 paint，不改绘制。
- project/minigames.js：保持空壳；engine 不引用 XB.minigames。
- project/tools/ui-preview.html / ui-preview.js：组件壳已够；本步不把 demo 塞进去。
- docs/codex.md：作为数据源读，不改正文；若发现错字只记录，不在本步改史实。
- docs/test-cases.md：T01–T20 编号固定；本步只引用，不新增 T21+。
- docs/quality-bar.md：预算不变；本步按它验收，不改标准。

## 4 关键决策（写代码前先认这些）

### L1 先做“完整序章 VN”，不冒充完整小游戏

- 选择：本步把序章的 41 个 line、2 个 choice、minigame seam、result、title、codex、end 全部接进 VN；p024 显示可见的“门板小游戏 · 步骤四接入”面板，点继续按“已带走/已留下”进入 p025。
- 理由：步骤三出口是“完整播放一章；旗标生效；存档/读档；超时选项有代价”，它验的是 VN 引擎；门板小游戏是步骤四出口。若本步塞一个假小游戏，会同时破坏两个步骤的证据边界。
- 代价：本步结束时不能声称“序章完整可玩（含小游戏）”；只能声称“序章 VN 完整、门板关为 seam”。这个欠账写进 §11 与 CLAUDE.md。
- 替代方案（不选）：先做门板小游戏再做 VN——会让故事数据、core、UI 同时变化，违反“一次只改一个变量”。

### L2 扁平条件节点图，不用 stack/分支数组

- 选择：每章是一个按顺序排列的节点数组；节点可有 when 字符串；同一位置只保留一个可见节点；用 nextVisible 从当前 index 往后找第一个条件为真的节点。不用 stack，不用 if 生成的嵌套分支数组。
- 理由：stack 不存档，无法按 nodeId 恢复；分支数组会让 p001–p020 的 id 与索引关系变复杂，check/smoke 难写。扁平数组让“存档只存 nodeId”成立，步骤四/五也能继续追加。
- 代价：when 必须写对；隐藏节点仍占位置；id 必须全局唯一。
- 替代方案（不选）：给 stack 帧加存档——会把“位置”变成 index + 帧，迁移复杂，旧档风险大。

### L3 choice 数据形状与旗标

- 选择：choice 节点固定字段 id / type / record / timeout / defaultOption / prompt / options；选项固定 key / text / value / set / cost。record + value 写 choice.*；set 支持赋值、+N、-N。
- 理由：state-schema 已把 choice.* 定义为旗标；把“记录值”和“文案”分开，避免用选项文本当状态。cost 必须原样显示，不能藏在 tooltip。
- 代价：story.js 每个选项多两个字段；C14 要检查完整性。
- 替代方案（不选）：用 option 下标记录——刷新/改文案就错位，不可取。

### L4 打字机 + 分页，保持 118 高对话框

- 选择：保持 60,560,1160×118 与 86,586,1108×66；正文仍是一行；超过 66px 的句子用二分法按字符切成页，点击先补全当前页，再翻下一页，再下一句。字号用 --text-scale（1/1.15/1.3），measure 与正文同字体同宽。
- 理由：步骤二交接明确“正文 66px 只保证单行，换行/分页必须步骤三决定”；增高会破 1280×720 的底部留白与移动端缩放。分页是改动最小、可测试的方案。
- 代价：长句会多一次点击；measure 必须与渲染字体一致；不能用 textContent 直接塞整段。
- 替代方案（不选）：把框增高到 160——会挤压 560 起的对话框与选项区，且需要改 ui-layout 多处。

### L5 标题卡两用：章节入口 + p043

- 选择：新游戏进入序章时生成“序章 · 于都”标题卡；p043 用源文本“第一章 · 湘江”标题卡；全屏 1200ms 自动淡出，点击/Space 立即关闭。resume 不重复章节入口卡；enterStation 只显示 p043 这类 authored 标题卡。
- 理由：T02 要求点“开始”先看到“序章·于都”再进第一句；p043 是剧本里的转场，不是入口卡。两者共用组件但触发不同。
- 代价：startNewGame 从“去地图”改为“直接进序章”；地图不再是新游戏第一站，但完成后仍是 hub。
- 替代方案（不选）：新游戏仍去地图——T02 不成立。

### L6 史实注只做单张弹窗，数据全量内联

- 选择：新增 #codex 覆盖层，从 story.codex[id] 取数据；本步只有 p044 触发 yudu，但 7 张数据全部内联并校验；标题菜单的“史实图鉴”仍是步骤五提示。
- 理由：7 卡图鉴页是步骤五出口；本步只需证明“史实注能打开、能关闭、能解锁、能存档”。数据全量内联可让步骤五直接复用，不必重写文案。
- 代价：story.js 增加 7 张数据；C17 要查完整性。
- 替代方案（不选）：只放 yudu 一张——步骤五还要再补 6 张，容易漏出处。

### L7 自动/跳过是运行时状态

- 选择：auto 在每页完成后 1200ms 推进；skip 只在 settings.skipSeen 为真时显示，只跳“本次页面已读”的 line，遇到未读、choice、codex、title、end 停；seen 集合只存内存，不写存档。
- 理由：跨刷新记忆“已读”需要新增存档键与迁移，超出本步；settings.skipSeen 已足够表达“允许跳读”的偏好。
- 代价：刷新后不能续跳；用户可能觉得 skip 变短；文档写明。
- 替代方案（不选）：把 seen 写进 flags——会污染剧情旗标，且存档变大。

### L8 设置面板放暂停内，改完即存

- 选择：暂停加第 4 个按钮“设置”；设置面板 560×440，含文字速度 10–60、字号 1/1.15/1.3、音量 0–100、静音、减少动效、跳读已读；改动立即 apply 并 saveNow；不做“恢复默认”。
- 理由：settings 字段已存在；本步只需 UI 与即时生效；音频尚未接入，音量/静音先持久化，面板写明步骤六生效。
- 代价：暂停层变高；设置面板需要焦点陷阱。
- 替代方案（不选）：把设置放标题菜单——标题菜单只有 3 项，本步不扩展。

### L9 计时/打字机可暂停

- 选择：暂停、设置打开、页面 visibilitychange 隐藏时，choice 剩余时间与打字机计时冻结；关闭/回到页面恢复；state.paused 不持久化。
- 理由：限时选项不能因为玩家开设置而超时；这是“超时是选择，不是惩罚”的底线。
- 代价：需要保存剩余 ms 与暂停时刻；实现要小心多次暂停/恢复。
- 替代方案（不选）：暂停时继续倒计时——不公平，且 T05 会出现不可复现结果。

### L10 存档仍 v1，只补默认值与校验

- 选择：SAVE_KEY 不动；PERSIST_KEYS 不动；normalize 合并默认 flags（item.door false、fire 50、trust 0、load 0、lights_lost 0）；choices 按 state-schema 校验；codex 只留 7 个已知 id；inventory.door 从 flags 镜像。
- 理由：步骤一已有坏档 .bad/.bak 与 4096 上限；升级 v2 会触发旧档迁移，收益低、风险高。
- 代价：旧档缺 flags 时用默认补齐；choices 旧格式可能被过滤；要在 §11 记录。
- 替代方案（不选）：升 v2 并把 stack 写进存档——与 L2 冲突。

### L11 p900 解锁湘江，但第一章仍不可玩

- 选择：p900 end next=xiangjiang；finishChapter 把 xiangjiang 加入 unlockedChapters，保存，toast“第一章待续”，回地图；第一章 playable 仍 false，地图站标“待续”。
- 理由：T07 只要求“地图出现湘江、未解锁章灰显”；完整第一章是步骤五。
- 代价：T07 通过时不能声称“第一章可玩”；交接写清。
- 替代方案（不选）：本步写第一章开头——会让 story/时长/测试范围失控。

### L12 p024 seam 与 p025 result 明示边界

- 选择：p024 显示“门板小游戏 · 步骤四接入”面板，列出 duration 75s / capacity 6 / doorCost 2 / items 8，按钮“继续（按已选择结算）”；p025 显示“行囊”结果，按 item.door 列带走/留下，不评分、不给成功/失败。
- 理由：让评审看到“这里将来是小游戏”，同时不伪造可玩性；结果页验证 item.door 分支和 UI，不验证小游戏。
- 代价：步骤四要替换这段 DOM/逻辑；交接必须写接口。
- 替代方案（不选）：p024 直接跳过——T04 的“下一句引用门板”仍可测，但评审看不到关卡位置。

## 5 任务卡

### T3.0 先改文档（40 / 25 分钟）

**目的**：把节点契约、存档默认值、界面坐标先写死，避免代码与 docs 分叉。

**输入**：docs/script/README.md；docs/state-schema.md；docs/ui-layout.md；docs/codex.md；docs/test-cases.md；project/story.js 现状；project/index.html 现状。

**动作**：

1. 新建 docs/visual-reading.md，八节：阅读器状态机、打字机/分页、choice 生命期、标题卡、史实注、自动/跳过、设置、错误与降级。每节写“做什么/不做什么/验收”。
2. 改 docs/script/README.md：
   - 第 3 节 if/else/end 行改为“编译为 when 条件节点”，不再说“展开为分支数组”；
   - choice 行补 record / value / defaultOption / cost / timeout；
   - 第 6 节补节点契约：line / choice / minigame / result / title / codex / end 的字段；when 语法只允许 flag 路径、!、&&；
   - 第 7 节补步骤三映射：p001–p020 不动，p021–p044 追加，p900 改 next；分支 id 用主序号+a/b；
   - 明确“本步只做序章，不做第一章”。
3. 改 docs/state-schema.md：
   - flags 默认表：item.door=false、fire=50、trust=0、load=0、lights_lost=0；其余缺省 false/0；
   - choices 日志：字段固定 chapter、nodeId、option、text、timedOut，给两条真实示例；
   - inventory.door 与 flags[item.door] 同步；codex 只允许 7 个 id；
   - 保存点补“每个 line 页完成/选项结算/设置变更/结局”；仍写 xiangbei.save.v1。
4. 改 docs/ui-layout.md：
   - §1 加工具条 912,24、选项 360,300、标题卡全屏、史实注 190,80,900×560、结果 360,220,560×300、seam 360,240,560×260、measure 屏外；
   - §1 补正文分页说明与 1/2 页码；
   - §2 标题版本行改“试玩版 · 人物虚构，非史料人物”；
   - 不改三场景大坐标。
5. 不改代码；不改 test-cases 的 T 编号；不改 codex 正文。

**产出**：docs/visual-reading.md；三份 docs 的 diff。

**完成判据**：一个没看过代码的人，只读三份文档，能回答“节点有哪些字段、when 怎么写、存档写什么、选项日志长什么样、每个新容器在哪”。文档内所有数字与 §1.3 一致。

**常见坑**：

- 在 README 里保留“分支数组”旧说法，代码却用扁平 when——两套契约。
- 把 choices 字段写成 optionText/nodeIndex（步骤一草稿曾出现），与 state-schema 不一致。
- 把标题卡坐标写成 fixed/百分比，实际舞台是 1280×720 绝对坐标。
- 把 step 3 的计划写成“门板小游戏已接入”。

### T3.1 核心节点图（60 / 35 分钟）

**目的**：让 XB.core 支持 when、setFlag、applyChoice、firstVisible、按 nodeId 恢复；保留旧存档兼容。

**输入**：engine.js 的 XB.core；state-schema；docs/script/README 新契约；step-01 的 core API。

**动作**：

1. 删除 startChapter 的 stack、topFrame、currentNode 的栈取法；改为：
   - startChapter(state, chapterId, nodeId)：设 state.chapterId；若 nodeId 为空取 nodes 中第一个可见节点；若 nodeId 不存在回第一个可见节点并 toast；
   - locate(state, chapterId, nodeId) 返回节点与 index；
   - currentNode(state) 用 locate；找不到时回退本章第一个可见节点。
2. 新增 when 求值：
   - isVisible(node, flags)：无 when 为 true；否则按 && 拆分，每项支持 ! 前缀；只读取 flags 路径；缺省 false；
   - firstVisible(nodes, fromIndex, flags)；
   - nextVisible(state, fromIndex)：从当前 index+1 往后找第一个可见节点；找不到返回 null。
3. 新增 setFlag(state, path, valueOrDelta)：
   - 支持 true/false、数字、+N、-N；字符串只认 +N/-N；
   - fire clamp 0–100；trust clamp 0–6；load 整数；
   - item.door 同步 inventory.door；
   - 不创建未知 key（C16 检查；运行时遇到未知 key 报 console.error 并跳过）。
4. 新增 applySet(state, set)：逐项 setFlag。
5. 新增 applyChoice(state, node, option, timedOut)：写 record 旗标为 option.value；applySet；push choices 日志 {chapter,nodeId,option,text,timedOut}；save 由 engine 调。
6. normalize：
   - 合并 flags 默认值（不覆盖已有）；
   - choices 只留合法对象，字段类型不对丢弃；
   - codex 过滤 7 个已知 id；
   - inventory.door = !!flags[item.door]；
   - settings 逐键合并、clamp 保持；
   - 旧档缺 when/set 不影响。
7. serialize 仍输出 11 个 PERSIST_KEYS；不写 stack/seen/auto/skip。
8. 公开 API 增补：firstVisible、nextVisible、isVisible、setFlag、applySet、applyChoice、locateNode；删 topFrame；保留 chapterById/defaults/migrate/normalize/currentChapter/locate/startChapter/currentNode/advance/serialize。
9. 先写单元自测（temporary 或 smoke 草稿），至少覆盖：when 真/假/!、set +2/-15、fire clamp、item.door 镜像、choices 日志、p900 返回 end、找不到 nodeId 回第一句。

**产出**：engine.js 的 XB.core diff；单元结果（可先写在草稿，T3.9 正式进 smoke）。

**完成判据**：Node 里能 new 一个 state，走 p021 选 A，flags.item.door=true、load 增加、fire 增加、choices 有一条；选 B 则相反；p022a/p022b 的 when 正确；p900 仍返回 end。

**常见坑**：

- 继续用 stack 但只把 stack 写进存档——L2 已否决。
- when 用 eval/new Function——离线与安全都不合适；只做路径解析。
- setFlag 静默创建未知 key——后续 schema 会漂移。
- applyChoice 把 option.text 当 record——state-schema 要求 record 是键。
- 忘了 fire/trust clamp，B4 数字会超出 0–100/0–6。

### T3.2 序章数据（50 / 30 分钟）

**目的**：把序章 41 line + 2 choice + 1 seam + 1 result + 1 title + 1 codex + 1 end 全部内联进 story.js；p001–p020 逐字不动。

**输入**：docs/script/00-prologue.md；docs/codex.md；project/story.js；T3.0 的节点契约。

**动作**：

1. 改 story.version=2；保留七章元数据；prologue playable:true；其余六章 playable:false、nodes:[]。
2. p001–p020 原样保留；只允许在 p020 后追加，不改 text/speaker/bg/sfx。
3. 按附录 A 映射追加 p021–p044：
   - p021 choice：record choice.prologue.door，timeout 8，defaultOption A，A set item.door=true/load +2/fire +10，B set item.door=false/load +0，cost 逐字；
   - p022a/p023a（when item.door）、p022b（when !item.door）；
   - p024 minigame door 配置；p025 result；
   - p026–p028；p029a/p029b；p030；
   - p031–p036（p031 bg yudu_river）；
   - p037 choice：record choice.prologue.lookback，timeout 8，defaultOption B，A set true/fire +5，B set false；
   - p038a/p038b；
   - p039–p042（p039 bg yudu_night）；
   - p043 title“第一章 · 湘江”；p044 codex yudu；p900 end next xiangjiang。
4. 新增 story.codex：7 个对象，字段 id/title/type/body/source/note；内容逐字来自 docs/codex.md；不新增第七张之外的 id。
5. 不写任何小游戏逻辑；p024 只带 config 字段。
6. 用 count-words 确认序章仍 837 字/41 beat；用 check-script 确认选项 cost/默认/超时/禁用词。

**产出**：story.js version 2；p021–p044；codex 7。

**完成判据**：48 节点；41 line；2 choice；4 选项；2 限时；p001–p020 文本逐字等于 docs/script 第 9–31 行；p900 next=xiangjiang；无 minigame 逻辑；无 fetch。

**常见坑**：

- 把 p021 写成 p020a——id 规则要求新节点用 p021 起。
- 让 p022a 和 p022b 都无 when，导致两句同时出现。
- 把 p037 的默认项写成 A（源是 B）。
- 把 p043 的“第一章 · 湘江”写成“序章 · 于都”。
- 把 7 张 codex 写成 7 个 line beat——史实注不占字数、不占 beat。
- 把 p024 直接删掉，导致步骤四没有插入点。

### T3.3 DOM 与样式（35 / 20 分钟）

**目的**：给运行时补齐容器，不靠动态创建整页 DOM；让 44px、焦点、层级、颜色令牌都能被 CSS 检查。

**输入**：index.html；style.css；ui-layout T3.0 版；10 类 xb-* 壳。

**动作**：

1. index.html 在 #scene-vn 内加：
   - #vn-toolbar（两个 button：auto、skip；aria-pressed；skip 默认 hidden 由 JS 控制）；
   - #vn-choice-prompt；#vn-choices；
   - #vn-title-card（复用 .xb-title-card 子结构：chapter/sub/rule/seal/continue）；
   - #vn-minigame（seam 面板，含标题、参数说明、继续按钮）；
   - #vn-result（行囊结果，含标题、清单、继续按钮）；
   - #vn-measure（aria-hidden，屏外）；
   - #vn-next 改成可显示“继续 / 1/2”。
2. 在 #pause 内加“设置”按钮；在 #pause 内加 #vn-settings 面板（或与 pause 同级但同一遮罩内），含 6 行控件。
3. 在 #stage 末尾加 #codex 覆盖层（dialog 900×560，190,80；关闭按钮 44；标题、类型、正文、出处、note、关闭）。
4. 标题版本行改“试玩版 · 人物虚构，非史料人物”。
5. style.css：
   - 工具条 912,24，按钮 120×44，gap 8；#vn-chapter 与工具条不重叠；
   - #vn-choices 360,300，宽 560；#vn-choice-prompt 360,262；
   - #vn-title-card 全屏；#vn-minigame 360,240,560×260；#vn-result 360,220,560×300；
   - #vn-measure 屏外、宽 1108、与 .vn-text 同字体/行高/字号；
   - #codex 全屏遮罩 + .xb-modal 900×560；关闭按钮 44；
   - #vn-settings 560×440，行高 56，switch 56×28，slider 240×44，segmented 44；
   - --text-scale 默认 1；.vn-text 与 #vn-measure 用 calc(var(--fs-body) * var(--text-scale))；
   - 所有颜色用 var；不新增 hex；不引入外部字体/图片。
6. 不改 #stage-art；不改 10 类组件类名；不改标题/菜单坐标。

**产出**：index.html 新结构；style.css 新规则。

**完成判据**：浏览器 Elements 中九个新容器存在；每个可点控件 ≥44px；#vn-measure 不可见但可测量；C10/C15 通过；标题版本行不是“步骤二”。

**常见坑**：

- 用 hidden 属性但 CSS 给 display:flex，导致遮罩一直显示——需要 [hidden]{display:none} 或其优先级足够；本步所有覆盖层默认 hidden。
- 把 measure 设成 display:none——无法测量；必须屏外可见。
- 工具条与章节名重叠；912 起点要给暂停 1200 留位。
- 设置面板直接塞进 280 宽的 pause 面板——放不下；用独立 560 宽面板。
- 引入新的 hex 或外部图片——C10/C09 会红。

### T3.4 打字机与分页（55 / 30 分钟）

**目的**：把“整句一次性出现”改成可读的逐字显示，并保证 66px 框内不裁字。

**输入**：T3.3 的 DOM/CSS；story line 节点；settings.textSpeed/textScale；quality-bar。

**动作**：

1. 状态：vnRun = { nodeId, pages:[], pageIndex, charIndex, typing, timer, startedAt, paused, seen }；不写存档。
2. charMs = clamp(1000 / settings.textSpeed, 12, 100)；reducedMotion 或 settings.reducedMotion 时直接整页显示，不逐字。
3. 每次进入 line：
   - 设置正文 fullText；用 #vn-measure 二分分页；
   - 每页内容保证 measure scrollHeight ≤ 66；若单字仍超（1.3 倍下单个汉字行高 60.8px，理论上不会），记录例外并停止分页，不裁字；
   - 页码“1/2”写入 #vn-next；
   - 第一页从头逐字；每帧/定时器只更新 #vn-text 的 textContent。
4. 点击/空格/Enter：
   - typing 中：补全当前页（charIndex=页长），不进入下一页；
   - 当前页完成且有下一页：pageIndex+1，开始逐字；
   - 最后一页完成：markSeen；advanceNode；saveNow。
5. #vn-next 不是独立热区；点击整个 #vn-dialogue 都可推进；按钮类控件优先，不被推进吞掉。
6. 自动：每页完成后 1200ms 调 advance；遇到 choice/codex/title/end 停；暂停/隐藏时清 timer。
7. 跳过：每页立即完成；仅当 settings.skipSeen 且当前 line 在 seen 集合；未读则显示全文并停；choice 停。
8. 暂停：清打字 timer，记录剩余；恢复时从剩余继续；暂停不改变页/字。
9. 字号应用：#stage 上设置 --text-scale（1/1.15/1.3）；切字号后重排当前页，尽量保持当前节点。

**产出**：renderLine/typewriter/paginate/advance 的引擎逻辑。

**完成判据**：T03 连点/空格 5 次不跳句、不卡死；1.0/1.15/1.3 三档不裁字；reducedMotion 直接全文；p040“北。”单字页正常。

**常见坑**：

- 每次点击都从第一页重新开始——用户永远读不完。
- 用固定字符数分页（如 30 字/页）而不测量——标点/字体宽度不同会溢出。
- measure 与正文的 font-family/line-height 不一致——测量无效。
- 暂停后定时器继续跑，恢复时直接跳句。
- 把 textScale 写成 CSS 固定值，设置面板改了不生效。

### T3.5 选项与限时（55 / 30 分钟）

**目的**：让 choice 节点可读、可选、可超时、可记录、可暂停。

**输入**：T3.2 的 p021/p037；T3.3 的 #vn-choices；state-schema 的 choices 日志；T3.1 的 applyChoice。

**动作**：

1. 进入 choice：
   - 隐藏 #vn-dialogue 的推进状态（可保留框，但不再推进）；
   - 显示 #vn-choice-prompt 与 #vn-choices；
   - 每个选项渲染 key、text、cost；cost 始终可见；不显示“正确/推荐”；
   - 焦点到第一个选项；aria-selected 由 class 表达。
2. 计时：
   - timeout 8s 来自节点；剩余时间写 CSS 变量 --choice-progress（0–1）；不每帧写 DOM 文本；
   - 暂停/设置/隐藏标签页：记录剩余 ms，清 timer；恢复继续；
   - 到 0：立即 applyChoice(defaultOption, timedOut=true)，保存，显示“超时：已按默认选项结算”，保留 cost 300ms 后进下一节点。
3. 点击/1/2/Enter：
   - 选中项加 is-selected；锁定其他项；
   - applyChoice(option, false)；saveNow；短暂 240ms 后 advance；
   - 不进 toast 队列，避免与“超时”提示叠加。
4. choices 日志严格写 {chapter,nodeId,option,text,timedOut}；option 是 key，text 是选项文案；不写 optionText/nodeIndex。
5. debug：?debug=1 时显示 nodeId、flags.item.door、flags.fire、flags.load、flags.choice.prologue.door、flags.choice.prologue.lookback、choices.length。
6. 不实现“回退选择”；没有撤销；没有评分。

**产出**：choice 渲染、计时、结算、日志。

**完成判据**：T04 选 A 后 debug item.door=true 且下一句引用门板；T05 超时按默认、timedOut=true、cost 可见；B3/B4 四条路径旗标正确；暂停 8 秒不超时。

**常见坑**：

- 选项按钮只显示文案，不显示 cost——违反选项规则。
- 超时后不写 choices 日志——T05 不成立。
- 超时用 setTimeout 但不随暂停清除——开设置回来直接超时。
- 选项文案太长撑破 560 宽——style-guide 限 14 字；C14 查。
- 选完立刻 advance，把结果页/下一句吞掉——留 240ms 或直接渲染。

### T3.6 标题卡与史实注（55 / 30 分钟）

**目的**：建立章节仪式感与史实注入口，同时不越界做图鉴页。

**输入**：T3.2 的 p043/p044/codex；T3.3 的 #vn-title-card/#codex；T3.1 的 advance。

**动作**：

1. 新游戏：
   - startNewGame 重置 state；直接 startChapter("prologue")，取 p001；
   - 显示 #vn-title-card：chapter“序章 · 于都”，sub“一九三四年十月”，seal“北”；
   - 1200ms 自动关闭；点击/Space 立即关闭；关闭后渲染 p001 并 saveNow。
2. p043 title：
   - 进入 p043 时显示 #vn-title-card：chapter“第一章 · 湘江”，sub 留空，不新写宣传语；不自动跳过剧情；关闭后 advance 到 p044。
3. p044 codex：
   - 打开 #codex，从 story.codex.yudu 取 title/type/body/source/note；
   - 显示“史实”“有不同说法”徽章、出处、虚构声明；
   - 内容区可滚动；关闭按钮 44；Esc 关闭；焦点陷阱；
   - 关闭时把 yudu 加入 state.codex（去重），saveNow，advance 到 p900。
4. 标题菜单“史实图鉴”仍 toast“图鉴页在步骤五”；不打开 #codex。
5. 7 张数据全部在 story.codex；本步只验证 yudu 弹窗，但 C17 检查 7 个 id/字段齐全。

**产出**：标题卡触发/关闭；codex 弹窗；codex 解锁。

**完成判据**：T02 点开始出现“序章 · 于都”再进 p001；B10 p044 打开 yudu、关闭后到 p900；刷新后 codex 含 yudu；标题菜单仍不假装有图鉴。

**常见坑**：

- startNewGame 仍先进地图——T02 不成立。
- 标题卡自动关闭用 setTimeout 但不随暂停/隐藏清除——切标签回来直接进剧情。
- codex 关闭后 advance 两次，跳过 p900。
- 把 7 张 codex 做成图鉴页——超出步骤五。
- 把真实人物写进对白——只允许在 codex 正文。

### T3.7 暂停与设置（50 / 30 分钟）

**目的**：让玩家能暂停、改阅读体验，并且设置立即生效、刷新保留。

**输入**：T3.3 的 #pause/#vn-settings；state.settings；T3.4 的 textScale/typing。

**动作**：

1. 暂停：
   - Esc 或暂停按钮打开；再次 Esc/继续关闭；
   - 暂停面板 4 个按钮：继续、设置、回地图、回标题；
   - 打开时清打字/选项 timer；关闭恢复。
2. 设置：
   - 文字速度：range 10–60，步长 5，显示“30 字/秒”；
   - 字号：segmented 100%/115%/130%，切后立即设置 --text-scale 并重排当前页；
   - 音量：range 0–100（存 0–1），显示“步骤六接入音频”；
   - 静音：switch；存 settings.muted；
   - 减少动效：switch；立即关打字机/动画；
   - 跳读已读：switch；控制 skip 按钮显隐；
   - 关闭按钮 44；Esc 关闭；焦点回到暂停按钮。
3. 所有改动 apply + saveNow；不做“恢复默认”；不改 SAVE_KEY。
4. 设置打开时 choice 计时冻结；关闭恢复；不把 paused 写存档。
5. 标题菜单不加设置入口；本步只在暂停内。

**产出**：pause 第 4 按钮；settings 面板；settings 应用。

**完成判据**：字号 1.3 后正文不裁字；速度 10/60 可感知；刷新后设置保留；暂停 8 秒选项不超时；Esc 可开可关。

**常见坑**：

- 设置改了只写 state 不 apply CSS——看不到变化。
- 字号切换后不重排当前页——仍按旧页宽。
- 暂停时 timer 未清——T05 结果不可复现。
- 音量滑杆显示 0–1 而不是 0–100——用户看不懂。
- 设置关闭后焦点丢失——键盘用户无法继续。

### T3.8 自动、跳过、结果与 seam（40 / 20 分钟）

**目的**：补齐阅读工具与两个非 line 节点，但明确不实现小游戏。

**输入**：T3.3 的 toolbar/#vn-minigame/#vn-result；T3.2 的 p024/p025；T3.4 的阅读器。

**动作**：

1. auto：
   - 点击切换 aria-pressed；每页完成 1200ms 后 advance；
   - 到 choice/codex/title/end 停；暂停/隐藏停；
   - 不写存档；刷新默认关。
2. skip：
   - 仅 settings.skipSeen 时显示；点击切换；
   - 只对本次 seen 中的 line 立即完成并 advance；遇未读 line 显示全文并停；遇 choice/codex/title/end 停；
   - 不写 seen 存档。
3. p024 seam：
   - 显示“门板小游戏 · 步骤四接入”；
   - 列 duration 75s / capacity 6 / doorCost 2 / items 8，说明“本步只验证 VN 衔接”；
   - 继续按钮把当前 item.door 作为结果，进入 p025；不跑小游戏。
4. p025 result：
   - 标题“行囊”；两栏或两行：带走（门板/花名册按 item.door）、留下（水缸/柴/大锅等）；
   - 不评分、不显示成功/失败、不写 flags；
   - 继续进入 p026。
5. 工具条按钮 120×44；aria-pressed；键盘可 Tab 到；不与暂停重叠。

**产出**：auto/skip 状态机；seam/result 面板。

**完成判据**：B7 auto 在 p001 后 1200ms 进下一句、到选项停；B8 skip 只跳已读；B9 seam/result 可按 item.door 显示两张清单；控制台无“未实现”红字。

**常见坑**：

- auto 与打字机 timer 叠加，出现双推进。
- skip 跳过未读，用户第一次就看不到文本。
- seam 假装有小游戏结果，p025 出现“成功/失败”。
- result 写 flags 或给分数——违反“不把牺牲做成分数”。
- 工具条按钮用 hover 才显示——手机不可用。

### T3.9 工具与测试（50 / 25 分钟）

**目的**：把本步契约变成可重复的机器检查，避免“手点看起来对”。

**输入**：T3.1–T3.8 代码；check-build 现有 C01–C12；smoke 现有 S01–S17；docs/test-cases。

**动作**：

1. check-build 新增：
   - C13 序章结构：version=2；prologue 48 节点；41 line；2 choice；1 minigame；1 result/title/codex/end；p001–p020 id 连续；p900 next=xiangjiang；无隐藏 end。
   - C14 选项规则：2 个 choice；record/timeout/defaultOption/options；每个 option key/text/cost；set 在允许表；text ≤14 字；cost ≤22 字；超时默认存在。
   - C15 DOM：index 含 toolbar/choices/title-card/codex/settings/minigame/result/measure；标题版本行已改；无“步骤二”。
   - C16 旗标：story 里所有 when/set 的 key 在 state-schema 允许表；fire/trust 范围；item.door 同步检查。
   - C17 存档/结局：7 个 codex id 齐全；PERSIST_KEYS 未变；end next 合法；无 fetch/ESM/外部 URL。
2. 同步改旧检查：
   - C03 必需 id 加新容器；保留 stage-art；
   - C07 仍要求 art.js API 与 engine 可引用 XB.art；minigames 仍空壳；
   - C05 体积仍 150KB/30KB；
   - C11 bg 仍在 art.SCENES。
3. smoke 新增：
   - S18 defaults 含 flags 默认与 settings；
   - S19 setFlag 赋值/+N/-N/clamp/item.door 镜像；
   - S20 when 真/假/!/&&；
   - S21 applyChoice 写 record/日志/timedOut；
   - S22 序章 48 节点/41 line/2 choice；
   - S23 存档 roundtrip（flags/choices/codex/settings）；
   - S24 p900 end next=xiangjiang；
   - S25 engine 不引用 XB.minigames、story 无 fetch；
   - S26 无隐藏 end（可见路径最终有 end）。
4. 同步改 S06（startChapter 无 stack）、S07（20 句后到 p021 choice，不是 p900）、S10（48 id 唯一/类型）、S12（p001–p020 逐字）、S14（含 7 codex 的存档体积）。
5. 跑四个负例，确认能报红：删一个 choice 的 cost；把 when 写成未知 key；把 p900 next 改成空；把 #vn-choices 改成 div 无非按钮选项。负例只临时改，不提交。
6. 命令（若 shell 可用）：node --check 四个 JS；node project/tools/check-build.js；node project/tools/smoke.js；node project/tools/check-script.js docs/script；node project/tools/count-words.js docs/script/00-prologue.md。
7. 若 shell 仍不可用：用 run_code 的 new Function 做语法检查、用 tools.read/grep 做结构检查；check-build/smoke 标 B 或 D，不写 A。

**产出**：check-build 17 项；smoke 26 项；负例记录。

**完成判据**：17/17、26/26；四个负例至少各自报出对应 C 编号/断言；C05 体积不超。

**常见坑**：

- 只加新检查，不改 S07/S10/S12——旧断言会红，然后被误删。
- C13 用节点总数 48 但当 p900 也算 end——保持计数口径。
- C14 只查字段存在，不查 cost——选项可能无代价。
- C16 允许任意 key——后续旗标会漂移。
- 负例失败后忘记恢复文件。

### T3.10 浏览器实测（60 / 35 分钟）

**目的**：拿到 A 级证据，确认不是“代码看起来对”。

**输入**：T3.9 全绿；project/index.html；Edge；可选 Playwright。

**动作**：

1. 打开 file:///D:/deepseek%20harness/新建文件夹/project/index.html；Console 清空；记录 0 error/0 404/0 外部请求。
2. B1 标题：1920×1080、1366×768、844×390 三档，标题/菜单/印章/门板不出界；版本行正确。
3. B2 新游戏：点开始，出现“序章 · 于都”标题卡；1200ms 后或点击进入 p001；Console 无错。
4. B3 选项 A：p021 选带门板；debug 看 item.door=true、load/fire 增加；p022a/p023a 出现；p029a 出现门板那一行空着。
5. B4 选项 B：重开，选只带花名册；item.door=false；p022b；p029b 出现“一扇门”。
6. B5 超时：p021 等 8 秒；默认 A；choices 日志 timedOut=true；cost 仍可见；p022a 出现。
7. B6 回头：p037 选 A/B 各一次；check flags.choice.prologue.lookback 与 p038a/p038b 对应。
8. B7 打字机：p001 连点 5 次；先补全当前页，再下一页/下一句；不跳句不卡死；1.3 字号不裁字。
9. B8 自动/跳过：开 auto，p001 后自动进下一句，到 p021 停；开 skipSeen 后 skip 只跳已读；刷新后 skip 不记忆。
10. B9 seam/result：p024 显示步骤四提示；p025 按 item.door 显示两张清单；无评分。
11. B10 史实注：p044 打开 yudu；类型/出处/有不同说法/虚构声明可见；Esc/关闭；到 p900 回地图；刷新 codex 含 yudu。
12. B11 暂停/设置：Esc 打开，4 按钮；设置字号 1.3、速度 10、减少动效；刷新保留；暂停 8 秒选项不超时。
13. B12 存档：在 p020 刷新回 p020；在 p021 刷新回 p021；在 p037 刷新回 p037；flags/choices/codex/settings 保留。
14. B13 坏档：手工改 save 的 nodeId 为不存在；刷新应回本章第一句 + 提示，不白屏；备份 .bad；旧 version 过高 .bak（可复用步骤一用例）。
15. B14 地图：p900 后回地图，湘江站出现且可点；第一章仍显示待续/不可玩；prologue 站可重进。
16. B15 键盘：Tab 焦点可见；Enter/空格推进；1/2 选项；Esc 暂停/关闭；不触发隐藏按钮。
17. B16 触摸：DevTools 844×390 + touch；点对话/选项/暂停/设置/关闭都能用；热区 ≥44。
18. B17 http：python -m http.server 8080 --directory project；同流程抽测 p001→p021→p900；Console 0 error。
19. B18 性能/体积：paint 仍 <16ms；打字机无每帧 DOM 爆炸；gzip 体积记录；无外部字体/图片/音频。
20. 证据写 docs/evidence/step-03/run-log.md：日期、浏览器版本、URL、每项结果、截图文件名；失败项写“失败/降级/例外”。

**产出**：B1–B18 记录与截图。

**完成判据**：核心 B2–B14 至少一次 A 级通过；控制台 0 error；失败项有明确例外与补救，不藏。

**常见坑**：

- 只测“能点”，不测超时/刷新/坏档——三项出口没证据。
- 用 Chrome 代替 Edge 却不写浏览器版本——证据不可复核。
- 截图只拍标题——没有选项/史实注/结果页。
- 把 ?debug=1 的调试条当正式 UI 截图——应关掉再拍正式图。
- 手机模拟只点不滑，没测 44px 热区。

### T3.11 复核与交班（20 / 10 分钟）

**目的**：把“做完”变成可交接的状态，不留口头欠账。

**输入**：T3.0–T3.10 产物；本文件 §11；CLAUDE.md。

**动作**：

1. 回填 §11.1–§11.6：每张任务卡实际用时/证据/偏差；E1–E14；B1–B18；欠账。
2. 更新 .claude/CLAUDE.md：
   - 步骤三状态改 ✅（仅当 E1–E14 全过；有例外写“✅ 有欠账”并在当前进度列明）；
   - 当前进度写：48 节点/41 line/2 choice/1 seam/1 codex；check-build 17/17、smoke 26/26；Edge B1–B18；欠账（7 卡图鉴、完整第一章、门板小游戏、音频、Chrome/Safari/真机、20 分钟）。
   - 不改红线、不改验收底线表。
3. 提交：git add 相关文件；commit 信息建议“feat: VN 引擎与序章全量（步骤三）”；tag step-3-done。
4. 若本机 shell 仍不可用：按步骤一/二同样方式手工写 git 对象；在 CLAUDE 与 step 文件记录“真 shell 恢复后需 git fsck/git status 复核”；不声称已推送。
5. 不 deploy、不发布视频、不打字体包、不覆盖线上。

**产出**：回填后的 step-03；更新后的 CLAUDE；commit/tag（或手工对象）。

**完成判据**：§11 无空表；CLAUDE 步骤表与实际一致；tag 存在；欠账有下步归属。

**常见坑**：

- 把步骤三改成 ✅ 但 T05/坏档没测——证据分级造假。
- 只写“全部通过”，不写例外——步骤七会重复踩坑。
- 提交时带上 screenshots/、node_modules/、zip——.gitignore 要先检查。
- 手工 tag 后不记录 hash——后续无法复核。

## 6 时间盒

### 6.1 标准（570 分钟 = 9h30）

| 时段 | 任务 | 累计 |
|---|---|---:|
| 0:00–0:40 | T3.0 文档 | 40 |
| 0:40–1:40 | T3.1 core | 100 |
| 1:40–2:30 | T3.2 story | 150 |
| 2:30–3:05 | T3.3 DOM/CSS | 185 |
| 3:05–4:00 | T3.4 打字机/分页 | 240 |
| 4:00–4:55 | T3.5 选项 | 295 |
| 4:55–5:50 | T3.6 标题卡/codex | 350 |
| 5:50–6:40 | T3.7 暂停/设置 | 400 |
| 6:40–7:20 | T3.8 auto/skip/result/seam | 440 |
| 7:20–8:10 | T3.9 工具 | 490 |
| 8:10–9:10 | T3.10 浏览器 | 550 |
| 9:10–9:30 | T3.11 复核 | 570 |

### 6.2 压缩（320 分钟 = 5h20）

按 T3.0 25 → T3.1 35 → T3.2 30 → T3.3 20 → T3.4 30 → T3.5 30 → T3.6 30 → T3.7 30 → T3.8 20 → T3.9 25 → T3.10 35 → T3.11 10。

压缩时只能砍“重复实测/美化”，不能砍：p001–p020 逐字、两个选项的 cost、超时/暂停、坏档、存档/读档、控制台、tokens 检查。若压缩后仍超时，先减 T3.10 的重复组合（如三档只测 1366 + 844），不减 T3.9 的负例。

### 6.3 脱离时间盒的触发

- T3.1 超过 90 分钟：先停，检查是否在写通用事件总线/抽象层；本步只做路径解析和 4 个操作。
- T3.2 超过 80 分钟：检查是否在改 p001–p020 或重写剧本；改回誊写。
- T3.4 超过 80 分钟：检查是否在追求“完美分页”；允许极端 textScale 降级为整段两行，记录例外。
- T3.10 超过 90 分钟：先完成 B2–B14，B15–B18 记录未测，不假装全绿。

## 7 验收清单

### 7.1 E1–E14

| 编号 | 验收项 | 通过标准 | 对应 T/B | 证据 |
|---|---|---|---|---|
| E1 | 完整序章 VN | 新游戏→标题卡→p001–p044→p900→地图；两条门板×两条回头四路径可走通；两次通关覆盖 41 line | T02/T03/T04/T05/T07；B2–B6 | run-log + 截图 |
| E2 | 打字机/推进 | 连点/空格先补全再翻页再下一句；不跳字不卡死；1.0/1.15/1.3 不裁 | T03；B7 | 录屏/截图 |
| E3 | 选项/旗标 | A/B 旗标正确；debug 可见；cost 始终可见 | T04；B3/B4 | debug 截图 |
| E4 | 超时代价 | 8s 到 0 按默认；timedOut=true；cost 可见；暂停不超时 | T05；B5/B11 | debug/日志截图 |
| E5 | 标题卡 | 新游戏“序章 · 于都”；p043“第一章 · 湘江”；点击/1200ms 关闭 | T02；B2/B10 | 截图 |
| E6 | 史实注 | p044 打开 yudu；类型/出处/争议/虚构声明；关闭到 p900；codex 持久 | T15 部分；B10 | 截图 |
| E7 | 存档/读档 | p020/p021/p037 刷新回原节点；flags/choices/codex/settings 保留 | T06 部分；B12 | 截图/存档 JSON |
| E8 | 暂停/设置 | 4 按钮；6 项设置即时生效；刷新保留；焦点可用 | B11/B15 | 截图/录屏 |
| E9 | auto/skip | auto 到选项停；skip 只跳已读；不写存档 | B8 | 录屏 |
| E10 | seam/result | p024 明示步骤四；p025 按 item.door 两张清单；无评分 | B9 | 截图 |
| E11 | 地图解锁 | p900 后湘江出现；第一章待续；prologue 可重进 | T07；B14 | 截图 |
| E12 | 工具 | check-build 17/17；smoke 26/26；四个负例报红 | T3.9 | 终端输出 |
| E13 | 体积/离线 | JS/CSS 预算内；file:// 可走；无 fetch/ESM/外部请求 | T18；B17 | 体积表/Console |
| E14 | 交付记录 | §11 回填；CLAUDE 更新；tag step-3-done | T3.11 | git tag |

### 7.2 本步不验收（留后续）

| 项 | 为什么不在本步 | 归属 |
|---|---|---|
| 门板/弃物/渡船/攀索可玩 | 步骤四 | 步骤四 |
| 7 卡图鉴页 | 步骤五 | 步骤五 |
| 完整第一章/全七章 | 步骤五 | 步骤五 |
| 结局点名 + 五卡 | 步骤五 | 步骤五 |
| 音频/静音实际发声 | 步骤六 | 步骤六 |
| Chrome/Safari/真机/隐私模式 | 步骤七 | 步骤七 |
| 20 分钟完整通关 | 步骤七 | 步骤七 |

### 7.3 证据分级写法

- A：写了“Edge 156.0.0.0，file://，B5 通过，截图 b5.png，Console 0 error”这类可复核记录。
- B：代码/工具完成但未打开浏览器；写“B，未跑”。
- C：只画了界面/只写了计划；写“C，设计稿”。
- D：未验证；写“D，未测”，不要用“应该可以”。

## 8 风险与返工触发

| 风险 | 概率 | 影响 | 预防/触发 |
|---|---|---|---|
| 分页不准，1.3 字号裁字 | 中 | T03 失败 | measure 与正文同字体；三档实测；极端降级记录 |
| 选项计时与暂停打架 | 中 | T05 不可复现 | 存剩余 ms；暂停清 timer；先测暂停 8 秒 |
| 分支 id/when 写错，某路径缺句 | 中 | 41 line 覆盖不齐 | C13/C14 + 两次通关清点；p022a/b 对照源 |
| 旧档 normalize 过滤掉 choices | 低 | T06 失败 | 保留合法旧字段；坏档回第一句；写迁移说明 |
| 标题卡/设置遮罩 hidden 失效 | 中 | 页面被遮罩挡住 | [hidden] 优先级；打开时 focus trap；先测关闭 |
| content 超过 4096 | 低 | 存档失败 | 7 codex 不写正文，只写 id；S14 量体积 |
| 工具负例误伤正式数据 | 低 | 提交坏数据 | 负例只在临时副本；跑完恢复；git diff 检查 |
| 只测 Edge 就写全绿 | 高 | 步骤七返工 | 明写“仅 Edge”；Chrome/Safari/真机列欠账 |
| seam 被误认为小游戏 | 中 | 评审预期落空 | 面板明示；CLAUDE 欠账；不写“可玩” |
| 为了 auto/skip 新增存档键 | 中 | schema 漂移 | C17 PERSIST_KEYS 不变；seen/auto 不持久 |

**返工触发**：

- p001–p020 任何一个字变化：立即回滚，按 docs/script 逐字恢复。
- T05 超时后没有 cost 或 timedOut：不得进入 T3.6，先修 choice。
- B12 刷新回不到原节点：不得声称“存档/读档”通过。
- check-build/smoke 有红：先修，不把红项改成 skip。
- 出现 Console error：先修，不用“已知问题”盖过去。

## 9 禁区

1. 不新增第七个运行时 JS 文件；不引入框架/构建链/CDN/ES module/fetch 剧情。
2. 不新增 SAVE_KEY、不升 SAVE_VERSION、不改 PERSIST_KEYS；不把 auto/skip/seen/paused 写进存档。
3. 不改 p001–p020 文本；不改七章标题/顺序；不改湘江必败、遵义必开、泸定必夺。
4. 不写真实领导人台词；不把文学当史料；不做血腥特写；不把牺牲做分数。
5. 不做门板小游戏/第一章/7 卡图鉴/结局五卡/音频；seam 必须明示。
6. 不改标题 96px、印章 360,150、菜单 120,360；不改 10 类 xb-* 类名；不新增第二张全屏画布。
7. 不用 hover 作为唯一交互；不缩小热区到 44px 以下；不忽略键盘焦点。
8. 不在 :root 外写 hex；不引入外部字体/图片/音频；不打包字体。
9. 不覆盖线上版本、不部署、不发布视频；提交前检查大文件与未授权素材。
10. 不把“写了”写成“能玩”；不把 B 级证据写成 A；不隐瞒欠账。

## 10 交接接口

### 10.1 给步骤四（小游戏）

- story p024 minigame 节点：id="p024"，type="minigame"，game="door"，config={duration:75,capacity:6,doorCost:2,items:8}。
- 引擎在 renderVn 遇到 minigame 时调用 XB.minigames.start(...)（步骤四新增）；当前 seam 面板由 #vn-minigame 承载，步骤四替换其内容，不改 p024 的位置。
- 小游戏结束回 VN：需要提供 { gameId, success, carried:[], left:[], elapsed }；p025 result 用 carried/left 渲染，不评分。
- 不把 success 写进 flags；只写 item.door 等既有旗标；如果步骤四要新增旗标，先改 state-schema。
- 引擎已有 isPaused/visibility 处理，小游戏计时复用，不另写一套暂停。

### 10.2 给步骤五（章节/图鉴/结局）

- 节点图契约：数组顺序 + when + record/value；新章节 id 前缀 x/z/j/l/g/w；每章可复用 line/choice/minigame/result/title/codex/end。
- story.codex 已有 7 张；图鉴页直接读 story.codex；不要复制正文到新文件。
- 标题菜单 codex 现在 toast“步骤五”；步骤五接图鉴页时改 handleAction。
- p900 next=xiangjiang 已就位；第一章 playable 改 true 后地图站自动可玩；T07 的“待续”文案要去掉。
- finishChapter 目前只解锁 next + toast；步骤五要接章节链、错误卡、ending。
- 结局五卡/点名在步骤五；不要在本步的 p900 里加。

### 10.3 给步骤六（音频）

- settings.volume（0–1）、muted 已持久化并有 UI；步骤六在首次点击后创建 AudioContext，读这两个值。
- 暂停/隐藏标签页已有 pause 入口；音频 suspend/resume 接同一事件。
- 不自动播放；seam/result/标题卡不加音效文件。
- 音效 id 只在 story 的 sfx 字段；步骤六消费，不写进 story 的 line 文本。

### 10.4 给步骤七（测试）

- T02–T05、T07 已覆盖；T06 只覆盖序章，第一章留给步骤五/七。
- B1–B18 是 Edge 证据；Chrome/Safari/真机/隐私模式未测，步骤七按 T01–T20 全量。
- 已知欠账：正文极端字号、7 卡图鉴、20 分钟、门板小游戏、字体未生效、shell 不可用时的 git 复核。

### 10.5 给步骤八（打包）

- 运行文件仍六个：index.html/style.css/engine.js/story.js/minigames.js/art.js；无额外运行时脚本。
- 无外部字体/图片/音频；story.js 内联；file:// 可跑。
- 打包前跑 check-build/smoke/check-script；ZIP 含 project/ 与必要 docs 说明；不把 evidence/screenshots 打进去。

## 11 复核记录（执行后回填）

### 11.1 任务实际用时

实际口径：会话时间戳 18:38 → 19:56（约 78 分钟，含浏览器调试与四次返工），按卡拆分为事后估算，合计 78。

| 卡 | 计划 | 实际 | 证据/偏差 |
|---|---:|---:|---|
| T3.0 | 40 | 4 | 新建 visual-reading.md；README §3/§4/§6/§7；state-schema §3/§4；ui-layout §1/§2/§7 |
| T3.1 | 60 | 8 | core 重写：扁平节点图、when/set、applyChoice、normalize；smoke S18–S26 覆盖 |
| T3.2 | 50 | 10 | story.js 293 行 / 48 节点 / 7 张图鉴逐字誊写；p900 next=xiangjiang |
| T3.3 | 35 | 6 | index.html 151 行 + style.css 阅读层段落（约 320 行新增） |
| T3.4 | 55 | 7 | 打字机 rAF + 二分分页 + 量具；reducedMotion 直出整页 |
| T3.5 | 55 | 7 | 限时 8s、默认项、timedOut、暂停冻结、数字键 1/2（返工 +1） |
| T3.6 | 55 | 6 | 标题卡两用、图鉴解锁落档、焦点陷阱 |
| T3.7 | 50 | 5 | 暂停 4 按钮 + 设置 6 项即时生效并持久化 |
| T3.8 | 40 | 5 | auto/skip、p024 seam、p025 result、地图「待续」 |
| T3.9 | 50 | 8 | check-build 12→17、smoke 17→26、check-script 复跑 |
| T3.10 | 60 | 12 | 浏览器 18 项 + 补充证据 6 项；抓出并修掉 4 个真 bug |
| T3.11 | 20 | 0 | 本节与 CLAUDE 回填、提交与 tag（待确认后执行） |

### 11.2 E1–E14 结果

| 编号 | 结果 | 证据 | 例外/欠账 |
|---|---|---|---|
| E1 | ✅ A | B2–B6 浏览器实走；`extra-checks.js` 四路径 41/41 line、48/48 节点、四条都到 p900 | 单次通关只覆盖一支；四路径靠脚本补齐 |
| E2 | ✅ A | B7：首击 3→19 字补全；1.3 字号 scrollHeight 66≤66；三档字号不裁 | 逐字录屏留步骤七 |
| E3 | ✅ A | B3 door=true/load=2/fire=60；B4 door=false/load=0；debug 截图 B3-1280-debug-p022a.png | — |
| E4 | ✅ A | B5 等满 8s 默认 A + timedOut=true + toast；B11 暂停 9 秒不偷时间 | — |
| E5 | ✅ A | B2「序章 · 于都」1200ms/点击关；B10 后 p043「第一章 · 湘江」 | — |
| E6 | ✅ A | B10 yudu 图鉴：类型/出处/争议/虚构声明；关闭后 codex 落档并随存档保留 | 其余 6 张未在剧情中解锁（步骤五） |
| E7 | ✅ A | B12：p020/p021/p037 刷新回原节点，flags/choices/codex/settings 全保留 | 首次点击即存档，无“保存中”提示 |
| E8 | ✅ A | B11 四按钮 + 六项设置即时生效、刷新保留；B15 焦点与 Esc | 音量只存值不发声（步骤六） |
| E9 | ✅ A | B8：auto 到 p002 可控；skip 未开只提示；开后可跳已读；刷新后未见节点不被跳 | 不写存档（设计如此） |
| E10 | ✅ A | B9：p024 面板「门板小游戏关卡 door · 限时…」；p025 带走/留下两列 | 门板小游戏本体属步骤四 |
| E11 | ✅ A | B14：p900 后湘江解锁、显示「待续」、点击提示；序章可重进 | 第一章仍 playable:false |
| E12 | ✅ A | check-build 17/17、smoke 26/26、check-script OK；四个负例（C02/C10/C14/C15）各自报红并退出码 1 | — |
| E13 | ✅ A | C05 JS gzip 26KB / CSS gzip 7KB；B17 file:// localStorage=ok、0 error；C02/C04/C17 无 fetch/ESM/外部 URL | 字体仍回退系统（步骤八） |
| E14 | ✅ A | 本节 + `.claude/CLAUDE.md`；提交与 tag 见 §11.5 | — |

### 11.3 B1–B18 结果

| 编号 | 场景 | 结果 | 截图/备注 |
|---|---|---|---|
| B1 | 三档标题 | ✅ | B1-1280x720-title.png；1920/1365/693 舞台，无滚动条 |
| B2 | 新游戏标题卡 | ✅ | B2-1280-titlecard.png、B2-1280-p001.png |
| B3 | 选带门板 | ✅ | B3-1280-choice-p021.png、B3-1280-p022a.png |
| B4 | 选不带门板 | ✅ | B4-1280-p029b.png |
| B5 | 超时 | ✅ | B5-1280-timeout.png |
| B6 | 回头/不回头 | ✅ | B6-1280-p038a.png |
| B7 | 打字机 | ✅ | B7-1280-textscale-1.3.png |
| B8 | auto/skip | ✅ | 断言：p002→p003 只在已读且 skipSeen=true 时发生 |
| B9 | seam/result | ✅ | B9-1280-seam-p024.png、B9-1280-result-p025.png |
| B10 | 史实注 | ✅ | B10-1280-codex-yudu.png、B10-1280-map-unlocked.png |
| B11 | 暂停/设置 | ✅ | B11-1280-settings.png |
| B12 | 存档/刷新 | ✅ | 三个保存点各刷新一次 |
| B13 | 坏档 | ✅ | B13-1280-badsave.png；三分支都不白屏 |
| B14 | 地图解锁 | ✅ | B14-1280-map.png |
| B15 | 键盘 | ✅ | Tab/数字键/Esc/空格 |
| B16 | 触摸 | ✅ | B16-844x390-choice.png；热区例外见 §11.4 |
| B17 | http | ✅ | B17-file-title.png |
| B18 | 性能/体积 | ✅ | B18-1280-p006.png；paint 0.08ms、DOM 82 节点、0 外部请求 |

### 11.4 偏差与欠账

- **门的颜色**：p039「我把门板翻过来」在源剧本里是无条件句，未按 `item.door` 分支；门板已不带时读起来略突兀。不改剧本，记步骤五统一处理（可能要重写该句或加 when）。
- **门板小游戏仍是 seam**：p024 只显示参数面板，不塞假玩法；步骤四替换为真关卡，config 已按 duration 75 / capacity 6 / doorCost 2 / items 8 冻结。
- **图鉴只有 1 张能在剧情里解锁**：其余 6 张数据已内联，图鉴页属步骤五。
- **C06 口径变更**：因图鉴正文现在内联在 story.js，C06 改成「剧情文本扫 BANNED+REAL，图鉴正文只扫 BANNED」，否则真实人物会误报。
- **B16 热区**：844×390 时舞台缩放 0.542，逻辑热区 48×48、实际像素 26×26；逻辑尺寸达标，真机步骤七再核。
- **未测**：Chrome/Safari、真机触摸、隐私模式禁存储、音频、20 分钟整章。
- **浏览器实测抓到的 4 个真 bug**（静态检查全绿也没拦住）：`currentNode()` 漏传 state（7 处 TypeError）、标题卡同一次点击被处理两次（打字机被跳过）、地图锁态误用 playable（湘江锁死）、选项缺数字键。修法与证据见 `docs/evidence/step-03/run-log.md` §3。
- **工具口径**：负例断言必须匹配 `× CXX` 失败行——check-build 的 `notes` 里 `CXX OK` 无条件打印，只搜编号会假通过（本轮踩过）。
- **shell**：本机默认沙箱 pwsh 无法初始化（0xC0000142），node/git 需 `sandbox_permissions:"danger-full-access"`；git 提交据此执行。

### 11.5 状态更新与提交

- CLAUDE：步骤表「三 VN 引擎」改 ✅；当前进度写本步出口与欠账。
- 提交：`feat: VN 引擎与序章全量（步骤三）`；tag `step-3-done`（提交前按规则确认，见 §11.5 注）。
- 提交前检查：`git status` 无 node_modules / 截图 / zip；`docs/evidence/` 已 gitignore；无未授权素材、无字体文件。

### 11.6 一句话交接

- 交付：可从头播到尾的序章 VN——打字机分页、两处限时抉择（超时有代价且落档）、标题卡、史实注、自动/跳过、暂停与六项设置、坏档降级；工具 17+26 项、浏览器 18 项、四路径全覆盖。
- 没交付：门板小游戏本体（seam）、其余 6 张图鉴解锁、第一章起各章、结局五卡、音频。
- 下一步：步骤四先做门板小游戏（`minigames.js` 的 `init/update/draw/end` 与共享限时分配引擎），p024 的 config 即数值起点。


## 附录 A 序章节点映射（48 节点）

| id | 类型 | 源文件行 | 条件 | 说明 |
|---|---|---|---:|---|
| p001–p020 | line | 00-prologue 9–31 | 无 | 逐字保留；p001 bg yudu_river，p006 bg yudu_night |
| p021 | choice | 33–35 | 无 | record choice.prologue.door；8s；默认 A |
| p022a | line | 38 | item.door | 旁白：门板绑在背上 |
| p023a | line | 39 | item.door | 满崽：门没了，我替它走 |
| p022b | line | 41 | !item.door | 旁白：门板靠在门框上 |
| p024 | minigame | 44 | 无 | game door；config 75/6/2/8 |
| p025 | result | 46 | 无 | 行囊；不评分 |
| p026 | line | 47 | 无 | 天快亮时行囊定了 |
| p027 | line | 48 | 无 | 灶王擦锅 |
| p028 | line | 49 | 无 | 大锅留下，小锅我背 |
| p029a | line | 51 | item.door | 纸上“门板那一行，空着” |
| p029b | line | 53 | !item.door | 纸上“一扇门” |
| p030 | line | 55 | 无 | 压纸 |
| p031 | line | 58 | 无 | bg yudu_river；出发 |
| p032 | line | 59 | 无 | 桥晃 |
| p033 | line | 60 | 无 | 踩空 |
| p034 | line | 61 | 无 | 冬生：号一响就走 |
| p035 | line | 62 | 无 | 娘挤桥头别针 |
| p036 | line | 63 | 无 | 娘：衣裳破了，自己缝 |
| p037 | choice | 65–67 | 无 | record choice.prologue.lookback；8s；默认 B |
| p038a | line | 70 | choice.prologue.lookback | 回了头，看见油灯 |
| p038b | line | 72 | !choice.prologue.lookback | 没有回头 |
| p039 | line | 76 | 无 | bg yudu_night；上了南岸 |
| p040 | line | 77 | 无 | 画一个北 |
| p041 | line | 78 | 无 | 北。 |
| p042 | line | 79 | 无 | 按手掌；铅笔会秃 |
| p043 | title | 80 | 无 | 第一章 · 湘江 |
| p044 | codex | 81 | 无 | yudu |
| p900 | end | 82 | 无 | next xiangjiang |

计数：line 41（p001–p020 20 + p022a/p023a/p022b 3 + p026–p028 3 + p029a/p029b 2 + p030 1 + p031–p036 6 + p038a/p038b 2 + p039–p042 4）；choice 2；minigame 1；result 1；title 1；codex 1；end 1；合计 48。

## 附录 B 选项与旗标数据

### B1 p021

- record：choice.prologue.door
- timeout：8
- defaultOption：A
- A：text“带上这块门板”；value true；set item.door=true、load +2、fire +10；cost“行囊只剩两格，多背三十斤”
- B：text“只带花名册”；value false；set item.door=false、load +0；cost“终章没有门板可放，娘的手停在半空”

### B2 p037

- record：choice.prologue.lookback
- timeout：8
- defaultOption：B
- A：text“回头看一眼”；value true；set choice.prologue.lookback=true、fire +5；cost“落后几步，第一班船没赶上”
- B：text“不回头”；value false；set choice.prologue.lookback=false；cost“你没看见家里那盏灯”

### B3 日志

- 字段：chapter / nodeId / option / text / timedOut。
- 示例：{chapter:"prologue",nodeId:"p021",option:"A",text:"带上这块门板",timedOut:false}。
- 超时示例：{chapter:"prologue",nodeId:"p021",option:"A",text:"带上这块门板",timedOut:true}。

### B4 允许的 when / set 路径（本步）

- when：item.door、!item.door、choice.prologue.lookback、!choice.prologue.lookback；支持 && 连接。
- set：item.door（bool）、item.pot（bool）、load（数字/±）、trust（0–6/±）、fire（0–100/±）、lights_lost（数字/±）、memory.*（bool）、choice.*（bool/数字）。
- 不允许本步出现：ending.*、card.*、unlockedChapters（运行时字段，不由 set 写）。

## 附录 C DOM / CSS 清单

### C1 新增 id

| id | 位置 | 用途 |
|---|---|---|
| vn-toolbar | #scene-vn | auto/skip 两按钮 |
| vn-auto | #vn-toolbar | 自动 |
| vn-skip | #vn-toolbar | 跳过（默认 hidden） |
| vn-choice-prompt | #scene-vn | 选项提示 |
| vn-choices | #scene-vn | 选项组 |
| vn-title-card | #scene-vn | 标题卡 |
| vn-minigame | #scene-vn | 步骤四 seam |
| vn-result | #scene-vn | 行囊结果 |
| vn-measure | #scene-vn | 屏外测量 |
| vn-settings | #pause | 设置面板 |
| codex | #stage 末尾 | 史实注弹窗 |

### C2 坐标

- 工具条：912,24；按钮 120×44；gap 8；暂停 1200,24。
- 章节名：32,24；16px；不因工具条移动。
- 选项组：360,300；宽 560；每个 64 高；gap 16；提示 360,262。
- 对话框：60,560,1160×118；正文 86,586,1108×66；姓名 84,542；继续 1176,650。
- 标题卡：0,0,1280×720。
- 史实注：190,80,900×560；关闭 44。
- 结果：360,220,560×300。
- seam：360,240,560×260。
- 设置：360,140,560×440；行 56。
- measure：left -10000；top 0；width 1108；不可见但可测。

### C3 样式约束

- 颜色只用 var；新增派生色不改 :root 外。
- .vn-text 与 #vn-measure 同 font-family/font-size/line-height/width。
- --text-scale 只在 #stage 上设置，默认 1。
- 覆盖层默认 hidden；显示时 focus trap；关闭后焦点回触发按钮。
- 所有可点控件 ≥44×44；工具条按钮 120×44；选项 560×64；关闭 44；设置行 56。
- 动画尊重 prefers-reduced-motion 与 settings.reducedMotion。

## 附录 D 命令与证据

    node --check project/engine.js
    node --check project/story.js
    node --check project/minigames.js
    node --check project/art.js
    node project/tools/check-build.js
    node project/tools/smoke.js
    node project/tools/check-script.js docs/script
    node project/tools/count-words.js docs/script/00-prologue.md
    python -m http.server 8080 --directory project

> 本机当前 pwsh/子进程不可用（退出码 0xC0000142/3221225794），以上命令在真 shell 恢复前不能算已跑；语法检查可用 run_code 的 new Function 代替，check-build/smoke 只能标 B/D。不要声称跑过。

## 附录 E 文件树

    project/
      index.html        改：新容器、版本行
      style.css         改：阅读器/选项/弹窗/设置
      engine.js         改：core 图 + 阅读器 + 选项 + 设置
      story.js          改：version 2 + p021–p044 + codex
      minigames.js      不碰（空壳）
      art.js            不碰
      tools/
        check-build.js  改：C13–C17
        smoke.js        改：S18–S26 + 旧项
        check-script.js 不改
        count-words.js  不改
    docs/
      visual-reading.md 新建
      script/README.md  改
      state-schema.md   改
      ui-layout.md      改
      evidence/step-03/run-log.md 新建（gitignored）
    step/
      step-03-VN引擎.md 本文件

## 附录 F 已知欠账（本步结束必须写进 CLAUDE）

1. 门板小游戏是 seam，不是可玩小游戏；步骤四替换。
2. 7 张图鉴页未做，只做 yudu 弹窗 + 7 张数据；步骤五接。
3. 第一章不可玩；p900 只解锁湘江；步骤五接。
4. 结局五卡/点名未做；步骤五。
5. 音频未接；音量/静音只存值；步骤六。
6. Chrome/Safari/真机触摸/隐私模式未测；步骤七。
7. 20 分钟完整通关未测；步骤七。
8. 字体设计字体未生效，回退可用；步骤七/八决定是否打包。
9. 本机 shell 不可用时 commit/tag 为手工对象；真 shell 恢复后 git fsck/status 复核。
10. T06 只覆盖序章中间；第一章中间刷新留步骤五/七。
