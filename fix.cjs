const fs = require('fs');
let content = fs.readFileSync('src/components/gestor/GestorValuation.tsx', 'utf8');

// Fix unclosed p tag
content = content.replace(/integra.*?<div className="mt-auto">/g, 'integração multimotor com GCK (Groq Cloud Key - Llama 3.3 70B, Mixtral) e Google AI Studio (Gemini), persistência de chaves locais, e exportação automática.\n           </p>\n          <div className="mt-auto">');

// Fix duplicated lines
content = content.replace(/<\/div>\$ 223\.500,00<\/div>[\s\S]*?Investimento Calculado<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '</div>\n          </div>\n       </div>');

fs.writeFileSync('src/components/gestor/GestorValuation.tsx', content);
