const fs = require('fs');
let code = fs.readFileSync('src/components/gestor/TelemetryView.tsx', 'utf8');

code = code.replace(
  '// 3. Buscar Ranking de Engajamento por Tempo de Tela',
  '        });\n\n        // 3. Buscar Ranking de Engajamento por Tempo de Tela'
);

fs.writeFileSync('src/components/gestor/TelemetryView.tsx', code);
