const pool = require('./pool');

async function createBranding(data) {
  const { rows } = await pool.query(
    `INSERT INTO brandings (name, state) VALUES ($1, $2) RETURNING *`,
    [data.name || 'Sans titre', JSON.stringify(data.state || {})]
  );
  return rows[0];
}

async function getAllBrandings() {
  const { rows } = await pool.query(
    `SELECT id, name,
            state->>'template' AS template,
            state->'format'->>'label' AS format,
            created_at, updated_at
     FROM brandings ORDER BY updated_at DESC`
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    template: r.template || 'minimal',
    format: r.format || 'Post',
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

async function getBrandingById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM brandings WHERE id = $1`, [id]
  );
  return rows[0] || null;
}

async function updateBranding(id, data) {
  const sets = [];
  const vals = [];
  let i = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${i++}`);
    vals.push(data.name);
  }
  if (data.state !== undefined) {
    sets.push(`state = $${i++}`);
    vals.push(JSON.stringify(data.state));
  }
  sets.push(`updated_at = NOW()`);
  vals.push(id);

  const { rows } = await pool.query(
    `UPDATE brandings SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, name, updated_at`,
    vals
  );
  return rows[0] || null;
}

async function deleteBranding(id) {
  await pool.query(`DELETE FROM brandings WHERE id = $1`, [id]);
}

module.exports = { createBranding, getAllBrandings, getBrandingById, updateBranding, deleteBranding };
