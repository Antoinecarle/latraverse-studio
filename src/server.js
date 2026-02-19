const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

// Page 1 — Landing immersive
app.get('/', (req, res) => {
  res.render('landing');
});

// Page 2 — Studio (parcours, about, contact, onboarding)
app.get('/studio', (req, res) => {
  res.render('studio');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`La Traverse running at http://0.0.0.0:${PORT}`);
});
