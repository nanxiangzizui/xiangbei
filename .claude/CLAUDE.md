# 《向北》项目（网页互动叙事游戏）

## 项目概述

《向北》——一块门板，两万五千里。

玩家扮演长征途中红一方面军某连的 16 岁文书，背着一块从于都老家门上锯下的木板，从于都走到吴起；通过对话、取舍和 4–5 个小游戏（核心版 4 个），决定带什么、救谁、记住谁，在 20 分钟内走完长征。

- 形态：视觉小说 + 限时抉择 + 轻量小游戏
- 七段结构：序章·于都 → 第一章·湘江 → 第二章·遵义 → 第三章·金沙江 → 第四章·泸定 → 第五章·草地 → 终章·吴起·点名
- 主题落点：理想信念、不怕牺牲、独立自主实事求是、顾全大局严守纪律、依靠人民艰苦奋斗——每条精神对应一个可操作机制，不做口号式说教
- 体验底线：20 分钟通关；每关 60–90 秒；没有 Game Over，失败只改变代价；单一结局 + 可变细节，不做多结局树
- 评审注意力：最好的文本与演出放在前 5 分钟与最后 2 分钟；“史实图鉴”和“结局五卡”放在显眼位置

## 技术栈（按步骤）

### 共用基础（全步骤）

- 语言/运行时：原生 HTML5 + CSS3 + JavaScript（ES6）；不使用前端框架、不使用构建链
- 渲染：DOM/CSS 负责 UI 与文字，Canvas 2D 负责小游戏与程序化背景；固定 1280×720 舞台等比缩放，Canvas 按 `devicePixelRatio` 放大
- 部署：纯静态站点，Cloudflare Pages 托管（备选 GitHub Pages）；无后端、无数据库、无登录
- 存档：`localStorage`，键名带版本号（如 `xiangbei.save.v1`），刷新可恢复；读写用 try/catch，隐私模式下降级提示
- 剧情：内联进 `story.js`，不使用 `fetch`/XHR/ES module；为兼容 `file://` 离线 ZIP，脚本用经典 `<script>` + 全局命名空间（如 `window.XB`）
- 美术：Canvas/SVG 程序化版画（层叠山形、江面白线、雪粒、雾、铁索），人物用剪影；不使用未授权图片/影视/游戏素材
- 音频：Web Audio 合成风声、水声、鼓点、口琴五音动机；不使用音频文件；`AudioContext` 必须在用户首次点击后启动
- 字体：标题得意黑，正文霞鹜文楷/思源宋体；使用前核对开源商用授权；加载失败回退系统宋体（如 `"Songti SC", "SimSun", serif`）
- 明确不用：Web 框架 / 构建链 / 后端 / 登录 / 数据库 / 排行榜 / 多人 / 战斗 / 养成 / 多结局 / 付费素材

### 分步骤

