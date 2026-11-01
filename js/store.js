/* On-device storage only (localStorage). No network code, no names.
   k1.stickers.v1 : [{sticker, act, at}]          one entry per finished run (grouped per activity for display)
   k1.log.v1      : [{at, subject, topic, act, title, done, items:[{label, result}]}]  newest first, max 300
   k1.settings.v1 : {pinyin:false, person:"mummy"} */
var K1Store = (function () {
  "use strict";
  var SK = "k1.stickers.v1", LK = "k1.log.v1", CK = "k1.settings.v1";
  function PEOPLE() { return K1.PEOPLE; } // defined in activities.js
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function arr(k) { var a = jget(k, []); return Array.isArray(a) ? a : []; }
  // Singapore time stamp, same shape as the maths games: 2026-11-01T12:40:00+08:00
  function now() {
    var d = new Date(Date.now() + 8 * 3600000), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) + "T" + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + "+08:00";
  }
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function pretty(iso) {
    var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(String(iso || "")); if (!m) return "";
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])), h = +m[4], ap = h < 12 ? "am" : "pm"; h = h % 12 || 12;
    return DAYS[d.getUTCDay()] + " " + (+m[3]) + " " + MON[+m[2] - 1] + ", " + h + ":" + m[5] + " " + ap;
  }
  function settings() { var s = jget(CK, {}); return { pinyin: !!s.pinyin, person: PEOPLE()[s.person] ? s.person : "mummy" }; }
  return {
    now: now, pretty: pretty, settings: settings,
    set: function (k, v) { var s = settings(); s[k] = v; jset(CK, s); },
    person: function () { return PEOPLE()[settings().person]; },
    stickers: function () { return arr(SK); },
    // one entry per finished run; the book shows ONE sticker per activity with a count (x2, x3 ...)
    addSticker: function (sticker, act) { var a = arr(SK); a.push({ sticker: sticker, act: act, at: now() }); jset(SK, a); return this.count(act); },
    count: function (act) { return arr(SK).filter(function (x) { return x.act === act; }).length; },
    grouped: function () { var by = {}, out = []; arr(SK).forEach(function (x) { if (!by[x.act]) { by[x.act] = { act: x.act, sticker: x.sticker, first: x.at, count: 0 }; out.push(by[x.act]); } by[x.act].count++; }); return out; },
    log: function () { return arr(LK); },
    addLog: function (e) { var a = arr(LK); e.at = now(); a.unshift(e); jset(LK, a.slice(0, 300)); },
    clearAll: function () { try { localStorage.removeItem(SK); localStorage.removeItem(LK); } catch (e) {} }
  };
})();
