import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { HardDriveDownload, ArrowRightLeft, Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function DataManagement() {
   const [origemEmail, setOrigemEmail] = useState('');
   const [destinoEmail, setDestinoEmail] = useState('');
   
   const [isMigrating, setIsMigrating] = useState(false);
   const [isBackingUp, setIsBackingUp] = useState(false);
   const [migrationLog, setMigrationLog] = useState<string[]>([]);

   const [confirmMigrate, setConfirmMigrate] = useState(false);
   const [confirmBackup, setConfirmBackup] = useState(false);

   const addLog = (msg: string) => {
      setMigrationLog(prev => [...prev, msg]);
   };

   const handleBackup = async () => {
      setIsBackingUp(true);
      try {
         const collectionsToBackup = [
            'users', 'requests', 'forumTopics', 'forumReplies', 
            'mensalidades', 'history', 'reading_progress', 'courses', 'contents'
         ];
         
         const backupData: Record<string, any> = {};

         for (const colName of collectionsToBackup) {
            const snap = await getDocs(collection(db, colName));
            backupData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         }

         const jsonString = JSON.stringify(backupData, null, 2);
         const blob = new Blob([jsonString], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `backup_gomau_${new Date().toISOString().split('T')[0]}.json`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);

         addLog('Backup realizado com sucesso e baixado.');
      } catch (err: any) {
         console.error('Erro no backup:', err);
         addLog('Erro no backup: ' + err.message);
      } finally {
         setIsBackingUp(false);
      }
   };

   const handleMigration = async () => {
      if (!origemEmail || !destinoEmail) {
         addLog('ERRO: Informe os dois e-mails (Origem e Destino).');
         return;
      }

      setIsMigrating(true);
      setMigrationLog([]);
      addLog(`Iniciando migração de: ${origemEmail} -> ${destinoEmail}`);

      try {
         // Buscar Origem
         const qOrigem = query(collection(db, 'users'), where('email', '==', origemEmail.trim().toLowerCase()));
         const snapOrigem = await getDocs(qOrigem);
         if (snapOrigem.empty) {
            throw new Error(`Usuário de Origem não encontrado (${origemEmail}) no banco.`);
         }
         const origemIds: string[] = [];
         snapOrigem.docs.forEach(d => {
            const data = d.data();
            if (data.uid) origemIds.push(data.uid);
            origemIds.push(d.id); // Add the doc ID as well just in case they used that
         });

         // Buscar Destino
         const qDestino = query(collection(db, 'users'), where('email', '==', destinoEmail.trim().toLowerCase()));
         const snapDestino = await getDocs(qDestino);
         if (snapDestino.empty) {
            throw new Error(`Usuário de Destino não encontrado (${destinoEmail}) no banco.`);
         }
         const destinoUser = snapDestino.docs[0].data();
         const destinoId = destinoUser.uid || snapDestino.docs[0].id;
         const destinoName = destinoUser.nome || '';
         const destinoCim = destinoUser.cim || '';
         const validOrigemIds = Array.from(new Set(origemIds)).filter(x => !!x);

         addLog(`IDs resolvidos: UIDs Origem(${validOrigemIds.join(', ')}) | UID Destino(${destinoId})`);

         if (validOrigemIds.length === 0) {
             throw new Error('Nenhum ID localizável para a conta de origem.');
         }

         const batch = writeBatch(db);
         let totalChanged = 0;

         // Migrar requests (Pranchas, etc) -> field: userId, userName
         addLog('Migrando requests...');
         const qReq = query(collection(db, 'requests'), where('userId', 'in', validOrigemIds));
         const snapReq = await getDocs(qReq);
         snapReq.forEach(d => {
            batch.update(doc(db, 'requests', d.id), { userId: destinoId, userName: destinoName });
            totalChanged++;
         });

         // Migrar forumTopics -> field: authorId, authorName, authorCim
         addLog('Migrando forumTopics...');
         const qTopics = query(collection(db, 'forumTopics'), where('authorId', 'in', validOrigemIds));
         const snapTopics = await getDocs(qTopics);
         snapTopics.forEach(d => {
            batch.update(doc(db, 'forumTopics', d.id), { authorId: destinoId, authorName: destinoName, authorCim: destinoCim });
            totalChanged++;
         });

         // Migrar forumReplies -> field: authorId, authorName, authorCim
         addLog('Migrando forumReplies...');
         const qReplies = query(collection(db, 'forumReplies'), where('authorId', 'in', validOrigemIds));
         const snapReplies = await getDocs(qReplies);
         snapReplies.forEach(d => {
            batch.update(doc(db, 'forumReplies', d.id), { authorId: destinoId, authorName: destinoName, authorCim: destinoCim });
            totalChanged++;
         });

         // Migrar history -> field: userId, userName
         addLog('Migrando history logs...');
         const qHist = query(collection(db, 'history'), where('userId', 'in', validOrigemIds));
         const snapHist = await getDocs(qHist);
         snapHist.forEach(d => {
            batch.update(doc(db, 'history', d.id), { userId: destinoId, userName: destinoName });
            totalChanged++;
         });

         // Migrar mensalidades -> field: uid, userName, userEmail, userCim
         addLog('Migrando mensalidades...');
         const qTrea = query(collection(db, 'mensalidades'), where('uid', 'in', validOrigemIds));
         const snapTrea = await getDocs(qTrea);
         snapTrea.forEach(d => {
            batch.update(doc(db, 'mensalidades', d.id), { uid: destinoId, userName: destinoName, userEmail: destinoUser.email, userCim: destinoCim });
            totalChanged++;
         });

         // Migrar reading_progress -> field: userId
         addLog('Migrando progresso de leitura...');
         const qRead = query(collection(db, 'reading_progress'), where('userId', 'in', validOrigemIds));
         const snapRead = await getDocs(qRead);
         snapRead.forEach(d => {
            batch.update(doc(db, 'reading_progress', d.id), { userId: destinoId });
            totalChanged++;
         });

         addLog(`Committing modificações (${totalChanged} registros)...`);
         if (totalChanged > 0) {
            await batch.commit();
         }
         addLog('MIGRAÇÃO COMPLETADA COM SUCESSO!');
         setOrigemEmail('');
      } catch (err: any) {
         console.error('Erro na migração:', err);
         addLog(`ERRO: ${err.message}`);
      } finally {
         setIsMigrating(false);
      }
   };

   return (
      <div className="space-y-6 font-sans">
         {/* LOG VIEW - moved to top so it's more visible on error */}
         {migrationLog.length > 0 && (
            <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-4 animate-in fade-in zoom-in-95 mb-4">
               <h4 className="text-xs text-white font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" /> Console de Execução
               </h4>
               <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {migrationLog.map((log, idx) => (
                     <div key={idx} className="text-[10px] font-mono text-gray-300">
                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                     </div>
                  ))}
               </div>
            </div>
         )}

         <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
               <Database className="text-[#D4AF37]" size={24} /> Gestão de Dados & Backup
            </h2>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* BACKUP OFFLINE */}
            <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] shadow-xl">
               <div className="mb-4 text-center pb-4 border-b border-[#1e293b]">
                  <HardDriveDownload size={40} className="mx-auto text-[#D4AF37] mb-2" />
                  <h3 className="font-bold text-gray-200 uppercase tracking-widest">Backup do Sistema (JSON)</h3>
                  <p className="text-xs text-gray-400 mt-2">Extração total de tabelas. Ideal para cópias de segurança locais e preservação dos metadados.</p>
               </div>
               <button 
                  onClick={() => {
                     setMigrationLog([]);
                     if (!confirmBackup) {
                        setConfirmBackup(true);
                        setTimeout(() => setConfirmBackup(false), 3000);
                     } else {
                        handleBackup();
                        setConfirmBackup(false);
                     }
                  }}
                  disabled={isBackingUp}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors ${confirmBackup ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white'}`}
               >
                  {isBackingUp ? <><Loader2 size={16} className="animate-spin" /> Gerando JSON...</> 
                  : confirmBackup ? "Tem Certeza? Baixar Agora" 
                  : <><HardDriveDownload size={16} /> Iniciar Download (Backup Offline)</>}
               </button>
            </div>

            {/* MIGRATION */}
            <div className="bg-[#0A0E1A] p-6 rounded-xl border border-[#1e293b] shadow-xl flex flex-col">
               <div className="mb-4">
                  <h3 className="font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                     <ArrowRightLeft className="text-[#D4AF37]" size={18} /> Migração de Documentos (ID)
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">Transfere pranchas, fóruns e faturas de uma conta antiga para uma nova, baseando-se no E-mail de cadastro de origem para o alvo.</p>
               </div>
               
               <div className="flex flex-col gap-3 flex-1 justify-center">
                  <div>
                     <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1 mb-1 block">E-mail de Origem</label>
                     <input 
                        type="email" 
                        value={origemEmail}
                        placeholder="ex: calepi@gmail.com"
                        onChange={e => setOrigemEmail(e.target.value)}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-red-500"
                     />
                  </div>
                  <div>
                     <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1 mb-1 block">E-mail de Destino</label>
                     <input 
                        type="email" 
                        value={destinoEmail}
                        placeholder="ex: tazmaniacrvg@gmail.com"
                        onChange={e => setDestinoEmail(e.target.value)}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-[#D4AF37]"
                     />
                  </div>
               </div>

               <button 
                  onClick={() => {
                     if (!origemEmail || !destinoEmail) return;
                     if (!confirmMigrate) {
                        setConfirmMigrate(true);
                        setTimeout(() => setConfirmMigrate(false), 3000);
                     } else {
                        handleMigration();
                        setConfirmMigrate(false);
                     }
                  }}
                  disabled={isMigrating || !origemEmail || !destinoEmail}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors mt-4 disabled:opacity-50 ${confirmMigrate ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#D4AF37] hover:bg-[#C5A028] text-black'}`}
               >
                  {isMigrating ? <><Loader2 size={16} className="animate-spin" /> Trocando vínculos...</> 
                  : confirmMigrate ? 'Tem Certeza? (Ação Permanente)' 
                  : 'Iniciar Migração Completa'}
               </button>
            </div>
         </div>

         <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
               <h4 className="text-red-400 font-bold text-sm uppercase mb-1">Avisos de Integridade</h4>
               <ul className="text-xs text-red-500/80 space-y-1 list-disc pl-4">
                  <li>O Backup JSON armazena todas as tabelas em um formato unificado na sua máquina. A restauração/rollback deve ser feita manualmente (script próprio) em caso de emergência.</li>
                  <li>A migração vincula novas chaves (UID) nos registros antigos em tempo real. Esta função deve ser operada pelo Master e a responsabilidade pelas chaves de destino é incondicional.</li>
               </ul>
            </div>
         </div>
      </div>
   );
}
