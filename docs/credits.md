# 《向北》制作名单、字体与素材授权

> 版本 v1.0.0 · 2026-11-03 · 课程项目，非商业使用。
> 本文件与 `project/CREDITS.txt`、`docs/design-note.md`、`README.md` 的口径一致；发布记录见 `docs/release-record.md`。

## 1. 字体

**本版不打包任何字体文件，使用系统回退。** 2026-11-03 尝试时，官方字体源（GitHub Releases / raw.githubusercontent.com）在本机网络不可达；系统也未安装得意黑/霞鹜文楷。为避免把来源不明的字体打进 ZIP，本版保留 `@font-face { src: local(...) }`，不写 `url()`、不下载、不内嵌。

| 用途 | 首选字体 | 授权 | 本版处理 |
|---|---|---|---|
| 标题 | 得意黑 Smiley Sans | SIL Open Font License 1.1（上游仓库声明） | 只读系统 local()；缺失时回退 Microsoft YaHei / PingFang SC / Noto Sans CJK SC |
| 正文 | 霞鹜文楷 LXGW WenKai | SIL Open Font License 1.1（上游仓库声明） | 只读系统 local()；缺失时回退 Songti SC / SimSun / Noto Serif CJK SC |
| 备选正文 | 思源宋体 Source Han Serif | SIL Open Font License 1.1 | 不打包；系统回退 |

- 标题字体名：`XB Title`；正文字体名：`XB Body`；`font-display: swap`。
- 回退栈写在 `project/style.css` 的 `--font-title` / `--font-body`；`?fonts=fallback` 可强制对照。
- 没有 `project/assets/fonts/`、没有 `.woff2/.ttf/.otf`、没有 `LICENSES/` 字体文件；ZIP 内字体体积为 0 字节。
- 如果后续要打包：只用官方 release 的 TTF/OTF 子集为 woff2，标题 ≤80KB、正文 ≤220KB、合计 ≤300KB；附 OFL 原文、来源、版本、SHA256、子集命令；保留 local() 在前。未完成这些步骤前不打包。

### 1.1 步骤二状态（2026-11-01，只 local()）与沿革

- 步骤二（2026-11-01）：只 local()，不打包；欠账留步骤八。
- 步骤六（2026-11-02）：仍不打包；音频不需要字体授权。
- 步骤八（2026-11-03）：**明确走不打包分支**；X6 继续 carry，三处文档写明“本版未打包字体，使用系统回退”。

## 2. 素材

- 图像：全部 Canvas/SVG 程序化版画；不使用影视/游戏/网络图片；无外部图片请求。
- 音频：Web Audio 实时合成风声、水声、鼓点与原创五音动机（D4–F4–G4–A4–C5）；不使用音频文件，不引用歌曲旋律。
- 图标：CSS/内联 SVG 自绘；不用图标库。
- 参考：界面参考 galgame-d3n.pages.dev 的布局与氛围；不复制其素材/代码。节奏参考 60 Seconds!、Papers, Please、Mini Metro、Celeste、This War of Mine；只借节奏，不用素材。
- 截图/PDF 只使用本项目运行画面；不出现真实姓名、学校、地址、账号。

## 3. 史料

- 史实锚点与出处见 `docs/sources.md`；7 条锚点，每条至少 2 个出处。
- A1–A7 的网页出处已于 2026-11-03 逐条复核（HTTP 200）；S4 为预留未采用，S13 在 `www.81.mil.cn` 可达。
- 游戏内“史实注”只写已核内容；争议写“有不同说法”。
- 真实人物只进史实注；游戏人物虚构，片头/图鉴/CREDITS/设计说明均有声明。
- 《七根火柴》《金色的鱼钩》是小说，不是史料；回忆录标注“回忆录”。
- 大事件结局不可改：湘江必败、遵义必开、泸定必夺。

## 4. 工具

- 编辑器：VS Code；浏览器：Edge 156（步骤七实测）；Chrome/Safari 为环境例外。
- 本地服务：`python -m http.server 8080 --directory project`；离线：直接打开 `index.html`。
- 测试：Node 24 + Playwright 1.64（仅测试，不进运行时）；静态检查 `check-build.js` / `smoke.js` / `check-script.js`。
- 部署：GitHub Pages（main / root，2026-11-03 上线，部署提交 `7dbe2b4`）；Cloudflare Pages Direct Upload 为备选（OAuth 未完成，未部署）。
- 版本：Git，`main`；每步 tag；不提交 ZIP/MP4/完整字体/密钥。

## 5. 制作名单

| 角色 | 姓名 |
|---|---|
| 制作 / 程序 | 刘子政 |
| 剧本 / 文案 | 刘子政 |
| 美术 / 版画 | 刘子政 |
| 测试 / 演示 | 刘子政 |
| 史料核对 | 刘子政 |

> 按用户 2026-11-03 指示，全部制作角色署名为“刘子政”；不列学校、地址、账号、指导老师姓名。

**特别说明**：人物与情节为虚构；史实部分参考公开史料，出处见 `docs/sources.md`；字体按 OFL 使用，本版不打包；程序化图像与 Web Audio 为项目原创。

## 6. 交差前检查

- [x] 字体授权口径已写明：本版不打包，系统回退；无外部字体请求。
- [x] 无外部图片/音频/字体 CDN 请求；素材全部程序化/Web Audio。
- [x] 游戏内制作名单入口：标题页“制作名单”链接 → `project/CREDITS.txt`。
- [x] 7 条史料链接复核；争议标注；A1–A7 每条至少 2 出处。
- [x] ZIP 断网可玩（发布回归 + 离线 file:// 191.1s / 408 line）。
- [x] 公网链接可访问（GitHub Pages；2026-11-03 live smoke 16/16）。
- [x] 演示视频：用户 2026-11-03 明确取消，不列为缺口。

## 7. 交付入口

| 项 | 路径 |
|---|---|
| 游戏入口 | `project/index.html`（开发）/ `dist/site/index.html`（上传）/ ZIP 根 `index.html` |
| 制作名单 | `project/CREDITS.txt` |
| 一页设计说明 | `docs/design-note.md` / `dist/design-note.pdf` |
| 发布记录 | `docs/release-record.md` |
| 史实出处 | `docs/sources.md` |
