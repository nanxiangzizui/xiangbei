# 第五章 · 草地
- id: grass ｜ 史实注: grass ｜ 选择: g008、g018x（灶王）、g021、g026x（冬生）
- 定稿: 1809 字 ｜ 118 beat ｜ 时长(B) 7:47
- bg: grass_marsh, grass_dawn ｜ sfx: wind_low, water_step, fire_miss, bugle_short
- 演出: 黑草与水的横移 / 门板当床 / 火苗不起来
- 注意: 不写具体减员数；不做血腥；死亡只用“蹲下没再站起来”和划名；青稞是行囊物资（item.barley），分给伤员即扣粮；到 g008b 药膏/绷带回赠时才 condition+1，提示原因“你与他人互相救助”（statusOnce: memory.grass_mutual，刷新不重复）；没有青稞时整个选择跳过；g027a 由引擎结算状态与门板，文本源只标记 settle

[[bg:grass_marsh]]
【旁白】草地。八月，没有一棵树。
【旁白】脚下的草是黑的，踩上去，水就冒出来。
【旁白】水不过脚踝，可是走一天，腿是紫的。

【旁白】走进草地第三天，队伍开始有人掉队。
【旁白】掉队的人不喊。他们蹲下去，像在系鞋带。
【旁白】后面的人走过去，把他架起来。架不动，就两个人架。
[[if:item.door]]
【旁白】背上的门板这时候是一张床。
【旁白】伤员躺上去，比躺在泥里强。
[[else]]
【旁白】没有门板。伤员只能躺在草上，草底下是水。
[[end]]
【旁白】雨下起来没有声音。
【旁白】落在草上，像有人在远处抖一块布。

>> 选项｜限时 20s｜默认 B｜记录到 choice.grass.share｜when: item.barley
A｜倒进伤员的碗里｜set: item.barley=false, trust=+1, memory.grass_share=true｜cost: 粮袋空了，腿上却有了点劲
B｜留给自己｜set: memory.grass_keep=true｜cost: 伤员看着你把青稞吃完

[[if:memory.grass_share]]
【伤员】你背上也磨破了。这半卷绷带，拿着。
【旁白】夜里，几个人把各自省下的药膏刮进一只小铁盒。换完药，盒底只剩一层黑。
[[end]]

[[if:!fate.zaowang.dead && !fate.feimao.dead]]
【旁白】灶王的锅越来越轻。他背起来，走得比谁都快。
【飞毛腿】锅给我。
【灶王】你腿快，留着力气走路。
【飞毛腿】我背锅也走得快。
【旁白】他伸手去抢，灶王把锅往身后一藏。
【灶王】锅在人在。
[[end]]

[[if:!fate.feimao.dead && !fate.dongsheng.dead]]
【旁白】冬生走不动的时候，飞毛腿把他背起来。
【冬生】放我下来。你背着我，更走不出去。
【飞毛腿】你少说话，省气。
【旁白】冬生不说了。过了一会，他在飞毛腿耳边吹了一个音。
【飞毛腿】别吹。省气。
【冬生】我给你吹的。
[[end]]

[[if:!fate.dongsheng.dead]]
【旁白】林先生的干粮袋空了。冬生看见她把袋口翻过来，抖了抖。
【冬生】先生，你饿不饿？
【林先生】不饿。
【旁白】她从口袋里摸出半块锅巴，塞给冬生。
【林先生】拿着。
【冬生】你也没吃。
【林先生】我吃过了。
[[end]]

[[if:!fate.player.dead]]
【旁白】我肩上的伤又磨开了。林先生看见，把最后一点药膏刮在布上。
【满崽】先生，药留着。
【林先生】留着给谁？
【旁白】她给我抹上。药膏是凉的，抹完，布上还有一点。
【林先生】剩下的，给冬生。
[[end]]

[[if:fate.feimao.dead]]
【旁白】以前这种路，飞毛腿跑一个来回，还能帮别人背枪。
【旁白】现在没有人跑了。队伍走得很静。
[[end]]
[[if:fate.zaowang.dead]]
【旁白】没有锅了。大家喝水的时候，用手捧着。
[[end]]
[[if:fate.dongsheng.dead]]
【旁白】没有号声。天亮的时候，队伍自己醒。
[[end]]

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

