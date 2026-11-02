# 剧本格式与字数口径（v1.0）

> 本文件是**文本源格式的唯一约定**：`docs/script/*.md` 是文本源，`story.js` 是誊本（D3）。
> 改文本先改 md → 再同步 story.js → 提交信息写“文本同步: <章>”。
> 剧本只写“看得见、听得到”的东西；精神不写进旁白，写进选项与代价。

## 1. 章节与 id

| 顺序 | 文件 | 章节 id | 史实注 | 小游戏 | 字数预算 | 时长 |
|---|---|---|---|---|---|---|
| 1 | `00-prologue.md` | `prologue` | `yudu` | `door` 75s | 837 | 3:33 |
| 2 | `01-xiangjiang.md` | `xiangjiang` | `xiangjiang` | `abandon` 80s | 775 | 3:21 |
| 3 | `02-zunyi.md` | `zunyi` | `zunyi` | 无（错误卡 40s） | 394 | 2:16 |
| 4 | `03-jinsha.md` | `jinsha` | `jinsha` | `boat` 90s + 记名 8s | 431 | 2:42 |
| 5 | `04-luding.md` | `luding` | `luding` | `climb` 75s | 473 | 2:38 |
| 6 | `05-grass.md` | `grass` | `grass` | 无（资源选择） | 378 | 1:27 |
| 7 | `06-wuqi.md` | `wuqi` | `wuqi` | 无（点名交互 45s） | 820 | 3:28 |
| — | 合计 | — | 7 张 | 4 关 + 3 交互 | **4108** | **19:44** |

## 2. 文件头（每章必备，固定 6 行；「定稿」= 当前正文实测值，不是预算）

    # 序章 · 于都
    - id: prologue ｜ 史实注: yudu ｜ 小游戏: door(75s)
    - 定稿: 837 字 ｜ 41 beat ｜ 时长 3:33
    - bg: yudu_river, yudu_night ｜ sfx: river, saw, bugle, rooster
    - 演出: 门板特写 / 浮桥纵深远景 / 门口剪影
    - 虚构声明: 满崽及本作人物均为虚构，非史料人物（片头、图鉴各出现一次）

## 3. 行类型（只允许这 10 种）

| 写法 | 含义 | 转成 story.js |
|---|---|---|
| `【说话人】文本` | 一句台词/旁白；旁白固定写 `【旁白】` | `{type:'line', speaker, text}` |
| `[[bg:id]]` `[[sfx:id]]` | 挂到**下一条** line 的 `bg`/`sfx` 字段 | 字段合并 |
| `[[if:key]]` … `[[else]]` … `[[end]]` | 条件块；`key` 为旗标路径，真值走第一段 | 编译为**同位置条件节点**：两段各给一个 id（主序号 + `a`/`b`），带 `when` 字段；不在运行期展开（§6） |
| `>> 选项｜限时 8s｜默认 A｜记录到 choice.x.y` + `A｜文案｜set: …｜cost: …` | 选项；无“限时”即不计时，无“默认”即无超时 | `{type:'choice', id, record, timeout, defaultOption, options:[{key,text,value,set,cost}]}` |
| `【小游戏】door｜duration=75, capacity=6` | 小游戏入口；参数写行内 | `{type:'minigame', id, config}` |
| `【史实注】yudu` | 弹史实注并解锁图鉴 | `{type:'codex', id}` |
| `【标题卡】第一章 · 湘江` | 章节标题卡 | `{type:'title', text}` |
| `【结算】…` | 结算面板（清单可读、不评分） | `{type:'result', …}` |
| `【交互】点名｜45s` | 结局交互（不计入 4 关） | `{type:'interact', id, …}` |
| `【结束】next=xiangjiang` | 章末 | `{type:'end', next}` |

> 上表 10 行含 11 个写法：`if` 与 `bg/sfx` 共占一行，`结束` 并入“章末”。实现以 `story.js` 为准，不在解析器里加新类型。

## 4. 选项与代价（硬规则）

