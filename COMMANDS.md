# ⚡ Comandos Rápidos — Pelada App v2

## 💻 Desenvolvimento Local

```bash
# Rodar tudo via Docker
docker compose up --build

# Ou rodar separadamente em desenvolvimento:
npm run dev:api    # Terminal 1: Backend Express (porta 3001)
npm run dev:web    # Terminal 2: Frontend Next.js (porta 3000)
```

- **Frontend:** http://localhost:3000
- **API REST:** http://localhost:3001
- **Healthcheck:** http://localhost:3001/health
- **Adminer:** http://localhost:8080

---

## 🌐 Produção (VPS / Hostinger)

### 1. Subir a aplicação na VPS

```bash
cp .env.production.example .env.production
# edite POSTGRES_PASSWORD no .env.production

docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
```

- **Porta interna no Host da VPS:** `8084`
- **Healthcheck interno:** `curl http://127.0.0.1:8084/health`

### 2. Configurar Nginx do Host da VPS

```bash
# Copiar o template
sudo cp infrastructure/nginx/vps-host.conf /etc/nginx/sites-available/pelada.conf

# Ajustar o domínio
sudo nano /etc/nginx/sites-available/pelada.conf

# Ativar o site
sudo ln -s /etc/nginx/sites-available/pelada.conf /etc/nginx/sites-enabled/

# Testar e reiniciar
sudo nginx -t
sudo systemctl reload nginx

# Emitir SSL
sudo certbot --nginx -d pelada.seudominio.com.br
```

---

## 🔍 Monitoramento e Logs na VPS

```bash
# Ver logs de tudo
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Ver logs apenas da API
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# Ver logs do frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f web

# Reiniciar
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Parar
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

---

## 💾 Backup do Banco de Dados

```bash
# Dump do PostgreSQL
docker exec -t pelada-db pg_dump -U postgres pelada_app > backup_pelada_$(date +%Y%m%d_%H%M%S).sql
```
