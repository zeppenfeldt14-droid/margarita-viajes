import { useState, useEffect } from 'react';
import { Camera, Plus, ShieldCheck, Target, X } from 'lucide-react';
import { api } from '../../services/api';
import { Card, SectionTitle } from './Common';
import { InputField } from './FormFields';
import { compressImage } from '../../utils/helpers';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState<any>(null);
  
  const currentUserLevel = parseInt(localStorage.getItem('user_level') || '3');
  const currentUserRole = localStorage.getItem('staff_user_role') || '';
  const currentUserAlias = localStorage.getItem('staff_user_alias') || '';
  const isMasterAdmin = currentUserLevel === 1 || currentUserAlias === 'Gerente General' || currentUserAlias === 'Gerente Operaciones' || currentUserRole === 'Gerente General' || currentUserRole === 'Gerente Operaciones';

  const defaultModules = { inventory: true, quotes: true, bookings: true, operations: true, users: false, customers: true, marketing: false, settings: false };
  const [newUser, setNewUser] = useState<any>({ name: '', alias: '', email: '', password: '', role: '', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules });
  
  // BITACORA STATES
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [isGlobalLog, setIsGlobalLog] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.getLogs();
      setAllLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar bitácora:', error);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchLogs();
  }, []);

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.alias || !newUser.email || (!newUser.id && !newUser.password)) {
      return alert('Completa los campos obligatorios. La contraseÃ±a es requerida al crear un nuevo perfil.');
    }

    try {
      const payloadData = { ...newUser };
      if (newUser.id && !payloadData.password) {
        delete payloadData.password; 
      }

      const response = await api.saveUser(payloadData, newUser.id || null);
      
      if (response.ok) {
        alert(`Perfil ${newUser.id ? 'actualizado' : 'creado'} correctamente.`);
        setShowUserModal(false);
        setNewUser({ name: '', alias: '', email: '', password: '', role: 'Vendedor 1', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules });
        fetchUsers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Error al guardar: ${errorData.message || 'No se pudo procesar la solicitud.'}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error de conexiÃ³n: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!isMasterAdmin) return alert('No tienes permisos para eliminar perfiles.');
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el perfil de "${name}"? Esta acción no se puede deshacer.`)) return;

    try {
      const response = await api.deleteUser(id);
      if (response.ok) {
        alert('Perfil eliminado correctamente.');
        fetchUsers();
      } else {
        alert('Error al eliminar el perfil.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error de conexión al eliminar.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <SectionTitle>GestiÃ³n de Perfiles y Accesos</SectionTitle>
        <div className="flex gap-4">
          <button onClick={() => {
            setIsGlobalLog(true);
            setShowLogsModal({ name: 'GLOBAL', alias: 'Sistema' });
            fetchLogs();
          }} className="bg-[#0B132B] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center gap-2">
            <ShieldCheck size={16}/> BITÁCORA GLOBAL
          </button>
          <button onClick={() => {
            setNewUser({ name: '', alias: '', email: '', password: '', role: 'Vendedor 1', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules });
            setShowUserModal(true);
          }} className="bg-[#ea580c] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0B132B] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2">
            <Plus size={16}/> NUEVO PERFIL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.length === 0 ? (
           <p className="text-gray-400 text-xs font-bold uppercase col-span-3 text-center py-10">No hay usuarios registrados</p>
        ) : (
          users.map((u: any) => (
            <Card key={u.id} className="relative overflow-hidden border-2 border-gray-50 shadow-sm hover:border-orange-200 transition-all flex flex-col justify-between">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black text-2xl uppercase shadow-inner overflow-hidden shrink-0">
                  {u.photo ? (
                    <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    (u.name || 'U').charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black uppercase text-[#0B132B] leading-none mb-1">{u.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alias: {u.alias || 'Sin Alias'}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-2 py-0.5 rounded-md">{u.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="bg-blue-50 p-2 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest">NIVEL</span>
                  <span className="text-xs font-black text-blue-600">{u.level || 3}</span>
                </div>
                <div className="bg-orange-50 p-2 rounded-xl text-center">
                  <span className="block text-[8px] font-black text-orange-400 uppercase tracking-widest">META / DÃA</span>
                  <span className="text-xs font-black text-orange-600">{u.dailyQuota || 0}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${u.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {u.active ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setIsGlobalLog(false);
                    setShowLogsModal(u);
                    fetchLogs();
                  }} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
                    BITÁCORA
                  </button>
                  <button onClick={() => {
                    setNewUser({ 
                      ...u, 
                      name: u.name || u.fullName, 
                      password: '', 
                      modules: u.modules || defaultModules 
                    });
                    setShowUserModal(true);
                  }} className="bg-[#0B132B] text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md">
                    EDITAR
                  </button>
                  {isMasterAdmin && (
                    <button 
                      onClick={() => handleDeleteUser(u.id, u.name || u.fullName)}
                      className="bg-red-50 text-red-500 border border-red-100 px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      ELIMINAR
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-[#0B132B]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-xl font-black italic text-[#0B132B] uppercase tracking-tighter">{newUser.id ? 'Editar Perfil' : 'Nuevo Perfil'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-xl shadow-sm"><X size={20}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-24 w-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group shrink-0 hover:bg-gray-100 transition-colors">
                  {newUser.photo ? (
                    <img src={newUser.photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center"><Camera size={24} className="text-gray-300 mx-auto" /></div>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const comp = await compressImage(reader.result as string, 400, 400);
                        setNewUser((prev: any) => ({ ...prev, photo: comp }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField name="name" label="NOMBRE COMPLETO" placeholder="Ej: Ernesto Larez" value={newUser.name} onChange={(e: any) => setNewUser({...newUser, name: e.target.value})} />
                  <InputField name="alias" label="ALIAS DE USUARIO (LOGIN)" placeholder="Ej: ernesto.larez" value={newUser.alias} onChange={(e: any) => setNewUser({...newUser, alias: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField name="email" label="CORREO ELECTRÃ“NICO" type="email" placeholder="ejemplo@margaritaviajes.com" value={newUser.email} onChange={(e: any) => setNewUser({...newUser, email: e.target.value})} />
                <InputField name="password" label={newUser.id ? "CONTRASEÃ‘A (Dejar en blanco para no cambiar)" : "CONTRASEÃ‘A (OBLIGATORIA)"} type="password" placeholder="********" value={newUser.password || ''} onChange={(e: any) => setNewUser({...newUser, password: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rol Asignado / Perfil</label>
                  {isMasterAdmin ? (
                    <div className="relative">
                      <input
                        type="text"
                        list="roles-list"
                        value={newUser.role || ''}
                        onChange={(e) => {
                          const role = e.target.value;
                          let lvl = 3;
                          if(role.includes('Gerente')) lvl = 1;
                          if(role.includes('Supervisor') || role.includes('Coordinador')) lvl = 2;
                          setNewUser({ ...newUser, role: role, level: lvl });
                        }}
                        className="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-all text-[#0B132B]"
                        placeholder="Selecciona o escribe un nuevo rol..."
                      />
                      <datalist id="roles-list">
                        <option value="Gerente General" />
                        <option value="Gerente Operaciones" />
                        <option value="Supervisor de Ventas" />
                        <option value="Vendedor 1" />
                        <option value="Vendedor 2" />
                        <option value="Coordinador de Operaciones" />
                        <option value="Supervisor Administrativo" />
                      </datalist>
                      <p className="text-[8px] text-orange-500 font-bold mt-1">✨ Puedes escribir un rol nuevo si no está en la lista.</p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={newUser.role || ''}
                      className="w-full bg-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none text-gray-500 cursor-not-allowed"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">NIVEL DE ACCESO</label>
                  <select value={newUser.level} onChange={(e) => setNewUser({...newUser, level: Number(e.target.value)})} className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm">
                    <option value={1}>Nivel 1 (Total)</option>
                    <option value={2}>Nivel 2 (SupervisiÃ³n)</option>
                    <option value={3}>Nivel 3 (Ventas)</option>
                    <option value={4}>Nivel 4 (Soporte/Otros)</option>
                  </select>
                </div>
                <InputField name="dailyQuota" label="META DIARIA" type="number" placeholder="20" value={String(newUser.dailyQuota || '')} onChange={(e: any) => setNewUser({...newUser, dailyQuota: Number(e.target.value)})} />
              </div>

              <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100 space-y-4">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> MÃ³dulos Autorizados</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'inventory', label: 'Inventario' },
                    { id: 'quotes', label: 'Cotizaciones' },
                    { id: 'bookings', label: 'Reservas' },
                    { id: 'operations', label: 'Operaciones' },
                    { id: 'users', label: 'Usuarios' },
                    { id: 'customers', label: 'Clientes' },
                    { id: 'marketing', label: 'Marketing' },
                    { id: 'settings', label: 'ConfiguraciÃ³n' }
                  ].map(mod => {
                    const isAuthorized = newUser.modules?.[mod.id] !== false;
                    return (
                      <label key={mod.id} className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${isAuthorized ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-purple-100 text-gray-400 hover:border-purple-300'}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{mod.label}</span>
                        <input type="checkbox" className="hidden" checked={isAuthorized} onChange={(e) => {
                          setNewUser({ ...newUser, modules: { ...(newUser.modules || {}), [mod.id]: e.target.checked } });
                        }} />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-50 space-y-4">
                <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Target size={14}/> AsignaciÃ³n y Ruleta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-50">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Estado del Perfil:</span>
                    <select value={newUser.active ? 'true' : 'false'} onChange={(e) => setNewUser({...newUser, active: e.target.value === 'true'})} className="bg-gray-50 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase outline-none border-none focus:ring-2 focus:ring-orange-500/20">
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-50">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Recibir Leads (Ruleta):</span>
                    <select value={newUser.inRoulette !== false ? 'true' : 'false'} onChange={(e) => setNewUser({...newUser, inRoulette: e.target.value === 'true'})} className="bg-gray-50 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase outline-none border-none focus:ring-2 focus:ring-orange-500/20">
                      <option value="true">SÃ­, Asignar</option>
                      <option value="false">No Asignar</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <button onClick={handleSaveUser} className="w-full bg-[#0B132B] text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl active:scale-95">
                {newUser.id ? 'GUARDAR CAMBIOS' : 'CREAR PERFIL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogsModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-[#0B132B] uppercase tracking-tighter">Auditoría de Bitácora</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Enfoque: {isGlobalLog ? 'Sistema Global' : `Usuario: ${showLogsModal.name} (${showLogsModal.alias})`}
                </p>
              </div>
              <button 
                onClick={() => { setShowLogsModal(null); setIsGlobalLog(false); setFilterMonth(''); setFilterStart(''); setFilterEnd(''); }} 
                className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-end shrink-0">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtro por Mes</label>
                <select 
                  value={filterMonth} 
                  onChange={(e) => { setFilterMonth(e.target.value); setFilterStart(''); setFilterEnd(''); }}
                  className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">Todos los meses</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const val = d.toISOString().substring(0, 7);
                    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                    return <option key={val} value={val}>{label}</option>;
                  })}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Inicio</label>
                <input 
                  type="date" 
                  value={filterStart} 
                  onChange={(e) => { setFilterStart(e.target.value); setFilterMonth(''); }}
                  className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha Fin</label>
                <input 
                  type="date" 
                  value={filterEnd} 
                  onChange={(e) => { setFilterEnd(e.target.value); setFilterMonth(''); }}
                  className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <button 
                onClick={() => {
                  const filtered = allLogs.filter(log => {
                    const isUserMatch = isGlobalLog || log.user_id === showLogsModal.id || log.user_name === showLogsModal.alias;
                    if (!isUserMatch) return false;

                    const logDate = new Date(log.created_at || log.date).toISOString();
                    if (filterMonth && !logDate.startsWith(filterMonth)) return false;
                    if (filterStart && logDate < filterStart) return false;
                    if (filterEnd && logDate > filterEnd + 'T23:59:59') return false;
                    
                    return true;
                  });

                  const headers = ['Fecha y Hora', 'Tipo', 'Usuario', 'Acción', 'Detalle'];
                  const csvContent = [
                    headers.join(','),
                    ...filtered.map(log => [
                      `"${new Date(log.created_at || log.date).toLocaleString('es-ES')}"`,
                      `"${log.action_type || (log.action && log.action.includes('LOGIN') ? 'CONEXION' : 'GESTION')}"`,
                      `"${log.user_name || log.alias || 'Sistema'}"`,
                      `"${log.action_type || log.action}"`,
                      `"${(log.details || log.detail || '').replace(/"/g, '""')}"`
                    ].join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `Bitacora_${isGlobalLog ? 'Global' : showLogsModal.alias}_${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
              >
                <ShieldCheck size={14} /> Descargar Reporte
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">
                    <th className="pb-4 pr-4">Fecha y Hora</th>
                    <th className="pb-4 pr-4">Tipo</th>
                    <th className="pb-4 pr-4">Usuario</th>
                    <th className="pb-4 pr-4">Acción</th>
                    <th className="pb-4 pr-4">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allLogs.filter(log => {
                    const isUserMatch = isGlobalLog || log.user_id === showLogsModal.id || log.user_name === showLogsModal.alias;
                    if (!isUserMatch) return false;

                    const logDate = new Date(log.created_at || log.date).toISOString();
                    if (filterMonth && !logDate.startsWith(filterMonth)) return false;
                    if (filterStart && logDate < filterStart) return false;
                    if (filterEnd && logDate > filterEnd + 'T23:59:59') return false;
                    
                    return true;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 text-[10px] font-bold uppercase tracking-widest">No se encontraron registros en el rango seleccionado.</td>
                    </tr>
                  ) : (
                    allLogs.filter(log => {
                      const isUserMatch = isGlobalLog || log.user_id === showLogsModal.id || log.user_name === showLogsModal.alias;
                      if (!isUserMatch) return false;

                      const logDate = new Date(log.created_at || log.date).toISOString();
                      if (filterMonth && !logDate.startsWith(filterMonth)) return false;
                      if (filterStart && logDate < filterStart) return false;
                      if (filterEnd && logDate > filterEnd + 'T23:59:59') return false;
                      
                      return true;
                    }).map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-all group">
                        <td className="py-4 pr-4">
                          <span className="text-[10px] font-bold text-gray-500">
                            {new Date(log.created_at || log.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            (log.action_type === 'LOGIN' || log.action?.includes('LOGIN')) ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {(log.action_type === 'LOGIN' || log.action?.includes('LOGIN')) ? 'Conexión' : 'Gestión'}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-[10px] font-black text-gray-700 uppercase">{log.user_name || log.alias || 'Sistema'}</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-[10px] font-black text-[#0B132B] uppercase">{log.action_type || log.action}</span>
                        </td>
                        <td className="py-4 pr-4 max-w-[200px] truncate">
                          <span className="text-[10px] font-medium text-gray-500">{log.details || log.detail}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
              <button 
                onClick={() => { setShowLogsModal(null); setIsGlobalLog(false); }} 
                className="bg-white border-2 border-gray-200 text-gray-600 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
