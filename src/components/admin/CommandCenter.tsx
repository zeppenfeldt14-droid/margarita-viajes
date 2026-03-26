import { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  ClipboardList, 
  Hotel as HotelIcon,
  Activity,
  Phone,
  Mail
} from 'lucide-react';
import { 
  FunnelChart,
  Funnel,
  LabelList,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useGlobalData } from '../../context/GlobalContext';
import { formatDateVisual } from '../../utils/helpers';
import { api } from '../../services/api';

export default function CommandCenter() {
  const { quotes, reservations, operations, users } = useGlobalData();
  const [isReady, setIsReady] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeUsersFilter, setActiveUsersFilter] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 200);
    
    const fetchData = async () => {
      try {
        const logsData = await api.getLogs();
        setLogs(Array.isArray(logsData) ? logsData : []);
      } catch (e) {
        console.error('Error fetching logs for radar:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const isUserOnline = (userId: string, alias: string) => {
    const STALE_TIMEOUT = 15 * 60 * 1000;
    const now = new Date().getTime();
    const userLogs = logs.filter(log => 
      (log.user_id === userId || log.user_name === alias || log.alias === alias)
    ).sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());

    if (userLogs.length === 0) return false;
    const lastLog = userLogs[0];
    const lastActivityTime = new Date(lastLog.created_at || lastLog.date).getTime();
    const timeDiff = now - lastActivityTime;
    const action = (lastLog.action_type || lastLog.action || '').toUpperCase();
    if (action.includes('LOGOUT')) return false;
    if (timeDiff > STALE_TIMEOUT) return false;
    return true;
  };

  // 1. Tráfico PAX Hoy (Cerradas/Confirmadas hoy)
  const todayPax = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return (operations || []).filter(op => {
        if (!op.createdAt) return false;
        try {
          const opDate = new Date(op.createdAt).toISOString().split('T')[0];
          return opDate === today && ['Confirmada', 'Venta Cerrada', 'Reserva', 'Venta Concretada'].includes(op.status);
        } catch (e) {
          return false;
        }
      }).reduce((acc, op) => acc + Number(op.pax || 0) + Number(op.children || 0) + Number(op.infants || 0), 0);
    } catch (e) {
      return 0;
    }
  }, [operations]);

  // 2. Alertas Logísticas (Pendientes Críticas)
  const alerts = useMemo(() => {
    const critical = (reservations || []).filter(r => r.status === 'Pendiente').length;
    const pendingTransfers = (operations || []).filter(o => o.includeTransfer && !o.transferProvider).length;
    return { critical, pendingTransfers };
  }, [reservations, operations]);

  // 3. Radar de Staff (Todos los perfiles activos)
  const activeStaff = useMemo(() => (users || []).filter(u => u.active !== false), [users]);

  // 4. Live Feed (Últimas 5 cotizaciones)
  const recentQuotes = useMemo(() => (quotes || []).slice(0, 5), [quotes]);

  // 5. Datos para Gráfico de Embudo (Ficticio para Recharts Funnel o Bar)
  const funnelData = useMemo(() => {
    const qList = quotes || [];
    const rList = reservations || [];
    const oList = operations || [];

    const total = qList.length || 1;
    const attended = qList.filter(q => q.status === 'Atendido').length;
    const booked = rList.length;
    const closed = oList.length;
    
    return [
      { name: 'Leads', value: total, fill: '#6366f1' },
      { name: 'Atendidos', value: attended, fill: '#8b5cf6' },
      { name: 'Reservas', value: booked, fill: '#ec4899' },
      { name: 'Cierres', value: closed, fill: '#f59e0b' }
    ];
  }, [quotes, reservations, operations]);

  // 6. Top Hoteles (Pie Chart)
  const hotelData = useMemo(() => {
    const counts: Record<string, number> = {};
    (operations || []).forEach(op => {
      const hName = op.hotelName || 'Sin Nombre';
      counts[hName] = (counts[hName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);
  }, [operations]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* ROW 1: KPIs Rápidos */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="col-span-1 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group shadow-[#2ECC71]/20"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10">
          <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
            <Users size={20} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0B132B]/60">Operaciones Hoy</h3>
          <p className="text-5xl font-black italic tracking-tighter mt-2">{todayPax}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white uppercase bg-black/10 w-fit px-3 py-1 rounded-full">
             <TrendingUp size={12} /> Tráfico Vivo
          </div>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="col-span-1 md:col-span-2 bg-white/40 backdrop-blur-xl border border-white/50 p-6 rounded-[2.5rem] shadow-xl group hover:border-orange-500/30 transition-all shadow-gray-200/50"
      >
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <div className="bg-orange-100 text-orange-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
               <AlertCircle size={20} />
             </div>
             <div>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0B132B]">Monitor Logístico</h3>
               <p className="text-[10px] font-bold text-gray-400">Estado de la operación en tiempo real</p>
             </div>
           </div>
           <div className="flex gap-2">
             <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-red-100">
               {alerts.critical} CRÍTICOS
             </span>
             <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-orange-100">
               {alerts.pendingTransfers} TRASLADOS PEND.
             </span>
           </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Rendimiento Operativo</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-[#2ECC71]"
                ></motion.div>
              </div>
           </div>
           <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Satisfacción PAX</p>
              <p className="text-lg font-black italic text-teal-600">98.4%</p>
           </div>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="col-span-1 bg-[#0B132B] p-6 rounded-[2.5rem] text-white shadow-xl group shadow-black/20"
      >
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
          <Activity size={14} className="text-[#8DC63F]" /> Radar de Staff
        </h3>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {activeStaff.map((u, i) => {
            const online = isUserOnline(u.id, u.alias);
            return (
              <div key={i} className="flex items-center gap-3 group/staff hover:translate-x-1 transition-transform">
                <div role="img" aria-label="avatar" className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] uppercase border transition-all ${
                  online ? 'bg-white/10 text-[#8DC63F] border-[#8DC63F]/20' : 'bg-white/5 text-gray-600 border-white/5'
                }`}>
                  {u.alias?.substring(0, 2) || "AS"}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${online ? 'text-white' : 'text-gray-500'}`}>{u.alias}</span>
                  <span className={`text-[8px] font-bold flex items-center gap-1 uppercase ${online ? 'text-[#8DC63F]' : 'text-gray-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-[#8DC63F] animate-pulse shadow-[0_0_8px_rgba(141,198,63,0.8)]' : 'bg-gray-700'}`}></div> 
                    {online ? 'En vivo' : 'Desconectado'}
                  </span>
                </div>
              </div>
            );
          })}
          {activeStaff.length === 0 && <p className="text-[9px] text-gray-500 italic">No hay staff registrado</p>}
        </div>
        <button className="w-full py-2 bg-white/5 hover:bg-[#F39200]/20 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all mt-4 text-gray-400 border border-white/5 hover:text-white">
          Canal Interno
        </button>
      </motion.div>

      {/* NUEVO: CONTACTO RÁPIDO */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="col-span-1 md:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 group"
      >
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
          <Mail size={14} className="text-[#F39C12]" /> Contacto Rápido
        </h3>
        <div className="space-y-4">
          {(quotes || []).slice(0, 2).map((q, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between group/item hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-[#0B132B] truncate max-w-[80px]">{q.clientName || q.client_name}</span>
                 <span className="text-[8px] font-bold text-gray-400 uppercase">{q.id}</span>
               </div>
               <div className="flex gap-1">
                 <button 
                  onClick={async () => {
                    const recipient = q.email || q.client_email;
                    if (!recipient) return alert('Sin email');
                    window.location.href = `mailto:${recipient}?subject=Seguimiento Cotización ${q.id}`;
                  }}
                  className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                 >
                   <Mail size={12} />
                 </button>
                 <button 
                  onClick={() => {
                    const phone = q.whatsapp || q.client_phone || '';
                    if (!phone) return alert('Sin teléfono');
                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=Hola, te contacto de Margarita Viajes por tu cotización ${q.id}`, '_blank');
                  }}
                  className="w-8 h-8 bg-white text-green-600 rounded-lg flex items-center justify-center shadow-sm hover:bg-green-600 hover:text-white transition-all"
                 >
                   <Phone size={12} />
                 </button>
               </div>
            </div>
          ))}
          {quotes.length === 0 && <p className="text-[9px] text-gray-400 text-center py-4 font-bold uppercase italic tracking-widest">Sin leads recientes</p>}
        </div>
      </motion.div>

      {/* ROW 2: Live Feed y Embudo */}
      <div className="col-span-1 md:col-span-2 bg-white/40 backdrop-blur-xl border border-white/50 p-8 rounded-[2.5rem] shadow-xl">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xs font-black text-[#0B132B] uppercase tracking-widest flex items-center gap-2">
             <ClipboardList size={16} className="text-[#F39C12]" /> Feed de Cotizaciones en Vivo
           </h3>
           <span className="text-[9px] font-black text-[#F39C12] uppercase tracking-widest animate-pulse">Live Updates</span>
        </div>
        <div className="space-y-4">
          {recentQuotes.map((q, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={q.id} 
              className="flex items-center justify-between p-4 bg-white/50 rounded-2xl hover:bg-white/80 transition-all border border-transparent hover:border-indigo-100 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl text-[10px] font-black italic text-[#F39C12] shadow-sm group-hover:bg-[#F39C12] group-hover:text-white transition-colors">
                  {q.id}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase text-[#0B132B]">{q.clientName || q.client_name}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{q.hotelName || q.hotel_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[10px] font-black text-[#0B132B]">$ {Number(q.totalAmount || 0).toLocaleString()}</p>
                   <p className="text-[8px] font-bold text-gray-400 uppercase">{formatDateVisual(q.date)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                  q.status === 'Nuevo' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {q.status}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 bg-white/40 backdrop-blur-xl border border-white/50 p-8 rounded-[2.5rem] shadow-xl h-[400px] flex flex-col hover:shadow-2xl transition-shadow">
         <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest mb-8 flex items-center gap-2">
           <TrendingUp size={16} className="text-[#8DC63F]" /> Embudo de Conversión (Lead to Sale)
         </h3>
           <div className="w-full h-[350px] min-w-[300px] min-h-[350px] overflow-hidden" style={{ position: 'relative' }}>
             {isReady && funnelData.length > 0 ? (
               <ResponsiveContainer width="99%" aspect={2} minWidth={100} minHeight={100} debounce={200}>
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 50 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#1A1A1A' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 10, 10, 0]} 
                    barSize={30}
                    animationDuration={2000}
                  >
                    {funnelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#F39200' : '#8DC63F'} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="flex items-center justify-center h-full text-[10px] font-black uppercase text-gray-400">Cargando métricas...</div>
           )}
         </div>
      </div>

      {/* ROW 3: Top Hoteles */}
      <div className="col-span-1 md:col-span-4 bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8">
         <div className="flex-1">
            <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest mb-2 flex items-center gap-2">
              <HotelIcon size={16} className="text-[#F39200]" /> Top Servicios y Hoteles
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Volumen de ventas por propiedad</p>
            <div className="space-y-4">
              {hotelData.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#F39200] font-black text-xs">
                        {i + 1}
                      </div>
                      <span className="text-xs font-black uppercase text-[#1A1A1A]">{h.name}</span>
                   </div>
                   <span className="text-xs font-black italic text-[#8DC63F]">{h.value} Ventas</span>
                </div>
              ))}
            </div>
         </div>
          <div className="w-full h-[300px] min-w-[300px] min-h-[300px] overflow-hidden bg-[#1A1A1A]/5 rounded-[2.5rem] p-4 flex items-center justify-center" style={{ position: 'relative' }}>
            {isReady && hotelData.length > 0 ? (
              <ResponsiveContainer width="99%" aspect={2} minWidth={100} minHeight={100} debounce={200}>
                 <FunnelChart>
                   <Tooltip 
                     contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#1A1A1A', color: '#fff', fontSize: '10px' }} 
                     itemStyle={{ color: '#fff' }}
                   />
                   <defs>
                     <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#1A1A1A" stopOpacity={1}/>
                       <stop offset="100%" stopColor="#1A1A1A" stopOpacity={0.4}/>
                     </linearGradient>
                   </defs>
                   <Funnel
                     data={hotelData}
                     dataKey="value"
                     isAnimationActive
                   >
                     <LabelList position="right" fill="#1A1A1A" stroke="none" dataKey="name" fontSize={10} fontWeight="black" />
                     {hotelData.map((_, index) => (
                       <Cell 
                        key={`cell-${index}`} 
                        fill="url(#funnelGradient)" 
                        opacity={1 - (index * 0.15)}
                       />
                     ))}
                   </Funnel>
                 </FunnelChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-[10px] font-black uppercase text-gray-400">Generando Radar...</div>
            )}
          </div>
      </div>
      
    </div>
  );
}
