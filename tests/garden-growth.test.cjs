const { test } = require("node:test"),
  a = require("node:assert/strict"),
  fs = require("node:fs");
const G = require("../src/game.js"),
  C = require("../src/garden-crops.js");
test("every crop has four distinct original illustrations and useful mature info without modifying crop rules", () => {
  for (const crop of G.crops) {
    const art = [];
    for (let n = 1; n <= 4; n++) {
      const s = fs.readFileSync(
        `assets/garden-growth/${crop.id}-${n}.svg`,
        "utf8",
      );
      a.ok(s.includes('viewBox="0 0 440 360"'));
      a.ok(s.includes(`${crop.id} growth stage ${n}`));
      a.ok(!s.includes("<script"));
      art.push(s);
    }
    a.equal(new Set(art).size, 4);
    const p = {
      id: crop.id,
      age: crop.days,
      left: crop.repeat,
      watered: false,
      quality: 100,
    };
    a.equal(C.stage(crop, p).number, 4);
    a.ok(C.closeup(crop, p).includes(`${crop.id}-4.svg`));
    a.equal(C.stage(crop, { ...p, age: 0 }).number, 1);
    a.equal(C.stage(crop, { ...p, age: 1 }).number, 2);
  }
});
test("repeat producers keep established growth silhouette until ready, new planting resets correctly", () => {
  for (const c of G.crops.filter((c) => c.repeat)) {
    for (let age = 0; age < c.days; age++) {
      const s = C.stage(c, { age, left: c.repeat - 1 });
      a.equal(s.number, 3);
      a.equal(s.regrowing, true);
    }
    a.equal(C.stage(c, { age: c.days, left: c.repeat - 1 }).number, 4);
    a.equal(C.stage(c, { age: 0, left: c.repeat }).number, 1);
  }
});
test("new plant closeups differ by botanical architecture not only recoloring", () => {
  const files = G.crops.map((c) =>
    fs
      .readFileSync(`assets/garden-growth/${c.id}-4.svg`, "utf8")
      .replace(/<title[^>]*>.*?<\/title>/, ""),
  );
  a.equal(new Set(files).size, 10);
  const s = G.initial(),
    before = JSON.stringify(s);
  for (const c of G.crops) C.closeup(c, { age: 0, left: c.repeat });
  a.equal(JSON.stringify(s), before);
});
