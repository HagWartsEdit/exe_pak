EXE PAK V14 — Shot & Duplicate Player Fix

Changes:
- Prevents opening multiple WebSocket connections when join is clicked repeatedly.
- Cleans up stale local-player meshes if a duplicate player id ever appears in render state.
- Sends a full-length server-coordinate aim ray for shooting instead of a short clamped world target.
- Adds mouse click fallback while pointer lock is active.
- Server now broadcasts a tracer for both hit and miss shots so firing feedback is visible.
- Respawn placement avoids spawning a player inside a known cover collider.

Deploy the entire archive at repository root. This is a code-level fix; live multiplayer still needs testing after deployment.
