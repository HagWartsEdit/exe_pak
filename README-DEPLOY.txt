EXE PAK NEXUS V5
1) Upload all files to GitHub root.
2) Put your real Cloudflare D1 database UUID in wrangler.toml.
3) Keep deploy command: npx wrangler deploy
4) In Cloudflare Variables/Secrets set JWT_SECRET to a long random secret.
5) Run schema.sql in the D1 Console. WARNING: this V5 schema intentionally drops/recreates app tables, so use it only for a fresh/reset database.
6) To make your first admin, after registering a normal account, run in D1 Console:
UPDATE users SET role='admin' WHERE email='YOUR_EMAIL';
Do not put secrets in GitHub.
