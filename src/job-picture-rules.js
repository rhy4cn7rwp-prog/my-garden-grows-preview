/* Serializable original-image games. Visual gestures never mutate farm systems. */
(function (root) {
  "use strict";
  const Gallery =
    typeof module !== "undefined"
      ? require("./job-gallery-data.js")
      : root.JobGallery;
  const random = (seed) => () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function shuffle(a, r) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function plan(id, seed, history = []) {
    const list = shuffle(
      Gallery[id].map((_, i) => i),
      random(seed),
    );
    return list.sort((a, b) => history.lastIndexOf(a) - history.lastIndexOf(b));
  }
  function validPlan(id, p) {
    return (
      Array.isArray(p) &&
      p.length >= 30 &&
      p.length <= Gallery[id].length &&
      new Set(p).size === p.length &&
      p.every((i) => Number.isInteger(i) && i >= 0 && i < Gallery[id].length)
    );
  }
  function adjacent(size, cell, rows = size) {
    return [
      cell % size ? cell - 1 : -1,
      cell % size < size - 1 ? cell + 1 : -1,
      cell - size,
      cell + size,
    ].filter((i) => i >= 0 && i < size * rows);
  }
  function distance(tiles, size) {
    return tiles.reduce(
      (n, v, i) =>
        v === null
          ? n
          : n +
            Math.abs((v % size) - (i % size)) +
            Math.abs(Math.floor(v / size) - Math.floor(i / size)),
      0,
    );
  }
  function scramble(seed, size) {
    const r = random(seed),
      count = size * size;
    for (let attempt = 0; attempt < 80; attempt++) {
      const tiles = Array.from({ length: count }, (_, i) =>
          i === count - 1 ? null : i,
        ),
        reverse = [];
      let hole = count - 1,
        last = -1;
      for (let step = 0; step < (size === 3 ? 42 : 160); step++) {
        const options = adjacent(size, hole).filter((i) => i !== last),
          from = options[Math.floor(r() * options.length)],
          old = hole;
        [tiles[hole], tiles[from]] = [tiles[from], tiles[hole]];
        reverse.unshift(old);
        last = old;
        hole = from;
      }
      const minimumDistance = distance(tiles, size),
        misplaced = tiles.filter((v, i) => v !== null && v !== i).length;
      if (
        minimumDistance >= (size === 3 ? 8 : 24) &&
        misplaced >= (size === 3 ? 6 : 12)
      )
        return {
          tiles,
          initial: tiles.slice(),
          solution: reverse,
          minimumDistance,
        };
    }
    // Seed 1 is a verified nontrivial legal scramble in both grid sizes.
    // An exceptionally unlucky seed falls back without losing the session.
    return scramble(1, size);
  }
  // Only new rule-version-five games use these gentler rectangular scrambles.
  function rectangularScramble(seed, cols, rows) {
    const r = random(seed),
      count = cols * rows,
      steps = cols === 2 ? 12 : 24;
    for (let attempt = 0; attempt < 100; attempt++) {
      const tiles = Array.from({ length: count }, (_, i) =>
          i === count - 1 ? null : i,
        ),
        solution = [];
      let hole = count - 1,
        last = -1;
      for (let k = 0; k < steps; k++) {
        const options = adjacent(cols, hole, rows).filter((i) => i !== last),
          from = options[Math.floor(r() * options.length)];
        [tiles[hole], tiles[from]] = [tiles[from], tiles[hole]];
        solution.unshift(hole);
        last = hole;
        hole = from;
      }
      const minimumDistance = distance(tiles, cols);
      if (
        minimumDistance >= (cols === 2 ? 4 : 6) &&
        minimumDistance <= (cols === 2 ? 8 : 12)
      )
        return { tiles, initial: tiles.slice(), solution, minimumDistance };
    }
    return rectangularScramble(1, cols, rows);
  }
  function make(id, mode, seed, picturePlan, choice = 0, rulesVersion = 4) {
    if (!validPlan(id, picturePlan))
      throw Error("The picture collection is not ready.");
    const scene = picturePlan[choice % picturePlan.length],
      r = random(seed + choice * 3547),
      base = { scene, choice, started: false, hints: 0, assisted: false };
    if (id === "hidden") {
      const objects = Gallery.hidden[scene].objects;
      if (objects.length < 12)
        throw Error("This seek-and-find illustration is still being prepared.");
      const easiest = objects
        .map((_, i) => i)
        .sort(
          (a, b) => objects[b].w * objects[b].h - objects[a].w * objects[a].h,
        )
        .slice(0, 8);
      return {
        ...base,
        targets: shuffle(
          mode === "little" ? easiest : objects.map((_, i) => i),
          r,
        ).slice(0, mode === "little" ? 5 : 10 + Math.floor(r() * 3)),
        found: [],
      };
    }
    const modern = rulesVersion >= 5;
    const size = modern
      ? mode === "little"
        ? 2
        : 3
      : mode === "little"
        ? 3
        : 4;
    const rows = modern ? 3 : size;
    return {
      ...base,
      size,
      ...(modern
        ? rectangularScramble(seed + choice * 3547, size, rows)
        : scramble(seed + choice * 3547, size)),
      ...(modern ? { cols: size, rows } : {}),
      moves: 0,
      lastMove: null,
      preview: mode === "little",
      assisted: mode === "little",
    };
  }
  function apply(a, e) {
    const d = a.data;
    if (e.type === "pictureBegin") {
      if (d.started) return false;
      d.started = true;
      return true;
    }
    if (e.type === "nextPicture") {
      if (d.started) return false;
      a.data = make(
        a.id,
        a.mode,
        a.seed,
        a.picturePlan,
        d.choice + 1,
        a.rulesVersion,
      );
      a.score = 0;
      return true;
    }
    if (e.type === "picturePreview") {
      if (a.id !== "sliding") return false;
      d.preview = !d.preview;
      if (d.preview) d.assisted = true;
      return true;
    }
    if (e.type === "pictureHint") {
      if (!d.started) return false;
      d.assisted = true;
      d.hints++;
      if (a.id === "hidden") {
        const remaining = d.targets.filter((i) => !d.found.includes(i));
        d.hint = remaining[(d.hints - 1) % remaining.length];
      } else {
        const wrong = d.tiles.filter((v, i) => v !== null && v !== i);
        d.hintTile = wrong[(d.hints - 1) % wrong.length];
      }
      return true;
    }
    if (!d.started) return false;
    if (e.type === "findObject") {
      if (
        a.id !== "hidden" ||
        !Number.isInteger(e.item) ||
        !d.targets.includes(e.item) ||
        d.found.includes(e.item)
      )
        return false;
      d.found.push(e.item);
      if (d.hint === e.item) delete d.hint;
      a.score = d.found.length;
      a.won = a.score === d.targets.length;
    } else if (e.type === "slide") {
      if (a.id !== "sliding" || !Number.isInteger(e.cell)) return false;
      const hole = d.tiles.indexOf(null);
      if (!adjacent(d.cols || d.size, hole, d.rows || d.size).includes(e.cell))
        return false;
      const tile = d.tiles[e.cell];
      [d.tiles[hole], d.tiles[e.cell]] = [d.tiles[e.cell], d.tiles[hole]];
      d.moves++;
      d.lastMove = { tile, from: e.cell, to: hole };
      a.score = d.tiles.filter((v, i) => v === i).length;
      a.won = d.tiles.every((v, i) =>
        i === d.tiles.length - 1 ? v === null : v === i,
      );
    } else if (e.type === "pictureRestart") {
      if (a.id !== "sliding") return false;
      d.tiles = d.initial.slice();
      d.moves = 0;
      d.lastMove = null;
      a.score = 0;
    } else return false;
    if (a.won) a.ended = true;
    return true;
  }
  const count = (id) => Gallery[id].length;
  const api = {
    count,
    plan,
    validPlan,
    make,
    apply,
    adjacent,
    distance,
    scramble,
    rectangularScramble,
  };
  if (typeof module !== "undefined") module.exports = api;
  root.JobPictureRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
