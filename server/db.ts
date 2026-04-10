import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const sqliteFile = path.resolve(process.cwd(), "database", "amanat.app");

const sqliteDir = path.dirname(sqliteFile);
if (!fs.existsSync(sqliteDir)) {
  fs.mkdirSync(sqliteDir, { recursive: true });
}

export const sqlite = new Database(sqliteFile);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Bootstrap tables for local/fullstack runs without extra migration step.
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT,
  username TEXT,
  password TEXT,
  email TEXT,
  nama TEXT,
  bio TEXT,
  profile_picture TEXT,
  role TEXT,
  rank TEXT,
  total_post INTEGER DEFAULT 0,
  total_upvote INTEGER DEFAULT 0,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  achievements TEXT,
  interests TEXT,
  birth_date TEXT,
  aims_number TEXT,
  waisiyat_number TEXT,
  waqf_number TEXT,
  registration_status TEXT,
  is_approved INTEGER DEFAULT 0,
  is_banned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY NOT NULL,
  sess TEXT NOT NULL,
  expire INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  location_text TEXT,
  latitude REAL,
  longitude REAL,
  attachment_data_url TEXT,
  attachment_name TEXT,
  attachment_mime TEXT,
  hashtags TEXT,
  author_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS upvotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  article_id INTEGER NOT NULL REFERENCES articles(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  UNIQUE(article_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  article_id INTEGER NOT NULL REFERENCES articles(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id INTEGER,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER,
  receiver_id INTEGER,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const ensureColumn = (table: string, definition: string) => {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  } catch {
    // Ignore if column already exists.
  }
};

ensureColumn("users", "username TEXT");
ensureColumn("users", "name TEXT");
ensureColumn("users", "password TEXT");
ensureColumn("users", "first_name TEXT");
ensureColumn("users", "last_name TEXT");
ensureColumn("users", "profile_image_url TEXT");
ensureColumn("users", "bio TEXT");
ensureColumn("users", "location TEXT");
ensureColumn("users", "status TEXT");
ensureColumn("users", "achievements TEXT");
ensureColumn("users", "interests TEXT");
ensureColumn("users", "birth_date TEXT");
ensureColumn("users", "aims_number TEXT");
ensureColumn("users", "waisiyat_number TEXT");
ensureColumn("users", "waqf_number TEXT");
ensureColumn("users", "registration_status TEXT");
ensureColumn("users", "is_approved INTEGER DEFAULT 1");
ensureColumn("users", "is_banned INTEGER DEFAULT 0");
ensureColumn("users", "updated_at INTEGER");
ensureColumn("articles", "caption TEXT");
ensureColumn("articles", "location_text TEXT");
ensureColumn("articles", "latitude REAL");
ensureColumn("articles", "longitude REAL");
ensureColumn("articles", "attachment_data_url TEXT");
ensureColumn("articles", "attachment_name TEXT");
ensureColumn("articles", "attachment_mime TEXT");
ensureColumn("articles", "image_urls TEXT DEFAULT '[]'");
ensureColumn("articles", "hashtags TEXT");
ensureColumn("comments", "article_id INTEGER");
ensureColumn("comments", "user_id TEXT");
ensureColumn("comments", "content TEXT");
ensureColumn("comments", "parent_id INTEGER");
ensureColumn("comments", "created_at INTEGER");
ensureColumn("notifications", "actor_id TEXT");
ensureColumn("notifications", "article_id INTEGER");
ensureColumn("notifications", "message TEXT");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  actor_id TEXT NOT NULL REFERENCES users(id),
  article_id INTEGER REFERENCES articles(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  target_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by TEXT REFERENCES users(id),
  resolved_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);
`);

const migrations = [
  `UPDATE users SET username = COALESCE(username, id) WHERE username IS NULL OR username = ''`,
  `UPDATE users
   SET name = COALESCE(
     name,
     NULLIF(TRIM(COALESCE(nama, '')), ''),
     NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''),
     username
   )
   WHERE name IS NULL OR name = ''`,
  `UPDATE users SET password = COALESCE(password, 'changeme') WHERE password IS NULL OR password = ''`,
  `UPDATE users SET first_name = COALESCE(first_name, nama) WHERE first_name IS NULL OR first_name = ''`,
  `UPDATE users SET profile_image_url = COALESCE(profile_image_url, profile_picture) WHERE profile_image_url IS NULL OR profile_image_url = ''`,
  `UPDATE users SET status = COALESCE(status, 'active') WHERE status IS NULL OR status = ''`,
  `UPDATE users SET status = 'active' WHERE status = 'aktif'`,
  `UPDATE users SET is_approved = COALESCE(is_approved, 1) WHERE is_approved IS NULL`,
  `UPDATE users SET updated_at = COALESCE(updated_at, CAST(unixepoch(created_at) * 1000 AS INTEGER), unixepoch() * 1000) WHERE updated_at IS NULL`,
  `UPDATE comments SET article_id = COALESCE(article_id, post_id) WHERE article_id IS NULL`,
  `UPDATE notifications SET article_id = COALESCE(article_id, reference_id) WHERE article_id IS NULL`,
  `UPDATE notifications
   SET message = COALESCE(
     message,
     CASE
       WHEN type = 'like' THEN 'menyukai artikel kamu'
       WHEN type = 'comment' THEN 'mengomentari artikel kamu'
       WHEN type = 'follow' THEN 'mulai mengikuti kamu'
       ELSE 'notifikasi baru'
     END
   )
   WHERE message IS NULL OR message = ''`,
  `INSERT OR IGNORE INTO articles (
    id, title, url, caption, location_text, attachment_data_url, attachment_name,
    attachment_mime, hashtags, author_id, created_at
  )
  SELECT
    p.id,
    COALESCE(NULLIF(TRIM(p.title), ''), 'Untitled'),
    CASE
      WHEN p.content LIKE 'http://%' OR p.content LIKE 'https://%' THEN p.content
      ELSE 'https://community-news.local/post/' || p.id
    END,
    p.content,
    c.name,
    NULLIF(p.image_url, ''),
    NULL,
    CASE WHEN p.image_url IS NOT NULL AND p.image_url <> '' THEN 'image/*' ELSE NULL END,
    NULL,
    CAST(p.user_id AS TEXT),
    COALESCE(CAST(unixepoch(p.created_at) * 1000 AS INTEGER), unixepoch() * 1000)
  FROM posts p
  LEFT JOIN communities c ON c.id = p.community_id`,
  `INSERT OR IGNORE INTO upvotes (article_id, user_id)
   SELECT v.post_id, CAST(v.user_id AS TEXT)
   FROM votes v
   JOIN articles a ON a.id = v.post_id`,
  `INSERT OR IGNORE INTO direct_messages (id, sender_id, receiver_id, content, created_at)
   SELECT
     m.id,
     CAST(m.sender_id AS TEXT),
     CAST(m.receiver_id AS TEXT),
     m.message,
     COALESCE(CAST(unixepoch(m.created_at) * 1000 AS INTEGER), unixepoch() * 1000)
   FROM messages m
   WHERE m.message IS NOT NULL`,
  `INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, message, created_at)
   SELECT
     dm.id,
     CAST(dm.sender_id AS INTEGER),
     CAST(dm.receiver_id AS INTEGER),
     dm.content,
     datetime(COALESCE(dm.created_at / 1000, unixepoch()), 'unixepoch')
   FROM direct_messages dm
   WHERE dm.content IS NOT NULL`,
];

for (const sql of migrations) {
  try {
    sqlite.exec(sql);
  } catch (err: any) {
    // Ignore migration errors if tables/columns don't exist yet or data is missing
    // console.log(`Migration skipped or failed: ${err.message}`);
  }
}

export const db = drizzle(sqlite, { schema });
