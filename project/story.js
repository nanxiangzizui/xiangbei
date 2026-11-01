(function (XB) {
  "use strict";

  // 节点形状见 docs/script/README.md §3；id 规则见 §7。
  // 步骤一只誊序章第 9–31 行（20 句，到第一个选项前），p900 是临时章末，步骤三删除前先写迁移。
  XB.story = {
    version: 1,
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
          { id: "p900", type: "end", next: "map" }
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
    ]
  };
})(window.XB = window.XB || {});
