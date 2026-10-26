# Permanent preview development workflow

User authorization updated October 26, 2026:

- Develop approved changes through branches and pull requests in
  rhy4cn7rwp-prog/my-garden-grows-preview.
- Automatically merge a completed, requested-scope PR when automated tests and
  relevant checks pass and there are no merge conflicts, unless the user asks
  for manual review for that change.
- If validation fails, conflicts arise or unexpected changes are required,
  stop for review rather than merging.
- After an authorized merge, verify GitHub Pages deployment when status is
  available. Report PR number, checks and permanent live URL.
- Preserve existing saves/progress. Never change the original my-garden-grows
  repository. Do not create additional public preview repositories unless
  specifically requested.

Permanent playtest: https://rhy4cn7rwp-prog.github.io/my-garden-grows-preview/

Phase 9 continuation approval: safely resolve further in-scope implementation
and test issues without asking again. Escalate only for gameplay-design changes,
save-loss risk or an issue that cannot be safely resolved. Merge PR #7 only after
all relevant checks pass, then verify Pages and report the live URL.
