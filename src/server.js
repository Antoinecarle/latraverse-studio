require('dotenv').config({ override: true });
const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const { WebSocketServer, WebSocket } = require('ws');
const clientsDb = require('./db/clients');
const leadsDb = require('./db/leads');
const diagnosticsDb = require('./db/diagnostics');
const brandingsDb = require('./db/brandings');
const conversationsDb = require('./db/conversations');
const sharp = require('sharp');

let resend = null;
try {
  const { Resend } = require('resend');
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (e) {
  console.warn('[WARN] Resend not available:', e.message);
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const BRANDING_DIR = path.join(UPLOADS_DIR, 'branding');
const fs = require('fs');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(BRANDING_DIR)) fs.mkdirSync(BRANDING_DIR, { recursive: true });

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

// Page 5 — Diagnostic client (public onboarding form)
app.get('/diagnostic', (req, res) => {
  res.render('diagnostic');
});

// Page 6 — Branding Studio (visual design tool)
app.get('/branding', (req, res) => {
  res.render('branding');
});

// ===== API — DIAGNOSTIC =====

app.post('/api/diagnostic', async (req, res) => {
  const { client_name, client_email } = req.body;
  if (!client_name || !client_email) {
    return res.status(400).json({ error: 'Nom et email requis' });
  }

  try {
    const diagnostic = await diagnosticsDb.createDiagnostic(req.body);

    // Email notification via Resend
    if (resend) {
      try {
        const profileLabels = { vierge: 'Le Vierge', equipe: "L'Equipe", migrant: 'Le Migrant' };
        const scenarioLabels = { saas: 'SaaS existant', scratch: 'From scratch', migration: 'Migration', ecommerce: 'E-commerce', ia: 'Integration IA' };
        const profileLabel = profileLabels[req.body.profile] || req.body.profile || '-';
        const scenarioLabel = scenarioLabels[req.body.scenario] || req.body.scenario || '-';

        await resend.emails.send({
          from: 'La Traverse <onboarding@resend.dev>',
          to: ['hello@latraverse.studio'],
          subject: `Nouveau diagnostic : ${client_name} (${profileLabel})`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
            <div style="background:#1a1714;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:#f0e8dc;font-size:20px;margin:0 0 4px">Nouveau diagnostic client</h1>
              <p style="color:#c4622a;font-size:14px;margin:0">${profileLabel} — ${scenarioLabel}</p>
            </div>
            <div style="background:#faf6f1;padding:24px 32px;border:1px solid #eee;border-top:none">
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:8px 0;color:#999;width:120px">Nom</td><td style="padding:8px 0;font-weight:600">${client_name}</td></tr>
                <tr><td style="padding:8px 0;color:#999">Email</td><td style="padding:8px 0">${client_email}</td></tr>
                ${req.body.client_company ? `<tr><td style="padding:8px 0;color:#999">Entreprise</td><td style="padding:8px 0">${req.body.client_company}</td></tr>` : ''}
                ${req.body.client_phone ? `<tr><td style="padding:8px 0;color:#999">Tel</td><td style="padding:8px 0">${req.body.client_phone}</td></tr>` : ''}
                ${req.body.client_website ? `<tr><td style="padding:8px 0;color:#999">Site</td><td style="padding:8px 0">${req.body.client_website}</td></tr>` : ''}
              </table>
            </div>
            <div style="background:#f5f5f5;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none">
              <p style="font-size:12px;color:#999;margin:0">Voir le diagnostic complet dans l'admin La Traverse</p>
            </div>
          </div>`,
        });
      } catch (emailErr) {
        console.error('[DIAGNOSTIC] Email send failed:', emailErr.message);
      }
    }

    console.log('[DIAGNOSTIC]', diagnostic.created_at, '-', client_name, '-', req.body.profile, '-', req.body.scenario);
    res.json({ success: true, id: diagnostic.id });
  } catch (err) {
    console.error('Diagnostic creation error:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// ===== ADMIN PANEL =====

app.get('/admin', async (req, res) => {
  const clients = await clientsDb.getAllClients();
  const leads = await leadsDb.getAllLeads();
  const diagnostics = await diagnosticsDb.getAllDiagnostics();
  res.render('admin/index', { clients, leads, diagnostics });
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

// Admin — view diagnostic detail
app.get('/admin/diagnostic/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/admin');
  const diagnostic = await diagnosticsDb.getDiagnosticById(id);
  if (!diagnostic) return res.redirect('/admin');
  res.render('admin/diagnostic/view', { diagnostic });
});

// Admin — update diagnostic status
app.post('/admin/diagnostic/:id/status', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/admin');
  await diagnosticsDb.updateDiagnosticStatus(id, req.body.status);
  res.redirect('/admin/diagnostic/' + id);
});

// Admin — delete diagnostic
app.post('/admin/diagnostic/:id/delete', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/admin');
  await diagnosticsDb.deleteDiagnostic(id);
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

    if (resend) {
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
    } else {
      console.warn('[LEAD] Resend not configured — skipping email notification');
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

// ===== API — BRANDING IMAGE GENERATION (Gemini) =====

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/branding/generate-image', async (req, res) => {
  const { prompt, aspectRatio } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

  try {
    console.log('[GEMINI] Generating image:', prompt);

    const geminiRes = await fetch(GEMINI_IMAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('[GEMINI] API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erreur API Gemini', details: data });
    }

    // Extract base64 image from response
    const candidates = data.candidates;
    if (!candidates || !candidates[0] || !candidates[0].content || !candidates[0].content.parts) {
      return res.status(500).json({ error: 'Reponse Gemini invalide', details: data });
    }

    const parts = candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      return res.status(500).json({ error: 'Aucune image dans la reponse Gemini' });
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;
    const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/webp' ? '.webp' : '.png';
    const filename = 'gemini-' + Date.now() + ext;
    const filePath = path.join(BRANDING_DIR, filename);

    // Decode and save
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const url = '/uploads/branding/' + filename;
    console.log('[GEMINI] Image saved:', filename);
    res.json({ success: true, url, filename });
  } catch (err) {
    console.error('[GEMINI] Generation error:', err);
    res.status(500).json({ error: 'Erreur lors de la generation', message: err.message });
  }
});

// ===== API — BRANDING STICKER GENERATION (Gemini) =====

// Prompt system: category defines WHAT, tone defines HOW it looks
const STICKER_CATEGORIES = {
  icon: 'a standalone icon/symbol',
  badge: 'a premium badge or label element',
  illustration: 'a detailed illustration',
  '3d': 'a 3D rendered object with depth and volume',
  mascot: 'a character/mascot with personality',
  abstract: 'an abstract artistic composition',
  emoji: 'an expressive emoji-style element',
  logo: 'a professional logomark/symbol',
};

const STICKER_TONES = {
  flat: 'Clean flat design style, solid color fills, no gradients, sharp geometric edges, vector-art look, inspired by Material Design icons. Bold simple shapes, minimal details.',
  glossy: 'Glossy 3D render style, soft reflections, subtle highlights, glass-like finish, Apple-style icon quality. Smooth surfaces, polished look, soft ambient occlusion shadows.',
  neon: 'Neon glow style, bright luminous outlines on dark, cyberpunk aesthetic, electric glow effects, light trails. Emissive colors, dark core with bright edges.',
  watercolor: 'Soft watercolor painting style, organic brush strokes, gentle color bleeds, hand-painted artistic feel. Delicate washes, paper texture impression, flowing edges.',
  line: 'Minimal line art style, single continuous stroke, elegant thin outlines, monoline illustration. Clean precise paths, no fills, sophisticated simplicity.',
  isometric: 'Isometric 3D style, precise geometric perspective, technical illustration quality, architectural precision. Clean edges, consistent angle, subtle depth.',
  gradient: 'Modern gradient mesh style, smooth color transitions, vibrant aurora-like blends, glassmorphism-inspired. Rich color depth, fluid shapes, contemporary SaaS aesthetic.',
  pixel: 'Retro pixel art style, crisp square pixels, 16-bit era aesthetic, nostalgic gaming look. Clear pixel grid, limited palette, chunky details.',
};

app.post('/api/branding/generate-sticker', async (req, res) => {
  const { prompt, category, tone, color1, color2 } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

  try {
    const catDesc = STICKER_CATEGORIES[category] || STICKER_CATEGORIES.icon;
    const toneDesc = STICKER_TONES[tone] || STICKER_TONES.flat;
    const c1 = color1 || '#ffffff';
    const c2 = color2 || '';

    const fullPrompt = [
      `Create ${catDesc} of: ${prompt}.`,
      `Art style: ${toneDesc}`,
      `Color palette: Use ${c1} as the primary color${c2 ? ` and ${c2} as the secondary accent color` : ''}. Keep colors cohesive and harmonious.`,
      'CRITICAL: The image MUST have a completely empty/transparent background. NO background color, NO backdrop, NO ground plane, NO shadow on ground. The subject must float isolated on nothing.',
      'Quality: High-resolution, crisp edges, professional design quality suitable for premium marketing materials. 512x512 PNG.',
    ].join(' ');

    console.log('[GEMINI-STICKER] Generating:', fullPrompt);

    const geminiRes = await fetch(GEMINI_IMAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('[GEMINI-STICKER] API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erreur API Gemini', details: data });
    }

    const candidates = data.candidates;
    if (!candidates || !candidates[0] || !candidates[0].content || !candidates[0].content.parts) {
      return res.status(500).json({ error: 'Reponse Gemini invalide' });
    }

    const parts = candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      return res.status(500).json({ error: 'Aucune image generee' });
    }

    const { mimeType, data: base64Data } = imagePart.inlineData;
    const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/webp' ? '.webp' : '.png';
    const filename = 'sticker-' + Date.now() + '.png';
    const filePath = path.join(BRANDING_DIR, filename);
    const rawBuffer = Buffer.from(base64Data, 'base64');

    // Remove white/light background — make near-white pixels transparent
    try {
      const image = sharp(rawBuffer).ensureAlpha();
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      const { width, height, channels } = info;

      // Process each pixel: if close to white, make transparent
      for (let i = 0; i < data.length; i += channels) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Threshold: if all RGB > 230 → fully transparent
        // If all RGB > 200 → semi-transparent (fade out)
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0; // fully transparent
        } else if (r > 200 && g > 200 && b > 200) {
          // Gradual fade: the whiter it is, the more transparent
          const avg = (r + g + b) / 3;
          const alpha = Math.round(255 * (1 - (avg - 200) / 55));
          data[i + 3] = Math.min(data[i + 3], alpha);
        }
      }

      const processed = await sharp(data, { raw: { width, height, channels } })
        .png()
        .toBuffer();
      fs.writeFileSync(filePath, processed);
      console.log('[GEMINI-STICKER] Saved (bg removed):', filename);
    } catch (sharpErr) {
      console.warn('[GEMINI-STICKER] Sharp processing failed, saving raw:', sharpErr.message);
      fs.writeFileSync(filePath, rawBuffer);
    }

    const url = '/uploads/branding/' + filename;
    res.json({ success: true, url, filename });
  } catch (err) {
    console.error('[GEMINI-STICKER] Error:', err);
    res.status(500).json({ error: 'Erreur generation sticker', message: err.message });
  }
});

// ===== API — SVG ANIMATION GENERATION (Gemini 3.1 Pro) =====

const GEMINI_SVG_MODEL = 'gemini-3.1-pro-preview';
const GEMINI_SVG_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_SVG_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SVG_ANIM_STYLES = {
  organic: 'Organic, smooth, fluid motion with ease-in-out transitions. Natural growth-like animations, gentle breathing effects.',
  geometric: 'Precise geometric transformations, clean rotations, sharp scaling. Mathematical precision with snappy cubic-bezier easing.',
  playful: 'Bouncy spring-like motion, overshoot effects, squash and stretch. Fun elastic easing with personality.',
  minimal: 'Subtle, elegant micro-animations. Barely perceptible motion that adds life without distraction. Fade and gentle translate only.',
  energetic: 'Fast, dynamic keyframe sequences. Pulse, shake, spin, neon flicker. High energy, attention-grabbing.',
  loop: 'Seamlessly looping infinite animation. Hypnotic, meditative continuous motion. Perfect cycle with no visible restart.',
};

const SVG_ANIM_TYPES = {
  illustration: 'an animated illustration/scene',
  icon: 'an animated icon or symbol',
  logo: 'an animated logo/logotype element',
  pattern: 'an animated repeating pattern or texture',
  decoration: 'an animated decorative element/ornament',
  infographic: 'an animated data visualization or infographic element',
};

app.post('/api/branding/generate-svg-animation', async (req, res) => {
  const { prompt, style, type, color1, color2, bgColor } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

  try {
    const styleDesc = SVG_ANIM_STYLES[style] || SVG_ANIM_STYLES.organic;
    const typeDesc = SVG_ANIM_TYPES[type] || SVG_ANIM_TYPES.illustration;
    const c1 = color1 || '#c4622a';
    const c2 = color2 || '#e8a87c';
    const bg = bgColor || 'transparent';

    const fullPrompt = [
      `Generate a complete, self-contained animated SVG of ${typeDesc}: "${prompt}".`,
      `Animation style: ${styleDesc}`,
      `Color palette: primary ${c1}, secondary ${c2}, background ${bg === 'transparent' ? 'none (transparent)' : bg}.`,
      `REQUIREMENTS:`,
      `- Output ONLY valid SVG code, starting with <svg and ending with </svg>. No markdown, no explanation, no backticks.`,
      `- The SVG must have viewBox="0 0 400 400" and width="400" height="400".`,
      `- Use CSS animations inside a <style> tag within the SVG (keyframes + animation properties).`,
      `- Animations must be smooth, performant, and use transform/opacity when possible.`,
      `- Make animations loop infinitely (animation-iteration-count: infinite) unless a hover interaction is specified.`,
      `- Include hover interactions where relevant (e.g., scale up on hover, color shift on hover).`,
      `- Use clean, minimal SVG paths. Avoid excessive complexity. Keep the total SVG code UNDER 4000 characters.`,
      `- The SVG must be self-contained — no external dependencies or fonts.`,
      `- Ensure the SVG renders correctly when embedded directly in HTML.`,
      `- Make it visually appealing but CONCISE. Prefer simple elegant shapes over complex detailed drawings.`,
      `- CRITICAL: Keep the SVG short and complete. Do NOT generate overly complex SVGs. Simplicity is key.`,
    ].join('\n');

    console.log('[GEMINI-SVG] Generating animated SVG:', prompt);

    const geminiRes = await fetch(GEMINI_SVG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 16384,
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('[GEMINI-SVG] API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erreur API Gemini', details: data });
    }

    const candidates = data.candidates;
    if (!candidates || !candidates[0] || !candidates[0].content || !candidates[0].content.parts) {
      return res.status(500).json({ error: 'Reponse Gemini invalide' });
    }

    // Extract SVG from text response
    let svgText = '';
    for (const part of candidates[0].content.parts) {
      if (part.text) svgText += part.text;
    }

    // Clean: extract SVG tag if wrapped in markdown or extra text
    let cleanSvg = '';
    const svgMatch = svgText.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      cleanSvg = svgMatch[0];
    } else {
      // Handle truncated SVGs — if it starts with <svg but has no closing tag
      const svgStart = svgText.match(/<svg[\s\S]*/i);
      if (svgStart) {
        console.warn('[GEMINI-SVG] SVG truncated, attempting to fix by closing open tags');
        let fixed = svgStart[0];
        // Close any unclosed tags and add </svg>
        if (!fixed.includes('</svg>')) {
          // Close any open style/defs/g tags
          if (fixed.includes('<style') && !fixed.includes('</style>')) fixed += '</style>';
          if (fixed.includes('<defs') && !fixed.includes('</defs>')) fixed += '</defs>';
          const openGs = (fixed.match(/<g[\s>]/g) || []).length;
          const closeGs = (fixed.match(/<\/g>/g) || []).length;
          for (let i = 0; i < openGs - closeGs; i++) fixed += '</g>';
          fixed += '</svg>';
        }
        cleanSvg = fixed;
      } else {
        console.error('[GEMINI-SVG] No SVG found in response:', svgText.substring(0, 500));
        return res.status(500).json({ error: 'Aucun SVG valide dans la reponse' });
      }
    }

    // Save to file for persistence
    const filename = 'svg-anim-' + Date.now() + '.svg';
    const filePath = path.join(BRANDING_DIR, filename);
    fs.writeFileSync(filePath, cleanSvg, 'utf8');

    const url = '/uploads/branding/' + filename;
    console.log('[GEMINI-SVG] Saved:', filename, '(' + cleanSvg.length + ' bytes)');

    res.json({ success: true, svg: cleanSvg, url, filename });
  } catch (err) {
    console.error('[GEMINI-SVG] Error:', err);
    res.status(500).json({ error: 'Erreur generation SVG', message: err.message });
  }
});

// ===== API — BRANDING AI GENERATOR =====

const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
const GEMINI_TEXT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/branding/ai-generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

  try {
    console.log('[AI-BRANDING] Generating from prompt:', prompt);

    const systemPrompt = `Tu es un DIRECTEUR ARTISTIQUE senior d'agence PREMIUM (niveau SuperDuper).
A partir du brief, genere un design visuellement MAGNIFIQUE avec des stickers IA pour enrichir la composition.

=== REGLE N°1 : TEXTE MINIMAL ===
C'est du DESIGN GRAPHIQUE. Moins de texte = plus beau.
INTERDIT : abbreviations, symboles speciaux (°, &), mots coupes.

- headline : EXACTEMENT 2 mots percutants en francais.
  BON : "Ete Gourmand", "Offre Flash", "Web Premium"
  MAUVAIS : "Solut° Web", "L'offre du moment special", "Creez & Innovez"
- subline : 1 mot MAX.
- body : 5-8 mots MAX. UNE courte phrase.
- cta : 2 mots MAX.

=== REGLE N°2 : TAILLE ===
headlineSize : 52-66. bodySize : 12-15. Le titre doit etre GROS.

=== REGLE N°3 : STICKERS IA ===
Propose 1 a 3 stickers IA a generer et placer sur le design.
Chaque sticker a :
- prompt : description EN ANGLAIS detaillee du visuel (ex: "golden royal crown with gems and sparkles", "rocket ship launching with flame trail")
- category : icon, badge, illustration, 3d, mascot, abstract, emoji, logo
- tone : flat, glossy, neon, watercolor, line, isometric, gradient, pixel
- x : position horizontale en % (0-85)
- y : position verticale en % (0-85)
- size : taille en px (60-150). Plus petit = decoratif, plus grand = focal.

PENSE COMME UN DA : les stickers doivent ENRICHIR la composition, pas la surcharger.
Place-les dans les zones vides du template choisi. Choisis le tone coherent avec le style pack.

STYLE PACKS : traverse, tech, ocean, neonpop, light, sunset, corporate, creative
TEMPLATES : minimal, bold, gradient, split, editorial, glass, neon, promo, quote, duotone, geometric, blobs, cards, magazine, poster, layered

JSON UNIQUEMENT :
{
  "headline": "DEUX mots",
  "subline": "UN mot",
  "body": "5-8 mots max",
  "cta": "2 mots",
  "stylePack": "cle",
  "template": "cle",
  "headlineSize": 58,
  "bodySize": 14,
  "headlineWeight": "800",
  "headlineCase": "none ou uppercase",
  "headlineAlign": "left ou center",
  "showBorder": true ou false,
  "showGrain": false,
  "stickers": [
    { "prompt": "description anglais", "category": "icon", "tone": "flat", "x": 70, "y": 10, "size": 90 }
  ]
}`;

    const geminiRes = await fetch(GEMINI_TEXT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\nBrief: ' + prompt }] }
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('[AI-BRANDING] API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erreur API Gemini', details: data });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'Reponse Gemini vide' });
    }

    const result = JSON.parse(text);
    console.log('[AI-BRANDING] Generated:', result);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[AI-BRANDING] Error:', err);
    res.status(500).json({ error: 'Erreur lors de la generation IA', message: err.message });
  }
});

// Scrape a URL and propose campaign ideas
app.post('/api/branding/ai-scrape-ideas', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  try {
    console.log('[AI-SCRAPE] Scraping:', url);
    const scraped = await scrapeWebsite(url);

    let scrapedContext = '';
    if (scraped.success) {
      scrapedContext = `
CONTENU SCRAPPE DU SITE :
URL : ${url}
Titre : ${scraped.title || '(vide)'}
Description : ${scraped.metaDesc || '(vide)'}
Mots cles : ${scraped.metaKeywords || '(aucun)'}
Fonctionnalites : ${scraped.techSignals.join(', ') || '(aucune)'}
Pages visibles : ${scraped.navLinks.join(', ') || '(non detectees)'}
Couleurs detectees : ${scraped.dominantColors.join(', ') || '(aucune)'}
Texte visible (extrait) : ${scraped.textContent.substring(0, 2000)}
`;
    } else {
      scrapedContext = `Le scraping a echoue (${scraped.error}). Base-toi sur l'URL : ${url}`;
    }

    const systemPrompt = `Tu es un DIRECTEUR ARTISTIQUE senior d'une agence PREMIUM (niveau SuperDuper, Canva Pro templates).
Tu crees des visuels publicitaires MAGNIFIQUES a partir du contenu d'un site web.

=== REGLE N°1 : TEXTE MINIMAL — C'EST DU DESIGN, PAS UN ARTICLE ===

INTERDIT : abbreviations (pas de °, pas de &), mots coupes, symboles speciaux.
Le texte doit etre des VRAIS mots francais lisibles et percutants.

- headline : EXACTEMENT 2 mots. Pas 1, pas 3. DEUX mots.
  BONS exemples : "Votre Digital", "Web Premium", "Creez Plus", "Impact Web"
  MAUVAIS : "Solut° Digitales", "Solutions & Web", "Le meilleur du digital"

- subline : 1 mot MAXIMUM. Un seul mot evocateur.
  BONS exemples : "Excellence", "Maintenant", "Studio", "Ensemble"

- body : DEPEND DU FORMAT (voir regle 2). Court et percutant.
  BON : "Votre presence en ligne, reinventee."
  MAUVAIS : "Nous creons des solutions digitales sur-mesure pour votre entreprise locale."

- cta : 2 mots MAX.
  BONS exemples : "Decouvrir", "Nous contacter", "Voir plus"

=== REGLE N°2 : TAILLES ET LONGUEURS PAR FORMAT ===

BANNER / COVER / LINKEDIN (formats larges) :
  - headlineSize : 58-68
  - bodySize : 14
  - body : 5-7 mots MAX ou "" (vide = plus elegant)
  - headlineAlign : "left"
  - Templates : split, editorial, minimal, magazine, gradient

POST (format carre 1080x1080) :
  - headlineSize : 52-64
  - bodySize : 15
  - body : 6-8 mots MAX
  - headlineAlign : "center"
  - Templates : bold, glass, neon, promo, blobs, cards, poster, geometric

STORY / PORTRAIT (formats verticaux) :
  - headlineSize : 48-58
  - bodySize : 12
  - body : 4-6 mots MAX. Sur vertical, MOINS de texte = MIEUX.
  - headlineAlign : "center"
  - Templates : gradient, glass, blobs, cards, bold, neon, layered

=== REGLE N°3 : VARIETE OBLIGATOIRE ===
- 6 templates DIFFERENTS
- Au moins 4 style packs differents
- Au moins 3 formats differents parmi : post, story, banner, linkedin, portrait, cover
- Alterner headlineCase "none" et "uppercase"

STYLE PACKS :
- traverse : cuivre/ambre sur fond sombre
- tech : violet electrique sur noir
- ocean : bleu ciel sur marine
- neonpop : cyan + rose neon sur noir
- light : gris sur blanc casse
- sunset : orange + rose sur bordeaux sombre
- corporate : bleu sur slate fonce
- creative : violet + rose sur pourpre sombre

TEMPLATES : minimal, bold, gradient, split, editorial, glass, neon, promo, quote, duotone, geometric, blobs, cards, magazine, poster, layered

${scrapedContext}

JSON UNIQUEMENT :
{
  "business": { "name": "...", "industry": "...", "vibe": "3-4 mots" },
  "ideas": [
    {
      "title": "Titre listing",
      "type": "Type visuel",
      "description": "1 phrase utilisateur",
      "headline": "DEUX mots",
      "subline": "UN mot",
      "body": "court selon format",
      "cta": "2 mots max",
      "format": "post|story|banner|cover|portrait|linkedin",
      "stylePack": "cle",
      "template": "cle",
      "headlineSize": 58,
      "bodySize": 14,
      "headlineWeight": "800",
      "headlineCase": "none|uppercase",
      "headlineAlign": "left|center",
      "showBorder": true,
      "showGrain": false
    }
  ]
}`;

    const geminiRes = await fetch(GEMINI_TEXT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] }
        ],
        generationConfig: {
          temperature: 1.0,
          topP: 0.95,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('[AI-SCRAPE] API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erreur API Gemini', details: data });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'Reponse Gemini vide' });
    }

    const result = JSON.parse(text);
    console.log('[AI-SCRAPE] Done:', url, '|', result.ideas?.length, 'ideas');
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[AI-SCRAPE] Error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'analyse', message: err.message });
  }
});

