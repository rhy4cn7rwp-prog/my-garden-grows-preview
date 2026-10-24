/* Paint the document canvas as well as the visible game. iPhone Safari can
   expose this canvas around dynamic toolbars; it previously fell back to green.
   The interactive viewport and its safe-area layout remain independent. */
const VILLAGE_BROWSER_SKY = {
  spring: "#c8e6f0",
  summer: "#c3e3f0",
  autumn: "#c9e0e8",
  winter: "#d1e4ed",
};
function syncVillagePageCanvas() {
  const root = document.documentElement;
  const world = document.querySelector(".town-world");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const tint = (color) => {
    if (themeMeta?.getAttribute("content") !== color)
      themeMeta?.setAttribute("content", color);
  };
  const property = (name, value) => {
    if (root.style.getPropertyValue(name) !== value)
      root.style.setProperty(name, value);
  };
  if (!world) {
    delete root.dataset.villageCanvas;
    tint("#f8e9c2");
    return;
  }
  const season = VILLAGE_SEASONS.find((s) => s.key === world.dataset.season);
  if (!season) return;
  // Read resolved large-viewport units instead of assuming that screen.height
  // equals the page area. The hidden pseudo-element never captures input.
  if (root.dataset.villageCanvas !== season.key)
    root.dataset.villageCanvas = season.key;
  const largeHeight =
    parseFloat(getComputedStyle(root, "::before").height) || 0;
  const width = Math.max(root.clientWidth, window.innerWidth);
  const height = Math.max(
    largeHeight,
    root.clientHeight,
    window.innerHeight,
    window.visualViewport?.height || 0,
  );
  // A small overscan keeps filtering from revealing an adjacent atlas frame.
  const coverWidth = Math.max(width, height * 0.75) + 2;
  const coverHeight = coverWidth / 0.75;
  // Two-by-two atlas: the selected frame alone covers the entire page canvas.
  property("--page-art-size", `${coverWidth * 2}px ${coverHeight * 2}px`);
  property(
    "--page-art-position",
    `${(width - coverWidth) / 2 - season.column * coverWidth}px ${(height - coverHeight) / 2 - season.row * coverHeight}px`,
  );
  property("--page-sky", VILLAGE_BROWSER_SKY[season.key]);
  tint(VILLAGE_BROWSER_SKY[season.key]);
}
