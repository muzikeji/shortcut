const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const userRoutes = require('./routes/user');
const shortcutRoutes = require('./routes/shortcut');
const interactRoutes = require('./routes/interact');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/shortcuts', shortcutRoutes);
app.use('/api/shortcuts', interactRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('Serving frontend from dist/');
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
