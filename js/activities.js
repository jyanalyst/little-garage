/* What is in the app: subjects -> topics -> activities (MOE NEL Framework 2022, pitched at the easy end for K1).
   Topics with no activity yet show "Coming soon" (same rule as the maths games menu).
   Each activity: a short lesson (4-6 things), then a 6-item no-fail check, then a sticker. The story book has no check.
   Every spoken line is [text, lang]; lang "snd" is the recorded letter sound (sss), spoken as "sss" by the device voice if no clip.
   tools/lines.js collects every fixed line from here for recording (tools/gen_tts.js). */
var K1 = (function () {
  "use strict";
  var SSS = ["sss", "snd"];
  // recorded letter sounds (lang "snd"): Jolly Phonics group 1 order s a t i p n. No clip yet = device voice says a close spelling (js/speech.js)
  var SND = { s: SSS, a: ["a", "snd"], t: ["t", "snd"], i: ["i", "snd"], p: ["p", "snd"], n: ["n", "snd"] };
  function pic(e, word) { return { html: '<span class="emoji">' + e + '</span>', word: word }; }
  var P = {
    sun: pic("☀️", "sun"), sock: pic("🧦", "sock"), snake: pic("🐍", "snake"), seal: pic("🦭", "seal"),
    sandwich: pic("🥪", "sandwich"), six: pic("6️⃣", "six"), moon: pic("🌙", "moon"), bus: pic("🚌", "bus"),
    dog: pic("🐶", "dog"), hat: pic("👒", "hat"), cat: pic("🐱", "cat"), pig: pic("🐷", "pig"), fish: pic("🐟", "fish"), ball: pic("⚽", "ball")
  };
  function w(k) { return [P[k].word + ".", "en"]; }
  var ZH = { red: { zh: "红色", py: "hóng sè" }, blue: { zh: "蓝色", py: "lán sè" }, yellow: { zh: "黄色", py: "huáng sè" }, green: { zh: "绿色", py: "lǜ sè" },
    orange: { zh: "橙色", py: "chéng sè" }, purple: { zh: "紫色", py: "zǐ sè" } };
  var EN_NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  var PEOPLE = { mummy: { en: "Mummy", zh: "妈妈" }, daddy: { en: "Daddy", zh: "爸爸" }, grandma: { en: "Grandma", zh: "奶奶" }, grandpa: { en: "Grandpa", zh: "爷爷" } };
  var UI = {
    home: [["Little Garage.", "en"], ["小车库。", "zh"]],
    pickRoad: [["Pick a road.", "en"]],
    stickerBook: [["Your sticker book.", "en"]],
    tapEachCar: [["Tap each car once.", "en"]],
    sticker: [["You finished! Here is a sticker for your sticker book.", "en"]],
    stickerAgain: [["You finished again! Your sticker book has one more.", "en"]],
    bookAsk: [["故事讲完了吗？", "zh"]],
    who: [["Who's playing?", "en"], ["谁在玩？", "zh"]],
    newPlayer: [["New player.", "en"], ["Pick a colour for your car.", "en"]],
    hello: [["Hello!", "en"]],
    carName: { red: [["Red car.", "en"]], blue: [["Blue car.", "en"]], yellow: [["Yellow car.", "en"]], green: [["Green car.", "en"]], orange: [["Orange car.", "en"]], purple: [["Purple car.", "en"]] }
  };
  var ASK_S = [["Which one starts with", "en"], SSS];

  var ACTS = {
    "en-s": {
      subject: "en", topic: "letters", lang: "en", head: '<div class="big-letter">s</div>', title: "Letter s", titleSay: [["Letter s.", "en"]], card: "s", sticker: { color: "blue", mark: "s" },
      intro: [["This is the letter s.", "en"], ["It makes this sound.", "en"], SSS, ["Tap each picture on the truck.", "en"]],
      lesson: { type: "tapAll", items: ["sun", "sock", "snake", "seal", "sandwich", "six"].map(function (k) {
        return { id: k, html: P[k].html, label: P[k].word, say: [w(k), SSS, w(k)] }; }) },
      readyLine: [["Well done. Now a little car game.", "en"]],
      check: [["sun", "dog", "hat"], ["cat", "sock", "pig"], ["fish", "ball", "snake"], ["moon", "seal", "dog"], ["sandwich", "bus", "cat"], ["hat", "pig", "six"]].map(function (opts, i) {
        var a = ["sun", "sock", "snake", "seal", "sandwich", "six"][i];
        return { options: opts, answer: a, label: a, ask: "Which one starts with sss?", prompt: ASK_S,
          optionHtml: function (o) { return P[o].html; },
          hint: opts.map(w), // after the question is replayed: just the three words, so he hears each first sound
          reveal: [["This one!", "en"], w(a), SSS, ["Tap the " + a + ".", "en"]],
          yes: [["Yes!", "en"], w(a), SSS] };
      }),
      endLine: function (p) { return [["All done for today.", "en"], ["Go and tell " + p.en + " about the s words.", "en"]]; }
    },
    "ma-count5": {
      subject: "ma", topic: "count", lang: "en", title: "Count the cars 1 to 5", titleSay: [["Count the cars.", "en"]], card: "1–5", sticker: { color: "orange", mark: "5" },
      intro: [["Let's count the cars in the car park.", "en"], ["Tap each car once.", "en"]],
      lesson: { type: "countRounds", rounds: [2, 3, 4, 5], colors: ["red", "blue", "yellow", "green", "orange"] },
      readyLine: [["Great counting. Now a little car game.", "en"]],
      check: [3, 5, 4, 2, 4, 5].map(function (n, i) {
        var opts = [[2, 3, 5], [4, 5, 3], [4, 2, 5], [3, 1, 2], [5, 4, 3], [3, 5, 4]][i];
        return { n: n, label: n + " cars", ask: "How many cars?", prompt: [["How many cars?", "en"]], options: opts.map(String), answer: String(n),
          optionHtml: function (o) { return '<span class="numeral">' + o + '</span>'; },
          hint: [["Let's count together.", "en"]].concat(EN_NUM.slice(1, n + 1).map(function (x) { return [x, "en"]; })),
          reveal: [[EN_NUM[n] + " cars!", "en"], ["Tap the " + EN_NUM[n] + ".", "en"]],
          yes: [["Yes! " + EN_NUM[n] + " cars.", "en"]] };
      }),
      endLine: function (p) { return [["All done for today.", "en"], ["Go and count some cars with " + p.en + ".", "en"]]; }
    },
    "zh-book": {
      subject: "zh", topic: "story", lang: "zh", title: "红车比赛", titleSay: [["红车比赛。", "zh"]], card: "📖", book: "https://jyanalyst.github.io/Chinese-books/index.html", sticker: { color: "red", mark: "书" },
      endLine: function (p) { return [["故事讲完了。", "zh"], ["你想跟" + p.zh + "说说红车吗？", "zh"]]; }
    },
    "zh-colours": {
      subject: "zh", topic: "colours", lang: "zh", title: "车的颜色", titleSay: [["车的颜色。", "zh"]], sub: "Car colours", card: "颜色", sticker: { color: "green", mark: "红" },
      intro: [["看，好多车！", "zh"], ["点一点每一辆车。", "zh"]],
      lesson: { type: "tapAll", cls: "wrap", items: ["red", "blue", "yellow", "green", "orange", "purple"].map(function (c) {
        return { id: c, html: Art.car(c), zh: ZH[c], label: ZH[c].zh, say: [["这是" + ZH[c].zh + "的车。", "zh"]] }; }) },
      readyLine: [["真棒！来玩一个小游戏吧。", "zh"]],
      check: [["red", ["red", "blue", "yellow"]], ["blue", ["green", "red", "blue"]], ["yellow", ["yellow", "green", "blue"]],
              ["green", ["green", "orange", "blue"]], ["purple", ["red", "purple", "yellow"]], ["orange", ["purple", "green", "orange"]]].map(function (x) {
        var a = x[0], z = ZH[a].zh;
        return { answer: a, options: x[1], label: z, ask: z + "的车在哪里？", askPy: ZH[a].py,
          optionHtml: function (o) { return Art.car(o); },
          prompt: [[z + "的车在哪里？", "zh"]],
          hint: [[z + "。", "zh"]],
          reveal: [["看，这是" + z + "的车。", "zh"], ["点一点" + z + "的车。", "zh"]],
          yes: [["对了！这是" + z + "的车。", "zh"]] };
      }),
      endLine: function (p) { return [["今天玩完了。", "zh"], ["你想跟" + p.zh + "说说车的颜色吗？", "zh"]]; }
    }
  };
  Object.keys(ACTS).forEach(function (k) { ACTS[k].id = k; });

  var SUBJECTS = [
    { id: "en", name: "English", say: [["English.", "en"]], color: "blue", topics: [
      { id: "letters", name: "Letter sounds", say: [["Letter sounds.", "en"]], acts: ["en-s"] },
      { id: "initial", name: "First sounds", acts: [] },
      { id: "rhymes", name: "Rhyming words", acts: [] },
      { id: "sight", name: "Sight words", acts: [] },
      { id: "listen", name: "Listen and pick", acts: [] } ] },
    { id: "ma", name: "Maths", say: [["Maths.", "en"]], color: "orange", topics: [
      { id: "count", name: "Counting", say: [["Counting.", "en"]], acts: ["ma-count5"], soon: ["Count to 10", "Count to 20"] },
      { id: "numerals", name: "Numbers and how many", acts: [] },
      { id: "more", name: "More or fewer", acts: [] },
      { id: "sorting", name: "Sorting", acts: [] },
      { id: "patterns", name: "Patterns", acts: [] },
      { id: "shapes", name: "Shapes", acts: [] } ] },
    { id: "zh", name: "华文 Chinese", say: [["华文。", "zh"]], color: "red", topics: [
      { id: "story", name: "故事 Story", say: [["故事。", "zh"]], acts: ["zh-book"] },
      { id: "colours", name: "颜色 Colours", say: [["颜色。", "zh"]], acts: ["zh-colours"] },
      { id: "family", name: "家人 Family", acts: [] },
      { id: "body", name: "身体 Body", acts: [] },
      { id: "food", name: "食物 Food", acts: [] },
      { id: "transport", name: "交通 Transport", acts: [] },
      { id: "patterns", name: "这是… 我有… 我要…", acts: [] },
      { id: "chars", name: "认字 Characters", acts: [] },
      { id: "songs", name: "儿歌 Songs", acts: [] } ] }
  ];
  function subject(id) { for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].id === id) return SUBJECTS[i]; return null; }
  function topic(sid, tid) { var s = subject(sid); if (!s) return null; for (var i = 0; i < s.topics.length; i++) if (s.topics[i].id === tid) return s.topics[i]; return null; }
  function countLines(n) { return EN_NUM.slice(1, n + 1).map(function (x) { return [x, "en"]; }).concat([[EN_NUM[n] + " cars!", "en"]]); }
  return { ACTS: ACTS, SUBJECTS: SUBJECTS, UI: UI, SSS: SSS, SND: SND, P: P, pic: pic, PEOPLE: PEOPLE, subject: subject, topic: topic, ZH: ZH, EN_NUM: EN_NUM, countLines: countLines };
})();
if (typeof module !== "undefined") module.exports = K1;
