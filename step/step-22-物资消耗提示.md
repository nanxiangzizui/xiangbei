# 步骤二十二 物资消耗提示

## 1. 目标与反馈

用户原话（m00001）：

> 当行囊中的物资被使用或者是剧情中不得不消耗物资（比如回头接应老周后损失了青稞），都在对话框的上方弹出一个窗口，内容为“由于......，xxx已被消耗”。

第二轮反馈（m00286 起）：

1. 物资不足时也要说明因果后果，不能只写“没有/不足”。
2. 消耗弹窗再往下一点，但不盖角色名和对话框。
3. 左侧“物资消耗”这个泛化标题去掉，改成具体物品名（如“青稞”）。
4. 对话框右侧加物品消耗/获得标识，悬浮或点击看这件东西本来能做什么。
5. 使用/捡到物资时，行囊面板对应格有动画或高亮；面板关闭后，对话框提示“已消耗：xx”或“获得：xx”。

## 2. 设计

### 2.1 事件来源

- **剧情消耗**：`setFlag` 写 5 个 `item.*` 旗标或 `inventory.giftBarley` 时，若当前为 `true`、下一值为 `false` 且传入 reason，则记一条 `used` 事件。reason 来自 `option.statusReason || option.text`，例如湘江“回头接应老周”。
- **主动使用**：`usePackItems` 找到配方并成功消耗后，记一条事件，reason 为“你拿它补充体力”/“你拿它们补充体力”。
- **获得**：同一 `setFlag` 路径从非 true 变为 true 时记 `gained`；`inventory.giftBarley` 也算。p024 多选重装只记获得，不误报消耗。
- **缺件**：选项 `requires` 不满足时，选项本身显示 `lackText`；该节点首次展示时把 `kind:"lack"` 事件放入队列，选项收起后弹出“由于没有药，飞毛腿背上的血止不住。”这类因果句。
- **门板**：仍只走 `doorOutcome`，不进入物资消耗提示。

### 2.2 内存态

- `packEvents` / `packFlash` / `packBadge` 都只活在本次会话，不写存档；`xiangbei.save.v2` 的 11 键结构不变。
- `packEvents` 最多 32 条；UI 队列最多 12 条，一屏最多 3 条。
- `packFlash` 按物品记录 `used`/`gained` 和原因，供行囊面板高亮；面板关闭时清 `packFlash`，保留 `packBadge`。
- `packBadge` 记录最近一次变化，支持 500ms 内合并（p024 一次选“药 + 青稞”显示“获得：药、青稞”）。

### 2.3 弹窗与标识

- `#pack-notice` 位于对话框上方，`bottom: 188px`（设计底边 y=532；人名顶 y=540，对话框顶 y=560），不压人名与正文。
- kicker 改为本批物品名，单件“青稞”，多件“青稞、药”；不再固定“物资消耗”。
- 正文：“由于{原因}，{物品}已被消耗。”；缺件为“由于{lackText}。”；获得走右侧标识与详情，不占弹窗。
- 对话框右上 `#vn-pack-used`：显示“已消耗：青稞”或“获得：药、青稞”。鼠标悬浮/键盘聚焦打开详情，点击固定；Esc、再次点击、失焦、8 秒后收起；打开时暂收 `#pack-notice`。
- 详情 `#pack-used-detail`：摘要 + 每件物品的后果说明（如“布鞋能在草地那几天垫住脚，保住一点暖气。”）。只读、不挡正文点击。
- 行囊面板：已消耗但已不在行囊的物品显示幽灵行（左橙条、“已消耗”、原因），获得物品行加朱砂色左条与 900ms 背景闪；`prefers-reduced-motion` 下关闭动画。
- 面板打开时隐藏右侧标识，避免从面板右边探出；关闭后恢复。

### 2.4 物资不足的因果文案

- 未知组合：“由于这组物资凑不成一份补给，什么也没用上。”
- 雨布非草地：“雨布只能在草地用，这一份补给暂时用不上。”
- 状态已满：“你的状态已经优秀，再用物资也补不上去。”
- 缺件：“由于行囊里没有{物品}，{配方}这份补给用不了。”
- 面板空态：门板“由于没有能用的物资了，门板背不到吴起。”；草地警告“由于没有能用的物资了，你撑不过这片草地。”；普通“由于行囊里没有能补体力的物资，你的状态只能硬撑。”
- 五个 `requires` 选项的 `lackText`：
  - 泸定 l019 B / l019x A：没有药，飞毛腿背上的血止不住。
  - 草地 g018x A：没有青稞，锅里还是空的。
  - 草地 g018x B：没有铁锅，雪水只能凉着喝。
  - 草地 g026x A：没有布鞋，冬生只能赤脚踩在泥里。
  - 草地 g026x B：没有雨布，雨只能落在冬生身上。

