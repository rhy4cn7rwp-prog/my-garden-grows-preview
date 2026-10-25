const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
function stand() {
  const s = G.initial();
  s.marketOpen = s.marketPlayed = true;
  s.bagCount = 3;
  s.owned.scale = 1;
  s.inventory = {
    carrot: 5,
    tomato: 3,
    cucumber: 4,
    corn: 3,
    lettuce: 2,
    beans: 4,
  };
  s.display = {
    ...s.display,
    carrot: 4,
    tomato: 2,
    cucumber: 3,
    corn: 3,
    lettuce: 2,
    beans: 2,
  };
  s.customer = {
    name: "Maya",
    want: { carrot: 2, tomato: 1 },
    personality: "curious",
    decision: 50,
    satisfaction: 50,
  };
  s.step = "choose";
  return s;
}
function finances(s) {
  return JSON.stringify([
    G.crops.map((c) => [s.inventory[c.id] || 0, s.display[c.id] || 0]),
    s.cash,
    s.sales,
    s.bagCount,
    s.rentalBagsRemaining,
    s.marketExpenses,
    s.equipmentDebt,
  ]);
}
test("order check rejects wrong produce, under/over quantities and wrong totals without any financial or inventory change", () => {
  const s = stand(),
    before = finances(s);
  for (const basket of [
    { carrot: 1, tomato: 1 },
    { carrot: 3, tomato: 1 },
    { carrot: 2, tomato: 1, corn: 1 },
    { corn: 2 },
  ]) {
    s.basket = basket;
    assert.throws(() => G.checkBasket(s));
    assert.throws(() => G.ring(s, G.totalOrder(s)));
    assert.equal(s.step, "choose");
    assert.equal(finances(s), before);
  }
  s.basket = { carrot: 2, tomato: 1 };
  assert.doesNotThrow(() => G.checkBasket(s));
  assert.throws(() => G.ring(s, 8));
  G.ring(s, 7);
  assert.equal(finances(s), before);
  s.change = 3;
  G.finish(s);
  assert.equal(s.cash, 57);
  assert.equal(s.inventory.carrot, 3);
  assert.equal(s.inventory.tomato, 2);
  assert.equal(s.inventory.corn, 3);
  assert.equal(s.bagCount, 2);
  assert.throws(() => G.finish(s));
});
test("mistaken baskets, extra produce and excess requested quantities survive refresh for another attempt", () => {
  let s = stand();
  s.basket = { carrot: 3, tomato: 1, corn: 1 };
  const before = finances(s);
  s = G.recover(JSON.stringify(s));
  assert.deepEqual(s.basket, { carrot: 3, tomato: 1, corn: 1 });
  assert.equal(s.step, "choose");
  assert.equal(finances(s), before);
  assert.throws(() => G.ring(s, 12));
  s.basket = { carrot: 2, tomato: 1 };
  G.ring(s, 7);
  s.change = 3;
  s = G.recover(JSON.stringify(s));
  assert.equal(s.step, "pay");
  G.finish(s);
  assert.equal(s.bagCount, 2);
});
test("active payment recovery rejects extra unrequested produce without taking money or stock", () => {
  const s = stand();
  s.basket = { carrot: 2, tomato: 1, corn: 1 };
  s.step = "pay";
  s.tendered = 20;
  const recovered = G.recover(JSON.stringify(s));
  assert.equal(recovered.customer, null);
  assert.equal(recovered.cash, 50);
  assert.deepEqual(recovered.inventory, s.inventory);
});
test("three greetings have distinct responses; waiting sometimes retains and sometimes loses a customer without costs", () => {
  const responses = [];
  for (const choice of ["excellent", "good", "wait"]) {
    const s = stand();
    s.step = "greet";
    const before = finances(s);
    G.greet(s, choice);
    responses.push(G.customerResponse(s));
    assert.equal(s.step, "choose");
    assert.equal(finances(s), before);
    assert.equal(
      s.customer.satisfaction,
      { excellent: 70, good: 60, wait: 45 }[choice],
    );
    assert.throws(() => G.greet(s, choice));
  }
  assert.equal(new Set(responses).size, 3);
  const s = stand();
  s.step = "greet";
  s.customer.personality = "hurried";
  const before = finances(s);
  G.greet(s, "wait");
  assert.equal(s.step, "thanks");
  G.advanceCustomer(s, "excellent");
  assert.equal(finances(s), before);
});
test("occasional sold-out requests coexist with ordinary stock requests and survive saves", () => {
  const outcomes = new Set();
  for (let day = 1; day <= 6; day++) {
    const s = stand();
    s.customer = null;
    s.day = day;
    s.inventory = { carrot: 5 };
    s.display = { carrot: 5 };
    G.newCustomer(s, "Maya");
    outcomes.add(G.missingProduce(s).length > 0);
    const r = G.recover(JSON.stringify(s));
    assert.deepEqual(r.customer.want, s.customer.want);
    assert.equal(r.customer.decision, s.customer.decision);
    assert.equal(r.step, "greet");
  }
  assert.deepEqual(outcomes, new Set([false, true]));
});
test("alternatives use sellable displayed stock and preserve zero-bag, money, and equipment state until a successful sale", () => {
  let s = stand();
  s.customer.want = { onion: 2 };
  s.customer.greeting = "excellent";
  s.customer.decision = 10;
  s.inventory.strawberry = 5;
  s.display.strawberry = 5;
  s.inventory.radish = 5;
  assert.ok(G.alternativeChoices(s).some((c) => c.id === "cucumber"));
  assert.ok(
    !G.alternativeChoices(s).some((c) =>
      ["onion", "strawberry", "radish"].includes(c.id),
    ),
  );
  assert.throws(() => G.suggestAlternative(s, "onion"));
  const before = finances(s);
  assert.equal(G.suggestAlternative(s, "cucumber"), true);
  assert.equal(finances(s), before);
  assert.deepEqual(s.customer.want, { cucumber: 2 });
  assert.equal(s.step, "choose");
  s = G.recover(JSON.stringify(s));
  assert.equal(s.customer.alternativeOffered, true);
  assert.throws(() => G.suggestAlternative(s, "carrot"));
  s.basket = { cucumber: 2 };
  G.ring(s, 6);
  s.change = 4;
  G.finish(s);
  assert.equal(s.cash, 56);
  assert.equal(s.bagCount, 2);
  assert.equal(s.inventory.cucumber, 2);
});
test("customer preferences and excellent greeting can improve acceptance without guaranteeing a sale", () => {
  function offer(personality, greeting, decision) {
    const s = stand();
    s.customer.want = { onion: 1 };
    Object.assign(s.customer, { personality, greeting, decision });
    const before = finances(s),
      accepted = G.suggestAlternative(s, "carrot");
    assert.equal(finances(s), before);
    return { s, accepted };
  }
  assert.equal(offer("curious", "good", 50).accepted, true);
  assert.equal(offer("thoughtful", "good", 50).accepted, false);
  assert.equal(offer("thoughtful", "excellent", 50).accepted, true);
  const { s, accepted } = offer("curious", "excellent", 99);
  assert.equal(accepted, false);
  assert.equal(s.step, "thanks");
  assert.equal(s.customersServed, 0);
  assert.equal(s.bagCount, 3);
});
test("both sold-out apologies and all farewells are friendly, preserve earnings and never consume bags", () => {
  for (const response of ["sorry", "return"])
    for (const farewell of ["excellent", "good", "brief"]) {
      const s = stand();
      s.customer.want = { onion: 1 };
      const before = finances(s);
      G.declineOrder(s, response);
      assert.equal(s.step, "thanks");
      assert.ok(G.customerResponse(s).length > 20);
      const score = s.customer.satisfaction;
      G.advanceCustomer(s, farewell);
      assert.equal(s.customer, null);
      assert.equal(finances(s), before);
      assert.ok(score >= 50);
      assert.equal(s.notice, "");
      assert.throws(() => G.advanceCustomer(s, farewell));
    }
});
