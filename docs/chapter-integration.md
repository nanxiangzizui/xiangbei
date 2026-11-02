# 章节接入（步骤五定稿）

> 本文件是七章节点表、结局快照、点名状态机、五卡、图鉴、章末记忆与调试/刷新的规格源。
> 代码实现见 `project/story.js` / `project/engine.js`；改结构先改本文件，再同步代码与 `check-build` C24–C30。

## 1. 七章表

| 顺序 | 章节 id | 前缀 | 节点 | line | choice | interact | minigame | result | title | codex | end | 下一章 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | prologue | p | 49 | 42 | 2 | 0 | 1 | 1 | 1 | 1 | 1 | xiangjiang |
| 2 | xiangjiang | x | 43 | 36 | 2 | 0 | 1 | 1 | 1 | 1 | 1 | zunyi |
| 3 | zunyi | z | 33 | 26 | 3 | 0 | 0 | 1 | 1 | 1 | 1 | jinsha |
| 4 | jinsha | j | 35 | 27 | 1 | 1 | 1 | 2 | 1 | 1 | 1 | luding |
| 5 | luding | l | 36 | 29 | 2 | 0 | 1 | 1 | 1 | 1 | 1 | grass |
| 6 | grass | g | 32 | 27 | 2 | 0 | 0 | 0 | 1 | 1 | 1 | wuqi |
| 7 | wuqi | w | 49 | 45 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | ending |
| — | 合计 | — | **277** | **232** | **13** | **2** | **4** | **6** | **6** | **7** | **7** | — |

- 七章全部 `playable: true`；序章 p900 → 湘江 x001，逐章直落，不要求玩家回地图。
- 终章 w900 的 `next` 是字符串 `"ending"`，不是章节 id；`finishChapter` 在这里写 ending 快照并切 `scene:"ending"`。
- 章节背景：于都 `yudu_river/yudu_night`；湘江 `xiangjiang_ford/xiangjiang_dawn`；遵义 `zunyi_hall/zunyi_street`；金沙江 `jinsha_river/jinsha_night`；泸定 `luding_bridge/luding_after`；草地 `grass_marsh/grass_dawn`；吴起 `wuqi_dawn/wuqi_wall`。ending 背景用 `wuqi_wall`。

## 2. 节点 id 规则

- 章前缀：`prologue=p`、`xiangjiang=x`、`zunyi=z`、`jinsha=j`、`luding=l`、`grass=g`、`wuqi=w`。
- 顺序号 `001–899`；分支正文用主序号加 `a`/`b`（如 `p039a`/`p039b`、`x025a`/`x025b`），同一位置两条互斥节点各带 `when`。
- `900` 保留给章末 `end`；`p900`→`xiangjiang`、`x900`→`zunyi`、`z900`→`jinsha`、`j900`→`luding`、`l900`→`grass`、`g900`→`wuqi`、`w900`→`ending`。
- 章节节点是按序扁平数组，不用树/栈；条件分支只靠节点 `when` 过滤，运行期永远从当前下标往后找第一个可见节点。
- `p001–p044` 的 id 已冻结；条件行只允许新增 `a/b` 节点，不重排。
- 七章 id 全局唯一；存档只存节点 id，不存数组下标。

## 3. ending 快照

`finishChapter` 在 w900 一次性 `buildEnding(state)` 并落档；重进只读快照，不重算五卡。

```json
{
  "stats": { "companyStart": 104, "companyEnd": 19, "redStart": 86000, "redEnd": 7000 },
  "names": [
    { "id": "he", "name": "何指导员", "status": "remote" },
    { "id": "ximei", "name": "细妹", "status": "self" },
    { "id": "lin", "name": "林先生", "status": "self" },
    { "id": "zhou", "name": "老周", "status": "missed" },
    { "id": "zaowang", "name": "灶王", "status": "missed" },
    { "id": "feimao", "name": "飞毛腿", "status": "missed" },
    { "id": "dongsheng", "name": "冬生", "status": "self" }
  ],
  "answered": 0,
  "missed": 3,
  "cards": [
    { "id": "ideal", "lit": true, "line": "最冷的那一夜，你还留着火。" }
  ]
}
```

- 实际 `cards` 固定 5 项：`ideal / sacrifice / truth / overall / people`；每项只有 `{id, lit, line}`。
- `names` 固定 7 项；`status` 只允许 `self / remote / player / missed`。`answered + missed` 在 0–3 之间（只统计“没人应”的三人）。
- `stats` 固定 4 个键：连队 104→19（虚构连队，非史科统计）；中央红军 86,000→7,000（史实）。
- 快照只允许上述 5 个顶层键；多键、缺 `cards` 或 `names`、`scene:"ending"` 但 `nodeId` 非 null，`normalize` 一律判 `issue:"ending"`，回地图而不是白屏。
- 实测大小：全答 1518B（其中快照 JSON 1338B），远低于 `MAX_SAVE_BYTES=4096`。

## 4. 点名状态机

