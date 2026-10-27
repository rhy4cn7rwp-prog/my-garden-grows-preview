const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const G = require("../src/game.js");
const guide = require("../src/guidebook.js");
function ui(saved = null) {
  const storage = new Map(saved ? [["mgg10", JSON.stringify(saved)]] : []);
  const context = vm.createContext({
    Game: G,
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v),
    },
    document: {
      hidden: false,
      querySelector: () => null,
      body: { dataset: {} },
    },
    window: { scrollTo() {} },
    matchMedia: () => ({ matches: true }),
    render() {},
    queueMicrotask() {},
    setInterval() {},
    Date,
  });
  vm.runInContext(
    fs.readFileSync(require.resolve("../src/scenes.js"), "utf8"),
    context,
  );
  return { run: (code) => vm.runInContext(code, context), context, storage };
}
test("six-page guide teaches currently playable shopping, growing, bagging and money steps", () => {
  assert.equal(guide.pages.length, 6);
  assert.deepEqual(
    guide.pages.map((p) => p.heading),
    [
      "Choose Your Dream!",
      "Shop for Your Garden!",
      "Plant, Water, Harvest!",
      "Harvest and Keep Growing!",
      "Help Your Customers!",
      "Count, Save, Dream!",
    ],
  );
  assert.deepEqual(
    guide.pages.map((p) => p.text.join("\n\n")),
    [
      "Choose Little or Growing Gardener in Settings. Both share your farm and rewards! Visit the Dream Shop to pick a savings goal. Buying your dream later puts it in your Clubhouse.",
      "New farms start with $0. Collect free starter planting supplies at Seed & Feed. Choose from 12 Job Board activities, including Hidden Treasures and Piece It Together! Help neighbors to earn $1 per job. Each neighbor rests for five minutes after paying you.",
      "Tap a plot, choose a crop, then Plant Plan. Water with the can or Water All. Only End Day advances farming days and grows watered plants. Tap plants for growth pictures. Farming never ends!",
      "Pick ripe crops or use Harvest All. Optional weeding every five days gives each planted crop 1 extra item or pound. Little Gardeners pull unwanted weeds; Growing Gardeners find wrong answers.",
      "New farmers save $20 for a table, scale, cash register and bags at Market Supplies. Then arrange your harvest. Selling is optional; neighborhood jobs can fund your dreams too!",
      "Greet customers and fill their baskets. Little Gardener handles payment for you; Growing Gardener lets you calculate and count change. Save up, buy your dream and find it in your Clubhouse!\n\nThen choose another dream and keep growing!",
    ],
  );
  assert.equal(new Set(guide.pages.map((p) => p.illustration)).size, 6);
});
test("new farms start at home with $0; existing farms retain balances and purchases", () => {
  const fresh = ui();
  assert.equal(fresh.run("view"), "clubhouse");
  assert.equal(fresh.run("state.cash"), 0);
  assert.equal(fresh.run("state.newEconomy"), true);
  const s = G.initial();
  s.cash = 1000;
  G.purchaseDream(s, "bike");
  G.purchaseDream(s, "ball");
  s.seeds.carrot = 8;
  const r = ui(s);
  assert.equal(r.run("view"), "clubhouse");
  assert.equal(
    r.run("JSON.stringify(state)"),
    JSON.stringify(G.recover(JSON.stringify(s))),
  );
  assert.equal(r.run("marketAwaitingResume"), false);
  r.run("go('town')");
  assert.equal(r.run("view"), "town");
  r.run("go('clubhouse')");
  assert.equal(r.run("view"), "clubhouse");
});
test("unfinished session opens home paused; visiting other locations does not resume it", () => {
  const s = G.initial();
  s.inventory.carrot = s.display.carrot = 30;
  s.owned.scale = 1;
  s.bagCount = 10;
  G.openMarket(s);
  G.newCustomer(s);
  G.pauseMarketClock(s);
  s.marketElapsedMs = 12345;
  const r = ui(s);
  assert.equal(r.run("view"), "clubhouse");
  assert.equal(r.run("marketAwaitingResume"), true);
  const recovered = r.run("JSON.stringify(state)");
  assert.equal(
    r.run("Game.marketTime(state,Date.now()+86400000).elapsedMs"),
    12345,
  );
  for (const dest of [
    "town",
    "seeds",
    "garden",
    "dream",
    "supplies",
    "clubhouse",
  ]) {
    r.run(`go('${dest}')`);
    assert.equal(r.run("marketAwaitingResume"), true);
    assert.equal(
      r.run("Game.marketTime(state,Date.now()+86400000).elapsedMs"),
      12345,
    );
  }
  assert.equal(r.run("JSON.stringify(state)"), recovered);
  r.run("go('market')");
  assert.equal(r.run("marketAwaitingResume"), false);
  assert.ok(r.run("Game.marketTime(state,Date.now()+5000).elapsedMs") >= 17345);
  assert.equal(
    r.run("state.customer.name"),
    G.recover(JSON.stringify(s)).customer.name,
  );
});
test("book page turns and boundary controls never touch farm state", () => {
  const context = vm.createContext({
    state: { cash: 123, clubhousePositions: { ball: { angle: 0 } } },
    dialogKey: null,
    document: {
      addEventListener() {},
      querySelector() {
        return null;
      },
    },
    show(html, key) {
      context.html = html;
      context.dialogKey = key;
    },
    closeDialog() {
      context.dialogKey = null;
    },
    clubhouseRewardArt: () => "<svg/>",
    seedProduceArt: () => "<svg/>",
  });
  vm.runInContext(
    fs.readFileSync(require.resolve("../src/guidebook.js"), "utf8"),
    context,
  );
  const before = JSON.stringify(context.state);
  vm.runInContext("openGuidebook();turnGuidebook(-1)", context);
  assert.match(context.html, /1 of 6/);
  for (let i = 0; i < 10; i++) vm.runInContext("turnGuidebook(1)", context);
  assert.match(context.html, /6 of 6/);
  assert.match(context.html, /Then choose another dream and keep growing!/);
  vm.runInContext("closeGuidebook();openGuidebook()", context);
  assert.match(context.html, /1 of 6/);
  assert.equal(JSON.stringify(context.state), before);
});

test("book has dark high-contrast lettering, rests centered on its own round table and does not become an owned reward", () => {
  const guide = require("../src/guidebook.js"),
    G = require("../src/game.js");
  const svg = fs.readFileSync(
    require.resolve("../assets/guidebook/book.svg"),
    "utf8",
  );
  assert.match(svg, /<text[^>]*fill="#151b13"[^>]*>How to<\/text>/);
  assert.match(svg, /<rect[^>]*fill="#fff0bc"/);
  assert.equal(guide.book.x, 2172 / 2);
  assert.equal(guide.book.table.x, guide.book.x);
  assert.ok(guide.book.y < guide.book.table.y);
  assert.ok(guide.book.width < guide.book.table.width);
  assert.equal(G.dreams.length, 6);
  assert.equal(
    G.dreams.some((x) => /^(book|table)$/i.test(x.id)),
    false,
  );
});
