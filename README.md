# 向北

> 一块门板，两万五千里。
> 16 岁红军文书，从于都走到吴起；七段路，四段选择（v1.2.0-dev 本地已实现；线上 v1.1.1 仍为四个小游戏），七张史实图鉴，一次点名。

《向北》是原生 HTML5 + CSS3 + JavaScript 的网页互动叙事游戏。固定 1280×720 舞台，视觉小说 + 限时抉择 + 多选取舍（v1.2.0-dev 本地已实现；线上 v1.1.1 仍包含四个小游戏）；没有框架、构建链、后端、登录、排行榜。v1.1.0 起图像、字体与音频随包（CC/PD/OFL/CC0/CC-BY，逐项见 `CREDITS.txt`），不依赖 CDN；剧情仍内联，离线 ZIP 双击可玩。

**虚构人物，非史料人物。** 满崽、老周、何指导员、张老幺、飞毛腿、灶王、冬生等均为虚构；真实人物只进“史实注”，不进剧情对白。历史结局不可改：湘江必败、遵义必开、泸定必夺。

> **v1.2.0-dev 已完成（2026-11-06，未打包/未部署）**：删除门板/弃物/渡船/攀索四个小游戏，改为行囊多选、弃物多选、金沙江先渡谁、泸定门板/记名四段选择；核心剧情、7 张图鉴、五张精神卡、点名结局不变。线上仍是 v1.1.1 四关版，`dist/` 尚未重打包；执行与实测见 `step/step-09-移除小游戏与选择回写.md`、`docs/evidence/step-09/`。

## 交付物

| 项 | 位置 | 状态 |
|---|---|---|
| 公网链接（主） | https://xiangbei.netlify.app/ | **v1.1.1 已上线**（Netlify，2026-11-05；用户认领 `xiangbei` 站点；静态直传 `dist/site`）；标题 2.0s 出占位图，开始→序章正常，0 console error / 0 404；完整流程未在公网重跑 |
| 公网链接（备） | https://nanxiangzizui.github.io/xiangbei/ | v1.1.1 已上线（GitHub Pages，2026-11-05；仓库 `nanxiangzizui/xiangbei`，main / root；部署提交 `88771d3`）；关键文件 HTTP 200 + SHA256 7/7 一致 |
| 发布站点 | `dist/site/` | v1.1.1 已生成并验证；73 个文件，31,356,254 B；与 Netlify 站点同包（`index.html` 多 326 B Netlify 注入注释） |
| 离线 ZIP | `dist/xiangbei-v1.1.1-offline.zip` | v1.1.1 已生成并验证；75 个条目，30,818,357 B；根目录 `xiangbei-v1.1.1/` |
| 一页设计说明 | `dist/design-note.pdf` | A4 一页，303,713 B；源文件 `docs/design-note.md` / `project/tools/design-note.html` |
| 演示视频 | — | **本版不录**（用户 2026-11-03 明确取消，不列为缺口）；`docs/demo-script.md` 保留作现场演示稿 |
| 制作名单 | `project/CREDITS.txt` + 标题页“制作名单” | 刘子政；UTF-8，9,667 B |
| 字体清单 | `docs/credits.md` + `project/assets/fonts/OFL-*.txt` | v1.1.1 随包两份 OFL 1.1 子集（约 552 KB）；公网 v1.1.1 同步包含 |

> `dist/` 是交付产物，默认不提交到 Git；仓库保留可复现的 `project/tools/release.py` 与文档。

## 怎么运行

### 直接打开（离线）

1. 解压 `dist/xiangbei-v1.1.1-offline.zip`。
2. 双击 `xiangbei-v1.1.1/index.html`。
3. 没有网络也能玩。Edge 下 `file://` 的 `localStorage` 可用；若浏览器禁止，游戏会提示“本局无法存档”，仍可继续，不白屏。

### 本地静态服务（更接近线上）

在解压目录运行：

```powershell
python -m http.server 8080
```

浏览器打开本机 8080 端口。不要用 `fetch` 或 ES module 方式加载剧情；本项目全部剧情内联在 `story.js`。

### 线上地址与重新上传

**线上（主）**：https://xiangbei.netlify.app/ （Netlify，2026-11-05 静态直传 `dist/site`；Netlify 会在 `index.html` 注入约 326 B 说明注释，其余文件与 `dist/site` 同包）。

**线上（备）**：https://nanxiangzizui.github.io/xiangbei/ （GitHub Pages，仓库 `nanxiangzizui/xiangbei`，main / root；v1.1.1 部署提交 `88771d3`）。

