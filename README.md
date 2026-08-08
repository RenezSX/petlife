# 🐾 PetLife

### Sistema de Gestão para Clínicas Veterinárias

O **PetLife** é um sistema completo para gestão de clínicas veterinárias, desenvolvido com foco em **estudo, aperfeiçoamento técnico e composição de portfólio**.

O projeto foi construído de forma incremental, simulando o desenvolvimento de um software real, utilizando uma arquitetura moderna, boas práticas de programação e tecnologias amplamente utilizadas no mercado.

---

# 🚀 Tecnologias

## Front-end

- React
- TypeScript
- Vite
- React Router
- Axios
- Lucide React

## Back-end

- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite

---

# ✨ Funcionalidades

## ✅ Fase 1 — Estrutura Inicial

- Estrutura completa do projeto
- Dashboard inicial
- API REST
- Integração React + Express
- Prisma ORM
- Banco SQLite

---

## ✅ Fase 2 — Tutores e Animais

### Tutores

- Cadastro
- Edição
- Pesquisa
- Paginação
- Ativação e inativação

### Animais

- Cadastro
- Edição
- Espécie
- Sexo
- Tutor responsável
- Histórico
- Pesquisa
- Paginação
- Ativação e inativação

### Interface

- Identidade visual PetLife
- Componentes reutilizáveis
- Modais
- Layout responsivo

---

## ✅ Fase 3 — Internações e Leitos

### Internações

- Abrir internação
- Editar internação
- Finalizar internação
- Resumo de alta
- Diagnóstico
- Observações
- Veterinário responsável
- Previsão de alta

### Regras de negócio

- Um animal não pode possuir duas internações ativas
- Um leito não pode receber dois pacientes simultaneamente
- Liberação automática do leito após alta

### Gestão de Leitos

- Cadastro
- Edição
- Ativação
- Inativação
- Ocupação por setor

### Indicadores

- Pacientes internados
- Pacientes críticos
- Altas previstas
- Leitos livres

---

## ✅ Fase 4 — Procedimentos e Medicações

### Procedimentos

- Agenda clínica
- Controle de status
- Responsáveis
- Alteração de status
- Indicadores

### Medicações

- Prescrições
- Geração automática de doses
- Administração
- Recusa
- Justificativa
- Alertas

### Timeline Clínica

- Linha do tempo por internação

---

## ✅ Fase 5.1 — Dashboard Profissional

- Dashboard operacional
- Indicadores em tempo real
- Taxa de ocupação
- Ocupação por setor
- Agenda clínica
- Próximas medicações
- Pacientes prioritários
- Central automática de alertas
- Skeleton loading

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
- Histórico local
- Navegação por teclado
- Resultados agrupados

---

## ✅ Fase 5.3 — Relatórios

Relatórios completos de:

- Internações
- Procedimentos
- Medicações
- Tutores
- Animais
- Leitos

### Recursos

- Filtros
- Indicadores
- Exportação CSV
- Exportação Excel
- Impressão em PDF
- Identidade visual PetLife

---

## ✅ Fase 5.4 — Timeline Clínica

Prontuário completo por internação

- Evoluções clínicas
- Observações
- Sinais vitais
- Pesquisa
- Filtros
- Indicadores
- Impressão

Integração automática com:

- Internações
- Procedimentos
- Medicações
- Altas

---

## ✅ Fase 5.5 — Central de Notificações

- Sino de notificações
- Contador de alertas
- Atualização automática
- Alertas de procedimentos
- Alertas de medicações
- Pacientes críticos
- Altas previstas
- Leitos disponíveis
- Ocultar e restaurar alertas

---

## ✅ Fase 6 — Dashboard em Tempo Real

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

### Dashboard

- Atualização automática a cada 30 segundos
- Tendência clínica dos últimos 7 dias
- Distribuição por prioridade

---

## ✅ Fase 7.1 — Configurações da Clínica

### Dados da Clínica

- Nome
- Razão Social
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

### Configurações

- Setores
- Prioridades
- Espécies
- Vias de administração

### Aparência

- Tema claro
- Tema escuro
- Tema automático (segue o sistema)

As configurações são refletidas automaticamente em:

- Sidebar
- Cabeçalho
- Rodapé
- Relatórios

Endpoints disponíveis:

- `GET /api/v1/settings`
- `PUT /api/v1/settings`

---


## ✅ Fase 7.7 — Profissionais integrados aos fluxos clínicos

- Correção do cadastro e edição de profissionais.
- Mensagens de erro mais claras para CRMV duplicado e banco sem migration aplicada.
- Veterinário responsável vinculado às internações.
- Profissional responsável em procedimentos.
- Profissional responsável nas prescrições de medicação.
- Profissional responsável obrigatório no registro de administração de doses.
- Profissional responsável em evoluções, observações e sinais vitais do prontuário.
- Vínculos preservados por ID e nome para manter compatibilidade com registros antigos.
- Integração automática com auditoria, relatórios, timeline e backup através dos dados já existentes.

# ▶️ Como executar

Na raiz do projeto:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

A aplicação ficará disponível em:

```
http://localhost:5173
```

---

# ⚙️ Variáveis de ambiente

Crie o arquivo:

```
apps/api/.env
```

Baseado em:

```
apps/api/.env.example
```

Conteúdo:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="chave-local-com-mais-de-32-caracteres"
JWT_EXPIRES_IN="8h"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```

---

# 📂 Estrutura do Projeto

```
apps
├── api
│   ├── prisma
│   └── src
│       ├── controllers
│       ├── routes
│       ├── services
│       ├── validations
│       └── utils
│
└── web
    └── src
        ├── components
        ├── layouts
        ├── pages
        ├── services
        ├── styles
        └── types
```

---

# 🎯 Objetivos do Projeto

O PetLife foi desenvolvido para consolidar conhecimentos em desenvolvimento Full Stack e simular a evolução de um sistema utilizado em clínicas veterinárias.

Durante o desenvolvimento foram aplicados conceitos como:

- Arquitetura em camadas
- API REST
- CRUD completo
- Prisma ORM
- React + TypeScript
- Componentização
- Validação de dados
- Dashboards
- Relatórios
- Timeline clínica
- Pesquisa global
- Sistema de notificações
- Configurações da aplicação
- Organização e manutenção de código

---

# 📈 Status do Projeto

| Etapa | Status |
|--------|:------:|
| Fase 1 | ✅ |
| Fase 2 | ✅ |
| Fase 3 | ✅ |
| Fase 4 | ✅ |
| Fase 5.1 | ✅ |
| Fase 5.2 | ✅ |
| Fase 5.3 | ✅ |
| Fase 5.4 | ✅ |
| Fase 5.5 | ✅ |
| Fase 6 | ✅ |
| Fase 7.1 | ✅ |

---

# 👨‍💻 Desenvolvedor

**Vinicius Renê**

Projeto desenvolvido para **estudo, aperfeiçoamento técnico e composição de portfólio**, com foco na criação de um sistema completo de gestão veterinária utilizando React, TypeScript, Node.js, Express, Prisma ORM e SQLite.
