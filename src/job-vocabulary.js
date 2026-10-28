/* Curated gardening words; immutable plans make saved puzzles replayable. */
(function (root) {
  "use strict";
  const little =
    "SUN POT MUD DIG SEED SOIL ROOT STEM LEAF RAIN GROW FARM ROW WEED BUD PEA PEAS BEAN CORN MINT KALE OATS HAY BARN SHED RAKE HOE PLUM PEAR POND WORM BEE GATE PATH".split(
      " ",
    );
  const all = [
    ...new Set([
      ...little,
      ..."LEAVES WATER PLANT GARDEN FIELD GRASS FLOWER BLOOM FRUIT APPLE PEACH GRAPE BERRY MELON BEANS CARROT TOMATO POTATO ONION GARLIC PEPPER LETTUCE CABBAGE SQUASH PUMPKIN CUCUMBER RADISH TURNIP BROCCOLI SPINACH HERB BASIL THYME SAGE WHEAT TRACTOR SHOVEL SPADE BUCKET BASKET CRATE HARVEST MARKET FARMER ORCHARD FENCE BUTTERFLY LADYBUG COMPOST MULCH SPRINKLER HOSE GREENHOUSE SUNSHINE SEEDLING ACORN APRICOT CELERY CHERRY CLOVER DILL FERN FIG HEDGE LEMON LIME NEST OLIVE PARSNIP PETAL POLLEN ROSE SPROUT TRELLIS TULIP".split(
        " ",
      ),
    ]),
  ];
  const clues = {
    SUN: "The sun warms our garden.",
    POT: "A pot holds soil and a plant.",
    MUD: "Wet soil makes mud.",
    DIG: "We dig a hole to plant.",
    SEED: "A tiny seed can grow.",
    SOIL: "Roots grow in soil.",
    ROOT: "A root grows under the soil.",
    STEM: "A stem holds up leaves.",
    LEAF: "A green leaf catches sunshine.",
    RAIN: "Rain gives plants water.",
    GROW: "A little sprout can grow tall.",
    FARM: "A farm grows food.",
    ROW: "Plants can grow in a row.",
    WEED: "A weed grows where we do not want it.",
    BUD: "A bud will open into a flower.",
    PEA: "A pea grows inside a pod.",
    PEAS: "Peas grow together in a pod.",
    BEAN: "A bean grows in a long pod.",
    CORN: "Corn grows on a tall stalk.",
    MINT: "Mint has sweet-smelling leaves.",
    KALE: "Kale has curly green leaves.",
    OATS: "Oats grow on waving stems.",
    HAY: "Dried grass becomes hay.",
    BARN: "A barn is a farm building.",
    SHED: "A shed stores garden tools.",
    RAKE: "A rake gathers leaves.",
    HOE: "A hoe loosens soil.",
    PLUM: "A plum is a round purple fruit.",
    PEAR: "A pear grows on a tree.",
    POND: "A pond is a small body of water.",
    WORM: "A worm helps the soil.",
    BEE: "A bee visits flowers.",
    GATE: "A gate opens in a fence.",
    PATH: "A path leads through the garden.",
  };
  function pool(mode) {
    return mode === "little" ? little : all;
  }
  function choose(mode, id, seed, history = [], count) {
    let n = seed >>> 0;
    const r = () => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return n / 4294967296;
    };
    const choices = pool(mode).slice();
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    choices.sort((a, b) => {
      const ai = history.lastIndexOf(a),
        bi = history.lastIndexOf(b);
      return (ai < 0 ? -1 : ai) - (bi < 0 ? -1 : bi);
    });
    return choices.slice(
      0,
      count ??
        (id === "words"
          ? mode === "little"
            ? 3
            : 4
          : mode === "little"
            ? 2
            : 3),
    );
  }
  function valid(plan, mode, id, version = 3) {
    return (
      Array.isArray(plan) &&
      plan.length ===
        (id === "words" && version >= 6
          ? 8
          : id === "words"
            ? mode === "little"
              ? 3
              : 4
            : mode === "little"
              ? 2
              : 3) &&
      new Set(plan).size === plan.length &&
      plan.every((w) => pool(mode).includes(w))
    );
  }
  const api = { all, little, pool, choose, valid, clues };
  if (typeof module !== "undefined") module.exports = api;
  root.JobVocabulary = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
