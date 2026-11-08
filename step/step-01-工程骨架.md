# 步骤一执行计划：工程骨架

> **所属步骤**：一 · 工程骨架（对应 向北-项目计划书.md 执行步骤 3）
> **状态源**：.claude/CLAUDE.md「分步骤」表；本文件不另存状态，执行时只回填文末《复核记录》
> **当前状态（2026-11-01）**：步骤一 ✅ 完成，tag `step-1-done`；六文件 + tools×3 + 三份 docs 已提交，浏览器实测 12 项全绿。提交记录见 §11.6，执行记录见 §11。
> **本步骤出口**（逐字引自 .claude/CLAUDE.md）：标题→地图→一段对话→返回；刷新恢复；控制台无报错。
> **时间盒**：标准版 9h（540 min）／压缩版 5h10（310 min）
> **不可逆动作**：无。?reset=1 只清开发存档；提交与 tag 在 T1.9；不部署、不发视频、不打包字体。

---

## 0. 一页速览：任务卡总表

| 编号 | 任务 | 产出 | 完成判据 | 预算 |
|---|---|---|---|---|
| T1.0 | 文档先行：把本步新增参数写进 docs | state-schema §1/§2/§4/§5、ui-layout §1.5、script/README §7 | 三处文档落地，代码未动 | 30 min |
| T1.1 | 舞台壳与等比缩放 | project/index.html、project/style.css、engine.js 的 resize | 1920/1366/844×390 不出界、无滚动条 | 60 min |
| T1.2 | story.js 章节元数据 + 序章试片 | project/story.js | 7 章元数据；20 句逐字；id 唯一 | 45 min |
| T1.3 | XB.core 纯状态层 | engine.js 上半 | 无 DOM 可跑；存档按 id 重建 | 75 min |
| T1.4 | XB.engine 场景与输入 | engine.js 下半、index.html 场景 DOM | 标题→地图→对话→返回 | 90 min |
| T1.5 | 存档落地与恢复 | engine.js 存档段、调试参数 | 刷新回到原句；坏档不白屏 | 60 min |
| T1.6 | 边界文件占位 | project/art.js、project/minigames.js | 文件在、命名空间在 | 15 min |
| T1.7 | 开发期静态检查与冒烟 | tools/redlines.js、check-build.js、smoke.js；check-script 改为复用 | 全绿；负例有断言 | 75 min |
| T1.8 | 浏览器实测与留证 | 截图、控制台记录、§11.3 表 | 三档 + file:// + 刷新恢复 | 60 min |
| T1.9 | 复核、状态同步、提交 | 复核记录、CLAUDE.md 步骤表、tag | tag step-1-done | 30 min |

合计 540 min（9h）。压缩版 310 min（见 §6），只保出口，不保工具完整度。

**先文档后代码**：本计划新增 5 个实现参数——scene 字段、nodeId 字符串、每 beat 存档与 4KB 上限、地图站点坐标、节点 id 规则。它们必须在 T1.0 先写进 docs，T1.1 才开工；否则代码会成为唯一规格，违反 step/README 第 37 行约定。

**本步的完成定义**（三条同时成立才算完成，不是“文件写完”）：

1. 双击 project/index.html（file://）能走通：标题 → 开始 → 地图 → 点「于都」→ 读到第 20 句 → Esc 暂停 → 返回地图 → 回到标题。
2. 在第 10 句（p010「家在人身上。」）刷新，页面自动回到同一句，继续点能走完试片。
3. DevTools Console 无 error、无 404、无未捕获 Promise 拒绝。

---

## 1. 起点盘点：已有资产 vs 缺口

| 已有 | 位置 | 状态 |
|---|---|---|
| 七章剧本（4108 字 / 229 beat） | docs/script/00-prologue.md … 06-wuqi.md | 定稿；序章 837 字 / 41 beat / 3:33 |
| 序章前 20 句（到第一个选项之前） | docs/script/00-prologue.md 第 9–31 行 | 可直接作为本步试片，无分支、无小游戏 |
| 7 张史实注 | docs/codex.md | 定稿；本步只登记 id，不接入 UI |
| 结构 / 数字 / 五卡 | docs/story-bible.md §4、§5、§7 | v1.0 |
| 存档 schema / 旗标全表 | docs/state-schema.md | v1.0；nodeId 仍是数组下标，与本步冲突 |
| 界面坐标 | docs/ui-layout.md §1–§5 | 有标题/VN/小游戏；**缺地图画面** |
| 小游戏数值 | docs/minigame-tuning.md | v1.0；本步不实现数值 |
| 验收用例 T01–T20 | docs/test-cases.md | 本步只取 T01/T06/T17/T18 的可用部分 |
| 剧本红线工具 | project/tools/check-script.js（47 行） | 可用；BANNED/REAL 列表内嵌，需抽公共 |
| 字数统计工具 | project/tools/count-words.js | 可用；本步不改 |
| 步骤零交接 | step/step-00-定题史料与剧本.md §10 | 7 个 chapter id、end 节点、节点映射表 |

| 缺口 | 影响 | 本步处置 |
|---|---|---|
| project/ 无 index.html / style.css / engine.js / story.js / minigames.js / art.js | 无从运行 | T1.1–T1.6 新建 |
| 舞台缩放、场景切换、输入路由 | 出口第一条 | T1.1 / T1.4 |
| 存档读写、版本迁移、坏档降级 | 出口第二条 | T1.5 |
| nodeId 是数字下标，if 分支一展开就漂移 | 步骤三会返工 | T1.0 改字符串 id，T1.3 按 id 重建 |
| 地图 7 个站点无坐标 | 地图画不出来 | T1.0 写 ui-layout §1.5 |
| 没有运行时静态检查 / 无头冒烟 | 回归靠肉眼 | T1.7 新建 check-build / smoke |
| CLAUDE.md 常用命令仍指根目录 index.html | 新人打不开 | T1.9 同步为 project/ 路径 |
| 无浏览器证据 | 不能报“能玩” | T1.8 实测并留证 |

**关键判断**：这一步不是“做游戏”，是“立骨、不画皮”。视觉在步骤二，打字机/选项/图鉴在步骤三，四个小游戏在步骤四。本步只证明三件事：数据能被状态机读、场景能切换、进度能存回来。因此**只誊序章 20 句**，不誊全章、不做选项、不做门板关——那是步骤三/四的活。试片节点 id 一旦冻结，步骤三只能在其后追加，不能重排。

**三个高风险点**（先写在这里，§8 展开）：

1. nodeId 从数字改字符串会让旧开发存档失效——v1 从未发布，允许一次内部修订，但必须写进 schema §5。
2. 每 beat 存档可能拖慢低端机——先测写入耗时，超过 8ms 再改成 120ms 合并写入；不许悄悄改成“只存关卡”。
3. 地图坐标会被步骤二插画推翻——T1.0 先冻结在文档里，步骤二改坐标必须同步改文档，不许只在 CSS 里挪。

---

## 2. 本步骤的不变量（先背下来再动手）

**内容**

1. 试片 20 句必须与 docs/script/00-prologue.md 第 9–31 行**逐字相同**；不改标点、不改人称、不补旁白。
2. 只允许出现 4 个说话人：旁白、满崽、娘、老周；旁白在 UI 上不显示姓名签。
3. 不出现真实人物姓名；不出现 docs/style-guide.md 的 12 个禁用词。
4. 不接入选项、小游戏、结算、标题卡、史实注正文；这些节点类型在本步数据里不存在。
5. 试片结束用临时 end 节点 p900（next=map），并弹一句「序章 · 于都（试片）到此」；这不是正式章节结尾。

**技术**

6. 六个运行文件固定为 project/index.html、style.css、engine.js、story.js、minigames.js、art.js；不新增运行时 JS 文件。
7. 只用经典 script + window.XB；不用 fetch/XHR/ES module/构建链/CDN；所有路径以 ./ 开头。
8. 舞台固定 1280×720，用 transform: scale() 整体缩放；坐标一律舞台坐标；不逐元素改 px。
9. 输入只用 pointerdown/click/keydown；不依赖 hover；可点元素 ≥44×44；按钮必须是真 button。
10. 存档键 xiangbei.save.v1；读写全 try/catch；任何失败都要有可见提示或明确降级，不白屏。
11. 控制台零 error、零 404；favicon 用 data: 占位，避免默认请求。

**范围**

12. 不做打字机、不做选项 UI、不做小游戏、不做音频、不做 Canvas、不做图鉴、不做部署。
13. 不改剧本正文；不改旗标名；不改存档键名；不改项目目录结构。
14. 本步的“能玩”只指出口三条；不写“第一章可玩”“完整流程可玩”。

