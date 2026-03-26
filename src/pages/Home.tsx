import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Instagram,
  Facebook,
  MapPin,
  Mail,
  Phone,
  Settings,
  Hotel as HotelIcon
} from "lucide-react";
import { HotelCard, FullDayCard } from "../components/public/Cards";
import { api } from "../services/api";
import { type Hotel } from "../data/inventory";

interface HomeProps {
  onAdminClick: () => void;
}

export default function Home({ onAdminClick }: HomeProps) {
  const [, setLocation] = useLocation();

  // --- ESTADO: HOTELES Y PAQUETES ---
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [, setLoading] = useState(true);
  const [randomHotels, setRandomHotels] = useState<Hotel[]>([]);
  const [randomFullDays, setRandomFullDays] = useState<Hotel[]>([]);
  const [randomPackages, setRandomPackages] = useState<Hotel[]>([]);
  const [config, setConfig] = useState<any>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>(['hotels', 'fulldays', 'packages']);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getConf = (key: string) => {
    const prefix = isMobile ? 'mobile_' : 'pc_';
    return config[prefix + key] || config[key];
  };

  // --- UTILIDAD: SHUFFLE ---
  const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotelsData, configData] = await Promise.all([
          api.getHotels(),
          api.getConfig()
        ]);
        
        const hList = Array.isArray(hotelsData) ? hotelsData : [];
        setHotels(hList);
        setConfig(configData);

        const h = hList.filter((item: any) => item.type === 'hotel');
        const f = hList.filter((item: any) => item.type === 'full-day');
        const p = hList.filter((item: any) => item.type === 'package');

        setRandomHotels(shuffle(h));
        setRandomFullDays(shuffle(f));
        setRandomPackages(shuffle(p));
        setSectionOrder(shuffle(['hotels', 'fulldays', 'packages']));
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    hotel: "",
    pax: "2"
  });

  const handleQuoteRedirect = () => {
    if (!formData.hotel) {
      alert("Por favor selecciona un hotel o paquete.");
      return;
    }
    setLocation(`/cotizador?hotel=${encodeURIComponent(formData.hotel)}`);
  };

  const getStartingPrice = (hotel: Hotel) => {
    const now = new Date();
    // Encontrar temporada actual
    const season = hotel.seasons.find(s => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return now >= start && now <= end;
    });

    if (!season || !hotel.rooms.length) return "Consulte Precio";

    // Buscar habitación para 2 personas (o la primera si no hay)
    const room = hotel.rooms.find(r => r.capacity >= 2) || hotel.rooms[0];
    const price = season.roomPrices[room.id];

    if (!price) return "Consulte Precio";
    return `Desde $ ${price.toLocaleString()}`;
  };

  return (
    <div className="bg-white min-h-screen font-sans relative overflow-x-hidden selection:bg-orange-100 pt-20">

      {/* HEADER NAV - LOGO SEGÚN DISEÑO SOLICITADO */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between shadow-sm fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="flex items-center gap-4">
          {/* LOGO AREA */}
          <div className="flex items-center gap-4 group cursor-default">
            <div className="relative">
              <div className="absolute -inset-1 bg-orange-500/10 rounded-full blur group-hover:opacity-100 transition duration-1000"></div>
              {getConf('logoImage') ? (
                <img src={getConf('logoImage')} alt="Margarita Viajes" className="w-14 h-14 object-contain relative" />
              ) : (
                <img src="/assets/img/logo.png" alt="Margarita Viajes" className="w-14 h-14 object-contain relative" />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-[32px] font-black italic text-[#ea580c] leading-[0.75] tracking-tighter uppercase">
                {config?.agencyName || 'MARGARITA'}
              </h1>
              <span className="text-[12px] font-bold text-[#0B132B] uppercase tracking-[0.1em] mt-1">
                {config?.agencySlogan || 'Viajes y Turismo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <nav className="hidden lg:flex items-center gap-10">
            <a href="#hoteles" className="text-[11px] font-black uppercase tracking-widest text-[#0B132B] hover:text-[#ea580c] transition-colors">{getConf('hotelesTitulo') || 'HOTELES'}</a>
            <a href="#fulldays" className="text-[11px] font-black uppercase tracking-widest text-[#0B132B] hover:text-[#ea580c] transition-colors">FULL DAYS</a>
            <a href="#nosotros" className="text-[11px] font-black uppercase tracking-widest text-[#0B132B] hover:text-[#ea580c] transition-colors">QUIÉNES SOMOS</a>
          </nav>

          <button
            onClick={onAdminClick}
            className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100 text-gray-400 hover:text-[#ea580c]"
            title="Panel de Administración"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>
      {/* HERO SECTION CON BANNER Y BUSCADOR DROPDOWN */}
      <div className="w-full h-[400px] md:h-[500px] bg-cover bg-center relative" style={{ backgroundImage: `url(${getConf('bannerImage') || '/assets/img/hero-bg.jpg'})` }}>
        <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[1px]"></div>

        <div className="absolute inset-0 flex flex-col items-center pt-12 text-center px-6">
          <span className="text-orange-400 font-extrabold tracking-[0.4em] text-[10px] uppercase mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
            {getConf('subtituloHero') || 'Explora la Perla del Caribe'}
          </span>

          {/* 3 CARDS SOBREPUESTAS EN BANNER - PAQUETES, FULL DAYS, HOTELES */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4 animate-in fade-in zoom-in duration-1000 delay-300">
            {[
              ...randomPackages.slice(0, 1),
              ...randomFullDays.slice(0, 1),
              ...randomHotels.slice(0, 1)
            ].filter(h => h && h.id).map((h) => (
              <div
                key={h.id}
                onClick={() => setLocation(`/cotizador?hotel=${encodeURIComponent(h.name)}`)}
                className="group relative h-56 rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl cursor-pointer hover:scale-105 transition-all duration-500"
              >
                <img src={h.photos?.[0] || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={h.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 inset-x-0 text-center">
                  <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1 drop-shadow-lg">{h.type === 'package' ? 'PAQUETE' : h.type === 'full-day' ? 'FULL DAY' : 'HOTEL'}</p>
                  <p className="text-[11px] font-black italic text-white uppercase tracking-tighter drop-shadow-lg">{h.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 hidden md:flex gap-4">
            <button
              onClick={() => document.getElementById('hoteles')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#ea580c] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all"
            >
              VER CATÁLOGO
            </button>
            <a
              href={`https://wa.me/${config.telefono?.replace(/\D/g, '')}`}
              target="_blank"
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-[#0B132B] transition-all flex items-center gap-2"
            >
              <Phone size={14} /> CONTACTAR
            </a>
          </div>
        </div>

        {/* BUSCADOR (COTIZADOR) DROPDOWN */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 z-20 hidden md:block">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100 ring-4 ring-white/10">
            <div className="flex items-center gap-4 px-6 py-4 w-full md:border-r border-gray-100">
              <MapPin className="text-orange-500 shrink-0" size={24} />
              <div className="flex flex-col w-full text-left">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Hotel / Paquete</span>
                <select
                  value={formData.hotel}
                  onChange={e => setFormData({ ...formData, hotel: e.target.value })}
                  className="font-bold text-slate-800 outline-none w-full bg-transparent text-sm appearance-none cursor-pointer"
                >
                  <option value="">-- Selecciona Destino --</option>
                  <optgroup label="PAQUETES">
                    {hotels.filter((h: Hotel) => h.type === 'package').map((h: Hotel) => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="FULL DAYS">
                    {hotels.filter((h: Hotel) => h.type === 'full-day').map((h: Hotel) => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="HOTELES">
                    {hotels.filter((h: Hotel) => h.type === 'hotel').map((h: Hotel) => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4 w-full md:border-r border-gray-100">
              <HotelIcon className="text-orange-500 shrink-0" size={24} />
              <div className="flex flex-col w-full text-left">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Huéspedes</span>
                <select
                  value={formData.pax}
                  onChange={e => setFormData({ ...formData, pax: e.target.value })}
                  className="font-bold text-slate-800 outline-none w-full bg-transparent text-sm appearance-none cursor-pointer"
                >
                  <option value="1">1 Adulto</option>
                  <option value="2">2 Adultos</option>
                  <option value="3">3 Adultos</option>
                  <option value="4+">Familia (4+)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleQuoteRedirect}
              className="bg-[#ea580c] hover:bg-[#c24106] text-white w-full md:w-auto px-12 py-5 rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-orange-500/30 whitespace-nowrap uppercase"
            >
              Cotizar Ahora
            </button>
          </div>
        </div>
      </div>

      <div className="h-40 hidden md:block"></div>

      {sectionOrder.map(section => {
        if (section === 'hotels' && randomHotels.length > 0) return (
          <section id="hoteles" key="hotels" className="py-20 px-6 md:px-12 max-w-7xl mx-auto animate-in fade-in duration-700">
            <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 block" style={{ color: config.colorFuentesSub }}>{getConf('hotelesSubtitulo')}</span>
                <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#0B132B]">{getConf('hotelesTitulo') || 'HOTELES'}</h2>
              </div>
              <button
                onClick={() => document.getElementById('hoteles')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[10px] font-black text-[#0B132B] uppercase tracking-widest border-b-2 border-orange-500 pb-1 hover:text-orange-500 transition-colors"
              >
                Explorar Todo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {randomHotels.map(h => (
                <HotelCard
                  key={h.id}
                  photos={h.photos || []}
                  title={h.name}
                  price={getStartingPrice(h)}
                  plan={h.plan}
                  onQuote={() => setLocation(`/cotizador?hotel=${encodeURIComponent(h.name)}`)}
                />
              ))}
            </div>
          </section>
        );

        if (section === 'packages' && randomPackages.length > 0) return (
          <section id="paquetes" key="packages" className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-t border-gray-100 animate-in fade-in duration-700">
            <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 block text-orange-500">Ofertas Especiales</span>
                <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#0B132B]">PAQUETES</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {randomPackages.map(p => (
                <HotelCard
                  key={p.id}
                  photos={p.photos || []}
                  title={p.name}
                  price={getStartingPrice(p)}
                  plan={p.plan}
                  onQuote={() => setLocation(`/cotizador?hotel=${encodeURIComponent(p.name)}`)}
                />
              ))}
            </div>
          </section>
        );

        if (section === 'fulldays' && randomFullDays.length > 0) return (
          <section id="fulldays" key="fulldays" className="py-24 px-6 md:px-12 bg-gray-50 overflow-hidden animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto">
              <div className="mb-14 text-center md:text-left">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 block" style={{ color: config.colorFuentesSub }}>{getConf('fulldaysSubtitulo')}</span>
                <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#0B132B]">FULL DAYS</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {randomFullDays.map(p => (
                  <FullDayCard
                    key={p.id}
                    photos={p.photos || []}
                    title={p.name}
                    price={getStartingPrice(p)}
                    onQuote={() => setLocation(`/cotizador?hotel=${encodeURIComponent(p.name)}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        );

        return null;
      })}

      {/* QUIÉNES SOMOS */}
      <section id="nosotros" className="py-20 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <div className="w-16 h-1 bg-orange-500 mx-auto mb-8"></div>
        <h2 className="text-2xl font-black italic text-[#0B132B] uppercase tracking-tight mb-6">NUESTRA PASIÓN</h2>
        <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-wide">
          {config.quienesSomos}
        </p>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0B132B] pt-24 pb-12 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black italic text-[#ea580c] leading-none uppercase">
                {config?.agencyName || 'MARGARITA'}
              </h1>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
              {config?.direccion || 'Isla de Margarita, Venezuela'}
              <br /><br />
              RIF: J-40156646-4 | RTN: 13314
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Contacto Directo</h4>
            <div className="space-y-4">
              <a href={`tel:${config?.telefono}`} className="flex items-center gap-3 text-sm font-bold hover:text-orange-400 transition-colors">
                <Phone size={18} className="text-orange-500" /> {config?.telefono || '+58 000-0000'}
              </a>
              <a href={`mailto:${config?.correo}`} className="flex items-center gap-3 text-sm font-bold hover:text-orange-400 transition-colors underline decoration-orange-500/20 underline-offset-4">
                <Mail size={18} className="text-orange-500" /> {config?.correo || 'correo@ejemplo.com'}
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Redes Oficiales</h4>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/margaritaviajes/" target="_blank" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all border border-white/10 group">
                <Instagram size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="https://www.facebook.com/hotelesamargarita/" target="_blank" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all border border-white/10 group">
                <Facebook size={20} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 px-6 md:px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">© {new Date().getFullYear()} MARGARITA VIAJES C.A. - TODOS LOS DERECHOS RESERVADOS</p>
          <div className="flex gap-8">
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Legal</span>
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
}