【旁白】林先生从怀里摸出一截铅笔，在木牌上写字。
【旁白】木牌是从担架上拆下来的。字写上去，木纹把笔画吃进去。
【林先生】写谁？
【旁白】没有人答。她把木牌插在坑边，什么也没写。
[[if:!fate.zaowang.dead]]
【旁白】灶王从锅底刮下一把黑灰，撒在坑边。
[[end]]
[[if:!fate.dongsheng.dead]]
【旁白】冬生吹了一个短音。吹完，他把号抱在怀里。
[[end]]

【旁白】灶王把锅从背上解下来。锅底结着一层黑，他用刺刀刮。
【旁白】刮完，锅底能照见人。他看了一眼，又扣回去。
【灶王】锅比人脸干净。人脸上有泥。
【灶王】文书，我那个“灶”字，你写对没有？
【满崽】写对了。
【灶王】那就行。锅里没粮了，纸上还有。
【灶王】最后一锅。喝了再走。
【旁白】他把最后一点盐撒进锅里。盐罐空了，他在罐底刮了刮。
【旁白】有人把一块锅巴掰成两半，一半给最小的那个，一半放在锅沿上。
【灶王】我不吃。你们走。
【旁白】他蹲下去生火。
【旁白】柴是湿的，他吹了半天。
【旁白】他蹲在风口上，把锅盖掀开，又盖上。锅里是水。
【灶王】水开了，就能走。
【旁白】火镰打了三下，火星落在湿柴上，灭了。
【旁白】第四下，他咳了一声，手撑在锅沿上，肩膀往下塌。
【灶王】文书，别管我。锅别倒。

>> 选项｜限时 16s｜默认 C｜记录到 choice.grass.zaowang
A｜把青稞倒进锅里｜requires: item.barley｜set: item.barley=false, rescues=+1, quality.zaowang=2, fate.zaowang.dead=false, memory.zaowang_barley=true｜cost: 青稞倒进锅里，你和他都少一口
B｜把家里的铁锅架上去｜requires: item.homepot｜set: item.homepot=false, rescues=+1, quality.zaowang=3, fate.zaowang.dead=false, memory.zaowang_pot=true｜cost: 家里的锅，换了这一锅热水
C｜不救了，跟上队伍｜set: fate.zaowang.dead=true, memory.zaowang_leave=true｜cost: 火没起来。你走了。

[[if:fate.zaowang.dead]]
【旁白】火没起来。他就在那儿蹲着，没再站起来。
[[end]]
[[if:!fate.zaowang.dead]]
【旁白】火起来了。他站起来，膝盖响了一声。
【旁白】他把锅背回背上。锅沿磕着肩胛骨，响了一声。
【灶王】走。到吴起，我给你们煮一顿干的。
[[if:!fate.feimao.dead]]
【飞毛腿】锅给我。你扶着我的肩。
【灶王】我自己能走。
【飞毛腿】知道。我扶着，你走。
[[end]]
[[end]]
[[if:fate.zaowang.dead]]
【旁白】我把他埋在一个能看见太阳的地方。那天没有太阳。
[[if:item.homepot]]
【旁白】我把家里的铁锅擦了一遍，又擦一遍，像他擦他那口。
[[end]]
[[end]]

[[if:fate.zaowang.dead && !fate.feimao.dead]]
【旁白】飞毛腿把灶王的锅背起来。锅沿磕着他的肩胛骨。
【飞毛腿】我替他背。到了吴起，我给他煮一顿。
[[end]]
[[if:fate.zaowang.dead && fate.feimao.dead && !fate.dongsheng.dead]]
【旁白】冬生把灶王的锅背起来。锅比他大，走一步，晃一下。
[[end]]

