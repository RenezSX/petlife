# PetLife — Fase 1 Final

Base funcional de um sistema de gestão e internação veterinária, com frontend e backend separados e banco SQLite local.

## O que está incluído

- React + Vite + TypeScript
- Node.js + Express + TypeScript
- Prisma ORM com SQLite
- Login com JWT
- Rotas protegidas
- Dashboard conectado ao banco
- Dados demonstrativos via seed
- Interface responsiva nas cores verde e laranja
- Execução sem Docker ou PostgreSQL

## Requisitos

- Node.js 20 ou 22 LTS recomendado
- npm 10 ou superior

## Instalação

Abra o PowerShell nesta pasta e execute:

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Caso a porta 5173 esteja ocupada, o Vite usará a próxima porta disponível. A API aceita automaticamente origens locais durante o desenvolvimento.

## Acessos

- Frontend: `http://localhost:5173`
- API: `http://localhost:3333`
- Verificação da API: `http://localhost:3333/health`

### Credenciais iniciais

- E-mail: `admin@petlife.local`
- Senha: `Admin@123`

## Banco de dados

O SQLite é criado em:

```text
apps/api/prisma/dev.db
```

Para recriar o banco do zero, pare o projeto, exclua `apps/api/prisma/dev.db` e `apps/api/prisma/migrations`, então execute:

```powershell
npm run db:migrate
npm run db:seed
```

## Comandos

```powershell
npm run dev
npm run build
npm run typecheck
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
```
