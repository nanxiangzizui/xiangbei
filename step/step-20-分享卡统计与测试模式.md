# 步骤二十：分享卡、本周目统计与测试模式（v1.9.0-dev，已打包并部署）

> 2026-11-09 · 分支 `v1.4-dev` · 已实现、已通过浏览器验证 · 已随 v1.9.0-dev 打包并部署 GitHub Pages（`236b6e0`）与 Netlify（`6af1b987…`）· 证据 `docs/evidence/p3-share-stats-dev/`、`docs/evidence/live-v1.9.0/`
> 需求来源：玩家第二轮反馈（m00052–m00054）与用户优先级（m00109）P3；本步只做体验工具，不改历史终点、11 条结局与状态账本。

## 1. 目标与范围

P3 有三项，全部是“看这一周目”的只读工具，不新增养成、战斗、排行榜或后端：

1. **本周目分享卡**：结局页生成一张 1080×1440 的竖版卡，含门板去向、同伴、状态、救人数、五张精神卡与免责声明，可保存 PNG。
2. **本周目统计**：把这一周目的七段、五名同伴、七个人名、五张精神卡并列查看；不显示完成度百分比，不把牺牲当分数。
3. **测试模式**：`?dev=1` 时标题左下出现「测试」，可跳七章或 11 条结局预置；跳转本身不写档，走到章末仍按正常规则结算。

“剧情回顾”的筛选/搜索/复制、“限时选择”的全局暂停与无障碍延长仍未做；本步不把它们混进来。

## 2. 分享卡

- 入口：结局页「生成分享卡」；弹层 `#share-card`，纸底 620×660，预览画布 CSS 330×440，内部分辨率 1080×1440。
- 内容：标题“向北 / 一块门板，两万五千里”；结局 N/11 与路线名；门板去向、同伴到达情况、状态、救人数；五张精神卡（未亮的写“这一条还没有亮。”）；底部“人物与连队虚构，非史料人物；历史终点不分支。”
- 绘制：`drawShareCard` 只用 Canvas 2D、纸色/墨色/朱砂三种主色、随包字体；长文本用 `drawWrappedText` 折行，不依赖 DOM 截图或外部库。
- 保存：`canvas.toBlob` → `URL.createObjectURL` → `a.download`，文件名 `向北-结局N.png`；`toBlob` 失败退回 `toDataURL`。下载失败只 toast，不关弹层。
- 数据源：只读 `state.ending` 与当前 `state`，不回写存档、不记成就。

## 3. 本周目统计

- 入口：结局页「本周目统计」；弹层 `#run-stats`，纸底 1040×640，内部滚动。
- 三块：门板（到吴起/留草地/铺桥/无板…）、状态（优秀/良好/勉强/差）、救人（0–3）。
- 七段：于都、湘江、遵义、金沙江、泸定、草地、吴起；按本周目 `unlockedChapters` 标“走过/未走”。
- 五名同伴：飞毛腿、灶王、冬生、林先生、你；按 `fate.*` 标到/未到。
- 七个人名：何指导员、细妹、林先生、老周、灶王、飞毛腿、冬生；应到/未应/替答/在别的连签到，与点名一致。
- 五张精神卡：亮/未亮；不显示“11 条中完成几条”的百分比。
- 底部固定说明：“只记这一周目的门板、同伴、点名与五卡；不做完成度百分比，也不把牺牲当分数。”

## 4. 测试模式

- 入口：仅 `?dev=1` 时标题左下渲染 `#dev-toggle`（普通标题不渲染，避免误触）。
- 面板：`#dev-panel`，1040×640，内部滚动；七章按钮（序章至吴起）+ 11 条结局预置按钮（1/11–11/11）。
- 章节跳转：`startDevChapter(chapterId)` 清 `ending/choices`，从该章首节点开始，不写档。
- 路线预置：`startDevRoute(routeId)` 写 `doorOutcome/condition/rescues/help.used/fate.*`，`syncDerivedFlags`，设置行囊与已解锁章节，清 `ending/choices/codex`，从吴起 `w041` 开始；不写档。走到 `w900` 仍走正常 `finishChapter`，会写结局、成就与分支。
- 关闭：Esc、遮罩或 ×；焦点回入口。测试模式不是正式入口，不写入任何“已开启测试”标记。

