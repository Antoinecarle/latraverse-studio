const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'leads.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeAll(leads) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));
}

async function createLead(data) {
  const leads = readAll();
  const lead = {
    id: crypto.randomUUID(),
    email: data.email,
    name: data.name || null,
    phone: data.phone || null,
    metier: data.metier || null,
    parcours: data.parcours,
    selections: data.selections || {},
    duration: data.duration || null,
    created_at: new Date().toISOString(),
  };
  leads.unshift(lead);
  writeAll(leads);
  return lead;
}

async function getAllLeads() {
  return readAll();
}

async function getLeadById(id) {
  return readAll().find(l => l.id === id) || null;
}

async function deleteLead(id) {
  const leads = readAll().filter(l => l.id !== id);
  writeAll(leads);
}

module.exports = { createLead, getAllLeads, getLeadById, deleteLead };