---

## 3. 产出清单（文件级）

| 路径 | 动作 | 内容 | 验收 | 下游 |
|---|---|---|---|---|
| project/index.html | 新建 | 舞台、title/map/vn 三个 section、pause/toast/debug/orientation、按序引 4 个脚本 | C03；三档不出界 | 步骤二换皮、步骤三加节点 |
| project/style.css | 新建 | 变量、舞台缩放、三场景静态布局、焦点、竖屏提示、reduced-motion | C05、C04；1920/1366/844 实拍 | 步骤二扩展为视觉系统 |
| project/engine.js | 新建 | 上半 XB.core（无 DOM）、下半 XB.engine（DOM/输入/存档） | S01–S14；出口三条 | 步骤三/四/五直接扩展 |
| project/story.js | 新建 | 7 章元数据 + 序章 p001–p020 + p900 | S09–S14；C06 | 步骤三追加全章 |
| project/art.js | 新建 | 空命名空间 + 归属注释 | C07 | 步骤二实现版画 |
| project/minigames.js | 新建 | 空命名空间 + 归属注释 | C07 | 步骤四实现 4 关 |
| project/tools/redlines.js | 新建 | BANNED / REAL 两个数组 | check-script 输出不变 | 步骤三/七复用 |
| project/tools/check-build.js | 新建 | 静态检查 C01–C09，退出码 0/1 | 全绿；故意改坏能红 | 步骤七回归 |
| project/tools/smoke.js | 新建 | vm 无头冒烟 S01–S14 | 全绿 | 步骤三/四回归 |
| project/tools/check-script.js | 修改 | 删除内嵌列表，require ./redlines | 输出与改前一致 | — |
| docs/state-schema.md | 修改 | scene 字段、nodeId 字符串、beat 存档、v1 修订说明 | T1.0 判据 | 全项目存档契约 |
| docs/ui-layout.md | 修改 | 新增 §1.5 地图画面（坐标/路线/提示） | T1.0 判据 | 步骤二地图插画 |
| docs/script/README.md | 修改 | 新增 §7 节点 id 规则 | T1.0 判据 | 步骤三转换脚本 |
| .claude/CLAUDE.md | 修改 | 步骤表、当前进度、常用命令 project/ 路径 | T1.9 判据 | 唯一状态源 |
| step/step-01-工程骨架.md | 修改 | 回填 §11 复核记录 | T1.9 判据 | 交接 |

证据目录 docs/evidence/step-01/ 已被 .gitignore 忽略：截图放本地，§11.3 记录文件名与结论；不提交大图。

---

## 4. 决策记录（S1–S9）

| # | 决定 | 为什么 | 代价 / 回退 |
|---|---|---|---|
| S1 | nodeId 用字符串 id（p001…），存档只存当前节点 id；载入时在章节点表里按 id 重建运行时栈 | 数组下标在 [[if]] 展开后不稳定，步骤三必炸；id 还能让存档可读、可 diff | id 必须唯一；改 id 要写迁移。回退：若步骤三发现分支无法按 id 定位，改成“章节版本号 + 路径”，不改存档键 |
| S2 | v1 存档直接新增 scene 字段、nodeId 改字符串；**不升 v2** | v1 从未发布，没有真实用户存档；升 v2 要写两套迁移，纯成本 | 旧开发存档读到数字 nodeId 时备份 .bad 后重置；在 schema §5 写明 |
| S3 | 每推进一句（beat）即存档，单次 JSON 目标 <4KB | T06 要求对话中途刷新恢复；只在关卡存会丢整段 | 低端机若写入 >8ms，改 120ms 合并写；验收改为“刷新最多回退一句”并记录 |
| S4 | 场景固定 8 个，切换只走 go(scene, payload)；choice/result/codex 是叠加在 vn 之上的场景；pause 是布尔遮罩，不算场景 | 单一入口才能保证 exit/enter、存档、输入一致 | 未实现场景被调用时 toast「场景未接入」并退回，不静默 |
| S5 | engine.js 拆 XB.core（纯状态，无 DOM）与 XB.engine（DOM/输入/存档），同文件两段 | 本机 shell 不可用，纯状态层可在 vm 里无头自测；也方便步骤三写单测 | 文件变长；以注释分隔两段。回退：不得拆成 core.js 新文件（违反文件职责固定） |
| S6 | 试片取序章第 9–31 行共 20 句（到第一个选项前），p001–p020 + p900 end；不取选项 | 20 句覆盖旁白/对话、一次 bg 切换、足够测刷新；不含分支，步骤三可原样保留 id | p900 在步骤三删除；删前写迁移：缺失节点回本章第一句 |
| S7 | 地图坐标先写入 ui-layout §1.5，再写 CSS/JS；坐标用站点按钮左上角 | 文档是坐标唯一源，避免步骤二插画与代码打架 | 步骤二可调，但必须同改文档；check-build C08 检查 §1.5 存在 |
| S8 | 新增 tools/redlines.js，check-script 与 check-build 共用；新增 check-build/smoke 两个开发期 Node 脚本 | 避免禁用词/真名两份列表漂移；无浏览器也能回归 | 工具不进运行时、不被 index.html 引用；C07 检查 |
| S9 | 标题菜单「史实图鉴」本步只弹「步骤五接入」；「继续」只在有可恢复节点时可用 | 本步没有图鉴场景；继续必须真的恢复，不做假按钮 | 步骤三做图鉴场景后替换 toast；S9 只影响标题一处 |

**S1 的运行时模型（写清楚，避免步骤三误解）**

- 一章 = 一个节点数组；运行时 state.stack = [{ list: nodes, index: 0 }]。
- 当前节点 = 栈顶 list[index]；推进 = index++；到数组末尾则弹栈；本步只有一层。
- 存档只写 nodeId，不写 stack；载入时 locate(chapterId, nodeId) 返回 index，重建一层栈。
- 步骤三加分支时，branch 节点带 then/else 两个数组；进分支压栈，出分支弹栈；locate 递归查找并返回完整帧路径。存档格式不变。

**S3 的写入预算**

- 试片存档约 300–400 字节；即使七章全量旗标也只有 1–2KB。
- 4KB 是上限不是目标；超过 4KB 视为 schema 设计错误，smoke 直接失败。

---

## 5. 任务卡

### T1.0 文档先行（30 min）

**目的**：把本计划新增的实现参数变成文档契约，后续代码只实现文档。

**输入**：docs/state-schema.md、docs/ui-layout.md、docs/script/README.md、本文件 §4。

**动作 1：state-schema.md**

- §1 示例改为（节选，字段顺序不变）：

      {
        "version": 1,
        "scene": "vn",
        "chapterId": "jinsha",
        "nodeId": "j042",
        ...
      }

- §2 默认值表：新增一行 scene，默认 "title"，取值 title/map/vn/choice/minigame/result/codex/ending；nodeId 改为「字符串 id 或 null，默认 null；数组下标已废弃」。
- §4 保存点：把「刷新/关闭前不强制保存」改为「每个 line beat 推进即保存（单次序列化 <4KB）；刷新恢复到当前 beat」；其余保存点（进章、选项、小游戏、记名/点名、设置、结局）保留；失败降级一句保留。
- §5 迁移：新增「v1 内部修订（2026-11）」条目，写明 nodeId 由数字下标改为字符串 id、新增 scene；因 v1 未发布，不升 version；读到数字 nodeId 的旧开发存档，备份为 xiangbei.save.v1.bad 后重置；解析失败/结构不符统一备份 .bad，版本过高备份 .bak。
- 全文检索并删除「nodeId」「数组下标」的旧表述；旗标名一个都不改。

**动作 2：ui-layout.md 新增 §1.5 地图画面**

- 插在 §1 与 §2 之间，标题写「## 1.5 地图画面（步骤一新增）」，不重排原有 §2–§5。
- 坐标均为舞台坐标、站点按钮左上角，按钮 132×64；路线是装饰，不接收点击。

