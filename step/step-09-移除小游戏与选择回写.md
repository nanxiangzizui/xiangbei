# 步骤九 · 移除小游戏与选择回写 —— 详细执行计划

> 本文件是**执行计划**，不是项目状态源。范围与排期看 **向北-项目计划书.md**；当前进度只看 **.claude/CLAUDE.md**。
> 写本计划时**没有改任何运行时文件**，也没有打包或部署。线上仍是 v1.1.1：Netlify 主站 https://xiangbei.netlify.app/ ，GitHub Pages 备站 https://nanxiangzizui.github.io/xiangbei/ （部署提交 `88771d3`）。
> 本步的版本口径是 **v1.2.0-dev**；完成实现、回归、打包后才可升 v1.2.0。部署必须再次得到用户明确确认。

## 元信息

| 项 | 内容 |
|---|---|
| 所属步骤 | 九 · 移除小游戏与选择回写 |
| 对应计划书 | 2026-11-05 v1.2.0-dev 调整：四关全删，改 4 段选择；结尾删渡船统计，保留点名数字 |
| 当前状态源 | **.claude/CLAUDE.md** 2026-11-05 版：步骤九 🚧 计划，未实现 |
| 回滚点 | annotated tag **`pre-minigame-removal`** → `359b320de694c08a20754df89ccd01685259f24e`（v1.1.1 源码 HEAD） |
| 本步出口（逐字引用 CLAUDE） | 4 段选择可玩；无小游戏入口/文件；20 分钟；check-build/smoke/全流程更新 |
| 计划书出口展开 | 行囊多选、弃物多选、金沙江先渡谁、泸定门板/记名；每段即时 + 后续回写；旧存档旗标保留 |
| 时间盒 | 标准 360 分钟；压缩 240 分钟；打包、PDF、部署等待另计 |
| 不可逆动作 | 删除 `project/minigames.js`、覆盖线上版本、重置存档格式、重打包发布；删除代码前先确认 tag 与工作区干净，部署前必须用户确认 |
| 本步性质 | 收窄玩法、补回写、减代码与测试面；不是重写剧情，不是新增第 5 关 |

### 本步完成定义

同时满足以下六条，才算步骤九完成：

1. **四段选择可玩**：序章行囊多选、湘江弃物多选、金沙江先渡谁、泸定门板/记名；键盘、触摸、刷新均可用。
2. **四关真正消失**：`minigames.js` 不再加载/存在；`?minigame=` 不再进入关卡；页面没有小游戏画布、HUD、暂停按钮和“继续/重开”小游戏入口。
3. **即时回写**：每次选完，结算页或紧接着的台词明确写出“带走了什么、留下了什么、先渡了谁、门板怎么了”；不写成功/失败、不打分。
4. **后续回写**：行囊五件各至少 1 处后续台词；弃物至少 3 处；先渡谁至少 2 处；门板/记名至少 2 处；结局五卡与点名不受破坏。
5. **史实与情感不倒退**：湘江必败、遵义必开、泸定必夺；金沙江 37 名船工、7 天 7 夜、泸定 22 人/13 根铁索仍按原文出现；不新增真实人物对白，不血腥化。
6. **证据完整**：check-build、smoke、check-script、四段选择专项、完整流程、file://、844×390 均有记录；旧存档可继续；更新 README/CLAUDE/state-schema；提交并打 `step-9-done`。

> 任一没做到，只能写“有条件完成”；不能把“删了代码”写成“四段选择已经好玩”。

---

## 0. 任务总表

| 编号 | 任务 | 主要产出 | 前置 | 标准/压缩（分钟） | 门禁 |
|---|---|---|---|---|---|
| T9.0 | 基线、tag 与口径锁定 | 回滚点、四段选择定义、旧档迁移表 | 本计划确认 | 20 / 10 | G0 |
| T9.1 | 引擎：`multichoice` 组件 | `applyMultiChoice`、DOM、键盘/触摸、ARIA | T9.0 | 75 / 50 | G1 |
| T9.2 | 序章行囊多选 + 即时结果 | p024/p025/p026–p029 回写 | T9.1 | 50 / 30 | G2 |
| T9.3 | 湘江弃物多选 + 即时结果 | x015/x016/x018–x020 回写 | T9.1 | 50 / 30 | G2 |
| T9.4 | 金沙江先渡谁 + 回写 | 删 j010/j011；j024 后分支 | T9.2/T9.3 | 35 / 25 | G2 |
| T9.5 | 泸定门板/记名 + 回写 | 删 l013/l014；l019/l020/l027 分支 | T9.4 | 35 / 25 | G2 |
| T9.6 | 删除小游戏层 | 删 minigames.js、DOM、CSS、engine 小游戏函数、`?minigame=` | T9.2–T9.5 | 45 / 30 | G3 |
| T9.7 | 工具与文档同步 | check-build/smoke/check-script/state-schema/audio/ui-layout/docs | T9.6 | 50 / 30 | G3 |
| T9.8 | 回归与证据 | 四段专项、四路径、完整流程、file://、移动、旧档 | T9.7 | 70 / 45 | G4 |
| T9.9 | 版本、打包、部署待确认 | v1.2.0 包、PDF、SHA256、部署确认 | T9.8 + 用户确认 | 另计 | G5 |

