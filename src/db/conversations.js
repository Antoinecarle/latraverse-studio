const pool = require('./pool');

async function getConversation(pubId) {
  const { rows } = await pool.query(
    `SELECT role, content, created_at AS timestamp
     FROM conversations
     WHERE pub_id = $1
     ORDER BY created_at ASC
     LIMIT 50`,
    [pubId]
  );
  return rows;
}

async function saveConversation(pubId, messages) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM conversations WHERE pub_id = $1`, [pubId]);
    for (const msg of messages) {
      await client.query(
        `INSERT INTO conversations (pub_id, role, content, created_at) VALUES ($1, $2, $3, $4)`,
        [pubId, msg.role, msg.content, msg.timestamp || new Date()]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteConversation(pubId) {
  await pool.query(`DELETE FROM conversations WHERE pub_id = $1`, [pubId]);
}

async function addMessage(pubId, role, content) {
  await pool.query(
    `INSERT INTO conversations (pub_id, role, content) VALUES ($1, $2, $3)`,
    [pubId, role, content]
  );

  // Keep last 50 messages — delete oldest if over limit
  await pool.query(`
    DELETE FROM conversations
    WHERE pub_id = $1
      AND id NOT IN (
        SELECT id FROM conversations
        WHERE pub_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      )
  `, [pubId]);

  return getConversation(pubId);
}

module.exports = { getConversation, saveConversation, deleteConversation, addMessage };
