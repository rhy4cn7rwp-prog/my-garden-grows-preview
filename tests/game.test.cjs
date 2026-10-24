const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
function stocked(cash = 50) {
  const s = G.initial();
  s.cash = cash;
  s.bagCount = 100;
  s.inventory.corn = 100;
  s.display.corn = 100;
  return s;
}
function sell(s) {
  G.newCustomer(s, "Maya");
  G.greet(s);
  // Isolate capacity/accounting from the separately tested sold-out service paths.
  const item = G.crops.find((c) => G.marketStock(s, c.id) > 0);
  s.customer.want = {
    [item.id]: Math.min(G.marketStock(s, item.id), ((s.visitors - 1) % 2) + 1),
  };
  s.basket = { ...s.customer.want };
  G.ring(s, G.totalOrder(s));
  s.change = s.tendered - G.totalOrder(s);
  G.finish(s);
  G.advanceCustomer(s);
}
function legacy() {
  const s = stocked(17.25);
  s.goal = 3;
  s.seeds.carrot = 7;
  s.owned.scale = 1;
  s.plots[2] = { id: "beans", age: 2, left: 1, quality: 88, watered: true };
  delete s.standMode;
  delete s.tableRented;
  return s;
}
test("legacy saves preserve cash, seeds, crops, equipment, goal and calendar", () => {
  const s = legacy();
  s.day = 20;
  s.season = 4;
  const r = G.recover(JSON.stringify(s));
  for (const k of [
    "cash",
    "goal",
    "day",
    "season",
    "seeds",
    "plots",
    "owned",
    "inventory",
  ])
    assert.deepEqual(r[k], s[k]);
  assert.equal(r.standMode, "blanket");
  assert.equal(r.tableRented, false);
  s.owned.table = 1;
  assert.equal(G.recover(JSON.stringify(s)).standMode, "owned");
});
test("selecting rental does not charge; market opening charges exactly $1", () => {
  const s = stocked();
  G.chooseStand(s, "rental");
  assert.equal(s.cash, 50);
  G.openMarket(s);
  assert.equal(s.cash, 49);
  assert.equal(G.customerLimit(s), 6);
  assert.equal(s.tableRented, true);
  assert.throws(() => G.openMarket(s));
  assert.equal(s.cash, 49);
});
test("rental needs produce and enough cash; failures leave money and market unchanged", () => {
  const s = G.initial();
  G.chooseStand(s, "rental");
  assert.throws(() => G.openMarket(s));
  assert.equal(s.cash, 50);
  s.display.corn = 1;
  s.inventory.corn = 1;
  s.cash = 0.99;
  assert.throws(() => G.openMarket(s));
  assert.equal(s.cash, 0.99);
  assert.equal(s.marketPlayed, false);
  assert.equal(s.tableRented, false);
  G.chooseStand(s, "blanket");
  G.openMarket(s);
  assert.equal(s.cash, 0.99);
});
test("a paid rental survives reload without a duplicate charge", () => {
  const s = stocked();
  G.chooseStand(s, "rental");
  G.openMarket(s);
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.cash, 49);
  assert.equal(G.customerLimit(r), 6);
  assert.throws(() => G.openMarket(r));
  assert.equal(r.cash, 49);
});
test("rentals expire at day/season end and never auto-renew", () => {
  const s = stocked();
  s.day = 20;
  G.chooseStand(s, "rental");
  G.openMarket(s);
  G.closeMarket(s);
  assert.throws(() => G.openMarket(s));
  G.endDay(s);
  assert.equal(s.season, 2);
  assert.equal(s.day, 1);
  assert.equal(s.tableRented, false);
  assert.equal(s.standMode, "blanket");
  G.openMarket(s);
  assert.equal(s.cash, 49);
  assert.equal(G.customerLimit(s), 3);
});
test("owned tables are free; purchases select owned stand and cannot be duplicated", () => {
  const s = stocked();
  s.supcart.table = 1;
  G.purchase(s, "supplies");
  assert.equal(s.cash, 42);
  assert.equal(s.standMode, "owned");
  G.openMarket(s);
  assert.equal(s.cash, 42);
  assert.equal(G.customerLimit(s), 6);
  s.supcart.table = 1;
  assert.throws(() => G.purchase(s, "supplies"));
});
test("players may choose a free blanket even with an owned table", () => {
  const s = stocked();
  s.owned.table = 1;
  G.chooseStand(s, "blanket");
  G.openMarket(s);
  assert.equal(G.customerLimit(s), 3);
  assert.equal(s.cash, 50);
  assert.throws(() => G.chooseStand(s, "owned"));
});
test("blanket has fewer customers and less sales opportunity than rented table", () => {
  const a = stocked(),
    b = stocked();
  G.openMarket(a);
  G.chooseStand(b, "rental");
  G.openMarket(b);
  for (let i = 0; i < 3; i++) sell(a);
  assert.throws(() => G.newCustomer(a, "Noah"));
  for (let i = 0; i < 6; i++) sell(b);
  assert.throws(() => G.newCustomer(b, "Noah"));
  assert.equal(a.sales, 12);
  assert.equal(b.sales, 27);
  assert.equal(b.cash, 76);
  assert.ok(b.hour < 13);
});
test("order completion and advancing cannot double-credit a sale", () => {
  const s = stocked();
  G.openMarket(s);
  assert.throws(() => G.advanceCustomer(s));
  G.newCustomer(s, "Maya");
  G.greet(s);
  s.basket = { ...s.customer.want };
  assert.throws(() => G.ring(s, 99));
  G.ring(s, 3);
  assert.throws(() => G.finish(s));
  s.change = 2;
  G.finish(s);
  assert.equal(s.cash, 53);
  assert.throws(() => G.finish(s));
});
test("seed help is free and cannot be repeatedly collected while seeds remain", () => {
  const s = G.initial();
  s.cash = 0;
  assert.equal(G.canReceiveSeedHelp(s), true);
  G.receiveSeedHelp(s);
  assert.equal(s.cash, 0);
  assert.equal(s.seeds.carrot, 3);
  assert.throws(() => G.receiveSeedHelp(s));
  assert.equal(s.seeds.carrot, 3);
});
test("help eligibility considers spendable money, seeds, plants, harvest and weighing equipment", () => {
  const s = G.initial();
  s.cash = 1;
  assert.equal(G.canReceiveSeedHelp(s), false);
  s.cash = 0.5;
  s.seeds.beans = 2;
  assert.equal(G.canReceiveSeedHelp(s), true);
  s.owned.scale = 1;
  s.bagCount = 1;
  assert.equal(G.canReceiveSeedHelp(s), false);
  s.seeds = {};
  s.inventory.corn = 2;
  assert.equal(G.canReceiveSeedHelp(s), false);
  s.inventory = {};
  s.plots[0] = { id: "carrot", age: 0, left: 0, quality: 100, watered: false };
  assert.equal(G.canReceiveSeedHelp(s), false);
});
test("a bankrupt farm can grow donated seeds and earn money without reset or equipment", () => {
  let s = G.initial();
  s.cash = 0;
  s.goal = 4;
  G.receiveSeedHelp(s);
  G.plan(s, 0, "carrot");
  G.plantPlan(s);
  for (let i = 0; i < 3; i++) {
    G.water(s);
    G.endDay(s);
  }
  assert.match(G.harvest(s, 0), /free to replant/);
  s.display.carrot = s.inventory.carrot;
  G.openMarket(s);
  sell(s);
  assert.equal(s.cash, 2);
  assert.equal(s.goal, 4);
  s = G.recover(JSON.stringify(s));
  assert.equal(s.cash, 2);
  assert.equal(s.seeds.carrot, 2);
});
test("invalid additive rental fields are normalized without resetting a valid legacy farm", () => {
  const s = legacy();
  s.standMode = "unknown";
  s.tableRented = "yes";
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.cash, 17.25);
  assert.equal(r.standMode, "blanket");
  assert.equal(r.tableRented, false);
});
test("corrupt primary still restores a valid previous save", () => {
  const s = legacy();
  assert.equal(G.recover("{broken", JSON.stringify(s)).cash, 17.25);
});
