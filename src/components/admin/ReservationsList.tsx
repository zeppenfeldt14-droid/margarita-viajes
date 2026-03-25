import { useState, useEffect } from 'react';
import { Users, Calendar, ShieldCheck, AlertCircle, Briefcase, X, Search, Mail, Printer, Download, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { showToast } from '../Toast';
import { Card, SectionTitle } from './Common';
import type { Reservation, Hotel as HotelType } from '../../types';
import { formatDateVisual, compressImage } from '../../utils/helpers';

export default function ReservationsList({ hotels, isDataMaster, userAlias, users, config }: { 
  hotels: HotelType[]; 
  isDataMaster?: boolean;
  userAlias?: string | null;
  users?: any[];
  config?: any;
}) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'activas' | 'ventas' | 'todas'>('activas');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [hotelResponseImage, setHotelResponseImage] = useState<string>('');
  const [paymentProofImage, setPaymentProofImage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState({ recipient: '', subject: '', body: '' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    if (selectedReservation) {
      setHotelResponseImage((selectedReservation as any).hotelResponseImage || '');
      setPaymentProofImage((selectedReservation as any).paymentProofImage || '');
    }
  }, [selectedReservation]);

  const fetchReservations = async () => {
    try {
      const data = await api.getReservations();
      setReservations(Array.isArray(data) ? data : []);
    } catch (error) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReservations(); }, []);

  const filteredReservations = (reservations || [])
    .filter((res: Reservation) => {
      if (filter === 'activas' && res?.status === 'Venta Cerrada') return false;
      if (filter === 'ventas' && res?.status !== 'Venta Cerrada') return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (res?.clientName?.toLowerCase().includes(searchLower)) ||
        (res?.id?.toLowerCase().includes(searchLower)) ||
        (res?.quoteId?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;

      if (selectedMonth !== 'all' && res?.checkIn) {
        const checkInDate = new Date(res.checkIn);
        if (checkInDate.getMonth() !== selectedMonth) return false;
      }

      if (!isDataMaster) {
        const isAssignedToMe = res?.assignedTo === userAlias;
        const isUnassigned = !res?.assignedTo || res?.assignedTo === '';
        if (!isAssignedToMe && !isUnassigned) return false;
      }

      return true;
    })
    .sort((a: Reservation, b: Reservation) => new Date(a?.checkIn || '').getTime() - new Date(b?.checkIn || '').getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="print-hidden space-y-8">
        <SectionTitle>Reservas Activas / Entrantes</SectionTitle>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex gap-2">
            {(['activas', 'ventas', 'todas'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-[#0B132B] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 text-gray-400 hover:text-[#0B132B] border border-transparent'}`}>
                {f === 'activas' ? 'Activas' : f === 'ventas' ? 'VENTAS' : 'Ver Todas'}
              </button>
            ))}
          </div>

          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por cliente o folio..."
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
          </div>
        </div>
        
        {loading ? <Card><div className="text-center py-20 uppercase font-black text-[10px] text-gray-400 tracking-widest">Cargando...</div></Card> : (
          <Card>
            <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
              <table className="w-full text-left font-bold text-sm">
                <thead><tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"><th className="pb-6 px-4">FOLIO</th><th className="pb-6 px-4">CLIENTE</th><th className="pb-6 px-4">FECHAS</th><th className="pb-6 px-4 text-center">TOTAL</th><th className="pb-6 px-4">ESTADO</th><th className="pb-6 px-4 text-center">ACCIONES</th></tr></thead>
                <tbody>
                  {filteredReservations.map(res => (
                    <tr key={res.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors uppercase">
                      <td className="py-5 px-4"><div className="flex flex-col"><span className="font-black italic text-green-600">{res.id?.startsWith('R') ? res.id : res.quoteId?.replace('C', 'R')}</span><span className="text-[8px] text-gray-400 font-bold uppercase">Ref: {res.quoteId}</span></div></td>
                      <td className="py-5 px-4"><div className="flex flex-col"><span className="font-black italic text-[#0B132B]">{res.clientName}</span><span className="text-[9px] text-gray-400 lowercase">{res.email}</span></div></td>
                      <td className="py-5 px-4 text-[10px] font-black">{formatDateVisual(res.checkIn)} - {formatDateVisual(res.checkOut)}</td>
                      <td className="py-5 px-4 text-center font-black italic text-green-600">$ {Number(res.totalAmount).toLocaleString()}</td>
                      <td className="py-5 px-4">
                        <select
                          value={res.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            
                            // Bloqueo v23: No cerrar si tiene traslado y faltan datos
                            if (newStatus === 'Venta Cerrada' && (res as any).includeTransfer) {
                              if (!(res as any).itinerary || !(res as any).transferProvider) {
                                showToast('❌ Faltan datos logísticos en Operaciones');
                                return;
                              }
                            }

                            try {
                              const updatedRes = await api.updateReservation(res.id, { status: newStatus });
                              if (updatedRes) {
                                fetchReservations();
                                showToast(`Estado: ${newStatus}`);
                              }
                            } catch (err) { showToast('Error al actualizar estado'); }
                          }}
                          className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border-none cursor-pointer outline-none transition-all ${
                            res.status === 'Venta Cerrada' || res.status === 'Venta Concretada' ? 'bg-green-500 text-white shadow-sm' :
                            res.status === 'Liquidada' ? 'bg-purple-600 text-white' :
                            res.status === 'Cancelada' ? 'bg-red-500 text-white' :
                            res.status === 'Confirmada' ? 'bg-blue-600 text-white shadow-sm' :
                            'bg-blue-400 text-white'
                          }`}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmada">Confirmada</option>
                          <option value="Venta Cerrada">VENTA</option>
                          <option value="Venta Concretada">Venta Concretada</option>
                          <option value="Liquidada">Liquidada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <button onClick={() => setSelectedReservation(res)} className="bg-[#0B132B] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-orange-600 transition-all shadow-sm">VER</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {selectedReservation && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:block">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 print-card print:rounded-none print:max-h-none print:shadow-none print:w-full print:block">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 print-hidden">
              <div>
                <h3 className="text-2xl font-black italic text-[#0B132B] uppercase tracking-tighter">Gestión de Reserva: {selectedReservation.id?.startsWith('R') ? selectedReservation.id : selectedReservation.quoteId?.replace('C', 'R')}</h3>
                <div className="flex flex-col gap-0.5 mt-1">
                  <p className="text-sm font-black text-[#0B132B] uppercase">
                    FOLIO: {selectedReservation.id?.startsWith('R') ? selectedReservation.id : selectedReservation.quoteId?.replace('C', 'R')} |
                    NOCHES: {Math.ceil((new Date(selectedReservation.checkOut).getTime() - new Date(selectedReservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  {(selectedReservation.previousId || selectedReservation.originalQuoteId) && (
                    <p className="text-[10px] font-bold text-orange-500 italic">
                      {selectedReservation.previousId && selectedReservation.previousId !== selectedReservation.originalQuoteId ? `Viene de: ${selectedReservation.previousId} | ` : ''} 
                      {selectedReservation.originalQuoteId ? `Original: ${selectedReservation.originalQuoteId}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedReservation(null)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 print:overflow-visible print-only" id="reservation-print-content">
              <div className="max-w-3xl mx-auto space-y-10">
                {/* ENCABEZADO DEL PDF: 3 COLUMNAS (AGENCIA - INFO - HOTEL) */}
                <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-6">
                  <div className="w-32 h-20 flex items-center justify-start shrink-0">
                    {config?.logoImage ? (
                      <img src={config.logoImage} alt="Margarita Viajes" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
                    ) : (
                      <span className="font-black text-orange-500 text-xl leading-none">Margarita Viajes</span>
                    )}
                  </div>
                  <div className="flex-1 text-center px-4">
                    <h2 className="font-black text-lg uppercase text-[#0B132B]">{config?.agencyName || config?.nombreEmpresa || 'Margarita Viajes'}</h2>
                    <p className="font-bold text-xs text-gray-600 mt-1">RIF: {config?.rif || 'J-40156646-4'} | RTN: {config?.rtn || '13314'}</p>
                    <p className="text-[11px] text-gray-500 italic mt-2 max-w-sm mx-auto leading-tight">{config?.direccion || 'Calle La Ceiba'}</p>
                  </div>
                  <div className="w-32 h-20 flex items-center justify-end shrink-0">
                    {(() => {
                      const hotel = hotels.find(h => h.id === selectedReservation.hotelId || h.name === selectedReservation.hotelName);
                      const hotelLogo = hotel?.logo || (hotel as any)?.logoImage;
                      return hotelLogo ? (
                        <img src={hotelLogo} alt={selectedReservation.hotelName} className="max-h-full max-w-full object-contain rounded-lg" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-[8px] text-gray-400 font-bold text-center">SIN LOGO<br />HOTEL</div>
                      );
                    })()}
                  </div>
                </div>

                {/* BLOQUE: CLIENTE */}
                <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Users size={16} className="text-[#0B132B]" /> Información del Cliente
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre Completo</span><span className="text-lg font-black italic uppercase text-[#0B132B]">{selectedReservation.clientName}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1">WhatsApp / Contacto</span><span className="text-lg font-black italic text-green-600 underline decoration-green-200">{selectedReservation.whatsapp || '-'}</span></div>
                  </div>
                </div>

                {/* BLOQUE: ESTADÍA */}
                <div className="bg-white p-8 rounded-[2rem] border-2 border-gray-100 shadow-sm">
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Calendar size={16} className="text-[#0B132B]" /> Detalles de la Estadía
                  </h4>
                  <div className="space-y-8">
                    <div className="pb-6 border-b border-gray-50"><p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Hotel Seleccionado</p><p className="text-2xl font-black italic text-[#0B132B] uppercase leading-tight">{selectedReservation.hotelName}</p></div>
                    <div className="grid grid-cols-2 gap-8">
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Check-in</p><p className="text-xl font-black italic text-[#0B132B]">{formatDateVisual(selectedReservation.checkIn)}</p></div>
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Check-out</p><p className="text-xl font-black italic text-[#0B132B]">{formatDateVisual(selectedReservation.checkOut)}</p></div>
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Estadía</p><p className="text-xl font-black text-blue-600 uppercase">{Math.ceil((new Date(selectedReservation.checkOut).getTime() - new Date(selectedReservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))} NOCHES</p></div>
                      <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ocupación</span><span className="text-lg font-bold text-[#0B132B] uppercase">{selectedReservation.pax} Adultos {selectedReservation.children ? `/ ${selectedReservation.children} Niños` : ''}</span></div>
                    </div>
                  </div>
                </div>

                {/* BLOQUE: RESUMEN DE PAGO */}
                <div className="bg-[#0B132B] p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-[0.2em] mb-6">Resumen de Venta</h4>
                  <div className="space-y-6">
                    <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">Total Neto a Pagar</span>
                      <span className="text-4xl font-black italic tracking-tighter text-orange-500">$ {Number(selectedReservation.totalAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* BLOQUE: DOCUMENTACIÓN Y CIERRE */}
                {selectedReservation.status === 'Venta Cerrada' ? (
                  <div className="bg-green-50/50 p-8 rounded-[2rem] border border-green-100 shadow-inner print-hidden">
                    <h4 className="text-[11px] font-black uppercase text-green-600 tracking-[0.2em] mb-6 flex items-center gap-2">Venta Cerrada ✓</h4>
                    <div className="grid grid-cols-2 gap-6">
                      {(selectedReservation as any).hotelResponseImage && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Confirmación Hotel</p>
                          <img src={(selectedReservation as any).hotelResponseImage} className="w-full h-32 object-cover rounded-2xl border border-blue-200 cursor-pointer shadow-sm" onClick={() => setPreviewUrl((selectedReservation as any).hotelResponseImage)} />
                        </div>
                      )}
                      {(selectedReservation as any).paymentProofImage && (
                         <div className="space-y-2">
                           <p className="text-[9px] font-bold text-gray-400 uppercase">Voucher Pago</p>
                           <img src={(selectedReservation as any).paymentProofImage} className="w-full h-32 object-cover rounded-2xl border border-blue-200 cursor-pointer shadow-sm hover:scale-[1.02] transition-transform" onClick={() => setPreviewUrl((selectedReservation as any).paymentProofImage)} />
                         </div>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 border-dashed flex items-center gap-4">
                      <AlertCircle size={24} className="text-orange-400" />
                      <div>
                        <p className="text-[11px] font-black text-orange-600 uppercase tracking-widest">Carga de Documentos Obligatoria</p>
                        <p className="text-[10px] text-orange-400 font-bold">La reserva se encuentra en espera de soportes.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                        <p className="text-[10px] font-black text-blue-600 uppercase">1. Respuesta Hotel</p>
                        <div className="relative">
                          {hotelResponseImage ? (
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-200">
                              <img src={hotelResponseImage} className="w-10 h-10 rounded-lg object-cover cursor-pointer" onClick={() => setPreviewUrl(hotelResponseImage)} />
                              <span className="text-[9px] font-black text-blue-600 uppercase">Cargado ✓</span>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e: any) => {
                                const file = e.target.files?.[0]; if (file) {
                                  const reader = new FileReader(); reader.onloadend = async () => {
                                    const comp = await compressImage(reader.result as string, 800, 600); setHotelResponseImage(comp);
                                  }; reader.readAsDataURL(file);
                                }
                              }} />
                            </div>
                          ) : (
                            <div className="h-12 bg-white rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center relative hover:bg-blue-50 transition-colors">
                              <span className="text-[10px] font-black text-blue-400 uppercase">Subir Confirmación</span>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e: any) => {
                                const file = e.target.files?.[0]; if (file) {
                                  const reader = new FileReader(); reader.onloadend = async () => {
                                    const comp = await compressImage(reader.result as string, 800, 600); setHotelResponseImage(comp);
                                  }; reader.readAsDataURL(file);
                                }
                              }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 space-y-4">
                        <p className="text-[10px] font-black text-green-600 uppercase">2. Comprobante Pago</p>
                        <div className="relative">
                          {paymentProofImage ? (
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-green-200">
                              <img src={paymentProofImage} className="w-10 h-10 rounded-lg object-cover cursor-pointer" onClick={() => setPreviewUrl(paymentProofImage)} />
                              <span className="text-[9px] font-black text-green-600 uppercase">Cargado ✓</span>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e: any) => {
                                const file = e.target.files?.[0]; if (file) {
                                  const reader = new FileReader(); reader.onloadend = async () => {
                                    const comp = await compressImage(reader.result as string, 800, 600); setPaymentProofImage(comp);
                                  }; reader.readAsDataURL(file);
                                }
                              }} />
                            </div>
                          ) : (
                            <div className="h-12 bg-white rounded-xl border-2 border-dashed border-green-200 flex items-center justify-center relative hover:bg-green-50 transition-colors">
                              <span className="text-[10px] font-black text-green-400 uppercase">Subir Comprobante</span>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e: any) => {
                                const file = e.target.files?.[0]; if (file) {
                                  const reader = new FileReader(); reader.onloadend = async () => {
                                    const comp = await compressImage(reader.result as string, 800, 600); setPaymentProofImage(comp);
                                  }; reader.readAsDataURL(file);
                                }
                              }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        disabled={isSaving}
                        onClick={async () => {
                          if (!hotelResponseImage || !paymentProofImage) {
                            showToast('⚠️ Faltan documentos.');
                            return;
                          }
                          setIsSaving(true);
                          try {
                            const technicalSheet = { passengers: (selectedReservation as any).companions || [], createdAt: new Date().toISOString() };
                            const res = await api.updateReservation(selectedReservation.id, { 
                              status: 'Venta Cerrada', 
                              technicalSheet,
                              hotelResponseImage,
                              paymentProofImage
                            });
                            
                            if (res.ok) {
                              showToast('✅ ¡Venta Cerrada!');
                              setSelectedReservation(null);
                              fetchReservations();
                            } else {
                              const errorData = await res.json().catch(() => ({}));
                              showToast(`❌ Error: ${errorData.message || 'El archivo es demasiado grande (Límite 4.5MB)'}`);
                            }
                          } catch (error) { 
                            showToast('❌ Error crítico de red.'); 
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        className={`flex-1 ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2`}
                      >
                        {isSaving ? 'Cargando...' : (
                          <>
                            <ShieldCheck size={16} /> CONFIRMAR VENTA
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const pax = Number(selectedReservation.pax || 0);
                          const children = Number(selectedReservation.children || 0);
                          const infants = Number(selectedReservation.infants || 0);
                          const hotel = hotels.find(h => h.id === selectedReservation.hotelId || h.name === selectedReservation.hotelName);
                          const hotelEmail = hotel?.email || (selectedReservation as any).hotelEmail || '';
                          const body = `Hola, \nSolicito disponibilidad/confirmación para la siguiente reserva:\n\nEntrada: ${formatDateVisual(selectedReservation.checkIn)}\nSalida: ${formatDateVisual(selectedReservation.checkOut)}\n\nHabitación: ${selectedReservation.roomType}\n\nPasajeros:\n- Adultos: ${pax}\n- Niños: ${children} \n- Infantes: ${infants}\n\nQuedo a la espera de su respuesta.\nDpto. Reservas Margarita Viajes \nSaludos.`;
                          setEmailConfig({ recipient: hotelEmail, subject: `Solicitud de Reserva - ${selectedReservation.clientName}`, body: body });
                          setShowEmailModal(true);
                        }}
                        className="flex-1 bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Mail size={16} /> Correo Hotel
                      </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md ${
                          selectedReservation.status === 'Reserva' ? 'bg-blue-500 text-white' :
                          ['Venta Cerrada', 'Venta Concretada'].includes(selectedReservation.status) ? 'bg-green-500 text-white' :
                          selectedReservation.status === 'Confirmada' ? 'bg-blue-600 text-white' :
                          'bg-[#0B132B] text-white'
                        }`}>
                          ESTADO: {selectedReservation.status}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            title="Re-enviar Confirmación"
                            onClick={async () => {
                              try {
                                const res = await api.dispatchCommunication({
                                  type: 'email',
                                  target: 'client',
                                  recipient: selectedReservation.email,
                                  documentId: selectedReservation.id,
                                  documentType: 'reservation'
                                });
                                if (res.ok) showToast('✅ Confirmación enviada al cliente');
                                else showToast('❌ Error al enviar confirmación');
                              } catch (e) { showToast('❌ Error de comunicación'); }
                            }}
                            className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition-all shadow-sm border border-green-200"
                          >
                            <Mail size={18} />
                          </button>
                          <button
                            title="Ver Vista Previa"
                            onClick={() => {
                              const url = `${api.getBaseUrl()}/public/vouchers/${selectedReservation.id}`;
                              window.open(url, '_blank');
                            }}
                            className="w-10 h-10 bg-gray-100 text-[#0B132B] rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm border border-gray-200"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            title="Descargar Ficha"
                            onClick={() => {
                              const originalTitle = document.title;
                              const resId = selectedReservation.id?.startsWith('R') ? selectedReservation.id : selectedReservation.quoteId?.replace('C', 'R');
                              document.title = `Reserva_${resId}`;
                              window.print();
                              document.title = originalTitle;
                            }}
                            className="w-10 h-10 bg-[#0B132B] text-white rounded-xl flex items-center justify-center hover:bg-blue-900 transition-all shadow-lg"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
            <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] mt-8">Previsualización de Documento</p>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-md z-[201] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <h3 className="text-xl font-black italic text-[#0B132B] uppercase tracking-tighter">Vista Previa del Correo</h3>
              <button onClick={() => setShowEmailModal(false)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Para (Hotel):</label>
                <input type="text" value={emailConfig.recipient} onChange={(e) => setEmailConfig({...emailConfig, recipient: e.target.value})} className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-2 ring-gray-100 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asunto:</label>
                <input type="text" value={emailConfig.subject} onChange={(e) => setEmailConfig({...emailConfig, subject: e.target.value})} className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-2 ring-gray-100 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mensaje:</label>
                <textarea value={emailConfig.body} onChange={(e) => setEmailConfig({...emailConfig, body: e.target.value})} className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-2 ring-gray-100 min-h-[200px] resize-none focus:ring-blue-500/20" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4">
              <button onClick={() => setShowEmailModal(false)} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">Cancelar</button>
              <button onClick={async () => {
                try {
                  const res = await api.dispatchCommunication({
                    type: 'email',
                    target: 'provider',
                    recipient: emailConfig.recipient,
                    subject: emailConfig.subject,
                    body: emailConfig.body,
                    documentId: selectedReservation.id,
                    documentType: 'reservation'
                  });
                  if ((res as any).ok) {
                    showToast('✅ Solicitud enviada al hotel');
                    setShowEmailModal(false);
                  } else {
                    showToast('❌ Error al enviar solicitud');
                  }
                } catch (e) {
                  showToast('❌ Error de conexión al servidor');
                }
              }} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"><Mail size={16} /> Enviar correo a hotel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
