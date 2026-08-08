# 🐾 PetLife

### Sistema de Gestão para Clínicas Veterinárias

O **PetLife** é um sistema Full Stack para gestão de clínicas veterinárias, desenvolvido com foco em **estudo, aperfeiçoamento técnico e composição de portfólio**.

O projeto foi construído de forma incremental, simulando a evolução de um software real utilizado na rotina de uma clínica veterinária.

O sistema reúne gerenciamento de pacientes, tutores, internações, profissionais, leitos, procedimentos, prescrições, prontuários, agenda clínica, documentos, relatórios, notificações, auditoria e configurações da clínica em uma única aplicação.

---

# 🚀 Tecnologias

## Front-end

- React
- TypeScript
- Vite
- React Router
- Axios
- Lucide React
- CSS responsivo

## Back-end

- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite
- API REST

---

# ✨ Funcionalidades

## ✅ Fase 1 — Estrutura Inicial

- Estrutura Full Stack do projeto
- Dashboard inicial
- API REST
- Integração React + Express
- Prisma ORM
- Banco de dados SQLite
- Estrutura inicial de rotas, controllers e services

---

## ✅ Fase 2 — Tutores e Animais

### Tutores

- Cadastro
- Edição
- Pesquisa
- Paginação
- Ativação e inativação
- Vinculação de animais

### Animais

- Cadastro
- Edição
- Espécie
- Raça
- Sexo
- Peso
- Tutor responsável
- Informações clínicas
- Histórico
- Pesquisa
- Paginação
- Ativação e inativação

### Interface

- Identidade visual PetLife
- Componentes reutilizáveis
- Modais
- Formulários
- Layout responsivo

---

## ✅ Fase 3 — Internações e Leitos

### Internações

- Abrir internação
- Editar internação
- Finalizar internação
- Resumo de alta
- Motivo da internação
- Diagnóstico
- Observações
- Veterinário responsável
- Prioridade
- Previsão de alta
- Associação com leito

### Regras de negócio

- Um animal não pode possuir duas internações ativas
- Um leito não pode receber dois pacientes simultaneamente
- Liberação automática do leito após alta
- Controle de internações ativas e encerradas

### Gestão de Leitos

- Cadastro
- Edição
- Ativação
- Inativação
- Organização por setor
- Visualização da ocupação

### Indicadores

- Pacientes internados
- Pacientes críticos
- Altas previstas
- Leitos ocupados
- Leitos livres

---

## ✅ Fase 4 — Procedimentos e Medicações

### Procedimentos

- Cadastro de procedimentos
- Agenda de procedimentos
- Data e horário
- Responsável
- Descrição
- Observações
- Controle de status
- Procedimentos pendentes
- Procedimentos em andamento
- Procedimentos concluídos
- Cancelamentos
- Indicadores operacionais

### Medicações

- Prescrições
- Medicamento
- Dose
- Unidade
- Via de administração
- Frequência
- Data de início e término
- Geração automática das doses
- Agenda de administração
- Registro de administração
- Recusa
- Não administração
- Justificativas
- Alertas de doses atrasadas
- Alertas de próximas doses
- Suspensão e reativação de prescrições

### Timeline Clínica

- Linha do tempo por internação
- Integração inicial com os eventos clínicos

---

# 📊 Fase 5 — Recursos Operacionais

## ✅ Fase 5.1 — Dashboard Profissional

- Dashboard operacional
- Indicadores em tempo real
- Taxa de ocupação
- Ocupação por setor
- Agenda de procedimentos
- Próximas medicações
- Pacientes prioritários
- Central automática de alertas
- Skeleton loading
- Estados de carregamento

---

## ✅ Fase 5.2 — Pesquisa Global

Pesquisa unificada por:

- Tutores
- Animais
- Internações
- Leitos
- Procedimentos
- Medicações

### Recursos

