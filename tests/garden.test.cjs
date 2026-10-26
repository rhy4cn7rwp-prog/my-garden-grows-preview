const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
function planted(id = "carrot") {
  const s = G.initial();
  s.seeds[id] = 3;
  G.plan(s, 0, id);
  G.plantPlan(s);
  return s;
}
test("individual watering is idempotent and shared with Water All; neither changes age, quality, money or stock", () => {
  const s = planted();
  s.plots[0].watered = false;
  const before = structuredClone(s);
  assert.equal(G.waterPlot(s, 0), true);
  for (let i = 0; i < 20; i++) assert.equal(G.waterPlot(s, 0), false);
  assert.equal(G.water(s), 0);
  before.plots[0].watered = true;
  assert.deepEqual(s, before);
  assert.throws(() => G.waterPlot(s, 1));
  assert.throws(() => G.waterPlot(s, -1));
  assert.throws(() => G.waterPlot(s, 25));
});
test("watering methods give identical next-day growth and no real-time growth", () => {
  const a = planted("beans"),
    b = structuredClone(a);
  a.plots[0].watered = b.plots[0].watered = false;
  G.waterPlot(a, 0);
  G.water(b);
  assert.deepEqual(a, b);
  const untouched = JSON.stringify(a.plots);
  G.marketTime(a, Date.now() + 999999999);
  G.syncMarketClock(a, Date.now() + 999999999);
  assert.equal(JSON.stringify(a.plots), untouched);
  G.endDay(a);
  G.endDay(b);
  assert.deepEqual(a, b);
  assert.equal(a.plots[0].age, 1);
  assert.equal(a.plots[0].watered, false);
});
test("only growing dry plants need a reminder; ripe produce does not need watering to be picked", () => {
  const s = planted();
  s.plots[0].watered = false;
  assert.deepEqual(G.plantsNeedingWater(s), [0]);
  s.plots[0].age = G.crops.find((c) => c.id === "carrot").days;
  assert.deepEqual(G.plantsNeedingWater(s), []);
  G.waterPlot(s, 0);
  assert.equal(s.plots[0].age, 3);
});
test("individual and bulk harvest cannot double-credit stock and preserve approved yields/quality adjustment", () => {
  const s = planted(),
    c = G.crops.find((c) => c.id === "carrot");
  s.plots[0].age = c.days;
  assert.equal(G.harvestAmount(s, 0), c.yield);
  G.harvest(s, 0);
  assert.equal(s.inventory.carrot, c.yield);
  assert.throws(() => G.harvest(s, 0));
  assert.equal(G.harvestAll(s).plots, 0);
  assert.equal(s.inventory.carrot, c.yield);
  const q = planted();
  q.plots[0].age = c.days;
  q.plots[0].quality = 40;
  assert.equal(G.harvestAmount(q, 0), Math.max(1, c.yield - 1));
  G.harvest(q, 0);
  assert.equal(q.inventory.carrot, Math.max(1, c.yield - 1));
});
test("green beans regrow with the same remaining harvest count, require new watering and finish normally", () => {
  const s = planted("beans"),
    c = G.crops.find((c) => c.id === "beans");
  for (let round = 0; round <= c.repeat; round++) {
    s.plots[0].age = c.days;
    G.harvest(s, 0);
    assert.equal(s.inventory.beans, (round + 1) * c.yield);
    assert.equal(G.harvestAll(s).plots, 0);
    if (round < c.repeat) {
      assert.equal(s.plots[0].age, 0);
      assert.equal(s.plots[0].watered, false);
      assert.equal(s.plots[0].left, c.repeat - round - 1);
      G.waterPlot(s, 0);
      G.endDay(s);
      assert.equal(s.plots[0].age, 1);
    } else assert.equal(s.plots[0], null);
  }
});
test("1,000 manual days remain endless without resetting seeds, ripe crops, wallet or treasures", () => {
  const s = planted();
  s.cash = 1000;
  G.purchaseDream(s, "ball");
  const cash = s.cash,
    purchases = structuredClone(s.dreamPurchases),
    seeds = structuredClone(s.seeds);
  for (let i = 0; i < 1000; i++) {
    G.water(s);
    G.endDay(s);
  }
  assert.equal(G.farmDay(s), 1001);
  assert.deepEqual(s.seeds, seeds);
  assert.deepEqual(s.dreamPurchases, purchases);
  assert.equal(s.cash, cash);
  assert.equal(s.plots[0].age, 3);
  assert.deepEqual(s.inventory, {});
  const r = G.recover(JSON.stringify(s));
  assert.equal(G.farmDay(r), 1001);
  assert.deepEqual(r.plots, s.plots);
  assert.deepEqual(r.dreamPurchases, purchases);
});
test("legacy calendar/date records, market customer history and reports agree on continuous farming day", () => {
  const s = planted();
  s.season = 7;
  s.day = 20;
  s.cash = 1000;
  G.purchaseDream(s, "camera");
  s.inventory.corn = s.display.corn = 10;
  s.bagCount = 4;
  G.openMarket(s);
  G.newCustomer(s, "Maya");
  assert.equal(s.customerHistory.people.Maya.lastDay, G.farmDay(s));
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.day, 20);
  assert.equal(r.season, 7);
  assert.equal(G.farmDay(r), 140);
  assert.equal(G.farmDay(r.dreamPurchases.camera), 140);
  assert.equal(G.farmDay(G.accountingReport(r)), 140);
  G.closeMarket(r);
  G.water(r);
  G.endDay(r);
  assert.equal(G.farmDay(r), 141);
  assert.equal(r.day, 1);
  assert.equal(r.season, 8);
  assert.equal(G.farmDay(r.lastMarketReport), 140);
  assert.deepEqual(r.dreamPurchases, s.dreamPurchases);
  assert.deepEqual(r.customerHistory, s.customerHistory);
});
test("an in-progress market and optional garden save data recover without losing state or new schema fields", () => {
  const s = planted("beans");
  s.inventory.corn = s.display.corn = 10;
  s.bagCount = 4;
  G.openMarket(s);
  G.newCustomer(s, "Noah");
  G.greet(s);
  s.customer.want = { corn: 1 };
  s.basket = { corn: 1 };
  G.ring(s, G.totalOrder(s));
  G.pauseMarketClock(s);
  for (const c of G.crops) s.display[c.id] ||= 0;
  const r = G.recover(JSON.stringify(s));
  for (const key of [
    "cash",
    "seeds",
    "plots",
    "inventory",
    "display",
    "dreamPurchases",
    "clubhousePositions",
    "customerHistory",
    "customer",
    "basket",
    "change",
    "step",
    "marketElapsedMs",
    "rentals",
    "equipmentDebt",
  ])
    assert.deepEqual(r[key], s[key], key);
  assert.equal(r.version, 1);
});
test("garden harvest stock flows through the existing stand and successful market sale once", () => {
  const s = planted(),
    c = G.crops.find((c) => c.id === "carrot");
  s.plots[0].age = c.days;
  G.harvest(s, 0);
  s.owned.scale = 1;
  s.bagCount = 3;
  G.addAllToDisplay(s);
  assert.equal(s.display.carrot, c.yield);
  G.openMarket(s);
  G.newCustomer(s, "Maya");
  G.greet(s);
  s.customer.want = { carrot: 1 };
  s.basket = { carrot: 1 };
  const total = G.totalOrder(s),
    cash = s.cash;
  G.ring(s, total);
  s.change = G.changeDue(s);
  G.finish(s);
  assert.equal(s.inventory.carrot, c.yield - 1);
  assert.equal(s.display.carrot, c.yield - 1);
  assert.equal(s.bagCount, 2);
  assert.equal(s.cash, cash + total);
  assert.throws(() => G.finish(s));
  assert.equal(s.cash, cash + total);
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.inventory.carrot, c.yield - 1);
  assert.equal(r.cash, s.cash);
});
test("ripe plants reset the watered-today badge on a new day without growing or losing yield", () => {
  const s = planted();
  s.plots[0].age = 3;
  const amount = G.harvestAmount(s, 0);
  G.water(s);
  G.endDay(s);
  assert.equal(s.plots[0].watered, false);
  assert.equal(s.plots[0].age, 3);
  assert.equal(G.harvestAmount(s, 0), amount);
  assert.deepEqual(G.plantsNeedingWater(s), []);
});
