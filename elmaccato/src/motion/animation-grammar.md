# Visual animation grammar from the full reference

## Review scope

The supplied `public/assets/Inside GTA 6’s IMPOSSIBLE Police AI.mp4` is 16:07.97 at 1920×1080 and 60 fps. The complete visual timeline was reviewed at regular 2.5-second intervals, with 0.5-second detail sampling for 01:57–03:00. This records the visual grammar and approximate order of systems, not a frame-by-frame shot list or a transcript of the spoken track.

## Approximate story progression

These visual clusters overlap: some interface marks and source anchors carry into the next section.

- **Opening:** a convenience-store event moves through witness attention, evidence cards, map/search graphics, police response and wanted status. The video establishes its recurring footage frame, source marks and plum graphic stage.
- **Preparation and immediate response:** weapon/loadout states and bystander reaction move into floor-plan/tactical views, escalation blocks and changing mood gauges. This includes the detailed 01:57–03:00 section.
- **Vehicle and location evidence:** vehicle choices, tracker/plate concepts, routes, charge panels and bag capacity are explained with a mix of gameplay, maps and object diagrams.
- **Detection and reporting:** witness, camera, alarm, phone and database systems become small interfaces, card comparisons, match/no-match states, camera grids and dispatch views.
- **Search and escalation:** pursuit levels, map zones, last-seen markers, tactical units, profile scales and action choices move between live gameplay and simplified response diagrams.
- **Consequences and memory:** money/loot, heat, retained identity, criminal profile, mission progress and multiple evidence types are summarized through interface mockups, meters, cards and HUD-like totals.
- **Closing:** the work returns to gameplay and character evidence, then date/release art and channel end-card elements.

## The complete visual vocabulary

The video keeps a dark plum/violet graphic world, a light perspective grid, thin luminous outlines, rounded evidence windows, compact labels and persistent game/HUD marks. It uses coral/pink for alerts and tracking, green for confirmed/safe states, amber for warning/escalation and cream for paper-like labels. The source footage retains its own color; the identity sits in the graphic system around it.

Across the full timeline, the same GTA VI police story is expressed through several visual families:

1. **Gameplay evidence:** full-screen or framed moving footage, with purposeful crops, zooms and short holds. Persistent wanted stars, source tags and mini-map marks maintain orientation through changing shots.
2. **Attention and witnesses:** circles, crosshairs, face/clothing tags, witness marks and small lines connect visible people or objects to the system responding to them. Some labels follow a person as the camera moves; positions need shot-specific keyframes.
3. **Evidence boards and comparison:** cards enter one at a time, then settle into rows, columns or a grid. They carry evidence type, source and state. Selected cards expand or hand off into live footage; other cards remain as context.
4. **Spatial models:** map plates, search zones, heat areas, nodes, routes and tactical floor plans. Geometry arrives in stages: establish the world, place the subject, add relevant actors, then reveal paths, range or outcomes. The final view may travel back into source footage or a smaller inset.
5. **State meters and escalation:** gauges, wanted stars, profile scales, dispatch boxes and warning/panic/action ladders. Needles and highlighted segments change with the observed scene. Their values carry forward when the footage changes so viewers can compare states.
6. **Detection and evidence systems:** camera grids, eyewitness/phone/alarm/tracker icons, face or outfit matches, database panels, no-signal and no-match states, pins and record traces. A result is revealed as a sequence of checks rather than a static list.
7. **Loadout, vehicle and money systems:** checklists and inventory slots, vehicle choice, plate/GPS indicators, phone interfaces, bank and ATM flows, loot cards and numeric readouts. Objects move between source shot, diagram and interface while the same value stays visually linked.
8. **Character and editorial artifacts:** IDs, portraits, badges, wanted sheets, source/interview IDs, date/release cards, logos and end cards. Paper/card forms provide rests between denser explanatory sequences.
9. **Action diagrams:** silhouettes and small pictograms show draw/aim/shoot/hold-fire, movement, line of sight and response. These diagrams abstract an action into readable stages, then hand back to actual footage for evidence.

## Pacing and composition patterns

- The edit alternates information-dense graphics with stretches of gameplay. The viewer gets time to read a built model before it changes.
- State changes happen in a visible order: one evidence icon appears, gets checked, then affects a gauge, map, dispatch state or wanted status.
- Stable anchors persist across cuts. Wanted stars, a character marker, source attribution or a gauge let the viewer compare a new shot to the previous state.
- The same concept can change representation: footage becomes a card, a card becomes a phone/interface, or a shot resolves into a map/diagram. This transformation carries meaning.
- Camera movement and graphic movement have separate jobs. The game shot may continue moving while a meter fills; a map may hold still while routes and pins animate; a card can move in 3D while its video continues inside.
- Lines point to their source and destination. Dotted routes distinguish tracking/search from hard UI connectors. Crosshairs, rings and corner brackets locate specific visible details.
- Accent color encodes state consistently within a sequence. Green confirms, amber warns, coral/pink marks urgency or a target, and subdued gray indicates inactive/unknown.
- Major composition changes are cuts or motivated transitions, not repeated fades. Motion eases settle; alerts can hit sharply; diagrams draw at a measured pace.
- The graphic world has depth through perspective planes, tilted panels and layered shadows, while text stays mostly flat, small and sharply legible.

## Scene-planning instructions for this project

For each narration beat, the AI should identify:

1. The **claim or causal relation** being explained (for example, a mask changes face recognition but leaves clothing evidence).
2. The best **proof media** available and whether it should remain full-frame, move inside a card, freeze for inspection or be compared with another source.
3. The **visual model** that fits the relation: evidence board, map, meter, branching path, interface, object diagram, profile, or a newly invented composition.
4. The **state sequence**: what is initially unknown, what is detected, which visual element changes, and what result the viewer should understand.
5. The **layer choreography**: what stays anchored, what enters, what follows the source image, what draws or fills, what hands off to the next representation, and when each layer clears.
6. The **reading time**: let each state or relationship register before introducing the next one. Keep gameplay visible and text concise.

Use `visual.type: "motion"` for scenes with several coordinated layers, and choose simpler existing visual types when they express the beat better. Create new compositions from primitives; do not apply a canned scene layout to every beat and do not repeat the sample recipe wholesale. Preserve the project palette and attribution system while varying composition, movement, density, and metaphor. Use available footage when it supports the claim; never add motion unrelated to the topic just to fill the screen.

Tracking coordinates in this reference are editorially placed. `MotionCanvas` supports manual keyframed positions and internal media crops; it does not discover people, weapons, faces or camera views automatically. Inspect the actual selected source frames before placing markers.
