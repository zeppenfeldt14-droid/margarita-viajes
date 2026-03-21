import { useState, useEffect } from 'react';
import { Users, Calendar, ShieldCheck, AlertCircle, Briefcase, X, Search, Mail, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { showToast } from '../Toast';
import { Card, SectionTitle } from './Common';
import type { Reservation, Hotel as HotelType } from '../../types';
import { formatDateVisual, compressImage } from '../../utils/helpers';

export default function ReservationsList({ hotels }: { 
  hotels: HotelType[]; 
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
      // Filtro de pestaña (Activa/Venta/Todas)
      if (filter === 'activas' && res?.status === 'Venta Cerrada') return false;
      if (filter === 'ventas' && res?.status !== 'Venta Cerrada') return false;

      // Filtro de búsqueda (Nombre o Folio)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (res.clientName?.toLowerCase().includes(searchLower)) ||
        (res.id?.toLowerCase().includes(searchLower)) ||
        (res.quoteId?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;

      // Filtro de Mes (basado en checkIn)
      if (selectedMonth !== 'all') {
        const checkInDate = new Date(res.checkIn);
        if (checkInDate.getMonth() !== selectedMonth) return false;
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
                {f === 'activas' ? 'Activas' : f === 'ventas' ? 'Ventas' : 'Ver Todas'}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left font-bold text-sm">
                <thead><tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"><th className="pb-6 px-4">FOLIO</th><th className="pb-6 px-4">CLIENTE</th><th className="pb-6 px-4">FECHAS</th><th className="pb-6 px-4 text-center">TOTAL</th><th className="pb-6 px-4">ESTADO</th><th className="pb-6 px-4 text-center">ACCIONES</th></tr></thead>
                <tbody>
                  {filteredReservations.map(res => (
                    <tr key={res.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors uppercase">
                      <td className="py-5 px-4"><div className="flex flex-col"><span className="font-black italic text-green-600">{res.id?.startsWith('R') ? res.id : res.quoteId?.replace('C', 'R')}</span><span className="text-[8px] text-gray-400 font-bold uppercase">Ref: {res.quoteId}</span></div></td>
                      <td className="py-5 px-4"><div className="flex flex-col"><span className="font-black italic text-[#0B132B]">{res.clientName}</span><span className="text-[9px] text-gray-400 lowercase">{res.email}</span></div></td>
                      <td className="py-5 px-4 text-[10px] font-black">{formatDateVisual(res.checkIn)} - {formatDateVisual(res.checkOut)}</td>
                      <td className="py-5 px-4 text-center font-black italic text-green-600">$ {Number(res.totalAmount).toLocaleString()}</td>
                      <td className="py-5 px-4"><span className={`px-3 py-1.5 rounded-full text-[8px] font-black ${res.status === 'Venta Cerrada' ? 'bg-green-500' : 'bg-blue-500'} text-white`}>{res.status}</span></td>
                      <td className="py-5 px-4 text-center"><button onClick={() => setSelectedReservation(res)} className="bg-[#0B132B] text-white px-4 py-2 rounded-xl text-[9px] font-black hover:bg-orange-600 transition-all">Ver Reserva</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
        {selectedReservation && (
          <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:p-0 print:block">
            <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 print-card print:rounded-none print:max-h-none print:shadow-none print:w-full print:block">

            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 print-hidden">
                <div>
                  <h3 className="text-2xl font-black italic text-[#0B132B] uppercase tracking-tighter">Detalles de Reserva Activa</h3>
                  <p className="text-sm font-bold text-green-600 mt-1 uppercase tracking-widest">
                    Número de Reserva: {selectedReservation.id?.startsWith('R') ? selectedReservation.id : selectedReservation.quoteId?.replace('C', 'R')}
                    {selectedReservation.originalQuoteId && <span className="text-gray-400"> | Ref: {selectedReservation.originalQuoteId}</span>}
                  </p>
                </div>
                <button onClick={() => setSelectedReservation(null)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 print:overflow-visible print-only" id="reservation-print-content">
                <div className="max-w-3xl mx-auto space-y-10">
                  
                  {/* BLOQUE: CLIENTE */}
                  <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                    <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Users size={16} className="text-[#0B132B]" /> Información del Cliente
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre Completo</span><span className="text-lg font-black italic uppercase text-[#0B132B]">{selectedReservation.clientName}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Correo Electrónico</span><span className="text-sm font-bold text-[#0B132B]">{selectedReservation.email}</span></div>
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
                        <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Plan de Comidas</span><span className="text-lg font-black text-orange-600 uppercase">{(selectedReservation as any).plan || 'No definido'}</span></div>
                        <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo Habitación</p><p className="text-lg font-bold text-[#0B132B]">{selectedReservation.roomType}</p></div>
                        <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ocupación</p><p className="text-lg font-bold text-[#0B132B] uppercase">{selectedReservation.pax} Adultos {selectedReservation.children ? `/ ${selectedReservation.children} Niños` : ''}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE: RESUMEN DE PAGO */}
                  <div className="bg-[#0B132B] p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                    <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-[0.2em] mb-6">Resumen de Venta</h4>
                    <div className="space-y-6">
                      {(selectedReservation as any).discount && (
                        <div className="space-y-3 opacity-60">
                          <div className="flex justify-between text-sm font-bold">
                            <span>SUBTOTAL</span>
                            <span>$ {Number(selectedReservation.totalAmount + ((selectedReservation as any).discountAmount || 0)).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm font-black text-orange-400 italic">
                            <span>DESCUENTO ({(selectedReservation as any).discount}%)</span>
                            <span>- $ {Number((selectedReservation as any).discountAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
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
                                      const comp = await compressImage(reader.result as string, 1200, 800); setHotelResponseImage(comp);
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
                                      const comp = await compressImage(reader.result as string, 1200, 800); setHotelResponseImage(comp);
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
                                      const comp = await compressImage(reader.result as string, 1200, 800); setPaymentProofImage(comp);
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
                                      const comp = await compressImage(reader.result as string, 1200, 800); setPaymentProofImage(comp);
                                    }; reader.readAsDataURL(file);
                                  }
                                }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* FICHA TÉCNICA UNIFICADA */}
                      <div className="bg-purple-50/50 p-8 rounded-[2rem] border border-purple-100 space-y-6">
                        <p className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Users size={16} /> Lista de Pasajeros
                        </p>
                        <div className="space-y-3">
                          {((selectedReservation as any).companions || (selectedReservation as any).technicalSheet?.passengers || []).length === 0 ? (
                            <p className="text-[10px] text-gray-400 font-bold uppercase text-center py-4">No se llenó la ficha técnica en la cotización.</p>
                          ) : (
                            ((selectedReservation as any).companions || (selectedReservation as any).technicalSheet?.passengers || []).map((p: any, idx: number) => (
                              <div key={idx} className="flex gap-3 items-center bg-white/50 p-3 rounded-xl border border-purple-100/50">
                                <span className="text-[10px] font-black text-purple-300 w-6">{idx + 1}</span>
                                <input type="text" id={`paxName${idx}`} defaultValue={p.name} placeholder="Nombre completo" className="flex-1 bg-white px-4 py-3 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-purple-300 transition-all" />
                                <select id={`paxType${idx}`} defaultValue={p.type} className="bg-white px-3 py-3 rounded-lg text-[9px] font-black uppercase outline-none border border-transparent">
                                  <option value="Adulto">Adulto</option>
                                  <option value="Niño">Niño</option>
                                  <option value="Infante">Infante</option>
                                </select>
                                {p.type !== 'Adulto' && <input type="number" id={`paxAge${idx}`} defaultValue={p.age || ''} placeholder="Edad" className="w-16 bg-white px-2 py-3 rounded-lg text-xs font-bold outline-none border border-transparent" />}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          const existingPax = (selectedReservation as any).companions || (selectedReservation as any).technicalSheet?.passengers || [];
                          const passengers = [];

                          for (let i = 0; i < existingPax.length; i++) {
                            const nameEl = document.getElementById(`paxName${i}`) as HTMLInputElement;
                            const typeEl = document.getElementById(`paxType${i}`) as HTMLSelectElement;
                            const ageEl = document.getElementById(`paxAge${i}`) as HTMLInputElement;
                            passengers.push({
                              name: nameEl?.value || existingPax[i].name,
                              type: typeEl?.value || existingPax[i].type,
                              age: ageEl?.value || existingPax[i].age || null
                            });
                          }

                          if (passengers.length === 0) {
                            showToast('⚠️ La ficha técnica está vacía.');
                            return;
                          }

                          if (!hotelResponseImage) {
                            showToast('⚠️ Faltan documentos: Respuesta del hotel.');
                            return;
                          }

                          if (!paymentProofImage) {
                            showToast('⚠️ Faltan documentos: Comprobante de pago.');
                            return;
                          }

                          try {
                            const technicalSheet = {
                              passengers: passengers,
                              createdAt: new Date().toISOString()
                            };

                            const updateRes = await api.updateReservation(selectedReservation.id, {
                               status: 'Venta Cerrada',
                               technicalSheet: technicalSheet,
                               hotelResponseImage: hotelResponseImage,
                               paymentProofImage: paymentProofImage
                             });

                            if (updateRes.ok) {
                              // Generar ID V000
                              let nextSaleNum = 100001;
                              try {
                                const ops = await api.getOperations();
                                if (Array.isArray(ops) && ops.length > 0) {
                                  const vIds = ops
                                    .map((o: any) => o.id?.toString() || '')
                                    .filter((id: string) => id.startsWith('V'))
                                    .map((id: string) => parseInt(id.replace(/\D/g, '')) || 0);
                                  if (vIds.length > 0) nextSaleNum = Math.max(...vIds) + 1;
                                }
                              } catch (err) {
                                console.error('Error generating sequential Sale ID:', err);
                              }

                              const nextSaleId = 'V' + nextSaleNum.toString().padStart(10, '0');

                              const opCheck = await api.getOperation(selectedReservation.quoteId);
                               const exists = opCheck.ok;
                               let existingOp: any = null;
                               if (exists) existingOp = await opCheck.json();

                              const operationData = {
                                id: exists ? existingOp.id : nextSaleId,
                                quoteId: (selectedReservation as any).originalQuoteId || selectedReservation.quoteId,
                                clientName: selectedReservation.clientName,
                                email: selectedReservation.email,
                                whatsapp: selectedReservation.whatsapp,
                                hotelId: selectedReservation.hotelId,
                                hotelName: selectedReservation.hotelName,
                                hotelEmail: (selectedReservation as any).hotelEmail || '',
                                checkIn: selectedReservation.checkIn,
                                checkOut: selectedReservation.checkOut,
                                roomType: selectedReservation.roomType,
                                pax: selectedReservation.pax,
                                children: selectedReservation.children,
                                infants: selectedReservation.infants,
                                totalAmount: selectedReservation.totalAmount,
                                companions: passengers,
                                technicalSheet: technicalSheet,
                                hotelResponseImage: hotelResponseImage,
                                status: 'Venta Cerrada'
                              };

                              await api.saveOperation(exists ? selectedReservation.quoteId : null, operationData);

                              showToast('✅ ¡Venta Cerrada con éxito!');
                              setSelectedReservation(null);
                              fetchReservations();
                            } else {
                              showToast('❌ Error al actualizar el estado de la reserva.');
                            }
                          } catch (error) {
                            console.error('Error closing reservation:', error);
                            showToast('❌ Error crítico al cerrar la reserva.');
                          }
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] hover:from-green-600 hover:to-green-700 transition-all shadow-2xl shadow-green-200 flex items-center justify-center gap-4 active:scale-95 border-b-4 border-green-800"
                      >
                        <ShieldCheck size={24} />
                        Marcar como VENTA CERRADA
                      </button>

                      <button
                        onClick={() => {
                          const pax = Number(selectedReservation.pax || 0);
                          const children = Number(selectedReservation.children || 0);
                          const infants = Number(selectedReservation.infants || 0);
                          
                          // Buscar el hotel en el inventario para obtener su correo
                          const hotel = hotels.find(h => h.id === selectedReservation.hotelId || h.name === selectedReservation.hotelName);
                          const hotelEmail = hotel?.email || (selectedReservation as any).hotelEmail || '';

                          const body = `Hola, 
Solicito disponibilidad/confirmación para la siguiente reserva:

Entrada: ${formatDateVisual(selectedReservation.checkIn)}
Salida: ${formatDateVisual(selectedReservation.checkOut)}

Habitación: ${selectedReservation.roomType}

Pasajeros:
- Adultos: ${pax}
- Niños: ${children} 
- Infantes: ${infants}

Quedo a la espera de su respuesta.
Dpto. Reservas Margarita Viajes 
Saludos.`;

                          setEmailConfig({
                            recipient: hotelEmail,
                            subject: `Solicitud de Reserva - ${selectedReservation.clientName}`,
                            body: body
                          });
                          
                          setShowEmailModal(true);
                        }}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Briefcase size={16} /> Generar Correo para Hotel
                      </button>

                      <button
                        onClick={() => {
                          const originalTitle = document.title;
                          const resId = selectedReservation.id?.startsWith('R') ? selectedReservation.id : selectedReservation.quoteId?.replace('C', 'R');
                          document.title = `Reserva_${resId}`;
                          window.print();
                          document.title = originalTitle;
                        }}
                        className="w-full bg-gray-100 text-[#0B132B] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Printer size={16} /> Imprimir Ficha / PDF
                      </button>
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
                <button onClick={() => {
                  const mailtoLink = `mailto:${emailConfig.recipient}?subject=${encodeURIComponent(emailConfig.subject)}&body=${encodeURIComponent(emailConfig.body)}`;
                  window.location.href = mailtoLink;
                  setShowEmailModal(false);
                }} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"><Mail size={16} /> Abrir en Gestor de Correos</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