| 元素 | x | y | w | h | 说明 |
|---|---|---|---|---|---|
| 地图标题「往北」 | 64 | 48 | auto | 56 | 44px；字距 8 |
| 副题「一条路，七段」 | 64 | 108 | auto | 28 | 18px；墨黑 70% |
| 站点：于都 | 120 | 560 | 132 | 64 | 序号 01；已解锁 |
| 站点：湘江 | 280 | 500 | 132 | 64 | 02；锁定 |
| 站点：遵义 | 440 | 450 | 132 | 64 | 03；锁定 |
| 站点：金沙江 | 610 | 380 | 132 | 64 | 04；锁定 |
| 站点：泸定 | 760 | 300 | 132 | 64 | 05；锁定 |
| 站点：草地 | 920 | 220 | 132 | 64 | 06；锁定 |
| 站点：吴起 | 1080 | 130 | 132 | 64 | 07；锁定 |
| 路线折线 | — | — | — | — | 依次穿过各站中心，2px 墨黑 30%，虚线 6/6 |
| 底部提示 | 64 | 660 | auto | 28 | 18px；「点亮的站点可以进入；其余还在路上」 |

- 路线中心点（供 SVG 用）：186,592 → 346,532 → 506,482 → 676,412 → 826,332 → 986,252 → 1146,162。

**动作 3：docs/script/README.md 新增 §7 节点 id 规则**

- 章前缀：prologue=p、xiangjiang=x、zunyi=z、jinsha=j、luding=l、grass=g、wuqi=w。
- 顺序号 001–899；分支正文用主序号加 a/b（如 p041a / p041b）；900–999 保留给该章 end。
- id 全局唯一、一经写入 story.js 不再改；确需改，必须同时写存档迁移。
- 给出一行映射示例：00-prologue.md 第 9 行 → p001；第 31 行 → p020；试片 end → p900。

**产出**：三份文档的修改。

**完成判据**：

- state-schema 中「数组下标」0 处；示例含 scene 与字符串 nodeId；§4 有 beat 存档；§5 有 v1 修订。
- ui-layout 有 §1.5，8 行坐标齐全，路线中心点齐全。
- script/README 有 §7，前缀表齐全。
- 没有改任何代码文件。

**常见坑**：

- 不要把 scene 默认值写成 vn（首次启动必须停在 title）。
- 不要把地图坐标写成屏幕坐标或中心点；按钮定位统一用左上角。
- 不要给 §1.5 重排章节号，步骤二的引用会断。
- 不要在 state-schema 里保留「nodeId 0」的旧示例。

---

### T1.1 舞台壳与等比缩放（60 min）

**目的**：先把 1280×720 的舞台、三个场景容器和缩放跑起来，画面可以丑，但不能出界。

**输入**：ui-layout §1/§2/§1.5、style-guide 的 5 个色值、本卡 id 契约。

**动作 1：index.html**

- 结构（顺序即层叠顺序）：

      #stage[data-scene]
        section#scene-title.scene
        section#scene-map.scene[hidden]
        section#scene-vn.scene[hidden]
        div#pause.overlay[hidden]
        div#toast[role=status][aria-live=polite]
        pre#debug[hidden]
      div#orientation

- 必需 id（check-build C03 逐项检查）：stage、scene-title、scene-map、scene-vn、pause、toast、debug、orientation、title-menu、map-stations、map-route、vn-bg、vn-chapter、vn-name、vn-text、vn-next。
- 脚本顺序固定：./art.js → ./story.js → ./minigames.js → ./engine.js；全部普通 script，无 type=module、无内联脚本、无 on* 属性。
- head 里加：meta charset、viewport（width=device-width, initial-scale=1, viewport-fit=cover）、title「向北」、link rel=icon href="data:,"（防 404）。
- 标题画面按 ui-layout §2 放静态文案：向北 / 一块门板，两万五千里 / 三项菜单 / 版本与「人物虚构，非史料人物」声明；门板插画位留空。
- 地图按 §1.5 放标题、副题、#map-stations 空容器、SVG #map-route（polyline 先写死中心点）、底部提示。
- VN 按 §1 放 #vn-bg、#vn-chapter、暂停按钮、#vn-dialogue（#vn-name、#vn-text、#vn-next）。
- 暂停遮罩：继续 / 返回地图 / 回到标题三个 button，均带 data-action。

**动作 2：style.css**

- :root 变量：--paper:#E8E1D0、--ink:#1A1714、--cinnabar:#A8322D、--ember:#D97A2B、--night:#1B2430、--scale:1。
- html/body：margin 0、height 100%、overflow hidden、背景墨黑。
- #stage：position absolute；left 50%；top 50%；width 1280px；height 720px；margin-left -640px；margin-top -360px；transform: scale(var(--scale))；transform-origin: center center；背景纸白；color 墨黑；font-family "Songti SC","SimSun",serif。
- 场景容器：position absolute；inset 0；[hidden]{display:none}。
- 标题/地图/VN 内部元素用 absolute + ui-layout 坐标写死（舞台坐标），不要用 flex 重排坐标。
- 按钮：min-width 44px；min-height 44px；背景透明；边框按状态；cursor pointer；:focus-visible 用 2px 朱砂 + 2px offset。
- [aria-disabled=true] 视觉降一级，但仍可点击弹提示。
- 竖屏：@media (orientation:portrait) and (max-width: 900px) 隐藏 #stage、显示 #orientation（全屏墨黑 + 纸白 18px 文案「请把手机横过来」）。
- prefers-reduced-motion: reduce 时 transition/animation 置 none。

**动作 3：engine.js 只做缩放**

- 文件头 IIFE，建立 window.XB；先只写 XB.engine.resize 与 initStage。
- 缩放：

      function resize() {
        var scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
        document.documentElement.style.setProperty("--scale", String(scale));
      }

- 监听 resize 与 orientationchange；只重算 --scale，不改任何游戏状态。
- DOMContentLoaded 时调用一次；?debug=1 时把 scale 写进 #debug。

**产出**：可打开的静态舞台；标题、地图、VN 三块都按坐标摆好（VN 先显示占位文案）。

**完成判据**：

- 1920×1080、1366×768、1280×720 三档打开，标题不出界、不出现滚动条。
- 844×390 下舞台整体缩到 0.542，文字可读，按钮仍 ≥44px（舞台坐标）。
- 390×844 竖屏只看到「请把手机横过来」。
- Console 无 error、无 404。

**常见坑**：

- 用 translate(-50%,-50%) 再 scale 会把缩放中心算错；本卡用负 margin + transform-origin center。
- 用 width:100vw 会让滚动条参与计算；html/body 必须 overflow hidden。
- 把坐标写成百分比或 flex，步骤二对不上稿。
- 忘记 [hidden]{display:none}，三个场景叠在一起。

---

### T1.2 story.js：章节元数据 + 序章试片（45 min）

**目的**：给状态机一份真实、可校验的剧情数据；只誊 20 句，冻结 id。

**输入**：docs/script/00-prologue.md 第 9–31 行、docs/script/README.md §7、本文件附录 A。

**动作**：

- 文件形态：

      (function (XB) {
        "use strict";
        XB.story = { version: 1, chapters: [ ... ] };
      })(window.XB = window.XB || {});

- 章节元数据 7 条，顺序固定：

| id | order | title | short | playable | nodes |
|---|---|---|---|---|---|
| prologue | 1 | 序章 · 于都 | 于都 | true | 21 个（p001–p020 + p900） |
| xiangjiang | 2 | 第一章 · 湘江 | 湘江 | false | [] |
| zunyi | 3 | 第二章 · 遵义 | 遵义 | false | [] |
| jinsha | 4 | 第三章 · 金沙江 | 金沙江 | false | [] |
| luding | 5 | 第四章 · 泸定 | 泸定 | false | [] |
| grass | 6 | 第五章 · 草地 | 草地 | false | [] |
| wuqi | 7 | 终章 · 吴起 · 点名 | 吴起 | false | [] |

- 节点形状（本步只允许 line / end）：

      { type: "line", id: "p001", speaker: "旁白", text: "1934年10月17日，于都河上起雾。", bg: "yudu_river" }
      { type: "end", id: "p900", next: "map" }

- p001 带 bg:"yudu_river"；p006 带 bg:"yudu_night"；其余 line 不带 bg（沿用上一句）。
- speaker 只取：旁白、满崽、娘、老周。
- 20 句逐字誊写；标点、引号、数字写法一律照抄。
- p900 的 next 写 "map"（步骤三改成 "xiangjiang" 前先写迁移）。

**产出**：project/story.js，约 70 行。

**完成判据**：

- smoke S09–S14 全过：7 章顺序、21 节点、id 唯一、类型合法、end.next 合法、20 句与源 md 全等。
- 试片文字合计与源文件第 9–31 行一致（不含说话人前缀）。
- 数据里没有 flag、没有选项、没有小游戏、没有史实注正文。

**常见坑**：