- 每个选项必须有 `cost:`，写**可读的一句代价**，结算时原样显示。
- 限时选项必须有 `默认 X`；超时按默认项结算，并记录 `timedOut: true`。
- 每个选项必须有 `key`（A/B/C）与 `value`：`record:` 指向的旗标写入 `value`，所以「带门板 = true」这类语义是数据，不是代码。
- `record:` 一律写 `choice.<章>.<事件>`；同一事件只记一次，不覆盖（重玩由重置存档负责）。
- 选项之间不允许有“显然更好”的一项：如果一眼能看出哪项对，就给“看起来对”的那项加一个更痛的代价。
- `set:` 只写 `docs/state-schema.md` §3 里的键；新增键先补 schema。`set` 支持两种写法：赋值（`item.door=true`）与增量（`fire=+10`、`load=-1`）。
- 选项文案 ≤ 14 字；`cost` ≤ 22 字（手机上两行放得下）。

## 5. 字数口径

- 只统计 `【…】` 行里 `】` 之后的字符（含中文标点，不含空格/换行）。
- **不算**：说话人名、选项文案、`cost`、UI 文案、史实注、演出备注、文件头。
- 不算的指令行：`【小游戏】【史实注】【标题卡】【结算】【交互】【结束】`（统计脚本按白名单排除）。
- 统计工具：`node project/tools/count-words.js docs/script`（输出每章字数、总数、A 口径秒数）。
- 换算：A 口径（正常点按）= 0.166 秒/字；B 口径（慢读）= 0.258 秒/字。验收用 A。

## 6. 节点契约（步骤三定稿）

`story.js` 的每章是**按序扁平数组**，不用树、不用栈：条件分支靠节点上的 `when` 字段过滤，运行时永远「从当前下标往后找第一个可见节点」。

| 字段 | 适用 | 说明 |
|---|---|---|
| `id` | 全部 | 全局唯一字符串；规则见 §7 |
| `type` | 全部 | `line` / `choice` / `minigame` / `result` / `title` / `codex` / `interact` / `end` |
| `when` | 全部（可选） | 条件字符串；`item.door` 真、`!item.door` 假、`a && b` 与；同位置的互斥分支各写一条 |
| `speaker` `text` | line | 旁白写 `旁白`；`speaker` 为旁白时 UI 不显示姓名签 |
| `bg` | line | 只写 `art.js` `SCENES` 里的 id；不给就沿用上一句的背景 |
| `record` `timeout` `defaultOption` `prompt` `options` | choice | `options[].key/text/value/set/cost`；`timeout` 单位秒，0 或省略 = 不计时 |
| `game` `config` | minigame | `game` 为 `door`/`abandon`/`boat`/`climb`；`config` 是 authored 元数据（p024 保留 `duration/capacity/doorCost/items`），运行期以 `minigames.js` 的 `RULES` 为准，不写 `success` |
| `lists` | result | `[{when, heading, items[]}]`；只列清单，不评分、不写旗标；可选 `source:"minigame"` + `game` 表示按运行时结果重建 |
| `text` `sub` | title | 章名与副题；显示后自动关或点击关 |
| `codexId` | codex | 必须是 `story.codex` 里的 id；关闭时解锁 |
| `next` | end | 下一章 id、`ending` 或 `map` |

**`when` / `set` 白名单**（越界在 `check-build` 与 `smoke` 里直接失败，不在运行期兜底）：

- `when` 只读：`item.door`、`item.pot`、`load`、`trust`、`fire`、`lights_lost`、`memory.*`、`choice.*`，支持前置 `!` 与 `&&`。
- `set` 只写：`item.door`、`item.pot`、`load`、`trust`、`fire`、`lights_lost`、`memory.*`、`choice.*`；`fire` clamp 0–100，`trust` clamp 0–6，`load` 取整且 ≥0，`lights_lost` clamp 0–22，`choice.jinsha.trips` clamp 0–18，`choice.zunyi.missed` clamp 0–1。
- `item.door` 写入时同步 `inventory.door`（存档里两处必须一致）。`choice.xiangjiang.abandoned` 是唯一 list flag，只由小游戏结算写，剧本 `set` 不得写。
- `ending.*`、`card.*`、`unlockedChapters` **不许**由剧本写，只能由引擎写。

**三步转换**（步骤一照抄，不许再发明）：

1. 去文件头与 `[[…]]` 指令，得到纯节点序列。
2. `[[if]]` 块两段各给一个 id（主序号 + `a`/`b`），写 `when`；`[[else]]` 段写 `!key`；嵌套最多 2 层，用 `&&` 拍平。
3. 章末 `{type:'end', next}` 指向下一章 id 或 `map`。

