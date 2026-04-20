import React, { useState } from 'react';
import { Lock, User, ChevronRight } from 'lucide-react';

interface LoginPanelProps {
  onLogin: () => void;
}

export default function LoginPanel({ onLogin }: LoginPanelProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    // Simulated verification delay
    setTimeout(() => {
      // Hardcoded password for now - will be moved to backend layer later
      if (password === 'studio3d' || password === 'admin') {
        onLogin();
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-orange-500/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_30px_rgba(249,115,22,0.4)] mb-6">
            Y
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">YieldManager</h1>
          <p className="text-sm text-orange-400 font-medium tracking-widest uppercase mt-2">Acceso Restringido</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Contraseña Máster</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-[#0d0d12] border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-orange-500/50'} rounded-xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all duration-300`}
                placeholder="Ingresa la clave..."
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 ml-1 animate-pulse">Contraseña incorrecta. Intenta de nuevo.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className={`w-full relative group overflow-hidden rounded-xl py-3 px-4 font-semibold text-white transition-all duration-300 ${
              isLoading || !password 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1'
            }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Ingresar al Sistema <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
            <User size={14} /> The Palace Company &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
