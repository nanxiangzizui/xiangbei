# 步骤五执行卡 · 章节接入（七章 / 图鉴 / 结局）

> **所属步骤**：步骤五 章节接入（对应《向北-项目计划书》执行步骤 7）。
> **状态源**：进度、步骤表与红线以 .claude/CLAUDE.md 为准；本文件只写“怎么做、做到什么算完成”，不另存进度。
> **当前状态**：步骤零、一、二、三、四 ✅（tag 分别为 step-0-done、step-1-done、step-2-done、step-3-done、step-4-done）；步骤五 ⬜ 未开始。本文件是步骤五的执行计划，执行前不应把步骤五改成 ✅。
> **本步骤出口（逐字引 CLAUDE.md）**：从头玩到尾；7 张史实注；结局点名 + 数字 + 五张精神卡。
> **时间盒**：标准 13 小时 20 分（800 分钟）；压缩 7 小时 35 分（455 分钟）。时间盒只含本步 T5.0–T5.10，不含步骤六音频与步骤七全量测试。
> **不可逆动作**：本步没有。部署上线、覆盖线上版本、重置存档格式、公开发布视频都不在本步；提交与打 tag 是本地版本动作，执行前仍按项目规则确认。
> **证据级别**：A 浏览器实测（截图/录屏/控制台）；B 代码完成未跑；C 设计稿/口述；D 未验证。没有实际运行就写“未验证”，不把“写了”说成“能玩”。
> **基线时点**：本计划按 2026-11-02 步骤四完成后的工作区写成。执行前先核对第 1.3 节的体积、节点数、工具项数和剧本行数；若代码或文本已经变化，先改本计划再动手。

## 0 一页速览

### 0.1 本步到底做什么

把“只有序章可玩”的试玩版接成一条完整的七章流程，并补齐图鉴与结局：

1. **六章剧情接入**：把 docs/script 的湘江、遵义、金沙江、泸定、草地、吴起誊写进 project/story.js；七章全部 playable=true；章末 end.next 串成 xiangjiang → zunyi → jinsha → luding → grass → wuqi → ending。
2. **12 张章节背景**：art.js 从 4 个画面扩到 16 个（新增 xiangjiang_ford / xiangjiang_dawn / zunyi_hall / zunyi_street / jinsha_river / jinsha_night / luding_bridge / luding_after / grass_marsh / grass_dawn / wuqi_dawn / wuqi_wall）；全部程序化版画，不新增图片。
3. **结局场景**：新增第 4 个 UI 场景 ending（title / map / vn / ending）；w900.next='ending'；结局面板显示点名名单、全连 104→19（虚构）、中央红军 8.6 万→7000 余人（史实）、五卡 3+2、虚构声明、回标题/图鉴。
4. **点名交互**：吴起章加 type='interact'、mode='rollcall' 的 45 秒 DOM 覆盖层；7 个名字按名册顺序念，活着的人自己答，没人应的由玩家按空格/Enter/点大按钮替答；漏答只留空白，不重开、不评分。
5. **史实图鉴页**：7 张卡（3+3+1）从标题菜单与暂停菜单进入；锁卡显示所属章节；开卡复用现有单张史实注弹窗；显示 n/7；不新增存档键。
6. **五张精神卡**：引擎 buildEnding 一次计算，文案集中在 story.js 的 XB.story.ending.cards；fire≥20、hold、admit≥2、priority=main、trust≥3 且 memory.zhang；全灰是允许结果，不强制点亮。
7. **分支与旗标收口**：p039 按 item.door 分叉；湘江门板选项拆有/无门板两条 choice；泸定/吴起无门板走替代行；遵义三选累计不写 record；memory.luding_unknown、memory.door 改 boolean；补 memory.rollcall_missed_any。
8. **章末记忆与切章**：湘江→memory.zhou、遵义→memory.he、泸定→memory.feimao、草地→memory.zaowang；进入吴起前置 memory.ximei / dongsheng / lin；finishChapter 写记忆、解锁下一章、去 map 或 ending，不再 toast“本步只做到序章”。
9. **可验证**：check-build 23→30；smoke 33→40；check-script 支持 interact / next=ending；Edge B31–B44 留证据；只报 Edge，Chrome/Safari/真机/隐私模式留步骤七。

### 0.2 任务总表

| 卡 | 任务 | 主要产出 | 完成判据 | 标准 min | 压缩 min |
|---|---|---|---|---|---:|---:|
| T5.0 | 先改文档与契约 | docs/chapter-integration.md；script README、state-schema、story-bible、ui-layout、test-cases、quality-bar 同步 | 七章节点表、结局快照、点名状态、五卡边界、图鉴/面板坐标都有唯一出处；代码未动 | 40 | 24 |
| T5.1 | 六章誊写与文本修订 | project/story.js 七章 277 节点；docs/script/00、06 修订；ending 数据 | 七章可走通；7 张 codex；字数/beat 回填；无禁用词 | 160 | 90 |
| T5.2 | 12 张章节背景 | project/art.js 16 场景；共享笔触 helper | 每个 bg 都有画面；C11/S17 通过；无图片；paint 不超预算 | 100 | 60 |
| T5.3 | 结局场景与切章外壳 | index #scene-ending；style 结局面板；engine SCENES/normalize/go | w900 能进 ending；刷新可回；回标题/图鉴可用 | 80 | 45 |
| T5.4 | 点名交互 | #vn-interact；状态机；45 秒；ending.names | 7 人顺序、自动答到、替答、漏答、暂停/刷新都有定义 | 75 | 42 |
| T5.5 | 史实图鉴页 | #codex-gallery；7 卡 3+3+1；标题/暂停入口 | 0/7→7/7；锁卡不可开；开卡/关闭/焦点正确 | 60 | 34 |
| T5.6 | 五卡与结局内容 | buildEnding；五卡 3+2；数字/声明；文案数据 | 五卡边界逐项正确；全灰路径可到；无评分 | 60 | 34 |
| T5.7 | 分支、存档与切章收口 | p039/x/l/w 分支；memory bool；normalize；finishChapter | 有/无门板都不出不可能选项；刷新/继续正确 | 65 | 36 |
| T5.8 | 工具与测试 | check-build C13/C14/C16/C17 + C24–C30；smoke S34–S40；负例 | 30/30、40/40；四个负例报红 | 60 | 34 |
| T5.9 | 浏览器实测 | Edge B31–B44；截图；run-log | A 级证据；Console 0 error；file:// 与 http 可玩 | 70 | 40 |
| T5.10 | 复核与交班 | §11 回填；CLAUDE 步骤表；提交/tag | step-5-done；欠账写清 | 30 | 16 |
| **合计** |  |  |  | **800** | **455** |

### 0.3 本步完成定义（可逐条勾）

1. 从标题“开始”能连续走完序章、湘江、遵义、金沙江、泸定、草地、吴起，进入 ending；默认路径不靠调试参数，不出现断链、空节点、白屏。
2. 七章共 7 个 codex 节点，逐张解锁；图鉴页从 0/7 到 7/7；锁卡不可开，开卡复用单张弹窗。
3. 结局面板同时出现：点名名单 7 人及状态、全连 104→19（标虚构）、中央红军 8.6 万→7000 余人（标史实）、五卡 3+2、虚构声明。
4. 点名交互 45 秒内完成；3 个“没人应”的名字可替答，也可漏答；漏答不重开、不评分；刷新回到交互开头。
5. 五卡在边界值上正确：fire 19/20、hold true/false、admit 1/2、priority main/wounded、trust 2/3 且 memory.zhang true/false；全灰路径能到 ending。
6. 有门板与无门板两条路径都能走通：p039、湘江 C、泸定铺桥、吴起留板都不显示不可能选项。
7. 存档仍是 xiangbei.save.v1、11 个持久键；结局快照可刷新恢复；章中刷新回当前节点；ending 刷新回结局；不新增 card.*。
8. check-build 30/30、smoke 40/40、check-script 通过；四个负例报红；Edge B31–B44 全部有结果、Console 0 error；file:// 与本地 http 都可玩。
9. 文档、CLAUDE 步骤表、tag step-5-done 同步；明确记录：音频、转场、Chrome/Safari/真机/隐私模式、20 分钟三次计时留步骤六/七。

### 0.4 先文档后代码

T5.0 必须先落盘，理由是：七章节点表、ending 快照、点名状态机、五卡条件和图鉴坐标会同时影响 story.js、engine.js、index.html、style.css、art.js、check-build、smoke 和步骤六/七。先在代码里试，文档一定分叉。

T5.0 只改文档，不改运行时代码；T5.0 完成后再进 T5.1。T5.1 与 T5.2 可以并行（一个写文本、一个画背景），但 T5.1 的 bg id 必须先按 T5.0 的 16 个画面表写死。

## 1 起点盘点

### 1.1 已经有的

| 资产 | 现状 | 本步怎么用 |
|---|---|---|
| 舞台与场景 | 1280×720，#stage，#stage-art 单画布；title/map/vn 三场景 | 加第 4 个 ending 场景；不改舞台比例、不改单画布 |
| VN 引擎 | engine.js 2337 行；扁平条件节点图；line/choice/minigame/result/title/codex/end 分派；打字机/限时/暂停/设置/图鉴单张 | 复用渲染与输入；加 ending/interact/gallery 分派；改 normalize/finishChapter |
| 序章数据 | story.js 296 行；只有序章 48 节点 playable；p900.next=xiangjiang；p024 门板关；p025 动态结果 | 加 p039 门板分支；其余五章接在 p900 后 |
| 小游戏 | minigames.js 四关；door/abandon/boat/climb；结果对象无 success/score | 不改规则与文件；章节只消费既有旗标与结果 |
| 组件库 | 10 类 xb-* 壳；五色令牌；--paper-texture；44px 热区基线 | 复用按钮/面板/弹窗；新增结局/图鉴/点名专用布局，不改类名 |
| 程序化美术 | art.js 519 行；4 场景 title/map/yudu_river/yudu_night；FNV-1a→mulberry32 | 扩到 16 场景；复用 ridge/纸纹/江面/剪影笔触 |
| 存档 | xiangbei.save.v1；SAVE_VERSION=1；11 个持久键；ending 字段已在 PERSIST_KEYS | 不升版本、不加持久键；把 ending 从 null 变成快照 |
| 工具 | check-build 23 项；smoke 33 项；check-script；count-words | 扩到 30/40；改 C13/C14/C16/C17；加 C24–C30 |
| 文档 | story-bible、sources、codex、script 七章、state-schema、ui-layout、test-cases、quality-bar、credits | T5.0 改；节点/坐标/旗标必须同名 |
| 证据 | docs/evidence/step-04/run-log.md；仅 Edge headless | 本步继续只报 Edge；Chrome/Safari/真机留步骤七 |

### 1.2 当前的硬缺口

