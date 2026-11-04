# 《向北》制作名单、字体与素材授权

> 版本 v1.1.0 · 2026-11-04 · 课程项目，非商业使用。
> 本文件与 `project/CREDITS.txt`、`docs/design-note.md`、`README.md` 的口径一致；发布记录见 `docs/release-record.md`。
> 2026-11-04 素材增强：12 张场景/地图底图 + 1 张 AI 标题插画、朱雀/得意黑 OFL 子集、5 条环境录音 + 8 首配乐；同日已部署到 GitHub Pages（`f8b2045`）。

## 1. 字体

**本版随包打包两个 SIL Open Font License 1.1 子集**，只含游戏实际用字；文件在 `project/assets/fonts/`，授权原文同目录。

| 用途 | 字体 | 版本 / 授权 | 包内文件 | 处理 |
|---|---|---|---|---|
| 大标题 / 印章 | 得意黑 Smiley Sans | v2.0.1 / OFL 1.1 | `smiley-game.woff2` 158,048 B | 子集化，改名 `XB Smiley`，只给“向北”大字与朱砂“北”印 |
| 章节标题 / 正文 / 图鉴 / UI | 朱雀仿宋 Zhuque Fangsong | v0.212 / OFL 1.1 | `zhuque-game.woff2` 394,452 B | 子集化，改名 `XB Zhuque`；1932 年“南宋”活字底本，历史感最强 |
| 回退 | 系统宋体/黑体 | — | — | title/body: Songti SC / SimSun / Noto Serif CJK SC；display: Microsoft YaHei / PingFang SC / Noto Sans CJK SC |

- 字体名：`XB Smiley` / `XB Zhuque`；`font-display: swap`；`?fonts=fallback` 强制对照。
- 子集字符集：1,318 个字符，覆盖 `story.js`、`index.html`、`engine.js`、`minigames.js`、`art.js`、`tools/ui-preview.html` 与 `docs/script/` 的全部用字；943 个独立汉字缺字 0。
- 授权：OFL 1.1 允许嵌入/子集化/随游戏分发；已改名以避开保留字体名；OFL 原文见 `OFL-Smiley.txt` / `OFL-Zhuque.txt`。
- 上游：得意黑 <https://github.com/atelier-anchor/smiley-sans>；朱雀仿宋 <https://github.com/TrionesType/zhuque>。
- 未使用来源不明字体；没有把未授权字体打进包。

### 1.1 步骤二状态（2026-11-01，只 local()）与沿革

- 步骤二（2026-11-01）：只写 `local()`，不打包任何字体文件。
- 步骤六（2026-11-02）：仍不打包。
- 步骤八（2026-11-03）：官方源不可达，明确走不打包分支；ZIP 内字体 0 字节，X6 继续 carry。
- 2026-11-04：网络可达后改用官方 OFL 子集，子集仅含游戏用字；`local()` 不再是唯一来源，但回退栈仍保留系统宋体/黑体。**本版 ZIP 字体约 552 KB，不再是 0 字节。**

## 2. 图像

12 张场景/地图底图 + 1 张标题插画，均在 `project/assets/backgrounds/`，1920×1080 JPEG。

- **场景底图（12 张）**：裁切 16:9 → 灰度 → 自动对比 → 双色调（夜/墨/中灰/纸）→ 颗粒 → 暗角 → 顶部压暗（章节标签可读）。全部是**现代照片或 1967 年《人民画报》影像**，作氛围底图，不作为“1935 年现场”证据。
- **标题插画（1 张）**：豆包 Seedream 生成的虚构场景，保留原图色纸/木刻质感；已对右下角水印做同质暗影修补 + 右下压暗，再裁到 1920×1080。它不是历史照片，人物是虚构的普通战士，不是真实人物肖像。
- **缩略图（7 张）**：由上述底图裁切为 480×270 JPEG，位于 `project/assets/backgrounds/thumbs/`，只用于图鉴卡片与单张史实注；不单独构成新素材，不另署名。

