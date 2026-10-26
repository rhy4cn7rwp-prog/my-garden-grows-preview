# Illustrated crop growth cutaways

Forty original, lightweight SVG illustrations: four stages for each of the ten
existing crops. Created for the Garden information windows; no pre-existing game
artwork is edited or replaced. Palette, warm paper frames, leaf/produce gradients
and soft soil layers match the game's illustrated learning materials.

`python tools/build_garden_growth.py` reproduces all assets without dependencies.
Each crop has appropriate leaves, roots/bulbs/vines or stalks and mature produce.
Potatoes begin with a seed potato; strawberries begin with a crown/young plant.
Stage 1 uses a closer view to make small planting material visible on a phone.
Root crop cutaways deliberately show what is developing below the soil. These
are simplified educational illustrations, not botanical growth-time diagrams.

The crop's actual existing watered-day requirements determine the current
close-up. Fast crops can pass through a stage between whole-day game updates;
the optional four-stage gallery shows every illustration without adding days or
changing yields. Repeat-producing plants retain an established leafy stage
while regrowing and show ripe produce only when actually ready again.