| 缺口 | 具体表现 | 影响 |
|---|---|---|
| 六章是空壳 | xiangjiang/zunyi/jinsha/luding/grass/wuqi 的 nodes=[]、playable=false | 地图只能进序章，出口“从头玩到尾”不成立 |
| 只有 4 个画面 | art.js SCENES 只有 title/map/yudu_river/yudu_night | 六章 12 个 bg 全部缺失，C11 会报红/画布隐藏 |
| 没有 ending 场景 | SCENES 只有 title/map/vn；normalize 对 nodeId=null 的非 title/map 直接判坏档 | w900.next='ending' 走不通；结局无处显示 |
| 没有点名交互 | 只有 wuqi 源文件的固定“我替他答了一声” | 玩家无法替答；漏答时固定文本矛盾 |
| 没有图鉴页 | 只有单张 #codex 弹窗；标题“史实图鉴”是 toast；暂停无图鉴按钮 | 7 张注有数据但没有 0/7–7/7 页面 |
| 五卡没有运行时 | story-bible 有触发条件，engine 没有 buildEnding；xb-ending 只有 760×480 壳 | 终章无法生成五卡/数字/名单 |
| 遵义累计会覆盖 | applyChoice 先 set 再按 record 写 value；三条 choice 若共用 record 会把 admit 覆盖成 0/1 | 五卡·复盘永远不对 |
| memory 类型错 | memory.luding_unknown / memory.door 在 schema 是 0/1 数字；evalWhen 只认 true | 条件分支永远走 else |
| p039 无门板仍说“门板翻过来” | 序章 p039 没有 when | 无门板路径文本自相矛盾 |
| 湘江 C 无门板仍显示 | 单一 choice 含“把门板横在桥头” | 无门板玩家能选不可能项 |
| 泸定/吴起门板选项无替代 | 两处 choice 都默认有门板 | 无门板路径出现不可能选项 |
| 切章 toast 过时 | finishChapter 写“本步只做到序章” | 七章接入后文案错误 |
| 工具冻结旧结构 | C13 序章 48；C14 只序章 2 choice；C16 硬编码 when；C17 end 只能是章节 | 新章节一接就红，或红得不合理 |
| 吴起源行数不一致 | 文件头 44 line/51 节点；逐行数到 46 line | 字数/节点表不可信，T5.0 必须重数 |
| 结局面板太小 | ui-layout 260,120,760×480；放不下 7 人名单+数字+五卡+声明 | 必须改 880×560 并同步文档 |

### 1.3 当前基线数字（写计划与验收时引用）

- 代码：engine.js 2337 行 / 75,925 B；story.js 296 行 / 15,918 B；index.html 159 行 / 8,629 B；style.css 约 32 KB（gzip 约 6.9 KB）；art.js 519 行 / 15,763 B；minigames.js 四关已完成。
- 工具：check-build 23 项；smoke 33 项；check-script 通过；四文件语法通过。
- 当前 story：只有序章 48 节点（41 line / 2 choice / 1 minigame / 1 result / 1 title / 1 codex / 1 end）；其余六章 nodes=[]。
- 目标 story：七章 277 节点（见附录 A）；七章全部 playable；7 张 codex；1 个 ending 数据对象。
- 剧本：4108 字 / 229 beat / 12 抉择点 / 26 选项 / 9 限时；口播 A 口径 11:22；整章合计 19:44（仅余 16 秒）；上限情形 22:30。
- 时长红线：20 分钟是硬验收；本步只做一次完整计时（B44），三次计时留步骤七。若接入后超 20 分钟，按草地→金沙江→遵义纯对话的顺序裁，保留序章/湘江/泸定/点名。
- 小游戏：4 关规则与结果契约不动；四关目标总 285s（205s 可玩 + 80s 结算）；本步只保证不加新关卡、不改 duration。
- 预算：JS gzip ≤150 KB；CSS ≤30 KB；字体 ≤300 KB；0 外部图片/音频；本步不新增图片/音频/字体文件。
- 证据：只有 Edge headless（含移动模拟 + touch）；Chrome/Safari、真机、隐私模式禁用存储、断网 ZIP 留步骤七。

### 1.4 先修的文档矛盾（T5.0 必须落盘）

| # | 现状 | 决定 | 落到哪 |
|---|---|---|---|
| 1 | story-bible §5 写“至少一张卡必亮”与“全灰不算失败”并存 | 删除“必亮”；五卡全部可灰；全灰是允许结果 | docs/story-bible.md §5 |
| 2 | memory.luding_unknown / memory.door 是 number 0/1 | 改 boolean；B=true/A=false；留吴起=true/带回=false；evalWhen 不加数值比较 | docs/state-schema.md、docs/script/04、06 |
| 3 | 遵义三条 choice 共用 record | 不写 record；只 set choice.zunyi.admit=+1/+0；默认 0；clamp 0–3；choices 日志仍记录 | docs/script/02、state-schema、README §4 |
| 4 | finishChapter toast 写“本步只做到序章” | 改通用“「下一章」已解锁”；ending 单独构建 | docs/chapter-integration.md、engine |
| 5 | 吴起 45–52 行固定“我替他答” | 删 8 行；改 3 行“没有人应”+ 交互 + 2 行条件总结 | docs/script/06 |
| 6 | 序章 p039 无门板仍“门板翻过来” | p039a/p039b 按 item.door；p040–p042 改中性措辞 | docs/script/00 |
| 7 | state-schema scene 只有 title/map/vn | 加 ending；ending 时 nodeId=null；第四章场景 | docs/state-schema、ui-layout |
| 8 | 结局面板 760×480 放不下内容 | 改 880×560（200,80）；五卡 3+2；ui-layout 同步 | docs/ui-layout |
| 9 | C17 只允许 end.next 是章节 | 允许 ending；全章可达；ending 快照校验 | check-build |
| 10 | C14 只校验序章 2 个 choice | 泛化全章：2–3 项、timeout 可选、record 可选、累计 set | check-build |
| 11 | 吴起文件头 44 line / 51 节点，逐行 46 line | T5.0 用 count-words 重数；以重数为准回填 README 与 chapter-integration | docs/script/README、06 |
| 12 | xiangjiang 文件头 776 字，README 775 字 | 以 count-words 输出为准；改稿后必须回填四处 | README、story-bible、文件头 |
| 13 | choice.jinsha.priority 默认 "main" | 保留默认；choice 是必经点，超时默认 A 主力；B/C 可让 overall 灰 | state-schema |
| 14 | ending 未定义形状 | 定义 stats/names/answered/missed/cards；只由引擎写 | state-schema、chapter-integration |

**规则**：以上 14 条没有进 docs 之前，不写进 story.js / engine.js。代码里不得出现 docs 里没有同名定义的“新创意”。

## 2 不变量（做任何任务卡都不能破）

### 2.1 叙事与史实

1. 七段结构不变；湘江必败、遵义必开、泸定必夺；单一结局，不做多结局树。
2. 不虚构真实领导人对话；真实人物只进史实注，不进剧情对白。遵义会议只从门外写。
3. 22 位勇士只写光点和数字，不点名、不做个人对应、不做血腥特写。
4. 全连 104→19 是虚构，必须标“虚构”；中央红军 8.6 万→7000 余人是史实，必须标“史实”。两个数字不能混。
5. “三百斤的箱子”只写重量，UI 不写 X 光机；金沙江船数争议只进图鉴注，不在正文下结论。
6. 敌人不脸谱化；不画敌人脸、不做击杀、不做“打鬼子”。
7. 《七根火柴》《金色的鱼钩》等文学不能当史料；本步不新增史实断言。

### 2.2 情感与尺度

1. 死亡用“名字被划掉”、留白、沉默表现；不做血腥特写，不消费苦难。
2. 不把牺牲做成分数：不出现 score、rank、星级、完美通关、成功/失败大字；结局不显示“亮了几张”。
3. 点名漏答不是失败：只留空白、只记 missed；不重开、不扣分、不弹 Game Over。
4. 五卡全灰是玩家一路选择的结果，不是失败；不强制至少一张亮。
5. 结局只有一个；五卡只改变细节，不改变“到吴起”的事实。

### 2.3 结构与玩法

1. 七章全部 playable；地图站点按 unlockedChapters 点亮；站点顺序固定。
2. 核心 4 关不变：door/abandon/boat/climb；不新增第 5 关；点名是 interact，不是第 5 个小游戏。
3. 每关 60–90 秒；不下调时长、不改 RULES；本步只消费结果。
4. 20 分钟硬验收；超时先裁草地，再裁金沙江，最后遵义改纯对话；保留序章/湘江/泸定/点名。
5. 选项是道德取舍；限时选项超时按 defaultOption 结算并记录 timedOut；不新增“明显正确”项。

### 2.4 存档与数据

1. 存档键仍是 xiangbei.save.v1；SAVE_VERSION 仍 1；PERSIST_KEYS 仍 11 个；不新增持久键。
2. state.scene 只加 ending 一个值；ending 时 nodeId=null、chapterId=wuqi。
3. ending 快照只由引擎写；剧本不得写 ending.* / card.* / unlockedChapters。
4. 不保存点名中间态；刷新从 interact 节点开头重来；交互结束才写 ending.names 并保存。
5. 不新增 list flag；choice.xiangjiang.abandoned 仍是唯一数组。
6. story.js 保持内联；不用 fetch/XHR/ES module；经典 script + window.XB。
7. 节点 id 全局唯一；已写入的 p001–p044 不改名；新增分支用同位置 a/b 后缀。

### 2.5 表现与交互

1. 1280×720 设计坐标；只保留一张舞台背景画布 #stage-art；art.js 仍是唯一背景绘制者。
2. art.js 从 4 场景扩到 16 场景；全部程序化；不新增图片/音频/字体；不使用未授权素材。
3. 颜色只在 :root；组件只写 var()；新增结局/图鉴/点名不引入散落 hex。
4. 热区 ≥44px；手机横屏 844×390 逻辑缩放 0.542 下仍可点；不依赖 hover。
5. 键盘：Enter/空格推进/替答，Esc 暂停/关闭，Tab 焦点，1–3 选项；焦点可见。
6. prefers-reduced-motion 与 settings.reducedMotion 生效；本步不做闪白/震动/墨水划名（步骤六）。
7. 结局/图鉴/点名对比度：正文纸白/墨黑 ≥4.5；朱砂小字只放纸上；夜蓝上用纸白或火橙。

### 2.6 范围

1. 不做音频、转场、粒子、闪白、震动、墨迹划名；步骤六再做。
2. 不做第 5 关探路/分粮；不做战斗/养成/商店/升级/角色选择/排行榜/多人。
3. 不新增第七个运行时 JS 文件；不引入框架、构建链、CDN、ES module、fetch。
4. 不 deploy、不发布视频、不打字体包、不改线上版本。

## 3 文件级产出清单

### 3.1 新建

| 文件 | 作用 | 是否进运行时 |
|---|---|---|
| docs/chapter-integration.md | 七章节点表、分支、ending 快照、点名状态机、图鉴、五卡、调试 | 否（文档） |
| docs/evidence/step-05/run-log.md | B31–B44 的日期、环境、结果、截图名、例外 | 否（gitignored 证据） |
| step/step-05-章节接入.md | 本执行计划 | 否（过程文档） |

### 3.2 修改

| 文件 | 内容 | 验收 | 下游消费者 |
|---|---|---|---|
| project/story.js | 六章 277 节点；p039 分支；ending 数据；七章 playable | C24/C25/C26/C27/C29；S34–S40 | engine、步骤六/七 |
| project/engine.js | ending 场景；buildEnding/renderEnding；rollcall；gallery；memory；normalize/finishChapter；resume | C26–C30；S34–S40 | 全部章节 |
| project/index.html | #scene-ending；#codex-gallery；#vn-interact；暂停图鉴按钮 | C03/C15/C28 | engine/CSS |
| project/style.css | 结局 880×560；图鉴 7 卡；点名面板；状态/计时；焦点 | C10/C28；E4/E13 | 全部 |
| project/art.js | 12 个新场景；共享笔触；SCENES 16 | C11/S17；E10 | 章节背景 |
| project/tools/check-build.js | C13/C14/C16/C17 改；C24–C30 增 | 30/30 | 步骤六–八 |
| project/tools/smoke.js | S34–S40 | 40/40 | 步骤六–八 |
| project/tools/check-script.js | interact/next=ending；新行类型 | check-script | 文本回归 |
| docs/script/00-prologue.md | p039 门板分支；中性措辞 | 字数回填 | story.js |
| docs/script/02-zunyi.md | 三条 choice 去 record；set 累计 | 字数回填 | story.js |
| docs/script/04-luding.md | memory.luding_unknown 改 boolean | 字数回填 | story.js |
| docs/script/06-wuqi.md | 门板分支；去固定替答；点名交互；删 3 个 result | 字数回填 | story.js |
| docs/script/README.md | 七章节点表；wuqi 行类型；字数/beat | C24 | story.js |
| docs/state-schema.md | ending 场景/快照；memory bool；默认 10 旗标；11 键不变 | C30 | engine |
| docs/story-bible.md | 五卡矛盾；ending 结构；点名 | C29 | 设计说明 |
| docs/ui-layout.md | ending 880×560；gallery；interact；层级 | C08/C15 | index/style |
| docs/test-cases.md | T06/T07/T13/T14/T15 细化 | 步骤七 | 测试 |
| docs/quality-bar.md | 结局/图鉴/点名键盘/对比度/44px | E13 | 测试 |
| .claude/CLAUDE.md | 步骤五 ✅；已知欠账 | T5.10 | 状态源 |

