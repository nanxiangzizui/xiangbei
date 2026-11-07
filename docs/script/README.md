# 剧本格式与字数口径（v1.4）

> 本文件是**文本源格式的唯一约定**：`docs/script/*.md` 是文本源，`story.js` 是誊本（D3）。
> 改文本先改 md → 再同步 story.js → 提交信息写“文本同步: <章>”。
> 剧本只写“看得见、听得到”的东西；精神不写进旁白，写进选项与代价。

## 1. 章节与 id（v1.4.0-dev，九章）

| 顺序 | 文件 | 章节 id | 史实注 | 选择 / 交互 | 字数 | 节点 |
|---|---|---|---|---|---|---|
| 1 | `00-prologue.md` | `prologue` | `yudu` | 门板、行囊多选（4 格）、回望 | 880 | 50 |
| 2 | `01-xiangjiang.md` | `xiangjiang` | `xiangjiang` | 弃物多选、先渡谁 | 945 | 51 |
| 3 | `02-zunyi.md` | `zunyi` | `zunyi` | 错误卡 3 问 | 370 | 30 |
| 4 | `03-jinsha.md` | `jinsha` | `jinsha` | 先渡谁、记名 | 641 | 42 |
| 5 | `04-luding.md` | `luding` | `luding` | 飞毛腿危机 12s、记名 | 741 | 46 |
| 6 | `05-grass.md` | `grass` | `grass` | 分粮、灶王危机 16s、冬生危机 12s、草地状态结算 | 626 | 51 |
| 7 | `06-wuqi.md` | `wuqi` | `wuqi` | 门板去留、点名 45s | 1004 | 56 |
| 8 | `07-coda.md` | `coda` | `wuqi` | 空页路线点名 45s，隐藏章 | 140 | 13 |
| 9 | `08-badend.md` | `badend` | `grass` | 坏结局，隐藏章 | 44 | 6 |
| — | 合计 | — | 7 张 | 18 段选择、3 处交互、13 个限时项 | **5391** | **345** |

> `coda` 与 `badend` 都是隐藏章，不进地图。
> `coda` 由草地 `g899` 进入（`fate.seven5`：带门板、救 3 人、你死在草地）；`badend` 由 `g898` 进入（`fate.badend`：你死在草地但不是 7(5)）。
> 2026-11-07 起 v1.4：行囊 4 格（8 个半格），状态 0–4，11 个结局；没有小游戏。

## 2. 文件头（每章必备，固定 6 行；「定稿」= 当前正文实测值，不是预算）

    # 序章 · 于都
    - id: prologue ｜ 史实注: yudu ｜ 选择: p021（门板）、p024（行囊多选）
    - 定稿: 880 字 ｜ 43 beat ｜ 时长(B) 3:47
    - bg: yudu_river, yudu_night ｜ sfx: river, saw, bugle, rooster
    - 演出: 门板特写 / 浮桥纵深远景 / 门口剪影
    - 虚构声明: 满崽及本作人物均为虚构，非史料人物（片头、图鉴各出现一次）

## 3. 行类型（只允许这 12 种）

| 写法 | 含义 | 转成 story.js |
|---|---|---|
| `【说话人】文本` | 一句台词/旁白；旁白固定写 `【旁白】` | `{type:'line', speaker, text}` |
| `[[bg:id]]` `[[sfx:id]]` | 挂到**下一条** line 的 `bg`/`sfx` 字段 | 字段合并 |
| `[[if:key]]` … `[[else]]` … `[[end]]` | 条件块；`key` 为旗标路径，真值走第一段 | 编译为**同位置条件节点**：两段各给一个 id（主序号 + `a`/`b`），带 `when` 字段；不在运行期展开（§6） |
| `>> 选项｜限时 12s｜默认 C｜记录到 choice.x.y` + `A｜文案｜set: …｜cost: …` | 单选；无“限时”即不计时，无“默认”即无超时 | `{type:'choice', id, record, timeout, defaultOption, options:[{key,text,value,set,cost,requires}]}` |
| `>> 多选｜最多 5 件｜记录到 item.*` + 选项行 | 多选；4 格/8 半格由引擎 `ITEM_UNITS` 计算，选项可写 `slots` 但不再决定容量 | `{type:'multichoice', id, min, max, options:[{key,text,flag,value}]}` |
| `requires: …`（写在选项行） | 该选项在什么条件下可见；与 `when` 同一套语法 | `options[].requires`；UI 与结算共用 `visibleOptions` |
| `【史实注】yudu` | 弹史实注并解锁图鉴 | `{type:'codex', id}` |
| `【标题卡】第一章 · 湘江` | 章节标题卡 | `{type:'title', text}` |
| `【结算】…` | 结算面板（清单可读、不评分） | `{type:'result', …}` |
| `【结算】草地状态` | 草地结束时扣状态、判帮助、判死 | `{type:'settle', settle:'grass'}` |
| `【交互】点名｜45s` | 点名 / 记名交互 | `{type:'interact', …}` |
| `【结束】next=xiangjiang` | 章末 | `{type:'end', next}` |

