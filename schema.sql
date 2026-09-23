CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 salt TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'user',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mods (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 category TEXT NOT NULL,
 categoryName TEXT DEFAULT '',
 description TEXT DEFAULT '',
 image TEXT DEFAULT '',
 downloadUrl TEXT DEFAULT '',
 sourceUrl TEXT DEFAULT '',
 size TEXT DEFAULT '',
 version TEXT DEFAULT '',
 author TEXT DEFAULT '',
 featured INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1,
 downloads INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packs (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 category TEXT NOT NULL,
 categoryName TEXT DEFAULT '',
 description TEXT DEFAULT '',
 image TEXT DEFAULT '',
 downloadUrl TEXT DEFAULT '',
 sourceUrl TEXT DEFAULT '',
 size TEXT DEFAULT '',
 version TEXT DEFAULT '',
 author TEXT DEFAULT '',
 featured INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_stats (
 id INTEGER PRIMARY KEY,
 views INTEGER NOT NULL DEFAULT 0,
 downloads INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_favorites (
 user_id TEXT NOT NULL,
 item_type TEXT NOT NULL,
 item_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,item_type,item_id)
);

CREATE TABLE IF NOT EXISTS download_history (
 id TEXT PRIMARY KEY,
 user_id TEXT,
 item_type TEXT NOT NULL,
 item_id TEXT,
 item_name TEXT DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_stats(id,views,downloads) VALUES(1,0,0);
INSERT OR IGNORE INTO categories(id,name,sort_order) VALUES
('car','ماشین',1),('graphics','گرافیک',2),('character','کاراکتر',3),('samp','SAMP',4),('gameplay','گیم‌پلی',5);
