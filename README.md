# 🐾 PetLife

## Sistema de Gestão para Clínicas Veterinárias

O **PetLife** é um sistema Full Stack para gestão veterinária desenvolvido para **estudo, aperfeiçoamento técnico e composição de portfólio**.

O projeto evoluiu de forma incremental, simulando o desenvolvimento de um software real: cadastro de pacientes e tutores, internações, prontuário, medicações, profissionais, agenda, estoque, financeiro, preventivos, relatórios e documentos clínicos em uma única aplicação.

> **Versão atual:** Fase 8.10 • v3.10.0  
> O sistema é interno e atualmente **não utiliza tela de login**.

---

## 🚀 Tecnologias

### Front-end
- React
- TypeScript
- Vite
- React Router
- Axios
- Lucide React
- QRCode
- PWA / Service Worker

### Back-end
- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite
- Zod
- Helmet
- Morgan

---

## ✨ Módulos e funcionalidades

### 🐾 Tutores e animais
- Cadastro, edição, pesquisa e paginação
- Ativação e inativação
- Vínculo entre tutor e animais
- Informações clínicas do paciente
- Microchip
- Foto do paciente
- Alergias, doenças prévias e medicações contínuas
- QR Code individual para identificação rápida

### 🏥 Internações e leitos
- Abertura, edição e encerramento de internações
- Motivo, diagnóstico, observações e prioridade
- Veterinário responsável
- Previsão e resumo de alta
- Associação com leito e setor
- Liberação automática do leito após alta
- Bloqueio de duas internações ativas para o mesmo animal
- Bloqueio de ocupação simultânea do mesmo leito

### 🩺 Procedimentos
- Agenda de procedimentos
- Data e horário
- Profissional responsável
- Status pendente, em andamento, concluído ou cancelado
- Observações e histórico
- Alertas de atraso

### 💊 Medicações
- Prescrições
- Dose, unidade, via e frequência
- Geração automática de doses
- Administração, recusa e não administração
- Justificativas
- Profissional responsável
- Alertas de doses atrasadas e próximas
- Suspensão e reativação de prescrições
- Integração com o estoque
- Baixa automática após administração
- Bloqueio quando não houver saldo suficiente

### 📋 Prontuário clínico
- Timeline completa por internação
- Evoluções clínicas
- Observações
- Sinais vitais
- Temperatura
- Frequência cardíaca
- Frequência respiratória
- Peso
- Edição e exclusão de registros
- Pesquisa e filtros
- Integração automática com internações, procedimentos, medicações e altas
- Gráficos visuais da evolução dos sinais vitais
- Impressão do prontuário

### 📎 Fotos e anexos clínicos
- Imagens
- PDFs
- Exames
- Laudos
- Receitas
- Planilhas e documentos
- Descrição e profissional responsável
- Categorias de anexos
- Visualização de imagens
- Download e exclusão

### 👩‍⚕️ Profissionais
- Cadastro e edição
- CRMV
- Função
- Especialidade
- Telefone e e-mail
- Ativação e inativação
- Integração com internações, procedimentos, prescrições, doses e prontuário

### 📅 Agenda clínica
- Visão diária da rotina da clínica
- Procedimentos
- Medicações
- Altas previstas
- Filtro por profissional
- Filtro por tipo de evento
- Navegação entre dias
- Identificação de atrasos
- Impressão da agenda
- Acesso direto ao prontuário

### 📦 Estoque e farmácia
- Medicamentos
- Insumos
- Alimentação
- Higiene
- Outros materiais
- Quantidade atual e estoque mínimo
- Unidade
- Lote
- Validade
- Fornecedor
- Localização
- Entradas, saídas e ajustes
- Histórico de movimentações
- Alertas de estoque baixo, esgotado e validade
- Integração automática com administração de medicações

### 💰 Financeiro
- Receitas
- Despesas
- Categorias
- Forma de pagamento
- Status pago, pendente ou cancelado
- Data e vencimento
- Observações
- Resumo mensal
- Entradas, saídas, saldo e pendências
- Filtros por período

### 💉 Vacinas e preventivos
- Vacinas
- Vermífugos
- Antiparasitários
- Outros preventivos
- Fabricante
- Lote
- Data de aplicação
- Próxima dose
- Profissional responsável
- Observações
- Alertas de preventivos atrasados
- Alertas dos próximos 30 dias

### 📊 Dashboard final
- Atualização automática
- Internações ativas
- Pacientes críticos
- Ocupação dos leitos
- Procedimentos pendentes e atrasados
- Medicações pendentes e atrasadas
- Altas previstas
- Tendência clínica
- Agenda do dia
- Próximas medicações
- Pacientes prioritários
- Últimas movimentações
- Financeiro do mês
- Estoque em atenção
- Preventivos atrasados e próximos
- Central de alertas

### 🔎 Pesquisa global
Pesquisa unificada por diferentes módulos do sistema com:
- Atalho `Ctrl + K`
- Debounce
- Histórico local
- Navegação por teclado
- Resultados agrupados

### 🔔 Central de notificações
Alertas para:
- Medicações atrasadas
- Próximas doses
- Procedimentos atrasados
- Pacientes críticos
- Altas previstas
- Leitos disponíveis
- Estoque baixo
- Itens vencendo
- Preventivos atrasados