### 3.3 不碰

- project/minigames.js：四关规则、结果契约、RULES 不动；本步不新增小游戏。
- project/tools/ui-preview.html / ui-preview.js：10 类组件预览不动；新增 ending/gallery/rollcall 不塞进预览页，C12 仍按 10 类检查。
- 标题 96px、印章 360,150、菜单 120,360、10 类 xb-* 类名、单画布 #stage-art。
- SAVE_KEY / SAVE_VERSION / PERSIST_KEYS；不新增 card.*；不写 ending.* 到剧本。
- 字体文件、图片、音频、CDN、ES module、fetch。

## 4 关键决策（写代码前先认这些）

### S1 七章 id、节点 id 与节点预算

- 章节 id 保持全名：prologue、xiangjiang、zunyi、jinsha、luding、grass、wuqi。
- 节点前缀：p、x、z、j、l、g、w；顺序号 001–899；章末 x900…w900；分支用同位置主序号加 a/b。
- 七章全部 playable=true；p900.next=xiangjiang；x900→zunyi；z900→jinsha；j900→luding；l900→grass；g900→wuqi；w900→ending。
- 目标节点数 277（附录 A，实际重数）。其中序章 49（p039 加 1 条无门板分支）、湘江 43（门板 choice 拆两条）、遵义 33、金沙江 35、泸定 36（无门板替代行 +1）、草地 32、吴起 49（删 3 result、去 8 行固定替答、加交互与分支后实际 45 line，比目标多 1 行）。
- 吴起源文件头写 44 line/51 节点，逐行数到 46 line；T5.0 用 count-words 重数为 45 beat，冻结 49 节点；附录 A、README、C24 三处已按实际回填。
- T5.1 在 docs/chapter-integration.md 写“源行 → 节点 id”表；同位置条件行共用主序号 + a/b；不重排 p001–p044。C24 以该表为准检查重复、前缀、end 和计数。

### S2 ending 是第 4 个 UI 场景，不是第 4 个章节

- XB.core.SCENES 从 title/map/vn 扩为 title/map/vn/ending；LEGACY_SCENES 保留。
- ending 时 state.scene='ending'、chapterId='wuqi'、nodeId=null；unlockedChapters 仍含七章。
- normalize 允许“scene=ending 且 nodeId=null”；ending 时必须校验 ending 快照；快照不完整则回 map 并给 issue，不白屏。
- applyStartScene 保留 ending；showScene/render 增加 ending；go('ending') 先 stopMinigame/cancelAuto/cancelChoiceTimer/cancelTyping，再 render+save。
- #scene-ending 是 #stage 内第 4 个 section；z 与 vn 同级；背景仍用 #stage-art 画 wuqi_wall，不新增第二张背景画布。
- 标题“继续”：若 state.scene='ending' 或 ending 快照存在且已到过吴起，打开 ending；若只是章中，按原逻辑回 vn。标题“开始”仍重置新局。

### S3 结局内容与布局

- 面板 880×560，位置 200,80；不透明度足够的纸底，透出一点 wuqi_wall。
- 内容顺序：标题“向北”/副题“一九三五年十月十九日，吴起”；点名名单 7 行；数字两行；五卡 3+2；虚构声明；回标题/图鉴。
- 数字：全连出发 104 人，到吴起 19 人（虚构）；中央红军出发 8.6 万余人，到陕甘 7000 余人（史实）。
- 名单状态：何指导员“到（别的连）”、细妹“到”、林先生“到”、老周“没有应”、灶王“没有应”、飞毛腿“没有应”、冬生“到”。
- 五卡不显示“亮了几张”；只逐张显示亮/灰与一句记录。没有“通关”“完美”“评分”。
- 回标题后“继续”可重看结局；“史实图鉴”打开 gallery；不提供“再玩一次”大按钮（开始就是新局）。

### S4 点名交互（interact，不是第 5 关）

- story 节点：type='interact'，id 以 w 开头，mode='rollcall'，duration=45，names 顺序 7 人。
- 数据顺序：he（何指导员，remote）、ximei（细妹，self）、lin（林先生，self）、zhou（老周，absent）、zaowang（灶王，absent）、feimao（飞毛腿，absent）、dongsheng（冬生，self）。
- remote/self：显示“到”，约 700ms 后自动下一位；不要求玩家输入。
- absent：显示“没有人应”，给 4 秒窗口；玩家按空格/Enter/点 240×64 的“替他答到”按钮，状态 player；窗口过完没按，状态 missed，自动下一位。
- 总上限 45 秒；到 7 人或 45 秒结束。结束写 ending.names、ending.answered、ending.missed、memory.rollcall_missed_any，保存，隐藏覆盖层，推进到下一节点。
- 漏答不重开、不扣分、不弹 Game Over；45 秒时未念到的名字一律 missed（self/remote 可先自动完成）。
- 刷新回到 interact 节点开头，重念；不保存中间状态。
- #vn-interact 是 DOM 覆盖层，不是 Canvas，不调用 XB.minigames；暂停/页面隐藏冻结计时；Esc 打开暂停。
- 交互后条件文本：memory.rollcall_missed_any 为真写“有几个名字，我没有替他们答上来。”；为假写“三个人的名字，我都替他们答了。”
- 张老幺不进连队点名；他只通过 memory.zhang 进五卡·船工与图鉴回看。

### S5 史实图鉴页

- #codex-gallery 是全屏遮罩，7 卡 3+3+1；每卡显示标题、类型（史实/回忆录/文学）、所属章节、锁定状态。
- 入口：标题菜单“史实图鉴”；暂停菜单新增“史实图鉴”；两处都打开同一 gallery。
- 锁卡：虚线边、灰字、显示“第 X 章解锁”，点击只 toast，不开正文。
- 开卡：复用 #codex 单张弹窗，openCodex(id,{unlock:false,onClose:backToGallery})；关闭回 gallery，不重复解锁。
- 计数“已解锁 n/7”；不新增存档键；codex 数组仍是唯一来源。
- Esc/关闭按钮/焦点陷阱；关闭后焦点回触发按钮；gallery 打开时暂停菜单不作为背景可点。

### S6 五卡计算与文案

- 五卡只在 engine.buildEnding 一次计算；文案集中在 XB.story.ending.cards；不在引擎写死中文。
- 条件与文案见附录 B；ending.cards 每项只存 {lit,line}；不写 card.*。
- 不强制至少一张亮；全灰是允许结果；不计算“亮卡数”。
- 触发：
  - ideal：fire ≥ 20
  - sacrifice：choice.xiangjiang.hold === true
  - truth：choice.zunyi.admit ≥ 2
  - overall：choice.jinsha.priority === "main"
  - people：trust ≥ 3 && memory.zhang === true
- 五卡顺序固定：理想信念、不怕牺牲、独立自主、顾全大局、依靠人民。
- 结果页不再放五卡；五卡只在 ending 面板；避免与“结算”混淆。

### S7 遵义累计与错误卡

- 三条遵义 choice 不写 record；只 set choice.zunyi.admit=+1/+0；第三组 A 额外 set choice.zunyi.missed=+1。
- FLAG_DEFAULTS 增加 choice.zunyi.admit=0（九项变十项）；FLAG_LIMITS 加 [0,3]；state-schema 同步。
- applyChoice 仍把三条写进 choices 日志（option/text/timedOut），错误卡从日志取最近 3 条遵义选择。
- 错误卡 result 节点加 source='zunyi'；engine buildZunyiCard(state) 用最近 3 条 zunyi choices 配三条固定问题，结论按 admit 0/1/2/3 写一句；不评分、不写旗标。
- 若日志不足 3 条（调试跳章），显示“记录不全”，不伪造。
- choice.zunyi.missed 仍 0/1；不参与五卡，只进名册/回看。

### S8 memory 类型与章末记忆

- memory.luding_unknown、memory.door 改 boolean；剧本 B=true/A=false；留吴起=true/带回=false；state-schema 同步。
- 新增 memory.rollcall_missed_any（boolean，默认 false），只由点名交互写。
- CHAPTER_MEMORY：
  - xiangjiang 完成 → memory.zhou=true
  - zunyi 完成 → memory.he=true
  - luding 完成 → memory.feimao=true
  - grass 完成 → memory.zaowang=true
  - 进入 wuqi → memory.ximei=true、memory.dongsheng=true、memory.lin=true
  - jinsha 记名选中张老幺 → memory.zhang=true（交互写）
  - wuqi 选 A → memory.door=true；选 B → false
- finishChapter 先写本章记忆，再解锁下一章；记忆写入走 setFlag 白名单；不直接改 flags 对象。
- 已存在的 memory 不覆盖为 false；只置 true 的保持 true。重玩章节不把已有 true 改回 false。

### S9 门板分支：不用 option.when，用节点级 when

- 保持 renderChoice 无条件渲染 node.options；不引入 option 级过滤；避免空选项和“不可能项”。
- p039：p039a（when item.door，原文）、p039b（when !item.door，新写）；p040 北；p041/p042 改中性措辞（“收好”“按完”）；不加第三个分支。
- 湘江：x 的 choice 拆 x??a（when item.door，A/B/C，默认 C）与 x??b（when !item.door，A/B，默认 A）；A/B 文案与 set 不变，C 只在有门板时出现。
- 泸定：门板 choice 节点加 when item.door；另加 l??b 一行（when !item.door）“我背上没有门板。过桥的时候，手只能抓住铁索。”；names choice 不变。
- 吴起：见 S10；有门板走 choice，无门板走替代行；不出现“把门板留在吴起”选项。
- 不新增 option.when；C16 不扩 option 级白名单；C14 只校验节点级 choice。

### S10 吴起章重写（去固定替答 + 无门板分支）

源文件 docs/script/06-wuqi.md 的 45–52 行固定写“我替他答了一声”，与交互重复，且漏答时矛盾。T5.1 必须按下面结构重写，再誊进 story.js：

1. 保留 1–13 行；15–21 行整段包进 [[if:item.door]]；[[else]] 只放一行：“林先生想借门板写标语。我背后空着，她只好找了一面石墙。”
2. 23–25 行 choice 只给 item.door 为真时显示；[[else]] 放一行：“我站在墙边，看她把标语写在石头上。”
3. 27–33 行的“门板还背/留墙”改为三种可见结果：
   - when item.door：原文 28–30 行（门板还绑在背上）。
   - when !item.door && memory.door：门板留在墙上，红漆压住铅笔。
   - when !item.door && !memory.door：标语写在石墙上，红漆压在铅笔旁边。
