const fs = require('fs');
let manual = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');
manual = manual.replace(
  '1. **Módulo de Slides Interativos**: Criação da rota \`/workshop\` contendo uma engine de apresentação imersiva com suporte a atalhos de teclado (setas, espaço, escape), construída com framer-motion para o dia de lançamento e apresentação.',
  '1. **Módulo de Slides Interativos (Onboarding de Membros)**: Atualização da rota \`/workshop\` para focar estritamente na experiência do membro, cobrindo o Dashboard, Biblioteca, Cursos e Fórum. A engine de apresentação imersiva com suporte a atalhos de teclado (setas, espaço, escape) permanece.'
);
fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', manual);

let integracao = '';
try {
  integracao = fs.readFileSync('INTEGRACAO_CURSOS.md', 'utf8');
  integracao = integracao.replace(
    'Módulos Apresentados:\n1. Visão Geral e Navegação\n2. Gestão de Lojas e Membros\n3. Cursos e Conteúdos EAD\n4. Telemetria e Engajamento Zero-Cost',
    'Módulos Apresentados:\n1. O seu Painel de Controle\n2. Acervo Digital de Pranchas\n3. Cursos E-Learning\n4. Comunidade e Fóruns'
  );
  fs.writeFileSync('INTEGRACAO_CURSOS.md', integracao);
} catch(e) {}