**门禁说明**

- G0：回滚 tag 存在；旧存档迁移表写死；四段选择的 min/max、默认项、是否限时全部有结论；没有结论不动代码。
- G1：`multichoice` 只在 `story.js` 数据驱动，不为每段写独立状态机；无计时、无评分、无 Game Over。
- G2：每段选完立即有 DOM 回写；后续回写至少一处能在浏览器里复现；不改变史实大事件。
- G3：`minigames.js` 不再被引用；`?minigame=`、`#vn-minigame`、`.minigame-*`、`XB.minigames` 均无运行路径；check-build/smoke 改完并通过。
- G4：四段选择在 1280×720、844×390、键盘、触摸、刷新、file:// 下可用；完整流程 ≤20 分钟；0 console error / 0 404。
- G5：用户明确同意后才打包/部署；没有同意就停在 G4，线上保持 v1.1.1。

---

## 1. 起点盘点

### 1.1 现有节点与代码位置

| 位置 | 现状 | 本步怎么用 |
|---|---|---|
| `project/story.js:37-110` | p021 门板单选；p024 `minigame door`；p025 `result source=minigame`；p026–p029 行囊台词 | p021 保留；p024 改 `multichoice`；p025 改动态 `result`；补 p026 后回写 |
| `project/story.js:209-222` | x015 `minigame abandon`；x016 `result source=minigame` | x015 改 `multichoice`（6 选 3）；x016 改动态 `result` |
| `project/story.js:237-240` | x018 留下的东西、x019 江面漂浮、x020 卫生员裹伤 | 加弃物后续回写；x020 保留原文并加药/药箱分支 |
| `project/story.js:463-476` | j010 `minigame boat`；j011 `result source=minigame`；j012 起史实台词 | **删除 j010/j011**；j012 起保留；j024 先渡谁保留 |
| `project/story.js:524-554` | j024 `choice choice.jinsha.priority` | 保留；加 j024 后即时分支与 j026/j029 后续回写 |
| `project/story.js:585-598` | l013 `minigame climb`；l014 `result source=minigame`；l015 起铺桥 | **删除 l013/l014**；l011/l012/l015 起保留 |
| `project/story.js:603-634` | l019 门板单选；l020 无门板台词；l027 记名单选 | 保留；补“抱门板过桥”即时/后续回写；l027 已有 l028a/b |
| `project/engine.js:47-89` | FLAG_DEFAULTS / LIMITS / KEYS / ABANDON_ORDER / INVENTORY_IDS / DOOR_OPTIONAL_IDS | 加行囊五件布尔旗标与弃物 take 布尔；旧旗标保留 |
| `project/engine.js:547-629` | `setFlag` / `applySet` / `applyChoice` | 加 `applyMultiChoice`；单选沿用 `applyChoice` |
| `project/engine.js:2331-2362` | 节点分发 line/choice/minigame/result/interact/title/codex/end | 加 `multichoice`；删 `minigame` 分支 |
| `project/engine.js:2535-2652` | `renderChoice` / 倒计时 / `resolveChoice` | 保留单选；多选另写 `renderMultiChoice`，不复用倒计时 |
| `project/engine.js:2893-3035` | `buildResultView` / `renderResult`，含 door/abandon/boat/climb 动态结果 | 删 boat/climb 分支；加 items/abandon 分支；结果页 DOM 保留 |
| `project/index.html:61-86` | `#vn-choices`、`#vn-minigame`、`#vn-result` | 删 `#vn-minigame`；加 `#vn-multichoice`；`#vn-result` 保留 |
| `project/style.css:943-1022` | `.xb-choice` 单选卡 | 复用卡片视觉；新增 `.xb-multichoice` 勾选态/计数/确认条 |
| `project/style.css:1809-1874` | `.vn-minigame` / `.minigame-*` | 删除；新增 `.vn-multichoice` 布局 |
| `project/minigames.js` | 四关 + 共享限时分配引擎，约 80KB | 删除文件；先确认无运行引用 |
| `project/tools/check-build.js` | 38 项；C03/C07/C13/C14/C18–C23 等大量小游戏检查 | 删小游戏项，加 multichoice/无残留检查；总数重新报 |
| `project/tools/smoke.js` | 46 项；含 XB.minigames 与四关断言 | 删四关断言，加四段选择/回写断言；总数重新报 |
| `project/tools/release.py` | 必需文件含 `project/minigames.js` | 移除该文件；保留 assets/CREDITS/PDF 检查 |
| `docs/state-schema.md` | v1.3；11 个顶层键、10 个基础旗标、8 项设置 | 升 v1.4：加行囊五件/弃物 take 旗标；旧 `choice.jinsha.trips`、`lights_lost` 标“只读兼容” |
| `docs/audio-system.md` | 9 床/12 cue；含 minigame 相关 cue | 若 cue 只服务小游戏则删；否则标历史，运行时不再触发 |
| `docs/minigame-tuning.md` / `docs/minigame-system.md` | 四关数值与系统 | 文件保留为 v1.1.1 历史；顶部加“v1.2.0 已删除” |
| `docs/ui-layout.md` | 含小游戏画布层 §9 | 改成多选组件布局；小游戏坐标标历史 |
| `README.md` / `docs/quality-bar.md` / `docs/test-cases.md` | 已加 v1.2.0-dev 口径 | 实现后把“计划/未实现”改为“已实现”，填实测数据 |

