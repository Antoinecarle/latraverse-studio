const pool = require('./pool');

async function createContact(data) {
  const { rows } = await pool.query(
    `INSERT INTO contacts (name, email, metier, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.email, data.metier || null, data.message]
  );
  return rows[0];
}

async function getAllContacts() {
  const { rows } = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
  return rows;
}

async function deleteContact(id) {
  await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
}

module.exports = { createContact, getAllContacts, deleteContact };
