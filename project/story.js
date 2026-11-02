(function (XB) {
  "use strict";

  // 节点契约见 docs/script/README.md §6；id 映射见 §7。
  // 文本源是 docs/script/00-prologue.md（定稿 837 字 / 41 beat）；改文本先改 md，再同步这里。
  // 条件分支写成同位置的 when 节点（p022a/p022b 这样），运行期不分叉、不入栈。
  XB.story = {
    version: 2,
    chapters: [
      {
        id: "prologue",
        order: 1,
        title: "序章 · 于都",
        short: "于都",
        playable: true,
        nodes: [
          { id: "p001", type: "line", speaker: "旁白", text: "1934年10月17日，于都河上起雾。", bg: "yudu_river" },
          { id: "p002", type: "line", speaker: "旁白", text: "雾里看不见对岸，只看得见火把。火把从村口一直排到水边。" },
          { id: "p003", type: "line", speaker: "旁白", text: "河上有一座浮桥。桥面是门板，一块压着一块，压得很紧。" },
          { id: "p004", type: "line", speaker: "旁白", text: "桥板是各家送来的：门板、床板，还有一副寿材，黑漆没干透。" },
          { id: "p005", type: "line", speaker: "旁白", text: "有人问，寿材也拿去搭桥？老人说，人都要走了，留着装谁。" },
          { id: "p006", type: "line", speaker: "旁白", text: "我家的门，是村里最后一扇整门。", bg: "yudu_night" },
          { id: "p007", type: "line", speaker: "旁白", text: "门上有我刻的身高线，一道一道。最高的那道，到娘的肩膀。" },
          { id: "p008", type: "line", speaker: "旁白", text: "娘把锯子架上门轴。锯末落在我脚背上，还是热的。" },
          { id: "p009", type: "line", speaker: "满崽", text: "娘，门没了，还像个家吗？" },
          { id: "p010", type: "line", speaker: "娘", text: "家在人身上。" },
          { id: "p011", type: "line", speaker: "娘", text: "你要走远路。这块板子带上，写字垫着，下雨顶着。" },
          { id: "p012", type: "line", speaker: "娘", text: "路上要是想家，就把板子立起来，看看它从哪儿来。" },
          { id: "p013", type: "line", speaker: "娘", text: "路要从家门口开始。" },
          { id: "p014", type: "line", speaker: "旁白", text: "老周在祠堂门口点人。我蹲在门槛上，拿铅笔一个一个记。" },
          { id: "p015", type: "line", speaker: "老周", text: "满崽，名字比枪重。记清楚。" },
          { id: "p016", type: "line", speaker: "旁白", text: "他念一个名字，队伍里有人应。念到没人应的，他自己低低应一声。" },
          { id: "p017", type: "line", speaker: "旁白", text: "我抬头看他。他没看我，只把名单往下压了压。" },
          { id: "p018", type: "line", speaker: "满崽", text: "我记一下。" },
          { id: "p019", type: "line", speaker: "旁白", text: "那一夜，我把全连的名字抄了一遍。抄到最后一个，手是抖的。" },
          { id: "p020", type: "line", speaker: "旁白", text: "名字写歪了，我用指甲刮掉重写。刮破了两处纸。" },
          {
            id: "p021",
            type: "choice",
            prompt: "娘把锯子搁下，等你说。",
            record: "choice.prologue.door",
            timeout: 8,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "带上这块门板",
                value: true,
                set: { "item.door": true, load: "+2", fire: "+10" },
                cost: "行囊只剩两格，多背三十斤"
              },
              {
                key: "B",
                text: "只带花名册",
                value: false,
                set: { "item.door": false, load: "+0" },
                cost: "终章没有门板可放，娘的手停在半空"
              }
            ]
          },
          {
            id: "p022a",
            type: "line",
            speaker: "旁白",
            text: "我把门板绑在背上。绳子勒进肩，走一步，板子就撞一下后腰。",
            when: "item.door"
          },
          { id: "p023a", type: "line", speaker: "满崽", text: "门没了，我替它走。", when: "item.door" },
          {
            id: "p022b",
            type: "line",
            speaker: "旁白",
            text: "我把门板靠在门框上。娘伸手扶了一下，像扶一个要倒的人。",
            when: "!item.door"
          },
          {
            id: "p024",
            type: "minigame",
            game: "door",
            config: { duration: 75, capacity: 6, doorCost: 2, items: 8 }
          },
          {
            id: "p025",
            type: "result",
            source: "minigame",
            game: "door",
            title: "行囊",
            note: "带走的摊在地上，只有一小堆。",
            lists: [
              { when: "item.door", heading: "带走", items: ["门板", "花名册", "铅笔"] },
              { when: "item.door", heading: "留下", items: ["水缸", "柴", "一口大锅"] },
              { when: "!item.door", heading: "带走", items: ["花名册", "铅笔"] },
              { when: "!item.door", heading: "留下", items: ["水缸", "柴", "一口大锅", "一扇门"] }
            ]
          },
          { id: "p026", type: "line", speaker: "旁白", text: "天快亮时，行囊定了。带走的摊在地上，只有一小堆。" },
          { id: "p027", type: "line", speaker: "旁白", text: "灶王把锅擦了一遍，又擦一遍，像要把它擦亮。" },
          { id: "p028", type: "line", speaker: "灶王", text: "大锅留下，小锅我背。人先走。" },
          {
            id: "p029a",
            type: "line",
            speaker: "旁白",
            text: "我在纸上写：水缸、柴、一口大锅。门板那一行，空着。",
            when: "item.door"
          },
          {
            id: "p029b",
            type: "line",
            speaker: "旁白",
            text: "我在纸上写：水缸、柴、一口大锅、一扇门。",
            when: "!item.door"
          },
          { id: "p030", type: "line", speaker: "旁白", text: "写完，我把纸压在灶台边。压得很平。" },
          {
            id: "p031",
            type: "line",
            speaker: "旁白",
            text: "出发时，火把连成另一条河。我们从那一条河上走过去。",
            bg: "yudu_river"
          },
          { id: "p032", type: "line", speaker: "旁白", text: "浮桥在脚下晃。我不敢低头，只看前面人的后脑勺。" },
          { id: "p033", type: "line", speaker: "旁白", text: "前面的人踩空，半条腿陷进水里，后面的人一把拽住他的背包带。" },
          { id: "p034", type: "line", speaker: "冬生", text: "号一响就走，别回头。" },
          { id: "p035", type: "line", speaker: "旁白", text: "娘挤到桥头，把一根缝衣针别在我衣襟上。针尖朝里。" },
          { id: "p036", type: "line", speaker: "娘", text: "衣裳破了，自己缝。" },
          {
            id: "p037",
            type: "choice",
            prompt: "桥头的人往前挤。前面就是浮桥。",
            record: "choice.prologue.lookback",
            timeout: 8,
            defaultOption: "B",
            options: [
              {
                key: "A",
                text: "回头看一眼",
                value: true,
                set: { "choice.prologue.lookback": true, fire: "+5" },
                cost: "落后几步，第一班船没赶上"
              },
              {
                key: "B",
                text: "不回头",
                value: false,
                set: { "choice.prologue.lookback": false },
                cost: "你没看见家里那盏灯"
              }
            ]
          },
          {
            id: "p038a",
            type: "line",
            speaker: "旁白",
            text: "我回了头。家里的窗还亮着，一盏油灯，很小，像有人举着灯。",
            when: "choice.prologue.lookback"
          },
          {
            id: "p038b",
            type: "line",
            speaker: "旁白",
            text: "我没有回头。桥板一块一块往后退，像有人在身后抽走它。",
            when: "!choice.prologue.lookback"
          },
          {
            id: "p039a",
            type: "line",
            speaker: "旁白",
            text: "上了南岸，我把门板翻过来，用铅笔画了一个字。画得很大，占了半块板。",
            bg: "yudu_night",
            when: "item.door"
          },
          {
            id: "p039b",
            type: "line",
            speaker: "旁白",
            text: "上了南岸，我把铅笔削出一点芯，在名册封皮上画了一个字。画得很小，占了不到半行。",
            bg: "yudu_night",
            when: "!item.door"
          },
          { id: "p040", type: "line", speaker: "旁白", text: "北。" },
          { id: "p041", type: "line", speaker: "旁白", text: "画完，我用手掌按了按，让它干透。" },
          { id: "p042", type: "line", speaker: "旁白", text: "按完才想起，铅笔会写秃。路还长。" },
          { id: "p043", type: "title", text: "第一章 · 湘江", sub: "一九三四年 · 冬" },
          { id: "p044", type: "codex", codexId: "yudu" },
          { id: "p900", type: "end", next: "xiangjiang" }
        ]
      },
      {
        id: "xiangjiang",
        order: 2,
        title: "第一章 · 湘江",
        short: "湘江",
        playable: true,
        nodes: [
          { id: "x001", type: "line", speaker: "旁白", text: "湘江。十一月末，水是灰的。", bg: "xiangjiang_ford" },
          { id: "x002", type: "line", speaker: "旁白", text: "对岸是山，山后面是路。我们只有一座浮桥，桥窄，人多。" },
          { id: "x003", type: "line", speaker: "旁白", text: "桥是用船和门板搭的。上面走人，下面走水。" },
          { id: "x004", type: "line", speaker: "旁白", text: "后队还没上来。老周站在桥头，把帽子压得很低。" },
          { id: "x005", type: "line", speaker: "老周", text: "我先送后队。你带文书包先过，名册在，连就在。" },
          { id: "x006", type: "line", speaker: "满崽", text: "我记一下。" },
          { id: "x007", type: "line", speaker: "老周", text: "不用记。过了江，你自己来找我。" },
          { id: "x008", type: "line", speaker: "旁白", text: "他把干粮袋塞给我，袋里还有半袋炒米。他说他不饿。" },
          { id: "x009", type: "line", speaker: "旁白", text: "他说话的时候一直往桥那头看。那头有人抬着担架跑，跑得很慢。" },
          { id: "x010", type: "line", speaker: "旁白", text: "江边堆着东西。箱子、印刷机、一摞摞文件，还有人舍不得丢的棉被。" },
          { id: "x011", type: "line", speaker: "旁白", text: "最占地方的是几只大木箱，三百斤一只，四个人抬，走三步歇一步。" },
          { id: "x012", type: "line", speaker: "旁白", text: "有人说里面是宝贝，能照见骨头。我没见过。" },
          { id: "x013", type: "line", speaker: "何指导员", text: "先弄清情况：什么必须过江，什么可以留下。定了就不许回头拿。" },
          { id: "x014", type: "line", speaker: "旁白", text: "他蹲下来，把六样东西摆成一排，像摆一副牌。摆完抬头问我：你自己挑三样。" },
          {
            id: "x015",
            type: "minigame",
            game: "abandon",
            config: { duration: 80, batches: 2, quota: 3, items: 6, enemy: 45, heavy: 8 }
          },
          {
            id: "x016",
            type: "result",
            source: "minigame",
            game: "abandon",
            title: "弃物",
            note: "清单之外，江那边还留着一些东西。"
          },
          {
            id: "x017a",
            type: "line",
            speaker: "旁白",
            text: "门板过了江。背面湿了一道水痕，那个“北”字还在。",
            when: "item.door"
          },
          {
            id: "x017b",
            type: "line",
            speaker: "旁白",
            text: "门板留在江那边。我回头找过，只看见水。",
            when: "!item.door"
          },
          { id: "x018", type: "line", speaker: "旁白", text: "留下的东西堆在岸边，像一个小一点的村子。" },
          { id: "x019", type: "line", speaker: "旁白", text: "天亮了。江面上漂着我们的东西：斗笠、文件箱、一面没有字的旗。", bg: "xiangjiang_dawn" },
          { id: "x020", type: "line", speaker: "旁白", text: "江很宽，漂得很慢。桥头有个卫生员在给人裹伤，绷带不够，就撕自己的衬衣。" },
          { id: "x021", type: "line", speaker: "旁白", text: "我把名册摊在膝盖上，开始划。" },
          { id: "x022", type: "line", speaker: "旁白", text: "划第一个名字的时候，手还稳。划到第五个，铅笔在纸上顿了一下。" },
          { id: "x023", type: "line", speaker: "旁白", text: "有个名字我划错了行，刮不掉，只好在旁边画个小叉。" },
          { id: "x024", type: "line", speaker: "旁白", text: "后来那种小叉越画越多，都是划错的行。一页纸像下了一场雨。" },
          {
            id: "x025a",
            type: "choice",
            when: "item.door",
            prompt: "桥头的人往后挤。老周还在那边。",
            record: "choice.xiangjiang.hold",
            timeout: 10,
            defaultOption: "C",
            options: [
              {
                key: "A",
                text: "回头接应老周",
                value: true,
                set: { "choice.xiangjiang.hold": true, fire: "+5", load: "+1" },
                cost: "你晚过江一个时辰，丢了半袋粮"
              },
              {
                key: "B",
                text: "按命令先过江",
                value: false,
                set: { "choice.xiangjiang.hold": false },
                cost: "桥头最后一面，你看见的是他的背影"
              },
              {
                key: "C",
                text: "把门板横在桥头挡一下",
                value: true,
                set: { "choice.xiangjiang.hold": true, "item.door": false },
                cost: "门板留在了浮桥，三号担架少一块垫板"
              }
            ]
          },
          {
            id: "x025b",
            type: "choice",
            when: "!item.door && !choice.xiangjiang.hold",
            prompt: "桥头的人往后挤。老周还在那边。",
            record: "choice.xiangjiang.hold",
            timeout: 10,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "回头接应老周",
                value: true,
                set: { "choice.xiangjiang.hold": true, fire: "+5", load: "+1" },
                cost: "你晚过江一个时辰，丢了半袋粮"
              },
              {
                key: "B",
                text: "按命令先过江",
                value: false,
                set: { "choice.xiangjiang.hold": false },
                cost: "桥头最后一面，你看见的是他的背影"
              }
            ]
          },
          {
            id: "x026a",
            type: "line",
            speaker: "旁白",
            text: "我跑回桥头。老周没骂我，只把我的领子往前一推。",
            when: "choice.xiangjiang.hold"
          },
          {
            id: "x027a",
            type: "line",
            speaker: "老周",
            text: "文书，往前走。名字归你，江归我。",
            when: "choice.xiangjiang.hold"
          },
          {
            id: "x026b",
            type: "line",
            speaker: "旁白",
            text: "我跟着队伍过了江。身后枪声一阵一阵，像有人在敲一块空木头。",
            when: "!choice.xiangjiang.hold"
          },
          { id: "x028", type: "line", speaker: "细妹", text: "文书，你手在抖。" },
          { id: "x029", type: "line", speaker: "满崽", text: "风大。" },
          { id: "x030", type: "line", speaker: "旁白", text: "风确实大。她把我的袖子往下拉了拉，盖住手背。" },
          { id: "x031", type: "line", speaker: "细妹", text: "老周呢？" },
          { id: "x032", type: "line", speaker: "旁白", text: "我说，他随后就来。" },
          { id: "x033", type: "line", speaker: "旁白", text: "她“嗯”了一声，没再问。我们都听见了后队的枪声，从早上响到中午。" },
          { id: "x034", type: "line", speaker: "旁白", text: "后来我才知道，那一夜出发的八万六千人，过了江的不到一半。" },
          { id: "x035", type: "line", speaker: "旁白", text: "我把名册合上。合上之前，我数了一遍剩下的名字。" },
          { id: "x036", type: "line", speaker: "旁白", text: "数到第三遍，才数清。" },
          { id: "x037", type: "line", speaker: "旁白", text: "数清以后，我在封皮上写了一个数。写完又涂掉了。" },
          { id: "x038", type: "title", text: "第二章 · 遵义", sub: "一九三五年 · 一月" },
          { id: "x039", type: "codex", codexId: "xiangjiang" },
          { id: "x900", type: "end", next: "zunyi" }
        ]
      },
      {
        id: "zunyi",
        order: 3,
        title: "第二章 · 遵义",
        short: "遵义",
        playable: true,
        nodes: [
          { id: "z001", type: "line", speaker: "旁白", text: "1935年1月，遵义。", bg: "zunyi_hall" },
          { id: "z002", type: "line", speaker: "旁白", text: "雪化了又冻，屋檐下挂着冰。" },
          { id: "z003", type: "line", speaker: "旁白", text: "城里的石板路被踩得发亮。" },
          { id: "z004", type: "line", speaker: "旁白", text: "我们驻下，第一次睡满了整夜。" },
          { id: "z005", type: "line", speaker: "旁白", text: "会开了三天。" },
          { id: "z006", type: "line", speaker: "旁白", text: "门一直关着。" },
          { id: "z007", type: "line", speaker: "旁白", text: "我们在外面烧水、磨墨、等消息。" },
          { id: "z008", type: "line", speaker: "旁白", text: "门缝里透出烟。" },
          { id: "z009", type: "line", speaker: "旁白", text: "炭盆添过三次，谁也没出来。" },
          { id: "z010", type: "line", speaker: "旁白", text: "门里偶尔传出椅子挪动的声音。听不清说什么。" },
          { id: "z011", type: "line", speaker: "何指导员", text: "先弄清情况。弄清之前，别急着下结论。" },
          { id: "z012", type: "line", speaker: "旁白", text: "这话他说过很多次。" },
          { id: "z013", type: "line", speaker: "旁白", text: "以前我不爱听，觉得慢。" },
          { id: "z014", type: "line", speaker: "旁白", text: "散会那天，何指导员被调去别的连。" },
          { id: "z015", type: "line", speaker: "旁白", text: "他把一支铅笔头留给我，短得握不住。" },
          { id: "z016", type: "line", speaker: "何指导员", text: "拿着。写不出来的字，就想一想再写。" },
          { id: "z017", type: "line", speaker: "旁白", text: "晚上，连里开会。要求每人说一条：这一路，哪一步走错了。", bg: "zunyi_street" },
          { id: "z018", type: "line", speaker: "旁白", text: "屋里冷。有人往炭盆里添柴，火苗跳了一下。" },
          {
            id: "z019",
            type: "choice",
            prompt: "这一路，哪一步走错了。",
            options: [
              {
                key: "A",
                text: "承认：东西带得太多",
                value: 1,
                set: { "choice.zunyi.admit": "+1", load: "-1" },
                cost: "有人说你想出风头"
              },
              {
                key: "B",
                text: "不承认：都是敌人逼的",
                value: 0,
                set: { "choice.zunyi.admit": "+0" },
                cost: "会开完了，没人再提这件事"
              }
            ]
          },
          { id: "z020", type: "line", speaker: "旁白", text: "轮到第二个人。他说，路是上面定的，我们只管走。" },
          { id: "z021", type: "line", speaker: "旁白", text: "没人接话。炭盆里的柴塌下去一块。" },
          {
            id: "z022",
            type: "choice",
            prompt: "轮到你了。",
            options: [
              {
                key: "A",
                text: "承认：湘江那条路走错了",
                value: 1,
                set: { "choice.zunyi.admit": "+1" },
                cost: "说出口，屋里静了一下"
              },
              {
                key: "B",
                text: "不承认：命令没错",
                value: 0,
                set: { "choice.zunyi.admit": "+0" },
                cost: "你把话咽回去，咽得很费劲"
              }
            ]
          },
          { id: "z023", type: "line", speaker: "旁白", text: "最后一个问题，是问文书的。问的是名册。" },
          { id: "z024", type: "line", speaker: "旁白", text: "我把名册摊开，纸边全是毛的。" },
          {
            id: "z025",
            type: "choice",
            prompt: "名册，全吗？",
            options: [
              {
                key: "A",
                text: "承认：我漏记过名字",
                value: 1,
                set: { "choice.zunyi.admit": "+1", "choice.zunyi.missed": "+1" },
                cost: "你得把那一页补上，补得很慢"
              },
              {
                key: "B",
                text: "不承认：名册是全的",
                value: 0,
                set: { "choice.zunyi.admit": "+0" },
                cost: "你合上名册，没敢再翻"
              }
            ]
          },
          {
            id: "z026",
            type: "result",
            source: "zunyi",
            title: "错误卡",
            note: "三条记录，不评分。",
            questions: ["这一路，哪一步走错了。", "轮到你了。", "名册，全吗？"],
            conclusions: ["三条，一条也没认。", "三条，认了一条。", "三条，认了两条。", "三条，都认了。"]
          },
          { id: "z027", type: "line", speaker: "旁白", text: "错误卡贴在墙上。风把纸角吹起来，又落下去。" },
          { id: "z028", type: "line", speaker: "旁白", text: "我站在墙底下看了一会儿。" },
          { id: "z029", type: "line", speaker: "旁白", text: "三条记录里，我自己写的那条最短。" },
          { id: "z030", type: "line", speaker: "旁白", text: "第二天早上，队伍出发。那面墙上的纸还在。" },
          { id: "z031", type: "title", text: "第三章 · 金沙江", sub: "一九三五年 · 五月" },
          { id: "z032", type: "codex", codexId: "zunyi" },
          { id: "z900", type: "end", next: "jinsha" }
        ]
      },
      {
        id: "jinsha",
        order: 4,
        title: "第三章 · 金沙江",
        short: "金沙江",
        playable: true,
        nodes: [
          { id: "j001", type: "line", speaker: "旁白", text: "金沙江的水是绿的。", bg: "jinsha_river" },
          { id: "j002", type: "line", speaker: "旁白", text: "声音像有人在石头底下推磨。" },
          { id: "j003", type: "line", speaker: "旁白", text: "江面比湘江窄，水比湘江急。下过雨，岸边全是滑的。" },
          { id: "j004", type: "line", speaker: "旁白", text: "渡口只有六条小船。船工说，一条船八个人，多一个都不行。" },
          { id: "j005", type: "line", speaker: "张老幺", text: "规矩比命大。排队上船，谁也别挤。" },
          { id: "j006", type: "line", speaker: "旁白", text: "他说这话的时候，一只手按在船帮上，手背上全是裂口。" },
          { id: "j007", type: "line", speaker: "满崽", text: "一条船能多坐一个吗？" },
          { id: "j008", type: "line", speaker: "张老幺", text: "多一个，沉一个。你说呢？" },
          { id: "j009", type: "line", speaker: "旁白", text: "他把人一个一个数上船。数完，又数一遍。" },
          {
            id: "j010",
            type: "minigame",
            game: "boat",
            config: { duration: 90, boats: 6, capacity: 8, crewPerBoat: 3, plannedTrips: 18, outbound: 12, inbound: 12, fatigue: 12, rest: 12, enemy: 120 }
          },
          {
            id: "j011",
            type: "result",
            source: "minigame",
            game: "boat",
            title: "渡江",
            note: "过了多少人，江东岸还留着多少人，都在这张单子上。"
          },
          { id: "j012", type: "line", speaker: "旁白", text: "七天七夜。船工的号子从早喊到晚，最后哑成气音。" },
          { id: "j013", type: "line", speaker: "旁白", text: "有人在船上睡着了，头一点一点，像在跟谁认错。" },
          { id: "j014", type: "line", speaker: "旁白", text: "我蹲在岸边记名字。" },
          { id: "j015", type: "line", speaker: "旁白", text: "三十七个船工，有名有姓的，也有只剩一个绰号的。" },
          { id: "j016", type: "line", speaker: "旁白", text: "有个船工叫“老鸦”，因为他黑。" },
          { id: "j017", type: "line", speaker: "旁白", text: "他自己说，叫什么都行，只要记得住。" },
          {
            id: "j018",
            type: "interact",
            mode: "namepick",
            duration: 8,
            prompt: "点选要抄下的名字；不选即跳过。",
            names: [
              { id: "zhang", name: "张老幺" }
            ]
          },
          {
            id: "j019",
            type: "result",
            source: "interact",
            title: "记名",
            note: "名字写在名册的边角上，墨还没干。"
          },
          {
            id: "j020a",
            type: "line",
            speaker: "张老幺",
            text: "小同志，你记这个做什么？",
            when: "memory.zhang"
          },
          { id: "j021a", type: "line", speaker: "满崽", text: "我记一下。", when: "memory.zhang" },
          { id: "j022a", type: "line", speaker: "张老幺", text: "记了也没用，我们不出名。", when: "memory.zhang" },
          { id: "j023a", type: "line", speaker: "满崽", text: "那就记着。", when: "memory.zhang" },
          {
            id: "j020b",
            type: "line",
            speaker: "旁白",
            text: "我蹲了半夜，一个字没写。名字太多，纸太小。",
            when: "!memory.zhang"
          },
          {
            id: "j021b",
            type: "line",
            speaker: "旁白",
            text: "第二天开船，我连他姓什么都想不起来了。",
            when: "!memory.zhang"
          },
          {
            id: "j024",
            type: "choice",
            prompt: "最后一批上船前，何指导员问：先渡谁？",
            record: "choice.jinsha.priority",
            timeout: 8,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "先渡主力",
                value: "main",
                set: { "choice.jinsha.priority": "main", trust: "+1" },
                cost: "后勤的人和骡子多等一天"
              },
              {
                key: "B",
                text: "先渡伤员",
                value: "wounded",
                set: { "choice.jinsha.priority": "wounded", trust: "-1" },
                cost: "主力在渡口多暴露一天"
              },
              {
                key: "C",
                text: "先渡炊事班",
                value: "kettle",
                set: { "choice.jinsha.priority": "kettle", fire: "+5" },
                cost: "伤员在岸上多躺一天"
              }
            ]
          },
          { id: "j025", type: "line", speaker: "旁白", text: "最后一批上船的时候，天快亮了。", bg: "jinsha_night" },
          { id: "j026", type: "line", speaker: "旁白", text: "船工的号子只剩调子，没有词。" },
          { id: "j027", type: "line", speaker: "张老幺", text: "走吧。往北，别停。" },
          { id: "j028", type: "line", speaker: "旁白", text: "船离岸，他没有招手。他蹲下去，把船绳又系紧了一道。" },
          { id: "j029", type: "line", speaker: "旁白", text: "我们上了北岸，回头看不见船。" },
          { id: "j030", type: "line", speaker: "旁白", text: "只听见桨声，一下，一下，没有停。" },
          { id: "j031", type: "title", text: "第四章 · 泸定", sub: "一九三五年 · 五月" },
          { id: "j032", type: "codex", codexId: "jinsha" },
          { id: "j900", type: "end", next: "luding" }
        ]
      },
      {
        id: "luding",
        order: 5,
        title: "第四章 · 泸定",
        short: "泸定",
        playable: true,
        nodes: [
          { id: "l001", type: "line", speaker: "旁白", text: "大渡河。水声像打雷，站在桥头说话要靠喊。", bg: "luding_bridge" },
          { id: "l002", type: "line", speaker: "旁白", text: "桥板被抽走了。剩下十三根铁索，横在河上，晃。" },
          { id: "l003", type: "line", speaker: "旁白", text: "铁索有碗口粗吗？没有。一只手能握住。" },
          { id: "l004", type: "line", speaker: "飞毛腿", text: "命令到了：下午四点，二十二个人，爬过去。" },
          { id: "l005", type: "line", speaker: "旁白", text: "他跑得满头汗，脖子上挂着一卷电线。" },
          { id: "l006", type: "line", speaker: "旁白", text: "电线尾巴一甩一甩。" },
          { id: "l007", type: "line", speaker: "满崽", text: "二十二个。数得清吗？" },
          { id: "l008", type: "line", speaker: "飞毛腿", text: "数得清。我在桥头数，你在桥尾记。" },
          { id: "l009", type: "line", speaker: "旁白", text: "四点。二十二个人上桥，一个跟一个，隔着三步。" },
          { id: "l010", type: "line", speaker: "旁白", text: "我在桥头数光点。一个光点是一个活人。" },
          { id: "l011", type: "line", speaker: "旁白", text: "数到十七，停了很久，才数到十八。" },
          { id: "l012", type: "line", speaker: "旁白", text: "中间那一段，我数了三遍，都是十七。" },
          {
            id: "l013",
            type: "minigame",
            game: "climb",
            config: { duration: 75, spans: 3, lights: 22, stepMs: 1800, hitWindow: 0.35, fireAt: "6,12,18", fireWindow: 1.5, fireTaps: 3 }
          },
          {
            id: "l014",
            type: "result",
            source: "minigame",
            game: "climb",
            title: "攀索",
            note: "过去了多少，没过去多少，桥上都记着。"
          },
          { id: "l015", type: "line", speaker: "旁白", text: "桥板一块一块铺上去的时候，铁索在抖。" },
          { id: "l016", type: "line", speaker: "旁白", text: "铺桥的人趴着往前挪，脚后跟勾住铁索，手里递板子。" },
          { id: "l017", type: "line", speaker: "旁白", text: "我跟着队伍过桥。" },
          { id: "l018", type: "line", speaker: "旁白", text: "走到中间，看见桥板上有一道划痕，像谁用指甲刻的。" },
          {
            id: "l019",
            type: "choice",
            when: "item.door",
            prompt: "桥板不够。你背上有一块门板。",
            record: "choice.luding.door",
            timeout: 6,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "把门板铺上桥面",
                value: true,
                set: { "item.door": false, trust: "+1" },
                cost: "你的门板成了第三块桥板"
              },
              {
                key: "B",
                text: "抱着门板过桥",
                value: false,
                set: { load: "+0" },
                cost: "你背上多三十斤，过桥慢了半拍，后面的人等你"
              }
            ]
          },
          {
            id: "l020",
            type: "line",
            speaker: "旁白",
            text: "我背上没有门板。过桥的时候，手只能抓住铁索。",
            when: "!item.door"
          },
          { id: "l021", type: "line", speaker: "旁白", text: "过桥以后，我回头看那十三根铁索。它们空着，还在晃。", bg: "luding_after" },
          { id: "l022", type: "line", speaker: "旁白", text: "飞毛腿没过来。他的号挂在桥头的木桩上，还热着。" },
          { id: "l023", type: "line", speaker: "旁白", text: "我把号取下来，塞进背包。号嘴上有牙印，他咬的。" },
          { id: "l024", type: "line", speaker: "冬生", text: "号给我。" },
          { id: "l025", type: "line", speaker: "满崽", text: "就剩一个了。" },
          { id: "l026", type: "line", speaker: "冬生", text: "我知道。他吹的时候，我在后面听。" },
          {
            id: "l027",
            type: "choice",
            prompt: "二十二个人，名字不全。",
            record: "choice.luding.names",
            timeout: 6,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "记下数字，不写名字",
                value: "A",
                set: { "memory.luding_unknown": false },
                cost: "名册上多一行空白"
              },
              {
                key: "B",
                text: "留一页空白，等名字",
                value: "B",
                set: { "memory.luding_unknown": true },
                cost: "那一页一直是空的"
              }
            ]
          },
          {
            id: "l028a",
            type: "line",
            speaker: "旁白",
            text: "我在名册最后留了一整页。",
            when: "memory.luding_unknown"
          },
          {
            id: "l029a",
            type: "line",
            speaker: "旁白",
            text: "页脚写：泸定，二十二，名字待查。",
            when: "memory.luding_unknown"
          },
          {
            id: "l028b",
            type: "line",
            speaker: "旁白",
            text: "我在名册上写：泸定，二十二。写完就合上了。",
            when: "!memory.luding_unknown"
          },
          { id: "l030", type: "line", speaker: "旁白", text: "那天夜里，我把“北”字重新描了一遍。" },
          { id: "l031", type: "line", speaker: "旁白", text: "铅笔头短得握不住，我用布条把它绑在手指上。" },
          { id: "l032", type: "line", speaker: "旁白", text: "描的时候，手没抖。" },
          { id: "l033", type: "title", text: "第五章 · 草地", sub: "一九三五年 · 八月" },
          { id: "l034", type: "codex", codexId: "luding" },
          { id: "l900", type: "end", next: "grass" }
        ]
      },
      {
        id: "grass",
        order: 6,
        title: "第五章 · 草地",
        short: "草地",
        playable: true,
        nodes: [
          { id: "g001", type: "line", speaker: "旁白", text: "草地。八月，没有一棵树。", bg: "grass_marsh" },
          { id: "g002", type: "line", speaker: "旁白", text: "脚下的草是黑的，踩上去，水就冒出来。" },
          { id: "g003", type: "line", speaker: "旁白", text: "水不过脚踝，可是走一天，腿是紫的。" },
          { id: "g004", type: "line", speaker: "旁白", text: "背上的门板这时候是一张床。" },
          { id: "g005", type: "line", speaker: "旁白", text: "伤员躺上去，比躺在泥里强。" },
          { id: "g006", type: "line", speaker: "旁白", text: "雨下起来没有声音。" },
          { id: "g007", type: "line", speaker: "旁白", text: "落在草上，像有人在远处抖一块布。" },
          {
            id: "g008",
            type: "choice",
            prompt: "炒面只剩半袋。",
            record: "choice.grass.share",
            timeout: 10,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "炒面分给伤员",
                value: true,
                set: { fire: "-15", trust: "+1" },
                cost: "你三天没吃饱，走不动"
              },
              {
                key: "B",
                text: "炒面分给还能走的人",
                value: false,
                set: { trust: "-1", load: "+1" },
                cost: "伤员看你的眼神，变了"
              }
            ]
          },
          { id: "g009", type: "line", speaker: "旁白", text: "第七天，我们在一条河沟边停下。" },
          { id: "g010", type: "line", speaker: "旁白", text: "前面的人在挖坑。" },
          { id: "g011", type: "line", speaker: "旁白", text: "坑不大，能放七八个人。" },
          { id: "g012", type: "line", speaker: "旁白", text: "挖完，坑边坐着一排人，谁也没说话。" },
          { id: "g013", type: "line", speaker: "旁白", text: "有人问，埋谁。" },
          { id: "g014", type: "line", speaker: "旁白", text: "没人答。" },
          { id: "g015", type: "line", speaker: "旁白", text: "后来大家把各自的干粮袋解下来，放在坑边。" },
          { id: "g016", type: "line", speaker: "灶王", text: "最后一锅。喝了再走。" },
          { id: "g017", type: "line", speaker: "旁白", text: "他蹲下去生火。" },
          { id: "g018", type: "line", speaker: "旁白", text: "柴是湿的，他吹了半天。" },
          { id: "g019", type: "line", speaker: "旁白", text: "火没起来。他就在那儿蹲着，没再站起来。" },
          { id: "g020", type: "line", speaker: "旁白", text: "我把他埋在一个能看见太阳的地方。那天没有太阳。" },
          {
            id: "g021",
            type: "choice",
            prompt: "灶王的小锅还在火堆边。",
            record: "choice.grass.pot",
            timeout: 8,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "背走小锅",
                value: true,
                set: { "item.pot": true, load: "+1" },
                cost: "背上的东西又多一件"
              },
              {
                key: "B",
                text: "把小锅留给他",
                value: false,
                set: { "item.pot": false },
                cost: "到了陕北，你没有锅"
              }
            ]
          },
          {
            id: "g022a",
            type: "line",
            speaker: "旁白",
            text: "我把小锅背上。锅沿磕着门板，一路响。",
            when: "item.pot"
          },
          {
            id: "g022b",
            type: "line",
            speaker: "旁白",
            text: "我把小锅放在他手边。",
            when: "!item.pot"
          },
          {
            id: "g023b",
            type: "line",
            speaker: "旁白",
            text: "走出一段路，我还能看见那口锅在发亮。",
            when: "!item.pot"
          },
          { id: "g024", type: "line", speaker: "冬生", text: "号还吹得动吗？", bg: "grass_dawn" },
          { id: "g025", type: "line", speaker: "旁白", text: "他吹了一个音，气不够，断了。" },
          { id: "g026", type: "line", speaker: "旁白", text: "他把号擦干净，又塞回怀里，像塞回一件怕冷的东西。" },
          { id: "g027", type: "line", speaker: "旁白", text: "走出草地那天，前面有人喊：看见房子了。" },
          { id: "g028", type: "line", speaker: "旁白", text: "没有人跑。大家只是把脚步放快了一点。" },
          { id: "g029", type: "title", text: "终章 · 吴起", sub: "一九三五年 · 十月" },
          { id: "g030", type: "codex", codexId: "grass" },
          { id: "g900", type: "end", next: "wuqi" }
        ]
      },
      {
        id: "wuqi",
        order: 7,
        title: "终章 · 吴起 · 点名",
        short: "吴起",
        playable: true,
        nodes: [
          { id: "w001", type: "line", speaker: "旁白", text: "1935年10月19日，吴起镇。土是黄的，天很高。", bg: "wuqi_dawn" },
          { id: "w002", type: "line", speaker: "旁白", text: "镇口的窑洞墙上刷着标语：北上抗日。" },
          { id: "w003", type: "line", speaker: "旁白", text: "老乡站在门边看我们，不说话。有人把一筐土豆放在路口，转身就进屋。" },
          { id: "w004", type: "line", speaker: "旁白", text: "有人在井边打水，先给伤员。轮到我，只剩半瓢，底的泥一晃一晃。" },
          { id: "w005", type: "line", speaker: "旁白", text: "队伍停下来。第一次没有人喊“快”。" },
          { id: "w006a", type: "line", speaker: "林先生", text: "满崽，借你的门板用一下。标语写不下，得找块平的。", when: "item.door" },
          { id: "w007a", type: "line", speaker: "满崽", text: "……", when: "item.door" },
          { id: "w008a", type: "line", speaker: "旁白", text: "我把门板解下来，靠在墙上。背面那个“北”字，被雨泡得发白。", when: "item.door" },
          { id: "w009a", type: "line", speaker: "林先生", text: "这字谁写的？", when: "item.door" },
          { id: "w010a", type: "line", speaker: "满崽", text: "我。", when: "item.door" },
          { id: "w011a", type: "line", speaker: "林先生", text: "留着。标语写在正面，字写在背面，正好。", when: "item.door" },
          { id: "w012a", type: "line", speaker: "旁白", text: "她先用粉笔打格子。一个字一格，写一个，退后两步看看，再写下一个。", when: "item.door" },
          { id: "w006b", type: "line", speaker: "旁白", text: "林先生想借门板写标语。我背后空着，她只好找了一面石墙。", when: "!item.door" },
          {
            id: "w013",
            type: "choice",
            when: "item.door",
            prompt: "门板靠在墙上。标语还没写。",
            record: "choice.wuqi.door",
            timeout: 10,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "把门板留在吴起",
                value: false,
                set: { "item.door": false, "memory.door": true },
                cost: "你从此没有那块板了"
              },
              {
                key: "B",
                text: "带回于都",
                value: true,
                set: { "item.door": true, load: "+1", "memory.door": false },
                cost: "回家的路还很长"
              }
            ]
          },
          {
            id: "w014b",
            type: "line",
            speaker: "旁白",
            text: "我站在墙边，看她把标语写在石头上。",
            when: "!item.door"
          },
          { id: "w015a", type: "line", speaker: "旁白", text: "门板还绑在我背上。它比出发时轻，边上被磨圆了。", when: "item.door" },
          { id: "w016a", type: "line", speaker: "旁白", text: "林先生没再要。她找了面石墙，把标语写在了石头上。", when: "item.door" },
          { id: "w017a", type: "line", speaker: "旁白", text: "写完她退后两步看，说：还是门板平。", when: "item.door" },
          { id: "w015b", type: "line", speaker: "旁白", text: "门板留在墙上。红漆的“北”压住铅笔的“北”，压得很正。", when: "!item.door && memory.door" },
          { id: "w016b", type: "line", speaker: "旁白", text: "风把标语吹起一个角。我伸手按平，红漆还没干。", when: "!item.door && memory.door" },
          { id: "w015c", type: "line", speaker: "旁白", text: "标语写在石墙上。红漆压在铅笔字旁边，压得有点歪。", when: "!item.door && !memory.door" },
          { id: "w016c", type: "line", speaker: "旁白", text: "风把纸角吹起来。我伸手按住，石墙是凉的。", when: "!item.door && !memory.door" },
          { id: "w017", type: "line", speaker: "旁白", text: "点名的时候，天刚亮。", bg: "wuqi_wall" },
          { id: "w018", type: "line", speaker: "旁白", text: "念到的人答“到”。队伍站成三排，前一排能看见后一排的鞋。" },
          { id: "w019", type: "line", speaker: "旁白", text: "名册翻到第三页。纸已经软了，像一块布。" },
          { id: "w020", type: "line", speaker: "旁白", text: "念到何指导员。他在别的连，那边有人应了一声。" },
          { id: "w021", type: "line", speaker: "旁白", text: "念到细妹。她答“到”，声音比平时高。" },
          { id: "w022", type: "line", speaker: "旁白", text: "念到林先生。她正在收粉笔，回头应了一声。" },
          { id: "w023", type: "line", speaker: "旁白", text: "念到老周。队伍里没有人应。" },
          { id: "w024", type: "line", speaker: "旁白", text: "念到灶王。没有人应。" },
          { id: "w025", type: "line", speaker: "旁白", text: "念到飞毛腿。没有人应。" },
          {
            id: "w026",
            type: "interact",
            mode: "rollcall",
            duration: 45,
            names: [
              { id: "he", name: "何指导员", status: "remote" },
              { id: "ximei", name: "细妹", status: "self" },
              { id: "lin", name: "林先生", status: "self" },
              { id: "zhou", name: "老周", status: "absent" },
              { id: "zaowang", name: "灶王", status: "absent" },
              { id: "feimao", name: "飞毛腿", status: "absent" },
              { id: "dongsheng", name: "冬生", status: "self" }
            ]
          },
          { id: "w027a", type: "line", speaker: "旁白", text: "有几个名字，我没有替他们答上来。", when: "memory.rollcall_missed_any" },
          { id: "w027b", type: "line", speaker: "旁白", text: "三个人的名字，我都替他们答了。", when: "!memory.rollcall_missed_any" },
          { id: "w028", type: "line", speaker: "旁白", text: "后来有人告诉我，出发的时候，中央红军八万六千人。" },
          { id: "w029", type: "line", speaker: "旁白", text: "到陕北，七千余人。" },
          { id: "w030", type: "line", speaker: "旁白", text: "全连出发一百零四，到吴起十九。" },
          { id: "w031", type: "line", speaker: "旁白", text: "十九个人，站成三排。前排空着的位置，风从那儿过。" },
          { id: "w032", type: "line", speaker: "旁白", text: "会后，指导员让我把五句话抄在纸上，贴在连部门口。" },
          { id: "w033", type: "line", speaker: "旁白", text: "我抄了五句。抄完，在最后添了一行小字：以上，都是别人教我的。" },
          { id: "w034", type: "line", speaker: "旁白", text: "散了会，我一个人走到镇口。风很大，吹得标语哗哗响。" },
          { id: "w035", type: "line", speaker: "旁白", text: "娘说过，家在人身上。" },
          { id: "w036", type: "line", speaker: "旁白", text: "我把名册翻开。名字有的还在，有的被我划掉了。" },
          { id: "w037", type: "line", speaker: "旁白", text: "划掉的那些，我没有划第二遍。" },
          { id: "w038", type: "line", speaker: "旁白", text: "最后一页是空的。我本来想写点什么。" },
          { id: "w039", type: "line", speaker: "旁白", text: "想了很久，只写了一个字。" },
          { id: "w040", type: "line", speaker: "旁白", text: "北。" },
          { id: "w041", type: "codex", codexId: "wuqi" },
          { id: "w900", type: "end", next: "ending" }
        ]
      }
    ],
    // 结局文案源：五卡只存亮/灰两句，亮哪张由引擎按旗标算，不在这里写条件。
    ending: {
      title: "向北",
      date: "一九三五年 · 十月",
      lede: "一块门板，两万五千里。",
      disclaimer: "本作人物与连队均为虚构，非史料人物；史实以《史实注》与《史实出处表》为准。",
      cards: [
        {
          id: "ideal",
          title: "理想信念",
          litLine: "最冷的那一夜，你还留着火。",
          unlitLine: "火种，剩得不多了。"
        },
        {
          id: "sacrifice",
          title: "不怕牺牲",
          litLine: "你把最后一批人，留在了江东岸。",
          unlitLine: "你按命令过了江。"
        },
        {
          id: "truth",
          title: "独立自主",
          litLine: "你在遵义，承认了自己走错的那一步。",
          unlitLine: "错误卡上，你自己的那条最短。"
        },
        {
          id: "overall",
          title: "顾全大局",
          litLine: "主力先过江，你排到最后。",
          unlitLine: "你先渡了最急的人。"
        },
        {
          id: "people",
          title: "依靠人民",
          litLine: "三十七个船工的名字，你记下了。",
          unlitLine: "江边的名字，你没记下几个。"
        }
      ]
    },
    // 七张史实注：正文与 docs/codex.md 逐字一致；真实人物只在这里出现，不进剧情对白。
    codex: [
      {
        id: "yudu",
        title: "于都 · 长征第一渡",
        type: "史实 ＋ 有不同说法",
        body:
          "1934年10月17日至21日拂晓，中央红军主力从于都出发，渡过于都河。河宽六百余米，最深处约二十米。五天里，五座浮桥在黄昏架上、天亮前拆掉，先后架设、拆除十五次。桥板是老百姓送来的门板、床板和寿材。渡口数量有不同说法：一说八个主要渡口，一说十个。",
        source: "求是网《听总书记讲党史故事丨“长征第一渡”》（2021-08-23）；中国军网《于都夜渡 远征启航》。",
        note: "渡口数量有不同说法：一说八个主要渡口，一说十个。"
      },
      {
        id: "xiangjiang",
        title: "湘江 · 最惨烈的一战",
        type: "史实 ＋ 有不同说法",
        body:
          "1934年11月底至12月初，中央红军在湘江两岸与国民党军激战七昼夜。出发时的八万六千余人，渡过湘江后锐减至三万余人。红五军团第三十四师奉命断后，掩护主力渡江，与十几倍于己的敌人鏖战四天五夜，几乎全部牺牲。师长陈树湘负伤被俘，在押送途中牺牲。过江的队伍里还抬着几只三百斤重的木箱，有人说里头是一台 X 光机；究竟有没有、何时丢下，有不同说法。",
        source: "人民网·中国共产党新闻网《湘江战役：中央红军长征的悲壮史诗》；《震古烁今的伟大远征》。",
        note: "木箱里是不是 X 光机、什么时候丢下，有不同说法。"
      },
      {
        id: "zunyi",
        title: "遵义 · 生死攸关的转折点",
        type: "史实",
        body:
          "1935年1月15日至17日，中共中央政治局扩大会议在遵义召开，连开三天。会议总结了第五次反“围剿”失败和长征初期的教训，改组了中央领导机构。此时中央红军约三万七千余人，比出发时的八万六千余人少了一大半。会议开在城里，城门外的哨兵照常换岗；对大多数战士来说，那三天只是“驻下来休整”，队伍里的变化是后来才慢慢看出来的。",
        source: "中国军网《遵义会议：中国革命“生死攸关的转折点”》；人民网《中央红军到达陕北后还剩多少兵力》。",
        note: ""
      },
      {
        id: "jinsha",
        title: "金沙江 · 三十七个船工",
        type: "史实 ＋ 有不同说法",
        body:
          "1935年5月，中央红军在云南皎平渡渡过金沙江。三十七名船工用六条小船，七天七夜不停摆渡，人歇船不歇，5月9日渡完全军。后来在渡口立起纪念碑，碑上镌着三十七个名字或绰号。船工们立下规矩：排队上船，谁也不能挤。船数有不同说法，一说六条，一说七条。",
        source: "中国军网·解放军报《7天7夜，不停摆渡，金沙江畔纪念碑上的37个名字依然闪光》（2026-10-28）。",
        note: "船数有不同说法：一说六条，一说七条。"
      },
      {
        id: "luding",
        title: "泸定 · 十三根铁索",
        type: "史实 ＋ 有不同说法",
        body:
          "1935年5月29日下午四时，红四团二十二名突击队员冒着火力，攀着十三根铁索爬过泸定桥。桥板已被抽去，后续部队边爬边铺桥板。此前，部队一昼夜奔袭二百四十余里。二十二个人里，有人过去了，有人没有。后来的纪念碑上，能查到的名字不全——有一部分人的姓名已经佚散，难以确定；二十二人里牺牲了几人，也有不同说法。",
        source: "中国军网《听涛泸定桥》；《铁索铭记铁血青春》。",
        note: "二十二人里牺牲了几人，有不同说法；纪念碑上的名字不全。"
      },
      {
        id: "grass",
        title: "草地 · 班佑河畔",
        type: "史实 ＋ 回忆录",
        body:
          "1935年8月，红军进入松潘草地。那里没有道路，到处是黑水和沼泽，走七天才能到班佑。王平在回忆录里写到班佑河畔：他带人回去找掉队的战士，看见他们背靠背坐着，像是睡着了，已经没有气息。近八百人长眠在那里。进草地之前先翻夹金山，垭口海拔四千一百多米，高度有不同说法，本作只写“四千米以上”。草地的减员数字各方记载也不同，本作不写具体数字，只写走过的人。",
        source: "中国军网《草地边缘，近800名红军战士长眠于班佑河畔》（2026-10-04）。",
        note: "夹金山垭口高度、草地减员数字，各方记载有不同说法；本作只写“四千米以上”，不写减员数。"
      },
      {
        id: "wuqi",
        title: "吴起 · 到陕北",
        type: "史实",
        body:
          "1935年10月19日，陕甘支队进入陕西吴起镇，长征到达陕北。从1934年10月到1935年10月，中央红军走了一年，行程二万五千里。出发时的八万六千余人，到陕北剩七千余人。一个月后，部队与红十五军团会合。吴起镇在黄土塬上，风大，水少，镇口的路是土路。",
        source: "中国军网《吴起的晨曦》（2026-09-14）；人民网《中央红军到达陕北后还剩多少兵力》。",
        note: ""
      }
    ]
  };
})(window.XB = window.XB || {});
