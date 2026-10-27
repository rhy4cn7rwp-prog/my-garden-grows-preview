/* Original small picture clues for every early-reader vocabulary word. */
const JobWordPictures = (() => {
  const svg = (body) =>
    `<svg class="job-symbol word-picture" viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="105" rx="49" ry="8" fill="#b9ab7733"/>${body}</svg>`;
  const leaf =
    '<path d="M30 82Q10 32 89 25q12 63-59 57Z" fill="#8fba59" stroke="#4e7f3d" stroke-width="4"/><path d="m25 90 49-44" stroke="#568641" stroke-width="4"/>';
  function art(word) {
    word = word.toUpperCase();
    const common = {
      SEED: '<path d="M33 91q-20-42 19-55 32 24 9 55-11 12-28 0m41-46q-5-33 21-28 18 23-2 42" fill="#c69a58" stroke="#87613a" stroke-width="4"/>',
      SOIL: '<path d="M10 63q50-25 100 0v39H10Z" fill="#a47b4c" stroke="#795936" stroke-width="3"/><g fill="#d2b98b"><ellipse cx="31" cy="76" rx="6" ry="3"/><ellipse cx="78" cy="84" rx="7" ry="4"/><circle cx="57" cy="65" r="4"/></g>',
      ROOT: '<path d="M60 52v37m0-17-25 23m25-12 25 19m-25-12-2 17M33 65h54" stroke="#ac8256" stroke-width="5" fill="none"/><path d="M60 62V24Q23 7 27 38q12 15 33 5m0-4q37-39 34-8-8 19-34 17" fill="#85b456" stroke="#507b3c" stroke-width="3"/>',
      STEM: '<path d="M60 104V21" stroke="#4d8741" stroke-width="9"/><path d="M58 66Q18 63 22 31q37 0 36 35m7 17q41-9 33-38-33 2-33 38" fill="#8fba59" stroke="#4e7f3d" stroke-width="3"/>',
      RAIN: '<path d="M24 53q-22-23 4-31 16-23 31-2 36-21 40 17 21 22-75 16" fill="#adc8ce" stroke="#6e97a1" stroke-width="3"/><path d="m30 65-10 19m39-18-10 20m37-20-10 20m-21 3-8 17" stroke="#659dbc" stroke-width="5" stroke-linecap="round"/>',
      GROW: '<path d="M27 100V80m32 20V61m33 40V31" stroke="#568741" stroke-width="6"/><path d="M28 82q-27-23-18-1m50-19q-27-33-31-3m34 1q25-30 27-6M91 36Q59 8 63 42m31-6q25-26 20 4" fill="#92b75f" stroke="#568741" stroke-width="3"/>',
      FARM: '<path d="M15 56 58 18l45 38v48H15Z" fill="#c66f51" stroke="#85593d" stroke-width="4"/><path d="m10 57 48-43 50 43" stroke="#754e35" stroke-width="8" fill="none"/><path d="M43 104V62h31v42m-31-42 31 42m0-42-31 42" stroke="#eac99a" fill="#9b5c40" stroke-width="3"/>',
      ROW: '<path d="m11 96 98-40M12 114l98-40M10 77l80-33" stroke="#a67c4f" stroke-width="11"/><g fill="#8cb759" stroke="#51803b" stroke-width="3"><path d="M29 87V55q-25-15-16 4m17 9q23-24 22-5M64 73V40q-25-15-16 4m17 9q23-24 22-5M96 60V28q-25-15-16 4"/></g>',
      WEED: '<path d="M60 105V25m0 60-34-15 12-9-19-20 27 4-5-26 19 16 21-17-5 27 25-3-17 23 10 9-34 16" fill="#c2b261" stroke="#8e7e3e" stroke-width="3"/>',
      BUD: '<path d="M60 108V60" stroke="#568741" stroke-width="7"/><path d="M58 77Q20 75 26 53q29 4 32 24" fill="#8eb55e"/><path d="M59 68Q19 37 58 17q42 23 1 51" fill="#dd91ac" stroke="#a65f7e" stroke-width="3"/><path d="m41 57 17 15 19-16-9 20-20-1Z" fill="#74a148"/>',
      PEA: '<path d="M20 96Q1 48 99 24q5 80-79 72Z" fill="#9fc568" stroke="#5b853f" stroke-width="4"/><circle cx="62" cy="63" r="20" fill="#bad67b" stroke="#739748" stroke-width="3"/>',
      PEAS: '<path d="M20 96Q1 48 99 24q5 80-79 72Z" fill="#9fc568" stroke="#5b853f" stroke-width="4"/><g fill="#c1da86" stroke="#739748" stroke-width="3"><circle cx="35" cy="79" r="12"/><circle cx="58" cy="61" r="12"/><circle cx="80" cy="43" r="12"/></g>',
      BEAN: '<path d="M22 97Q24 17 96 21q6 65-74 76Z" fill="#a2bd62" stroke="#547b3c" stroke-width="4"/><path d="M32 89q21-31 56-58" stroke="#6d9349" stroke-width="4"/>',
      OATS: '<path d="M60 110V17m0 25-23-9m23 30-24-8m24 26-21-4m21-29 24-10m-24 29 23-8m-23 27 23-8" stroke="#aa8a48" stroke-width="4"/><g fill="#e6cb7b" stroke="#aa8a48" stroke-width="2"><ellipse cx="32" cy="39" rx="8" ry="16"/><ellipse cx="33" cy="64" rx="8" ry="16"/><ellipse cx="35" cy="88" rx="8" ry="16"/><ellipse cx="88" cy="46" rx="8" ry="16"/><ellipse cx="88" cy="69" rx="8" ry="16"/><ellipse cx="87" cy="92" rx="8" ry="16"/></g>',
      HAY: '<rect x="15" y="43" width="90" height="58" rx="10" fill="#e3bf63" stroke="#ab8140" stroke-width="4"/><path d="M38 43v57m42-57v57M20 53l80 10m-80 5 80 10m-80 5 80 10" stroke="#b7904c" stroke-width="3"/>',
      RAKE: '<path d="m29 102 50-66" stroke="#b98c54" stroke-width="9" stroke-linecap="round"/><path d="m59 22 42 31M62 26l-9 15m21-7L64 49m21-8L75 57m21-8L86 65" stroke="#7f9691" stroke-width="6" stroke-linecap="round"/>',
      HOE: '<path d="m26 105 58-80" stroke="#b98c54" stroke-width="9" stroke-linecap="round"/><path d="M72 18 97 34l-4 18-38-22Z" fill="#8ea59c" stroke="#5c7a70" stroke-width="4"/>',
      PLUM: '<path d="M59 31Q17 16 23 67q3 41 40 34 40 2 36-41-4-37-40-29Z" fill="#9d73ae" stroke="#72507e" stroke-width="4"/><path d="M60 33 67 12" stroke="#8b7043" stroke-width="5"/><ellipse cx="40" cy="52" rx="8" ry="13" fill="#c69dca"/>',
      PEAR: '<path d="M56 24q-16 1-18 28-33 41-9 51 45 15 66-7 15-12-17-44-1-30-22-28Z" fill="#c7cc67" stroke="#8a9745" stroke-width="4"/><path d="M60 25 68 10" stroke="#8b7043" stroke-width="5"/>',
      POND: '<ellipse cx="60" cy="80" rx="52" ry="26" fill="#9dcbd0" stroke="#759f9c" stroke-width="4"/><path d="M19 78h25m13 10h35M95 72V31m-8 42V46" stroke="#639784" stroke-width="4"/><path d="m95 47-10-17m10 28 13-16" stroke="#8aa951" stroke-width="6"/>',
      WORM: '<path d="M18 82q23-32 34 0t32-4q15-32 22-9" stroke="#bb866b" stroke-width="18" fill="none" stroke-linecap="round"/><path d="m27 64 8 13m5-13 9 15m14 9 8 10m12-30 10 4" stroke="#966650" stroke-width="3"/><circle cx="104" cy="65" r="3" fill="#4e4a3b"/>',
      BEE: '<g fill="#e7f1e1" stroke="#93b5ae" stroke-width="3"><ellipse cx="44" cy="36" rx="20" ry="24"/><ellipse cx="77" cy="36" rx="20" ry="24"/></g><ellipse cx="61" cy="67" rx="36" ry="25" fill="#edcd6e" stroke="#8a7544" stroke-width="3"/><path d="M48 45v44m22-44v43" stroke="#7b6848" stroke-width="9"/><circle cx="90" cy="62" r="3" fill="#544a35"/>',
      GATE: '<path d="M18 105V26m84 79V26M18 43h84m-84 40h84M30 45v36m20-36v36m20-36v36m20-36v36" stroke="#b48c5c" stroke-width="8"/><path d="m26 82 68-38" stroke="#d8b77f" stroke-width="5"/>',
      PATH: '<path d="M13 111q60-37 32-62T70 8h24Q54 24 81 48t24 63" fill="#d7bf8c" stroke="#ad9869" stroke-width="4"/><path d="m38 89 20 6m6-29 15 6M60 35l15 1" stroke="#b89f70" stroke-width="4"/>',
    };
    if (["LEAF", "MINT", "KALE"].includes(word))
      return svg(
        leaf +
          (word === "KALE"
            ? '<path d="M32 63q5-20 14-8t12-13 14 0" fill="none" stroke="#638a42" stroke-width="6"/>'
            : ""),
      );
    if (["BARN", "SHED"].includes(word)) return art("FARM");
    if (common[word]) return svg(common[word]);
    return null;
  }
  return { art };
})();
