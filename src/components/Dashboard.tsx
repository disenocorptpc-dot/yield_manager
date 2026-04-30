import React, { useState } from 'react';
import HorizontalGanttView from './HorizontalGanttView';
import ResourceTimelineView from './ResourceTimelineView';
import ProjectModal from './ProjectModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import {
  Plus, LayoutList, Layers, Star, AlertTriangle,
  CheckCircle2, Clock4, TrendingDown, Package
} from 'lucide-react';
import type { Project } from '../App';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface DashboardProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const calculateProgress = (p: Project) => {
  const total = p.phases.length + (p.prerequisites?.length || 0);
  if (total === 0) return 0;
  const done =
    p.phases.filter(ph => ph.status === 'Terminada').length +
    (p.prerequisites || []).filter(r => r.isFulfilled).length;
  return Math.round((done / total) * 100);
};

const STATUS_CHIP = {
  'En tiempo': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Desfasado':  'bg-red-500/10 text-red-400 border-red-500/20',
  'En pausa':   'bg-amber-500/10 text-amber-400 border-amber-500/20',
};
const STATUS_DOT = {
  'En tiempo': 'bg-emerald-400',
  'Desfasado':  'bg-red-400',
  'En pausa':   'bg-amber-400',
};

function urgencyLabel(dueDate: string): { label: string; urgent: boolean } {
  const diff = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (diff < 0)  return { label: `Vencido hace ${Math.abs(diff)}d`, urgent: true };
  if (diff === 0) return { label: 'Vence hoy', urgent: true };
  if (diff <= 3)  return { label: `En ${diff} día${diff > 1 ? 's' : ''}`, urgent: true };
  return { label: `En ${diff} días`, urgent: false };
}

