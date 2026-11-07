# 《向北》存档与旗标（v1.4 · 状态、物资与门板，v1.4.0-dev）

> 存档键：`xiangbei.save.v2`（`SAVE_VERSION=2`）；旧键 `xiangbei.save.v1` 保留只读，载入 v2 失败时回退 v1 并就地迁移，迁移后写 v2、不删 v1。
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

`load` 是 `packUsage()` 的缓存（半格单位），不是玩家可写的负重；`items` 只存唯一 id，门板单列 `inventory.door`。

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
        "routeLabel": "7(5)",
        "routeTitle": "空页",
        "routeLede": "名册上多了一个名字，又划掉了。",
        "fate": { "feimao": "alive", "zaowang": "alive", "dongsheng": "alive", "lin": "dead", "player": "dead" },
        "condition": 0,
        "rescues": 3,
        "doorOutcome": "others",
        "strain": 0,
        "recorded": true
      }
    }

## 2. 顶层键与默认值

顶层固定 11 键：`version/scene/chapterId/nodeId/flags/inventory/choices/codex/settings/unlockedChapters/ending`。

- `version` 必须是 2；`save.version < 2` 视为旧档，迁移后写 v2。
- `scene`：title/map/vn/ending；多选、结算、物资面板、图鉴都是 vn 的子视图。
- `chapterId`：八章 + 两个隐藏章 coda/badend；旧档未知章判坏档。
- `nodeId`：当前节点 id（字符串，例 `"nodeId": "j012"`）；ending 必须为 null。载入后必须能在该章节点表里定位，否则判 `issue:"node"`。
- `flags`：47 项（§3）；缺失补默认、数值夹取、`item.door` 与 `inventory.door` 镜像。
- `inventory`：`{door, items, giftBarley}`；items 合法 id 只有 roster/pencil/medicine/barley/pot/raincloth/shoes。
- `choices`：选择日志，最多 64 条；限时项超时按默认项结算并记 `timedOut: true`；结局落档前清空，避免 4096B。
- `codex`：7 个已知 id，过滤去重。
- `settings`：音量/静音/字号/动效/跳过；不参与路线。
- `unlockedChapters`：地图解锁章；coda/badend 不进地图。
- `ending`：null 或快照（§5）；ending 场景必须完整。

## 3. 旗标全表（47 项）

### 3.1 基础 25 项（v1.2 基线）

- 物资布尔：`item.door/pot/medicine/barley/homepot/raincloth/shoes`（7）。
- 数值：`load` 0–99、`trust` 0–6、`fire` 0–100、`lights_lost` 0–22（4）。
- 湘江：`choice.xiangjiang.abandoned`（list，只由弃物多选写）+ `take.xray/press/files/medkit/radio/silver`（7）。
- 遵义：`choice.zunyi.missed` 0–1、`choice.zunyi.admit` 0–3（2）。
- 金沙江：`choice.jinsha.trips` 0–18（旧档保留）、`main/wounded/kettle`（4）。
- 泸定：`choice.luding.door`（1）。

### 3.2 v1.3 人物命运 9 项

| 键 | 默认 | 写点 | 用途 |
|---|---|---|---|
| `had.door` | false | p021 A/B | 序章是否带过门板；决定 `doorCarried` 与结局 7/8 系列 |
| `fate.feimao.dead` | false | l019/l019x | 飞毛腿生死 |
| `fate.zaowang.dead` | false | g018x | 灶王生死 |
| `fate.dongsheng.dead` | false | g026x | 冬生生死 |
| `fate.lin.dead` | false | 派生 | 林先生只在我死时死 |
| `fate.all.dead` | false | 派生 | 三个危机全死，供吴起 `w027b/w027c` 互斥 |
| `strain` | 0 | 派生 | 仅兼容：`3 - rescues` |
| `strain.hurt` | false | 派生 | 仅兼容：`rescues >= 2` |
| `strain.dying` | false | 派生 | 仅兼容：`fate.player.dead` |

### 3.3 v1.4 状态/物资 13 项

