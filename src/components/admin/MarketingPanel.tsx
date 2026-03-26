import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Clock, CheckCircle, History, X, Edit3, Trash2, Save, Globe, Smartphone, Navigation } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { Card, SectionTitle } from './Common';
import { showToast } from '../Toast';
import api from '../../services/api';

interface MarketingProps {
  quotes: any[];
  config?: any;
}

export default function MarketingPanel({ quotes, config }: MarketingProps) {
  const [coupon, setCoupon] = useState(config?.activeCoupon || { code: '', discount: '', expiry: '' });
  const [waTemplate, setWaTemplate] = useState(config?.waTemplate || "Hola {{name}}, vimos que estabas interesado en {{hotel}}. ¡Tengo un descuento especial para ti!");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedDetailCoupon, setSelectedDetailCoupon] = useState<any>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    loadCoupons();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await api.getMarketingAnalytics();
      setAnalytics(data);
    } catch (err) {}
    setLoadingAnalytics(false);
  };

  const loadCoupons = async () => {
    try {
      const data = await api.getAdminCoupons();
      setCoupons(data || []);
    } catch (e) {
      console.error('Error loading coupons:', e);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const coldQuotes = (quotes || []).filter(q => {
    if (['Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(q.status)) return false;
    const quoteDate = new Date(q.date || new Date());
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return quoteDate < threeDaysAgo;
  });

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 ${loadingAnalytics ? 'opacity-50' : ''}`}>
      <SectionTitle>Marketing y Fidelización</SectionTitle>

      {/* Analítica de Marketing v55 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Globe size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tráfico Total</p>
            <p className="text-2xl font-black italic text-[#0B132B]">{analytics?.totalTraffic || '0'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><Smartphone size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Traffic</p>
            <p className="text-2xl font-black italic text-[#0B132B]">{analytics?.mobilePercent || '0'}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><Navigation size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drop-off Rate</p>
            <p className="text-2xl font-black italic text-[#0B132B]">{analytics?.dropOffRate || '0'}%</p>
          </div>
        </div>
      </div>
      
      {/* Analítica Visual v56 - Gráficos Inquebrantables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl border-none ring-1 ring-gray-100 h-[480px] flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Navigation size={16} />
            </div>
            <h3 className="text-xs font-black text-[#0B132B] uppercase tracking-widest">Embudo de Conversión</h3>
          </div>
           <div style={{ width: '100%', height: '350px', minHeight: '350px', position: 'relative' }}>
             {analytics?.conversionFunnel?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                 <BarChart data={analytics.conversionFunnel} layout="vertical" margin={{ left: 20, right: 30 }}>
                   <XAxis type="number" hide />
                   <YAxis 
                     dataKey="name" 
                     type="category" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontSize: 10, fontWeight: 900, fill: '#6B7280' }} 
                     width={80}
                   />
                   <Tooltip 
                     cursor={{ fill: '#F9FAFB' }}
                     contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px' }}
                   />
                   <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                     {analytics.conversionFunnel.map((_: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'][index % 4]} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-[10px] font-black uppercase text-gray-400">Sin datos de embudo</div>
             )}
           </div>
        </Card>

        <Card className="shadow-xl border-none ring-1 ring-gray-100 h-[480px] flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <Globe size={16} />
            </div>
            <h3 className="text-xs font-black text-[#0B132B] uppercase tracking-widest">Fuentes de Tráfico</h3>
          </div>
           <div style={{ width: '100%', height: '350px', minHeight: '350px', position: 'relative' }}>
             {analytics?.trafficBySource?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                 <PieChart>
                   <Pie
                     data={analytics.trafficBySource}
                     innerRadius={70}
                     outerRadius={110}
                     paddingAngle={8}
                     dataKey="value"
                     animationBegin={200}
                   >
                     {analytics.trafficBySource.map((_: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-[10px] font-black uppercase text-gray-400">Sin datos de tráfico</div>
             )}
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUMNA 1: CREACIÓN Y LISTA */}
        <div className="space-y-8">
          <Card className="shadow-xl border-none ring-1 ring-gray-100">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0B132B]">Crear Cupón</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Descuentos públicos</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CÓDIGO DE DESCUENTO</label>
                <input 
                  type="text" 
                  placeholder="EJ: MARGARITA2026" 
                  value={coupon.code} 
                  onChange={(e: any) => setCoupon({...coupon, code: e.target.value.toUpperCase()})} 
                  className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 uppercase" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">PORCENTAJE (%)</label>
                  <input 
                    type="number" 
                    placeholder="10" 
                    value={coupon.discount} 
                    onChange={(e: any) => setCoupon({...coupon, discount: e.target.value})} 
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">EXPIRACIÓN</label>
                  <input 
                    type="date" 
                    value={coupon.expiry} 
                    onChange={(e: any) => setCoupon({...coupon, expiry: e.target.value})} 
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20" 
                  />
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (!coupon.code || !coupon.discount || !coupon.expiry) {
                    showToast('Por favor completa todos los campos', 'error');
                    return;
                  }
                  
                  try {
                    await api.saveCoupon({ ...coupon, active: true });
                    loadCoupons();
                    showToast('Cupón activado exitosamente', 'success');
                    setCoupon({ code: '', discount: '', expiry: '' });
                  } catch (e) {
                    console.error('Error:', e);
                    showToast('Error al activar cupón', 'error');
                  }
                }} 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95"
              >
                Activar Cupón
              </button>
            </div>
          </Card>

          {/* VISTA DE GESTIÓN DE CUPONES */}
          <Card className="shadow-xl border-none ring-1 ring-gray-100">
            <div className="space-y-8">
              {/* ACTIVOS */}
              <div className="pb-6 border-b border-gray-100">
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-green-600 tracking-widest mb-4">
                  <CheckCircle size={14} /> Cupones Activos
                </h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 text-scrollbar">
                  {coupons.filter(c => c.active && c.expiry >= today).length === 0 ? (
                    <p className="text-[9px] text-gray-400 font-bold italic">No hay cupones activos</p>
                  ) : (
                    coupons.filter(c => c.active && c.expiry >= today).map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100">
                        <span className="text-[10px] font-black text-green-700 italic uppercase">{c.code} ({c.discount}%)</span>
                        <button onClick={() => setSelectedDetailCoupon(c)} className="text-[8px] font-black uppercase text-green-600 hover:text-green-800 underline decoration-2 transition-colors">Detalles</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* VENCIDOS */}
              <div className="pb-6 border-b border-gray-100">
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 tracking-widest mb-4">
                  <Clock size={14} /> Vencidos
                </h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 text-scrollbar">
                  {coupons.filter(c => c.expiry < today).length === 0 ? (
                    <p className="text-[9px] text-gray-400 font-bold italic">No hay cupones vencidos</p>
                  ) : (
                    coupons.filter(c => c.expiry < today).map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                        <span className="text-[10px] font-black text-red-700 italic uppercase">{c.code} ({c.discount}%)</span>
                        <button onClick={() => setSelectedDetailCoupon(c)} className="text-[8px] font-black uppercase text-red-500 hover:text-red-700 underline decoration-2 transition-colors">Detalles</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* APLICADOS/INACTIVOS */}
              <div>
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 tracking-widest mb-4">
                  <History size={14} /> Aplicados / Inactivos
                </h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 text-scrollbar">
                  {coupons.filter(c => !c.active).length === 0 ? (
                    <p className="text-[9px] text-gray-400 font-bold italic">Sin historial</p>
                  ) : (
                    coupons.filter(c => !c.active).map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <span className="text-[10px] font-black text-blue-700 italic uppercase">{c.code} ({c.discount}%)</span>
                        <button onClick={() => setSelectedDetailCoupon(c)} className="text-[8px] font-black uppercase text-blue-500 hover:text-blue-700 underline decoration-2 transition-colors">Detalles</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA 2: RECUPERADOR */}
        <Card className="shadow-xl border-none ring-1 ring-gray-100">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[#0B132B]">Recuperador de Ventas</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Leads fríos (+3 días)</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium mb-4 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            El sistema detecta automáticamente cotizaciones con más de 3 días sin cerrar para que puedas enviarles ofertas de rescate.
          </p>
          <div className="mb-6 space-y-2">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Plantilla de Mensaje</label>
            <textarea 
              value={waTemplate}
              onChange={(e) => setWaTemplate(e.target.value)}
              className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[60px] resize-none"
              placeholder="Usa {{name}} y {{hotel}} para campos dinámicos"
            />
          </div>
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 text-scrollbar">
            {coldQuotes.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-[10px] font-black tracking-widest uppercase bg-gray-50 rounded-2xl">Sin leads fríos pendientes</p>
            ) : (
              coldQuotes.map((q: any) => (
                <div key={q.id} className="p-6 bg-white rounded-2xl border-2 border-gray-50 space-y-5 hover:border-orange-200 transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-[#0B132B] uppercase text-sm italic">{q.clientName || q.client_name}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{q.hotelName || q.hotel_name}</p>
                    </div>
                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                      {Math.floor((new Date().getTime() - new Date(q.date || new Date()).getTime()) / (1000*60*60*24))} DÍAS
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => {
                      const msg = waTemplate
                        .replace('{{name}}', q.clientName || q.client_name || '')
                        .replace('{{hotel}}', q.hotelName || q.hotel_name || '');
                      window.open(`https://wa.me/${q.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
                    }} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-md">WHATSAPP</button>
                    <button className="flex-1 bg-[#0B132B] text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md">VER FICHA</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* MODAL DETALLE DE CUPÓN */}
      {selectedDetailCoupon && (
        <div className="fixed inset-0 bg-[#0B132B]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300 relative border border-white/20">
            <div className="absolute top-8 right-8 flex gap-2">
              {!isEditingDetail ? (
                <button 
                  onClick={() => {
                    setIsEditingDetail(true);
                    setEditCoupon({ ...selectedDetailCoupon });
                  }} 
                  className="text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 p-2 rounded-xl"
                  title="Editar"
                >
                  <Edit3 size={20} />
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditingDetail(false)} 
                  className="text-gray-400 hover:text-orange-500 transition-colors bg-gray-50 p-2 rounded-xl"
                  title="Cancelar"
                >
                  <X size={20} />
                </button>
              )}
              <button 
                onClick={() => {
                  setSelectedDetailCoupon(null);
                  setIsEditingDetail(false);
                }} 
                className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-xl"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-sm font-black uppercase text-[#0B132B] italic tracking-tighter mb-8 border-b border-gray-100 pb-4">
              {isEditingDetail ? 'Editar Cupón' : 'Detalle del Cupón'}
            </h3>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                {!isEditingDetail ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">CÓDIGO</p>
                      <p className="text-lg font-black italic text-orange-600 uppercase leading-none">{selectedDetailCoupon.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">DCTO</p>
                      <p className="text-lg font-black italic text-[#0B132B] leading-none">{selectedDetailCoupon.discount}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">CÓDIGO</label>
                      <input 
                        type="text" 
                        value={editCoupon.code} 
                        onChange={(e) => setEditCoupon({...editCoupon, code: e.target.value.toUpperCase()})}
                        className="w-full bg-white border-none px-4 py-2 rounded-xl text-sm font-bold outline-none ring-1 ring-gray-200 focus:ring-orange-500/20 uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">DESCUENTO (%)</label>
                      <input 
                        type="number" 
                        value={editCoupon.discount} 
                        onChange={(e) => setEditCoupon({...editCoupon, discount: e.target.value})}
                        className="w-full bg-white border-none px-4 py-2 rounded-xl text-sm font-bold outline-none ring-1 ring-gray-200 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">ESTADO</p>
                  <p className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${selectedDetailCoupon.expiry < today ? 'text-red-500' : (selectedDetailCoupon.active ? 'text-green-600' : 'text-blue-500')}`}>
                    <small className={`w-2 h-2 rounded-full ${selectedDetailCoupon.expiry < today ? 'bg-red-500' : (selectedDetailCoupon.active ? 'bg-green-600' : 'bg-blue-500')}`}></small>
                    {selectedDetailCoupon.expiry < today ? 'Vencido' : (selectedDetailCoupon.active ? 'Activo' : 'Aplicado')}
                  </p>
                </div>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">EXPIRACIÓN</p>
                  {!isEditingDetail ? (
                    <p className="text-[10px] font-black text-[#0B132B]">{selectedDetailCoupon.expiry || 'S/F'}</p>
                  ) : (
                    <input 
                      type="date" 
                      value={editCoupon.expiry} 
                      onChange={(e) => setEditCoupon({...editCoupon, expiry: e.target.value})}
                      className="w-full bg-white border-none px-2 py-1 rounded-lg text-[10px] font-bold outline-none ring-1 ring-gray-200 focus:ring-orange-500/20"
                    />
                  )}
                </div>
              </div>

              <div className="pt-4 space-y-3">
                {isEditingDetail ? (
                  <button 
                    onClick={async () => {
                      try {
                        await api.saveCoupon(editCoupon); // API handles ID
                        loadCoupons();
                        setSelectedDetailCoupon(null);
                        setIsEditingDetail(false);
                        showToast('Cambios guardados', 'success');
                      } catch (e) {
                        console.error(e);
                        showToast('Error al guardar', 'error');
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Guardar Cambios
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={async () => {
                        try {
                          const updated = { ...selectedDetailCoupon, active: !selectedDetailCoupon.active };
                          await api.saveCoupon(updated);
                          loadCoupons();
                          setSelectedDetailCoupon(null);
                          showToast('Estado actualizado', 'success');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${selectedDetailCoupon.active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}
                    >
                      {selectedDetailCoupon.active ? 'Desactivar Cupón' : 'Reactivar Cupón'}
                    </button>
                    
                    <button 
                      onClick={async () => {
                        if (!window.confirm('¿Estás seguro de que deseas eliminar este cupón permanentemente?')) return;
                        
                        try {
                          await api.deleteCoupon(selectedDetailCoupon.id);
                          loadCoupons();
                          setSelectedDetailCoupon(null);
                          showToast('Cupón eliminado', 'success');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full bg-gray-50 text-gray-400 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Eliminar Cupón
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
