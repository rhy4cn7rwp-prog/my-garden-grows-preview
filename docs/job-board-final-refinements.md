# Final Job Board gameplay refinements

The original twelve activities and their illustrated scenes remain in place.
New words, lawn, catching and stack sessions use immutable rules version 6.
Unfinished earlier activities replay their original plans, schedules, layouts and
collision rules. Save keys and the farm schema remain unchanged. Records stay
available; new rules compare within their own record category so increased carrot
counts or longer word searches do not overwrite an incomparable earlier best.
Rewards remain $1 for a normal finish and $3 total for beating an established
comparable record, with each job's own five-minute cooldown.

## Clean hidden-picture clues

Fourteen original transparent object illustrations replace the scene crops in
both reading modes. They represent the objects already painted into all thirty
original scenes; scenes and reviewed touch targets are unchanged. The garden fork
and blue mug receive their correct distinct illustrations. Names remain available
by tapping a clue and in accessible labels. These are object illustrations, not
rectangular scene fragments. Their preserved PNGs and delivery WebPs are in
`assets/job-clues`, with provenance. Visual review and alpha checks verify clean
backgrounds. The scene items remain baked into the preserved original paintings;
the clue artwork is a recognizable isolated representation rather than a newly
layered duplicate in the scene.

## Eight-word search

New puzzles choose eight distinct age-appropriate words. Little Gardener has an
8×8 grid; Growing Gardener uses at least 10×10. Every saved word has an explicit
selectable path. A deterministic horizontal-row fallback guarantees placement.
All eight answers remain in a compact visible list and are marked when found.

## Lawn feedback and controls

The mower stops on the flower cell. The smiling homeowner appears inside the
scene and says “You mowed my flowers!” Gameplay and active record time pause.
Only Try Again restores the mowing stage, lawn and flowers. That state survives
reload; Try Again can resume it directly. Money never changes because of a
collision. Raking and composting retain their existing rules. A two-row green
D-pad keeps Up above Left/Down/Right; its whole arrangement fits above the phone
footer. The main Garden's separate educational weeding activity is unchanged.

## Replayable catching

New sixty-second rounds use seeded schedules with varied launch positions,
landing positions, flight durations and arc heights. Pace increases over the
round, with occasional closely spaced late throws. Little Gardener gets a slower
start and no bursts during its first sixteen seconds. All throws can reach the
basket before closing. Collision timing solves the actual trajectory at basket
height; each caught carrot scores only once. The target and reward rules stay
encouraging while skilled players have substantially more headroom for records.

## Letter layout and stack mixing

Single vocabulary words never wrap in either answer spaces or the separate tray.
The longest words use tighter spacing and narrower tall tiles on small phones;
existing tap, drag, swap, return, hint and audio controls remain intact. The
current vocabulary contains individual words rather than phrases.

New stack boards have no equal vertical neighbors, retaining the existing depths,
vegetable quantities and crate counts. A constrained reverse walk from a solved
board avoids locking repeated runs under another color, records a legal reverse
solution, and removes loops. Verified fallback seeds guarantee a fully mixed,
solvable result. Old puzzle generation remains intact for unfinished saves. Undo
and Restart retain their original behavior and never award money.

## Verification

`npm test` covers original game regressions plus eight-word paths, thousands of
fully mixed legal stack solutions, every clue type, all flower collisions and
Try Again persistence, variable catching trajectories, payouts, and old saves.
`tests/check_job_clue_art.py` reads alpha channels without altering the artwork.
The mobile suites test real touch interactions, all scene targets, longest label
words, D-pad layout, pause/reload and rewards at iPhone-sized usable viewports.
These use Chromium emulation; actual iPhone Safari audio and dynamic-toolbar
behavior remain useful manual playtests.
