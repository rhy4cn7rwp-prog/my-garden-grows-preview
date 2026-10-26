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
  if (!c || state.step === "greet") return "";
  const variant =
    (Array.from(c.name).reduce((n, ch) => n + ch.codePointAt(0), 0) +
      state.day +
      state.visitors) %
    3;
  const order = Object.entries(c.want)
    .map(([id, n]) =>
      crop(id).unit === "lb"
        ? `${n} lb of ${crop(id).name.toLowerCase()}`
        : marketQuantityText(id, n),
    )
    .join(", ");
  const requests = `${order}${order.length < 35 ? ", please" : ""}.`;
  let lines;
  if (state.step === "pay")
    lines = [
      ["Thank you!", "Wonderful!", "Thanks!"][variant],
      `Here's ${money(state.tendered)}.`,
    ];
  else if (state.step === "thanks")
    lines = [
      c.response === "sale-complete"
        ? [
            "Thank you! See you again!",
            "Thank you! Have a lovely day!",
            "Thank you! I'll enjoy these!",
          ][variant]
        : {
            "wait-left": "I'm in a hurry. Maybe next time!",
            "alternative-declined": "I need what's on my list. Thanks!",
            "soldout-sorry": "Thanks for letting me know!",
            "soldout-return": "I'll come back another day!",
          }[c.response] || Game.customerResponse(state),
    ];
  else {
    const responses = {
      excellent: "What a lovely welcome!",
      good: "Hi! Thank you.",
      "wait-stayed": "Hello!",
      "alternative-accepted": "I'll try that instead!",
    };
    lines = [
      responses[c.response] || Game.customerResponse(state),
      `I'd like ${requests}`,
    ];
  }
  const remembered = c.rememberedCrop && crop(c.rememberedCrop)?.name.toLowerCase();
  lines = MarketCustomers.dialogue(c, state.step, order, money(state.tendered), remembered) || lines;
  return `<div class="market-conversation" role="button" tabindex="0" aria-label="Read customer dialogue" onclick="readMarketDialogue()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();readMarketDialogue()}" aria-live="polite" aria-atomic="true"><strong>${c.name}</strong><div class="market-speech-copy">${lines.map((line, i) => `<p class="market-dialogue-line" style="--line-delay:${i * 650}ms">${line}</p>`).join("")}</div>${state.step === "pay" ? `<div class="market-payment-offer" aria-label="Customer presents ${money(state.tendered)}"><svg viewBox="0 0 160 60" aria-hidden="true"><rect x="2" y="2" width="156" height="56" rx="6" fill="#d7ead0" stroke="#375d43" stroke-width="3"/><rect x="9" y="8" width="142" height="44" rx="4" fill="none" stroke="#6e9272"/><text x="80" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="32" font-weight="bold" fill="#254e37">${money(state.tendered)}</text></svg><span>Payment offered</span></div>` : ""}</div>`;
}
function syncMarketSpeech() {
  const scene = document.querySelector(".market-with-customer");
  const bubble = scene?.querySelector(".market-conversation");
  if (!bubble) return;
  const rect = scene.getBoundingClientRect(),
    w = scene.clientWidth,
    h = scene.clientHeight;
  // The portrait and tail share the SVG camera's exact xMidYMid slice projection.
  const k = Math.max(w / 1536, h / 1024),
    ox = (w - 1536 * k) / 2,
    oy = (h - 1024 * k) / 2;
  const left = ox + 930 * k,
    mouthX = ox + 768 * k,
    mouthY = oy + marketCustomerMouth() * k;
  const topLimit =
    document.querySelector(".farmers-market-game .hud").getBoundingClientRect()
      .bottom -
    rect.top +
    6;
  Object.assign(bubble.style, {
    left: left + "px",
    right: "max(7px, var(--village-safe-right))",
    width: "auto",
  });
  const bubbleRight = bubble.getBoundingClientRect().right;
  const obstacles = [
    scene.querySelector(".market-produce-tray"),
    scene.querySelector(".market-tray-hint"),
  ].filter(Boolean);
  const bottomLimit = Math.min(
    h - 8,
    ...obstacles
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.right > rect.left + left && r.left < bubbleRight)
      .map((r) => r.top - rect.top - 7),
  );
  Object.assign(bubble.style, {
    left: left + "px",
    maxHeight: Math.max(60, bottomLimit - topLimit) + "px",
  });
  const bh = bubble.offsetHeight;
  const top = Math.max(topLimit, Math.min(mouthY - bh / 2, bottomLimit - bh));
  bubble.style.top = top + "px";
  const baseY = Math.max(top + 12, Math.min(top + bh - 12, mouthY));
  const length = Math.min(14, Math.max(8, 25 * k));
  const tipX = left - length,
    tipY = baseY + ((mouthY - baseY) * length) / Math.max(1, left - mouthX);
  const tail = scene.querySelector(".market-speech-tail");
  tail.setAttribute("viewBox", `0 0 ${w} ${h}`);
  tail
    .querySelector("path")
    .setAttribute(
      "d",
      `M ${left + 2} ${baseY - 5} L ${tipX} ${tipY} L ${left + 2} ${baseY + 5} Z`,
    );
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

function readMarketDialogue(){const e=document.querySelector(".market-conversation");if(e)Narration.speak(e.innerText,"shop",true);}