重新上传：Netlify 主站需在 Netlify 后台/CLI 用账号重新上传 `dist/site`；GitHub Pages 备站仍把 `dist/site/` 与 `.nojekyll` 更新到 `main` 自动重建。Cloudflare Pages 仍可作备选（Direct Upload，构建命令留空）。不要上传仓库根目录、`docs/`、`step/`、`project/tools/`、`.git/` 或测试证据；这些不在 `dist/site/` 内。

## 操作

| 动作 | 键鼠 | 触摸 |
|---|---|---|
| 推进对话 | 点击 / 空格 / Enter | 点对话框 |
| 选择 | 1–3 单选；多选 1–9 切换、Enter 确认 | 点选项/整卡 |
| 暂停 | Esc | 右上角暂停按钮（Logic 96×96；手机 52 CSS px） |
| 文字速度 / 字号 / 总音量 / 配乐 / 环境音 / 静音 / 减少动效 / 跳读已读 | 暂停 → 设置 | 暂停 → 设置 |
| 花名册 | 暂停 → 花名册 | 同上 |
| 图鉴 | 标题 / 暂停 / 结局入口 | 同上 |

选择段落（v1.2.0-dev 已实现，本地可玩；未打包/未部署）：

- **行囊**：门板单独确认；行囊共三格，门板占两格。不带门板，五件里最多带三件；带门板，只再带一件。
- **弃物**：湘江边六样东西里带三样上船，门板另算；带什么写进后续台词。
- **先渡谁**：金沙江先渡主力、伤员还是炊事班；不改变 37 名船工与 7 天 7 夜的史实数字。
- **门板/记名**：泸定桥头门板怎么用、记不记得无名者；不改变泸定桥必夺。

v1.1.1 线上仍为四个小游戏（门板/弃物/渡船/攀索），均单手可完成；旧入口只作历史回归，不再作为 v1.2.0-dev 验收项。手机请横屏；竖屏会提示“请横屏”，并提示用系统浏览器打开。

## 七段、四段选择、七图鉴、五卡

| 段 | 史实锚点（详见 `docs/sources.md`） | 玩家动作 |
|---|---|---|
| 序章·于都 | 1934.10 于都河；8.6 万余人出发；门板/床板/寿材架桥 | 锯门板；行囊多选 |
| 一·湘江 | 1934.11 末–12 初；8.6 万→3 万余人；红 34 师断后 | 弃物；回头 / 断后 |
| 二·遵义 | 1935.1.15–17；约 3.7 万人 | 复盘，承认错误 |
| 三·金沙江 | 1935.5 皎平渡；6 条船（有 7 条说）；37 船工；7 天 7 夜 | 先渡谁；记名字（v1.2.0-dev 无渡船调度） |
| 四·泸定 | 1935.5.29；22 人；13 根铁索；240 余里 | 门板/记名（v1.2.0-dev 无攀索） |
| 五·草地 | 1935.8 松潘→班佑；7 天；近 800 人（王平回忆录） | 分炒面；抬人 |
| 终章·吴起 | 1935.10.19；到陕北 7000 余人 | 点名；看五卡 |

- 七张史实图鉴：A1–A7，120–220 字，含“有不同说法”的争议标注。
- 五张精神卡：理想信念（火种）、不怕牺牲（断后）、独立自主/实事求是（复盘）、顾全大局/严守纪律（先渡）、依靠人民/艰苦奋斗（船工）。五卡只改亮度与文案，不改变唯一结局；全灰合法。
- 结局固定为“到吴起、点名、放门板”；数字：虚构连队 104 → 19，中央红军 86,000 → 7,000（史实）。

## 20 分钟口径

| 口径 | 数值 | 说明 |
|---|---|---|
| 设计上限 | **20:00** | 硬验收 |
| 真人首玩 4 次 | 04:52 / 06:42 / 07:36 / 08:33 | 2026-11-02 记录；C/D 版本未注明（X7） |
| 静态慢读预算 | 19:48 | 仅余 12 秒；按剧本字数与常速朗读估算 |
| 极端等待 | 约 23:44 | 9 个限时项全部超时且翻倍的压力上限，不是常速 |

自动化完整流程 191 秒是“快速点击”证据，**不是真人首玩计时**。若按 23:44 质疑，按“草地 → 金沙江 → 遵义改纯对话”的顺序裁剪；本轮未裁剪。

