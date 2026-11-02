# 《向北》小游戏系统（步骤四定稿）

> 状态：T4.0 定稿（2026-11-02）。本文件是四关的**系统契约**；数值表在 `docs/minigame-tuning.md`，旗标在 `docs/state-schema.md`，坐标在 `docs/ui-layout.md`。
> 权威顺序：用户指令 > `向北-项目计划书.md` > `.claude/CLAUDE.md` > 本文件 > 其余 docs。冲突时先改本文件，再同步代码与检查脚本。
> 本步只做核心 4 关；第 5 关探路/分粮不做；音频、章节接入、结局不在本步。

## 1. 范围与不做

**做**：门板（door）、弃物（abandon）、渡船（boat）、攀索（climb）四关；一套共享限时分配引擎；一个全屏游戏覆盖层；一张游戏画布；单关调试入口；p024→门板关→p025 的序章接入。

**不做**：

- 不做第 5 关探路/分粮；草地只做对话与资源选择（步骤五）。
- 不做战斗、血量、敌人脸、Game Over、重试、评分、成功率、排行榜。
- 不做多结局；四关失败只写代价旗标，剧情继续。
- 不做每关一张 canvas、每关一个 rAF、每关一套输入/暂停/结果代码。
- 不做音频与心跳/鸡鸣（步骤六；本步只做视觉提示）。
- 不写 22 位勇士的姓名、不写“牺牲人数”、不把光点画成脸。
- UI 不写“X 光机”，只写“三百斤的箱子”；史料争议只在图鉴/出处表说明。
- 不新增存档键；不保存小游戏中间态。
- 不在运行期用 `config` 覆盖 `RULES`；剧情里的 `config` 是契约元数据，生效值只来自 `RULES`。

## 2. 共享架构

| 文件 | 职责 |
|---|---|
| `project/minigames.js` | `window.XB.minigames`：SCENES / RULES / ITEMS / API / 四个 game 对象 / 共享循环与绘制 helper |
| `project/engine.js` | 场景状态机、VN 推进、暂停、存档、把结果写回旗标、p025 结果页 |
| `project/index.html` | `#vn-minigame` 覆盖层、`#minigame-canvas`、HUD、help、live、pause、fallback |
| `project/style.css` | 覆盖层坐标/层级、画布尺寸、HUD/help/pause/结果页样式 |
| `project/art.js` | 不接小游戏；`#stage-art` 始终在 z0，游戏层 z40 盖住它 |

- `minigames.js` 用 IIFE + `window.XB`；加载时**不访问 DOM**、不读 `getComputedStyle`，保证 Node 里可加载做契约测试。
- 四个游戏是普通对象，各自实现 `init / update / draw / onPointer / onKey / end`；不写 class 继承、Factory、Strategy、事件总线。
- 共享层只做四关真正重复的事：计时、rAF、dt 夹取、坐标换算、pointer capture、8px 点击/拖拽阈值、键盘分派、live 节流、结果对象、绘制小 helper（roundRect/text/card/timerBar/pips/chain）。
- 一个全屏覆盖层、一张画布：`#vn-minigame` 用 `position:absolute; inset:0`，内部 `#minigame-canvas` 设计坐标 1280×720，CSS 100%，backing store 按 `min(2, devicePixelRatio)` 放大。
- 游戏层与选项层同层（`--z-choice` 40），两者互斥：游戏显示时不显示选项；暂停 80；toast 90；游戏内暂停按钮 41。
- 引擎负责“什么时候开始/结束/写旗标”；minigames 只负责“这一局怎么玩、结果是什么”。minigames **不写存档、不写旗标、不推进剧情**。

## 3. 状态机

     idle ──start()──▶ running ──end(reason)──▶ ending ──onEnd 返回──▶ ended
                          │  ▲
                  暂停布尔 │  │ 恢复（lastTs=now）
                          ▼  │
                       running(paused=true)

| 状态 | 含义 | 循环/输入 | 允许的转移 |
|---|---|---|---|
| idle | 未启动或已清理 | 无 rAF、无监听 | start → running；stop 保持 idle |
| running | 计时与输入 | rAF + pointer/key | end → ending；stop → idle；paused 只冻结 update/timer |
| ending | 已产生结果，等待回调返回 | 不再 update；可画最后一帧 | onEnd 返回 → ended |
| ended | 结果已交付 | 无 rAF、无输入 | 引擎隐藏覆盖层；下次 start 重新 init |

