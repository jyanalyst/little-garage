/* Voice: recorded Grok TTS clips (audio/manifest.js, key = lang + "|" + text) with the device's own speech as the fallback.
   Speech.say([[text, "en"|"zh"|"snd"], ...], done) plays the lines in order, then calls done once.
   iOS rules (same as the picture book's audio layer): nothing plays until a tap, so unlock() runs inside the first tap
   (silent clip on ONE shared <audio> element, which every later clip reuses, plus an empty utterance);
   audioSession "playback" where supported; a watchdog so a stalled clip never freezes the game; voices load late;
   onend can fail to fire, so every spoken line has a timeout fallback; cancel() then speak() needs a small gap.
   Test hooks: ?test=1 = no real sound, lines finish at once (the clip each line WOULD use is logged);
   ?test=1&real=1&cliprate=4 = really plays the clips, 4x faster. */
var Speech = (function () {
  "use strict";
  var Q = location.search, TEST = /[?&]test=1/.test(Q), REAL = /[?&]real=1/.test(Q);
  var RATE = (function () { var m = /[?&]cliprate=([0-9.]+)/.exec(Q); return m ? Math.min(4, +m[1]) : 0; })();
  var FILES = (typeof K1_AUDIO !== "undefined" && K1_AUDIO.files) || {};
  var has = "speechSynthesis" in window, voices = { en: null, zh: null }, token = 0, keep = null, timer = null, el = null, unlocked = false;
  var LINE_MS = (function () { var m = /[?&]linems=(\d+)/.exec(Q); return m ? +m[1] : 15; })(); // test: how long each line "takes"
  var SND_SAY = { sss: "sss", a: "ah", t: "tuh", i: "ih", p: "puh", n: "nnn" };
  var said = []; // test hook: every line asked for, with the clip it used
  var speaking = false; // true while a say() chain is in flight
  var stats = { clipsEnded: 0, tts: 0, fallbacks: 0 };
  function key(text, lang) { return lang + "|" + text; }
  function clipFor(text, lang) { return FILES[key(text, lang)] || null; }
  function pick() {
    if (!has) return;
    var vs = speechSynthesis.getVoices() || [];
    function best(res) { for (var i = 0; i < res.length; i++) { for (var j = 0; j < vs.length; j++) if (res[i].test(vs[j].lang)) return vs[j]; } return null; }
    voices.en = best([/^en[-_]SG/i, /^en[-_]GB/i, /^en[-_]AU/i, /^en[-_]US/i, /^en/i]);
    var zh = vs.filter(function (v) { return /^zh[-_](CN|Hans)/i.test(v.lang) || /^cmn/i.test(v.lang); });
    zh.sort(function (a, b) { return sc(b) - sc(a); });
    function sc(v) { return (/tingting|婷婷|lili|莉莉/i.test(v.name) ? 10 : 0) + (/premium|enhanced|高品质|增强/i.test(v.name) ? 5 : 0); }
    voices.zh = zh[0] || null;
  }
  if (has) { pick(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pick); }
  function ensureEl() {
    if (el) return el;
    el = document.createElement("audio"); el.setAttribute("playsinline", ""); el.preload = "auto"; el.id = "k1audio"; document.body.appendChild(el);
    return el;
  }
  function unlock() {
    if (unlocked) return; unlocked = true;
    if (TEST && !REAL) return;
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    ensureEl(); el.src = "audio/silence.mp3"; var p = el.play(); if (p && p.catch) p.catch(function () {});
    if (has && !TEST) { try { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} }
  }
  function stop() {
    token++; clearTimeout(timer);
    if (el) { try { el.pause(); } catch (e) {} el.onended = el.onerror = el.onloadedmetadata = null; }
    if (has && !TEST) try { speechSynthesis.cancel(); } catch (e) {}
  }
  function tts(text, lang, my, next) {
    stats.tts++;
    if (TEST || !has) { timer = setTimeout(function () { if (my === token) next(); }, TEST ? LINE_MS : 400 + text.length * 60); return; }
    var finished = false; function fin() { if (finished) return; finished = true; clearTimeout(timer); setTimeout(function () { if (my === token) next(); }, 250); }
    // letter sounds with no clip yet: a spelling the device voice says close to the sound (not the letter name)
    if (lang === "snd") text = SND_SAY[text] || text;
    var L = lang === "snd" ? "en" : lang, u = new SpeechSynthesisUtterance(text); keep = u;
    u.lang = L === "zh" ? "zh-CN" : (voices.en ? voices.en.lang : "en-GB");
    if (voices[L]) u.voice = voices[L];
    u.rate = L === "zh" ? 0.8 : 0.9; u.onend = fin; u.onerror = fin;
    timer = setTimeout(fin, 1500 + text.length * (L === "zh" ? 350 : 110));
    setTimeout(function () { if (my === token) speechSynthesis.speak(u); }, 60);
  }
  function clip(src, text, lang, my, next) {
    ensureEl();
    var done = false, dog = null;
    function fin(why) { if (done) return; done = true; clearTimeout(dog); el.onended = el.onerror = el.onloadedmetadata = null; if (my === token) setTimeout(next, RATE ? 20 : 150); }
    function fallback() { if (done) return; done = true; clearTimeout(dog); stats.fallbacks++; if (my === token) tts(text, lang, my, next); }
    function arm(ms) { clearTimeout(dog); dog = setTimeout(function () { try { el.pause(); } catch (e) {} fin("stalled"); }, ms); }
    arm(15000);
    el.onloadedmetadata = function () { if (isFinite(el.duration) && el.duration > 0) arm(el.duration / (el.playbackRate || 1) * 1000 + 2500); };
    el.onended = function () { stats.clipsEnded++; fin("end"); };
    el.onerror = fallback;
    el.src = src;
    if (RATE) { el.defaultPlaybackRate = RATE; el.playbackRate = RATE; }
    var p = el.play(); if (p && p.catch) p.catch(function () { if (my === token) fallback(); });
  }
  function say(lines, done, opts) {
    /* opts.force = restart even if speaking (leave / wrong-answer pause).
       opts.replay = deliberate hear-again, only after current chain ends (caller waits).
       Spam taps with no opts while speaking are ignored so audio is not cut/stacked. */
    opts = opts || {};
    if (speaking && !opts.force && !opts.replay) { stats.ignored = (stats.ignored || 0) + 1; return false; }
    stop(); speaking = true; var my = token, i = 0;
    function finish() { if (my === token) speaking = false; if (done) done(); }
    function next() {
      if (my !== token) return;
      if (i >= lines.length) { finish(); return; }
      var L = lines[i++], text = L[0], lang = L[1] || "en", src = clipFor(text, lang);
      said.push({ text: text, lang: lang, src: src });
      var cap = document.getElementById("caption"); if (cap) cap.textContent = text;
      if (src && (!TEST || REAL)) clip(src, text, lang, my, next); else tts(text, lang, my, next);
    }
    next();
    return true;
  }
  function stopAll() { speaking = false; stop(); }
  return { say: say, stop: stopAll, unlock: unlock, said: said, stats: stats, speaking: function () { return speaking; }, test: TEST, key: key, clipFor: clipFor, files: FILES };
})();
