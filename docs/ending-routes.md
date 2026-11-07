# 《向北》人物命运、状态与门板（v1.4.0-dev 设计定稿）

> 状态：**设计定稿（2026-11-07）**。本文件是 v1.4 的唯一结局/状态/物资口径；代码按 T11.0→T11.12 实现，实现后在第 12 节回填实测。
> 上游依据：用户 2026-11-07 的五条决定、桌面设计稿《向北 v1.4 状态、物资与门板系统》（149 行）、执行卡 `step/step-11-状态物资与门板.md`。
> 冲突顺序：用户最新指令 > 本文 > `向北-项目计划书.md` > `.claude/CLAUDE.md` > `docs/`。
> v1.3 的四路线（四道划痕/门板/桥板·石墙/空页）是历史版本，保留在第 13 节；v1.4 不再使用 `strain` 作为主状态。

## 0. 一页结论

一句话：**历史终点不变；人物命运改由“状态 + 救人数 + 门板去向”共同决定；门板可以到吴起，也可以留在桥上、草地，或由别人带出去。**

- 状态 0–4：0 / 差 / 勉强 / 良好 / 优秀，初始 3（良好）。
- 行囊 4 格 = 8 个半格单位；门板 2 格，药/青稞各 0.5 格，鞋 1 格，锅/雨布各 2 格。
- 三次危机改为纯物资选择；v1.3 的“替蹲风口/背他走”删除。
- 救 3 人、带门板、状态在草地尽头归 0：你死，门板由别人带到吴起（7(5)）。
- 林先生只在你死时死：7(5) 或坏结局；其他路线活。
- 共 **11 个结局标签**：带板 5 个（7(1)–7(5)）、无板 5 个（8(1)–8(5)）、坏结局 1 个。

| # | route id | 页面标签 | 一句话 | 门板 | 我 | companyEnd | names |
|---:|---|---|---|---|---|---:|---:|
| 1 | `door_excellent` | 7(1) | 一直优秀，自己把门板带到吴起 | 带出 | 活 | 19 | 7 |
| 2 | `door_grass_one` | 7(2) | 救 1 人，门板留在草地/桥上 | 未带出 | 活 | 19 | 7 |
| 3 | `door_carry_two` | 7(3) | 救 2 人，靠冬生赠青稞撑住，门板到吴起 | 带出 | 活 | 19 | 7 |
| 4 | `door_grass_many` | 7(4) | 救 2/3 人，门板没能带出 | 未带出 | 活 | 19 | 7 |
| 5 | `door_others` | 7(5) | 救 3 人，你死在草地，门板由别人带到吴起 | 他人带出 | 死 | 18 | 8 |
| 6 | `no_door_zero` | 8(1) | 不带门板，0 人获救，你活着 | 无 | 活 | 19 | 7 |
| 7 | `no_door_one` | 8(2) | 不带门板，救 1 人 | 无 | 活 | 19 | 7 |
| 8 | `no_door_two` | 8(3) | 不带门板，救 2 人 | 无 | 活 | 19 | 7 |
| 9 | `no_door_three` | 8(4) | 不带门板，救 3 人，结算非优秀 | 无 | 活 | 19 | 7 |
| 10 | `no_door_three_excellent` | 8(5) | 不带门板，救 3 人，结算优秀 | 无 | 活 | 19 | 7 |
| 11 | `bad_end` | 坏结局 | 没有走出草地 | 无/留 | 死 | 18 | 0 |

结算页统一显示 `结局7(1)（门板） · …` 这种形式；`routeIndex` 为 1–11，`routeLabel` 为 `7(1)`…`8(5)`/`坏结局`。旧档显示 `旧档`，不重算。

## 1. 边界与红线

### 1.1 保留

- 七章顺序、历史终点、湘江必败 / 遵义必开 / 泸定必夺 / 到吴起，全部不改。
- 单一历史结局；分的是人物命运与谁走到吴起。
- 五张精神卡、7 张史实图鉴、点名、104→19 的数字、20 分钟验收。
- 失败不弹 Game Over、不重开、不评分；死亡用“名字被划掉”和留白。

### 1.2 不做

- 不做好感度、攻略角色、路线锁、真结局、周目解锁、结局完成度百分比、分支存档树。
- 不做角色选择、战斗、养成、商店、升级三选一、BOSS、排行榜、多人。
- 不做“最优/次优/成就”；“革命的情谊”只保留事件文本，不再是成就。
- 名册回廊只记“应到/未到/代答”，不做百分比、不做奖杯。

### 1.3 历史红线

- 真实人物不进剧情对白；林先生、老周、灶王、飞毛腿、冬生、细妹、何指导员、张老幺均为虚构。
- 老周必死（湘江），不改；飞毛腿、灶王、冬生的死法是虚构细节，不冒充史料。
- 草地断粮、收容队、担架等细节按回忆录口径写；新增文本不引新“史实”，不碰 `docs/sources.md`。
- 死亡不写血腥，不写“牺牲值”；只写“没跟上来”“名字空着”。