app.post('/api/branding/ai-improve-prompt', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

  try {
    const systemPrompt = `Tu es un expert en direction artistique et copywriting pour les reseaux sociaux.
L'utilisateur te donne une idee brute pour une publication. Ameliore son prompt en le rendant plus precis et inspirant.

Regles :
- Garde la meme intention
- Ajoute des details sur le ton, l'audience cible, le style visuel souhaite
- Reste concis (2-3 phrases max)
- Ecris en francais
- Reponds UNIQUEMENT avec le prompt ameliore, sans guillemets, sans explication`;

    const geminiRes = await fetch(GEMINI_TEXT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\nPrompt original: ' + prompt }] }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
        },
      }),
    });

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'Reponse Gemini vide' });
    }

    res.json({ success: true, improved: text.trim() });
  } catch (err) {
    console.error('[AI-IMPROVE] Error:', err);
    res.status(500).json({ error: 'Erreur', message: err.message });
  }
});

// ===== API — BRANDING IMAGES =====

const brandingUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, BRANDING_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      const name = file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
      cb(null, name + '-' + Date.now() + ext);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|gif|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Format image non supporte'));
  }
});

// Upload branding image
app.post('/api/branding/upload', brandingUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoye' });
  const url = '/uploads/branding/' + req.file.filename;
  res.json({ success: true, url, filename: req.file.filename });
});

