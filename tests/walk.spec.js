/* End-to-end: every activity can be finished on an iPad-sized screen.
   Seeds are chosen so the union of draws covers every pooled question.
   A second run forces clips to never end; a third uses only Keep going. */
const { test, expect } = require("@playwright/test");
const fs = require("fs");

function bootScript() {
  localStorage.setItem("k1.players.v1", JSON.stringify({
    current: "ptest",
    list: [{ id: "ptest", name: "", color: "blue", created: "2026-11-06T10:00:00+08:00" }]
  }));
}

async function boot(page, hash, extra) {
  await page.addInitScript(bootScript);
  var q = extra || "pause=0&linems=0&maxlock=4000";
  await page.goto("/?test=1&" + q + "&n=" + Date.now() + Math.random().toString(36).slice(2) + hash);
  await expect(page.locator("body")).toHaveAttribute("data-screen", /play|bookdone/, { timeout: 8000 });
}

async function coverPlan(page) {
  await page.addInitScript(bootScript);
  await page.goto("/?test=1&linems=0&n=plan" + Date.now());
  return page.evaluate(function () {
    function sig(c) { return c.label + "\n" + c.answer + "\n" + c.options.join(","); }
    var plan = [];
    Object.keys(K1.ACTS).forEach(function (id) {
      var a = K1.ACTS[id];
      if (!a.check) { plan.push({ id: id, seeds: [1], pool: 0 }); return; }
      var seen = {}, seeds = [], s, i, draw, novel;
      for (s = 1; s <= 500 && Object.keys(seen).length < a.check.length; s++) {
        draw = K1.pick(a.check, K1.CHECK_N, K1.mulberry(s));
        novel = false;
        for (i = 0; i < draw.length; i++) if (!seen[sig(draw[i])]) novel = true;
        if (!novel) continue;
        for (i = 0; i < draw.length; i++) seen[sig(draw[i])] = 1;
        seeds.push(s);
      }
      plan.push({ id: id, seeds: seeds, pool: a.check.length, covered: Object.keys(seen).length });
    });
    return plan;
  });
}

