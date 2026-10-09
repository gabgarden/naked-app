# ⚽ Pelada App v2

Sistema moderno e dinâmico de gestão de peladas avulsas com acompanhamento de partidas em tempo real, remanejamento dinâmico de equipes e ranking geral acumulado de atletas.

Construído sob os princípios de **Clean Architecture**, **DDD (Domain-Driven Design)** e **SOLID**, com total segregação entre **Frontend** e **Backend REST API**.

---

## 🎨 Identidade Visual & Design System

- **Paleta de Cores:** Laranja Fogo (`#F97316`) com Grafite Profundo (`#0D0F14`, `#13181F`, `#252D3D`), acentos âmbar e status dinâmicos.
- **Tipografia:** `Barlow Condensed` (títulos, placares e identidade esportiva) e `Inter` (legibilidade e interface).
- **Aparência:** Estética esportiva de alta precisão, glassmorphism, micro-animações, pódio dos artilheiros/líderes e placar de partida ao vivo com cronômetro interativo.

---

## 🏗️ Arquitetura do Sistema

```
liga-da-pelada/
├── apps/
│   ├── api/                      # Backend REST API (Express + TypeScript + PostgreSQL)
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── domain/       # Entidades, Value Objects, Interfaces de Repositório (DDD)
│   │   │   │   │   ├── pelada/   # Match, MatchEvent, Round, Team, Score, MatchStatus
│   │   │   │   │   ├── player/   # Player, IPlayerRepository
│   │   │   │   │   └── shared/   # Result pattern
│   │   │   │   └── application/  # Casos de Uso (StartMatch, RegisterGoal, FinishMatch, etc.)
│   │   │   ├── infrastructure/   # Repositórios PostgreSQL, Migrations, Injeção de Dependências
│   │   │   └── interface/http/   # Controllers, Rotas e Servidor Express
│   │   └── Dockerfile
│   │
│   └── web/                      # Frontend (Next.js 16 + React 19 + TailwindCSS)
│       ├── src/
│       │   ├── app/              # App Router (Início, Jogadores, Peladas, Partida Ao Vivo, Ranking)
│       │   ├── components/       # Componentes (MatchLiveBoard, RoundCreator, MatchCreator, etc.)
│       │   ├── services/         # Clientes tipados de consumo da API REST
│       │   └── lib/              # Utilitários de formatação e cálculos
│       └── Dockerfile
│
├── docker-compose.yml            # Orquestração completa (Postgres + API + Web + Adminer)
└── package.json                  # Workspaces e scripts de inicialização
```

---

## 🚀 Como Executar

### 1. Tudo junto via Docker (Recomendado)

Suba o banco PostgreSQL, a API REST, o Frontend Web e o Adminer com um único comando:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API REST:** [http://localhost:3001](http://localhost:3001)
- **Adminer (DB Web):** [http://localhost:8080](http://localhost:8080)
- **Healthcheck:** [http://localhost:3001/health](http://localhost:3001/health)

---

### 2. Executando Localmente (Desenvolvimento)

#### Pré-requisitos
- Node.js 20+
- PostgreSQL rodando localmente na porta 5432 (ou execute apenas o container do banco: `npm run docker:db`)

#### Subir os serviços
Em terminais separados (ou na raiz):

```bash
# Terminal 1 - Backend API
npm run dev:api

# Terminal 2 - Frontend Web
npm run dev:web
```

---

## 🌟 Funcionalidades Principais

1. **Gestão de Atletas:** Cadastro simples de jogadores (nome e apelido). Estatísticas acumuladas e perfil detalhado por atleta com taxa de vitória, gols e assistências.
2. **Criação de Pelada Simples:**
   - Seleção da data da pelada.
   - Escolha dos atletas presentes (com possibilidade de cadastrar novos jogadores na hora sem sair do fluxo).
   - Divisão flexível de equipes (2 ou mais times personalizáveis).
3. **Controle em Tempo Real (Live Board):**
   - Cronômetro configurável de partida (iniciar, pausar, resetar).
   - Registro de gols com apontamento de autor e assistência (ou gol individual).
   - Histórico e anulação de gols em tempo real.
4. **Remanejamento de Equipes:** Troca de jogadores entre times a qualquer momento durante a sessão da pelada.
5. **Cálculo Automático de Estatísticas:** Ao finalizar cada partida, vitórias, empates, derrotas, gols e assistências são persistidos e totalizados no ranking geral e histórico de rodadas.
6. **Ranking Geral:** Pódio dos 3 primeiros colocados com medalhas estilizadas e tabela completa de classificação.
