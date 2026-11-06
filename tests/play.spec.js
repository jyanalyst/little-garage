const { test, expect } = require("@playwright/test");
const fs = require("fs");

function attr(v) { return String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }

async function boot(page, act, extra) {
  await page.addInitScript(function () {
    localStorage.setItem("k1.players.v1", JSON.stringify({
      current: "ptest",
      list: [{ id: "ptest", name: "", color: "blue", created: "2026-11-06T10:00:00+08:00" }]
    }));
  });
  await page.goto("/?test=1&" + (extra || "pause=40&linems=12&maxlock=5000") + "&n=" + Date.now() + Math.random().toString(36).slice(2) + "#play/" + act);
  await expect(page.locator("#play")).toHaveClass(/active/, { timeout: 8000 });
}

async function lessonOrder(page) {
  await page.locator(".lesson-item").first().waitFor();
  return page.locator(".lesson-item").evaluateAll(function (els) { return els.map(function (e) { return e.getAttribute("data-item"); }).join(","); });
}

async function finishLesson(page) {
  await page.locator(".lesson-item").first().waitFor();
  var n = await page.locator(".lesson-item").count();
  for (var i = 0; i < n; i++) await page.locator(".lesson-item").nth(i).click();
  await page.locator(".to-check").waitFor({ timeout: 8000 });
}

async function openCheck(page) {
  await finishLesson(page);
  await page.locator(".to-check").click();
  await expect(page.locator(".flag")).toHaveCount(6);
}

function drawn(page) {
  return page.evaluate(function () {
    return window.__k1.play.checks.map(function (c) { return c.ask + "|" + c.answer + "|" + c.options.join(","); });
  });
}

test("a run shows 6 flags from a pool of at least 12, and a second open can differ", async function ({ page }, testInfo) {
  var first = null, second = null, tries = 0;
  while (tries < 8 && (!second || first.join("\n") === second.join("\n") || first[0] === second[0])) {
    await boot(page, "zh-colours");
    await openCheck(page);
    var pool = await page.evaluate(function () { return window.__k1.play.a.check.length; });
    expect(pool).toBeGreaterThanOrEqual(12);
    expect(await page.locator(".flag").count()).toBe(6);
    var seq = await drawn(page);
    expect(seq).toHaveLength(6);
    expect(new Set(seq).size).toBe(6);
    if (!first) first = seq;
    else if (first.join("\n") !== seq.join("\n") && first[0] !== seq[0]) second = seq;
    tries++;
    if (testInfo.project.name === "chromium" && (first === seq || second === seq)) {
      await page.locator(".options.ready").waitFor();
      fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });
      var name = first === seq && !second ? "colours-run-1.png" : "colours-run-2.png";
      if (first === seq && !second || second === seq) await page.screenshot({ path: "/opt/cursor/artifacts/" + name });
    }
  }
  expect(second, "two opens of 车的颜色 should be able to draw different questions").toBeTruthy();
  expect(first.join("\n")).not.toBe(second.join("\n"));
});

