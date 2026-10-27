/* Connected walkable lawn, no deadline. Each event visits adjacent cells only. */
(function (root) {
  "use strict";
  function make(mode) {
    const width = 7,
      height = mode === "little" ? 6 : 8,
      blocked = mode === "little" ? [10, 17, 31] : [10, 17, 24, 33, 40, 47];
    const cells = Array.from({ length: width * height }, (_, i) => ({
      blocked: blocked.includes(i),
      cut: i === 0,
      raked: false,
      cleared: false,
    }));
    return {
      width,
      height,
      cells,
      mower: 0,
      stage: "mow",
      piles: [0, 0, 0],
      collected: [false, false, false],
      rake: 0,
      target: cells.filter((c) => !c.blocked).length,
    };
  }
  function neighbors(d, i) {
    return [
      i % d.width ? i - 1 : -1,
      i % d.width < d.width - 1 ? i + 1 : -1,
      i - d.width,
      i + d.width,
    ].filter((j) => j >= 0 && j < d.cells.length && !d.cells[j].blocked);
  }
  function apply(a, e) {
    const d = a.data;
    if (e.type === "mow") {
      if (
        d.stage !== "mow" ||
        !Number.isInteger(e.cell) ||
        !neighbors(d, d.mower).includes(e.cell)
      )
        return false;
      d.mower = e.cell;
      d.cells[e.cell].cut = true;
      a.score = d.cells.filter((c) => c.cut).length;
      if (a.score === d.target) {
        d.stage = "rake";
        d.rake = d.mower;
      }
      return true;
    }
    if (e.type === "rake") {
      if (
        d.stage !== "rake" ||
        !Number.isInteger(e.cell) ||
        !d.cells[e.cell] ||
        d.cells[e.cell].blocked
      )
        return false;
      d.rake = e.cell;
      if (d.cells[e.cell].raked) return false;
      d.cells[e.cell].raked = true;
      const pile = Math.min(
        2,
        Math.floor((Math.floor(e.cell / d.width) * 3) / d.height),
      );
      d.piles[pile]++;
      a.score = d.target + d.cells.filter((c) => c.raked).length;
      if (d.cells.filter((c) => c.raked).length === d.target)
        d.stage = "compost";
      return true;
    }
    if (e.type === "compost") {
      if (
        d.stage !== "compost" ||
        !Number.isInteger(e.pile) ||
        e.pile < 0 ||
        e.pile > 2 ||
        d.collected[e.pile]
      )
        return false;
      d.collected[e.pile] = true;
      d.cells.forEach((c, i) => {
        if (
          Math.min(2, Math.floor((Math.floor(i / d.width) * 3) / d.height)) ===
          e.pile
        )
          c.cleared = true;
      });
      a.score++;
      if (d.collected.every(Boolean)) {
        a.won = true;
        a.ended = true;
        d.stage = "done";
      }
      return true;
    }
    return false;
  }
  const api = { make, neighbors, apply };
  if (typeof module !== "undefined") module.exports = api;
  root.JobLawn = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