## 2. 状态

### 2.1 五档

| 值 | 显示 | 含义 |
|---:|---|---|
| 4 | 优秀 | 还能替别人背东西 |
| 3 | 良好 | 初始状态；能自己走 |
| 2 | 勉强 | 走得动，但跟不上队伍 |
| 1 | 差 | 需要物资或别人拉一把，否则走不出去 |
| 0 | 0 | 立即死亡（7(5) 例外） |

- 只显示文字，不显示 0–4，不显示百分比条。
- “我”的状态显示在左上角章节名下方；状态变化时用文字 + 颜色，不闪烁。
- “一直优秀”按**最终结算时状态为 4**判定，不是每一秒都必须 4。

### 2.2 状态变化

按固定顺序结算：

1. 初始 3。
2. 每次成功救人，按“救人当时的门板状态”扣状态。
3. 草地结束 -1。
4. 救满 3 人且三人帮助未用：状态为 1 → 自动 +1 到 2；状态为 0 → 帮助无效。
5. 状态 0 → 死亡；若满足 7(5) 走 7(5)，否则坏结局。
6. 状态 1 → 弹物资面板；使用后仍 ≤1 或拒绝 → 死亡；若满足 7(5) 走 7(5)，否则坏结局。
7. 门板条件与结局。

救人扣状态：

| 出发是否带门板 | 救第 1 人 | 救第 2 人 | 救第 3 人 |
|---|---|---|---|
| 无门板 | 不变 | -1 | 不变 |
| 有门板（含本次用门板救） | 不变 | -1 | 再 -1 |

- 用门板救飞毛腿时，门板在救人的那一刻算“有门板”，但第 1 人本来就不扣。
- 救 3 人、有门板：3 → 3 → 2 → 1；草地 -1 → 0；三人帮助在 0 无效 → 7(5)（若出发带板）。
- 救 3 人、无门板：3 → 3 → 2 → 2；草地 -1 → 1；三人帮助 → 2；活着，走 8(4) 或 8(5)。
- 救 2 人、有门板：3 → 3 → 2；草地 -1 → 1；没有三人帮助（未救满 3）；需要物资把状态拉回 ≥2，否则坏结局。

### 2.3 三人帮助

- 条件：`rescues === 3`、`help.used === false`、当前状态为 1。
- 效果：状态 +1 到 2；`help.used = true`；`memory.help = true`。
- 第一次强制触发，不给玩家选择；触发后本局不再触发。
- 状态为 0 时帮助无效，仍按 0 处理。
- 帮助发生在草地 -1 之后、差警告之前；帮助后不再是 1，不弹物资警告。
- 剧情句 `g028h`：“三个人把我从地上架起来。谁也没说话。”

## 3. 物资

### 3.1 行囊

- 行囊 **4 格 = 8 个半格单位**；所有物资总占格 ≤4。
- 初始 p024 五件各一件；不做同种多份。
- 门板单独占 2 格（4 单位），在物资栏始终“不可使用”。
- 花名册/铅笔 0 格，是剧情基座。
- 旧档超过 4 格不裁剪；显示 `used/max(4,used)`，避免旧档白屏。

| 物资 | 占格 | 半格 | 用途 | 备注 |
|---|---:|---:|---|---|
| 药 | 0.5 | 1 | 救飞毛腿；与青稞/冬生青稞组合 | 消耗品 |
| 青稞 | 0.5 | 1 | 救灶王；与药/冬生青稞组合 | 消耗品 |
| 布鞋 | 1 | 2 | 救冬生；自己用 +1 | 消耗品 |
| 铁锅 | 2 | 4 | 救灶王；自己用 +2 | 消耗品 |
| 雨布 | 2 | 4 | 救冬生；草地自己用 +1 | 物资栏只在草地可用；剧情遮雨不算使用 |
| 门板 | 2 | 4 | 铺桥/挡桥/床板/写字 | 物资栏始终不可用 |

### 3.2 使用规则

- 物资栏随时可开；**限时选项进行期间禁止打开**；选项结算后、状态变化时再弹。
- 其他物资在状态 **良好及以下** 可用；优秀时禁用，按钮写“状态已足够”。
- 门板：始终禁用，写“门板不能为自己使用”。
- 雨布：非草地章节禁用，写“只能在草地使用”。
- 单份青稞/单份药不能单独为自己使用；按钮写“需要与……同用”，不能静默失效。
- 组合配方：

| 组合 | 效果 | 备注 |
|---|---:|---|
| 药 + 青稞 | +1 | 两份都消耗 |
| 青稞 + 冬生赠青稞 | +2 | 两份都消耗；7(3) 的关键 |
| 药 + 冬生赠青稞 | +1 | 两份都消耗 |
| 布鞋 | +1 | 消耗 |
| 雨布（仅草地） | +1 | 消耗 |
| 铁锅 | +2 | 消耗 |
| 门板 | — | 不可为自己使用 |

