# Phase 9 draft — stopped for requested review

Branch: phase-9/neighborhood-and-learning. Not ready to merge or publish.
The user's Phase 9 instructions explicitly require stopping for review if tests
fail. This draft preserves the work and records the two failures found in initial
development checks. Permanent main and its published site remain at 22abea6.

## Source implemented, not yet accepted/fully validated

- A pure serializable NeighborhoodJobs module with ten job implementations,
  seeded word searches, stack sorting, letter tiles, conveyor sorting, match-four
  swaps/cascades, timed carrot catching, and four tactile chores.
- Illustrated board/activity interfaces, pointer capture and tap alternatives.
- Independent five-minute timestamp cooldowns, $1 claim paths, saved action-log
  recovery, active-play clocks and personal score scaffolding.
- Child-selected Little/Growing preferences and a new-player choice screen;
  Little nature-weeding and automatic market payment paths.
- Optional reusable character speech, independent effects preference, guide/job
  Read to Me buttons, and generated short-word phoneme WAV assets.
- Genuinely absent saves use a new-game factory with $0 and a one-time starter
  assortment at Seed & Feed. Existing saves use the existing recovery factory.
- New-economy farms have a $20 missing-equipment purchase path using existing
  supply purchasing for table/scale/bags, plus a $4 register. Existing farms are
  grandfathered. Guidebook copy remains six pages.

These are implementation drafts, not a claim that all ten games are playable or
ready for children. No new activities have completed formal touch validation.

## Check results and blockers

The existing Node suite ran: 204 passed, 1 failed (205 total).
The failed assertion is tests/clubhouse-guide.test.cjs:62, which still expects
$50 for a genuinely new player; the requested new-game behavior is now $0.
Existing-save coverage must be kept separate when updating this expectation.

A separate stack-generation diagnostic also failed with TypeError: undefined is
not iterable. Reverse scrambling can reach a state with no eligible next move;
its options list is then empty, but the generator attempts to destructure a move.
This must be fixed and covered across seeds/modes before the job can ship.

## Remaining before completion/merge

1. Review/fix the generation edge case; validate solvability and bounded behavior.
2. Update new-player test assumptions without weakening legacy/save coverage.
3. Add and pass full rule coverage for all ten games, clocks, rewards, cooldowns,
   retries, modes, recovery and economy. Review reward/timer exploit boundaries.
4. Complete mobile/touch, small-screen, reduced-motion and accessibility checks.
5. Verify both market experiences and switching during active customers/jobs;
   ensure Little Gardener never imposes academic progression.
6. Validate narration, audible phonics quality, fallback and independent effects.
7. Exercise revised starting economy, equipment checkout and no-dead-end paths.
8. Re-run complete regression suite including Garden bonuses, invitation, market
   sessions, Clubhouse, shops and six guide pages. Record any further limitations.
9. Only after requested review and all checks pass: finish/merge the PR and verify
   GitHub Pages. No additional repositories, original-game changes or resets.
