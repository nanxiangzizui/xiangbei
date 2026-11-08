# 剧本格式与字数口径（v1.5）

> 本文件是**文本源格式的唯一约定**：`docs/script/*.md` 是文本源，`story.js` 是誊本（D3）。
> 改文本先改 md → 再同步 story.js → 提交信息写“文本同步: <章>”。
> 剧本只写“看得见、听得到”的东西；精神不写进旁白，写进选项与代价。

## 1. 章节与 id（v1.5.0-dev，九章）

| 顺序 | 文件 | 章节 id | 史实注 | 选择 / 交互 | 字数 | 节点 |
|---|---|---|---|---|---|---|
| 1 | `00-prologue.md` | `prologue` | `yudu` | 门板、行囊多选（4 格）、回望 | 1280 | 89 |
| 2 | `01-xiangjiang.md` | `xiangjiang` | `xiangjiang` | 弃物多选、先渡谁 | 1902 | 114 |
| 3 | `02-zunyi.md` | `zunyi` | `zunyi` | 错误卡 3 问、林先生写标语 | 1551 | 118 |
| 4 | `03-jinsha.md` | `jinsha` | `jinsha` | 先渡谁、记名 | 1190 | 86 |
| 5 | `04-luding.md` | `luding` | `luding` | 飞毛腿危机 12s、记名 | 1829 | 120 |
| 6 | `05-grass.md` | `grass` | `grass` | 青稞、灶王危机 16s、冬生危机 12s、草地状态结算 | 1809 | 135 |
| 7 | `06-wuqi.md` | `wuqi` | `wuqi` | 门板去留、点名 45s | 1410 | 78 |
| 8 | `07-coda.md` | `coda` | `wuqi` | 空页路线点名 45s，隐藏章 | 234 | 18 |
| 9 | `08-badend.md` | `badend` | `grass` | 坏结局，隐藏章 | 73 | 8 |
| — | 合计 | — | 7 张 | 19 段选择（17 单选 + 2 多选）、3 处交互、13 个限时项 | **11278** | **766** |

> `coda` 与 `badend` 都是隐藏章，不进地图。
> `coda` 由草地 `g899` 进入（`fate.seven5`：带门板、救 3 人、你死在草地）；`badend` 由 `g898` 进入（`fate.badend`：你死在草地但不是 7(5)）。
> 2026-11-07 起 v1.4：行囊 4 格（8 个半格），状态 0–4，11 个结局；没有小游戏。

## 2. 文件头（每章必备，固定 6 行；「定稿」= 当前正文实测值，不是预算）

    # 序章 · 于都
    - id: prologue ｜ 史实注: yudu ｜ 选择: p021（门板）、p024（行囊多选）
    - 定稿: 1280 字 ｜ 82 beat ｜ 时长(B) 5:30
    - bg: yudu_river, yudu_night ｜ sfx: river, saw, bugle, rooster
    - 演出: 门板特写 / 浮桥纵深远景 / 门口剪影
    - 虚构声明: 满崽及本作人物均为虚构，非史料人物（片头、图鉴各出现一次）

## 3. 行类型（只允许这 12 种）

| 写法 | 含义 | 转成 story.js |
|---|---|---|
| `【说话人】文本` | 一句台词/旁白；旁白固定写 `【旁白】` | `{type:'line', speaker, text}` |
| `[[bg:id]]` `[[sfx:id]]` | 挂到**下一条** line 的 `bg`/`sfx` 字段 | 字段合并 |
| `[[if:key]]` … `[[else]]` … `[[end]]` | 条件块；`key` 为旗标路径，真值走第一段 | 编译为**同位置条件节点**：两段各给一个 id（主序号 + `a`/`b`），带 `when` 字段；不在运行期展开（§6） |
| `>> 选项｜限时 12s｜默认 C｜记录到 choice.x.y` + `A｜文案｜set: …｜cost: …` | 单选；无“限时”即不计时，无“默认”即无超时；头部加 `｜hideCost` 时不显示代价 | `{type:'choice', id, record, timeout, defaultOption, hideCost?, options:[{key,text,value,set,setIf,cost,requires}]}` |
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

