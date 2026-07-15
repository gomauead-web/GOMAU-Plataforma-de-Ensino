const fs = require('fs');
let manual = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');

const log = `
- **2026-07-15 (Correção de Consulta de Pranchas):**
  1. **Hotfix de Consulta (Composite Index)**: Resolvido um problema onde a aba "Minhas Pranchas" no menu Conteúdos estava retornando vazia para todos os usuários. O erro ocorria devido à exigência do Firestore de um Índice Composto para consultas com múltiplos \`where\` em campos diferentes (userId e tipo). A solução aplicada foi realizar uma consulta simples por \`userId\` no banco de dados e filtrar os tipos de prancha em memória no lado do cliente.
`;

manual = manual.replace('## 5. Changelog e Histórico de Evolução\n', '## 5. Changelog e Histórico de Evolução\n' + log);
fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', manual);
