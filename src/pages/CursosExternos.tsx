import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, BookOpen, Clock, ChevronRight, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function CursosExternos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'courses'),
        where('status', '==', 'aberto'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const allCourses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtro de Grau (Hierarquia)
      const grauOrder = { 'Aprendiz': 1, 'Companheiro': 2, 'Mestre': 3 };
      const userGrauVal = (grauOrder as any)[user?.grau || 'Aprendiz'] || 1;
      
      const filtered: any[] = allCourses.filter((c: any) => {
        const courseGrauVal = (grauOrder as any)[c.grauMinimo || 'Aprendiz'] || 1;
        return userGrauVal >= courseGrauVal;
      });
      // GUIA DO MEMBRO
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
      setCourses(filtered);

    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <GraduationCap size={48} className="text-[#D4AF37] animate-pulse mb-4" />
        <p className="text-gray-400">Consultando Pergaminhos de Instrução...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37] flex items-center gap-3 mb-2" style={{fontFamily: 'Cinzel'}}>
            <GraduationCap size={32} />
            Escola de Sabedoria EAD
          </h1>
          <p className="text-gray-400">Ambiente de instrução contínua e aprimoramento filosófico-ritualístico.</p>
        </div>
        
        <div className="bg-[#1e293b]/30 p-4 rounded-xl border border-[#D4AF37]/20 flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
             <Sparkles size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Seu Grau Atual</p>
            <p className="text-sm font-bold text-white">{user?.grau}</p>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-[#1e293b]/20 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-[#1e293b] rounded-full flex items-center justify-center mx-auto mb-4">
             <BookOpen size={32} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-300">Nenhuma instrução disponível</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-2">No momento não há cursos ativos compatíveis com seu grau atual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id}
              onClick={() => course.id === 'guia-do-membro' ? navigate('/workshop') : navigate(`/cursos/${course.id}`)}
              className="bg-[#1e293b]/30 border border-[#1e293b] rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all cursor-pointer group flex flex-col h-full active:scale-[0.98]"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                    <GraduationCap size={24} />
                  </div>
                  <span className="bg-[#0A0E1A] text-[#D4AF37] text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-[#D4AF37]/20">
                    {course.grauMinimo}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2" style={{fontFamily: 'Cinzel'}}>
                  {course.titulo}
                </h3>
                
                <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                  {course.descricao}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {course.cargaHoraria || '10h'}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {course.modulos?.length} Módulos
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-[#1e293b]/50 border-t border-[#1e293b] flex items-center justify-between group-hover:bg-[#D4AF37]/10 transition-all">
                <span className="text-sm font-bold text-[#D4AF37]">Iniciar Jornada</span>
                <ChevronRight size={18} className="text-[#D4AF37]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
