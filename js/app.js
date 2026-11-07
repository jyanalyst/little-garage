/* Little Garage 小车库: menu levels by address hash (like the maths games menu), one activity per session,
   a 6-question no-fail check drawn from a larger pool, a sticker for finishing, parents-only log. No network code, no timers shown, no scores. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var A = K1.ACTS, gateOpen = false, play = null, unlocked = false;
  var SCREENS = ["who", "newplayer", "home", "subjects", "subject", "topic", "play", "stickers", "bookdone", "gate", "parent"];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* Spam-proof taps: per-element debounce (~400ms), one fire for touch+click (iPad), optional screen busy lock.
     kind "nav" uses the shared screenBusy; answers/lesson pass their own guards. */
  var TAP_MS = 400, screenBusyUntil = 0;
  function screenBusy(ms) { screenBusyUntil = Date.now() + (ms == null ? TAP_MS : ms); }
  function isScreenBusy() { return Date.now() < screenBusyUntil; }
  function tap(el, fn, opts) {
    if (!el) return;
    opts = opts || {};
    var ms = opts.ms != null ? opts.ms : TAP_MS;
    function fire(e) {
      if (!unlocked) { unlocked = true; Speech.unlock(); }
      if (opts.nav && isScreenBusy()) return;
      var now = Date.now();
      if (el._k1TapAt && now - el._k1TapAt < ms) return;
      el._k1TapAt = now;
      if (opts.nav) screenBusy(ms);
      fn(e);
    }
    // pointerup = one event for mouse, touch, pen (avoids touchend+click double-fire on iPad)
    el.addEventListener("pointerup", function (e) {
      if (e.button != null && e.button !== 0) return;
      el._k1Ptr = Date.now();
      fire(e);
    });
    // click fallback (keyboard / older browsers); skip if pointerup just handled it
    el.addEventListener("click", function (e) {
      if (el._k1Ptr && Date.now() - el._k1Ptr < 700) return;
      fire(e);
    });
  }
  function zhText(z) { return K1Store.settings().pinyin && z.py ? '<ruby>' + esc(z.zh) + '<rt>' + esc(z.py) + '</rt></ruby>' : esc(z.zh); }
  var hearLines = null; // what the 🔊 button repeats on this screen
  function setHear(lines) { hearLines = lines; $("hearBtn").hidden = !lines; }

  function show(id, crumbs, back) {
    SCREENS.forEach(function (s) { $(s).classList.toggle("active", s === id); });
    document.body.setAttribute("data-screen", id);
    screenBusyUntil = 0; // new screen: allow the next intentional tap (busy only blocks mash on the same screen)
    ["goBtn","bookBtn","homeBtn","hearBtn","grownBtn","grownBtn2","playerChip"].forEach(function (id) { var el = $(id); if (el) el._k1TapAt = 0; });
    $("backBtn").hidden = !back; $("backBtn").onclick = back ? function () { if (isScreenBusy()) return; screenBusy(); location.hash = back; } : null; // busy checked before set
    $("homeBtn").hidden = id === "home" || id === "gate" || id === "parent" || id === "who" || id === "newplayer";
    $("crumbs").innerHTML = (crumbs || []).map(esc).join(' <span class="sep">›</span> ');
    if (id !== "play") $("caption").textContent = "";
    syncKeep();
  }

  /* ---------- Level 1: main menu ---------- */
  $("titleCar").innerHTML = Art.car("red") + Art.car("blue");
  tap($("goBtn"), function () { Speech.say(K1.UI.pickRoad, null, { force: true }); location.hash = "#subjects"; }, { nav: true });
  tap($("bookBtn"), function () { Speech.say(K1.UI.stickerBook, null, { force: true }); location.hash = "#stickers"; }, { nav: true });
  tap($("grownBtn"), function () { location.hash = "#gate"; }, { nav: true });
  tap($("grownBtn2"), function () { location.hash = "#gate"; }, { nav: true });

  /* ---------- Level 2: English / Maths / Chinese ---------- */
  function drawSubjects() {
    var box = $("subjectList"); box.innerHTML = "";
    K1.SUBJECTS.forEach(function (s) {
      var b = document.createElement("button"); b.type = "button"; b.className = "subject-card"; b.setAttribute("data-subject", s.id);
      b.innerHTML = '<div class="sc-car">' + Art.car(s.color) + '</div><div class="sc-name">' + esc(s.name) + '</div>';
      tap(b, function () { Speech.say(s.say, null, { force: true }); location.hash = "#s/" + s.id; }, { nav: true });
      box.appendChild(b);
    });
  }
  /* ---------- Level 3: topics of a subject ---------- */
  function drawSubject(sid) {
    var s = K1.subject(sid); if (!s) { location.hash = "#subjects"; return; }
    $("subjectTitle").textContent = s.name;
    var box = $("topicList"); box.innerHTML = "";
    s.topics.forEach(function (t) {
      var open = t.acts.length > 0, b = document.createElement("button"); b.type = "button";
      b.className = "tile" + (open ? "" : " soon"); b.setAttribute("data-topic", t.id); b.disabled = !open;
      b.innerHTML = '<span class="tile-name">' + esc(t.name) + '</span>' + (open ? '<span class="tile-go">🚗</span>' : '<span class="tile-soon">Coming soon</span>');
      if (open) tap(b, function () { Speech.say(t.say, null, { force: true }); location.hash = "#t/" + sid + "/" + t.id; }, { nav: true });
      box.appendChild(b);
    });
    show("subject", ["Home", s.name], "#subjects"); setHear(s.say);
  }
  /* ---------- Level 4: activities of a topic ---------- */
  function drawTopic(sid, tid) {
    var s = K1.subject(sid), t = K1.topic(sid, tid); if (!t) { location.hash = "#subjects"; return; }
    $("topicTitle").textContent = t.name;
    var box = $("actList"), got = {}, counts = {}; box.innerHTML = "";
    K1Store.stickers().forEach(function (x) { got[x.act] = true; counts[x.act] = x.count; });
    t.acts.forEach(function (id) {
      var a = A[id], b = document.createElement("button"); b.type = "button"; b.className = "act-card"; b.setAttribute("data-act", id);
      var tries = K1Store.tryCount(id), badge = tries === 0
        ? '<span class="act-badge new">New</span>'
        : '<span class="act-badge tried"><span class="badge-car" aria-hidden="true">' + Art.car(a.sticker.color) + '</span>Tried ' + tries + '×</span>';
      b.innerHTML = badge + '<span class="act-mark">' + esc(a.card) + '</span><span class="act-name">' + esc(a.title) + (a.sub ? '<small>' + esc(a.sub) + '</small>' : '') + '</span>' +
        (got[id] ? '<span class="act-got">' + Art.sticker(a.sticker, counts[id]) + '</span>' : '');
      tap(b, function () { if (a.book) openBook(id); else location.hash = "#play/" + id; }, { nav: true });
      box.appendChild(b);
    });
    (t.soon || []).forEach(function (x) { var d = document.createElement("div"); d.className = "act-card soon"; d.innerHTML = '<span class="act-mark">' + esc(x) + '</span><span class="act-name">Coming soon</span>'; box.appendChild(d); });
    show("topic", ["Home", s.name, t.name], "#s/" + sid); setHear(t.say || null);
  }

  /* ---------- the picture book (unchanged, opened as it is) ---------- */
  function openBook(id) {
    try { sessionStorage.setItem("k1.bookOpen", id); } catch (e) {}
    // the book shows a small 🚗 小车库 button only when opened like this (works with no browser Back, e.g. from the Home Screen)
    var back = location.href.split("#")[0].split("?")[0] + "#bookdone";
    var q = "?from=garage&back=" + encodeURIComponent(back);
    // Headless WebKit crashes on the book's real speechSynthesis path; keep test mode when the garage is under ?test=1.
    if (/[?&]test=1/.test(location.search)) q += "&test=1";
    Speech.stop(); location.href = A[id].book + q;
  }
  function bookReturn() { var v = null; try { v = sessionStorage.getItem("k1.bookOpen"); } catch (e) {} return v; }
  $("bookdoneCar").innerHTML = Art.car("red");
  tap($("bookYes"), function () { var id = bookReturn() || "zh-book"; try { sessionStorage.removeItem("k1.bookOpen"); } catch (e) {}
    K1Store.addLog({ subject: "zh", topic: "story", act: id, title: A[id].title, done: true, items: [] });
    startSticker(id); });
  tap($("bookNo"), function () { try { sessionStorage.removeItem("k1.bookOpen"); } catch (e) {} location.hash = "#t/zh/story"; });

  /* ---------- an activity: intro -> lesson -> ready -> check (6 drawn from the pool, no-fail) -> sticker -> end ---------- */
  function startPlay(id) {
    var a = A[id]; if (!a || a.book) { location.hash = "#subjects"; return; }
    var s = K1.subject(a.subject), t = K1.topic(a.subject, a.topic);
    play = { id: id, a: a, phase: "lesson", item: 0, miss: 0, results: [], started: true, busy: false, lessonBusy: false, lessonLocked: false, lockSeq: 0, stepSeq: 0, promptSeq: 0, lockFallbacks: 0 };
    K1Store.addTry(id); // count an attempt when the activity opens (not on remount of same play)
    show("play", [s.name, t.name, a.title], null);
    renderLesson();
  }
  function stage(html, cls) { var st = $("stage"); st.className = cls || ""; st.innerHTML = html; screenBusyUntil = 0; return st; }

  /* Lesson taps wait until the instruction has finished (same rule as the car-game answers).
     The timeout is the safety net when a clip never reports ended. */
  function setLessonLock(on) {
    if (play) play.lessonLocked = !!on;
    document.body.classList.toggle("lesson-locked", !!on);
    var nc = $("newCar"); if (nc) nc.classList.toggle("ready-tap", !on);
  }
  function bumpSeqs() {
    if (!play) return;
    play.stepSeq = (play.stepSeq || 0) + 1;
    play.promptSeq = (play.promptSeq || 0) + 1;
    play.lockSeq = (play.lockSeq || 0) + 1;
  }
  function sayPrompt(lines, then) {
    if (!play) return;
    var P = play, seq = ++P.promptSeq, done = false;
    setLessonLock(true);
    var t = setTimeout(function () { if (play === P) P.lockFallbacks = (P.lockFallbacks || 0) + 1; fin(); }, maxMs(lines));
    function fin() {
      if (done || play !== P || seq !== P.promptSeq) return;
      done = true; clearTimeout(t); setLessonLock(false); if (then) then();
    }
    Speech.say(lines || [], fin, { force: true });
  }
  /* Speech.say drops the callback when another line is still playing. Anything that must
     move the lesson forward uses this instead, so a dropped or stalled line still continues. */
  function afterSpeech(lines, cb, opts) {
    if (!play) { if (cb) cb(); return; }
    var P = play, seq = ++P.stepSeq, done = false;
    var t = setTimeout(function () { if (play === P) P.lockFallbacks = (P.lockFallbacks || 0) + 1; fin(); }, maxMs(lines));
    function fin() {
      if (done || play !== P || seq !== P.stepSeq) return;
      done = true; clearTimeout(t); if (cb) cb();
    }
    var ok = Speech.say(lines || [], fin, opts || { force: true });
    if (ok === false) { P.lockFallbacks = (P.lockFallbacks || 0) + 1; fin(); }
  }
  function syncKeep() {
    var b = $("keepBtn"); if (!b) return;
    b.hidden = !(play && (play.phase === "lesson" || play.phase === "check") && document.body.getAttribute("data-screen") === "play");
  }
  function keepGoing() {
    if (!play || (play.phase !== "lesson" && play.phase !== "check")) return;
    bumpSeqs(); Speech.stop();
    play.lessonBusy = false; play.sortBusy = false; play.locked = false; play.busy = false; play.moved = false;
    setLessonLock(false);
    if (play.phase === "check") {
      var it = play.checks && play.checks[play.item];
      if (it && play.results.length === play.item) play.results.push({ label: it.label, result: "kept" });
      play.advancing = false; nextItem(); return;
    }
    if (document.querySelector("#stage .to-check")) { startCheck(); return; }
    if (document.querySelector("#stage .next-round") && play.onNext) { play.onNext(); return; }
    if (play.onAdvance) play.onAdvance(); else readyFlag();
  }
  tap($("keepBtn"), function () { keepGoing(); });

  function renderLesson() {
    var a = play.a, L = a.lesson;
    play.phase = "lesson"; play.onAdvance = null; play.onNext = null; setHear(a.intro); syncKeep();
    if (!L) { stage('<div class="ready-row"></div>', "lesson"); readyFlag(); return; }
    if (L.type === "tapAll") { drawTapAll(); sayPrompt(a.intro); return; }
    if (L.type === "countRounds") { play.round = 0; drawRound(); sayPrompt(a.intro); return; }
    if (Lessons[L.type]) { play.round = 0; Lessons[L.type](); if (L.type === "drivePast") sayPrompt(a.intro); return; }
    stage('<div class="ready-row"></div>', "lesson"); readyFlag();
  }
  function drawTapAll() {
    var L = play.a.lesson, head = play.a.head || "";
    // pictures shuffle each open; a fixed row (the AB pattern) stays in teaching order
    var items = (L.fixed || L.row) ? L.items.slice() : K1.shuffle(L.items);
    play.lessonItems = items;
    var st = stage(head + '<div class="truck' + (L.row ? ' row' : '') + (L.cls ? ' ' + L.cls : items.length > 4 ? ' six' : '') + '">' + items.map(function (it) {
      return '<button type="button" class="lesson-item" data-item="' + it.id + '">' + it.html + '<span class="li-label">' + (it.zh ? zhText(it.zh) : esc(it.label)) + '</span></button>'; }).join("") +
      '</div><div class="ready-row"></div>', "lesson tapall");
    var seen = {};
    play.onAdvance = function () {
      [].forEach.call(document.querySelectorAll("#stage .lesson-item"), function (b) { b.classList.add("seen"); });
      L.items.forEach(function (it) { seen[it.id] = 1; });
      play.lessonBusy = false; readyFlag();
    };
    [].forEach.call(st.querySelectorAll(".lesson-item"), function (b) {
      tap(b, function () {
        var it = L.items.filter(function (x) { return x.id === b.getAttribute("data-item"); })[0];
        if (!play || play.lessonLocked || !it) return;
        // spam on the same picture while it is speaking is ignored; a new picture may interrupt
        if (seen[it.id] && play.lessonBusy) return;
        var wasNew = !seen[it.id];
        b.classList.add("seen"); b.classList.remove("bounce"); void b.offsetWidth; b.classList.add("bounce"); seen[it.id] = 1;
        play.lessonBusy = true;
        afterSpeech(it.say, function () {
          play.lessonBusy = false;
          if (Object.keys(seen).length === L.items.length) readyFlag();
        }, wasNew ? { force: true } : null);
      });
    });
  }
  function drawRound() {
    var L = play.a.lesson, n = L.rounds[play.round], c = 0;
    var st = stage('<div class="carpark">' + range(n).map(function (i) { return '<button type="button" class="park-car" data-i="' + i + '">' + Art.car(L.colors[i % L.colors.length]) + '<span class="count-tag"></span></button>'; }).join("") +
      '</div><div class="count-big" id="countBig"></div><div class="ready-row"></div>', "lesson count");
    play.onAdvance = function () {
      [].forEach.call(document.querySelectorAll("#stage .park-car"), function (b, idx) {
        b.classList.add("seen"); var tag = b.querySelector(".count-tag"); if (tag) tag.textContent = idx + 1;
      });
      c = n; var big = $("countBig"); if (big) big.textContent = n;
      play.lessonBusy = false;
      nextOrReady(null, function () { drawRound(); sayPrompt(K1.UI.tapEachCar); });
    };
    [].forEach.call(st.querySelectorAll(".park-car"), function (b) {
      tap(b, function () {
        if (!play || play.lessonLocked || b.classList.contains("seen") || play.lessonBusy) return;
        c++; b.classList.add("seen"); b.querySelector(".count-tag").textContent = c;
        var done = c === n; play.lessonBusy = true;
        afterSpeech([[K1.EN_NUM[c], "en"]].concat(done ? [[K1.EN_NUM[n] + " cars!", "en"]] : []), function () {
          play.lessonBusy = false;
          if (!done) return;
          $("countBig").textContent = n;
          nextOrReady(null, function () { drawRound(); sayPrompt(K1.UI.tapEachCar); });
        }, { force: true });
      });
    });
  }
  /* ---------- scenes shown above the check answers ---------- */
  function sceneHtml(sc) {
    if (sc.type === "html") return '<div class="scene-pic">' + sc.html + '</div>';
    if (sc.type === "seq") return '<div class="road-row">' + sc.seq.map(function (n, i) { return '<span class="row-car">' + Art.car(["red", "blue", "yellow"][i % 3], n) + '</span>'; }).join("") + '<span class="row-car">' + Art.ghost() + '</span></div>';
    if (sc.type === "row") return '<div class="road-row">' + sc.row.map(function (c) { return '<span class="row-car">' + Art.car(c) + '</span>'; }).join("") + '<span class="row-car">' + Art.ghost() + '</span></div>';
    if (sc.type === "bay") return '<div class="bay-sign">' + sc.n + '</div>';
    if (sc.type === "sortCar") return '<div class="sort-show">' + K1.carOf(sc.kind) + '</div>';
    if (sc.type === "oneMore") return '<div class="carpark small">' + range(sc.n).map(function (i) { return '<button type="button" class="park-car" data-i="' + i + '">' + Art.car(["red", "blue", "yellow", "green", "orange"][i % 5]) + '</button>'; }).join("") +
      '<button type="button" class="park-car new drive-in" data-i="' + sc.n + '">' + Art.car("purple") + '</button></div>';
    return "";
  }

  /* ---------- maths lesson types (data in js/maths.js) ---------- */
  function rowReady() { return document.querySelector("#stage .ready-row"); }
  function nextOrReady(more, redraw) {
    if (!play || play.phase !== "lesson") return;
    if (document.querySelector("#stage .next-round, #stage .to-check")) return;
    var L = play.a.lesson;
    if (play.round < L.rounds.length - 1) {
      play.onNext = function () { play.onNext = null; play.round++; redraw(); };
      var row = rowReady(); if (!row) return;
      var nx = document.createElement("button"); nx.type = "button"; nx.className = "big go next-round"; nx.innerHTML = '<span class="ico">➡️</span><span>More cars</span>';
      tap(nx, function () { if (play.onNext) play.onNext(); }, { nav: true }); row.appendChild(nx);
      if (more) Speech.say(more, null, { force: true });
    } else readyFlag();
  }
  var Lessons = {
    // cars drive in one at a time; each tap says the next number
    drivePast: function draw(again) {
      var L = play.a.lesson, R = L.rounds[play.round], k = 0, total = R.to - R.from + 1;
      var st = stage('<div class="road-row lane">' + range(total).map(function (i) { return '<button type="button" class="row-car slot" data-i="' + i + '" style="visibility:hidden">' + Art.car(["red", "blue", "yellow", "green", "orange"][i % 5]) + '<span class="count-tag"></span></button>'; }).join("") +
        '</div><div class="ready-row"></div>', "lesson drive");
      var slots = [].slice.call(st.querySelectorAll(".slot"));
      function arrive() { if (k >= total) return; var b = slots[k]; b.style.visibility = "visible"; b.classList.add("drive-in", "next"); }
      function fillRest() {
        while (k < total) {
          var b = slots[k]; b.style.visibility = "visible"; b.classList.add("seen"); b.classList.remove("next");
          b.querySelector(".count-tag").textContent = R.from + k; k++;
        }
      }
      play.onAdvance = function () { fillRest(); play.lessonBusy = false; nextOrReady(L.more, function () { draw(true); }); };
      slots.forEach(function (b, i) { tap(b, function () {
        if (!play || play.lessonLocked || i !== k || b.classList.contains("seen") || play.lessonBusy) return;
        b.classList.add("seen"); b.classList.remove("next"); b.querySelector(".count-tag").textContent = R.from + i; k++;
        var last = k === total; play.lessonBusy = true;
        afterSpeech([R.nums[i]].concat(last ? R.end : []), function () { play.lessonBusy = false; if (last) nextOrReady(L.more, function () { draw(true); }); }, { force: true });
        if (!last) setTimeout(arrive, Speech.test ? 0 : 350);
      }); });
      arrive(); if (again) sayPrompt(K1.UI.tapEachCar);
    },
    // tap waiting cars to park them in the numbered bay, until the bay is full
    park: function draw(again) {
      var L = play.a.lesson, R = L.rounds[play.round], c = 0;
      var st = stage('<div class="bay-wrap"><div class="bay-sign">' + R.n + '</div><div class="bay" id="bay"></div></div>' +
        '<div class="waiting">' + range(10).map(function (i) { return '<button type="button" class="wait-car" data-i="' + i + '">' + Art.car(["red", "blue", "yellow", "green", "orange"][i % 5]) + '</button>'; }).join("") + '</div><div class="ready-row"></div>', "lesson park");
      play.onAdvance = function () {
        var waits = [].slice.call(document.querySelectorAll("#stage .wait-car")), wi = 0;
        while (c < R.n) {
          var b = waits[wi++]; var m = document.createElement("span"); m.className = "mini parked";
          m.innerHTML = b ? b.innerHTML : Art.car("red"); $("bay").appendChild(m); if (b) b.style.visibility = "hidden"; c++;
        }
        play.lessonBusy = false; nextOrReady(null, function () { draw(true); });
      };
      [].forEach.call(st.querySelectorAll(".wait-car"), function (b) { tap(b, function () {
        if (!play || play.lessonLocked || play.lessonBusy) return;
        if (c >= R.n) { afterSpeech(L.full, null, { force: true }); return; }
        c++; var m = document.createElement("span"); m.className = "mini parked"; m.innerHTML = b.innerHTML; $("bay").appendChild(m); b.style.visibility = "hidden";
        var full = c === R.n; play.lessonBusy = true;
        afterSpeech([R.nums[c - 1]].concat(full ? R.end : []), function () { play.lessonBusy = false; if (full) nextOrReady(null, function () { draw(true); }); }, { force: true });
      }); });
      sayPrompt(again ? R.start : play.a.intro.concat(R.start));
    },
    // two car parks: tap each to count, then the one with more (or fewer) glows
    compare: function draw(again) {
      var L = play.a.lesson, R = L.rounds[play.round], seen = {};
      var st = stage('<p class="ask small-ask">' + esc(R.start[0][0]) + '</p><div class="options wide">' +
        '<button type="button" class="option park-pick" data-side="L">' + Art.group(R.a, "blue") + '</button><button type="button" class="option park-pick" data-side="R">' + Art.group(R.b, "red") + '</button></div><div class="ready-row"></div>', "lesson compare");
      function showWin() {
        play.lessonBusy = true;
        var w = st.querySelector('[data-side="' + R.win + '"]'); if (w) w.classList.add("yes");
        afterSpeech(R.end, function () {
          play.lessonBusy = false;
          nextOrReady(L.next, function () { draw(true); });
        }, { force: true });
      }
      play.onAdvance = function () {
        seen.L = seen.R = 1; play.lessonBusy = false;
        var w = document.querySelector('#stage [data-side="' + R.win + '"]'); if (w) w.classList.add("yes");
        nextOrReady(L.next, function () { draw(true); });
      };
      [].forEach.call(st.querySelectorAll(".park-pick"), function (b) { tap(b, function () {
        if (!play || play.lessonLocked || play.lessonBusy) return;
        var side = b.getAttribute("data-side"); seen[side] = 1; b.classList.add("seen-park");
        var both = seen.L && seen.R; play.lessonBusy = true;
        afterSpeech(side === "L" ? R.sayA : R.sayB, function () {
          play.lessonBusy = false;
          if (!both || st.querySelector(".yes")) return;
          showWin();
        }, { force: true });
      }); });
      sayPrompt(again ? R.start : play.a.intro.concat(R.start));
    },
    // one car at a time: tap the garage it belongs in (a wrong tap just gets a friendly correction)
    sort: function () {
      var L = play.a.lesson, ph = 0, i = 0;
      function goOn() {
        if (i < L.phases[ph].cars.length) { showCar(); sayPrompt(L.where); }
        else if (ph < L.phases.length - 1) { ph++; i = 0; drawPhase(); sayPrompt(L.phases[ph].start.concat(L.where)); }
        else { var s = $("sortShow"); if (s) s.innerHTML = ""; readyFlag(); }
      }
      function showCar() {
        var P = L.phases[ph], el = $("sortShow"); if (!el) return;
        el.innerHTML = K1.carOf(P.cars[i]); el.setAttribute("data-want", P.cars[i]);
      }
      function drawPhase() {
        var P = L.phases[ph];
        var st = stage('<div class="sort-show" id="sortShow"></div><div class="options">' + P.garages.map(function (g) { return '<button type="button" class="option garage-pick" data-g="' + g + '">' + Art.garage(g) + '<span class="opt-word">' + g + '</span></button>'; }).join("") +
          '</div><div class="ready-row"></div>', "lesson sort");
        play.onAdvance = function () { play.sortBusy = false; i++; goOn(); };
        [].forEach.call(st.querySelectorAll(".garage-pick"), function (b) { tap(b, function () {
          if (!play || play.lessonLocked || play.sortBusy) return;
          var want = P.cars[i], g = b.getAttribute("data-g");
          [].forEach.call(st.querySelectorAll(".garage-pick"), function (x) { x.classList.remove("hint"); });
          if (g !== want) { var hint = st.querySelector('[data-g="' + want + '"]'); if (hint) hint.classList.add("hint"); afterSpeech(L.say[want].wrong, null, { force: true }); return; }
          play.sortBusy = true; b.classList.add("yes");
          afterSpeech(L.say[want].right, function () {
            play.sortBusy = false; b.classList.remove("yes"); i++; goOn();
          }, { force: true });
        }); });
        showCar();
      }
      drawPhase(); sayPrompt(play.a.intro.concat(L.phases[0].start, L.where));
    },
    // n cars parked; the new car stays on the road until the instruction ends, then one tap drives it in.
    // A tap during the instruction used to hide the car and drop the counting line (Speech.say ignored
    // while the intro was still playing), so the round never finished and there was nothing left to tap.
    oneMore: function draw(again) {
      var L = play.a.lesson, R = L.rounds[play.round]; play.moved = false; play.lessonBusy = false;
      var st = stage('<div class="onemore-wrap"><div class="carpark onemore">' + range(R.n).map(function (i) { return '<span class="park-car">' + Art.car(["red", "blue", "yellow", "green", "orange"][i % 5]) + '</span>'; }).join("") +
        '<span class="park-car empty" id="emptyBay"></span></div><div class="newcar-lane waiting one"><p class="hint-word">New car</p><button type="button" class="wait-car new" id="newCar" aria-label="New car">' + Art.car("purple") + '</button></div><div class="ready-row"></div></div>', "lesson onemore");
      function takeNewCar() {
        var e = $("emptyBay"); if (!e) return;
        e.classList.remove("empty"); e.classList.add("drive-in"); e.innerHTML = Art.car("purple");
        var nc = $("newCar"); if (nc) { nc.classList.add("gone"); nc.style.visibility = "hidden"; }
        var hint = document.querySelector("#stage .hint-word"); if (hint) hint.hidden = true;
      }
      function finishRound() {
        play.lessonBusy = false; play.moved = false;
        nextOrReady(null, function () { draw(true); });
      }
      play.onAdvance = function () {
        takeNewCar();
        [].forEach.call(document.querySelectorAll("#stage .carpark .park-car"), function (c) { c.classList.add("seen"); });
        finishRound();
      };
      tap($("newCar"), function () {
        if (!play || play.lessonLocked || play.lessonBusy || play.moved) return;
        play.moved = true; play.lessonBusy = true;
        takeNewCar();
        var cs = [].slice.call(st.querySelectorAll(".carpark .park-car")), i = 0;
        function step() {
          if (i > 0 && cs[i - 1]) cs[i - 1].classList.add("seen");
          if (i < R.nums.length) { var line = [R.nums[i]]; i++; afterSpeech(line, step, { force: true }); }
          else afterSpeech(R.end, finishRound, { force: true });
        }
        step();
      });
      sayPrompt(again ? R.start : play.a.intro.concat(R.start));
    }
  };

  function range(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
  function readyFlag() {
    var row = document.querySelector("#stage .ready-row"); if (!row || row.querySelector(".to-check")) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "big go to-check"; b.innerHTML = '<span class="ico">🏁</span><span>Car game</span>';
    tap(b, function () { if (play.phase !== "lesson") return; startCheck(); }, { nav: true }); row.appendChild(b);
    Speech.say(play.a.readyLine, null, { force: true });
  }

  /* ----- the no-fail check: wrong tap = calm pause, the question again, then a hint; second miss = the answer is shown, he taps it.
     Answer taps are locked while the question (or the replay, hint, answer) is being said: the cards are dimmed a little and
     brighten when he may tap. No timer is shown. If the audio never reports its end, a fallback unlocks after a sensible maximum. */
  var Q = location.search;
  var PAUSE = (function () { var m = /[?&]pause=(\d+)/.exec(Q); return m ? +m[1] : 1500; })(); // calm pause after a wrong tap
  var seedM = /[?&]seed=(\d+)/.exec(Q); // tests: same seed draws the same 6 questions
  function maxMs(lines) { // generous upper bound for how long the lines can take to say (iPad voice is slower than the clips)
    var ms = 2500; (lines || []).forEach(function (l) { ms += 700 + String(l[0]).length * (l[1] === "zh" ? 380 : 120); });
    var m = /[?&]maxlock=(\d+)/.exec(Q); return m ? +m[1] : Math.min(ms, 25000);
  }
  function lockOpts(on) {
    if (!play) return; play.locked = on;
    var o = document.querySelector("#stage .options"); if (!o) return;
    o.classList.toggle("locked", on); o.classList.toggle("ready", !on);
    o.setAttribute("aria-busy", on ? "true" : "false");
  }
  // say lines with the answers locked; then() runs when the audio ends (or the fallback fires); answers unlock at the end of the chain
  function sayLocked(lines, then) {
    lockOpts(true);
    var P = play, my = ++P.lockSeq, done = false, t = setTimeout(function () { if (play === P) P.lockFallbacks = (P.lockFallbacks || 0) + 1; fin(); }, maxMs(lines));
    function fin() { if (done || play !== P || my !== P.lockSeq) return; done = true; clearTimeout(t); if (then) then(); else lockOpts(false); }
    Speech.say(lines, fin, { force: true });
  }
  function startCheck() {
    play.phase = "check"; play.item = 0; play.results = []; play.lockSeq = 0; play.advancing = false;
    play.onAdvance = null; play.onNext = null; play.lessonBusy = false; setLessonLock(false);
    play.checks = K1.pick(play.a.check, K1.CHECK_N, seedM ? K1.mulberry(+seedM[1]) : undefined); // 6 of the pool, no repeats this run
    syncKeep(); drawItem();
  }
  function drawItem() {
    var a = play.a, it = play.checks[play.item]; play.miss = 0; play.busy = false; play.reveal = false; play.advancing = false;
    var promptHtml = a.lang === "zh" ? zhText({ zh: it.ask, py: it.askPy }) : esc(it.ask);
    var scene = it.scene ? sceneHtml(it.scene) : it.n ? '<div class="carpark small">' + range(it.n).map(function (i) { return '<button type="button" class="park-car" data-i="' + i + '">' + Art.car(["red", "blue", "yellow", "green", "orange"][i % 5]) + '</button>'; }).join("") + '</div>' : '';
    var st = stage('<div class="flags">' + play.checks.map(function (_, i) { return '<span class="flag' + (i < play.item ? " done" : i === play.item ? " now" : "") + '">🚩</span>'; }).join("") + '</div>' +
      '<p class="ask">' + promptHtml + '</p>' + scene +
      '<div class="options locked' + (it.wide ? ' wide' : '') + '">' + it.options.map(function (o) { return '<button type="button" class="option" data-opt="' + esc(o) + '">' + it.optionHtml(o) + '</button>'; }).join("") + '</div>', "check");
    setHear(it.prompt);
    if (it.n) [].forEach.call(st.querySelectorAll(".park-car"), function (b, i) { // counting aloud while looking is fine, not graded (only once he may answer)
      tap(b, function () { if (play.locked || play.busy) return; b.classList.add("seen"); Speech.say([[K1.EN_NUM[i + 1], "en"]]); }); });
    [].forEach.call(st.querySelectorAll(".option"), function (b) { tap(b, function () { choose(b); }); });
    sayLocked(it.prompt);
  }
  function choose(b) {
    if (!play || play.busy || play.locked || play.advancing) return; // locked while the question or a replay is being said
    var it = play.checks[play.item], o = b.getAttribute("data-opt"), right = o === it.answer;
    var opts = [].slice.call(document.querySelectorAll("#stage .option")), rightBtn = opts.filter(function (x) { return x.getAttribute("data-opt") === it.answer; })[0];
    if (!rightBtn) return; // no matching card: Keep going is the way forward, never a dead tap
    if (play.reveal && !right) return; // after the answer is shown only the answer can be tapped
    if (right) {
      play.busy = true; b.classList.remove("hint"); b.classList.add("yes");
      play.results.push({ label: it.label, result: play.reveal ? "shown" : play.miss ? "hint" : "first" });
      var P = play, itemAt = P.item, went = false; // move on when "Yes!" ends, or after a fallback if the audio never reports its end
      var go = function () { if (went || play !== P || P.phase !== "check" || P.item !== itemAt) return; went = true; setTimeout(function () { if (play === P && P.phase === "check" && P.item === itemAt) nextItem(); }, Speech.test ? 0 : 400); };
      Speech.say(it.yes, go, { force: true }); setTimeout(function () { if (!went && play === P && P.item === itemAt) { P.lockFallbacks = (P.lockFallbacks || 0) + 1; go(); } }, maxMs(it.yes));
      return;
    }
    play.miss++;
    b.classList.add("dim", "soft-no"); b.disabled = true;
    Speech.stop(); lockOpts(true); var P = play, my = ++P.lockSeq, miss = P.miss; // calm pause: no sound, no red, cards resting
    setTimeout(function () {
      if (play !== P || my !== P.lockSeq) return;
      if (miss === 1) {
        sayLocked(it.prompt, function () { // the question again, then the hint as before
          rightBtn.classList.add("hint");
          if (it.n) countAlong(it); else sayLocked(it.hint);
        });
      } else {
        sayLocked(it.prompt, function () {
          play.reveal = true;
          opts.forEach(function (x) { if (x !== rightBtn) { x.classList.add("dim"); x.disabled = true; } });
          rightBtn.classList.remove("hint"); rightBtn.classList.add("reveal");
          sayLocked(it.reveal);
        });
      }
    }, PAUSE);
  }
  function countAlong(it) { // hint for counting: the cars light up one by one while the voice counts (answers locked until the end)
    var cars = [].slice.call(document.querySelectorAll("#stage .park-car")), i = 0, lines = it.hint.slice(), first = lines.shift();
    cars.forEach(function (c) { c.classList.remove("seen"); });
    lockOpts(true);
    var P = play, my = ++P.lockSeq, done = false, t = setTimeout(function () { if (play === P) P.lockFallbacks = (P.lockFallbacks || 0) + 1; fin(); }, maxMs(it.hint));
    function fin() { if (done || play !== P || my !== P.lockSeq) return; done = true; clearTimeout(t); lockOpts(false); }
    Speech.say([first], function step() {
      if (play !== P || my !== P.lockSeq) return;
      if (i < cars.length && i < lines.length) { cars[i].classList.add("seen"); Speech.say([lines[i]], step, { force: true }); i++; }
      else if (i < lines.length) Speech.say(lines.slice(i), fin, { force: true });
      else fin();
    }, { force: true });
  }
  function nextItem() {
    if (!play || play.phase !== "check" || play.advancing) return;
    play.advancing = true;
    play.item++;
    if (play.item < play.checks.length) drawItem(); else finishActivity();
  }
  function finishActivity() {
    var a = play.a;
    K1Store.addLog({ subject: a.subject, topic: a.topic, act: a.id, title: a.title, done: true, items: play.results });
    K1Store.markFinished(a.id);
    play.started = false; startSticker(a.id);
  }

  /* ---------- sticker, then a natural stop that points back to people ---------- */
  function startSticker(id) {
    var a = A[id];
    if (!play || play.id !== id) play = { id: id, a: a };
    if (play.phase === "sticker" && play.stickerAdded) return; // spam: do not double-add
    play.phase = "sticker"; play.started = false; play.stickerAdded = true; play.stickerPut = false;
    var n = K1Store.addSticker(a.sticker, id); play.stickerCount = n;
    var s = K1.subject(a.subject);
    show("play", [s.name, a.title, "Sticker"], null);
    var ask = n === 5 ? "Your car became a super car!" : (n > 1 ? "You finished again! One more for your book." : "You finished! A sticker for your book.");
    var st = stage('<p class="ask">' + ask + '</p><div class="sticker-big">' + Art.sticker(a.sticker, n) + '</div>' +
      '<div class="ready-row"><button type="button" class="big go" id="putSticker"><span class="ico">📒</span><span>Put it in my book</span></button></div>', "sticker-screen");
    var lines = n === 5 ? K1.UI.superCar : (n > 1 ? K1.UI.stickerAgain : K1.UI.sticker); setHear(lines);
    tap($("putSticker"), function () {
      if (play.stickerPut || play.phase !== "sticker") return;
      play.stickerPut = true; screenBusyUntil = 0; endScreen();
    }, { nav: true });
    Speech.say(lines, null, { force: true });
  }
  function endScreen() {
    var a = play.a, p = K1Store.person(), line = a.endLine(p);
    if (play.phase === "end") return; // already advanced
    play.phase = "end";
    var text = line.map(function (l) { return l[0]; }).join(" ");
    stage('<div class="park-scene">' + Art.car(a.sticker.color) + '<div class="garage">🅿️</div></div><p class="ask end-text">' + esc(text) + '</p>' +
      '<div class="ready-row"><button type="button" class="big plain" id="endHome"><span class="ico">🏠</span><span>Home</span></button>' +
      '<button type="button" class="big plain" id="endBook"><span class="ico">⭐</span><span>Sticker book</span></button></div>', "end");
    setHear(line);
    tap($("endHome"), function () { play = null; location.hash = "#home"; }, { nav: true });
    tap($("endBook"), function () { play = null; location.hash = "#stickers"; }, { nav: true });
    Speech.say(line, null, { force: true }); // plays once; nothing starts after it
  }

  /* ---------- Home button: ask before leaving a game under way ---------- */
  tap($("homeBtn"), function () {
    if (play && (play.phase === "lesson" || play.phase === "check")) {
      Speech.stop(); screenBusyUntil = 0; $("homeBtn")._k1TapAt = 0; // allow Home again after Keep playing
      $("leave").hidden = false; return;
    }
    play = null; location.hash = "#home";
  }, { nav: true });
  // leave dialog buttons: no nav busy (overlay must respond immediately after Home opened it)
  tap($("leaveNo"), function () { $("leave").hidden = true; screenBusyUntil = 0; $("homeBtn")._k1TapAt = 0; });
  tap($("leaveYes"), function () {
    $("leave").hidden = true;
    if (play) K1Store.addLog({ subject: play.a.subject, topic: play.a.topic, act: play.id, title: play.a.title, done: false, items: play.results || [] });
    play = null; Speech.stop(); location.hash = "#home";
  });
  tap($("hearBtn"), function () {
    if (!hearLines) return;
    if (Speech.speaking && Speech.speaking()) return; // deliberate replay only after current line ends
    if (play && play.phase === "check") { if (!play.locked && !play.busy && !play.reveal) sayLocked(hearLines); return; } // replay the question, answers locked
    Speech.say(hearLines); // no force: ignored while speaking
  });

  /* ---------- sticker book ---------- */
  function drawStickers() {
    var list = K1Store.grouped(), box = $("stickerGrid"); box.innerHTML = "";
    $("stickerEmpty").hidden = list.length > 0;
    list.forEach(function (x, i) {
      var a = A[x.act] || { title: "", titleSay: null };
      var b = document.createElement("button"); b.type = "button"; b.className = "sticker-slot"; b.setAttribute("data-act", x.act);
      b.setAttribute("data-count", x.count);
      b.innerHTML = Art.sticker(x.sticker, x.count) + '<span class="slot-label">' + esc(a.title) + '</span>';
      tap(b, function () { if (a.titleSay) Speech.say(a.titleSay); });
      box.appendChild(b);
    });
    show("stickers", ["Home", "Sticker book"], "#home"); setHear(K1.UI.stickerBook);
  }

  /* ---------- parent gate: press and hold 3 seconds ---------- */
  function holdable(btn, ms, done) {
    var t = null, fill = btn.querySelector(".hold-fill");
    function start(e) { e.preventDefault(); btn.classList.add("holding"); fill.style.transition = "width " + ms + "ms linear"; fill.style.width = "100%"; t = setTimeout(function () { cancel(); done(); }, ms); }
    function cancel() { clearTimeout(t); t = null; btn.classList.remove("holding"); fill.style.transition = "none"; fill.style.width = "0"; }
    btn.addEventListener("pointerdown", start); ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { btn.addEventListener(ev, cancel); });
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  holdable($("holdBtn"), 3000, function () { gateOpen = true; location.hash = "#parent"; });
  holdable($("clearBtn"), 2000, function () { K1Store.clearAll(child); drawParent(); });
  holdable($("delBtn"), 2000, function () { if (child) { K1Store.deletePlayer(child); child = null; drawParent(); } });

  /* ---------- players: "Who's playing?" (names only in this iPad's localStorage; greeting by name uses the device voice) ---------- */
  var CNAME = { red: "Red car", blue: "Blue car", yellow: "Yellow car", green: "Green car", orange: "Orange car", purple: "Purple car" };
  function label(pl) { return pl.name || CNAME[pl.color] || "Player"; }
  function drawWho() {
    var box = $("whoList"); box.innerHTML = "";
    K1Store.players().forEach(function (pl) {
      var b = document.createElement("button"); b.type = "button"; b.className = "who-tile"; b.setAttribute("data-player", pl.id);
      b.innerHTML = Art.car(pl.color) + '<span class="who-name"></span>'; b.querySelector(".who-name").textContent = label(pl);
      tap(b, function () {
        K1Store.choose(pl.id);
        // a name can't be pre-recorded: "Hello, <name>!" is spoken by the iPad's own voice, everything else keeps its clip
        Speech.say(pl.name ? [["Hello, " + pl.name + "!", "en"]] : K1.UI.hello);
        location.hash = "#home";
      });
      box.appendChild(b);
    });
    if (K1Store.players().length < K1Store.COLORS.length) {
      var add = document.createElement("button"); add.type = "button"; add.className = "who-tile add"; add.id = "addPlayer";
      add.innerHTML = '<span class="plus">＋</span><span class="who-name">New player</span>';
      tap(add, function () { Speech.say(K1.UI.newPlayer); location.hash = "#newplayer"; });
      box.appendChild(add);
    }
    show("who", [], null); setHear(K1.UI.who);
  }
  function colorButtons(box, taken, chosen, onPick) {
    box.innerHTML = "";
    K1Store.COLORS.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "color-btn" + (c === chosen ? " on" : ""); b.setAttribute("data-color", c);
      b.innerHTML = Art.car(c) + (taken.indexOf(c) >= 0 ? '<span class="taken">taken</span>' : ""); b.disabled = taken.indexOf(c) >= 0;
      b.setAttribute("aria-label", CNAME[c]);
      tap(b, function () { [].forEach.call(box.children, function (x) { x.classList.toggle("on", x === b); }); onPick(c); });
      box.appendChild(b);
    });
  }
  var newColor = null;
  function drawNew() {
    newColor = null; $("newName").value = ""; $("newGo").disabled = true;
    colorButtons($("colorPick"), K1Store.takenColors(), null, function (c) { newColor = c; $("newGo").disabled = false; Speech.say(K1.UI.carName[c]); });
    show("newplayer", ["Who's playing?", "New player"], "#who"); setHear(K1.UI.newPlayer);
  }
  tap($("newGo"), function () {
    if (!newColor) return; // the car colour is required (a non-reader finds himself by it); the name is optional
    var id = K1Store.addPlayer($("newName").value, newColor), pl = K1Store.player(id);
    $("newName").blur(); Speech.say(pl.name ? [["Hello, " + pl.name + "!", "en"]] : K1.UI.hello); location.hash = "#home";
  });
  function drawChip() { var pl = K1Store.player(); var c = $("playerChip"); c.innerHTML = pl ? Art.car(pl.color) + '<span></span>' : ""; if (pl) c.querySelector("span").textContent = label(pl); }
  tap($("playerChip"), function () { Speech.say(K1.UI.who, null, { force: true }); location.hash = "#who"; }, { nav: true });

  /* ---------- parents: one child at a time (no ranking, no comparison, no scores) ---------- */
  var SUBNAME = { en: "English", ma: "Maths", zh: "Chinese" }, child = null;
  var sel = $("personSel");
  Object.keys(K1.PEOPLE).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = K1.PEOPLE[k].en + " / " + K1.PEOPLE[k].zh; sel.appendChild(o); });
  sel.onchange = function () { K1Store.set("person", sel.value, child); };
  $("pinyinToggle").onchange = function () { K1Store.set("pinyin", $("pinyinToggle").checked, child); };
  $("voiceTest").onclick = function () { Speech.unlock(); Speech.say(K1.UI.home); };
  $("parentDone").onclick = function () { gateOpen = false; location.hash = K1Store.current() ? "#home" : "#who"; };
  var editColor = null;
  $("saveEdit").onclick = function () { if (!child) return; K1Store.updatePlayer(child, { name: $("editName").value, color: editColor }); drawParent(); };
  function drawProgress(id) {
    var rows = K1Store.log(id), grouped = K1Store.grouped(id), count = {}, total = 0, box = $("progress"); box.innerHTML = "";
    grouped.forEach(function (g) { count[g.act] = g.count; total += g.count; });
    K1.SUBJECTS.forEach(function (s) {
      var acts = []; s.topics.forEach(function (t) { acts = acts.concat(t.acts); });
      var done = acts.filter(function (a) { return count[a]; }).length;
      var d = document.createElement("div"); d.className = "pcard"; d.setAttribute("data-subject", s.id);
      d.innerHTML = "<h4>" + esc(s.name) + "</h4><p>" + done + " of " + acts.length + " activities finished</p><ul>" + acts.map(function (a) {
        return "<li" + (count[a] ? "" : ' class="not"') + ">" + esc(A[a].title) + (count[a] ? " ✅" + (count[a] > 1 ? " ×" + count[a] : "") : " – not yet") + "</li>"; }).join("") + "</ul>";
      box.appendChild(d);
    });
    var help = {}; rows.forEach(function (r) { (r.items || []).forEach(function (x) {
      if (x.result !== "hint" && x.result !== "shown") return; // "kept" (Keep going) is not a miss
      var k = r.title; help[k] = help[k] || { hint: {}, shown: {} }; help[k][x.result][x.label] = 1;
    }); });
    var hk = Object.keys(help);
    var h = document.createElement("div"); h.className = "pcard wide"; h.id = "helpCard";
    h.innerHTML = "<h4>Stickers: " + total + " · Last played: " + esc(rows.length ? K1Store.pretty(rows[0].at) : "not yet") + " (Singapore time)</h4>" +
      "<h4>Needed help in the car game</h4>" + (hk.length ? "<ul>" + hk.map(function (k) { var x = help[k];
        return "<li><b>" + esc(k) + "</b>: " + (Object.keys(x.hint).length ? "hint for " + esc(Object.keys(x.hint).join(", ")) : "") +
          (Object.keys(x.shown).length ? (Object.keys(x.hint).length ? "; " : "") + "answer shown for " + esc(Object.keys(x.shown).join(", ")) : "") + "</li>"; }).join("") + "</ul>" : "<p>Nothing so far.</p>");
    box.appendChild(h);
  }
  function drawParent() {
    var list = K1Store.players();
    if (!child || !K1Store.player(child)) child = K1Store.current() || (list[0] && list[0].id) || null;
    var tabs = $("childTabs"); tabs.innerHTML = "";
    list.forEach(function (pl) {
      var b = document.createElement("button"); b.type = "button"; b.className = "child-tab"; b.setAttribute("role", "tab"); b.setAttribute("data-child", pl.id);
      b.setAttribute("aria-selected", pl.id === child ? "true" : "false"); b.innerHTML = Art.car(pl.color) + "<span></span>"; b.querySelector("span").textContent = label(pl);
      b.onclick = function () { child = pl.id; drawParent(); }; tabs.appendChild(b);
    });
    var has = !!child; [].forEach.call(document.querySelectorAll("#parent .settings, #logWrap, #clearBtn"), function (x) { x.hidden = !has; });
    var tb = document.querySelector("#logTable tbody"); tb.innerHTML = "";
    if (has) {
      var s = K1Store.settings(child), pl = K1Store.player(child); $("pinyinToggle").checked = s.pinyin; sel.value = s.person;
      $("editName").value = pl.name; editColor = pl.color;
      colorButtons($("editColors"), K1Store.takenColors(child), pl.color, function (c) { editColor = c; });
      drawProgress(child);
      var rows = K1Store.log(child);
      $("logEmpty").hidden = rows.length > 0; $("logTable").hidden = !rows.length;
      rows.forEach(function (r) {
        var hint = (r.items || []).filter(function (x) { return x.result === "hint"; }).map(function (x) { return x.label; });
        var shown = (r.items || []).filter(function (x) { return x.result === "shown"; }).map(function (x) { return x.label; });
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + esc(K1Store.pretty(r.at)) + "</td><td>" + esc(SUBNAME[r.subject] || r.subject) + "</td><td>" + esc(r.title) + "</td><td>" + (r.done ? "✅ Finished" : "Stopped early") +
          "</td><td>" + esc(hint.join(", ") || "–") + "</td><td>" + esc(shown.join(", ") || "–") + "</td>";
        tb.appendChild(tr);
      });
    } else { $("progress").innerHTML = '<p class="soft">No players yet.</p>'; }
    show("parent", ["Grown-ups"], null);
  }

  /* ---------- router ---------- */
  var NEED_PLAYER = /^#(home|subjects|s\/|t\/|play\/|stickers|bookdone)/;
  function route() {
    var h = location.hash || "#who", m;
    $("leave").hidden = true;
    if (h !== "#play" && !/^#play\//.test(h)) { if (play && play.phase !== "sticker" && play.phase !== "end") play = null; }
    if (h !== "#parent") gateOpen = false;
    if (NEED_PLAYER.test(h) && !K1Store.current()) { location.hash = "#who"; return; }
    if (h === "#who") { Speech.stop(); drawWho(); }
    else if (h === "#newplayer") drawNew();
    else if (h === "#home") { show("home", [], null); drawChip(); setHear(K1.UI.home); }
    else if (h === "#subjects") { drawSubjects(); show("subjects", ["Home", "Pick a road"], "#home"); setHear(K1.UI.pickRoad); }
    else if ((m = /^#s\/(\w+)$/.exec(h))) drawSubject(m[1]);
    else if ((m = /^#t\/(\w+)\/(\w+)$/.exec(h))) drawTopic(m[1], m[2]);
    else if ((m = /^#play\/([\w-]+)$/.exec(h))) { if (!play || play.id !== m[1]) startPlay(m[1]); }
    else if (h === "#stickers") drawStickers();
    else if (h === "#gate") { show("gate", ["Grown-ups"], K1Store.current() ? "#home" : "#who"); setHear(null); }
    else if (h === "#parent") { if (gateOpen) drawParent(); else location.hash = "#gate"; }
    else if (h === "#bookdone") { show("bookdone", ["华文 Chinese", "红车比赛"], "#t/zh/story"); setHear(K1.UI.bookAsk); }
    else location.hash = "#who";
  }
  window.addEventListener("hashchange", route);
  // coming back from the picture book (browser Back): ask whether the story was finished
  window.addEventListener("pageshow", function () { if (bookReturn()) { if (location.hash !== "#bookdone") location.hash = "#bookdone"; else route(); } });
  if (Speech.test) document.body.classList.add("k1-test");
  K1Store.migrate();
  if (bookReturn()) location.hash = "#bookdone";
  else if (!location.hash || location.hash === "#home") location.hash = "#who";
  route();

  // offline: precache the app and every clip (sw.js); not during headless tests unless &sw=1
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol) && (!Speech.test || /[?&]sw=1/.test(location.search))) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  window.__k1 = { PAUSE: PAUSE, get play() { return play; }, said: Speech.said, stats: Speech.stats, store: K1Store, screenBusy: isScreenBusy, TAP_MS: TAP_MS };
})();
