/* Shared room coordinates and projection, independent of DOM and farm rules.
   Angles are degrees around one fixed viewpoint, not scrolling page pixels. */
(function (root) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const radians = Math.PI / 180;
  const small = ["ball", "tablet", "camera", "puppy"];
  const angleAt = (x) => (x / 2172) * 240 - 120;
  const pixelAt = (angle) => ((angle + 120) / 240) * 2172;
  const point = (surface, x, y) => ({ surface, angle: angleAt(x), y: y / 724 });
  const line = (points, x) => {
    for (let i = 1; i < points.length; i++)
      if (x <= points[i][0]) {
        const a = points[i - 1],
          b = points[i];
        return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
      }
    return points.at(-1)[1];
  };
  // Measured on the UNCHANGED 2172 x 724 painting. These are contact edges,
  // not item centers. Separate shelf rows retain their real slope.
  const floorBack = [
    [0, 610],
    [140, 556],
    [280, 536],
    [475, 536],
    [530, 552],
    [720, 502],
    [1160, 502],
    [1200, 558],
    [1435, 616],
    [1630, 646],
    [1730, 536],
    [1870, 560],
    [2172, 634],
  ];
  const chestRim = [
    [1196, 465],
    [1364, 493],
    [1420, 473],
  ];
  const surfaces = [
    {
      id: "floor",
      kind: "floor",
      name: "Floor",
      pixels: [180, 1990],
      items: ["ball", "bike", "tablet", "guitar", "camera", "puppy"],
    },
    {
      id: "chest",
      kind: "chest",
      name: "Treasure chest",
      pixels: [1232, 1386],
      edge: chestRim,
      offset: 12,
      items: small,
    },
    {
      id: "window-seat",
      kind: "seat",
      name: "Window seat",
      pixels: [938, 1110],
      edge: [
        [938, 414],
        [1110, 416],
      ],
      items: small,
    },
    {
      id: "reading-bench",
      kind: "seat",
      name: "Reading bench cushion",
      pixels: [430, 501],
      edge: [
        [430, 430],
        [501, 433],
      ],
      items: small,
    },
    {
      id: "shelf-left-upper",
      kind: "shelf",
      name: "Left bookshelf, upper shelf",
      pixels: [330, 469],
      edge: [
        [330, 225],
        [469, 230],
      ],
      items: small,
    },
    {
      id: "shelf-left-middle",
      kind: "shelf",
      name: "Left bookshelf, middle shelf",
      pixels: [330, 469],
      edge: [
        [330, 286],
        [469, 287],
      ],
      items: small,
    },
    {
      id: "shelf-left-lower",
      kind: "shelf",
      name: "Left bookshelf, lower shelf",
      pixels: [330, 469],
      edge: [
        [330, 335],
        [469, 336],
      ],
      items: small,
    },
    {
      id: "shelf-nook-upper",
      kind: "shelf",
      name: "Nook bookshelf, upper shelf",
      pixels: [1218, 1350],
      edge: [
        [1218, 169],
        [1350, 154],
      ],
      items: small,
    },
    {
      id: "shelf-nook-middle",
      kind: "shelf",
      name: "Nook bookshelf, middle shelf",
      pixels: [1218, 1350],
      edge: [
        [1218, 244],
        [1350, 237],
      ],
      items: small,
    },
    {
      id: "shelf-nook-lower",
      kind: "shelf",
      name: "Nook bookshelf, lower shelf",
      pixels: [1218, 1350],
      edge: [
        [1218, 316],
        [1350, 320],
      ],
      items: small,
    },
    {
      id: "shelf-right-upper",
      kind: "shelf",
      name: "Right bookshelf, upper shelf",
      pixels: [1583, 1717],
      edge: [
        [1583, 233],
        [1717, 244],
      ],
      items: small,
    },
    {
      id: "shelf-right-middle",
      kind: "shelf",
      name: "Right bookshelf, middle shelf",
      pixels: [1583, 1717],
      edge: [
        [1583, 295],
        [1717, 297],
      ],
      items: small,
    },
    {
      id: "shelf-right-lower",
      kind: "shelf",
      name: "Right bookshelf, lower shelf",
      pixels: [1583, 1717],
      edge: [
        [1583, 351],
        [1717, 350],
      ],
      items: small,
    },
    {
      id: "side-cabinet",
      kind: "shelf",
      name: "Low display cabinet",
      pixels: [1583, 1717],
      edge: [
        [1583, 414],
        [1717, 405],
      ],
      items: small,
    },
  ].map((s) => ({
    ...s,
    min: angleAt(s.pixels[0]),
    max: angleAt(s.pixels[1]),
  }));
  const getSurface = (id) => surfaces.find((s) => s.id === id);
  function contactY(surface, x) {
    const s = typeof surface === "string" ? getSurface(surface) : surface;
    return s.kind === "floor"
      ? line(floorBack, x) + 6
      : line(s.edge, x) + (s.offset || 0);
  }
  // A 22cm ball is the approved 64px reference. At the back of the painting
  // the bench seat is about 108px high (~37cm), and its cushion is ~300px wide.
  // These are approximate storybook proportions, not a change to the room lens.
  const sizeReference = { pixelsPerCm:64/22, ballDiameterCm:22, benchSeatHeightPx:108, windowSeatWidthPx:300 };
  const itemSizes = {
    ball: { placement:"small-treasure", widthCm:22, aspect:1, contactInset:17/380, reference:"22cm soccer ball" },
    bike: { placement:"floor-object", widthCm:110, aspect:575/452, contactInset:18/452, reference:"110cm child bicycle, about 86cm tall" },
    guitar: { placement:"floor-object", heightCm:70, aspect:276/492, contactInset:28/492, reference:"70cm learner guitar" },
    tablet: { placement:"small-treasure", widthCm:20, aspect:430/388, contactInset:12/388, reference:"20cm tablet in its protective case" },
    camera: { placement:"small-treasure", widthCm:12, aspect:442/365, contactInset:.18, reference:"12cm compact camera; strap hangs below its body" },
    puppy: { placement:"small-treasure", widthCm:14.5, aspect:455/442, contactInset:20/442, reference:"Small 14.5cm keepsake bank" },
  };
  const placementCategories = {
    "floor-object": ["floor"],
    "small-treasure": ["floor","shelf","table","seat","chest"],
    "wall-decoration": ["wall"],
  };
  function acceptsSurface(category, kind) {
    return !!placementCategories[category]?.includes(kind);
  }
  function canPlace(id, surface) {
    const s=typeof surface==="string"?getSurface(surface):surface;
    return !!s && s.items.includes(id) && acceptsSurface(itemSizes[id]?.placement,s.kind);
  }
  function placementHint(id) {
    const category=itemSizes[id]?.placement;
    return category==="floor-object" ? "Keep it on clear floor space." :
      category==="wall-decoration" ? "Hang it in a clear wall area." :
      "Try a shelf, cabinet, seat, chest or floor.";
  }
  function baseSize(id) {
    const m=itemSizes[id];
    if (!m) return {width:32,height:32,contactInset:0};
    const width=(m.widthCm ?? m.heightCm*m.aspect)*sizeReference.pixelsPerCm;
    return {width,height:width/m.aspect,contactInset:m.contactInset};
  }
  function metrics(id, p) {
    const s = getSurface(p.surface),
      base = baseSize(id);
    let scale = s?.kind === "chest" ? 1.1 : s?.kind === "seat" ? 0.95 : 1;
    if (s?.kind === "floor")
      scale =
        0.72 +
        clamp(
          (p.y * 724 - line(floorBack, pixelAt(p.angle))) /
            (724 - line(floorBack, pixelAt(p.angle))),
          0,
          1,
        ) *
          0.55;
    return {
      width: base.width * scale,
      height: base.height * scale,
      // Align the visible body/tires, rather than transparent atlas padding,
      // with the chosen surface. The camera strap may hang below that surface.
      tail: base.height * scale * base.contactInset,
      shadow: {
        rx: base.width * scale * (s?.kind === "floor" ? 0.34 : 0.28),
        ry: Math.max(
          0.7,
          base.height * scale * (s?.kind === "floor" ? 0.025 : 0.015),
        ),
        color:
          s?.kind === "chest"
            ? "#5f371929"
            : s?.kind === "seat"
              ? "#5f371933"
              : "#5f371938",
      },
      occlusion: s?.kind === "chest" ? 12 : 0,
    };
  }
  function floorMinimum(id, x, y = 610) {
    const m = metrics(id, point("floor", x, y)),
      margin = m.width / 2 + 3;
    return (
      Math.max(...[-margin, 0, margin].map((dx) => line(floorBack, x + dx))) + 4
    );
  }
  function canonical(id, surface, x, y) {
    const s = getSurface(surface);
    if (!canPlace(id,s)) return null;
    const p = point(surface, x, y ?? contactY(s, x)),
      m = metrics(id, p),
      margin = m.width / 2 + 3;
    if (x < s.pixels[0] + margin || x > s.pixels[1] - margin) return null;
    if (s.kind === "floor") {
      const back = floorMinimum(id, x, p.y * 724);
      if (p.y * 724 < back || p.y * 724 > 704) return null;
    } else p.y = contactY(s, x) / 724;
    return p;
  }
  function valid(id, p) {
    if (!p || !Number.isFinite(p.angle) || !Number.isFinite(p.y)) return false;
    const c = canonical(id, p.surface, pixelAt(p.angle), p.y * 724);
    return !!c && Math.abs(c.y - p.y) < 0.00001;
  }
  const defaults = {
    ball: point("floor", 1023, 606),
    bike: point("floor", 434, 603),
    guitar: point("floor", 730, 552),
    camera: point(
      "shelf-nook-middle",
      1264,
      contactY("shelf-nook-middle", 1264),
    ),
    tablet: point(
      "shelf-right-middle",
      1638,
      contactY("shelf-right-middle", 1638),
    ),
    puppy: point("chest", 1300, contactY("chest", 1300)),
  };
  function effective(positions, id) {
    return positions?.[id] || defaults[id];
  }
  const aliases = {
    "toy-chest": "chest",
    "left-ledge": "shelf-left-middle",
    "nook-shelf": "shelf-nook-middle",
    "right-shelf": "shelf-right-middle",
    "music-wall": "floor",
  };
  function migrate(id, p) {
    if (
      !p ||
      !Number.isFinite(p.angle) ||
      !Number.isFinite(p.y) ||
      p.y < 0 ||
      p.y > 1 ||
      Math.abs(p.angle) > 100
    )
      return null;
    const s = getSurface(aliases[p.surface] || p.surface);
    if (!canPlace(id,s)) return null;
    const estimate = point(s.id, pixelAt(p.angle), p.y * 724),
      m = metrics(id, estimate),
      margin = m.width / 2 + 4;
    const x = clamp(
      pixelAt(p.angle),
      s.pixels[0] + margin,
      s.pixels[1] - margin,
    );
    const y =
      s.kind === "floor"
        ? clamp(
            Math.max(p.y * 724, contactY(s, x) + m.width * 0.25),
            contactY(s, x) + m.width * 0.25,
            704,
          )
        : contactY(s, x);
    for (let target = y; target <= 704; target += 3) {
      const c = canonical(id, s.id, x, target);
      if (c) return c;
      if (s.kind !== "floor") break;
    }
    return null;
  }
  function recoverPositions(raw, owned, version = 2) {
    const result = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw))
      for (const id of Object.keys(defaults))
        if (owned[id]) {
          const p =
            version === 2
              ? valid(id, raw[id])
                ? raw[id]
                : migrate(id, raw[id])
              : migrate(id, raw[id]);
          if (p) result[id] = { surface: p.surface, angle: p.angle, y: p.y };
        }
    const accepted = {};
    const order = Object.keys(defaults).filter(id=>owned[id]).sort((a,b)=>
      Number(!!result[b])-Number(!!result[a]) || baseSize(a).width-baseSize(b).width);
    for (const id of order) {
      const original=effective(result,id);
      let p=original;
      if (!valid(id,p) || Object.keys(accepted).some(other=>conflict(p,accepted[other],id,other)))
        p=nearestFree(id,original,accepted);
      // There is ample floor space for this six-item collection. Never discard
      // an owned item or an otherwise valid farm if optional layout data is bad.
      if (!p) p=defaults[id];
      accepted[id]=p;
      if (result[id] || p.angle!==defaults[id].angle || p.y!==defaults[id].y || p.surface!==defaults[id].surface)
        result[id]={surface:p.surface,angle:p.angle,y:p.y};
    }
    return result;
  }
  function nearestFree(id, origin, accepted) {
    const ox=pixelAt(origin.angle),oy=origin.y*724;
    const surfaceDistance=s=>{const x=clamp(ox,...s.pixels);return (x-ox)**2+((contactY(s,x)-oy)*1.4)**2;};
    const choices=surfaces.filter(s=>canPlace(id,s)).sort((a,b)=>
      Number(b.id===origin.surface)-Number(a.id===origin.surface) ||
      Number(a.kind==="floor")-Number(b.kind==="floor") ||
      surfaceDistance(a)-surfaceDistance(b));
    for (const surface of choices) {
      let best=null,score=Infinity;
      const xs=[ox],ys=surface.kind==="floor"?[oy]:[undefined];
      for(let x=surface.pixels[0];x<=surface.pixels[1];x+=surface.kind==="floor"?12:2)xs.push(x);
      if(surface.kind==="floor")for(let y=506;y<=704;y+=6)ys.push(y);
      for(const x of xs)for(const y of ys){
        const p=canonical(id,surface.id,x,y);
        if(!p || Object.keys(accepted).some(other=>conflict(p,accepted[other],id,other)))continue;
        const distance=(x-ox)**2+((p.y*724-oy)*1.4)**2;
        if(distance<score){best=p;score=distance;}
      }
      if(best)return best;
    }
    return null;
  }
  function conflict(a, b, id, other) {
    const ma = metrics(id, a),
      mb = metrics(other, b),
      ax = pixelAt(a.angle),
      bx = pixelAt(b.angle),
      ay = a.y * 724,
      by = b.y * 724;
    const overlapX =
      Math.min(ax + ma.width / 2, bx + mb.width / 2) -
      Math.max(ax - ma.width / 2, bx - mb.width / 2);
    const overlapY =
      Math.min(ay - ma.occlusion, by - mb.occlusion) -
      Math.max(ay - ma.height, by - mb.height);
    return (
      overlapX > Math.min(ma.width, mb.width) * 0.25 &&
      overlapY >
        Math.min(ma.height - ma.occlusion, mb.height - mb.occlusion) * 0.3
    );
  }
  function blockers(id, p, positions, owned) {
    return Object.keys(defaults).filter(
      (other) =>
        other !== id &&
        owned[other] &&
        conflict(p, effective(positions, other), id, other),
    );
  }
  function drop(id, angle, y, tolerance = 0.04) {
    if (!Number.isFinite(angle) || !Number.isFinite(y)) return null;
    const x = pixelAt(angle),
      choices = [];
    for (const s of surfaces) {
      if (!canPlace(id,s)) continue;
      const estimate = point(s.id, x, y * 724),
        m = metrics(id, estimate),
        margin = m.width / 2 + 3,
        snappedX = clamp(x, s.pixels[0] + margin, s.pixels[1] - margin);
      // A nearby edge is forgiving, but distant releases still return home.
      if (Math.abs(snappedX - x) > Math.min(18, tolerance * 724)) continue;
      const wanted =
        s.kind === "floor"
          ? clamp(y * 724, floorMinimum(id, snappedX, y * 724) + 1, 704)
          : contactY(s, snappedX);
      const p = canonical(id, s.id, snappedX, wanted);
      if (p && Math.abs(p.y - y) <= tolerance) choices.push(p);
    }
    return (
      choices.sort((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y))[0] || null
    );
  }
  const occluders = [
    [
      [1196, 465],
      [1364, 493],
      [1420, 473],
      [1420, 552],
      [1362, 584],
      [1195, 538],
    ],
  ];
  function outline(s) {
    if (s.kind === "chest")
      return [
        [1210, 465],
        [1267, 450],
        [1406, 474],
        [1363, 487],
      ];
    if (s.kind === "floor")
      return [
        [180, line(floorBack, 180) + 4],
        ...floorBack
          .filter(([x]) => x > 180 && x < 1990)
          .map(([x, y]) => [x, y + 4]),
        [1990, line(floorBack, 1990) + 4],
        [1990, 704],
        [180, 704],
      ];
    const [a, b] = s.pixels;
    return [
      [a, contactY(s, a) - 4],
      [b, contactY(s, b) - 4],
      [b, contactY(s, b) + 4],
      [a, contactY(s, a) + 4],
    ];
  }
  function geometry(width, height) {
    // Match the 3:1 painting's pixels at the central ray; cap the horizontal
    // field of view to 44–60 degrees. This fixed lens leaves enough side
    // coverage to find edge treasures without changing zoom for each item.
    const focal = clamp(
      (3 / (240 * radians)) * height,
      width / (2 * Math.tan(30 * radians)),
      width / (2 * Math.tan(22 * radians)),
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
    floorMinimum,
    angleAt,
    pixelAt,
    point,
    contactY,
    getSurface,
    placementCategories,
    acceptsSurface,
    canPlace,
    placementHint,
    sizeReference,
    itemSizes,
    baseSize,
    metrics,
    canonical,
    migrate,
    outline,
    occluders,
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
