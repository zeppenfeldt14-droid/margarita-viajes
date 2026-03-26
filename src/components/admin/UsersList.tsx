import { useState, useEffect } from 'react';
import { Camera, Plus, Search, ShieldCheck, Target, Trash2, X, User } from 'lucide-react';
import { api } from '../../services/api';
import { SectionTitle } from './Common';
import { InputField } from './FormFields';
import { compressImage } from '../../utils/helpers';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const currentUserLevel = parseInt(localStorage.getItem('user_level') || '3');
  const currentUserRole = localStorage.getItem('staff_user_role') || '';
  const currentUserAlias = localStorage.getItem('staff_user_alias') || '';
  const isMasterAdmin = currentUserLevel === 1 || currentUserAlias === 'Gerente General' || currentUserAlias === 'Gerente Operaciones' || currentUserRole === 'Gerente General' || currentUserRole === 'Gerente Operaciones';

  const defaultModules = { inventory: true, quotes: true, bookings: true, operations: true, users: false, customers: true, marketing: false, settings: false };
  const [newUser, setNewUser] = useState<any>({ name: '', alias: '', email: '', password: '', role: '', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules });
  const [searchTerm, setSearchTerm] = useState('');
  
  // BITACORA STATES
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterLogUser, setFilterLogUser] = useState('');
  const [filterLogAction, setFilterLogAction] = useState('');
  const [isGlobalLog, setIsGlobalLog] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
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
    const interval = setInterval(() => {
      fetchUsers();
      fetchLogs();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isUserOnline = (userId: string, alias: string) => {
    const STALE_TIMEOUT = 15 * 60 * 1000;
    const now = new Date().getTime();
    const userLogs = allLogs.filter(log => 
      (log.user_id === userId || log.user_name === alias || log.alias === alias)
    ).sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());

    if (userLogs.length === 0) return false;
    const lastLog = userLogs[0];
    const lastActivityTime = new Date(lastLog.created_at || lastLog.date).getTime();
    const timeDiff = now - lastActivityTime;
    const action = (lastLog.action_type || lastLog.action || '').toUpperCase();
    if (action.includes('LOGOUT')) return false;
    if (timeDiff > STALE_TIMEOUT) return false;
    return true;
  };

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.alias || !newUser.email || (!newUser.id && !newUser.password)) {
      return alert('Completa los campos obligatorios.');
    }
    try {
      const payloadData = { ...newUser };
      if (newUser.id && !payloadData.password) delete payloadData.password; 
      const response = await api.saveUser(payloadData, newUser.id || null);
      if (response.ok) {
        setShowUserModal(false);
        setNewUser({ name: '', alias: '', email: '', password: '', role: 'Vendedor 1', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules });
        fetchUsers();
      }
    } catch (error: any) { console.error('Error:', error); }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!isMasterAdmin) return;
    if (!window.confirm(`¿Eliminar a "${name}"?`)) return;
    try {
      const response = await api.deleteUser(id);
      if (response.ok) fetchUsers();
    } catch (error) { console.error('Error:', error); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-120px)] flex flex-col">
      {/* Bloque Unificado de Cabecera (v52) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SectionTitle className="mb-0">Gestión de Perfiles y Accesos</SectionTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o alias..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="bg-gray-50 border-2 border-transparent rounded-xl pl-11 pr-4 py-3 text-[10px] font-bold uppercase outline-none focus:border-[#0B132B] focus:bg-white w-full md:w-[250px] transition-all" 
              />
            </div>

            <button onClick={() => { setIsGlobalLog(true); setShowLogsModal({ name: 'GLOBAL', alias: 'Sistema' }); fetchLogs(); }} className="bg-[#0B132B] text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
              <ShieldCheck size={14}/> Bitácora Global
            </button>
            <button onClick={() => { setNewUser({ name: '', alias: '', email: '', password: '', role: 'Vendedor 1', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules }); setShowUserModal(true); }} className="bg-orange-600 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0B132B] transition-all shadow-lg flex items-center gap-2">
              <Plus size={14}/> Nuevo Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de Tabla con Scroll y Sticky Header (v52) */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-white">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="py-5 px-8 border-b border-gray-100 bg-white">USUARIO / ESTATUS</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white">ALIAS & CORREO</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white">ROL / NIVEL</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white text-center">META DIARIA</th>
                <th className="py-5 px-8 border-b border-gray-100 bg-white text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold uppercase">
              {users.filter(u => (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.alias || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">No se encontraron usuarios</td></tr>
              ) : (
                users.filter(u => (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.alias || '').toLowerCase().includes(searchTerm.toLowerCase())).map((u: any) => (
                  <tr key={u.id} className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white z-10 ${isUserOnline(u.id, u.alias) ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center">
                            {u.photo ? <img src={u.photo} className="w-full h-full object-cover" /> : <div className="text-gray-300 font-black text-xs">{(u.name || 'U').charAt(0)}</div>}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black italic text-[#0B132B] text-[11px] leading-tight mb-1">{u.name}</span>
                          <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md inline-block w-fit ${u.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{u.active ? 'ACTIVO' : 'INACTIVO'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 mb-1">{u.alias}</span>
                        <span className="text-[9px] text-gray-400 lowercase font-medium">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-8 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit mb-1">{u.role}</span>
                        <span className="text-[8px] font-bold text-gray-300">NIVEL ACCESO: {u.level || 3}</span>
                      </div>
                    </td>
                    <td className="py-4 px-8 text-center text-orange-600 font-black italic">{u.dailyQuota || 0}</td>
                    <td className="py-4 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setIsGlobalLog(false); setShowLogsModal(u); fetchLogs(); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Bitácora">
                           <ShieldCheck size={14} />
                        </button>
                        <button onClick={() => { setNewUser({ ...u, name: u.name || u.fullName, password: '', modules: u.modules || defaultModules }); setShowUserModal(true); }} className="p-2 bg-gray-50 text-[#0B132B] rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm" title="Editar">
                           <User size={14} />
                        </button>
                        {isMasterAdmin && (
                          <button onClick={() => handleDeleteUser(u.id, u.name)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
                <div className="absolute -top-3 left-6 bg-orange-500 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Control de Acceso</div>
                <div className="flex flex-col gap-4">
                  <InputField name="email" label="CORREO ELECTRÓNICO" type="email" placeholder="ejemplo@margaritaviajes.com" value={newUser.email} onChange={(e: any) => setNewUser({...newUser, email: e.target.value})} />
                  <InputField name="password" label={newUser.id ? "CONTRASEÑA (Dejar en blanco para no cambiar)" : "CONTRASEÑA (OBLIGATORIA)"} type="password" placeholder="********" value={newUser.password || ''} onChange={(e: any) => setNewUser({...newUser, password: e.target.value})} />
                </div>
                <div className="flex flex-col justify-center items-center gap-4 bg-gray-50/50 rounded-2xl p-4 border border-dashed border-gray-200">
                  <p className="text-[10px] font-black text-[#0B132B] uppercase tracking-widest">¿Permitir acceso al sistema?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setNewUser({...newUser, active: true})}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newUser.active ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}
                    >
                      CUENTA ACTIVA
                    </button>
                    <button 
                      onClick={() => setNewUser({...newUser, active: false})}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!newUser.active ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}
                    >
                      INACTIVA
                    </button>
                  </div>
                </div>
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
                        placeholder="Rol..."
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
                    </div>
                  ) : (
                    <input type="text" disabled value={newUser.role || ''} className="w-full bg-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none text-gray-500 cursor-not-allowed" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">NIVEL DE ACCESO</label>
                  <select value={newUser.level} onChange={(e) => setNewUser({...newUser, level: Number(e.target.value)})} className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm">
                    <option value={1}>Nivel 1 (Total)</option>
                    <option value={2}>Nivel 2 (Supervisión)</option>
                    <option value={3}>Nivel 3 (Ventas)</option>
                    <option value={4}>Nivel 4 (Soporte/Otros)</option>
                  </select>
                </div>
                <InputField name="dailyQuota" label="META DIARIA" type="number" placeholder="20" value={String(newUser.dailyQuota || '')} onChange={(e: any) => setNewUser({...newUser, dailyQuota: Number(e.target.value)})} />
              </div>

              <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100 space-y-4">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Módulos Autorizados</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'inventory', label: 'Inventario' },
                    { id: 'quotes', label: 'Cotizaciones' },
                    { id: 'bookings', label: 'Reservas' },
                    { id: 'operations', label: 'Operaciones' },
                    { id: 'users', label: 'Usuarios' },
                    { id: 'customers', label: 'Clientes' },
                    { id: 'marketing', label: 'Marketing' },
                    { id: 'settings', label: 'Configuración' }
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
              <button onClick={() => { setShowLogsModal(null); setIsGlobalLog(false); }} className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
            </div>
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-end shrink-0">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtro por Mes</label>
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-blue-500">
                  <option value="">Todos los meses</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date(); d.setMonth(d.getMonth() - i);
                    return <option key={i} value={d.toISOString().substring(0, 7)}>{d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</option>;
                  })}
                </select>
              </div>
              {/* Filtros simplificados para v52 */}
              <button onClick={() => {}} className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg">Descargar Reporte</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left sticky top-0 bg-white">
                    <th className="pb-4 pr-4">Fecha y Hora</th>
                    <th className="pb-4 pr-4">Tipo</th>
                    <th className="pb-4 pr-4">Usuario</th>
                    <th className="pb-4 pr-4">Acción</th>
                    <th className="pb-4 pr-4">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allLogs.filter(log => isGlobalLog || log.user_id === showLogsModal.id || log.user_name === showLogsModal.alias).map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-all text-[10px] font-bold uppercase">
                      <td className="py-3 pr-4 text-gray-400">{new Date(log.created_at || log.date).toLocaleString()}</td>
                      <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-md ${log.action_type === 'LOGIN' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{log.action_type || 'Gestión'}</span></td>
                      <td className="py-3 pr-4 font-black">{log.user_name || log.alias}</td>
                      <td className="py-3 pr-4">{log.action_type || log.action}</td>
                      <td className="py-3 pr-4 text-gray-500 max-w-[200px] truncate">{log.details || log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
               <button onClick={() => { setShowLogsModal(null); setIsGlobalLog(false); }} className="bg-white border-2 border-gray-200 text-gray-600 px-8 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-gray-100">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