| 键 | 默认 | 写点 | 用途 |
|---|---|---|---|
| `condition` | 3 | 引擎 | 状态 0–4；救人惩罚、草地 `-1`、物资恢复、三人帮助 |
| `rescues` | 0 | l019/l019x、g018x、g026x | 成功救人数 0–3；每 +1 由 `rescuePenalty` 扣状态 |
| `help.used` | false | `settleGrass` | 三人帮助只用一次 |
| `memory.help` | false | `settleGrass` | 草地 `g028h` 的“三个人把我架起来”文本 |
| `fate.player.dead` | false | 引擎 | 我是否死在草地；`condition=0` 或差状态未恢复 |
| `fate.seven5` | false | `syncDerivedFlags` | 7(5)：`player.dead && had.door && rescues===3` |
| `fate.badend` | false | `syncDerivedFlags` | 坏结局：`player.dead && !fate.seven5` |
| `grass.settled` | false | `settleGrass` | 草地结算幂等，刷新不重复扣状态 |
| `quality.feimao` | 0 | l019/l019x | 飞毛腿状态：0 死/2 用药/3 铺桥 |
| `quality.zaowang` | 0 | g018x | 灶王状态：0 死/2 青稞/3 铁锅 |
| `quality.dongsheng` | 0 | g026x | 冬生状态：0 死/3 鞋或雨布 |
| `doorOutcome` | "none" | 剧情/引擎 | none/carried/bridge/grass/wuqi/others |
| `inventory.giftBarley` | false | g026x A/B | 冬生赠青稞，不占格；与普通青稞/药组合 |

### 3.4 派生与白名单

- `DERIVED_FLAGS = [fate.lin.dead, fate.all.dead, fate.seven5, fate.badend, strain.hurt, strain.dying]`；只由 `syncDerivedFlags` 写。
- `condition` 由 `rescuePenalty`、`usePackItems`、`settleGrass` 写；`help.used/memory.help` 由 `settleGrass` 写；`fate.player.dead` 由 `settleGrass/resolveGrassWarning` 写。
- 剧本 `set` 只写：`item.*`、`load`、`trust`、`fire`、`lights_lost`、`rescues`、`quality.*`、三个危机 `fate.*.dead`、`had.door`、`doorOutcome`、`memory.*`、`choice.*`、`inventory.giftBarley`。
- `ending.*`、`card.*`、`unlockedChapters` 只由引擎写；`choice.xiangjiang.abandoned` 只由弃物多选写。
- `item.door` 写入时同步 `inventory.door`；`inventory.giftBarley` 写入时同步 flag。
- `strain` 仍可被旧剧本读，但新剧本不写；`normalize` 会按 `3-rescues` 重算。

## 4. 物资与状态

### 4.1 行囊

- 4 格 = 8 个半格单位：药/青稞 1、布鞋 2、铁锅/雨布/门板 4。
- `packUsage = 门板 4 + Σ items 单位`；`packCapacity = max(8, usage)`，旧档超重不裁剪、显示兜底。
- p024 五件每件一件，按总单位 ≤8 校验；带门板时药+青稞+门板=4 格，锅+门板=4 格，锅+鞋+药+青稞=4 格；五件不可全选。
- 门板在物资栏禁用，剧情可铺桥/挡桥/床板/写字；雨布只在草地可用；限时选项期间禁止开物资栏。
- 冬生赠青稞不占格，只能与普通青稞或药组合使用，用完即消失。

### 4.2 状态

- 0/1/2/3/4 = 0/差/勉强/良好/优秀；初始 3（良好）；只显示文字，不显示百分比。
- `rescuePenalty(rescues, hasDoor)`：≤1 → 0；2 → 1；3 → 有板 2 / 无板 1。每救一人用差值扣 `condition`。
- 草地结束 `settleGrass`：`condition-1`；救满 3 且 `condition===1` 且未用过帮助 → `condition=2` + `help.used/memory.help`；`condition===0` → `fate.player.dead`。
- 差（1）：草地结算弹物资面板；关闭/不使用 → `resolveGrassWarning` 判死。0：直接判死，不开面板；7(5) 由 `settleDoor` 收口。
- 判定顺序：初始 3 → 救人惩罚 → 草地 -1 → 三人帮助 → 差/0 → 门板/结局。

## 5. ending 快照

固定 16 键：`stats/names/answered/missed/cards/route/routeIndex/routeLabel/routeTitle/routeLede/fate/condition/rescues/doorOutcome/strain/recorded`。

