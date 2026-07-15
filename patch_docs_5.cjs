const fs = require('fs');
let manual = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');
manual = manual.replace(
  '1. **Módulo de Slides Interativos (Onboarding de Membros)**: Atualização da rota `/workshop` para focar estritamente na experiência do membro, cobrindo o Dashboard, Biblioteca, Cursos e Fórum. A engine de apresentação imersiva com suporte a atalhos de teclado (setas, espaço, escape) permanece.',
  '1. **Tutorial Completo de Onboarding**: Expansão total da rota `/workshop`. O módulo foi reescrito para servir como um manual interativo exaustivo, ensinando passo a passo como o Membro usa o Dashboard, Perfil, Biblioteca, Cursos, Player de Vídeo, Fóruns, Envio de Pranchas e Suporte. A engine fluida com atalhos e animações foi mantida, mas agora quebra qualquer limite de slides para entregar uma instrução verdadeiramente completa.'
);
fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', manual);

let integracao = '';
try {
  integracao = fs.readFileSync('INTEGRACAO_CURSOS.md', 'utf8');
  integracao = integracao.replace(
    'Módulos Apresentados:\n1. O seu Painel de Controle\n2. Acervo Digital de Pranchas\n3. Cursos E-Learning\n4. Comunidade e Fóruns',
    'Módulos Apresentados:\n1. O Painel Inicial (Dashboard)\n2. Configurações de Perfil\n3. Biblioteca (Acervo de Pranchas)\n4. Cursos E-Learning (Catálogo e Player)\n5. Fórum e Comunidade\n6. Envios e Pranchas\n7. Suporte'
  );
  fs.writeFileSync('INTEGRACAO_CURSOS.md', integracao);
} catch(e) {}
