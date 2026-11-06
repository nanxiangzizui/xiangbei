# 剧本格式与字数口径（v1.3）

> 本文件是**文本源格式的唯一约定**：`docs/script/*.md` 是文本源，`story.js` 是誊本（D3）。
> 改文本先改 md → 再同步 story.js → 提交信息写“文本同步: <章>”。
> 剧本只写“看得见、听得到”的东西；精神不写进旁白，写进选项与代价。

## 1. 章节与 id（v1.3.0-dev，八章）

| 顺序 | 文件 | 章节 id | 史实注 | 选择 / 交互 | 字数 | 节点 |
|---|---|---|---|---|---|---|
| 1 | `00-prologue.md` | `prologue` | `yudu` | 门板、行囊多选、回望 | 880 | 50 |
| 2 | `01-xiangjiang.md` | `xiangjiang` | `xiangjiang` | 弃物多选、先渡谁 | 945 | 51 |
| 3 | `02-zunyi.md` | `zunyi` | `zunyi` | 错误卡 3 问 | 370 | 30 |
| 4 | `03-jinsha.md` | `jinsha` | `jinsha` | 先渡谁、记名 8s | 641 | 42 |
| 5 | `04-luding.md` | `luding` | `luding` | 飞毛腿危机、记名 | 741 | 46 |
| 6 | `05-grass.md` | `grass` | `grass` | 灶王危机、冬生危机、分粮 | 586 | 47 |
| 7 | `06-wuqi.md` | `wuqi` | `wuqi` | 门板去留、点名 45s | 1004 | 56 |
| 8 | `07-coda.md` | `coda` | `wuqi` | 空页路线点名 45s，隐藏章 | 118 | 12 |
| — | 合计 | — | 7 张 | 18 段选择、2 处点名、1 处记名 | **5285** | **334** |

> `coda` 是隐藏章，不进地图；只有 `strain.dying`（空页路线）从草地 `g899` 进入。

## 2. 文件头（每章必备，固定 6 行；「定稿」= 当前正文实测值，不是预算）

    # 序章 · 于都
    - id: prologue ｜ 史实注: yudu ｜ 选择: p021（门板）、p024（行囊多选）
    - 定稿: 880 字 ｜ 43 beat ｜ 时长(B) 3:47
    - bg: yudu_river, yudu_night ｜ sfx: river, saw, bugle, rooster
    - 演出: 门板特写 / 浮桥纵深远景 / 门口剪影
    - 虚构声明: 满崽及本作人物均为虚构，非史料人物（片头、图鉴各出现一次）

## 3. 行类型（只允许这 11 种）

| 写法 | 含义 | 转成 story.js |
|---|---|---|
| `【说话人】文本` | 一句台词/旁白；旁白固定写 `【旁白】` | `{type:'line', speaker, text}` |
| `[[bg:id]]` `[[sfx:id]]` | 挂到**下一条** line 的 `bg`/`sfx` 字段 | 字段合并 |
| `[[if:key]]` … `[[else]]` … `[[end]]` | 条件块；`key` 为旗标路径，真值走第一段 | 编译为**同位置条件节点**：两段各给一个 id（主序号 + `a`/`b`），带 `when` 字段；不在运行期展开（§6） |
| `>> 选项｜限时 16s｜默认 A｜记录到 choice.x.y` + `A｜文案｜set: …｜cost: …` | 单选；无“限时”即不计时，无“默认”即无超时 | `{type:'choice', id, record, timeout, defaultOption, options:[{key,text,value,set,cost}]}` |
| `>> 多选｜最多 3 件｜记录到 item.*` + 选项行 | 多选；可带 `min`、`maxWhen`、`slotLoad` | `{type:'multichoice', id, min, max, maxWhen, options:[{key,text,flag,value}]}` |
| `requires: …`（写在选项行） | 该选项在什么条件下可见；与 `when` 同一套语法 | `options[].requires`；UI 与结算共用 `visibleOptions` |
| `【史实注】yudu` | 弹史实注并解锁图鉴 | `{type:'codex', id}` |
| `【标题卡】第一章 · 湘江` | 章节标题卡 | `{type:'title', text}` |
| `【结算】…` | 结算面板（清单可读、不评分） | `{type:'result', …}` |
| `【交互】点名｜45s` | 点名 / 记名交互 | `{type:'interact', …}` |
| `【结束】next=xiangjiang` | 章末 | `{type:'end', next}` |

> 2026-11-06 起**没有小游戏**：`door/abandon/boat/climb` 与 `minigames.js` 已删除；行囊、弃物改为 `multichoice`，三次危机与金沙江/泸定改为 `choice`。实现以 `story.js` 为准。

