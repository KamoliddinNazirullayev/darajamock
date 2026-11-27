#!/usr/bin/env python3
"""7-variant (TMS II) — skan PDF'dan qo'lda transkripsiya qilingan ma'lumot.
Natija: data/v07.json. Apostroflar: oʻ gʻ (U+02BB), tutuq belgisi ʼ (U+02BC).
Barcha savollar verified=false. Javob kaliti — mualliflarniki (qizil rang)."""
import json, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "exams" / "v07.json"

def single(no, pts, stem, opts, correct, items=None, flags=None, page=None, kind="single", **kw):
    q = {"no": no, "type": kind, "points": pts, "stem": stem, "items": items,
         "options": dict(zip("ABCD", opts)), "correct": correct,
         "flags": flags or [], "verified": False, "src_page": page}
    q.update(kw)
    return q

def chron(no, pts, stem, items, opts, correct, page, flags=None):
    return single(no, pts, stem, opts, correct, items=items, kind="chronology", page=page, flags=flags)

def matching(no, pts, stem, left, right, opts, correct, page, flags=None):
    return single(no, pts, stem, opts, correct, kind="matching", page=page, flags=flags,
                  left=left, right=right)

def table(no, pts, stem, table_, facts, opts, correct, page, kind="table_fill", flags=None):
    return single(no, pts, stem, opts, correct, kind=kind, page=page, flags=flags,
                  table=table_, facts=facts)

def op(no, stem, parts, page, flags=None):
    return {"no": no, "type": "open", "stem": stem, "parts": parts, "flags": flags or [],
            "verified": False, "src_page": page}

def part(label, prompt, pts, ans, kind="text"):
    return {"label": label, "prompt": prompt, "points": pts, "kind": kind, "accepted": ans}

Q = []
# ---- 1-5 (1-bet) ----
Q.append(single(1, 1.3, "Oʻrta asrlarda Germaniya shimolidagi shaharlarning yuksalishi qaysi voqea ortida yuz berganligini aniqlang.",
    ["Dengizdagi savdoda Daniya qiroli bilan ittifoq tuzganligi",
     "Nemis knyazlari, salibchi ritsarlarning Boltiq boʻyidagi istilolari",
     "XIV asrning 70-yillarida Daniya qiroliga zarba berganligi",
     "Fridrix II ning Italiyadagi muvaffaqiyati"], "B", page=1))
Q.append(single(2, 2.2, "XIX asrning oʻrtalarida Sharqiy Turkistonda Xitoyga qarshi Jahongirxoʻja va ukasi Yusufxoʻja qoʻzgʻalonining magʻlubiyatga uchrashi qaysi jarayon natijasida sodir boʻldi?",
    ["moliyaviy qiyinchiliklar sababli;", "Yusufxoʻjaning taslimchilik siyosati;",
     "Xitoy hukumatining katta qoʻshinidan yengilishi;",
     "qoʻzgʻalonchilar safida birlik yoʻqligi, Qoʻqon oʻz qoʻshinini chaqirib olganligi"], "D", page=1))
Q.append(single(3, 1.3, "Qadimgi dunyo tarixida aholisi ogʻir mehnat va salomatlikka zarar yetkazuvchi ishlardan ozod qilingan davlatni aniqlang.",
    ["Rim", "Afina", "Misr", "Sparta"], "B", page=1))
Q.append(chron(4, 3.2, "Quyidagi tarixiy voqealar (maʼlumotlar) toʻgʻri xronologik ketma-ketlikda koʻrsatilgan javobni toping.",
    [{"text": "Panama kanali qurilishi tugallandi", "year": 1914},
     {"text": "Germaniyada yakshanba dam olish kuni deb eʼlon qilindi", "year": 1891},
     {"text": "Fransiya Tunisni bosib oldi", "year": 1881},
     {"text": "Albaniya mustaqillikka erishdi", "year": 1912},
     {"text": "Fransiya pensiya toʻgʻrisida qonun qabul qildi", "year": 1910},
     {"text": "“Uchlar ittifoqi” tashkil etildi", "year": 1882}],
    ["2, 1, 3, 4, 5, 6", "3, 2, 1, 4, 5, 6", "3, 6, 2, 5, 4, 1", "2, 3, 1, 4, 6, 5"], "C", 1))