| 步骤 | 状态 | 对应计划书 | 技术栈 / 组件 | 出口（可验证） |
|---|---|---|---|---|
| 零 定题、史料与剧本 | ✅ 完成（2026-11-01，tag `step-0-done`） | 1–2 | Markdown；七段结构、4 关、五精神机制；《史实锚点表》A1–A7 + 出处 S1–S15 | 结构表 story-bible §4.1 + 台账 §4.2 + 史料表 sources.md；七章剧本 4108 字 / 229 beat；7 张史实注；红线 10/10；T0.0–T0.9 逐卡见 step-00 §11.1（真人外读 1 项待步骤七补） |
| 一 工程骨架 | ✅ 完成（2026-11-01，tag `step-1-done`） | 3 | 六文件 + `tools/redlines.js / check-build.js / smoke.js`；固定舞台缩放；XB.core 纯状态层 + XB.engine；localStorage 每 beat 存档 | 标题→地图→序章 20 句→返回；p010 刷新回原句；三种坏档不白屏；控制台 0 error；check-build 9/9、smoke 14/14、浏览器 12 项全绿（Edge 156 + Playwright） |
| 二 视觉系统 | ✅ 完成（2026-11-01，tag `step-2-done`） | 4 | CSS 变量与 --paper-texture；`art.js` 四场景程序化版画（单画布 #stage-art）；10 类 `xb-*` 组件壳 + 预览页；?fonts=fallback | 标题画面 + 一套 UI 组件（10 类）；1920/1366/844×390 三档不出界；字体回退实测生效；check-build 12/12、smoke 17/17、浏览器 B1–B14 全绿（Edge headless） |
| 三 VN 引擎 | ✅ 完成（2026-11-01） | 5 | 扁平条件节点图（when/nextVisible，无 stack）；打字机 + 二分分页（量具 1108×66）；限时选项 + 默认项 + timedOut + 选择日志；标题卡两用；史实注单张弹窗；自动/跳过；暂停 + 六项设置；存档仍 v1 | 完整播放序章（48 节点 / 41 line，四路径全到 p900）；旗标与 `inventory.door` 镜像生效；p020/p021/p037 刷新回原节点；超时按默认项结算并落档；check-build 17/17、smoke 26/26、浏览器 B1–B18 全绿、四路径 41/41 |
| 四 核心小游戏（4 关） | ✅ 完成（2026-11-02，tag `step-4-done`） | 6 | 统一 `start/stop/isActive/resize` + 四关 `init/update/draw/onPointer/onKey/end`；共享限时分配引擎（计时、拖拽、配额、疲劳、网格）；单 Canvas 1280×720；结果对象无 success/score | 4 关可独立试玩（`?minigame=`）；p024→p025 动态两栏；失败只结算代价、不重开；844×390 触摸可玩；check-build 23/23、smoke 33/33、四个负例报红、Edge B19–B30 全部有结果（B25 疲劳 100 记例外）、0 console error、file:// 与 http 可玩 |
| 五 章节接入 | ✅ 完成（2026-11-02，tag `step-5-done`） | 7 | 七章流程；错误卡；民心值→船工数；史实图鉴 | 从头玩到尾；7 张史实注；结局点名 + 数字 + 五张精神卡 |
| 六 音频与动效 | ✅ 完成（2026-11-02，tag `step-6-done`） | 8 | `XB.audio`（9 床 / 12 cue / 原创五音）+ `XB.fx`（480ms 横擦 / 120ms 闪白 / 180ms 震动 / 420ms 划名）内联 `engine.js`；`#fx-layer`；静音/音量持久化 | 无音频文件；首次手势前 locked、点击后 ready；9 床覆盖 17 场景；划名只划 is-missed 且 reduced 立即；check-build 36/36、smoke 46/46、N5–N12 全红；Edge B45–B56 79/79、0 console error；file:// 与 http 可玩 |
| 七 测试与适配 | 🚧 进行中（2026-11-02；机器项与计时完成；T51 复读通过；T47 三人均玩游戏，非重度/不常玩待确认；未 tag） | 9 | Chrome/Edge/Safari；1920×1080、1366×768、手机横屏；键鼠 + 触摸；20 分钟计时 | 一页测试记录 + 修复清单；验收标准逐项通过或记录例外 |
| 八 打包与交差 | ⬜ 未开始 | 10 | Cloudflare Pages/GitHub Pages；ZIP 离线版；设计说明；3 分钟演示 | 链接 + ZIP + 设计说明 + 演示视频 + 字体授权清单 |

## 项目结构（计划）

