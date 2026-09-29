EXE PAK V11.8 — Mobile controls, smoother movement, wall-blocked shots

Changes:
- Increased movement speed and made movement frame-time based.
- Added local movement prediction and player interpolation for smoother motion.
- Added mobile-only virtual joystick and FIRE button; desktop retains keyboard/mouse controls.
- Mobile FIRE aims at the nearest enemy; cover/walls block server-side hit checks.
- Server limits shots to the first cover intersection, so a player behind cover cannot be hit through it.

Deploy the entire archive to the same repository/root structure as previous versions and deploy the Worker, including the updated src/index.js. Mobile controls require a touch-capable device. Multiplayer/wall behavior still depends on a successful Cloudflare Durable Objects deployment. Three.js loads from a CDN and needs internet.
