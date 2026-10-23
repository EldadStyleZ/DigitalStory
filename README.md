# Digital Story: לנהור toys

Three playable prototypes for the verb **לנהור**: to stream, flock or throng toward something.
Each toy tests a different pull. Built for the Digital Story course at Bezalel Academy.

| # | Sprites name | Shapes name | The pull |
|---|---|---|---|
| 01 | Moths & Lamps | Beam | Agents rush any light that reaches them; objects block or filter the light |
| 02 | School of Fish | Flow | A group you steer grows in green zones, shrinks in red zones, and is pushed by flows |
| 03 | Ants & Sugar | Trail | Each agent walks to the closest attractor it can see, then returns to its base |

## Run it

Open `lanhor/index.html` in Chrome, Edge or Firefox (double-click works, no install, no internet needed).
Fonts load from Google Fonts when online and fall back to system fonts offline.

To serve it instead: `npx serve lanhor` and open the printed address.

## Sprites and Shapes

Every toy has a **Sprites / Shapes** switch in the top bar (key **V**). Shapes replaces every drawing with flat
base colors and plain geometry and renames everything neutrally ("agents", "light", "zone", "attractor"), so the
class can play first and guess the reference after. The choice is remembered across the launcher and all three toys.

## Keys that work everywhere

| Key | Action |
|---|---|
| Space | Pause or resume |
| R | Reset the toy |
| V | Sprites or Shapes |
| T | Tweaks panel (counts, speeds, radii) |
| H | How to play |
| F | Fullscreen |
| M | Sound on or off |

<!-- TOY-CONTROLS -->

## Files

```
lanhor/
  index.html   launcher (press 1, 2 or 3 to open a toy)
  beam.html    toy 01
  flow.html    toy 02
  trail.html   toy 03
  kit.js       shared shell: canvas loop, Sprites/Shapes switch, help, tweaks, toolbar, sound, input
  kit.css      shared look
```

Everything is plain HTML, CSS and JavaScript on a 2D canvas. Every sprite is drawn in code; there are no image files.
