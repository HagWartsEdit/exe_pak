EXE PAK - Creator Approval Update

New admin controls:
- Upload approval: approved users can publish packs from /upload.html.
- Pack Maker tag: admin assigns the 🛠️ Pack Maker label.
- Best approval: admin decides who appears in the public Best Creators section.
- Admin role: promote/demote users.
- Account deletion: admin can delete accounts (self/last-admin protected).
- Public profiles/chat show the relevant badges.

Database migration is automatic. Do NOT delete the existing D1 database.
The existing admin account remains admin.

FIX: safe migrations for legacy users/posts columns to prevent server errors on post detail pages.
