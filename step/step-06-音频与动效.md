# 步骤六 · 音频与动效 执行计划（step-06）

> 本文件是步骤六的执行卡，不代替计划书、CLAUDE.md 或 docs/。只写计划，不在本文件里改代码。
> 范围与验收以 向北-项目计划书.md 为准；当前进度以 .claude/CLAUDE.md 为准；细节设定以 docs/ 为准。
> 冲突顺序：用户最新明确指令 > 向北-项目计划书.md > .claude/CLAUDE.md > docs/ > 本文件。

## 元信息

| 项 | 内容 |
|---|---|
| 所属步骤 | 六 · 音频与动效（计划书执行步骤 8） |
| 对应计划书 | 向北-项目计划书.md §8；分步骤表“步骤六 音频与动效” |
| 当前状态源 | .claude/CLAUDE.md（2026-11-02 更新） |
| 当前状态 | 步骤零至五 ✅（tag step-0-done … step-5-done）；步骤六 ⬜ 未开始；本文件只补计划，不改状态 |
| 出口（逐字引用 CLAUDE.md） | 无音频文件；首次点击后有声；静音持久化；无刺耳爆音 |
| 出口的技术侧补充（CLAUDE.md 技术栈） | Web Audio 合成；转场/闪白/震动/墨迹划名；静音开关；尊重 prefers-reduced-motion |
| 本步不做 | Chrome/Safari/真机/隐私模式/断网 ZIP/20 分钟三次完整计时——这些是步骤七 |
| 标准时间盒 | 640 分钟（10 小时 40 分） |
| 压缩时间盒 | 370 分钟（6 小时 10 分） |
| 不可逆动作 | 无。不部署、不覆盖线上、不改存档格式、不新增持久键、不改 story.js 节点、不打包字体/音频文件 |
| 计划文件 | step/step-06-音频与动效.md |

### 本步完成定义（四条同时成立才算完成）

1. 标题页在首次 pointerdown/keydown 之前没有任何 AudioContext，也没有声音；首次手势后能听到环境风声，音量/静音在刷新后保留。
2. 七章 14 个剧情背景 + title/map/ending 都有明确的环境床；4 个小游戏的关键动作有短音，但所有音效都是 Web Audio 合成，项目里没有音频文件、没有外部请求。
3. 场景切换有 480ms 墨色横擦；泸定桥首次进入有一次 120ms 软闪白；攀索有失误时 180ms/2px 震动；结局点名有墨迹划名；减少动效时这四类动效全部关闭或立即完成。
4. 工具链从 check-build 30 项 / smoke 40 项扩到 36 项 / 46 项并全绿；Edge 实测 B45–B56 有记录；0 console error；file:// 与本地 http 都能玩；本步不引入新的阻塞等待。

---

## 0. 任务卡总表

| 卡 | 任务 | 标准 | 压缩 | 主要产出 | 完成判据 |
|---|---|---:|---:|---|---|
| T6.0 | 音频与动效口径落 docs | 40 | 24 | docs/audio-system.md；ui-layout/visual-system/visual-reading/quality-bar/state-schema 的边界更新 | 9 床、12 cue、五音动机、动效上限都有唯一数字；docs 先于代码 |
| T6.1 | XB.audio 合成核心 | 120 | 70 | engine.js 的 XB.audio：懒创建、总线、噪声、包络、口琴动机 | 首次手势前无 AudioContext；首次手势后有声；无爆音；无 setInterval |
| T6.2 | 环境床与场景映射 | 90 | 52 | 9 个 bed；14 个 bg + title/map/ending 映射；800ms 交叉淡化 | 每个场景有床；切换不断裂；重复 setScene 不重启 |
| T6.3 | 事件音与设置接线 | 80 | 46 | 12 个 cue；minigames.onCue；音量/静音/暂停/图鉴 duck；可见性 suspend | 音效只由事件触发；静音持久；暂停/图鉴不继续大声；无自动播放 |
| T6.4 | XB.fx 与 fx 层 | 70 | 40 | index 的 #fx-layer；style 的 wipe/flash/shake；engine 的 XB.fx 与场景钩子 | 场景变化 480ms 横擦；软闪白 120ms；震动 180ms/2px；均不挡输入 |
| T6.5 | 墨迹划名 | 60 | 34 | ending 的 .is-struck 与 ::after 墨线；按行 90ms 错开 | 只划 is-missed；420ms；reduced 立即；刷新/重渲染不重复播放 |
| T6.6 | 工具与负例 | 50 | 28 | check-build C31–C36；smoke S41–S46；负例 N9–N12 | 36/36、46/46；四个负例分别报红；源文件 finally 恢复 |
| T6.7 | 浏览器实测 | 55 | 32 | Edge B45–B56；run-log；截图/录屏 | 每条有结果；B48/B49 标注 headless 例外；0 console error |
| T6.8 | 文档回填与证据 | 55 | 32 | docs/evidence/step-06/run-log.md；credits/quality-bar/test-cases 收尾；本文件 §11 | 文档与实现同数字；证据分级清楚；不把“写了”写成“能玩” |
| T6.9 | 复核、提交与 tag | 20 | 12 | CLAUDE.md 步骤表；提交 feat: 音频与动效（步骤六）；tag step-6-done | 36/46 通过；步骤七交接清楚；不部署 |

时间盒合计：标准 40+120+90+80+70+60+50+55+55+20 = 640 分钟；压缩 24+70+52+46+40+34+28+32+32+12 = 370 分钟。

---

## 1. 起点盘点（2026-11-02 基线）

### 1.1 已有资产

| 文件 | 体量 | 与本步相关的事实 |
|---|---:|---|
| project/index.html | 10,454 字符 / 209 行 | #stage 内已有 canvas#stage-art、title/map/vn/ending 四场景、pause、settings、codex、gallery、toast、debug；没有 #fx-layer，没有 audio 元素 |
| project/style.css | 40,190 字符 / 2,024 行 | :root 已有 --dur-fast 120ms / --dur-med 240ms / --dur-slow 480ms、--z-transition 60；已有 @media prefers-reduced-motion 与 html.reduce-motion 的全局关闭；结局 is-missed 目前只有静态 line-through |
| project/engine.js | 96,462 字符 / 3,056 行 | XB.core 纯状态层 + XB.engine DOM 层；settings 六项已存在；无 AudioContext / audio / sfx / suspend；applySettings 只处理字号与 reduce-motion；音量 input 只 saveNow |
| project/art.js | 47,086 字符 / 1,589 行 | SCENES 共 16：title、map、yudu_river、yudu_night + 12 个章节背景；本步不改 |
| project/story.js | 41,342 字符 / 1,009 行 | 277 节点；7 张 codex；ending 五卡；bg 共 17 次 / 14 个唯一值；无 sfx 字段；本步不改 |
| project/minigames.js | 77,535 字符 / 2,391 行 | 四关共享限时分配引擎；result 为 {gameId,reason,elapsed,carried,left,stats}；已有 callbacks，无 onCue |
| project/tools/check-build.js | 42,379 字符 / 965 行 | C01–C30 共 30 项 |
| project/tools/smoke.js | 29,643 字符 / 682 行 | S01–S40 共 40 项 |
| docs/visual-reading.md | 75 行 | §1 把音效与转场列为步骤六非目标；§6 写“音量步骤六才发声，先存值” |
| docs/ui-layout.md | 191 行 | §4 层级已有 --z-transition 60；§5 已有 reduced-motion 关闭闪白/震动；尚无 #fx-layer 实体 |
| docs/quality-bar.md | 58 行 | 音频底线四条、动效底线四条；本步要把细节数字补上 |
| docs/test-cases.md | 59 行 | T01–T30；T16 已覆盖音频/设置，但缺少首次手势、床映射、划名、工具负例的细项 |
| docs/credits.md | 70 行 | 已声明音频全部 Web Audio、无音频文件；尚无步骤六状态 |

### 1.2 当前 settings 与持久键

- settings 六项：textSpeed 30、textScale 1、volume 0.6、muted false、reducedMotion false、skipSeen false。
- 持久键固定 11 个：version、scene、chapterId、nodeId、flags、inventory、choices、codex、settings、unlockedChapters、ending。
- SAVE_VERSION = 1；本步不得加第 12 个键，不得改存档版本。音频运行态（ctx、bed、duck、是否已解锁）不落盘。

### 1.3 本步要补的缺口

1. 没有任何声音代码；AudioContext 从未创建。
2. 设置里的音量/静音只是存值；静音不会改变输出。
3. 16 个 art 场景没有环境声映射；14 个 story bg 没有声床。
4. 没有转场层、没有闪白、没有震动；标题卡只有 240ms 淡入。
5. 结局的已故名字只有静态 line-through，没有“墨迹划名”的仪式。
6. 小游戏没有音频事件回调；onCue 不存在。
7. check-build / smoke 不检查音频架构、生命周期、床映射、动效上限。
8. 只有 Edge headless 证据；音频主观听感、真实切后台、Safari/iOS 留步骤七。

### 1.4 不是本步的问题（不要顺手修）

- 20 分钟整章时长仍为 19:44，余量 16 秒；本步不裁剧情，步骤七实测再裁。
- 终章 820 字超预算、844×390 结局字号偏小、B16 逻辑热区 48×48 实际 26×26、字体未打包、Chrome/Safari/真机/隐私模式/断网 ZIP，全部留给步骤七或步骤八。
- 小游戏数值、四关胜负条件、story.js 节点数、ending 快照形状，本步不改。

---

## 2. 不变量（本步不许动）

### 2.1 数据与剧情

1. story.js 的 277 节点、232 line、13 choice、4 minigame、6 result、6 title、7 codex、2 interact、7 end 不改；不新增 sfx 字段。
2. 7 张史实注正文、五卡条件、ending 七名/四位数字、点名 45s 不改。
3. 4 个小游戏的规则、时限、配额、疲劳、失败结算不改；只在现有动作点加可选 onCue。
4. 存档 11 键、版本 1、4096B 上限、坏档处理不改；音频不写档。
5. 不新增真实人物台词、不合成人声、不做“打鬼子”音效、不把牺牲做成声音分数。

### 2.2 文件与加载

6. 仍只有六个运行时文件：index.html、style.css、engine.js、story.js、minigames.js、art.js；不新建 audio.js / fx.js / utils.js。
7. 全部经典 script + 全局 XB；不用 ES module、fetch、XHR、CDN、外部字体/图片/音频。
8. index.html 仍按 art → story → minigames → engine 顺序加载；XB.audio 与 XB.fx 写在 engine.js 内，位于 XB.core 之后、XB.engine 之前。
9. 只用 ./ 相对路径；file:// 可玩；没有音频文件、没有 data:audio、没有 base64 音频。

