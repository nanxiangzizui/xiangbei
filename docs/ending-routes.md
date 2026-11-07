# 《向北》人物命运多结局（v1.3.0-dev 设计稿）

> 状态：**已实现，测试通过**（2026-11-06，v1.3.0-dev）。代码在 `project/`，未打包、未部署；线上仍为 v1.1.1 四关版。
> 上游依据：用户 2026-11-06 的七条方向、人数账本、galgame 禁区清单（m00048 / m00058 / m00070 / m00071）。
> 冲突顺序：用户最新指令 > 本文 > `向北-项目计划书.md` > `.claude/CLAUDE.md` > `docs/`。
> 实施回改见第 11 节；本文正文已按实际代码与实测结果修正，不再保留“计划”口径。

## 0. 一页结论

一句话：**历史终点不变，人物命运分四路；你救的人越多，你自己越接近倒下；没有全活。**

| 路线 id | 名称 | 救 | 死 | 门板 | 你 | 终句 |
|---|---|---|---|---|---|---|
| `sidao` | 四道划痕 | 0 | 4（老周、飞毛腿、灶王、冬生） | 到吴起 | 活着 | 名册上四道划痕。 |
| `menban` | 门板 | 1 | 3（老周 + 两个危机） | 到吴起 | 活着 | 门板到了吴起。你也是。 |
| `qiaoban` | 桥板 / 石墙 | 1–2 | 3（2 救：老周 + 一个危机 + 林先生；1 救：老周 + 两个危机，林活） | 无 | 活着 | 门板留在桥上。你到了吴起。 |
| `kongye` | 空页 | 3 | 2（老周 + 你） | 无 | **死在草地尽头** | 名册上多了一个名字，又划掉了。 |

结算页路线行统一显示 **“结局N（路线名）”**：`结局1（四道划痕）`、`结局2（门板）`、`结局3（桥板/石墙）`、`结局4（空页）`。桥板与石墙共用编号 3，因为它们是同一条 `qiaoban` 路线的两个题名，不另算第五条路线。

四条判定规则：

1. **每次救人记 1 点消耗**（`strain`）；物资只是门槛，扶、背、分口粮本身都算。
2. `strain` 0–1：你活着，轻伤；2：你被抬着走、慢两天，**林先生没等到收容队**；3：你死在草地尽头，队伍没停，**林先生反而活**。
3. 门板背着时腾不出手，**不能背人**，只能用品；门板铺桥算救飞毛腿、记 1 点、此后可背人。
4. 三次危机全救 = 3 点 = 你死。**全活在机制上不存在**；唯一“所有人都到”的假象，是用你的名字换的。

## 1. 边界

### 1.1 保留

- 七章顺序、历史终点、湘江必败 / 遵义必开 / 泸定必夺 / 到吴起，全部不改。
- 单一历史结局：**历史没有分支**；分的是人物命运与谁走到吴起。
- 五张精神卡、7 张史实图鉴、点名、104→19 的数字、20 分钟验收。
- 失败不弹 Game Over、不重开、不评分；死亡用“名字被划掉”和留白。

### 1.2 不做（galgame 禁区，用户已确认）

- 不做好感度条、攻略角色、路线锁、真结局 / 隐藏真结局。
- 不做周目解锁、结局完成度百分比、分支存档树 UI。
- 不做角色选择、战斗、养成、商店、升级三选一、BOSS、排行榜、多人。
- 不做“完美通关”评分；四路线不是四个奖杯，是四种代价。
- 名册回廊只记“应到/未到/谁替你答”，不做百分比、不做成就点。

### 1.3 历史红线（新增内容同样适用）

- 真实人物不进剧情对白；林先生、老周、灶王、飞毛腿、冬生、细妹、何指导员、张老幺均为虚构。
- 老周必死（湘江），不改；飞毛腿、灶王、冬生的死法是虚构细节，不冒充史料。
- 草地断粮、收容队、担架等细节按回忆录口径写，不写成统计数字；新增文本不引新“史实”，不碰 `docs/sources.md`。
- 死亡不写血腥，不写“牺牲值”；只写“没跟上来”“名字空着”。

## 2. 人数账本

### 2.1 三次危机

| 危机 | 位置 | 救谁 | 物资门槛 | 用身体 | 不救 |
|---|---|---|---|---|---|
| 铁索桥 | 泸定 `l019` 重构 | 飞毛腿 | 药 `item.medicine`，或门板铺桥 `item.door=false` | 无（桥上不能背人） | 飞毛腿死 |
| 最后一锅 | 草地 `g018x`（`g019` 前） | 灶王 | 青稞 `item.barley`，或铁锅 `item.homepot` | 替蹲风口：`fire-10`，且 `!item.door` | 灶王死 |
| 草地尽头 | 草地 `g026x`（`g027` 前） | 冬生 | 布鞋 `item.shoes`，或雨布 `item.raincloth` | 背他走：`fire-10`，且 `!item.door` | 冬生死 |