| 文件 | 场景 | 原图 / 作者 | 授权 | 重要说明 |
|---|---|---|---|---|
| `plate_title.jpg` | `title` | 豆包 Seedream（用户本地生成，第二版） | AI 生成，用户提供 | 虚构红军小战士背门板、于都河渡口与送行人群；非史料人物/现场。源图 `title_yudu_doubao_v2.jpg`，去水印版 `title_yudu_clean.jpg`，提示词见 `resource/title/prompt.txt`。 |
| `plate_yudu.jpg` | `yudu_river` / `yudu_night` | 贡江涨水 - panoramio / 陈剑鸣 | CC BY 3.0 | 2011 年于都贡江；远山、树影、河面；夜景加冷色叠层。不是 1934 年现场。 |
| `plate_xiangjiang.jpg` | `xiangjiang_ford` / `xiangjiang_dawn` | 湘江一景 - panoramio / 天王星 | CC BY-SA 3.0 | 2008 年湖南湘江边河街、塔、渔船；**不是广西界首渡口**。 |
| `plate_xiangjiang_map.jpg` | `xiangjiang_map`（标题卡） | 中国工农红军红星司令部在抢渡湘江前绘制的地图 03572 / 上传 Cangminzho | CC BY-SA 4.0 | 1934 年 11 月地图的现代照片；作第一章标题卡，不是全屏战地照。 |
| `plate_zunyi_hall.jpg` | `zunyi_hall` | ZunyiMeeting.jpg / 小小新手 | CC BY-SA 3.0 | 遵义会议会址主楼，2005 年；建筑后来修缮过。 |
| `plate_zunyi_street.jpg` | `zunyi_street` | 红军遵义警备司令部旧址 2024-06-20 / xiquinhosilva | CC BY 4.0 | 实际是旧址门楼/院落，不是“街”；文案写“遵义旧城·司令部旧址”。 |
| `plate_loushan.jpg` | 暂未挂剧情 | 1967-10 1967年娄山关 / 《人民画报》 | Public domain | 1967 年影像，不是 1935 年现场；本版保留为素材/后续标题卡候选。 |
| `plate_jinsha.jpg` | `jinsha_river` / `jinsha_night` | Jinsha River, Yunnan / Rod Waddington | CC BY-SA 2.0 | 2018 年金沙江云南段峡谷；不是皎平渡实景。 |
| `plate_luding.jpg` | `luding_bridge` | 1967-10 红军时期泸定桥 / 《人民画报》 | Public domain | 1967 年影像；铁索、木板、水势可辨；桥后来维修过。 |
| `plate_luding_after.jpg` | `luding_after` | Luding Bridge ... 2018 / Huangdan2060 | CC0 | 2018 年桥与两岸；作“过桥之后/回望”。 |
| `plate_grass.jpg` | `grass_marsh` | 九曲黄河第一湾1.JPG / Zhangmoon618 | Public domain | 四川若尔盖/唐克，云层低；作草地夜行军/宿营。 |
| `plate_grass_dawn.jpg` | `grass_dawn` | 若尔盖 黄河九曲第一湾景区 02 / Liuxingy | CC BY-SA 4.0 | 2023 年阴天草原；作“天亮了”的冷白黎明。 |
| `plate_wuqi.jpg` | `wuqi_dawn` / `wuqi_wall` | 1967-10 陕北杨家岭 / 《人民画报》 | Public domain | 1967 年影像，延安杨家岭窑洞；**不是吴起镇**，作“陕北/终点地域”意象。 |

### 2.1 来源页（署名用）

