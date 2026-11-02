# 《向北》小游戏数值（步骤四定稿）

> 唯一生效值在 `project/minigames.js` 的 `RULES`；本表与它同名同值。调参只改 RULES，再回填本表与 `docs/minigame-system.md` §8，最后跑 `check-build` C22。
> 参考《60 Seconds!》《Papers, Please》《Mini Metro》《Celeste》的节奏，不照搬数值；不追求硬核平衡，先保证 20 分钟能走完。

## 1. 时长口径

- 每关有 `target`（可玩段目标）与 `duration`（保险丝上限）。验收看 `target + settle`，即 65/70/80/70 秒，落在“每关 60–90 秒”内。
- 正常首通应在 target 附近结束；duration 只防止卡死，不是让玩家每次都耗到上限。
- 结算面板 `settle = 20s` 是阅读时间预算，不是计时器；玩家可提前点“继续”。
- 四关合计可玩 205s + 结算 80s = 285s（4:45），已计入 `story-bible` §4.4 的 19:48。

## 2. 总表

| 关 | target | duration | settle | 含结算 | 核心资源 | 失败代价 |
|---|---:|---:|---:|---:|---|---|
| 门板 door | 45 | 75 | 20 | 65 | 6 格行囊、门板 2 格、5 件可选 | 少带物 → 湘江/草地对话缺物；不 Game Over |
| 弃物 abandon | 50 | 80 | 20 | 70 | 2 批 ×3 件、追兵 45s、重物 −8s | 重物带上 → 追兵提前；药箱留下 fire−15；门板留下 item.door=false |
| 渡船 boat | 60 | 90 | 20 | 80 | 6 船 ×8 人、船工 12–37、疲劳 0–100 | 少渡几趟 → choice.jinsha.trips 少；不列人名 |
| 攀索 climb | 50 | 75 | 20 | 70 | 22 光点、3 段、命中窗 0.35s、火墙 3 次 | 光点暗 → lights_lost；fire−5×min(lost,3)；不重开 |
| 探路/分粮（第 5 关） | — | — | — | — | 6×6 网格、8 沼泽、粮 6 | **核心版不做**；草地只做对话与资源选择 |

## 3. 逐关

### 3.1 门板（序章，p024）

- 8 张卡：门板、花名册、铅笔、药、青稞、铁锅、雨布、布鞋。
- 容量 6 格；门板固定 2 格（左上 2×1）且不可丢；花名册/铅笔随身 0 格；药 1、青稞 1、铁锅 2、雨布 1、布鞋 1。
- 带门板：2 + 6 = 8 格 > 6，必须舍 2 格；不带门板：5 件正好 6 格，全装得下（代价交换，不是奖励）。
- 75 秒倒计时；最后 10 秒 HUD 脉冲（reduced-motion 关闭）；时间到按当前选择结算。
- 写 `inventory.items = ['roster','pencil', ...selected]`（不含 door）、`item.pot`；不写 `item.door`。
- 结果：carried = 门板（若有）+ 选中；left = 未选可选；花名册/铅笔只进 note。
- 没有“成功/失败”文案；超时只说“天亮了，行囊就这么大”。

### 3.2 弃物（湘江，abandon）

- 6 件基础：三百斤的箱子（xray）、印刷机（press）、文件箱（files）、药箱（medkit）、电台（radio）、银元（silver）；有门板再加 door。
- 两批，每批最多 3 件；0 件不能发，1–3 可发；第一批上船不可反悔。
- 追兵 45 秒从**第一次发船**开始；每带上 1 件重物（xray/press/files），追兵剩余 **−8 秒**。注意方向：是“带上才提前”，不是“留下才提前”。
- 三件重物第一批 → 追兵只剩 21 秒，第二批必须极快；门板不占重物惩罚。
- 追兵到 0：立即结束；本批已上船的有效；未上的全部留下。
- 80 秒到：已发批次有效，其余留下；不重开。
- 写 `choice.xiangjiang.abandoned`（留下 id，固定顺序，≤7）；门板留下 → `item.door=false`；药箱留下 → `fire−15`。
- UI 只写“三百斤的箱子”，不写“X 光机”；结果两栏“带过江/留在江那边”，不评分。

### 3.3 渡船（金沙江，boat）

- 6 条船，每船 8 人；每船 3 名船工；计划 18 个载人航次（6×3）。
- 船工 = trust 0–6 → 12/18/24/30/37/37/37（trust>5 按 5）；可用船 = min(6, floor(船工/3))：trust 0 只有 4 条，trust≥1 有 6 条。
- 出程 = max(9, 12 − floor(船工/12))；返程 12；每完成一程疲劳 +12；≥80 出程 +4s；=100 必须休息。
- 休息 12s，疲劳 −12；休息中不可派；可多船同时休息。
- 点船即装 8 人出发；到对岸 trips+1；返程不可再派；18 趟或 90 秒结束。
- 追兵 120s 只作远景小字，不倒数、不驱动失败；时序上不允许 120s 先到。
- 写 `choice.jinsha.trips`（0–18）；结果只写“已渡 X/18”，不列人名、不写死亡。

