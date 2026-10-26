/* Original lightweight vector scenery. All geometry is local to each SVG. */
const JobArt = (() => {
  const svg = (body, box = "0 0 200 240", label = "") =>
    `<svg viewBox="${box}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;
  function basket() {
    return svg(
      `<defs><pattern id="job-wicker" width="14" height="12" patternUnits="userSpaceOnUse"><path d="M0 2h14M0 8h14M4 0v6m7 0v6" stroke="#98623b" stroke-width="2"/></pattern></defs><path d="M29 41Q22-5 100 5q78-10 71 36" fill="none" stroke="#99643f" stroke-width="8"/><ellipse cx="100" cy="35" rx="85" ry="27" fill="#65462f" stroke="#d8ac6d" stroke-width="7"/><ellipse cx="100" cy="35" rx="72" ry="17" fill="#493b2b"/><path d="M16 39 33 112q65 27 134 0l17-73q-79 44-168 0" fill="#c69457" stroke="#845733" stroke-width="4"/><path d="M20 49 35 109q65 24 130 0l15-60q-80 38-160 0" fill="url(#job-wicker)"/><path d="M17 39q83 45 166 0" fill="none" stroke="#e4be7e" stroke-width="8"/><path d="M37 107q61 22 125 0" fill="none" stroke="#e1b677" stroke-width="4"/>`,
      "0 0 200 130",
    );
  }
  function plant(type = "corn") {
    if (type === "beans")
      return svg(
        `<path d="M101 230V18M49 230 83 22m55 210L119 23" stroke="#bd9b6d" stroke-width="5" fill="none"/><path d="M95 230q-34-57 13-81t-9-71q-36-29 10-57" fill="none" stroke="#528442" stroke-width="5"/><g fill="#7fa953" stroke="#4c7a3c" stroke-width="3"><path d="M99 180q-64 0-49-39 42-5 49 39m8-25q56 0 44-36-43 0-44 36M90 112q-58-1-42-34 36-8 42 34m15-27q51 4 39-34-38-2-39 34M109 53Q75 48 82 19q32 4 27 34"/></g><g fill="#acc96b" stroke="#59843d" stroke-width="3"><path d="M68 140q-7 54 15 60 15-20-15-60m65-29q29 31 8 59-20-17-8-59"/></g>`,
      );

    return svg(
      type === "tomato"
        ? `<path d="M104 224Q77 126 104 30M100 174 51 110m47 20 52-60M94 94 54 45m48 19 35-39" fill="none" stroke="#487b3b" stroke-width="7" stroke-linecap="round"/><path d="M94 156Q21 155 31 114q41-3 63 42m12-34q69-2 58-47-42-4-58 47M92 91Q28 91 34 47q40 1 58 44m14-28q52-8 47-40-33-10-47 40" fill="#639d48" stroke="#39703a" stroke-width="3"/><path d="M42 20v213m120-213v213" stroke="#bd986a" stroke-width="5"/><path d="M43 95h118m-118 94h118" stroke="#d0b58b" stroke-width="3"/>`
        : `<path d="M99 229V26m0 163Q15 145 26 100q62 13 73 89m0-45q82-51 74-92-63 27-74 92m0-53Q45 62 59 25q38 19 40 66m0 115q67-22 83-64-57-10-83 64" fill="#6eab4d" stroke="#3f783d" stroke-width="4"/><path d="M98 72q-27-34-7-55 12 9 16 29" fill="#edd171" stroke="#9b963d" stroke-width="3"/><path d="M111 143q31-39 35-15-1 24-35 44" fill="#e3c862" stroke="#6c8e42" stroke-width="3"/>`,
    );
  }
  function weed(harder = false) {
    return svg(
      `<path d="m100 183-9 34m10-31 14 35m-15-32-25 23m25-22 30 14" fill="none" stroke="#b9976c" stroke-width="3"/><path d="M100 185V52m0 105-45-19 16-13-29-28 31 2-11-37 38 28 27-39-3 43 35-11-23 38 17 8-53 24" fill="${harder ? "#a28051" : "#b96250"}" stroke="#6d4b37" stroke-width="4"/><path d="m99 106-18-14m19 47 26-26" stroke="#dfac78" stroke-width="3"/><path d="M80 187h40" stroke="#684934" stroke-width="6" stroke-linecap="round"/>`,
    );
  }
  function flower(done, variant = 0) {
    const colors = ["#ef8fa0", "#c2a1e2", "#f4cb6d"];
    return svg(
      `<ellipse cx="100" cy="207" rx="82" ry="25" fill="${done ? "#795339" : "#bc976a"}"/><path d="M100 207Q${done ? 94 : 126} 141 ${done ? 100 : 122} 88M100 172q-68 2-50-39 37-1 50 39m2-17q63-10 51-43-36-3-51 43" fill="#7ba654" stroke="#4a763a" stroke-width="5"/><g transform="translate(${done ? 100 : 122} ${done ? 76 : 103}) rotate(${done ? 0 : 32})"><g fill="${colors[variant % 3]}" stroke="#a76864" stroke-width="2">${Array.from({ length: 6 }, (_, i) => `<ellipse cy="-24" rx="15" ry="25" transform="rotate(${i * 60})"/>`).join("")}</g><circle r="17" fill="#f7d46d" stroke="#bc934d" stroke-width="3"/><circle cx="-4" cy="-5" r="5" fill="#ffe9a8"/></g>${done ? '<g fill="#9ed9ed"><path d="M48 176q-12 19 0 20 13-1 0-20m101-12q-12 19 0 20 13-1 0-20"/></g>' : '<path d="m45 208 16-9m67 18 13-9m-55-3-10 10" stroke="#9b774f" stroke-width="3"/>'}`,
    );
  }
  function ground(kind) {
    return svg(
      kind === "path"
        ? '<path d="M10 22h78l12 51-91 8ZM108 7l81 17-2 69-75-10ZM9 104l87-7 2 76-85 12ZM117 109l71-6 4 97-81-18Z" fill="#c9b28a" stroke="#a58b67" stroke-width="5"/>'
        : kind === "grass"
          ? '<path d="m20 192 10-57 14 32 14-58 12 56 25-32-6 64m38-20 3-51 17 22 12-47 13 48 16-18-1 55" fill="#88ae56" stroke="#638e48" stroke-width="3"/>'
          : '<ellipse cx="100" cy="160" rx="83" ry="44" fill="#b48b5d"/><path d="m45 153 17-9m23 32 18-7m29-21 14 12M66 190l18-4" stroke="#8d6948" stroke-width="5"/>',
    );
  }
  function field() {
    return svg(
      `<defs><linearGradient id="job-sky" x2="0" y2="1"><stop stop-color="#9fdaee"/><stop offset="1" stop-color="#eef3c1"/></linearGradient><linearGradient id="job-earth" x2="0" y2="1"><stop stop-color="#b8bd76"/><stop offset="1" stop-color="#a8794d"/></linearGradient></defs><path fill="url(#job-sky)" d="M0 0h800v500H0Z"/><g fill="#fff8df" opacity=".8"><ellipse cx="110" cy="60" rx="80" ry="23"/><ellipse cx="660" cy="90" rx="100" ry="25"/></g><path d="M0 190Q150 90 300 180q210-140 500-10v330H0" fill="#a1ba70"/><path d="M0 218q400-64 800 0v282H0Z" fill="url(#job-earth)"/><path d="M0 206h800M0 226h800" stroke="#dfc59a" stroke-width="9"/><g stroke="#b28c5d" stroke-width="9">${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 50} 187v60"/>`).join("")}</g><g fill="none" stroke="#84623f" stroke-width="16" opacity=".55"><path d="M350 237 25 500m369-263L260 500m177-263 100 263m-55-263 300 263"/></g><g fill="#5e913e" stroke="#4c7936" stroke-width="3">${Array.from(
        { length: 30 },
        (_, i) => {
          const y = 260 + Math.floor(i / 10) * 65,
            x = (i % 10) * 83 + 14;
          return `<path d="m${x} ${y} -12-19 14 8 5-24 8 23 14-13-9 26Z"/>`;
        },
      ).join(
        "",
      )}</g><g fill="#f2b9a3" stroke="#638742" stroke-width="3"><path d="M22 485v-42m740 43v-43"/><circle cx="22" cy="442" r="13"/><circle cx="762" cy="442" r="14"/></g>`,
      "0 0 800 500",
    );
  }
  function jones() {
    return svg(
      `<ellipse cx="105" cy="278" rx="66" ry="11" fill="#584e32" opacity=".22"/><g class="jones-body"><path d="m73 201-7 65q-25 2-25 13h52l10-67m16-11 8 65q29 0 28 13h-49l-9-65" fill="#506c79" stroke="#3f5357" stroke-width="4"/><path d="M46 123q57-29 105 6l-6 83H59Z" fill="#d7a276" stroke="#8d644a" stroke-width="3"/><path d="M48 128q10-18 25-17l-1 65-28 3Zm80-15q24 0 29 23l3 43-28-3Z" fill="#b96750" stroke="#884b3f" stroke-width="3"/><path d="M71 122v33h59v-32l9 80q-42 30-79 0Z" fill="#769aaa" stroke="#486775" stroke-width="3"/><path d="M84 159h32v25q-17 12-32-1Z" fill="#597f91" stroke="#aac0bd" stroke-width="2"/><circle cx="78" cy="148" r="4" fill="#d9bd66"/><circle cx="127" cy="148" r="4" fill="#d9bd66"/><g class="jones-arm"><path d="M145 135q25 24 1 49l-21-8" fill="none" stroke="#b96750" stroke-width="20" stroke-linecap="round"/><path class="jones-held-carrot" d="m112 171-10 27-7-30Z" fill="#ef9847" stroke="#ab6437" stroke-width="2"/><path class="jones-held-carrot" d="m100 169-12-13 14 6 4-15 4 17 12-6-12 15" fill="#79a34c" stroke="#50743b" stroke-width="2"/><path d="m128 177-17-10" stroke="#dfaf83" stroke-width="15" stroke-linecap="round"/></g><path d="M53 141q-19 16-6 37l16 7" fill="none" stroke="#b96750" stroke-width="18" stroke-linecap="round"/><ellipse cx="102" cy="76" rx="42" ry="50" fill="#e3b78a" stroke="#9c7050" stroke-width="3"/><ellipse cx="59" cy="80" rx="8" ry="13" fill="#dba77a"/><ellipse cx="144" cy="80" rx="8" ry="13" fill="#dba77a"/><path d="M63 82q-9-52 40-48 47-1 38 49l-10-29-21-6-34 8Z" fill="#b6aaa0"/><path d="M47 43q53-28 109 0l10 13Q100 75 35 54Z" fill="#dcc28c" stroke="#97764e" stroke-width="3"/><path d="m67 40 9-30q26-12 53 1l12 30" fill="#e5cf9a" stroke="#a5895c" stroke-width="3"/><path d="M71 33q34 8 64 0" stroke="#aa7550" stroke-width="7"/><g class="jones-eyes" fill="#514c3c"><ellipse cx="84" cy="79" rx="4" ry="5"/><ellipse cx="120" cy="79" rx="4" ry="5"/></g><path class="jones-normal-smile" d="M95 86q-8 16 7 13m-22 11q21 15 40-1" fill="none" stroke="#a56e52" stroke-width="3" stroke-linecap="round"/><path class="jones-proud-smile" d="M84 111q18 26 35-1-17 9-35 1Z" fill="#a3664c"/><path d="M77 103q10-9 24 0 14-10 26 0-12 15-26 5-12 10-24-5" fill="#e0d1b6"/><g fill="#ed9e7e" opacity=".5"><ellipse cx="75" cy="95" rx="10" ry="5"/><ellipse cx="130" cy="95" rx="9" ry="5"/></g></g>`,
      "0 0 200 290",
      "Mr. Jones, a smiling gardener in a straw hat and overalls",
    );
  }
  return { basket, plant, weed, flower, ground, field, jones };
})();
