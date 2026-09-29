EXE PAK V11.9 — FIRST PERSON CAMERA

Changes:
- Replaced the elevated/isometric camera with a first-person camera located at the local player's eye height.
- Added a centered crosshair.
- PC: WASD movement, mouse-look using pointer lock, click to fire.
- Touch devices: virtual joystick movement, drag on the arena to turn the view, FIRE button shoots forward.
- Increased movement speed and hid the local third-person model while in first-person view.

Deployment:
- Replace repository files with the contents of this archive at the repository root.
- Commit to the intended branch and deploy the Cloudflare Worker.
- Multiplayer and WebGL have not been verified in a real browser/live deployment. Three.js is loaded from jsDelivr and needs internet access.
- This is still a custom browser arena inspired by tactical shooters, not the original Counter-Strike 1.6 engine/assets.