4. 45–52 行删掉 8 行，换成 3 行“念到老周/灶王/飞毛腿，没有人应”+ 现有【交互】点名（补 mode=rollcall,duration=45）+ [[if:memory.rollcall_missed_any]] 两行总结。
5. 删除 55、62、74 三个【结算】节点（点名/五卡/声明）；这些内容由 ending 面板承担。
6. 保留 75 codex、76 end；w900.next=ending。
7. 实际 49 节点（45 line / 1 choice / 1 interact / 1 codex / 1 end）；以 count-words 重数为准，已回填附录 A。
8. 字数/beat 重算；总分仍须 ≤20 分钟；若吴起变短，不补新口号，宁可留白。

### S11 切章、解锁与地图

- finishChapter 认三种 next：章节 id、'ending'、'map'。
- 章节 id：写本章记忆 → 解锁 next → nodeId=null → go('map') → toast“「下一章名」已解锁”。
- ending：写本章记忆 → buildEnding → nodeId=null → scene='ending' → save/render；不查 chapterById('ending')。
- map：直接 go('map')；不再写“本步只做到序章”。
- 地图站点：7 站固定；playable 且 unlocked 才可点；已完成章可重进（从首节点重玩），不新增“已完成”状态。
- 进入 wuqi 时写 ximei/dongsheng/lin 三条前置记忆；只在进入时写 true，不覆盖 false。
- 标题卡仍在上一章末尾（源文本顺序），不改成开场卡；避免重复。
- ?chapter= 调试支持七章；进入章节不写记忆（调试不算正式流程），但 B44 必须走正式流程。

### S12 normalize、存档与刷新

- scene 合法值：title/map/vn/ending；ending 时 nodeId 必须 null；非 ending 且 nodeId=null 只允许 title/map。
- ending 快照校验：stats 四个数字、names 7 项且 id 不重复、cards 五个固定键、answered/missed 0–3、无未知键；不完整且 scene=ending → 回 map + issue，不白屏。
- flags：choice.zunyi.admit 缺省 0、夹取 0–3；memory.luding_unknown/door/rollcall_missed_any 转 boolean；item.door/item.pot 仍转 bool；inventory.door 以 flags 为准。
- PERSIST_KEYS 仍 11 个：version、scene、chapterId、nodeId、flags、inventory、choices、codex、settings、unlockedChapters、ending。
- ending 快照只由引擎写；剧本不得写 ending.*；不新增 card.*。
- 保存点：进入章节、每个 line beat、choice 结算、minigame 结算、记名/点名结束、codex 关闭、标题卡关闭、ending 生成、设置变更。
- 不保存点名中间态；interact 节点刷新从开头重念；ending 刷新直接渲染快照。
- 4096 B 上限；ending 快照控制在 1.5 KB 内；超限时报“存档异常”，不静默截断。

### S13 12 张背景与 art.js 扩展

- SCENES 从 4 扩到 16；PAINTERS 同步；C11 从“四个必需”改为“16 个注册 + story bg 全覆盖”。
- 复用现有 ridge/纸纹/江面白线/雾/剪影/暖窗笔触；新增 3–4 个共享 helper：水面横线、雾带、火点、铁索/土墙；不写 12 套独立画法。
- 每张 1280×720 设计坐标；不写字、不画人物正脸、不做写实照片感；版画层叠、留白。
- 12 张构图见附录 E；夜晚场景用夜蓝，白天用纸白/土黄；朱砂只做印章/火点/标语，不大面积铺。
- paint 仍是静态一次绘制；不引入 rAF 动画；DPR 上限 2；resize 只重绘当前场景。
- ending 背景用 wuqi_wall，不新增第 17 个画面；结局纸面板压在上面。
- C11/S17 更新为 16 个 id；C05 JS gzip 仍 ≤150 KB。

### S14 工具升级

- check-build 23→30：改 C13（序章 49 节点、p039 分支）、C14（全章 choice 契约）、C16（动态 when 白名单）、C17（end.next 允许 ending、全章可达）；新增 C24–C30（附录 F）。
- smoke 33→40：S34 全章走通、S35 遵义累计、S36 章末记忆、S37 五卡边界、S38 ending 快照/11 键、S39 图鉴、S40 点名状态机。
- check-script：认 interact / next=ending；count-words 排除交互/结算/标题卡；改稿后回填。
- 负例 N5–N8：w900.next 缺失、五卡强制点亮、点名 30s、ending 快照多键；四个必须报红，不提交负例改动。
- C06 仍扫剧情文本与图鉴；C23 仍扫小游戏禁用词；C09 无图片/音频；C10 无散落 hex；C12 预览 10 类不变。

### S15 文档与交班

- 新建 docs/chapter-integration.md，作为七章接入/结局/点名的唯一细节源；本计划只引用，不复制全部表。
- docs/script/README.md 是文本源格式唯一约定；T5.1 改稿先改 md，再同步 story.js，提交信息写“文本同步: 吴起/序章”。
- docs/state-schema.md 与 engine 同步；docs/ui-layout.md 与 index/style 同步；docs/test-cases.md 与步骤七同步。
- 步骤六只接音频/动效，不改本章数据；步骤七补 Chrome/Safari/真机/隐私/20 分钟；步骤八打包。
- 不在本步 deploy、不发布视频、不打字体包。

## 5 任务卡

### T5.0 先改文档与契约（40 / 24 分钟）

**目的**：把七章节点表、ending 快照、点名状态、五卡边界、图鉴/面板坐标一次写清；代码未动。

**输入**：本计划 §1.4、§4、附录 A–F；docs/script 七章；docs/state-schema.md；docs/ui-layout.md；docs/test-cases.md；docs/story-bible.md。

**动作**：
1. 新建 docs/chapter-integration.md，至少八节：七章表、节点 id 规则、ending 快照、点名状态机、五卡、图鉴、章末记忆、调试/刷新。
2. 改 docs/script/README.md：七章节点表、wuqi 行类型、interact 写法、end.next=ending、字数/beat 表；先跑 count-words 记录旧值。
3. 改 docs/state-schema.md：scene 加 ending；ending 形状；memory 三个 bool；choice.zunyi.admit 默认 0/范围 0–3；十项默认旗标；11 键不变。
4. 改 docs/story-bible.md §5：删“至少一张卡必亮”；写全灰允许；五卡触发与文案表；ending 结构引用。
5. 改 docs/ui-layout.md：ending 880×560（200,80）；gallery 7 卡 3+3+1；interact 面板；z-index；44px。
6. 改 docs/test-cases.md：T13 由 grain 改 fire/trust/load；T14/T15 具体化；T06/T07 补七章；加 T14 刷新 ending。
7. 改 docs/quality-bar.md：结局/图鉴/点名键盘、对比度、44px、无 hover、reduced-motion。
8. 在 docs/chapter-integration.md 记录 14 条矛盾的处理结果；不写“以后再定”。

**产出**：上述文档；本计划附录 A 的节点表按 277 填，T5.1 重数后可改一次。

**完成判据**：
- 七章表有 id、前缀、line/choice/minigame/result/title/codex/interact/end、end.next、字数、beat。
- ending 快照有完整 JSON 示例（附录 D）。
- 五卡边界表可直接当测试用例。
- 图鉴/结局/点名坐标与 44px 写清。
- 没有代码改动。

**常见坑**：
- 把“至少一张亮”留着不删；把 104/19 标成史实；把 8.6 万/7000 标成虚构。
- ending 又写成第 7 章/多结局；把点名写成第 5 个小游戏。
- 只改 README 不改 state-schema；五卡文案与 story-bible 两处不一致。

### T5.1 六章誊写与文本修订（160 / 90 分钟）

**目的**：把六章源文本变成 story.js 的扁平节点图；七章全部 playable；7 张 codex；ending 数据就位。

**输入**：docs/script 七章；docs/chapter-integration.md；现有 story.js 序章；本计划 S1/S7/S8/S10。

**动作**：
1. 先改文本源：docs/script/00-prologue.md 的 p039 分支与 p041/p042 中性措辞；docs/script/02-zunyi.md 三条 choice 去 record、只 set 累计；docs/script/04-luding.md 的 memory.luding_unknown 改 boolean；docs/script/06-wuqi.md 按 S10 重写。
2. 跑 count-words + check-script，回填 00/02/06 文件头与 README 统计表；记录吴起重数结果。
3. 誊写 xiangjiang：36 line + 2 choice（有/无门板）+ 1 minigame + 1 result + 1 title + 1 codex + 1 end；x900.next=zunyi。
4. 誊写 zunyi：26 line + 3 choice（无 timeout、无 record、set 累计）+ 1 result（source=zunyi）+ 1 title + 1 codex + 1 end；z900.next=jinsha。
5. 誊写 jinsha：27 line + 1 choice + 1 minigame + 2 result（渡江/记名）+ 1 title + 1 codex + 1 interact（记名 8s）+ 1 end；j900.next=luding。
6. 誊写 luding：29 line（含无门板替代行）+ 2 choice + 1 minigame + 1 result + 1 title + 1 codex + 1 end；l900.next=grass。
7. 誊写 grass：27 line + 2 choice + 1 title + 1 codex + 1 end；g900.next=wuqi。
8. 誊写 wuqi：45 line + 1 choice + 1 interact + 1 codex + 1 end；w900.next=ending；删 3 个 result。
9. 在 story.js 加 XB.story.ending：stats、names、cards（id/title/litLine/unlitLine）、disclaimer；不写 card.*。
10. 七章 chapter.playable=true；七章按 order 1–7；p900 保持 xiangjiang；codex 仍 7 张。

**产出**：project/story.js 共 277 节点；docs/script/00、02、06 与 README 更新；docs/chapter-integration.md 的节点表回填。

**完成判据**：
- 七章数组都存在、playable=true、order 正确、节点 id 全局唯一。
- 每章末是 end；next 链完整到 ending；w900.next='ending'。
- 7 个 codex 节点各出现一次；标题卡 6 个（吴起无）。
- C24/C25/C26/C27 绿；check-script 通过；无禁用词；无真实领导人台词。
- 字数/beat 与 README/文件头四处一致。

**常见坑**：
- 遵义仍写 record，admit 被覆盖成 0/1。
- 湘江 x?? 无门板仍显示 C；泸定/吴起无门板仍显示门板选项。
- 吴起固定“我替他答”没删干净，和交互重复。
- 把 3 个 result 留在吴起，ending 又重复一遍。
- codex 顺序/标题卡顺序错；end 写成 map 或下一章不存在。
- 节点 id 重排 p001–p044；分支 suffix 冲突。
- 把 ending 写成 chapterById 的章节，C17 红。

### T5.2 12 张章节背景（100 / 60 分钟）

**目的**：让六章 12 个 bg 都有程序化版画，不出现纸白/夜蓝兜底或隐藏画布。

**输入**：project/art.js；docs/ui-layout.md；本计划附录 E；story.js 的 bg 字段。

**动作**：
1. 扩 SCENES 为 16：title、map、yudu_river、yudu_night、xiangjiang_ford、xiangjiang_dawn、zunyi_hall、zunyi_street、jinsha_river、jinsha_night、luding_bridge、luding_after、grass_marsh、grass_dawn、wuqi_dawn、wuqi_wall。
2. 每个场景写一个 paintX 函数，注册进 PAINTERS；复用 ridge/纸纹/江面白线/雾/剪影/暖窗；新增 3–4 个共享 helper（水面横线、雾带、火点、铁索/土墙），不写 12 套独立画法。
3. 按附录 E 构图；不写字、不画人物正脸、不做写实照片感；朱砂只做印章/火点/标语。
4. resize/paint 仍一次静态绘制；DPR 上限 2；未知 scene 仍返回 false + 纸白兜底；不引入 rAF。
5. 更新 smoke S17 与 check-build C11 的 16 场景清单；预览页不塞新场景（仍 10 类组件）。
6. 用 ?debug 或 ui-preview 逐张切 1280；记录 paint 时长。

