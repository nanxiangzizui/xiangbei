# 步骤十二：剧情分支与结局收纳

- 日期：2026-11-07 / 2026-11-08
- 分支：v1.4-dev（工作树含 step-11 未提交改动）
- 状态：✅ 本地完成；已提交（tag `step-14-done`）、未打包、未部署
- 用户需求：m00001（剧情分支窗口、11 结局灰锁、节点因果描述、参考图风格）；m00137（暂停菜单入口，可看当前局走到哪里）
- 设计文档：docs/branch-map.md
- 证据：docs/evidence/step-12/

## 1. 目标与非目标

### 1.1 目标

1. 标题菜单、结局页、暂停菜单三处都有「剧情分支」入口。
2. 全屏固定 1280×720「歧路图」：7 章缩略图 + 11 张结局卡；已抵达与未抵达一眼可分。
3. 结算后记录这一局的路线、章节、抉择、门板/救人/状态/点名；未触发结局与未来章节保持灰色。
4. 每个抉择节点可点开，逐条显示「在这个……选择中，你选择了……，因此……」；超时、条件未发生、多选分别有对应句式。
5. 暂停时能看当前局：当前章朱砂、走过章节纸白、未来章节灰；不写盘、不提前解锁结局。
6. 参考图只取「深墨蓝星尘 + 横向章节缩略卡 + 暗金/灰线 + 未解锁空印 + 朱砂当前」的气质，换成本作纸墨/版画色，不照搬图标、人物剪影或霓虹。

### 1.2 非目标（不做）

- 不改剧情、选项、旗标、11 条路线判定、历史终点、20 分钟流程。
- 不改主存档 11 键、ending 16 键、save v2；不重置存档格式。
- 不做结局百分比、评分、全收集奖励、真结局、全活、分支存档树、读档回溯。
- 不新增图片/字体/音频；只用现有 7 张图鉴缩略图。
- 不把未解锁结局的完整条件或选项文字提前泄露。
- 不做逐句旁白节点；节点粒度是 19 个决策组（22 个结构节点）。

## 2. 三入口

| 入口 | 行为 |
|---|---|
| 标题菜单第 5 项「剧情分支」 | 读 xiangbei.branches.v1 的历史并集；只显示已结算路线；未完成局不在此显示 |
| 结局页第 3 个按钮「查看剧情分支」 | 打开刚结算的路线；当前路线朱砂；其余仍按历史/未解锁显示 |
| 暂停菜单「剧情分支」 | 用当前 state 的 choices/unlockedChapters/chapterId 实时构建；不写盘；关闭回暂停 |

标题菜单由 4 项改为 2 列 4 行：开始（整行）、继续（整行）、史实图鉴｜名册（并排）、剧情分支（整行）。按钮 220×82 舞台 px；844×390 下入口 243.75×44.4 CSS px。

## 3. 视觉与交互

### 3.1 歧路图

- 1280×720；深墨蓝底 + CSS 星尘（radial-gradient，不新增图片）。
- 顶部：kicker「命路歧图 · 只看你走过的」、46px 标题「剧情分支」、38×38 朱砂印「歧」、右上「已抵达 N / 11 个结局」、52×52 关闭。
- 7 章卡片：96px 高、7 列、列距 12；缩略图用 assets/backgrounds/thumbs/codex_{yudu,xiangjiang,zunyi,jinsha,luding,grass,wuqi}.jpg；底部压深色条与章名。
- 结局区：左列「带板 1–5」5 列 +「空手 6–10」5 列；右列「坏结局 11」280px 跨两行。
- 状态：未走到 = 灰卡 + 虚线 +「未」印；已结算 = 纸白/暗纸底；本次 = 朱砂左边（章节为朱砂边框）；不再给所有已解锁结局统一朱砂边。
- 底部提示：「点章节看这一章的抉择；点结局看门板、救人与点名。未走到的仍留在雾里。」

### 3.2 章节详情

