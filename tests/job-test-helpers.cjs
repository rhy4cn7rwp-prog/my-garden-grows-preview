const J = require("../src/neighborhood-jobs");
function lawnRoute(d) {
  const visited = new Set([d.mower]),
    route = [];
  function walk(i) {
    for (const j of require("../src/job-lawn").neighbors(d, i))
      if (!visited.has(j)) {
        visited.add(j);
        route.push(j);
        walk(j);
        route.push(i);
      }
  }
  walk(d.mower);
  return route;
}
function solveLawn(s) {
  const a = s.jobs.active,
    d = a.data;
  for (const cell of lawnRoute(d)) {
    if (d.stage !== "mow") break;
    J.action(s, { type: "mow", cell });
  }
  for (let cell = 0; cell < d.cells.length; cell++)
    if (!d.cells[cell].blocked) J.action(s, { type: "rake", cell });
  for (let pile = 0; pile < 3; pile++) J.action(s, { type: "compost", pile });
}
module.exports = { lawnRoute, solveLawn };