```text
./                             # 当前项目根：D:\deepseek harness\新建文件夹
├─ 向北-项目计划书.md          # 唯一权威计划
├─ project/                    # 全部代码与运行资产（用户指令：代码文件统一放这里）
│  ├─ index.html               # 舞台、UI 层、脚本入口
│  ├─ style.css                # 版式、配色、UI 组件、纸纹
│  ├─ engine.js                # 状态机、输入、存档、转场、音频模块
│  ├─ story.js                 # 七章剧情数据、选项、旗标、史实注（由 docs/script 誊写）
│  ├─ minigames.js             # 4 个核心小游戏 + 可选探路/分粮 + 共享引擎
│  ├─ art.js                   # 程序化版画/纹理/剪影
│  ├─ assets/
│  │  └─ fonts/                # 仅在授权与体积允许时打包
│  └─ tools/                   # 开发期脚本，不进运行时
│     ├─ count-words.js        # 剧本字数与时长统计
│     └─ check-script.js       # 剧本红线自检（禁用词/真名/选项/结构）
├─ docs/
│  ├─ story-bible.md           # 人物/名册/道具/分幕/五卡/决策记录 D1–D7
│  ├─ sources.md               # 史实锚点表 A1–A7/出处 S1–S15/争议/停用项
│  ├─ codex.md                 # 7 张史实注定稿（游戏内“史实图鉴”）
│  ├─ script/                  # 七章剧本文本源（story.js 的誊写来源）
│  │  ├─ README.md             # 行格式/字数口径/统计表
│  │  └─ 00-prologue.md … 06-wuqi.md
│  ├─ style-guide.md           # 术语/文风/史实审校
│  ├─ state-schema.md          # 存档 JSON/旗标/迁移（v1，11 键）
│  ├─ audio-system.md          # 9 床/12 cue/五音/生命周期/duck/fx 上限
│  ├─ minigame-tuning.md       # 数值表/参考游戏
│  ├─ ui-layout.md             # 1280×720 坐标/线框（§9 特效层）
│  ├─ test-cases.md            # T01–T38 验收用例
│  ├─ demo-script.md           # 3 分钟演示逐字稿
│  ├─ quality-bar.md           # 可访问性/性能预算
│  ├─ design-note.md           # 交差用一页设计说明（步骤八）
│  ├─ test-record.md           # 测试记录与修复清单（步骤七）
│  └─ credits.md               # 制作名单与字体授权（步骤八）
├─ step/                       # 分步骤执行卡（step-00 起）
├─ .claude/
│  ├─ CLAUDE.md                # 本文件
│  └─ skills/xiangbei-dev/SKILL.md
└─ .cursor/
   └─ rules/xiangbei.mdc       # Cursor 常驻项目规则（本文件摘要）
```

## 当前进度（2026-11-02）

