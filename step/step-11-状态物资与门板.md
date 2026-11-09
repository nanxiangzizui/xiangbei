# 步骤十一 · 状态、物资与门板（v1.4.0-dev 执行卡）

> 性质：**执行计划与执行记录，不是状态源**。进度与步骤状态只看 `.claude/CLAUDE.md`；范围看 `向北-项目计划书.md`；v1.4 设计口径以 `docs/ending-routes.md` 为准。
> 写卡时间：2026-11-07；执行完成：2026-11-07（`v1.4-dev`）。执行前的运行时未动；执行后代码/剧情/存档/UI 已迁到 v1.4，`dist/` 仍未打包。
> 分支：`v1.4-dev`（从 `main` 的 `8fd0d9f` / tag `step-10-done` 切出）。`main` 保留 v1.3.0-dev，可随时回退；本步**不合并 main、不打包、不部署**。
> 版本口径：本步实现 v1.4.0-dev；线上 Netlify / GitHub Pages 仍是 v1.1.1 四关版。
> 冲突顺序：用户最新指令 > `向北-项目计划书.md` > `.claude/CLAUDE.md` > `docs/ending-routes.md` > 本卡。若本卡与设计稿冲突，先改设计稿，再动代码。

## 元信息

| 项 | 内容 |
|---|---|
| 所属步骤 | 十一 · 状态、物资与门板（v1.4.0-dev） |
| 对应计划书 | `向北-项目计划书.md`：v1.4 说明、玩法尺度、验收标准 |
| 设计来源 | 桌面 `改进.txt`（149 行，2026-11-07）；T11.0 重写为 `docs/ending-routes.md`，作为仓库内唯一设计稿 |
| 状态源 | `.claude/CLAUDE.md`（步骤表、当前进度、红线、验收表） |
| 回滚点 | `main` 的 `8fd0d9f`；tag `step-10-done`；本步开始前的 `dist/` 与线上不动 |
| 本步出口 | 4 格物资、状态 0–4、门板三条件、带板 5 种 + 无板 5 种 + 坏结局；旧 v1.3 档可续；移动/刷新/`file://` 可玩；测试、证据、提交与 `step-11-done` 完成；键盘专项与真人计时记 P1 |
| 时间盒 | 标准 900 分钟 / 压缩 600 分钟（见 §9） |
| 不可逆动作 | 合并 `main`、打包 `dist/`、部署上线、删除 `xiangbei.save.v1`、清空名册——**本步全部不做**；部署需用户单独确认 |
| 性质 | 数据模型重写 + 状态机 + 物资 UI + 剧情分支 + 存档迁移 + 测试/文档 |

## 本步完成定义

1. 行囊 4 格、半格重量、物资使用与组合可用：药/青稞 0.5，布鞋 1，铁锅/雨布/门板 2；总占格不超过 4；限时选项期间不能打开物资栏。
2. 状态 0–4（0/差/勉强/良好/优秀）完整：初始良好、救人降级、草地结束 -1、三人帮助一次、差警告、0 与差无恢复的坏结局、7(5) 例外。
3. 门板三条件 A/B/C 可判定；草地结束弹出“必须舍弃门板”；桥板/留草地/别人带到吴起三种去向可区分。
4. 带门板 5 种、不带门板 5 种、坏结局共 11 个结局收束；林先生只在我死（7(5) 或坏结局）时死；`companyEnd` 与点名人数正确。
5. 旧 v1.3 存档可继续，不白屏；旧结局快照只读不重算；名册回廊能累积新页，隐私模式降级提示。
6. 至少 11 个结局各走一次；844×390 触摸、键盘、刷新、`file://` 各跑一次；完整流程 ≤20:00；0 console error / 0 pageerror / 0 失败请求。
7. `check-build`、`smoke`、`check-script` 与新自动化通过；`docs/evidence/step-11/` 有记录；文档口径同步；提交并 tag `step-11-done`；`dist/` 未动。

> 任一没做到，只能写“有条件完成”，并在 `docs/evidence/step-11/run-log.md` 写例外与原因；不把“写了”说成“能玩”。

## 0. 分支、文件隔离与回滚

### 0.1 已执行（2026-11-07）

| 动作 | 结果 |
|---|---|
| 基线确认 | `main` = `8fd0d9f`，tag `step-10-done`，v1.3.0-dev |
| 创建分支 | `git switch -c v1.4-dev`，从 `8fd0d9f` 切出 |
| 文件隔离 | **同一工作树 + 分支隔离**：不复制第二份运行时，不在 `project/` 建 `v14/` 子目录；切回 `main` 即恢复 v1.3 |
| 未做 | 未合并 `main`、未打包 `dist/`、未部署、未改存档键、未清名册 |
| 旧版保留 | `main` / tag `step-10-done` / 当前线上 v1.1.1 均可回退 |

### 0.2 隔离规则

- 运行时代码仍然只在 `project/`：`index.html`、`style.css`、`engine.js`、`story.js`、`art.js`、`tools/`。不新建并行引擎、不复制 `story.js`。
- v1.4 的规格、剧本源、测试都在这条分支上改；`main` 的 v1.3 文件不被覆盖。
- 需要并行对照 v1.3 时，用只读方式：`git show main:project/engine.js` 或 `git worktree add` 到仓库外；**不把 v1.3 复制进 `project/`**。
- 每次只改一个变量：先数据模型，再状态机，再 UI，再剧情，再测试；不在同一提交里顺手改无关章节。
- 提交粒度：T11.0–T11.12 每个任务至少一次提交；最后 tag `step-11-done`。
- 回滚：`git switch main`；不要 `git reset --hard` 掉未提交的 v1.4 工作；实验分支可另开 `v1.4-spike`。

