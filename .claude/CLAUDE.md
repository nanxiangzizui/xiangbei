# 《向北》项目（网页互动叙事游戏）

## 项目概述

《向北》——一块门板，两万五千里。

玩家扮演长征途中红一方面军某连的 16 岁文书，背着一块从于都老家门上锯下的木板，从于都走到吴起；通过对话、取舍和 4 段核心选择（行囊、弃物、先渡谁、门板/记名），决定带什么、救谁、记住谁，以及最后是谁走到吴起；在 20 分钟内走完长征。

- 形态：视觉小说 + 限时抉择 + 多选取舍（v1.4.0-dev）；11 条人物结局，历史终点不分支
- 七段结构：序章·于都 → 第一章·湘江 → 第二章·遵义 → 第三章·金沙江 → 第四章·泸定 → 第五章·草地 → 终章·吴起·点名
- 主题落点：理想信念、不怕牺牲、独立自主实事求是、顾全大局严守纪律、依靠人民艰苦奋斗——每条精神对应一个可操作机制，不做口号式说教
- 体验底线：20 分钟通关；每关 60–90 秒；没有 Game Over，失败只改变代价；历史终点单一，人物命运 11 条结局（v1.4.0-dev：带板 5 + 无板 5 + 坏结局），没有全活；不做好感度/攻略角色/真结局/结局百分比/分支存档树
- 评审注意力：最好的文本与演出放在前 5 分钟与最后 2 分钟；“史实图鉴”和“结局五卡”放在显眼位置

> **v1.2.0-dev 口径（2026-11-06，已实现，未打包/未部署）**：移除四关小游戏（门板/弃物/渡船/攀索），改为 4 段选择——序章行囊多选、湘江弃物多选、金沙江先渡谁、泸定门板/记名；核心剧情、史实、7 张图鉴、五张精神卡、点名结局不变。当前线上 v1.1.1 仍为四关，`dist/` 未重打包；执行与实测见 `step/step-09-移除小游戏与选择回写.md`、`docs/evidence/step-09/`。
>
> **v1.3.0-dev 口径（2026-11-06，已实现，未打包/未部署）**：历史终点与七章不变；加三次救人危机（泸定飞毛腿、草地灶王、草地尽头冬生），按“救人数 / 门板 / 你是否倒下”收束为四路线：四道划痕（救 0、死 4）、门板（救 1、死 3、板到吴起）、桥板·石墙（救 1–2、死 3、无板；救 2 时林先生死）、空页（救 3、你死在草地、冬生背名册到吴起、满崽由冬生答）。没有全活；救越多自己越近死亡。设计、账本、节点、测试见 `docs/ending-routes.md`；执行卡见 `step/step-10-人物命运四路线.md`；证据见 `docs/evidence/step-10/`。
>
> **v1.4.0-dev 口径（2026-11-07，已实现，未打包/未部署）**：在 `v1.4-dev` 分支隔离开发，`main` 保留 v1.3 / tag `step-10-done`。行囊 4 格（8 个半格：药/青稞 0.5、鞋 1、锅/雨布/门板 2）；状态 0–4（优秀/良好/勉强/差/死）、`rescues`、`condition`、门板去向 `doorOutcome`；带板 5 + 无板 5 + 坏结局共 11 条，林先生只在我死时死；存档 `xiangbei.save.v2` 保留 v1 迁移。执行卡与实测见 `step/step-11-状态物资与门板.md`、`docs/evidence/step-11-*`。

## 技术栈（按步骤）

### 共用基础（全步骤）

