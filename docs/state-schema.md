# 《向北》存档与旗标（v1.0）

> 唯一存档键：`xiangbei.save.v1`；所有读写 try/catch；旗标只增不改名，改名必须迁移。
> 旗标清单与 `docs/script/*.md` 的 `set:` 一一对应；新增旗标先进本文件再进剧本。

## 1. 存档 JSON（示例）

    {
      "version": 1,
      "chapterId": "jinsha",
      "nodeId": 42,
      "flags": {
        "item.door": true,
        "item.pot": true,
        "load": 4,
        "trust": 2,
        "fire": 55,
        "lights_lost": 1,
        "memory.zhang": true,
        "memory.luding_unknown": 1,
        "memory.door": 0,
        "choice.prologue.door": true,
        "choice.prologue.lookback": false,
        "choice.xiangjiang.hold": true,
        "choice.xiangjiang.abandoned": ["xray", "printing_press", "cotton"],
        "choice.zunyi.admit": 2,
        "choice.jinsha.priority": "main",
        "choice.luding.door": "A",
        "choice.luding.names": "B",
        "choice.grass.share": "A",
        "choice.grass.pot": "A",
        "choice.wuqi.door": "A"
      },
      "inventory": {
        "door": true,
        "items": ["maps", "medicine", "radio"]
      },
      "choices": [
        { "chapter": "xiangjiang", "nodeId": 8, "option": "C", "text": "把门板横在桥头挡一下", "timedOut": false }
      ],
      "codex": ["yudu", "xiangjiang"],
      "settings": {
        "textSpeed": 30,
        "textScale": 1,
        "volume": 0.6,
        "muted": false,
        "reducedMotion": false,
        "skipSeen": false
      },
      "unlockedChapters": ["prologue", "xiangjiang", "zunyi", "jinsha"],
      "ending": null
    }

## 2. 默认值

| 字段 | 默认 | 说明 |
|---|---|---|
| version | 1 | 存档格式版本 |
| chapterId | prologue | 当前章 id（prologue/xiangjiang/zunyi/jinsha/luding/grass/wuqi） |
| nodeId | 0 | 当前节点（story.js 数组下标） |
| flags | {} | 旗标；缺省按 false/0 处理 |
| inventory.items | [] | 序章与湘江带过江的物品 id |
| choices | [] | 选择记录；错误卡与五卡文案从这里取 |
| codex | [] | 已解锁史实注 id |
| settings.textSpeed | 30 | 字/秒；10–60 |
| settings.textScale | 1 | 1 / 1.15 / 1.3；手机可调 |
| settings.volume | 0.6 | 0–1 |
| settings.muted | false | 静音 |
| settings.reducedMotion | false | 尊重系统 prefers-reduced-motion |
| settings.skipSeen | false | 跳过已读 |
| unlockedChapters | [prologue] | 已解锁章节 |
| ending | null | 结局快照 |

## 3. 旗标全表（与剧本一一对应）

