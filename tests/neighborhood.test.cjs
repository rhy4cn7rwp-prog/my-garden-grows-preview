const { test } = require("node:test"),
  A = require("node:assert/strict");
const G = require("../src/game.js"),
  J = require("../src/neighborhood-jobs.js"),
  L = require("../src/garden-learning.js");
function farm(mode = "growing") {
  const s = G.newGame();
  G.chooseExperience(s, mode);
  return s;
}
function solve(s) {
  const a = s.jobs.active,
    d = a.data;
  switch (a.id) {
    case "hidden":
      J.action(s,{type:"pictureBegin"});
      for(const item of d.targets)J.action(s,{type:"findObject",item});
      break;
    case "sliding":
      J.action(s,{type:"pictureBegin"});
      for(const cell of d.solution){if(a.ended)break;J.action(s,{type:"slide",cell});}
      break;
    case "words":
      for (const w of d.words) J.action(s, { type: "word", path: d.paths[w] });
      break;
    case "packing":
      d.items.forEach((target, item) =>
        J.action(s, { type: "pack", item, target }),
      );
      break;
    case "stacks":
      for (const [from, to] of d.solution) {
        if (a.won) break;
        A.equal(J.action(s, { type: "stack", from, to }), true);
      }
      break;
    case "labels":
      while (!a.won) {
        const next = d.words[d.round][a.rulesVersion>=3?d.slots.indexOf(null):d.slots.length],
          tile = d.tiles.findIndex(
            (v, i) => v === next && !d.slots.includes(i),
          );
        J.action(s, { type: "letter", tile });
      }
      break;
    case "match":
      while (a.score < d.target) {
        const [from, to] = J.moves(d.grid)[0];
        J.action(s, { type: "swap", from, to });
      }
      J.tick(s, 120000 - a.elapsed);
      break;
    case "catch":
      for (let i = 0; i < Math.ceil(60000 / d.launchEvery); i++) {
        const c = J.carrot(a, i),
          landing = c.launch + c.flight;
        if (landing > 60000) break;
        J.action(s, { type: "basket", x: c.end });
        J.tick(s, landing - a.elapsed);
      }
      J.tick(s, 60000 - a.elapsed);
      break;
    case "tidy":
      require('./job-test-helpers.cjs').solveLawn(s);
      break;
    default:
      for (let item = 0; item < d.items.length && !a.won; item++) {
        const k = d.items[item].kind;
        if (
          (a.id === "weeds" && k !== "weed") ||
          (a.id === "tomatoes" && k !== "ripe")
        )
          continue;
        J.action(s, { type: "chore", item, target: k });
      }
  }
  A.equal(a.won, true, a.id);
  A.equal(a.ended, true, a.id);
}
for (const mode of ["little", "growing"])
  for (const job of J.catalog)
    test(`${mode}: ${job.name} completes, restores, pays exactly $1 once and has independent persisted cooldown`, () => {
      const s = farm(mode);
      J.start(s, job.id, 1000, 123);
      solve(s);
      const r = G.recover(JSON.stringify(s));
      A.deepEqual(r.jobs, s.jobs);
      const result = J.claim(r, 1000);
      A.equal(result.id, job.id);
      A.equal(r.cash, 1);
      A.equal(J.available(r, job.id, 1000), 300000);
      A.equal(
        J.available(r, J.catalog.find((j) => j.id !== job.id).id, 1000),
        0,
      );
      A.throws(() => J.claim(r, 1000));
      A.throws(() => J.start(r, job.id, 300999));
      A.equal(r.cash, 1);
      const saved = G.recover("{bad", JSON.stringify(r));
      A.equal(saved.cash, 1);
      A.equal(saved.jobs.cooldowns[job.id], 301000);
      A.equal(J.available(saved, job.id, 301000), 0);
      J.start(saved, job.id, 301000, 44);
      A.equal(saved.jobs.active.elapsed, 0);
    });
