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
            id: "p039",
            type: "line",
            speaker: "旁白",
            text: "上了南岸，我把门板翻过来，用铅笔画了一个字。画得很大，占了半块板。",
            bg: "yudu_night"
          },
          { id: "p040", type: "line", speaker: "旁白", text: "北。" },
          { id: "p041", type: "line", speaker: "旁白", text: "画完，我用手掌按了按，怕雨水泡开。" },
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
        playable: false,
        nodes: []
      },
      {
        id: "zunyi",
        order: 3,
        title: "第二章 · 遵义",
        short: "遵义",
        playable: false,
        nodes: []
      },
      {
        id: "jinsha",
        order: 4,
        title: "第三章 · 金沙江",
        short: "金沙江",
        playable: false,
        nodes: []
      },
      {
        id: "luding",
        order: 5,
        title: "第四章 · 泸定",
        short: "泸定",
        playable: false,
        nodes: []
      },
      {
        id: "grass",
        order: 6,
        title: "第五章 · 草地",
        short: "草地",
        playable: false,
        nodes: []
      },
      {
        id: "wuqi",
        order: 7,
        title: "终章 · 吴起 · 点名",
        short: "吴起",
        playable: false,
        nodes: []
      }
    ],
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