- 每个“救”选项：`strain: "+1"`，同时置对应 `fate.*.dead = false`；“不救”置 `fate.*.dead = true`。
- 物资选项额外置对应 `item.* = false`（药/青稞/锅/鞋/雨布被消耗）。
- 用身体选项不消耗物资，但 `fire-10`；**有门板时不可选**（手占着）。
- 三个危机都发生在现有物资引用之后（药/雨布在湘江段、鞋在泸定段、青稞/锅在草地段），消耗不会破坏后文；`g021` 的小锅改为 `when: "item.homepot"`，烧穿了就跳过。

### 2.2 消耗与生死

| `strain` | 状态 | 后果 | 林先生 |
|---|---|---|---|
| 0 | 没救人 | 你走到吴起 | 活 |
| 1 | 轻伤 | 左肩拉伤，自己走 | 活 |
| 2 | 重伤 | 队伍抬你走、慢两天 | **没等到收容队** |
| 3 | 倒下 | 你死在草地尽头，让他们别停 | 活（队伍没停，收容队保住了） |

- `strain` 数值 0–3，夹取；不写“第几次救”，由 `setFlag` 的 `"+1"` 累加。
- 派生布尔（引擎在每次 `applySet` 后与 `normalize` 时同步）：
  - `strain.hurt = strain >= 2`
  - `strain.dying = strain >= 3`
  - `fate.lin.dead = strain >= 2 && strain < 3`
- **条件只用布尔键**：现引擎 `evalWhen` 只认 `key` / `!key` / `&&`，不支持 `||`、比较、字符串。所有数值阈值必须落成上面的派生布尔，剧本里不写 `strain >= 2`。

### 2.3 门板的三条路

| 门板 | 怎么发生 | 代价 | 后文 |
|---|---|---|---|
| 铺桥 | `l019` A（原有） | `item.door=false`，`trust+1`，`strain+1`，救飞毛腿 | 此后可背人；吴起无板 |
| 抱着 | `l019` B（原有） | 不救飞毛腿，门板到吴起 | 手占着，三次危机都不能用身体 |
| 不带 / 湘江铺掉 | 序章行囊不带，或 `x025a` C | 湘江 C 原有 `hold=true`、`item.door=false` | 手空，可背人；吴起无板 |

- 门板在湘江铺掉也归“无板”，泸定 `l019` 不出现；路线仍按“无板”判。
- 门板路线要求“有板到吴起”：`item.door || memory.door`（`memory.door` 是 `w013` A 留在吴起）。
- 空页必然无板：行囊共 3 格，门板占 2 格，只装得下 1 件物资，最多救 1 人；救 3 人必须不带板、带 3 件物资。
- 新增 `had.door`：序章 `p021` 选门板置 true、选不带置 false；`p024` 只加 `maxWhen: [{when:"item.door", max:1}]`（门板占 2 格）。无板路线的“石墙”文本与 `qiaoban` 子标题用它区分“板铺在桥上”与“从来没有板”。

### 2.4 为什么没有全活

- 三次全救 = 3 点 = 倒下；你倒下，名册由冬生背到吴起，**你的名字空着**。
- 带门板只装得下 1 件物资（行囊 3 格，门板 2 格 + 1 件），最多救 1 人；门板又占着手，不能背人。所以“带板全救”在行囊规则下不存在——这是 p024 就已经付掉的代价。
- 不带门板、三件物资全救：3 点 = 倒下；每救一次都要扶/背/分口粮，物资不能抵消耗。
- 无板但只救 1 人（如药救飞毛腿后不再救）：仍是 3 死（老周 + 两个危机），林活；归 `qiaoban` 的“石墙”子变体。原账本“桥板=救 2”未列此组合，但它由行囊规则必然可达，不能留空。
- 所以“所有人都到”只可能是假象：**你替他们到了**。这是本作对 galgame“全收集”冲动的回答。

### 2.5 路线判定（`buildEnding`）

```js
var saves = 3 - (fate.feimao.dead ? 1 : 0) - (fate.zaowang.dead ? 1 : 0) - (fate.dongsheng.dead ? 1 : 0);
var route = flags["strain.dying"] ? "kongye"
          : saves === 0 ? "sidao"
          : (flags["item.door"] || flags["memory.door"]) ? "menban"
          : "qiaoban";
```

- 新档 `strain === saves`，`saves = 3` 必然 `strain = 3`；路线以 `strain.dying` 判空页，避免只读三个死亡旗标时把“你倒下”漏掉。测试断言这个不变量。
- `fate.lin.dead` 不参与路线判定，只影响吴起章文本与点名。
- 旧档没有 `fate.*` 时按第 4.4 节迁移，不白屏、不把旧档误判成“全活”。

## 3. 四条路线

### 3.1 四道划痕 `sidao`（救 0，死 4）

