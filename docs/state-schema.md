# 《向北》存档与旗标（v1.1 · 步骤五）

> 唯一存档键：`xiangbei.save.v1`；所有读写 try/catch；旗标只增不改名，改名必须迁移。
> 旗标清单与 `docs/script/*.md` 的 `set:` 一一对应；新增旗标先进本文件再进剧本。
> 步骤五新增：`scene:"ending"`、ending 快照、`choice.zunyi.admit`、点名/图鉴/章末记忆；`PERSIST_KEYS` 仍是 11 键。

## 1. 存档 JSON（示例）

### 1.1 普通剧情节点

    {
      "version": 1,
      "scene": "vn",
      "chapterId": "jinsha",
      "nodeId": "j042",
      "flags": {
        "item.door": true,
        "item.pot": true,
        "load": 4,
        "trust": 2,
        "fire": 55,
        "lights_lost": 1,
        "memory.zhang": true,
        "memory.luding_unknown": false,
        "memory.door": false,
        "choice.prologue.door": true,
        "choice.prologue.lookback": false,
        "choice.xiangjiang.hold": true,
        "choice.xiangjiang.abandoned": ["xray", "press", "silver"],
        "choice.zunyi.admit": 1,
        "choice.zunyi.missed": 1,
        "choice.jinsha.priority": "main",
        "choice.jinsha.trips": 12,
        "choice.luding.door": false,
        "choice.luding.names": "B",
        "choice.grass.share": true,
        "choice.grass.pot": true,
        "choice.wuqi.door": false
      },
      "inventory": {
        "door": true,
        "items": ["roster", "pencil", "medicine", "pot"]
      },
      "choices": [
        { "chapter": "xiangjiang", "nodeId": "x008", "option": "C", "text": "把门板横在桥头挡一下", "timedOut": false }
      ],
      "codex": ["yudu", "xiangjiang"],
      "settings": {
        "textSpeed": 30,
        "textScale": 1,
        "volume": 0.6,
        "muted": false,
        "reducedMotion": false,
        "skipSeen": false
      },
      "unlockedChapters": ["prologue", "xiangjiang", "zunyi", "jinsha"],
      "ending": null
    }

### 1.2 结局场景

    {
      "version": 1,
      "scene": "ending",
      "chapterId": "wuqi",
      "nodeId": null,
      "flags": { "fire": 30, "trust": 3, "choice.zunyi.admit": 2 },
      "inventory": { "door": false, "items": ["roster", "pencil"] },
      "choices": [],
      "codex": ["yudu", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
      "settings": {},
      "unlockedChapters": ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
      "ending": {
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
          { "id": "ideal", "lit": true, "line": "最冷的那一夜，你还留着火。" },
          { "id": "sacrifice", "lit": false, "line": "你按命令过了江。" },
          { "id": "truth", "lit": true, "line": "你在遵义，承认了自己走错的那一步。" },
          { "id": "overall", "lit": false, "line": "你先渡了最急的人。" },
          { "id": "people", "lit": false, "line": "江边的名字，你没记下几个。" }
        ]
      }
    }

## 2. 默认值

| 字段 | 默认 | 说明 |
|---|---|---|
| version | 1 | 存档格式版本；步骤五不升版本 |
| scene | title | 当前场景：title/map/vn/ending（共 4 个）；小游戏、结算、图鉴都是 vn 的子视图，不单列 scene |
| chapterId | prologue | 当前章 id（prologue/xiangjiang/zunyi/jinsha/luding/grass/wuqi） |
| nodeId | null | 当前节点 id（字符串，如 "p010"）或 null；数字下标已废弃，见 §6 |
| flags | 默认 10 项 | 见 §3；缺省按 false/0 处理 |
| inventory.items | [] | 序章与湘江带过江的物品 id |
| choices | [] | 选择记录；错误卡与五卡文案从这里取 |
| codex | [] | 已解锁史实注 id |
| settings.textSpeed | 30 | 字/秒；10–60 |
| settings.textScale | 1 | 1 / 1.15 / 1.3；手机可调 |
| settings.volume | 0.6 | 0–1 |
| settings.muted | false | 静音 |
| settings.reducedMotion | false | 尊重系统 prefers-reduced-motion |
| settings.skipSeen | false | 跳过已读 |
| unlockedChapters | [prologue] | 已解锁章节 |
| ending | null | 结局快照；见 §4 |

