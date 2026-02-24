require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const clientsDb = require('./db/clients');
const leadsDb = require('./db/leads');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const fs = require('fs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer config for screenshot uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, 'screenshot-' + Date.now() + ext);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Format image non supporte'));
  }
});

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

// Page 3 — Projet detail (single client page)
app.get('/projet/:id', async (req, res) => {
  try {
    const client = await clientsDb.getClientById(req.params.id);
    if (!client) return res.redirect('/#realisations');
    const otherClients = await clientsDb.getFeaturedClients();
    const others = otherClients.filter(c => c.id !== client.id).slice(0, 3);
    res.render('projet', { client, others });
  } catch (err) {
    console.error('DB error on projet:', err.message);
    res.redirect('/#realisations');
  }
});

// Page 4 — Mentions legales
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
  const leads = await leadsDb.getAllLeads();
  res.render('admin/index', { clients, leads });
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

// Admin — delete lead
app.post('/admin/leads/:id/delete', async (req, res) => {
  await leadsDb.deleteLead(req.params.id);
  res.redirect('/admin');
});

// ===== API — LEADS (parcours studio) =====

app.post('/api/leads', async (req, res) => {
  const { email, name, phone, metier, parcours, selections, estimated_min, estimated_max, duration } = req.body;

  if (!email || !parcours) {
    return res.status(400).json({ error: 'Email et parcours requis' });
  }

  try {
    // Sauvegarder en DB
    const lead = await leadsDb.createLead({
      email, name, phone, metier, parcours, selections,
      estimated_min, estimated_max, duration,
    });

    // Envoyer l'email de notification via Resend
    const parcoursNames = { vitrine: 'Vitrine', application: 'Application', outil: 'Outil metier', ia: 'IA' };
    const parcoursLabel = parcoursNames[parcours] || parcours;
    const sel = selections || {};
    const step1Items = sel.step1 || [];
    const step2Items = sel.step2 || [];

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #1a1714; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f0e8dc; font-size: 20px; margin: 0 0 4px;">Nouveau lead Studio</h1>
          <p style="color: #c4622a; font-size: 14px; margin: 0;">Parcours ${parcoursLabel}</p>
        </div>
        <div style="background: #faf6f1; padding: 24px 32px; border: 1px solid #eee; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #999; width: 120px;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>
            ${name ? `<tr><td style="padding: 8px 0; color: #999;">Nom</td><td style="padding: 8px 0;">${name}</td></tr>` : ''}
            ${phone ? `<tr><td style="padding: 8px 0; color: #999;">Telephone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ''}
            ${metier ? `<tr><td style="padding: 8px 0; color: #999;">Metier</td><td style="padding: 8px 0;">${metier}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #999;">Parcours</td><td style="padding: 8px 0; font-weight: 600; color: #c4622a;">${parcoursLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Estimation</td><td style="padding: 8px 0;">${estimated_min || '?'} - ${estimated_max || '?'} EUR HT</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Delai</td><td style="padding: 8px 0;">${duration || '-'}</td></tr>
          </table>
          ${step1Items.length > 0 ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Selections etape 1</p>
            <p style="font-size: 14px; margin: 0;">${step1Items.join(', ')}</p>
          </div>` : ''}
          ${step2Items.length > 0 ? `<div style="margin-top: 12px;">
            <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Selections etape 2</p>
            <p style="font-size: 14px; margin: 0;">${step2Items.join(', ')}</p>
          </div>` : ''}
        </div>
        <div style="background: #f5f5f5; padding: 16px 32px; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: none;">
          <p style="font-size: 12px; color: #999; margin: 0;">La Traverse Studio &middot; ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: 'La Traverse Studio <onboarding@resend.dev>',
        to: ['hello@latraverse.studio'],
        subject: `Nouveau lead : ${parcoursLabel} — ${email}`,
        html: emailHtml,
      });
      console.log('[LEAD] Email sent for:', email, parcours);
    } catch (emailErr) {
      console.error('[LEAD] Email send failed:', emailErr.message);
    }

    console.log('[LEAD]', lead.created_at, '-', email, '-', parcours, '-', estimated_min + '-' + estimated_max + ' EUR');
    res.json({ success: true, lead_id: lead.id });
  } catch (err) {
    console.error('Lead creation error:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// ===== API — CONTACT FORM =====

const CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contacts.json');

app.post('/api/contact', (req, res) => {
  const { name, email, metier, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  const entry = {
    id: Date.now().toString(36),
    name,
    email,
    metier: metier || '',
    message,
    date: new Date().toISOString()
  };

  // Stocker le message localement
  try {
    const dir = path.dirname(CONTACTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let contacts = [];
    if (fs.existsSync(CONTACTS_FILE)) {
      contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'));
    }
    contacts.push(entry);
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
  } catch (err) {
    console.error('Erreur stockage contact:', err.message);
  }

  console.log('[CONTACT]', entry.date, '-', name, '<' + email + '>', '-', metier || '(pas de metier)', '-', message.substring(0, 80));

  res.json({ success: true, message: 'Message bien recu' });
});

// ===== API — AI AUTO-FILL =====

// Scrape a website and extract useful content for AI analysis
async function scrapeWebsite(targetUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Titre
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is)
      || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/is);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

    // Meta keywords
    const metaKeyMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["'](.*?)["']/is);
    const metaKeywords = metaKeyMatch ? metaKeyMatch[1].trim() : '';

    // Detect tech signals
    const techSignals = [];
    if (html.includes('__next') || html.includes('__NEXT_DATA__')) techSignals.push('application web moderne');
    else if (html.includes('nuxt') || html.includes('__nuxt')) techSignals.push('application web reactive');
    if (html.includes('wp-content') || html.includes('wordpress')) techSignals.push('site classique CMS');
    if (html.includes('shopify') || html.includes('Shopify')) techSignals.push('plateforme e-commerce');
    if (html.includes('wix.com')) techSignals.push('editeur en ligne basique');
    if (html.includes('squarespace')) techSignals.push('editeur en ligne');
    if (html.includes('webflow')) techSignals.push('site design avance');
    if (html.includes('stripe') || html.includes('paiement') || html.includes('checkout')) techSignals.push('paiement en ligne');
    if (html.includes('calendly') || html.includes('reservation') || html.includes('booking') || html.includes('rdv')) techSignals.push('reservation en ligne');
    if (html.includes('google-analytics') || html.includes('gtag') || html.includes('GA4')) techSignals.push('suivi de frequentation');
    if (html.includes('chat') || html.includes('crisp') || html.includes('intercom') || html.includes('tawk')) techSignals.push('chat en direct');
    if (html.includes('map') || html.includes('maps.google')) techSignals.push('carte interactive');
    if (html.match(/dashboard|tableau de bord|admin/i)) techSignals.push('espace de gestion');
    if (html.match(/login|connexion|mon compte|signup/i)) techSignals.push('espace client securise');
    if (html.match(/api|webhook|integration/i)) techSignals.push('integrations externes');

    // Extract visible text
    let textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#?\w+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (textContent.length > 4000) {
      textContent = textContent.substring(0, 4000) + '...';
    }

    // Extract nav links
    const navLinks = [];
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"'#][^"']*)["'][^>]*>(.*?)<\/a>/gi);
    for (const match of linkMatches) {
      const linkText = match[2].replace(/<[^>]+>/g, '').trim();
      if (linkText && linkText.length < 50 && linkText.length > 1) navLinks.push(linkText);
      if (navLinks.length >= 20) break;
    }

    // Detect dominant colors
    const colorMatches = html.match(/#[0-9a-fA-F]{6}/g) || [];
    const dominantColors = [...new Set(colorMatches)].slice(0, 5);

    return {
      title, metaDesc, metaKeywords, techSignals, textContent,
      navLinks: [...new Set(navLinks)].slice(0, 15),
      dominantColors, success: true,
    };
  } catch (err) {
    console.error('Scrape error:', err.message);
    return { success: false, error: err.message };
  }
}

app.post('/api/ai/analyze-url', async (req, res) => {
  const { url, services } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_key_here') {
      return res.status(500).json({ error: 'Cle API OpenAI non configuree' });
    }

    // Scrape le site en amont
    console.log('[AI] Scraping:', url);
    const scraped = await scrapeWebsite(url);

    // Map des services coches
    const selectedServices = services || [];
    const serviceLabels = {
      'site-vitrine': 'Site vitrine / site web',
      'app-mobile': 'Application mobile',
      'outil-gestion': 'Outil de gestion sur mesure',
      'ecommerce': 'Boutique en ligne',
      'seo': 'Referencement et visibilite locale',
      'reservation': 'Systeme de reservation en ligne',
      'dashboard': 'Tableau de bord / espace client',
      'ia': 'Outils intelligents integres',
      'design': 'Identite visuelle et direction artistique',
      'maintenance': 'Maintenance et accompagnement continu',
    };

    const humanServiceList = selectedServices.map(s => serviceLabels[s] || s).join(', ');
    const isFullPackage = selectedServices.length >= 6;
    const isSiteOnly = selectedServices.length === 1 && selectedServices.includes('site-vitrine');

    // Build the exact services_provided string the AI MUST use
    let exactServicesOutput = '';
    if (selectedServices.length > 0) {
      exactServicesOutput = selectedServices.map(s => serviceLabels[s] || s).join(', ');
    }

    // Scope context with very explicit instructions
    let scopeContext = '';
    if (isFullPackage) {
      scopeContext = `PRESTATIONS REALISEES (TOUTES obligatoires dans la description) : ${humanServiceList}.
C'est un accompagnement complet. La description DOIT mentionner chaque prestation. Pas juste le site web. CHAQUE service coche doit apparaitre dans le texte.`;
    } else if (isSiteOnly) {
      scopeContext = `PRESTATION REALISEE : Site web uniquement. La description ne doit parler QUE du site.`;
    } else if (selectedServices.length > 0) {
      scopeContext = `PRESTATIONS REALISEES (TOUTES obligatoires dans la description) : ${humanServiceList}.
ATTENTION : La description DOIT parler de CHAQUE prestation listee. Si "Espace de gestion" est coche, tu DOIS en parler. Si "Outils intelligents" est coche, tu DOIS en parler. Ne reduis pas tout a "site vitrine".`;
    } else {
      scopeContext = `Aucun service precise. Deduis les services logiques a partir de ce que tu vois sur le site.`;
    }

    let scrapedContext = '';
    if (scraped.success) {
      scrapedContext = `
CONTENU REEL DU SITE (scrappe) :
Titre : ${scraped.title || '(vide)'}
Description meta : ${scraped.metaDesc || '(vide)'}
Mots cles : ${scraped.metaKeywords || '(aucun)'}
Fonctionnalites detectees : ${scraped.techSignals.length > 0 ? scraped.techSignals.join(', ') : '(rien de particulier)'}
Pages/sections visibles : ${scraped.navLinks.length > 0 ? scraped.navLinks.join(', ') : '(non detectees)'}
Couleurs du site : ${scraped.dominantColors.length > 0 ? scraped.dominantColors.join(', ') : '(aucune)'}
Texte visible (extrait) : ${scraped.textContent}
`;
    } else {
      scrapedContext = `Le scraping a echoue (${scraped.error}). Base toi uniquement sur l'URL pour deviner le type d'activite.`;
    }

    // Random style seed to force variation between generations
    const styleVariants = [
      { opener: 'commence par parler du client et son metier avant de parler de La Traverse', tone: 'chaleureux et direct' },
      { opener: 'commence par le resultat obtenu, ce qui a change pour le client', tone: 'fier mais humble' },
      { opener: 'commence par le defi ou le besoin initial du client', tone: 'concret et terre-a-terre' },
      { opener: 'commence par une phrase courte et percutante sur le projet', tone: 'dynamique et enthousiaste' },
      { opener: 'commence par decrire ce que le visiteur decouvre en arrivant sur le site', tone: 'narratif et immersif' },
      { opener: 'commence par situer le client dans son contexte local ou son secteur', tone: 'ancre et authentique' },
    ];
    const style = styleVariants[Math.floor(Math.random() * styleVariants.length)];

    const systemPrompt = `Tu es le redacteur interne du studio La Traverse, un studio digital a Marseille fonde par Adrien et Antoine.

On te donne le contenu scrappe d'un site client et la liste EXACTE de ce qu'on a fait pour eux. Redige une fiche projet comme si c'est La Traverse qui a tout concu et developpe.

=== REGLE CRITIQUE SUR LES SERVICES ===
${selectedServices.length > 0 ? `Les services coches sont : ${humanServiceList}.
Le champ "services_provided" dans ta reponse DOIT contenir EXACTEMENT : "${exactServicesOutput}"
La description DOIT mentionner CHAQUE service. Si on a coche "Espace de gestion", tu parles du tableau de bord. Si on a coche "Outils intelligents", tu parles des automatisations. Si on a coche "Referencement", tu parles du SEO. RIEN ne doit etre oublie. Ne resume PAS tout a "site vitrine".` : `Aucun service precise. Deduis les services logiques a partir du site.`}

=== STYLE POUR CETTE GENERATION ===
Pour la description : ${style.opener}. Le ton doit etre ${style.tone}.
INTERDIT de commencer par "Nous avons accompagne" ou "Notre equipe a". Varie les tournures. Exemples d'ouvertures possibles :
- "[Nom du client], c'est un [metier] base a [ville] qui avait besoin de..."
- "Quand [nom] nous a contactes, son site ne refletait pas..."
- "Le projet [nom] partait d'un constat simple : ..."
- "Un site qui tourne bien, un espace de gestion clair, et des clients qui reservent en ligne. C'est ce qu'on a construit pour [nom]."
- "[Nom du client] cherchait un partenaire pour reprendre toute sa presence en ligne."
- "Tout a commence par un cafe avec [prenom], qui nous a parle de son quotidien de [metier]."
Choisis un style DIFFERENT a chaque fois.

=== REGLES DE REDACTION ===
1. Ecris comme un vrai humain. Phrases courtes, naturelles, zero jargon.
2. INTERDIT les tirets longs, doubles tirets dans tout le texte. Le temoignage ne contient QUE les paroles du client, le nom va dans un champ separe (testimonial_name).
3. INTERDIT les mots : "solution innovante", "transformation digitale", "experience utilisateur", "ecosysteme", "synergie", "levier", "optimiser", "performant".
4. Termes techniques en langage courant : "site rapide et bien fait" (pas un nom de framework), "espace de gestion" (pas "dashboard"), "outils intelligents" (pas "intelligence artificielle"), "boutique en ligne" (pas "e-commerce headless").
5. Mentionne des trucs CONCRETS vus sur le site : le nom, l'activite, les pages, le type de contenu.
6. Le temoignage doit sonner VRAI : spontane, un peu familier, pas du copier-coller marketing. La personne raconte a un pote.
7. La description doit faire 3 a 5 phrases et couvrir TOUTES les prestations cochees.

${scopeContext}

${scrapedContext}

Reponds en JSON valide uniquement :
{
  "name": "Nom du client (detecte sur le site)",
  "industry": "Un parmi : Commerce, Artisanat, Sante, Liberal, Sport, Tech, Restauration, Mode, Immobilier, Education, Autre",
  "description": "3 a 5 phrases. Mentionne CHAQUE prestation cochee. Style : ${style.opener}.",
  "services_provided": "${exactServicesOutput || 'Les services deduits du site, separes par virgules'}",
  "testimonial": "2 a 3 phrases spontanees du client. Ne mets PAS le nom de la personne dans le temoignage, il sera dans testimonial_name.",
  "testimonial_name": "Prenom Nom, Fonction (ex: Claire Martin, Co-fondatrice)",
  "color": "Code hex tire des couleurs du site"
}

AUCUN texte en dehors du JSON.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyse et genere la fiche pour : ${url}` }
        ],
        text: { format: { type: 'json_object' } }
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
    parsed._scraped = scraped.success;
    parsed._techDetected = scraped.success ? scraped.techSignals : [];

    console.log('[AI] Done:', url, '| Services:', selectedServices.join(', ') || 'auto');
    res.json(parsed);
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'analyse', message: err.message });
  }
});

// ===== API — SCREENSHOT UPLOAD =====

app.post('/api/upload-screenshot', upload.single('screenshot'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoye' });
  const url = '/uploads/' + req.file.filename;
  res.json({ success: true, url });
});

// ===== API — AUTO SCREENSHOT FROM URL =====

app.post('/api/capture-screenshot', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  const filename = 'screenshot-' + Date.now() + '.png';
  const outputPath = path.join(UPLOADS_DIR, filename);

  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Petit delai pour laisser les animations se terminer
    await page.waitForTimeout(2000);
    await page.screenshot({ path: outputPath, fullPage: false, type: 'png' });
    await browser.close();

    const screenshotUrl = '/uploads/' + filename;
    res.json({ success: true, url: screenshotUrl });
  } catch (err) {
    console.error('Screenshot capture error:', err.message);
    res.status(500).json({ error: 'Erreur lors de la capture', message: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`La Traverse running at http://0.0.0.0:${PORT}`);
});
