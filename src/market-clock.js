/* Persist active play; never charge a hidden or reopened page for time away. */
function marketClockFace() {
  return `<div class="market-clock" aria-label="Market clock"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#b77c40" stroke="#704723" stroke-width="2"/><circle cx="32" cy="32" r="24" fill="#fff4d5" stroke="#e7bd70" stroke-width="2"/>${Array.from({ length: 12 }, (_, i) => `<path d="M32 10v3" stroke="#754d2c" stroke-width="2" transform="rotate(${i * 30} 32 32)"/>`).join("")}<text x="32" y="22" text-anchor="middle" font-size="9" font-family="Georgia" fill="#68442a">12</text><text x="32" y="49" text-anchor="middle" font-size="9" font-family="Georgia" fill="#68442a">6</text><path class="market-hour-hand" d="M32 32V19" stroke="#526944" stroke-width="4" stroke-linecap="round"/><path class="market-minute-hand" d="M32 34V14" stroke="#ae4c35" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="32" r="3" fill="#785037"/></svg><div><time class="market-clock-time"></time><span class="market-clock-status"></span></div></div>`;
}
let marketClockReportKey = null,
  marketClockReportQueued = false;
function markMarketClockReport() {
  marketClockReportKey = `${state.season}:${state.day}:${state.marketStartedAt}`;
}
function paintMarketClock() {
  const time = Game.marketTime(state);
  const minute = time.wholeMinutes % 60,
    hour = Math.floor(time.wholeMinutes / 60);
  const text = `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
  document.querySelectorAll(".market-clock").forEach((clock) => {
    clock
      .querySelector(".market-hour-hand")
      .setAttribute("transform", `rotate(${(time.minutes / 2) % 360} 32 32)`);
    clock
      .querySelector(".market-minute-hand")
      .setAttribute("transform", `rotate(${(time.minutes * 6) % 360} 32 32)`);
    clock.querySelector("time").textContent = text;
    clock.querySelector(".market-clock-status").textContent = state.marketOpen
      ? time.expired
        ? "Finish your customer"
        : "Open until 1 PM"
      : state.marketPlayed
        ? "Closed today"
        : "Opens at 9 AM";
    clock.setAttribute(
      "aria-label",
      `Market clock: ${text}. ${clock.querySelector(".market-clock-status").textContent}`,
    );
  });
  const key = `${state.season}:${state.day}:${state.marketStartedAt}`;
  if (
    view === "market" &&
    time.expired &&
    !state.marketOpen &&
    !state.customer &&
    !popup &&
    marketClockReportKey !== key &&
    !marketClockReportQueued
  ) {
    marketClockReportQueued = true;
    queueMicrotask(() => {
      marketClockReportQueued = false;
      if (
        view === "market" &&
        !state.marketOpen &&
        !state.customer &&
        !popup &&
        Game.marketTime(state).expired
      ) {
        marketClockReportKey = key;
        showMarketReport();
      }
    });
  }
}
function tickMarketClock() {
  if (typeof state === "undefined") return;
  if (document.hidden) {
    Game.pauseMarketClock(state);
    save();
    return;
  }
  Game.resumeMarketClock(state);
  Game.checkpointMarketClock(state);
  const closed = Game.syncMarketClock(state);
  save();
  if (closed) {
    render();
    return;
  }
  paintMarketClock();
}
setInterval(tickMarketClock, 1000);
window.addEventListener("pageshow", tickMarketClock);
window.addEventListener("focus", tickMarketClock);
document.addEventListener("visibilitychange", tickMarketClock);
function pauseHiddenMarket() {
  if (typeof state === "undefined") return;
  Game.pauseMarketClock(state);
  save();
}
window.addEventListener("pagehide", pauseHiddenMarket);
// Supported by page-lifecycle browsers; visibilitychange handles Safari.
document.addEventListener("freeze", pauseHiddenMarket);
