# 第四章 · 泸定
- id: luding ｜ 史实注: luding ｜ 选择: l019（有板 3 选 / 无板 2 选）、l027
- 定稿: 741 字 ｜ 40 beat ｜ 时长(B) 3:11
- bg: luding_bridge, luding_after ｜ sfx: river_roar, iron, wind, gunfire_far
- 演出: 十三根铁索横在河上 / 光点一个一个亮 / 桥板一块一块铺
- 注意: 22 名突击队员只写“光点”和数字，不写姓名（姓名有佚散，难以确定）；门板铺桥后 item.door 变 false，l019x 用 !choice.luding.door 防止同一回合二次触发

[[bg:luding_bridge]]
【旁白】大渡河。水声像打雷，站在桥头说话要靠喊。
【旁白】桥板被抽走了。剩下十三根铁索，横在河上，晃。
【旁白】铁索有碗口粗吗？没有。一只手能握住。
【飞毛腿】命令到了：下午四点，二十二个人，爬过去。
【旁白】他跑得满头汗，脖子上挂着一卷电线。
【旁白】电线尾巴一甩一甩。
【满崽】二十二个。数得清吗？
【飞毛腿】数得清。我在桥头数，你在桥尾记。

【旁白】四点。二十二个人上桥，一个跟一个，隔着三步。
【旁白】我在桥头数光点。一个光点是一个活人。
【旁白】数到十七，停了很久，才数到十八。
【旁白】中间那一段，我数了三遍，都是十七。

【旁白】桥板一块一块铺上去的时候，铁索在抖。
【旁白】铺桥的人趴着往前挪，脚后跟勾住铁索，手里递板子。
【旁白】我跟着队伍过桥。
【旁白】走到中间，看见桥板上有一道划痕，像谁用指甲刻的。

>> 选项｜限时 12s｜默认 C｜记录到 choice.luding.door｜when: item.door
A｜把门板铺上桥面｜set: item.door=false, doorOutcome=bridge, trust=+1, rescues=+1, quality.feimao=3, fate.feimao.dead=false, memory.fly_bridge=true｜cost: 你的门板成了第三块桥板
B｜先给他上药｜requires: item.medicine｜set: item.medicine=false, rescues=+1, quality.feimao=2, fate.feimao.dead=false, memory.fly_medicine=true｜cost: 药只有一副，你留给了他
C｜抱着门板先过桥｜set: fate.feimao.dead=true, memory.fly_leave=true｜cost: 你过去了。他没有。

>> 选项｜限时 12s｜默认 B｜记录到 choice.luding.door｜when: !item.door && !choice.luding.door
A｜把药敷在他背上｜requires: item.medicine｜set: item.medicine=false, rescues=+1, quality.feimao=2, fate.feimao.dead=false, memory.fly_medicine=true｜cost: 药只有一副，你留给了他
B｜继续走｜set: fate.feimao.dead=true, memory.fly_leave=true｜cost: 你没有停。

[[if:choice.luding.door]]
【旁白】桥面多了一块板。我踩过去的时候，脚底下响了一声。
[[end]]
[[if:item.door]]
【旁白】门板压在背上，三十斤。我走一步，后面的人就等一步。
[[end]]
[[if:!item.door && !choice.luding.door]]
【旁白】我背上没有门板。过桥的时候，手只能抓住铁索。
[[end]]
[[if:memory.fly_medicine]]
【旁白】我把药敷在他背上。他咬住号嘴，没出声。
[[end]]

[[bg:luding_after]]
【旁白】过桥以后，我回头看那十三根铁索。它们空着，还在晃。
[[if:choice.luding.door]]
【旁白】有一块板，是我家的门。
[[end]]
[[if:item.door]]
【旁白】门板还在背上。过了桥，它比我先磕在石头上。
[[end]]
[[if:!item.door && !choice.luding.door]]
【旁白】背上空着。我一直没背门板，过桥时两只手都给了铁索。
[[end]]
[[if:fate.feimao.dead]]
【旁白】我过了桥。回头的时候，桥那头已经没有人。
[[end]]
[[if:!fate.feimao.dead]]
【旁白】飞毛腿过来了。他扶着桥头的石桩，站了一会儿，才把气喘匀。
[[end]]
[[if:fate.feimao.dead]]
【旁白】飞毛腿没过来。他的号挂在桥头的木桩上，还热着。
【旁白】我把号取下来，塞进背包。号嘴上有牙印，他咬的。
【冬生】号给我。
[[end]]
[[if:!fate.feimao.dead]]
【旁白】冬生把水壶递给他。他喝了一口，又吐出来，说水太凉。
[[end]]
[[if:fate.feimao.dead]]
【满崽】就剩一个了。
【冬生】我知道。他吹的时候，我在后面听。
[[end]]

>> 选项｜限时 12s｜默认 A｜记录到 choice.luding.names
A｜记下数字，不写名字｜set: memory.luding_unknown=false｜cost: 名册上多一行空白
B｜留一页空白，等名字｜set: memory.luding_unknown=true｜cost: 那一页一直是空的

[[if:memory.luding_unknown]]
【旁白】我在名册最后留了一整页。
【旁白】页脚写：泸定，二十二，名字待查。
[[else]]
【旁白】我在名册上写：泸定，二十二。写完就合上了。
[[end]]
【旁白】那天夜里，我把“北”字重新描了一遍。
[[if:item.shoes]]
【旁白】脱鞋的时候，鞋底磨穿了一个洞。娘纳的底，磨到了线。
[[else]]
【旁白】草鞋后跟散了。我坐在地上，用布条重新绑了一遍。
[[end]]
【旁白】铅笔头短得握不住，我用布条把它绑在手指上。
【旁白】描的时候，手没抖。
【标题卡】第五章 · 草地
【史实注】luding
【结束】next=grass