### 1.2 当前可玩流程中的四个断点

1. **行囊**：p024 小游戏结束才把结果写进 `inventory.items`；p025 只是展示，p026 之后没有任何“你带走的药/青稞/雨布/布鞋”台词。
2. **弃物**：x015 结束写 `choice.xiangjiang.abandoned`；x016 只展示两栏；x018–x020 不读这个清单，留下什么对后文没有影响。
3. **渡船**：j010/j011 的“X/18 趟、船工 N 人”与 j012/j015 的固定史实数字并置，玩家会以为自己的操作改变了 37 名船工和 7 天 7 夜；实际只有 j024 的“先渡谁”影响五卡。
4. **攀索**：l013/l014 的亮灯数只进结算和火种；l011/l012 的“十七……十八”和 l022 的“飞毛腿没过来”是固定文本，玩家操作与后文脱节。

### 1.3 为什么不是“把四关改短一点”

- 四关的问题不是时长，而是**结果没有进入叙事**；再把四关缩短，仍然要维护 Canvas、计时、拖拽、键盘、结算、测试六套东西。
- 本步用 DOM 多选/单选替代，操作成本低，但每个选择都必须有即时 + 后续回写；否则不通过 G2。
- 删除的是“小游戏层”，不是“选择”；四段选择仍是可玩内容，验收口径改为 4 段选择。

---

## 2. 用户已确认的决定与不变量

### 2.1 已确认（2026-11-05，m04828）

1. **四关全删，不留互动**；适当改文件口径，只删四个小游戏，别改核心内容。
2. **结尾数据删前者**：删除渡船结算“X/18 趟、船工 N 人”；保留结局点名数字（连队 104→19、中央红军 86,000→7,000）。
3. **立即回写和后续回写都要有**。
4. **先改文件口径，再写 step-09，别直接改代码**。
5. 先打可回滚 tag；tag 已完成。

### 2.2 不变量（本步不许动）

- 七段结构、章节顺序、史实大事件、7 张图鉴、五张精神卡、点名结局、虚构人物声明。
- 湘江必败、遵义必开、泸定必夺；金沙江 37 名船工、7 天 7 夜；泸定 22 人、13 根铁索、240 余里。
- 不虚构真实领导人对话；不把《七根火柴》《金色的鱼钩》当史料；不血腥化；不消费苦难。
- 不新增框架、构建链、fetch/XHR/ES module、后端、登录、排行榜、多结局。
- 不重写序章/湘江/泸定/点名的核心文本；只加选择节点、结果节点和回写台词。
- 不改字体、底图、音频素材；除非删除小游戏 cue 时必须同步 audio-system。

### 2.3 非目标

- 不做第 5 关、不做新地图、不做新结局、不做成就/评分/完美通关。
- 不把四段选择做成“限时压力关”；只有原有单选保留倒计时。
- 不改 `xiangbei.save.v1` 键名；不重置玩家旧档。
- 不在本步部署；部署另开确认。

---

