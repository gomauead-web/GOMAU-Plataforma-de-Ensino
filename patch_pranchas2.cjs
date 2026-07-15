const fs = require('fs');
let code = fs.readFileSync('src/pages/ContentPage.tsx', 'utf8');

code = code.replace(
  "setPranchas(pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.tipo?.includes('Prancha') || p.tipo === 'Trabalho' || p.titulo));",
  "const fetched = pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));\n        console.log('Fetched requests for user:', fetched.length);\n        setPranchas(fetched.filter((p: any) => p.tipo === 'Envio de Prancha' || p.tipo === 'Prancha' || p.tipo === 'Prancha (Resumo/Estudo)' || (p.titulo && p.titulo.toLowerCase().includes('prancha'))));"
);

fs.writeFileSync('src/pages/ContentPage.tsx', code);
