/* Exterior presentation only. No timers, random rolls, game mutations, or save fields.
   The game's existing numbered 20-day seasons map to a repeating visual year. */
const VILLAGE_SEASONS = [
  {
    key: "spring",
    name: "Spring",
    column: 0,
    row: 0,
    tree: 0,
    flower: "#f1b2c8",
  },
  {
    key: "summer",
    name: "Summer",
    column: 1,
    row: 0,
    tree: 1,
    flower: "#ffd56a",
  },
  {
    key: "autumn",
    name: "Autumn",
    column: 0,
    row: 1,
    tree: 2,
    flower: "#dfaa63",
  },
  {
    key: "winter",
    name: "Winter",
    column: 1,
    row: 1,
    tree: 3,
    flower: "#e8eef1",
  },
];
const VILLAGE_ART = {
  buildings: {
    href: "assets/town/buildings.webp",
    columns: 3,
    rows: 2,
    width: 1,
    height: 1,
  },
  terrain: {
    href: "assets/town/seasons.webp",
    columns: 2,
    rows: 2,
    width: 3,
    height: 4,
  },
  life: {
    href: "assets/town/life.webp",
    columns: 4,
    rows: 2,
    width: 1,
    height: 1,
    // Tight source frames isolate the complete bench and neighboring farmer.
    frames: {
      "square-bench": { x: 2.8, y: 1, width: 1.2, height: 1 },
      "market-neighbor": { x: 2, y: 1, width: 0.8, height: 1 },
    },
  },
};
function villageSeason(number) {
  return VILLAGE_SEASONS[(((number - 1) % 4) + 4) % 4];
}
function villageSprite(kind, column, row, id, className) {
  const art = VILLAGE_ART[kind];
  const frame = art.frames?.[id] || {
    x: column * art.width,
    y: row * art.height,
    width: art.width,
    height: art.height,
  };
  return `<svg class="${className}" viewBox="0 0 ${frame.width} ${frame.height}" aria-hidden="true" focusable="false" ${kind === "terrain" ? 'preserveAspectRatio="none"' : ""}>
    <defs><clipPath id="village-${id}"><path d="M0 0h${frame.width}v${frame.height}H0Z"/></clipPath></defs>
    <g clip-path="url(#village-${id})"><image href="${art.href}" width="${art.columns * art.width}" height="${art.rows * art.height}" x="${-frame.x}" y="${-frame.y}"/></g>
  </svg>`;
}
function villageTerrain(theme) {
  return `<div class="village-terrain" data-village-layer="terrain">${villageSprite("terrain", theme.column, theme.row, "terrain", "village-terrain-art")}</div>`;
}
function villageScenery(theme) {
  return `    <div class="village-trees" data-village-layer="trees" aria-hidden="true">
      <span class="village-tree tree-back">${villageSprite("life", theme.tree, 0, "tree-back", "village-tree-art")}</span>
      <span class="village-tree tree-square">${villageSprite("life", theme.tree, 0, "tree-square", "village-tree-art")}</span>
      <span class="village-tree tree-front">${villageSprite("life", theme.tree, 0, "tree-front", "village-tree-art")}</span>
    </div>
    <div class="village-fixtures" data-village-layer="fixtures" aria-hidden="true">
      <span class="village-square-bench">${villageSprite("life", 3, 1, "square-bench", "village-fixture-art")}</span>
    </div>`;
}
function villageResidents(theme) {
  return `<div class="village-residents" data-village-layer="ambient" aria-hidden="true">
    <div class="village-walk-track walk-to-square" data-village-walker="neighbor">${villageSprite("life", 0, 1, "neighbor-walk", "village-person neighbor-walk")}</div>
    <div class="village-walk-track walk-from-garden" data-village-walker="child">${villageSprite("life", 1, 1, "child-walk", "village-person child-walk")}</div>
    <div class="village-walk-track villager-market-stop" data-village-walker="market">${villageSprite("life", 2, 1, "market-neighbor", "village-person market-neighbor")}</div>
    <div class="village-bird-track"><svg class="village-flying-birds" viewBox="0 0 64 32" fill="none" stroke="${theme.key === "winter" ? "#526579" : "#466861"}" stroke-width="2.3" stroke-linecap="round"><path d="M3 15q7-10 14 0 7-10 14 0M37 25q5-7 10 0 5-7 10 0"/></svg></div>
    ${theme.key === "autumn" ? '<span class="village-leaf leaf-one"></span><span class="village-leaf leaf-two"></span>' : ""}
  </div>`;
}