- 触发：三次都不救；门板可带可不带。
- 吴起：门板立墙根、正面朝外；林先生用门板写标语（有板）或石墙（无板）。
- 点名：何 remote、细妹 self、林 self；老周/灶王/飞毛腿/冬生 absent，四个“到”由你替答。
- 末句：**“名册上四道划痕。门板立在墙根，正面朝外。”**
- 五卡：`sacrifice` 看湘江 hold；其余按原条件，可全灰。

### 3.2 门板 `menban`（救 1，死 3，板到吴起）

- 触发：三次中救 1 人，且门板还在（`item.door` 或 `memory.door`）；无板不可能进本路线。
- 吴起：门板借给林先生写标语；`w013` 原选择“留吴起/带回于都”保留，两个终句都算本路线。
- 点名：何 remote、细妹 self、林 self、被救的那 1 人 self；老周 + 另两个危机 absent，三个“到”由你替答（沿用 `w027b`）。
- 末句：**“门板到了吴起。你也是。”**
- 五卡：若湘江 hold，`sacrifice` 亮句仍是“你把最后一批人，留在了江东岸。”；否则暗。

### 3.3 桥板 / 石墙 `qiaoban`（救 1–2，死 3，无板）

- 触发：无板，且救 1–2 人；`strain = 救人数`。
- 两个子变体：
  - **2 救、林死**：老周 + 没救的那个 + 林先生 = 3 死；点名时林先生的名字空着。
  - **1 救、林活**：老周 + 两个没救的 = 3 死；林先在石墙写标语，活到吴起。
- 题名再分：`had.door` 为真 → “桥板”（门板铺在泸定桥/湘江浮桥）；为假 → “石墙”（从来没有门板，字写在石墙上）。同一 `qiaoban` 路线，两种质感，不算第五条路线。
- 吴起：无板，林先生找石墙；`w006b`（`!item.door && !fate.lin.dead`）/ `w006c`（`!item.door && fate.lin.dead`）分“她来写”与“旧标语还在”；`w014b/w014c`、`w015c/w015d`、`w016c/w016d` 同条件分叉；`w022/w022a` 按 `fate.lin.dead` 分“她应了一声”/“名字空着”。
- 点名：何 remote、细妹 self、2 个被救者 self；老周 + 1 个危机 +（2 救时）林 absent。
- 末句：**“门板留在桥上。你到了吴起。”**；`had.door === false` 时标题改“石墙”，末句改“字写在石墙上。你到了吴起。”。
- 五卡：`sacrifice` 看湘江 hold。

### 3.4 空页 `kongye`（救 3，死 2，你死）

- 触发：三次全救，`strain=3`；必然无板（带板只装 1 件物资，最多救 1 人）。
- 结构：**独立隐藏章 `coda`**，不进入吴起章；叙事先切第三人称，再由冬生交名册。
- 文本（c001–c012，实际节点）：
  1. `c001` title：终章·吴起（一九三五年·十月，陕北·吴起镇，bg `wuqi_dawn`）。
  2. `c002` “满崽没有到吴起。”
  3. `c003` “到吴起那天，全连十八个人。名册上有十九个名字。”
  4. `c004` 冬生：“满崽的名字，我替他答。”
  5. `c005` “指导员翻开名册，纸边全是毛的。”
  6. `c006` interact 8 人（`coda:true`）：何 remote、细妹 self、林 self、老周 absent、灶王 self、飞毛腿 self、冬生 self、满崽 absent（`answeredBy:"冬生"`）。
  7. `c007` “念到满崽。冬生答：‘到。’”
  8. `c008` “念完，冬生翻到最后一页。”
  9. `c009` “他添上满崽，又划掉。笔画很轻。像怕吵醒谁。”
  10. `c010` codex `wuqi` 解锁。
  11. `c011` “名册上多了一个名字，又划掉了。”
  12. `c012` end → ending。
- 末句：**“名册上多了一个名字，又划掉了。”**
- 统计：`companyEnd = 18`；红一方面军 86,000→7,000 不变。
- 五卡：`sacrifice` 强制亮，亮句改为 **“你把自己，留在了草地尽头。”**（替换原“你把最后一批人，留在了江东岸。”）；其余四卡按原条件。
- 注意：空页不是“全员到齐”——老周空着，张老幺留在金沙江，六人应到、两人没到；文本不写“所有人都到了”。

## 4. 节点与旗标

### 4.1 新旗标（全部布尔，除 `strain`）

| 键 | 类型 | 默认 | 谁写 | 用途 |
|---|---|---|---|---|
| `fate.feimao.dead` | bool | false | l019 抱板走 / l019x 继续走 / 默认 | 飞毛腿死 |
| `fate.zaowang.dead` | bool | false | g018x 不救 / 默认 | 灶王死 |
| `fate.dongsheng.dead` | bool | false | g026x 不救 / 默认 | 冬生死 |
| `fate.lin.dead` | bool | false | **派生** `strain>=2 && strain<3` | 林死 |
| `fate.all.dead` | bool | false | **派生** 三个危机全 dead | 吴起“四个名字”/“三个名字”互斥 |
| `had.door` | bool | false | p021 A 置 true / B 置 false | 区分“桥板”与“石墙” |
| `strain` | number | 0 | 每次救 `"+1"` | 0–3 消耗 |
| `strain.hurt` | bool | false | **派生** `strain>=2` | 吴起文本/点名 |
| `strain.dying` | bool | false | **派生** `strain>=3` | 进 coda / 跳过吴起 |