- 冬生获救后赠一份青稞：不占行囊，存 `inventory.giftBarley=true`；只能当场使用，或与自己的青稞/药组合；剧情必须写 `g026y`。
- 开局（p024 后）弹“出发前”面板：“你当前的状态为良好，是否使用物资将状态提升至优秀？”关闭不惩罚；使用只是“有机会”触发 7(1)，不是保证。

## 4. 三次危机

| 危机 | 位置 | 可用物资 | 被救者状态 | 不救 |
|---|---|---|---|---|
| 飞毛腿 | 泸定 `l019`/`l019x` | 门板铺桥 / 药 | 门板 → 良好(3)；药 → 勉强(2) | 死 |
| 灶王 | 草地 `g018x` | 青稞 / 铁锅 | 青稞 → 勉强(2)；铁锅 → 良好(3) | 死 |
| 冬生 | 草地 `g026x` | 布鞋 / 雨布 | 两者 → 良好(3) | 死 |

- 每次成功救人：`rescues+1`，对应 `quality.*` 写 2 或 3，`fate.*.dead=false`。
- 不救：`quality.*=0`，`fate.*.dead=true`，不加 `rescues`。
- 物资救人：消耗对应 `item.*=false`；门板铺桥另写 `doorOutcome="bridge"`。
- v1.4 删除“替蹲风口/背他走”的身体选项；身体代价改由状态与三人帮助表达。
- 被救者状态只用于门板条件；老周/何指导员/细妹/林先生不进入状态表。

## 5. 门板

### 5.1 去向

`doorOutcome` 六值：

| 值 | 含义 | item.door |
|---|---|---|
| `none` | 出发没带板 | false |
| `carried` | 当前背着 | true |
| `bridge` | 泸定铺桥，留在桥上 | false |
| `grass` | 草地舍弃，留在草地 | false |
| `wuqi` | 到吴起后留在墙边（w013 A） | false |
| `others` | 7(5) 我死，门板由别人带到吴起 | false |

`doorCarried = had.door && (item.door || doorOutcome==="wuqi" || doorOutcome==="others")`。

### 5.2 带出条件（并列，任一）

- **A**：最终状态 = 优秀（4）。
- **B**：算上我共 4 人存活（`rescues===3`），且至少 1 名被救者状态良好（3）。
- **C**：算上我共 3 人存活（`rescues===2`），且 2 人状态良好（我可计入）。

说明：死亡者不计入存活；4 人 = 我 + 3 名被救者，3 人 = 我 + 2 名被救者。救 1 人只能靠 A；救 0 人只能靠 A。

### 5.3 草地判定

- 7(5) 例外：救 3 人、出发带门板、我死在草地 → 门板由他人带到吴起，`doorOutcome="others"`，不弹舍弃。
- 其余：若 `had.door && !doorCarried && doorOutcome!=="bridge"`，弹“必须舍弃门板”；点击后 `doorOutcome="grass"`、`item.door=false`，继续。
- 已铺桥（bridge）不弹舍弃，结局标题用“桥板”。
- 满足 A/B/C 则保留门板；不满足则舍弃。
- 舍弃弹窗文案：“由于你体力透支，或帮手不足，无法将门板带到终点，你必须舍弃。”按钮“舍弃门板”。

## 6. 结局矩阵

> 判定顺序：先判死，再判无板，再判带板；每一行互斥。`player.dead` 由状态结算产生；`doorCarried` 是快照值。

| # | route id | 标签 | 条件 | 门板标题 | 我 | companyEnd | names |
|---:|---|---|---|---|---|---:|---:|
| 1 | `door_excellent` | 7(1) | `had.door && !player.dead && doorCarried && condition===4 && rescues<=1` | 门板 | 活 | 19 | 7 |
| 2 | `door_grass_one` | 7(2) | `had.door && !player.dead && !doorCarried && rescues<=1` | 门板 / 桥板 | 活 | 19 | 7 |
| 3 | `door_carry_two` | 7(3) | `had.door && !player.dead && doorCarried && rescues>=2` | 门板 | 活 | 19 | 7 |
| 4 | `door_grass_many` | 7(4) | `had.door && !player.dead && !doorCarried && rescues>=2` | 门板 / 桥板 | 活 | 19 | 7 |
| 5 | `door_others` | 7(5) | `had.door && player.dead && rescues===3` | 空页 | 死 | 18 | 8 |
| 6 | `no_door_zero` | 8(1) | `!had.door && !player.dead && rescues===0` | 空手 | 活 | 19 | 7 |
| 7 | `no_door_one` | 8(2) | `!had.door && !player.dead && rescues===1` | 空手 | 活 | 19 | 7 |
| 8 | `no_door_two` | 8(3) | `!had.door && !player.dead && rescues===2` | 空手 | 活 | 19 | 7 |
| 9 | `no_door_three` | 8(4) | `!had.door && !player.dead && rescues===3 && condition<4` | 空手 | 活 | 19 | 7 |
| 10 | `no_door_three_excellent` | 8(5) | `!had.door && !player.dead && rescues===3 && condition===4` | 空手 | 活 | 19 | 7 |
| 11 | `bad_end` | 坏结局 | `player.dead && !(had.door && rescues===3)` | 没有走出草地 | 死 | 18 | 0 |

