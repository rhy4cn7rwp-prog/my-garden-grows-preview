function loadGame() {
  try {
    const raw=localStorage.getItem("mgg10"), backup=localStorage.getItem("mgg10-backup");
    return raw === null && backup === null ? Game.newGame() : Game.recover(raw,backup);
  } catch {
    return Game.initial();
  }
}
const initial = () => Game.newGame();
let state = loadGame();
// Reopening is a visit home, never a charge for time away or reading the guide.
let marketAwaitingResume = !!state.marketOpen;
let view = "clubhouse",
  popup = "",
  selected = "carrot",
  dialogKey = null;
const $ = (s) => document.querySelector(s),
  money = (n) => "$" + Number(n).toFixed(2),
  crop = (id) => CROPS.find((c) => c.id === id),
  save = () => {
    Game.checkpointMarketClock(state);
    try {
      localStorage.setItem("mgg10-backup", JSON.stringify(state));
      localStorage.setItem("mgg10", JSON.stringify(state));
    } catch (e) {
      document.body.dataset.saveWarning = "Progress could not be saved";
    }
  };
function go(v) {
  if(typeof Narration !== "undefined") Narration.stop();
  if(view === "jobs" && v !== "jobs" && typeof Neighborhood !== "undefined") Neighborhood.stop();
  if (v === "market" && marketAwaitingResume) {
    marketAwaitingResume = false;
    if (!document.hidden) Game.resumeMarketClock(state);
  }
  const changed = view !== v;
  if (changed) state.notice = "";
  view = v;
  popup = "";
  dialogKey = null;
  render();
  if (changed) {
    const app = document.querySelector("#app");
    if (app) app.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document
        .querySelector(
          ".interior-crop, .town-world, .clubhouse-world, .garden-world",
        )
        ?.animate(
          [
            {
              opacity: 0.6,
              transform: view === "town" ? "translateY(0)" : "translateY(4px)",
            },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 180, easing: "ease-out" },
        );
    }
  }
}
function closeDialog() {
  if(typeof Narration !== "undefined")Narration.stop();
  popup = "";
  dialogKey = null;
  render();
}
function show(html, key = null) {
  dialogKey = key;
  const register = key === "payment";
  const keypad = key === "total-keypad";
  const guide = key === "guidebook";
  const gardenDialog = key?.startsWith("garden-") ? ` ${key}` : "";
  popup = `<div class="modal ${view === "seeds" ? "seed-shop-modal" : ""} ${view === "supplies" && key?.startsWith("ms-") ? "supply-shop-modal" : ""} ${guide ? "guidebook-modal" : ""}${gardenDialog} ${register ? "register-modal" : keypad ? "total-keypad-modal" : ""}" onclick="if(event.target===this)${guide ? "closeGuidebook()" : "closeDialog()"}"><div ${guide ? 'role="dialog" aria-modal="true" aria-labelledby="guidebook-title"' : gardenDialog ? 'role="dialog" aria-modal="true" aria-label="Garden activity"' : ""} class="dialog ${guide ? "guidebook-dialog" : ""} ${register ? "register-dialog" : keypad ? "total-keypad-dialog" : ""}">${html}${register || keypad || guide || key === "garden-weeding" || key === "garden-weeding-confirm" || key === "garden-weeding-complete" || key === "experience-choice" ? "" : '<div><button class="btn alt" onclick="closeDialog()">Close ✕</button></div>'}</div></div>`;
  render();
}
function spot(x, y, w, h, action, title) {
  return `<button class="spot" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%" aria-label="${title}" ${view === "market" ? "" : `title="${title}"`} onclick="${action}">${view === "market" ? "" : `<span class="tip">${title}</span>`}</button>`;
}
function renderScene() {
  Game.syncMarketClock(state);
  save();
  let stage = "",
    bottom = "";
  if (view === "dream") {
    for (let [id, x, y, w, h] of SHOP_HOTSPOTS.dream)
      stage += Game.ownsDream(state, id)
        ? `<span class="dream-owned-marker" style="left:${x}%;top:${y}%;width:${w}%">In your Clubhouse</span>`
        : spot(
            x,
            y,
            w,
            h,
            `dream('${id}')`,
            DREAMS.find((d) => d[0] === id)[2],
          );
    bottom = `<h2>🎯 Dream Shop</h2><p>Tap an available item on the shelves to choose a goal or buy it with your savings.</p>${Game.dreams.every((d) => Game.ownsDream(state, d.id)) ? "<p>Your dream collection is complete!</p>" : Game.ownsDream(state, DREAMS[state.goal][0]) ? "<p>Your reward is in your clubhouse. Tap another item to choose your next savings goal.</p>" : `<div class="progress"><span style="width:${Math.min(100, (100 * Game.savings(state)) / DREAMS[state.goal][3])}%"></span></div><p>${money(Game.savings(state))} saved after equipment charges toward ${DREAMS[state.goal][2]} (${money(DREAMS[state.goal][3])})</p>`}<button class="btn" onclick="go('clubhouse')">My Clubhouse</button>`;
  }
  if (view === "market") {
    let c = state.customer;
    if (state.marketPlayed && !state.marketOpen && !c)
      bottom = `<h2>🍎 Market closed</h2><button class="btn" onclick="showMarketReport()">View market-day report</button><button class="btn" onclick="go('garden')">Return to garden · end day to reopen</button>`;
    else {
      if (!c) {
        bottom = `<h2>🍎 Farmers Market</h2>${state.marketOpen ? `<button class="btn market-primary" onclick="newCustomer()" ${CROPS.some((c) => Game.marketStock(state, c.id) > 0) ? "" : "disabled"}>Welcome Next Customer</button><p>${state.visitors} customers welcomed</p><button class="btn alt" onclick="marketStand()">Arrange Produce</button><button class="btn alt" onclick="closeMarket()">Close market</button>` : '<p>Arrange your harvest before opening.</p><button class="btn" onclick="marketStand()">Arrange Produce / Open Market</button>'}`;
      } else {
        const greetings = `<button class="btn" onclick="greetCustomer('excellent')">Hi! Welcome to my stand! What can I help you find today?</button><button class="btn" onclick="greetCustomer('good')">Hi! What can I get for you?</button><button class="btn" onclick="greetCustomer('wait')">Wait quietly for the customer to ask for something.</button>`;
        const farewells = `<button class="btn" onclick="marketFarewell('excellent')">Thank you so much! I hope to see you again!</button><button class="btn" onclick="marketFarewell('good')">Thanks for shopping with us!</button><button class="btn" onclick="marketFarewell('brief')">Bye!</button>`;
        const choosing = Game.missingProduce(state).length
          ? `<button class="btn" onclick="customerService()">Help with sold-out produce</button>`
          : `<button class="btn" onclick="order()">🧺 Fill customer basket</button><button class="btn alt" onclick="customerService()">Talk about the order</button>`;
        bottom = `<h2>🍎 Market Day</h2><div class="row customer-actions">${state.step === "greet" ? greetings : state.step === "choose" ? choosing : state.step === "pay" ? `${state.learningExperience === 'little' || state.customer.learningExperience === 'little' ? '<button class="btn" onclick="littleMarketCheckout()">Bag order &amp; collect payment</button>' : '<button class="btn" onclick="payment()">💵 Count change</button>'}` : farewells}</div><p class="small">${state.visitors} customers · ${money(state.sales)} in sales · ${standLabel()}</p>`;
      }
    }
  }
  if (view === "market")
    bottom +=
      (marketStatusNotice()
        ? `<p role="status">${marketStatusNotice()}</p>`
        : "") +
      bagStatus() +
      (state.lastMarketReport
        ? '<button class="btn alt" onclick="showMarketReport(true)">Previous market report</button>'
        : "");
  // Only the baked header region is hidden. Source art and interaction coordinates stay intact.
  const trim = ["garden", "supplies", "market"].includes(view) ? 128 : 64;
  const content =
    view === "jobs" ? Neighborhood.scene() :
    view === "town"
      ? townScene()
      : view === "supplies"
        ? marketSupplyScene()
        : view === "seeds"
          ? seedShopScene()
          : view === "market"
            ? farmersMarketScene(bottom)
            : view === "clubhouse"
              ? clubhouseScene()
              : view === "garden"
                ? gardenScene()
                : `<div class="interior-crop" style="aspect-ratio:512/${512 - trim};--scene-offset:${(-100 * trim) / (512 - trim)}%"><div class="stage interior-stage ${view === "market" ? "market-scene" : ""}" style="background-image:url('${ART[view]}')">${stage}</div></div><div class="bottom">${bottom}</div><div class="footer">My Garden Grows · 1.0 playtest</div>`;
  const gameHTML = `<div class="game ${view === "jobs" ? "jobs-game" : view === "town" ? "town-game" : view === "clubhouse" ? "clubhouse-game" : view === "garden" ? "garden-game" : view === "seeds" ? "seed-shop-game" : view === "supplies" ? "supply-shop-game" : view === "market" ? "farmers-market-game" : "interior-game"}" data-scene="${view}">${header()}${content}</div>`;
  document.body.dataset.view = view;

  const app = $("#app"),
    game = app.querySelector(".game");
  if (!game || game.outerHTML !== gameHTML) {
    const template = document.createElement("template");
    template.innerHTML = gameHTML;
    if (game) game.replaceWith(template.content.firstElementChild);
    else app.prepend(template.content);
  }
  const modal = app.querySelector(".modal");
  if (!popup) modal?.remove();
  else {
    const template = document.createElement("template");
    template.innerHTML = popup;
    if (modal && renderedDialogKey === dialogKey && dialogKey !== null) {
      modal.querySelector(".dialog").innerHTML =
        template.content.querySelector(".dialog").innerHTML;
    } else {
      if (modal) modal.replaceWith(template.content);
      else app.append(template.content);
    }
  }
}
function dream(id) {
  let d = DREAMS.find((x) => x[0] === id);
  if (!d) return;
  if (Game.ownsDream(state, id)) return clubhouseItem(id);
  show(
    `<h2>${d[2]}</h2>${clubhouseRewardArt(id, "dream-preview-art")}<p class="tag">Price: ${money(d[3])}</p><p>${state.goal === DREAMS.indexOf(d) ? "This is your current savings goal." : "Would you like to save your market earnings for this?"}</p>${id === "puppy" ? "<p>This puppy fund is shown as a keepsake savings box in your clubhouse, not a live pet.</p>" : ""}<p>You have ${money(Game.savings(state))} available after outstanding equipment payments.</p><button class="btn" onclick="chooseDreamGoal('${id}')">🎯 ${state.goal === DREAMS.indexOf(d) ? "Keep this goal" : "Choose this dream"}</button><button class="btn" onclick="buyDream('${id}')" ${Game.savings(state) < d[3] ? "disabled" : ""}>Buy for ${money(d[3])}</button>`,
  );
}
function seed(id) {
  if (view === "seeds") return seedShopDetails(id);
  let c = crop(id);
  show(
    `<h2>${c.icon} ${seedName(id)}</h2><p class="tag">${money(c.seed)} per ${id === "strawberry" ? "plant" : id === "potato" ? "pack" : "seed packet"}</p><p>🌞 Sun-loving · 🌱 ${c.days} watered days to harvest</p><p>Harvest about ${c.yield} ${c.unit} · Sell for ${money(c.price)}/${c.unit}</p><p>${c.repeat ? "🔁 Repeat harvests" : "🌾 One harvest per planting"}</p><div class="qty"><button onclick="change('cart','${id}',-1)">−</button><b>${state.cart[id] || 0} in basket</b><button onclick="change('cart','${id}',1)">+</button></div><div><button class="btn" onclick="cart('seeds')">🛒 View basket</button></div>`,
    "seed-" + id,
  );
}
function supply(id) {
  let s = SUPPLIES.find((x) => x[0] === id);
  show(
    `<h2>${s[1]} ${s[2]}</h2><p class="tag">${money(s[3])}</p><p>${s[4]}</p><p>${id === "bags" ? "Purchased bags remaining: " + state.bagCount : "Already owned: " + (state.owned[id] || 0)}</p>${id === "table" ? '<p>You can also rent a basic table for $1 per day or use a free blanket.</p><button class="btn alt" onclick="go(\'market\');marketStand()">Choose a market stand</button>' : ""}<div class="qty"><button onclick="change('supcart','${id}',-1)">−</button><b>${state.supcart[id] || 0} in basket</b><button onclick="change('supcart','${id}',1)">+</button></div><button class="btn" onclick="cart('supplies')">🛒 View basket</button>`,
    "supply-" + id,
  );
}