## 3. 目标体验：四段选择

### 3.1 序章 · 行囊（多选，0–3 件）

- 位置：p021 门板单选之后，p022a/b、p023a 之后，p024。
- 文案方向：娘把五样东西摆在桌上；行囊还能塞三件；门板已经单独决定。
- 选项：药、青稞、铁锅、雨布、布鞋。每件 1 格；门板占 2 格。
- 规则：**最多 3 件，可以一件不带**；无倒计时、无默认项、无失败；确认按钮在 0–3 件时都可用，计数“已选 X/3”。
- 即时回写：p025 结算页动态列出“带走的 / 留下的”，p026 保留“带走的摊在地上，只有一小堆”；p027–p029 保留灶王/大锅台词，另加锅的回写。
- 后续回写：药 → 湘江 x020；青稞 → 草地 g015；铁锅 → 草地 g021/g022；雨布 → 湘江 x019；布鞋 → 泸定 l021 或吴起。每件至少 1 处。

### 3.2 湘江 · 弃物（多选，恰好 3 样）

- 位置：x014 之后，x015。
- 选项：X 光机、印刷机、文件、药箱、电台、银元（id 沿用 `xray/press/files/medkit/radio/silver`）。
- 规则：**恰好 3 样上船**；无倒计时、无默认项；确认按钮仅在 3 样时可用；计数“已选 3/3”。
- 即时回写：x016 动态列出“带上船 / 留在岸上”，统计“带上船 3 样 · 留在岸上 3 样”；不写“两船已发/追兵剩余”。
- 后续回写：药箱 → x020；X 光机 → x018；电台 → x019；至少 3 处；文件/印刷机/银元可各加 1 句，但不强制。
- 兼容：继续写 `choice.xiangjiang.abandoned`（留下的 id 数组），旧档可读；另写 6 个 `choice.xiangjiang.take.*` 布尔供 `when` 使用。

### 3.3 金沙江 · 先渡谁（单选，保留 j024）

- 删除 j010/j011；j012–j023 保留；j024 三选一保留。
- 选项：先渡主力 / 先渡伤员 / 先渡炊事班；代价文案保留。
- 即时回写：j024 后加 3 条分支台词，写清“先上船的是谁、谁在岸上等”。
- 后续回写：j026 号子、j029 上北岸各加 1 条分支；结局五卡“顾全大局”继续读 `choice.jinsha.priority === "main"`。
- 史实数字不动：j012 “七天七夜”、j015 “三十七个船工”原样保留；不再出现“X/18 趟、船工 N 人”。

### 3.4 泸定 · 门板/记名（单选，保留 l019/l027）

- 删除 l013/l014；l011/l012/l015 起保留；l019 门板单选、l027 记名单选保留。
- 门板：铺上桥面 / 抱着过桥；即时回写 l019 后（铺上：桥面多一块板；抱着：背上多三十斤、后面的人等你）；后续 l021 后加 1 句。
- 记名：记数字 / 留一页空白；l028a/b 已有时/无分支；结局点名、花名册、`memory.luding_unknown` 保留。
- 不再出现“过去 N 个 / 暗了 N 个 / 其余亮着”。

---

## 4. 数据模型与旧档兼容

### 4.1 新增旗标（全部布尔，写入 `FLAG_DEFAULTS` 与 `FLAG_KEYS`）

| 旗标 | 含义 | 默认 | 写入点 |
|---|---|---|---|
| `item.medicine` | 行囊带药 | false | p024 |
| `item.barley` | 行囊带青稞 | false | p024 |
| `item.homepot` | 行囊带家里的铁锅 | false | p024 |
| `item.raincloth` | 行囊带雨布 | false | p024 |
| `item.shoes` | 行囊带布鞋 | false | p024 |
| `choice.xiangjiang.take.xray` | X 光机上船 | false | x015 |
| `choice.xiangjiang.take.press` | 印刷机上船 | false | x015 |
| `choice.xiangjiang.take.files` | 文件上船 | false | x015 |
| `choice.xiangjiang.take.medkit` | 药箱上船 | false | x015 |
| `choice.xiangjiang.take.radio` | 电台上船 | false | x015 |
| `choice.xiangjiang.take.silver` | 银元上船 | false | x015 |

- `item.pot` 继续表示“灶王的小锅”，**不要**把行囊铁锅写进 `item.pot`；两个锅是两件事。
- `choice.xiangjiang.abandoned` 继续表示“留在岸上的 id 数组”，顺序按 `ABANDON_ORDER`，不含 door；旧档原样保留。
- `choice.jinsha.trips`、`lights_lost` 保留默认/夹取/白名单，但 **story 不再写、结果页不再显示**；标为“只读兼容”。
- 不新增顶层存档键，不改 `xiangbei.save.v1`。

