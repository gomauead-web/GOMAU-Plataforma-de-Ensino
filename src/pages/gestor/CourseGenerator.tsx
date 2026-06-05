import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { Sparkles, Settings, Play, Save, ChevronRight, FileText, ListChecks, GraduationCap, AlertCircle, Loader2, Key } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { generatorStore, GenState } from '../../lib/courseGeneratorState';

// Constante para o modelo - usando o aliasing recomendado pelo sistema
const GEMINI_MODEL = "gemini-3-flash-preview";

export function CourseGenerator() {
  const { user } = useAuth();
  const DEFAULT_CONFIG = {
    qtdModulos: 2,
    qtdUnidadesPorModulo: 2,
    qtdAulasPorUnidade: 2,
    qtdExerciciosPorAula: { discursivas: 1, multiplaEscolha: 2 },
    qtdQuestoesAvaliacaoUnidade: { discursivas: 1, multiplaEscolha: 4 },
    qtdQuestoesAvaliacaoModulo: { discursivas: 2, multiplaEscolha: 5 },
    mediaAprovacao: 75,
    profundidade: 'Moral',
    linguagem: 'Contemporânea',
    foco: 'Filosofia',
    complexidade: 'Avançado'
  };

  const [state, setState] = useState<GenState>(() => generatorStore.getState());
  const [config, setConfig] = useState<any>(DEFAULT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    const unsub = generatorStore.subscribe(setState);
    return () => { unsub(); };
  }, []);

  const GRAUS = ['Aprendiz', 'Companheiro', 'Mestre'];

  // aliases curtos para simplificar leitura de variáveis globais
  const { activeMode, courseTitle, selectedGrau, manualProgram, status, streamingText, loading, generatedCourse } = state;

  const setActiveMode = (v: GenState['activeMode']) => generatorStore.setState({ activeMode: v });
  const setCourseTitle = (v: string) => generatorStore.setState({ courseTitle: v });
  const setSelectedGrau = (v: string) => generatorStore.setState({ selectedGrau: v });
  const setManualProgram = (v: string) => generatorStore.setState({ manualProgram: v });
  const setStatus = (v: string) => generatorStore.setState({ status: v });
  const setLoading = (v: boolean) => generatorStore.setState({ loading: v });
  const setGeneratedCourse = (v: any) => generatorStore.setState({ generatedCourse: v });

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'configs', 'generator'));
      if (snap.exists()) {
        setConfig(snap.data());
      }
    } catch (err) {
      console.error("Error loading generator config:", err);
      // Fallback already handled by initial state
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await setDoc(doc(db, 'configs', 'generator'), {
        ...config,
        updatedAt: serverTimestamp()
      });
      alert("Configurações do gerador salvas!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleGenerate = async () => {
    if (!courseTitle && activeMode === 'auto') return alert("Informe o título do curso.");
    if (!manualProgram && activeMode === 'manual') return alert("Cole o programa do curso.");
    
    setLoading(true);
    setStatus('Iniciando Inteligência Artificial...');
    generatorStore.setState({ streamingText: '' });
    generatorStore.logGeneration({ title: courseTitle, mode: activeMode, config });

    try {
      console.log('GEMINI_API_KEY available?', !!process.env.GEMINI_API_KEY);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = activeMode === 'auto' 
        ? `Gere um curso completo sobre o tema: "${courseTitle}".
           Público-alvo: Maçons do grau ${selectedGrau}.
           
           DIRETRIZES DE QUALIDADE:
           - Profundidade Analítica: ${config.profundidade || 'Moral'}
           - Estilo de Linguagem: ${config.linguagem || 'Contemporânea'}
           - Foco Doutrinário: ${config.foco || 'Filosofia'}
           - Nível de Complexidade: ${config.complexidade || 'Avançado'}
           
           Configurações de Estrutura:
           - Módulos: ${config.qtdModulos}
           - Unidades por Módulo: ${config.qtdUnidadesPorModulo}
           - Aulas por Unidade: ${config.qtdAulasPorUnidade}
           - Exercícios por Aula: ${config.qtdExerciciosPorAula.discursivas} discursivas e ${config.qtdExerciciosPorAula.multiplaEscolha} múltipla escolha.
           - Questões Avaliação Unidade: ${config.qtdQuestoesAvaliacaoUnidade.discursivas} discursivas e ${config.qtdQuestoesAvaliacaoUnidade.multiplaEscolha} múltipla escolha.
           - Questões Avaliação Módulo: ${config.qtdQuestoesAvaliacaoModulo.discursivas} discursivas e ${config.qtdQuestoesAvaliacaoModulo.multiplaEscolha} múltipla escolha.
           
           PARA CADA AULA: Desenvolva o conteúdo educacional COMPLETO (mínimo 800 palavras por aula) em formato Markdown, com profundidade compatível com o grau ${selectedGrau} e seguindo as diretrizes de qualidade acima. Não use placeholders.
           PARA CADA EXERCÍCIO/AVALIAÇÃO: Forneça a pergunta, as opções (se múltipla escolha) e a resposta correta/gabarito.`
        : `Transforme o programa abaixo em um curso estruturado na plataforma GOMAU para o grau ${selectedGrau}:
           Programa: ${manualProgram}
           Use as seguintes diretrizes:
           - Linguagem: ${config.linguagem || 'Contemporânea'}
           - Complexidade: ${config.complexidade || 'Avançado'}
           Desenvolva TODO o conteúdo de cada aula citada no programa em formato Markdown rico.`;

      setStatus('Gerando estrutura e conteúdos... Isso pode levar um minuto. Você pode navegar para outras telas e o processo não será interrompido.');
      
      const responseStream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        config: {
          systemInstruction: `Você é um Grande Acadêmico Maçônico e Escritor de Instruções para a plataforma GOMAU (Grande Ordem Maçônica de Aperfeiçoamento Universal). 
          Sua missão é gerar cursos e instruções profundamente enraizados na Tradição Maçônica, Ritos e Filosofia Universal.
          
          REGRAS DE OURO:
          1. RIGOR DOUTRINÁRIO: O conteúdo deve ser estritamente maçônico. Use termos como "Ir.'.", "A.'.R.'.L.'.S.'.", "Or.'.", "V.'.L.'.", "Colunas", "Templo", etc., conforme apropriado.
          2. CONTEÚDO COMPLETO: Cada aula deve ter um texto exaustivo (mínimo 800 palavras), profundo, em Markdown rico, explorando simbolismo, história e filosofia. Proibido usar resumos ou placeholders.
          3. RESPEITO AOS GRAUS: O conteúdo deve ser compatível com o Grau solicitado. Se for para Aprendiz, foque na Pedra Bruta e nos mistérios iniciais; se for para Mestre, trate da Lenda de Hiram e alta filosofia.
          4. AVALIAÇÕES: Gere exercícios de múltipla escolha e discursivos que testem a compreensão real do mistério ensinado.
          
          JSON SCHEMA: 
          { 
            "titulo": "string", 
            "descricao": "string", 
            "cargaHoraria": "string", 
            "modulos": [ 
              { 
                "id": "m1", 
                "titulo": "string", 
                "unidades": [ 
                  { 
                    "id": "u1", 
                    "titulo": "string", 
                    "aulas": [ 
                      { "id": "a1", "titulo": "string", "conteudo": "string (markdown longo/profundo)", "exercicios": [{ "id", "pergunta", "opcoes", "respostaCorreta" }] } 
                    ],
                    "avaliacao": [...]
                  } 
                ]
              } 
            ] 
          }`,
          responseMimeType: "application/json"
        },
        contents: prompt
      });

      let text = '';
      for await (const chunk of responseStream) {
        text += chunk.text;
        // Atualiza a cada chunk, permitindo que a view veja o texto sendo construído
        generatorStore.setState({ streamingText: text });
      }
      
      let parsedCourseData = null;
      try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedCourseData = JSON.parse(jsonStr);
      } catch (parseError: any) {
        // Se a IA não fechou o JSON completamente (comum em textos longos)
        console.warn("JSON parse failed initially, attempting to fix...", parseError);
        try {
           // Tenta adicionar fechamentos comuns ao final
           let fixedStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
           for(let i=0; i<5; i++) {
             try {
                parsedCourseData = JSON.parse(fixedStr);
                break;
             } catch(e) {
                if(fixedStr.endsWith('"')) fixedStr += '}';
                else if(fixedStr.endsWith('}')) fixedStr = fixedStr.slice(0, -1) + '}]}';
                else if(fixedStr.endsWith(']')) fixedStr = fixedStr.slice(0, -1) + ']}';
                else fixedStr += '"}';
             }
           }
        } catch(e) {
             throw new Error("O texto gerado foi cortado pela metade por ser muito longo e não formou um Curso válido. Diminua a quantidade de Módulos.");
        }
        if (!parsedCourseData) {
            throw new Error("Erro ao ler estrutura final: O texto foi longo demais. Tente gerar com menos Módulos/Aulas.");
        }
      }
      
      generatorStore.logGeneration({ success: true, courseTitle: parsedCourseData.titulo });
      setGeneratedCourse(parsedCourseData);
      setStatus('Curso gerado com sucesso! Revise abaixo.');
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      let errorMsg = err.message;
      if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not valid")) {
          errorMsg = "Sua chave de API do Gemini é inválida. Por favor, acesse Settings > Secrets na AI Studio e verifique ou insira uma chave válida.";
      }
      generatorStore.logGeneration({ success: false, error: errorMsg });
      // Saving partial or error info in global state
      generatorStore.setState({ status: `Erro na geração: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = async () => {
    if (!generatedCourse) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'courses'), {
        ...generatedCourse,
        descricao: generatedCourse.descricao || `Curso aprofundado sobre ${generatedCourse.titulo}`,
        grauMinimo: selectedGrau,
        status: 'rascunho',
        configOriginal: {
           profundidade: config.profundidade,
           linguagem: config.linguagem,
           foco: config.foco,
           complexidade: config.complexidade,
           qtdModulos: config.qtdModulos
        },
        createdAt: serverTimestamp()
      });
      alert("Curso salvo na biblioteca como Rascunho!");
      setGeneratedCourse(null);
      setCourseTitle('');
      setManualProgram('');
    } catch (err: any) {
      alert("Erro ao salvar curso: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveMode('auto')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeMode === 'auto' ? "bg-[#D4AF37] text-black" : "bg-[#1e293b] text-gray-400")}
          >
            Geração Automática
          </button>
          <button 
            onClick={() => setActiveMode('manual')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeMode === 'manual' ? "bg-[#D4AF37] text-black" : "bg-[#1e293b] text-gray-400")}
          >
            Criação via Programa
          </button>
          <button 
            onClick={() => setActiveMode('config')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", activeMode === 'config' ? "bg-[#D4AF37] text-black" : "bg-[#1e293b] text-gray-400")}
          >
            <Settings size={16} /> Parâmetros
          </button>
        </div>
      </div>

      <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-2xl p-8 shadow-inner">
        {activeMode === 'config' && config && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
              <Settings size={20} /> Configuração do Motor de IA
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold">Módulos</label>
                <input type="number" value={config.qtdModulos} onChange={e => setConfig({...config, qtdModulos: Number(e.target.value)})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-3 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold">Unidades p/ Módulo</label>
                <input type="number" value={config.qtdUnidadesPorModulo} onChange={e => setConfig({...config, qtdUnidadesPorModulo: Number(e.target.value)})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-3 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold">Aulas p/ Unidade</label>
                <input type="number" value={config.qtdAulasPorUnidade} onChange={e => setConfig({...config, qtdAulasPorUnidade: Number(e.target.value)})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-3 text-white" />
              </div>
            </div>

            <div className="border-t border-[#1e293b] pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Sparkles size={16} /> Profundidade do Mistério</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Profundidade Analítica</span>
                    <select value={config.profundidade} onChange={e => setConfig({...config, profundidade: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Ritualística">Ritualística (Instrução de Loja e Prática)</option>
                      <option value="Exegese Bíblica/Histórica">Exegese (Interpretação e Landmarks)</option>
                      <option value="Esoterismo/Ocultismo">Esoterismo (Simbolismo Hermético e Oculto)</option>
                      <option value="Moralista/Ética">Moralista (Aplicação das Virtudes e Ética Maçônica)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Estilo de Linguagem</span>
                    <select value={config.linguagem} onChange={e => setConfig({...config, linguagem: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Solene/Tradicional">Solene (Tratamento Formal e Ritualístico)</option>
                      <option value="Filosófica">Filosófica (Linguagem Reflexiva e Alta Cultura)</option>
                      <option value="Didática Maçônica">Didática (Focada na Instrução de Quadro)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><ListChecks size={16} /> Foco Doutrinário</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Direcionamento da Ordem</span>
                    <select value={config.foco} onChange={e => setConfig({...config, foco: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Liturgia e Ritos">Liturgia (Ritos, Gestos e Palavras)</option>
                      <option value="Simbolismo de Ofício">Simbolismo (Avental, Alfaias, Ferramentas)</option>
                      <option value="História das Lojas">História (Origens, Modernos e Antigos)</option>
                      <option value="Legislação/Landmarks">Legislação (Constituição, Landmarks e Leis 🧱)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase">Nível de Complexidade</span>
                    <select value={config.complexidade} onChange={e => setConfig({...config, complexidade: e.target.value})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white text-sm">
                      <option value="Base do Aprendizado">Base (Essencial para Iniciação)</option>
                      <option value="Instrução Profunda">Instrução Profunda (Avançado/Círculo Interno)</option>
                      <option value="Sabedoria Erudita">Erudita (Pós-Graduação/Altos Graus)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1e293b] pt-6">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><ListChecks size={16} /> Exercícios por Aula</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase">Discursivas</span>
                  <input type="number" value={config.qtdExerciciosPorAula.discursivas} onChange={e => setConfig({...config, qtdExerciciosPorAula: {...config.qtdExerciciosPorAula, discursivas: Number(e.target.value)}})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase">Múltipla Escolha</span>
                  <input type="number" value={config.qtdExerciciosPorAula.multiplaEscolha} onChange={e => setConfig({...config, qtdExerciciosPorAula: {...config.qtdExerciciosPorAula, multiplaEscolha: Number(e.target.value)}})} className="w-full bg-[#1e293b] border border-[#1e293b] rounded-lg p-2 text-white" />
                </div>
              </div>
            </div>

            <div className="border-t border-[#1e293b] pt-6 flex justify-end">
              <button onClick={saveConfig} disabled={savingConfig} className="px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:scale-105 transition-all">
                Salvar Parâmetros
              </button>
            </div>
          </div>
        )}

        {activeMode === 'auto' && (
          <div className="space-y-6">
             <div className="flex flex-col gap-2">
               <h2 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
                 <Sparkles size={24} /> Criador Inteligente de Cursos
               </h2>
               <p className="text-gray-400 text-sm">A IA irá estruturar módulos, aulas e avaliações baseada no título escolhido.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Título do Curso ou Instrução</label>
                 <input 
                   type="text" 
                   value={courseTitle}
                   onChange={e => setCourseTitle(e.target.value)}
                   className="w-full bg-[#1e293b] border border-[#D4AF37]/20 rounded-xl p-4 text-xl text-white outline-none focus:border-[#D4AF37] transition-all"
                   placeholder="Ex: A Simbologia Oculta do Pavimento de Mosaico"
                 />
               </div>

               <div className="space-y-4">
                 <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Grau de Instrução Alvo</label>
                 <div className="flex bg-[#1e293b] p-1 rounded-xl h-14">
                   {GRAUS.map(grau => (
                     <button
                       key={grau}
                       onClick={() => setSelectedGrau(grau)}
                       className={cn(
                         "flex-1 rounded-lg text-sm font-medium transition-all",
                         selectedGrau === grau ? "bg-[#D4AF37] text-black shadow-lg" : "text-gray-400 hover:text-gray-200"
                       )}
                     >
                       {grau}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
               
               <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 flex gap-3 text-[#D4AF37]">
                 <AlertCircle className="shrink-0" size={20} />
                 <p className="text-xs">
                   O conteúdo gerado será focado em profundidade filosófica, respeitando a regra de "Não Encher Linguiça". 
                   Você poderá revisar e editar antes de publicar.
                 </p>
               </div>

               <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-bold rounded-xl text-lg flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50"
               >
                 {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                 {loading ? 'Consultando Oráculo de IA...' : 'Gerar Estrutura Completa'}
               </button>
             </div>
        )}

        {activeMode === 'manual' && (
          <div className="space-y-6">
             <div className="flex flex-col gap-2">
               <h2 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
                 <FileText size={24} /> Conversor de Programa Externo
               </h2>
               <p className="text-gray-400 text-sm">Cole o programa do curso (feito por você ou via ChatGPT) e deixe a plataforma estruturá-lo.</p>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Cole o Programa aqui</label>
                 <textarea 
                   value={manualProgram}
                   onChange={e => setManualProgram(e.target.value)}
                   className="w-full bg-[#1e293b] border border-[#D4AF37]/20 rounded-xl p-4 text-sm text-white outline-none focus:border-[#D4AF37] transition-all h-64 resize-none"
                   placeholder="Módulo 1: O Aprendiz... Aula 1: ... Aula 2: ..."
                 />
               </div>

               <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl text-lg flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50"
               >
                 {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                 {loading ? 'Processando Estrutura...' : 'Estruturar Programa'}
               </button>
             </div>
          </div>
        )}
      </div>

      {status && status.startsWith('Erro') && !loading && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mt-6 flex items-center gap-3">
          <AlertCircle size={24} />
          <p>{status}</p>
        </div>
      )}

      {streamingText && (loading || status?.startsWith('Erro')) && (
        <div className="w-full mt-6">
          <div className="bg-[#1e293b] px-4 py-2 border-b border-[#D4AF37]/20 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-gray-400 ml-2 font-mono">generation-log.json {loading ? '(Gerando...)' : '(Interrompido/Erro)'}</span>
            </div>
          </div>
          <div 
            className="bg-[#0A0E1A] border border-[#1e293b] border-t-0 p-6 rounded-b-xl font-mono text-xs text-green-400/80 h-[400px] overflow-y-auto whitespace-pre-wrap flex flex-col items-start justify-end"
          >
            <div className="w-full mt-auto">
               {streamingText}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 size={48} className="text-[#D4AF37] animate-spin" />
          <p className="text-[#D4AF37] font-medium animate-pulse">{status}</p>
        </div>
      )}

      {generatedCourse && (
        <div className="bg-[#1e293b]/30 border border-[#D4AF37]/30 rounded-2xl p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4">
             <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white">{generatedCourse.titulo}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                   <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 uppercase font-bold">
                     {config.profundidade}
                   </span>
                   <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 uppercase font-bold">
                     {config.linguagem}
                   </span>
                   <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 uppercase font-bold">
                     {config.foco}
                   </span>
                </div>
             </div>
             <button onClick={saveToLibrary} className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-all">
               <Save size={18} /> Salvar como Rascunho
             </button>
          </div>

          <div className="space-y-8">
            {generatedCourse.modulos?.map((modulo: any, mIdx: number) => (
              <div key={mIdx} className="bg-black/40 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#D4AF37] mb-4">Módulo {mIdx + 1}: {modulo.titulo}</h3>
                
                <div className="space-y-4 ml-4">
                  {modulo.unidades?.map((unidade: any, uIdx: number) => (
                    <div key={uIdx} className="border-l-2 border-[#D4AF37]/20 pl-6 py-2">
                      <h4 className="font-medium text-gray-200 mb-2">Unidade {uIdx + 1}: {unidade.titulo}</h4>
                      
                      <div className="flex flex-wrap gap-2">
                        {unidade.aulas?.map((aula: any, aIdx: number) => (
                          <div key={aIdx} className="bg-[#1e293b] text-gray-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                            <ChevronRight size={12} className="text-[#D4AF37]" />
                            {aula.titulo}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
