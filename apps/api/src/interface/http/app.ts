import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import playersRoutes from './routes/players.routes';
import roundsRoutes from './routes/rounds.routes';
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
app.use('/api/rounds', roundsRoutes);
app.use('/api/peladas', roundsRoutes); // backward compatibility alias
app.use('/api/matches', matchesRoutes);
app.use('/api/ranking', rankingRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