// List branding images
app.get('/api/branding/images', (req, res) => {
  try {
    const files = fs.readdirSync(BRANDING_DIR)
      .filter(f => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(BRANDING_DIR, f));
        return {
          filename: f,
          url: '/uploads/branding/' + f,
          size: stat.size,
          created: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json({ images: files });
  } catch (err) {
    res.json({ images: [] });
  }
});

// Delete branding image
app.delete('/api/branding/images/:filename', (req, res) => {
  const filename = req.params.filename.replace(/[^a-zA-Z0-9_.\-]/g, '');
  const filePath = path.join(BRANDING_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Image introuvable' });
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ===== API — BRANDING DESIGNS (PUBS) =====

// Upload a base64 bgImage and return a server URL
app.post('/api/branding/upload-base64', (req, res) => {
  const { data, mimeType } = req.body;
  if (!data) return res.status(400).json({ error: 'Donnees manquantes' });
  try {
    const ext = (mimeType || 'image/png').includes('jpeg') ? '.jpg' : (mimeType || '').includes('webp') ? '.webp' : '.png';
    const filename = 'bg-' + Date.now() + ext;
    const filePath = path.join(BRANDING_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    res.json({ success: true, url: '/uploads/branding/' + filename });
  } catch (err) {
    res.status(500).json({ error: 'Erreur upload' });
  }
});

// List all saved pubs
app.get('/api/brandings', (req, res) => {
  res.json({ brandings: brandingsDb.getAllBrandings() });
});

// Get a single pub
app.get('/api/brandings/:id', (req, res) => {
  const pub = brandingsDb.getBrandingById(req.params.id);
  if (!pub) return res.status(404).json({ error: 'Pub introuvable' });
  res.json(pub);
});

// Create a new pub
app.post('/api/brandings', (req, res) => {
  const pub = brandingsDb.createBranding(req.body);
  res.json(pub);
});

// Update (auto-save) — PUT and POST both accepted (POST for sendBeacon)
app.put('/api/brandings/:id', (req, res) => {
  const updated = brandingsDb.updateBranding(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Pub introuvable' });
  res.json(updated);
});
app.post('/api/brandings/:id', (req, res) => {
  const updated = brandingsDb.updateBranding(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Pub introuvable' });
  res.json(updated);
});

// Delete a pub
app.delete('/api/brandings/:id', (req, res) => {
  brandingsDb.deleteBranding(req.params.id);
  conversationsDb.deleteConversation(req.params.id);
  res.json({ success: true });
});

// ---- Conversation routes (per pub) ----
app.get('/api/conversations/:pubId', (req, res) => {
  const messages = conversationsDb.getConversation(req.params.pubId);
  res.json({ messages });
});

app.delete('/api/conversations/:pubId', (req, res) => {
  conversationsDb.deleteConversation(req.params.pubId);
  res.json({ success: true });
});

// ============================================================
// CREATIVE AGENT — Voice-powered AI partner for branding studio
// Uses gpt-5-mini-2025-08-07 with OpenAI Responses API
// ============================================================

const AGENT_TOOLS = [
  {
    type: 'function',
    name: 'setTemplate',
    description: 'Change le template du design. Templates disponibles: minimal, bold, gradient, split, editorial, glass, neon, promo, quote, duotone, geometric, typewriter, blobs, cards, grid-pattern, magazine, poster, layered',
    parameters: {
      type: 'object',
      properties: {
        template: { type: 'string', description: 'Nom du template' }
      },
      required: ['template']
    }
  },
  {
    type: 'function',
    name: 'setStylePack',
    description: 'Applique un pack de style prédéfini qui change les couleurs et polices. Packs: traverse (La Traverse, terracotta), tech (Tech Purple), ocean (Ocean Blue), neonpop (Neon Pop, cyan/rose), light (Minimal Light), sunset (Sunset, orange/rose), corporate (Corporate, bleu), creative (Creative, violet/rose)',
    parameters: {
      type: 'object',
      properties: {
        pack: { type: 'string', description: 'Nom du pack de style' }
      },
      required: ['pack']
    }
  },
  {
    type: 'function',
    name: 'setColors',
    description: 'Change une ou plusieurs couleurs du design. Les couleurs doivent être en format hexadécimal (#RRGGBB)',
    parameters: {
      type: 'object',
      properties: {
        bgColor: { type: 'string', description: 'Couleur de fond (hex)' },
        textColor: { type: 'string', description: 'Couleur du texte (hex)' },
        accentColor: { type: 'string', description: 'Couleur accent principale (hex)' },
        accentColor2: { type: 'string', description: 'Couleur accent secondaire (hex)' }
      }
    }
  },
  {
    type: 'function',
    name: 'setText',
    description: 'Change le texte du design — titre (headline), sous-titre (subline), corps (body) et/ou call-to-action (cta)',
    parameters: {
      type: 'object',
      properties: {
        headline: { type: 'string', description: 'Titre principal' },
        subline: { type: 'string', description: 'Sous-titre' },
        body: { type: 'string', description: 'Texte du corps' },
        cta: { type: 'string', description: 'Call-to-action' }
      }
    }
  },
  {
    type: 'function',
    name: 'setTypography',
    description: 'Change la typographie du titre ou du corps. Polices disponibles: Playfair Display, DM Serif Display, Libre Baskerville, Inter, Instrument Sans, Bebas Neue, Poppins, Oswald, Lora, Montserrat, Raleway, Space Mono',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', enum: ['headline', 'body'], description: 'Quel texte modifier' },
        font: { type: 'string', description: 'Nom de la police' },
        size: { type: 'number', description: 'Taille en px (headline: 20-80, body: 10-30)' },
        weight: { type: 'string', description: 'Graisse: 300, 400, 500, 600, 700, 800, 900' },
        align: { type: 'string', enum: ['left', 'center', 'right'], description: 'Alignement du titre' },
        textCase: { type: 'string', enum: ['none', 'uppercase', 'lowercase', 'capitalize'], description: 'Transformation du texte' }
      },
      required: ['target']
    }
  },
  {
    type: 'function',
    name: 'toggleEffect',
    description: 'Active ou désactive un effet visuel sur le design',
    parameters: {
      type: 'object',
      properties: {
        effect: { type: 'string', enum: ['grain', 'vignette', 'border', 'logo', 'outline', 'gradient'], description: 'Effet à basculer' },
        enabled: { type: 'boolean', description: 'Activer (true) ou désactiver (false)' }
      },
      required: ['effect', 'enabled']
    }
  },
  {
    type: 'function',
    name: 'setEffectValues',
    description: "Règle l'intensité des effets de texte (ombre, glow)",
    parameters: {
      type: 'object',
      properties: {
        shadow: { type: 'number', description: 'Intensité ombre (0-30)' },
        glow: { type: 'number', description: 'Intensité glow néon (0-50)' }
      }
    }
  },
  {
    type: 'function',
    name: 'setGradient',
    description: 'Configure le fond en dégradé',
    parameters: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Activer le dégradé' },
        start: { type: 'string', description: 'Couleur de début (hex)' },
        end: { type: 'string', description: 'Couleur de fin (hex)' },
        angle: { type: 'number', description: 'Angle du dégradé (0-360)' }
      },
      required: ['enabled']
    }
  },
  {
    type: 'function',
    name: 'setFormat',
    description: 'Change le format/ratio du design',
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['post', 'story', 'landscape', 'banner', 'square'], description: 'Format: post (1080x1080), story (1080x1920), landscape (1920x1080), banner (1200x628), square (1080x1080)' }
      },
      required: ['format']
    }
  },
  {
    type: 'function',
    name: 'generateBackgroundImage',
    description: "Génère une image de fond avec l'IA Gemini à partir d'un prompt descriptif. Utilise cette fonction quand l'utilisateur veut un fond personnalisé, une photo, une texture ou une illustration en arrière-plan.",
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: "Description détaillée de l'image à générer en anglais. Sois descriptif et précis." }
      },
      required: ['prompt']
    }
  },
  {
    type: 'function',
    name: 'generateSticker',
    description: "Génère un sticker/image flottant avec l'IA et l'ajoute au design. Bon pour des éléments décoratifs, icônes ou illustrations.",
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Description du sticker à générer (en anglais, détaillé)' }
      },
      required: ['prompt']
    }
  },
  {
    type: 'function',
    name: 'generateSvgAnimation',
    description: "Génère une animation SVG animée (par ex: vagues, battements de cœur, bateau qui navigue) et l'ajoute comme sticker",
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: "Description de l'animation SVG souhaitée" }
      },
      required: ['prompt']
    }
  },
  {
    type: 'function',
    name: 'exportDesign',
    description: 'Exporte/télécharge le design actuel en image PNG',
    parameters: { type: 'object', properties: {} }
  },
  {
    type: 'function',
    name: 'newDesign',
    description: 'Crée un nouveau design vierge',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom du nouveau design' }
      }
    }
  },
  {
    type: 'function',
    name: 'resetDesign',
    description: 'Réinitialise le design aux valeurs par défaut',
    parameters: { type: 'object', properties: {} }
  },
  {
    type: 'function',
    name: 'undoRedo',
    description: 'Annule ou rétablit la dernière action',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['undo', 'redo'], description: 'Annuler ou rétablir' }
      },
      required: ['action']
    }
  },
  {
    type: 'function',
    name: 'setBgImageSettings',
    description: "Règle l'opacité et le flou de l'image de fond",
    parameters: {
      type: 'object',
      properties: {
        opacity: { type: 'number', description: 'Opacité (0-100)' },
        blur: { type: 'number', description: 'Flou en px (0-20)' }
      }
    }
  },
  {
    type: 'function',
    name: 'addSticker',
    description: "Ajoute un élément décoratif prédéfini (badge, carte, forme, icône, cadre) sur le canvas. Éléments disponibles : BADGES: pill-gradient, pill-outline, tag-label, badge-circle, chip-duo | CARTES: glass-card-sm, glass-card-lg, stat-card | FORMES: blob-accent, blob-gradient, circle-outline, square-rotated, line-h, line-v, dots-grid | ICÔNES: app-icon, app-icon-glass, diamond, star-4 | CADRES: phone-frame, browser-frame, bracket-tl, rounded-grid. Ils utilisent automatiquement les couleurs accent du design.",
    parameters: {
      type: 'object',
      properties: {
        sticker: { type: 'string', description: "Clé du sticker (ex: pill-gradient, glass-card-sm, blob-accent, phone-frame, star-4)" },
        x: { type: 'number', description: 'Position horizontale en % (0-90), 50 = centre' },
        y: { type: 'number', description: 'Position verticale en % (0-90), 50 = centre' },
        layer: { type: 'string', enum: ['above', 'below'], description: 'Calque: above (devant le texte) ou below (derrière)' }
      },
      required: ['sticker']
    }
  },
  {
    type: 'function',
    name: 'clearStickers',
    description: 'Supprime tous les stickers/éléments décoratifs du canvas',
    parameters: { type: 'object', properties: {} }
  },
  {
    type: 'function',
    name: 'setBorderStyle',
    description: "Change le style de la bordure du design. Styles: thin (1px), classic (2px), thick (4px), double, dashed, inset",
    parameters: {
      type: 'object',
      properties: {
        style: { type: 'string', enum: ['thin', 'classic', 'thick', 'double', 'dashed', 'inset'], description: 'Style de bordure' },
        color: { type: 'string', description: 'Couleur de bordure (hex). Si vide, utilise la couleur accent' },
        offset: { type: 'number', description: "Espacement de la bordure depuis le bord (0-50px, défaut 12)" },
        show: { type: 'boolean', description: 'Afficher ou masquer la bordure' }
      }
    }
  },
  {
    type: 'function',
    name: 'setSublineStyle',
    description: "Change le style du sous-titre. Styles: text (texte simple), badge (fond coloré rectangulaire), pill (fond coloré arrondi), separator (ligne sous le texte)",
    parameters: {
      type: 'object',
      properties: {
        style: { type: 'string', enum: ['text', 'badge', 'pill', 'separator'], description: 'Style du sous-titre' }
      },
      required: ['style']
    }
  },
  {
    type: 'function',
    name: 'setCtaStyle',
    description: "Change le style du call-to-action (CTA). Styles: text (lien simple), filled (bouton rempli), outline (bouton contour), pill (bouton arrondi)",
    parameters: {
      type: 'object',
      properties: {
        style: { type: 'string', enum: ['text', 'filled', 'outline', 'pill'], description: 'Style du CTA' },
        bgColor: { type: 'string', description: 'Couleur de fond du bouton (hex)' },
        textColor: { type: 'string', description: 'Couleur du texte du bouton (hex)' },
        radius: { type: 'number', description: 'Rayon des coins en px (-1 = défaut)' }
      }
    }
  },
  {
    type: 'function',
    name: 'setHeadlineDecoration',
    description: "Ajoute une décoration visuelle au titre. Décorations: none (aucune), underline (souligné accent), bar (barre sous le titre), double (double souligné), highlight (surlignage fond accent)",
    parameters: {
      type: 'object',
      properties: {
        decoration: { type: 'string', enum: ['none', 'underline', 'bar', 'double', 'highlight'], description: 'Type de décoration' }
      },
      required: ['decoration']
    }
  },
  {
    type: 'function',
    name: 'setPattern',
    description: "Ajoute un motif de fond (pattern) subtil au design. Motifs: none, dots, lines, cross, diagonal",
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', enum: ['none', 'dots', 'lines', 'cross', 'diagonal'], description: 'Type de motif' },
        opacity: { type: 'number', description: 'Opacité du motif (0-100, défaut 15)' },
        scale: { type: 'number', description: 'Taille du motif en px (5-50, défaut 20)' }
      },
      required: ['pattern']
    }
  },
  {
    type: 'function',
    name: 'setOverlay',
    description: "Ajoute un overlay (voile) coloré sur l'image de fond. Modes: solid (uniforme), top (dégradé du haut), bottom (dégradé du bas), radial (vignette circulaire)",
    parameters: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'Couleur de overlay (hex)' },
        opacity: { type: 'number', description: 'Opacité (0-100, 0 = désactivé)' },
        mode: { type: 'string', enum: ['solid', 'top', 'bottom', 'radial'], description: 'Mode de overlay' }
      }
    }
  },
  {
    type: 'function',
    name: 'setContentAlign',
    description: "Change l'alignement vertical du contenu sur le canvas",
    parameters: {
      type: 'object',
      properties: {
        align: { type: 'string', enum: ['start', 'center', 'end'], description: 'Alignement: start (haut), center (milieu), end (bas)' }
      },
      required: ['align']
    }
  },
  {
    type: 'function',
    name: 'toggleElement',
    description: "Affiche ou masque un élément du design (sous-titre, corps, CTA, logo)",
    parameters: {
      type: 'object',
      properties: {
        element: { type: 'string', enum: ['subline', 'body', 'cta', 'logo'], description: 'Élément à basculer' },
        show: { type: 'boolean', description: 'Afficher (true) ou masquer (false)' }
      },
      required: ['element', 'show']
    }
  }
];

