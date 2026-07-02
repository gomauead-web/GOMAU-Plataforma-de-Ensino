import React, { useState } from 'react';
import { Target, Sparkles, Book, Save, Eye, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export function CamaraCriacaoPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    grauPermitido: 1,
    grauDoCurso: 1,
    publicoAlvo: '',
    objetivoPedagogico: '',
    nivelProfundidade: 'intermediário',
    tomLinguagem: 'premium',
    ritoFoco: 'universal',
    abordagemFilosofica: 'tradicional',
    estiloExercicios: 'misturado',
    tamanhoLicoes: 'médio',
    citacoesEReferencias: 'autores_classicos',
    quantidadeModulos: 1,
    quantidadeUnidadesPorModulo: 1,
    quantidadeAulasPorUnidade: 3,
    duracaoEstimadaAula: '15 minutos',
    tipoMaterial: 'curso',
    estiloLivro: 'manual premium',
    referenciasPermitidas: '',
    restricoesConteudo: '',
    status: 'rascunho'
  });

  const handleSubmit = async (e: React.FormEvent, status: 'rascunho' | 'publicado') => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth.currentUser) throw new Error('Não autenticado.');
      if (auth.currentUser.email !== 'tazmaniacrvg@gmail.com') {
        throw new Error('Acesso não autorizado.');
      }

      // We send the generation parameters to the backend
      const response = await fetch('/api/premium/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na geração');
      }
      
      const { data } = await response.json();
      
      // Save course to Firestore
      const courseRef = await addDoc(collection(db, 'courses'), {
        title: formData.title || data.title,
        description: formData.description || data.description,
        createdBy: auth.currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        grauPermitido: Number(formData.grauPermitido),
        grauDoCurso: Number(formData.grauDoCurso),
        status: status,
        premium: true,
        type: formData.tipoMaterial
      });
      
      // We need to iterate and save modules, units, lessons
      if (data.modules && Array.isArray(data.modules)) {
        for (const module of data.modules) {
          const modRef = await addDoc(collection(db, `courses/${courseRef.id}/modules`), {
            courseId: courseRef.id,
            title: module.title,
            description: module.description || '',
            order: module.order || 1,
            createdAt: Date.now()
          });
          
          if (module.units && Array.isArray(module.units)) {
            for (const unit of module.units) {
              const unitRef = await addDoc(collection(db, `courses/${courseRef.id}/modules/${modRef.id}/units`), {
                moduleId: modRef.id,
                title: unit.title,
                description: unit.description || '',
                order: unit.order || 1,
                createdAt: Date.now()
              });
              
              if (unit.lessons && Array.isArray(unit.lessons)) {
                for (const lesson of unit.lessons) {
                  await addDoc(collection(db, `courses/${courseRef.id}/modules/${modRef.id}/units/${unitRef.id}/lessons`), {
                    unitId: unitRef.id,
                    title: lesson.title,
                    order: lesson.order || 1,
                    content: lesson.content || '',
                    exercises: lesson.exercises || [],
                    createdAt: Date.now()
                  });
                }
              }
            }
          }
        }
      }

      toast.success(status === 'rascunho' ? 'Rascunho salvo com sucesso!' : 'Obra gerada e publicada!');
      // Reset form or navigate
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#0A0E1A] text-gray-200 rounded-2xl border border-[#D4AF37]/20 shadow-2xl">
      <div className="flex items-center gap-4 mb-8 border-b border-[#D4AF37]/20 pb-4">
        <div className="p-3 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]">
          <Target size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Cinzel' }}>Câmara de Criação</h1>
          <p className="text-sm text-gray-400 uppercase tracking-widest mt-1">Módulo Premium de Geração Editorial M∴</p>
        </div>
      </div>

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Título da Obra</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Tema Central</label>
            <input name="description" value={formData.description} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white focus:border-[#D4AF37] outline-none" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Grau Permitido (Visualização)</label>
            <input name="grauPermitido" type="number" min="1" max="33" value={formData.grauPermitido} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Grau Foco do Material</label>
            <input name="grauDoCurso" type="number" min="1" max="33" value={formData.grauDoCurso} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Tipo de Material</label>
            <select name="tipoMaterial" value={formData.tipoMaterial} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="curso">Curso Interativo (com avaliações)</option>
              <option value="livro">Livro / Manual (apenas leitura)</option>
              <option value="curso_livro">Curso + Livro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Nível de Profundidade</label>
            <select name="nivelProfundidade" value={formData.nivelProfundidade} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="introdutorio">Introdutório</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
              <option value="filosofico">Filosófico</option>
              <option value="simbolico">Simbólico</option>
              <option value="ritualistico">Ritualístico Educativo</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Tom de Linguagem</label>
            <select name="tomLinguagem" value={formData.tomLinguagem} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="didatico">Didático e Claro</option>
              <option value="solene">Solene e Tradicional</option>
              <option value="filosofico">Filosófico e Reflexivo</option>
              <option value="premium">Premium / Masterclass (Recomendado)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Rito Foco</label>
            <select name="ritoFoco" value={formData.ritoFoco} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="universal">Multirito / Universal</option>
              <option value="reaa">R.E.A.A.</option>
              <option value="york">Rito de York</option>
              <option value="schroeder">Rito Schröder</option>
              <option value="brasileiro">Rito Brasileiro</option>
              <option value="adonhiramita">Rito Adonhiramita</option>
              <option value="moderno">Rito Moderno</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Abordagem Filosófica</label>
            <select name="abordagemFilosofica" value={formData.abordagemFilosofica} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="tradicional">Tradicional / Ortodoxa</option>
              <option value="esoterica">Hermética / Esotérica</option>
              <option value="historica">Histórica / Científica</option>
              <option value="psicologica">Psicológica / Analítica</option>
              <option value="comportamental">Prática / Comportamental</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Citações & Referências</label>
            <select name="citacoesEReferencias" value={formData.citacoesEReferencias} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="autores_classicos">Autores Clássicos (Boucher, Aslan, etc)</option>
              <option value="rituais_oficiais">Foco em Rituais Oficiais</option>
              <option value="textos_filosoficos">Textos Filosóficos Gerais</option>
              <option value="sem_citacoes">Evitar Citações Diretas</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Estilo de Exercícios</label>
            <select name="estiloExercicios" value={formData.estiloExercicios} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="misturado">Misturado (Exato e Reflexivo)</option>
              <option value="reflexivo">Predominantemente Reflexivo / Interpretativo</option>
              <option value="conhecimento">Conhecimento Exato / Ritualística</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Densidade / Tamanho da Aula</label>
            <select name="tamanhoLicoes" value={formData.tamanhoLicoes} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none">
              <option value="curto">Curto (Leitura de 5-10 min)</option>
              <option value="medio">Médio (Leitura de 15-20 min)</option>
              <option value="longo">Longo / Denso (Leitura de 30+ min)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Restrições e Cuidados Editoriais</label>
          <textarea name="restricoesConteudo" rows={2} value={formData.restricoesConteudo} onChange={handleChange} placeholder="Ex: Não citar política contemporânea, não mencionar palavras de passe, manter foco apenas na instrução do grau..." className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none resize-none"></textarea>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Objetivo Pedagógico Central</label>
          <textarea name="objetivoPedagogico" rows={3} value={formData.objetivoPedagogico} onChange={handleChange} className="w-full bg-[#05070A] border border-[#1e293b] rounded-lg p-3 text-white outline-none resize-none"></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-[#05070A] rounded-xl border border-[#1e293b]">
           <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Qtd. Módulos</label>
            <input name="quantidadeModulos" type="number" min="1" max="10" value={formData.quantidadeModulos} onChange={handleChange} className="w-full bg-transparent border-b border-[#1e293b] p-2 text-white outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unidades por Módulo</label>
            <input name="quantidadeUnidadesPorModulo" type="number" min="1" max="5" value={formData.quantidadeUnidadesPorModulo} onChange={handleChange} className="w-full bg-transparent border-b border-[#1e293b] p-2 text-white outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aulas por Unidade</label>
            <input name="quantidadeAulasPorUnidade" type="number" min="1" max="10" value={formData.quantidadeAulasPorUnidade} onChange={handleChange} className="w-full bg-transparent border-b border-[#1e293b] p-2 text-white outline-none" />
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-[#D4AF37]/20">
          <button 
            type="button"
            onClick={(e) => handleSubmit(e, 'publicado')}
            disabled={loading}
            className="flex-1 bg-[#D4AF37] text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Sparkles className="animate-spin" /> : <CheckCircle2 />}
            {loading ? 'Forjando Obra...' : 'Gerar Obra & Publicar'}
          </button>
          
          <button 
            type="button"
            onClick={(e) => handleSubmit(e, 'rascunho')}
            disabled={loading}
            className="flex-1 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            Salvar Rascunho
          </button>
        </div>
      </form>
    </div>
  );
}