- 840×570 纸纹面板（844×390 下 1180×660 舞台 px）；章节小引 + 本章全部决策行。
- 决策行默认折叠；点开后：
  - 普通：「在这个「行囊」的选择中，你选择了「药、青稞、布鞋」，因此——」
  - 多选：选项文字 + 每条选中项的后果，未选项不列；
  - 超时：「时间到了，默认项「……」替你做了决定，因此——」；
  - 条件未发生：「这一步没有发生……」（如无青稞时的分粮、无门板时的桥头 C）；
  - 未来：「尚未走到」，不显示选项文字。
- 剧情未走到整章：「这一章还在雾里。下面的节点尚未走到。」

### 3.3 结局详情

- 已解锁：结局 N/11 · 标题；lede；门板去向、救下几人、状态、林先生、点名、到吴起人数；走过的路；这一局的抉择列表（最多 64 条）。
- 未解锁：只显示「结局 N/11 · 尚未抵达」+ branchMap.endings[route].hint，不泄露完整条件。

### 3.4 可达性

- 所有可点元素 ≥82 舞台 px（844×390 约 44.4 CSS px）；章节卡 49.8、结局卡 46.6、关闭 44.4、详情关闭 44.4、节点行 52。
- Enter/Space 打开；Esc 先关详情再关图；Tab 在遮罩内循环；关闭后焦点回入口；点详情背景关闭。
- 详情重开 scrollTop 归零；prefers-reduced-motion / html.reduce-motion 下无过渡；触屏不依赖 hover。

## 4. 数据与存储

### 4.1 独立键

键：xiangbei.branches.v1；与主存档 xiangbei.save.v2、名册 xiangbei.roster.v1 分开。

    {
      version: 1,
      updatedAt: 1762524000000,
      runs: [{
        id, at, route, routeIndex, routeTitle, routeLede,
        chapters: ["prologue", ... "wuqi"],
        choices: [{chapter,nodeId,option,text,timedOut}],
        summary: {hadDoor,doorOutcome,rescues,condition,playerDead,linDead,answered,missed,names,companyEnd},
        events: {zhang,rollcall}
      }],
      endings: {door_excellent: {at,runId,count}},
      chapters: {prologue: {at,runId}},
      options: {p021: {A: {at,runId}}}
    }

- runs 最多 20 条；endings/chapters/options 不清主档清掉。
- 只收 11 条正式路线；legacy 与旧路线不入收纳。
- 坏 JSON/坏版本：备份为 .bad 后回空，不白屏。
- 写失败（隐私/配额）：保留 branchMemory，toast「本机无法保存剧情分支，本次回看只在本次有效」；刷新归 0/11。

### 4.2 结算写入

engine.js finishChapter：

1. state.ending = buildEnding(state)；
2. recordBranchRun(state.ending)；
3. state.choices = []；
4. scene = ending，saveNow，render。

顺序原因：buildEnding 已生成只读快照；分支收纳需要清空前的 choices；主存档清空 choices 以控制 4096 B。recordBranchRun 只写独立键，不改 ending 16 键。

### 4.3 暂停实时视图

buildLiveBranchRun() 从 state.choices + unlockedChapters + chapterId + flags 拼一个只读 run；不写盘、不提前把未来章节或未触发结局解锁。关闭回暂停；继续回游戏。

## 5. story.js branchMap

- chapters：7 章，每章 intro/image/decisions[]。
- decisions：19 组，title/context/options；多选 multi:true；互动节点 kind:"event"，写 doneText/skipText/futureText。
- 选项文字不复制，按原 node 的 option key 读取；别名节点 x025a/b、l019/l019x、w026/c006 合并。
- endings：11 条 route 的 hint；未解锁只显示 hint。
- CSS 只使用 :root 令牌；C10 通过。

## 6. 文件清单

