/* Activate a genuine touch release once, even when the browser omits or
   retargets its compatibility click. Scrolling and canceled gestures never act. */
const TouchActions = (() => {
  let gesture = null,
    ignoreUntil = 0;
  document.addEventListener(
    "pointerdown",
    (e) => {
      ignoreUntil = 0;
      gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    },
    true,
  );
  document.addEventListener(
    "pointermove",
    (e) => {
      if (
        gesture?.id === e.pointerId &&
        Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 9
      )
        gesture.moved = true;
    },
    true,
  );
  document.addEventListener(
    "pointercancel",
    () => {
      gesture = null;
    },
    true,
  );
  document.addEventListener(
    "keydown",
    () => {
      ignoreUntil = 0;
      gesture = null;
    },
    true,
  );
  document.addEventListener(
    "click",
    (e) => {
      if (Date.now() < ignoreUntil) {
        ignoreUntil = 0;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  function run(e, action) {
    if (e?.type === "click" && gesture?.moved) return;
    if (e?.type === "pointerup") {
      if (
        e.pointerType !== "touch" ||
        !gesture ||
        gesture.id !== e.pointerId ||
        gesture.moved
      )
        return;
      ignoreUntil = Date.now() + 650;
      e.preventDefault();
      action();
      return;
    }
    action();
  }
  return { run };
})();
