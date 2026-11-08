# 《向北》音频与动效系统（步骤六 + v1.1.0 素材增强）

> 状态：步骤六实现规格（2026-11-02），v1.1.0（2026-11-04）补入外置环境声与配乐；v1.2.0-dev（2026-11-06）删除四关小游戏，保留床/通用 cue/五音动机。运行时仍只有 `project/engine.js` 内的 `XB.audio` 与 `XB.fx`；不新建 `audio.js` / `fx.js`。外置音频只用 `<audio>` + `MediaElementSource`（或 `file://` 直连回退），不引入 CDN、ES module 或 `fetch`。
> 声音是氛围与反馈，不是得分奖励：没有成功/失败音、没有 Game Over 音、没有战斗音效。

## 1. 边界与非目标

- 管：环境床、交互 cue、原创五音动机、首次手势解锁、静音/音量、暂停/图鉴 duck、页面隐藏暂停、转场/闪白/震动/划名。
- 不管：剧情节点、旗标、结局快照、选择结果结构（仍由 `story.js` / `engine.js` 现有契约负责；v1.2.0-dev 无 `minigames.js`）。
- 不做：语音、歌曲、自动播放、Web Audio 之外的音频 API。v1.0 不引入音频文件；v1.1.0 只引入已授权的 5 条环境声与 8 首配乐 MP3，并用 `<audio>` 接入。
- 减少动效：系统 `prefers-reduced-motion: reduce` 与设置「减少动效」任一开启，都关闭转场/闪白/震动，划名立即到终态。

