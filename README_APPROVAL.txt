EXE PAK APPROVAL SYSTEM FIXED

- Admin approves upload access per user
- Admin can grant Pack Maker tag
- Admin can approve Best section
- Admin can promote/demote admins
- Admin can delete accounts with last-admin protection
- Approved users can publish through /upload.html
- Fixed D1 migration: last_seen uses constant default then is initialized, avoiding SQLite ALTER TABLE default errors
- Existing D1 should NOT be deleted