### 6.1 边界收束

- 7(1) 的设计主例是“0 人获救 + 一直优秀”；实现按“带出 + 优秀 + 救≤1”收束。救 1 人且最终优秀也归 7(1)，文案不写“0 人”，避免出现第 6 种门板路线。
- 7(3) 的设计主例是“救 2 人 + 带板 + 条件 C”；救 3 人但活着且满足 B 也归 7(3)，文案不写“2 人”。
- 7(2) 与 7(4) 都是“门板没带出”，按救人数分；不另设“门板留草地”的独立标题。`doorOutcome==="bridge"` 时标题“桥板”，否则标题“门板”，lede 写“门板留在了草地”。
- 7(5) 是唯一“我死、门板仍到吴起”的路线；`doorOutcome="others"`，8 名（含满崽），companyEnd 18，林先生 absent。
- 坏结局不走吴起点名：`names=[]`，companyEnd 18，ending 页显示“名册没有翻到吴起”；五卡仍渲染，按条件亮/灰。
- 没有“全活”；没有“救 3 且带板且活着”。

### 6.2 7(3) 可达性示例

配置：门板 2 + 药 0.5 + 布鞋 1 + 青稞 0.5 = 4 格。

1. 飞毛腿用药（药消耗，救 1，状态 3）。
2. 冬生用布鞋（鞋消耗，救 2，状态 3→2）。
3. 冬生赠青稞（`giftBarley=true`）。
4. 草地结束 -1：状态 2→1（差）。
5. 差警告用“我的青稞 + 冬生赠青稞”+2：状态 1→3（良好）。
6. 算上我共 3 人存活；我良好、冬生良好、飞毛腿勉强 → 条件 C 成立。
7. 门板带出 → 7(3)，companyEnd 19，names 7。

若没有冬生赠青稞，或“青稞+青稞”只 +1，7(3) 会在草地结束时卡在差/勉强，被坏结局或 7(4) 截胡。

### 6.3 7(5) 与坏结局

- 7(5)：带板、救 3 人；有板救人惩罚 3→3→2→1，草地 -1→0，三人帮助在 0 无效。你死在草地，门板由别人带到吴起。
- 坏结局：任何其他 `player.dead`；包括无板救 3 但状态被耗到 0、差状态拒绝物资、草地结束仍差且无恢复。
- 林先生死亡原因只写“我死 → 她为了等我、找我，没等到收容队”；不写成“救 2 人必死”。
- 7(5) coda 必须写林先生缺席：`c005a`“林先生没有来。她在草地找我们，没等到收容队。”
- 坏结局 `badend` 章写：“我没有走出草地。”“名册留在了冬生那里。”“后来，连队到了吴起。十八个人。”“林先生没有等到收容队。”不点名。

## 7. 人数与点名

- companyStart 104，companyEnd 19（普通）或 18（7(5)/坏结局）。
- 普通 7 名：何指导员、细妹、林先生、老周、灶王、飞毛腿、冬生。
- 7(5) 8 名：上述 7 人 + 满崽；满崽 absent，`answeredBy="dongsheng"`；冬生代答。
- 坏结局 0 名：不点名；ending 页显示“名册没有翻到吴起。”
- 林先生：7(5)/坏结局 absent；其他路线 self/到场。
- 灶王/飞毛腿/冬生：按 `fate.*.dead`；被救者 alive，未救者 absent。
- 老周永远 absent；何指导员 remote；细妹 self。

## 8. 数据模型

### 8.1 旗标（在 v1.3 34 项基础上增/改）

| 旗标 | 类型 | 默认 | 写点 | 说明 |
|---|---|---:|---|---|
| `condition` | 0–4 | 3 | engine 状态函数 | 当前状态；0 死/坏 |
| `rescues` | 0–3 | 0 | engine 救人函数 | 成功救人数 |
| `help.used` | bool | false | engine 帮助函数 | 三人帮助只一次 |
| `memory.help` | bool | false | engine 帮助函数 | 剧情句“他们把我架起来” |
| `fate.player.dead` | bool | false | engine 死亡函数 | 我是否死 |
| `fate.lin.dead` | bool | false | 派生 | = player.dead |
| `quality.feimao` | 0/2/3 | 0 | 救人函数 | 0 死/未救，2 勉强，3 良好 |
| `quality.zaowang` | 0/2/3 | 0 | 救人函数 | 同上 |
| `quality.dongsheng` | 0/2/3 | 0 | 救人函数 | 同上 |
| `doorOutcome` | enum | `none` | 剧情/结算 | 门板去向 |
| `had.door` | bool | false | p021 | 出发是否带板 |
| `inventory.giftBarley` | bool | false | 冬生获救 | 不占格 |
| `fate.all.dead` | bool | false | 派生 | 三个危机全死；w027b/c 用 |
| `strain` | 0–3 | 派生 | 旧档兼容 | 不再驱动剧情；新档可由 rescues 反推 |

