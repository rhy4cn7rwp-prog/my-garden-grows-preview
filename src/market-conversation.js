/* Cosmetic conversation only. No timers advance a sale or change game state. */
function marketQuantityText(id, n) {
  const c = crop(id);
  const single = {
    carrot: "carrot",
    cucumber: "cucumber",
    tomato: "tomato",
    onion: "onion",
    radish: "radish",
  };
  const name =
    c.unit === "lb"
      ? `${n === 1 ? "pound" : "pounds"} of ${c.name.toLowerCase()}`
      : id === "corn"
        ? `${n === 1 ? "ear" : "ears"} of corn`
        : id === "lettuce"
          ? `${n === 1 ? "head" : "heads"} of lettuce`
          : n === 1
            ? single[id] || c.name.toLowerCase()
            : c.name.toLowerCase();
  return `${n} ${name}`;
}
function marketRequestText() {
  return state.customer
    ? Object.entries(state.customer.want)
        .map(([id, n]) => marketQuantityText(id, n))
        .join(" and ")
    : "";
}

function marketConversation() {
  const c = state.customer;
  if (!c) return "";
  const variant =
    (Array.from(c.name).reduce((n, ch) => n + ch.codePointAt(0), 0) +
      state.day +
      state.visitors) %
    3;
  let lines;
  if (state.step === "greet")
    lines = [
      [
        "Hello! It's lovely to see your stand.",
        "Hi there! Your harvest looks lovely.",
        "Good morning! May I shop at your stand?",
      ][variant],
      `I'd like ${marketRequestText()}, please.`,
    ];
  else if (state.step === "pay")
    lines = [
      [
        "That sounds right. Thank you!",
        "Wonderful, thank you for adding that up!",
        "Thanks for helping me with my order!",
      ][variant],
      `Here is ${money(state.tendered)}. I'll wait while you count my change.`,
    ];
  else if (state.step === "thanks")
    lines = [
      Game.customerResponse(state),
      c.response === "sale-complete"
        ? [
            "I can't wait to enjoy my harvest. See you again!",
            "Have a lovely market day!",
            "I'll enjoy these. Goodbye for now!",
          ][variant]
        : "Have a good market day. Goodbye for now!",
    ];
  else
    lines = [
      Game.customerResponse(state),
      `I'd like ${marketRequestText()}, please.`,
    ];
  return `<div class="market-conversation" aria-live="polite" aria-atomic="true"><strong>${c.name} says:</strong>${lines.map((line, i) => `<p class="market-dialogue-line" style="--line-delay:${i * 650}ms">${line}</p>`).join("")}${state.step === "pay" ? `<div class="market-payment-offer" aria-label="Customer presents ${money(state.tendered)}"><svg viewBox="0 0 160 60" aria-hidden="true"><rect x="2" y="2" width="156" height="56" rx="6" fill="#d7ead0" stroke="#375d43" stroke-width="3"/><rect x="9" y="8" width="142" height="44" rx="4" fill="none" stroke="#6e9272"/><text x="80" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="32" font-weight="bold" fill="#254e37">${money(state.tendered)}</text></svg><span>Payment offered</span></div>` : ""}</div>`;
}
function marketFarewell(farewell) {
  // Complete the original action immediately; only the departing illustration
  // lingers. Navigation, refresh and reduced motion never depend on a timer.
  const portrait = document
    .querySelector(".market-first-person")
    ?.cloneNode(true);
  advance(farewell);
  if (
    !portrait ||
    state.customer ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  portrait.classList.add("market-departing");
  portrait.setAttribute("aria-hidden", "true");
  const active = portrait.querySelector(".market-active-customer");
  if (!active) return;
  portrait.querySelectorAll("image").forEach((img) => {
    if (!active.contains(img)) img.remove();
  });
  active.classList.replace(
    "market-active-customer",
    "market-departing-customer",
  );
  portrait.querySelector("#market-behind-counter").id = "market-departure-clip";
  active.setAttribute("clip-path", "url(#market-departure-clip)");
  const scene = document.querySelector(".market-tableau");
  scene?.append(portrait);
  const animation = portrait.animate(
    [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: "translateX(22px)" },
    ],
    { duration: 900, easing: "ease-in" },
  );
  animation.finished.then(
    () => portrait.remove(),
    () => portrait.remove(),
  );
}
