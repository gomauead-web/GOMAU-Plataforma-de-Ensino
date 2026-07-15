const fs = require('fs');

let manual = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');
const manualAdd = `
- **2026-07-14 (Workshop de Apresentação):**
  1. **Módulo de Slides Interativos**: Criação da rota \`/workshop\` contendo uma engine de apresentação imersiva com suporte a atalhos de teclado (setas, espaço, escape), construída com framer-motion para o dia de lançamento e apresentação.
  2. **Integração no Catálogo (Owner Only)**: O curso "Domínio da Plataforma G∴O∴M∴A∴U∴" foi injetado silenciosamente em \`Cursos EAD\` com exclusividade para \`MASTER_ADMINS\`. Ao clicar no card, o gestor é direcionado diretamente aos Slides Interativos.
`;
manual = manual.replace('## 5. Changelog e Histórico de Evolução\n', '## 5. Changelog e Histórico de Evolução\n' + manualAdd);
fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', manual);

let integracao = '';
try {
  integracao = fs.readFileSync('INTEGRACAO_CURSOS.md', 'utf8');
} catch(e) {}

if (integracao) {
  const integracaoAdd = `
## Nova Funcionalidade (14/07/2026) - Workshop Presentation
Foi criado um curso simulado ("Domínio da Plataforma G∴O∴M∴A∴U∴") exclusivo para Master Admins dentro da aba "Cursos EAD". Em vez de abrir um player de vídeo tradicional, este card redireciona o Owner para a rota oculta \`/workshop\`, que inicializa um Deck de Slides Interativo em tela cheia com atalhos de teclado. 
Módulos Apresentados:
1. Visão Geral e Navegação
2. Gestão de Lojas e Membros
3. Cursos e Conteúdos EAD
4. Telemetria e Engajamento Zero-Cost
`;
  integracao += integracaoAdd;
  fs.writeFileSync('INTEGRACAO_CURSOS.md', integracao);
}

