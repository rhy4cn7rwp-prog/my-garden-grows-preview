const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm"),
  fs = require("node:fs"),
  G = require("../src/game.js");
function shop() {
  const ctx = {
    Game: G,
    CROPS: G.crops,
    state: G.initial(),
    money: (n) => "$" + n.toFixed(2),
    crop: (id) => G.crops.find((c) => c.id === id),
    act: (fn) => fn(),
    show: (html, key) => {
      ctx.html = html;
      ctx.key = key;
    },
  };
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(require.resolve("../src/seed-shop.js"), "utf8"),
    ctx,
  );
  return ctx;
}
test("visible packet merchandise uses catalog prices and actual illustrated crop art, no invisible hotspots", () => {
  const c = shop(),
    html = c.seedShopScene();
  assert.equal((html.match(/class="seed-packet"/g) || []).length, 10);
  assert.ok(!html.includes('class="spot"'));
  for (const crop of G.crops) {
    assert.ok(html.includes(`data-seed="${crop.id}"`));
    assert.ok(html.includes("$" + crop.seed.toFixed(2)));
  }
  assert.ok(html.includes("produce.webp"));
});
test("mixed individual and fixed bundle checkout displays actual expanded receipt without changing other farm state", () => {
  const c = shop();
  c.state.cart = { tomato: 2, bundle: 2, onion: 1 };
  const before = JSON.parse(JSON.stringify(c.state));
  c.seedShopCheckout();
  assert.equal(c.state.cash, 23);
  assert.equal(c.state.seeds.tomato, 2);
  assert.equal(c.state.seeds.carrot, 6);
  assert.equal(c.state.seeds.beans, 4);
  assert.equal(c.state.seeds.strawberry, 2);
  assert.equal(c.state.seeds.onion, 5);
  assert.ok(c.html.includes("$27.00"));
  assert.ok(c.html.includes("$23.00"));
  assert.ok(c.html.includes("Carrot Seeds: 6 packets purchased"));
  assert.deepEqual(c.state.cart, {});
  for (const key of Object.keys(before).filter(
    (k) => !["cash", "cart", "seeds"].includes(k),
  ))
    assert.deepEqual(c.state[key], before[key], key);
  assert.deepEqual(G.recover(JSON.stringify(c.state)).seeds, c.state.seeds);
});
test("bundle information preserves predetermined assortment, exact discount, and selling units", () => {
  const c = shop();
  c.seedShopBundle();
  for (const text of [
    "Carrot Seeds × 3",
    "Onion Seeds × 2",
    "Green Bean Seeds × 2",
    "Strawberry Plants × 1",
    "$12.00",
    "$1.00",
    "per lb",
    "each",
    "cannot be customized",
  ])
    assert.ok(c.html.includes(text), text);
});
test("over-budget and empty baskets cannot pay; calling checkout directly remains guarded by Game", () => {
  const c = shop();
  c.state.cash = 1;
  c.state.cart = { bundle: 1 };
  c.seedShopBasket();
  assert.ok(c.html.includes("$10.00 over"));
  assert.match(c.html, /onclick="checkout\('seeds'\)" disabled/);
  const before = JSON.stringify(c.state);
  assert.throws(() => c.seedShopCheckout(), /Not enough money/);
  assert.equal(JSON.stringify(c.state), before);
  c.state.cart = {};
  c.seedShopBasket();
  assert.match(c.html, /onclick="checkout\('seeds'\)" disabled/);
});

test("planting-material names stay accurate across packets, details and receipts without changing crop data", () => {
  const c = shop(),
    before = JSON.stringify(G.crops),
    names = {
      carrot: "Carrot Seeds",
      corn: "Corn Seeds",
      beans: "Green Bean Seeds",
      strawberry: "Strawberry Plants",
      cucumber: "Cucumber Seeds",
      potato: "Seed Potatoes",
      onion: "Onion Seeds",
      tomato: "Tomato Seeds",
      lettuce: "Lettuce Seeds",
      radish: "Radish Seeds",
    };
  const shelf = c.seedShopScene();
  for (const [id, name] of Object.entries(names)) {
    assert.equal(c.seedName(id), name);
    assert.ok(shelf.includes(`aria-label="${name}"`));
    c.seedShopDetails(id);
    assert.ok(c.html.includes(`<h2>${name}</h2>`));
    c.state.cart[id] = 1;
  }
  c.seedShopBasket();
  for (const name of Object.values(names)) assert.ok(c.html.includes(name));
  c.seedShopCheckout();
  for (const name of Object.values(names))
    assert.ok(c.html.includes(name + ":"));
  assert.equal(c.state.cash, 32);
  for (const id of Object.keys(names)) assert.equal(c.state.seeds[id], 1);
  assert.equal(JSON.stringify(G.crops), before);
  assert.deepEqual(G.recover(JSON.stringify(c.state)).seeds, c.state.seeds);
});

test("strawberry plants keep the legacy inventory key, exact price and recovered purchased quantities", () => {
  const c = shop(),
    originalCrop = JSON.stringify(G.crops.find((x) => x.id === "strawberry"));
  c.state.seeds.strawberry = 3;
  c.state.cart = { strawberry: 2 };
  c.seedShopDetails("strawberry");
  assert.ok(c.html.includes("Strawberry Plants"));
  assert.ok(c.html.includes("$3.00 per plant"));
  c.seedShopBasket();
  assert.ok(c.html.includes("Strawberry Plants × 2"));
  c.seedShopCheckout();
  assert.equal(c.state.cash, 44);
  assert.equal(c.state.seeds.strawberry, 5);
  assert.ok(c.html.includes("Strawberry Plants: 2 plants purchased"));
  assert.equal(G.recover(JSON.stringify(c.state)).seeds.strawberry, 5);
  assert.equal(
    JSON.stringify(G.crops.find((x) => x.id === "strawberry")),
    originalCrop,
  );
});
