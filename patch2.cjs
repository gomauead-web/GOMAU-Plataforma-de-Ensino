const fs = require('fs');
let code = fs.readFileSync('src/components/gestor/TelemetryView.tsx', 'utf8');

const regex2 = /Os 5 Irmãos mais ativos em 30 dias[\s\S]*?acessos<\/div>/m;
const replacement2 = `Os 10 Irmãos com mais tempo de estudo na plataforma</p>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                  {topUsers.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm py-10">
                      Nenhum dado recente encontrado.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {topUsers.map((user, idx) => (
                        <div key={idx} className="bg-[#1e293b]/40 p-4 rounded-xl border border-[#1e293b] hover:border-[#D4AF37]/40 hover:bg-[#1e293b] transition-all flex items-center gap-4">
                          <div className={\`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0
                            \${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 
                              idx === 1 ? 'bg-gray-400/20 text-gray-400 border-2 border-gray-400/50' : 
                              idx === 2 ? 'bg-amber-700/20 text-amber-600 border-2 border-amber-700/50' : 
                              'bg-[#0f172a] text-gray-500 border border-[#1e293b]'}\`}>
                            {idx + 1}º
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-gray-100 text-base font-bold truncate">{user.nome}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-400 bg-black/40 px-2 py-1 rounded border border-[#1e293b] font-mono">CIM {user.cim}</span>
                              <span className="text-xs text-gray-500 truncate">Visto: {user.lastAccess.toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right pr-2">
                            <div className="text-2xl font-black text-[#D4AF37]">
                              {user.totalStudyTime ? (
                                user.totalStudyTime > 3600 ? 
                                  \`\${Math.floor(user.totalStudyTime / 3600)}h \${Math.floor((user.totalStudyTime % 3600) / 60)}m\` : 
                                  \`\${Math.floor((user.totalStudyTime % 3600) / 60)}m\`
                              ) : '0m'}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">tempo total</div>`;

code = code.replace(regex2, replacement2);
fs.writeFileSync('src/components/gestor/TelemetryView.tsx', code);
