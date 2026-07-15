const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('WorkshopPresentation')) {
  code = code.replace(
    "import { CursosExternos } from './pages/CursosExternos';",
    "import { CursosExternos } from './pages/CursosExternos';\nimport { WorkshopPresentation } from './pages/WorkshopPresentation';"
  );
  
  code = code.replace(
    '<Route path="/cursos" element={<ProtectedRoute><Layout><CursosExternos /></Layout></ProtectedRoute>} />',
    '<Route path="/cursos" element={<ProtectedRoute><Layout><CursosExternos /></Layout></ProtectedRoute>} />\n            <Route path="/workshop" element={<ProtectedRoute requireGestor={true}><WorkshopPresentation /></ProtectedRoute>} />'
  );
  
  fs.writeFileSync('src/App.tsx', code);
}
