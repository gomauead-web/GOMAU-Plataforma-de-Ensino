import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { BookOpen, ArrowLeft, PlayCircle, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function PremiumCourseViewerPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || !user) return;
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) {
          navigate('/estudos');
          return;
        }

        const data = courseDoc.data();
        if (data.grauPermitido > Number(user.grau || 1) && user.email !== 'tazmaniacrvg@gmail.com') {
          navigate('/estudos'); // fallback for permissions
          return;
        }

        setCourse({ id: courseDoc.id, ...data });

        const modsSnap = await getDocs(query(collection(db, `courses/${courseId}/modules`), orderBy('order', 'asc')));
        const mods = await Promise.all(modsSnap.docs.map(async modDoc => {
          const modData = modDoc.data();
          const unitsSnap = await getDocs(query(collection(db, `courses/${courseId}/modules/${modDoc.id}/units`), orderBy('order', 'asc')));
          
          const units = await Promise.all(unitsSnap.docs.map(async unitDoc => {
            const unitData = unitDoc.data();
            const lessonsSnap = await getDocs(query(collection(db, `courses/${courseId}/modules/${modDoc.id}/units/${unitDoc.id}/lessons`), orderBy('order', 'asc')));
            
            return {
              id: unitDoc.id,
              ...unitData,
              lessons: lessonsSnap.docs.map(l => ({ id: l.id, ...l.data() }))
            };
          }));

          return {
            id: modDoc.id,
            ...modData,
            units
          };
        }));

        setModules(mods);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId, user, navigate]);

  if (loading) return <div className="p-8 text-[#D4AF37] text-center">Carregando Acervo...</div>;
  if (!course) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      <button 
        onClick={() => navigate('/estudos')}
        className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] mb-6 transition-colors text-sm uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar à Câmara
      </button>

      <div className="bg-[#0A0E1A] p-8 rounded-3xl border border-[#D4AF37]/20 shadow-2xl mb-8">
        <div className="flex gap-4 items-center mb-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-black bg-[#D4AF37] px-3 py-1 rounded">Grau {course.grauDoCurso}</span>
          <span className="text-[10px] uppercase text-gray-400 tracking-widest">{course.type}</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel' }}>{course.title}</h1>
        <p className="text-gray-300 leading-relaxed text-lg max-w-3xl">{course.description}</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#D4AF37] uppercase tracking-widest mb-4">Módulos da Obra</h2>
        {modules.map(mod => (
          <div key={mod.id} className="bg-[#05070A] border border-[#1e293b] rounded-2xl overflow-hidden">
            <div className="p-6 bg-[#0A0E1A] border-b border-[#1e293b]">
              <h3 className="text-lg font-bold text-white">Módulo {mod.order}: {mod.title}</h3>
              {mod.description && <p className="text-sm text-gray-400 mt-2">{mod.description}</p>}
            </div>
            
            <div className="p-6 space-y-6">
              {mod.units.map((unit: any) => (
                <div key={unit.id} className="pl-4 border-l-2 border-[#D4AF37]/30">
                  <h4 className="text-md font-bold text-gray-200 mb-3">Unidade {unit.order}: {unit.title}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unit.lessons.map((lesson: any) => (
                      <button 
                        key={lesson.id}
                        onClick={() => navigate(`/estudos/${course.id}/lesson/${lesson.id}`)}
                        className="flex items-center gap-3 p-3 bg-[#1e293b]/50 hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30 rounded-xl transition-all text-left group"
                      >
                        <div className="p-2 bg-[#0A0E1A] rounded-lg text-gray-400 group-hover:text-[#D4AF37]">
                          <PlayCircle size={18} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Aula {lesson.order}</p>
                          <p className="text-sm text-white font-medium line-clamp-1">{lesson.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