## 4. 选项与代价（硬规则）

- 每个选项必须有 `cost:`，写**可读的一句代价**，结算时原样显示。
- 限时选项必须有 `默认 X`；超时按默认项结算，并记录 `timedOut: true`。默认项必须可见；默认项被 `requires` 隐藏时，引擎回退到第一个可见项。
- 三次危机（l019/l019x、g018x、g026x）的默认项都是“不救”：犹豫也是代价。
- 2026-11-02 步骤七按试玩反馈把既有 9 个限时项统一翻倍（8→16、10→20、6→12）；v1.3 新增危机沿用 12s / 16s / 12s。
- 每个选项必须有 `key`（A/B/C/D）与 `value`：`record:` 指向的旗标写入 `value`，所以「带门板 = true」这类语义是数据，不是代码。
- `record:` 一律写 `choice.<章>.<事件>`；同一事件只记一次，不覆盖（重玩由重置存档负责）。
- 选项之间不允许有“显然更好”的一项：如果一眼能看出哪项对，就给“看起来对”的那项加一个更痛的代价。
- `set:` 只写 `docs/state-schema.md` §3 里的键；新增键先补 schema。`set` 支持两种写法：赋值（`item.door=true`）与增量（`fire=+10`、`load=-1`）。
- 危机“救人”一律 `strain=+1` 并把对应物品置 false；`strain` 的派生旗标由引擎写，剧本不写 `strain.hurt/strain.dying/fate.lin.dead/fate.all.dead`。
- 选项文案 ≤ 14 字；`cost` ≤ 22 字（手机上两行放得下）。

## 5. 字数口径

- 只统计 `【…】` 行里 `】` 之后的字符（含中文标点，不含空格/换行）。
- **不算**：说话人名、选项文案、`cost`、UI 文案、史实注、演出备注、文件头。
- 不算的指令行：`【史实注】【标题卡】【结算】【交互】【结束】`（统计脚本按白名单排除）。
- 统计工具：`node project/tools/count-words.js docs/script`（输出每章字数、总数、A 口径秒数）。
- 换算：A 口径（正常点按）= 0.166 秒/字；B 口径（慢读）= 0.258 秒/字。
- **文本源同时保留互斥分支**（死/活、有板/无板），所以 5285 字是“全部文本”，不是单周目阅读量；单周目可见正文为 3254–3931 字（空页最短，四道划痕最长）。验收计时以实际游玩为准，不拿 5308 字直接折算。

## 6. 节点契约（步骤十定稿）

`story.js` 的每章是**按序扁平数组**，不用树、不用栈：条件分支靠节点上的 `when` 字段过滤，运行时永远「从当前下标往后找第一个可见节点」。

| 字段 | 适用 | 说明 |
|---|---|---|
| `id` | 全部 | 全局唯一字符串；规则见 §7 |
| `type` | 全部 | `line` / `choice` / `multichoice` / `result` / `title` / `codex` / `interact` / `end` |
| `when` | 全部（可选） | 条件字符串；`item.door` 真、`!item.door` 假、`a && b` 与；同位置的互斥分支各写一条 |
| `speaker` `text` | line | 旁白写 `旁白`；`speaker` 为旁白时 UI 不显示姓名签 |
| `bg` | line | 只写 `art.js` `SCENES` 里的 id；不给就沿用上一句的背景 |
| `record` `timeout` `defaultOption` `prompt` `options` | choice | `options[].key/text/value/set/cost/requires`；`timeout` 单位秒，0 或省略 = 不计时 |
| `min` `max` `maxWhen` `slotLoad` `recordMode` | multichoice | `maxWhen:[{when,max}]` 取最小上限（门板占 2 格、带板行囊只塞 1 件）；`slotLoad` 由 `inventoryBase` 计算剩余格 |
| `lists` | result | `[{when, heading, items[]}]`；只列清单，不评分、不写旗标；`source:"items"` 按行囊重建 |
| `text` `sub` | title | 章名与副题；显示后自动关或点击关 |
| `codexId` | codex | 必须是 `story.codex` 里的 id；关闭时解锁 |
| `mode` `duration` `coda` | interact | `rollcall` 用 `XB.core.resolveRollCall` 动态生成 7/8 人；`coda:true` 追加满崽并由冬生代答 |
| `next` | end | 下一章 id、`ending` 或 `map`；草地 `g899` 进 `coda`，`g900` 进 `wuqi` |

