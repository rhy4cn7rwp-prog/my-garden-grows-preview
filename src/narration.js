/* Free, on-device Web Speech only. No service keys, requests, recordings or fees.
   Explicit Read to Me remains available even when automatic narration is off. */
const Narration = (() => {
  let clip = null, context = null, status = "", active = null, pending = null,
    generation = 0;
  const synth = () => window.speechSynthesis;
  const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const voiceKey = v => `${v.voiceURI || v.name}|${v.lang}`;
  // Quality labels come from the OS. Never equate a voice's accent with quality.
  function quality(v) {
    const n = v.name.toLowerCase();
    return /premium|enhanced|natural|neural/.test(n) ? 30
      : /compact|espeak|robot|^(fred|ralph|albert|bahh|bells|boing|bubbles|cellos|deranged|hysterical|trinoids|whisper|zarvox)$/.test(n) ? -20
      : /siri|^(samantha|alex|ava|daniel|karen|moira|tessa|serena)$/.test(n) ? 8 : 0;
  }
  function voices() {
    try {
      return (synth()?.getVoices() || [])
        .filter(v => /^en(?:[-_]|$)/i.test(v.lang) && v.localService === true)
        .filter((v, i, all) => all.findIndex(x => voiceKey(x) === voiceKey(v)) === i)
        .sort((a, b) => quality(b) - quality(a) || Number(b.default) - Number(a.default) || a.name.localeCompare(b.name));
    } catch { return []; }
  }
  function choose(list) {
    return list.find(v => voiceKey(v) === state.narrationVoice) || list[0];
  }
  function label(v) {
    return `${v.name.replace(/com\.apple\.speech\.synthesis\.voice\./g, '')} · ${v.lang}${quality(v) > 0 ? ' · higher quality' : ''}`;
  }
  function notify() {
    if (typeof document !== 'undefined') document.dispatchEvent(new Event('narrationvoiceschange'));
  }
  function stop() {
    const wasPlaying = active || pending || clip || status;
    generation++;
    pending = null;
    active = null;
    status = "";
    try { synth()?.cancel(); } catch {}
    if (clip) { clip.pause(); clip = null; }
    if (wasPlaying) notify();
  }
  function available() {
    return !!synth() && typeof SpeechSynthesisUtterance !== 'undefined';
  }
  function hidden() { return typeof document !== 'undefined' && document.hidden; }
  function normalize(text) {
    return String(text).replace(/\$([\d,]+)(?:\.(\d{2}))?/g, (_, d, c) => {
      const dollars = Number(d.replaceAll(',', '')), cents = Number(c || 0);
      return [dollars ? `${dollars} ${dollars === 1 ? 'dollar' : 'dollars'}` : '', cents ? `${cents} ${cents === 1 ? 'cent' : 'cents'}` : ''].filter(Boolean).join(' and ') || '0 dollars';
    }).replace(/×/g, ' times ').replace(/−/g, ' minus ').replace(/\s*=\s*\?/g, ' equals what? ').replace(/\s+/g, ' ').trim();
  }
  function speak(text, character = 'guide', force = false) {
    // Automatic feedback must never talk over a deliberate reading/letter sound.
    if ((!force && (!state.narrationEnabled || active || pending || clip)) || hidden()) return false;
    stop();
    if (!available()) {
      status = 'Read-aloud is unavailable on this browser. The written instructions are always here.';
      notify();
      return false;
    }
    const request = { text: normalize(text), character, token: generation };
    if (!request.text) return false;
    const list = voices();
    if (!list.length) {
      pending = request;
      status = 'Waiting for an English on-device voice. If none appears, check your device speech settings. Written instructions are always available.';
      notify();
      return false;
    }
    return play(request, list);
  }
  function play(request, list) {
    if (request.token !== generation || hidden()) return false;
    const voice = choose(list), little = state.learningExperience === 'little';
    // Short sentence groups avoid Safari's long-utterance cutoffs. Punctuation
    // supplies natural pauses; no SSML or delayed, unsolicited playback.
    const sentences = request.text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [request.text];
    const chunks = [];
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      let chunk = '';
      for (const word of words) {
        if (chunk.length + word.length > 190) { chunks.push(chunk); chunk = ''; }
        chunk += (chunk ? ' ' : '') + word;
      }
      if (chunk) chunks.push(chunk);
    }
    status = state.narrationVoice && !list.some(v => voiceKey(v) === state.narrationVoice)
      ? 'Your saved voice is unavailable here. Using ' + label(voice) + '.' : '';
    notify();
    function next() {
      if (request.token !== generation || hidden()) return;
      const text = chunks.shift();
      if (!text) { active = null; notify(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = (little ? 0.9 : 1) * (Number.isFinite(state.narrationSpeed) ? Math.max(0.8, Math.min(1.2, state.narrationSpeed)) : 1);
      u.pitch = ({ magee: 1.02, jones: 0.98, shop: 1, guide: 1 })[request.character] || 1;
      u.volume = 1;
      u.onend = next;
      u.onerror = event => {
        if (request.token !== generation) return;
        active = null;
        if (!['interrupted', 'canceled'].includes(event.error)) {
          status = 'Tap Read to Me to try again. Written instructions are always available.';
          notify();
        }
      };
      active = u; // Keep a strong reference for Safari until completion/cancel.
      notify();
      try { synth().speak(u); } catch { u.onerror({error:'unavailable'}); }
    }
    next();
    return true;
  }
  function changed() {
    const list = voices();
    if (pending && list.length && !hidden()) {
      const request = pending;
      pending = null;
      play(request, list);
    }
    notify();
  }
  // Some Safari versions expose only onvoiceschanged; others support listeners.
  if (synth()?.addEventListener) synth().addEventListener('voiceschanged', changed);
  else if (synth()) {
    const prior = synth().onvoiceschanged;
    synth().onvoiceschanged = event => { prior?.call(synth(), event); changed(); };
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener?.('pagehide', stop);
  function phoneme(letter) {
    stop();
    if (!/^[a-z]$/i.test(letter) || hidden()) return;
    const audio = clip = new Audio(`assets/neighborhood/phonics/${letter.toLowerCase()}.wav`);
    audio.onended = () => { if (clip === audio) clip = null; };
    audio.play().catch(() => {
      if (clip !== audio) return;
      clip = null;
      status = 'Tap the sound again to hear it.';
      notify();
    });
  }
  function effect() {
    if (!state.effectsEnabled || active || clip || hidden()) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      context.resume();
      const o = context.createOscillator(), g = context.createGain();
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.035, context.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      o.connect(g); g.connect(context.destination); o.start(); o.stop(context.currentTime + 0.12);
    } catch {}
  }
  function options() {
    const list = voices();
    return '<option value="">Automatic · best on-device English voice</option>' +
      (state.narrationVoice && !list.some(v => voiceKey(v) === state.narrationVoice)
        ? `<option value="${escape(state.narrationVoice)}" selected>Saved voice unavailable · automatic fallback</option>` : '') +
      list.map(v => `<option value="${escape(voiceKey(v))}" ${voiceKey(v) === state.narrationVoice ? 'selected' : ''}>${escape(label(v))}</option>`).join('');
  }
  return { speak, stop, phoneme, effect, voices, options, voiceKey, label, normalize,
    get busy() { return !!(active || pending || clip); },
    get status() { return status; } };
})();
