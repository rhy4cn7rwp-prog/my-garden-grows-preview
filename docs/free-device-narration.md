# Free, device-only Read to Me

The shared `Narration` adapter uses only browser Web Speech synthesis and installed English voices explicitly marked `localService: true`. It has no API key, subscription, service SDK, external voice endpoint, or usage charge. Remote/cloud voices are excluded even if a browser lists them. Existing bundled letter-sound WAVs are unchanged.

## Family controls

From Town, choose Settings → Read to Me voice:

- **Automatic** ranks installed enhanced/premium/natural voices first, then known conversational system voices, with basic/novelty voices last. OS names are quality hints, not a guarantee of perceived quality.
- The **English voice** menu shows actual names and language/accent codes reported by this device. Examples on some Apple installations include Samantha, Alex, Daniel or Ava (Enhanced). No particular voice is required or guaranteed.
- **Test Voice** gives a short sample, even if optional automatic character narration is off. **Stop reading** cancels it.
- Five speed choices adjust the mode default from 80% to 120%. Default Little Gardener rate is 0.9; Growing Gardener is 1.0. Character pitch stays close to natural (0.98–1.02).
- Read to Me buttons remain opt-in. The new speaker in the shared navigation reads the current screen; while reading it becomes Stop reading. Product/information dialogs without an existing reader gain one. Compact keypad/payment dialogs and single-purpose Garden dialogs keep their existing layout.

Preferences are optional fields (`narrationVoice`, `narrationSpeed`) inside the same `mgg10` / `mgg10-backup` save. Recovery supplies defaults without changing balances, ownership, crops, records or unfinished-job rules. A voice unavailable on another device falls back to the best eligible voice **without erasing** the saved choice.

## Speech lifecycle

- One speech/phonics channel. Explicit reading cancels previous speech/phonics; automatic feedback cannot interrupt a requested reading or a letter sound.
- Sentences are spoken as short groups, retained until completion for Safari. Punctuation supplies pauses; numbers, dollar amounts and multiplication are normalized for speaking without changing displayed or calculated math.
- Screen navigation, dialog replacement/close, job Pause, pagehide and hidden-tab/device-background events cancel current and queued speech. Returning does not automatically replay it. Explicit Read to Me while paused remains available.
- Delayed `voiceschanged` updates refresh just the voice menu/status, retaining focus and preferences. A still-current requested reading may start when local English voices finish loading. Leaving, pausing or canceling invalidates it.
- Engine errors and missing local English voices leave written instructions and gameplay usable. Nothing silently falls back to a remote voice.

## iPhone Safari limitations and family check

The OS controls available voice names, pronunciation, actual voice quality and supported pitch/rate behavior. Safari may expose fewer voices than iOS accessibility settings. Downloading a free enhanced English voice in the device's accessibility speech settings may help, but Safari must expose it before this game can select it. Downloads may require storage/Wi-Fi; the game does not initiate them. A fresh tap may be necessary if Safari blocks speech after an asynchronous voice load. Browser permissions, volume, and audio routing remain device-controlled.

This Linux test environment has no installed English synthesis voices, so named voices and event behavior are tested with deterministic browser mocks. Native iPhone/desktop Safari audio cannot be auditioned here. WebKit installation was attempted but the browser download host returned HTTP 403. Do not describe Chromium phone-size emulation as native Safari testing.

Manual iPhone check: reload the preview, open voice settings, audition available voices, choose one and a speed, reload, then read a guide page, customer bubble, job instruction and letter sound. Confirm volume/pronunciation, no overlap, and silence after navigation, Pause and locking/backgrounding the phone.

## Validation

- Node suite: 291 tests, including local-only ranking/filtering, saved voice fallback, delayed voice loading/cancel, pacing, short-chunk cancellation, phonics exclusivity, error fallback, escaping, money pronunciation and old-save compatibility.
- `tests/mobile_narration.py`: Chromium touch checks at 320×440, 375×548, 428×746 and 1024×768: voice/speed settings, 44px controls, persistence/fallback, all 8 locations, all 6 guide pages and all 12 jobs in both modes, Pause/navigation/background and unavailable engine. Uses mocks, not paid or real remote speech.
- Existing phone-size regressions: Phase 9 economy/modes/audio/market (3); Clubhouse/guide/save/market resume (6); final Job Board features (27); Garden weeding (3); market cents/register/report flows (5). Seed & Feed and Market Supplies purchasing/layout regressions also pass. No gameplay systems or artwork replaced.
