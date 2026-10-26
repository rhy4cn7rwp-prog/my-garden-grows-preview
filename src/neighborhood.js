/* Job Board presentation, pointer gestures and a single active-play animation
   loop. Rules/rewards live in NeighborhoodJobs; narration is shared with shops. */
const Neighborhood = (() => {
  const ui = {
    selected: null,
    wordStart: null,
    paused: true,
    last: 0,
    clock: 0,
    frame: 0,
    view: null,
    active: null,
    drag: null,
    suppress: 0,
    feedback: "",
    lastScore: 0,
  };
  const J = NeighborhoodJobs,
    kinds = J.kinds;
  function icon(kind, cls = "") {
    if (kind === "tomato-ripe" || kind === "tomato-green")
      return `<svg class="job-symbol" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 25C13 13 10 69 30 83Q51 96 72 82C94 62 85 16 50 25Z" fill="${kind === "tomato-ripe" ? "#e45c42" : "#80ad5a"}" stroke="${kind === "tomato-ripe" ? "#ab4935" : "#56783d"}" stroke-width="3"/><path d="m31 27 18-4 4-15 4 15 17 5-17 3-7 12-3-13-17 7Z" fill="#4f7b3e"/><ellipse cx="33" cy="42" rx="7" ry="10" fill="${kind === "tomato-ripe" ? "#f8ad78" : "#bdd98c"}"/></svg>`;
    if (CROPS.some((c) => c.id === kind)) return seedProduceArt(kind);
    if (kind === "harvest") return gardenBasketArt();
    const paths = {
      sun: '<circle cx="50" cy="42" r="20" fill="#f4c750"/><path d="M50 10v8m0 48v8M18 42h8m48 0h8M27 19l6 6m34 34 6 6M27 65l6-6m34-34 6-6" stroke="#c9913c" stroke-width="4"/>',
      pot: '<path d="m23 37 54 0-8 42H31Z" fill="#d68e61" stroke="#995b38" stroke-width="3"/><rect x="18" y="29" width="64" height="15" rx="5" fill="#e9ad7a"/>',
      mud: '<path d="M17 68q-1-39 30-30 33-26 38 25-28 24-68 5" fill="#976c47"/><ellipse cx="49" cy="59" rx="21" ry="8" fill="#bb9068"/>',
      dig: '<path d="M51 17v44M40 14h22v16H40Z" fill="none" stroke="#a87644" stroke-width="7"/><path d="M35 58h32q8 30-16 33Q27 84 35 58" fill="#96a9a2" stroke="#557d70" stroke-width="3"/>',
      leaf: '<path d="M16 74Q-2 16 78 12Q89 81 16 74Z" fill="#b8a856" stroke="#7d793b" stroke-width="3"/><path d="m15 79 47-47" stroke="#7d793b" stroke-width="4"/>',
      stick:
        '<path d="m23 83 48-64m-28 37-18-4m29-10 16 2" stroke="#976744" stroke-width="9" stroke-linecap="round"/>',
      flower:
        '<path d="M50 86V41m0 25q-30-28-26-4 5 17 26 9m0-12q28-26 25-2-7 13-25 12" fill="#82b557" stroke="#527f3c" stroke-width="3"/><g fill="#edb3c0" stroke="#bd758a" stroke-width="2"><ellipse cx="50" cy="23" rx="13" ry="20"/><ellipse cx="31" cy="39" rx="19" ry="13"/><ellipse cx="69" cy="39" rx="19" ry="13"/><ellipse cx="50" cy="52" rx="13" ry="19"/></g><circle cx="50" cy="37" r="12" fill="#f0ce6b"/>',
      weed: '<path d="M50 86V26m0 44L18 55l14-4L15 32l23 2-3-19 15 12 15-12-3 19 23-2-17 19 14 4-32 15" fill="#b96d59" stroke="#7e493d" stroke-width="3"/>',
      plant:
        '<path d="M50 87V28" stroke="#568141" stroke-width="5"/><path d="M50 60Q12 64 20 27q33-1 30 33m0 9q39-2 29-38-30 0-29 38" fill="#92bb66" stroke="#568141" stroke-width="3"/>',
    };
    return `<svg class="job-symbol ${cls}" viewBox="0 0 100 100" aria-hidden="true">${paths[kind] || paths.flower}</svg>`;
  }
  function person(who) {
    const magee = who === "magee";
    return `<svg class="job-neighbor neighbor-${who}" viewBox="0 0 180 210" role="img" aria-label="${magee ? "Mrs. Magee, smiling in her gardening apron" : "Mr. Jones, a cheerful gardener in overalls"}"><path d="M38 206q-9-77 51-88 57 8 55 88" fill="${magee ? "#bc809f" : "#779da8"}" stroke="#6b624f" stroke-width="3"/><path d="M66 148h47v58H66Z" fill="${magee ? "#f1c594" : "#4e7790"}"/><path d="M60 151 43 187m76-35 23 34" stroke="#d3a076" stroke-width="17" stroke-linecap="round"/><ellipse cx="90" cy="82" rx="38" ry="46" fill="#e1b591" stroke="#9a7357" stroke-width="2"/>${magee ? '<path d="M51 88q-28-68 25-69 58-19 55 70-9-43-30-51-18 26-50 24" fill="#ded4bf"/><circle cx="117" cy="22" r="19" fill="#ded4bf"/><g fill="none" stroke="#7d7166" stroke-width="3"><circle cx="74" cy="82" r="13"/><circle cx="107" cy="82" r="13"/><path d="M87 82h7"/></g>' : '<path d="M36 48q56-26 108 0l8 12H26Z" fill="#c8ab6a" stroke="#927a4c" stroke-width="3"/><path d="m55 43 9-32h51l13 32" fill="#dfc480"/><path d="M64 112q29 18 53-4-8 29-39 27" fill="#d8c9ac"/>'}<g fill="#574734"><circle cx="74" cy="82" r="3"/><circle cx="107" cy="82" r="3"/></g><path d="M86 94q8 5 13-1m-19 14q13 11 26-1" fill="none" stroke="#a36956" stroke-width="3" stroke-linecap="round"/><ellipse class="neighbor-blink" cx="74" cy="82" rx="4" ry="1" fill="#ba8d70"/></svg>`;
  }
  function jobArt(id) {
    if (id === "labels") return person("magee");
    if (id === "catch") return person("jones");
    if (id === "words") return icon("sun");
    if (id === "flowers") return icon("flower");
    if (id === "weeds") return icon("weed");
    if (id === "tidy") return icon("leaf");
    return icon(
      id === "packing" ? "corn" : id === "stacks" ? "cucumber" : "tomato",
    );
  }
  const countdown = (ms) =>
    `${Math.ceil(ms / 1000 / 60) - (Math.ceil(ms / 1000) % 60 === 0 ? 0 : 1)}:${String(Math.ceil(ms / 1000) % 60).padStart(2, "0")}`;
  function scene() {
    const a = state.jobs.active;
    if (a) return active(a);
    return `<section class="job-board"><header><h1>Neighborhood Job Board</h1><p>Help a neighbor. Every completed job earns $1!</p><button class="btn alt" onclick="Neighborhood.settings()">Play &amp; sound settings</button><button class="btn alt" onclick="Neighborhood.read('Welcome to the neighborhood! Choose any job. Each completed job earns one dollar.')">Read to Me</button></header><div class="job-notices">${J.catalog
      .map((j) => {
        const wait = J.available(state, j.id);
        return `<button class="job-notice" data-job-card="${j.id}" onclick="Neighborhood.start('${j.id}')" ${wait ? "disabled" : ""}>${jobArt(j.id)}<strong>${j.name}</strong><span>${j.type} · $1.00</span><small data-job-cooldown="${j.id}">${wait ? "Available in " + countdown(wait) : "Available now"}</small></button>`;
      })
      .join(
        "",
      )}</div><button class="btn" onclick="go('town')">Back to Town</button></section>`;
  }
  function active(a) {
    const j = J.catalog.find((j) => j.id === a.id),
      d = a.data,
      timed = J.duration[a.id];
    if (a.ended)
      return `<section class="job-results">${jobArt(a.id)}<h1>${a.won ? "Wonderful helping!" : "Nice practice!"}</h1>${a.id === "labels" && a.won ? `<strong class="job-word-success">${d.words.at(-1)}</strong>` : ""}<p>${a.score} ${a.id === "catch" ? "points" : "score"} · Personal best ${Math.max(a.score, state.jobs.best[a.id] || 0)}</p><p>${a.won ? "Your neighbor has $1 ready for you." : "Try again whenever you like. No money or cooldown lost."}</p><button class="btn" onclick="Neighborhood.${a.won ? "collect" : "retry"}()">${a.won ? "Collect $1" : "Try again"}</button><button class="btn alt" onclick="Neighborhood.leave()">Job Board</button><button class="btn alt" onclick="Neighborhood.read('${a.won ? "Thank you for helping! Here is a dollar." : "That was good practice. You can try again."}')">Read to Me</button></section>`;
    let body = "";
    if (a.id === "words")
      body = `<ul class="job-word-list">${d.words.map((w) => `<li class="${d.found.includes(w) ? "found" : ""}">${a.mode === "little" ? icon(w.toLowerCase()) : ""}<button onclick="Neighborhood.read('${w}')">${w}${d.found.includes(w) ? " ✓" : ""}</button></li>`).join("")}</ul><div class="job-word-grid" style="--size:${d.size}">${d.grid.map((v, i) => `<button data-letter="${i}" onclick="Neighborhood.letterCell(${i})" class="${d.found.some((w) => d.paths[w].includes(i)) ? "found" : ""}" aria-label="Letter ${v}, row ${Math.floor(i / d.size) + 1}, column ${(i % d.size) + 1}">${v}</button>`).join("")}</div>`;
    if (a.id === "packing")
      body = `<div class="job-conveyor" aria-label="Moving produce conveyor">${d.items
        .map((id, i) =>
          d.sorted.includes(i)
            ? ""
            : `<button data-pack-item="${i}" data-job-drag="pack" data-item="${i}" onclick="Neighborhood.pick(${i})" aria-label="Pick ${id}" class="belt-produce ${ui.selected === i ? "selected" : ""}">${icon(id)}</button>`,
        )
        .filter(Boolean)
        .slice(0, 3)
        .join(
          "",
        )}</div><div class="job-crates">${d.kinds.map((k) => `<button data-job-drop="${k}" onclick="Neighborhood.place('${k}')" aria-label="${k} crate">${icon(k)}<span>${k}</span></button>`).join("")}</div><p>${d.sorted.length} of ${d.items.length} packed</p>`;
    if (a.id === "stacks")
      body = `<div class="job-stacks">${d.crates.map((c, i) => `<button class="job-stack ${ui.selected === i ? "selected" : ""}" aria-label="Crate ${i + 1}: ${c.join(", ") || "empty"}" onclick="Neighborhood.stack(${i})">${Array.from({ length: d.cap }, (_, row) => (c[d.cap - 1 - row] ? icon(c[d.cap - 1 - row]) : '<span class="empty-slot"></span>')).join("")}<b>${i + 1}</b></button>`).join("")}</div><div class="job-actions"><button class="btn alt" onclick="Neighborhood.act({type:'undo'})">Undo</button><button class="btn alt" onclick="Neighborhood.act({type:'restart'})">Restart</button></div>`;
    if (a.id === "labels") {
      const w = d.words[d.round],
        little = a.mode === "little";
      body = `<div class="job-magee-intro">${person("magee")}<p>“My garden labels are mixed up! Can you help me?”</p></div><p>Label ${d.round + 1} of ${d.words.length}</p>${little ? `<div class="job-picture-clue">${icon(w.toLowerCase())}</div>` : ""}<button class="btn alt" onclick="Neighborhood.read('${w}','magee')">Hear the word</button><div class="job-letter-slots">${[...w].map((_, i) => `<button data-job-drop="letter" onclick="Neighborhood.act({type:'removeLetter',slot:${i}})" aria-label="Letter slot ${i + 1}">${d.slots[i] === undefined ? "" : d.tiles[d.slots[i]]}</button>`).join("")}</div><div class="job-letter-tiles">${d.tiles.map((v, i) => `<button data-job-drag="letter" data-item="${i}" onclick="Neighborhood.tile(${i})" ${d.slots.includes(i) ? "disabled" : ""}>${v}</button>`).join("")}</div><button class="btn alt" onclick="Neighborhood.act({type:'hint'})">Picture / letter hint</button>${d.hints ? `<p class="job-hint">${icon(w.toLowerCase())}Starts with ${w.slice(0, d.hints)}${"·".repeat(w.length - d.hints)}</p>` : ""}${little ? `<p>Say each sound, then blend the word.</p><div class="job-phonics">${[...w].map((l) => `<button class="btn alt" onclick="Narration.phoneme('${l}')" aria-label="Hear ${l} sound">${l} sound</button>`).join("")}</div>` : ""}`;
    }
    if (a.id === "match")
      body = `<p>Goal ${d.target} points · Match FOUR or more!</p><div class="job-match-grid ${Date.now() < (ui.dropUntil || 0) ? "job-fall" : ""}">${(ui.previewGrid || d.grid).map((v, i) => `<button data-match-cell="${i}" data-job-drag="swap" data-item="${i}" data-job-drop="swap-${i}" onclick="Neighborhood.matchCell(${i})" class="${ui.selected === i ? "selected" : ""} ${(ui.hits || []).includes(i) ? "job-pop" : ""}" aria-label="${kinds[v]}, row ${Math.floor(i / 6) + 1}, column ${(i % 6) + 1}">${icon(kinds[v])}</button>`).join("")}</div>${a.mode === "little" ? '<button class="btn alt" onclick="Neighborhood.matchHint()">Show me a possible swap</button>' : ""}`;
    if (a.id === "catch")
      body = `<div class="job-catch-world" data-catch-world aria-label="Catch carrots by moving the basket"><div class="job-jones">${person("jones")}</div><div class="job-jones-bubble">“Grab that basket! Catch these carrots for me, would ya?”</div><div class="job-carrots"></div><div class="job-catching-basket" style="width:${d.width * 100}%;left:${d.basket * 100}%">${gardenBasketArt()}</div></div><p><span data-catch-count>${d.caught.length}</span> carrots caught · Goal ${d.target} points</p><div class="job-actions"><button class="btn" onclick="Neighborhood.moveBasket(-.1)">Move left</button><button class="btn" onclick="Neighborhood.moveBasket(.1)">Move right</button></div>`;
    if (["weeds", "tomatoes", "flowers", "tidy"].includes(a.id))
      body = `<p>${a.id === "tomatoes" ? `Pick ${d.target} ripe tomatoes.` : a.id === "flowers" ? "Water every flowerpot." : a.id === "weeds" ? "Pull jagged red weeds; keep round green leaves." : "Put leaves and sticks in their matching piles."} ${a.score} / ${d.target}</p>${a.id === "flowers" ? `<button class="job-can ${ui.selected === "water" ? "selected" : ""}" data-job-drag="water" onclick="Neighborhood.pick('water')" aria-label="Pick up watering can">${gardenCanArt()}</button>` : ""}<div class="job-yard job-yard-${a.id}">${d.items.map((item, i) => `<button data-job-drag="chore" data-item="${i}" data-job-drop="yard-${i}" onclick="Neighborhood.chore(${i})" class="yard-item ${item.done ? "done" : ""} ${item.kind === "green" ? "unripe" : ""}" aria-label="${item.done ? "Finished" : item.kind} ${i + 1}" ${item.done ? "disabled" : ""}>${icon(a.id === "tomatoes" ? (item.kind === "green" ? "tomato-green" : "tomato-ripe") : item.kind === "flower" ? "flower" : item.kind)}${a.id === "flowers" ? `<span>${item.done ? "Blooming!" : "Thirsty"}</span>` : item.kind === "green" ? "<span>Not ripe</span>" : item.kind === "ripe" ? "<span>Ripe</span>" : ""}</button>`).join("")}</div>${a.id === "tidy" ? `<div class="job-crates">${["leaf", "stick"].map((k) => `<button data-job-drop="${k}" onclick="Neighborhood.place('${k}')">${icon(k)}${k === "leaf" ? "Leaves" : "Sticks"}</button>`).join("")}</div>` : a.id === "tomatoes" || a.id === "weeds" ? `<div class="job-drop-basket" data-job-drop="basket">${gardenBasketArt()}<span>${a.id === "weeds" ? "Weed basket" : "Harvest basket"}</span></div>` : ""}`;
    return `<section class="job-play"><header><h1>${j.name}</h1><p class="job-instructions">${j.instructions}</p></header><div class="job-status"><b>Score <output data-job-score>${a.score}</output></b>${timed ? `<b data-job-time>${countdown(timed - a.elapsed)}</b>` : ""}<span>${a.mode === "little" ? "Little Gardener" : "Growing Gardener"}</span></div><div class="job-actions job-main-actions"><button class="btn alt" onclick="Neighborhood.readInstruction()">Read to Me</button><button class="btn" onclick="Neighborhood.pause()">${ui.paused ? "Play / Resume" : "Pause"}</button><button class="btn alt" onclick="Neighborhood.exit()">Leave job</button></div><div class="job-play-area">${body}</div><p class="job-feedback" role="status">${ui.lastWord ? `<strong class="job-word-success">${ui.lastWord}</strong> ` : ""}${ui.paused ? "Paused. Tap Play / Resume when you are ready." : ui.feedback || "You can do it! Take your time."}</p></section>`;
  }
  function read(text, who = "guide") {
    Narration.speak(text, who, true);
  }
  function readInstruction() {
    const a = state.jobs.active,
      j = J.catalog.find((j) => j.id === a?.id);
    if (j)
      read(
        (a.id === "labels"
          ? "My garden labels are mixed up! Can you help me? "
          : a.id === "catch"
            ? "Grab that basket! Catch these carrots for me, would ya? "
            : "") + j.instructions,
        a.id === "labels" ? "magee" : a.id === "catch" ? "jones" : "guide",
      );
  }
  function start(id) {
    if (J.available(state, id)) return;
    try {
      if (state.jobs.active && state.jobs.active.id !== id) return;
      J.start(state, id);
      ui.paused = false;
      ui.feedback = "";
      ui.selected = null;
      ui.lastWord = "";
      ui.lastScore = 0;
      ui.falling = false;
      ui.previewGrid = null;
      ui.hits = [];
      ui.dropUntil = 0;
      ui.wordStart = null;
      ui.last = 0;
      go("jobs");
      document.querySelector("#app").scrollTop = 0;
      readInstructionIfEnabled();
    } catch (e) {
      ui.feedback = e.message;
      render();
    }
  }
  function readInstructionIfEnabled() {
    if (state.narrationEnabled) readInstruction();
  }
  function act(e) {
    if (ui.paused || ui.falling) return;
    checkpoint();
    const a = state.jobs.active;
    if (!a || a.ended) return;
    const prior = a.score,
      word = a.id === "labels" ? a.data.words[a.data.round] : null;
    try {
      const preview = e.type === "swap" ? a.data.grid.slice() : null;
      if (preview)
        [preview[e.from], preview[e.to]] = [preview[e.to], preview[e.from]];
      ui.lastWord = "";
      const ok = J.action(state, e);
      ui.feedback = ok
        ? "Lovely helping!"
        : "Try another one. Nothing is lost.";
      if (
        a.id === "labels" &&
        a.score === prior &&
        a.data.slots.length === a.data.tiles.length
      )
        ui.feedback =
          "Try changing a letter. Tap a filled slot, or use a hint.";
      if (a.id === "labels" && a.score > prior) {
        Narration.speak(word, "magee");
        ui.lastWord = word;
        ui.feedback = "You made " + word + "!";
      }
      if (a.score > prior) Narration.effect();
      ui.selected = null;
      if (e.type === "swap" && ok) {
        ui.falling = true;
        ui.previewGrid = preview;
        ui.hits = J.matches(preview);
        setTimeout(() => {
          if (state.jobs.active !== a) return;
          ui.falling = false;
          ui.previewGrid = null;
          ui.hits = [];
          ui.dropUntil = Date.now() + 220;
          if (view === "jobs") render();
        }, 260);
      }
      save();
      render();
    } catch (error) {
      ui.feedback = error.message;
      render();
    }
  }
  function pick(i) {
    if (Date.now() < ui.suppress) return;
    ui.selected = i;
    ui.feedback = "Now choose where it belongs.";
    render();
  }
  function place(target) {
    if (ui.selected === null) return;
    const a = state.jobs.active;
    act(
      a.id === "packing"
        ? { type: "pack", item: +ui.selected, target }
        : { type: "chore", item: +ui.selected, target },
    );
  }
  function stack(i) {
    if (ui.selected === null) {
      ui.selected = i;
      render();
    } else act({ type: "stack", from: ui.selected, to: i });
  }
  function tile(i) {
    if (Date.now() < ui.suppress) return;
    act({ type: "letter", tile: i });
  }
  function chore(i) {
    if (Date.now() < ui.suppress) return;
    const id = state.jobs.active.id;
    if (id === "tidy") {
      pick(i);
      return;
    }
    if (id === "flowers" && ui.selected !== "water") {
      ui.feedback = "Pick up the watering can first.";
      render();
      return;
    }
    act({ type: "chore", item: i });
    if (id === "flowers") ui.selected = "water";
  }
  function matchCell(i) {
    if (Date.now() < ui.suppress) return;
    if (ui.selected === null) {
      ui.selected = i;
      render();
    } else {
      const from = ui.selected;
      ui.selected = null;
      act({ type: "swap", from, to: i });
    }
  }
  function matchHint() {
    const move = J.moves(state.jobs.active.data.grid)[0];
    ui.feedback = move
      ? `Try the vegetables at row ${Math.floor(move[0] / 6) + 1}, column ${(move[0] % 6) + 1} and its neighbor.`
      : "A fresh board is ready.";
    if (move)
      document
        .querySelectorAll("[data-match-cell]")
        .forEach((e) =>
          e.classList.toggle(
            "job-swap-hint",
            move.includes(+e.dataset.matchCell),
          ),
        );
  }
  function letterCell(i) {
    if (Date.now() < ui.suppress) return;
    if (ui.wordStart === null) {
      ui.wordStart = i;
      document.querySelector(`[data-letter="${i}"]`)?.classList.add("selected");
    } else {
      wordPath(ui.wordStart, i);
      ui.wordStart = null;
    }
  }
  function pathBetween(from, to) {
    const n = state.jobs.active.data.size,
      dx = (to % n) - (from % n),
      dy = Math.floor(to / n) - Math.floor(from / n);
    if (dx && dy && Math.abs(dx) !== Math.abs(dy)) return [];
    const count = Math.max(Math.abs(dx), Math.abs(dy));
    return Array.from(
      { length: count + 1 },
      (_, k) => from + k * Math.sign(dx) + k * Math.sign(dy) * n,
    );
  }
  function wordPath(from, to) {
    act({ type: "word", path: pathBetween(from, to) });
  }
  function moveBasket(delta) {
    const a = state.jobs.active;
    if (a && !ui.paused) {
      J.action(state, { type: "basket", x: a.data.basket + delta });
      save();
      paint();
    }
  }
  function checkpoint() {
    const now = performance.now(),
      a = state.jobs?.active;
    if (ui.last && view === "jobs" && a && !ui.paused && !document.hidden) {
      const ms = Math.round(now - ui.last);
      if (ms > 0) J.tick(state, ms);
    }
    ui.last = now;
  }
  function pause() {
    checkpoint();
    ui.paused = !ui.paused;
    ui.last = performance.now();
    save();
    render();
  }
  function stop() {
    clear();
    checkpoint();
    ui.paused = true;
    ui.last = 0;
    Narration.stop();
    save();
  }
  function exit() {
    stop();
    show(
      '<h2>Leave this job?</h2><p>You can pause and resume later, or leave without a reward or cooldown.</p><button class="btn" onclick="Neighborhood.pauseExit()">Keep for later</button><button class="btn alt" onclick="Neighborhood.leave()">Leave without reward</button>',
    );
  }
  function pauseExit() {
    go("clubhouse");
  }
  function leave() {
    J.quit(state);
    ui.paused = true;
    ui.last = 0;
    ui.feedback = "";
    go("jobs");
  }
  function retry() {
    const id = state.jobs.active.id;
    J.quit(state);
    start(id);
  }
  function collect() {
    try {
      const r = J.claim(state);
      ui.paused = true;
      save();
      Narration.speak(
        "Thank you for helping! Here is one dollar.",
        r.id === "catch" ? "jones" : "magee",
      );
      show(
        `<h2>Thank you, neighbor!</h2><p>You earned exactly $1.00. You now have ${money(state.cash)}.</p><button class="btn" onclick="go('jobs')">Back to Job Board</button>`,
      );
    } catch (e) {
      ui.feedback = e.message;
      render();
    }
  }
  function paint() {
    const a = state.jobs.active;
    if (!a || view !== "jobs") return;
    const d = a.data;
    document
      .querySelector("[data-job-time]")
      ?.replaceChildren(
        document.createTextNode(
          countdown(Math.max(0, (J.duration[a.id] || 0) - a.elapsed)),
        ),
      );
    document
      .querySelector("[data-job-score]")
      ?.replaceChildren(document.createTextNode(a.score));
    if (a.id === "packing")
      document
        .querySelectorAll("[data-pack-item]")
        .forEach(
          (el, i) =>
            (el.style.left =
              3 +
              (((matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 0
                : a.elapsed) /
                (a.mode === "little" ? 18000 : 10000) +
                i / 3) %
                1) *
                73 +
              "%"),
        );
    if (a.id === "catch") {
      const holder = document.querySelector(".job-carrots");
      if (holder)
        holder.innerHTML = Array.from(
          { length: Math.ceil(60000 / d.launchEvery) },
          (_, i) => J.carrot(a, i),
        )
          .filter(
            (c) => a.elapsed >= c.launch && a.elapsed < c.launch + c.flight,
          )
          .map((c) => {
            const t = (a.elapsed - c.launch) / c.flight;
            return `<span class="flying-carrot ${c.big ? "big" : ""}" style="left:${(c.start + (c.end - c.start) * t) * 100}%;top:${55 + 27 * t - 160 * t * (1 - t)}%;transform:rotate(${t * 320}deg)">${icon("carrot")}</span>`;
          })
          .join("");
      document
        .querySelector("[data-catch-count]")
        ?.replaceChildren(document.createTextNode(d.caught.length));
      if (a.score > ui.lastScore) Narration.effect();
      ui.lastScore = a.score;
      const b = document.querySelector(".job-catching-basket");
      if (b) b.style.left = d.basket * 100 + "%";
    }
  }
  function sync() {
    const hud = document.querySelector(".jobs-game .hud");
    if (hud)
      document.documentElement.style.setProperty(
        "--jobs-hud-height",
        hud.getBoundingClientRect().height + "px",
      );
    if (ui.view !== view || ui.active !== state.jobs.active) {
      if (ui.view === "jobs" && view !== "jobs") {
        stop();
      }
      ui.view = view;
      ui.active = state.jobs.active;
      if (view === "jobs") ui.last = performance.now();
    }
    if (view === "jobs" && !state.jobs.active?.ended && !ui.frame)
      ui.frame = requestAnimationFrame(loop);
    else if (view !== "jobs" && ui.frame) {
      cancelAnimationFrame(ui.frame);
      ui.frame = 0;
    }
  }
  function loop() {
    ui.frame = 0;
    if (view === "jobs") {
      if (state.jobs.active) {
        checkpoint();
        paint();
        if (
          state.jobs.active.ended &&
          !document.querySelector(".job-results")
        ) {
          save();
          render();
        }
        if (performance.now() - ui.clock > 1000) {
          save();
          ui.clock = performance.now();
        }
      } else {
        document.querySelectorAll("[data-job-cooldown]").forEach((el) => {
          const ms = J.available(state, el.dataset.jobCooldown);
          el.textContent = ms
            ? "Available in " + countdown(ms)
            : "Available now";
          el.closest("button").disabled = !!ms;
        });
      }
    }
    if (view === "jobs" && !state.jobs.active?.ended && !ui.frame)
      ui.frame = requestAnimationFrame(loop);
  }
  function settings() {
    learningSettings();
  }
  // Shared pointer capture: drag cards into crates/baskets; tap alternatives stay available.
  document.addEventListener("pointerdown", (e) => {
    if (view !== "jobs" || ui.paused || !e.isPrimary) return;
    const el = e.target.closest(
      "[data-job-drag],[data-letter],[data-catch-world]",
    );
    if (!el || el.disabled) return;
    ui.drag = {
      el,
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      item: +el.dataset.item,
      kind:
        el.dataset.jobDrag ||
        (el.hasAttribute("data-letter") ? "word" : "catch"),
      start: +el.dataset.letter,
    };
    el.setPointerCapture(e.pointerId);
    if (ui.drag.kind === "catch") basketAt(e);
  });
  function basketAt(e) {
    const r = document
      .querySelector("[data-catch-world]")
      ?.getBoundingClientRect();
    if (!r) return;
    const a = state.jobs.active;
    const x = (e.clientX - r.x) / r.width;
    J.action(state, { type: "basket", x });
    paint();
  }
  document.addEventListener(
    "pointermove",
    (e) => {
      const d = ui.drag;
      if (!d || d.id !== e.pointerId) return;
      if (d.kind === "catch") {
        if (performance.now() - (d.last || 0) > 70) {
          basketAt(e);
          d.last = performance.now();
        }
        return;
      }
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.moved = true;
      e.preventDefault();
      if (d.kind === "word") {
        const el = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("[data-letter]");
        if (el) {
          d.end = +el.dataset.letter;
          const path = pathBetween(d.start, d.end);
          document
            .querySelectorAll("[data-letter]")
            .forEach((el) =>
              el.classList.toggle(
                "job-trail",
                path.includes(+el.dataset.letter),
              ),
            );
        }
        return;
      }
      if (!d.ghost) {
        d.ghost = document.createElement("div");
        d.ghost.className = "job-drag-ghost";
        d.ghost.innerHTML =
          d.kind === "water" ? gardenCanArt() : d.el.innerHTML;
        document.body.append(d.ghost);
      }
      Object.assign(d.ghost.style, {
        left: e.clientX + "px",
        top: e.clientY + "px",
      });
    },
    { passive: false },
  );
  function clear() {
    ui.drag?.ghost?.remove();
    ui.drag = null;
  }
  document.addEventListener("pointerup", (e) => {
    const d = ui.drag;
    if (!d || d.id !== e.pointerId) return;
    const drop = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-job-drop]");
    clear();
    if (!d.moved || d.kind === "catch") return;
    e.preventDefault();
    if (d.kind === "word" && d.end !== undefined) wordPath(d.start, d.end);
    else if (drop) {
      const target = drop.dataset.jobDrop;
      if (d.kind === "pack") act({ type: "pack", item: d.item, target });
      else if (d.kind === "letter" && target === "letter")
        act({ type: "letter", tile: d.item });
      else if (d.kind === "water" && target.startsWith("yard-"))
        act({ type: "chore", item: +target.slice(5) });
      else if (
        d.kind === "chore" &&
        (target === "basket" || ["leaf", "stick"].includes(target))
      )
        act({ type: "chore", item: d.item, target });
      else if (d.kind === "swap" && target.startsWith("swap-"))
        act({ type: "swap", from: d.item, to: +target.slice(5) });
    }
    ui.suppress = Date.now() + 400;
  });
  document.addEventListener("pointercancel", clear);
  document.addEventListener(
    "click",
    (e) => {
      if (
        Date.now() < ui.suppress &&
        e.target.closest("[data-job-drag],[data-letter]")
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      clear();
      if (view === "jobs") render();
    }
  });
  window.addEventListener("pagehide", stop);
  return {
    scene,
    icon,
    person,
    sync,
    stop,
    start,
    act,
    pick,
    place,
    stack,
    tile,
    chore,
    matchCell,
    matchHint,
    letterCell,
    moveBasket,
    pause,
    exit,
    pauseExit,
    leave,
    retry,
    collect,
    read,
    readInstruction,
    settings,
  };
})();
