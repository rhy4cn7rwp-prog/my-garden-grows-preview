# Neighborhood learning assets (draft)

Existing illustrated produce is reused without changing source artwork. The new
neighbor portraits, bulletin notices, yard symbols and play surfaces are original
SVG/CSS components in src/neighborhood.js and src/neighborhood.css.

The phonics directory contains first-pass synthesized isolated American-English
phonemes, not spoken letter names, for SUN, POT, MUD and DIG. They were rendered
with the open-source eSpeak NG engine via espeakng-loader 0.2.4. No runtime voice
service, library download, API key or paid dependency is required. The engine
itself is not bundled. General read-aloud uses optional browser speech synthesis.

Reproduction: install espeakng-loader into an isolated development environment,
then run tools/build_phonics.py. eSpeak NG project/license information:
https://github.com/espeak-ng/espeak-ng . Speech output is synthesized from the
phoneme instructions in that script. These clips still need listening/phonics
review, especially very short isolated consonants; do not claim final child
readiness from successful WAV generation alone.
