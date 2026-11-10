# Elmaccato video direction

Every video made in this project is a GTA VI explainer and follows one shared visual identity. Preserve the language of the supplied script; use French when no language is specified. For video requests, use the project workflow in [.agents/skills/remotion-explainer-video/SKILL.md](.agents/skills/remotion-explainer-video/SKILL.md); keep the Remotion base skills as the source of general API, Studio, accessibility, and licensing guidance.

Treat the user's script as the source of truth. Select and inspect media from `public/assets/catalog/media.json`, then build a scene plan in `src/data/scenes.json`. Adapt framing, camera movement, overlays, transitions and pacing to each spoken beat while keeping the shared palette and typography. Do not produce the same animation sequence for every script.

Start or keep the Remotion Studio preview available while developing. When the user asks to make/create a video, deliver the finished MP4 after preview and validation. For preview/storyboard requests or code changes alone, do not render a final MP4. This is the user's project-specific preference and overrides the Remotion base skill's default render policy.