- 加入 `FLAG_KEYS`（`strain`、`had.door`）与 `FLAG_PREFIXES`（`memory.`、`choice.`、`fate.`）；`FLAG_LIMITS.strain = [0,3]`；`had.door` 与 `fate.*` 进 `BOOLEAN_FLAGS`。
- `fate.all.dead` 是实施时新增的派生键：`evalWhen` 只支持 `key`/`!key`/`&&`，吴起 `w027b`（三个名字）与 `w027c`（四个名字）需要互斥，不能写“三个都死”的组合式。
- 不新增 `route` 旗标：路线只在 `buildEnding` 算一次，写进快照 `ending.route`。
- 不新增“救人方式”字符串：方式由选项文案/cost 表达，后续文本不按方式分叉。
- `syncDerivedFlags(state)` 放在 `applySet` 末尾、`applyMultiChoice` 末尾、`normalize` 合完 flags 之后；只写四个派生键，幂等。旧档补完 `had.door` 后也要再同步一次。

### 4.2 `story.js` 改动

| 位置 | 实际改动 |
|---|---|
| 序章 `p021` | A 有板：`had.door=true`、`item.door=true`、`load+2`、`fire+10`，cost“行囊只剩一格，多背三十斤”；B 无板：`had.door=false`、`item.door=false`、`load+0` |
| 序章 `p024` | 行囊共 3 格；保留 5 选 3、门板占 2 格；加 `maxWhen: [{when:"item.door", max:1}]`，带板时最多再选 1 件 |
| 泸定 `l019` | 有板 3 选（12s，默认 C）：A 铺桥（`item.door=false`、`trust+1`、`strain+1`、`fate.feimao.dead=false`、`memory.fly_bridge`）；B 喂药（`requires:item.medicine`，消耗药、`strain+1`、救、`memory.fly_medicine`）；C 抱板走（`fate.feimao.dead=true`、`memory.fly_leave`） |
| 泸定 `l019x` | 无板 2 选（12s，默认 B，`when:"!item.door && !choice.luding.door"`）：A 喂药（同 B）；B 继续走（死）。加 `!choice.luding.door` 是因为 A 铺桥会把 `item.door` 置 false，只看板会让 l019x 在同一回合再次出现 |
| 泸定 `l019a/b/c/d` | `l019a` 看 `choice.luding.door`；`l019b` 看 `item.door`；`l019c` 看 `memory.fly_medicine`（已移到 `l020` 后、`l021` 前，先写敷药再过桥）；`l019d` 看 `fate.feimao.dead`（过桥后回头） |
| 泸定 `l022–l026` | `l022/l023/l024/l025/l026` 全加 `when:"fate.feimao.dead"`；新增 `l022a`（活着，“扶着桥头石桩喘匀”）、`l024a`（活着，冬生递水壶） |
| 草地 `g004/g005` | 都加 `when:"item.door"`（门板当床）；新增 `g004b`（`!item.door`，“草底下是水”） |
| 草地 `g018x` | `g018` 后，16s 默认 D：A 青稞（`requires:item.barley`）/ B 铁锅（`requires:item.homepot`）/ C 替蹲风口（`requires:"!item.door"`，`fire-10`）/ D 不救；救者均 `strain+1`、消耗对应物资、`fate.zaowang.dead=false`、记 `memory.zaowang_*` |
| 草地 `g019` | 加 `when:"fate.zaowang.dead"`；新增 `g019a`（`!dead`，“火起来了。他站起来，膝盖响了一声。”） |
| 草地 `g020–g023b` | `g020/g020a/g021/g022a/g022b/g023b` 全加 `when:"fate.zaowang.dead"`；`g021` 再加 `item.homepot`；新增 `g021b`（`dead && !item.homepot`，“我把小锅留在了火堆边”） |
| 草地 `g026x` | `g026` 后、`g027` 前，12s 默认 D：A 布鞋（`requires:item.shoes`）/ B 雨布（`requires:item.raincloth`）/ C 背他走（`requires:"!item.door"`，`fire-10`）/ D 不救；救者均 `strain+1`、消耗物资、`fate.dongsheng.dead=false`、记 `memory.dongsheng_*` |
| 草地 `g028a/b` | 在 `g027` 后：`g028a`（dead，“冬生没跟上来。他的号在草里”）/ `g028b`（活着，“到了吴起，我吹给全连听”） |
| 草地 `g028d–g028g` | 在 `g028` 后，全 `when:"strain.dying"`：走不动 → 交名册 → “别停” → 冬生背名册、队伍没停 |
| 草地 `g029/g030/g899/g900` | `g029` title 加 `when:"!strain.dying"`；`g030` codex 无条件；`g899` end（`strain.dying`，next coda）；`g900` end（`!strain.dying`，next wuqi） |
| 吴起 `w006b/c` | `w006b` 改 `!item.door && !fate.lin.dead`；新增 `w006c`（`!item.door && fate.lin.dead`，旧标语是林先生写的） |
| 吴起 `w014b/c` | `w014b` 加 `!fate.lin.dead`；新增 `w014c`（`!item.door && fate.lin.dead`，“她没有来”） |
| 吴起 `w015c/w016c` | 加 `!fate.lin.dead`；新增 `w015d/w016d`（`!item.door && !memory.door && fate.lin.dead`，石墙旧标语） |
| 吴起 `w022/w022a` | `w022` 加 `!fate.lin.dead`；新增 `w022a`（`fate.lin.dead`，“她没等到收容队”） |
| 吴起 `w024/w025` | `w024` 加 `fate.zaowang.dead` + 新增 `w024a`（活着，“从锅边抬起头”）；`w025` 加 `fate.feimao.dead` + 新增 `w025a`（活着，“把号举了举”） |
| 吴起 `w026` | 删静态 `names`，保留 `mode:"rollcall"`、`duration:"45"`；名字由 `resolveRollCall(state)` 动态生成 |
| 吴起 `w027b/c` | `w027b` 条件 `!memory.rollcall_missed_any && !fate.all.dead`（“三个人的名字”）；新增 `w027c`（`!memory.rollcall_missed_any && fate.all.dead`，“四个人的名字”） |
| 吴起 `w028/w029` | 合并为“后来有人告诉我，出发的时候，中央红军八万六千人；到陕北，七千余人。” |
| 吴起 `w030/w031` | 加 `when:"!strain.dying"`；空页在 coda 内写 18 人 |
| `story.ending.routes` | 四路线标题 + lede；qiaoban 另有 `altTitle:"石墙"` / `altLede`；结局面板在五卡上方显示路线 |
| `coda` 章 | `{ id:"coda", order:8, title:"终章·吴起", playable:true, hidden:true }`；c001–c012 见 3.4；地图与解锁跳过 `hidden` |

