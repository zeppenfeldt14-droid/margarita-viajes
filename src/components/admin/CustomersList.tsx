import { useState } from 'react';
import { SectionTitle } from './Common';
import { Search, Mail, Eye, X, Calendar, User } from 'lucide-react';

export default function CustomersList({ quotes }: { quotes: any[] }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedClientHistory, setSelectedClientHistory] = useState<any[] | null>(null);

  const MONTHS = [
    { value: 'all', label: 'Todos los Meses' },
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' }
  ];

  const safeQuotes = quotes || [];
  
  // Agrupar por cliente para evitar duplicados en la lista principal (mostrar el más reciente)
  const clientsMap = new Map();
  safeQuotes.forEach(q => {
    const email = (q.email || '').toLowerCase();
    if (!email) return;
    const qDate = new Date(q.checkIn || q.check_in || q.date || 0);
    const existing = clientsMap.get(email);
    const existingDate = existing ? new Date(existing.checkIn || existing.check_in || existing.date || 0) : new Date(0);

    if (!existing || qDate > existingDate) {
      clientsMap.set(email, q);
    }
  });

  const filteredCustomers = Array.from(clientsMap.values()).filter(c => {
    // Filtro de Estado
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;

    // Filtro de Búsqueda
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (c.clientName?.toLowerCase().includes(searchLower)) ||
      (c.client_name?.toLowerCase().includes(searchLower)) ||
      (c.email?.toLowerCase().includes(searchLower));
    
    if (!matchesSearch) return false;

    // Filtro de Mes
    if (selectedMonth !== 'all') {
      const dateStr = c.checkIn || c.check_in || c.date;
      if (!dateStr) return false;
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime()) || dateObj.getMonth() !== selectedMonth) return false;
    }

    return true;
  });

  const openHistory = (email: string) => {
    const history = safeQuotes.filter(q => (q.email || '').toLowerCase() === email.toLowerCase())
      .sort((a, b) => {
        const da = new Date(a.checkIn || a.check_in || a.date || 0).getTime();
        const db = new Date(b.checkIn || b.check_in || b.date || 0).getTime();
        return db - da;
      });
    setSelectedClientHistory(history);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionTitle>Base de Clientes (CRM)</SectionTitle>
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-wrap flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border-2 border-transparent px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-500 focus:bg-white cursor-pointer transition-all"
          >
            <option value="all">TODOS LOS ESTADOS</option>
            <option value="Nuevo">NUEVOS</option>
            <option value="Atendido">SEGUIMIENTO</option>
            <option value="Confirmada">CLIENTES VIP</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-gray-50 border-2 border-transparent px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-500 focus:bg-white cursor-pointer transition-all"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-[#0B132B] uppercase tracking-[0.2em] border-b border-gray-100 bg-gray-50/50">
                <th className="py-6 px-8">Cliente / Contacto</th>
                <th className="py-6 px-8">Hotel de Interés</th>
                <th className="py-6 px-8">Fecha de Viaje</th>
                <th className="py-6 px-8">Estado</th>
                <th className="py-6 px-8 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest">No hay clientes en esta categoría</td></tr>
              ) : (
                filteredCustomers.map((c, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                    <td className="py-5 px-8"><div className="flex flex-col"><span className="font-black italic uppercase text-[#0B132B]">{c.clientName || c.client_name || 'Sin Nombre'}</span><span className="text-[10px] text-gray-500 uppercase mt-1">{c.email} • {c.whatsapp || 'Sin tlf'}</span></div></td>
                    <td className="py-5 px-8 text-[11px] text-[#0B132B] uppercase">{c.hotelName || c.hotel_name}</td>
                    <td className="py-5 px-8 text-[10px] font-black uppercase text-orange-600">{c.checkIn ? new Date(c.checkIn).toLocaleDateString('es-ES') : 'S/F'}</td>
                    <td className="py-5 px-8"><span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${c.status === 'Nuevo' ? 'bg-red-500' : c.status === 'Atendido' ? 'bg-yellow-500' : 'bg-green-500'}`}>{c.status}</span></td>
                    <td className="py-5 px-8 text-right flex items-center justify-end gap-2">
                      <a 
                        href={`mailto:${c.email}?subject=Información Margarita Viajes&body=Hola ${c.clientName || c.client_name},`}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Enviar Correo"
                      >
                        <Mail size={14} />
                      </a>
                      <button 
                        onClick={() => openHistory(c.email)}
                        className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                        title="Ver Historial"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => window.open(`https://wa.me/${c.whatsapp}?text=Hola ${c.clientName || c.client_name}, te escribo de Margarita Viajes!`, '_blank')} 
                        className="bg-[#0B132B] text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-md"
                      >
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE HISTORIAL DEL CLIENTE */}
      {selectedClientHistory && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black italic text-[#0B132B] uppercase">Historial del Cliente</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{selectedClientHistory[0]?.clientName || selectedClientHistory[0]?.client_name} • {selectedClientHistory[0]?.email}</p>
              </div>
              <button onClick={() => setSelectedClientHistory(null)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {selectedClientHistory.map((h, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-600 italic">#{h.id || h.quoteId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${h.status === 'Confirmada' || h.status === 'Venta Cerrada' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{h.status}</span>
                    </div>
                    <p className="text-xs font-black text-[#0B132B] uppercase">{h.hotelName || h.hotel_name}</p>
                    <div className="flex items-center gap-3 text-[9px] text-gray-400 font-bold uppercase">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {h.checkIn ? new Date(h.checkIn).toLocaleDateString() : 'S/F'}</span>
                      <span>•</span>
                      <span>$ {h.totalAmount || h.total_amount || 0}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <User size={16} className="text-gray-200 ml-auto mb-1" />
                    <p className="text-[8px] font-black text-gray-300 uppercase">Cotizado por</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase">{h.assignedTo || 'Agente'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
