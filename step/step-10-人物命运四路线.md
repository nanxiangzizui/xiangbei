# 步骤十 · 人物命运四路线（v1.3.0-dev 执行卡）

> 性质：**执行计划，不是状态源**。进度与步骤状态只看 `.claude/CLAUDE.md`；范围看 `向北-项目计划书.md`；设计口径看 `docs/ending-routes.md`（本卡修正其中与代码不符的笔误）。
> 写卡时间：2026-11-06。写卡时**没有改运行时**：`story.js`、`engine.js`、`index.html`、`style.css`、存档键与 `dist/` 都未动。
> 版本口径：本步实现 v1.3.0-dev；线上 Netlify / GitHub Pages 仍是 v1.1.1 四关版，`dist/` 未重打包，**本步不部署**。
> 冲突顺序：用户最新指令 > `向北-项目计划书.md` > `.claude/CLAUDE.md` > `docs/ending-routes.md` > 本卡。若本卡与设计稿冲突，先按本卡 §1.2 回改设计稿，再动代码。

## 元信息

| 项 | 内容 |
|---|---|
| 所属步骤 | 十 · 人物命运四路线（v1.3.0-dev） |
| 对应计划书 | `向北-项目计划书.md`：v1.3.0 说明、玩法尺度、验收标准 |
| 设计稿 | `docs/ending-routes.md`（四路线、人数账本、coda、名册回廊） |
| 状态源 | `.claude/CLAUDE.md`（步骤表、当前进度、红线 11/12、验收表） |
| 回滚点 | tag `step-9-done`；本步开始前保留当前 v1.2.0-dev 本地构建与一份旧档样本 |
| 本步出口 | 四条人物命运路线可从标题走到结局；三次危机可玩；空页 coda；名册回廊；旧档可续；20 分钟内；移动/离线可玩；证据与 tag 完成 |
| 时间盒 | 标准 600 分钟 / 压缩 420 分钟（见 §7） |
| 不可逆动作 | 打包 `dist/`、部署上线、重置存档键、删除旧档——**本步全部不做**；部署需用户单独确认 |
| 性质 | 引擎小改 + 剧情分支 + 一个标题页弹窗 + 存档迁移 + 测试/文档 |

## 本步完成定义

1. 四条路线（`sidao` / `menban` / `qiaoban` / `kongye`）都能从标题走到结局，结局标题与末句按路线显示；**没有全活路线**。
2. 三次危机（泸定飞毛腿、草地灶王、草地冬生）都能用品/用身体/不救三种代价处理；限时超时按“不救”结算；刷新不重复计 `strain`。
3. 吴起与空页点名与账本一致：7/8 个名字、应到/未到/替答正确；`companyEnd` 空页 18、其余 19；五张精神卡保留；7 张图鉴仍可解锁。
4. 旧 v1.2 存档可继续，不白屏；旧结局快照只读，不重算；名册回廊能累积四路线页面，隐私模式降级提示。
5. 四路线实测均 ≤20:00；844×390 触摸、键盘、刷新、`file://` 至少各跑一次；0 console error / 0 pageerror。
6. `check-build`、`smoke`、`check-script` 与新增自动化通过；`docs/evidence/step-10/` 有记录；文档口径同步；提交并 tag `step-10-done`。
7. `dist/` 未重打包、线上未覆盖；汇报里明确写“v1.3.0-dev 本地完成，未部署”。

> 任一没做到，只能写“有条件完成”，并在 `docs/evidence/step-10/run-log.md` 写例外与原因；不把“写了”说成“能玩”。

## 0. 任务总表与门禁

| ID | 任务 | 依赖 | 主要产出 | 门禁 |
|---|---|---|---|---|
| T10.0 | 口径冻结与设计稿笔误修正 | — | 设计稿/计划书/CLAUDE/cursor/schema 同一口径 | G0 |
| T10.1 | 旗标、`strain`、派生布尔 | T10.0 | 8 个新旗标 + `syncDerivedFlags` | G1 |
| T10.2 | 选项可见性与行囊动态容量 | T10.1 | `option.requires`、`maxWhen`、p024 带板最多 1 件 | G1 |
| T10.3 | 结局快照、路线判定、五卡 | T10.1 | `route/routeTitle/routeLede/fate/strain`、空页亮句 | G1 |
| T10.4 | 点名解析与 8 人名册 | T10.3 | `resolveRollCall`、`answeredBy`、7/8 名兼容 | G1 |
| T10.5 | 隐藏 coda 与章末出口 | T10.3/T10.4 | `coda` 章、`g899/g900`、ending 守卫 | G1 |
| T10.6 | 序章行囊与门板因果 | T10.2 | p021 `had.door`、p023b、p024 动态容量 | G2 |
| T10.7 | 泸定飞毛腿危机 | T10.2/T10.6 | `l019` 重构、`l019x`、`l022/l022a` | G2 |
| T10.8 | 草地灶王危机 | T10.7 | `g018x`、`g019/g019a`、死亡段守卫 | G2 |
| T10.9 | 草地冬生危机与倒下 | T10.8 | `g026x`、`g028a/b`、`g028d–g028g` | G2 |
| T10.10 | 吴起文本守卫与 coda 文本 | T10.5/T10.9 | 林/灶王/飞毛腿分支、c001–c012 | G2 |
| T10.11 | 名册回廊与旧档迁移 | T10.3/T10.10 | `xiangbei.roster.v1`、标题入口、迁移 | G3 |
| T10.12 | 时长、自动化、证据与交接 | 全部 | 删句、`_pw-step10.js`、run-log、tag | G4/G5 |

### 门禁

| 门禁 | 通过条件 | 不通过时 |
|---|---|---|
| G0 口径 | 设计稿 12 处笔误已改；计划书/story-bible/CLAUDE/cursor/schema 与四路线一致；`git diff` 只有文档 | 停，不改代码 |
| G1 引擎 | 新旗标/派生/路线/8 名/ending 守卫的单元与 `check-build` 新检查全绿 | 停，不写剧情 |
| G2 剧情 | 四条路线可达；死亡后提及全部有 `when`；红线 10/10；超时默认正确 | 停，不接名册 |
| G3 存档 | 旧档吴起/泸定/草地各一份可续；名册 4 页；隐私模式不白屏 | 停，不实测时长 |
| G4 实测 | 四路线 ≤20:00；移动/键盘/刷新/0 error 通过 | 只写有条件完成 |
| G5 交接 | 证据、文档、提交、tag 完成；`dist/` 未动 | 不宣布完成 |

## 1. 起点盘点（写卡时实测）

### 1.1 代码断点

