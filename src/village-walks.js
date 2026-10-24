/* Painted-path movement only. Routes use terrain coordinates, not viewport
   percentages. Geometry is compiled on layout changes; the browser animates
   transforms without a JavaScript frame loop, game writes, or save fields. */
const VILLAGE_WALK_ROADS = [
  {
    id: "upper-lane",
    d: "M57 31 C58 33 50 35 50.5 39 C50 42 55 44 54 48 C53.5 51 49 54 49 57",
  },
  {
    id: "garden-lane",
    d: "M50 73 C51 76 48 79 46.8 82 C44.3 85 44.8 88 47 91 C49 94 51 96 50 98",
  },
  {
    id: "market-square",
    d: "M49 58.5 C45 59 43 61 43.5 63 C44 65 47 66.5 50.5 66 C54 65.7 56 64 55 62 C54 60 51 59 49 58.5",
  },
  {
    id: "square-approach",
    d: "M46.5 60 C45.2 61.4 45.2 63.6 47 65.8 C48.2 67 49 68 50 69",
  },
];
// Conservative walkable pavement boundaries, traced from the preserved artwork.
const VILLAGE_WALK_LANES = [
  [
    [55, 30],
    [55, 32],
    [51, 34],
    [49, 36],
    [47.7, 39],
    [48, 41],
    [50.3, 44],
    [50, 49],
    [48.3, 52],
    [46, 55],
    [45.5, 58],
    [53, 58],
    [54, 54],
    [55, 51],
    [58, 46],
    [56, 43],
    [53.5, 41],
    [53, 38],
    [56.5, 35],
    [60.5, 33],
    [60.3, 30],
  ],
  [
    [45, 69],
    [47, 72],
    [47, 75],
    [45, 78],
    [43, 81],
    [42, 85],
    [42.5, 88],
    [44, 91],
    [45, 94],
    [45, 98],
    [55, 98],
    [54, 94],
    [52, 91],
    [50.5, 87],
    [50, 84],
    [50.5, 81],
    [53, 78],
    [54, 75],
    [54, 72],
    [53, 69],
  ],
];
function villagePavedPoint(x, y) {
  if (((x - 47.5) / 12.5) ** 2 + ((y - 63) / 5.8) ** 2 <= 1) return true;
  return VILLAGE_WALK_LANES.some((polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a[1] > y !== b[1] > y &&
        x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
      )
        inside = !inside;
    }
    return inside;
  });
}
const villageWalking = {
  world: null,
  key: "",
  animations: [],
  observer: null,
  plans: [],
};
const villageWalkMotion = matchMedia("(prefers-reduced-motion: reduce)");
function villageArtBounds(svg, origin) {
  const r = svg.getBoundingClientRect(),
    v = svg.viewBox.baseVal;
  const scale = Math.min(r.width / v.width, r.height / v.height);
  const width = v.width * scale,
    height = v.height * scale;
  return {
    left: r.left - origin.left + (r.width - width) / 2,
    top: r.top - origin.top + (r.height - height) / 2,
    right: r.left - origin.left + (r.width + width) / 2,
    bottom: r.top - origin.top + (r.height + height) / 2,
  };
}
function villageWalkBody(point, size) {
  return {
    left: point.x - size * 0.35,
    right: point.x + size * 0.35,
    top: point.y - size * 0.91,
    bottom: point.y + 1,
  };
}
function villageWalkIntersects(a, b, padding = 3) {
  return (
    a.left < b.right + padding &&
    a.right > b.left - padding &&
    a.top < b.bottom + padding &&
    a.bottom > b.top - padding
  );
}
function villageWalkTimeline(points, speed, facing = 1) {
  let length = 0;
  const samples = points.map((p, i) => {
    if (i) length += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    return { ...p, distance: length };
  });
  const travel = Math.max(5000, (length / speed) * 1000),
    hold = 4200,
    total = travel * 2 + hold * 3;
  const direction =
    (points.at(-1).x - points[0].x || points.at(-1).y - points[0].y) >= 0
      ? 1
      : -1;
  const mirror = direction / facing;
  const transform = (p, m) =>
    `translate(${p.x.toFixed(3)}px,${p.y.toFixed(3)}px) scaleX(${m})`;
  // Ease only the start/end of each leg; arc-length sampling keeps bends smooth.
  const inverseEase = (p) => Math.acos(1 - 2 * p) / Math.PI;
  const frames = [
    {
      offset: 0,
      transform: transform(points[0], mirror),
      visibility: "visible",
    },
    { offset: hold / total, transform: transform(points[0], mirror) },
  ];
  for (const p of samples.slice(1))
    frames.push({
      offset: (hold + inverseEase(p.distance / length) * travel) / total,
      transform: transform(p, mirror),
    });
  const turn = hold + travel + hold / 2;
  frames.push(
    {
      offset: turn / total,
      transform: transform(points.at(-1), mirror),
    },
    {
      offset: turn / total,
      transform: transform(points.at(-1), -mirror),
    },
    {
      offset: (hold * 2 + travel) / total,
      transform: transform(points.at(-1), -mirror),
    },
  );
  for (const p of samples.slice(0, -1).reverse())
    frames.push({
      offset:
        (hold * 2 + travel + inverseEase(1 - p.distance / length) * travel) /
        total,
      transform: transform(p, -mirror),
    });
  const end = hold * 2 + travel * 2;
  frames.push(
    {
      offset: (end + hold / 2) / total,
      transform: transform(points[0], -mirror),
    },
    {
      offset: (end + hold / 2) / total,
      transform: transform(points[0], mirror),
    },
    {
      offset: 1,
      transform: transform(points[0], mirror),
      visibility: "visible",
    },
  );
  return { frames, duration: total, length };
}
function stopVillageWalking() {
  villageWalking.animations.forEach((a) => a.cancel());
  villageWalking.animations = [];
}
function syncVillageWalkers(force = false) {
  const world = document.querySelector(".town-world");
  if (world !== villageWalking.world) {
    stopVillageWalking();
    villageWalking.observer?.disconnect();
    villageWalking.world = world;
    villageWalking.plans = [];
    villageWalking.key = "";
    if (world) {
      villageWalking.observer = new ResizeObserver(() => syncVillageWalkers());
      villageWalking.observer.observe(world);
    }
  }
  if (!world) return;
  if (villageWalkMotion.matches)
    world.getAnimations().forEach((a) => a.cancel());
  const origin = world.getBoundingClientRect();
  const places = world
    .querySelector(".village-locations")
    .getBoundingClientRect();
  const terrain = document
    .querySelector(".town-game .village-terrain-art")
    ?.getBoundingClientRect();
  if (!terrain || !origin.width || !origin.height) return;
  const key = [
    origin.width,
    origin.height,
    terrain.width,
    terrain.height,
    terrain.left - origin.left,
    terrain.top - origin.top,
    places.left - origin.left,
    places.width,
    world.dataset.season,
    villageWalkMotion.matches,
  ].join("|");
  if (!force && key === villageWalking.key) return;
  const phase = villageWalking.animations[0]
    ? ((Number(villageWalking.animations[0].currentTime) || 0) /
        villageWalking.animations[0].effect.getTiming().duration) %
      1
    : 0.15;
  stopVillageWalking();
  villageWalking.key = key;
  villageWalking.plans = [];
  const map = (x, y) => ({
    x: terrain.left - origin.left + (x / 100) * terrain.width,
    y: terrain.top - origin.top + (y / 100) * terrain.height,
  });
  const source = (p) => ({
    x: ((p.x - terrain.left + origin.left) / terrain.width) * 100,
    y: ((p.y - terrain.top + origin.top) / terrain.height) * 100,
  });
  const blockers = [
    ...world.querySelectorAll(
      ".town-building-art,.village-tree-art,.village-fixture-art,[data-village-solid]",
    ),
  ].map((e) => villageArtBounds(e, origin));
  blockers.push(
    ...[...world.querySelectorAll(".town-sign,.town-badge")].map((e) => {
      const r = e.getBoundingClientRect();
      return {
        left: r.left - origin.left,
        right: r.right - origin.left,
        top: r.top - origin.top,
        bottom: r.bottom - origin.top,
      };
    }),
  );
  const reserved = [];
  const safe = (point, size) => {
    const ground = source(point),
      body = villageWalkBody(point, size);
    const footRadius = ((size * 0.25) / terrain.width) * 100;
    return (
      body.left >= 2 &&
      body.right <= origin.width - 2 &&
      body.top >= 2 &&
      body.bottom <= origin.height - 2 &&
      villagePavedPoint(ground.x - footRadius, ground.y) &&
      villagePavedPoint(ground.x + footRadius, ground.y) &&
      !blockers.some((b) => villageWalkIntersects(body, b)) &&
      !reserved.some((b) => villageWalkIntersects(body, b, 2))
    );
  };
  const candidates = VILLAGE_WALK_ROADS.map((road) => {
    let axis = 0;
    const d = road.d.replace(/-?\d+(?:\.\d+)?/g, (v) => {
      const value = Number(v);
      return (axis++ % 2 ? map(0, value).y : map(value, 0).x).toFixed(3);
    });
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    const length = path.getTotalLength(),
      points = [];
    for (let at = 0; at <= length; at += 1.25) {
      const p = path.getPointAtLength(at);
      points.push({ x: p.x, y: p.y });
    }
    return { ...road, points };
  });
  const actors = [...world.querySelectorAll("[data-village-walker]")];
  for (const actor of actors) {
    if (getComputedStyle(actor).display === "none") continue;
    const standing = actor.dataset.villageWalker === "market";
    const size = parseFloat(
      getComputedStyle(actor.querySelector(".village-person")).width,
    );
    if (standing) {
      const spots = [
        [49.5, 67.3],
        [47.5, 65.2],
        [51, 62],
        [46.5, 68],
        [49, 60.5],
      ];
      const point = spots.map(([x, y]) => map(x, y)).find((p) => safe(p, size));
      if (!point) continue;
      const pose = {
        transform: `translate(${point.x}px,${point.y}px)`,
        visibility: "visible",
      };
      const animation = actor.animate([pose, pose], {
        duration: 1,
        fill: "both",
      });
      animation.pause();
      animation.currentTime = 0;
      villageWalking.animations.push(animation);
      villageWalking.plans.push({
        actor,
        points: [point],
        size,
        standing: true,
        route: "market-stop",
      });
      continue;
    }
    const preferred =
      actor.dataset.villageWalker === "child" ? "garden-lane" : "upper-lane";
    let best = null;
    for (const route of candidates) {
      let run = [];
      const finish = () => {
        if (run.length > 5) {
          let length = 0;
          for (let i = 1; i < run.length; i++)
            length += Math.hypot(
              run[i].x - run[i - 1].x,
              run[i].y - run[i - 1].y,
            );
          const score = length + (route.id === preferred ? 50 : 0);
          if (length >= 12 && (!best || score > best.score))
            best = { points: run, length, score, route: route.id };
        }
        run = [];
      };
      for (const point of route.points) {
        if (safe(point, size)) run.push(point);
        else finish();
      }
      finish();
    }
    if (!best) continue;
    const timeline = villageWalkTimeline(
      best.points,
      actor.dataset.villageWalker === "child" ? 6 : 7,
      actor.dataset.villageWalker === "child" ? -1 : 1,
    );
    const animation = actor.animate(timeline.frames, {
      duration: timeline.duration,
      iterations: Infinity,
      easing: "linear",
    });
    animation.currentTime = phase * timeline.duration;
    if (villageWalkMotion.matches) animation.pause();
    villageWalking.animations.push(animation);
    villageWalking.plans.push({
      actor,
      points: best.points,
      size,
      animation,
      standing: false,
      route: best.route,
      length: timeline.length,
    });
    reserved.push(
      ...best.points
        .filter((_, i) => i % 3 === 0)
        .map((p) => villageWalkBody(p, size)),
    );
  }
}
villageWalkMotion.addEventListener("change", () => syncVillageWalkers(true));