- 把第 14/15/24 行的空行或 [[bg]] 指令也当成句子，多出 3 个节点。
- 把「满崽」写成「我」；说话人必须是名字，旁白才用「旁白」。
- p006 忘记切 bg，整段停在于都河。
- 复制粘贴时把「按完才想起」改成「抹完才想起」——试片里没有这句，但同类改动一律禁止。

---

### T1.3 XB.core：纯状态层（75 min）

**目的**：把“什么算合法状态、怎么前进、怎么序列化”从 DOM 里剥出来，能在 vm 里无头跑。

**输入**：state-schema 新契约、story.js、本卡 §4 的 S1。

**状态形状**（运行时）：

      {
        scene: "title",
        chapterId: "prologue",
        nodeId: null,
        flags: {},
        inventory: { door: false, items: [] },
        choices: [],
        codex: [],
        settings: { textSpeed: 30, textScale: 1, volume: 0.6, muted: false, reducedMotion: false, skipSeen: false },
        unlockedChapters: ["prologue"],
        ending: null,
        paused: false,
        stack: [],
        storageOk: true
      }

- 最后两个字段 paused、storageOk 是运行时字段，不进存档。
- stack 也不进存档。

**API（全部挂 XB.core，函数不碰 document/localStorage）**：

| 签名 | 返回 | 说明 |
|---|---|---|
| defaults() | state | 每次返回深拷贝；不得共享对象 |
| migrate(raw) | { save, issue } | 仅处理版本；v1 原样返回；version>1 返回 issue:"version-too-new" |
| normalize(raw) | { state, issue } | 合并默认值 + 校验；issue 取 null/"shape"/"chapter"/"node"/"scene" |
| currentChapter(state) | chapter 或 null | 按 chapterId 查 |
| locate(chapterId, nodeId) | { chapter, index, node } 或 null | 只查 playable 章节 |
| startChapter(state, chapterId, nodeId) | boolean | 校验通过则设 scene="vn"、重建 stack |
| currentNode(state) | node 或 null | stack 顶 |
| advance(state) | node 或 null | index++；到末尾弹栈；返回新当前节点（可能是 end） |
| serialize(state) | object | 只导出 10 个持久字段，见 §4 S1 与 schema |

**校验规则**：

- raw 不是对象 → issue "shape"。
- version 缺失或 ≠1 → 走 migrate；version>1 → "version-too-new"。
- scene 不在 8 个值内 → "scene"。
- scene="vn" 时：chapter 必须存在且 playable；nodeId 必须能 locate；否则 "chapter"/"node"。
- scene="map" 时：nodeId 必须为 null。
- scene="title" 时：nodeId 可为 null，也可保留一个可恢复的节点（给「继续」用）。
- flags 不是对象 → 重置为 {}，不报错（这是可恢复的缺省）；settings 逐键合并默认值；unlockedChapters 必须含 prologue。
- 校验失败不抛异常、不白屏；返回 issue 供引擎备份并提示。

**advance 的边界**：

- 当前是 end 节点时不再前进，直接返回该节点，由引擎执行 next。
- 栈空返回 null；本步只有一层栈，不允许出现“章节读完但没有 end”（check 会拦）。

**产出**：engine.js 上半（约 180 行），含注释分隔线。

**完成判据**：smoke S01–S08 全过；在 vm 里加载 engine.js 不会碰 DOM、不会报错。

**常见坑**：

- defaults() 返回同一个对象，后续测试互相污染。
- normalize 用 Object.assign 浅合并 settings，导致 saved.settings 覆盖默认键。
- nodeId 仍写成数字，或 locate 拿数组下标当 id。
- 校验失败时 throw，导致 file:// 下白屏（本步只允许返回 issue）。
- advance 在 end 节点上继续 index++，直接越界。

---

### T1.4 XB.engine：场景、输入、返回（90 min）

**目的**：把三个场景接起来，做到出口第一条：标题→地图→一段对话→返回。

**输入**：T1.1 的 DOM、T1.2 的 story、T1.3 的 core。

**API**：

| 签名 | 说明 |
|---|---|
| init() | 读 URL 参数、resize、载存档、渲染首场景、绑一次输入 |
| go(scene, payload) | 唯一场景入口：校验 → 记旧场景 → 设置 state → 切 hidden → render → save |
| render() | 按 state.scene 调 renderTitle/renderMap/renderVn |
| toast(text) | 文本用 textContent；2.5s 自动隐藏；同一时刻只留一条 |
| resize() | 只重算 --scale |
| bindInput() | document 级 pointerdown/click/keydown，只绑一次 |
| handleAction(action, el) | data-action 路由 |

**场景表**：

| scene | 本步状态 | 行为 |
|---|---|---|
| title | 实现 | 三项菜单；继续按钮按存档启用/禁用 |
| map | 实现 | 7 个站点；仅 prologue 可点；锁定站点 toast |
| vn | 实现 | 显示一句；点击/空格推进；到 p900 回地图 |
| choice | 未实现 | toast「选项场景由步骤三接入」并退回 vn/map |
| minigame | 未实现 | 同上 |
| result | 未实现 | 同上 |
| codex | 未实现 | 同上 |
| ending | 未实现 | 同上 |

- init 只处理 ?debug=1 与 ?reset=1（后者转发 T1.5）；?chapter/?minigame 本步不实现，留给步骤三/四。

**标题画面**：

- 开始：若存在存档，window.confirm 确认「已有进度，重新开始？」；确认后清主存档、回默认 state、go("map")。
- 继续：仅当存档里有可恢复的 chapterId+nodeId 且能 locate 时启用；点击 go("vn") 到该节点。
- 史实图鉴：toast「史实图鉴在步骤五接入」。
- 版本行显示「步骤一 · 人物虚构，非史料人物」。

**地图画面**：

- 由 story.chapters + MAP_STATIONS 生成 7 个 button（不用 innerHTML；createElement + textContent）。
- MAP_STATIONS 常量写在 engine.js，注释指向 ui-layout §1.5；坐标必须与文档一致。
- 站点内容：序号（01…07）、short 名、状态（可走/未接上）。
- 点 prologue：startChapter(state,"prologue","p001") → go("vn")。
- 点锁定站：toast「这一段还没接上」。
- SVG 路线用文档中心点；aria-hidden="true"。

**VN 画面**：

- 章节名用 chapter.title；bg 用 node.bg 更新 #vn-bg 的 data-bg（CSS 先给纯色底，步骤二换版画）。
- speaker 为「旁白」时隐藏 #vn-name；否则显示姓名。
- #vn-text 用 textContent；本步不做打字机，整句直接出现。
- 点击舞台空白、Space、Enter 都只推进一步；按钮点击不触发推进。
- 到 end 节点：go("map")，toast「序章 · 于都（试片）到此」。
- 暂停按钮与 Esc 打开 #pause；遮罩期间推进输入全部忽略。

**暂停遮罩**：

- 继续：关闭遮罩，不改存档。
- 返回地图：清 nodeId、scene="map"、go("map")（明确放弃本章当前位置）。
- 回到标题：scene="title"，保留 chapterId/nodeId 供「继续」；go("title")。

**输入路由（只绑一次）**：

| 输入 | 条件 | 动作 |
|---|---|---|
| pointerdown | 目标不是 [data-action] 且非按钮，scene=vn，未暂停 | advance |
| pointerdown | 目标在 [data-action] 内 | 交给 click，不推进 |
| click | [data-action] | handleAction |
| keydown Space/Enter | scene=vn、未暂停、焦点不在 button | advance；Space preventDefault |
| keydown Escape | scene=vn | 开关暂停 |
| keydown 1–3 | — | 本步不处理，留给步骤三 |
| keydown repeat | 任意 | 直接 return |

**产出**：engine.js 下半（约 220 行）；index.html 场景 DOM 完整。

**完成判据**：

- 标题→开始→地图→于都→连续点击读 20 句→回地图→回到标题，全程无报错。
- 暂停三键都有效；继续后仍停在原句。
- 用键盘 Space/Enter 也能走完；按钮可用 Tab 聚焦并回车触发。
- 点击按钮不会额外推进一句（重点测继续/暂停）。

**常见坑**：

- pointerdown 与 click 都绑在按钮上，一次点击推进两句。
- 每个场景各自绑 document，切场景后旧监听还在。
- 用 innerHTML 拼站点，引入注入风险且违反 C02。
- 暂停时 Space 仍推进。
- end 节点被当成普通 line 渲染成空白页。

---

### T1.5 存档：每 beat 保存、坏档降级（60 min）

**目的**：出口第二条——刷新恢复；同时保证任何存档异常都不白屏。

