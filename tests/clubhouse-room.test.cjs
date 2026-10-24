const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
const L = require("../src/clubhouse-layout.js");
const copy = (s) => JSON.parse(JSON.stringify(s));
function farm() {
  const s = G.initial();
  s.cash = 2500;
  for (const d of G.dreams) G.purchaseDream(s, d.id);
  s.seeds.carrot = 7;
  s.bagCount = 8;
  return s;
}
test("panorama projection and inverse share a fixed viewpoint across screen sizes", () => {
  for (const [w, h] of [
    [320, 360],
    [390, 664],
    [428, 746],
    [428, 892],
    [926, 368],
  ]) {
    const g = L.geometry(w, h);
    const half = (Math.atan(w / 2 / g.focal) * 180) / Math.PI;
    assert.ok(half <= 30.0001);
    for (const yaw of [-80, -40, 0, 40, 80]) {
      assert.ok(
        yaw - half >= -120 && yaw + half <= 120,
        "room edge stays outside view",
      );
      for (const delta of [-half / 2, 0, half / 2]) {
        const p = { angle: yaw + delta, y: 0.81 },
          out = L.project(p, yaw, g),
          inverse = L.unproject(out.x, out.y, yaw, g);
        assert.ok(Math.abs(p.angle - inverse.angle) < 1e-8);
        assert.ok(Math.abs(p.y - inverse.y) < 1e-8);
      }
    }
  }
});
test("default room spots are valid, reachable and mutually clear", () => {
  for (const id of Object.keys(L.defaults)) {
    assert.ok(L.valid(id, L.defaults[id]), id);
    assert.ok(Math.abs(L.defaults[id].angle) <= 90);
    assert.deepEqual(
      L.blockers(
        id,
        L.defaults[id],
        {},
        Object.fromEntries(Object.keys(L.defaults).map((k) => [k, true])),
      ),
      [],
    );
  }
});
test("only purchased items can move and failures cannot change farm state", () => {
  const s = G.initial(),
    before = copy(s);
  assert.throws(
    () =>
      G.moveClubhouseItem(s, "ball", { surface: "floor", angle: 40, y: 0.83 }),
    /purchased/,
  );
  assert.deepEqual(s, before);
});
test("floor, shelf and wall compatibility prevents impossible placement and out-of-room positions", () => {
  const s = farm(),
    before = copy(s);
  for (const p of [
    { surface: "right-shelf", angle: 55, y: 0.38 },
    { surface: "floor", angle: 1000, y: 0.83 },
    { surface: "floor", angle: 40, y: -1 },
    { surface: "floor", angle: NaN, y: 0.83 },
    { surface: "missing", angle: 40, y: 0.83 },
  ]) {
    assert.throws(() => G.moveClubhouseItem(s, "bike", p));
    assert.deepEqual(s, before);
  }
  assert.equal(L.drop("bike", 57, 0.38), null);
  assert.equal(L.drop("ball", 94, 0.83), null);
  assert.deepEqual(L.drop("tablet", 60, 0.41), {
    surface: "right-shelf",
    angle: 60,
    y: 0.38,
  });
});
test("repositioning changes only the optional room layout and survives normal and backup recovery", () => {
  const s = farm(),
    before = copy(s),
    p = { surface: "floor", angle: 43, y: 0.87 };
  G.moveClubhouseItem(s, "ball", p);
  for (const k of Object.keys(before).filter((k) => k !== "clubhousePositions"))
    assert.deepEqual(s[k], before[k], k);
  assert.deepEqual(G.recover(JSON.stringify(s)).clubhousePositions, {
    ball: p,
  });
  assert.deepEqual(G.recover("{bad", JSON.stringify(s)).clubhousePositions, {
    ball: p,
  });
});
test("treasures cannot be dropped into another occupied spot", () => {
  const s = farm(),
    before = copy(s);
  assert.throws(
    () =>
      G.moveClubhouseItem(s, "ball", { surface: "floor", angle: -72, y: 0.83 }),
    /space/,
  );
  assert.deepEqual(s, before);
});
test("restoring an item frees an occupied home spot safely without losing ownership", () => {
  const s = farm();
  G.moveClubhouseItem(s, "bike", { surface: "floor", angle: -40, y: 0.83 });
  G.moveClubhouseItem(s, "ball", { surface: "floor", angle: -72, y: 0.83 });
  const before = copy(s);
  assert.deepEqual(G.resetClubhouseItem(s, "bike"), ["bike", "ball"]);
  assert.deepEqual(s.clubhousePositions, {});
  for (const k of Object.keys(before).filter((k) => k !== "clubhousePositions"))
    assert.deepEqual(s[k], before[k], k);
});
test("restore-all resets positions only, never the farm or purchases", () => {
  const s = farm();
  G.moveClubhouseItem(s, "ball", { surface: "floor", angle: 43, y: 0.87 });
  const before = copy(s);
  G.resetClubhouseLayout(s);
  assert.deepEqual(s.clubhousePositions, {});
  for (const k of Object.keys(before).filter((k) => k !== "clubhousePositions"))
    assert.deepEqual(s[k], before[k], k);
});
test("old saves gain an empty layout; malformed optional layouts never reset a valid farm", () => {
  const s = farm();
  delete s.clubhousePositions;
  assert.deepEqual(G.recover(JSON.stringify(s)).clubhousePositions, {});
  for (const broken of [
    false,
    [],
    null,
    "bad",
    { ball: { surface: "floor", angle: 500, y: 0.83 } },
    { unknown: { surface: "floor", angle: 40, y: 0.83 } },
  ]) {
    s.clubhousePositions = broken;
    const r = G.recover(JSON.stringify(s));
    assert.deepEqual(r.clubhousePositions, {});
    assert.equal(r.cash, s.cash);
    assert.deepEqual(r.dreamPurchases, s.dreamPurchases);
    assert.equal(r.bagCount, 8);
  }
});
test("position recovery keeps valid owned records without inventing ownership", () => {
  const s = G.initial();
  s.cash = 100;
  G.purchaseDream(s, "ball");
  s.clubhousePositions = {
    ball: { surface: "floor", angle: 43, y: 0.87, other: "ignored" },
    bike: { surface: "floor", angle: -50, y: 0.83 },
  };
  const r = G.recover(JSON.stringify(s));
  assert.deepEqual(r.clubhousePositions, {
    ball: { surface: "floor", angle: 43, y: 0.87 },
  });
  assert.equal(G.ownsDream(r, "bike"), false);
});
test("an unavailable optional room script cannot erase a recoverable farm", () => {
  const fs = require("node:fs"),
    vm = require("node:vm"),
    context = vm.createContext({});
  vm.runInContext(
    fs.readFileSync(require.resolve("../src/game.js"), "utf8"),
    context,
  );
  const s = farm();
  G.moveClubhouseItem(s, "ball", { surface: "floor", angle: 43, y: 0.87 });
  const r = context.Game.recover(JSON.stringify(s));
  assert.equal(r.cash, s.cash);
  assert.equal(r.bagCount, s.bagCount);
  assert.equal(
    JSON.stringify(r.dreamPurchases),
    JSON.stringify(s.dreamPurchases),
  );
  assert.equal(
    JSON.stringify(r.clubhousePositions),
    JSON.stringify(s.clubhousePositions),
  );
});
test("new days and seasons retain custom positions and purchased ownership", () => {
  const s = farm();
  s.day = 20;
  s.season = 2;
  G.moveClubhouseItem(s, "ball", { surface: "floor", angle: 43, y: 0.87 });
  const positions = copy(s.clubhousePositions),
    owned = copy(s.dreamPurchases);
  G.endDay(s);
  assert.equal(s.day, 1);
  assert.equal(s.season, 3);
  assert.deepEqual(s.clubhousePositions, positions);
  assert.deepEqual(s.dreamPurchases, owned);
});
