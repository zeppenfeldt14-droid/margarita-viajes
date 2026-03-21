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
  const [activeLogTab, setActiveLogTab] = useState<'operaciones' | 'conexiones'>('operaciones');
  
  const defaultModules = { inventory: true, quotes: true, bookings: true, operations: true, users: false, customers: true, marketing: false, settings: false };
  const [newUser, setNewUser] = useState<any>({ name: '', alias: '', email: '', password: '', role: 'Vendedor 1', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules });

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.alias || !newUser.email || (!newUser.id && !newUser.password)) {
      return alert('Completa los campos obligatorios. La contraseña es requerida al crear un nuevo perfil.');
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
      alert(`Error de conexión: ${error.message || 'Error desconocido'}`);
    }
  };

  const isUserConnected = showLogsModal?.isOnline === true || showLogsModal?.is_online === true;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <SectionTitle>Gestión de Perfiles y Accesos</SectionTitle>
        <button onClick={() => {
          setNewUser({ name: '', alias: '', email: '', password: '', role: 'Vendedor 1', dailyQuota: 20, active: true, level: 3, photo: '', inRoulette: true, modules: defaultModules });
          setShowUserModal(true);
        }} className="bg-[#ea580c] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0B132B] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2">
          <Plus size={16}/> NUEVO PERFIL
        </button>
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
                  <span className="block text-[8px] font-black text-orange-400 uppercase tracking-widest">META / DÍA</span>
                  <span className="text-xs font-black text-orange-600">{u.dailyQuota || 0}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${u.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {u.active ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setActiveLogTab('operaciones');
                    setShowLogsModal(u);
                  }} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">
                    BITÁCORA
                  </button>
                  <button onClick={() => {
                    setNewUser({ ...u, password: '', modules: u.modules || defaultModules });
                    setShowUserModal(true);
                  }} className="bg-[#0B132B] text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md">
                    EDITAR
                  </button>
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
                <InputField name="email" label="CORREO ELECTRÓNICO" type="email" placeholder="ejemplo@margaritaviajes.com" value={newUser.email} onChange={(e: any) => setNewUser({...newUser, email: e.target.value})} />
                <InputField name="password" label={newUser.id ? "CONTRASEÑA (Dejar en blanco para no cambiar)" : "CONTRASEÑA (OBLIGATORIA)"} type="password" placeholder="********" value={newUser.password || ''} onChange={(e: any) => setNewUser({...newUser, password: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-50">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">ROL ASIGNADO</label>
                  <select value={newUser.role} onChange={(e) => {
                    const role = e.target.value;
                    let lvl = 3;
                    if(role.includes('Gerente')) lvl = 1;
                    if(role.includes('Supervisor') || role.includes('Coordinador')) lvl = 2;
                    setNewUser({...newUser, role, level: lvl});
                  }} className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm">
                    <option value="Gerente General">Gerente General</option>
                    <option value="Gerente Operaciones">Gerente Operaciones</option>
                    <option value="Supervisor de Ventas">Supervisor de Ventas</option>
                    <option value="Vendedor 1">Vendedor 1</option>
                    <option value="Vendedor 2">Vendedor 2</option>
                  </select>
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

              <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-50 space-y-4">
                <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Target size={14}/> Asignación y Ruleta</h4>
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
                      <option value="true">Sí, Asignar</option>
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
        <div className="fixed inset-0 bg-[#0B132B]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="text-xl font-black italic text-[#0B132B] uppercase tracking-tighter">Bitácora de Usuario</h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Perfil: {showLogsModal.name} | Alias: {showLogsModal.alias || 'N/A'}</p>
              </div>
              <button onClick={() => setShowLogsModal(null)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-8 space-y-6 bg-white overflow-y-auto custom-scrollbar">
              
              {/* TABS DE BITÁCORA */}
              <div className="flex gap-4 border-b border-gray-100 pb-4">
                <button 
                  onClick={() => setActiveLogTab('operaciones')} 
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLogTab === 'operaciones' ? 'bg-[#0B132B] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  Operaciones / Ventas
                </button>
                <button 
                  onClick={() => setActiveLogTab('conexiones')} 
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLogTab === 'conexiones' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  Conexiones / Login
                </button>
              </div>

              {activeLogTab === 'operaciones' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Leads Asignados</p>
                      <p className="text-xl font-black italic text-orange-900">{showLogsModal.assignedLeads || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                      <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Ventas Cerradas</p>
                      <p className="text-xl font-black italic text-green-900">{showLogsModal.closedSales || 0}</p>
                    </div>
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Historial de Operaciones</h4>
                  <div className="space-y-3">
                    {(!showLogsModal.operationLogs || showLogsModal.operationLogs.length === 0) ? (
                      <p className="text-center py-6 text-gray-400 text-[10px] font-bold uppercase tracking-widest">No hay operaciones registradas para este usuario.</p>
                    ) : (
                      showLogsModal.operationLogs.map((log: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-[10px] font-black text-gray-400 w-20 pt-0.5">{new Date(log.date || new Date()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <div className="flex-1"><p className="text-xs font-bold text-[#0B132B]">{log.action}</p><p className="text-[9px] text-green-600 uppercase font-black mt-1">{log.detail}</p></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeLogTab === 'conexiones' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Estado Actual</p>
                    <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      {isUserConnected ? (
                        <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Conectado (Sesión Activa)</>
                      ) : (
                        <><span className="w-2 h-2 rounded-full bg-gray-400"></span> Desconectado</>
                      )}
                    </p>
                  </div>

                  <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Registro de Accesos</h4>
                  <div className="space-y-3">
                    {(!showLogsModal.connectionLogs || showLogsModal.connectionLogs.length === 0) ? (
                      <p className="text-center py-6 text-gray-400 text-[10px] font-bold uppercase tracking-widest">El usuario aún no ha iniciado sesión.</p>
                    ) : (
                      showLogsModal.connectionLogs.map((log: any, idx: number) => (
                        <div key={idx} className={`flex gap-4 items-start p-4 rounded-xl border ${log.success !== false ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-100'}`}>
                          <span className={`text-[10px] font-black w-24 pt-0.5 ${log.success !== false ? 'text-gray-400' : 'text-red-400'}`}>{new Date(log.date || new Date()).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <div className="flex-1">
                            <p className={`text-xs font-bold ${log.success !== false ? 'text-green-600' : 'text-red-600'}`}>{log.action}</p>
                            <p className={`text-[9px] uppercase mt-1 ${log.success !== false ? 'text-gray-500' : 'text-red-400'}`}>IP: {log.ip || 'Desconocida'} • Dispositivo: {log.device || 'Desconocido'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
              <button onClick={() => setShowLogsModal(null)} className="bg-white border-2 border-gray-200 text-gray-600 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                Cerrar Bitácora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