- 项目根目录：`D:\deepseek harness\新建文件夹`（当前工作区；如移动/改名，命令同步改）。
- **本文件是唯一状态源**；`SKILL.md` 不再维护独立状态，只链接到这里。
- Cursor 常驻规则：`.cursor/rules/xiangbei.mdc`（本文件与计划书的摘要，不另存状态；冲突以本文件/计划书为准）。原 `.cursor/rules/000`–`040` 编码规范已合并进同一文件，不再单独维护。
- **代码目录约定（用户指令）**：所有代码/运行文件放 `project/`（index.html、style.css、engine.js、story.js、minigames.js、art.js、assets/、tools/）；docs、step、.claude、.cursor 留在根目录。
- 已有：`向北-项目计划书.md`（唯一权威计划）、`docs/`（story-bible / sources / codex / script×8 / style-guide / state-schema / audio-system / chapter-integration / minigame-tuning / minigame-system / ui-layout / visual-system / visual-reading / test-cases / demo-script / quality-bar / credits）、`step/`（step-00、step-01、step-02、step-03、step-04、step-05、step-06、step-07 执行卡）、`docs/test-record.md`（步骤七机器项实测）、`project/`（index.html / style.css / engine.js / story.js / art.js / minigames.js + tools/ 含 ui-preview.html / ui-preview.js / redlines.js / check-build.js / smoke.js / check-script.js / count-words.js 及证据脚本）、`docs/evidence/step-01|step-02|step-03|step-04|step-05|step-06/`（浏览器证据与实测记录，gitignored）。
- 步骤零：✅ 完成（2026-11-01）。七章剧本 4108 字 / 229 beat / 12 抉择点 / 26 选项 / 9 限时；口播 A 口径 11:22，整章合计 19:44；7 张史实注（120–220 字，含 4 项争议口径）；红线 10/10；T0.0–T0.9 逐卡记录见 `step/step-00-定题史料与剧本.md` §11.1；tag `step-0-done`。
- 步骤一：✅ 完成（2026-11-01，tag `step-1-done`）。固定 1280×720 舞台等比缩放；title/map/vn 三场景 + 暂停遮罩；`XB.core` 纯状态层 + `XB.engine`；`xiangbei.save.v1` 每 beat 存档、坏档备份 `.bad`/`.bak` 后回标题；序章 p001–p020（20 句逐字）+ p900 临时章末；工具 redlines / check-build（9 项）/ smoke（14 项）；浏览器实测 12 项全绿（Edge 156 + Playwright，file:// 与本地 http）。记录见 `step/step-01-工程骨架.md` §11。
- 步骤二：✅ 完成（2026-11-01，tag `step-2-done`）。`style.css` 重写为令牌层（:root 五色 + 派生 + 字号/间距/z-index/动效/--paper-texture，组件只写 var()）；`art.js` 四场景程序化版画（title / map / yudu_river / yudu_night，FNV-1a→mulberry32 定种，DPR 上限 2，paint 0.04–0.18ms）；单画布 `#stage-art` 取代 `.vn-bg`，engine 接入 paintStage + 失败隐藏画布 + 一次性 toast；标题 96px + 朱砂印章「北」+ 门板刻痕；10 类 `xb-*` 组件壳（btn / dialog / choice / title-card / codex / ending / pause / settings / hud / feedback）+ `project/tools/ui-preview.html` 预览页；`?fonts=fallback` 回退开关。修复两处实测 bug：手机横屏改用 `clientWidth`（innerWidth 被 shrink-to-fit 放大到 1062）与 ?debug 画布尺寸过期（updateDebug 移入 resize rAF 回调）。check-build 12/12、smoke 17/17、check-script OK；浏览器 B1–B14 全绿、0 console error；记录见 `step/step-02-视觉系统.md` §11 与 `docs/evidence/step-02/run-log.md`。
- 步骤三：✅ 完成（2026-11-01，tag `step-3-done`）。`engine.js` 重写为「扁平条件节点图 + 打字机阅读层」：`XB.core` 去 stack，改 `locate / currentNode / currentChapter / evalWhen / isVisible / firstVisible / nextVisible / startChapter / advance`，新增 `setFlag`（白名单 + 夹取 + `inventory.door` 镜像）、`applySet`、`applyChoice`（写 `record` 旗标 + 追加 `{chapter,nodeId,option,text,timedOut}` 日志）、`codexById`；`normalize` 坏档整体回默认并给 issue、`flags` 合默认夹取、`choices` 只留 64 条、`codex` 过滤为已知 7 个 id。`XB.engine` 加打字机（rAF 累计 + 二分分页量具 1108×66，`--text-scale` 1/1.15/1.3）、限时选项（rAF 倒计时、暂停不偷时间、超时按 `defaultOption` 结算并落档 + toast）、标题卡两用（入口卡 1200ms + p043 authored）、史实注弹窗（7 张内联 + 解锁落档 + 焦点陷阱）、自动/跳过（skip 只对已读）、暂停 + 六项设置、`?debug` 面板。`story.js` 补序章 48 节点（41 line / 2 choice / 1 minigame seam / 1 result / 1 title / 1 codex / 1 end）与 7 张图鉴；`index.html` / `style.css` 加阅读层九容器。实测修掉四个真 bug：`currentNode()` 漏传 state（7 处）、标题卡同一次点击被关两次致首句被瞬间补全、地图用 `playable` 判锁致已解锁章节点不动、选项缺键盘 1/2。check-build 17/17、smoke 26/26、check-script OK；浏览器 B1–B18 全绿、四路径 41/41 line 与 48/48 节点全覆盖、四个负例均报红；记录见 `step/step-03-VN引擎.md` §11 与 `docs/evidence/step-03/run-log.md`。
- 步骤四：✅ 完成（2026-11-02，tag `step-4-done`）。`project/minigames.js` 从 4 行空壳扩为共享限时分配引擎 + 四关：`start/stop/isActive/resize`、rAF 循环（dt≤50ms）、暂停冻结、pointer capture + 8px tap slop、1–8/Shift/Enter/Space 键盘、500ms live 节流、结果对象 `{gameId,reason,elapsed,carried,left,stats}`（无 success/score）。门板 6 格/门板 2 格/5 件可选物；弃物 2 批×3/追兵 45s/重物 −8s；渡船 6 船×3 船工/18 趟/疲劳 12 每腿/休息 −12/soft 80 +4s；攀索 22 灯/3 段/1.8s 步/0.35s 窗/6·12·18 火墙。`engine.js` 接 `?minigame=door|abandon|boat|climb`、p024→p025 动态两栏、结果按 flags/inventory 重建、solo 不写档、go/start 先 stop、输入守卫。实测：p024 刷新重开、p025 刷新重建；带/不带门板两路径；844×390 触摸、1366/1280/DPR2；键盘/Esc/焦点/ARIA；Edge B19–B30 全部有结果（B25 例外）、0 console error、file:// 与本地 http 可玩。check-build 23/23、smoke 33/33、四负例报红（N1 duration120→C22、N2 success→C19、N3 删 canvas→C03、N4 lights 字符串→C21）。记录见 `step/step-04-核心小游戏.md` §11 与 `docs/evidence/step-04/run-log.md`。
- 步骤五：✅ 完成（2026-11-02，tag `step-5-done`）。七章全部接入（277 节点 / 232 line / 13 choice / 4 minigame / 6 result / 6 title / 7 codex / 2 interact / 7 end）；`story.ending` 五卡 + `engine` 的 ending 场景、`buildEnding`、ending normalize；吴起点名 7 名/45s、金沙江记名、遵义错误卡、7 张图鉴三入口、章末记忆、`?chapter=&node=`；`art.js` 16 场景；`index/style` 加 ending/点名/图鉴。工具：check-build 30/30、smoke 40/40、check-script 通过、`_pw-extra` 49/49、`_pw-mobile-http` 14/14、四负例报红。Edge B31–B43 全绿、B44 部分（真人 20 分钟计时留步骤七）；0 console error；file:// 与 http、844×390 触摸、图鉴 0/7→7/7、全答/漏答、五卡全亮/全灰、刷新/继续均实测。修 x025a C 后掉回 x025b 的分支 bug（x025b when 加 `!choice.xiangjiang.hold`）与 p039 门板分支；docs 已同步。记录见 `step/step-05-章节接入.md` §11 与 `docs/evidence/step-05/run-log.md`。
- 步骤六：✅ 完成（2026-11-02，tag `step-6-done`）。`engine.js` 内联 `XB.audio`：9 床 / 17 场景映射 / 12 cue / 原创五音动机 D4–F4–G4–A4–C5；三总线 → compressor → master，800ms 交叉、activeBeds≤2、100ms cue 节流、暂停 duck 0.3 / 图鉴 0.45、hidden suspend / visible resume；`XB.audio.unlock()` 只在首次 pointerdown/keydown 创建 AudioContext，无音频文件。`XB.fx` + `#fx-layer`：480ms 墨色横擦、120ms/0.12 闪白（2s 冷却）、180ms/2px 震动、ending 只划 is-missed 的 420ms 墨线（90ms 错峰，同局一次）；系统与设置双入口 reduced。工具：check-build 36/36、smoke 46/46、check-script OK、N5–N12 全红。Edge B45–B56 79/79、0 console error、0 pageerror；file:// 与 http、844×390 触摸、9 床映射、静音/音量刷新保留均实测。记录见 `step/step-06-音频与动效.md` §11 与 `docs/evidence/step-06/run-log.md`。
- 步骤七：🚧 进行中（2026-11-02）。机器项：`docs/test-record.md` 已建；Edge 156 headless/file+http 全流程（190.75s/407 line）与 844×390 全流程（200.9s/406 line，tap）通过；四关正常+失败路径、图鉴三入口、隐私降级、断网 ZIP、音频 API/9 床/12 cue、键盘/焦点、三档分辨率均通过；check-build 36/36、smoke 46/46、check-script OK；S2-01/02/04（移动暂停 52×52 CSS px、ending 字号、五卡可达）已修复；S3-03 限时选择翻倍（8→16/10→20/6→12）已改，p021 16.3s、x025b 20.3s 超时实测通过，限时翻倍后 Edge 全流程 190.7s/407 line 通过。T20 已通过：A 8:33/B 6:42/C 7:36/D 4:52（A/B 翻倍前，C/D 版本未注明，按 +74s 上限仍 ≤9:47）。T47：3 人联合访谈、代表提交，5 问已回收（未逐人分开；三人均玩游戏，是否有“不常玩/非重度”者待确认，X8）。T51：首轮 3/5 基本正确、2/5 不清（错误卡、点名），已改 z026/z027/w017 并复跑全流程 191.8s/407 line；同读者复读两问均正确（错误卡：让下一程少走一步；点名：记住牺牲的人），T51 PASS，X9 关闭。T39 Chrome、T40 Safari、T46 听感未做。结论“T51 已关闭；待 T47 非重度参与者确认”，改动已提交（0d41f59），未 tag。
- 已知风险：整章时长 19:48，仅余 12 秒；9 个限时项于 2026-11-02 翻倍（8→16/10→20/6→12）后，最坏等待上限约 23:44（常速目标仍 84s，不按上限翻倍）。裁剪顺序按红线 13（草地 → 金沙江 → 遵义改纯对话）。终章 834 字超 §5.6.3 的 660 字预算（+26%），已记录不隐藏，步骤七实测超时再裁。
- 已知欠账：①真人外读已做（1 人，2026-11-02）：首轮 3/5，错误卡/点名 2 问不清；修文后同读者复读两问均正确，T51 PASS，X9 关闭；2026-11-01 的 AI 替代记录在 step-00 §11.4，不再算数；②本机默认沙箱下 pwsh 子进程初始化失败（0xC0000142），带 `danger-full-access` 重试即可正常跑 node/git，默认策略下的可执行性仍需步骤七复核；③浏览器：仅 Edge headless（含移动模拟 + touch）；Chrome/Safari、真机触摸留步骤七；20 分钟计时已由 A–D 四次通过；隐私模式与断网 ZIP 已在步骤七机器项通过；④字体：本机未安装得意黑/霞鹜文楷，默认落 Microsoft YaHei/SimSun，步骤八决定是否子集打包 OFL 字体；⑤file:// localStorage 在 Edge 可用；隐私模式降级已测（提示“本局无法存档”，可继续）；⑥已修：844×390 ending 字号 ≥14 CSS px、面板可滚且五卡可达（S2-02/04）；⑦自动/跳过用本会话已读集合，刷新后归零（设计如此，不写档）；⑧已修：手机横屏暂停改 96 逻辑≈52 CSS px（S2-01）；⑨音频主观听感未验收——B49 headless 峰值采样为 0（只证明 <0.99），真机/耳机试听、真实切后台（B48 用 `document.hidden` 属性模拟）、真机首次手势与锁屏（B54 为移动模拟）留步骤七；B50 转场与 B53 划名未录屏。
- 建议下一步：确认 T47 三位中是否有人属于“不常玩/非重度”；若有，直接收口；若三人均为常玩，补 1 位不常玩参与者（10–15 分钟，序章 + 一关 + 5 问），或由用户明确接受 P0 例外。收口后重跑闸门、更新 `docs/test-record.md` 与本节，提交并打 tag `step-7-done`；有余力再补 Chrome/Safari 真机、音频听感与真实后台。步骤八再做字体授权与打包、Cloudflare Pages、设计说明与演示视频。

