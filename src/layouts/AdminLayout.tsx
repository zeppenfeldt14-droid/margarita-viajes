import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { LayoutDashboard, Inbox, Hotel, FileText, Settings, Users, LogOut } from "lucide-react";
import { api } from "../services/api";
import { useGlobalData } from "../context/GlobalContext";

export default function AdminLayout({ children, onLogout, userPermissions }: { children: React.ReactNode, onLogout?: () => void, userPermissions?: any }) {
  const [location, setLocation] = useLocation();
  const { quotes, reservations, operations } = useGlobalData();

  const newQuotesCount = (quotes || []).filter(q => q?.status === 'Nuevo').length;
  const pendingReservationsCount = (reservations || []).filter(r => r?.status === 'Pendiente').length;
  const pendingOperationsCount = (operations || []).filter(o => o?.status === 'Pendiente').length;

  const NAV_ITEMS = [
    { title: "INICIO", path: "/admin", icon: <LayoutDashboard size={16} /> },
    { title: "INVENTARIO", path: "/admin/inventory", icon: <Inbox size={16} />, module: 'inventory' },
    { title: "COTIZACIONES", path: "/admin/quotes", icon: <FileText size={16} />, badge: 3, module: 'quotes' },
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
      <aside className="w-[280px] bg-[#0A0E17] text-white flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Area */}
          <div className="h-24 flex items-center px-8 border-b border-white/5">
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
              <div className="flex flex-col text-[10px] font-bold text-white leading-tight uppercase tracking-widest truncate max-w-[150px]">
                <span className="truncate">{userName}</span>
                <span className="text-gray-500 truncate">{userRole}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 px-4 space-y-2">
            {filteredItems.map((item) => {
              const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
              return (
                <button
                  key={item.title}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? "bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20" 
                      : "text-gray-400 font-bold hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-4 text-xs tracking-widest">
                     {item.icon}
                     {item.title}
                   </div>
                   {item.title === 'COTIZACIONES' && newQuotesCount > 0 && (
                     <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-red-500/50">
                       {newQuotesCount}
                     </span>
                   )}
                   {item.title === 'RESERVAS (HOTEL)' && pendingReservationsCount > 0 && (
                     <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-red-500/50">
                       {pendingReservationsCount}
                     </span>
                   )}
                   {item.title === 'VENTAS (OPERACIONES)' && pendingOperationsCount > 0 && (
                     <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-red-500/50">
                       {pendingOperationsCount}
                     </span>
                   )}
                   {item.badge && !['COTIZACIONES', 'RESERVAS (HOTEL)', 'VENTAS (OPERACIONES)'].includes(item.title) && (
                     <span className="bg-white text-orange-500 text-[10px] font-black w-5 h-5 flex flex-col items-center justify-center rounded-full">
                       {item.badge}
                     </span>
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

      {/* RENDER CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
         {/* Top Header Placeholder for Mobile / Global actions */}
         <header className="h-24 bg-white border-b border-gray-100 flex items-center px-10 shrink-0 shadow-sm z-10 w-full relative">
            <h1 className="text-2xl font-black text-[#0B132B] italic tracking-tight uppercase">
              {NAV_ITEMS.find(n => location === n.path || (n.path !== '/admin' && location.startsWith(n.path)))?.title || "DASHBOARD"}
            </h1>
         </header>
         
         {/* Scrollable Area */}
         <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6 md:p-10 hide-scrollbar">
            {children}
         </div>
      </main>

    </div>
  );
}
