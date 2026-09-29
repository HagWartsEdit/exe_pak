EXE PAK V11.5 — 3D ZONE

Added public/3d.html: three browser-based 3D games using Three.js/WebGL:
- Neon Runner: dodge obstacles and build score
- Space Defender: move and shoot asteroids
- Cyber Maze: first-person maze and exit

Updated public/games.html with a featured link to /3d.html and game count.

Requirements:
- The site must be deployed on the same Cloudflare Worker serving public assets.
- The 3D page loads Three.js r180 from jsDelivr, so the browser needs internet access to that CDN.
- Scores are local to the browser; there is no online leaderboard or multiplayer for these games.
- Tested syntax and ZIP integrity. Real browser/WebGL gameplay was not executed in this environment.
