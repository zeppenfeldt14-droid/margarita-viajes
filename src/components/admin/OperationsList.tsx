import { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, AlertCircle, Briefcase, Users, X, Search, Printer, Eye, Download } from 'lucide-react';
import { api } from '../../services/api';
import { showToast } from '../Toast';
import { Card, SectionTitle } from './Common';
import { formatDateVisual } from '../../utils/helpers';
import type { Operation, ReservationStatus } from '../../types';

export default function OperationsList({
  selectedOperation,
  setSelectedOperation,
  opFilter,
  setOpFilter,
  isDataMaster,
  userAlias,
  users,
  config
}: {
  selectedOperation: Operation | null;
  setSelectedOperation: (op: Operation | null) => void;
  opFilter: 'pendientes' | 'activas' | 'historial' | 'todas';
  setOpFilter: (f: 'pendientes' | 'activas' | 'historial' | 'todas') => void;
  isDataMaster?: boolean;
  userAlias?: string | null;
  users?: any[];
  config?: any;
}) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);

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

  const fetchOperations = async () => {
    try {
      const data = await api.getOperations();
      setOperations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching operations:', error);
      setError("Error al cargar las operaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    api.getTransfers().then(setTransfers).catch(console.error);
  }, []);

  const downloadReport = () => {
    const filtered = operations.filter((op: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkOutDate = op?.checkOut ? new Date(op.checkOut) : null;
      const isPast = checkOutDate && checkOutDate < today;
      const isClosed = op?.status === 'Completada' || op?.status === 'Liquidada';

      if (opFilter === 'pendientes') {
        const isIncompleteTransfer = op.includeTransfer && (!op.itinerary || !op.transferProvider);
        if (op.status !== 'Pendiente' && !isIncompleteTransfer) return false;
        if (isPast) return false;
      } else if (opFilter === 'activas') {
        const isIncompleteTransfer = op.includeTransfer && (!op.itinerary || !op.transferProvider);
        if (op.status === 'Pendiente' || isIncompleteTransfer || isClosed || isPast) return false;
      } else if (opFilter === 'historial') {
        if (!isClosed && !isPast) return false;
      }

      if (selectedMonth !== 'all') {
        const checkInDate = op?.checkIn ? new Date(op.checkIn) : null;
        if (!checkInDate || checkInDate.getMonth() !== selectedMonth) return false;
      }

      return true;
    });

    const headers = ['Folio', 'Cliente', 'Hotel', 'CheckIn', 'CheckOut', 'Estado', 'Itinerario', 'Proveedor'];
    const rows = filtered.map(op => [
      op?.id,
      op?.clientName,
      op?.hotelName,
      op?.checkIn,
      op?.checkOut,
      op?.status,
      (op?.itinerary || '').replace(/,/g, ';'),
      op?.transferProvider || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_operaciones_${opFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="print-hidden space-y-8">
        <SectionTitle>Ventas (Operaciones)</SectionTitle>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex gap-2">
          {(['pendientes', 'activas', 'historial', 'todas'] as const).map(f => (
            <button key={f} onClick={() => setOpFilter(f)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${opFilter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 text-gray-400 hover:text-blue-600 border border-transparent'}`}>
              {f === 'pendientes' ? 'Ventas Pendientes' : f === 'activas' ? 'Ventas Activas' : f === 'historial' ? 'Historial' : 'Ver Todas'}
            </button>
          ))}
        </div>

        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por cliente, folio o hotel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-gray-50 border-2 border-transparent px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition-all"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <button onClick={downloadReport} className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-500/20">
            <Search size={14} /> Reporte
          </button>
        </div>
      </div>

      {loading ? (
        <Card><div className="text-center py-20">Cargando...</div></Card>
      ) : error ? (
        <Card>
          <div className="text-center py-20 text-red-500">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        </Card>
      ) : operations.length === 0 ? (
        <Card>
          <div className="text-center py-20 text-gray-400">
            <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm font-bold">No hay operaciones registradas</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="pb-6 px-4">FOLIO</th>
                  <th className="pb-6 px-4">CLIENTE</th>
                  <th className="pb-6 px-4">HOTEL</th>
                  <th className="pb-6 px-4">FECHAS</th>
                  <th className="pb-6 px-4 text-center">PASAJEROS</th>
                  <th className="pb-6 px-4">ESTADO</th>
                  <th className="pb-6 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold">
                {(operations || [])
                  .filter((op: Operation) => {
                    // Lógica de Historial: por estado o por fecha pasada
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkOutDate = op?.checkOut ? new Date(op.checkOut) : null;
                    const isPast = checkOutDate && checkOutDate < today;
                    const isClosed = op?.status === 'Completada' || op?.status === 'Liquidada';

                    // Filtro de pestaña
                    if (opFilter === 'pendientes') {
                      const isIncompleteTransfer = op?.includeTransfer && (!op?.itinerary || !op?.transferProvider);
                      if (op?.status !== 'Pendiente' && !isIncompleteTransfer) return false;
                      if (isPast) return false;
                    } else if (opFilter === 'activas') {
                      const isIncompleteTransfer = op?.includeTransfer && (!op?.itinerary || !op?.transferProvider);
                      if (op?.status === 'Pendiente' || isIncompleteTransfer || isClosed || isPast) return false;
                    } else if (opFilter === 'historial') {
                      if (!isClosed && !isPast) return false;
                    }

                    // Filtro de búsqueda (Nombre, Folio o Hotel)
                    const searchLower = searchTerm.toLowerCase();
                    const matchesSearch = !searchTerm || 
                      (op.clientName?.toLowerCase().includes(searchLower)) ||
                      (op.id?.toLowerCase().includes(searchLower)) ||
                      (op.quoteId?.toLowerCase().includes(searchLower)) ||
                      (op.hotelName?.toLowerCase().includes(searchLower));
                    
                    if (!matchesSearch) return false;

                    // Filtro de Mes (basado en checkIn)
                    if (selectedMonth !== 'all') {
                      const checkInDate = op?.checkIn ? new Date(op.checkIn) : null;
                      if (!checkInDate || checkInDate.getMonth() !== selectedMonth) return false;
                    }

                    // Restricción de visibilidad por nivel (RBAC)
                    if (!isDataMaster) {
                      // Operaciones asignadas específicamente a este asesor O sin asignar
                      const isAssignedToMe = op.assignedTo === userAlias;
                      const isUnassigned = !op.assignedTo || op.assignedTo === '';
                      if (!isAssignedToMe && !isUnassigned) return false;
                    }

                    return true;
                  })
                  .sort((a, b) => {
                    const dateA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
                    const dateB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
                    return dateA - dateB;
                  })
                  .map(op => (
                    <tr key={op?.id || Math.random()} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-4"><div className="flex flex-col"><span className="font-black italic text-blue-600">{op?.id || 'S/F'}</span><span className="text-[8px] text-gray-400 font-bold uppercase">Ref: {op?.quoteId}</span></div></td>
                      <td className="py-5 px-4"><div className="flex flex-col"><span className="font-black italic uppercase text-[#0B132B]">{op?.clientName || 'Sin Nombre'}</span><span className="text-[9px] text-gray-400 uppercase font-bold">{op?.email || 'Sin Email'}</span></div></td>
                      <td className="py-5 px-4 text-[10px] font-bold text-[#0B132B]">{op?.hotelName || 'Sin Hotel'}</td>
                      <td className="py-5 px-4 text-[10px] font-black uppercase"><div className="flex items-center gap-1"><Calendar size={10} className="text-blue-500" /> {formatDateVisual(op?.checkIn || 'S/F')}</div><div className="flex items-center gap-1 opacity-50"><Calendar size={10} /> {formatDateVisual(op?.checkOut || 'S/F')}</div></td>
                      <td className="py-5 px-4 text-center text-[10px]">{op?.companions?.length || 0}</td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-4 py-1.2 rounded-full text-[8px] font-black uppercase tracking-widest text-center ${
                            ['Confirmada', 'Venta Cerrada', 'Venta Concretada'].includes(op?.status || '') ? 'bg-green-500 text-white' :
                            op?.status === 'Reserva' ? 'bg-blue-500 text-white' :
                            'bg-blue-400 text-white'
                          }`}>
                            {op?.status || 'Pendiente'}
                          </span>
                          
                          {/* BADGES OPERATIVOS */}
                          <div className="flex flex-wrap gap-1 justify-center mt-1">
                            {(() => {
                              const checkIn = op.checkIn ? new Date(op.checkIn) : null;
                              if (checkIn) {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(0,0,0,0);
                                const checkInDay = new Date(checkIn);
                                checkInDay.setHours(0,0,0,0);
                                if (checkInDay.getTime() === tomorrow.getTime()) {
                                  return <span className="px-2 py-0.5 bg-red-500 text-white text-[7px] font-black rounded uppercase animate-pulse">Entrada Mañana</span>;
                                }
                              }
                              return null;
                            })()}
                            {op.includeTransfer && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[7px] font-black rounded uppercase">Traslado Activo</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <button onClick={() => setSelectedOperation(op)} className="bg-[#0B132B] text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">VER</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </div>

      {selectedOperation && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:block">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 print-card print:rounded-none print:max-h-none print:shadow-none print:w-full print:block">

            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 print-hidden">
              <div>
                <h3 className="text-2xl font-black italic text-[#0B132B] uppercase tracking-tighter">Detalles de Operación</h3>
                <div className="flex flex-col gap-0.5 mt-1">
                  <p className="text-sm font-black text-[#0B132B] uppercase">FOLIO VENTA: {selectedOperation?.id || 'S/F'}</p>
                  {isDataMaster ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Asesor:</span>
                      <select
                        value={selectedOperation?.assignedTo || ''}
                        onChange={async (e) => {
                          const newAsesor = e.target.value;
                          try {
                            const res = await api.saveOperation(selectedOperation.id, { assignedTo: newAsesor });
                            if (res.ok) {
                              setSelectedOperation({ ...selectedOperation, assignedTo: newAsesor });
                              fetchOperations();
                              showToast(`Reasignado a: ${newAsesor}`);
                            }
                          } catch (err) { showToast('Error al reasignar'); }
                        }}
                        className="bg-white border border-gray-200 px-2 py-0.5 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-500/30 cursor-pointer"
                      >
                        <option value="">Sin Asignar</option>
                        {(users || []).map((u: any) => (
                          <option key={u.id} value={u.alias || u.name}>{u.alias || u.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-gray-500 uppercase">ASESOR: {selectedOperation?.assignedTo || 'SIN ASIGNAR'}</p>
                  )}
                  {(selectedOperation?.previousId || selectedOperation?.originalQuoteId) && (
                    <p className="text-[10px] font-bold text-orange-500 italic">
                      {selectedOperation.previousId && selectedOperation.previousId !== selectedOperation.originalQuoteId ? `Viene de: ${selectedOperation.previousId} | ` : ''} 
                      {selectedOperation.originalQuoteId ? `Original: ${selectedOperation.originalQuoteId}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedOperation(null)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 print:overflow-visible print-only" id="operation-print-content">
              {/* ENCABEZADO DEL PDF: 3 COLUMNAS (AGENCIA - INFO - HOTEL) */}
              <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-6">
                
                {/* Izquierda: Logo Agencia */}
                <div className="w-32 h-20 flex items-center justify-start shrink-0">
                  {config?.logoImage ? (
                    <img src={config.logoImage} alt="Margarita Viajes" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <span className="font-black text-orange-500 text-xl leading-none">Margarita Viajes</span>
                  )}
                </div>

                {/* Centro: Datos Agencia */}
                <div className="flex-1 text-center px-4">
                  <h2 className="font-black text-lg uppercase text-[#0B132B]">{config?.agencyName || config?.nombreEmpresa || 'Margarita Viajes'}</h2>
                  <p className="font-bold text-xs text-gray-600 mt-1">RIF: {config?.rif || 'J-40156646-4'} | RTN: {config?.rtn || '13314'}</p>
                  <p className="text-[11px] text-gray-500 italic mt-2 max-w-sm mx-auto leading-tight">{config?.direccion || 'Calle La Ceiba, Sector El Otro Lado del Río, La Asunción'}</p>
                </div>

                {/* Derecha: Logo Hotel */}
                <div className="w-32 h-20 flex items-center justify-end shrink-0">
                  {selectedOperation?.hotelLogo || (selectedOperation as any)?.logo ? (
                    <img src={selectedOperation?.hotelLogo || (selectedOperation as any)?.logo} alt={selectedOperation?.hotelName} className="max-h-full max-w-full object-contain rounded-lg" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-[8px] text-gray-400 font-bold text-center">SIN LOGO<br />HOTEL</div>
                  )}
                </div>
              </div>

              <div className="bg-[#0B132B] p-4 rounded-xl flex justify-between font-black text-xs uppercase text-white mb-8">
                <span>Comprobante de Operación: {selectedOperation.clientName}</span>
                <span>Folio Venta: {selectedOperation.id}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* BLOQUE 1: CONFIRMACIÓN DE HOTEL */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><ShieldCheck size={18} /></div>
                    <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-[0.2em]">1. Confirmación de Hotel</h4>
                  </div>
                  <div className="bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100/50 space-y-4">
                    {(selectedOperation?.hotelResponseImage) ? (
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase">Documentación Recibida:</p>
                         <img src={selectedOperation?.hotelResponseImage} className="w-full rounded-2xl shadow-sm border border-blue-100 object-cover hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setPreviewUrl(selectedOperation?.hotelResponseImage || null)} />
                        <p className="text-[8px] text-center text-blue-400 font-bold uppercase italic mt-1">Hacer clic para ampliar</p>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-gray-400">
                        <AlertCircle size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="text-[10px] uppercase font-black">Sin imagen de confirmación</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE 2: FICHA TÉCNICA - PASAJEROS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><Users size={18} /></div>
                    <h4 className="text-[11px] font-black uppercase text-purple-600 tracking-[0.2em]">2. Lista de Pasajeros</h4>
                  </div>
                  <div className="bg-purple-50/30 p-6 rounded-[2rem] border border-purple-100/50">
                    {(selectedOperation?.companions && selectedOperation.companions.length > 0) ? (
                      <div className="space-y-3">
                        {selectedOperation.companions.map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-purple-50">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                              <span className="text-xs font-black uppercase italic text-[#0B132B]">{p?.name || 'Sin Nombre'}</span>
                            </div>
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-600 px-3 py-1 rounded-full uppercase">{p?.type || 'Adulto'} {p?.age ? `- ${p.age} años` : ''}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-10 text-gray-400 text-[10px] font-black uppercase tracking-widest">Sin datos de pasajeros</p>
                    )}
                  </div>
                </div>

                {/* BLOQUE 3: ITINERARIO DE VIAJE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600"><Calendar size={18} /></div>
                    <h4 className="text-[11px] font-black uppercase text-green-600 tracking-[0.2em]">3. Itinerario de Viaje</h4>
                  </div>
                  <div className="bg-green-50/30 p-6 rounded-[2rem] border border-green-100/50 grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center border-b border-green-100/50 pb-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Hotel Seleccionado</span>
                      <span className="text-xs font-black italic uppercase text-[#0B132B]">{selectedOperation?.hotelName || 'S/F'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-green-100/50 pb-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Plan de Comidas</span>
                      <span className="text-xs font-black text-orange-600 uppercase">{(selectedOperation as any)?.plan || 'S/F'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-green-100/50 pb-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Check-in</span>
                      <div className="flex items-center gap-2 text-xs font-black italic text-[#0B132B] uppercase">
                        <Calendar size={12} className="text-green-500" /> {formatDateVisual(selectedOperation?.checkIn || 'S/F')}
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-green-100/50 pb-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Check-out</span>
                      <div className="flex items-center gap-2 text-xs font-black italic text-gray-400 uppercase">
                        <Calendar size={12} /> {formatDateVisual(selectedOperation?.checkOut || 'S/F')}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Tipo de Habitación</span>
                      <span className="text-xs font-bold text-[#0B132B]">{selectedOperation?.roomType || 'S/F'}</span>
                    </div>
                  </div>
                </div>

                 {/* BLOQUE 3: CONTROL LOGÍSTICO (NUEVO) */}
                 <div className="space-y-4 col-span-1 md:col-span-2">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Briefcase size={18} /></div>
                     <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-[0.2em]">3. Control Logístico y Operativo</h4>
                   </div>
                   <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Itinerario del PAX (Punto de Inicio)</label>
                        <select 
                          value={selectedOperation.itinerary || ''}
                          onChange={(e) => setSelectedOperation({...selectedOperation, itinerary: e.target.value})}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-[11px] font-bold outline-none focus:border-blue-500 transition-all font-black uppercase tracking-widest"
                        >
                          <option value="">Seleccionar Itinerario...</option>
                          <option value="Aeropuerto">Aeropuerto</option>
                          <option value="Ferry">Ferry</option>
                          <option value="Cliente no Por Cliente">Cliente no Por Cliente</option>
                        </select>
                        <textarea 
                          placeholder="Detalles del Itinerario (Vuelos, Horarios, etc.)..."
                          value={selectedOperation.itineraryDetails || ''}
                          onChange={(e) => setSelectedOperation({...selectedOperation, itineraryDetails: e.target.value})}
                          className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-[10px] font-bold outline-none focus:border-blue-500 transition-all min-h-[80px] mt-3"
                        ></textarea>
                      </div>
                     <div className="space-y-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Proveedor de Traslado</label>
                         <select 
                           value={selectedOperation.transferProvider || ''}
                           onChange={(e) => setSelectedOperation({...selectedOperation, transferProvider: e.target.value})}
                           className="w-full bg-white border-2 border-gray-100 rounded-xl p-3 text-[11px] font-bold outline-none focus:border-blue-500"
                         >
                           <option value="">Seleccionar Proveedor...</option>
                           {transfers.map((t: any) => (
                             <option key={t.id} value={t.operator}>{t.operator} - {t.route}</option>
                           ))}
                         </select>
                       </div>
                       
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Estado de la Operación</label>
                         <div className="flex flex-col gap-2">
                           <select 
                             value={selectedOperation.status || 'Pendiente'}
                             onChange={(e) => {
                               const newStatus = e.target.value;
                               // REGLA CRÍTICA: Bloquear cambio a activa si faltan datos
                               if (['Confirmada', 'Venta Cerrada', 'Venta Concretada'].includes(newStatus)) {
                                 if (!selectedOperation.itinerary || !selectedOperation.transferProvider) {
                                   showToast('❌ DEBE COMPLETAR ITINERARIO Y PROVEEDOR PARA ACTIVAR');
                                   return;
                                 }
                               }
                               setSelectedOperation({...selectedOperation, status: newStatus as ReservationStatus});
                             }}
                             className={`w-full border-2 rounded-xl p-3 text-[11px] font-black uppercase tracking-widest outline-none transition-all ${
                               ['Confirmada', 'Venta Cerrada', 'Venta Concretada'].includes(selectedOperation.status || '') ? 'border-green-500 bg-green-50 text-green-700' : 'border-blue-500 bg-blue-50 text-blue-700'
                             }`}
                           >
                             <option value="Pendiente">Venta Pendiente</option>
                             <option value="Confirmada">Venta Activa (Confirmada)</option>
                             <option value="Venta Cerrada">Venta Cerrada</option>
                             <option value="Completada">Finalizada / Historial</option>
                           </select>
                           
                           <button 
                             onClick={async () => {
                               setSavingStatus(true);
                               try {
                                 await api.saveOperation(selectedOperation.id, {
                                     status: selectedOperation.status,
                                     itinerary: selectedOperation.itinerary,
                                     itineraryDetails: selectedOperation.itineraryDetails,
                                     transferProvider: selectedOperation.transferProvider
                                   });
                                 showToast('✅ Cambios guardados en Centro de Control');
                                 fetchOperations();
                               } catch (err) { showToast('Error al guardar cambios'); }
                               finally { setSavingStatus(false); }
                             }}
                             disabled={savingStatus}
                             className="w-full bg-[#0B132B] text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 disabled:opacity-50 transition-all"
                           >
                             {savingStatus ? 'Guardando...' : 'Guardar y Sincronizar'}
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* BLOQUE 4: CONTACTO DEL CLIENTE */}
                 <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Users size={18} /></div>
                     <h4 className="text-[11px] font-black uppercase text-orange-600 tracking-[0.2em]">4. Datos de Contacto</h4>
                   </div>
                  <div className="bg-orange-50/30 p-6 rounded-[2rem] border border-orange-100/50 space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Nombre Principal</span>
                      <span className="font-black italic uppercase text-[#0B132B]">{selectedOperation?.clientName || 'Sin Nombre'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Correo Electrónico</span>
                      <span className="font-bold text-[#0B132B] underline decoration-orange-200">{selectedOperation?.email || 'Sin Email'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">WhatsApp / Teléfono</span>
                      <div className="flex items-center gap-2 font-black italic text-green-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        {selectedOperation?.whatsapp || 'No registrado'}
                      </div>
                    </div>
                    <div className="pt-4 flex gap-2">
                      <span className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        ['Confirmada', 'Venta Cerrada', 'Venta Concretada'].includes(selectedOperation?.status || '') ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
                        selectedOperation?.status === 'Reserva' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' :
                        'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      }`}>
                        ESTADO: {selectedOperation?.status || 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 print-hidden">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const url = `${api.getBaseUrl()}/public/vouchers/${selectedOperation.id}`;
                    window.open(url, '_blank');
                  }}
                  className="w-12 h-12 bg-[#0B132B] text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl"
                  title="Ver Vista Previa"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => {
                    const folio = selectedOperation.id;
                    const link = document.createElement('a');
                    link.href = `${api.getBaseUrl()}/public/vouchers/${folio}?download=true`;
                    link.download = `Voucher_${folio}.pdf`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-12 h-12 bg-gray-200 text-[#0B132B] rounded-2xl flex items-center justify-center hover:bg-gray-300 transition-all shadow-xl"
                  title="Descargar PDF"
                >
                  <Download size={20} />
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="px-6 py-4 bg-white border-2 border-gray-100 text-[#0B132B] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
       {previewUrl && (
         <div className="fixed inset-0 bg-[#0B132B]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
           <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-300">
             <button onClick={() => setPreviewUrl(null)} className="absolute top-0 right-0 w-14 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all">
               <X size={28} />
             </button>
             <img src={previewUrl} className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain border border-white/10" onClick={(e) => e.stopPropagation()} />
             <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] mt-8">Previsualización de Hotel</p>
           </div>
         </div>
       )}
    </div>
  );
}
