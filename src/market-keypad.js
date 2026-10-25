/* Player-entered arithmetic only: never fill or expose the answer for them. */
let marketTotalDraft = { key: "", value: "" };
function marketTotalKeypad(feedback = "") {
  if (!state.customer || state.step !== "choose") return;
  const key = JSON.stringify([
    state.season,
    state.day,
    state.visitors,
    state.customer.name,
    state.customer.want,
    state.basket,
  ]);
  if (marketTotalDraft.key !== key) marketTotalDraft = { key, value: "" };
  show(
    `<header class="total-keypad-header"><h2>Calculate the total</h2><button class="register-close" aria-label="Close ✕" onclick="closeDialog()">×</button></header><div class="total-keypad-order"><b>${state.customer.name}'s order:</b>${
      Object.entries(state.basket).filter(([,n])=>n>0).map(([id,n]) =>
        `<div class="order-math-line"><span>${crop(id).name}${crop(id).unit === "lb" ? " (lb)" : ""}:</span><span>${n} × ${money(Game.marketPrice(state,id))} = ?</span></div>`
      ).join("") || "Your basket is empty."
    }<b>Total: $?</b></div><div class="total-keypad-display"><span>Your total</span><output id="total-answer" aria-label="Your calculated total" aria-live="polite">${marketTotalDraft.value === "" ? "—" : "$" + marketTotalDraft.value}</output></div><p class="total-keypad-feedback" role="status">${feedback || "Use the prices on your stand. Take your time!"}</p><div class="total-keypad-keys">${["7", "8", "9", "Backspace", "4", "5", "6", "Clear", "1", "2", "3", ".", "0", "Confirm total"].map((key) => `<button class="${key === "0" ? "keypad-zero" : key === "Confirm total" ? "keypad-confirm" : ""}" aria-label="${key === "." ? "Decimal point" : key}" onclick="marketTotalPress('${key}')" ${key === "Confirm total" && marketTotalDraft.value === "" ? "disabled" : ""}>${key === "Backspace" ? "⌫" : key === "Confirm total" ? "Confirm total" : key}</button>`).join("")}</div>`,
    "total-keypad",
  );
}
function marketTotalPress(key) {
  if (dialogKey !== "total-keypad" || state.step !== "choose") return;
  let v = marketTotalDraft.value;
  if (key === "Confirm total") {
    try {
      Game.checkBasket(state);
    } catch (e) {
      order(e.message);
      return;
    }
    try {
      Game.ring(state, v === "" ? NaN : Number(v));
      closeDialog();
    } catch (e) {
      marketTotalKeypad(e.message);
    }
    return;
  }
  if (key === "Clear") v = "";
  else if (key === "Backspace") v = v.slice(0, -1);
  else if (key === ".") {
    if (!v.includes(".")) v = (v || "0") + ".";
  } else if (/^\d$/.test(key)) {
    const next = (v === "0" ? "" : v) + key;
    if (/^\d{1,7}(\.\d{0,2})?$/.test(next)) v = next;
  } else return;
  marketTotalDraft.value = v;
  marketTotalKeypad();
}
document.addEventListener("keydown", (event) => {
  if (
    dialogKey !== "total-keypad" ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeDialog();
    return;
  }
  if (event.key === "Enter" && event.target.closest?.(".register-close"))
    return;
  const key =
    event.key === "Enter"
      ? "Confirm total"
      : event.key === "Delete"
        ? "Clear"
        : event.key;
  if (
    /^\d$/.test(key) ||
    [".", "Backspace", "Clear", "Confirm total"].includes(key)
  ) {
    event.preventDefault();
    marketTotalPress(key);
  }
});