Q.append(matching(5, 3.2, "Quyida berilgan atamalar va ularning izohi toʻgʻri moslashtirilgan javobni toping.",
    {"I": "Taktika", "II": "Pozitsiya", "III": "Retsessiya", "IV": "Subsidiya"},
    {"a": "Holat, maʼlum voqea yoki hodisaga nisbatan munosabat",
     "b": "Iqtisodiyotda ishlab chiqarishning nisbatan moʼtadil pasayishini yoki iqtisodiy oʻsish sur’atlarining sekinlashuvi",
     "c": "Davlat yoki boshqa biron-bir muassasa tomonidan boshqa davlat, muassasa, alohida shaxsga koʻrsatiladigan moliyaviy yordam",
     "d": "Mafkuraviy rejim shakli boʻlib, totalitar jamiyatda aholini keng miqyosda ommaviy ravishda mafkuraviy qayta tarbiyalash vositasidir",
     "e": "Koʻzlangan maqsadga erishish uchun qoʻllaniladigan usul va vositalar yigʻindisi",
     "f": "Suveren davlatlar oʻrtasida tovarlar, xizmatlar, moliya, investitsiya, ishchi kuchi erkin harakatlanadigan iqtisodiy kenglikni tashkil qilish"},
    ["I-b, II-e, III-f, IV-c", "I-b, II-f, III-b, IV-c", "I-e, II-a, III-b, IV-c", "I-a, II-e, III-b, IV-c"], "C", 1,
    flags=["Manba matni: 'moʼtadil' — skanda 'moʻtadil' shaklida; 'sur’atlarining' belgisi tekshirilsin"]))
# ---- 6-9 (2-bet) ----
Q.append(matching(6, 3.2, "Quyida berilgan atamalar va ularning izohi toʻgʻri moslashtirilgan javobni toping.",
    {"I": "Bakalavr", "II": "Aeronavigatsiya", "III": "Skrining", "IV": "Baynalmilal"},
    {"a": "Maxsus usullar yordamida kasallikni erta va tez aniqlash uchun aholini ommaviy tekshirishdan oʻtkazish",
     "b": "Xalqaro, umuminsoniy, umumxalqiy mazmunlarda qoʻllaniladi",
     "c": "Oliy taʼlim dasturining birinchi bosqichini tugallagan talabalarning ilmiy darajasi",
     "d": "Uchish apparatlarini tegishli asbob va vositalar yordamida belgilangan yoʻldan olib borish haqidagi fan",
     "e": "Diniy ishonch, eʼtiqod; shu bilan birga mazhab mazmuniga ega tushuncha",
     "f": "Xristian cherkovlari uchun ruhoniylar tayyorlaydigan oʻquv yurti"},
    ["I-c, II-d, III-a, IV-b", "I-c, II-d, III-f, IV-b", "I-c, II-d, III-a, IV-e", "I-f, II-d, III-a, IV-b"], "A", 2))
Q.append(single(7, 2.2, "Tarixiy shaxsni aniqlang.\nU oʻz davrining yirik madaniyat va davlat arbobi edi. U vatanini dunyoning eng rivojlangan davlatlari qatoriga koʻrishni istagan, vatanini tashqi dunyo bilan bogʻlashga intilgan, ilgʻor gʻoyalar bilan toʻlib-toshgan inson edi.",
    ["Bobooxun Salimov", "Islomxoʻja", "Ismoil Gʻaspirali", "U.Asadullaxoʻjayev"], "B", page=2,
    flags=["Variant C skanda 'Ismoil Gʻspirali' — imlo xatosi, 'Gaspirali' bo‘lishi mumkin"]))
Q.append(single(8, 2.2, "Tarixiy shaxsni aniqlang.\nU oʻrta asrlarning qobiliyatli, sergʻayrat va nihoyatda zukko davlat arbobi edi. U Movarounnahrni birlashtirib, mustahkam davlat tuzishga intildi.",
    ["Amir Temur", "Husayn Boyqaro", "Tohir Ibn Husayn", "Ismoil Somoniy"], "D", page=2))
Q.append(single(9, 2.2, "Tarixiy davlatni aniqlang.\nXVIII asr boshlariga kelib, imperiya parchalana boshladi. Armiya oʻzining avvalgi qudratini yoʻqotdi, mahalliy hukmdorlarning mustaqilligi oshdi. Hukmdorlarning hokimiyati tobora zaiflashib bordi. Mamlakat feodal tarqoqlikka qaytib, yevropaliklarning kirib kelishi uchun qulay sharoit yaratildi.",
    ["Xitoy", "Hindiston", "Turkiya", "Eron"], "B", page=2))
# ---- 10-15 (3-bet) ----
Q.append(single(10, 2.2, "Quyida berilgan maʼlumotlar qaysi tarixiy davlat haqida ekanligini aniqlang.\nSoliqlar mahalliy amaldorlar tomonidan barot (ijara) tartibida avvaldan bir yoʻlla toʻlab yuborilardi, soʻngra ular aholidan yigʻib olinardi. Aholidan yigʻib olish paytlarida soliqlar, shubhasiz, rasmiylashtirilgan miqdordan oshirib undirilardi.",
    ["Chigʻatoy ulusi", "Qoraxoniylar davlati", "Gʻarbiy turk xoqonligi", "Eftallar davlati"], "A", page=3))
