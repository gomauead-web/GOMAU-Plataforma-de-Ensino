# 🏛️ Plataforma G∴O∴M∴A∴U∴ - Mapeamento Detalhado e Arquitetura Global

Este documento é a **Bíblia Arquitetural e Funcional** do sistema G∴O∴M∴A∴U∴. Ele detalha CADA TELA, OPÇÃO, CAMPO, REGRA DE NEGÓCIO E MECANISMO DE BASTIDORES presente na plataforma. Elaborado após profunda auditoria de sistema.

---

## 🔐 1. MÓDULO DE AUTENTICAÇÃO E ACESSO (LOGIN & SEGURANÇA)

### 1.1. Tela de Login (`src/pages/Login.tsx`)
A porta de entrada do sistema. Não é um login comum, mas um **Ritual de Acesso (Multi-fator maçônico)** desenhado em 4 fases sequenciais.

*   **Fase 1 (SSO / Google OAuth):**
    *   *Visual:* Botão "Entrar com Google".
    *   *Regra de Bastidor:* Usa `firebase/auth`. O sistema captura o e-mail retornado pelo Google e busca na coleção `users`. Se o e-mail não existir, o acesso é sumariamente negado (evita que curiosos criem contas).
*   **Fase 2 (Desafio de Idade):**
    *   *Visual:* Input numérico perguntando a idade do membro.
    *   *Regra:* Verifica na base de dados se bate com a data de nascimento. Adiciona uma camada contra acessos automatizados.
*   **Fase 3 (Verificação de CPF):**
    *   *Visual:* Pede os 3 primeiros e 2 últimos dígitos do CPF.
    *   *Regra:* Impede que familiares, utilizando um dispositivo que já tenha o Google logado, consigam avançar.
*   **Fase 4 (Palavra Semestral / Palavra Passe):**
    *   *Visual:* Simula um trolhamento (reconhecimento maçônico).
    *   *Regra:* Valida contra um hash ou string fixa configurada pela administração.

**⚙️ Bastidores Profundos (AuthContext & Login):**
*   **Sessão e Cache:** Configurado via `browserLocalPersistence`. Possui `sessionTimeout` que desloga usuários ociosos.
*   **Anti-Duplicidade (Self-Healing DB):** Durante a geração do token, o `AuthContext` vasculha o Firestore buscando contas criadas por erro (Ex: o Secretário importou um Excel e criou um perfil temporário, mas o usuário logou com Google e gerou um novo UID). O sistema automaticamente **mescla os dados** no UID oficial do Google e deleta o registro órfão temporário.
*   **Heartbeat / Telemetria:** No exato milissegundo em que o login é finalizado com sucesso, é gravado um log na coleção `accessLogs` com o `timestamp` do servidor.
    *   *Exceção de Custo:* Administradores/Masters (lista `MASTER_ADMINS`) estão programaticamente excluídos deste log (não gravam `accessLogs`) para economizar *writes/reads* no banco de dados e não poluir as estatísticas de engajamento da loja.

---

## 🏛️ 2. ÁREA DO MEMBRO (PORTAL DO IRMÃO)

Telas visíveis a todos os usuários validados. O acesso a essas páginas ocorre num layout protegido (`Layout.tsx`), que engloba rotas autenticadas.

### 2.1. Dashboard Principal (`Dashboard.tsx`)
Painel de entrada que agrupa widgets resumidos de todas as áreas.
*   **Cabeçalho Personalizado:** Exibe saudação baseada no grau (Ir∴ Aprendiz, Comp∴, Mestre).
*   **Widget Próxima Sessão:** (Visível) Data, horário e traje da reunião vindoura, extraída da coleção `events`.
*   **Estatísticas Pessoais:** Mostra percentual de presença, adimplência e evolução em cursos.
*   **Notificações (NotificationManager.tsx):** Alertas push customizados sobre mensagens não lidas ou anuidades vencendo.

### 2.2. Perfil e Identidade Maçônica (`ProfilePage.tsx` & `CIMCard.tsx`)
Acesso à própria ficha cadastral.
*   **CIM Card (Carteira de Identidade Maçônica):** Um cartão visual gerado puramente em CSS e TypeScript, formatado como um cartão bancário elegante, exibindo Nome, Grau, CIM, e dados da Potência.
*   **Campos Editáveis vs Protegidos:** O membro só pode editar foto de perfil, profissão, endereço e telefone. *Campos bloqueados (Regra Firestore):* CIM, Grau, Data de Iniciação, Status Financeiro. A tentativa de alterar esses dados via injeção de API é barrada pelo Firebase Rules.

