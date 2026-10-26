const { test } = require("node:test"),
  A = require("node:assert/strict");
const G = require("../src/game.js"),
  J = require("../src/neighborhood-jobs.js");
const old = require("./fixtures/pre-playtest-jobs.json");
function start(id, mode = "growing", seed = 44) {
  const s = G.newGame();
  G.chooseExperience(s, mode);
  J.start(s, id, 1000, seed);
  return s;
}
test("all 20 pre-playtest job sessions retain exact old state, wallet and replay rules", () => {
  for (const saved of old) {
    const restored = J.recover(saved.jobs),
      a = restored.active;
    A.ok(a, saved.jobs.active.id);
    A.equal(a.rulesVersion, 1);
    const { rulesVersion, ...rest } = a;
    A.deepEqual(rest, saved.jobs.active);
    A.equal(saved.cash, 12.34);
    const s = G.initial();
    Object.assign(s, saved);
    const loaded = G.recover(JSON.stringify(s));
    A.equal(loaded.cash, saved.cash);
    A.deepEqual(loaded.jobs, restored);
  }
});
test("new flower garden has 36 deterministic mixed plots; all and only its flowers finish the job", () => {
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed < 60; seed++) {
      const s = start("flowers", mode, seed),
        a = s.jobs.active,
        plots = J.flowerPlots(a);
      A.equal(plots.length, 36);
      A.equal(
        plots.filter((x) => x.kind === "flower").length,
        mode === "little" ? 9 : 12,
      );
      A.deepEqual(J.flowerPlots(a), plots);
      A.equal(
        new Set(plots.filter((x) => x.kind === "flower").map((x) => x.item))
          .size,
        a.data.target,
      );
      for (const { item } of plots.filter((x) => x.kind === "flower")) {
        A.equal(J.action(s, { type: "chore", item }), true);
        if (!a.ended) A.equal(J.action(s, { type: "chore", item }), false);
      }
      A.ok(a.won && a.ended);
      A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
      J.claim(s, 1000);
      A.equal(s.cash, 1);
      A.throws(() => J.claim(s, 1000));
    }
});
test("three packing lanes keep independent queues and speed, reject reaching behind the front", () => {
  for (const mode of ["little", "growing"]) {
    const s = start("packing", mode),
      a = s.jobs.active;
    A.deepEqual(J.packingFronts(a), [0, 1, 2]);
    A.equal(
      J.action(s, { type: "pack", item: 3, target: a.data.items[3] }),
      false,
    );
    J.tick(s, 2000);
    const p = J.packingProgress(a, 0);
    A.equal(p, 2000 / (mode === "little" ? 6500 : 4000));
    A.equal(
      J.action(s, { type: "pack", item: 0, target: "not-a-crop" }),
      false,
    );
    A.equal(
      J.action(s, { type: "pack", item: 0, target: a.data.items[0] }),
      true,
    );
    A.deepEqual(J.packingFronts(a), [3, 1, 2]);
    A.equal(J.packingProgress(a, 0), 0);
    A.equal(J.packingProgress(a, 1), p);
    A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
    while (!a.ended) {
      const i = J.packingFronts(a).find((i) => i >= 0);
      A.equal(
        J.action(s, { type: "pack", item: i, target: a.data.items[i] }),
        true,
      );
    }
    A.ok(a.won);
  }
});
test("carrot collision uses visible basket opening, edge tolerance and big carrot size; never double catches", () => {
  for (const mode of ["little", "growing"])
    for (let i = 0; i < 14; i++) {
      const s = start("catch", mode),
        a = s.jobs.active,
        c = J.carrot(a, i),
        at = J.catchTime(a, c),
        p = J.carrotPose(a, c, at);
      A.ok(Math.abs(p.y - 0.78) < 0.001);
      A.ok(at < c.launch + c.flight);
      // Skip earlier launches with basket at the edge so only this carrot is measured.
      J.action(s, { type: "basket", x: 0 });
      J.tick(s, at - 1);
      const before = a.score;
      J.action(s, { type: "basket", x: p.x });
      J.tick(s, 1);
      A.ok(a.data.caught.includes(i));
      A.equal(a.score - before, c.big ? 2 : 1);
      J.tick(s, Math.min(60000 - a.elapsed, c.launch + c.flight - at + 10));
      A.equal(a.data.caught.filter((n) => n === i).length, 1);
      A.ok(!a.data.missed.includes(i));
      const radius = a.data.width * 0.41 + (c.big ? 0.05 : 0.035);
      a.data.basket = p.x + radius - 0.000001;
      A.equal(J.canCatch(a, c), true);
      a.data.basket = p.x + radius + 0.000001;
      A.equal(J.canCatch(a, c), false);
    }
  const s = start("catch"),
    a = s.jobs.active;
  J.action(s, { type: "basket", x: 0 });
  J.tick(s, 60000);
  A.equal(a.score, 0);
  A.ok(a.data.missed.length > 20);
  A.equal(a.won, false);
});
test("match-five, cascades and consecutive quick matches earn explicit replayable bonuses without changing two minute rule", () => {
  A.equal(J.matchPoints(4), 40);
  A.equal(J.matchPoints(5), 65);
  A.equal(J.matchPoints(6), 90);
  A.equal(J.matchPoints(4, 1), 60);
  let sawFive = false,
    sawCascade = false;
  for (let seed = 1; seed <= 70; seed++) {
    const s = start("match", "growing", seed),
      a = s.jobs.active;
    for (let i = 0; i < 4; i++) {
      const [from, to] = J.moves(a.data.grid)[0],
        before = a.score;
      A.equal(J.action(s, { type: "swap", from, to }), true);
      const frames = a.data.bursts;
      A.equal(
        frames.reduce((n, b) => n + b.points, 0),
        a.score - before,
      );
      A.equal(a.data.chain, i + 1);
      for (const b of frames) {
        A.deepEqual(J.matches(b.grid), b.cells);
        if (b.cells.length >= 5) sawFive = true;
        if (b.cascade) sawCascade = true;
        A.equal(
          b.points,
          J.matchPoints(b.cells.length, b.cascade) + (b.cascade ? 0 : i * 10),
        );
      }
      A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
    }
    J.tick(s, 15001);
    const [from, to] = J.moves(a.data.grid)[0];
    J.action(s, { type: "swap", from, to });
    A.equal(a.data.chain, 1);
    A.equal(a.ended, false);
    J.tick(s, 120000 - a.elapsed);
    A.equal(a.ended, true);
  }
  A.ok(sawFive && sawCascade);
});
test("row chores reject healthy and unripe plants, retain partial progression on reload, pay only once", () => {
  for (const id of ["weeds", "tomatoes"])
    for (const mode of ["little", "growing"]) {
      const s = start(id, mode),
        a = s.jobs.active,
        wanted = id === "weeds" ? "weed" : "ripe";
      const bad = a.data.items.findIndex((x) => x.kind !== wanted);
      A.equal(J.action(s, { type: "chore", item: bad }), false);
      A.equal(a.score, 0);
      const correct = a.data.items
        .map((x, i) => (x.kind === wanted ? i : -1))
        .filter((i) => i >= 0);
      J.action(s, { type: "chore", item: correct[0] });
      A.equal(J.action(s, { type: "chore", item: correct[0] }), false);
      A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
      for (const item of correct.slice(1, a.data.target))
        J.action(s, { type: "chore", item });
      A.ok(a.won);
      J.claim(s, 1000);
      A.equal(s.cash, 1);
      A.equal(J.available(s, id, 1000), 300000);
    }
});