**产出**：project/art.js 16 场景；C11/S17 绿；12 张 1280 截图。

**完成判据**：
- 每个 story bg 都能在 SCENES 找到；无未知 bg。
- 12 张都能在 1280×720 看清层次；无文字、无人物正脸、无外部图片。
- paint 单帧不超 16ms（目标 ≤5ms）；JS gzip 仍 ≤150 KB。
- 未知 scene 仍不白屏。

**常见坑**：
- 12 个场景各写一套山形/水面，代码膨胀；先抽 3–4 个 helper。
- 把朱砂大面积铺在夜景，对比度/风格都坏。
- 画人物正脸或写标语文字，越界。
- 忘记 PAINTERS 注册，SCENES 有 id 但 paint 报错。
- 新增图片/字体；C09 红。

### T5.3 结局场景与切章外壳（80 / 45 分钟）

**目的**：让 w900 能进入第 4 个 UI 场景 ending，刷新能回，回标题/图鉴可用；先做壳，五卡内容在 T5.6 填。

**输入**：project/index.html；project/style.css；project/engine.js；docs/ui-layout.md；本计划 S2/S3/S12。

**动作**：
1. index.html 在 #scene-vn 后加 #scene-ending（hidden）：#ending-panel、#ending-title、#ending-names、#ending-stats、#ending-cards、#ending-disclaimer、#ending-home、#ending-codex。
2. style.css 加 .scene-ending / .xb-ending 布局：880×560（200,80）、纸底、3+2 卡片区、名单/数字/声明；只用令牌；44px 按钮。
3. engine.js：SCENES 加 ending；normalize 允许 ending+null node；applyStartScene 保留 ending；showScene/render 加 ending；go('ending') 清理计时；resumeGame 支持 ending。
4. renderEnding 先渲染壳：标题/日期/名单占位/数字/五卡占位/声明/按钮；T5.6 填内容。
5. finishChapter 先只处理 next='ending'：buildEnding 占位、state.scene='ending'、nodeId=null、save/render；章节 next 仍走原 map，T5.7 再统一。
6. 加 #ending-home（回标题）、#ending-codex（打开 gallery；T5.5 接）；Esc 不退出 ending，只关 gallery。
7. updateDebug 显示 scene=ending 与 ending 是否存在。

**产出**：index/style/engine 的 ending 壳；w900 可手动跳到 ending；刷新回 ending；回标题可继续。

**完成判据**：
- ?chapter=wuqi 或手动 w900 能进 ending；刷新仍在 ending；回标题“继续”能回 ending。
- 1280/1366/844×390 不出界；面板不遮按钮。
- 无 console error；不新增存档键。
- 结局壳不显示“成功/通关/评分”。

**常见坑**：
- 只加 section 不改 normalize，刷新判坏档。
- applyStartScene 把 ending 归 map，刷新回地图。
- 面板仍 760×480，7 人+五卡溢出。
- 改 PERSIST_KEYS 加 ending 子键。
- 回标题“继续”只能回 vn，ending 丢失。

### T5.4 点名交互（75 / 42 分钟）

**目的**：实现 45 秒 DOM 点名；7 人顺序、自动答到、替答、漏答、暂停/刷新都有定义。

**输入**：project/index.html；style.css；engine.js；story.js 的 interact 节点；本计划 S4。

**动作**：
1. index.html 在 #scene-vn 内加 #vn-interact（hidden）：#interact-kicker、#interact-name、#interact-status、#interact-timer、#interact-progress、#interact-answer、#interact-live。
2. style.css：覆盖层全屏半透明夜蓝；中间纸面板 620×320；名字 40px；按钮 240×64；计时条；44px；焦点可见；reduced-motion 不闪烁。
3. engine.js 加 startRollcall(node)/stopRollcall/advanceRollcall；状态：self/remote 700ms 自动；absent 4s 窗口；总 45s；空格/Enter/点击替答；Esc 暂停冻结。
4. 结束写 state.ending.names（7 项，status=self/remote/player/missed）、answered/missed；setFlag memory.rollcall_missed_any = missed>0；save；隐藏；advance。
5. 输入守卫：interact active 时 #scene-vn 的 pointer/空格/Enter 不推进对话；暂停/可见性冻结计时；不调用 XB.minigames。
6. 刷新：interact 节点重新开始；不保存中间状态；ending.names 只在结束时写。
7. 无障碍：aria-live 报名字/状态；按钮有 aria-label；焦点进入面板；结束后焦点回对话。

**产出**：点名覆盖层 + 状态机；B38/B39 可测；S40 纯函数/状态测试。

**完成判据**：
- 7 人顺序正确；何/细妹/林/冬生自动；老周/灶王/飞毛腿需替答。
- 全替答 → answered=3、missed=0、memory.rollcall_missed_any=false。
- 漏 1 人 → missed=1、flag=true；漏答不重开/不评分。
- 45s 总上限；暂停/切页不偷时间；刷新重念。
- 844×390 可单手点；无 console error。

**常见坑**：
- 把点名做成 Canvas 第 5 关；把漏答做成失败/重开。
- 交互 active 时空格同时推进对话，名字跳两位。
- 45s 到了不结算；暂停继续后跳秒。
- 把张老幺写进连队点名。
- 用 aria-live 每 100ms 报计时，读屏爆炸。

### T5.5 史实图鉴页（60 / 34 分钟）

**目的**：7 张史实注从“单张弹窗”升级为 0/7–7/7 的图鉴页，标题与暂停都能进。

**输入**：project/index.html；style.css；engine.js；story.codex；本计划 S5。

**动作**：
1. index.html 加 #codex-gallery（hidden）：标题、计数、7 卡网格、关闭；卡片由 engine 生成，不手写 7 份。
2. style.css：全屏纸底/夜蓝遮罩；7 卡 3+3+1；每卡标题/类型/章节/锁定；锁定虚线；44px；焦点。
3. engine.js：openCodexGallery/closeCodexGallery/renderCodexGallery；标题“史实图鉴”与暂停新按钮调用；关闭回触发点。
4. 锁卡点击只 toast“第 X 章解锁”；开卡 openCodex(id,{unlock:false,onClose:backToGallery})；关闭不清空 gallery。
5. 计数 n/7 从 state.codex 算；不新增存档键；不重复解锁。
6. 焦点陷阱；Esc 关闭；gallery 打开时背景不可点；手机横屏卡片不溢出。

**产出**：#codex-gallery + 7 卡渲染；标题/暂停入口；B31/B40。

**完成判据**：
- 新局 0/7，7 张全锁；逐章解锁后 7/7。
- 锁卡不可开；开卡显示完整正文/出处/争议行；关闭回 gallery。
- 标题与暂停都能进；Esc 关闭；焦点回触发按钮。
- 844×390 不出界；无 console error；无外部资源。

**常见坑**：
- 7 张卡手写死在 index，和 story.codex 双源。
- 锁卡也能点开，或开卡后 count 不变。
- 关闭 gallery 把单张弹窗也一起关两次。
- 新增 codex 存档键；C30 红。

### T5.6 五卡与结局内容（60 / 34 分钟）

**目的**：buildEnding 生成点名/数字/五卡/声明；边界值正确；全灰路径可到；不评分。

**输入**：story.js 的 XB.story.ending；engine.js；style.css；本计划 S6/附录 B/D。

**动作**：
1. story.js 填 ending.cards 五条：id/title/litLine/unlitLine；文案按附录 B，逐字。
2. engine.js buildEnding(state)：按条件算 lit；line 取 litLine/unlitLine；cards 五项；stats 固定；names 从 state.ending.names（T5.4）取，缺失时按 memory 生成默认；answered/missed 保留。
3. renderEnding 填名字状态、两行数字（标虚构/史实）、五卡 3+2、声明、按钮；不显示亮卡数。
4. finishChapter next='ending' 调 buildEnding，保存；重复进入 ending 用快照，不重算覆盖（除非缺字段）。
5. 五卡边界：fire 19/20；hold false/true；admit 1/2；priority wounded/main；trust 2/3 + memory.zhang false/true。
6. 全灰路径：无门板、湘江 B、遵义全 B、金沙江 B/C、不记张老幺、泸定/草地按灰、点名漏答；到 ending 五卡全灰，不出现失败字样。
7. 不写 card.*；不把五卡放进 result；不加“完美通关”。

**产出**：buildEnding + 结局内容；五卡边界测试；B38/B39。

**完成判据**：
- 五个条件逐项正确；全亮/全灰/混合都能渲染。
- 名字状态与点名交互一致；数字标注正确。
- 无 score/rank/星级/成功失败/亮卡数。
- 刷新 ending 内容不变；回标题再继续仍一致。

**常见坑**：
- 条件写成 > 而不是 ≥；admit 用 1 就亮。
- 把“至少一张亮”写进代码，强行把 ideal 点亮。
- 全连 104/19 标成史实；8.6 万/7000 标成虚构。
- 卡片文案与 story-bible 两份不一致。
- 结局显示“5 张里亮了 3 张”，变成评分。

### T5.7 分支、存档与切章收口（65 / 36 分钟）

**目的**：把 p039/湘江/泸定/吴起门板分支、遵义累计、memory bool、normalize、finishChapter 全部收口；有/无门板都不出不可能选项。

**输入**：story.js；engine.js；state-schema；本计划 S7/S8/S9/S10/S11/S12。

**动作**：
1. p039a/p039b；p040–p042 中性措辞；C13 期望 49。
2. 湘江 choice 拆 x??a/x??b；C14 允许同位置两条 choice；C16 不引入 option.when。
3. 泸定 l?? door choice when item.door；l??b 无门板行；吴起按 S10 三种门板结果；w choice 只 when item.door。
4. 遵义三条 choice 去 record；FLAG_DEFAULTS 加 choice.zunyi.admit=0；FLAG_LIMITS 0–3；applyChoice 不再覆盖累计。
5. memory.luding_unknown/door 转 boolean；加 memory.rollcall_missed_any；normalize 转换/过滤。
6. normalize 支持 scene=ending + nodeId=null；ending 快照校验；applyStartScene/resumeGame 支持 ending。
7. finishChapter 统一：章节→记忆+解锁+map+toast；ending→buildEnding+ending；map→map；不再“本步只做到序章”。
8. 进入 wuqi 写 ximei/dongsheng/lin；章末写 zhou/he/feimao/zaowang；不覆盖已有 true。
9. 地图七站全部可解锁；enterStation 同章 nodeId 可 resume；已完成章重进从首节点。

**产出**：分支/存档/切章全部收口；C13/C14/C16/C17/C29/C30 绿。

**完成判据**：
- 有门板：p039a、湘江 A/B/C、泸定 A/B、吴起 A/B 都正确。
- 无门板：p039b、湘江 A/B（无 C）、泸定替代行、吴起替代行；无不可能选项。
- 遵义 0/1/2/3 次承认 → admit 0/1/2/3；五卡 truth 只在 ≥2 亮。
- 章末记忆正确；进入吴起三条前置 true。
- 刷新：章中回节点、ending 回结局、interact 回开头；11 键不变。

**常见坑**：
- 用 option.when 过滤，renderChoice 不认，出现空选项。
- 湘江拆 choice 后 defaultOption 仍 C（无门板分支没有 C）。
- 遵义 record 没删干净，applyChoice 仍覆盖。
- normalize 把 ending 当坏档；或允许任意 scene。
- finishChapter 对 ending 调 chapterById('ending')。
- 进入 wuqi 才写 memory.ximei，但点名读得太早。

### T5.8 工具与测试（60 / 34 分钟）

**目的**：让 30 项 check-build、40 项 smoke 真正覆盖七章/ending/点名/图鉴，而不是只“文件存在”。

**输入**：project/tools/check-build.js；smoke.js；check-script.js；docs/chapter-integration.md；本计划附录 F。