- `scene:"ending"` 时 `chapterId` 必须是 `wuqi`、`nodeId` 必须是 null、`ending` 必须是完整快照，否则 `normalize` 判 `issue:"ending"`，回地图而不白屏。
- 非 ending 场景允许 `ending` 为 null 或半成品（点名先写 names/answered/missed，w900 再补 stats/cards）。

## 3. 旗标全表

### 3.1 默认十项（载入时补齐）

| 键 | 类型 | 默认 | 写入处 | 读取处 |
|---|---|---|---|---|
| item.door | boolean | false | 序章选项；湘江 C；弃物结算（留下时）；泸定 A；终章 | 湘江/泸定/草地/终章分支 |
| item.pot | boolean | false | 草地选项 | 草地分支；终章“背上的东西” |
| load | number | 0 | 序章 +2；湘江 +1；遵义 -1；泸定 +0；草地 +1；终章 +1 | 行囊/体力提示；不影响结局 |
| trust | number | 0 | 湘江 +1；金沙江 +1/-1；泸定 +1；草地 +1/-1 | 五卡·船工 |
| fire | number | 50 | 序章带门板 +10、回头 +5；湘江回头接应 +5、弃药箱 −15；金沙江先渡炊事班 +5；泸定结算 −5×min(lost,3)（最多 −15）；草地分粮 −15；clamp 0–100 | 五卡·火种（≥20） |
| lights_lost | number | 0 | 泸定攀索小游戏：每次点空/火墙失败 +1，结算时绝对赋值 | 泸定结算；五卡备注（不参与点亮判定） |
| choice.xiangjiang.abandoned | string[] | [] | 弃物小游戏结算（留下 id，≤7） | 湘江结算清单；终章回看 |
| choice.zunyi.missed | number | 0 | 遵义 A“漏记过名字” +1，上限 1 | 终章名册/回看 |
| choice.zunyi.admit | number | 0 | 遵义三个选项各 +1/+0，clamp 0–3 | 五卡·复盘（≥2） |
| choice.jinsha.trips | number | 0 | 渡船小游戏结算（0–18） | 金沙江结算；终章回看 |

### 3.2 剧情/记忆旗标（缺失按 false 或未选读）

| 键 | 类型 | 默认 | 写入处 | 读取处 |
|---|---|---|---|---|
| memory.zhou | boolean | false | 湘江结束后置 true | 终章点名 |
| memory.he | boolean | false | 遵义后置 true | 终章点名 |
| memory.ximei | boolean | false | 进入吴起前置 true | 终章点名 |
| memory.dongsheng | boolean | false | 进入吴起前置 true | 终章点名 |
| memory.lin | boolean | false | 进入吴起前置 true | 终章点名 |
| memory.zaowang | boolean | false | 草地结束后置 true | 终章点名 |
| memory.feimao | boolean | false | 泸定结束后置 true | 终章点名 |
| memory.zhang | boolean | false | 金沙江记名交互（选中张老幺） | 五卡·船工；图鉴回看 |
| memory.luding_unknown | boolean | false | 泸定选项 B=true / A=false | 终章名册最后一页 |
| memory.door | boolean | false | 终章“留在吴起” true / “带回” false | 终章尾声文案 |
| memory.rollcall_missed_any | boolean | false | 点名结束 `missed > 0` | 终章 w027 分支 |
| choice.prologue.door | boolean | false | 序章选项 A | 序章分支 |
| choice.prologue.lookback | boolean | false | 序章选项 A/B | 序章分支 |
| choice.xiangjiang.hold | boolean | false | 湘江选项 A/C | 五卡·断后；湘江分支 |
| choice.zunyi.admit | number | 0 | 遵义累计，见 3.1 | 五卡·复盘 |
| choice.jinsha.priority | string | 未选 | 金沙江选项: main/wounded/kettle | 五卡·先渡（=main）；未选灰 |
| choice.luding.door | boolean | false | 泸定 A=false（铺桥）/ B=true（抱着） | 泸定分支；五卡备注 |
| choice.luding.names | string | 未选 | 泸定 A="A"（记数字）/ B="B"（留白） | 名册留白页 |
| choice.grass.share | boolean | false | 草地 A=true（给伤员）/ B=false | 结算文案 |
| choice.grass.pot | boolean | false | 草地 A=true（背走）/ B=false | 草地分支 |
| choice.wuqi.door | boolean | false | 终章 A=false（留吴起）/ B=true（带回） | 终章分支；结尾文案 |