### 2.3. Biblioteca e Pranchas (`LibraryPage.tsx`)
Acervo digital da Oficina.
*   **Layout:** Grid de cards com ícones e formatos (PDF, DOCX). Separado em sub-abas (Simbolismo, Legislação, Ritualística).
*   **🛡️ Regra Inviolável (Segredo Maçônico):** Filtro absoluto no *Backend*. Quando um membro solicita a lista de documentos, a *query* no Firebase tem a cláusula `where("grau_minimo", "<=", user.grau)`. Se um Aprendiz tentar forçar o download de um arquivo de Mestre burlando o frontend, o Firestore rejeita a conexão (`insufficient permissions`).

### 2.4. Plataforma EAD / Educação (`ContentPage.tsx`, `CursoDetail.tsx`)
Área de instruções obrigatórias e complementares.
*   **Visualização de Cursos:** Módulos separados (Ex: "Instruções de 1º Grau").
*   **Player de Aulas:** Visualizador de Markdown rico com suporte a formatação maçônica.
*   **Sistema de Progresso:** Botão "Concluir Instrução". Ao clicar, grava no subdocumento do usuário. Isso é usado pelo Segundo Vigilante para monitorar quem está apto ao aumento de salário.

### 2.5. Tesouraria Individual (`TreasuryPage.tsx`)
Extrato financeiro do membro.
*   **Visual:** Lista de mensalidades/capitações do ano. Status: Pago (Verde), Pendente (Amarelo), Atrasado (Vermelho).
*   **Tronco de Solidariedade:** Seção para gerar PIX ou doações avulsas.
*   **Regra:** O membro tem apenas privilégios de **Leitura** (`allow read: if resource.data.uid == request.auth.uid`). Ele não pode dar baixa nos próprios boletos.

### 2.6. Calendário e Check-in (`CalendarPage.tsx`)
Agenda de pranchas e sessões.
*   **Componente de Check-in:** Libera um botão interativo apenas no intervalo de horário da sessão programada.
*   **Bastidor:** Grava na coleção `attendance`. Usado para os relatórios de escrutínio.

### 2.7. Cadeia de União Virtual (`CadeiaUniaoPage.tsx`)
O "LinkedIn/Networking" interno.
*   **Lista de Membros:** Pesquisa de membros por profissão ou nome (útil para negócios entre irmãos).
*   **Status Online:** Usa o *Heartbeat* do `accessLogs` para colocar um indicador (bolinha verde) em irmãos ativos recentemente.

---

## 👑 3. ÁREA DO GESTOR (ADMINISTRAÇÃO / VENERALATO)

Ambiente blindado. O renderizador React oculta os ícones do menu lateral para qualquer usuário que não tenha `isMaster === true` no contexto de autenticação.

### 3.1. Gestor Dashboard (`GestorDashboard.tsx`)
O painel de comando unificado.
*   **Indicadores Macro:** Total de Obreiros, Presença Média, Caudal Inadimplente.
*   **Tabela de Obreiros:** Gestão CRUD completa. O gestor pode:
    *   Aprovar/Validar o acesso de um recém-iniciado.
    *   Editar todos os dados protegidos (Mudar grau, alterar CIM).
    *   Suspender (`status: 'inactive'`), o que desloga automaticamente o membro em seu dispositivo via listener reativo.

### 3.2. Telemetria e Engajamento (`TelemetryView.tsx`)
O "Big Brother" da loja. Otimizado para performance.
*   **Interface Expansível:** Projetado para rodar em *Full Screen Modal* para leitura ideal dos gráficos densos (Recharts).
*   **Estatísticas (Aggregation Queries):** Contadores absolutos (Desde a Fundação, Mês, Semana, Hoje) utilizando a função `getCountFromServer` do Firebase (custo quase zero, não baixa documentos para contar).
*   **Ranking de Engajamento:** Lista dinâmica dos 5 Irmãos mais assíduos na plataforma, identificados com medalhas visuais.
*   **Otimização e Limites:** A *query* do gráfico de 30 dias aplica `limit(500)` para proteger a fatura da infraestrutura, barrando surtos de requisições.

