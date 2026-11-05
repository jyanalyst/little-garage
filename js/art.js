/* Simple SVG art: cars, the road, stickers. No photos. */
var Art = (function () {
  "use strict";
  var COLORS = { red: "#e53935", blue: "#1e88e5", yellow: "#fdd835", green: "#43a047", orange: "#fb8c00", purple: "#8e24aa" };
  function car(color, label) {
    var c = COLORS[color] || color || COLORS.red;
    return '<svg class="car" viewBox="0 0 200 110" aria-hidden="true">' +
      '<path d="M18 70 Q20 48 48 46 L70 22 Q76 16 88 16 L130 16 Q142 16 150 26 L168 46 Q190 48 192 70 L192 82 Q192 88 186 88 L24 88 Q18 88 18 82 Z" fill="' + c + '" stroke="#333" stroke-width="3"/>' +
      '<path d="M78 26 L90 24 L104 24 L104 46 L60 46 Z M114 24 L130 24 Q138 24 144 32 L154 46 L114 46 Z" fill="#cfeefe" stroke="#333" stroke-width="2"/>' +
      '<circle cx="58" cy="88" r="17" fill="#333"/><circle cx="58" cy="88" r="7" fill="#bbb"/>' +
      '<circle cx="152" cy="88" r="17" fill="#333"/><circle cx="152" cy="88" r="7" fill="#bbb"/>' +
      '<circle cx="186" cy="62" r="5" fill="#fff59d" stroke="#333" stroke-width="1.5"/>' +
      (label != null ? '<circle cx="104" cy="66" r="15" fill="#fff" stroke="#333" stroke-width="2"/><text x="104" y="73" text-anchor="middle" font-size="20" font-weight="700" fill="#333" font-family="sans-serif">' + label + '</text>' : '') +
      '</svg>';
  }
  /* sticker tiers: 1 = everyday drawing, 5 = super car drawing, 10 = Higgsfield 3D cut-out of the same super car (img/stickers/tier10/<super>.webp, all 30) */
  function stickerTier(count) {
    var n = +count || 0;
    if (n >= 10) return 10;
    if (n >= 5) return 5;
    return 1;
  }
  function stickerSrc(s, count) {
    var tier = stickerTier(count);
    // ×10: Higgsfield 3D cut-out of the activity's super car (tier10 slug defaults to the super slug)
    if (tier >= 10 && (s.tier10 || s.super)) return "img/stickers/tier10/" + (s.tier10 || s.super) + ".webp";
    if (tier >= 5 && s.super) return "img/stickers/super/" + s.super + ".webp";
    if (s.car) return "img/stickers/everyday/" + s.car + ".webp";
    return null;
  }
  function stickerLabel(s, count) {
    var tier = stickerTier(count);
    if (tier >= 5 && s.superModel) return s.superModel;
    return s.model || "";
  }
  function sticker(s, count) { // s = {color, mark, car?, super?, model?, superModel?, tier10?}; count > 1 adds a ×N badge
    var src = stickerSrc(s, count), tier = stickerTier(count), label = stickerLabel(s, count);
    var body;
    if (src) {
      body = '<img class="sticker-img" src="' + src + '" alt="" width="140" height="140" loading="lazy"/>' +
        (label ? '<div class="sticker-model">' + label + '</div>' : '');
    } else {
      body = '<div class="sticker-car">' + car(s.color) + '</div><div class="sticker-mark">' + s.mark + '</div>';
    }
    return '<div class="sticker' + (tier >= 5 ? ' super' : '') + (tier >= 10 ? ' tier10' : '') + '" style="--sc:' + (COLORS[s.color] || s.color) + '" data-tier="' + tier + '">' + body +
      (count > 1 ? '<div class="sticker-count">×' + count + '</div>' : '') + '</div>';
  }
  function ghost() { // the empty "?" slot in a row
    return '<svg class="car ghost" viewBox="0 0 200 110" aria-hidden="true"><path d="M18 70 Q20 48 48 46 L70 22 Q76 16 88 16 L130 16 Q142 16 150 26 L168 46 Q190 48 192 70 L192 82 Q192 88 186 88 L24 88 Q18 88 18 82 Z" fill="#fff" stroke="#90a4ae" stroke-width="4" stroke-dasharray="10 8"/>' +
      '<text x="105" y="76" text-anchor="middle" font-size="46" font-weight="800" fill="#90a4ae" font-family="sans-serif">?</text></svg>';
  }
  function group(n, color) { // a small car park with n cars (used as an answer card)
    var h = '<div class="group g' + n + '">';
    for (var i = 0; i < n; i++) h += '<span class="mini">' + car(color || ["red", "blue", "yellow", "green", "orange"][i % 5]) + '</span>';
    return h + '</div>';
  }
  function shape(kind) { // road signs and plates
    var svg = {
      circle: '<circle cx="60" cy="60" r="50" fill="#fff" stroke="#e53935" stroke-width="12"/><circle cx="60" cy="60" r="16" fill="#333"/>',
      square: '<rect x="12" y="12" width="96" height="96" rx="6" fill="#1e88e5" stroke="#fff" stroke-width="5"/><text x="60" y="80" text-anchor="middle" font-size="58" font-weight="800" fill="#fff" font-family="sans-serif">P</text>',
      triangle: '<path d="M60 10 L112 104 L8 104 Z" fill="#fff" stroke="#e53935" stroke-width="10" stroke-linejoin="round"/><text x="60" y="92" text-anchor="middle" font-size="44" font-weight="800" fill="#333" font-family="sans-serif">!</text>',
      rectangle: '<rect x="2" y="32" width="116" height="56" rx="6" fill="#fdd835" stroke="#333" stroke-width="4"/><text x="60" y="71" text-anchor="middle" font-size="26" font-weight="800" fill="#333" font-family="sans-serif">K1 CAR</text>'
    }[kind];
    return '<svg class="shape ' + kind + '" viewBox="0 0 120 120" aria-hidden="true">' + svg + '</svg>';
  }
  function garage(kind) { // kind: a colour name, "big" or "small"
    var col = COLORS[kind] || "#78909c", size = kind === "small" ? 0.7 : 1;
    return '<svg class="garage-svg ' + kind + '" viewBox="0 0 200 170" aria-hidden="true"><g transform="translate(' + (100 - 100 * size) + ' ' + (170 - 170 * size) + ') scale(' + size + ')">' +
      '<path d="M10 70 L100 10 L190 70 Z" fill="' + col + '" stroke="#333" stroke-width="4"/><rect x="25" y="70" width="150" height="95" fill="#eceff1" stroke="#333" stroke-width="4"/>' +
      '<rect x="45" y="90" width="110" height="75" fill="#90a4ae" stroke="#333" stroke-width="3"/>' +
      (COLORS[kind] ? '<rect x="45" y="90" width="110" height="16" fill="' + col + '"/>' : '') + '</g></svg>';
  }

  function igloo() { // no igloo emoji on every iPad: a simple snow house
    return '<svg class="pic igloo" viewBox="0 0 120 100" aria-hidden="true"><path d="M8 92 Q8 22 60 18 Q112 22 112 92 Z" fill="#e3f2fd" stroke="#546e7a" stroke-width="4"/>' +
      '<path d="M14 64 H106 M10 80 H110 M30 40 H90 M40 40 V64 M80 40 V64 M60 64 V80 M28 64 V80 M92 64 V80" stroke="#90a4ae" stroke-width="3" fill="none"/>' +
      '<path d="M44 92 V74 Q60 58 76 74 V92 Z" fill="#37474f"/></svg>';
  }
  function ink() { // a pot of ink with a drip
    return '<svg class="pic ink" viewBox="0 0 120 120" aria-hidden="true"><rect x="40" y="14" width="40" height="18" rx="4" fill="#5d4037"/>' +
      '<path d="M28 40 Q28 32 36 32 H84 Q92 32 92 40 V104 Q92 112 84 112 H36 Q28 112 28 104 Z" fill="#cfd8dc" stroke="#37474f" stroke-width="4"/>' +
      '<path d="M32 66 H88 V104 Q88 108 84 108 H36 Q32 108 32 104 Z" fill="#1a237e"/><path d="M100 70 Q108 84 100 92 Q92 84 100 70 Z" fill="#1a237e"/></svg>';
  }
  function light(on) { // traffic light with one lamp lit: "red", "yellow" or "green"
    var lamp = function (c, y) { return '<circle cx="40" cy="' + y + '" r="16" fill="' + (on === c ? COLORS[c] : "#546e7a") + '"' + (on === c ? ' stroke="#fff" stroke-width="3"' : '') + '/>'; };
    return '<svg class="pic light ' + on + '" viewBox="0 0 80 150" aria-hidden="true"><rect x="12" y="6" width="56" height="138" rx="14" fill="#263238"/>' +
      lamp("red", 34) + lamp("yellow", 75) + lamp("green", 116) + '</svg>';
  }
  function sizedCar(size, color) { // "big" or "small" car (listen and pick)
    return '<span class="sort-car ' + size + '">' + car(color) + '</span>';
  }
  return { igloo: igloo, ink: ink, light: light, sizedCar: sizedCar, car: car, sticker: sticker, stickerTier: stickerTier, stickerSrc: stickerSrc, stickerLabel: stickerLabel, ghost: ghost, group: group, shape: shape, garage: garage, COLORS: COLORS };
})();