- 每个选项必须有 `cost:`，写**可读的一句代价**；默认显示在选项卡片下方。节点头部写 `｜hideCost` 时不显示，超时提示也不带代价（仍保留在数据里供日志/剧情核对）。
- 限时选项必须有 `默认 X`；超时按默认项结算，并记录 `timedOut: true`。默认项必须可见；默认项被 `requires` 隐藏时，引擎回退到第一个可见项。
- 三次危机的默认项：泸定有板 `l019` = C（抱板走），无板 `l019x` = B（继续走）；草地 `g018x`（灶王）= C（不救），`g026x`（冬生）= C（不救）。犹豫也是代价。
- 限时秒数：既有 9 项沿用步骤七翻倍后的 16/20/12；v1.4 危机为 12s / 16s / 12s。
- 每个选项必须有 `key`（A/B/C/D）与 `value`：`record:` 指向的旗标写入 `value`，所以「带门板 = true」这类语义是数据，不是代码。
- `record:` 一律写 `choice.<章>.<事件>`；同一事件只记一次，不覆盖（重玩由重置存档负责）。
- 选项之间不允许有“显然更好”的一项：如果一眼能看出哪项对，就给“看起来对”的那项加一个更痛的代价。
- `set:` 只写 `docs/state-schema.md` §3 里的键；新增键先补 schema。`set` 支持两种写法：赋值（`item.door=true`）与增量（`fire=+10`、`load=-1`）。
- `setIf:` 用于“带了才扣”的条件代价：写成 `条件 → 旗标=值；条件 → …`，引擎在选项结算时按**选择前**的状态判定，命中才写；多条互斥条件不会被前一条改写误触发。
- 救人写 `rescues=+1`、`quality.<人>=2|3`、对应 `item.*=false`；**救人的状态扣减由引擎按 `rescuePenalty` 统一处理，剧本不写 `condition`**。非救人剧情可以写 `condition=+1/-1`（物资恢复走引擎）；草地分粮本身只扣粮，`condition=+1` 写在 g008b 回赠行上，原因“你与他人互相救助”。
- 剧本不写 `strain` 与派生旗标；`strain` 只作为 v1.3 存档兼容值，由引擎同步。
- 选项文案 ≤ 14 字；`cost` ≤ 22 字（手机上两行放得下）。

## 5. 字数口径

- 只统计 `【…】` 行里 `】` 之后的字符（含中文标点，不含空格/换行）。
- **不算**：说话人名、选项文案、`cost`、UI 文案、史实注、演出备注、文件头。
- 不算的指令行：`【史实注】【标题卡】【结算】【交互】【结束】`（统计脚本按白名单排除）。
- 统计工具：`node project/tools/count-words.js docs/script`（输出每章字数、总数、A 口径秒数）。
- 换算：A 口径（正常点按）= 0.166 秒/字；B 口径（慢读）= 0.258 秒/字。
- **文本源同时保留互斥分支**（死/活、有板/无板），所以 11278 字是“全部文本”，不是单周目阅读量；单周目可见正文按路线约 8–10k 字（未实测），完整计时以 runner 实测为准，不拿 11278 字直接折算。

## 6. 节点契约（步骤十一定稿）

`story.js` 的每章是**按序扁平数组**，不用树、不用栈：条件分支靠节点上的 `when` 字段过滤，运行时永远「从当前下标往后找第一个可见节点」。

| 字段 | 适用 | 说明 |
|---|---|---|
| `id` | 全部 | 全局唯一字符串；规则见 §7 |
| `type` | 全部 | `line` / `choice` / `multichoice` / `result` / `title` / `codex` / `interact` / `settle` / `end` |
| `when` | 全部（可选） | 条件字符串；`item.door` 真、`!item.door` 假、`a && b` 与；同位置的互斥分支各写一条 |
| `speaker` `text` | line | 旁白写 `旁白`；`speaker` 为旁白时 UI 不显示姓名签 |
| `bg` | line | 只写 `art.js` `SCENES` 里的 id；不给就沿用上一句的背景 |
| `status` `statusReason` `statusOnce` | choice / line（可选） | `status` 在节点进入时写入并落档（choice 在选项出现前，line 在本句显示前；如 `{ "quality.feimao": 1 }`）；`statusOnce` 给只发生一次的行做幂等标记（如 g008b 的 `memory.grass_mutual`），刷新不重复；`statusReason` 只用于顶部状态提示，不落档 |
| `record` `timeout` `defaultOption` `hideCost` `prompt` `options` | choice | `options[].key/text/value/set/setIf/cost/requires/statusReason`；`timeout` 单位秒，0 或省略 = 不计时 |
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
- 序章 89 节点：p001–p020 原句，p021 门板，p022a/p023a（有板）、p022b（无板），p024 行囊多选（4 格），p025 结算，p026–p043，p044 图鉴，p900 结束；v1.5 新增 p100–p138 插在 p013 之后。
- 章节实际节点：89 / 114 / 118 / 86 / 120 / 135 / 78 / 18 / 8；完整映射见 `docs/chapter-integration.md` §1–2。
- v1.5 文本扩写新增节点用 `100–199` 段（p100…、x100…），按数组位置播放，不按 id 数值排序；旧 id 不改，存档兼容。
- 结尾链：p900→x900→z900→j900→l900→g900→wuqi→w900→`ending`；7(5) 为 g899→coda→c012→`ending`；坏结局为 g898→badend→b006→`ending`。不允许把 `ending` 写成章节 id。

## 8. 统计表（每次改稿后回填，与正文一致）

