# Evolução do EAD: Arquitetura Nativa (Mestre-IA) G∴O∴M∴A∴U∴

**Data de Atualização:** 2026-06-26
**Status:** Módulo de IA Nativo Implementado. Integração Externa (Iframe) Cancelada.

## 1. O Cenário Inicial vs Decisão Final

Originalmente (conforme doc de 11/05/2026), havia uma proposta de integrar uma plataforma de cursos externa via `<iframe>` ou Shared Database. No entanto, por razões de **Segurança Maçônica (Triplo Portal)**, **Isolamento de Dados (Privacy)** e **Experiência do Usuário Centralizada**, a decisão de engenharia foi pivotar para uma solução **100% nativa (In-House)**.

Ao invés de conectar com um sistema terceiro, foi construído do zero o motor **Gerador de Cursos (Mestre-IA)** diretamente dentro da Área do Gestor da Plataforma GOMAU.

## 2. A Nova Arquitetura de EAD Nativo

A plataforma agora possui seu próprio LMS (Learning Management System) integrado organicamente ao Firestore e autenticação dos irmãos.

### 2.1. O Motor Generativo de Cursos (CourseGenerator.tsx)

- O Gestor acessa a aba EAD/Cursos na Área Administrativa.
- Preenche os parâmetros: **Tema Místico** e **Grau Mínimo** de restrição.
- A plataforma aciona diretamente a API `@google/genai` (Modelo `gemini-3.1-pro-preview`).
- **Prompt Estruturado (JSON Mode):** O Mestre-IA atua gerando todo o currículo do curso: Título, Carga Horária, Lista de Aulas (renderizadas no front com suporte pleno a Markdown para formatações ocultistas/simbólicas) e um Quiz avaliativo final de 5 perguntas (array options e correctIndex).
- O retorno JSON é instantaneamente salvo na coleção `courses` do Firestore.

### 2.2. A Visão do Obreiro (CursosExternos.tsx e CursoDetail.tsx)

- No Dashboard ou Menu lateral, o irmão acessa a aba "EAD".
- A interface de listagem (`CursosExternos.tsx`) oculta os cursos que requerem um grau superior ao do irmão (Filtro por `minGrau`).
- Ao entrar num curso (`CursoDetail.tsx`), a UI se divide em Sidebar (Aulas) e Body (Conteúdo Markdown).
- Botões de "Marcar como Concluída" avançam o progresso, salvando no array `aulasConcluidas` dentro da coleção `courseProgress`.

### 2.3. Sincronização Progressiva e Gamificação

- Como os dados rodam no mesmo ecossistema (Firebase), quando o aluno finaliza o Quiz e tira a nota de aprovação (min. 7), o documento `courseProgress` tem seu `status` alterado para `concluido`.
- Automaticamente, o Dashboard principal e o perfil do usuário leem esse progresso, e se houver Regras de Evolução (para passagem de grau) que exijam "N Cursos Concluídos", isso já é computado nativamente.
- O Histórico/Timeline (`HistoryPage`) também registra a glória da conclusão.

## 3. Benefícios da Solução Nativa Adotada

- **Zero Atrito:** Sem necessidade de Webhooks ou CORS. Tudo transita via Firestore SDK.
- **Fidelidade Visual:** A UI EAD respeita a estética Imperial Midnight (Black & Gold) original da ferramenta, mantendo imersão total.
- **Performance:** Os cursos são cacheados e carregados muito mais rapidamente do que via Iframes (onde perderíamos controle de navegação e UX mobile).
- **Gamificação Segura:** Sem risco de APIs forjadas atualizando o progresso; as Security Rules do Firestore protegem o documento `courseProgress`.

## 4. Evolução (2026-07-01): Câmara de Criação Premium

O sistema evoluiu para comportar obras ainda mais complexas (Livros, Cursos Interativos e Formatos Híbridos) operando com o `gemini-3.1-pro-preview` através de um Backend Full-Stack Server (Express). 

O módulo "Câmara de Criação", exclusivo para acesso Premium/Administrativo, gera estruturas de dados ainda mais ricas:
- **Hierarquia:** Curso -> Módulos -> Unidades -> Aulas -> Exercícios.
- **Validação Server-Side:** A API Key do Gemini foi movida definitivamente para o `server.ts` (`/api/premium/generate`), garantindo proteção absoluta e processamento off-loaded do cliente.
- **Visualizador Próprio:** Os cursos/manuais gerados são acessados via `PremiumCourseViewerPage`, que orquestra a visibilidade da nova arquitetura hierárquica baseada no Grau do aluno.

