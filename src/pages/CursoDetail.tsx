import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChevronLeft, GraduationCap, ChevronRight, PlayCircle, Lock, 
  CheckCircle2, FileText, ListChecks, HelpCircle, AlertCircle, 
  ArrowRight, Award, Loader2, Menu, X 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function CursoDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Quiz State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number, passed: boolean } | null>(null);

  useEffect(() => {
    if (!courseId) return;
    
    // Fetch Course
    const fetchCourse = async () => {
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (snap.exists()) {
        const data = snap.data();
        
        // Verificação de Grau (Hierarquia)
        const grauOrder = { 'Aprendiz': 1, 'Companheiro': 2, 'Mestre': 3 };
        const userGrauVal = (grauOrder as any)[user?.grau || 'Aprendiz'] || 1;
        const courseGrauVal = (grauOrder as any)[data.grauMinimo || 'Aprendiz'] || 1;

        if (userGrauVal < courseGrauVal) {
          alert('Seu grau atual não permite o acesso a esta instrução.');
          navigate('/cursos');
          return;
        }

        setCourse(data);
        // Default to first lesson if none selected
        if (data.modulos?.[0]?.unidades?.[0]?.aulas?.[0]) {
          setActiveLesson({
            ...data.modulos[0].unidades[0].aulas[0],
            moduloId: data.modulos[0].id,
            unidadeId: data.modulos[0].unidades[0].id
          });
        }
      }
      setLoading(false);
    };

    // Listen to Progress
    const progressId = `${user?.uid}_${courseId}`;
    const unsub = onSnapshot(doc(db, 'courseProgress', progressId), (snap) => {
      if (snap.exists()) {
        setProgress(snap.data());
      } else {
        setProgress({ completedLessons: [], scores: {} });
      }
    }, (err: any) => {
      console.error("Error loading progress:", err);
      if (err?.code === 'resource-exhausted') {
         console.warn("Cota excedida no progresso do curso.");
      }
    });

    fetchCourse();
    return () => unsub();
  }, [courseId, user]);

  const isLessonLocked = (lessonId: string, moduloIdx: number, unidadeIdx: number, aulaIdx: number) => {
    // Primeira aula do primeiro módulo sempre aberta
    if (moduloIdx === 0 && unidadeIdx === 0 && aulaIdx === 0) return false;
    
    // Pegar a aula anterior
    let prevAulaId = '';
    if (aulaIdx > 0) {
      prevAulaId = course.modulos[moduloIdx].unidades[unidadeIdx].aulas[aulaIdx - 1].id;
    } else if (unidadeIdx > 0) {
      const prevUnidade = course.modulos[moduloIdx].unidades[unidadeIdx - 1];
      prevAulaId = prevUnidade.aulas[prevUnidade.aulas.length - 1].id;
    } else if (moduloIdx > 0) {
      const prevModulo = course.modulos[moduloIdx - 1];
      const lastUnidade = prevModulo.unidades[prevModulo.unidades.length - 1];
      prevAulaId = lastUnidade.aulas[lastUnidade.aulas.length - 1].id;
    }

    return !progress?.completedLessons?.includes(prevAulaId);
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson || !courseId) return;
    
    const progressId = `${user?.uid}_${courseId}`;
    const newCompleted = [...(progress?.completedLessons || [])];
    if (!newCompleted.includes(activeLesson.id)) {
      newCompleted.push(activeLesson.id);
    }

    try {
      await setDoc(doc(db, 'courseProgress', progressId), {
        userId: user?.uid,
        courseId,
        completedLessons: newCompleted,
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  const submitQuiz = async () => {
    if (!activeLesson.exercicios) return;
    
    let correct = 0;
    activeLesson.exercicios.forEach((ex: any) => {
      if (answers[ex.id] === ex.respostaCorreta) correct++;
    });

    const score = (correct / activeLesson.exercicios.length) * 100;
    const passed = score >= 75;

    setQuizResult({ score, passed });
    setQuizSubmitted(true);

    if (passed) {
      await handleCompleteLesson();
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" size={48} /></div>;
  if (!course) return <div className="p-8 text-center text-gray-400">Curso não encontrado.</div>;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#0A0E1A] rounded-2xl overflow-hidden border border-[#1e293b]">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 bg-[#0F172A] border-r border-[#1e293b] flex flex-col h-full z-20 absolute lg:relative shadow-2xl lg:shadow-none"
          >
            <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
              <h2 className="font-bold text-[#D4AF37] flex items-center gap-2">
                <GraduationCap size={18} /> Currículo
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              {course.modulos?.map((modulo: any, mIdx: number) => (
                <div key={modulo.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    Módulo {mIdx + 1}: {modulo.titulo}
                  </div>
                  
                  <div className="space-y-2">
                    {modulo.unidades?.map((unidade: any, uIdx: number) => (
                      <div key={unidade.id} className="space-y-1">
                        <div className="text-[11px] font-bold text-gray-400 px-2 mb-1 flex items-center gap-2">
                          <ChevronRight size={10} /> {unidade.titulo}
                        </div>
                        
                        <div className="space-y-0.5">
                          {unidade.aulas?.map((aula: any, aIdx: number) => {
                            const locked = isLessonLocked(aula.id, mIdx, uIdx, aIdx);
                            const completed = progress?.completedLessons?.includes(aula.id);
                            const active = activeLesson?.id === aula.id;
                            
                            return (
                              <button
                                key={aula.id}
                                disabled={locked}
                                onClick={() => {
                                  setActiveLesson({...aula, moduloId: modulo.id, unidadeId: unidade.id});
                                  setQuizSubmitted(false);
                                  setQuizResult(null);
                                  setAnswers({});
                                  if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-all",
                                  active ? "bg-[#D4AF37] text-black font-bold" : "text-gray-400 hover:bg-[#1e293b]",
                                  locked && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {completed ? <CheckCircle2 size={14} className={active ? "text-black" : "text-[#D4AF37]"} /> : 
                                 locked ? <Lock size={14} /> : <PlayCircle size={14} />}
                                <span className="truncate">{aula.titulo}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-black/40 border-t border-[#1e293b]">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] text-gray-500 uppercase font-bold">Progresso do Curso</span>
                 <span className="text-xs font-bold text-[#D4AF37]">
                   {Math.round(((progress?.completedLessons?.length || 0) / (course.modulos?.reduce((acc: number, m: any) => acc + m.unidades?.reduce((acc2: number, u: any) => acc2 + u.aulas?.length, 0), 0) || 1)) * 100)}%
                 </span>
               </div>
               <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-[#D4AF37] transition-all duration-1000"
                   style={{ width: `${((progress?.completedLessons?.length || 0) / (course.modulos?.reduce((acc: number, m: any) => acc + m.unidades?.reduce((acc2: number, u: any) => acc2 + u.aulas?.length, 0), 0) || 1)) * 100}%` }}
                 />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F1C]">
        <div className="bg-[#1e293b]/50 p-4 border-b border-[#1e293b] flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-[#1e293b] rounded-lg text-gray-400">
               <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-200 line-clamp-1">{course.titulo}</h1>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest">{activeLesson?.titulo}</p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/cursos')}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} /> Sair
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-12">
            
            {/* Lesson Content */}
            <div className="prose prose-invert prose-[#D4AF37] max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl text-[#D4AF37] mb-8 font-bold border-b border-[#D4AF37]/20 pb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl text-[#D4AF37] mt-12 mb-4 font-bold flex items-center gap-2" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-300 leading-relaxed text-lg mb-6 text-justify" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 text-gray-300 mb-8" {...props} />,
                  li: ({node, ...props}) => <li className="marker:text-[#D4AF37]" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-[#D4AF37] bg-[#D4AF37]/5 p-6 my-8 rounded-r-xl italic text-gray-400" {...props} />
                  )
                }}
              >
                {activeLesson?.conteudo}
              </ReactMarkdown>
            </div>

            {/* Exercises Section */}
            {activeLesson?.exercicios && activeLesson.exercicios.length > 0 && (
              <div className="mt-20 pt-20 border-t border-[#1e293b]">
                <div className="bg-[#1e293b]/20 rounded-3xl p-8 md:p-12 border border-[#D4AF37]/10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-[#D4AF37]/10 rounded-2xl text-[#D4AF37]">
                      <ListChecks size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Desafios de Compreensão</h3>
                      <p className="text-gray-500 text-sm">Responda para validar sua passagem para a próxima instrução.</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {activeLesson.exercicios.map((ex: any, idx: number) => (
                      <div key={ex.id} className="space-y-4">
                        <div className="flex items-start gap-4">
                          <span className="text-[#D4AF37] font-bold text-lg">{idx + 1}.</span>
                          <p className="text-lg text-gray-200">{ex.pergunta}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 ml-8">
                          {ex.opcoes?.map((opt: string) => (
                            <button
                              key={opt}
                              disabled={quizSubmitted}
                              onClick={() => setAnswers({...answers, [ex.id]: opt})}
                              className={cn(
                                "flex items-center p-4 rounded-xl border text-left transition-all",
                                answers[ex.id] === opt 
                                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white" 
                                  : "bg-black/20 border-gray-800 text-gray-400 hover:border-gray-600",
                                quizSubmitted && opt === ex.respostaCorreta && "bg-green-500/20 border-green-500 text-green-200",
                                quizSubmitted && answers[ex.id] === opt && opt !== ex.respostaCorreta && "bg-red-500/20 border-red-500 text-red-200"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all",
                                answers[ex.id] === opt ? "border-[#D4AF37]" : "border-gray-700"
                              )}>
                                {answers[ex.id] === opt && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                              </div>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {quizResult && (
                    <div className={cn(
                      "mt-12 p-8 rounded-2xl border flex flex-col md:flex-row items-center gap-6 justify-between",
                      quizResult.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn("p-4 rounded-full", quizResult.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                          {quizResult.passed ? <Award size={40} /> : <AlertCircle size={40} />}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            {quizResult.passed ? "Membro Aprovado!" : "Instrução Necessária"}
                          </h4>
                          <p className="text-sm text-gray-400">
                             Você atingiu uma média de **{Math.round(quizResult.score)}%**. 
                             {quizResult.passed ? "A próxima lição já está disponível." : "Revise o conteúdo e tente novamente."}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizResult(null);
                          setAnswers({});
                        }}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
                      >
                        Refazer Teste
                      </button>
                    </div>
                  )}

                  {!quizSubmitted && (
                    <button 
                      onClick={submitQuiz}
                      disabled={Object.keys(answers).length < activeLesson.exercicios.length}
                      className="mt-12 w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 size={20} /> Validar Respostas
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Simple Completion button if no exercises */}
            {(!activeLesson?.exercicios || activeLesson.exercicios.length === 0) && (
              <div className="mt-20 pt-10 border-t border-[#1e293b] flex justify-center">
                 {!progress?.completedLessons?.includes(activeLesson.id) ? (
                    <button 
                      onClick={handleCompleteLesson}
                      className="bg-[#D4AF37] text-black px-12 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-[#D4AF37]/10"
                    >
                      <CheckCircle2 size={24} /> Concluir Instrução e Avançar
                    </button>
                 ) : (
                    <div className="flex flex-col items-center gap-4 text-green-400">
                      <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
                        <CheckCircle2 size={48} />
                      </div>
                      <p className="font-bold tracking-widest uppercase text-xs">Instrução Concluída</p>
                    </div>
                 )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
