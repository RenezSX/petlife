# PetLife — Fase 2

Sistema de gestão para clínicas veterinárias com identidade visual inspirada na PetLife São Caetano.

## Entregas desta fase

- Login com JWT
- Dashboard integrado à API
- CRUD completo de tutores
- CRUD completo de animais
- Busca, filtros e paginação
- Inativação e reativação
- Vínculo obrigatório entre animal e tutor
- SQLite + Prisma
- Layout responsivo em azul petróleo e laranja
- Sidebar, cards, tabelas, modais e formulários redesenhados

## Como executar em uma pasta nova

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse `http://localhost:5173`.

**Login:** `admin@petlife.local`  
**Senha:** `Admin@123`

## Observação sobre banco anterior

Esta entrega possui uma migration inicial limpa. Ao substituir uma instalação antiga de desenvolvimento, remova o banco local antes de migrar:

```powershell
Remove-Item apps\api\prisma\dev.db -ErrorAction SilentlyContinue
Remove-Item apps\api\prisma\dev.db-journal -ErrorAction SilentlyContinue
npm run db:migrate
npm run db:seed
```

Nunca envie `apps/api/.env`, `dev.db` ou `node_modules` ao GitHub.
