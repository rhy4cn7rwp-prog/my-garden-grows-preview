/* One fixed camera, a cylindrical 2D painting and independent reward controls.
   No walking, WebGL, permanent animation loop or farm-state writes while looking. */
const clubhouseRoom = {
  world: null,
  canvas: null,
  image: null,
  ctx: null,
  abort: null,
  frame: 0,
  yaw: 0,
  geometry: null,
  usable: null,
  gesture: null,
  hold: 0,
  animation: null,
  suppressClickUntil: 0,
  lastTime: 0,
  drop: null,
  lastGestureEnded: 0,
  controlTouch: null,
  nativeClickGuard: null,
};
// Some mobile engines discard the first compatibility click just after a pan.
// Activate an explicit short button tap on pointer-up in that brief window;
// swallow only its duplicate native click, never a fresh gesture or keyboard use.
document.addEventListener(
  "pointerdown",
  (e) => {
    const r = clubhouseRoom;
    r.nativeClickGuard = null;
    r.controlTouch = null;
    if (
      !e.isPrimary ||
      e.pointerType !== "touch" ||
      document.body?.dataset.view !== "clubhouse" ||
      Date.now() - r.lastGestureEnded > 500
    )
      return;
    const button = e.target.closest("button");
    if (button && !button.disabled)
      r.controlTouch = {
        button,
        pointer: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
  },
  true,
);
document.addEventListener("pointerup", (e) => {
  const r = clubhouseRoom,
    t = r.controlTouch;
  r.controlTouch = null;
  if (
    !t ||
    t.pointer !== e.pointerId ||
    Date.now() - t.time >= 400 ||
    Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8 ||
    !t.button.isConnected ||
    t.button.disabled
  )
    return;
  e.preventDefault();
  r.nativeClickGuard = { x: e.clientX, y: e.clientY, until: Date.now() + 400 };
  t.button.click();
});
document.addEventListener(
  "pointercancel",
  () => {
    clubhouseRoom.controlTouch = null;
  },
  true,
);
document.addEventListener(
  "click",
  (e) => {
    const r = clubhouseRoom,
      g = r.nativeClickGuard;
    if (
      g &&
      e.isTrusted &&
      e.detail !== 0 &&
      Date.now() < g.until &&
      Math.hypot(e.clientX - g.x, e.clientY - g.y) < 12
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      r.nativeClickGuard = null;
    }
  },
  true,
);
function roomAnnounce(message) {
  const status = document.querySelector(".clubhouse-status");
  if (status) status.textContent = message;
}
function requestClubhousePaint() {
  if (!clubhouseRoom.frame && clubhouseRoom.world)
    clubhouseRoom.frame = requestAnimationFrame(paintClubhouse);
}
function roomItemSize(id, g, usable) {
  const available = usable.bottom - usable.top;
  let width = ClubhouseLayout.clamp(
      Math.min(g.width * 0.18, available * 0.36),
      50,
      76,
    ),
    height = width * 0.85;
  if (id === "ball") {
    width = ClubhouseLayout.clamp(
      Math.min(g.width * 0.17, available * 0.35),
      48,
      82,
    );
    height = width;
  }
  if (id === "bike") {
    width = ClubhouseLayout.clamp(
      Math.min(g.width * 0.4, available * 0.9),
      86,
      190,
    );
    height = width * 0.78;
  }
  if (id === "guitar") {
    height = ClubhouseLayout.clamp(available * 0.5, 70, 150);
    width = height * 0.56;
  }
  if (id === "puppy") height = width * 0.97;
  const scale = Math.min(1, (available - 4) / height);
  return {
    width: Math.max(44, width * scale),
    height: Math.max(44, height * scale),
  };
}
function roomItemPoint(id, p) {
  const r = clubhouseRoom,
    size = roomItemSize(id, r.geometry, r.usable),
    projected = ClubhouseLayout.project(p, r.yaw, r.geometry);
  return {
    ...size,
    x: ClubhouseLayout.clamp(
      projected.x,
      r.usable.left + size.width / 2,
      r.usable.right - size.width / 2,
    ),
    y: ClubhouseLayout.clamp(
      projected.y,
      r.usable.top + size.height / 2,
      r.usable.bottom - size.height / 2,
    ),
    visible:
      projected.visible && projected.x >= 0 && projected.x <= r.geometry.width,
  };
}
function paintClubhouse(now) {
  const r = clubhouseRoom;
  r.frame = 0;
  if (!r.world?.isConnected) return;
  const dt = Math.min(40, r.lastTime ? now - r.lastTime : 16);
  r.lastTime = now;
  if (r.animation) {
    const t = Math.min(1, (now - r.animation.start) / 180),
      eased = 1 - Math.pow(1 - t, 3);
    r.yaw = r.animation.from + (r.animation.to - r.animation.from) * eased;
    if (t === 1) r.animation = null;
  }
  const gesture = r.gesture;
  if (gesture?.mode === "drag") {
    const rect = r.world.getBoundingClientRect(),
      x = gesture.x - rect.left;
    const edge = x < 34 ? -1 : x > rect.width - 34 ? 1 : 0;
    if (edge) {
      r.yaw = ClubhouseLayout.clamp(r.yaw + edge * dt * 0.025, -80, 80);
      updateRoomDrag();
    }
  }
  const g = r.geometry,
    ctx = r.ctx,
    img = r.image;
  if (img.complete && img.naturalWidth) {
    // Inverse ray mapping: each column samples a different viewing angle.
    // Vertical correction shares the same cylindrical projection as the items.
    for (let x = 0; x < g.width; x += 4) {
      const dw = Math.min(4, g.width - x),
        a = Math.atan((x - g.width / 2) / g.focal),
        b = Math.atan((x + dw - g.width / 2) / g.focal);
      const middle = (a + b) / 2,
        cos = Math.cos(middle),
        sx = ((r.yaw + (a * 180) / Math.PI + 120) / 240) * img.naturalWidth;
      const sw = ((b - a) / ((Math.PI * 240) / 180)) * img.naturalWidth;
      const sy =
        (0.5 - (g.horizon * cos) / g.paintedHeight) * img.naturalHeight;
      const sh = ((g.height * cos) / g.paintedHeight) * img.naturalHeight;
      ctx.drawImage(
        img,
        sx,
        Math.max(0, sy),
        sw + 0.3,
        Math.min(img.naturalHeight - Math.max(0, sy), sh),
        x - 0.15,
        0,
        dw + 0.3,
        g.height,
      );
    }
    r.world.dataset.painted = "true";
  }
  for (const button of r.world.querySelectorAll("[data-dream]")) {
    const id = button.dataset.dream,
      p = ClubhouseLayout.effective(state.clubhousePositions, id),
      point = roomItemPoint(id, p);
    if (gesture?.mode === "drag" && gesture.id === id) continue;
    button.hidden = !point.visible;
    button.style.left = point.x + "px";
    button.style.top = point.y + "px";
    button.style.width = point.width + "px";
    button.style.height = point.height + "px";
    button.dataset.surface = p.surface;
  }
  r.world.dataset.yaw = r.yaw.toFixed(2);
  const direction = document.querySelector(".clubhouse-direction");
  if (direction)
    direction.textContent =
      Math.abs(r.yaw) < 1
        ? "Looking straight ahead"
        : `${Math.round(Math.abs(r.yaw))}° ${r.yaw < 0 ? "left" : "right"}`;
  const left = document.querySelector('[aria-label="Look left"]'),
    right = document.querySelector('[aria-label="Look right"]');
  if (left) left.disabled = r.yaw <= -80;
  if (right) right.disabled = r.yaw >= 80;
  drawRoomSurfaces();
  r.world.dataset.layoutReady = "true";
  if (
    r.animation ||
    (gesture?.mode === "drag" &&
      (gesture.x - r.world.getBoundingClientRect().left < 34 ||
        gesture.x - r.world.getBoundingClientRect().left > g.width - 34))
  )
    requestClubhousePaint();
}
function measureClubhouse() {
  const r = clubhouseRoom,
    rect = r.world.getBoundingClientRect();
  r.geometry = ClubhouseLayout.geometry(rect.width, rect.height);
  const header = document
      .querySelector(".clubhouse-heading")
      .getBoundingClientRect(),
    footer = document
      .querySelector(".clubhouse-bottom")
      .getBoundingClientRect();
  const hud = getComputedStyle(document.querySelector(".clubhouse-game .hud")),
    left = parseFloat(hud.paddingLeft) || 0,
    right = parseFloat(hud.paddingRight) || 0;
  r.usable = {
    top: header.bottom - rect.top + 7,
    bottom: footer.top - rect.top - 7,
    left: Math.max(8, left),
    right: rect.width - Math.max(8, right),
  };
  const ratio = Math.min(devicePixelRatio || 1, 1.5),
    w = Math.round(rect.width * ratio),
    h = Math.round(rect.height * ratio);
  if (r.canvas.width !== w || r.canvas.height !== h) {
    r.canvas.width = w;
    r.canvas.height = h;
  }
  // Fractional CSS widths must fill the rounded backing store completely.
  r.ctx.setTransform(w / rect.width, 0, 0, h / rect.height, 0, 0);
}
function stopClubhouseGesture() {
  const r = clubhouseRoom;
  clearTimeout(r.hold);
  r.hold = 0;
  if (r.gesture?.mode === "drag")
    r.world?.querySelector("[data-moving]")?.removeAttribute("data-moving");
  const pointer = r.gesture?.pointer,
    captured = r.gesture?.id
      ? r.world?.querySelector(`[data-dream="${r.gesture.id}"]`)
      : r.world;
  r.gesture = null;
  r.drop = null;
  if (pointer !== undefined && captured?.hasPointerCapture(pointer))
    captured.releasePointerCapture(pointer);
  requestClubhousePaint();
}
function destroyInteractiveClubhouse() {
  const r = clubhouseRoom;
  stopClubhouseGesture();
  r.abort?.abort();
  if (r.frame) cancelAnimationFrame(r.frame);
  r.frame = 0;
  r.world = null;
  r.animation = null;
  r.lastTime = 0;
  if (r.canvas) {
    r.canvas.width = 0;
    r.canvas.height = 0;
  }
  r.canvas = null;
  r.ctx = null;
  r.image = null;
  r.abort = null;
}
function syncInteractiveClubhouse() {
  const world = document.querySelector(".clubhouse-world");
  if (!world) {
    if (clubhouseRoom.world) destroyInteractiveClubhouse();
    return;
  }
  if (typeof ClubhouseLayout === "undefined") {
    roomAnnounce("Room controls could not load. Please refresh to try again.");
    return;
  }
  const r = clubhouseRoom;
  if (r.world !== world) {
    destroyInteractiveClubhouse();
    r.world = world;
    r.abort = new AbortController();
    r.canvas = world.querySelector("canvas");
    r.ctx = r.canvas.getContext("2d", { alpha: false });
    r.image = world.querySelector("img");
    const options = { signal: r.abort.signal };
    r.image.addEventListener("load", requestClubhousePaint, options);
    r.image.addEventListener(
      "error",
      () =>
        roomAnnounce(
          "The room artwork could not load. Return to the village and try again.",
        ),
      options,
    );
    world.addEventListener("pointerdown", startRoomGesture, options);
    world.addEventListener("pointermove", moveRoomGesture, options);
    world.addEventListener("pointerup", finishRoomGesture, options);
    world.addEventListener(
      "pointercancel",
      () => {
        r.suppressClickUntil = Date.now() + 500;
        r.lastGestureEnded = Date.now();
        stopClubhouseGesture();
      },
      options,
    );
    world.addEventListener(
      "lostpointercapture",
      () => {
        if (r.gesture) stopClubhouseGesture();
      },
      options,
    );
    world.addEventListener("contextmenu", (e) => e.preventDefault(), options);
    world.addEventListener(
      "click",
      (e) => {
        if (Date.now() < r.suppressClickUntil && e.detail !== 0) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      { ...options, capture: true },
    );
    world.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          turnClubhouse(e.key === "ArrowLeft" ? -15 : 15);
        }
      },
      options,
    );
  }
  // Rotation/toolbar changes cancel a half-finished gesture without saving it.
  if (r.gesture) stopClubhouseGesture();
  measureClubhouse();
  requestClubhousePaint();
}
function lookClubhouse(angle) {
  const r = clubhouseRoom;
  if (!r.world) return;
  stopClubhouseGesture();
  const target = ClubhouseLayout.clamp(angle, -80, 80);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    r.yaw = target;
    r.animation = null;
  } else r.animation = { from: r.yaw, to: target, start: performance.now() };
  requestClubhousePaint();
}
function turnClubhouse(amount) {
  lookClubhouse((clubhouseRoom.animation?.to ?? clubhouseRoom.yaw) + amount);
}
function startRoomGesture(e) {
  const r = clubhouseRoom;
  if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) {
    stopClubhouseGesture();
    return;
  }
  if (r.gesture) return;
  r.suppressClickUntil = 0;
  r.animation = null;
  const item = e.target.closest("[data-dream]");
  r.gesture = {
    pointer: e.pointerId,
    id: item?.dataset.dream,
    mode: item ? "pending" : "pan",
    startX: e.clientX,
    startY: e.clientY,
    x: e.clientX,
    y: e.clientY,
    yaw: r.yaw,
    moved: false,
  };
  (item || r.world).setPointerCapture(e.pointerId);
  if (item && Game.ownsDream(state, item.dataset.dream))
    r.hold = setTimeout(() => {
      if (!r.gesture || r.gesture.mode !== "pending") return;
      r.gesture.mode = "drag";
      item.dataset.moving = "true";
      roomAnnounce(
        `Moving ${Game.dreams.find((d) => d.id === item.dataset.dream).name}. Drag to a glowing floor or display surface.`,
      );
      requestClubhousePaint();
    }, 420);
}
function moveRoomGesture(e) {
  const r = clubhouseRoom,
    g = r.gesture;
  if (!g || e.pointerId !== g.pointer) return;
  const distance = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);
  g.x = e.clientX;
  g.y = e.clientY;
  if (distance > 8) {
    g.moved = true;
    if (g.mode === "pending") {
      clearTimeout(r.hold);
      g.mode = "pan";
    }
  }
  if (g.mode === "pan" && g.moved) {
    r.yaw = ClubhouseLayout.clamp(
      g.yaw - (((e.clientX - g.startX) / r.geometry.focal) * 180) / Math.PI,
      -80,
      80,
    );
    requestClubhousePaint();
  } else if (g.mode === "drag") {
    updateRoomDrag();
    requestClubhousePaint();
  }
}
function updateRoomDrag() {
  const r = clubhouseRoom,
    g = r.gesture;
  if (g?.mode !== "drag") return;
  const rect = r.world.getBoundingClientRect(),
    point = { x: g.x - rect.left, y: g.y - rect.top },
    button = r.world.querySelector(`[data-dream="${g.id}"]`),
    size = roomItemSize(g.id, r.geometry, r.usable);
  button.hidden = false;
  button.style.left =
    ClubhouseLayout.clamp(
      point.x,
      r.usable.left + size.width / 2,
      r.usable.right - size.width / 2,
    ) + "px";
  button.style.top =
    ClubhouseLayout.clamp(
      point.y,
      r.usable.top + size.height / 2,
      r.usable.bottom - size.height / 2,
    ) + "px";
  const raw = ClubhouseLayout.unproject(point.x, point.y, r.yaw, r.geometry);
  // Resolve against the same safe-area-adjusted surfaces that the child sees.
  // In short Safari viewports the floor can sit above the fixed footer.
  const candidates = ClubhouseLayout.surfaces
    .filter(
      (s) => s.items.includes(g.id) && raw.angle >= s.min && raw.angle <= s.max,
    )
    .map((s) => {
      const anchor = roomItemPoint(g.id, { angle: raw.angle, y: s.y });
      return {
        surface: s,
        distance: Math.abs(point.y - anchor.y),
        offset: point.y - anchor.y,
      };
    })
    .sort((a, b) => a.distance - b.distance);
  const choice = candidates[0];
  r.drop =
    point.y >= r.usable.top &&
    point.y <= r.usable.bottom &&
    point.x >= r.usable.left &&
    point.x <= r.usable.right &&
    choice?.distance <
      Math.max(28, Math.min(45, (r.usable.bottom - r.usable.top) * 0.12))
      ? {
          surface: choice.surface.id,
          angle: Math.round(raw.angle * 100) / 100,
          y:
            choice.surface.id === "floor"
              ? Math.round(
                  ClubhouseLayout.clamp(
                    0.83 + choice.offset / r.geometry.paintedHeight,
                    0.77,
                    0.9,
                  ) * 1000,
                ) / 1000
              : choice.surface.y,
        }
      : null;
  if (
    r.drop &&
    ClubhouseLayout.blockers(
      g.id,
      r.drop,
      state.clubhousePositions,
      state.dreamPurchases,
    ).length
  )
    r.drop = null;
  button.dataset.validDrop = r.drop ? "true" : "false";
}
function finishRoomGesture(e) {
  const r = clubhouseRoom,
    g = r.gesture;
  if (!g || e.pointerId !== g.pointer) return;
  clearTimeout(r.hold);
  if (g.mode === "drag") {
    r.lastGestureEnded = Date.now();
    r.suppressClickUntil = Date.now() + 500;
    r.nativeClickGuard = {
      x: e.clientX,
      y: e.clientY,
      until: Date.now() + 400,
    };
    if (g.moved && r.drop) {
      try {
        Game.moveClubhouseItem(state, g.id, r.drop);
        save();
        roomAnnounce("A lovely new spot! Your treasure position is saved.");
      } catch (error) {
        roomAnnounce(error.message);
      }
    } else if (g.moved)
      roomAnnounce(
        "Try a glowing floor or display surface with a little more space. Your treasure returned to its last spot.",
      );
  } else if (g.mode === "pan" && g.moved) {
    r.suppressClickUntil = Date.now() + 500;
    r.lastGestureEnded = Date.now();
    r.nativeClickGuard = {
      x: e.clientX,
      y: e.clientY,
      until: Date.now() + 400,
    };
  }
  stopClubhouseGesture();
}
function drawRoomSurfaces() {
  const r = clubhouseRoom,
    svg = r.world.querySelector(".clubhouse-drop-surfaces"),
    id = r.gesture?.mode === "drag" ? r.gesture.id : null;
  if (!id) {
    svg.innerHTML = "";
    return;
  }
  svg.setAttribute("viewBox", `0 0 ${r.geometry.width} ${r.geometry.height}`);
  svg.innerHTML = ClubhouseLayout.surfaces
    .filter((s) => s.items.includes(id))
    .map((s) => {
      const half =
          (Math.atan(r.geometry.width / 2 / r.geometry.focal) * 180) / Math.PI,
        min = Math.max(s.min, r.yaw - half),
        max = Math.min(s.max, r.yaw + half);
      if (min > max) return "";
      const corners = [
        { angle: min, offset: -14 },
        { angle: max, offset: -14 },
        { angle: max, offset: 14 },
        { angle: min, offset: 14 },
      ].map((p) => {
        const projected = ClubhouseLayout.project(
          { angle: p.angle, y: s.y },
          r.yaw,
          r.geometry,
        );
        const anchor = roomItemPoint(id, {
          angle: ClubhouseLayout.clamp(p.angle, r.yaw - 20, r.yaw + 20),
          y: s.y,
        });
        return { ...projected, y: anchor.y + p.offset };
      });
      if (
        corners.some((p) => !Number.isFinite(p.x)) ||
        corners.every((p) => !p.visible)
      )
        return "";
      const points = corners
        .map(
          (p) =>
            `${ClubhouseLayout.clamp(p.x, 0, r.geometry.width)},${ClubhouseLayout.clamp(p.y, r.usable.top, r.usable.bottom)}`,
        )
        .join(" ");
      return `<polygon points="${points}"/>`;
    })
    .join("");
}
function clubhouseTreasures() {
  const owned = Game.dreams.filter((d) => Game.ownsDream(state, d.id));
  show(
    `<h2>My treasures</h2><p>${owned.length ? "Find a treasure anywhere in your room. Tap it to see its story or restore its usual spot." : "Your room is ready for the dreams you earn and buy."}</p>${owned.map((d) => `<button class="btn find-treasure" onclick="findClubhouseItem('${d.id}')">Find ${d.name}</button>`).join("")}${owned.length ? '<button class="btn alt" onclick="restoreClubhouseRoom()">Restore all item positions</button>' : ""}`,
  );
}
function findClubhouseItem(id) {
  if (!Game.ownsDream(state, id)) return;
  const p = ClubhouseLayout.effective(state.clubhousePositions, id);
  closeDialog();
  lookClubhouse(p.angle);
}
function restoreClubhouseItem(id) {
  act(() => {
    const reset = Game.resetClubhouseItem(state, id);
    save();
    closeDialog();
    lookClubhouse(ClubhouseLayout.defaults[id].angle);
    roomAnnounce(
      reset.length > 1
        ? "Your treasure and any treasure in its usual spot returned home."
        : "Your treasure returned to its usual spot.",
    );
  });
}
function restoreClubhouseRoom() {
  Game.resetClubhouseLayout(state);
  save();
  closeDialog();
  lookClubhouse(0);
  roomAnnounce(
    "All treasures returned to their usual spots. Your farm and purchases are unchanged.",
  );
}
