# Once-per-cycle weeding invitation

After a player chooses End Day and enters global Day 5, 10, 15, 20, 25, etc.,
let the new day paint, then show the existing Time to Weed! confirmation if
weeding is currently available. This is an End Day hook, not a load/navigation
hook. A pending bonus, absent plantings or completed cycle keeps it suppressed.

Persist `weedingLesson.invitedCycle` before showing the invitation. It is separate
from completion and defaults safely to 0 for old saves. Not Now does not spend
the opportunity; the green Pull weeds button still opens the activity manually.
The confirmation contains only Let's Weed! and Not Now. Other dialogs keep
their existing Close controls. No save-key or version changes are required.

The scheduled prompt is canceled if the scene, farm, day, render or active dialog
changes, a Garden drag starts, or the tab is hidden. It does not queue another
popup for a later visit or reload. An interrupted prompt leaves manual weeding
available. Watering, planting, harvesting, lessons, bonuses and crop art retain
their existing behavior. The six-page guide already describes optional five-day
weeding accurately, so its wording/artwork need no change for this refinement.

Validation: 203 Node tests passed. Nine phone layout/flow checks passed:
invitation (3), educational weeding (3), existing Garden tools and harvest/day
flow (3), at 320×440, 375×548 and 428×746 with simulated safe areas. Checks include
End Day boundaries, season transitions, two confirmation choices, dismissal,
manual start/resume, refresh persistence, unused bonuses, and cancellation for
crop dialogs, navigation, new watering, dragging and hidden tabs. Automated
checks use Chromium touch emulation; physical iPhone Safari remains a manual
check. Original repository and published preview remain unchanged by this PR.