## 测试摘要（2026-11-03，v1.0.0 发布包）

| 项 | 结果 |
|---|---|
| `node --check` 四个 JS | 通过 |
| `check-build.js` | **38/38** 全绿 |
| `smoke.js` | **46/46** 全绿 |
| `check-script.js docs/script` | OK：7 个剧本；禁用词 0；真实人物 0；结构完整 |
| `release.py verify` | OK：site 8 文件 / package 9 文件 / ZIP 10 条目 / PDF 1 页 / CREDITS 2,025 B |
| 发布站点 http 完整流程 | Edge 156 headless；191.1 秒 / 407 行；四关均有结果；5 卡 / 4 亮 / 7 名 / 0 划名；0 console error / pageerror / 404 / 外部请求 |
| 离线 ZIP file:// 完整流程 | 断网 + `file://`；191.1 秒 / 408 行；四关均有结果；0 console error / pageerror / 404 / 外部请求 |
| 发布站点全用例 | 96/96（smoke / save / gallery / ending / minigames / viewport / mobile / privacy / audio / keyboard） |
| 发布专项（桌面/移动） | 各 22/22；CREDITS 可打开、键盘焦点、字体回退、PDF 可访问 |
| fps | 桌面标题 60.0 / 攀索 60.0；移动标题 60.0 / 攀索 48.7（最低 29.9，p95 33.4ms） |
| 移动 844×390 | 标题、对话、ending、制作名单、四关独立入口与触摸 通过；发布包只改标题页链接与 style.css，未改六运行时逻辑；完整移动流程沿用步骤七 200.9 秒 / 406 行 |

### v1.2.0-dev 本地回归（2026-11-06，未打包/未部署）

| 项 | 结果 |
|---|---|
| `node --check` 三个 JS | engine / story / art 通过（`minigames.js` 已删除） |
| `check-build.js` / `smoke.js` / `check-script.js` | **37/37** / **46/46** / OK（7 剧本、禁用词 0、真实人物 0） |
| 四段选择专项（Edge 156 headless，http） | target 34/34、segments 19/19、migration 19/19 |
| 桌面完整流程 | http 71s / 432 line（flow.lines 对话推进计数）；file:// 72s；2 个多选 + 11 个单选；5 卡 / 7 名；0 console error/pageerror/请求失败/HTTP 错误/外部请求 |
| 844×390 触摸 | full flow 78s；target 37/37；确认按钮 51.99 CSS px、选项 44.42 CSS px；五卡/七名/0 错误 |
| 无小游戏残留 | `minigames.js` 不存在、不加载；`?minigame=` 不再进关卡；页面无小游戏 canvas/HUD |
| 旧档迁移 | j010/j011→j012、l013/l014→l015；toast 各一次；旧 inventory 回填 item.*、abandoned 反推 take.* |

自动化 71–78 秒是快速点击证据，**不是真人首玩计时**；v1.2.0-dev 未重做真人 20 分钟计时。

### v1.1.1 发布包（2026-11-05，已部署）

| 项 | 结果 |
|---|---|
| `node --check` 四个 JS | 通过 |
| `check-build.js` / `smoke.js` | **38/38** / **46/46** |
| 慢网底图 | 480×270 WebP 占位图先出（本地 32ms；公网首页 1.75s 进入 `is-photo is-placeholder`），1600×900 WebP 随后替换（公网 3.28s 全图）；12 场景逐一验证 |
| 竖屏 | 390×844 显示“请把手机横过来”与“在浏览器打开”；844×390 正常进入 693×390 舞台 |
| 七场景 | 于都 / 湘江 / 遵义 / 金沙江 / 泸定 / 草地 / 吴起均到 `is-photo`；0 console error / failed request |
| 公网 | 标题页 1.74s 可交互；占位图 1.75s / 全图 3.28s；7 个关键文件 HTTP 200 + SHA256 一致；0 console error / pageerror / 404 |
| `release.py verify` | OK：site 73 文件 / package 74 文件 / ZIP 75 条目 / PDF 1 页 / CREDITS 9,667 B |

`dist/SHA256SUMS.txt` 覆盖 149 个文件。公网只做了标题页 / 竖屏 / 关键文件与 7 个文件哈希，**没有重跑公网完整流程、四关或 96/96**。

### v1.1.0 发布包（2026-11-04，历史）