## 3. 代码改动

- `project/engine.js`
  - `PACK_EVENT_LIMIT`、`PACK_EVENT_NAMES`、`packEvents`、`packFlash`、`packBadge`。
  - `packItemName`、`recordPackEvent`、`takePackEvents`、`notePackGain`、`packBadgeInfo`、`clearPackFlash`、`resetPackFeedback`。
  - `setFlag` 检测 item 旗标 true→false / false→true；`usePackItems` 成功记录主动使用，失败返回 `missing` 与因果 reason。
  - `packItemRows` 生成幽灵行与获得行；`renderPack` 加 `is-pack-used`/`is-pack-gained`。
  - 弹窗队列、kicker 动态物品名、右侧标识、详情、缺件事件、暂停/推进/Esc 收起详情、`startNewGame` 清理。
- `project/index.html`：`#pack-notice` + `#pack-notice-kicker` + `#pack-notice-list`；`#vn-pack-used` + label；`#pack-used-detail`。
- `project/style.css`：`.xb-pack-notice`（bottom 188、ember 左边）、`.vn-pack-used`、`.xb-pack-detail`、面板行高亮、缺件代价色、移动端尺寸；`--ember-a16` 令牌避免组件写色值。
- `project/story.js`：6 处 `lackText`（l019 B、l019x A、g018x A/B、g026x A/B）。
- `docs/script/04-luding.md`、`docs/script/05-grass.md`：同步 `lack` 字段。
- `project/tools/check-build.js`：新增 C53，检查 DOM/CSS/核心函数/事件单元。
- `project/tools/_pw-step22.js`：浏览器专项，覆盖剧情扣粮、主动使用、多件、缺件、获得、右侧标识/详情、面板高亮与几何。

## 4. 验收

| 项 | 结果 |
|---|---|
| 剧情消耗（湘江青稞） | kicker “青稞”，正文“由于回头接应老周，青稞已被消耗。”，右侧“已消耗：青稞” |
| 主动使用（草地布鞋） | 面板布鞋行“已消耗”，关闭后同文案与标识，详情含“布鞋能在草地那几天垫住脚” |
| 多件使用（青稞 + 药） | kicker “青稞、药”，正文“由于你拿它们补充体力，青稞、药已被消耗。”，详情两件效果 |
| 缺件（泸定无药） | 选项 B 置灰并显示“没有药，飞毛腿背上的血止不住。”；选 C 后弹“由于没有药，飞毛腿背上的血止不住。”，右侧不显示消耗标识 |
| 获得（p024 药 + 青稞） | 面板两行获得高亮；关闭后“获得：药、青稞”，详情含两件效果 |
| 位置 | 桌面 1366×768：notice 底边 567.47 / 人名顶 580.27 / 对话框顶 597.33；844×390：288.17 / 303.33；不压人名与正文 |
| 三端 | `_pw-step22` http 78/78、file:// 78/78、844×390 78/78；0 console error / pageerror / 失败请求 / 外部请求 |
| 构建 | check-build 52/52（C53 通过；C05 最终 206KB / 220KB 预算内）；smoke 47/47；check-script 9 文件 OK；`node --check` 三 JS 通过 |
| 门板回归 | `_pw-step11 --case=doorsupply` 63/63；新因果文案未破坏门板累计补给负例 |

> C05 说明：中途曾因并发 `project/art.js` 加入内联 LQIP（56 KB → 151 KB）报红；随后并发侧把体积预算更新为 220KB（注释标 v1.9.2），最终复跑 C05 通过。未回退该并发改动。

## 5. 证据

- `docs/evidence/step-22/http3/`：桌面 http 三组流程与截图。
- `docs/evidence/step-22/file3/`：file:// 同用例。
- `docs/evidence/step-22/mobile3/`：844×390 / DPR2 / touch。
- 关键截图：`story-xiangjiang-pack-notice.png`、`story-pack-detail.png`、`panel-shoes-used-row.png`、`panel-shoes-pack-notice.png`、`lack-medicine-notice.png`、`gain-panel-highlight.png`、`gain-pack-notice.png`。

## 6. 未做

- 已提交 `49edea8`、打包 v1.9.2-dev；GitHub Pages（`6324e5a`）、Netlify（`6afa93e2`）与 Cloudflare Pages（`e6797715`）已部署 v1.9.2-dev。
- 未重跑 20 分钟真人计时、11 路线全量、隐私模式、Chrome/Safari/真机。
- 移动端右侧标识视觉高度 64 设计 px ≈34.7 CSS，低于 44 CSS 热区；本轮记录为 P1，不阻塞本功能。
