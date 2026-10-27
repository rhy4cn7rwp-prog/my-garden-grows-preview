/* Job Board-only artwork: reusable layers, never game state or hit geometry. */
const JobPolishArt = (() => {
  const file = (id) => `assets/job-polish/${id}.webp`;
  const svg = (id, box, label = "", classes = "") =>
    `<svg class="polished-job-art ${classes}" viewBox="${box}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><image href="${file(id)}" width="${box.split(" ")[2]}" height="${box.split(" ")[3]}" preserveAspectRatio="xMidYMid meet"/></svg>`;
  function character(id) {
    const label =
      id === "jones"
        ? "Mr. Jones, a smiling gardener in a straw hat and overalls"
        : "Mrs. Magee, a smiling gardener with silver hair, glasses and a flower apron";
    return `<svg class="polished-job-character" viewBox="0 0 200 300" role="img" aria-label="${label}"><g class="${id === "jones" ? "jones-body" : "magee-body"}"><image href="${file(id)}" width="200" height="300"/></g></svg>`;
  }
  function field() {
    return `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${file("catch-garden")}" width="800" height="500" preserveAspectRatio="xMidYMid slice"/></svg>`;
  }
  function flower(done, variant = 0) {
    return `<svg class="polished-flower ${done ? "watered" : "thirsty"}" viewBox="0 0 200 240" aria-hidden="true"><ellipse cx="100" cy="214" rx="88" ry="23" fill="${done ? "#67422d" : "#b59265"}"/><image href="${file("flowers")}" x="0" y="0" width="200" height="225" transform="${variant % 2 ? "translate(200 0) scale(-1 1)" : ""}"/>${done ? '<g fill="#81d0ed" stroke="#e4f6fc" stroke-width="2"><path d="M30 170q-15 25 0 27 17-2 0-27M170 160q-15 25 0 27 17-2 0-27"/></g>' : ""}</svg>`;
  }
  function ground(kind) {
    if (kind === "tree")
      return `<svg viewBox="0 0 200 240" aria-hidden="true"><path d="M91 215 95 95h15l8 120" fill="#9c7149"/><g fill="#6f9d48" stroke="#497536" stroke-width="4"><circle cx="73" cy="90" r="43"/><circle cx="130" cy="90" r="43"/><circle cx="103" cy="56" r="44"/></g><g fill="#a7c56c" opacity=".55"><ellipse cx="77" cy="65" rx="20" ry="14"/><ellipse cx="108" cy="36" rx="20" ry="12"/></g></svg>`;
    return `<svg viewBox="0 0 200 240" aria-hidden="true"><path d="M15 135h170l-13 77H28Z" fill="#9f7348" stroke="#6d4a2e" stroke-width="4"/><path d="M15 135 49 106h114l22 29Z" fill="#6d4b32"/><image href="${file("flowers")}" x="25" y="0" width="150" height="160"/></svg>`;
  }
  function thumbnail(id) {
    if (id === "labels") return character("magee");
    if (id === "catch") return character("jones");
    const pics = {
      words: "words",
      packing: "packing",
      stacks: "stacks",
      match: "stacks",
      weeds: "weeds",
      tomatoes: "tomatoes",
      flowers: "flowers",
      tidy: "tidy",
    };
    return `<svg class="job-polished-thumbnail" viewBox="0 0 220 140" role="img" aria-label="${{ words: "Garden word search", packing: "Warm wooden packing shed", stacks: "Vegetable sorting crates", match: "Colorful vegetable matching", weeds: "Carrot garden", tomatoes: "Tomato harvest", flowers: "Flower garden", tidy: "Flower-lined neighborhood lawn" }[id]}"><image href="assets/job-polish/thumbs/${pics[id]}.webp" width="220" height="140" preserveAspectRatio="xMidYMid slice"/></svg>`;
  }
  function tomato(green) {
    return `<svg class="job-symbol polished-tomato" viewBox="${green ? 550 : 50} 60 400 400" aria-hidden="true"><image href="${file("tomatoes")}" width="1000" height="500"/></svg>`;
  }
  return { tomato, svg, character, field, flower, ground, thumbnail };
})();