- Atalho **Ctrl + K**
- Busca com debounce
- Histórico local de pesquisas
- Navegação por teclado
- Resultados agrupados
- Navegação direta para os módulos encontrados

---

## ✅ Fase 5.3 — Relatórios e Exportações

Relatórios de:

- Internações
- Procedimentos
- Medicações
- Tutores
- Animais
- Leitos

### Recursos

- Filtros por período
- Filtros por situação
- Indicadores resumidos
- Pré-visualização tabular
- Exportação CSV
- Exportação compatível com Excel
- Impressão
- Geração de PDF através do navegador
- Identidade visual PetLife nos relatórios

---

## ✅ Fase 5.4 — Timeline e Prontuário Clínico

Prontuário cronológico completo por internação.

### Registros manuais

- Evoluções clínicas
- Observações
- Sinais vitais
- Edição de registros
- Exclusão de registros

### Recursos

- Pesquisa
- Filtros
- Indicadores
- Impressão do prontuário

### Integração automática

- Internação
- Procedimentos
- Medicações
- Administração de doses
- Alta

---

## ✅ Fase 5.5 — Central de Notificações

- Sino de notificações no cabeçalho
- Contador de alertas
- Atualização automática
- Doses atrasadas
- Próximas doses
- Procedimentos atrasados
- Pacientes críticos
- Altas previstas
- Leitos disponíveis
- Navegação para o módulo relacionado
- Ocultar alertas
- Restaurar alertas

---

# 📈 Fase 6 — Dashboard em Tempo Real

## ✅ Dashboard operacional

### Indicadores

- Internações
- Pacientes críticos
- Leitos ocupados
- Leitos livres
- Procedimentos pendentes
- Medicações pendentes
- Altas previstas

### Painéis

- Agenda clínica
- Próximas medicações
- Últimas movimentações
- Pacientes prioritários
- Central de alertas

### Atualização

- Atualização automática a cada 30 segundos
- Tendência clínica dos últimos 7 dias
- Distribuição por prioridade
- Indicadores operacionais em tempo real

---

# ⚙️ Fase 7 — Administração e Operação Avançada

## ✅ Fase 7.1 — Configurações da Clínica

### Dados da Clínica

- Nome
- Razão social
- CNPJ
- Telefone
- WhatsApp
- E-mail
- Endereço
- Cidade
- Estado
- CEP

### Personalização

- Upload do logotipo
- Frase institucional
- Horário de funcionamento

### Listas configuráveis

- Setores
- Prioridades
- Espécies
- Vias de administração

### Aparência

- Tema claro
- Tema escuro
- Tema sincronizado com o sistema
- Alternância de tema pelo cabeçalho
- Persistência da preferência visual

As configurações são refletidas automaticamente em diferentes áreas do sistema.

Endpoints principais:

```text
GET /api/v1/settings
PUT /api/v1/settings
```

---

## ✅ Fase 7.2 — Backup e Manutenção

- Backup dos dados do sistema
- Restauração de dados
- Preservação das informações clínicas
- Ferramentas de manutenção
- Limpeza dos dados de desenvolvimento
- Estrutura preparada para evolução do banco

---

## ✅ Fase 7.3 — Auditoria do Sistema

Área dedicada à rastreabilidade das operações realizadas no PetLife.

### Recursos

- Histórico automático de operações
- Pesquisa por descrição, entidade ou ID
- Filtro por módulo
- Filtro por tipo de ação
- Filtro por período
- Detalhamento das operações
- Atualização manual do histórico
- Exportação CSV

### Operações monitoradas

A auditoria acompanha alterações realizadas em diferentes módulos, incluindo:

- Tutores
- Animais
- Internações
- Leitos
- Procedimentos
- Medicações
- Profissionais
- Configurações
- Prontuário
- Outras operações relevantes do sistema

---

## ✅ Fase 7.4 — Gestão de Profissionais

Área própria para gerenciamento da equipe da clínica.

### Cadastro

