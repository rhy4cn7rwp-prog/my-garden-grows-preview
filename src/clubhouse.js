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
function clubhouseDisplaySupport(id) {
  if (!["camera", "tablet"].includes(id)) return "";
  return '<svg class="clubhouse-display-support" viewBox="0 0 120 24" aria-hidden="true"><path d="M6 2h108l5 8-6 5H7l-6-5Z" fill="#e6ad62" stroke="#88582f" stroke-width="2"/><path d="M2 10h116M16 6h30m17 0h33M20 15v6h9l5-6m52 0 5 6h9v-6" fill="none" stroke="#b3783e" stroke-width="2"/></svg>';
}
function clubhouseScene() {
  const owned = Game.dreams.filter((d) => Game.ownsDream(state, d.id));
  return `<section class="clubhouse-heading"><h1>My Clubhouse</h1><p>${owned.length ? "Tap a treasure to remember your adventure." : "A little hideaway, ready for your dreams."}</p></section>
    <section class="clubhouse-world" aria-label="Your illustrated clubhouse"><div class="clubhouse-room">
      <img class="clubhouse-room-art" src="assets/clubhouse/room.webp" alt="A sunny wooden hideaway with an arched window seat, empty display shelves, a toy chest and a braided rug." fetchpriority="high"/>
      <div class="clubhouse-displays" aria-label="Purchased dream collection">${owned.map((d) => `<button class="clubhouse-item clubhouse-${d.id}" data-dream="${d.id}" onclick="clubhouseItem('${d.id}')" aria-label="${d.name} · ${CLUBHOUSE_DISPLAYS[d.id].area}">${clubhouseRewardArt(d.id)}${clubhouseDisplaySupport(d.id)}</button>`).join("")}</div>
    </div></section>
    <div class="clubhouse-bottom bottom"><p>${owned.length ? `${owned.length} of ${Game.dreams.length} dreams collected · Made yours, one dream at a time.` : "Earn and save at your farm, then visit the Dream Shop."}</p><button class="btn" onclick="go('town')">Return to village</button><button class="btn alt" onclick="go('dream')">Dream Shop</button></div>`;
}
function clubhouseItem(id) {
  if (!Game.ownsDream(state, id)) return;
  const item = Game.dreams.find((d) => d.id === id),
    record = state.dreamPurchases[id];
  show(
    `<h2>${item.name}</h2>${clubhouseRewardArt(id, "dream-preview-art")}<p>${CLUBHOUSE_DISPLAYS[id].area} · Yours to keep!</p><p>${record.season && record.day ? `Purchased in Season ${record.season}, Day ${record.day}.` : "Purchase date was not recorded."}</p>${record.price !== null && record.price !== undefined ? `<p>Saved and purchased for ${money(record.price)}.</p>` : ""}${id === "puppy" ? "<p>Your puppy-fund keepsake celebrates saving for a future furry friend.</p>" : ""}${view === "clubhouse" ? "" : '<button class="btn" onclick="go(\'clubhouse\')">See it in my Clubhouse</button>'}`,
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