| 项 | 结果 |
|---|---|
| `node --check` 四个 JS | 通过 |
| `check-build.js` / `smoke.js` | **38/38** / **46/46** |
| 阅读层专项 | Edge http **21/21**；照片卡、图鉴缩略图/年代说明、三档音量、花名册、file:// 标题/字体/图 |
| Edge http 完整流程 | 201.585 秒 / 405 行；四关均有结果；5 卡 / 4 亮 / 7 名 / 0 划名；0 console error / pageerror / 404 / 外部请求；证据 `docs/evidence/step-07/edge-http-20261104-181721` |
| Edge http 四关 | **20/20**；门板 0.1 秒、弃物 1.0 秒、渡船 89.3 秒（12/18 趟，37 船工）、攀索 29.9 秒（16 过 / 6 暗）；均有结果、无评分、可再玩；证据 `docs/evidence/step-07/edge-http-20261104-minigames-unique` |
| Edge file:// 完整流程 | 197.639 秒 / 406 行；门板 0.1 / 弃物 1.0 / 渡船 90.0 / 攀索 29.9 秒；5 卡 / 4 亮 / 7 名 / 0 划名；0 console error / pageerror / 404 / 外部请求；证据 `docs/evidence/step-07/edge-file-20261104-182136` |
| Edge 844×390 触摸完整流程 | 207.978 秒 / 405 行；门板 0.4 / 弃物 1.5 / 渡船 89.7 / 攀索 31.6 秒；5 卡 / 4 亮 / 7 名 / 0 划名；0 错误；证据 `docs/evidence/step-07/edge-http-20261104-182136-mobile` |
| 844×390 阅读层专项 | 标题、章首卡、图鉴、花名册均在舞台内；7 张图鉴缩略图全部加载；花名册 7 行 + 返回可见；0 console error / pageerror / 404；证据 `docs/evidence/step-07/edge-mobile-20261104-feature` |
| 六张章节卡 | 湘江地图、遵义、金沙江、泸定、草地、吴起均 `has-photo`，地点与底图匹配；0 console error / 404；证据 `docs/evidence/step-07/edge-http-20261104-titlecards` |
| `release.py verify` | OK：site 47 文件 / package 48 文件 / ZIP 49 条目 / PDF 1 页 / CREDITS 9,438 B |

`dist/SHA256SUMS.txt` 覆盖 149 个文件（PDF、ZIP、site 与 package）。`dist/site` 与 v1.1.1 ZIP 与本次线上部署文件一致；公网只做了关键文件 HTTP 200 + SHA256 比对，**没有重跑公网完整流程**。

### 已知例外（不写成通过）

- **Chrome 未安装、Safari 无设备**：P0 环境例外，2026-11-02 用户接受；本版未补测。
- **真机触摸**：只做 844×390 触摸模拟；真机未验（X3）。
- **音频听感 / 真实后台/锁屏**：Web Audio 路由、9 床/12 cue、暂停 duck、visibility 模拟通过；真机耳机听感与真实切后台仍 carry（X4/X5）。
- **字体**：v1.1.1 公网随包 OFL 1.1 子集（`XB Smiley` / `XB Zhuque`，约 552 KB），仍保留系统回退；v1.0.0 的“不打包”记录只作历史。
- **制作名单移动热区**：逻辑 100×44，桌面实测 45 逻辑 / 48 CSS px；844×390 缩放下物理 41.2×24.4 CSS px，低于 44，按步骤七 B16 同类例外记录，不重排标题（X12）。
- **X7 计时版本**：四次真人计时中 C/D 的版本注记缺失；不把自动化 191 秒当真人。
- **X8 访谈**：试玩为联合访谈，用户已接受 P0 例外；不写成 3 份独立问卷。
- **X10 遵义第三刀**：未超 20 分钟，不裁剪；保留 carry。
- **X11 fps**：已补测标题 + 攀索各 10 秒；移动最低帧 29.9，接近 30，不写成“稳定 60”。

完整例外见 `docs/release-record.md` §6 与 `docs/test-record.md`。

## 字体、素材、史料