**`when` / `set` 白名单**（越界在 `check-build` 与 `smoke` 里直接失败，不在运行期兜底）：

- `when` 只读：`item.*`、`load`、`trust`、`fire`、`lights_lost`、`strain`（含派生 `strain.hurt/strain.dying`）、`fate.*`（含派生 `fate.lin.dead/fate.all.dead`）、`had.door`、`memory.*`、`choice.*`，支持前置 `!` 与 `&&`。
- `set` 只写：`item.*`、`load`、`trust`、`fire`、`lights_lost`、`strain`（夹 0–3）、`fate.feimao.dead/fate.zaowang.dead/fate.dongsheng.dead`、`had.door`、`memory.*`、`choice.*`。
- 派生旗标 `strain.hurt`（strain≥2）、`strain.dying`（strain≥3）、`fate.lin.dead`（strain 2）、`fate.all.dead`（三个危机全死）只由引擎 `syncDerivedFlags` 写。
- `item.door` 写入时同步 `inventory.door`（存档里两处必须一致）。`choice.xiangjiang.abandoned` 是唯一 list flag，只由弃物多选写，剧本 `set` 不得写。
- `ending.*`、`card.*`、`unlockedChapters` **不许**由剧本写，只能由引擎写。

**三步转换**（步骤一照抄，不许再发明）：

1. 去文件头与 `[[…]]` 指令，得到纯节点序列。
2. `[[if]]` 块两段各给一个 id（主序号 + `a`/`b`），写 `when`；`[[else]]` 段写 `!key`；嵌套最多 2 层，用 `&&` 拍平。
3. 章末 `{type:'end', next}` 指向下一章 id、`coda` 或 `ending`。

## 7. 节点 id 规则（步骤十补 coda）

- 章前缀：`prologue=p`、`xiangjiang=x`、`zunyi=z`、`jinsha=j`、`luding=l`、`grass=g`、`wuqi=w`、`coda=c`。
- 顺序号 `001–899`；分支正文用主序号加后缀 `a`/`b`（或危机 `x`，如 `l019x/g018x/g026x`）；`900–999` 保留给该章 end 节点（如 `p900`、`g899`、`g900`）。
- id **全局唯一、一经写入 story.js 不再改**；确需改名，必须同时写存档迁移（`docs/state-schema.md` §5）。
- 存档只存当前节点 id，不存数组下标；载入时按 id 在全章节点表里定位。
- 序章 50 节点：p001–p020 原句，p021 门板，p022a/p023a（有板）、p022b（无板），p024 行囊多选（`maxWhen` 带板 1 件），p025 结算，p026–p043，p044 图鉴，p900 结束。
- 章节实际节点：50 / 51 / 30 / 42 / 46 / 47 / 56 / 12；完整映射见 `docs/chapter-integration.md` §1–2。
- 结尾链：p900→x900→z900→j900→l900→g900→wuqi→w900→`ending`；空页为 g899→coda→c012→`ending`。不允许把 `ending` 写成章节 id。

## 8. 统计表（每次改稿后回填，与正文一致）

| 章 | 字数 | beat | 抉择点 | 选项 | 限时项 | 口播 A 口径 |
|---|---|---|---|---|---|---|
| 序章 | 880 | 43 | 3 | 9 | 2 | 2:26 |
| 湘江 | 945 | 44 | 3 | 11 | 2 | 2:37 |
| 遵义 | 370 | 23 | 3 | 6 | 0 | 1:01 |
| 金沙江 | 641 | 36 | 1 | 3 | 1 | 1:46 |
| 泸定 | 741 | 40 | 3 | 7 | 3 | 2:03 |
| 草地 | 586 | 39 | 4 | 12 | 4 | 1:37 |
| 终章 | 1004 | 52 | 1 | 2 | 1 | 2:46 |
| 空页 | 118 | 8 | 0 | 0 | 0 | 0:20 |
| 合计 | **5285** | **285** | **18** | **50** | **13** | **14:37** |

> 本表字数、beat 来自 `count-words.js`，包含互斥分支；表内“口播 A 口径”只用于文本源体量比较，不是单周目时长。
> 单周目可见正文：四道划痕 3931 字、门板 3894 字、桥板 3705 字、石墙 3785 字、空页 3254 字；B 口径 13.99–16.90 分钟（不含选项与 UI），完整计时以 runner 实测为准。
> 文件头的「定稿」行、本节、`docs/story-bible.md` §4.1 与 §4.4 必须同步；改稿先改正文，再回填。
> 统计命令：`node project/tools/count-words.js docs/script`。改完剧本必须回填本表，否则视为未完成。