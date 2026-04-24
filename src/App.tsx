import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginPanel from './components/LoginPanel';

export interface Prerequisite {
  id: string;
  name: string;
  type: 'Material' | 'Herramienta' | 'Archivo 3D' | 'Otro';
  dueDate: string;
  isFulfilled: boolean;
  owner: string; 
  linkedPhaseId?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  imageUrl?: string;
  isMain: boolean;
  projectType: 'Principal' | 'Comodín';
  status: 'En tiempo' | 'Desfasado' | 'En pausa';
  phases: Phase[];
  prerequisites: Prerequisite[];
}

export interface Phase {
  id: string;
  name: string;
  process: string;
  startDate: string; 
  endDate: string; 
  notes?: string;
  status: 'Pendiente' | 'En proceso' | 'Terminada';
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  // Check local storage for existing session on load
  useEffect(() => {
    const session = localStorage.getItem('yield_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch projects from central Cloudflare D1 Database on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
          setIsDataLoaded(true);
        } else {
          console.error("Error del servidor D1:", response.status);
        }
      } catch (error) {
        console.error("No se pudo cargar de la DB:", error);
      }
    };
    
    fetchProjects();
  }, [isAuthenticated]);

  // Hook into setProjects to automatically update the DB
  const handleUpdateProjects = async (newProjects: Project[] | ((prev: Project[]) => Project[])) => {
    if (!isDataLoaded) {
      alert("Error Crítico de Seguridad: No se pueden guardar cambios porque la base de datos no se cargó correctamente al inicio. Si guardamos ahora, la base de datos se sobreescribiría y perderías todo. Por favor, recarga la página.");
      return;
    }

    // Resolve callback if needed
    const resolvedProjects = typeof newProjects === 'function' ? newProjects(projects) : newProjects;
    setProjects(resolvedProjects);

    // Sync to backend DB
    try {
      const dbRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: resolvedProjects })
      });
      
      const dbData = await dbRes.json();
      if (!dbData.success) {
        alert("Fallo Cloudflare D1: " + (dbData.error || "Error desconocido"));
        console.error("DB Error:", dbData.error);
      }
    } catch (error) {
      console.error("Error de Red / Fetch:", error);
      alert("Error de Red al guardar en DB.");
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('yield_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('yield_auth');
  };

  if (!isAuthenticated) {
    return <LoginPanel onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen print:h-auto w-screen flex print:block flex-col font-sans relative">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      <header className="glass-header px-6 py-4 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            Y
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">YieldManager</h1>
            <p className="text-xs text-orange-400 font-medium tracking-widest uppercase">Studio Sync 3D</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-5 py-2.5 glass-panel hover:bg-slate-800 text-slate-300 hover:text-white font-medium rounded-lg transition-all duration-300 text-sm flex items-center gap-2">
            📊 Reportes
          </button>
          <button 
            onClick={handleLogout}
            className="px-4 py-2.5 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-500/50 rounded-lg transition-all duration-300 text-sm font-medium"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="flex-1 print:block p-6 overflow-hidden print:overflow-visible flex flex-col z-10 relative">
        <Dashboard projects={projects} setProjects={handleUpdateProjects} />
      </main>
    </div>
  );
}

export default App;
