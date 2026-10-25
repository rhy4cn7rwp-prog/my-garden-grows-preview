const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
const START = 1800000000000,
  END = START + 1200000;
function farm() {
  const s = G.initial();
  s.inventory.carrot = s.display.carrot = 100;
  s.bagCount = 30;
  return s;
}
test("exactly five real seconds per game minute, four hours per twenty minutes", () => {
  const s = farm();
  G.openMarket(s, START);
  assert.equal(s.marketStartedAt, START);
  for (const [ms, minute] of [
    [0, 540],
    [4999, 540],
    [5000, 541],
    [300000, 600],
    [600000, 660],
    [900000, 720],
    [1199999, 779],
    [1200000, 780],
    [9999999, 780],
  ])
    assert.equal(G.marketTime(s, START + ms).wholeMinutes, minute);
  assert.equal(G.marketTime(s, START + 2500).minutes, 540.5);
  assert.equal(G.marketTime(s, END - 1).expired, false);
  assert.equal(G.marketTime(s, END).expired, true);
});
test("pause, recovery and long absence preserve exact fractional active time and farm fields", () => {
  const s = farm(); s.goal=2; s.seeds.carrot=7;
  G.openMarket(s, START);
  G.pauseMarketClock(s, START+12345);
  assert.equal(G.marketTime(s, END+999999).elapsedMs, 12345);
  const r=G.recover(JSON.stringify(s));
  assert.equal(G.marketTime(r, END+999999).elapsedMs, 12345);
  for(const k of ["cash","inventory","seeds","plots","goal","owned","bagCount"])
    assert.deepEqual(r[k],s[k]);
  G.resumeMarketClock(r, END);
  G.resumeMarketClock(r, END+1000); // duplicate focus cannot reset the anchor
  assert.equal(G.marketTime(r, END+7655).elapsedMs,20000);
  G.checkpointMarketClock(r, END+7655);
  const backup=G.recover("{bad",JSON.stringify(r));
  assert.equal(G.marketTime(backup, END+999999).elapsedMs,20000);
  G.syncMarketClock(backup,END+999999);
  assert.equal(backup.marketOpen,true);
});
test("idle deadline closes and settles deferred costs exactly once", () => {
  const s = farm();
  s.cash = 0;
  G.rentEquipment(s, "table", "deferred");
  G.openMarket(s, START);
  s.cash = s.sales = 8;
  G.syncMarketClock(s, END - 1);
  assert.equal(s.marketOpen, true);
  assert.equal(G.syncMarketClock(s, END), true);
  assert.equal(s.cash, 5);
  assert.equal(G.debtTotal(s), 0);
  G.syncMarketClock(s, END + 50000);
  G.closeMarket(s, END + 60000);
  assert.equal(s.cash, 5);
  assert.equal(
    s.marketExpenses
      .filter((e) => e.timing === "closing")
      .reduce((n, e) => n + e.cents, 0),
    300,
  );
  assert.equal(G.accountingReport(s).net, 5);
});
test("customer admitted before deadline may finish after expiry including exact change and farewell", () => {
  const s = farm();
  G.openMarket(s, START);
  G.newCustomer(s, "Maya", END - 1);
  G.greet(s);
  s.customer.want = { carrot: 1 };
  s.basket = { carrot: 1 };
  G.ring(s, 2);
  s.change = 3;
  const pending = JSON.stringify([
    s.customer,
    s.basket,
    s.change,
    s.bagCount,
    s.cash,
  ]);
  G.syncMarketClock(s, END + 600000);
  assert.equal(s.marketOpen, true);
  assert.equal(
    JSON.stringify([s.customer, s.basket, s.change, s.bagCount, s.cash]),
    pending,
  );
  assert.throws(() => G.newCustomer(s, "Noah", END + 600000), /closed/);
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.marketStartedAt, START);
  assert.equal(r.step, "pay");
  G.finish(r);
  assert.equal(r.cash, 52);
  assert.equal(r.bagCount, 29);
  assert.equal(r.step, "thanks");
  G.advanceCustomer(r, "excellent", END + 600001);
  assert.equal(r.marketOpen, false);
  assert.equal(r.customer, null);
  assert.equal(r.marketClosedAt, END);
  assert.throws(() => G.finish(r));
  assert.equal(r.cash, 52);
});
test("admission checks exact deadline and actual remaining produce with no visitor cap", () => {
  const s = farm();
  G.openMarket(s, START);
  s.visitors = 1000;
  G.newCustomer(s, "Maya", END - 1);
  assert.equal(s.visitors, 1001);
  s.customer = null;
  assert.throws(() => G.newCustomer(s, "Noah", END), /closed/);
  assert.equal(s.visitors, 1001);
  const empty = farm();
  G.openMarket(empty, START);
  empty.inventory.carrot = 0;
  assert.throws(() => G.newCustomer(empty, "Maya", START + 1), /sold out/);
  assert.equal(empty.visitors, 0);
});
test("early close freezes clock, cannot reopen, and end day resets only the next market timer", () => {
  const s = farm();
  G.openMarket(s, START);
  G.closeMarket(s, START + 15000);
  assert.equal(G.marketTime(s, END + 999999).wholeMinutes, 543);
  assert.equal(s.marketClosedAt, START + 15000);
  assert.throws(() => G.openMarket(s, END));
  const r = G.recover(JSON.stringify(s));
  assert.equal(G.marketTime(r, END).wholeMinutes, 543);
  G.endDay(r);
  assert.equal(r.marketStartedAt, null);
  assert.equal(r.marketClosedAt, null);
  G.openMarket(r, END + 5000);
  assert.equal(r.marketStartedAt, END + 5000);
  assert.equal(G.marketTime(r, END + 5000).wholeMinutes, 540);
});
test("legacy open saves migrate remaining recorded hours once, never reset on refresh", () => {
  const s = farm();
  s.marketOpen = s.marketPlayed = true;
  s.hour = 11;
  delete s.marketElapsedMs;
  delete s.marketStartedAt;
  delete s.marketClosedAt;
  const before = Date.now();
  const r = G.recover(JSON.stringify(s));
  const after = Date.now();
  assert.ok(
    r.marketStartedAt >= before - 600000 && r.marketStartedAt <= after - 600000,
  );
  assert.equal(G.recover(JSON.stringify(r)).marketStartedAt, r.marketStartedAt);
  assert.equal(r.hour, 11);
  assert.equal(G.marketTime(r,after+9999999).elapsedMs,600000);
  assert.equal(r.cash, 50);
});

test("old timestamp saves migrate recorded open time and exact early-close time without offline charges",()=>{
  const s=farm();G.openMarket(s,START);G.syncMarketClock(s,START+12345);
  delete s.marketElapsedMs;
  const r=G.recover(JSON.stringify(s));
  assert.equal(G.marketTime(r,END*2).wholeMinutes,542);
  const old=farm();G.openMarket(old,START);
  G.closeMarket(old,START+15000);delete old.marketElapsedMs;
  const closed=G.recover(JSON.stringify(old));
  assert.equal(G.marketTime(closed,END*2).elapsedMs,15000);
});
