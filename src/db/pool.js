const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

// Auto-create tables on first require
async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brandings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL DEFAULT 'Sans titre',
        state JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        pub_id UUID NOT NULL REFERENCES brandings(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_pub_id ON conversations(pub_id);

      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500),
        industry VARCHAR(255),
        description TEXT,
        services_provided TEXT,
        testimonial TEXT,
        testimonial_name VARCHAR(255),
        testimonial_linkedin VARCHAR(500),
        testimonial_photo VARCHAR(500),
        screenshot_url VARCHAR(500),
        logo_url VARCHAR(500),
        color VARCHAR(50) DEFAULT '#c4622a',
        is_featured BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(100),
        metier VARCHAR(255),
        parcours VARCHAR(100),
        selections JSONB DEFAULT '{}',
        estimated_min NUMERIC(12,2),
        estimated_max NUMERIC(12,2),
        duration VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        metier VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[DB] Tables ready');
  } catch (err) {
    console.error('[DB] Migration failed:', err.message);
  }
}

migrate();

module.exports = pool;
