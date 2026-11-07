# 《向北》项目（网页互动叙事游戏）

## 项目概述

《向北》——一块门板，两万五千里。

玩家扮演长征途中红一方面军某连的 16 岁文书，背着一块从于都老家门上锯下的木板，从于都走到吴起；通过对话、取舍和 4 段核心选择（行囊、弃物、先渡谁、门板/记名），决定带什么、救谁、记住谁，以及最后是谁走到吴起；在 20 分钟内走完长征。

- 形态：视觉小说 + 限时抉择 + 多选取舍（v1.3.0-dev）；人物命运四路线，历史终点不分支
- 七段结构：序章·于都 → 第一章·湘江 → 第二章·遵义 → 第三章·金沙江 → 第四章·泸定 → 第五章·草地 → 终章·吴起·点名
- 主题落点：理想信念、不怕牺牲、独立自主实事求是、顾全大局严守纪律、依靠人民艰苦奋斗——每条精神对应一个可操作机制，不做口号式说教
- 体验底线：20 分钟通关；每关 60–90 秒；没有 Game Over，失败只改变代价；历史终点单一，人物命运四路线（v1.3.0-dev），没有全活；不做好感度/攻略角色/真结局/结局百分比/分支存档树
- 评审注意力：最好的文本与演出放在前 5 分钟与最后 2 分钟；“史实图鉴”和“结局五卡”放在显眼位置

> **v1.2.0-dev 口径（2026-11-06，已实现，未打包/未部署）**：移除四关小游戏（门板/弃物/渡船/攀索），改为 4 段选择——序章行囊多选、湘江弃物多选、金沙江先渡谁、泸定门板/记名；核心剧情、史实、7 张图鉴、五张精神卡、点名结局不变。当前线上 v1.1.1 仍为四关，`dist/` 未重打包；执行与实测见 `step/step-09-移除小游戏与选择回写.md`、`docs/evidence/step-09/`。
>
> **v1.3.0-dev 口径（2026-11-06，已实现，未打包/未部署）**：历史终点与七章不变；加三次救人危机（泸定飞毛腿、草地灶王、草地尽头冬生），按“救人数 / 门板 / 你是否倒下”收束为四路线：四道划痕（救 0、死 4）、门板（救 1、死 3、板到吴起）、桥板·石墙（救 1–2、死 3、无板；救 2 时林先生死）、空页（救 3、你死在草地、冬生背名册到吴起、满崽由冬生答）。没有全活；救越多自己越近死亡。设计、账本、节点、测试见 `docs/ending-routes.md`；执行卡见 `step/step-10-人物命运四路线.md`；证据见 `docs/evidence/step-10/`。
>
> **v1.4.0-dev 口径（2026-11-07，设计定稿，代码未迁移）**：在 `v1.4-dev` 分支隔离开发，`main` 保留 v1.3。行囊 4 格（8 个半格：药/青稞 0.5、鞋 1、锅/雨布/门板 2）；新增状态 0–4（优秀/良好/勉强/差/死）、救人数 `rescues`、队内状态 `condition`、门板带出 `doorOutcome`；结局改为带板 5 + 无板 5 + 坏结局共 11 条，林先生只在我死时死；存档新键 `xiangbei.save.v2` 并保留 v1 迁移。设计见 `docs/ending-routes.md`，执行卡见 `step/step-11-状态物资与门板.md`。未打包、未部署。

## 技术栈（按步骤）

### 共用基础（全步骤）