| 键 | 类型 | 默认 | 写入处 | 读取处 |
|---|---|---|---|---|
| item.door | boolean | false | 序章选项；湘江 C；泸定 A；终章 | 湘江/泸定/草地/终章分支 |
| item.pot | boolean | false | 草地选项 | 草地分支；终章“背上的东西” |
| load | number | 0 | 序章 +2；湘江 +1；遵义 -1；泸定 +0；草地 +1；终章 +1 | 行囊/体力提示；不影响结局 |
| trust | number | 0 | 湘江 +1；金沙江 +1/-1；泸定 +1；草地 +1/-1 | 五卡·船工 |
| fire | number | 50 | 序章带门板 +10、回头 +5；湘江回头接应 +5、弃药箱 −15；金沙江先渡炊事班 +5；泸定每失误 −5；草地分粮 −15；clamp 0–100 | 五卡·火种（≥20） |
| lights_lost | number | 0 | 遵义“漏记名字” +1 | 泸定光点显示；五卡备注 |
| memory.zhou | boolean | false | 湘江结束后置 true | 终章点名 |
| memory.he | boolean | false | 遵义后置 true | 终章点名 |
| memory.ximei | boolean | false | 终章前置 true | 终章点名 |
| memory.dongsheng | boolean | false | 终章前置 true | 终章点名 |
| memory.zaowang | boolean | false | 草地死亡后置 true | 终章点名 |
| memory.feimao | boolean | false | 泸定死亡后置 true | 终章点名 |
| memory.lin | boolean | false | 终章前置 true | 终章点名 |
| memory.zhang | boolean | false | 金沙江记名交互（选中张老幺） | 五卡·船工；图鉴回看 |
| memory.luding_unknown | number | 0 | 泸定选项（1=留白页） | 终章名册最后一页 |
| memory.door | number | 0 | 终章“留在吴起” | 终章尾声文案 |
| choice.prologue.door | boolean | false | 序章选项 A | 序章分支 |
| choice.prologue.lookback | boolean | false | 序章选项 B | 序章分支 |
| choice.xiangjiang.hold | boolean | false | 湘江选项 A/C | 五卡·断后；湘江分支 |
| choice.xiangjiang.abandoned | string[] | [] | 弃物小游戏结算 | 湘江结算清单；终章回看 |
| choice.zunyi.admit | number | 0 | 遵义三个选项（各 +1） | 五卡·复盘（≥2） |
| choice.jinsha.priority | string | "main" | 金沙江选项 | 五卡·先渡（=main） |
| choice.luding.door | string | "A" | 泸定选项 A/B | 泸定分支；五卡备注 |
| choice.luding.names | string | "A" | 泸定选项 A/B | 名册留白页 |
| choice.grass.share | string | "A" | 草地选项 A/B | 结算文案 |
| choice.grass.pot | string | "A" | 草地选项 A/B | 草地分支 |
| choice.wuqi.door | string | "A" | 终章选项 A/B | 终章分支；结尾文案 |

**规则**

- 读取时用默认值合并：`Object.assign(defaults, saved)`；缺字段不报错、不崩。
- 旗标只增不改名；改名必须写迁移函数（见 §5）。
- 不在 flags 里存大段文本；文本进 `story.js`。
- 时间/随机数不进存档；重开小游戏用固定种子（`seed: chapterId`）。
- 人物显示名从 `story.js` 取，存档只存 id。
- `trust` 与 `fire` 的上下限：0–6 / 0–100，写入时 clamp。

## 4. 保存点

- 进入新章、每个选项结算、小游戏 end()、记名/点名交互结束、设置变更、结局生成。
- 刷新/关闭前不强制保存；以最后保存点为准。
- 存档失败（隐私模式/配额满/`file://` 受限）只提示“本次无法保存”，不白屏、不中断游戏。

## 5. 迁移

- 当前只有 v1；未来 v1→v2 示例：新增 `settings.textScale` 默认 1。
- 读取到更高版本：备份为 `xiangbei.save.v1.bak`，提示“存档来自更新版本”，允许重置。
- 解析失败：备份原始字符串，重置默认存档；不静默丢弃。
- 迁移函数集中在一个 `migrate(save)`；每步只加字段，不删字段。

## 6. 调试

- `?debug=1`：右上角显示 chapterId/nodeId/flags 摘要；不显示在正式版。
- `?reset=1`：清空存档并回标题。
- `?chapter=jinsha`：跳到章节（仅开发）。
- `?minigame=door`：单独试玩小游戏。
- 调试参数在正式版保留但隐藏；不写进 UI。

## 7. 与故事圣经的对应

- 五卡触发见 `docs/story-bible.md` §5：`fire ≥ 20`、`choice.xiangjiang.hold`、`choice.zunyi.admit ≥ 2`、`choice.jinsha.priority == "main"`、`trust ≥ 3 且 memory.zhang`。
- `ending.cards` 只存结果：`{ideal, sacrifice, truth, overall, people}`，每项 `{lit: bool, line: string}`。
- 7 张史实注 id：yudu、xiangjiang、zunyi、jinsha、luding、grass、wuqi。
- 人物 flag：memory.zhou、memory.he、memory.ximei、memory.dongsheng、memory.zaowang、memory.feimao、memory.lin、memory.zhang。