### 0.3 当前基线（v1.3.0-dev）

| 文件 | 现状 | v1.4 缺口 |
|---|---|---|
| `project/engine.js` | 34 旗标；`PACK_SLOTS=3`；`strain` 0–3；`routeOf` 四路线；ending 11 键；`roster.v1` | 状态 0–4、4 格/半格、门板三条件、11 结局、`save.v2` |
| `project/story.js` | 8 章 334 节点；16 个 choice；三次危机；coda；ending.routes 四路线 | p021/p024、l019、g018x、g026x、草地结算、吴起/coda、ending 全改 |
| `project/index.html` | HUD 只有章节/暂停；无状态/物资栏 | 状态 HUD、物资面板、差警告、门板弹窗 |
| `project/style.css` | 无状态/物资组件 | 新组件 + 手机横屏 |
| `docs/` | v1.3 四路线口径 | 设计稿、schema、bible、章节表、UI、测试全同步 |
| `project/tools/` | `_pw-step10.js` 按 strain 四路线写死 | 新建 `_pw-step11.js`；旧测试保留为历史 |

## 1. 任务总表与门禁

| ID | 任务 | 依赖 | 主要产出 | 门禁 |
|---|---|---|---|---|
| T11.0 | 口径冻结、设计稿落库、分支检查 | — | `docs/ending-routes.md` v1.4、决策表、`CLAUDE.md` 步骤十一 | G0 |
| T11.1 | 数据模型与存档 v2 | T11.0 | 旗标、物资、状态、门板去向、ending 快照、迁移 | G1 |
| T11.2 | 物资引擎与 4 格容量 | T11.1 | `ITEM_WEIGHTS`、`packUsage`、`useItem`、组合配方 | G1 |
| T11.3 | 状态机与三人帮助 | T11.1/T11.2 | 救人降级、草地 -1、帮助、差警告、0/坏、7(5) | G1 |
| T11.4 | 结局矩阵与路线判定 | T11.1/T11.3 | `routeOf`、`buildEnding`、11 结局、companyEnd、Lin | G1 |
| T11.5 | 状态 HUD、物资面板、弹窗 | T11.2/T11.3 | `index.html` + `style.css` | G2 |
| T11.6 | 序章 p021/p024 与开局物资 | T11.2/T11.5 | 4 格选择、开局提升面板、门板 weight | G2 |
| T11.7 | 泸定飞毛腿危机 | T11.3/T11.6 | 门板/药/不救；桥板去向 | G2 |
| T11.8 | 草地灶王/冬生危机 | T11.7 | 青稞/锅；鞋/雨布；赠青稞 | G2 |
| T11.9 | 草地结算、门板舍弃、坏/7(5) | T11.8 | 状态结算、门板三条件、bad/others 出口 | G2/G3 |
| T11.10 | 吴起、coda、点名、林先生 | T11.4/T11.9 | 林分支、companyEnd、7(5) 八名 | G3 |
| T11.11 | 旧档迁移与名册兼容 | T11.1/T11.10 | v1.3 档、ending legacy、roster 旧页 | G3 |
| T11.12 | 测试、时长、证据、文档、tag | 全部 | `_pw-step11.js`、run-log、check 工具、tag | G4/G5 |

### 门禁

| 门禁 | 通过条件 | 不通过时 |
|---|---|---|
| G0 口径 | 设计稿 v1.4 已落库；D1–D15 决策已写；计划书/story-bible/CLAUDE/cursor 同一口径；`git diff` 只有文档 | 停，不改代码 |
| G1 引擎 | 旗标/物资/状态/路线/迁移的单元检查与 `check-build` 新检查全绿 | 停，不写剧情/UI |
| G2 剧情/UI | 4 格可用；状态面板可用；p021/p024、l019、g018x、g026x 可玩；至少一个结局可达 | 停，不接草地结算 |
| G3 结局/存档 | 11 结局可达；林/人数/点名一致；旧档可续；名册旧页可读 | 停，不实测时长 |
| G4 实测 | 11 结局各一次；完整流程 ≤20:00；移动/键盘/刷新/`file://`/0 error 通过 | 只写有条件完成 |
| G5 交接 | 证据、文档、提交、tag 完成；`dist/` 未动；未合并 main | 不宣布完成 |

## 2. v1.4 口径冻结

> 本节是执行口径；T11.0 会把它并入 `docs/ending-routes.md`，并同步 `state-schema`。代码以本节为准。

### 2.1 状态

- 状态从高到低：**优秀 4 / 良好 3 / 勉强 2 / 差 1 / 0**；初始 3。
- 显示在左上角，标签“我”；状态变化用文字 + 颜色，不用百分比条。
- 初始 → 每次救人降级 → 草地结束 -1 → 三人帮助（一次）→ 差警告/物资 → 0/坏结局 → 门板与结局。
- “一直优秀”按**最终结算时状态为 4**判定；不是每一秒都必须是 4。
- 状态到 0：立即坏结局；唯一例外是 7(5)。
- 状态到 1：先触发三人帮助（若可用）；仍为 1 则弹物资栏警告；拒绝/无可用物资 → 坏结局（7(5) 例外）。

