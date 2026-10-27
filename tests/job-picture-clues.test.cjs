const { test } = require("node:test"),
  A = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const V = require("../src/job-vocabulary"),
  G = require("../src/game");
test("all early-reader labels retain a matching picture; unknown longer words never receive a misleading generic flower", () => {
  const calls = [],
    ctx = vm.createContext({
      CROPS: G.crops,
      JobVocabulary: V,
      JobArt: { magee: () => "<portrait/>" },
      Neighborhood: {
        icon: (kind) => {
          calls.push(kind);
          return "<known-picture/>";
        },
      },
    });
  vm.runInContext(
    fs.readFileSync("src/job-word-pictures.js", "utf8") +
      "\n" +
      fs.readFileSync("src/job-letters.js", "utf8") +
      "\nthis.draw=JobLetters.scene;",
    ctx,
  );
  for (const word of V.all) {
    calls.length = 0;
    const html = ctx.draw(
      {
        mode: V.little.includes(word) ? "little" : "growing",
        data: {
          words: [word],
          round: 0,
          tiles: [...word],
          slots: Array(word.length).fill(null),
          hints: 0,
        },
      },
      null,
    );
    A.ok(html.includes("Hear the word"));
    if (V.little.includes(word))
      A.ok(
        html.includes("word-picture") || html.includes("known-picture"),
        word,
      );
    if (["TRACTOR", "GREENHOUSE", "LADYBUG", "SPRINKLER"].includes(word)) {
      A.equal(calls.length, 0, word);
      A.ok(!html.includes("known-picture"));
    }
  }
});
