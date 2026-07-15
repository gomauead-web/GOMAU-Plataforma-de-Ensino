const fs = require('fs');
let code = fs.readFileSync('src/pages/CursosExternos.tsx', 'utf8');

code = code.replace(
  "onClick={() => navigate(`/cursos/${course.id}`)}",
  "onClick={() => course.id === 'workshop-gomau' ? navigate('/workshop') : navigate(`/cursos/${course.id}`)}"
);

fs.writeFileSync('src/pages/CursosExternos.tsx', code);
