/* Maths topics 1-7 for K1 (NEL: numeracy, easy end). Loaded after activities.js; adds activities and fills the Maths topics.
   Every spoken line is a [text, "en"] pair stored in the data, so tools/lines.js can find and record all of them.
   No sums: "one more" is shown with cars only (no + or = and no written sums). */
(function () {
  "use strict";
  var N = K1.EN_NUM, ACTS = K1.ACTS;
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
  function num(n) { return [N[n], "en"]; }
  function cars(n) { return [N[n] + " cars!", "en"]; }
  function numHtml(o) { return '<span class="numeral">' + o + '</span>'; }
  var GAME = ["Now a little car game.", "en"], YES = ["Yes!", "en"], THIS = ["This one!", "en"], AGAIN = ["Let's listen again.", "en"];
  var PALETTE = ["red", "blue", "yellow", "green", "orange", "purple"];
  // one shared stop line for the new maths topics (keeps the voice budget small)
  function endLine(p) { return [["All done for today.", "en"], ["Go and tell " + p.en + " about your cars.", "en"]]; }
  function add(id, a) { a.id = id; a.subject = "ma"; a.lang = "en"; a.endLine = a.endLine || endLine; ACTS[id] = a; }

  /* 1. Count to 20: cars drive past one by one; he taps each car and the app says the number. */
  add("m1-count20", {
    topic: "count", title: "Count to 20", titleSay: [["Count to twenty.", "en"]], card: "20", sticker: { color: "purple", mark: "20" },
    intro: [["Cars are coming down the road.", "en"], ["Tap each car and count along.", "en"]],
    lesson: { type: "drivePast", rounds: [[1, 10], [11, 20]].map(function (r) {
      var nums = []; for (var i = r[0]; i <= r[1]; i++) nums.push(num(i));
      return { from: r[0], to: r[1], nums: nums, end: [cars(r[1])] }; }), more: [["More cars are coming.", "en"]] },
    readyLine: [["Great counting, all the way to twenty.", "en"], GAME],
    check: [[[3, 4, 5], 6, [6, 2, 9]], [[9, 10, 11], 12, [12, 7, 15]], [[17, 18, 19], 20, [20, 13, 16]]].map(function (x) {
      var seq = x[0], ans = x[1];
      return { label: "after " + seq[2], answer: String(ans), options: x[2].map(String), ask: "What number comes next?", optionHtml: numHtml,
        scene: { type: "seq", seq: seq },
        prompt: seq.map(num).concat([["What number comes next?", "en"]]),
        hint: [["Let's count again.", "en"]].concat(seq.map(num)).concat([["What number comes next?", "en"]]),
        reveal: [THIS, num(ans), ["Tap the " + N[ans] + ".", "en"]],
        yes: [YES, num(ans)] };
    })
  });

  /* 2. Number match: park the right number of cars in the bay with the numeral (1-10). */
  function bay(n) { return [["Bay number " + N[n] + ".", "en"], ["Park " + N[n] + " cars.", "en"]]; }
  add("m2-match", {
    topic: "numerals", title: "Park the cars", titleSay: [["Park the cars.", "en"]], card: "🅿️", sticker: { color: "blue", mark: "🅿️" },
    intro: [["Park the cars in the bay.", "en"], ["Look at the number on the bay.", "en"]],
    lesson: { type: "park", rounds: [2, 4, 6].map(function (n) {
      var c = []; for (var i = 1; i <= n; i++) c.push(num(i));
      return { n: n, start: bay(n), nums: c, end: [cars(n)] }; }), full: [["The bay is full.", "en"]] },
    readyLine: [["Well done. Every bay is full.", "en"], GAME],
    check: [[3, [1, 3, 5]], [5, [5, 2, 8]], [8, [4, 8, 10]]].map(function (x) {
      var n = x[0];
      return { label: "bay " + n, answer: String(n), options: x[1].map(String), ask: "Which car park has " + n + " cars?", wide: true,
        optionHtml: function (o) { return Art.group(+o); }, scene: { type: "bay", n: n },
        prompt: [["Bay number " + N[n] + ".", "en"], ["Which car park has " + N[n] + " cars?", "en"]],
        hint: [AGAIN, ["Bay number " + N[n] + ".", "en"], ["Count the cars in each car park.", "en"]],
        reveal: [THIS, cars(n), ["Tap this car park.", "en"]],
        yes: [YES, cars(n)] };
    })
  });

  /* 3. More or fewer: two car parks side by side within 10. */
  var Q = { more: ["Which car park has more cars?", "en"], fewer: ["Which car park has fewer cars?", "en"] };
  var HAS = { more: ["This car park has more cars.", "en"], fewer: ["This car park has fewer cars.", "en"] };
  add("m3-more", {
    topic: "more", title: "More or fewer", titleSay: [["More or fewer.", "en"]], card: "⚖️", sticker: { color: "orange", mark: "⚖️" },
    intro: [["Two car parks.", "en"], ["Tap each car park to count its cars.", "en"]],
    lesson: { type: "compare", rounds: [[2, 6, "more"], [7, 3, "fewer"]].map(function (r) {
      return { a: r[0], b: r[1], q: r[2], start: [Q[r[2]]], sayA: [cars(r[0])], sayB: [cars(r[1])], end: [HAS[r[2]]], win: (r[2] === "more") === (r[0] > r[1]) ? "L" : "R" }; }),
      next: [["Tap each car park to count its cars.", "en"]] },
    readyLine: [["Well done.", "en"], GAME],
    check: [[4, 9, "more"], [8, 3, "fewer"], [5, 1, "more"]].map(function (x) {
      var win = (x[2] === "more") === (x[0] > x[1]) ? "L" : "R";
      return { label: x[2] + " (" + x[0] + " or " + x[1] + ")", answer: win, options: ["L", "R"], ask: Q[x[2]][0], wide: true, parks: { L: x[0], R: x[1] },
        optionHtml: function (o) { return Art.group(o === "L" ? x[0] : x[1], o === "L" ? "blue" : "red"); },
        prompt: [Q[x[2]]], hint: [AGAIN, Q[x[2]]], reveal: [THIS, HAS[x[2]], ["Tap this car park.", "en"]], yes: [YES, HAS[x[2]]] };
    })
  });

  /* 4. Sorting: by colour, then big and small. Tap the garage the car belongs in. */
  function sortLines(k) { return { right: [["Yes! The " + k + " garage.", "en"]], wrong: [["This car is " + k + ".", "en"], ["Try the " + k + " garage.", "en"]] }; }
  var SK = {}; ["red", "blue", "yellow", "green", "big", "small"].forEach(function (k) { SK[k] = sortLines(k); });
  function carOf(k) { return k === "big" || k === "small" ? '<span class="sort-car ' + k + '">' + Art.car("green") + '</span>' : '<span class="sort-car">' + Art.car(k) + '</span>'; }
  add("m4-sort", {
    topic: "sorting", title: "Car garages", titleSay: [["Car garages.", "en"]], card: "🏠", sticker: { color: "green", mark: "🎨" },
    intro: [["Help the cars go home.", "en"], ["Each car goes to its own garage.", "en"]],
    lesson: { type: "sort", where: [["Where does this car go?", "en"]], phases: [
      { garages: ["red", "blue"], cars: ["red", "blue", "blue", "red"], start: [["Red cars to the red garage. Blue cars to the blue garage.", "en"]] },
      { garages: ["big", "small"], cars: ["big", "small", "small", "big"], start: [["Now big and small.", "en"], ["Big cars to the big garage. Small cars to the small garage.", "en"]] }
    ], say: SK },
    readyLine: [["Every car is home.", "en"], GAME],
    check: [["yellow", ["yellow", "green"]], ["small", ["big", "small"]], ["green", ["yellow", "green"]]].map(function (x) {
      var k = x[0];
      return { label: k + " car", answer: k, options: x[1], ask: "Where does this car go?", scene: { type: "sortCar", kind: k },
        optionHtml: function (o) { return Art.garage(o) + '<span class="opt-word">' + o + '</span>'; },
        prompt: [["Where does this car go?", "en"]], hint: [["Look at the car.", "en"], ["This car is " + k + ".", "en"]],
        reveal: [THIS, ["The " + k + " garage.", "en"], ["Tap the " + k + " garage.", "en"]], yes: SK[k].right };
    })
  });
  K1.carOf = carOf;

  /* 5. Patterns: AB car patterns, what comes next? */
  function rowLine(row) { return [row.map(function (c, i) { return i ? c : cap(c); }).join(", ") + ".", "en"]; }
  add("m5-pattern", {
    topic: "patterns", title: "Car patterns", titleSay: [["Car patterns.", "en"]], card: "🔁", sticker: { color: "red", mark: "🔁" },
    intro: [["Look at the cars in a line.", "en"], ["Tap each car.", "en"]],
    lesson: { type: "tapAll", row: true, items: ["red", "blue", "red", "blue"].map(function (c, i) { return { id: "p" + i, html: Art.car(c), label: c, say: [[c + ".", "en"]] }; }) },
    readyLine: [rowLine(["red", "blue", "red", "blue"]), ["Red comes next.", "en"], GAME],
    check: [[["red", "blue", "red", "blue"], "red", ["red", "blue", "yellow"]], [["yellow", "green", "yellow", "green", "yellow"], "green", ["yellow", "green", "red"]],
            [["blue", "orange", "blue", "orange"], "blue", ["orange", "purple", "blue"]]].map(function (x) {
      var row = x[0], a = x[1];
      return { label: row.join("-") + "-?", answer: a, options: x[2], ask: "What comes next?", scene: { type: "row", row: row },
        optionHtml: function (o) { return Art.car(o); },
        prompt: [rowLine(row), ["What comes next?", "en"]], hint: [AGAIN, rowLine(row), ["What comes next?", "en"]],
        reveal: [THIS, [cap(a) + " comes next.", "en"], ["Tap the " + a + " car.", "en"]], yes: [YES, [cap(a) + " comes next.", "en"]] };
    })
  });

  /* 6. Shapes on cars and road signs. */
  var SHAPE = {
    circle: { a: "A circle.", about: "A wheel is a circle.", hint: "A circle is round." },
    square: { a: "A square.", about: "This parking sign is a square.", hint: "A square has four sides, all the same." },
    triangle: { a: "A triangle.", about: "This warning sign is a triangle.", hint: "A triangle has three sides." },
    rectangle: { a: "A rectangle.", about: "A number plate is a rectangle.", hint: "A rectangle is long, with four sides." }
  };
  add("m6-shapes", {
    topic: "shapes", title: "Road shapes", titleSay: [["Road shapes.", "en"]], card: "🔺", sticker: { color: "yellow", mark: "🔺" },
    intro: [["Shapes are everywhere on the road.", "en"], ["Tap each shape.", "en"]],
    lesson: { type: "tapAll", items: ["circle", "square", "triangle", "rectangle"].map(function (k) { return { id: k, html: Art.shape(k), label: k, say: [[SHAPE[k].a, "en"], [SHAPE[k].about, "en"]] }; }) },
    readyLine: [["Well done.", "en"], GAME],
    check: [["triangle", ["triangle", "circle", "square"]], ["circle", ["square", "circle", "rectangle"]], ["rectangle", ["triangle", "square", "rectangle"]]].map(function (x) {
      var k = x[0], find = ["Find the " + k + ".", "en"];
      return { label: k, answer: k, options: x[1], ask: "Find the " + k + ".", optionHtml: function (o) { return Art.shape(o); },
        prompt: [find], hint: [AGAIN, find, [SHAPE[k].hint, "en"]], reveal: [THIS, [SHAPE[k].a, "en"], ["Tap the " + k + ".", "en"]], yes: [YES, [SHAPE[k].a, "en"]] };
    })
  });

  /* 7. One more: N cars parked, one more drives in, how many now? (objects only) */
  function parked(n) { return [n === 1 ? "One car." : cap(N[n]) + " cars.", "en"]; }
  function now(n) { return ["Now " + N[n] + " cars!", "en"]; }
  add("m7-onemore", {
    topic: "onemore", title: "One more car", titleSay: [["One more car.", "en"]], card: "🚙", sticker: { color: "blue", mark: "🚙" },
    intro: [["Some cars are parked.", "en"], ["One more car is coming.", "en"]],
    lesson: { type: "oneMore", rounds: [1, 2, 3].map(function (n) {
      var c = []; for (var i = 1; i <= n + 1; i++) c.push(num(i));
      return { n: n, start: [parked(n), ["Tap the new car to drive it in.", "en"]], nums: c, end: [now(n + 1)] }; }) },
    readyLine: [["One more, every time!", "en"], GAME],
    check: [[3, [4, 3, 6]], [4, [5, 2, 4]], [1, [2, 1, 5]]].map(function (x) {
      var n = x[0], t = n + 1, c = [];
      for (var i = 1; i <= t; i++) c.push(num(i));
      return { label: n + " and one more", answer: String(t), options: x[1].map(String), ask: "How many cars now?", optionHtml: numHtml,
        n: t, scene: { type: "oneMore", n: n },
        prompt: [parked(n), ["One more drives in.", "en"], ["How many cars now?", "en"]],
        hint: [["Let's count together.", "en"]].concat(c).concat([["How many cars now?", "en"]]),
        reveal: [now(t), ["Tap the " + N[t] + ".", "en"]], yes: [YES, now(t)] };
    })
  });

  // Maths topics in NEL order; the earlier count 1-5 stays in Counting next to Count to 20
  var M = K1.subject("ma");
  M.topics = [
    { id: "count", name: "Counting", say: [["Counting.", "en"]], acts: ["ma-count5", "m1-count20"] },
    { id: "numerals", name: "Numbers and how many", say: [["Numbers and how many.", "en"]], acts: ["m2-match"] },
    { id: "more", name: "More or fewer", say: [["More or fewer.", "en"]], acts: ["m3-more"] },
    { id: "sorting", name: "Sorting", say: [["Sorting.", "en"]], acts: ["m4-sort"] },
    { id: "patterns", name: "Patterns", say: [["Patterns.", "en"]], acts: ["m5-pattern"] },
    { id: "shapes", name: "Shapes", say: [["Shapes.", "en"]], acts: ["m6-shapes"] },
    { id: "onemore", name: "One more", say: [["One more.", "en"]], acts: ["m7-onemore"] }
  ];
})();