### 4.2 旧档迁移

| 旧节点 | 新落点 | 处理 |
|---|---|---|
| p024（旧门板小游戏） | p024（新多选） | id 复用；从 `inventory.items` 尽力回填 medicine/barley/homepot/raincloth/shoes；没有则 false |
| p025（旧门板结果） | p025（新 result） | id 复用；按旗标重建两栏 |
| x015（旧弃物小游戏） | x015（新多选） | id 复用；`abandoned` 反推 6 个 take 布尔 |
| x016（旧弃物结果） | x016（新 result） | id 复用；按 `abandoned` 重建 |
| j010 / j011 | j012 | j010/j011 删除；载入时映射到 j012，toast“旧存档已接回金沙江” |
| l013 / l014 | l015 | l013/l014 删除；载入时映射到 l015，toast“旧存档已接回泸定” |

- 迁移只在 `normalize` / 载入边界做一次；不改存档版本号，不放弃旧档。
- 旧档没有 `item.homepot` 时，`inventory.items` 里的 `pot` 只在 `item.pot=false` 时回填 `item.homepot=true`；不覆盖已经做过的灶王锅选择。
- 旧档的 `choice.jinsha.trips` / `lights_lost` 可以留着，但 debug 面板与结果页不再显示。

### 4.3 `multichoice` 节点契约

```js
{
  id: "p024",
  type: "multichoice",
  prompt: "……",
  min: 0,
  max: 3,
  confirmLabel: "系好行囊",
  slotLoad: true,                 // 仅 p024：load = (door ? 2 : 0) + 已选数
  options: [
    {
      id: "medicine",
      text: "药",
      cost: "留给娘的咳嗽药，只剩半瓶",
      setOn:  { "item.medicine": true },
      setOff: { "item.medicine": false }
    }
  ]
}
```

弃物节点额外字段：

```js
{
  id: "x015",
  type: "multichoice",
  min: 3,
  max: 3,
  record: "choice.xiangjiang.abandoned",
  recordMode: "left",             // selected = 上船；left = 全部 id - selected
  options: [
    { id: "xray", text: "X 光机", cost: "……",
      setOn: { "choice.xiangjiang.take.xray": true },
      setOff: { "choice.xiangjiang.take.xray": false } }
  ]
}
```

- `applyMultiChoice(state, node, selectedIds)`：校验 min/max/id；对每个 option 先 `applySet(setOff)`，再对选中项 `applySet(setOn)`；`slotLoad` 时重算 `load`；`recordMode:"left"` 时计算 left 数组并 `setFlag`；push 一条 `state.choices` 日志（`option:"MULTI"`，text 为已选名称）；返回摘要对象。
- 多选**不写** `choice.*` 单选值，不调用 `applyChoice`；避免把多选伪装成单选。
- 多选不启动倒计时，不产生 `timedOut`，不设默认项；确认即结算。
- 结果页 `source:"items"` / `source:"abandon"` 只读旗标，不读 `lastMinigameResult`。

---

## 5. 实施阶段与文件级产出

### 阶段 A：引擎与 DOM（不改剧情文本前先让组件可跑）

| 文件 | 改动 | 验收 |
|---|---|---|
| `project/index.html` | 在 `#vn-choices` 后加 `#vn-multichoice`（prompt / options / count / confirm / live）；暂不删 `#vn-minigame` | 组件可用；旧四关仍可跑 |
| `project/style.css` | 加 `.vn-multichoice`、`.xb-multichoice`、勾选态、计数、确认条；复用 `--font-body` 与纸色令牌 | 1280×720 不溢出；844×390 可点 |
| `project/engine.js` | 加 `applyMultiChoice`（core）；加 `renderMultiChoice`、`resolveMultiChoice`、键盘 1–9/Enter、ARIA；节点分发加 `multichoice` | `?debug` 能看到已选/上限；不写档直到确认 |
| `project/tools/smoke.js` | 先加组件级断言：计数、min/max、确认禁用、键盘切换 | 组件单测通过 |

**组件交互**

- 每个选项是 `<button type="button" role="checkbox" aria-checked="false">`，整卡可点，最小热区 44×44。
- 键盘：1–9 切换对应项；Tab 焦点；空格切换当前项；Enter 确认；Esc 仍交给暂停。
- 计数与状态用 `aria-live="polite"`，节流 300–500ms；确认按钮 `disabled` 时读屏可感知。
- 选中达到 max 后，未选项置灰但保留可点（点已选项先取消）；不弹“错误”弹窗。
- 确认后按钮锁定，300ms 后进下一节点；不重开、不评分。

