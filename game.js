'use strict';
const $ = s => document.querySelector(s);
const SAVE_KEY='ylmq-save-v09', ARCHIVE_KEY='ylmq-archive-v09';
const LEGACY_SAVE_KEYS=['ylmq-save-v08','ylmq-save-v7','ylmq-save-v6','ylmq-save-v4'];
const LEGACY_ARCHIVE_KEYS=['ylmq-collection-v08','ylmq-collection-v07'];
const defaults=()=>({name:'Героиня',nameScript:'ru',look:'dark',eyes:'brown',step:0,trust:0,attachment:0,jealousy:0,suspicion:0,flags:{},slot:1});
const blankArchive=()=>({endings:[],gallery:[],achievements:[]});
let state=defaults(), archive=blankArchive(), musicOn=false, audioCtx=null, musicTimer=null, musicNodes=[], volume=.24, currentMood='bright', activeTrack=null;
const chapters=[
 ['ГЛАВА I · ОБЫЧНЫЕ ДНИ','Пыльный свет после уроков'],['ГЛАВА II · ТРЕТЬЯ ЛИШНЯЯ','Кафе на углу'],['ГЛАВА III · НЕЗАМЕЧЕННЫЕ МЕЛОЧИ','Дождливый вечер'],['ГЛАВА IV · НЕПРОШЕНЫЕ СОВЕТЫ','Пустая аудитория'],['ГЛАВА V · ПОСЛЕДНИЙ СВИДЕТЕЛЬ','Лестничная площадка'],['ГЛАВА VI · ТОЛЬКО НАШ МИР','Комната с розовыми шторами'],['ГЛАВА VII · ТОНКАЯ ГРАНЬ','Ночь без сна'],['ГЛАВА VIII · ПАМЯТЬ НЕ МОЛЧИТ','Старые фотографии'],['ГЛАВА IX · ПРАВДА И ОБЕЩАНИЯ','Утро за закрытой дверью'],['ГЛАВА X · LOVE ME QUIETLY','Тихий рассвет']
];
// Each choice effect is data: stats, flags and optional requirements. Branches are gated by flags.
const S=(c,who,text,choices=null,bg='school',cg=null,gate=null)=>({c,who,text,choices:Array.isArray(choices)?(typeof choices[0]==='string'?[choices]:choices):null,bg:bg||'school',cg,gate});
const story=[
// CHAPTER 1 — bright, playful
S(0,'Мия','Ты опять пришла раньше меня. Это уже начинает походить на соревнование.','', 'school','first_meeting'),
S(0,'Ты','Зато теперь я официально победила. Где мой приз?'),
S(0,'Мия','Один большой стакан какао и право выбрать музыку по дороге домой. Не злоупотребляй властью.'),
S(0,'Алиса','А мне можно присоединиться к вашему торжеству? Я даже принесла печенье.'),
S(0,'Мия','Конечно! Но предупреждаю: сегодня плейлист выбирает моя лучшая подруга.'),
S(0,'Алиса','Тогда я сяду рядом с ней. Вдруг у нас совпадут вкусы.','', 'school','alice_smile'),
S(0,'Ты','Я не против. Только Мия обещала мне какао.'),
S(0,'Мия','И я сдержу обещание! После занятий — наше кафе, прогулка и никаких разговоров об учёбе.'),
S(0,'Ты','Провести время с Мией вдвоём или позвать Алису?',[['Сегодня хочу провести время с Мией. Мы давно не гуляли вдвоём.',{trust:1,flag:'mia_first'}],['Позовём Алису. Чем больше компания, тем веселее.',{attachment:1,flag:'invite_alice'}]]),
S(0,'Алиса','Вы так оживлённо что-то планируете. Можно узнать, что я пропустила?'),
S(0,'Ты','Мы собирались после занятий. Хочешь с нами?'),
S(0,'Алиса','Конечно. Если ты действительно хочешь, чтобы я пошла.','', 'alice','alice_warm'),
S(0,'Мия','Тогда решено! Встречаемся у входа.'),
S(0,'Мысли','Алиса улыбнулась. Но когда Мия взяла меня под руку, улыбка на мгновение исчезла.'),
S(0,'Алиса','Вы с Мией очень близки. Это здорово. Правда.','', 'alice','alice_vulnerable'),
S(0,'Ты','Мия — моя лучшая подруга. Это не соревнование.'),
S(0,'Алиса','Я знаю. Просто иногда мне хочется быть для тебя кем-то особенным.'),
S(0,'Мия','Эй, особенные люди не обязаны толкаться локтями. Всем найдётся место!'),
S(0,'Мысли','Тогда всё казалось обычным: солнечный двор, шутки и планы на вечер. Я ещё не знала, как часто буду вспоминать этот день.','', 'school','sunny_day'),
// CHAPTER 2
S(1,'Мия','Я заказала тебе какао с корицей. Не благодари — я запомнила.' ,'', 'cafe','cafe'),
S(1,'Ты','Ты запоминаешь за меня даже то, что я сама забываю.'),
S(1,'Мия','Это называется талант. И скромность. В основном скромность.'),
S(1,'Алиса','Вы так хорошо знаете привычки друг друга.','', 'cafe','alice_smile'),
S(1,'Мия','Долгая дружба. Хочешь, расскажу, как она однажды перепутала соль с сахаром?'),
S(1,'Алиса','Нет. Я хочу услышать истории, в которых я тоже есть.'),
S(1,'Ты','Мы можем создавать новые воспоминания втроём.'),
S(1,'Алиса','Мне нравится, как это звучит.'),
S(1,'Мия','Кстати, Алиса сегодня почти не разговаривала. Всё хорошо?'),
S(1,'Алиса','Я прекрасно слышу своё имя. Просто интересно: вы всегда столько времени проводите вдвоём?'),
S(1,'Ты','Мы давно дружим. Это нормально. Что ты хочешь этим сказать?',[['Алиса, ты тоже можешь быть частью нашей компании.',{attachment:1,flag:'welcomed_alice'}],['Не превращай обычную встречу в допрос.',{trust:1,jealousy:1,flag:'first_boundary'}]]),
S(1,'Алиса','Прости. Я не хотела портить вечер. Иногда мне трудно понять, когда я лишняя.','', 'cafe','alice_vulnerable'),
S(1,'Мия','Ты не лишняя, Алиса. Но и дружбу Киры со мной не нужно воспринимать как угрозу.'),
S(1,'Алиса','Я постараюсь. Ради неё.'),
S(1,'Мысли','На секунду она выглядела искренней. Я решила поверить, что этого достаточно.'),
// CHAPTER 3
S(2,'Ты','Ты в порядке? Ты сегодня почти не отвечала на сообщения.'),
S(2,'Алиса','Я написала тебе три раза. Ты была онлайн, но отвечала Мие.','', 'rain','alice_cold'),
S(2,'Ты','Мы обсуждали проект. Это не значит, что я тебя игнорирую.'),
S(2,'Алиса','Я знаю. Просто иногда мне кажется, что если я перестану писать первой, ты обо мне забудешь.'),
S(2,'Ты','Я могу быть рядом, но не могу отвечать каждую минуту.',[['Сказать мягко, но твёрдо: мне нужно личное пространство.',{trust:2,flag:'space_boundary'}],['Пообещать чаще писать, чтобы её успокоить.',{attachment:2,flag:'constant_contact'}]]),
S(2,'Алиса','Правда? Тогда скажи это ещё раз. Только мне.','', 'rain','alice_vulnerable'),
S(2,'Мысли','Её пальцы дрожали. Через мгновение она спрятала руки в рукава и снова улыбнулась.'),
S(2,'Мия','Я не хочу лезть в ваши отношения, но Алиса спрашивала, где ты была почти каждый час.'),
S(2,'Ты','Она просто волнуется.'),
S(2,'Мия','Возможно. Но забота не должна превращаться в отчёт.'),
S(2,'Ты','Спасибо, что сказала. Я подумаю об этом.',[['Попросить Мию помочь мне разобраться.',{trust:1,flag:'mia_confidante'}],['Сказать, что я сама поговорю с Алисой.',{attachment:1,flag:'handle_alone'}]]),
S(2,'Мия','Я рядом. Но обещай, что не будешь скрывать от меня, если станет страшно.',null,'cafe','mia_serious',{flag:'mia_confidante'}),
S(2,'Алиса','Ты решила справляться сама? Хорошо. Значит, мне не придётся делить с ней каждый твой секрет.',null,'rain','alice_cold',{flag:'handle_alone'}),
S(2,'Мысли','На стекле кафе медленно расползались дождевые капли. В отражении Алиса смотрела не на меня, а на Мию.'),
// CHAPTER 4
S(3,'Мия','Я немного волнуюсь за Алису. Она спрашивала, не собираемся ли мы разъехаться после выпуска.'),
S(3,'Ты','Почему её это так беспокоит?'),
S(3,'Мия','Она сказала, что не переживёт, если вы перестанете общаться.'),
S(3,'Ты','Это звучит тревожно. Что мне делать?',[['Выслушать Мию и вместе продумать, как поговорить.',{trust:2,flag:'trusted_mia'}],['Не делать выводов, пока не услышу Алису.',{attachment:1,flag:'waited_alice'}]]),
S(3,'Мия','Я не пытаюсь вас поссорить. Я просто хочу, чтобы ты была в безопасности.' ,'', 'hall','mia_worried'),
S(3,'Алиса','Вы опять решаете, что со мной не так?','', 'hall','alice_cold'),
S(3,'Ты','Я хочу понять, почему ты так боишься меня потерять.'),
S(3,'Алиса','Потому что однажды люди уже обещали остаться. А потом исчезли.','', 'memory','alice_past'),
S(3,'Ты','Мне жаль, что тебе пришлось через это пройти. Но я не могу отвечать за поступки других людей.'),
S(3,'Алиса','Я не прошу жалости. Я прошу только не бросать меня.'),
S(3,'Ты','Я могу быть рядом, но только если ты уважаешь мои решения.',[['Повторить свою границу.',{trust:2,flag:'clear_rules'}],['Обнять её, чтобы успокоить.',{attachment:2,flag:'comforted_alice'}]]),
S(3,'Алиса','Я попробую. Не обещаю, что сразу получится.',null,'memory','alice_vulnerable'),
S(3,'Мия','Ты сказала ей о границах? Я рада. Главное — смотри не на обещания, а на поступки.',null,'hall','mia_worried',{flag:'clear_rules'}),
S(3,'Мия','Если решишь утешить её, это твоё право. Только не забывай и о себе.',null,'hall','mia_worried',{flag:'comforted_alice'}),
S(3,'Мысли','Её ответ прозвучал честно. Но я заметила, что она ни разу не извинилась перед Мией.'),
// CHAPTER 5 - warnings and tragedy
S(4,'Знакомый','Кира, пойдёшь с нами после занятий? Мы собираемся в кафе.'),
S(4,'Ты','Алиса, я сегодня встречусь с ребятами. Увидимся позже.'),
S(4,'Алиса','Как мило. Ты уже нашла себе новую компанию?','', 'hall','alice_cold'),
S(4,'Ты','Это просто знакомые. Не начинай.'),
S(4,'Алиса','Я даже не начинала. Просто запоминаю тех, кто отнимает у меня твоё время.'),
S(4,'Мысли','На следующий день знакомый перестал появляться на занятиях. Алиса сказала, что он перевёлся. Слишком быстро и слишком спокойно.','', 'memory','missing_student'),
S(4,'Мия','Я узнала, что Алиса ему угрожала. Кира, это уже не ревность. Это опасно.'),
S(4,'Ты','Я верю тебе. Давай не оставлять тебя одну с этим разговором.','', 'night',null,{flag:'trusted_mia'}),
S(4,'Мия','Спасибо. Я боялась, что ты решишь, будто я просто ревную или пытаюсь вас поссорить.','', 'night',null,{flag:'trusted_mia'}),
S(4,'Ты','Я хочу услышать обе стороны. Но закрывать глаза не стану.','', 'night',null,{flag:'waited_alice'}),
S(4,'Мия','Тогда хотя бы пообещай, что будешь осторожна. Я не хочу однажды потерять тебя.'),
S(4,'Ты','Обещаю. Ты моя лучшая подруга, Мия.'),
S(4,'Мия','Я рада, что ты мне поверила. Тогда давай завтра после занятий снова сходим за какао.',null,'night','mia_serious',{flag:'trusted_mia'}),
S(4,'Мысли','Я убеждала себя, что Мия преувеличивает. Но её тревожный взгляд не выходил из головы.',null,'night','quiet_stairs',{flag:'waited_alice'}),
S(4,'Мия','И ты моя. Даже если однажды мы будем спорить из-за какой-нибудь глупости.'),
S(4,'Мысли','Я вернулась за телефоном в пустой корпус. На лестнице спорили два знакомых голоса.','', 'night','quiet_stairs'),
S(4,'Мия','Алиса, послушай себя. Ты не можешь выбирать за неё, с кем ей дружить.'),
S(4,'Алиса','Я не выбираю. Я просто хочу, чтобы она наконец увидела, кто всегда рядом.'),
S(4,'Мия','Это не любовь, если человеку страшно сказать тебе «нет».','', 'hall','mia_serious'),
S(4,'Алиса','Ты опять учишь её жить? Я ведь просила не вмешиваться.','', 'hall','alice_cold'),
S(4,'Мия','Я не боюсь тебя. И Кира тоже не должна.'),
S(4,'Алиса','Тогда тебе стоило подумать, прежде чем вставать между нами.'),
S(4,'Мысли','Дверь была приоткрыта. Я услышала резкий звук и короткий вскрик. Когда тишина вернулась, Алиса стояла одна. Подробностей я не увидела — только Миина заколка у порога.','', 'hall','last_witness'),
S(4,'Мысли','Коридор расплылся перед глазами. В дальнем конце стояла Алиса, а рядом на полу осталась сумка Мии. Я не смогла заставить себя подойти ближе.','', 'hall','mia_aftermath'),
S(4,'Алиса','Не смотри туда. Посмотри на меня. Пожалуйста.','', 'hall','alice_cold'),
S(4,'Мысли','Мир будто выключил звук. На полу лежала заколка, которую Мия никогда не снимала.','', 'hall','mia_clip'),
S(4,'Алиса','…Ты здесь. Я так хотела, чтобы сегодня всё прошло иначе.','', 'hall','alice_cold'),
S(4,'Ты','Где Мия? Что ты сделала?'),
S(4,'Алиса','Не заставляй меня отвечать сейчас. Пожалуйста. Пойдём со мной.'),
S(4,'Ты','Что мне делать?',[['Позвать на помощь и попытаться уйти.',{trust:2,suspicion:2,flag:'called_help'}],['Выиграть время разговором, не обещая ей ничего.',{attachment:1,flag:'bought_time'}]]),
S(4,'Мысли','Я не знала, что случилось за дверью. Но знала: Мия не вернётся к нашему столику.','', 'hall','empty_cafe'),
// CHAPTER 6 — captivity / aftermath
S(5,'Ты','Ты заперла дверь. Это не забота, Алиса.','', 'room','room_door'),
S(5,'Алиса','Мия пыталась убедить тебя, что я чудовище. Ты ведь тоже так думаешь?','', 'room','alice_vulnerable'),
S(5,'Ты','Мия пыталась меня защитить. И я не собираюсь делать вид, что её предупреждения ничего не значили.'),
S(5,'Алиса','Ты всё ещё защищаешь её. Даже теперь. Я не знаю, как перестать злиться на это.'),
S(5,'Ты','Ты можешь злиться. Но не имеешь права удерживать меня.'),
S(5,'Алиса','Я не причиню тебе смертельного вреда. Я хочу, чтобы ты осталась. И ненавижу, что теперь ты можешь бояться меня.'),
S(5,'Ты','Ты понимаешь, что я не могу просто забыть Мию?',[['Сказать, что никогда не оправдаешь случившееся.',{trust:2,flag:'refused_excuses'}],['Попросить рассказать правду, не перебивая.',{attachment:1,flag:'asked_truth'}]]),
S(5,'Алиса','Я не прошу простить меня сегодня. Просто побудь рядом, пока я не перестану дрожать.','', 'room','alice_vulnerable'),
S(5,'Мысли','Она поставила на стол чай и отодвинулась, оставляя между нами расстояние. Это было почти похоже на нормальную заботу.'),
S(5,'Алиса','Я помню твой любимый чай. Помню, как ты смеёшься, когда пытаешься не засмеяться. Я помню всё.'),
S(5,'Ты','Память о человеке не даёт права распоряжаться его жизнью.'),
S(5,'Алиса','Знаю. Но мне страшно открыть дверь и снова стать для тебя никем.','', 'room','alice_cold'),
// CHAPTER 7
S(6,'Алиса','Я приготовила завтрак. Не знала, что ты захочешь, поэтому сделала два варианта.','', 'room','breakfast'),
S(6,'Ты','Ты можешь быть заботливой и пугающей почти одновременно.'),
S(6,'Алиса','Я знаю. Не прошу забыть, какая я. Просто хочу, чтобы ты увидела и другую сторону.'),
S(6,'Ты','Забота не должна быть платой за послушание.'),
S(6,'Алиса','Можно я сяду рядом? Только если ты сама этого хочешь.','', 'room','alice_vulnerable'),
S(6,'Ты','Сесть рядом — не значит, что я тебя простила.'),
S(6,'Алиса','Я поняла.'),
S(6,'Мысли','За окном шёл дождь. Впервые за долгое время никто не пытался заполнить тишину.'),
S(6,'Алиса','Я иногда представляю, что мы могли бы жить обычной жизнью. Ты споришь со мной из-за музыки, Мия смеётся…'),
S(6,'Ты','Не используй её память, чтобы сделать вид, будто ничего не случилось.'),
S(6,'Алиса','Прости. Я не должна была.','', 'room','alice_vulnerable'),
// CHAPTER 8
S(7,'Ты','Я нашла фотографию. Это было до того, как мы познакомились.','', 'memory','alice_past'),
S(7,'Алиса','Тогда я ещё думала, что если буду достаточно хорошей, люди не станут уходить.'),
S(7,'Ты','А потом ты решила, что можешь удерживать людей силой.'),
S(7,'Алиса','Я не собираюсь просить тебя назвать это случайностью. Я сделала то, чего нельзя отменить.'),
S(7,'Ты','Расскажи, что произошло. Всю правду.',['Я хочу знать всё, даже если это изменит мои чувства.',{trust:2,flag:'demanded_truth'}], 'memory'),
S(7,'Алиса','Я сорвалась, когда Мия сказала, что уведёт тебя от меня. Я хотела заставить её замолчать. Потом поняла, что перешла черту, которую уже не вернуть.'),
S(7,'Ты','Ты должна ответить за то, что сделала. И я не буду хранить это в секрете.'),
S(7,'Алиса','Я боюсь, что после этого ты уйдёшь.'),
S(7,'Ты','Ты не можешь требовать от меня обещания.'),
S(7,'Алиса','Я знаю. Наверное, впервые по-настоящему знаю.','', 'memory','alice_vulnerable'),
// CHAPTER 9
S(8,'Мысли','Утро пришло незаметно. Алиса сидела у окна, сжимая в руках чашку, которая давно остыла.','', 'window','final_moment'),
S(8,'Алиса','Я могу открыть дверь. Но не могу обещать, что не испугаюсь твоего ухода.'),
S(8,'Ты','Мне нужно выйти. Мне нужно понять, что произошло, и поговорить с теми, кто может помочь.'),
S(8,'Алиса','Если я открою, ты не вернёшься.'),
S(8,'Ты','Я не могу обещать возвращение. Но могу сказать, что честность — единственный шанс что-то изменить.'),
S(8,'Алиса','Я хочу попробовать. Даже если мне будет страшно.'),
S(8,'Мысли','Она положила ключ на стол и отошла. Между нами впервые появилась настоящая возможность выбора.','', 'window','door_open'),
S(8,'Ты','Что для меня сейчас важнее?',[['Сохранить границы и потребовать ответственности.',{trust:3,flag:'choose_accountability'}],['Остаться на разговор и не торопить решение.',{attachment:2,flag:'choose_patience'}]]),
S(8,'Алиса','Я выслушаю. И не стану удерживать тебя, если ты решишь уйти.'),
S(8,'Мысли','За окном светлело. Я вспомнила Мию — не заколку и не лестницу, а её смех над слишком сладким какао.','', 'memory','mia_memory'),
// CHAPTER 10
S(9,'Алиса','Если мы останемся рядом, я хочу услышать это не из страха. Скажи, чего хочешь ты.','', 'window','final_moment'),
S(9,'Ты','Я хочу, чтобы между нами больше не было лжи. И чтобы ты научилась отпускать мою руку, не считая это концом.'),
S(9,'Мысли','Впервые за долгое время решение действительно принадлежало мне. Что я отвечу?'),
S(9,'Ты','Какой путь выбрать?',[['Тихое обещание — начать заново, но только с честностью и помощью.',{trust:3,ending:'Тихое обещание',requires:{trust:3,flag:'choose_accountability'}}],['Хрупкое равновесие — остаться рядом сейчас, решая всё постепенно.',{attachment:2,ending:'Хрупкое равновесие',requires:{attachment:2}}],['Своя воля — выбрать близость, не отказываясь от самостоятельности.',{trust:2,attachment:1,ending:'Своя воля',requires:{trust:4,flag:'clear_rules'}}]]),
S(9,'Мысли','Я не знала, каким будет завтра. Но впервые могла сделать следующий шаг сама.','', 'window','final_moment')
];
const galleryMeta=[
 ['first_meeting','Встреча под сакурой','cg_sakura_duo.jpg'],['sunny_day','Солнечный день','scene_school.jpg'],['alice_smile','Улыбка Алисы','alice_warm.jpg'],['cafe','Какао втроём','cg_cafe_duo.jpg'],['alice_past','Дождливое воспоминание','cg_alice_rain.jpg'],['missing_student','Тревожные слухи','cg_alice_hall.jpg'],['quiet_stairs','Пустая лестница','cg_stair_tension.jpg'],['mia_serious','Последний разговор','mia_serious.jpg'],['last_witness','Последний свидетель','cg_stair_tension.jpg'],['mia_aftermath','Размытый силуэт','cg_mia_aftermath.jpg'],['mia_clip','Заколка Мии','cg_mia_aftermath.jpg'],['empty_cafe','Пустой столик','scene_cafe.jpg'],['room_door','Закрытая дверь','scene_room.jpg'],['breakfast','Завтрак на двоих','cg_alice_rain.jpg'],['door_open','Ключ на столе','scene_room.jpg'],['mia_memory','Память о Мие','cg_sakura_duo.jpg'],['final_moment','Перед рассветом','cg_alice_rain.jpg'],['friends_window','Разговор у окна','cg_cafe_duo.jpg'],['alice_shadow','Тень в коридоре','cg_stair_tension.jpg'],['quiet_after','Тишина после','cg_mia_aftermath.jpg']
];
const achievementDefs=[
 ['Первый день','Начать новую историю.',s=>s.step>=0],['Старые друзья','Выбрать время вдвоём с Мией.',s=>s.flags.mia_first],['Тёплый круг','Позвать Алису в компанию.',s=>s.flags.invite_alice||s.flags.welcomed_alice],['Личное пространство','Обозначить границы в переписке.',s=>s.flags.space_boundary],['Слишком близко','Пообещать Алисе постоянный контакт.',s=>s.flags.constant_contact],['Довериться Мие','Принять предупреждение Мии всерьёз.',s=>s.flags.trusted_mia],['Не спешить с выводами','Решить выслушать обе стороны.',s=>s.flags.waited_alice],['Чёткие правила','Обозначить правила отношений.',s=>s.flags.clear_rules],['Утешение','Поддержать Алису в уязвимый момент.',s=>s.flags.comforted_alice],['Не молчать','Позвать на помощь.',s=>s.flags.called_help],['Выиграть время','Попытаться выиграть время разговором.',s=>s.flags.bought_time],['Без оправданий','Отказаться оправдывать поступок Алисы.',s=>s.flags.refused_excuses],['Правда целиком','Потребовать полной правды.',s=>s.flags.demanded_truth],['Ответственность','Выбрать ответственность вместо обещаний.',s=>s.flags.choose_accountability],['Терпение','Выбрать спокойный разговор.',s=>s.flags.choose_patience],['Беречь дружбу','Поддержать Мию и поверить её предупреждению.',s=>s.flags.trusted_mia],['Собственная воля','Сохранить личные границы.',s=>s.flags.clear_rules&&s.flags.choose_accountability],['До самого финала','Открыть любую концовку.',s=>s.finished],['Коллекционер','Открыть не менее 8 сюжетных кадров.',s=>s.galleryCount>=8],['Все варианты','Открыть все три концовки.',s=>s.allEndings]
];
function mergeUnique(a,b,key){const out=[...(a||[])];for(const x of b||[]){const id=key?x?.[key]:x;if(!out.some(y=>(key?y?.[key]:y)===id))out.push(x)}return out}
function safeParse(v){try{return JSON.parse(v)}catch{return null}}
function loadArchive(){let a=safeParse(localStorage.getItem(ARCHIVE_KEY));if(!a){for(const k of LEGACY_ARCHIVE_KEYS){a=safeParse(localStorage.getItem(k));if(a)break}}archive={...blankArchive(),...(a||{}),endings:(a?.endings||a?.unlocked||[]),gallery:(a?.gallery||[]),achievements:(a?.achievements||[]).map(x=>typeof x==='string'?{name:x,desc:''}:x)};archive.endings=mergeUnique(archive.endings,[]);archive.gallery=mergeUnique(archive.gallery,[]);archive.achievements=mergeUnique(archive.achievements,[],'name')}
function saveArchive(){try{localStorage.setItem(ARCHIVE_KEY,JSON.stringify(archive))}catch(e){console.warn('Archive could not be saved',e)}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saveArchive();$('#saveStatus').textContent='Сохранено';}catch(e){$('#saveStatus').textContent='Не удалось сохранить';}}
function load(){let data=safeParse(localStorage.getItem(SAVE_KEY));let legacy=false;if(!data){for(const k of LEGACY_SAVE_KEYS){data=safeParse(localStorage.getItem(k));if(data){legacy=true;break}}}if(data){state={...defaults(),...data,flags:{...(data.flags||{})}};if(legacy)state.step=Math.min(story.length-1,Math.round((Number(data.step)||0)/95*(story.length-1)));}loadArchive();}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function formatName(n,script){if(script!=='latin')return n;const map={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};return n.split('').map(ch=>{const lo=ch.toLowerCase(),v=map[lo];return v===undefined?ch:(ch===ch.toUpperCase()?v.charAt(0).toUpperCase()+v.slice(1):v)}).join('')}
function begin(){loadArchive();state={...defaults(),name:formatName($('#heroName').value.trim()||'Героиня',$('#nameScript').value),nameScript:$('#nameScript').value,look:$('#heroLook').value,eyes:$('#heroEyes').value};archive.achievements=mergeUnique(archive.achievements,[{name:'Первый день',desc:'Начато новое прохождение.'}],'name');save();show('story');render()}
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('hidden',x.id!==id));}
function chapterOf(i){return story[i]?.c??9}
function gateOK(g){if(!g)return true;if(g.flag&&!state.flags[g.flag])return false;if(g.notFlag&&state.flags[g.notFlag])return false;return true}
function canChoose(e){const r=e.requires||{};if(r.trust!==undefined&&state.trust<r.trust)return false;if(r.attachment!==undefined&&state.attachment<r.attachment)return false;if(r.flag&&!state.flags[r.flag])return false;return true}
function apply(e){for(const k of ['trust','attachment','jealousy','suspicion'])state[k]=Math.max(0,(state[k]||0)+(e[k]||0));if(e.flag)state.flags[e.flag]=true;}
function achievement(name,desc){if(!archive.achievements.some(x=>x.name===name)){archive.achievements.push({name,desc});saveArchive()}}
function checkAchievements(){const snapshot={...state,finished:archive.endings.length>0,galleryCount:archive.gallery.length,allEndings:archive.endings.length>=3};for(const [n,d,test] of achievementDefs)if(test(snapshot))achievement(n,d)}
function unlockCG(id){if(!id)return;if(!archive.gallery.includes(id)){archive.gallery.push(id);saveArchive()}}
function unlockEnding(title){if(!archive.endings.includes(title))archive.endings.push(title);checkAchievements();achievement('До самого финала','Открыта концовка: '+title+'.');if(archive.endings.length>=3)achievement('Все варианты','Открыты все три концовки.');saveArchive()}
function setMood(m){if(currentMood!==m){currentMood=m;if(musicOn)playMusic()}}
function render(){const s=story[state.step];if(!s){show('home');return}const ch=chapterOf(state.step);document.body.dataset.era=ch===0?'bright':ch<4?'warm':'dusty';setMusic(s.cg==='mia_aftermath'||s.cg==='mia_clip'?'aftermath':s.cg==='last_witness'?'reveal':ch===0?'bright':ch===1?'playful':ch===4?'tension':ch>=5?'dusty':s.who==='Мия'?'mia':'warm');$('#chapterLabel').textContent=chapters[ch][0];$('#chapterCount').textContent=String(ch+1).padStart(2,'0')+' / 10';$('#artCaption').textContent=chapters[ch][1];$('#sceneArt').dataset.bg=s.bg;const imageMap={school:'cg_sakura_duo.jpg',cafe:'cg_cafe_duo.jpg',rain:'scene_cafe.jpg',hall:'cg_stair_tension.jpg',night:'cg_stair_tension.jpg',memory:'cg_alice_rain.jpg',room:'scene_room.jpg',window:'cg_alice_rain.jpg'};const cgMap=Object.fromEntries(galleryMeta.map(x=>[x[0],x[2]]));$('#sceneArt').style.backgroundImage='none';$('#sceneArt').style.setProperty('--scene-image',`url('assets/${cgMap[s.cg]||imageMap[s.bg]||imageMap.school}')`);$('#sceneArt').classList.toggle('aftermath-scene',s.cg==='mia_aftermath'||s.cg==='mia_clip');$('#sceneArt').classList.toggle('high-tension',s.cg==='last_witness'||s.cg==='mia_aftermath');unlockCG(s.cg);const speaker=s.who==='Ты'?state.name:s.who;$('#speaker').textContent=speaker;$('#line').textContent=s.text.replaceAll('ГГ',state.name).replaceAll('{name}',state.name);const portrait=$('#characterPortrait');let p='';if(s.who==='Алиса')p=(s.cg==='alice_cold'||s.bg==='hall'?'alice_cold.jpg':s.cg==='alice_vulnerable'||s.bg==='memory'?'alice_vulnerable.jpg':'alice_warm.jpg');if(s.who==='Мия')p=(ch>=4?'mia_serious.jpg':ch>=3?'mia_worried.jpg':'mia_happy.jpg');portrait.innerHTML=p?`<img src="assets/${p}" alt="${escapeHTML(s.who)}">`:'';portrait.classList.toggle('visible',!!p);$('#stats').textContent=`Доверие ${state.trust} · Привязанность ${state.attachment} · Ревность ${state.jealousy} · Подозрения ${state.suspicion}`;$('#choices').innerHTML='';$('#next').classList.toggle('hidden',!!s.choices);if(s.choices){const available=s.choices.filter(([,e])=>canChoose(e));available.forEach(([label,e])=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{apply(e);if(e.ending){unlockEnding(e.ending);state.finished=true;save();showEnding(e.ending)}else advance()};$('#choices').append(b)});if(!available.length){const b=document.createElement('button');b.textContent='Продолжить';b.onclick=advance;$('#choices').append(b)}}checkAchievements();save();}
function advance(){let n=state.step+1;while(n<story.length&&!gateOK(story[n].gate))n++;if(n>=story.length){show('home');return}state.step=n;render()}
function showEnding(title){setMusic('ending');const text={'Тихое обещание':'Ты не стала отрицать чувства, но потребовала честности, ответственности и помощи. Это не мгновенное прощение, а трудный первый шаг.','Хрупкое равновесие':'Ты решила не принимать окончательного решения сегодня. Между вами остаётся хрупкая связь, которой ещё предстоит пройти проверку временем.','Своя воля':'Ты не отказалась от себя и не позволила страху принять решение за тебя. Будущее остаётся неопределённым, но теперь выбор принадлежит тебе.'};$('#endingTitle').textContent=title;$('#endingText').textContent=text[title];show('ending');}
function collection(type){loadArchive();const root=$('#libraryContent');root.innerHTML='';$('#libraryTitle').textContent=({endings:'Открытые концовки',gallery:'Галерея сюжетных кадров',achievements:'Достижения',dossier:'Досье персонажей'})[type];if(type==='endings'){const all=['Тихое обещание','Хрупкое равновесие','Своя воля'];root.innerHTML=all.map(n=>`<article class="entry ${archive.endings.includes(n)?'':'locked'}"><h3>${archive.endings.includes(n)?n:'???'}</h3><p>${archive.endings.includes(n)?'Концовка открыта.':'Заверши историю другим путём, чтобы узнать финал.'}</p><small>${archive.endings.includes(n)?'ОТКРЫТО':'ЗАКРЫТО'}</small></article>`).join('')+`<p class="collection-progress">Открыто: ${archive.endings.length} / 3</p>`}
if(type==='gallery'){root.innerHTML=`<p class="collection-progress">Открыто иллюстраций: ${archive.gallery.length} / ${galleryMeta.length}</p><div class="gallery-grid">${galleryMeta.map(([id,title,file])=>archive.gallery.includes(id)?`<button class="gallery-card" data-image="${file}" data-title="${title}"><img src="assets/${file}" alt="${title}"><span>${title}</span><small>ОТКРЫТО · нажми для просмотра</small></button>`:`<div class="gallery-card locked"><div class="gallery-lock">♡</div><span>Скрытая иллюстрация</span><small>ОТКРОЕТСЯ ВО ВРЕМЯ ИСТОРИИ</small></div>`).join('')}</div>`}
if(type==='achievements'){root.innerHTML=`<p class="collection-progress">Получено: ${archive.achievements.length} / ${achievementDefs.length}</p>`+achievementDefs.map(([n,d])=>{const got=archive.achievements.find(x=>x.name===n);return `<article class="entry ${got?'':'locked'}"><h3>${got?n:'Скрытое достижение'}</h3><p>${got?(got.desc||d):'Условие откроется после соответствующего решения.'}</p><small>${got?'ПОЛУЧЕНО':'ЗАКРЫТО'}</small></article>`}).join('')}
if(type==='dossier'){const names={dark:'тёмные',light:'светлые',copper:'медные'},eyes={brown:'карие',blue:'голубые',green:'зелёные',grey:'серые'};root.innerHTML=`<article class="entry"><h3>${escapeHTML(state.name)}</h3><p>Главная героиня. Волосы: ${names[state.look]}; глаза: ${eyes[state.eyes]}. Её решения формируют историю.</p></article><article class="entry"><h3>Алиса</h3><p>Длинные чёрные волосы. Эмоционально нестабильная, ревнивая и опасная для тех, кого считает угрозой. К героине испытывает сильную привязанность, но постепенно сталкивается с последствиями собственного контроля.</p></article><article class="entry"><h3>Мия</h3><p>Лучшая подруга героини. Тёплая, остроумная и внимательная. Она первой замечает, что поведение Алисы становится опасным. Её гибель — центральное событие истории.</p></article>`}
show('library')}
function exportData(){const pack={version:9,save:state,archive};const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ylmq-save-backup.json';a.click();URL.revokeObjectURL(url)}
function importData(file){const r=new FileReader();r.onload=()=>{const p=safeParse(r.result);if(!p||!p.save||!p.archive){alert('Файл сохранения не распознан.');return}state={...defaults(),...p.save,flags:{...(p.save.flags||{})}};archive={...blankArchive(),...p.archive};save();alert('Сохранение и коллекция восстановлены.');show('home')};r.readAsText(file)}
const soundtrack={bright:'ost_bright.wav',playful:'ost_bright.wav',warm:'ost_mia.wav',mia:'ost_mia.wav',tension:'ost_tension.wav',reveal:'ost_tension.wav',aftermath:'ost_aftermath.wav',dusty:'ost_dusty.wav',ending:'ost_ending.wav'};
function playMusic(){if(!musicOn)return;const file=soundtrack[currentMood]||soundtrack.warm;if(activeTrack&&activeTrack.src.endsWith(file)){activeTrack.volume=volume;activeTrack.play().catch(()=>{});return}if(activeTrack){activeTrack.pause();activeTrack.currentTime=0}activeTrack=new Audio('assets/'+file);activeTrack.loop=true;activeTrack.volume=volume;activeTrack.preload='auto';activeTrack.play().catch(()=>{});}
function stopMusic(){if(activeTrack){activeTrack.pause();activeTrack.currentTime=0}}
function setMusic(m){if(currentMood!==m){currentMood=m;if(musicOn)playMusic()}}
$('#musicBtn').addEventListener('click',()=>{musicOn=!musicOn;$('#musicBtn').textContent='♫ Музыка: '+(musicOn?'вкл.':'выкл.');if(musicOn)playMusic();else stopMusic()});
async function enterImmersive(){document.body.classList.add('immersive');try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{}try{if(screen.orientation?.lock)await screen.orientation.lock('landscape')}catch{}document.body.classList.add('is-fullscreen');updateRotateHint()}
function updateRotateHint(){const hint=$('#rotateHint');if(!hint)return;if(document.body.classList.contains('immersive')&&window.matchMedia('(orientation: portrait)').matches)hint.classList.remove('hidden');else hint.classList.add('hidden')}
window.addEventListener('orientationchange',updateRotateHint);window.addEventListener('resize',updateRotateHint);
$('#immersiveBtn').addEventListener('click',enterImmersive);$('#storyFullscreen').addEventListener('click',enterImmersive);document.addEventListener('fullscreenchange',()=>document.body.classList.toggle('is-fullscreen',!!document.fullscreenElement));
$('#begin').addEventListener('click',begin);$('#next').addEventListener('click',advance);$('#continueBtn').addEventListener('click',()=>{load();show('story');render()});$('#settingsBtn').addEventListener('click',()=>show('settings'));$('#volume').addEventListener('input',e=>{volume=Number(e.target.value)/100;if(activeTrack)activeTrack.volume=volume});
document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='new')show('profile');if(action==='home')show('home');if(action==='endings')collection('endings');if(action==='gallery')collection('gallery');if(action==='achievements')collection('achievements');if(action==='dossier')collection('dossier');if(action==='save')save();const card=e.target.closest('[data-image]');if(card){$('#lightboxImage').src='assets/'+card.dataset.image;$('#lightboxTitle').textContent=card.dataset.title;$('#imageLightbox').classList.remove('hidden')}if(e.target.id==='lightboxClose'||e.target.id==='imageLightbox')$('#imageLightbox').classList.add('hidden')});
$('#exportSave').addEventListener('click',exportData);$('#importSave').addEventListener('change',e=>{if(e.target.files[0])importData(e.target.files[0])});$('#endingMenu').addEventListener('click',()=>show('home'));$('#endingReplay').addEventListener('click',()=>show('profile'));
$('#heroName').addEventListener('input',e=>$('#namePreview').textContent=e.target.value||'Героиня');
function loadHome(){load();if(localStorage.getItem(SAVE_KEY)||LEGACY_SAVE_KEYS.some(k=>localStorage.getItem(k)))$('#continueBtn').classList.remove('hidden');}
loadHome();