- 所有新增 `when` 只用布尔键 + `!` + `&&`；不写比较、不写字符串、不写 `||`。
- `l019x` 的额外 `!choice.luding.door` 是实测修掉的顺序 bug：选铺桥后 `item.door` 为 false，只按板判断会让无板危机在同一回合重新出现。
- `g018x/g026x` 的“用身体”选项都要求 `!item.door`；带板时只能用品或放弃，和“门板占着手”一致。

### 4.3 `engine.js` 改动

1. `buildEnding` 返回 `{stats,names,answered,missed,cards,route,routeTitle,routeLede,fate,strain,recorded}`。`stats.companyEnd` 空页 18、其余 19；`fate` 为四人 `alive/dead`；`route` 按 2.5 节；`sacrifice` 条件 `route==="kongye" || choice.xiangjiang.hold===true`，空页亮句用 `story.ending.kongyeSacrificeLine`。
2. 选项可见性：`option.requires` 复用 `evalWhen`；`visibleOptions` 过滤，`defaultOptionKey` 在默认项不可见时取第一个可见项（超时仍必须能结算）；`applyChoice` 对不可见项返回 `null` 并 `console.error`，不静默吞掉契约错误。`effectiveMultiMax` 合并 `node.max` 与 `maxWhen`，UI 与 `applyMultiChoice` 共用。
3. 点名解析：`resolveRollCall(state,coda)` 生成 7 个固定人物（何 remote、细妹 self、林按 `fate.lin.dead`、老周 absent、灶王/飞毛腿/冬生按 `fate.*.dead`）；`coda` 时追加满崽 absent + `answeredBy:"dongsheng"`。`w026` 与 `c006` 都不再存静态名字。
4. 地图 / 解锁：`MAP_STATIONS` 仍 7 站；`finishChapter` 对 `chapter.hidden` 跳过 `unlockedChapters.push` 与解锁 toast；coda 只能由 `g899` 进入。
5. ending 场景：`#ending-route` 显示“结局N（路线名） · lede”；编号 1 四道划痕、2 门板、3 桥板/石墙、4 空页；名字有 `answeredBy` 时显示“冬生 代答”/“你 代答”；快照 `recorded` 继承上一份，`recordEndingPage` 用它防重复写名册。
6. 名册回廊：`xiangbei.roster.v1`（`{version:1,pages:[{route,title,at,companyEnd,names,note}]}`，最多 8 页、丢最旧）；标题页“名册”入口；只读；存储失败 `try/catch` 提示“本机无法保存名册，本局仍可继续”。
7. 结局落档：`finishChapter` 的 ending 分支先 `state.choices = []` 再 `buildEnding/saveNow`，因为完整选择日志会让存档超过 `MAX_SAVE_BYTES=4096`；结局快照已包含所有决定。
8. 旧档迁移见 4.4；`SAVE_KEY` 仍 `xiangbei.save.v1`（不升版本，只补默认键）。