**规则**

- 读取时按默认值深合并：顶层键缺失取默认值，`settings` 逐键合并（不能用 `Object.assign` 浅合并，否则旧档会整块覆盖新默认键）；缺字段不报错、不崩。
- 旗标在 JSON 里是**扁平的带点键**（`flags["item.door"]`），不是嵌套对象；写读都走 `XB.core.setFlag(state, path, value)`，不要在别处拼键名。
- 载入时补齐十个默认旗标：`item.door=false`、`item.pot=false`、`load=0`、`trust=0`、`fire=50`、`lights_lost=0`、`choice.xiangjiang.abandoned=[]`、`choice.zunyi.missed=0`、`choice.zunyi.admit=0`、`choice.jinsha.trips=0`；其余 `memory.*` / `choice.*` 缺失按 false/未选读。
- **写入白名单**（`set:` 只能用这些键，越界在 check-build 与 smoke 里直接失败）：`item.door`、`item.pot`、`load`、`trust`、`fire`、`lights_lost`、`memory.*`、`choice.*`。`ending.*`、`card.*`、`unlockedChapters` 只由引擎写；`choice.xiangjiang.abandoned` 这个 list flag 也只由引擎写。
- `inventory.door` 是 `flags["item.door"]` 的**镜像**：`setFlag` 写 `item.door` 时同步，载入时以 `flags` 为准重算；两处不一致视为坏档。弃物关只有在门板被留下时才由引擎写 `item.door=false`；门板上船则保持 true。
- `inventory.items` 合法 id 只有 `roster`、`pencil`、`medicine`、`barley`、`pot`、`raincloth`、`shoes`；门板单独存 `inventory.door`。弃物的 xray/press/files/medkit/radio/silver 只进 `choice.xiangjiang.abandoned`，不进 inventory.items。
- `choice.xiangjiang.abandoned` 只允许 `door`、`xray`、`press`、`files`、`medkit`、`radio`、`silver`；去重、最多 7 个、丢弃未知 id；排序固定 xray,press,files,medkit,radio,silver,door。**只开这一个 list flag**，不做通用数组。
- `choice.jinsha.trips` clamp 0–18；`choice.zunyi.missed` clamp 0–1；`choice.zunyi.admit` clamp 0–3；`lights_lost` clamp 0–22。
- 选项日志 `choices[]` 每条固定五个字段：`{chapter, nodeId, option, text, timedOut}`；`option` 是 A/B/C，`text` 是当时的选项文案（供遵义错误卡引用），`timedOut` 为布尔。只保留最近 64 条。遵义三条 choice 不写 record，靠 `set` 累计，日志仍逐条记录。
- 旗标只增不改名；改名必须写迁移函数（见 §6）。
- 不在 flags 里存大段文本；文本进 `story.js`。
- 时间/随机数不进存档；重开小游戏用固定种子（`seed: chapterId`）。
- 人物显示名从 `story.js` 取，存档只存 id。
- `trust` 与 `fire` 的上下限：0–6 / 0–100，写入时 clamp；`load` 取整且 ≥0。
- `codex` 只保留 `story.codex` 里已知的 id，其余丢弃（防止旧档塞进未知项）。

## 4. ending 快照

- 形状：`{stats, names, answered, missed, cards}`；只允许这 5 个顶层键。
- `stats` 固定 4 键：`companyStart=104`、`companyEnd=19`、`redStart=86000`、`redEnd=7000`。
- `names` 固定 7 项：`he/ximei/lin/zhou/zaowang/feimao/dongsheng`；每条 `{id,name,status}`，status 只允许 `self/remote/player/missed`。
- `answered`、`missed` 都是 0–3 的整数；只统计老周/灶王/飞毛腿三人的替答与漏答。
- `cards` 固定 5 项，id 固定 `ideal/sacrifice/truth/overall/people`；每项只有 `{id, lit, line}`，不存额外文案。
- 快照由 `buildEnding(state)` 在 w900 一次写入；`normalize` 对多键、缺键、未知 status 直接判 `issue:"ending"`；不写 `card.*`。
- 实测全答快照 JSON 1338B，整档 1518B，低于 4096B。