### 📄 Documentos clínicos
- Ficha de internação
- Prescrição médica
- Relatório de alta
- Prontuário clínico
- Dados da clínica preenchidos automaticamente
- Área de assinatura
- Layout A4
- Impressão e salvamento em PDF

### 📈 Relatórios e exportações
Relatórios disponíveis para:
- Internações
- Procedimentos
- Administração de medicações
- Prescrições
- Animais
- Tutores
- Leitos
- Profissionais
- Estoque
- Movimentações de estoque
- Financeiro
- Vacinas e preventivos
- Prontuário clínico
- Anexos clínicos

Exportações:
- CSV
- Excel
- PDF / impressão

Os relatórios incluem filtros, indicadores resumidos e colunas específicas de cada módulo.

### ⚙️ Configurações da clínica
- Nome
- Razão social
- CNPJ
- Contatos
- Endereço
- Logotipo
- Frase institucional
- Horário de funcionamento
- Setores
- Prioridades
- Espécies
- Vias de administração

### 🌙 Aparência
- Tema claro
- Tema escuro
- Tema sincronizado com o sistema
- Alternância pelo cabeçalho
- Preferência persistida

### 🧾 Auditoria
- Histórico das principais operações
- Filtro por módulo
- Filtro por ação e período
- Pesquisa
- Detalhamento
- Exportação CSV

### 💾 Backup e manutenção
- Exportação de backup
- Restauração
- Inclusão dos módulos clínicos, estoque, financeiro e preventivos
- Limpeza dos dados de desenvolvimento
- Preservação das configurações da clínica

### 📱 PWA
- Aplicação instalável em navegadores compatíveis
- Ícones próprios
- Manifest
- Service Worker
- Modo standalone
- Aviso de conexão offline
- Cache do shell da aplicação

---

## 🧱 Evolução do projeto

| Etapa | Descrição | Status |
| --- | --- | :---: |
| Fase 1 | Estrutura inicial e dashboard | ✅ |
| Fase 2 | Tutores e animais | ✅ |
| Fase 3 | Internações e leitos | ✅ |
| Fase 4 | Procedimentos e medicações | ✅ |
| Fase 5.1 | Dashboard profissional | ✅ |
| Fase 5.2 | Pesquisa global | ✅ |
| Fase 5.3 | Relatórios e exportações | ✅ |
| Fase 5.4 | Timeline / prontuário | ✅ |
| Fase 5.5 | Central de notificações | ✅ |
| Fase 6 | Dashboard em tempo real | ✅ |
| Fase 7.1 | Configurações da clínica | ✅ |
| Fase 7.2 | Backup e manutenção | ✅ |
| Fase 7.3 | Auditoria | ✅ |
| Fase 7.4–7.7 | Profissionais, UX e integrações clínicas | ✅ |
| Fase 7.8 | Agenda clínica | ✅ |
| Fase 7.9 | Documentos e fichas clínicas | ✅ |
| Fase 8.1 | Fotos e anexos clínicos | ✅ |
| Fase 8.2 | PWA | ✅ |
| Fase 8.3 | QR Code e microchip | ✅ |
| Fase 8.4 | Estoque e farmácia | ✅ |
| Fase 8.5 | Estoque integrado às medicações | ✅ |
| Fase 8.6 | Financeiro | ✅ |
| Fase 8.7 | Vacinas e preventivos | ✅ |
| Fase 8.8 | Prontuário avançado | ✅ |
| Fase 8.9 | Dashboard final | ✅ |
| Fase 8.9.1 | Relatórios completos | ✅ |
| **Fase 8.10** | **Revisão, limpeza e fechamento da Fase 8** | ✅ |

---

## ▶️ Como executar

Na raiz do projeto:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Front-end:

```text
http://localhost:5173
```

API:

```text
http://localhost:3333
```

---

## ⚙️ Variáveis de ambiente

Crie:

```text
apps/api/.env
```

Baseado em:

```text
apps/api/.env.example
```

Exemplo:

```env
NODE_ENV="development"
DATABASE_URL="file:./dev.db"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```

---

## 🛠️ Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint

npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:clean
```

---

## 📂 Estrutura

```text
apps/
├── api/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validations/
│
└── web/
    ├── public/
    └── src/
        ├── components/
        ├── contexts/
        ├── layouts/
        ├── pages/
        ├── services/
        ├── styles/
        └── types/
```

---

## 🎯 Objetivo

O PetLife foi criado para consolidar conhecimentos de **desenvolvimento Full Stack** através de um projeto progressivo e próximo de um cenário real.

Entre os conceitos praticados estão:
- arquitetura em camadas;
- API REST;
- CRUD e regras de negócio;
- modelagem relacional;
- Prisma ORM;
- React e TypeScript;
- componentização;
- validação;
- tratamento de erros;
- responsividade;
- PWA;
- dashboards;
- relatórios;
- prontuário eletrônico;
- auditoria;
- exportação de dados;
- gestão de estoque;
- gestão financeira;
- integrações entre módulos.

---

## 👨‍💻 Desenvolvedor

**Vinicius Renê**

Projeto desenvolvido para **estudo, aperfeiçoamento técnico e composição de portfólio**.