- 语言/运行时：原生 HTML5 + CSS3 + JavaScript（ES6）；不使用前端框架、不使用构建链
- 渲染：DOM/CSS 负责 UI 与文字，Canvas 2D 负责程序化背景；v1.1.1 的小游戏画布随 v1.2.0 删除；固定 1280×720 舞台等比缩放，Canvas 按 `devicePixelRatio` 放大
- 部署：纯静态站点，GitHub Pages 托管（本版已上线；Cloudflare Pages 备选）；无后端、无数据库、无登录
- 存档：`localStorage`，键名带版本号（如 `xiangbei.save.v1`），刷新可恢复；读写用 try/catch，隐私模式下降级提示
- 剧情：内联进 `story.js`，不使用 `fetch`/XHR/ES module；为兼容 `file://` 离线 ZIP，脚本用经典 `<script>` + 全局命名空间（如 `window.XB`）
- 美术：v1.0.0 为 Canvas/SVG 程序化版画（层叠山形、江面白线、雪粒、雾、铁索），人物用剪影；v1.1.0 加 12 张 CC/PD 影像的版画化改编 + 1 张 AI 标题插画；不使用未授权图片/影视/游戏素材
- 音频：v1.0.0 为 Web Audio 合成风声、水声、鼓点、口琴五音动机；v1.1.0 加 5 条 CC0 环境录音 + 8 首 CC0/CC-BY 现代配乐（MP3 归一化 RMS 0.10、musicBus 0.62、gains 1.5；HTMLAudioElement → MediaElementSource，file:// 失败退回直连），仍无历史录音冒充；`AudioContext` 必须在用户首次点击后启动
- 字体：v1.0.0 标题得意黑、正文霞鹜文楷，只用 local()；v1.1.0 随包 OFL 子集（大标题得意黑，正文/章节/图鉴朱雀仿宋，约 552 KB），回退系统宋体；使用前核对开源商用授权
- 明确不用：Web 框架 / 构建链 / 后端 / 登录 / 数据库 / 排行榜 / 多人 / 战斗 / 养成 / 多结局树 / 好感度 / 真结局 / 付费素材

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
| 七 测试与适配 | ✅ 完成（2026-11-02，tag `step-7-done`；有条件交差：T39/T40 与 T47 P0 例外经用户接受） | 9 | Chrome/Edge/Safari；1920×1080、1366×768、手机横屏；键鼠 + 触摸；20 分钟计时 | 一页测试记录 + 修复清单；验收标准逐项通过或记录例外 |
| 八 打包与交差 | ✅ 完成（2026-11-03，tag `step-8-done`；**GitHub Pages 已上线**；视频按用户取消、字体不打包） | 10 | GitHub Pages；ZIP 离线版；设计说明；3 分钟演示（取消） | **https://nanxiangzizui.github.io/xiangbei/**（部署提交 `7dbe2b4`）；`dist/site` 8 文件 / 672,029 B；ZIP 10 条目 / 375,948 B；PDF 1 页 / 291,464 B；CREDITS 2,025 B；字体 0 字节；check-build 38/38、smoke 46/46；发布包 http 191.1s/407 line、ZIP file 191.1s/408 line、96/96；专项 22/22×2；fps 桌面 60/60、移动 60/48.7；公网 live smoke 16/16；移动四关沿用步骤七 |
| 八·五 素材增强 | ✅ 完成（2026-11-04，v1.1.0；已部署 `f8b2045`） | 用户游玩反馈 | 12 张 1920×1080 版画化场景/地图底图（含湘江地图标题卡）+ 1 张豆包 Seedream 标题插画（虚构红军小战士/于都河，非史料人物/现场）；OFL 子集随包（朱雀仿宋 + 得意黑，约 552 KB）；5 条 CC0 环境循环 + 8 首现代配乐；`art.js` 懒加载 + 程序化回退 | check-build 38/38、smoke 46/46；Edge http/file/移动全流程与四关通过；site 47 文件 / 27,888,240 B，ZIP 49 条目 / 27,347,934 B；2026-11-04 部署 `f8b2045`，公网关键文件 8/8 哈希一致 |
| 八·六 阅读与演出增强 | ✅ 完成（2026-11-04，v1.1.0；已部署 `f8b2045`） | 用户游玩反馈 | 照片章首卡（6 个章节卡 + 日期/地点）、图鉴缩略图与照片年代说明、照片 28s 推拉 + 预加载、总/配乐/环境三档音量与 file:// 直连淡入淡出、暂停花名册、`?fonts=fallback` 保留 | check-build 38/38、smoke 46/46、专项 21/21；http 201.585s / 405 line、file:// 197.639s / 406 line、844×390 207.978s / 405 line，均 5 卡 / 7 名 / 0 划名、0 错误；四关 20/20；六张章节卡 6/6；移动阅读层 7 缩略图 / 花名册可见；2026-11-04 部署 `f8b2045` |
| 八·七 慢网与竖屏适配 | ✅ 完成（2026-11-05，v1.1.1；已部署 `88771d3`） | 用户游玩反馈 | 底图 480 WebP 占位 → 1600 WebP → 1920 JPEG 兜底；标题占位预加载；竖屏提示改用系统浏览器；`release.py` 资源清单 | check-build 38/38、smoke 46/46；7 场景定向、竖屏/横屏、file:// 通过；公网标题 1.74s、占位 1.75s、全图 3.28s、0 error；site 73 / 31,356,254 B，ZIP 75 / 30,818,357 B；未重跑 200s 全流程 |
| 八·八 Netlify 主站 | ✅ 完成（2026-11-05，v1.1.1；已上线） | 用户反馈（GitHub 慢） | `dist/site` 静态直传 Netlify；用户认领 `xiangbei`；无密码；GitHub Pages 保留备用 | `https://xiangbei.netlify.app/` 标题/序章通过，0 error / 0 404；site 73 / 31,356,254 B；未重跑公网完整流程 |
| 九 移除小游戏与选择回写 | ✅ 完成（2026-11-06，tag `step-9-done`；v1.2.0-dev 未打包/未部署） | 用户反馈 | 删除四关与 `minigames.js`、`?minigame=`；新增 `multichoice` 组件；行囊/弃物多选；金沙江先渡谁、泸定门板/记名保留；即时 + 后续回写；旧存档旗标回填与节点迁移 | 4 段选择可玩（键鼠/触摸/刷新）；无小游戏文件/入口/画布；check-build 37/37、smoke 46/46、check-script OK；target 34/34、segments 19/19、migration 19/19；http flow 14/14 71s/432 line（flow.lines 对话推进计数）、file flow 14/14 72s、844×390 flow 17/17 78s；0 console error；旧档可继续；执行卡 `step/step-09-移除小游戏与选择回写.md` |
| 十 人物命运多结局 | ✅ 完成（2026-11-06，tag `step-10-done`；v1.3.0-dev 未打包/未部署） | 用户反馈 | 三次救人危机；`strain` 0–3；四路线；隐藏 `coda`；名册回廊；34 旗标 | 四路线可玩（routes 44/44）、点名与账本一致（coda 19/19）、危机 68/68、迁移 17/17、超时 14/14、移动 12/12、flow 12/12（http/file://）；文本源 5285/285，单周目 3254–3931 字；真人四路线计时未做（P1） |
| 十一 状态、物资与门板 | 🚧 进行中（2026-11-07，分支 `v1.4-dev`；v1.4.0-dev 未打包/未部署） | 用户反馈 | 4 格/半格物资、状态 0–4、门板三条件、带板 5 + 无板 5 + 坏结局；分支隔离 | 执行卡 + `docs/ending-routes.md` v1.4 设计定稿已落库（T11.0–T11.12、G0–G5、D1–D15、11 结局矩阵）；state-schema/story-bible/计划书/cursor 已同步 v1.4 口径；代码/剧情/存档待迁 |

