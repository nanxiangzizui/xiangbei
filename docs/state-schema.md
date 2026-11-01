# 《向北》存档与旗标（v0.1）

> 唯一存档键：xiangbei.save.v1；所有读写 try/catch；旗标只增不改名，改名必须迁移。

## 1. 存档 JSON（示例）

    {
      "version": 1,
      "chapterId": "prologue",
      "nodeId": 12,
      "flags": {
        "item.door": true,
        "item.pencil": true,
        "item.medicine": true,
        "item.grain": 4,
        "load": 62,
        "trust": 3,
        "fire": 48,
        "lights_lost": 0,
        "memory.names": ["老周", "飞毛腿"],
        "choice.xiangjiang.hold": true,
        "choice.xiangjiang.abandoned": ["xray", "printing_press"],
        "choice.zunyi.admit": 2,
        "choice.jinsha.priority": "main",
        "choice.luding.hold": false,
        "choice.grass.share": "share"
      },
      "choices": [
        {
          "chapter": "xiangjiang",
          "nodeId": 8,
          "option": "把 X 光机留下",
          "timedOut": false
        }
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
      "unlockedChapters": ["prologue", "xiangjiang"],
      "ending": null
    }

## 2. 默认值

| 字段 | 默认 | 说明 |
|---|---|---|
| version | 1 | 存档格式版本 |
| chapterId | prologue | 当前章 |
| nodeId | 0 | 当前节点（story.js 数组下标） |
| flags | {} | 旗标；缺省按 false/0 处理 |
| choices | [] | 选择记录；用于遵义错误卡 |
| codex | [] | 已解锁史实注 id |
| settings.textSpeed | 30 | 字/秒；10–60 |
| settings.textScale | 1 | 1 / 1.15 / 1.3；手机可调 |
| settings.volume | 0.6 | 0–1 |
| settings.muted | false | 静音 |
| settings.reducedMotion | false | 尊重系统 prefers-reduced-motion |
| settings.skipSeen | false | 跳过已读 |
| unlockedChapters | [prologue] | 已解锁章节 |
| ending | null | 结局快照 |

## 3. 旗标命名

| 前缀/键 | 类型 | 默认 | 用途 |
|---|---|---|---|
| item.* | boolean | false | 门板/铅笔/药/青稞等 |
| item.grain | number | 0 | 青稞份数；0–10 |
| load | number | 0 | 负重；0–100 |
| trust | number | 0 | 民心；0–5；决定金沙江船工数 |
| fire | number | 50 | 火种；0–100 |
| lights_lost | number | 0 | 泸定熄灭的光点数 |
| memory.names | string[] | [] | 已记住的名字；终章点名 |
| memory.<id> | boolean | false | 人物结局旗标；如 memory.zhou |
| choice.<chapter>.<key> | boolean/string/number/string[] | 按需 | 章节选择；如 choice.xiangjiang.hold |
| ending.cards | string[] | [] | 结局五卡 id；只存结果 |

**规则**

- 读取时用默认值合并：Object.assign(defaults, saved)；缺字段不报错。
- 旗标只增不改名；改名必须写迁移函数。
- 不在 flags 里存大段文本；文本进 story.js。
- 时间/随机数不进存档；重开小游戏用固定种子（如 seed: chapterId）。
- 角色名只存 id（zhou/ximei/…），显示名从 story.js 取；避免改名后存档对不上。

## 4. 保存点

- 进入新章、每个选项结算、小游戏 end()、设置变更、结局生成。
- 刷新/关闭前不强制保存；以最后保存点为准。
- 存档失败（隐私模式/配额满）只提示“本次无法保存”，不白屏。

## 5. 迁移

- 当前只有 v1；未来 v1→v2 示例：新增 settings.textScale 默认 1。
- 读取到更高版本：备份为 xiangbei.save.v1.bak，提示“存档来自更新版本”，允许重置。
- 解析失败：备份原始字符串，重置默认存档；不静默丢弃。
- 迁移函数集中在一个 migrate(save)；每步只加字段，不删字段。

## 6. 调试

- ?debug=1：右上角显示 chapterId/nodeId/flags 摘要；不显示在正式版。
- ?reset=1：清空存档并回标题。
- ?chapter=jinsha：跳到章节（仅开发）。
- ?minigame=door：单独试玩小游戏。
- 调试参数在正式版保留但隐藏；不写进 UI。

## 7. 与故事圣经的对应

- 五卡触发见 docs/story-bible.md 第 5 节；ending.cards 只存 card.ideal / card.sacrifice / card.truth / card.overall / card.people。
- 7 张史实注 id：yudu、xiangjiang、zunyi、jinsha、luding、grass、wuqi。
- 人物 flag：memory.zhou、memory.he、memory.ximei、memory.dongsheng、memory.zaowang、memory.feimao、memory.lin、memory.zhang。