function supplyCartDialog(kind) {
  let items =
      kind === "seeds"
        ? CROPS.map((c) => [c.id, c.icon + " " + seedName(c.id), c.seed])
        : SUPPLIES.map((s) => [s[0], s[1] + " " + s[2], s[3]]),
    obj = kind === "seeds" ? state.cart : state.supcart;
  let chosen = items.filter((x) => obj[x[0]]);
  let total = chosen.reduce((a, x) => a + obj[x[0]] * x[2], 0);
  show(
    `<h2>🛒 Shopping Basket</h2>${chosen.length ? chosen.map((x) => `<div class="basketline">${x[1]} × ${obj[x[0]]} = ${money(x[2] * obj[x[0]])}</div>`).join("") : "<p>Your basket is empty. Tap an item on the shelves.</p>"}<p><b>Total: ${money(total)}</b> · You have ${money(state.cash)}</p><button class="btn" ${!total ? "disabled" : ""} onclick="checkout('${kind}')">Pay at checkout</button><button class="btn alt" onclick="closeDialog()">Keep shopping</button>`,
  );
}

function plotDialog(i) {
  let p = state.plots[i];
  if (!p) {
    let options = CROPS.filter((c) => (state.seeds[c.id] || 0) > 0);
    if (!options.length)
      return show(
        `<h2>🌱 Empty garden plot</h2><p>You need seeds first!</p><button class="btn" onclick="go('seeds')">Visit Seed & Feed</button>`,
      );
    show(
      `<h2>🌱 Plant this plot</h2><p>Choose planting supplies from your bag:</p>${options.map((c) => `<button class="btn alt" ${Game.availableSeeds(state, c.id) ? "" : "disabled"} onclick="plant(${i},'${c.id}')">${c.icon} ${seedName(c.id)} (${Game.availableSeeds(state, c.id)} available)</button>`).join("")}`,
      "plant-seed",
    );
    return;
  }
  const c = crop(p.id), ready = p.age >= c.days,
    stage = GardenCrops.stage(c, p);
  show(`<h2>${c.name}${ready ? ' ready!' : ''}</h2>${GardenCrops.closeup(c,p)}<p>${stage.regrowing ? 'Regrowing' : 'Growth'}: ${p.age} of ${c.days} watered days.</p><p>${p.watered ? 'Watered today.' : ready ? 'Ready to harvest; no more water needed for this harvest.' : 'Needs water today.'}</p>${ready ? `<p>Harvest ${Game.harvestAmount(state,i)} ${c.unit} of ${c.name}.</p><button class="btn" onclick="harvest(${i})">🧺 Harvest</button>` : view === 'garden' ? `<button class="btn" onclick="waterGardenPlot(${i})" ${p.watered ? 'disabled' : ''}>Water this plant</button>` : ''}<p>${c.repeat ? `Multiple harvests: ${p.left + 1} remaining, including this one.` : 'This crop produces one harvest.'}</p><p>Estimated market value ${money(c.price)} per ${c.unit}.</p>${p.weedingBonus ? '<p>Saved weeding bonus: 1 extra item or 1 extra pound when this plant is harvested.</p>' : ''}<details class="garden-growth-guide"><summary>See all four growth stages</summary><div>${[1,2,3,4].map(n=>`<figure><img src="assets/garden-growth/${c.id}-${n}.svg" alt="${c.name}: ${['Newly planted','Small sprout','Growing plant','Harvest ready'][n-1]}"/><figcaption>${n}. ${['Newly planted','Small sprout','Growing plant','Harvest ready'][n-1]}</figcaption></figure>`).join('')}</div><p>Some fast-growing crops move through stages between your farming days. Repeat producers keep their leaves as a new harvest grows.</p></details>`, 'garden-crop');
}

