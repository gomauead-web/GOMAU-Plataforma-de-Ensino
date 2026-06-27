# Prompt Mestre de Clonagem e Especificação Técnica: G∴O∴M∴A∴U∴

Este documento é a especificação técnica absoluta, completa e exaustiva para clonar a **Plataforma Maçônica G∴O∴M∴A∴U∴**.
O objetivo deste arquivo é alimentar uma Inteligência Artificial Sênior de Engenharia (como Gemini, Claude, ChatGPT, etc.) para recriar **100% da plataforma, linha por linha, com toda a sua arquitetura, frontend, backend no Firebase, regras de negócio, gamificação, motores de inteligência artificial e interfaces dinâmicas**, sem perder nenhuma regra de negócio oculta.

**Stack Tecnológica Obrigatória:** React 18+ (Vite), TypeScript, Tailwind CSS, Firebase (Firestore, Authentication, Storage), Lucide React (Ícones), React Router DOM (v6+), XSLX (Manipulação de Excel), html2canvas/jspdf (CIM/Relatórios), Google GenAI SDK.

---

## 1. 🎨 ESTÉTICA, DESIGN SYSTEM E UI/UX CORE

A plataforma deve transpirar solenidade, ocultismo maçônico, prestígio e modernidade.

**Paleta de Cores (Tailwind):**

- **Fundo Principal (Imperial Midnight):** `#0A0E1A` ou `#05070F`. As páginas nunca usam branco ou cinza claro como fundo principal.
- **Painéis / Containers (Slate Royal):** `#0F172A`, `#1E293B`, `#111827`. Cards frequentemente possuem bordas sutis `border-[#1e293b]`.
- **Destaques & Acentos (Masonic Gold):** `#D4AF37`, `#C9A227`, `#FBBF24`, amarelo dourado em gradientes (`from-[#D4AF37] to-[#C9A227]`).
- **Estados:** Sucesso (`text-green-400`, `bg-green-500/10`), Erro/Aviso (`text-red-400`, `bg-red-500/10`), Informação (`text-blue-400`).

**Tipografia e Formas:**

- **Estilo:** "Tracking-tight", espaçamento elegante. Fontes padrão do sistema sem serifa (Inter, Sans), com blocos monoespaçados (JetBrains Mono) para códigos de CIM, datas e status.
- **Bordas e Vidro:** Muito uso de `rounded-xl`, `backdrop-blur-sm`, fundos semitransparentes (`bg-[#0F172A]/80`) e sombras imponentes (`shadow-2xl`, `shadow-black/50`). Hover com transição suave que acende as bordas de cinza para dourado.

---

## 2. 🔐 SISTEMA DE AUTENTICAÇÃO E O "TRIPLO PORTAL" (Login.tsx)

O sistema possui uma barreira de entrada chamada "Os Portais", criada para barrar profanos (não-maçons). A autenticação não é um simples login.

1. **Google Auth:** O usuário entra com a conta Google (`signInWithPopup`).
2. **Verificação de Existência (1º Portal):** O Firebase verifica na coleção `users` se aquele UID ou E-mail (minusculo) existe. Se não existir, erro: "Irmão não identificado nos registros da Oficina".
3. **Enigma da Idade (2º Portal):** Se o usuário já passou do Grau de Aprendiz (ex: Companheiro, Mestre), uma pergunta dinâmica maçônica é exibida, baseada no campo `grau`. Ex: "Mestre, qual a sua idade?". O usuário precisa digitar a idade simbólica correta (3, 5, 7, etc.) com variação de segurança.
4. **Validação de CPF (3º Portal):** O usuário deve digitar os 3 primeiros dígitos do seu CPF cadastrado.
5. **A Palavra Sagrada Corrente:** O sistema busca em `settings` (no Firestore) uma palavra sagrada dinâmica que o Gestor troca periodicamente. O usuário precisa digitá-la para finalmente acessar a plataforma (o token de sessão é gerado e salvo).
6. **Bypass:** Os emails masters (`gomau.ead@gmail.com`, `calepi@gmail.com`, `calepe@gmail.com`) entram direto sem passar pelas validações profanas.

---

## 3. 🗄️ ENGENHARIA DO BANCO DE DADOS (Firestore Collections & Schema)

Todas as coleções devem ser criadas com os seguintes esquemas precisos:

### 3.1. `users` (Membros)

- **IDs:** Podem ser gerados automaticamente ou podem coincidir com o UID do Firebase Auth ao se logar.
- **Campos Core:** `uid` (string), `email` (string lowercased), `nome` (string), `cpf` (string formatada), `cim` (string, identificador único na maçonaria), `grau` (string: "Aprendiz", "Companheiro", "Mestre", etc).
- **Dados Maçônicos:** `loja` (string), `rito` (string), `cargo` (string), `status` ("Ativo", "Inativo", "Irregular"), `delegatedPastas` (array de strings - Ex: `["segundo_vigilante"]`).
- **Dados Pessoais:** `dataNascimento`, `telefone`, `estadoCivil`, `esposa`, `qtdFilhos`, `emergencia`, `foneEmergencia`, `avatarUrl` (URL da foto do Google).
- **Endereço:** `cep`, `rua`, `numero`, `bairro`, `cidade`, `uf`.
- **Controle:** `createdAt` (ISO), `updatedAt` (ISO), `readNotifications` (array de strings de IDs de notificações), `readReminders` (array de strings).

### 3.2. `requests` (Pranchas, Faltas e Requerimentos)

- **Campos:** `id` (string), `userId`, `solicitanteEmail`, `solicitanteNome`, `solicitanteGrau`, `tipo` ("prancha", "falta", "hospitalaria", "certidao", "quitte"), `titulo`, `numeroPrancha`, `temaCentral`, `simbolosPrincipais`, `descricao`, `fileUrl` (link do Storage), `status` ("pendente", "em_analise", "aprovado", "rejeitado").
- **Campos de Resposta do Gestor:** `comentarioGestor`, `dataResposta`, `analisadoEm`.
- **Controle:** `criadoEm` (Timestamp/ISO).

### 3.3. `contents` (Biblioteca de Mídia e Vídeos)

- **Campos:** `id`, `titulo`, `tipo` ("video", "pdf", "link"), `url` (YouTube embed ou Drive link), `grauMinimo` (Aprendiz, Companheiro, etc.), `descricao`, `criadoEm`.

### 3.4. `courses` e `courseProgress` (Sistema EAD Mestre-IA)

- **`courses`:** `id`, `titulo`, `descricao`, `grauElegivel`, `cargaHoraria`, `createdAt`, `aulas` (array de objetos com `id`, `titulo`, `conteudo` em Markdown), `quiz` (array de objetos com `pergunta`, `opcoes` array, `respostaCorreta` index).
- **`courseProgress`:** `id`, `uid`, `courseId`, `aulasConcluidas` (array de num/IDs), `quizRespondido` (boolean), `quizResultado` (number score), `dataConclusao` (string ISO), `status` ("em_andamento", "concluido").

### 3.5. Fórum Místico (`forumTopics`, `forumReplies`, `forumInstructors`)

- **`forumTopics`:** `id`, `title`, `content` (Markdown text), `authorId`, `authorName`, `authorGrau`, `minGrau`, `categoryId` (Ritualistica, Simbolismo, etc.), `createdAt` (Timestamp), `likes` (number), `views` (number).
- **`forumReplies`:** `id`, `topicId`, `content`, `authorId`, `authorName`, `createdAt` (Timestamp), `isInstructorResponse` (boolean), `likes` (number).
- **`forumInstructors`:** `id`, `userId`, `userName`, `expertise` (string), `createdAt` (Timestamp). Concede selo dourado às respostas do usuário.

### 3.6. Biblioteca Digital e Cofre (`library_items`, `library_notes`)

- **`library_items`:** `id`, `title`, `description`, `fileUrl`, `fileType` (pdf, epub), `minGrau`, `category` (Instruções, Rituais, Manuais), `createdAt`, `downloads`.
- **`library_notes`:** `id`, `userId`, `itemId` (ID do livro/documento), `content` (string - anotações do usuário sobre o livro), `updatedAt`. Isola dados privados por usuário.

### 3.7. Cadeia de União (`birthday_messages`)

- **Campos:** `id`, `fromUid`, `fromName`, `toUid`, `toName`, `message`, `isPrivate` (boolean), `timestamp`, `read` (boolean). Permite envio de mensagens de felicitações (públicas ou privadas).

### 3.8. Calendário e Eventos (`events`)

- **Campos:** `id`, `title`, `description`, `data` (ISO Date), `type` (sessao, instrucao, festivo, admin), `location`, `minGrau`, `createdAt`.

### 3.9. Histórico e Linha do Tempo (`history` e `accessLogs`)

- **`history`:** `id`, `userId`, `action` ("login", "prancha_enviada", "prancha_aprovada", "curso_concluido", "perfil_atualizado"), `details` (string amigável), `timestamp`.
- **`accessLogs`:** `id`, `uid`, `nome`, `email`, `cim`, `timestamp` (registra TODO E QUALQUER LOGIN para auditoria do Gestor).

### 3.10. `officersNotifications` (2º Vigilante / Oficiais)

- **Campos:** `id`, `targets` (array de objetos `{ cim, name, role, type: 'titular'|'suplente' }`), `message` (string, aviso de convocação), `sender` (string, "2º Vigilante ∴"), `timestamp`, `readBy` (array de strings de CIMs que leram).

### 3.11. Configurações Administrativas (`evolutionRules`, `settings`, `adminPermissions`)

- **`evolutionRules`:** `id` (grau Origem), `grauDestino`, `intersticioMeses`, `quantidadeTrabalhos`, `updatedAt`.
- **`settings`:** Documento de configuração global, contém o objeto `security` com `palavraCorrente`.
- **`adminPermissions`:** `id`, `cim` (CIM do irmão delegado), `allowedPastas` (array, ex: `["segundo_vigilante"]`), `grantedBy`, `grantedAt`.

---

## 4. 🧩 PÁGINAS, COMPONENTES E LÓGICA DE NEGÓCIO DA APLICAÇÃO (Frontend)

O Layout principal (Layout.tsx) contém uma Sidebar de navegação fixa na esquerda e o Topbar. Implementa o Context API de Autenticação (`useAuth`). Possui verificação de rota: Se não está logado, redirect para `/`.

### 4.1. Dashboard.tsx (Painel Central do Obreiro)

- **Header:** Boas vindas com Grau e Nome do irmão (ex: "Saudações, Mestre João").
- **Avisos do 2º Vigilante (Blocker):** Se houver uma `officersNotification` cujo array de `targets` contém o CIM do usuário, E o CIM do usuário NÃO está em `readBy`, o sistema injeta um CARD VERMELHO/DOURADO no topo da tela exigindo "Confirmar Ciência e Presença" antes de seguir. Clicar adiciona o CIM em `readBy`.
- **Aniversariantes do Mês:** Varre a coleção `users`, encontra irmãos cujo `dataNascimento` seja do mês atual e exibe um widget com opção "Enviar Felicitação" que abre um modal e salva em `birthday_messages`.
- **Cards Rápidos:** Próxima Sessão (Puxado de `events`), Progresso (Puxado de `courseProgress` e `reading_progress`).
- **Resumo de Pranchas:** Lista as últimas entregas de Pranchas (do usuário atual) com status (Aprovada/Pendente).
- **Conteúdos Recomendados:** Puxa 3 vídeos ou textos baseados no `grau` do usuário de `contents`.

### 4.2. Perfil e CIM (ProfilePage.tsx)

- Ficha cadastral completa, editável. Se o usuário mudar seus dados, salva no Firestore `users`.
- **Card de Identidade Maçônica (CIMCard.tsx):** Um componente dinâmico. Pega a foto de perfil (`avatarUrl`), Nome, Grau, Loja, CIM e desenha tudo via HTML. Possui um botão "Baixar PDF" que usa `html2canvas` + `jspdf` para converter o componente num arquivo renderizado frente-e-verso simulando a cédula física (com fundo de textura e selo da loja).

### 4.3. Pranchas e Solicitações (RequestsPage.tsx)

- Abas: Enviar Solicitação, Minhas Solicitações.
- O Formulário pede: Tipo (Prancha, Justificativa Falta, etc.), Título, Número da Prancha, Tema Central, Descrição/Corpo e Arquivo PDF (opcional). Salva na coleção `requests`.
- Após o envio, o status é "pendente". Registra no `history` a entrega.
- Usuário pode Excluir e Editar pranchas enquanto o status for "pendente" ou "em_analise". Se for aprovada, tranca.

### 4.4. Cursos EAD Mestre-IA (CursoDetail.tsx e CursosExternos.tsx)

- Trilha de conhecimento. Acessível apenas se o usuário tiver o Grau Mínimo do curso.
- Visualização lateral (Aulas do lado esquerdo, conteúdo Markdown do lado direito).
- Botão "Marcar como Concluída" salva o progresso na aula atual em `courseProgress`.
- Ao final, o Quiz é liberado. O usuário responde a múltiplas escolhas. A nota é salva no banco.
- Ao obter nota suficiente, recebe parabenização e o curso é finalizado.

### 4.5. Biblioteca Digital (LibraryPage.tsx)

- Exibe Documentos e Manuais divididos por categoria (Ritualística, Legislação).
- **Cofre Pessoal / Anotações:** Ao abrir um livro, a tela se divide. No lado direito existe um Editor de Texto (`textarea`) rico, chamado "Bloco de Notas Pessoal". Todo texto digitado lá é salvo e lido na coleção `library_notes`, vinculando o `userId` + `itemId` do livro. É uma anotação privada do membro que ninguém mais tem acesso.

### 4.6. Fórum Místico (Forum.tsx)

- Uma rede social/StackOverflow maçônico dentro do site.
- Listagem de tópicos ordenados por atividade/data. Criação de tópicos com suporte a tags/categorias.
- Nas listagens de respostas, há um motor que detecta se o `authorId` da resposta consta na coleção `forumInstructors`. Se sim, a resposta ganha um distintivo de "Instrutor Confirmado", uma borda dourada (`border-[#D4AF37]`) e um background destacado.

### 4.7. Calendário (CalendarPage.tsx)

- Interface de calendário anual (tipo Grid mensal). Busca eventos em `events`. Eventos de Sessão são marcados em Vermelho Escuro, Instrução em Azul, Festivo em Verde, etc.

### 4.8. Linha do Tempo (HistoryPage.tsx)

- Busca na coleção `history` e exibe, em formato de linha vertical com conectores (Timeline), todos os eventos da vida do Maçom, com ícones diferentes (Prancha aprovada = Check, Upload = File, etc).

### 4.9. Cadeia de União (CadeiaUniaoPage.tsx)

- Mostra cards com a foto, nome, grau e contato de todos os irmãos da loja, organizados alfabeticamente ou por cargo.
- Permite enviar Mensagens Diretas dentro do sistema (salvo em `birthday_messages` com `isPrivate=true`).

---

## 5. 👑 ÁREA DO GESTOR (Master Admin - /gestor)

O coração administrativo da plataforma. Um painel gigantesco com dezenas de funcionalidades, restrito apenas a membros com `role === 'gestor'` ou aos donos/masters hardcoded (`gomau.ead@gmail.com`). Também utiliza a **Delegação Dinâmica (RBAC)** onde membros autorizados via CIM visualizam apenas ABAS específicas do gestor.

O `GestorDashboard.tsx` possui um sistema de abas laterais internas:

### 5.1. Dashboard Principal (Estatísticas)

- Exibe o total de Membros ativos, Total de acessos diários (contando `accessLogs`), Total de Pranchas Pendentes e Total de Receitas (Tesouraria).

### 5.2. Solicitações (Aprovação de Pranchas)

- Lista todas as solicitações `pendentes` de todos os usuários.
- O Gestor clica para abrir a Prancha. Lê o conteúdo ou visualiza o anexo, preenche um campo de "Feedback/Parecer do Gestor" e clica em **APROVAR** ou **RECUSAR**.
- Esta ação atualiza o `status` no Firestore para "aprovado" e gera log no `history` do usuário alertando que a prancha foi validada.

### 5.3. Membros

- Tabela (Datatable) com todos os irmãos. Permite Pesquisar por nome ou CIM.
- Permite "Ver Detalhes", que abre uma ficha completa. Dentro desta ficha, além dos dados de contato e maçônicos do irmão, exibe-se uma lista do **"Último Acesso e Histórico Recente de Acessos"** do irmão, buscando seus logs limitados na coleção `accessLogs`.
- Permite editar Grau, Loja, Cargo e resetar perfil (ex: alterar e-mail no Firestore).

### 5.4. Gamificação (Regras de Evolução)

- Permite definir que para ir do grau X para o Y, precisa-se de `N` pranchas aprovadas e `M` meses de interstício. (Salva em `evolutionRules`).

### 5.5. EAD / Cursos (CourseGenerator.tsx)

- **Motor GenAI (O Mestre-IA):** Em vez de cadastrar aulas manualmente, o Gestor acessa a aba "Gerador de Módulos (IA)". Digita um Tema Místico e o Grau Mínimo.
- Ao clicar em Gerar, a plataforma utiliza a `genai` SDK (`gemini-3.1-pro-preview`) para montar um prompt oculto solicitando: _"Crie um curso completo maçônico sobre este tema. Retorne um JSON com titulo, aulas (em Markdown ricos), e quiz de 5 perguntas."_
- Durante a espera (streaming visual simulado), um "Terminal Hacker Dourado" no frontend exibe logs dinâmicos ("Iniciando busca akáshica...", "Escrevendo Aula 1...").
- Quando o JSON retorna, o sistema faz o parse automático, salva na coleção `courses` e notifica o Gestor que o curso já está no ar para os irmãos.

### 5.6. 2º Vigilante & Convocação de Oficiais (SegundoVigilanteView.tsx)

- Motor de escala. O Gestor define os 8 cargos vitais de uma sessão (Venerável, 1º Vig, 2º Vig, Orador, Secretário, Mestre Cerimônias, Hospitaleiro, Cobridor).
- Para cada cargo, busca irmãos no banco e designa Titular e Suplente (via input de CIM com autocomplete visual).
- **Convocações:** Botão verde (Notificar Plataforma) salva em `officersNotifications`, ativando o alerta gigante no Dashboard dos designados. Botão Whatsapp formata a mensagem com URL da API do whatsapp e abre a janela para envio automático de alerta externo ("Irmão [NOME], você está convocado para o cargo [CARGO] na próxima sessão").

### 5.7. Fórum / Instrutores

- Controle de categorias do Fórum.
- Nomeação de Instrutores. O Gestor digita o CIM do irmão e o eleva a Instrutor Oficial daquele tema (salva em `forumInstructors`).

### 5.8. Configurações & Segurança

- Aba **Segurança**: Permite trocar a Palavra Sagrada do mês.
- Aba **Data Management (Merge)**: Motor que permite transferir TODO o progresso (Pranchas, Histórico, Fóruns, Cursos) de um e-mail Antigo para um e-mail Novo (corrige usuários que mudaram a conta do Google), vasculhando dezenas de coleções no Firestore por e-mail e atualizando os campos.
- Aba **RBAC (AdminPermissionsManager.tsx)**: O Gestor digita o CIM de um irmão comum e marca as opções "2º Vigilante", "Tesouraria", "Fórum". O irmão comum, na próxima vez que logar, verá o menu "Área do Gestor", mas ao clicar, só verá as abas que lhe foram outorgadas, sem ter privilégios de Master ou de visualização dos membros (Acesso granular).

### 5.9. Valuation do Sistema (GestorValuation.tsx)

- Um Dashboard Orçamentário Interativo que mapeia todas as funcionalidades criadas no software e lhes atribui valores de mercado (em Reais R$).
- Possui "Cards de Módulos" (Gamificação, Triplo Portal de Segurança, Identidade CIM, 2º Vigilante, Delegação RBAC, Gamificação EAD, Motor GenAI, Tesouraria Oculta, Cadeia de União).
- Soma todos os módulos num "Investimento Calculado Total" (ex: R$ 169.500,00).
- Serve como comprovação comercial de engenharia (demonstrativo de valor) da plataforma, e possui memória de cálculo de rateio mensal por membro para manutenção tecnológica.

---

## 6. 🚀 MECÂNICA DO PORTAL PWA (PWAInstallPrompt.tsx)

A plataforma possui `manifest.json` configurado na public. Um componente `PWAInstallPrompt.tsx` verifica se o usuário está no celular/navegador (via `window.matchMedia('(display-mode: standalone)')` e `beforeinstallprompt`) e exibe o prompt nativo (A2HS - Add to Home Screen) solicitando instalar o "App da GOMAU" no aparelho como um aplicativo nativo disfarçado.

