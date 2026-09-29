EXE PAK V12.0 — FIRST PERSON / TEAM SELECT / SETTINGS

What changed:
- Fixed optimistic movement reconciliation to reduce the local-player rubber-banding/backward snap.
- Corrected mouse horizontal direction and added configurable mouse sensitivity + vertical inversion.
- Corrected A/D strafe orientation.
- Added pre-match CT/T team selection and passed the selection through the Worker to the Durable Object room.
- Added a custom first-person rifle and hands/arms model built from procedural 3D geometry.
- Added game settings: 60/120 FPS cap, FOV, graphics quality, mouse sensitivity, invert-Y, mobile touch sensitivity.
- Added render frame cap and low/medium/high graphics pixel-ratio settings.
- Kept mobile joystick and FIRE button.
- Team spawn sides differ (CT/T).

Textures:
The arena uses custom procedural textures and materials with a classic tactical-shooter look. These are not extracted Counter-Strike 1.6 WAD files or original Valve assets.

Install:
1. Extract this ZIP at the root of the GitHub repository (wrangler.toml, src/index.js, public/ must be at the root).
2. Commit and push to main.
3. Deploy the Worker in Cloudflare.
4. Open /counter.html with a cache refresh.

Important:
- This is a custom browser FPS arena, not the original CS 1.6 engine.
- Three.js is loaded from jsDelivr CDN and requires internet access.
- 120 FPS is a requested render cap; actual FPS depends on device/browser/display and can be lower.
- Syntax and archive checks passed, but no real browser/WebGL/live multiplayer session was run here. Test after deployment.
