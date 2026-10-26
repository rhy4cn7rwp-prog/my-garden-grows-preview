const { test } = require("node:test");
const a = require("node:assert/strict");
const G = require("../src/game.js");
const L = require("../src/garden-learning.js");
function farm(day = 5, count = 0) {
  const s = G.initial();
  s.season = Math.floor((day - 1) / 20) + 1;
  s.day = ((day - 1) % 20) + 1;
  s.dreamPurchaseCount = count;
  s.plots = Array.from({ length: 25 }, () => ({
    id: "carrot",
    age: 3,
    left: 0,
    quality: 100,
    watered: false,
  }));
  return s;
}
function complete(s, seed = 1234) {
  G.startWeeding(s, seed);
  while (s.weedingLesson.session) {
    const q = L.questions(s.weedingLesson.session);
    const i = q.findIndex(
      (v, i) => !v.correct && !s.weedingLesson.session.removed.includes(i),
    );
    G.pullWeed(s, i);
  }
}
function unchangedFarm(s) {
  return [
    s.cash,
    s.seeds,
    s.inventory,
    s.display,
    s.owned,
    s.dreamPurchases,
    s.day,
    s.season,
    s.plots.map((p) => p && { ...p, weedingBonus: undefined }),
  ];
}
test("five-day windows begin on day 5, do not accumulate, and cross seasons indefinitely", () => {
  for (const [day, cycle, available, days] of [
    [1, 0, false, 4],
    [4, 0, false, 1],
    [5, 1, true, 5],
    [6, 1, true, 4],
    [9, 1, true, 1],
    [10, 2, true, 5],
    [20, 4, true, 5],
    [21, 4, true, 4],
    [25, 5, true, 5],
    [10001, 2000, true, 4],
  ]) {
    const s = farm(day),
      w = G.weedingStatus(s);
    a.equal(w.cycle, cycle);
    a.equal(w.available, available);
    a.equal(w.days, days);
  }
  const s = farm(5);
  complete(s);
  G.harvestAll(s);
  a.equal(G.weedingAvailable(s), false);
  a.throws(() => G.startWeeding(s));
  s.day = 9;
  a.equal(G.weedingAvailable(s), false);
  s.day = 10;
  s.plots = farm().plots;
  a.equal(G.weedingAvailable(s), true);
});
test("one/two/three rounds use earned purchases without raising numbers after just first dream", () => {
  for (const n of [0, 1, 2, 3, 4, 5, 6, 8, 10]) {
    const s = farm(5, n);
    G.startWeeding(s, 55);
    a.equal(s.weedingLesson.session.roundCount, n < 2 ? 1 : n < 4 ? 2 : 3);
    a.equal(s.weedingLesson.session.level, Math.min(5, Math.floor(n / 2)));
  }
  const s = farm();
  s.dreamPurchases = { ball: { owned: true }, bike: { owned: true } };
  G.startWeeding(s);
  a.equal(s.weedingLesson.session.roundCount, 2);
});
test("randomized four-choice rounds always have 1–3 wrong answers; arithmetic is correct and gradual", () => {
  const signatures = new Set();
  for (let n = 0; n <= 10; n++)
    for (let seed = 1; seed <= 70; seed++) {
      const s = farm(5, n);
      G.startWeeding(s, seed);
      const session = s.weedingLesson.session;
      for (let round = 0; round < session.roundCount; round++) {
        session.round = round;
        const q = L.questions(session);
        a.equal(q.length, 4);
        a.ok(
          q.filter((x) => !x.correct).length >= 1 &&
            q.filter((x) => !x.correct).length <= 3,
        );
        a.equal(new Set(q.map((x) => x.original)).size, 4);
        for (const item of q) {
          const match = item.correction.match(
            /^(\d+(?:\.\d+)?) ([+−×]) (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?)$/,
          );
          a.ok(match);
          const [, x, op, y, z] = match;
          const answer = op === "+" ? +x + +y : op === "−" ? x - y : x * y;
          a.equal(Math.round(answer * 100), Math.round(z * 100));
          a.equal(item.original === item.correction, item.correct);
          if (n < 2) a.ok(!item.original.includes("×"));
          if (n < 6) a.ok(!item.original.includes("."));
        }
      }
      signatures.add(JSON.stringify(L.questions(session)));
    }
  a.ok(signatures.size > 300);
  // Whole-number multiplication is actually present before decimals unlock.
  const s = farm(5, 2);
  let multiplication = false;
  for (let seed = 1; seed < 40; seed++) {
    s.weedingLesson.session = null;
    G.startWeeding(s, seed);
    multiplication ||= L.questions(s.weedingLesson.session).some((q) =>
      q.original.includes("×"),
    );
  }
  a.ok(multiplication);
});
test("correct choices stay planted, hints begin at two mistakes and wrong choices never penalize farm or reward", () => {
  const s = farm(5, 4);
  G.startWeeding(s, 333);
  const before = structuredClone(unchangedFarm(s));
  let q = L.questions(s.weedingLesson.session),
    i = q.findIndex((x) => x.correct);
  a.equal(G.pullWeed(s, i).kind, "kept");
  a.equal(s.weedingLesson.session.mistakes, 1);
  a.deepEqual(s.weedingLesson.session.removed, []);
  a.equal(G.pullWeed(s, i).kind, "kept");
  a.equal(s.weedingLesson.session.mistakes, 2);
  a.deepEqual(unchangedFarm(s), before);
  while (s.weedingLesson.session.round === 0) {
    q = L.questions(s.weedingLesson.session);
    i = q.findIndex(
      (x, i) => !x.correct && !s.weedingLesson.session.removed.includes(i),
    );
    G.pullWeed(s, i);
  }
  a.equal(s.weedingLesson.session.mistakes, 0);
  a.deepEqual(s.weedingLesson.session.removed, []);
  a.ok(s.plots.every((p) => !p.weedingBonus));
  complete(s);
  a.ok(s.plots.every((p) => p.weedingBonus));
  a.deepEqual(unchangedFarm(s), before);
});
test("partial session resumes exactly across save including round, questions, mistakes and pulled answers", () => {
  const s = farm(5, 4);
  G.startWeeding(s, 456);
  const q = L.questions(s.weedingLesson.session);
  G.pullWeed(
    s,
    q.findIndex((x) => x.correct),
  );
  const wrong = q.findIndex((x) => !x.correct);
  G.pullWeed(s, wrong);
  const data = structuredClone(s.weedingLesson),
    r = G.recover(JSON.stringify(s));
  a.deepEqual(r.weedingLesson, data);
  a.deepEqual(
    L.questions(r.weedingLesson.session),
    L.questions(s.weedingLesson.session),
  );
  a.equal(r.cash, s.cash);
  const c = q.findIndex((x) => x.correct);
  G.pullWeed(r, c);
  a.equal(r.weedingLesson.session.mistakes, 2);
  complete(r);
  a.equal(r.weedingLesson.session, null);
  a.ok(r.plots.every((p) => p.weedingBonus));
  const saved = G.recover(JSON.stringify(r));
  a.equal(G.weedingAvailable(saved), false);
  a.throws(() => G.pullWeed(saved, wrong));
});
test("cancel/start does not change questions or consume opportunity, skipped cycle starts one new session", () => {
  const s = farm(5, 4);
  const session = G.startWeeding(s, 90);
  a.deepEqual(G.startWeeding(s, 123), session);
  s.day = 10;
  const next = G.startWeeding(s, 123);
  a.equal(next.cycle, 2);
  a.equal(next.round, 0);
  a.equal(next.roundCount, 3);
  a.equal(next.seed, 123);
});
test("completed sessions alternate math and spelling; spelling words have actual corrections", () => {
  const s = farm();
  complete(s);
  a.equal(s.weedingLesson.nextType, "spelling");
  G.harvestAll(s);
  s.day = 10;
  s.plots = farm().plots;
  G.startWeeding(s, 12);
  a.equal(s.weedingLesson.session.type, "spelling");
  for (const q of L.questions(s.weedingLesson.session)) {
    a.ok(/^[a-z]+$/.test(q.original));
    a.equal(q.original === q.correction, q.correct);
  }
  complete(s);
  a.equal(s.weedingLesson.nextType, "math");
});
test("pending bonus blocks later cycles without overwriting or stacking", () => {
  const s = farm();
  complete(s);
  const before = JSON.stringify(s.plots);
  s.day = 10;
  a.equal(G.weedingStatus(s).bonus, true);
  a.equal(G.weedingAvailable(s), false);
  a.throws(() => G.startWeeding(s));
  a.equal(JSON.stringify(s.plots), before);
  G.harvestAll(s);
  s.plots = farm().plots;
  a.equal(G.weedingAvailable(s), true);
});
test("all eligible ripe crops in Harvest All get exactly 20 percent with integer fifth credits once", () => {
  const s = farm();
  complete(s);
  a.equal(G.harvestAll(s).plots, 25);
  a.equal(s.inventory.carrot, 60);
  a.equal(s.weedingCredits.carrot, 0);
  a.equal(s.weedingHarvest, null);
  a.equal(G.harvestAll(s).plots, 0);
  a.equal(s.inventory.carrot, 60);
  a.ok(s.plots.every((p) => !p));
});
test("individual harvest activity includes all originally ripe plants, survives refresh and excludes new/unripe crops", () => {
  const s = farm();
  s.plots[24].age = 0;
  complete(s);
  s.plots[23] = null;
  s.seeds.carrot = 1;
  G.plan(s, 23, "carrot");
  G.plantPlan(s);
  s.plots[23].age = 3;
  G.harvest(s, 0);
  a.equal(s.weedingHarvest.remaining.length, 22);
  a.equal(s.plots[24].weedingBonus, undefined);
  a.equal(s.plots[23].weedingBonus, undefined);
  const r = G.recover(JSON.stringify(s));
  a.deepEqual(r.weedingHarvest, s.weedingHarvest);
  for (let i = 1; i < 23; i++) G.harvest(r, i);
  a.equal(r.weedingHarvest, null);
  a.equal(r.inventory.carrot, 46 + Math.floor(46 * 0.2));
  a.equal(r.weedingCredits.carrot, 1);
  r.plots[24].age = 3;
  G.harvest(r, 24);
  G.harvest(r, 23);
  a.equal(r.inventory.carrot, 59);
  a.equal(r.weedingCredits.carrot, 1);
});
test("finish and End Day consume only unused event bonus, not normal crops or fractional credits", () => {
  for (const finish of [(s) => G.finishBonusHarvest(s), (s) => G.endDay(s)]) {
    const s = farm();
    complete(s);
    G.harvest(s, 0);
    const cash = s.cash,
      inv = structuredClone(s.inventory),
      credit = structuredClone(s.weedingCredits);
    finish(s);
    a.equal(s.weedingHarvest, null);
    a.ok(s.plots.filter(Boolean).every((p) => !p.weedingBonus));
    a.equal(s.cash, cash);
    a.deepEqual(s.inventory, inv);
    a.deepEqual(s.weedingCredits, credit);
  }
});
test("repeat crops consume one bonus, normal repeat yields and fractional credits remain intact", () => {
  const s = farm();
  s.plots = Array(25).fill(null);
  s.plots[0] = { id: "beans", age: 3, left: 2, watered: false, quality: 100 };
  s.weedingCredits.beans = 4;
  complete(s);
  a.equal(G.harvestAmount(s, 0), 2);
  G.harvest(s, 0);
  a.equal(s.inventory.beans, 2);
  a.equal(s.plots[0].weedingBonus, undefined);
  a.equal(s.weedingCredits.beans, 0);
  s.plots[0].age = 3;
  G.harvest(s, 0);
  a.equal(s.inventory.beans, 3);
  a.equal(s.plots[0].left, 0);
});
test("old farms, earned legacy bonus and malformed optional lesson recover without resetting progress", () => {
  const s = farm(12);
  s.cash = 123.45;
  s.inventory.corn = 19;
  s.plots[0].weedingBonus = true;
  delete s.weedingLesson;
  delete s.weedingHarvest;
  s.gardenWeeding = { day: 10, pulled: [0, 1, 2, 3, 4, 5] };
  const r = G.recover(JSON.stringify(s));
  a.equal(r.cash, 123.45);
  a.equal(r.inventory.corn, 19);
  a.equal(r.plots[0].weedingBonus, true);
  a.equal(r.weedingLesson.completedCycle, 2);
  s.weedingLesson = {
    version: 1,
    completedCycle: Infinity,
    nextType: "evil",
    session: { cycle: 2, seed: "bad" },
  };
  const a2 = G.recover(JSON.stringify(s));
  a.equal(a2.cash, 123.45);
  a.equal(a2.inventory.corn, 19);
  a.equal(a2.weedingLesson.session, null);
  a.equal(a2.weedingLesson.nextType, "math");
});
test("no planted crops cannot begin; incorrect/duplicate selections cannot award or change inventory", () => {
  const s = farm();
  s.plots.fill(null);
  a.equal(G.weedingAvailable(s), false);
  a.throws(() => G.startWeeding(s));
  s.plots = farm().plots;
  G.startWeeding(s, 133);
  a.throws(() => G.pullWeed(s, 4));
  a.throws(() => G.pullWeed(s, -1));
  const q = L.questions(s.weedingLesson.session),
    wrong = q.findIndex((x) => !x.correct);
  const result = G.pullWeed(s, wrong);
  if (result.kind !== "complete")
    a.equal(G.pullWeed(s, wrong).kind, "unchanged");
  else a.throws(() => G.pullWeed(s, wrong));
  a.deepEqual(s.inventory, {});
});
test("an opportunity stays open through its five-day window, interrupted sessions expire without accumulated rewards", () => {
  const s = farm(19, 4);
  G.startWeeding(s, 42);
  s.weedingLesson.session.round = 1;
  s.weedingLesson.session.mistakes = 2;
  G.endDay(s);
  a.equal(G.farmDay(s), 20);
  a.equal(G.weedingAvailable(s), true);
  const r = G.recover(JSON.stringify(s));
  a.equal(r.weedingLesson.session, null);
  G.startWeeding(r, 52);
  a.equal(r.weedingLesson.session.round, 0);
  a.equal(r.weedingLesson.session.cycle, 4);
  a.equal(r.weedingLesson.session.roundCount, 3);
  a.ok(r.plots.every((p) => !p.weedingBonus));
  G.endDay(r);
  a.equal(G.farmDay(r), 21);
  a.equal(G.weedingStatus(r).cycle, 4);
  a.equal(G.startWeeding(r, 53).seed, 52);
});
test("multiple completed rounds and active harvest survive primary or backup save recovery without changing market money/history", () => {
  const s = farm(15, 4);
  s.cash = 87.25;
  s.customerHistory = {};
  s.marketOpen = true;
  s.marketElapsedMs = 45000;
  G.startWeeding(s, 10);
  s.weedingLesson.session.round = 2;
  s.weedingLesson.session.mistakes = 2;
  const raw = JSON.stringify(s),
    r = G.recover("{bad", raw);
  a.equal(r.cash, s.cash);
  a.equal(r.marketElapsedMs, 45000);
  a.equal(r.marketOpen, true);
  a.deepEqual(r.weedingLesson, s.weedingLesson);
  complete(r);
  G.harvest(r, 0);
  const b = G.recover("{bad", JSON.stringify(r));
  a.deepEqual(b.weedingHarvest, r.weedingHarvest);
  a.deepEqual(b.weedingCredits, r.weedingCredits);
  a.equal(b.cash, s.cash);
  a.equal(b.marketElapsedMs, 45000);
});
test("fractional bonus credits survive unbonused harvests and future cycles until whole produce is earned", () => {
  const s = farm();
  s.plots = Array(25).fill(null);
  s.plots[0] = { id: "beans", age: 3, left: 2, quality: 100, watered: false };
  for (let cycle = 1; cycle <= 5; cycle++) {
    const day = cycle * 5;
    s.season = Math.floor((day - 1) / 20) + 1;
    s.day = ((day - 1) % 20) + 1;
    s.plots[0] = { id: "beans", age: 3, left: 2, quality: 100, watered: false };
    complete(s, cycle + 5);
    G.harvest(s, 0);
    const copy = G.recover(JSON.stringify(s));
    a.equal(copy.weedingCredits.beans || 0, cycle % 5);
    a.equal(s.inventory.beans, cycle + Math.floor(cycle / 5));
  }
});
test("advanced math includes decimal multiplication only after a whole-number multiplication milestone", () => {
  let decimal = false;
  for (let seed = 1; seed < 80; seed++) {
    const s = farm(5, 6);
    G.startWeeding(s, seed);
    decimal ||= L.questions(s.weedingLesson.session).some(
      (q) => q.original.includes(".") && q.original.includes("×"),
    );
  }
  a.ok(decimal);
});
