/* Connect illustrated scenes to tested game rules. Prototype assets remain unchanged. */
function act(fn) {
  try {
    fn();
    return true;
  } catch (e) {
    show(`<h2>Let's try that again</h2><p>${e.message}</p>`);
    return false;
  }
}
function checkout(kind) {
  act(() => {
    const total = Game.purchase(state, kind);
    show(
      `<h2>Purchase complete!</h2><p>You paid ${money(total)}. Your balance is ${money(state.cash)}.</p>`,
    );
  });
}
function change(kind, id, d) {
  const max = kind === "supcart" ? 1 : 100;
  state[kind][id] = Math.max(0, Math.min(max, (state[kind][id] || 0) + d));
  if (id === "bundle") bundleInfo();
  else if (kind === "cart") seed(id);
  else supply(id);
}
function bundleInfo() {
  show(
    `<h2>📦 Variety bundle · $11</h2><p>3 carrots, 2 onions, 2 beans, 1 strawberry. Individually $12 · save $1.</p><div class="qty"><button onclick="change('cart','bundle',-1)">−</button><b>${state.cart.bundle || 0} bundles</b><button onclick="change('cart','bundle',1)">+</button></div><button class="btn" onclick="cart('seeds')">View basket</button>`,
  );
}
function cart(kind) {
  if (kind !== "seeds") return supplyCartDialog(kind);
  const items = [
    ...CROPS.map((c) => [c.id, c.name, c.seed]),
    ["bundle", "Variety bundle", 11],
  ];
  show(
    `<h2>Shopping basket</h2>${
      items
        .filter(([id]) => state.cart[id])
        .map(
          ([id, name, p]) =>
            `<p>${name} × ${state.cart[id]} = ${money(p * state.cart[id])}</p>`,
        )
        .join("") || "<p>Your basket is empty.</p>"
    }<p>Total: ${money(Game.cartTotal(state, "seeds"))}</p><button class="btn" onclick="checkout('seeds')">Pay at checkout</button><button class="btn alt" onclick="closeDialog()">Keep shopping</button>`,
  );
}
function plant(i, id) {
  act(() => {
    Game.plan(state, i, id);
    closeDialog();
  });
}
function plot(i) {
  if (state.plan[i]) {
    delete state.plan[i];
    render();
  } else plotDialog(i);
}
function plantPlanned() {
  act(() => {
    Game.plantPlan(state);
    render();
  });
}
function water() {
  Game.water(state);
  render();
}
function endDay() {
  Game.endDay(state);
  popup = "";
  render();
}
function harvest(i) {
  act(() => {
    const message = Game.harvest(state, i);
    show(`<h2>Harvest basket</h2><p>${message}</p>`);
  });
}
function marketStand() {
  show(
    `<h2>Arrange your market stand</h2>${standOptions()}${
      CROPS.filter((c) => state.inventory[c.id])
        .map(
          (c) =>
            `<div class="basketline">${c.icon} ${c.name}: ${state.inventory[c.id]} ${c.unit} harvested<div class="qty"><button onclick="displayChange('${c.id}',-1)">−</button><b>${state.display[c.id] || 0} on display</b><button onclick="displayChange('${c.id}',1)">+</button></div></div>`,
        )
        .join("") || "<p>Harvest some produce first.</p>"
    }${!state.marketOpen ? '<button class="btn" onclick="openMarket()">Open market</button>' : '<button class="btn" onclick="closeDialog()">Ready to serve</button>'}`,
  );
}
function displayChange(id, d) {
  if (state.customer) return;
  state.display[id] = Math.max(
    0,
    Math.min(state.inventory[id] || 0, (state.display[id] || 0) + d),
  );
  marketStand();
}
function openMarket() {
  act(() => {
    Game.openMarket(state);
    closeDialog();
  });
}
function closeMarket() {
  Game.closeMarket(state);
  closeDialog();
}
function newCustomer() {
  act(() => {
    Game.newCustomer(
      state,
      PEOPLE[(state.day * 3 + state.visitors) % PEOPLE.length],
    );
    render();
  });
}
function ring() {
  const input = document.getElementById("total-answer");
  act(() => {
    Game.ring(state, input && input.value !== "" ? Number(input.value) : NaN);
    closeDialog();
  });
}
function finish() {
  act(() => {
    Game.finish(state);
    popup = "";
    if (state.cash >= DREAMS[state.goal][3] && !state.won) {
      state.won = true;
      show(
        `<h2>🎉 Dream achieved!</h2><p>You reached your savings goal. Keep growing or choose another dream!</p>`,
      );
    } else render();
  });
}
function advance() {
  act(() => {
    Game.advanceCustomer(state);
    render();
  });
}
function nextMarket() {
  show(
    "<h2>Market closed for today</h2><p>Return to your garden and end the day before reopening.</p>",
  );
}
function standLabel() {
  return state.standMode === "owned" && state.owned.table
    ? "Owned table"
    : state.standMode === "rental"
      ? state.tableRented
        ? "Rented table · paid today"
        : "Table rental · $1 when opening"
      : "Free blanket";
}
function standOptions() {
  if (state.marketPlayed || state.marketOpen)
    return `<p>${standLabel()} · up to ${Game.customerLimit(state)} customers today.</p>`;
  return `<fieldset><legend>Choose today's stand</legend>
    <p>Blanket: free, up to 3 customers. Table: up to 6 customers. Produce prices stay the same; more visitors give more chances to sell.</p>
    <button class="btn ${state.standMode === "blanket" ? "" : "alt"}" aria-pressed="${state.standMode === "blanket"}" onclick="selectStand('blanket')">Free blanket · $0</button>
    ${state.owned.table ? `<button class="btn ${state.standMode === "owned" ? "" : "alt"}" aria-pressed="${state.standMode === "owned"}" onclick="selectStand('owned')">Use owned table · $0</button>` : `<button class="btn ${state.standMode === "rental" ? "" : "alt"}" aria-pressed="${state.standMode === "rental"}" onclick="selectStand('rental')">Rent table · $1 today</button>`}
    <p>${standLabel()}. Rentals are paid once when you open, end when the farming day ends, and never renew automatically.</p></fieldset>`;
}
function selectStand(mode) {
  act(() => {
    Game.chooseStand(state, mode);
    marketStand();
  });
}
function jobBoard() {
  show(
    '<h2>📋 Town Job Board</h2><p>Coming soon: earn money by helping your neighbors with educational challenges.</p><p>No jobs or math challenges are available yet. You do not need to restart your farm if money runs low.</p><button class="btn alt" onclick="seedHelp()">Visit community seed help</button>',
  );
}
function seedHelp() {
  show(`<h2>🌱 Community seed help</h2><p>If you have less than $1 and no crops you can grow or sell with your equipment, your neighbors will share 3 carrot seeds. No fee, debt, or farm reset.</p>
    ${Game.canReceiveSeedHelp(state) ? '<button class="btn" onclick="claimSeedHelp()">Accept 3 free carrot seeds</button>' : "<p>You have a way forward: buy a seed packet, plant your seeds, water your crops, or sell your harvest. Selling from a blanket is always free.</p>"}`);
}
function claimSeedHelp() {
  act(() => {
    const message = Game.receiveSeedHelp(state);
    show(
      `<h2>A fresh start for your garden</h2><p>${message}</p><button class="btn" onclick="go('garden')">Go plant carrots</button>`,
    );
  });
}
// Show counting-up feedback while preserving explicit collection of payment/change.
function payment() {
  paymentDialog();
  const dialog = document.querySelector(".dialog");
  if (dialog) {
    const p = document.createElement("p");
    p.textContent = `Count up: ${money(Game.totalOrder(state) + state.change)} → ${money(state.tendered)}`;
    dialog.append(p);
  }
}
// Include bundle value in the scene basket summary.
function render() {
  renderScene();
  if (view === "seeds") {
    const bottom = document.querySelector(".bottom");
    const basket = bottom.querySelector("button:last-child");
    basket.textContent = `🛒 Basket (${Object.values(state.cart).reduce((a, b) => a + b, 0)}) · ${money(Game.cartTotal(state, "seeds"))}`;
  }
  if (document.body.dataset.saveWarning) {
    const p = document.createElement("p");
    p.setAttribute("role", "alert");
    p.textContent = document.body.dataset.saveWarning;
    document.querySelector(".bottom").append(p);
  }
}
render();
