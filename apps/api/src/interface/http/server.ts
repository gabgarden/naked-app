import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Pelada API rodando em http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
});
