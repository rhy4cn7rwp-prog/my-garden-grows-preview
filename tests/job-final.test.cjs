const { test } = require("node:test"),
  A = require("node:assert/strict"),
  G = require("../src/game"),
  J = require("../src/neighborhood-jobs"),
  S = require("../src/job-stack-puzzles"),
  L = require("../src/job-lawn"),
  Clues = require("../src/job-clues"),
  Gallery = require("../src/job-gallery-data"),
  fs = require("fs"),
  crypto = require("crypto");
function start(id, mode = "growing", seed = 97) {
  const s = G.newGame();
  G.chooseExperience(s, mode);
  s.cash = 76.35;
  J.start(s, id, 1000, seed);
  return s;
}
function route(d, target) {
  const q = [d.mower],
    paths = new Map([[d.mower, []]]);
  for (const i of q) {
    if (
      Math.abs((i % d.width) - (target % d.width)) +
        Math.abs(Math.floor(i / d.width) - Math.floor(target / d.width)) ===
      1
    )
      return paths.get(i);
    for (const j of L.neighbors(d, i))
      if (!paths.has(j)) {
        paths.set(j, [...paths.get(i), j]);
        q.push(j);
      }
  }
}
test("two thousand eight-word searches contain eight distinct selectable answers and recover exactly", () => {
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed <= 1000; seed++) {
      const s = start("words", mode, seed),
        a = s.jobs.active,
        d = a.data;
      A.equal(d.words.length, 8);
      A.equal(new Set(d.words).size, 8);
      A.ok(d.size >= (mode === "little" ? 8 : 10));
      for (const w of d.words) {
        A.equal(d.paths[w].map((i) => d.grid[i]).join(""), w);
        A.equal(J.action(s, { type: "word", path: d.paths[w] }), true);
      }
      A.ok(a.won && a.ended);
      A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
      A.equal(J.claim(s, 1000).rewardCents, 100);
      A.equal(s.cash, 77.35);
      A.throws(() => J.claim(s, 1000));
    }
});
test("four thousand perfectly mixed Stack Sort boards keep the same crate depths and prove legal solvability", () => {
  for (const [mode, level] of [
    ["little", 0],
    ["little", 1],
    ["little", 2],
    ["growing", 0],
  ])
    for (let seed = 1; seed <= 1000; seed++) {
      const d = S.makeMixed(seed, mode, level),
        cs = d.crates.map((c) => c.slice());
      A.equal(d.cap, mode === "growing" ? 8 : 3 + level);
      A.equal(cs.length, mode === "growing" ? 6 : level === 0 ? 4 : 5);
      A.ok(cs.every((c) => c.slice(1).every((v, i) => v !== c[i])));
      for (const [f, t] of d.solution) {
        A.ok(cs[f].length);
        A.ok(cs[t].length < d.cap);
        A.ok(!cs[t].length || cs[t].at(-1) === cs[f].at(-1));
        cs[t].push(cs[f].pop());
      }
      A.ok(
        cs.every(
          (c) =>
            !c.length || (c.length === d.cap && c.every((v) => v === c[0])),
        ),
      );
    }
});
test("all clean object clues have preserved transparent sources, unique artwork and coverage for every original scene object", () => {
  const rows = require("../assets/job-clues/provenance.json");
  A.equal(rows.length, 14);
  for (const r of rows)
    for (const [file, hash] of [
      [r.source, r.sourceSha256],
      [r.file, r.deliverySha256],
    ])
      A.equal(
        crypto
          .createHash("sha256")
          .update(fs.readFileSync("assets/job-clues/" + file))
          .digest("hex"),
        hash,
      );
  for (const scene of Gallery.hidden) {
    A.equal(scene.objects.length, 12);
    for (const o of scene.objects) {
      A.ok(fs.existsSync(Clues.file(o)));
      A.ok(Clues.art(o).includes("<img"));
      A.ok(!Clues.art(o).includes(scene.file));
    }
  }
});
test("flower collisions stop at every hit, freeze active time, persist the homeowner state, and restart only after Try Again", () => {
  for (const mode of ["little", "growing"]) {
    const baseline = start("tidy", mode).jobs.active.data;
    for (const flower of baseline.cells
      .map((c, i) => (c.obstacle === "flower" ? i : -1))
      .filter((i) => i >= 0)) {
      const s = start("tidy", mode),
        a = s.jobs.active,
        d = a.data;
      for (const cell of route(d, flower)) J.action(s, { type: "mow", cell });
      J.tick(s, 3456);
      const before = structuredClone(d.cells);
      J.action(s, { type: "mow", cell: flower });
      A.equal(d.mower, flower);
      A.equal(d.stage, "flowerPause");
      A.deepEqual(d.cells, before);
      A.equal(d.resets, 0);
      A.equal(J.action(s, { type: "mow", cell: 0 }), false);
      J.tick(s, 60000);
      A.equal(a.elapsed, 3456);
      const r = G.recover(JSON.stringify(s));
      A.deepEqual(r.jobs, s.jobs);
      A.ok(J.action(r, { type: "retryMow" }));
      A.equal(r.jobs.active.data.mower, 0);
      A.equal(r.jobs.active.data.stage, "mow");
      A.deepEqual(r.jobs.active.data.cells, baseline.cells);
      A.equal(r.cash, 76.35);
      require("./job-test-helpers.cjs").solveLawn(r);
      A.equal(J.claim(r, 1000).rewardCents, 100);
      A.equal(r.cash, 77.35);
    }
  }
});
test("carrot schedules vary trajectories and late bursts, increase pace, and keep catches accurate with no duplicate points", () => {
  for (const mode of ["little", "growing"])
    for (let seed = 1; seed <= 200; seed++) {
      const s = start("catch", mode, seed),
        a = s.jobs.active,
        all = a.data.tosses;
      A.equal(J.clockLimit(a), 60000);
      A.ok(all.length > (mode === "little" ? 26 : 40));
      A.ok(
        all.filter((c) => c.launch > 42000).length >
          all.filter((c) => c.launch < 15000).length,
      );
      A.ok(all.slice(1).some((c, i) => c.launch - all[i].launch < 450));
      A.ok(new Set(all.map((c) => c.end)).size > 20);
      A.ok(all.every((c) => J.catchTime(a, c) <= 60000));
      let expected = 0;
      const ordered = all
        .slice()
        .sort((c, d) => J.catchTime(a, c) - J.catchTime(a, d));
      for (const c of ordered) {
        const t = J.catchTime(a, c),
          p = J.carrotPose(a, c, t);
        A.ok(Math.abs(p.y - 0.78) < 0.001);
        J.action(s, { type: "basket", x: p.x });
        J.tick(s, t - a.elapsed);
        expected += c.big ? 2 : 1;
        A.equal(a.score, expected);
      }
      J.tick(s, 60000 - a.elapsed);
      A.ok(a.won);
      const before = a.score;
      J.tick(s, 5000);
      A.equal(a.score, before);
      A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
    }
});
test("unfinished pre-update words, lawn, catch and stack jobs retain exact original states and rules", () => {
  for (const old of require("./fixtures/pre-final-jobs.json")) {
    const s = G.recover(JSON.stringify(old));
    A.equal(s.cash, old.cash);
    A.deepEqual(s.jobs, old.jobs);
    A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
  }
});