### 2.2 物资

| 物资 | 占格 | 半格单位 | 用途 | 备注 |
|---|---:|---:|---|---|
| 药 | 0.5 | 1 | 救飞毛腿；与青稞/冬生青稞组合 | 消耗品 |
| 青稞 | 0.5 | 1 | 救灶王；与药/冬生青稞组合 | 消耗品 |
| 布鞋 | 1 | 2 | 救冬生；自己用 +1 | 消耗品 |
| 铁锅 | 2 | 4 | 救灶王；自己用 +2 | 消耗品 |
| 雨布 | 2 | 4 | 救冬生；草地自己用 +1 | 物资栏只在草地可用；剧情遮雨不算使用 |
| 门板 | 2 | 4 | 铺桥/挡桥/床板/写字 | 物资栏始终不可使用 |
| 花名册/铅笔 | 0 | 0 | 剧情基座 | 不占格 |

- 行囊 **4 格 = 8 个半格单位**；总占格 ≤4。
- 物品种类不限，但初始 p024 每件只有一件；不做同种多份。
- 物资栏随时可开；**限时选项进行期间禁止打开**；选项结算后、状态变化时再弹。
- 其他物资在状态 **良好及以下** 可用；优秀时不可用（不需要）。
- 组合配方（严格按设计稿）：
  - 药 + 青稞：+1
  - 青稞 + 冬生赠青稞：+2
  - 药 + 冬生赠青稞：+1
  - 布鞋：+1
  - 雨布：+1
  - 铁锅：+2
  - 门板：不能为自己使用
- **单份青稞/单份药不能单独为自己使用**；它们要么用于救人，要么按上面的组合使用。UI 必须在按钮上写“需要与……同用”，不能静默失效。
- 冬生获救后赠一份青稞：不占行囊，存 `inventory.giftBarley=true`；只能当场使用或与自己的青稞/药组合；剧情必须写出来。

### 2.3 救人、状态与被救者

| 危机 | 可用物资 | 被救者状态 | 不救 |
|---|---|---|---|
| 飞毛腿（泸定） | 门板（铺桥）/ 药 | 门板 → 良好；药 → 勉强 | 死 |
| 灶王（草地） | 青稞 / 铁锅 | 青稞 → 勉强；铁锅 → 良好 | 死 |
| 冬生（草地） | 布鞋 / 雨布 | 两者 → 良好 | 死 |

- v1.4 **取消** v1.3 的“替蹲风口/背他走”用身体救人选项；身体代价改为状态与三人帮助。
- 救人计数 `rescues` 0–3；每次成功救人 +1。
- 状态惩罚按**救人时的门板状态**：
  - 无门板：救 1 不变；救第 2 人 -1；救第 3 人不变。
  - 有门板（含本次用门板救人）：救 1 不变；救第 2 人 -1；救第 3 人再 -1。
- 草地结束再 -1。
- 救满 3 人后，三人帮助只触发一次：状态因惩罚降到 1 时自动 +1 到 2；降到 0 无效。触发后 `help.used=true`，本局不再触发。
- 若差警告时帮助尚未触发，先帮助；帮助后不是 1，不弹警告。
- 被救者状态只用于门板条件；老周/何指导员/细妹/林先生不进入这套状态表。

### 2.4 门板

- `had.door`：出发时是否带门板（p021 A true / B false）。
- `doorOutcome`：`none | carried | bridge | grass | wuqi | others`。
  - `carried`：当前背着，`item.door=true`。
  - `bridge`：泸定铺桥，门板留在桥上。
  - `grass`：草地舍弃，门板留在草地。
  - `wuqi`：到吴起后留在墙边（w013 A）。
  - `others`：7(5) 我死在草地，门板由他人带到吴起。
- `doorCarried = had.door && (item.door || doorOutcome==="wuqi" || doorOutcome==="others")`。
- 带出条件（并列，任一）：
  - A：最终状态 = 优秀（4）。
  - B：算上我共 4 人存活，且至少 1 名被救者良好。
  - C：算上我共 3 人存活，且 2 名良好（我可计入）。
- 草地结束若 A/B/C 全不满足且不是 7(5)：弹“必须舍弃门板”，点击后 `doorOutcome="grass"`、`item.door=false`，继续。
- 7(5) 例外：救 3 人、出发带门板、我死在草地；门板由他人带到吴起，不弹舍弃。
- 桥板/石墙：`doorOutcome==="bridge"` 时，若门板没带出，结局标题用“桥板”，lede 写“门板留在了桥上”；不再另开 v1.3 的 qiaoban 路线。

### 2.5 结局矩阵（代码以本表为准）

> 先判死，再判无板，再判带板；每一行互斥。

