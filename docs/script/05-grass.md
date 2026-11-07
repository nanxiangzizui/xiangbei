# 第五章 · 草地
- id: grass ｜ 史实注: grass ｜ 选择: g008、g018x（灶王）、g021、g026x（冬生）
- 定稿: 586 字 ｜ 39 beat ｜ 时长(B) 2:31
- bg: grass_marsh, grass_dawn ｜ sfx: wind_low, water_step, fire_miss, bugle_short
- 演出: 黑草与水的横移 / 门板当床 / 火苗不起来
- 注意: 不写具体减员数；不做血腥；死亡只用“蹲下没再站起来”和划名；炒面是连队公粮，个人干粮看 item.barley

[[bg:grass_marsh]]
【旁白】草地。八月，没有一棵树。
【旁白】脚下的草是黑的，踩上去，水就冒出来。
【旁白】水不过脚踝，可是走一天，腿是紫的。
[[if:item.door]]
【旁白】背上的门板这时候是一张床。
【旁白】伤员躺上去，比躺在泥里强。
[[else]]
【旁白】没有门板。伤员只能躺在草上，草底下是水。
[[end]]
【旁白】雨下起来没有声音。
【旁白】落在草上，像有人在远处抖一块布。

>> 选项｜限时 20s｜默认 A｜记录到 choice.grass.share
A｜炒面分给伤员｜set: fire=-15, trust=+1｜cost: 你三天没吃饱，走不动
B｜炒面分给还能走的人｜set: trust=-1, load=+1｜cost: 伤员看你的眼神，变了

【旁白】第七天，我们在一条河沟边停下。
【旁白】前面的人在挖坑。
【旁白】坑不大，能放七八个人。
【旁白】挖完，坑边坐着一排人，谁也没说话。
【旁白】有人问，埋谁。
【旁白】没人答。
【旁白】后来大家把各自的干粮袋解下来，放在坑边。
[[if:item.barley]]
【旁白】我把青稞倒进锅里。锅底响了一声，像有人在里面敲。
[[else]]
【旁白】我的干粮袋早就空了，袋底有一层碎末。
[[end]]
【灶王】最后一锅。喝了再走。
【旁白】他蹲下去生火。
【旁白】柴是湿的，他吹了半天。

>> 选项｜限时 16s｜默认 D｜记录到 choice.grass.zaowang
A｜把青稞倒进锅里｜requires: item.barley｜set: item.barley=false, strain=+1, fate.zaowang.dead=false, memory.zaowang_barley=true｜cost: 青稞倒进锅里，你和他都少一口
B｜把家里的铁锅架上去｜requires: item.homepot｜set: item.homepot=false, strain=+1, fate.zaowang.dead=false, memory.zaowang_pot=true｜cost: 家里的锅，换了这一锅热水
C｜替他蹲到风口上｜requires: !item.door｜set: fire=-10, strain=+1, fate.zaowang.dead=false, memory.zaowang_body=true｜cost: 你在风口蹲了半宿，火起来了，你落下了病
D｜不救了，跟上队伍｜set: fate.zaowang.dead=true, memory.zaowang_leave=true｜cost: 火没起来。你走了。

[[if:fate.zaowang.dead]]
【旁白】火没起来。他就在那儿蹲着，没再站起来。
【旁白】我把他埋在一个能看见太阳的地方。那天没有太阳。
[[if:item.homepot]]
【旁白】我把家里的铁锅擦了一遍，又擦一遍，像他擦他那口。
[[end]]
[[else]]
【旁白】火起来了。他站起来，膝盖响了一声。
[[end]]

[[if:fate.zaowang.dead && item.homepot]]
>> 选项｜限时 16s｜默认 A｜记录到 choice.grass.pot
A｜背走小锅｜set: item.pot=true, load=+1｜cost: 背上的东西又多一件
B｜把小锅留给他｜set: item.pot=false｜cost: 到了陕北，你没有锅
[[end]]
[[if:fate.zaowang.dead && !item.homepot]]
【旁白】我把小锅留在了火堆边。背着它，我也走不出去。
[[end]]
[[if:fate.zaowang.dead && item.pot]]
【旁白】我把小锅背上。锅沿磕着门板，一路响。
[[end]]
[[if:fate.zaowang.dead && !item.pot]]
【旁白】我把小锅放在他手边。
【旁白】走出一段路，我还能看见那口锅在发亮。
[[end]]

[[bg:grass_dawn]]
【冬生】号还吹得动吗？
【旁白】他吹了一个音，气不够，断了。
【旁白】他把号擦干净，又塞回怀里，像塞回一件怕冷的东西。

>> 选项｜限时 12s｜默认 D｜记录到 choice.grass.dongsheng
A｜把自己的布鞋脱给他｜requires: item.shoes｜set: item.shoes=false, strain=+1, fate.dongsheng.dead=false, memory.dongsheng_shoes=true｜cost: 你把鞋脱给他，脚上只剩一层布
B｜把雨布裹在他身上｜requires: item.raincloth｜set: item.raincloth=false, strain=+1, fate.dongsheng.dead=false, memory.dongsheng_cloth=true｜cost: 雨布裹着他，雨落在你身上
C｜背他走｜requires: !item.door｜set: fire=-10, strain=+1, fate.dongsheng.dead=false, memory.dongsheng_body=true｜cost: 你背着他走。走出草地时，腿不是自己的了
D｜不救，继续走｜set: fate.dongsheng.dead=true, memory.dongsheng_leave=true｜cost: 你走在前头。他没有跟上来。

【旁白】走出草地那天，前面有人喊：看见房子了。
[[if:fate.dongsheng.dead]]
【旁白】冬生没跟上来。他的号在草里，我没找到。
[[else]]
【旁白】冬生说，到了吴起，我吹给全连听。
[[end]]
【旁白】没有人跑。大家只是把脚步放快了一点。
[[if:strain.dying]]
【旁白】走出草地那天，我走不动了。
【旁白】我把名册解下来，交给冬生。
【旁白】我说，别停。
【旁白】他背起名册，没回头。队伍没有停。
[[end]]
[[if:!strain.dying]]
【标题卡】终章 · 吴起
[[end]]
【史实注】grass
[[if:strain.dying]]
【结束】next=coda
[[else]]
【结束】next=wuqi
[[end]]
