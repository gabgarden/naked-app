import app from './app';
import { initDatabase } from '../../infrastructure/database/postgres/initDb';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Naked API running on http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