## 7. 节点 id 规则（步骤一新增，步骤三补映射）

- 章前缀：`prologue=p`、`xiangjiang=x`、`zunyi=z`、`jinsha=j`、`luding=l`、`grass=g`、`wuqi=w`。
- 顺序号 `001–899`；分支正文用主序号加后缀 `a`/`b`（如 `p022a`/`p022b`）；`900–999` 保留给该章 end 节点（如 `p900`）。
- id **全局唯一、一经写入 story.js 不再改**；确需改名，必须同时写存档迁移（`docs/state-schema.md` §5）。
- 存档只存当前节点 id，不存数组下标；载入时按 id 在全章节点表里定位。
- 步骤三只能追加 id，不得重排 `p001–p020`；`p900` 的 `next` 由 `map` 改为 `xiangjiang`（第一章尚未接入，引擎按“章末待续”回地图）。

**序章映射（步骤五定稿，49 节点）**

| 源文件行 | id | 类型 | 条件 / 说明 |
|---|---|---|---|
| 9–31 | p001–p020 | line | 原样；p001 挂 `bg:yudu_river`，p006 挂 `bg:yudu_night` |
| 33–35 | p021 | choice | 限时 8s，默认 A，`record:choice.prologue.door` |
| 38–39 | p022a / p023a | line | `when:item.door` |
| 41 | p022b | line | `when:!item.door` |
| 44 | p024 | minigame | `door`，`duration=75,capacity=6,doorCost=2,items=8`；步骤四接入真实小游戏，config 与 `RULES` 一致 |
| 46 | p025 | result | 行囊两清单（带走/留下），不评分；加 `source:"minigame"`、`game:"door"` 后按运行时结果重建 |
| 47–49 | p026–p028 | line | |
| 51 / 53 | p029a / p029b | line | `when:item.door` / `when:!item.door` |
| 55 | p030 | line | |
| 58–63 | p031–p036 | line | p031 挂 `bg:yudu_river` |
| 65–67 | p037 | choice | 限时 8s，默认 B，`record:choice.prologue.lookback` |
| 70 / 72 | p038a / p038b | line | `when:choice.prologue.lookback` / `when:!choice.prologue.lookback` |
| 76–79 | p039a / p039b、p040–p042 | line | p039a `when:item.door`；p039b `when:!item.door`；都挂 `bg:yudu_night` |
| 80 | p043 | title | 「第一章 · 湘江」 |
| 81 | p044 | codex | `yudu` |
| 82 | p900 | end | `next:xiangjiang` |

**步骤五七章映射**：完整节点表见 `docs/chapter-integration.md` §1–2。七章实际 277 节点；结尾链 p900→x900→z900→j900→l900→g900→w900→`ending`。章节前缀与 a/b/c 分支规则不变，不允许把 `ending` 写成章节 id。

## 8. 统计表（每次改稿后回填，与正文一致）

| 章 | 字数 | beat | 抉择点 | 选项 | 限时项 | 口播 A 口径 |
|---|---|---|---|---|---|---|
| 序章 | 837 | 41 | 2 | 4 | 2 | 2:19 |
| 湘江 | 775 | 36 | 1 | 3 | 1 | 2:09 |
| 遵义 | 394 | 26 | 3 | 6 | 0 | 1:05 |
| 金沙江 | 431 | 27 | 1 | 3 | 1 | 1:12 |
| 泸定 | 473 | 28 | 2 | 4 | 2 | 1:19 |
| 草地 | 378 | 27 | 2 | 4 | 2 | 1:03 |
| 终章 | 820 | 44 | 1 | 2 | 1 | 2:16 |
| 合计 | **4108** | **229** | 12 | 26 | 9 | **11:22** |

> 文件头的「定稿」行、本节、`docs/story-bible.md` §4.1 与 §4.4 必须四处一致；改稿先改正文，再回填。

> 口播 A 口径只算正文；含小游戏、选项、图鉴、点名后的整章时长见 `docs/story-bible.md` §4.4（合计 19:44）。
> 统计命令：`node project/tools/count-words.js docs/script`。改完剧本必须回填本表，否则视为未完成。