Q.append(table(11, 3.2, "Jadvalda harflar bilan belgilangan kataklarga quyida berilgan maʼlumotlardan moslarini qoʻyib toʻgʻri javobni toping.",
    {"headers": ["Davlat", "Inshoatlar", "Davri (asr,yil)"],
     "rows": [["Xitoy", "a", "618-907"], ["b", "Temir ustun", "c"], ["Koreya", "d", "e"]]},
    ["Qutb minor", "Budda haykali", "Hindiston", "Pulguksa", "V-VI", "XIII", "XIV", "XV"],
    ["a-2, b-1, c-5, d-4, e-7", "a-2, b-3, c-5, d-4, e-8", "a-3, b-1, c-2, d-5, e-7", "a-2, b-6, c-5, d-6, e-7"], "B", 3))
Q.append(single(12, 1.3, "Quyida berilgan maʼlumotlardan qaysi biri XIX asr Oʻrta Osiyo davlatlari tarixi uchun xos emas?",
    ["Buxoroda Yevropa namunasida ikkita mehmonxona barpo etildi;",
     "Orenburgda Buxoro amirligi savdogarlarining qarorgohi qurildi",
     "Qoʻqon xonligi hududi jihatidan Oʻrta Osiyoda eng katta davlatga aylandi;",
     "Matyoqub pishiq boshchiligida Xonqa, Hazorasp, Bogʻotda dehqonlar qoʻzgʻalon koʻtardi"], "D", page=3))
Q.append(single(13, 3.2, "XX asrda harbiy toʻntarish orqali hokimiyatga kelgan shaxslarni aniqlang.\n1) Porfirio Dias, 2) Muammar Qazzofiy, 3) Jaʼfar Nimeyri, 4) Patrisio Eylvin, 5) Fidel Kastro, 6) Jamol Abdul Nosir",
    ["2, 3, 4, 5, 6", "1, 2, 3, 5, 6", "1, 2, 3, 4, 5, 6", "2, 3, 5, 6"], "D", page=3))
Q.append(single(14, 1.3, "Quyidagilardan Oʻzbekiston Respublikasida 1991-yil 5-sentyabrda imzolangan hujjatni aniqlang.",
    ["“Konstitutsiya ishlab chiqish zarurligi toʻgʻrisida”gi qaror",
     "Lenin nomidagi maydonni Mustaqillik maydoni deb nomlash toʻgʻrisidagi qaror",
     "Ichki ishlar vazirligi Oʻzbekiston SSR tasarrufiga boʻysundirish toʻgʻridagi qaror",
     "“Oʻzbekiston Respublikasi Mudofaa ishlari Vazirligi tuzish toʻgʻrisida”gi Prezident farmoni"], "B", page=3))
Q.append(single(15, 2.2, "Quyidagilardan mustaqil Oʻzbekiston tarixiga oid toʻgʻri berilgan maʼlumotlarni aniqlang.",
    ["1, 2, 5, 6, 7", "1, 2, 4, 7", "2, 3, 4, 7", "1, 2, 3, 4, 6"], "C",
    items=["Minor masjidi qurilishi 2014-yili boshlanib, 2015-yil oktyabrda ochildi;",
           "2001-yil avgustda Toshkent metrosining Yunusobod yoʻnalishi 6 ta bekatdan iborat birinchi qismi foydalanishga topshirildi;",
           "2017-yil 15-dekabrdagi farmon asosida Oʻzbekiston Islom Akademiyasi ochildi;",
           "2008-yil Oʻzbekistonda oʻlim jazosi bekor qilingan;",
           "Oʻzbekiston ShHT ga 2000-yili aʼzo boʻlgan;",
           "1993-yil martda Oʻzbekiston BMT ga teng huquqli ravishda kirdi;",
           "2001-yil Oʻzbek davlat akademik drama teatriga “Milliy teatr” maqomi berildi."], page=3,
    flags=["Skanda 4 ta raqam tagiga chizilgan (2014, 2015, 2000, 1993) — talabaga ko‘rsatiladimi, aniqlanishi kerak"]))