> 没有小游戏：`door/abandon/boat/climb` 与 `minigames.js` 已删除；行囊、弃物改为 `multichoice`，三次危机与金沙江/泸定改为 `choice`。实现以 `story.js` 为准。

## 4. 选项与代价（硬规则）

- 每个选项必须有 `cost:`，写**可读的一句代价**，结算时原样显示。
- 限时选项必须有 `默认 X`；超时按默认项结算，并记录 `timedOut: true`。默认项必须可见；默认项被 `requires` 隐藏时，引擎回退到第一个可见项。
- 三次危机的默认项：泸定有板 `l019` = C（抱板走），无板 `l019x` = B（继续走）；草地 `g018x`（灶王）= C（不救），`g026x`（冬生）= C（不救）。犹豫也是代价。
- 限时秒数：既有 9 项沿用步骤七翻倍后的 16/20/12；v1.4 危机为 12s / 16s / 12s。
- 每个选项必须有 `key`（A/B/C/D）与 `value`：`record:` 指向的旗标写入 `value`，所以「带门板 = true」这类语义是数据，不是代码。
- `record:` 一律写 `choice.<章>.<事件>`；同一事件只记一次，不覆盖（重玩由重置存档负责）。
- 选项之间不允许有“显然更好”的一项：如果一眼能看出哪项对，就给“看起来对”的那项加一个更痛的代价。
- `set:` 只写 `docs/state-schema.md` §3 里的键；新增键先补 schema。`set` 支持两种写法：赋值（`item.door=true`）与增量（`fire=+10`、`load=-1`）。
- 救人写 `rescues=+1`、`quality.<人>=2|3`、对应 `item.*=false`；**状态扣减由引擎按 `rescuePenalty` 统一处理，剧本不写 `condition`**。
- 剧本不写 `strain` 与派生旗标；`strain` 只作为 v1.3 存档兼容值，由引擎同步。
- 选项文案 ≤ 14 字；`cost` ≤ 22 字（手机上两行放得下）。

## 5. 字数口径

- 只统计 `【…】` 行里 `】` 之后的字符（含中文标点，不含空格/换行）。
- **不算**：说话人名、选项文案、`cost`、UI 文案、史实注、演出备注、文件头。
- 不算的指令行：`【史实注】【标题卡】【结算】【交互】【结束】`（统计脚本按白名单排除）。
- 统计工具：`node project/tools/count-words.js docs/script`（输出每章字数、总数、A 口径秒数）。
- 换算：A 口径（正常点按）= 0.166 秒/字；B 口径（慢读）= 0.258 秒/字。
- **文本源同时保留互斥分支**（死/活、有板/无板），所以 5391 字是“全部文本”，不是单周目阅读量；单周目可见正文按路线约 3.1–3.9k 字，完整计时以 runner 实测为准，不拿 5391 字直接折算。

## 6. 节点契约（步骤十一定稿）

`story.js` 的每章是**按序扁平数组**，不用树、不用栈：条件分支靠节点上的 `when` 字段过滤，运行时永远「从当前下标往后找第一个可见节点」。

| 字段 | 适用 | 说明 |
|---|---|---|
| `id` | 全部 | 全局唯一字符串；规则见 §7 |
| `type` | 全部 | `line` / `choice` / `multichoice` / `result` / `title` / `codex` / `interact` / `settle` / `end` |
| `when` | 全部（可选） | 条件字符串；`item.door` 真、`!item.door` 假、`a && b` 与；同位置的互斥分支各写一条 |
| `speaker` `text` | line | 旁白写 `旁白`；`speaker` 为旁白时 UI 不显示姓名签 |
| `bg` | line | 只写 `art.js` `SCENES` 里的 id；不给就沿用上一句的背景 |
| `record` `timeout` `defaultOption` `prompt` `options` | choice | `options[].key/text/value/set/cost/requires`；`timeout` 单位秒，0 或省略 = 不计时 |
| `min` `max` `recordMode` | multichoice | 容量由 `XB.core.packUsage/canAddMultiOption` 按 4 格 = 8 半格计算；p024 五件最多 5 件，实际受总格数限制 |
| `lists` | result | `[{when, heading, items[]}]`；只列清单，不评分、不写旗标；`source:"items"` 按行囊重建 |
| `text` `sub` | title | 章名与副题；显示后自动关或点击关 |
| `codexId` | codex | 必须是 `story.codex` 里的 id；关闭时解锁 |
| `mode` `duration` `coda` | interact | `rollcall` 用 `XB.core.resolveRollCall` 动态生成 7/8 人；`coda:true` 追加满崽并由冬生代答 |
| `settle` | settle | 目前只有 `grass`；调用 `settleGrass`，再按警告/门板流程收束 |
| `next` | end | 下一章 id、`ending` 或 `map`；草地 `g898` 进 `badend`，`g899` 进 `coda`，`g900` 进 `wuqi` |