test("1000 randomized Stack Sort arrangements have reversible legal solutions; Undo and Restart retain puzzle and no payouts", () => {
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed <= 500; seed++) {
      const s = farm(mode);
      J.start(s, "stacks", 0, seed);
      const a = s.jobs.active,
        initial = structuredClone(a.data.crates),
        [from, to] = a.data.solution[0];
      J.action(s, { type: "stack", from, to });
      if (!a.won) {
        J.action(s, { type: "undo" });
        A.deepEqual(a.data.crates, initial);
        J.action(s, { type: "restart" });
        A.deepEqual(a.data.crates, initial);
      } else {
        J.quit(s);
        J.start(s, "stacks", 0, seed);
      }
      solve(s);
      A.equal(s.cash, 0);
    }
});
test("word search puzzles always contain their words, short easy direction for Little, random layouts", () => {
  const seen = new Set();
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed <= 100; seed++) {
      const s = farm(mode);
      J.start(s, "words", 0, seed);
      const d = s.jobs.active.data;
      seen.add(d.grid.join(""));
      for (const w of d.words) {
        A.equal(d.paths[w].map((i) => d.grid[i]).join(""), w);
        if (mode === "little") {
          const delta = d.paths[w][1] - d.paths[w][0];
          A.ok([1, d.size].includes(delta));
          A.ok(w.length <= 4);
        }
      }
    }
  A.ok(seen.size > 100);
});
test("match-four rejects 3/diagonal/nonadjacent swaps, keeps playable boards, waits exactly 90000 active ms and restores clock/board", () => {
  A.deepEqual(J.matches([0, 0, 0, 1, 1, 2, 1, 2, 0], 3), []);
  A.deepEqual(
    J.matches([0, 1, 2, 3, 0, 2, 3, 1, 2, 0, 1, 2, 3, 1, 0, 3], 4),
    [],
  );
  for (let seed = 1; seed <= 50; seed++) {
    const s = farm();
    J.start(s, "match", 0, seed);
    const a = s.jobs.active;
    A.equal(J.matches(a.data.grid).length, 0);
    for (let k = 0; k < 8; k++) {
      const m = J.moves(a.data.grid)[0];
      A.ok(m);
      J.action(s, { type: "swap", from: m[0], to: m[1] });
      A.equal(J.matches(a.data.grid).length, 0);
    }
    A.ok(a.score >= a.data.target);
    J.tick(s, 89999);
    A.equal(a.ended, false);
    A.throws(() => J.claim(s));
    const r = G.recover(JSON.stringify(s));
    A.equal(r.jobs.active.elapsed, 89999);
    A.deepEqual(r.jobs.active.data.grid, a.data.grid);
    J.tick(r, 1);
    A.equal(r.jobs.active.won, true);
    J.claim(r, 0);
    A.equal(r.cash, 1);
  }
});
test("failed timed round/quit has no payout or cooldown, best score is retained, retry keeps no clock advantage", () => {
  for (const id of ["match", "catch"]) {
    const s = farm();
    J.start(s, id, 0, 5);
    if (id === "match") {
      const [from, to] = J.moves(s.jobs.active.data.grid)[0];
      J.action(s, { type: "swap", from, to });
    }
    J.tick(s, J.duration[id]);
    A.equal(s.jobs.active.ended, true);
    if (!s.jobs.active.won) A.throws(() => J.claim(s));
    A.equal(s.cash, 0);
    A.deepEqual(s.jobs.cooldowns, {});
    A.ok(s.jobs.best[id] >= 0);
    J.quit(s);
    J.start(s, id, 1000, 6);
    A.equal(s.jobs.active.elapsed, 0);
    A.equal(J.available(s, id, 1000), 0);
  }
});
test("wrong sorting/healthy plants/unripe tomatoes leave progress and farm unchanged; all chore targets require several actions", () => {
  for (const id of ["packing", "weeds", "tomatoes", "flowers", "tidy"]) {
    const s = farm("little");
    J.start(s, id, 0, 1);
    const a = s.jobs.active,
      old = JSON.stringify(a.data);
    let e;
    if (id === "packing") e = { type: "pack", item: 0, target: "nothing" };
    if (id === "weeds")
      e = {
        type: "chore",
        item: a.data.items.findIndex((v) => v.kind === "plant"),
      };
    if (id === "tomatoes")
      e = {
        type: "chore",
        item: a.data.items.findIndex((v) => v.kind === "green"),
      };
    if (id === "tidy") e = { type: "mow", cell: 10 };
    if (e) {
      A.equal(J.action(s, e), false);
      A.equal(JSON.stringify(a.data), old);
    }
    A.ok((a.data.target || a.data.items.length) >= 4);
    A.equal(s.cash, 0);
    A.equal(a.won, false);
  }
});
test("letter tiles match exact answer multisets; hints/remove and mode changes preserve active puzzle", () => {
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed < 30; seed++) {
      const s = farm(mode);
      J.start(s, "labels", 0, seed);
      const a = s.jobs.active;
      A.equal(
        [...a.data.words[0]].sort().join(""),
        a.data.tiles.slice().sort().join(""),
      );
      J.action(s, { type: "hint" });
      J.action(s, { type: "letter", tile: 0 });
      if (!a.ended && a.data.slots.length)
        J.action(s, { type: "removeLetter", slot: 0 });
      const saved = structuredClone(a);
      G.chooseExperience(s, mode === "little" ? "growing" : "little");
      A.deepEqual(s.jobs.active, saved);
      A.deepEqual(G.recover(JSON.stringify(s)).jobs.active, saved);
    }
});
test("new economy only: starter once, $20 missing equipment with existing cart intact, no sales dead ends", () => {
  const s = farm("little");
  A.equal(s.cash, 0);
  A.equal(s.starterClaimed, false);
  G.claimStarter(s);
  A.deepEqual(s.seeds, { carrot: 3, beans: 2, lettuce: 2 });
  A.throws(() => G.claimStarter(s));
  const r = G.recover(JSON.stringify(s));
  A.throws(() => G.claimStarter(r));
  r.inventory.carrot = r.display.carrot = 3;
  A.throws(() => G.openMarket(r));
  for (let i = 0; i < 20; i++) {
    const now = i * 300001;
    J.start(r, "flowers", now, i + 1);
    solve(r);
    J.claim(r, now);
  }
  A.equal(r.cash, 20);
  r.supcart = { canopy: 1 };
  A.equal(G.marketSetupTotal(r), 20);
  G.purchaseMarketSetup(r);
  A.equal(r.cash, 0);
  A.equal(r.cashRegister, true);
  A.equal(r.owned.table, 1);
  A.equal(r.owned.scale, 1);
  A.equal(r.bagCount, 10);
  A.deepEqual(r.supcart, { canopy: 1 });
  A.equal(G.marketSetupTotal(r), 0);
  A.throws(() => G.purchaseMarketSetup(r));
  G.openMarket(r);
  A.equal(r.marketOpen, true);
  A.equal(r.standMode, "owned");
  A.equal(J.available(r, "words", 1), 0);
});
test("legacy saves retain balances, rewards, garden, inventory, equipment, customers and eligibility", () => {
  const s = G.initial();
  s.cash = 987.65;
  s.seeds.carrot = 8;
  s.inventory.carrot = s.display.carrot = 12;
  s.owned.table = 1;
  s.bagCount = 20;
  G.openMarket(s);
  G.newCustomer(s, "Maya");
  const customer = structuredClone(s.customer);
  delete s.newEconomy;
  delete s.learningExperience;
  delete s.experienceChosen;
  delete s.starterClaimed;
  delete s.jobs;
  const r = G.recover(JSON.stringify(s));
  A.equal(r.cash, 987.65);
  A.deepEqual(r.seeds, s.seeds);
  A.deepEqual(r.inventory, s.inventory);
  A.deepEqual(r.customer, customer);
  A.equal(r.newEconomy, false);
  A.equal(r.learningExperience, "growing");
  A.equal(r.experienceChosen, true);
  A.equal(r.marketOpen, true);
  A.equal(r.owned.table, 1);
  const broken = G.recover(
    JSON.stringify({ ...s, jobs: { version: 1, active: { id: "bad" } } }),
  );
  A.equal(broken.cash, s.cash);
  A.equal(broken.marketOpen, true);
});
test("Little Gardener has no academic difficulty escalation and automatic sales preserve money/bags/history/arithmetic support", () => {
  const s = G.initial();
  G.chooseExperience(s, "little");
  s.dreamPurchaseCount = 20;
  s.day = 5;
  s.plots[0] = { id: "carrot", age: 0, left: 0, quality: 100, watered: false };
  G.startWeeding(s, 4);
  A.equal(s.weedingLesson.session.type, "nature");
  A.equal(s.weedingLesson.session.level, 0);
  A.equal(s.weedingLesson.session.roundCount, 1);
  A.ok(
    L.questions(s.weedingLesson.session).every(
      (q) => !/[0-9=]/.test(q.original),
    ),
  );
  s.owned.scale = 1;
  s.inventory.carrot = s.display.carrot = 10;
  s.bagCount = 5;
  G.openMarket(s);
  G.newCustomer(s, "Maya");
  A.equal(Object.keys(s.customer.want).length, 1);
  A.ok(Object.values(s.customer.want).every((n) => n <= 3));
  G.greet(s);
  s.basket = { ...s.customer.want };
  const total = G.totalOrder(s),
    cash = s.cash,
    practice = structuredClone([s.mathPractice, s.changePractice]);
  G.autoPayLittle(s);
  A.equal(s.cash, cash + total);
  A.equal(s.bagCount, 4);
  A.equal(s.step, "thanks");
  A.deepEqual([s.mathPractice, s.changePractice], practice);
  A.throws(() => G.autoPayLittle(s));
  A.equal(s.cash, cash + total);
});
test("switching experience safely completes an existing paying customer without resetting order or growth", () => {
  const s = G.initial();
  s.inventory.carrot = s.display.carrot = 10;
  s.bagCount = 5;
  G.openMarket(s);
  G.newCustomer(s, "Maya");
  G.greet(s);
  s.basket = { ...s.customer.want };
  G.ring(s, G.totalOrder(s));
  const before = structuredClone(s.customer);
  G.chooseExperience(s, "little");
  A.deepEqual(s.customer, before);
  const r = G.recover(JSON.stringify(s));
  G.autoPayLittle(r);
  A.equal(r.step, "thanks");
  A.equal(r.bagCount, 4);
});
module.exports = { solve };