### 阶段 B：剧情节点与回写

| 节点 | 改动 |
|---|---|
| p024 | `minigame door` → `multichoice`；五件 0–3；`slotLoad:true` |
| p025 | `result source=minigame game=door` → `result source=items`；标题/说明保留；动态两栏 + 行囊格数 |
| p026–p029 | 原文保留；补 p026a（带走的清单）、p028a/p028b（铁锅）等 1–2 句，不改灶王主台词 |
| x015 | `minigame abandon` → `multichoice`；六选三；`recordMode:"left"` |
| x016 | `result source=minigame game=abandon` → `result source=abandon`；动态两栏 + “3 样 / 3 样” |
| x017–x020 | 原文保留；加药箱/X 光机/电台/雨布/药的分支句；不删“绷带不够，就撕自己的衬衣” |
| j010/j011 | **删除**；j012 成为 j009 的下一可见节点 |
| j024 后 | 加 j024a/b/c 三条分支（主力/伤员/炊事班）；j025 保留 |
| j026/j029 | 各加 1 条按 priority 的分支；j027/j028 保留 |
| l013/l014 | **删除**；l015 成为 l012 的下一可见节点 |
| l019 后 | 加 l019a（铺门板）/ l020（无门板）/ l020a（抱门板）三条；l021 保留 |
| l021 后 | 加 1 条门板/布鞋回写；l022–l027 保留 |

**回写清单（至少这些）**

| 选择 | 即时回写 | 后续回写（至少 1 处） |
|---|---|---|
| 药 | p025 列入“带走的” | x020：药还在/没有药 |
| 青稞 | p025 列入“带走的” | g015：倒进锅里/干粮袋空了 |
| 铁锅 | p025 列入“带走的” | g021/g022：家里那只锅与灶王的小锅 |
| 雨布 | p025 列入“带走的” | x019：名册裹住/边角湿了 |
| 布鞋 | p025 列入“带走的” | l021 或吴起：鞋底磨穿/还穿着 |
| 药箱 | x016 列入“带上船” | x020：卫生员打开药箱 |
| X 光机 | x016 列入“带上船/留在岸上” | x018：箱子抬上船/留在岸上 |
| 电台 | x016 列入“带上船” | x019：天线断了一截 |
| 先渡主力 | j024 后“主力先上船” | j026 或 j029 + 五卡“顾全大局” |
| 先渡伤员 | j024 后“伤员先上船” | j026 或 j029 + 五卡变暗/文案 |
| 先渡炊事班 | j024 后“炊事班先上船” | j026 或 j029 + 火种/五卡 |
| 门板铺桥 | l019 后“桥面多一块板” | l021 后“门板不在了” |
| 抱门板过桥 | l019 后“背上多三十斤” | l021 后“门板还在背上” |
| 记数字/留空白 | l028a/b 已有 | l030 后/结局点名/花名册 |

### 阶段 C：删除小游戏层

| 文件 | 删除/改动 | 验收 |
|---|---|---|
| `project/minigames.js` | 整文件删除 | `git grep minigames` 无运行引用 |
| `project/index.html` | 删 `<script src="./minigames.js">`；删 `#vn-minigame` 整块（canvas/HUD/help/live/pause/fallback） | 页面无 minigame canvas；启动 0 404 |
| `project/engine.js` | 删 `MINIGAME_LABEL`/`MINIGAME_HELP`、`startMinigameForNode`、`applyMinigameResult`、`lastMinigameResult`、`?minigame=`、solo/重开路径、minigame 节点分发与事件监听；删 boat/climb 结果分支 | `?minigame=door` 不再进入关卡，回到标题/报普通错误 |
| `project/engine.js` | 保留 `renderResult`；加 items/abandon 分支；保留 `#vn-result` | p025/x016 可显示 |
| `project/style.css` | 删 `.vn-minigame`、`.minigame-*`；保留 `.vn-result`；加 `.vn-multichoice` | 无死样式；844×390 不溢出 |
| `project/tools/check-build.js` | 删 C03 小游戏画布、C07 XB.minigames、C13 旧节点计数、C14 13 choice 的旧断言、C18–C23；加 multichoice 契约/无残留/C13 新计数 | 通过并更新总数 |
| `project/tools/smoke.js` | 删四关/测试入口断言；加四段选择、结果重建、旧档迁移 | 通过并更新总数 |
| `project/tools/release.py` | 必需文件删 `minigames.js`；保留 assets 清单 | `verify` 通过 |
| `project/tools/_pw-step7.js` | 删 `minigame` case 或标历史；加 `choices` case | 新 case 可跑 |

