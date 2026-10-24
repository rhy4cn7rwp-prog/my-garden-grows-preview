/* Visible illustrated objects are the controls: no hotspots or flattened village image.
   One transparent atlas is shared by six independent SVG sprites to avoid six downloads.
   All labels, progress and readiness indicators are live HTML, never baked into art. */
const TOWN_LOCATIONS = [
  { id: "dream", name: "Dream Shop", column: 0, row: 0 },
  { id: "seeds", name: "Seed & Feed", column: 1, row: 0 },
  { id: "supplies", name: "Market Supplies", column: 2, row: 0 },
  { id: "garden", name: "My Garden", column: 0, row: 1 },
  { id: "market", name: "Farmers Market", column: 1, row: 1 },
  { id: "jobs", name: "Job Board", column: 2, row: 1 },
];
function townBuilding(location) {
  const action = location.id === "jobs" ? "jobBoard()" : `go('${location.id}')`;
  const ready =
    location.id === "garden"
      ? state.plots.filter((p) => p && p.age >= crop(p.id).days).length
      : 0;
  const badge = ready
    ? `${ready} ready`
    : location.id === "market" && state.marketOpen
      ? "Market open"
      : "";
  return `<button class="town-building town-${location.id}" data-location="${location.id}" onclick="${action}" aria-label="${location.name}">
    <svg class="town-building-art" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><defs><clipPath id="town-sprite-${location.id}"><path d="M0 0h512v512H0Z"/></clipPath></defs><g clip-path="url(#town-sprite-${location.id})"><image href="assets/town/buildings.png" width="1536" height="1024" x="${-512 * location.column}" y="${-512 * location.row}"/></g></svg>
    ${badge ? `<span class="town-badge">${badge}</span>` : ""}<span class="town-sign">${location.name}</span>
  </button>`;
}
function townFlower(x, y, color, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="town-flower" style="animation-delay:-${x % 7}s"><path d="M0 0Q-5-13 1-25M0-5q-13-8-12-1 3 8 12 8M0-8q12-9 12-1-3 8-12 7" fill="#487d35" stroke="#366f32" stroke-width="2"/><g fill="${color}" stroke="#e4b274" stroke-width=".7"><ellipse cx="1" cy="-28" rx="5" ry="9"/><ellipse cx="1" cy="-28" rx="5" ry="9" transform="rotate(72 1 -22)"/><ellipse cx="1" cy="-28" rx="5" ry="9" transform="rotate(144 1 -22)"/><ellipse cx="1" cy="-28" rx="5" ry="9" transform="rotate(216 1 -22)"/><ellipse cx="1" cy="-28" rx="5" ry="9" transform="rotate(288 1 -22)"/></g><circle cx="1" cy="-22" r="4" fill="#ffc846"/></g></g>`;
}
function townLandscape() {
  const flowers = [
    [18, 300, "#fff1bf", 0.8],
    [570, 320, "#f39c8e", 1],
    [28, 536, "#f19b80", 0.9],
    [572, 570, "#fff3c6", 1.1],
    [34, 736, "#e3a2bc", 1],
    [560, 747, "#fff2b1", 0.8],
    [75, 645, "#ffce6f", 0.65],
    [520, 424, "#fff2cf", 0.8],
  ];
  return `<svg class="town-landscape" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    ${flowers.map(([x, y, color, scale]) => townFlower(x, y, color, scale)).join("")}
    <g class="town-birds" fill="none" stroke="#5b7b75" stroke-width="3" stroke-linecap="round"><path d="M261 56q7-9 14 0 7-9 14 0M323 77q5-7 10 0 5-7 10 0"/></g>
  </svg>
  <svg class="town-butterfly butterfly-one" viewBox="0 0 40 40" aria-hidden="true"><g class="butterfly-wings" fill="#edaa53" stroke="#9e6447" stroke-width="1.5"><path d="M19 21C0-4 0 24 15 24 0 36 20 40 19 21ZM21 21C40-4 40 24 25 24 40 36 20 40 21 21Z"/></g><path d="M20 15v14m0-14-4-5m4 5 4-5" fill="none" stroke="#79523c" stroke-width="2"/></svg>
  <svg class="town-butterfly butterfly-two" viewBox="0 0 40 40" aria-hidden="true"><g class="butterfly-wings" fill="#e8b3c9" stroke="#9e6484" stroke-width="1.5"><path d="M19 21C0-4 0 24 15 24 0 36 20 40 19 21ZM21 21C40-4 40 24 25 24 40 36 20 40 21 21Z"/></g><path d="M20 15v14" stroke="#79523c" stroke-width="2"/></svg>`;
}
function townScene() {
  const goal = DREAMS[state.goal];
  const progress = Math.min(100, (100 * Game.savings(state)) / goal[3]);
  return `<section class="town-intro"><h1>My Garden Grows</h1><p>Pick a place. A little adventure awaits.</p></section>
    <section class="town-world" aria-label="Village locations">${townLandscape()}${TOWN_LOCATIONS.map(townBuilding).join("")}</section>
    <div class="town-bottom bottom"><div class="town-goal"><span>Saving for <strong>${goal[2]}</strong></span><span>${money(Game.savings(state))} / ${money(goal[3])}</span><div class="town-progress" role="progressbar" aria-label="Savings goal" aria-valuemin="0" aria-valuemax="${goal[3]}" aria-valuenow="${Math.min(goal[3], Game.savings(state))}"><span style="width:${progress}%"></span></div>${Game.debtTotal(state) ? `<span class="town-debt">Equipment owed: ${money(Game.debtTotal(state))}</span>` : ""}</div><button class="town-help" onclick="seedHelp()" aria-label="Community seed help">${navigationIcon("leaf")}</button></div>`;
}
