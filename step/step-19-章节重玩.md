# 步骤十九：章节重玩（v1.8.0-dev 增量）

> 2026-11-09 · 分支 v1.4-dev · 已实现、已通过浏览器验证 · 未打包、未部署 · 证据 docs/evidence/step-19-*
> 需求来源：用户 m00001；技术约束：无额外约束。

## 1. 目标与范围

一周目完整结算后，允许从剧情分支的章节详情「从此开始」，选择目标档与来源档，把来源档该章之前的剧情线拷入目标档，再从该章继续。四段需求：

1. 完成一周目后，分支图的章节可被选择重玩。
2. 第一屏只列未完结档，或开启新档；标题逐字“请选择一个存档开始”。
3. 第二屏只列已完结档；标题逐字“对于你选择的章节前的剧情走向，你希望走哪条路线？”；选定后拷贝章前剧情线。
4. 从该章开始后，结局、存档、成就、剧情分支仍按正常路径结算。

不改历史终点、11 条人物结局、行囊/状态规则、主存档 11 键与已有存档列表结构。序章没有“前情”，不出入口。

## 2. 为什么用章前底片，而不是重放 choices

- 现有 `choices` 只记录单选/多选/记名，**物资面板的 `usePackItems`**（药、鞋、锅、雨布、青稞）不写 choices；金沙江 j018 的记名也只写 `memory` 与回顾，不写 `choices`。仅靠选择日志重放，无法还原因物资消耗造成的状态/行囊差异。
- 已完结档在结算时清空 `state.choices`，更无法反推前情。
- 因此每章开头保存一份 11 键快照，存在独立键 `xiangbei.chapters.v1`；不塞进单档记录，是因为 `saveNow` 每章多次落盘，而存档总量上限 512KB，单档上限 4096B。
- 旧版本产生的已完结档没有底片，无法精确回溯；界面明确置灰说明“再走一次完整周目后可用”，不做近似。

## 3. 底片存储

- 键：`xiangbei.chapters.v1`；上限 2MB；形状：
  ```
  { version: 1, updatedAt, slots: {
      slotId: { updatedAt, chapters: {
        chapterId: { at, state: 11 键存档 }
      } }
  } }
  ```
- 快照状态固定 `scene=vn`、`chapterId=目标章`、`nodeId=本章首节点`、`ending=null`；读取时走 `normalize`，不合法就丢弃。
- 采集点：
  - `startNewGame`：创建新档后采集序章；
  - `finishChapter` 进入下一章：`startChapter` 与 `saveChapterProgress` 之后采集下一章；
  - `applyChapterStart`：重玩落档后采集目标章。
- 清理：删除存档时同步删除该槽底片；初始化/ `?reset=1` 清空；启动时 `chapterPrune` 清掉已不存在的槽。写失败只 toast 一次，不阻断游戏。

## 4. 两步存档面板

复用 `#saves-panel`，在 `savePanelState.mode` 增加 `chapter-target` / `chapter-source`：

- **第一步**（目标）：标题“请选择一个存档开始”；只列未完结档；已完结档不出现；“开启新档”保留。没有未完结档时可直接开新档，但**先不创建空档**，等第二步选定来源后再创建，避免中途退出留下孤儿档。
- **第二步**（来源）：标题“对于你选择的章节前的剧情走向，你希望走哪条路线？”；只列已完结且拥有该章底片的存档；“开启新档/上次玩到/删除”隐藏，显示「返回」。
- 回退：Esc 或「返回」从第二步回第一步并聚焦目标行/「开启新档」；再 Esc 关面板回章节详情，焦点回「从此开始」。不写档。
- 入口：`renderBranchChapterStart(chapterId)` 在章节详情底部动态加「从此开始」。序章置灰；没有完成档写“完成一周目后”；没有该章底片写“已完结存档里还没有这一章的前情记录”；无未完结档且 20 档满写“存档已满”。
- 章节详情的决定行仍只读；入口不改分支图的 7 章 / 17 决策组结构。

## 5. 拷贝语义

`applyChapterStart(sourceSlot, chapterId)`：

