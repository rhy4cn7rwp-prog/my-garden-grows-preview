/* A continuous illustrated yard with invisible cell geometry for safe movement. */
const JobLawnScene = (() => {
  function mower() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="82" rx="43" ry="10" fill="#40583344"/><path d="M35 54 20 14h48L62 56" fill="none" stroke="#667f78" stroke-width="7"/><rect x="18" y="9" width="54" height="10" rx="5" fill="#77543e"/><rect x="11" y="61" width="17" height="30" rx="7" fill="#4e594f"/><rect x="72" y="61" width="17" height="30" rx="7" fill="#4e594f"/><path d="M24 52q29-13 53 1l8 28H16Z" fill="#cf7451" stroke="#89553a" stroke-width="4"/><rect x="32" y="43" width="34" height="25" rx="6" fill="#e5c177" stroke="#9c7a45" stroke-width="3"/><path d="M38 47h22m-22 6h22" stroke="#b6945c" stroke-width="3"/></svg>`;
  }
  function rake() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="m26 94 43-62" stroke="#b88952" stroke-width="8"/><path d="m46 21 41 27m-38-24-9 15m20-8-9 16m20-9-9 16m20-8-9 15" stroke="#839b90" stroke-width="6" stroke-linecap="round"/></svg>`;
  }
  function compost() {
    return `<svg viewBox="0 0 140 120" aria-hidden="true"><path d="m17 31 106 0-8 77H26Z" fill="#8a9c58" stroke="#657641" stroke-width="4"/><path d="M14 29 27 14h86l16 15Z" fill="#b3bd76" stroke="#768747" stroke-width="4"/><path d="M42 40v55m28-55v55m28-55v55" stroke="#657c42" stroke-width="4"/><path d="m55 65 12-15 14 14-7 1 3 13-10 5-9-9 3-1Z" fill="#e4e9b4"/></svg>`;
  }
  function pileButtons(d) {
    const stage = d.stage;
    return [0, 1, 2]
      .map((p) =>
        d.piles[p] && !d.collected[p]
          ? `<button class="lawn-pile" data-job-drag="pile" data-item="${p}" onclick="Neighborhood.pick(${p})" onpointerup="TouchActions.run(event,()=>Neighborhood.pick(${p}))" aria-label="Grass pile ${p + 1}" style="left:${[20, 68, 40][p]}%;top:${[17, 49, 78][p]}%;--pile-size:${Math.min(1, 0.5 + d.piles[p] / d.target)}" ${stage !== "compost" ? "disabled" : ""}><svg viewBox="0 0 100 65" aria-hidden="true"><path d="M5 57q13-50 42-38 28-33 48 38Z" fill="#7b9c4d" stroke="#56753a" stroke-width="3"/><path d="m20 49 13-14m3 19 13-21m5 15 12-21m4 26 13-9" stroke="#b1c57a" stroke-width="4"/></svg><span>${d.piles[p]}</span></button>`
          : "",
      )
      .join("");
  }
  function scene(a) {
    const d = a.data,
      cut = d.cells.filter((c) => c.cut).length,
      raked = d.cells.filter((c) => c.raked).length,
      stage = d.stage;
    const instruction =
      stage === "mow"
        ? `Mow every grassy patch: ${cut} / ${d.target}. Steer around the flowerbeds.`
        : stage === "rake"
          ? `Rake the clippings: ${raked} / ${d.target}. Sweep the rake across the cut lawn.`
          : `Put all three piles in the compost bin: ${d.collected.filter(Boolean).length} / 3.`;
    return `<p class="lawn-task" role="status"><strong>${stage === "mow" ? "1. Mow the lawn" : "2. Rake and compost"}</strong><br>${instruction}</p><div class="job-lawn-world ${stage}" data-job-drag="lawn" aria-label="Illustrated lawn; steer the mower or sweep the rake" onpointerup="TouchActions.run(event,()=>Neighborhood.lawnTap(event))" onclick="Neighborhood.lawnTap(event)" style="--lawn-cols:${d.width};--lawn-rows:${d.height}"><div class="lawn-fence"></div>${d.cells.map((c, i) => `<div class="lawn-patch ${c.blocked ? "obstacle" : c.cut ? "cut" : "tall"} ${c.raked ? "raked" : ""} ${c.cleared ? "cleared" : ""}" data-lawn-cell="${i}" style="left:${((i % d.width) / d.width) * 100}%;top:${(Math.floor(i / d.width) / d.height) * 100}%;width:${100 / d.width}%;height:${100 / d.height}%">${c.blocked ? JobArt.flower(true, i) : `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M0 50 5 19l9 19 8-32 10 29 9-20 8 24 9-12 2 33H0Z" fill="${c.cut ? "#9fbd68" : "#749f4f"}"/><path d="m4 43 8-13m5 13 6-18m9 20 4-16m8 17 7-9" stroke="${c.cut ? "#b5cf83" : "#9fbf69"}" stroke-width="3"/></svg>${'<span class="lawn-clippings">⌁ ⌁</span>'}`}</div>`).join("")}<div class="lawn-tool ${stage === "mow" ? "mower" : "rake"}" style="left:${((((stage === "mow" ? d.mower : d.rake) % d.width) + 0.5) / d.width) * 100}%;top:${((Math.floor((stage === "mow" ? d.mower : d.rake) / d.width) + 0.5) / d.height) * 100}%">${stage === "mow" ? mower() : rake()}</div><div class="lawn-piles" data-lawn-piles>${pileButtons(d)}</div></div>${
      stage === "mow"
        ? `<div class="lawn-steering" aria-label="Mower directions">${[
            ["up", "↑"],
            ["left", "←"],
            ["down", "↓"],
            ["right", "→"],
          ]
            .map(
              ([dir, label]) =>
                `<button class="btn" onclick="Neighborhood.lawnStep('${dir}')" onpointerup="TouchActions.run(event,()=>Neighborhood.lawnStep('${dir}'))" aria-label="Mow ${dir}">${label}</button>`,
            )
            .join("")}</div>`
        : `<div class="lawn-rake-help">${rake()}<span>${stage === "rake" ? "Sweep across the lawn, or tap clippings." : "Choose a pile, then tap the compost bin."}</span><button class="lawn-compost" data-job-drop="compost" onclick="Neighborhood.compost()" onpointerup="TouchActions.run(event,()=>Neighborhood.compost())" aria-label="Compost bin">${compost()}<b>Compost</b></button></div>`
    }`;
  }
  function paint(a) {
    const d = a.data,
      world = document.querySelector(".job-lawn-world");
    if (!world) return;
    world.querySelectorAll("[data-lawn-cell]").forEach((el) => {
      const c = d.cells[+el.dataset.lawnCell];
      el.classList.toggle("cut", c.cut);
      el.classList.toggle("tall", !c.cut && !c.blocked);
      el.classList.toggle("raked", c.raked);
      el.classList.toggle("cleared", c.cleared);
    });
    const tool = world.querySelector(".lawn-tool"),
      cell = d.stage === "mow" ? d.mower : d.rake;
    if (tool) {
      tool.style.left = (((cell % d.width) + 0.5) / d.width) * 100 + "%";
      tool.style.top =
        ((Math.floor(cell / d.width) + 0.5) / d.height) * 100 + "%";
    }
    const count = d.cells.filter((c) =>
      d.stage === "mow" ? c.cut : c.raked,
    ).length;
    document.querySelector(".lawn-task").innerHTML =
      `<strong>${d.stage === "mow" ? "1. Mow the lawn" : "2. Rake and compost"}</strong><br>${d.stage === "mow" ? "Mow every grassy patch" : "Rake the clippings"}: ${count} / ${d.target}.`;
    const piles = world.querySelector("[data-lawn-piles]");
    if (piles) piles.innerHTML = pileButtons(d);
  }
  return { scene, mower, rake, compost, paint };
})();
