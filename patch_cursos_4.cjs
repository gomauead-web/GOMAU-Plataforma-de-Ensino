const fs = require('fs');
let code = fs.readFileSync('src/pages/CursosExternos.tsx', 'utf8');

code = code.replace(
  "title: 'Conhecendo a Plataforma G∴O∴M∴A∴U∴'",
  "title: 'Tutorial Completo: Guia de Navegação do Membro'"
);
code = code.replace(
  "description: 'Workshop de boas-vindas: Navegação, acervo digital, cursos e fóruns exclusivos para membros.'",
  "description: 'Manual passo a passo abrangendo Dashboard, Perfil, Biblioteca, Fóruns, Cursos EAD e Envio de Pranchas.'"
);
fs.writeFileSync('src/pages/CursosExternos.tsx', code);