[[if:fate.zaowang.dead && item.homepot]]
>> 选项｜限时 16s｜默认 A｜记录到 choice.grass.pot
A｜背走小锅｜set: item.pot=true, load=+1｜cost: 背上的东西又多一件
B｜把小锅留给他｜set: item.pot=false｜cost: 到了陕北，你没有锅
[[end]]
[[if:fate.zaowang.dead && !item.homepot]]
【旁白】我把小锅留在了火堆边。背着它，我也走不出去。
[[end]]
[[if:fate.zaowang.dead && item.pot && item.door]]
【旁白】我把小锅背上。锅沿磕着门板，一路响。
[[end]]
[[if:fate.zaowang.dead && item.pot && !item.door]]
【旁白】我把小锅背上。锅沿硌着背，一路响。
[[end]]
[[if:fate.zaowang.dead && !item.pot]]
【旁白】我把小锅放在他手边。
【旁白】走出一段路，我还能看见那口锅在发亮。
[[end]]

[[bg:grass_dawn]]
【旁白】冬生十五。号比他高半头。
【旁白】他吹号前，先往号嘴里哈一口气。他说，这样声音不哑。
【冬生】文书，我的名字，你写对没有？
【满崽】冬生。冬天的冬，生下来的生。
【冬生】对。别写错。到了吴起，我要自己应。
【冬生】号还吹得动吗？
【旁白】他吹了一个音，气不够，断了。
【旁白】他把号擦干净，又塞回怀里，像塞回一件怕冷的东西。

【旁白】他的嘴唇裂了。哈气的时候，裂口上有一点白。
【旁白】林先生把自己的围巾解下来，围在他脖子上。
【冬生】先生，你冷。
【林先生】我不冷。你吹号，嘴不能冻。

>> 选项｜限时 12s｜默认 C｜记录到 choice.grass.dongsheng
A｜把自己的布鞋脱给他｜requires: item.shoes｜set: item.shoes=false, rescues=+1, quality.dongsheng=3, fate.dongsheng.dead=false, memory.dongsheng_shoes=true, inventory.giftBarley=true｜cost: 你把鞋脱给他，脚上只剩一层布
B｜把雨布裹在他身上｜requires: item.raincloth｜set: item.raincloth=false, rescues=+1, quality.dongsheng=3, fate.dongsheng.dead=false, memory.dongsheng_cloth=true, inventory.giftBarley=true｜cost: 雨布裹着他，雨落在你身上
C｜不救，继续走｜set: fate.dongsheng.dead=true, memory.dongsheng_leave=true｜cost: 你走在前头。他没有跟上来。

[[if:!fate.dongsheng.dead]]
【旁白】冬生把一小袋青稞塞给我。他说，这个不占地方。
[[end]]
[[if:!fate.dongsheng.dead]]
【旁白】冬生把号举起来，吹了一个长音。
【旁白】这一次，声音没有断。
[[end]]

【旁白】林先生蹲下去，抓了一把黑土，用手帕包好。
【满崽】带这个做什么？
【林先生】带回去。告诉他们，我们是从这里走出来的。
[[if:!fate.feimao.dead]]
【旁白】飞毛腿把帽子按了按。那张纸还在里头。
[[end]]
[[if:!fate.zaowang.dead]]
【旁白】灶王把锅背好。锅底的字贴着背。
[[end]]

【旁白】走出草地那天，前面有人喊：看见房子了。
[[if:fate.dongsheng.dead]]
【旁白】冬生没跟上来。他的号在草里，我没找到。
[[else]]
【旁白】冬生说，到了吴起，我吹给全连听。
[[end]]
[[if:memory.help]]
【旁白】三个人把我从地上架起来。谁也没说话。
[[end]]
【旁白】没有人跑。大家只是把脚步放快了一点。
[[if:fate.player.dead]]
【旁白】走出草地那天，我走不动了。
【旁白】我把名册解下来，交给冬生。
【旁白】我说，别停。
【旁白】他背起名册，没回头。队伍没有停。
[[end]]
[[if:!fate.player.dead]]
【标题卡】终章 · 吴起
[[end]]
【史实注】grass
【结束】next=badend｜when: fate.badend
【结束】next=coda｜when: fate.seven5
【结束】next=wuqi｜when: !fate.player.dead