| # | route id | 页面标签 | 条件 | 门板 | 我 | companyEnd | names |
|---:|---|---|---|---|---|---:|---:|
| 1 | `door_excellent` | 7(1) | `had.door && !player.dead && doorCarried && condition===4 && rescues<=1` | 带出 | 活 | 19 | 7 |
| 2 | `door_grass_one` | 7(2) | `had.door && !player.dead && !doorCarried && rescues<=1` | 留草地/桥 | 活 | 19 | 7 |
| 3 | `door_carry_two` | 7(3) | `had.door && !player.dead && doorCarried && rescues>=2` | 带出 | 活 | 19 | 7 |
| 4 | `door_grass_many` | 7(4) | `had.door && !player.dead && !doorCarried && rescues>=2` | 留草地/桥 | 活 | 19 | 7 |
| 5 | `door_others` | 7(5) | `had.door && player.dead && rescues===3` | 他人带出 | 死 | 18 | 8 |
| 6 | `no_door_zero` | 8(1) | `!had.door && !player.dead && rescues===0` | 无 | 活 | 19 | 7 |
| 7 | `no_door_one` | 8(2) | `!had.door && !player.dead && rescues===1` | 无 | 活 | 19 | 7 |
| 8 | `no_door_two` | 8(3) | `!had.door && !player.dead && rescues===2` | 无 | 活 | 19 | 7 |
| 9 | `no_door_three` | 8(4) | `!had.door && !player.dead && rescues===3 && condition<4` | 无 | 活 | 19 | 7 |
| 10 | `no_door_three_excellent` | 8(5) | `!had.door && !player.dead && rescues===3 && condition===4` | 无 | 活 | 19 | 7 |
| 11 | `bad_end` | 坏结局 | `player.dead && !(had.door && rescues===3)` | 无/留 | 死 | 18 | 0 |

补充：

- 7(1) 的“0 人获救”是设计主例；实现按“带出 + 优秀”收束，救 1 人且优秀也归 7(1)，文案不写“0 人”，避免出现第 6 种门板路线。
- 7(3) 的“救 2 人”是设计主例；救 3 人但活着且满足 B 时也归 7(3)，文案不写“2 人”，避免出现未定义路线。
- 7(2)/7(4) 若 `doorOutcome==="bridge"`，标题用“桥板”，否则“门板留在草地”；两者共用 route id。
- 7(5) 走 coda：8 名（含满崽），companyEnd 18，林先生 absent。
- 坏结局不走吴起点名：names 为空，companyEnd 18，ending 页显示“没有走出草地”和林先生因果；五卡仍渲染，按条件亮/灰。
- 结局顺序号 `routeIndex` 1–11；页面同时显示 `7(1)` 这类设计标签，避免和 v1.3 的 1–4 混淆。
- 五卡条件沿用 v1.3；`sacrifice` 改为 `player.dead || choice.xiangjiang.hold`；其余不变。
- 没有“最优/次优/成就/百分比”；“革命的情谊”只保留事件文本。

### 2.6 林先生

- 林先生只在我死时死：7(5) 或坏结局。
- 直接原因：她为了等我、找我，没等到收容队。
- 其他路线林先生活；不再按“救 2 人必死”处理。
- 吴起/coda 要写因果：`w022a`“念到林先生。没有人应。她没等到收容队。”；7(5) coda 和坏结局 ending 都要有对应句子。
- `fate.lin.dead = fate.player.dead`，不再由 strain/condition 派生。

### 2.7 决策表 D1–D15

| 编号 | 决策 | 理由 |
|---|---|---|
| D1 | 状态用 0–4 整数；初始 3；最终 4 才算“一直优秀” | 只用有限档位，避免百分比；结局 A 条件用最终值，避免“每一秒”无法实现 |
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

## 3. 数据模型

### 3.1 旗标

在 v1.3 34 旗标基础上增/改：

| 旗标 | 类型 | 默认 | 写点 | 说明 |
|---|---|---:|---|---|
| `condition` | 0–4 | 3 | engine 状态函数 | 当前状态；0 死/坏 |
| `rescues` | 0–3 | 0 | engine 救人函数 | 成功救人数 |
| `help.used` | bool | false | engine 帮助函数 | 三人帮助只一次 |
| `memory.help` | bool | false | engine 帮助函数 | 给剧情一句“他们把我架起来” |
| `fate.player.dead` | bool | false | engine 死亡函数 | 我是否死 |
| `fate.lin.dead` | bool | false | engine 死亡函数 | = player.dead；旧档迁移 |
| `quality.feimao` | 0/2/3 | 0 | 救人函数 | 0 死/未救，2 勉强，3 良好 |
| `quality.zaowang` | 0/2/3 | 0 | 同上 |  |
| `quality.dongsheng` | 0/2/3 | 0 | 同上 |  |
| `doorOutcome` | enum | `none` | 剧情/结算 | 门板去向 |
| `had.door` | bool | false | p021 | 出发是否带板 |
| `inventory.giftBarley` | bool | false | 冬生获救 | 不占格 |
| `strain` | 0–3 | 派生 | 旧档兼容 | 不再驱动剧情；新档可由 rescues 反推 |
| `fate.all.dead` | bool | false | 派生 | 三个危机全死；w027b/c 用 |

- 保留 v1.3 的 `fate.feimao.dead` 等，作为 quality 的镜像；新代码优先读 quality，旧剧本可继续读 fate。
- `FLAG_LIMITS`：condition [0,4]、rescues [0,3]、quality [0,3]、strain [0,3]。
- `FLAG_PREFIXES` 增 `quality.`；`FLAG_KEYS` 增 condition/rescues/help.used/fate.player.dead/doorOutcome。
- `syncDerivedFlags` 只做：condition 夹取；strain=3-rescues（新档）；fate.lin.dead=player.dead；fate.all.dead=三个 dead；不再写 strain.hurt/dying 作为主逻辑（保留旧键兼容）。

