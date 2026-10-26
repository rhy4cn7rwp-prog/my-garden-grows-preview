/* The room is scenery; each owned reward is its own illustrated touch control.
   All ownership and purchase calculations live in Game, never in the artwork. */
const CLUBHOUSE_DISPLAYS = {
  ball: { bounds: "60 102 385 380", area: "Sports corner" },
  bike: { bounds: "496 58 575 452", area: "Sports corner" },
  tablet: { bounds: "1080 116 430 388", area: "Toy shelf" },
  guitar: { bounds: "94 490 276 492", area: "Music nook" },
  camera: { bounds: "551 606 442 365", area: "Collectibles shelf" },
  puppy: { bounds: "1060 535 455 442", area: "Keepsake chest" },
};
function clubhouseRewardArt(id, className = "") {
  const slot = CLUBHOUSE_DISPLAYS[id];
  const [x, y, width, height] = slot.bounds.split(" "),
    clip = `reward-${id}-${className || "room"}`;
  return `<svg class="clubhouse-reward-art ${className}" viewBox="${slot.bounds}" aria-hidden="true" focusable="false"><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><image href="assets/clubhouse/rewards.webp" width="1535" height="1024" clip-path="url(#${clip})"/></svg>`;
}
function clubhouseScene() {
  const owned = Game.dreams.filter((d) => Game.ownsDream(state, d.id));
  return `<section class="clubhouse-heading"><h1>My Clubhouse</h1><p>Swipe around or up/down · Hold a treasure to move</p></section>
    <section class="clubhouse-world" tabindex="0" aria-label="Clubhouse panorama. Swipe to turn or use the Look buttons."><div class="clubhouse-room">
      <img class="clubhouse-room-art" src="assets/clubhouse/panorama.webp" alt="A connected wooden hideaway: reading bench to the left, round window and seating nook in the middle, shelves and toy chest to the right, and a wooden floor with a braided rug." fetchpriority="high"/>
      <canvas class="clubhouse-panorama" aria-hidden="true"></canvas>
      <svg class="clubhouse-drop-surfaces" aria-hidden="true"></svg>
      <div class="clubhouse-displays" aria-label="Purchased dream collection">${owned.map((d) => `<button class="clubhouse-item clubhouse-${d.id}" data-dream="${d.id}" onclick="clubhouseItem('${d.id}')" aria-label="${d.name} · ${CLUBHOUSE_DISPLAYS[d.id].area}"><span class="clubhouse-visual"><span class="clubhouse-contact-shadow"></span>${clubhouseRewardArt(d.id)}</span></button>`).join("")}</div>
    <button class="clubhouse-guidebook" onclick="openGuidebook()" aria-label="Open How to Play book"><img src="${CLUBHOUSE_BOOK.art}" alt="How to Play"/></button><div class="clubhouse-chest-displays"></div></div><canvas class="clubhouse-occlusion" aria-hidden="true"></canvas></section>
    <div class="clubhouse-bottom bottom"><div class="clubhouse-look-controls" aria-label="Look around the clubhouse"><button class="btn" onclick="turnClubhouse(-30)" aria-label="Look left">←</button><button class="btn alt" onclick="centerClubhouse()" aria-label="Look straight ahead">Center</button><button class="btn" onclick="turnClubhouse(30)" aria-label="Look right">→</button><button class="btn alt" onclick="clubhouseTreasures()">My treasures</button></div><output class="clubhouse-direction" aria-label="Viewing direction">Looking straight ahead</output>${state.marketOpen ? '<button class="btn resume-market" onclick="go(\'market\')">Resume Market</button>' : ""}<div class="clubhouse-home-actions"><button class="btn" onclick="go('town')">Go to Town</button><button class="btn alt clubhouse-book-shortcut" onclick="openGuidebook()">How to Play</button><button class="btn alt" onclick="go('dream')">Dream Shop</button></div><span class="clubhouse-status" role="status" aria-live="polite"></span></div>`;
}
function clubhouseItem(id) {
  if (!Game.ownsDream(state, id)) return;
  const item = Game.dreams.find((d) => d.id === id),
    record = state.dreamPurchases[id];
  show(
    `<h2>${item.name}</h2>${clubhouseRewardArt(id, "dream-preview-art")}<p>${CLUBHOUSE_DISPLAYS[id].area} · Yours to keep!<br><small>${ClubhouseLayout.placementHint(id)}</small></p><p>${record.season && record.day ? `Purchased in Season ${record.season}, Day ${Game.farmDay(record)}.` : "Purchase date was not recorded."}</p>${record.price !== null && record.price !== undefined ? `<p>Saved and purchased for ${money(record.price)}.</p>` : ""}${id === "puppy" ? "<p>Your puppy-fund keepsake celebrates saving for a future furry friend.</p>" : ""}${view === "clubhouse" ? '<button class="btn" onclick="restoreClubhouseItem(\'' + id + "')\">Restore default position</button>" : '<button class="btn" onclick="go(\'clubhouse\')">See it in my Clubhouse</button>'}`,
    "clubhouse-" + id,
  );
}
function chooseDreamGoal(id) {
  act(() => {
    const index = Game.dreams.findIndex((d) => d.id === id);
    if (index !== state.goal) Game.chooseGoal(state, index);
    if (!congratulateDreamGoal()) closeDialog();
  });
}
function congratulateDreamGoal() {
  const item = Game.acknowledgeGoal(state);
  if (!item) return false;
  show(
    `<h2>Congratulations! Dream achieved!</h2><p>You saved enough for your ${item.name.toLowerCase()}!</p><p>Your money is still yours. When you are ready, visit the Dream Shop and choose Buy for ${money(item.price)} to purchase your reward.</p><button class="btn" onclick="closeDialog()">Keep playing</button>`,
  );
  return true;
}
function chooseNextDreamGoal() {
  const available = Game.dreams.filter((d) => !Game.ownsDream(state, d.id));
  show(
    `<h2>What will you dream of next?</h2><p>Choose your next savings goal. Choosing a goal does not spend any money.</p>${available.map((d) => `<button class="btn next-dream-choice" onclick="chooseDreamGoal('${d.id}')">Save for ${d.name} · ${money(d.price)}</button>`).join("")}`,
  );
}
function buyDream(id) {
  act(() => {
    const price = Game.purchaseDream(state, id);
    // Commit before opening the confirmation, so a refresh cannot lose ownership.
    save();
    const item = Game.dreams.find((d) => d.id === id);
    show(
      `<h2>A dream to call your own!</h2>${clubhouseRewardArt(id, "dream-preview-art")}<p>You bought your ${item.name.toLowerCase()} for ${money(price)}. Your balance is ${money(state.cash)}.</p><p>It is waiting in your clubhouse.</p><button class="btn" onclick="go('clubhouse')">Visit my Clubhouse</button>${Game.ownsDream(state, Game.dreams[state.goal].id) && Game.dreams.some((d) => !Game.ownsDream(state, d.id)) ? '<button class="btn" onclick="chooseNextDreamGoal()">Choose next savings goal</button>' : ""}`,
    );
  });
}
function syncClubhouseCanvas() {
  const root = document.documentElement;
  // A Safari viewport event may arrive before scenes.js initializes `view`.
  if (document.body?.dataset.view !== "clubhouse") {
    delete root.dataset.clubhouseCanvas;
    return;
  }
  if (root.dataset.clubhouseCanvas !== "true")
    root.dataset.clubhouseCanvas = "true";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta?.content !== "#dca85e") meta?.setAttribute("content", "#dca85e");
}
