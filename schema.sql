PRAGMA foreign_keys = ON;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS downloads;
DROP TABLE IF EXISTS packs;
DROP TABLE IF EXISTS mods;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS site_stats;

CREATE TABLE users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT NOT NULL UNIQUE,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'user',
 avatar TEXT DEFAULT '',
 bio TEXT DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_login TEXT
);

CREATE TABLE categories (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL UNIQUE,
 slug TEXT NOT NULL UNIQUE
);

CREATE TABLE mods (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 description TEXT DEFAULT '',
 category TEXT DEFAULT 'Other',
 version TEXT DEFAULT '1.0',
 image_url TEXT DEFAULT '',
 download_url TEXT DEFAULT '#',
 downloads INTEGER NOT NULL DEFAULT 0,
 featured INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE packs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 description TEXT DEFAULT '',
 image_url TEXT DEFAULT '',
 download_url TEXT DEFAULT '#',
 downloads INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE downloads (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER,
 mod_id INTEGER,
 pack_id INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
 FOREIGN KEY(mod_id) REFERENCES mods(id) ON DELETE SET NULL,
 FOREIGN KEY(pack_id) REFERENCES packs(id) ON DELETE SET NULL
);

CREATE TABLE sessions (
 id TEXT PRIMARY KEY,
 user_id INTEGER,
 last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE site_stats (
 id INTEGER PRIMARY KEY CHECK(id=1),
 total_visits INTEGER NOT NULL DEFAULT 0,
 total_downloads INTEGER NOT NULL DEFAULT 0,
 total_users INTEGER NOT NULL DEFAULT 0,
 online_now INTEGER NOT NULL DEFAULT 0
);

INSERT INTO site_stats(id,total_visits,total_downloads,total_users,online_now) VALUES(1,0,0,0,0);
INSERT INTO categories(name,slug) VALUES
('CLEO','cleo'),('Vehicles','vehicles'),('Weapons','weapons'),('Maps','maps'),('Graphics','graphics'),('Scripts','scripts'),('Skins','skins'),('Other','other');
INSERT INTO mods(title,description,category,version,featured) VALUES
('NEXUS Visual Pack','پک گرافیکی سینمایی برای تجربه متفاوت از سن اندرس','Graphics','5.0',1),
('Advanced HUD','رابط کاربری مدرن و سبک برای گیم پلی','Scripts','2.1',1),
('Night City Pack','فضای شبانه با نورپردازی و جزئیات بیشتر','Maps','1.4',0);
INSERT INTO packs(title,description) VALUES
('NEXUS Starter Pack','مجموعه شروع برای یک سن اندرس متفاوت'),
('Ultimate SAMP Pack','مجموعه منتخب مودهای گیم پلی');
