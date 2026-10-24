const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
function checkout(want, bags = 2) {
  const s = G.initial();
  s.bagCount = bags;
  s.owned.scale = 1;
  s.marketPlayed = true;
  s.marketOpen = true;
  s.customer = { name: "Maya", want };
  s.step = "choose";
  s.basket = { ...want };
  for (const [id, n] of Object.entries(want)) {
    s.inventory[id] = n;
    s.display[id] = n;
  }
  G.ring(s, G.totalOrder(s));
  s.change = s.tendered - G.totalOrder(s);
  return s;
}
test("every produce type and a mixed multi-item order uses one bag per successful sale", () => {
  for (const want of [
    { corn: 3 },
    { carrot: 2 },
    { beans: 2 },
    { corn: 2, onion: 3, beans: 1 },
  ]) {
    const s = checkout(want);
    G.finish(s);
    assert.equal(G.bagsRemaining(s), 1);
    assert.equal(s.customersServed, 1);
    assert.throws(() => G.finish(s));
    assert.equal(G.bagsRemaining(s), 1);
  }
});
test("empty bags preserve a totaled checkout and counted change through refill and reload", () => {
  let s = checkout({ corn: 2 }, 0);
  assert.equal(s.step, "pay");
  const progress = JSON.stringify([
    s.customer,
    s.basket,
    s.tendered,
    s.change,
    s.hour,
    s.visitors,
  ]);
  assert.throws(() => G.finish(s));
  G.buyBagPacks(s);
  assert.equal(
    JSON.stringify([
      s.customer,
      s.basket,
      s.tendered,
      s.change,
      s.hour,
      s.visitors,
    ]),
    progress,
  );
  s = G.recover(JSON.stringify(s));
  G.finish(s);
  assert.equal(s.bagCount, 9);
  assert.equal(s.cash, 53);
});
test("wrong change, skipped shoppers and abandoned checkouts never consume a bag", () => {
  const s = checkout({ corn: 2 }, 1);
  s.change = 0;
  assert.throws(() => G.finish(s));
  assert.equal(s.bagCount, 1);
  s.step = "thanks";
  G.advanceCustomer(s);
  assert.equal(s.bagCount, 1);
  const another = checkout({ onion: 1 }, 1);
  G.closeMarket(another);
  assert.equal(another.bagCount, 1);
  assert.equal(another.customersServed, 0);
});
test("financial recovery donates bags without duplicating viable existing seeds", () => {
  const s = G.initial();
  s.cash = 0;
  s.seeds.carrot = 1;
  s.equipmentDebt = [{ id: "table", cents: 300, day: "1:1" }];
  s.day = 2;
  assert.equal(G.canReceiveSeedHelp(s), true);
  G.receiveSeedHelp(s);
  assert.equal(s.bagCount, 3);
  assert.equal(s.seeds.carrot, 1);
  assert.throws(() => G.receiveSeedHelp(s));
  assert.equal(G.debtTotal(s), 3);
});
