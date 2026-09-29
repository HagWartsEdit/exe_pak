EXE PAK V13 - FPS ARENA REBUILD

What changed:
- Rebuilt public/counter.html as a true Three.js first-person view, with perspective camera at player eye height.
- WASD movement follows the view direction and uses delta-time movement, with client-side collision against the same cover layout used by the server.
- Mouse pointer-lock look on desktop; touch-drag look, virtual joystick, and held FIRE button on touch devices.
- Added a 3D rifle/arms viewmodel, 3D remote-player models, concrete/metal procedural textures, team selection, settings, chat, and score display.
- Settings: 60/120 FPS cap, FOV, quality, mouse/touch sensitivity, invert vertical look.
- Existing Worker and Durable Object protocol retained. Server-side line-of-sight blocking remains in src/index.js.

Important:
- This is a browser-made FPS arena inspired by tactical shooters, not the original Counter-Strike 1.6 client/assets.
- Three.js loads from jsDelivr CDN, so internet access is required.
- 120 FPS is a requested render cap, not a guarantee; actual FPS depends on device/display.
- Syntax/HTML/TOML/ZIP checks are performed, but no live Cloudflare deployment or multi-device online session is claimed.

Deploy:
1. Replace the repository contents with this archive's root contents.
2. Confirm wrangler.toml and src/index.js are at repository root and Cloudflare builds branch main.
3. Commit and deploy the Worker with Durable Object migration/binding enabled.
4. Open /counter.html with a hard refresh.