- `paused` 是 running 上的布尔，不是第五个状态；暂停时 `lastTs=now`，不累计 dt。
- `dt = min(50, now − lastTs)`；切标签/断点后不会一次跳很多秒。
- 结束只发生一次：`finish()` 先判 `ending/ended` 早退；`stop()` 不触发 `onEnd`。
- 结束后取消 rAF、移除 pointer/key 监听、清 live 定时器；画布保留最后一帧直到引擎隐藏覆盖层。
- `start()` 在已 active 时返回 false，不静默重开；引擎必须先 `stop('navigate')`。

## 4. start / stop 契约

```js
XB.minigames.start({
  gameId: 'door',            // 必须是 SCENES 之一
  config: node.config,       // authored 元数据；生效值仍取 RULES
  canvas: el,                // HTMLCanvasElement
  hud: el, help: el, live: el,
  callbacks: {
    onEnd: function (result) {},
    isPaused: function () { return false; },
    isReducedMotion: function () { return false; },
    toast: function (msg) {},
    onEvent: function (name, payload) {}
  }
});
```

| 返回值/行为 | 契约 |
|---|---|
| 返回 true | 已进入 running；canvas 已 focus；首帧已排入 rAF |
| 返回 false | gameId 非法、canvas 缺失、callbacks.onEnd 不是函数、已 active；console.error + 可见 toast；不抛异常 |
| 校验失败 | 不启动、不写任何状态；引擎显示 fallback 面板“小游戏加载失败 / 继续剧情” |
| stop(reason) | 幂等；取消 rAF、解绑、清 live、置 idle；**不调用 onEnd** |
| onEnd(result) | 只调用一次；调用前已置 ending；引擎负责去重 |
| resize() | 重算 DPR/backing store；保留当前局面与计时；不重置 selected/trips/lights |
| 错误 | update/draw 抛错只捕获一次：console.error + toast + 以 reason='error' 结束；不白屏 |

- `config` 只做契约核对（p024：duration=75, capacity=6, doorCost=2, items=8）；不一致由 `check-build` C20 报红，运行期以 RULES 为准。
- `callbacks.isPaused()` 每帧读引擎的 `state.paused`；minigames 不自己监听暂停键。
- `callbacks.isReducedMotion()` 每帧读设置；关闭脉冲/抖动/闪白。
- `onEvent` 事件名见 §12.3；本步只用于测试与步骤六接音频，不改变结果。

## 5. 结果对象

```js
{
  gameId: 'door',
  reason: 'time',            // time | done | quit | error
  elapsed: 74.2,             // 秒；不超过 duration
  carried: [{ id: 'door', label: '门板' }],
  left: [{ id: 'pot', label: '铁锅' }],
  stats: { capacity: 6, used: 3, door: true }
}
```

| reason | 含义 | 出现场景 |
|---|---|---|
| time | 计时/追兵到 0 被迫结束 | 门板 75s；弃物 80s 或追兵 0；渡船 90s；攀索 75s |
| done | 关卡自然走完（不是“成功”） | 点“系好行囊”；两批发船完；18 趟；22 光点走完/全灭 |
| quit | 预留：玩家主动放弃 | 本步不出现；stop('navigate') 不产生结果 |
| error | 运行错误降级 | update/draw 抛错；结果仍交付，剧情继续 |

- **没有 success / score / gameOver / rank**；reason 只表示结束方式。
- `carried[] / left[]` 只给门板与弃物；渡船/攀索为空数组，信息放 stats。
- `stats` 必填键：
  - door：`capacity, used, door`
  - abandon：`batches, heavyCarried, enemyRemaining`
  - boat：`trips, plannedTrips, boatmen, boats`
  - climb：`reached, lost, unlit`
- 结果对象只在内存（`lastMinigameResult`）；**不写档**。写旗标由引擎 `applyMinigameResult` 做，且只做一次。

## 6. 输入与坐标

- 设计坐标 1280×720；指针换算：

      x = (clientX - rect.left) * 1280 / rect.width
      y = (clientY - rect.top) * 720 / rect.height

  不用 `offsetX/offsetY`；CSS transform 缩放下同样成立。
