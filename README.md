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


## Fase 5.4 — Timeline clínica

- Prontuário cronológico unificado por internação.
- Evoluções, observações e sinais vitais manuais.
- Edição e exclusão de registros clínicos.
- Filtros, pesquisa, indicadores e impressão do prontuário.
- Integração automática com procedimentos, medicações, internação e alta.


## Fase 5.5 — Central de notificações

- Sino de alertas no cabeçalho com contador em tempo real.
- Alertas de doses atrasadas e próximas, procedimentos atrasados, pacientes críticos, altas previstas e leitos disponíveis.
- Atualização automática a cada minuto.
- Navegação direta para o módulo relacionado.
- Possibilidade de ocultar alertas localmente e restaurá-los depois.


## Fase 6 — Dashboard em tempo real

- Atualização automática do dashboard a cada 30 segundos.
- Indicadores operacionais, ocupação e prioridades.
- Tendência clínica dos últimos 7 dias.
- Agenda de procedimentos e medicações.
- Últimas movimentações do sistema.
- Painel de pacientes prioritários e alertas.

## Fase 7.1 — Configurações da Clínica

- Dados cadastrais e contatos da clínica
- Upload e persistência do logotipo
- Horário de funcionamento e frase institucional
- Listas configuráveis de setores, prioridades, espécies e vias de administração
- Tema claro, escuro ou sincronizado com o sistema
- Nome, logotipo e rodapé aplicados automaticamente no layout e nos relatórios
- Endpoint `GET /api/v1/settings` e `PUT /api/v1/settings`


## Fase 7.2 — Backup e restauração

- Exportação completa dos dados em arquivo JSON.
- Restauração com validação de versão e pré-visualização dos registros.
- Preservação dos relacionamentos entre tutores, animais, internações, procedimentos e medicações.
- Histórico de backups e restaurações na tela de Configurações.
- Endpoints `GET /api/v1/backup/export`, `GET /api/v1/backup/info` e `POST /api/v1/backup/import`.


## Limpeza do banco

Para iniciar o sistema sem dados operacionais de teste, execute:

```bash
npm run db:clean
```

O comando remove tutores, animais, leitos, internações, procedimentos, medicações, registros clínicos, logs de backup e usuários, preservando apenas as configurações da clínica.

## Tema

O sistema possui modo claro, escuro e automático. Além da tela de Configurações, o cabeçalho possui um botão para alternar rapidamente entre claro e escuro.

## ✅ Fase 7.3 — Auditoria do Sistema

- Registro automático das principais operações da API.
- Histórico de cadastros, atualizações, mudanças de status, exclusões e restaurações.
- Tela de auditoria com pesquisa, filtros por módulo, ação e período.
- Indicadores de ações totais, ações do dia, cadastros, atualizações e exclusões.
- Visualização dos detalhes registrados em cada operação.
- Exportação dos registros exibidos em CSV.
- Endpoints `GET /api/v1/audit`, `GET /api/v1/audit/stats` e `GET /api/v1/audit/:id`.

## Fase 7.4 — Gestão de Profissionais
- Cadastro, edição, pesquisa, filtros e ativação/inativação da equipe.
- Funções de veterinário, auxiliar, recepção, banho e tosa e outros.
- CRMV, especialidade e contatos.
- Veterinários cadastrados podem ser vinculados às internações.
- Profissionais cadastrados podem ser vinculados aos procedimentos.
- Profissionais incluídos na Pesquisa Global, Auditoria, Backup e limpeza de dados.

## Fase 7.5 — Polimento visual e UX
- Melhorias de responsividade em formulários, tabelas e indicadores.
- Estados de sucesso e feedback visual mais consistentes.
- Foco visível para navegação por teclado.
- Melhorias de hover e leitura das tabelas.
- Respeito à preferência de redução de movimento do sistema operacional.
- Ajustes para uso em celulares e tablets.
