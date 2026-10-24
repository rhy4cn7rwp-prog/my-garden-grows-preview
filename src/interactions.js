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
  const max = kind === "supcart" && id !== "bags" ? 1 : 100;
  state[kind][id] = Math.max(0, Math.min(max, (state[kind][id] || 0) + d));
  if (id === "bundle") bundleInfo();
  else if (kind === "cart") seed(id);
  else supply(id);
}
function bundleInfo() {
  show(
    `<h2>📦 Variety bundle · $11</h2><p>3 carrots, 2 onions, 2 beans, 1 strawberry. Individually $12 · save $1.</p><div class="qty"><button onclick="change('cart','bundle',-1)">−</button><b>${state.cart.bundle || 0} bundles</b><button onclick="change('cart','bundle',1)">+</button></div><button class="btn" onclick="cart('seeds')">View basket</button>`,
    "bundle",
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
    Game.cancelPlan(state, i);
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
  const paid = Game.settleMarket(state);
  Game.endDay(state);
  state.notice = `A new farming day. Equipment charges paid from market earnings: ${money(paid)}. Still owed: ${money(Game.debtTotal(state))}.`;
  popup = "";
  render();
}
function harvest(i) {
  act(() => {
    const message = Game.harvest(state, i);
    state.notice = message;
    popup = "";
    dialogKey = null;
    render();
  });
}
function marketStand() {
  show(
    `<h2>Arrange your market stand</h2>${bagStatus()}<p>Every completed purchase uses exactly one bag, regardless of items or quantities.</p>${standOptions()}${financeSummary()}<button class="btn alt" onclick="rentalMenu()">Daily equipment rentals</button><button class="btn" onclick="addAllProduce()" ${state.customer ? "disabled" : ""}>Add All Produce to Stand</button>${state.notice ? `<p role="status">${state.notice}</p>` : ""}${
      CROPS.filter((c) => state.inventory[c.id])
        .map(
          (c) =>
            `<div class="basketline">${c.icon} ${c.name}: ${state.inventory[c.id]} ${c.unit} harvested<div class="qty"><button onclick="displayChange('${c.id}',-1)" ${state.customer ? "disabled" : ""}>−</button><b>${state.display[c.id] || 0} on display</b><button onclick="displayChange('${c.id}',1)" ${state.customer ? "disabled" : ""}>+</button></div></div>`,
        )
        .join("") || "<p>Harvest some produce first.</p>"
    }${!state.marketOpen && !state.marketPlayed ? '<button class="btn" onclick="openMarket()">Open market</button>' : '<button class="btn" onclick="closeDialog()">Ready to serve</button>'}`,
    "market-stand",
  );
}
function displayChange(id, d) {
  if (state.customer) return;
  if (d > 0 && !Game.canSellCrop(state, id)) {
    state.notice =
      "Rent or buy a scale before adding produce sold by the pound.";
    marketStand();
    return;
  }
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
  showMarketReport();
}
function newCustomer() {
  if (state.visitors >= Game.customerLimit(state)) {
    show(
      `<h2>Your market day</h2><p>${Game.hasMarketTable(state) ? "Your table welcomed " + state.visitors + " customers today! Come back tomorrow for another market." : "Your blanket attracted 3 customers today! Some shoppers chose other vendors with tables and canopies instead. A better market setup could help you attract more customers tomorrow."}</p><button class="btn" onclick="closeMarket()">Close market</button>`,
    );
    return;
  }
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
  if (state.step === "pay" && Game.bagsRemaining(state) === 0) {
    bagShop();
    return;
  }
  act(() => {
    Game.finish(state);
    popup = "";
    if (Game.savings(state) >= DREAMS[state.goal][3] && !state.won) {
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
        ? state.rentals.table?.payment === "deferred"
          ? "Rented table · $3 charge recorded"
          : "Rented table · paid today"
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
    <p>${standLabel()}. The usual table rental costs $1 when opening. If you cannot pay upfront, review the $3 pay-after-market option. Rentals expire at End Day and never renew automatically.</p></fieldset>`;
}
function selectStand(mode) {
  act(() => {
    if (mode === "rental" && !state.tableRented && state.cash < 1) {
      rentalOffer("table");
      return;
    }
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
  show(`<h2>🌱 Community seed help</h2><p>If you have less than $1 and cannot keep selling, your neighbors can share starter seeds or bags. No fee, debt, or farm reset.</p>
    ${Game.canReceiveSeedHelp(state) ? '<button class="btn" onclick="claimSeedHelp()">Accept community help</button>' : "<p>You have a way forward: buy a seed packet, plant your seeds, water your crops, or sell your harvest. Selling from a blanket is always free.</p>"}`);
}
function claimSeedHelp() {
  act(() => {
    const message = Game.receiveSeedHelp(state);
    show(
      `<h2>A fresh start for your garden</h2><p>${message}</p><button class="btn" onclick="go('garden')">${state.seeds.carrot > 0 ? "Go plant carrots" : "Visit garden"}</button>${Object.values(state.inventory).some((n) => n > 0) ? '<button class="btn" onclick="go(\'market\')">Visit market</button>' : ""}`,
    );
  });
}
// Show counting-up feedback while preserving explicit collection of payment/change.
function payment() {
  paymentDialog();
}
function bagStatus(compact = false) {
  return `<div class="bag-status ${compact ? "register-bags" : ""}"><p><strong>Paper bags remaining: ${Game.bagsRemaining(state)}</strong>${compact ? "" : `<span class="small"> (${state.bagCount} purchased; ${state.rentalBagsRemaining} daily-use)</span>`}</p><button class="btn alt" onclick="bagShop()">Buy more bags</button></div>`;
}
function bagShop() {
  show(
    `<h2>Paper bag refill</h2>${bagStatusCount()}<p>A pack costs $3 and contains exactly 10 paper bags. Purchased bags carry over between days. Every completed customer purchase uses exactly one bag, regardless of items or quantities.</p><p>Your cash: ${money(state.cash)}</p><button class="btn" onclick="buyBagsNow()" ${state.cash >= 3 ? "" : "disabled"}>Buy 10 bags · $3</button>${!state.rentals.bags && Game.bagsRemaining(state) === 0 ? '<button class="btn alt" onclick="rentalOffer(\'bags\')">Review daily-use bags</button>' : ""}<button class="btn alt" onclick="returnFromBags()">${state.customer ? "Return to customer" : "Return to market preparation"}</button>`,
    "bag-shop",
  );
}
function bagStatusCount() {
  return `<p role="status">Paper bags remaining: ${Game.bagsRemaining(state)}</p>`;
}
function buyBagsNow() {
  act(() => {
    Game.buyBagPacks(state);
    state.notice = "Bought 10 paper bags for $3.";
    returnFromBags();
  });
}
function returnFromBags() {
  if (state.customer && state.step === "choose") order();
  else if (state.customer && state.step === "pay") payment();
  else if (state.customer) closeDialog();
  else marketStand();
}
function financeSummary() {
  const debt = Game.debtTotal(state);
  return `<p>Equipment ready: ${["table", "scale", "bags"].filter((id) => Game.hasEquipment(state, id)).join(", ") || "none — the blanket is free"}.</p>
    <p><strong>Outstanding equipment charges: ${money(debt)}</strong></p>
    ${debt ? `<ul>${state.equipmentDebt.map((d) => `<li>${d.id}: ${money(d.cents / 100)} · season/day ${d.day.replace(":", "/")}</li>`).join("")}</ul><p>Charges are deducted from market earnings at closing. Any unpaid amount carries forward without interest.</p><button class="btn alt" onclick="payCharges()" ${state.cash > 0 ? "" : "disabled"}>Pay up to ${money(Math.min(debt, state.cash))} from cash now</button>` : ""}`;
}
function rentalMenu() {
  show(
    `<h2>Daily equipment rentals</h2><p>Use equipment until End Day. Daily-use bags provide 10 consumable bags for today; unused daily-use bags expire. Purchased bags carry over.</p>${financeSummary()}
    ${Object.entries(Game.rentalPrices)
      .map(
        ([id, p]) =>
          `<div class="basketline"><strong>${id === "table" ? "Market table" : id === "scale" ? "Produce scale" : "Produce bags"}</strong><p>${money(p.upfront)} upfront, or ${money(p.deferred)} after market if you cannot pay upfront. Extra cost: ${money(p.deferred - p.upfront)}.</p>${Game.hasEquipment(state, id) || (id === "bags" && state.rentals.bags) ? `<p>${id === "bags" ? "Paper bags remaining: " + Game.bagsRemaining(state) + " (" + state.rentalBagsRemaining + " daily-use)" : "Ready to use today."}</p>` : `<button class="btn" onclick="rentalOffer('${id}')" ${id === "table" && state.marketPlayed ? "disabled" : ""}>Review ${id} rental</button>`}</div>`,
      )
      .join("")}`,
    "rentals",
  );
}
function rentalOffer(id) {
  const prices = Game.rentalPrices[id];
  if (!prices) return;
  const affordable = state.cash >= prices.upfront;
  show(
    `<h2>Rent ${id === "bags" ? "produce bags" : id === "scale" ? "a produce scale" : "a market table"}</h2>
    <p>Pay now: <strong>${money(prices.upfront)}</strong>. Pay after market: <strong>${money(prices.deferred)}</strong>, an extra ${money(prices.deferred - prices.upfront)}.</p>
    ${id === "bags" ? "<p>Provides 10 consumable daily-use bags. Unused daily-use bags expire at End Day. A purchased $3 pack of 10 carries over.</p>" : ""}
    <p>Your cash: ${money(state.cash)}. ${affordable ? "You can afford the lower upfront price." : "You cannot afford the upfront price."}</p>
    <p>Deferred charges are deducted from earnings when the market closes, including if you press End Day. If earnings are not enough, the remainder carries forward without interest. New deferred rentals are blocked while an earlier day is unpaid. Total unpaid charges cannot exceed $6. Rentals expire at End Day.</p>
    ${Game.hasEquipment(state, id) || (id === "bags" && state.rentals.bags) ? "<p>You have already received this equipment today. If daily-use bags run out, buy another pack.</p>" : affordable ? `<button class="btn" onclick="acceptRental('${id}','upfront')">Pay ${money(prices.upfront)} now</button>` : Game.deferredAllowed(state, id) ? `<button class="btn" onclick="acceptRental('${id}','deferred')">Agree to ${money(prices.deferred)} after market</button>` : "<p>Deferred rental unavailable until earlier charges are paid. The free blanket and community seed help remain available.</p>"}
    <button class="btn alt" onclick="marketStand()">Back to market preparation</button>`,
    "rental-" + id,
  );
}
function acceptRental(id, payment) {
  act(() => {
    Game.rentEquipment(state, id, payment);
    state.notice = `${id} ready for today. ${payment === "deferred" ? "Charge recorded: " + money(Game.rentalPrices[id].deferred) : "Paid " + money(Game.rentalPrices[id].upfront) + "."}`;
    rentalMenu();
  });
}
function payCharges() {
  act(() => {
    const paid = Game.payOutstanding(state);
    state.notice = `Paid ${money(paid)} toward equipment charges.`;
    rentalMenu();
  });
}
function describeProduce(items) {
  return Object.entries(items)
    .map(([id, n]) => `${n} ${crop(id).unit} ${crop(id).name}`)
    .join(", ");
}
function addAllProduce() {
  act(() => {
    const result = Game.addAllToDisplay(state);
    state.notice =
      (Object.keys(result.added).length
        ? "Added: " + describeProduce(result.added) + "."
        : "No new produce added.") +
      (Object.keys(result.skipped).length
        ? " Not added: " +
          describeProduce(result.skipped) +
          " — a scale is required."
        : "");
    marketStand();
  });
}
function harvestReady() {
  const result = Game.harvestAll(state);
  state.notice = result.plots
    ? "Harvested " +
      describeProduce(result.harvested) +
      ` from ${result.plots} ready plots.`
    : "No crops are ready yet.";
  render();
}
function cancelPlanting() {
  Game.cancelAllPlans(state);
  state.notice = "Planting plan canceled. Reserved seeds are available again.";
  render();
}
// Keep the existing dialog element and restore viewport/focus after repeated actions.
let renderedView = null,
  renderedDialogKey = null,
  renderGeneration = 0;
function render() {
  const position = {
    x: window.scrollX,
    y: window.scrollY,
    dialog: document.querySelector(".dialog")?.scrollTop || 0,
  };
  const sameView = renderedView === view,
    sameDialog =
      sameView && dialogKey !== null && renderedDialogKey === dialogKey;
  const focused = document.activeElement?.getAttribute("onclick");
  renderScene();
  if (view === "seeds") {
    const basket = document.querySelector(".bottom button:last-child");
    basket.textContent = `🛒 Basket (${Object.values(state.cart).reduce((a, b) => a + b, 0)}) · ${money(Game.cartTotal(state, "seeds"))}`;
  }
  if (document.body.dataset.saveWarning) {
    const p = document.createElement("p");
    p.setAttribute("role", "alert");
    p.textContent = document.body.dataset.saveWarning;
    document.querySelector(".bottom").append(p);
  }
  const restore = () => {
    if (sameView)
      window.scrollTo({
        left: position.x,
        top: position.y,
        behavior: "instant",
      });
    if (sameDialog) {
      const dialog = document.querySelector(".dialog");
      if (dialog) dialog.scrollTop = position.dialog;
      if (focused)
        Array.from(dialog?.querySelectorAll("[onclick]") || [])
          .find((el) => el.getAttribute("onclick") === focused)
          ?.focus({ preventScroll: true });
    }
  };
  restore();
  const generation = ++renderGeneration;
  requestAnimationFrame(() => {
    if (generation === renderGeneration) restore();
  });
  renderedView = view;
  renderedDialogKey = dialogKey;
}
render();
