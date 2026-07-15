const fs = require('fs');
let code = fs.readFileSync('src/pages/ContentPage.tsx', 'utf8');

code = code.replace(
  "const qPranchas = query(collection(db, 'requests'), where('userId', '==', user.uid), where('tipo', '==', 'Envio de Prancha'));",
  "const qPranchas = query(collection(db, 'requests'), where('userId', '==', user.uid));"
);

code = code.replace(
  "setPranchas(pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));",
  "setPranchas(pranchasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.tipo === 'Envio de Prancha' || p.tipo === 'Prancha' || p.tipo === 'Prancha (Resumo/Estudo)' || p.titulo));"
);

fs.writeFileSync('src/pages/ContentPage.tsx', code);
