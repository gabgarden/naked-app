import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import playersRoutes from './routes/players.routes';
import peladasRoutes from './routes/peladas.routes';
import matchesRoutes from './routes/matches.routes';
import rankingRoutes from './routes/ranking.routes';

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/players', playersRoutes);
app.use('/api/peladas', peladasRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/ranking', rankingRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

export default app;
