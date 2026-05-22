import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { playerRoutes } from './routes/playerRoutes.js';
import { gameRoutes } from './routes/gameRoutes.js';
import { careerRoutes } from './routes/careerRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(
  session({
    name: 'career_quest.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'career-quest-api',
    storage: env.useMemoryStore ? 'memory-demo' : 'mariadb',
  });
});

app.use('/api/player', playerRoutes);
app.use('/api/game', gameRoutes);
app.use('/api', careerRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = status >= 500 ? 'Internal server error' : error.message;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: message });
});
