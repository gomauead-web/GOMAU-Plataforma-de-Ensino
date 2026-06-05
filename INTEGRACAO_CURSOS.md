# Estudo de Integração: G∴O∴M∴A∴U∴ & Plataforma de Cursos Externa

**Data:** 11/05/2026
**Status:** Aguardando comando "Integração"

## 1. O Cenário
O proprietário possui duas ferramentas distintas no ecossistema Gemini AI Studio:
1.  **Plataforma Maçônica (Esta):** Gestão de membros, evolução, pranchas e administrativo.
2.  **Gerador de Cursos (Externa):** Criação e exibição de cursos dinâmicos.
    - URL Root: `https://ais-pre-ez63mpaawuwnam5r5jq3m7-106517683243.us-east5.run.app/library`
    - URL Curso Exemplo: `https://ais-pre-ez63mpaawuwnam5r5jq3m7-106517683243.us-east5.run.app/course/UohPegsEPV83KJBrtTqv`

## 2. Necessidades Detectadas
- Exibir os cursos da ferramenta externa dentro desta plataforma maçônica.
- Impedir que o aluno acesse menus ou outras áreas da ferramenta de cursos (foco apenas no player do curso).
- Sincronizar o progresso: Cursos concluídos na ferramenta externa devem impactar automaticamente a evolução (Checklist de Grau) do membro nesta plataforma.
- Filtrar cursos por Grau Maçônico.

## 3. Estratégias Propostas (Resumo para Decisão)

### Opção A: Embedding via Iframe com Parâmetros (Lightweight)
- **Como:** Inserir o curso via `<iframe>` usando uma rota customizada na ferramenta externa (ex: `/course/:id?mode=embed`) que esconda barras de navegação via CSS.
- **Prós:** Visualmente integrado, rápido de implementar.
- **Contras:** Sincronização de progresso depende de disparos de Webhook ou compartilhamento de Firestore.

### Opção B: Integração via Shared Database (Recomendada)
- **Como:** Como ambas as ferramentas pertencem ao mesmo dono, podemos configurar a ferramenta Maçônica para ler diretamente a coleção `courses` e `userProgress` do projeto Firebase da ferramenta de cursos.
- **Prós:** Sincronização em tempo real (Real-time). O membro termina o curso lá e o checklist aqui marca "concluído" instantaneamente.
- **Contras:** Requer configuração de multitenancy ou permissões Cross-Project no Google Cloud.

### Opção C: API de Sincronização (Workflow)
- **Como:** A ferramenta de cursos dispara um evento para a ferramenta Maçônica quando um curso é finalizado.
- **Prós:** Arquitetura limpa.
- **Contras:** Maior esforço de desenvolvimento em ambas as pontas.

## 4. Próximos Passos
Ao receber o comando **"Integração"**, o assistente irá sugerir o plano técnico detalhado para a **Opção B**, garantindo que a carteira de identidade e a evolução do membro sejam o centro da experiência.