**输入**：state-schema §4/§5、T1.3 的 serialize/normalize/migrate。

**读取流程（loadSave）**：

1. ?reset=1：removeItem 主键，返回 null。
2. getItem 包 try/catch；抛错 → storageOk=false，toast「本次游玩不保存（浏览器限制）」，返回 null。
3. 无值 → null。
4. JSON.parse 包 try/catch；失败 → 备份原始串到 xiangbei.save.v1.bad（再包一层 try），toast「存档损坏，已重置」，返回 null。
5. migrate + normalize；issue="version-too-new" → 备份到 xiangbei.save.v1.bak，toast「存档来自更新版本，已备份」，返回 null。
6. 其他 issue → 备份 .bad，toast「存档与当前版本不匹配，已重置」，返回 null。
7. 成功 → 返回 state。

**写入流程（saveNow）**：

1. serialize(state) → JSON.stringify。
2. 长度 >4096 → 控制台 error + toast「存档异常」，不写（smoke 会先拦）。
3. storageOk=false 时直接 return（不再反复抛错）；setItem 包 try/catch；抛错 → storageOk=false，toast 一次，后续不再刷屏。
4. ?debug=1 时把字节数写进 #debug。

**启动场景判定**：

| 存档 | 行为 |
|---|---|
| 无 | title；继续禁用 |
| scene=title | title；继续可用（若节点可 locate） |
| scene=map | map |
| scene=vn | 直接恢复到该句（不经过标题） |
| 任何 issue | title；继续禁用；已 toast |

**保存点**：

- go() 成功后（title/map/vn 都存，title 保留 nodeId 供继续）。
- 每次 advance 后（含推进到 end 的那一步）。
- 暂停开关不存。
- 设置变更（本步无设置 UI，函数留空不写）。

**测试步骤**：

- 走到 p010（第 10 句「家在人身上。」）刷新：应自动回 vn 并显示同一句。
- 走到 p020 再点一下：应回地图并 toast；刷新应停在地图。
- 回标题再点继续：应回到离开时的句子。
- DevTools 把存档 nodeId 改成 "p999"：刷新应提示「存档与当前版本不匹配」并回标题，不白屏。
- 把 version 改成 2：应备份 .bak 并提示。
- 把值改成 "{oops"：应备份 .bad 并提示。

**产出**：engine.js 存档段；state-schema 已在前置任务更新。

**完成判据**：上述 6 条全过；localStorage 里主键内容可读、字段与 §1 示例一致；坏档三次测试都没有白屏。

**常见坑**：

- 启动时先 save 再 load，把好档覆盖成默认档。
- 在 pointerdown 时保存，但 state 还没 advance，刷新回退两句。
- 备份键写成同一个，互相覆盖。
- localStorage 抛错被空 catch 吞掉，用户以为存上了。
- 存档带 stack/paused，读回来结构对不上。

---

### T1.6 art.js / minigames.js 边界占位（15 min）

**目的**：把六个运行文件的边界先立住，避免步骤二/四再改 index.html 的脚本顺序。

**动作**：

- project/art.js：

      (function (XB) {
        "use strict";
        // 步骤二：程序化版画、纸纹、剪影。本步只占位。
        XB.art = {};
      })(window.XB = window.XB || {});

- project/minigames.js：同形，注释写「步骤四：4 关 + 共享限时分配引擎；本步只占位」，XB.minigames = {}。
- index.html 已按 art → story → minigames → engine 引入。
- engine.js 不得引用 XB.art / XB.minigames（本步没有任何消费方）。

**完成判据**：check-build C07 通过；两文件被加载且控制台无「XB.art is undefined」。

**常见坑**：

- 顺手把 minigame-tuning 的数值表抄进 minigames.js——步骤四才做，现在抄会与文档双源。
- 在 art.js 里画 Canvas 占位——本步不做 Canvas，DPR 适配是步骤二/四的事。

---

### T1.7 开发期工具：红线复用 + 静态检查 + 冒烟（75 min）

**目的**：本机 shell 不稳定，回归不能靠肉眼；把“能自动判死”的部分先自动化。

**动作 1：tools/redlines.js**

- module.exports = { BANNED, REAL }；内容从 check-script.js 原样搬走，一个字不改。
- check-script.js 删除两个数组，改为 require("./redlines")；其余逻辑不动。
- 跑 check-script，输出必须仍是「OK：7 个剧本文件；…」。

**动作 2：tools/check-build.js（静态，C01–C09）**

