require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const postRoutes = require('./routes/posts.routes');
const commentRoutes = require('./routes/comments.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Sociall API is running.' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sociall API running on http://localhost:${PORT}`));
