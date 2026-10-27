const { test } = require("node:test"),
  A = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
function setup(voices = true) {
  const spoken = [],
    played = [],
    stops = [];
  const ctx = vm.createContext({
    state: { narrationEnabled: false, effectsEnabled: false },
    window: {
      speechSynthesis: voices
        ? {
            cancel() {
              stops.push("voice");
            },
            speak(u) {
              spoken.push(u);
            },
            getVoices() {
              return [];
            },
          }
        : undefined,
    },
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
      }
    },
    Audio: class {
      constructor(path) {
        this.path = path;
      }
      play() {
        played.push(this.path);
        return Promise.resolve();
      }
      pause() {
        stops.push("clip");
      }
    },
  });
  vm.runInContext(fs.readFileSync("src/narration.js", "utf8"), ctx);
  return { run: (code) => vm.runInContext(code, ctx), spoken, played, stops };
}
test("narration defaults off, explicit Read to Me works, replay cancels prior speech and clip", () => {
  const t = setup();
  A.equal(t.run("Narration.speak('hello')"), false);
  A.equal(t.spoken.length, 0);
  t.run("Narration.speak('read','magee',true)");
  A.equal(t.spoken[0].text, "read");
  t.run("Narration.phoneme('S')");
  A.equal(t.played[0], "assets/neighborhood/phonics/s.wav");
  t.run("state.narrationEnabled=true;Narration.speak('next','jones')");
  A.equal(t.spoken[1].text, "next");
  A.ok(t.stops.includes("clip"));
  A.equal(t.run("state.effectsEnabled"), false);
  t.run("Narration.stop()");
});
test("unavailable browser voices fall back without blocking gameplay or modifying preferences", () => {
  const t = setup(false);
  A.equal(t.run("Narration.speak('words','guide',true)"), false);
  A.match(t.run("Narration.status"), /written instructions/);
  A.equal(t.run("state.narrationEnabled"), false);
});
test("all regular-word phonemes are bundled valid non-silent mono PCM audio, not external service dependencies", () => {
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    const b = fs.readFileSync(`assets/neighborhood/phonics/${letter}.wav`);
    A.equal(b.toString("ascii", 0, 4), "RIFF");
    A.equal(b.toString("ascii", 8, 12), "WAVE");
    A.equal(b.readUInt16LE(22), 1);
    A.equal(b.readUInt16LE(34), 16);
    let max = 0;
    for (let i = 44; i + 1 < b.length; i += 2)
      max = Math.max(max, Math.abs(b.readInt16LE(i)));
    A.ok(max > 100, letter);
    A.ok(b.length > 500, letter);
  }
});
