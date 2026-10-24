const ART = {
  town: "assets/scene-1.webp",
  dream: "assets/scene-2.webp",
  seeds: "assets/scene-3.webp",
  garden: "assets/scene-4.webp",
  supplies: "assets/scene-5.webp",
  market: "assets/scene-6.webp",
};
const CROPS = Game.crops;
const DREAMS = Game.dreams.map((item, i) => [
  item.id,
  ["⚽", "🚲", "📱", "🎸", "📷", "🐶"][i],
  item.name,
  item.price,
]);
const SUPPLIES = [
  ["table", "🪵", "Wooden market table", 8, "Attracts more customers"],
  ["canopy", "⛱️", "Striped shade canopy", 10, "Protects produce from the sun"],
  ["bags", "🛍️", "10 brown paper bags", 3, "Pack of ten"],
  [
    "scale",
    "⚖️",
    "Produce weighing scale",
    5,
    "Required for by-the-pound sales",
  ],
];
const PEOPLE = [
  "Maya",
  "Noah",
  "Ava",
  "Oliver",
  "Sophia",
  "Liam",
  "Ella",
  "Leo",
  "Emma",
  "Lucas",
  "Mia",
  "Henry",
  "Zoe",
  "Amelia",
  "Jack",
  "Grace",
  "Ethan",
  "Aria",
  "Ruby",
  "Mateo",
];

// Bounds measured against the unchanged 512 × 512 prototype artwork.
// Percentages share the stage coordinate system; crop order is explicitly mapped.
const SHOP_HOTSPOTS = {
  seeds: [
    ["carrot", 12, 54, 13, 18],
    ["corn", 29, 54, 13, 18],
    ["beans", 46, 54, 13, 18],
    ["strawberry", 63, 54, 14, 18],
    ["cucumber", 81, 54, 13, 18],
    ["tomato", 12, 77, 13, 19],
    ["lettuce", 29, 77, 13, 19],
    ["radish", 46, 77, 13, 19],
    ["onion", 63, 77, 14, 19],
    ["potato", 81, 77, 13, 19],
  ],
  dream: [
    ["ball", 8, 31, 13, 18],
    ["bike", 10, 64, 38, 30],
    ["tablet", 83, 29, 13, 21],
    ["guitar", 83, 53, 15, 31],
    ["camera", 62, 64, 17, 22],
    ["puppy", 58, 42, 19, 18],
  ],
  supplies: [
    ["table", 9, 33, 39, 24],
    ["canopy", 51, 32, 41, 26],
    ["bags", 18, 60, 27, 26],
    ["scale", 57, 60, 26, 25],
  ],
};
