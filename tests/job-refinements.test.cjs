const { test } = require("node:test"),
  A = require("node:assert/strict");
const G = require("../src/game"),
  J = require("../src/neighborhood-jobs"),
  V = require("../src/job-vocabulary"),
  L = require("../src/job-lawn"),
  R = require("../src/job-records");
const { solveLawn } = require("./job-test-helpers.cjs");
function start(id, mode = "growing", seed = 97) {
  const s = G.newGame();
  G.chooseExperience(s, mode);
  J.start(s, id, 0, seed);
  return s;
}
function solve(s, catchLimit = Infinity) {
  const a = s.jobs.active,
    d = a.data;
  if (a.id === "tidy" && a.rulesVersion >= 3) return solveLawn(s);
  if (a.id === "words") {
    for (const w of d.words) J.action(s, { type: "word", path: d.paths[w] });
  } else if (a.id === "labels") {
    while (!a.won) {
      const slot = a.rulesVersion >= 3 ? d.slots.indexOf(null) : d.slots.length,
        v = d.words[d.round][slot],
        tile = d.tiles.findIndex((x, i) => x === v && !d.slots.includes(i));
      J.action(s, { type: "letter", tile, slot });
    }
  } else if (a.id === "stacks") {
    for (const [from, to] of d.solution) {
      if (a.won) break;
      J.action(s, { type: "stack", from, to });
    }
  } else if (a.id === "packing") {
    while (!a.won) {
      const item = J.packingFronts(a).find((i) => i >= 0);
      J.action(s, { type: "pack", item, target: d.items[item] });
    }
  } else if (a.id === "match") {
    while (a.score < d.target) {
      const [from, to] = J.moves(d.grid)[0];
      J.action(s, { type: "swap", from, to });
    }
    J.tick(s, J.clockLimit(a) - a.elapsed);
  } else if (a.id === "catch") {
    for (let i = 0; i < 40; i++) {
      const c = J.carrot(a, i),
        t = J.catchTime(a, c);
      if (t > 60000) break;
      J.action(s, {
        type: "basket",
        x: a.score >= catchLimit ? 0 : J.carrotPose(a, c, t).x,
      });
      J.tick(s, t - a.elapsed);
    }
    J.tick(s, 60000 - a.elapsed);
  } else
    for (let item = 0; item < d.items.length && !a.won; item++) {
      const kind = d.items[item].kind;
      if (
        (a.id === "weeds" && kind !== "weed") ||
        (a.id === "tomatoes" && kind !== "ripe")
      )
        continue;
      J.action(s, { type: "chore", item, target: kind });
    }
  A.ok(a.won && a.ended, a.id);
}
test("free letters fill arbitrary slots, swap from tray or slot, remove without shifting, and only complete exact full words", () => {
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed < 60; seed++) {
      const s = start("labels", mode, seed),
        a = s.jobs.active,
        d = a.data;
      A.ok(d.slots.every((x) => x === null));
      J.action(s, { type: "letter", tile: 0, slot: d.slots.length - 1 });
      A.equal(d.slots.at(-1), 0);
      A.equal(a.score, 0);
      J.action(s, { type: "letter", tile: 1, slot: 0 });
      J.action(s, { type: "letter", tile: 0, slot: 0 });
      A.equal(d.slots[0], 0);
      A.equal(d.slots.at(-1), 1);
      J.action(s, { type: "letter", tile: 2, slot: 0 });
      A.equal(d.slots[0], 2);
      A.ok(!d.slots.includes(0));
      J.action(s, { type: "returnLetter", tile: 1 });
      A.equal(d.slots.at(-1), null);
      J.action(s, { type: "removeLetter", slot: 0 });
      A.equal(d.slots[0], null);
      A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
      solve(s);
      A.ok(a.won);
    }
});
test("vocabulary has 100+ unique curated words, short illustrated early words, valid word search grids and exact tile multisets over 1000 seeds", () => {
  A.ok(V.all.length >= 100);
  A.equal(new Set(V.all).size, V.all.length);
  A.ok(V.little.every((w) => w.length <= 4 && V.clues[w]));
  let longest = false;
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed <= 500; seed++)
      for (const id of ["words", "labels"]) {
        const s = start(id, mode, seed),
          a = s.jobs.active,
          d = a.data;
        A.ok(V.valid(a.wordPlan, mode, id));
        if (id === "words")
          for (const w of d.words) {
            A.equal(d.paths[w].map((i) => d.grid[i]).join(""), w);
            if (w.length === 10) longest = true;
          }
        else
          A.equal(
            d.tiles.slice().sort().join(""),
            [...d.words[0]].sort().join(""),
          );
        A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
      }
  A.ok(longest);
});
test("shared recent vocabulary history rotates sessions without erasing farms or active plans on reload", () => {
  for (const mode of ["little", "growing"]) {
    const s = start("words", mode);
    const seen = new Set(s.jobs.active.wordPlan);
    for (let round = 0; round < 5; round++) {
      J.quit(s);
      J.start(s, round % 2 ? "words" : "labels", 0, round + 3);
      for (const w of s.jobs.active.wordPlan) {
        A.ok(!seen.has(w), w);
        seen.add(w);
      }
      const r = G.recover(JSON.stringify(s));
      A.deepEqual(r.jobs, s.jobs);
    }
    A.equal(s.cash, 0);
    A.ok(seen.size >= 14);
  }
});
test("mower reaches all connected lawn cells without teleporting or crossing obstacles; raking and three compost piles are all required", () => {
  for (const mode of ["little", "growing"]) {
    const s = start("tidy", mode),
      a = s.jobs.active,
      d = a.data;
    const original = structuredClone(d);
    A.equal(J.action(s, { type: "mow", cell: d.cells.length - 1 }), false);
    A.equal(J.action(s, { type: "rake", cell: 1 }), false);
    A.deepEqual(d, original);
    A.equal(J.action(s, { type: "compost", pile: 0 }), false);
    for (const cell of require("./job-test-helpers.cjs").lawnRoute(d)) {
      if (d.stage !== "mow") break;
      A.equal(J.action(s, { type: "mow", cell }), true);
    }
    A.equal(d.cells.filter((c) => c.cut).length, d.target);
    A.equal(a.won, false);
    A.throws(() => J.claim(s));
    A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
    for (let cell = 0; cell < d.cells.length; cell++) {
      if (d.cells[cell].blocked) {
        A.equal(J.action(s, { type: "rake", cell }), false);
        continue;
      }
      A.equal(J.action(s, { type: "rake", cell }), true);
      if (d.stage === "rake")
        A.equal(J.action(s, { type: "rake", cell }), false);
    }
    A.equal(d.stage, "compost");
    A.equal(
      d.piles.reduce((x, y) => x + y),
      d.target,
    );
    A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
    for (let pile = 0; pile < 2; pile++) {
      J.action(s, { type: "compost", pile });
      A.equal(a.won, false);
      A.equal(J.action(s, { type: "compost", pile }), false);
    }
    J.action(s, { type: "compost", pile: 2 });
    A.equal(a.won, true);
    A.ok(d.cells.filter((c) => !c.blocked).every((c) => c.cleared));
    J.claim(s, 0);
    A.equal(s.cash, 1);
  }
});
test("all ten jobs keep personal records per mode/settings, first $1 and improved $3 total, ties $1, persisted cooldown, no double claim", () => {
  for (const mode of ["little", "growing"])
    for (const { id } of J.catalog.filter(j=>!["hidden","sliding"].includes(j.id))) {
      const s = start(id, mode),
        a = s.jobs.active;
      J.tick(s, 10000);
      solve(s, id === "catch" ? a.data.target : Infinity);
      let result = J.result(s.jobs);
      A.equal(result.rewardCents, 100);
      A.equal(result.previousBest, null);
      A.equal(s.cash, 0);
      let pending = G.recover(JSON.stringify(s));
      A.deepEqual(pending.jobs, s.jobs);
      result = J.claim(s, 1000);
      A.equal(s.cash, 1);
      A.throws(() => J.claim(s, 1000));
      A.equal(J.available(s, id, 1000), 300000);
      const first = result.value;
      // Recreate the exact same puzzle/settings, then improve the appropriate metric.
      // A controlled replay of the same word plan compares identical settings;
      // recent-word rotation is independently exercised above.
      s.jobs.wordHistory[mode] = [];
      J.start(s, id, 301000, 97);
      if (id === "match")
        for (let i = 0; i < 20; i++) {
          const [from, to] = J.moves(s.jobs.active.data.grid)[0];
          J.action(s, { type: "swap", from, to });
        }
      if (!["match", "catch"].includes(id)) J.tick(s, 5000);
      solve(s);
      const key = J.recordSpec(s.jobs.active).key;
      A.equal(J.result(s.jobs).rewardCents, 300, id);
      const restored = G.recover(JSON.stringify(s));
      A.deepEqual(restored.jobs, s.jobs);
      result = J.claim(restored, 301000);
      A.equal(restored.cash, 4);
      A.equal(result.newBest, true);
      A.equal(result.rewardCents, 300);
      A.equal(J.available(restored, id, 301000), 300000);
      A.throws(() => J.claim(restored, 301000));
      restored.jobs.wordHistory[mode] = [];
      J.start(restored, id, 601001, 97);
      if (id === "match")
        for (let i = 0; i < 20; i++) {
          const [from, to] = J.moves(restored.jobs.active.data.grid)[0];
          J.action(restored, { type: "swap", from, to });
        }
      if (!["match", "catch"].includes(id)) J.tick(restored, 5000);
      solve(restored);
      A.equal(J.result(restored.jobs).rewardCents, 100);
      J.claim(restored, 601001);
      A.equal(restored.cash, 5);
      A.deepEqual(G.recover(JSON.stringify(restored)).jobs, restored.jobs);
      const other = start(id, mode === "little" ? "growing" : "little");
      A.notEqual(J.recordSpec(other.jobs.active).key, key);
      A.ok(first >= 0);
    }
});
test("version two unfinished jobs and version one farm progress retain exact puzzles, reward and original match duration", () => {
  for (const saved of require("./fixtures/pre-record-jobs.json")) {
    const s = G.initial();
    Object.assign(s, saved);
    s.dreamPurchases.ball = { owned: true, day: 1, season: 1, price: 100 };
    s.inventory.carrot = 12;
    const r = G.recover(JSON.stringify(s));
    A.equal(r.cash, 42.75);
    A.equal(r.inventory.carrot, 12);
    A.deepEqual(r.dreamPurchases, s.dreamPurchases);
    A.deepEqual(r.jobs.active, s.jobs.active);
    A.equal(
      J.clockLimit(r.jobs.active),
      s.jobs.active.id === "match"
        ? 120000
        : s.jobs.active.id === "catch"
          ? 60000
          : 0,
    );
  }
});
test("new match lasts 90 seconds, catching retains 60 seconds, chores stay untimed, and invalid record data cannot corrupt a farm", () => {
  for (const id of ["match", "catch"]) {
    const s = start(id),
      a = s.jobs.active;
    A.equal(J.clockLimit(a), id === "match" ? 90000 : 60000);
    J.tick(s, J.clockLimit(a) - 1);
    A.equal(a.ended, false);
    const r = G.recover(JSON.stringify(s));
    J.tick(r, 1);
    A.equal(r.jobs.active.ended, true);
    A.equal(r.cash, 0);
  }
  for (const id of ["weeds", "tomatoes", "tidy", "words", "labels", "stacks"]) {
    const s = start(id);
    J.tick(s, 120000);
    A.equal(s.jobs.active.ended, false);
    A.equal(J.clockLimit(s.jobs.active), 0);
  }
  const s = G.initial();
  s.cash = 123.45;
  s.jobs.records = {
    nonsense: { best: -1 },
    "weeds|little|v3|16": { best: "bad" },
  };
  s.jobs.wordHistory = { little: ["BAD", "SEED", null], growing: null };
  const r = G.recover(JSON.stringify(s));
  A.equal(r.cash, 123.45);
  A.deepEqual(r.jobs.records, {});
  A.deepEqual(r.jobs.wordHistory.little, ["SEED"]);
});

