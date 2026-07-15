const fs = require('fs');
let code = fs.readFileSync('src/pages/CursosExternos.tsx', 'utf8');

const regex = /setCourses\(filtered\);/m;
const replacement = `
      // MOCK WORKSHOP COURSE
      if (user?.email && ['gomau.ead@gmail.com', 'calepi@gmail.com', 'calepe@gmail.com'].includes(user.email)) {
        filtered.unshift({
          id: 'workshop-gomau',
          title: 'Domínio da Plataforma G∴O∴M∴A∴U∴',
          description: 'Workshop completo sobre navegação, gestão descentralizada, e-learning restrito e telemetria zero-cost.',
          grauMinimo: 'Mestre',
          category: 'Gestão e Tecnologia',
          duration: '2 horas',
          modulesCount: 4,
          ownerOnly: true,
          instructor: 'Equipe GOMAU',
          thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop'
        });
      }
      setCourses(filtered);
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/CursosExternos.tsx', code);
