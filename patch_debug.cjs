const fs = require('fs');
let code = fs.readFileSync('src/pages/ContentPage.tsx', 'utf8');

// Remove the filter
code = code.replace(
  "setPranchas(pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.tipo === 'Envio de Prancha' || p.tipo === 'Prancha' || p.tipo === 'Prancha (Resumo/Estudo)'));",
  "setPranchas(pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.tipo?.includes('Prancha') || p.tipo === 'Trabalho' || p.titulo));"
);

fs.writeFileSync('src/pages/ContentPage.tsx', code);
