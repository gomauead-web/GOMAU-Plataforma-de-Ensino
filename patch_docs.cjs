const fs = require('fs');

// 1. Update MANUAL_MESTRE_GOMAU.md
let manual = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');
const manualAdd = `
- **2026-07-14 (Telemetria Avançada & Ranqueamento de Tempo de Tela):**
  1. **Motor de Telemetria de Sessão**: Criação do hook \`useSessionTelemetry\` que mensura passivamente o tempo real de tela e foco do obreiro na plataforma, contabilizando os segundos de sessão de forma inteligente apenas quando a aba está ativa.
  2. **Sincronização em Lote (Zero-Cost)**: Para não comprometer a cota gratuita do banco de dados, o hook envia as métricas ao Firestore em lotes agregados (a cada 2 minutos ou no evento \`visibilitychange\` / fechamento de aba), reduzindo drasticamente as operações de escrita no \`userMetrics\`.
  3. **Ranking de Engajamento**: O módulo de Telemetria (Gestor) agora foi aprimorado para ler a coleção \`userMetrics\` e exibir os "10 Irmãos com mais tempo de estudo" na plataforma, fornecendo visibilidade quantitativa profunda para premiação de membros.
  4. **Atualização Valuation**: O Valuation foi incrementado em R$ 1.500,00, totalizando **R$ 210.000,00**.
`;
manual = manual.replace('## 5. Changelog e Histórico de Evolução\n', '## 5. Changelog e Histórico de Evolução\n' + manualAdd);
fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', manual);

// 2. Update CLONE_PROMPT_GOMAU.md
let clone = fs.readFileSync('CLONE_PROMPT_GOMAU.md', 'utf8');
const cloneAdd = `
> **TELEMETRIA DE SESSÃO & ENGANJAMENTO ZERO-COST:** Implementado um hook de telemetria (\`useSessionTelemetry\`) que mensura passivamente o tempo real de foco e estudo dos membros na plataforma, agrupando lotes de segundos a cada 2 minutos ou ao ocultar/fechar a aba. Isso evita onerar o Firestore, respeitando rigorosamente a cota gratuita. O Painel Analítico agora exibe o ranking dos Irmãos mais dedicados (tempo total em horas). Valuation total do sistema atualizado para **R$ 210.000,00**.
`;
// find the first quote and inject before it
clone = clone.replace('> **PLAYER CINEMATOGRÁFICO', cloneAdd.trim() + '\n> **PLAYER CINEMATOGRÁFICO');
clone = clone.replace(/R\$ 208\.500,00/g, 'R$ 210.000,00');
clone = clone.replace(/R\$ 193\.500,00/g, 'R$ 210.000,00');

fs.writeFileSync('CLONE_PROMPT_GOMAU.md', clone);

