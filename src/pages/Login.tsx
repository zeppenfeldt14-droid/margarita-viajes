import { useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: string) => void;
  onBack: () => void;
}

export default function Login({ onLogin, onBack }: LoginProps) {
  const [loginData, setLoginData] = useState({ alias: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.alias || !loginData.password) {
      setError("Por favor completa los campos.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: loginData.alias, password: loginData.password })
      });

      if (!response.ok) {
        setError("Credenciales incorrectas");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("staff_token", data.token);
        localStorage.setItem("login_time", Date.now().toString());
        localStorage.setItem("logged_user_id", data.user?.id || '');
        localStorage.setItem('user_level', (data.user?.level || 3).toString());
        localStorage.setItem('user_modules', JSON.stringify(data.user.modules || {}));
        
        // Registrar bitácora de conexión
        try {
          await api.saveConnectionLog(data.user.id, {
            date: new Date().toISOString(),
            action: 'Inicio de Sesión',
            success: true,
            ip: 'Detectada',
            device: navigator.userAgent
          });
        } catch (logErr) {
          console.error("Error al registrar bitácora:", logErr);
        }
        
        onLogin(data.user?.name || 'Administrador');
      } else {
        setError("Error de servidor: No se recibió token.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Error de conexión con el servidor");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#ea580c]/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
      
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-[420px] shadow-2xl relative z-10 text-center">
        <div className="w-20 h-20 bg-[#ea580c] rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-orange-500/40">
          <Lock size={36} className="text-white" />
        </div>
        
        <h2 className="text-3xl font-black italic tracking-tight text-[#0B132B] mb-8 uppercase">Acceso Staff</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="relative">
            <input
              type="text"
              name="alias"
              placeholder="Alias de Usuario"
              value={loginData.alias}
              onChange={handleLoginChange}
              className="w-full bg-[#F8F9FB] text-[#0B132B] font-bold text-sm px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#ea580c]/50 transition-all border-none"
            />
          </div>
          
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={loginData.password}
            onChange={handleLoginChange}
            className="w-full bg-[#F8F9FB] text-[#0B132B] font-bold text-sm px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#ea580c]/50 transition-all border-none"
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-orange-400 cursor-not-allowed' : 'bg-[#0B132B] hover:bg-orange-600'} text-white py-4 rounded-2xl font-black tracking-widest text-sm transition-all shadow-lg shadow-blue-500/20 mt-2 flex items-center justify-center gap-2 uppercase`}
          >
            {isLoading ? 'VERIFICANDO...' : 'ENTRAR AL SISTEMA'}
          </button>
        </form>

        <div className="mt-8">
          <button onClick={onBack} className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ea580c] transition-colors">
            VOLVER A LA WEB
          </button>
        </div>
      </div>
    </div>
  );
}