**`when` / `set` 白名单**（越界在 `check-build` 与 `smoke` 里直接失败，不在运行期兜底）：

- `when` 只读：`item.*`、`load`、`trust`、`fire`、`lights_lost`、`condition`、`rescues`、`quality.*`、`fate.*`（含派生 `fate.player.dead/fate.lin.dead/fate.all.dead/fate.seven5/fate.badend`）、`had.door`、`doorOutcome`、`memory.*`、`choice.*`、`help.used`、`grass.settled`、`inventory.giftBarley`，支持前置 `!` 与 `&&`。
- `set` 只写：`item.*`、`load`、`trust`、`fire`、`lights_lost`、`rescues`（夹 0–3）、`quality.feimao/zaowang/dongsheng`（0–3）、`fate.feimao.dead/fate.zaowang.dead/fate.dongsheng.dead`、`had.door`、`doorOutcome`、`memory.*`、`choice.*`、`inventory.giftBarley`。
- 引擎派生：`condition` 扣减、`fate.player.dead`、`fate.lin.dead`（= player.dead）、`fate.all.dead`、`fate.seven5`、`fate.badend`、`help.used`、`strain/strain.hurt/strain.dying` 由 `syncDerivedFlags` / `rescuePenalty` / `settleGrass` 写，剧本不写。
- `item.door` 写入时同步 `inventory.door`（存档里两处必须一致）。`choice.xiangjiang.abandoned` 是唯一 list flag，只由弃物多选写，剧本 `set` 不得写。
- `ending.*`、`card.*`、`unlockedChapters` **不许**由剧本写，只能由引擎写。

**三步转换**（步骤一照抄，不许再发明）：

1. 去文件头与 `[[…]]` 指令，得到纯节点序列。
2. `[[if]]` 块两段各给一个 id（主序号 + `a`/`b`），写 `when`；`[[else]]` 段写 `!key`；嵌套最多 2 层，用 `&&` 拍平。
3. 章末 `{type:'end', next}` 指向下一章 id、`coda`、`badend` 或 `ending`。

## 7. 节点 id 规则（步骤十一加 badend）

- 章前缀：`prologue=p`、`xiangjiang=x`、`zunyi=z`、`jinsha=j`、`luding=l`、`grass=g`、`wuqi=w`、`coda=c`、`badend=b`。
- 顺序号 `001–899`；分支正文用主序号加后缀 `a`/`b`/`c`/`d`（或危机 `x`，如 `l019x/g018x/g026x`）；`900–999` 保留给该章 end 节点（如 `p900`、`g898/g899/g900`）。
- id **全局唯一、一经写入 story.js 不再改**；确需改名，必须同时写存档迁移（`docs/state-schema.md` §5）。
- 存档只存当前节点 id，不存数组下标；载入时按 id 在全章节点表里定位。
- 序章 50 节点：p001–p020 原句，p021 门板，p022a/p023a（有板）、p022b（无板），p024 行囊多选（4 格），p025 结算，p026–p043，p044 图鉴，p900 结束。
- 章节实际节点：50 / 51 / 30 / 42 / 46 / 51 / 56 / 13 / 6；完整映射见 `docs/chapter-integration.md` §1–2。
- 结尾链：p900→x900→z900→j900→l900→g900→wuqi→w900→`ending`；7(5) 为 g899→coda→c012→`ending`；坏结局为 g898→badend→b006→`ending`。不允许把 `ending` 写成章节 id。

## 8. 统计表（每次改稿后回填，与正文一致）

| 章 | 字数 | beat | 抉择点 | 选项 | 限时项 | 口播 A 口径 |
|---|---|---|---|---|---|---|
| 序章 | 880 | 43 | 3 | 9 | 2 | 2:26 |
| 湘江 | 945 | 44 | 3 | 11 | 2 | 2:37 |
| 遵义 | 370 | 23 | 3 | 6 | 0 | 1:01 |
| 金沙江 | 641 | 36 | 1 | 3 | 1 | 1:46 |
| 泸定 | 741 | 40 | 3 | 7 | 3 | 2:03 |
| 草地 | 626 | 41 | 4 | 10 | 4 | 1:44 |
| 终章 | 1004 | 52 | 1 | 2 | 1 | 2:47 |
| 空页 | 140 | 9 | 0 | 0 | 0 | 0:23 |
| 坏结局 | 44 | 4 | 0 | 0 | 0 | 0:07 |
| 合计 | **5391** | **292** | **18** | **48** | **13** | **14:55** |

> 本表字数、beat 来自 `count-words.js`，包含互斥分支；表内“口播 A 口径”只用于文本源体量比较，不是单周目时长。
> 单周目可见正文按路线约 3.1–3.9k 字（B 口径约 13–17 分钟，不含选项与 UI），完整计时以 runner 实测为准。
> 文件头的「定稿」行、本节、`docs/story-bible.md` §4.1 与 §4.4 必须同步；改稿先改正文，再回填。
> 统计命令：`node project/tools/count-words.js docs/script`。改完剧本必须回填本表，否则视为未完成。
