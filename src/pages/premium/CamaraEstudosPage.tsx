import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Lock, PlayCircle } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  description: string;
  grauPermitido: number;
  grauDoCurso: number;
  premium: boolean;
  type: string;
}

export function CamaraEstudosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'courses'),
          where('status', '==', 'publicado'),
          where('premium', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const fetchedCourses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];
        
        // Filter out courses the user shouldn't see based on degree (if any logic needs client-side extra filtering)
        // Actually, the Firestore rules also block read, but we did a list query.
        const allowedCourses = fetchedCourses.filter(c => c.grauPermitido <= Number(user.grau || 1));
        
        setCourses(allowedCourses);
      } catch (error) {
        console.error("Erro ao carregar cursos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  if (loading) {
    return <div className="text-center p-8 text-[#D4AF37]">Carregando Câmara de Estudos...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-8 border-b border-[#D4AF37]/20 pb-4">
        <div className="p-3 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]">
          <BookOpen size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Cinzel' }}>Câmara de Estudos</h1>
          <p className="text-sm text-gray-400 uppercase tracking-widest mt-1">Obras Premium e Manuais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhuma obra disponível para o seu grau no momento.
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="bg-[#0A0E1A] border border-[#1e293b] hover:border-[#D4AF37]/50 rounded-2xl p-6 transition-all flex flex-col shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">Grau {course.grauDoCurso}</span>
                <span className="text-[10px] uppercase text-gray-500">{course.type === 'livro' ? 'Manual' : 'Curso Interativo'}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
              <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-3">{course.description}</p>
              
              <button 
                onClick={() => navigate(`/estudos/${course.id}`)}
                className="w-full bg-[#1e293b] text-white hover:text-black hover:bg-[#D4AF37] py-3 rounded-xl transition-colors font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <PlayCircle size={18} />
                Acessar Obra
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