# ---- 16-17 (4-bet) ----
Q.append(chron(16, 2.2, "Quyidagi tarixiy voqealar (maʼlumotlar) toʻgʻri xronologik ketma-ketlikda koʻrsatilgan javobni toping.",
    [{"text": "Amerikalik sotsiolog Daniel Bell “Postindustrial jamiyat” atamasini muomalaga kiritgan", "year": 1962},
     {"text": "Ingliz muhandisi Richard Trevitik tarixda ilk parovozni konstruksiyaladi", "year": 1804},
     {"text": "Rus olimi Aleksandr Popov Rossiya fizika-kimyo jamiyati yigʻilishida dunyoda birinchi marta radiotelegramma uzatdi", "year": 1896},
     {"text": "Amerikalik ixtirochi Tomas Edison 40 soat yonib turuvchi uglerod tolali lampochkani yaratishga muvaffaq boʻldi", "year": 1879},
     {"text": "Germaniya sanoat ishlab chiqarishning umumiy hajmi boʻyicha dunoda uchinchi oʻringa chiqib oldi", "year": 1880},
     {"text": "Muhandis V. I. Lopushinskiy yuk lokomotivi ishlab chiqdi", "year": 1895}],
    ["2, 4, 6, 5, 3, 1", "1, 2, 3, 5, 4, 6", "2, 1, 3, 5, 6, 4", "2, 4, 5, 6, 3, 1"], "D", 4))
Q.append(single(17, 2.2, "Xaritada yulduzcha ostida berilgan davlat (hudud) tarixiga oid boʻlmagan maʼlumotlarni toping.",
    ["1, 2, 5, 6, 7", "1, 4, 5, 4, 7", "2, 4, 6, 7", "2, 4, 6"], "D",
    items=["1933-yili Adolf Gitler hokimiyatga keldi;",
           "1910-yili Pensiya toʻgʻrisida qonun qabul qilindi;",
           "1875-yilda birinchi marta sotsialistik partiya tashkil etildi;",
           "1881-yilda Shimoliy Afrikada joylashgan Tunisni bosib oldi;",
           "XIX asr 70-yillarida “Madaniyat uchun kurash” siyosati yurgizilgan;",
           "1792-yilda birinchi Respublika davri boshlandi;",
           "XX asr boshlarida mamlakatda pensiya yoshi 65 yosh edi;"],
    kind="image", page=4, image="/exam-img/v07_q17_map.png",
    flags=["Xaritada @tarixplaton (Telegram kanal) suv belgisi — mahsulotda oʻz xaritamiz bilan almashtirish kerak",
           "B variantida '4' ikki marta uchraydi (1, 4, 5, 4, 7) — manba xatosi",
           "Yulduzcha ko‘rsatgan davlat: Germaniya (xaritadan)"]))
# ---- 18-19 (5-bet) ----
Q.append(table(18, 3.2, "Tarixiy voqea va uning natijasi oʻzaro mos berilmagan qatorlarni aniqlang.",
    {"headers": ["№", "Voqea", "Natija"],
     "rows": [["1", "Yaponiyada Meydzi islohotlari", "AQSH va Buyuk Britaniya bilan munosabatlari yomonlashdi"],
              ["2", "Rossiya-Yaponiya urushi", "Yaponiya Koreya yarimorolini oʻziga qoʻshib oldi"],
              ["3", "Buyuk Britaniyada “Ish haqi minimumi toʻgʻrisida”gi qonun qabul qilindi", "Kasallik va ishsizlik sababli sugʻurta toʻlovi joriy etildi"],
              ["4", "Muhammad Shayboniyxon pul islohoti", "Hokimiyatning markazlashuviga, xazinaga katta daromad tushishiga olib keldi. Shuningdek, ichki va tashqi savdo-sotiqni yanada rivojlanishi uchun qulay sharoit yaratdi"],
              ["5", "Rossiyaga Ernazarbiy elchiligi", "Buxoro amirligi va Rossiya oʻrtasida savdo aloqalarining rivojlanishi"],
              ["6", "Italiya-Efiopiya urushi. Adua jangi", "Italiyaning magʻlubiyati"],
              ["7", "Qrim urushi", "Rossiya gʻalabasi"]]},
    [], ["2, 5, 7", "3, 5, 7", "1, 3, 4", "1, 4, 7"], "D", 5, kind="table_select"))
