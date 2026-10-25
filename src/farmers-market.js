/* Presentation only: all transactions, customer decisions and stock live in Game.
   A coherent first-person canvas layers the customer behind the real counter. */
const MARKET_CUSTOMER_BOUNDS = [
  [12, 0, 505, 724],
  [522, 0, 575, 724],
  [1100, 0, 520, 724],
  [1630, 0, 542, 724],
];
// Cosmetic portrait assignment; it does not add age, preferences or scoring data.
const MARKET_CUSTOMER_PORTRAITS = {
  Maya: 2,
  Noah: 1,
  Ava: 0,
  Oliver: 3,
  Sophia: 2,
  Liam: 1,
  Ella: 0,
  Leo: 3,
  Emma: 2,
  Lucas: 1,
  Mia: 2,
  Henry: 1,
  Zoe: 0,
  Amelia: 2,
  Jack: 3,
  Grace: 0,
  Ethan: 3,
  Aria: 2,
  Ruby: 0,
  Mateo: 1,
};
function marketPortraitIndex() {
  // Stable across refreshes without inventing or migrating saved character data.
  const fallback =
    Array.from(state.customer.name).reduce(
      (n, ch) => n + ch.codePointAt(0),
      0,
    ) % MARKET_CUSTOMER_BOUNDS.length;
  const assigned = MARKET_CUSTOMER_PORTRAITS[state.customer.name];
  return Number.isInteger(assigned) ? assigned : fallback;
}
function marketCustomerArt() {
  if (!state.customer) return "";
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
  const available = CROPS.filter((c) => (state.inventory[c.id] || 0) > 0);
  if (!available.length)
    return `<div class="market-empty-display">Your harvest belongs here.<br><span>Visit your garden, then arrange your produce.</span></div>`;
  return `${available.length > 3 ? '<span class="market-tray-hint">Swipe harvest to see more →</span>' : ""}<section class="market-produce-tray" data-price-mode="regular" aria-label="Harvested produce and regular prices">${available
    .map((c) => {
      const stock = Game.marketStock(state, c.id);
      return `<button class="market-produce" data-market-crop="${c.id}" onclick="marketItem('${c.id}')" aria-label="${c.name}, ${stock} ${c.unit} on stand, ${money(Game.marketPrice(state,c.id))} per ${c.unit}"><span class="market-produce-basket ${["corn", "potato", "onion", "radish"].includes(c.id) ? "market-produce-crate" : ""}">${marketDisplayBin(c.id)}${seedProduceArt(c.id)}<span class="market-basket-rim">${marketDisplayBin(c.id)}</span></span><span class="market-produce-label"><strong>${c.name}</strong><span>${stock}${c.unit === "lb" ? " lb" : ""} on stand</span><span>${money(Game.marketPrice(state,c.id))}${c.unit === "lb" ? "/lb" : " each"}</span></span></button>`;
    })
    .join("")}</section>`;
}
function farmersMarketScene(controls) {
  return `<section class="market-tableau ${state.customer ? "market-with-customer" : ""}" aria-label="Your farmers market stall, looking out toward the village"><svg class="market-first-person" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-label="A red-and-white canopy shelters your wooden counter; flowers frame the village beyond" role="img"><defs><clipPath id="market-behind-counter"><rect width="1536" height="728"/></clipPath></defs><image href="assets/farmers-market/stall.webp" width="1536" height="1024"/>${marketCustomerArt()}</svg>${marketClockFace()}${state.customer && state.step !== "greet" ? '<svg class="market-speech-tail" aria-hidden="true"><path/></svg>' + marketConversation() : ""}${marketProduceDisplay()}<button class="market-register-prop" onclick="marketRegister()" aria-label="Open cash register"><img src="assets/farmers-market/register.webp" alt=""/><span>Cash register</span></button></section><section class="bottom market-controls" aria-label="Customer service and market controls">${controls}</section>`;
}
function marketRegister() {
  if (state.customer && state.step === "pay") return payment();
  if (state.customer && state.step === "choose") return marketTotalKeypad();
  show(
    `<h2>Your cash register</h2><p>${state.customer ? "Fill your customer's basket and calculate the total first. Then you can count their change here." : "Welcome a customer and fill their order. Your cash register will be ready when it is time to count change."}</p>`,
    "market-register-info",
  );
}