- docs/branch-map.md（新增）
- docs/state-schema.md（§6.1）
- docs/ui-layout.md（§2 标题菜单、§2.1 分支、层级）
- docs/test-cases.md（T12-01…T12-10）
- docs/ending-routes.md（只读收纳口径）
- 向北-项目计划书.md（v1.5.0-dev 段）
- .claude/CLAUDE.md（步骤表、当前进度）
- step/step-12-剧情分支与结局收纳.md（本文件）
- project/index.html（三入口 + #branch-map + #branch-detail）
- project/style.css（标题菜单网格、--z-branch/--z-branch-detail、分支视觉与移动覆盖）
- project/story.js（XB.story.branchMap）
- project/engine.js（分支存储/回看/详情/输入/结算）
- project/tools/check-build.js（REQUIRED_IDS + C41）
- project/tools/smoke.js（S47）
- project/tools/_pw-step12.js（新增专项）
- project/tools/_pw-step11.js（完整流程测试改为选第一个可用项，并断言分支落档）

## 7. 实测

### 7.1 工具链

- node --check engine/story/art：通过。
- check-build 40/40：C41 验证 7 章、19 决策组覆盖 22 结构节点、11 hint、独立键、三入口、先记录后清日志。
- smoke 47/47：S47 验证分支数据契约。
- check-script 9 文件 OK。
- 0 console error / pageerror / failed request / HTTP 错误 / 外部请求。

### 7.2 浏览器（Edge 156 headless）

- _pw-step12 http --case=all：98/98。
  - deep 8/8；routes 14/14；empty 15/15；live 17/17；ending 21/21；keyboard 10/10；reduce 3/3；bad 4/4；private 6/6。
- 移动 844×390、DPR2、touch：24/24；截图 mobile-map.png / mobile-detail.png。
- file:// empty：15/15；file:// ending：19/19。
- 完整实走：_pw-step11 --case=flow 14/14，173s，路线 2/11（桥板），名册 7，五卡 5，分支 runs=1，endings=door_grass_one；证明不是只靠 seed。
- 截图：empty-map、empty-chapter、empty-route、live-map、live-chapter、ending-map、ending-route-detail、routes-all、routes-bad-detail、title-history、deep-grass、mobile-map、mobile-detail、bad-store。

### 7.3 修复记录

1. 空态误显示 coda/badend 两张章节卡：branchChapterIds 改为按 story.chapters 顺序过滤 branchMap.chapters。
2. C10 报组件色值：分支色全部收进 :root 令牌。
3. 暂停测试选择器错（#vn-pause → .vn-pause）。
4. 坏结局卡只有 50px：坏结局组改单列 minmax(0,1fr)，卡宽 280。
5. 详情滚动位置残留：打开详情先 scrollTop=0。
6. 手机 tap 高亮蓝块：html 加 -webkit-tap-highlight-color: transparent。
7. 坏档/隐私 console.error 污染 0 error：恢复性降级改 console.warn（仍 toast）。
8. 所有已解锁结局误用朱砂左边：改为已解锁纸白/暗边，只有 is-current 朱砂；截图复验。
9. 完整流程测试点首个选项时遇到置灰项：新增 pickAvailableChoice，只点可用项；属测试工具适配 T11-23，不改游戏。

## 8. 已知限制 / P1

- 仅 Edge headless（含移动模拟 + touch）；Chrome/Safari/真机沿用步骤七 P0 例外。
- 标题入口不显示未完成局（设计口径）；当前局从暂停入口看。
- 结局解锁是本地 localStorage 并集；换浏览器/清站点数据会归零，不做云同步。
- 地图固定一屏、不拖拽；章节详情可滚。
- 真人 11 路线计时仍为 P1（本次未重做）。
- 未打包、未部署；dist/ 未更新，线上仍为 v1.1.1 四关版。

## 9. 回滚

- 代码：回退 index.html/style.css/story.js/engine.js 的步骤十二改动；删除 docs/branch-map.md、step-12、_pw-step12.js；check-build/smoke 的 C41/S47 同步回退。
- 存档：删除 xiangbei.branches.v1 只影响回看记录，不影响主存档/名册；不需要迁移。
- 不触碰 main / 线上版本；部署需用户确认。
