/* Shared room coordinates and projection, independent of DOM and farm rules.
   Angles are degrees around one fixed viewpoint, not scrolling page pixels. */
(function (root) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const radians = Math.PI / 180;
  const small = ["ball", "tablet", "camera", "puppy"];
  const surfaces = [
    {
      id: "floor",
      min: -90,
      max: 90,
      y: 0.83,
      items: ["ball", "bike", "tablet", "guitar", "camera", "puppy"],
    },
    { id: "reading-bench", min: -90, max: -73, y: 0.65, items: small },
    {
      id: "left-ledge",
      min: -88,
      max: -73,
      y: 0.39,
      items: ["tablet", "camera", "puppy"],
    },
    { id: "music-wall", min: -46, max: -32, y: 0.47, items: ["guitar"] },
    {
      id: "nook-shelf",
      min: 11,
      max: 25,
      y: 0.31,
      items: ["tablet", "camera", "puppy"],
    },
    { id: "toy-chest", min: 16, max: 33, y: 0.69, items: small },
    {
      id: "right-shelf",
      min: 48,
      max: 66,
      y: 0.38,
      items: ["tablet", "camera", "puppy"],
    },
    { id: "side-cabinet", min: 58, max: 90, y: 0.64, items: small },
  ];
  const defaults = {
    ball: { surface: "floor", angle: -7, y: 0.83 },
    bike: { surface: "floor", angle: -72, y: 0.83 },
    guitar: { surface: "music-wall", angle: -40, y: 0.47 },
    camera: { surface: "nook-shelf", angle: 18, y: 0.31 },
    tablet: { surface: "right-shelf", angle: 57, y: 0.38 },
    puppy: { surface: "toy-chest", angle: 29, y: 0.69 },
  };
  function valid(id, p) {
    if (
      !p ||
      typeof p !== "object" ||
      Array.isArray(p) ||
      !Number.isFinite(p.angle) ||
      !Number.isFinite(p.y)
    )
      return false;
    const s = surfaces.find((s) => s.id === p.surface && s.items.includes(id));
    return (
      !!s &&
      p.angle >= s.min &&
      p.angle <= s.max &&
      (s.id === "floor"
        ? p.y >= 0.77 && p.y <= 0.9
        : Math.abs(p.y - s.y) < 0.0001)
    );
  }
  function effective(positions, id) {
    return positions?.[id] || defaults[id];
  }
  function recoverPositions(raw, owned) {
    const result = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw))
      for (const id of Object.keys(defaults))
        if (owned[id] && valid(id, raw[id]))
          result[id] = {
            surface: raw[id].surface,
            angle: raw[id].angle,
            y: raw[id].y,
          };
    return result;
  }
  function conflict(a, b, id, other) {
    const gap = id === "bike" || other === "bike" ? 15 : 10;
    return Math.abs(a.angle - b.angle) < gap && Math.abs(a.y - b.y) < 0.12;
  }
  function blockers(id, p, positions, owned) {
    return Object.keys(defaults).filter(
      (other) =>
        other !== id &&
        owned[other] &&
        conflict(p, effective(positions, other), id, other),
    );
  }
  function drop(id, angle, y) {
    if (!Number.isFinite(angle) || !Number.isFinite(y)) return null;
    const choices = surfaces.filter(
      (s) =>
        s.items.includes(id) &&
        angle >= s.min &&
        angle <= s.max &&
        Math.abs(y - s.y) < (s.id === "floor" ? 0.14 : 0.09),
    );
    choices.sort((a, b) => Math.abs(y - a.y) - Math.abs(y - b.y));
    const s = choices[0];
    return s
      ? {
          surface: s.id,
          angle: Math.round(angle * 100) / 100,
          y:
            s.id === "floor"
              ? Math.round(clamp(y, 0.77, 0.9) * 1000) / 1000
              : s.y,
        }
      : null;
  }
  function geometry(width, height) {
    // Match the 3:1 painting's pixels at the central ray; cap the horizontal
    // field of view at 60 degrees so ±80 never reveals a painting edge.
    const focal = Math.max(
      (3 / (240 * radians)) * height,
      width / (2 * Math.tan(30 * radians)),
    );
    const paintedHeight = (focal * 240 * radians) / 3;
    return {
      width,
      height,
      focal,
      paintedHeight,
      horizon: (height - paintedHeight) * 0.85 + paintedHeight * 0.5,
    };
  }
  function project(p, yaw, g) {
    const delta = (p.angle - yaw) * radians;
    if (Math.abs(delta) >= Math.PI / 2)
      return { x: -10000, y: 0, visible: false, scale: 1 };
    const cos = Math.cos(delta);
    const x = g.width / 2 + g.focal * Math.tan(delta);
    return {
      x,
      y: g.horizon + ((p.y - 0.5) * g.paintedHeight) / cos,
      scale: 1 / cos,
      visible: x >= -80 && x <= g.width + 80,
    };
  }
  function unproject(x, y, yaw, g) {
    const delta = Math.atan((x - g.width / 2) / g.focal);
    return {
      angle: yaw + delta / radians,
      y: 0.5 + ((y - g.horizon) * Math.cos(delta)) / g.paintedHeight,
    };
  }
  const api = {
    clamp,
    surfaces,
    defaults,
    valid,
    effective,
    recoverPositions,
    blockers,
    drop,
    geometry,
    project,
    unproject,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.ClubhouseLayout = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