| 文件:行 | 现状 | 为什么要改 |
|---|---|---|
| `project/story.js:37-60` | p021 门板单选：A 写 `item.door=true`、`load+2`、`fire+10`；B 写 false。**没有 `had.door`** | 需要区分“曾有门板、后来铺掉”和“从来没有门板”，qiaoban 的桥板/石墙靠它 |
| `project/story.js:61-68` | p022a/p023a 只在有板时出现 | 可在 p023 后补一句“门板占两只手”，给“有板不能背人”埋因 |
| `project/story.js:76-137` | p024 多选 `max:3`、`slotLoad:true`、`inventoryBase:[roster,pencil]`；五件各 1 格；**没有门板选项，也没有 `maxWhen`** | 带门板时当前仍能选 3 件，整个“带板最多救 1 人 / 空页必然无板”的账本不成立 |
| `project/story.js:836-859` | l019 仅 `when:item.door`；A 铺桥（door=false、trust+1）、B 抱板（load+0）；**默认 A** | 默认会把门板铺掉，不能作为“不救”的默认；无板时整节点跳过，缺“喂药/继续走” |
| `project/story.js:861-902` | l019a/b、l020、l021a/b/c 已按门板分支 | 可保留；新增喂药结果与不救结果 |
| `project/story.js:903-907` | l022 飞毛腿死**无 when**；l023–l026 取号/对话也无 when | 救活后仍会写死，必须加 `fate.feimao.dead` 守卫与活着的分支 |
| `project/story.js:985-986` | g004“背上的门板是一张床”、g005“伤员躺上去”**无 when** | 已知 bug；无板路线会出现不存在的门板 |
| `project/story.js:1020-1085` | g015a–g023b：g019 灶王死**无 when**；g020/g020a/g021/g022/g023b 属死亡段；g021 仅 `when:item.homepot` | 救活后仍会埋人、留锅；死亡段需要整体守卫，g021 还要加“灶王已死” |
| `project/story.js:1091-1098` | g024–g026 冬生吹号；g027 出草地；g029 吴起 title；g030 grass codex；g900 end 吴起 | 缺冬生危机、缺倒下段、缺 coda 出口；g030 必须无条件执行，否则空页少一张图鉴 |
| `project/story.js:1108-1200` | 吴起 w001–w041；w006b/w014b/w015c/w016c/w022 默认林先生在场；w026 names 固定 7 人；w027b 固定“三个人的名字”；w030 固定 19 | 林先生可能死在草地；点名/死亡数/门板/数字都要按路线分 |
| `project/story.js:1205-1242` | `story.ending` 五卡，sacrifice 条件只看湘江 hold；无路线标题/末句 | 空页牺牲卡必须亮且换句；结局要显示路线 |
| `project/engine.js:49-105` | 25 个默认旗标；`FLAG_KEYS` 白名单；`FLAG_PREFIXES=["memory.","choice."]` | 加 8 个新旗标与 `fate./strain.` 前缀 |
| `project/engine.js:220-231` | `validEndingNames` **恰好 7 人** | 空页是 8 人，旧档必须兼容 |
| `project/engine.js:255-290` | `normalizeEnding` 只允许 stats/names/answered/missed/cards；answered/missed 上限 3 | 新键会被判坏档；空页可答 6+ |
| `project/engine.js:325-359` | `buildEnding` 五卡条件、stats 固定 19；无 route | 加路线、fate、strain、空页亮句、companyEnd 18 |
| `project/engine.js:511-518` | ending 场景守卫要求 `chapterId==="wuqi"` | 空页在 `coda` 章结束，会被误判坏档 |
| `project/engine.js:680-687` | `applySet` 逐键写，末尾不同步派生 | `strain` 变化后 `hurt/dying/lin.dead` 不更新 |
| `project/engine.js:715-752` | `applyMultiChoice` 用静态 `node.max`；`slotLoad` 已把门板算 2 格 | 需要 `maxWhen`，否则带板仍能选 3 件 |
| `project/engine.js:2815-2914` | 引擎侧 `multiMax(node)` 同样静态 | UI 与结算必须用同一个 effective max |
| `project/engine.js:3197-3327` | `startInteract` 直接用 `node.names`；`finishRollcall` 只写 id/name/status | 点名要按 fate 动态生成；空页要 8 人 + 冬生代答 |
| `project/engine.js:3431-3474` | `finishChapter` 对下一章一律 push unlock + toast；ending 只认 next==="ending" | `coda` 是 hidden，不能解锁/弹 toast；ending 守卫要认 coda |
| `project/index.html:23-29` | 标题菜单只有 开始/继续/史实图鉴/制作名单 | 名册回廊入口 |
| `project/index.html:101-123` | 结局面板无路线行 | 显示 `routeTitle/routeLede` |
| `docs/state-schema.md:1-7` / §9 | 已写 v1.5 计划 33 旗标、ending 新键、roster 键，但仍标“未实现” | 实现后把 §9 状态改为“已实现”，并与实际 JSON 对齐 |

### 1.2 设计稿与代码的 12 处差异（T10.0 必须先回改设计稿）

> 这些不是“实现细节”，是设计稿写错或没写到；不先改，执行时会按错口径写代码。

| # | 设计稿位置 | 问题 | 执行口径 |
|---|---|---|---|
| D1 | `docs/ending-routes.md:91`、`:174`、`:188` | 写“p024 选门板时置 `had.door`” | 门板在 **p021** 选；`had.door` 在 p021 A 置 true，p021 B 置 false |
| D2 | `:89`、`:96` | 说门板占 2 格、带板只装 1 件；但 p024 现在 `max:3` | p024 加 `maxWhen:[{when:"item.door",max:1}]`；p021 A 的 cost 文案“只剩两格”改为“只剩一格” |
| D3 | `:189` | 说“默认不救，12s”，但 l019 现默认 A（铺桥） | 有板三选：铺桥 / 喂药 / 抱板走；默认“抱板走”。无板两选：喂药 / 继续走；默认“继续走” |
| D4 | `:192` | 只给 l022 加 when，l023–l026 未提 | l022/l023/l024/l025/l026 全按 `fate.feimao.dead` 守卫；新增 l022a/l024a 活着分支 |
| D5 | `:211` | 只补 g004，未提 g005 | g004 **和** g005 都加 `when:item.door`；新增 g004b 无板句 |
| D6 | `:194-195` | g019 加 when，但 g020/g020a/g021/g022/g023b 未整体守卫；g021 只写 `item.homepot` | 死亡段整体 `when:fate.zaowang.dead`；g021 用 `fate.zaowang.dead && item.homepot`；新增 g019a/g021b |
| D7 | `:140`、`:202` | 说林先生可能死，却仍让 w006b/w014b/w015c/w016c 写她在吴起写标语 | 这 4 组按 `fate.lin.dead` 分叉；新增 w006c/w014c/w015d/w016d；w022 分 w022a |
| D8 | `:221`、`:267-274` | 固定 7 名、answered/missed 上限 3 | 允许 7 或 8 名；answered/missed 0–8；空页 8 名 |
| D9 | `:217` | 说 ending 守卫要改，但未写具体 | `normalize` 的 ending 守卫允许 `chapterId==="coda"` |
| D10 | `:209`、`:217` | 说地图跳过 hidden，但地图是静态 `MAP_STATIONS` 7 站；真正会弹 toast 的是 `finishChapter` | 不改静态地图；`finishChapter` 对 hidden 跳过 unlock/toast；`coda` 只能由 `g899` 进入 |
| D11 | `:200` | g899/g900 分支没提 g030 | g030 grass codex **无条件**放在 g899/g900 前，保证空页也解锁草地图鉴 |
| D12 | `:232` | 旧档“不把活着的人反推成你救过”，但没处理旧档“门板 + 3 件物资” | 见 §4.4 O1：旧档 `item.door && 物资>1` 只保留 1 件并 toast；若用户不接受，退路是保留全部、只保证不白屏，路线按实际 saves 归类 |

> T10.0 还要改：`docs/ending-routes.md` 的“状态：计划，未实现”保持到代码完成；`:89` 的 menban 条件写 `item.door || memory.door` 保留；`:198` 的 `g028d item.door=false` 改为“新档空页必无板；不为旧档新增 line effect”。

### 1.3 为什么是这些断点

- 现有引擎是**扁平条件节点图 + 章节数组 + ending 快照**；不加新状态机，只在现有 `when/set/choice/multichoice/interact` 上补能力。
- 四路线不是四条完整剧本，是**同一主干的四种收束**；所以先改引擎契约，再写三次危机与 coda，避免边写边改规则。
- 名册回廊是独立只读存储，不参与路线判定；先做结局快照，再做回廊，避免“名册反过来影响游戏”。