**动作**：
1. 改 C13：序章 49 节点、p039a/p039b、p001–p020 顺序、p900.next=xiangjiang。
2. 改 C14：全章 choice 2–3 项、key 连续、text≤14、cost≤22、set 白名单；timeout 1–30 可选；有 timeout 必须有 defaultOption；record 可选，有 record 必须是 choice.*；无 record 不要求 value。
3. 改 C16：when 白名单从 FLAG_DEFAULTS/FLAG_KEYS/memory/choice 动态生成；仍拒绝 ending.*/card.* 写入；item.door 镜像测试保留。
4. 改 C17：end.next 允许章节或 ending；七章默认路径可达；7 codex 仍冻结；PERSIST_KEYS 11 键仍冻结。
5. 新增 C24 七章表/节点数/id 前缀/end/playable；C25 7 codex 节点；C26 ending 数据/w900/SCENES；C27 interact 点名；C28 gallery DOM/CSS；C29 CHAPTER_MEMORY；C30 ending 快照/11 键/4096。
6. smoke S34 全章走通；S35 遵义累计 0–3；S36 章末记忆/进入吴起；S37 五卡边界；S38 ending normalize/11 键；S39 图鉴 0/7–7/7；S40 点名状态机。
7. check-script 支持 interact/next=ending；count-words 排除交互/结算/标题卡；改稿后回填。
8. 四个负例：N5 w900.next 缺失；N6 五卡强制点亮；N7 点名 duration=30；N8 ending 快照多键。逐个注入、确认报红、回滚。

**产出**：check-build 30/30；smoke 40/40；check-script 通过；四负例记录。

**完成判据**：
- 30 项全绿；40 项全绿；check-script 通过；四负例均报红且回滚后全绿。
- C24 的节点数与 docs/chapter-integration.md 一致；不一致时先改文档再改代码。
- 负例不提交；不把 skip 写进工具。

**常见坑**：
- C14 仍只扫序章，新章 choice 漏检。
- C16 硬编码旧四个 when，新 memory/choice 全红或全放行。
- C17 把 ending 判成不存在章节。
- C24 硬编码 277，吴起重数后不更新。
- 负例注入忘了回滚，提交带红。

### T5.9 浏览器实测（70 / 40 分钟）

**目的**：用 Edge headless 留 A 级证据；七章、ending、点名、图鉴、无门板路径都实际跑过。

**输入**：project/ 全套；check-build/smoke；B31–B44 表；file:// 与本地 http。

**动作**：
1. B31 标题图鉴 0/7；B32 序章带门板到 p039a，地图解锁湘江。
2. B33 湘江弃物 + 门板选项 C；再跑无门板路径，确认无 C。
3. B34 遵义三次承认/三次不承认/混合，错误卡与 admit 正确。
4. B35 金沙江渡船 + 记名选张老幺/不选；memory.zhang 正确。
5. B36 泸定有门板/无门板；铺桥/抱板；names A/B。
6. B37 草地分粮/锅；fire/trust/load/item.pot 正确。
7. B38 吴起有门板；点名全替答；ending 五卡/数字/名单。
8. B39 无门板；点名漏答；ending 全灰或混合；不重开/不评分。
9. B40 图鉴 7/7；锁卡/开卡/关闭/焦点。
10. B41 ending 刷新；回标题“继续”回 ending；“开始”新局。
11. B42 844×390 触摸：点名按钮/图鉴卡/结局按钮可单手点。
12. B43 file:// 与 http 各一次；0 console error、0 404、0 外部请求。
13. B44 从标题到 ending 完整计时一次；记录总时长、七章、四关、点名、ending；不把一次当三次验收。
14. 截图命名 b31-… 至 b44-…；run-log 写环境/结果/例外；只报 Edge。

**产出**：docs/evidence/step-05/run-log.md；截图；B31–B44 表。

**完成判据**：
- B31–B44 全部有结果；无白屏/断链/空节点。
- Console 0 error；无 404；无外部请求。
- 手机横屏可完成点名/图鉴/结局；不依赖 hover。
- 完整流程 ≤20 分钟；超时记录并按红线裁剪，不隐瞒。

**常见坑**：
- 只测有门板路径；无门板文本/选项没跑。
- 只点“继续”不点“替答”；点名状态没覆盖。
- 刷新测试只测章中，不测 ending/interact。
- 把 Edge 写成 Chrome/Safari 全绿；把一次计时写成三次。

### T5.10 复核与交班（30 / 16 分钟）

**目的**：回填 §11、更新状态源、提交/tag；把欠账写清。

**输入**：T5.0–T5.9 产出；CLAUDE.md；git。

**动作**：
1. 回填本文件 §11：日期、环境、30/40、B31–B44、例外、欠账。
2. 更新 .claude/CLAUDE.md：步骤五 ✅；步骤六 ⬜；已知风险/欠账（Chrome/Safari/真机/隐私/20 分钟三次/字体）。
3. 检查 git status：不带 docs/evidence、截图、ZIP、字体、大文件；提交信息“feat: 七章接入与结局（步骤五）”。
4. 打 tag step-5-done；不 deploy、不发布视频。
5. 在 step/README.md 不改状态；状态只在 CLAUDE.md。

**产出**：§11 完成；CLAUDE 更新；commit + tag。

**完成判据**：
- §11 六节填完；证据级别明确。
- CLAUDE 步骤表与当前进度一致；步骤六 ⬜。
- git status 干净；tag 指向本次提交。
- 欠账没有隐藏。

**常见坑**：
- 只改 CLAUDE 不改 §11；或只写“全绿”不写例外。
- 提交带 evidence/截图/字体。
- 未确认就 deploy。

## 6 时间盒

### 6.1 标准（800 分钟 = 13h20）

T5.0 40 → T5.1 160 → T5.2 100 → T5.3 80 → T5.4 75 → T5.5 60 → T5.6 60 → T5.7 65 → T5.8 60 → T5.9 70 → T5.10 30。

### 6.2 压缩（455 分钟 = 7h35）

T5.0 24 → T5.1 90 → T5.2 60 → T5.3 45 → T5.4 42 → T5.5 34 → T5.6 34 → T5.7 36 → T5.8 34 → T5.9 40 → T5.10 16。

压缩只能砍“重复实测/美化/多余动效/非关键背景细节”，不能砍：七章可走通、ending/点名/五卡、无门板路径、C24–C30、B38/B39/B44、存档 11 键、控制台 0 error。

### 6.3 脱离时间盒的触发

- T5.1 超过 200 分钟：先停，检查是否在逐句重写而不是誊写；源文本已定，只补分支与删固定替答。
- T5.2 超过 120 分钟：先保 12 张都能看，砍细节；不写 12 套独立画法。
- T5.3 超过 100 分钟：先保 1280 与 ending 刷新，1366/844 用缩放验证；记录例外。
- T5.4 超过 95 分钟：先保 7 人顺序/替答/45s，砍动画与音效（本步本来无音频）。
- T5.6 超过 80 分钟：先保五卡条件与边界，砍卡片装饰。
- T5.7 超过 85 分钟：先保无门板路径与 ending normalize，其他分支记录未测。
- T5.8 超过 80 分钟：先保 C24–C27/S34–S37，C28–C30 记录未跑；不得 skip。
- T5.9 超过 90 分钟：先完成 B31–B39，B40–B44 记录未测，不假装全绿。

## 7 验收清单

### 7.1 E1–E16

| 编号 | 验收项 | 通过标准 | 对应 T/B | 证据 |
|---|---|---|---|---|
| E1 | 七章从头玩到尾 | 标题→序章→湘江→遵义→金沙江→泸定→草地→吴起→ending；无断链/空节点 | T5.1/T5.7；B32–B38/B44 | 截图/录屏 |
| E2 | 结局点名 + 数字 + 五卡 | 7 人状态、104→19（虚构）、8.6 万→7000（史实）、五卡 3+2、声明 | T5.3/T5.6；B38/B39 | 结局截图 |
| E3 | 点名交互 | 45s、7 人顺序、自动/替答/漏答、暂停/刷新、不评分 | T5.4；B38/B39 | 录屏/截图 |
| E4 | 五卡边界 | fire 19/20；hold F/T；admit 1/2；priority wounded/main；trust 2/3 + zhang F/T | T5.6；S37 | 调试表 |
| E5 | 门板分支 | p039、湘江 C、泸定铺桥、吴起留板均有/无门板正确；无不可能项 | T5.1/T5.7；B32/B33/B36/B38/B39 | 截图 |
| E6 | 7 张史实注 | 逐章解锁；gallery 0/7→7/7；锁卡不可开 | T5.1/T5.5；B31/B40 | 截图 |
| E7 | 存档/刷新 | 章中回节点、interact 回开头、ending 回结局；11 键不变 | T5.3/T5.7；B41 | 存档 JSON |
| E8 | 章末记忆/切章 | zhou/he/feimao/zaowang；wuqi 前置 ximei/dongsheng/lin；toast 正确 | T5.7；S36 | debug 截图 |
| E9 | 时长 | 一次完整计时 ≤20:00；超时按红线裁；三次留步骤七 | T5.9；B44 | 计时表 |
| E10 | 12 张背景 | 16 场景全注册；story bg 全覆盖；无图片/正脸/文字 | T5.2；C11/S17；B32–B38 | 截图/Console |
| E11 | 工具 | check-build 30/30；smoke 40/40；check-script 通过；四负例报红 | T5.8 | 终端输出 |
| E12 | 浏览器 | Edge B31–B44 全绿；0 console error；file:// + http | T5.9 | run-log |
| E13 | 手机/键盘/对比度 | 844×390 可点；Tab/Enter/Esc；44px；正文对比≥4.5 | T5.3–T5.5；B42 | 截图/尺寸 |
| E14 | 文档同步 | chapter-integration/script README/state-schema/story-bible/ui-layout/test-cases/quality-bar 与代码一致 | T5.0/T5.8 | diff |
| E15 | 状态与交付 | §11、CLAUDE 步骤表、tag step-5-done；欠账写清 | T5.10 | tag |
| E16 | 范围 | 无音频/转场/第 5 关/多结局/评分/外部素材 | T5.0–T5.10；C09/C23 | 源码/截图 |

### 7.2 本步不验收（留后续）

| 项 | 为什么不在本步 | 归属 |
|---|---|---|
| 音频/静音实际发声 | 步骤六 | 步骤六 |
| 转场/闪白/震动/墨迹划名 | 步骤六 | 步骤六 |
| Chrome/Safari/真机/隐私模式 | 步骤七 | 步骤七 |
| 20 分钟三次计时 | 步骤七 | 步骤七 |
| 断网 ZIP 完整流程 | 步骤七/八 | 步骤七/八 |
| 字体子集打包 | 步骤八 | 步骤八 |
| 部署上线/演示视频 | 步骤八 | 步骤八 |

### 7.3 证据分级写法

- A：写“Edge 156.0.0.0，file://，B38 通过，截图 b38-ending.png，Console 0 error”。
- B：代码/工具完成但未开浏览器；写“B，未跑”。
- C：只画界面/只写计划；写“C，设计稿”。
- D：未验证；写“D，未测”，不要用“应该可以”。

## 8 风险与返工触发