- Nome
- Função
- CRMV
- Especialidade
- Telefone
- E-mail
- Observações
- Status ativo/inativo

### Recursos

- Cadastro
- Edição
- Pesquisa
- Filtros
- Ativação
- Inativação
- Indicadores da equipe
- Integração com pesquisa global
- Integração com auditoria
- Integração com backup

---

## ✅ Fase 7.5 — Polimento Visual e UX

- Melhorias de responsividade
- Melhor adaptação para tablets e celulares
- Padronização dos formulários
- Estados de carregamento
- Feedback visual de operações
- Melhorias de acessibilidade
- Navegação por teclado
- Foco visível
- Melhor comportamento de tabelas em telas menores
- Transições e interações visuais
- Suporte a `prefers-reduced-motion`
- Melhorias nos modos claro e escuro

---

## ✅ Fase 7.7 — Profissionais Integrados aos Fluxos Clínicos

Os profissionais cadastrados passaram a fazer parte diretamente da operação clínica.

### Integrações

- Veterinário responsável nas internações
- Profissional responsável nos procedimentos
- Profissional responsável nas prescrições
- Profissional responsável na administração de doses
- Profissional responsável nas evoluções clínicas
- Profissional responsável nas observações
- Profissional responsável nos sinais vitais

### Compatibilidade

- Vínculos por ID
- Preservação do nome do profissional
- Compatibilidade com registros antigos
- Integração com auditoria
- Integração com relatórios
- Integração com timeline
- Integração com backup

---

## ✅ Fase 7.8 — Agenda Clínica

Centralização da rotina diária da clínica em uma única tela.

### Eventos exibidos

- Procedimentos agendados
- Medicações
- Doses previstas
- Altas previstas

### Informações

- Horário
- Paciente
- Tutor
- Leito
- Setor
- Profissional responsável
- Status

### Recursos

- Navegação entre dias
- Botão **Hoje**
- Filtro por profissional
- Filtro por tipo de evento
- Identificação automática de eventos atrasados
- Indicadores do dia
- Acesso ao prontuário
- Impressão da agenda

---

## ✅ Fase 7.9 — Documentos e Fichas Clínicas

Área dedicada à geração de documentos clínicos utilizando os dados já registrados no PetLife.

### Documentos

- Ficha de internação
- Prescrição médica
- Relatório de alta
- Prontuário clínico

### Preenchimento automático

Os documentos podem utilizar informações de:

- Clínica
- Paciente
- Tutor
- Internação
- Leito
- Diagnóstico
- Profissional responsável
- Procedimentos
- Prescrições
- Medicações administradas
- Evoluções clínicas
- Alta

### Impressão

- Layout preparado para A4
- Impressão pelo navegador
- Salvamento em PDF
- Remoção automática de menus e controles durante a impressão
- Área para assinatura do profissional
- Área para assinatura do tutor

---

## ✅ Fase 7.9.1 — Identidade Visual dos Documentos

Refinamento do cabeçalho utilizado nas fichas e documentos clínicos.

### Melhorias

- Remoção da marca PetLife duplicada
- Identidade visual mais limpa
- Logo da clínica no cabeçalho
- Nome da clínica destacado
- Informações de contato organizadas
- Título do documento separado visualmente
- Data e horário de emissão
- Melhor apresentação para impressão e PDF
- Layout compatível com tema claro e visual profissional

---

# 🌙 Temas e Personalização

O PetLife possui suporte a:

- Tema claro
- Tema escuro
- Tema automático
- Alteração pelo cabeçalho
- Persistência da preferência
- Interface adaptada aos dois temas

A identidade visual da clínica pode ser configurada sem alterar diretamente o código.

---

# 🔎 Principais Módulos

Atualmente o sistema conta com:

```text
Dashboard
Agenda Clínica
Internações
Procedimentos
Medicações
Animais
Tutores
Profissionais
Leitos
Relatórios
Documentos
Auditoria
Configurações
```