## 关键约束与红线

### 史实

1. 大事件结局不可改：湘江必败、遵义必开、泸定必夺。
2. 不虚构领导人对话；真实人物只进“史实注”，不进游戏剧情。遵义复盘用旁白/文件/虚构基层人物呈现，不让真实领导人开口。
3. 争议细节标注“有不同说法”：X 光机具体情形、22 勇士牺牲人数、金沙江船数。
4. 严格区分史实 / 回忆录 / 文学；《七根火柴》《金色的鱼钩》是小说，不能当史料。
5. 每条史实注入注明出处；交差设计说明附《史实出处表》。

### 情感

6. 虚构人物（含主角）在片头或图鉴明确标注“虚构人物，非史料人物”。
7. 死亡用“名字被划掉”和留白表现；不做血腥特写；不消费苦难。
8. 不把牺牲做成分数；小游戏失败只结算代价，不做“完美通关”评分。
9. 敌人不脸谱化。

### 玩法

10. 每关 60–90 秒；没有 Game Over；失败不重开，只改变代价。
11. 单一结局 + 可变细节（带什么、救谁、记住谁）；不做分支结局树、战斗、“打鬼子”关卡、养成、排行榜、多人。
12. 选项是道德取舍，不设“明显正确”的答案；限时选项超时按默认项结算并记录代价。
13. 20 分钟是硬验收；超时先裁草地，再裁金沙江，最后把遵义改成纯对话；保留序章/湘江/泸定/点名。