### 4.4 旧档迁移

| 旧档位置 | 迁移 |
|---|---|
| `ending` 场景 | 直接读快照；缺 `route` 时补 `route:"legacy"`、`routeTitle:"旧档"`、`routeLede:""`，**不重算**路线 |
| 所有旧档 | 缺 `had.door` 时回填：`choice.prologue.door===true` 或 `item.door===true` 或 `choice.luding.door===true` |
| `wuqi` 章 | `fate.feimao.dead=true`、`fate.zaowang.dead=true`、`fate.dongsheng.dead=false`、`strain=1`（冬生默认活）；落档 + toast“旧存档已补记人物命运” |
| 泸定 `l022` 及以后 | `fate.feimao.dead=true`；`strain=0`；落档 + toast |
| 草地 `g019` 及以后 | `fate.zaowang.dead=true`；落档 + toast |
| 更早 | 全默认；新危机照常触发 |

- 迁移只在 `source` 没有 `fate.feimao.dead` 时执行（即 v1.2 旧档）；已有新旗标的档不覆盖。
- 旧档没有 `strain` 时一律补 0；不把“旧档里活着的人”反推成“你救过”，避免误判路线。
- 旧档物资不裁剪（O1 未执行）：带板旧档若停在 `p024`，多选会按 `maxWhen` 要求重新取舍；已过 `p024` 的旧档按实际 `saves`/门板归类，不改库存、不删玩家数据。
- 迁移发生在 `normalize`；写回时保留未知键；迁移后立即 `syncDerivedFlags`。

## 5. 点名矩阵

| 路线 | 何 | 细妹 | 林 | 老周 | 灶王 | 飞毛腿 | 冬生 | 满崽 | 应到 | 没到 |
|---|---|---|---|---|---|---|---|---|---|---|
| 四道划痕 | remote | self | self | absent | absent | absent | absent | — | 3 | 4 |
| 门板 | remote | self | self | absent | 救者 self / 另两人 absent | 同左 | 同左 | — | 4 | 3 |
| 桥板（2 救） | remote | self | absent | absent | 2 救者 self / 1 人 absent | 同左 | 同左 | — | 4 | 3（含林） |
| 桥板（1 救） | remote | self | self | absent | 1 救者 self / 2 人 absent | 同左 | 同左 | — | 4 | 3 |
| 空页 | remote | self | self | absent | self | self | self | absent（冬生答） | 6 | 2 |

- `status`：`self` 本人在场应到；`remote` 兄弟部队代应；`absent` 没人应；空页的满崽 `absent` 但 `answeredBy:"冬生"`，点名时不划掉、念完再添名再划掉。
- `w027` 文案：0 救且没有漏答时“四个人的名字，我都替他们答了”（`w027c`）；1–2 救且没有漏答时“三个人的名字，我都替他们答了”（`w027b`）；有漏答时 `w027a` 优先（“有几个名字，我没有替他们答上来”）。空页在 coda 内不写这句，由 c007–c009 收束。
- 何指导员不占“没到”名额；他调走了，算 remote。

## 6. 名册回廊

- 入口：标题页“开始 / 继续 / 史实图鉴”旁加“名册”；只读，不改变任何游戏状态。
- 每页：路线名 + 日期 + “到吴起 N 人” + 名字（普通路线 7 名、空页 8 名；应到墨实、未到划掉、替答标“冬生代答/你代答”）+ 一行 note；不显示百分比、不显示“1/4”。
- 最多 8 页，超出丢最旧；同一局只记一次（`ending.recorded`）。
- 存储失败（隐私模式/`file://` 禁用）：面板显示“本机无法保存名册，本局仍可继续”，不白屏、不阻断结局。
- 清档不影响名册；名册也不影响路线判定。

## 7. 文案与时长

- 文本源 **5285 字 / 285 beat**（`count-words.js`，含互斥的死/活、有板/无板分支，不等于单周目阅读量）。
- 单周目可见正文 **3254–3931 字 / 180–215 line**：空页最短（3254 字），四道划痕最长（3931 字）；门板 3894、桥板 3705、石墙 3785。
- 按 B 口径（0.258 秒/字，慢读）估算，纯正文 **13:59–16:54**；加三次危机选择、图鉴、点名与转场，预计仍在 20:00 内，但**尚未做四路线真人计时**（见第 9 节 P1）。
- 危机限时：飞毛腿 12s、灶王 16s、冬生 12s，默认都是“不救”；超时按默认结算并记 `timedOut:true`。
- 为控制时长已删 5 句：序章 p012“路上要是想家…”、p017“我抬头看他…”，遵义 z003/z009/z013；吴起 w028+w029 合并为“后来有人告诉我，出发的时候，中央红军八万六千人；到陕北，七千余人。”。
- 空页不走吴起章（跳过 w001–w041），改走 118 字/8 line 的 coda；文本更短，但第三次危机与“你倒下”的段落更长。
- 终章文本源 1004 字（含 w006b/c 等互斥分支），单周目 626–709 字；未再扩写吴起。