- **字体（2026-11-04 素材增强）**：随包 OFL 1.1 子集；大标题/印章用得意黑 Smiley Sans（`XB Smiley`），章节/正文/图鉴用朱雀仿宋 Zhuque Fangsong（`XB Zhuque`）；回退 Microsoft YaHei / Songti SC / SimSun。授权原文在 `project/assets/fonts/OFL-*.txt`。
- **图像**：程序化版画 + 12 张双色调场景底图（1600×900 WebP + 480×270 占位图，JPEG 兜底；CC BY / CC BY-SA / PD / CC0；湘江地图作第一章标题卡）+ 1 张豆包 Seedream 生成的标题插画（虚构红军小战士与于都河渡口，非史料人物/现场）；逐张署名与“不是 1935 年现场”说明见 `docs/credits.md`。不使用未授权影视/游戏素材。
- **音频**：既有 Web Audio 合成 9 张环境床、12 个短 cue、原创五音动机 D4–F4–G4–A4–C5；新增 5 条 CC0 环境录音与 8 首 CC0/CC-BY 现代配乐；无历史录音冒充，不自动播放，首次点击后解锁。
- **素材版状态**：代码与 `project/assets/` 已接入；v1.1.1 `dist/site`、离线 ZIP 与设计说明已生成、`release.py verify` 通过；2026-11-05 已部署到 GitHub Pages（`88771d3`）。Edge headless 的 `http://` 与 `file://` 已验证字体/背景/音频/照片卡/图鉴/花名册；公网已验证标题占位图/全图与竖屏提示。
- **史料**：A1–A7 / S1–S15 见 `docs/sources.md`；每条至少 2 个出处，2026-11-03 复核链接。争议（X 光机、22 勇士姓名/牺牲人数、金沙江船数、于都渡口数、草地减员、夹金山高度）标注“有不同说法”。《七根火柴》《金色的鱼钩》是小说，不作为史料。

## 目录

```text
向北-项目计划书.md          唯一权威计划
.claude/CLAUDE.md           当前进度/步骤表/红线
docs/                       剧本源、史料、设定、测试记录、发布记录
step/                       分步骤执行卡（step-00 … step-09）
project/
  index.html                舞台/UI 入口
  style.css                 令牌、版式、组件、纸纹
  engine.js                 状态机、阅读层、存档、音频、fx
  story.js                  七章剧情、选项、图鉴（内联）
  art.js                    程序化版画
  CREDITS.txt               制作名单/字体/素材/虚构声明
  tools/                    开发期脚本（不进运行时）
dist/                       交付产物（默认不提交）
  site/                     上传用站点
  xiangbei-v1.1.1/          ZIP 根目录
  xiangbei-v1.1.1-offline.zip
  design-note.pdf
  SHA256SUMS.txt
```

## 制作名单

制作 / 程序 / 剧本 / 美术 / 测试 / 史料核对：**刘子政**。
完整名单、字体授权与素材说明见 [project/CREDITS.txt](project/CREDITS.txt) 与 [docs/credits.md](docs/credits.md)。游戏标题页右下“制作名单”可直接打开 CREDITS.txt。

## 线上自检（2026-11-05，v1.1.1）

> Netlify 主站（`https://xiangbei.netlify.app/`）做了标题/序章浏览器检查：标题约 2.0s 出 480 占位图，开始→序章文本正确，0 console error / 0 404；GitHub 备站做关键文件 HTTP 200 + SHA256 比对（7/7：index、标题占位图、标题大图、朱雀字体、配乐、CREDITS、PDF）与标题页/竖屏检查（占位 1.75s / 全图 3.28s，0 error）；v1.0.0 的 live smoke 16/16 保留为历史。完整流程、四关与 96/96 用例在本地发布包跑过，**未在公网重跑**；以下保留人工复检清单。

- [x] 根 URL 打开是标题；版本行“试玩版 · 人物虚构，非史料人物”。
- [x] “制作名单”链接可见、可点、打开 CREDITS.txt；`/design-note.pdf` 可打开。
- [ ] 一次完整流程到点名：5 张精神卡、7 个名字、两组数字。
- [x] 本地 v1.2.0-dev：四段选择、旧四关入口消失、`minigames.js` 删除；证据见 `docs/evidence/step-09/`。
- [ ] 公网仍是 v1.1.1：线上检查四关入口（`?minigame=door|abandon|boat|climb`，历史）与七张图鉴；v1.2.0-dev 部署后再改为检查四段选择。
- [x] 手机竖屏显示“请把手机横过来”与“在浏览器打开”；横屏 844×390 已本地测。
- [x] Netlify 标题/序章：0 console error / 0 404；无外部请求。
- [ ] 完整流程中 0 error / 0 404；硬刷新不缓存旧 JS（公网完整流程未跑）。
- [ ] 不暴露 docs/、step/、tools/、.git/、evidence。

自检结果填回 `docs/release-record.md` §10/§5；未做的项写“未验证”，不写“通过”。