## 项目结构

```text
./                             # 当前项目根：D:\deepseek harness\新建文件夹
├─ 向北-项目计划书.md          # 唯一权威计划
├─ project/                    # 全部代码与运行资产（用户指令：代码文件统一放这里）
│  ├─ index.html               # 舞台、UI 层、脚本入口
│  ├─ style.css                # 版式、配色、UI 组件、纸纹
│  ├─ engine.js                # 状态机、输入、存档、转场、音频模块
│  ├─ story.js                 # 七章剧情数据、选项、旗标、史实注（由 docs/script 誊写）
│  ├─ art.js                   # 程序化版画/纹理/剪影
│  ├─ assets/
│  │  └─ fonts/                # 仅在授权与体积允许时打包
│  └─ tools/                   # 开发期脚本，不进运行时
│     ├─ count-words.js        # 剧本字数与时长统计
│     └─ check-script.js       # 剧本红线自检（禁用词/真名/选项/结构）
├─ docs/
│  ├─ story-bible.md           # 人物/名册/道具/分幕/五卡/决策记录 D1–D18
│  ├─ sources.md               # 史实锚点表 A1–A7/出处 S1–S15/争议/停用项
│  ├─ codex.md                 # 7 张史实注定稿（游戏内“史实图鉴”）
│  ├─ script/                  # 八章剧本文本源（story.js 的誊写来源；含隐藏 coda）
│  │  ├─ README.md             # 行格式/字数口径/统计表
│  │  └─ 00-prologue.md … 07-coda.md
│  ├─ style-guide.md           # 术语/文风/史实审校
│  ├─ state-schema.md          # 存档 JSON/旗标/迁移（v1.5 已实现；34 旗标，11 顶层键；roster.v1）
│  ├─ audio-system.md          # 9 床/12 cue/五音/生命周期/duck/fx 上限（v1.1.1 小游戏 cue 标历史）
│  ├─ minigame-tuning.md       # v1.1.1 历史数值（v1.2.0-dev 起不适用）
│  ├─ ui-layout.md             # 1280×720 坐标/线框（§3 多选与结算）
│  ├─ test-cases.md            # T01–T51 + C01–C08 验收用例
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

## 当前进度（2026-11-07）

- 项目根目录：`D:\deepseek harness\新建文件夹`（当前工作区；如移动/改名，命令同步改）。
- **本文件是唯一状态源**；`SKILL.md` 不再维护独立状态，只链接到这里。
- Cursor 常驻规则：`.cursor/rules/xiangbei.mdc`（本文件与计划书的摘要，不另存状态；冲突以本文件/计划书为准）。原 `.cursor/rules/000`–`040` 编码规范已合并进同一文件，不再单独维护。
- **代码目录约定（用户指令）**：所有代码/运行文件放 `project/`（index.html、style.css、engine.js、story.js、art.js、assets/、tools/）；docs、step、.claude、.cursor 留在根目录。
- 已有：`向北-项目计划书.md`（唯一权威计划）、`README.md`（交差入口）、`docs/`（story-bible / sources / codex / ending-routes / script×8 / style-guide / state-schema / audio-system / chapter-integration / minigame-tuning / minigame-system / ui-layout / visual-system / visual-reading / test-cases / demo-script / quality-bar / design-note / release-record / credits）、`step/`（step-00 … step-11 执行卡）、`docs/test-record.md`（步骤七实测与有条件交差）、`project/`（四运行时 index/style/engine/story/art + assets/ + CREDITS.txt + tools/ 含 ui-preview.html / ui-preview.js / redlines.js / check-build.js / smoke.js / check-script.js / count-words.js / release.py / _pw-step8.js / _pw-step9.js / _pw-step10.js / _pw-step11.js / design-note.html）、`docs/evidence/step-01|…|step-10/`（浏览器证据与实测记录，gitignored）。
- 步骤零：✅ 完成（2026-11-01）。七章剧本 4108 字 / 229 beat / 12 抉择点 / 26 选项 / 9 限时；口播 A 口径 11:22，整章合计 19:44；7 张史实注（120–220 字，含 4 项争议口径）；红线 10/10；T0.0–T0.9 逐卡记录见 `step/step-00-定题史料与剧本.md` §11.1；tag `step-0-done`。
- 步骤一：✅ 完成（2026-11-01，tag `step-1-done`）。固定 1280×720 舞台等比缩放；title/map/vn 三场景 + 暂停遮罩；`XB.core` 纯状态层 + `XB.engine`；`xiangbei.save.v1` 每 beat 存档、坏档备份 `.bad`/`.bak` 后回标题；序章 p001–p020（20 句逐字）+ p900 临时章末；工具 redlines / check-build（9 项）/ smoke（14 项）；浏览器实测 12 项全绿（Edge 156 + Playwright，file:// 与本地 http）。记录见 `step/step-01-工程骨架.md` §11。
- 步骤二：✅ 完成（2026-11-01，tag `step-2-done`）。`style.css` 重写为令牌层（:root 五色 + 派生 + 字号/间距/z-index/动效/--paper-texture，组件只写 var()）；`art.js` 四场景程序化版画（title / map / yudu_river / yudu_night，FNV-1a→mulberry32 定种，DPR 上限 2，paint 0.04–0.18ms）；单画布 `#stage-art` 取代 `.vn-bg`，engine 接入 paintStage + 失败隐藏画布 + 一次性 toast；标题 96px + 朱砂印章「北」+ 门板刻痕；10 类 `xb-*` 组件壳（btn / dialog / choice / title-card / codex / ending / pause / settings / hud / feedback）+ `project/tools/ui-preview.html` 预览页；`?fonts=fallback` 回退开关。修复两处实测 bug：手机横屏改用 `clientWidth`（innerWidth 被 shrink-to-fit 放大到 1062）与 ?debug 画布尺寸过期（updateDebug 移入 resize rAF 回调）。check-build 12/12、smoke 17/17、check-script OK；浏览器 B1–B14 全绿、0 console error；记录见 `step/step-02-视觉系统.md` §11 与 `docs/evidence/step-02/run-log.md`。
- 步骤三：✅ 完成（2026-11-01，tag `step-3-done`）。`engine.js` 重写为「扁平条件节点图 + 打字机阅读层」：`XB.core` 去 stack，改 `locate / currentNode / currentChapter / evalWhen / isVisible / firstVisible / nextVisible / startChapter / advance`，新增 `setFlag`（白名单 + 夹取 + `inventory.door` 镜像）、`applySet`、`applyChoice`（写 `record` 旗标 + 追加 `{chapter,nodeId,option,text,timedOut}` 日志）、`codexById`；`normalize` 坏档整体回默认并给 issue、`flags` 合默认夹取、`choices` 只留 64 条、`codex` 过滤为已知 7 个 id。`XB.engine` 加打字机（rAF 累计 + 二分分页量具 1108×66，`--text-scale` 1/1.15/1.3）、限时选项（rAF 倒计时、暂停不偷时间、超时按 `defaultOption` 结算并落档 + toast）、标题卡两用（入口卡 1200ms + p043 authored）、史实注弹窗（7 张内联 + 解锁落档 + 焦点陷阱）、自动/跳过（skip 只对已读）、暂停 + 六项设置、`?debug` 面板。`story.js` 补序章 48 节点（41 line / 2 choice / 1 minigame seam / 1 result / 1 title / 1 codex / 1 end）与 7 张图鉴；`index.html` / `style.css` 加阅读层九容器。实测修掉四个真 bug：`currentNode()` 漏传 state（7 处）、标题卡同一次点击被关两次致首句被瞬间补全、地图用 `playable` 判锁致已解锁章节点不动、选项缺键盘 1/2。check-build 17/17、smoke 26/26、check-script OK；浏览器 B1–B18 全绿、四路径 41/41 line 与 48/48 节点全覆盖、四个负例均报红；记录见 `step/step-03-VN引擎.md` §11 与 `docs/evidence/step-03/run-log.md`。
- 步骤四：✅ 完成（2026-11-02，tag `step-4-done`）。`project/minigames.js` 从 4 行空壳扩为共享限时分配引擎 + 四关：`start/stop/isActive/resize`、rAF 循环（dt≤50ms）、暂停冻结、pointer capture + 8px tap slop、1–8/Shift/Enter/Space 键盘、500ms live 节流、结果对象 `{gameId,reason,elapsed,carried,left,stats}`（无 success/score）。门板 6 格/门板 2 格/5 件可选物；弃物 2 批×3/追兵 45s/重物 −8s；渡船 6 船×3 船工/18 趟/疲劳 12 每腿/休息 −12/soft 80 +4s；攀索 22 灯/3 段/1.8s 步/0.35s 窗/6·12·18 火墙。`engine.js` 接 `?minigame=door|abandon|boat|climb`、p024→p025 动态两栏、结果按 flags/inventory 重建、solo 不写档、go/start 先 stop、输入守卫。实测：p024 刷新重开、p025 刷新重建；带/不带门板两路径；844×390 触摸、1366/1280/DPR2；键盘/Esc/焦点/ARIA；Edge B19–B30 全部有结果（B25 例外）、0 console error、file:// 与本地 http 可玩。check-build 23/23、smoke 33/33、四负例报红（N1 duration120→C22、N2 success→C19、N3 删 canvas→C03、N4 lights 字符串→C21）。记录见 `step/step-04-核心小游戏.md` §11 与 `docs/evidence/step-04/run-log.md`。
- 步骤五：✅ 完成（2026-11-02，tag `step-5-done`）。七章全部接入（277 节点 / 232 line / 13 choice / 4 minigame / 6 result / 6 title / 7 codex / 2 interact / 7 end）；`story.ending` 五卡 + `engine` 的 ending 场景、`buildEnding`、ending normalize；吴起点名 7 名/45s、金沙江记名、遵义错误卡、7 张图鉴三入口、章末记忆、`?chapter=&node=`；`art.js` 16 场景；`index/style` 加 ending/点名/图鉴。工具：check-build 30/30、smoke 40/40、check-script 通过、`_pw-extra` 49/49、`_pw-mobile-http` 14/14、四负例报红。Edge B31–B43 全绿、B44 部分（真人 20 分钟计时留步骤七）；0 console error；file:// 与 http、844×390 触摸、图鉴 0/7→7/7、全答/漏答、五卡全亮/全灰、刷新/继续均实测。修 x025a C 后掉回 x025b 的分支 bug（x025b when 加 `!choice.xiangjiang.hold`）与 p039 门板分支；docs 已同步。记录见 `step/step-05-章节接入.md` §11 与 `docs/evidence/step-05/run-log.md`。
- 步骤六：✅ 完成（2026-11-02，tag `step-6-done`）。`engine.js` 内联 `XB.audio`：9 床 / 17 场景映射 / 12 cue / 原创五音动机 D4–F4–G4–A4–C5；三总线 → compressor → master，800ms 交叉、activeBeds≤2、100ms cue 节流、暂停 duck 0.3 / 图鉴 0.45、hidden suspend / visible resume；`XB.audio.unlock()` 只在首次 pointerdown/keydown 创建 AudioContext，无音频文件。`XB.fx` + `#fx-layer`：480ms 墨色横擦、120ms/0.12 闪白（2s 冷却）、180ms/2px 震动、ending 只划 is-missed 的 420ms 墨线（90ms 错峰，同局一次）；系统与设置双入口 reduced。工具：check-build 36/36、smoke 46/46、check-script OK、N5–N12 全红。Edge B45–B56 79/79、0 console error、0 pageerror；file:// 与 http、844×390 触摸、9 床映射、静音/音量刷新保留均实测。记录见 `step/step-06-音频与动效.md` §11 与 `docs/evidence/step-06/run-log.md`。
- 步骤七：✅ 完成（2026-11-02，tag `step-7-done`）。机器项：`docs/test-record.md` 已建；Edge 156 headless/file+http 全流程（190.75s/407 line）与 844×390 全流程（200.9s/406 line，tap）通过；四关正常+失败路径、图鉴三入口、隐私降级、断网 ZIP、音频 API/9 床/12 cue、键盘/焦点、三档分辨率均通过；check-build 36/36、smoke 46/46、check-script OK；S2-01/02/04（移动暂停 52×52 CSS px、ending 字号、五卡可达）已修复；S3-03 限时选择翻倍（8→16/10→20/6→12）已改，p021 16.3s、x025b 20.3s 超时实测通过，限时翻倍后 Edge 全流程 190.7s/407 line 通过。T20 已通过：A 8:33/B 6:42/C 7:36/D 4:52（A/B 翻倍前，C/D 版本未注明，按 +74s 上限仍 ≤9:47）。T47：3 人联合访谈、代表提交，5 问已回收（三人均玩游戏，无法确认“不常玩/非重度”；2026-11-02 用户明确接受 P0 例外，X8 收口）。T51：首轮 3/5，修文后复读两问均正确，T51 PASS，X9 关闭。T39 Chrome、T40 Safari 为 P0 环境例外，2026-11-02 用户明确接受。结论“有条件交差”（P0 例外经用户接受；P1 例外见 docs/test-record.md §11），已提交并 tag `step-7-done`，未部署。
- 步骤八：✅ 完成（2026-11-03，tag `step-8-done`）。全部署名刘子政；**不打包字体**（官方源不可达，系统回退，字体 0 字节）；**演示视频取消**，不列为缺口。**GitHub Pages 已上线**：https://nanxiangzizui.github.io/xiangbei/ （仓库 `nanxiangzizui/xiangbei`，`main` / root；部署提交 `7dbe2b48ff43da6be191d3b521e638540291f306`；2026-11-03 12:54 +08:00）。交付物：`dist/site` 8 文件 / 672,029 B；`dist/xiangbei-v1.0.0-offline.zip` 10 条目 / 375,948 B；`dist/design-note.pdf` 1 页 / 291,464 B；`project/CREDITS.txt` 2,025 B；`dist/SHA256SUMS.txt` 19 行；`project/tools/release.py` 可复现 stage/zip/verify/hash。检查：check-build 38/38、smoke 46/46、check-script OK；发布站点 http 完整流程 191.1s/407 line、离线 ZIP file:// 191.1s/408 line、全用例 96/96、发布专项桌面/移动各 22/22；fps 桌面 60/60、移动 60/48.7（最低 29.9，X11）；制作名单移动物理热区 41.2×24.4（X12）；公网 live smoke 16/16、8/8 文件哈希一致（engine/style 按 LF 规范化）。移动四关沿用步骤七 200.9s/406 line，发布包未逐关重跑。Cloudflare OAuth 三次超时，未部署，不写成已部署。见 `docs/release-record.md`、`docs/evidence/step-08/run-log.md`。
- 八·五 素材增强：✅ 完成（2026-11-04，v1.1.0，已部署）。12 张 1920×1080 版画化场景/地图底图（含湘江地图标题卡）+ 1 张豆包 Seedream 生成的标题插画（虚构红军小战士/于都河，非史料人物/现场）；OFL 子集随包（得意黑大标题 158 KB + 朱雀仿宋正文/章节/图鉴 394 KB）；5 条 CC0 环境循环 + 8 首 CC0/CC-BY 现代配乐（HTMLAudioElement → MediaElementSource，保留合成床与五音动机）；`art.js` 懒加载 + 程序化回退。站点 47 文件 / 27,888,240 B，ZIP 49 条目 / 27,347,934 B；2026-11-04 部署 `f8b2045`，公网关键文件 HTTP 200 + SHA256 8/8。素材授权与 caveat 见 `project/CREDITS.txt`、`docs/credits.md`、`resource/README.md`。
- 八·六 阅读与演出增强：✅ 完成（2026-11-04，v1.1.0，已部署）。照片章首卡（6 个 title 节点配 `bg` + 日期/地点；湘江地图卡沿用 `xiangjiang_map`）、7 张图鉴缩略图 + 照片年代说明、照片 28s 缓慢推拉 + `preload`、总音量/配乐/环境音三个独立滑块、file:// 直连 1.4s 淡入淡出、暂停菜单花名册（点名前「在册」，点名后显示应/未应/替答）。专项 Edge http 21/21，file:// 标题/字体/图无错；http 201.585s / 405 line、file:// 197.639s / 406 line、844×390 207.978s / 405 line，均 5 卡 / 7 名 / 0 划名、0 错误；四关 20/20；六张章节卡 6/6；移动阅读层 7 缩略图 / 花名册可见；2026-11-04 部署 `f8b2045`。
- 已知风险：v1.3.0-dev 文本源 5285 字 / 285 beat，单周目 3254–3931 字（B 13:59–16:54，加选择约 17–19:30），20 分钟为文本估算通过，真人四路线计时未做（P1）；13 个限时项（三次危机 12/16/12s，默认“不救/抱板走”）的最坏等待未重算。裁剪顺序仍按红线 13（草地 → 金沙江 → 遵义改纯对话）。终章 1004 字（含点名/空页分支）仍高于 §5.6.3 的 660 字预算，先保留，真人超时再裁。
- 已知欠账：①真人外读已做（1 人，2026-11-02）：首轮 3/5，错误卡/点名 2 问不清；修文后同读者复读两问均正确，T51 PASS，X9 关闭；2026-11-01 的 AI 替代记录在 step-00 §11.4，不再算数；②本机默认沙箱下 pwsh 子进程初始化失败（0xC0000142），步骤七测试均在 `danger-full-access` 下完成；默认策略下仍不可执行，仅记环境事实；③浏览器：仅 Edge headless（含移动模拟 + touch）；Chrome/Safari 为 P0 环境例外，经用户 2026-11-02 接受；真机触摸未验；20 分钟计时 A–D 通过；隐私模式与断网 ZIP 通过；④字体：v1.0.0 本机未安装得意黑/霞鹜文楷，系统回退（字体 0 字节）；v1.1.0 已随包 OFL 子集（约 552 KB），本机字体缺失不再影响正文字形；⑤file:// localStorage 在 Edge 可用；隐私模式降级已测（提示“本局无法存档”，可继续）；⑥已修：844×390 ending 字号 ≥14 CSS px、面板可滚且五卡可达（S2-02/04）；⑦自动/跳过用本会话已读集合，刷新后归零（设计如此，不写档）；⑧已修：手机横屏暂停改 96 逻辑≈52 CSS px（S2-01）；⑨音频主观听感未验收——B49 headless 峰值采样为 0（只证明 <0.99），真机/耳机试听、真实切后台（B48 用 `document.hidden` 属性模拟）、真机首次手势与锁屏（B54 为移动模拟）仍作为 P1 例外保留；B50 转场与 B53 划名未录屏。
- 八·七 慢网与竖屏适配：✅ 完成（2026-11-05，v1.1.1，已部署 `88771d3`）。底图改为 480×270 WebP 占位先出、1600×900 WebP 随后替换、1920 JPEG 兜底；`index.html` 预加载标题占位图；竖屏遮罩增加“若转屏无反应，用系统浏览器打开”的提示。`art.js` 定向测试 7 个场景全部到达 `is-photo`，占位图约 32ms、大图约 5s（人为延迟 5s）；390×844 显示竖屏提示、844×390 进入舞台；file:// 标题与字体正常；0 console error / 0 failed request。check-build 38/38、smoke 46/46。公网标题页 1.74s 可交互、占位图 1.75s、全图 3.28s；7/7 关键文件哈希一致；site 73 文件 / 31,356,254 B、ZIP 75 条目 / 30,818,357 B、PDF 303,713 B。未重跑 200s 全流程/公网四关/96 用例。
- 八·八 Netlify 主站：✅ 完成（2026-11-05，v1.1.1）。用户反馈 GitHub Pages 慢后，把 `dist/site` 73 文件静态直传 Netlify；匿名部署生成可认领站点，用户用 GitHub 登录认领并命名 `xiangbei`，无密码公开。公网 https://xiangbei.netlify.app/ 标题约 2.0s 出 480 占位图，开始→序章文本正确，0 console error / 0 404；Netlify 在 `index.html` 注入约 326 B 注释（14,326 B vs 本地 14,000 B），其他关键文件同包。GitHub Pages https://nanxiangzizui.github.io/xiangbei/ 保留备用。未在 Netlify 重跑完整流程/四关/移动/96 用例，不能写成“公网完整流程通过”。
- 九 移除小游戏与选择回写：✅ 完成（2026-11-06，tag `step-9-done`，v1.2.0-dev 本地完成，未打包/未部署）。四关与小游戏层全部删除（`project/minigames.js`、`?minigame=`、画布/HUD/暂停入口、solo 运行态、`XB.minigames` 引用）；新增 `multichoice` 类型与 `#vn-multichoice` 组件（整卡 `role=checkbox`、数字键 1–9、Enter 确认、Esc 暂停、确认后 300ms 锁定）。序章行囊（5 件选 3，门板占 2 格）、湘江弃物（6 件带 3，`choice.xiangjiang.abandoned` 记留在岸上）、金沙江先渡谁（j024 + 镜像布尔回写）、泸定门板/记名保留；五件行囊与六件弃物均有即时 + 后续回写，结局五卡与点名未破坏。旧档 `j010/j011→j012`、`l013/l014→l015` 迁移并 toast，`inventory.items` 反推 `item.*`、`abandoned` 反推 `take.*`；键名仍 `xiangbei.save.v1`，顶层 11 键。实测：check-build 37/37、smoke 46/46、check-script OK；target 34/34、segments 19/19、migration 19/19；http 完整流程 14/14（71s/432 line（flow.lines 对话推进计数））、file:// 14/14（72s）、844×390 移动 17/17（78s）；2 个多选 + 11 个单选、5 卡/7 名、0 console error/pageerror/请求失败。移动多选确认按钮 51.99 CSS px、选项 44.42 CSS px。证据 `docs/evidence/step-09/`；未重打包 `dist/`，线上 Netlify/GitHub Pages 仍为 v1.1.1 四关版。tag `pre-minigame-removal` 实际指向 `8beb09a`（文档曾记 `359b320`，代码同为 v1.1.1，不影响回滚）。
- 十 人物命运多结局：✅ 完成（2026-11-06，tag `step-10-done`，v1.3.0-dev 本地完成，未打包/未部署）。引擎加 34 旗标与 strain 派生、选项 requires/maxWhen、结局路线 buildEnding、点名 resolveRollCall（7/8 名）、hidden coda、旧档迁移、名册回廊 `xiangbei.roster.v1`；剧情加三次危机（l019/l019x、g018x、g026x）、草地倒下段、吴起守卫与 coda c001–c012；剧本源 5285 字/285 beat，单周目 3254–3931 字（B 13:59–16:54）。实测 http routes 44/44、coda 19/19、crises 68/68、migration 17/17、maxwhen 15/15、timeout 14/14、mobile 12/12、flow 12/12（66s）；file:// flow 12/12、routes 44/44、crises 68/68、coda 19/19；0 console error/pageerror/失败请求。check-build 39/39、smoke 46/46、check-script OK。证据 `docs/evidence/step-10/`。线上 Netlify/GitHub Pages 仍为 v1.1.1 四关版；dist 未重打包。真人四路线计时与隐私模式重跑为 P1。
- 十一 状态、物资与门板：🚧 进行中（2026-11-07，分支 `v1.4-dev`）。已从 `main` 的 `8fd0d9f` / tag `step-10-done` 切出 `v1.4-dev`；执行卡 `step/step-11-状态物资与门板.md` 已写（约 38KB，14 节，T11.0–T11.12、G0–G5、D1–D15、11 结局矩阵）；`docs/ending-routes.md` 已重写为 v1.4 设计定稿（11 结局、状态 0–4、4 格半格物资、配方、门板 A/B/C、save v2 迁移、剧情/UI/测试），state-schema/story-bible/计划书/cursor 已加 v1.4 口径。代码/剧情/存档仍未迁移；`main` 仍保留 v1.3。
- 建议下一步：T11.0 设计口径已完成；按 `step/step-11-状态物资与门板.md` 执行 T11.1（引擎数据/存档 v2）→T11.2 物资→T11.3 状态→T11.4 结局→T11.5 UI→T11.6–10 剧情→T11.11 迁移/名册→T11.12 测试/文档/tag。v1.4 不合并 `main`、不打包、不部署；线上 Netlify/GitHub Pages 仍为 v1.1.1。

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
8. 不把牺牲做成分数；选择只改变代价，不做“完美通关”评分。
9. 敌人不脸谱化。

