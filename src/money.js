/* Original simplified educational money drawings. No copied currency artwork. */
function moneyButton(value) {
  const label = value < 1 ? Math.round(value * 100) + "¢" : "$" + value;
  let drawing;
  if (value >= 1) {
    const colors = { 1: "#d7ead0", 5: "#d1e5dc", 10: "#e8e6bf", 20: "#c3dfcb" };
    drawing = `<svg viewBox="0 0 160 84" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="156" height="80" rx="7" fill="${colors[value]}" stroke="#375d43" stroke-width="3"/>
      <rect x="9" y="9" width="142" height="66" rx="4" fill="none" stroke="#6e9272" stroke-width="2"/>
      <path d="M18 39q13-24 25-9q-3 15-18 15m5-10v28" fill="#78a86b" stroke="#375d43" stroke-width="2"/>
      <ellipse cx="93" cy="40" rx="44" ry="25" fill="#f4f8e9" stroke="#6e9272"/>
      <text x="93" y="51" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="34" fill="#254e37">${label}</text>
      <text x="20" y="25" font-family="system-ui,sans-serif" font-weight="bold" font-size="13" fill="#254e37">${label}</text>
      <text x="80" y="70" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8" letter-spacing="2" fill="#375d43">GARDEN PLAY MONEY</text>
    </svg>`;
  } else {
    const n = Math.round(value * 100),
      r = { 1: 31, 5: 34, 10: 29, 25: 37 }[n],
      copper = n === 1;
    drawing = `<svg viewBox="0 0 100 84" aria-hidden="true" focusable="false">
      <circle cx="50" cy="42" r="${r}" fill="${copper ? "#d9a179" : "#d6dcd9"}" stroke="${copper ? "#88583b" : "#626e68"}" stroke-width="3"/>
      <circle cx="50" cy="42" r="${r - 5}" fill="none" stroke="${copper ? "#b3734c" : "#9ba7a1"}" stroke-width="2" stroke-dasharray="2 2"/>
      <text x="50" y="49" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="bold" font-size="25" fill="#3f493e">${label}</text>
      <path d="M44 62q6-10 12 0m-6-2v6" fill="none" stroke="#626e68" stroke-width="2"/>
    </svg>`;
  }
  return `<button class="money-piece ${value >= 1 ? "paper-bill" : "metal-coin"}" aria-label="${label}" onclick="addMoney(${value})">${drawing}</button>`;
}
