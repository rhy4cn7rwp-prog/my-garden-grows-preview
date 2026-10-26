/* Four illustrated stages use the crop's existing watered-day requirements.
   Established repeat producers retain their leaves while the next harvest grows. */
(function (root) {
  function stage(c, p) {
    if (p.age >= c.days)
      return { number: 4, name: "Harvest ready", regrowing: false };
    if (c.repeat > 0 && p.left < c.repeat)
      return { number: 3, name: "Regrowing after harvest", regrowing: true };
    if (p.age === 0)
      return { number: 1, name: "Newly planted", regrowing: false };
    if (p.age < Math.max(2, Math.ceil(c.days * 0.6)))
      return { number: 2, name: "Small sprout", regrowing: false };
    return { number: 3, name: "Growing plant", regrowing: false };
  }
  function closeup(c, p) {
    const s = stage(c, p);
    return `<figure class="garden-crop-closeup" data-crop="${c.id}" data-growth-stage="${s.number}"><img src="assets/garden-growth/${c.id}-${s.number}.svg?v=garden-learning-1" alt="${c.name}: ${s.name.toLowerCase()}${["carrot", "onion", "potato", "radish"].includes(c.id) ? ", with roots below the soil" : ""}"/><figcaption>${s.name}${s.regrowing ? " · established plant, new harvest" : ""}</figcaption></figure>`;
  }
  const api = { stage, closeup };
  if (typeof module !== "undefined") module.exports = api;
  root.GardenCrops = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
