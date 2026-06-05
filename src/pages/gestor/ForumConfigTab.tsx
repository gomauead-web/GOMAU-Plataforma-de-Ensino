import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, GraduationCap, X } from 'lucide-react';

interface ForumInstructor {
  id: string;
  cim: string;
  nome: string;
  degrees: string[];
  addedBy: string;
}

export function ForumConfigTab() {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<ForumInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newCim, setNewCim] = useState('');
  const [newNome, setNewNome] = useState('');
  const [degrees, setDegrees] = useState<string[]>(['Aprendiz']);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'forumInstructors'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setInstructors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumInstructor)));
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar instrutores.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCim.trim() || !newNome.trim() || degrees.length === 0) {
      alert('Preencha o CIM, Nome e selecione pelo menos um grau.');
      return;
    }

    try {
      await addDoc(collection(db, 'forumInstructors'), {
        cim: newCim,
        nome: newNome,
        degrees,
        addedBy: user?.uid,
        createdAt: serverTimestamp()
      });
      setNewCim('');
      setNewNome('');
      setDegrees(['Aprendiz']);
      loadInstructors();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao adicionar instrutor.');
    }
  };

  const handleRemoveInstructor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'forumInstructors', id));
      loadInstructors();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao remover instrutor.');
    }
  };

  const toggleDegree = (deg: string) => {
    if (degrees.includes(deg)) {
      setDegrees(degrees.filter(d => d !== deg));
    } else {
      setDegrees([...degrees, deg]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#D4AF37] mb-2 flex items-center gap-2">
            <GraduationCap className="w-6 h-6" /> Gestão do Fórum
          </h2>
          <p className="text-gray-400">Designe Instrutores para responder às dúvidas dos IIr∴ nas salas do fórum.</p>
        </div>
      </div>

      <div className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-[#0A0E1A]/60 transition-all">
        <h3 className="text-lg font-bold text-white mb-4">Adicionar Instrutor</h3>
        <form onSubmit={handleAddInstructor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">CIM do Instrutor</label>
              <input
                type="text"
                value={newCim}
                onChange={e => setNewCim(e.target.value)}
                className="w-full bg-black/40 border-white/10 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37] text-white p-3"
                placeholder="Ex: 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
              <input
                type="text"
                value={newNome}
                onChange={e => setNewNome(e.target.value)}
                className="w-full bg-black/40 border-white/10 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37] text-white p-3"
                placeholder="Ir∴ João da Silva"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Salas (Graus) que ele pode responder:</label>
            <div className="flex gap-4">
              {['Aprendiz', 'Companheiro', 'Mestre'].map(deg => (
                <button
                  type="button"
                  key={deg}
                  onClick={() => toggleDegree(deg)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    degrees.includes(deg) 
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' 
                      : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {deg}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="rounded-md bg-[#D4AF37] text-black hover:bg-[#D4AF37] hover:brightness-110 font-bold px-6 py-3">
            <Plus className="w-4 h-4 mr-2 inline-block" /> Adicionar Instrutor
          </button>
        </form>
      </div>

      <div className="bg-[#0A0E1A]/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Instrutores Designados</h3>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : instructors.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum instrutor designado ainda.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">CIM</th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Graus</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {instructors.map(inst => (
                  <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-300">{inst.cim}</td>
                    <td className="px-6 py-4 text-white font-medium">{inst.nome}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {inst.degrees.map(d => (
                          <span key={d} className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-md text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/20">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveInstructor(inst.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        title="Remover Instrutor"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
