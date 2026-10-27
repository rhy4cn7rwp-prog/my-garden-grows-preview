# Neighborhood picture activities

The permanent preview now has twelve jobs. This update changes only neighborhood
jobs and the guidebook's description of them. Main Garden weeding is separate.

## Original art

`assets/job-pictures/source/hidden` and `source/sliding` preserve sixty distinct
original PNG illustrations. Each was generated separately for its own composition.
`provenance.json` records their dimensions, SHA-256 hashes, and delivery copies.
Thumbnails, cropped checklist pictures, and puzzle tiles are derivatives, not
additional original illustrations.

The two delivery directories contain full-resolution WebP copies. The browser
loads only the chosen scene, not the entire collection. The PNG sources are not
loaded during gameplay. Board thumbnails are small WebP derivatives.

Every hidden scene has twelve reviewed objects in `hidden-objects.json`.
Coordinates describe objects actually painted into the scene. Repeated visible
examples can have additional accepted regions. Names match the actual object:
for example, a garden fork is called a garden fork; the farm picnic's blue mug
is a target instead of claiming a shovel exists there.

Use `python tools/build_job_gallery.py` to validate and rebuild the catalog.
Use `python tools/prepare_job_art.py` to encode preserved source PNGs. Never
reorder released scene IDs or object slots: saved checklists refer to them.
Append new scenes. Original files should remain intact.

## Rules and records

- Little Gardener searches for five of the eight largest recognizable objects;
  Growing Gardener searches for ten to twelve. Checklists vary by seed.
- Hints identify a broad region, never find an object automatically. Pinch,
  zoom buttons and panning do not count as finds. Touch hit regions expand to
  at least 44 screen pixels, choosing the closest requested object if needed.
- Sliding grids are 3×3 or 4×4 according to learning mode, with legal move
  scrambles and enforced minimum distance/misplacement. A verified fallback seed
  prevents an unusually unlucky random scramble from abandoning a session.
- Restart restores the same scramble without resetting active time. A new picture
  is available only before starting. Completed puzzles show the full illustration.
- Hidden records compare scene, exact checklist, learning mode and hint use.
  Sliding records compare scene, grid, initial-distance band and preview/hint use;
  move counts are stored alongside active completion times.
- First completion and ties pay $1; beating an existing comparable best pays $3
  total. Each activity has its own five-minute cooldown. Claim clears the session
  once. Preparation, pause and background time do not count as active play.

## Backward compatibility

Save keys remain `mgg10` and `mgg10-backup`. Job schema version remains 1 with
additive histories, completion counts and record entries. New overhead weeding,
20-tomato picking, deeper stacks and both picture games use immutable activity
rules version 4. Existing unfinished versions 1–3 replay under their original
rules, puzzles, timers and reward eligibility. No farm reset or save import is
introduced.

Little stack depth grows gradually with completed stack jobs (3, 4, then 5),
not Dream Shop purchases. Growing stacks hold eight vegetables per crate, with
four vegetable types and two empty crates. Reversible, loop-erased scrambles
include a legal solution proof used by automated validation.

## Validation

Run `npm test` for rule, reward, original-asset, migration and regression checks.
`tests/mobile_job_pictures.py` exercises scene loading, actual picture hit regions,
pinch/pan, sliding, pause/reload, completion and claims. The existing neighborhood
mobile suites cover the other ten jobs, manual row navigation, narration, lawn
controls and personal records. These use Chromium touch emulation at iPhone-sized
viewports; they do not replace playtesting on an actual iPhone Safari device.
