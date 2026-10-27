const { test } = require("node:test"),
  A = require("node:assert/strict"),
  fs = require("fs"),
  crypto = require("crypto");
const G = require("../src/game"),
  J = require("../src/neighborhood-jobs"),
  L = require("../src/job-lawn"),
  P = require("../src/job-picture-rules");
function start(id, mode, seed = 97) {
  const s = G.newGame();
  G.chooseExperience(s, mode);
  s.cash = 83.25;
  J.start(s, id, 1000, seed);
  return s;
}
function path(d, goal) {
  const queue = [d.mower],
    paths = new Map([[d.mower, []]]);
  for (const at of queue) {
    if (goal(at)) return paths.get(at);
    for (const n of L.neighbors(d, at))
      if (!paths.has(n)) {
        paths.set(n, [...paths.get(at), n]);
        queue.push(n);
      }
  }
  return null;
}
test("20,000 gentle rectangular scrambles are legal, bounded, nontrivial and solvable in twelve or twenty-four moves", () => {
  for (const cols of [2, 3])
    for (let seed = 1; seed <= 10000; seed++) {
      const d = P.rectangularScramble(seed, cols, 3),
        tiles = d.tiles.slice();
      A.equal(tiles.length, cols * 3);
      A.equal(d.solution.length, cols === 2 ? 12 : 24);
      A.ok(
        d.minimumDistance >= (cols === 2 ? 4 : 6) &&
          d.minimumDistance <= (cols === 2 ? 8 : 12),
      );
      for (const cell of d.solution) {
        const hole = tiles.indexOf(null);
        A.ok(P.adjacent(cols, hole, 3).includes(cell));
        [tiles[cell], tiles[hole]] = [tiles[hole], tiles[cell]];
      }
      A.ok(
        tiles.every((v, i) => (i === tiles.length - 1 ? v === null : v === i)),
      );
    }
});
test("new grids respect mode, save exact partial progress, restart the same scramble and preserve time, records and rewards", () => {
  for (const mode of ["little", "growing"]) {
    let s = start("sliding", mode);
    const a = s.jobs.active,
      d = a.data;
    A.equal(a.rulesVersion, 5);
    A.equal(d.cols, mode === "little" ? 2 : 3);
    A.equal(d.rows, 3);
    J.action(s, { type: "pictureBegin" });
    J.tick(s, 7000);
    J.action(s, { type: "slide", cell: d.solution[0] });
    s = G.recover(JSON.stringify(s));
    A.deepEqual(s.jobs.active, a);
    J.action(s, { type: "pictureRestart" });
    A.deepEqual(s.jobs.active.data.tiles, d.initial);
    A.equal(s.jobs.active.elapsed, 7000);
    for (const cell of s.jobs.active.data.solution) {
      if (s.jobs.active.ended) break;
      A.ok(J.action(s, { type: "slide", cell }));
    }
    const oldkey = J.recordSpec(s.jobs.active).key;
    A.equal(J.claim(s, 1000).rewardCents, 100);
    A.throws(() => J.claim(s, 1000));
    A.equal(J.available(s, "sliding", 1000), 300000);
    s.jobs.pictureHistory.sliding = [];
    J.start(s, "sliding", 301001, 97);
    J.action(s, { type: "pictureBegin" });
    J.tick(s, 3000);
    for (const cell of s.jobs.active.data.solution) {
      if (s.jobs.active.ended) break;
      J.action(s, { type: "slide", cell });
    }
    A.equal(J.recordSpec(s.jobs.active).key, oldkey);
    A.equal(J.claim(s, 301001).rewardCents, 300);
    A.equal(s.cash, 87.25);
  }
});
test("pre-polish unfinished square puzzles and older lawns recover exactly and finish without reset or rule changes", () => {
  for (const old of require("./fixtures/pre-polish-jobs.json")) {
    const s = G.recover(JSON.stringify(old));
    A.equal(s.cash, 83.25);
    A.deepEqual(s.jobs, old.jobs);
    const a = s.jobs.active;
    if (a.id === "sliding") {
      A.equal(a.rulesVersion, 4);
      A.equal(a.data.size, a.mode === "little" ? 3 : 4);
      A.equal(a.data.rows, undefined);
      for (const cell of a.data.solution.slice(1)) {
        if (a.ended) break;
        A.ok(J.action(s, { type: "slide", cell }));
      }
    } else {
      A.equal(a.rulesVersion, 3);
      require("./job-test-helpers.cjs").solveLawn(s);
    }
    A.ok(a.won && a.ended);
    A.equal(J.claim(s, 1000).rewardCents, 100);
    A.equal(s.cash, 84.25);
  }
});
test("every new flower collision restarts only mowing, preserves elapsed time and money, and survives reload", () => {
  for (const mode of ["little", "growing"]) {
    const baseline = start("tidy", mode).jobs.active.data;
    A.equal(
      baseline.cells.filter((c) => c.obstacle === "flower").length,
      mode === "little" ? 6 : 8,
    );
    A.ok(
      baseline.cells.filter((c) => c.blocked && c.obstacle !== "flower")
        .length >= 2,
    );
    for (const flower of baseline.cells
      .map((c, i) => (c.obstacle === "flower" ? i : -1))
      .filter((i) => i >= 0)) {
      const s = start("tidy", mode),
        a = s.jobs.active,
        d = a.data;
      const route = path(
        d,
        (at) =>
          Math.abs((at % d.width) - (flower % d.width)) +
            Math.abs(
              Math.floor(at / d.width) - Math.floor(flower / d.width),
            ) ===
          1,
      );
      A.ok(route !== null);
      for (const cell of route) J.action(s, { type: "mow", cell });
      J.tick(s, 3456);
      A.ok(J.action(s, { type: "mow", cell: flower }));
      A.equal(d.mower, 0);
      A.equal(d.stage, "mow");
      A.equal(d.resets, 1);
      A.equal(a.score, 0);
      A.equal(a.elapsed, 3456);
      A.equal(s.cash, 83.25);
      A.deepEqual(d.cells, baseline.cells);
      A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
      require("./job-test-helpers.cjs").solveLawn(s);
      A.ok(a.won && a.ended);
      A.equal(J.claim(s, 1000).rewardCents, 100);
      A.equal(s.cash, 84.25);
    }
  }
});
test("natural obstacles, invalid moves and mowing after raking do not trigger flower penalties or alter money", () => {
  for (const mode of ["little", "growing"]) {
    const s = start("tidy", mode),
      d = s.jobs.active.data;
    A.equal(J.action(s, { type: "mow", cell: -1 }), false);
    A.equal(J.action(s, { type: "mow", cell: d.cells.length }), false);
    for (const obstacle of d.cells
      .map((c, i) => (c.blocked && c.obstacle !== "flower" ? i : -1))
      .filter((i) => i >= 0)) {
      const route = path(
        d,
        (at) =>
          Math.abs((at % d.width) - (obstacle % d.width)) +
            Math.abs(
              Math.floor(at / d.width) - Math.floor(obstacle / d.width),
            ) ===
          1,
      );
      if (!route) continue;
      for (const cell of route) J.action(s, { type: "mow", cell });
      const before = structuredClone(d);
      A.equal(J.action(s, { type: "mow", cell: obstacle }), false);
      A.deepEqual(d, before);
    }
    A.equal(s.cash, 83.25);
  }
});
test("all ten original storybook assets are preserved with verified sources and optimized delivery", () => {
  const files = require("../assets/job-polish/provenance.json");
  A.equal(files.length, 10);
  for (const f of files) {
    for (const [file, hash] of [
      [f.original, f.sourceSha256],
      [f.file, f.deliverySha256],
    ])
      A.equal(
        crypto
          .createHash("sha256")
          .update(fs.readFileSync("assets/job-polish/" + file))
          .digest("hex"),
        hash,
      );
  }
});
