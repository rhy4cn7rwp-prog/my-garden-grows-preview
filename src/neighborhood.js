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
    if (CROPS.some((c) => c.id === kind)) return seedProduceArt(kind);
    const picture =
      typeof JobWordPictures !== "undefined" ? JobWordPictures.art(kind) : null;
    if (picture) return picture;
    if (kind === "tomato-ripe" || kind === "tomato-green")
      return JobPolishArt.tomato(kind === "tomato-green");
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
    return who === "magee" ? JobArt.magee() : JobArt.jones();
  }
  function jobArt(id) {
    if (["hidden", "sliding"].includes(id))
      return JobPictureGames.thumbnail(id);
    return JobPolishArt.thumbnail(id);
  }
  const countdown = (ms) =>
    `${Math.ceil(ms / 1000 / 60) - (Math.ceil(ms / 1000) % 60 === 0 ? 0 : 1)}:${String(Math.ceil(ms / 1000) % 60).padStart(2, "0")}`;
  function scene() {
    const a = state.jobs.active;
    if (a) return active(a);
    return `<section class="job-board"><header><h1>Neighborhood Job Board</h1><p>Help a neighbor. Finish for $1; beat your own record for $3 total!</p><button class="btn alt" onclick="Neighborhood.settings()">Play &amp; sound settings</button><button class="btn alt" onclick="Neighborhood.read('Welcome to the neighborhood! Choose any job. Finish a job for one dollar. Beat an existing personal best for three dollars total.')">Read to Me</button></header><div class="job-notices">${J.catalog
      .map((j) => {
        const wait = J.available(state, j.id);
        return `<div class="job-notice-wrap"><button class="job-notice" data-job-card="${j.id}" onclick="Neighborhood.start('${j.id}')" ${wait ? "disabled" : ""}>${jobArt(j.id)}<strong>${j.name}</strong><span>${j.type} · $1 / record $3</span><small data-job-cooldown="${j.id}">${wait ? "Available in " + countdown(wait) : "Available now"}</small></button><span class="job-card-best">${recordIndicator(j.id)}</span><button class="btn alt job-record-button" data-records="${j.id}" onpointerup="TouchActions.run(event,()=>Neighborhood.leaderboard('${j.id}'))" onclick="Neighborhood.leaderboard('${j.id}')">Leaderboard</button></div>`;
      })
      .join(
        "",
      )}</div><button class="btn" onclick="go('town')">Back to Town</button></section>`;
  }
  function active(a) {
    const j = J.catalog.find((j) => j.id === a.id),
      d = a.data,
      timed = J.clockLimit(a),
      result = J.result(state.jobs, a),
      reward = result.rewardCents / 100;
    if (a.ended)
      return `<section class="job-results">${["hidden", "sliding"].includes(a.id) && a.won ? JobPictureGames.complete(a) : jobArt(a.id)}<h1>${result.newBest && reward === 3 ? "New Personal Best!" : a.won ? "Wonderful helping!" : "Nice practice!"}</h1>${a.id === "labels" && a.won ? `<strong class="job-word-success">${d.words.at(-1)}</strong>` : ""}${a.won && ["weeds", "tomatoes", "flowers"].includes(a.id) ? `<p>${a.id === "flowers" ? "Every flower is blooming!" : a.id === "tomatoes" ? "End of the row — your harvest basket is full!" : "End of the row — the healthy plants have room to grow!"}</p>` : ""}<p>Your result: ${recordText(result.value, result.kind)} · ${recordIndicator(a.id, a)}</p><p>${a.won ? `Your neighbor has $${reward} total ready for you.${result.newBest && reward === 3 ? " You beat your own record!" : ""}` : "Try again whenever you like. No money or cooldown lost."}</p><button class="btn" onpointerup="Neighborhood.touchResult(event,'${a.won ? "collect" : "retry"}')" onclick="Neighborhood.${a.won ? "collect" : "retry"}()">${a.won ? `Collect $${reward}` : "Try again"}</button><button class="btn alt" onpointerup="TouchActions.run(event,()=>Neighborhood.leaderboard('${a.id}'))" onclick="Neighborhood.leaderboard('${a.id}')">Leaderboard</button><button class="btn alt" onclick="Neighborhood.leave()">Job Board</button><button class="btn alt" onclick="Neighborhood.read('${a.won ? `Thank you for helping! Your reward is ${reward === 1 ? "one dollar" : "three dollars"}.` : "That was good practice. You can try again."}')">Read to Me</button></section>`;
    let body = "";
    if (a.id === "words")
      body = `<ul class="job-word-list">${d.words.map((w) => `<li class="${d.found.includes(w) ? "found" : ""}">${a.mode === "little" ? icon(w.toLowerCase()) : ""}<button onclick="Neighborhood.read('${w}')">${w}${d.found.includes(w) ? " ✓" : ""}</button></li>`).join("")}</ul><div class="job-word-grid" style="--size:${d.size}">${d.grid.map((v, i) => `<button data-letter="${i}" onclick="Neighborhood.letterCell(${i})" class="${d.found.some((w) => d.paths[w].includes(i)) ? "found" : ""}" aria-label="Letter ${v}, row ${Math.floor(i / d.size) + 1}, column ${(i % d.size) + 1}">${v}</button>`).join("")}</div>`;
    if (a.id === "packing") body = JobScenes.packing(a, ui.selected);
    if (a.id === "stacks")
      body = `<p>Choose a top vegetable, then an empty or matching crate.</p><div class="job-stacks" style="--depth:${d.cap};--crates:${d.crates.length}">${d.crates
        .map(
          (c, i) =>
            `<button class="job-stack ${ui.selected === i ? "selected" : ""}" data-job-drag="stack" data-item="${i}" data-job-drop="stack-${i}" aria-label="Crate ${i + 1}: ${c.join(", ") || "empty"}" aria-pressed="${ui.selected === i}" onpointerup="Neighborhood.stackTouch(event,${i})" onclick="Neighborhood.stack(${i})">${Array.from(
              { length: d.cap },
              (_, row) => {
                const index = d.cap - 1 - row,
                  crop = c[index];
                return crop
                  ? `<span data-stack-unit="${crop}" ${index === c.length - 1 ? "data-stack-top" : ""}>${icon(crop)}</span>`
                  : '<span class="empty-slot"></span>';
              },
            ).join("")}<b>${i + 1}</b></button>`,
        )
        .join(
          "",
        )}</div><div class="job-actions"><button class="btn alt" onpointerup="TouchActions.run(event,()=>Neighborhood.act({type:'undo'}))" onclick="Neighborhood.act({type:'undo'})">Undo</button><button class="btn alt" onpointerup="TouchActions.run(event,()=>Neighborhood.act({type:'restart'}))" onclick="Neighborhood.act({type:'restart'})">Restart</button></div>`;
    if (a.id === "labels") {
      const w = d.words[d.round],
        little = a.mode === "little";
      body = `<div class="job-magee-intro">${person("magee")}<p>“My garden labels are mixed up! Can you help me?”</p></div><p>Label ${d.round + 1} of ${d.words.length}</p>${little ? `<div class="job-picture-clue">${icon(w.toLowerCase())}</div>` : ""}<button class="btn alt" onclick="Neighborhood.read('${w}','magee')">Hear the word</button><div class="job-letter-slots">${[...w].map((_, i) => `<button data-job-drop="letter" onclick="Neighborhood.act({type:'removeLetter',slot:${i}})" aria-label="Letter slot ${i + 1}">${d.slots[i] === undefined ? "" : d.tiles[d.slots[i]]}</button>`).join("")}</div><div class="job-letter-tiles">${d.tiles.map((v, i) => `<button data-job-drag="letter" data-item="${i}" onclick="Neighborhood.tile(${i})" ${d.slots.includes(i) ? "disabled" : ""}>${v}</button>`).join("")}</div><button class="btn alt" onclick="Neighborhood.act({type:'hint'})">Picture / letter hint</button>${d.hints ? `<p class="job-hint">${icon(w.toLowerCase())}Starts with ${w.slice(0, d.hints)}${"·".repeat(w.length - d.hints)}</p>` : ""}${little ? `<p>Say each sound, then blend the word.</p><div class="job-phonics">${[...w].map((l) => `<button class="btn alt" onclick="Narration.phoneme('${l}')" aria-label="Hear ${l} sound">${l} sound</button>`).join("")}</div>` : ""}`;
    }
    if (a.id === "labels" && a.rulesVersion >= 3)
      body = JobLetters.scene(a, ui.selected);
    if (a.id === "match")
      body = `<p>Goal ${d.target} points · Match FOUR or more!</p><div class="job-match-grid ${Date.now() < (ui.dropUntil || 0) ? "job-fall" : ""}">${(ui.previewGrid || d.grid).map((v, i) => `<button data-match-cell="${i}" data-job-drag="swap" data-item="${i}" data-job-drop="swap-${i}" onclick="Neighborhood.matchCell(${i})" class="${ui.selected === i ? "selected" : ""} ${(ui.hits || []).includes(i) ? "job-pop" : ""}" aria-label="${kinds[v]}, row ${Math.floor(i / 6) + 1}, column ${(i % 6) + 1}">${icon(kinds[v])}</button>`).join("")}</div>${a.mode === "little" ? '<button class="btn alt" onclick="Neighborhood.matchHint()">Show me a possible swap</button>' : ""}`;
    if (a.id === "catch") body = JobScenes.catchScene(a);
    if (a.id === "tidy" && a.rulesVersion < 3)
      body = `<p>Put leaves and sticks in their matching piles. ${a.score} / ${d.target}</p><div class="job-yard job-yard-tidy">${d.items.map((item, i) => `<button data-job-drag="chore" data-item="${i}" onclick="Neighborhood.chore(${i})" class="yard-item ${item.done ? "done" : ""}" aria-label="${item.done ? "Finished" : item.kind} ${i + 1}" ${item.done ? "disabled" : ""}>${icon(item.kind)}</button>`).join("")}</div><div class="job-crates">${["leaf", "stick"].map((k) => `<button data-job-drop="${k}" onclick="Neighborhood.place('${k}')">${icon(k)}${k === "leaf" ? "Leaves" : "Sticks"}</button>`).join("")}</div>`;
    if (a.id === "tidy" && a.rulesVersion >= 3) body = JobLawnScene.scene(a);
    if (["weeds", "tomatoes"].includes(a.id)) body = JobScenes.rows(a);
    if (a.id === "weeds" && a.rulesVersion >= 4) body = JobGardenScenes.bed(a);
    if (["hidden", "sliding"].includes(a.id)) body = JobPictureGames.scene(a);
    if (a.id === "flowers") body = JobScenes.flowers(a, ui.selected);
    return `<section class="job-play ${["hidden", "sliding"].includes(a.id) && !d.started ? "picture-prestart" : ""} ${["hidden", "sliding", "stacks"].includes(a.id) ? "compact-job" : ""} ${a.id === "stacks" ? "deep-stacks" : a.id === "hidden" ? "seek-job" : ""} ${["hidden", "sliding"].includes(a.id) ? "picture-job" : ""} ${ui.paused ? "is-paused" : ""} ${["packing", "weeds", "tomatoes", "flowers", "tidy"].includes(a.id) ? "illustrated-chore" : ""}"><header><h1>${j.name}</h1><p class="job-instructions">${J.instructions(a)}</p></header><div class="job-status"><b>Score <output data-job-score>${a.score}</output></b>${timed ? `<b data-job-time>${countdown(timed - a.elapsed)}</b>` : ""}<span>${a.mode === "little" ? "Little Gardener" : "Growing Gardener"}</span></div><div class="job-record-strip"><small>${recordIndicator(a.id, a)}</small><button onpointerup="TouchActions.run(event,()=>Neighborhood.leaderboard('${a.id}'))" onclick="Neighborhood.leaderboard('${a.id}')">Leaderboard</button></div><div class="job-actions job-main-actions"><button class="btn alt" onclick="Neighborhood.readInstruction()">Read to Me</button><button class="btn" onclick="Neighborhood.pause()">${ui.paused ? "Play / Resume" : "Pause"}</button><button class="btn alt" onclick="Neighborhood.exit()">Leave job</button>${["hidden", "sliding", "stacks"].includes(a.id) ? `<button class="btn alt" onclick="Neighborhood.leaderboard('${a.id}')">Leaderboard</button>` : ""}</div><div class="job-play-area">${body}${ui.paused && ["hidden", "sliding"].includes(a.id) ? `<div class="picture-paused">Paused<br><button class="btn" onclick="Neighborhood.pause()">Resume</button></div>` : ""}</div><p class="job-feedback" role="status">${ui.lastWord ? `<strong class="job-word-success">${ui.lastWord}</strong> ` : ""}${ui.paused ? "Paused. Tap Play / Resume when you are ready." : ui.feedback || "You can do it! Take your time."}</p></section>`;
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
            : "") + J.instructions(a),
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
      JobScenes.remember(a);
      const source =
        e.type === "chore"
          ? document.querySelector(
              `[data-job-drag="chore"][data-item="${e.item}"]`,
            )
          : null;
      const sourceRect = source?.getBoundingClientRect(),
        sourceHTML = source?.innerHTML;
      const ok = J.action(state, e);
      ui.feedback = ok
        ? "Lovely helping!"
        : "Try another one. Nothing is lost.";
      if (
        a.id === "labels" &&
        a.score === prior &&
        a.data.slots.length === a.data.tiles.length &&
        a.data.slots.every((x) => x !== null)
      )
        ui.feedback =
          "Try changing a letter. Tap a filled slot, or use a hint.";
      if (a.id === "labels" && a.score > prior) {
        Narration.speak(word, "magee");
        ui.lastWord = word;
        ui.feedback = "You made " + word + "!";
      }
      if (a.score > prior) Narration.effect();
      if (!ok && e.type === "chore")
        ui.feedback =
          a.id === "tomatoes"
            ? "That tomato is still green. Let it grow!"
            : a.id === "weeds"
              ? "That is a healthy plant. Leave it to grow!"
              : "Try its matching pile.";
      if (!ok && e.type === "pack")
        ui.feedback = "Look for the basket with the same vegetable.";
      if (a.id === "stacks" && !ok)
        ui.feedback =
          "Choose an empty crate, or the same top vegetable with room.";
      if (a.id !== "stacks" || ok)
        ui.selected = a.id === "flowers" ? "water" : null;
      if (e.type === "swap" && ok) {
        const frames = a.data.bursts || [
          { grid: preview, cells: J.matches(preview), points: a.score - prior },
        ];
        ui.falling = true;
        const animate = (index) => {
          if (state.jobs.active !== a || view !== "jobs") {
            ui.falling = false;
            ui.previewGrid = null;
            ui.hits = [];
            return;
          }
          const frame = frames[index];
          if (!frame) {
            ui.falling = false;
            ui.previewGrid = null;
            ui.hits = [];
            ui.dropUntil = Date.now() + 220;
            render();
            return;
          }
          if (index > 0) ui.dropUntil = Date.now() + 180;
          ui.previewGrid = frame.grid;
          ui.hits = frame.cells;
          render();
          const board = document.querySelector(".job-match-grid");
          if (board) {
            const points = document.createElement("span");
            points.className = "job-match-burst";
            points.textContent = `+${frame.points}${frame.cascade ? " Cascade!" : frame.chain > 1 ? " Streak!" : ""}`;
            const cells = frame.cells;
            points.style.left =
              Math.min(
                60,
                Math.max(
                  8,
                  (cells.reduce((n, i) => n + (i % 6), 0) / cells.length / 6) *
                    100,
                ),
              ) + "%";
            points.style.top =
              Math.max(
                10,
                (cells.reduce((n, i) => n + Math.floor(i / 6), 0) /
                  cells.length /
                  6) *
                  100,
              ) + "%";
            board.append(points);
          }
          setTimeout(
            () => animate(index + 1),
            matchMedia("(prefers-reduced-motion: reduce)").matches
              ? 80
              : Math.max(100, Math.min(260, 1000 / frames.length)),
          );
        };
        animate(0);
      }

      save();
      if (!(e.type === "swap" && ok)) render();
      if (["pictureBegin", "nextPicture"].includes(e.type))
        document.querySelector("#app").scrollTop = 0;
      if (
        ok &&
        e.type === "chore" &&
        a.score > prior &&
        ["weeds", "tomatoes"].includes(a.id)
      ) {
        JobScenes.lift(a, e.item, sourceRect, sourceHTML);
      }
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
  function stackTouch(event, i) {
    TouchActions.run(event, () => stack(i));
  }
  function stack(i) {
    if (Date.now() < ui.suppress || ui.paused || ui.falling) return;
    const a = state.jobs.active;
    if (!a || a.id !== "stacks" || a.ended) return;
    if (ui.selected === i) {
      ui.selected = null;
      render();
      return;
    }
    if (ui.selected === null) {
      if (!a.data.crates[i].length) return;
      ui.selected = i;
      ui.feedback = "Now choose an empty or matching crate.";
      render();
    } else act({ type: "stack", from: ui.selected, to: i });
  }
  function letterSlot(slot) {
    if (ui.paused || Date.now() < ui.suppress) return;
    const d = state.jobs.active.data;
    if (ui.selected === null) {
      if (d.slots[slot] !== null) pick(d.slots[slot]);
      return;
    }
    act({ type: "letter", tile: ui.selected, slot });
  }
  function returnLetter() {
    if (ui.selected !== null) act({ type: "returnLetter", tile: ui.selected });
  }
  function lawnAct(event) {
    if ((ui.lawnResetUntil || 0) > Date.now()) return;
    if (ui.paused) return;
    checkpoint();
    const a = state.jobs.active;
    if (a?.id !== "tidy" || a.rulesVersion < 3 || a.ended) return;
    const stage = a.data.stage,
      resets = a.data.resets || 0;
    const ok = J.action(state, event);
    if (!ok) return;
    save();
    if ((a.data.resets || 0) > resets) {
      ui.drag = null;
      ui.lawnResetUntil = Date.now() + 650;
      ui.feedback =
        "Oops, that's a flower! Let's start mowing again and steer around the flowers.";
      const feedback = document.querySelector(".job-feedback");
      if (feedback) feedback.textContent = ui.feedback;
    }
    if (stage !== a.data.stage || a.ended) {
      clear();
      render();
    } else {
      JobLawnScene.paint(a);
      paint();
    }
  }
  function lawnStep(dir) {
    const a = state.jobs.active;
    if (!a || a.id !== "tidy") return;
    const d = a.data,
      delta = { up: -d.width, down: d.width, left: -1, right: 1 }[dir];
    lawnAct({ type: "mow", cell: d.mower + delta });
  }
  function lawnTap(e) {
    if ((ui.lawnResetUntil || 0) > Date.now()) return;
    const world = document.querySelector(".job-lawn-world"),
      a = state.jobs.active;
    if (!world || !a) return;
    const d = a.data,
      r = world.getBoundingClientRect(),
      x = Math.floor(((e.clientX - r.x) / r.width) * d.width),
      y = Math.floor(((e.clientY - r.y) / r.height) * d.height);
    if (x < 0 || x >= d.width || y < 0 || y >= d.height) return;
    const cell = y * d.width + x;
    if (d.stage === "rake") lawnAct({ type: "rake", cell });
    else if (d.stage === "mow") {
      const cx = d.mower % d.width,
        cy = Math.floor(d.mower / d.width),
        dx = x - cx,
        dy = y - cy;
      if (dx || dy) {
        const next =
          Math.abs(dx) >= Math.abs(dy)
            ? d.mower + Math.sign(dx)
            : d.mower + Math.sign(dy) * d.width;
        lawnAct({ type: "mow", cell: next });
      }
    }
  }
  function compost() {
    if (ui.selected !== null) {
      lawnAct({ type: "compost", pile: +ui.selected });
      ui.selected = null;
    }
  }
  function recordText(value, kind) {
    return value === null || value === undefined
      ? "Not set yet"
      : kind === "points"
        ? `${value} points`
        : `${(value / 1000).toFixed(2)} seconds`;
  }
  function recordIndicator(id, a) {
    const mode = a?.mode || state.learningExperience;
    const entries = Object.entries(state.jobs.records || {}).filter(
      ([key, r]) => key.startsWith(id + "|" + mode + "|") && r.best !== null,
    );
    if (a) {
      const spec = J.recordSpec(a),
        r = state.jobs.records?.[spec.key];
      return "Personal best: " + recordText(r?.best, spec.kind);
    }
    if (!entries.length) return "Personal best: not set yet";
    const kind = ["match", "catch"].includes(id) ? "points" : "time",
      values = entries.map(([, r]) => r.best);
    return (
      "Personal best: " +
      recordText(
        kind === "points" ? Math.max(...values) : Math.min(...values),
        kind,
      )
    );
  }
  function difficultyLabel(key) {
    const [id, mode, version, settings] = key.split("|"),
      parts = settings.split("-").map(Number);
    const prefix = ["v3", "v4", "v5"].includes(version)
      ? ""
      : "Earlier saved game · ";
    if (["hidden", "sliding"].includes(id))
      return (
        JobGallery[id][parts[0]].title +
        " · " +
        (id === "hidden"
          ? parts[1] + " objects"
          : parts[1] + " × " + (version === "v5" ? parts[2] : parts[1])) +
        (parts.at(-1) ? " · hints / preview" : " · no hints")
      );
    if (["words", "labels"].includes(id))
      return (
        prefix +
        `Words with ${Math.min(...parts)}–${Math.max(...parts)} letters`
      );
    if (id === "stacks")
      return (
        prefix +
        `${parts[0]} vegetables per crate · ${parts[2] <= 1 ? "gentle" : parts[2] <= 2 ? "medium" : "tricky"} layout`
      );
    return (
      prefix +
      (mode === "little" ? "Little Gardener" : "Growing Gardener") +
      " challenge"
    );
  }
  function leaderboard(id) {
    const a = state.jobs.active;
    if (view === "jobs" && a && !ui.paused) {
      checkpoint();
      ui.paused = true;
      save();
      render();
    }
    const mode = a?.id === id ? a.mode : state.learningExperience,
      entries = Object.entries(state.jobs.records || {}).filter(([key]) =>
        key.startsWith(id + "|" + mode + "|"),
      );
    const name = J.catalog.find((j) => j.id === id).name;
    show(
      `<h2>${name} · Personal Leaderboard</h2><p>${mode === "little" ? "Little Gardener" : "Growing Gardener"} records stay on this device. ${["match", "catch"].includes(id) ? "More points is better." : "Less active time is better. There is no time limit."}</p><p>Compare the same experience and difficulty. First finish: $1. Beat an existing best: $3 total. Ties: $1.</p>${Number.isFinite(state.jobs.best[id]) && !Object.keys(state.jobs.records || {}).some((key) => key.startsWith(id + "|")) ? `<p>Earlier saved best score: ${state.jobs.best[id]}. New records compare matching experiences and challenges.</p>` : ""}${entries.length ? entries.map(([key, r]) => `<section class="job-local-record"><strong>${difficultyLabel(key)}</strong><p>Personal best: ${recordText(r.best, r.last.kind)}</p><p>Previous best: ${recordText(r.last.previousBest, r.last.kind)}</p><p>Latest result: ${recordText(r.last.value, r.last.kind)}${Number.isFinite(r.last.moves) ? ` · ${r.last.moves} moves` : ""}${r.last.won ? " · completed" : " · practice"} · $${r.last.rewardCents / 100}</p></section>`).join("") : "<p>Finish this job to set your first record!</p>"}${a?.id === id && a.ended ? `<p>Current result: ${recordText(J.result(state.jobs, a).value, J.result(state.jobs, a).kind)}. Collect your reward to save a successful record.</p>` : ""}`,
      "job-records",
    );
  }
  function tile(i) {
    if (Date.now() < ui.suppress) return;
    if (state.jobs.active.rulesVersion >= 3) {
      pick(i);
      return;
    }
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
    if (Date.now() < ui.suppress || ui.paused || ui.falling) return;
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
  function touchResult(event, action) {
    if (event.pointerType !== "touch") return;
    // The same gesture's compatibility click can be missing or retargeted to
    // the replacement dialog. Consume only that click, never the next real tap.
    ui.resultTouchUntil = Date.now() + 600;
    event.preventDefault();
    if (action === "collect") collect();
    else if (action === "retry") retry();
  }
  function retry() {
    if (!state.jobs.active?.ended || state.jobs.active.won) return;
    const id = state.jobs.active.id;
    J.quit(state);
    start(id);
  }
  function collect() {
    // Mobile browsers may suppress the compatibility click after an arcade
    // gesture. Touch releases activate directly; a subsequent click is a no-op.
    if (!state.jobs.active?.won || !state.jobs.active.ended) return;
    try {
      const r = J.claim(state);
      ui.paused = true;
      save();
      Narration.speak(
        `Thank you for helping! Here ${r.rewardCents === 300 ? "are three dollars for your new personal best" : "is one dollar"}.`,
        r.id === "catch" ? "jones" : "magee",
      );
      show(
        `<h2>Thank you, neighbor!</h2><p>You earned ${money(r.rewardCents / 100)} total${r.newBest && r.rewardCents === 300 ? " — New Personal Best!" : ""}. You now have ${money(state.cash)}.</p><button class="btn" onclick="go('jobs')">Back to Job Board</button>`,
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
          countdown(Math.max(0, J.clockLimit(a) - a.elapsed)),
        ),
      );
    document
      .querySelector("[data-job-score]")
      ?.replaceChildren(document.createTextNode(a.score));
    JobScenes.paint(a, ui.selected, ui.drag?.moved ? ui.drag.item : null);
    if (a.id === "catch") {
      if (a.score > ui.lastScore) Narration.effect();
      ui.lastScore = a.score;
    }
  }

  function sync() {
    if (state.jobs?.active) {
      JobScenes.restore(state.jobs.active);
      JobPictureGames.sync();
      paint();
    }
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
  document.addEventListener(
    "pointerdown",
    () => {
      ui.resultTouchUntil = 0;
      ui.suppress = 0;
      ui.lawnResetUntil = 0;
    },
    true,
  );
  document.addEventListener(
    "keydown",
    () => {
      ui.resultTouchUntil = 0;
    },
    true,
  );
  // Shared pointer capture: drag cards into crates/baskets; tap alternatives stay available.
  document.addEventListener("pointerdown", (e) => {
    if (view !== "jobs" || ui.paused || !e.isPrimary) return;
    let el = e.target.closest(
      "[data-job-drag],[data-letter],[data-catch-world],[data-job-row]",
    );
    if (!el || el.disabled) return;
    const healthyPan =
      el.dataset.jobDrag === "chore" &&
      state.jobs.active?.id === "weeds" &&
      state.jobs.active.data.items[+el.dataset.item]?.kind === "plant";
    if (healthyPan) el = el.closest("[data-job-row]");
    ui.drag = {
      el,
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      item: +el.dataset.item,
      kind:
        el.dataset.jobDrag ||
        (el.hasAttribute("data-letter")
          ? "word"
          : el.hasAttribute("data-job-row")
            ? "row"
            : "catch"),
      scrollStart: el.scrollLeft,
      scrollTopStart: el.scrollTop,
      start: +el.dataset.letter,
    };
    el.setPointerCapture(e.pointerId);
    if (ui.drag.kind === "catch") basketAt(e);
    if (ui.drag.kind === "lawn") lawnTap(e);
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
      if (d.kind === "row") {
        if (
          Math.hypot(
            e.clientX - d.x,
            d.el.hasAttribute("data-job-bed") ? e.clientY - d.y : 0,
          ) > 8
        )
          d.moved = true;
        if (d.moved) {
          e.preventDefault();
          d.el.scrollLeft = d.scrollStart + d.x - e.clientX;
          if (d.el.hasAttribute("data-job-bed"))
            d.el.scrollTop = d.scrollTopStart + d.y - e.clientY;
        }
        return;
      }
      if (d.kind === "lawn") {
        d.moved = true;
        e.preventDefault();
        if (performance.now() - (d.last || 0) > 60) {
          lawnTap(e);
          d.last = performance.now();
        }
        return;
      }
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
          d.kind === "water"
            ? gardenCanArt()
            : d.kind === "stack"
              ? d.el.querySelector("[data-stack-top]")?.innerHTML || ""
              : d.el.innerHTML;
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
    if (!d.moved || d.kind === "catch" || d.kind === "lawn" || d.kind === "row")
      return;
    e.preventDefault();
    if (d.kind === "word" && d.end !== undefined) wordPath(d.start, d.end);
    else if (drop) {
      const target = drop.dataset.jobDrop;
      if (d.kind === "stack" && target.startsWith("stack-"))
        act({ type: "stack", from: d.item, to: +target.slice(6) });
      else if (d.kind === "pack") act({ type: "pack", item: d.item, target });
      else if (d.kind === "pile" && target === "compost")
        lawnAct({ type: "compost", pile: d.item });
      else if (d.kind === "letter" && target === "letter-tray")
        act({ type: "returnLetter", tile: d.item });
      else if (d.kind === "letter" && target.startsWith("letter-"))
        act({ type: "letter", tile: d.item, slot: +target.slice(7) });
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
      if (Date.now() < (ui.resultTouchUntil || 0)) {
        ui.resultTouchUntil = 0;
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
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
  function pictureFeedback(text) {
    ui.feedback = text;
    const el = document.querySelector(".job-feedback");
    if (el) el.textContent = text;
  }
  return {
    pictureFeedback,
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
    stackTouch,
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
    touchResult,
    read,
    readInstruction,
    settings,
    letterSlot,
    returnLetter,
    lawnTap,
    lawnStep,
    compost,
    leaderboard,
  };
})();