test("an actual pre-Phase-9 factory save retains every old farm field and active checkout; no retroactive economy gate", () => {
  const old = require("./fixtures/pre-phase9-farm.json"),
    r = G.recover(JSON.stringify(old));
  for (const [key, value] of Object.entries(old)) {
    if (key === "customer") {
      for (const [k, v] of Object.entries(value))
        A.deepEqual(r.customer[k], v, k);
    } else A.deepEqual(r[key], value, key);
  }
  A.equal(r.cash, 877.65);
  A.equal(r.newEconomy, false);
  A.equal(r.learningExperience, "growing");
  A.equal(r.experienceChosen, true);
  A.equal(r.marketOpen, true);
  A.equal(r.step, "pay");
  const total = G.totalOrder(r);
  G.finish(r);
  A.equal(r.cash, 877.65 + total);
  A.equal(r.bagCount, 11);
  A.equal(r.plots[0].weedingBonus, true);
  A.throws(() => G.finish(r));
});

test("switching to Little Gardener converts an unfinished academic weed round to pictures without losing cleared answers or completed rounds", () => {
  const s = G.initial();
  s.day = 5;
  s.dreamPurchaseCount = 5;
  s.plots[0] = { id: "carrot", age: 0, left: 0, quality: 100, watered: false };
  G.startWeeding(s, 123);
  s.weedingLesson.session.round = 1;
  const a = s.weedingLesson.session,
    choices = L.questions(a).map((q) => q.correct);
  const wrong = choices.findIndex((v) => !v);
  a.removed = [wrong];
  if (choices.filter((v) => !v).length === 1) a.removed = [];
  const before = a.removed.slice();
  G.chooseExperience(s, "little");
  A.equal(a.type, "nature");
  A.equal(a.round, 1);
  A.equal(a.roundCount, 2);
  A.deepEqual(
    L.questions(a).map((q) => q.correct),
    choices,
  );
  A.deepEqual(a.removed, before);
  const r = G.recover(JSON.stringify(s));
  A.deepEqual(r.weedingLesson.session, a);
  G.chooseExperience(r, "growing");
  A.equal(r.weedingLesson.session.type, "nature");
  while (r.weedingLesson.session) {
    const q = L.questions(r.weedingLesson.session),
      i = q.findIndex(
        (v, i) => !v.correct && !r.weedingLesson.session.removed.includes(i),
      );
    G.pullWeed(r, i);
  }
  A.equal(r.plots[0].weedingBonus, true);
  A.equal(r.cash, 50);
});