- 保留 `fate.feimao.dead` 等作为 quality 的镜像；新代码优先读 quality，旧剧本可继续读 fate。
- `FLAG_LIMITS`：condition [0,4]、rescues [0,3]、quality [0,3]、strain [0,3]。
- `FLAG_PREFIXES` 增 `quality.`；`FLAG_KEYS` 增 condition/rescues/help.used/fate.player.dead/doorOutcome。
- `syncDerivedFlags` 只做：condition 夹取；strain=3-rescues（新档）；fate.lin.dead=player.dead；fate.all.dead=三个 dead；不再写 strain.hurt/dying 作为主逻辑（保留旧键兼容）。

### 8.2 物资

```js
// 半格单位，避免 0.5 浮点
const ITEM_UNITS = {
  roster: 0, pencil: 0,
  medicine: 1, barley: 1, shoes: 2,
  homepot: 4, raincloth: 4, door: 4
};
const PACK_SLOTS = 4;
const PACK_UNITS = PACK_SLOTS * 2; // 8
```

- `inventory.items` 只存唯一 id；门板单独 `inventory.door`；冬生青稞 `inventory.giftBarley`。
- `packUsage(state)` = 门板 4 + 所有 item units；UI 显示 `usage/4`，半格显示 `.5`。
- p024 不再用 `maxWhen`，改用 `canAddMultiOption(state, option)`：加入后总 units ≤8。
- `applyMultiChoice` 用同一函数；UI 与结算不能各算一套。
- `buildResultView` 的 items 分支改 4 格；超过 4 的旧档显示 `used/max(4,used)`，不裁剪。

### 8.3 ending 快照

在 v1.3 11 键上增：

| 键 | 类型 | 说明 |
|---|---|---|
| `route` | string | 11 个 route id 之一；旧档 `legacy` |
| `routeIndex` | 1–11 | 顺序号 |
| `routeLabel` | string | `7(1)`…`8(5)`/`坏结局` |
| `routeTitle` | string | 门板/桥板/空页/空手/没有走出草地 |
| `routeLede` | string | 结局页一句 |
| `condition` | 0–4 | 结算状态 |
| `rescues` | 0–3 | 救人数 |
| `doorOutcome` | enum | 门板去向 |
| `fate` | object | 5 键：feimao/zaowang/dongsheng/lin/player，值 dead/alive |
| `stats` | object | companyStart 104 / companyEnd 18 或 19 / redStart 86000 / redEnd 7000 |
| `names` | array | 0（坏结局）/7/8 项 |
| `answered`/`missed` | 0–8 | 坏结局 0/0 |
| `cards` | 5 项 | 沿用 |
| `recorded` | bool | 名册防重 |

- `validEndingNames` 允许 0、7、8；`answered/missed` 0–8。
- `normalizeEnding` 允许 coda + badend 章；缺 route 的旧快照补 `legacy`，不重算。
- 结局前清 `choices`（v1.3 已做，v1.4 继续；完整日志可能 >4096B）。

### 8.4 存档 v2

- 新键 `xiangbei.save.v2`；旧 `xiangbei.save.v1` 保留不删，用于迁移与 v1.3 回退。
- `SAVE_VERSION=2`；先读 v2，坏档备份 `.bad` 后尝试 v1；v1 迁移成功后写 v2，v1 原样保留。
- 迁移：
  - `rescues = 3 - strain`（夹 0–3）；`condition = 3 - strain`（strain3 → 0；旧空页已死）。
  - `fate.player.dead`：旧 ending/coda/route kongye → true；否则 false。
  - `fate.lin.dead = fate.player.dead || 旧 fate.lin.dead`。
  - `had.door`：旧 `choice.prologue.door || item.door || choice.luding.door`。
  - `doorOutcome`：item.door → carried；memory.door → wuqi；choice.luding.door → bridge；had.door && !item.door → grass；否则 none。
  - `quality.*`：fate.*.dead false → 2（保守）；true → 0。
  - `help.used=false`；`memory.help=false`。
  - 旧 ending 快照保留 route/routeTitle/routeLede，补 `route:"legacy"`、`routeLabel:"旧档"`，不重算。
- 旧 v1.3 档在 wuqi/coda/ending 各留一份样本；迁移后必须能继续/显示。
- 名册 `xiangbei.roster.v1` 继续用；旧四路线页保留，新页追加，不重写旧页。最多 8 页，丢最旧。

## 9. 剧情节点计划

### 9.1 序章

- `p021`：保留门板单选；A `had.door=true`、`item.door=true`、`doorOutcome="carried"`、`load` 不再写 +2；B `had.door=false`、`doorOutcome="none"`。cost 改“行囊只剩两格，多背三十斤”。
- `p024`：4 格多选；五件 slots 改 0.5/0.5/2/2/1；删除 `maxWhen`；prompt“娘把五样东西摆在桌上。行囊四格；带门板，占两格。”；状态“已占 X/4 格”。
- `p024` 结算：buildResultView 显示 4 格、门板 2 格、半格；不裁剪旧档。
- `p024` 后：开局状态面板“你当前的状态为良好，是否使用物资将状态提升至优秀？”；关闭不惩罚；使用后按配方结算。
- 可选 `p024a`：“我把行囊系紧。四格，满了。”；不带门板时另有句子。

