# Scène Remotion explainer

The editable plan lives in `src/data/scenes.json`. It is a JSON array; the agent builds it from the user's script and selects each source from `public/assets/catalog/media.json`. All media paths are relative to `public/`, so use `assets/...` and `audio/...` paths with no leading slash.

```json
{
  "id": "s01-reveal",
  "seconds": 5.2,
  "pace": "steady",
  "entrance": { "type": "wipe", "seconds": 0.45 },
  "visual": { "type": "image", "src": "assets/characters/shared/screenshots/example.jpg", "camera": "push" },
  "voice": "audio/voice-s01.wav",
  "overlays": [
    { "kind": "headline", "t": 0.25, "kicker": "VICE CITY", "text": "Une façade de luxe" },
    { "kind": "label", "t": 2.1, "x": 1310, "y": 510, "text": "Indice", "detail": "Un élément visible à l'image" }
  ]
}
```

## Scene fields

- `seconds`: scene duration, normally matched to its voiceover segment. Without recorded audio, time the spoken copy at a natural pace and leave breathing room.
- `pace`: `slow`, `steady` or `fast`; it adjusts image movement. Let the script's delivery and emotional beat determine it.
- `entrance`: `cut`, `fade`, `wipe` or `flash`; use transitions to express a story change, not as decoration.
- `visual`: an image with a frame-driven camera path (`push`, `pull`, `pan-left`, `pan-right`, `arc-left`, `arc-right`, `whip-left`, `whip-right`, `tilt-up`, `tilt-down`, `static`), framed over the reusable Vice City sunset stage; a video with optional trim points (`start`, `end`, seconds), playback `speed`, and `pauses`; a `pip` composite with a screenshot `background` plus a trimmed source video in a GTA VI branded inset; a `montage` of 2–5 moving media cards in a 3D `fan` or a side-by-side `duo`; or a generated `graphic` background with `style` `night`, `starfield` or `paper-grid`.
- Each montage card has `type` (`image` or `video`), `src`, `label`, and optional `detail`. Video cards also require `start`, `end`, and `sourceFps` in seconds and source frames per second; they can set `speed`. Montage can set `pinned` for a persistent corner tag, `timeline: true` for an animated source rail, and `reveal: { "card": 0, "at": 2, "seconds": 1 }` to expand a selected card to full screen while its image or video continues. Use `fan` for a reveal/dossier and `duo` for parallel evidence; don't place explanatory text over the media when the cards should carry the scene.
- Each video pause has `{ "at": 4.2, "hold": 2.5, "markers": [{ "x": 620, "y": 480, "r": 110, "label": "Détail" }] }`. `at` is a source-video time in seconds. The total scene time is `(end - start) / speed + sum(pause.hold)`; line this up with narration.
- `voice`: optional path to one scene's narration in `public/`.
- `overlays`: time-coded text/graphics; `t` is seconds from the start of this scene.

## Overlay kinds

- `headline`: `text`, optional `kicker`, `animation`, and optional `x`, `y`, `maxWidth`, `fontSize` for subject-safe composition.
- `caption`: short on-screen line, optional `animation`.
- `quote`: `text`, `source`, optional `highlight` substring and `animation`.
- `label`: `x`, `y` target point, `text`, optional `detail`, `color`, `animation`.
- `stat`: `value`, `label`, optional `detail`, `animation`.
- `evidence`: `title`, `lines`, optional final `reveal`, `animation`, and optional card placement `x`, `y`, `width`.
- `focus`: animated target frame and connector with `x`, `y`, `width`, `height`, `title`, optional `detail`, `side`, `color`.
- `wanted`: animated six-star display with `stars`, `state`, `detail`, `mode` (`pursuit`, `search`, `unknown`, `identified`), optional `x`, `y`.
- `heat`: animated evidence chips using `clues` from `CAMÉRA`, `TENUE`, `VISAGE`, `ARME`, `VÉHICULE`, `BINÔME`.
- `search`: expanding search rings and animated escape path; `route` is an array of `[x, y]` canvas points.
- `profile`: animated profile scale with `value` from 0 to 4, explanatory `detail`, optional `shattered` preview marker.

Animation presets: `rise`, `pop`, `slide-left`, `slide-right`, `fade`. Image camera moves are rendered as time-based zoom, drift, 3D tilt, or a short whip with motion blur against the Vice City street-art background; the moving still sits in a decorated cinematic frame, so the city palette remains visible around it. Video cards keep playing inside the animated card rather than becoming a static screenshot. Text, tabs and annotation plates use the project's Vice City sunset palette, angular poster shapes and dossier/traffic-report motifs. Choose a treatment that clarifies the current beat; one scene can also use custom graphics when the story warrants it.

The canvas is 1920×1080 at 30 fps. Coordinates are pixels. Keep overlays inside safe margins and leave enough contrast against the chosen shot. `validate_scenes.py` checks paths, time ranges and label coordinates.

## Motion canvas

Use `visual.type: "motion"` when a beat needs its own choreography. This is a layer system, not a canned preset: every item has an independent start and duration, depth (`z`), box, styling and time-keyed poses. Layers can be groups, images, trimmed footage, text, panels/shapes or SVG paths that draw on. Groups let a card, badge and image move as one while their children animate independently. See `src/data/motion-recipes.example.json`.

Each keyframe `t` is relative to its layer's start, in seconds. It can animate `x`, `y`, `width`, `height`, `scale`, `rotation`, `rotationX`, `rotationY`, `opacity`, `blur`, internal media crop (`mediaScale`, `mediaX`, `mediaY`), colors (`backgroundColor`, `color`, `fillColor`, `strokeColor`) and path `draw` (0 to 1); `ease` can be `linear`, `in`, `out`, `in-out` or `spring`. Stage can be `vice-city`, `plum` or `transparent`; an optional background can set a one-off color or gradient. Compose motifs such as gameplay plus a drawn route, evidence cards assembling from different directions, HUD elements that answer gameplay, a map with a floating video inset, or a graphic that physically transforms into a new shot. For simple beats, keep using the smaller image/video/overlay forms.
