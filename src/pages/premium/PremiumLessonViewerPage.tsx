import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export function PremiumLessonViewerPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!courseId || !lessonId) return;
      try {
        const cDoc = await getDoc(doc(db, 'courses', courseId));
        if (cDoc.exists()) setCourse(cDoc.data());

        // Since lesson is nested deeply, we can use a collectionGroup query or direct path if we had it.
        // We know the lessonId, so we can query collectionGroup 'lessons' where document ID == lessonId
        const q = query(collectionGroup(db, 'lessons'));
        // We can't query by document ID in collectionGroup directly easily without it being a field, 
        // wait, we can't easily find the lesson without knowing its full path.
        // Let's just fetch all modules, units to find it... or better, since we use uuid, collectionGroup by __name__ ? No, __name__ requires full path.
        // Let's just fetch everything in the course and find the lesson. It's small.
        const modsSnap = await getDocs(collection(db, `courses/${courseId}/modules`));
        let foundLesson = null;
        for (const modDoc of modsSnap.docs) {
          const unitsSnap = await getDocs(collection(db, `courses/${courseId}/modules/${modDoc.id}/units`));
          for (const unitDoc of unitsSnap.docs) {
            const lDoc = await getDoc(doc(db, `courses/${courseId}/modules/${modDoc.id}/units/${unitDoc.id}/lessons`, lessonId));
            if (lDoc.exists()) {
              foundLesson = { id: lDoc.id, ...lDoc.data() };
              break;
            }
          }
          if (foundLesson) break;
        }

        if (foundLesson) {
          setLesson(foundLesson);
        } else {
          toast.error("Aula não encontrada.");
          navigate(`/estudos/${courseId}`);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [courseId, lessonId, navigate]);

  const handleAnswerChange = (qIndex: number, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmitQuiz = () => {
    if (!lesson.exercises || lesson.exercises.length === 0) return;
    let correct = 0;
    lesson.exercises.forEach((ex: any, i: number) => {
      if (answers[i] === ex.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  if (loading) return <div className="p-8 text-center text-[#D4AF37]">Preparando Templo...</div>;
  if (!lesson) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 font-sans">
      <button 
        onClick={() => navigate(`/estudos/${courseId}`)}
        className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] mb-6 transition-colors text-sm uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar ao Sumário
      </button>

      <div className="bg-[#0A0E1A] rounded-3xl border border-[#D4AF37]/20 shadow-2xl overflow-hidden mb-8">
        <div className="p-8 border-b border-[#1e293b] bg-gradient-to-b from-[#05070A] to-[#0A0E1A]">
           <div className="flex items-center gap-3 text-[#D4AF37] mb-4">
             <BookOpen size={20} />
             <span className="text-xs uppercase tracking-widest font-bold">Instrução Maçônica</span>
           </div>
           <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{lesson.title}</h1>
           <p className="text-sm text-gray-400 uppercase tracking-widest">{course?.title}</p>
        </div>

        <div className="p-8 lg:p-12 prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed prose-headings:text-[#D4AF37] prose-a:text-[#D4AF37] max-w-none prose-blockquote:border-[#D4AF37] prose-blockquote:text-gray-400 prose-blockquote:italic">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>
      </div>

      {lesson.exercises && lesson.exercises.length > 0 && (
        <div className="bg-[#05070A] p-8 rounded-3xl border border-[#1e293b] shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-3">
            <CheckCircle2 className="text-[#D4AF37]" /> Questionário de Fixação
          </h2>

          <div className="space-y-8">
            {lesson.exercises.map((ex: any, i: number) => (
              <div key={i} className="bg-[#0A0E1A] p-6 rounded-2xl border border-[#1e293b]">
                <p className="text-gray-200 font-medium mb-4 text-lg">{i + 1}. {ex.question}</p>
                <div className="space-y-3">
                  {ex.options && ex.options.map((opt: string, optIdx: number) => {
                    const isSelected = answers[i] === opt;
                    const isCorrect = ex.correctAnswer === opt;
                    
                    let bgClass = "bg-[#1e293b] text-gray-300 hover:border-[#D4AF37]/50 border-transparent";
                    if (isSelected) bgClass = "bg-[#D4AF37]/10 border-[#D4AF37] text-white";
                    if (submitted) {
                      if (isCorrect) bgClass = "bg-green-900/40 border-green-500 text-green-300";
                      else if (isSelected && !isCorrect) bgClass = "bg-red-900/40 border-red-500 text-red-300";
                      else bgClass = "bg-[#1e293b]/50 text-gray-500 border-transparent opacity-50";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerChange(i, opt)}
                        disabled={submitted}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${bgClass}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <div className={`mt-4 p-4 rounded-xl text-sm ${answers[i] === ex.correctAnswer ? 'bg-green-900/20 text-green-400' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                    <span className="font-bold uppercase tracking-wider block mb-1">Nota da Instrução:</span>
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!submitted ? (
            <button 
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length < lesson.exercises.length}
              className="mt-8 w-full bg-[#D4AF37] text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#C5A028] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gravar Respostas
            </button>
          ) : (
            <div className="mt-8 p-6 bg-[#0A0E1A] border-2 border-[#D4AF37] rounded-xl text-center">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-2 uppercase tracking-widest">Resultado da Avaliação</h3>
              <p className="text-gray-300">
                Você acertou <strong className="text-white text-2xl">{score}</strong> de <strong className="text-white">{lesson.exercises.length}</strong> questões.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
