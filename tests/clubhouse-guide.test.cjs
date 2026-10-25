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
test("optional guide contains the six requested headings and exact child-friendly wording", () => {
  assert.equal(guide.pages.length, 6);
  assert.deepEqual(
    guide.pages.map((p) => p.heading),
    [
      "Choose Your Dream!",
      "Let's Go Shopping!",
      "Time to Grow!",
      "Harvest Time!",
      "Let's Make Some Money!",
      "Dreams Come True!",
    ],
  );
  assert.deepEqual(
    guide.pages.map((p) => p.text.join("\n\n")),
    [
      "Visit the Dream Shop and pick something special you'd love to have. That's what you're going to save your money for!",
      "Head to Seed & Feed to buy your seeds. But remember to save some money for your market supplies!",
      "Take your seeds to your garden plot and plant them. Don't forget to water your garden each day!",
      "When your crops are ready, pick them and get ready for the farmers market!",
      "Bring your produce and supplies to the farmers market. Help customers, sell your harvest, and earn money for your dream!",
      "Saved enough money? Go back to the Dream Shop and buy your dream item! You'll find it waiting for you right here in your Clubhouse.\n\nThen choose another dream and keep growing!",
    ],
  );
  assert.equal(new Set(guide.pages.map((p) => p.illustration)).size, 6);
});
test("fresh and recovered games start at home with no new save fields or changed purchases", () => {
  const fresh = ui();
  assert.equal(fresh.run("view"), "clubhouse");
  assert.equal(fresh.run("state.cash"), 50);
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