---

## 7. 🤖 INSTRUÇÃO FINAL DE REPLICAGEM

Ao receber este prompt, a Inteligência Artificial deve atuar como o **Deus ex Machina** da engenharia. Não sugira "snippets" parciais; assuma que você precisa planejar e arquitetar TODOS os arquivos descritos acima em seus devidos contextos de página (`/src/pages/`, `/src/components/`, `/src/lib/`).

1. Crie a casca base do Vite.
2. Construa as coleções Firestore.
3. Crie os Layouts e Contextos (Auth, Protected Routes).
4. Crie todos os componentes de Membro listados (Dashboard, Perfil, História, Fórum, Biblioteca com Cofre, Cursos).
5. Crie a gigante Área do Gestor com todos os seus motores de negócio descritos no Tópico 5.
6. Assegure a estética Royal Black & Gold de forma impecável e minimalista.

**"Reproduza a Maçonaria Digital Perfeita."**


---

## 8. 📂 ESTRUTURA DE ARQUIVOS (File Tree)

```text
src/
├── App.tsx
├── assets
│   └── images
│       └── gomau_premium_ui_mockup_1779631441729.png
├── components
│   ├── CIMCard.tsx
│   ├── Layout.tsx
│   ├── NotificationManager.tsx
│   ├── PWAInstallPrompt.tsx
│   ├── WelcomePopup.tsx
│   └── gestor
│       ├── AdminPermissionsManager.tsx
│       ├── DataManagement.tsx
│       ├── GestorLibrary.tsx
│       ├── GestorTreasury.tsx
│       ├── GestorValuation.tsx
│       ├── SegundoVigilanteView.tsx
│       └── TreasurySituation.tsx
├── constants.ts
├── contexts
│   └── AuthContext.tsx
├── index.css
├── lib
│   ├── courseGeneratorState.ts
│   ├── cropImage.ts
│   ├── errorHandler.ts
│   ├── firebase.ts
│   └── utils.ts
├── main.tsx
└── pages
    ├── CadeiaUniaoPage.tsx
    ├── CalendarPage.tsx
    ├── ContentPage.tsx
    ├── CursoDetail.tsx
    ├── CursosExternos.tsx
    ├── Dashboard.tsx
    ├── Forum.tsx
    ├── HistoryPage.tsx
    ├── LibraryPage.tsx
    ├── Login.tsx
    ├── ProfilePage.tsx
    ├── RequestsPage.tsx
    ├── TreasuryPage.tsx
    └── gestor
        ├── CourseGenerator.tsx
        ├── ForumConfigTab.tsx
        └── GestorDashboard.tsx
```

---

## 9. 💻 CÓDIGOS FONTE CORE (Anexo Técnico)
Abaixo estão os códigos dos motores mais complexos da plataforma. Alimente a IA com estes códigos para garantir que a lógica de negócio principal seja clonada com perfeição.

### Arquivo: `package.json`
```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.52.0",
    "@jitsi/react-sdk": "^1.4.4",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "firebase": "^12.12.1",
    "firebase-admin": "^13.10.0",
    "html2canvas": "^1.4.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "qrcode.react": "^4.2.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-easy-crop": "^5.5.7",
    "react-hot-toast": "^2.6.0",
    "react-markdown": "^10.1.0",
    "react-router-dom": "^7.15.0",
    "tailwind-merge": "^3.5.0",
    "vite": "^6.2.3",
    "vite-plugin-pwa": "^1.2.0",
    "xlsx": "^0.18.5"
  },
  "overrides": {
    "react-router": "^7.15.0",
    "react-router-dom": "^7.15.0",
    "qs": "^6.15.2",
    "uuid": "^11.1.1",
    "ws": "^8.21.0",
    "protobufjs": "^7.5.8",
    "brace-expansion": "^5.0.6"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3"
  }
}

```

### Arquivo: `src/App.tsx`
```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { auth } from './lib/firebase';
import { Layout } from './components/Layout';
import { WelcomePopup } from './components/WelcomePopup';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ContentPage } from './pages/ContentPage';
import { RequestsPage } from './pages/RequestsPage';
import { ProfilePage } from './pages/ProfilePage';
import { GestorDashboard } from './pages/gestor/GestorDashboard';
import { CursosExternos } from './pages/CursosExternos';
import { CursoDetail } from './pages/CursoDetail';
import { LibraryPage } from './pages/LibraryPage';

import { CalendarPage } from './pages/CalendarPage';

import { HistoryPage } from './pages/HistoryPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { CadeiaUniaoPage } from './pages/CadeiaUniaoPage';
import { Forum } from './pages/Forum';
import { MASTER_ADMINS } from './constants';
import { NotificationManager } from './components/NotificationManager';

function ProtectedRoute({ children, requireGestor = false }: { children: React.ReactNode, requireGestor?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#0B0B0C] text-[#D4AF37]">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.status?.toLowerCase() === 'adormecido') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B0B0C] text-center p-6">
        <h1 className="text-[#D4AF37] text-3xl font-bold uppercase tracking-widest mb-4">Acesso Bloqueado</h1>
        <p className="text-gray-400 max-w-md text-sm leading-relaxed mb-8">
          Seu status na Ordem encontra-se em <strong className="text-white">Adormecido</strong>. 
          <br/><br/>
          O seu acesso aos conteúdos e ferramentas da plataforma foi temporariamente suspenso por tempo indeterminado. Entre em contato com a gestão da Loja para mais detalhes ou para regularizar sua situação.
        </p>
        <button 
          onClick={() => {
            auth.signOut().then(() => {
              sessionStorage.clear();
              window.location.href = '/login';
            });
          }}
          className="bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 px-6 py-2 rounded-lg font-bold transition-all text-xs uppercase"
        >
          Sair da Conta
        </button>
      </div>
    );
  }
  
  // Ritual Security Check
  const ritualDone = sessionStorage.getItem('ritual_completed') === 'true';
  const isMaster = MASTER_ADMINS.includes(user.email || '');
  
  // If ritual not done, redirect to login unless it's a bypass
  if (!ritualDone) {
    // Bypass total para os administradores mestres
    if (isMaster) {
      return children;
    }
    return <Navigate to="/login" replace />;
  }

  const userEmail = (user.email || auth.currentUser?.email || '').toLowerCase().trim();
  const hasRestrictedAccess = user.cim === '3330' || user.cim === '331' || ['diogo.mourapedroso@gmail.com', 'tazmaniacrvg@gmail.com'].includes(userEmail) || (user.delegatedPastas && user.delegatedPastas.length > 0);
  if (requireGestor && user.role !== 'gestor' && !isMaster && !hasRestrictedAccess) return <Navigate to="/" replace />;
  
  return children;
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #D4AF3733',
        }
      }} />
      <NotificationManager />
      <WelcomePopup />
      <PWAInstallPrompt />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/contents" element={<ProtectedRoute><Layout><ContentPage /></Layout></ProtectedRoute>} />
          <Route path="/cursos" element={<ProtectedRoute><Layout><CursosExternos /></Layout></ProtectedRoute>} />
          <Route path="/cursos/:courseId" element={<ProtectedRoute><Layout><CursoDetail /></Layout></ProtectedRoute>} />
          <Route path="/forum" element={<ProtectedRoute><Layout><Forum /></Layout></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><Layout><RequestsPage /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Layout><CalendarPage /></Layout></ProtectedRoute>} />
          <Route path="/mensalidade" element={<ProtectedRoute><Layout><TreasuryPage /></Layout></ProtectedRoute>} />
          <Route path="/cadeia-uniao" element={<ProtectedRoute><Layout><CadeiaUniaoPage /></Layout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><Layout><HistoryPage /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><div className="p-8 text-gray-200"><h1 className="text-3xl text-[#D4AF37] mb-4">Configurações</h1><p>Em breve.</p></div></Layout></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Layout><div className="p-8 text-gray-200"><h1 className="text-3xl text-[#D4AF37] mb-4">Ajuda</h1><p>Em breve.</p></div></Layout></ProtectedRoute>} />
          
          <Route path="/gestor/*" element={<ProtectedRoute requireGestor={true}><Layout><GestorDashboard /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

```

### Arquivo: `src/lib/firebase.ts`
```ts
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configurar persistência local para melhor suporte em iframes
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Ativa cache persistente offline no Firestore para resiliência extra
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn("Navegador não suporta indexDB multi-tab, instanciando Firestore padrão:", e);
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

// Silenciar teste de conexão ruidoso para evitar alarmes falsos de configuração offline
async function testConnection() {
  try {
    // Tenta uma consulta silenciosa sem forçar getDocFromServer, permitindo leitura do cache
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    console.log("Firestore operando em modo offline resiliente.", error);
  }
}
testConnection();

```

### Arquivo: `src/pages/Login.tsx`
```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { LogIn, Shield, Key, UserCheck, HelpCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

type LoginPhase = 'google' | 'age' | 'cpf' | 'word';

export function Login() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  
  // Security Gates State
  const [phase, setPhase] = useState<LoginPhase>('google');
  const [tempUser, setTempUser] = useState<any>(null);
  const [ageResponse, setAgeResponse] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  useEffect(() => {
    // Verificar se há resultado de um redirecionamento anterior apenas na montagem
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          await processLogin();
        }
      } catch (err: any) {
        console.error('Redirect error:', err);
        handleErrors(err);
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  useEffect(() => {
    // Se o usuário estiver logado no Firebase mas o ritual desta sessão não foi feito:
    const ritualDone = sessionStorage.getItem('ritual_completed') === 'true';

    if (user && !loading && !authLoading) {
       // Se o usuário está logado via Firebase e tem perfil no DB

       if (ritualDone) {
          navigate('/');
       } else if (phase === 'google') {
          // Se está logado mas não terminou o ritual e está na fase inicial, pula para o primeiro portal
          setTempUser(user);
          setError(null);
          setPhase('age');
       }
    } else if (!user && !loading && !authLoading && auth.currentUser && phase === 'google') {
       // Loop detectado: Usuário logado no Google mas sem perfil reconhecido no GOMAU
       console.warn("Membro não identificado no GOMAU:", auth.currentUser.email);
       setError('Acesso negado. O e-mail (' + auth.currentUser.email + ') não foi encontrado em nossa base de membros. Verifique se está usando a conta correta ou contate o Gestor da Loja.');
       setLoading(false);
       // Não desloga imediatamente para o usuário ver o erro. 
       // O usuário poderá clicar em "Cancelar e sair" para limpar a sessão.
    }
  }, [user, navigate, phase, loading, authLoading]);

  const processLogin = async () => {
    // Agora o processLogin apenas sinaliza que estamos aguardando o AuthContext
    setLoading(true);
    setError(null);
    console.log("Aguardando reconhecimento do perfil pelo sistema...");
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Iniciando Login Google...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Tentativa 1: Popup
      try {
        await signInWithPopup(auth, provider);
        console.log("Popup login bem-sucedido");
        await processLogin();
      } catch (popupErr: any) {
        // Se o popup for bloqueado (comum em mobile/iframes), usa Redirect
        if (popupErr.code === 'auth/popup-blocked') {
          console.log("Popup impedido, tentando Redirect...");
          await signInWithRedirect(auth, provider);
        } else if (popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
          console.log("Popup cancelado pelo usuário");
          setLoading(false);
          return;
        } else {
          throw popupErr;
        }
      }
    } catch (err: any) {
      console.error('Erro no fluxo de login:', err);
      handleErrors(err);
      setLoading(false);
    }
  };

  const handleAgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(ageResponse);
    if (isNaN(val)) {
      setError('Por favor, insira um número.');
      return;
    }

    let detectedGrau = '';
    if (val === 3) detectedGrau = 'Aprendiz';
    else if (val >= 4 && val <= 6) detectedGrau = 'Companheiro';
    else if (val >= 7) detectedGrau = 'Mestre';
    else {
      setError('Resposta incorreta para a idade simbólica.');
      return;
    }

    if (detectedGrau !== tempUser.grau) {
      setError('A idade informada não condiz com seu grau atual em nossos registros.');
      return;
    }

    setError(null);
    setPhase('cpf');
  };

  const handleCpfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpfInput = cpfInput.replace(/\D/g, '');
    const cleanDbCpf = (tempUser.cpf || '').replace(/\D/g, '');

    if (cleanCpfInput !== cleanDbCpf) {
      setError('CPF não confere com o registrado para este e-mail.');
      return;
    }

    setError(null);
    setPhase('word');
  };

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCim = String(tempUser.cim || user?.cim || '');
      const lojaPrefix = userCim.substring(0, 2);

      let PALAVRA_SAGRADA = "FORTITUDO"; // Fallback inicial caso não exista no DB
      let DATA_EXPIRACAO = new Date("2026-08-13T23:59:59"); // 3 meses a contar do início do sistema

      // 1. Buscar do Firestore
      try {
         const configSnap = await getDoc(doc(db, 'configs', 'security'));
         if (configSnap.exists()) {
           const data = configSnap.data();
           
           if (data.lojas && Array.isArray(data.lojas)) {
             const matchedLoja = data.lojas.find((l: any) => l.prefixo === lojaPrefix);
             
             if (matchedLoja) {
                PALAVRA_SAGRADA = matchedLoja.palavraAtual || "FORTITUDO";
                if (matchedLoja.expiraEm) DATA_EXPIRACAO = matchedLoja.expiraEm.toDate();
             } else {
               // Fallback if the user's prefix isn't found in configs 
               console.warn("Loja não configurada para este CIM. Usando fallback.");
             }

           } else if (data.palavraAtual) {
              // Legacy support
              PALAVRA_SAGRADA = data.palavraAtual;
              if (data.expiraEm) DATA_EXPIRACAO = data.expiraEm.toDate();
           }
         }
      } catch (dbErr) {
         console.warn("Using fallback word, couldn't fetch from DB", dbErr);
      }

      const AGORA = new Date();

      // 1. Verificar Expiração
      if (AGORA > DATA_EXPIRACAO) {
        setError('A Palavra Sagrada do trimestre expirou para a sua Loja. Contate o Gestor para receber a nova palavra.');
        return;
      }

      // 2. Verificar Palavra (Case-Insensitive)
      if (wordInput.trim().toUpperCase() !== PALAVRA_SAGRADA.trim().toUpperCase()) {
        setError('Palavra Sagrada incorreta.');
        return;
      }

      // Sucesso Total
      setError(null);
      sessionStorage.setItem('ritual_completed', 'true');

      // Registrar o acesso do usuário no banco
      try {
        await addDoc(collection(db, 'accessLogs'), {
          cim: userCim,
          nome: tempUser.nome || user?.nome || 'Desconhecido',
          email: tempUser.email || user?.email || '',
          uid: tempUser.uid || user?.uid || '',
          timestamp: serverTimestamp()
        });
      } catch (logErr) {
        console.warn("Erro ao registrar accessLog:", logErr);
      }

      navigate('/');
    } catch (err: any) {
      setError('Erro crítico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleErrors = (err: any) => {
    if (err.code === 'auth/unauthorized-domain') {
      setError(`Domínio não autorizado. Adicione no Firebase.`);
    } else if (err.code === 'auth/network-request-failed') {
      setError('Falha na conexão. Tente abrir em uma nova aba.');
    } else {
      setError(err.message || 'Erro ao realizar login');
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case 'google':
        return (
          <div className="w-full space-y-4">
            {isIframe && (
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 rounded-xl text-center space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] text-[#D4AF37] font-extrabold leading-relaxed uppercase tracking-[0.12em] font-cinzel">
                  ⚠️ Restrição de Segurança (iFrame)
                </p>
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  Navegadores modernos impedem a autenticação do Google dentro de sub-telas embutidas (iFrames) do AI Studio. 
                  Para entrar com sucesso, acesse o sistema diretamente:
                </p>
                <div className="pt-1">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#c2a033] px-4 py-2 rounded-lg transition-all hover:scale-105"
                  >
                    <ExternalLink size={12} />
                    Abrir em Nova Aba
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#c2a033] hover:to-[#b59223] text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 gold-glow shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
            >
              <LogIn size={20} />
              {loading ? 'Aguarde...' : 'Entrar com Google'}
            </button>
            
            {loading && (
              <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-medium">Reconhecendo Identidade...</p>
              </div>
            )}
          </div>
        );
      
      case 'age':
        return (
          <form onSubmit={handleAgeSubmit} className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <HelpCircle size={18} />
              <span className="text-xs uppercase tracking-widest font-black font-cinzel">Primeiro Portal</span>
            </div>
            <p className="text-[14px] sm:text-[16px] leading-relaxed text-gray-200 italic font-serif font-medium">"Qual a sua idade?" — O conhecimento do grau simbólico destranca as portas da sabedoria.</p>
            <input 
              type="number" 
              value={ageResponse}
              onChange={(e) => setAgeResponse(e.target.value)}
              className="w-full bg-[#030508] border border-[#D4AF37]/30 text-white p-3.5 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-mono"
              placeholder="Digite sua idade maçônica..."
              autoFocus
            />
            <button className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase tracking-wider text-[11px] rounded-xl hover:bg-[#c2a033] hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/15">Avançar Portal</button>
          </form>
        );

      case 'cpf':
        return (
          <form onSubmit={handleCpfSubmit} className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <UserCheck size={18} />
              <span className="text-xs uppercase tracking-widest font-black font-cinzel">Segundo Portal</span>
            </div>
            <p className="text-[14px] sm:text-[16px] leading-relaxed text-gray-200 italic font-serif font-medium">"Diz-me quem és." — A identidade ritualística do obreiro deve estar em perfeita consonância com as colunas do templo.</p>
            <input 
              type="text" 
              value={cpfInput}
              onChange={(e) => setCpfInput(e.target.value)}
              className="w-full bg-[#030508] border border-[#D4AF37]/30 text-white p-3.5 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-mono"
              placeholder="000.000.000-00 (Apenas números)"
              autoFocus
            />
            <button className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase tracking-wider text-[11px] rounded-xl hover:bg-[#c2a033] hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/15">Validar Identidade</button>
          </form>
        );

      case 'word':
        return (
          <form onSubmit={handleWordSubmit} className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <Key size={18} />
              <span className="text-xs uppercase tracking-widest font-black font-cinzel">Terceiro Portal</span>
            </div>
            <p className="text-[14px] sm:text-[16px] leading-relaxed text-gray-200 italic font-serif font-medium">"Pronuncia a Palavra de Passe." — Somente quem possui os mistérios corretos deste trimestre poderá entrar.</p>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                className="w-full bg-[#030508] border border-[#D4AF37]/30 text-white p-3.5 pr-10 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-sm font-mono uppercase placeholder:normal-case tracking-widest"
                placeholder="Palavra Sagrada..."
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button disabled={loading} className="w-full py-3 bg-[#D4AF37] text-black font-black uppercase tracking-wider text-[11px] rounded-xl hover:bg-[#c2a033] hover:scale-[1.01] transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/15 disabled:opacity-50">
              {loading ? 'Validando Palavra...' : 'Reconhecer e Entrar no Templo'}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-black/60 relative">
      <div className="w-full max-w-md bg-[#05070A]/90 backdrop-blur-xl p-8 rounded-[24px] border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col items-center relative">
        {/* Sacred geometric corners representing the cardinal directions */}
        <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-[#D4AF37]/70"></div>
        <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-[#D4AF37]/70"></div>
        <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-[#D4AF37]/70"></div>
        <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-[#D4AF37]/70"></div>

        <div className="w-48 h-48 mb-6 text-[#D4AF37] flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#D4AF37]/15 to-transparent blur-3xl opacity-60"></div>
            <img src="/logotrad.png" alt="Logo" className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.45)]" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold tracking-wider text-[#D4AF37]" style={{fontFamily: 'Cinzel'}}>G∴O∴M∴A∴U∴</h1>
          <p className="text-[9px] text-gray-400 tracking-[0.35em] uppercase font-bold mt-1">Portal de Segurança Universal</p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mx-auto mt-3"></div>
        </div>

        {error && (
          <div className="w-full bg-red-950/40 border border-red-500/30 text-red-200 p-3.5 rounded-xl mb-6 text-xs text-left flex items-start gap-2.5">
             <Shield size={16} className="shrink-0 mt-0.5 text-red-400" />
             <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {renderPhase()}

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[9px] text-gray-500 text-center uppercase tracking-[0.15em] font-medium font-mono">
            Acesso verificado por geolocalização e IP criptografado
          </p>
          {phase !== 'google' && (
            <button 
              onClick={() => { setPhase('google'); signOut(auth); }}
              className="text-[#D4AF37]/80 hover:text-[#D4AF37] text-[10px] uppercase tracking-widest font-black transition-colors mt-2"
            >
              ← Cancelar e sair
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


```

