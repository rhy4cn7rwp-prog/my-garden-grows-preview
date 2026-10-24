/* Seed & Feed presentation only. Game owns all prices, inventory and checkout rules. */
const SEED_PACKET_NAMES = {
  carrot: "Carrot Seeds",
  corn: "Corn Seeds",
  beans: "Green Bean Seeds",
  strawberry: "Strawberry Seeds",
  cucumber: "Cucumber Seeds",
  potato: "Seed Potatoes",
  onion: "Onion Seeds",
  tomato: "Tomato Seeds",
  lettuce: "Lettuce Seeds",
  radish: "Radish Seeds",
};
function seedName(id) {
  return SEED_PACKET_NAMES[id];
}
function seedBundleContents() {
  return Object.entries(Game.bundle)
    .map(([id, n]) => `${seedName(id)} × ${n}`)
    .join(", ");
}
const SEED_SHOP_ART = [
  "carrot",
  "corn",
  "beans",
  "strawberry",
  "cucumber",
  "potato",
  "onion",
  "tomato",
  "lettuce",
  "radish",
];
const SEED_PRODUCE_BOUNDS = [
  [30, 5, 380, 395],
  [450, 8, 330, 378],
  [800, 10, 385, 385],
  [1200, 62, 365, 315],
  [1585, 75, 390, 302],
  [8, 440, 390, 279],
  [460, 380, 270, 385],
  [800, 435, 385, 310],
  [1185, 398, 395, 365],
  [1588, 390, 390, 390],
];
function seedProduceArt(id) {
  const [x, y, w, h] = SEED_PRODUCE_BOUNDS[SEED_SHOP_ART.indexOf(id)];
  return `<svg class="seed-produce-art" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true" focusable="false"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><image href="assets/seed-shop/produce.webp" width="1983" height="793"/></svg></svg>`;
}
function seedShopQuantities() {
  return Object.fromEntries(
    CROPS.map((c) => [
      c.id,
      (state.cart[c.id] || 0) +
        (Game.bundle[c.id] || 0) * (state.cart.bundle || 0),
    ]),
  );
}
function seedShopScene() {
  const count = Object.values(seedShopQuantities()).reduce((a, b) => a + b, 0),
    total = Game.cartTotal(state, "seeds");
  const row = (ids) =>
    `<div class="seed-shelf">${ids
      .map((id) => {
        const c = crop(id);
        return `<button class="seed-packet" data-seed="${id}" onclick="seed('${id}')" aria-label="${seedName(id)}"><span class="seed-packet-name">${seedName(id).replace("Strawberry", "Straw&shy;berry")}</span>${seedProduceArt(id)}<span class="seed-packet-price">${money(c.seed)}</span><span class="seed-packet-count" aria-label="In basket" ${state.cart[id] ? "" : "hidden"}>${state.cart[id] || 0}</span></button>`;
      })
      .join("")}</div>`;
  return `<div class="seed-shop-world"><img class="seed-shop-interior" src="assets/seed-shop/interior.webp" alt="A friendly shopkeeper in a straw hat welcomes you to a sunlit wooden garden store, with flowers, pots, tools and watering cans." fetchpriority="high"/>
  <h1 class="seed-counter-sign" aria-label="Seed &amp; Feed"><svg viewBox="0 0 1024 1536" aria-hidden="true" focusable="false"><defs><linearGradient id="seed-sign-wood" x2="0" y2="1"><stop stop-color="#efc27b"/><stop offset=".45" stop-color="#dba65c"/><stop offset="1" stop-color="#bf813e"/></linearGradient></defs><g class="seed-counter-plaque"><rect x="285" y="570" width="454" height="94" rx="9" fill="#6d3e1e" opacity=".35" transform="translate(1 5)"/><rect x="285" y="570" width="454" height="94" rx="9" fill="url(#seed-sign-wood)" stroke="#74451f" stroke-width="4"/><rect x="294" y="578" width="436" height="77" rx="5" fill="none" stroke="#f9dd9a" stroke-width="2" opacity=".7"/><path d="M303 586q75 6 132 0t134 1t149-2M303 647q100-5 180 0t235-2" fill="none" stroke="#9b632d" stroke-width="2" opacity=".3"/><circle cx="308" cy="616" r="5" fill="#785332"/><circle cx="716" cy="616" r="5" fill="#785332"/><text x="512" y="635" text-anchor="middle" font-family="Georgia,serif" font-size="52" font-weight="bold" fill="#54301a" stroke="#fff0bc" stroke-width=".6" paint-order="stroke">Seed &amp; Feed</text></g></svg></h1></div>
  <section class="seed-shop-heading"><p>Welcome, gardener! Tap a packet to explore.</p></section>
  <section class="seed-display" aria-label="Seed packet shelves">${row(SEED_SHOP_ART.slice(0, 5))}${row(SEED_SHOP_ART.slice(5))}</section>
  <div class="seed-shop-bottom bottom"><button class="btn seed-bundle" onclick="bundleInfo()">Variety bundle · ${money(11)}<small>Fixed assortment · save ${money(1)}</small></button><button class="btn" onclick="cart('seeds')" aria-label="View seed basket">Basket (${count} ${count === 1 ? "packet" : "packets"})<small>${money(total)} · review &amp; checkout</small></button></div>`;
}
function seedShopDetails(id) {
  const c = crop(id);
  if (!c) return;
  show(
    `<header class="seed-detail-heading">${seedProduceArt(id)}<h2>${seedName(id)}</h2></header><div class="seed-detail-body"><p><b>${money(c.seed)} per ${id === "potato" ? "pack" : "packet"}</b> · ${state.seeds[id] || 0} owned</p><p>${c.days} watered days to harvest. About ${c.yield} ${c.unit === "lb" ? "lb" : "items"} per harvest${c.repeat ? " · repeat harvests" : "."}</p><p>Estimated market price: <b>${money(c.price)}${c.unit === "lb" ? " per lb" : " each"}</b>. Sales depend on growing and selling your harvest.</p><div class="qty"><button aria-label="−" onclick="change('cart','${id}',-1)" ${(state.cart[id] || 0) === 0 ? "disabled" : ""}>−</button><b>${state.cart[id] || 0} in basket</b><button aria-label="+" onclick="change('cart','${id}',1)" ${(state.cart[id] || 0) >= 100 ? "disabled" : ""}>+</button></div></div><div class="seed-detail-actions"><button class="btn" onclick="cart('seeds')">🛒 View basket</button></div>`,
    "seed-" + id,
  );
}
function seedShopBundle() {
  const list = seedBundleContents(),
    individual = Object.entries(Game.bundle).reduce(
      (sum, [id, n]) => sum + n * crop(id).seed,
      0,
    );
  show(
    `<header class="seed-detail-heading"><h2>Variety bundle · ${money(11)}</h2></header><div class="seed-detail-body"><p>${list}.</p><p>A fixed assortment of <b>8 seed packets</b>. You choose individual packets separately; this collection cannot be customized.</p><p>Individually ${money(individual)} · save ${money(individual - 11)}.</p><ul class="seed-bundle-crops">${Object.keys(
      Game.bundle,
    )
      .map((id) => {
        const c = crop(id);
        return `<li>${seedName(id)}: harvest estimated ${money(c.price)} ${c.unit === "lb" ? "per lb" : "each"} at market.</li>`;
      })
      .join(
        "",
      )}</ul><div class="qty"><button aria-label="−" onclick="change('cart','bundle',-1)" ${state.cart.bundle ? "" : "disabled"}>−</button><b>${state.cart.bundle || 0} bundles</b><button aria-label="+" onclick="change('cart','bundle',1)" ${(state.cart.bundle || 0) >= 100 ? "disabled" : ""}>+</button></div></div><div class="seed-detail-actions"><button class="btn" onclick="cart('seeds')">View basket</button></div>`,
    "bundle",
  );
}
function seedShopBasketChange(id, d) {
  state.cart[id] = Math.max(0, Math.min(100, (state.cart[id] || 0) + d));
  cart("seeds");
}
function seedShopBasket() {
  const total = Game.cartTotal(state, "seeds"),
    items = [
      ...CROPS.map((c) => [c.id, seedName(c.id), c.seed]),
      ["bundle", "Variety bundle", 11],
    ].filter(([id]) => state.cart[id]);
  show(
    `<header class="seed-detail-heading"><h2>Shopping basket</h2></header><div class="seed-detail-body">${items.map(([id, name, price]) => `<div class="seed-basket-row"><span>${name} × ${state.cart[id]}<small>${money(price)} each · ${money(price * state.cart[id])}</small></span><button class="seed-adjust" aria-label="Remove one ${id === "bundle" ? name : "pack of " + name}" onclick="seedShopBasketChange('${id}',-1)">−</button><button class="seed-adjust" aria-label="Add one ${id === "bundle" ? name : "pack of " + name}" onclick="seedShopBasketChange('${id}',1)" ${state.cart[id] >= 100 ? "disabled" : ""}>+</button></div>`).join("") || "<p>Your basket is empty. Explore the packets on the shelves.</p>"}${state.cart.bundle ? `<p>Each bundle contains: ${seedBundleContents()}.</p>` : ""}${total > state.cash ? `<p role="status">Your basket is ${money(total - state.cash)} over your balance. Remove a packet or bundle to make room in your budget.</p>` : ""}</div><div class="seed-detail-actions seed-checkout-actions"><p><b>Total: ${money(total)}</b> · You have ${money(state.cash)}</p><button class="btn" onclick="checkout('seeds')" ${total <= 0 || total > state.cash ? "disabled" : ""}>Pay at checkout</button><button class="btn alt" onclick="closeDialog()">Keep shopping</button></div>`,
    "seed-basket",
  );
}
function seedShopCheckout() {
  act(() => {
    const bought = seedShopQuantities(),
      total = Game.purchase(state, "seeds");
    show(
      `<header class="seed-detail-heading"><h2>Purchase complete!</h2></header><div class="seed-detail-body"><p>Thank you, gardener! Your seeds are ready to plant.</p><p>You paid <b>${money(total)}</b>. Your balance is <b>${money(state.cash)}</b>.</p><ul>${CROPS.filter(
        (c) => bought[c.id] > 0,
      )
        .map(
          (c) =>
            `<li>${seedName(c.id)}: ${bought[c.id]} ${c.id === "potato" ? (bought[c.id] === 1 ? "pack" : "packs") : bought[c.id] === 1 ? "packet" : "packets"} purchased · ${state.seeds[c.id]} owned</li>`,
        )
        .join(
          "",
        )}</ul></div><div class="seed-detail-actions"><button class="btn" onclick="closeDialog()">Back to the shelves</button></div>`,
      "seed-receipt",
    );
  });
}

// The plaque shares the original photograph's cover scale and object position.
// Resizing Safari moves the sign WITH the counter, never as an independent HUD.
function syncSeedShopSign() {
  const room = document.querySelector(".seed-shop-world"),
    sign = document.querySelector(".seed-counter-sign");
  if (!room || !sign) return;
  const w = room.clientWidth,
    h = room.clientHeight,
    scale = Math.max(w / 1024, h / 1536),
    landscape = matchMedia(
      "(orientation: landscape) and (max-height: 500px)",
    ).matches;
  sign
    .querySelector(".seed-counter-plaque")
    .setAttribute(
      "transform",
      landscape ? "translate(71.5 308.5) scale(.5)" : "",
    );
  room.parentElement.style.setProperty(
    "--seed-counter-bottom",
    (landscape ? 640.5 : 664) * scale +
      (landscape ? (h - 1536 * scale) * 0.29 : 0) +
      "px",
  );
  Object.assign(sign.style, {
    width: 1024 * scale + "px",
    height: 1536 * scale + "px",
    left: (landscape ? 0 : (w - 1024 * scale) / 2) + "px",
    top: (landscape ? (h - 1536 * scale) * 0.29 : 0) + "px",
  });
}
