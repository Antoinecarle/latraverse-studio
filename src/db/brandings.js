const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'brandings.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeAll(items) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

function createBranding(data) {
  const items = readAll();
  const item = {
    id: crypto.randomUUID(),
    name: data.name || 'Sans titre',
    state: data.state || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  items.unshift(item);
  writeAll(items);
  return item;
}

function getAllBrandings() {
  return readAll().map(b => ({
    id: b.id,
    name: b.name,
    template: b.state?.template || 'minimal',
    format: b.state?.format?.label || 'Post',
    created_at: b.created_at,
    updated_at: b.updated_at,
  }));
}

function getBrandingById(id) {
  return readAll().find(b => b.id === id) || null;
}

function updateBranding(id, data) {
  const items = readAll();
  const idx = items.findIndex(b => b.id === id);
  if (idx === -1) return null;
  if (data.name !== undefined) items[idx].name = data.name;
  if (data.state !== undefined) items[idx].state = data.state;
  items[idx].updated_at = new Date().toISOString();
  writeAll(items);
  return { id: items[idx].id, name: items[idx].name, updated_at: items[idx].updated_at };
}

function deleteBranding(id) {
  const items = readAll().filter(b => b.id !== id);
  writeAll(items);
}

module.exports = { createBranding, getAllBrandings, getBrandingById, updateBranding, deleteBranding };
