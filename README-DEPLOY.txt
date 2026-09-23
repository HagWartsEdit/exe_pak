EXE PAK NEXUS

1. Upload all files to GitHub branch main.
2. In wrangler.toml replace PASTE_YOUR_D1_DATABASE_ID_HERE with the UUID of your existing exe-pak-db.
3. Keep Cloudflare Deploy command: npx wrangler deploy
4. In D1 Console run schema.sql once if Tables is 0.
5. Public site: /
6. Admin: /admin.html

Security: passwords use PBKDF2-SHA256 with 100000 iterations and sessions are stored hashed in D1. Never publish secrets.