- `stats` 固定 4 键，`companyEnd` 在 stats 内：普通 19，7(5)/坏结局 18。
- `names` 只允许 0/7/8 项：坏结局 0，普通 7，空页 8；条目 `{id,name,status,answeredBy?}`；status 为 self/remote/player/missed；满崽 absent + answeredBy=dongsheng。
- `answered/missed` 0–8；坏结局都是 0。
- `cards` 固定 5 张：ideal/sacrifice/truth/overall/people；sacrifice 在 `player.dead` 或湘江 hold 时亮，死亡时用 `kongyeSacrificeLine`。
- `route` 11 个新路线 + legacy；`routeIndex` 0–11（legacy=0，7(1)=1 … 坏结局=11）；`routeLabel` 为 7(1)…8(5)/坏结局/旧档。
- `fate` 固定 5 键：feimao/zaowang/dongsheng/lin/player，值 dead/alive；`lin` 与 `player` 同生共死。
- `recorded` 防同一局重复写 `xiangbei.roster.v1`。
- 快照在 wuqi w900 或 coda c012 / badend b006 由 `buildEnding` 写；旧快照缺 route 补 legacy，不重算。

### 5.1 11 路线判定（`routeOf`）

先算 `rescues`、`had.door`、`fate.player.dead`：

1. 死：`had.door && rescues===3` → 7(5) `door_others`；否则坏结局 `bad_end`。
2. 无板：按 rescues 0/1/2/3 → 8(1)–8(4)；rescues=3 且 condition=4 → 8(5)。
3. 有板：`carried = item.door || doorOutcome ∈ {carried,wuqi,others}`；rescues≤1 → carried && condition=4 ? 7(1) : 7(2)；rescues≥2 → carried ? 7(3) : 7(4)。
4. 7(2)/7(4) 且 `doorOutcome==="bridge"` 显示“桥板/门板留在桥上”，否则“门板/门板留在草地”。

## 6. 名册回廊

- 键：`xiangbei.roster.v1`，与主存档独立，清档不清名册。
- 形状：`{version:1, pages:[{route,title,at,companyEnd,names,note}]}`；每页 0/7/8 行；最多 8 页，丢最旧。
- `route` 允许 11 新路线 + v1.3 的 sidao/menban/qiaoban/kongye（旧页保留），拒绝 legacy。
- 结局 `recordEndingPage` 在 `renderEnding` 首次执行时写；`ending.recorded` 防重。
- 写失败提示“本机无法保存名册，本局仍可继续”，不影响结局页。

## 7. 保存点与体积

- 每个 beat 后落档；多选/物资/结算/点名中间态也写。
- 结局落档前清空 `choices`：v1.3 实测完整日志 4267B > 4096B；清空后正常。
- 存档 >4096B 仍按坏档处理；名册独立键不占主档预算。

## 8. 迁移（v1.3 → v1.4）

1. 读 v2；不存在/解析失败才读 v1；v1 迁移后写 v2，保留 v1。
2. 所有旧档补 `had.door`：`choice.prologue.door || item.door || choice.luding.door`。
3. 旧 `strain` 当“救过几人”：`rescues = clamp(strain,0,3)`；`condition = 3 - rescuePenalty(rescues, had.door)`；已过草地 `g027` 再 -1。
4. `fate.player.dead`：旧 `strain.dying`、章 `coda` 或旧快照 `route==="kongye"`；同时 `condition=0`（仅 coda/kongye）。
5. 吴起旧档：飞毛腿/灶王 dead、冬生活、`strain=1`；泸定 `l022` 后飞毛腿 dead、`strain=0`；草地 `g019` 后灶王 dead。
6. `quality.*`：死者 0，生者 2（旧档没有更细状态）。
7. `doorOutcome`：item.door→carried；memory.door→wuqi；choice.luding.door→bridge；had.door && !item.door→grass；否则 none。旧 7(5)（player.dead+rescues3+had.door）→ others 且 item.door=false。
8. 旧 ending 快照：缺 route 补 `legacy/旧档/""`，不重算；缺 routeIndex 补 0；fate 缺 player 按旧 route 补；保留 names/answered/missed/stats/cards。
9. 旧名册页保留；新页追加。

## 9. 调试与验收

- `?debug=1` 右上显示 scene/chapter/node/flags 摘要/ending/save 字节/audio/peak。
- `?chapter=coda&node=c006`、`?chapter=badend&node=b006` 可直达；未知节点回地图。
- 单测：`node project/tools/smoke.js`（47 旗标、pack 4/8、11 路线、迁移）；`check-build` 覆盖 C14/C18/C24/C26/C39/C40。
- 浏览器：`_pw-step11.js` 覆盖 11 结局、危机、物资面板、差警告、门板弹窗、旧档、刷新、移动、`file://`。
- 实测：check-build 39/39、smoke 46/46、check-script 9 文件 OK；证据 `docs/evidence/step-11/`。
