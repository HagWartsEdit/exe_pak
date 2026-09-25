EXE PAK ULTIMATE V4 COMPLETE

Core fixes:
- Fresh DB-backed authentication/permissions on every request.
- Deduplicated site visits using a persistent visitor cookie.
- Deduplicated per-post views per visitor session.
- /api/stats and /api/health diagnostics.
- Search API.
- Reports and admin system metrics.
- Admin audit log.
- Existing creator, approval, ratings, favorites, comments, notifications and upload systems preserved.

Deploy all files. Required secret: JWT_SECRET in Cloudflare Worker Secrets.
Test /api/health first, then /api/stats.