### 技术

14. 剧情内联；不用 `fetch`/XHR/ES module；经典 `<script>` + 全局命名空间，保证 `file://` 离线 ZIP 可玩。
15. Canvas 按 `devicePixelRatio` 放大；触摸坐标用 `getBoundingClientRect()` 换算；热区不小于 44px。
16. `localStorage` 加版本号并用 try/catch；版本不匹配时迁移或提示重置，不能白屏。
17. `AudioContext` 在首次用户点击后创建/恢复；静音与音量持久化。
18. 字体使用前核对授权；加载失败回退系统宋体；不把未授权字体打进 ZIP。
19. 所有资源用相对路径（`./`），兼容 GitHub Pages 子路径与 `file://`；不依赖任何 CDN。
20. 16:9 横屏为基准；手机竖屏给出“请横屏”提示；小游戏单手可完成。

### 范围与交付

21. 文本量是最大成本；先写三场重头戏，再补其他章；不要平均用力。
22. 核心 4 关（+ 可选第 5 关）共用一套“限时分配”引擎（计时、拖拽、配额、疲劳、网格），不要每关写一套独立引擎。
23. 交差材料：链接 + ZIP + 一页设计说明（史实出处表 + 精神对照表 + 操作说明）+ 3 分钟演示 + 制作名单/字体授权。
24. 验收底线：20 分钟内通关；至少 4 个可玩小游戏；7 张史实注；结局有“点名 + 数字 + 五张精神卡”；手机横屏可玩；断网 ZIP 可玩。