### 9.2 泸定

- `l019`（`when:"item.door"`，12s，默认 C“抱着门板先过桥”）：
  - A 铺桥：`item.door=false`、`doorOutcome="bridge"`、`trust+1`、救飞毛腿（quality 3）、`rescues+1`；不写 strain。
  - B 喂药（`requires:"item.medicine"`）：消耗药、救飞毛腿（quality 2）、`rescues+1`。
  - C 抱板走：`fate.feimao.dead=true`、`quality.feimao=0`、`memory.fly_leave=true`。
- `l019x`（`when:"!item.door && !choice.luding.door"`，12s，默认 B“继续走”）：
  - A 喂药（requires medicine）：消耗药、救（quality 2）、`rescues+1`。
  - B 继续走：死。
- `l019c`（`memory.fly_medicine`）：“我把药敷在他背上。他咬住号嘴，没出声。”
- `l019d`（`fate.feimao.dead`）：“我过了桥。回头的时候，桥那头已经没有人。”
- `l022/l023/l024/l025/l026` 保留 `when:"fate.feimao.dead"`；`l022a/l024a` 活分支保留，救/死由 quality/fate 判断。

### 9.3 草地

- `g018x`（灶王，16s，默认 D“不救”）：
  - A 青稞（requires item.barley）：消耗青稞、救（quality 2）、`rescues+1`、`memory.zaowang_barley`。
  - B 铁锅（requires item.homepot）：消耗锅、救（quality 3）、`rescues+1`、`memory.zaowang_pot`。
  - C 不救：`fate.zaowang.dead=true`、`quality.zaowang=0`。
- `g026x`（冬生，12s，默认 C“不救”）：
  - A 布鞋（requires item.shoes）：消耗鞋、救（quality 3）、`rescues+1`、`memory.dongsheng_shoes`。
  - B 雨布（requires item.raincloth）：消耗雨布、救（quality 3）、`rescues+1`、`memory.dongsheng_cloth`。
  - C 不救：`fate.dongsheng.dead=true`、`quality.dongsheng=0`。
  - 不再有“背他走/替蹲风口”。
- 冬生获救后新增 `g026y`：“冬生把一小袋青稞塞给我。他说，这个不占地方。”；engine 置 `giftBarley=true`。
- 死亡段 g019–g023b 保留 `fate.zaowang.dead` 守卫；g021 用 dead && item.homepot；g021b 用 dead && !item.homepot。
- `g028a/g028b` 保留；新增 `g028h`（`memory.help`）“三个人把我从地上架起来。谁也没说话。”

### 9.4 草地收束

1. 冬生危机结束。
2. 草地结束 -1；若救 3 人且帮助未用、状态为 1 → 自动帮助到 2。
3. 差/0 检查：
   - 0：若 `had.door && rescues===3` → 7(5)；否则坏结局。
   - 1：弹物资栏；使用后仍 1/0 → 同上；关闭 → 同上。
4. 门板：
   - 7(5) 跳过舍弃，`doorOutcome="others"`。
   - 否则若 `had.door && !doorCarried && doorOutcome!=="bridge"` → 弹“必须舍弃门板”，`doorOutcome="grass"`。
   - 满足 A/B/C 则保留。
5. 出口：
   - 7(5) → `coda`（g899）。
   - 坏结局 → `badend` 隐藏章（g898）。
   - 其余 → `wuqi`（g900）。

节点：

- `g028d`“走出草地那天，我走不动了。”——`when:"fate.player.dead"`。
- `g028e/f/g` 保留为 7(5) 的我死段落；由 `fate.player.dead` 守卫。
- `g029` title 加 `when:"!fate.player.dead"`。
- `g030` grass codex 无条件，放在所有出口前。
- `g899` end `next:"coda"`，`when:"fate.player.dead && had.door && rescues===3"`。
- `g900` end `next:"wuqi"`，`when:"!fate.player.dead"`。
- 新增 `g898` end `next:"badend"`，`when:"fate.player.dead && !(had.door && rescues===3)"`。

### 9.5 吴起、coda、badend