## 2. 已确认决定、不变量与非目标

### 2.1 用户已确认

- 多结局放在人物命运，不改历史终点：湘江必败、遵义必开、泸定必夺、到吴起不变。
- 主角可中途牺牲；他人命运可变；“最佳”不是全员到齐，而是文书记录的大多数人活下来。
- 每条结局几乎必有 3–4 人牺牲；只有“我因救人牺牲”是 1–2 人；**没有全活**。
- 老周必死，不改；保留林先生；全部分支用因果链。
- 不借 galgame 四件套：好感度、攻略角色、真结局、周目锁定；不做完成度百分比、分支存档树 UI。

### 2.2 人数账本（实现必须逐条对上）

| 路线 | 救 | 死 | 门板 | 你 | `strain` | `companyEnd` |
|---|---:|---|---|---|---:|---:|
| `sidao` 四道划痕 | 0 | 4（老周、飞毛腿、灶王、冬生） | 可到吴起 | 活 | 0 | 19 |
| `menban` 门板 | 1 | 3（老周 + 两个危机） | 到吴起 | 活 | 1 | 19 |
| `qiaoban` 桥板·2 救 | 2 | 3（老周 + 一个危机 + 林先生） | 无 | 活 | 2 | 19 |
| `qiaoban` 石墙·1 救 | 1 | 3（老周 + 两个危机，林活） | 无 | 活 | 1 | 19 |
| `kongye` 空页 | 3 | 2（老周 + 你） | 无 | **死** | 3 | 18 |

不变量：

- `saves = 3 - 危机死亡数`（危机死亡数不含老周/林/你）。
- 新档 `strain === saves`；`strain===3` 必须 `route==="kongye"`。
- `fate.lin.dead === (strain>=2 && strain<3)`；`strain===3` 时林活。
- 老周永远 absent；何指导员永远 remote；细妹永远 self。
- 空页不是“全员到齐”：老周空着，张老幺留金沙江；六人应到、两人没到。

### 2.3 非目标

- 不做好感度条、攻略线、角色选择、真结局/隐藏结局、周目锁、结局百分比、分支存档树。
- 不做战斗、养成、商店、升级三选一、BOSS、排行榜、多人、后端。
- 不新增美术/音频；不改 7 张史实注；不改 104→19 的历史数字（空页只写 18 人，因为“你”没到）。
- 不为每段危机另写状态机；复用现有 choice/multichoice/interact。
- 不升 `xiangbei.save.v1` 键；只加默认旗标与迁移。
- 不打包、不部署、不改线上。

### 2.4 需在执行前确认的两个开放项

| 编号 | 事项 | 推荐口径 | 不接受的退路 |
|---|---|---|---|
| O1 | 旧 v1.2 存档在 p024 后可能“门板 + 3 件物资” | 载入时只保留 1 件（优先级：药 > 青稞 > 鞋 > 雨布 > 锅），其余置 false 并从 `inventory.items` 移除；toast“旧存档行囊按新规则调整” | 保留全部，只保证不白屏；路线按实际 saves 归类，文本用通用句，不承诺账本一致 |
| O2 | 20 分钟已只剩 12 秒，新增三次危机约 +25–30 秒 | 先删 §7.1 的 5 句 + 合并 1 句；四路线实测仍超再按红线裁 | 若用户要求保留全部原句，则必须接受“有条件 20 分钟”或先裁草地 |

> O1/O2 不确认也可以先做 T10.0–T10.5（引擎与口径），但 T10.11/T10.12 前必须定。

## 3. 目标体验

- 玩家在序章就知道：**门板占两只手**。带板：行囊只能再带一件，救人时不能背人；不带板：行囊三件，但每次救人都要扶/背/分口粮，救得越多自己越走不动。
- 泸定：桥板不够，飞毛腿在桥头。你可以把门板铺上去，也可以把药给他，或者抱着门板过去。超时＝抱板走，他死。
- 草地：灶王蹲在风口生火。你可以给青稞、用锅、替他蹲风口（没门板才行），或者不救。火没起来，他就没再站起来。
- 草地尽头：冬生走不动了。你可以给鞋、给雨布、背他（没门板才行），或者不救。你救了三个人，就轮到你走不动；你让队伍别停，名册由冬生背到吴起。
- 吴起：点名照常，但名册上的人不一样；空页由冬生替你答“到”，再把你的名字添上、划掉。没有 Game Over，没有“失败”，只有谁没到。
- 结局：路线名 + 末句 + 点名 + 数字 + 五张卡；名册回廊只记事实，不记百分比。

## 4. 数据契约

### 4.1 新旗标（8 个，25→33）

| 键 | 类型 | 默认 | 谁写 | 用途 |
|---|---|---|---|---|
| `had.door` | bool | false | p021 A | 区分“桥板”（曾有板）与“石墙”（从无板） |
| `fate.feimao.dead` | bool | false | l019/l019x 每个分支显式写 | 飞毛腿死 |
| `fate.zaowang.dead` | bool | false | g018x 每个分支显式写 | 灶王死 |
| `fate.dongsheng.dead` | bool | false | g026x 每个分支显式写 | 冬生死 |
| `fate.lin.dead` | bool | false | **仅派生** | 林没等到收容队 |
| `strain` | number | 0 | 每次救 `"+1"` | 0–3 消耗 |
| `strain.hurt` | bool | false | **仅派生** | `strain>=2` |
| `strain.dying` | bool | false | **仅派生** | `strain>=3` |

派生函数（只写这三个键，幂等）：

```js
function syncDerivedFlags(state) {
  var strain = Number(state.flags.strain) || 0;
  state.flags["strain.hurt"] = strain >= 2;
  state.flags["strain.dying"] = strain >= 3;
  state.flags["fate.lin.dead"] = strain >= 2 && strain < 3;
}
```

调用点：`applySet` 末尾、`applyMultiChoice` 末尾、`normalize` 合完 flags 并夹取之后。剧本**不得**直接 `set` 这三个派生键；`check-build` 加检查。

### 4.2 路线判定

```js
var f = state.flags;
var dead = function (key) { return f["fate." + key + ".dead"] === true; };
var saves = 3 - (dead("feimao") ? 1 : 0) - (dead("zaowang") ? 1 : 0) - (dead("dongsheng") ? 1 : 0);
var route = f["strain.dying"] ? "kongye"
          : saves === 0 ? "sidao"
          : (f["item.door"] || f["memory.door"]) ? "menban"
          : "qiaoban";
```

- `route` 只在 `buildEnding` 算一次，写进快照；**不新增 `route` 旗标**。
- `saves===3` 必须 `strain.dying`；测试断言，不一致就停。
- `qiaoban` 的显示标题：`had.door ? "桥板" : "石墙"`；路线 id 仍 `qiaoban`。
- `menban` 的“板到吴起”用 `item.door || memory.door`；`w013` A 会把 `item.door` 换成 `memory.door`。

### 4.3 ending 快照

```json
{
  "stats": { "companyStart": 104, "companyEnd": 18, "redStart": 86000, "redEnd": 7000 },
  "route": "kongye",
  "routeTitle": "空页",
  "routeLede": "名册上多了一个名字，又划掉了。",
  "fate": { "feimao": "alive", "zaowang": "alive", "dongsheng": "alive", "lin": "alive" },
  "strain": 3,
  "names": [
    { "id": "he", "name": "何指导员", "status": "remote" },
    { "id": "ximei", "name": "细妹", "status": "self" },
    { "id": "lin", "name": "林先生", "status": "self" },
    { "id": "zhou", "name": "老周", "status": "missed" },
    { "id": "zaowang", "name": "灶王", "status": "self" },
    { "id": "feimao", "name": "飞毛腿", "status": "self" },
    { "id": "dongsheng", "name": "冬生", "status": "self" },
    { "id": "manzai", "name": "满崽", "status": "player", "answeredBy": "冬生" }
  ],
  "answered": 2,
  "missed": 0,
  "cards": [],
  "recorded": true
}
```

