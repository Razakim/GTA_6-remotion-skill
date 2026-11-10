# Motion canvas authoring guide

`MotionCanvas` is a frame deterministic layer compositor for scene-specific animation. It exists to let the scene plan describe a visual idea, not select a fixed scene template.

## Creative direction from the supplied videos

The 105-second `template_vision.mp4` and the complete 16-minute `Inside GTA 6’s IMPOSSIBLE Police AI.mp4` reference change visual grammar as their subjects change. Both use moving gameplay, frozen/treated shots, drawn callouts, evidence windows, card systems, maps, status meters, game interfaces and editorial artifacts. The longer reference expands this into a changing explanatory system: witnesses, search areas, wanted states, crime profiles, vehicle traces, alarms, cameras, evidence matching, dispatch, inventory, money trails and response levels. A repeated dark violet space, thin light frames, carefully chosen accent colors, compact source marks and recognizable HUD anchors make those forms belong together.

The valuable part is the choreography: the next graphic is motivated by what was just shown. Frames become cards; routes connect places to gameplay; labels attach to evidence; cards settle into a row and rearrange; diagrams reveal one relationship at a time. Flat text overlays are rarely the whole animation.

The full visual inventory is in [animation-grammar.md](./animation-grammar.md); a closer study of 01:57–03:00 is in [reference-analysis.md](./reference-analysis.md). Both stress a key principle: animate causal state changes (witness reaction, attention/search, escalation) in sync with the footage and diagrams.

## Author a scene

Use `visual.type: "motion"` and compose independently timed layers. Start with one strong visual metaphor per beat, then add only supporting layers. Choose a stage that makes the source media legible; the project palette is available but should not dictate the layout. Mix layer types and timing, vary movement direction and distance, and leave rests where the viewer needs to inspect footage. Do not repeat the sample recipe as a default look.

Available layer primitives:

- `image` and `video`: media that can scale, pan, rotate, crop and live inside a moving frame or group.
- `group`: a parent transform for related elements such as footage, tabs, labels and connectors.
- `text`: individually timed words or phrases for kinetic type.
- `panel` and `shape`: opaque/translucent plates, masks, circles, diamonds and cards.
- `path`: an SVG path whose stroke can draw over time, for routes, hand-drawn links and callout leaders.

Pose tracks can also animate media crop (`mediaScale`, `mediaX`, `mediaY`), fill/stroke/text colors (`backgroundColor`, `fillColor`, `strokeColor`, `color`) and layer geometry. This allows moving footage within a fixed crop, a gauge needle or state blocks to change as the source action progresses.

Keyframes are local to each layer and expressed in seconds. Use as many poses as a move needs; use `spring` for an arrival/settle and `linear` for mechanical tracking. Simultaneous independent layers can overlap. Build a transition from one visual idea into the next by animating position, scale, rotation, opacity, clipping or media crop across the full composition rather than appending a generic fade.

The JSON shape is checked by `validate_scenes.py`. Keep paths relative to `public/`, use a source fps for video elements and keep every top-level layer inside its scene duration. All output must be a deterministic function of the frame so Studio and render agree.