Q.append(table(19, 3.2, "Jadvalda harflar bilan belgilangan kataklarga quyida berilgan maʼlumotlardan moslarini qoʻyib toʻgʻri javobni toping.",
    {"headers": ["Asr", "Oʻzbekiston tarixidagi voqea", "Jahon tarixidagi voqea"],
     "rows": [["a", "Maʼsudbek pul islohoti", "b"], ["c", "d", "Parxe qirolligi parchalandi"],
              ["XVIII", "e", "f"], ["g", "Andijonda Jadid maktabi ochildi", "h"],
              ["i", "j", "Vilson tinchlik dasturini ishlab chiqdi"], ["XIX", "k", "l"]]},
    ["XIX asr", "XVII asr", "Samarqandda Xorazmshohga qarshi isyon koʻtarilishi", "Farjak madrasasi ochildi", "XV asr", "X asr",
     "Xiva xonligida qurgʻoqchilik va hosilsizlik yili boʻldi", "XX asr", "Eftaliylarning Oʻrta Osiyoga kirib kelishi", "V asr",
     "Qoʻqon xonligida “Poʻlatxon” qoʻzgʻolonining sodir boʻlishi", "XIII asr",
     "Xalqaro sotsialistik ishchi partiyalari uyushmasi – II Internatsionalning tashkil etilishi", "XIX asr",
     "Napoleon boshchiligidagi fransuzlar Misrni tashlab chiqishga majbur boʻldi",
     "Lotin Amerikasi mamlakatlarida iqtisodiyotning sezilarli oʻsishi kuzatildi", "X asr",
     "Xitoyda Suy sulolasi hukmronligining boshlanishi", "Buxoroda Jul deb nomlangan yangi soliq joriy etildi",
     "“Marko Polo kitobi” asari yozildi", "Meksikada “Burjua inqilobi” boʻlib oʻtdi"],
    ["a-12, b-20, c-6, d-4, e-19, f-1, g-14, h-16, i-2, j-7, k-11, l-13",
     "a-12, b-15, c-6, d-4, e-19, f-21, g-17, h-16, i-8, j-7, k-11, l-13",
     "a-12, b-20, c-6, d-4, e-19, f-15, g-14, h-16, i-8, j-7, k-11, l-13",
     "a-12, b-20, c-5, d-4, e-19, f-15, g-14, h-21, i-8, j-7, k-11, l-13"], "C", 5,
    flags=["Jadvalda 'XIX' asri ikki qatorda uchraydi; 14 va 1 raqamlari ham 'XIX asr' — manba tuzilishi, tekshirilsin"]))
# ---- 20-27 (6-bet) ----
Q.append(single(20, 3.2, "Quyidagi maʼlumotlarni tahlil qilib, Eyler-Venn diagrammasiga mos keladigan javobni aniqlang.\nI — Ismoil Obidov; II — Munavvarqori Abdurashidxonov; III — kesishma (ikkalasiga ham tegishli).",
    ["I – 1,3; II – 2; III – 4", "I – 1,5; II – 2; III – 4", "I – 1; II – 2,3; III – 4", "I – 1; II – 2; III – 4"], "D",
    items=["Ilk oʻzbek milliy gazetasi asoschisi;",
           "1904-yildan boshlab oʻlkadagi ijtimoiy-siyosiy, maʼrifiy harakatlarning faol ishtirokchisi;",
           "“Toʻy” asari muallifi;", "1906-yilda gazeta chop etishni boshladi."],
    kind="venn", page=6, image="/exam-img/v07_q20_venn.png",
    flags=["B variantida '1,5' — 5-band mavjud emas, manba xatosi bo‘lishi mumkin"]))
Q.append(single(21, 1.3, "Quyidagilardan oʻz asarini XVI birinchi yarmidagi Xiva tarixiga bagʻishlagan shaxsni aniqlang.",
    ["Xudoyberdi Avaz Muhammad", "Hasanbek Rumlu", "Ogahiy", "Abulgʻoziy Bahodirxon"], "B", page=6))
Q.append(single(22, 2.2, "Parij kommunasining tashkil etilishi, qisqa muddatda boʻsada muhim oʻzgartirishlar qilish imkoniyatini berdi. Quyidagilardan shularga oid toʻgʻri BOʻLMAGAN javoblarni aniqlang.",
    ["1, 2, 3, 6", "1, 2, 5, 6", "2, 3, 4, 6", "3, 4, 6"], "D",
    items=["Egalari tashlab ketgan korxonalar ishchilariga topshirildi;", "Majburiy va bepul taʼlim joriy etildi;",
           "Siyosiy tashviqot bilan shugʻullanish ruxsat etildi;", "Lekin xotin-qizlarga saylov huquqi berilmadi;",
           "Mehnatkashlarning uy-joy haqini toʻlash muddatlari kechiktirildi;", "Davlat xazinasini, banklarni toʻla oʻz qoʻliga oldi;",
           "Ishlab chiqarish ustidan nazorat oʻrnatdi."], page=6,
    flags=["Manbada 'Mehnatkashlaming' (OCR/imlo), 'Mehnatkashlarning' deb tuzatildi"]))
Q.append(single(23, 2.2, "XVII asr boshida hokimiyat bir suloladan boshqa sulolaga almashgan davlatlarni aniqlang.",
    ["1, 3, 5", "3, 5", "2, 4, 5", "1, 2"], "B",
    items=["Avstriya;", "Prussiya;", "Angliya;", "Rossiya;", "Yaponiya."], page=6))
Q.append(single(24, 1.3, "XVI asrda Buxoro xonligida mavjud boʻlgan harbiy soliqni aniqlang.",
    ["Zobitona", "Madadi lashkar", "Qalqon puli", "Jul"], "B", page=6))