- `canvas` 设 `touch-action:none`；`pointerdown` 时 `setPointerCapture`；`pointerup/pointercancel` 释放。
- 点击 = `pointerup` 且总位移 <8px；拖动 = 位移 ≥8px（门板关用）；不依赖 `click`/hover。
- 键盘：
  - `1–5`：门板可选卡（门板/花名册/铅笔不占键）；`1–6`：弃物卡；`1–6`：渡船派船。
  - `Shift+1–6`：渡船“歇”。
  - `Enter/Space`：确认（系好行囊 / 发船 / 攀索点击）。
  - `Esc`：交给引擎暂停；canvas 不吞 Esc。
  - `Tab`：正常走焦点；不劫持。
- `canvas tabindex="0"`；start 后 focus；结束后焦点到结果页“继续”。
- 所有 canvas 内可点目标 ≥96×96 逻辑像素；844×390 下约 52×52 物理像素；暂停 96×96。
- `#minigame-live` 是屏外 `aria-live="polite"` 区：状态播报节流 500ms，只报“放不下/已渡 3 趟/暗了 2 个”这类事件，不逐帧读。
- 引擎守卫：`XB.minigames.isActive()` 为真时，`#scene-vn` 的 pointerdown 推进早退；`onKeyDown` 除 Esc 外早退；canvas 内事件 `stopPropagation`。
- 小游戏内暂停按钮单独处理：点击 → 引擎 `openPause()`；不触发游戏点击。

## 7. 暂停、可见性与刷新

- 暂停复用 `#pause`（z80）：引擎置 `state.paused=true`；游戏循环读 `isPaused()`，冻结 update 与计时，`lastTs=now`。
- 恢复：`state.paused=false` 后下一帧 `lastTs=now`，不补算暂停时长。
- 页面 `visibilitychange` 隐藏：引擎已有 `openPause()`；小游戏随之中止计时；恢复后不跳秒。
- 暂停期间游戏画面保留最后一帧；暂停遮罩盖在上面；不 stop、不 restart、不丢局面。
- 窗口 resize：`art.resize()` 之后调 `XB.minigames.resize()`；重算 DPR/尺寸，不重置局面。
- **不保存小游戏中间态**：p024 刷新回 p024 重开本关；p025 刷新按旗标重建结果（§9）。
- 离开 VN / 回标题 / 开新游戏：引擎先 `stop('navigate')`，清 `lastMinigameResult`，避免后台继续计时。

## 8. 四关规则

### 8.1 门板（door，序章 p024）

**目标**：75 秒内把要带的东西装进 6 格行囊；带门板就必须舍 2 格。没有“全带走”解。

| 项 | 值 |
|---|---|
| duration / target / settle | 75 / 45 / 20（含结算 65） |
| capacity | 6 格 |
| doorCost | 2 格；门板固定左上，不可丢 |
| items | 8 张卡：门板、花名册、铅笔、药、青稞、铁锅、雨布、布鞋 |
| 可选 | 药 1、青稞 1、铁锅 2、雨布 1、布鞋 1（共 6 格） |
| 随身 | 花名册、铅笔 0 格、不可操作 |
| warnAt | 最后 10 秒视觉脉冲（reduced-motion 关闭） |

- 布局：行囊 3×2（120,90,820×380），门板 2×1 固定左上，铁锅 1×2，其余 1×1；底部货架 5 张可选卡（80,500,880×140）；按钮“系好行囊”（1000,540,200×96）。
- 状态：`selected`、`usedSlots`、`hasDoor`、`timeLeft`、`phase`。
- 交互：拖到合法格；无合法位置红框 + live“放不下”；点选自动放第一个合法位；再点行囊内物品取出；键盘 1–5 切换；空格/Enter“系好行囊”。
- 公式：`usedSlots = (hasDoor ? 2 : 0) + Σ selected.slots`；`usedSlots > 6` 拒绝。
- 无门板：5 件总格正好 6，全装得下——这是“没门板反而装得下”的代价交换，不是奖励。
- 结束：时间到（reason=time）或点“系好行囊”（done）；按当前选择结算，不重开。
- 写回（引擎做）：
  - `inventory.items = ['roster','pencil', ...selected optional ids]`（不含 door）。
  - `item.pot = selected 含 pot`。
  - **不写 item.door**（p021 的选择不被本关推翻）。
- 结果：`carried = 门板（若有）+ selected`；`left = 未选可选`；花名册/铅笔只进 note，不进两栏。
- 失败路径：超时只带走当前已装；p025 如实显示，不写“失败/成功”。

### 8.2 弃物（abandon，湘江）