test("finishing logs 6 items and still has no score", async function ({ page }) {
  await boot(page, "en-s");
  await openCheck(page);
  for (var i = 0; i < 6; i++) {
    await page.locator(".options.ready").waitFor();
    var before = await page.evaluate(function () { return window.__k1.play.item; });
    await page.evaluate(function () {
      var it = window.__k1.play.checks[window.__k1.play.item];
      var b = document.querySelector('#stage .option[data-opt="' + CSS.escape(it.answer) + '"]');
      b.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
    });
    await page.waitForFunction(function (n) { return window.__k1.play.item === n + 1 || window.__k1.play.phase === "sticker"; }, before);
  }
  await expect(page.locator("#stage")).toHaveClass(/sticker-screen/);
  var logged = await page.evaluate(function () {
    var row = window.__k1.store.log()[0];
    return { n: row.items.length, done: row.done, title: row.title };
  });
  expect(logged).toEqual({ n: 6, done: true, title: "Letter s" });
  expect(await page.locator("#stage").innerText()).not.toMatch(/Score|Wrong|Game over|Fail|Time'?s up/i);
});

test("answers stay locked until the question finishes, and mashing does not double-count", async function ({ page }) {
  await boot(page, "en-a", "pause=30&linems=250&maxlock=8000");
  await openCheck(page);
  await expect(page.locator(".options")).toHaveClass(/locked/);
  await page.locator(".option").first().click();
  expect(await page.evaluate(function () { return window.__k1.play.miss; })).toBe(0);
  expect(await page.locator(".option.dim").count()).toBe(0);
  await page.locator(".options.ready").waitFor();
  await page.evaluate(function () {
    var it = window.__k1.play.checks[window.__k1.play.item];
    var b = document.querySelector('#stage .option[data-opt="' + CSS.escape(it.answer) + '"]');
    for (var i = 0; i < 8; i++) b.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
  });
  await page.waitForFunction(function () { return window.__k1.play.item === 1; });
  expect(await page.evaluate(function () { return window.__k1.play.results.length; })).toBe(1);
  expect(await page.evaluate(function () { return window.__k1.play.results[0].result; })).toBe("first");
});

test("a miss is not a fail: hint, then the answer is shown, and the game continues", async function ({ page }) {
  await boot(page, "en-s", "pause=30&linems=15&maxlock=5000");
  await openCheck(page);
  await page.locator(".options.ready").waitFor();
  var wrongs = await page.evaluate(function () {
    var it = window.__k1.play.checks[window.__k1.play.item];
    return it.options.filter(function (o) { return o !== it.answer; });
  });
  await page.locator('.option[data-opt="' + attr(wrongs[0]) + '"]').click();
  await expect(page.locator('.option[data-opt="' + attr(wrongs[0]) + '"]')).toHaveClass(/dim/);
  await expect(page.locator(".option.hint")).toBeVisible();
  expect(await page.locator("#stage").innerText()).not.toMatch(/Wrong|Score|Game over|Fail|Time'?s up/i);
  expect(await page.evaluate(function () { return window.__k1.play.phase; })).toBe("check");
  await page.locator(".options.ready").waitFor();
  await page.locator('.option[data-opt="' + attr(wrongs[1]) + '"]').click();
  await expect(page.locator(".option.reveal")).toBeVisible();
  await page.locator(".options.ready").waitFor();
  await page.locator(".option.reveal").click();
  await page.waitForFunction(function () { return window.__k1.play.item === 1; });
  expect(await page.evaluate(function () { return window.__k1.play.results[0].result; })).toBe("shown");
  expect(await page.locator(".flag").count()).toBe(6);
  expect(await page.evaluate(function () { return window.__k1.play.phase; })).toBe("check");
});

test("lesson pictures shuffle, and the three order-sensitive maths lessons do not", async function ({ page }) {
  var orders = [];
  for (var i = 0; i < 6 && new Set(orders).size < 2; i++) {
    await boot(page, "en-s");
    orders.push(await lessonOrder(page));
  }
  expect(new Set(orders).size).toBeGreaterThan(1);
  orders.forEach(function (o) {
    expect(o.split(",").sort().join(",")).toBe("sandwich,seal,six,snake,sock,sun");
  });

  await boot(page, "m5-pattern");
  await expect(page.locator(".lesson-item .li-label")).toHaveText(["red", "blue", "red", "blue"]);
  await boot(page, "m5-pattern");
  await expect(page.locator(".lesson-item .li-label")).toHaveText(["red", "blue", "red", "blue"]);

  await boot(page, "m4-sort");
  expect(await page.locator(".garage-pick").evaluateAll(function (els) { return els.map(function (e) { return e.getAttribute("data-g"); }); })).toEqual(["red", "blue"]);

  await boot(page, "m1-count20", "pause=20&linems=10&maxlock=4000");
  await page.locator('.slot[data-i="0"]').click();
  await expect(page.locator('.slot[data-i="0"] .count-tag')).toHaveText("1");
  await page.waitForFunction(function () { return !window.__k1.play.lessonBusy; });
  await page.locator('.slot[data-i="1"]').click();
  await expect(page.locator('.slot[data-i="1"] .count-tag')).toHaveText("2");
});