- `w006b` `!item.door && !fate.lin.dead`；`w006c` `!item.door && fate.lin.dead`。
- `w014b` 加 `!fate.lin.dead`；`w014c` 林死“她没有来。”
- `w015c/w016c` 加 `!fate.lin.dead`；`w015d/w016d` 林死 + 无门板 + !memory.door。
- `w022` `!fate.lin.dead`；`w022a` 林死“念到林先生。没有人应。她没等到收容队。”
- `w024` 灶王死；`w024a` 灶王活。
- `w025` 飞毛腿死；`w025a` 飞毛腿活。
- `w026` 删静态 names，保留 mode rollcall/duration 45；engine 按 fate/quality 动态生成 7/8 名。
- `w027b` `!memory.rollcall_missed_any && !fate.all.dead`；`w027c` 全死版“四个人的名字，我都替他们答了。”
- `w028/w029` 保留 v1.3 合并后的数字句；`w030/w031` 加 `!fate.player.dead`。
- `coda` c001–c012 保留 7(5)；c002“满崽没有到吴起。”；c003 18 人/19 名；c004 冬生代答；c006 8 人点名；c009 添名又划掉。
- 7(5) coda 必须写林先生缺席：新增 `c005a`“林先生没有来。她在草地找我们，没等到收容队。”，放在 c005 后。
- 新增 `badend` 隐藏章（order 9，hidden）：
  - b001 title `grass_marsh`；
  - b002“我没有走出草地。”；
  - b003“名册留在了冬生那里。”；
  - b004“后来，连队到了吴起。十八个人。”；
  - b005“林先生没有等到收容队。”；
  - b006 end `next:"ending"`。
  - badend 不点名，ending names 0；五卡仍显示。

### 9.6 ending 文案

- `story.ending.routes` 扩为 11 个 route 的 title/lede；`routeLabel`/`routeIndex` 由 engine 映射，单源。
- 7(1)/7(3) 标题“门板”；7(2)/7(4) 标题“门板”或“桥板”；7(5) 标题“空页”；8(x) 标题“空手”；坏结局标题“没有走出草地”。
- `kongyeSacrificeLine` 改通用“你把自己，留在了草地尽头。”，7(5) 与坏结局可复用。
- 五卡不变；`sacrifice` 条件改 `player.dead || choice.xiangjiang.hold`。
- 林先生因果句：7(5)“林先生没有等到收容队。”；坏结局“她留在草地找我。”

## 10. UI 与交互

### 10.1 状态 HUD

- 位置：左上角 `vn-chapter` 下方；标签“我”，值“良好”。
- 数值变化用文字 + 颜色；aria-live；不显示 0–4，不显示百分比。
- 差/0 用朱砂，不闪烁；`prefers-reduced-motion` 下只换字。

### 10.2 物资按钮/面板

- `#vn-pack-button`：常驻（VN 场景），显示“物资 3/4”；限时选项时 `disabled`，不隐藏。
- `#vn-pack`：覆盖层 dialog；标题“物资”；容量“已占 X/4 格”；列表每件名称、占格、描述、“使用”按钮/禁用原因。
- 门板：“不可使用”；雨布：非草地“只能在草地使用”；优秀：“状态已足够”；单药/单青稞：“需要与……同用”。
- 状态变化自动开面板时，顶部显示“状态：差”或“状态变化”；差状态关闭 = 结算，不是普通关闭。
- 开局面板：标题“出发前”，文案“你当前的状态为良好，是否使用物资将状态提升至优秀？”；关闭不惩罚。

### 10.3 差警告/门板弹窗

- 差警告：复用物资面板，顶部朱砂提示“你现在是‘差’。不用物资，就走不出去。”；底部“继续（不使用）”；点击后 engine 判坏/7(5)。
- 门板弹窗：独立小弹窗，文案见 5.3；按钮“舍弃门板”；点击后继续。
- 7(5) 不弹门板弹窗。

### 10.4 结局页

- `#ending-route` 显示“结局7(1)（门板） · lede”；坏结局“坏结局 · 没有走出草地”。
- names 为空时隐藏点名列，显示“名册没有翻到吴起。”；stats 仍显示 companyEnd 18。
- 五卡保留；坏结局也显示，按条件亮/灰。
- 名册回廊旧页/新页混排；旧页不改数据。

### 10.5 移动/键盘

- 844×390：状态 HUD 字号 ≥14 CSS px；物资面板单列可滚；按钮 ≥44 CSS px；门板/警告弹窗可滚。
- 键盘：物资按钮 Tab 可达；面板 Esc 关闭（差状态关闭 = 结算）；数字键 1–5 可选，不做复杂快捷键。
- 限时选项：物资按钮禁用；面板若已开，选项开始时强制关闭。

## 11. 测试矩阵