- `companyEnd` 只存 `stats.companyEnd`（18/19），**不另开顶层键**；设计稿的“ending 加 companyEnd”按此收口。
- `fate` 值只允许 `"alive"` / `"dead"`；`strain` 整数 0–3。
- `names` 允许 7 或 8 项；`status` 仍 `self/remote/player/missed`；`answeredBy` 可选非空字符串。
- `answered/missed` 0–8；空页点名可答 6+，不能再按 3 截断。
- `cards` 仍是 5 张；空页 `sacrifice` 亮句用 `story.ending.kongyeSacrificeLine`，其余四卡条件不变。

### 4.4 名册存储 `xiangbei.roster.v1`

```json
{
  "version": 1,
  "pages": [
    {
      "route": "kongye",
      "title": "空页",
      "at": "2026-11-06T12:00:00.000Z",
      "companyEnd": 18,
      "names": [
        { "id": "he", "name": "何指导员", "status": "remote" },
        { "id": "manzai", "name": "满崽", "status": "player", "answeredBy": "冬生" }
      ],
      "note": "名册上多了一个名字，又划掉了。"
    }
  ]
}
```

- 每页 8 行（7 个名册人物 + 满崽）；普通路线满崽 `self`，空页满崽 `player` + `answeredBy:"冬生"`。
- 最多 8 页；第 9 页丢最旧；同一局只记一次（`ending.recorded`）。
- 只读、不参与路线判定；清 `xiangbei.save.v1` 不影响名册。
- 隐私模式/读写失败：面板显示“本机无法保存名册，本局仍可继续”，不白屏、不阻断结局。
- 不显示百分比、不显示“1/4”、不做成就点。

### 4.5 点名条目与 `answeredBy`

```js
{ id: "manzai", name: "满崽", status: "absent", answeredBy: "冬生" }
```

- `startInteract` 遇到 `source:"rollcall"` 时调用 `resolveRollCall(state, node.coda===true)`，不再直接读静态 `names`。
- 有 `answeredBy` 的条目：UI 自动走 700ms “代答”阶段，最终 `status:"player"`，保留 `answeredBy`；计入 `answered`，不计 `missed`。
- 普通吴起玩家点“替他答”时写 `answeredBy:"你"`；空页满崽预置 `answeredBy:"冬生"`。
- `renderEnding` 显示“冬生 代答”/“你 代答”；不再统一显示“替他答到”。

### 4.6 选项可见性与动态容量

```js
// choice 选项
{ key: "B", text: "把药给他", requires: "item.medicine", ... }
// multichoice 节点
{ max: 3, maxWhen: [{ when: "item.door", max: 1 }], ... }
```

- `requires` 与 `when` 同一语法：只允许 `key` / `!key` / `&&`；不扩 `evalWhen`。
- 渲染与结算都过滤；`defaultOption` 必须始终可见；若默认项被 `requires` 隐藏，执行期报错并取第一个可见项（不静默）。
- `effectiveMultiMax(state,node)` 在 `XB.core` 定义，UI 与 `applyMultiChoice` 共用；禁止两套 max。
- p024 的 effective max：有门板 1，无门板 3；`slotLoad` 仍把门板算 2 格。

### 4.7 空页 coda 节点

| 节点 | 类型 | 内容要点 | 条件/备注 |
|---|---|---|---|
| c001 | title | 终章·吴起，1935-10，陕北·吴起镇 | `bg:"wuqi_dawn"` |
| c002 | line | “满崽没有到吴起。” | 旁白，第三人称 |
| c003 | line | “到吴起那天，全连十八个人。名册上有十九个名字。” | 18/19 固定 |
| c004 | line | 冬生把名册交给指导员：“满崽的名字，我替他答。” | 冬生对白 |
| c005 | line | 指导员翻开名册，纸边全是毛的。 | 过渡 |
| c006 | interact | 8 人点名；满崽 `absent` + `answeredBy:"冬生"` | `source:"rollcall"`、`coda:true`、45s |
| c007 | line | “念到满崽。冬生答：‘到。’” | 回应 c006 |
| c008 | line | 念完，冬生翻到最后一页。 | 过渡 |
| c009 | line | 他添上满崽，又划掉。笔画很轻。像怕吵醒谁。 | 末句素材 |
| c010 | codex | `wuqi` | 解锁吴起图鉴 |
| c011 | line | “名册上多了一个名字，又划掉了。” | 路线末句 |
| c012 | end | `next:"ending"` | 结局快照 |

- `coda` 章：`{id:"coda", order:8, title:"终章·吴起", playable:true, hidden:true}`。
- `g899`（`when:"strain.dying"`，`next:"coda"`）与 `g900`（`when:"!strain.dying"`，`next:"wuqi"`）互斥；`g030` grass codex 在两者之前且无条件。

## 5. 分阶段执行

### 阶段 A · 口径与设计稿修正（T10.0，30/20 分钟）

**文件**：`docs/ending-routes.md`、`向北-项目计划书.md`、`docs/story-bible.md`、`.claude/CLAUDE.md`、`.cursor/rules/xiangbei.mdc`、`docs/state-schema.md`。

**做法**：

1. 按 §1.2 的 D1–D12 回改 `docs/ending-routes.md`；在文首保留“计划，未实现”，在 §0 加一行“执行修正见 `step/step-10-人物命运四路线.md` §1.2”。
2. 检查计划书/ story-bible / CLAUDE / cursor / schema 是否仍是“没有全活、四路线、不做好感度/真结局/百分比”的同一口径；只改不一致处，不重复写状态。
3. 把 `docs/state-schema.md` §9 的 33 旗标、ending 新键、roster 键与 §4 实际契约对齐；`companyEnd` 收进 `stats`。
4. 不改运行时代码；`git diff --stat` 应只有文档。

**验收**：

- `grep` 不再出现“p024 选门板置 had.door”“带板全救”“固定 7 名/上限 3”等旧句。
- 六份文档对四路线人数、空页 18/19、没有全活、五卡保留的说法一致。
- 用户确认 O1/O2（或明确接受退路）。

**失败处理**：口径不一致就停，不进 G1；不靠代码“兼容”两种说法。

### 阶段 B · 引擎（T10.1–T10.5，150/100 分钟）

#### T10.1 旗标、`strain`、派生布尔

**文件**：`project/engine.js`（`FLAG_DEFAULTS`/ `FLAG_LIMITS`/ `FLAG_KEYS`/ `FLAG_PREFIXES`、`applySet`、`applyMultiChoice`、`normalize`）。

**做法**：

- 加 8 个默认键；`FLAG_LIMITS.strain=[0,3]`；`FLAG_KEYS` 加 `had.door`、`strain`；`FLAG_PREFIXES` 加 `fate.`、`strain.`。
- 加 `syncDerivedFlags(state)`；在 `applySet` 末尾、`applyMultiChoice` 末尾、`normalize` 合完 flags 后调用。
- `normalize` 对旧档补默认值；`strain` 夹取；派生键覆盖存档里可能存在的旧值。
- 不把 `route` 写进 flags；不改 `SAVE_KEY`。

**验收**：