## 5. 结局页五个入口的溢出修复

五个按钮（生成分享卡 / 本周目统计 / 查看剧情分支 / 史实图鉴 / 返回标题）触发了通用 `.xb-btn` 的 `min-width: 220px`；在 828px 操作行里总宽超限，`justify-content: flex-end` 把前两个推到面板左侧 `x=-85`，实际点在舞台外，点击会被 `#stage` 截走。

修复：

- `.xb-ending__actions` 加 `flex-wrap: wrap`；子按钮 `min-width: 0`，内边距用 `var(--space-3)`。
- 操作行仍在结局面板下方，需要滚动到它；五张精神卡仍保证在首屏（步骤 P1 已验）。

## 6. 改动文件

- `project/index.html`：结局页五个 `data-action`；`#share-card`、`#run-stats`、`#dev-toggle`、`#dev-panel`；测试模式说明。
- `project/engine.js`：分享卡绘制/下载、统计渲染、11 条测试预置、七章跳转、三个弹层的打开/关闭/焦点/键盘/遮罩守卫；`?dev=1` 初始化；`REQUIRED_IDS` 新 id。
- `project/style.css`：结局操作行换行修复；三个弹层与移动端尺寸；分享画布 330×440。
- `project/tools/_pw-step20.js`：27 项浏览器用例，支持 http/file 与 `--mobile=1`（844×390，触摸）。
- `docs/test-cases.md` T20-01…T20-04；`docs/ui-layout.md` §16；本执行卡。

## 7. 验证

| 项 | 结果 |
|---|---|
| `node --check project/engine.js` / `story.js` / `art.js` / `_pw-step20.js` | 通过 |
| `node project/tools/check-build.js` | 51/51 |
| `node project/tools/smoke.js` | 47/47（预期 stderr：p024 超重、p024 无多选项） |
| `node project/tools/check-script.js docs/script` | 9 文件 OK |
| `_pw-step20.js --url=http --out=docs/evidence/p3-share-stats-dev/http` | 27/27，0 console error / 0 pageerror / 0 失败请求 |
| `--url=file --out=.../file` | 27/27，同上 |
| `--url=http --mobile=1 --out=.../mobile` | 27/27（844×390 触摸），同上 |
| 分享 PNG | 已下载 183,513 B，1080×1440；标题、结局、门板、同伴、五卡可见 |
| 统计 | 七段 7、同伴 5、点名 7、五卡 5；无“%”完成度 |
| 测试模式 | 仅 `?dev=1` 显示；七章（coda/badend 隐藏）；11 条预置；Esc 关闭；路线 1/11 直达结局页 |

证据：`docs/evidence/p3-share-stats-dev/http`、`/file`、`/mobile` 各含 `result.json`、`run.log` 与五张截图；分享卡下载样本在各目录 `share-card-download.png`。

## 8. 已知口径与未覆盖

- P3 三条测试路线都是从测试模式预置到吴起，**没有重走完整七章**；P0 的 1/11 草地门板补给窗、P1 首屏五卡、P2 存档 40/章卡默认来源在 P3 前已分别实测（44/44、13/13、68/68、22/22），P3 后只做了静态检查，未重跑这些浏览器专项。
- 测试模式预置的 1/11 没有点亮五张精神卡的条件旗标，因此分享卡/统计里五卡全灰；这与该预置局的实际结局页一致，不是渲染 bug。若要“好看”的分享样张，需在预置里补五卡旗标，未做。
- 移动端分享预览约 178×238 CSS，文字偏小；保存的 PNG 为 1080×1440。未做手势缩放。
- iOS/微信内置浏览器的下载行为未测；`a.download` 被忽略时只保留 `toDataURL` 回退，未做长按保存提示。
- Chrome/Safari/真机、20 分钟全程、11 条结局各一次仍沿用既有 P1/P0 例外。
- 本步未打包、未部署；两站线上仍为 v1.8.0-dev。
