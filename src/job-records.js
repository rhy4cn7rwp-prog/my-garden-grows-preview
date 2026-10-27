/* Local, experience/settings-specific records. No identities or network calls. */
(function (root) {
  "use strict";
  const ids =
    "words packing stacks labels match catch weeds tomatoes flowers tidy hidden sliding".split(
      " ",
    );
  function spec(a) {
    const d = a.data;
    let setting = "";
    if (a.id === "hidden")
      setting = `${d.scene}-${d.targets.length}-${d.targets.reduce((mask, i) => mask | (1 << i), 0)}-${d.assisted ? 1 : 0}`;
    else if (a.id === "sliding")
      setting =
        a.rulesVersion >= 5
          ? `${d.scene}-${d.cols}-${d.rows}-${Math.floor(d.minimumDistance / 4)}-${d.assisted ? 1 : 0}`
          : `${d.scene}-${d.size}-${Math.floor(d.minimumDistance / 4)}-${d.assisted ? 1 : 0}`;
    else if (["words", "labels"].includes(a.id))
      setting = d.words
        .map((w) => w.length)
        .sort((a, b) => a - b)
        .join("-");
    else if (a.id === "stacks")
      setting = `${d.cap}-${d.crates.length}-${a.rulesVersion >= 4 ? Math.ceil(d.transitions / 4) : Math.ceil(d.solution.length / 10)}`;
    else if (a.id === "match") setting = `${d.types}-${d.target}`;
    else if (a.id === "catch") setting = `${d.width}-${d.launchEvery}`;
    else setting = String(d.target || d.items?.length || 0);
    return {
      key: `${a.id}|${a.mode}|v${a.rulesVersion || 1}|${setting}`,
      kind: ["match", "catch"].includes(a.id) ? "points" : "time",
    };
  }
  function value(a) {
    return spec(a).kind === "points"
      ? a.score
      : Math.max(10, Math.round(a.elapsed / 10) * 10);
  }
  function assess(jobs, a = jobs.active) {
    if (!a) return null;
    const { key, kind } = spec(a),
      record = jobs.records?.[key],
      previousBest = record?.best ?? null,
      v = value(a),
      newBest =
        !!a.won &&
        previousBest !== null &&
        (kind === "points" ? v > previousBest : v < previousBest);
    return {
      key,
      kind,
      value: v,
      previousBest,
      newBest,
      won: a.won,
      score: a.score,
      elapsed: a.elapsed,
      ...(a.id === "sliding" ? { moves: dMoves(a) } : {}),
      rewardCents: a.won ? (a.rulesVersion >= 3 && newBest ? 300 : 100) : 0,
    };
  }
  function dMoves(a) {
    return a.data.moves;
  }
  function record(jobs, a, date) {
    const result = assess(jobs, a);
    jobs.records ||= {};
    const best = a.won
      ? result.previousBest === null || result.newBest
        ? result.value
        : result.previousBest
      : result.previousBest;
    jobs.records[result.key] = { best, last: { ...result, date } };
    return result;
  }
  function recover(raw) {
    const out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    for (const [key, r] of Object.entries(raw)) {
      if (
        !/^[a-z]+\|(little|growing)\|v[12345]\|[\d.\-]+$/.test(key) ||
        !ids.includes(key.split("|")[0]) ||
        !r ||
        !(r.best === null || (Number.isSafeInteger(r.best) && r.best >= 0))
      )
        continue;
      const l = r.last;
      if (
        !l ||
        !Number.isSafeInteger(l.value) ||
        l.value < 0 ||
        !Number.isSafeInteger(l.elapsed) ||
        l.elapsed < 0 ||
        !Number.isSafeInteger(l.score) ||
        l.score < 0 ||
        typeof l.won !== "boolean" ||
        ![0, 100, 300].includes(l.rewardCents)
      )
        continue;
      out[key] = {
        best: r.best,
        last: {
          key,
          kind: ["match", "catch"].includes(key.split("|")[0])
            ? "points"
            : "time",
          value: l.value,
          previousBest:
            Number.isSafeInteger(l.previousBest) && l.previousBest >= 0
              ? l.previousBest
              : null,
          newBest: l.newBest === true,
          won: l.won,
          score: l.score,
          elapsed: l.elapsed,
          rewardCents: l.rewardCents,
          ...(Number.isSafeInteger(l.moves) && l.moves >= 0
            ? { moves: l.moves }
            : {}),
          date: Number.isSafeInteger(l.date) ? l.date : 0,
        },
      };
    }
    return out;
  }
  const api = { spec, value, assess, record, recover };
  if (typeof module !== "undefined") module.exports = api;
  root.JobRecords = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