### 3.4 攀索（泸定，climb）

- 3 段、13 根铁索、22 个光点；每步 1.8s，命中窗 0.35s。
- 窗内点中：step+1、点亮一个；窗外点空：lost+1、熄一个、不推进。
- 第 6/12/18 步触发火墙：1.5s 内连点 3 次；成功继续；失败 lost+1；不 Game Over。
- 结束：reached+lost=22（done）、lost=22（done，全灭）、75s（time）。
- 写 `lights_lost=lost`（绝对赋值，不 +=）；`fire = clamp(fire − 5×min(lost,3), 0, 100)`；不写 memory.*。
- 结果只写“过去 X 个光点，暗了 Y 个”；不点名、不写牺牲人数、不画脸/血/燃烧的人。

### 3.5 第 5 关（不做）

- 探路/分粮的 6×6 网格、8 沼泽、粮 6 是完整版数据，**核心版不实现**；草地只做对话 + 分粮/让粮选择。
- 不在 minigames.js 里留半成品网格；不因“以后可能”加抽象。

## 4. RULES 参数表

| 键 | 值 | 说明 |
|---|---|---|
| door.duration | 75 | 上限 |
| door.target | 45 | 可玩段目标 |
| door.settle | 20 | 结算阅读预算 |
| door.capacity | 6 | 行囊格数 |
| door.doorCost | 2 | 门板格数 |
| door.items | 8 | 卡数（含门板/随身） |
| door.warnAt | 10 | 最后 10s 脉冲 |
| abandon.duration | 80 | 上限 |
| abandon.target | 50 | |
| abandon.settle | 20 | |
| abandon.batches | 2 | 两批 |
| abandon.quota | 3 | 每批最多 |
| abandon.items | 6 | 基础件数（不含门板） |
| abandon.enemy | 45 | 首船后追兵秒数 |
| abandon.heavyPenalty | 8 | 每件重物提前秒数 |
| boat.duration | 90 | |
| boat.target | 60 | |
| boat.settle | 20 | |
| boat.boats | 6 | |
| boat.capacity | 8 | 每船人数 |
| boat.crewPerBoat | 3 | 每船船工 |
| boat.plannedTrips | 18 | 计划航次 |
| boat.crewByTrust | [12,18,24,30,37,37,37] | trust 0–6 |
| boat.outbound | 12 | 出程基础 |
| boat.inbound | 12 | 返程固定 |
| boat.tripMin | 9 | 出程最低 |
| boat.crewStep | 12 | 每 12 船工 −1s |
| boat.fatiguePerLeg | 12 | 每程疲劳 |
| boat.fatigueSoft | 80 | 出程 +4s 阈值 |
| boat.fatigueHard | 100 | 必须休息 |
| boat.rest | 12 | 休息秒数 |
| boat.restRecovery | 12 | 休息恢复 |
| boat.enemy | 120 | 只远景 |
| climb.duration | 75 | |
| climb.target | 50 | |
| climb.settle | 20 | |
| climb.spans | 3 | 铁索段 |
| climb.lights | 22 | 光点 |
| climb.stepMs | 1800 | 每步毫秒 |
| climb.hitWindow | 0.35 | 命中窗秒 |
| climb.fireAt | [6,12,18] | 火墙步 |
| climb.fireTaps | 3 | 连点次数 |
| climb.fireWindowMs | 1500 | 火墙窗口 |

## 5. 公式（纯函数）

- `usedSlots(items, hasDoor) = (hasDoor ? 2 : 0) + Σ slots(item)`；`> 6` 拒绝。
- `canPack(selected, add, hasDoor) = usedSlots(selected + add, hasDoor) <= 6`。
- `crewForTrust(trust)`：clamp 0–6 后取 `crewByTrust`。
- `boatsForCrew(crew) = min(6, floor(crew / 3))`。
- `outboundSeconds(crew, fatigue) = max(9, 12 − floor(crew / 12)) + (fatigue >= 80 ? 4 : 0)`。
- `abandonEnemy(heavyCarried) = 45 − 8 × heavyCarried`（不低于 0）。
- `climbUnlit = 22 − reached − lost`；`firePenalty = 5 × min(lost, 3)`。

## 6. 试玩目标

- 第一次玩 5 秒内看懂操作；首通率 60–80%；失败代价在后续 1–2 场对话内可见。
- 每关只玩一次；没有“重试”按钮；失败继续剧情；调试单关除外。
- 老师验收不追求平衡；先保证 20 分钟能走完，再调难度。
- 调参只改 RULES；每次只调一个变量，记录在 `docs/test-record.md`（步骤七）。
- 改完必须跑 `check-build`（C22 数值一致）与 `smoke`（S27–S33）；docs 与 RULES 不一致不得提交。
