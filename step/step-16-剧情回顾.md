# 步骤十六：剧情回顾（v1.7.0-dev）

> 2026-11-08 · 分支 v1.4-dev · 未打包/未部署 · 证据 docs/evidence/step-16/
> 需求来源：用户 m00001；取舍（按钮在暂停下方、跨刷新保留、记录范围、保留字号设置）由用户 m00160 确认。

## 1. 目标与范围

- 玩家在 VN 中随时点右上“回顾”，全屏翻看已经走过的对话、选择与金沙江记名；右上 × 或 Esc 关闭，回到原句继续。
- 所有选择（单选、多选、记名）在选择历史里用黄色粗体 `➤` 行显示；选择前的提示句弱化显示，不算选择。
- 只读：不能跳回、不能改选项、不能从这里存档；打开期间冻结计时与打字机。
- 不记录点名答到、危机/门板弹窗按钮、物资使用与结局页；历史只覆盖叙事对话与选择。
- 不新增框架、不改 story.js、不进入 20 分钟主线预算。

## 2. 数据与口径

- 独立键 `xiangbei.history.v1`：`{version:1,runs:{[slotId|'session']:{entries,checkpoint,updatedAt}}}`；不占主档 11 键与 4096B。
- 只存节点引用：`line {t,c,n}`、`prompt {t,c,n,k}`、`choice {t,c,n,k,key,timedOut}`、`multi {t,c,n,ids}`、`namepick {t,c,n,nameId,timedOut}`；打开面板才从 `XB.story` 解析文本。
- 800 条/桶、24 桶；连续同 `t+c+n` 去重；多选 id 最多 16；坏条/坏桶丢弃；整键坏 JSON 备份 `.bad`。
- 400ms debounce；打开/关闭/保存/页面隐藏 flush；隐私模式保留内存并只提示一次。
- checkpoint 只在 `saveNow()` 成功后推进；`loadSlot` 在 render 前截到 checkpoint，读档后的回顾与主档进度一致。
- 新档重置新槽；删档删桶；初始化清整键；`?reset=1` 清历史与存档，不动分支/成就/名册。

## 3. 界面与交互

- 入口 `#vn-history-button`：桌面 `right 32 / top 84 / 112×44`（暂停正下方），移动 `right 12 / top 120 / 96×96`；标题卡/地图/结局隐藏。
- 面板 `#history-panel`：1280×720 实色 `#080D13`；左上朱砂竖条 + “剧情回顾”，右上无边框 ×；两栏 200/1/1fr，人名右对齐、纸白台词；章节分隔；打开滚到底。
- 选择行 `➤ + 文本`，`--history-choice:#F2C45C` + 700；超时追加“（时间到了，默认项）”；多选“、”连接/空选“没有选任何一样”；记名“抄下「张老幺」的名字”/“一个名字也没抄”。
- 正文固定 22px/1.9（移动 28px 逻辑），不跟字号设置；`html`/`body`/`#stage` 与回顾层 `user-select:none`（横屏提示也不可选），回顾层额外 `-webkit-user-drag:none`，无 contenteditable。
- 打开：暂停、取消自动、暂停打字机与倒计时、duck 0.45、焦点到 ×；关闭恢复计时/自动/跳过/焦点。Esc 关闭、Tab 锁焦点、数字/空格不穿透。

## 4. 改动文件

- `project/engine.js`：HISTORY_KEY/上限/内存态；normalize/读写/迁移/截断；8 个记录点；openHistory/closeHistory/renderHistory；init/loadSlot/saveNow/startNewGame/删档/初始化/clearSave；REQUIRED_IDS；handleAction/onKeyDown/onPointerDown/refreshAudioDuck。
- `project/index.html`：回顾按钮、`#history-panel`（标题/关闭/滚动区/空态/列表）。
- `project/style.css`：`--history-bg`/`--history-choice`/`--z-history`；`.vn-history-button`、`.xb-history*`；移动覆盖；标题卡隐藏；不可选中。
- `project/tools/check-build.js`：REQUIRED_IDS 两处同步；C49（独立键、记录函数、paused、choice key、HTML、金色、固定字号、无 `--text-scale`、700）。
- `project/tools/_pw-step16.js`：all/empty/privacy/mobile/file 端到端。
- `docs/ui-layout.md` §1/§14、`docs/state-schema.md` §9/§10.4/§11、`docs/test-cases.md` T16-01…10、`.claude/CLAUDE.md` 步骤十六。

## 5. 验证

| 项 | 结果 |
|---|---|
| `node --check project/engine.js` | 通过 |
| `node project/tools/check-build.js` | 48/48（C49） |
| `node project/tools/smoke.js` | 47/47 |
| `node project/tools/check-script.js docs/script` | 9 文件 OK；story.js 未改 |
| `_pw-step16.js --url=http --case=all` | 56/56 |
| `_pw-step16.js --url=file --case=all` | 56/56 |
| `_pw-step16.js --case=mobile --mobile` | 11/11（844×390） |
| `_pw-step16.js --case=privacy` | 5/5 |

证据：`docs/evidence/step-16/http-all/`、`file-all/`、`mobile/`、`privacy/`（result.json、run.log、截图）。

## 6. 已知口径与未覆盖

- 历史只从本功能上线后的当前章开头积累；旧档不补历史。
- 800 条/24 桶满额截断、真实手机长列表性能、Chrome/Safari 与真机触摸未单独跑（P1，沿用既有例外）。
- 回顾面板是只读层，不提供跳回/分支/存档树，符合“不做好感度/真结局/分支存档树”的边界。
- 未打包 dist/、未部署、不合并 main；线上仍是 v1.1.1 四关版。
