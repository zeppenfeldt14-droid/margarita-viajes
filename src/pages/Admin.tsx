import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Plus, 
  Trash2, 
  Search, 
  Briefcase, 
  Settings, 
  X, 
  Calendar,
  ShieldCheck,
  Edit2,
  Image as ImageIcon,
  Upload,
  Globe,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import { showToast, ToastContainer } from '../components/Toast';


import ReservationsList from '../components/admin/ReservationsList';
import OperationsList from '../components/admin/OperationsList';
import CustomersList from '../components/admin/CustomersList';
import MarketingPanel from '../components/admin/MarketingPanel';
import UsersList from '../components/admin/UsersList';
import { useGlobalData } from '../context/GlobalContext';
import type { Hotel, Transfer, Quotation, Operation, Reservation, ReservationStatus, QuoteStatus } from '../types';
// import { NavItem } from "../components/admin/NavItem"; // No utilizado
import { Card, SectionTitle } from "../components/admin/Common";
import { InputField } from "../components/admin/FormFields";
import {
  LOCATIONS,
  SEASON_TYPES,
  TRANSFER_ROUTES
} from "../data/inventory";
import { formatDateVisual, formatDateTimeVisual, compressImage } from '../utils/helpers';

interface AdminProps {
  user: string;
}

export default function AdminDashboard({ user }: AdminProps) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('inicio');
  const [inventorySubTab, setInventorySubTab] = useState<'hotels' | 'fullday' | 'packages' | 'transfers'>('hotels');
  const [inventorySearch, setInventorySearch] = useState('');

  useEffect(() => {
    if (location === '/admin') setActiveTab('inicio');
    else if (location.includes('/inventory')) setActiveTab('inventory');
    else if (location.includes('/quotes')) setActiveTab('quotes');
    else if (location.includes('/reservations')) setActiveTab('bookings');
    else if (location.includes('/sales')) setActiveTab('operations');
    else if (location.includes('/users')) setActiveTab('users');
    else if (location.includes('/customers')) setActiveTab('customers');
    else if (location.includes('/marketing')) setActiveTab('marketing');
    else if (location.includes('/marketing')) setActiveTab('marketing');
    else if (location.includes('/webconfig')) setActiveTab('settings');
  }, [location]);


  const [config, setConfig] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [opFilter, setOpFilter] = useState<'activas' | 'historial' | 'todas'>('activas');
  const { hotels, transfers, quotes, users, setQuotes, refreshData } = useGlobalData();

  const userModules = React.useMemo(() => {
    const level = parseInt(localStorage.getItem('user_level') || '3');
    const role = localStorage.getItem('staff_user_role');
    const alias = localStorage.getItem('staff_user_alias');
    const isMaster = level === 1 || role === 'Gerente General' || role === 'Gerente Operaciones' || alias === 'Gerente General' || alias === 'Gerente Operaciones';

    if (isMaster) {
      return { inventory: true, quotes: true, bookings: true, operations: true, users: true, customers: true, marketing: true, settings: true };
    }

    // Buscar el usuario actual en la lista global de usuarios
    const currentUser = (users || []).find((u: any) => u.name === user || u.fullName === user || u.alias === user || u.email === user);
    
    let modules: any = { inventory: false, quotes: true, bookings: false, operations: false, users: false, customers: false, marketing: false, settings: false };
    
    if (currentUser && currentUser.modules) {
      modules = { ...currentUser.modules };
    } else {
      // Fallback al localStorage
      try {
        modules = JSON.parse(localStorage.getItem('user_modules') || '{}');
      } catch (e) {}
    }

    // FORZAR REGLAS MAESTRAS (Master Document)
    // Nivel 2 y 3 nunca tienen acceso a Usuarios ni Configuración
    return {
      ...modules,
      inventory: !!modules.inventory,
      quotes: !!modules.quotes,
      bookings: !!modules.bookings,
      operations: !!modules.operations,
      customers: !!modules.customers,
      marketing: !!modules.marketing,
      users: false, // Forzado
      settings: false // Forzado
    };
  }, [user, users]);

  const [quoteFilter, setQuoteFilter] = useState<'original' | 'discounted' | 'unassigned' | 'history'>('original');
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<string>('');
  const [companions, setCompanions] = useState<{ name: string, type: string }[]>([]);
  const [technicalSheetSaved, setTechnicalSheetSaved] = useState(false);


  const recordActivity = async (action: string, details: string) => {
    try {
      const loggedUserId = localStorage.getItem('staff_user_id');
      const loggedUserName = localStorage.getItem('staff_user');
      const loggedUserAlias = localStorage.getItem('staff_user_alias');
      await api.createLog({
        user_id: loggedUserId,
        user_name: loggedUserAlias || loggedUserName || user,
        action_type: action,
        details: details
      });
    } catch (e) {
      console.error("Error recording activity:", e);
    }
  };


  // Inventario States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHotel, setNewHotel] = useState<Partial<Hotel>>({ rooms: [], seasons: [], photos: [] });
  const [newTransfer, setNewTransfer] = useState<Partial<Transfer>>({ route: '', netCost: 0, salePrice: 0 });
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.getConfig();
        setConfig(data);
      } catch (error) { }
    };
    fetchConfig();
  }, []);

  // Sincronizar acompañantes cuando se selecciona una cotización
  useEffect(() => {
    if (selectedQuote) {
      setCompanions(selectedQuote.companions || []);
      setTechnicalSheetSaved(!!selectedQuote.technicalSheet);
    } else {
      setCompanions([]);
      setTechnicalSheetSaved(false);
    }
  }, [selectedQuote]);


  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev: Record<string, any>) => ({ ...prev, [name]: value }));
  };

  const saveFullConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    try {
      const response = await api.saveFullConfig(config);
      if (response.ok) {
        showToast('✅ Configuración guardada');
        recordActivity('UPDATE_CONFIG', 'Actualizada la configuración global del sitio.');
      }
    } catch (error) { showToast('❌ Error'); }
    finally { setSavingConfig(false); }
  };


  const handleEdit = (item: Hotel | Transfer, type: string) => {
    setEditingId(item.id || null);
    if (type === 'transfer') setNewTransfer(item as Transfer);
    else setNewHotel(item as Hotel);
    setShowModal(true);
  };

  const ColorField = ({ label, name, value, onChange }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm group hover:border-orange-200 transition-all">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 relative">
          <input
            type="color"
            name={name}
            value={value}
            onChange={onChange}
            className="absolute inset-[-10px] w-[150%] h-[150%] cursor-pointer border-none p-0"
          />
        </div>
        <span className="text-[10px] font-black text-[#0B132B] uppercase tracking-tighter opacity-70">{value}</span>
      </div>
    </div>
  );

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewHotel({ rooms: [], seasons: [], photos: [] });
    setNewTransfer({ route: '', netCost: 0, salePrice: 0 });
    setRoomName('');
    setRoomCapacity('');
  };

  const addRoom = () => {
    if (!roomName || !roomCapacity) return;
    const newRoom = { id: crypto.randomUUID(), name: roomName, capacity: Number(roomCapacity) };
    setNewHotel(prev => ({ ...prev, rooms: [...(prev.rooms || []), newRoom] }));
    setRoomName(''); setRoomCapacity('');
  };

  const removeRoom = (id: string) => {
    setNewHotel(prev => ({ ...prev, rooms: prev.rooms?.filter(r => r.id !== id) }));
  };

  const addSeason = () => {
    const newSeason = {
      id: crypto.randomUUID(),
      type: 'Baja',
      startDate: '',
      endDate: '',
      roomPrices: {}
    };
    setNewHotel(prev => ({ ...prev, seasons: [...(prev.seasons || []), newSeason] }));
  };

  const removeSeason = (id: string) => {
    setNewHotel(prev => ({ ...prev, seasons: prev.seasons?.filter(s => s.id !== id) }));
  };

  const updateSeasonPrice = (seasonId: string, roomId: string, price: number) => {
    setNewHotel(prev => ({
      ...prev,
      seasons: prev.seasons?.map(s =>
        s.id === seasonId ? { ...s, roomPrices: { ...s.roomPrices, [roomId]: price } } : s
      )
    }));
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm("¿Eliminar?")) return;
    try {
      const response = type === 'transfer' ? await api.deleteTransfer(id) : await api.deleteHotel(id);
      if (response.ok) { refreshData(); showToast("Eliminado"); }
    } catch (error) { }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-inter">
      <main className="flex-1 p-6 md:p-12 print:ml-0 print:p-0 relative">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'inicio' && (
            <div className="space-y-8 animate-in fade-in duration-500 print-hidden">
              <SectionTitle>Dashboard Directivo</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-gradient-to-br from-blue-600 to-[#0B132B] text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-200 mb-4">Cotizaciones Pendientes</h3>
                  <p className="text-5xl font-black italic tracking-tighter">{(quotes || []).filter(q => q.status === 'Nuevo' || q.status === 'Atendido').length}</p>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-green-200 mb-4">Ventas del Mes</h3>
                  <p className="text-5xl font-black italic tracking-tighter">
                    {(quotes || []).filter((q: Quotation) =>
                      ['Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(q.status) &&
                      new Date(q.date || "").getMonth() === new Date().getMonth()
                    ).length}
                  </p>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200 mb-4">Tasa de Conversión</h3>
                  <p className="text-5xl font-black italic tracking-tighter">
                    {(quotes || []).length > 0 ? Math.round(((quotes || []).filter((q: Quotation) => ['Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(q.status)).length / (quotes || []).length) * 100) : 0}%
                  </p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && userModules?.inventory && (
            <div className="space-y-10 animate-in fade-in duration-500 print-hidden">
              <div className="flex items-center justify-between">
                <SectionTitle>Gestión de Inventario</SectionTitle>
                <button onClick={() => setShowModal(true)} className="bg-[#0B132B] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all flex items-center gap-3"><Plus size={18} /> Nueva Carga</button>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex bg-white/50 backdrop-blur-md p-2 rounded-3xl w-fit border border-gray-100 shadow-sm">
                  {(['hotels', 'fullday', 'packages', 'transfers'] as const).map(tab => (
                    <button key={tab} onClick={() => setInventorySubTab(tab)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === tab ? 'bg-[#0B132B] text-white shadow-lg' : 'text-gray-400 hover:text-[#0B132B]'}`}>
                      {tab === 'hotels' ? 'Hospedaje' : tab === 'fullday' ? 'Full Day' : tab === 'packages' ? 'Paquetes' : 'Traslados'}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 md:max-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o ruta..." 
                    value={inventorySearch} 
                    onChange={(e) => setInventorySearch(e.target.value)} 
                    className="bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black uppercase outline-none focus:border-orange-500 w-full" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {inventorySubTab === 'transfers' ? (
                  (transfers || [])
                  .filter((t: Transfer) => t.route?.toLowerCase().includes(inventorySearch.toLowerCase()))
                  .map(t => (
                    <Card key={t.id} className="group hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#0B132B] group-hover:bg-orange-50 transition-colors"><Briefcase size={28} /></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(t, 'transfer')} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-[#0B132B]"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(t.id!, 'transfer')} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h4 className="text-sm font-black italic text-[#0B132B] uppercase mb-1">{t.route}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Operador: {t.operator}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex flex-col text-right"><span className="text-[9px] font-black text-gray-400 uppercase">Neto</span><span className="text-[13px] font-bold text-teal-600">$ {Number(t.netCost || 0).toLocaleString()}</span></div>
                      </div>
                    </Card>
                  ))
                ) : (
                  (hotels || []).filter((h: Hotel) => {
                    const typeMap: Record<string, string> = { hotels: 'hotel', fullday: 'full-day', packages: 'package' };
                    const matchesType = h.type === typeMap[inventorySubTab];
                    const matchesSearch = h.name?.toLowerCase().includes(inventorySearch.toLowerCase());
                    return matchesType && matchesSearch;
                  }).map((h: Hotel) => (
                    <Card key={h.id} className="group hover:border-orange-500/20 transition-all">
                      <div className="aspect-video bg-gray-100 rounded-3xl mb-6 overflow-hidden relative">
                        {h.photos?.[0] ? <img src={h.photos[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={40} /></div>}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(h, 'hotel')} className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-xl text-gray-400 hover:text-[#0B132B]"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(h.id!, 'hotel')} className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-xl text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h4 className="text-sm font-black italic text-[#0B132B] uppercase truncate mb-1">{h.name}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{h.location}</p>
                        {h.plan && <span className="bg-orange-50 text-orange-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase leading-none border border-orange-100/50">{h.plan}</span>}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-8 animate-in fade-in duration-500 print-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <SectionTitle>Gestión de Cotizaciones</SectionTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-hidden border border-gray-200">
                    {(['original', 'discounted', 'unassigned', 'history'] as const).map(f => (
                      <button key={f} onClick={() => setQuoteFilter(f)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${quoteFilter === f ? 'bg-[#0B132B] text-white shadow-lg' : 'text-gray-400 hover:text-[#0B132B]'}`}>
                        {f === 'original' ? 'Originales' : f === 'discounted' ? 'Con Desc.' : f === 'unassigned' ? 'Sin Asignar' : 'Historial'}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Buscar..." value={quoteSearchTerm} onChange={(e) => setQuoteSearchTerm(e.target.value)} className="bg-white border-2 border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-[10px] font-black uppercase outline-none focus:border-orange-500 w-[250px]" />
                  </div>
                </div>
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                        <th className="pb-6 px-4">FOLIO</th>
                        <th className="pb-6 px-4">CLIENTE / HOTEL</th>
                        <th className="pb-6 px-4">FECHAS</th>
                        <th className="pb-6 px-4 text-center">TOTAL</th>
                        <th className="pb-6 px-4">ESTADO</th>
                        <th className="pb-6 px-4 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-bold">
                      {(quotes || [])
                        .filter((q: Quotation) => {
                          const matchesSearch = (q.clientName || q.client_name)?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) || q.id?.toString().includes(quoteSearchTerm);
                          if (!matchesSearch) return false;
                          if (quoteFilter === 'original') return q.status === 'Nuevo' && !String(q.id).includes('-01');
                          if (quoteFilter === 'discounted') return String(q.id).includes('-01');
                          if (quoteFilter === 'unassigned') return !q.assignedTo || q.assignedTo === '';
                          if (quoteFilter === 'history') return q.status === 'Atendido' || q.status === 'Reserva' || q.status === 'Nuevo';
                          return true;
                        })
                        .map((quote: Quotation) => (
                          <tr key={quote.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-5 px-4">
                              <div className="flex flex-col">
                                <span className="font-black italic text-orange-600">{quote.id}</span>
                                <div className="text-[8px] text-gray-400 mt-1 font-bold">{formatDateTimeVisual(quote.date || quote.created_at)}</div>
                              </div>
                            </td>
                            <td className="py-5 px-4"><div className="flex flex-col"><span className="font-black italic uppercase text-[#0B132B]">{quote.clientName || quote.client_name}</span><div className="flex items-center gap-1.5"><span className="text-[9px] text-gray-400 uppercase font-bold">{quote.hotelName || quote.hotel_name}</span>{quote.plan && <span className="bg-orange-50 text-orange-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">{quote.plan}</span>}</div></div></td>
                            <td className="py-5 px-4 text-[10px] font-black uppercase"><div className="flex items-center gap-1"><Calendar size={10} className="text-orange-500" /> {formatDateVisual(quote.checkIn || quote.check_in)}</div><div className="flex items-center gap-1 opacity-50"><Calendar size={10} /> {formatDateVisual(quote.checkOut || quote.check_out)}</div></td>
                            <td className="py-5 px-4 text-center font-black italic text-orange-600">$ {Number(quote.totalAmount || quote.total_amount).toLocaleString()}</td>
                            <td className="py-5 px-4">
                              <select
                                value={quote.status}
                                onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
                                  const newStatus = e.target.value;
                                  let newId = quote.id;

                                  if (newStatus === 'Reserva') {
                                    const totalExpected = parseInt(quote.pax || '0') + parseInt(quote.children || '0');
                                    const currentCompanions = (quote as Quotation).companions || [];
                                    const hasEmptyNames = currentCompanions.some((c: { name: string }) => !c.name || c.name.trim() === '');

                                    if (currentCompanions.length !== totalExpected || hasEmptyNames || (!quote.technicalSheet && !technicalSheetSaved)) {
                                      alert('Debe cargar la ficha técnica de todos los pasajeros (con nombre y apellido) antes de pasar a Reserva');
                                      return;
                                    }
                                  }

                                  if (newStatus === 'Reserva') {
                                    try {
                                      // 1. Generar ID Secuencial R00...
                                      let nextResNum = 1001;
                                      const resData = await api.getReservations().catch(() => []);
                                      if (Array.isArray(resData) && resData.length > 0) {
                                        const rIds = resData
                                          .map((r: Reservation) => r.id?.toString() || '')
                                          .filter((id: string) => id.startsWith('R'))
                                          .map((id: string) => parseInt(id.replace(/\D/g, '')) || 0);
                                        if (rIds.length > 0) nextResNum = Math.max(...rIds) + 1;
                                      }
                                      const nextResId = 'R' + nextResNum.toString().padStart(6, '0');

                                      const reservationData = {
                                        id: nextResId,
                                        quoteId: quote.id,
                                        originalQuoteId: quote.originalQuoteId || quote.id,
                                        clientName: quote.clientName || quote.client_name,
                                        email: quote.email,
                                        whatsapp: quote.whatsapp,
                                        hotelId: quote.hotelId || quote.hotel_id,
                                        hotelName: quote.hotelName || quote.hotel_name,
                                        checkIn: quote.checkIn || quote.check_in,
                                        checkOut: quote.checkOut || quote.check_out,
                                        roomType: quote.roomType || quote.room_type,
                                        pax: quote.pax,
                                        children: quote.children,
                                        infants: quote.infants,
                                        totalAmount: quote.totalAmount || quote.total_amount,
                                        discount: quote.discount || null,
                                        discountAmount: quote.discountAmount || null,
                                        companions: (quote as Quotation).companions || [],
                                        technicalSheet: (quote as Quotation).technicalSheet || null,
                                        plan: quote.plan || null,
                                        status: 'Confirmada' as ReservationStatus
                                      };

                                      const reservationRes = await api.createReservation(reservationData as Partial<Reservation>);

                                      if (!reservationRes.ok) {
                                        showToast('Error al crear la reserva');
                                        return;
                                      }
                                    } catch (error) {
                                      console.error('Error creating reservation:', error);
                                      showToast('Error al crear la reserva');
                                      return;
                                    }
                                  }

                                  try {
                                      const response = await api.updateQuote(quote.id, {
                                        status: newStatus as QuoteStatus,
                                        id: newId
                                      });

                                    if (response.ok) {
                                      setQuotes(quotes.map((q: Quotation) => q.id === quote.id ? { ...q, status: newStatus as QuoteStatus, id: newId } : q));
                                      showToast(`Estado cambiado a: ${newStatus}${newStatus === "Reserva" ? " y Reserva creada" : ""}`);
                                      recordActivity('UPDATE_QUOTE_STATUS', `Cambiado estado de folio ${quote.id} a ${newStatus}`);
                                    } else {
                                      const errorData = await response.json().catch(() => ({}));
                                      showToast(`Error: ${errorData.message || 'No se pudo actualizar el estado'}`);
                                    }
                                  } catch (error) {
                                    console.error('Error updating status:', error);
                                    showToast('Error de conexión al actualizar el estado');
                                  }
                                }}
                                className={`px-3 py-1.2 rounded-full text-[8px] font-black uppercase tracking-widest cursor-pointer border-0 ${quote.status === 'Nuevo' ? 'bg-red-500 text-white' :
                                    quote.status === 'Atendido' ? 'bg-yellow-500 text-white' :
                                      quote.status === 'Reserva' ? 'bg-blue-500 text-white' :
                                        'bg-green-500 text-white'
                                  }`}
                              >
                                <option value="Nuevo" disabled={['Reserva', 'Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(quote.status)}>Nuevo</option>
                                <option value="Atendido" disabled={['Reserva', 'Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(quote.status)}>Atendido</option>
                              </select>
                            </td>
                            <td className="py-5 px-4 text-right"><button onClick={() => setSelectedQuote(quote)} className="bg-[#0B132B] text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-orange-600 transition-all">VER</button></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'bookings' && userModules?.bookings && (
            <ReservationsList hotels={hotels} />
          )}

          {activeTab === 'operations' && userModules?.operations && (
            <OperationsList selectedOperation={selectedOperation} setSelectedOperation={setSelectedOperation} opFilter={opFilter} setOpFilter={setOpFilter} />
          )}


          {activeTab === 'customers' && userModules?.customers && (
            <CustomersList quotes={quotes} />
          )}

          {activeTab === 'users' && typeof UsersList !== 'undefined' && <UsersList />}

          {activeTab === 'marketing' && userModules?.marketing && (
            <MarketingPanel quotes={quotes} config={config} />
          )}

          {activeTab === 'settings' && userModules?.settings && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <SectionTitle>Configuración de la Página Web</SectionTitle>

              <Card className="shadow-xl border-none ring-1 ring-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0B132B] mb-8 pb-4 border-b border-gray-100">Identidad Visual y Navegación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Logo del Sitio</p>
                      <div className="h-44 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group hover:bg-gray-100 transition-all">
                        {config.logoImage ? <img src={config.logoImage} className="max-h-24 object-contain" /> : <div className="text-center"><Upload size={32} className="text-gray-300 mx-auto mb-3 group-hover:text-orange-500 transition-colors" /><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subir Logo</p></div>}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = async () => { const comp = await compressImage(reader.result as string, 400, 400); handleConfigChange({ target: { name: 'logoImage', value: comp } } as unknown as React.ChangeEvent<HTMLInputElement>); }; reader.readAsDataURL(file); } }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Banner Principal</p>
                      <div className="h-44 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group hover:bg-gray-100 transition-all">
                        {config.bannerImage ? <img src={config.bannerImage} className="w-full h-full object-cover rounded-[2.5rem]" /> : <div className="text-center"><Upload size={32} className="text-gray-300 mx-auto mb-3 group-hover:text-blue-500 transition-colors" /><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subir Banner</p></div>}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = async () => { const comp = await compressImage(reader.result as string, 1920, 1080); handleConfigChange({ target: { name: 'bannerImage', value: comp } } as unknown as React.ChangeEvent<HTMLInputElement>); }; reader.readAsDataURL(file); } }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Colección de Colores</p>
                      <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                        <ColorField label="Franja Superior" name="colorFranja" value={config.colorFranja || '#ffffff'} onChange={handleConfigChange} />
                        <ColorField label="Título Banner" name="colorTitulo" value={config.colorTitulo || '#0B132B'} onChange={handleConfigChange} />
                        <ColorField label="Títulos Secciones" name="colorSubtitulo" value={config.colorSubtitulo || '#616365'} onChange={handleConfigChange} />
                        <ColorField label="Resaltados" name="colorFuentesSub" value={config.colorFuentesSub || '#ea580c'} onChange={handleConfigChange} />
                      </div>
                    </div>
                    <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-4 flex items-center gap-2"><Globe size={16} /> Resumen de la Plataforma</h5>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-blue-100/50 pb-2"><span className="text-[11px] font-bold text-blue-600/70">Usuarios Activos</span><span className="text-sm font-black italic text-blue-900">{(users || []).filter(u => u.active === true).length}</span></div>
                        <div className="flex justify-between items-center border-b border-blue-100/50 pb-2"><span className="text-[11px] font-bold text-blue-600/70">Hoteles en Inventario</span><span className="text-sm font-black italic text-blue-900">{hotels?.length || 0}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-blue-600/70">Cotizaciones Totales</span><span className="text-sm font-black italic text-blue-900">{quotes?.length || 0}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="shadow-xl border-none ring-1 ring-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0B132B] mb-8 pb-4 border-b border-gray-100">Textos y Contenido</h3>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField name="agencyName" label="Nombre de la Empresa" value={config.agencyName || config.nombreEmpresa || ''} onChange={handleConfigChange} />
                    <InputField name="hotelesTitulo" label="Título Sección Hoteles" value={config.hotelesTitulo || ''} onChange={handleConfigChange} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField name="hotelesSubtitulo" label="Subtítulo Hoteles" value={config.hotelesSubtitulo || ''} onChange={handleConfigChange} />
                    <InputField name="fulldaysTitulo" label="Título Sección Full Days" value={config.fulldaysTitulo || ''} onChange={handleConfigChange} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Texto "Quiénes Somos"</p>
                    <textarea name="quienesSomos" value={config.quienesSomos || ''} onChange={handleConfigChange} className="w-full bg-gray-50 rounded-3xl p-6 text-sm font-bold min-h-[120px] outline-none ring-2 ring-gray-100 transition-all focus:ring-orange-500/20 resize-none text-[#0B132B]" />
                  </div>
                </div>
              </Card>

              <Card className="shadow-xl border-none ring-1 ring-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0B132B] mb-8 pb-4 border-b border-gray-100">Información de Contacto Pública</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <InputField name="telefono" label="Teléfono / WhatsApp" value={config.telefono || ''} onChange={handleConfigChange} />
                  <InputField name="correo" label="Correo Electrónico Público" value={config.correo || ''} onChange={handleConfigChange} />
                </div>
                <div className="mb-6">
                  <InputField name="direccion" label="Dirección Física" value={config.direccion || ''} onChange={handleConfigChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField name="rif" label="RIF de la Empresa" value={config.rif || ''} onChange={handleConfigChange} />
                  <InputField name="rtn" label="RTN (Opcional)" value={config.rtn || ''} onChange={handleConfigChange} />
                </div>
              </Card>

              <button onClick={(e) => saveFullConfig(e)} disabled={savingConfig} className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-3 ${savingConfig ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-[#0B132B] text-white hover:bg-orange-600 hover:shadow-orange-500/30 active:scale-[0.98]'}`}>
                {savingConfig ? 'Guardando cambios...' : <><Settings size={20} /> Guardar Configuración Web</>}
              </button>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-[#0B132B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

            {/* ENCABEZADO FIJO */}
            <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <h3 className="text-lg md:text-xl font-black italic text-[#0B132B] uppercase tracking-tighter">
                {editingId ? 'Editar' : 'Nueva Carga de'} {inventorySubTab === 'hotels' ? 'Hospedaje' : inventorySubTab === 'transfers' ? 'Traslado' : inventorySubTab === 'fullday' ? 'Full Day' : 'Paquete'}
              </h3>
              <button onClick={handleCloseModal} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors"><X size={20} /></button>
            </div>

            {/* CUERPO CON SCROLL INTERNO */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                {/* COLUMNA 1 */}
                <div className="space-y-6">
                  {inventorySubTab === 'transfers' ? (
                    <div className="grid grid-cols-1 gap-6">
                      <InputField name="operator" label="Operador" value={newTransfer.operator || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransfer(prev => ({ ...prev, operator: e.target.value }))} />
                      <select className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border-none outline-none ring-2 ring-gray-100" value={newTransfer.route} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTransfer(prev => ({ ...prev, route: e.target.value }))}><option value="">Seleccionar Ruta...</option>{TRANSFER_ROUTES.map((r: string) => <option key={r} value={r}>{r}</option>)}</select>
                      <InputField name="email" label="Email del Operador" value={newTransfer.email || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransfer(prev => ({ ...prev, email: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-6"><InputField name="netCost" label="Neto ($)" value={String(newTransfer.netCost || '')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransfer(prev => ({ ...prev, netCost: Number(e.target.value) }))} /><InputField name="salePrice" label="Venta ($)" value={String(newTransfer.salePrice || '')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransfer(prev => ({ ...prev, salePrice: Number(e.target.value) }))} /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-8">
                      <div className="grid grid-cols-1 gap-5">
                        <InputField name="name" label="Nombre" value={newHotel.name || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHotel(prev => ({ ...prev, name: e.target.value }))} />
                        <select className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border-none outline-none ring-2 ring-gray-100" value={newHotel.location} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewHotel(prev => ({ ...prev, location: e.target.value }))}><option value="">Ubicación...</option>{LOCATIONS.map((l: string) => <option key={l} value={l}>{l}</option>)}</select>
                        <textarea value={newHotel.description || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewHotel(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-bold min-h-[80px] outline-none ring-2 ring-gray-100" placeholder="Descripción..." />
                        <InputField name="email" label="Email del Hotel/Servicio" value={newHotel.email || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHotel(prev => ({ ...prev, email: e.target.value }))} />

                        {(inventorySubTab === 'hotels' || inventorySubTab === 'packages') && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plan de Comidas</p>
                            <select
                              className="w-full bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border-none outline-none ring-2 ring-gray-100 transition-all focus:ring-orange-500/20"
                              value={newHotel.plan || ''}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewHotel(prev => ({ ...prev, plan: e.target.value as 'TODO INCLUIDO' | 'SOLO DESAYUNO' }))}
                            >
                              <option value="">Seleccionar Plan...</option>
                              <option value="TODO INCLUIDO">TODO INCLUIDO</option>
                              <option value="SOLO DESAYUNO">SOLO DESAYUNO</option>
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                          <div><SectionTitle>Logo</SectionTitle><div className="h-28 bg-gray-50 rounded-2xl border-2 border-dashed flex items-center justify-center relative hover:bg-gray-100 transition-colors">{newHotel.logo ? <img src={newHotel.logo} className="w-full h-full object-contain" /> : <Upload size={28} className="text-gray-300" />}<input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = async () => { const comp = await compressImage(reader.result as string, 400, 400); setNewHotel(p => ({ ...p, logo: comp })); }; reader.readAsDataURL(file); } }} /></div></div>
                          <div><SectionTitle>Fotos ({newHotel.photos?.length || 0}/5)</SectionTitle>
                            <div className="space-y-2">
                              <div className="h-16 bg-gray-50 rounded-2xl border-2 border-dashed flex items-center justify-center relative hover:bg-gray-100 transition-colors"><Camera size={20} className="text-gray-400" /><span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-2">Agregar fotos</span><input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e: React.ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files || []).slice(0, 5 - (newHotel.photos?.length || 0)).forEach((f: File) => { const r = new FileReader(); r.onloadend = async () => { const c = await compressImage(r.result as string, 1200, 800); setNewHotel(p => ({ ...p, photos: [...(p.photos || []), c] })); }; r.readAsDataURL(f); }); }} /></div>
                              {newHotel.photos && newHotel.photos.length > 0 && (
                                <div className="grid grid-cols-5 gap-2">
                                  {newHotel.photos.map((photo: string, idx: number) => (
                                    <div key={idx} className="relative h-10 bg-gray-50 rounded-xl overflow-hidden group">
                                      <img src={photo} className="w-full h-full object-cover" />
                                      <button onClick={() => setNewHotel(p => ({ ...p, photos: p.photos?.filter((_, i) => i !== idx) }))} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <SectionTitle>{inventorySubTab === 'fullday' ? 'Variantes de Tarifa' : 'Tipos de Habitación'}</SectionTitle>
                        <div className="flex gap-3">
                          <input placeholder={inventorySubTab === 'fullday' ? 'Descripción (Ej: Tarifa Adulto)' : 'Nombre (Ej: Doble)'} value={roomName} onChange={e => setRoomName(e.target.value)} className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                          <input placeholder="Capacidad" type="number" value={roomCapacity} onChange={e => setRoomCapacity(e.target.value)} className="w-24 bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                          <button onClick={addRoom} className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-colors"><Plus size={20} /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                          {newHotel.rooms?.map((r: { id: string, name: string, capacity: number }) => (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                              <span className="text-xs font-black uppercase italic text-[#0B132B]">{r.name} - <span className="text-gray-400 font-bold">{r.capacity} Pax</span></span>
                              <button onClick={() => removeRoom(r.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* COLUMNA 2 */}
                <div className="space-y-6 flex flex-col h-full">
                  {inventorySubTab !== 'transfers' && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between">
                        <SectionTitle>Matriz de Tarifas por Temporada</SectionTitle>
                        <button onClick={addSeason} className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 px-4 py-2 rounded-xl transition-colors"><Plus size={14} /> Añadir</button>
                      </div>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {newHotel.seasons?.map((s: { id: string, type: string, startDate: string, endDate: string, roomPrices: Record<string, number> }) => (
                          <div key={s.id} className="p-5 bg-white rounded-[1.5rem] border-2 border-gray-50 space-y-4 relative group hover:border-orange-200 transition-colors shadow-sm">
                            <button onClick={() => removeSeason(s.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"><X size={14} /></button>
                            <div className="grid grid-cols-3 gap-3 pr-10">
                              <select className="bg-gray-50 rounded-xl px-3 py-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-orange-500/20" value={s.type} onChange={e => {
                                const val = e.target.value;
                                setNewHotel(prev => ({ ...prev, seasons: prev.seasons?.map(item => item.id === s.id ? { ...item, type: val } : item) }));
                              }}>
                                {SEASON_TYPES.map((t: string) => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <input type="date" className="bg-gray-50 rounded-xl px-3 py-3 text-[10px] font-black outline-none focus:ring-2 focus:ring-orange-500/20" value={s.startDate} onChange={e => {
                                const val = e.target.value;
                                setNewHotel(prev => ({ ...prev, seasons: prev.seasons?.map(item => item.id === s.id ? { ...item, startDate: val } : item) }));
                              }} />
                              <input type="date" className="bg-gray-50 rounded-xl px-3 py-3 text-[10px] font-black outline-none focus:ring-2 focus:ring-orange-500/20" value={s.endDate} onChange={e => {
                                const val = e.target.value;
                                setNewHotel(prev => ({ ...prev, seasons: prev.seasons?.map(item => item.id === s.id ? { ...item, endDate: val } : item) }));
                              }} />
                            </div>
                            <div className="space-y-2 pt-3 border-t border-dashed border-gray-200">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Precios por Habitación ($)</p>
                              <div className="grid grid-cols-2 gap-3">
                                {newHotel.rooms?.map((r: { id: string, name: string, capacity: number }) => (
                                  <div key={r.id} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#0B132B] truncate flex-1">{r.name}</span>
                                    <input
                                      type="number"
                                      className="w-20 bg-gray-50 rounded-lg px-3 py-2 text-xs font-black outline-none border-none focus:ring-2 focus:ring-orange-500/20 text-right"
                                      value={s.roomPrices[r.id] || 0}
                                      onChange={e => updateSeasonPrice(s.id, r.id, Number(e.target.value))}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOTÓN GUARDAR FIJO AL FONDO */}
                  <div className="pt-4 border-t border-gray-100 mt-auto shrink-0">
                    <button onClick={async () => {
                      let hotelData = { ...newHotel };
                      let transferData = { ...newTransfer };
                      if (!editingId) {
                        if (inventorySubTab !== 'transfers') {
                          hotelData = { ...hotelData, id: crypto.randomUUID(), type: inventorySubTab === 'hotels' ? 'hotel' : inventorySubTab === 'fullday' ? 'full-day' : 'package' };
                        } else {
                          transferData = { ...transferData, id: crypto.randomUUID() };
                        }
                      }
                      const body = inventorySubTab === 'transfers' ? transferData : hotelData;
                      try {
                        const response = inventorySubTab === 'transfers'
                          ? await api.saveTransfer(body, editingId || null)
                          : await api.saveHotel(body, editingId || null);
                        if (!response.ok) {
                          let errorMsg = 'Error saving';
                          try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (e) { errorMsg = `Error ${response.status}: ${response.statusText}`; }
                          showToast(errorMsg); return;
                        }
                        refreshData(); handleCloseModal(); showToast("Guardado correctamente");
                      } catch (error: any) {
                        console.error('Error saving:', error); showToast(`Error: ${error.message}`);
                      }
                    }} className="w-full bg-[#0B132B] text-white py-5 rounded-[1.5rem] font-black text-[11px] md:text-xs uppercase tracking-widest shadow-2xl hover:bg-[#ea580c] transition-all active:scale-[0.98]">
                      {editingId ? 'ACTUALIZAR EN INVENTARIO' : 'GUARDAR EN BASE DE DATOS'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES */}
      {selectedQuote && (() => {
        const hasExistingDiscount = Number(selectedQuote.discount || 0) > 0 || Number(selectedQuote.discountAmount || 0) > 0;
        const baseAmount = hasExistingDiscount
          ? Number(selectedQuote.totalAmount || selectedQuote.total_amount) + Number(selectedQuote.discountAmount || 0)
          : Number(selectedQuote.totalAmount || selectedQuote.total_amount || 0);
        const discountPercent = discount > 0 ? discount : (hasExistingDiscount ? Number(selectedQuote.discount) : (customDiscount ? parseFloat(customDiscount) : 0));
        const discountAmount = baseAmount * (discountPercent / 100);
        const finalTotal = hasExistingDiscount
          ? Number(selectedQuote.totalAmount || selectedQuote.total_amount)
          : baseAmount - discountAmount;

        return (
          <div className={`fixed inset-0 bg-[#0B132B]/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 print-hidden`}>
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 print-card print:max-w-none print:w-full print:shadow-none print:rounded-none print:max-h-none print:block">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-2xl font-black italic text-[#0B132B] uppercase tracking-tighter">
                    Detalles de Cotización
                  </h3>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-sm font-black text-[#0B132B] uppercase">FOLIO: {selectedQuote.id}</p>
                    {(selectedQuote.previousId || selectedQuote.originalQuoteId) && (
                      <p className="text-[10px] font-bold text-orange-500 italic">
                        {selectedQuote.previousId && selectedQuote.previousId !== selectedQuote.originalQuoteId ? `Viene de: ${selectedQuote.previousId} | ` : ''} 
                        {selectedQuote.originalQuoteId ? `Original: ${selectedQuote.originalQuoteId}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => { setSelectedQuote(null); setDiscount(0); setCustomDiscount(''); setCompanions([]); }} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-sm font-black italic text-[#0B132B] uppercase">{selectedQuote.clientName || selectedQuote.client_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hotel</p>
                    <p className="text-sm font-bold text-[#0B132B]">{selectedQuote.hotelName || selectedQuote.hotel_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correo</p>
                    <p className="text-sm font-bold text-[#0B132B]">{selectedQuote.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                    <p className="text-sm font-bold text-[#0B132B]">{selectedQuote.whatsapp || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-in</p>
                    <p className="text-sm font-black italic text-[#0B132B]">{formatDateVisual(selectedQuote.checkIn || selectedQuote.check_in)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-out</p>
                    <p className="text-sm font-black italic text-[#0B132B]">{formatDateVisual(selectedQuote.checkOut || selectedQuote.check_out)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Habitación</p>
                    <p className="text-sm font-bold text-[#0B132B]">{selectedQuote.roomType || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan de Comidas</p>
                    <p className="text-sm font-black text-orange-600 uppercase">{selectedQuote.plan || selectedQuote.hotel_plan || 'No especificado'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pasajeros</p>
                    <p className="text-sm font-bold text-[#0B132B]">
                      {selectedQuote.pax} Adultos, {selectedQuote.children || 0} Niños, {selectedQuote.infants || 0} Infantes
                    </p>
                  </div>
                </div>

                {hasExistingDiscount && (
                  <div className="bg-gray-50 p-6 rounded-[2rem]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Original (Sin Descuento)</span>
                      <span className="text-xl font-black italic text-gray-400 line-through">$ {baseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <span className="text-[10px] font-black text-orange-500 uppercase">Descuento Otorgado ({selectedQuote.discount || discountPercent}%)</span>
                      <span className="text-lg font-black italic text-orange-500">-$ {(selectedQuote.discountAmount || discountAmount).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {!hasExistingDiscount && !selectedQuote.originalQuoteId && (
                  <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-200 space-y-4">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Aplicar Descuento Comercial</p>
                    <div className="flex gap-3">
                      <button onClick={() => { setDiscount(4); setCustomDiscount(''); }} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${discount === 4 ? 'bg-orange-500 text-white' : 'bg-white text-orange-500 border border-orange-200'}`}>4%</button>
                      <button onClick={() => { setDiscount(6); setCustomDiscount(''); }} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${discount === 6 ? 'bg-orange-500 text-white' : 'bg-white text-orange-500 border border-orange-200'}`}>6%</button>
                      <input type="number" placeholder="Personalizado %" value={customDiscount} onChange={(e) => { setCustomDiscount(e.target.value); setDiscount(0); }} className="flex-1 bg-white px-4 py-3 rounded-xl font-black text-[10px] uppercase outline-none border border-orange-200" />
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                        <span className="text-[10px] font-black text-orange-600 uppercase">Descuento ({discountPercent}%)</span>
                        <span className="text-lg font-black italic text-orange-600">-$ {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-green-50 p-6 rounded-[2rem] border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Total Final a Pagar</span>
                    <span className="text-3xl font-black italic text-green-600">$ {finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button onClick={async () => {
                  if (discountPercent > 0) {
                    try {
                      // 1. Generar PDF antes de guardar
                      showToast('Generando cotización con descuento...');

                      const newQuoteId = `${selectedQuote.id}-01`;
                      const newQuoteData = {
                        ...selectedQuote,
                        id: newQuoteId,
                        originalQuoteId: selectedQuote.id,
                        discount: discountPercent,
                        discountAmount: discountAmount,
                        finalAmount: finalTotal,
                        totalAmount: finalTotal,
                        status: 'Atendido' as QuoteStatus
                      };
                      
                      const createRes = await api.createQuote(newQuoteData);
                      if (!createRes.ok) {
                        const errorData = await createRes.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Error del servidor al crear presupuesto con descuento');
                      }

                      const updateRes = await api.updateQuote(selectedQuote.id, { status: 'Atendido' as QuoteStatus });
                      if (!updateRes.ok) {
                        console.warn('No se pudo marcar la cotización original como Atendida, pero el descuento fue generado.');
                      } else {
                        recordActivity('UPDATE_QUOTE_STATUS', `Cotización ${selectedQuote.id} marcada como ATENDIDO al generar descuento.`);
                      }

                      showToast(`Exito: Cotización enviada.`);
                      recordActivity('APPLY_DISCOUNT', `Aplicado descuento de ${discountPercent}% a folio ${selectedQuote.id}. Nuevo folio: ${newQuoteId}`);
                      refreshData();
                      setSelectedQuote(null);
                    } catch (error: any) {
                      console.error('Error in discount application:', error);
                      showToast(`Error: ${error.message || 'No se pudo aplicar el descuento'}`);
                    }
                  } else {
                    showToast('Selecciona un porcentaje de descuento');
                  }
                }} className="w-full bg-[#0B132B] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                  Generar y Enviar con Descuento
                </button>


                {selectedQuote.pdfBase64 && (
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => {
                        const folio = selectedQuote.id || selectedQuote.folio;
                        window.open(`https://margarita-viajes.onrender.com/api/public/quotes/${folio}/pdf`, '_blank');
                      }} 
                      className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Globe size={16} /> Ver PDF Guardado en Servidor
                    </button>
                    <button 
                      onClick={() => {
                        const pdfLink = `https://margarita-viajes.onrender.com/api/public/quotes/${selectedQuote.id}/pdf`;
                        const whatsappText = encodeURIComponent(`Hola ${selectedQuote.clientName || selectedQuote.client_name}, aquí tienes tu cotización en PDF: ${pdfLink}`);
                        window.open(`https://wa.me/${(selectedQuote.whatsapp || '').replace(/\D/g, '')}?text=${whatsappText}`, '_blank');
                      }} 
                      className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Briefcase size={16} /> Contactar por WhatsApp
                    </button>
                  </div>
                )}

                <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Lista de Pasajeros</p>
                    {(!['Reserva', 'Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(selectedQuote.status)) && (
                      <button onClick={() => setCompanions([...companions, { name: '', type: 'Adulto' }])} className="text-[9px] font-black text-purple-600 uppercase flex items-center gap-1 hover:text-purple-700">
                        <Plus size={14} /> Agregar
                      </button>
                    )}
                  </div>
                  {companions.length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-2">Sin acompañantes agregados</p>
                  ) : (
                    <div className="space-y-2">
                      {companions.map((comp, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" value={comp.name} onChange={(e) => {
                            const newComps = [...companions];
                            newComps[idx].name = e.target.value;
                            setCompanions(newComps);
                          }} placeholder="Nombre completo" className="flex-1 bg-white px-3 py-2 rounded-lg text-xs font-bold outline-none" />
                          <select
                            disabled={['Reserva', 'Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(selectedQuote.status)}
                            value={comp.type}
                            onChange={(e) => {
                              const newComps = [...companions];
                              newComps[idx].type = e.target.value;
                              setCompanions(newComps);
                            }}
                            className="bg-white px-3 py-2 rounded-lg text-[9px] font-black uppercase outline-none"
                          >
                            <option value="Adulto">Adulto</option>
                            <option value="Niño">Niño</option>
                            <option value="Infante">Infante</option>
                          </select>
                          {(!['Reserva', 'Venta Cerrada', 'Venta Concretada', 'Confirmada'].includes(selectedQuote.status)) && (
                            <button onClick={() => setCompanions(companions.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 mt-6">
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("staff_token");
                      if (!token) return alert('Error: No hay sesión activa.');

                      // 1. Corrección matemática: Sumar Pax + Niños + Infantes
                      const totalExpected = Number(selectedQuote.pax || 0) + Number(selectedQuote.children || 0) + Number(selectedQuote.infants || 0);

                      if (companions.length !== totalExpected) {
                        alert(`⚠️ Error: La cantidad de pasajeros en la lista (${companions.length}) no coincide con el total de viajeros (${totalExpected}).`);
                        return;
                      }

                      const hasEmptyNames = companions.some(c => !c.name || c.name.trim() === '');
                      if (hasEmptyNames) {
                        alert('⚠️ Error: Todos los pasajeros deben tener nombre y apellido.');
                        return;
                      }

                      try {
                        const technicalSheet = { savedAt: new Date().toISOString(), passengers: companions };

                        const quoteUpdateRes = await api.updateQuote(selectedQuote.id, { companions, technicalSheet });

                        if (!quoteUpdateRes.ok) throw new Error('Error al actualizar la base de datos');

                        setSelectedQuote(prev => prev ? { ...prev, companions, technicalSheet } : null);
                        setTechnicalSheetSaved(true);
                        if (typeof refreshData === 'function') refreshData();

                        showToast('✅ Lista de pasajeros guardada con éxito');
                        recordActivity('SAVE_PASSENGERS', `Guardada ficha técnica / lista de pasajeros para folio ${selectedQuote.id}`);
                      } catch (error) {
                        console.error(error);
                        showToast('❌ Error de conexión al guardar la ficha técnica.');
                      }
                    }}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShieldCheck size={16} /> Guardar Lista de Pasajeros
                  </button>

                  <button
                    onClick={async () => {
                      const totalExpected = Number(selectedQuote.pax || 0) + Number(selectedQuote.children || 0) + Number(selectedQuote.infants || 0);
                      const currentCompanions = selectedQuote.companions || companions || [];
                      const hasEmptyNames = currentCompanions.some((c: { name: string }) => !c.name || c.name.trim() === '');

                      // 3. Validación estricta antes de pasar a reserva
                      if (currentCompanions.length !== totalExpected || hasEmptyNames || (!selectedQuote.technicalSheet && !technicalSheetSaved)) {
                        alert('⚠️ ACCIÓN DENEGADA: Debe guardar la lista de pasajeros completa y sin nombres vacíos antes de pasar a Reserva.');
                        return;
                      }

                      try {
                        // 4. Crear la Reserva con ID Secuencial R00...
                        let nextResNum = 1001;
                        const resData = await api.getReservations().catch(() => []);
                        if (Array.isArray(resData) && resData.length > 0) {
                          const rIds = resData
                            .map((r: any) => r.id?.toString() || '')
                            .filter((id: string) => id.startsWith('R'))
                            .map((id: string) => parseInt(id.replace(/\D/g, '')) || 0);
                          if (rIds.length > 0) nextResNum = Math.max(...rIds) + 1;
                        }
                        const nextResId = 'R' + nextResNum.toString().padStart(6, '0');

                        const reservationData = {
                          id: nextResId,
                          previousId: selectedQuote.id,
                          originalQuoteId: selectedQuote.originalQuoteId || selectedQuote.id,
                          quoteId: selectedQuote.id,
                          clientName: selectedQuote.clientName || selectedQuote.client_name,
                          email: selectedQuote.email,
                          whatsapp: selectedQuote.whatsapp,
                          hotelId: selectedQuote.hotelId || selectedQuote.hotel_id,
                          hotelName: selectedQuote.hotelName || selectedQuote.hotel_name,
                          checkIn: selectedQuote.checkIn || selectedQuote.check_in,
                          checkOut: selectedQuote.checkOut || selectedQuote.check_out,
                          roomType: selectedQuote.roomType || selectedQuote.room_type,
                          pax: selectedQuote.pax,
                          children: selectedQuote.children,
                          infants: selectedQuote.infants,
                          totalAmount: selectedQuote.totalAmount || selectedQuote.total_amount,
                          discount: selectedQuote.discount || null,
                          discountAmount: selectedQuote.discountAmount || null,
                          companions: currentCompanions,
                          technicalSheet: selectedQuote.technicalSheet || { savedAt: new Date().toISOString(), passengers: currentCompanions },
                          plan: selectedQuote.plan || (selectedQuote as any).hotel_plan || 'No especificado',
                          status: 'Confirmada' as ReservationStatus
                        };

                        const resCreate = await api.createReservation(reservationData as Partial<Reservation>);

                        if (!resCreate.ok) throw new Error('Error al crear la reserva');

                        // 5. Actualizar el estado de la cotización
                        const resUpdate = await api.updateQuote(selectedQuote.id, { status: 'Reserva' as QuoteStatus });

                        if (!resUpdate.ok) throw new Error('Error al actualizar cotización');

                        showToast('✅ ¡Éxito! Cotización pasada a Reserva');
                        recordActivity('CREATE_RESERVATION', `Creada reserva ${nextResId} desde folio ${selectedQuote.id}`);
                        if (typeof refreshData === 'function') refreshData();
                        setSelectedQuote(null);

                      } catch (error) {
                        console.error(error);
                        showToast('❌ Error al procesar el pase a reserva.');
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Briefcase size={16} /> Pasar a Reserva
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedQuote.status === 'Nuevo' ? 'bg-red-500 text-white' :
                      selectedQuote.status === 'Atendido' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                    }`}>
                    {selectedQuote.status}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">Fecha de solicitud: {formatDateTimeVisual(selectedQuote.date || selectedQuote.created_at)}</span>
                </div>
              </div>
              <div className="p-8 border-t border-gray-100 flex gap-4">
                <button onClick={() => { setSelectedQuote(null); setDiscount(0); setCustomDiscount(''); setCompanions([]); }} className="flex-1 bg-gray-100 text-[#0B132B] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      <ToastContainer />
    </div>
  );
}
