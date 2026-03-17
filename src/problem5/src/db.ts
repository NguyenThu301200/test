import Database, { Database as DatabaseType } from "better-sqlite3";
import path from "path";

/**
 * SQLite database connection.
 * The database file is stored at the project root as `db.sqlite`.
 */
const DB_PATH = path.join(__dirname, "..", "db.sqlite");
const db: DatabaseType = new Database(DB_PATH);

/** Enable WAL mode for better concurrent read performance. */
db.pragma("journal_mode = WAL");

/** Create the resources table if it does not already exist. */
db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    status    TEXT NOT NULL CHECK(status IN ('active', 'inactive')),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);

export default db;