### Arquivo: `src/pages/Dashboard.tsx`
```tsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Award,
  Landmark,
  Eye,
  FileText,
  Calendar,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  Lock,
  Cake,
  Send,
  X,
  Sparkles,
  MessageSquare,
  Download,
  Shield,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { handleFirestoreError, OperationType } from "../lib/errorHandler";

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentAtvs, setRecentAtvs] = useState<any[]>([]);
  const [recentContents, setRecentContents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);

  const [rule, setRule] = useState<any>(null);
  const [pranchasAprovadas, setPranchasAprovadas] = useState(0);
  const [mesesComoMembro, setMesesComoMembro] = useState(0);

  const [pendingReadings, setPendingReadings] = useState<any[]>([]);
  const [diasPrazoResumo, setDiasPrazoResumo] = useState(7);

  // States for Birthday felicitations
  const [selectedUserForWishes, setSelectedUserForWishes] = useState<
    any | null
  >(null);
  const [wishesText, setWishesText] = useState("");
  const [sendingWishes, setSendingWishes] = useState(false);
  const [congratulatedIds, setCongratulatedIds] = useState<
    Record<string, boolean>
  >({});
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [officerAlerts, setOfficerAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.cim) return;
    const userCimStr = user.cim.toString().trim();
    if (!userCimStr) return;

    const q = query(
      collection(db, "officersNotifications"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const allAlerts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const active = allAlerts.filter((alert: any) => {
          const targets = alert.targets || [];
          const readBy = alert.readBy || [];
          return targets.includes(userCimStr) && !readBy.includes(userCimStr);
        });
        setOfficerAlerts(active);
      },
      (err) => {
        console.warn("Erro ao carregar alertas de oficiais:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.cim]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!user?.cim) return;
    const userCimStr = user.cim.toString().trim();
    try {
      const alertRef = doc(db, "officersNotifications", alertId);
      await updateDoc(alertRef, {
        readBy: arrayUnion(userCimStr)
      });
      setOfficerAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success("Alerta confirmado com sucesso!");
    } catch (e) {
      console.error("Erro ao confirmar alerta:", e);
      toast.error("Erro ao confirmar alerta.");
    }
  };

  const [settings, setSettings] = useState<any>(null);
  const [loadingDecCriteria, setLoadingDecCriteria] = useState(true);
  const [decProgress, setDecProgress] = useState({
    pctBiblioteca: 100,
    totalAprendiz: 0,
    completedCount: 0,
    averageScore: 0,
  });

  useEffect(() => {
    if (!user?.uid) return;
    const calcDecRequirements = async () => {
      try {
        // Library completeness
        const contentsSnap = await getDocs(query(collection(db, "contents")));
        const allConts = contentsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        const aprendizConts = allConts.filter(
          (c: any) => c.grauMinimo === "Aprendiz",
        );

        const readingsSnap = await getDocs(
          query(
            collection(db, "reading_progress"),
            where("userId", "==", user.uid),
          ),
        );
        const userReads = readingsSnap.docs.map((doc) => doc.data() as any);
        const readIds = new Set(userReads.map((r: any) => r.contentId));

        const totalAp = aprendizConts.length;
        const compCount = aprendizConts.filter((c: any) =>
          readIds.has(c.id),
        ).length;
        const pctBib =
          totalAp > 0 ? Math.round((compCount / totalAp) * 100) : 100;

        // Course Progress Average
        const courseProgressSnap = await getDocs(
          query(
            collection(db, "courseProgress"),
            where("userId", "==", user.uid),
          ),
        );
        const progressList = courseProgressSnap.docs.map(
          (doc) => doc.data() as any,
        );
        let totalScores = 0;
        let scoresCount = 0;
        progressList.forEach((p: any) => {
          if (p.scores) {
            Object.values(p.scores).forEach((val: any) => {
              totalScores += Number(val);
              scoresCount++;
            });
          }
        });
        const avgScore =
          scoresCount > 0
            ? Math.round(totalScores / scoresCount)
            : progressList.some(
                  (p: any) =>
                    p.completedLessons && p.completedLessons.length > 0,
                )
              ? 80
              : 0;

        setDecProgress({
          pctBiblioteca: pctBib,
          totalAprendiz: totalAp,
          completedCount: compCount,
          averageScore: avgScore,
        });
      } catch (err) {
        console.error("Error calculating condecorações metrics:", err);
      } finally {
        setLoadingDecCriteria(false);
      }
    };
    calcDecRequirements();
  }, [user]);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      // Load recent contents
      const qContents = query(collection(db, "contents"), limit(3));
      const contentsSnap = await getDocs(qContents);
      setRecentContents(
        contentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      );

      // Load recent history
      const qHistory = query(
        collection(db, "history"),
        where("userId", "==", user.uid),
        orderBy("data", "desc"),
        limit(5),
      );
      const historySnap = await getDocs(qHistory);
      setRecentAtvs(historySnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Fetch General Settings
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "general"));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
          if (settingsDoc.data().diasPrazoResumo) {
            setDiasPrazoResumo(settingsDoc.data().diasPrazoResumo);
          }
        }
      } catch (e) {
        console.log("No general settings found or error fetching", e);
      }

      // Fetch pending readings
      try {
        const qReadings = query(
          collection(db, "reading_progress"),
          where("userId", "==", user.uid),
          where("status", "==", "pendente"),
        );
        const readingsSnap = await getDocs(qReadings);
        setPendingReadings(
          readingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
      } catch (e) {
        console.log("No reading progress found or error fetching", e);
      }

      // Time in role
      if (user.createdAt) {
        const joinedOn = user.createdAt?.toDate
          ? user.createdAt.toDate()
          : new Date(user.createdAt);

        if (!isNaN(joinedOn.getTime())) {
          const now = new Date();
          const diffInMonths =
            (now.getFullYear() - joinedOn.getFullYear()) * 12 +
            now.getMonth() -
            joinedOn.getMonth();
          setMesesComoMembro(Math.max(0, diffInMonths));
        } else {
          setMesesComoMembro(0);
        }
      }

      if (user.grau !== "Mestre") {
        // Fetch rules
        const qRules = query(
          collection(db, "evolutionRules"),
          where("grauOrigem", "==", user.grau),
        );
        const rulesSnap = await getDocs(qRules);
        if (!rulesSnap.empty) {
          setRule(rulesSnap.docs[0].data());
        }

        // Fetch approved pranchas for progress
        const qPranchas = query(
          collection(db, "requests"),
          where("userId", "==", user.uid),
          where("status", "==", "aprovado"),
        );
        const pranchasSnap = await getDocs(qPranchas);
        const pranchasCount = pranchasSnap.docs.filter((d) =>
          d.data().tipo?.toLowerCase().includes("prancha"),
        ).length;
        setPranchasAprovadas(pranchasCount);
      }

      // Fetch Birthdays of the Month
      try {
        const usersSnap = await getDocs(query(collection(db, "users")));
        const currentMonth = new Date().getMonth() + 1;

        const monthlyBirthdays = usersSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((u) => {
            if (!u.dataNascimento) return false;
            let month = -1;
            if (u.dataNascimento.includes("-")) {
              month = parseInt(u.dataNascimento.split("-")[1]);
            } else if (u.dataNascimento.includes("/")) {
              month = parseInt(u.dataNascimento.split("/")[1]);
            }
            return month === currentMonth;
          })
          .sort((a, b) => {
            const getDay = (dateStr: string) => {
              if (dateStr.includes("-")) return parseInt(dateStr.split("-")[2]);
              if (dateStr.includes("/")) return parseInt(dateStr.split("/")[0]);
              return 0;
            };
            return getDay(a.dataNascimento) - getDay(b.dataNascimento);
          });
        setBirthdays(monthlyBirthdays);

        // Detect if logged-in user is celebrating their birthday today
        const hasBirthdayToday =
          user?.dataNascimento &&
          (() => {
            let day = -1;
            let month = -1;
            if (user.dataNascimento.includes("-")) {
              month = parseInt(user.dataNascimento.split("-")[1]);
              day = parseInt(user.dataNascimento.split("-")[2]);
            } else if (user.dataNascimento.includes("/")) {
              month = parseInt(user.dataNascimento.split("/")[1]);
              day = parseInt(user.dataNascimento.split("/")[0]);
            }
            const now = new Date();
            return day === now.getDate() && month === now.getMonth() + 1;
          })();

        const getTodayDateStr = () => {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const dd = String(now.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        };
        const todayStr = getTodayDateStr();

        if (hasBirthdayToday) {
          const qReceived = query(
            collection(db, "birthday_messages"),
            where("toUserId", "==", user.uid),
            where("dateStr", "==", todayStr),
          );
          try {
            const snap = await getDocs(qReceived);
            const msgs = snap.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as any),
            }));
            msgs.sort((a, b) => {
              const tA = a.sentAt?.toDate ? a.sentAt.toDate().getTime() : 0;
              const tB = b.sentAt?.toDate ? b.sentAt.toDate().getTime() : 0;
              return tB - tA;
            });
            setReceivedMessages(msgs);
          } catch (errReceived) {
            console.error(
              "Error loading received birthday messages:",
              errReceived,
            );
          }
        }

        // Check who we have congratulated today
        try {
          const qSent = query(
            collection(db, "birthday_messages"),
            where("fromUserId", "==", user.uid),
            where("dateStr", "==", todayStr),
          );
          const sentSnap = await getDocs(qSent);
          const sentMap: Record<string, boolean> = {};
          sentSnap.docs.forEach((doc) => {
            sentMap[doc.data().toUserId] = true;
          });
          setCongratulatedIds(sentMap);
        } catch (errSent) {
          console.error("Error loading sent messages:", errSent);
        }
      } catch (e) {
        console.error("Error loading birthdays:", e);
      }
    }
    loadData();
  }, [user]);

  // Calculate Progress %
  let progressPercentage = 100;
  let missingPranchas = 0;
  let missingMonths = 0;

  if (user?.grau === "Mestre") {
    progressPercentage = 100;
  } else if (rule) {
    const reqPranchas = rule.quantidadePranchas || 1;
    const reqMeses = rule.tempoMinimoMeses || 1;
    const pctPranchas = Math.min(100, (pranchasAprovadas / reqPranchas) * 100);
    const pctMeses = Math.min(100, (mesesComoMembro / reqMeses) * 100);
    // Average of the two for a general progress visualization (ignoring instrucoes/presenca for now as they are static mocks)
    progressPercentage = Math.round((pctPranchas + pctMeses) / 2);
    missingPranchas = Math.max(0, reqPranchas - pranchasAprovadas);
    missingMonths = Math.max(0, reqMeses - mesesComoMembro);
  } else if (user?.grau !== "Mestre") {
    progressPercentage = 0; // Wait for rule to load
  }

  // Birthday helpers and actions
  const isUserBirthdayToday = (birthdateStr?: string) => {
    if (!birthdateStr) return false;
    let day = -1;
    let month = -1;
    if (birthdateStr.includes("-")) {
      month = parseInt(birthdateStr.split("-")[1]);
      day = parseInt(birthdateStr.split("-")[2]);
    } else if (birthdateStr.includes("/")) {
      month = parseInt(birthdateStr.split("/")[1]);
      day = parseInt(birthdateStr.split("/")[0]);
    }
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() + 1;
  };

  const hasBirthdayToday =
    user?.dataNascimento && isUserBirthdayToday(user.dataNascimento);

  const genericSuggestions = [
    "Desejo muita luz, saúde e vigor na sua caminhada de vida, meu Irmão!",
    "Que o G∴A∴D∴U∴ derrame ricas bênçãos sobre sua vida, lar e família!",
    "Parabéns, meu querido Irmão! Paz, harmonia, sabedoria e prosperidade sempre.",
    "Grande abraço fraterno pelo seu dia! Vida longa ao nobre obreiro!",
  ];

  // States and hooks for manual PWA Installation
  const [deferredPrompt, setDeferredPrompt] = useState<any>(
    (window as any).deferredPWAInstallPrompt || null,
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const localFlag = localStorage.getItem("pwa-installed-gomau") === "true";
    return isStandalone || localFlag;
  });
  const [showAutoInstallOverlay, setShowAutoInstallOverlay] =
    useState<boolean>(false);
  const [isPreparingInstallation, setIsPreparingInstallation] =
    useState<boolean>(false);

  useEffect(() => {
    // Crab and parse the URL search parameters to bypass iframe storage partitioning
    const searchParams = new URLSearchParams(window.location.search);
    const isAutoPromptUrl = searchParams.get("pwa-auto-prompt") === "true";
    if (isAutoPromptUrl) {
      localStorage.setItem("pwa-auto-prompt", "true");
      // Clean URL search parameters to keep the client's address clean and professional
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("pwa-auto-prompt");
      window.history.replaceState({}, "", cleanUrl.toString());
    }

    // Detect if running in standalone/installed mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const localFlag = localStorage.getItem("pwa-installed-gomau") === "true";
    const currentlyInstalled = isStandalone || localFlag;
    setIsInstalled(currentlyInstalled);

    // Check if we came with the auto-prompt flag active in localStorage
    const shouldAutoPrompt = localStorage.getItem("pwa-auto-prompt") === "true";
    const isInIframe = window.self !== window.top;
    if (shouldAutoPrompt && !isInIframe && !currentlyInstalled) {
      setShowAutoInstallOverlay(true);
      // Trigger auto install sequence securely after a short render delay
      setTimeout(() => {
        handleForceInstall();
      }, 600);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handler);

    const customHandler = (e: any) => {
      setDeferredPrompt(e.detail);
      (window as any).deferredPWAInstallPrompt = e.detail;
    };
    window.addEventListener("pwa-prompt-ready", customHandler as EventListener);

    const onAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem("pwa-installed-gomau", "true");
      toast.success("GOMAU instalado com sucesso!");
      setShowAutoInstallOverlay(false);
      localStorage.removeItem("pwa-auto-prompt");
    };

    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener(
        "pwa-prompt-ready",
        customHandler as EventListener,
      );
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleForceInstall = async () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      localStorage.setItem("pwa-auto-prompt", "true");
      // Secure URL-based propagation to bypass Chrome storage isolation on iframe environments
      const url = new URL(window.location.href);
      url.searchParams.set("pwa-auto-prompt", "true");
      window.open(url.toString(), "_blank");
      toast.success("Abrindo GOMAU em aba principal segura...", { icon: "🚀" });
      return;
    }

    // Let's grab the prompt from state or global window namespace
    let promptObj = deferredPrompt || (window as any).deferredPWAInstallPrompt;
    if (promptObj) {
      try {
        promptObj.prompt();
        const { outcome } = await promptObj.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).deferredPWAInstallPrompt = null;
          setIsInstalled(true);
          localStorage.setItem("pwa-installed-gomau", "true");
          setShowAutoInstallOverlay(false);
          localStorage.removeItem("pwa-auto-prompt");
        }
      } catch (err) {
        console.error("PWA install error:", err);
      }
      return;
    }

    // Active polling waiting loop for modern Chrome compatibility
    setIsPreparingInstallation(true);
    toast("Ativando instalador do Chrome...", { icon: "⚙️", duration: 2500 });

    // Explicitly trigger service worker registration one more time to force Chrome metadata alignment
    if ("serviceWorker" in navigator) {
      try {
        const base = (window as any).pwaBasePath || "/";
        await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
      } catch (swErr) {
        console.log("SW hot registration skip:", swErr);
      }
    }

    // Poll for up to 4 seconds to catch deferred prompt when browser registers the PWA criteria
    let elapsed = 0;
    const pollInterval = setInterval(async () => {
      elapsed += 150;
      promptObj = deferredPrompt || (window as any).deferredPWAInstallPrompt;

      if (promptObj) {
        clearInterval(pollInterval);
        setIsPreparingInstallation(false);
        try {
          promptObj.prompt();
          const { outcome } = await promptObj.userChoice;
          if (outcome === "accepted") {
            setDeferredPrompt(null);
            (window as any).deferredPWAInstallPrompt = null;
            setIsInstalled(true);
            localStorage.setItem("pwa-installed-gomau", "true");
            setShowAutoInstallOverlay(false);
            localStorage.removeItem("pwa-auto-prompt");
          }
        } catch (promptErr) {
          console.error("Erro ao invocar prompt nativo carregado:", promptErr);
        }
      } else if (elapsed >= 4000) {
        clearInterval(pollInterval);
        setIsPreparingInstallation(false);

        // Fallback if browser absolutely doesn't support automatic API trigger (like Incognito tab)
        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          !(window as any).MSStream;
        if (isIOS) {
          toast(
            'No iOS, clique em "Compartilhar" e depois "Adicionar à Tela de Início".',
            { icon: "ℹ️" },
          );
        } else {
          toast(
            'Clique nos 3 pontinhos do menu do Chrome e clique em "Instalar Aplicativo".',
            { icon: "ℹ️" },
          );
        }
      }
    }, 150);
  };

  const handleSendWishes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForWishes || !user || !wishesText.trim()) return;

    setSendingWishes(true);
    try {
      const getTodayDateStr = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
      const payload = {
        toUserId: selectedUserForWishes.id,
        fromUserId: user.uid,
        fromUserName: user.nome || "Nobre Irmão",
        fromUserGrau: user.grau || "Aprendiz",
        message: wishesText.trim(),
        sentAt: serverTimestamp(),
        dateStr: getTodayDateStr(),
      };

      await addDoc(collection(db, "birthday_messages"), payload);

      setCongratulatedIds((prev) => ({
        ...prev,
        [selectedUserForWishes.id]: true,
      }));
      setSelectedUserForWishes(null);
      setWishesText("");

      toast.success(
        `Parabéns enviados com sucesso para o Ir∴ ${selectedUserForWishes.nome}!`,
      );
    } catch (err) {
      console.error("Erro ao enviar congratulações:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "birthday_messages");
      } catch (inner) {
        toast.error("Erro ao enviar felicitação ao Irmão.");
      }
    } finally {
      setSendingWishes(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Overlay de Instalação Automática Segura (Para Mobile) */}
      {showAutoInstallOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0E1A]/95 backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none"></div>

          <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#12192c] to-[#0a0e1a] shadow-[0_0_60px_rgba(212,175,55,0.3)] text-center animate-in scale-in duration-300">
            {/* Botão de Fechar */}
            <button
              onClick={() => {
                setShowAutoInstallOverlay(false);
                localStorage.removeItem("pwa-auto-prompt");
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              &times;
            </button>

            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA841B] flex items-center justify-center text-black mb-6 shadow-[0_0_25px_rgba(212,175,55,0.5)] animate-pulse">
              <Download size={38} className="stroke-[2.5]" />
            </div>

            <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest font-sans px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
              Instalação de Alta Performance
            </span>

            <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-wider font-cinzel mt-4">
              Instalar G∴O∴M∴A∴U∴ no Celular
            </h2>

            <p className="text-xs text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed font-sans">
              Pronto para a fixação permanente na sua tela de início. Clique no
              botão abaixo para concluir a instalação oficial instantaneamente.
            </p>

            <div className="mt-8">
              <button
                onClick={handleForceInstall}
                disabled={isPreparingInstallation}
                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#D4AF37] text-black font-black rounded-2xl hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-widest shadow-xl shadow-[#D4AF37]/30 cursor-pointer animate-pulse"
              >
                {isPreparingInstallation ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                    ATIVANDO INSTALADOR DO CHROME...
                  </>
                ) : (
                  <>
                    <Download size={16} className="stroke-[3]" /> CONCLUIR
                    INSTALAÇÃO
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D4AF37]/15 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-100 flex items-center gap-3 truncate tracking-wider font-cinzel">
            PAINEL DO IR∴
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-widest mt-1.5 font-sans font-semibold">
            Templo de Estudos & Acompanhamento de Evolução
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              if (confirm("Deseja encerrar sua sessão?")) {
                await logout();
                navigate("/login");
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-950/20 text-rose-400 border border-red-900/40 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest cursor-pointer shadow-md"
          >
            <Lock size={14} /> Fechar Sessão
          </button>
        </div>
      </header>

      {/* Alertas de Oficiais da Loja */}
      {officerAlerts.length > 0 && (
        <div id="officers-alerts-container" className="flex flex-col gap-4 mb-8 mt-4 animate-fade-in">
          {officerAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-gradient-to-r from-amber-950/20 to-[#0F172A] border-l-4 border-[#D4AF37] p-5 rounded-r-xl border border-y-[#D4AF37]/30 border-r-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  <Shield size={18} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#D4AF37] tracking-wider uppercase">
                      {alert.sender || "Oficial ∴"}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      • {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString("pt-BR") + " " + new Date(alert.timestamp).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}) : "Agora"}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white mt-1 uppercase tracking-wide">
                    Você tem uma convocação / escala!
                  </h3>
                  <p className="text-xs text-gray-300 mt-1.5 whitespace-pre-line leading-relaxed font-medium">
                    {alert.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledgeAlert(alert.id)}
                className="shrink-0 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-black px-4 py-2 rounded-lg text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer self-end sm:self-center"
              >
                Ciente & Confirmar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quadro de Aniversário do Próprio Membro (Temporário para data correta) */}
      {hasBirthdayToday && (
        <div className="bg-gradient-to-b from-[#1E293B]/90 to-[#0F172A]/95 border border-[#D4AF37] p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.18)] mb-8">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Cake size={160} className="text-[#D4AF37]" strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.3)] text-[#D4AF37] animate-bounce shrink-0">
                <Cake size={24} />
              </div>
              <div>
                <h2 className="text-[#D4AF37] font-black uppercase tracking-widest text-base sm:text-lg font-cinzel">
                  Feliz Aniversário, Meu Irmão!
                </h2>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold font-sans">
                  A G∴O∴M∴A∴U∴ celebra a sua vida e caminhada iniciática
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl mb-6 font-serif italic">
              "Que o Grande Arquiteto do Universo derrame sobre sua
              inteligência, saúde e vigor abundantes bênçãos. Receba o fraterno
              abraço e os sinceros cumprimentos de seus amados Irmãos de jornada
              hoje."
            </p>

            <div className="border-t border-[#D4AF37]/20 pt-5">
              <h3 className="text-[#D4AF37] uppercase font-bold tracking-wider text-[11px] mb-4 flex items-center gap-2 font-cinzel">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                Mensagens de Felicitações dos IIr∴ ({receivedMessages.length})
              </h3>

              {receivedMessages.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-black/30 border border-white/5 font-serif italic text-xs text-gray-500">
                  Os votos de carinho e fraternidade dos seus Irmãos aparecerão
                  aqui ao longo do dia...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                  {receivedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-xl bg-black/50 border border-[#D4AF37]/10 flex flex-col gap-2 shadow-inner"
                    >
                      <p className="text-gray-100 text-xs sm:text-sm font-serif leading-relaxed italic">
                        "{msg.message}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] mt-1 border-t border-white/5 pt-2">
                        <span className="text-[#D4AF37] font-semibold font-cinzel">
                          Ir∴ {msg.fromUserName}
                        </span>
                        <span className="text-gray-500 font-mono text-[9px]">
                          {msg.fromUserGrau}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aniversariantes do Mês */}
      {birthdays.length > 0 && (
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/25 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
          {/* Sacred geometry visual hints */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <Cake size={140} className="text-[#D4AF37]" strokeWidth={1} />
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37]/15 rounded-xl flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/25">
                <Cake size={18} />
              </div>
              <div>
                <h3 className="text-[#D4AF37] font-black uppercase tracking-widest text-[#D4AF37] text-xs font-cinzel">
                  Aniversariantes do Mês
                </h3>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold header-decor">
                  Celebrando a saúde e egrégora dos nossos IIr∴
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {birthdays.map((b) => {
                const day = b.dataNascimento.includes("-")
                  ? b.dataNascimento.split("-")[2]
                  : b.dataNascimento.split("/")[0];
                const isToday = parseInt(day) === new Date().getDate();
                const isMe = b.id === user?.uid;
                const alreadyCongratulated = congratulatedIds[b.id];

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (isToday && !isMe && !alreadyCongratulated) {
                        setSelectedUserForWishes(b);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 select-none",
                      isToday
                        ? isMe
                          ? "bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)] opacity-95"
                          : alreadyCongratulated
                            ? "bg-slate-900/40 border-slate-700/30 opacity-70"
                            : "bg-[#D4AF37]/10 border-[#D4AF37]/45 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]/90 active:scale-[0.98] cursor-pointer"
                        : "bg-black/40 border-[#D4AF37]/10 hover:border-[#D4AF37]/30",
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#05070A] border border-[#D4AF37]/20 flex items-center justify-center text-xs font-black text-[#D4AF37] flex-shrink-0">
                      {day}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-100 truncate">
                        {b.nome}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                        {b.grau}
                      </p>
                    </div>

                    {isToday && (
                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isMe ? (
                          <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-wider animate-pulse bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-1.5 py-0.5 rounded">
                            Seu Dia!
                          </span>
                        ) : alreadyCongratulated ? (
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            Enviado
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserForWishes(b);
                            }}
                            type="button"
                            className="text-[9px] bg-[#D4AF37] text-black font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all shadow hover:brightness-110 active:scale-95 cursor-pointer"
                          >
                            Felicitar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Popup de Parabenizar com Framer Motion */}
      <AnimatePresence>
        {selectedUserForWishes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0A0E1A] border border-[#D4AF37] w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.25)] relative"
            >
              {/* Gold Top line */}
              <div className="h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedUserForWishes(null);
                  setWishesText("");
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-[#D4AF37] transition-all p-1.5 bg-black/50 border border-white/5 rounded-lg"
              >
                <X size={16} />
              </button>

              <form
                onSubmit={handleSendWishes}
                className="p-6 sm:p-7 flex flex-col gap-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/25 shrink-0 mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-extrabold uppercase tracking-wide text-sm font-cinzel">
                      Parabenizar Irmão
                    </h3>
                    <p className="text-xs text-[#D4AF37] font-semibold font-serif italic mt-0.5">
                      Ir∴ {selectedUserForWishes.nome}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Envie votos fraternizados para fortalecer nossa egrégora.
                    </p>
                  </div>
                </div>

                {/* Suggestions Quick Tags */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-sans flex items-center gap-1.5">
                    <MessageSquare size={11} className="text-[#D4AF37]" />{" "}
                    Sugestões de Votos Fraternos:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {genericSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setWishesText(s)}
                        className="text-[10.5px] text-left text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 bg-black/40 hover:bg-black/60 border border-white/5 py-1.5 px-3 rounded-lg transition-all truncate shrink-0 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message input area */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-sans">
                    Sua Mensagem:
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={wishesText}
                    onChange={(e) => setWishesText(e.target.value)}
                    placeholder="Escreva seus votos fraternos de saúde, sabedoria e prosperidade..."
                    className="w-full bg-black/60 border border-[#D4AF37]/25 focus:border-[#D4AF37] rounded-xl text-xs text-white p-3.5 outline-none font-serif leading-relaxed placeholder-slate-600 focus:shadow-[0_0_10px_rgba(212,175,55,0.15)] transition-all resize-none"
                    maxLength={400}
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForWishes(null);
                      setWishesText("");
                    }}
                    className="px-4 py-2.5 bg-transparent border border-white/10 text-gray-400 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={sendingWishes || !wishesText.trim()}
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#D4AF37] hover:brightness-110 disabled:brightness-50 disabled:cursor-not-allowed text-black font-extrabold rounded-xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20"
                  >
                    {sendingWishes ? (
                      "Enviando..."
                    ) : (
                      <>
                        Enviar <Send size={11} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Grau */}
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[145px] transition-all hover:border-[#D4AF37]/60 group shadow-xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40"></div>
          <Award
            className="text-[#D4AF37]/80 mb-3 group-hover:scale-110 transition-transform"
            size={28}
          />
          <h3 className="text-[9px] tracking-[0.2em] font-black text-[#D4AF37] uppercase mb-1.5 font-cinzel">
            GRAU ATUAL
          </h3>
          <p className="text-lg font-black text-slate-200 tracking-wider uppercase font-cinzel">
            {user?.grau}
          </p>
        </div>

        {/* Cargo */}
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[145px] transition-all hover:border-[#D4AF37]/35 group shadow-xl sm:order-3 lg:order-none">
          <Eye
            className="text-slate-400 mb-3 group-hover:scale-110 transition-transform"
            size={28}
          />
          <h3 className="text-[9px] tracking-[0.2em] font-black text-slate-500 uppercase mb-1.5 font-cinzel">
            CARGO EM OFÍCIO
          </h3>
          <p className="text-base font-bold text-slate-300 tracking-wide uppercase">
            {user?.cargo || "Nenhum"}
          </p>
        </div>

        {/* Progresso do Grau */}
        <div className="bg-[#0A0E1A]/60 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center min-h-[145px] col-span-1 sm:col-span-2 sm:order-2 lg:order-none shadow-xl hover:border-[#D4AF37]/30 transition-all">
          <TrendingUp
            className="text-[#D4AF37] absolute right-6 top-6 opacity-[0.05] pointer-events-none"
            size={56}
          />
          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-[9px] tracking-[0.15em] font-black text-slate-500 uppercase font-cinzel">
                Evolução do Obreiro
              </h3>
              <span className="text-base font-black text-[#D4AF37] tracking-wider font-mono">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-black/45 border border-white/5 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-[#D4AF37] h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            {user?.grau === "Mestre" ? (
              <div className="flex items-center gap-2 text-xs font-serif italic text-[#D4AF37]/90">
                <Award size={13} className="shrink-0" /> Plenitude maçônica e
                magistério alcançados.
              </div>
            ) : !rule ? (
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                Aguardando regras sob sigilo...
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {missingMonths <= 0 ? (
                    <CheckCircle
                      size={12}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : (
                    <Lock size={12} className="text-[#D4AF37]/70 shrink-0" />
                  )}
                  <span
                    className={
                      missingMonths <= 0
                        ? "text-slate-500 line-through font-medium"
                        : "text-slate-400 font-medium"
                    }
                  >
                    Tempo: {mesesComoMembro} / {rule.tempoMinimoMeses} meses
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {missingPranchas <= 0 ? (
                    <CheckCircle
                      size={12}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : (
                    <Lock size={12} className="text-[#D4AF37]/70 shrink-0" />
                  )}
                  <span
                    className={
                      missingPranchas <= 0
                        ? "text-slate-500 line-through font-medium"
                        : "text-slate-400 font-medium"
                    }
                  >
                    Pranchas: {pranchasAprovadas} / {rule.quantidadePranchas}{" "}
                    aprovadas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <Lock size={12} className="text-[#D4AF37]/40 shrink-0" />
                  <span className="text-slate-500 font-medium">
                    Instruções: Sob tutela regulamentar /{" "}
                    {rule.quantidadeInstrucoes}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Two columns: Conteúdos and Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Últimos Conteúdos */}
        <div className="bg-[#0A0E1A]/50 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-5 border-b border-[#D4AF37]/15 flex justify-between items-center bg-black/10">
            <h2 className="text-xs tracking-widest font-black uppercase text-[#D4AF37] font-cinzel">
              Instruções de Estudo
            </h2>
            <button
              onClick={() => navigate("/contents")}
              className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Ver Biblioteca →
            </button>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {recentContents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-mono uppercase tracking-widest">
                Nenhum conteúdo sob sigilo revelado.
              </p>
            ) : (
              recentContents.map((content) => (
                <div
                  key={content.id}
                  className="flex gap-4 p-4 rounded-xl bg-black/45 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300 items-start group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#05070A] border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                    {content.tipo === "video" ? (
                      <BookOpen size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] uppercase tracking-widest text-[#D4AF37]/90 border border-[#D4AF37]/30 px-1.5 py-0.5 rounded font-mono font-bold bg-[#D4AF37]/5">
                        {content.tipo}
                      </span>
                    </div>
                    <h4 className="text-slate-200 font-bold text-xs truncate uppercase tracking-wide">
                      {content.titulo}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {content.descricao}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas Atividades */}
        <div className="bg-[#0A0E1A]/50 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-5 border-b border-[#D4AF37]/15 flex justify-between items-center bg-black/10">
            <h2 className="text-xs tracking-widest font-black uppercase text-[#D4AF37] font-cinzel">
              Cadeia de Registros
            </h2>
            <button
              onClick={() => navigate("/history")}
              className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-[#D4AF37] transition-colors cursor-pointer font-sans"
            >
              Histórico →
            </button>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {recentAtvs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-mono uppercase tracking-widest">
                Nenhum registro de atividades gravado.
              </p>
            ) : (
              recentAtvs.map((atv, i) => (
                <div key={atv.id} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#05070A] border border-[#D4AF37]/20 flex items-center justify-center text-slate-400 z-10 relative shadow-inner">
                      <Clock size={12} className="text-[#D4AF37]/70" />
                    </div>
                    {i < recentAtvs.length - 1 && (
                      <div className="w-[1px] h-full bg-[#D4AF37]/10 absolute top-8 bottom-[-20px]"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-3 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-slate-300 font-bold text-xs uppercase tracking-wide truncate">
                        {atv.titulo}
                      </h4>
                      <span className="text-[9px] text-slate-500 font-mono tracking-tighter shrink-0">
                        {atv.data}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {atv.descricao}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

```