Q.append(single(25, 1.3, "Buxoro amirligida mavjud boʻlgan jul soligʻi qanday yigʻim boʻlgan?",
    ["urush kelib chiqqanda qoʻshinning harajati uchun yigʻiladigan soliq",
     "bogʻlar va polizlardan olingan daromadlar uchun alohida yigʻiladigan mablagʻ",
     "xon farmonlarini eʼlon qiluvchi jarchi foydasiga yigʻiladigan mablagʻ",
     "harbiy harakatlar chogʻida yigʻiladigan favqulodda soliq"], "A", page=6,
    flags=["A va D mazmunan o‘xshash — savol noaniq bo‘lishi mumkin; mutaxassis tekshiruvi kerak"]))
Q.append(single(26, 2.2, "Quyidagilardan X asrda parchalangan (a) va vujudga kelgan (b) davlatlar berilgan javobni aniqlang.\n1) Koryo davlati 2) Tohiriylar davlati 3) Aksum davlati 4) Parxe davlati",
    ["a – 1, b – 2", "a – 2, b – 1", "a – 4, b – 1", "a – 3, b – 2"], "C", page=6))
Q.append(matching(27, 2.2, "Xitoyda 1897-1898-yillarda buyuk davlatlar tomonidan egallangan (taʼsir doirasiga kiritgan) hududlar toʻgʻri muvofiq berilgan javobni aniqlang.",
    {"1": "Germaniya", "2": "Fransiya", "3": "Rossiya", "4": "Buyuk Britaniya", "5": "Yaponiya"},
    {"a": "Szyaochjouvan va Shandun", "b": "Veyxayvey bandargohi va Yanszi daryosi havzasi", "c": "Futszyan viloyati",
     "d": "Port-Artur (Lyuyshun)", "e": "Guamchjuvan koʻrfazi va Yunan viloyati"},
    ["1 – a, 2 – e, 3 – b, 4 – d, 5 – c", "1 – a, 2 – e, 3 – d, 4 – b, 5 – c",
     "1 – a, 2 – e, 3 – d, 4 – c, 5 – d", "1 – a, 2 – d, 3 – e, 4 – b, 5 – c"], "B", 6))
# ---- 28-31 ----
Q.append(single(28, 1.3, "Oʻrta Osiyo davlatlarida Buzrukxoʻja nomi bilan ataluvchi madrasa qaysi sulola davrida qurilgan?",
    ["Mangʻitlar", "Ashtarxoniylar", "Minglar", "Shayboniylar"], "C", page=7))
Q.append(single(29, 1.3, "Bu asar Yaqin va Oʻrta Sharq mamlakatlari tarixining islom tarqalishidan to 1231-yilgacha boʻlgan davr haqida maʼlumot beruvchi eng qimmatli manbalardan biri sanaladi. Muallif Jaloliddinning faoliyatiga keng oʻrin ajratadi va koʻpincha oʻzining muhim va aniq maʼlumotlari bilan boshqa manbalarni sezilarli darajada toʻldiradi.\nUshbu asar va uning muallifini aniqlang.",
    ["Shihobiddin ibn Ahmad an-Nasaviy “Siyrat as-sulton Jalol ad-Din Mengburni”", "Mirxond “Ravzat us-safo”",
     "Mirzo Ulugʻbek “Tarixi arba’ ulus”", "Ibn al-Asirning “al-Komil fit-tarix”"], "D", page=7))
Q.append(matching(30, 2.2, "Mualliflar va ularning asarlari toʻgʻri moslashtirilgan javobni toping.",
    {"I": "Muhammad Haydar", "II": "Mahmud Zamaxshariy", "III": "Muhammad Amin Buxoriy"},
    {"a": "“Abdullanoma”", "b": "“Tarixi Rashidiy”", "c": "“Ubaydullanoma”", "d": "“Fathnomayi Sultoniy”",
     "e": "“Al-Kashshof”", "f": "“Xoqonga foydali masalahatlar”"},
    ["I-b, II-e, III-c", "I-b, II-f, III-a", "I-b, II-e, III-d", "I-b, II-e, III-a"], "A", 8))
Q.append(matching(31, 2.2, "Chizmada keltirilgan shaxslar va ularga tegishli maʼlumotlar toʻgʻri moslashtirilgan javobni toping.",
    {"I": "F.Beneveni", "II": "A.Byorns", "III": "S. Jukovskiy"},
    {"a": "“Oʻrta Osiyo boʻylab sayohat” asarini yozgan", "b": "Oʻrta Osiyoga elchiligi natijasida “Estaliklar” asari yozgan",
     "c": "Buxoro xonini Xivaga qarshi Rossiya bilan ittifoq tuzishga koʻndirishi lozim edi",
     "d": "Uning elchilik missiyasi Oʻrta Osiyoda Buyuk Britaniya savdosini rivojlantirdi",
     "e": "“Rossiyaning keyingi 300 yilda Buxoro-Xiva bilan aloqasi” asari muallifi",
     "f": "Qanotning koʻtarish kuchini aniqlash formulasi asoschisi"},
    ["I – c, II – e, III – f", "I – c, II – d, III – e", "I – b, II – e, III – f", "I – b, II – d, III – f"], "B", 8))
