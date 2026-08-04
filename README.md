# PetLife — Fase 2

Sistema de gestão veterinária com autenticação, dashboard, cadastro de tutores e cadastro de animais.

## Funcionalidades

- Login JWT e rotas protegidas
- Dashboard de internação
- Tutores: cadastro, edição, busca, paginação, filtros, inativação e reativação
- Animais: cadastro, edição, busca, filtros, vínculo com tutor, dados clínicos, foto por URL, inativação e reativação
- Validação de dados no backend
- SQLite local, sem Docker
- Interface responsiva em verde e laranja

## Requisitos

- Node.js 20 ou 22 LTS recomendado
- npm 10+

## Instalação

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Credenciais iniciais

- E-mail: `admin@petlife.local`
- Senha: `Admin@123`

## Banco

O SQLite é criado em `apps/api/prisma/dev.db`.

## Comandos úteis

```powershell
npm run typecheck
npm run build
npm run lint
```

Se o comando conjunto de desenvolvimento falhar no Windows, use dois terminais:

```powershell
npm --prefix apps/api run dev
```

```powershell
npm --prefix apps/web run dev
```
