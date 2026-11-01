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
  function sticker(s, count) { // s = {color, mark}; count > 1 adds a ×N badge (same sticker again, not a new one)
    return '<div class="sticker" style="--sc:' + (COLORS[s.color] || s.color) + '"><div class="sticker-car">' + car(s.color) + '</div><div class="sticker-mark">' + s.mark + '</div>' +
      (count > 1 ? '<div class="sticker-count">×' + count + '</div>' : '') + '</div>';
  }
  return { car: car, sticker: sticker, COLORS: COLORS };
})();
