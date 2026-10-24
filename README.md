# Digital Story: לנהור toys

Three playable prototypes for the verb **לנהור**: to stream, flock or throng toward something.
Each toy tests a different pull. Built for the Digital Story course at Bezalel Academy.

| # | Sprites name | Shapes name | The pull |
|---|---|---|---|
| 01 | Moths & Lamps | Beam | Agents gather where the light is strongest (overlapping beams add up); objects block, filter or reflect the light |
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

For the guessing round, open a toy straight into Shapes with `?view=shapes`, for example
`lanhor/flow.html?view=shapes`. Use `?view=sprites` for the reveal, or just press V.

## Share a link

The toys are online at **https://eldadstylez.github.io/DigitalStory/lanhor/** (GitHub Pages, deployed from `main`).
The address is case-sensitive: `DigitalStory` needs its capitals.

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

## 01 Moths & Lamps (Beam)

Up to five lamps hang on the frame, in six colors: red, orange, yellow, green, blue and purple. Moths fly to the
brightest light. Every beam adds up, so where two beams overlap the light is stronger than one beam alone (and three
beat two). The swarm gathers in the brightest area and keeps roaming around inside it. Stones block light, colored
glass lets only its own color through, mirrors bounce beams (up to 3 times, a little weaker each bounce), and beams
mix their colors where they overlap.

| Input | Action |
|---|---|
| Click the frame, or L | Hang a lamp (up to five) |
| 1–6 | Lamp color, from red to purple (also recolors the selected lamp) |
| Drag | Slide a lamp along the frame, or move an object |
| Drag the knob, or ← → | Aim the selected lamp |
| Wheel | Aim a lamp or turn an object |
| Shift + wheel, or ↑ ↓ | Make a beam wider or narrower |
| Double-click, or O | Switch a lamp on or off |
| Tab / Esc | Select the next lamp / deselect |
| 7 8 9 0 | Add a block, wedge, stone or plank |
| G | Add glass in the current color |
| − | Add a mirror (Shift + wheel or Shift + Q E turns it 1° at a time) |
| Q E, arrows | Turn or nudge the selected object |
| Right-click, or Delete | Remove a lamp or object |

**One-minute demo:** the red and blue beams already cross; watch the moth fly into the overlap and roam there.
Raise *How many* in Tweaks to 30 for a swarm. Aim a third lamp into the same spot and the swarm packs into the
three-beam patch; move one lamp away and they stream to the next brightest place. Drag a stone into the overlap to
break it up. Then add a mirror (−) and turn it so the reflection crosses the direct beam: the reflection adds up like
a second lamp and the swarm moves to the new hot spot. The *Brightest* counter shows how many beams the swarm is
sitting in.

## 02 School of Fish (Flow)

You steer one fish through an underwater maze. Staying in green seagrass adds fish to the school, one at a
time. Red water removes them, one at a time, never below one. Currents carry the school until it leaves them.
In one-tile gaps the school stretches into a line, then gathers back into a ball.

| Input | Action |
|---|---|
| W A S D or arrows | Swim the school |
| Hold the mouse | Swim toward the pointer |
| + | Add 10 fish |
| P | Show the path field the fish follow |
| L | Next level (two levels) |

**One-minute demo:** press D to swim into the green zone next to the start and wait for the school to grow to
about 15. Swim through a one-tile channel to show the squeeze and the ball re-forming on the other side. Ride a
current (the streaks show its direction; you can't swim up a jet), then dip into red. For a quick big school,
press + a few times. One sideways drift sweeps the school toward a red zone on purpose, so steer around it with
a small school. Present at 1920×1080 or in fullscreen (F): the fish are small on lower resolutions.

## 03 Ants & Sugar (Trail)

Three ant colonies live in a hedge maze. Each ant walks to the closest sugar cube it can see, takes one bite,
then looks for the next cube it hasn't bitten. When nothing is in sight, it walks home to its own nest.
A cube lasts 20 bites.

| Input | Action |
|---|---|
| Click | Drop a sugar cube |
| Drag | Lay a trail of sugar |
| Right-click | Remove a cube or flag |
| 1 / 2 (or G) | Sugar tool / flag tool (a flag counts the ants that reach it) |
| Arrows + Enter | Move the keyboard cursor and drop |
| Delete / Z | Remove under the cursor / undo the last cube |
| C | Clear all sugar |
| N | New random map |
| L | Show sight lines (who is heading where) |

**One-minute demo:** the opening trail already has one colony marching. Drag a trail from another nest
through a corridor to a far corner and plant a flag at the end (key 2). Stop adding sugar and watch every ant
walk back to its own nest. Turn on sight lines (L) to explain "the closest one it can see". The opening trail is
eaten in a few seconds; raise *Bites per cube* in Tweaks if you want trails to last longer while you talk.

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