## 8. 测试矩阵与结果（2026-11-06–07）

| 用例 | 覆盖 | 结果 | 证据 |
|---|---|---|---|
| T10-01 四道划痕 | 三危机全不救、带板到吴起 | **PASS** | routes 44/44，`sidao.png` |
| T10-02 门板 | 药救飞毛腿、板到吴起 | **PASS** | routes 44/44，`menban.png` |
| T10-03 桥板 2 救 | 铺桥 + 替蹲风口；无板、林死 | **PASS** | routes 44/44，`qiaoban-bridge.png` |
| T10-04 石墙 1 救 | 从未带板、只救飞毛腿；林活 | **PASS** | routes 44/44，`qiaoban-wall.png` |
| T10-05 空页 | 药 + 青稞 + 鞋，strain=3 | **PASS** | routes 44/44 + coda 19/19，`kongye-ending.png` |
| T10-06 带板救 2 不可达 | p024 带板只允许 1 件；l019 后无第二救 | **PASS** | maxwhen 15/15；p024 max=1 |
| T10-07 湘江铺板 | 无板后走危机用身体 | **PASS（覆盖 item.door=false 路径）** | crises 68/68；未单独重跑 x025a |
| T10-08 超时 | l019 不点，12s 后按默认 C | **PASS** | timeout 14/14；`l019-timeout.png` |
| T10-09 旧档 | v1.2 吴起 / 泸定 l022 / 草地 g019 | **PASS** | migration 17/17 |
| T10-10 隐私模式 | localStorage 禁用 | **沿用步骤七结论，本步未重跑** | 代码路径未改 |
| T10-11 刷新 | l019 铺桥后刷新回 l019a | **PASS** | timeout 14/14 |
| T10-12 移动 | 844×390 触摸、选项 ≥44px | **PASS** | mobile 12/12 |
| T10-13 时长 | 四路线 | **文本估算 13:59–16:54；真人计时未做** | 见第 7 节 |
| T10-14 回归 | 行囊/弃物/先渡谁/门板/记名/7 图鉴/五卡 | **PASS** | flow 12/12 66s |
| T10-15 结局编号 | 结算页路线行前缀“结局N（路线名）” | **PASS** | routes 44/44、coda 19/19；1/2/3/4 对应四道划痕/门板/桥板·石墙/空页；截图 `menban.png`、`qiaoban-bridge.png`、`kongye-ending.png` |

- 自动化命令：`node project/tools/_pw-step10.js --url=http --case=all`（或 `--case=routes|coda|crises|migration|maxwhen|timeout|mobile|flow`）。
- http：routes 44/44、coda 19/19、crises 68/68、migration 17/17、maxwhen 15/15、timeout 14/14、mobile 12/12、flow 12/12（66s）。
- file://：flow 12/12（66s）、routes 44/44、crises 68/68、coda 19/19。
- 全部运行 0 console error / 0 pageerror / 0 失败请求 / 0 外部请求。
- 断言不变量：`saves === 3 - 危机死亡数`；新档 `strain === saves`；`kongye → companyEnd 18`；`sidao → 4 dead`；`fate.lin.dead === (strain>=2 && strain<3)`。

## 9. 验收与风险

验收（v1.3.0-dev 底线）：

- 四条路线均可从标题走到结局：**PASS**（routes 44/44；http 与 file://）。
- 每局点名与路线账本一致：**PASS**（coda 19/19；7/8 名、companyEnd 18/19、满崽由冬生代答）。
- 五卡四条路线可亮可暗；空页 `sacrifice` 必亮且用新句：**PASS**（coda 断言“你把自己，留在了草地尽头。”）。
- 7 张图鉴仍可解锁：**PASS**（flow 12/12；图鉴入口未改）。
- 名册回廊四页可读：**PASS**（routes 44/44；每页 7 或 8 行）。
- 键盘 / 触摸 / 刷新 / 旧档：**PASS**（timeout/refresh 14/14、mobile 12/12、migration 17/17）。
- 隐私模式降级：**未在本步重跑**（P1，步骤七已通过；名册写入失败提示已接入）。
- 20 分钟内：**文本估算通过，真人四路线计时未做**（P1）。
- 0 console error：**PASS**（http/file 全部用例）。

风险：

