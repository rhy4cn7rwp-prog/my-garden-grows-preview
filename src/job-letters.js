/* Free placement keeps a tile identity even when a word has repeated letters. */
const JobLetters = (() => {
  function scene(a, selected) {
    const d = a.data,
      w = d.words[d.round],
      little = a.mode === "little";
    const knownIllustration =
      CROPS.some((c) => c.id === w.toLowerCase()) ||
      ["SUN", "POT", "MUD", "DIG", "FLOWER", "HARVEST"].includes(w);
    const picture =
      JobWordPictures.art(w) ||
      (knownIllustration ? Neighborhood.icon(w.toLowerCase()) : "");
    return `<div class="job-magee-intro">${JobArt.magee()}<p>“Try your letters in any space. You can move them again!”</p></div><p>Label ${d.round + 1} of ${d.words.length}</p><div class="job-label-clue">${picture}<button class="btn alt" onclick="Neighborhood.read('${w.toLowerCase()}. ${JobVocabulary.clues[w] || "A word from our garden."}','magee')">Hear the word</button></div><p class="letter-directions">Choose a letter, then any space. Drag to move or swap.</p><div class="job-letter-slots free-letter-slots">${[
      ...w,
    ]
      .map((_, i) => {
        const tile = d.slots[i];
        return `<button data-job-drop="letter-${i}" ${tile !== null ? `data-job-drag="letter" data-item="${tile}"` : ""} onpointerup="TouchActions.run(event,()=>Neighborhood.letterSlot(${i}))" onclick="Neighborhood.letterSlot(${i})" class="${tile !== null && selected === tile ? "selected" : ""}" aria-label="Letter slot ${i + 1}${tile !== null ? ", " + d.tiles[tile] : ", empty"}">${tile !== null ? d.tiles[tile] : ""}</button>`;
      })
      .join(
        "",
      )}</div><div class="job-letter-tiles free-letter-tray" data-job-drop="letter-tray" aria-label="Available letter tray">${d.tiles.map((v, i) => (!d.slots.includes(i) ? `<button data-job-drag="letter" data-item="${i}" onpointerup="TouchActions.run(event,()=>Neighborhood.tile(${i}))" onclick="Neighborhood.tile(${i})" class="${selected === i ? "selected" : ""}" aria-label="Letter ${v}, tile ${i + 1}">${v}</button>` : "")).join("")}<span>Letter tray</span></div><button class="btn alt" onclick="Neighborhood.returnLetter()" onpointerup="TouchActions.run(event,()=>Neighborhood.returnLetter())" ${selected === null || !d.slots.includes(selected) ? "disabled" : ""}>Return selected letter to tray</button><button class="btn alt" onclick="Neighborhood.act({type:'hint'})">Picture / letter hint</button>${d.hints ? `<p class="job-hint">${JobVocabulary.clues[w] || "A word from our garden."} Starts with ${w.slice(0, d.hints)}${"·".repeat(w.length - d.hints)}</p>` : ""}${little ? `<p>Hear the sounds, then blend the word.</p><div class="job-phonics">${[...w].map((l) => `<button class="btn alt" onclick="Narration.phoneme('${l}')" aria-label="Hear ${l} sound">${l} sound</button>`).join("")}</div>` : ""}`;
  }
  return { scene };
})();