function inventory() {
  show(
    `<h2>🧺 Harvest Basket</h2>${
      CROPS.filter((c) => state.inventory[c.id])
        .map(
          (c) =>
            `<div class="basketline">${c.icon} ${c.name}: ${state.inventory[c.id]} ${c.unit}</div>`,
        )
        .join("") ||
      "<p>Nothing harvested yet. Water your plants and advance days.</p>"
    }<button class="btn" onclick="go('market')">🍎 Go sell produce</button>`,
    "inventory",
  );
}

function marketItem(id) {
  if (view !== "market") return;
  let c = crop(id);
  show(
    `<h2>${c.icon} ${c.name}</h2><p>On hand: ${state.inventory[id] || 0} ${c.unit}</p><p>Price: ${money(Game.marketPrice(state, id))} per ${c.unit}</p><p>Tap “Fill customer basket” to serve the current shopper.</p>`,
  );
}
function order(feedback = "") {
  const c = state.customer;
  if (!c || state.step !== "choose") return;
  if (Game.missingProduce(state).length) return customerService();
  const available = CROPS.filter(
    (item) => Game.marketStock(state, item.id) > 0,
  );
  show(
    `<h2>🧺 ${c.name}'s order</h2><p>Customer requests: ${Object.entries(c.want)
      .map(([id, n]) => `${n} ${crop(id).unit} ${crop(id).name}`)
      .join(
        ", ",
      )}</p><p>Choose from your market stock, then check your basket. Each purchase uses one paper bag.</p>
    ${feedback ? `<p class="order-feedback" role="status">${feedback}</p>` : ""}
    <div class="produce-choices">${available
      .map((item) => {
        const stock = Game.marketStock(state, item.id);
        const count = state.basket[item.id] || 0;
        return `<div class="basketline"><strong>${item.icon} ${item.name}</strong><p>${stock} ${item.unit} available · ${money(Game.marketPrice(state, item.id))}/${item.unit}</p><div class="qty"><button aria-label="Remove ${item.name}" onclick="basketChange('${item.id}',-1)" ${count ? "" : "disabled"}>−</button><b>${count} in basket</b><button aria-label="Add ${item.name}" onclick="basketChange('${item.id}',1)" ${count < stock ? "" : "disabled"}>+</button></div></div>`;
      })
      .join("")}</div>
    <p><strong>Your basket:</strong> ${
      Object.entries(state.basket)
        .filter(([, n]) => n > 0)
        .map(([id, n]) => `${n} ${crop(id).unit} ${crop(id).name}`)
        .join(", ") || "Empty"
    }</p>
    <button class="btn alt" onclick="checkBasket()">Check basket</button>
    ${state.learningExperience === 'little' || state.customer.learningExperience === 'little' ? '<button class="btn" onclick="littleMarketCheckout()">Bag order &amp; collect payment</button>' : '<button class="btn" onclick="marketTotalKeypad()">Calculate total</button>'}${Object.keys(c.want).some((id) => crop(id).unit === "lb") && !Game.hasEquipment(state, "scale") ? '<button class="btn alt" onclick="rentalOffer(\'scale\')">Need a scale? Review rental</button>' : ""}`,
    "order",
  );
}
function basketChange(id, d) {
  if (!state.customer || state.step !== "choose" || !crop(id)) return;
  const stock = Game.marketStock(state, id);
  const count = Math.max(0, Math.min(stock, (state.basket[id] || 0) + d));
  if (count) state.basket[id] = count;
  else delete state.basket[id];
  order();
}
function checkBasket() {
  try {
    Game.checkBasket(state);
    order(
      state.learningExperience === "little" ? "That matches! Bag the produce and your customer will pay." : Game.requiresLineMath(state)
        ? "That matches the order! Multiply each quantity by its price, then add to find the total."
        : "That matches the order! The keypad will show the item amounts for you to add.",
    );
  } catch (e) {
    order(e.message);
  }
}
function totalOrder() {
  return Game.totalOrder(state);
}
function paymentDialog() {
  let t = totalOrder(),
    due = Game.changeDue(state);
  show(
    `<header class="register-header"><h2>💵 Cash Register</h2><button class="register-close" aria-label="Close ✕" onclick="closeDialog()">×</button></header>
    <div class="register-receipt"><p><span>Order total</span><strong>${money(t)}</strong></p><p><span>${state.customer.name} pays</span><strong>${money(state.tendered)}</strong></p><p><span>Change due</span><strong>${money(due)}</strong></p></div>
    <div class="money-tray">${[1, 5, 10, 20, 0.01, 0.05, 0.1, 0.25].map(moneyButton).join("")}</div>
    <div class="register-count" role="status"><strong>Change counted: ${money(state.change)}</strong><small>Count up: ${money((Math.round(t * 100) + Math.round(state.change * 100)) / 100)} → ${money(state.tendered)}</small></div>
    ${bagStatus(true)}
    <div class="register-actions"><button class="btn alt" onclick="state.change=0;payment()">Start over</button><button class="btn" onclick="finish()">Give change</button></div>`,
    "payment",
  );
}
function addMoney(n) {
  act(() => {
    Game.addChange(state, n);
    payment();
  });
}