| 风险 | 处理 |
|---|---|
| 20 分钟超时（最硬） | 文本估算 13:59–16:54；若真人计时超，按红线先删遵义过渡、再砍草地，保留序章/湘江/泸定/点名 |
| 分支文本债务 | 只给飞毛腿/灶王/冬生/林先生/门板加守卫；老周锁死；其余用 `fate.*` 单布尔 |
| 路线判定与文本不一致 | 路线只在 `buildEnding` 算；点名用同一 `resolveRollCall`；测试断言 `strain===saves` |
| 旧档误判 | 4.4 迁移 + toast；旧 ending 快照直读 `legacy`，不重算 |
| 玩家把“救人”当刷分 | 无分数、无百分比；救越多自己越近死亡；名册只记事实 |
| 死亡路线观感像 Game Over | 不弹失败、不重开；第三人称 coda、名册继续走、五卡仍在 |

## 10. 实施记录（2026-11-06）

1. 口径：本文、计划书、story-bible、`docs/state-schema.md`、`.claude/CLAUDE.md`、Cursor 规则改为 v1.3.0-dev。
2. 引擎：旗标白名单 + `strain` 夹取 + `syncDerivedFlags` + `option.requires/defaultOptionKey/effectiveMultiMax` + `buildEnding` 路线 + `resolveRollCall` + hidden 章 + ending 路线行/名册写入。
3. 剧情：泸定 `l019/l019x` 重构 → 草地 `g018x/g026x` → 吴起守卫 → `coda`；先改文本源，再同步 `story.js`。
4. 名册回廊 + 旧档迁移 + 标题入口；`xiangbei.roster.v1` 最多 8 页。
5. 自动化：`_pw-step10.js` 九类用例；check-build 补 C39/C40；smoke 改八章/34 旗标/动态点名。
6. 证据 `docs/evidence/step-10/`；`dist/` 未重打包、未部署；线上仍为 v1.1.1 四关版。

## 11. 设计稿回改表（D1–D12）

实现时按代码与实测回改设计稿；下表是最终口径。

| # | 原设计稿 | 实际实现 | 原因 |
|---|---|---|---|
| D1 | `had.door` 在 p024 选门板时置 true | p021 A 置 true、B 置 false；p024 不动它 | p021 才是“带不带门板”的决定；p024 只决定再带哪几件 |
| D2 | p024 保留原 max=3；p021 A cost“只剩两格” | p024 加 `maxWhen:[{when:"item.door",max:1}]`；p021 A cost 改“只剩一格” | 门板占 2 格，带板只能再带 1 件；文本与 UI 上限一致 |
| D3 | l019 三选默认 A；无板复用同一节点 | 有板 l019 三选默认 C 12s；无板独立 l019x 两选默认 B 12s | 无板时没有“铺桥/抱板走”，必须拆节点；默认“不救”才是代价 |
| D4 | l022–l026 无条件 | 全加 `when:"fate.feimao.dead"`；新增 l022a/l024a 活分支 | 飞毛腿活着时不能出现“没过来/取号” |
| D5 | g004/g005 无条件 | 都加 `when:"item.door"`；新增 g004b 无板句 | 门板当床只对有板成立 |
| D6 | 灶王死亡段无守卫；g021 不分锅 | g020–g023b 全加 `fate.zaowang.dead`；g021 再加 `item.homepot`；新增 g019a/g021b | 救活后不能走死亡段；锅被消耗后不能再“背上锅” |
| D7 | 林先生死亡只改 w022 | w006b/c、w014b/c、w015c/d、w016c/d、w022/a 全拆；w015c/w016c 加 `!fate.lin.dead` | 林先生死在不同节点会留下“她正在收粉笔”等矛盾句 |
| D8 | `validEndingNames` 固定 7 名 | 允许 7 或 8 名；`answered/missed` 0–8 | 空页多一个满崽；普通路线仍 7 名 |
| D9 | ending 守卫只允许 `chapterId==="wuqi"` | 允许 `wuqi` 或 `coda` | 空页从 coda 结算 |
| D10 | coda 进地图/解锁 | `MAP_STATIONS` 仍 7 站；`finishChapter` 对 `hidden` 跳过解锁与 toast | 隐藏章不能被玩家从地图重入 |
| D11 | g030 在 g899/g900 之后 | g030 无条件放在两个 end 之前 | 空页也要解锁草地史实注 |
| D12 | 旧档带板物资 >1 裁到 1 件 | **不裁剪**（O1 未执行）；停在 p024 的旧档按 `maxWhen` 重新取舍 | 不删玩家数据；已过 p024 的旧档按实际 saves 归类 |

实施新增（不在 D1–D12 内）：

- `fate.all.dead`：三个危机全 dead 的派生布尔。`evalWhen` 不支持 `||`，吴起 `w027b`（三个名字）与 `w027c`（四个名字）需要互斥。
- `l019x` 条件加 `!choice.luding.door`：铺桥会把 `item.door` 置 false，只看板会让无板危机在同一回合二次出现。
- `l019c` 从 l021c 后移到 l020 后、l021 前：先写敷药，再过桥。
- 结局落档前清空 `state.choices`：完整选择日志会让存档超过 4096B；结局快照已含全部决定。
