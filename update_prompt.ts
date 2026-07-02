import fs from 'fs';
import path from 'path';

function getFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'public' && file !== 'assets') {
        getFiles(path.join(dir, file), fileList);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file === 'package.json' || file === 'vite.config.ts' || file === '.env.example' || file === 'firestore.rules') {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const filesToInclude = getFiles('./src');
filesToInclude.push('package.json', 'vite.config.ts', '.env.example', 'server.ts', 'firestore.rules');

let promptContent = fs.readFileSync('CLONE_PROMPT_GOMAU.md', 'utf8');
const splitIndex = promptContent.indexOf('## 9. 💻 CÓDIGOS FONTE CORE (Anexo Técnico)');

if (splitIndex !== -1) {
  let newContent = promptContent.substring(0, splitIndex) + '## 9. 💻 CÓDIGOS FONTE CORE (Anexo Técnico)\n\nAbaixo estão todos os códigos do sistema, sem exceção, para clonagem e entendimento arquitetural.\n\n';
  
  for (const file of filesToInclude) {
    if (!fs.existsSync(file)) continue;
    const ext = file.split('.').pop();
    const content = fs.readFileSync(file, 'utf8');
    newContent += `### Arquivo: \`${file}\`\n*Descrição: Arquivo componente do sistema localizado em ${file}.*\n\`\`\`${ext}\n${content}\n\`\`\`\n\n`;
  }
  
  fs.writeFileSync('CLONE_PROMPT_GOMAU.md', newContent);
  console.log('CLONE_PROMPT_GOMAU.md updated successfully.');
} else {
  console.log('Section not found in CLONE_PROMPT_GOMAU.md');
}
