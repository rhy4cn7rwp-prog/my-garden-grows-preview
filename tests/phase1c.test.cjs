const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
function stock(cash = 50) {
  const s = G.initial();
  s.cash = cash;
  s.inventory = { corn: 20, beans: 20 };
  s.display = { corn: 20, beans: 20 };
  s.owned.scale = 1;
  return s;
}
function ready(s, want) {
  if (!s.marketOpen) G.openMarket(s);
  G.newCustomer(s, "Maya");
  s.customer.want = want;
  G.greet(s);
  s.basket = { ...want };
  G.ring(s, G.totalOrder(s));
  s.change = Math.round((s.tendered - G.totalOrder(s)) * 100) / 100;
}
function sold(s, want) {
  ready(s, want);
  G.finish(s);
  G.advanceCustomer(s);
}
test("repeat 10-pack purchases add exactly ten each and record each cash payment once", () => {
  const s = stock();
  s.supcart.bags = 2;
  G.purchase(s, "supplies");
  assert.equal(s.bagCount, 20);
  assert.equal(s.cash, 44);
  s.supcart.bags = 1;
  G.purchase(s, "supplies");
  assert.equal(s.bagCount, 30);
  G.buyBagPacks(s);
  assert.equal(s.bagCount, 40);
  assert.equal(s.cash, 38);
  assert.equal(G.accountingReport(s).paid, 12);
  assert.throws(() => G.buyBagPacks(s, -1));
  assert.equal(s.bagCount, 40);
});
test("replenishing during an order preserves customer, basket, clock, visits and supply cart", () => {
  const s = stock();
  G.openMarket(s);
  G.newCustomer(s, "Maya");
  G.greet(s);
  s.basket = { corn: 1 };
  s.supcart.canopy = 1;
  const before = JSON.stringify([
    s.customer,
    s.basket,
    s.hour,
    s.visitors,
    s.sales,
    s.step,
    s.supcart,
  ]);
  G.buyBagPacks(s);
  assert.equal(
    JSON.stringify([
      s.customer,
      s.basket,
      s.hour,
      s.visitors,
      s.sales,
      s.step,
      s.supcart,
    ]),
    before,
  );
  assert.equal(s.bagCount, 10);
});
test("one mixed multi-vegetable transaction consumes exactly one bag only on success", () => {
  const s = stock();
  s.bagCount = 2;
  ready(s, { beans: 2, corn: 3 });
  s.change = 99;
  assert.throws(() => G.finish(s));
  assert.equal(s.bagCount, 2);
  assert.equal(s.customersServed, 0);
  s.change = s.tendered - G.totalOrder(s);
  G.finish(s);
  assert.equal(s.bagCount, 1);
  assert.equal(s.customersServed, 1);
  assert.throws(() => G.finish(s));
  assert.equal(s.bagCount, 1);
});
test("bag exhaustion restricts only loose orders, with no negative counts or blanket lockout", () => {
  const s = stock();
  sold(s, { corn: 1 });
  assert.equal(s.bagCount, 0);
  G.newCustomer(s, "Noah");
  s.customer.want = { beans: 1 };
  G.greet(s);
  s.basket = { beans: 1 };
  assert.throws(() => G.ring(s, 4));
  assert.equal(s.inventory.beans, 20);
  G.buyBagPacks(s);
  G.ring(s, 4);
  s.change = 1;
  G.finish(s);
  assert.equal(s.bagCount, 9);
  assert.equal(s.customersServed, 2);
});
test("a lost bag between totaling and finishing cannot complete a loose-produce sale", () => {
  const s = stock();
  s.bagCount = 1;
  ready(s, { beans: 1 });
  s.bagCount = 0;
  assert.throws(() => G.finish(s));
  assert.equal(s.cash, 50);
  assert.equal(s.inventory.beans, 20);
  assert.equal(s.bagCount, 0);
});
test("insufficient funds or invalid bag quantities cause no changes", () => {
  const s = stock(2);
  const before = JSON.stringify(s);
  assert.throws(() => G.buyBagPacks(s));
  assert.throws(() => G.buyBagPacks(s, 101));
  assert.equal(JSON.stringify(s), before);
});
test("legacy packs and daily-use access migrate once without charges or a farm reset", () => {
  let s = stock(17.25);
  s.owned.bags = 1;
  delete s.bagCount;
  delete s.rentalBagsRemaining;
  s = G.recover(JSON.stringify(s));
  assert.equal(s.bagCount, 10);
  assert.equal(s.cash, 17.25);
  s = G.recover(JSON.stringify(s));
  assert.equal(s.bagCount, 10);
  assert.equal(s.cash, 17.25);
  const old = stock();
  old.rentals.bags = { payment: "upfront" };
  delete old.rentalBagsRemaining;
  assert.equal(G.recover(JSON.stringify(old)).rentalBagsRemaining, 10);
});
test("rented bags are consumed first and expire, purchased leftovers persist", () => {
  const s = stock();
  s.cash = 0;
  G.rentEquipment(s, "bags", "deferred");
  s.cash = 3;
  G.buyBagPacks(s);
  sold(s, { beans: 1 });
  assert.equal(s.rentalBagsRemaining, 9);
  assert.equal(s.bagCount, 10);
  G.endDay(s);
  assert.equal(s.rentalBagsRemaining, 0);
  assert.equal(s.bagCount, 10);
  assert.equal(G.bagsRemaining(s), 10);
});
test("saved active checkout, bag purchase, and completed sale resume without duplication", () => {
  let s = stock();
  s.bagCount = 1;
  ready(s, { beans: 1 });
  G.buyBagPacks(s);
  s = G.recover(JSON.stringify(s));
  assert.equal(s.step, "pay");
  assert.equal(s.customer.name, "Maya");
  assert.equal(s.bagCount, 11);
  assert.equal(s.change, 1);
  G.finish(s);
  s = G.recover(JSON.stringify(s));
  assert.equal(s.step, "thanks");
  assert.equal(s.customersServed, 1);
  assert.equal(s.bagCount, 10);
  assert.throws(() => G.finish(s));
  assert.equal(s.cash, 51);
});
test("invalid pending orders recover safely without taking stock or money", () => {
  const s = stock();
  s.marketOpen = true;
  s.marketPlayed = true;
  s.customer = { name: "Maya", want: { corn: 999999 } };
  s.step = "pay";
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.customer, null);
  assert.equal(r.cash, 50);
  assert.equal(r.inventory.corn, 20);
});
test("$18 sales less $1 table fee gives $17 net and matches actual cash movement", () => {
  const s = stock();
  G.rentEquipment(s, "table", "upfront");
  sold(s, { corn: 6 });
  G.closeMarket(s);
  const report = G.accountingReport(s);
  assert.equal(report.sales, 18);
  assert.equal(report.customers, 1);
  assert.equal(report.paid, 1);
  assert.equal(report.net, 17);
  assert.equal(s.cash - 50, 17);
  G.closeMarket(s);
  assert.equal(G.accountingReport(s).net, 17);
  assert.equal(s.cash, 67);
});
test("deferred closing payments are recorded once, with partial debt carried separately", () => {
  const s = stock(0);
  s.owned.scale = 0;
  G.rentEquipment(s, "table", "deferred");
  G.rentEquipment(s, "scale", "deferred");
  G.rentEquipment(s, "bags", "deferred");
  sold(s, { beans: 1 });
  G.closeMarket(s);
  let report = G.accountingReport(s);
  assert.equal(report.sales, 4);
  assert.equal(report.paid, 4);
  assert.equal(report.net, 0);
  assert.equal(report.carry, 2);
  assert.deepEqual(
    report.expenses.map((e) => [e.category, e.cents, e.timing]),
    [
      ["table", 300, "closing"],
      ["scale", 100, "closing"],
    ],
  );
  G.closeMarket(s);
  assert.deepEqual(G.accountingReport(s), report);
});
test("manual and closing repayments are separate payments, never double-counted", () => {
  const s = stock(0);
  G.rentEquipment(s, "table", "deferred");
  s.cash = 1;
  G.payOutstanding(s);
  sold(s, { corn: 1 });
  G.closeMarket(s);
  const r = G.accountingReport(s);
  assert.equal(r.paid, 3);
  assert.equal(r.net, 0);
  assert.equal(r.carry, 0);
  assert.equal(s.cash, 1);
  assert.deepEqual(
    r.expenses.map((e) => e.timing),
    ["manual", "closing"],
  );
});
test("bags, scale, other supply costs are included, seed costs explicitly remain outside market net", () => {
  const s = stock();
  s.owned.scale = 0;
  s.cart.carrot = 1;
  G.purchase(s, "seeds");
  s.supcart = { table: 1, scale: 1, canopy: 1, bags: 2 };
  G.purchase(s, "supplies");
  sold(s, { corn: 6 });
  G.closeMarket(s);
  const r = G.accountingReport(s);
  assert.equal(r.paid, 29);
  assert.equal(r.net, -11);
  assert.equal(s.cash, 38);
  assert.equal(s.cash - 50, r.net - 1);
});
test("customers served excludes shoppers who leave without buying", () => {
  const s = stock();
  G.openMarket(s);
  G.newCustomer(s, "Noah");
  s.step = "thanks";
  G.advanceCustomer(s);
  sold(s, { corn: 1 });
  assert.equal(s.visitors, 2);
  assert.equal(G.accountingReport(s).customers, 1);
});
test("End Day keeps a saved accounting report while resetting only daily counters", () => {
  let s = stock();
  G.buyBagPacks(s);
  sold(s, { beans: 1 });
  G.endDay(s);
  assert.equal(s.lastMarketReport.net, 1);
  assert.equal(s.lastMarketReport.customers, 1);
  assert.equal(s.customersServed, 0);
  assert.equal(s.bagCount, 9);
  assert.equal(s.marketExpenses.length, 0);
  s = G.recover(JSON.stringify(s));
  assert.equal(s.lastMarketReport.net, 1);
  assert.equal(s.bagCount, 9);
});
test("legacy known fees are included in the report without recharging or inventing customer counts", () => {
  let s = stock(22);
  s.marketPlayed = true;
  s.marketSettled = true;
  s.rentalUpfrontPaid = 1;
  s.rentals.table = { payment: "upfront" };
  s.tableRented = true;
  s.marketChargesPaid = 2;
  delete s.marketExpenses;
  delete s.customersServed;
  delete s.legacyAccounting;
  s = G.recover(JSON.stringify(s));
  assert.equal(s.cash, 22);
  assert.equal(G.accountingReport(s).paid, 3);
  assert.equal(G.accountingReport(s).legacy, true);
  G.closeMarket(s);
  assert.equal(s.cash, 22);
});
test("invalid negative bag save restores the valid backup", () => {
  const backup = stock(12);
  backup.bagCount = 7;
  const broken = { ...backup, bagCount: -1 };
  const s = G.recover(JSON.stringify(broken), JSON.stringify(backup));
  assert.equal(s.bagCount, 7);
  assert.equal(s.cash, 12);
});
test("cent denominations combine into exact change and leave one successful transaction", () => {
  const s = stock();
  s.bagCount = 1;
  ready(s, { beans: 1 });
  s.change = 0;
  for (const v of [
    0.25, 0.25, 0.25, 0.1, 0.05, 0.05, 0.01, 0.01, 0.01, 0.01, 0.01,
  ])
    s.change = Math.round((s.change + v) * 100) / 100;
  assert.equal(s.change, 1);
  G.finish(s);
  assert.equal(s.cash, 54);
  assert.equal(s.bagCount, 0);
  assert.equal(s.customersServed, 1);
});