- 语言/运行时：原生 HTML5 + CSS3 + JavaScript（ES6）；不使用前端框架、不使用构建链
- 渲染：DOM/CSS 负责 UI 与文字，Canvas 2D 负责程序化背景；v1.1.1 的小游戏画布随 v1.2.0 删除；固定 1280×720 舞台等比缩放，Canvas 按 `devicePixelRatio` 放大
- 部署：纯静态站点，GitHub Pages 托管（本版已上线；Cloudflare Pages 备选）；无后端、无数据库、无登录
- 存档：`localStorage`；v1.6 起唯一键 `xiangbei.saves.v1`（列表，单档仍是 v2 11 键，20 档/512KB），旧 `xiangbei.save.v2/v1` 首次启动迁移；进入游戏只到标题，读档走“存档”面板；读写用 try/catch，隐私模式下降级提示
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
| 十一 状态、物资与门板 | ✅ 完成（2026-11-07，tag `step-11-done`，分支 `v1.4-dev`；v1.4.0-dev 未打包/未部署；同日补修扣物资 T11-16、警告/援助/加戏 T11-17…19、双击禁选 T11-20、湘江条件代价 T11-21、草地分粮回赠 T11-18 扩充、状态变化提示 T11-22、置灰选项与牺牲提示 T11-23/24；2026-11-09 门板 hotfix T11-25：湘江 C 写 bridge、草地不再舍弃、桥板+死走 11/11、旧中途档修复；check-build 48/48、smoke 47/47、门板回归 16/16） | 用户反馈 | 4 格/半格物资、状态 0–4、门板三条件、带板 5 + 无板 5 + 坏结局、save v2 + v1 迁移 | 11 条人物结局各一次（routes 123/123）；crises 157/157（http/file，含扣物资/旧档修复/分粮回赠/状态提示/置灰/牺牲）、xiangjiang 35/35（条件扣粮）、coda 20/20、pack 26/26、migration 21/21、refresh 16/16、mobile 18/18（844×390，含状态提示与物资关闭 44.4）、flow http/file 各 12/12（171s）；check-build 39/39、smoke 46/46、check-script 9 剧本 OK；0 console/pageerror/失败请求；真人 11 路线计时与隐私模式 P1 |
| 十二 剧情分支与结局收纳 | ✅ 完成（2026-11-08，v1.5.0-dev；已提交（tag `step-14-done`）/未打包/未部署） | 用户反馈 | 标题/结局/暂停三入口；固定 1280×720 深墨蓝歧路图；7 章缩略卡 + 11 结局灰锁；19 决策组/22 结构节点详情；独立键 xiangbei.branches.v1；结算先记录后清 choices | 空态 0/11、暂停实时、结算落档、11 路线收纳；http 98/98、移动 24/24、file empty 15/15 与 ending 21/21；完整实走 173s 路线 2/11 且 runs=1；check-build 40/40、smoke 47/47、check-script OK；0 console error；执行卡 step/step-12-剧情分支与结局收纳.md |
| 十三 剧本扩写与关系加深 | ✅ 完成文本与主流程（2026-11-08，v1.5.0-dev；已提交（tag `step-14-done`）/未打包/未部署；20 分钟验收按用户要求挂起；11 路线/真人计时待回归） | 用户反馈（m00001） | 湘江/泸定加战火与敌军群像、战士倒下；四角色与“我”的日常对话；四角色彼此的革命情谊；新增 366 个 line 节点，文本源 11278 字/705 beat/766 节点 | check-build 40/40、smoke 47/47、check-script OK；http 完整流程 14/14、360s/614 line、路线 2/11、点名 7、五卡 5、0 error；证据 docs/evidence/text-expand；真人计时/11 路线/移动/隐私未重跑 |
| 十四 成就系统 | ✅ 完成实现与主流程（2026-11-08，v1.5.1-dev；已提交（tag `step-14-done`）/未打包/未部署） | 用户反馈（m00001/m00188） | 48 条选择成就（46 choice + 记名 2）；标题/暂停/结局三入口；灰框锁定；详情原因；结局「此周目解锁的成就有：」；独立键 xiangbei.achievements.v1；ending 快照加 achievements | check-build 41/41、smoke 47/47、check-script 9 文件 OK；http 55/55、file:// 55/55、844×390 移动 11/11；0 console/pageerror/失败请求；执行卡 step/step-14-成就系统.md；证据 docs/evidence/step-14、step-14-file |
| 十五 存档与读档 | ✅ 完成（2026-11-08，v1.6.0-dev；未打包/未部署） | 用户反馈（m00001；三点 m00117） | 存档列表 xiangbei.saves.v1（20 档/512KB）；标题唯一入口“存档”；开启新档/上次玩到/删除选中；已完结整页结局回顾；只在章末/暂停保存/开新档落档（中途退出读档回本章开头）；初始化清存档/分支/成就/名册但保留设置 | check-build 48/48（本步 C43–C48；C49 属步骤十六）、smoke 47/47、check-script 9 文件 OK；http 88/88、迁移 8/8、隐私 4/4、移动 9/9、file:// 88/88；章末保存后顶部 3.5 秒“已自动存档”；0 console error/失败请求；执行卡 step/step-15-存档与读档.md；证据 docs/evidence/step-15 |
| 十六 剧情回顾 | ✅ 完成（2026-11-08，v1.7.0-dev；已打包并部署 GitHub Pages 与 Netlify，2026-11-09） | 用户需求（m00001；取舍 m00160） | VN 右上“回顾”入口（暂停下方）；全屏近黑两栏只读层；章节分隔；所有单选/多选/记名金色粗体 `➤`；超时标默认项；独立键 xiangbei.history.v1（按槽隔离/800 条/24 桶/checkpoint）；打开冻结计时与打字机；X/Esc 关闭；全局不可选中、回顾固定字号 | check-build 48/48（C49）、smoke 47/47、check-script 9 文件 OK；http 56/56、file 56/56、移动 11/11、隐私 5/5（合计 128/128）；0 pageerror/失败请求；执行卡 step/step-16-剧情回顾.md；证据 docs/evidence/step-16 |
| 十七 行囊未满确认 | ✅ 完成（2026-11-09，v1.7.1-dev；已打包并部署 GitHub Pages 与 Netlify，2026-11-09） | 用户反馈（m00001） | p024“系好行囊”时行囊未满（含空行囊）→ `#bag-confirm-modal` 二选一：“是”按原流程结算继续，“否”回多选且保留已选；`confirmWhenNotFull` + `commitMultiChoice` 唯一结算出口；Esc=否、遮罩挡点击、Tab 锁两键、duck 0.45、移动 82 逻辑热区 | check-build 49/49（C50）、smoke 47/47、check-script 9 文件 OK；http 58/58、file 58/58、移动 15/15（热区 44.4 CSS）；0 console error/失败请求；执行卡 step/step-17-行囊未满确认.md；证据 docs/evidence/step-17 |