- [贡江涨水 - panoramio](https://commons.wikimedia.org/wiki/File:贡江涨水_-_panoramio.jpg)
- [湘江一景 - panoramio](https://commons.wikimedia.org/wiki/File:湘江一景_-_panoramio.jpg)
- [湘江作战地图 03572](https://commons.wikimedia.org/wiki/File:中国工农红军红星司令部在抢渡湘江前绘制的地图_03572.jpg)
- [ZunyiMeeting.jpg](https://commons.wikimedia.org/wiki/File:ZunyiMeeting.jpg)
- [红军遵义警备司令部旧址 2024-06-20](https://commons.wikimedia.org/wiki/File:红军遵义警备司令部旧址_2024-06-20.jpg)
- [1967-10 1967年娄山关](https://commons.wikimedia.org/wiki/File:1967-10_1967年娄山关.jpg)
- [Jinsha River, Yunnan](https://commons.wikimedia.org/wiki/File:Jinsha_River,_Yunnan_(50769833923).jpg)
- [1967-10 红军时期泸定桥](https://commons.wikimedia.org/wiki/File:1967-10_红军时期泸定桥.jpg)
- [Luding Bridge ... 2018](https://commons.wikimedia.org/wiki/File:Luding_Bridge_over_the_Dadu_River,_in_Luding_County,_Sichuan,_China,_2018.jpg)
- [九曲黄河第一湾1](https://commons.wikimedia.org/wiki/File:九曲黄河第一湾1.JPG)
- [若尔盖 黄河九曲第一湾景区 02](https://commons.wikimedia.org/wiki/File:若尔盖_黄河九曲第一湾景区_02.jpg)
- [1967-10 陕北杨家岭](https://commons.wikimedia.org/wiki/File:1967-10_陕北杨家岭.jpg)

### 2.2 授权注意

- CC BY：保留署名、授权链接、是否修改的说明（本版均裁切/去色/双色调/颗粒/暗角）。
- CC BY-SA：上述处理属于改编，`backgrounds/` 中对应文件按相同协议共享；代码本身不因此被“传染”。
- Public domain：无授权义务，但仍写明《人民画报》1967 年第 10 期。
- 没有使用未授权影视/游戏截图；除 `plate_title.jpg` 的 AI 标题插画外，场景底图均非 AI 生成；没有把 1967 年影像说成 1935 年现场。

### 2.3 AI 标题插画

- 文件：`project/assets/backgrounds/plate_title.jpg`；第二版源图 `resource/title/title_yudu_doubao_v2.jpg`（2732×1535 JPEG，用户提供）；去水印/压暗版 `resource/title/title_yudu_clean.jpg`；第一版 `title_yudu_doubao_v1.png` 仅留存，不上游戏；提示词 `resource/title/prompt.txt`。
- 工具/日期：豆包（Doubao）Seedream，2026-11-04，用户本地生成。
- 内容：虚构的十六七岁普通红军小战士、灰布军装、八角帽红星、草鞋、背一块刻有“参军”的旧门板；于都河、浮桥、队伍与送行人群。不是真实历史人物肖像，不是 1934 年现场照片。
- 处理：用同质暗影修补右下“豆包 AI 生成”水印，并在右下加压暗收住残余像素；`ImageOps.fit` 裁到 1920×1080，JPEG q92。标题页另有 CSS 左压纸/右下压暗，保证标题、菜单与“制作名单”可读。
- 授权：AI 生成图，用户提供；课程项目非商业使用。未使用第三方图片/影视/游戏素材；如后续公开商用，请按豆包服务条款另行确认。

## 3. 声音

保留原有 Web Audio 合成：9 张环境床、12 个短 cue、原创五音动机 D4–F4–G4–A4–C5。2026-11-04 新增 5 条环境录音 + 8 首配乐；全部是**现代录音/现代创作，不是 1930 年代历史录音**。

### 3.1 环境循环（CC0；首尾交叉淡化 + 响度归一 + 单声道）

| 文件 | 来源 / 作者 | 授权 | 用途 |
|---|---|---|---|
| `wind_loop.mp3` | Thimras / OpenGameArt “Park ambiences” | CC0 | 泸定、草地、吴起、标题 |
| `river_loop.mp3` | Thimras / OpenGameArt “Park ambiences” | CC0 | 于都、湘江、金沙江 |
| `rain_loop.mp3` | Ylmir / OpenGameArt “Rain (loopable)” | CC0 | 湘江、草地 |
| `birds_loop.mp3` | Thimras / OpenGameArt “Park ambiences” | CC0 | 于都、草地黎明、吴起 |
| `fire_loop.mp3` | PagDev / OpenGameArt | CC0 | 泸定火墙、过桥后余火 |

### 3.2 配乐（现代创作）

| 文件 | 曲目 / 作者 | 授权 | 场景 |
|---|---|---|---|
| `shangri_river.mp3` | Shangri River / Tozan | CC0 | 标题、地图、结局 |
| `oriental.mp3` | Oriental / OpenGameArt | CC0 | 于都 |
| `a_bitter_hope.mp3` | A Bitter Hope / InspectorJ | CC BY 3.0 | 湘江；附授权/说明 PDF |
| `visions_of_freedom.mp3` | Visions Of Freedom / Jonathan Shaw & César da Rocha | CC BY 3.0 | 遵义 |
| `sunrise_dynasty.mp3` | Sunrise in the Dynasty / Yottabyte1024 | CC BY 3.0 | 金沙江 |
| `final_heros_monologue.mp3` | Final Hero’s Monologue / Radiance | CC BY 4.0 | 泸定 |
| `misty_mountains.mp3` | Misty Mountains / Hitctrl | CC BY 3.0 | 草地/雪山 |
| `frozen_orchard.mp3` | frozen orchard / Bobjt | CC BY 4.0 | 吴起 |

来源页：
- A Bitter Hope: <https://opengameart.org/content/a-bitter-hope-rpg-orchestral-essentials-dungeon-music>
- Final Hero’s Monologue: <https://opengameart.org/content/final-hero%E2%80%99s-monologue>
- Frozen Orchard: <https://opengameart.org/content/frozen-orchard>
- Visions Of Freedom: <https://opengameart.org/content/visions-of-freedom-jonathan-shaw-c%C3%A9sar-da-rocha>

### 3.3 接入与边界

- 环境/配乐用 `HTMLAudioElement` + `createMediaElementSource` 接入既有 Web Audio 总线；`file://` 与 `http://` 均实测可播放；`file://` 下若 `createMediaElementSource` 失败，退回 `<audio>` 直连并按设置/duck 计算音量。不使用 fetch/XHR/ES module，无 CDN。
- 配乐接入前统一整体增益到约 RMS 0.10、峰值上限 0.95，`MUSIC_DEFS.gain = 1.5`；只改响度，不改旋律与结构。
- 首次用户手势后才创建/恢复 AudioContext；静音、音量、暂停 duck、页面隐藏 suspend 继续生效。
- 未找到授权明确的 1930 年代历史录音；不把“听起来像”的影视配乐冒充历史音频。

## 4. 史料

- 史实锚点与出处见 `docs/sources.md`；7 条锚点，每条至少 2 个出处。
- A1–A7 的网页出处已于 2026-11-03 逐条复核（HTTP 200）；S4 为预留未采用，S13 在 `www.81.mil.cn` 可达。
- 游戏内“史实注”只写已核内容；争议写“有不同说法”。
- 真实人物只进史实注；游戏人物虚构，片头/图鉴/CREDITS/设计说明均有声明。
- 《七根火柴》《金色的鱼钩》是小说，不是史料；回忆录标注“回忆录”。
- 大事件结局不可改：湘江必败、遵义必开、泸定必夺。

## 5. 工具

- 编辑器：VS Code；浏览器：Edge 156（步骤七实测）；Chrome/Safari 为环境例外。
- 本地服务：`python -m http.server 8080 --directory project`；离线：直接打开 `index.html`。
- 测试：Node 24 + Playwright 1.64（仅测试，不进运行时）；静态检查 `check-build.js` / `smoke.js` / `check-script.js`。
- 部署：GitHub Pages（main / root）；v1.0.0 于 2026-11-03 上线（`7dbe2b4`），v1.1.0 于 2026-11-04 上线（`f8b2045`）。
- 版本：Git，`main`；每步 tag；不提交 ZIP/MP4/完整字体/密钥。

## 6. 制作名单

| 角色 | 姓名 |
|---|---|
| 制作 / 程序 | 刘子政 |
| 剧本 / 文案 | 刘子政 |
| 美术 / 版画 | 刘子政 |
| 测试 / 演示 | 刘子政 |
| 史料核对 | 刘子政 |

> 按用户 2026-11-03 指示，全部制作角色署名为“刘子政”；不列学校、地址、账号、指导老师姓名。

**特别说明**：人物与情节为虚构；史实部分参考公开史料，出处见 `docs/sources.md`；字体按 OFL 使用并随包；场景底图为 CC/PD 素材的版画化改编；程序化图像、Web Audio 与配乐选曲为项目整合。

## 7. 交差前检查

- [x] 字体授权口径已写明：OFL 子集随包、改名、附原文；回退栈保留。
- [x] 图像逐张署名、授权、来源页与“不是现场”说明。
- [x] 音频逐条署名/授权；明确现代录音，不冒充历史。
- [x] 无外部 CDN/网络请求；`file://` 与 `http://` 实测。
- [x] 游戏内制作名单入口：标题页“制作名单”链接 → `project/CREDITS.txt`。
- [x] 素材版 v1.1.0 已部署；部署前已获用户明确确认。
- [ ] 真机耳机听感、真机触摸、Chrome/Safari 仍需在交差前补测或如实列为例外。

## 8. 交付入口

| 项 | 路径 |
|---|---|
| 游戏入口 | `project/index.html`（开发）/ `dist/site/index.html`（上传）/ ZIP 根 `index.html` |
| 制作名单 | `project/CREDITS.txt` |
| 一页设计说明 | `docs/design-note.md` / `dist/design-note.pdf` |
| 发布记录 | `docs/release-record.md` |
| 史实出处 | `docs/sources.md` |
