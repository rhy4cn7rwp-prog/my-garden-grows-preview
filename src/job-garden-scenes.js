/* An overhead carrot bed, built from separate plants that leave soil behind. */
const JobGardenScenes = (() => {
  function tops(seed) {
    return `<img src="assets/job-garden/carrot-tops.webp" alt="" draggable="false" style="transform:rotate(${seed * 37}deg)"/>`;
  }
  function weed(seed) {
    return `<svg viewBox="0 0 100 130" aria-hidden="true"><ellipse cx="50" cy="95" rx="21" ry="9" fill="#352719" opacity=".3"/><g stroke="#8d8035" fill="#c8bb58" stroke-width="1.5"><path d="M50 99Q18 71 15 23q17 14 35 76M51 98Q74 61 83 32q7 29-32 66M48 98Q37 44 31 12q20 18 17 86M52 97Q62 40 69 15q5 38-17 82"/><path d="M50 99Q51 42 49 8" fill="none" stroke-width="3"/>${Array.from({ length: 5 }, (_, i) => `<path d="m49 ${10 + i * 8}-9-7 1 10 8 5 9-8-1-8-8 8Z" fill="${seed % 2 ? "#ddc26e" : "#c7b558"}"/>`).join("")}</g><g stroke="#aa8b62" stroke-width="1.5" fill="none"><path d="m50 97-4 18-5 7m8-14 9 12m-7-23 3 28"/></g></svg>`;
  }
  function bed(a) {
    const d = a.data,
      clusters = a.mode === "little" ? 4 : 5;
    return `<p class="bed-instruction">Pull golden grassy weeds. Leave the feathery green carrot tops.</p><div class="job-row-window overhead-bed" data-job-row data-job-bed aria-label="Overhead carrot bed. Drag soil in either direction to explore."><div class="overhead-soil" style="--clusters:${clusters}"><svg class="bed-earth" viewBox="0 0 1100 430" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="bed-soil-grain"><feTurbulence type="fractalNoise" baseFrequency=".14" numOctaves="3" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".18"/></feComponentTransfer></filter></defs><rect width="1100" height="430" filter="url(#bed-soil-grain)"/>${Array.from({ length: 48 }, (_, i) => `<ellipse cx="${(i * 167 + 31) % 1100}" cy="${(i * 113 + 27) % 430}" rx="${2 + (i % 4)}" ry="${1 + (i % 3)}" fill="${i % 2 ? "#b08b61" : "#61432e"}" opacity=".5"/>`).join("")}</svg>${Array.from(
      { length: clusters },
      (_, n) => {
        const x = 100 + n * 210,
          y = 145 + (n % 2) * 65,
          items = d.items
            .map((it, i) => ({ it, i }))
            .filter(({ it }) => it.cluster === n);
        return `<section class="overhead-cluster" style="left:${x}px;top:${y}px" data-row-station="${n}">${items.map(({ it, i }, slot) => `<button data-job-drag="chore" data-item="${i}" onpointerup="TouchActions.run(event,()=>Neighborhood.chore(${i}))" onclick="Neighborhood.chore(${i})" class="overhead-pick ${it.kind === "plant" ? "carrot-healthy" : "row-weed yellow-weed"} ${it.done ? "picked" : ""}" style="--plant-x:${[-20, 140, -20, 140, 36][slot]}px;--plant-y:${[-20, -20, 155, 155, 48][slot]}px;--plant-turn:${it.kind === "plant" ? 0 : (slot - 2) * 19}deg" aria-label="${it.kind === "plant" ? "Healthy carrot tops" : it.done ? "Finished weed" : "Golden grassy weed"} ${i + 1}" ${it.done ? "disabled" : ""}>${it.kind === "plant" ? tops(n) : weed(i)}</button>`).join("")}</section>`;
      },
    ).join(
      "",
    )}<span class="soil-stone" style="left:35%;top:88%"></span><span class="soil-stone" style="left:88%;top:15%"></span></div></div><div class="job-row-footer"><div class="job-drop-basket" data-job-drop="basket">${JobArt.basket()}<span>Weed basket</span></div><div><strong>${a.score} of ${d.target} weeds</strong><progress max="${d.target}" value="${a.score}" aria-label="Weeding progress"></progress><small>Swipe the soil both ways to find every weed.</small></div></div>`;
  }
  return { bed };
})();