## 5. 保存点与体积

- **每个 line beat 推进即保存**：一次推进 = 一次 `xiangbei.save.v1` 写入；单次序列化目标 <4KB，4096 字节是上限（超限视为 schema 设计错误：不写、控制台报错、提示“存档异常”）。
- 刷新/关闭恢复到当前 beat，不回退到关卡开头。
- 保存点：进入新章、每个选项结算（含超时）、小游戏结算应用后（不保存小游戏中间态）、记名/点名交互结束、设置变更、结局生成、标题卡关闭、史实注关闭（同时写入 `codex`）、结算面板继续。
- 点名中间态**不写档**：刷新回 w026 开头重念；ending 快照在点名结束时先写 names/answered/missed，w900 再补 stats/cards。
- `paused`（暂停）、打字机进度、`seenNodes`（跳过已读）是运行时状态：**不写存档**，刷新后回到节点开头。
- 存档失败（隐私模式/配额满/`file://` 受限）只提示“本次无法保存”，不白屏、不中断游戏。

## 6. 迁移

- **v1 内部修订（2026-11）**：`nodeId` 由数字数组下标改为字符串节点 id（如 `"p010"`，规则见 `docs/script/README.md` §7），新增 `scene` 字段。v1 从未发布、没有真实玩家存档，因此**不升 version**，仍为 1。
- 步骤五在 v1 内新增 `scene:"ending"`、`ending` 快照与 `choice.zunyi.admit` 默认项；仍不升 version，旧开发档缺字段按默认补齐。
- 读到数字 `nodeId` 的旧开发存档：备份为 `xiangbei.save.v1.bad` 后重置默认存档，提示“存档与当前版本不匹配，已重置”。
- 读取到更高版本：备份为 `xiangbei.save.v1.bak`，提示“存档来自更新版本，已备份”，允许重置。
- 解析失败或结构校验不通过（未知 scene、未知 chapter、找不到 nodeId、ending 不完整）：统一备份 `.bad`，重置默认存档；不静默丢弃，不白屏。
- 迁移函数集中在一个 `migrate(save)`；每步只加字段，不删字段。

## 7. 调试

- `?debug=1`：右上角显示 scene/chapterId/nodeId/flags 摘要/ending/save 字节；不显示在正式版。
- `?reset=1`：清空存档并回标题。
- `?chapter=<id>&node=<id>`：直接落到七章任一节点；**不补章末记忆、不跳章末**，用于逐章测试。
- `?minigame=door|abandon|boat|climb`：单独试玩；不写档、不推进剧情；与 `?chapter` 同时出现时优先小游戏。
- `?trust=0..6`、`?door=0/1`、`?fire=0..100`、`?lights=0..22`：调试起点；不提供 `?duration=` 覆盖。
- 调试结果页的“再玩一次/回标题”只在 solo 出现；序章 p025 只有“继续”。
- 调试参数在正式版保留但隐藏；不写进 UI。

## 8. 与故事圣经的对应

- 五卡触发见 `docs/story-bible.md` §5：`fire ≥ 20`、`choice.xiangjiang.hold`、`choice.zunyi.admit ≥ 2`、`choice.jinsha.priority == "main"`、`trust ≥ 3 且 memory.zhang`。
- `lights_lost` 只做泸定结算与五卡备注，不参与卡点亮；遵义“漏记名字”用 `choice.zunyi.missed`，不再写 lights_lost。
- `ending.cards` 是数组，每项 `{id, lit, line}`，顺序固定 `ideal,sacrifice,truth,overall,people`；不写 `card.*`。
- 7 张史实注 id：yudu、xiangjiang、zunyi、jinsha、luding、grass、wuqi。
- 人物 flag：memory.zhou、memory.he、memory.ximei、memory.dongsheng、memory.zaowang、memory.feimao、memory.lin、memory.zhang、memory.door、memory.luding_unknown、memory.rollcall_missed_any。
