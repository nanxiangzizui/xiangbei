# 《向北》存档与旗标（v1.6 · 存档列表，v1.6.0-dev）

> 存档键：`xiangbei.saves.v1`（列表，一档一槽，见 §10）；单档仍是 v2 形状（`SAVE_VERSION=2`），逐槽走同一套 `normalize`。旧键 `xiangbei.save.v2` / `xiangbei.save.v1` 只读，首次启动（列表不存在时）迁移成第 1 档并删旧键；`?reset=1` 只清存档与回顾，初始化才清分支/成就/名册（§10.4）。剧情回顾另存 `xiangbei.history.v1`（§11），不占单档 11 键。
> 所有 `localStorage` 读写 try/catch；不可用时提示“本局无法存档”，不白屏。
> 旗标清单与 `docs/script/*.md` 的 `set:` 一一对应；新增旗标先进本文件再进剧本。
> v1.3.0-dev 的 34 旗标/四路线/3 格行囊已由 v1.4 取代；旧档迁移见 §8，旧字段 `strain` 只作兼容。

## 1. 存档 JSON（示例）

### 1.1 普通剧情节点

    {
      "version": 2,
      "scene": "vn",
      "chapterId": "grass",
      "nodeId": "g027a",
      "flags": {
        "item.door": true,
        "item.medicine": false,
        "item.barley": false,
        "item.homepot": false,
        "item.raincloth": false,
        "item.shoes": true,
        "load": 4,
        "trust": 2,
        "fire": 42,
        "condition": 2,
        "rescues": 2,
        "help.used": false,
        "memory.help": false,
        "had.door": true,
        "doorOutcome": "carried",
        "fate.feimao.dead": false,
        "fate.zaowang.dead": true,
        "fate.dongsheng.dead": false,
        "fate.player.dead": false,
        "fate.lin.dead": false,
        "quality.feimao": 2,
        "quality.zaowang": 0,
        "quality.dongsheng": 3,
        "inventory.giftBarley": true,
        "grass.settled": true,
        "strain": 1,
        "strain.dying": false
      },
      "inventory": {
        "door": true,
        "items": ["roster", "pencil", "shoes"],
        "giftBarley": true
      },
      "choices": [],
      "codex": [],
      "settings": {},
      "unlockedChapters": ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass"],
      "ending": null
    }

`load` 是 `packUsage()` 的缓存（半格单位），不是玩家可写的负重；`items` 只存唯一 id，门板单列 `inventory.door`（由 `doorOutcome` 派生，见 §3.5）。

