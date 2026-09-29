EXE PAK V15 — Android Controls + Counter Features

Changes:
- Added touch direction pad for Snake and 2048, plus swipe controls for 2048.
- Existing tap controls for Reaction Rush and Memory Cards remain touch-friendly.
- Added mobile FIRE button for Space Defender in 3D Zone; 3D Zone's movement buttons remain touch-enabled.
- Added Counter weapon selection: Pistol, Rifle, Sniper. Server validates weapon type and applies per-weapon fire rate, range and damage.
- Added server-side 3-second dead state before respawn; client shows a countdown and disables movement/shooting while dead.
- Added secret Aim Bot toggle in Counter settings. Enter 4771 and press the toggle; local aim assist tracks the nearest living opponent when there is a clear path through the scene colliders.
- Keeps existing Worker/Durable Object multiplayer setup.

Deploy the entire archive at repository root. This package has passed syntax and archive checks; browser/mobile and live multiplayer behavior still need real-device deployment testing. Aim assistance is a local feature for this project's own browser arena, not a third-party game.
