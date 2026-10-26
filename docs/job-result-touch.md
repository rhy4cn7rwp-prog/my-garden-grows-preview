# Reliable neighborhood result activation

Live verification after Phase 9 found that a touch release following an arcade
basket gesture does not always produce a compatibility click. The completed
job stayed saved and unpaid, but the first Collect tap could appear ineffective.

Result buttons now handle touch pointerup directly, while retaining onclick for
mouse, keyboard and assistive activation. A gesture-scoped compatibility-click
guard prevents a delayed click from dismissing the replacement confirmation.
A new physical pointerdown or keyboard action clears the guard immediately, so
it never delays the next intentional input. An expiry is a fallback for purely
synthetic activation. Collect/retry are idempotent at the UI boundary as well as
the existing engine: no duplicate dollar/cooldown, and no second restart of an
already-new round. There is no reward, timer, save-schema or puzzle change.

Validation: all 240 rule tests pass; 12 actual match/catch phone flow checks
pass across both experiences and three phone sizes. Three additional checks
suppress the compatibility click, deliver a retargeted dialog click, and retry
with duplicate delivery. They verify one dollar, stable cooldown, preserved
confirmation and a single retry. Native Safari/VoiceOver still need family
playtesting; automated checks use Chromium touch input.