### 1.2 结局场景

    {
      "version": 2,
      "scene": "ending",
      "chapterId": "coda",
      "nodeId": null,
      "flags": {
        "condition": 0,
        "rescues": 3,
        "had.door": true,
        "doorOutcome": "others",
        "fate.player.dead": true,
        "fate.seven5": true,
        "fate.lin.dead": true,
        "quality.feimao": 3,
        "quality.zaowang": 3,
        "quality.dongsheng": 3
      },
      "inventory": { "door": false, "items": ["roster", "pencil"], "giftBarley": false },
      "choices": [],
      "codex": ["yudu", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
      "settings": {},
      "unlockedChapters": ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
      "ending": {
        "stats": { "companyStart": 104, "companyEnd": 18, "redStart": 86000, "redEnd": 7000 },
        "names": ["何指导员", "细妹", "林先生", "老周", "灶王", "飞毛腿", "冬生", "满崽"],
        "answered": 5,
        "missed": 3,
        "cards": [],
        "route": "door_others",
        "routeIndex": 5,
        "routeLabel": "5",
        "routeTitle": "空页",
        "routeLede": "名册上多了一个名字，又划掉了。",
        "fate": { "feimao": "alive", "zaowang": "alive", "dongsheng": "alive", "lin": "dead", "player": "dead" },
        "condition": 0,
        "rescues": 3,
        "doorOutcome": "others",
        "strain": 0,
        "recorded": true,
        "achievements": ["p021-A", "p024-medicine", "j018-done", "l019-bridge", "g026x-A", "w013-A"]
      }
    }

## 2. 顶层键与默认值

顶层固定 11 键：`version/scene/chapterId/nodeId/flags/inventory/choices/codex/settings/unlockedChapters/ending`。

- `version` 必须是 2；`save.version < 2` 视为旧档，迁移后写 v2。
- `scene`：title/map/vn/ending；多选、结算、物资面板、图鉴都是 vn 的子视图。
- `chapterId`：八章 + 两个隐藏章 coda/badend；旧档未知章判坏档。
- `nodeId`：当前节点 id（字符串，例 `"nodeId": "j012"`）；ending 必须为 null。载入后必须能在该章节点表里定位，否则判 `issue:"node"`。
- `flags`：49 项（§3）；缺失补默认、数值夹取；`had.door` / `item.door` 是 `doorOutcome` 的派生值，读档与 `setFlag` 后由 `syncDerivedFlags` 重算。
- `inventory`：`{door, items, giftBarley}`；items 合法 id 只有 roster/pencil/medicine/barley/pot/raincloth/shoes。
- `choices`：选择日志，最多 64 条；限时项超时按默认项结算并记 `timedOut: true`；结局落档前清空，避免 4096B。
- `codex`：7 个已知 id，过滤去重。
- `settings`：音量/静音/字号/动效/跳过；不参与路线。
- `unlockedChapters`：地图解锁章；coda/badend 不进地图。
- `ending`：null 或快照（§5）；ending 场景必须完整。

## 3. 旗标全表（49 项）

### 3.1 基础 25 项（v1.2 基线）

- 物资布尔：`item.pot/medicine/barley/homepot/raincloth/shoes`（6）；`item.door` 不在剧情白名单里，由 `doorOutcome` 派生。
- 数值：`load` 0–99、`trust` 0–6、`fire` 0–100、`lights_lost` 0–22（4）。
- 湘江：`choice.xiangjiang.abandoned`（list，只由弃物多选写）+ `take.xray/press/files/medkit/radio/silver`（7）。
- 遵义：`choice.zunyi.missed` 0–1、`choice.zunyi.admit` 0–3（2）。
- 金沙江：`choice.jinsha.trips` 0–18（旧档保留）、`main/wounded/kettle`（4）。
- 泸定：`choice.luding.door`（1）。

### 3.2 v1.3 人物命运 9 项

| 键 | 默认 | 写点 | 用途 |
|---|---|---|---|
| `had.door` | false | `syncDerivedFlags`（原 p021 A/B） | 是否带过门板；`doorOutcome !== "none"`，决定 `doorCarried` 与带板结局 |
| `fate.feimao.dead` | false | l019/l019x | 飞毛腿生死 |
| `fate.zaowang.dead` | false | g018x | 灶王生死 |
| `fate.dongsheng.dead` | false | g026x | 冬生生死 |
| `fate.lin.dead` | false | 派生 | 林先生只在我死时死 |
| `fate.all.dead` | false | 派生 | 三个危机全死，供吴起 `w027b/w027c` 互斥 |
| `strain` | 0 | 派生 | 仅兼容：`3 - rescues` |
| `strain.hurt` | false | 派生 | 仅兼容：`rescues >= 2` |
| `strain.dying` | false | 派生 | 仅兼容：`fate.player.dead` |

### 3.3 v1.4 状态/物资 14 项

| 键 | 默认 | 写点 | 用途 |
|---|---|---|---|
| `condition` | 3 | 引擎 | 状态 0–4；救人惩罚、草地 `-1`、物资恢复、三人帮助 |
| `rescues` | 0 | l019/l019x、g018x、g026x | 成功救人数 0–3；每 +1 由 `rescuePenalty` 扣状态 |
| `help.used` | false | `setFlag`（第三人）/`settleGrass` | 三人帮助只用一次 |
| `memory.help` | false | `setFlag`（第三人）/`settleGrass` | 无板路线 `g028h` 的三人援助文本 |
| `memory.help_door` | false | `setFlag`（第三人） | 有板路线当场援助，供 `g026h–g026m` 文本 |
| `fate.player.dead` | false | 引擎 | 我是否死在草地；`condition=0` 或差状态未恢复 |
| `fate.seven5` | false | `syncDerivedFlags` | 7(5)：`player.dead && had.door && rescues===3 && (doorOutcome==="others" 或门板仍在身上)`；桥板/吴起板不算 |
| `fate.badend` | false | `syncDerivedFlags` | 坏结局：`player.dead && !fate.seven5` |
| `grass.settled` | false | `settleGrass` | 草地结算幂等，刷新不重复扣状态 |
| `quality.feimao` | 3 | l001、l019/l019x | 飞毛腿状态：3 良好/2 勉强/1 差/0 牺牲；泸定入场统一 2，危机节点置 1，用药 2、铺桥 3 |
| `quality.zaowang` | 3 | l001、g018x | 灶王状态：3 良好/2 勉强/1 差/0 牺牲；泸定入场统一 2，危机节点置 1，青稞 2、铁锅 3 |
| `quality.dongsheng` | 3 | l001、g026x | 冬生状态：3 良好/2 勉强/1 差/0 牺牲；泸定入场统一 2，危机节点置 1，鞋或雨布 3 |
| `doorOutcome` | "none" | 剧情/引擎（唯一权威） | none/carried/bridge/grass/wuqi/others；bridge = 湘江 x025a C 或泸定 l019 A，留在桥上；剧情只写这一项 |
| `inventory.giftBarley` | false | g026x A/B | 冬生赠青稞，不占格；与普通青稞/药组合 |

### 3.4 v1.5.1 成就 1 项

| 键 | 默认 | 写点 | 用途 |
|---|---|---|---|
| `memory.namepick_done` | false | `pickName` / `skipNamepick` | 金沙江记名已发生；与 `memory.zhang` 一起区分 j018 done/skip |

### 3.5 派生与白名单

- `DERIVED_FLAGS = [had.door, item.door, fate.lin.dead, fate.all.dead, fate.seven5, fate.badend, strain.hurt, strain.dying]`；只由 `syncDerivedFlags` 写。
- `condition` 由 `rescuePenalty`、`usePackItems`、`settleGrass`、三人帮助写；`help.used/memory.help` 由 `setFlag`（有板第三人）或 `settleGrass`（无板差状态）写，有板同时写 `memory.help_door`；`fate.player.dead` 由 `settleGrass/resolveGrassWarning` 写。
- 剧本 `set` 只写：`item.pot/medicine/barley/homepot/raincloth/shoes`、`load`、`trust`、`fire`、`lights_lost`、`rescues`、`quality.*`、三个危机 `fate.*.dead`、`doorOutcome`、`memory.*`、`choice.*`、`inventory.giftBarley`。`had.door` / `item.door` 不可由剧情写，`setFlag` 会拒绝。
- `ending.*`、`card.*`、`unlockedChapters` 只由引擎写；`choice.xiangjiang.abandoned` 只由弃物多选写。
- `syncDerivedFlags` 由 `doorOutcome` 统一派生：`had.door = outcome !== "none"`、`item.door = outcome === "carried"`、`inventory.door = item.door`；旧档迁移是唯一从旧 `item.door/had.door/memory.door/choice.*` 反推 `doorOutcome` 的地方（§8）。`inventory.giftBarley` 写入时同步 flag。
- `memory.luding_status` 是泸定入场一次性标记，不进 `FLAG_DEFAULTS`；第一次到 `l001` 把未死三人 `quality.*` 置 2 并落档，刷新不重复。
- 节点可带 `status`（如 `{"quality.feimao":1}`）与 `statusReason`，选项也可带 `statusReason`；引擎在节点进入时写 `status` 并落档（choice 在选项出现前，line 在本句显示前）。只把 `condition/quality.*` 的真实变化写进内存队列 `statusEvents`（最多 32 条），弹窗读完即丢弃，原因不进存档。
- `statusOnce` 是节点状态的一次性标记（如 g008b 的 `memory.grass_mutual`）：首次进入写 `status` 并落标记，刷新同一节点不再重复加状态。草地 g008 A 只扣青稞、trust+1；到 g008b 药膏/绷带回赠时才 `condition+1`，提示原因“你与他人互相救助”。
- 五个行囊旗标 `item.medicine/barley/homepot/raincloth/shoes` 写入时同步 `inventory.items`：false 移除、true 补回。物资面板、可用配方、半格计数都读清单，只写旗标会让“药已经喂了、面板里还挂着一包”。
- `normalize` 修旧残档：保存的 `flags` 里明确写过 `item.* = false` 的，读档时把对应物品从 `inventory.items` 移除；没写过的键不动（v1.3 旧行囊仍由 `backfillLegacyFlags` 从清单反推）。
- 湘江 `x025a/x025b` 的 A 用 `setIf` 做条件代价：按选择前的 `item.barley` 判定，带了才写 `item.barley=false` 并记 `memory.xiangjiang.barley_lost`，没带只记 `memory.xiangjiang.binding_lost`；两条互斥，不进 `FLAG_DEFAULTS`，只供 `x025c/x025d` 旁白。
- `strain` 仍可被旧剧本读，但新剧本不写；`normalize` 会按 `3-rescues` 重算。

## 4. 物资与状态

### 4.1 行囊

- 清单 id 固定 `roster/pencil/medicine/barley/pot/raincloth/shoes`；铁锅清单写 `pot`，旗标写 `item.homepot`，面板与配方也读 `pot`，不要混用。
- 4 格 = 8 个半格单位：药/青稞 1、布鞋 2、铁锅/雨布/门板 4。
- `packUsage = 门板 4 + Σ items 单位`；`packCapacity = max(8, usage)`，旧档超重不裁剪、显示兜底。
- p024 五件每件一件，按总单位 ≤8 校验；带门板时药+青稞+门板=4 格，锅+门板=4 格，锅+鞋+药+青稞=4 格；五件不可全选。
- 门板在物资栏禁用，剧情可铺桥/挡桥/床板/写字；雨布只在草地可用；限时选项期间禁止开物资栏。
- 冬生赠青稞不占格，只能与普通青稞或药组合使用，用完即消失。

### 4.2 状态

- 0/1/2/3/4 = 0/差/勉强/良好/优秀；初始 3（良好）；只显示文字，不显示百分比。
- `rescuePenalty(rescues, hasDoor)`：≤1 → 0；2 → 1；3 → 有板 2 / 无板 1。每救一人用差值扣 `condition`。
- 救满第三人：有门板当场 `condition+1`（差→勉强）并写 `help.used/memory.help/memory.help_door`；无门板在草地结算跌到差时再帮一次（回勉强）。
- 草地结束 `settleGrass`：`condition-1`；救满 3 且 `condition===1` 且未用过帮助 → `condition=2` + `help.used/memory.help`；`condition===0` → `fate.player.dead`。
- 差（1）：草地结算弹 `#danger-modal`（文案“当前你的状态已不足以支撑继续行进，请立刻补充物资恢复体力。”）；“同意”开物资栏，“拒绝”或不用物资 → `resolveGrassWarning` 判死。0：直接判死，不开窗；5/11 由 `settleDoor` 收口。
- 判定顺序：初始 3 → 救人惩罚 → 草地 -1 → 三人帮助 → 差/0 → 门板/结局。
- 三主角 `quality.*`：初始 3（良好）；泸定 `l001` 统一 2（勉强）；`l019/g018x/g026x` 出现时置 1（差）；救起后 2（勉强）或 3（良好）；死亡 0，不再显示“状态变为牺牲/倒下”。
- 状态变化在画面顶部居中弹只读提示（最多三行，约 6s + 每多一行 0.7s）：玩家写“由于……，你的状态变为xx”，同伴写“由于……，飞毛腿/灶王/冬生的状态变为xx”；0 时同伴写“由于……，飞毛腿牺牲了。”，玩家写“由于……，你牺牲了。”；标题卡/物资/差警告/门板打开时排队，不打断当前操作。

## 5. ending 快照

固定 17 键（16 个既有键 + 可选的 `achievements`）：`stats/names/answered/missed/cards/route/routeIndex/routeLabel/routeTitle/routeLede/fate/condition/rescues/doorOutcome/strain/recorded/achievements`。

- `stats` 固定 4 键，`companyEnd` 在 stats 内：普通 19；5/11、11/11 为 18。
- `names` 只允许 0/7/8 项：坏结局 0，普通 7，空页 8；条目 `{id,name,status,answeredBy?}`；status 为 self/remote/player/missed；满崽 absent + answeredBy=dongsheng。
- `answered/missed` 0–8；坏结局都是 0。
- `cards` 固定 5 张：ideal/sacrifice/truth/overall/people；sacrifice 在 `player.dead` 或湘江 hold 时亮，死亡时用 `kongyeSacrificeLine`。
- `route` 11 个新路线 + legacy；`routeIndex` 0–11（legacy=0，1/11=1 … 11/11=11）；`routeLabel` 为 1…11 / 旧档，界面显示“结局N/11”。
- `fate` 固定 5 键：feimao/zaowang/dongsheng/lin/player，值 dead/alive；`lin` 与 `player` 同生共死。
- `recorded` 防同一局重复写 `xiangbei.roster.v1`。
- `achievements` 可选，本局词条 id 数组（最多 48，去重，按选择发生顺序 + j018）；旧档没有该键仍可载入，结局页显示“旧档未记录本局成就”；不参与路线判定。
- 快照在 wuqi w900 或 coda c012 / badend b006 由 `buildEnding` 写；旧快照缺 route 补 legacy，不重算。

### 5.1 11 路线判定（`routeOf`）

先算 `rescues`、`had.door`、`fate.player.dead`：

1. 死：`had.door && doorOutcome==="others"` → 5/11 `door_others`；否则 11/11 `bad_end`（桥板/吴起板不算 5/11）。
2. 无板：按 rescues 0/1/2/3 → 6/11–9/11；rescues=3 且 condition=4 → 10/11。
3. 有板：`carried = doorOutcome ∈ {carried,wuqi,others}`；rescues≤1 → carried && condition=4 ? 1/11 : 2/11；rescues≥2 → carried ? 3/11 : 4/11。
4. 2/11、4/11 且 `doorOutcome==="bridge"`（湘江 C 或泸定 A）显示“桥板/门板留在桥上”，否则“门板/门板留在草地”。

## 6. 名册回廊

- 键：`xiangbei.roster.v1`，与主存档独立，清档不清名册。
- 形状：`{version:1, pages:[{route,title,at,companyEnd,names,note}]}`；每页 0/7/8 行；最多 8 页，丢最旧。
- `route` 允许 11 新路线 + v1.3 的 sidao/menban/qiaoban/kongye（旧页保留），拒绝 legacy。
- 结局 `recordEndingPage` 在 `renderEnding` 首次执行时写；`ending.recorded` 防重。
- 写失败提示“本机无法保存名册，本局仍可继续”，不影响结局页。

### 6.1 剧情分支收纳

- 键：xiangbei.branches.v1，与主存档、名册独立；清主档不清分支。
- 形状：{version:1,updatedAt,runs:[…],endings:{route:{at,runId,count}},chapters:{id:{at,runId}},options:{nodeId:{key:{at,runId}}}}；runs 最多 20 条，其余三个集合不因清主档清掉。
- 结算写入：finishChapter 在 state.ending=buildEnding(state) 之后、state.choices=[] 之前调用 recordBranchRun(state.ending)；只读，不改主档 11 键或 ending 16 键。
- 坏 JSON/版本不符：备份为 xiangbei.branches.v1.bad 后回空；写失败用内存态继续并 toast「本机无法保存剧情分支，本次回看只在本次有效」。
- 只收 11 条正式路线；legacy 与旧路线不写入收纳。options 的多选以每个被选项记录，互动节点不写 options。
- 失败降级不白屏；分支收纳不参与路线判定、不提前解锁剧情、不做百分比。

### 6.2 成就档

- 键：`xiangbei.achievements.v1`，与主存档、名册、分支独立；清主档不清成就。
- 形状：`{version:1, updatedAt, unlocked:{id:{at,timedOut}}}`；只收 48 个已知 id，未知丢弃；`at` 首次解锁 epoch ms，`timedOut` 只记首次。
- 即时解锁：单选提交、`applyMultiChoice` 成功后逐项、j018 pick/skip 时各写一次；重复选择不覆盖首次时间。
- 结算兜底：`finishChapter` 在 `state.choices=[]` 前收集 `ending.achievements`，并把缺的 id 补写进成就档。
- 坏 JSON 备份 `xiangbei.achievements.v1.bad` 后回空；写失败保留内存态并 toast“本机无法保存成就”；不白屏、不参与路线判定、不做奖励。

## 7. 保存点与体积

- 只有章末、结局完成、手动「保存」与开新档落档；逐句推进、多选/物资/结算/点名中间态与回标题都不写。
- 非结局章末保存成功后，屏幕上方 `#autosave-notice` 显示 3.5 秒“已自动存档”；结局保存不显示，避免盖住结局页。提示只在本局显示，刷新不重放。
- v1.5 及以前每 beat 存档；v1.6 起取消 beat 存档，避免中途退出读到半个章节，读档统一回到本章开头（手动保存除外）。
- 结局落档前清空 `choices`：v1.3 实测完整日志 4267B > 4096B；清空后正常。
- 存档 >4096B 仍按坏档处理；名册、分支、成就收纳独立键不占主档预算。
- `ending.achievements` 最多 48 个短 id；结算清空 `choices` 后仍在 4096B 以内。重进已结算结局时 `choices` 已空，但 `flags.memory.zhang` 仍会产出 `j018-done`；`buildEnding` 必须把 `previous.achievements` 合并回来，否则快照从 22 条掉成 1 条。

## 8. 迁移（v1.3 → v1.4）

1. 读 v2；不存在/解析失败才读 v1；v1 迁移后写 v2，保留 v1。
2. 所有旧档先补 `doorOutcome`（仅当它为 `none`）：旧 `item.door===true`→carried；`memory.door`→wuqi；`choice.luding.door`→bridge；`choices` 里 x025a C→bridge；有 `item.door` 键但为 false（v1.4 早期湘江 C）→bridge；其余带过板（`had.door/item.door/choice.prologue.door/choice.luding.door`）→grass；从未带板→none。随后 `had.door = outcome !== "none"`、`item.door = outcome === "carried"`，不再单独补副本。
3. 旧 `strain` 当“救过几人”：`rescues = clamp(strain,0,3)`；`condition = 3 - rescuePenalty(rescues, had.door)`；已过草地 `g027` 再 -1。
4. `fate.player.dead`：旧 `strain.dying`、章 `coda` 或旧快照 `route==="kongye"`；同时 `condition=0`（仅 coda/kongye）。
5. 吴起旧档：飞毛腿/灶王 dead、冬生活、`strain=1`；泸定 `l022` 后飞毛腿 dead、`strain=0`；草地 `g019` 后灶王 dead。
6. `quality.*`：死者 0，生者 2（旧档没有更细状态）。
7. 旧 5/11（`player.dead && rescues===3 && had.door`）→ `doorOutcome="others"`；`item.door` 由 sync 派生为 false。
8. 湘江 C 修复：已落 grass/others 的档只在 `choices` 仍有 `{nodeId:"x025a",option:"C"}` 时改 bridge（A 也写 hold=true，不能单看旗标）；该改写压过旧 5/11 的 others。已清空 choices 的结局快照不自动改。
9. 旧 ending 快照：缺 route 补 `legacy/旧档/""`，不重算；缺 routeIndex 补 0；fate 缺 player 按旧 route 补；保留 names/answered/missed/stats/cards。
10. 旧名册页保留；新页追加。
11. 旧 ending 快照没有 `achievements` 不补；结局页显示“旧档未记录本局成就”。旧档已有 `memory.zhang:true` 的，本局收集按 j018-done 处理；旧档 skip 不补记。

## 9. 调试与验收

- `?debug=1` 右上显示 scene/chapter/node/flags 摘要/ending/save 字节与档数/audio/peak。
- `?chapter=coda&node=c006`、`?chapter=badend&node=b006` 可直达；未知节点回地图。`?resume=1` 直接续最近未完结档（测试后门）；与 `?chapter=` 同用时保留 `activeId`，章末保存落回同一档。
- `?reset=1` 只清存档列表（不清分支/成就/名册）；初始化走标题“设置 → 危险操作 → 初始化游戏”并二次确认。
- 单测：`node project/tools/smoke.js`（49 旗标、pack 4/8、11 路线、迁移、分支 mapping、成就 48 条）；`check-build` 覆盖 C14/C18/C24/C26/C39/C40/C41/C42/C43/C44/C45/C46/C47/C48。
- 浏览器：`_pw-step14.js` 覆盖 48 条映射、标题/暂停/结局三入口、锁定不泄露、单选/多选/记名 pick/skip、结局快照与重进合并、844×390 标题与暂停；http 55/55、file:// 55/55、移动专项 11/11，0 console error / 0 failed request。
- 浏览器：`_pw-step11.js` 覆盖 11 结局、危机、物资面板、差警告、门板弹窗、旧档、刷新、移动、`file://`；`_pw-step12.js` 覆盖分支空态/暂停实时/结算落档/全部 11 路线/详情/键盘/缩放/坏档/隐私/移动。
- 实测：步骤十一 check-build 39/39、smoke 46/46、check-script 9 文件 OK；步骤十二 check-build 40/40、smoke 47/47；分支浏览器 98/98（http）、移动 24/24、file 19/19；证据 `docs/evidence/step-11/`、`docs/evidence/step-12/`。
- 步骤十五（v1.6）：`_pw-step15.js` 覆盖空态、开新档、逐句推进不落盘、设置不覆盖进度、手动保存精确回原句、章末覆盖并落下一章开头、刷新回标题、列表续玩、读档后推进/回标题不覆盖、已完结整页回顾、上次玩到、删除选中、初始化、跨档隔离、设置保留、旧档迁移、隐私降级、移动与 `file://`；http 88/88、迁移 8/8、隐私 4/4、移动 9/9、file:// 88/88，0 console error / 0 failed request；check-build 48/48（含步骤十六 C49）。证据 `docs/evidence/step-15/`。
- 步骤十六（v1.7）：`_pw-step16.js` 覆盖回顾入口、单选/多选/记名金色加粗、超时默认项、限时冻结、刷新与手动保存去重、不可选中/固定字号、坏档与隐私、Esc/Tab/X、移动与 `file://`；http 56/56、file 56/56、移动 11/11、隐私 5/5，合计 128/128，0 pageerror / 0 失败请求；check-build 48/48。证据 `docs/evidence/step-16/`。



## 10. 存档列表（v1.6，2026-11-08）

### 10.1 键与形状

- 键：`xiangbei.saves.v1`；全局只此一份。设置也从单档移到列表上，`slots[].state.settings` 仍由 `serialize` 写入（兼容旧快照），读取时以 `store.settings` 为准。
- 形状：

    { "version": 1, "activeId": "slot-...", "settings": { ...DEFAULT_SETTINGS },
      "slots": [ { "id": "slot-...", "createdAt": "ISO", "updatedAt": "ISO", "state": { ...v2 11 键 } } ] }

- `id`：`slot-` + `Date.now().toString(36)` + `-` + 5 位随机；`createdAt` 决定列表日期与倒序，`updatedAt` 只用于“上次玩到”和副行时间。
- 上限 `SAVE_SLOT_MAX=20` 档、整包 `MAX_SAVES_BYTES=512KB`、单档仍 `MAX_SAVE_BYTES=4096B`；超限 toast“存档空间已满，请先删除旧存档”，不写坏档。
- 坏列表 JSON / 结构不认识：备份 `xiangbei.saves.v1.bad` 后回空列表并 toast；单个坏槽在 `normalizeSlot` 里丢弃，不拖垮其它档。
- 已完结由 `isFullEnding(slot.state.ending)` 现算，不存冗余字段；列表主行“YYYY年MM月DD日的存档（已完结/未完结）”，副行未完结写“章名 · 上次保存 MM-DD HH:mm”，已完结写“结局 N/11 · 路线名 · 已完结”。

### 10.2 写入时机

- 只有章末（`finishChapter` 的下一章/地图/结局出口）、结局渲染、手动「保存」与开新档 `startNewGame` 调 `saveNow()`：有 `activeId` 就覆盖该槽（`slot.state`、`updatedAt`），没有才新建一槽并 `unshift`。
- 非结局章末走 `saveChapterProgress()`：`saveNow()` 成功后显示 3.5 秒“已自动存档”；结局出口仍只 `saveNow()`，不弹提示。
- 逐句推进、选项/多选提交、物资/状态变化、图鉴解锁、切场景、回标题、读档都不写槽。中途退出后，只能读到上一次章末或手动保存的位置；章末保存落在下一章开头。
- 手动保存写当前节点（含选项/多选/点名等节点），读档回到该节点；读档只改 `activeId`，不改 `updatedAt`，列表“上次保存”时间保持真实保存时间。
- 设置改动只写 `store.settings`（`saveSettingsOnly`），不覆盖任何槽的进度与保存时间。
- 读档时 `resumeSceneFor` 按 `ending → vn → map` 还原落点。

### 10.3 界面与只读回顾

- 标题菜单主入口是“开始 / 继续”（`data-action="saves"`，整行），打开 `#saves-panel`（z=`--z-saves` 83）三段：列表、删除栏、提示；其余四项为图鉴/名册/分支/成就，右上另有“设置”。开启新档/上次玩到/删除存档三个按钮各 84 高。
- 删除模式：行变 `role=checkbox`、`aria-checked`；选中 `background:var(--ink)` + 纸白字 + 左 6px 朱砂条 + 右侧 `✓`；确认后二次弹窗“确定要删除这些存档吗？”。
- 二次确认统一用 `#save-confirm`（z=`--z-save-confirm` 89）：开新档/上次玩到/继续某档/删档/初始化五类文案见 `confirmCopy`，默认焦点在“否”。
- 已完结档不读进主流程：`openEndingReview` 暂存当前 state，把快照塞进 `state` 并进 ending 场景；`renderEnding` 在 `endingReview.active` 时不重建结局、不记名册、不写档，隐藏“剧情分支/史实图鉴”，把“回到标题”改成“返回存档”；`closeEndingReview` 恢复原 state 与按钮。
- 所有面板可 Esc 关闭、Tab 锁焦点；音频 duck 0.45。

### 10.4 初始化与重置

- 标题“向北”是纯文本 `h1`，不接收点击；初始化在标题“设置 → 危险操作 → 初始化游戏”（`#settings-init-game`，`data-action="init-game"`），再弹“是否初始化游戏？这意味着你的存档、剧情分支、成就和回顾记录会被全部清空，名册也会清空；音量、字号等设置保留。此操作不可撤销。”
- 选“是”删 7 个键：`xiangbei.saves.v1`、`xiangbei.save.v2`、`xiangbei.save.v1`、`xiangbei.history.v1`、`xiangbei.branches.v1`、`xiangbei.achievements.v1`、`xiangbei.roster.v1`；清回顾/分支/成就内存缓存与本局 run，保留 `store.settings`，并把空列表写回（设置刷新后仍在）。
- `?reset=1` 清四个键：三个存档键与 `xiangbei.history.v1`，不动分支/成就/名册；`?resume=1[/&chapter=&node=]` 是测试后门，正式入口只有标题“开始 / 继续”。

### 10.5 与分支/成就的关系

- 存档、分支、成就三套键互不读写：开多少档、删多少档都不改 `branches.v1` / `achievements.v1`；只有初始化才清空并回灰。
- 名册 `roster.v1` 同样只由初始化清空；图鉴页“清档不会清掉它”的提示已删。

## 11. 剧情回顾（v1.7，2026-11-08）

### 11.1 键与形状

- 独立键：`xiangbei.history.v1`；只记“走过哪些节点”，不复制台词，不占主档 11 键，也不进单档 4096B/整包 512KB。
- 形状：

    { "version": 1,
      "runs": {
        "slot-...": { "entries": [ ... ], "checkpoint": 0, "updatedAt": "ISO" },
        "session": { "entries": [ ... ], "checkpoint": 0, "updatedAt": "ISO" }
      } }

- `runs` 的键是存档槽 id；尚未落档的第一局用 `session`，首次 `saveNow()` 建槽成功后把 `session` 桶迁到新槽并删除旧桶。
- 每个桶最多 `HISTORY_MAX_ENTRIES=800` 条，整键最多 `HISTORY_MAX_RUNS=24` 个桶；超限只裁最旧的桶，当前桶不动。
- `checkpoint` 是该桶“已经写进主档”的条数；`updatedAt` 用于跨槽裁剪的先后。坏桶/坏条直接丢弃，不拖垮其它桶。

### 11.2 条目形状

| `t` | 字段 | 用途 / 解析 |
|---|---|---|
| `line` | `c`, `n` | 一句对话或旁白；打开面板时用 `locate(c,n)` 取 `speaker`/`text`。`speaker==="旁白"` 不显示人名。 |
| `prompt` | `c`, `n`, `k` | 选择提示句；`k` 为 `choice` / `multi` / `namepick`，取 `node.prompt`。 |
| `choice` | `c`, `n`, `k:"choice"`, `key`, `timedOut` | 单选取值；按 `option.key` 找原文。超时选项在面板追加“（时间到了，默认项）”。 |
| `multi` | `c`, `n`, `ids[]` | 多选实际选中的 id，最多 16 个；按 `node.options` 顺序还原文本，`、` 连接；空数组合成“没有选任何一样”。 |
| `namepick` | `c`, `n`, `nameId`, `timedOut` | 金沙江记名；按 `names[]` 找名字，显示“抄下「张老幺」的名字”；`nameId` 为空时显示“一个名字也没抄”。 |

- 同一 `t+c+n` 连续出现只保留最后一条：刷新会重渲染当前节点，靠这条去重，不产生重复行。
- 条目只存引用；`story.js` 改文案后，旧记录打开时显示新文案。找不到的节点/选项/名字跳过，不显示空白行。

### 11.3 写入、截断与清理

- 记录点：`renderLine`、`renderChoice` 的提示、单选提交成功后、`renderMultiChoice` 的提示、多选提交成功后、记名提示、`pickName`、`skipNamepick`。
- 写入 400ms debounce；`openHistory` / `closeHistory` / `saveNow` 成功 / 页面隐藏时 flush。写失败只 toast 一次“本局无法保存回顾记录（浏览器限制）”，面板仍读内存。
- 只有 `saveNow()` 成功写槽后，才把该槽 `checkpoint` 推进到当前条数；`saveNow` 失败（含超 4096B）不推进。
- `loadSlot` 在主流程渲染前把该槽 `entries` 截到 `checkpoint`：读档回到上次保存点，回顾也只显示到那一点；章末自动保存与暂停手动保存都会推进 checkpoint。
- `startNewGame` 重置新槽的桶；删除槽时同步删桶；初始化清整个历史键；`?reset=1` 清历史键与内存；`clearSave` 同样清回顾，不动分支/成就/名册。
- 坏 JSON / 版本或结构不符：备份 `xiangbei.history.v1.bad` 后回空，再 toast；读写异常都不白屏。
- 隐私模式/`file://` 写失败：内存仍可查看本局历史；跨刷新不保留，提示语只出现一次。

### 11.4 界面与不可选中

- 入口 `#vn-history-button`（`data-action="history"`）在暂停下方；只在 VN 场景显示，章首卡/地图/结局隐藏。
- 面板 `#history-panel` 全屏实色 `--history-bg:#080D13`，左上朱砂竖条 + “剧情回顾”，右上 `×`（`data-action="history-close"`，桌面 56×56、移动 82×82）；Esc 关闭，点背景不关，Tab 焦点锁在关闭键与正文之间。
- 两栏 200px / 1px / 1fr（移动 150px / 1px / 1fr）；人名右对齐、正文纸白；选择行 `➤ + 文本` 用 `--history-choice:#F2C45C` 加粗 700；提示句弱化；章节变化插分隔标题；打开滚到底。
- 正文固定 22px/1.9（移动 28px 逻辑），不跟 `--text-scale`，字号设置只影响游戏正文；`html`/`body`/`#stage` 及子元素 `user-select:none`（横屏提示也不例外），回顾层额外 `-webkit-user-drag:none`，无 `contenteditable`。
- 打开时冻结游戏：`state.paused=true`、取消自动、暂停打字机与所有限时倒计时、音频 duck 0.45；关闭恢复选项/点名计时、自动/跳过和焦点。历史打开时数字键/空格不穿透到剧情。
