const { test } = require("node:test"),
  A = require("node:assert/strict"),
  fs = require("node:fs"),
  crypto = require("node:crypto");
const G = require("../src/game"),
  J = require("../src/neighborhood-jobs"),
  P = require("../src/job-picture-rules"),
  Gallery = require("../src/job-gallery-data"),
  Stacks = require("../src/job-stack-puzzles");
const make = (id, mode = "growing", seed = 77) => {
  const s = G.newGame();
  G.chooseExperience(s, mode);
  J.start(s, id, 1000, seed);
  return s;
};
function solve(s) {
  const a = s.jobs.active,
    d = a.data;
  if (!d.started) J.action(s, { type: "pictureBegin" });
  if (a.id === "hidden")
    for (const item of d.targets) J.action(s, { type: "findObject", item });
  else
    for (const cell of d.solution) {
      if (a.ended) break;
      A.ok(J.action(s, { type: "slide", cell }));
    }
  A.ok(a.won && a.ended);
}
test("60 distinct original sources and optimized pictures, reviewed targets and immutable scene IDs", () => {
  const manifest = require("../assets/job-pictures/provenance.json"),
    hashes = new Set();
  A.equal(manifest.length, 60);
  for (const asset of manifest) {
    A.ok(asset.width >= 1000 && asset.height >= 1000);
    A.ok(!hashes.has(asset.sourceSha256));
    hashes.add(asset.sourceSha256);
    A.equal(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync("assets/job-pictures/" + asset.source))
        .digest("hex"),
      asset.sourceSha256,
    );
    A.equal(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(asset.file))
        .digest("hex"),
      asset.deliverySha256,
    );
  }
  for (const kind of ["hidden", "sliding"]) {
    A.equal(Gallery[kind].length, 30);
    for (const scene of Gallery[kind]) {
      A.ok(fs.existsSync(scene.file), scene.id);
      if (kind === "hidden") {
        A.equal(scene.objects.length, 12);
        A.equal(new Set(scene.objects.map((o) => o.id)).size, 12);
        for (const o of scene.objects) {
          A.ok(o.name.length > 2);
          for (const [x, y, w, h] of [
            [o.x, o.y, o.w, o.h],
            ...(o.regions || []),
          ])
            A.ok(
              x >= 0 &&
                y >= 0 &&
                w > 0 &&
                h > 0 &&
                x + w <= 1.08 &&
                y + h <= 1.08,
              scene.id + ":" + o.id,
            );
        }
      }
    }
  }
});
test("all 30 hidden scenes in both modes contain the exact requested targets, hints never find objects, recovery keeps checklist and found objects", () => {
  for (const mode of ["little", "growing"])
    for (let scene = 0; scene < 30; scene++) {
      const s = make("hidden", mode),
        a = s.jobs.active;
      while (a.data.scene !== scene) J.action(s, { type: "nextPicture" });
      const d = a.data;
      A.equal(new Set(d.targets).size, d.targets.length);
      A.ok(
        mode === "little"
          ? d.targets.length === 5
          : d.targets.length >= 10 && d.targets.length <= 12,
      );
      J.tick(s, 60000);
      A.equal(a.elapsed, 0);
      A.equal(J.action(s, { type: "findObject", item: d.targets[0] }), false);
      J.action(s, { type: "pictureBegin" });
      A.equal(J.action(s, { type: "nextPicture" }), false);
      for (let i = 0; i < 15; i++) J.action(s, { type: "pictureHint" });
      A.deepEqual(d.found, []);
      A.ok(d.targets.includes(d.hint));
      J.tick(s, 1380);
      J.action(s, { type: "findObject", item: d.targets[0] });
      A.equal(J.action(s, { type: "findObject", item: d.targets[0] }), false);
      const r = G.recover(JSON.stringify(s));
      A.deepEqual(r.jobs, s.jobs);
      for (const item of r.jobs.active.data.targets.slice(1))
        J.action(r, { type: "findObject", item });
      A.ok(r.jobs.active.won);
      A.equal(J.claim(r, 2000).rewardCents, 100);
      A.equal(r.cash, 1);
      A.throws(() => J.claim(r, 2000));
      A.equal(J.available(r, "hidden", 2000), 300000);
      A.equal(J.available(r, "sliding", 2000), 0);
    }
});
test("20,000 picture scrambles have legal complete solutions and nontrivial starts", () => {
  for (const n of [3, 4])
    for (let seed = 1; seed <= 10000; seed++) {
      const d = P.scramble(seed, n);
      A.ok(d.minimumDistance >= (n === 3 ? 8 : 24));
      A.ok(
        d.tiles.filter((v, i) => v !== null && v !== i).length >=
          (n === 3 ? 6 : 12),
      );
      const tiles = d.tiles.slice();
      for (const cell of d.solution) {
        const hole = tiles.indexOf(null);
        A.ok(P.adjacent(n, hole).includes(cell));
        [tiles[hole], tiles[cell]] = [tiles[cell], tiles[hole]];
      }
      A.ok(tiles.every((v, i) => (i === n * n - 1 ? v === null : v === i)));
    }
});
test("all 30 sliding pictures support both grids, legal moves, Restart same scramble, active-time and exact persistence", () => {
  for (const mode of ["little", "growing"])
    for (let scene = 0; scene < 30; scene++) {
      const s = make("sliding", mode),
        a = s.jobs.active;
      while (a.data.scene !== scene) J.action(s, { type: "nextPicture" });
      const d = a.data;
      A.equal(d.cols, mode === "little" ? 2 : 3);
      A.equal(d.rows,3);
      J.tick(s, 60000);
      A.equal(a.elapsed, 0);
      J.action(s, { type: "pictureBegin" });
      J.tick(s, 2500);
      const hole = d.tiles.indexOf(null),
        invalid = d.tiles.findIndex(
          (_, i) => i !== hole && !P.adjacent(d.cols, hole,d.rows).includes(i),
        );
      A.equal(J.action(s, { type: "slide", cell: invalid }), false);
      J.action(s, { type: "slide", cell: d.solution[0] });
      A.equal(d.moves, 1);
      J.action(s, { type: "pictureRestart" });
      A.deepEqual(d.tiles, d.initial);
      A.equal(d.moves, 0);
      A.equal(a.elapsed, 2500);
      J.action(s, { type: "pictureHint" });
      A.equal(d.moves, 0);
      A.equal(d.assisted, true);
      const r = G.recover(JSON.stringify(s));
      A.deepEqual(r.jobs, s.jobs);
      solve(r);
      A.equal(J.result(r.jobs).rewardCents, 100);
      const result = J.claim(r, 2000);
      A.ok(result.moves > 0);
      A.throws(() => J.claim(r, 2000));
      A.equal(r.cash, 1);
      A.equal(J.available(r, "sliding", 2000), 300000);
    }
});
test("picture records compare equivalent conditions only: first $1, faster $3 total, ties $1; history rotates across reloads without customer limits", () => {
  for (const id of ["hidden", "sliding"])
    for (const mode of ["little", "growing"]) {
      let s = make(id, mode);
      for (const [round, time, reward] of [
        [0, 10000, 100],
        [1, 5000, 300],
        [2, 5000, 100],
      ]) {
        if (round) {
          s.jobs.pictureHistory[id] = [];
          J.start(s, id, 1000 + round * 300001, 77);
        }
        J.action(s, { type: "pictureBegin" });
        J.tick(s, time);
        solve(s);
        A.equal(J.result(s.jobs).rewardCents, reward);
        s = G.recover(JSON.stringify(s));
        A.equal(J.claim(s, 1000 + round * 300001).rewardCents, reward);
      }
      A.equal(s.cash, 5);
      const scenes = [];
      s.jobs.cooldowns[id] = 0;
      s.jobs.pictureHistory[id] = [];
      for (let n = 0; n < 60; n++) {
        J.start(s, id, 2000000 + n * 300001, n + 2);
        scenes.push(s.jobs.active.data.scene);
        solve(s);
        J.claim(s, 2000000 + n * 300001);
        s = G.recover(JSON.stringify(s));
      }
      A.equal(new Set(scenes.slice(0, 30)).size, 30);
      for (let i = 1; i < scenes.length; i++)
        A.notEqual(scenes[i], scenes[i - 1]);
      A.equal(s.jobs.pictureCompleted[id].length, 30);
    }
});
test("all 20 unfinished pre-picture jobs recover exactly, preserving old puzzles, rewards, money and timing", () => {
  for (const old of require("./fixtures/pre-picture-jobs.json")) {
    const s = G.recover(JSON.stringify({ ...G.initial(), ...old }));
    A.equal(s.cash, old.cash);
    A.deepEqual(s.jobs.active, old.jobs.active);
    A.equal(s.jobs.active.rulesVersion, 3);
    A.deepEqual(G.recover(JSON.stringify(s)).jobs, s.jobs);
  }
});
test("20 ripe tomatoes on ten varied plants and every weed required in both modes", () => {
  for (const mode of ["little", "growing"]) {
    const s = make("tomatoes", mode),
      a = s.jobs.active;
    A.equal(a.data.target, 20);
    A.equal(a.data.items.filter((i) => i.kind === "ripe").length, 20);
    A.ok(a.data.items.some((i) => i.kind === "green"));
    A.equal(new Set(a.data.items.map((i) => i.plant)).size, 10);
    for (let item = 0; item < a.data.items.length; item++)
      if (a.data.items[item].kind === "ripe")
        J.action(s, { type: "chore", item });
    A.ok(a.won);
    const w = make("weeds", mode),
      b = w.jobs.active;
    for (let item = 0; item < b.data.items.length; item++)
      if (b.data.items[item].kind === "weed")
        J.action(w, { type: "chore", item });
    A.ok(b.won);
    A.ok(b.data.items.filter((i) => i.kind === "plant").every((i) => !i.done));
  }
});
test("4000 deep and child-friendly stack layouts have nontrivial legally reversible solutions", () => {
  for (const [mode, level] of [
    ["growing", 0],
    ["little", 0],
    ["little", 1],
    ["little", 2],
  ])
    for (let seed = 1; seed <= 1000; seed++) {
      const d = Stacks.make(seed, mode, level);
      A.equal(d.cap, mode === "growing" ? 8 : 3 + level);
      A.ok(d.mixed >= 2);
      const crates = d.crates.map((c) => c.slice());
      for (const [from, to] of d.solution) {
        A.ok(crates[from].length);
        const crop = crates[from].at(-1);
        A.ok(crates[to].length < d.cap);
        A.ok(!crates[to].length || crates[to].at(-1) === crop);
        crates[to].push(crates[from].pop());
      }
      A.ok(
        crates.every(
          (c) =>
            !c.length || (c.length === d.cap && c.every((v) => v === c[0])),
        ),
      );
    }
});
test("unfinished version-three activities can still finish and receive their original reward once", () => {
  for (const old of require("./fixtures/pre-picture-jobs.json")) {
    const s = G.recover(JSON.stringify({ ...G.initial(), ...old })),
      a = s.jobs.active,
      d = a.data;
    if (a.id === "tidy") require("./job-test-helpers.cjs").solveLawn(s);
    else if (a.id === "words") {
      for (const w of d.words)
        if (!d.found.includes(w))
          J.action(s, { type: "word", path: d.paths[w] });
    } else if (a.id === "labels") {
      while (!a.won) {
        const slot = d.slots.indexOf(null),
          v = d.words[d.round][slot],
          tile = d.tiles.findIndex((x, i) => x === v && !d.slots.includes(i));
        J.action(s, { type: "letter", tile, slot });
      }
    } else if (a.id === "packing") {
      while (!a.won) {
        const item = J.packingFronts(a).find((i) => i >= 0);
        J.action(s, { type: "pack", item, target: d.items[item] });
      }
    } else if (a.id === "stacks") {
      for (const [from, to] of d.solution) {
        if (a.ended) break;
        J.action(s, { type: "stack", from, to });
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
        if (t <= a.elapsed) continue;
        J.action(s, { type: "basket", x: J.carrotPose(a, c, t).x });
        J.tick(s, t - a.elapsed);
      }
      J.tick(s, 60000 - a.elapsed);
    } else
      for (let item = 0; item < d.items.length && !a.ended; item++) {
        const it = d.items[item];
        if (
          !it.done &&
          (a.id === "flowers" ||
            it.kind === (a.id === "weeds" ? "weed" : "ripe"))
        )
          J.action(s, { type: "chore", item });
      }
    A.ok(a.won && a.ended, a.id);
    const r = G.recover(JSON.stringify(s));
    A.deepEqual(r.jobs, s.jobs);
    A.equal(J.claim(r, 9000).rewardCents, 100);
    A.equal(r.cash, old.cash + 1);
    A.throws(() => J.claim(r, 9000));
  }
});
test("Little stack depth increases gently with completed jobs, not dream purchases, and active settings never change", () => {
  const s = make("stacks", "little");
  A.equal(s.jobs.active.data.cap, 3);
  s.jobs.completed["stacks|little"] = 20;
  A.equal(G.recover(JSON.stringify(s)).jobs.active.data.cap, 3);
  J.quit(s);
  J.start(s, "stacks", 1000, 89);
  A.equal(s.jobs.active.data.cap, 5);
  J.quit(s);
  s.jobs.completed["stacks|little"] = 3;
  J.start(s, "stacks", 1000, 89);
  A.equal(s.jobs.active.data.cap, 4);
});
