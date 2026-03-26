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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-120px)] flex flex-col">
      {/* Bloque Unificado de Cabecera (v52) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SectionTitle className="mb-0">Base de Clientes (CRM)</SectionTitle>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 border-2 border-transparent px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#0B132B] focus:bg-white cursor-pointer transition-all"
            >
              <option value="all">TODOS LOS ESTADOS</option>
              <option value="Nuevo">NUEVOS</option>
              <option value="Atendido">SEGUIMIENTO</option>
              <option value="Confirmada">CLIENTES VIP</option>
            </select>

            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Nombre o email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="bg-gray-50 border-2 border-transparent rounded-xl pl-11 pr-4 py-3 text-[10px] font-bold uppercase outline-none focus:border-[#0B132B] focus:bg-white w-full md:w-[200px] transition-all" 
              />
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-gray-50 border-2 border-transparent px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#0B132B] focus:bg-white cursor-pointer transition-all"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenedor de Tabla con Scroll y Sticky Header (v52) */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-white">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="py-5 px-8 border-b border-gray-100 bg-white">CLIENTE / CONTACTO</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white">HOTEL DE INTERÉS</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white">FECHA DE VIAJE</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white">ESTADO</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold uppercase transition-all">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => (
                  <tr key={idx} className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-8">
                      <div className="flex flex-col">
                        <span className="font-black italic text-[#0B132B] text-[11px] leading-tight mb-1">
                          {c.clientName || c.client_name || 'Sin Nombre'}
                        </span>
                        <span className="text-[9px] text-gray-400 lowercase font-medium">
                          {c.email} • {c.whatsapp || 'Sin tlf'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-8 text-[10px] text-gray-500 font-black truncate max-w-[200px]">
                      {c.hotelName || c.hotel_name}
                    </td>
                    <td className="py-4 px-8 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-600">
                        <Calendar size={12} className="text-orange-200" />
                        {c.checkIn ? new Date(c.checkIn).toLocaleDateString('es-ES') : 'S/F'}
                      </div>
                    </td>
                    <td className="py-4 px-8">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${
                        c.status === 'Nuevo' ? 'bg-red-500' : 
                        c.status === 'Atendido' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                          className="bg-[#0B132B] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-md"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE HISTORIAL DEL CLIENTE (Mantenemos lógica modal) */}
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
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {selectedClientHistory.map((h, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
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