### Arquivo: `src/pages/Forum.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, getDoc, doc, updateDoc, onSnapshot, where } from 'firebase/firestore';
import { MessageSquare, Plus, Search, ChevronRight, GraduationCap, X, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ForumTopic {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorCim: string;
  targetDegree: string;
  status: 'Aberto' | 'Resolvido';
  replyCount: number;
  createdAt: any;
}

interface ForumReply {
  id: string;
  topicId: string;
  authorId: string;
  authorName: string;
  authorCim: string;
  content: string;
  createdAt: any;
}

interface ForumInstructor {
  cim: string;
  degrees: string[];
}

export function Forum() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [instructors, setInstructors] = useState<ForumInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activeTab, setActiveTab] = useState<'Aberto' | 'Resolvido' | 'Aguardando'>('Aberto');
  
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newReply, setNewReply] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicDegree, setNewTopicDegree] = useState(user?.grau || 'Aprendiz');

  // Get user's degree. Gestor has access to all if needed, but here we can just use user?.grau.
  const targetDegree = user?.grau || 'Aprendiz';

  const getSelectableDegrees = (deg: string) => {
    if (deg === 'Mestre') return ['Aprendiz', 'Companheiro', 'Mestre'];
    if (deg === 'Companheiro') return ['Aprendiz', 'Companheiro'];
    return ['Aprendiz'];
  };

  const selectableDegrees = user?.role === 'gestor' 
    ? ['Aprendiz', 'Companheiro', 'Mestre'] 
    : getSelectableDegrees(targetDegree);

  useEffect(() => {
    // Load instructors to know who gets the badge
    const loadInstructors = async () => {
      const q = query(collection(db, 'forumInstructors'));
      const snap = await getDocs(q);
      const ists = snap.docs.map(d => d.data() as ForumInstructor);
      setInstructors(ists);
    };
    loadInstructors();
  }, []);

  useEffect(() => {
    // Determine the degrees the current user can see.
    // Usually, they see only their current degree and below.
    // If they are an instructor, they can see the degrees they instruct.
    // We'll just load all and filter in JS if they are instructor, or use query if member.
    let isInstructor = false;
    let allowedDegrees = getSelectableDegrees(targetDegree);
    
    const myInstructorProfile = instructors.find(i => i.cim === user?.cim);
    if (myInstructorProfile) {
      isInstructor = true;
      // Merge instructor degrees with normal member allowed degrees
      const combined = new Set([...allowedDegrees, ...myInstructorProfile.degrees]);
      allowedDegrees = Array.from(combined);
    }

    if (user?.role === 'gestor') {
      allowedDegrees = ['Aprendiz', 'Companheiro', 'Mestre'];
    }

    setLoading(true);
    const q = query(collection(db, 'forumTopics'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const allTopics = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumTopic));
      // Filter the ones allowed for me
      const visible = allTopics.filter(t => allowedDegrees.includes(t.targetDegree));
      setTopics(visible);
      setLoading(false);
      setQuotaExceeded(false);
    }, (err: any) => {
      console.error("Error loading forum topics:", err);
      if (err?.code === 'resource-exhausted') {
        setQuotaExceeded(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, instructors, targetDegree]);

  useEffect(() => {
    if (!selectedTopic) return;
    
    const q = query(collection(db, 'forumReplies'), where('topicId', '==', selectedTopic.id), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumReply)));
      setQuotaExceeded(false);
    }, (err: any) => {
      console.error("Error loading forum replies:", err);
      if (err?.code === 'resource-exhausted') {
        setQuotaExceeded(true);
      }
    });

    return () => unsubscribe();
  }, [selectedTopic]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicDesc.trim()) return;

    try {
      const topicData = {
        title: newTopicTitle,
        description: newTopicDesc,
        authorId: user?.uid,
        authorName: user?.nome,
        authorCim: user?.cim || '',
        targetDegree: newTopicDegree, // They create in their chosen allowed degree
        status: 'Aberto',
        replyCount: 0,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'forumTopics'), topicData);
      setShowCreateModal(false);
      setNewTopicTitle('');
      setNewTopicDesc('');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar tópico.');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !selectedTopic) return;

    try {
      await addDoc(collection(db, 'forumReplies'), {
        topicId: selectedTopic.id,
        authorId: user?.uid,
        authorName: user?.nome,
        authorCim: user?.cim || '',
        content: newReply,
        createdAt: serverTimestamp()
      });
      
      // Increment reply counter
      await updateDoc(doc(db, 'forumTopics', selectedTopic.id), {
        replyCount: (selectedTopic.replyCount || 0) + 1
      });

      setNewReply('');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar resposta.');
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedTopic) return;
    try {
      await updateDoc(doc(db, 'forumTopics', selectedTopic.id), {
        status: 'Resolvido'
      });
      setSelectedTopic({ ...selectedTopic, status: 'Resolvido' });
    } catch (err) {
      console.error(err);
      alert('Erro ao marcar como resolvido.');
    }
  };

  const filteredTopics = topics.filter(t => {
    if (activeTab === 'Aguardando') {
      return t.status === 'Aberto' && t.replyCount === 0;
    }
    return t.status === activeTab;
  });
  const isInstructor = instructors.some(i => i.cim === user?.cim);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {quotaExceeded && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <Clock className="w-6 h-6 text-red-500 shrink-0" />
            <div>
                <p className="text-red-400 font-bold">Limite de Tráfego Diário Atingido</p>
                <p className="text-sm text-red-400/80">O servidor de dados atingiu sua cota de acesso gratuita para hoje. O conteúdo do fórum será restaurado automaticamente nas próximas horas. Agradecemos a compreensão.</p>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#D4AF37] mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8" /> Fórum de Estudos
          </h1>
          <p className="text-gray-400">
            Tire dúvidas, discuta temas e receba orientações dos Instrutores designados.
          </p>
        </div>
        {!selectedTopic && (
          <button onClick={() => setShowCreateModal(true)} className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] hover:brightness-110 font-bold px-6 py-3">
            <Plus className="w-5 h-5 mr-2 inline-block" /> Novo Tópico
          </button>
        )}
      </div>

      {selectedTopic ? (
        <div className="space-y-6">
          <button onClick={() => setSelectedTopic(null)} className="text-[#D4AF37] hover:underline flex items-center gap-2 mb-4">
            ← Voltar para a lista
          </button>
          
          {/* Topic Header */}
          <div className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 md:p-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedTopic.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedTopic.status === 'Resolvido' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {selectedTopic.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 border-b border-white/5 pb-6">
              <span className="font-medium text-gray-300">Ir∴ {selectedTopic.authorName}</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-white/5 rounded text-xs">{selectedTopic.targetDegree}</span>
              <span>•</span>
              <span>{selectedTopic.createdAt ? format(selectedTopic.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}</span>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {selectedTopic.description}
            </div>

            {selectedTopic.status === 'Aberto' && (selectedTopic.authorId === user?.uid || isInstructor || user?.role === 'gestor') && (
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button onClick={handleMarkResolved} className="rounded-md px-4 py-2 border border-green-500/50 text-green-400 hover:bg-green-500/10 transition-colors">
                  <CheckCircle className="w-4 h-4 mr-2 inline-block" /> Marcar como Resolvido
                </button>
              </div>
            )}
          </div>

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Respostas ({replies.length})</h3>
            
            {replies.map(reply => {
              const replyIsInstructor = instructors.some(i => i.cim === reply.authorCim);
              
              return (
                <div key={reply.id} className={`p-6 rounded-2xl border ${replyIsInstructor ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20 relative overflow-hidden' : 'bg-[#0A0E1A]/40 border-white/5'}`}>
                  {replyIsInstructor && (
                    <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                      Instrutor
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-bold ${replyIsInstructor ? 'text-[#D4AF37]' : 'text-gray-300'}`}>Ir∴ {reply.authorName}</span>
                    <span className="text-xs text-gray-500">
                      {reply.createdAt ? format(reply.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
                    </span>
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {reply.content}
                  </div>
                </div>
              );
            })}
          </div>

          {(selectedTopic.status === 'Aberto' && (isInstructor || user?.role === 'gestor')) && (
            <div className="bg-[#0A0E1A]/40 border border-white/5 rounded-2xl p-6 mt-6">
              <h4 className="text-white font-bold mb-4">Sua Resposta (Painel do Instrutor)</h4>
              <form onSubmit={handleReply}>
                <textarea
                  value={newReply}
                  onChange={e => setNewReply(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37] min-h-[120px] mb-4"
                  placeholder="Escreva a orientação para o Ir∴..."
                  required
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={!newReply.trim()} className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] hover:brightness-110 font-bold px-6 py-3 disabled:opacity-50">
                    Enviar Orientação
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {(selectedTopic.status === 'Aberto' && !isInstructor && user?.role !== 'gestor') && (
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-6 mt-6 text-center">
              <GraduationCap className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-gray-400">
                Aguardando a orientação de um <span className="text-[#D4AF37] font-bold">Instrutor</span>.
                <br />Você pode visualizar as respostas, mas apenas instrutores podem responder.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setActiveTab('Aberto')}
              className={`px-6 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'Aberto' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-white'
              }`}
            >
              Em Aberto
              {activeTab === 'Aberto' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('Aguardando')}
              className={`px-6 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative flex items-center gap-2 ${
                activeTab === 'Aguardando' ? 'text-amber-500' : 'text-gray-500 hover:text-white'
              }`}
            >
              Aguardando Inst.
              {topics.filter(t => t.status === 'Aberto' && t.replyCount === 0).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {topics.filter(t => t.status === 'Aberto' && t.replyCount === 0).length}
                </span>
              )}
              {activeTab === 'Aguardando' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('Resolvido')}
              className={`px-6 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'Resolvido' ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-white'
              }`}
            >
              Resolvidos
              {activeTab === 'Resolvido' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              )}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando tópicos...</p>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-20 bg-[#0A0E1A]/40 rounded-2xl border border-white/5">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum tópico encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTopics.map(topic => (
                <div 
                  key={topic.id} 
                  onClick={() => setSelectedTopic(topic)}
                  className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-white/[0.03] transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">{topic.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {topic.createdAt ? format(topic.createdAt.toDate(), "dd/MM/yyyy") : ''}
                    </div>
                  </div>
                  <p className="text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {topic.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-300 font-medium">Ir∴ {topic.authorName}</span>
                      <span className="px-2 py-1 bg-white/5 rounded text-gray-400 text-xs">{topic.targetDegree}</span>
                      {topic.status === 'Aberto' && topic.replyCount === 0 && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs animate-pulse">
                          Aguardando Instrutor
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium text-sm">{topic.replyCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Criar Tópico */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0E1A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
              <h2 className="text-cl font-bold text-white">Criar Novo Tópico de Estudo</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTopic} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Resumo da Dúvida (Título)</label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  placeholder="Ex: Significado do Mosaico no 1º Grau"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sala de Estudos (Grau)</label>
                <select
                  value={newTopicDegree}
                  onChange={e => setNewTopicDegree(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  required
                >
                  {selectableDegrees.map(deg => (
                    <option key={deg} value={deg} className="bg-[#0A0E1A] text-white">{deg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição Detalhada</label>
                <textarea
                  value={newTopicDesc}
                  onChange={e => setNewTopicDesc(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-[#D4AF37] focus:border-[#D4AF37] h-32"
                  placeholder="Descreva sua dúvida com detalhes para que os Instrutores possam ajudar..."
                  required
                />
              </div>

              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4 flex items-start gap-4">
                <GraduationCap className="w-6 h-6 text-[#D4AF37] shrink-0" />
                <p className="text-sm text-[#D4AF37] leading-relaxed">
                  <strong>Atenção:</strong> Seu tópico ficará visível apenas na sala do grau selecionado ({newTopicDegree}) visando manter a regularidade na evolução, além dos Instrutores designados pela Gestão.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-md border border-white/10 px-4 py-2 text-gray-300 hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={!newTopicTitle.trim() || !newTopicDesc.trim()} className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] px-4 py-2 hover:brightness-110 font-bold disabled:opacity-50">
                  Publicar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

```

### Arquivo: `src/pages/LibraryPage.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, doc, getDoc, addDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Search, Lock, Unlock, ExternalLink, Sparkles, Filter, CheckCircle, DollarSign, Bookmark, ArrowLeft, Shield, Award, Landmark, HelpCircle, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'];

interface LibraryItem {
  id: string;
  titulo: string;
  descricao: string;
  grauMinimo: string;
  categoria: 'Livro' | 'Ritual' | 'Artigo' | 'Apostila' | 'Estudo';
  preco?: string;
  isPaid: boolean;
  urlDrive: string;
  imagemCapa?: string;
  corCapa?: 'golden' | 'blue' | 'crimson' | 'jade' | 'charcoal';
  whatsappPersonalizado?: string;
  destaqueConversion?: boolean; 
  createdAt?: any;
}

export function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCost, setSelectedCost] = useState<string>('Público'); // 'Público', 'Premium'
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todos');
  const [showUnlockModal, setShowUnlockModal] = useState<LibraryItem | null>(null);
  const [remetentePix, setRemetentePix] = useState('');
  const [copied, setCopied] = useState(false);
  const [treasuryConfig, setTreasuryConfig] = useState({ pixKey: '', pixName: '' });

  useEffect(() => {
    const loadTreasuryConfig = async () => {
      try {
        const confRef = doc(db, 'configs', 'treasury');
        const confSnap = await getDoc(confRef);
        if (confSnap.exists()) {
          const data = confSnap.data() as any;
          setTreasuryConfig({
            pixKey: data.pixKey || 'gomau.ead@gmail.com',
            pixName: data.pixName || 'Tesouraria GOMAU'
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadTreasuryConfig();
  }, []);

  // Controle de progresso local para marcar livros como guardados na estante pessoal
  const [bookMarked, setBookMarked] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gomau_marked_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userNotes, setUserNotes] = useState<{ [itemId: string]: string }>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const fetchUserNotes = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'library_notes'),
        where('uid', '==', user.uid)
      );
      const snaps = await getDocs(q);
      const notesObj: { [itemId: string]: string } = {};
      snaps.docs.forEach(d => {
        const data = d.data();
        if (data.itemId && data.noteText) {
          notesObj[data.itemId] = data.noteText;
        }
      });
      setUserNotes(notesObj);
    } catch (err) {
      console.error('Erro ao carregar anotações:', err);
    }
  };

  const handleSaveNote = async (itemId: string, noteText: string) => {
    if (!user) return;
    setSavingNoteId(itemId);
    try {
      const noteDocId = `${user.uid}_${itemId}`;
      await setDoc(doc(db, 'library_notes', noteDocId), {
        uid: user.uid,
        itemId,
        noteText: noteText.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setUserNotes(prev => ({ ...prev, [itemId]: noteText.trim() }));
      alert('Sua reflexão de estudo privada foi gravada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar anotação. Tente novamente.');
    } finally {
      setSavingNoteId(null);
    }
  };

  useEffect(() => {
    if (user) {
      const isOwner = ['gomau.ead@gmail.com', 'calepi@gmail.com', 'calepe@gmail.com'].includes((user?.email || '').toLowerCase().trim());
      if (!isOwner) {
        navigate('/');
        return;
      }
      fetchLibraryItems();
      fetchUserNotes();
    }
  }, [user, navigate]);

  const fetchLibraryItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'library_items'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LibraryItem[];
      setItems(fetched);
    } catch (err) {
      console.error("Erro ao carregar biblioteca virtual:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (bookMarked.includes(id)) {
      updated = bookMarked.filter(b => b !== id);
    } else {
      updated = [...bookMarked, id];
    }
    setBookMarked(updated);
    localStorage.setItem('gomau_marked_books', JSON.stringify(updated));
  };

  const userGrau = user?.grau || 'Aprendiz';

  // REGRA DE TRIAGEM AUTOMÁTICA: O membro visualiza estritamente os materiais correspondentes ao seu grau atual!
  const filteredItems = items.filter(item => {
    // Triagem estrita por grau (o aluno só enxerga as obras do seu próprio grau para manter a regularidade iniciática)
    if (item.grauMinimo !== userGrau) return false;

    // Filtro de Preço/Acesso
    if (selectedCost === 'Público' && item.isPaid) return false;
    if (selectedCost === 'Premium' && !item.isPaid) return false;

    // Filtro de Categoria
    if (selectedCategoria !== 'Todos' && item.categoria !== selectedCategoria) return false;

    // Filtro de Busca por Texto
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchTitle = item.titulo.toLowerCase().includes(term);
      const matchDesc = item.descricao.toLowerCase().includes(term);
      return matchTitle || matchDesc;
    }

    return true;
  });

  const getPremiumFeaturedCard = () => {
    // Retorna o item marcado com destaqueConversion do respectivo grau do usuário
    return items.find(item => item.destaqueConversion && item.grauMinimo === userGrau) || 
           items.find(item => item.isPaid && item.grauMinimo === userGrau);
  };

  const featuredPremiumItem = getPremiumFeaturedCard();

  const isBookUnlockedForUser = (itemId: string) => {
    if (user?.hasPremiumLibrary) return true;
    const item = items.find(it => it.id === itemId);
    if (!item) return false;
    if (!item.isPaid) return true;
    return (user?.unlockedBooks || []).includes(itemId);
  };

  const handleAccessItem = (item: LibraryItem) => {
    if (item.isPaid && !isBookUnlockedForUser(item.id)) {
      setShowUnlockModal(item);
    } else {
      window.open(item.urlDrive, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsappConversion = async (item: LibraryItem) => {
    if (!remetentePix.trim()) {
      alert('Por favor, informe quem realizou o pagamento Pix (Titular da Conta) para que possamos validar e liberar.');
      return;
    }
    const targetValor = item.preco ? item.preco.replace(/[^0-9,.]/g, '').trim() : '0,00';
    const tipo = (item.id && item.id.includes('Plano')) ? 'assinatura' : 'livro';
    
    if (user) {
      try {
        await addDoc(collection(db, 'mensalidades'), {
          uid: user.uid,
          userName: user.nome || '',
          userEmail: user.email || '',
          userCim: user.cim || '',
          mesRef: `Biblioteca: ${item.titulo}`,
          valor: targetValor,
          comprovanteUrl: '',
          remetentePix: remetentePix.trim(),
          tipo: tipo,
          itemId: item.id,
          status: 'em_analise',
          dataEnvio: serverTimestamp()
        });
      } catch (e) {
        console.error("Erro ao registrar intenção com tesouraria:", e);
      }
    }

    const defaultMsg = `Saudações Ir:. Tesoureiro! Gostaria de solicitar a liberação do item "${item.titulo}" na Biblioteca Virtual GOMAU.\n\n• Pix por: ${remetentePix.trim()}\n• Valor: R$ ${targetValor}`;
    const message = encodeURIComponent(item.whatsappPersonalizado ? `${item.whatsappPersonalizado}\n\n• Pix por: ${remetentePix.trim()}` : defaultMsg);
    window.open(`https://api.whatsapp.com/send?phone=5531994375772&text=${message}`, '_blank');
    setShowUnlockModal(null);
    setRemetentePix('');
  };

  const getCoverGradient = (cor?: string) => {
    switch (cor) {
      case 'charcoal': return 'from-[#1A1E24] to-[#0A0C0F] border-[#2A313C] text-gray-300';
      case 'blue': return 'from-[#0C1B33] to-[#040A14] border-[#15325E] text-blue-200';
      case 'crimson': return 'from-[#2F0F14] to-[#0F0406] border-[#5E1F28] text-red-100';
      case 'jade': return 'from-[#0A2218] to-[#030A07] border-[#134430] text-emerald-200';
      case 'golden':
      default: return 'from-[#2F2104] to-[#0E0B02] border-[#D4AF37]/50 text-[#D4AF37]';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans relative overflow-x-hidden">
      {/* Elegantes Linhas de Esquadro e Compasso Geométricos de Fundo (Aparência Riquíssima) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FAF2E1] via-[#FDFBF7] to-[#FDFBF7] pointer-events-none"></div>
      
      {/* Ornamento de Linha Áurea do Topo */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent w-full opacity-80"></div>

      {/* LUXURY STANDALONE CUSTOM BAR */}
      <header className="border-b border-[#D4AF37]/30 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#785303]/40 text-[#785303] hover:bg-[#785303] hover:text-white hover:border-transparent transition-all duration-300 text-xs font-black uppercase tracking-widest hover:shadow-lg shadow-[#785303]/20"
            >
              <ArrowLeft size={14} />
              Retornar ao Templo
            </button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              <Landmark size={12} className="text-[#D4AF37]" />
              Atheneum GOMAU
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[9px] text-[#785303] uppercase tracking-widest font-black leading-none">Acervo Filtrado</p>
              <p className="text-xs font-semibold text-gray-800 mt-1 uppercase tracking-wide">{userGrau}</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-[#D4AF37]/40 bg-white flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <Award size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* Luxury Immersive Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Intro Hero Section - Grand Design */}
        <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
          <div className="inline-flex items-center justify-center p-4 bg-white/60 rounded-full border border-[#D4AF37]/30 mb-2 shadow-[0_15px_40px_rgba(212,175,55,0.15)] relative">
            <div className="absolute inset-0 bg-[#D4AF37]/5 blur-xl rounded-full"></div>
            <img src="/logotrad.png" alt="Logo GOMAU" className="w-24 h-24 sm:w-32 sm:h-32 object-contain relative z-10 drop-shadow-md" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-widest text-[#785303]" style={{ fontFamily: 'Cinzel', textShadow: '0 2px 10px rgba(120,83,3,0.15)' }}>
            BIBLIOTECA SECRETA
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent w-48 mx-auto"></div>
          <p className="text-base sm:text-lg text-gray-800 font-serif leading-relaxed italic">
            "Penetra nos mistérios ocultos da escrita sagrada. Aqui residem as instruções, rituais e ciências voltadas exclusivamente para a instrução individual do seu atual estágio de regularidade."
          </p>
          <div className="text-sm text-gray-700 font-mono flex items-center justify-center gap-1.5 pt-2">
            <Shield size={14} className="text-[#785303]" /> Triagem Automática Ativa: Exibindo apenas conteúdos homologados para o grau <span className="text-[#664601] font-extrabold">{userGrau}</span>.
          </div>
        </div>

        {/* Brand New Luxury Premium Card Banner - Conversion layout */}
        {selectedCost === 'Premium' && !user?.hasPremiumLibrary ? (
          <div className="bg-white border-2 border-[#D4AF37]/40 rounded-3xl p-8 relative overflow-hidden shadow-[0_15px_40px_rgba(212,175,55,0.1)] group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Landmark size={160} className="text-[#D4AF37]" strokeWidth={1} />
            </div>
            {/* Soft gold light backglow */}
            <div className="absolute left-1/4 top-1/2 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center gap-8 text-center text-left">
              <div className="space-y-4 max-w-3xl text-center mx-auto">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F39C12] text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full inline-block shadow-md">
                  Acesso Total ao Acervo Reservado
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 uppercase tracking-wider leading-tight" style={{ fontFamily: 'Cinzel' }}>
                  Planos de Assinatura Premium GOMAU
                </h2>
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-serif max-w-2xl mx-auto">
                  Liberte seu potencial maçônico. A Assinatura Premium confere passe livre a todos os pergaminhos, rituais e estudos aprofundados do seu grau. Escolha a jornada que mais se alinha ao seu momento e aproveite condições exclusivas abaixo, ou continue adquirindo obras avulsas individualmente na estante.
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
                {[
                  { title: 'Plano Mensal', price: 'R$ 29,90', period: '/mês', icon: <Bookmark size={18} /> },
                  { title: 'Plano Trimestral', price: 'R$ 79,90', period: '/trimestre', icon: <BookOpen size={18} /> },
                  { title: 'Plano Semestral', price: 'R$ 149,90', period: '/semestre', icon: <Landmark size={18} /> },
                  { title: 'Plano Anual', price: 'R$ 249,90', period: '/ano', icon: <Award size={18} />, highlight: true }
                ].map(plan => (
                  <div key={plan.title} className={`bg-[#FDFBF7] border ${plan.highlight ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] scale-[1.02]' : 'border-gray-200'} p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all hover:border-[#D4AF37]/50 hover:shadow-lg`}>
                    {plan.highlight && (
                      <div className="absolute top-0 inset-x-0 bg-[#D4AF37] text-white text-[9px] font-black uppercase py-1 tracking-widest text-center">
                        Mais Obreiros Escolhem
                      </div>
                    )}
                    <div className={`space-y-4 ${plan.highlight ? 'pt-4' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-400'}`}>
                        {plan.icon}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{plan.title}</h3>
                      <div className="space-y-1">
                        <span className="text-2xl font-black text-[#785303]" style={{ fontFamily: 'Cinzel' }}>{plan.price}</span>
                        <span className="text-[10px] text-gray-500 font-mono block">{plan.period}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowUnlockModal({
                        id: plan.title,
                        titulo: plan.title,
                        descricao: `Assinatura ${plan.title} para acesso integral ao Acervo Premium.`,
                        preco: plan.price,
                        isPaid: true,
                        grauMinimo: 'Aprendiz',
                        categoria: 'Livro',
                        urlDrive: '',
                        destaqueConversion: false,
                        whatsappPersonalizado: `Saudações Ir:. Tesoureiro! Gostaria de realizar a ativação do ${plan.title} (${plan.price}) da Biblioteca Virtual GOMAU. Segue o comprovante!`
                      } as LibraryItem)}
                      className={`mt-6 w-full py-3 rounded-xl font-extrabold transition-all text-xs uppercase tracking-widest ${plan.highlight ? 'bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black hover:scale-[1.03] shadow-lg shadow-[#D4AF37]/30' : 'bg-transparent text-[#785303] border border-[#785303]/60 hover:bg-[#785303]/10'}`}
                    >
                      Assinar Plano
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (selectedCost === 'Público' && featuredPremiumItem) ? (
          <div className="bg-white border-2 border-[#D4AF37]/40 rounded-3xl p-8 relative overflow-hidden shadow-[0_15px_40px_rgba(212,175,55,0.08)] group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Landmark size={160} className="text-[#D4AF37]" strokeWidth={1} />
            </div>
            {/* Soft gold light backglow */}
            <div className="absolute left-1/4 top-1/2 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 justify-between">
              <div className="space-y-4 max-w-2xl text-left">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F39C12] text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full inline-block shadow-md">
                  Estudo de Alta Linhagem Iniciática
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 uppercase tracking-wider leading-tight" style={{ fontFamily: 'Cinzel' }}>
                  Aprofunde suas Raízes Científicas e Filosóficas
                </h2>
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-serif">
                  Alcance chaves interpretativas de alto valor iniciático. Nossa Curadoria Premium reúne compilações históricas, exegeses ritualísticas e o simbolismo puro voltado para a elevação de sua consciência na Arte Real.
                </p>
                <div className="flex flex-wrap gap-4 items-center text-xs pt-2">
                  <span className="flex items-center gap-1.5 text-[#785303] bg-white px-3.5 py-2.5 rounded-xl border border-[#785303]/35 font-mono shadow-sm font-semibold">
                    ✦ Sincronização WhatsApp Imediata
                  </span>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span className="text-gray-500 font-sans">Liberação concedida via Tesouraria</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0 bg-[#FDFBF7] border border-[#D4AF37]/30 p-6 rounded-2xl text-center min-w-[280px] shadow-lg relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-white text-[9px] font-black uppercase px-3 py-0.5 rounded-full tracking-widest scale-95 border border-[#D4AF37] shadow-sm">
                  RECOMENDADO
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-2">Destaque Exclusivo</p>
                <div className="py-2">
                  <span className="text-4xl font-extrabold text-[#785303]" style={{ fontFamily: 'Cinzel' }}>{featuredPremiumItem.preco || 'Sob Consulta'}</span>
                  <span className="text-xs text-gray-500 block mt-1">acesso individual vitalício</span>
                </div>
                <button 
                  onClick={() => handleAccessItem(featuredPremiumItem)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black w-full py-3 px-6 rounded-xl font-extrabold hover:scale-[1.03] transition-all text-xs uppercase tracking-widest shadow-lg shadow-[#D4AF37]/30"
                >
                  Garantir Acesso
                </button>
                <p className="text-[9px] text-gray-500 font-mono">Chave Pix institucional e liberação expressa.</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Sophisticated Search & Filtering */}
        <div className="bg-white/90 border border-[#D4AF37]/30 rounded-2xl p-6 space-y-4 shadow-[0_10px_30px_rgba(212,175,55,0.08)] relative">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Filter tags (free/premium) */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-full lg:w-auto">
              {['Público', 'Premium'].map(cost => (
                <button 
                  key={cost}
                  onClick={() => setSelectedCost(cost)}
                  className={`flex-1 lg:flex-initial px-8 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest shadow-sm ${selectedCost === cost ? 'bg-gradient-to-r from-[#D4AF37] to-[#F39C12] text-white shadow-[0_2px_10px_rgba(212,175,55,0.3)]' : 'text-gray-500 hover:text-gray-900 bg-white border border-gray-200'}`}
                >
                  Acervo {cost}
                </button>
              ))}
            </div>

            {/* Title search */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#664601]" size={18} />
              <input 
                type="text" 
                placeholder="Buscar obra pelo título ou assunto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 w-full placeholder-gray-500 focus:border-[#D4AF37]/70 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-mono shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 items-center justify-between">
            {/* Category selection */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-700 uppercase tracking-widest mr-1 flex items-center gap-1">
                <Filter size={14} className="text-[#664601]" /> Categoria:
              </span>
              {['Todos', 'Livro', 'Ritual', 'Artigo', 'Apostila', 'Estudo'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${selectedCategoria === cat ? 'bg-[#785303]/10 border border-[#785303]/40 text-[#664601] font-bold' : 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-700 font-mono">
              Encontrados: <span className="text-gray-900 font-bold">{filteredItems.length}</span> tomos de estudo
            </div>
          </div>
        </div>

        {/* Luxurious Books Shelf Column/Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-gray-200">
            <BookOpen className="text-[#D4AF37] animate-bounce mb-4" size={40} />
            <p className="text-gray-500 text-xs font-mono tracking-widest uppercase">Consultando baú de acervos...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white/80 border border-gray-200 rounded-3xl p-20 text-center shadow-sm space-y-4">
            <BookOpen className="text-gray-300 mx-auto" size={48} />
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider" style={{ fontFamily: 'Cinzel' }}>Nenhuma obra catalogada</h3>
            <p className="text-gray-500 text-xs mt-1 max-w-sm mx-auto font-serif">Não há livros cadastrados para o seu grau com os filtros atuais selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const gradientStyle = getCoverGradient(item.corCapa);
                const isMarked = bookMarked.includes(item.id);

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={item.id}
                    onClick={() => handleAccessItem(item)}
                    className="bg-white border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col justify-between hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-[#FDFBF7] relative overflow-hidden shadow-sm"
                  >
                    <div className="space-y-5">
                      {/* Cover Header Graphic - Premium styled canvas */}
                      <div 
                        className={`aspect-[4/3] w-full rounded-xl bg-gradient-to-br ${gradientStyle} border p-4 flex flex-col justify-between relative shadow-[inset_0_4px_25px_rgba(0,0,0,0.9)] overflow-hidden group-hover:brightness-110 transition-all duration-300`}
                        style={item.imagemCapa ? {
                          backgroundImage: `linear-gradient(to bottom, rgba(3, 5, 9, 0.45), rgba(3, 5, 9, 0.9)), url(${item.imagemCapa})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {/* Book-spine overlay line for realism (lombada texturizada) */}
                        <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-gradient-to-r from-black/80 via-black/40 to-transparent border-r border-white/5 z-20"></div>
                        
                        {/* Golden/Silver Hot Stamp Inner Frame for Luxury Binding sensation */}
                        <div className="absolute inset-2 border border-[#D4AF37]/30 rounded-lg pointer-events-none z-10 opacity-70"></div>
                        <div className="absolute inset-2.5 border border-[#D4AF37]/15 rounded shadow-[inset_0_0_20px_rgba(212,175,55,0.15)] pointer-events-none z-10"></div>

                        {/* Traditional Corner Accents in Esoteric Frames */}
                        <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-[#D4AF37]/50 z-20"></div>
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-[#D4AF37]/50 z-20"></div>
                        <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-[#D4AF37]/50 z-20"></div>
                        <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-[#D4AF37]/50 z-20"></div>

                        {/* Subtle background cosmic mesh of coordinates */}
                        <div className="absolute inset-0 bg-radial-gradient from-[#D4AF37]/5 to-transparent pointer-events-none z-0"></div>
                        
                        {/* Top banner */}
                        <div className="flex justify-between items-start relative z-30 pl-2">
                          <span className="text-[9px] uppercase font-mono tracking-widest bg-white/90 backdrop-blur-md text-gray-900 px-2.5 py-0.5 rounded border border-white/40 font-bold shadow-sm">
                            {item.categoria}
                          </span>
                          
                          {/* Bookmark Estante Toggle */}
                          <button 
                            onClick={(e) => toggleBookmark(item.id, e)}
                            className="bg-white/80 hover:bg-white p-1.5 rounded-lg border border-white/40 text-gray-500 hover:text-yellow-500 transition-colors shadow-sm"
                          >
                            <Bookmark size={12} className={isMarked ? 'fill-[#D4AF37] text-[#D4AF37]' : ''} />
                          </button>
                        </div>

                        {/* Centralizing Esoteric Compass Layout with Glowing Aura */}
                        <div className="flex justify-center items-center py-2 relative z-30">
                          {/* Pulsing Backglow */}
                          <div className="absolute w-20 h-20 bg-[#D4AF37]/15 rounded-full blur-xl animate-pulse"></div>
                          
                          <div className="w-16 h-16 rounded-full border border-[#D4AF37]/45 bg-black/75 backdrop-blur-lg flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.25)] group-hover:scale-110 transition-transform duration-300">
                            {item.categoria === 'Ritual' ? (
                              <Award size={24} className="text-[#D4AF37]" />
                            ) : item.categoria === 'Artigo' ? (
                              <Sparkles size={24} className="text-[#D4AF37]" />
                            ) : item.categoria === 'Estudo' ? (
                              <Shield size={24} className="text-[#D4AF37]" />
                            ) : (
                              <BookOpen size={24} className="text-[#D4AF37]" />
                            )}
                          </div>
                        </div>

                        {/* Bottom line */}
                        <div className="flex justify-between items-end relative z-30 pl-2">
                          <span className="text-[8px] tracking-widest font-extrabold text-white/80 font-mono">
                            ACERVO REAL
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] font-mono bg-black/85 backdrop-blur-md px-2.5 py-0.5 rounded border border-[#D4AF37]/20">
                            {item.grauMinimo}
                          </span>
                        </div>
                      </div>

                      {/* Cover Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {item.isPaid ? (
                            isBookUnlockedForUser(item.id) ? (
                              <span className="text-green-600 text-xs uppercase font-black bg-green-500/10 px-2.5 py-1 rounded border border-green-500/30 flex items-center gap-1">
                                <Unlock size={12} className="text-green-600" /> Acesso Liberado
                              </span>
                            ) : (
                              <span className="text-yellow-700 text-xs uppercase font-black bg-yellow-500/15 px-2.5 py-1 rounded border border-yellow-500/30 flex items-center gap-1">
                                <Lock size={12} /> Premium ({item.preco || 'Ativação'})
                              </span>
                            )
                          ) : (
                            <span className="text-emerald-600 text-xs uppercase font-black bg-emerald-500/15 px-2.5 py-1 rounded border border-emerald-500/30">
                              Livre Leitura
                            </span>
                          )}
                          {isMarked && (
                            <span className="text-[#664601] text-xs bg-[#785303]/10 px-2.5 py-1 rounded flex items-center gap-1 font-extrabold border border-[#785303]/30">
                              ★ Guardado
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-lg sm:text-xl uppercase tracking-wider group-hover:text-[#664601] transition-colors leading-snug line-clamp-2" style={{ fontFamily: 'Cinzel' }}>
                          {item.titulo}
                        </h3>
                        <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed font-serif">
                          {item.descricao}
                        </p>
                      </div>
                    </div>

                    {/* Marginal study notes - ONLY if book is unlocked or free */}
                    {(!item.isPaid || isBookUnlockedForUser(item.id)) && (
                      <div 
                        onClick={e => e.stopPropagation()} 
                        className="mt-4 pt-3 border-t border-dashed border-gray-200 space-y-2 text-left"
                      >
                        <details className="group">
                          <summary className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-gray-500 hover:text-[#785303] cursor-pointer select-none">
                            <span className="flex items-center gap-1.5 font-bold">
                              <BookOpen size={12} className="text-[#D4AF37]" />
                              Anotações Privadas {userNotes[item.id] ? '(Preenchido)' : ''}
                            </span>
                            <ChevronDown size={12} className="transition-transform group-open:rotate-180 text-gray-450 focus:outline-none" />
                          </summary>
                          
                          <div className="mt-3 space-y-2">
                            <textarea
                              defaultValue={userNotes[item.id] || ''}
                              id={`note_${item.id}`}
                              placeholder="Suas meditações ao estudar este tomo. Salvo de forma 100% privada..."
                              className="w-full bg-[#FCFBF7] border border-[#D4AF37]/35 rounded-xl p-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#755502] leading-relaxed resize-none h-24 font-serif"
                            />
                            <button
                              onClick={() => {
                                const ta = document.getElementById(`note_${item.id}`) as HTMLTextAreaElement;
                                if (ta) {
                                  handleSaveNote(item.id, ta.value);
                                }
                              }}
                              disabled={savingNoteId === item.id}
                              className="w-full py-2 bg-[#785303] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#664601] transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              {savingNoteId === item.id ? 'Gravando...' : 'Gravar Anotação'}
                            </button>
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Bottom access button */}
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between mt-5">
                      <span className="text-xs text-gray-700 font-mono uppercase tracking-wider">{item.categoria}</span>
                      <button className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg bg-white text-gray-900 hover:bg-[#D4AF37] hover:text-white border border-[#D4AF37]/50 hover:border-transparent transition-all duration-300 shadow-sm">
                        {item.isPaid && !isBookUnlockedForUser(item.id) ? (
                          <>
                            <Lock size={11} /> Adquirir Tomo
                          </>
                        ) : (
                          <>
                            Estudar e Abrir <ExternalLink size={11} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="border-t border-[#D4AF37]/20 py-10 mt-16 bg-white/60 text-center space-y-3">
        <p className="font-serif text-sm italic text-[#785303] font-bold">"Saber, Querer, Ousar e Calar"</p>
        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Atheneum Guardado G∴O∴M∴A∴U∴ — 2026</p>
      </footer>

      {/* Modern Luxury WhatsApp Acquisition Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 bg-[#020408]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0E1A] border-2 border-[#D4AF37] rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center space-y-6"
            >
              <div className="absolute top-0 right-0 p-3 animate-pulse">
                <button 
                  onClick={() => { setShowUnlockModal(null); setCopied(false); }}
                  className="text-gray-400 hover:text-[#D4AF37] p-2 rounded-xl transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="w-16 h-16 bg-[#D4AF37]/15 rounded-full flex items-center justify-center mx-auto text-[#D4AF37] border-2 border-[#D4AF37]/70 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                <Lock size={26} className="text-[#D4AF37]" />
              </div>

              <div className="space-y-2">
                <span className="text-black text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] to-[#C9A227] px-4 py-1.5 rounded-full shadow-sm inline-block">
                  Aquisição Premium — Pix Direto
                </span>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider mt-2 font-sans" style={{ fontFamily: 'Cinzel' }}>
                  {showUnlockModal.titulo}
                </h3>
                <p className="text-sm text-gray-300 font-sans font-medium">
                  Valor de Contribuição: <strong className="text-[#D4AF37] text-2xl ml-2 font-sans font-black">{showUnlockModal.preco || 'R$ 49,90'}</strong>
                </p>
              </div>

              {/* Dedicated Copy Pix Section */}
              <div className="bg-[#111625] border border-gray-800 p-5 rounded-2xl space-y-3 text-left shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-300 uppercase tracking-wider font-mono font-bold">Chave Pix (Integração Tesouraria):</span>
                  {copied && (
                    <span className="text-xs text-green-400 font-bold uppercase tracking-widest font-mono">✓ Copiada!</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 bg-[#070A13] border border-[#D4AF37]/30 px-3 py-2.5 rounded-xl">
                  <span className="text-xs text-gray-100 font-mono select-all font-black truncate">{treasuryConfig.pixKey || 'gomau.ead@gmail.com'}</span>
                  <button
                    type="button"
                    onClick={() => {
                       navigator.clipboard.writeText(treasuryConfig.pixKey || 'gomau.ead@gmail.com');
                       setCopied(true);
                       setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2.5 bg-[#D4AF37] text-black hover:bg-[#C9A227] rounded-lg hover:scale-105 transition-all text-xs font-bold shrink-0 shadow-md"
                    title="Copiar Chave Pix"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                {treasuryConfig.pixName && (
                   <div className="mt-1">
                      <span className="text-[10px] text-gray-400 uppercase font-mono block">Beneficiário:</span>
                      <p className="text-sm text-gray-200 font-sans font-bold">{treasuryConfig.pixName}</p>
                   </div>
                )}
              </div>

              {/* Input for Pix Payor details */}
              <div className="text-left space-y-1.5">
                <label className="text-[11px] text-gray-300 uppercase tracking-wider font-mono font-bold block">
                  Quem enviou o Pix? (Titular da Conta):
                </label>
                <input 
                  type="text"
                  value={remetentePix}
                  onChange={e => setRemetentePix(e.target.value)}
                  placeholder="Seu nome ou nome da conta pagadora"
                  className="w-full bg-[#070A13] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Ajude a Tesouraria a cruzar os depósitos no extrato bancário para liberação imediata.</p>
              </div>

              <div className="text-left bg-[#111625] p-4 border border-gray-800 rounded-2xl space-y-2 text-xs text-gray-200 font-sans leading-relaxed">
                <p className="font-black text-[#D4AF37] uppercase tracking-wider text-[10px] font-sans">Passo a Passo para Liberação:</p>
                <p className="pl-1 flex gap-2"><span className="text-[#D4AF37] font-bold">1.</span> Efetue a contribuição utilizando a chave Pix copiada.</p>
                <p className="pl-1 flex gap-2"><span className="text-[#D4AF37] font-bold">2.</span> Informe acima o titular da conta que fez a transferência.</p>
                <p className="pl-1 flex gap-2"><span className="text-[#D4AF37] font-bold">3.</span> Pressione o botão verde para notificar o Tesoureiro no WhatsApp.</p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button 
                  onClick={() => handleWhatsappConversion(showUnlockModal)}
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white w-full py-3.5 rounded-xl font-extrabold transition-all text-xs uppercase tracking-widest shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  Confirmar Pagamento e Enviar Aviso
                </button>
                <button 
                  onClick={() => { setShowUnlockModal(null); setCopied(false); }}
                  className="text-gray-400 hover:text-[#D4AF37] py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Voltar ao Acervo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

```

### Arquivo: `src/pages/gestor/CourseGenerator.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { Sparkles, Settings, Play, Save, ChevronRight, FileText, ListChecks, GraduationCap, AlertCircle, Loader2, Key } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { generatorStore, GenState } from '../../lib/courseGeneratorState';

// Constante para o modelo - usando o aliasing recomendado pelo sistema
const GEMINI_MODEL = "gemini-3-flash-preview";

export function CourseGenerator() {
  const { user } = useAuth();
  const DEFAULT_CONFIG = {
    qtdModulos: 2,
    qtdUnidadesPorModulo: 2,
    qtdAulasPorUnidade: 2,
    qtdExerciciosPorAula: { discursivas: 1, multiplaEscolha: 2 },
    qtdQuestoesAvaliacaoUnidade: { discursivas: 1, multiplaEscolha: 4 },
    qtdQuestoesAvaliacaoModulo: { discursivas: 2, multiplaEscolha: 5 },
    mediaAprovacao: 75,
    profundidade: 'Moral',
    linguagem: 'Contemporânea',
    foco: 'Filosofia',
    complexidade: 'Avançado'
  };

  const [state, setState] = useState<GenState>(() => generatorStore.getState());
  const [config, setConfig] = useState<any>(DEFAULT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    const unsub = generatorStore.subscribe(setState);
    return () => { unsub(); };
  }, []);

  const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre'];

  // aliases curtos para simplificar leitura de variáveis globais
  const { activeMode, courseTitle, selectedGrau, manualProgram, status, streamingText, loading, generatedCourse } = state;

  const setActiveMode = (v: GenState['activeMode']) => generatorStore.setState({ activeMode: v });
  const setCourseTitle = (v: string) => generatorStore.setState({ courseTitle: v });
  const setSelectedGrau = (v: string) => generatorStore.setState({ selectedGrau: v });
  const setManualProgram = (v: string) => generatorStore.setState({ manualProgram: v });
  const setStatus = (v: string) => generatorStore.setState({ status: v });
  const setLoading = (v: boolean) => generatorStore.setState({ loading: v });
  const setGeneratedCourse = (v: any) => generatorStore.setState({ generatedCourse: v });

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'configs', 'generator'));
      if (snap.exists()) {
        setConfig(snap.data());
      }
    } catch (err) {
      console.error("Error loading generator config:", err);
      // Fallback already handled by initial state
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await setDoc(doc(db, 'configs', 'generator'), {
        ...config,
        updatedAt: serverTimestamp()
      });
      alert("Configurações do gerador salvas!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleGenerate = async () => {
    if (!courseTitle && activeMode === 'auto') return alert("Informe o título do curso.");
    if (!manualProgram && activeMode === 'manual') return alert("Cole o programa do curso.");
    
    setLoading(true);
    setStatus('Iniciando Inteligência Artificial...');
    generatorStore.setState({ streamingText: '' });
    generatorStore.logGeneration({ title: courseTitle, mode: activeMode, config });

    try {
      console.log('GEMINI_API_KEY available?', !!process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = activeMode === 'auto' 
        ? `Gere um curso completo sobre o tema: "${courseTitle}".
           Público-alvo: Maçons do grau ${selectedGrau}.
           
           DIRETRIZES DE QUALIDADE:
           - Profundidade Analítica: ${config.profundidade || 'Moral'}
           - Estilo de Linguagem: ${config.linguagem || 'Contemporânea'}
           - Foco Doutrinário: ${config.foco || 'Filosofia'}
           - Nível de Complexidade: ${config.complexidade || 'Avançado'}
           
           Configurações de Estrutura:
           - Módulos: ${config.qtdModulos}
           - Unidades por Módulo: ${config.qtdUnidadesPorModulo}
           - Aulas por Unidade: ${config.qtdAulasPorUnidade}
           - Exercícios por Aula: ${config.qtdExerciciosPorAula.discursivas} discursivas e ${config.qtdExerciciosPorAula.multiplaEscolha} múltipla escolha.
           - Questões Avaliação Unidade: ${config.qtdQuestoesAvaliacaoUnidade.discursivas} discursivas e ${config.qtdQuestoesAvaliacaoUnidade.multiplaEscolha} múltipla escolha.
           - Questões Avaliação Módulo: ${config.qtdQuestoesAvaliacaoModulo.discursivas} discursivas e ${config.qtdQuestoesAvaliacaoModulo.multiplaEscolha} múltipla escolha.
           
           PARA CADA AULA: Desenvolva o conteúdo educacional COMPLETO (mínimo 800 palavras por aula) em formato Markdown, com profundidade compatível com o grau ${selectedGrau} e seguindo as diretrizes de qualidade acima. Não use placeholders.
           PARA CADA EXERCÍCIO/AVALIAÇÃO: Forneça a pergunta, as opções (se múltipla escolha) e a resposta correta/gabarito.`
        : `Transforme o programa abaixo em um curso estruturado na plataforma GOMAU para o grau ${selectedGrau}:
           Programa: ${manualProgram}
           Use as seguintes diretrizes:
           - Linguagem: ${config.linguagem || 'Contemporânea'}
           - Complexidade: ${config.complexidade || 'Avançado'}
           Desenvolva TODO o conteúdo de cada aula citada no programa em formato Markdown rico.`;

      setStatus('Gerando estrutura e conteúdos... Isso pode levar um minuto. Você pode navegar para outras telas e o processo não será interrompido.');
      
      const responseStream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        config: {
          systemInstruction: `Você é um Grande Acadêmico Maçônico e Escritor de Instruções para a plataforma GOMAU (Grande Ordem Maçônica de Aperfeiçoamento Universal). 
          Sua missão é gerar cursos e instruções profundamente enraizados na Tradição Maçônica, Ritos e Filosofia Universal.
          
          REGRAS DE OURO:
          1. RIGOR DOUTRINÁRIO: O conteúdo deve ser estritamente maçônico. Use termos como "Ir.'.", "A.'.R.'.L.'.S.'.", "Or.'.", "V.'.L.'.", "Colunas", "Templo", etc., conforme apropriado.
          2. CONTEÚDO COMPLETO: Cada aula deve ter um texto exaustivo (mínimo 800 palavras), profundo, em Markdown rico, explorando simbolismo, história e filosofia. Proibido usar resumos ou placeholders.
          3. RESPEITO AOS GRAUS: O conteúdo deve ser compatível com o Grau solicitado. Se for para Aprendiz, foque na Pedra Bruta e nos mistérios iniciais; se for para Mestre, trate da Lenda de Hiram e alta filosofia.
          4. AVALIAÇÕES: Gere exercícios de múltipla escolha e discursivos que testem a compreensão real do mistério ensinado.
          
          JSON SCHEMA: 
          { 
            "titulo": "string", 
            "descricao": "string", 
            "cargaHoraria": "string", 
            "modulos": [ 
              { 
                "id": "m1", 
                "titulo": "string", 
                "unidades": [ 
                  { 
                    "id": "u1", 
                    "titulo": "string", 
                    "aulas": [ 
                      { "id": "a1", "titulo": "string", "conteudo": "string (markdown longo/profundo)", "exercicios": [{ "id", "pergunta", "opcoes", "respostaCorreta" }] } 
                    ],
                    "avaliacao": [...]
                  } 
                ]
              } 
            ] 
          }`,
          responseMimeType: "application/json"
        },
        contents: prompt
      });

      let text = '';
      for await (const chunk of responseStream) {
        text += chunk.text;
        // Atualiza a cada chunk, permitindo que a view veja o texto sendo construído
        generatorStore.setState({ streamingText: text });
      }
      
      let parsedCourseData = null;
      try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedCourseData = JSON.parse(jsonStr);
      } catch (parseError: any) {
        // Se a IA não fechou o JSON completamente (comum em textos longos)
        console.warn("JSON parse failed initially, attempting to fix...", parseError);
        try {
           // Tenta adicionar fechamentos comuns ao final
           let fixedStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
           for(let i=0; i<5; i++) {
             try {
                parsedCourseData = JSON.parse(fixedStr);
                break;
             } catch(e) {
                if(fixedStr.endsWith('"')) fixedStr += '}';
                else if(fixedStr.endsWith('}')) fixedStr = fixedStr.slice(0, -1) + '}]}';
                else if(fixedStr.endsWith(']')) fixedStr = fixedStr.slice(0, -1) + ']}';
                else fixedStr += '"}';
             }
           }
        } catch(e) {
             throw new Error("O texto gerado foi cortado pela metade por ser muito longo e não formou um Curso válido. Diminua a quantidade de Módulos.");
        }
        if (!parsedCourseData) {
            throw new Error("Erro ao ler estrutura final: O texto foi longo demais. Tente gerar com menos Módulos/Aulas.");
        }
      }
      
      generatorStore.logGeneration({ success: true, courseTitle: parsedCourseData.titulo });
      setGeneratedCourse(parsedCourseData);
      setStatus('Curso gerado com sucesso! Revise abaixo.');
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      let errorMsg = err.message;
      if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not valid")) {
          errorMsg = "Sua chave de API do Gemini é inválida. Por favor, acesse Settings > Secrets na AI Studio e verifique ou insira uma chave válida.";
      }
      generatorStore.logGeneration({ success: false, error: errorMsg });
      // Saving partial or error info in global state
      generatorStore.setState({ status: `Erro na geração: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = async () => {
    if (!generatedCourse) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'courses'), {
        ...generatedCourse,
        descricao: generatedCourse.descricao || `Curso aprofundado sobre ${generatedCourse.titulo}`,
        grauMinimo: selectedGrau,
        status: 'rascunho',
        configOriginal: {
           profundidade: config.profundidade,
           linguagem: config.linguagem,
           foco: config.foco,
           complexidade: config.complexidade,
           qtdModulos: config.qtdModulos
        },
        createdAt: serverTimestamp()
      });
      alert("Curso salvo na biblioteca como Rascunho!");
      setGeneratedCourse(null);
      setCourseTitle('');
      setManualProgram('');
    } catch (err: any) {
      alert("Erro ao salvar curso: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveMode('auto')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeMode === 'auto' ? "bg-[#D4AF37] text-black" : "bg-[#1e293b] text-gray-400")}
          >
            Geração Automática
          </button>
          <button 
            onClick={() => setActiveMode('manual')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeMode === 'manual' ? "bg-[#D4AF37] text-black" : "bg-[#1e293b] text-gray-400")}
          >
            Criação via Programa
          </button>
          <button 
            onClick={() => setActiveMode('config')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeMode === 'config' ? "bg-[#D4AF37] text-black" : "bg-[#1e293b] text-gray-400")}
          >
            <Settings size={16} /> Parâmetros
          </button>
        </div>
      </div>

      <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-2xl p-8 shadow-inner">
        {activeMode === 'config' && config && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
              <Settings size={20} /> Configuração do Motor de IA
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold">Módulos</label>
                <input type="number" value={config.qtdModulos} onChange={e => setConfig({...config, qtdModulos: Number(e.target.value)})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-3 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold">Unidades p/ Módulo</label>
                <input type="number" value={config.qtdUnidadesPorModulo} onChange={e => setConfig({...config, qtdUnidadesPorModulo: Number(e.target.value)})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-3 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold">Aulas p/ Unidade</label>
                <input type="number" value={config.qtdAulasPorUnidade} onChange={e => setConfig({...config, qtdAulasPorUnidade: Number(e.target.value)})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-3 text-white" />
              </div>
            </div>

            <div className="border-t border-[#1e293b] pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Sparkles size={16} /> Profundidade do Mistério</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Profundidade Analítica</span>
                    <select value={config.profundidade} onChange={e => setConfig({...config, profundidade: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Ritualística">Ritualística (Instrução de Loja e Prática)</option>
                      <option value="Exegese Bíblica/Histórica">Exegese (Interpretação e Landmarks)</option>
                      <option value="Esoterismo/Ocultismo">Esoterismo (Simbolismo Hermético e Oculto)</option>
                      <option value="Moralista/Ética">Moralista (Aplicação das Virtudes e Ética Maçônica)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Estilo de Linguagem</span>
                    <select value={config.linguagem} onChange={e => setConfig({...config, linguagem: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Solene/Tradicional">Solene (Tratamento Formal e Ritualístico)</option>
                      <option value="Filosófica">Filosófica (Linguagem Reflexiva e Alta Cultura)</option>
                      <option value="Didática Maçônica">Didática (Focada na Instrução de Quadro)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><ListChecks size={16} /> Foco Doutrinário</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Direcionamento da Ordem</span>
                    <select value={config.foco} onChange={e => setConfig({...config, foco: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Liturgia e Ritos">Liturgia (Ritos, Gestos e Palavras)</option>
                      <option value="Simbolismo de Ofício">Simbolismo (Avental, Alfaias, Ferramentas)</option>
                      <option value="História das Lojas">História (Origens, Modernos e Antigos)</option>
                      <option value="Legislação/Landmarks">Legislação (Constituição, Landmarks e Leis 🧱)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Nível de Complexidade</span>
                    <select value={config.complexidade} onChange={e => setConfig({...config, complexidade: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Base do Aprendizado">Base (Essencial para Iniciação)</option>
                      <option value="Instrução Profunda">Instrução Profunda (Avançado/Círculo Interno)</option>
                      <option value="Sabedoria Erudita">Erudita (Pós-Graduação/Altos Graus)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1e293b] pt-6">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><ListChecks size={16} /> Exercícios por Aula</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase">Discursivas</span>
                  <input type="number" value={config.qtdExerciciosPorAula.discursivas} onChange={e => setConfig({...config, qtdExerciciosPorAula: {...config.qtdExerciciosPorAula, discursivas: Number(e.target.value)}})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase">Múltipla Escolha</span>
                  <input type="number" value={config.qtdExerciciosPorAula.multiplaEscolha} onChange={e => setConfig({...config, qtdExerciciosPorAula: {...config.qtdExerciciosPorAula, multiplaEscolha: Number(e.target.value)}})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white" />
                </div>
              </div>
            </div>

            <div className="border-t border-[#1e293b] pt-6 flex justify-end">
              <button onClick={saveConfig} disabled={savingConfig} className="px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:scale-105 transition-all">
                Salvar Parâmetros
              </button>
            </div>
          </div>
        )}

        {activeMode === 'auto' && (
          <div className="space-y-6">
             <div className="flex flex-col gap-2">
               <h2 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
                 <Sparkles size={24} /> Criador Inteligente de Cursos
               </h2>
               <p className="text-gray-400 text-sm">A IA irá estruturar módulos, aulas e avaliações baseada no título escolhido.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Título do Curso ou Instrução</label>
                 <input 
                   type="text" 
                   value={courseTitle}
                   onChange={e => setCourseTitle(e.target.value)}
                   className="w-full bg-[#1e293b] border border-[#D4AF37]/20 rounded-xl p-4 text-xl text-white outline-none focus:border-[#D4AF37] transition-all"
                   placeholder="Ex: A Simbologia Oculta do Pavimento de Mosaico"
                 />
               </div>

               <div className="space-y-4">
                 <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Grau de Instrução Alvo</label>
                 <div className="flex bg-[#1e293b] p-1 rounded-xl h-14">
                   {GRAUS.map(grau => (
                     <button
                       key={grau}
                       onClick={() => setSelectedGrau(grau)}
                       className={cn(
                         "flex-1 rounded-lg text-sm font-medium transition-all",
                         selectedGrau === grau ? "bg-[#D4AF37] text-black shadow-lg" : "text-gray-400 hover:text-gray-200"
                       )}
                     >
                       {grau}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
               
               <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 flex gap-3 text-[#D4AF37]">
                 <AlertCircle className="shrink-0" size={20} />
                 <p className="text-xs">
                   O conteúdo gerado será focado em profundidade filosófica, respeitando a regra de "Não Encher Linguiça". 
                   Você poderá revisar e editar antes de publicar.
                 </p>
               </div>

               <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-bold rounded-xl text-lg flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50"
               >
                 {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                 {loading ? 'Consultando Oráculo de IA...' : 'Gerar Estrutura Completa'}
               </button>
             </div>
        )}

        {activeMode === 'manual' && (
          <div className="space-y-6">
             <div className="flex flex-col gap-2">
               <h2 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
                 <FileText size={24} /> Conversor de Programa Externo
               </h2>
               <p className="text-gray-400 text-sm">Cole o programa do curso (feito por você ou via ChatGPT) e deixe a plataforma estruturá-lo.</p>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Cole o Programa aqui</label>
                 <textarea 
                   value={manualProgram}
                   onChange={e => setManualProgram(e.target.value)}
                   className="w-full bg-[#1e293b] border border-[#D4AF37]/20 rounded-xl p-4 text-sm text-white outline-none focus:border-[#D4AF37] transition-all h-64 resize-none"
                   placeholder="Módulo 1: O Aprendiz... Aula 1: ... Aula 2: ..."
                 />
               </div>

               <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl text-lg flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50"
               >
                 {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                 {loading ? 'Processando Estrutura...' : 'Estruturar Programa'}
               </button>
             </div>
          </div>
        )}
      </div>

      {status && status.startsWith('Erro') && !loading && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mt-6 flex items-center gap-3">
          <AlertCircle size={24} />
          <p>{status}</p>
        </div>
      )}

      {streamingText && (loading || status?.startsWith('Erro')) && (
        <div className="w-full mt-6">
          <div className="bg-[#1e293b] px-4 py-2 border-b border-[#D4AF37]/20 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-gray-400 ml-2 font-mono">generation-log.json {loading ? '(Gerando...)' : '(Interrompido/Erro)'}</span>
            </div>
          </div>
          <div 
            className="bg-[#0A0E1A] border border-[#1e293b] border-t-0 p-6 rounded-b-xl font-mono text-xs text-green-400/80 h-[400px] overflow-y-auto whitespace-pre-wrap flex flex-col items-start justify-end"
          >
            <div className="w-full mt-auto">
               {streamingText}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 size={48} className="text-[#D4AF37] animate-spin" />
          <p className="text-[#D4AF37] font-medium animate-pulse">{status}</p>
        </div>
      )}

      {generatedCourse && (
        <div className="bg-[#1e293b]/30 border border-[#D4AF37]/30 rounded-2xl p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4">
             <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white">{generatedCourse.titulo}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                   <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 uppercase font-bold">
                     {config.profundidade}
                   </span>
                   <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 uppercase font-bold">
                     {config.linguagem}
                   </span>
                   <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 uppercase font-bold">
                     {config.foco}
                   </span>
                </div>
             </div>
             <button onClick={saveToLibrary} className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-all">
               <Save size={18} /> Salvar como Rascunho
             </button>
          </div>

          <div className="space-y-8">
            {generatedCourse.modulos?.map((modulo: any, mIdx: number) => (
              <div key={mIdx} className="bg-black/40 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#D4AF37] mb-4">Módulo {mIdx + 1}: {modulo.titulo}</h3>
                
                <div className="space-y-4 ml-4">
                  {modulo.unidades?.map((unidade: any, uIdx: number) => (
                    <div key={uIdx} className="border-l-2 border-[#D4AF37]/20 pl-6 py-2">
                      <h4 className="font-medium text-gray-200 mb-2">Unidade {uIdx + 1}: {unidade.titulo}</h4>
                      
                      <div className="flex flex-wrap gap-2">
                        {unidade.aulas?.map((aula: any, aIdx: number) => (
                          <div key={aIdx} className="bg-[#1e293b] text-gray-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                            <ChevronRight size={12} className="text-[#D4AF37]" />
                            {aula.titulo}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

```

### Arquivo: `src/components/gestor/GestorValuation.tsx`
```tsx
import React, { useState } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Database, LayoutTemplate, BrainCircuit, HeartHandshake, Link as LinkIcon, Check, BookOpen, Award, GraduationCap, MessageSquare, IdCard, Shield, Bell } from 'lucide-react';

export function GestorValuation() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
     const sharedUrl = window.location.origin.replace('ais-dev-', 'ais-pre-');
     navigator.clipboard.writeText(sharedUrl);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="mb-4 space-y-2">
        <h2 className="text-2xl font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-3">
          <BarChart3 className="text-[#D4AF37]" size={28} /> Avaliação de Mercado (Valuation)
        </h2>
        <p className="text-gray-400 text-sm tracking-wide leading-relaxed">
          Este documento apresenta uma análise técnica e mercadológica do valor de reconstrução 
          e licenciamento desta plataforma. Os valores refletem os custos justos de mercado 
          para o desenvolvimento de um sistema "Full-Stack" de alta complexidade com os mesmos recursos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Modulos */}
        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <LayoutTemplate size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Design & Frontend (React/Tailwind)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Arquitetura Single Page Application (SPA), gestão de estados globais, interface responsiva adaptável, UX moderna focada em retenção (Dark Mode especializado, navegação persistente).
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 18.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Database size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Backend & Infraestrutura (GCP/Firebase)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Modelagem de dados no-SQL, autenticação segura, persistência em tempo real, upload/streaming de arquivos (Storage), regras robustas de segurança e auditorias de acessos diários.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 15.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <ShieldCheck size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Controle de Acessos & RBAC</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Role-Based Access Control para Master, Administradores e Membros. Barreiras de segurança por Grau maçônico, tempo de loja, controle por tokens.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 8.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BrainCircuit size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">I.A. e Automações (Gemini API)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Integração complexa com LLMs para geração estruturada de cursos, quiz, painéis maçônicos automáticos e fóruns moderados. Parsing de JSON dinâmico.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 12.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <TrendingUp size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Tesouraria & Finanças</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Sistema de gestão de faturas PIX, conciliação manual, lançamentos individuais ou em lote, status em tempo real (pendente, pago) e histórico detalhado.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 14.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>
        
        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BookOpen size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Biblioteca Virtual & Tomos Premium</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Módulo de Atheneum standalone com acervo digitalizado, triagem automática por grau iniciático, controle de progresso ("Guardados") e link de ativação via Tesouraria.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 9.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <HeartHandshake size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Cadeia de União & Egrégora</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Módulo espiritual síncrono para vibrações, saúde e preces familiares. Canal místico em tempo real com emissão de intenções de luz direto aos irmãos necessitados.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 5.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <BookOpen size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Anotações Marginais Privadas</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Diário de estudos e notas de exegese integrado diretamente a cada obra do Atheneum para registro autônomo individual de meditações místicas e guardados.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 4.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <ShieldCheck size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Auditoria "Livro Preto" & Finanças</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Lógica de verificação contábil de mensalidades, auditores de adimplência, e status de regularidade do perfil para manutenção estrita das colunas da Loja.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 5.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <HeartHandshake size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Gestão de Projetos & QA</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Horas dedicadas a arquitetura de software, engenharia de prompt avançada, testes E2E, revisões de código, deploy automatizado e alocação de squads.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 6.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Estimativa Base</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Award size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Gamificação & Meritocracia</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Sistema de condecorações e aprovações de mérito (ex: Aprendiz Erudito), com barra de progresso individual, métricas de qualificação e insígnias atreladas ao perfil.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 8.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <GraduationCap size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">LMS & Cursos EAD</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Plataforma completa de Ensino à Distância, com gestão de cursos corporativos, módulos divididos, aulas, quizzes dinâmicos com nota mínima e emissão de certificado virtual.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 18.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <MessageSquare size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Fórum Místico P2P</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Fórum de discussões sigiloso, organizado por categorias maçônicas, suporte a tópicos de dúvidas, curadoria de postagens e moderação ativa.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 6.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <IdCard size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Identidade Digital (CIM)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Geração dinâmica da Carteira de Identidade Maçônica com dados persistidos em tempo real para controle de visibilidade no perfil dos irmãos.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 3.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-dashed border-[#D4AF37]/35 flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/60 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                 <TrendingUp size={24} />
             </div>
             <h3 className="font-bold text-[#D4AF37] uppercase tracking-wide text-sm">Multi-Lojas Inteligente</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
             Arquitetura de isolamento e governança multi-oficina. Inclui regras de validação por prefixo CIM, palavras sagradas independentes por congregação, faturamento e mensalidades individualizadas por Loja.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 11.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest font-sans">Adicional Ativado</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Shield size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Oficiais da Loja & 2º Vigilante</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Gestão independente de 8 cargos ritualísticos, titulares/suplentes em standby, envio de pautas, convocações individuais via WhatsApp e painel de confirmação retroativa.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 13.500,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <ShieldCheck size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Delegação Dinâmica por CIM</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Gerenciador granular de permissões com lookup de obreiros em tempo real, permitindo outorgar controle de pastas específicas do Gestor a membros delegados sem elevar sua role global.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 9.000,00</div>
             <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Adicional Ativo</div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] flex flex-col gap-4 shadow-xl hover:border-[#D4AF37]/50 transition-colors">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-lg bg-[#1e293b] text-[#D4AF37]">
                <Bell size={24} />
             </div>
             <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Monitoramento Real-Time (SLA)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
             Painel de controle do 2º Vigilante com rastreamento síncrono e contagem de ciência de leitura (read receipts) das convocações via Firebase Streams, com SLA progressivo.
          </p>
          <div className="mt-auto">
             <div className="text-[#D4AF37] font-bold text-lg">R$ 5.500,00</div>
             <div className="text-[10px] text-[#D4AF37] font-bold uppercase mt-1 tracking-widest">Adicional Ativado</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent border-l-4 border-[#D4AF37] p-8 rounded-r-xl mt-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Valor Global Estimado</h3>
               <p className="text-sm text-gray-400 font-sans max-w-2xl">
                  Considerando todos os módulos desenvolvidos, o custo final para licitação, documentação estrutural e handoff desta solução no mercado nacional Open/Closed Source.
               </p>
            </div>
            <div className="text-right shrink-0">
               <div className="text-4xl font-extrabold text-[#D4AF37] tracking-tight">R$ 175.000,00</div>
               <div className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">Investimento Calculado</div>
            </div>
         </div>
      </div>

      <div className="bg-[#0A0E1A]/60 backdrop-blur-md p-8 rounded-xl border border-[#D4AF37]/30 shadow-2xl mt-4 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <Database size={120} className="text-[#D4AF37]" strokeWidth={1} />
         </div>
         <div className="relative z-10">
            <h3 className="text-lg font-bold text-[#D4AF37] mb-2 uppercase tracking-wider font-cinzel">Rateio Tecnológico e Manutenção (Custos Operacionais)</h3>
            <p className="text-sm text-gray-400 font-sans mb-6 max-w-3xl leading-relaxed">
               Com uma base atual de aproximadamente <strong>70 membros</strong>, esta é a memória de cálculo para uma mensalidade justa dedicada exclusivamente ao custeio tecnológico, englobando hospedagem, manutenção do sistema, suporte a cadastros, inserção de conteúdos e desenvolvimento contínuo de novas melhorias.
            </p>
            
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-2">
               <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                     <Check size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                     <p className="text-xs text-gray-400 leading-relaxed"><strong className="text-gray-200">Cloud & Infraestrutura:</strong> Hospedagem escalável da plataforma (GCP), serviços serverless de banco de dados (Firebase Firestore), transferências dinâmicas de arquivos e mídias.</p>
                  </div>
                  <div className="flex items-start gap-3">
                     <Check size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                     <p className="text-xs text-gray-400 leading-relaxed"><strong className="text-gray-200">Manutenção & BPO:</strong> Auditoria preventiva de estabilidade, limpeza e suporte de cadastros de obreiros, validações de acesso Google, monitoramento contínuo e tratativas de exceções.</p>
                  </div>
                  <div className="flex items-start gap-3">
                     <Check size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                     <p className="text-xs text-gray-400 leading-relaxed"><strong className="text-gray-200">Conteúdos & Evolução Ativa:</strong> Digitalização e publicação de rituais/artigos no Atheneum, criação/lançamentos de novas funcionalidades estruturais (Software Engineering) sob demanda do Grão-Mestrado e refatorações visuais.</p>
                  </div>
               </div>
               
               <div className="shrink-0 bg-black/40 p-6 rounded-xl border border-[#D4AF37]/20 flex flex-col items-center justify-center min-w-[260px] shadow-lg relative overflow-hidden group hover:border-[#D4AF37]/40 transition-colors">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent"></div>
                  
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 font-cinzel">Mensalidade Tecnológica Justa</span>
                  
                  <div className="flex items-baseline gap-1.5 mb-1">
                     <span className="text-lg text-[#D4AF37] font-bold">R$</span>
                     <span className="text-4xl font-black text-gray-100 tracking-tight">35,00</span>
                     <span className="text-xs text-gray-500 font-mono">/membro</span>
                  </div>
                  
                  <div className="w-full h-px bg-[#D4AF37]/15 my-4"></div>
                  
                  <div className="text-center w-full">
                     <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                        <span>Base de Cálculo</span>
                        <span className="font-bold text-gray-200">70 irmãos</span>
                     </div>
                     <div className="flex justify-between items-center text-xs text-[#D4AF37] font-bold">
                        <span>Fomento Mensal</span>
                        <span>R$ 2.450,00</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] shadow-xl mt-2 flex flex-col md:flex-row items-center gap-4">
         <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-lg bg-[#1e293b] text-[#D4AF37]">
               <LinkIcon size={20} />
            </div>
            <div>
               <h3 className="font-bold text-gray-200 uppercase tracking-wide text-sm">Link de Acesso (Plataforma)</h3>
               <p className="text-xs text-gray-500">URL pública vigente da aplicação.</p>
            </div>
         </div>
         <div className="flex-1 flex w-full">
            <input 
               type="text" 
               readOnly
               value={window.location.origin.replace('ais-dev-', 'ais-pre-')}
               className="bg-[#1e293b] border border-[#334155] border-r-0 rounded-l-lg px-4 py-2 text-gray-300 text-sm font-mono w-full focus:outline-none"
            />
            <button 
               onClick={handleCopyLink}
               className="bg-[#D4AF37] text-black px-6 py-2 rounded-r-lg font-bold text-sm uppercase tracking-wider hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2 min-w-[124px]"
            >
               {copied ? <><Check size={16} /> Copiado</> : 'Copiar URL'}
            </button>
         </div>
      </div>
    </div>
  );
}

```

### Arquivo: `src/components/gestor/SegundoVigilanteView.tsx`
```tsx
import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";
import {
  Shield,
  Save,
  MessageSquare,
  Bell,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Phone,
  User,
  Zap,
  Send,
  Eye
} from "lucide-react";

interface SegundoVigilanteViewProps {
  members: any[];
  currentUser: any;
}

interface OfficerRoleState {
  cim: string;
  nome: string;
  telefone: string;
  suplenteCim: string;
  suplenteNome: string;
  suplenteTelefone: string;
  suplenteAtivo: boolean;
}

const INITIAL_ROLES_STATE: Record<string, OfficerRoleState> = {
  vig1: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  vig2: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  gi: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  ge: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  cap: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  d1: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  d2: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
  dc: { cim: "", nome: "", telefone: "", suplenteCim: "", suplenteNome: "", suplenteTelefone: "", suplenteAtivo: false },
};

const ROLES_KEYS = [
  { key: "vig1", label: "1º Vig ∴" },
  { key: "vig2", label: "2º Vig ∴" },
  { key: "gi", label: "G ∴ I ∴" },
  { key: "ge", label: "G ∴ E ∴" },
  { key: "cap", label: "Cap ∴" },
  { key: "d1", label: "1º D ∴" },
  { key: "d2", label: "2º D ∴" },
  { key: "dc", label: "D∴C∴" },
];

export default function SegundoVigilanteView({ members, currentUser }: SegundoVigilanteViewProps) {
  const [roles, setRoles] = useState<Record<string, OfficerRoleState>>(INITIAL_ROLES_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Messaging state
  const [messageText, setMessageText] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("sessao");
  const [targetSelections, setTargetSelections] = useState<Record<string, boolean>>({
    vig1: true,
    vig2: true,
    gi: true,
    ge: true,
    cap: true,
    d1: true,
    d2: true,
    dc: true,
  });

  const [sendingNotification, setSendingNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load roster config from Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, "configs", "segundo_vigilante");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const loadedData = docSnap.data().roles || {};
          // Merge loaded data with default states
          const merged: Record<string, OfficerRoleState> = {};
          Object.keys(INITIAL_ROLES_STATE).forEach((k) => {
            merged[k] = { ...INITIAL_ROLES_STATE[k], ...(loadedData[k] || {}) };
          });
          setRoles(merged);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do 2º Vigilante:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Subscribe to recent notifications
  useEffect(() => {
    const q = query(
      collection(db, "officersNotifications"),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  // Update boilerplate template message content
  useEffect(() => {
    const today = new Date().toLocaleDateString("pt-BR");
    if (messageTemplate === "sessao") {
      setMessageText(
        `Saudações Fraternais, meu irmão Oficial!\n\nEste é um lembrete do dia e hora da nossa próxima Sessão na Loja. Sua presença como Oficial é de extrema importância para os trabalhos ritualísticos.\n\n📅 Data: [Preencher Dia]\n⏰ Horário: [Preencher Hora]\n🏛️ Templo: Jus Veritas 33`
      );
    } else if (messageTemplate === "iniciacao") {
      setMessageText(
        `Grande e Especial Convite, meu irmão Oficial!\n\nNo próximo evento teremos uma magna Cerimônia de Iniciação. Todos os oficiais devem estar presentes e instruídos em suas respectivas funções ritualísticas para que o brilho do rito seja pleno.\n\n📅 Data: [Preencher Dia]\n⏰ Horário: [Preencher Hora]`
      );
    } else if (messageTemplate === "standby") {
      setMessageText(
        `Alerta de Suplente Ativo!\n\nPrezado irmão Suplente, um oficial titular justificou ausência e você foi Ativado para os próximos trabalhos. Por gentileza, esteja pronto e em standby para assumir o cargo.\n\nCargos com suplentes ativos: por favor verifiquem o painel administrativo.`
      );
    } else {
      setMessageText("");
    }
  }, [messageTemplate]);

  // Autofill Names and Telephones based on CIM whenever the roster state or members list changes
  const handleCimChange = (roleKey: string, field: "cim" | "suplenteCim", value: string) => {
    const targetCim = value.trim();
    const found = members.find((m) => m.cim?.toString().trim() === targetCim);

    setRoles((prev) => {
      const updatedRole = { ...prev[roleKey] };
      if (field === "cim") {
        updatedRole.cim = value;
        updatedRole.nome = found ? found.nome : "";
        updatedRole.telefone = found ? (found.telefone || found.foneEmergencia || "") : "";
      } else {
        updatedRole.suplenteCim = value;
        updatedRole.suplenteNome = found ? found.nome : "";
        updatedRole.suplenteTelefone = found ? (found.telefone || found.foneEmergencia || "") : "";
      }
      return { ...prev, [roleKey]: updatedRole };
    });
  };

  const handleToggleSuplente = (roleKey: string) => {
    setRoles((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        suplenteAtivo: !prev[roleKey].suplenteAtivo,
      },
    }));
  };

  // Save config back to firestore
  const handleSaveConfig = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await setDoc(doc(db, "configs", "segundo_vigilante"), {
        roles,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.nome || "Gestor"
      });
      setSuccessMsg("Configurações dos Oficiais da Loja salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar config:", err);
      setErrorMsg("Falha ao salvar configurações no banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  // WhatsApp individual delivery helpers
  const handleSendIndividualWhatsApp = (roleState: OfficerRoleState, roleName: string, type: "titular" | "suplente") => {
    const isSuplente = type === "suplente";
    const phone = isSuplente ? roleState.suplenteTelefone : roleState.telefone;
    const name = isSuplente ? roleState.suplenteNome : roleState.nome;

    if (!phone) {
      alert("Este irmão não possui telefone cadastrado!");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const personalizedMessage = `Prezado Ir∴ ${name} (${roleName} ${isSuplente ? "Suplente" : "Titular"}),\n\n${messageText}`;
    const encodedMessage = encodeURIComponent(personalizedMessage);

    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`, "_blank");
  };

  // Send platform notifications
  const handleSendPlatformNotification = async () => {
    if (!messageText.trim()) {
      alert("Por favor, escreva o texto da mensagem/lembrete.");
      return;
    }

    setSendingNotification(true);
    try {
      // Find out targeted CIMs
      const targets: string[] = [];
      ROLES_KEYS.forEach(({ key }) => {
        if (targetSelections[key]) {
          const roleState = roles[key];
          if (roleState.suplenteAtivo) {
            if (roleState.suplenteCim) targets.push(roleState.suplenteCim.trim());
          } else {
            if (roleState.cim) targets.push(roleState.cim.trim());
          }
        }
      });

      if (targets.length === 0) {
        alert("Nenhum oficial com CIM válido está selecionado.");
        setSendingNotification(false);
        return;
      }

      await addDoc(collection(db, "officersNotifications"), {
        targets,
        message: messageText,
        sender: "2º Vigilante ∴",
        timestamp: new Date().toISOString(),
        readBy: []
      });

      alert("Lembrete enviado com sucesso dentro da plataforma para todos os oficiais selecionados!");
      setMessageText("");
    } catch (err) {
      console.error("Erro ao enviar notificação de oficiais:", err);
      alert("Erro ao salvar lembrete na plataforma.");
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <div id="segundo-vigilante-view" className="flex flex-col gap-8">
      {/* Roster Configuration Section */}
      <div className="bg-[#0f172a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
              <Shield className="text-[#D4AF37]" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                2° Vigilante ∴ <span className="text-xs bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-medium">Oficiais da Loja</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Gerencie os oficiais titulares, configure os suplentes em standby e coordene comunicações.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-sm shadow-md"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            <span>Salvar Oficiais</span>
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Grid of Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES_KEYS.map(({ key, label }) => {
              const rState = roles[key] || INITIAL_ROLES_STATE[key];
              const isSubAtivo = rState.suplenteAtivo;

              return (
                <div
                  key={key}
                  className={`bg-[#1e293b]/10 border rounded-xl p-5 transition-all ${
                    isSubAtivo
                      ? "border-amber-500 bg-amber-950/5 shadow-inner shadow-amber-500/5"
                      : "border-[#1e293b] hover:border-[#D4AF37]/20"
                  }`}
                >
                  {/* Role Title Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-black text-[#D4AF37] tracking-wider uppercase">
                      {label}
                    </span>
                    <button
                      onClick={() => handleToggleSuplente(key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 border transition-all ${
                        isSubAtivo
                          ? "bg-amber-500 text-black border-amber-400 font-extrabold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <Zap size={12} />
                      {isSubAtivo ? "Suplente Ativo" : "Ativar Suplente"}
                    </button>
                  </div>

                  {/* Inputs and Members Lookup */}
                  <div className="flex flex-col gap-4">
                    {/* Official (Titular) Card */}
                    <div className={`p-3.5 rounded-lg border bg-black/40 ${isSubAtivo ? "opacity-40 border-[#1e293b]" : "border-[#1e293b]/50"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                          <User size={10} /> Titular
                        </span>
                        {!isSubAtivo && rState.nome && rState.telefone && (
                          <button
                            onClick={() => handleSendIndividualWhatsApp(rState, label, "titular")}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 flex items-center gap-1 text-[10px]"
                            title="Enviar WhatsApp Individual"
                          >
                            <Phone size={10} /> WhatsApp
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="CIM do Titular"
                          value={rState.cim}
                          onChange={(e) => handleCimChange(key, "cim", e.target.value)}
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white w-28 placeholder-gray-600 outline-none focus:border-[#D4AF37]/30"
                        />
                        <div className="flex-1 bg-[#1e293b]/20 px-3 py-1.5 rounded border border-[#1e293b]/20 text-xs font-semibold text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                          {rState.nome || <span className="text-gray-500 italic font-normal">Digite o CIM</span>}
                        </div>
                      </div>
                    </div>

                    {/* Substitute (Suplente) Card */}
                    <div className={`p-3.5 rounded-lg border bg-black/40 ${isSubAtivo ? "border-amber-500/40 bg-amber-950/10" : "border-[#1e293b]/50 opacity-65"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                          <Clock size={10} /> Suplente (Standby)
                        </span>
                        {rState.suplenteNome && rState.suplenteTelefone && (
                          <button
                            onClick={() => handleSendIndividualWhatsApp(rState, label, "suplente")}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 flex items-center gap-1 text-[10px]"
                            title="Enviar WhatsApp Individual ao Suplente"
                          >
                            <Phone size={10} /> WhatsApp
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="CIM do Suplente"
                          value={rState.suplenteCim}
                          onChange={(e) => handleCimChange(key, "suplenteCim", e.target.value)}
                          className="bg-[#0B0B0C] border border-[#1e293b] rounded px-3 py-1.5 text-xs text-white w-28 placeholder-gray-600 outline-none focus:border-[#D4AF37]/30"
                        />
                        <div className="flex-1 bg-[#1e293b]/20 px-3 py-1.5 rounded border border-[#1e293b]/20 text-xs font-semibold text-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                          {rState.suplenteNome || <span className="text-gray-500 italic font-normal">Digite o CIM</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messaging and Reminders Panel */}
      <div className="bg-[#0f172a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
        {/* ... existing messaging panel content ... */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-4 flex items-center gap-3">
          <div className="bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
            <MessageSquare className="text-[#D4AF37]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">
              Central de Comunicação e Mensagens
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Envie comunicados individuais pelo WhatsApp ou envie lembretes internos na plataforma.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel - Target selections */}
          <div className="bg-black/20 border border-[#1e293b] p-4 rounded-lg flex flex-col gap-3">
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
              Selecione os Oficiais Destinatários
            </h4>
            <div className="flex flex-col gap-2">
              {ROLES_KEYS.map(({ key, label }) => {
                const rState = roles[key];
                const activeName = rState?.suplenteAtivo ? rState.suplenteNome : rState?.nome;
                const activeCim = rState?.suplenteAtivo ? rState.suplenteCim : rState?.cim;

                return (
                  <label
                    key={key}
                    className="flex items-center gap-3 bg-[#1e293b]/10 p-2.5 rounded border border-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={targetSelections[key]}
                      onChange={() =>
                        setTargetSelections((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className="accent-[#D4AF37]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#D4AF37] block">{label}</span>
                      <span className="text-gray-300 font-medium block truncate">
                        {activeName ? (
                          `${activeName} (CIM: ${activeCim})`
                        ) : (
                          <span className="text-gray-500 italic font-normal">Não escalado</span>
                        )}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Right panel - Message Composer */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5 font-bold uppercase tracking-wide">
                Modelos Rápidos / Boilerplates
              </label>
              <div className="flex gap-2">
                {[
                  { id: "sessao", label: "Lembrete de Sessão" },
                  { id: "iniciacao", label: "Lembrete Iniciação" },
                  { id: "standby", label: "Alerta de Standby" },
                  { id: "custom", label: "Texto Livre" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMessageTemplate(t.id)}
                    className={`flex-1 text-xs py-2 px-3 border rounded-lg font-semibold transition-all ${
                      messageTemplate === t.id
                        ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]"
                        : "bg-[#0b0b0c] text-gray-400 border-[#1e293b] hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-xs text-gray-400 block mb-1.5 font-bold uppercase tracking-wide">
                Conteúdo da Mensagem
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                placeholder="Escreva aqui a mensagem fraternal para os oficiais..."
                className="bg-[#0B0B0C] border border-[#1e293b] rounded-lg p-4 text-white text-xs w-full focus:border-[#D4AF37]/50 focus:ring-0 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-amber-950/10 border border-amber-500/10 rounded-lg p-3 text-[11px] text-amber-200/70">
                💡 <span className="font-bold text-amber-400">Instruções:</span> O botão individual do WhatsApp (dentro dos cards acima) enviará este texto personalizado de forma direta para o irmão correspondente. O botão abaixo fará um envio massivo de notificações integradas dentro da própria plataforma.
              </div>

              <div className="flex flex-col gap-2 shrink-0 sm:w-64">
                <button
                  onClick={handleSendPlatformNotification}
                  disabled={sendingNotification}
                  className="w-full bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-xs"
                >
                  {sendingNotification ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Bell size={14} />
                  )}
                  <span>Notificar na Plataforma</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Tracking Panel */}
      <div className="bg-[#0f172a] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/30 px-6 py-4 flex items-center gap-3">
          <div className="bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/30">
            <Eye className="text-[#D4AF37]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">
              Monitoramento de Confirmações
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Acompanhe em tempo real quais oficiais confirmaram a ciência dos alertas enviados na plataforma.
            </p>
          </div>
        </div>
        <div className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              Nenhuma notificação recente encontrada.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {notifications.map(notif => {
                const date = new Date(notif.timestamp).toLocaleString("pt-BR");
                const totalTargets = notif.targets?.length || 0;
                const readCount = notif.readBy?.length || 0;
                const allRead = totalTargets > 0 && totalTargets === readCount;
                
                return (
                  <div key={notif.id} className="bg-black/30 border border-[#1e293b] rounded-lg p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-300 whitespace-pre-wrap flex-1 mr-4">
                        <span className="text-[#D4AF37] font-bold text-xs block mb-1">
                          Enviado em {date}
                        </span>
                        {notif.message.length > 100 ? notif.message.substring(0, 100) + '...' : notif.message}
                      </div>
                      <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${allRead ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {allRead ? <Check size={12} /> : <Clock size={12} />}
                        {readCount} / {totalTargets} Confirmados
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {notif.targets?.map((targetCim: string, idx: number) => {
                        const member = members.find(m => m.cim?.toString() === targetCim);
                        const name = member ? member.nome : `CIM ${targetCim}`;
                        const isRead = notif.readBy?.includes(targetCim);
                        
                        return (
                          <div key={idx} className={`text-xs px-3 py-2 rounded-lg border flex items-center justify-between ${isRead ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
                            <span className="truncate pr-2 font-medium" title={name}>{name}</span>
                            {isRead ? <Check size={14} className="shrink-0" /> : <Clock size={14} className="shrink-0 opacity-70" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

```

