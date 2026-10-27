# Neighborhood learning assets

Existing illustrated produce is reused without changing source artwork. The new
neighbor portraits, bulletin notices, yard symbols and play surfaces are original
SVG/CSS components in src/neighborhood-art.js, src/neighborhood-scenes.js, src/job-word-pictures.js and src/job-lawn-scene.js. The job UI styles are scoped to the neighborhood screens.

The phonics directory contains synthesized American-English
phonemes, not spoken letter names, covering the alphabet for the expanded early-reader word pool. Hard C/G and short vowel hints are used; whole-word Read to Me provides pronunciation in context. They were rendered
with the open-source eSpeak NG engine via espeakng-loader 0.2.4. No runtime voice
service, library download, API key or paid dependency is required. The engine
itself is not bundled. General read-aloud uses optional browser speech synthesis.

Reproduction: install espeakng-loader into an isolated development environment,
then run tools/build_phonics.py. eSpeak NG project/license information:
https://github.com/espeak-ng/espeak-ng . Speech output is synthesized from the
phoneme instructions in that script. The voiced stop uses a short release context trimmed before the following
vowel; nasal sounds are lengthened and all clips are level-normalized. Automated
checks verify non-silence and browser decoding. Family listening review remains
useful; clips are synthetic and system narration voices vary by device.

Use `--missing-only` to add missing clips without replacing existing audio.