test("touch actions activate once without compatibility click; next intentional tap and keyboard remain available", () => {
  const vm = require("node:vm"),
    fs = require("node:fs"),
    handlers = {};
  const c = {
    Date,
    document: {
      addEventListener: (name, fn) => (handlers[name] ??= []).push(fn),
    },
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../src/touch-actions.js"), "utf8") +
      ";globalThis.touch=TouchActions;",
    c,
  );
  function event(type, extra = {}) {
    return {
      type,
      pointerId: 1,
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
      preventDefault() {
        this.prevented = true;
      },
      stopImmediatePropagation() {
        this.stopped = true;
      },
      ...extra,
    };
  }
  const dispatch = (e) => (handlers[e.type] || []).forEach((fn) => fn(e));
  let n = 0;
  dispatch(event("pointerdown"));
  c.touch.run(event("pointerup"), () => n++);
  A.equal(n, 1);
  const click = event("click");
  dispatch(click);
  A.ok(click.prevented && click.stopped);
  A.equal(n, 1);
  dispatch(event("pointerdown"));
  c.touch.run(event("pointerup"), () => n++);
  A.equal(n, 2);
  dispatch(event("pointerdown"));
  dispatch(event("pointermove", { clientX: 30 }));
  c.touch.run(event("pointerup"), () => n++);
  c.touch.run(event("click"), () => n++);
  A.equal(n, 2);
  dispatch(event("keydown"));
  c.touch.run(event("click"), () => n++);
  A.equal(n, 3);
  dispatch(event("pointerdown"));
  dispatch(event("pointercancel"));
  c.touch.run(event("pointerup"), () => n++);
  A.equal(n, 3);
  c.touch.run(event("pointerup", { pointerType: "mouse" }), () => n++);
  A.equal(n, 3);
  c.touch.run(event("click", { pointerType: "mouse" }), () => n++);
  A.equal(n, 4);
});
