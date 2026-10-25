/* Store presentation; transactions and saved stock are validated separately. */
const MARKET_PRODUCTS = {
  bags: {
    name: "Paper produce bags",
    art: 0,
    options: ["bags5", "bags20"],
    kind: "Consumable",
    help: "Use bags to pack produce. Purchased bags join your existing bag stock.",
  },
  boxes: {
    name: "Cardboard produce boxes",
    art: 1,
    options: ["boxes5"],
    kind: "Consumable",
    help: "Boxes can hold produce. Keep these optional supplies in your storeroom.",
  },
  tags: {
    name: "Price tags",
    art: 2,
    options: ["tags10"],
    kind: "Consumable",
    help: "Tags help shoppers see prices. These are optional supplies for your storeroom.",
  },
  sign: {
    name: "Market sign",
    art: 3,
    options: ["sign"],
    kind: "Reusable",
    help: "A sign can welcome shoppers. Keep it and use it again instead of buying a new one each day.",
  },
  basket: {
    name: "Produce baskets",
    art: 4,
    options: ["basket"],
    kind: "Reusable",
    help: "A sturdy basket can be used again on many market days. You can keep more than one.",
  },
};
function marketProductArt(index) {
  if (index === 3)
    return `<img class="supply-produce-art supply-aframe-art" src="assets/market-supplies/aframe.webp" alt=""/>`;
  const [x, y, w, h] = [
    [30, 20, 390, 418],
    [465, 35, 420, 400],
    [907, 20, 435, 410],
    [1395, 10, 370, 425],
    [8, 500, 435, 345],
    [450, 480, 445, 390],
    [895, 440, 450, 430],
    [1380, 470, 380, 400],
  ][index];
  return `<svg class="supply-produce-art" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><image href="assets/market-supplies/products.webp" width="1792" height="896"/></svg></svg>`;
}
function marketSupplyScene() {
  const product = (id) => {
    const p = MARKET_PRODUCTS[id],
      sku = MarketSupplyRules.catalog[p.options[0]];
    const label = { bags: "Paper bags", boxes: "Produce boxes" }[id] || p.name;
    return `<button class="supply-packet" data-market-product="${id}" onclick="marketSupplyProduct('${id}')" aria-label="${p.name}">${marketProductArt(p.art)}<span class="supply-packet-name">${label}</span><span class="supply-packet-price">${sku.count === 1 ? money(sku.cents / 100) + " each" : sku.count + " for " + money(sku.cents / 100)}</span></button>`;
  };
  return `<div class="supply-shop-world"><img class="supply-shop-interior" src="assets/market-supplies/interior.webp" alt="A friendly shopkeeper welcomes you to a sunny wooden supply store with wicker baskets, flowers, cloth and packing supplies." fetchpriority="high"/>${marketCounterSign()}</div><section class="supply-shop-heading"><p>Welcome! Tap a supply to explore.</p></section><section class="supply-display" aria-label="Market supplies display table"><div class="supply-merch-table"><img class="supply-table-art" src="assets/market-supplies/display-table.webp" alt="Rustic wooden merchandise table"/><div class="supply-table-products">${["bags", "boxes", "tags", "basket"].map(product).join("")}</div></div>${product("sign")}</section><div class="supply-shop-bottom bottom"><button class="btn" onclick="marketSupplyInventory()">My supplies</button><button class="btn" onclick="marketSupplyEquipment()">Equipment &amp; rentals</button><button class="btn" onclick="marketSupplyBasket()" aria-label="Supply basket">Basket<small>${money(MarketSupplyRules.total(state))}</small></button></div>`;
}
function marketCounterSign() {
  return `<h1 class="supply-counter-sign" aria-label="Market Supplies"><svg viewBox="0 0 1024 1536" aria-hidden="true"><defs><linearGradient id="supply-sign-wood" x2="0" y2="1"><stop stop-color="#efc27b"/><stop offset="1" stop-color="#bf813e"/></linearGradient></defs><g class="supply-counter-plaque"><rect x="225" y="570" width="574" height="94" rx="9" fill="#6d3e1e" opacity=".35" transform="translate(1 5)"/><rect x="225" y="570" width="574" height="94" rx="9" fill="url(#supply-sign-wood)" stroke="#74451f" stroke-width="4"/><rect x="235" y="579" width="554" height="76" rx="5" fill="none" stroke="#f9dd9a" stroke-width="2"/><circle cx="247" cy="616" r="5" fill="#785332"/><circle cx="777" cy="616" r="5" fill="#785332"/><text x="512" y="633" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="bold" fill="#54301a">Market Supplies</text></g></svg></h1>`;
}
function syncMarketSupplySign() {
  const room = document.querySelector(".supply-shop-world"),
    sign = document.querySelector(".supply-counter-sign");
  if (!room || !sign) return;
  const w = room.clientWidth,
    h = room.clientHeight,
    k = Math.max(w / 1024, h / 1536),
    landscape = matchMedia(
      "(orientation: landscape) and (max-height:500px)",
    ).matches;
  sign
    .querySelector(".supply-counter-plaque")
    .setAttribute(
      "transform",
      landscape ? "translate(115 308.5) scale(.5)" : "",
    );
  Object.assign(sign.style, {
    width: 1024 * k + "px",
    height: 1536 * k + "px",
    left: (landscape ? 0 : (w - 1024 * k) / 2) + "px",
    top: (landscape ? (h - 1536 * k) * 0.29 : 0) + "px",
  });
  room.parentElement.style.setProperty(
    "--supply-counter-bottom",
    (landscape ? 640.5 : 664) * k +
      (landscape ? (h - 1536 * k) * 0.29 : 0) +
      "px",
  );
}
function marketSupplyProduct(id) {
  const p = MARKET_PRODUCTS[id];
  if (!p) return;
  show(
    `<header class="supply-detail-heading">${marketProductArt(p.art)}<h2>${p.name}</h2></header><div class="supply-detail-body"><p><b>${p.kind}</b> · ${p.help}</p>${p.options
      .map((sku) => {
        const q = MarketSupplyRules.catalog[sku];
        return `<div class="supply-option"><p><b>${q.name} · ${money(q.cents / 100)}</b><br>${q.type === "consumable" ? (q.cents / q.count).toFixed(0) + "¢ each" : "Keep and reuse; no daily replacement needed."}</p><div class="qty"><button aria-label="Remove ${q.name}" onclick="marketSupplyChange('${sku}',-1,'${id}')" ${state.marketSupplyCart[sku] ? "" : "disabled"}>−</button><b>${state.marketSupplyCart[sku] || 0} in basket</b><button aria-label="Add ${q.name}" onclick="marketSupplyChange('${sku}',1,'${id}')" ${(state.marketSupplyCart[sku] || 0) >= 100 ? "disabled" : ""}>+</button></div></div>`;
      })
      .join(
        "",
      )}${id === "bags" ? "<p>Compare 20 bags: four small packs cost $4; one bulk pack costs $3. Save $1. Bulk costs more upfront than one $1 pack.</p>" : ""}</div><div class="supply-detail-actions"><button class="btn" onclick="marketSupplyBasket()">View supply basket</button></div>`,
    "ms-product-" + id,
  );
}
function marketSupplyChange(sku, d, product = null) {
  state.marketSupplyCart[sku] = Math.max(
    0,
    Math.min(100, (state.marketSupplyCart[sku] || 0) + d),
  );
  if (product) marketSupplyProduct(product);
  else marketSupplyBasket();
}
function marketSupplyBasket() {
  const total = MarketSupplyRules.total(state);
  show(
    `<header class="supply-detail-heading"><h2>Supply basket</h2></header><div class="supply-detail-body">${
      Object.entries(state.marketSupplyCart)
        .filter(([, n]) => n)
        .map(([sku, n]) => {
          const p = MarketSupplyRules.catalog[sku];
          return `<div class="supply-basket-row"><span>${p.name} × ${n}<small>${n * p.count} ${p.type === "reusable" ? "reusable items" : "supplies"} · ${money((n * p.cents) / 100)}</small></span><button class="supply-adjust" aria-label="Remove ${p.name}" onclick="marketSupplyChange('${sku}',-1)">−</button><button class="supply-adjust" aria-label="Add ${p.name}" onclick="marketSupplyChange('${sku}',1)" ${n >= 100 ? "disabled" : ""}>+</button></div>`;
        })
        .join("") ||
      "<p>Your basket is empty. Explore the supplies on the shelves.</p>"
    }${total > state.cash ? '<p role="status">This basket costs more than you have. Remove an item and try again.</p>' : ""}</div><div class="supply-detail-actions"><p><b>Total: ${money(total)}</b> · Your money: ${money(state.cash)}</p><button class="btn" onclick="marketSupplyCheckout()" ${total <= 0 || total > state.cash ? "disabled" : ""}>Buy supplies</button><button class="btn alt" onclick="closeDialog()">Keep shopping</button></div>`,
    "ms-cart",
  );
}
function marketSupplyCheckout() {
  act(() => {
    const receipt = Game.purchaseMarketSupplies(state);
    show(
      `<header class="supply-detail-heading"><h2>Supplies purchased!</h2></header><div class="supply-detail-body"><p>Thank you! Your supplies are in your storeroom.</p><p>You paid <b>${money(receipt.total)}</b>. Money remaining: <b>${money(state.cash)}</b>.</p><ul>${receipt.bought.map((p) => `<li>${p.name} × ${p.packs} · ${money(p.cents / 100)}</li>`).join("")}</ul><p>These costs were paid now; they will not be charged again at market closing.</p></div><div class="supply-detail-actions"><button class="btn" onclick="marketSupplyInventory()">See my supplies</button></div>`,
      "ms-receipt",
    );
  });
}
function marketSupplyInventory() {
  const stock = MarketSupplyRules.inventory(state);
  show(
    `<header class="supply-detail-heading"><h2>My market supplies</h2></header><div class="supply-detail-body"><h3>Consumables</h3><p>Purchased paper bags: <b>${stock.consumables.bags}</b><br>Cardboard boxes: <b>${stock.consumables.boxes}</b><br>Price tags: <b>${stock.consumables.priceTags}</b></p><p>Consumables can run out when used. Your existing market bag rule still applies.</p><h3>Reusable supplies</h3><p>Market signs: <b>${stock.reusable.marketSigns}</b><br>Produce baskets: <b>${stock.reusable.produceBaskets}</b></p><p>Reusable items stay yours for later market days. Boxes, tags, signs and baskets are optional for selling.</p>${state.rentalBagsRemaining ? `<p>Daily-use rental bags: ${state.rentalBagsRemaining} (separate; expire at End Day).</p>` : ""}</div>`,
    "ms-inventory",
  );
}
function marketSupplyEquipment() {
  show(
    `<header class="supply-detail-heading"><h2>Equipment &amp; rentals</h2></header><div class="supply-detail-body"><p>Your familiar equipment and rental choices are still here. Review these purchases in the equipment basket.</p>${state.supcart.bags ? `<button class="btn alt" onclick="supply('bags')">Review earlier 10-bag pack (${state.supcart.bags} in basket)</button>` : ""}${[
      ["table", 5],
      ["canopy", 6],
      ["scale", 7],
    ]
      .map(([id, art]) => {
        const p = SUPPLIES.find((s) => s[0] === id);
        return `<button class="btn supply-equipment" onclick="supply('${id}')">${marketProductArt(art)}${p[2]} · ${money(p[3])}</button>`;
      })
      .join(
        "",
      )}</div><div class="supply-detail-actions"><button class="btn" onclick="cart('supplies')">Equipment basket (${Object.values(state.supcart).reduce((a, b) => a + b, 0)})</button><button class="btn alt" onclick="rentalMenu()">Daily equipment rentals</button></div>`,
    "ms-equipment",
  );
}
