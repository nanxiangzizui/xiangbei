# 步骤十七：行囊未满确认（v1.7.0-dev 增量）

> 2026-11-09 · 分支 v1.4-dev · 未打包/未部署 · 证据 docs/evidence/step-17/
> 需求来源：用户 m00001。

## 1. 目标与范围

- 序章 p024 行囊四格：玩家点“系好行囊”时，如果“行囊 + 本次已选”没装满 8 个半格（4 格），先弹二次确认。
- 文案逐字：“行囊尚未装满，长征路途艰险，确定要继续吗？”；两个键“是”“否”。
- “是”→ 关窗，按原流程结算并继续（出发前物资页 → p025 结算页 → p026）。
- “否”→ 关窗，回到选物资界面，已选物资与状态行原样保留，可继续补选或再次确认。
- 装满 4/4 格不弹；空行囊也弹（0/4 格同样是“未装满”）。
- 不改选择结果、不新增分支、不写新存档键、不进入 20 分钟主线预算；只多一次确认。

## 2. 数据与设计口径

- `story.js` 的 p024 增加 `confirmWhenNotFull: true`（全项目仅此一处）。这是关卡级开关，不写进存档。
- 触发判断：`bagUnits(node) >= XB.core.packCapacity(state)` 才算满；`bagUnits` = `XB.core.packUsage(state)`（含门板 4 半格）+ `multiRun.selected` 的 `optionUnits`（药/青稞 1、鞋 2、锅/雨布 4）。
- 未确认前不落 `choices`、不记成就、不锁多选；`commitMultiChoice(node)` 是唯一结算出口，确认与否走同一条路。
- 已选物资在“否”后保留；点遮罩不关闭；Esc 等同“否”；Enter 触发当前焦点键；“是”是默认焦点。
- 不用原生 `confirm()`：与纸墨弹窗一致、可控焦点、可被浏览器证据脚本断言。

## 3. 界面与交互

- 复用 `.xb-door-modal` 纸底弹窗：标题“行囊”44px、正文 26px/1.8、两个 160×56 按钮；“是”primary。
- 打开：显示遮罩、焦点到“是”、duck 0.45；关闭：隐藏遮罩、duck 恢复、焦点回 `#vn-multi-confirm`。
- Tab / Shift+Tab 只在“是/否”两键间；点遮罩或窗身空白处不移动焦点（mousedown 拦默认行为）；焦点若已在窗外，Tab 兜底收回。
- 与多选/暂停/回顾/门板/危险弹窗互斥：弹窗期间点击与快捷键不穿透；离开 VN 场景自动复位。
- 移动端复用 844×390 媒体查询：按钮 82 逻辑高（≈44.4 CSS px），正文 26px 逻辑，不横向溢出。

## 4. 改动文件

- `project/index.html`：`#bag-confirm-modal`（标题/正文/“是”/“否”），放在 danger-modal 后。
- `project/story.js`：p024 加 `confirmWhenNotFull: true`。
- `project/engine.js`：REQUIRED_IDS 五个 id；`bagConfirmState`；`bagUnits`/`bagIsFull`；`resolveMultiChoice` 门控并拆出 `commitMultiChoice`；`openBagConfirm`/`closeBagConfirm`/`cancelBagConfirm`/`acceptBagConfirm`；状态行改用 `bagUnits`；键盘/点击/duck/场景复位/各输入守卫；遮罩 mousedown 保焦点。
- `project/style.css`：844×390 下 `#bag-confirm-modal` 按钮 82 逻辑高、22px。
- `project/tools/check-build.js`：REQUIRED_IDS 同步；C50（字段唯一、门控、拆分、四个函数、HTML 文案、移动热区）。
- `project/tools/_pw-step17.js`：http/file all、mobile 端到端。
- `docs/test-cases.md` T17-01…08、`docs/ui-layout.md` §15、`.claude/CLAUDE.md` 步骤十七。

## 5. 验证

| 项 | 结果 |
|---|---|
| `node --check project/engine.js` | 通过 |
| `node project/tools/check-build.js` | 49/49（C50） |
| `node project/tools/smoke.js` | 47/47 |
| `node project/tools/check-script.js docs/script` | 9 文件 OK |
| `_pw-step17.js --url=http --case=all` | 58/58，0 console error / 0 失败请求 |
| `_pw-step17.js --url=file --case=all` | 58/58 |
| `_pw-step17.js --case=mobile` | 15/15（844×390，热区 44.4 CSS） |

证据：`docs/evidence/step-17/http/`、`mobile/`、`file/`（result.json、run.log、10+3 张截图）。

首轮桌面 51/57：1 个真 bug（点遮罩后焦点落到 body，Tab 回不到按钮；mousedown 拦默认焦点移动 + Tab 兜底修复），5 个脚本期望错误（`行囊 1 格 / 4 格` 自带“格”、结算页需点 `vn-result__more`、空行囊结算不写“空”字）。

## 6. 已知口径与未覆盖

- 只对 p024 生效；其他多选（湘江弃物）不弹，避免“弃物越少越对”的暗示与额外打断。
- 未重跑 20 分钟全程、11 条结局、真人计时与真机触摸（P1）；本段只改变确认时机，不改变结算值与后续分支。
- 未打包 dist/、未部署；线上仍为此前部署版本。
