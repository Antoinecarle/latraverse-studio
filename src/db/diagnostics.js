const pool = require('./pool');

// Auto-create table if not exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diagnostics (
      id SERIAL PRIMARY KEY,
      client_name VARCHAR(255) NOT NULL,
      client_email VARCHAR(255),
      client_phone VARCHAR(100),
      client_website VARCHAR(500),
      client_company VARCHAR(255),
      profile VARCHAR(50),
      scenario VARCHAR(50),
      status VARCHAR(50) DEFAULT 'nouveau',
      answers JSONB DEFAULT '{}',
      documents JSONB DEFAULT '{}',
      accesses JSONB DEFAULT '{}',
      human_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

ensureTable().catch(err => console.error('diagnostics table init error:', err.message));

async function createDiagnostic(data) {
  const { rows } = await pool.query(
    `INSERT INTO diagnostics (client_name, client_email, client_phone, client_website, client_company, profile, scenario, status, answers, documents, accesses, human_notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.client_name,
      data.client_email || null,
      data.client_phone || null,
      data.client_website || null,
      data.client_company || null,
      data.profile || null,
      data.scenario || null,
      data.status || 'nouveau',
      JSON.stringify(data.answers || {}),
      JSON.stringify(data.documents || {}),
      JSON.stringify(data.accesses || {}),
      data.human_notes || null,
    ]
  );
  return rows[0];
}

async function getAllDiagnostics() {
  const { rows } = await pool.query('SELECT * FROM diagnostics ORDER BY created_at DESC');
  return rows;
}

async function getDiagnosticById(id) {
  const { rows } = await pool.query('SELECT * FROM diagnostics WHERE id = $1', [id]);
  return rows[0] || null;
}

async function updateDiagnosticStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE diagnostics SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0];
}

async function deleteDiagnostic(id) {
  await pool.query('DELETE FROM diagnostics WHERE id = $1', [id]);
}

module.exports = {
  createDiagnostic,
  getAllDiagnostics,
  getDiagnosticById,
  updateDiagnosticStatus,
  deleteDiagnostic,
};
