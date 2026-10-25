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
function roomItemSize(
  id,
  g,
  usable,
  p = ClubhouseLayout.effective(state.clubhousePositions, id),
) {
  p = { surface: ClubhouseLayout.defaults[id].surface, ...p };
  const m = ClubhouseLayout.metrics(id, p),
    scale =
      g.paintedHeight /
      724 /
      Math.max(0.4, Math.cos(((p.angle - clubhouseRoom.yaw) * Math.PI) / 180));
  return {
    visualWidth: m.width * scale,
    visualHeight: m.height * scale,
    occlusion: m.occlusion * scale,
    tail: m.tail * scale,
  };
}
function roomItemPoint(id, p) {
  const r = clubhouseRoom,
    size = roomItemSize(id, r.geometry, r.usable, p),
    projected = ClubhouseLayout.project(p, r.yaw, r.geometry);
  const left = projected.x - size.visualWidth / 2,
    top = projected.y - size.visualHeight + size.tail,
    visibleBottom =
      projected.y + (size.occlusion ? -size.occlusion : size.tail),
    clippedLeft = Math.max(left, r.usable.left),
    clippedRight = Math.min(left + size.visualWidth, r.usable.right),
    clippedTop = Math.max(top, r.usable.top),
    clippedBottom = Math.min(visibleBottom, r.usable.bottom),
    overlapX = clippedRight - clippedLeft,
    overlapY = clippedBottom - clippedTop,
    width = Math.min(r.usable.right-r.usable.left, Math.max(44,overlapX)),
    height = Math.min(r.usable.bottom-r.usable.top, Math.max(44,overlapY));
  // Keep the target over the visible artwork. Moving a full oversized hit box
  // inward would make an off-screen bicycle intercept neighboring treasures.
  const x = ClubhouseLayout.clamp((clippedLeft+clippedRight)/2,
      r.usable.left+width/2,r.usable.right-width/2),
    y = ClubhouseLayout.clamp((clippedTop+clippedBottom)/2,
      r.usable.top+height/2,r.usable.bottom-height/2);
  return {
    ...size,
    width,
    height,
    x,
    y,
    footX: projected.x,
    footY: projected.y,
    visualLeft: left,
    visualTop: top,
    offsetX: left - (x - width / 2),
    offsetY: top - (y - height / 2),
    visible:
      overlapX >= Math.min(14, size.visualWidth * 0.4) &&
      overlapY >= Math.min(14, (size.visualHeight - size.occlusion) * 0.4),
  };
}
function applyRoomItem(button, point) {
  button.hidden = !point.visible;
  Object.assign(button.style, {
    left: point.x + "px",
    top: point.y + "px",
    width: point.width + "px",
    height: point.height + "px",
  });
  const visual = button.querySelector(".clubhouse-visual");
  Object.assign(visual.style, {
    left: point.offsetX + "px",
    top: point.offsetY + "px",
    width: point.visualWidth + "px",
    height: point.visualHeight + "px",
  });
  visual.style.setProperty("--tail-offset", point.tail + "px");
}
function frameClubhouseTreasure(id, yaw = clubhouseRoom.yaw) {
  const r = clubhouseRoom;
  if (!r.geometry) return;
  r.focusId = id;
  const p = id
    ? ClubhouseLayout.effective(state.clubhousePositions, id)
    : { surface: "floor", angle: yaw, y: 0.84 };
  r.geometry.horizon = r.baseHorizon;
  // Finding a treasure may tilt the whole view, never change the lens.
  const projected = ClubhouseLayout.project(p, yaw, r.geometry),
    m = ClubhouseLayout.metrics(id || "ball", p),
    scale =
      r.geometry.paintedHeight /
      724 /
      Math.cos(((p.angle - yaw) * Math.PI) / 180),
    height = m.height * scale,
    occlusion = m.occlusion * scale;
  const min = r.usable.top + height + 8,
    max = r.usable.bottom + occlusion - 8;
  const wanted = min > max ? max : ClubhouseLayout.clamp(projected.y, min, max);
  r.geometry.horizon += wanted - projected.y;
  constrainRoomPitch();
}
function constrainRoomPitch() {
  const r = clubhouseRoom;
  r.geometry.horizon = ClubhouseLayout.clamp(
    r.geometry.horizon,
    r.usable.bottom - r.geometry.paintedHeight / 2,
    r.usable.top + r.geometry.paintedHeight / 2,
  );
}
function tiltClubhouse(amount) {
  const r = clubhouseRoom;
  if (!r.geometry) return;
  r.geometry.horizon += amount;
  constrainRoomPitch();
  r.manualPitch =
    (r.geometry.horizon - r.baseHorizon) / r.geometry.paintedHeight;
  requestClubhousePaint();
}
function roomProjectedPolygon(points) {
  const r = clubhouseRoom,
    result = [],
    half = (Math.atan(r.geometry.width / 2 / r.geometry.focal) * 180) / Math.PI;
  // Clip in painting space BEFORE projection. Vertices behind the head must
  // never create a giant highlight or occlusion across the opposite wall.
  for (const [bound, keepLeft] of [
    [ClubhouseLayout.pixelAt(r.yaw - half), false],
    [ClubhouseLayout.pixelAt(r.yaw + half), true],
  ]) {
    const clipped = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[(i + points.length - 1) % points.length],
        b = points[i],
        ai = keepLeft ? a[0] <= bound : a[0] >= bound,
        bi = keepLeft ? b[0] <= bound : b[0] >= bound;
      if (ai !== bi)
        clipped.push([
          bound,
          a[1] + ((b[1] - a[1]) * (bound - a[0])) / (b[0] - a[0]),
        ]);
      if (bi) clipped.push(b);
    }
    points = clipped;
  }

  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    for (let j = 0; j < 8; j++)
      result.push(
        ClubhouseLayout.project(
          {
            angle: ClubhouseLayout.angleAt(a[0] + ((b[0] - a[0]) * j) / 8),
            y: (a[1] + ((b[1] - a[1]) * j) / 8) / 724,
          },
          r.yaw,
          r.geometry,
        ),
      );
  }
  return result;
}
// Static room-space composition: ownership/layout changes rebuild this small
// texture; camera turns only sample it. Furniture and treasures therefore use
// exactly the same rays, perspective and occlusion, including every sprite edge.
function compositeClubhouseRoom() {
  const r = clubhouseRoom;
  if (!r.rewardImage?.complete || !r.rewardImage.naturalWidth) return null;
  const owned = Game.dreams.filter((d) => Game.ownsDream(state, d.id));
  const key = JSON.stringify(
    owned.map((d) => [
      d.id,
      ClubhouseLayout.effective(state.clubhousePositions, d.id),
      r.gesture?.mode === "drag" && r.gesture.id === d.id,
    ]),
  );
  if (r.sceneKey === key && r.scene) return r.scene;
  r.scene ||= document.createElement("canvas");
  r.scene.width = r.image.naturalWidth;
  r.scene.height = r.image.naturalHeight;
  const ctx = r.scene.getContext("2d");
  ctx.drawImage(r.image, 0, 0);
  const draw = (d) => {
    if (r.gesture?.mode === "drag" && r.gesture.id === d.id) return;
    const p = ClubhouseLayout.effective(state.clubhousePositions, d.id),
      m = ClubhouseLayout.metrics(d.id, p),
      x = ClubhouseLayout.pixelAt(p.angle),
      y = p.y * 724,
      [sx, sy, sw, sh] = CLUBHOUSE_DISPLAYS[d.id].bounds.split(" ").map(Number);
    ctx.save();
    ctx.fillStyle = m.shadow.color;
    ctx.beginPath();
    ctx.ellipse(x, y, m.shadow.rx, m.shadow.ry, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.drawImage(
      r.rewardImage,
      sx,
      sy,
      sw,
      sh,
      x - m.width / 2,
      y - m.height + m.tail,
      m.width,
      m.height,
    );
    ctx.restore();
  };
  owned
    .filter(
      (d) =>
        ClubhouseLayout.effective(state.clubhousePositions, d.id).surface ===
        "chest",
    )
    .forEach(draw);
  // Restore the original painted chest front OVER its contents, in room space.
  for (const polygon of ClubhouseLayout.occluders) {
    ctx.save();
    ctx.beginPath();
    polygon.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(r.image, 0, 0);
    ctx.restore();
  }
  owned
    .filter(
      (d) =>
        ClubhouseLayout.effective(state.clubhousePositions, d.id).surface !==
        "chest",
    )
    .sort(
      (a, b) =>
        ClubhouseLayout.effective(state.clubhousePositions, a.id).y -
        ClubhouseLayout.effective(state.clubhousePositions, b.id).y,
    )
    .forEach(draw);
  r.sceneKey = key;
  return r.scene;
}
function centerClubhouse() {
  const r = clubhouseRoom;
  if (!r.geometry) return;
  r.manualPitch = null;
  r.focusId = null;
  r.geometry.horizon = r.baseHorizon;
  constrainRoomPitch();
  lookClubhouse(0);
}
function paintRoomTexture(ctx, img, g) {
  const r = clubhouseRoom,
    sourceWidth = img.naturalWidth || img.width,
    sourceHeight = img.naturalHeight || img.height;
  // Align strip boundaries to backing pixels. Fractional overlapping strips
  // otherwise blend with the PREVIOUS camera frame and leave moving seams.
  const ratio = ctx.canvas.width / g.width;
  ctx.clearRect(0, 0, g.width, g.height);
  for (let column = 0; column < ctx.canvas.width; column += 4) {
    const x = column / ratio,
      dw = Math.min(4, ctx.canvas.width - column) / ratio,
      a = Math.atan((x - g.width / 2) / g.focal),
      b = Math.atan((x + dw - g.width / 2) / g.focal),
      cos = Math.cos((a + b) / 2),
      sx = ((r.yaw + (a * 180) / Math.PI + 120) / 240) * sourceWidth,
      sw = ((b - a) / ((Math.PI * 240) / 180)) * sourceWidth,
      sy = (0.5 - (g.horizon * cos) / g.paintedHeight) * sourceHeight,
      sh = ((g.height * cos) / g.paintedHeight) * sourceHeight;
    // Camera framing moves the entire room, never the treasures alone. Extend
    // only the ceiling/floor edge behind fixed UI when the source is exceeded.
    if (sy < 0)
      ctx.drawImage(
        img,
        sx,
        0,
        sw,
        1,
        x,
        0,
        dw,
        Math.min(g.height, (-sy / sh) * g.height),
      );
    if (sy + sh > sourceHeight) {
      const start = ((sourceHeight - sy) / sh) * g.height;
      ctx.drawImage(
        img,
        sx,
        sourceHeight - 1,
        sw,
        1,
        x,
        Math.max(0, start),
        dw,
        g.height - Math.max(0, start),
      );
    }
    const from = Math.max(0, sy),
      to = Math.min(sourceHeight, sy + sh),
      dy = ((from - sy) / sh) * g.height,
      dh = ((to - from) / sh) * g.height;
    if (to > from) ctx.drawImage(img, sx, from, sw, to - from, x, dy, dw, dh);
  }
}
function paintRoomOcclusion() {
  const r = clubhouseRoom,
    ctx = r.occCtx,
    g = r.geometry;
  ctx.clearRect(0, 0, g.width, g.height);
  if (!r.image.complete || !r.image.naturalWidth) return;
  for (const polygon of ClubhouseLayout.occluders) {
    const points = roomProjectedPolygon(polygon);
    if (points.every((p) => p.x < 0) || points.every((p) => p.x > g.width))
      continue;
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.clip();
    paintRoomTexture(ctx, r.image, g);
    ctx.restore();
  }
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
      x = gesture.x - rect.left,
      y = gesture.y - rect.top;
    const edgeX = gesture.moved
        ? x < 34
          ? -1
          : x > rect.width - 34
            ? 1
            : 0
        : 0,
      edgeY =
        gesture.moved && y >= r.usable.top && y <= r.usable.bottom
          ? y < r.usable.top + 20
            ? 1
            : y > r.usable.bottom - 20
              ? -1
              : 0
          : 0;
    const direction = edgeX || edgeY ? `${edgeX},${edgeY}` : null;
    if (direction !== gesture.edgeDirection) {
      gesture.edgeDirection = direction;
      gesture.edgeStart = now;
    }
    // Holding still never starts a camera turn. A short edge dwell distinguishes
    // carrying into another view from simply dropping near the phone edge.
    if (direction && now - gesture.edgeStart >= 180) {
      if (edgeY) tiltClubhouse(edgeY * dt * 0.12);
      if (edgeX)
        r.yaw = ClubhouseLayout.clamp(r.yaw + edgeX * dt * 0.025, -80, 80);
      updateRoomDrag();
    }
  }
  const g = r.geometry,
    ctx = r.ctx,
    img = r.image;
  if (img.complete && img.naturalWidth) {
    const scene = compositeClubhouseRoom();
    paintRoomTexture(ctx, scene || img, g);
    r.world.dataset.composited = scene ? "true" : "false";
    r.world.dataset.painted = "true";
  }
  for (const button of r.world.querySelectorAll("[data-dream]")) {
    const id = button.dataset.dream,
      p = ClubhouseLayout.effective(state.clubhousePositions, id),
      point = roomItemPoint(id, p);
    if (gesture?.mode === "drag" && gesture.id === id) continue;
    const pane = r.world.querySelector(
      p.surface === "chest"
        ? ".clubhouse-chest-displays"
        : ".clubhouse-displays",
    );
    if (button.parentElement !== pane) pane.append(button);
    applyRoomItem(button, point);
    button.style.zIndex = Math.round(p.y * 724);
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
  paintRoomOcclusion();
  drawRoomSurfaces();
  r.world.dataset.layoutReady = "true";
  if (
    r.animation ||
    (gesture?.mode === "drag" && gesture.moved && gesture.edgeDirection)
  )
    requestClubhousePaint();
}
function measureClubhouse() {
  const r = clubhouseRoom,
    rect = r.world.getBoundingClientRect(),
    previousPitch = r.geometry
      ? (r.geometry.horizon - r.baseHorizon) / r.geometry.paintedHeight
      : null;
  r.geometry = ClubhouseLayout.geometry(rect.width, rect.height);
  r.baseHorizon = r.geometry.horizon;
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
  if (r.occCanvas.width !== w || r.occCanvas.height !== h) {
    r.occCanvas.width = w;
    r.occCanvas.height = h;
  }
  r.occCtx.setTransform(w / rect.width, 0, 0, h / rect.height, 0, 0);
  if (previousPitch === null) {
    frameClubhouseTreasure(
      Game.ownsDream(state, "ball") ? "ball" : null,
      r.yaw,
    );
  } else {
    // Safari toolbar/viewport changes retain the same viewing direction and
    // normalized tilt. They never reframe a previously selected treasure.
    r.geometry.horizon =
      r.baseHorizon + previousPitch * r.geometry.paintedHeight;
    constrainRoomPitch();
  }
  for (const pane of r.world.querySelectorAll(
    ".clubhouse-displays,.clubhouse-chest-displays",
  ))
    pane.style.clipPath = `inset(${r.usable.top}px ${rect.width - r.usable.right}px ${rect.height - r.usable.bottom}px ${r.usable.left}px)`;
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
  r.ghost?.remove();
  r.ghost = null;
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
  if (r.occCanvas) {
    r.occCanvas.width = 0;
    r.occCanvas.height = 0;
  }
  r.occCanvas = null;
  r.occCtx = null;
  r.canvas = null;
  r.ctx = null;
  r.geometry = null;
  r.manualPitch = null;
  r.image = null;
  r.rewardImage = null;
  r.scene = null;
  r.sceneKey = null;
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
    r.canvas = world.querySelector(".clubhouse-panorama");
    r.occCanvas = world.querySelector(".clubhouse-occlusion");
    r.occCtx = r.occCanvas.getContext("2d");
    r.ctx = r.canvas.getContext("2d", { alpha: false });
    r.image = world.querySelector("img");
    r.rewardImage = new Image();
    r.rewardImage.src = "assets/clubhouse/rewards.webp";
    r.rewardImage.addEventListener("load", requestClubhousePaint, {
      signal: r.abort.signal,
    });
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
    horizon: r.geometry.horizon,
    moved: false,
  };
  (item || r.world).setPointerCapture(e.pointerId);
  if (item && Game.ownsDream(state, item.dataset.dream))
    r.hold = setTimeout(() => {
      if (!r.gesture || r.gesture.mode !== "pending") return;
      r.gesture.mode = "drag";
      item.dataset.moving = "true";
      const point = roomItemPoint(
          item.dataset.dream,
          ClubhouseLayout.effective(
            state.clubhousePositions,
            item.dataset.dream,
          ),
        ),
        rect = r.world.getBoundingClientRect();
      r.gesture.grabDX = point.footX - (r.gesture.x - rect.left);
      r.gesture.grabDY = point.footY - (r.gesture.y - rect.top);
      r.ghost = item.querySelector(".clubhouse-visual").cloneNode(true);
      r.ghost.classList.add("clubhouse-drag-ghost");
      r.world.append(r.ghost);
      updateRoomDrag();
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
    r.geometry.horizon = g.horizon + (e.clientY - g.startY);
    constrainRoomPitch();
    r.manualPitch =
      (r.geometry.horizon - r.baseHorizon) / r.geometry.paintedHeight;
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
    position = ClubhouseLayout.effective(state.clubhousePositions, g.id),
    size = roomItemSize(g.id, r.geometry, r.usable, position);
  const foot = { x: point.x + (g.grabDX || 0), y: point.y + (g.grabDY || 0) },
    raw = ClubhouseLayout.unproject(foot.x, foot.y, r.yaw, r.geometry);
  const tolerance = Math.min(
    0.065,
    30 /
      (r.geometry.paintedHeight /
        Math.cos(((raw.angle - r.yaw) * Math.PI) / 180)),
  );
  r.drop =
    point.y >= r.usable.top &&
    point.y <= r.usable.bottom &&
    point.x >= r.usable.left &&
    point.x <= r.usable.right
      ? ClubhouseLayout.drop(g.id, raw.angle, raw.y, tolerance)
      : null;
  const candidate = r.drop || position,
    visualSize = roomItemSize(g.id, r.geometry, r.usable, candidate);
  const left = ClubhouseLayout.clamp(
      foot.x - visualSize.visualWidth / 2,
      r.usable.left,
      r.usable.right - visualSize.visualWidth,
    ),
    top = ClubhouseLayout.clamp(
      foot.y - visualSize.visualHeight + visualSize.tail,
      r.usable.top,
      r.usable.bottom - visualSize.visualHeight,
    );
  Object.assign(r.ghost.style, {
    left: left + "px",
    top: top + "px",
    width: visualSize.visualWidth + "px",
    height: visualSize.visualHeight + "px",
  });
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
  r.ghost.dataset.validDrop = button.dataset.validDrop;
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
  svg.style.clipPath = `inset(${r.usable.top}px ${r.geometry.width - r.usable.right}px ${r.geometry.height - r.usable.bottom}px ${r.usable.left}px)`;
  svg.innerHTML = ClubhouseLayout.surfaces
    .filter((s) => s.items.includes(id))
    .map((surface) => {
      const points = roomProjectedPolygon(ClubhouseLayout.outline(surface));
      if (
        points.every((p) => p.x < 0) ||
        points.every((p) => p.x > r.geometry.width)
      )
        return "";
      return `<polygon data-surface="${surface.id}" data-active="${r.drop?.surface === surface.id}" points="${points.map((p) => `${p.x},${p.y}`).join(" ")}"/>`;
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
  clubhouseRoom.manualPitch = null;
  clubhouseRoom.focusId = id;
  closeDialog();
  frameClubhouseTreasure(id, ClubhouseLayout.clamp(p.angle, -80, 80));
  lookClubhouse(p.angle);
}
function restoreClubhouseItem(id) {
  act(() => {
    const reset = Game.resetClubhouseItem(state, id);
    save();
    clubhouseRoom.manualPitch = null;
    clubhouseRoom.focusId = id;
    closeDialog();
    frameClubhouseTreasure(
      id,
      ClubhouseLayout.clamp(ClubhouseLayout.defaults[id].angle, -80, 80),
    );
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
  centerClubhouse();
  roomAnnounce(
    "All treasures returned to their usual spots. Your farm and purchases are unchanged.",
  );
}
