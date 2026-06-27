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
