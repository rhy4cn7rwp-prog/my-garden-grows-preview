/* Garden presentation and gestures only. Game owns seeds, growth, yields and stock.
   Effects/tool selection are ephemeral. Weeding and bonus flags are saved by Game. */
const gardenUI = {
  waterMode: false,
  root: null,
  abort: null,
  drag: null,
  suppressUntil: 0,
  effects: new Map(),
};
function gardenCanArt() {
  return `<svg viewBox="0 0 120 90" aria-hidden="true"><defs><linearGradient id="garden-can-metal" x2="0" y2="1"><stop stop-color="#a8ded9"/><stop offset="1" stop-color="#3f8f9b"/></linearGradient></defs><path d="M81 24q39-21 30 17L83 59" fill="none" stroke="#427b83" stroke-width="9"/><path d="M31 17h51v52q-27 17-51 0Z" fill="url(#garden-can-metal)" stroke="#386b70" stroke-width="3"/><ellipse cx="56" cy="18" rx="25" ry="9" fill="#cee9d7" stroke="#386b70" stroke-width="3"/><path d="M34 45 13 27 4 37l29 28" fill="#80bbc2" stroke="#386b70" stroke-width="3"/><path d="m7 43-5 13m11-11-3 16m11-12v15" stroke="#83c6e3" stroke-width="3" stroke-linecap="round"/><path d="M42 29v29" stroke="#def7e4" stroke-width="4" opacity=".6"/></svg>`;
}
function gardenBasketArt() {
  return `<svg viewBox="0 0 120 90" aria-hidden="true"><defs><linearGradient id="garden-wicker" x2="0" y2="1"><stop stop-color="#edc385"/><stop offset="1" stop-color="#b17b43"/></linearGradient></defs><path d="M28 35C27-8 91-8 92 35" fill="none" stroke="#926132" stroke-width="7"/><path d="m9 33 102 0-14 48Q60 96 23 81Z" fill="url(#garden-wicker)" stroke="#83552d" stroke-width="4"/><path d="M12 40q48 13 96 0M18 54q42 12 84 0M21 69q39 12 79 0M33 40l6 43m18-38v41m23-43-4 41" fill="none" stroke="#956534" stroke-width="3"/></svg>`;
}
function gardenLeafArt(i, stage) {
  const large = stage !== "seedling";
  return `<svg class="garden-plant-art" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="garden-leaf-${i}" x2=".7" y2="1"><stop stop-color="#a9d86c"/><stop offset="1" stop-color="#3d833f"/></linearGradient></defs><ellipse cx="50" cy="88" rx="25" ry="5" fill="#432813" opacity=".25"/><path d="M50 87V${large ? 29 : 49}" fill="none" stroke="#487e32" stroke-width="5" stroke-linecap="round"/><g fill="url(#garden-leaf-${i})" stroke="#406e2e" stroke-width="1.5"><path d="M50 72Q16 75 16 47 48 40 50 72M50 61Q83 61 84 35 54 31 50 61"/>${large ? '<path d="M50 46Q23 42 27 20 52 21 50 46M50 35Q74 36 76 12 54 11 50 35"/>' : ""}</g><path d="m23 52 22 14m11-11 22-14" stroke="#c0dd83" stroke-width="2" fill="none"/></svg>`;
}
function gardenPlotMarkup(p, i) {
  const c = p ? crop(p.id) : null,
    planned = state.plan[i] && crop(state.plan[i]),
    ready = p && p.age >= c.days,
    regrowing = p && c.repeat > 0 && p.left < c.repeat && p.age < c.days,
    stage = ready
      ? "ready"
      : regrowing
        ? "regrowing"
        : p
          ? p.age / c.days < 0.5
            ? "seedling"
            : "growing"
          : planned
            ? "planned"
            : "empty",
    fx = gardenUI.effects.get(i),
    effect = fx && fx.until > Date.now() ? fx.kind : "",
    label = `Plot ${i + 1}: ${p ? `${c.name}, ${ready ? "ready to harvest" : `${p.age} of ${c.days} watered days`}, ${p.watered ? "watered today" : "not watered today"}` : planned ? `${planned.name} planned. Tap to cancel` : "empty. Tap to plan planting"}`;
  return `<button class="garden-plot ${p?.watered ? "is-watered" : ""} ${ready ? "is-ready" : ""} ${effect ? "garden-effect-" + effect : ""}" data-garden-plot="${i}" data-stage="${stage}" aria-label="${label}" onclick="gardenPlotTap(${i})"><svg class="garden-soil" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="garden-soil-${i}" x2="0" y2="1"><stop stop-color="var(--soil-light)"/><stop offset="1" stop-color="var(--soil-dark)"/></linearGradient></defs><rect x="1" y="1" width="98" height="98" rx="12" fill="url(#garden-soil-${i})"/><path d="M12 19q18-6 30-1t42-3M11 83q23-6 43 0t33-5" fill="none" stroke="#e0b478" stroke-width="2" opacity=".25"/><g fill="#f1c78e" opacity=".3"><ellipse cx="17" cy="35" rx="3" ry="2"/><ellipse cx="71" cy="25" rx="2" ry="1"/><ellipse cx="81" cy="68" rx="3" ry="2"/><ellipse cx="33" cy="73" rx="2" ry="1.5"/></g></svg><span class="garden-plot-number">${i + 1}</span>${p ? (ready ? `<span class="garden-ripe-art">${seedProduceArt(p.id)}</span>` : gardenLeafArt(i, stage)) : planned ? `<span class="garden-planned-art">${seedProduceArt(planned.id)}</span>` : '<span class="garden-empty-marks" aria-hidden="true">· · ·</span>'}${p?.watered ? '<span class="garden-water-mark" aria-hidden="true"><svg viewBox="0 0 20 24"><path d="M10 1C8 7 2 11 2 16a8 8 0 0 0 16 0C18 11 12 7 10 1Z" fill="#9bdeef" stroke="#315d73" stroke-width="1.5"/><path d="m6 16 3 3 5-6" fill="none" stroke="#315d73" stroke-width="2"/></svg></span>' : ""}${effect === "water" ? '<span class="garden-water-spray" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' : ""}</button>`;
}
function gardenScene() {
  const ready = state.plots.filter((p) => p && p.age >= crop(p.id).days).length,
    stored = CROPS.filter((c) => state.inventory[c.id] > 0).length;
  return `<section class="garden-heading"><h1>My Garden</h1>${gardenWeedingButton()}<output role="status" aria-live="polite">${state.notice || "Plan, plant, water and harvest at your own pace."}</output>${gardenBonusStatus()}</section><section class="garden-tools" aria-label="Garden tools"><button class="btn ${gardenUI.waterMode ? "alt" : ""}" onclick="gardenInspectMode()" aria-pressed="${!gardenUI.waterMode}">Plant / Inspect</button><button class="garden-can ${gardenUI.waterMode ? "is-selected" : ""}" data-garden-tool="water" onclick="gardenToggleWater()" aria-label="Watering can" aria-pressed="${gardenUI.waterMode}">${gardenCanArt()}<span>${gardenUI.waterMode ? "Tap a plant" : "Drag or tap"}</span></button><button class="garden-basket" data-garden-basket onclick="inventory()" aria-label="Harvest basket">${gardenBasketArt()}<span>Harvest basket<small>${ready ? `${ready} ready to pick` : `${stored} crop ${stored === 1 ? "variety" : "varieties"} stored`}</small></span></button></section><section class="garden-world" aria-label="Your 5 by 5 garden"><svg class="garden-scenery" viewBox="0 128 512 294" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="garden-ground" width="30" height="24" patternUnits="userSpaceOnUse"><rect width="30" height="24" fill="#ab7c49"/><circle cx="4" cy="6" r="1" fill="#d5af77"/><ellipse cx="22" cy="18" rx="2" ry="1" fill="#805632"/></pattern></defs><image href="assets/scene-4.webp" width="512" height="512"/><rect x="68" y="173" width="375" height="238" rx="14" fill="url(#garden-ground)"/></svg><div class="garden-plots" role="group" aria-label="25 garden plots">${state.plots.map(gardenPlotMarkup).join("")}</div></section><section class="garden-controls" aria-label="Garden actions"><button class="btn" onclick="plantPlanned()" ${Object.keys(state.plan).length ? "" : "disabled"}>Plant Plan (${Object.keys(state.plan).length})</button><button class="btn alt" onclick="cancelPlanting()" ${Object.keys(state.plan).length ? "" : "disabled"}>Cancel Plan</button><button class="btn" onclick="endDay()">End Day</button><button class="btn" onclick="water()">Water All</button><button class="btn garden-harvest-all" onclick="harvestReady()">Harvest All Ready Crops</button><p>${gardenUI.waterMode ? "Tap a planted plot to water it." : "Tap plots to plant or inspect. Drag ripe crops to the basket."}</p></section>`;
}
function gardenInspectMode() {
  gardenUI.waterMode = false;
  render();
}
function gardenToggleWater() {
  if (Date.now() < gardenUI.suppressUntil) return;
  gardenUI.waterMode = !gardenUI.waterMode;
  render();
}
function gardenPlotTap(i) {
  if (Date.now() < gardenUI.suppressUntil) return;
  if (gardenUI.waterMode) {
    if (state.plots[i]) waterGardenPlot(i);
    else {
      state.notice =
        "Choose a planted plot to water, or switch to Plant / Inspect.";
      render();
    }
  } else plot(i);
}
function gardenPlotEffect(i, kind) {
  gardenUI.effects.set(i, { kind, until: Date.now() + 900 });
  setTimeout(() => {
    gardenUI.effects.delete(i);
    document
      .querySelector(`[data-garden-plot="${i}"]`)
      ?.classList.remove("garden-effect-" + kind);
    document
      .querySelector(`[data-garden-plot="${i}"] .garden-water-spray`)
      ?.remove();
  }, 950);
}
function waterGardenPlot(i) {
  act(() => {
    const fresh = Game.waterPlot(state, i);
    if (fresh) gardenPlotEffect(i, "water");
    state.notice = fresh
      ? `${crop(state.plots[i].id).name} watered! Growth waits for End Day.`
      : "This plant is already watered today. A little water is enough!";
    popup = "";
    dialogKey = null;
    render();
  });
}
function gardenBasketPulse() {
  const basket = document.querySelector("[data-garden-basket]");
  basket?.classList.add("garden-basket-picked");
  setTimeout(() => basket?.classList.remove("garden-basket-picked"), 850);
}
function gardenHarvestAnimation(id, amount, from) {
  gardenBasketPulse();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const to = document
    .querySelector("[data-garden-basket]")
    ?.getBoundingClientRect();
  if (!to) return;
  const flight = document.createElement("div");
  flight.className = "garden-harvest-flight";
  flight.setAttribute("aria-hidden", "true");
  flight.innerHTML = seedProduceArt(id) + `<b>+${amount} ${crop(id).unit}</b>`;
  Object.assign(flight.style, {
    left: from.left + "px",
    top: from.top + "px",
    width: Math.max(44, from.width) + "px",
    height: Math.max(44, from.height) + "px",
  });
  document.body.append(flight);
  const animation = flight.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px,${to.top + to.height / 2 - from.top - from.height / 2}px) scale(.45)`,
        opacity: 0.25,
      },
    ],
    { duration: 650, easing: "ease-in-out" },
  );
  animation.finished.catch(() => {}).finally(() => flight.remove());
}
function clearGardenDrag() {
  const d = gardenUI.drag;
  if (!d) return;
  gardenUI.drag = null;
  d.ghost?.remove();
  d.target?.classList.remove("garden-drop-valid");
  try {
    d.start.releasePointerCapture(d.pointer);
  } catch {}
}
function syncInteractiveGarden() {
  const root = document.querySelector(".garden-game");
  if (root)
    document.documentElement.style.setProperty(
      "--garden-hud-height",
      root.querySelector(".hud").getBoundingClientRect().height + "px",
    );
  if (root)
    document.documentElement.style.setProperty(
      "--garden-footer-height",
      root.querySelector(".garden-controls").getBoundingClientRect().height +
        "px",
    );
  if (gardenUI.root === root) return;
  clearGardenDrag();
  gardenUI.abort?.abort();
  gardenUI.root = root;
  if (!root) {
    document.querySelectorAll(".garden-harvest-flight").forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      el.remove();
    });
    return;
  }
  gardenUI.abort = new AbortController();
  const options = { signal: gardenUI.abort.signal };
  root.addEventListener(
    "pointerdown",
    (e) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      const start = e.target.closest("[data-garden-tool], [data-garden-plot]");
      if (!start) return;
      const kind = start.hasAttribute("data-garden-tool") ? "water" : "harvest",
        i = Number(start.dataset.gardenPlot),
        p = state.plots[i];
      if (kind === "harvest" && (!p || p.age < crop(p.id).days)) return;
      gardenUI.drag = {
        start,
        kind,
        i,
        plant: p,
        pointer: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: false,
      };
      start.setPointerCapture(e.pointerId);
    },
    options,
  );
  root.addEventListener(
    "pointermove",
    (e) => {
      const d = gardenUI.drag;
      if (!d || d.pointer !== e.pointerId) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      e.preventDefault();
      if (!d.moved) {
        d.moved = true;
        d.ghost = document.createElement("div");
        d.ghost.className = "garden-drag-ghost";
        d.ghost.setAttribute("aria-hidden", "true");
        d.ghost.innerHTML =
          d.kind === "water" ? gardenCanArt() : seedProduceArt(d.plant.id);
        document.body.append(d.ghost);
      }
      Object.assign(d.ghost.style, {
        left: e.clientX - 32 + "px",
        top: e.clientY - 38 + "px",
      });
      const hit = document.elementFromPoint(e.clientX, e.clientY),
        target =
          d.kind === "water"
            ? hit?.closest("[data-garden-plot]")
            : hit?.closest("[data-garden-basket]");
      d.target?.classList.remove("garden-drop-valid");
      d.target = target;
      if (
        target &&
        (d.kind !== "water" || state.plots[+target.dataset.gardenPlot])
      )
        target.classList.add("garden-drop-valid");
    },
    options,
  );
  root.addEventListener(
    "pointerup",
    (e) => {
      const d = gardenUI.drag;
      if (!d || d.pointer !== e.pointerId) return;
      const moved = d.moved,
        target = d.target,
        kind = d.kind,
        i = d.i,
        plant = d.plant;
      clearGardenDrag();
      if (!moved) return;
      e.preventDefault();
      gardenUI.suppressUntil = Date.now() + 400;
      if (kind === "water" && target && state.plots[+target.dataset.gardenPlot])
        waterGardenPlot(+target.dataset.gardenPlot);
      if (kind === "harvest" && target && state.plots[i] === plant) harvest(i);
    },
    options,
  );
  root.addEventListener("pointercancel", clearGardenDrag, options);
  root.addEventListener("lostpointercapture", clearGardenDrag, options);
  root.addEventListener(
    "click",
    (e) => {
      if (
        Date.now() < gardenUI.suppressUntil &&
        e.detail !== 0 &&
        e.target.closest("[data-garden-tool],[data-garden-plot]")
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    { ...options, capture: true },
  );
}

function gardenWeedingButton() {
  const w = Game.weedingStatus(state);
  return `<span class="garden-weeding-entry"><button class="btn" onclick="openGardenWeeding()" ${w.available ? "" : "disabled"}>Pull weeds</button>${!w.available ? `<small>${w.bonus ? "Harvest bonus ready" : !state.plots.some(Boolean) && w.cycle > 0 && !w.complete ? "Plant crops to weed" : `In ${w.days} game ${w.days === 1 ? "day" : "days"}`}</small>` : ""}</span>`;
}
function gardenBonusStatus() {
  const a = state.weedingHarvest,
    count = a?.remaining.length;
  if (a)
    return `<div class="garden-bonus-status" role="status">Bonus harvest: ${count} ripe ${count === 1 ? "plant" : "plants"} still to pick. Pick them individually or use Harvest All before End Day. <button class="btn alt" onclick="confirmFinishBonusHarvest()">Finish bonus harvest</button></div>`;
  return Game.weedingStatus(state).bonus
    ? '<div class="garden-bonus-status">20% care bonus saved! Your next harvest includes eligible crops ripe when you begin picking.</div>'
    : "";
}
function confirmFinishBonusHarvest() {
  show(
    `<h2>Finish gathering?</h2><p>Your remaining ripe plants will keep their normal produce, but this harvest activity’s unused bonuses will end.</p><button class="btn" onclick="finishGardenBonusHarvest()">Finish gathering</button><button class="btn alt" onclick="closeDialog()">Keep picking</button>`,
    "garden-bonus-finish",
  );
}
function finishGardenBonusHarvest() {
  Game.finishBonusHarvest(state);
  state.notice =
    "Harvest activity finished. Your normal crops and produce are unchanged.";
  closeDialog();
}
// Let the new day paint first. A changed scene, dialog, gesture, hidden tab or
// newer day cancels the invitation instead of interrupting a child's activity.
function scheduleGardenWeedingInvitation(previousDay) {
  const farm = state,
    day = Game.farmDay(state),
    scene = view,
    generation = renderGeneration;
  if (scene !== "garden" || day % 5 !== 0 || !Game.weedingAvailable(state))
    return;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (
        state !== farm ||
        view !== scene ||
        Game.farmDay(state) !== day ||
        popup ||
        document.hidden ||
        gardenUI.drag ||
        renderGeneration !== generation
      )
        return;
      if (GardenLearning.claimInvitation(state, previousDay)) {
        save(); // Persist the invitation before showing it; Not Now spends no opportunity.
        openGardenWeeding();
      }
    }),
  );
}
function openGardenWeeding() {
  if (!Game.weedingAvailable(state)) return;
  show(
    `<h2>Time to Weed!</h2><p>Your garden needs a little extra care!</p><p>Find the incorrect answers hiding among the weeds to help your garden grow.</p><p>Complete the challenge to earn 20% more produce on your next harvest!</p><p>Weeding is optional. Your crops will grow normally if you skip it.</p><button class="btn" onclick="startGardenWeeding()">Let's Weed!</button><button class="btn alt" onclick="closeDialog()">Not Now</button>`,
    "garden-weeding-confirm",
  );
}
function startGardenWeeding() {
  act(() => {
    Game.startWeeding(state);
    renderGardenWeeding();
  });
}
function renderGardenWeeding(message = "", transition = false) {
  const a = state.weedingLesson.session;
  if (!a || !Game.weedingAvailable(state)) return closeDialog();
  const items = GardenLearning.questions(a);
  show(
    `<h2>${a.type === "math" ? "Math" : "Spelling"} Weeding</h2><p class="garden-round-label">Round ${a.round + 1} of ${a.roundCount}</p><p class="garden-weed-instruction">Pull the ${a.type === "math" ? "incorrect equations" : "misspelled words"}. Leave the correct ones growing!</p><div class="garden-weed-patch ${transition ? "garden-round-enter" : ""}" role="group" aria-label="Four planted answers">${items.map((q, i) => `<button class="garden-weed ${a.removed.includes(i) ? "weed-removed" : ""}" data-weed-answer="${i}" aria-label="${a.removed.includes(i) ? "Cleared answer" : "Answer"} ${i + 1}: ${q.original}" onclick="pullGardenWeed(${i})" ${a.removed.includes(i) ? "disabled" : ""}><span class="garden-answer-label">${a.removed.includes(i) ? "Cleared!" : q.original}</span>${a.removed.includes(i) ? "" : gardenLeafArt("weed" + i, "growing")}${!a.removed.includes(i) && a.mistakes >= 2 && !q.correct ? `<span class="garden-answer-correction">Correct: ${q.correction}</span>` : ""}</button>`).join("")}</div><p class="garden-weed-feedback" role="status" aria-live="polite">${message || "Tap an answer to pull it, or drag it to the basket."}</p><div class="garden-weed-footer"><div class="garden-weed-basket" data-weed-basket aria-label="Weed basket">${gardenBasketArt()}<span>Weed basket</span></div><button class="btn alt" onclick="closeDialog()">Close ✕</button></div>`,
    "garden-weeding",
  );
}
function pullGardenWeed(i) {
  if (Date.now() < (gardenUI.weedSuppressUntil || 0)) return;
  act(() => {
    const result = Game.pullWeed(state, i);
    if (result.kind === "complete") {
      state.notice = result.message;
      show(
        `<h2>Wonderful weeding!</h2><p>Your planted crops have a 20% bonus for the next harvest activity!</p><p>Pick ripe crops together with Harvest All, or gather the eligible ripe crops individually before End Day. Plants still growing when you begin picking will keep their normal yields.</p><p>Small bonus amounts build up into whole extra produce items of the same crop. New plantings do not receive this bonus.</p><button class="btn" onclick="closeDialog()">Back to the Garden</button>`,
        "garden-weeding-complete",
      );
    } else renderGardenWeeding(result.message, result.kind === "round");
  });
}
// Drag is an alternative to tap, not a mandatory fine-motor exercise. Invalid
// drops and cancellation leave the round unchanged. A released drag cannot also tap.
(function () {
  let drag = null;
  const clear = () => {
    drag?.ghost?.remove();
    drag = null;
    document
      .querySelector("[data-weed-basket]")
      ?.classList.remove("garden-drop-valid");
  };
  document.addEventListener("pointerdown", (e) => {
    const target = e.target.closest("[data-weed-answer]:not(:disabled)");
    if (
      !target ||
      !e.isPrimary ||
      (e.pointerType === "mouse" && e.button !== 0)
    )
      return;
    drag = {
      target,
      pointer: e.pointerId,
      index: +target.dataset.weedAnswer,
      x: e.clientX,
      y: e.clientY,
      moved: false,
    };
    target.setPointerCapture(e.pointerId);
  });
  document.addEventListener(
    "pointermove",
    (e) => {
      if (!drag || e.pointerId !== drag.pointer || !drag.target.isConnected)
        return;
      if (
        !drag.moved &&
        Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 10
      )
        return;
      e.preventDefault();
      if (!drag.moved) {
        drag.moved = true;
        drag.ghost = document.createElement("div");
        drag.ghost.className = "garden-weed-ghost";
        drag.ghost.textContent = drag.target.querySelector(
          ".garden-answer-label",
        ).textContent;
        document.body.append(drag.ghost);
      }
      Object.assign(drag.ghost.style, {
        left: e.clientX + "px",
        top: e.clientY + "px",
      });
      document
        .querySelector("[data-weed-basket]")
        ?.classList.toggle(
          "garden-drop-valid",
          !!document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest("[data-weed-basket]"),
        );
    },
    { passive: false },
  );
  document.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    const { index, moved, target } = drag,
      valid = !!document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-weed-basket]");
    clear();
    if (!moved) return;
    e.preventDefault();
    if (valid && target.isConnected) pullGardenWeed(index);
    gardenUI.weedSuppressUntil = Date.now() + 400;
  });
  document.addEventListener("pointercancel", clear);
  document.addEventListener(
    "click",
    (e) => {
      if (
        Date.now() < (gardenUI.weedSuppressUntil || 0) &&
        e.target.closest("[data-weed-answer]")
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
})();
