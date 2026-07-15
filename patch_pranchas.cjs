const fs = require('fs');
let code = fs.readFileSync('src/pages/ContentPage.tsx', 'utf8');

// Fix the push to state
code = code.replace(
  "setPranchas([...pranchas, { \n          id: newDoc.id, \n          titulo: pranchaTitle, ",
  "setPranchas(prev => [...prev, { \n          id: newDoc.id, \n          tipo: 'Envio de Prancha', \n          titulo: pranchaTitle, "
);

// Fix the edit map
code = code.replace(
  "setPranchas(pranchas.map(p => p.id === editingPranchaId ? { ...p, ...updateData } : p));",
  "setPranchas(prev => prev.map(p => p.id === editingPranchaId ? { ...p, ...updateData } : p));"
);

// Fix the delete filter
code = code.replace(
  "setPranchas(pranchas.filter(p => p.id !== pranchaId));",
  "setPranchas(prev => prev.filter(p => p.id !== pranchaId));"
);

fs.writeFileSync('src/pages/ContentPage.tsx', code);
