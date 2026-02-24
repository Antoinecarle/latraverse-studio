const pool = require('./pool');

async function getAllClients() {
  const { rows } = await pool.query(
    'SELECT * FROM clients ORDER BY display_order ASC, created_at DESC'
  );
  return rows;
}

async function getFeaturedClients() {
  const { rows } = await pool.query(
    'SELECT * FROM clients WHERE is_featured = true ORDER BY display_order ASC'
  );
  return rows;
}

async function getClientById(id) {
  const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createClient(data) {
  const { rows } = await pool.query(
    `INSERT INTO clients (name, url, industry, description, services_provided, testimonial, screenshot_url, logo_url, color, is_featured, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.name,
      data.url || null,
      data.industry || null,
      data.description || null,
      data.services_provided || null,
      data.testimonial || null,
      data.screenshot_url || null,
      data.logo_url || null,
      data.color || '#c4622a',
      data.is_featured || false,
      data.display_order || 0,
    ]
  );
  return rows[0];
}

async function updateClient(id, data) {
  const { rows } = await pool.query(
    `UPDATE clients SET
       name = $2, url = $3, industry = $4, description = $5,
       services_provided = $6, testimonial = $7, screenshot_url = $8,
       logo_url = $9, color = $10, is_featured = $11, display_order = $12,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.name,
      data.url || null,
      data.industry || null,
      data.description || null,
      data.services_provided || null,
      data.testimonial || null,
      data.screenshot_url || null,
      data.logo_url || null,
      data.color || '#c4622a',
      data.is_featured || false,
      data.display_order || 0,
    ]
  );
  return rows[0];
}

async function deleteClient(id) {
  await pool.query('DELETE FROM clients WHERE id = $1', [id]);
}

module.exports = {
  getAllClients,
  getFeaturedClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
