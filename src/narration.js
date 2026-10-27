/* Read-aloud adapter: future character recordings can replace speak without
   changing activities. Nothing starts before a child's gesture/preferences. */
const Narration = (() => {
  let clip = null,
    context = null,
    status = "";
  const profiles = {
    magee: { rate: 0.85, pitch: 1.1 },
    jones: { rate: 0.87, pitch: 0.85 },
    shop: { rate: 0.95, pitch: 1.05 },
    guide: { rate: 0.9, pitch: 1 },
  };
  function stop() {
    window.speechSynthesis?.cancel();
    if (clip) {
      clip.pause();
      clip = null;
    }
  }
  function speak(text, character = "guide", force = false) {
    stop();
    if (!force && !state.narrationEnabled) return false;
    if (
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      status =
        "Read-aloud is unavailable on this browser. The written instructions are always here.";
      return false;
    }
    const u = new SpeechSynthesisUtterance(text),
      p = profiles[character] || profiles.guide;
    u.rate = p.rate;
    u.pitch = p.pitch;
    u.lang = "en-US";
    const voices = window.speechSynthesis.getVoices();
    u.voice =
      voices.find((v) => v.lang === "en-US" && v.localService) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    window.speechSynthesis.speak(u);
    return true;
  }
  function phoneme(letter) {
    stop();
    if (!/^[a-z]$/i.test(letter)) return;
    soundFile(`assets/neighborhood/phonics/${letter.toLowerCase()}.wav`);
  }
  function soundFile(path) {
    clip = new Audio(path);
    clip.play().catch(() => {
      status = "Tap the sound again to hear it.";
    });
  }
  function effect() {
    if (!state.effectsEnabled) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      context.resume();
      const o = context.createOscillator(),
        g = context.createGain();
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.035, context.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      o.connect(g);
      g.connect(context.destination);
      o.start();
      o.stop(context.currentTime + 0.12);
    } catch {}
  }
  return {
    speak,
    stop,
    phoneme,
    effect,
    get status() {
      return status;
    },
  };
})();