### 3.2 物资

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
- `p024` 不再用 `maxWhen`，改用 `canAddMultiOption(state, option)`：加入后总 units ≤8。
- `applyMultiChoice` 用同一函数；UI 与结算不能各算一套。
- `buildResultView` 的 items 分支改 4 格；超过 4 的旧档显示 `used/max(4,used)`，不裁剪。

### 3.3 结局快照

`ending` 在 v1.3 11 键上增：

| 键 | 类型 | 说明 |
|---|---|---|
| `route` | string | 11 个 route id 之一；旧档 `legacy` |
| `routeIndex` | 1–11 | 顺序号 |
| `routeLabel` | string | `7(1)`…`8(5)`/`坏结局` |
| `routeTitle` | string | 门板/桥板/空手/没有走出草地 |
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

### 3.4 存档

- 新键：`xiangbei.save.v2`；旧 `xiangbei.save.v1` 保留不删，用于迁移与 v1.3 回退。
- `SAVE_VERSION=2`；先读 v2，坏档备份 `.bad` 后尝试 v1；v1 迁移成功后写 v2，v1 原样保留。
- 迁移：
  - `rescues = 3 - strain`（夹 0–3）；`condition = 3 - strain`（strain3 → 0；旧空页已死）。
  - `fate.player.dead`：旧 ending/coda/route kongye → true；否则 false。
  - `fate.lin.dead = fate.player.dead || 旧 fate.lin.dead`。
  - `had.door`：旧 choice.prologue.door || item.door || choice.luding.door。
  - `doorOutcome`：item.door → carried；memory.door → wuqi；choice.luding.door → bridge；had.door && !item.door → grass；否则 none。
  - `quality.*`：fate.*.dead false → 2（保守）；true → 0。
  - `help.used=false`；`memory.help=false`。
  - 旧 ending 快照保留 route/routeTitle/routeLede，补 `route:"legacy"` 和 `routeLabel:"旧档"`，不重算。
- 旧 v1.3 档在 wuqi/coda/ending 各留一份样本；迁移后必须能继续/显示。
- 名册 `xiangbei.roster.v1` 继续用；旧四路线页保留，新页追加，不重写旧页。最多 8 页，丢最旧。

## 4. 文件级改造清单

| 文件 | 任务 | 改什么 | 验收 |
|---|---|---|---|
| `project/engine.js` | T11.1–T11.5/T11.11 | 旗标、物资、状态、路线、ending、save v2、HUD/面板逻辑、迁移 | 单元 + check-build |
| `project/story.js` | T11.6–T11.10 | p021/p024、l019、g018x、g026x、草地结算、吴起、coda、badend、ending | 11 结局可达 |
| `project/index.html` | T11.5 | 状态 HUD、物资按钮/面板、警告/门板弹窗、bad ending 空名单 | 浏览器 |
| `project/style.css` | T11.5 | 状态、物资、弹窗、手机横屏 | 844×390 |
| `docs/ending-routes.md` | T11.0 | 整体替换为 v1.4 矩阵/状态机/物资/门板/林 | 与代码一致 |
| `docs/state-schema.md` | T11.0/T11.11 | 旗标、inventory、ending、save v2、迁移、roster | 与 normalize 一致 |
| `docs/story-bible.md` | T11.0/T11.10 | 章节表、人物命运、状态/物资规则 | 与剧本一致 |
| `docs/chapter-integration.md` | T11.10 | 节点数、choice、coda/badend | 与 story.js 一致 |
| `docs/ui-layout.md` | T11.5 | 状态/物资/弹窗坐标 | 与 index/style 一致 |
| `docs/test-cases.md` | T11.12 | v1.4 用例 | 与测试矩阵一致 |
| `docs/quality-bar.md` | T11.5 | 热区/滚动/性能 | 移动验收 |
| `docs/script/00,04,05,06,07` + README | T11.6–T11.10 | 剧本源同步 | 与 story.js 逐句一致 |
| `docs/script/01,02,03` | T11.6 | 仅当物资/状态写入正文时改 | 不强行加戏 |
| `README.md` / `向北-项目计划书.md` / `.claude/CLAUDE.md` / `.cursor/rules/xiangbei.mdc` | T11.0/T11.12 | v1.4 口径与步骤状态 | 口径一致 |
| `project/tools/check-build.js` | T11.12 | 新旗标/重量/状态/11 结局/迁移检查 | 全绿 |
| `project/tools/smoke.js` | T11.12 | 旗标数、p024 容量、点名、路线 | 全绿 |
| `project/tools/check-script.js` | T11.12 | v1.4 危机/门板/状态规则 | OK |
| `project/tools/_pw-step10.js` | T11.12 | 保留历史；不强行改 | 不参与 v1.4 门禁 |
| `project/tools/_pw-step11.js` | T11.12 | 新建 v1.4 浏览器矩阵 | 11 结局 + 移动/旧档 |
| `project/tools/ui-preview.html/js` | T11.5 | 状态/物资/弹窗预览 | 视觉检查 |
| `project/art.js` | 不改 | 复用 grass_marsh/grass_dawn/wuqi_dawn/wuqi_wall | 无新素材 |
| `project/assets/`、`docs/codex.md`、`docs/sources.md`、`dist/` | 不改 | 史实/素材/发布包 | 不动 |

