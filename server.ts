import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import admin from 'firebase-admin';

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Ensure GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && process.env.NODE_ENV !== "production") {
  console.warn("GEMINI_API_KEY environment variable is missing.");
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Premium Generation
  app.post("/api/premium/generate", async (req, res) => {
    try {
      // In a real app we'd verify the Firebase ID token here to ensure it's tazmaniacrvg@gmail.com
      // For this implementation, we rely on the frontend sending the request + firestore rules restricting write access.
      // But actually, we need to create the Firestore documents HERE if we use the backend, 
      // OR we just return the generated content to the frontend and the frontend creates the documents in Firestore.
      // It is better if the frontend creates the documents so it uses the logged-in user's credentials and Firestore Rules are applied correctly!
      // So this endpoint will JUST return the generated JSON.

      const { 
        title, description, grauPermitido, grauDoCurso,
        publicoAlvo, objetivoPedagogico, nivelProfundidade,
        tomLinguagem, ritoFoco, abordagemFilosofica,
        estiloExercicios, tamanhoLicoes, citacoesEReferencias,
        quantidadeModulos, quantidadeUnidadesPorModulo,
        quantidadeAulasPorUnidade, duracaoEstimadaAula, tipoMaterial,
        estiloLivro, referenciasPermitidas, restricoesConteudo
      } = req.body;

      const prompt = `Crie um ${tipoMaterial} maçônico intitulado "${title}".
Tema: ${description}
Público Alvo: ${publicoAlvo}
Grau do Conteúdo: ${grauDoCurso} (Deve respeitar os limites e os juramentos deste grau)
Objetivo Pedagógico: ${objetivoPedagogico}
Nível de Profundidade: ${nivelProfundidade}
Tom de Linguagem: ${tomLinguagem}
Rito Foco: ${ritoFoco}
Abordagem Filosófica: ${abordagemFilosofica}
Citações & Referências Recomendadas: ${citacoesEReferencias}
Tamanho Médio das Lições: ${tamanhoLicoes}
Estilo dos Exercícios: ${estiloExercicios}
Restrições e Cuidados Editoriais Específicos: ${restricoesConteudo}

Estrutura exigida:
- ${quantidadeModulos} módulo(s)
- ${quantidadeUnidadesPorModulo} unidade(s) por módulo
- ${quantidadeAulasPorUnidade} aula(s) por unidade (cada aula com texto denso e aprofundado, formatado com excelente diagramação tipográfica em Markdown)
- 5 questões por aula no estilo: ${estiloExercicios}

Retorne ESTRITAMENTE em formato JSON, com a seguinte estrutura (em português):
{
  "title": "${title}",
  "description": "Uma sinopse profunda e refinada.",
  "modules": [
    {
      "title": "Nome do Módulo",
      "description": "Descrição do módulo",
      "order": 1,
      "units": [
        {
          "title": "Nome da Unidade",
          "description": "Descrição da unidade",
          "order": 1,
          "lessons": [
            {
              "title": "Nome da Aula",
              "order": 1,
              "content": "Conteúdo principal da aula, detalhado, denso, humanizado e premium, formatado em Markdown ou HTML.",
              "exercises": [
                {
                  "question": "Enunciado",
                  "options": ["A", "B", "C", "D"], // opcional para V/F
                  "correctAnswer": "A",
                  "explanation": "Explicação do motivo da resposta estar correta."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
Não inclua markdown \`\`\`json no início ou no fim, retorne apenas o objeto JSON. Seja profundo, respeitoso e ético.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const jsonStr = response.text || "{}";
      const generatedContent = JSON.parse(jsonStr);

      res.json({ success: true, data: generatedContent });
    } catch (error: any) {
      console.error("Erro na geração:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
