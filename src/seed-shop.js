/* Seed & Feed presentation only. Game owns all prices, inventory and checkout rules. */
const SEED_PACKET_NAMES = {
  carrot: "Carrot",
  corn: "Corn",
  beans: "Beans",
  strawberry: "Straw&shy;berry",
  cucumber: "Cucumber",
  potato: "Potato",
  onion: "Onion",
  tomato: "Tomato",
  lettuce: "Lettuce",
  radish: "Radish",
};
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
        return `<button class="seed-packet" data-seed="${id}" onclick="seed('${id}')" aria-label="${c.name} seeds"><span class="seed-packet-name">${SEED_PACKET_NAMES[id]}</span>${seedProduceArt(id)}<span class="seed-packet-price">${money(c.seed)}</span><span class="seed-packet-count" aria-label="In basket" ${state.cart[id] ? "" : "hidden"}>${state.cart[id] || 0}</span></button>`;
      })
      .join("")}</div>`;
  return `<div class="seed-shop-world"><img class="seed-shop-interior" src="assets/seed-shop/interior.webp" alt="A friendly shopkeeper in a straw hat welcomes you to a sunlit wooden garden store, with flowers, pots, tools and watering cans." fetchpriority="high"/></div>
  <section class="seed-shop-heading"><h1>Seed &amp; Feed</h1><p>Welcome, gardener! Tap a packet to explore.</p></section>
  <section class="seed-display" aria-label="Seed packet shelves">${row(SEED_SHOP_ART.slice(0, 5))}${row(SEED_SHOP_ART.slice(5))}</section>
  <div class="seed-shop-bottom bottom"><button class="btn seed-bundle" onclick="bundleInfo()">Variety bundle · ${money(11)}<small>Fixed assortment · save ${money(1)}</small></button><button class="btn" onclick="cart('seeds')" aria-label="View seed basket">Basket (${count} ${count === 1 ? "packet" : "packets"})<small>${money(total)} · review &amp; checkout</small></button></div>`;
}
function seedShopDetails(id) {
  const c = crop(id);
  if (!c) return;
  show(
    `<header class="seed-detail-heading">${seedProduceArt(id)}<h2>${c.name} Seeds</h2></header><div class="seed-detail-body"><p><b>${money(c.seed)} per packet</b> · ${state.seeds[id] || 0} owned</p><p>${c.days} watered days to harvest. About ${c.yield} ${c.unit === "lb" ? "lb" : "items"} per harvest${c.repeat ? " · repeat harvests" : "."}</p><p>Estimated market price: <b>${money(c.price)}${c.unit === "lb" ? " per lb" : " each"}</b>. Sales depend on growing and selling your harvest.</p><div class="qty"><button aria-label="−" onclick="change('cart','${id}',-1)" ${(state.cart[id] || 0) === 0 ? "disabled" : ""}>−</button><b>${state.cart[id] || 0} in basket</b><button aria-label="+" onclick="change('cart','${id}',1)" ${(state.cart[id] || 0) >= 100 ? "disabled" : ""}>+</button></div></div><div class="seed-detail-actions"><button class="btn" onclick="cart('seeds')">🛒 View basket</button></div>`,
    "seed-" + id,
  );
}
function seedShopBundle() {
  const list = Object.entries(Game.bundle)
      .map(
        ([id, n]) =>
          `${n} ${id === "strawberry" && n === 1 ? "strawberry" : crop(id).name.toLowerCase()}`,
      )
      .join(", "),
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
        return `<li>${c.name}: estimated ${money(c.price)} ${c.unit === "lb" ? "per lb" : "each"} at market.</li>`;
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
      ...CROPS.map((c) => [c.id, c.name, c.seed]),
      ["bundle", "Variety bundle", 11],
    ].filter(([id]) => state.cart[id]);
  show(
    `<header class="seed-detail-heading"><h2>Shopping basket</h2></header><div class="seed-detail-body">${items.map(([id, name, price]) => `<div class="seed-basket-row"><span>${name} × ${state.cart[id]}<small>${money(price)} each · ${money(price * state.cart[id])}</small></span><button class="seed-adjust" aria-label="Remove one ${name}" onclick="seedShopBasketChange('${id}',-1)">−</button><button class="seed-adjust" aria-label="Add one ${name}" onclick="seedShopBasketChange('${id}',1)" ${state.cart[id] >= 100 ? "disabled" : ""}>+</button></div>`).join("") || "<p>Your basket is empty. Explore the packets on the shelves.</p>"}${state.cart.bundle ? "<p>Each bundle contains 3 carrots, 2 onions, 2 green beans and 1 strawberry packet.</p>" : ""}${total > state.cash ? `<p role="status">Your basket is ${money(total - state.cash)} over your balance. Remove a packet or bundle to make room in your budget.</p>` : ""}</div><div class="seed-detail-actions seed-checkout-actions"><p><b>Total: ${money(total)}</b> · You have ${money(state.cash)}</p><button class="btn" onclick="checkout('seeds')" ${total <= 0 || total > state.cash ? "disabled" : ""}>Pay at checkout</button><button class="btn alt" onclick="closeDialog()">Keep shopping</button></div>`,
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
            `<li>${c.name}: ${bought[c.id]} ${bought[c.id] === 1 ? "packet" : "packets"} purchased · ${state.seeds[c.id]} owned</li>`,
        )
        .join(
          "",
        )}</ul></div><div class="seed-detail-actions"><button class="btn" onclick="closeDialog()">Back to the shelves</button></div>`,
      "seed-receipt",
    );
  });
}
