EXE PAK REBORN
- Upload all files to GitHub.
- Replace PASTE_D1_DATABASE_ID_HERE with the real D1 UUID.
- Keep deploy command: npx wrangler deploy
- Add JWT_SECRET as a Cloudflare Secret (long random value).
- Run schema.sql once in the remote D1 Console.
- Register your account, then run: UPDATE users SET role='admin' WHERE email='YOUR_EMAIL';
- Admin: /admin.html
