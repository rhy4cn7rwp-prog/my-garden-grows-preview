/* Original offline job games. Serializable state, seeded puzzles, integer-cent
   payouts, absolute cooldowns and explicit active-play clocks. No DOM/audio. */
(function (root) {
  "use strict";
  const V =
    typeof module !== "undefined"
      ? require("./job-vocabulary.js")
      : root.JobVocabulary;
  const Lawn =
    typeof module !== "undefined" ? require("./job-lawn.js") : root.JobLawn;
  const Records =
    typeof module !== "undefined"
      ? require("./job-records.js")
      : root.JobRecords;
  const Pictures =
    typeof module !== "undefined"
      ? require("./job-picture-rules.js")
      : root.JobPictureRules;
  const Stacks =
    typeof module !== "undefined"
      ? require("./job-stack-puzzles.js")
      : root.JobStackPuzzles;
  const names = [
    [
      "words",
      "Garden Word Search",
      "Word puzzle",
      "Find the garden words. Swipe along their letters.",
    ],
    [
      "packing",
      "Packing Shed",
      "Sorting arcade",
      "Drag each vegetable into its matching crate.",
    ],
    [
      "stacks",
      "Harvest Stack Sort",
      "Crate puzzle",
      "Move top vegetables to empty or matching crates. Group each kind together.",
    ],
    [
      "labels",
      "Mrs. Magee’s Mixed-Up Labels",
      "Letter puzzle",
      "Help Mrs. Magee put the wooden letters in order.",
    ],
    [
      "match",
      "Veggie Match",
      "Match-four puzzle",
      "Swap neighbors to make a row of four. Reach your goal and play for ninety seconds.",
    ],
    [
      "catch",
      "Help Mr. Jones Catch His Carrots!",
      "Basket arcade",
      "Move your basket to catch the carrots Mr. Jones tosses behind him.",
    ],
    [
      "weeds",
      "Pull Neighborhood Weeds",
      "Garden chore",
      "Pull yellow jagged weeds. Leave the green feathery carrot tops.",
    ],
    [
      "tomatoes",
      "Pick Tomatoes",
      "Harvest chore",
      "Pick the red ripe tomatoes. Leave the green ones to grow.",
    ],
    [
      "flowers",
      "Water Flowers",
      "Watering chore",
      "Water every thirsty flower in the garden. Paths and grass do not need water.",
    ],
    [
      "tidy",
      "Tidy the Yard — Mow & Rake",
      "Lawn-care adventure",
      "Mow the lawn, rake the clippings into piles, then put them in the compost bin.",
    ],
  ];
  names.push(
    [
      "hidden",
      "Hidden Treasures of the Farm",
      "Picture adventure",
      "Find every object on your list. Zoom and pan to explore. Hints are always available.",
    ],
    [
      "sliding",
      "Piece It Together",
      "Sliding picture puzzle",
      "Tap a piece beside the empty space to slide it. Rebuild the picture.",
    ],
  );
  const catalog = names.map(([id, name, type, instructions]) => ({
    id,
    name,
    type,
    instructions,
    rewardCents: 100,
  }));
  const kinds = ["carrot", "corn", "tomato", "cucumber", "onion"];
  const duration = { match: 90000, catch: 60000 },
    cooldownMs = 300000;
  const requireRule = (yes, msg) => {
    if (!yes) throw Error(msg);
  };
  const copy = (o) => JSON.parse(JSON.stringify(o));
  function rng(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function shuffle(a, r) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function empty() {
    return {
      version: 1,
      sequence: 0,
      cooldowns: {},
      best: {},
      records: {},
      wordHistory: { little: [], growing: [] },
      completed: {},
      pictureHistory: { hidden: [], sliding: [] },
      pictureCompleted: { hidden: [], sliding: [] },
      active: null,
    };
  }
  function recover(raw) {
    const out = empty();
    if (raw?.version !== 1) return out;
    out.records = Records.recover(raw.records);
    for (const id of ["hidden", "sliding"])
      for (const field of ["pictureHistory", "pictureCompleted"])
        out[field][id] = Array.isArray(raw[field]?.[id])
          ? raw[field][id]
              .filter(
                (n) => Number.isInteger(n) && n >= 0 && n < Pictures.count(id),
              )
              .slice(-Pictures.count(id))
          : [];
    for (const j of catalog)
      for (const mode of ["little", "growing"]) {
        const key = j.id + "|" + mode,
          v = raw.completed?.[key];
        if (Number.isSafeInteger(v) && v >= 0) out.completed[key] = v;
      }

    for (const mode of ["little", "growing"])
      out.wordHistory[mode] = Array.isArray(raw.wordHistory?.[mode])
        ? raw.wordHistory[mode].filter((w) => V.all.includes(w)).slice(-24)
        : [];
    out.sequence =
      Number.isSafeInteger(raw.sequence) && raw.sequence >= 0
        ? raw.sequence
        : 0;
    for (const j of catalog) {
      const t = raw.cooldowns?.[j.id];
      if (Number.isSafeInteger(t) && t >= 0) out.cooldowns[j.id] = t;
      const b = raw.best?.[j.id];
      if (Number.isSafeInteger(b) && b >= 0) out.best[j.id] = b;
    }
    // A corrupt optional job cannot replace or invalidate a farm. Verify the full
    // session by replaying its bounded action log from its immutable seed/settings.
    const a = raw.active;
    if (
      a &&
      catalog.some((j) => j.id === a.id) &&
      Number.isSafeInteger(a.seed) &&
      a.seed > 0 &&
      a.seed <= 0xffffffff &&
      ["little", "growing"].includes(a.mode) &&
      Number.isSafeInteger(a.serial) &&
      a.serial <= out.sequence &&
      a.serial > 0 &&
      Array.isArray(a.log) &&
      a.log.length <= 3000
    ) {
      try {
        const restored = make(
          a.id,
          a.mode,
          a.seed,
          a.serial,
          [2, 3, 4, 5].includes(a.rulesVersion) ? a.rulesVersion : 1,
          a.wordPlan,
          { picturePlan: a.picturePlan, stackLevel: a.stackLevel },
        );
        for (const entry of a.log) {
          if (entry.type === "tick") tickActive(restored, entry.ms);
          else apply(restored, entry);
          restored.log.push(copy(entry));
        }
        out.active = restored;
      } catch {
        /* Keep wallet/cooldowns; only discard an unrecoverable optional session. */
      }
    }
    return out;
  }
  function available(s, id, now = Date.now()) {
    return Math.max(0, (s.jobs?.cooldowns[id] || 0) - now);
  }
  function start(
    s,
    id,
    now = Date.now(),
    seed = Math.floor(Math.random() * 0xffffffff) + 1,
  ) {
    requireRule(
      catalog.some((j) => j.id === id),
      "Choose a neighborhood job.",
    );
    requireRule(
      !available(s, id, now),
      "This neighbor is resting. Try another job.",
    );
    s.jobs ||= empty();
    if (s.jobs.active?.id === id) return s.jobs.active;
    requireRule(!s.jobs.active, "Resume your current job or leave it first.");
    s.jobs.sequence++;
    const mode = s.learningExperience === "little" ? "little" : "growing";
    const plan = ["words", "labels"].includes(id)
      ? V.choose(mode, id, seed, s.jobs.wordHistory?.[mode] || [])
      : undefined;
    s.jobs.active = make(
      id,
      s.learningExperience === "little" ? "little" : "growing",
      seed >>> 0 || 1,
      s.jobs.sequence,
      ["sliding", "tidy"].includes(id)
        ? 5
        : ["weeds", "tomatoes", "stacks", "hidden"].includes(id)
          ? 4
          : 3,
      plan,
      {
        picturePlan: ["hidden", "sliding"].includes(id)
          ? Pictures.plan(id, seed, s.jobs.pictureHistory?.[id] || [])
          : undefined,
        stackLevel:
          mode === "little"
            ? Math.min(
                2,
                Math.floor((s.jobs.completed?.["stacks|little"] || 0) / 3),
              )
            : 0,
      },
    );
    if (["hidden", "sliding"].includes(id)) {
      s.jobs.pictureHistory ||= { hidden: [], sliding: [] };
      s.jobs.pictureHistory[id] = [
        ...(s.jobs.pictureHistory[id] || []),
        s.jobs.active.data.scene,
      ].slice(-(Pictures.count(id) - 1));
    }
    if (plan) {
      s.jobs.wordHistory ||= { little: [], growing: [] };
      s.jobs.wordHistory[mode] = [
        ...(s.jobs.wordHistory[mode] || []),
        ...plan,
      ].slice(-24);
    }
    return s.jobs.active;
  }
  function make(
    id,
    mode,
    seed,
    serial,
    rulesVersion = 3,
    wordPlan,
    options = {},
  ) {
    const r = rng(seed),
      little = mode === "little",
      n = little ? 2 : 4;
    const a = {
      id,
      rulesVersion,
      mode,
      seed,
      serial,
      log: [],
      elapsed: 0,
      score: 0,
      won: false,
      ended: false,
      data: {},
    };
    if (rulesVersion >= 3 && ["words", "labels"].includes(id)) {
      requireRule(V.valid(wordPlan, mode, id), "This word plan is incomplete.");
      a.wordPlan = wordPlan.slice();
    }
    if (["hidden", "sliding"].includes(id)) {
      requireRule(
        rulesVersion >= 4 && Pictures.validPlan(id, options.picturePlan),
        "Choose a valid picture collection.",
      );
      a.picturePlan = options.picturePlan.slice();
      a.data = Pictures.make(id, mode, seed, a.picturePlan, 0, rulesVersion);
      return a;
    }
    if (id === "stacks" && rulesVersion >= 4) {
      a.stackLevel = Number.isInteger(options.stackLevel)
        ? Math.max(0, Math.min(2, options.stackLevel))
        : 0;
      a.data = Stacks.make(seed, mode, a.stackLevel);
      return a;
    }
    if (id === "words") {
      const words =
          rulesVersion >= 3
            ? wordPlan.slice()
            : little
              ? ["SUN", "POT", "MUD"]
              : shuffle(
                  ["CARROT", "GARDEN", "TOMATO", "HARVEST", "BEANS", "CORN"],
                  r,
                ).slice(0, 4),
        size = little
          ? 5
          : rulesVersion >= 3
            ? Math.max(8, ...words.map((w) => w.length))
            : 8,
        grid = Array(size * size).fill(""),
        paths = {};
      const dirs = little
        ? [
            [1, 0],
            [0, 1],
          ]
        : [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 1],
            [-1, -1],
            [1, -1],
            [-1, 1],
          ];
      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        let placed = false;
        for (let tries = 0; tries < 120 && !placed; tries++) {
          const [dx, dy] = dirs[Math.floor(r() * dirs.length)],
            x = Math.floor(r() * size),
            y = Math.floor(r() * size),
            path = Array.from(word, (_, i) => [x + i * dx, y + i * dy]);
          if (
            path.every(
              ([cx, cy], i) =>
                cx >= 0 &&
                cy >= 0 &&
                cx < size &&
                cy < size &&
                (!grid[cy * size + cx] || grid[cy * size + cx] === word[i]),
            )
          ) {
            paths[word] = path.map(([cx, cy]) => cy * size + cx);
            paths[word].forEach((p, i) => (grid[p] = word[i]));
            placed = true;
          }
        }
        if (!placed) {
          // Restart deterministic fallback, guaranteed distinct horizontal rows.
          grid.fill("");
          words.forEach((v, row) => {
            paths[v] = Array.from(v, (_, i) => row * size + i);
            paths[v].forEach((p, i) => (grid[p] = v[i]));
          });
          break;
        }
      }
      for (let i = 0; i < grid.length; i++)
        if (!grid[i])
          grid[i] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(r() * 26)];
      a.data = { size, grid, paths, words, found: [] };
    } else if (id === "packing") {
      a.data = {
        kinds: kinds.slice(0, little ? 2 : 4),
        items: Array.from(
          { length: little ? 8 : 12 },
          () => kinds[Math.floor(r() * (little ? 2 : 4))],
        ),
        sorted: [],
        ...(rulesVersion >= 2 ? { arrivals: [0, 0, 0] } : {}),
      };
    } else if (id === "stacks") {
      const types = little ? 2 : 3,
        cap = little ? 3 : 4,
        crates = Array.from({ length: types + 2 }, (_, i) =>
          i < types ? Array(cap).fill(kinds[i]) : [],
        ),
        reverse = [];
      for (let step = 0; step < 40; step++) {
        const options = [];
        for (let from = 0; from < crates.length; from++)
          for (let to = 0; to < crates.length; to++)
            if (
              from !== to &&
              crates[from].length &&
              crates[to].length < cap &&
              (crates[from].length === 1 ||
                crates[from].at(-1) === crates[from].at(-2))
            )
              options.push([from, to]);
        if (!options.length) break; // The reversed moves already form a valid solution.
        const [from, to] = options[Math.floor(r() * options.length)];
        crates[to].push(crates[from].pop());
        reverse.unshift([to, from]);
      }
      if (sorted(crates, cap)) {
        const from = crates.findIndex((c) => c.length),
          to = crates.findIndex((c) => !c.length);
        crates[to].push(crates[from].pop());
        reverse.unshift([to, from]);
      }
      a.data = {
        cap,
        crates,
        initial: copy(crates),
        undo: [],
        solution: reverse,
      };
    } else if (id === "labels") {
      const words =
        rulesVersion >= 3
          ? wordPlan.slice()
          : shuffle(
              little
                ? ["SUN", "POT", "MUD", "DIG"]
                : ["CORN", "BEANS", "CARROT", "TOMATO", "GARDEN", "HARVEST"],
              r,
            ).slice(0, little ? 2 : 3);
      a.data = { words, round: 0, tiles: [], slots: [], hints: 0 };
      letterRound(a, r);
    } else if (id === "match") {
      a.data = {
        size: 6,
        types: little ? 3 : 5,
        grid: [],
        target: little ? 80 : 160,
        turn: 0,
      };
      a.data.grid = board(a.data.types, r);
    } else if (id === "catch") {
      a.data = {
        basket: 0.65,
        width: little ? 0.3 : 0.22,
        target: little ? 8 : 14,
        caught: [],
        missed: [],
        launchEvery: little ? 2300 : 1500,
      };
    } else if (id === "weeds") {
      a.data =
        rulesVersion >= 3
          ? {
              items: Array.from({ length: little ? 20 : 25 }, (_, i) => ({
                kind: i % 5 === 4 ? "plant" : "weed",
                done: false,
                cluster: Math.floor(i / 5),
              })),
              target: little ? 16 : 20,
            }
          : {
              items: shuffle(
                Array.from({ length: little ? 10 : 14 }, (_, i) => ({
                  kind: i % 2 ? "plant" : "weed",
                  done: false,
                })),
                r,
              ),
              target: little ? 5 : 7,
            };
    } else if (id === "tomatoes") {
      a.data =
        rulesVersion >= 4
          ? {
              target: 20,
              items: [0, 3, 2, 4, 1, 0, 4, 1, 2, 3].flatMap((count, plant) =>
                shuffle(
                  Array.from({ length: 4 }, (_, slot) => ({
                    kind: slot < count ? "ripe" : "green",
                    done: false,
                    plant,
                  })),
                  r,
                ),
              ),
            }
          : {
              items: shuffle(
                Array.from({ length: 12 }, (_, i) => ({
                  kind: i < 8 ? "ripe" : "green",
                  done: false,
                })),
                r,
              ),
              target: little ? 4 : 6,
            };
    } else if (id === "flowers") {
      a.data = {
        items: Array.from(
          { length: rulesVersion >= 2 ? (little ? 9 : 12) : little ? 4 : 6 },
          () => ({
            kind: "flower",
            done: false,
          }),
        ),
        target: rulesVersion >= 2 ? (little ? 9 : 12) : little ? 4 : 6,
      };
    } else if (id === "tidy") {
      a.data =
        rulesVersion >= 3
          ? Lawn.make(mode, rulesVersion)
          : {
              items: shuffle(
                Array.from({ length: little ? 6 : 10 }, (_, i) => ({
                  kind: i % 2 ? "stick" : "leaf",
                  done: false,
                })),
                r,
              ),
              target: little ? 6 : 10,
            };
    }
    return a;
  }
  function sorted(crates, cap) {
    return crates.every(
      (c) => !c.length || (c.length === cap && c.every((v) => v === c[0])),
    );
  }
  function letterRound(a, r = rng(a.seed + a.data.round + 17)) {
    const word = a.data.words[a.data.round];
    a.data.tiles = shuffle([...word], r);
    if (a.data.tiles.join("") === word) a.data.tiles.push(a.data.tiles.shift());
    a.data.slots = a.rulesVersion >= 3 ? Array(word.length).fill(null) : [];
    a.data.hints = 0;
  }
  function matches(grid, size = 6) {
    const found = new Set();
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
        ]) {
          const run = [];
          for (
            let k = 0;
            x + k * dx < size &&
            y + k * dy < size &&
            grid[(y + k * dy) * size + x + k * dx] === grid[y * size + x] &&
            grid[y * size + x] !== null;
            k++
          )
            run.push((y + k * dy) * size + x + k * dx);
          if (run.length >= 4) run.forEach((i) => found.add(i));
        }
    return [...found];
  }
  function moves(grid, size = 6) {
    const found = [];
    for (let i = 0; i < grid.length; i++)
      for (const j of [
        i % size < size - 1 ? i + 1 : -1,
        i + size < grid.length ? i + size : -1,
      ])
        if (j >= 0 && grid[i] !== grid[j]) {
          const g = grid.slice();
          [g[i], g[j]] = [g[j], g[i]];
          if (matches(g, size).length) found.push([i, j]);
        }
    return found;
  }
  function board(types, r) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const grid = Array.from({ length: 36 }, () => Math.floor(r() * types));
      if (!matches(grid).length && moves(grid).length) return grid;
    }
    const g = Array.from(
      { length: 36 },
      (_, i) => (Math.floor(i / 6) + (i % 6)) % types,
    );
    g[0] = g[1] = g[3] = g[8] = 0;
    g[2] = 1;
    return g;
  }
  function carrot(a, index) {
    const r = rng(a.seed + index * 917),
      little = a.mode === "little",
      launch = index * a.data.launchEvery,
      flight = little ? 2600 : 2000,
      start = 0.22,
      end = 0.36 + r() * 0.58;
    return { index, launch, flight, start, end, big: index % 7 === 6 };
  }
  function packingFronts(a) {
    return [0, 1, 2].map((lane) =>
      a.data.items.findIndex(
        (_, i) => i % 3 === lane && !a.data.sorted.includes(i),
      ),
    );
  }
  function packingProgress(a, lane) {
    return Math.min(
      1,
      Math.max(
        0,
        (a.elapsed - (a.data.arrivals?.[lane] || 0)) /
          (a.mode === "little" ? 6500 : 4000),
      ),
    );
  }
  function flowerPlots(a) {
    const r = rng(a.seed + 913),
      positions = shuffle(
        Array.from({ length: 36 }, (_, i) => i),
        r,
      ),
      map = new Map(a.data.items.map((_, i) => [positions[i], i]));
    return Array.from({ length: 36 }, (_, p) =>
      map.has(p)
        ? { kind: "flower", item: map.get(p) }
        : { kind: p % 7 === 0 ? "path" : p % 3 ? "grass" : "soil" },
    );
  }
  function matchPoints(size, cascade = 0) {
    return size * 10 + Math.max(0, size - 4) * 15 + cascade * 20;
  }
  function carrotPose(a, c, time = a.elapsed) {
    const t = Math.max(0, Math.min(1, (time - c.launch) / c.flight)),
      end = a.rulesVersion >= 2 ? 0.92 : 0.78;
    return {
      t,
      x: c.start + (c.end - c.start) * t,
      y: 0.45 + (end - 0.45) * t - 1.35 * t * (1 - t),
    };
  }
  function catchTime(a, c) {
    if (a.rulesVersion < 2) return c.launch + c.flight;
    const b = 0.92 - 0.45 - 1.35,
      t = (-b + Math.sqrt(b * b - 4 * 1.35 * (0.45 - 0.78))) / (2 * 1.35);
    return c.launch + Math.round(c.flight * t);
  }
  function canCatch(a, c) {
    const x = carrotPose(a, c, catchTime(a, c)).x;
    return a.rulesVersion >= 2
      ? Math.abs(a.data.basket - x) <=
          a.data.width * 0.41 + (c.big ? 0.05 : 0.035)
      : Math.abs(a.data.basket - c.end) < a.data.width / 2 + 0.04;
  }
  function clockLimit(a) {
    return a.id === "match" && a.rulesVersion < 3
      ? 120000
      : duration[a.id] || 0;
  }
  function tickActive(a, ms) {
    requireRule(
      Number.isInteger(ms) && ms >= 0 && ms <= 120000,
      "Invalid activity clock.",
    );
    if (a.ended) return;
    const before = a.elapsed;
    if (["hidden", "sliding"].includes(a.id) && !a.data.started) return;
    a.elapsed = Math.min(clockLimit(a) || 1e9, a.elapsed + ms);
    if (a.id === "catch") {
      for (let i = 0; i < Math.ceil(60000 / a.data.launchEvery); i++) {
        const c = carrot(a, i);
        const at = catchTime(a, c);
        if (
          at > before &&
          at <= a.elapsed &&
          !a.data.caught.includes(i) &&
          canCatch(a, c)
        ) {
          a.data.caught.push(i);
          a.score += c.big ? 2 : 1;
        }
        if (
          c.launch + c.flight > before &&
          c.launch + c.flight <= a.elapsed &&
          !a.data.caught.includes(i) &&
          !a.data.missed.includes(i)
        )
          a.data.missed.push(i);
      }
    }
    if (clockLimit(a) && a.elapsed >= clockLimit(a)) {
      a.ended = true;
      a.won = a.score >= a.data.target;
    }
  }
  function apply(a, e) {
    requireRule(!a.ended, "This round has finished.");
    const d = a.data;
    if (["hidden", "sliding"].includes(a.id)) return Pictures.apply(a, e);
    if (a.rulesVersion >= 3 && a.id === "tidy") return Lawn.apply(a, e);
    if (
      a.rulesVersion >= 3 &&
      a.id === "labels" &&
      ["letter", "removeLetter", "returnLetter"].includes(e.type)
    ) {
      if (e.type === "removeLetter") {
        requireRule(
          Number.isInteger(e.slot) && e.slot >= 0 && e.slot < d.slots.length,
          "Choose a letter slot.",
        );
        if (d.slots[e.slot] === null) return false;
        d.slots[e.slot] = null;
      } else {
        requireRule(
          Number.isInteger(e.tile) && e.tile >= 0 && e.tile < d.tiles.length,
          "Choose a letter.",
        );
        const from = d.slots.indexOf(e.tile);
        if (e.type === "returnLetter") {
          if (from < 0) return false;
          d.slots[from] = null;
          return true;
        }
        const slot = e.slot === undefined ? d.slots.indexOf(null) : e.slot;
        requireRule(
          Number.isInteger(slot) && slot >= 0 && slot < d.slots.length,
          "Choose a letter slot.",
        );
        if (from === slot) return false;
        const other = d.slots[slot];
        if (from >= 0) d.slots[from] = other;
        d.slots[slot] = e.tile;
      }
      if (
        d.slots.every((x) => x !== null) &&
        d.slots.map((i) => d.tiles[i]).join("") === d.words[d.round]
      ) {
        a.score++;
        d.round++;
        if (d.round === d.words.length) {
          a.won = true;
          a.ended = true;
        } else letterRound(a);
      }
      return true;
    }
    if (e.type === "word") {
      requireRule(
        a.id === "words" && Array.isArray(e.path),
        "Select a straight word.",
      );
      const key = d.words.find(
        (w) =>
          JSON.stringify(d.paths[w]) === JSON.stringify(e.path) ||
          JSON.stringify(d.paths[w].slice().reverse()) ===
            JSON.stringify(e.path),
      );
      if (!key) return false;
      if (!d.found.includes(key)) d.found.push(key);
      a.score = d.found.length;
      a.won = d.found.length === d.words.length;
    } else if (e.type === "pack") {
      requireRule(
        a.id === "packing" &&
          Number.isInteger(e.item) &&
          e.item >= 0 &&
          e.item < d.items.length,
        "Choose a vegetable.",
      );
      if (d.sorted.includes(e.item) || d.items[e.item] !== e.target)
        return false;
      if (a.rulesVersion >= 2 && !packingFronts(a).includes(e.item))
        return false;
      d.sorted.push(e.item);
      if (d.arrivals) d.arrivals[e.item % 3] = a.elapsed;
      a.score = d.sorted.length;
      a.won = a.score === d.items.length;
    } else if (e.type === "stack") {
      requireRule(
        a.id === "stacks" &&
          Number.isInteger(e.from) &&
          Number.isInteger(e.to) &&
          d.crates[e.from] &&
          d.crates[e.to],
        "Choose two crates.",
      );
      const from = d.crates[e.from],
        to = d.crates[e.to];
      if (
        e.from === e.to ||
        !from.length ||
        to.length >= d.cap ||
        (to.length && to.at(-1) !== from.at(-1))
      )
        return false;
      d.undo.push(copy(d.crates));
      if (d.undo.length > (a.rulesVersion >= 4 ? 500 : 100)) d.undo.shift();
      to.push(from.pop());
      a.won = sorted(d.crates, d.cap);
      a.score++;
    } else if (e.type === "undo") {
      requireRule(a.id === "stacks", "Undo is for crates.");
      if (d.undo.length) d.crates = d.undo.pop();
    } else if (e.type === "restart") {
      requireRule(a.id === "stacks", "Restart is for crates.");
      d.crates = copy(d.initial);
      d.undo = [];
      a.score = 0;
    } else if (e.type === "letter") {
      requireRule(
        a.id === "labels" &&
          Number.isInteger(e.tile) &&
          e.tile >= 0 &&
          e.tile < d.tiles.length,
        "Choose a letter.",
      );
      if (d.slots.includes(e.tile)) return false;
      d.slots.push(e.tile);
      if (
        d.slots.length === d.tiles.length &&
        d.slots.map((i) => d.tiles[i]).join("") === d.words[d.round]
      ) {
        a.score++;
        d.round++;
        if (d.round === d.words.length) a.won = true;
        else letterRound(a);
      }
    } else if (e.type === "removeLetter") {
      requireRule(
        a.id === "labels" && Number.isInteger(e.slot),
        "Choose a letter slot.",
      );
      d.slots.splice(e.slot, 1);
    } else if (e.type === "hint") {
      requireRule(a.id === "labels", "Hints are for labels.");
      d.hints = Math.min(d.tiles.length, d.hints + 1);
    } else if (e.type === "swap") {
      requireRule(
        a.id === "match" &&
          Number.isInteger(e.from) &&
          Number.isInteger(e.to) &&
          e.from >= 0 &&
          e.to >= 0 &&
          e.from < 36 &&
          e.to < 36 &&
          (Math.abs(e.from - e.to) === 6 ||
            (Math.floor(e.from / 6) === Math.floor(e.to / 6) &&
              Math.abs(e.from - e.to) === 1)),
        "Swap neighboring vegetables.",
      );
      const grid = d.grid.slice();
      [grid[e.from], grid[e.to]] = [grid[e.to], grid[e.from]];
      if (!matches(grid).length) return false;
      d.grid = grid;
      if (a.rulesVersion >= 2) {
        d.chain =
          d.lastMatchAt !== undefined && a.elapsed - d.lastMatchAt <= 15000
            ? Math.min(5, (d.chain || 1) + 1)
            : 1;
        d.lastMatchAt = a.elapsed;
        d.bursts = [];
      }
      const r = rng(a.seed + ++d.turn * 371);
      for (let pass = 0; pass < 20; pass++) {
        const hit = matches(d.grid);
        if (!hit.length) break;
        const points =
          a.rulesVersion >= 2
            ? matchPoints(hit.length, pass) +
              (pass === 0 ? (d.chain - 1) * 10 : 0)
            : hit.length * 10;
        if (a.rulesVersion >= 2)
          d.bursts.push({
            grid: d.grid.slice(),
            cells: hit.slice(),
            points,
            cascade: pass,
            chain: d.chain,
          });
        a.score += points;
        hit.forEach((i) => (d.grid[i] = null));
        for (let x = 0; x < 6; x++) {
          const col = Array.from(
            { length: 6 },
            (_, y) => d.grid[y * 6 + x],
          ).filter((v) => v !== null);
          while (col.length < 6) col.unshift(Math.floor(r() * d.types));
          col.forEach((v, y) => (d.grid[y * 6 + x] = v));
        }
      }
      if (matches(d.grid).length || !moves(d.grid).length)
        d.grid = board(d.types, r);
    } else if (e.type === "basket") {
      requireRule(
        a.id === "catch" && Number.isFinite(e.x),
        "Move your basket.",
      );
      d.basket = Math.max(d.width / 2, Math.min(1 - d.width / 2, e.x));
    } else if (e.type === "chore") {
      requireRule(
        ["weeds", "tomatoes", "flowers", "tidy"].includes(a.id) &&
          Number.isInteger(e.item) &&
          d.items[e.item],
        "Choose something in the yard.",
      );
      const item = d.items[e.item];
      if (item.done) return false;
      const good =
        a.id === "weeds"
          ? item.kind === "weed"
          : a.id === "tomatoes"
            ? item.kind === "ripe"
            : a.id === "tidy"
              ? item.kind === e.target
              : true;
      if (!good) return false;
      item.done = true;
      a.score++;
      a.won = a.score === d.target;
    } else throw Error("Unknown job action.");
    if (a.won && !clockLimit(a)) a.ended = true;
    return true;
  }
  function action(s, e) {
    const a = s.jobs?.active;
    requireRule(a, "Start a job first.");
    requireRule(a.log.length < 3000, "Take a break and restart this activity.");
    const success = apply(a, e);
    if (success) {
      a.log.push(copy(e));
      if (e.type === "nextPicture")
        s.jobs.pictureHistory[a.id] = [
          ...(s.jobs.pictureHistory[a.id] || []),
          a.data.scene,
        ].slice(-(Pictures.count(a.id) - 1));
    }
    return success;
  }
  function tick(s, ms) {
    const a = s.jobs?.active;
    if (!a || a.ended) return;
    ms = Math.max(0, Math.min(120000, Math.round(ms)));
    tickActive(a, ms);
    if (a.ended) s.jobs.best[a.id] = Math.max(s.jobs.best[a.id] || 0, a.score);
    if (a.ended && !a.won) Records.record(s.jobs, a, Date.now());
    const last = a.log.at(-1);
    if (last?.type === "tick" && last.ms + ms <= 120000) last.ms += ms;
    else a.log.push({ type: "tick", ms });
  }
  function claim(s, now = Date.now()) {
    const a = s.jobs?.active;
    requireRule(a?.won && a.ended, "Finish this job first.");
    requireRule(!available(s, a.id, now), "This job has already paid.");
    const record = Records.record(s.jobs, a, now);
    s.jobs.completed ||= {};
    const completeKey = a.id + "|" + a.mode;
    s.jobs.completed[completeKey] = (s.jobs.completed[completeKey] || 0) + 1;
    if (["hidden", "sliding"].includes(a.id)) {
      s.jobs.pictureCompleted ||= { hidden: [], sliding: [] };
      s.jobs.pictureCompleted[a.id] = [
        ...new Set([...(s.jobs.pictureCompleted[a.id] || []), a.data.scene]),
      ];
    }

    s.cash = (Math.round(s.cash * 100) + record.rewardCents) / 100;
    s.jobs.cooldowns[a.id] = now + cooldownMs;
    s.jobs.best[a.id] = Math.max(s.jobs.best[a.id] || 0, a.score);
    const result = {
      id: a.id,
      score: a.score,
      best: s.jobs.best[a.id],
      ...record,
    };
    s.jobs.active = null;
    return result;
  }
  function quit(s) {
    if (s.jobs) s.jobs.active = null;
  }
  function instructions(a) {
    if (a.id === "tidy" && a.rulesVersion < 3)
      return "Move leaves and sticks into their matching containers.";
    const text = catalog.find((j) => j.id === a.id)?.instructions || "";
    return a.id === "match" && a.rulesVersion < 3
      ? text.replace("ninety seconds", "two minutes")
      : text;
  }
  const api = {
    instructions,
    clockLimit,
    recordSpec: Records.spec,
    result: Records.assess,
    kinds,
    packingFronts,
    packingProgress,
    flowerPlots,
    matchPoints,
    carrotPose,
    catchTime,
    canCatch,
    catalog,
    empty,
    recover,
    start,
    available,
    action,
    tick,
    claim,
    quit,
    carrot,
    matches,
    moves,
    duration,
    cooldownMs,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.NeighborhoodJobs = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