- `strain=0/1/2/3` 时派生值分别为 `false/false/false`、`false/false/false`、`true/false/true`、`true/true/false`（顺序 hurt/dying/lin.dead）。
- `setFlag("strain","+1")` 三次到 3，不越界；第四次仍 3。
- 旧档无新键时默认值齐全，刷新不报错。

**失败处理**：派生不同步或 `strain` 可越界，回滚本任务，不写剧情。

#### T10.2 选项可见性与行囊动态容量

**文件**：`project/engine.js`（`evalWhen` 附近的 `isOptionVisible`、`applyChoice`、`renderChoice`、`multiMax`/`effectiveMultiMax`、`applyMultiChoice`）。

**做法**：

- 加 `option.requires` 过滤：渲染 `renderChoice` 只生成可见项；结算 `applyChoice` 拒绝不可见项并 `console.error`；超时默认项必须可见。
- 加 `effectiveMultiMax(state,node)`：按 `maxWhen` 顺序取第一个可见规则，否则 `node.max`；在 `XB.core` 导出。
- 引擎 `multiMax(node)` 改为调用 `XB.core.effectiveMultiMax(state,node)`；`renderMultiChoice`、`updateMultiChoice`、`toggleMultiChoice`、`applyMultiChoice` 全部走同一函数。
- p024 不在引擎里写特判；容量只在 `story.js` 的 `maxWhen` 声明。

**验收**：

- p024 有门板时第 2 件点不上、确认后 `load` 只算门板 2 + 1 件；无门板仍可 3 件。
- l019 无药时“喂药”不出现；有药时出现；超时默认项可见。
- `applyMultiChoice` 直接传 2 件 + 门板返回 `null`，不写档。

**失败处理**：UI 与结算 max 不一致，停；不加第二套 max。

#### T10.3 结局快照、路线、五卡

**文件**：`project/engine.js`（`validEndingNames`、`normalizeEnding`、`buildEnding`、`normalize` ending 守卫、`renderEnding`）、`project/story.js`（`story.ending.routes`、`kongyeSacrificeLine`）、`project/index.html`（结局路线行）。

**做法**：

- `buildEnding` 先算 `saves/route`；返回 `route/routeTitle/routeLede/fate/strain/recorded:false`；`stats.companyEnd = route==="kongye" ? 18 : 19`。
- `sacrifice` 条件改为 `route==="kongye" || choice.xiangjiang.hold===true`；空页用 `kongyeSacrificeLine`，其余四卡条件不变。
- `validEndingNames` 允许 7 或 8 项；`normalizeEnding` 允许并校验 `route/routeTitle/routeLede/fate/strain/recorded`；`answered/missed` 0–8；保留 `answeredBy`。
- `normalize` 的 ending 守卫允许 `chapterId==="wuqi"` 或 `"coda"`。
- `renderEnding` 显示 `routeTitle` + `routeLede`；空页 `paintStage` 仍用 `wuqi_wall`；不新增美术。
- 旧 ending 快照缺 `route`：按 `item.door || memory.door ? "menban" : "qiaoban"` 补 `routeTitle:"旧档"`，不重算 names/cards。

**验收**：

- 构造四种 flags 调 `XB.core.buildEnding`：route 分别为 `sidao/menban/qiaoban/kongye`；kongye `companyEnd=18`、sacrifice 亮句正确；sidao 4 死。
- `normalizeEnding` 接受 8 名/answered=6；拒绝 9 名/answered=9/未知 route。
- 旧 ending 快照可渲染，不白屏。

**失败处理**：路线判定与账本不一致，停；不改文本“圆”。

#### T10.4 点名解析与 8 人名册

**文件**：`project/engine.js`（`resolveRollCall`、`startInteract`、`nextRollcall`、`stepInteract`、`answerRollcall`、`finishRollcall`、`renderEnding`）。

**做法**：

- 加 `resolveRollCall(state, coda)`：he remote、ximei self、lin 按 `fate.lin.dead`、zhou absent、zaowang/feimao/dongsheng 按各自 dead；coda 追加 manzai absent + `answeredBy:"冬生"`。
- `w026` 改 `source:"rollcall"`；`c006` 加 `source:"rollcall", coda:true`；`startInteract` 按 source 取 resolver。
- `answeredBy` 走 700ms 自动代答；`finishRollcall` 保留 `answeredBy`；`answerRollcall` 写“你”；`renderEnding` 显示代答人。
- 空页点名 8 人、45 秒；普通吴起 7 人、45 秒。

**验收**：

- 四条路线的 names 状态与 §2.2/§5 矩阵一致；空页满崽由冬生代答，不划 missed。
- 玩家不替答老周时 `missed` 增加；`memory.rollcall_missed_any` 正确。
- 8 名 ending 能保存/刷新/渲染；7 名旧档仍可。

**失败处理**：8 名被判坏档，停；先修 `validEndingNames`/`normalizeEnding`。

#### T10.5 隐藏 coda 与章末出口

**文件**：`project/engine.js`（`finishChapter`、ending 守卫）、`project/story.js`（coda 章、g899/g900）。

**做法**：

- `finishChapter` 对 `chapter.hidden===true` 跳过 `unlockedChapters.push` 与 toast，但仍 `startChapter`。
- `g899` end next coda（`strain.dying`）；`g900` end next wuqi（`!strain.dying`）；`g030` 无条件在两者前。
- coda 章 `order:8`、`playable:true`、`hidden:true`；不进静态地图。
- ending 守卫允许 coda（T10.3 已改）；coda 结束 `next:"ending"`。

**验收**：

- 空页路线从 g028g 进 coda，不弹“已解锁终章”toast；地图不出现第八站。
- 空页结局存档刷新不白屏；普通路线仍从 g900 进吴起。
- 空页也解锁 grass + wuqi 两张图鉴。

**失败处理**：coda 被 normalize 回地图，停；先修守卫。

### 阶段 C · 剧情（T10.6–T10.10，210/140 分钟）

> 文本先写进 `docs/ending-routes.md` 附录 A（新增/改写全文，标 node id），过红线后再誊写 `story.js`；`docs/script` 旧七章正文不改，避免 4108 字口径分叉。附录 A 至少覆盖三次危机选项/结果、coda 全文、吴起林先生分支。

#### T10.6 序章行囊与门板因果

**文件**：`project/story.js`（p021、p023、p024）。

**做法**：

- p021 A 的 `set` 加 `had.door:true`；B 加 `had.door:false`；A 的 `cost` 改为“行囊只剩一格，多背三十斤”（与 p024 容量一致）。
- p023 后加 p023b（`when:"item.door"`）：“门板占着两只手。背上再压东西，就走不快了。”给“有板不能背人”埋因。
- p024 prompt 改为不写死数字：“娘把五样东西摆在桌上。行囊就那么大。”；节点加 `maxWhen:[{when:"item.door",max:1}]`；保留 `max:3`、`slotLoad:true`、`inventoryBase`。
- p025 结算 note 不改；p026 仍写“只有一小堆”。

**验收**：

- p021 A → p024 最多选 1 件；p021 B → 最多 3 件；刷新后容量按 `item.door` 恢复。
- p023b 只在该有板时出现；无板不出现。
- 行囊结算 `load` 正确：有板 1 件 = 2+1=3；无板 3 件 = 3。

#### T10.7 泸定飞毛腿危机

**文件**：`project/story.js`（l019–l026）。

**做法**：

