const fs = require('fs');
let code = fs.readFileSync('src/components/gestor/GestorValuation.tsx', 'utf8');

const regex3 = /Módulo de monitoramento ativo, com painéis agregados, contagem inteligente no Firebase \(zero-cost\) e rankeamento de uso para acompanhamento analítico do engajamento dos membros\./m;
const replacement3 = `Módulo de monitoramento ativo com telemetria contínua via \`visibilitychange\`, sincronização otimizada em lote para economia de requisições, armazenamento analítico do tempo real de tela dos membros e ranqueamento de engajamento diário/mensal e histórico.`;

code = code.replace(regex3, replacement3);

const regex4 = /R\$ 8\.000,00/m;
const replacement4 = `R$ 9.500,00`;
code = code.replace(regex4, replacement4);

fs.writeFileSync('src/components/gestor/GestorValuation.tsx', code);