function buildDesignStateDescription(ds) {
  if (!ds) return '';
  return `
ÉTAT ACTUEL DU DESIGN QUE TU VOIS :
- Template: ${ds.template || 'minimal'}
- Format: ${ds.format?.label || 'Post'} (${ds.format?.w}x${ds.format?.h})
- Titre: "${ds.headline || ''}"
- Sous-titre: "${ds.subline || ''}"
- Corps: "${ds.body || ''}"
- CTA: "${ds.cta || ''}"
- Couleur fond: ${ds.bgColor || '#1a1714'}
- Couleur texte: ${ds.textColor || '#f0e8dc'}
- Accent: ${ds.accentColor || '#c4622a'}
- Accent 2: ${ds.accentColor2 || '#e8a87c'}
- Style pack actif: ${ds.stylePack || 'aucun'}
- Police titre: ${ds.typoHeadline?.font || 'Playfair Display'}
- Police corps: ${ds.typoBody?.font || 'Libre Baskerville'}
- Taille titre: ${ds.typoHeadline?.size || 48}px
- Logo visible: ${ds.showLogo ? 'oui' : 'non'}
- Bordure: ${ds.showBorder ? 'oui' : 'non'}
- Grain: ${ds.showGrain ? 'oui' : 'non'}
- Vignette: ${ds.showVignette ? 'oui' : 'non'}
- Image de fond: ${ds.bgImage ? 'oui' : 'non'}
- Gradient: ${ds.gradient?.enabled ? 'oui (' + ds.gradient.start + ' → ' + ds.gradient.end + ')' : 'non'}
- Ombre texte: ${ds.fxShadow || 0}
- Glow: ${ds.fxGlow || 0}
- Outline: ${ds.fxOutline ? 'oui' : 'non'}
- Nombre de stickers: ${ds.stickers?.length || 0}
- Style bordure: ${ds.borderStyle || 'classic'}
- Couleur bordure: ${ds.borderColor || '(utilise accent)'}
- Style sous-titre: ${ds.sublineStyle || 'text'}
- Style CTA: ${ds.ctaStyle || 'text'}
- Décoration titre: ${ds.headlineDecoration || 'none'}
- Motif de fond: ${ds.bgPattern || 'none'}
- Overlay: ${ds.bgOverlayOpacity > 0 ? 'oui (' + ds.bgOverlayMode + ', ' + ds.bgOverlayOpacity + '%)' : 'non'}
- Alignement contenu: ${ds.contentAlign || 'start'}
- Sous-titre visible: ${ds.showSubline !== false ? 'oui' : 'non'}
- Corps visible: ${ds.showBody !== false ? 'oui' : 'non'}
- CTA visible: ${ds.showCta !== false ? 'oui' : 'non'}`;
}