### 玩法

10. 每章 60–90 秒；没有 Game Over；选择不重开，只改变代价。
11. 历史终点单一（湘江败、遵义开、泸定夺、到吴起不可改）；人物命运四路线（v1.3.0-dev：四道划痕/门板/桥板·石墙/空页），没有全活；不做好感度、攻略角色、真结局、结局完成度百分比、分支存档树；不做战斗、养成、“打鬼子”关卡、排行榜、多人。
12. 选项是道德取舍，不设“明显正确”的答案；限时选项超时按默认项结算并记录代价（三次危机默认“不救”，犹豫也是代价）。
13. 20 分钟是硬验收；超时先裁草地，再裁金沙江，最后把遵义改成纯对话；保留序章/湘江/泸定/点名。

### 技术

14. 剧情内联；不用 `fetch`/XHR/ES module；经典 `<script>` + 全局命名空间，保证 `file://` 离线 ZIP 可玩。
15. Canvas 按 `devicePixelRatio` 放大；触摸坐标用 `getBoundingClientRect()` 换算；热区不小于 44px。
16. `localStorage` 加版本号并用 try/catch；版本不匹配时迁移或提示重置，不能白屏。
17. `AudioContext` 在首次用户点击后创建/恢复；静音与音量持久化。
18. 字体使用前核对授权；加载失败回退系统宋体；不把未授权字体打进 ZIP。
19. 所有资源用相对路径（`./`），兼容 GitHub Pages 子路径与 `file://`；不依赖任何 CDN。
20. 16:9 横屏为基准；手机竖屏给出“请横屏”提示；选择段落/多选单手可完成。

