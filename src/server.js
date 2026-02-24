require('dotenv').config();
const express = require('express');
const path = require('path');
const clientsDb = require('./db/clients');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== PUBLIC PAGES =====

// Page 1 — Landing immersive (with dynamic clients)
app.get('/', async (req, res) => {
  try {
    const clients = await clientsDb.getFeaturedClients();
    res.render('landing', { clients });
  } catch (err) {
    console.error('DB error on landing:', err.message);
    res.render('landing', { clients: [] });
  }
});

// Page 2 — Studio (parcours, about, contact, onboarding)
app.get('/studio', async (req, res) => {
  try {
    const clients = await clientsDb.getFeaturedClients();
    res.render('studio', { clients });
  } catch (err) {
    res.render('studio', { clients: [] });
  }
});

// Page 3 — Mentions legales
app.get('/mentions-legales', (req, res) => {
  res.render('mentions-legales');
});

// Page 4 — Politique de confidentialite
app.get('/confidentialite', (req, res) => {
  res.render('confidentialite');
});

// ===== ADMIN PANEL =====

app.get('/admin', async (req, res) => {
  const clients = await clientsDb.getAllClients();
  res.render('admin/index', { clients });
});

app.get('/admin/clients/new', (req, res) => {
  res.render('admin/client-form', { client: null });
});

app.post('/admin/clients', async (req, res) => {
  const data = req.body;
  data.is_featured = data.is_featured === 'on';
  data.display_order = parseInt(data.display_order) || 0;
  await clientsDb.createClient(data);
  res.redirect('/admin');
});

app.get('/admin/clients/:id/edit', async (req, res) => {
  const client = await clientsDb.getClientById(req.params.id);
  if (!client) return res.redirect('/admin');
  res.render('admin/client-form', { client });
});

app.post('/admin/clients/:id', async (req, res) => {
  const data = req.body;
  data.is_featured = data.is_featured === 'on';
  data.display_order = parseInt(data.display_order) || 0;
  await clientsDb.updateClient(req.params.id, data);
  res.redirect('/admin');
});

app.post('/admin/clients/:id/delete', async (req, res) => {
  await clientsDb.deleteClient(req.params.id);
  res.redirect('/admin');
});

// ===== API — AI AUTO-FILL =====

app.post('/api/ai/analyze-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_key_here') {
      return res.status(500).json({ error: 'Cle API OpenAI non configuree' });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        input: [
          {
            role: 'system',
            content: `Tu es un redacteur pour le studio digital "La Traverse" base a Marseille.
On te donne l'URL d'un site web client. Tu dois analyser ce site et generer une fiche client COMME SI c'est La Traverse qui a cree ce site/projet.

Tu dois ecrire du point de vue de La Traverse : "Nous avons concu...", "Notre equipe a developpe...", etc.

Reponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "name": "Nom du client/entreprise",
  "industry": "Secteur d'activite (Commerce, Artisanat, Sante, Liberal, Sport, Tech, Restauration, etc.)",
  "description": "Description du projet en 2-3 phrases du point de vue de La Traverse. Ex: Nous avons accompagne [client] dans sa traversee numerique en concevant un site vitrine moderne qui reflete l'identite de leur marque...",
  "services_provided": "Liste des services fournis separes par des virgules. Ex: Site vitrine, Referencement SEO, Design responsive, Integration reservation en ligne",
  "testimonial": "Un faux temoignage credible du client. Ex: La Traverse a parfaitement compris notre vision. Le site depasse nos attentes et nos clients adorent la nouvelle experience en ligne. - [Prenom], Fondateur",
  "color": "Une couleur hex qui represente le client (basee sur les couleurs de son site)"
}

Ne mets AUCUN texte avant ou apres le JSON.`
          },
          {
            role: 'user',
            content: `Analyse ce site web et genere la fiche client : ${url}`
          }
        ],
        text: {
          format: {
            type: 'json_object'
          }
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: 'Erreur API OpenAI', details: data });
    }

    let text = '';
    if (data.output) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content) {
          for (const block of item.content) {
            if (block.type === 'output_text') {
              text = block.text;
            }
          }
        }
      }
    }

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'analyse', message: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`La Traverse running at http://0.0.0.0:${PORT}`);
});
