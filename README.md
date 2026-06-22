# Goals — Backend

Servidor do app **Goals**: login social (sem cadastro), perfil, categorias com
atribuições e rotina semanal.

## Stack

- **Node.js** + **TypeScript**
- **Express** (HTTP)
- **Prisma** + **PostgreSQL** (dados)
- **Passport** (OAuth) + **JWT** (sessão sem estado)

## Arquitetura

Separação em camadas finas, com fluxo de dependência `routes → controllers → services → lib/prisma`:

```
prisma/schema.prisma   Fonte única da modelagem de dados
src/config/            Configuração e bootstrap (env, Passport)
src/lib/               Infraestrutura sem domínio (Prisma, JWT)
src/middlewares/       Autenticação e tratamento de erros
src/services/          Regra de negócio (falam com o Prisma)
src/controllers/       Adaptam HTTP ↔ serviços (validação Zod)
src/routes/            Mapeiam método + caminho ao controller
src/errors/            Erros de aplicação tipados
```

## Pré-requisitos

- Node.js 20+
- PostgreSQL em execução
- Credenciais OAuth dos provedores que for usar

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o ambiente
cp .env.example .env   # preencha as variáveis (ver abaixo)

# 3. Gerar o Prisma Client e aplicar o schema ao banco
npm run prisma:generate
npm run prisma:migrate

# 4. (opcional) Popular dados de exemplo
npm run db:seed

# 5. Subir em desenvolvimento (hot reload)
npm run dev
```

Build e produção:

```bash
npm run build
npm start
```

## Variáveis de ambiente

Veja o `.env.example` para a lista completa. Resumo:

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta do servidor (padrão `3000`) |
| `BASE_URL` | URL pública do backend, usada para montar os callbacks de OAuth |
| `FRONTEND_SUCCESS_URL` | Para onde redirecionar após o login (o token vai em `?token=`); vazio responde em JSON |
| `DATABASE_URL` | Conexão PostgreSQL |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Segredo e validade do JWT emitido pelo backend |

OAuth — **preencha apenas os provedores que for usar**; cada estratégia só é
registrada quando suas credenciais estão presentes:

| Provedor | Variáveis |
| --- | --- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |

## Autenticação

Não há tela de cadastro: o usuário nasce do primeiro login social. O fluxo
emite um JWT próprio, enviado nas rotas protegidas via header
`Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/auth/providers` | Lista os provedores habilitados (com credenciais configuradas) |
| `GET` | `/auth/:provider` | Inicia o fluxo OAuth (`google`, `facebook`, `github`) |
| `GET` | `/auth/:provider/callback` | Callback do provedor — emite o JWT |

## Endpoints

Todas as rotas abaixo exigem `Authorization: Bearer <token>`.

**Perfil**

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/me` | Dados do usuário autenticado |
| `PATCH` | `/me` | Atualiza o perfil |

**Categorias e atribuições**

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/categories` | Lista categorias |
| `POST` | `/categories` | Cria categoria |
| `GET` | `/categories/:id` | Detalha categoria |
| `PATCH` | `/categories/:id` | Atualiza categoria |
| `DELETE` | `/categories/:id` | Remove categoria |
| `POST` | `/categories/:id/items` | Adiciona atribuição |
| `PATCH` | `/categories/:id/items/:itemId` | Atualiza atribuição |
| `DELETE` | `/categories/:id/items/:itemId` | Remove atribuição |

**Rotina semanal**

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/routine` | Retorna a rotina |
| `PUT` | `/routine/days/:weekday` | Define as categorias do dia (`weekday`: `MONDAY`..`SUNDAY`) |
| `PUT` | `/routine/days/:weekday/clear` | Esvazia o dia (remove as categorias; o dia permanece) |

**Saúde**

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Status do servidor |

## Scripts

| Script | Ação |
| --- | --- |
| `npm run dev` | Servidor em desenvolvimento (hot reload) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa o build |
| `npm run typecheck` | Type-check sem emitir |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Cria/aplica migrations |
| `npm run prisma:studio` | Abre o Prisma Studio |
| `npm run db:seed` | Popula dados de exemplo |
