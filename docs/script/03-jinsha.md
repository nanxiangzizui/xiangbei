# 第三章 · 金沙江
- id: jinsha ｜ 史实注: jinsha ｜ 选择: j024（先渡谁）、记名交互 8s
- 定稿: 641 字 ｜ 36 beat ｜ 时长(B) 2:45
- bg: jinsha_river, jinsha_night ｜ sfx: river_deep, oar, chant, fire
- 演出: 江面纵深 / 六条小船横排 / 船工名字在岸上依次亮起
- 注意: 37 名船工、6 条船、7 天 7 夜；“张老幺”“老鸦”为虚构船工，图鉴注明纪念碑上镌的是真实名字与绰号

[[bg:jinsha_river]]
【旁白】金沙江的水是绿的。
【旁白】声音像有人在石头底下推磨。
【旁白】江面比湘江窄，水比湘江急。下过雨，岸边全是滑的。
【旁白】渡口只有六条小船。船工说，一条船八个人，多一个都不行。
【张老幺】规矩比命大。排队上船，谁也别挤。
【旁白】他说这话的时候，一只手按在船帮上，手背上全是裂口。
【满崽】一条船能多坐一个吗？
【张老幺】多一个，沉一个。你说呢？
【旁白】他把人一个一个数上船。数完，又数一遍。

【旁白】七天七夜。船工的号子从早喊到晚，最后哑成气音。
【旁白】有人在船上睡着了，头一点一点，像在跟谁认错。
【旁白】我蹲在岸边记名字。
【旁白】三十七个船工，有名有姓的，也有只剩一个绰号的。
【旁白】有个船工叫“老鸦”，因为他黑。
【旁白】他自己说，叫什么都行，只要记得住。

【交互】记名｜8s｜点选要抄下的名字；不选即跳过
【结算】记名｜抄下几个 / 一个没抄；不评分
[[if:memory.zhang]]
【张老幺】小同志，你记这个做什么？
【满崽】我记一下。
【张老幺】记了也没用，我们不出名。
【满崽】那就记着。
[[else]]
【旁白】我蹲了半夜，一个字没写。名字太多，纸太小。
【旁白】第二天开船，我连他姓什么都想不起来了。
[[end]]

>> 选项｜限时 16s｜默认 A｜记录到 choice.jinsha.priority
A｜先渡主力｜set: choice.jinsha.priority=main, choice.jinsha.main=true, choice.jinsha.wounded=false, choice.jinsha.kettle=false, trust=+1｜cost: 后勤的人和骡子多等一天
B｜先渡伤员｜set: choice.jinsha.priority=wounded, choice.jinsha.main=false, choice.jinsha.wounded=true, choice.jinsha.kettle=false, trust=-1｜cost: 主力在渡口多暴露一天
C｜先渡炊事班｜set: choice.jinsha.priority=kettle, choice.jinsha.main=false, choice.jinsha.wounded=false, choice.jinsha.kettle=true, fire=+5｜cost: 伤员在岸上多躺一天

[[if:choice.jinsha.main]]
【旁白】主力先上。骡子被牵着，蹄子在石头上打滑。
[[end]]
[[if:choice.jinsha.wounded]]
【旁白】伤员先上。担架放上船，船工把桨递过去，让躺着的人抓住。
[[end]]
[[if:choice.jinsha.kettle]]
【旁白】炊事班先上。锅和米袋挤在船头，船工喊了一声：沉。
[[end]]

[[bg:jinsha_night]]
【旁白】最后一批上船的时候，天快亮了。
【旁白】船工的号子只剩调子，没有词。
[[if:choice.jinsha.main]]
【旁白】船工把最后一批人送过去，又回来接后勤。天亮前，骡子也上了船。
[[end]]
[[if:choice.jinsha.wounded]]
【旁白】最后一批是伤员。有人躺在船底，看着天，一声不吭。
[[end]]
[[if:choice.jinsha.kettle]]
【旁白】炊事班的锅最后过江。锅底朝天，像一口倒扣的井。
[[end]]
【张老幺】走吧。往北，别停。
【旁白】船离岸，他没有招手。他蹲下去，把船绳又系紧了一道。
【旁白】我们上了北岸，回头看不见船。
[[if:choice.jinsha.main]]
【旁白】后勤的人在岸边等船。有人靠着骡子睡着了。
[[end]]
[[if:choice.jinsha.wounded]]
【旁白】伤员的担架排在岸上。卫生员一个一个看过去。
[[end]]
[[if:choice.jinsha.kettle]]
【旁白】炊事班在岸上埋锅。火点着的时候，天刚好亮。
[[end]]
【旁白】只听见桨声，一下，一下，没有停。
【标题卡】第四章 · 泸定
【史实注】jinsha
【结束】next=luding
