const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  G = require("../src/game.js"),
  R = require("../src/market-supplies-rules.js");
const copy = (x) => JSON.parse(JSON.stringify(x));
test("provisional supply prices and pack quantities are explicit", () => {
  for (const [id, cents, n] of [
    ["bags5", 100, 5],
    ["bags20", 300, 20],
    ["boxes5", 300, 5],
    ["tags10", 100, 10],
    ["sign", 800, 1],
    ["basket", 500, 1],
  ]) {
    assert.equal(R.catalog[id].cents, cents);
    assert.equal(R.catalog[id].count, n);
  }
  assert.equal(G.supplies.table, 8);
  assert.equal(G.supplies.canopy, 10);
  assert.equal(G.supplies.scale, 5);
});
test("bulk bags cost less per unit and save exactly one dollar at equal quantity", () => {
  const a = G.initial(),
    b = G.initial();
  a.marketSupplyCart = { bags5: 4 };
  b.marketSupplyCart = { bags20: 1 };
  G.purchaseMarketSupplies(a);
  G.purchaseMarketSupplies(b);
  assert.equal(a.bagCount, 20);
  assert.equal(b.bagCount, 20);
  assert.equal(b.cash - a.cash, 1);
  assert.equal(R.catalog.bags5.cents / 5, 20);
  assert.equal(R.catalog.bags20.cents / 20, 15);
});
test("mixed supplies charge exactly once, separate stocks and record expenses", () => {
  const s = G.initial(),
    before = copy(s);
  s.marketSupplyCart = {
    bags5: 1,
    bags20: 1,
    boxes5: 1,
    tags10: 1,
    sign: 1,
    basket: 1,
  };
  assert.equal(R.total(s), 21);
  const receipt = G.purchaseMarketSupplies(s);
  assert.equal(receipt.total, 21);
  assert.equal(s.cash, 29);
  assert.equal(s.bagCount, 25);
  assert.deepEqual(s.marketSupplyStock, {
    consumables: { boxes: 5, priceTags: 10 },
    reusable: { marketSigns: 1, produceBaskets: 1 },
  });
  assert.deepEqual(s.marketSupplyCart, {});
  assert.equal(s.owned.bags, 0);
  assert.equal(
    s.marketExpenses.reduce((a, e) => a + e.cents, 0),
    2100,
  );
  assert.equal(G.accountingReport(s).net, -21);
  const cash = s.cash;
  G.settleMarket(s);
  G.settleMarket(s);
  assert.equal(s.cash, cash);
  for (const k of Object.keys(before).filter(
    (k) =>
      ![
        "marketSupplyCart",
        "marketSupplyStock",
        "bagCount",
        "cash",
        "marketExpenses",
        "marketSettled",
      ].includes(k),
  ))
    assert.deepEqual(s[k], before[k], k);
});
test("reusables can be owned in multiples and remain available across seasons", () => {
  const s = G.initial();
  s.marketSupplyCart = { sign: 2, basket: 3, boxes5: 2, tags10: 1 };
  G.purchaseMarketSupplies(s);
  const expected = copy(s.marketSupplyStock);
  s.day = 20;
  G.endDay(s);
  assert.equal(s.season, 2);
  assert.deepEqual(s.marketSupplyStock, expected);
  assert.equal(expected.reusable.marketSigns, 2);
  assert.equal(expected.reusable.produceBaskets, 3);
});
test("empty, malformed, negative, fractional and unaffordable orders are atomic", () => {
  for (const cart of [
    {},
    { bags5: -1 },
    { boxes5: 0.5 },
    { sign: 101 },
    { unknown: 1 },
    { bags20: 100 },
  ]) {
    const s = G.initial();
    s.marketSupplyCart = cart;
    const before = copy(s);
    assert.throws(() => G.purchaseMarketSupplies(s));
    assert.deepEqual(s, before);
  }
});
test("valid new stocks, pending carts and expense reports survive normal and backup recovery", () => {
  let s = G.initial();
  s.marketSupplyCart = { boxes5: 1, sign: 1, bags5: 1 };
  G.purchaseMarketSupplies(s);
  s.marketSupplyCart = { tags10: 2 };
  s.supcart = { scale: 1 };
  s.lastMarketReport = G.accountingReport(s);
  const raw = JSON.stringify(s);
  for (const recovered of [G.recover(raw), G.recover("{bad", raw)]) {
    assert.equal(recovered.cash, 38);
    assert.equal(recovered.bagCount, 5);
    assert.deepEqual(recovered.marketSupplyStock, s.marketSupplyStock);
    assert.deepEqual(recovered.marketSupplyCart, { tags10: 2 });
    assert.deepEqual(recovered.supcart, { scale: 1 });
    assert.deepEqual(recovered.lastMarketReport, s.lastMarketReport);
  }
});
test("old saves retain their exact bag stock and receive empty additive supply storage", () => {
  const s = G.initial();
  delete s.marketSupplyStock;
  delete s.marketSupplyCart;
  delete s.bagCount;
  s.owned.bags = 3;
  s.cash = 19;
  s.seeds.strawberry = 4;
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.bagCount, 30);
  assert.deepEqual(r.marketSupplyStock, R.emptyStock());
  assert.equal(r.cash, 19);
  assert.equal(r.seeds.strawberry, 4);
  r.marketSupplyCart = { bags5: 1 };
  G.purchaseMarketSupplies(r);
  assert.equal(r.bagCount, 35);
  assert.equal(r.owned.bags, 3);
  assert.equal(G.recover(JSON.stringify(r)).bagCount, 35);
});
test("corrupt optional supply fields cannot reset the farm or invent stock", () => {
  const s = G.initial();
  s.cash = 24;
  s.bagCount = 7;
  s.marketSupplyStock = {
    consumables: { boxes: -4, priceTags: 1.2 },
    reusable: { marketSigns: 2, produceBaskets: "bad" },
  };
  s.marketSupplyCart = { boxes5: 3, bags20: -1, unknown: 10 };
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.cash, 24);
  assert.equal(r.bagCount, 7);
  assert.deepEqual(r.marketSupplyStock, {
    consumables: { boxes: 0, priceTags: 0 },
    reusable: { marketSigns: 2, produceBaskets: 0 },
  });
  assert.deepEqual(r.marketSupplyCart, { boxes5: 3 });
});
test("existing paid and rental bag rules use one authoritative pool with no new consumption rules", () => {
  const s = G.initial();
  G.rentEquipment(s, "bags", "upfront");
  const rental = s.rentalBagsRemaining;
  s.marketSupplyCart = { bags5: 1, boxes5: 1, tags10: 1 };
  G.purchaseMarketSupplies(s);
  assert.equal(s.bagCount, 5);
  assert.equal(s.rentalBagsRemaining, rental);
  assert.equal(G.bagsRemaining(s), 15);
  assert.deepEqual(R.inventory(s).consumables, {
    bags: 5,
    boxes: 5,
    priceTags: 10,
  });
});

test("sales need no new supplies and leave boxes, tags and reusable stock untouched", () => {
  for (const extra of [false, true]) {
    const s = G.initial();
    s.bagCount = 1;
    s.marketOpen = true;
    s.marketPlayed = true;
    if (extra)
      s.marketSupplyStock = {
        consumables: { boxes: 5, priceTags: 10 },
        reusable: { marketSigns: 1, produceBaskets: 2 },
      };
    const expected = copy(s.marketSupplyStock);
    s.inventory.carrot = 2;
    s.display.carrot = 2;
    s.customer = {
      name: "Maya",
      want: { carrot: 1 },
      personality: "curious",
      decision: 50,
      satisfaction: 50,
      response: "arrival",
    };
    G.greet(s);
    s.basket = { carrot: 1 };
    G.ring(s, 2);
    s.change = s.tendered - 2;
    G.finish(s);
    assert.equal(s.bagCount, 0);
    assert.equal(s.cash, 52);
    assert.deepEqual(s.marketSupplyStock, expected);
  }
});