test("all twenty unfinished version two sessions can finish for the original $1 without changing prior farm balances", () => {
  for (const saved of require("./fixtures/pre-record-jobs.json")) {
    const s = G.initial();
    Object.assign(s, structuredClone(saved));
    const r = G.recover(JSON.stringify(s)),
      a = r.jobs.active;
    if (a.id === "labels")
      while (a.data.slots.length)
        J.action(r, { type: "removeLetter", slot: 0 });
    solve(r);
    A.ok(a.ended && a.won, a.id);
    A.equal(J.result(r.jobs).rewardCents, 100);
    const before = r.cash;
    J.claim(r, 1000);
    A.equal(r.cash, (Math.round(before * 100) + 100) / 100);
    A.equal(J.available(r, a.id, 1000), 300000);
  }
});

test("completion-time records use the displayed hundredth-second precision so a displayed tie never receives a hidden bonus", () => {
  const s = start("flowers", "little");
  J.tick(s, 10004);
  solve(s);
  J.claim(s, 1000);
  J.start(s, "flowers", 301000, 97);
  J.tick(s, 10001);
  solve(s);
  A.equal(J.result(s.jobs).value, 10000);
  A.equal(J.result(s.jobs).rewardCents, 100);
});

test("saved-job spoken instructions retain the original timing and yard rules", () => {
  const old = require("./fixtures/pre-record-jobs.json");
  for (const s of old) {
    const a = s.jobs.active;
    if (a.id === "match") A.match(J.instructions(a), /two minutes/);
    if (a.id === "tidy") A.match(J.instructions(a), /leaves and sticks/);
  }
  A.match(J.instructions(start("match").jobs.active), /ninety seconds/);
  A.match(J.instructions(start("tidy").jobs.active), /Mow the lawn/);
});
