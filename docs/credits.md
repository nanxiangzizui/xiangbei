# 《向北》制作名单、字体与素材授权

> 交差前把 <...> 换成真实信息；确认字体 LICENSE 后再打包。代码仅用于课程作业，非商业使用。

## 1. 字体

| 用途 | 字体 | 授权 | 处理 |
|---|---|---|---|
| 标题 | 得意黑 Smiley Sans | SIL Open Font License 1.1（以官方仓库 LICENSE 为准） | 只子集化标题用字；附 LICENSE |
| 正文 | 霞鹜文楷 LXGW WenKai | SIL Open Font License 1.1（以官方仓库 LICENSE 为准） | 子集化正文用字；附 LICENSE |
| 备选正文 | 思源宋体 Source Han Serif | SIL Open Font License 1.1（以官方仓库 LICENSE 为准） | 不打包则用系统回退 |

**子集化**

- 先把游戏全部文本导出为 all-text.txt（剧情 + UI + 史实注 + 制作名单）。
- 用 pyftsubset：pyftsubset font.ttf --text-file=all-text.txt --flavor=woff2 --output-file=font-subset.woff2
- 标题/正文分开子集；合计 ≤300KB；font-display: swap。
- 不把完整字体打进 ZIP；不把未授权字体转成图片。
- 回退：Songti SC, SimSun, serif；回退后版式不崩。

### 1.1 步骤二状态（2026-11-01）

- 本步**不打包任何字体文件**：仓库没有 `project/assets/fonts/`，没有 `.woff2/.ttf/.otf`，ZIP 不附字体。
- 只用 `@font-face { src: local(...) }` 读系统已装字体：标题 `Smiley Sans` / `得意黑`，正文 `LXGW WenKai` / `霞鹜文楷`；`font-display: swap`。
- 系统缺失时回退：标题 → `Microsoft YaHei` / `PingFang SC` / `Noto Sans CJK SC`；正文 → `Songti SC` / `SimSun` / `Noto Serif CJK SC`。`?fonts=fallback` 强制走回退栈做对照验收。
- 没有下载、没有 CDN、没有 data URI；`@font-face` 里不出现 `url(`（C12 检查）。
- 子集化 + 随 ZIP 附 LICENSE 的欠账留步骤八；上线前必须补 LICENSE 与体积核算（≤300KB）。

### 1.2 步骤六状态（2026-11-02）

- 仍不打包字体；音频不需要字体授权。
- 声音全部由 `project/engine.js` 的 `XB.audio` 用 Web Audio 合成：9 张环境床、12 个短 cue、1 段原创五音动机（D4–F4–G4–A4–C5）。
- 没有音频文件、没有采样、没有第三方音源；噪声 buffer 与振荡器都在运行时生成。
- 音效设计、五音音高序列为项目原创；不涉及外部音乐版权。

## 2. 素材

- 图像：全部 Canvas/SVG 程序化版画；不使用影视/游戏/网络图片。
- 音频：Web Audio 实时合成风声、水声、鼓点与原创五音动机；不使用音频文件，不引用任何歌曲旋律。
- 图标：CSS/内联 SVG 自绘；不用图标库。
- 参考：界面参考 galgame-d3n.pages.dev 的布局与氛围；不复制其素材/代码。
- 游戏节奏参考：60 Seconds!、Papers, Please、Mini Metro、Celeste、This War of Mine；只借节奏，不用素材。

## 3. 史料

- 史实锚点与出处见 docs/sources.md；7 条，每条至少 2 个出处。
- 游戏内“史实注”只写已核内容；争议写“有不同说法”。
- 真实人物只进史实注；游戏人物虚构，片头/图鉴有声明。
- 交差前补齐原文链接；文学（《七根火柴》《金色的鱼钩》）不当作史料。

## 4. 工具

- 编辑器：VS Code；浏览器：Chrome/Edge/Safari + DevTools。
- 本地服务：python -m http.server 8080；离线：直接打开 index.html。
- 部署：Cloudflare Pages（静态，构建命令留空，输出根目录）；备选 GitHub Pages。
- 版本：建议 git init；每步 tag；不提交字体全量/大文件/密钥。

## 5. 制作名单

| 角色 | 姓名 |
|---|---|
| 制作/程序 | <姓名> |
| 剧本/文案 | <姓名> |
| 美术/版画 | <姓名> |
| 测试/演示 | <姓名> |
| 指导老师 | <老师> |
| 史料核对 | <姓名/自己> |

**特别说明**：人物与情节为虚构；史实部分参考公开史料，出处见 docs/sources.md；字体按 OFL 使用，清单随 ZIP 附上。

## 6. 交差前检查

- [ ] 字体 LICENSE 文件在 assets/fonts/ 或 credits/ 下。
- [ ] 无外部图片/音频/字体 CDN 请求。
- [ ] 游戏内制作名单可打开。
- [ ] 7 条史料链接补齐；争议标注。
- [ ] ZIP 断网可玩；链接可访问；演示视频备份。