function buildSystemPrompt(designState) {
  return `Tu es l'assistant créatif de La Traverse Studio — un partenaire de design qui aide à créer des publications pour les réseaux sociaux.

PERSONNALITÉ :
- Tu es un directeur artistique passionné, enthousiaste mais professionnel
- Tu parles en français, de manière naturelle et chaleureuse
- Tu donnes des avis créatifs argumentés
- Tu proposes des idées quand on te demande, tu ne te contentes pas d'exécuter
- Tu peux discuter de design, de couleurs, de tendances, de branding
- Quand tu exécutes une action, tu expliques brièvement pourquoi ce choix est bon
- Sois concis dans tes réponses (2-3 phrases max sauf si on te demande plus)

CONTEXTE :
Tu travailles sur le Studio Branding de La Traverse, un outil de création de posts pour réseaux sociaux.
L'utilisateur voit un canvas avec un design en temps réel. Toi aussi tu vois l'état du design.
${buildDesignStateDescription(designState)}

RÈGLES :
- Si l'utilisateur demande quelque chose de vague ("fais-moi un truc cool"), propose d'abord, puis exécute si il valide
- Si l'utilisateur veut discuter sans agir, discute — n'appelle pas de fonction
- Tu peux enchaîner plusieurs actions pour une demande complexe (ex: "fais un design tech neon" → setTemplate neon + setStylePack tech)
- Pour les couleurs, traduis les noms en hex (rouge = #e53e3e, bleu = #3b82f6, vert = #22c55e, etc.)
- Pour les images de fond, traduis le prompt en anglais pour Gemini
- Quand tu génères du texte pour le design, adapte-le au contexte de La Traverse (studio digital à Marseille)`;
}