| 风险 | 概率 | 影响 | 预防/触发 |
|---|---|---|---|
| 六章誊写出节点错位 | 高 | 断链/跳句 | T5.1 先映射表；C24；S34 |
| 遵义 record 覆盖 | 高 | 复盘卡错 | 去 record；S35；C14 |
| memory 0/1 不生效 | 高 | 分支永远 else | 改 bool；S36；C16 |
| 无门板路径文本矛盾 | 高 | 红线/体验崩 | p039/x/l/w 分支；B33/B36/B39 |
| 吴起固定替答与交互重复 | 高 | 玩家漏答时文本矛盾 | S10 重写；B39 |
| ending 刷新判坏档 | 高 | 白屏/回地图 | normalize；B41；C30 |
| 五卡边界错 | 中 | 精神表达错 | 附录 B；S37 |
| 结局放不下 | 中 | 溢出/遮按钮 | 880×560；三档实测 |
| 12 背景拖慢/雷同 | 中 | 性能/审美 | 共享 helper；paint 计时 |
| 点名输入抢事件 | 高 | 一次跳两位/误推进 | active 守卫；B38 |
| 图鉴双源 | 中 | 文案不一致 | story.codex 唯一源；C25 |
| 工具硬编码旧结构 | 高 | 红得不合理/漏检 | C24–C30；负例 |
| 只测 Edge 写全绿 | 高 | 步骤七返工 | 明写仅 Edge；列欠账 |
| 20 分钟超时 | 中 | 硬验收失败 | B44 一次；超时按红线裁 |

**返工触发**：

- 任一章 end.next 断链：立即回滚该章，先修数据，不进入浏览器。
- 遵义 admit 仍被覆盖：停，先修 applyChoice/choice 数据。
- 无门板仍显示门板选项：停，先修分支，不进入 T5.9。
- ending 刷新回地图/白屏：不得声称“结局可刷新”通过。
- 点名漏答被做成失败/重开：停，按红线修。
- 五卡出现“亮了几张/成功/失败”：停，按红线修。
- check-build/smoke 红：先修，不 skip。
- Console error：先修，不用“已知问题”盖。

## 9 禁区

1. 不做音频、转场、闪白、震动、墨迹划名；步骤六再做。
2. 不做第 5 关；不把点名做成 Canvas 小游戏；不新增 SCENES 小游戏项。
3. 不做多结局、战斗、击杀、血腥、敌人脸、打鬼子。
4. 不把牺牲做分数；不写 score/rank/星级/完美通关/成功失败大字；不显示亮卡数。
5. 不虚构真实领导人台词；不点 22 位勇士名字；不写“害死了谁”。
6. 不把 104/19 标成史实；不把 8.6 万/7000 标成虚构；不混两个数字。
7. 不新增第七个运行时 JS 文件；不引入框架/构建链/CDN/ES module/fetch。
8. 不新增第二张舞台背景画布；不重写 art.js 四场景；不新增图片/音频/字体。
9. 不新增 SAVE_KEY/SAVE_VERSION/PERSIST_KEYS；不新增 card.*；不保存点名中间态。
10. 不在 :root 外写 hex；不引入 hover 唯一交互；不把热区降到 44px 以下。
11. 不改标题 96px、印章 360,150、菜单 120,360、10 类 xb-* 类名。
12. 不 deploy、不发布视频、不打包字体；提交前检查大文件与未授权素材。
13. 不把“写了”写成“能玩”；不把 B 级写成 A；不隐瞒欠账。

## 10 交接接口

### 10.1 给步骤六（音频与动效）

- 本步无音频；结局/点名/图鉴都不创建 AudioContext。
- 步骤六可接：章节标题卡音、点名答到音、ending 静默/口琴五音、图鉴翻页；不得自动播放，首次点击后创建。
- 暂停/可见性冻结已在引擎；音频 suspend/resume 接同一入口。
- 点名 45s 的计时在 DOM 层；步骤六加音效不得改变状态机时序。
- 无新音频文件；全部 Web Audio 合成。

### 10.2 给步骤七（测试）

- 本步只报 Edge；Chrome/Safari、真机、隐私模式、断网 ZIP 未测。
- 20 分钟只做 B44 一次；步骤七至少三次完整计时。
- 已知例外：B16 手机横屏逻辑热区 48×48 实际 26×26（全局 .vn-pause）；本步新增点名/图鉴/结局按钮必须 ≥44 实际像素，不沿用旧例外。
- 需补：T14 结局刷新、T15 七图鉴、T13 草地资源、T06 章中刷新、T07 章末解锁。
- 需补：无门板全流程、全灰五卡、点名全漏、图鉴锁卡键盘。

### 10.3 给步骤八（打包）

- 无新增图片/音频/字体；art.js 12 场景是纯代码；ZIP 离线可玩。
- story.js 增加六章后仍在 150KB gzip 预算内；不得把 docs/script 打进运行时。
- 不 deploy；步骤八再决定字体子集与部署。
- 交差设计说明可直接引用 docs/chapter-integration.md 的七章表/五卡表/点名状态机。

### 10.4 变更纪律

- 改节点/旗标/结局形状，先改 docs/chapter-integration.md 与 state-schema，再改 story/engine/tools。
- 改五卡条件，先改 story-bible/附录 B，再改 buildEnding 与 S37。
- 改坐标，先改 ui-layout，再改 index/style。
- 不得只在代码里“试一下”后不回写文档。

## 11 复核记录（执行后回填）

### 11.1 日期与环境

- 执行日期：2026-11-02
- 浏览器/版本：Microsoft Edge headless（Playwright-core 1.64.1；Edge 可执行文件本机）
- 入口：`file:///.../project/index.html` 与本地 `http://127.0.0.1:<临时端口>/`
- 视口：1280×720（基准）、844×390 DPR2 + hasTouch（移动模拟）；1366×768 与 DPR2 已在步骤四验证
- 证据目录：`docs/evidence/step-05/`（截图 00–16、`_pw-extra.log`、`_pw-extra.json`、`_pw-mobile-http.log/json`、`_neg*.log`、`_negatives.json`）

### 11.2 工具结果

- node --check：engine / story / art / minigames / tools 通过
- check-build：**30/30**
- smoke：**40/40**
- check-script：**通过**（7 个剧本；interact 与 next=ending 已识别）
- count-words：七章 4108 字 / 229 beat / 12 抉择点 / 26 选项 / 9 限时；A 口径 11:22
- 四负例：N5 命中 C24/C26/S34；N6 命中 C26/S37；N7 命中 C27/S40；N8 命中 C30/S38；全部 exit 1，源文件已恢复
- 浏览器分支脚本：`_pw-extra.js` 49/49（含 p039a、x025a 三选项、p039b、x025b、泸定跳过、吴起无门板、全答/全灰 ending、刷新/继续）；`_pw-mobile-http.js` 14/14

### 11.3 浏览器 B31–B44

| 编号 | 场景 | 环境 | 结果 | 截图 |
|---|---|---|---|---|
| B31 | 标题图鉴 0/7 | Edge | 通过：7 锁，计数 0 / 7 | 09-gallery-empty.png |
| B32 | 序章带门板 p039a | Edge | 通过：p039a 原文；无门板 p039b 分支另测 | 分支日志 |
| B33 | 湘江弃物/门板选项 | Edge | 通过：有门板 x025a 三选项；无门板 x025b 两选项；C 后进 x026a 不掉回 x025b | `_pw-extra.log` |
| B34 | 遵义三选累计 | Edge | 通过：z019/z022/z025 三次 A，错误卡“三条，都认了”，z900 切金沙江 | 02-zunyi-card.png |
| B35 | 金沙江渡船/记名 | Edge | 通过：记名张老幺，memory.zhang=true，j019“抄下 1 个名字” | 03-jinsha-name.png |
| B36 | 泸定有/无门板 | Edge | 通过：有门板 l019 出现；无门板 l018→l020；l027 留白页 | 04-luding-names.png |
| B37 | 草地分粮/锅 | Edge | 通过：g008 A、g021 A；fire35/trust1/pot true；g022a | 05-grass-pot.png |
| B38 | 吴起有门板/点名全答 | Edge | 通过：w013 A 留门板；全答 answered=3/missed=0；w027b；ending | 06/07/11 |
| B39 | 无门板/漏答/全灰 | Edge | 通过：无门板跳过 w013；漏答进 w027a；全灰 5 张 | 12-ending-all-gray.png |
| B40 | 图鉴 7/7 | Edge | 通过：计数 7 / 7，无锁卡；开卡回图鉴 | 10-gallery-full.png |
| B41 | ending 刷新/继续 | Edge | 通过：scene=ending 刷新保留；回标题再继续恢复 ending；快照 1518B | `_pw-extra.log` |
| B42 | 844×390 触摸 | Edge | 通过：stage 693×390；ending 面板 477×303；触摸开图鉴/回标题/开始；14/14 | 13/14/15/16 |
| B43 | file:// + http | Edge | 通过：file:// 全部分支；http 移动模拟 14/14；0 console error | `_pw-mobile-http.json` |
| B44 | 全流程计时/0 error | Edge | 部分：七章节点/分支分段全通，ending 0 console error；**真人 20 分钟整局计时未做，留步骤七 T20** | `_pw-extra.log` |

### 11.4 例外与欠账

- Chrome/Safari：未测，步骤七补。
- 真机/触摸：仅 Edge 移动模拟，步骤七补真机。
- 隐私模式/禁存储：未测，步骤七补。
- 断网 ZIP：未打包，步骤八验证。
- 20 分钟三次：未做，步骤七 T20 补；当前 A 口径文字 11:22，整章预算 19:44，余量 16 秒，超时风险仍在。
- 字体：本机未安装得意黑/霞鹜文楷，仍落 Microsoft YaHei/SimSun；步骤八决定是否打包 OFL 字体。
- 点名全答/漏答、ending 五卡、图鉴、门板/无门板、844×390 均已留证据；Chrome/Safari 与真人计时是明确未测项。
- 视觉例外：844×390 下 ending 五卡文字按舞台缩放后偏小（面板 477×303），可读但未达“舒适”；步骤七决定是否加大移动字号或允许滚动。
- 发现并修复：x025a 选 C 后 item.door=false，原 x025b 条件 `!item.door` 会让玩家掉回无门板选择；改为 `!item.door && !choice.xiangjiang.hold`，B33 复测通过。

### 11.5 结论

- 步骤五出口：**通过（B44 真人计时留步骤七例外）**。
- 未通过项与原因：无功能出口未通过；20 分钟三次计时、Chrome/Safari、真机、隐私模式、断网 ZIP 按计划留步骤七/八。
- 下一步：步骤六 音频与动效（Web Audio 合成、转场/闪白/震动/墨迹划名、静音持久化）；步骤七补 B44 与跨浏览器。

### 11.6 变更记录

- docs：新增 `docs/chapter-integration.md`；更新 `state-schema.md`、`ui-layout.md`、`story-bible.md`、`script/README.md`、`test-cases.md`、`quality-bar.md`、`visual-reading.md`、`docs/script/04-luding.md`、`docs/script/06-wuqi.md`。
- 数字：吴起重数 45 line / 49 节点，全书 277 节点；附录 A、README、C24、chapter-integration 已统一。
- 是否影响步骤六/七：ending/点名/图鉴的 DOM 与存档形状已冻结；步骤六只加音频与动效，不改节点表；步骤七重点复核 20 分钟、移动字号、Chrome/Safari、隐私模式。

## 附录 A 七章节点表（实际 277）

| 章 | id | 前缀 | line | choice | minigame | result | title | codex | interact | end | 合计 | end.next |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 序章 | prologue | p | 42 | 2 | 1 | 1 | 1 | 1 | 0 | 1 | 49 | xiangjiang |
| 第一章 | xiangjiang | x | 36 | 2 | 1 | 1 | 1 | 1 | 0 | 1 | 43 | zunyi |
| 第二章 | zunyi | z | 26 | 3 | 0 | 1 | 1 | 1 | 0 | 1 | 33 | jinsha |
| 第三章 | jinsha | j | 27 | 1 | 1 | 2 | 1 | 1 | 1 | 1 | 35 | luding |
| 第四章 | luding | l | 29 | 2 | 1 | 1 | 1 | 1 | 0 | 1 | 36 | grass |
| 第五章 | grass | g | 27 | 2 | 0 | 0 | 1 | 1 | 0 | 1 | 32 | wuqi |
| 终章 | wuqi | w | 45 | 1 | 0 | 0 | 0 | 1 | 1 | 1 | 49 | ending |
| 合计 |  |  | 232 | 13 | 4 | 6 | 6 | 7 | 2 | 7 | 277 |  |