- `l019`（`when:"item.door"`）三选，`timeout:12`、`defaultOption:"C"`：
  - A 铺桥：`item.door=false, trust:"+1", strain:"+1", fate.feimao.dead:false, memory.fly_bridge:true`；cost 保留“第三块桥板”。
  - B 喂药：`requires:"item.medicine"`；`item.medicine=false, strain:"+1", fate.feimao.dead:false, memory.fly_medicine:true`；cost“药给了他，你只剩空口袋”。
  - C 抱板走：`fate.feimao.dead:true, memory.fly_leave:true`；cost“你抱着门板过去，他留在桥头”。
- `l019x`（`when:"!item.door"`）两选，`timeout:12`、`defaultOption:"B"`：
  - A 喂药：`requires:"item.medicine"`，同上消耗/救援；
  - B 继续走：`fate.feimao.dead:true, memory.fly_leave:true`。
- 新增 l019c（`when:"memory.fly_medicine"`）：“我把药敷在他背上。他咬住号嘴，没出声。”；l019d（`when:"fate.feimao.dead"`）：“我别过头。桥板一块一块往前铺。”可选，避免与 l022 重复。
- l019a 保留（桥）；l019b 保留（抱板）；l020/l021 保留。
- l022 加 `when:"fate.feimao.dead"`；新增 l022a（`when:"!fate.feimao.dead"`）：“飞毛腿过来了。号还在他手里。”。
- l023/l024/l025/l026 全部加 `when:"fate.feimao.dead"`；新增 l024a（`when:"!fate.feimao.dead"`）：“他把号举了举，说：还能吹。”。
- l027 记名选择不改；空页若飞毛腿活，点名 w025a 处理。

**验收**：

- 有板/无板 × 有药/无药 四条路径都能到 l027；无药时“喂药”不可见。
- 铺桥后 `item.door=false`、`strain=1`、飞毛腿活；抱板后门板仍在、飞毛腿死。
- 超时 12s 默认“不救”；刷新不重复 `strain`。

#### T10.8 草地灶王危机

**文件**：`project/story.js`（g018 后、g019–g023b）。

**做法**：

- 在 g018 后插入 `g018x`，`timeout:16`、`defaultOption:"D"`：
  - A 青稞：`requires:"item.barley"`；`item.barley=false, strain:"+1", fate.zaowang.dead:false, memory.zaowang_barley:true`。
  - B 铁锅：`requires:"item.homepot"`；`item.homepot=false, strain:"+1", fate.zaowang.dead:false, memory.zaowang_pot:true`；cost“锅底烧穿了，锅留在他手里”。
  - C 替蹲风口：`requires:"!item.door"`；`fire:"-10", strain:"+1", fate.zaowang.dead:false, memory.zaowang_body:true`。
  - D 不救：`fate.zaowang.dead:true`。
- g019 加 `when:"fate.zaowang.dead"`；新增 g019a（`when:"!fate.zaowang.dead"`）：“火起来了。他站起来，膝盖响了一声。”。
- 死亡段 g020、g020a、g021、g022a、g022b、g023b 全部加 `when:"fate.zaowang.dead"`（g020a 再加 `item.homepot`；g021 用 `fate.zaowang.dead && item.homepot`；g022a/b 保留 item.pot 条件）。
- 新增 g021b（`when:"fate.zaowang.dead && !item.homepot"`）：“火堆边只剩一口烧穿的小锅。我没拿。”。
- 救活后直接接 g024；不出现埋人/小锅/“锅在发亮”。

**验收**：

- 青稞/锅/身体/不救四路径；有门板时“替蹲风口”不可见；无门板无物资时仍可用身体救。
- 救活后 g019/g020/g021/g022/g023b 全不出现；死亡后 g021 只在 `item.homepot` 时出现，g021b 在无锅时出现。
- 超时 16s 默认不救；刷新不重复 `strain`。

#### T10.9 草地冬生危机与倒下

**文件**：`project/story.js`（g026 后、g027–g900）。

**做法**：

- 在 g026 后插入 `g026x`，`timeout:12`、`defaultOption:"D"`：
  - A 布鞋：`requires:"item.shoes"`；`item.shoes=false, strain:"+1", fate.dongsheng.dead:false, memory.dongsheng_shoes:true`。
  - B 雨布：`requires:"item.raincloth"`；`item.raincloth=false, strain:"+1", fate.dongsheng.dead:false, memory.dongsheng_cloth:true`。
  - C 背他走：`requires:"!item.door"`；`fire:"-10", strain:"+1", fate.dongsheng.dead:false, memory.dongsheng_body:true`。
  - D 不救：`fate.dongsheng.dead:true`。
- g027 后加 g028a（`fate.dongsheng.dead`）：“冬生没跟上来。他的号在草里，我没找到。”；g028b（`!fate.dongsheng.dead`）：“冬生说，到了吴起，我吹给全连听。”。
- g028b 后加倒下段（全部 `when:"strain.dying"`）：
  - g028d：“走出草地那天，我走不动了。”
  - g028e：“我把名册解下来，交给冬生。”
  - g028f：“我说，别停。”
  - g028g：“他背起名册，没回头。队伍没有停。”
- g029 title 加 `when:"!strain.dying"`；g030 grass codex 不加条件；g899 end `when:"strain.dying"` next coda；g900 end `when:"!strain.dying"` next wuqi。
- 不新增 line 的 `set` 能力；新档空页必无板，旧档例外不展示门板。

**验收**：

- 三救（药+青稞+鞋）→ `strain=3`、g028d–g028g、coda；不出现 g029/吴起。
- 两救 → `strain=2`、林死、进吴起；一救/零救按账本。
- 超时 12s 默认不救；刷新不重复；g030 在两个出口前都执行。

#### T10.10 吴起文本守卫与 coda 文本

**文件**：`project/story.js`（w006–w031、coda c001–c012）。

**做法**：

- 林先生死亡分支（只在 qiaoban 2 救发生）：
  - w006b 加 `&& !fate.lin.dead`；新增 w006c（`!item.door && fate.lin.dead`）：“石墙上有一行旧标语，红漆褪成了粉色。是林先生在路上写的。”
  - w014b 加 `&& !fate.lin.dead`；新增 w014c（`!item.door && fate.lin.dead`）：“我站在墙边。她没有来。”
  - w015c 加 `&& !fate.lin.dead`；新增 w015d（`!item.door && !memory.door && fate.lin.dead`）：“标语写在石墙上，是林先生走前留下的。红漆被风磨白了。”
  - w016c 加 `&& !fate.lin.dead`；新增 w016d（同条件）：“风把纸角吹起来。石墙是凉的。”
  - w022 加 `when:"!fate.lin.dead"`；新增 w022a（`fate.lin.dead`）：“念到林先生。没有人应。她没等到收容队。”
- 灶王/飞毛腿：
  - w024 加 `when:"fate.zaowang.dead"`；新增 w024a（`!fate.zaowang.dead`）：“念到灶王。他从锅边抬起头，应了一声。”
  - w025 加 `when:"fate.feimao.dead"`；新增 w025a（`!fate.feimao.dead`）：“念到飞毛腿。他把号举了举。”
- 点名：
  - w026 改 `source:"rollcall"`，删静态 names 或保留作 fallback（引擎优先 resolver）。
  - w027a 保留 `memory.rollcall_missed_any`；w027b 改 `when:"!memory.rollcall_missed_any"`；在 w027b 前新增 w027c `when:"!memory.rollcall_missed_any && fate.feimao.dead && fate.zaowang.dead && fate.dongsheng.dead"`：“四个人的名字，我都替他们答了。”。用节点顺序保证 w027c 先于 w027b；不写 `||`。
  - w030/w031 加 `when:"!strain.dying"`（防御；正常只有吴起进）。
