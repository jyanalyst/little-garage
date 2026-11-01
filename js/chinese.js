/* 华文 topics for K1 (MOE NEL 2022 Mother Tongue Languages, easy end): 家人, 身体, 食物, 交通, 句子 这是/我有/我要, 认字, 儿歌.
   Mandarin only inside the activities (as in the picture-book spec). Pinyin follows the parent toggle (off by default).
   Loaded after activities.js. The 红车 book stays the first Chinese item, unchanged. Pictures are emoji or simple SVG, no photos. */
(function () {
  "use strict";
  var ACTS = K1.ACTS;
  var AGAIN = ["再听一次。", "zh"], READY = [["真棒！来玩一个小游戏吧。", "zh"]];
  function E(e) { return '<span class="emoji">' + e + '</span>'; }
  function endLine(tail) { return function (p) { return [["今天玩完了。", "zh"], ["你想跟" + p.zh + tail, "zh"]]; }; }
  function add(id, topic, a) { a.id = id; a.subject = "zh"; a.topic = topic; a.lang = "zh"; a.readyLine = a.readyLine || READY; ACTS[id] = a; return id; }

  /* words with a picture: tap to hear "这是…", then "…在哪里？" / "哪个是…？" (same shape as 车的颜色) */
  function words(id, topic, o) {
    var V = o.words;
    return add(id, topic, {
      title: o.title, titleSay: [[o.title + "。", "zh"]], sub: o.sub, card: o.card, sticker: o.sticker, intro: o.intro,
      lesson: { type: "tapAll", cls: o.items.length > 4 ? "wrap" : "", items: o.items.map(function (k) {
        return { id: k, html: V[k].html, zh: { zh: V[k].zh, py: V[k].py }, label: V[k].zh, say: [["这是" + V[k].zh + "。", "zh"]].concat(V[k].more ? [[V[k].more, "zh"]] : []) }; }) },
      check: o.check.map(function (x) {
        var a = x[0], z = V[a].zh, py = V[a].py, q = o.where ? z + "在哪里？" : "哪个是" + z + "？", qpy = o.where ? py + " zài nǎ lǐ?" : "nǎ ge shì " + py + "?";
        return { answer: a, options: x[1], label: z, ask: q, askPy: qpy, optionHtml: function (k) { return V[k].html; },
          prompt: [[q, "zh"]], hint: [AGAIN, [z + "。", "zh"], [q, "zh"]],
          reveal: [["看，这是" + z + "。", "zh"], ["点一点" + z + "。", "zh"]], yes: [["对了！这是" + z + "。", "zh"]] };
      }),
      endLine: endLine(o.end)
    });
  }
  function W(list) { var o = {}; list.forEach(function (x) { o[x[0]] = { zh: x[1], py: x[2], html: x[3].charAt(0) === "<" ? x[3] : E(x[3]), more: x[4] }; }); return o; }

  var FAM = words("zh-family", "family", {
    title: "家人", sub: "Family", card: "👨‍👩‍👦", sticker: { color: "orange", mark: "家" }, where: true,
    intro: [["我们一家人坐车去玩。", "zh"], ["点一点每一个人。", "zh"]],
    words: W([["dad", "爸爸", "bà ba", "👨"], ["mum", "妈妈", "mā ma", "👩"], ["grandpa", "爷爷", "yé ye", "👴"], ["grandma", "奶奶", "nǎi nai", "👵"], ["brother", "哥哥", "gē ge", "👦"], ["sister", "姐姐", "jiě jie", "👧"]]),
    items: ["dad", "mum", "grandpa", "grandma", "brother", "sister"],
    check: [["dad", ["dad", "grandma", "sister"]], ["grandma", ["grandpa", "grandma", "mum"]], ["brother", ["sister", "dad", "brother"]]],
    end: "说说你的家人吗？"
  });
  var BODY = words("zh-body", "body", {
    title: "身体", sub: "My body", card: "👀", sticker: { color: "red", mark: "手" },
    intro: [["这是我的身体。", "zh"], ["点一点，听一听。", "zh"]],
    words: W([["eyes", "眼睛", "yǎn jing", "👀", "眼睛，看一看。"], ["ears", "耳朵", "ěr duo", "👂", "耳朵，听一听。"], ["nose", "鼻子", "bí zi", "👃", "鼻子，闻一闻。"],
      ["mouth", "嘴巴", "zuǐ ba", "👄", "嘴巴，说一说。"], ["hand", "手", "shǒu", "✋", "手，拍一拍。"], ["foot", "脚", "jiǎo", "🦶", "脚，跳一跳。"]]),
    items: ["eyes", "ears", "nose", "mouth", "hand", "foot"],
    check: [["eyes", ["eyes", "hand", "foot"]], ["ears", ["nose", "ears", "mouth"]], ["foot", ["hand", "mouth", "foot"]]],
    end: "一起拍拍手吗？"
  });
  var FOOD = words("zh-food", "food", {
    title: "餐车", sub: "Food truck", card: "🍎", sticker: { color: "yellow", mark: "🍎" }, where: true,
    intro: [["餐车来了！", "zh"], ["点一点每一样食物。", "zh"]],
    words: W([["apple", "苹果", "píng guǒ", "🍎"], ["banana", "香蕉", "xiāng jiāo", "🍌"], ["rice", "米饭", "mǐ fàn", "🍚"], ["noodles", "面条", "miàn tiáo", "🍜"], ["egg", "鸡蛋", "jī dàn", "🥚"], ["milk", "牛奶", "niú nǎi", "🥛"]]),
    items: ["apple", "banana", "rice", "noodles", "egg", "milk"],
    check: [["banana", ["apple", "banana", "milk"]], ["noodles", ["noodles", "egg", "rice"]], ["milk", ["egg", "banana", "milk"]]],
    end: "说说你爱吃什么吗？"
  });
  var TRANS = words("zh-transport", "transport", {
    title: "交通工具", sub: "Transport", card: "🚌", sticker: { color: "blue", mark: "🚌" },
    intro: [["路上有好多交通工具。", "zh"], ["点一点每一个。", "zh"]],
    words: W([["car", "汽车", "qì chē", "🚗"], ["bus", "巴士", "bā shì", "🚌"], ["train", "火车", "huǒ chē", "🚆"], ["plane", "飞机", "fēi jī", "✈️"], ["ship", "船", "chuán", "🚢"], ["bike", "自行车", "zì xíng chē", "🚲"]]),
    items: ["car", "bus", "train", "plane", "ship", "bike"],
    check: [["bus", ["car", "bus", "ship"]], ["plane", ["plane", "train", "bike"]], ["ship", ["bus", "ship", "plane"]]],
    end: "说说你最喜欢的车吗？"
  });

  /* sentences: 这是… 我有… 我要… (listen to a whole sentence, then pick the picture) */
  var PIC = { bus: E("🚌"), plane: E("✈️"), train: E("🚆"), apple: E("🍎"), banana: E("🍌"), milk: E("🥛"), red: Art.car("red"), blue: Art.car("blue"), yellow: Art.car("yellow") };
  var SENT = [["bus", "这是巴士。", "zhè shì bā shì."], ["plane", "这是飞机。", "zhè shì fēi jī."], ["red", "我有一辆红车。", "wǒ yǒu yí liàng hóng chē."], ["banana", "我要香蕉。", "wǒ yào xiāng jiāo."]];
  var PAT = add("zh-sentences", "patterns", {
    title: "说一说", titleSay: [["说一说。", "zh"]], sub: "这是… 我有… 我要…", card: "💬", sticker: { color: "green", mark: "说" },
    intro: [["我们来说一说。", "zh"], ["点一点，听一听。", "zh"]],
    lesson: { type: "tapAll", cls: "sentences", items: SENT.map(function (x) { return { id: x[0], html: PIC[x[0]], zh: { zh: x[1], py: x[2] }, label: x[1], say: [[x[1], "zh"]] }; }) },
    check: [["apple", ["apple", "banana", "milk"], "我要苹果。", "wǒ yào píng guǒ."], ["train", ["bus", "train", "plane"], "这是火车。", "zhè shì huǒ chē."], ["blue", ["red", "blue", "yellow"], "我有一辆蓝车。", "wǒ yǒu yí liàng lán chē."]].map(function (x) {
      var s = [x[2], "zh"];
      return { answer: x[0], options: x[1], label: x[2], ask: x[2], askPy: x[3], optionHtml: function (k) { return PIC[k]; },
        prompt: [s, ["点一点。", "zh"]], hint: [AGAIN, s], reveal: [["看，是这个。", "zh"], s, ["点一点。", "zh"]], yes: [["对了！", "zh"], s] };
    }),
    endLine: endLine("说一说你要什么吗？")
  });

  /* 认字: a character with a picture clue; the check shows characters only */
  function chars(id, title, color, mark, list, checks) {
    var V = {}; list.forEach(function (x) { V[x[0]] = { py: x[1], pic: x[2], clue: x[3] }; });
    return add(id, "chars", {
      title: title, titleSay: [["认字。", "zh"]], card: list.map(function (x) { return x[0]; }).join(""), sticker: { color: color, mark: mark },
      intro: [["我们来认字。", "zh"], ["点一点每一个字。", "zh"]],
      lesson: { type: "tapAll", cls: "hanzi-row", items: list.map(function (x) {
        return { id: x[0], html: '<span class="hz-pic">' + x[2] + '</span>', zh: { zh: x[0], py: x[1] }, label: x[0], say: [[x[0] + "。", "zh"], [x[3], "zh"]] }; }) },
      check: checks.map(function (x) {
        var c = x[0], q = "哪个是" + c + "字？";
        return { answer: c, options: x[1], label: c, ask: q, askPy: "nǎ ge shì " + V[c].py + " zì?", optionHtml: function (k) { return '<span class="hanzi">' + k + '</span>'; },
          prompt: [[q, "zh"]], hint: [AGAIN, [c + "。", "zh"], [V[c].clue, "zh"], [q, "zh"]],
          reveal: [["看，这是" + c + "字。", "zh"], ["点一点" + c + "字。", "zh"]], yes: [["对了！这是" + c + "字。", "zh"]] };
      }),
      endLine: endLine("说说今天认的字吗？")
    });
  }
  var CH1 = chars("zh-chars1", "认字 人 口 大 小", "purple", "大",
    [["人", "rén", "🧍", "一个人。"], ["口", "kǒu", "👄", "张开口。"], ["大", "dà", '<span class="sort-car big">' + Art.car("red") + '</span>', "大车。"], ["小", "xiǎo", '<span class="sort-car small">' + Art.car("blue") + '</span>', "小车。"]],
    [["大", ["大", "小", "人"]], ["人", ["口", "人", "大"]], ["小", ["人", "大", "小"]]]);
  var CH2 = chars("zh-chars2", "认字 上 下 车 山", "green", "车",
    [["上", "shàng", "🚗⬆️", "车开上山。"], ["下", "xià", "🚗⬇️", "车开下山。"], ["车", "chē", "🚗", "我的车。"], ["山", "shān", "⛰️", "高高的山。"]],
    [["车", ["车", "山", "上"]], ["上", ["下", "上", "车"]], ["山", ["车", "下", "山"]]]);

  /* 儿歌: a short car chant (spoken, not sung), tap each line; check = listen and match */
  var SONG = [["l1", "小汽车，嘀嘀嘀。", "xiǎo qì chē, dī dī dī.", "🚗"], ["l2", "开过来，开过去。", "kāi guò lái, kāi guò qù.", "🚗💨"], ["l3", "红灯停，绿灯行。", "hóng dēng tíng, lǜ dēng xíng.", "🚦"], ["l4", "小朋友，笑嘻嘻。", "xiǎo péng you, xiào xī xī.", "😄"]];
  var SOUND = { car: ["🚗", "嘀嘀嘀"], dog: ["🐶", "汪汪汪"], cat: ["🐱", "喵喵喵"] };
  function lightQ(c, zh, py, rule) {
    var q = "哪个是" + zh + "？";
    return { answer: c, options: c === "red" ? ["green", "red", "yellow"] : ["green", "yellow", "red"], label: zh, ask: rule + q, askPy: py, optionHtml: function (k) { return Art.light(k); },
      prompt: [[rule, "zh"], [q, "zh"]], hint: [AGAIN, [rule, "zh"], [q, "zh"]], reveal: [["看，这是" + zh + "。", "zh"], ["点一点" + zh + "。", "zh"]], yes: [["对了！", "zh"], [rule, "zh"]] };
  }
  var SG = add("zh-song", "songs", {
    title: "儿歌 小汽车", titleSay: [["儿歌，小汽车。", "zh"]], sub: "Car chant", card: "🎵", sticker: { color: "red", mark: "🎵" },
    intro: [["我们来念儿歌。", "zh"], ["点一点每一句。", "zh"]],
    lesson: { type: "tapAll", cls: "sentences", items: SONG.map(function (x) { return { id: x[0], html: E(x[3]), zh: { zh: x[1], py: x[2] }, label: x[1], say: [[x[1], "zh"]] }; }) },
    readyLine: [["我们一起念一遍。", "zh"]].concat(SONG.map(function (x) { return [x[1], "zh"]; })).concat(READY),
    check: [
      { answer: "car", options: ["dog", "car", "cat"], label: "嘀嘀嘀", ask: "小汽车怎么叫？", askPy: "xiǎo qì chē zěn me jiào?",
        optionHtml: function (k) { return E(SOUND[k][0]) + '<span class="opt-word">' + SOUND[k][1] + '</span>'; },
        prompt: [["小汽车怎么叫？", "zh"]], hint: [AGAIN, ["小汽车，嘀嘀嘀。", "zh"], ["小汽车怎么叫？", "zh"]],
        reveal: [["看，小汽车嘀嘀嘀。", "zh"], ["点一点小汽车。", "zh"]], yes: [["对了！小汽车，嘀嘀嘀。", "zh"]] },
      lightQ("red", "红灯", "hóng dēng tíng. nǎ ge shì hóng dēng?", "红灯停。"),
      lightQ("green", "绿灯", "lǜ dēng xíng. nǎ ge shì lǜ dēng?", "绿灯行。")
    ],
    endLine: endLine("一起念儿歌吗？")
  });

  var Z = K1.subject("zh"), T = {};
  Z.topics.forEach(function (t) { T[t.id] = t; });
  function fill(id, say, acts) { T[id].say = [[say, "zh"]]; T[id].acts = acts; }
  fill("family", "家人。", [FAM]); fill("body", "身体。", [BODY]); fill("food", "食物。", [FOOD]); fill("transport", "交通。", [TRANS]);
  fill("patterns", "这是，我有，我要。", [PAT]); fill("chars", "认字。", [CH1, CH2]); fill("songs", "儿歌。", [SG]);
})();
