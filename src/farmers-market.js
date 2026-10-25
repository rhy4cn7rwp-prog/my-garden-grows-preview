/* Presentation only: all transactions, customer decisions and stock live in Game.
   A coherent first-person canvas layers the customer behind the real counter. */
const MARKET_CUSTOMER_BOUNDS = [
  [12, 0, 505, 724],
  [522, 0, 575, 724],
  [1100, 0, 520, 724],
  [1630, 0, 542, 724],
];
// Four original portraits stay unchanged; every other named neighbor has new art.
function marketPortraitIndex() {
  return MarketCustomers.profile(state.customer.name)?.legacyPortrait ??
    Array.from(state.customer.name).reduce((n,ch)=>n+ch.codePointAt(0),0)%4;
}
function marketPortraitBounds(index) {
  const row=Math.floor(index/6), tops=[0,330,642,951], heights=[329,310,309,303];
  return [(index%6)*209,tops[row],209,heights[row]];
}
function marketCustomerMouth() {
  const p=MarketCustomers.profile(state.customer.name);
  const mouths=[139,112,143,174,137,128,142,135,142,136,143,151,
    118,144,159,119,146,130,155,134,158,137,162,159];
  const b=p?.portrait !== undefined ? marketPortraitBounds(p.portrait) : null;
  return b ? 230+(Math.floor(p.portrait/6)*313.5+mouths[p.portrait]-b[1])*(515/b[3]) :
    [451,433,462,445][marketPortraitIndex()];
}
function marketCustomerArt() {
  if (!state.customer) return "";
  const profile=MarketCustomers.profile(state.customer.name);
  if (profile?.portrait !== undefined) {
    const [x,y,w,h]=marketPortraitBounds(profile.portrait);
    return `<g class="market-active-customer" data-customer="${profile.name}" role="img" aria-label="${profile.name}, your customer, faces you across the counter" clip-path="url(#market-behind-counter)"><svg x="558" y="230" width="420" height="515" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMax meet"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><image href="assets/farmers-market/customers-expanded.webp" width="1254" height="1254"/></svg></svg></g>`;
  }
  const index = marketPortraitIndex();
  const [x, y, w, h] = MARKET_CUSTOMER_BOUNDS[index];
  return `<g class="market-active-customer" role="img" aria-label="${state.customer.name}, your customer, faces you across the counter" clip-path="url(#market-behind-counter)"><svg x="558" y="230" width="420" height="515" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMax meet"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><image href="assets/farmers-market/customers.webp" width="2172" height="724"/></svg></svg></g>`;
}
function marketDisplayBin(id) {
  return ["corn", "potato", "onion", "radish"].includes(id)
    ? '<img class="supply-produce-art" src="assets/farmers-market/crate.webp" alt=""/>'
    : marketProductArt(4);
}
function marketProduceDisplay() {
  const available = CROPS.filter((c) => Game.marketStock(state, c.id) > 0);
  if (!available.length)
    return `<div class="market-empty-display">Your harvest belongs here.<br><span>Visit your garden, then arrange your produce.</span></div>`;
  return `${available.length > 3 ? '<span class="market-tray-hint">Swipe harvest to see more →</span>' : ""}<section class="market-produce-tray ${available.length <= 3 ? "market-produce-balanced" : ""}" data-price-mode="regular" aria-label="Harvested produce and regular prices">${available
    .map((c) => {
      const stock = Game.marketStock(state, c.id);
      return `<button class="market-produce" data-market-crop="${c.id}" onclick="marketItem('${c.id}')" aria-label="${c.name}, ${stock} ${c.unit} on stand, ${money(Game.marketPrice(state,c.id))} per ${c.unit}"><span class="market-produce-basket ${["corn", "potato", "onion", "radish"].includes(c.id) ? "market-produce-crate" : ""}">${marketDisplayBin(c.id)}${seedProduceArt(c.id)}<span class="market-basket-rim">${marketDisplayBin(c.id)}</span></span><span class="market-produce-label"><strong>${c.name}</strong><span>${stock}${c.unit === "lb" ? " lb" : ""} on stand</span><span>${money(Game.marketPrice(state,c.id))}${c.unit === "lb" ? "/lb" : " each"}</span></span></button>`;
    })
    .join("")}</section>`;
}
function farmersMarketScene(controls) {
  return `<section class="market-tableau ${state.customer ? "market-with-customer" : ""}" aria-label="Your farmers market stall, looking out toward the village"><svg class="market-first-person" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-label="A red-and-white canopy shelters your wooden counter; flowers frame the village beyond" role="img"><defs><clipPath id="market-behind-counter"><rect width="1536" height="728"/></clipPath></defs><image href="assets/farmers-market/stall.webp" width="1536" height="1024"/>${marketCustomerArt()}</svg>${marketClockFace()}${state.customer && state.step !== "greet" ? '<svg class="market-speech-tail" aria-hidden="true"><path/></svg>' + marketConversation() : ""}${marketProduceDisplay()}</section><section class="bottom market-controls" aria-label="Customer service and market controls">${controls}</section>`;
}

function marketStatusNotice() {
  // Hide legacy farewell text as well; functional bag/equipment feedback remains.
  return /^Your customer (smiles:|says:|waves goodbye)/.test(state.notice || "")
    ? "" : state.notice || "";
}