### 3.3. Valuation do Sistema (`GestorValuation.tsx`)
Ferramenta executiva que metrifica o valor em código da plataforma.
*   **Cards Detalhados:** Estipula o custo (R$) e impacto de cada módulo criado na plataforma (Ex: Auditoria de Segurança, Tesouraria, Telemetria).
*   **Fórmula:** Recalcula o valor total em tempo real (Atualmente ~R$ 193.500,00). Utilizado para demonstrar o ROI (Retorno sobre Investimento) e patrimônio digital da Loja.

### 3.4. Gestão da Instrução (Vigilantes) (`SegundoVigilanteView.tsx`)
Ferramenta específica para os 1º e 2º Vigilantes.
*   **Grade de Evolução:** Lista apenas os Aprendizes (2º Vig) e Companheiros (1º Vig).
*   **Relatório de Aulas:** Mostra, em barras de progresso cruzadas, quem já leu quais peças de arquitetura, municiando a decisão de propostas de aumento de salário (elevação/exaltação).

### 3.5. Tesouraria Global (`GestorTreasury.tsx` & `TreasurySituation.tsx`)
Controle de caixa geral da Potência/Loja.
*   **Painel Central:** Gráfico de Receitas vs Despesas da Loja. Saldo em Caixa atual.
*   **Controle de Inadimplência:** Filtro poderoso que puxa membros com 1, 2, ou 3+ mensalidades em atraso.
*   **Ações:** Permite baixar parcelas massivamente, estornar recebimentos e gerar cobranças consolidadas.

### 3.6. Biblioteca Gestor (`GestorLibrary.tsx`)
Administração do repositório.
*   **Upload e Defesa:** Ao fazer upload de um documento, o Gestor é OBRIGADO a setar o "Grau Mínimo". Isso assegura que Pranchas de Mestres nunca fiquem na raiz aberta.

### 3.7. Course Generator AI (`CourseGenerator.tsx`)
Automação de ensino via IA.
*   **Ferramenta Mestra:** Um prompt-builder que cria currículos e grades de instruções maçônicas utilizando IA generativa para auxiliar o orador/instrutores.

### 3.8. Permissões Administrativas (`AdminPermissionsManager.tsx`)
Delegação de poderes.
*   **Role-Based Access Control (RBAC):** Permite fragmentar o poder. O Venerável Mestre pode dar permissão de "Apenas Tesouraria" ao Tesoureiro. O Tesoureiro não verá a Telemetria ou as Permissões. Isso é gerenciado pelas `roles` no documento do usuário no Firestore.

---

## ⚙️ 4. AUDITORIA DE BASTIDORES, SEGURANÇA E PERFORMANCE

O core técnico e infraestrutural invisível a olho nu, recentemente auditado.

### 4.1. Firebase Security Rules (`firestore.rules`)
A aplicação utiliza a técnica de **"Global Safety Net" fechada**.
*   `match /{document=**} { allow read, write: if false; }`: Bloqueio padrão absoluto. Nenhuma coleção vaza dados sem uma regra explícita sobrepondo.
*   **Validação de Tipo e Propriedade:** Regras estritas impedem que um usuário forje chamadas via API para sobrescrever o próprio `grau` ou seu `isAdimplente`.

### 4.2. Performance (React Memory & Render Optimization)
*   **Prevenção de Leaks:** Aplicação ostensiva de hooks como `useMemo` e `useCallback`, especialmente no `AuthContext` e na Telemetria, prevenindo que alterações microscópicas no state causem repintura completa do DOM (evita lentidão extrema em computadores mais antigos e mobile).
*   **Tree-Shaking e Lazy Loading:** Estruturas modulares no roteador para que o painel do Gestor não seja baixado pelo celular do Aprendiz, otimizando o consumo de banda.

### 4.3. Infraestrutura Assíncrona e CI/CD
*   **Tratamento de Exceções:** Bloqueios de Promessas (`try/catch` robustos em todo o Auth e Firestore).
*   **CORS e Headers:** Blindagem provida pela hospedagem e middlewares (Node/Express quando acionado).

---

> **Resumo Geral:** A plataforma G∴O∴M∴A∴U∴ não é apenas um portal visual; é um **ERP maçônico de alta complexidade**, mesclando gamificação educacional, telemetria analítica severa, blindagem hierárquica por graus e um backend de self-healing (autolimpeza). Cada tela foi projetada com precedências restritas ditadas tanto pela liturgia maçônica quanto pelas melhores práticas de segurança de software corporativo (DevSecOps e OWASP).