说明：
- 序章 42 line = 原 41 + p039b；2 choice 仍是 p021/p037；p039a/p039b 同位置。
- 湘江 2 choice = 有门板 x??a（A/B/C）与无门板 x??b（A/B）；line 36 含两条 if 分支。
- 泸定 29 line = 原 28 + 无门板替代行；2 choice 不变。
- 吴起实际 45 line；源文件头 44 / 逐行 46 不一致，以 count-words 重数为准，本表与 C24 已按 49 节点回填，不硬凑 48。
- 所有章 playable=true；w900.next=ending；ending 不是章节，不放进本表。

## 附录 B 五卡边界与文案

| id | 标题 | 条件 | 亮线 | 灰线 |
|---|---|---|---|---|
| ideal | 理想信念 | fire ≥ 20 | 最冷的那一夜，你还留着火。 | 火种，剩得不多了。 |
| sacrifice | 不怕牺牲 | choice.xiangjiang.hold === true | 你把最后一批人，留在了江东岸。 | 你按命令过了江。 |
| truth | 独立自主 | choice.zunyi.admit ≥ 2 | 你在遵义，承认了自己走错的那一步。 | 错误卡上，你自己的那条最短。 |
| overall | 顾全大局 | choice.jinsha.priority === "main" | 主力先过江，你排到最后。 | 你先渡了最急的人。 |
| people | 依靠人民 | trust ≥ 3 且 memory.zhang === true | 三十七个船工的名字，你记下了。 | 江边的名字，你没记下几个。 |

边界用例：
1. fire=19 → ideal 灰；fire=20 → 亮。
2. hold=false → 灰；true → 亮。
3. admit=1 → 灰；2 → 亮；3 → 亮。
4. priority="wounded" → 灰；"main" → 亮；"kettle" → 灰。
5. trust=3 + memory.zhang=false → 灰；trust=2 + true → 灰；trust=3 + true → 亮。
6. 全灰：以上五项都取灰；ending 仍正常，不出现“失败”。

## 附录 C 点名状态机

状态：idle → announcing → waiting → answered/missed → next → done。

- announcing：显示“念到 X”；remote/self 700ms 后自动到；absent 进入 waiting。
- waiting：absent 名字，4s 窗口；玩家空格/Enter/点击 → answered（player）；超时 → missed。
- next：索引 +1；总用时 ≥45s 时，剩余名字全部按 missed 收尾（self/remote 可先自动完成）。
- done：写 ending.names（7 项）、answered、missed、memory.rollcall_missed_any；save；隐藏；advance。
- 暂停/可见性：冻结 45s 与 4s 计时；恢复不跳秒。
- 刷新：回到 interact 节点开头；不保存中间状态。
- 状态值：self（自己答）、remote（别的连答）、player（玩家替答）、missed（没人答）。
- 张老幺不在本状态机；他只由金沙江记名交互写 memory.zhang。

## 附录 D ending 快照

    {
      "stats": {
        "companyStart": 104,
        "companyEnd": 19,
        "redStart": 86000,
        "redEnd": 7000
      },
      "names": [
        { "id": "he", "name": "何指导员", "status": "remote" },
        { "id": "ximei", "name": "细妹", "status": "self" },
        { "id": "lin", "name": "林先生", "status": "self" },
        { "id": "zhou", "name": "老周", "status": "missed" },
        { "id": "zaowang", "name": "灶王", "status": "player" },
        { "id": "feimao", "name": "飞毛腿", "status": "missed" },
        { "id": "dongsheng", "name": "冬生", "status": "self" }
      ],
      "answered": 1,
      "missed": 2,
      "cards": {
        "ideal": { "lit": true, "line": "最冷的那一夜，你还留着火。" },
        "sacrifice": { "lit": false, "line": "你按命令过了江。" },
        "truth": { "lit": true, "line": "你在遵义，承认了自己走错的那一步。" },
        "overall": { "lit": false, "line": "你先渡了最急的人。" },
        "people": { "lit": false, "line": "江边的名字，你没记下几个。" }
      }
    }

规则：
- stats 四个数字固定；companyStart/End 标虚构，redStart/End 标史实。
- names 7 项、id 不重复、status 四值之一。
- cards 五个固定键；每项只 {lit,line}；不存 title（title 在 story.ending.cards）。
- answered/missed 是 0–3 的整数；不显示为分数。
- ending 只由引擎写；交互结束先写 names/answered/missed，w900 补 stats/cards。
- 不写 card.*；不写 ending.* 到剧本。

## 附录 E 12 张背景构图

| id | 章节 | 构图 | 主色/注意 |
|---|---|---|---|
| xiangjiang_ford | 湘江 | 夜江/浮桥横板/人流剪影/远岸低山/江面白线 | 夜蓝 + 纸白；不画敌我脸 |
| xiangjiang_dawn | 湘江 | 拂晓灰江/漂物/断桥/雾带 | 灰纸白；漂物不血腥 |
| zunyi_hall | 遵义 | 关闭木门/屋檐冰凌/门缝烟/雪 | 墨黑 + 纸白；不写字/不出现领导人 |
| zunyi_street | 遵义 | 石板街/低屋/灯笼/墙上纸 | 纸白 + 朱砂小点；错误卡不写正文 |
| jinsha_river | 金沙江 | 绿色峡谷/六船横排/礁石/急水 | 墨绿/夜蓝；船不画人正脸 |
| jinsha_night | 金沙江 | 月/岸火/船影/江面反光 | 夜蓝 + 火橙；火点少量 |
| luding_bridge | 泸定 | 13 根铁索/深谷/水雾/桥头木桩 | 墨黑 + 纸白；只画铁索不画 22 人 |
| luding_after | 泸定 | 桥在身后/烟/军号/黄昏 | 火橙 + 夜蓝；号不写字 |
| grass_marsh | 草地 | 黑草/水洼/雨丝/无树/低云 | 墨黑 + 灰绿；不画尸体 |
| grass_dawn | 草地 | 灰白黎明/远处屋影/水光 | 纸白 + 淡青；留白 |
| wuqi_dawn | 吴起 | 黄土/窑洞/高天/镇口 | 土黄 + 纸白；不画口号文字 |
| wuqi_wall | 吴起 | 土墙/标语形状/门板靠墙/名册影 | 土黄 + 朱砂；不写可读口号 |

共享 helper 建议：waterLines（江面白线/反光）、mistBand（雾带）、fireDots（火把/岸火）、chainLines（铁索）、loessWall（土墙/窑洞）；不写 12 套独立笔触。

## 附录 F 工具清单

### F1 修改的旧检查

- C13：序章 49 节点；p039a/p039b；p001–p020 顺序；p900.next=xiangjiang。
- C14：全章 choice；2–3 项；key 连续；text≤14；cost≤22；timeout 可选；有 timeout 必须有 defaultOption；record 可选；set 白名单。
- C16：when 白名单动态；仍拒 ending.*/card.*；item.door 镜像/夹取保留。
- C17：end.next 允许章节或 ending；七章可达；7 codex；11 键。

### F2 新增检查（C24–C30）

| 编号 | 检查 |
|---|---|
| C24 | 七章存在、playable、order、节点数、id 前缀/唯一、end、title/codex 位置；与 chapter-integration 表一致 |
| C25 | 7 个 codex 节点各一次；id 与 story.codex 一致；gallery 7 卡数据源唯一 |
| C26 | XB.story.ending 五项 cards、7 names、stats；w900.next=ending；engine SCENES 含 ending；无 card.* |
| C27 | 吴起 1 个 interact、mode=rollcall、duration=45、names 7；无 success/score；#vn-interact |
| C28 | #codex-gallery/#codex-gallery-grid/#codex-gallery-count；标题/暂停入口；7 卡 CSS；无外部资源 |
| C29 | CHAPTER_MEMORY 五项 + 进入吴起三项；memory bool；不覆盖 true |
| C30 | PERSIST_KEYS 11 键；ending 快照形状；scene=ending/nodeId=null；4096；无新增 card.* |

### F3 smoke（S34–S40）

- S34 七章默认路径 p001→w900→ending，无断链。
- S35 遵义 admit 0/1/2/3 累计正确；record 不覆盖。
- S36 章末记忆与进入吴起前置正确。
- S37 五卡五组边界；全灰不报错。
- S38 ending normalize/11 键/刷新。
- S39 图鉴 0/7–7/7、锁卡/开卡。
- S40 点名状态机：全答/漏 1/超时/暂停/刷新。

### F4 负例

| 负例 | 注入 | 期望 |
|---|---|---|
| N5 | 删 w900.next 或改成 map | C24/C26 红 |
| N6 | buildEnding 强制 ideal=true | C26/S37 红 |
| N7 | interact duration=30 | C27/S40 红 |
| N8 | ending 快照多键/缺 cards | C30/S38 红 |

## 附录 G 浏览器矩阵

| 编号 | 场景 | 关键动作 | 预期 |
|---|---|---|---|
| B31 | 标题图鉴 0/7 | 打开 gallery | 7 锁；计数 0/7 |
| B32 | 序章带门板 | p021 A→p039a→p900 | 地图解锁湘江 |
| B33 | 湘江弃物/门板 | 弃物；A/B/C；再跑无门板 | C 只在有门板出现 |
| B34 | 遵义三选 | 三次 A；三次 B；混合 | admit 0–3；错误卡对 |
| B35 | 金沙江 | 渡船；记名选张老幺/不选 | trips/memory.zhang 对 |
| B36 | 泸定 | 有/无门板；铺桥/抱板；names A/B | 无不可能项；bool 对 |
| B37 | 草地 | 分粮 A/B；锅 A/B | fire/trust/load/item.pot 对 |
| B38 | 吴起有门板 | 点名全替答；ending | 名单/数字/五卡/声明 |
| B39 | 无门板+漏答 | 点名漏；ending | 无门板文本；全灰/混合；不重开 |
| B40 | 图鉴 7/7 | 逐章解锁；锁卡/开卡 | 计数/焦点/关闭 |
| B41 | ending 刷新/继续 | 刷新；回标题；继续 | 回 ending；内容不变 |
| B42 | 844×390 | 点名/图鉴/结局触摸 | 可单手；44px |
| B43 | file:// + http | 各跑一遍 | 0 error/0 404/0 外部 |
| B44 | 全流程计时 | 标题→ending | ≤20:00；记录总时长 |

## 附录 H 文件树与命令

    project/
      index.html
      style.css
      engine.js
      story.js
      minigames.js       （本步不改）
      art.js             （12 新场景）
      tools/
        check-build.js
        smoke.js
        check-script.js
        count-words.js
    docs/
      chapter-integration.md
      script/00-prologue.md … 06-wuqi.md
      script/README.md
      state-schema.md
      story-bible.md
      ui-layout.md
      test-cases.md
      quality-bar.md
      evidence/step-05/run-log.md
    step/
      step-05-章节接入.md

命令（开发期，不进运行时）：

    node --check project/engine.js
    node --check project/story.js
    node --check project/art.js
    node --check project/minigames.js
    node project/tools/check-build.js
    node project/tools/smoke.js
    node project/tools/check-script.js docs/script
    node project/tools/count-words.js docs/script

浏览器：

    Start-Process ".\project\index.html"
    python -m http.server 8080 --directory project



