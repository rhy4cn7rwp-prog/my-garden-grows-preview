/* Beginners add provided subtotals; owned dreams unlock multiplication practice. */
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
    Game.requiresLineMath(state),
    Game.nextMathLine(state),
    state.customer.prices,
  ]);
  if (marketTotalDraft.key !== key) marketTotalDraft = { key, value: "" };
  const activeLine = Game.nextMathLine(state);
  const confirm = activeLine ? "Confirm line" : "Confirm total";
  const heading = activeLine ? "Multiply this item" : "Calculate the total";
  show(
    `<header class="total-keypad-header"><h2>${heading}</h2><button class="register-close" aria-label="Close ✕" onclick="closeDialog()">×</button></header><div class="total-keypad-order"><b>${state.customer.name}'s order:</b>${
      Object.entries(state.basket).filter(([,n])=>n>0).map(([id,n]) => {
        const solved = Game.lineSolved(state,id);
        const result = !Game.requiresLineMath(state) ? money(Game.lineTotal(state,id)) :
          solved ? money(state.customer.lineAnswers[id].answerCents/100) + " ✓" : "?";
        return `<div class="order-math-line ${activeLine === id ? "math-line-active" : ""}" ${activeLine === id ? 'aria-current="step"' : ""}><span>${crop(id).name}${crop(id).unit === "lb" ? " (lb)" : ""}:</span><span>${n} × ${money(Game.marketPrice(state,id))} = ${result}</span></div>`;
      }).join("") || "Your basket is empty."
    }<b>Total: $?</b></div><div class="total-keypad-display"><span>${activeLine ? crop(activeLine).name + " subtotal" : "Your total"}</span><output id="total-answer" aria-label="${activeLine ? "Your item subtotal" : "Your calculated total"}" aria-live="polite">${marketTotalDraft.value === "" ? "—" : "$" + marketTotalDraft.value}</output></div><p class="total-keypad-feedback" role="status">${feedback || (activeLine ? "Multiply the highlighted quantity and price." : "Add the item amounts. Take your time!")}</p><div class="total-keypad-keys">${["7", "8", "9", "Backspace", "4", "5", "6", "Clear", "1", "2", "3", ".", "0", confirm].map((key) => `<button class="${key === "0" ? "keypad-zero" : key === confirm ? "keypad-confirm" : ""}" aria-label="${key === "." ? "Decimal point" : key}" onclick="marketTotalPress('${key}')" ${key === confirm && marketTotalDraft.value === "" ? "disabled" : ""}>${key === "Backspace" ? "⌫" : key === confirm ? confirm : key}</button>`).join("")}</div>`,
    "total-keypad",
  );
  const receipt = document.querySelector(".total-keypad-order");
  const row = receipt?.querySelector(".math-line-active");
  if (row) receipt.scrollTop = row.offsetTop - receipt.offsetTop;
  else if (receipt) receipt.scrollTop = receipt.scrollHeight;

}
function marketTotalPress(key) {
  if (dialogKey !== "total-keypad" || state.step !== "choose") return;
  let v = marketTotalDraft.value;
  if (key === "Confirm total" || key === "Confirm line") {
    try {
      Game.checkBasket(state);
    } catch (e) {
      order(e.message);
      return;
    }
    try {
      const id = Game.nextMathLine(state);
      if (id) {
        Game.answerMathLine(state, id, v === "" ? NaN : Number(v));
        marketTotalDraft.value = "";
        save();
        marketTotalKeypad(Game.nextMathLine(state) ? "That's right! Try the next item." : "Well done! Now add your item amounts.");
      } else {
        Game.ring(state, v === "" ? NaN : Number(v));
        closeDialog();
      }
    } catch (e) {
      save();
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
      ? Game.nextMathLine(state) ? "Confirm line" : "Confirm total"
      : event.key === "Delete"
        ? "Clear"
        : event.key;
  if (
    /^\d$/.test(key) ||
    [".", "Backspace", "Clear", "Confirm total", "Confirm line"].includes(key)
  ) {
    event.preventDefault();
    marketTotalPress(key);
  }
});
