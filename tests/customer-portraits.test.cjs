const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../src/market-customers.js");
const P = require("../src/customer-portraits.js");
function inside(points, x, y) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i],
      [bx, by] = points[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      result = !result;
  }
  return result;
}
test("every named neighbor resolves to a unique bounded silhouette on unchanged atlas coordinates", () => {
  const ids = new Set();
  for (const p of C.profiles) {
    const f = P.forProfile(p),
      [x, y, w, h] = f.bounds;
    ids.add(f.maskId);
    assert.ok(f.outline.length >= 20, p.name);
    for (const [px, py] of f.outline)
      assert.ok(px >= x && px <= x + w && py >= y && py <= y + h, p.name);
    assert.ok(
      inside(f.outline, x + w / 2, y + h * 0.46),
      p.name + " face retained",
    );
    assert.ok(
      inside(f.outline, x + w / 2, y + h * 0.87),
      p.name + " hands retained",
    );
  }
  assert.equal(ids.size, 28);
  assert.equal(P.atlases.customers.length, 4);
  assert.equal(P.atlases["customers-expanded"].length, 24);
});
test("known neighboring arm/shoulder fragments are outside their customer silhouette", () => {
  // Atlas-relative pixel witnesses from the reproduced shoulder/arm bug.
  for (const [i, dx, dy] of [
    [2, 1, 251],
    [3, 206, 275],
    [4, 207, 251],
    [6, 207, 250],
    [8, 2, 270],
    [9, 205, 251],
    [12, 207, 251],
    [14, 5, 260],
    [14, 204, 200],
    [18, 205, 230],
    [23, 1, 260],
  ]) {
    const f = P.atlases["customers-expanded"][i];
    assert.equal(
      inside(f.outline, f.bounds[0] + dx, f.bounds[1] + dy),
      false,
      "portrait " + i + " witness " + dx + "," + dy,
    );
  }
});
