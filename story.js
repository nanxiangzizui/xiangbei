(function (XB) {
  "use strict";

  // 节点契约见 docs/script/README.md §6；id 映射见 §7。
  // 文本源是 docs/script/00-prologue.md（定稿 1280 字 / 82 beat）；改文本先改 md，再同步这里。
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
          { id: "p013", type: "line", speaker: "娘", text: "路要从家门口开始。" },
          { id: "p100", type: "line", speaker: "旁白", text: "锯末还没扫，门口就来了人。" },
          { id: "p101", type: "line", speaker: "飞毛腿", text: "这是你家的门？" },
          { id: "p102", type: "line", speaker: "满崽", text: "嗯。" },
          { id: "p103", type: "line", speaker: "飞毛腿", text: "锯了？" },
          { id: "p104", type: "line", speaker: "满崽", text: "嗯。" },
          { id: "p105", type: "line", speaker: "飞毛腿", text: "那你家没门了。" },
          { id: "p106", type: "line", speaker: "旁白", text: "他伸手要接我背上的绳子。我往旁边让了一下。" },
          { id: "p107", type: "line", speaker: "满崽", text: "我自己背。" },
          { id: "p108", type: "line", speaker: "飞毛腿", text: "我跑得快。背着也不耽误。" },
          { id: "p109", type: "line", speaker: "旁白", text: "他把绳子往肩上试了试，勒得龇牙。" },
          { id: "p110", type: "line", speaker: "飞毛腿", text: "沉。比一箱子弹还沉。" },
          { id: "p111", type: "line", speaker: "旁白", text: "他把绳子还给我，没再说什么。" },
          { id: "p112", type: "line", speaker: "旁白", text: "灶王从灶屋出来，手里托着一块锅巴。" },
          { id: "p113", type: "line", speaker: "灶王", text: "你娘说你没吃晚饭。" },
          { id: "p114", type: "line", speaker: "满崽", text: "你吃了吗？" },
          { id: "p115", type: "line", speaker: "灶王", text: "我锅里还有。" },
          { id: "p116", type: "line", speaker: "旁白", text: "他的锅在背上，锅底是空的。风从锅口灌进去。" },
          { id: "p117", type: "line", speaker: "灶王", text: "门板好。能当案板。" },
          { id: "p118", type: "line", speaker: "满崽", text: "不能切。" },
          { id: "p119", type: "line", speaker: "灶王", text: "知道。你家的门。" },
          { id: "p120", type: "line", speaker: "旁白", text: "他把锅巴掰成两半，大的那块塞给我。" },
          { id: "p121", type: "line", speaker: "旁白", text: "冬生在祠堂门槛上擦号。号比他高半头。" },
          { id: "p122", type: "line", speaker: "冬生", text: "你叫满崽？" },
          { id: "p123", type: "line", speaker: "满崽", text: "嗯。" },
          { id: "p124", type: "line", speaker: "冬生", text: "我叫冬生。冬天的冬，生下来的生。" },
          { id: "p125", type: "line", speaker: "满崽", text: "名册上有。我写的。" },
          { id: "p126", type: "line", speaker: "冬生", text: "写对没有？" },
          { id: "p127", type: "line", speaker: "满崽", text: "写对了。" },
          { id: "p128", type: "line", speaker: "冬生", text: "那就行。到了吴起，我要自己应。" },
          { id: "p129", type: "line", speaker: "旁白", text: "林先生在祠堂墙上写字。她先打格子，一个字一格。" },
          { id: "p130", type: "line", speaker: "林先生", text: "满崽，来扶一下纸。" },
          { id: "p131", type: "line", speaker: "旁白", text: "她的手上全是墨。纸一抖，字就歪。" },
          { id: "p132", type: "line", speaker: "林先生", text: "你认得几个字？" },
          { id: "p133", type: "line", speaker: "满崽", text: "不多。名册上的，够用。" },
          { id: "p134", type: "line", speaker: "林先生", text: "够了。名字写正，比写多要紧。" },
          { id: "p135", type: "line", speaker: "旁白", text: "她低头看见门板，用指节敲了敲背面。" },
          { id: "p136", type: "line", speaker: "林先生", text: "这面能写字。" },
          { id: "p137", type: "line", speaker: "满崽", text: "我娘说，写字垫着。" },
          { id: "p138", type: "line", speaker: "林先生", text: "垫着也是写。" },
          { id: "p014", type: "line", speaker: "旁白", text: "老周在祠堂门口点人。我蹲在门槛上，拿铅笔一个一个记。" },
          { id: "p015", type: "line", speaker: "老周", text: "满崽，名字比枪重。记清楚。" },
          { id: "p016", type: "line", speaker: "旁白", text: "他念一个名字，队伍里有人应。念到没人应的，他自己低低应一声。" },
          { id: "p018", type: "line", speaker: "满崽", text: "我记一下。" },
          { id: "p019", type: "line", speaker: "旁白", text: "那一夜，我把全连的名字抄了一遍。抄到最后一个，手是抖的。" },
          { id: "p020", type: "line", speaker: "旁白", text: "名字写歪了，我用指甲刮掉重写。刮破了两处纸。" },
          {
            id: "p021",
            type: "choice",
            prompt: "娘把锯子搁下，等你说。",
            record: "choice.prologue.door",
            timeout: 16,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "带上这块门板",
                value: true,
                set: { "item.door": true, "had.door": true, load: "+2", fire: "+10" },
                cost: "行囊只剩两格，多背三十斤"
              },
              {
                key: "B",
                text: "只带花名册",
                value: false,
                set: { "item.door": false, "had.door": false, load: "+0" },
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
            type: "multichoice",
            prompt: "娘把五样东西摆在桌上。行囊四格；带门板，占两格。",
            min: 0,
            max: 5,
            confirmLabel: "系好行囊",
            inventoryBase: ["roster", "pencil"],
            options: [
              {
                id: "medicine",
                text: "药",
                note: "两包草药，油纸裹着。",
                slots: 1,
                inventoryId: "medicine",
                flag: "item.medicine",
                setOn: { "item.medicine": true },
                setOff: { "item.medicine": false }
              },
              {
                id: "barley",
                text: "青稞",
                note: "一小袋炒青稞，娘连夜磨的。",
                slots: 1,
                inventoryId: "barley",
                flag: "item.barley",
                setOn: { "item.barley": true },
                setOff: { "item.barley": false }
              },
              {
                id: "homepot",
                text: "铁锅",
                note: "家里那口铁锅，锅底结着黑。",
                slots: 1,
                inventoryId: "pot",
                flag: "item.homepot",
                setOn: { "item.homepot": true },
                setOff: { "item.homepot": false }
              },
              {
                id: "raincloth",
                text: "雨布",
                note: "补过三次的油布，叠起来一卷。",
                slots: 1,
                inventoryId: "raincloth",
                flag: "item.raincloth",
                setOn: { "item.raincloth": true },
                setOff: { "item.raincloth": false }
              },
              {
                id: "shoes",
                text: "布鞋",
                note: "新纳的底，针脚密。",
                slots: 1,
                inventoryId: "shoes",
                flag: "item.shoes",
                setOn: { "item.shoes": true },
                setOff: { "item.shoes": false }
              }
            ]
          },
          {
            id: "p025",
            type: "result",
            source: "items",
            title: "行囊",
            note: "带走的摊在地上，只有一小堆。"
          },
          { id: "p026", type: "line", speaker: "旁白", text: "天快亮时，行囊定了。带走的摊在地上，只有一小堆。" },
          { id: "p027", type: "line", speaker: "旁白", text: "灶王把锅擦了一遍，又擦一遍，像要把它擦亮。" },
          { id: "p028", type: "line", speaker: "灶王", text: "大锅留下，小锅我背。人先走。" },
          {
            id: "p028a",
            type: "line",
            speaker: "旁白",
            text: "家里的铁锅绑在行囊外头。走一步，锅底磕一下背。",
            when: "item.homepot"
          },
          {
            id: "p028b",
            type: "line",
            speaker: "旁白",
            text: "家里的铁锅留在灶台上，锅盖扣着。",
            when: "!item.homepot"
          },
          {
            id: "p029a",
            type: "line",
            speaker: "旁白",
            text: "我在纸上写：水缸、柴、桌子。门板那一行，空着。",
            when: "item.door"
          },
          {
            id: "p029b",
            type: "line",
            speaker: "旁白",
            text: "我在纸上写：水缸、柴、桌子、一扇门。",
            when: "!item.door"
          },
          {
            id: "p029c",
            type: "line",
            speaker: "旁白",
            text: "纸角补一行：铁锅一口，带走。",
            when: "item.homepot"
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
            timeout: 16,
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
          { id: "p043", type: "title", text: "第一章 · 湘江", sub: "一九三四年 · 冬", place: "桂北 · 湘江", bg: "xiangjiang_map" },
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
          { id: "x100", type: "line", speaker: "旁白", text: "到江边之前，我们走了几天几夜。" },
          { id: "x101", type: "line", speaker: "旁白", text: "白天有飞机。飞机贴着树梢飞，翅膀底下的灯一闪一闪。" },
          { id: "x102", type: "line", speaker: "旁白", text: "飞机走了，炮就来。炮弹落在队伍后头，土掀起来，又落下去。" },
          { id: "x103", type: "line", speaker: "旁白", text: "晚上，江面上有火。火跟着水走，走不远就灭了。" },
          { id: "x104", type: "line", speaker: "旁白", text: "路边有人蹲着。走过去的时候，他还蹲着。" },
          { id: "x105", type: "line", speaker: "旁白", text: "后面的人把他抬到路边，用雨布盖上。" },
          { id: "x106", type: "line", speaker: "旁白", text: "雨布不够。有的人只盖住了脸。" },
          { id: "x107", type: "line", speaker: "旁白", text: "我们没停。停了，后面的人就过不来。" },
          { id: "x108", type: "line", speaker: "旁白", text: "江边比路上更亮。不是天亮，是烧着的船。" },
          { id: "x109", type: "line", speaker: "旁白", text: "对岸的山上有火光，一串一串。那是机枪。" },
          { id: "x110", type: "line", speaker: "旁白", text: "子弹打在浮桥边的水里，溅起来的水比人高。" },
          { id: "x111", type: "line", speaker: "旁白", text: "桥被炸断过一次。接上以后，桥面比原来矮了一截。" },
          { id: "x112", type: "line", speaker: "旁白", text: "有人掉下去。旁边的人伸手抓，抓上来一只帽子。" },
          { id: "x004", type: "line", speaker: "旁白", text: "后队还没上来。老周站在桥头，把帽子压得很低。" },
          { id: "x005", type: "line", speaker: "老周", text: "我先送后队。你带文书包先过，名册在，连就在。" },
          { id: "x006", type: "line", speaker: "满崽", text: "我记一下。" },
          { id: "x007", type: "line", speaker: "老周", text: "不用记。过了江，你自己来找我。" },
          { id: "x008", type: "line", speaker: "旁白", text: "他把干粮袋塞给我，袋里还有半袋炒米。他说他不饿。" },
          { id: "x009", type: "line", speaker: "旁白", text: "他说话的时候一直往桥那头看。那头有人抬着担架跑，跑得很慢。" },
          { id: "x113", type: "line", speaker: "旁白", text: "等桥的时候，我们蹲在江边的土坎下。" },
          { id: "x114", type: "line", speaker: "旁白", text: "土坎不高，蹲着能挡一点风。" },
          { id: "x115", type: "line", speaker: "灶王", text: "谁还有炒米？" },
          { id: "x116", type: "line", speaker: "旁白", text: "没人应。他把锅盖掀开，锅里是半锅冷水。" },
          { id: "x117", type: "line", speaker: "灶王", text: "冷水也行。喝一口，暖暖肚子。" },
          { id: "x118", type: "line", speaker: "旁白", text: "他先给冬生舀。冬生喝了一口，递给飞毛腿。" },
          { id: "x119", type: "line", speaker: "飞毛腿", text: "我不饿。" },
          { id: "x120", type: "line", speaker: "灶王", text: "你跑了一天，不饿？" },
          { id: "x121", type: "line", speaker: "飞毛腿", text: "我跑起来就忘了。" },
          { id: "x122", type: "line", speaker: "旁白", text: "灶王把锅底最后一点锅巴刮出来，塞给他。" },
          { id: "x123", type: "line", speaker: "灶王", text: "忘了也得吃。" },
          { id: "x124", type: "line", speaker: "旁白", text: "我蹲下去的时候，肩上的绳子滑了一下。" },
          { id: "x125", type: "line", speaker: "飞毛腿", text: "你背上那个，沉不沉？" },
          { id: "x126", type: "line", speaker: "满崽", text: "沉。" },
          { id: "x127", type: "line", speaker: "飞毛腿", text: "我替你背一段。" },
          { id: "x128", type: "line", speaker: "满崽", text: "不用。" },
          { id: "x129", type: "line", speaker: "飞毛腿", text: "我又不是没背过。上次背的是电台。" },
          { id: "x130", type: "line", speaker: "旁白", text: "他把手伸过来。我没让。他也没再抢。" },
          { id: "x131", type: "line", speaker: "飞毛腿", text: "行。过江的时候你走中间，我在后头。" },
          { id: "x132", type: "line", speaker: "旁白", text: "林先生蹲在岸边，把一面旧旗子撕成条。" },
          { id: "x133", type: "line", speaker: "满崽", text: "旗子不要了？" },
          { id: "x134", type: "line", speaker: "林先生", text: "旗子湿了，字看不清。布还能裹伤。" },
          { id: "x135", type: "line", speaker: "旁白", text: "她把布条一条一条叠好，塞给卫生员。" },
          { id: "x136", type: "line", speaker: "林先生", text: "满崽，你的手。" },
          { id: "x137", type: "line", speaker: "旁白", text: "我低头，才发现手心磨破了。她给我缠了一条。" },
          { id: "x138", type: "line", speaker: "林先生", text: "缠松一点。等会儿还要写字。" },
          { id: "x010", type: "line", speaker: "旁白", text: "江边堆着东西。箱子、印刷机、一摞摞文件，还有人舍不得丢的棉被。" },
          { id: "x011", type: "line", speaker: "旁白", text: "最占地方的是几只大木箱，三百斤一只，四个人抬，走三步歇一步。" },
          { id: "x012", type: "line", speaker: "旁白", text: "有人说里面是宝贝，能照见骨头。我没见过。" },
          { id: "x013", type: "line", speaker: "何指导员", text: "先弄清情况：什么必须过江，什么可以留下。定了就不许回头拿。" },
          { id: "x014", type: "line", speaker: "旁白", text: "他蹲下来，把六样东西摆成一排，像摆一副牌。摆完抬头问我：你自己挑三样。" },
          {
            id: "x015",
            type: "multichoice",
            prompt: "六样东西摆成一排。船只能再装三样。",
            min: 3,
            max: 3,
            confirmLabel: "上船",
            record: "choice.xiangjiang.abandoned",
            recordMode: "left",
            options: [
              {
                id: "xray",
                text: "X 光机",
                note: "三百斤，四个人抬。",
                flag: "choice.xiangjiang.take.xray",
                setOn: { "choice.xiangjiang.take.xray": true },
                setOff: { "choice.xiangjiang.take.xray": false }
              },
              {
                id: "press",
                text: "印刷机",
                note: "铁架子的，拆不开。",
                flag: "choice.xiangjiang.take.press",
                setOn: { "choice.xiangjiang.take.press": true },
                setOff: { "choice.xiangjiang.take.press": false }
              },
              {
                id: "files",
                text: "文件",
                note: "两捆，绳子勒得紧。",
                flag: "choice.xiangjiang.take.files",
                setOn: { "choice.xiangjiang.take.files": true },
                setOff: { "choice.xiangjiang.take.files": false }
              },
              {
                id: "medkit",
                text: "药箱",
                note: "白铁皮，锁着。",
                flag: "choice.xiangjiang.take.medkit",
                setOn: { "choice.xiangjiang.take.medkit": true },
                setOff: { "choice.xiangjiang.take.medkit": false }
              },
              {
                id: "radio",
                text: "电台",
                note: "天线用油布裹着。",
                flag: "choice.xiangjiang.take.radio",
                setOn: { "choice.xiangjiang.take.radio": true },
                setOff: { "choice.xiangjiang.take.radio": false }
              },
              {
                id: "silver",
                text: "银元",
                note: "一箱，沉，但能花。",
                flag: "choice.xiangjiang.take.silver",
                setOn: { "choice.xiangjiang.take.silver": true },
                setOff: { "choice.xiangjiang.take.silver": false }
              }
            ]
          },
          {
            id: "x016",
            type: "result",
            source: "abandon",
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
          {
            id: "x018a",
            type: "line",
            speaker: "旁白",
            text: "那只大木箱留在岸边，箱角朝着江。",
            when: "!choice.xiangjiang.take.xray"
          },
          {
            id: "x018b",
            type: "line",
            speaker: "旁白",
            text: "四个人抬那只大木箱上船。船身沉下去一截。",
            when: "choice.xiangjiang.take.xray"
          },
          { id: "x019", type: "line", speaker: "旁白", text: "天亮了。江面上漂着我们的东西：斗笠、文件箱、一面没有字的旗。", bg: "xiangjiang_dawn" },
          {
            id: "x019a",
            type: "line",
            speaker: "旁白",
            text: "雨布裹在名册外头。我解开看，边角还是湿了。",
            when: "item.raincloth"
          },
          {
            id: "x019b",
            type: "line",
            speaker: "旁白",
            text: "名册的边角湿了，字洇开。我把湿的那页撕下来。",
            when: "!item.raincloth"
          },
          {
            id: "x019c",
            type: "line",
            speaker: "旁白",
            text: "电台的天线断了一截，泡在水里，没人去捞。",
            when: "choice.xiangjiang.take.radio"
          },
          { id: "x020", type: "line", speaker: "旁白", text: "江很宽，漂得很慢。桥头有个卫生员在给人裹伤，绷带不够，就撕自己的衬衣。" },
          {
            id: "x020a",
            type: "line",
            speaker: "旁白",
            text: "卫生员看见我包袱里的药，停了一下，又塞回来：留着，路上长。",
            when: "item.medicine"
          },
          {
            id: "x020b",
            type: "line",
            speaker: "旁白",
            text: "他打开药箱，里面只剩半卷纱布。他把纱布剪成三段。",
            when: "choice.xiangjiang.take.medkit"
          },
          {
            id: "x020c",
            type: "line",
            speaker: "旁白",
            text: "我没有药。掏了半天，只掏出一支铅笔。",
            when: "!item.medicine && !choice.xiangjiang.take.medkit"
          },
          { id: "x139", type: "line", speaker: "旁白", text: "三班长姓陈，湖南人。他的鞋是自己补的。" },
          { id: "x140", type: "line", speaker: "旁白", text: "昨天夜里，他带人守桥头。今天早上，他没有回来。" },
          { id: "x021", type: "line", speaker: "旁白", text: "我把名册摊在膝盖上，开始划。" },
          { id: "x022", type: "line", speaker: "旁白", text: "划第一个名字的时候，手还稳。划到第五个，铅笔在纸上顿了一下。" },
          { id: "x023", type: "line", speaker: "旁白", text: "有个名字我划错了行，刮不掉，只好在旁边画个小叉。" },
          { id: "x024", type: "line", speaker: "旁白", text: "后来那种小叉越画越多，都是划错的行。一页纸像下了一场雨。" },
          { id: "x141", type: "line", speaker: "旁白", text: "我划到陈班长。他的名字在第四页。" },
          { id: "x142", type: "line", speaker: "旁白", text: "划的时候，把他的籍贯也划掉了。" },
          { id: "x143", type: "line", speaker: "旁白", text: "后来想起来，又用铅笔在旁边补了两个字：湖南。" },
          {
            id: "x025a",
            type: "choice",
            when: "item.door",
            prompt: "桥头的人往后挤。老周还在那边。",
            record: "choice.xiangjiang.hold",
            timeout: 20,
            defaultOption: "C",
            hideCost: true,
            options: [
              {
                key: "A",
                text: "回头接应老周",
                value: true,
                set: { "choice.xiangjiang.hold": true, fire: "+5", load: "+1" },
                setIf: [
                  { when: "item.barley", set: { "item.barley": false, "memory.xiangjiang.barley_lost": true } },
                  { when: "!item.barley", set: { "memory.xiangjiang.binding_lost": true } }
                ],
                cost: "你晚过江一个时辰"
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
            timeout: 20,
            defaultOption: "A",
            hideCost: true,
            options: [
              {
                key: "A",
                text: "回头接应老周",
                value: true,
                set: { "choice.xiangjiang.hold": true, fire: "+5", load: "+1" },
                setIf: [
                  { when: "item.barley", set: { "item.barley": false, "memory.xiangjiang.barley_lost": true } },
                  { when: "!item.barley", set: { "memory.xiangjiang.binding_lost": true } }
                ],
                cost: "你晚过江一个时辰"
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
            id: "x025c",
            type: "line",
            speaker: "旁白",
            text: "往回跑的时候，背上的青稞袋被弹片划开。撒了一路，我顾不上捡。",
            when: "memory.xiangjiang.barley_lost"
          },
          {
            id: "x025d",
            type: "line",
            speaker: "旁白",
            text: "往回跑的时候，绑腿被江水泡散。我拖着半条湿布，把老周从人堆里拽出来。",
            when: "memory.xiangjiang.binding_lost"
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
          { id: "x144", type: "line", speaker: "满崽", text: "名册还在。", when: "choice.xiangjiang.hold" },
          { id: "x145", type: "line", speaker: "老周", text: "数一遍。别少。", when: "choice.xiangjiang.hold" },
          { id: "x146", type: "line", speaker: "旁白", text: "我数到一半，他把我往桥那边推。", when: "choice.xiangjiang.hold" },
          { id: "x147", type: "line", speaker: "老周", text: "走。别回头。", when: "choice.xiangjiang.hold" },
          {
            id: "x026b",
            type: "line",
            speaker: "旁白",
            text: "我跟着队伍过了江。身后枪声一阵一阵，像有人在敲一块空木头。",
            when: "!choice.xiangjiang.hold"
          },
          { id: "x148", type: "line", speaker: "旁白", text: "后来枪声停了。我听见有人在喊名字。", when: "!choice.xiangjiang.hold" },
          { id: "x149", type: "line", speaker: "旁白", text: "喊一个，应一个。喊到后来，没有应声了。", when: "!choice.xiangjiang.hold" },
          { id: "x150", type: "line", speaker: "旁白", text: "飞毛腿从江边跑回来。他跑得歪，一只鞋没了。" },
          { id: "x151", type: "line", speaker: "飞毛腿", text: "老周让我带话。后队不来了。" },
          { id: "x152", type: "line", speaker: "旁白", text: "他说完，蹲下去，手撑着膝盖。" },
          { id: "x153", type: "line", speaker: "灶王", text: "起来。锅里还有水。" },
          { id: "x154", type: "line", speaker: "旁白", text: "飞毛腿没起来。冬生把号递到他嘴边。" },
          { id: "x155", type: "line", speaker: "冬生", text: "吹一个。吹给江那边听。" },
          { id: "x156", type: "line", speaker: "旁白", text: "他吹了一个音。气不够，断了。" },
          { id: "x157", type: "line", speaker: "旁白", text: "他又吹。这一次，声音很长。" },
          { id: "x028", type: "line", speaker: "细妹", text: "文书，你手在抖。" },
          { id: "x029", type: "line", speaker: "满崽", text: "风大。" },
          { id: "x030", type: "line", speaker: "旁白", text: "风确实大。她把我的袖子往下拉了拉，盖住手背。" },
          { id: "x031", type: "line", speaker: "细妹", text: "老周呢？" },
          { id: "x032", type: "line", speaker: "旁白", text: "我说，他随后就来。" },
          { id: "x033", type: "line", speaker: "旁白", text: "她“嗯”了一声，没再问。我们都听见了后队的枪声，从早上响到中午。" },
          { id: "x158", type: "line", speaker: "旁白", text: "林先生坐在岸边，把湿旗子上的字剪下来。" },
          { id: "x159", type: "line", speaker: "满崽", text: "还留着？" },
          { id: "x160", type: "line", speaker: "林先生", text: "留着。字湿了，也是字。" },
          { id: "x034", type: "line", speaker: "旁白", text: "后来我才知道，那一夜出发的八万六千人，过了江的不到一半。" },
          { id: "x035", type: "line", speaker: "旁白", text: "我把名册合上。合上之前，我数了一遍剩下的名字。" },
          { id: "x036", type: "line", speaker: "旁白", text: "数到第三遍，才数清。" },
          { id: "x037", type: "line", speaker: "旁白", text: "数清以后，我在封皮上写了一个数。写完又涂掉了。" },
          { id: "x038", type: "title", text: "第二章 · 遵义", sub: "一九三五年 · 一月", place: "黔北 · 遵义", bg: "zunyi_hall" },
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
          { id: "z004", type: "line", speaker: "旁白", text: "我们驻下，第一次睡满了整夜。" },
          { id: "z005", type: "line", speaker: "旁白", text: "会开了三天。" },
          { id: "z006", type: "line", speaker: "旁白", text: "门一直关着。" },
          { id: "z007", type: "line", speaker: "旁白", text: "我们在外面烧水、磨墨、等消息。" },
          { id: "z008", type: "line", speaker: "旁白", text: "门缝里透出烟。" },
          { id: "z010", type: "line", speaker: "旁白", text: "门里偶尔传出椅子挪动的声音。听不清说什么。" },
          { id: "z011", type: "line", speaker: "何指导员", text: "先弄清情况。弄清之前，别急着下结论。" },
          { id: "z012", type: "line", speaker: "旁白", text: "这话他说过很多次。" },
          { id: "z014", type: "line", speaker: "旁白", text: "散会那天，何指导员被调去别的连。" },
          { id: "z015", type: "line", speaker: "旁白", text: "他把一支铅笔头留给我，短得握不住。" },
          { id: "z016", type: "line", speaker: "何指导员", text: "拿着。写不出来的字，就想一想再写。" },
          { id: "z100", type: "line", speaker: "旁白", text: "下午没有事。我们把脚从绑腿里解出来。", bg: "zunyi_street" },
          { id: "z101", type: "line", speaker: "旁白", text: "脚趾头冻得发白，一碰热水，像针扎。" },
          { id: "z102", type: "line", speaker: "灶王", text: "水开了。先烫脚，再喝。" },
          { id: "z103", type: "line", speaker: "旁白", text: "他把一锅热水端下来，锅底垫着两块砖。" },
          { id: "z104", type: "line", speaker: "旁白", text: "十几双脚踏在盆沿上，盆只有两个。" },
          { id: "z105", type: "line", speaker: "飞毛腿", text: "我不用。我的脚是铁的。" },
          { id: "z106", type: "line", speaker: "灶王", text: "铁的也得烫。烫完再吹。" },
          { id: "z107", type: "line", speaker: "旁白", text: "飞毛腿把脚伸进盆里，烫得吸了一口气。" },
          { id: "z108", type: "line", speaker: "飞毛腿", text: "你这水，能褪猪毛。" },
          { id: "z109", type: "line", speaker: "灶王", text: "褪你的正好。" },
          { id: "z110", type: "line", speaker: "旁白", text: "我解下门板，肩膀上一道红印，磨破了皮。" },
          { id: "z111", type: "line", speaker: "飞毛腿", text: "我说替你背，你不让。" },
          { id: "z112", type: "line", speaker: "满崽", text: "你跑得快，背着它跑不快。" },
          { id: "z113", type: "line", speaker: "飞毛腿", text: "我慢一点就是了。" },
          { id: "z114", type: "line", speaker: "旁白", text: "他伸手按了按我的肩。我疼得缩了一下。" },
          { id: "z115", type: "line", speaker: "飞毛腿", text: "你看。明天我背。" },
          { id: "z116", type: "line", speaker: "满崽", text: "明天再说。" },
          { id: "z117", type: "line", speaker: "旁白", text: "林先生坐在灯下补冬生的鞋。鞋底磨穿了，她用旧布一层一层叠。" },
          { id: "z118", type: "line", speaker: "冬生", text: "先生，补厚了，我跑不动。" },
          { id: "z119", type: "line", speaker: "林先生", text: "不用你跑。你吹号。" },
          { id: "z120", type: "line", speaker: "冬生", text: "号也要跑。" },
          { id: "z121", type: "line", speaker: "林先生", text: "那就补薄一点。" },
          { id: "z122", type: "line", speaker: "旁白", text: "火盆边围了一圈人。有人问：你是哪里人？" },
          { id: "z123", type: "line", speaker: "飞毛腿", text: "吉安。赣江边。家里没田，我跑得快，队伍要我。" },
          { id: "z124", type: "line", speaker: "灶王", text: "浏阳。做厨子的。队伍路过，我给他们做了一顿饭，他们就让我跟着走。" },
          { id: "z125", type: "line", speaker: "冬生", text: "瑞金。我娘把我送到村口，说跟着队伍，有饭吃。" },
          { id: "z126", type: "line", speaker: "旁白", text: "冬生说完，低头看火。没有人接话。" },
          { id: "z127", type: "line", speaker: "林先生", text: "长沙。学校停了课。我会写字，队伍要写标语的人。" },
          { id: "z128", type: "line", speaker: "旁白", text: "轮到我了。" },
          { id: "z129", type: "line", speaker: "满崽", text: "于都。我家有扇门，锯了，背在身上。" },
          { id: "z130", type: "line", speaker: "飞毛腿", text: "就那个？" },
          { id: "z131", type: "line", speaker: "满崽", text: "就那个。" },
          { id: "z132", type: "line", speaker: "旁白", text: "又有人问：出来几年了？" },
          { id: "z133", type: "line", speaker: "飞毛腿", text: "两年。去年在兴国过的年。" },
          { id: "z134", type: "line", speaker: "灶王", text: "四年。我走的时候，我女儿三岁。" },
          { id: "z135", type: "line", speaker: "满崽", text: "你女儿？" },
          { id: "z136", type: "line", speaker: "灶王", text: "嗯。会烧火了。今年该七岁了。" },
          { id: "z137", type: "line", speaker: "旁白", text: "他往火里添了一根柴，没再说话。" },
          { id: "z180", type: "line", speaker: "冬生", text: "我两年。我娘送我的时候，稻子还没割。" },
          { id: "z181", type: "line", speaker: "林先生", text: "不到一年。先帮队伍写标语，后来就跟着走了。" },
          { id: "z138", type: "line", speaker: "旁白", text: "冬生忽然问：你们说，我们走得到吗？" },
          { id: "z139", type: "line", speaker: "旁白", text: "火盆里响了一声。" },
          { id: "z140", type: "line", speaker: "飞毛腿", text: "走得到。我算过，走一年，差不多了。" },
          { id: "z141", type: "line", speaker: "灶王", text: "走到了，我给你们煮一顿干的。" },
          { id: "z142", type: "line", speaker: "冬生", text: "我要吹号。吹给全连听。" },
          { id: "z143", type: "line", speaker: "林先生", text: "我不知道。我把路上的字写完，再说。" },
          { id: "z144", type: "line", speaker: "旁白", text: "他们看我。" },
          { id: "z145", type: "line", speaker: "满崽", text: "我不知道。名册不能丢。" },
          { id: "z146", type: "line", speaker: "飞毛腿", text: "那就丢不了。" },
          { id: "z147", type: "line", speaker: "旁白", text: "林先生从口袋里摸出一截铅笔。" },
          { id: "z148", type: "line", speaker: "林先生", text: "谁要写名字？" },
          { id: "z149", type: "line", speaker: "飞毛腿", text: "我。" },
          { id: "z150", type: "line", speaker: "旁白", text: "他凑过去，看林先生在纸上写。" },
          { id: "z151", type: "line", speaker: "林先生", text: "你的名字，三个字。" },
          { id: "z152", type: "line", speaker: "飞毛腿", text: "我不认得。" },
          { id: "z153", type: "line", speaker: "林先生", text: "不认得也能写。看着。" },
          { id: "z154", type: "line", speaker: "旁白", text: "她一笔一笔写。飞毛腿跟着用手指在膝盖上划。" },
          { id: "z155", type: "line", speaker: "旁白", text: "写完，她把纸折起来，递给他。" },
          { id: "z156", type: "line", speaker: "旁白", text: "他塞进帽子里，按了按。" },
          { id: "z157", type: "line", speaker: "飞毛腿", text: "等我认得三个字，我就自己写。" },
          { id: "z158", type: "line", speaker: "旁白", text: "灶王把锅翻过来，锅底朝上。" },
          { id: "z159", type: "line", speaker: "灶王", text: "先生，给我这锅写个字。" },
          { id: "z160", type: "line", speaker: "林先生", text: "写什么？" },
          { id: "z161", type: "line", speaker: "灶王", text: "写个“灶”。人家都这么叫我。" },
          { id: "z162", type: "line", speaker: "旁白", text: "她用墨在锅底写了一个“灶”字。写完，灶王看了半天。" },
          { id: "z163", type: "line", speaker: "灶王", text: "这回锅有名字了。丢了也认得回来。" },
          { id: "z164", type: "line", speaker: "旁白", text: "冬生也把手伸过去。林先生在他手心里写了“冬生”。" },
          { id: "z165", type: "line", speaker: "冬生", text: "洗手怎么办？" },
          { id: "z166", type: "line", speaker: "林先生", text: "洗了再写。" },
          { id: "z167", type: "line", speaker: "旁白", text: "轮到我，我摇了摇头。" },
          { id: "z168", type: "line", speaker: "满崽", text: "我的名字在名册上。" },
          { id: "z169", type: "line", speaker: "林先生", text: "名册是给活人查的。你自己也得有一份。" },
          { id: "z170", type: "line", speaker: "旁白", text: "她在我手心里写了一个“满”字。写完，手心有点痒。" },
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
          { id: "z171", type: "line", speaker: "旁白", text: "灶王说，他的错是锅里没粮，还硬说够吃。" },
          { id: "z172", type: "line", speaker: "旁白", text: "飞毛腿说，他的错是跑得太快，把后头的人丢了。" },
          { id: "z173", type: "line", speaker: "旁白", text: "冬生说，他的错是号吹晚了。" },
          { id: "z174", type: "line", speaker: "旁白", text: "林先生说，她的错是字写得太慢。" },
          { id: "z175", type: "line", speaker: "旁白", text: "没有人笑。" },
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
            note: "三条记录，不评分。写下来，是让下一程少走一步。",
            questions: ["这一路，哪一步走错了。", "轮到你了。", "名册，全吗？"],
            conclusions: ["三条，一条也没认。", "三条，认了一条。", "三条，认了两条。", "三条，都认了。"]
          },
          { id: "z027", type: "line", speaker: "旁白", text: "错误卡贴在墙上。风把纸角吹起来，又落下去。贴出来，是给下一程看的。" },
          { id: "z028", type: "line", speaker: "旁白", text: "我站在墙底下看了一会儿。" },
          {
            id: "z028a",
            type: "line",
            speaker: "旁白",
            text: "林先生在墙上刷标语。她先打格子，一行一行，像给字排队。"
          },
          { id: "z028b", type: "line", speaker: "林先生", text: "满崽，来扶一下纸。" },
          {
            id: "z028c",
            type: "line",
            speaker: "旁白",
            text: "她手上全是墨。粉笔递过来，也沾了一点在我手心。"
          },
          { id: "z028d", type: "line", speaker: "林先生", text: "字写歪了不要紧。别写错。" },
          {
            id: "z028e",
            type: "choice",
            prompt: "她递给你一截粉笔：写一个。",
            record: "choice.zunyi.lin",
            options: [
              {
                key: "A",
                text: "写“向北”",
                value: "north",
                set: { "memory.lin_north": true },
                cost: "两个字，你写得比名册上任何一页都慢"
              },
              {
                key: "B",
                text: "写自己的名字",
                value: "self",
                set: { "memory.lin_self": true },
                cost: "粉笔太短，最后一笔只剩一道白"
              }
            ]
          },
          {
            id: "z028f",
            type: "line",
            speaker: "旁白",
            text: "写完，她用袖子把墙上的灰拂掉。"
          },
          { id: "z029", type: "line", speaker: "旁白", text: "三条记录里，我自己写的那条最短。" },
          { id: "z030", type: "line", speaker: "旁白", text: "第二天早上，队伍出发。那面墙上的纸还在。" },
          { id: "z176", type: "line", speaker: "旁白", text: "灶王把锅背好，锅底的“灶”字贴着背。" },
          { id: "z177", type: "line", speaker: "旁白", text: "飞毛腿把帽子按了按，纸还在里头。" },
          { id: "z178", type: "line", speaker: "旁白", text: "冬生摊开手，手心的字洗掉了一半。" },
          { id: "z179", type: "line", speaker: "旁白", text: "林先生把剩下的粉笔头收进盒子。" },
          { id: "z031", type: "title", text: "第三章 · 金沙江", sub: "一九三五年 · 五月", place: "滇北 · 金沙江", bg: "jinsha_river" },
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
          { id: "j100", type: "line", speaker: "旁白", text: "等船的最后一夜，江风比前几天更冷。", bg: "jinsha_night" },
          { id: "j101", type: "line", speaker: "旁白", text: "我们围着火堆坐。石头被烤热了，坐上去烫。" },
          { id: "j102", type: "line", speaker: "灶王", text: "明天就过江了。锅里的米，今晚全煮了。" },
          { id: "j103", type: "line", speaker: "飞毛腿", text: "全煮了，明天吃什么？" },
          { id: "j104", type: "line", speaker: "灶王", text: "明天吃江里的。" },
          { id: "j105", type: "line", speaker: "旁白", text: "他把锅盖揭开。锅里是稀粥，能照见月亮。" },
          { id: "j106", type: "line", speaker: "旁白", text: "飞毛腿把碗端给冬生，自己刮锅底。" },
          { id: "j107", type: "line", speaker: "冬生", text: "你吃。" },
          { id: "j108", type: "line", speaker: "飞毛腿", text: "我吃过了。" },
          { id: "j109", type: "line", speaker: "旁白", text: "他的碗是空的。冬生把自己碗里的米粒拨给他。" },
          { id: "j110", type: "line", speaker: "灶王", text: "别拨了。再拨，明天都走不动。" },
          { id: "j111", type: "line", speaker: "旁白", text: "林先生坐在火边，把名册上的湿页一张一张烘。" },
          { id: "j112", type: "line", speaker: "满崽", text: "先生，字会烤糊吗？" },
          { id: "j113", type: "line", speaker: "林先生", text: "离远一点就不会。" },
          { id: "j114", type: "line", speaker: "旁白", text: "她把纸举在火上方，手很稳。" },
          { id: "j115", type: "line", speaker: "林先生", text: "满崽，你这本名册，比我的标语重。" },
          { id: "j116", type: "line", speaker: "满崽", text: "为什么？" },
          { id: "j117", type: "line", speaker: "林先生", text: "标语是给路人看的。名册是给回来的人看的。" },
          { id: "j118", type: "line", speaker: "旁白", text: "冬生靠在石头上，把号抱在怀里。" },
          { id: "j119", type: "line", speaker: "飞毛腿", text: "号嘴擦了吗？" },
          { id: "j120", type: "line", speaker: "冬生", text: "擦了。" },
          { id: "j121", type: "line", speaker: "飞毛腿", text: "再擦一遍。过江的时候，别哑。" },
          { id: "j122", type: "line", speaker: "旁白", text: "冬生用袖子擦号嘴，擦完，哈了一口气。" },
          { id: "j123", type: "line", speaker: "旁白", text: "我解下绑腿，肩上的伤又磨开了。" },
          { id: "j124", type: "line", speaker: "灶王", text: "过来。我给你看看。" },
          { id: "j125", type: "line", speaker: "满崽", text: "不用。" },
          { id: "j126", type: "line", speaker: "灶王", text: "不看也行。把这碗喝了。" },
          { id: "j127", type: "line", speaker: "旁白", text: "他往碗里撒了一撮盐。水是咸的。" },
          { id: "j128", type: "line", speaker: "满崽", text: "盐不是留着做菜吗？" },
          { id: "j129", type: "line", speaker: "灶王", text: "菜明天再做。" },
          { id: "j130", type: "line", speaker: "旁白", text: "飞毛腿往我这边挪了挪，让我靠。" },
          { id: "j131", type: "line", speaker: "飞毛腿", text: "你睡。我守前半夜。" },
          { id: "j132", type: "line", speaker: "满崽", text: "你明天还要跑。" },
          { id: "j133", type: "line", speaker: "飞毛腿", text: "我跑的时候也能睡。" },
          { id: "j134", type: "line", speaker: "旁白", text: "他说完，自己先笑了。" },
          { id: "j135", type: "line", speaker: "旁白", text: "林先生把烘干的纸叠好，塞回名册。" },
          { id: "j136", type: "line", speaker: "林先生", text: "明天上船，名册你背。别的让他背。" },
          { id: "j137", type: "line", speaker: "满崽", text: "我自己背。" },
          { id: "j138", type: "line", speaker: "林先生", text: "两个人背，路就短一点。" },
          { id: "j139", type: "line", speaker: "旁白", text: "后半夜，江上起了雾。" },
          { id: "j140", type: "line", speaker: "旁白", text: "灶王的锅在石头上，锅底的“灶”字朝着火。" },
          { id: "j141", type: "line", speaker: "旁白", text: "飞毛腿的帽子放在膝盖上，手一直按着。" },
          { id: "j142", type: "line", speaker: "旁白", text: "冬生的号嘴贴着脸，呼吸把铜吹得一起一伏。" },
          { id: "j143", type: "line", speaker: "旁白", text: "林先生靠着我睡着了。她的手上还有墨。" },
          {
            id: "j024",
            type: "choice",
            prompt: "最后一批上船前，何指导员问：先渡谁？",
            record: "choice.jinsha.priority",
            timeout: 16,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "先渡主力",
                value: "main",
                set: {
                  "choice.jinsha.priority": "main",
                  "choice.jinsha.main": true,
                  "choice.jinsha.wounded": false,
                  "choice.jinsha.kettle": false,
                  trust: "+1"
                },
                cost: "后勤的人和骡子多等一天"
              },
              {
                key: "B",
                text: "先渡伤员",
                value: "wounded",
                set: {
                  "choice.jinsha.priority": "wounded",
                  "choice.jinsha.main": false,
                  "choice.jinsha.wounded": true,
                  "choice.jinsha.kettle": false,
                  trust: "-1"
                },
                cost: "主力在渡口多暴露一天"
              },
              {
                key: "C",
                text: "先渡炊事班",
                value: "kettle",
                set: {
                  "choice.jinsha.priority": "kettle",
                  "choice.jinsha.main": false,
                  "choice.jinsha.wounded": false,
                  "choice.jinsha.kettle": true,
                  fire: "+5"
                },
                cost: "伤员在岸上多躺一天"
              }
            ]
          },
          {
            id: "j024a",
            type: "line",
            speaker: "旁白",
            text: "主力先上。骡子被牵着，蹄子在石头上打滑。",
            when: "choice.jinsha.main"
          },
          {
            id: "j024b",
            type: "line",
            speaker: "旁白",
            text: "伤员先上。担架放上船，船工把桨递过去，让躺着的人抓住。",
            when: "choice.jinsha.wounded"
          },
          {
            id: "j024c",
            type: "line",
            speaker: "旁白",
            text: "炊事班先上。锅和米袋挤在船头，船工喊了一声：沉。",
            when: "choice.jinsha.kettle"
          },
          { id: "j025", type: "line", speaker: "旁白", text: "最后一批上船的时候，天快亮了。", bg: "jinsha_night" },
          { id: "j026", type: "line", speaker: "旁白", text: "船工的号子只剩调子，没有词。" },
          {
            id: "j026a",
            type: "line",
            speaker: "旁白",
            text: "船工把最后一批人送过去，又回来接后勤。天亮前，骡子也上了船。",
            when: "choice.jinsha.main"
          },
          {
            id: "j026b",
            type: "line",
            speaker: "旁白",
            text: "最后一批是伤员。有人躺在船底，看着天，一声不吭。",
            when: "choice.jinsha.wounded"
          },
          {
            id: "j026c",
            type: "line",
            speaker: "旁白",
            text: "炊事班的锅最后过江。锅底朝天，像一口倒扣的井。",
            when: "choice.jinsha.kettle"
          },
          { id: "j027", type: "line", speaker: "张老幺", text: "走吧。往北，别停。" },
          { id: "j028", type: "line", speaker: "旁白", text: "船离岸，他没有招手。他蹲下去，把船绳又系紧了一道。" },
          { id: "j029", type: "line", speaker: "旁白", text: "我们上了北岸，回头看不见船。" },
          {
            id: "j029a",
            type: "line",
            speaker: "旁白",
            text: "后勤的人在岸边等船。有人靠着骡子睡着了。",
            when: "choice.jinsha.main"
          },
          {
            id: "j029b",
            type: "line",
            speaker: "旁白",
            text: "伤员的担架排在岸上。卫生员一个一个看过去。",
            when: "choice.jinsha.wounded"
          },
          {
            id: "j029c",
            type: "line",
            speaker: "旁白",
            text: "炊事班在岸上埋锅。火点着的时候，天刚好亮。",
            when: "choice.jinsha.kettle"
          },
          { id: "j030", type: "line", speaker: "旁白", text: "只听见桨声，一下，一下，没有停。" },
          { id: "j031", type: "title", text: "第四章 · 泸定", sub: "一九三五年 · 五月", place: "川西 · 大渡河", bg: "luding_bridge" },
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
          { id: "l100", type: "line", speaker: "旁白", text: "到泸定桥之前，我们走了一天一夜。", bg: "luding_bridge" },
          { id: "l101", type: "line", speaker: "旁白", text: "二百四十里。走到后来，前面的人睡着了还在走。" },
          { id: "l102", type: "line", speaker: "旁白", text: "后面的人推他一把，他醒一下，接着走。" },
          { id: "l103", type: "line", speaker: "旁白", text: "路边有敌军的岗哨。绕不过去的，前面的人去解决。" },
          { id: "l104", type: "line", speaker: "旁白", text: "天亮的时候，队伍在山沟里歇了半个时辰。" },
          { id: "l105", type: "line", speaker: "旁白", text: "有人一坐下就起不来。有人起来，又倒下。" },
          { id: "l106", type: "line", speaker: "旁白", text: "号声一响，倒下的人又站起来。" },
          { id: "l001", type: "line", speaker: "旁白", text: "大渡河。水声像打雷，站在桥头说话要靠喊。", bg: "luding_bridge" },
          { id: "l002", type: "line", speaker: "旁白", text: "桥板被抽走了。剩下十三根铁索，横在河上，晃。" },
          { id: "l003", type: "line", speaker: "旁白", text: "铁索有碗口粗吗？没有。一只手能握住。" },
          {
            id: "l003a",
            type: "line",
            speaker: "旁白",
            text: "跑回来的是个瘦高个。草鞋底磨穿了，脚趾头露在外面。"
          },
          {
            id: "l003b",
            type: "line",
            speaker: "旁白",
            text: "他叫飞毛腿。真名在花名册第三页。我写的，字很潦草。"
          },
          { id: "l003c", type: "line", speaker: "飞毛腿", text: "文书，我名字在第几页？" },
          { id: "l003d", type: "line", speaker: "满崽", text: "第三页。" },
          { id: "l003e", type: "line", speaker: "飞毛腿", text: "等过了桥，你念给我听。我不认得。" },
          { id: "l004", type: "line", speaker: "飞毛腿", text: "命令到了：下午四点，二十二个人，爬过去。" },
          { id: "l005", type: "line", speaker: "旁白", text: "他跑得满头汗，脖子上挂着一卷电线。" },
          { id: "l006", type: "line", speaker: "旁白", text: "电线尾巴一甩一甩。" },
          { id: "l007", type: "line", speaker: "满崽", text: "二十二个。数得清吗？" },
          { id: "l008", type: "line", speaker: "飞毛腿", text: "数得清。我在桥头数，你在桥尾记。" },
          {
            id: "l008a",
            type: "line",
            speaker: "旁白",
            text: "他把电线往脖子上一绕，笑了一下，牙很白。"
          },
          { id: "l107", type: "line", speaker: "旁白", text: "桥头的亭子烧着了，还在冒烟。" },
          { id: "l108", type: "line", speaker: "旁白", text: "对岸的机枪架在石头后面。枪口一响，铁索上就冒火星。" },
          { id: "l109", type: "line", speaker: "旁白", text: "敌军把桥板抽了，堆在桥头，浇上煤油。" },
          { id: "l110", type: "line", speaker: "旁白", text: "火点起来的时候，桥头的石头都是烫的。" },
          { id: "l009", type: "line", speaker: "旁白", text: "四点。二十二个人上桥，一个跟一个，隔着三步。" },
          { id: "l111", type: "line", speaker: "旁白", text: "第一个光点上了铁索。第二个跟上。第三个。" },
          { id: "l112", type: "line", speaker: "旁白", text: "第四个走到一半，停了一下，又往前。" },
          { id: "l113", type: "line", speaker: "旁白", text: "第五个、第六个。铁索在晃。" },
          { id: "l114", type: "line", speaker: "旁白", text: "数到第九个，那个光点灭了。" },
          { id: "l115", type: "line", speaker: "旁白", text: "第十个没有停。他从第九个的地方爬过去。" },
          { id: "l010", type: "line", speaker: "旁白", text: "我在桥头数光点。一个光点是一个活人。" },
          { id: "l011", type: "line", speaker: "旁白", text: "数到十七，停了很久，才数到十八。" },
          { id: "l012", type: "line", speaker: "旁白", text: "中间那一段，我数了三遍，都是十七。" },
          { id: "l116", type: "line", speaker: "旁白", text: "后面有人拍我的肩：数吧。数着，他们才在。" },
          { id: "l117", type: "line", speaker: "旁白", text: "我接着数。十八。十九。" },
          { id: "l118", type: "line", speaker: "旁白", text: "第二十个光点上去的时候，桥头烧起来了。" },
          { id: "l119", type: "line", speaker: "旁白", text: "第二十一个。第二十二个。" },
          { id: "l015", type: "line", speaker: "旁白", text: "桥板一块一块铺上去的时候，铁索在抖。" },
          { id: "l016", type: "line", speaker: "旁白", text: "铺桥的人趴着往前挪，脚后跟勾住铁索，手里递板子。" },
          { id: "l120", type: "line", speaker: "旁白", text: "板子不够。铺桥的人把门板、床板都往上铺。" },
          { id: "l121", type: "line", speaker: "旁白", text: "有一块板刚铺上，就被子弹打翻，掉进河里。" },
          { id: "l122", type: "line", speaker: "旁白", text: "没人去捞。后面的人递上下一块。" },
          { id: "l123", type: "line", speaker: "旁白", text: "火沿着桥板烧过来。有人把浸了水的被子扑上去。" },
          { id: "l017", type: "line", speaker: "旁白", text: "我跟着队伍过桥。" },
          { id: "l018", type: "line", speaker: "旁白", text: "走到中间，看见桥板上有一道划痕，像谁用指甲刻的。" },
          {
            id: "l018a",
            type: "line",
            speaker: "旁白",
            text: "飞毛腿在桥头搬板子。他一次抱三块，跑得比谁都快。"
          },
          {
            id: "l018b",
            type: "line",
            speaker: "旁白",
            text: "他第四次跑回来的时候，肩上扛着三块板。"
          },
          { id: "l124", type: "line", speaker: "旁白", text: "他把板子往桥面上一扔，蹲下去，手撑着膝盖。" },
          { id: "l125", type: "line", speaker: "旁白", text: "我想去扶他。他摆摆手。" },
          { id: "l126", type: "line", speaker: "飞毛腿", text: "板子不够。再去搬。" },
          { id: "l127", type: "line", speaker: "旁白", text: "他站起来，走了两步，又蹲下去。这一次，没站起来。" },
          {
            id: "l018c",
            type: "line",
            speaker: "旁白",
            text: "我跑过去。他背上湿了一片，分不清是汗还是别的。"
          },
          { id: "l018d", type: "line", speaker: "飞毛腿", text: "别管我。板子不够。" },
          {
            id: "l018e",
            type: "line",
            speaker: "旁白",
            text: "他手里还抓着一块板，指节发白。"
          },
          {
            id: "l019",
            type: "choice",
            when: "item.door",
            prompt: "桥板不够。飞毛腿趴在桥头，背上在淌血。你背上有一块门板。",
            record: "choice.luding.door",
            timeout: 12,
            defaultOption: "C",
            status: { "quality.feimao": 1 },
            statusReason: "飞毛腿倒在桥头，背上在淌血",
            options: [
              {
                key: "A",
                text: "把门板铺上桥面",
                value: true,
                statusReason: "你把门板铺上了桥面",
                set: {
                  "item.door": false,
                  doorOutcome: "bridge",
                  trust: "+1",
                  rescues: "+1",
                  "quality.feimao": 3,
                  "fate.feimao.dead": false,
                  "memory.fly_bridge": true
                },
                cost: "你的门板成了第三块桥板"
              },
              {
                key: "B",
                text: "先给他上药",
                value: false,
                requires: "item.medicine",
                statusReason: "你把药敷在他背上",
                set: {
                  "item.medicine": false,
                  rescues: "+1",
                  "quality.feimao": 2,
                  "fate.feimao.dead": false,
                  "memory.fly_medicine": true
                },
                cost: "药只有一副，你留给了他"
              },
              {
                key: "C",
                text: "抱着门板先过桥",
                value: false,
                statusReason: "你抱着门板先过了桥",
                set: {
                  "fate.feimao.dead": true,
                  "memory.fly_leave": true
                },
                cost: "你过去了。他没有。"
              }
            ]
          },
          {
            id: "l019x",
            type: "choice",
            // 选“铺桥”会把 item.door 置 false；若只看 item.door，l019x 会在同一回合重新出现。
            when: "!item.door && !choice.luding.door",
            prompt: "桥板不够。飞毛腿趴在桥头，背上在淌血。你背上没有门板。",
            record: "choice.luding.door",
            timeout: 12,
            defaultOption: "B",
            status: { "quality.feimao": 1 },
            statusReason: "飞毛腿倒在桥头，背上在淌血",
            options: [
              {
                key: "A",
                text: "把药敷在他背上",
                value: false,
                requires: "item.medicine",
                statusReason: "你把药敷在他背上",
                set: {
                  "item.medicine": false,
                  rescues: "+1",
                  "quality.feimao": 2,
                  "fate.feimao.dead": false,
                  "memory.fly_medicine": true
                },
                cost: "药只有一副，你留给了他"
              },
              {
                key: "B",
                text: "继续走",
                value: false,
                statusReason: "你继续往前走",
                set: {
                  "fate.feimao.dead": true,
                  "memory.fly_leave": true
                },
                cost: "你没有停。"
              }
            ]
          },
          {
            id: "l019a",
            type: "line",
            speaker: "旁白",
            text: "桥面多了一块板。我踩过去的时候，脚底下响了一声。",
            when: "choice.luding.door"
          },
          { id: "l128", type: "line", speaker: "旁白", text: "飞毛腿看着那块板，看了很久。", when: "choice.luding.door" },
          { id: "l129", type: "line", speaker: "飞毛腿", text: "你家的门？", when: "choice.luding.door" },
          { id: "l130", type: "line", speaker: "满崽", text: "嗯。", when: "choice.luding.door" },
          { id: "l131", type: "line", speaker: "飞毛腿", text: "我踩了。", when: "choice.luding.door" },
          { id: "l132", type: "line", speaker: "满崽", text: "踩吧。它现在是桥。", when: "choice.luding.door" },
          {
            id: "l019b",
            type: "line",
            speaker: "旁白",
            text: "门板压在背上，三十斤。我走一步，后面的人就等一步。",
            when: "item.door"
          },
          {
            id: "l020",
            type: "line",
            speaker: "旁白",
            text: "我背上没有门板。过桥的时候，手只能抓住铁索。",
            when: "!item.door && !choice.luding.door"
          },
          {
            id: "l019c",
            type: "line",
            speaker: "旁白",
            text: "我把药敷在他背上。他咬住号嘴，没出声。",
            when: "memory.fly_medicine"
          },
          { id: "l019e", type: "line", speaker: "飞毛腿", text: "你叫什么？", when: "memory.fly_medicine" },
          { id: "l019f", type: "line", speaker: "满崽", text: "满崽。", when: "memory.fly_medicine" },
          { id: "l019g", type: "line", speaker: "飞毛腿", text: "满崽。我记住了。", when: "memory.fly_medicine" },
          { id: "l021", type: "line", speaker: "旁白", text: "过桥以后，我回头看那十三根铁索。它们空着，还在晃。", bg: "luding_after" },
          { id: "l133", type: "line", speaker: "旁白", text: "桥那头的工事里没有人了。" },
          { id: "l134", type: "line", speaker: "旁白", text: "有一口锅，锅里的饭还是温的。" },
          { id: "l135", type: "line", speaker: "旁白", text: "他们跑得比我们想的快。" },
          {
            id: "l021a",
            type: "line",
            speaker: "旁白",
            text: "有一块板，是我家的门。",
            when: "choice.luding.door"
          },
          {
            id: "l021b",
            type: "line",
            speaker: "旁白",
            text: "门板还在背上。过了桥，它比我先磕在石头上。",
            when: "item.door"
          },
          {
            id: "l021c",
            type: "line",
            speaker: "旁白",
            text: "背上空着。我一直没背门板，过桥时两只手都给了铁索。",
            when: "!item.door && !choice.luding.door"
          },
          {
            id: "l019d",
            type: "line",
            speaker: "旁白",
            text: "我过了桥。回头的时候，桥那头已经没有人。",
            when: "fate.feimao.dead"
          },
          {
            id: "l022a",
            type: "line",
            speaker: "旁白",
            text: "飞毛腿过来了。他扶着桥头的石桩，站了一会儿，才把气喘匀。",
            when: "!fate.feimao.dead"
          },
          { id: "l022b", type: "line", speaker: "飞毛腿", text: "二十二个，都过去了？", when: "!fate.feimao.dead" },
          { id: "l022c", type: "line", speaker: "满崽", text: "我数到二十二个光点。", when: "!fate.feimao.dead" },
          { id: "l136", type: "line", speaker: "旁白", text: "他等着我说下去。我没有说。", when: "!fate.feimao.dead" },
          { id: "l022d", type: "line", speaker: "旁白", text: "他闭上眼，过了一会，说：那行。", when: "!fate.feimao.dead" },
          { id: "l137", type: "line", speaker: "灶王", text: "过来。锅里有水。", when: "!fate.feimao.dead" },
          { id: "l138", type: "line", speaker: "飞毛腿", text: "我不渴。", when: "!fate.feimao.dead" },
          { id: "l139", type: "line", speaker: "灶王", text: "不渴也喝。", when: "!fate.feimao.dead" },
          { id: "l140", type: "line", speaker: "旁白", text: "他从帽子里摸出那张纸，递给我。", when: "!fate.feimao.dead" },
          { id: "l141", type: "line", speaker: "飞毛腿", text: "你念。对着这个念。", when: "!fate.feimao.dead" },
          { id: "l142", type: "line", speaker: "旁白", text: "我念了。他把纸折好，又塞回帽子里。", when: "!fate.feimao.dead" },
          {
            id: "l022e",
            type: "line",
            speaker: "旁白",
            text: "我把名册翻到第三页，念了他的名字。他听着，没睁眼。",
            when: "!fate.feimao.dead"
          },
          { id: "l022", type: "line", speaker: "旁白", text: "飞毛腿没过来。他的号挂在桥头的木桩上，还热着。", when: "fate.feimao.dead" },
          { id: "l143", type: "line", speaker: "旁白", text: "他的帽子落在桥板上。我捡起来，里头有一张纸。", when: "fate.feimao.dead" },
          { id: "l144", type: "line", speaker: "旁白", text: "纸上三个字，是林先生写的。比我写得正。", when: "fate.feimao.dead" },
          { id: "l145", type: "line", speaker: "旁白", text: "我把纸展开，照着抄进名册第三页。", when: "fate.feimao.dead" },
          { id: "l146", type: "line", speaker: "旁白", text: "抄完，我才发现，我一直在屏着气。", when: "fate.feimao.dead" },
          { id: "l023", type: "line", speaker: "旁白", text: "我把号取下来，塞进背包。号嘴上有牙印，他咬的。", when: "fate.feimao.dead" },
          { id: "l024", type: "line", speaker: "冬生", text: "号给我。", when: "fate.feimao.dead" },
          { id: "l024a", type: "line", speaker: "旁白", text: "冬生把水壶递给他。他喝了一口，又吐出来，说水太凉。", when: "!fate.feimao.dead" },
          { id: "l147", type: "line", speaker: "冬生", text: "你的号，我擦过了。", when: "!fate.feimao.dead" },
          { id: "l148", type: "line", speaker: "飞毛腿", text: "好。过桥的时候，我听见了。", when: "!fate.feimao.dead" },
          { id: "l025", type: "line", speaker: "满崽", text: "就剩一个了。", when: "fate.feimao.dead" },
          { id: "l026", type: "line", speaker: "冬生", text: "我知道。他吹的时候，我在后面听。", when: "fate.feimao.dead" },
          { id: "l149", type: "line", speaker: "旁白", text: "灶王在桥头支起锅。锅里的水是浑的。" },
          { id: "l150", type: "line", speaker: "灶王", text: "一人一口。喝完再走。" },
          { id: "l151", type: "line", speaker: "旁白", text: "林先生把湿旗子铺在石头上，用石头压住四个角。" },
          { id: "l152", type: "line", speaker: "林先生", text: "满崽，你的手。" },
          { id: "l153", type: "line", speaker: "旁白", text: "我低头，手上全是铁锈。" },
          { id: "l154", type: "line", speaker: "林先生", text: "写完再洗。" },
          { id: "l155", type: "line", speaker: "林先生", text: "名字要写正。写歪了，过几年自己也不认得。" },
          {
            id: "l027",
            type: "choice",
            prompt: "二十二个人，名字不全。",
            record: "choice.luding.names",
            timeout: 12,
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
          {
            id: "l030a",
            type: "line",
            speaker: "旁白",
            text: "脱鞋的时候，鞋底磨穿了一个洞。娘纳的底，磨到了线。",
            when: "item.shoes"
          },
          {
            id: "l030b",
            type: "line",
            speaker: "旁白",
            text: "草鞋后跟散了。我坐在地上，用布条重新绑了一遍。",
            when: "!item.shoes"
          },
          { id: "l031", type: "line", speaker: "旁白", text: "铅笔头短得握不住，我用布条把它绑在手指上。" },
          { id: "l032", type: "line", speaker: "旁白", text: "描的时候，手没抖。" },
          { id: "l033", type: "title", text: "第五章 · 草地", sub: "一九三五年 · 八月", place: "川西北 · 松潘草地", bg: "grass_marsh" },
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
          { id: "g100", type: "line", speaker: "旁白", text: "走进草地第三天，队伍开始有人掉队。" },
          { id: "g101", type: "line", speaker: "旁白", text: "掉队的人不喊。他们蹲下去，像在系鞋带。" },
          { id: "g102", type: "line", speaker: "旁白", text: "后面的人走过去，把他架起来。架不动，就两个人架。" },
          { id: "g004", type: "line", speaker: "旁白", text: "背上的门板这时候是一张床。", when: "item.door" },
          { id: "g005", type: "line", speaker: "旁白", text: "伤员躺上去，比躺在泥里强。", when: "item.door" },
          {
            id: "g004b",
            type: "line",
            speaker: "旁白",
            text: "没有门板。伤员只能躺在草上，草底下是水。",
            when: "!item.door"
          },
          { id: "g006", type: "line", speaker: "旁白", text: "雨下起来没有声音。" },
          { id: "g007", type: "line", speaker: "旁白", text: "落在草上，像有人在远处抖一块布。" },
          {
            id: "g008",
            type: "choice",
            when: "item.barley",
            prompt: "干粮袋里，还剩最后一小袋青稞。",
            record: "choice.grass.share",
            timeout: 20,
            defaultOption: "B",
            options: [
              {
                key: "A",
                text: "倒进伤员的碗里",
                value: true,
                set: {
                  "item.barley": false,
                  trust: "+1",
                  "memory.grass_share": true
                },
                cost: "粮袋空了，腿上却有了点劲"
              },
              {
                key: "B",
                text: "留给自己",
                value: false,
                set: { "memory.grass_keep": true },
                cost: "伤员看着你把青稞吃完"
              }
            ]
          },
          {
            id: "g008a",
            type: "line",
            speaker: "伤员",
            text: "你背上也磨破了。这半卷绷带，拿着。",
            when: "memory.grass_share"
          },
          {
            id: "g008b",
            type: "line",
            speaker: "旁白",
            text: "夜里，几个人把各自省下的药膏刮进一只小铁盒。换完药，盒底只剩一层黑。",
            when: "memory.grass_share",
            status: { condition: "+1" },
            statusOnce: "memory.grass_mutual",
            statusReason: "你与他人互相救助"
          },
          { id: "g103", type: "line", speaker: "旁白", text: "灶王的锅越来越轻。他背起来，走得比谁都快。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g104", type: "line", speaker: "飞毛腿", text: "锅给我。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g105", type: "line", speaker: "灶王", text: "你腿快，留着力气走路。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g106", type: "line", speaker: "飞毛腿", text: "我背锅也走得快。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g107", type: "line", speaker: "旁白", text: "他伸手去抢，灶王把锅往身后一藏。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g108", type: "line", speaker: "灶王", text: "锅在人在。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g109", type: "line", speaker: "旁白", text: "冬生走不动的时候，飞毛腿把他背起来。", when: "!fate.feimao.dead && !fate.dongsheng.dead" },
          { id: "g110", type: "line", speaker: "冬生", text: "放我下来。你背着我，更走不出去。", when: "!fate.feimao.dead && !fate.dongsheng.dead" },
          { id: "g111", type: "line", speaker: "飞毛腿", text: "你少说话，省气。", when: "!fate.feimao.dead && !fate.dongsheng.dead" },
          { id: "g112", type: "line", speaker: "旁白", text: "冬生不说了。过了一会，他在飞毛腿耳边吹了一个音。", when: "!fate.feimao.dead && !fate.dongsheng.dead" },
          { id: "g113", type: "line", speaker: "飞毛腿", text: "别吹。省气。", when: "!fate.feimao.dead && !fate.dongsheng.dead" },
          { id: "g114", type: "line", speaker: "冬生", text: "我给你吹的。", when: "!fate.feimao.dead && !fate.dongsheng.dead" },
          { id: "g115", type: "line", speaker: "旁白", text: "林先生的干粮袋空了。冬生看见她把袋口翻过来，抖了抖。", when: "!fate.dongsheng.dead" },
          { id: "g116", type: "line", speaker: "冬生", text: "先生，你饿不饿？", when: "!fate.dongsheng.dead" },
          { id: "g117", type: "line", speaker: "林先生", text: "不饿。", when: "!fate.dongsheng.dead" },
          { id: "g118", type: "line", speaker: "旁白", text: "她从口袋里摸出半块锅巴，塞给冬生。", when: "!fate.dongsheng.dead" },
          { id: "g119", type: "line", speaker: "林先生", text: "拿着。", when: "!fate.dongsheng.dead" },
          { id: "g120", type: "line", speaker: "冬生", text: "你也没吃。", when: "!fate.dongsheng.dead" },
          { id: "g121", type: "line", speaker: "林先生", text: "我吃过了。", when: "!fate.dongsheng.dead" },
          { id: "g122", type: "line", speaker: "旁白", text: "我肩上的伤又磨开了。林先生看见，把最后一点药膏刮在布上。", when: "!fate.player.dead" },
          { id: "g123", type: "line", speaker: "满崽", text: "先生，药留着。", when: "!fate.player.dead" },
          { id: "g124", type: "line", speaker: "林先生", text: "留着给谁？", when: "!fate.player.dead" },
          { id: "g125", type: "line", speaker: "旁白", text: "她给我抹上。药膏是凉的，抹完，布上还有一点。", when: "!fate.player.dead" },
          { id: "g126", type: "line", speaker: "林先生", text: "剩下的，给冬生。", when: "!fate.player.dead" },
          { id: "g127", type: "line", speaker: "旁白", text: "以前这种路，飞毛腿跑一个来回，还能帮别人背枪。", when: "fate.feimao.dead" },
          { id: "g128", type: "line", speaker: "旁白", text: "现在没有人跑了。队伍走得很静。", when: "fate.feimao.dead" },
          { id: "g129", type: "line", speaker: "旁白", text: "没有锅了。大家喝水的时候，用手捧着。", when: "fate.zaowang.dead" },
          { id: "g130", type: "line", speaker: "旁白", text: "没有号声。天亮的时候，队伍自己醒。", when: "fate.dongsheng.dead" },
          { id: "g009", type: "line", speaker: "旁白", text: "第七天，我们在一条河沟边停下。" },
          { id: "g010", type: "line", speaker: "旁白", text: "前面的人在挖坑。" },
          { id: "g011", type: "line", speaker: "旁白", text: "坑不大，能放七八个人。" },
          { id: "g012", type: "line", speaker: "旁白", text: "挖完，坑边坐着一排人，谁也没说话。" },
          { id: "g013", type: "line", speaker: "旁白", text: "有人问，埋谁。" },
          { id: "g014", type: "line", speaker: "旁白", text: "没人答。" },
          { id: "g015", type: "line", speaker: "旁白", text: "后来大家把各自的干粮袋解下来，放在坑边。" },
          {
            id: "g015a",
            type: "line",
            speaker: "旁白",
            text: "我把青稞倒进锅里。锅底响了一声，像有人在里面敲。",
            when: "item.barley"
          },
          {
            id: "g015b",
            type: "line",
            speaker: "旁白",
            text: "我的干粮袋早就空了，袋底有一层碎末。",
            when: "!item.barley"
          },
          { id: "g131", type: "line", speaker: "旁白", text: "林先生从怀里摸出一截铅笔，在木牌上写字。" },
          { id: "g132", type: "line", speaker: "旁白", text: "木牌是从担架上拆下来的。字写上去，木纹把笔画吃进去。" },
          { id: "g133", type: "line", speaker: "林先生", text: "写谁？" },
          { id: "g134", type: "line", speaker: "旁白", text: "没有人答。她把木牌插在坑边，什么也没写。" },
          { id: "g135", type: "line", speaker: "旁白", text: "灶王从锅底刮下一把黑灰，撒在坑边。", when: "!fate.zaowang.dead" },
          { id: "g136", type: "line", speaker: "旁白", text: "冬生吹了一个短音。吹完，他把号抱在怀里。", when: "!fate.dongsheng.dead" },
          {
            id: "g015c",
            type: "line",
            speaker: "旁白",
            text: "灶王把锅从背上解下来。锅底结着一层黑，他用刺刀刮。"
          },
          {
            id: "g015d",
            type: "line",
            speaker: "旁白",
            text: "刮完，锅底能照见人。他看了一眼，又扣回去。"
          },
          { id: "g015e", type: "line", speaker: "灶王", text: "锅比人脸干净。人脸上有泥。" },
          { id: "g015f", type: "line", speaker: "灶王", text: "文书，我那个“灶”字，你写对没有？" },
          { id: "g015g", type: "line", speaker: "满崽", text: "写对了。" },
          { id: "g015h", type: "line", speaker: "灶王", text: "那就行。锅里没粮了，纸上还有。" },
          { id: "g016", type: "line", speaker: "灶王", text: "最后一锅。喝了再走。" },
          { id: "g137", type: "line", speaker: "旁白", text: "他把最后一点盐撒进锅里。盐罐空了，他在罐底刮了刮。" },
          { id: "g138", type: "line", speaker: "旁白", text: "有人把一块锅巴掰成两半，一半给最小的那个，一半放在锅沿上。" },
          { id: "g139", type: "line", speaker: "灶王", text: "我不吃。你们走。" },
          { id: "g017", type: "line", speaker: "旁白", text: "他蹲下去生火。" },
          { id: "g018", type: "line", speaker: "旁白", text: "柴是湿的，他吹了半天。" },
          {
            id: "g018a",
            type: "line",
            speaker: "旁白",
            text: "他蹲在风口上，把锅盖掀开，又盖上。锅里是水。"
          },
          { id: "g018b", type: "line", speaker: "灶王", text: "水开了，就能走。" },
          {
            id: "g018c",
            type: "line",
            speaker: "旁白",
            text: "火镰打了三下，火星落在湿柴上，灭了。"
          },
          {
            id: "g018d",
            type: "line",
            speaker: "旁白",
            text: "第四下，他咳了一声，手撑在锅沿上，肩膀往下塌。"
          },
          { id: "g018e", type: "line", speaker: "灶王", text: "文书，别管我。锅别倒。" },
          {
            id: "g018x",
            type: "choice",
            prompt: "火生不起来。灶王蹲在风口上，嘴唇发紫。锅里什么都没有。",
            record: "choice.grass.zaowang",
            timeout: 16,
            defaultOption: "C",
            status: { "quality.zaowang": 1 },
            statusReason: "灶王蹲在风口上，手撑不住锅沿",
            options: [
              {
                key: "A",
                text: "把青稞倒进锅里",
                value: "A",
                requires: "item.barley",
                statusReason: "你把青稞倒进锅里",
                set: {
                  "item.barley": false,
                  rescues: "+1",
                  "quality.zaowang": 2,
                  "fate.zaowang.dead": false,
                  "memory.zaowang_barley": true
                },
                cost: "青稞倒进锅里，你和他都少一口"
              },
              {
                key: "B",
                text: "把家里的铁锅架上去",
                value: "B",
                requires: "item.homepot",
                statusReason: "你把家里的铁锅架了上去",
                set: {
                  "item.homepot": false,
                  rescues: "+1",
                  "quality.zaowang": 3,
                  "fate.zaowang.dead": false,
                  "memory.zaowang_pot": true
                },
                cost: "家里的锅，换了这一锅热水"
              },
              {
                key: "C",
                text: "不救了，跟上队伍",
                value: "C",
                statusReason: "你跟上队伍走了",
                set: {
                  "fate.zaowang.dead": true,
                  "memory.zaowang_leave": true
                },
                cost: "火没起来。你走了。"
              }
            ]
          },
          {
            id: "g019",
            type: "line",
            speaker: "旁白",
            text: "火没起来。他就在那儿蹲着，没再站起来。",
            when: "fate.zaowang.dead"
          },
          {
            id: "g019a",
            type: "line",
            speaker: "旁白",
            text: "火起来了。他站起来，膝盖响了一声。",
            when: "!fate.zaowang.dead"
          },
          {
            id: "g019b",
            type: "line",
            speaker: "旁白",
            text: "他把锅背回背上。锅沿磕着肩胛骨，响了一声。",
            when: "!fate.zaowang.dead"
          },
          {
            id: "g019c",
            type: "line",
            speaker: "灶王",
            text: "走。到吴起，我给你们煮一顿干的。",
            when: "!fate.zaowang.dead"
          },
          { id: "g140", type: "line", speaker: "飞毛腿", text: "锅给我。你扶着我的肩。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g141", type: "line", speaker: "灶王", text: "我自己能走。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g142", type: "line", speaker: "飞毛腿", text: "知道。我扶着，你走。", when: "!fate.zaowang.dead && !fate.feimao.dead" },
          {
            id: "g020",
            type: "line",
            speaker: "旁白",
            text: "我把他埋在一个能看见太阳的地方。那天没有太阳。",
            when: "fate.zaowang.dead"
          },
          {
            id: "g020a",
            type: "line",
            speaker: "旁白",
            text: "我把家里的铁锅擦了一遍，又擦一遍，像他擦他那口。",
            when: "fate.zaowang.dead && item.homepot"
          },
          { id: "g143", type: "line", speaker: "旁白", text: "飞毛腿把灶王的锅背起来。锅沿磕着他的肩胛骨。", when: "fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g144", type: "line", speaker: "飞毛腿", text: "我替他背。到了吴起，我给他煮一顿。", when: "fate.zaowang.dead && !fate.feimao.dead" },
          { id: "g145", type: "line", speaker: "旁白", text: "冬生把灶王的锅背起来。锅比他大，走一步，晃一下。", when: "fate.zaowang.dead && fate.feimao.dead && !fate.dongsheng.dead" },
          {
            id: "g021",
            type: "choice",
            when: "fate.zaowang.dead && item.homepot",
            prompt: "灶王的小锅还在火堆边。",
            record: "choice.grass.pot",
            timeout: 16,
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
            id: "g021b",
            type: "line",
            speaker: "旁白",
            text: "我把小锅留在了火堆边。背着它，我也走不出去。",
            when: "fate.zaowang.dead && !item.homepot"
          },
          {
            id: "g022a",
            type: "line",
            speaker: "旁白",
            text: "我把小锅背上。锅沿磕着门板，一路响。",
            when: "fate.zaowang.dead && item.pot"
          },
          {
            id: "g022b",
            type: "line",
            speaker: "旁白",
            text: "我把小锅放在他手边。",
            when: "fate.zaowang.dead && !item.pot"
          },
          {
            id: "g023b",
            type: "line",
            speaker: "旁白",
            text: "走出一段路，我还能看见那口锅在发亮。",
            when: "fate.zaowang.dead && !item.pot"
          },
          { id: "g023c", type: "line", speaker: "旁白", text: "冬生十五。号比他高半头。" },
          {
            id: "g023d",
            type: "line",
            speaker: "旁白",
            text: "他吹号前，先往号嘴里哈一口气。他说，这样声音不哑。"
          },
          { id: "g023e", type: "line", speaker: "冬生", text: "文书，我的名字，你写对没有？" },
          { id: "g023f", type: "line", speaker: "满崽", text: "冬生。冬天的冬，生下来的生。" },
          { id: "g023g", type: "line", speaker: "冬生", text: "对。别写错。到了吴起，我要自己应。" },
          { id: "g024", type: "line", speaker: "冬生", text: "号还吹得动吗？", bg: "grass_dawn" },
          { id: "g025", type: "line", speaker: "旁白", text: "他吹了一个音，气不够，断了。" },
          { id: "g026", type: "line", speaker: "旁白", text: "他把号擦干净，又塞回怀里，像塞回一件怕冷的东西。" },
          { id: "g146", type: "line", speaker: "旁白", text: "他的嘴唇裂了。哈气的时候，裂口上有一点白。" },
          { id: "g147", type: "line", speaker: "旁白", text: "林先生把自己的围巾解下来，围在他脖子上。" },
          { id: "g148", type: "line", speaker: "冬生", text: "先生，你冷。" },
          { id: "g149", type: "line", speaker: "林先生", text: "我不冷。你吹号，嘴不能冻。" },
          {
            id: "g026x",
            type: "choice",
            prompt: "冬生走不动了，坐在泥里，号抱在怀里。",
            record: "choice.grass.dongsheng",
            timeout: 12,
            defaultOption: "C",
            status: { "quality.dongsheng": 1 },
            statusReason: "冬生坐在泥里，走不动了",
            options: [
              {
                key: "A",
                text: "把自己的布鞋脱给他",
                value: "A",
                requires: "item.shoes",
                statusReason: "你把布鞋脱给他",
                set: {
                  "item.shoes": false,
                  rescues: "+1",
                  "quality.dongsheng": 3,
                  "fate.dongsheng.dead": false,
                  "memory.dongsheng_shoes": true,
                  "inventory.giftBarley": true
                },
                cost: "你把鞋脱给他，脚上只剩一层布"
              },
              {
                key: "B",
                text: "把雨布裹在他身上",
                value: "B",
                requires: "item.raincloth",
                statusReason: "你把雨布裹在他身上",
                set: {
                  "item.raincloth": false,
                  rescues: "+1",
                  "quality.dongsheng": 3,
                  "fate.dongsheng.dead": false,
                  "memory.dongsheng_cloth": true,
                  "inventory.giftBarley": true
                },
                cost: "雨布裹着他，雨落在你身上"
              },
              {
                key: "C",
                text: "不救，继续走",
                value: "C",
                statusReason: "你继续往前走",
                set: {
                  "fate.dongsheng.dead": true,
                  "memory.dongsheng_leave": true
                },
                cost: "你走在前头。他没有跟上来。"
              }
            ]
          },
          {
            id: "g026y",
            type: "line",
            speaker: "旁白",
            text: "冬生把一小袋青稞塞给我。他说，这个不占地方。",
            when: "!fate.dongsheng.dead"
          },
          {
            id: "g026h",
            type: "line",
            speaker: "旁白",
            text: "飞毛腿从前面折回来，把我的胳膊架到他肩上。",
            when: "memory.help_door"
          },
          {
            id: "g026i",
            type: "line",
            speaker: "飞毛腿",
            text: "桥都过来了。草地还能把你留下？",
            when: "memory.help_door"
          },
          {
            id: "g026j",
            type: "line",
            speaker: "旁白",
            text: "冬生把号挂在脖子上，空出一只手，托住我的背。",
            when: "memory.help_door"
          },
          {
            id: "g026k",
            type: "line",
            speaker: "旁白",
            text: "灶王没说话。他把锅挪到胸前，腾出的那只手，抓住了我的腰带。",
            when: "memory.help_door"
          },
          {
            id: "g026m",
            type: "line",
            speaker: "旁白",
            text: "三个人把我从泥里架起来。谁也没抱怨。脚步没有停。",
            when: "memory.help_door"
          },
          { id: "g150", type: "line", speaker: "旁白", text: "冬生把号举起来，吹了一个长音。", when: "!fate.dongsheng.dead" },
          { id: "g151", type: "line", speaker: "旁白", text: "这一次，声音没有断。", when: "!fate.dongsheng.dead" },
          { id: "g152", type: "line", speaker: "旁白", text: "林先生蹲下去，抓了一把黑土，用手帕包好。" },
          { id: "g153", type: "line", speaker: "满崽", text: "带这个做什么？" },
          { id: "g154", type: "line", speaker: "林先生", text: "带回去。告诉他们，我们是从这里走出来的。" },
          { id: "g155", type: "line", speaker: "旁白", text: "飞毛腿把帽子按了按。那张纸还在里头。", when: "!fate.feimao.dead" },
          { id: "g156", type: "line", speaker: "旁白", text: "灶王把锅背好。锅底的字贴着背。", when: "!fate.zaowang.dead" },
          { id: "g027", type: "line", speaker: "旁白", text: "走出草地那天，前面有人喊：看见房子了。" },
          { id: "g027a", type: "settle", settle: "grass" },
          {
            id: "g028a",
            type: "line",
            speaker: "旁白",
            text: "冬生没跟上来。他的号在草里，我没找到。",
            when: "fate.dongsheng.dead"
          },
          {
            id: "g028b",
            type: "line",
            speaker: "旁白",
            text: "冬生说，到了吴起，我吹给全连听。",
            when: "!fate.dongsheng.dead"
          },
          {
            id: "g028h",
            type: "line",
            speaker: "旁白",
            text: "我坐下去的时候，飞毛腿先看见的。",
            when: "memory.help && !memory.help_door"
          },
          {
            id: "g028i",
            type: "line",
            speaker: "旁白",
            text: "他架住我的左胳膊。灶王从右边托住。冬生在前面，替我看路。",
            when: "memory.help && !memory.help_door"
          },
          {
            id: "g028j",
            type: "line",
            speaker: "旁白",
            text: "三个人谁也没说话。走出草地那天，我的脚没有沾地。",
            when: "memory.help && !memory.help_door"
          },
          { id: "g028", type: "line", speaker: "旁白", text: "没有人跑。大家只是把脚步放快了一点。" },
          {
            id: "g028d",
            type: "line",
            speaker: "旁白",
            text: "走出草地那天，我走不动了。",
            when: "fate.player.dead"
          },
          {
            id: "g028e",
            type: "line",
            speaker: "旁白",
            text: "我把名册解下来，交给冬生。",
            when: "fate.player.dead"
          },
          {
            id: "g028f",
            type: "line",
            speaker: "旁白",
            text: "我说，别停。",
            when: "fate.player.dead"
          },
          {
            id: "g028g",
            type: "line",
            speaker: "旁白",
            text: "他背起名册，没回头。队伍没有停。",
            when: "fate.player.dead"
          },
          {
            id: "g029",
            type: "title",
            text: "终章 · 吴起",
            sub: "一九三五年 · 十月",
            place: "陕北 · 吴起镇",
            bg: "wuqi_dawn",
            when: "!fate.player.dead"
          },
          { id: "g030", type: "codex", codexId: "grass" },
          { id: "g898", type: "end", next: "badend", when: "fate.badend" },
          { id: "g899", type: "end", next: "coda", when: "fate.seven5" },
          { id: "g900", type: "end", next: "wuqi", when: "!fate.player.dead" }
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
          { id: "w100", type: "line", speaker: "旁白", text: "灶王在镇口支起锅。锅底的“灶”字还在。", when: "!fate.zaowang.dead" },
          { id: "w101", type: "line", speaker: "灶王", text: "到了。我说过，给你们煮一顿干的。", when: "!fate.zaowang.dead" },
          { id: "w102", type: "line", speaker: "旁白", text: "灶王的锅放在镇口。锅底的“灶”字磨掉了一半。", when: "fate.zaowang.dead" },
          { id: "w103", type: "line", speaker: "旁白", text: "飞毛腿把帽子摘下来，从里头摸出那张纸。", when: "!fate.feimao.dead" },
          { id: "w104", type: "line", speaker: "飞毛腿", text: "文书，到了。你再念一遍。", when: "!fate.feimao.dead" },
          { id: "w105", type: "line", speaker: "旁白", text: "我念了他的名字。他跟着念，念得很正。", when: "!fate.feimao.dead" },
          { id: "w106", type: "line", speaker: "旁白", text: "我从名册里拿出那张纸。纸上三个字，是林先生写的。", when: "fate.feimao.dead" },
          { id: "w107", type: "line", speaker: "旁白", text: "我念了一遍。没有人跟着念。", when: "fate.feimao.dead" },
          { id: "w006a", type: "line", speaker: "林先生", text: "满崽，借你的门板用一下。标语写不下，得找块平的。", when: "item.door" },
          { id: "w007a", type: "line", speaker: "满崽", text: "……", when: "item.door" },
          { id: "w008a", type: "line", speaker: "旁白", text: "我把门板解下来，靠在墙上。背面那个“北”字，被雨泡得发白。", when: "item.door" },
          { id: "w009a", type: "line", speaker: "林先生", text: "这字谁写的？", when: "item.door" },
          { id: "w010a", type: "line", speaker: "满崽", text: "我。", when: "item.door" },
          { id: "w011a", type: "line", speaker: "林先生", text: "留着。标语写在正面，字写在背面，正好。", when: "item.door" },
          { id: "w012a", type: "line", speaker: "旁白", text: "她先用粉笔打格子。一个字一格，写一个，退后两步看看，再写下一个。", when: "item.door" },
          { id: "w006b", type: "line", speaker: "旁白", text: "林先生想借门板写标语。我背后空着，她只好找了一面石墙。", when: "!item.door && !fate.lin.dead" },
          { id: "w006c", type: "line", speaker: "旁白", text: "石墙上有一行旧标语，红漆褪成了粉色。是林先生在路上写的。", when: "!item.door && fate.lin.dead" },
          {
            id: "w013",
            type: "choice",
            when: "item.door",
            prompt: "门板靠在墙上。标语还没写。",
            record: "choice.wuqi.door",
            timeout: 20,
            defaultOption: "A",
            options: [
              {
                key: "A",
                text: "把门板留在吴起",
                value: false,
                set: { "item.door": false, doorOutcome: "wuqi", "memory.door": true },
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
            when: "!item.door && !fate.lin.dead"
          },
          {
            id: "w014c",
            type: "line",
            speaker: "旁白",
            text: "我站在墙边。她没有来。",
            when: "!item.door && fate.lin.dead"
          },
          {
            id: "w014d",
            type: "line",
            speaker: "旁白",
            text: "墙角那个“北”字还在。雨冲过，笔画淡了，方向没变。",
            when: "memory.lin_north"
          },
          {
            id: "w014e",
            type: "line",
            speaker: "旁白",
            text: "我找过墙角。我写的名字被新标语盖住了。",
            when: "memory.lin_self"
          },
          { id: "w015a", type: "line", speaker: "旁白", text: "门板还绑在我背上。它比出发时轻，边上被磨圆了。", when: "item.door" },
          { id: "w016a", type: "line", speaker: "旁白", text: "林先生没再要。她找了面石墙，把标语写在了石头上。", when: "item.door" },
          { id: "w017a", type: "line", speaker: "旁白", text: "写完她退后两步看，说：还是门板平。", when: "item.door" },
          { id: "w015b", type: "line", speaker: "旁白", text: "门板留在墙上。红漆的“北”压住铅笔的“北”，压得很正。", when: "!item.door && memory.door" },
          { id: "w016b", type: "line", speaker: "旁白", text: "风把标语吹起一个角。我伸手按平，红漆还没干。", when: "!item.door && memory.door" },
          { id: "w015c", type: "line", speaker: "旁白", text: "标语写在石墙上。红漆压在铅笔字旁边，压得有点歪。", when: "!item.door && !memory.door && !fate.lin.dead" },
          { id: "w016c", type: "line", speaker: "旁白", text: "风把纸角吹起来。我伸手按住，石墙是凉的。", when: "!item.door && !memory.door && !fate.lin.dead" },
          { id: "w015d", type: "line", speaker: "旁白", text: "标语写在石墙上，是林先生走前留下的。红漆被风磨白了。", when: "!item.door && !memory.door && fate.lin.dead" },
          { id: "w016d", type: "line", speaker: "旁白", text: "风把纸角吹起来。石墙是凉的。", when: "!item.door && !memory.door && fate.lin.dead" },
          { id: "w017", type: "line", speaker: "旁白", text: "点名的时候，天刚亮。念到没人应的名字，我替他答。", bg: "wuqi_wall" },
          { id: "w018", type: "line", speaker: "旁白", text: "念到的人答“到”。队伍站成三排，前一排能看见后一排的鞋。" },
          { id: "w019", type: "line", speaker: "旁白", text: "名册翻到第三页。纸已经软了，像一块布。" },
          { id: "w020", type: "line", speaker: "旁白", text: "念到何指导员。他在别的连，那边有人应了一声。" },
          { id: "w021", type: "line", speaker: "旁白", text: "念到细妹。她答“到”，声音比平时高。" },
          { id: "w022", type: "line", speaker: "旁白", text: "念到林先生。她正在收粉笔，回头应了一声。", when: "!fate.lin.dead" },
          { id: "w022a", type: "line", speaker: "旁白", text: "念到林先生。没有人应。她没等到收容队。", when: "fate.lin.dead" },
          { id: "w023", type: "line", speaker: "旁白", text: "念到老周。队伍里没有人应。" },
          { id: "w024", type: "line", speaker: "旁白", text: "念到灶王。没有人应。", when: "fate.zaowang.dead" },
          { id: "w024a", type: "line", speaker: "旁白", text: "念到灶王。他从锅边抬起头，应了一声。", when: "!fate.zaowang.dead" },
          { id: "w025", type: "line", speaker: "旁白", text: "念到飞毛腿。没有人应。", when: "fate.feimao.dead" },
          { id: "w025a", type: "line", speaker: "旁白", text: "念到飞毛腿。他把号举了举。", when: "!fate.feimao.dead" },
          { id: "w119", type: "line", speaker: "旁白", text: "冬生把号抱在怀里。号嘴上有牙印。", when: "fate.feimao.dead && !fate.dongsheng.dead" },
          {
            id: "w026",
            type: "interact",
            mode: "rollcall",
            duration: 45
          },
          { id: "w027a", type: "line", speaker: "旁白", text: "有几个名字，我没有替他们答上来。", when: "memory.rollcall_missed_any" },
          { id: "w027b", type: "line", speaker: "旁白", text: "三个人的名字，我都替他们答了。", when: "!memory.rollcall_missed_any && !fate.all.dead" },
          { id: "w027c", type: "line", speaker: "旁白", text: "四个人的名字，我都替他们答了。", when: "!memory.rollcall_missed_any && fate.all.dead" },
          { id: "w028", type: "line", speaker: "旁白", text: "后来有人告诉我，出发的时候，中央红军八万六千人；到陕北，七千余人。" },
          { id: "w030", type: "line", speaker: "旁白", text: "全连出发一百零四，到吴起十九。", when: "!fate.player.dead" },
          { id: "w031", type: "line", speaker: "旁白", text: "十九个人，站成三排。前排空着的位置，风从那儿过。", when: "!fate.player.dead" },
          { id: "w108", type: "line", speaker: "旁白", text: "灶王把锅端到队伍前。锅里是稠的。", when: "!fate.zaowang.dead" },
          { id: "w109", type: "line", speaker: "灶王", text: "说过的。到了，煮一顿干的。", when: "!fate.zaowang.dead" },
          { id: "w110", type: "line", speaker: "旁白", text: "他先盛了几碗，放在队前。碗边没有坐人。", when: "!fate.zaowang.dead" },
          { id: "w111", type: "line", speaker: "旁白", text: "镇口支着一口借来的锅。锅里是稠的。没有人说是谁煮的。", when: "fate.zaowang.dead" },
          { id: "w032", type: "line", speaker: "旁白", text: "会后，指导员让我把五句话抄在纸上，贴在连部门口。" },
          { id: "w112", type: "line", speaker: "旁白", text: "林先生把五句话念了一遍，让我抄。" },
          { id: "w113", type: "line", speaker: "旁白", text: "她念得很慢，一个字一个字。" },
          { id: "w033", type: "line", speaker: "旁白", text: "我抄了五句。抄完，在最后添了一行小字：以上，都是别人教我的。" },
          { id: "w114", type: "line", speaker: "旁白", text: "散会的时候，冬生吹了一个长音。", when: "!fate.dongsheng.dead" },
          { id: "w115", type: "line", speaker: "旁白", text: "号声从镇口传出去，撞在土崖上，又传回来。", when: "!fate.dongsheng.dead" },
          { id: "w034", type: "line", speaker: "旁白", text: "散了会，我一个人走到镇口。风很大，吹得标语哗哗响。" },
          { id: "w035", type: "line", speaker: "旁白", text: "娘说过，家在人身上。" },
          { id: "w036", type: "line", speaker: "旁白", text: "我把名册翻开。名字有的还在，有的被我划掉了。" },
          { id: "w037", type: "line", speaker: "旁白", text: "划掉的那些，我没有划第二遍。" },
          { id: "w116", type: "line", speaker: "旁白", text: "翻到第四页，陈班长的名字还在。籍贯那两个字，我补得很正。" },
          { id: "w117", type: "line", speaker: "旁白", text: "我摊开手。林先生写的那个“满”字，早就洗掉了。" },
          { id: "w118", type: "line", speaker: "旁白", text: "手心还有一道印，是门板磨的。" },
          { id: "w038", type: "line", speaker: "旁白", text: "最后一页是空的。我本来想写点什么。" },
          { id: "w039", type: "line", speaker: "旁白", text: "想了很久，只写了一个字。" },
          { id: "w040", type: "line", speaker: "旁白", text: "北。" },
          { id: "w041", type: "codex", codexId: "wuqi" },
          { id: "w900", type: "end", next: "ending" }
        ]
      },
      {
        // 隐藏章：只有 7(5)（有门板、救满 3 人、自己死在草地）才从草地走进来。
        id: "coda",
        order: 8,
        title: "终章 · 吴起",
        short: "吴起",
        playable: true,
        hidden: true,
        nodes: [
          { id: "c001", type: "title", text: "终章 · 吴起", sub: "一九三五年 · 十月", place: "陕北 · 吴起镇", bg: "wuqi_dawn" },
          { id: "c002", type: "line", speaker: "旁白", text: "满崽没有到吴起。" },
          { id: "c003", type: "line", speaker: "旁白", text: "到吴起那天，全连十八个人。名册上有十九个名字。" },
          { id: "c004", type: "line", speaker: "冬生", text: "满崽的名字，我替他答。" },
          { id: "c005", type: "line", speaker: "旁白", text: "指导员翻开名册，纸边全是毛的。" },
          { id: "c005a", type: "line", speaker: "旁白", text: "林先生没有来。她在草地找我们，没等到收容队。" },
          { id: "c100", type: "line", speaker: "旁白", text: "飞毛腿站在队尾。他把帽子摘下来，又戴上。" },
          { id: "c101", type: "line", speaker: "旁白", text: "帽子里那张纸，他没有拿出来。" },
          { id: "c102", type: "line", speaker: "旁白", text: "灶王把锅放在队前。锅里没有水，锅底的“灶”字还在。" },
          {
            id: "c006",
            type: "interact",
            mode: "rollcall",
            duration: 45,
            coda: true
          },
          { id: "c007", type: "line", speaker: "旁白", text: "念到满崽。冬生答：“到。”" },
          { id: "c008", type: "line", speaker: "旁白", text: "念完，冬生翻到最后一页。" },
          { id: "c009", type: "line", speaker: "旁白", text: "他添上满崽，又划掉。笔画很轻。像怕吵醒谁。" },
          { id: "c103", type: "line", speaker: "旁白", text: "冬生把名册合上。他的手在封皮上按了一会儿。" },
          { id: "c104", type: "line", speaker: "旁白", text: "飞毛腿站在他旁边，没有催他。" },
          { id: "c010", type: "codex", codexId: "wuqi" },
          { id: "c011", type: "line", speaker: "旁白", text: "名册上多了一个名字，又划掉了。" },
          { id: "c012", type: "end", next: "ending" }
        ]
      },
      {
        // 坏结局：叙事结算，不重开、不进地图；无名册，结局页 names 为空。
        id: "badend",
        order: 9,
        title: "草地尽头",
        short: "草地",
        playable: true,
        hidden: true,
        nodes: [
          { id: "b001", type: "title", text: "草地尽头", sub: "一九三五年 · 八月", place: "松潘草地", bg: "grass_marsh" },
          { id: "b002", type: "line", speaker: "旁白", text: "我没有走出草地。" },
          { id: "b003", type: "line", speaker: "旁白", text: "名册留在了冬生那里。" },
          { id: "b004", type: "line", speaker: "旁白", text: "后来，连队到了吴起。十八个人。" },
          { id: "b005", type: "line", speaker: "旁白", text: "林先生没有等到收容队。" },
          { id: "b100", type: "line", speaker: "旁白", text: "锅和号，都留在了草地上。", when: "fate.zaowang.dead && fate.dongsheng.dead" },
          { id: "b101", type: "line", speaker: "旁白", text: "名册上的名字，停在我划到的那一页。" },
          { id: "b006", type: "end", next: "ending" }
        ]
      }
    ],
    // 结局文案源：五卡只存亮/灰两句，亮哪张由引擎按旗标算，不在这里写条件。
    ending: {
      title: "向北",
      date: "一九三五年 · 十月",
      lede: "一块门板，两万五千里。",
      disclaimer: "本作人物与连队均为虚构，非史料人物；史实以《史实注》与《史实出处表》为准。",
      kongyeSacrificeLine: "你把自己，留在了草地尽头。",
      // v1.4：带板 5 条 + 无板 5 条 + 坏结局；历史终点不变，路线只改人物命运与门板去向。
      routes: {
        door_excellent: {
          title: "门板",
          lede: "门板到了吴起。你也是。"
        },
        door_grass_one: {
          title: "门板",
          lede: "门板留在了草地。你到了吴起。",
          bridgeTitle: "桥板",
          bridgeLede: "门板留在了桥上。你到了吴起。"
        },
        door_carry_two: {
          title: "门板",
          lede: "门板到了吴起。你也是。"
        },
        door_grass_many: {
          title: "门板",
          lede: "门板留在了草地。你到了吴起。",
          bridgeTitle: "桥板",
          bridgeLede: "门板留在了桥上。你到了吴起。"
        },
        door_others: {
          title: "空页",
          lede: "名册上多了一个名字，又划掉了。"
        },
        no_door_zero: {
          title: "空手",
          lede: "你空着手，走到了吴起。"
        },
        no_door_one: {
          title: "空手",
          lede: "你空着手，走到了吴起。"
        },
        no_door_two: {
          title: "空手",
          lede: "你空着手，走到了吴起。"
        },
        no_door_three: {
          title: "空手",
          lede: "你空着手，走到了吴起。"
        },
        no_door_three_excellent: {
          title: "空手",
          lede: "你空着手，走到了吴起。"
        },
        bad_end: {
          title: "没有走出草地",
          lede: "草地没有尽头。"
        }
      },
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
    // v1.5：只读分支回看数据。选项文字不在这里复制，回看时从原节点按 key 读取。
    branchMap: {
      chapters: {
        prologue: {
          intro: "于都河起雾。你从自家门上锯下一块门板，也把全连的名字抄了一遍。",
          image: "./assets/backgrounds/thumbs/codex_yudu.jpg",
          decisions: ["p021", "p024", "p037"]
        },
        xiangjiang: {
          intro: "湘江边，六样东西只能带三样。桥头的人往后挤，老周还在那边。",
          image: "./assets/backgrounds/thumbs/codex_xiangjiang.jpg",
          decisions: ["x015", "x025"]
        },
        zunyi: {
          intro: "遵义会议后，错误卡传到你手里。三次追问，一次粉笔。",
          image: "./assets/backgrounds/thumbs/codex_zunyi.jpg",
          decisions: ["z019", "z022", "z025", "z028e"]
        },
        jinsha: {
          intro: "金沙江只有六条小船。三十七个船工，名字比船重。",
          image: "./assets/backgrounds/thumbs/codex_jinsha.jpg",
          decisions: ["j018", "j024"]
        },
        luding: {
          intro: "泸定桥只剩十三根铁索。飞毛腿趴在桥头，你背上有一块门板，或者没有。",
          image: "./assets/backgrounds/thumbs/codex_luding.jpg",
          decisions: ["l019", "l027"]
        },
        grass: {
          intro: "草地没有路。青稞、铁锅、布鞋、雨布，每一样都只能救一个人。",
          image: "./assets/backgrounds/thumbs/codex_grass.jpg",
          decisions: ["g008", "g018x", "g021", "g026x"]
        },
        wuqi: {
          intro: "吴起镇。门板可以留下写标语，名册要翻开点名。",
          image: "./assets/backgrounds/thumbs/codex_wuqi.jpg",
          decisions: ["w013", "w026"]
        }
      },
      decisions: {
        p021: {
          title: "门板",
          nodes: ["p021"],
          context: "娘把锯子搁下，等你说。门板是家里最后一扇整门，也是行囊里最重的一件。",
          options: {
            A: "你带上了门板。行囊只剩两格，多背三十斤；往后每过一次险，你都要先替这块板子找一条路。",
            B: "你把门板留在家里。行囊轻了，终章没有门板可放，娘的手停在半空。"
          }
        },
        p024: {
          title: "行囊",
          nodes: ["p024"],
          context: "四格行囊、八个半格。娘把五样东西摆在桌上；带门板，占两格。",
          multi: true,
          options: {
            medicine: "药在泸定给飞毛腿上药时，还能从油纸里拿出来。",
            barley: "青稞能在草地分给伤员，也能在灶王的风口上换一锅热的。",
            homepot: "家里的铁锅能架火；灶王的小锅留在火堆边时，你也还有一口锅。",
            raincloth: "雨布能在草地裹住冬生，替他挡一夜雨。",
            shoes: "布鞋能在草地脱给冬生，让他走完最后一段。"
          }
        },
        p037: {
          title: "回头",
          nodes: ["p037"],
          context: "桥头的人往前挤。前面就是浮桥，家在后头。",
          options: {
            A: "你回头看了一眼。落后几步，第一班船没赶上；家里的灯留在身后，你记住了它的位置。",
            B: "你没有回头。你没看见家里那盏灯，脚步没有停。"
          }
        },
        x015: {
          title: "弃物",
          nodes: ["x015"],
          context: "六样东西摆成一排，船只能再装三样。定了就不许回头拿。",
          multi: true,
          options: {
            xray: "X 光机过了江。它沉，要四个人抬，往后的路更慢。",
            press: "印刷机过了江。铁架子拆不开，抬它的人少了一个。",
            files: "两捆文件过了江。纸保住了，背纸的人累得说不出话。",
            medkit: "药箱过了江。泸定桥头有人流血时，你手里还有药。",
            radio: "电台过了江。天线用油布裹着，往后的命令还能传出去。",
            silver: "一箱银元过了江。沉，但能换粮、换船、换一夜火。"
          }
        },
        x025: {
          title: "桥头",
          nodes: ["x025a", "x025b"],
          context: "桥头的人往后挤，老周还在那边。你背上有一块门板，或者没有。",
          options: {
            A: "你回头接应老周。你晚过江一个时辰；青稞袋或绑腿留在了路上，老周回来了。",
            B: "你按命令先过江。桥头最后一面，你看见的是他的背影。",
            C: "你把门板横在桥头挡了一下。后面的人多了一点时间，老周回来了；门板留在了浮桥上，你从此没有那块板。"
          }
        },
        z019: {
          title: "错误卡 · 一",
          nodes: ["z019"],
          context: "这一路，哪一步走错了。错误卡传到你手里。",
          options: {
            A: "你承认东西带得太多。第一次把错误写在自己那一行。",
            B: "你没有承认，只说都是敌人逼的。错误卡上，你自己的那条空着。"
          }
        },
        z022: {
          title: "错误卡 · 二",
          nodes: ["z022"],
          context: "轮到你了。会议室里没有人替你开口。",
          options: {
            A: "你承认湘江那条路走错了。会议室里安静了一下。",
            B: "你没有承认，说命令没错。你没在错误卡上写下自己的那一行。"
          }
        },
        z025: {
          title: "错误卡 · 三",
          nodes: ["z025"],
          context: "名册，全吗？这个问题比前面的都短。",
          options: {
            A: "你承认漏记过名字。名册上的空白，第一次被你自己的话点出来。",
            B: "你没有承认，说名册是全的。你记得的空白，没有写进错误卡。"
          }
        },
        z028e: {
          title: "粉笔",
          nodes: ["z028e"],
          context: "林先生递给你一截粉笔：写一个。墙上留着一块空。",
          options: {
            A: "你写下“向北”。后来在吴起，墙角那个字还在，雨冲淡了，方向没变。",
            B: "你写下自己的名字。后来新标语盖住了它，你找过墙角。"
          }
        },
        j018: {
          title: "记名",
          nodes: ["j018"],
          kind: "event",
          context: "金沙江边，三十七个船工。张老幺蹲在船头，手背上全是裂口。",
          doneText: "你抄下了张老幺的名字。名字写在名册的边角上，墨还没干。",
          skipText: "你蹲了半夜，一个字没写。第二天开船，你连他姓什么都想不起来了。",
          futureText: "尚未走到金沙江边。"
        },
        j024: {
          title: "先渡谁",
          nodes: ["j024"],
          context: "最后一批上船前，何指导员问：先渡谁？",
          options: {
            A: "你先渡主力。骡子和后勤多等一天，队伍按命令先过江。",
            B: "你先渡伤员。伤员先上船，主力在渡口多暴露一天。",
            C: "你先渡炊事班。锅和米先过江，伤员在岸上多躺一天。"
          }
        },
        l019: {
          title: "泸定桥",
          nodes: ["l019", "l019x"],
          context: "桥板不够。飞毛腿趴在桥头，背上在淌血。你背上有一块门板，或者没有。",
          optionKeys: {
            l019: { A: "bridge", B: "medicine", C: "leave" },
            l019x: { A: "medicine", B: "leave" }
          },
          options: {
            bridge: "你把门板铺上桥面。桥板够了，飞毛腿活了下来；门板留在了桥上，你从此没有那块板。",
            medicine: "你先给飞毛腿上药。药少了一包，飞毛腿活了下来；桥面还是缺板。",
            leave: "你抱着门板，或者空着手，先过了桥。飞毛腿留在桥头，没能过来。"
          }
        },
        l027: {
          title: "二十二",
          nodes: ["l027"],
          context: "二十二个人，名字不全。名册翻到新的一页。",
          options: {
            A: "你记下数字，不写名字。名册上多一行“泸定，二十二”，没有名字。",
            B: "你留了一整页空白，等名字。那一页一直空着，页脚写着“名字待查”。"
          }
        },
        g008: {
          title: "分粮",
          nodes: ["g008"],
          context: "干粮袋里，还剩最后一小袋青稞。伤员在担架上看着你。",
          skipText: "干粮袋里没有青稞，分粮没有发生。",
          options: {
            A: "你把最后一小袋青稞倒进伤员的碗里。草地少了一口粮，多一个人撑到天亮。",
            B: "你把青稞留给自己。你走得更稳，伤员没有再添一口热汤。"
          }
        },
        g018x: {
          title: "灶王",
          nodes: ["g018x"],
          context: "火生不起来。灶王蹲在风口上，嘴唇发紫。锅里什么都没有。",
          options: {
            A: "你把青稞倒进锅里。灶王喝上热的，活了下来；青稞袋空了。",
            B: "你把家里的铁锅架上去。锅底烧热，灶王活了下来；铁锅留在了草地上。",
            C: "你没有救。灶王留在风口，没能再站起来。"
          }
        },
        g021: {
          title: "小锅",
          nodes: ["g021"],
          context: "灶王的小锅还在火堆边。他的位置空了。",
          skipText: "灶王没有死，或你手里没有那口铁锅；小锅没有留在火堆边。",
          options: {
            A: "你背走灶王的小锅。锅沿磕着门板，一路响；你多背了一件东西。",
            B: "你把小锅留在他手边。到了陕北，你没有锅。"
          }
        },
        g026x: {
          title: "冬生",
          nodes: ["g026x"],
          context: "冬生走不动了，坐在泥里，号抱在怀里。你脚上还有一双布鞋，包里还有一块雨布。",
          options: {
            A: "你把布鞋脱给冬生。冬生走完最后一段；你的脚磨破了。",
            B: "你把雨布裹在冬生身上。他撑过那一夜；雨布留在了草地。",
            C: "你没有救。冬生坐在泥里，没能再站起来。"
          }
        },
        w013: {
          title: "门板与标语",
          nodes: ["w013"],
          context: "门板靠在墙上。标语还没写。林先生等你开口。",
          options: {
            A: "你把门板留在吴起。标语写在正面，那个“北”字留在背面；你从此没有那块板。",
            B: "你把门板带回于都。回家的路还很长，门板还得再背一程。"
          }
        },
        w026: {
          title: "点名",
          nodes: ["w026", "c006"],
          kind: "event",
          context: "吴起镇。名册翻开，从第一个名字念到最后一个。",
          doneText: "名册翻开了。点到的人应到，没应的人被划掉；你记住了谁走到了这里。",
          skipText: "没有走到吴起。名册没有翻开，点名没有发生。",
          futureText: "尚未走到吴起点名。"
        }
      },
      endings: {
        door_excellent: { hint: "门板到了最后，队伍也到了。" },
        door_grass_one: { hint: "有一块木板，留在了半路。" },
        door_carry_two: { hint: "门板到了吴起，你也到了；不是每个人都到了。" },
        door_grass_many: { hint: "门板留在了草地，名字留在了名册上。" },
        door_others: { hint: "有人替你走完了最后一段。" },
        no_door_zero: { hint: "你空着手，走到了吴起。" },
        no_door_one: { hint: "空着手，也救下了一个人。" },
        no_door_two: { hint: "空着手，救下了两个人。" },
        no_door_three: { hint: "空着手，救下了三个人；你还在。" },
        no_door_three_excellent: { hint: "空着手，救下了三个人；你也还站得住。" },
        bad_end: { hint: "草地没有尽头，名册没有翻到吴起。" }
      }
    },
    // v1.5.1 成就：48 条 = 17 个选择组 46 条 + 记名 done/skip 2 条。
    // 只存 id/章/决策组/key/词条；描述生成时从原节点与 branchMap 读取，不复制正文。
    achievements: [
      { id: "p021-A", chapter: "prologue", decision: "p021", key: "A", title: "门板在背" },
      { id: "p021-B", chapter: "prologue", decision: "p021", key: "B", title: "空手出门" },
      { id: "p024-medicine", chapter: "prologue", decision: "p024", key: "medicine", title: "一包药" },
      { id: "p024-barley", chapter: "prologue", decision: "p024", key: "barley", title: "一小袋青稞" },
      { id: "p024-homepot", chapter: "prologue", decision: "p024", key: "homepot", title: "家里的锅" },
      { id: "p024-raincloth", chapter: "prologue", decision: "p024", key: "raincloth", title: "一块雨布" },
      { id: "p024-shoes", chapter: "prologue", decision: "p024", key: "shoes", title: "一双布鞋" },
      { id: "p037-A", chapter: "prologue", decision: "p037", key: "A", title: "回头一眼" },
      { id: "p037-B", chapter: "prologue", decision: "p037", key: "B", title: "没有回头" },
      { id: "x015-xray", chapter: "xiangjiang", decision: "x015", key: "xray", title: "机器过江" },
      { id: "x015-press", chapter: "xiangjiang", decision: "x015", key: "press", title: "铁架过江" },
      { id: "x015-files", chapter: "xiangjiang", decision: "x015", key: "files", title: "纸过了江" },
      { id: "x015-medkit", chapter: "xiangjiang", decision: "x015", key: "medkit", title: "药箱过江" },
      { id: "x015-radio", chapter: "xiangjiang", decision: "x015", key: "radio", title: "天线过江" },
      { id: "x015-silver", chapter: "xiangjiang", decision: "x015", key: "silver", title: "银元过江" },
      { id: "x025-A", chapter: "xiangjiang", decision: "x025", key: "A", title: "回头接老周" },
      { id: "x025-B", chapter: "xiangjiang", decision: "x025", key: "B", title: "按命令过江" },
      { id: "x025-C", chapter: "xiangjiang", decision: "x025", key: "C", title: "门板横桥头" },
      { id: "z019-A", chapter: "zunyi", decision: "z019", key: "A", title: "认下第一笔" },
      { id: "z019-B", chapter: "zunyi", decision: "z019", key: "B", title: "这行空着" },
      { id: "z022-A", chapter: "zunyi", decision: "z022", key: "A", title: "认下湘江" },
      { id: "z022-B", chapter: "zunyi", decision: "z022", key: "B", title: "命令没错" },
      { id: "z025-A", chapter: "zunyi", decision: "z025", key: "A", title: "补上那页" },
      { id: "z025-B", chapter: "zunyi", decision: "z025", key: "B", title: "名册是全的" },
      { id: "z028e-A", chapter: "zunyi", decision: "z028e", key: "A", title: "写下向北" },
      { id: "z028e-B", chapter: "zunyi", decision: "z028e", key: "B", title: "写下自己" },
      { id: "j018-done", chapter: "jinsha", decision: "j018", kind: "interact", outcome: "done", title: "记下名字" },
      { id: "j018-skip", chapter: "jinsha", decision: "j018", kind: "interact", outcome: "skip", title: "没有动笔" },
      { id: "j024-A", chapter: "jinsha", decision: "j024", key: "A", title: "主力先过" },
      { id: "j024-B", chapter: "jinsha", decision: "j024", key: "B", title: "伤员先过" },
      { id: "j024-C", chapter: "jinsha", decision: "j024", key: "C", title: "炊事班先过" },
      { id: "l019-bridge", chapter: "luding", decision: "l019", key: "bridge", title: "门板铺桥" },
      { id: "l019-medicine", chapter: "luding", decision: "l019", key: "medicine", title: "先上药" },
      { id: "l019-leave", chapter: "luding", decision: "l019", key: "leave", title: "先过桥" },
      { id: "l027-A", chapter: "luding", decision: "l027", key: "A", title: "记数不记名" },
      { id: "l027-B", chapter: "luding", decision: "l027", key: "B", title: "留一页空白" },
      { id: "g008-A", chapter: "grass", decision: "g008", key: "A", title: "倒进伤员碗" },
      { id: "g008-B", chapter: "grass", decision: "g008", key: "B", title: "留给自己" },
      { id: "g018x-A", chapter: "grass", decision: "g018x", key: "A", title: "青稞下锅" },
      { id: "g018x-B", chapter: "grass", decision: "g018x", key: "B", title: "铁锅架火" },
      { id: "g018x-C", chapter: "grass", decision: "g018x", key: "C", title: "留在风口" },
      { id: "g021-A", chapter: "grass", decision: "g021", key: "A", title: "背走小锅" },
      { id: "g021-B", chapter: "grass", decision: "g021", key: "B", title: "小锅留下" },
      { id: "g026x-A", chapter: "grass", decision: "g026x", key: "A", title: "脱下布鞋" },
      { id: "g026x-B", chapter: "grass", decision: "g026x", key: "B", title: "雨布裹他" },
      { id: "g026x-C", chapter: "grass", decision: "g026x", key: "C", title: "没能带走" },
      { id: "w013-A", chapter: "wuqi", decision: "w013", key: "A", title: "门板留吴起" },
      { id: "w013-B", chapter: "wuqi", decision: "w013", key: "B", title: "带回于都" }
    ],
    // 七张史实注：正文与 docs/codex.md 逐字一致；真实人物只在这里出现，不进剧情对白。
    codex: [
      {
        id: "yudu",
        title: "于都 · 长征第一渡",
        image: "./assets/backgrounds/plate_yudu.jpg",
        imageNote: "于都河照片摄于2011年，非1934年渡口现场。",
        type: "史实 ＋ 有不同说法",
        body:
          "1934年10月17日至21日拂晓，中央红军主力从于都出发，渡过于都河。河宽六百余米，最深处约二十米。五天里，五座浮桥在黄昏架上、天亮前拆掉，先后架设、拆除十五次。桥板是老百姓送来的门板、床板和寿材。渡口数量有不同说法：一说八个主要渡口，一说十个。",
        source: "求是网《听总书记讲党史故事丨“长征第一渡”》（2021-08-23）；中国军网《于都夜渡 远征启航》。",
        note: "渡口数量有不同说法：一说八个主要渡口，一说十个。"
      },
      {
        id: "xiangjiang",
        title: "湘江 · 最惨烈的一战",
        image: "./assets/backgrounds/plate_xiangjiang_map.jpg",
        imageNote: "图为1934年红军在抢渡湘江前绘制的地图照片；非战役现场，渡口无同时期照片。",
        type: "史实 ＋ 有不同说法",
        body:
          "1934年11月底至12月初，中央红军在湘江两岸与国民党军激战七昼夜。出发时的八万六千余人，渡过湘江后锐减至三万余人。红五军团第三十四师奉命断后，掩护主力渡江，与十几倍于己的敌人鏖战四天五夜，几乎全部牺牲。师长陈树湘负伤被俘，在押送途中牺牲。过江的队伍里还抬着几只三百斤重的木箱，有人说里头是一台 X 光机；究竟有没有、何时丢下，有不同说法。",
        source: "人民网·中国共产党新闻网《湘江战役：中央红军长征的悲壮史诗》；《震古烁今的伟大远征》。",
        note: "木箱里是不是 X 光机、什么时候丢下，有不同说法。"
      },
      {
        id: "zunyi",
        title: "遵义 · 生死攸关的转折点",
        image: "./assets/backgrounds/plate_zunyi_hall.jpg",
        imageNote: "遵义会议会址照片摄于2005年，非1935年会议现场。",
        type: "史实",
        body:
          "1935年1月15日至17日，中共中央政治局扩大会议在遵义召开，连开三天。会议总结了第五次反“围剿”失败和长征初期的教训，改组了中央领导机构。此时中央红军约三万七千余人，比出发时的八万六千余人少了一大半。会议开在城里，城门外的哨兵照常换岗；对大多数战士来说，那三天只是“驻下来休整”，队伍里的变化是后来才慢慢看出来的。",
        source: "中国军网《遵义会议：中国革命“生死攸关的转折点”》；人民网《中央红军到达陕北后还剩多少兵力》。",
        note: ""
      },
      {
        id: "jinsha",
        title: "金沙江 · 三十七个船工",
        image: "./assets/backgrounds/plate_jinsha.jpg",
        imageNote: "金沙江峡谷为当代照片，非皎平渡渡口现场。",
        type: "史实 ＋ 有不同说法",
        body:
          "1935年5月，中央红军在云南皎平渡渡过金沙江。三十七名船工用六条小船，七天七夜不停摆渡，人歇船不歇，5月9日渡完全军。后来在渡口立起纪念碑，碑上镌着三十七个名字或绰号。船工们立下规矩：排队上船，谁也不能挤。船数有不同说法，一说六条，一说七条。",
        source: "中国军网·解放军报《7天7夜，不停摆渡，金沙江畔纪念碑上的37个名字依然闪光》（2026-10-28）。",
        note: "船数有不同说法：一说六条，一说七条。"
      },
      {
        id: "luding",
        title: "泸定 · 十三根铁索",
        image: "./assets/backgrounds/plate_luding.jpg",
        imageNote: "泸定桥照片摄于1967年，非1935年夺桥现场。",
        type: "史实 ＋ 有不同说法",
        body:
          "1935年5月29日下午四时，红四团二十二名突击队员冒着火力，攀着十三根铁索爬过泸定桥。桥板已被抽去，后续部队边爬边铺桥板。此前，部队一昼夜奔袭二百四十余里。二十二个人里，有人过去了，有人没有。后来的纪念碑上，能查到的名字不全——有一部分人的姓名已经佚散，难以确定；二十二人里牺牲了几人，也有不同说法。",
        source: "中国军网《听涛泸定桥》；《铁索铭记铁血青春》。",
        note: "二十二人里牺牲了几人，有不同说法；纪念碑上的名字不全。"
      },
      {
        id: "grass",
        title: "草地 · 班佑河畔",
        image: "./assets/backgrounds/plate_grass.jpg",
        imageNote: "草地照片为当代黄河第一湾，非松潘草地现场。",
        type: "史实 ＋ 回忆录",
        body:
          "1935年8月，红军进入松潘草地。那里没有道路，到处是黑水和沼泽，走七天才能到班佑。王平在回忆录里写到班佑河畔：他带人回去找掉队的战士，看见他们背靠背坐着，像是睡着了，已经没有气息。近八百人长眠在那里。进草地之前先翻夹金山，垭口海拔四千一百多米，高度有不同说法，本作只写“四千米以上”。草地的减员数字各方记载也不同，本作不写具体数字，只写走过的人。",
        source: "中国军网《草地边缘，近800名红军战士长眠于班佑河畔》（2026-10-04）。",
        note: "夹金山垭口高度、草地减员数字，各方记载有不同说法；本作只写“四千米以上”，不写减员数。"
      },
      {
        id: "wuqi",
        title: "吴起 · 到陕北",
        image: "./assets/backgrounds/plate_wuqi.jpg",
        imageNote: "图为1967年《人民画报》所摄陕北杨家岭，非吴起镇。",
        type: "史实",
        body:
          "1935年10月19日，陕甘支队进入陕西吴起镇，长征到达陕北。从1934年10月到1935年10月，中央红军走了一年，行程二万五千里。出发时的八万六千余人，到陕北剩七千余人。一个月后，部队与红十五军团会合。吴起镇在黄土塬上，风大，水少，镇口的路是土路。",
        source: "中国军网《吴起的晨曦》（2026-09-14）；人民网《中央红军到达陕北后还剩多少兵力》。",
        note: ""
      }
    ]
  };
})(window.XB = window.XB || {});