| 编号 | 检查 | 失败示例 |
|---|---|---|
| C01 | 四个运行时 JS 用 vm.Script 编译通过 | 少一个右括号 |
| C02 | 去注释后无 fetch(/XMLHttpRequest/import(/type="module"/eval(/innerHTML/document.write | 抄了 fetch 读剧本 |
| C03 | index.html 必需 id 齐全；脚本顺序 art→story→minigames→engine；无内联 script、无 on* | 漏 vn-text |
| C04 | 所有 script/link src 以 ./ 开头；无 http(s)://；favicon 允许 data: | 用了 CDN |
| C05 | JS 总 gzip ≤150KB；CSS ≤30KB | 塞了未压缩大数组 |
| C06 | story.js 原文无 BANNED/REAL | 正文出现真实人物 |
| C07 | art.js/minigames.js 存在且为空命名空间；engine.js 不出现 XB.art/XB.minigames | 提前接小游戏 |
| C08 | state-schema 含 scene 与字符串 nodeId 与 beat 存档；ui-layout 含 §1.5；script/README 含 §7 | 跳过 T1.0 |
| C09 | 无 .mp3/.wav/.png/.jpg 引用；无 audio/img 标签 | 偷偷放素材 |

- 读文件用 __dirname 推根目录，不依赖当前工作目录；输出一行一项，失败 process.exitCode=1。
- C07/C08 是步骤一边界检查：步骤二实现 art.js、步骤四实现 minigames.js 时同步放宽/替换，不要直接删掉整条检查。

**动作 3：tools/smoke.js（vm 无头，S01–S14）**

| 编号 | 断言 |
|---|---|
| S01 | defaults 形状正确：version 1、scene title、nodeId null、8 个场景 |
| S02 | 合法 title 存档 normalize 成功 |
| S03 | version=2 → issue "version-too-new" |
| S04 | scene=vn + 不存在节点 → issue "node" |
| S05 | locate p001=0、p020=19、p900=20；未知 id 返回 null |
| S06 | startChapter 后 scene=vn、nodeId=p001、stack 长度 1 |
| S07 | 连续 advance：20 个 line 后到 p900；再 advance 仍返回 p900 |
| S08 | serialize→JSON→normalize 往返，10 个持久字段全等 |
| S09 | 7 章 id/顺序/playable 正确；锁定章 nodes 为空 |
| S10 | 21 个节点 id 唯一；类型仅 line/end；end.next 合法 |
| S11 | p001/p006 的 bg 正确；其余 line 不带 bg |
| S12 | 20 句与 docs/script/00-prologue.md 第 9–31 行逐字全等 |
| S13 | 所有 text 非空、≤40 字；无 BANNED/REAL |
| S14 | 存档 JSON <4096 字节；只含 10 个键 |

- 加载方式：vm.createContext，sandbox.window = sandbox；document 只需 addEventListener 空函数；按序执行四个脚本；不调用 engine.init。
- 输出「OK 14 checks」；失败逐条列出，exitCode=1。

**动作 4：运行与负例**

- 命令：node project/tools/check-build.js；node project/tools/smoke.js；node project/tools/check-script.js docs/script。
- 本机 shell 不可用时，用 run_code 的 import(pathToFileURL(...)) 执行，输出原样抄进 §11.2。
- 负例不靠改生产文件：smoke 内已含 S03/S04/S09 失败输入；再手工在 run_code 里调 normalize({version:2}) 确认返回 issue，记录输出。

**完成判据**：三工具全绿；check-build 故意把 index.html 的 vn-text 改名（改完立即还原）能报 C03；smoke 改一个节点 id 能报 S10（改完立即还原）；两次负例都记录。

**常见坑**：

- check-build 用 process.cwd() 拼路径，从根目录跑就找不到 project/。
- vm 沙箱里 window 与 global 不是同一个对象，XB 挂不上。
- 扫描前不去注释，注释里的 fetch 造成误报。
- 工具被 index.html 引用，污染运行时（C07 应拦）。

---

### T1.8 浏览器实测与留证（60 min）

**目的**：出口三条只能用浏览器证明；没跑过就不许写“能玩”。

**矩阵**：

| # | 环境 | 操作 | 期望 | 证据 |
|---|---|---|---|---|
| B1 | Chrome 1920×1080 | 打开 file:///…/project/index.html | 标题居中、无滚动条、无 404 | 1920-title.png |
| B2 | Chrome 1366×768 | 同上 | 不出界、文字不糊 | 1366-title.png |
| B3 | Chrome DevTools 844×390 触摸模拟 | 打开→开始→地图→于都 | 缩放 0.542；点按推进；站点可点 | 844-map.png / 844-vn.png |
| B4 | Chrome 390×844 竖屏 | 打开 | 只显示「请把手机横过来」 | 390-portrait.png |
| B5 | Chrome file:// | 走到 p010 刷新 | 自动回 vn，显示「家在人身上。」 | 010-refresh.png + 存档截图 |
| B6 | Chrome file:// | 走完 20 句 | 回地图 + toast；刷新停地图 | 020-end.png |
| B7 | Chrome file:// | Esc/暂停三键 | 继续回原句；返回地图清节点；回标题后「继续」可恢复 | 暂停与继续各一张 |
| B8 | Chrome file:// | 手改存档 nodeId=p999 / version=2 / "{oops" | 三次都 toast+回标题，不白屏 | 3 张 Console/页面图 |
| B9 | Chrome file:// | 键盘 Space/Enter/Esc/Tab | 可走完；焦点环可见；按钮回车触发 | 不截图，记录 |
| B10 | 本地 http://（python -m http.server --directory project 8080） | 同 B1/B5 | 与 file:// 一致；Console 无 404 | 记录 URL 与截图 |

- 每档都开 Console（Errors + Warnings），截图或抄全文；出现 404/error 即失败，先修再继续。
- 记录浏览器版本、系统缩放、窗口尺寸；手机模拟开启 touch。
- 证据放 docs/evidence/step-01/（gitignored），§11.3 写文件名与结论。
- 若本机无法起 http 服务，B10 标 D（未验证），并在 §11.5 写明原因；不得写成通过。

**完成判据**：B1–B9 全过；B10 通过或明确标 D；§11.3 每行有证据/结论。

**常见坑**：

- 只测 1920 就写“适配完成”。
- 刷新测试前没保存，回退到标题却以为恢复失败。
- 用 file:// 时缓存旧 JS，改完没硬刷新。
- Console 过滤掉 404 不看，漏掉 favicon。

---

### T1.9 复核、状态同步、提交（30 min）

**动作**：

1. 重跑三工具，输出贴进 §11.2。
2. 回填 §11.1 状态表、§11.3 浏览器证据、§11.5 偏差（没有就写“无”）。
3. 更新 .claude/CLAUDE.md：
   - 步骤表「一 工程骨架」改 ✅，出口列写：标题→地图→对话→返回；刷新恢复；控制台无报错；tag step-1-done。
   - 「当前进度」：步骤一完成日期；已有资产加 project/ 六个文件与三个工具；建议下一步改步骤二。
   - 常用命令：Start-Process ".\project\index.html"；python -m http.server --directory project 8080；node --check project/engine.js 等四条。
4. 提交：git add project docs step .claude → commit「feat: 工程骨架（步骤一）」→ tag step-1-done。
5. 若 git 仍不可用：按 step-00 §11.6 的手工对象法提交，记录 commit hash；真 shell 恢复后补 git fsck / git status。

**完成判据**：tag 存在；CLAUDE.md 步骤表与当前进度一致；§11 无空项；工作区无未跟踪的临时文件。

**常见坑**：

- 把 docs/evidence 截图一起提交（.gitignore 已忽略，但 git add -f 会破例）。
- 提前把步骤二标 🚧。
- tag 打在错误的 commit 上。

---

## 6. 时间盒

| 任务 | 标准 | 压缩 | 压缩版取舍 |
|---|---|---|---|
| T1.0 文档 | 30 | 20 | 三份都改，但地图只写坐标表，不画路线说明 |
| T1.1 舞台 | 60 | 40 | 只做标题/地图/VN 三块，不做竖屏插画 |
| T1.2 数据 | 45 | 30 | 20 句不减；7 条元数据仍写全，只省注释 |
| T1.3 core | 75 | 45 | 保留全部 API；校验只做 shape/chapter/node/scene |
| T1.4 场景 | 90 | 60 | 暂停只留继续/回标题；地图不做锁定态文案 |
| T1.5 存档 | 60 | 35 | 只测 p010 刷新 + 坏 JSON；version=2 留到步骤三 |
| T1.6 占位 | 15 | 5 | 两文件各 6 行 |
| T1.7 工具 | 75 | 40 | check-build 只做 C01–C04；smoke 只做 S01–S09 |
| T1.8 实测 | 60 | 20 | 只测 1920 + 844 + file:// + 刷新 |
| T1.9 复核 | 30 | 15 | 记录从简，tag 必打 |
| **合计** | **540** | **310** | 约 5h10，允许 +10% |

压缩版仍必须满足出口三条；被砍的检查在 §11.5 记为“欠账”，步骤二开工前补。

---

## 7. 验收清单

| # | 验收项 | 判据 | 证据 | 结果 |
|---|---|---|---|---|
| E1 | 出口·标题→地图→对话→返回 | 标题点开始进地图；点于都进对话；暂停返回地图 | B1–B3、B7 | ☑ |
| E2 | 出口·刷新恢复 | p010 刷新自动回同一句；p020 后刷新停地图 | B5、B6 | ☑ |
| E3 | 出口·控制台无报错 | Console 0 error、0 404、0 未捕获拒绝 | B-console（12 项日志汇总） | ☑ |
| E4 | 三档不出界 | 1920/1366/844×390 均无滚动条、无遮挡 | B1–B3 | ☑ |
| E5 | 竖屏提示 | 390×844 只显示横屏提示 | B4 | ☑ |
| E6 | file:// 可玩 | 双击 index.html 全流程走通 | B1–B9（file://） | ☑ |
| E7 | 键盘与触摸 | Space/Enter/Esc/Tab 与触摸点按均有效 | B3、B9 | ☑ |
| E8 | 坏档不白屏 | 三种坏档都触发提示并回标题 | B8 | ☑ |
| E9 | 试片逐字 | 20 句与源 md 全等 | smoke S12 | ☑ |
| E10 | 静态检查 | check-build 9 项全绿 | §11.2 输出 | ☑ |
| E11 | 无头冒烟 | smoke 14 项全绿 | §11.2 输出 | ☑ |
| E12 | 技术红线 | 无 fetch/ESM/CDN/内联 script/innerHTML | check-build C02–C04 | ☑ |
| E13 | 状态同步与提交 | CLAUDE.md 已更新；tag step-1-done | §11.6 | ☑ |

**不算通过的情形**：只测 http 不测 file://；只测鼠标不测触摸；刷新后回到标题却称“恢复”；Console 有 404 但页面能开；试片少一句但“意思对”。

---

## 8. 风险与返工触发

| 风险 | 触发信号 | 处置 | 回退点 |
|---|---|---|---|
| 节点 id 在步骤三被重排 | 存档 p010 落到别的句子 | 冻结 id；只追加不复用；删除节点必须写迁移 | S1、S6 |
| 每 beat 存档卡顿 | 低端机点击后 >100ms 才出字 | 测 performance.now；>8ms 改 120ms 合并写 | S3 |
| 地图坐标与步骤二插画冲突 | 插画压住站点或路线穿字 | 只改 ui-layout §1.5，再改 CSS/JS；同一次提交 | S7 |
| shell 持续不可用 | git/node 命令 0xC0000142 | 工具用 run_code 跑；提交用手工对象法；浏览器手动测 | step-00 §11.6 |
| file:// 下 Safari 禁用 localStorage | 打开即抛错 | storageOk=false + 一次性提示；不阻断游戏 | T1.5 第 2 步 |
| 范围蔓延到打字机/视觉 | 开始调字体、做淡入、做选项 | 停手；记入步骤二/三待办 | §9 |
| check-build 误报 | 注释里的 fetch 被算 | 扫描前剥注释；只对代码段 | T1.7 |
| “继续”语义混乱 | 点继续回到标题或从头开始 | 固定：继续 = 有节点回 vn，无节点回地图；标题存档保留节点 | S9 |

**返工阈值**：出口三条任一不过，本步不算完成；返工只改本步文件，不顺手改剧本/视觉。若需改 schema，先改 docs 再改代码，并同步 smoke。

---

## 9. 禁区（本步不要做）

- 不做打字机、逐字动画、自动播放、跳过已读（步骤三）。
- 不做选项 UI、限时条、旗标结算（步骤三）。
- 不做门板/弃物/渡船/攀索，不接 Canvas，不写 RULES（步骤四）。
- 不做史实图鉴界面与 7 张正文（步骤三/五）。
- 不做音频、口琴动机、AudioContext（步骤六）。
- 不做字体打包、版画纹理、剪影、纸纹（步骤二）。
- 不改 docs/script 的正文，不改 codex 文案，不改旗标名。
- 不引入任何框架、构建链、npm 运行时依赖、CDN、ES module、fetch。
- 不新增运行时 JS 文件（core.js/helpers.js/scenes.js 都不行）。
- 不做部署、不发视频、不打包 ZIP；不把截图/大文件提交进仓库。

---

## 10. 交接接口（下游从本步拿什么）

| 下游 | 拿什么 | 位置 | 备注 |
|---|---|---|---|
| 步骤二 视觉系统 | 舞台 id/class、三场景 DOM、CSS 变量、地图坐标、art.js 占位 | index.html、style.css、ui-layout §1.5 | 只换皮，不改场景结构；改坐标必须同改文档 |
| 步骤三 VN 引擎 | XB.core API、节点形状、id 规则、存档点、8 场景枚举、pause 语义 | engine.js、story.js、state-schema、script/README §7 | 追加节点与 choice/branch 类型；不改 p001–p020 |
| 步骤四 小游戏 | minigames.js 空壳、scene=minigame 入口、存档 schema | minigames.js、engine.js go() | RULES 与 4 关在步骤四写；数值只认 minigame-tuning |
| 步骤五 章节接入 | 7 章元数据、playable 开关、unlockedChapters、p900 临时 end | story.js | 删 p900 前写迁移；解锁规则在步骤五实现 |
| 步骤七 测试 | 三工具、?debug/?reset、浏览器矩阵、坏档样本 | project/tools、§11 | 把本步矩阵扩成 T01–T20 全量 |
| 步骤八 交差 | 静态根目录 project/、无构建、无外部请求 | project/ | 部署输出目录是 project/，不是仓库根 |

**给步骤三的三条硬约束**：

1. 不得重排 p001–p020；新节点从 p021 起或使用分支后缀。
2. 删除/改名 p900 必须写存档迁移：找不到节点时回本章第一句并提示。
3. branch 节点必须让 locate 返回完整帧路径，否则刷新恢复会错位。

---

## 11. 复核记录（执行时填写，不要留空）

> 复核日期：2026-11-01。执行人：Claude Code（AI 代理），用户复核。证据目录：docs/evidence/step-01/（gitignored）。

### 11.1 T1.0–T1.9 逐项状态

| 卡 | 判据 | 证据 | 结论 |
|---|---|---|---|
| T1.0 | 三份文档落地，代码未动 | docs/state-schema.md §1（scene/nodeId 字符串）、§2（默认值）、§4（beat 存档）、§5（v1 内部修订）；docs/ui-layout.md §1.5（地图坐标表）；docs/script/README.md §7（节点 id 规则） | ✅ |
| T1.1 | 三档不出界、无滚动条 | B1 1920×1080 缩放 1.5；B2 1366×768 缩放 1.067；B3 844×390 缩放 0.542；boundingBox 均在视口内 | ✅ |
| T1.2 | 20 句逐字、21 节点 | smoke S10（21 节点、id 唯一、end.next=map）、S12（20 句与源 md 逐字全等） | ✅ |
| T1.3 | core 无 DOM 可跑 | smoke 在 vm 中只给 document 一个 addEventListener 桩，S01–S14 全绿；core 段不触碰 DOM/localStorage | ✅ |
| T1.4 | 标题→地图→对话→返回 | B1–B3、B7（暂停三键）、B7b（开始确认） | ✅ |
| T1.5 | 刷新回原句、坏档不白屏 | B5（p010 刷新同句）、B6（走完回地图、刷新停地图）、B8（node/version/parse 三种坏档均提示+备份+回标题） | ✅ |
| T1.6 | 两占位文件存在 | art.js → XB.art={}、minigames.js → XB.minigames={}；check-build C07 通过 | ✅ |
| T1.7 | 三工具全绿 + 负例 | §11.2；负例：删 #vn-text → C03 红（exit 1），p020→p021 → S05 红（exit 1），恢复后复绿 | ✅ |
| T1.8 | B1–B9 全过 | 自动化 12 项全绿（B1–B10、B7b、B-console），见 §11.3 | ✅ |
| T1.9 | tag 与状态同步 | .claude/CLAUDE.md 步骤表与当前进度已更新；commit 与 tag 见 §11.6 | ✅ |

### 11.2 机械检查（原样粘贴输出）

本机 shell 与子进程创建不可用（0xC0000142 / spawn EPERM），三个脚本在 run_code 的 Node 进程内用 vm 原样执行，输出与退出码如下（cmd 相同：`node project/tools/check-build.js` 等）。

```text
$ node project/tools/check-build.js        # exit 0
C01 OK 4 个 JS 可编译
C02 OK 无 fetch / XHR / ESM / eval / innerHTML / document.write
C03 OK 必需 id 齐全、脚本顺序 art → story → minigames → engine
C04 OK 全部资源相对路径，无 CDN
C05 OK JS gzip 9KB / CSS gzip 2KB
C06 OK story.js 无禁用词与真实人物
C07 OK 占位命名空间就位，engine.js 不引用未实现模块
C08 OK 三份文档已同步（state-schema / ui-layout §1.5 / script README §7）
C09 OK 无音频/图片文件引用
OK：构建自检 9 项全绿
```

```text
$ node project/tools/smoke.js              # exit 0
S01 OK defaults 形状与持久字段
S02 OK 合法存档 normalize 通过
S03 OK version-too-new
S04 OK scene=vn 但节点不存在
S05 OK locate 下标与未知节点
S06 OK startChapter 重建栈
S07 OK 20 句推进到 end 后不再前进
S08 OK serialize → JSON → normalize 往返
S09 OK 七章元数据
S10 OK 序章节点 id 唯一、类型合法
S11 OK 背景指令落在 p001 / p006
S12 OK 20 句与剧本源逐字一致
S13 OK 台词长度与红线
S14 OK 存档体积与字段
OK：纯状态层烟测 14 项全绿
```

```text
$ node project/tools/check-script.js docs/script   # exit 0
OK：7 个剧本文件；禁用词 0；真实人物 0；选项缺项 0；结构完整；声明已标注
```

负例（验证工具会红，随后恢复文件并复跑全绿）：

```text
# 1) index.html 把 id="vn-text" 改成 id="vn-text-broken"
× C03 index.html 缺 #vn-text          → exit 1
# 2) story.js 把 p020 改成 p021
× S05 locate 下标与未知节点：...        → exit 1
# 3) 两处恢复后
OK：构建自检 9 项全绿 / OK：纯状态层烟测 14 项全绿
```

### 11.3 浏览器证据

环境：Windows + 系统 Microsoft Edge 156.0.4314.50（Playwright 1.64.1，executablePath 直连，headless）+ Python 3.14 http.server；全部由 `docs/evidence/step-01/playwright-step1.js` 自动执行，结果原样写进 `step1-playwright.json`。

| # | 环境/版本 | 操作 | 结果 | 文件 |
|---|---|---|---|---|
| B1 | file:// / 1920×1080 | 打开标题，读标题/副题/继续按钮态 | 舞台 1920×1080，标题「向北」，空档时「继续」aria-disabled=true | step-01/B1-title-1920x1080.png |
| B2 | file:// / 1366×768 | 打开标题，量 boundingBox 与 --scale | 不出界，缩放 1.067 | step-01/B2-title-1366x768.png |
| B3 | file:// / 844×390 / hasTouch | 点开始→地图→于都→触摸点按 9 次 | 到 p010「家在人身上。」，缩放 0.542 | step-01/B3-touch-p010-844x390.png |
| B4 | file:// / 390×844 竖屏 | 打开 | 只显示「请把手机横过来」，舞台隐藏 | step-01/B4-portrait-390x844.png |
| B5 | 同上（B3 页面） | 刷新 | 回到 p010「家在人身上。」，存档 nodeId=p010 | 由 step1-playwright.json 记录 |
| B6 | 同上 | 再点 11 次走完 20 句，刷新 | 回地图 + toast「序章 · 于都（试片）到此」，刷新停地图 | step-01/B6-map-toast-844x390.png |
| B7 | 同上 | Esc 暂停→继续；暂停→返回地图；暂停→回到标题→继续 | 三键正常，「继续」回到 p001 | 由 step1-playwright.json 记录 |
| B7b | 同上 | 有进度时点「开始」并取消/确认 | 弹「已有进度，重新开始？」；取消不动档，确认后进地图 | 由 step1-playwright.json 记录 |
| B8 | 同上 | 手写 nodeId=p999 / version=2 / "{oops" 后刷新 | 各自 toast、备份 .bad/.bak、回标题，无白屏 | step-01/B8-bad-save-title-844x390.png |
| B9 | 同上（?reset=1） | Space/Enter 推进、Esc 开关暂停、Tab | 两句推进正确，暂停开合正常，Tab 焦点在按钮上 | 由 step1-playwright.json 记录 |
| B10 | http://127.0.0.1:8123 / 1366×768 | Python http.server + 开始→于都→Space→刷新 | 与 file:// 一致 | step-01/B10-http-1366x768.png |
| B-console | 全部页面 | 收集 console.error / pageerror / requestfailed / ≥400 | 0 error、0 404、0 未捕获拒绝 | 由 step1-playwright.json 记录 |

### 11.4 三读（代码版）

| 读法 | 范围 | 要找什么 | 结果 |
|---|---|---|---|
| 自读 diff | 四个 JS + index.html | 重复监听、innerHTML、写死路径、空 catch | 无 innerHTML/空 catch；pointerdown 只推进、click 只认 data-action，按钮不会一次走两句；`XB.art`/`XB.minigames` 未被 engine 引用。修掉 1 处：隐藏场景里的按钮会吞 Space（isControlFocused 增加可见性判断）；closePause 不再把焦点还给暂停按钮。 |
| 对抗读 | 存档段 | 坏 JSON、version=2、nodeId=p999、localStorage 抛错 | B8 三例实测通过（备份+提示+回标题）；localStorage 抛错分支走 catch→storageOk=false→一次性 toast，未在真实隐私模式实测（标 C，欠账）。 |
| 冷启动读 | 全新浏览器/无缓存 | 首次打开、开始、刷新、返回 | B1/B3/B9 均为全新 context；?reset=1 空档首开、播放、刷新、返回标题全部通过。 |

### 11.5 偏差与欠账

| 项 | 计划 | 实际 | 处置 |
|---|---|---|---|
| 持久字段数 | 计划正文写“10 个持久字段” | 加入 scene 后为 11 个（附录 B 已含 scene） | 以 state-schema 与代码为准，11 个；smoke S01/S14 固化 |
| 浏览器 | Chrome/Edge/Safari（步骤七三项） | 本步用系统 Edge 156 + Playwright 1.64.1（无自带 Chromium） | 本步只证明 Chromium 内核；Chrome/Safari 留步骤七 |
| 触摸 | 真机触摸 | Playwright `touchscreen.tap`（hasTouch 模拟） | 真机留步骤七；引擎只用 pointerdown，无 hover 依赖 |
| 本地 http | python -m http.server 8080 | 同命令改用 8123 端口，B10 实测通过（非 D 项） | 端口差异记录，不改文档命令 |
| 存储异常 | 隐私模式/file:// 禁 localStorage | 代码有 catch→storageOk=false→一次性提示；未实测隐私模式 | 记欠账，步骤七补 |
| 执行中发现 | — | 点「于都」进对话后焦点留在隐藏按钮上，Space 无效 | 已修 isControlFocused（可见性判断）；B9 覆盖 |
| 执行中发现 | — | 暂停「继续」后焦点回到暂停按钮，Space 会再开暂停 | 已改为 blur，B9 覆盖 |
| 证据脚本 | 手测截图 | 全部用 `docs/evidence/step-01/playwright-step1.js` 自动跑，结果 json 留档 | 脚本 gitignored；步骤七扩成 T01–T20 |

### 11.6 提交

- 首版提交（代码 + 文档）：`feat: 工程骨架（步骤一）`，commit `d0cdedabb8cd40ca1fb96dfda80cad6f5a395f4c`（short `d0cdeda`），main 分支，15 files changed / +2820 −27。
- 复核回填（本节）：docs 提交，见 `git log -1 --stat`；tag `step-1-done` 指向该提交，即 `git rev-parse step-1-done^{commit}` == `git rev-parse HEAD`。
- tag：与 `step-0-done` 一致用轻量 tag（`.git/refs/tags/step-1-done` 直接写 commit hash，无 tag 对象）。
- 命令：`git add project docs step .claude` → `git commit -m "feat: 工程骨架（步骤一）"` → `git tag step-1-done`；首版提交后 `git status --porcelain` 为空。回填本节为单独 docs 提交，随后 `git tag -f step-1-done` 前移，使 `git rev-parse step-1-done^{commit}` == `git rev-parse HEAD`。
- 执行方式：本机 shell 仍 0xC0000142、受限沙箱子进程 spawn EPERM，故用一次 `run_code`（danger-full-access）内 `child_process.spawnSync` 调用 `C:\Program Files\Git\cmd\git.exe`，cwd 为项目根；未走 pwsh，也未手工写 git 对象。
- 未入库：`docs/evidence/`、`node_modules/`、`my-playwright-project/`、`screenshots/`、`*.zip` 均被 `.gitignore` 排除；工作区提交后 clean。

---

## 附录 A　序章试片节点表（p001–p020 + p900）

| id | 源文件行 | speaker | bg | 开头（全文以源文件为准） |
|---|---|---|---|---|
| p001 | 9 | 旁白 | yudu_river | 1934年10月17日，于都河上起雾。 |
| p002 | 10 | 旁白 | — | 雾里看不见对岸，只看得见火把。 |
| p003 | 11 | 旁白 | — | 河上有一座浮桥。 |
| p004 | 12 | 旁白 | — | 桥板是各家送来的 |
| p005 | 13 | 旁白 | — | 有人问，寿材也拿去搭桥？ |
| p006 | 16 | 旁白 | yudu_night | 我家的门，是村里最后一扇整门。 |
| p007 | 17 | 旁白 | — | 门上有我刻的身高线 |
| p008 | 18 | 旁白 | — | 娘把锯子架上门轴。 |
| p009 | 19 | 满崽 | — | 娘，门没了，还像个家吗？ |
| p010 | 20 | 娘 | — | 家在人身上。 |
| p011 | 21 | 娘 | — | 你要走远路。 |
| p012 | 22 | 娘 | — | 路上要是想家 |
| p013 | 23 | 娘 | — | 路要从家门口开始。 |
| p014 | 25 | 旁白 | — | 老周在祠堂门口点人。 |
| p015 | 26 | 老周 | — | 满崽，名字比枪重。 |
| p016 | 27 | 旁白 | — | 他念一个名字，队伍里有人应。 |
| p017 | 28 | 旁白 | — | 我抬头看他。 |
| p018 | 29 | 满崽 | — | 我记一下。 |
| p019 | 30 | 旁白 | — | 那一夜，我把全连的名字抄了一遍。 |
| p020 | 31 | 旁白 | — | 名字写歪了，我用指甲刮掉重写。 |
| p900 | — | end | — | next=map |

**核对**：源文件第 9–31 行共 23 行，其中第 14、15、24 行是 [[bg]] 指令与空行，其余 20 行是 line；p001–p020 与之一一对应。

---

## 附录 B　p010 存档样例（写入 state-schema 后以此为准）

    {
      "version": 1,
      "scene": "vn",
      "chapterId": "prologue",
      "nodeId": "p010",
      "flags": {},
      "inventory": { "door": false, "items": [] },
      "choices": [],
      "codex": [],
      "settings": {
        "textSpeed": 30,
        "textScale": 1,
        "volume": 0.6,
        "muted": false,
        "reducedMotion": false,
        "skipSeen": false
      },
      "unlockedChapters": ["prologue"],
      "ending": null
    }

---

## 附录 C　步骤一完成后的文件树（只列本步相关）

    project/
    ├─ index.html
    ├─ style.css
    ├─ engine.js
    ├─ story.js
    ├─ art.js
    ├─ minigames.js
    └─ tools/
       ├─ check-script.js      （已改为 require redlines）
       ├─ count-words.js       （未改）
       ├─ redlines.js          （新）
       ├─ check-build.js       （新）
       └─ smoke.js             （新）

    docs/state-schema.md      （scene / nodeId / beat 存档 / v1 修订）
    docs/ui-layout.md         （§1.5 地图）
    docs/script/README.md     （§7 节点 id）
    step/step-01-工程骨架.md  （本文件，回填 §11）
