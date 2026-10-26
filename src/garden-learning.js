/* Educational Garden rules. Seeded questions and small resumable records; no DOM,
   clocks, money, inventory or crop mutation. Game alone awards harvest bonuses. */
(function (root) {
  "use strict";
  const words = [
    ["sun", "sunn"],
    ["seed", "sead"],
    ["leaf", "leef"],
    ["rain", "rane"],
    ["farm", "farn"],
    ["water", "watter"],
    ["green", "grean"],
    ["plant", "plent"],
    ["garden", "gardin"],
    ["carrot", "carot"],
    ["tomato", "tomatoe"],
    ["flower", "flowur"],
    ["basket", "baskit"],
    ["onion", "onyon"],
    ["market", "markit"],
    ["potato", "potatoe"],
    ["lettuce", "letuce"],
    ["harvest", "harvist"],
    ["cucumber", "cucumbar"],
    ["strawberry", "strawbery"],
    ["sunshine", "sunshyne"],
    ["vegetable", "vegtable"],
    ["watering", "wattering"],
    ["tomatoes", "tomatos"],
  ];
  function count(s) {
    return Math.max(
      Number.isSafeInteger(s.dreamPurchaseCount) ? s.dreamPurchaseCount : 0,
      Object.values(s.dreamPurchases || {}).filter((p) => p?.owned === true)
        .length,
    );
  }
  function level(s) {
    return Math.min(5, Math.floor(count(s) / 2));
  }
  function cycle(s) {
    return Math.floor(((s.season - 1) * 20 + s.day) / 5);
  }
  function empty() {
    return { version: 1, completedCycle: 0, nextType: "math", session: null };
  }
  function recover(s) {
    const raw = s.weedingLesson,
      out = empty(),
      current = cycle(s);
    if (!raw || raw.version !== 1) {
      // Preserve already-earned legacy bonuses; don't invent lesson progress.
      if (s.gardenWeeding?.pulled?.length === 6)
        out.completedCycle = Math.min(
          current,
          Math.floor(s.gardenWeeding.day / 5),
        );
      return out;
    }
    if (
      Number.isSafeInteger(raw.completedCycle) &&
      raw.completedCycle >= 0 &&
      raw.completedCycle <= current
    )
      out.completedCycle = raw.completedCycle;
    out.nextType = raw.nextType === "spelling" ? "spelling" : "math";
    const a = raw.session;
    if (
      a &&
      a.cycle === current &&
      current > out.completedCycle &&
      ["math", "spelling"].includes(a.type) &&
      Number.isInteger(a.seed) &&
      a.seed > 0 &&
      a.seed <= 0xffffffff &&
      Number.isInteger(a.level) &&
      a.level >= 0 &&
      a.level <= 5 &&
      Number.isInteger(a.roundCount) &&
      a.roundCount >= 1 &&
      a.roundCount <= 3 &&
      Number.isInteger(a.round) &&
      a.round >= 0 &&
      a.round < a.roundCount
    ) {
      out.session = {
        cycle: current,
        type: a.type,
        seed: a.seed,
        level: a.level,
        roundCount: a.roundCount,
        round: a.round,
        removed: Array.isArray(a.removed)
          ? [
              ...new Set(
                a.removed.filter((n) => Number.isInteger(n) && n >= 0 && n < 4),
              ),
            ]
          : [],
        mistakes:
          Number.isSafeInteger(a.mistakes) && a.mistakes >= 0
            ? Math.min(a.mistakes, 999)
            : 0,
      };
      const items = questions(out.session);
      out.session.removed = out.session.removed.filter(
        (i) => !items[i].correct,
      );
      // An impossible fully-cleared unfinished round is safely replayed, never auto-awarded.
      if (items.every((q, i) => q.correct || out.session.removed.includes(i)))
        out.session.removed = [];
    }
    return out;
  }
  function status(s) {
    const c = cycle(s),
      record = s.weedingLesson || empty(),
      bonus = s.plots.some((p) => p?.weedingBonus === true),
      complete = c > 0 && record.completedCycle === c,
      days = 5 - (((s.season - 1) * 20 + s.day) % 5);
    return {
      cycle: c,
      available: c > 0 && !complete && !bonus && s.plots.some(Boolean),
      bonus,
      complete,
      days,
      type: record.session?.cycle === c ? record.session.type : record.nextType,
    };
  }
  function start(s, seed = Math.floor(Math.random() * 0xffffffff) + 1) {
    if (!status(s).available) throw Error("Weeding is not available just now.");
    const r = (s.weedingLesson ||= empty()),
      c = cycle(s);
    if (r.session?.cycle === c) return r.session;
    const n = count(s);
    r.session = {
      cycle: c,
      type: r.nextType,
      seed: seed >>> 0 || 1,
      level: level(s),
      roundCount: n < 2 ? 1 : n < 4 ? 2 : 3,
      round: 0,
      removed: [],
      mistakes: 0,
    };
    return r.session;
  }
  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function shuffle(list, r) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function questions(a) {
    const r = random(a.seed),
      integer = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    let result;
    const used = new Set();
    for (let round = 0; round <= a.round; round++) {
      const incorrect = integer(1, 3),
        flags = shuffle(
          [false, false, false, true].map((_, i) => i >= incorrect),
          r,
        );
      const pool = shuffle(
        words.slice(0, Math.min(words.length, 8 + a.level * 4)),
        r,
      );
      result = flags.map((correct, i) => {
        if (a.type === "spelling") {
          const [good, bad] = pool[i];
          return {
            correct,
            original: correct ? good : bad,
            correction: good,
            explanation: `“${good}” is spelled correctly. Leave it growing!`,
          };
        }
        let left, right, op, answer, display;
        do {
          const multiply = a.level >= 1 && r() < (a.level >= 2 ? 0.6 : 0.35),
            decimal = a.level >= 3 && multiply && r() < 0.35;
          if (multiply) {
            left = integer(2, a.level >= 4 ? 12 : a.level >= 2 ? 9 : 5);
            right = decimal
              ? integer(2, a.level >= 4 ? 20 : 12) * 25
              : integer(2, a.level >= 4 ? 12 : a.level >= 2 ? 9 : 5) * 100;
            op = "×";
            answer = left * right;
            display = `${left} × ${decimal ? (right / 100).toFixed(2) : right / 100}`;
          } else {
            left = integer(1, 10 + 5 * a.level);
            right = integer(1, 10 + 3 * a.level);
            op = r() < 0.5 ? "+" : "−";
            if (op === "−" && right > left) [left, right] = [right, left];
            answer = (op === "+" ? left + right : left - right) * 100;
            display = `${left} ${op} ${right}`;
          }
        } while (used.has(display));
        used.add(display);
        const decimal = answer % 100 !== 0 || (op === "×" && right % 100 !== 0),
          format = (n) => (decimal ? (n / 100).toFixed(2) : String(n / 100)),
          wrong =
            answer +
            (decimal ? [25, 50, 75][integer(0, 2)] : integer(1, 3) * 100),
          correction = `${display} = ${format(answer)}`;
        return {
          correct,
          original: `${display} = ${format(correct ? answer : wrong)}`,
          correction,
          explanation: `${correction} is correct. Leave it growing!`,
        };
      });
    }
    return result;
  }
  function select(s, index) {
    const r = s.weedingLesson,
      a = r?.session;
    if (!a || !status(s).available || a.cycle !== cycle(s))
      throw Error("Start or resume your weeding challenge first.");
    if (!Number.isInteger(index) || index < 0 || index > 3)
      throw Error("Choose a planted answer.");
    const q = questions(a)[index];
    if (a.removed.includes(index))
      return { kind: "unchanged", message: "That weed is already cleared." };
    if (q.correct) {
      a.mistakes = Math.min(999, a.mistakes + 1);
      return { kind: "kept", message: q.explanation };
    }
    a.removed.push(index);
    if (!questions(a).every((item, i) => item.correct || a.removed.includes(i)))
      return {
        kind: "removed",
        message: "You found a weed! Keep the correct answers growing.",
      };
    if (a.round + 1 < a.roundCount) {
      a.round++;
      a.removed = [];
      a.mistakes = 0;
      return { kind: "round", message: "Lovely work! A new patch is ready." };
    }
    r.completedCycle = a.cycle;
    r.nextType = a.type === "math" ? "spelling" : "math";
    r.session = null;
    return {
      kind: "complete",
      message:
        "Wonderful weeding! Your planted garden has a next-harvest bonus.",
    };
  }
  const api = { empty, recover, status, start, questions, select, count };
  if (typeof module !== "undefined") module.exports = api;
  root.GardenLearning = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
