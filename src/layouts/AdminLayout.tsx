import React, { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { LayoutDashboard, Inbox, Hotel, FileText, Settings, Users, LogOut, Menu, X as CloseIcon } from "lucide-react";
import { api } from "../services/api";
import { useGlobalData } from "../context/GlobalContext";

export default function AdminLayout({ children, onLogout, userPermissions }: { children: React.ReactNode, onLogout?: () => void, userPermissions?: any }) {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { quotes, reservations, operations } = useGlobalData();

  // Cálculos de Notificaciones Activas (v52)
  const newQuotesCount = (quotes || []).filter(q => q?.status === 'Nuevo').length;
  const activeReservationsCount = (reservations || []).filter(r => r?.status === 'Confirmada').length;
  const pendingOperationsCount = (operations || []).filter(o => o?.status === 'Pendiente').length;
  
  // Alertas Clientes: Conteo de cotizaciones "Nuevo" (como proxy de clientes nuevos)
  const newCustomersCount = newQuotesCount; 

  // Alertas Marketing: Conteo de promociones/descuentos activos
  const marketingAlertsCount = (quotes || []).filter(q => (q?.discount || 0) > 0).length;

  const NAV_ITEMS = [
    { title: "INICIO", path: "/admin", icon: <LayoutDashboard size={16} /> },
    { title: "INVENTARIO", path: "/admin/inventory", icon: <Inbox size={16} />, module: 'inventory' },
    { title: "COTIZACIONES", path: "/admin/quotes", icon: <FileText size={16} />, module: 'quotes' },
    { title: "RESERVAS (HOTEL)", path: "/admin/reservations", icon: <Hotel size={16} />, module: 'bookings' },
    { title: "VENTAS (OPERACIONES)", path: "/admin/sales", icon: <FileText size={16} />, module: 'operations' },
    { title: "USUARIOS", path: "/admin/users", icon: <Users size={16} />, module: 'users' },
    { title: "CLIENTES", path: "/admin/customers", icon: <Users size={16} />, module: 'customers' },
    { title: "MARKETING", path: "/admin/marketing", icon: <FileText size={16} />, module: 'marketing' },
    { title: "CONFIGURACIÓN", path: "/admin/webconfig", icon: <Settings size={16} />, module: 'settings' },
  ];

  const filteredItems = NAV_ITEMS.filter(item => {
    if (!item.module) return true; // INICIO siempre visible
    if (!userPermissions) return true; // Fallback
    return userPermissions[item.module] === true;
  });

  // Tarea D: Inactivity Timeout (5 minutes)
  useEffect(() => {
    let timeout: any;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        // Log inactivity before clearing storage (to ensure we have the token/identity)
        try {
          await api.createLog({
            action: 'LOGOUT_INACTIVITY',
            details: 'Cierre de sesión automático tras 5 minutos de inactividad detectada.'
          });
        } catch (e) {
          console.error("Error logging inactivity:", e);
        }
        
        // Clear and redirect
        localStorage.clear();
        window.location.href = "/login";
      }, 5 * 60 * 1000); // 5 minutes
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  const userName = localStorage.getItem("staff_user") || "Admin";
  const userRole = localStorage.getItem("staff_user_role") || "Staff";
  const userPhoto = localStorage.getItem("staff_user_photo");

  return (
    <div className="flex h-screen bg-[#F8F9FB] font-sans selection:bg-orange-200">
      
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] w-[280px] bg-[#0A0E17] text-white flex flex-col justify-between 
        transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:flex
      `}>
        <div>
          {/* Logo Area */}
          <div className="h-24 flex items-center justify-between px-8 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                {userPhoto ? (
                  <img src={userPhoto} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-orange-500 font-black text-sm tracking-tighter flex items-center">
                    <span className="text-yellow-500">{userName.charAt(0)}</span>{userName.charAt(1).toUpperCase() || 'V'}
                  </div>
                )}
              </div>
              <div className="flex flex-col text-[10px] font-bold text-white leading-tight uppercase tracking-widest truncate max-w-[120px]">
                <span className="truncate">{userName}</span>
                <span className="text-gray-500 truncate">{userRole}</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white transition-colors">
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-8 px-4 space-y-2">
            {filteredItems.map((item) => {
              const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
              return (
                <button
                  key={item.title}
                  onClick={() => { setLocation(item.path); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? "bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20" 
                      : "text-gray-400 font-bold hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-4 text-xs tracking-widest uppercase">
                    {item.icon}
                    {item.title}
                  </div>

                  {/* Badges Reactivos (v52) */}
                  {item.title === 'COTIZACIONES' && newQuotesCount > 0 && (
                    <span className="bg-orange-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-orange-500/30">
                      {newQuotesCount}
                    </span>
                  )}
                  {item.title === 'RESERVAS (HOTEL)' && activeReservationsCount > 0 && (
                    <div className="relative">
                      <span className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></span>
                      <span className="relative bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-red-500/50">
                        {activeReservationsCount}
                      </span>
                    </div>
                  )}
                  {item.title === 'VENTAS (OPERACIONES)' && pendingOperationsCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-red-500/50">
                      {pendingOperationsCount}
                    </span>
                  )}
                  {item.title === 'CLIENTES' && newCustomersCount > 0 && (
                    <span className="bg-blue-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-blue-500/30">
                      {newCustomersCount}
                    </span>
                  )}
                  {item.title === 'MARKETING' && marketingAlertsCount > 0 && (
                    <div className="relative">
                      <span className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-75"></span>
                      <span className="relative bg-teal-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-teal-500/50">
                        {marketingAlertsCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar (Salir) */}
        <div className="p-6">
           <button 
             onClick={() => { if(onLogout) onLogout(); else setLocation("/"); }}
             className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs tracking-widest font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-all border border-white/10"
           >
              <LogOut size={16} />
              SALIR
           </button>
           <div className="mt-4 text-[9px] text-gray-600 text-center uppercase tracking-widest font-bold">
             © Margarita Viajes C.A.
           </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* RENDER CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
         {/* Top Header Placeholder for Mobile / Global actions */}
         <header className="h-24 bg-white border-b border-gray-100 flex items-center px-6 md:px-10 shrink-0 shadow-sm z-10 w-full relative justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#0B132B] hover:bg-gray-100 transition-all border border-gray-100"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl md:text-2xl font-black text-[#0B132B] italic tracking-tight uppercase flex items-center gap-3">
                {NAV_ITEMS.find(n => location === n.path || (n.path !== '/admin' && location.startsWith(n.path)))?.title || "DASHBOARD"}
                <span className="bg-[#0B132B] text-white text-[8px] px-2 py-0.5 rounded-md not-italic font-black border border-white/20 shadow-sm opacity-30 group-hover:opacity-100 transition-opacity">v55.bau</span>
              </h1>
            </div>
         </header>
         
         {/* Scrollable Area */}
         <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6 md:p-10 hide-scrollbar">
            {children}
         </div>
      </main>

    </div>
  );
}
