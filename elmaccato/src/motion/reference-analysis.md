# Reference study: Police AI, 01:57–03:00

Source: `public/assets/Inside GTA 6’s IMPOSSIBLE Police AI.mp4`, reviewed at 0.5-second intervals across the requested range. The full source is 16:08; this note covers only 01:57–03:00.

## What happens in this passage

| Approx. time | Visual event | Animation principle |
| --- | --- | --- |
| 01:57–02:04 | A simple witness/weapon diagram gives way to live street footage. Markers and short labels stay attached to people and the carried weapon as the shot changes. | Establish a spatial relationship in a diagram, then prove it in moving footage. Keep annotations registered to the subject across cuts and camera changes. |
| 02:04–02:10 | The footage resolves into a hanging studio identity card, then into a framed gameplay window paired with a bystander mood gauge. | Turn one scene detail into an editorial artifact; change the whole composition to introduce a new explanatory variable. |
| 02:10–02:18 | The footage changes while the mood meter needle travels from calm toward uneasy. | Let the indicator respond to the action; the graphic has state and meaning over time. |
| 02:18–02:39 | A dark perspective floor/map replaces the footage. Jason, surrounding positions, sight lines, movement labels and search markers accumulate in stages. Dotted paths show how attention spreads, while labels change from out-of-sight to walk/run. | Build a spatial model in a deliberate order. Animate relationships and state changes, not decorative motion. Reuse a stable anchor while the tactical picture grows around it. |
| 02:39–02:50 | A video evidence window appears beside a three-step escalation graphic: warning, panic, they draw. The source footage changes as the highlighted state rises. | Synchronize source footage, state transition and graphic emphasis; make each escalation a visible event. |
| 02:50–02:57 | The scene returns to a framed gameplay window and the mood gauge advances toward panic as the confrontation grows. | Carry a graphic state forward across new evidence so viewers can compare the change. |
| 02:57–03:00 | Inventory and vehicle diagrams enter beside character footage; markings draw onto the weapon/car relationship. | Transform from action to consequence, with linework linking the specific objects to the spoken point. |

Times are approximate; the reference uses hard cuts and continuous gameplay under some graphics, so visual beats overlap.

## What this adds to the motion direction

The core unit is a **causal chain**: action → witness perception → information retained → police response. Each visual system explains one link. Gameplay, diagram, map, gauge, evidence window and inventory are not interchangeable cards; their form follows the kind of information being explained.

Composition changes are broad and deliberate. A frame may hold footage and a gauge side by side; dissolve/clear the footage into a spatial map; accumulate route markers and labels on that map; then cut to a staged response meter. The repeated plum space, fine light borders, warm labels, compact source marks and persistent attribution unify the different visual forms.

For authored scenes, ask what must move in relation to what: the marker follows the person, the needle follows the level of unease, lines originate at the character, response blocks activate in order, and object callouts attach to the correct inventory item. Represent those relations with independent, timed motion layers and keyframes. Keep key positions stable while information changes; avoid animating every layer at once. Use a cut when the explanatory model changes, and a continuous move when an object transforms into another explanatory form.

## Mapping onto MotionCanvas

- Video and image layers provide moving evidence windows.
- `group` keeps a frame, source tag and attached marker aligned as one object.
- `path` draws sight lines, route traces and callout leaders over time.
- `shape` plus keyframed rotation makes a gauge needle; staged rectangles build the escalation ladder.
- Separate text, panels and source tags let labels enter, update or clear without resetting the footage.
- Layer timing allows the map to assemble progressively and then hand off to evidence footage.

Object tracking is authored from inspected source frames: the keyframes can follow a target manually. The current engine does not infer tracking coordinates from arbitrary footage, so do not imply that it does.