- coda：按 §4.7 写 c001–c012；c006 用 `source:"rollcall"` + `coda:true`；c010 codex wuqi；c012 end ending。
- 可选：w005a（`strain.hurt`）一句“到了吴起，我的左肩还抬不起来。”——只在时长有余时加，否则不加。

**验收**：

- qiaoban 2 救：林 names absent；w006c/w014c/w015d/w016d/w022a 出现，绝不出现“她正在收粉笔”。
- 灶王/飞毛腿活/死对应 w024a/w025a 与 absent；w027 文案按 0/1–2 救正确。
- 空页：c001–c012 顺序、8 人、冬生代答、18 人、grass+wuqi 图鉴、ending。

### 阶段 D · 名册回廊与旧档（T10.11，90/60 分钟）

**文件**：`project/index.html`、`project/style.css`、`project/engine.js`、`docs/ui-layout.md`、`docs/state-schema.md`。

**做法**：

1. 标题菜单加“名册”按钮（`data-action="roster"`），顺序：开始 / 继续 / 名册 / 史实图鉴 / 制作名单。
2. 加 `#roster` 弹窗（role=dialog、aria-modal、标题、关闭、页容器、空状态、提示）；复用 `.xb-gallery` 的面板/卡片样式，新增 `.xb-roster__page`、`.xb-roster__names`、`.is-absent` 等；移动端可滚，关闭热区 ≥44px。
3. `engine.js` 加 `rosterState`、`openRoster/closeRoster/renderRoster`、焦点陷阱、Escape；与 codex/gallery 的 `hidePanels` 协调；不改游戏状态。
4. `recordRosterPage(ending)`：读 `xiangbei.roster.v1`，坏 JSON 重置；页面 8 行；最多 8 页（丢最旧）；写失败 toast“本机无法保存名册，本局仍可继续”，不阻断。
5. `renderEnding` 在 `isFullEnding` 后调用一次；`ending.recorded` 防重；写后 `saveNow`。
6. 旧档迁移：
   - 所有旧档先补 `had.door`：`flags["choice.prologue.door"]===true || item.door===true || choice.luding.door===true`；三者都没有则 false。旧档 p021 的 record 是 `choice.prologue.door`，不是 `had.door`；不补会把“桥板”显示成“石墙”。
   - ending 快照：直读；缺 route 按 §T10.3 补 `旧档`，不重算 names/cards。
   - `wuqi` 旧档：`fate.feimao.dead=true`、`fate.zaowang.dead=true`、`fate.dongsheng.dead=false`、`strain=1`；toast“旧存档按原路线继续”。
   - 泸定 l022 及以后：`fate.feimao.dead=true`、`strain=0`。
   - 草地 g019 及以后：`fate.zaowang.dead=true`。
   - 更早：全默认，新危机照常触发。
   - O1：`item.door && 物资>1` 按推荐口径裁剪 + toast；不静默。
7. `docs/state-schema.md` §9 改“已实现”，写实际 JSON；`docs/ui-layout.md` 加名册弹窗线框/尺寸。

**验收**：

- 四条路线各通一次 → 名册 4 页；第 9 页只留最近 8 页；无百分比。
- 旧档三份可续；旧 ending 不白屏；隐私模式可看结局 + 名册提示。
- 844×390 名册可滚、可关；键盘 Tab/Escape 正常；0 console error。

### 阶段 E · 时长、自动化、证据与交接（T10.12，120/80 分钟）

**文件**：`project/story.js`（删句）、`project/tools/_pw-step10.js`、`project/tools/check-build.js`、`project/tools/smoke.js`、`docs/test-cases.md`、`docs/evidence/step-10/`、`.claude/CLAUDE.md`。

**做法**：

1. 先删 §7.1 的 5 句 + 合并 w028/w029；四路线跑计时；仍超按红线裁（遵义 → 草地过渡 → 金沙江），保留序章/湘江/泸定/点名。
2. 写 `_pw-step10.js`：覆盖 T10-01–T10-05、T10-07–T10-09、T10-11；每条路线用 `?chapter=&node=` 或注入 `XB.core.defaults()` + flags；断言 localStorage 的 route/strain/names/cards/companyEnd；捕获 console/pageerror。
3. `check-build` 加 C33–C40：had.door、p024 maxWhen、strain 派生/夹取、四路线、8 名、coda/hidden、g030 无条件、w026 source、死亡后提及守卫。
4. `smoke` 加路线/ ending 形状检查；保留 46 项旧检查。
5. 证据：`docs/evidence/step-10/run-log.md`（命令、输出、四路线计时、截图）、`flow-desktop.md`、`flow-mobile.md`、`old-saves/`。
6. 文档同步：`docs/ending-routes.md` 状态改“已实现（v1.3.0-dev）”；`docs/state-schema.md` §9 已实现；`docs/test-cases.md` 加 T10-01–T10-14；`.claude/CLAUDE.md` 步骤十 ✅、进度、风险/欠账。
7. 提交 + tag；不打包、不部署。

**验收**：见 §6；四路线计时表；0 error；tag 后 `git status` 干净。

## 6. 验收用例与回归路径

| 用例 | 输入 | 断言 |
|---|---|---|
| T10-01 四道划痕 | p021 A；p024 0 件；l019 C；g018x D；g026x D；w013 A | route=sidao；4 死；门板留吴起；点名 4 absent；五卡可全灰；strain 0 |
| T10-02 门板 | p021 A；p024 药；l019 B；g018x D；g026x D；w013 A/B | route=menban；3 死；板到吴起；点名 3 absent；strain 1 |
| T10-03 桥板 2 救 | p021 B；p024 药+青稞；l019x A；g018x A；g026x D | route=qiaoban；strain2；林死；3 absent；无板；had.door=false（石墙） |
| T10-04 桥板 1 救 | p021 A；p024 0 件；l019 A；g018x D；g026x D | route=qiaoban；strain1；林活；3 absent；无板；had.door=true（桥板） |
| T10-05 空页 | p021 B；p024 药+青稞+鞋；l019x A；g018x A；g026x A | route=kongye；strain3；coda；8 名；满崽冬生代答；companyEnd 18；sacrifice 新句 |
| T10-06 带板救 2 不可达 | p021 A；p024 药；l019 B；g018x C | g018x C 不可见；最多救 1；route=menban |
| T10-07 湘江铺板 | p021 A；p024 药；x025a C；l019x A；g018x C；g026x D | 无板；qiaoban；strain2；林死；hold 卡亮；g018x C 用身体救灶王（fire-10） |
| T10-08 超时 | 三次都超时 | l019/g018x/g026x 默认不救；sidao；choices 记 timedOut；strain0 |
| T10-09 旧档吴起 | v1.2 吴起旧档 | 不白屏；toast；route 旧档；名册可写；7 名 |
| T10-10 隐私 | 禁 localStorage | 结局可看；名册提示；不阻断；0 error |
| T10-11 刷新 | 每个危机选择后刷新 | 旗标/节点恢复；strain 不重复；点名不重复 |
| T10-12 移动 | 844×390 触摸 | 三/四选项热区 ≥44 CSS px；无 hover 依赖；名册可滚 |
| T10-13 时长 | 四路线各一次，常速 | 每条 ≤20:00；空页更短；记录秒表 |
| T10-14 回归 | v1.2 四段选择 | 行囊/弃物/先渡谁/门板/记名不回退；7 图鉴；五卡 |

回归路径：

- 标题 → 序章 → 湘江 → 遵义 → 金沙江 → 泸定 → 草地 → 吴起/ coda → 结局。
- 四段旧选择（行囊多选、弃物多选、先渡谁、门板/记名）全保留；旧小游戏入口不得复活。
- 7 张图鉴三入口（章节、暂停、结局）仍可打开；结局五卡仍 5 张。