## 2. 信号图

    ambienceBus (0.35) ─┐
    sfxBus      (0.55) ─┼─→ masterGain ─→ DynamicsCompressor ─→ destination
    musicBus    (0.62) ─┘        │
                                 └─ debug 时另接 AnalyserNode（只读峰值）

    外置 <audio> ──(http/https: MediaElementSource → 对应 bus)──┘
                  └─(file://: 直连扬声器，volume 由设置/duck 计算)

- `masterGain` 目标值：`muted ? 0 : 0.87 × volume`；所有增益变化用 `setTargetAtTime(value, now, 0.04)`，不做硬切。
- 压缩器：threshold −14 dB、knee 10、ratio 4、attack 0.003s、release 0.25s，防止多 cue 叠加削波。
- 噪声：单声道 2 秒 buffer，首次需要时生成一次，所有风声/水声/摩擦复用；不每帧新建 buffer。
- 振荡器只用 `sine` / `triangle`；不用方波、锯齿波。单次 cue 的振荡器在结束后停止并断开。
- 环境床最多同时 2 条 voice；旧床 800ms 淡出，超过 2 条时最旧的 120ms 收尾；切换同一 bed 直接返回，不重启动。

## 3. 环境床（9 张）

| bed id | 使用场景 | 音色要点 |
|---|---|---|
| `wind_title` | title / map | 低频风声 + 极轻 46Hz 底音；标题不抢文字 |
| `yudu` | yudu_river / yudu_night | 于都河水，带通噪声缓慢起伏 |
| `xiangjiang` | xiangjiang_ford / xiangjiang_dawn | 更宽的水面与 48Hz 低音，压住湘江段落 |
| `zunyi` | zunyi_hall / zunyi_street | 室内低频 + 远处街声，安静、留白 |
| `jinsha` | jinsha_river / jinsha_night | 急流带通噪声，频率略高于湘江 |
| `luding` | luding_bridge / luding_after | 峡谷风 + 2.4kHz 铁索细响，不用金属采样 |
| `grass` | grass_marsh / grass_dawn | 沼泽闷风，低通为主，无鸟叫旋律 |
| `wuqi` | wuqi_dawn / wuqi_wall | 陕北晨风 + 45Hz 底音，收束 |
| `ending` | ending | 最轻的风与 42Hz 底音，给点名与五卡让路 |

映射规则：

- `BED_BY_SCENE` 共 18 项：15 个剧情背景 + `title` / `map` / `ending`；未知场景回退 `wind_title` 并只警告一次。
- 场景切换由 `renderTitle` / `renderMap` / `renderVn` / `renderEnding` 调 `XB.audio.setScene`；v1.2.0-dev 无小游戏循环。
- 同一场景重复渲染不重启动；多选/结算覆盖层不换床。

## 4. 交互 cue（12 个）

| cue | 触发 | 设计 |
|---|---|---|
| `chapter` | 章节标题卡出现 | 五音动机前 3 音 + 轻鼓；不盖标题卡 |
| `choice-select` | 选项落定 | 短三角波 + 高频轻噪声，确认而非奖励 |
| `choice-timeout` | 限时归零、按默认项结算 | 低音下沉 + 轻噪声，提示代价已发生 |
| `codex` | 打开史实注/图鉴 | 纸页高频噪声两段，短、干 |
| `drum` | 需要鼓点的章节演出 | 92→48Hz 下滑正弦，0.42s |
| `rollcall-answer` | 点名答到 | 660/990Hz 两个短音，像点名册上的应答 |
| `rollcall-miss` | 点名漏答/替答失败 | 92Hz 低音 + 低通噪声，不做惩罚音 |
| `result` | 选择结算面板出现（v1.2.0-dev 由渲染层调用） | 一记轻鼓 + 短噪声，只报“结束了” |
| `door-place` | **v1.1.1 历史**：门板装入/取出 | 118Hz 木钝响 + 低通噪声；v1.2.0-dev 无调用点 |
| `boat-oar` | **v1.1.1 历史**：发船/靠岸/弃物发船 | 两段带通水声；v1.2.0-dev 无调用点 |
| `climb-fire` | **v1.1.1 历史**：攀索失误/火墙压过来 | 高频噪声 + 70Hz 短音；v1.2.0-dev 无调用点 |
| `ending` | 首次进入结局 | 完整五音动机 + 轻鼓 + 长气息 |

- `cue(name)` 先查 12 项白名单；未知、无 ctx、静音、80–120ms 内重复都返回 `false`，不抛错。
- v1.2.0-dev 只由引擎调用：单选 `choice-select`/`choice-timeout`，多选确认 `choice-select`，章首 `chapter`，图鉴 `codex`，结局 `ending`。
- `door-place` / `boat-oar` / `climb-fire` 与 `result` 保留在 12 项白名单里只为旧代码/旧文档兼容，四关删除后没有小游戏回调；同一动作不重复叠加。

## 5. 原创五音动机

| 音 | 频率 | 起点 | 时值 |
|---|---|---|---|
| D4 | 293.66 | 0.00s | 0.45s |
| F4 | 349.23 | 0.55s | 0.25s |
| G4 | 392.00 | 0.90s | 0.45s |
| A4 | 440.00 | 1.45s | 0.25s |
| C5 | 523.25 | 1.80s | 0.90s |

- 音色：triangle 0.7 + sine 0.3，经 1800Hz 低通；5Hz、约 4 音分颤音；慢起慢收。
- 章节卡用前 3 音，终章用 5 音；不做主题歌、不重复到洗脑。
- 动机是原创音高序列，不引用任何歌曲旋律。

## 6. 生命周期与持久化

- 模块加载、`XB.engine.init`、`applySettings`、`setScene` 都不创建 `AudioContext`。
- 唯一创建入口是 `unlockAudio`：`onPointerDown` 与 `onKeyDown` 的第一句调用 `XB.audio.unlock()`；首次手势后创建/恢复上下文并建图。
- 不支持 Web Audio 时：`supported=false`，toast「本机无法播放声音，游戏可继续」，不阻断游戏。
- 页面隐藏：`visibilitychange` → `suspend()`，VN 未暂停则打开暂停；回到可见 `resume()`。
- 暂停 duck 0.3；史实注/图鉴 duck 0.45；两者同时取更小值；关闭后恢复 1。
- 音量分三层：`settings.volume`（总音量）、`settings.musicVolume`（配乐）、`settings.ambienceVolume`（环境音）；静音仍由 `settings.muted` 统管。2026-11-04 新增后两个键，旧档按 1 补齐；顶层 `PERSIST_KEYS` 仍是 11 键、`SAVE_VERSION=1`。
- `ambienceBus`/`musicBus` 的实际增益乘各自独立音量：`0.35×ambienceVolume`、`0.62×musicVolume`；总音量再乘 `muted?0:0.87×volume`。
- 三个滑块 `input` 实时调 `XB.audio.applySettings({volume,musicVolume,ambienceVolume})` 并 `saveNow()`；静音走统一 `applySettings`。设置面板共八行，面板 440 高可滚。

## 7. 动效层

### 7.1 墨色横擦转场

- 一个 `#fx-layer`：`#stage` 内、`#scene-ending` 之后、`#pause` 之前；`position:absolute; inset:0; z-index:var(--z-transition)`；`pointer-events:none`；`aria-hidden="true"`。
- 子层 `.fx-wipe` / `.fx-flash`；转场只加 `.is-paper`（title/map）或 `.is-night`（vn/ending），再触发 `.is-wiping`。
- 480ms，纸白或夜蓝渐变横擦；不阻挡输入；首载不播；1.2 秒内多次切换以最后一次为准（重启动画，不排队）。

### 7.2 泸定闪白

- 首次进入泸定桥场景闪一次：120ms、峰值透明度 0.12、间隔至少 2000ms；只闪一次（`ludingFlashed`）。
- 闪白只叠在画面层，不改变文字对比度；减少动效时完全不闪。

### 7.3 攀索震动（v1.1.1 历史）

- v1.1.1 攀索结算 `stats.lost > 0` 时 `#stage` 震动：180ms、水平 ±2px；keyframes 里保留 `scale(var(--scale))`，不破坏舞台缩放。
- v1.2.0-dev 已无攀索与小游戏结算，`XB.fx.shake` 只保留通用 API，不再由关卡触发。
- 同一时刻只一个震动；300ms 内重复调用直接返回。

### 7.4 墨迹划名

- 只在 ending 的 `li.is-missed` 上划；正常延迟 500ms，每行再错开 90ms；单行 420ms。
- 用 `.xb-ending__name-text::after` 画 2px 墨线，`scaleX(0→1)`、左端为原点；保留 `text-decoration: line-through` 作为无动画回退。
- 每局只播一次（`endingStrikePlayed`）；进入 ending 时 reset；减少动效时立即显示终态。
- 划名不是“处决”，只是把名字记下来；不加音效、不加红色、不做特写。

## 8. 上限与保护

| 项 | 上限 |
|---|---|
| 闪白时长 | ≤150ms（实际 120ms） |
| 闪白间隔 | ≥2000ms |
| 闪白峰值 | ≤0.12 |
| 震动时长 | ≤200ms（实际 180ms） |
| 震动位移 | ≤2px |
| 划名单行 | ≤500ms（实际 420ms） |
| 同时环境床 | ≤2 |
| 单 cue 节流 | 80–120ms（实际 100ms） |

- 压缩器兜底，但所有 cue 的峰值仍按“轻”设计；不靠削波掩盖爆音。
- `prefers-reduced-motion` 与设置开关双入口；CSS 里对 `.is-struck::after` 与 wipe/flash 显式设终态，避免全局 `animation:none` 停在起始帧。

## 9. 调试与验收

- `?debug=1` 面板追加：`audio=locked|ready|suspended|off`、`bed=`、`duck=`、`beds=`（同时 voice 数）、`peak=`（Analyser 峰值，保留 3 位）。
- `?fx=wipe|flash|shake|strike`：只用于手工看动效；不写档、不进正式 UI。
- 工具：check-build C31–C36；smoke S41–S46；负例 N9–N12。浏览器 B45–B56 见 `docs/evidence/step-06/run-log.md`。
- 外置音频：C31 扫描 `assets/` 与运行时引用，当前为 13 个 MP3（5 环境 + 8 配乐）；`AudioContext` 只在 `engine.js` 的 `XB.audio` 创建一次。
- 主观听感（是否刺耳、是否盖住文字）必须真人听一遍；headless 只能验证连接、状态、峰值与计时，不能替代耳朵。

## 10. v1.1.0：外置环境声与配乐

- 5 条环境声：`wind/river/rain/birds/fire`，全部 MP3，位于 `project/assets/audio/ambience/`；按 `ENV_BY_SCENE` 权重叠加，仍受 `ambienceBus`、duck、静音与音量控制。
- 8 首配乐：`shangri_river/oriental/a_bitter_hope/visions_of_freedom/sunrise_dynasty/final_heros_monologue/misty_mountains/frozen_orchard`，位于 `project/assets/audio/music/`；按 `MUSIC_BY_SCENE` 一章一首，标题/结局用 Shangri River，草地/雪山用 Misty Mountains。
- 9 张合成 BEDS、12 个 cue 与五音动机保留；外置层是底噪与配乐，不替代原有事件反馈。合成床最多 2 条，外置层不占这个上限。
- 配乐接入前统一归一化到约 `RMS 0.10`，峰值上限 `0.95`；`MUSIC_DEFS.gain = 1.5`，使 Web Audio 与 `file://` 直连两种路径的响度一致。曲目只做整体增益，不改旋律与结构。
- `file://` 下若 `createMediaElementSource` 失败，回退 `<audio>` 直连：`directEnvLevel` / `directMusicLevel` 按 `0.35×ambienceVolume` / `0.62×musicVolume` 的 bus 等价系数、`0.87×volume`、duck 计算 `el.volume`，并仍然响应静音、暂停与三档音量。
- 直连路径换曲用 1.4s `fadeDirectElement` 淡入淡出，旧曲 1600ms 后暂停；只有 `audioState.musicCurrent` 能恢复音量，避免旧曲取消静音时复响。
- 所有外置文件均为现代录音/现代配乐，不是 1930 年代原声；授权与出处见 `project/CREDITS.txt`、`docs/credits.md`、`resource/README.md`。
- 不自动播放：仍由首次 pointerdown/keydown 的 `unlockAudio` 创建/恢复 `AudioContext` 后才启动外置层。