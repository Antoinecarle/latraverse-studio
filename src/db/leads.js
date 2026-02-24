const pool = require('./pool');

async function createLead(data) {
  const { rows } = await pool.query(
    `INSERT INTO leads (email, name, phone, metier, parcours, selections, estimated_min, estimated_max, duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.email,
      data.name || null,
      data.phone || null,
      data.metier || null,
      data.parcours,
      JSON.stringify(data.selections || {}),
      data.estimated_min || 0,
      data.estimated_max || 0,
      data.duration || null,
    ]
  );
  return rows[0];
}

async function getAllLeads() {
  const { rows } = await pool.query(
    'SELECT * FROM leads ORDER BY created_at DESC'
  );
  return rows;
}

async function getLeadById(id) {
  const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
  return rows[0] || null;
}

async function deleteLead(id) {
  await pool.query('DELETE FROM leads WHERE id = $1', [id]);
}

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  deleteLead,
};
