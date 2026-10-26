const { test } = require("node:test");
const a = require("node:assert/strict");
const G = require("../src/game.js"),
  L = require("../src/garden-learning.js");
function farm(day) {
  const s = G.initial();
  s.season = Math.floor((day - 1) / 20) + 1;
  s.day = ((day - 1) % 20) + 1;
  s.plots[0] = { id: "carrot", age: 3, left: 0, quality: 100, watered: false };
  return s;
}
test("invitation can be claimed only on an eligible End Day boundary, once per cycle across refresh", () => {
  for (const day of [5, 10, 15, 20, 25, 1000]) {
    const s = farm(day);
    const before = structuredClone(s);
    a.equal(L.claimInvitation(s, day - 1), true);
    before.weedingLesson.invitedCycle = Math.floor(day / 5);
    a.deepEqual(s, before);
    a.equal(L.claimInvitation(s, day - 1), false);
    const r = G.recover(JSON.stringify(s));
    a.equal(r.weedingLesson.invitedCycle, Math.floor(day / 5));
    a.equal(L.claimInvitation(r, day - 1), false);
    a.equal(G.weedingAvailable(r), true);
  }
  for (const day of [1, 4, 6, 9, 21, 24])
    a.equal(L.claimInvitation(farm(day), day - 1), false);
  a.equal(L.claimInvitation(farm(5), 5), false);
  a.equal(L.claimInvitation(farm(10), 4), false);
});
test("pending bonus, completed cycle and empty plots cannot claim; old saves remain eligible without resetting progress", () => {
  const s = farm(10);
  s.plots[0].weedingBonus = true;
  a.equal(L.claimInvitation(s, 9), false);
  a.equal(s.weedingLesson.invitedCycle, 0);
  delete s.plots[0].weedingBonus;
  s.weedingLesson.completedCycle = 2;
  a.equal(L.claimInvitation(s, 9), false);
  s.weedingLesson.completedCycle = 0;
  s.plots[0] = null;
  a.equal(L.claimInvitation(s, 9), false);
  const old = farm(25);
  old.cash = 123.45;
  delete old.weedingLesson.invitedCycle;
  const r = G.recover(JSON.stringify(old));
  a.equal(r.cash, 123.45);
  a.equal(r.weedingLesson.invitedCycle, 0);
  a.equal(L.claimInvitation(r, 24), true);
  r.weedingLesson.invitedCycle = "bad";
  a.equal(G.recover(JSON.stringify(r)).weedingLesson.invitedCycle, 0);
});
