# 剧情分支与结局收纳（v1.5.0-dev）

> 入口：标题菜单「剧情分支」／结局页「查看剧情分支」／暂停菜单「剧情分支」。
> 定位：只读回看。不改剧情、选项、旗标、11 条路线判定、历史终点与 20 分钟流程。

## 1. 玩家看到什么

- 一张固定 1280×720 的「歧路图」：深墨蓝星尘底、7 张章节缩略图沿横线排开、下方按「带板 1–5／空手 6–10／坏结局 11」分组的结局卡。
- 章节卡：未走到为灰卡带「未」印；走过的为纸白；本次所在为朱砂边。点开看本章小引与全部抉择节点。
- 抉择节点：已发生的可展开，逐条写「在这个……选择中，你选择了……，因此……」。超时写「时间到了，默认项……替你做了决定，因此……」；条件未发生写「这一步没有发生……」。未走到只显示「尚未走到」，不显示选项与后果。
- 结局卡：未解锁显示编号、分组、尚未抵达 与一句模糊提示；解锁后显示结局名、题记、门板去向、救人数、状态、林先生、点名人数，以及这一局走过的章节与抉择。
- 顶部只显示「已抵达 N/11 个结局」，不做百分比、评分、真结局、全活或分支存档树。

## 2. 三入口与当前局

| 入口 | 打开时看到 |
|---|---|
| 标题菜单「剧情分支」 | 历史解锁并集；只读已经结算的路线。未完成的一局不从这里显示。 |
| 结局页「查看剧情分支」 | 刚结算的一局：路线朱砂高亮；其余未解锁仍灰。 |
| 暂停菜单「剧情分支」 | 当前局的实时进度：已走过章节、已发生抉择；当前章朱砂；未来章节与未触发抉择灰。 |

暂停态不写盘、不提前解锁结局；它只用主存档里已有的 state.choices、unlockedChapters、chapterId、旗标即时拼一个只读视图。结算时才把这一局写入历史。标题态不要用未完成存档反推“本次”，否则会和暂停态混淆；想继续看当前局，从暂停菜单进。

## 3. 存储

独立键 xiangbei.branches.v1，与主存档 xiangbei.save.v2、名册 xiangbei.roster.v1 分开。清主档不清分支；分支也不影响路线判定。坏 JSON 备份为 xiangbei.branches.v1.bad 后回空；localStorage 不可用时用内存态继续，并提示「本机无法保存剧情分支」。

    {
      version: 1,
      updatedAt: 1762524000000,
      runs: [
        {
          id: "r-1762524000000",
          at: 1762524000000,
          route: "door_excellent",
          routeIndex: 1,
          routeTitle: "门板",
          routeLede: "门板到了吴起。你也是。",
          chapters: ["prologue", "xiangjiang", "zunyi", "jinsha", "luding", "grass", "wuqi"],
          choices: [
            { chapter: "prologue", nodeId: "p021", option: "A", text: "带上这块门板", timedOut: false }
          ],
          summary: {
            hadDoor: true,
            doorOutcome: "wuqi",
            rescues: 1,
            condition: 3,
            playerDead: false,
            linDead: false,
            answered: 7,
            missed: 0,
            names: 7,
            companyEnd: 19
          },
          events: { zhang: true, rollcall: true }
        }
      ],
      endings: {
        door_excellent: { at: 1762524000000, runId: "r-1762524000000", count: 1 }
      },
      chapters: {
        prologue: { at: 1762524000000, runId: "r-1762524000000" }
      },
      options: {
        p021: { A: { at: 1762524000000, runId: "r-1762524000000" } }
      }
    }

- runs 最多 20 条；endings / chapters / options 永不由清主档清掉。
- options 的键是节点 id 与原选项 key；多选记录每个被选中的选项。互动节点（记名/点名）不写 options，回看时按旗标与结局快照解释。
- 只收 11 条正式路线；旧档路线不入收纳。

## 4. 结算写入

finishChapter() 在 buildEnding(state) 之后、state.choices = [] 之前调用一次 recordBranchRun(state)。原因：主存档在结局前清空选择日志以控制 4096 B；分支收纳需要那份日志。一次性守卫只防同一帧重复写入，不改 ending 的 16 个字段。

## 5. 节点数据（story.js XB.story.branchMap）

- chapters[chapterId]：intro、image、decisions[]。
- decisions[decisionId]：title、nodes[]（别名节点）、context、options{key: consequence}；多选另有 multi: true；互动节点写 doneText / skipText / futureText。
- 选项文字不复制，回看时从原节点按 key 读取；避免文案两处漂移。
- 19 个决策组、22 个结构节点：p021、p024、p037、x015、x025（x025a/b）、z019、z022、z025、z028e、j018、j024、l019（l019/l019x）、l027、g008、g018x、g021、g026x、w013、w026（w026/c006）。别名节点共用一条回看，不重复显示。
- 结局 endings[routeId].hint 只写模糊提示；未解锁详情不透露完整条件。

## 6. 布局与可达性

- 舞台 1280×720；章节卡约 148×86，结局卡约 164×96，全部可点热区 ≥82 舞台 px（844×390 下 ≈44.4 CSS px）。
- 章节详情 840×570 纸纹弹窗（手机横屏 1180×660），列表可滚；单条决策行 ≥82 舞台 px，展开内容不挤压相邻行。
- 键盘：Tab 循环（图内 → 详情）、Esc 先关详情再关图、Enter/Space 打开；关闭后焦点回到入口按钮。
- prefers-reduced-motion 下不加入场动画；不新增图片/字体/音频，只用现有 7 张图鉴缩略图。

## 7. 不做

不新增剧情分支、不改 11 条路线、不做百分比/评分/全收集奖励/分支存档树/读档回溯/真结局；不显示逐句旁白，不把未解锁选项文字提前泄露。