## 7. 时间盒与删句

### 7.1 先删这 5 句 + 合并 1 句

| 位置 | 原句 | 处理 |
|---|---|---|
| 序章 p012 | “路上要是想家，就把板子立起来，看看它从哪儿来。” | 删（p010/p011 已够） |
| 序章 p017 | “我抬头看他。他没看我，只把名单往下压了压。” | 删（p016 已表达） |
| 遵义 z003 | “城里的石板路被踩得发亮。” | 删 |
| 遵义 z009 | “炭盆添过三次，谁也没出来。” | 删 |
| 遵义 z013 | “以前我不爱听，觉得慢。” | 删 |
| 吴起 w028+w029 | 两句中央红军数字 | 合并为“后来有人告诉我，出发的时候，中央红军八万六千人；到陕北，七千余人。” |

- 新增 p023b、g004b、三次危机、coda 约 +25–30 秒；上述删句约 -10–12 秒，仍可能净增 13–18 秒。
- 四路线实测仍超 20:00：先删遵义 z010/z018，再删草地 g006/g007，最后按红线裁金沙江过渡；**不删**序章 p001–p010、湘江 x025、泸定 l019–l027、吴起点名、五卡。
- 任何删句先改 `docs/ending-routes.md` 附录/计划书，再改 `story.js`；不静默删。

### 7.2 时间盒

| 阶段 | 标准 | 压缩 | 说明 |
|---|---:|---:|---|
| A 口径 | 30 | 20 | 文档修正 + 用户确认 O1/O2 |
| B 引擎 | 150 | 100 | 旗标/容量/ending/点名/coda |
| C 剧情 | 210 | 140 | 三次危机 + 吴起/coda 文本 |
| D 名册/迁移 | 90 | 60 | UI + 存储 + 旧档 |
| E 验证/交接 | 120 | 80 | 计时/自动化/证据/tag |
| 合计 | **600** | **420** | 超时只砍“可选句/装饰”，不砍验收 |

## 8. 风险与返工触发

| 风险 | 触发信号 | 处理 |
|---|---|---|
| 20 分钟超时（最硬） | 任一路线 >20:00；两轮仍 >20:30 | 按 §7.1 继续删遵义/草地过渡；空页天然短；不砍点名/五卡 |
| 路线判定与文本不一致 | `strain !== saves`；kongye 仍显示 19；sidao 只有 3 死 | 停，先修 `buildEnding`/flags，再改文本 |
| 死亡后仍出现该角色 | grep 到无 `when` 的林/灶王/飞毛腿/冬生句 | 加守卫或改通用句；每条死亡提及列表见 T10.10 |
| 8 名被判坏档 | 空页结束回地图；console “ending” | 先修 `validEndingNames`/`normalizeEnding`/守卫 |
| 旧档白屏 | 载入旧 ending/wuqi 回标题 | 回滚 tag；用 `docs/evidence/step-10/old-saves` 复现；修迁移 |
| 旧档“门板+3 件”破坏账本 | route 与 names 不一致 | 执行 O1 推荐裁剪 + toast；不接受则记录例外 |
| 移动端选项 <44px | 844×390 实测 | 调 CSS，不缩选项；必要时纵向滚动 |
| 玩家把救人当刷分 | 出现“最佳/全收集”文案 | 删；只保留代价与名字；不显示百分比 |
| 死亡路线像 Game Over | 出现“失败/重来” | 改第三人称 coda；不弹失败；五卡仍在 |

## 9. 禁区

- 不改历史终点；不让真实领导人开口；不把文学当史料；不新增“史实”断言。
- 不做好感度、攻略角色、真结局、周目锁、完成度百分比、分支存档树。
- 不做战斗/养成/商店/升级/BOSS/排行榜/多人/后端。
- 不把牺牲数值化、不评分、不弹 Game Over、不重开。
- 不新增 `minigames.js` 或任何小游戏入口；v1.2 四段选择保留。
- 不升 `xiangbei.save.v1`；不删旧档；不静默改玩家物品。
- 不新增 `||`、比较、字符串条件；只用布尔键 + `!` + `&&`。
- 不直接写 `strain.hurt/strain.dying/fate.lin.dead`；只由派生函数写。
- 不新增美术/音频/字体；不引 CDN；不用 `fetch`/ES module。
- 不打包 `dist/`、不部署、不动线上 v1.1.1。

## 10. 交接接口

- 旗标默认值/上限：`XB.core.FLAG_DEFAULTS`、`FLAG_LIMITS`、`FLAG_KEYS`、`FLAG_PREFIXES`。
- 路线：`XB.core.buildEnding(state).route`；只读，不写 flags。
- 结局：`state.ending`（§4.3）；`normalizeEnding` 是唯一入口。
- 点名：`w026.source="rollcall"`、`c006.source="rollcall",coda:true`；`resolveRollCall(state,coda)`。
- 名册：`xiangbei.roster.v1`；`recordRosterPage(ending)`；标题 `data-action="roster"`。
- 测试：`node project/tools/_pw-step10.js`（新增）；`node project/tools/check-build.js`；`node project/tools/smoke.js`；`node project/tools/check-script.js docs/script`。
- 证据：`docs/evidence/step-10/run-log.md` + 截图/JSON。
- 提交：`step-10: 人物命运四路线（v1.3.0-dev）`；tag `step-10-done`。
- 不做：`dist/` stage/zip、Netlify/GitHub Pages 部署（需单独确认）。

## 11. 复核记录（执行时回填）

| 日期 | 任务 | 结果 | 证据 | 例外/备注 |
|---|---|---|---|---|
|  | T10.0 |  |  |  |
|  | T10.1 |  |  |  |
|  | T10.2 |  |  |  |
|  | T10.3 |  |  |  |
|  | T10.4 |  |  |  |
|  | T10.5 |  |  |  |
|  | T10.6 |  |  |  |
|  | T10.7 |  |  |  |
|  | T10.8 |  |  |  |
|  | T10.9 |  |  |  |
|  | T10.10 |  |  |  |
|  | T10.11 |  |  |  |
|  | T10.12 |  |  |  |

## 12. 开工前检查清单

- [ ] `git status` 干净；当前 HEAD 是 `step-9-done` 之后的提交；记录回滚点。
- [ ] 备份当前 v1.2.0-dev 构建与三份旧档（吴起/泸定/草地）到 `docs/evidence/step-10/old-saves/`。
- [ ] 读 `docs/ending-routes.md` §0–§10、`.claude/CLAUDE.md` 步骤十、`docs/state-schema.md` §9。
- [ ] 确认 O1/O2（旧档行囊、20 分钟删句）；未确认先做引擎，不接名册。
- [ ] 跑基线：`node --check project/engine.js`、`story.js`、`art.js`；`check-build`、`smoke`、`check-script`；记录当前 37/46 基线。
- [ ] 确认没有 `dist/` 改动、没有线上部署、没有新字体/音频/图片。
- [ ] 确认 `story.js` 内联、无 `fetch`/ES module；`SAVE_KEY` 仍 `xiangbei.save.v1`。
- [ ] 确认四路线账本（§2.2）与用户 m00070 口径一致；没有全活。
- [ ] 确认老周必死；林先生保留；空页 18 人/19 名字。
- [ ] 确认五卡保留、空页 sacrifice 新句、7 图鉴仍可解锁。
- [ ] 确认测试设备：Edge 桌面 + 844×390 触摸模拟 + `file://`；Chrome/Safari 为环境例外要如实写。
- [ ] 开工后一次只改一个变量；每完成 T10.x 更新 §11 复核记录。
