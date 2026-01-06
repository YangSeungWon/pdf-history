import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import versionsRouter from './routes/versions.js';
import diffRouter from './routes/diff.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/diff', diffRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