// Helper: extract text and actions from Responses API output
function parseResponseOutput(output) {
  let text = '';
  const actions = [];

  if (!output || !Array.isArray(output)) return { text, actions };

  for (const item of output) {
    if (item.type === 'message' && item.content) {
      for (const block of item.content) {
        if (block.type === 'output_text' && block.text) {
          text += block.text;
        }
      }
    } else if (item.type === 'function_call') {
      try {
        actions.push({
          id: item.call_id || item.id,
          function: item.name,
          arguments: typeof item.arguments === 'string' ? JSON.parse(item.arguments) : item.arguments,
        });
      } catch (e) {
        console.error('[Agent] Failed to parse function_call:', e);
      }
    }
  }

  return { text, actions };
}

app.post('/api/agent/chat', async (req, res) => {
  const { message, designState, pubId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message requis' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY non configurée' });
  }

  // Load conversation history from storage (one conversation per pub)
  const conversationHistory = pubId ? conversationsDb.getConversation(pubId) : [];

  // Build input messages for Responses API
  const input = [];

  // System instruction
  input.push({ role: 'system', content: buildSystemPrompt(designState) });

  // Add persisted conversation history (last 20 messages)
  const recent = conversationHistory.slice(-20);
  for (const msg of recent) {
    input.push({ role: msg.role, content: msg.content });
  }

  // Add current user message
  input.push({ role: 'user', content: message });

  try {
    // Call OpenAI Responses API with gpt-5-mini-2025-08-07
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        input,
        tools: AGENT_TOOLS,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Agent] OpenAI Responses API error:', response.status, err);
      return res.status(500).json({ error: 'Erreur OpenAI: ' + response.status });
    }

    const data = await response.json();

    // Parse the response output (Responses API format)
    const { text, actions } = parseResponseOutput(data.output);

    // If there are function calls but no text, make a follow-up call for a natural description
    let finalText = text;
    if (actions.length > 0 && !finalText) {
      const actionDescs = actions.map(a => `${a.function}(${JSON.stringify(a.arguments)})`).join(', ');

      const followUpInput = [
        ...input,
        { role: 'assistant', content: `J'exécute les actions suivantes : ${actionDescs}` },
        { role: 'user', content: 'Décris brièvement ce que tu fais en 1-2 phrases, de manière naturelle et enthousiaste. Ne mentionne pas les noms de fonctions techniques.' },
      ];

      const followUp = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          input: followUpInput,
        }),
      });

      if (followUp.ok) {
        const followUpData = await followUp.json();
        const { text: followUpText } = parseResponseOutput(followUpData.output);
        finalText = followUpText;
      }
    }

    // Persist messages to conversation (one per pub)
    if (pubId) {
      conversationsDb.addMessage(pubId, 'user', message);
      const assistantContent = finalText + (actions.length > 0
        ? '\n[Actions: ' + actions.map(a => a.function).join(', ') + ']'
        : '');
      conversationsDb.addMessage(pubId, 'assistant', assistantContent);
    }

    res.json({
      text: finalText,
      actions,
      usage: data.usage || null,
    });

  } catch (err) {
    console.error('[Agent] Error:', err);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

// ============================================================
// WebSocket Relay — OpenAI Realtime API
// Proxies ws:// from browser to wss://api.openai.com/v1/realtime
// Server-side: injects session.update with tools + instructions
// Client sends { type: 'init', designState: {...} } first
// ============================================================

function buildRealtimeTools() {
  // Same tools as AGENT_TOOLS but formatted for Realtime API
  return AGENT_TOOLS.map(t => ({
    type: 'function',
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}

function buildRealtimeInstructions(designState) {
  const stateDesc = buildDesignStateDescription(designState);
  return `Tu es l'assistant créatif vocal de La Traverse Studio — un partenaire de design qui aide à créer des publications pour les réseaux sociaux.

PERSONNALITÉ :
- Tu es un directeur artistique passionné, enthousiaste mais professionnel
- Tu parles TOUJOURS en français, de manière naturelle et chaleureuse
- Tu donnes des avis créatifs argumentés
- Tu proposes des idées quand on te demande, tu ne te contentes pas d'exécuter
- Tu peux discuter de design, de couleurs, de tendances, de branding
- Quand tu exécutes une action, tu expliques brièvement pourquoi ce choix est bon
- Sois concis dans tes réponses vocales (2-3 phrases max sauf si on te demande plus)

CONTEXTE :
Tu travailles sur le Studio Branding de La Traverse, un outil de création de posts pour réseaux sociaux.
L'utilisateur voit un canvas avec un design en temps réel. Toi aussi tu vois l'état du design via les informations ci-dessous.
Tu as accès à des fonctions (tools) pour modifier le design en temps réel : changer le template, les couleurs, le texte, la typographie, les effets, générer des images de fond IA, des stickers, des animations SVG, exporter, etc.
${stateDesc}

RÈGLES :
- Si l'utilisateur demande quelque chose de vague ("fais-moi un truc cool"), propose d'abord, puis exécute si il valide
- Si l'utilisateur veut discuter sans agir, discute — n'appelle pas de fonction
- Tu peux enchaîner plusieurs actions pour une demande complexe (ex: "fais un design tech neon" → setTemplate neon + setStylePack tech + setColors)
- Pour les couleurs, traduis les noms en hex (rouge = #e53e3e, bleu = #3b82f6, vert = #22c55e, jaune = #eab308, rose = #ec4899, violet = #8b5cf6, orange = #f97316, noir = #000000, blanc = #ffffff, etc.)
- Pour les images de fond, traduis le prompt en anglais pour Gemini
- Quand tu génères du texte pour le design, adapte-le au contexte de La Traverse (studio digital à Marseille)
- IMPORTANT : tu DOIS utiliser les fonctions tools disponibles pour modifier le design. Ne décris pas ce que tu ferais — FAIS-LE en appelant les fonctions.`;
}

const wss = new WebSocketServer({ server, path: '/ws/realtime' });

wss.on('connection', (clientWs) => {
  console.log('[WS Relay] Client connected');

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    clientWs.close(1008, 'OPENAI_API_KEY not configured');
    return;
  }

  let openaiWs = null;
  let openaiReady = false;
  let sessionConfigured = false;
  let clientDesignState = null;
  const pendingMessages = [];

  function connectOpenAI() {
    const openaiUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03';
    openaiWs = new WebSocket(openaiUrl, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    openaiWs.on('open', () => {
      console.log('[WS Relay] Connected to OpenAI Realtime API');
      openaiReady = true;
      // Flush any audio messages queued while connecting
      for (const msg of pendingMessages) {
        openaiWs.send(msg);
      }
      pendingMessages.length = 0;
    });

    openaiWs.on('message', (data) => {
      const str = data.toString();

      // Intercept session.created to inject session.update with tools
      if (!sessionConfigured) {
        try {
          const parsed = JSON.parse(str);
          if (parsed.type === 'session.created') {
            console.log('[WS Relay] Session created — injecting session.update with tools + instructions');
            const sessionUpdate = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                tools: buildRealtimeTools(),
                instructions: buildRealtimeInstructions(clientDesignState),
                voice: 'echo',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'gpt-4o-mini-transcribe',
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.8,
                  prefix_padding_ms: 500,
                  silence_duration_ms: 1000,
                },
              },
            };
            openaiWs.send(JSON.stringify(sessionUpdate));
            sessionConfigured = true;
            console.log('[WS Relay] Session configured with', buildRealtimeTools().length, 'tools');
          }
        } catch (e) {
          // Not JSON or parse error — just forward
        }
      }

      // Forward everything to browser client
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(str);
      }
    });

    openaiWs.on('close', (code, reason) => {
      console.log('[WS Relay] OpenAI closed:', code, reason.toString());
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(code, reason.toString());
      }
    });

    openaiWs.on('error', (err) => {
      console.error('[WS Relay] OpenAI error:', err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1011, 'OpenAI connection error');
      }
    });
  }

  // Handle messages from browser client
  clientWs.on('message', (data) => {
    const msgStr = data.toString();

    // Intercept custom 'init' message from client with design state
    try {
      const parsed = JSON.parse(msgStr);
      if (parsed.type === 'init') {
        clientDesignState = parsed.designState || null;
        console.log('[WS Relay] Received init with design state:', clientDesignState ? 'yes' : 'no');

        // Now connect to OpenAI (we waited for init so we have the design state)
        if (!openaiWs) {
          connectOpenAI();
        }
        return; // Don't forward init to OpenAI
      }

      // Intercept design state updates
      if (parsed.type === 'design_state_update') {
        clientDesignState = parsed.designState || null;
        // Re-send session.update with new instructions
        if (openaiReady && openaiWs.readyState === WebSocket.OPEN) {
          const sessionUpdate = {
            type: 'session.update',
            session: {
              instructions: buildRealtimeInstructions(clientDesignState),
            },
          };
          openaiWs.send(JSON.stringify(sessionUpdate));
          console.log('[WS Relay] Updated session instructions with new design state');
        }
        return; // Don't forward to OpenAI
      }

      // Don't forward client session.update — server handles that
      if (parsed.type === 'session.update') {
        console.log('[WS Relay] Ignoring client session.update (server handles config)');
        return;
      }
    } catch (e) {
      // Not JSON — binary or other, just forward
    }

    // Forward everything else to OpenAI
    if (openaiReady && openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(msgStr);
    } else {
      pendingMessages.push(msgStr);
    }
  });

  clientWs.on('close', () => {
    console.log('[WS Relay] Client disconnected');
    if (openaiWs && (openaiWs.readyState === WebSocket.OPEN || openaiWs.readyState === WebSocket.CONNECTING)) {
      openaiWs.close();
    }
  });

  clientWs.on('error', (err) => {
    console.error('[WS Relay] Client error:', err.message);
    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`La Traverse running at http://0.0.0.0:${PORT}`);
});