Q.append(single(32, 1.3, "Quyidagi qaysi qatorda bir asrda tashkil topgan davlatlar toʻgʻri juftlashtirib berilgan?",
    ["Dehli sultonligi – Mali davlati", "Lotinlar imperiyasi – Quddus qirolligi",
     "Qarluqlar davlati – Somoniylar davlati", "Koryo qirolligi – Gʻaznaviylar davlati"], "D", page=9,
    key_note="Skanda variantlar yonida qizil rangda asrlar: A XIII-VIII; B XIII-XI; C VIII-IX; D X-X (kalit izohi, talabaga ko‘rsatilmaydi)"))
# ---- 33-35 block ----
block = {"no": "33-35", "type": "block_matching", "stem": "33-35-test topshiriqlariga mos keluvchi javoblarni (A-F) javob variantlaridan tanlang.",
         "shared_options": {
            "A": {"text": "Liviya Italiya mustamlakasiga aylandi", "year": 1912},
            "B": {"text": "Buyuk Britaniyada koʻmir qazuvchilarning 6 haftalik ish tashlashi boʻlib oʻtdi", "year": 1911},
            "C": {"text": "Germaniya sanoat ishlab chiqarish boʻyicha AQSH dan keyingi ikkinchi oʻringa chiqib oldi", "year": 1913},
            "D": {"text": "Buyuk Britaniya San-Stefano shartnomasini tan olmay Berlin kongressi chaqirilishiga erishdi", "year": 1878},
            "E": {"text": "“Kuchukqaynarji” shartnomasi imzolandi", "year": 1774},
            "F": {"text": "Xuan Karlos I Portugaliyada taxtga oʻtirdi", "year": 1986}},
         "questions": [
            {"no": 33, "points": 2.2, "stem": "Berilgan voqealardan qaysi biri keyiroq sodir boʻlgan?", "correct": "F"},
            {"no": 34, "points": 2.2, "stem": "Qaysi voqea natijasida Buyuk Britaniya Kipr orolini qoʻlga kiritdi?", "correct": "D"},
            {"no": 35, "points": 2.2, "stem": "Qaysi voqea natijasida Rossiya Qora dengizga chiqish huquqiga ega boʻldi?", "correct": "E"}],
         "flags": ["F varianti faktik xato: Xuan Karlos I Ispaniya qiroli (1975), Portugaliya emas; javob (F — eng keyingi) o‘zgarmaydi, lekin variant matni tuzatilishi kerak"],
         "verified": False, "src_page": 9}
Q.append(block)
# ---- 36-45 open ----
Q.append(op(36, "Toʻrtinchi Salib yurishlari 1202-1204-yillarda boʻlib oʻtgan.", [
    part("a", "Salibchilar qoʻshinini kemalarda Falastinga olib oʻtishni oʻz zimmasiga olgan davlatni aniqlang va yozing.", 1.1, ["Venetsiya"]),
    part("b", "Ushbu Salib yurishi qaysi shaharni egallanishiga sabab boʻlganini yozing.", 1.1, ["Konstantinopol"])], 9,
    flags=["Faktik izoh: IV salib yurishi Falastinga emas, Misrga mo‘ljallangan edi; savol matni manbada shunday — mutaxassis tekshirsin"]))
Q.append(op(37, "1889-yilda Yaponiyada Konstitutsiya qabul qilindi.", [
    part("a", "Konstitutsiyaga muvofiq mamlakatda ikki palatali parlament tashkil etiladi. Ushbu parlament Yuqori palatasi nomini yozing.", 1.5, ["Perlar"]),
    part("b", "Ushbu konstitutsiyasi qaysi davlat konstitutsiyasi namunasi asosida qabul qilinganini yozing.", 1.7, ["Prussiya"])], 10))
Q.append(op(38, "Gʻaznaviylar davlati 1186-yilda butunlay tugatilgan.", [
    part("a", "Gʻaznaviylar davlati kimning davrida siyosiy nufuzi ortganini aniqlang va yozing.", 1.5, ["Sobuqtegin"]),
    part("b", "Ushbu davlat kimning hukmronligida Sharqning eng qudratli davlatlaridan biriga aylanganini aniqlang va yozing.", 1.7, ["Mahmud Gʻaznaviy"])], 10))
