EXE PAK V17 — Combat Polish

Changes in public/counter.html:
- Generated gunshot sound using Web Audio API (no external audio file required).
- Shift sprint on desktop; Space jump with a short camera hop and cooldown.
- More detailed remote player silhouettes with torso vest, arms, legs, pouches, helmet and weapon.
- More natural procedural sky-cloud texture.
- Updated on-screen control hints.

Controls:
- WASD: move
- Shift: sprint
- Space: jump
- Mouse: look / click to fire
- Mobile: virtual joystick, touch-look, FIRE button

Notes:
- This is still a browser-based custom shooter, not Call of Duty or Counter-Strike's original engine/assets.
- Jump is currently a local visual camera hop, not full server-authoritative vertical movement; no jump animation synchronization or jumping over cover is implemented.
- Sound is synthesized locally by Web Audio and starts after user interaction. Real multiplayer/browser/device testing and deployment have not been performed.
- Three.js is loaded from jsDelivr, so internet access is needed.