### 2.3 音频

10. AudioContext 只在首次用户手势（pointerdown 或 keydown）里创建/恢复；init、applySettings、render、模块加载都不得创建。
11. 不自动播放；静音时 master 为 0；音量/静音沿用现有 settings，不加持久键。
12. 不用 setInterval、不用 createScriptProcessor、不做逐帧音频循环；所有短音用 Web Audio 调度。
13. 所有增益变化用 setTargetAtTime / 短包络；不用方波/锯齿波；所有输出经 master + DynamicsCompressor 限幅；目标无爆音。
14. 音频不承载唯一信息：所有提示在 DOM 文字里也有；没有“听不到就过不了”的关卡。

### 2.4 动效

15. 新增且只新增一个 #fx-layer（stage 内，z-index var(--z-transition) 60，pointer-events none，aria-hidden true）；不新增第二张背景画布。
16. 转场、闪白、震动只改 transform/opacity；不触发布局；不改 hidden 时序；不挡输入。
17. 闪白 ≤120ms、单次 opacity ≤0.12、2s 内最多一次；震动 ≤180ms、≤2px；不做连续闪烁。
18. 墨迹划名只作用于 ending 的 .is-missed 行；不延迟数据、不影响焦点；保留 line-through 作无 JS 回退。
19. prefers-reduced-motion 或设置“减少动效”时：转场/闪白/震动 no-op；划名立即完成；文字打字机仍按步骤三既有规则立即显示。
20. 不改标题 96px、印章 360,150、菜单 120,360、10 类 xb-* 组件类名、单画布 #stage-art。

### 2.5 工具与文档

21. 先改 docs/audio-system.md 与相关 docs，再改代码；数字不在 docs 出现就不进代码。
22. check-build 从 30 扩到 36；smoke 从 40 扩到 46；不删旧检查、不放宽旧阈值。
23. 本步不部署、不打包 ZIP、不发布视频、不打 tag；执行完成并复核后才 tag step-6-done。

---

## 3. 产出清单（文件级）

| 路径 | 新建/修改 | 内容 | 验收 | 下游消费者 |
|---|---|---|---|---|
| docs/audio-system.md | 新建 | 音频图、9 床、12 cue、五音动机、生命周期、动效上限、测试口径 | T6.0；C31–C36 引用的数字都在此 | engine.js、test-cases、quality-bar、步骤七/八 |
| docs/ui-layout.md | 修改 | §4 层级补 #fx-layer；§5 reduced-motion 补划名；§1 表补特效层说明 | C08 / C35 | index/style |
| docs/visual-system.md | 修改 | §4 动效令牌补 transition/flash/shake/strike；§6.1 转场层；§8 性能边界 | C08 / C35 | style/fx |
| docs/visual-reading.md | 修改 | §1 非目标移除“音效与转场”；§6 音量说明改为步骤六已接入；加 §6.1 音频/动效行为 | C08 | engine、测试 |
| docs/quality-bar.md | 修改 | 音频行补“无文件/首次手势/静音持久/无爆音”；动效行补具体毫秒与像素；T01–T38 | C08 | 测试、验收 |
| docs/test-cases.md | 修改 | 标题改 T01–T38；新增 T31–T38 | T6.6 / T6.8 | 步骤七 |
| docs/credits.md | 修改 | §2 音频补“步骤六：XB.audio 合成、原创五音动机、无文件、无人声” | C08 保留“步骤二状态” | 交差材料 |
| docs/state-schema.md | 修改 | 头部补一句：音频运行态不落盘、11 键不变 | C08 / C30 | 存档说明 |
| project/index.html | 修改 | stage 内加 #fx-layer（wipe/flash 两个子层）；音量提示改成“首次点击后生效”；可选：减少动效旁注 | C03 / C35 | engine、style |
| project/style.css | 修改 | :root 动效令牌；#fx-layer/wipe/flash/shake；ending is-struck 墨线；reduced 下立即 | C10 / C35 / C36 | engine、ending |
| project/engine.js | 修改 | 插入 XB.audio 与 XB.fx；REQUIRED_IDS/cacheElements/init/render/showScene/设置/暂停/图鉴/结局/输入/debug 接线 | C31–C36；S41–S46 | 全游戏 |
| project/minigames.js | 修改 | 可选 callbacks.onCue；门板放置/弃物发船/渡船起航/攀索失误四处调用；无 onCue 时 no-op | C19/C22 不回归；S41 | engine |
| project/tools/check-build.js | 修改 | C31–C36 六项检查 | 36/36；N9–N12 报红 | 步骤七/八 |
| project/tools/smoke.js | 修改 | S41–S46 六项检查 | 46/46 | 步骤七/八 |
| docs/evidence/step-06/run-log.md | 新建（gitignored） | B45–B56 记录、工具输出、截图/录屏索引、主观试听记录 | T6.7 / T6.8 | 步骤七/八 |
| step/step-06-音频与动效.md | 本文件 | 计划与 §11 回填位 | 本步执行时回填 | 后续步骤 |
| .claude/CLAUDE.md | 修改（执行完成时） | 步骤六 ✅、tag、已知欠账 | T6.9 | 唯一状态源 |