## 5. 剧情节点计划

### 5.1 序章

- `p021`：保留门板单选；A `had.door=true`、`item.door=true`、`doorOutcome="carried"`、`load` 不再写 +2；B `had.door=false`、`doorOutcome="none"`。cost 文案改为 4 格口径（“行囊只剩两格，多背三十斤”）。
- `p024`：4 格多选；五件 `slots` 改 0.5/0.5/2/2/1；删除 `maxWhen`；prompt“娘把五样东西摆在桌上。行囊四格；带门板，占两格。”；status 显示“已占 X/4 格”。
- `p024` 结算：buildResultView 显示 4 格、门板 2 格、半格；不裁剪旧档。
- `p024` 后：开局状态面板“你当前的状态为良好，是否使用物资将状态提升至优秀？”；关闭不惩罚；使用后按配方结算。
- 新增 `p024a`（可选）：“我把行囊系紧。四格，满了。”；不带门板时另有句子。

### 5.2 泸定

- `l019`（`when:"item.door"`，12s，默认 C“抱着门板先过桥”）：
  - A 铺桥：`item.door=false`、`doorOutcome="bridge"`、`trust+1`、救飞毛腿（良好）、`rescues+1`；不写 `strain`。
  - B 喂药（`requires:"item.medicine"`）：消耗药、救飞毛腿（勉强）、`rescues+1`。
  - C 抱板走：`fate.feimao.dead=true`、`quality.feimao=0`、`memory.fly_leave=true`。
- `l019x`（`when:"!item.door && !choice.luding.door"`，12s，默认 B“继续走”）：
  - A 喂药（requires medicine）：消耗药、救（勉强）、`rescues+1`。
  - B 继续走：死。
- 新增 `l019c`（`memory.fly_medicine`）：“我把药敷在他背上。他咬住号嘴，没出声。”
- 新增 `l019d`（`fate.feimao.dead`）：“我过了桥。回头的时候，桥那头已经没有人。”
- `l022/l023/l024/l025/l026` 保留 `when:"fate.feimao.dead"`；`l022a/l024a` 活分支按 v1.3 文本，但“救”改由 quality 判断。
- 门板铺桥后，`l019x` 不得在同一回合二次出现（保留 `!choice.luding.door`）。

### 5.3 草地

- `g018x`（灶王，16s，默认 D“不救”）：
  - A 青稞（requires item.barley）：消耗青稞、救（勉强）、`rescues+1`、`memory.zaowang_barley`。
  - B 铁锅（requires item.homepot）：消耗锅、救（良好）、`rescues+1`、`memory.zaowang_pot`。
  - C 不救：`fate.zaowang.dead=true`、`quality.zaowang=0`。
- `g026x`（冬生，12s，默认 C“不救”）：
  - A 布鞋（requires item.shoes）：消耗鞋、救（良好）、`rescues+1`、`memory.dongsheng_shoes`。
  - B 雨布（requires item.raincloth）：消耗雨布、救（良好）、`rescues+1`、`memory.dongsheng_cloth`。
  - C 不救：`fate.dongsheng.dead=true`、`quality.dongsheng=0`。
  - 不再有“背他走/替蹲风口”选项。
- 冬生获救后新增 `g026y`：“冬生把一小袋青稞塞给我。他说，这个不占地方。”；engine 置 `giftBarley=true`。
- 死亡段 g019–g023b 保留 v1.3 的 `fate.zaowang.dead` 守卫；g021 用 dead && item.homepot；g021b 用 dead && !item.homepot。
- `g028a/g028b` 保留；新增 `g028h`（`memory.help`）“三个人把我从地上架起来。谁也没说话。”。

### 5.4 草地收束

执行顺序固定：

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
   - 坏结局 → `badend` 隐藏章（新增）。
   - 其余 → `wuqi`（g900）。

新增/改节点：

- `g028d`“走出草地那天，我走不动了。”——`when:"strain.dying"` 改为 `when:"fate.player.dead"` 或由 engine 直接进 7(5)，不再用 strain。
- `g028e/f/g` 保留为 7(5) 的我死段落；由 `fate.player.dead` 守卫。
- `g029` title 加 `when:"!fate.player.dead"`。
- `g030` grass codex 无条件，放在所有出口前。
- `g899` end `next:"coda"`，`when:"fate.player.dead && had.door && rescues===3"`。
- `g900` end `next:"wuqi"`，`when:"!fate.player.dead"`。
- 新增 `g898` end `next:"badend"`，`when:"fate.player.dead && !(had.door && rescues===3)"`。

### 5.5 吴起与 coda

- `w006b` `!item.door && !fate.lin.dead`；`w006c` `!item.door && fate.lin.dead`（石墙标语是林先生写的）。
- `w014b` 加 `!fate.lin.dead`；`w014c` 林死“她没有来。”
- `w015c/w016c` 加 `!fate.lin.dead`；`w015d/w016d` 林死 + 无门板 + !memory.door。
- `w022` `!fate.lin.dead`；`w022a` 林死“念到林先生。没有人应。她没等到收容队。”
- `w024` 灶王死；`w024a` 灶王活。
- `w025` 飞毛腿死；`w025a` 飞毛腿活。
- `w026` 删静态 names，保留 mode rollcall/duration 45；engine 按 fate/quality 动态生成 7 名。
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

