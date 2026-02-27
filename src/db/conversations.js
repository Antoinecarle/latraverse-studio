const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'conversations.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return {}; }
}

function writeAll(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get conversation history for a pub
function getConversation(pubId) {
  const all = readAll();
  return all[pubId] || [];
}

// Save conversation history for a pub
function saveConversation(pubId, messages) {
  const all = readAll();
  all[pubId] = messages;
  writeAll(all);
}

// Delete conversation when pub is deleted
function deleteConversation(pubId) {
  const all = readAll();
  delete all[pubId];
  writeAll(all);
}

// Add a message to a pub's conversation
function addMessage(pubId, role, content) {
  const all = readAll();
  if (!all[pubId]) all[pubId] = [];
  all[pubId].push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  // Keep last 50 messages per conversation
  if (all[pubId].length > 50) {
    all[pubId] = all[pubId].slice(-50);
  }
  writeAll(all);
  return all[pubId];
}

module.exports = { getConversation, saveConversation, deleteConversation, addMessage };
