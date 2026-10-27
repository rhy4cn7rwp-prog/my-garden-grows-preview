/* Illustrated chore/arcade worlds; domain actions still use NeighborhoodJobs. */
const JobScenes = (() => {
  const J = NeighborhoodJobs;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rowMemory = new Map();
  const key = (a) => `${a.serial}:${a.seed}:${a.id}:${a.mode}`;
  function packet(i, kind, selected) {
    return `<button data-pack-item="${i}" data-job-drag="pack" data-item="${i}" onpointerup="TouchActions.run(event,()=>Neighborhood.pick(${i}))" onclick="Neighborhood.pick(${i})" aria-label="Pick ${kind}" class="belt-produce ${selected === i ? "selected" : ""}">${Neighborhood.icon(kind)}</button>`;
  }
  function packing(a, selected) {
    const d = a.data,
      front = J.packingFronts(a);
    return `<p>Three belts bring vegetables toward you. Pick one, then choose its basket.</p><div class="job-three-belts" aria-label="Three conveyor lanes moving toward you">${front
      .map(
        (i, lane) =>
          `<div class="job-lane" data-lane="${lane}"><div class="job-belt-surface"></div><span class="job-lane-number">${lane + 1}</span><span class="job-pickup">Pick up ↓</span>${
            i < 0
              ? '<span class="job-lane-empty">All packed!</span>'
              : `${packet(i, d.items[i], selected)}${(() => {
                  const next = d.items.findIndex(
                    (_, n) => n > i && n % 3 === lane && !d.sorted.includes(n),
                  );
                  return next >= 0
                    ? `<span class="job-next-produce" aria-label="Next: ${d.items[next]}">${Neighborhood.icon(d.items[next])}</span>`
                    : "";
                })()}`
          }</div>`,
      )
      .join(
        "",
      )}</div><div class="job-bushels">${d.kinds.map((k) => `<button data-job-drop="${k}" onpointerup="TouchActions.run(event,()=>Neighborhood.place('${k}'))" onclick="Neighborhood.place('${k}')" aria-label="${k} crate">${JobArt.basket()}<span class="bushel-sample">${Neighborhood.icon(k)}</span><b>${k}</b></button>`).join("")}</div><p>${d.sorted.length} of ${d.items.length} packed</p>`;
  }
  function catchScene(a) {
    return `<div class="job-catch-world living-catch" data-catch-world aria-label="Catch carrots by moving the basket" style="--toss-time:${a.data.launchEvery}ms;--toss-offset:-${a.elapsed}ms">${JobArt.field()}<div class="job-jones">${JobArt.jones()}</div><div class="job-jones-bubble">“Ready? Here comes a carrot!”</div><div class="job-carrots"></div><div class="job-catching-basket" style="width:${a.data.width * 100}%;left:${a.data.basket * 100}%">${JobArt.basket()}<span class="job-catch-glow"></span></div></div><p><span data-catch-count>${a.data.caught.length}</span> carrots caught · Goal ${a.data.target} points</p><div class="job-actions"><button class="btn" onclick="Neighborhood.moveBasket(-.1)">Move left</button><button class="btn" onclick="Neighborhood.moveBasket(.1)">Move right</button></div>`;
  }
  function rows(a) {
    const d = a.data,
      tomato = a.id === "tomatoes";
    let groups;
    if (tomato)
      groups = Array.from({ length: a.rulesVersion>=4?10:4 }, (_, n) =>
        d.items
          .map((it, i) => ({ it, i }))
          .filter(({ it,i }) => (a.rulesVersion>=4?it.plant:Math.floor(i / 3)) === n),
      );
    else if (a.rulesVersion >= 3)
      groups = Array.from({ length: a.mode === "little" ? 4 : 5 }, (_, n) =>
        d.items
          .map((it, i) => ({ it, i }))
          .filter(({ it }) => it.cluster === n),
      );
    else groups = d.items.map((it, i) => [{ it, i }]);
    return `<p>${tomato ? "Pick ripe red tomatoes. Let green ones grow." : "Pull yellow jagged weeds. Leave green feathery carrot tops."} ${a.score} / ${d.target}</p><div class="job-row-window ${tomato ? "" : "carrot-bed"}" data-job-row aria-label="${tomato ? "Tomato" : "Carrot"} row; swipe to explore"><div class="job-row-landscape"><div class="job-row-start">Start<br>the row →</div>${groups.map((group, n) => `<section class="job-row-station ${tomato ? "" : "carrot-cluster"}" data-row-station="${n}"><div class="job-crop-stalk">${tomato ? `<div style="transform:scaleX(${n%2?-1:1}) rotate(${(n%3-1)*4}deg)">${JobArt.plant("tomato")}</div>` : JobArt.carrotTops()}</div>${group.map(({ it, i }, slot) => `<button data-job-drag="chore" data-item="${i}" onpointerup="TouchActions.run(event,()=>Neighborhood.chore(${i}))" onclick="Neighborhood.chore(${i})" class="job-row-pick ${tomato ? "row-tomato" : it.kind === "plant" ? "carrot-healthy" : "row-weed yellow-weed"} ${it.done ? "picked" : ""} ${it.kind === "green" ? "unripe" : ""}" style="--fruit-x:${[25, 72, 35,70][slot]}%;--fruit-y:${[34, 43, 68,77][slot]}%;--weed-x:${[13, 86, 38, 65, 50][slot]}%;--weed-bottom:${[16, 18, 0, 39, 45][slot]}%" aria-label="${it.done ? "Finished" : it.kind === "plant" ? "Healthy carrot tops" : it.kind} ${i + 1}" ${it.done ? "disabled" : ""}>${tomato ? Neighborhood.icon(it.kind === "green" ? "tomato-green" : "tomato-ripe") : it.kind === "plant" ? JobArt.carrotTops() : JobArt.yellowWeed(a.mode === "growing")}${tomato ? `<small>${it.kind === "green" ? "Not ripe" : "Ripe"}</small>` : ""}</button>`).join("")}</section>`).join("")}<div class="job-row-end">End of<br>the row!<span>✦</span></div></div></div><div class="job-row-footer"><div class="job-drop-basket" data-job-drop="basket">${JobArt.basket()}<span>${tomato ? "Harvest" : "Weed"} basket</span></div><div><strong>${a.score} of ${d.target}</strong><progress max="${d.target}" value="${a.score}" aria-label="Row progress"></progress><small>Swipe the scenery both ways. Tap or pull into the basket.</small></div></div>`;
  }
  function flowers(a, selected) {
    return `<p>Water every thirsty flower. Paths and grass can stay dry! ${a.score} / ${a.data.target}</p><div class="job-flower-tools"><button class="job-can ${selected === "water" ? "selected" : ""}" data-job-drag="water" onpointerup="TouchActions.run(event,()=>Neighborhood.pick('water'))" onclick="Neighborhood.pick('water')" aria-label="Pick up watering can">${gardenCanArt()}</button><span>Drag the can to a flower,<br>or pick it up and tap a flower.</span></div><div class="job-flower-grid" aria-label="Six by six flower garden">${J.flowerPlots(
      a,
    )
      .map((p, n) =>
        p.kind === "flower"
          ? `<button class="job-flower-bed ${a.data.items[p.item].done ? "blooming" : ""}" data-job-drop="yard-${p.item}" data-job-drag="chore" data-item="${p.item}" onpointerup="TouchActions.run(event,()=>Neighborhood.chore(${p.item}))" onclick="Neighborhood.chore(${p.item})" aria-label="${a.data.items[p.item].done ? "Blooming" : "Thirsty"} flower ${p.item + 1}" ${a.data.items[p.item].done ? "disabled" : ""}>${JobArt.flower(a.data.items[p.item].done, p.item)}${a.data.items[p.item].done ? "<span>✓</span>" : ""}</button>`
          : `<div class="job-flower-ground ${p.kind}" aria-label="${p.kind}">${JobArt.ground(p.kind)}</div>`,
      )
      .join("")}</div>`;
  }
  function remember(a) {
    const row = document.querySelector("[data-job-row]");
    if (row) rowMemory.set(key(a), {x:row.scrollLeft,y:row.scrollTop});
  }
  function restore(a) {
    const row = document.querySelector("[data-job-row]");
    if (!row) return;
    const memorized = rowMemory.get(key(a));
    if (memorized !== undefined) {row.scrollLeft=typeof memorized==="number"?memorized:memorized.x;row.scrollTop=memorized.y||0;}
    else row.scrollLeft = 0;
    row.onscroll = () => rowMemory.set(key(a), {x:row.scrollLeft,y:row.scrollTop});
  }
  function lift(a, index, rect, html) {
    if (reduced() || !rect) return;
    const ghost = document.createElement("div");
    ghost.className = `job-picked-ghost ${a.id === "weeds" ? "pull-roots" : "pick-fruit"}`;
    ghost.innerHTML = html + "<i></i><i></i><i></i>";
    Object.assign(ghost.style, {
      left: rect.x + "px",
      top: rect.y + "px",
      width: rect.width + "px",
      height: rect.height + "px",
    });
    document.body.append(ghost);
    const basket = document
      .querySelector(".job-drop-basket")
      ?.getBoundingClientRect();
    if (a.id === "tomatoes" && basket) {
      ghost.style.setProperty(
        "--pick-x",
        basket.x + basket.width / 2 - rect.x - rect.width / 2 + "px",
      );
      ghost.style.setProperty("--pick-y", basket.y - rect.y + "px");
    }
    setTimeout(() => ghost.remove(), 650);
  }
  function paint(a, selected, held) {
    if (a.id === "packing")
      document.querySelectorAll("[data-pack-item]").forEach((el) => {
        const lane = +el.dataset.item % 3,
          p = reduced() ? 1 : J.packingProgress(a, lane);
        if (held === +el.dataset.item) return;
        el.style.top = 14 + 58 * p + "%";
        el.style.setProperty("--produce-scale", 0.78 + 0.22 * p);
      });
    if (a.id !== "catch") return;
    const d = a.data,
      holder = document.querySelector(".job-carrots");
    let recent = false;
    if (holder)
      holder.innerHTML = Array.from(
        { length: Math.ceil(60000 / d.launchEvery) },
        (_, i) => J.carrot(a, i),
      )
        .map((c) => {
          const age = a.elapsed - c.launch;
          if (age < 0) return "";
          if (d.caught.includes(c.index)) {
            if (a.elapsed - J.catchTime(a, c) < 340) recent = true;
            return "";
          }
          if (age > c.flight + 320) return "";
          const p = J.carrotPose(a, c),
            miss = age >= c.flight,
            extra = miss ? (age - c.flight) / 320 : 0;
          const y = miss
            ? (a.rulesVersion >= 2 ? 0.92 : 0.78) +
              0.1 * extra -
              0.09 * Math.sin(extra * Math.PI)
            : p.y;
          return `<span data-flying-carrot="${c.index}" class="flying-carrot ${c.big ? "big" : ""} ${miss ? "missed" : ""}" style="left:${p.x * 100}%;top:${y * 100}%;transform:translate(-50%,-50%) rotate(${p.t * 290}deg);opacity:${miss ? 1 - extra : 1}">${Neighborhood.icon("carrot")}</span>`;
        })
        .join("");
    const basket = document.querySelector(".job-catching-basket");
    if (basket) {
      basket.style.left = d.basket * 100 + "%";
      basket.classList.toggle("caught", recent);
      const glow = basket.querySelector(".job-catch-glow");
      if (
        glow &&
        glow.dataset.catchId !== String(recent ? d.caught.at(-1) : "none")
      ) {
        glow.dataset.catchId = String(recent ? d.caught.at(-1) : "none");
        glow.innerHTML = recent
          ? `<span>${Neighborhood.icon("carrot")}</span><b>+${d.caught.at(-1) % 7 === 6 ? 2 : 1}</b>`
          : "";
      }
    }
    const bubble = document.querySelector(".job-jones-bubble");
    const big = Array.from(
      { length: Math.ceil(60000 / d.launchEvery) },
      (_, i) => J.carrot(a, i),
    ).some(
      (c) => c.big && a.elapsed >= c.launch && a.elapsed < c.launch + c.flight,
    );
    const words = recent
      ? "“A splendid catch! Thank you!”"
      : big
        ? "“Ha! Look at that whopper!”"
        : "“Ready? Here comes a carrot!”";
    if (bubble && bubble.textContent !== words) bubble.textContent = words;
    const jones = document.querySelector(".job-jones");
    if (jones) jones.classList.toggle("catch-smile", recent);
    document
      .querySelector("[data-catch-count]")
      ?.replaceChildren(document.createTextNode(d.caught.length));
  }
  return {
    packing,
    catchScene,
    rows,
    flowers,
    remember,
    restore,
    lift,
    paint,
  };
})();
