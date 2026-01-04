import Database from "better-sqlite3";

export function openDb(filename = "carecircle.db") {
  const db = new Database(filename);
  
  // Enable WAL mode for better performance
  db.exec(`PRAGMA journal_mode = WAL;`);
  
  // Create tables
  db.exec(`
    -- Circles table
    CREATE TABLE IF NOT EXISTS circles(
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      tx_hash TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Members table (circle membership)
    CREATE TABLE IF NOT EXISTS members(
      circle_id INTEGER NOT NULL,
      address TEXT NOT NULL,
      is_owner INTEGER NOT NULL DEFAULT 0,
      tx_hash TEXT,
      joined_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      PRIMARY KEY (circle_id, address)
    );

    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks(
      id INTEGER PRIMARY KEY,
      circle_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT NOT NULL,
      created_by TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 1,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_by TEXT,
      completed_at INTEGER,
      tx_hash TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_tasks_circle ON tasks(circle_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_members_address ON members(address);
    CREATE INDEX IF NOT EXISTS idx_circles_owner ON circles(owner);
  `);
  
  return db;
}
