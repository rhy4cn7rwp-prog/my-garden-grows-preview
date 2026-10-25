const { test } = require("node:test");
const assert = require("node:assert/strict");
const G = require("../src/game.js");
const fs = require("node:fs");
const vm = require("node:vm");
const clone = (s) => JSON.parse(JSON.stringify(s));

test("room canvas tolerates early viewport events and avoids repeated browser-tint changes", () => {
  let writes = 0;
  const meta = {
    content: "#c8e6f0",
    getAttribute() {
      return this.content;
    },
    setAttribute(_, value) {
      this.content = value;
      writes++;
    },
  };
  const document = {
    documentElement: { dataset: {} },
    querySelector(selector) {
      return selector.includes("theme-color") ? meta : null;
    },
  };
  const context = vm.createContext({ document });
  for (const file of ["village-canvas.js", "clubhouse.js"])
    vm.runInContext(
      fs.readFileSync(require.resolve("../src/" + file), "utf8"),
      context,
    );
  // `view`, state and the scene renderer do not exist yet.
  vm.runInContext("syncClubhouseCanvas()", context);
  document.body = { dataset: { view: "clubhouse" } };
  vm.runInContext(
    "syncVillagePageCanvas();syncClubhouseCanvas();syncVillagePageCanvas();syncClubhouseCanvas()",
    context,
  );
  assert.equal(meta.content, "#dca85e");
  assert.equal(writes, 1);
  assert.equal(document.documentElement.dataset.clubhouseCanvas, "true");
  document.body.dataset.view = "seeds";
  vm.runInContext("syncVillagePageCanvas();syncClubhouseCanvas()", context);
  assert.equal(meta.content, "#f8e9c2");
  assert.equal(document.documentElement.dataset.clubhouseCanvas, undefined);
});

