EXE PAK V11 — ULTIMATE GAMING HUB

What changed
- Dedicated Counter page at /counter.html.
- Real-time browser arena room using Cloudflare Durable Objects + WebSockets.
- Synchronized player movement, teams, health, kills/deaths, shooting/hits and room chat.
- Uses an authenticated EXE PAK token when supplied; guests can also join.
- Added a direct Counter link to the main site.
- Kept the V10 site pages and D1 configuration.

IMPORTANT LIMITATION
This is a real-time multiplayer browser arena inspired by Counter-Strike, NOT the original Counter-Strike 1.6 executable/client. Running original CS 1.6 requires a real CS 1.6 game server and a compatible game client; this project does not pretend that those are provided.

Deploy
1) Upload/commit all files to the existing GitHub repository.
2) Ensure wrangler.toml includes the GAME_ROOMS Durable Object binding and v1 migration (already added here).
3) Deploy with the existing Cloudflare Worker workflow.
4) On first deploy, Cloudflare must apply the Durable Object migration. Check deployment output for migration errors.
5) Open /api/cs/room?room=public in a normal browser request to see room status JSON; the actual browser game connects via WebSocket.
6) Check /api/health for the existing app/database.

The multiplayer room keeps current room state in the Durable Object instance. It is not a permanent leaderboard and resets when the room instance is evicted/restarted. Persistent ranked stats would need a follow-up D1 persistence layer and rate-limit/anti-cheat hardening before public competitive use.