明确不改：project/story.js、project/art.js、project/assets/（不存在字体/音频）、docs/script/*、docs/sources.md、docs/codex.md、docs/story-bible.md、docs/minigame-tuning.md、docs/chapter-integration.md。

---

## 4. 设计决策

### 4.1 音频决策 A1–A9

**A1 模块放在 engine.js，不新建文件。**
- 理由：audio 与 fx 都依赖 engine 的生命周期（手势、场景、暂停、结局），但又不是纯状态；独立文件会增加第七个运行时文件和加载顺序风险。
- 做法：在 engine.js 的 XB.core 赋值结束（基线 666 行）之后、XB.engine 注释（基线 668 行）之前插入两个独立对象 XB.audio 与 XB.fx；两者不读写 XB.core，只接收 engine 传入的 settings/场景/元素。
- 备选否掉：新增 audio.js/fx.js 会破坏“六文件”约束，并让 smoke 的加载列表多一项。

**A2 懒创建 AudioContext，首次手势才启动。**
- unlock() 是唯一创建/恢复入口：pointerdown 或 keydown 的处理器第一行调用；返回 false 表示浏览器不支持 Web Audio，engine 只 toast 一次“本机无法播放声音，游戏可继续”。
- init、applySettings、render、setScene 在 ctx 不存在时只记“期望状态”，不创建；cue 在未就绪时直接 no-op，不排队。首次 unlock 后按当前期望场景开床。
- ctx 创建后先 master.gain=0，再 setTargetAtTime 到目标；避免起播爆音。
- 兼容 webkitAudioContext；创建/恢复的 Promise 用 catch 接住，下一手势重试，不白屏、不阻塞游戏。

**A3 总线与限幅。**
- 图：ambienceBus / sfxBus / musicBus → masterGain → DynamicsCompressor → destination。
- master 目标增益 = muted ? 0 : 0.87 × volume；音量 0.6 时约 0.52；静音/取消静音用 30–60ms 平滑，不硬切。
- compressor：threshold −14dB、knee 10、ratio 4、attack 0.003s、release 0.25s；所有短音再套自己的 attack/release 包络。
- 每个 bed/cue 的 bus 增益有上限：ambience 0.35、sfx 0.55、music 0.40；单音源 ≤0.25；合成后峰值留在 0.9 以下。
- 不用方波/锯齿波；高频滤波；口琴用三角+正弦；鼓用正弦下滑+短噪声；不做刺耳的高频“叮”。

**A4 音色与原创五音动机。**
- 风：白噪声 → lowpass 600–700Hz，LFO 0.06–0.09Hz 轻摆；水：白噪声 → bandpass 700–1100Hz，LFO 0.12–0.18Hz；远鼓：低频正弦 45–50Hz + 极少噪声，不用定时鼓点；铁索：带通 1800–2600Hz 的低增益金属噪声，音量 ≤0.04。
- 口琴动机（原创，五声）：D4 293.66、F4 349.23、G4 392.00、A4 440.00、C5 523.25；起始 0 / 0.55 / 0.90 / 1.45 / 1.80s；时值 0.45 / 0.25 / 0.45 / 0.25 / 0.90s；三角+正弦、5Hz 轻颤、lowpass 1800Hz。
- 章节卡只取前三个音（D–F–G）；终章用完整五音；标题只环境风声；不做循环旋律、不引用任何现成歌曲。
- 噪声明度固定、循环 2s 缓冲只生成一次并复用；每个 bed 的 LFO/滤波独立。

**A5 9 个环境床覆盖全部场景。**
- 9 个 bed id：wind_title、yudu、xiangjiang、zunyi、jinsha、luding、grass、wuqi、ending。
- 映射：title/map → wind_title；yudu_river/yudu_night → yudu；xiangjiang_ford/xiangjiang_dawn → xiangjiang；zunyi_hall/zunyi_street → zunyi；jinsha_river/jinsha_night → jinsha；luding_bridge/luding_after → luding；grass_marsh/grass_dawn → grass；wuqi_dawn/wuqi_wall → wuqi；ending 场景 → ending。
- 切换用 800ms 等功率/线性淡化；新床 0→目标，旧床→0.0001 后 stop；重复 setScene 同 id 直接 return，不重启。
- 场景变化时最多两个 bed 同时存在；旧床 0.9s 后清理；反复切换 20 次后只剩 1 个 bed。

**A6 短音只由事件触发，不改 story.js。**
- 12 个 cue：chapter、choice-select、choice-timeout、codex、drum、rollcall-answer、rollcall-miss、result、door-place、boat-oar、climb-fire、ending。
- 触发点集中在 engine 的既有函数：showTitleCard、resolveChoice、超时结算、openCodex/openGallery、startInteract、点名答题/漏答、handleMinigameEnd、renderEnding。
- 小游戏只在四个真实动作点调用 callbacks.onCue（门板放置/移除、弃物发船、渡船起航/到达、攀索失误）；onCue 不存在时 no-op；cue 自带 80–120ms 节流，避免连点刷音。
- 不新增 story.sfx 字段；不在 render 每帧调用 cue；不把音效写进 result 数据。

**A7 设置、暂停、图鉴、可见性。**
- applySettings 调 XB.audio.applySettings(state.settings)：只更新目标音量/静音；ctx 不存在也安全。
- 音量滑杆 input 时实时更新（调 applySettings 或直接 applySettings 音频），静音按钮走既有 applySettings；两者都 saveNow，沿用 11 键。
- 暂停：engine 计算 duck 级别（暂停 0.3；图鉴/史实注 0.45；两者同时取更小值），调 XB.audio.setDuck(level)；关闭后恢复。duck 只压 ambience/music，不压已经排定的短音。
- 可见性：document.hidden → XB.audio.suspend() 并保留现有 openPause 逻辑；visible → XB.audio.resume()（仅 ctx 已存在）；不因切后台丢节点、不重启动画。
- 页面隐藏时若在标题/地图/结局，不强行开暂停；只 suspend 音频。

**A8 降级与调试。**
- 无 AudioContext：available=false；debug 显示 audio=off；游戏照常；首次手势后最多一次 toast，不重复。
- 自动播放被拒：unlock 捕获，标记 suspended；下一次手势重试；不弹错、不白屏。
- ?debug=1 的面板加一行 audio=locked|ready|suspended|off bed=… duck=… peak=…；locked 表示支持 Web Audio 但尚未首次手势，peak 由 analyser 在 updateDebug 时取一次，不做 rAF 电平表。
- ?fx=wipe|flash|shake|strike 仅开发调试：页面加载后 600ms 触发一次，不写档；strike 只在有 .is-missed 时生效，否则 toast 提示先生成结局。

**A9 音频证据边界。**
- headless 浏览器不能证明“听起来不刺耳”；B49 记录 debug peak、包络参数和本机扬声器试听结论，主观项在步骤七真机复核。
- Chrome/Safari/iOS 的自动播放、静音开关、切后台行为，本步只做 Edge；步骤七逐项过。

### 4.2 动效决策 M1–M7

**M1 一个 #fx-layer，不加第二张画布。**
- #stage 内、四个场景之后、#pause 之前，放一个 div#fx-layer.fx-layer（aria-hidden=true），内含 .fx-wipe 与 .fx-flash 两个空层。
- fx-layer 固定 inset:0、z-index:var(--z-transition) 60、pointer-events:none、overflow:hidden；不承载文字、不参与布局、不接收焦点。
- 单画布 #stage-art 不变；“转场”是覆盖层，不是第二张背景。

**M2 场景转场 480ms 墨色横擦。**
- showScene 发现 state.scene 变化时调 XB.fx.transition(name)：paper 场景（title/map）用纸白底，vn/ending 用夜蓝底；.fx-wipe 从左到右扫过，480ms，transform/opacity only。
- 不延迟 showScene 的 hidden 切换，不挡输入；overlay pointer-events none。用户可以在扫过时继续点击。
- 首次加载不播；同场景 render 不播；reduced 直接 no-op；1.2s 内连续换场景只保留最新一次，不叠加。
- 备选否掉：用两张画布交叉淡化会加内存和 resize 复杂度，留到步骤六之后也不做。

**M3 软闪白 120ms，只在泸定桥首次进入。**
- renderVn 发现 bg=luding_bridge 且本次会话未闪过，调 XB.fx.flash()：.fx-flash 透明度 0→0.12→0，120ms；2s 内最多一次；不整屏纯白、不做连续闪。
- 不在湘江战斗、不在结局、不在选项超时闪白；不做“中弹”白闪。
- ?fx=flash 用于独立验收；reduced 或 html.reduce-motion 时 no-op。

**M4 震动 180ms/2px，只在攀索有失误时。**
- handleMinigameEnd 收到 result.gameId=climb 且 result.stats.lost>0 时调 XB.fx.shake()；#stage 加 .is-shaking，CSS keyframes 只做 translate3d(±2px) 并保留 scale(var(--scale))，180ms 后移除。
- 不震动文字面板以外的区域？实际是整舞台 2px；幅度小、时间短，仍有 reduced 关闭。
- 门板/弃物/渡船不震；选项超时不震；不做连震。

**M5 墨迹划名 420ms，按行 90ms 错开。**
- renderEnding 构建完名单后，调 XB.fx.strike()：只选 #ending-names 的 li.is-missed，不加 .is-people/self/remote。
- CSS：.xb-ending__name.is-struck .xb-ending__name-text::after 画 2px 墨线，transform:scaleX(0)→1，420ms；每行 --strike-delay = index×90ms；保留原 line-through 作为无 JS 回退，划线后把 text-decoration-color 设为 transparent。
- 正常模式延迟 500ms 开始，让结局先出现；reduced 立即加 .is-struck（无动画）；同一局重渲染不重复播放（运行时 endingStrikePlayed）；刷新后重新播一次是允许的。
- 不延迟名单数据、不改 status 文本、不抢焦点。

**M6 reduced motion 是硬开关。**
- 双入口：系统 @media (prefers-reduced-motion: reduce) + 设置 html.reduce-motion；两者都已在 style 里全局关 transition/animation。
- JS 层：XB.fx.isReduced() 同时看 settings 与 matchMedia；transition/flash/shake 直接 return；strike 立即完成；不依赖 CSS 的 animationend。
- 打字机在 reduced 下按步骤三现有逻辑整页显示；本步不改。

**M7 动效不增加强制等待。**
- 转场 480ms 是视觉覆盖，不阻塞输入；标题卡仍 1200ms；音频淡入 800ms 不阻塞；没有新的“等动画结束”逻辑。
- 步骤七 20 分钟计时若因演出增加，先按红线裁草地/金沙江，不靠删 reduced 功能省时间。

### 4.3 命名与数据形状

- XB.audio：BEDS（9 个 id）、CUES（12 个 id）、MOTIF（notes/starts/durations）、unlock、applySettings、setScene、setDuck、cue、suspend、resume、stats、isReady。
- XB.fx：LIMITS（flashMs 120、flashGapMs 2000、flashOpacity 0.12、shakeMs 180、shakePx 2、strikeMs 420、strikeStaggerMs 90）、init、setReduced、transition、flash、shake、strike、reset。
- 不新增全局变量；不把 audio/fx 挂到 window；仍只用 XB 命名空间。

---

## 5. 任务卡

### T6.0 音频与动效口径落 docs（40 / 24 分钟）

**目的**：先把可验收的数字固定，避免代码里出现 0.1/0.15/300ms 等散值。

**输入**：本文件 §4；docs/quality-bar.md 的音频/动效底线；docs/visual-reading.md §6；docs/ui-layout.md §4。

**动作**：
1. 新建 docs/audio-system.md，至少十节：目标/边界、音频图、生命周期、音色与合成、9 床表、12 cue 表、设置/暂停/可见性、动效、reduced motion/性能、验收/证据。
2. 在 audio-system 写死：9 个 bed、12 个 cue、800ms 交叉淡化、120ms/0.12/2000ms 闪白、180ms/2px 震动、420ms/90ms 划名、五音频率与时值。
3. ui-layout §4 层级补 #fx-layer 使用 --z-transition 60；§5 减少动效补“划名立即完成”；§1 表补一行“特效层 0,0,1280,720，aria-hidden，不接收点击”。
4. visual-system §4 补动效令牌；§6 后加 §6.1“转场与特效层”；§8 性能预算补“无新增 rAF、无每帧音频”。
5. visual-reading §1 非目标删去“音效与转场（步骤六）”；§6 音量说明改“步骤六已接入，首次点击后生效”；加 §6.1 写音频/动效行为。
6. quality-bar 音频行改为“无音频文件；首次 pointerdown/keydown 后启动；静音/音量持久；无爆音；音频不承载唯一信息”；动效行补具体上限。
7. state-schema 头部补“音频运行态不落盘；11 键不变”；不改 JSON 示例的 settings。
8. credits §2 音频补“步骤六：XB.audio 合成；原创五音动机；无音频文件；不合成人声”。

**产出**：docs/audio-system.md 新建；六份 docs 修改。

**完成判据**：C31–C36 要检查的每个数字都能在 docs/audio-system.md 找到；C08 旧检查仍通过；没有“待定/约/左右”。

**常见坑**：把 9 床写成 16 床；把 title/map 算成两个床；把 ending 算成 bg；把闪白写成 500ms；把震动写成 5px；只写“减少动效”不写具体关闭项。

### T6.1 XB.audio 合成核心（120 / 70 分钟）

**目的**：先让声音安全地存在，再谈场景。

**输入**：T6.0 的 audio-system.md；engine.js 的 XB.core 结束位置；settings 默认值。

**动作**：
1. 在 XB.core 赋值结束之后、XB.engine 注释之前插入 XB.audio；不引用 XB.core，不调用 DOM 查询。
2. 写常量：BEDS 9、CUES 12、MOTIF 数据、总线增益、compressor 参数、噪声缓冲 2s。
3. 写 unlock()：不支持则 available=false 返回 false；支持则创建 ctx、master、compressor、三总线；ctx 初始 gain 0，setTargetAtTime 到目标；按 desiredBed（默认 wind_title）起第一张床，T6.2 再接完整映射。
4. 写 createNoiseBuffer(ctx)：一次生成 2s 单声道噪声并缓存；所有床共用；不每床新建。
5. 写 bed 构造器：噪声→滤波→增益；LFO 只连滤波器参数，不连 destination；bed 返回 sources/gain；stop 时 0.05s 淡出并 stop/disconnect。
6. 写 cue 合成：信封 attack 3–10ms、release 80–400ms；鼓/木/水/纸/金属/口琴分别函数化；不做方波/锯齿。
7. 写 playMotif(count)：前 3 音或全 5 音；musicBus；旧 motif 先淡出；不循环。
8. 写 applySettings：只存目标和（若 ctx 存在）ramp master；绝不创建 ctx；muted 时目标 0。
9. 写 suspend/resume：ctx 不存在 no-op；resume 捕获 Promise；不改 available。
10. 写 stats()：supported、ready、state、bed、duck、activeBeds、peak（analyser 仅 debug 时创建）；不每帧调用。
11. 写 isReady()。

**产出**：engine.js 中的 XB.audio；仍六文件。

**完成判据**：首次手势前无 AudioContext；首次手势后 200ms 内有默认 wind_title 环境声；连续 20 次 cue 无 console error；T6.6 接入后 S41/S42 复跑。

**常见坑**：在模块加载时 new AudioContext；applySettings 里 unlock；用 setInterval 做鼓点；用 oscillator.type=square；每个床新建一个 2s 噪声；stop 时直接 disconnect 导致爆音。

### T6.2 环境床与场景映射（90 / 52 分钟）

**目的**：七章走到哪里，声音就在哪里，不出现“全场静音”或“同一张床从头到尾”。

**输入**：T6.1 的 bed 构造器；art.js 的 SCENES 16；story.js 的 14 个唯一 bg；renderTitle/renderMap/renderVn/renderEnding。

**动作**：
1. 写 BED_BY_SCENE：title/map → wind_title；14 个 bg 按 §4.1 A5 映射；ending → ending；未知 id 记一次 warn，回退 wind_title，不白屏。
2. setScene(id)：同 id return；ctx 不存在只记 desired；ctx 存在则开新床、800ms 淡出旧床、0.9s 后 stop；最多两个 bed。
3. renderTitle 调 setScene(title)；renderMap 调 setScene(map)；renderVn 拿到 bg 后调 setScene(bg)；renderEnding 调 setScene(ending)。
4. 同一场景多次 render 不重启；从 vn 到 pause 不换床；从 vn 到 codex 不换床，只 duck。
5. 结局开床只做一次（runtime 标记），重渲染不重复；ending cue 统一在 T6.3 接，避免两处触发。
6. ?chapter=… 调试路径也走同一映射，不另写分支。
7. ?minigame=… solo 模式不强行开章节床：init 在 solo 早退之前先把期望床设为 wind_title（或 startSolo 内显式 setScene），开始小游戏后保持，不新增第四套声音逻辑。

**产出**：9 床映射表进 audio-system；engine 四处 setScene 调用。

**完成判据**：先用 debug 手工核对 9 床、14 bg、title/map/ending 全覆盖；C33 在 T6.6 接入后复跑，B47 在 T6.7 正式记录；快速切 20 次只剩 1 床；无未捕获 Promise。

**常见坑**：把 zunyi_hall 和 zunyi_street 写成两个床；忘记 ending 不是 bg；重复 render 重启动画；在 setScene 里创建 ctx；切换时旧床不 stop 导致叠加。

### T6.3 事件音与设置接线（80 / 46 分钟）

**目的**：让声音跟着选择、点名、小游戏动作走，并让设置真的生效。

**输入**：T6.1 的 cue；T6.2 的床；engine 的 showTitleCard/resolveChoice/openCodex/startInteract/handleMinigameEnd；index 的音量/静音；minigames 的 callbacks。

**动作**：
1. 写 12 cue 合成与触发：chapter（标题卡）、choice-select（resolveChoice 成功）、choice-timeout（超时结算）、codex（开史实注/图鉴）、drum（点名开始）、rollcall-answer（答到）、rollcall-miss（漏答）、result（小游戏结束）、door-place/boat-oar/climb-fire（小游戏 onCue）、ending（结局）。
2. cue 内部节流：同一 id 80–120ms 内只响一次；ctx 未就绪/静音直接 return false；不排队、不补播。
3. beginMinigame 的 callbacks 加 onCue；minigames 在门板放置/移除、弃物发船、渡船起航/到达、攀索失误处调用；无 onCue 时 no-op；不改 result 形状。
4. applySettings 增加 XB.audio.applySettings(state.settings)；音量 input 改为实时调用音频（同时 saveNow）；静音按钮沿用 applySettings。
5. openPause/closePause/openCodex/closeCodex/openGallery/closeGallery 后调 syncAudioDuck()；duck 级别见 A7；openSettings 不另加层（已在 pause）。
6. onVisibilityChange：hidden 先 suspend 再走现有暂停；visible 先 resume；不创建未解锁的 ctx。
7. index 的音量提示“音效步骤六接入”改为“首次点击后生效”；可选给减少动效加小字“关闭闪白、震动与划名”，不新增按钮。
8. debug 面板加 audio 行；不做电平表、不做持续轮询。

**产出**：12 cue；minigames onCue；settings 接线；debug。

**完成判据**：先用 debug 手工核对音量/静音/暂停/图鉴；S44 在 T6.6 后复跑，B45–B48 在 T6.7 正式记录；音量 0 时 master=0；静音刷新后仍静音；无自动播放；没有 cue 在 render 每帧触发。

**常见坑**：cue 在 ctx 未解锁时抛错；静音只改 UI 不改 master；音量滑杆只 saveNow；点名每帧响；图鉴关闭时把暂停 duck 也清掉；可见性恢复时创建 ctx。

### T6.4 XB.fx 与 #fx-layer（70 / 40 分钟）

**目的**：把“转场/闪白/震动”做成一个可控、可关、可测的层。

**输入**：index 的四场景与 pause；style 的 :root 与 reduced-motion；engine 的 showScene/renderVn/handleMinigameEnd。

**动作**：
1. index 在 #scene-ending 之后、#pause 之前加 #fx-layer（aria-hidden=true），内放 .fx-wipe/.fx-flash；REQUIRED_IDS 加 fx-layer；cacheElements 得到 els.fxLayer。
2. init 在 mountArt 之后调 XB.fx.init({layer: els.fxLayer, stage: els.stage})；不查询不存在的元素。
3. style 加 :root 令牌：--dur-transition 480ms、--dur-flash 120ms、--dur-shake 180ms、--dur-strike 420ms、--strike-stagger 90ms、--fx-flash-opacity .12、--fx-shake-distance 2px；全部 var 使用，不散落 hex。
4. style 写 .fx-layer、.fx-wipe、.fx-flash、.is-wiping、.is-flashing、#stage.is-shaking 与 keyframes；默认 opacity 0，动画结束回 0；不改变 #stage 的 scale 定位。
5. showScene 检测场景变化，调 XB.fx.transition(name)；首次不调；same 不调；reduced no-op。
6. renderVn 首次进 luding_bridge 调 XB.fx.flash()；handleMinigameEnd 的 climb 且 stats.lost>0 调 XB.fx.shake()。
7. flash 自带上限：FLASH_MS 120、FLASH_GAP 2000、FLASH_OPACITY .12；shake 自带 180ms/2px 与 300ms 冷却；animationend 清理，CSS 不支持时 setTimeout 兜底。
8. ?fx=wipe|flash|shake 在 init 末尾解析，600ms 后触发一次；不写档；reduced 下只 toast 说明已关闭，不假装播放。
9. reduced 双入口：XB.fx.setReduced(true/false) 由 applySettings 调；isReduced 也看 matchMedia；reduced 下所有方法 return false。

**产出**：#fx-layer；样式；XB.fx；三处触发。

**完成判据**：先手工看 wipe/flash/shake 与 reduced；B50–B52 在 T6.7 正式记录；#fx-layer 不接收点击；转场时能继续点选项；闪白 ≤120ms/≤0.12/2s 一次；震动 2px/180ms；没有布局位移；reduced 下无动画。

**常见坑**：把 #fx-layer 放到 #pause 之上挡住暂停；用 left/top 动画触发布局；闪白用纯白 1.0；震动用 8px；动画结束不清 class；reduced 下仍加 class 导致覆盖层不消失。

### T6.5 墨迹划名（60 / 34 分钟）

**目的**：结局的“名字被划掉”是情感落点，不是装饰；要克制、可读、可关。

**输入**：renderEnding 的名单构建；style 的 .is-missed；ending 七名状态；reduced 逻辑。

**动作**：
1. style 把 .xb-ending__name-text 设为 position:relative/display:inline-block；is-missed 保留 line-through 作回退。
2. is-struck 的 ::after 画 2px 墨线（var(--ink)），left 0/right 0/top 50%，transform-origin left，scaleX(0)→1，420ms，transition-delay var(--strike-delay,0ms)。
3. is-struck 时 text-decoration-color: transparent，让墨线代替静态划线；无 JS 时仍看到 line-through。
4. renderEnding 末尾调 XB.fx.strike()：只选 li.is-missed；正常模式 500ms 后逐行加 is-struck，行 index×90ms；reduced 立即加；同一局 endingStrikePlayed 防重播。
5. showScene 从其他场景进入 ending 时重置 strike 状态；同场景重渲染不重置；离开 ending 清理 timer；刷新/新一局允许重播一次。
6. ?fx=strike 只在有 .is-missed 时触发；没有就 toast“先生成结局名单”，不报错。
7. 不改 status 文本、不延迟数据、不移动焦点；endingHome.focus 仍立即执行。

**产出**：style 墨线；renderEnding 调用；fx.strike。

**完成判据**：先手工看正常/reduced 两种划名；B53 在 T6.7 正式记录；正常 420ms+90ms 错开；reduced 立即；刷新重播一次；重渲染不重复；控制台 0 error；line-through 回退存在。

**常见坑**：把 is-self/remote 也划掉；用 canvas 覆盖文字；延迟 2s 才显示名单；reduced 下仍等 500ms；每次 render 都重播；把“未应”改成“牺牲”二字。

### T6.6 工具与负例（50 / 28 分钟）

**目的**：让“无音频文件/首次手势/上限”变成机器可查，而不是口头保证。

**输入**：check-build 现有 C30；smoke 现有 S40；T6.0 的数字。

**动作**：
1. check-build 加 C31 音频架构：无 audio/img 文件引用；无 new Audio；无 .mp3/.wav/.ogg/.m4a/.flac；AudioContext 只在 XB.audio 内；无 fetch/CDN。
2. 加 C32 生命周期：unlock 存在；onPointerDown/onKeyDown 首行调用；visibilitychange/suspend/resume；setTargetAtTime；DynamicsCompressor；无 setInterval；applySettings 不含 unlock/new AudioContext。
3. 加 C33 床映射：BEDS 9；14 个 story bg 全在 BED_BY_SCENE；title/map/ending 显式；未知回退存在。
4. 加 C34 设置接线：applySettings 调 XB.audio.applySettings；音量 input 实时接线；PERSIST_KEYS 11；settings 仍 6 键；无 audio 持久键。
5. 加 C35 fx 层：index 有 #fx-layer、aria-hidden、position 在 scene-ending 后/pause 前；style 有 .fx-layer/.is-struck/--z-transition；reduced 规则存在。
6. 加 C36 上限：LIMITS 数值在界内（flashMs≤150、flashGapMs≥2000、flashOpacity≤0.12、shakeMs≤200、shakePx≤2、strikeMs≤500）；CSS 有 prefers-reduced-motion；engine 有 isReduced 分支。
7. smoke 加 S41 音频 API/9 床/12 cue；S42 五音频率与顺序；S43 BED_BY_SCENE 覆盖；S44 cue 白名单/无 setInterval；S45 XB.audio.applySettings 在无 ctx 时不抛错；S46 fx LIMITS/setReduced 不抛错。
8. 负例 N9–N12：N9 加 new Audio(“x.mp3”) → C31/C09 红；N10 改 flashMs 400/flashGapMs 100 → C36 红；N11 删 #fx-layer → C03/C35 红；N12 加 setInterval → C32 红。每个负例用 finally 恢复。
9. 更新 docs/test-cases.md T38 记录四个负例；quality-bar 的 T01–T30 改 T01–T38。

**产出**：check-build 36 项；smoke 46 项；T38。

**完成判据**：36/36、46/46 全绿；四个负例分别报指定编号；恢复后再次全绿；没有放宽 C05/C09/C30。

**常见坑**：C31 把 “AudioContext” 字样当成创建；C33 只数 14 不管 ending；C36 用注释里的数字；负例忘了 finally 恢复；把 smoke 写成依赖 AudioContext 的浏览器测试。

### T6.7 浏览器实测 B45–B56（55 / 32 分钟）

**目的**：用 Edge 把可验证的部分做实，主观音频项诚实标注。

**输入**：T6.1–T6.6 完成；docs/evidence/step-06/ 目录；本地 http 与 file://。

**动作**：
1. 按 §7 B45–B56 逐条跑；截图/录屏放 docs/evidence/step-06/（gitignored）；run-log 记浏览器版本、分辨率、URL、控制台。
2. 音频项用 ?debug=1 的 audio 行与 peak；能听的本机扬声器试听，记录“听到/未听到/无法判断”，不写“完美”。
3. 动效项用 ?fx=… 与真实场景各一次；截图 0/200/480ms；reduced 开/关各一次。
4. 844×390 触摸用 hasTouch 模拟：首次 tap 解锁、静音、返回、继续。
5. file:// 与 http 各跑一遍 B55；记录 0 console error、0 404、0 外部请求。
6. B48 真实切后台无法在 headless 可靠模拟时，标“部分/留步骤七”，不伪造通过。

**产出**：run-log；截图/录屏索引；例外记录。

**完成判据**：12 条都有结果；P0 项全过；P1 例外写影响；0 console error；没有把“未验证”写成“通过”。

**常见坑**：用截图证明声音；只跑 http 不跑 file://；忘记 reduced；把 headless 当真实手机；忽略音量 0 时仍创建 ctx（允许创建，但必须无声）。

### T6.8 文档回填与证据（55 / 32 分钟）

**目的**：把实现、文档、证据对齐，给步骤七一个干净的入口。

**输入**：T6.0–T6.7 的结果；CLAUDE.md 当前步骤表。

**动作**：
1. 回填本文件 §11.1–§11.6：日期、实际用时、T6.0–T6.9 状态、E1–E14、B45–B56、工具输出、例外。
2. 更新 docs/audio-system.md 的“实现状态”与“实测”小节；把实际发现的偏差写进去，不改计划数字除非先改 docs。
3. 更新 docs/quality-bar.md、test-cases.md、credits.md、visual-reading.md 的步骤六状态；不写“已完美”。
4. 记录文件体量：engine.js 增加行数/字节；check-build/smoke 数量；CSS gzip；JS gzip 仍 ≤150KB。
5. 把 docs/evidence/step-06/run-log.md 建好，列 B45–B56 与截图文件名；证据目录不提交。
6. 检查没有新增音频文件、字体文件、图片、CDN、fetch；git status 只包含预期文件。

**产出**：回填后的 step-06；docs 同步；run-log。

**完成判据**：E1–E14 可逐条勾；数字与 docs 一致；例外不隐藏；没有“大概/应该”。

**常见坑**：只改代码不改 docs；把 headless 的截图当声音证据；忘记更新 quality-bar 的 T01–T30；把 evidence 大文件提交。

### T6.9 复核、提交与 tag（20 / 12 分钟）

**目的**：给步骤六一个可回滚的结束点。

**输入**：T6.8 完成；全绿工具；step-06 §11。

**动作**：
1. 最后跑一次 node project/tools/check-build.js、node project/tools/smoke.js、node project/tools/check-script.js docs/script；确认 36/36、46/46、check-script OK。
2. 确认没有部署、没有打包、没有改 story.js/art.js/assets；git diff 只含预期文件。
3. 更新 .claude/CLAUDE.md：步骤六 ✅（日期、tag、实现摘要、已知欠账）；当前进度加一段；建议下一步步骤七。
4. 提交 feat: 音频与动效（步骤六）；tag step-6-done。
5. 把 tag 与证据位置告诉用户；不发布视频、不部署。

**产出**：提交、tag、CLAUDE 更新。

**完成判据**：36/46；story.js 未改；tag 存在；步骤七交接清楚。

**常见坑**：在工具未全绿时 tag；把 evidence 目录提交；忘记更新 CLAUDE；把“计划”当成“完成”。

---

## 6. 时间盒

### 6.1 标准版

| 卡 | 分钟 | 累计 |
|---|---:|---:|
| T6.0 | 40 | 40 |
| T6.1 | 120 | 160 |
| T6.2 | 90 | 250 |
| T6.3 | 80 | 330 |
| T6.4 | 70 | 400 |
| T6.5 | 60 | 460 |
| T6.6 | 50 | 510 |
| T6.7 | 55 | 565 |
| T6.8 | 55 | 620 |
| T6.9 | 20 | 640 |

### 6.2 压缩版

| 卡 | 分钟 | 压缩策略 |
|---|---:|---|
| T6.0 | 24 | 只写 audio-system 十节 + 五份 docs 的最小改动 |
| T6.1 | 70 | 先做风/水/鼓/口琴四色，暂不做铁索独立层 |
| T6.2 | 52 | 9 床先全接，交叉淡化先 600ms 后统一 800ms |
| T6.3 | 46 | cue 先 8 个，rollcall/小游戏 onCue 后补 |
| T6.4 | 40 | 只做 wipe/flash/shake，不做额外装饰 |
| T6.5 | 34 | 只做 ending 划名，不做其他名单 |
| T6.6 | 28 | C31/C32/C35/C36 先，C33/C34 后 |
| T6.7 | 32 | B45–B56 只跑 P0/P1 核心项，主观项标步骤七 |
| T6.8 | 32 | 先回填 §11 与 CLAUDE，docs 细节后补 |
| T6.9 | 12 | 只跑三工具 + tag |
| 合计 | 370 | — |

### 6.3 超时规则

- 超过 640 分钟：先砍 T6.7 的非 P0 截图，再砍 T6.6 的负例展示（但检查必须保留），不砍 reduced motion 与首次手势。
- 超过 800 分钟：暂停，记录未完成项，不 tag；先保“首次点击有声 + 静音持久 + 无文件 + 无爆音”，动效可降级为只做划名 + 转场。
- 任何情况下不得用“去掉 reduced motion”换时间。

---

## 7. 验收清单

### 7.1 出口映射 E1–E14

| 编号 | 断言 | 方法 | 级别 |
|---|---|---|---|
| E1 | 项目无音频文件、无 data:audio、无外部音频请求 | C09/C31；find/ripgrep；B55 | P0 |
| E2 | 首次手势前无 AudioContext；首次 pointerdown/keydown 后有环境声 | C32；B45；debug audio=locked→ready | P0 |
| E3 | 静音/音量持久；刷新后设置仍生效；11 键不变 | B46；localStorage；C30/C34 | P0 |
| E4 | 9 床覆盖 14 bg + title/map/ending；切换 800ms 不断裂 | C33；B47；debug bed | P0 |
| E5 | 12 cue 由事件触发；小游戏 onCue 可选；无 story.sfx 改动 | C33/C34；S44；B56 | P0 |
| E6 | 无爆音：包络、compressor、无方波；peak <0.99；主观试听无刺耳 | B49；debug peak；run-log | P0 |
| E7 | 暂停/图鉴 duck；切后台 suspend；回来 resume；不丢时间 | B48；debug state/duck | P1（真实后台留步骤七） |
| E8 | 场景转场 480ms 横擦；不挡输入；reduced no-op | B50；截图/录屏 | P0 |
| E9 | 闪白 120ms/0.12/2s 一次；震动 180ms/2px；只在指定事件 | C36；B51/B52 | P0 |
| E10 | 划名只划 is-missed；420ms/90ms；reduced 立即；回退存在 | B53；截图；CSS 检查 | P0 |
| E11 | check-build 36/36、smoke 46/46、check-script OK；四负例报红 | 终端日志；T38 | P0 |
| E12 | Edge B45–B56 有结果；0 console error；file:// 与 http 可玩 | run-log；截图 | P0/P1 |
| E13 | 844×390 触摸可首次解锁、静音、继续；无 44px 回归 | B54；截图 | P1 |
| E14 | 文档同步；CLAUDE 步骤六 ✅；tag step-6-done | T6.8/T6.9 | P0 |

### 7.2 出口逐条对照

| CLAUDE.md 出口 | 本步证据 |
|---|---|
| 无音频文件 | C09/C31；B55；git status 无 .mp3/.wav/.ogg |
| 首次点击后有声 | B45；C32；debug audio 行 |
| 静音持久化 | B46；settings 11 键；C34 |
| 无刺耳爆音 | B49；compressor/包络参数；主观试听记录 |
| 转场 | B50；#fx-layer；480ms |
| 闪白 | B51；120ms/0.12/2s |
| 震动 | B52；180ms/2px |
| 墨迹划名 | B53；420ms/90ms |
| 静音开关 | index #set-muted 既有；B46 |
| prefers-reduced-motion | C35/C36；B50–B53 reduced 组 |

---

## 8. 风险与返工触发

| 编号 | 风险 | 触发信号 | 应对 | 返工边界 |
|---|---|---|---|---|
| R1 | iOS/Safari 自动播放策略更严 | 首次点击仍 suspended；resume reject | 下一手势重试；不阻塞游戏；步骤七真机 | 不改游戏流程 |
| R2 | 音量叠加导致爆音 | peak 接近 1；试听刺耳 | 降 bus/单音增益；compressor 再压；去方波 | 不改 cue 结构 |
| R3 | 节点泄漏/切换叠加 | activeBeds>2；20 次后仍有旧床 | stop/disconnect；0.9s 清理；上限 2 | 不改 9 床映射 |
| R4 | #stage 震动破坏 scale 定位 | 震动后画面偏移/模糊 | keyframes 保留 scale(var(--scale))；幅度 2px；动画结束移除 | 可只震 #stage-art |
| R5 | 转场盖住输入/暂停 | 点击无反应；暂停按钮点不到 | pointer-events none；z 60 < pause 80；不延迟 hidden | 不改场景时序 |
| R6 | reduced 下动画类残留 | overlay 不消失；划名不动 | JS 直接 no-op；CSS 默认 opacity 0；strike 立即 | 不改全局 CSS 规则 |
| R7 | 划名重播/刷新 | 每次 render 都重播；刷新不播 | endingStrikePlayed 运行时标记；showScene 重置 | 不改 ending 数据 |
| R8 | 文档数字与代码漂移 | audio-system 与 LIMITS 不一致 | 先改 docs 再改代码；C36 机器检查 | 不静默分叉 |
| R9 | 20 分钟余量更紧 | 步骤七计时 >20:00 | 按红线裁草地→金沙江→遵义；不删音频/reduced | 不本步裁 |
| R10 | headless 无法证明声音 | 只有截图没有听感 | 标 P1/未验证；步骤七真机；不写“通过” | 不伪造证据 |
| R11 | 检查过严导致误报 | C31/C33 把注释/字符串当代码 | 用精确 API/数据检查；负例验证；保留旧检查 | 不放宽 C09/C30 |
| R12 | 音量滑杆实时更新造成卡顿 | input 每像素都 sync UI | 只调 audio.applySettings；不重渲染；必要时 requestAnimationFrame 合并 | 不改设置结构 |
| R13 | ending 划名与滚动/焦点冲突 | 名单滚动时划名错位；焦点被抢 | 绝对定位在文本内；不延迟 focus；只操作 li | 不改 ending 布局 |

---

## 9. 禁区（本步不要做）

1. 禁止新建 audio.js、fx.js、utils.js、helpers.js 等第七个运行时文件。
2. 禁止在 init/applySettings/模块加载时创建 AudioContext；禁止自动播放。
3. 禁止音频文件、data:audio、base64 音频、CDN、外部 URL、字体文件。
4. 禁止 setInterval、createScriptProcessor、逐帧音频循环；禁止第二个 rAF 循环。
5. 禁止改 story.js 的节点/图鉴/五卡/点名；禁止新增 sfx 字段；禁止改 art.js。
6. 禁止改 11 个持久键、SAVE_VERSION、4096B 上限、ending 快照形状。
7. 禁止把音效做成成功/失败评分、Game Over、连击、奖励音；禁止合成人声、真实领导人声音。
8. 禁止血腥/爆炸/枪声特写；湘江不做战斗音效；泸定不做爆炸。
9. 禁止闪白 >120ms、>0.12、2s 内多次；禁止震动 >2px/180ms；禁止连续闪烁。
10. 禁止在 reduced motion 下仍播转场/闪白/震动；禁止把“减少动效”做成只关 CSS 不关 JS。
11. 禁止 #fx-layer 接收点击、挡住暂停/图鉴/选项；禁止用 left/top/width 动画触发布局。
12. 禁止只改代码不改 docs；禁止把 headless 截图说成声音验收；禁止在工具未全绿时 tag。
13. 禁止部署、打包 ZIP、发布视频；这些是步骤八，且需用户确认。

---

## 10. 交接接口

### 10.1 给步骤七（测试与适配）

- 需要真机/多浏览器复测：Chrome/Edge/Safari；iOS Safari 首次手势、静音开关、切后台 resume。
- 需要真实切后台验证：B48 在 headless 只能部分；步骤七用真机或 DevTools 生命周期。
- 需要主观听感：B49 的“无刺耳爆音”要在扬声器/耳机各听一次，记录设备与音量。
- 需要 20 分钟三次计时：本步新增 480ms 转场是覆盖层、不阻塞；若超时按红线裁，不删 reduced。
- 需要移动端：844×390 首次触摸解锁、音量/静音、划名字号、ending 面板 477×303、B16 热区 26×26 例外。
- 需要隐私模式/断网 ZIP：AudioContext 在 file:// 与隐私模式的行为；localStorage 降级不影响音频。
- 需要检查：没有音频文件混入 ZIP；没有字体文件；没有外部请求。

### 10.2 给步骤八（打包与交差）

- 音频全部 Web Audio 合成，无文件；credits 已写“原创五音动机、不合成人声”。
- 不打包字体；字体欠账仍在步骤八（OFL 子集 + LICENSE）。
- 演示视频前 5 分钟/最后 2 分钟保留声音：标题风声、章节卡三音、终章五音、划名；不要用外部音乐。
- ZIP 断网测试包含音频：file:// 下首次点击应有声；没有则记录浏览器限制，不伪造。
- 设计说明的“技术实现”可写：9 床/12 cue/1 个 fx 层/11 键不变。

### 10.3 给后续维护

- 改床：先改 docs/audio-system.md 的 9 床表，再改 BED_BY_SCENE，再跑 C33。
- 改 cue：先改 12 cue 表，再改 CUES/触发点，再跑 S44。
- 改动效上限：先改 docs 与 LIMITS，再跑 C36；不要只改 CSS。
- 改 ending 划名：只动 .is-missed/.is-struck，不动 ending 数据与 status 文案。
- 任何“再加一个音效/再做一个转场”的需求，先问是否在计划书范围内；不在就记入步骤八以后，不临时加。

---

## 11. 复核记录（执行时回填）

> 以下为空白模板。执行 T6.0–T6.9 时逐项填日期、实际用时、证据、结论；不预填“通过”。

### 11.1 任务卡记录

> 跨会话执行，未逐卡计时；以下“实际分钟”记“未计时”，不补造数字。日期均为 2026-11-02。

| 卡 | 日期 | 实际分钟 | 状态 | 证据/备注 |
|---|---|---:|---|---|
| T6.0 | 2026-11-02 | 未计时 | ✅ | docs/audio-system.md 五节；ui-layout / visual-system / visual-reading / quality-bar / test-cases / credits / state-schema 同步 |
| T6.1 | 2026-11-02 | 未计时 | ✅ | engine.js 内 XB.audio：音频图、compressor、噪声缓冲、tone/noise/drum/motif；无第七个运行时文件 |
| T6.2 | 2026-11-02 | 未计时 | ✅ | 9 床、17 场景映射、800ms 切换、0.9s 清理、activeBeds≤2；B47 |
| T6.3 | 2026-11-02 | 未计时 | ✅ | 12 cue、100ms 节流、设置实时生效、暂停/图鉴 duck；B46/B48/B56 |
| T6.4 | 2026-11-02 | 未计时 | ✅ | #fx-layer、480ms 横擦、120ms 闪白、180ms 震动；B50–B52 |
| T6.5 | 2026-11-02 | 未计时 | ✅ | ending 只划 is-missed、420ms/90ms、reduced 立即、同局一次；B53 |
| T6.6 | 2026-11-02 | 未计时 | ✅ | check-build 30→36、smoke 40→46、负例 N9–N12 全红 |
| T6.7 | 2026-11-02 | 未计时 | ✅ | Edge headless 79/79、0 console error；file:// 与 http |
| T6.8 | 2026-11-02 | 未计时 | ✅ | 本 §11、docs/evidence/step-06/run-log.md、截图 01–11 |
| T6.9 | 2026-11-02 | 未计时 | ✅ | 提交与 tag step-6-done 见本卡收尾 |

### 11.2 出口验收 E1–E14

| 编号 | 结果 | 证据 | 例外/影响 |
|---|---|---|---|
| E1 | ✅ | C31；assets 与全项目无 .mp3/.wav/.ogg/.m4a/.flac；B55 无外部请求 | 无 |
| E2 | ✅ | 加载后 audio=locked、ready=false；首次点击后 ready；C32 | 无 |
| E3 | ✅ | B46：volume 0.35、muted true，刷新保留；PERSIST_KEYS 仍 11、存档 v1 | 无 |
| E4 | ✅ | C33；B47 17 场景全对、activeBeds≤2、ending 有床 | 800ms 交叉淡化只验参数，未做听感 |
| E5 | ✅ | CUES 12；S44 白名单；B56 door-place/result；无 story.sfx | 四关只完整跑门板 cue |
| E6 | ⚠️ | B49 peak=0（<0.99）；compressor/包络/无方波由 C32/C36 检查 | **headless 未采到波形，主观听感留步骤七** |
| E7 | ✅ | B48：暂停 0.30、图鉴 0.45、hidden suspended、visible ready | hidden 用属性模拟，真实后台留步骤七 |
| E8 | ✅ | B50 is-wiping/is-night、0.48s、650ms 后清除；pointer-events none | 未录屏 |
| E9 | ✅ | B51 一次/2s 冷却；B52 180ms/2px；C36 上限 | 无 |
| E10 | ✅ | B53 3 行 is-struck、0/90/180ms、420ms、line-through 保留；reduced 立即 | 未逐帧录屏 |
| E11 | ✅ | check-build 36/36、smoke 46/46、check-script OK；N5–N12 全红 | 无 |
| E12 | ✅ | _pw-step6.json 79/79、0 console error、0 pageerror；B55 file/http | 仅 Edge |
| E13 | ✅ | B54 舞台 693.33×390、tap 暂停/设置、audio ready | 移动模拟，非真机 |
| E14 | ✅ | 文档八份同步；§11 与 run-log 已回填；提交 + tag step-6-done | 无 |

### 11.3 浏览器 B45–B56

| 编号 | 浏览器/分辨率 | 结果 | 证据 | 例外 |
|---|---|---|---|---|
| B45 | Edge 156 / 1280×720 | ✅ 5/5 | 载入 locked；点击后 ready；无 audio/video；关标题卡后 bed=yudu | 无 |
| B46 | Edge 156 / 1280×720 | ✅ 7/7 | 0.35 / muted true 刷新保留；取消静音生效 | 无 |
| B47 | Edge 156 / 1280×720 | ✅ 34/34 | 17 场景全对；activeBeds≤2；ending=ending | ending 经结局页图鉴按钮解锁 |
| B48 | Edge 156 / 1280×720 | ✅ 7/7 | pause .30、gallery .45、hidden suspended、visible ready | 模拟隐藏，非真实后台 |
| B49 | Edge 156 / 1280×720 | ⚠️ 1/1 | peak=0，读数 <0.99 | 不能当听感验收 |
| B50 | Edge 156 / 1280×720 | ✅ 3/3 | is-wiping/is-night、0.48s、650ms 清除 | 未录屏 |
| B51 | Edge 156 / 1280×720 | ✅ 2/2 | 泸定首次 1 次；2s 内第二次 false | 无 |
| B52 | Edge 156 / 1280×720 | ✅ 2/2 | shake 1 次；is-shaking 1 次；180ms/2px | 用包装计数，非录屏 |
| B53 | Edge 156 / 1280×720 | ✅ 8/8 | 3 行、0/90/180ms、0.42s、line-through；同局一次；reduced 立即 | 静态截图 |
| B54 | Edge 156 / 844×390 touch | ✅ 3/3 | 693.33×390；tap 可用；audio ready | 模拟非真机 |
| B55 | Edge 156 / 本地 http | ✅ 2/2 | locked→ready；0 console error | 仅静态 http |
| B56 | Edge 156 / 1280×720 | ✅ 5/5 | 9 场景 churn 后 activeBeds=1；door-place/result cue | 只测门板 |

原始结果：docs/evidence/step-06/_pw-step6.json、_pw-step6.log；逐项说明与截图表：docs/evidence/step-06/run-log.md。

### 11.4 工具与负例

| 项 | 命令 | 结果 | 备注 |
|---|---|---|---|
| check-build | node project/tools/check-build.js | ✅ 36/36 | 末行“OK：构建自检 36 项全绿” |
| smoke | node project/tools/smoke.js | ✅ 46/46 | 末行“OK：纯状态层烟测 46 项全绿” |
| check-script | node project/tools/check-script.js docs/script | ✅ OK | 7 个剧本文件；禁用词 0；真实人物 0 |
| N5 | 临时改 C24 相关阈值 | ✅ 红 | C24/C26/S34 |
| N6 | 临时改 C26 相关结构 | ✅ 红 | C26/S37 |
| N7 | 临时改 C27 相关结构 | ✅ 红 | C27/S40 |
| N8 | 临时改 C30 存档键 | ✅ 红 | C30/S38 |
| N9 | 临时加 new Audio("x.mp3") | ✅ 红 | C31/C09（build 红；smoke 无需红） |
| N10 | 临时改 flashMs 400 / gap 100 | ✅ 红 | C36；因 engine.js 为 CRLF，注入点用 \r\n |
| N11 | 临时删 #fx-layer | ✅ 红 | C03/C35（build 红；smoke 无需红） |
| N12 | 临时加 setInterval | ✅ 红 | C32 |

原始结果：_negatives.json；逐例日志 _negN5.log … _negN12.log。所有注入在 finally 恢复，最终工作区无残留。

### 11.5 文件与体量

| 项 | 计划 | 实际 | 结论 |
|---|---|---|---|
| engine.js 增量 | 约 +300–450 行 | +809 / −4 行；131,479 B（gzip 32,570 B） | 超出计划行数，但仍 ≤150KB gzip |
| style.css 增量 | 约 +100–160 行 | +125 行；44,545 B（gzip 9,011 B） | ≤30KB gzip |
| index.html 增量 | +6–10 行 | +7 / −1 行；11,702 B（gzip 3,391 B） | C03 通过 |
| minigames.js 增量 | +10–20 行 | +16 行；80,063 B（gzip 16,875 B） | C19/C22 不回归 |
| check-build | 36 项 | 36 项全绿 | 无 |
| smoke | 46 项 | 46 项全绿 | 无 |
| story.js | 0 行改动 | 0 行；56,246 B | git diff 证明 |
| art.js | 0 行改动 | 0 行；49,613 B | git diff 证明 |
| 音频文件 | 0 | 0 | C31 + 项目扫描 |
| 字体文件 | 0 | 0 | 本步未打包字体 |

engine.js 行数偏多，主要来自 9 床与 12 cue 的合成参数、fx 状态机与注释；未新增第七个运行时文件。

### 11.6 剩余与交接

- 未完成项：无代码缺口；E6 主观听感、E7 真实切后台、E13 真机三项按计划留步骤七。
- 已知例外：B49 headless peak=0（只证明 <0.99）；B48 用 document.hidden 属性模拟；B54 为 Playwright 移动模拟；仅 Edge 156；B50 未录屏、B53 未逐帧；B56 只完整跑门板 cue。
- 步骤七必须复测：Chrome/Edge/Safari 真机；iOS 首次手势与静音；耳机主观试听（chapter/ending/result/三门板/渡船/攀索）；真实切标签页/锁屏后 resume；844×390 真机触摸；20 分钟三次完整计时；断网 ZIP 与隐私模式；移动端 ending 五卡字号。
- 步骤八必须补：字体授权与是否子集打包；Cloudflare Pages 部署；ZIP；设计说明；3 分钟演示；制作名单。
- 结论（可 tag / 不可 tag）：**可 tag**。36/46、79/79、0 console error；story.js/art.js 未改；无音频/字体文件；存档仍 v1、11 键。

---

## 附录 A 音频规格

### A.1 音频图

    AudioContext
      ├─ ambienceBus (0.35) ── bed 1..2 (噪声/滤波/LFO/增益)
      ├─ sfxBus (0.55)      ── 短音 cue
      ├─ musicBus (0.40)    ── 口琴动机
      └─ masterGain (muted ? 0 : 0.87 × volume)
           └─ DynamicsCompressor（−14dB / 10 / 4 / 0.003s / 0.25s）
                └─ destination

- 所有总线增益用 setTargetAtTime，时间常数 0.03–0.06。
- 单音源增益 ≤0.25；bed 层 ≤0.17；cue 层 ≤0.22；music ≤0.22。
- 噪声缓冲 2.0s，单声道，只生成一次；所有床共用。
- LFO 只连 AudioParam，不连 destination；LFO 增益 ≤300。

### A.2 9 个环境床

| bed | 场景 | 层 | 相对增益 | 备注 |
|---|---|---|---:|---|
| wind_title | title、map | 风 lowpass 650 + 极低 rumble | 0.12 / 0.02 | 标题只风声，不放旋律 |
| yudu | yudu_river、yudu_night | 水 bandpass 850 + 风 700 | 0.14 / 0.07 | 于都河，不写枪炮 |
| xiangjiang | xiangjiang_ford、xiangjiang_dawn | 水 700 + 风 + 低频 rumble 48 | 0.15 / 0.08 / 0.05 | 湘江不做战斗音效；rumble 不是爆炸 |
| zunyi | zunyi_hall、zunyi_street | 室内 lowpass 350 + 外部风 500 | 0.06 / 0.04 | 室内更静，给会议/复盘留空间 |
| jinsha | jinsha_river、jinsha_night | 急水 bandpass 1100 + 风 | 0.17 / 0.08 | 水流更急；船桨由 cue 补 |
| luding | luding_bridge、luding_after | 高风 1200 + 铁索 bandpass 2400 | 0.13 / 0.035 | 铁索低增益；不做爆炸 |
| grass | grass_marsh、grass_dawn | 风 600 + 湿地水 500 | 0.11 / 0.06 | 不吃“恐怖沼泽”刻板音 |
| wuqi | wuqi_dawn、wuqi_wall | 风 700 + 低频 rumble 45 | 0.09 / 0.04 | 到达，安静；点名 cue 另起 |
| ending | ending | 风 600 + 低 rumble | 0.08 / 0.03 | 五音动机走 musicBus |

覆盖核对：14 个 bg 全部有映射；title/map 共 wind_title；ending 单独；合计 9 床、16 个 art 场景 + ending 场景。

### A.3 五音动机

| 序 | 音 | 频率 Hz | 起始 s | 时值 s |
|---:|---|---:|---:|---:|
| 1 | D4 | 293.66 | 0.00 | 0.45 |
| 2 | F4 | 349.23 | 0.55 | 0.25 |
| 3 | G4 | 392.00 | 0.90 | 0.45 |
| 4 | A4 | 440.00 | 1.45 | 0.25 |
| 5 | C5 | 523.25 | 1.80 | 0.90 |

- 章节卡只用 1–3 音；终章用 1–5 音；总时长约 2.7s + release。
- 音色：triangle 0.7 + sine 0.3 → lowpass 1800 → gain；5Hz vibrato，depth 3–5 cents；attack 0.03s/release 0.12s。
- 原创声明：五声音阶动机为项目自写，不引用现成歌曲、不采样、不合成人声。

### A.4 12 个短音 cue

| cue | 触发点 | 合成 | 时长 | 总线 | 上限 |
|---|---|---|---:|---|---:|
| chapter | showTitleCard | 前三音 + 低频鼓 | 1.6s | music/sfx | 0.18 |
| choice-select | resolveChoice 成功 | 木/纸短击 | 0.12s | sfx | 0.20 |
| choice-timeout | 超时默认结算 | 低 tick + 纸 | 0.18s | sfx | 0.18 |
| codex | openCodex/openGallery | 纸页噪声 | 0.35s | sfx | 0.16 |
| drum | startInteract 点名开始 | 低频鼓 90→55 | 0.30s | sfx | 0.22 |
| rollcall-answer | 答到成功 | 木击 520 + 短气声 | 0.12s | sfx | 0.16 |
| rollcall-miss | 漏答 | 低闷击 80 | 0.20s | sfx | 0.16 |
| result | handleMinigameEnd | 低鼓 + 纸 | 0.50s | sfx | 0.20 |
| door-place | 门板放置/移除 | 木 120 + 噪声 | 0.15s | sfx | 0.18 |
| boat-oar | 渡船起航/到达 | 水带通 700 | 0.40s | sfx | 0.15 |
| climb-fire | 攀索失误 | 短噪声 1200 + 低 70 | 0.25s | sfx | 0.15 |
| ending | renderEnding 首次 | 完整五音 + 风涌 | 2.9s | music | 0.20 |

- 所有 cue 都带 attack/release；相同 id 80–120ms 节流；ctx 未就绪或静音 return false。
- 没有成功/失败音、没有得分音、没有 Game Over 音；result 用中性低鼓。

### A.5 生命周期

| 事件 | 动作 |
|---|---|
| 模块加载 | 只定义 XB.audio；不创建 ctx |
| init | applySettings 只记目标；setScene 只记 desired；不创建 |
| 首次 pointerdown/keydown | unlock；创建 ctx；master 从 0 ramp；起 desired bed |
| 后续手势 | ctx 已存在则 resume；不重复建 |
| 场景变化 | setScene；800ms 交叉淡化；最多 2 床 |
| 暂停 | engine 算 duck 0.3；ambience/music 降；sfx 不降 |
| 图鉴/史实注 | duck 0.45；关闭恢复（若暂停仍 0.3） |
| 页面隐藏 | suspend；保留现有暂停逻辑 |
| 页面可见 | resume；不重建 |
| 小游戏开始/结束 | 不换床；onCue 短音；结束 result |
| 结局 | ending 床 + 五音一次；重渲染不重播 |
| 静音 | master→0；ctx 可保留；取消静音 ramp 回 |
| 刷新 | 重新走 init→手势；settings 恢复；音频不落盘 |

### A.6 调试字段

- debug 行：audio=locked|ready|suspended|off、bed=<id>、duck=<0..1>、beds=<n>、peak=<0..1>；locked=支持但未首次手势，off=不支持。
- peak 只在 debug 下用 analyser 取一次；不做持续电平表。
- ?fx=wipe|flash|shake|strike 只触发一次；不写档。
- ?debug=1 不改变声音行为；只显示状态。

---

## 附录 B 动效规格

### B.1 #fx-layer

| 项 | 值 |
|---|---|
| 位置 | #stage 内，四场景之后、#pause 之前 |
| 尺寸 | inset 0；1280×720 设计坐标 |
| 层级 | var(--z-transition) = 60 |
| 指针 | pointer-events:none |
| 可访问性 | aria-hidden=true；不承载文字/焦点 |
| 子层 | .fx-wipe（横擦）、.fx-flash（软闪白） |
| 默认 | opacity 0；不可见；不参与布局 |

### B.2 四类动效

| 动效 | 触发 | 时长/参数 | 上限/冷却 | reduced |
|---|---|---|---|---|
| 转场 wipe | showScene 场景变化 | 480ms；translateX(-100%→100%)；paper/night 底色 | 1.2s 内只最新一次 | no-op |
| 闪白 flash | 首次进 luding_bridge | 120ms；opacity 0→0.12→0 | 2s 一次；不连续 | no-op |
| 震动 shake | climb stats.lost>0 | 180ms；±2px；保留 scale | 300ms 冷却 | no-op |
| 划名 strike | renderEnding 的 is-missed | 420ms；90ms/行；scaleX 0→1 | 同一局一次 | 立即完成 |

### B.3 令牌

- --dur-transition 480ms
- --dur-flash 120ms
- --dur-shake 180ms
- --dur-strike 420ms
- --strike-stagger 90ms
- --fx-flash-opacity .12
- --fx-shake-distance 2px
- 其余颜色只用既有 --paper/--paper-hi/--night/--ink/--ink-a*；不在组件里写 hex。

### B.4 reduced motion 矩阵

| 能力 | 正常 | prefers-reduced-motion | 设置减少动效 |
|---|---|---|---|
| 打字机 | 逐字 | 整页 | 整页 |
| 转场 | 480ms | 无 | 无 |
| 闪白 | 120ms | 无 | 无 |
| 震动 | 180ms | 无 | 无 |
| 划名 | 420ms/90ms | 立即 | 立即 |
| 标题卡 | 240ms 淡入 | 无 | 无 |
| 选项倒计时 | 正常 | 正常 | 正常（计时不是装饰） |

---

## 附录 C 文件钩子（基线行号只作起点）

### C.1 project/index.html

- 在 #scene-ending 结束（基线 119 行）与 #pause（基线 121 行）之间插入 #fx-layer。
- #fx-layer 内放两个空 div：fx-wipe、fx-flash；无文字。
- 音量提示（基线 150 行）从“音效步骤六接入”改为“首次点击后生效”。
- 可选：减少动效标签旁加小字“关闭闪白、震动与划名”；不加新按钮。
- 不改脚本顺序、不加 audio/img。

### C.2 project/style.css

- :root（基线 103 行附近）加动效令牌。
- 在 .stage-art/scene 之后加 .fx-layer 与子层；z-index var(--z-transition)。
- 在 .xb-ending__name（基线 1098 行）附近加 is-struck 与 ::after。
- 保留 @media (prefers-reduced-motion)（基线 196 行）与 html.reduce-motion（基线 2020 行）；新规则不得覆盖成“仍播放”。
- 不用 #hex/rgb()/rgba()；只用 var()。

### C.3 project/engine.js

- XB.core 结束（基线 666 行）之后、XB.engine 注释（基线 668 行）之前插入 XB.audio 与 XB.fx。
- REQUIRED_IDS（基线 696 行）加 fx-layer；cacheElements 自动得到 els.fxLayer。
- init（基线 877 行）在 cacheElements/mountArt 后调 XB.fx.init 与 XB.audio.applySettings；必须在 ?minigame 早退之前。
- showScene（基线 1090 行）检测变化并调 XB.fx.transition。
- renderTitle 1113 / renderMap 1147 / renderVn 1181 / renderEnding 1898 调 XB.audio.setScene。
- resolveChoice 1467 调 choice-select；超时路径调 choice-timeout。
- beginMinigame 1577 的 callbacks 加 onCue；handleMinigameEnd 1657 调 result + climb shake。
- showTitleCard 2328 调 chapter；openCodex 2361/openGallery 2461 调 codex + duck；closeCodex 2399/closeGallery 2470 恢复 duck。
- openPause 2669/closePause 2686 调 duck；onVisibilityChange 2717 调 suspend/resume。
- bindSettings 2724 的音量 input 实时调音频；applySettings 2779 调 XB.audio.applySettings + XB.fx.setReduced。
- onPointerDown 2855 第一行、onKeyDown 2881 第一行调 XB.audio.unlock；不改变既有早退逻辑。
- updateDebug 1064 加 audio/fx 行。
- 不改 go/startNewGame/resumeGame 的语义；不新增存档字段。

### C.4 project/minigames.js

- start 传入 callbacks 时保留现有字段。
- door：放置/移除成功处调 callbacks.onCue(“door-place”)。
- abandon：发船成功处调 callbacks.onCue(“boat-oar”)。
- boat：每趟起航或到达处调 callbacks.onCue(“boat-oar”)。
- climb：失误处调 callbacks.onCue(“climb-fire”)；成功不刷音。
- 所有调用前判 typeof callbacks.onCue === “function”；不改 result 形状。

### C.5 工具

- check-build：在 C30 后加 C31–C36；保留 C05/C09/C30 的阈值；新增检查要使用已有读文件/VM helper，不引入依赖。
- smoke：在 S40 后加 S41–S46；不依赖真实 AudioContext；不请求网络；不写文件。
- 负例：N9–N12 用临时改动 + finally 恢复，记录到 test-cases T38。

---

## 附录 D 测试清单 B45–B56

| 编号 | 场景 | 操作 | 预期 | 证据 |
|---|---|---|---|---|
| B45 | 首次手势/无自动播放 | 打开标题，等 1s，看 debug；点“开始” | 点击前 audio=locked/无 ctx；点击后 ready，有风声；无自动播放 | 截图 + debug |
| B46 | 静音/音量持久 | 音量 30、静音开、刷新；再取消静音 | 设置保留；静音时无声；取消后有声；无爆音 | 截图 + localStorage |
| B47 | 9 床映射 | ?chapter=… 逐章 / ending / map / title；看 debug bed | 14 bg + title/map/ending 全部正确；切换 800ms 无断裂 | 截图/录屏 |
| B48 | 暂停/图鉴/可见性 | 暂停、开图鉴、关图鉴、切后台/回 | 暂停单独 duck 0.3；图鉴单独 0.45；两者同时取 0.3；回来恢复；不丢时间 | 部分（headless 标例外） |
| B49 | 无爆音 | 触发 chapter/ending/result/门板/渡船/攀索；看 peak；扬声器试听 | peak<0.99；无刺耳；无断爆 | debug + run-log |
| B50 | 转场 | ?fx=wipe；真实 标题→地图→VN→结局；reduced | 480ms 横擦；不挡点击；reduced 无 | 截图/录屏 |
| B51 | 闪白 | ?fx=flash；首次进 luding_bridge；reduced | 120ms/0.12/2s 一次；reduced 无 | 截图/录屏 |
| B52 | 震动 | ?fx=shake；攀索 lost>0；reduced | 180ms/2px；只攀索；reduced 无 | 录屏 |
| B53 | 划名 | 结局全答/漏答；?fx=strike；reduced；刷新 | 只划 is-missed；420/90；reduced 立即；刷新重播一次 | 截图/录屏 |
| B54 | 手机横屏 | 844×390、hasTouch；首次 tap；静音；继续 | 首次 tap 有声；设置可用；不挡操作；0 error | 截图 |
| B55 | file:// / http | 两种 URL 各一遍 B45–B50 核心项 | 0 console error、0 404、0 外部请求；可存档 | 截图/日志 |
| B56 | 稳定性/小游戏 onCue | 20 次场景切换；四关各一次；看 activeBeds | 只剩 1 床；onCue 不刷音；无报错；无泄漏 | debug + 日志 |

---

## 附录 E 文档更新核对

| 文档 | 必须出现 | 不得出现 |
|---|---|---|
| docs/audio-system.md | 9 床、12 cue、五音频率、800ms、120ms、0.12、180ms、2px、420ms、90ms、11 键不变 | “待定”“约”“可能” |
| docs/ui-layout.md | #fx-layer、z 60、pointer-events none、划名 reduced | 新颜色 hex |
| docs/visual-system.md | 动效令牌、§6.1、无第二画布 | 改五色/字体 |
| docs/visual-reading.md | 步骤六已接入音量/音效；§6.1 | 仍写“步骤六才发声” |
| docs/quality-bar.md | 音频五条、动效毫秒/像素、T01–T38 | 只写“减少动效”无细节 |
| docs/test-cases.md | T31–T38、T38 负例 N9–N12 | 只到 T30 |
| docs/credits.md | 原创五音、无文件、无人声；保留步骤二状态 | 外部音乐/音效素材 |
| docs/state-schema.md | 音频运行态不落盘、11 键 | 新持久键/版本 2 |

---

## 附录 F 文件树（本步后）

    project/
      index.html          # + #fx-layer；音量提示改字
      style.css           # + 动效令牌/#fx-layer/is-struck
      engine.js           # + XB.audio/XB.fx + 接线
      story.js            # 不改
      minigames.js        # + 可选 onCue
      art.js              # 不改
      tools/
        check-build.js    # 30 → 36
        smoke.js          # 40 → 46
    docs/
      audio-system.md     # 新建
      ui-layout.md
      visual-system.md
      visual-reading.md
      quality-bar.md
      test-cases.md
      credits.md
      state-schema.md
      evidence/step-06/   # run-log 与截图（gitignored）
    step/
      step-06-音频与动效.md

---

## 附录 G 执行顺序（一句话版）

先写 docs/audio-system.md（T6.0）→ 在 engine.js 里把声音安全地做出来（T6.1）→ 接 9 床（T6.2）→ 接 12 cue 与设置（T6.3）→ 加 #fx-layer 与转场/闪白/震动（T6.4）→ 做划名（T6.5）→ 扩 36/46 与负例（T6.6）→ Edge B45–B56（T6.7）→ 回填 docs/证据（T6.8）→ CLAUDE 更新、提交、tag（T6.9）。

一句话原则：**声音是空气，不是主角；动效是呼吸，不是烟花。** 所有声音都可关，所有动效都可减，所有信息在文字里仍然完整。
