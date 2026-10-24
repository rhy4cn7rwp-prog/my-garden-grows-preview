const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js"),
  L = require("../src/clubhouse-layout.js");
const copy = (s) => JSON.parse(JSON.stringify(s));
function farm() {
  const s = G.initial();
  s.cash = 2500;
  for (const d of G.dreams) G.purchaseDream(s, d.id);
  return s;
}
test("painted shelf rows use separate measured contact edges and accept small treasures only", () => {
  const rows = L.surfaces.filter((s) => s.kind === "shelf");
  assert.equal(rows.length, 10);
  for (const s of rows) {
    const x = (s.pixels[0] + s.pixels[1]) / 2,
      p = L.canonical("camera", s.id, x);
    assert.ok(p && L.valid("camera", p), s.id);
    assert.equal(L.canonical("bike", s.id, x), null);
    assert.equal(L.canonical("guitar", s.id, x), null);
    assert.equal(L.drop("camera", p.angle, p.y - 0.015).surface, s.id);
  }
  const p = L.canonical("camera", "shelf-nook-middle", 1264);
  assert.ok(
    p.y * 724 >= 248 && p.y * 724 <= 251,
    "contact follows the measured top edge, not the former floating center",
  );
});
test("chest placements sit below the front rim and the original front panel is an occlusion layer", () => {
  const p = L.canonical("ball", "chest", 1352);
  assert.ok(p && L.valid("ball", p));
  assert.ok(p.y * 724 >= 495 && p.y * 724 < 506);
  assert.equal(L.metrics("ball", p).occlusion, 12);
  assert.equal(L.canonical("bike", "chest", 1300), null);
  assert.equal(L.occluders.length, 1);
  assert.ok(L.occluders[0].some(([x, y]) => y > 570));
});
test("window seat and reading cushion provide actual resting surfaces", () => {
  for (const [id, x, min, max] of [
    ["window-seat", 1000, 422, 426],
    ["reading-bench", 465, 437, 441],
  ]) {
    const p = L.canonical("ball", id, x);
    assert.ok(p && L.valid("ball", p));
    assert.ok(p.y * 724 >= min && p.y * 724 <= max);
    assert.equal(L.drop("ball", p.angle, p.y - 0.01).surface, id);
  }
});
test("floor placement is free in two dimensions and excludes furniture and edges", () => {
  for (const [x, y] of [
    [434, 633],
    [1000, 605],
    [1735, 650],
    [1820, 680],
  ])
    assert.ok(L.canonical("ball", "floor", x, y));
  for (const [x, y] of [
    [1300, 500],
    [1510, 565],
    [400, 440],
    [1000, 420],
    [1735, 490],
    [1000, 725],
  ])
    assert.equal(L.canonical("ball", "floor", x, y), null);
  assert.equal(L.drop("ball", L.angleAt(1000), 0.1), null);
});
test("floor scale follows depth; chest size leaves an identifiable visible portion", () => {
  const back = L.canonical("ball", "floor", 1000, 530),
    front = L.canonical("ball", "floor", 1000, 680);
  assert.ok(L.metrics("ball", front).width > L.metrics("ball", back).width);
  const chest = L.canonical("camera", "chest", 1260),
    m = L.metrics("camera", chest);
  assert.ok(m.height - m.occlusion > 15);
});
test("multiple small treasures fit on a shelf, cushion and inside the chest without excessive overlap", () => {
  for (const [surface, xs] of [
    ["shelf-nook-middle", [1241, 1283, 1324]],
    ["window-seat", [989, 1035, 1061]],
    ["chest", [1258, 1300, 1352]],
  ]) {
    const positions = {};
    const ids =
      surface === "window-seat"
        ? ["camera", "ball"]
        : ["camera", "puppy", "ball"];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i],
        p = L.canonical(id, surface, xs[i]);
      assert.ok(p, surface + " " + id);
      assert.deepEqual(
        L.blockers(
          id,
          p,
          positions,
          Object.fromEntries(ids.map((k) => [k, true])),
        ).filter((k) => positions[k]),
        [],
      );
      positions[id] = p;
    }
    const id = ids[0],
      other = ids.at(-1),
      p = { ...positions[id] };
    assert.ok(
      L.blockers(
        other,
        p,
        positions,
        Object.fromEntries(ids.map((k) => [k, true])),
      ).includes(id),
    );
  }
});
test("old floating placements migrate to the nearest real surface without resetting the farm", () => {
  const s = farm();
  delete s.clubhouseLayoutVersion;
  s.cash = 27;
  s.bagCount = 11;
  s.seeds.carrot = 5;
  s.clubhousePositions = {
    camera: { surface: "nook-shelf", angle: 18, y: 0.31 },
    puppy: { surface: "toy-chest", angle: 29, y: 0.69 },
    guitar: { surface: "music-wall", angle: -40, y: 0.47 },
    ball: { surface: "floor", angle: 43, y: 0.83 },
  };
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.clubhouseLayoutVersion, 2);
  assert.equal(r.clubhousePositions.camera.surface, "shelf-nook-middle");
  assert.equal(r.clubhousePositions.puppy.surface, "chest");
  assert.equal(r.clubhousePositions.guitar.surface, "floor");
  for (const id of Object.keys(s.clubhousePositions))
    assert.ok(L.valid(id, r.clubhousePositions[id]), id);
  for (const k of [
    "cash",
    "bagCount",
    "seeds",
    "dreamPurchases",
    "day",
    "season",
    "goal",
  ])
    assert.deepEqual(r[k], s[k], k);
  assert.equal(
    r.clubhousePositions.camera.angle,
    s.clubhousePositions.camera.angle,
  );
});
test("new contact placements survive repeated refresh, backup recovery and season changes exactly", () => {
  let s = farm();
  G.moveClubhouseItem(s, "ball", L.canonical("ball", "window-seat", 1000));
  const expected = copy(s.clubhousePositions);
  for (let i = 0; i < 3; i++) {
    s = G.recover(JSON.stringify(s));
    assert.deepEqual(s.clubhousePositions, expected);
  }
  s = G.recover("{bad", JSON.stringify(s));
  assert.deepEqual(s.clubhousePositions, expected);
  s.day = 20;
  G.endDay(s);
  assert.deepEqual(s.clubhousePositions, expected);
});
test("corrupt placements and unowned records never create ownership or erase a valid farm", () => {
  const s = G.initial();
  s.cash = 34;
  s.bagCount = 6;
  s.clubhousePositions = {
    camera: { surface: "chest", angle: 24, y: 0.68 },
    ball: { surface: "floor", angle: 999, y: 0.9 },
  };
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.cash, 34);
  assert.equal(r.bagCount, 6);
  assert.deepEqual(r.dreamPurchases, {});
  assert.deepEqual(r.clubhousePositions, {});
});
