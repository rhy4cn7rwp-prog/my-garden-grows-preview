# Job Board polish

New sliding games use rules version 5: Little Gardener has two columns and three
rows, Growing Gardener has three columns and three rows. The original square
illustrations retain their proportions; Little's six pieces are rectangular.
Scrambles are legal walks of twelve or twenty-four moves with bounded minimum
Manhattan distance. Restart retains the scramble and active completion time.
Records distinguish the new dimensions and rule version from earlier records.

Unfinished version-four 3×3/4×4 puzzles remain exactly as saved until finished.
No new 4×4 puzzle is created. Old lawn jobs also retain their original obstacles
and collision behavior. Save keys, wallet, other inventories, job cooldowns and
existing records are unchanged. This is an additive rules migration, not a reset.

Hidden Treasures now uses exact crops from each original scene as object clues in
both modes. A clue's SVG viewBox is the reviewed object rectangle in that scene,
not a generic icon. Tap a clue to hear its name; names and found state remain in
accessible labels. Growing's larger checklist scrolls horizontally so the scene
and controls remain usable on small phones. Scene IDs, objects and touch regions
are unchanged.

New lawns have six or eight flower cells and two or three additional natural
obstacles. The entire walkable lawn is connected. Entering a flower restarts only
the mowing stage, stops the current drag, and explains the restart. The current
release cannot move the newly reset mower again. Money and elapsed active time
are preserved. Raised beds and trees block movement; raking and composting remain
unchanged. The main Garden's educational weeding activity is not modified.

Ten original generated art assets are preserved under `assets/job-polish/source`,
with optimized WebP copies and SHA-256 provenance. They use the Seed & Feed style
and the existing Mr. Jones/Mrs. Magee appearances as references. The earlier SVG
character art remains in the source as legacy artwork. Produce pieces reuse the
existing painted Seed & Feed atlas; tomatoes have separate red/green sprite
regions without visible maturity labels. Board thumbnails reuse appropriate
original scenes as derivatives. None count as additional original scenes.

Validation includes both modes, twenty thousand new legal scrambles, older
unfinished jobs, every flower collision and payout, matching object clues, mobile
touch controls, safe areas, narration, and regressions for all twelve activities.
Mobile checks use Chromium touch emulation; native iPhone Safari toolbar/audio
behavior remains a useful manual playtest.
