# 🚀 Guia de Deploy na VPS (Hostinger) — Naked App
# Repositório: https://github.com/gabgarden/naked-app

Guia passo a passo com todos os comandos necessários para rodar o **Naked App** na VPS ao lado dos outros projetos (`sales-system`, `blood-match`, `gps-tracking-SSE`, `garden`, etc.), seguindo a arquitetura de duas camadas de Nginx e gerenciamento de portas.

---

## 🗺️ 1. Mapeamento de Portas e Coexistência na VPS

Para não conflitar com nenhum outro projeto já hospedado na VPS, o **Naked App** utiliza a porta **`8084`** para o seu gateway Nginx interno:

| Projeto | Domínio / Função | Porta no Host VPS | Destino Interno |
|---|---|---|---|
| **garden / steelers** | Websites estáticos / 3D | `8080` | Container Next.js (:3000) |
| **sales-system** | `belezaempotes.tech` | `8081` | Container Nginx borda |
| **blood-match** | `bloodmatch.com.br` | `8082` | Container Nginx borda (:80) |
| **gps-tracking-SSE** | GPS Tracking em tempo real | `8083` | Container Nginx borda (:80) |
| ⚽ **naked-app** | **Naked App** | **`8084`** | **Container Nginx borda (:80)** |
| *Adminers / DBs* | Ferramentas administrativas | `8088`, etc. | Adminer |

---

## 🏛️ 2. Topologia de Nginx (Duas Camadas)

```
Internet / Usuários (https://naked.seudominio.com.br)
         │
         ▼
[1] NGINX DO HOST DA VPS (Portas 80 / 443)
    └── Termina SSL/TLS (Certbot / Let's Encrypt)
    └── Faz proxy reverso para http://127.0.0.1:8084
         │
         ▼
[2] NGINX DO DOCKER (Container 'naked-nginx' na porta :8084)
    ├── /api/   ──► Container Express API (http://api:3001)
    ├── /health ──► Container Express API (http://api:3001/health)
    └── /       ──► Container Next.js Web (http://web:3000)
         │
         ▼
[3] BANCO DE DADOS (Container 'naked-db')
    └── PostgreSQL 16 isolado na rede interna Docker (porta 5432 NÃO exposta na internet)
```

---

## 📋 3. Passo a Passo Completo para Rodar na VPS

### Passo 1: Conectar na VPS via SSH

```bash
ssh root@179.198.120.172
```

---

### Passo 2: Clonar ou Baixar o Repositório

Navegue até a pasta de projetos da VPS e clone o repositório:

```bash
cd /root/projects # ou o diretório onde ficam seus projetos na VPS
git clone https://github.com/gabgarden/naked-app.git
cd naked-app
```

*(Se o repositório já estiver clonado, apenas atualize:)*
```bash
git pull origin main
```

---

### Passo 3: Configurar o Arquivo `.env.production`

Crie o arquivo `.env.production` a partir do template de exemplo:

```bash
cp .env.production.example .env.production
```

Abra o arquivo para editar a senha do banco de dados:

```bash
nano .env.production
```

Defina uma senha forte em `POSTGRES_PASSWORD`:
```env
PORT=8084
POSTGRES_USER=postgres
POSTGRES_PASSWORD=DefinaUmaSenhaSuperForteAqui123!
POSTGRES_DB=naked_app
NEXT_PUBLIC_API_URL=
INTERNAL_API_URL=http://api:3001
CORS_ORIGIN=*
```
*Salve com `Ctrl + O`, `Enter` e saia com `Ctrl + X`.*

---

### Passo 4: Subir os Containers em Produção

Execute o Docker Compose com o profile de produção e as variáveis do `.env.production`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
```

#### Como verificar se os containers subiram:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Você verá:
- `naked-db` (healthy)
- `naked-api` (running)
- `naked-web` (running)
- `naked-nginx` (0.0.0.0:8084->80/tcp)

#### Testar localmente no terminal da VPS:
```bash
curl http://127.0.0.1:8084/health
# Resposta esperada: {"status":"ok","timestamp":"..."}
```

---

### Passo 5: Configurar o Nginx no Host da VPS

Crie o arquivo de configuração do site no Nginx da VPS:

```bash
sudo nano /etc/nginx/sites-available/naked.conf
```

Cole a seguinte configuração (ajuste o `server_name` para o seu domínio ou subdomínio):

```nginx
server {
    listen 80;
    server_name naked.seudominio.com.br; # <-- Coloque seu domínio ou subdomínio aqui

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8084;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```
*Salve com `Ctrl + O`, `Enter` e saia com `Ctrl + X`.*

Ative o site criando o link simbólico em `sites-enabled`:

```bash
sudo ln -s /etc/nginx/sites-available/naked.conf /etc/nginx/sites-enabled/
```

Valide a sintaxe do Nginx:
```bash
sudo nginx -t
```
*Se retornar `syntax is ok` e `test is successful`:*

Recarregue o Nginx do host:
```bash
sudo systemctl reload nginx
```

---

### Passo 6: Emitir Certificado SSL com Certbot (HTTPS Gratuito)

Com o DNS do seu domínio já apontado para o IP da VPS (`179.198.120.172`), emita o certificado SSL:

```bash
sudo certbot --nginx -d naked.seudominio.com.br
```

O Certbot irá configurar o redirecionamento automático de HTTP para HTTPS e renovar os certificados automaticamente via `certbot.timer`.

---

## 🛠️ 4. Comandos Úteis do Dia a Dia na VPS

### Ver Logs dos Serviços em Tempo Real

```bash
# Todos os containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Apenas a API
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# Apenas o Frontend Web
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f web

# Apenas o Nginx do Docker
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f nginx
```

### Reiniciar os Serviços

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### Parar os Serviços

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Atualizar a Aplicação (Após novos commits no Git)

```bash
cd /root/projects/naked-app
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Backup do Banco de Dados PostgreSQL

```bash
# Gerar dump do banco
docker exec -t naked-db pg_dump -U postgres naked_app > backup_naked_$(date +%Y%m%d_%H%M%S).sql

# Restaurar dump do banco (se necessário)
cat backup_naked_YYYYMMDD_HHMMSS.sql | docker exec -i naked-db psql -U postgres -d naked_app
```

---

## ✅ Resumo dos Arquivos Criados para Produção

- [`docker-compose.prod.yml`](file:///c:/Users/garde/Desktop/projects/bq/liga-da-pelada/docker-compose.prod.yml): Overrides de produção com Nginx gateway na porta 8084 e DB protegido.
- [`infrastructure/nginx/default.conf`](file:///c:/Users/garde/Desktop/projects/bq/liga-da-pelada/infrastructure/nginx/default.conf): Nginx de borda do container que encaminha `/api/` para a API e `/` para o Next.js.
- [`infrastructure/nginx/vps-host.conf`](file:///c:/Users/garde/Desktop/projects/bq/liga-da-pelada/infrastructure/nginx/vps-host.conf): Template pronto para colar no Nginx do host `/etc/nginx/sites-available/naked.conf`.
- [`.env.production.example`](file:///c:/Users/garde/Desktop/projects/bq/liga-da-pelada/.env.production.example): Modelo com todas as variáveis prontas.
- [`COMMANDS.md`](file:///c:/Users/garde/Desktop/projects/bq/liga-da-pelada/COMMANDS.md): Cola rápida com comandos one-liners.