function greetCustomer(choice) {
  act(() => {
    Game.greet(state, choice);
    render();
  });
}
function customerService() {
  if (!state.customer || state.step !== "choose") return;
  const missing = Game.missingProduce(state);
  show(
    `<h2>Helping ${state.customer.name}</h2><p>Customer requests: ${Object.entries(
      state.customer.want,
    )
      .map(([id, n]) => `${n} ${crop(id).unit} ${crop(id).name}`)
      .join(", ")}.</p>
    ${missing.length ? `<p>We don't have enough ${missing.map((id) => crop(id).name.toLowerCase()).join(" and ")} on the stand today. You can explain politely or suggest something we do have.</p>` : "<p>You can fill this order, or let the customer know if you cannot help today.</p>"}
    <div class="customer-actions"><button class="btn" onclick="respondSoldOut('sorry')">I'm sorry, we're sold out of that today.</button>
    ${missing.length && Game.alternativeChoices(state).length ? `<button class="btn" onclick="offerSomethingElse()">I'm sorry, we're sold out of ${crop(missing[0]).name.toLowerCase()} today. Can I interest you in something else?</button>` : ""}
    <button class="btn" onclick="respondSoldOut('return')">We're sold out today, but I hope you'll visit us again!</button></div>`,
    "service",
  );
}
function offerSomethingElse() {
  act(() => {
    Game.offerSomethingElse(state);
    closeDialog();
  });
}
function offerAlternative(id) {
  act(() => {
    Game.suggestAlternative(state, id);
    closeDialog();
  });
}
function respondSoldOut(choice) {
  act(() => {
    Game.declineOrder(state, choice);
    closeDialog();
  });
}
function skip() {
  respondSoldOut("sorry");
}
function settings() {
  show(
    learningSettingsMarkup(),
  );
}
function reset() {
  if (confirm("Erase this farm and start a new garden with $0 and free starter planting supplies?")) {
    state = initial();
    marketAwaitingResume = false;
    go("clubhouse");
  }
}