test("each dream charges its catalogue price once and records purchase day/season", () => {
  for (const d of G.dreams) {
    const s = G.initial();
    s.cash = d.price + 17.25;
    s.day = 13;
    s.season = 3;
    assert.equal(G.purchaseDream(s, d.id), d.price);
    assert.equal(s.cash, 17.25);
    assert.equal(G.ownsDream(s, d.id), true);
    assert.deepEqual(s.dreamPurchases[d.id], {
      owned: true,
      season: 3,
      day: 13,
      price: d.price,
    });
    const after = clone(s);
    assert.throws(() => G.purchaseDream(s, d.id), /already/);
    assert.deepEqual(s, after);
  }
});
test("unaffordable or invalid purchases leave the complete farm unchanged", () => {
  const s = G.initial(),
    before = clone(s);
  for (const id of ["ball", "bike", "missing", "__proto__", null]) {
    assert.throws(() => G.purchaseDream(s, id));
    assert.deepEqual(s, before);
  }
});
test("reward checkout reserves outstanding rental debt and does not count it as savings", () => {
  const s = G.initial();
  s.cash = 0;
  G.rentEquipment(s, "scale", "deferred");
  s.cash = 100;
  const before = clone(s);
  assert.throws(() => G.purchaseDream(s, "ball"), /equipment/);
  assert.deepEqual(s, before);
  s.cash = 102.25;
  G.purchaseDream(s, "ball");
  assert.equal(s.cash, 2.25);
  assert.equal(G.debtTotal(s), 2);
  assert.deepEqual(s.equipmentDebt, before.equipmentDebt);
  assert.deepEqual(s.marketExpenses, before.marketExpenses);
});
test("legacy farms and achieved savings goals never imply ownership", () => {
  const s = G.initial();
  delete s.dreamPurchases;
  s.cash = 600;
  s.won = true;
  s.goal = 0;
  s.day = 18;
  s.season = 7;
  s.seeds.carrot = 4;
  s.inventory.corn = 3;
  s.bagCount = 8;
  s.owned.table = 1;
  s.standMode = "owned";
  s.plots[0] = { id: "carrot", age: 2, left: 0, watered: true, quality: 100 };
  const recovered = G.recover(JSON.stringify(s));
  assert.deepEqual(recovered.dreamPurchases, {});
  for (const field of [
    "cash",
    "won",
    "goal",
    "day",
    "season",
    "seeds",
    "inventory",
    "bagCount",
    "owned",
    "plots",
  ])
    assert.deepEqual(recovered[field], s[field], field);
  assert.equal(G.ownsDream(recovered, "ball"), false);
});
test("purchase records survive refresh, backup recovery, market settlement and season rollover", () => {
  let s = G.initial();
  s.cash = 210;
  s.day = 20;
  s.season = 2;
  G.purchaseDream(s, "ball");
  const record = clone(s.dreamPurchases);
  s = G.recover(JSON.stringify(s));
  assert.deepEqual(s.dreamPurchases, record);
  s = G.recover("{broken", JSON.stringify(s));
  assert.deepEqual(s.dreamPurchases, record);
  G.settleMarket(s);
  G.endDay(s);
  assert.equal(s.season, 3);
  assert.equal(s.day, 1);
  assert.deepEqual(s.dreamPurchases, record);
  assert.equal(s.cash, 110);
});
test("identified ownership without a historical date stays owned across repeated recovery", () => {
  let s = G.initial();
  s.cash = 27;
  s.dreamPurchases = { ball: { owned: true } };
  for (let i = 0; i < 3; i++) {
    s = G.recover(JSON.stringify(s));
    assert.equal(G.ownsDream(s, "ball"), true);
    assert.equal(s.dreamPurchases.ball.day, null);
    assert.equal(s.dreamPurchases.ball.season, null);
    assert.equal(s.dreamPurchases.ball.price, null);
    assert.equal(s.cash, 27);
  }
});
test("invalid optional collection records never erase money or other valid rewards", () => {
  const s = G.initial();
  s.cash = 32;
  s.bagCount = 9;
  s.dreamPurchases = {
    ball: { season: 2, day: 4, price: 100 },
    bike: {},
    tablet: false,
    guitar: [],
    camera: "yes",
    unknown: { owned: true },
  };
  let r = G.recover(JSON.stringify(s));
  assert.equal(r.cash, 32);
  assert.equal(r.bagCount, 9);
  assert.deepEqual(Object.keys(r.dreamPurchases), ["ball"]);
  for (const broken of [null, false, [], "bad"]) {
    s.dreamPurchases = broken;
    r = G.recover(JSON.stringify(s));
    assert.equal(r.cash, 32);
    assert.equal(r.bagCount, 9);
    assert.deepEqual(r.dreamPurchases, {});
  }
});
test("buying the active goal waits for an explicit next goal and rejects owned goals", () => {
  const s = G.initial();
  s.cash = 2000;
  G.chooseGoal(s, 0);
  G.purchaseDream(s, "ball");
  assert.equal(s.goal, 0);
  assert.equal(s.won, true);
  assert.throws(() => G.chooseGoal(s, 0), /already/);
  G.chooseGoal(s, 1);
  assert.equal(s.goal, 1);
  assert.equal(s.won, false);
  for (const d of G.dreams.slice(1)) G.purchaseDream(s, d.id);
  assert.equal(s.cash, 100);
  assert.equal(s.won, true);
  assert.ok(G.dreams.every((d) => G.ownsDream(s, d.id)));
});
test("buying a different dream retains the chosen savings goal", () => {
  const s = G.initial();
  s.cash = 350;
  s.goal = 3;
  G.purchaseDream(s, "ball");
  assert.equal(s.goal, 3);
});
test("a recovered owned goal retains the player's choice until another goal is selected", () => {
  const s = G.initial();
  s.goal = 0;
  s.cash = 25;
  s.won = true;
  s.dreamPurchases = { ball: { owned: true } };
  const r = G.recover(JSON.stringify(s));
  assert.equal(r.goal, 0);
  assert.equal(r.won, true);
  assert.equal(r.cash, 25);
  assert.equal(G.ownsDream(r, "ball"), true);
});
test("reaching a goal only celebrates, never purchases, spends money or creates ownership", () => {
  const s = G.initial();
  G.chooseGoal(s, 0);
  s.cash = 99.99;
  const before = clone(s);
  assert.equal(G.acknowledgeGoal(s), null);
  assert.deepEqual(s, before);
  s.cash = 100;
  assert.equal(G.acknowledgeGoal(s).id, "ball");
  assert.equal(s.cash, 100);
  assert.equal(s.goal, 0);
  assert.equal(s.won, true);
  assert.deepEqual(s.dreamPurchases, {});
  assert.equal(G.acknowledgeGoal(s), null);
  const recovered = G.recover(JSON.stringify(s));
  assert.equal(recovered.cash, 100);
  assert.deepEqual(recovered.dreamPurchases, {});
  assert.equal(G.acknowledgeGoal(recovered), null);
  G.purchaseDream(recovered, "ball");
  assert.equal(recovered.cash, 0);
  assert.equal(G.ownsDream(recovered, "ball"), true);
  G.chooseGoal(recovered, 1);
  assert.equal(recovered.goal, 1);
  assert.equal(recovered.won, false);
  assert.equal(recovered.cash, 0);
  assert.equal(G.ownsDream(recovered, "bike"), false);
});
test("selecting another affordable goal can celebrate without automatically buying it", () => {
  const s = G.initial();
  s.cash = 350;
  G.chooseGoal(s, 0);
  G.acknowledgeGoal(s);
  G.purchaseDream(s, "ball");
  G.chooseGoal(s, 1);
  assert.equal(G.acknowledgeGoal(s).id, "bike");
  assert.equal(s.cash, 250);
  assert.equal(G.ownsDream(s, "bike"), false);
});
test("reward purchases leave in-progress customer, garden, inventory and accounting untouched", () => {
  const s = G.initial();
  s.cash = 150;
  s.bagCount = 12;
  s.inventory.carrot = s.display.carrot = 4;
  G.openMarket(s);
  G.newCustomer(s, "Maya");
  const before = clone(s);
  G.purchaseDream(s, "ball");
  for (const field of Object.keys(before).filter(
    (f) => !["cash", "dreamPurchases", "dreamPurchaseCount"].includes(f),
  ))
    assert.deepEqual(s[field], before[field], field);
});
