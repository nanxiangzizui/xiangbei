# 步骤十五：存档与读档（v1.6.0-dev）

> 2026-11-08 · 分支 v1.4-dev · 未打包/未部署 · 证据 docs/evidence/step-15/
> 需求来源：用户 m00001；三个待确认点（初始化连名册一起清、设置保留、结局回顾整页）由用户 m00117 确认。

## 1. 目标与范围

- 标题菜单只留“存档”：进入游戏永远先到开始菜单，不再自动续玩。
- 存档列表：长条“YYYY年MM月DD日的存档（已完结/未完结）”；顶部“开启新档 / 上次玩到 / 删除存档”；删除支持多选、二次确认；已完结档点开是只读结局回顾。
- 每章自动保存一次；同一档继续游玩只覆盖，不新增。
- 存档与分支/成就/名册互不联动；只有初始化（点“向北”）才全部清空。

## 2. 数据与口径

- 新键 xiangbei.saves.v1：{version:1, activeId, settings, slots[≤20]}；单档仍是 v2 的 11 键，逐槽 normalize。
- 单档 4096B、整包 512KB；坏列表备份 .bad；旧 xiangbei.save.v2/v1 首次启动迁移成第 1 档后删除。
- 已完结由 isFullEnding 现算；列表按 createdAt 倒序；“上次玩到”取未完结里 updatedAt 最大。
- 设置移到列表全局一份；读档/开新档都用 store.settings，初始化保留。
- 结局回顾用状态交换：备份 state → 快照进 state → ending 场景；renderEnding 守卫不重建、不记名册、不写档。

## 3. 界面

- 标题 h1 内改 button（init-game），按下加粗 + 四向重影 220ms，再弹初始化确认。
- 存档面板 920×640（z 83），二选一确认 560 宽（z 89）；删除行 role=checkbox、墨底纸白 + 朱砂条 + ✓。
- 暂停菜单“继续”后新增“保存”（共 9 项）；名册提示删去“清档不会清掉它”。
- 844×390：面板 1240×688，按钮/行 ≥82 逻辑（≈44.4 CSS px）。

## 4. 改动文件

- project/engine.js：常量/REQUIRED_IDS/运行态；normalizeStoreSettings…latestUnfinishedSlot 迁移层；saveNow 覆盖写；整套面板/确认/读档/回顾/初始化函数；init 不再读单档；renderEnding review 守卫；finishChapter 去掉 saveExists；renderTitle、startNewGame、handleAction、onKeyDown、onPointerDown、bindOverlays、refreshAudioDuck。
- project/index.html：标题按钮、菜单、暂停保存、名册提示、#saves-panel、#save-confirm。
- project/style.css：--z-saves/--z-save-confirm、.title-main__button、.xb-saves*、.xb-save-confirm、移动覆盖。
- project/tools/check-build.js：REQUIRED_IDS + C43–C47（46 项）。
- project/tools/_pw-step15.js：新增端到端脚本（all/migration/privacy/mobile）。
- 文档：state-schema §9/§10、ui-layout §2/§13、test-cases T15-01…12、本卡、CLAUDE.md。

## 5. 验证

| 项 | 结果 |
|---|---|
| node --check project/engine.js | 通过 |
| node project/tools/check-build.js | 46/46 |
| node project/tools/smoke.js | 47/47 |
| node project/tools/check-script.js docs/script | 9 文件 OK |
| _pw-step15.js --url=http --case=all | 75/75，0 console error / 0 failed request |
| --case=migration | 8/8 |
| --case=privacy | 4/4 |
| --case=mobile --mobile（844×390） | 9/9 |
| --url=file --case=all | 75/75 |

证据：docs/evidence/step-15/（主流程截图 + result.json）及 migration/、privacy/、mobile/、file/。

## 6. 已知口径与未覆盖

- 20 档写满、512KB 整包上限、旧 v1（不是 v2）真实文件迁移只做了代码/单测级检查，未单独跑浏览器。
- 真实手机触摸、Safari/Chrome 未跑（沿用既有 P0/P1 例外）。
- 结局回顾页仍是原有 880×560 可滚面板，按钮在底部；键盘 Esc 可随时返回。
- 未打包 dist/、未部署、不合并 main；线上仍是 v1.1.1 四关版。