## 项目结构

```text
./                             # 当前项目根：D:\deepseek harness\新建文件夹
├─ 向北-项目计划书.md          # 唯一权威计划
├─ project/                    # 全部代码与运行资产（用户指令：代码文件统一放这里）
│  ├─ index.html               # 舞台、UI 层、脚本入口
│  ├─ style.css                # 版式、配色、UI 组件、纸纹
│  ├─ engine.js                # 状态机、输入、存档、转场、音频模块
│  ├─ story.js                 # 九章剧情数据（含隐藏 coda/badend）、选项、旗标、史实注（由 docs/script 誊写）
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
│  ├─ script/                  # 九章剧本文本源（story.js 的誊写来源；含隐藏 coda/badend）
│  │  ├─ README.md             # 行格式/字数口径/统计表
│  │  └─ 00-prologue.md … 08-badend.md
│  ├─ style-guide.md           # 术语/文风/史实审校
│  ├─ branch-map.md            # v1.5 剧情分支歧路图/收纳契约/19 决策组
│  ├─ achievements.md          # 48 条选择成就/描述模板/存档/UI/测试
│  ├─ state-schema.md          # 存档 JSON/旗标/迁移（v1.6 列表 xiangbei.saves.v1；单档 v2 11 键；旧键迁移；roster/branches/achievements/history 独立）
│  ├─ audio-system.md          # 9 床/12 cue/五音/生命周期/duck/fx 上限（v1.1.1 小游戏 cue 标历史）
│  ├─ minigame-tuning.md       # v1.1.1 历史数值（v1.2.0-dev 起不适用）
│  ├─ ui-layout.md             # 1280×720 坐标/线框（§3 多选与结算）
│  ├─ test-cases.md            # T01–T51 + C01–C08 + T11-01…T11-25 + T12-01…T12-10 + T14-01…T14-10 + T15-01…T15-15 + T16-01…T16-10 + T17-01…T17-08 验收用例
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

## 当前进度（2026-11-09）

- 项目根目录：`D:\deepseek harness\新建文件夹`（当前工作区；如移动/改名，命令同步改）。
- **本文件是唯一状态源**；`SKILL.md` 不再维护独立状态，只链接到这里。
- Cursor 常驻规则：`.cursor/rules/xiangbei.mdc`（本文件与计划书的摘要，不另存状态；冲突以本文件/计划书为准）。原 `.cursor/rules/000`–`040` 编码规范已合并进同一文件，不再单独维护。
- **代码目录约定（用户指令）**：所有代码/运行文件放 `project/`（index.html、style.css、engine.js、story.js、art.js、assets/、tools/）；docs、step、.claude、.cursor 留在根目录。
- 已有：`向北-项目计划书.md`（唯一权威计划）、`README.md`（交差入口）、`docs/`（story-bible / sources / codex / ending-routes / script×9 / style-guide / state-schema / audio-system / chapter-integration / minigame-tuning / minigame-system / ui-layout / visual-system / visual-reading / test-cases / demo-script / quality-bar / design-note / release-record / credits / achievements）、`step/`（step-00 … step-17 执行卡）、`docs/test-record.md`（步骤七实测与有条件交差）、`project/`（四运行时 index/style/engine/story/art + assets/ + CREDITS.txt + tools/ 含 ui-preview.html / ui-preview.js / redlines.js / check-build.js / smoke.js / check-script.js / count-words.js / release.py / _pw-step8.js / _pw-step9.js / _pw-step10.js / _pw-step11.js / _pw-step12.js / _pw-step14.js / _pw-step15.js / _pw-step16.js / _pw-step17.js / design-note.html）、`docs/evidence/step-01|…|step-17/`（浏览器证据与实测记录，gitignored）。
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
- 已知风险：v1.5.0-dev 文本源已扩到 11278 字 / 705 beat（766 节点 / 712 line），单周目约 8–10k 字；2026-11-08 用户明确要求本轮先不考虑时长，20 分钟硬验收挂起，真人 11 结局计时未做（P1）；13 个限时项（三次危机 12/16/12s，默认项：飞毛腿抱板走、无板继续走、灶王/冬生不救）的最坏等待未重算。裁剪顺序仍按红线 13（草地 → 金沙江 → 遵义改纯对话）。终章 1410 字（含点名/空页分支）仍高于 §5.6.3 的 660 字预算，先保留，真人超时再裁。
- 已知欠账：①真人外读已做（1 人，2026-11-02）：首轮 3/5，错误卡/点名 2 问不清；修文后同读者复读两问均正确，T51 PASS，X9 关闭；2026-11-01 的 AI 替代记录在 step-00 §11.4，不再算数；②本机默认沙箱下 pwsh 子进程初始化失败（0xC0000142），步骤七测试均在 `danger-full-access` 下完成；默认策略下仍不可执行，仅记环境事实；③浏览器：仅 Edge headless（含移动模拟 + touch）；Chrome/Safari 为 P0 环境例外，经用户 2026-11-02 接受；真机触摸未验；20 分钟计时 A–D 通过；隐私模式与断网 ZIP 通过；④字体：v1.0.0 本机未安装得意黑/霞鹜文楷，系统回退（字体 0 字节）；v1.1.0 已随包 OFL 子集（约 552 KB），本机字体缺失不再影响正文字形；⑤file:// localStorage 在 Edge 可用；隐私模式降级已测（提示“本局无法存档”，可继续）；⑥已修：844×390 ending 字号 ≥14 CSS px、面板可滚且五卡可达（S2-02/04）；⑦自动/跳过用本会话已读集合，刷新后归零（设计如此，不写档）；⑧已修：手机横屏暂停改 96 逻辑≈52 CSS px（S2-01）；⑨音频主观听感未验收——B49 headless 峰值采样为 0（只证明 <0.99），真机/耳机试听、真实切后台（B48 用 `document.hidden` 属性模拟）、真机首次手势与锁屏（B54 为移动模拟）仍作为 P1 例外保留；B50 转场与 B53 划名未录屏。
- 八·七 慢网与竖屏适配：✅ 完成（2026-11-05，v1.1.1，已部署 `88771d3`）。底图改为 480×270 WebP 占位先出、1600×900 WebP 随后替换、1920 JPEG 兜底；`index.html` 预加载标题占位图；竖屏遮罩增加“若转屏无反应，用系统浏览器打开”的提示。`art.js` 定向测试 7 个场景全部到达 `is-photo`，占位图约 32ms、大图约 5s（人为延迟 5s）；390×844 显示竖屏提示、844×390 进入舞台；file:// 标题与字体正常；0 console error / 0 failed request。check-build 38/38、smoke 46/46。公网标题页 1.74s 可交互、占位图 1.75s、全图 3.28s；7/7 关键文件哈希一致；site 73 文件 / 31,356,254 B、ZIP 75 条目 / 30,818,357 B、PDF 303,713 B。未重跑 200s 全流程/公网四关/96 用例。
- 八·八 Netlify 主站：✅ 完成（2026-11-05，v1.1.1）。用户反馈 GitHub Pages 慢后，把 `dist/site` 73 文件静态直传 Netlify；匿名部署生成可认领站点，用户用 GitHub 登录认领并命名 `xiangbei`，无密码公开。公网 https://xiangbei.netlify.app/ 标题约 2.0s 出 480 占位图，开始→序章文本正确，0 console error / 0 404；Netlify 在 `index.html` 注入约 326 B 注释（14,326 B vs 本地 14,000 B），其他关键文件同包。GitHub Pages https://nanxiangzizui.github.io/xiangbei/ 保留备用。未在 Netlify 重跑完整流程/四关/移动/96 用例，不能写成“公网完整流程通过”。
- 九 移除小游戏与选择回写：✅ 完成（2026-11-06，tag `step-9-done`，v1.2.0-dev 本地完成，未打包/未部署）。四关与小游戏层全部删除（`project/minigames.js`、`?minigame=`、画布/HUD/暂停入口、solo 运行态、`XB.minigames` 引用）；新增 `multichoice` 类型与 `#vn-multichoice` 组件（整卡 `role=checkbox`、数字键 1–9、Enter 确认、Esc 暂停、确认后 300ms 锁定）。序章行囊（5 件选 3，门板占 2 格）、湘江弃物（6 件带 3，`choice.xiangjiang.abandoned` 记留在岸上）、金沙江先渡谁（j024 + 镜像布尔回写）、泸定门板/记名保留；五件行囊与六件弃物均有即时 + 后续回写，结局五卡与点名未破坏。旧档 `j010/j011→j012`、`l013/l014→l015` 迁移并 toast，`inventory.items` 反推 `item.*`、`abandoned` 反推 `take.*`；键名仍 `xiangbei.save.v1`，顶层 11 键。实测：check-build 37/37、smoke 46/46、check-script OK；target 34/34、segments 19/19、migration 19/19；http 完整流程 14/14（71s/432 line（flow.lines 对话推进计数））、file:// 14/14（72s）、844×390 移动 17/17（78s）；2 个多选 + 11 个单选、5 卡/7 名、0 console error/pageerror/请求失败。移动多选确认按钮 51.99 CSS px、选项 44.42 CSS px。证据 `docs/evidence/step-09/`；未重打包 `dist/`，线上 Netlify/GitHub Pages 仍为 v1.1.1 四关版。tag `pre-minigame-removal` 实际指向 `8beb09a`（文档曾记 `359b320`，代码同为 v1.1.1，不影响回滚）。
- 十 人物命运多结局：✅ 完成（2026-11-06，tag `step-10-done`，v1.3.0-dev 本地完成，未打包/未部署）。引擎加 34 旗标与 strain 派生、选项 requires/maxWhen、结局路线 buildEnding、点名 resolveRollCall（7/8 名）、hidden coda、旧档迁移、名册回廊 `xiangbei.roster.v1`；剧情加三次危机（l019/l019x、g018x、g026x）、草地倒下段、吴起守卫与 coda c001–c012；剧本源 5285 字/285 beat，单周目 3254–3931 字（B 13:59–16:54）。实测 http routes 44/44、coda 19/19、crises 68/68、migration 17/17、maxwhen 15/15、timeout 14/14、mobile 12/12、flow 12/12（66s）；file:// flow 12/12、routes 44/44、crises 68/68、coda 19/19；0 console error/pageerror/失败请求。check-build 39/39、smoke 46/46、check-script OK。证据 `docs/evidence/step-10/`。线上 Netlify/GitHub Pages 仍为 v1.1.1 四关版；dist 未重打包。真人四路线计时与隐私模式重跑为 P1。
- 十一 状态、物资与门板：✅ 完成（2026-11-07，tag `step-11-done`，分支 `v1.4-dev`，v1.4.0-dev 本地完成，未打包/未部署）。从 `main` 的 `8fd0d9f` / tag `step-10-done` 切出；行囊 4 格=8 半格、状态 0–4、三次危机（飞毛腿/灶王/冬生）、门板 A/B/C、11 结局（1/11–5/11、6/11–10/11、11/11）、save v2 + v1 迁移、名册 0/7/8 名、隐藏 coda/badend。文本源 6190 字/339 beat，单周目约 4–5k 字（B 估算偏保守）。测试：routes 123/123、crises 157/157、coda 20/20、pack 26/26、migration 21/21、refresh 16/16、mobile 18/18（844×390，含状态提示与物资关闭 44.4）、flow 12/12（http/file 各 171s）；check-build 39/39、smoke 46/46、check-script OK；0 console/pageerror/失败请求/外部请求。**2026-11-07 补修扣物资（T11-16）**：泸定喂药/灶王青稞与锅/冬生鞋与雨布只写 `item.*` 旗标、未同步 `inventory.items`，物资栏不扣、草地配方仍可用；`setFlag` 增 `mirrorPackItem` 镜像、`normalize` 用 `repairPackMirror` 修旧残档（只认显式 false）、铁锅面板/配方 id 统一 `homepot`→`pot`；同日二次改造（T11-17…19）：章首卡点击继续、差状态弹窗「同意/拒绝」、有板救满第三人当场援助、炒面改青稞扣粮+状态/民心、结局显示「结局N/11」、飞毛腿/灶王/冬生/林先生加戏；证据 `docs/evidence/step-11/crises` 等。T11-20 双击不选中：`#stage` 及子元素 `user-select: none`（含 `-webkit-` 与 touch-callout），双击正文/三击章名/双击标题均无选区（select-none 8/8）。T11-21 湘江条件代价：x025a/x025b 加 `hideCost`（不显示“代价 ·”）、A 加 `setIf`（带青稞才扣青稞并走撒落旁白，无青稞只走湿绑腿旁白，C 不扣粮）；xiangjiang 35/35，证据 `docs/evidence/step-11/xiangjiang`。T11-18 草地分粮回赠：g008a/b 两行（绷带/药膏）解释状态 +1；crises 124/124，证据 `docs/evidence/step-11/grass-aid`。T11-22 状态变化提示：顶部居中只读弹窗（最多三行，6s + 0.7s/行），按真实 condition/quality 变化写“由于…，…状态变为…”；泸定入场统一勉强、危机置差、救助回升，刷新不重复；证据 `docs/evidence/step-11/status-notice`（http 桌面 crises 124/124）、`docs/evidence/step-11/status-notice-file`（file:// 124/124）、`docs/evidence/step-11/status-notice-mobile`（844×390 18/18）、`docs/evidence/step-11/status-notice-duration`（http 单条 6 秒 11/11）与 `docs/evidence/step-11/status-notice-duration-file`（file:// 11/11）；同轮修物资关闭键 34.7→44.4 CSS px；T11-23/24 条件选项置灰与牺牲提示：requires 不满足仍原位渲染、`disabled` + `.is-unavailable`（底纸、序号/代价/计时条退出朱砂、0.58），数字键/点击不能越过；草地分粮改为 g008b 药膏回赠后才 +1，顶部写“由于你与他人互相救助”，`statusOnce` 刷新不重复；0 写“飞毛腿牺牲了/你牺牲了”，差且拒绝或无法补给也写“你牺牲了”；crises 157/157（http/file），证据 `docs/evidence/step-11/choices-disabled` 与 `docs/evidence/step-11/choices-disabled-file`、`docs/evidence/step-11/grass-mutual`（http 157/157）、`docs/evidence/step-11/grass-mutual-file`（file:// 157/157）；844×390 mobile 18/18。`main` 仍 v1.3，线上 Netlify/GitHub Pages 仍 v1.1.1；T11-12 键盘专项、T11-13 真人计时、Chrome/Safari/真机/隐私模式、公网完整流程为 P1/P0 沿用例外。
- 门板 hotfix（2026-11-09，T11-25）：湘江 x025a C 补写 `doorOutcome=bridge`；`settleDoor` 先保留 bridge/wuqi，再补旧中途档 none→bridge，死亡只在门板仍在身上时走 others；`settleGrass` 的 others 也要求门板在身上；`syncDerivedFlags` 的 `fate.seven5` 与 `routeOf` 死亡分支都以 `doorOutcome==="others"` 为准，桥板/吴起板+死改走 11/11；`migrateLegacyFate` 对 none 丢板补 bridge，已 grass/others 仅凭 `choices` 中 x025a C 改 bridge（A 也写 hold=true，不能只看旗标），已清 choices 的旧结局快照不重算；g022a 加 `item.door` 并新增 g022c 无板变体；遵义 z110–z116 加 `item.door` 条件（无板/桥板跳过门板对话）；结局 4/11 hint 改为“门板没有到吴起”。验收：check-build 48/48、smoke 47/47、check-script 9 文件 OK；浏览器门板回归 16/16（草地 g027 不弹舍弃、2/11 桥板、快照 routeTitle 桥板、0 console error/失败请求），证据 `docs/evidence/door-fix`。
- 十二 剧情分支与结局收纳：✅ 完成（2026-11-08，v1.5.0-dev，本地完成，已提交（tag `step-14-done`）/未打包/未部署）。三入口（标题第 5 项、结局页「查看剧情分支」、暂停菜单）；固定 1280×720 深墨蓝星尘歧路图，7 章缩略卡 + 11 结局灰锁，朱砂标本次、纸白标已抵达；19 决策组/22 结构节点逐条详情，普通「在这个……选择中，你选择了……，因此——」、超时「时间到了，默认项……替你做了决定」、未发生与未来不泄露选项；暂停实时读当前局，未来章节灰色；独立键 `xiangbei.branches.v1`（不占主档 11 键/ending 16 键），结算在 `state.choices=[]` 前写入，坏档备份 `.bad`，写失败保留内存态并 toast。测试：http 98/98（empty/live/ending/deep/routes/keyboard/reduce/bad/private）、移动 844×390 24/24、file empty 15/15 与 ending 21/21、完整实走 flow 173s 路线 2/11 且 runs=1；check-build 40/40、smoke 47/47、check-script 9 剧本 OK、0 console/pageerror/失败请求。执行卡 `step/step-12-剧情分支与结局收纳.md`；证据 `docs/evidence/step-12/`。
- 十三 剧本扩写与关系加深：✅ 完成文本与主流程（2026-11-08，v1.5.0-dev，本地完成，已提交（tag `step-14-done`）/未打包/未部署）。按用户 m00001 要求，湘江加几天几夜夜行军/飞机炮火/浮桥被炸/路边倒下的人/陈班长守桥未归，泸定加一昼夜 240 里/桥头火/敌军抽板浇煤油/22 个光点逐个灭/飞毛腿第四次搬板；四角色与“我”加日常对话（老家/参军几年/走得到吗/饿不饿/门板沉不沉/上药/补鞋/分锅巴），四角色彼此加斗嘴/自我批评/背锅/让水/写名字/帽中纸；新增 366 个 line 节点（p100–p138、x100–x160、z100–z181、j100–j143、l100–l155、g100–g156、w100–w119、c100–c104、b100–b101），文本源 11278 字/705 beat/766 节点/712 line。测试：check-build 40/40、smoke 47/47、check-script OK；http 完整流程 14/14、360s/614 line、路线 2/11、点名 7、五卡 5、0 error；证据 docs/evidence/text-expand（run.log/result.json/flow-ending.png/README.md）。真人计时、11 路线、移动、隐私未重跑；20 分钟验收按用户要求挂起。
- 十四 成就系统：✅ 完成实现与主流程（2026-11-08，v1.5.1-dev，本地完成，已提交（tag `step-14-done`）/未打包/未部署）。48 条（46 choice + 记名 2；序章 9 / 湘江 9 / 遵义 8 / 金沙江 5 / 泸定 5 / 草地 10 / 吴起 2）；标题第 6 项、暂停第 5 项（共 8 项）、结局五卡上方「此周目解锁的成就有：」三入口；未解锁灰框只写“未解锁”，已解锁点开看“章 / 选择 / 原选项 / 后果”与首次解锁时间；独立键 `xiangbei.achievements.v1`，主档仍 v2 / 11 键，ending 快照加 achievements（17 键），重进已结算结局合并 previous，避免 22 条掉 1 条；标题后四项改 2×2，移动 844×390 面板 1240×688、热区≈44.4 CSS。测试：check-build 41/41（C42）、smoke 47/47、check-script 9 文件 OK；http 55/55、file:// 55/55、移动 11/11；0 console/pageerror/失败请求。执行卡 `step/step-14-成就系统.md`；证据 `docs/evidence/step-14`、`step-14-file`。
- 十五 存档与读档：✅ 完成（2026-11-08，v1.6.0-dev，本地完成，未打包/未部署）。存档改列表 `xiangbei.saves.v1`（`{version:1,activeId,settings,slots[≤20]}`，单档仍 v2 11 键，整包 512KB）；标题菜单只留“存档”，进入游戏永远先到标题；面板支持开启新档/上次玩到/删除选中（二次确认）/已完结整页回顾（只读，不写档）；只在章末/暂停“保存”/开新档落档，中途退出读档回本章开头，章末保存后顶部 3.5 秒“已自动存档”；标题“向北”点击加粗+重影后弹初始化，清存档/分支/成就/名册但保留设置；旧 `xiangbei.save.v2/v1` 首次启动迁移成第 1 档。测试：check-build 48/48（本步 C43–C48；C49 属步骤十六）、smoke 47/47、check-script 9 文件 OK；http 88/88、迁移 8/8、隐私 4/4、移动 9/9、file:// 88/88；0 console error/失败请求。执行卡 `step/step-15-存档与读档.md`；证据 `docs/evidence/step-15/`。
- 十六 剧情回顾：✅ 完成（2026-11-08，v1.7.0-dev，本地完成，已打本地包；2026-11-09 部署 GitHub Pages（`main` = `376a175`）与 Netlify（deploy `6af12cfd`））。VN 右上暂停下方新增“回顾”；全屏实色深墨蓝只读层，左上朱砂标记 + “剧情回顾”、右上 ×，两栏人名/台词，章节分隔；所有单选/多选/金沙江记名用金色粗体 `➤`，超时追加“（时间到了，默认项）”，多选“、”连接、空选“没有选任何一样”。独立键 `xiangbei.history.v1`（按存档槽隔离，800 条/桶、24 桶、checkpoint），不占主档 11 键；只存节点引用，打开时从 story 解析；400ms debounce，打开/关闭/保存/隐藏 flush；仅 `saveNow` 成功后推进 checkpoint，读档截到 checkpoint；新档/删档/初始化/`?reset=1` 同步清理。打开冻结计时/打字机/自动并 duck，关闭恢复；X/Esc 关闭、Tab 锁焦点、数字/空格不穿透；正文固定 22px，`--text-scale` 不影响，全局 `user-select:none`。测试：check-build 48/48（C49）、smoke 47/47、check-script 9 文件 OK；http 56/56、file 56/56、移动 11/11、隐私 5/5，合计 128/128；0 pageerror/失败请求；执行卡 `step/step-16-剧情回顾.md`；证据 `docs/evidence/step-16/`。
- 十七 行囊未满确认：✅ 完成（2026-11-09，v1.7.1-dev；已打包并部署 GitHub Pages 与 Netlify，2026-11-09）。p024 点“系好行囊”时，若“行囊 + 本次已选”< 8 半格（4 格），先弹 `#bag-confirm-modal`：「行囊尚未装满，长征路途艰险，确定要继续吗？」“是”/“否”；“是”关窗走 `commitMultiChoice`（出发前物资页 → p025 → p026），“否”关窗回多选、已选与状态行不变、焦点回确认键；空行囊也弹，装满 4/4 直接走。键盘 Tab/Shift+Tab 锁两键、Esc=否、Enter 触发当前键；点遮罩不关闭也不丢焦点；弹窗期间 duck 0.45、输入不穿透、离开 VN 自动复位；未确认前不写 `choices`、不记成就、连点只结算一次。改动：`index.html` 弹窗、`story.js` p024 `confirmWhenNotFull`、`engine.js` 门控/拆分/四函数/守卫、`style.css` 移动 82 逻辑高、`check-build.js` C50、`_pw-step17.js`。验收：check-build 49/49、smoke 47/47、check-script 9 文件 OK；http 58/58、file 58/58、移动 15/15；0 console error/失败请求。首轮桌面 51/57 修掉 1 个真 bug（点遮罩后焦点丢到 body、Tab 回不到按钮）与 5 个脚本期望错误。执行卡 `step/step-17-行囊未满确认.md`；证据 `docs/evidence/step-17/`、`docs/evidence/live-v1.7.1/`。未重跑 20 分钟全程与 11 结局；已于 2026-11-09 打包并部署两站。
- 打包与部署（2026-11-08 打包；2026-11-09 部署 GitHub Pages）：按用户要求把工程打成 v1.7.0-dev 包并提交打 tag。`project/tools/release.py` 的 `VERSION` 升到 `1.7.0-dev`，离线 README 改写为现行玩法（四段选择 + 三次危机、行囊 4 格/状态 0–4、11 条人物结局、存档列表、分支/成就/回顾）；`dist/site` 72 文件 / 31,600,743 B，`dist/xiangbei-v1.7.0-dev` 73 文件 / 31,603,691 B，`dist/xiangbei-v1.7.0-dev-offline.zip` 74 条目 / 30,871,186 B（SHA256 `9f548cee…6db2`），`dist/SHA256SUMS.txt` 147 行；`release.py verify` OK。打包冒烟（`dist/_smoke-package.js`，仅本地、不入库）：http + file:// 共 21 项全绿，覆盖标题菜单、存档空态、开新档确认、序章 6 句、回顾入口与条目、暂停菜单、`xiangbei.saves.v1`/`xiangbei.history.v1` 落键、file:// 字体；0 console error/pageerror/failed request；证据 `docs/evidence/package-v1.7.0/`。`.gitignore` 新增 `resource/`（134 MB 素材源库）、`.netlify/`、`*.bak-expand` 备份与 `_pw-debug-*.js`，均不入库；`dist/` 与 `*.zip` 仍不入库。部署：2026-11-09 把 `dist/site` 部署到 GitHub Pages（提交 `376a175`，父 `d54cd61`，diff 仅 engine/index/story/style + 删 `minigames.js`），`origin/main` 已更新；线上冒烟 19/20（唯一失败为网络加载 24.2s 超自设 20s），0 console error / 0 失败请求；Netlify 同日用 CLI 部署（deploy `6af12cfd…`，73 文件，冒烟 20/20，`loadMs` 3.4s，`minigames.js` 404）。未做：20 分钟真人计时、11 结局代表路线、Chrome/Safari/真机、移动打包冒烟、PDF 重制。记录见 `docs/release-record.md` §13（§13.1 提交与 tag、§13.2 GitHub Pages、§13.3 Netlify）。
- 打包与部署（2026-11-09，v1.7.1-dev）：按用户 m00346 把行囊未满确认与门板改动一起提交（`db481e3`），tag `step-17-done` / `v1.7.1-dev`，已推 `origin/v1.4-dev`；`release.py` 的 `VERSION` 升到 `1.7.1-dev`，`dist/site` 72 文件 / 31,608,883 B，离线包 73 文件 / 31,611,831 B，ZIP 74 条目 / 30,873,612 B（SHA256 `588BEB…8A`），`SHA256SUMS` 147 行，`verify`/`hash` OK。GitHub Pages 部署提交 `d0fe7e9`（父 `376a175`；临时 index 保留源文件与 `.nojekyll`，仅 engine/index/story/style 四文件变），`origin/main` 已更新；Netlify deploy `6af141ac…`（73 文件，4 个新 blob）。两站线上冒烟各 9/9：p024 空行囊弹窗文案逐字、「否」回多选、「是」进出发前 0/4 格；0 console error / pageerror / 失败请求。`check-build` 49/49、`smoke` 47/47、`check-script` 9 文件 OK、打包冒烟 21/21。未重跑 20 分钟全程、11 结局、移动、隐私、Chrome/Safari；记录见 `docs/release-record.md` §14。
- 建议下一步：先验收行囊未满确认（空/未满/装满、否回多选、是进出发前）；再验收剧情回顾与门板路线；随后按真人计时恢复 20 分钟口径，回归 11 条人物结局、移动/隐私。GitHub Pages（`main` = `d0fe7e9`）与 Netlify（deploy `6af141ac…`）均已上线 v1.7.1-dev；`v1.4-dev` 继续开发、不合并 `main`。第 8 项（清理/兼容性，含未用 `plate_loushan`、Chrome/Safari/真机、移动 WebP）继续后置。

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
11. 历史终点单一（湘江败、遵义开、泸定夺、到吴起不可改）；人物命运 11 条结局（v1.4.0-dev：带板 1/11–5/11、无板 6/11–10/11、11/11），没有全活；不做好感度、攻略角色、真结局、结局完成度百分比、分支存档树；不做战斗、养成、“打鬼子”关卡、排行榜、多人。
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
22. v1.0–v1.1 的四关共用一套“限时分配”引擎；v1.2.0 删除四关，改为行囊/弃物两段多选 + 金沙江/泸定两段单选；v1.3.0 加三次救人危机；v1.4.0 再加 4 格/半格物资、状态 0–4 与门板条件，全部复用现有单选/多选组件，不另写状态机。
23. 交差材料：链接 + ZIP + 一页设计说明（史实出处表 + 精神对照表 + 操作说明）+ 3 分钟演示 + 制作名单/字体授权。
24. 验收底线（v1.4.0-dev）：20 分钟内通关；至少 4 段可玩选择（行囊 4 格多选、弃物多选、金沙江先渡谁、泸定门板/记名）加三次救人危机；11 条人物结局各通关一次，点名与路线账本一致（names 0/7/8、companyEnd 18/19）；7 张史实注；结局有“点名 + 数字 + 五张精神卡”；手机横屏可玩；断网 ZIP 可玩。

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
| 人物命运 | 11 结局各通关一次 | 1/11–5/11、6/11–10/11、11/11；点名 0/7/8 名、companyEnd 18/19 与账本一致；没有全活 |
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