1. 取来源档该章底片，`normalize`；不合法或版本不匹配则 toast 中止。
2. `startChapter(copied, chapterId)` 定位本章首个可见节点；`ending=null`，保留当前设置。
3. 目标档存在则覆盖 `state` 与 `updatedAt`；不存在则新建槽并置为 active。满 20 档中止。
4. 清掉旧暂停/结局回顾，关闭存档面板与分支图，再换 `state`，避免 `closePause` 作用于新档。
5. `historyCopyPrefix` 仅复制来源档目标章之前的回顾条目，checkpoint 截到该处；`chapterCopyPrefix` 清空目标槽底片，复制来源档目标章及之前的快照，目标章以后作废。
6. 写存档列表、应用设置、进 VN、渲染；采集目标章底片后 `saveNow`，最后 toast 说明“已开新档/已覆盖这一档的后续进度”。

## 6. 结局、成就与分支

从重玩章节走到结局仍走原 `finishChapter`：`buildEnding` → `recordRunAchievements` → `recordBranchRun` → 清 `choices` → 结局场景 → `saveNow`。因为章前 `choices` 已随快照拷入，结局快照、成就与分支 run 包含该章之前的真实选择；目标档 `ending` 正常写入，之后仍可在存档面板作为已完结档回看。

## 7. 改动文件

- `project/engine.js`：`CHAPTERS_KEY` / 2MB 上限；底片 normalize/capture/copy/prune；`savePanelState` 两模式；`chapterReplayAvailability` / `openChapterTarget` / `chapterSaveBack`；`applyChapterStart`；分支详情「从此开始」；初始化、`?reset=1`、删档清理。
- `project/index.html`：`#saves-kicker`、`#saves-back`、`#branch-detail-actions`；复用现有存档/分支弹窗。
- `project/style.css`：章节重玩面板宽度/两列动作/置灰行、`.xb-branch-start`；移动 82 逻辑高与 34px 标题。
- `project/tools/check-build.js`：C52（新键/2MB/两模式/文案/拷贝/清理/入口）与 REQUIRED_IDS。
- `project/tools/_pw-step19.js`：basic/new/back/mobile/ending/full 六组用例，http/file 双协议。
- 文档：`docs/state-schema.md` §12、`docs/branch-map.md` §8、`docs/test-cases.md` T19、`.claude/CLAUDE.md` 步骤表与进度。

## 8. 验证

| 项 | 结果 |
|---|---|
| `node --check project/engine.js` / `story.js` / `art.js` | 通过 |
| `node project/tools/check-build.js` | 51/51（新增 C52） |
| `node project/tools/smoke.js` | 47/47 |
| `node project/tools/check-script.js docs/script` | 9 文件 OK |
| `_pw-step19.js --url=http --case=all` | 56/56，0 console error / 0 失败请求 |
| `_pw-step19.js --url=file --case=all` | 56/56，0 console error / 0 失败请求 |
| 结局专项 | 12/12：目标档 ending、分支 run（含章前 p021）、成就档与结局快照 |
| 真实一周目 | 14/14，217s：新档走完七章 → 泸定「从此开始」→ 开新档 → 章前旗标/底片拷贝，`ending=null` |
| 移动 844×390 | 5/5：入口与两步行热区≥44 CSS px |
| 步骤十八回归 | 34/34 |

证据：`docs/evidence/step-19-basic`、`step-19-new`、`step-19-back`、`step-19-mobile`、`step-19-ending`、`step-19-all-http`、`step-19-all-file`、`step-19-full`、`step-18-regression`。

## 9. 已知口径与未覆盖

- 旧版本已完结档没有章前底片，按钮置灰，不提供近似回溯；用户需再完整走一次新周目。
- 暂停菜单发起章节重玩的路径没有专项浏览器用例；代码复用同一 `openChapterTarget`，但未单独计时/截图（P1）。
- 移动端只验证两步行与入口热区，没有在 844×390 跑完整结局（P1）。
- Chrome/Safari/真机、20 分钟全程、11 条结局各一次仍沿用既有 P1/P0 例外。
- 本轮未打包、未部署；线上仍为 v1.7.2-dev。
