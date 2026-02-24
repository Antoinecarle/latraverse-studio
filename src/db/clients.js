const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'clients.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeAll(clients) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(clients, null, 2));
}

async function getAllClients() {
  return readAll().sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

async function getFeaturedClients() {
  return readAll()
    .filter(c => c.is_featured)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

async function getClientById(id) {
  return readAll().find(c => c.id === id) || null;
}

async function createClient(data) {
  const clients = readAll();
  const client = {
    id: crypto.randomUUID(),
    name: data.name,
    url: data.url || null,
    industry: data.industry || null,
    description: data.description || null,
    services_provided: data.services_provided || null,
    testimonial: data.testimonial || null,
    testimonial_name: data.testimonial_name || null,
    testimonial_linkedin: data.testimonial_linkedin || null,
    testimonial_photo: data.testimonial_photo || null,
    screenshot_url: data.screenshot_url || null,
    logo_url: data.logo_url || null,
    color: data.color || '#c4622a',
    is_featured: data.is_featured || false,
    display_order: data.display_order || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  clients.push(client);
  writeAll(clients);
  return client;
}

async function updateClient(id, data) {
  const clients = readAll();
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return null;
  clients[idx] = {
    ...clients[idx],
    name: data.name,
    url: data.url || null,
    industry: data.industry || null,
    description: data.description || null,
    services_provided: data.services_provided || null,
    testimonial: data.testimonial || null,
    testimonial_name: data.testimonial_name || null,
    testimonial_linkedin: data.testimonial_linkedin || null,
    testimonial_photo: data.testimonial_photo || null,
    screenshot_url: data.screenshot_url || null,
    logo_url: data.logo_url || null,
    color: data.color || '#c4622a',
    is_featured: data.is_featured || false,
    display_order: data.display_order || 0,
    updated_at: new Date().toISOString(),
  };
  writeAll(clients);
  return clients[idx];
}

async function deleteClient(id) {
  const clients = readAll().filter(c => c.id !== id);
  writeAll(clients);
}

module.exports = { getAllClients, getFeaturedClients, getClientById, createClient, updateClient, deleteClient };
