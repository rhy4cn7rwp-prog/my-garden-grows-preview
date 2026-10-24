/* One live navigation/status component, shared by the village and all interiors. */
const NAV_ICONS = {
  back: '<path d="m14 5-7 7 7 7M7 12h14"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
  settings:
    '<path d="m10 3-1 3-3 1-3 3 3 2-1 4 3 2 3-1 3 2 3-2-1-4 3-2-1-4-4-1-2-3Z"/><circle cx="12" cy="12" r="3"/>',
  leaf: '<path d="M20 3C8 2 2 7 5 15c8 6 15-1 15-12ZM4 21 16 8"/>',
  wallet:
    '<rect x="3" y="6" width="18" height="15" rx="3"/><path d="m5 6 12-4v4M21 12h-6v5h6"/><circle cx="17" cy="14.5" r=".5"/>',
};
function navigationIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${NAV_ICONS[name]}</svg>`;
}
function header() {
  return `<nav class="hud" aria-label="Farm navigation">
    <button class="nav" onclick="${view === "town" ? "settings()" : "go('town')"}" aria-label="${view === "town" ? "Settings" : "Back to village"}">${navigationIcon(view === "town" ? "settings" : "back")}</button>
    <div class="farm-status"><output class="balance" aria-label="Money balance">${navigationIcon("wallet")}${money(state.cash)}</output><span class="calendar" aria-label="Season and day">Season ${state.season} · Day ${state.day}/20</span></div>
    <button class="nav home-nav" onclick="go('town')" aria-label="Home" ${view === "town" ? 'aria-current="page"' : ""}>${navigationIcon("home")}</button>
  </nav>`;
}

// Safari's visible viewport can be shorter than CSS viewport units while toolbars move.
function syncGameViewport() {
  const viewport = window.visualViewport;
  const root = document.documentElement;
  root.style.setProperty(
    "--visible-height",
    `${viewport ? viewport.height : innerHeight}px`,
  );
  root.style.setProperty(
    "--visible-width",
    `${viewport ? viewport.width : innerWidth}px`,
  );
  root.style.setProperty(
    "--visible-top",
    `${viewport ? viewport.offsetTop : 0}px`,
  );
  root.style.setProperty(
    "--visible-left",
    `${viewport ? viewport.offsetLeft : 0}px`,
  );
  const modal = document.querySelector(".register-modal");
  const insets = getComputedStyle(modal || root);
  const top =
    parseFloat(
      insets.getPropertyValue(
        modal ? "--register-safe-top" : "--viewport-safe-top",
      ),
    ) || 0;
  const bottom =
    parseFloat(
      insets.getPropertyValue(
        modal ? "--register-safe-bottom" : "--viewport-safe-bottom",
      ),
    ) || 0;
  const shell = getComputedStyle(root);
  const shellTop =
    parseFloat(shell.getPropertyValue("--viewport-safe-top")) || 0;
  const shellBottom =
    parseFloat(shell.getPropertyValue("--viewport-safe-bottom")) || 0;
  root.dataset.compactTown =
    (viewport ? viewport.height : innerHeight) - shellTop - shellBottom < 480
      ? "true"
      : "false";
  root.dataset.shortRegister =
    (viewport ? viewport.height : innerHeight) - top - bottom < 470
      ? "true"
      : "false";
}
window.visualViewport?.addEventListener("resize", syncGameViewport);
window.visualViewport?.addEventListener("scroll", syncGameViewport);
window.addEventListener("resize", syncGameViewport);
syncGameViewport();