### 5.6 ending 文案

- `story.ending.routes` 扩为 11 个 route 的 title/lede；`routeLabel`/index 由 engine 映射，不写进 story 也可，但必须单源。
- `kongyeSacrificeLine` 改为通用“你把自己，留在了草地尽头。”，7(5) 与坏结局都可复用；若坏结局不用，保留空页句。
- 五卡不变；sacrifice 条件改 `player.dead || choice.xiangjiang.hold`。
- 林先生因果句：7(5) “林先生没有等到收容队。”；坏结局“她留在草地找我。”。

## 6. UI/交互

### 6.1 状态 HUD

- 位置：左上角 `vn-chapter` 下方；标签“我”，值“良好”；状态变化时 aria-live。
- 颜色：优秀/良好墨绿或朱砂？沿用纸墨；差/0 用朱砂，不闪烁。
- 状态变化立即更新；不显示数值 0–4，不显示百分比。

### 6.2 物资按钮/面板

- `#vn-pack-button`：常驻（VN 场景），显示“物资 3/4”；限时选项时 `disabled`，	extbf{不隐藏}，避免布局跳动。
- `#vn-pack`：覆盖层 dialog；标题“物资”；容量“已占 X/4 格”；列表：
  - 每件：名称、占格、描述、“使用”按钮/禁用原因。
  - 门板：占 2 格，“不可使用”；雨布：非草地禁用“只能在草地使用”；优秀时禁用“状态已足够”；差/0 时按规则。
  - 组合：药/青稞/冬生青稞的按钮旁写“与……同用”；不能选不存在的组合。
- 状态变化自动开面板时，顶部显示“状态：差”或“状态变化”；关闭按钮在差状态触发结算，不是普通关闭。
- 开局面板：标题“出发前”，文案“你当前的状态为良好，是否使用物资将状态提升至优秀？”；关闭不惩罚。

### 6.3 差警告/门板弹窗

- 差警告：复用物资面板，顶部朱砂提示“你现在是‘差’。不用物资，就走不出去。”；底部“继续（不使用）”按钮；点击后 engine 判坏/7(5)。
- 门板弹窗：独立小弹窗，文案“由于你体力透支，或帮手不足，无法将门板带到终点，你必须舍弃。”；按钮“舍弃门板”；点击后继续。
- 7(5) 不弹门板弹窗。

### 6.4 结局页

- `#ending-route` 显示“结局7(1)（门板） · lede”；坏结局“坏结局 · 没有走出草地”。
- names 为空时隐藏点名列，显示“名册没有翻到吴起。”；stats 仍显示 companyEnd 18。
- 五卡保留；坏结局也显示，按条件亮/灰。
- 名册回廊旧页/新页混排；旧页 title 前加“旧档”小标记？可选，不改旧数据。

### 6.5 移动/键盘

- 844×390：状态 HUD 字号 ≥14 CSS px；物资面板单列可滚；按钮 ≥44 CSS px；门板/警告弹窗可滚。
- 键盘：物资按钮 Tab 可达；面板 Esc 关闭（差状态关闭 = 结算）；数字键 1–5 切换物资？可选用；不做复杂快捷键。
- 限时选项：物资按钮禁用；面板若已开，选项开始时强制关闭。
- `prefers-reduced-motion`：状态变化不抖动，只换字。

## 7. 测试矩阵

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

## 8. 证据

- `docs/evidence/step-11/`：每个结局截图、物资面板、状态警告、门板弹窗、移动、旧档、run.log、result.json。
- 截图命名：`ending-7-1.png` … `ending-bad.png`、`pack-4slots.png`、`status-warning.png`、`door-discard.png`、`legacy-v13.png`。
- 证据分级：A 浏览器实测；B 代码完成未跑；C 设计稿；D 未验证。没有跑就写“未验证”。

## 9. 时间盒

| 阶段 | 标准 | 压缩 |
|---|---:|---:|
| T11.0 设计落库 | 60 | 40 |
| T11.1 数据/存档 | 90 | 60 |
| T11.2 物资引擎 | 120 | 80 |
| T11.3 状态机 | 120 | 80 |
| T11.4 结局矩阵 | 90 | 60 |
| T11.5 UI | 120 | 80 |
| T11.6 序章 | 45 | 30 |
| T11.7 泸定 | 60 | 40 |
| T11.8 草地危机 | 75 | 50 |
| T11.9 草地结算 | 90 | 60 |
| T11.10 吴起/coda | 75 | 50 |
| T11.11 迁移/名册 | 60 | 40 |
| T11.12 测试/文档/tag | 90 | 60 |
| **合计** | **1095** | **730** |

> 标准 900 / 压缩 600 是**外部承诺**；上表是任务估算，允许并行压缩。超过 900 分钟未过 G3，先砍“坏结局专属文本/名册旧页标记”，不砍状态机与 11 结局判定。

## 10. 验收清单

