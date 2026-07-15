const fs = require('fs');

// Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('WorkshopPresentation')) {
  appCode = appCode.replace(
    /import \{ CursosExternos \} from '\.\/pages\/CursosExternos';/,
    "import { CursosExternos } from './pages/CursosExternos';\nimport { WorkshopPresentation } from './pages/WorkshopPresentation';"
  );
  appCode = appCode.replace(
    /<Route path="\/cursos" element=\{<ProtectedRoute><Layout><CursosExternos \/><\/Layout><\/ProtectedRoute>\} \/>/,
    '<Route path="/cursos" element={<ProtectedRoute><Layout><CursosExternos /></Layout></ProtectedRoute>} />\n            <Route path="/workshop" element={<ProtectedRoute><WorkshopPresentation /></ProtectedRoute>} />'
  );
  fs.writeFileSync('src/App.tsx', appCode);
}

// Patch CursosExternos.tsx
let cursosCode = fs.readFileSync('src/pages/CursosExternos.tsx', 'utf8');
if (!cursosCode.includes('guia-do-membro')) {
  cursosCode = cursosCode.replace(
    /setCourses\(filtered\);/,
    `// GUIA DO MEMBRO
      filtered.unshift({
        id: 'guia-do-membro',
        title: 'Guia Completo do Membro',
        description: 'Manual interativo detalhado com todas as telas, menus e funcionalidades da plataforma GOMAU.',
        grauMinimo: 'Aprendiz',
        category: 'Instrução',
        duration: '30 minutos',
        modulesCount: 9,
        instructor: 'Equipe GOMAU',
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop'
      });
      setCourses(filtered);`
  );
  cursosCode = cursosCode.replace(
    /onClick=\{\(\) => navigate\(\`\/cursos\/\$\{course\.id\}\`\)\}/,
    "onClick={() => course.id === 'guia-do-membro' ? navigate('/workshop') : navigate(`/cursos/${course.id}`)}"
  );
  fs.writeFileSync('src/pages/CursosExternos.tsx', cursosCode);
}

// Patch MANUAL_MESTRE_GOMAU.md
let manual = fs.readFileSync('MANUAL_MESTRE_GOMAU.md', 'utf8');
if (!manual.includes('Guia Interativo do Membro')) {
  const manualAdd = `
- **2026-07-14 (Guia Interativo do Membro):**
  1. **Documentação e Guia Interativo**: Criação do arquivo \`GUIA_DO_MEMBRO.md\` contendo as instruções didáticas de todas as 9 áreas da plataforma.
  2. **Slides Interativos (Onboarding)**: Implementação da rota \`/workshop\` contendo um deck imersivo para apresentação do Guia do Membro, baseado no arquivo gerado.
  3. **Integração no Catálogo**: O Guia do Membro foi disponibilizado como o primeiro item do catálogo em \`Cursos EAD\`, acessível a todos (desde Aprendiz).
`;
  manual = manual.replace('## 5. Changelog e Histórico de Evolução\n', '## 5. Changelog e Histórico de Evolução\n' + manualAdd);
  fs.writeFileSync('MANUAL_MESTRE_GOMAU.md', manual);
}

// Patch INTEGRACAO_CURSOS.md
let integracao = '';
try {
  integracao = fs.readFileSync('INTEGRACAO_CURSOS.md', 'utf8');
  if (!integracao.includes('Guia Interativo do Membro')) {
    const integracaoAdd = `
## Nova Funcionalidade (14/07/2026) - Guia Interativo do Membro
Foi criado um curso embutido ("Guia Completo do Membro") dentro da aba "Cursos EAD". Em vez de abrir um player de vídeo tradicional, este card redireciona o membro para a rota \`/workshop\`, que inicializa um Deck de Slides Interativo em tela cheia (baseado no GUIA_DO_MEMBRO.md). 
Módulos Apresentados:
1. Dashboard (Painel Inicial)
2. Meu Perfil (Configurações)
3. Biblioteca (Acervo de Pranchas)
4. Cursos EAD (Catálogo e Player)
5. Fórum e Comunidade
6. Solicitações e Envios (Pranchas)
7. Calendário Maçônico
8. Cadeia de União (Irmãos)
9. Histórico Maçônico
`;
    integracao += integracaoAdd;
    fs.writeFileSync('INTEGRACAO_CURSOS.md', integracao);
  }
} catch(e) {}
