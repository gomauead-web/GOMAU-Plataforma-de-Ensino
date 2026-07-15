const fs = require('fs');
let code = fs.readFileSync('src/pages/CursosExternos.tsx', 'utf8');

const regex = /\s*\/\/ MOCK WORKSHOP COURSE[\s\S]*?setCourses\(filtered\);/;
code = code.replace(regex, "\n      setCourses(filtered);");

code = code.replace(
  "onClick={() => course.id === 'workshop-gomau' ? navigate('/workshop') : navigate(`/cursos/${course.id}`)}",
  "onClick={() => navigate(`/cursos/${course.id}`)}"
);

fs.writeFileSync('src/pages/CursosExternos.tsx', code);