**删除顺序**：先删 story 中的 minigame 节点 → 再删 engine 分支 → 再删 DOM/CSS → 最后删文件与工具；每步跑一次 `node --check`，避免一次性大爆炸。

### 阶段 D：文档同步

| 文件 | 改动 |
|---|---|
| `docs/state-schema.md` | v1.4：新旗标表、旧档迁移、只读兼容；示例存档不含 minigame 字段 |
| `docs/ui-layout.md` | 多选组件坐标/状态；小游戏 §9 标 v1.1.1 历史 |
| `docs/audio-system.md` | 若删 minigame cue，更新 12 cue 计数；否则标“保留但不触发” |
| `docs/minigame-tuning.md` / `minigame-system.md` | 顶部加“v1.2.0 已删除，仅历史” |
| `docs/quality-bar.md` / `docs/test-cases.md` | 把“计划/未实现”改成“已实现”，填实测数字 |
| `README.md` / `docs/design-note.md` / `project/tools/design-note.html` | 四段选择、操作说明、无小游戏；PDF 完成后再重新生成 |
| `.claude/CLAUDE.md` | 步骤九 → ✅；当前进度写实现/测试/未部署；更新“建议下一步” |
| `project/CREDITS.txt` | 不需新增素材；若删 minigame cue 不改授权 |

---

## 6. 验收用例（新增 C01–C12，执行时写进 test-cases.md）

| 编号 | 优先级 | 场景 | 通过标准 |
|---|---|---|---|
| C01 | P0 | 序章行囊 0/1/3 件 | 计数正确；0 件可确认；3 件后第 4 件不可选；结算两栏与选择一致 |
| C02 | P0 | 门板 A/B × 行囊 3 件 | 门板 A：load=5；门板 B：load=3；p022a/b、p023a 正常；p025 有/无门板两栏正确 |
| C03 | P0 | 湘江弃物六选三 | 不足 3 件确认禁用；满 3 件可确认；结算“带上船 3 / 留在岸上 3”；门板不在六样里 |
| C04 | P0 | 刷新恢复 | 在 p024/x015/j024/l019 确认后刷新，回到下一节点；未确认刷新回到本节点；旧档 p024/x015/j010/l013 能迁移 |
| C05 | P0 | 键盘/触摸/ARIA | 1–9 切换、空格切换、Enter 确认；844×390 整卡可点；aria-checked/计数正确；0 console error |
| C06 | P0 | 行囊五件后续 | 药、青稞、铁锅、雨布、布鞋各至少 1 处后续台词；两次不同选择能出现不同文本 |
| C07 | P0 | 弃物后续 | 药箱、X 光机、电台至少 3 处后续；结算不再出现“两船已发/追兵” |
| C08 | P0 | 金沙江先渡谁 | 三条即时分支；两条后续分支；五卡“顾全大局”仍按 main；j012/j015 数字不变；无 X/18 趟/船工 N 人 |
| C09 | P0 | 泸定门板/记名 | 铺/抱两条即时+后续；l028a/b 正常；结局点名/花名册不变；无“过去 N/暗了 N” |
| C10 | P0 | 无小游戏残留 | `?minigame=` 不进入关卡；页面无 `#vn-minigame`/`minigame-canvas`；`minigames.js` 不存在且不被请求；`XB.minigames` 不存在 |
| C11 | P0 | 完整流程 | 标题→点名 ≤20 分钟；7 图鉴、5 卡、7 名、0 划名；0 console error/pageerror/404 |
| C12 | P0 | 离线/移动/旧档 | file:// 或断网 ZIP 可玩；844×390 触摸可玩；旧档不白屏；0 console error |

**回归路径**

- 路径 1：带门板 + 药/青稞/雨布 + 弃物药箱/X 光机/电台 + 先渡伤员 + 铺门板 + 留空白。
- 路径 2：不带门板 + 青稞/铁锅/布鞋 + 弃物文件/印刷机/银元 + 先渡主力 + 抱门板（不出现）+ 记数字。
- 路径 3：0 件行囊 + 弃物三样最重 + 先渡炊事班 + 铺门板 + 留空白。
- 路径 4：旧档迁移（p024/x015/j010/l013 四个旧节点各一次）。

---

## 7. 时间盒