| ID | 用例 | 通过判据 |
|---|---|---|
| T11-01 | 4 格/重量 | 门板+药+鞋+青稞=4；门板+锅=4；无板锅+鞋+药+青稞=4；五件不可全选 |
| T11-02 | 物资使用 | 药+青稞 +1；青稞+冬生青稞 +2；药+冬生青稞 +1；鞋/雨布 +1；锅 +2；门板不可用；单青稞/单药禁用 |
| T11-03 | 状态惩罚 | 无板救2 -1；有板救3 再 -1；草地 -1；顺序正确 |
| T11-04 | 三人帮助 | 救3 差→勉强一次；0 无效；用过不再触发 |
| T11-05 | 差/0 | 差无物资→坏；0→坏；7(5) 优先；不开物资栏 |
| T11-06 | 门板三条件 | A/B/C 各一例；不满足弹舍弃；桥板不弹 |
| T11-07 | 11 结局 | 7(1)–(5)、8(1)–(5)、bad 各一次；routeLabel/companyEnd/names 对 |
| T11-08 | 林先生 | 仅 7(5)/bad 死；其他活；coda/ending 有因果句 |
| T11-09 | 旧档 | v1.3 的 prologue/luding/grass/wuqi/coda/ending 各一份可续；不白屏 |
| T11-10 | 刷新 | 物资使用/状态/门板去向/救人数落档；刷新不重复扣物资 |
| T11-11 | 移动 | 844×390 物资面板/弹窗可操作；按钮 ≥44；无横向溢出 |
| T11-12 | 键盘/焦点 | 物资按钮/面板/确认/Esc；焦点陷阱 |
| T11-13 | 时长 | 11 结局每条约 ≤20:00；完整流程计时 |
| T11-14 | 回归 | 7 图鉴、五卡、名册、音频、章节卡、`file://` |
| T11-15 | 工具 | check-build/smoke/check-script 全绿；0 console/pageerror/失败请求 |

## 12. 实施记录（待回填）

- 2026-11-07：T11.0 设计定稿落库；代码/剧情/存档尚未按 v1.4 修改。
- 实现顺序：T11.1 数据/存档 → T11.2 物资 → T11.3 状态 → T11.4 结局 → T11.5 UI → T11.6–T11.10 剧情 → T11.11 迁移/名册 → T11.12 测试/文档/tag。
- 证据目录：`docs/evidence/step-11/`；截图命名 `ending-7-1.png` … `ending-bad.png`、`pack-4slots.png`、`status-warning.png`、`door-discard.png`、`legacy-v13.png`。
- `dist/` 不打包、不部署；分支 `v1.4-dev` 不合并 main。

## 13. v1.3 历史（只读）

v1.3 用 `strain` 0–3 计“救人消耗”，四路线：`sidao`（救 0，死 4，板到吴起）、`menban`（救 1，死 3，板到吴起）、`qiaoban`（救 1–2，死 3，无板；救 2 时林先生死）、`kongye`（救 3，你死，冬生背名册到吴起，满崽由冬生答）。v1.3 的结局页显示“结局1–4”。

v1.4 不再使用该判定；保留这段只为旧档/旧截图对照。旧 v1.3 结局快照补 `route:"legacy"`，不重算成 v1.4 路线。

## 14. 决策表 D1–D15

| 编号 | 决策 | 理由 |
|---|---|---|
| D1 | 状态用 0–4 整数；初始 3；最终 4 才算“一直优秀” | 只用有限档位，避免百分比；结局 A 用最终值，避免“每一秒”无法实现 |
| D2 | 行囊 4 格 = 8 个半格单位，内部用整数 | 0.5 格用浮点会累积误差；UI 显示 3.5/4 |
| D3 | 初始五件各一件，不做同种多份；冬生赠青稞单独标记 | 设计稿没有重复购买/叠加；赠品不占格，不能与普通青稞混存 |
| D4 | 配方严格按设计稿；单青稞/单药不能单独自用 | 避免“有药就永远能回血”；组合需要取舍 |
| D5 | 救人惩罚按“救人当时的门板状态”算，含本次用门板 | 用门板救人本身就是带板负担；顺序不影响结果 |
| D6 | 三人帮助在救满 3 人、状态降到 1 时自动触发一次；0 无效 | 帮助是“有人拉你一把”，不是复活；只一次 |
| D7 | 状态面板每次变化可开；差状态关闭 = 结算；0 不面板；7(5) 例外 | 差状态必须让玩家看见代价；0 直接死；7(5) 是设计例外 |
| D8 | doorOutcome = none/carried/bridge/grass/wuqi/others；doorCarried 派生 | 门板可以“留在桥上”“留在草地”“别人带到吴起”，不能只用一个布尔 |
| D9 | 门板 A/B/C 并列；草地不满足弹舍弃；7(5) 跳过 | 设计稿三条件；7(5) 是唯一他人带板 |
| D10 | 11 结局；1 救优秀归 7(1)，3 救存活归 7(3)，不新增标题 | 设计稿列了 5+5+1；边界收束到已有标题，避免第 12 种 |
| D11 | 林先生只在我死（7(5)/bad）时死；不再按救 2 人死 | 设计稿明确因果是“我死 → 她没等到收容队” |
| D12 | 坏结局不进吴起、names 0、companyEnd 18、五卡仍显示；7(5) 进 coda、8 名 | 坏结局是“没有走出草地”，不能假装到吴起；7(5) 是到吴起但我不在 |
| D13 | 存档新键 xiangbei.save.v2，保留 v1 原键；旧 ending 只读 | 迁移可回退；旧快照不能重算成新路线 |
| D14 | roster.v1 不改键；旧四路线页保留，新页追加 | 名册是跨版本记录，不因 v1.4 清空 |
| D15 | 不新增美术/音频；复用 grass_marsh/grass_dawn/wuqi_dawn/wuqi_wall | 本步是系统重写；没有新素材授权/体积预算 |
