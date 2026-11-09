# 步骤十八：标题入口与门板唯一状态（v1.7.2-dev 增量）

> 2026-11-09 · 分支 v1.4-dev · 已提交 a36cce1 · v1.7.2-dev 已打包并部署双站 · 证据 docs/evidence/step-18/
> 需求来源：用户 m00001。

## 1. 目标与范围

本轮只修两处：

1. **标题初始化入口**：首屏没有“开始”，第一次玩的人点标题却会被问“是否初始化”；把“向北”改回纯标题，主按钮改为“开始 / 继续”，初始化移到“设置 → 危险操作”，二次确认。设置面板原先只挂在暂停遮罩里，本轮补齐标题态入口与返回路径。
2. **门板状态**：`doorOutcome` 是唯一权威枚举；剧情不再写 `item.door` / `had.door`，这两个值和 `inventory.door` 全部由 `syncDerivedFlags` 派生；旧档只在迁移时从旧副本反推一次。

不改历史终点、11 条人物结局、行囊/状态规则、存档键与面板结构。

## 2. 标题与设置

- `index.html`：`<h1 class="title-main">向北</h1>`，不再是 button，不再有 `init-game` / “点击初始化游戏” aria-label。
- 主菜单第一项仍 `data-action="saves"`，文案改“开始 / 继续”，仍打开同一个 `#saves-panel`；其余图鉴/名册/分支/成就四项不变。
- 菜单外右上新增 `.title-settings`（`data-action="open-settings"`，`aria-haspopup="dialog"`），桌面 168×68 逻辑，844×390 下 82 逻辑≈44.4 CSS。
- 设置面板 DOM 仍复用 `#vn-settings`（在 `#pause` 内）：标题态打开时借 `#pause` 当遮罩、隐藏暂停菜单；`settingsState.from` 记录来源，关闭时恢复来源焦点。暂停态打开时不显示危险操作。
- `#settings-danger` 放在设置滚动区末尾：标题“危险操作”、清空范围说明（存档/分支/成就/名册/回顾，保留音量字号，不可撤销）、`#settings-init-game`（`data-action="init-game"`）。
- 初始化确认文案：“这意味着你的存档、剧情分支、成就和回顾记录会被全部清空，名册也会清空；音量、字号等设置保留。此操作不可撤销。”选“是”先关确认、再关设置、再 `initializeGame()`；完成后回标题并聚焦菜单第一项。
- 键盘：设置内 Tab 锁在面板内，Esc 关闭并回 `.title-settings`；确认弹窗内 Tab 锁“是/否”，Esc 等同“否”。

## 3. 门板唯一状态

- 权威：`flags.doorOutcome`，取值 `none/carried/bridge/grass/wuqi/others`。
- 派生：`syncDerivedFlags` 顶部固定写
  - `had.door = doorOutcome !== "none"`（带过板）
  - `item.door = doorOutcome === "carried"`（板还在身上）
  - `inventory.door = item.door`
- 剧情只写 `doorOutcome`，六处写点：
  - p021 A 带板 → `carried`；p021 B 不带 → `none`
  - x025a C 湘江铺桥 → `bridge`
  - l019 A 泸定铺桥 → `bridge`
  - w013 A 门板留吴起 → `wuqi`；w013 B 继续背 → `carried`
- 引擎只读 `doorOutcome`：`doorCarried`、`routeOf` 死亡分支、`settleGrass` 的“板还在身上”、`settleDoor` 的桥板/吴起板/草地收口。
- 旧档：`inferDoorOutcomeFromLegacy` 仅在 `doorOutcome==="none"` 时反推一次（item→carried、memory.door→wuqi、choice.luding.door→bridge、x025a C→bridge、v1.4 早期 item=false→bridge、v1.3→grass），随后统一由 sync 重算三个副本；湘江 C 压过 grass/others 的修复仍只认 `choices` 里的节点+选项。

## 4. 改动文件

- `project/index.html`：标题纯文本、菜单文案、`.title-settings`、`#settings-danger` / `#settings-init-game`。
- `project/style.css`：`.title-settings` 定位与移动热区、危险操作区样式，删除旧 `.title-main__button` 规则。
- `project/engine.js`：`settingsState` 与标题/暂停双态开关；危险操作入口；初始化焦点回收；门板派生、迁移反推、`settleGrass/settleDoor/routeOf` 只读 outcome。
- `project/story.js`：六处门板写点改为只写 `doorOutcome`。
- `project/tools/check-build.js`：C44 重写、C51 新增、REQUIRED_IDS 同步。
- `project/tools/smoke.js`：S08/S19/S20/S26 改用 `doorOutcome` 夹具，S19 断言直接写 `item.door` 被拒。
- `project/tools/_pw-step18.js`：http/file 桌面 61 项、移动 6 项。

## 5. 验证

| 项 | 结果 |
|---|---|
| `node --check project/engine.js` / `story.js` / `art.js` | 通过 |
| `node project/tools/check-build.js` | 50/50（C44 重写、C51） |
| `node project/tools/smoke.js` | 47/47 |
| `node project/tools/check-script.js docs/script` | 9 文件 OK |
| `_pw-step18.js --url=http --case=all` | 61/61，0 console error / 0 失败请求 |
| `_pw-step18.js --url=file --case=all` | 61/61，0 console error / 0 失败请求 |
| `_pw-step18.js --url=http --case=mobile --mobile` | 6/6，0 console error / 0 失败请求 |

证据：`docs/evidence/step-18/http/`、`file/`、`mobile/`（result.json、run.log、截图）。

首轮移动 5/6：唯一失败是设置入口热区 91×36.83 CSS（844×390 按高度缩放）；把 `#scene-title .title-settings` 的 min-height 提到 82 逻辑 px 后为 44.42 CSS。另修一处定位 bug：`.title-settings` 被后面的 `.xb-btn { position: relative }` 覆盖，改为 `#scene-title .title-settings` 提高优先级。

## 6. 已知口径与未覆盖

- 设置面板没有搬出 `#pause`；标题态只是借用遮罩。减少 DOM 改动，代价是“标题设置”与“暂停设置”共用一个面板。
- 危险操作只在标题设置显示；暂停设置隐藏，避免游戏中误触清档。
- 旧档迁移只覆盖 check-build C40 / smoke 的夹具；本轮没有用真实旧存档文件在浏览器里逐版本回放（P1）。
- 未重跑 20 分钟全程、11 条人物结局、Chrome/Safari/真机；本轮浏览器只验证六个门板写点、标题/设置/初始化与移动热区（P1）。
- 已提交 `a36cce1`，tag `step-18-done` / `v1.7.2-dev`；`dist/site` 72 文件 / 31,610,174 B，ZIP 30,873,926 B；GitHub Pages `a120af0`、Netlify `6af15f30…` 已上线；两站线上冒烟各 22/22、0 错误。详见 `docs/release-record.md` §15。