- 节点：吴起 `w026`，`type:"interact"`、`mode:"rollcall"`、`duration:45`；7 人顺序固定为 `he / ximei / lin / zhou / zaowang / feimao / dongsheng`。
- 状态：`idle → announcing → waiting → answered/missed → next → done`。
- `announcing`：显示“念到 X”；`self`（细妹/林先生/冬生）与 `remote`（何指导员“在别的连答到”）700ms 自动过，不计入 `answered`。
- `waiting`：`absent`（老周/灶王/飞毛腿）有 4s 窗口；空格/Enter/点击 240×64「替他答到」写 `status:"player"`，`answered+1`。
- 4s 窗口耗尽或总 45s 到点：写 `missed`，`missed+1`，自动下一位；总时长到点后剩余全部按 `missed` 收束。
- 结束写 `state.ending = {names, answered, missed}`、`memory.rollcall_missed_any = missed > 0`，保存后推进到 w027a/b；不重开、不评分、不显示成功/失败。
- 暂停/页面隐藏冻结计时；刷新回 w026 开头重念；不保存点名中间态。
- 张老幺不在连队点名（他在金沙江记名交互里）。

## 5. 五张精神卡

五卡只在 `buildEnding` 计算一次；`line` 取 `litLine/unlitLine`，不显示亮卡数，全灰合法。

| id | 精神 | 亮起条件 | 亮句 | 灰句 |
|---|---|---|---|---|
| ideal | 理想信念 | `fire >= 20` | 最冷的那一夜，你还留着火。 | 火种，剩得不多了。 |
| sacrifice | 不怕牺牲 | `choice.xiangjiang.hold === true` | 你把最后一批人，留在了江东岸。 | 你按命令过了江。 |
| truth | 独立自主 | `choice.zunyi.admit >= 2` | 你在遵义，承认了自己走错的那一步。 | 错误卡上，你自己的那条最短。 |
| overall | 顾全大局 | `choice.jinsha.priority === "main"` | 主力先过江，你排到最后。 | 你先渡了最急的人。 |
| people | 依靠人民 | `trust >= 3 && memory.zhang === true` | 三十七个船工的名字，你记下了。 | 江边的名字，你没记下几个。 |

边界：`fire=19` 灰 / `20` 亮；`admit=1` 灰 / `2` 亮 / `3` 亮；`priority` 为 `wounded/kettle` 灰、`main` 亮；`trust=3` 且未记张老幺灰，`trust=2` 且记了也灰。

## 6. 史实图鉴

- 数据唯一源：`XB.story.codex` 七张（`yudu/xiangjiang/zunyi/jinsha/luding/grass/wuqi`），文案与 `docs/codex.md` 一致。
- 解锁：每章一个 `codex` 节点，关闭弹窗即写 `state.codex`；不新增存档键，`PERSIST_KEYS` 仍 11 项。
- 入口三处：标题菜单「史实图鉴」、暂停菜单「史实图鉴」、结局页「史实图鉴」。
- 全屏遮罩 `#codex-gallery`：标题、`n / 7` 计数、7 卡网格、关闭；锁卡虚线灰字「第 X 章解锁」，点击只 toast；开卡复用 `openCodex(id,{unlock:false})`，关闭回图鉴。
- 焦点：打开时焦点进关闭按钮，Esc 关闭并回触发按钮；Tab 在遮罩内循环。
- 关卡门文案按 `XB.story.codex` 下标映射：第 1 张「序章解锁」，第 2–7 张「第 1–6 章解锁」。

## 7. 章末记忆

| 完成章节 | 写入 | 时机 |
|---|---|---|
| xiangjiang | `memory.zhou = true` | `finishChapter` 先写，再切 zunyi |
| zunyi | `memory.he = true` | 同上 |
| luding | `memory.feimao = true` | 同上 |
| grass | `memory.zaowang = true` | 同上 |
| 进入 wuqi | `memory.ximei/dongsheng/lin = true` | 解锁并 `startChapter(wuqi)` 时 |
| 金沙江记名 | `memory.zhang = true` | namepick 选中张老幺 |
| 吴起门板 | `memory.door = true/false` | w013 A 留吴起 true；B 带回 false |

- 只置 true 的记忆不覆盖已有 true（重玩不回退）；`memory.luding_unknown`、`memory.door`、`memory.rollcall_missed_any` 都是 boolean，不写 0/1。
- 写入走 `setFlag` 白名单；剧本不得直接改 `flags` 对象。已 true 的 set 仍可被同名 false 覆盖（如 `memory.door`），这是刻意允许的“门板去向”分支。

## 8. 调试与刷新

- `?debug=1`：显示 scene/chapter/node/door/fire/load/choice/log/ending/save 字节。
- `?chapter=<id>&node=<id>`：直接落章节点，便于逐章测试；**不补章末记忆、不跳章末**，所以调试档的 `memory.*` 可能不全。
- `?minigame=door|abandon|boat|climb`：独立试玩小游戏，不写档；与 `?chapter` 同时出现时小游戏优先。
- `?reset=1`：清存档重开；坏档会被备份为 `.bad`/`.bak` 后回标题，不白屏。
- `?fonts=fallback`：字体回退开关（步骤二沿用）。
- 刷新：普通 vn 回当前节点；小游戏回入口节点重开；点名回 w026 开头；ending 读快照保持在结局；`scene:"ending"` 且快照不完整则判坏档回地图。
- 存档上限 4096B；11 个持久键（`version,scene,chapterId,nodeId,flags,inventory,choices,codex,settings,unlockedChapters,ending`），不新增 `card.*`。