**目标**：两批、每批最多 3 件；带重物会提前追兵；决定什么留在江那边。

| 项 | 值 |
|---|---|
| duration / target / settle | 80 / 50 / 20（含结算 70） |
| batches / quota | 2 批 / 每批 3 件 |
| items | 6 件基础 + 门板（若 item.door） |
| enemy | 45 秒，从第一次发船开始 |
| heavyPenalty | 每带 1 件重物，追兵剩余 −8 秒 |
| 重物 | xray（三百斤的箱子）、press（印刷机）、files（文件箱） |
| 药箱 | 留下 fire−15；上船不扣 |

- 布局：卡区 80,180,1120×300（7 张 150×180，间隙 12）；船上槽 200,510,600×100（3 个 180×96）；“发船”900,540,200×96。
- 初始全部“留在岸上”；点卡切换“带上船”；每批最多 3；0 件不能发，1–3 可发。
- 第一批发船：启动追兵 `45 − 8 × 本批重物数`；本批 3 件移除，不可反悔；进入第二批。
- 第二批发船：`追兵 = max(0, 当前 − 8 × 本批重物数)`；本批发船有效；随后立即结算（剩余留下）。
- 追兵到 0：立即结束；本批已上船的有效；未上的全部留下；不重开、不 Game Over。
- 门板：item.door=true 才出现；不占重物惩罚；最终未上船 → `item.door=false`；上船则保持 true。
- 时间到（80s）未发完：已发批次有效，其余留下。
- 写回（引擎做）：`choice.xiangjiang.abandoned = 留下 id 数组`（固定顺序 xray,press,files,medkit,radio,silver,door；≤7）；门板留下则 `item.door=false`；药箱留下 `fire−15`。
- 结果：`carried/left` 两栏；stats 含 batches/heavyCarried/enemyRemaining；不写 kept、不评分。
- UI 只写“三百斤的箱子”，绝不写“X 光机”。

### 8.3 渡船（boat，金沙江）

**目标**：90 秒内把 18 个航次排完；船工数、单程时间、疲劳、休息串成一条调度链。

| 项 | 值 |
|---|---|
| duration / target / settle | 90 / 60 / 20（含结算 80） |
| boats / capacity | 6 条 / 每船 8 人 |
| crewPerBoat | 3 名船工 |
| plannedTrips | 18（6 船 ×3 趟） |
| crewByTrust | trust 0–6 → 12/18/24/30/37/37/37（trust>5 视为 5） |
| 可用船 | `min(6, floor(船工/3))`：trust 0 只有 4 条，trust≥1 有 6 条 |
| outbound / inbound | 出程 `max(9, 12 − floor(船工/12))`；返程 12 |
| fatigue | 每完成一程（出程或返程）+12；0–100；≥80 出程 +4s；=100 必须休息 |
| rest / restRecovery | 12s / −12 疲劳 |
| enemy | 120s，只作远景小字，不跳动、不驱动失败 |

- 布局：HUD 天亮/已渡/船工/追兵小字；船区 80,160,1120×380（2×3，每船 340×170）；每船 8 个乘客点、疲劳条、“歇”96×96。
- trust 0 的 4 船是真实代价：后两条船压暗，显示“船工不够”，不是 UI 骗人。
- 点船（docked）→ 装 8 人出程；到对岸 `trips+1`、疲劳 +12；返程 12s 不可再派；回岸疲劳 +12、恢复 docked。
- 疲劳 ≥100 不能派船，live“船工透支，先歇”；休息 12s，结束时疲劳 −12（不低于 0）；休息中不可派；可多船同时休息。
- 键盘 1–6 派船；Shift+1–6 休息。
- 结束：trips=18（done）或 90s（time）；中途出程未到对岸不计 trips。
- 写回（引擎做）：`choice.jinsha.trips = trips`（0–18）。
- 结果 stats：trips/plannedTrips/boatmen/boats；只写“已渡 X/18”，不列人名、不写死亡。
- HUD 的“追兵 120s”只显示静态远景，不倒数；时序上不允许 120s 先到。

### 8.4 攀索（climb，泸定）

**目标**：22 个光点，跟着节奏点；点空熄一个；不重开。

| 项 | 值 |
|---|---|
| duration / target / settle | 75 / 50 / 20（含结算 70） |
| spans / lights | 3 段 / 22 个光点 |
| stepMs / hitWindow | 1800ms / 350ms |
| fireAt / fireTaps / fireWindowMs | 第 6/12/18 步 / 连点 3 次 / 1500ms |

