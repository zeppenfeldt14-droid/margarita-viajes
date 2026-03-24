import React from "react";
import { useLocation } from "wouter";
import { LayoutDashboard, Inbox, Hotel, FileText, Settings, Users, LogOut } from "lucide-react";

export default function AdminLayout({ children, onLogout, userPermissions }: { children: React.ReactNode, onLogout?: () => void, userPermissions?: any }) {
  const [location, setLocation] = useLocation();

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

  return (
    <div className="flex h-screen bg-[#F8F9FB] font-sans selection:bg-orange-200">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#0A0E17] text-white flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Area */}
          <div className="h-24 flex items-center px-8 border-b border-white/5">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                 <div className="text-orange-500 font-black text-sm tracking-tighter flex items-center">
                    <span className="text-yellow-500">M</span>V
                </div>
              </div>
              <div className="flex flex-col text-[10px] font-bold text-white leading-tight uppercase tracking-widest">
                <span>Gerente General</span>
                <span className="text-gray-500">Margarita Viajes</span>
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
                  {item.badge && (
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