| 阶段 | 标准 | 压缩 |
|---|---|---|
| T9.0 基线与迁移表 | 20 | 10 |
| T9.1 multichoice 引擎/DOM/CSS | 75 | 50 |
| T9.2 序章 + 回写 | 50 | 30 |
| T9.3 湘江 + 回写 | 50 | 30 |
| T9.4 金沙江 | 35 | 25 |
| T9.5 泸定 | 35 | 25 |
| T9.6 删除小游戏层 | 45 | 30 |
| T9.7 工具/文档 | 50 | 30 |
| T9.8 回归与证据 | 70 | 45 |
| **合计** | **430** | **275** |

> 超出压缩盒时，优先保 T9.1–T9.5 与 C01–C11；文档可以后补，但不能把未跑写成通过。

---

## 8. 风险与返工触发

| 风险 | 触发 | 处理 |
|---|---|---|
| 四段选择变成“点几下就过” | 玩家 5 秒内点完，后文无差异 | 立即停 T9.2–T9.5，先补即时/后续回写，再继续删小游戏 |
| 回写台词说教/喊口号 | 出现“我们应该……”总结句 | 改成具体物件/动作/代价；不写精神名词 |
| 行囊铁锅与灶王锅冲突 | 两处都写“小锅” | 明确区分“家里的铁锅”和“灶王的小锅”；必要时改 p028 措辞，但不改灶王之死 |
| 旧档落在被删节点 | 载入报错/白屏 | 载入映射表 + toast；C04 必过 |
| 删除 minigames.js 后仍有引用 | 404/console error | `grep -R minigame project` 清零；C10 必过 |
| 结局五卡被误改 | “顾全大局”不再读 priority | 只删渡船统计，不动 buildEnding 条件；C08/C11 必过 |
| 时长超 20 分钟 | 完整流程 >1200s | 先裁草地，再裁金沙江，最后遵义改纯对话；保留序章/湘江/泸定/点名 |
| 移动端多选溢出 | 844×390 确认按钮不可见 | 选项区可滚、确认条固定；C05 必过 |

---

## 9. 禁区

- 不新增第 5 关、不做“小游戏复活”、不保留隐藏 `?minigame=`。
- 不把四段选择做成限时/评分/完美通关；不设“明显正确”的选项。
- 不把渡船统计换成另一种“效率分数”；不显示“救了多少人”的分数。
- 不删除或改写湘江/遵义/泸定/点名的核心史实句；不新增真实人物对白。
- 不改存档键名、不强制清档、不把旧档判为坏档。
- 不在本步部署、不覆盖线上 v1.1.1、不重打包发布；打包与部署等用户确认。

---

## 10. 交接接口

- 下游（步骤十/打包）从本步拿到：`story.js` 新节点、`engine.js` multichoice API、`index.html` 新容器、`style.css` 新组件、更新后的 check-build/smoke、state-schema v1.4、README/CLAUDE 状态。
- 发布脚本必须能验证：站点无 `minigames.js`、无 `#vn-minigame`、有 `#vn-multichoice`；ZIP 内同样。
- 测试脚本必须能验证：四段选择均可完成、结果页可从旗标重建、旧档可迁移、无小游戏请求。

---

## 11. 复核记录（执行时回填）

| 日期 | 任务 | 证据 | 结论 |
|---|---|---|---|
| 2026-11-05 | 文件口径 + 本计划 | README/quality-bar/test-cases/计划/CLAUDE；tag `pre-minigame-removal` = `359b320` | 计划完成，未改代码、未部署 |
| 待填 | T9.1–T9.5 | 浏览器截图/结果 JSON | 待执行 |
| 待填 | T9.6–T9.7 | check-build/smoke/check-script | 待执行 |
| 待填 | T9.8 | 完整流程 4 路径 + 移动/file/旧档 | 待执行 |
| 待填 | T9.9 | 打包/部署确认 | 待用户确认 |

---

## 12. 开工前检查清单

- [ ] `git status` 干净或只含本计划/文档改动；`pre-minigame-removal` tag 指向 `359b320`。
- [ ] 确认线上 v1.1.1 仍可回滚；不在本步部署。
- [ ] 先写 C01–C12 的空表，再动代码。
- [ ] 先做 T9.1 组件，再做 T9.2–T9.5 剧情；不要先删 `minigames.js`。
- [ ] 每完成一段跑一次 `node --check` + 该段浏览器专项。
- [ ] 四段都跑通后再删小游戏层；删完再跑 check-build/smoke。
- [ ] 任何“通过”必须附证据路径；未跑写“未验证”。
