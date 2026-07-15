const fs = require('fs');
let code = fs.readFileSync('src/pages/CursosExternos.tsx', 'utf8');

code = code.replace(
  "const filtered = allCourses.filter((c: any) => {",
  "const filtered: any[] = allCourses.filter((c: any) => {"
);

fs.writeFileSync('src/pages/CursosExternos.tsx', code);
