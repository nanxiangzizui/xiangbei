# 步骤十四：成就系统（v1.5.1-dev）

> 状态：✅ 完成实现与主流程（2026-11-08）；已提交（tag `step-14-done`）；未打包/未部署，线上仍 v1.1.1。
> 需求来源：用户 m00001（成就系统四项）与 m00188 拍板（锁定卡不写选项/原因；金沙江记名也做成就）。

## 1. 目标与范围

- 标题菜单以「解锁成就」窗口显示；游玩中暂停菜单也显示入口。
- 每个选择的每个选项对应一条成就；词条 ≤8 字；未解锁灰框。
- 成就可点开看描述：在哪个选择、选了什么、因此解锁了什么；锁定态不泄露选项与原因。
- 结局结算在五张精神卡上方加「此周目解锁的成就有：」，chips 可点开同一详情。
- 不做：成就奖励、百分比、全收集提示、排行、分支存档树；成就不是分数。

## 2. 数据与口径

- 48 条 = 17 个决策组的 46 个 choice 选项 + 金沙江记名（j018）的 `done`/`skip` 2 条。
- 章分布：序章 9、湘江 9、遵义 8、金沙江 5、泸定 5、草地 10、吴起 2。
- `project/story.js` 的 `XB.story.achievements` 是唯一数据源；choice 条目含 `id/chapter/decision/key/title`，j018 条目含 `kind:"interact"/outcome`。
- 描述复用 `XB.story.branchMap.decisions` 的现有后果文案，不另写一套剧情解释；多选按选中项逐条记录。
- 超时由 `choice.timedOut` 写入描述首句「时间到了，默认项……替你做了决定。」

## 3. 存档与结局

- 独立键 `xiangbei.achievements.v1`：`{version:1,updatedAt,unlocked:{id:{at,timedOut}}}`；坏 JSON 备份 `.bad`，写失败 toast + 内存态，不白屏。
- 主档仍 `xiangbei.save.v2` / 11 顶层键；`ending` 快照增加 `achievements`（≤48、已知 id、去重），共 17 键，仍 <4096B。
- `finishChapter` 在清空 `choices` 前收集本局成就并逐条落档；结局只显示本局快照，标题/暂停显示累计。
- 重进已结算结局时，`choices` 已空但 `memory.zhang` 仍会产出 `j018-done`；`buildEnding` 必须合并 `previous.achievements`，否则本局 22 条会掉成 1 条。

## 4. 界面

- 标题菜单第 6 项「解锁成就」；后四个入口 2×2，保持四行。
- 暂停菜单共 8 项，「解锁成就」第 5 项（剧情分支之后）。
- 共用 `#achievement-panel`：1040×620 纸纹面板，7 章 tab，3 列灰/亮卡；`#achievement-detail` 640×≤520 第二层。
- 结局 `#ending-achievements` 在 `#ending-cards` 前；标题精确为「此周目解锁的成就有：」；五卡加 `flex-shrink:0`，避免被成就区压成 0 高。
- 844×390：面板 1240×688 舞台 px，卡/关闭/暂停入口 ≥44 CSS px；暂停面板 520 宽、max-height 688 内滚。
- 键盘：Tab 循环、Enter/空格开详情、Esc 先关详情再关面板；打开有 codex cue 与 duck。

## 5. 改动文件

- `project/story.js`：`XB.story.achievements` 48 条。
- `project/engine.js`：49 旗标（`memory.namepick_done`）、成就核心/存储/渲染/三入口、`buildEnding` 与 `normalizeEnding`、j018 记录、移动暂停样式触发。
- `project/index.html`：标题/暂停入口、结局成就区、成就面板与详情。
- `project/style.css`：成就面板/卡片/详情/chips、标题 2×2、移动适配。
- `project/tools/check-build.js`：C42。
- `project/tools/_pw-step14.js`：55 项浏览器断言。
- 文档：`docs/achievements.md`、`docs/state-schema.md`、`docs/ui-layout.md`、`docs/test-cases.md`、本卡。

## 6. 验证

| 项 | 结果 |
|---|---|
| check-build | 41/41（含 C42 48 条/17 组/章分布） |
| smoke | 47/47（49 旗标） |
| check-script | 9 个剧本文件 OK |
| 语法 | engine/story/_pw-step14 OK |
| http 全量 | 55/55（coverage/title/choice/multi/namepick/ending/mobile） |
| file:// 全量 | 55/55 |
| 844×390 移动专项 | 11/11 |
| 错误 | 0 console error / 0 pageerror / 0 failed request |

证据：`docs/evidence/step-14/`、`docs/evidence/step-14-file/`（含 `ending-achievements-section.png`、`ending-achievement-detail.png`、`mobile-locked-detail.png`、`title-accumulated.png`）。

## 7. 已知口径与未覆盖

- 锁定卡只显示词条和「未解锁」，不显示决策组、原选项、后果。
- 成就计数「已解锁 N / 48」不是百分比，也不触发奖励。
- 未单独跑浏览器断言（P1）：坏成就档 `.bad` 备份/配额写失败 toast、旧结局无 `achievements` 的兼容显示、减少动效下打开面板；代码按名册/分支同模式实现。
- 已提交并打 tag `step-14-done`；未打包、未部署；`dist/` 与线上保持原样。
