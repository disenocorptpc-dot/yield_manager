import React, { useState } from 'react';
import GanttMonthView from './GanttMonthView';
import ProjectModal from './ProjectModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { PackagePlus, Star, ImageIcon, Plus, Box, AlertCircle, CheckCircle } from 'lucide-react';
import type { Project, Phase } from '../App';

interface DashboardProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

// Helper to generate IDs
const uid = () => Math.random().toString(36).substr(2, 9);

export default function Dashboard({ projects, setProjects }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProjectData, setEditProjectData] = useState<Project | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Dynamic Calculations
  const calculateProgress = (p: Project) => {
    const total = p.phases.length + (p.prerequisites?.length || 0);
    if (total === 0) return 0;
    const done = p.phases.filter(ph => ph.status === 'Terminada').length + (p.prerequisites || []).filter(req => req.isFulfilled).length;
    return Math.round((done / total) * 100);
  };

  const mainProject = projects.find(p => p.isMain);
  const otherProjects = projects.filter(p => !p.isMain);

  // Get all unfulfilled logistics across all projects, sorted by date
  const pendingLogistics = projects.flatMap(p => 
    (p.prerequisites || [])
      .filter(req => !req.isFulfilled)
      .map(req => ({ ...req, projectName: p.name, projectId: p.id, color: p.color }))
  ).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar para Proyectos */}
      <div className="w-80 glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl flex-shrink-0">
        
        {/* Proyecto Principal (Destacado) */}
        {mainProject ? (
          <div className="p-5 border-b border-white/10 relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${mainProject.color} opacity-20 pointer-events-none transition-opacity group-hover:opacity-30`}></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-1 rounded-md border border-orange-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-orange-400" /> PROYECTO PRINCIPAL
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${mainProject.status === 'En tiempo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : mainProject.status === 'Desfasado' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {mainProject.status}
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shadow-lg shrink-0 relative">
                  {mainProject.imageUrl ? (
                    <img src={mainProject.imageUrl} alt={mainProject.name} className="w-full h-full object-cover" />
                  ) : (
                    <Box className="w-6 h-6 text-slate-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{mainProject.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">{mainProject.phases.length} Fases programadas</p>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full bg-gradient-to-r ${mainProject.color}`} style={{ width: `${calculateProgress(mainProject)}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-white">{calculateProgress(mainProject)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-center text-slate-500 text-sm italic text-center">
            No hay proyecto principal.<br/>Marca un proyecto de la lista.
          </div>
        )}

        {/* Lista de otros proyectos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activos en Taller</h3>
          </div>
          
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">El tablero está vacío.</p>
            </div>
          ) : (
            otherProjects.map(proj => (
              <div key={proj.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer flex gap-3 items-center group">
                <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 relative`}>
                  {proj.imageUrl ? (
                    <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${proj.color} opacity-80`}></div>
                  )}
                  {/* Indicator of project color even over image */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${proj.color}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-200 text-sm truncate group-hover:text-white transition-colors">{proj.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500">{proj.projectType}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'En tiempo' ? 'bg-emerald-400' : proj.status === 'Desfasado' ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                    <span className="text-[10px] text-slate-500">{calculateProgress(proj)}%</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newProjects = projects.map(p => ({ ...p, isMain: p.id === proj.id }));
                    setProjects(newProjects);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                  title="Marcar como principal"
                >
                  <Star className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Acciones base */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <button onClick={() => { setEditProjectData(undefined); setIsModalOpen(true); }} className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Main Content Area (Calendario) */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex bg-slate-900/50 border border-white/5 p-1 rounded-lg backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-white/10 shadow-sm text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Calendario General
            </button>
            <button 
              onClick={() => setActiveTab('gantt')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'gantt' ? 'bg-white/10 shadow-sm text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Línea de Tiempo
            </button>
          </div>
          {/* Leyenda de proyectos activos (colores) */}
          <div className="flex items-center gap-3">
            {projects.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${p.color}`}></span>
                <span className="truncate max-w-[80px]">{p.name}</span>
              </div>
            ))}
            {projects.length > 4 && <span className="text-xs text-slate-500">+{projects.length - 4} más</span>}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden p-2 relative bg-slate-950/30">
          {activeTab === 'calendar' ? (
            <GanttMonthView projects={projects} onProjectClick={setSelectedProjectId} />
          ) : (
             <div className="flex items-center justify-center h-full text-slate-500">
              <p>Vista de recursos en construcción...</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: LOGISTICS & ALERTS */}
      <div className="w-80 bg-slate-900 border-l border-white/5 flex flex-col z-10 shrink-0">
        <div className="p-5 border-b border-white/5 bg-slate-950/50">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-orange-400" /> Logística Crítica
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">Suministros y requisitos pendientes</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {pendingLogistics.length === 0 ? (
            <div className="text-center p-6 bg-white/5 rounded-xl border border-dashed border-white/10">
              <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Todo el material y logística está cubierto.</p>
            </div>
          ) : (
            pendingLogistics.map(req => {
              const overdue = new Date(req.dueDate) < new Date('2026-04-18');
              return (
                <div key={req.id} onClick={() => setSelectedProjectId(req.projectId)} className="p-3 bg-black/30 border border-white/5 rounded-xl hover:bg-black/50 cursor-pointer transition-colors relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${req.color}`}></div>
                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${req.color}`}></span>
                        {req.projectName}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${overdue ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                         {req.dueDate}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-1 leading-tight">{req.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Resp: <span className="text-slate-300">{req.owner}</span></p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODALS */}
      {isModalOpen && (
        <ProjectModal 
          existingProjects={projects}
          initialData={editProjectData}
          onClose={() => { setIsModalOpen(false); setEditProjectData(undefined); }} 
          onSave={(projectToSave) => {
            if (editProjectData) {
              // Update existing
              setProjects(projects.map(p => p.id === projectToSave.id ? projectToSave : p));
            } else {
              // Create new, make main if first
              if (projects.length === 0) projectToSave.isMain = true;
              setProjects([...projects, projectToSave]);
            }
            setIsModalOpen(false);
            setEditProjectData(undefined);
          }} 
        />
      )}
      
      {selectedProjectId && !isModalOpen && (
        <ProjectDetailsModal 
          project={projects.find(p => p.id === selectedProjectId)!} 
          onClose={() => setSelectedProjectId(null)} 
          onUpdateProject={(updatedProject) => {
            setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
          }}
          onDeleteProject={(projectId) => {
            const isMain = projects.find(p => p.id === projectId)?.isMain;
            const updatedProjects = projects.filter(p => p.id !== projectId);
            if (isMain && updatedProjects.length > 0) {
              updatedProjects[0].isMain = true;
            }
            setProjects(updatedProjects);
            setSelectedProjectId(null);
          }}
          onEdit={() => {
            setEditProjectData(projects.find(p => p.id === selectedProjectId)!);
            setSelectedProjectId(null);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
