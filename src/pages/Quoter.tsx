import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Check,
  Mail,
  MessageCircle,
  ShieldCheck,
  Plane,
  X
} from 'lucide-react';
import {
  calculateOccupancyDetails,
  calculateTotalQuotePrice,
  calculateDiscountedPrice,
  calculateChildAgesArray
} from "../utils/pricingEngine";
import { useGlobalData } from "../context/GlobalContext";
import type { Hotel, Quotation, QuoteStatus } from "../types";
import { api } from "../services/api";
import { showToast, ToastContainer } from "../components/Toast";


export default function Quoter() {
  const [, setLocation] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const hotelName = queryParams.get('hotel') || '';

  const [activeConfig, setActiveConfig] = useState<Record<string, string>>({});
  const { hotels, transfers: availableTransfers, users } = useGlobalData();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.getConfig();
        setActiveConfig(data);
      } catch (err) {
        console.error('Error fetching config:', err);
      }
    };

    fetchConfig();
  }, []);

  const selectedHotel = hotels.find(h => h.name === hotelName);

  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    pax: '2',
    children: '0',
    infants: '0',
    roomType: '',
    name: '',
    email: '',
    whatsapp: '',
    includeTransfer: false,
    transferId: '',
    childAges: [] as number[]
  });

  const childAgeLimit = (selectedHotel as any)?.childAgeLimit || 12;
 // Wait, Hotel type doesn't have childAgeLimit? Let's check types/index.ts. I'll use any with a comment if it's dynamic.

  const occupancy = calculateOccupancyDetails(formData.pax, formData.children, formData.childAges);

  useEffect(() => {
    const newNumChildren = parseInt(formData.children) || 0;
    setFormData(prev => ({
      ...prev,
      childAges: calculateChildAgesArray(prev.childAges || [], newNumChildren)
    }));
  }, [formData.children]);

  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [quoteId, setQuoteId] = useState('');

  useEffect(() => {
    if (!selectedHotel?.photos?.length || selectedHotel.photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPhotoIdx(prev => (prev + 1) % selectedHotel.photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedHotel?.photos?.length]);

  useEffect(() => {
    const generateQuoteId = async () => {
      try {
        const { nextFolio } = await api.getNextFolio();
        setQuoteId(nextFolio);
      } catch (err) {
        console.error('Error generating quote ID:', err);
        setQuoteId('C0000100001');
      }
    };
    generateQuoteId();
  }, []);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [totalPrice, setTotalPrice] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const applyCoupon = async () => {
    try {
      const coupons = await api.getCoupons();
      const valid = coupons.find((c: any) => c.code === couponCode.toUpperCase() && c.active && new Date(c.expiry) >= new Date());
      if (valid) {
        setDiscountPercent(Number(valid.discount));
        alert(`🎉 ¡Cupón aplicado! ${valid.discount}% de descuento.`);
      } else {
        alert('❌ Cupón inválido o expirado.');
        setDiscountPercent(0);
      }
    } catch (e) {
      console.error(e);
      alert('❌ Error al validar cupón.');
    }
  };

  const [seasonError, setSeasonError] = useState(false);
  const [priceInfo, setPriceInfo] = useState<any>(null); // priceInfo structure is complex, leaving for now but as explicit any if needed.

  useEffect(() => {
    const result = calculateTotalQuotePrice({
      selectedHotel,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      roomType: formData.roomType,
      transferId: formData.transferId,
      availableTransfers,
      occupancy
    });

    setTotalPrice(result.totalPrice);
    setSeasonError(result.seasonError);
    setPriceInfo(result.priceInfo);
  }, [formData, selectedHotel, availableTransfers, occupancy]);

  const finalPrice = calculateDiscountedPrice(totalPrice, discountPercent);

  const [isSuccess, setIsSuccess] = useState(false);

  const enviarCotizacion = async () => {
    if (!formData.name || !formData.email) {
      alert("Por favor completa tu nombre y correo de contacto.");
      return;
    }

    try {
      const newQuote = {
        id: quoteId,
        date: new Date().toISOString(),
        clientName: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        hotelId: selectedHotel?.id || '',
        hotelName: selectedHotel?.name || '',
        month: new Date(formData.checkIn).toLocaleString('es-ES', { month: 'long' }).toUpperCase(),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        roomType: selectedHotel?.type === 'full-day' ? 'SERVICIO FULL DAY' : (selectedHotel?.rooms.find(r => r.id === formData.roomType)?.name || formData.roomType),
        pax: formData.pax,
        children: formData.children,
        infants: formData.infants,
        totalAmount: totalPrice,
        discountAmount: totalPrice - finalPrice,
        finalAmount: finalPrice,
        status: 'Nuevo' as QuoteStatus,
        assignedTo: 'Sin Asignar',
        plan: selectedHotel?.plan || 'No especificado',
        season: priceInfo?.season || '-',
        includeTransfer: formData.includeTransfer,
        transferId: formData.transferId,
      };

      const response = await api.createQuote(newQuote);

      if (!response.ok) throw new Error('El servidor rechazó la petición');
      
      setIsSuccess(true);
      showToast('Cotización enviada con éxito al correo y WhatsApp.', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error de conexión:', error);
      alert("Error al procesar la cotización. Intente nuevamente.");
    }
  };

  if (!selectedHotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-black italic uppercase mb-4">Hotel No Encontrado</h2>
        <button onClick={() => setLocation('/')} className="bg-[#0B132B] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Volver al Inicio</button>
      </div>
    );
  }

  const nextPhoto = () => setCurrentPhotoIdx((prev) => (prev + 1) % (selectedHotel.photos?.length || 1));
  const prevPhoto = () => setCurrentPhotoIdx((prev) => (prev - 1 + (selectedHotel.photos?.length || 1)) % (selectedHotel.photos?.length || 1));

  const [isGenerating, setIsGenerating] = useState(false);

  const enviarCotizacionWhatsApp = async () => {
    if (!formData.name || !formData.email || !formData.whatsapp) {
      showToast('⚠️ Nombre, Email y WhatsApp son obligatorios.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const element = document.getElementById('pdf-hidden-container');
      if (!element) throw new Error('Contenedor de PDF no encontrado');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      const newQuote = {
        id: quoteId,
        date: new Date().toISOString(),
        clientName: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        hotelId: selectedHotel?.id || '',
        hotelName: selectedHotel?.name || '',
        month: new Date(formData.checkIn).toLocaleString('es-ES', { month: 'long' }).toUpperCase(),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        roomType: selectedHotel?.type === 'full-day' ? 'SERVICIO FULL DAY' : (selectedHotel?.rooms.find(r => r.id === formData.roomType)?.name || formData.roomType),
        pax: formData.pax,
        children: formData.children,
        infants: formData.infants,
        totalAmount: totalPrice,
        discountAmount: totalPrice - finalPrice,
        finalAmount: finalPrice,
        status: 'Nuevo' as QuoteStatus,
        assignedTo: 'Sin Asignar',
        plan: selectedHotel?.plan || 'No especificado',
        season: priceInfo?.season || '-',
        includeTransfer: formData.includeTransfer,
        transferId: formData.transferId,
        pdfBase64
      };

      const response = await api.createQuote(newQuote);
      if (!response.ok) throw new Error('Error al guardar la cotización');

      const pdfLink = `${window.location.origin}/api/public/quotes/${quoteId}/pdf`;
      const message = `Hola, mi nombre es ${formData.name}. Acabo de cotizar ${selectedHotel.name}.\n\n📄 *Descargar Cotización:* ${pdfLink}\n\n*Folio:* ${quoteId}`;
      const waUrl = `https://wa.me/${(activeConfig.telefono || '584246861748').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      window.open(waUrl, '_blank');
      setIsSuccess(true);
      showToast('✅ Cotización registrada y WhatsApp abierto.', 'success');

    } catch (error) {
      console.error('Error en flujo WhatsApp:', error);
      showToast('❌ Error al procesar el envío por WhatsApp.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] selection:bg-orange-100">
      <header className="px-6 md:px-12 py-6 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {activeConfig.logoImage ? (
            <img src={activeConfig.logoImage} alt="Logo" className="w-14 h-14 object-contain" />
          ) : (
            <img src="/assets/img/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic text-[#ea580c] leading-none uppercase">
              {activeConfig.agencyName || 'MARGARITA'}
            </h1>
            <span className="text-[9px] font-bold text-[#0B132B] uppercase tracking-widest mt-0.5">Viajes y Turismo</span>
          </div>
        </div>
        <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-[#ea580c] transition-all">
          <ChevronLeft size={16} /> Volver
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-10 animate-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 bg-white shadow-xl rounded-2xl p-3 border border-gray-100 flex items-center justify-center">
                {selectedHotel?.logo || (selectedHotel as any).logoImage ? (
                  <img src={selectedHotel?.logo || (selectedHotel as any).logoImage} alt="Logo Hotel" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold uppercase">Sin Logo</div>
                )}
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-[#0B132B] mb-1">{selectedHotel.name}</h2>
                <div className="flex items-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-widest">
                  <MapPin size={14} /> {selectedHotel.location}
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="bg-[#0B132B] text-white px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase">
                    Ref: {quoteId}
                  </div>
                  {selectedHotel.plan && (
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase shadow-lg shadow-orange-500/20">
                      Plan: {selectedHotel.plan}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative group rounded-[3rem] overflow-hidden aspect-[4/3] shadow-2xl border-8 border-white">
              <img
                src={selectedHotel.photos?.[currentPhotoIdx] || 'https://via.placeholder.com/800'}
                alt="Hotel Photo"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-10 flex justify-center gap-2">
                {selectedHotel.photos?.map((_, idx) => (
                  <div key={idx} className={`w-10 h-1.5 rounded-full transition-all ${idx === currentPhotoIdx ? 'bg-orange-500' : 'bg-white/30'}`}></div>
                ))}
              </div>
              <button onClick={prevPhoto} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft size={24} />
              </button>
              <button onClick={nextPhoto} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Descripción</h4>
              <p className="text-sm font-bold text-gray-600 leading-relaxed uppercase tracking-tight">{selectedHotel.description}</p>
            </div>
          </div>

            <div className={`bg-white rounded-[3rem] shadow-2xl p-6 md:p-14 border border-gray-50 flex flex-col space-y-8 animate-in slide-in-from-right-8 duration-700 ${isSuccess ? 'justify-center' : ''}`}>
              {isSuccess ? (
                <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Check size={48} />
                  </div>
                  <h2 className="text-4xl font-black italic uppercase text-[#0B132B] mb-4 tracking-tighter">¡Cotización Lista!</h2>
                  <p className="text-gray-500 font-bold mb-8 uppercase text-xs tracking-widest">Folio: {quoteId}</p>
                  
                  <div className="space-y-4 max-w-sm mx-auto">
                    <button
                      onClick={() => {
                        const pdfLink = `${window.location.origin}/api/public/quotes/${quoteId}/pdf`;
                        const text = encodeURIComponent(`Hola, acabo de cotizar ${selectedHotel?.name}.\nAquí puedes descargar mi cotización: ${pdfLink}\n\nMi folio es: ${quoteId}`);
                        window.open(`https://wa.me/${(activeConfig.telefono || '584246861748').replace(/\D/g, '')}?text=${text}`, '_blank');
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/20"
                    >
                      <MessageCircle size={20} /> Enviar por WhatsApp
                    </button>
                    <button
                      onClick={() => setLocation('/')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-[#0B132B] py-5 rounded-2xl font-black text-xs tracking-widest uppercase transition-all"
                    >
                      Volver al Inicio
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`grid ${selectedHotel.type === 'full-day' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{selectedHotel.type === 'full-day' ? 'FECHA DEL PASEO' : 'LLEGADA'}</label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                        <input type="date" min={minDate} value={formData.checkIn} onChange={e => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, checkIn: val, checkOut: selectedHotel.type === 'full-day' ? val : prev.checkOut }));
                        }} className="w-full bg-gray-50 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold ring-2 ring-gray-100 outline-none focus:ring-orange-500/20" />
                      </div>
                    </div>

                    {selectedHotel.type !== 'full-day' && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SALIDA</label>
                        <div className="relative">
                          <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                          <input type="date" min={formData.checkIn || minDate} value={formData.checkOut} onChange={e => setFormData({ ...formData, checkOut: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold ring-2 ring-gray-100 outline-none focus:ring-orange-500/20" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">ADULTOS (13+)</label>
                      <select
                        value={formData.pax}
                        onChange={e => setFormData({ ...formData, pax: e.target.value })}
                        className="w-full bg-gray-50 rounded-2xl py-4 px-6 text-xs font-bold ring-2 ring-gray-100 outline-none focus:ring-orange-500/20 transition-all uppercase"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">NIÑOS (4-{childAgeLimit})</label>
                      <select
                        value={formData.children}
                        onChange={e => setFormData({ ...formData, children: e.target.value })}
                        className="w-full bg-gray-50 rounded-2xl py-4 px-6 text-xs font-bold ring-2 ring-gray-100 outline-none focus:ring-orange-500/20 transition-all uppercase"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">INFANTES (0-3)</label>
                      <select
                        value={formData.infants}
                        onChange={e => setFormData({ ...formData, infants: e.target.value })}
                        className="w-full bg-gray-50 rounded-2xl py-4 px-6 text-xs font-bold ring-2 ring-gray-100 outline-none focus:ring-orange-500/20 transition-all uppercase"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                  </div>

                  {parseInt(formData.children) > 0 && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest ml-1">Edad de cada niño:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(formData.childAges || []).map((age, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-orange-50 p-3 rounded-xl">
                            <span className="text-[9px] font-bold text-orange-600">Niño {idx + 1}:</span>
                            <select
                              value={age}
                              onChange={(e) => {
                                const newAges = [...(formData.childAges || [])];
                                newAges[idx] = parseInt(e.target.value);
                                setFormData({ ...formData, childAges: newAges });
                              }}
                              className="flex-1 bg-white rounded-lg py-2 px-2 text-xs font-bold outline-none"
                            >
                              {[...Array(13)].map((_, i) => (
                                <option key={i} value={i}>{i} años</option>
                              ))}
                            </select>
                            {age < 4 && <span className="text-[8px] text-green-600 font-bold">(Gratis)</span>}
                            {age > childAgeLimit && <span className="text-[8px] text-red-500 font-bold">(Adulto)</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl">
                        <span className="text-[9px] font-black text-blue-600 uppercase">Ocupación habitación:</span>
                        <span className="text-xs font-black text-blue-600">{occupancy.adults} Adultos + {occupancy.childrenSharingRoom} Niños = {occupancy.roomCapacity} personas</span>
                      </div>
                    </div>
                  )}

                  {seasonError && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-red-50 text-red-500 p-6 rounded-[1.5rem] border border-red-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shrink-0">
                          <X size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Fecha No Disponible</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!formData.checkIn && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="bg-green-100 text-green-700 p-6 rounded-[1.5rem] border border-green-200 flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Seleccione otra fecha</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!seasonError && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        {selectedHotel.type === 'full-day' ? 'TARIFA / PERSONA' : 'TIPO DE HABITACIÓN'}
                      </label>
                      <select value={formData.roomType} onChange={e => setFormData({ ...formData, roomType: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-4 px-6 text-xs font-bold ring-2 ring-gray-100 outline-none uppercase italic">
                        <option value="">-- {selectedHotel.type === 'full-day' ? 'Selecciona Tarifa' : 'Selecciona Categoría'} --</option>
                        {selectedHotel.rooms
                          .filter(r => selectedHotel.type === 'full-day' ? true : r.capacity >= occupancy.roomCapacity)
                          .map(r => (
                            <option key={r.id} value={r.id}>
                              {r.name} {selectedHotel.type !== 'full-day' && `(Cap: ${r.capacity} Personas)`}
                            </option>
                          ))}
                      </select>
                      {priceInfo && (
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 mt-2">
                          <span>Temporada: {priceInfo.season}</span>
                          <span>×</span>
                          <span>{priceInfo.nights} noche{priceInfo.nights > 1 ? 's' : ''}</span>
                          <span>×</span>
                          <span>{priceInfo.pax} pax</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedHotel.type !== 'full-day' && !seasonError && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-gray-100 flex items-center justify-between group cursor-pointer" onClick={() => setFormData({ ...formData, includeTransfer: !formData.includeTransfer })}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.includeTransfer ? 'bg-orange-500 text-white' : 'bg-white text-gray-300'}`}>
                            <Plane size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Servicio Opcional</p>
                            <p className="text-xs font-black uppercase text-[#0B132B]">Incluir Traslado (Aeropuerto/Ferry)</p>
                          </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${formData.includeTransfer ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200'}`}>
                          {formData.includeTransfer && <Check size={16} strokeWidth={4} />}
                        </div>
                      </div>

                      {formData.includeTransfer && (
                        <div className="px-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                          <select
                            value={formData.transferId}
                            onChange={e => setFormData({ ...formData, transferId: e.target.value })}
                            className="w-full bg-gray-50 rounded-xl py-3 px-4 text-[10px] font-black text-[#0B132B] uppercase ring-2 ring-gray-100 outline-none"
                          >
                            <option value="">-- Selecciona Ruta --</option>
                            {availableTransfers.map(t => (
                              <option key={t.id} value={t.id}>{t.route} - ${t.salePrice}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Código de descuento" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500" />
                        <button onClick={applyCoupon} className="bg-[#0B132B] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-orange-600 transition-all">Aplicar</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-8 pt-4 border-t border-dashed border-gray-200">
                      <div className="flex flex-col items-start gap-2">
                        {priceInfo?.season && (
                          <span className="bg-orange-600 text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase shadow-sm border border-orange-700 flex items-center justify-center w-fit">
                            Temporada: {priceInfo.season}
                          </span>
                        )}
                        {selectedHotel.plan && (
                          <span className="bg-[#0B132B] text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase shadow-sm border border-slate-700 flex items-center justify-center w-fit">
                            PLAN: {selectedHotel.plan}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-1">
                        {discountPercent > 0 && <span className="block text-sm font-bold text-red-500 line-through mb-1">$ {totalPrice.toLocaleString()}</span>}
                        <span className="block text-3xl font-black italic text-[#0B132B] uppercase tracking-tighter shadow-sm">
                          $ {finalPrice.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Total a Pagar {discountPercent > 0 ? `(-${discountPercent}%)` : ''}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <input type="text" placeholder="Nombre completo..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-4 px-6 text-xs font-bold outline-none ring-2 ring-gray-50 focus:ring-orange-500/10" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="email" placeholder="Correo electrónico..." value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-4 px-6 text-xs font-bold outline-none ring-2 ring-gray-50 focus:ring-orange-500/10" />
                        <input type="tel" placeholder="WhatsApp (Opcional)..." value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full bg-gray-50 rounded-2xl py-4 px-6 text-xs font-bold outline-none ring-2 ring-gray-50 focus:ring-orange-500/10" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                      <button
                        onClick={enviarCotizacion}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#0B132B] py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                      >
                        <Mail size={16} /> Enviar al Correo
                      </button>

                      <button
                        disabled={isGenerating}
                        onClick={enviarCotizacionWhatsApp}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 disabled:bg-gray-400"
                      >
                        {isGenerating ? (
                          <>Generando PDF...</>
                        ) : (
                          <>
                            <MessageCircle size={16} /> Enviar por WhatsApp
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
                <ShieldCheck className="text-green-500" size={16} />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em]">Transacción Protegida - Margarita Viajes</span>
              </div>
            </div>
          </div>
      </main>


      <footer className="py-20 bg-[#0B132B] text-center text-white/20 font-black uppercase tracking-[0.5em] text-xs">
        Margarita Viajes C.A.
      </footer>
      <ToastContainer />

      {/* CONTENEDOR OCULTO PARA GENERACIÓN DE PDF (html2canvas compatible) */}
      <div id="pdf-hidden-container" className="fixed -left-[9999px] top-0 w-[800px] bg-white p-12 font-sans overflow-hidden">
        {/* ENCABEZADO DEL PDF: 3 COLUMNAS (AGENCIA - INFO - HOTEL) */}
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-6">
          
          {/* Izquierda: Logo Agencia */}
          <div className="w-32 h-20 flex items-center justify-start shrink-0">
            {activeConfig?.logoImage ? (
              <img src={activeConfig.logoImage} alt="Margarita Viajes" className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
            ) : (
              <span className="font-black text-orange-500 text-xl leading-none">Margarita Viajes</span>
            )}
          </div>

          {/* Centro: Datos Agencia */}
          <div className="flex-1 text-center px-4">
            <h2 className="font-black text-lg uppercase text-[#0B132B]">{activeConfig?.agencyName || activeConfig?.nombreEmpresa || 'Margarita Viajes'}</h2>
            <p className="font-bold text-xs text-gray-600 mt-1">RIF: {activeConfig?.rif || 'J-40156646-4'} | RTN: {activeConfig?.rtn || '13314'}</p>
            <p className="text-[11px] text-gray-500 italic mt-2 max-w-sm mx-auto leading-tight">{activeConfig?.direccion || 'Calle La Ceiba, Sector El Otro Lado del Río, La Asunción'}</p>
          </div>

          {/* Derecha: Logo Hotel */}
          <div className="w-32 h-20 flex items-center justify-end shrink-0">
            {selectedHotel?.logo || (selectedHotel as any)?.logoImage ? (
              <img src={selectedHotel?.logo || (selectedHotel as any)?.logoImage} alt={selectedHotel?.name} className="max-h-full max-w-full object-contain rounded-lg" crossOrigin="anonymous" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-[8px] text-gray-400 font-bold text-center">SIN LOGO<br />HOTEL</div>
            )}
          </div>

        </div>

        {/* RESTO DEL CONTENIDO PARA PDF (EMULACIÓN) */}
        <div className="space-y-6">
          <div className="bg-slate-100 p-4 rounded-xl flex justify-between font-black text-xs uppercase text-[#0B132B]">
            <span>Estimado Cliente: {formData.name}</span>
            <span>Folio: {quoteId}</span>
          </div>

          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 font-bold text-gray-500 text-[10px] uppercase w-1/4">Hotel/Servicio:</td>
                <td className="py-3 font-black text-[#0B132B] uppercase">{selectedHotel.name}</td>
                <td className="py-3 font-bold text-gray-500 text-[10px] uppercase w-1/4">Check-In:</td>
                <td className="py-3 font-black text-[#0B132B] uppercase">{formData.checkIn}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 font-bold text-gray-500 text-[10px] uppercase">Plan Seleccionado:</td>
                <td className="py-3 font-black text-orange-500 uppercase">{selectedHotel.plan || 'No especificado'}</td>
                <td className="py-3 font-bold text-gray-500 text-[10px] uppercase">Check-Out:</td>
                <td className="py-3 font-black text-[#0B132B] uppercase">{formData.checkOut}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 font-bold text-gray-500 text-[10px] uppercase">Categoría:</td>
                <td className="py-3 font-black text-[#0B132B] uppercase">{selectedHotel.type === 'full-day' ? 'SERVICIO FULL DAY' : (selectedHotel.rooms.find(r => r.id === formData.roomType)?.name || 'Estándar')}</td>
                <td className="py-3 font-bold text-gray-500 text-[10px] uppercase">Pasajeros:</td>
                <td className="py-3 font-black text-[#0B132B] uppercase">{formData.pax} Adultos / {formData.children} Niños</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-[#0B132B] p-8 rounded-3xl text-white flex justify-between items-center mt-10">
            <span className="font-black italic uppercase tracking-widest text-sm">Total Neto a Pagar</span>
            <span className="text-4xl font-black italic">$ {finalPrice.toLocaleString()}</span>
          </div>

          <p className="text-[10px] font-bold text-red-600 text-center mt-20 uppercase px-12 leading-relaxed">
            PRECIOS Y DISPONIBILIDAD SUJETOS A CAMBIOS AL MOMENTO DE RESERVA Y EMISIÓN | CONSULTAR SIEMPRE ANTES DE REALIZAR EL PAGO.
          </p>
        </div>
      </div>
    </div>
  );
}
