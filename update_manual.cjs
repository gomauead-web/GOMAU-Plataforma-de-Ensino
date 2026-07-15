const fs = require('fs');
let text = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');

const newChangelog = `- **2026-07-15 (Correção da Aba Minhas Pranchas e Envio):**
  1. **Hotfix de Permissões Isoladas (LoadData)**: O carregamento da página "Conteúdo" foi dividido em blocos \`try-catch\` isolados. Anteriormente, se um usuário comum tentasse carregar a lista de cursos sem a query de restrição (status publicado), o Firestore recusava por segurança, o que interrompia todo o fluxo e impedia que as pranchas fossem consultadas na sequência (fazendo com que a lista "Minhas Pranchas" ficasse vazia para não-gestores).
  2. **Stale Closure no Envio**: Corrigido um problema na função de envio de Pranchas que usava um estado anterior vazio do array React para atualizar a lista pós-submissão. Utilizado atualização funcional no \`setPranchas\` para que a nova prancha apareça imediatamente no menu após o envio bem-sucedido.\n`;

text = text.replace("## 5. Changelog e Histórico de Evolução\n", "## 5. Changelog e Histórico de Evolução\n" + newChangelog);

fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', text);
