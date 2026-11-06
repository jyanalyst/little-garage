/* English topics for K1 (NEL 2022 Language and Literacy, easy end): letter sounds a t i p n (Jolly Phonics group 1 after s),
   first sounds review, rhyming, sight words, listen and pick. Loaded after activities.js; adds activities and fills the English topics.
   Every spoken line is a [text, "en"|"snd"] pair in the data so tools/lines.js can record it. Pictures are emoji or simple SVG, no photos. */
(function () {
  "use strict";
  var CAR_MAP = {"en-s": {"color": "blue", "everyday": {"id": "toyota-prius-taxi", "name": "Toyota Prius", "prompt": "blue Toyota Prius Singapore taxi with a yellow rectangular roof sign (solid yellow, no flag colors)"}, "super": {"id": "ferrari-488", "name": "Ferrari 488", "prompt": "blue Ferrari 488 sports car"}, "tier10": "ferrari-488"}, "en-a": {"color": "red", "everyday": {"id": "vw-beetle", "name": "VW Beetle", "prompt": "classic red Volkswagen Beetle"}, "super": {"id": "bugatti-chiron", "name": "Bugatti Chiron", "prompt": "red Bugatti Chiron"}}, "en-t": {"color": "yellow", "everyday": {"id": "school-bus", "name": "Yellow Bus", "prompt": "yellow short school-style bus / shuttle van"}, "super": {"id": "koenigsegg-jesko", "name": "Koenigsegg Jesko", "prompt": "yellow Koenigsegg Jesko"}}, "en-i": {"color": "purple", "everyday": {"id": "tesla-model3", "name": "Tesla Model 3", "prompt": "purple Tesla Model 3 electric sedan"}, "super": {"id": "pagani-huayra", "name": "Pagani Huayra", "prompt": "purple Pagani Huayra"}}, "en-p": {"color": "orange", "everyday": {"id": "fiat-500", "name": "Fiat 500", "prompt": "orange Fiat 500 city car"}, "super": {"id": "aston-martin-vantage", "name": "Aston Martin Vantage", "prompt": "orange Aston Martin Vantage"}}, "en-n": {"color": "green", "everyday": {"id": "subaru-forester", "name": "Subaru Forester", "prompt": "green Subaru Forester SUV"}, "super": {"id": "ford-gt", "name": "Ford GT", "prompt": "green Ford GT"}}, "en-fs1": {"color": "blue", "everyday": {"id": "nissan-leaf", "name": "Nissan Leaf", "prompt": "blue Nissan Leaf hatchback"}, "super": {"id": "lotus-evora", "name": "Lotus Evora", "prompt": "blue Lotus Evora"}}, "en-fs2": {"color": "orange", "everyday": {"id": "mazda-mx5", "name": "Mazda MX-5", "prompt": "orange Mazda MX-5 Miata convertible"}, "super": {"id": "ferrari-f8", "name": "Ferrari F8", "prompt": "orange Ferrari F8 Tributo"}}, "en-rhyme": {"color": "yellow", "everyday": {"id": "ice-cream-van", "name": "Ice-cream Van", "prompt": "yellow ice-cream van with a soft-serve cone silhouette on the side (no text)"}, "super": {"id": "lamborghini-huracan", "name": "Lamborghini Huracan", "prompt": "yellow Lamborghini Huracan"}}, "en-sight1": {"color": "green", "everyday": {"id": "land-rover", "name": "Land Rover", "prompt": "green Land Rover Defender"}, "super": {"id": "mclaren-p1", "name": "McLaren P1", "prompt": "green McLaren P1"}}, "en-sight2": {"color": "red", "everyday": {"id": "fire-engine", "name": "Fire Engine", "prompt": "red fire engine truck with ladder"}, "super": {"id": "porsche-cayman-gt4", "name": "Porsche Cayman", "prompt": "red Porsche Cayman GT4"}}, "en-listen": {"color": "blue", "everyday": {"id": "police-car", "name": "Police Car", "prompt": "blue and white police sedan with a light bar on the roof (no text, no badges)"}, "super": {"id": "bugatti-veyron", "name": "Bugatti Veyron", "prompt": "blue Bugatti Veyron"}}};
  function withCar(sticker, actId) {
    var c = CAR_MAP[actId]; if (!c) return sticker;
    var out = { color: sticker.color, mark: sticker.mark, car: c.everyday.id, super: c.super.id, model: c.everyday.name, superModel: c.super.name }; out.tier10 = c.tier10 || c.super.id; return out;
  }

  var ACTS = K1.ACTS, SND = K1.SND;
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
  var YES = ["Yes!", "en"], THIS = ["This one!", "en"], AGAIN = ["Let's listen again.", "en"], GAME = ["Now a little car game.", "en"];
  function endLine(what) { return function (p) { return [["All done for today.", "en"], ["Go and tell " + p.en + " about " + what + ".", "en"]]; }; }
  function add(id, topic, a) { a.id = id; a.subject = "en"; a.topic = topic; a.lang = "en"; ACTS[id] = a; return id; }

  // picture words: emoji, or SVG where an iPad has no good emoji
  var W = {};
  function pw(k, e, word) { W[k] = { html: e.charAt(0) === "<" ? e : '<span class="emoji">' + e + '</span>', word: word || k }; }
  Object.keys(K1.P).forEach(function (k) { W[k] = K1.P[k]; });
  pw("apple", "🍎"); pw("ant", "🐜"); pw("alligator", "🐊"); pw("ambulance", "🚑");
  pw("taxi", "🚕"); pw("tiger", "🐯"); pw("tomato", "🍅"); pw("tent", "⛺");
  pw("igloo", Art.igloo()); pw("insect", "🐛"); pw("ink", Art.ink());
  pw("pencil", "✏️"); pw("panda", "🐼"); pw("police", "🚓", "police car");
  pw("nose", "👃"); pw("nut", "🥜"); pw("nest", "🪹"); pw("noodles", "🍜");
  pw("iguana", "🦎"); pw("astronaut", "🧑‍🚀"); pw("axe", "🪓"); pw("tooth", "🦷"); pw("turtle", "🐢"); pw("penguin", "🐧"); pw("pizza", "🍕");
  pw("nine", "9️⃣"); pw("net", "🥅"); pw("spoon", "🥄"); pw("cake", "🎂");
  pw("bus", "🚌"); pw("moon", "🌙"); pw("star", "⭐"); pw("truck", "🚚"); pw("duck", "🦆"); pw("bee", "🐝"); pw("tree", "🌳"); pw("car", "🚗");
  function word(k) { return [cap(W[k].word) + ".", "en"]; }
  function picOpt(o) { return W[o].html; }

  /* 1. Letter sounds a t i p n: same shape as letter s (truck of pictures, then "Which one starts with ..?") */
  var COL = { a: "red", t: "yellow", i: "purple", p: "orange", n: "green" };
  function letter(L, items, checks) {
    var S = SND[L], ask = [["Which one starts with", "en"], S];
    return add("en-" + L, "letters", {
      head: '<div class="big-letter">' + L + '</div>', title: "Letter " + L, titleSay: [["Letter " + L + ".", "en"]], card: L, sticker: withCar({ color: COL[L], mark: L }, "en-" + L),
      intro: [["This is the letter " + L + ".", "en"], ["It makes this sound.", "en"], S, ["Tap each picture on the truck.", "en"]],
      lesson: { type: "tapAll", items: items.map(function (k) { return { id: k, html: W[k].html, label: W[k].word, say: [word(k), S, word(k)] }; }) },
      readyLine: [["Well done. Now a little car game.", "en"]],
      check: checks.map(function (x) {
        var a = x[0], opts = x[1];
        return { options: opts, answer: a, label: W[a].word, ask: "Which one starts with " + L + "?", prompt: ask, optionHtml: picOpt,
          hint: opts.map(word),
          reveal: [THIS, word(a), S, ["Tap the " + W[a].word + ".", "en"]],
          yes: [YES, word(a), S] };
      }),
      endLine: endLine("the " + L + " words")
    });
  }
  // 6 questions each, every answer a different picture taught in the lesson (i has only 4 good picture words, so two come back with new distractors)
  var LET = [
    letter("a", ["apple", "ant", "alligator", "ambulance", "astronaut", "axe"], [["apple", ["apple", "dog", "sun"]], ["ant", ["ball", "ant", "fish"]], ["ambulance", ["hat", "pig", "ambulance"]],
      ["astronaut", ["astronaut", "moon", "duck"]], ["axe", ["bee", "axe", "sock"]], ["alligator", ["cat", "tree", "alligator"]],
      ["apple", ["bus", "apple", "duck"]], ["ant", ["ant", "cat", "moon"]], ["ambulance", ["tree", "car", "ambulance"]],
      ["astronaut", ["pig", "astronaut", "ball"]], ["axe", ["sun", "fish", "axe"]], ["alligator", ["hat", "alligator", "bee"]]]),
    letter("t", ["taxi", "tiger", "tomato", "tent", "tooth", "turtle"], [["taxi", ["taxi", "bus", "moon"]], ["tiger", ["dog", "sock", "tiger"]], ["tomato", ["tomato", "ball", "fish"]],
      ["turtle", ["duck", "turtle", "sun"]], ["tooth", ["cat", "bee", "tooth"]], ["tent", ["tent", "pig", "hat"]],
      ["taxi", ["cat", "taxi", "fish"]], ["tiger", ["moon", "pig", "tiger"]], ["tomato", ["hat", "tomato", "duck"]],
      ["turtle", ["ball", "car", "turtle"]], ["tooth", ["sun", "tooth", "bus"]], ["tent", ["bee", "dog", "tent"]]]),
    letter("i", ["igloo", "insect", "ink", "iguana"], [["igloo", ["igloo", "sun", "dog"]], ["insect", ["cat", "insect", "ball"]], ["ink", ["moon", "hat", "ink"]],
      ["iguana", ["iguana", "duck", "bus"]], ["igloo", ["fish", "tree", "igloo"]], ["insect", ["sock", "insect", "car"]],
      ["igloo", ["pig", "igloo", "bee"]], ["insect", ["moon", "tree", "insect"]], ["ink", ["bus", "ink", "cat"]],
      ["iguana", ["ball", "sock", "iguana"]], ["igloo", ["hat", "car", "igloo"]], ["insect", ["fish", "pig", "insect"]]]),
    letter("p", ["pig", "pencil", "panda", "police", "penguin", "pizza"], [["pig", ["pig", "sun", "cat"]], ["pencil", ["ball", "dog", "pencil"]], ["panda", ["panda", "fish", "moon"]],
      ["penguin", ["duck", "penguin", "bee"]], ["pizza", ["cake", "hat", "pizza"]], ["police", ["police", "bus", "sock"]],
      ["pig", ["moon", "pig", "duck"]], ["pencil", ["cat", "fish", "pencil"]], ["panda", ["bus", "panda", "hat"]],
      ["penguin", ["sun", "ball", "penguin"]], ["pizza", ["dog", "pizza", "tree"]], ["police", ["car", "moon", "police"]]]),
    letter("n", ["nose", "nut", "nest", "noodles", "nine", "net"], [["nose", ["nose", "sun", "cat"]], ["nut", ["dog", "nut", "ball"]], ["nest", ["fish", "hat", "nest"]],
      ["nine", ["nine", "bee", "car"]], ["net", ["moon", "net", "duck"]], ["noodles", ["cake", "tree", "noodles"]],
      ["nose", ["ball", "nose", "duck"]], ["nut", ["sun", "pig", "nut"]], ["nest", ["cat", "nest", "moon"]],
      ["nine", ["hat", "bus", "nine"]], ["net", ["fish", "net", "dog"]], ["noodles", ["bee", "noodles", "car"]]])
  ];

  /* 2. First sounds: mixed review of three letter sounds (hear a sound, find the picture) */
  function firstSounds(id, letters, pics, checks, color) {
    return add(id, "initial", {
      title: "First sounds " + letters.join(" "), titleSay: [["First sounds.", "en"]], card: letters.join(" "), sticker: withCar({ color: color, mark: letters[0] + letters[1] + letters[2] }, id),
      intro: [["Each picture has a first sound.", "en"], ["Tap each picture.", "en"]],
      lesson: { type: "tapAll", items: pics.map(function (k, i) { var L = letters[i >> 1];
        return { id: k, html: '<span class="li-letter">' + L + '</span>' + W[k].html, label: W[k].word, say: [SND[L], word(k)] }; }) },
      readyLine: [["Well done. Now a little car game.", "en"]],
      check: checks.map(function (x) {
        var L = x[0], a = x[1], opts = x[2], ask = [["Which one starts with", "en"], SND[L]];
        return { options: opts, answer: a, label: W[a].word, ask: "Which one starts with " + L + "?", prompt: ask, optionHtml: picOpt,
          hint: opts.map(word), reveal: [THIS, word(a), SND[L], ["Tap the " + W[a].word + ".", "en"]], yes: [YES, word(a), SND[L]] };
      }),
      endLine: endLine("first sounds")
    });
  }
  var FS = [
    firstSounds("en-fs1", ["s", "a", "t"], ["sun", "sock", "apple", "ant", "taxi", "tiger"], [["t", "taxi", ["sun", "ant", "taxi"]], ["s", "sock", ["tiger", "sock", "apple"]], ["a", "alligator", ["alligator", "seal", "tent"]],
      ["t", "tomato", ["ambulance", "tomato", "snake"]], ["s", "six", ["six", "taxi", "ant"]], ["a", "astronaut", ["sun", "tiger", "astronaut"]],
      ["s", "sun", ["taxi", "sun", "ant"]], ["a", "apple", ["apple", "tiger", "sock"]], ["t", "tiger", ["ant", "sun", "tiger"]],
      ["s", "seal", ["seal", "apple", "taxi"]], ["a", "axe", ["sock", "axe", "tiger"]], ["t", "tooth", ["tooth", "ant", "sun"]]], "blue"),
    firstSounds("en-fs2", ["p", "i", "n"], ["pig", "panda", "insect", "igloo", "nose", "nut"], [["n", "nut", ["pig", "nut", "igloo"]], ["p", "panda", ["panda", "ink", "nest"]], ["i", "igloo", ["noodles", "pencil", "igloo"]],
      ["p", "pizza", ["nine", "pizza", "insect"]], ["n", "net", ["iguana", "pencil", "net"]], ["i", "ink", ["ink", "penguin", "nose"]],
      ["p", "pig", ["pig", "nose", "igloo"]], ["i", "insect", ["nut", "insect", "panda"]], ["n", "nose", ["nose", "pig", "ink"]],
      ["p", "pencil", ["igloo", "pencil", "nut"]], ["i", "iguana", ["iguana", "panda", "nose"]], ["n", "noodles", ["pig", "noodles", "insect"]]], "orange")
  ];

  /* 3. Rhyming: car / star, truck / duck, cat / hat, bee / tree */
  function pair(a, b) { return [cap(W[a].word) + ", " + W[b].word + ".", "en"]; }
  var RH = add("en-rhyme", "rhymes", {
    title: "Rhyme time", titleSay: [["Rhyme time.", "en"]], card: "🚗⭐", sticker: withCar({ color: "yellow", mark: "⭐" }, "en-rhyme"),
    intro: [["Some words sound the same at the end.", "en"], ["Tap each pair.", "en"]],
    lesson: { type: "tapAll", cls: "wrap", items: [["car", "star"], ["truck", "duck"], ["cat", "hat"], ["bee", "tree"], ["moon", "spoon"], ["cake", "snake"]].map(function (x) {
      return { id: x[0], html: '<span class="emoji pair">' + W[x[0]].html + W[x[1]].html + '</span>', label: W[x[0]].word + " " + W[x[1]].word, say: [pair(x[0], x[1]), ["They rhyme!", "en"]] }; }) },
    readyLine: [["Well done.", "en"], GAME],
    check: [["car", "star", ["ball", "star", "fish"]], ["cat", "hat", ["hat", "sun", "pig"]], ["truck", "duck", ["dog", "sock", "duck"]],
            ["bee", "tree", ["fish", "tree", "pig"]], ["moon", "spoon", ["spoon", "car", "hat"]], ["cake", "snake", ["ball", "dog", "snake"]],
            ["car", "star", ["duck", "star", "cat"], 1], ["cat", "hat", ["tree", "bus", "hat"], 1], ["truck", "duck", ["moon", "duck", "pig"], 1],
            ["bee", "tree", ["car", "tree", "sock"], 1], ["moon", "spoon", ["hat", "fish", "spoon"], 1], ["cake", "snake", ["tree", "snake", "bus"], 1]].map(function (x) {
      var t = x[0], a = x[1], opts = x[2], ask = ["Which one rhymes with " + t + "?", "en"];
      // new distractor sets reuse the target word and "They rhyme!" so no new joined sentence is recorded
      var hint = x[3] ? [word(t), ["They rhyme!", "en"]] : [word(t), [opts.map(function (o) { return cap(W[o].word); }).join(". ") + ".", "en"]];
      return { options: opts, answer: a, label: t + " / " + a, ask: ask[0], prompt: [ask], optionHtml: picOpt, scene: { type: "html", html: W[t].html },
        hint: hint,
        reveal: [THIS, pair(t, a), ["Tap the " + a + ".", "en"]], yes: [YES, pair(t, a), ["They rhyme!", "en"]] };
    }),
    endLine: endLine("rhyming words")
  });

  /* 4. Sight words: short words he will see on the road and in early readers (word cards, no sums) */
  var NUMW = ["", "one letter", "two letters", "three letters", "four letters"];
  function sight(id, title, card, color, words, checks, readyExtra) {
    return add(id, "sight", {
      title: title, titleSay: [[title + ".", "en"]], card: card, sticker: withCar({ color: color, mark: card }, id),
      intro: [["These are words we can read.", "en"], ["Tap each word.", "en"]],
      lesson: { type: "tapAll", items: words.map(function (x) {
        return { id: x[0], html: '<span class="word-card">' + x[0] + '</span><span class="emoji sm">' + x[1] + '</span>', label: "", say: [[cap(x[0]) + ".", "en"], [x[2], "en"]] }; }) },
      readyLine: (readyExtra || []).concat([["Well done.", "en"], GAME]),
      check: checks.map(function (x) {
        var a = x[0], opts = x[1], find = ["Find the word " + a + ".", "en"];
        return { options: opts, answer: a, label: a, ask: find[0], prompt: [find], optionHtml: function (o) { return '<span class="word-card">' + o + '</span>'; },
          hint: [[cap(a) + " has " + NUMW[a.length] + ".", "en"]], reveal: [THIS, [cap(a) + ".", "en"], ["Tap the word " + a + ".", "en"]], yes: [YES, [cap(a) + ".", "en"]] };
      }),
      endLine: endLine("the words you read")
    });
  }
  var SW = [
    sight("en-sight1", "Road words", "go", "green", [["go", "🟢", "Green light, go!"], ["stop", "🛑", "Red light, stop!"], ["I", "🙋", "I drive my car."], ["see", "👀", "I see a bus."],
      ["we", "👨‍👩‍👦", "We go in the car."], ["can", "👍", "I can stop."]],
      [["go", ["go", "stop", "see"]], ["stop", ["I", "stop", "go"]], ["see", ["see", "I", "stop"]], ["I", ["we", "can", "I"]], ["we", ["we", "see", "go"]], ["can", ["stop", "can", "we"]],
       ["go", ["I", "go", "can"]], ["stop", ["see", "we", "stop"]], ["see", ["can", "see", "go"]], ["I", ["I", "go", "see"]], ["we", ["can", "we", "stop"]], ["can", ["go", "I", "can"]]]),
    sight("en-sight2", "My car", "my", "red", [["my", "🙋", "My car."], ["car", "🚗", "A car goes on the road."], ["is", "➡️", "My car is red."], ["red", "🔴", "Red like a fire engine."],
      ["the", "👉", "The bus is big."], ["big", "🐘", "A big bus."]],
      [["car", ["car", "my", "is"]], ["red", ["is", "red", "my"]], ["my", ["red", "car", "my"]], ["is", ["is", "the", "big"]], ["the", ["big", "the", "car"]], ["big", ["my", "red", "big"]],
       ["car", ["big", "car", "the"]], ["red", ["the", "my", "red"]], ["my", ["is", "my", "big"]], ["is", ["car", "big", "is"]], ["the", ["red", "is", "the"]], ["big", ["the", "big", "is"]]], [["My car is red.", "en"]])
  ];

  /* 5. Listen and pick: two words to hold in mind (big or small, and a colour) */
  function desc(id) { var x = id.split("-"); return x[0] + " " + x[1] + " car"; }
  var LP = add("en-listen", "listen", {
    title: "Big and small cars", titleSay: [["Big and small cars.", "en"]], card: "🚙", sticker: withCar({ color: "blue", mark: "👂" }, "en-listen"),
    intro: [["Listen carefully.", "en"], ["Tap each car.", "en"]],
    lesson: { type: "tapAll", cls: "wrap", items: ["big-red", "small-blue", "big-yellow", "small-green", "big-green", "small-red"].map(function (id) {
      var x = id.split("-"); return { id: id, html: Art.sizedCar(x[0], x[1]), label: x[0] + " " + x[1], say: [["A " + desc(id) + ".", "en"]] }; }) },
    readyLine: [["Well done.", "en"], GAME],
    check: [["small-red", ["big-red", "small-red", "small-blue"]], ["big-blue", ["small-blue", "big-blue", "big-yellow"]], ["small-yellow", ["big-yellow", "small-green", "small-yellow"]],
            ["big-green", ["small-green", "big-green", "big-red"]], ["small-blue", ["big-blue", "small-red", "small-blue"]], ["big-yellow", ["big-yellow", "small-yellow", "big-green"]],
            ["small-red", ["small-yellow", "big-green", "small-red"]], ["big-blue", ["big-red", "small-yellow", "big-blue"]], ["small-yellow", ["small-blue", "big-red", "small-yellow"]],
            ["big-green", ["big-blue", "small-yellow", "big-green"]], ["small-blue", ["small-green", "big-yellow", "small-blue"]], ["big-yellow", ["small-red", "big-blue", "big-yellow"]]].map(function (x) {
      var a = x[0], p = a.split("-"), find = ["Find the " + desc(a) + ".", "en"];
      return { options: x[1], answer: a, label: desc(a), ask: find[0], prompt: [find], optionHtml: function (o) { var q = o.split("-"); return Art.sizedCar(q[0], q[1]); },
        hint: [[cap(p[0]) + ".", "en"], [cap(p[1]) + ".", "en"]], reveal: [THIS, ["The " + desc(a) + ".", "en"], ["Tap the " + desc(a) + ".", "en"]], yes: [YES, ["The " + desc(a) + ".", "en"]] };
    }),
    endLine: endLine("the cars you found")
  });

  var E = K1.subject("en");
  E.topics = [
    { id: "letters", name: "Letter sounds", say: [["Letter sounds.", "en"]], acts: ["en-s"].concat(LET) },
    { id: "initial", name: "First sounds", say: [["First sounds.", "en"]], acts: FS },
    { id: "rhymes", name: "Rhyming words", say: [["Rhyming words.", "en"]], acts: [RH] },
    { id: "sight", name: "Sight words", say: [["Sight words.", "en"]], acts: SW },
    { id: "listen", name: "Listen and pick", say: [["Listen and pick.", "en"]], acts: [LP] }
  ];
})();