| 章 | 字数 | beat | 抉择点 | 选项 | 限时项 | 口播 A 口径 |
|---|---|---|---|---|---|---|
| 序章 | 1280 | 82 | 3 | 9 | 2 | 3:32 |
| 湘江 | 1902 | 107 | 3 | 11 | 2 | 5:16 |
| 遵义 | 1551 | 110 | 4 | 8 | 0 | 4:17 |
| 金沙江 | 1190 | 80 | 1 | 3 | 1 | 3:18 |
| 泸定 | 1829 | 114 | 3 | 7 | 3 | 5:04 |
| 草地 | 1809 | 118 | 4 | 10 | 4 | 5:00 |
| 终章 | 1410 | 74 | 1 | 2 | 1 | 3:54 |
| 空页 | 234 | 14 | 0 | 0 | 0 | 0:39 |
| 坏结局 | 73 | 6 | 0 | 0 | 0 | 0:12 |
| 合计 | **11278** | **705** | **19** | **50** | **13** | **31:12** |

> 本表字数、beat 来自 `count-words.js`，包含互斥分支；表内“口播 A 口径”只用于文本源体量比较，不是单周目时长。
> 单周目可见正文按路线约 8–10k 字（未实测），完整计时以 runner 实测为准；本轮扩写后尚未做真人计时。
> 2026-11-08 用户明确要求“不要考虑时长，大胆加文本”；本轮先保内容，20 分钟验收挂起，待内容确认后再按红线 13 裁剪或调整验收口径。
> 文件头的「定稿」行、本节、`docs/story-bible.md` §4.1 与 §4.4 必须同步；改稿先改正文，再回填。
> 统计命令：`node project/tools/count-words.js docs/script`。改完剧本必须回填本表，否则视为未完成。

## 9. v1.5 扩写段落索引（2026-11-08）

| 章 | 新 id | 内容 |
|---|---|---|
| 序章 | p100–p138 | 飞毛腿看门板并试背、灶王送锅巴（锅是空的）、冬生报名字、林先生在祠堂墙打格子写字 |
| 湘江 | x100–x160 | 几天几夜夜行军/飞机炮火/路边蹲下的人；土坎分水、飞毛腿替背门板、林先生撕旗裹伤；陈班长守桥未归与补籍贯；老周“名册还在/数一遍/走，别回头”；飞毛腿带回后队不来的话、冬生让他吹号；林先生剪湿旗上的字 |
| 遵义 | z100–z181 | 烫脚、灶王与飞毛腿斗嘴、飞毛腿替背门板、林先生补冬生鞋；火盆夜谈老家/参军几年/走得到吗；林先生给飞毛腿写三个字真名、锅底“灶”、冬生手心“冬生”、满崽手心“满”；四人自我批评；出发前随身物 |
| 金沙江 | j100–j143 | 等船最后一夜：稀粥照月亮、飞毛腿让冬生、冬生拨米粒、林先生烘名册、冬生擦号哈气、灶王盐开水、飞毛腿让满崽靠着睡、雾中四人睡态 |
| 泸定 | l100–l155 | 一昼夜 240 里、走着睡着、坐下起不来；桥头亭子烧着、机枪打铁索火星、敌军抽板浇煤油；第一至第二十二个光点、数着他们才在；板不够、门板/床板、湿被子扑火；飞毛腿第四次搬板蹲下；门板对话“它现在是桥”；桥后敌军空锅温饭；帽子里的纸与名册第三页；冬生擦号；桥头支锅、名字要写正 |
| 草地 | g100–g156 | 掉队的人蹲下像系鞋带、两人架；灶王背锅“锅在人在”、飞毛腿背冬生、林先生空粮袋给冬生、给满崽抹药；三人缺席句；林先生担架木牌写不出名字、灶王撒黑灰、冬生短音；最后一点盐、锅巴给最小的、灶王“我不吃。你们走。”；飞毛腿扶灶王/背锅；冬生嘴唇裂、林先生解围巾；冬生长音、林先生包黑土、飞毛腿按帽子、灶王背锅 |
| 吴起 | w100–w119 | 灶王支锅“煮一顿干的”、锅底“灶”字；飞毛腿/满崽纸上名字（活/死两版）；灶王盛几碗放队前“碗边没有坐人”或借来的锅；林先生念五句话；冬生长音；陈班长籍贯、手心“满”字洗掉、门板磨的印；冬生抱号（号嘴牙印） |
| 空页 | c100–c104 | 飞毛腿帽中纸、灶王锅；冬生合名册、飞毛腿不催 |
| 坏结局 | b100 | 锅和号留在草地上（仅灶王、冬生都死时显示）；名册停在我划到的那一页 |

> 新增节点按数组位置播放，不按 id 数值排序；100–199 段已占用，后续扩写用 200–299 段。
