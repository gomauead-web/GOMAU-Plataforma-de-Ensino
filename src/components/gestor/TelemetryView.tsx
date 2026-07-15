import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  Timestamp,
  orderBy,
  limit
} from "firebase/firestore";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  Award,
  Clock,
  ShieldAlert,
  Fingerprint,
  Database,
  X,
  Maximize2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export function TelemetryView() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    month: 0,
    week: 0,
    day: 0,
  });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function loadTelemetry() {
      if (!isExpanded) return;
      try {
        setLoading(true);
        const logsRef = collection(db, "accessLogs");
        const now = new Date();
        
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Domingo
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // 1. Buscas otimizadas com Aggregation (Custa apenas 1 leitura por query)
        const totalCountReq = getCountFromServer(logsRef);
        const monthCountReq = getCountFromServer(query(logsRef, where("timestamp", ">=", Timestamp.fromDate(startOfMonth))));
        const weekCountReq = getCountFromServer(query(logsRef, where("timestamp", ">=", Timestamp.fromDate(startOfWeek))));
        const dayCountReq = getCountFromServer(query(logsRef, where("timestamp", ">=", Timestamp.fromDate(startOfDay))));
        
        const [totalCount, monthCount, weekCount, dayCount] = await Promise.all([
          totalCountReq, monthCountReq, weekCountReq, dayCountReq
        ]);
        
        setStats({
          total: totalCount.data().count,
          month: monthCount.data().count,
          week: weekCount.data().count,
          day: dayCount.data().count,
        });

        // 2. Busca detalhada dos últimos 30 dias para Gráfico e Engajamento
        const thirtyDaysAgo = new Date(startOfDay);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentLogsQuery = query(
          logsRef, 
          where("timestamp", ">=", Timestamp.fromDate(thirtyDaysAgo)),
          orderBy("timestamp", "desc"),
          limit(500) // Proteção de tokens (máximo de 500 leituras para o gráfico)
        );
        const recentLogsSnap = await getDocs(recentLogsQuery);
        
        // Agregar Top Users
        const userCounts: Record<string, { nome: string, count: number, cim: string, lastAccess: Date }> = {};
        
        // Agregar Chart Data
        const dailyCounts: Record<string, number> = {};
        
        // Inicializar array de 30 dias para o gráfico não ter buracos
        for (let i = 29; i >= 0; i--) {
          const d = new Date(startOfDay);
          d.setDate(d.getDate() - i);
          const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          dailyCounts[dateStr] = 0;
        }

        recentLogsSnap.forEach(doc => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
          const key = data.uid || data.email;
          
          // Agrupamento por dia
          const dateStr = `${String(timestamp.getDate()).padStart(2, '0')}/${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
          if (dailyCounts[dateStr] !== undefined) {
            dailyCounts[dateStr]++;
          }
          
                          });

        // 3. Buscar Ranking de Engajamento por Tempo de Tela (userMetrics)
        const metricsQuery = query(
          collection(db, "userMetrics"),
          orderBy("totalStudyTime", "desc"),
          limit(10)
        );
        const metricsSnap = await getDocs(metricsQuery);
        
        const sortedUsers = [];
        metricsSnap.forEach(doc => {
          const data = doc.data();
          sortedUsers.push({
            nome: data.nome,
            cim: data.cim,
            totalStudyTime: data.totalStudyTime,
            monthlyStudyTime: data.monthlyStudyTime,
            lastAccess: data.lastActive?.toDate ? data.lastActive.toDate() : new Date()
          });
        });
        
        const formattedChartData = Object.entries(dailyCounts).map(([date, count]) => ({
          date,
          acessos: count
        }));
          
        setTopUsers(sortedUsers);
        setChartData(formattedChartData);
        
      } catch (err) {
        console.error("Erro ao carregar telemetria:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadTelemetry();
  }, [isExpanded]);

  if (!isExpanded) {
    return (
      <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-xl">
        <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-6">
          <Activity className="text-[#D4AF37]" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Painel Analítico de Telemetria</h2>
        <p className="text-gray-400 max-w-xl mb-10 text-sm leading-relaxed">
          O dashboard de telemetria contém métricas detalhadas, gráficos de acesso na linha do tempo e ranking de engajamento dos membros. Para garantir que os gráficos e tabelas sejam renderizados perfeitamente sem necessidade de zoom, este módulo foi projetado para rodar nativamente em tela cheia.
        </p>
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-[#D4AF37] hover:bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-[#D4AF37]/20 hover:scale-105"
        >
          <Maximize2 size={20} />
          Expandir Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#050810] overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 md:p-8 min-h-screen flex flex-col">
        {/* Header do Modal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#0F172A] p-6 rounded-2xl border border-[#1e293b] shadow-2xl">
          <div>
            <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              <Activity className="text-[#D4AF37]" size={36} />
              Telemetria e Engajamento
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Análise comportamental, tráfego da plataforma e rank de engajamento da egrégora.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-4 py-3 rounded-lg flex items-center gap-2">
                <ShieldAlert className="text-[#D4AF37]" size={20} />
                <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest">Monitoramento Ativo</span>
             </div>
             <button
               onClick={() => setIsExpanded(false)}
               className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20 flex items-center justify-center"
               title="Fechar Painel"
             >
               <X size={24} />
             </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 flex-1">
            <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#D4AF37] mt-6 font-bold uppercase tracking-widest animate-pulse">Compilando telemetria agregada...</p>
            <p className="text-gray-500 text-xs mt-2">Processando matriz de dados do Firestore com Aggregations...</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1 pb-20">
            {/* Métricas Globais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#0f172a] p-8 rounded-2xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Database size={100} />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]">
                    <Database size={24} />
                  </div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wide">Desde a Fundação</h3>
                </div>
                <div className="text-5xl font-black text-gray-100 mb-2">{stats.total}</div>
                <p className="text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Acessos Totais</p>
              </div>

              <div className="bg-[#0f172a] p-8 rounded-2xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Calendar size={100} />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wide">Este Mês</h3>
                </div>
                <div className="text-5xl font-black text-gray-100 mb-2">{stats.month}</div>
                <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">Acessos no Mês</p>
              </div>

              <div className="bg-[#0f172a] p-8 rounded-2xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={100} />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wide">Esta Semana</h3>
                </div>
                <div className="text-5xl font-black text-gray-100 mb-2">{stats.week}</div>
                <p className="text-xs text-emerald-400 font-bold tracking-widest uppercase">Acessos na Semana</p>
              </div>

              <div className="bg-[#0f172a] p-8 rounded-2xl border border-[#1e293b] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <BarChart3 size={100} />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wide">Hoje</h3>
                </div>
                <div className="text-5xl font-black text-gray-100 mb-2">{stats.day}</div>
                <p className="text-xs text-purple-400 font-bold tracking-widest uppercase">Acessos Diários</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Gráfico de Tendência (Últimos 30 Dias) */}
              <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] shadow-xl lg:col-span-2 overflow-hidden flex flex-col min-h-[450px]">
                <div className="p-8 border-b border-[#1e293b] flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">Tendência de Acesso</h3>
                    <p className="text-sm text-gray-400 mt-1">Volume de acessos na plataforma nos últimos 30 dias</p>
                  </div>
                </div>
                <div className="p-8 flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#D4AF37', borderRadius: '12px', padding: '12px' }}
                        itemStyle={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '16px' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}
                      />
                      <Bar 
                        dataKey="acessos" 
                        name="Acessos" 
                        fill="#D4AF37" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Usuários */}
              <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-[#1e293b] flex items-center gap-4">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-xl">
                    <Award className="text-[#D4AF37]" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">Líderes de Engajamento</h3>
                    <p className="text-sm text-gray-400 mt-1">Os 10 Irmãos com mais tempo de estudo na plataforma</p>
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
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0
                            ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 
                              idx === 1 ? 'bg-gray-400/20 text-gray-400 border-2 border-gray-400/50' : 
                              idx === 2 ? 'bg-amber-700/20 text-amber-600 border-2 border-amber-700/50' : 
                              'bg-[#0f172a] text-gray-500 border border-[#1e293b]'}`}>
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
                                  `${Math.floor(user.totalStudyTime / 3600)}h ${Math.floor((user.totalStudyTime % 3600) / 60)}m` : 
                                  `${Math.floor((user.totalStudyTime % 3600) / 60)}m`
                              ) : '0m'}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">tempo total</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
