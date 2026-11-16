# 步骤二十三 慢网画面兜底

## 1. 目标与反馈

用户原话（m00002）：

> 现在项目最大的问题：不管是线上测试还是本地测试，只要是网络卡顿，或是界面延迟高，游戏内画面就直接显示成了旧版画面（如图）。这个问题能不能彻底解决？至少遇到卡顿或延迟的情况画面展现出的是最新的样子

截图显示 Cloudflare 线上第五章·草地：HUD 已是现行版本（行囊 1.5/4 格、状态 良好、自动/跳过/回顾），背景却是程序化版画的平涂草地与草簇。用户所说的“旧版画面”不是旧 JS/旧文件，而是照片底图未到时 art.js 主动回退到程序化旧画。

## 2. 根因

- project/art.js 旧逻辑：全图未 ready → 画 480 占位；占位也未 ready → 调 PAINTERS[sceneId] 程序化版画。
- 慢网下 480 占位约 1 秒、1600 WebP 约 4.6 秒，首屏程序化画面可持续十几秒；请求被 abort 时 __failed 置位，之后一直走程序化。
- 线上资源本身不是旧版；Cloudflare 的 Cache-Control: public, max-age=0, must-revalidate 也会重新校验。问题在“图没到时的兜底画法”。

## 3. 方案

### 3.1 内联 LQIP

- 从 assets/backgrounds/placeholders/*.webp（480×270）生成 320×180、质量 0.35 的 WebP 微缩图，base64 内联在 art.js 的 PLATE_LQIP。
- 12 张合计 90,588 个 base64 字符，解码后约 67,941 字节；gzip 后约 63KB。
- setCanvasFallback(canvas, base) 把对应 LQIP 设为 #stage-art 的 CSS background-image，background-size: cover、background-position: center，按 base 去重。
- 照片场景（fullSrc 存在）在 480/1600 都未 ready 时画布透明，直接透出 CSS LQIP，**不再调用 PAINTERS**。程序化画只保留给 map 等无照片场景。

### 3.2 状态与重试

- is-lqip：照片场景等待图片，只有 LQIP。
- is-photo：480 或 1600 已画。
- is-placeholder：已有 480，1600 尚未到。
- 失败重试 PLATE_RETRY_DELAYS = [1000, 3000, 8000]，最多 3 次；http(s) 重试加 ?r=N，file:// 保持同 URL。
- 全图先 WebP，失败回退 1920 JPEG；再失败停在 LQIP 并重试。
- window online 与 document visibilitychange 调 retryFailedImages()；断网时不排重试。
- drawPlate 对 0 尺寸图片直接返回，避免坏图抛错。

### 3.3 缓存版本

- index.html 的 style.css、art.js、story.js、engine.js 统一加 ?v=20261116-lqip，避免浏览器继续用旧版脚本。

## 4. 代码改动

- project/art.js：PLATE_LQIP、setCanvasFallback、paint 的 LQIP 分支、is-lqip、is-placeholder、PLATE_RETRY_DELAYS、retryUrl、scheduleImageRetry、markImageLoaded、markImageFailed、retryFailedImages、drawPlate 空尺寸守卫。文件 56,065 B → 约 148 KB。
- project/index.html：四个运行时资源查询串。
- project/tools/check-build.js：C03 比较脚本顺序前剥查询串；C05 JS gzip 预算 150KB → 220KB；C07 校验 12 张照片底图都有 data:image/webp;base64、数量一致，并保留“照片未到不画程序化”的源码回归。
- docs/quality-bar.md：性能预算与 §2.1 慢网首屏兜底。
- docs/visual-system.md：三层图片与 LQIP 兜底口径。
- docs/ui-layout.md：章首卡等待图片时的底层 LQIP。
- project/index.html、project/style.css：标题静态层底色改透明，静态占位图未到时让 #stage-art 的 LQIP 透出；已加载完整图时仍由静态层先显示。
- project/tools/_pw-artload.js：浏览器专项，支持 normal/slow/abort/recover/scenes、--file、--mobile、--cpu=N、--title。
- project/tools/_pw-lqip-gen.js：从 480 占位生成 320×180 LQIP 与对比图。

## 5. 验收

| 项 | 结果 |
|---|---|
| http 正常 | 465ms 时 stage-art is-photo，hasLqip true，0 console/pageerror/失败请求 |
| 8s 延迟 | t0/t1/t3 均 is-lqip + data:image/webp；t9/t11 变 is-photo is-placeholder；0 错误 |
| 全部背景 abort | 0–11s 一直 is-lqip，不出现程序化草地；重试出现 ?r=1、?r=2；0 pageerror |
| 恢复网络 | abort 后解除路由并派发 online，快照回到 is-photo |
| file:// | normal 全程 is-photo；abort 全程 is-lqip；两者 0 pageerror |
| 844×390 | normal 全程 is-photo，0 console/pageerror/失败请求 |
| 16 个场景 | 逐个 paint：16 个照片场景全部 is-lqip + LQIP；map 保留程序化、无 LQIP |
| 标题首屏 | normal 452ms is-photo；8s 延迟 t0（461ms）is-lqip + LQIP、t9 is-photo；abort 0–11s 停在 LQIP；0 pageerror |
| CPU 6× + 8s 延迟 | t0（1.08s）is-lqip，t9（10.6s）is-photo is-placeholder，0 错误；截图是模糊照片草地 |
| 回归 | check-build 52/52、smoke 47/47、check-script 9 文件 OK、_pw-textpass 33/33 |
| 体积 | JS gzip 206KB（预算 220KB）；CSS 23KB（预算 30KB） |

## 6. 证据

- docs/evidence/step-23/normal/
- docs/evidence/step-23/slow/
- docs/evidence/step-23/abort/
- docs/evidence/step-23/recover/
- docs/evidence/step-23/file/
- docs/evidence/step-23/file-abort/
- docs/evidence/step-23/mobile/
- docs/evidence/step-23/scenes/
- docs/evidence/step-23/title-normal/
- docs/evidence/step-23/title-slow/
- docs/evidence/step-23/title-abort/
- docs/evidence/step-23/cpu-slow/
- docs/evidence/lqip-textpass/

关键截图：docs/evidence/step-23/slow/t0.png、docs/evidence/step-23/cpu-slow/t0.png（均为模糊照片草地，不是旧版程序化画面）；docs/evidence/step-23/title-slow/t0.png、title-abort/t0.png（标题人物底图 LQIP，不是纸纹或旧版程序化）。

## 7. 未做

- 已提交 `49edea8`、打包 v1.9.2-dev；GitHub Pages（`6324e5a`）、Netlify（`6afa93e2`）与 Cloudflare Pages（`e6797715`）已部署 v1.9.2-dev，三站线上慢网专项均停在 LQIP。部署已获用户 m00697 确认。
- 未做真实 3G/4G 手机、Chrome/Safari/真机、20 分钟真人计时、11 路线全量、隐私模式重跑。
- 如果浏览器本身返回了旧的 index.html（离线缓存/旧 ZIP），页面仍会加载旧脚本；本次只解决“当前 HTML 下图片慢/失败”的旧画回落。三站当前均返回 max-age=0, must-revalidate，正常刷新会拿到新版本。
