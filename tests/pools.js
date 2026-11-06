/* Pool rules for the car game: every activity except the picture book has at least 12 distinct
   questions, each run draws 6, and every spoken line is already in audio/manifest.js.
   TTS spend is logged here: new clips would be a cost, and this build adds none. */
"use strict";
var fs = require("fs");
var vm = require("vm");
var path = require("path");
var root = path.join(__dirname, "..");
var ctx = {};
vm.createContext(ctx);
function load(p) { vm.runInContext(fs.readFileSync(path.join(root, p), "utf8"), ctx, { filename: p }); }
load("js/art.js");
load("js/activities.js");
load("js/maths.js");
load("js/english.js");
load("js/chinese.js");
var K1 = ctx.K1;
var fails = 0;
function assert(cond, msg) { if (!cond) { fails++; console.error("FAIL " + msg); } }

var manifestSrc = fs.readFileSync(path.join(root, "audio/manifest.js"), "utf8");
var audioKeys = new Set();
var re = /"((?:en|zh|snd)\|[^"]+)":/g, m;
while ((m = re.exec(manifestSrc))) audioKeys.add(m[1]);

function linesOf(x, out) {
  if (!x) return;
  if (Array.isArray(x) && x.length >= 2 && typeof x[0] === "string" && (x[1] === "en" || x[1] === "zh" || x[1] === "snd")) {
    out.push(x[1] + "|" + x[0]);
    return;
  }
  if (Array.isArray(x)) { x.forEach(function (y) { linesOf(y, out); }); return; }
  if (typeof x === "object") {
    Object.keys(x).forEach(function (k) { if (typeof x[k] !== "function") linesOf(x[k], out); });
  }
}
function sig(c) {
  return JSON.stringify({
    answer: c.answer, options: c.options, ask: c.ask, label: c.label,
    n: c.n == null ? null : c.n, parks: c.parks || null, scene: c.scene || null
  });
}

var checked = 0, missing = [];
Object.keys(K1.ACTS).forEach(function (id) {
  var a = K1.ACTS[id];
  if (a.book) {
    assert(!a.check, id + " is the book and must stay without a check pool");
    return;
  }
  checked++;
  assert(a.check && a.check.length >= 12, id + " check pool is " + (a.check ? a.check.length : 0) + ", want >= 12");
  var seen = {};
  (a.check || []).forEach(function (c, i) {
    var s = sig(c);
    assert(!seen[s], id + " question " + i + " repeats " + s);
    seen[s] = 1;
    assert(c.options && c.options.length >= 2, id + " question " + i + " needs options");
    assert(c.options.indexOf(c.answer) >= 0, id + " answer " + c.answer + " is not among " + c.options.join(","));
    var opts = {};
    c.options.forEach(function (o) { assert(!opts[o], id + " duplicate option " + o); opts[o] = 1; });
    var spoken = [];
    linesOf(c, spoken);
    spoken.forEach(function (k) { if (!audioKeys.has(k)) missing.push(id + " " + k); });
  });
  var spokenAll = [];
  linesOf(a, spokenAll);
  spokenAll.forEach(function (k) { if (!audioKeys.has(k)) missing.push(id + " lesson " + k); });
});
assert(checked === 29, "expected 29 activities with a check, got " + checked);

function initial(word) { return String(word).charAt(0).toLowerCase(); }
["en-s", "en-a", "en-t", "en-i", "en-p", "en-n"].forEach(function (id) {
  var L = id.slice(3);
  K1.ACTS[id].check.forEach(function (c, i) {
    var hits = c.options.filter(function (o) { return initial(o) === L; });
    assert(hits.length === 1 && hits[0] === c.answer, id + " q" + i + " should have one " + L + " word, got " + c.options.join(","));
  });
});
[["en-fs1", { s: 1, a: 1, t: 1 }], ["en-fs2", { p: 1, i: 1, n: 1 }]].forEach(function (pair) {
  K1.ACTS[pair[0]].check.forEach(function (c, i) {
    var L = c.ask.match(/with ([a-z])\?/)[1];
    var hits = c.options.filter(function (o) { return initial(o) === L; });
    assert(hits.length === 1 && hits[0] === c.answer, pair[0] + " q" + i + " (" + L + ") options " + c.options.join(","));
  });
});

var book = K1.ACTS["zh-book"];
assert(book && book.book && !book.check, "zh-book stays book-only");

var m1 = K1.ACTS["m1-count20"].lesson;
assert(m1.fixed && m1.type === "drivePast", "count to 20 is a fixed drive-past");
assert(m1.rounds[0].from === 1 && m1.rounds[0].to === 10 && m1.rounds[1].from === 11 && m1.rounds[1].to === 20, "count to 20 stays 1-10 then 11-20");
var m4 = K1.ACTS["m4-sort"].lesson;
assert(m4.fixed && m4.phases[0].garages.join(",") === "red,blue" && m4.phases[1].garages.join(",") === "big,small", "sorting stays colour then size");
var m5 = K1.ACTS["m5-pattern"].lesson;
assert(m5.fixed && m5.row && m5.items.map(function (it) { return it.label; }).join(",") === "red,blue,red,blue", "pattern lesson keeps the AB row");

function mulberry(seed) {
  var s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
var pool = K1.ACTS["en-s"].check;
var a = K1.pick(pool, 6, mulberry(1));
var b = K1.pick(pool, 6, mulberry(2));
assert(a.length === 6 && b.length === 6, "a run draws 6");
var ids = {};
a.forEach(function (c) { assert(pool.indexOf(c) >= 0, "drawn question left the pool"); assert(!ids[sig(c)], "repeat inside one run"); ids[sig(c)] = 1; });
assert(pool.length === 12, "pick must not shrink the pool");
assert(a.map(sig).join("\n") !== b.map(sig).join("\n"), "two seeds should be able to draw different sequences");
var fixed = K1.shuffle(m5.items, mulberry(3));
assert(m5.items.map(function (it) { return it.id; }).join(",") === "p0,p1,p2,p3", "shuffle must copy, not reorder the lesson");
assert(fixed.map(function (it) { return it.id; }).join(",").split(",").sort().join(",") === "p0,p1,p2,p3", "shuffled copy keeps every item");

var uniqMissing = missing.filter(function (x, i) { return missing.indexOf(x) === i; });
assert(uniqMissing.length === 0, "spoken lines missing from the manifest:\n" + uniqMissing.join("\n"));

var spend = { capUSD: 0.05, spentUSD: 0, newClips: uniqMissing.length, note: "Pools reuse recorded lines. No TTS request was made." };
fs.mkdirSync(path.join(root, "tools"), { recursive: true });
fs.writeFileSync(path.join(root, "tools/tts-spend.json"), JSON.stringify(spend, null, 2) + "\n");
console.log("activities with a check: " + checked);
console.log("TTS spend USD " + spend.spentUSD.toFixed(2) + " (cap " + spend.capUSD.toFixed(2) + ", new clips " + spend.newClips + ")");
if (fails) { console.error(fails + " failed"); process.exit(1); }
console.log("pool checks passed");