- [ ] 4 格/半格物资可用，p024 带板剩 2 格。
- [ ] 物资组合/使用/禁用原因正确；限时选项锁物资栏。
- [ ] 状态 0–4、救人降级、草地 -1、三人帮助、差警告、0/坏、7(5) 全部实测。
- [ ] 门板三条件 A/B/C；草地舍弃弹窗；桥板/草地/他人带出区分。
- [ ] 11 结局各一次；routeLabel、companyEnd、names、林先生因果一致。
- [ ] 旧 v1.3 档可续；v2 存档写入；名册旧页可读。
- [ ] 844×390、键盘、刷新、`file://` 通过；0 console error/pageerror/失败请求。
- [ ] 完整流程 ≤20:00（至少 3 次）。
- [ ] check-build、smoke、check-script、`_pw-step11.js` 全绿。
- [ ] 文档同步；`dist/` 未打包；未合并 main；tag `step-11-done`。

## 11. 风险与返工触发

| 风险 | 触发 | 处理 |
|---|---|---|
| 设计稿边界组合未定义（1 救优秀、3 救存活） | route 表出现未覆盖 | 按 §2.5 收束到 7(1)/7(3)，文案不写人数；不改 5 类 |
| 4 格导致 7(3) 不可达 | 实测 p024 无法带门板+药+鞋+青稞 | 检查 weights；门板 2 + 0.5+1+0.5=4，必须可达 |
| 状态面板刷屏 | 每次救人/草地都弹 | 面板可关闭；只有差/0 强制结算；不做每句弹 |
| 旧档迁移错 | v1.3 档白屏/路线错 | 保留 v1 原键；v2 失败回退 v1；旧 ending 只读 |
| 20 分钟超时 | 新文本+面板拖长 | 先删重复句，不删危机/结算；坏结局文本可最短 |
| 测试假绿 | 只跑旧 `_pw-step10` | 新建 `_pw-step11.js`；旧测试只做回归 |
| 文档分叉 | 代码改了 docs 没改 | 每个任务提交前同步对应 docs；G0/G5 检查 |

## 12. 禁区

- 不改历史终点：湘江败、遵义开、泸定夺、到吴起不变。
- 不虚构真实领导人对话；不新增史实争议；7 张图鉴不改。
- 不做好感度、攻略、真结局、结局百分比、分支存档树、战斗/养成/商店。
- 不新增美术/音频；不打包、不部署、不合并 main。
- 不复制第二份 `engine.js/story.js`；不建 `v14/` 运行时。
- 不把门板做成可消费道具；门板只在剧情里铺桥/挡桥/床板/写字。
- 不把“救 3 人”写成全员到齐；没有全活。

## 13. 交接接口

- `engine.js` 导出：`ITEM_UNITS`、`PACK_SLOTS`、`PACK_UNITS`、`packUsage`、`canAddMultiOption`、`usePackItems`、`settleGrass`、`resolveGrassWarning`、`settleDoor`、`routeOf`、`buildEnding`、`resolveRollCall`。
- `story.js` 只写作者数据：`choice/requires/set/rescue`、`fate/quality`、`doorOutcome`；不在剧本里重复状态公式。
- `index.html/style.css` 只读 `XB.core` 的展示状态；不自己算路线/容量。
- 测试用 `?debug=1` 读 `node/type/chapter/condition/rescues/door`；新增 debug 行。
- 下游 `docs/script` 与 `story.js` 逐句一致；`count-words.js` 只统计文本，不改代码。

## 14. 复核记录（执行时回填）

| 日期 | 任务 | 证据 | 结论 |
|---|---|---|---|
| 2026-11-07 | 分支创建 | `git branch --show-current` = v1.4-dev；HEAD 8fd0d9f | 完成 |
| 2026-11-07 | T11.0 | `docs/ending-routes.md` v1.4 定稿；CLAUDE/cursor/计划书/state-schema/story-bible 口径 | 完成 |
| 2026-11-07 | T11.1–T11.5 | save v2 + v1 迁移、4 格/半格物资、状态 0–4、11 结局、状态 HUD/物资面板/门板弹窗 | 完成 |
| 2026-11-07 | T11.6–T11.10 | 序章 4 格、泸定/草地三次危机、草地结算、吴起/coda/badend；`docs/script` 00–08 逐句一致 | 完成 |
| 2026-11-07 | T11.11–T11.12 | routes 123/123、crises 64/64、coda 20/20、pack 26/26、migration 21/21、refresh 15/15、mobile 13/13、flow http 12/12（150s）/file 12/12（149s）；check-build 39/39、smoke 46/46、check-script OK | 完成；T11-12 键盘专项、T11-13 真人计时为 P1 |
| 2026-11-07 | 打包/部署 | `dist/` 未重打包；Netlify/GitHub Pages 仍 v1.1.1 | 按本步禁区，未做 |
| 2026-11-09 | T11-26 草地尽头门板补给窗 | `_pw-step11.js --case=doorsupply` 44/44；`docs/evidence/step-11/doorsupply-e2e`；condition 3 + 锅 → 4 → `doorOutcome=carried`，随后连续实走 g028b→终章→吴起 w001–w040→w041→结局 1/11（点名 7、五卡 5、快照 `door_excellent`）；不用/补不到 4 → grass → 2/11；刷新重开窗口 | 完成；1/11 端到端可达，含结局截图 |

---

**开始顺序**：T11.0 设计落库 → T11.1 数据/存档 → T11.2 物资 → T11.3 状态 → T11.4 结局 → T11.5 UI → T11.6–T11.10 剧情 → T11.11 迁移 → T11.12 测试/tag。任何一步 G 门禁不过，停在该步，不把“写了”说成“能玩”。