/* Drive the real buttons. Required targets must sit on screen, under the header. */
async function playThrough(page) {
  await page.evaluate(async function () {
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function fire(el) {
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, clientX: 8, clientY: 8 }));
    }
    function boxOk(el, name, errs) {
      var r = el.getBoundingClientRect();
      var top = Math.max(r.top, 96), left = Math.max(r.left, 0);
      var bottom = Math.min(r.bottom, window.innerHeight), right = Math.min(r.right, window.innerWidth);
      var area = Math.max(0, right - left) * Math.max(0, bottom - top);
      if (r.width < 8 || r.height < 8 || area < r.width * r.height * 0.7) {
        errs.push(name + " @" + Math.round(r.left) + "," + Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height) + " vp " + window.innerWidth + "x" + window.innerHeight);
      }
    }
    var errs = [], guard = 0, p;
    while ((p = window.__k1.play) && p.phase !== "sticker" && guard++ < 700) {
      if (p.phase === "check") {
        if (p.locked || p.busy || p.advancing) { await sleep(20); continue; }
        var it = p.checks[p.item];
        var opts = [].slice.call(document.querySelectorAll("#stage .option"));
        if (!opts.length) { await sleep(20); continue; }
        opts.forEach(function (o) { boxOk(o, "option " + o.getAttribute("data-opt"), errs); });
        var ans = opts.filter(function (o) { return o.getAttribute("data-opt") === it.answer; })[0];
        if (!ans) throw new Error("no card for " + it.answer + " in " + p.id);
        fire(ans);
        await sleep(15);
        continue;
      }
      if (p.phase !== "lesson") { await sleep(20); continue; }
      if (p.lessonLocked || p.lessonBusy || p.sortBusy) { await sleep(20); continue; }
      var fwd = document.querySelector("#stage .to-check, #stage .next-round");
      if (fwd) { boxOk(fwd, "forward", errs); fire(fwd); await sleep(15); continue; }
      var fresh = [].slice.call(document.querySelectorAll("#stage .lesson-item:not(.seen)"));
      if (fresh.length) { boxOk(fresh[0], "picture " + fresh[0].getAttribute("data-item"), errs); fire(fresh[0]); await sleep(10); continue; }
      var slot = document.querySelector("#stage .slot.next:not(.seen)");
      if (!slot) {
        var slots = [].slice.call(document.querySelectorAll("#stage .slot"));
        slot = slots.filter(function (s) { return getComputedStyle(s).visibility !== "hidden" && !s.classList.contains("seen"); })[0];
      }
      if (slot) { boxOk(slot, "car " + slot.getAttribute("data-i"), errs); fire(slot); await sleep(10); continue; }
      var park = [].slice.call(document.querySelectorAll("#stage button.park-car:not(.seen)"))[0];
      if (park) { boxOk(park, "park", errs); fire(park); await sleep(10); continue; }
      var wait = [].slice.call(document.querySelectorAll("#stage .wait-car")).filter(function (b) { return getComputedStyle(b).visibility !== "hidden" && b.id !== "newCar"; })[0];
      if (wait) { boxOk(wait, "waiting car", errs); fire(wait); await sleep(10); continue; }
      var side = [].slice.call(document.querySelectorAll("#stage .park-pick:not(.seen-park)"))[0];
      if (side) {
        [].forEach.call(document.querySelectorAll("#stage .park-pick"), function (b) { boxOk(b, "car park " + b.getAttribute("data-side"), errs); });
        fire(side); await sleep(10); continue;
      }
      var garages = [].slice.call(document.querySelectorAll("#stage .garage-pick"));
      if (garages.length) {
        var want = (document.getElementById("sortShow") || {}).getAttribute ? document.getElementById("sortShow").getAttribute("data-want") : "";
        var g = garages.filter(function (b) { return b.getAttribute("data-g") === want; })[0] || garages[0];
        garages.forEach(function (b) { boxOk(b, "garage " + b.getAttribute("data-g"), errs); });
        fire(g); await sleep(10); continue;
      }
      var nc = document.getElementById("newCar");
      if (nc && getComputedStyle(nc).visibility !== "hidden") { boxOk(nc, "new car", errs); fire(nc); await sleep(15); continue; }
      throw new Error("lesson stuck in " + p.id + " round " + p.round + " caption " + (document.getElementById("caption") || {}).textContent);
    }
    p = window.__k1.play;
    if (!p || p.phase !== "sticker") throw new Error("did not reach the sticker (" + (p && p.id) + " " + (p && p.phase) + ")");
    var keep = document.getElementById("keepBtn");
    if (keep && !keep.hidden) errs.push("Keep going still showing on the sticker");
    if (errs.length) throw new Error("off screen:\n" + errs.slice(0, 6).join("\n"));
    return true;
  });
}

