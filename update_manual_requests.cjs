const fs = require('fs');
let text = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');

const newChangelog = `- **2026-07-16 (Correção do Painel de Aprovações):**\n  1. **Painel em Tempo Real**: A área de aprovações de solicitações do Gestor agora utiliza \`onSnapshot\` do Firestore para receber novas pranchas e justificativas instantaneamente, resolvendo o problema das solicitações exigirem recarregamento manual da página para aparecerem.\n  2. **Sincronia Membro/Gestor**: Validado o fluxo de exclusão. Quando um membro exclui uma prancha na aba pessoal, o sistema reflete imediatamente a exclusão na aba do gestor graças à reatividade em tempo real.\n`;

text = text.replace("## 5. Changelog e Histórico de Evolução\n", "## 5. Changelog e Histórico de Evolução\n" + newChangelog);
fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', text);