### 范围与交付

21. 文本量是最大成本；先写三场重头戏，再补其他章；不要平均用力。
22. v1.0–v1.1 的四关共用一套“限时分配”引擎；v1.2.0 删除四关，改为行囊/弃物两段多选 + 金沙江/泸定两段单选；v1.3.0 再加三次救人危机，全部复用现有单选/多选组件，不另写状态机。
23. 交差材料：链接 + ZIP + 一页设计说明（史实出处表 + 精神对照表 + 操作说明）+ 3 分钟演示 + 制作名单/字体授权。
24. 验收底线（v1.3.0-dev）：20 分钟内通关；至少 4 段可玩选择（行囊多选、弃物多选、金沙江先渡谁、泸定门板/记名）加三次救人危机；四条人物命运路线各通关一次，点名与路线账本一致；7 张史实注；结局有“点名 + 数字 + 五张精神卡”；手机横屏可玩；断网 ZIP 可玩。

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
node --check project/art.js
node project/tools/check-build.js
node project/tools/smoke.js
node project/tools/check-script.js docs/script

# 部署：当前 GitHub Pages 从 nanxiangzizui/xiangbei 的 main/root 自动发布；
# 更新 dist/site 与 .nojekyll 后 push main 即可。Cloudflare Pages 为备选（OAuth 未完成）。
# 不要把 token/密钥写进仓库；临时 PAT 用完即删并撤销。
```

## 验收底线

| 项 | 底线 | 验证方式 |
|---|---|---|
| 时长 | ≤ 20 分钟 | 从标题到点名完整计时，至少 3 次 |
| 选择段落 | ≥ 4 段可玩 + 三次危机 | 行囊多选、弃物多选、先渡谁、门板/记名、飞毛腿/灶王/冬生；键盘/触摸/刷新 |
| 人物命运 | 四路线各通关一次 | 四道划痕/门板/桥板·石墙/空页；点名与账本一致；没有全活 |
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
