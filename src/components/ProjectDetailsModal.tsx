import React, { useState } from 'react';
import type { Project } from '../App';
import { X, Calendar, Edit, Paperclip, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onEdit: () => void;
}

export default function ProjectDetailsModal({ project, onClose, onUpdateProject, onDeleteProject, onEdit }: ProjectDetailsModalProps) {
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);

  const handlePhaseUpdate = (id: string, field: 'startDate' | 'endDate' | 'notes', value: string) => {
    const phaseIndex = project.phases.findIndex(p => p.id === id);
    if (phaseIndex === -1) return;

    const updatedPhases = [...project.phases];
    const oldPhase = updatedPhases[phaseIndex];
    updatedPhases[phaseIndex] = { ...oldPhase, [field]: value };

    // Lógica de Yield: Cascada de Fechas (reutilizada)
    if (field === 'startDate' || field === 'endDate') {
      const oldDate = new Date(oldPhase[field] + 'T12:00:00Z');
      const newDate = new Date(value + 'T12:00:00Z');
      const diffTime = newDate.getTime() - oldDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays !== 0) {
        if (field === 'startDate') {
           const ownEnd = new Date(updatedPhases[phaseIndex].endDate + 'T12:00:00Z');
           ownEnd.setDate(ownEnd.getDate() + diffDays);
           updatedPhases[phaseIndex].endDate = ownEnd.toISOString().split('T')[0];
        }

        for (let j = phaseIndex + 1; j < updatedPhases.length; j++) {
          const nextPhase = updatedPhases[j];
          const nextStart = new Date(nextPhase.startDate + 'T12:00:00Z');
          nextStart.setDate(nextStart.getDate() + diffDays);
          
          const nextEnd = new Date(nextPhase.endDate + 'T12:00:00Z');
          nextEnd.setDate(nextEnd.getDate() + diffDays);
          
          updatedPhases[j] = {
            ...nextPhase,
            startDate: nextStart.toISOString().split('T')[0],
            endDate: nextEnd.toISOString().split('T')[0]
          };
        }
      }
    }
    
    onUpdateProject({ ...project, phases: updatedPhases });
  };
  const calculateProgress = () => {
    const total = project.phases.length + (project.prerequisites?.length || 0);
    if (total === 0) return 0;
    const done = project.phases.filter(ph => ph.status === 'Terminada').length + (project.prerequisites || []).filter(req => req.isFulfilled).length;
    return Math.round((done / total) * 100);
  };
  
  const currentProgress = calculateProgress();

  const togglePhaseStatus = (phaseId: string) => {
     const updatedPhases = project.phases.map(p => {
       if (p.id === phaseId) {
         return { ...p, status: p.status === 'Terminada' ? 'Pendiente' : 'Terminada' } as const;
       }
       return p;
     });
     onUpdateProject({ ...project, phases: updatedPhases });
  };
  
  const togglePrerequisite = (reqId: string) => {
     const updatedReqs = project.prerequisites.map(r => {
       if (r.id === reqId) {
         return { ...r, isFulfilled: !r.isFulfilled };
       }
       return r;
     });
     onUpdateProject({ ...project, prerequisites: updatedReqs });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-slate-900 border border-white/10 shadow-2xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Encabezado Visual */}
        <div className="relative h-48 w-full bg-slate-950 flex-shrink-0">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover opacity-60" />
          ) : (
             <div className={`w-full h-full bg-gradient-to-br ${project.color} opacity-40`}></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md">
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-4 left-6 flex items-end gap-4">
            <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-gradient-to-br ${project.color}`}>
               {project.imageUrl && <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-white drop-shadow-md">{project.name}</h2>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${project.projectType === 'Principal' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>{project.projectType}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${project.status === 'En tiempo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : project.status === 'Desfasado' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-300 drop-shadow flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${project.color} border border-white/30`}></span>
                {project.phases.length} {project.phases.length === 1 ? 'fase programada' : 'fases programadas'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar under header */}
        <div className="bg-slate-950/80 px-6 py-4 border-b border-white/5 flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-max">Avance del Proyecto</span>
           <div className="flex-1 h-3 bg-black/40 rounded-full border border-white/5 overflow-hidden">
             <div className={`h-full bg-gradient-to-r ${project.color} transition-all duration-500`} style={{ width: `${currentProgress}%` }}></div>
          </div>
          <span className="text-sm font-bold text-white">{currentProgress}%</span>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 grid grid-cols-5 gap-8">
          
          {/* Timeline de Fases */}
          <div className="col-span-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Plan de Trabajo & Checklists</h3>
            <div className="space-y-4">
              {project.phases.map((phase, idx) => {
                const startDate = format(parseISO(phase.startDate), "d 'de' MMMM", { locale: es });
                const endDate = format(parseISO(phase.endDate), "d 'de' MMMM", { locale: es });
                const isDone = phase.status === 'Terminada';

                return (
                  <div key={phase.id} className={`relative pl-6 transition-all ${isDone ? 'opacity-50 grayscale' : ''}`}>
                    {/* Linea vertical de tiempo */}
                    {idx !== project.phases.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-white/10"></div>
                    )}
                    {/* Indicador circular/Check */}
                    <button 
                      onClick={() => togglePhaseStatus(phase.id)}
                      className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 ${isDone ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:border-emerald-500'}`} 
                      style={{ borderColor: isDone ? '' : 'var(--color-primary)' }}
                    >
                       {isDone ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${project.color}`}></div>}
                    </button>
                    
                    {editingPhaseId === phase.id ? (
                      <div className="bg-slate-950 border border-orange-500/50 rounded-xl p-4 ml-4 shadow-lg shadow-orange-500/10">
                        <div className="flex justify-between items-center mb-3">
                           <h4 className="font-bold text-lg text-orange-400">{phase.process} <span className="text-xs text-slate-500 ml-2 font-normal">(Editando)</span></h4>
                        </div>
                        <div className="flex gap-3 mb-3">
                           <div className="flex-1">
                             <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Inicio</label>
                             <input type="date" value={phase.startDate} onChange={e => handlePhaseUpdate(phase.id, 'startDate', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-orange-500 outline-none" />
                           </div>
                           <div className="flex-1">
                             <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Fin</label>
                             <input type="date" value={phase.endDate} onChange={e => handlePhaseUpdate(phase.id, 'endDate', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-orange-500 outline-none" />
                           </div>
                        </div>
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Observaciones</label>
                        <textarea 
                           value={phase.notes} 
                           onChange={e => handlePhaseUpdate(phase.id, 'notes', e.target.value)}
                           placeholder="Observaciones, detalles o requerimientos..."
                           className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white mb-3 min-h-[60px] focus:border-orange-500 outline-none resize-y"
                        />
                        <div className="flex justify-end">
                           <button onClick={() => setEditingPhaseId(null)} className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2">
                             <CheckCircle className="w-4 h-4" /> Listo
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 ml-4 hover:bg-white/10 transition-colors group relative">
                        <button onClick={() => setEditingPhaseId(phase.id)} className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-orange-500 rounded-md text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg" title="Editar fase">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex justify-between items-start mb-2 pr-8">
                          <div className="flex items-center gap-3">
                             <h4 className={`font-bold text-lg ${isDone ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{phase.process}</h4>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-black/40 text-slate-400 flex items-center gap-1.5 border border-white/5">
                            <Calendar className="w-3 h-3" />
                            {startDate} - {endDate}
                          </span>
                        </div>
                        {(!isDone || phase.notes) && (
                           <p className="text-sm text-slate-400 mt-2 p-3 bg-black/20 rounded-lg border border-white/5 leading-relaxed">
                             <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-1">Observaciones / Variantes</span>
                             {phase.notes ? phase.notes : <span className="italic opacity-50">Sin observaciones especiales.</span>}
                           </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Panel Lateral Interno: Requisitos y Specs */}
          <div className="col-span-2 space-y-6">
             <div className="bg-black/30 rounded-xl border border-white/5 p-5">
               <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-orange-400" /> Pre-requisitos / Material
               </h3>
               
               {(!project.prerequisites || project.prerequisites.length === 0) ? (
                 <p className="text-xs text-slate-500 italic">No hay suministros comprometidos.</p>
               ) : (
                 <div className="space-y-3">
                   {project.prerequisites.map(req => (
                     <div key={req.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${req.isFulfilled ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10 hover:border-orange-500/50'}`}>
                        <button onClick={() => togglePrerequisite(req.id)} className={`min-w-5 w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors ${req.isFulfilled ? 'bg-emerald-500 border-emerald-400' : 'bg-black/50 border-white/20 hover:border-orange-400'}`}>
                          {req.isFulfilled && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <div>
                          <p className={`text-sm font-bold leading-tight ${req.isFulfilled ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{req.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[9px] uppercase font-bold text-slate-500 bg-black/40 px-1.5 py-0.5 rounded">{req.type}</span>
                            <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">Límite: {req.dueDate}</span>
                            {req.linkedPhaseId && (
                               <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                 Req: {project.phases.find(p => p.id === req.linkedPhaseId)?.process || 'Fase Desconocida'}
                               </span>
                            )}
                          </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

            {/* Accesos Rápidos */}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto permanentemente?')) {
                    onDeleteProject(project.id);
                  }
                }} 
                className="w-14 shrink-0 flex items-center justify-center p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500 text-red-500 transition-all group"
                title="Eliminar proyecto"
              >
                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 hover:border-orange-500 hover:text-white text-orange-400 transition-all font-bold group">
                <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Modificar Tiempos o Suministros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