- 布局：全画布；13 根铁索、3 段路径、22 个光点；核心操作在下半屏；暂停 96×96。
- 节奏：每步 1.8s，命中窗 0.35s；窗内点中 → step+1、点亮一个；窗外点空 → lost+1、熄一个、不推进。
- 火墙：第 6/12/18 步触发 1.5s 连点 3 次；成功继续；失败 lost+1；不 Game Over、不重开。
- 结束：`reached + lost = 22`（done）、`lost = 22`（done，全灭）、75s（time）；三者先到先算。
- 结果 stats：`reached / lost / unlit = 22 − reached − lost`；文案“过去 X 个光点，暗了 Y 个”，不显示姓名、不写“牺牲人数”。
- 写回（引擎做）：`lights_lost = lost`（**绝对赋值，不 +=**）；`fire = clamp(fire − 5 × min(lost,3), 0, 100)`；不写 `memory.*`。
- 键鼠：空格/Enter/点击任意处；触摸点下半屏；单手可完成。
- 火墙是抽象橙环，不是燃烧的人；reduced-motion 下只留静态环 + 文字。

## 9. 结果重建

- 运行时：`lastMinigameResult` 只在内存；p025 的 `renderResult` 在 `node.source === 'minigame'` 时优先用它。
- 刷新后：没有运行时结果，按 `node.game` 从旗标/行囊重建；不白屏、不报错。
- 无数据回退：`node.lists` 静态两栏（步骤三旧行为）。

| game | 重建来源 | 重建内容 |
|---|---|---|
| door | `inventory.items` + `inventory.door` | selected = items − roster/pencil；carried = door?+selected；left = 全部可选 − selected；roster/pencil 进 note |
| abandon | `choice.xiangjiang.abandoned` + `item.door` | left = 数组；carried = 当前存在的物品 − left；门板按 item.door 判定 |
| boat | `choice.jinsha.trips` | 只显示“已渡 X/18”，不列人名 |
| climb | `lights_lost` | 只显示“暗了 Y 个，其余 22−Y 个还亮着”；**不猜 reached**（未持久化，超时局会虚报） |

- 应用结果（引擎 `applyMinigameResult`，只做一次）：
  - door：`inventory.items`、`item.pot`；不动 item.door。
  - abandon：`choice.xiangjiang.abandoned`；门板留下时 `item.door=false`；药箱留下 `fire−15`。
  - boat：`choice.jinsha.trips`。
  - climb：`lights_lost`、`fire` 惩罚。
- 应用函数返回 `{ok, issues}`；issue 只 toast/console，不中断剧情。
- 结果页不显示 success/score；标题取 node.title（p025=行囊），缺省按 game：行囊/弃物/渡口/铁索。
- 已知限制：攀索的 reached/unlit 不持久化，刷新后只能诚实显示 lost；这是“不新增持久键”的取舍，步骤五如需精确回看再讨论迁移。

## 10. 调试参数

| 参数 | 作用 | 边界 |
|---|---|---|
| `?minigame=door|abandon|boat|climb` | 直接进单关；不写档、不推进剧情 | 非法 id：toast + 回标题 |
| `?door=0|1` | door/abandon 的门板起点 | 缺省读存档/默认 |
| `?trust=0..6` | 渡船船工数 | 夹取 0–6；>5 按 5 |
| `?fire=0..100` | 攀索结算前火种 | 夹取 0–100 |
| `?lights=0..22` | 攀索初始已暗光点 | 夹取 0–22；用于结果重建测试 |
| `?reset=1` | 清调试起点/存档 | 只清调试，不影响正式档 |
| `?debug=1` | 显示 flags 摘要 | 正式版隐藏 |

- solo 结果页：标题“调试试玩”+“再玩一次 / 回标题”；**序章 p025 不出现“再玩一次”**。
- 不提供 `?duration=` 覆盖；时长测试用真实等待或 Playwright 时钟，防止测试专用参数漂移进正式逻辑。
- solo 不 load/save 剧情；回标题后正常读档。

## 11. 可访问性

