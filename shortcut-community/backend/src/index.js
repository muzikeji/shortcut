const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/user');
const shortcutRoutes = require('./routes/shortcut');
const interactRoutes = require('./routes/interact');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/shortcuts', shortcutRoutes);
app.use('/api/shortcuts', interactRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
