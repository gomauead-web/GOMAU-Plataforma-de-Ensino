const fs = require('fs');
let text = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');

const newChangelog = `- **2026-07-15 (Correção de Sessão em Ambiente de Preview/Iframe):**
  1. **Hotfix de Logout (Cache/IndexedDB)**: Resolvido um problema onde o logout não encerrava a sessão corretamente no ambiente de visualização devido a retenção de cache do Firebase Auth em Iframe e \`react-router\`. Substituída a navegação leve por um \`window.location.href\` forçando um reload completo da página e limpeza bruta do Local/Session Storage, desativando a persistência acidental do login.\n`;

text = text.replace("## 5. Changelog e Histórico de Evolução\n", "## 5. Changelog e Histórico de Evolução\n" + newChangelog);

fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', text);