export default function Dashboard({ projects, setProjects }: DashboardProps) {
  const [activeTab, setActiveTab]           = useState<'gantt' | 'recursos'>('gantt');
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editProjectData, setEditProjectData] = useState<Project | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalActive   = projects.filter(p => p.status !== 'En pausa').length;
  const totalDelay    = projects.filter(p => p.status === 'Desfasado').length;
  const totalPaused   = projects.filter(p => p.status === 'En pausa').length;
  const avgProgress   = projects.length
    ? Math.round(projects.reduce((acc, p) => acc + calculateProgress(p), 0) / projects.length)
    : 0;

  // ── Logistics ────────────────────────────────────────────────────────────
  const pendingLogistics = projects
    .flatMap(p =>
      (p.prerequisites || [])
        .filter(r => !r.isFulfilled)
        .map(r => ({ ...r, projectName: p.name, projectId: p.id, color: p.color }))
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // ── Helpers ──────────────────────────────────────────────────────────────
  const openNewProject = () => { setEditProjectData(undefined); setIsModalOpen(true); };
  const openEditProject = (id: string) => {
    setEditProjectData(projects.find(p => p.id === id)!);
    setSelectedProjectId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-full gap-5">

      {/* ──────────────────────────────────────────────────────
          LEFT SIDEBAR
      ────────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col gap-4">

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="kpi-card">
            <span className="kpi-label">Activos</span>
            <div className="flex items-end gap-1.5 mt-1">
              <span className="kpi-value">{totalActive}</span>
              <Layers className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
            </div>
          </div>
          <div className={`kpi-card ${totalDelay > 0 ? 'border-red-500/20 bg-red-950/20' : ''}`}>
            <span className="kpi-label">Desfasados</span>
            <div className="flex items-end gap-1.5 mt-1">
              <span className={`kpi-value ${totalDelay > 0 ? 'text-red-400' : ''}`}>{totalDelay}</span>
              <TrendingDown className={`w-3.5 h-3.5 mb-0.5 ${totalDelay > 0 ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Avance prom.</span>
            <div className="flex items-end gap-1.5 mt-1">
              <span className="kpi-value">{avgProgress}%</span>
            </div>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">En pausa</span>
            <div className="flex items-end gap-1.5 mt-1">
              <span className="kpi-value">{totalPaused}</span>
              <Clock4 className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
            </div>
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden shadow-xl">
          <div className="px-4 pt-4 pb-2 border-b border-white/5">
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Proyectos en Taller</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-2 space-y-1">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <Package className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500">El tablero está vacío.</p>
              </div>
            ) : (
              projects.map(proj => {
                const prog = calculateProgress(proj);
                const isMain = proj.isMain;
                return (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all group relative overflow-hidden
                      ${isMain ? 'bg-orange-500/5 border border-orange-500/10' : 'hover:bg-white/5 border border-transparent hover:border-white/5'}`}
                  >
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b ${proj.color}`} />

                    <div className="pl-3 flex items-center gap-2.5">
                      {/* Thumbnail */}
                      <div className={`w-9 h-9 rounded-lg shrink-0 overflow-hidden bg-gradient-to-br ${proj.color} border border-white/10`}>
                        {proj.imageUrl && <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isMain && <Star className="w-2.5 h-2.5 text-orange-400 fill-orange-400 shrink-0" />}
                          <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">{proj.name}</p>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1 bg-black/50 rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full bg-gradient-to-r ${proj.color} transition-all`} style={{ width: `${prog}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 w-6 text-right">{prog}%</span>
                        </div>
                      </div>

                      {/* Status dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[proj.status]}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-3 border-t border-white/5">
            <button
              onClick={openNewProject}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]"
            >
              <Plus className="w-4 h-4" /> Nuevo Proyecto
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          CENTER: TIMELINE
      ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Tab selector */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900/60 border border-white/5 p-1 rounded-xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab('gantt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'gantt'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-4 h-4" /> Línea de Tiempo
            </button>
            <button
              onClick={() => setActiveTab('recursos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'recursos'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" /> Por Proceso
            </button>
          </div>

          {/* Project color legend */}
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {projects.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${p.color} shrink-0`} />
                <span className="truncate max-w-[72px]">{p.name}</span>
              </div>
            ))}
            {projects.length > 5 && (
              <span className="text-xs text-slate-600">+{projects.length - 5}</span>
            )}
          </div>
        </div>

        {/* View */}
        <div className="flex-1 min-h-0">
          {activeTab === 'gantt' ? (
            <HorizontalGanttView projects={projects} onProjectClick={setSelectedProjectId} />
          ) : (
            <ResourceTimelineView projects={projects} onProjectClick={setSelectedProjectId} />
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          RIGHT: LOGISTICS
      ────────────────────────────────────────────────────── */}
      <div className="w-60 shrink-0 flex flex-col glass-panel rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Logística Crítica</h2>
          </div>
          <p className="text-[10px] text-slate-600">Suministros y requisitos pendientes</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {pendingLogistics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Todo el material y logística cubiertos.
              </p>
            </div>
          ) : (
            pendingLogistics.map(req => {
              const { label, urgent } = urgencyLabel(req.dueDate);
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedProjectId(req.projectId)}
                  className="p-3 bg-black/30 border border-white/[0.06] rounded-xl hover:bg-black/50 cursor-pointer transition-colors relative overflow-hidden group"
                >
                  {/* Left accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${req.color}`} />
                  <div className="pl-2">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-1 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${req.color} shrink-0`} />
                        {req.projectName}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        urgent
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : 'bg-slate-800 text-slate-500 border border-white/5'
                      }`}>
                        {label}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 leading-tight mb-1">{req.name}</h4>
                    <p className="text-[9px] text-slate-500">
                      {req.type} · <span className="text-slate-400">{req.owner}</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {isModalOpen && (
        <ProjectModal
          existingProjects={projects}
          initialData={editProjectData}
          onClose={() => { setIsModalOpen(false); setEditProjectData(undefined); }}
          onSave={projectToSave => {
            if (editProjectData) {
              setProjects(projects.map(p => p.id === projectToSave.id ? projectToSave : p));
            } else {
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
          onUpdateProject={updated => setProjects(projects.map(p => p.id === updated.id ? updated : p))}
          onDeleteProject={id => {
            const isMain = projects.find(p => p.id === id)?.isMain;
            const updated = projects.filter(p => p.id !== id);
            if (isMain && updated.length > 0) updated[0].isMain = true;
            setProjects(updated);
            setSelectedProjectId(null);
          }}
          onEdit={() => openEditProject(selectedProjectId)}
        />
      )}
    </div>
  );
}