Além de:

```text
Pesquisa Global
Prontuário / Timeline
Central de Notificações
Backup e Manutenção
```

---

# ▶️ Como executar

Na raiz do projeto:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

A aplicação web ficará disponível em:

```text
http://localhost:5173
```

A API será executada em:

```text
http://localhost:3333
```

---

# ⚙️ Variáveis de Ambiente

Crie:

```text
apps/api/.env
```

utilizando como base:

```text
apps/api/.env.example
```

Exemplo:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="chave-local-com-mais-de-32-caracteres"
JWT_EXPIRES_IN="8h"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```

---

# 📂 Estrutura do Projeto

```text
apps
├── api
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   └── src
│       ├── config
│       ├── controllers
│       ├── middlewares
│       ├── routes
│       ├── services
│       ├── validations
│       └── utils
│
└── web
    └── src
        ├── components
        ├── contexts
        ├── layouts
        ├── pages
        ├── services
        ├── styles
        └── types
```

---

# 🧠 Conceitos Aplicados

Durante o desenvolvimento do PetLife foram trabalhados conceitos como:

- Arquitetura Full Stack
- Arquitetura em camadas
- API REST
- CRUD
- Regras de negócio
- Modelagem de banco de dados
- Prisma ORM
- React
- TypeScript
- Node.js
- Express
- Componentização
- Context API
- Validação de dados
- Tratamento de erros
- Responsividade
- Acessibilidade
- Temas claro e escuro
- Dashboards
- Indicadores
- Relatórios
- Exportação de dados
- Timeline clínica
- Prontuário eletrônico
- Pesquisa global
- Sistema de notificações
- Auditoria
- Agenda clínica
- Geração de documentos
- Backup e restauração
- Organização e manutenção de código

---

# 🎯 Objetivo do Projeto

O PetLife foi desenvolvido para consolidar conhecimentos em **desenvolvimento Full Stack** através da construção progressiva de um sistema completo.

A proposta é simular desafios encontrados no desenvolvimento de aplicações reais, incluindo regras de negócio, integração entre módulos, modelagem de dados, experiência do usuário, organização arquitetural e evolução contínua do software.

O projeto é destinado a:

- Estudo
- Prática
- Aperfeiçoamento técnico
- Portfólio profissional

---

# 📈 Status do Projeto

| Etapa | Status |
| --- | :---: |
| Fase 1 — Estrutura inicial | ✅ |
| Fase 2 — Tutores e animais | ✅ |
| Fase 3 — Internações e leitos | ✅ |
| Fase 4 — Procedimentos e medicações | ✅ |
| Fase 5.1 — Dashboard profissional | ✅ |
| Fase 5.2 — Pesquisa global | ✅ |
| Fase 5.3 — Relatórios | ✅ |
| Fase 5.4 — Timeline clínica | ✅ |
| Fase 5.5 — Notificações | ✅ |
| Fase 6 — Dashboard em tempo real | ✅ |
| Fase 7.1 — Configurações | ✅ |
| Fase 7.2 — Backup e manutenção | ✅ |
| Fase 7.3 — Auditoria | ✅ |
| Fase 7.4 — Profissionais | ✅ |
| Fase 7.5 — UX e responsividade | ✅ |
| Fase 7.7 — Integração de profissionais | ✅ |
| Fase 7.8 — Agenda clínica | ✅ |
| Fase 7.9 — Documentos clínicos | ✅ |
| Fase 7.9.1 — Identidade dos documentos | ✅ |
| Fase 8 | 🔜 Próxima etapa |

---

# 👨‍💻 Desenvolvedor

**Vinicius Renê**

Projeto desenvolvido para **estudo, aperfeiçoamento técnico e composição de portfólio**, com foco na construção de um sistema completo de gestão veterinária utilizando React, TypeScript, Node.js, Express, Prisma ORM e SQLite.