async function keepThrough(page) {
  await page.evaluate(async function () {
    function fire(el) {
      el._k1TapAt = 0;
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    }
    var guard = 0, p;
    while ((p = window.__k1.play) && p.phase !== "sticker" && guard++ < 40) {
      var keep = document.getElementById("keepBtn");
      if (!keep || keep.hidden) throw new Error("Keep going missing during " + p.phase + " of " + p.id);
      fire(keep);
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    p = window.__k1.play;
    if (!p || p.phase !== "sticker") throw new Error("Keep going did not finish " + (p && p.id) + " " + (p && p.phase));
  });
}

async function bookSticker(page, extra) {
  await boot(page, "#bookdone", extra);
  await page.locator("#bookYes").click();
  await expect(page.locator("#stage")).toHaveClass(/sticker-screen/);
  await expect(page.locator("#stage")).not.toContainText(/Wrong|Score|Game over|Fail|Time'?s up/i);
}

test.describe("every activity can be finished", function () {
  test.describe.configure({ timeout: 600000 });

  test("many seeds cover every pooled question and each run reaches the sticker", async function ({ page }) {
    test.setTimeout(600000);
    var plan = await coverPlan(page);
    expect(plan.length).toBe(30);
    for (var i = 0; i < plan.length; i++) {
      var item = plan[i];
      if (!item.pool) {
        await bookSticker(page, "pause=0&linems=0&maxlock=4000");
        continue;
      }
      expect(item.covered, item.id).toBe(item.pool);
      expect(item.seeds.length).toBeGreaterThan(0);
      var seen = {};
      for (var s = 0; s < item.seeds.length; s++) {
        await boot(page, "#play/" + item.id, "pause=0&linems=0&maxlock=4000&seed=" + item.seeds[s]);
        await playThrough(page);
        await expect(page.locator("#stage")).toHaveClass(/sticker-screen/);
        await expect(page.locator("#stage")).not.toContainText(/Wrong|Score|Game over|Fail|Time'?s up/i);
        var drawn = await page.evaluate(function () {
          return window.__k1.play.checks.map(function (c) { return c.label + "\n" + c.answer + "\n" + c.options.join(","); });
        });
        expect(drawn).toHaveLength(6);
        drawn.forEach(function (sig) { seen[sig] = 1; });
      }
      expect(Object.keys(seen).length, item.id + " covered questions").toBe(item.pool);
    }
  });

  test("audio that never ends still reaches the sticker", async function ({ page }) {
    test.setTimeout(600000);
    var plan = await coverPlan(page);
    for (var i = 0; i < plan.length; i++) {
      var id = plan[i].id;
      if (!plan[i].pool) { await bookSticker(page, "audiofail=1&pause=0&linems=5000&maxlock=80"); continue; }
      await boot(page, "#play/" + id, "audiofail=1&pause=0&linems=5000&maxlock=80&seed=1");
      await playThrough(page);
      await expect(page.locator("#stage")).toHaveClass(/sticker-screen/);
      var falls = await page.evaluate(function () { return window.__k1.play.lockFallbacks || 0; });
      expect(falls, id + " should have unlocked without an ended event").toBeGreaterThan(0);
      await expect(page.locator("#stage")).not.toContainText(/Wrong|Score|Game over|Fail|Time'?s up/i);
    }
  });

  test("Keep going alone can finish every activity", async function ({ page }) {
    test.setTimeout(300000);
    var plan = await coverPlan(page);
    for (var i = 0; i < plan.length; i++) {
      var id = plan[i].id;
      if (!plan[i].pool) { await bookSticker(page, "pause=0&linems=0&maxlock=4000&seed=3"); continue; }
      await boot(page, "#play/" + id, "pause=0&linems=0&maxlock=4000&seed=3");
      await expect(page.locator("#keepBtn")).toBeVisible();
      await keepThrough(page);
      await expect(page.locator("#stage")).toHaveClass(/sticker-screen/);
      await expect(page.locator("#stage")).not.toContainText(/Wrong|Score|Game over|Fail|Time'?s up/i);
      await expect(page.locator("#keepBtn")).toBeHidden();
    }
  });
});

test("One more car keeps the new car on screen until it is tapped", async function ({ page }, testInfo) {
  test.setTimeout(90000);
  await boot(page, "#play/m7-onemore", "pause=0&linems=800&maxlock=20000&seed=1");
  await page.waitForFunction(function () {
    return document.getElementById("caption").textContent === "Tap the new car to drive it in." && window.__k1.play.lessonLocked;
  }, null, { timeout: 8000 });
  await expect(page.locator("#newCar")).toBeVisible();
  await expect(page.locator("#newCar")).toBeInViewport();
  var during = await page.locator("#newCar").boundingBox();
  var vp = page.viewportSize();
  expect(during.y).toBeGreaterThanOrEqual(96);
  expect(during.y + during.height).toBeLessThanOrEqual(vp.height);
  expect(during.x).toBeGreaterThanOrEqual(0);
  expect(during.x + during.width).toBeLessThanOrEqual(vp.width);
  // A tap while the instruction is still playing must not swallow the car.
  await page.evaluate(function () {
    document.getElementById("newCar").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
  });
  await expect(page.locator("#newCar")).toBeVisible();
  expect(await page.locator("#emptyBay").innerHTML()).toBe("");
  expect(await page.evaluate(function () { return window.__k1.play.moved; })).toBeFalsy();
  fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });
  var shot = "/opt/cursor/artifacts/onemore-" + testInfo.project.name;
  await page.screenshot({ path: shot + "-prompt.png" });
  await expect(page.locator("#newCar.ready-tap")).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: shot + "-ready.png" });
  await page.locator("#newCar").click();
  await expect(page.locator(".next-round, .to-check")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#emptyBay .car")).toBeVisible();
  await page.screenshot({ path: shot + "-drove-in.png" });
  // Same activity, fast voice: the whole lesson and car game still reach the sticker.
  await boot(page, "#play/m7-onemore", "pause=0&linems=0&maxlock=4000&seed=1");
  await playThrough(page);
  await expect(page.locator("#stage")).toHaveClass(/sticker-screen/);
});
