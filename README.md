# PetLife — Gestão Veterinária

Sistema interno para gestão de uma clínica veterinária, construído com React, TypeScript, Express, Prisma e SQLite.

## Fases concluídas

- Fase 1: estrutura inicial e dashboard
- Fase 2: tutores, animais e identidade visual PetLife
- Fase 4: internações e gestão de leitos

## Funcionalidades da Fase 4

- Abrir e editar internações
- Buscar e filtrar por status e prioridade
- Selecionar animal, leito e veterinário responsável
- Registrar motivo, diagnóstico, observações e previsão de alta
- Impedir duas internações ativas para o mesmo animal
- Impedir dois pacientes no mesmo leito
- Finalizar a internação com resumo de alta
- Liberar o leito automaticamente após a alta
- Cadastrar, editar, ativar e inativar leitos
- Visualizar ocupação por setor
- Indicadores de pacientes ativos, críticos, altas previstas e leitos livres

## Executar

Na raiz do projeto:

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse `http://localhost:5173`.

## Variáveis de ambiente

Crie `apps/api/.env` baseado em `apps/api/.env.example`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="chave-local-com-mais-de-32-caracteres"
JWT_EXPIRES_IN="8h"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```

A aplicação atualmente abre diretamente no dashboard, sem tela de login.


## Fase 4 — Procedimentos e medicações

- Agenda de procedimentos com status e responsáveis
- Prescrições com geração automática de doses
- Registro de administração, recusa e justificativa
- Alertas de doses atrasadas e próximas
- Linha do tempo clínica por internação

## Fase 5.1 — Dashboard profissional

- Indicadores operacionais em tempo real
- Taxa e mapa de ocupação por setor
- Central automática de alertas
- Agenda de procedimentos do dia
- Próximas medicações das próximas 6 horas
- Pacientes prioritários e skeleton loading


## Fase 5.2 — Pesquisa Global

- Pesquisa unificada por tutores, animais, internações, leitos, procedimentos e medicações.
- Atalho de teclado `Ctrl + K`.
- Resultados agrupados, navegação por teclado e histórico local das últimas pesquisas.
- Busca com debounce e navegação direta para os módulos encontrados.

## Fase 5.3 — Relatórios e exportações

- Relatórios de internações, procedimentos, medicações, animais, tutores e leitos.
- Filtros por período e situação.
- Pré-visualização tabular com indicadores resumidos.
- Exportação em CSV e Excel compatível (`.xls`).
- Geração de PDF usando a caixa de impressão do navegador (“Salvar como PDF”).
- Relatórios com identidade visual da PetLife.