- 热区：canvas 内所有可点目标 ≥96×96 逻辑；844×390（缩放 0.542）下 ≈52×52 物理 ≥44；暂停 96×96。
- 键盘：1–8、Shift+1–6、Enter/Space、Esc（交给引擎）、Tab；canvas 可聚焦；结束后焦点到“继续”。
- 读屏：`#minigame-live` polite、500ms 节流；canvas 有 `aria-label` 规则摘要；结果页是真实 DOM 文本，不把信息只画在 canvas。
- 文字：关键数字/操作 ≥26 逻辑（844 下 ≈14）；次要标签 ≥22；不用 14 以下。
- 对比：纸白/火橙在夜蓝上；朱砂只放纸色卡；不靠颜色单独表达状态（选中加描边/勾）。
- 动效：`prefers-reduced-motion` 或设置开启时，关闭脉冲、抖动、闪白；火墙只留静态环 + 文字。
- 无 hover：所有交互 pointerdown/up；悬停只做视觉增强，不承载功能。
- 单手：核心操作在下半屏；门板可点选不必拖；渡船点船即可；攀索点任意处。
- 降级：canvas 缺失/启动失败显示 fallback 面板“小游戏加载失败 / 继续剧情”，不白屏；剧情可继续。

## 12. 文档与数值台账

### 12.1 唯一数值源

- 代码：`XB.minigames.RULES`（冻结对象）；调参只改这里。
- 文档：`docs/minigame-tuning.md` §2/§3 与本文件 §8 同名同值；`check-build` C22 比对 duration/capacity/quota/boats/lights/hitWindow/fatigue/crew/planned 等关键值。
- 剧情配置行：`docs/script/00/01/03/04`；C20 校验 p024 config 仍为 75/6/2/8；配置行只描述，不覆盖 RULES。

| 关 | duration | target | settle | 含结算 | 关键值 |
|---|---:|---:|---:|---:|---|
| door | 75 | 45 | 20 | 65 | capacity 6; doorCost 2; items 8 |
| abandon | 80 | 50 | 20 | 70 | batches 2; quota 3; enemy 45; heavyPenalty 8 |
| boat | 90 | 60 | 20 | 80 | boats 6; capacity 8; crewPerBoat 3; plannedTrips 18; outbound 12; inbound 12; fatiguePerLeg 12; rest 12 |
| climb | 75 | 50 | 20 | 70 | spans 3; lights 22; stepMs 1800; hitWindow 0.35; fireAt 6/12/18; fireTaps 3; fireWindowMs 1500 |

- 时长口径：`target` 是可玩段目标，`duration` 是保险丝上限；`target + settle` 才是“每关 60–90 秒”的验收口径（65/70/80/70）。
- 改数值流程：先改本文件 §8 + tuning → 改 RULES → 跑 C22/smoke → 再改剧情配置行（若涉及）。

### 12.2 旗标写回（引擎）

| game | 写入 | 说明 |
|---|---|---|
| door | `inventory.items`、`item.pot` | 不含 door；不动 item.door |
| abandon | `choice.xiangjiang.abandoned`、`item.door`、`fire` | 门板留下才 false；药箱留下 −15 |
| boat | `choice.jinsha.trips` | 0–18 |
| climb | `lights_lost`、`fire` | 绝对赋值；−5×min(lost,3) |

- 只开 `choice.xiangjiang.abandoned` 一个 list flag；不做通用数组；≤7 个合法 id。
- 不新增持久键；`lastMinigameResult` 不写档。

### 12.3 事件名（步骤六音频接口）

| 事件 | payload | 时机 |
|---|---|---|
| `game:start` | `{gameId}` | start 成功 |
| `game:end` | `{gameId, reason}` | finish |
| `door:pack` / `door:unpack` | `{id}` | 装入/取出 |
| `abandon:dispatch` | `{batch, ids}` | 发船 |
| `boat:depart` / `boat:return` | `{boat}` | 出程/回岸 |
| `boat:rest` | `{boat}` | 开始休息 |
| `climb:hit` / `climb:miss` / `climb:fire` | `{step}` / `{}` / `{at}` | 命中/点空/火墙 |

- 本步只发事件，不做声音；步骤六再消费；事件名不改，避免音频层返工。

### 12.4 变更纪律

- 新增/改规则：先改本文件与 tuning，再改 RULES，最后改剧情/检查；不允许代码里出现第二套数值。
- 任何“成功/失败/评分/Game Over/牺牲人数/X 光机/22 人姓名”文案，C23 直接报红。
- 四关单关可试玩、p024 进出、p025 重建、失败不重开，是步骤四的硬出口；不把“写了”说成“能玩”。
