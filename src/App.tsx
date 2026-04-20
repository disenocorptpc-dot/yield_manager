import React, { useState } from 'react';
import Dashboard from './components/Dashboard';

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

  return (
    <div className="h-screen w-screen flex flex-col font-sans relative">
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
        </div>
      </header>
      <main className="flex-1 p-6 overflow-hidden flex flex-col z-10 relative">
        <Dashboard projects={projects} setProjects={setProjects} />
      </main>
    </div>
  );
}

export default App;
