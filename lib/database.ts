import { Pool } from "pg";

const globalDb = globalThis as unknown as { focusPool?: Pool; focusSchema?: Promise<void> };
export async function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no configurada");
  if (!globalDb.focusPool) {
    globalDb.focusPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 8000, idleTimeoutMillis: 30000 });
    // pg removes failed idle clients; handle the event without logging credentials.
    globalDb.focusPool.on("error", () => console.error("PostgreSQL: se ha cerrado una conexión inactiva."));
  }
  const pool = globalDb.focusPool;
  globalDb.focusSchema ??= (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(81734921)");
      await client.query(`CREATE TABLE IF NOT EXISTS focus_panel (
        id integer PRIMARY KEY CHECK (id = 1), version integer NOT NULL DEFAULT 0,
        posts jsonb NOT NULL DEFAULT '[]', templates jsonb NOT NULL DEFAULT '[]', updated_at timestamptz NOT NULL DEFAULT now()
      )`);
      await client.query("INSERT INTO focus_panel (id) VALUES (1) ON CONFLICT DO NOTHING");
      await client.query(`CREATE TABLE IF NOT EXISTS focus_media (
        id text PRIMARY KEY, name text NOT NULL, brand text NOT NULL, type text NOT NULL,
        size integer NOT NULL CHECK (size > 0 AND size <= 104857600), created_at timestamptz NOT NULL,
        data bytea NOT NULL
      )`);
      await client.query(`CREATE TABLE IF NOT EXISTS focus_push_subscriptions (
        endpoint text PRIMARY KEY, subscription jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
      )`);
      await client.query(`CREATE TABLE IF NOT EXISTS focus_push_deliveries (
        endpoint text NOT NULL REFERENCES focus_push_subscriptions(endpoint) ON DELETE CASCADE,
        event_key text NOT NULL, sent_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(endpoint, event_key)
      )`);
      await client.query(`CREATE TABLE IF NOT EXISTS focus_notification_settings (
        id integer PRIMARY KEY CHECK (id = 1), settings jsonb NOT NULL
      )`);
      await client.query(`CREATE TABLE IF NOT EXISTS focus_tasks (id text PRIMARY KEY, task jsonb NOT NULL, version integer NOT NULL DEFAULT 0)`);
      await client.query(`CREATE TABLE IF NOT EXISTS focus_push_health (id integer PRIMARY KEY CHECK(id=1), last_run timestamptz, last_success timestamptz, last_error text, sent integer NOT NULL DEFAULT 0)`);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  })().catch(error => { globalDb.focusSchema = undefined; throw error; });
  await globalDb.focusSchema;
  return pool;
}