## 工作方式与状态

- 固定流程：对齐（目标/步骤/文件/验收/不可逆动作）→ 读计划与现状 → 先文本后代码/先原型后接入 → 一次只改一个变量 → 浏览器验证 → 留证据 → 汇报。
- 证据分级：A 浏览器实测（截图/录屏/控制台）；B 代码完成未跑；C 设计稿/口述；D 未验证。没有实际运行就写“未验证”，不把“写了”说成“能玩”。
- 每个步骤完成时更新本文件步骤表；步骤状态用 ⬜ / 🚧 / ✅。
- 仓库已初始化（main）；每个步骤完成提交并打 tag（如 `step-0-done`）；部署与视频发布前确认。
- 不可逆动作先确认：部署上线、覆盖线上版本、删除/重置存档格式、公开发布视频、打包他人字体/素材。
- 深入某一步骤时加载 `.claude/skills/xiangbei-dev`，按步骤读对应章节，不要一次读完全部。

## 常用命令

```powershell
cd "D:\deepseek harness\新建文件夹"

# 直接打开（剧情内联，file:// 可跑；存档能力需实测）
Start-Process ".\project\index.html"

# 或本地静态服务（更接近线上；--directory 指向 project）
python -m http.server 8080 --directory project
# 浏览器打开 http://localhost:8080

# 语法与构建自检（开发期脚本，不进运行时）
node --check project/engine.js
node --check project/story.js
node --check project/minigames.js
node --check project/art.js
node project/tools/check-build.js
node project/tools/smoke.js
node project/tools/check-script.js docs/script

# 部署：Cloudflare Pages 选择静态站点，构建命令留空，输出目录为根目录；
# 也可用 Git 集成或控制台拖拽上传。不要把密钥写进仓库。
```

## 验收底线

| 项 | 底线 | 验证方式 |
|---|---|---|
| 时长 | ≤ 20 分钟 | 从标题到点名完整计时，至少 3 次 |
| 小游戏 | ≥ 4 个可玩 | 每个独立进入、失败路径、触摸 |
| 史实注 | 7 张可解锁 | 图鉴逐张检查 |
| 结局 | 点名 + 数字 + 五张精神卡 | 完整通关截图 |
| 移动端 | 手机横屏可玩 | 真机或开发者工具触摸模拟 |
| 离线 | ZIP 断网可玩 | 断网/飞行模式打开 `index.html` |
| 浏览器 | Chrome/Edge/Safari | 三浏览器各一次完整流程 |
| 素材 | 无未授权素材 | 字体/图片/音频授权清单 |

## 注意事项

- 项目路径含空格，命令必须加引号。
- 仓库已初始化（main）；提交前检查是否误带大文件/字体/未授权素材。
- 不要把 `story.js` 拆成 JSON + fetch；`file://` 会失败。
- 不要用 ES module；离线 ZIP 下可能被 CORS 拦截。
- `localStorage` 在 `file://` 与隐私模式可能不可用；必须降级，不白屏。
- 音频不要自动播放；首次点击后再启动。
- 手机端不要依赖 hover；所有交互用 pointer 事件。
- 闪白/震动控制强度与频率；尊重 `prefers-reduced-motion`。
- 交差时老师大概率只看 3 分钟：把最好的文本和演出放在前 5 分钟与最后 2 分钟。
- 阶段/状态变化时只更新本文件的步骤表与“当前进度”；技能文件只链接状态，不重复维护。
- 深入某一步骤加载 `.claude/skills/xiangbei-dev`，按步骤读，不要一次读完。