Q.append(op(39, "Ikkinchi Jahon urushidan soʻng bir qator davlatlarda boshqa davlatlardan farq qiluvchi siyosatlar amalga oshirilgan.", [
    part("a", "Ikkinchi Jahon urushidan soʻng “Yuzta gul” siyosati qaysi davlatda oʻtkazilganligini aniqlang va yozing.", 1.5, ["Xitoy"]),
    part("b", "Ikkinchi Jahon urushidan yakunlangach “Uch yil matonatli mehnat – uch ming yil baxt saodat” shiori qaysi davlatda ekanligini aniqlang va yozing.", 1.7, ["Xitoy"])], 10))
Q.append(op(40, "1945-yil oktyabrda Angliyaning Manchester shahrida V Panafrika kongressi boʻlib oʻtdi.", [
    part("a", "Natijada Buyuk Britaniya mustamlakasi Oltin Qirgʻoq oʻz mustaqilligini eʼlon qildi va davlat nomini qanday nomga oʻzgartirganligini yozing.", 1.1, ["Gana"]),
    part("b", "Janubiy Afrika Respublikasi (JAR) prezidentligiga 1994-yilda kim saylanganini aniqlang va yozing.", 1.1, ["Nelson Mandela"])], 11))
Q.append(op(41, "«Bu ....... xalqining asosiy va deyarli birdan bir hunari dehqonchilikdir»", [
    part("a", "Nuqtalar oʻrniga mos keluvchi javoblarni yozing.", 1.1, ["qoraqalpoq"]),
    part("b", "Ushbu taʼrif nechanchi yil chiqqan gazetada yozilganligini aniqlang va yozing.", 1.1, ["1868"], kind="year")], 11,
    flags=["b javobi (1868) mutaxassis tomonidan tekshirilsin — Turkiston viloyati gazetasi chiqa boshlagan yil bilan mosligi aniq emas"]))
Q.append(op(42, "1842-yilda Xiva shahri tashqi dushmanlardan himoyalanish maqsadida devor bilan oʻrab olindi.", [
    part("a", "Ushbu devor qaysi Xiva xoni tashabbusi bilan qurilganini aniqlang va yozing.", 1.1, ["Olloqulixon"]),
    part("b", "Ushbu tashqi qalʼa (Dishan qalʼa) nechta darvozadan iborat ekanligini yozing.", 1.1, ["10 ta"], kind="number")], 11))
Q.append(op(43, "1873-yilda Xiva va Rossiya oʻrtasida “Gandimiyon” shartnomasi imzolandi.", [
    part("a", "Ushbu shartnoma imzolangan vaqtda Rossiya imperatori kim ekanligini aniqlang va yozing.", 1.1, ["Aleksandr II"]),
    part("b", "Ushbu shartnomaning nechanchi moddasida Xiva xoni “oʻzini Rossiya imperatorining sodiq quli ekanligi”ni tan oladi?", 1.1, ["Birinchi moddasida"])], 12))
Q.append(op(44, "Ushbu matnni oʻqing va shu asosda berilgan topshiriqlarni bajaring.\n“Bolshevik maddohlardan birining eʼtiroficha, a)......... qoʻrboshilar oʻrtasida eng kuchlisi boʻlgan boʻlsa, b)........ shubhasiz eng xavflisi edi”\nDiqqat! Nuqtalar oʻrniga kerakli maʼlumotni yozing.", [
    part("a", "a) nuqtalar oʻrniga", 1.1, ["Madaminbek"]),
    part("b", "b) nuqtalar oʻrniga", 1.1, ["Shermuhammadbek"])], 12))
Q.append(op(45, "Bolgariya IX asr boshlariga kelib yirik davlatga aylanadi.", [
    part("a", "Ushbu davlat asoschisi nomini yozing?", 1.1, ["Asparux"]),
    part("b", "Ushbu davlat kimning hukmronligida eng qudratli davlatga aylanganini aniqlang va yozing.", 1.1, ["Simeon"])], 12))

data = {
    "variant_id": "v07",
    "source": {
        "file": "Tarix_Milliy_Sertifikat__7_Javobli.pdf",
        "label": "TMS II variant",
        "authors": ["Azizjon Alijonov", "Javohir Usmonov"],
        "book_pages": "15-26",
        "obtained_from": "mualliflar (foydalanuvchining do‘stlari), og‘zaki rozilik",
        "permission_status": "yozma ruxsat kutilmoqda",
        "transcription": "skan sahifalardan qo‘lda (vizual) transkripsiya; kalit = mualliflarniki",
    },
    "scoring_note": "points — mualliflar ko‘rsatgan og‘irliklar (rasmiy emas)",
    "questions": Q,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
print("wrote", OUT, len(Q), "entries")
