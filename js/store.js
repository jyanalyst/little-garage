/* On-device storage only (localStorage). No network code. Player names are typed on this iPad and live ONLY here.
   k1.players.v1          : {current: id, list: [{id, name, color, created}]}   name may be "" (the car colour is the avatar)
   k1.p.<id>.stickers     : [{sticker, act, at}]   one entry per finished run (grouped per activity for display, ×N)
   k1.p.<id>.log          : [{at, subject, topic, act, title, done, items:[{label, result}]}]  newest first, max 300
   k1.p.<id>.settings     : {pinyin:false, person:"mummy"}
   k1.p.<id>.tries        : {actId:{started,finished}}  started = opens; finished tracked separately (stickers also count finishes)
   Before players existed the same data lived in k1.stickers.v1 / k1.log.v1 / k1.settings.v1: migrate() moves it into
   the first player (red car, no name) and keeps a copy under k1.migrated.v1 so nothing is lost. */
var K1Store = (function () {
  "use strict";
  var PK = "k1.players.v1", OLD = { stickers: "k1.stickers.v1", log: "k1.log.v1", settings: "k1.settings.v1" };
  var COLORS = ["red", "blue", "yellow", "green", "orange", "purple"];
  function PEOPLE() { return K1.PEOPLE; } // defined in activities.js
  function raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function jget(k, d) { try { var v = JSON.parse(raw(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function arr(k) { var a = jget(k, []); return Array.isArray(a) ? a : []; }
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
  function cleanName(n) { return String(n || "").replace(/[^\p{L}\p{M} '\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 12); }
  /* ---------- players ---------- */
  function P() { var p = jget(PK, null); if (!p || !Array.isArray(p.list)) p = { current: null, list: [] }; return p; }
  function savePlayers(p) { jset(PK, p); }
  function find(id) { var l = P().list; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function cur() { var p = P(); return find(p.current) ? p.current : null; }
  function key(base, id) { return "k1.p." + (id || cur()) + "." + base; }
  function newId() { return "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function addPlayer(name, color) {
    var p = P(), id = newId();
    p.list.push({ id: id, name: cleanName(name), color: color, created: now() }); p.current = id; savePlayers(p); return id;
  }
  function migrate() {
    if (raw(PK)) return false;
    var has = Object.keys(OLD).some(function (k) { return raw(OLD[k]) != null; });
    if (!has) return false;
    var copy = {}; Object.keys(OLD).forEach(function (k) { copy[k] = raw(OLD[k]); });
    var id = addPlayer("", "red");
    Object.keys(OLD).forEach(function (k) { if (copy[k] != null) { try { localStorage.setItem(key(k, id), copy[k]); } catch (e) {} } del(OLD[k]); });
    jset("k1.migrated.v1", { at: now(), to: id, data: copy });
    return true;
  }
  /* ---------- per-player data (id defaults to the current player) ---------- */
  function settings(id) { var s = jget(key("settings", id), {}); return { pinyin: !!s.pinyin, person: PEOPLE()[s.person] ? s.person : "mummy" }; }
  function stickers(id) { return arr(key("stickers", id)); }
  function grouped(id) { var by = {}, out = []; stickers(id).forEach(function (x) { if (!by[x.act]) { by[x.act] = { act: x.act, sticker: x.sticker, first: x.at, count: 0 }; out.push(by[x.act]); } by[x.act].count++; }); return out; }
  return {
    now: now, pretty: pretty, COLORS: COLORS, cleanName: cleanName, migrate: migrate,
    players: function () { return P().list.slice(); }, current: cur, player: function (id) { return find(id || cur()); },
    addPlayer: addPlayer,
    choose: function (id) { var p = P(); if (find(id)) { p.current = id; savePlayers(p); } },
    updatePlayer: function (id, ch) { var p = P(); p.list.forEach(function (x) { if (x.id === id) { if (ch.name != null) x.name = cleanName(ch.name); if (ch.color) x.color = ch.color; } }); savePlayers(p); },
    deletePlayer: function (id) { var p = P(); p.list = p.list.filter(function (x) { return x.id !== id; }); if (p.current === id) p.current = p.list.length ? p.list[0].id : null; savePlayers(p); ["stickers", "log", "settings", "tries"].forEach(function (b) { del(key(b, id)); }); },
    takenColors: function (exceptId) { return P().list.filter(function (x) { return x.id !== exceptId; }).map(function (x) { return x.color; }); },
    settings: settings,
    set: function (k, v, id) { var s = settings(id); s[k] = v; jset(key("settings", id), s); },
    person: function () { return PEOPLE()[settings().person]; },
    stickers: stickers, grouped: grouped,
    addSticker: function (sticker, act) { var a = stickers(); a.push({ sticker: sticker, act: act, at: now() }); jset(key("stickers"), a); return this.count(act); },
    count: function (act, id) { return stickers(id).filter(function (x) { return x.act === act; }).length; },
    log: function (id) { return arr(key("log", id)); },
    addLog: function (e) { var a = arr(key("log")); e.at = now(); a.unshift(e); jset(key("log"), a.slice(0, 300)); },
    /* attempts: started each time he opens an activity; finished = sticker count for that act */
    triesMap: function (id) { var m = jget(key("tries", id), {}); return m && typeof m === "object" ? m : {}; },
    tryCount: function (act, id) { var m = this.triesMap(id)[act]; return m && m.started ? m.started : 0; },
    finishedCount: function (act, id) { return this.count(act, id); },
    addTry: function (act) {
      var m = this.triesMap(); if (!m[act]) m[act] = { started: 0, finished: 0 };
      m[act].started = (m[act].started || 0) + 1; jset(key("tries"), m); return m[act].started;
    },
    markFinished: function (act) {
      var m = this.triesMap(); if (!m[act]) m[act] = { started: 0, finished: 0 };
      m[act].finished = (m[act].finished || 0) + 1; jset(key("tries"), m); return m[act].finished;
    },
    clearAll: function (id) { del(key("stickers", id)); del(key("log", id)); del(key("tries", id)); }
  };
})();
