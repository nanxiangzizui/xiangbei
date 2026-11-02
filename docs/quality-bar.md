# 《向北》质量底线（可访问性 / 性能 / 兼容）

> 目标：老师电脑、学生手机、断网 ZIP 都能跑；不追求 3A，但不能白屏、不能卡死、不能只有鼠标能玩。

## 1. 可访问性

| 项 | 底线 | 验证 |
|---|---|---|
| 正文字号 | 舞台 26px；手机缩放后 ≥14px；设置里可 textScale 1.15/1.3 | T17 |
| 对比度 | 正文/背景 ≥4.5:1；大字 ≥3:1 | 取色器抽查 |
| 键盘 | Enter/空格推进；Esc 暂停；1–3 选项；Tab 焦点；小游戏 1–8 选卡、Shift+1–6 歇船、Enter/空格确认、Esc 暂停 | T03/T05/T08–T12 |
| 焦点 | 2px 朱砂焦点环，偏移 2px；不靠颜色 alone；canvas 可聚焦并显示焦点环 | 目测 |
| 触摸 | 所有热区 ≥44×44；小游戏逻辑热区 ≥96×96（844×390 下约 52×52 物理）；暂停按钮 96×96；pointer 事件；不依赖 hover | T17 |
| 动效 | prefers-reduced-motion 与设置开关都关闭转场/闪白/震动/划名动画；闪白 120ms、峰值 .12、间隔 ≥2s；震动 180ms、±2px；划名 420ms | T16/T36/T37 |
| 音频 | 不自动播放；首次 pointerdown/keydown 后建 AudioContext；9 床/12 cue；暂停 duck 0.3、图鉴 0.45；静音/音量持久；峰值 <0.99 | T16/T31–T35 |
| 文字替代 | 小游戏首屏有文字规则；结算用 DOM 面板给文字结果；Canvas 不承载唯一信息；canvas 有 aria-label + 后备说明 | 目测 |
| 读屏 | 不承诺全游戏可读屏；菜单/设置/图鉴/结算用真实 DOM 按钮和标题；小游戏状态用 aria-live="polite"，节流 500ms | 目测 |

## 2. 性能预算

| 项 | 预算 | 说明 |
|---|---|---|
| 首屏 | 4G 下 ≤1.5s | 无外部请求；字体 subset |
| JS | ≤150KB gzip | 6 个 js 文件合计 |
| CSS | ≤30KB | 不含字体 |
| 字体 | ≤300KB 合计 | 标题 + 正文 subset；失败回退系统宋体 |
| 图片/音频 | 0 外部文件 | 全部程序化/Web Audio |
| 帧率 | 桌面 60fps；手机 ≥30fps | 小游戏 Canvas |
| DPR | 上限 2；backing store 固定 1280×720 逻辑坐标 | 避免 3x 手机过度绘制；坐标换算用 getBoundingClientRect |
| 动画 | transform/opacity | 不触发布局抖动 |
| 循环 | 同一时刻只有一个 rAF；小游戏不另起第二个 | 场景退出/暂停时停止并移除监听 |
| 音频节点 | 同时环境床 ≤2；单 cue 振荡器结束即停止/断开；噪声 buffer 只生成一次 | debug 看 beds；反复切场景 10 次不增长 |
| 内存 | 一章不增长 | 反复进出小游戏 5 次检查；结果数组不累积 |

## 3. 兼容

- Chrome/Edge/Safari 最近两个大版本；iOS Safari 用真机或开发者工具。
- iOS 音频：首次 pointerdown 里 resume AudioContext。
- 移动端高度：用 100dvh，100vh 兜底；不让地址栏遮住对话框。
- file://：不用 fetch/XHR/ES module；剧情内联；localStorage 失败要降级。
- 字体：font-display: swap；加载失败回退 Songti SC/SimSun/serif。
- 不依赖 CDN；所有路径相对 ./；GitHub Pages 子路径可跑。

## 4. 隐私与安全

- 不接 analytics、不上传存档、不发网络请求；localStorage 只存本机。
- 不用 eval/new Function；不把用户输入拼进 HTML（本游戏无输入框）。
- 不收集姓名/设备信息；演示视频里的人名用虚构角色名。

## 5. 质量闸门

- T01–T38：P0 全过，含 T20 真人四次计时；T39–T51 见 §6 与 docs/test-record.md。
- 音频：无音频文件；加载时 locked；首次手势后 ready；静音/音量刷新保留；peak<0.99；无 setInterval。
- 动效：480ms 横擦、120ms 闪白、180ms 震动、420ms 划名；reduced 下全部立即完成；不阻挡输入。
- 20 分钟：4 次计时 04:52–08:33，均 ≤20:00；已通过（见 §6）。
- 4 个核心小游戏可独立进入（?minigame=…）；失败路径继续剧情、不重开；单关 60–90s（含 20s 结算）。
- 7 张史实注可解锁；结局点名 + 7000 + 五卡。
- 手机横屏可玩；断网 ZIP 可玩；Edge 完整流程通过；Chrome/Safari 为 P0 环境例外，经用户 2026-11-02 接受（不记为通过）。
- 无 console 报错、无 404、无外部请求。
- 字体/素材授权清单在 docs/credits.md；游戏内有制作名单。

## 6. 步骤七实测（2026-11-02，Edge 156 headless）

| 项 | 实测 | 判定 |
|---|---|---|
| JS/CSS gzip | 75KB / 9KB | PASS（≤150/30KB） |
| 桌面 1920/1366/1280 | 舞台 1920×1080 / 1365.33×768 / 1280×720 | PASS，不溢出 |
| 手机 844×390 | 舞台 693.33×390；全流程 200.9s/406 line；暂停 52×52 CSS px；ending 676×372.67 可滚、五卡可达 | PASS |
| 手机字号 | 正文 14.08、lede 15.17、姓名 14.08、卡句 14.08、stats 14.08 CSS px | 全部 PASS（≥14） |
| 竖屏 390×844 | 舞台 display:none，仅提示 | PASS |
| 正常运行 | 0 console error / pageerror / 404 / 外部请求 | PASS（Edge/file+http） |
| 四关 | 正常 1.0s / 1.8s / 90s / 29.1s；失败 75.0s / 80.0s / 90.0s / 39.9s | PASS（无评分/不重开） |
| 20 分钟 4 次（A–D） | 04:52–08:33；最大 08:33 | PASS |
| fps | 未测 | 未验证 |
| 音频 | locked→ready、9 床/12 cue、duck 0.3、activeBeds≤1；主观听感未验 | 部分 |
| Chrome/Safari | 未执行 | P0 环境例外，经用户接受（X1/X2） |

详见 `docs/test-record.md`。
