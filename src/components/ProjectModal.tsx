import React, { useState } from 'react';
import type { Project, Phase, Prerequisite } from '../App';
import { X, Plus, Trash2, ImagePlus, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const STANDARD_PROCESSES = [
  'Bocetaje',
  'Modelado en 3D',
  'Impresión',
  'Lijado / Preparación',
  'Ensamble',
  'Pintura',
  'Acabados'
];

const PREREQUISITE_TYPES = ['Material', 'Archivo 3D', 'Herramienta', 'Otro'];

const ALL_COLORS = [
  'from-orange-400 to-red-500',
  'from-yellow-400 to-amber-600',
  'from-emerald-400 to-teal-600',
  'from-cyan-400 to-blue-600',
  'from-indigo-500 to-purple-800',
  'from-purple-500 to-fuchsia-500',
  'from-rose-400 to-red-600',
  'from-stone-500 to-stone-800',
  'from-lime-400 to-green-600',
  'from-pink-500 to-rose-600'
];

interface ProjectModalProps {
  existingProjects: Project[];
  initialData?: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
}

const uid = () => Math.random().toString(36).substr(2, 9);

export default function ProjectModal({ existingProjects, initialData, onClose, onSave }: ProjectModalProps) {
  const otherProjects = initialData ? existingProjects.filter(p => p.id !== initialData.id) : existingProjects;
  const usedColors = otherProjects.map(p => p.color);
  const availableColors = ALL_COLORS.filter(c => !usedColors.includes(c));
  const selectableColors = availableColors.length > 0 ? availableColors : ALL_COLORS;
  
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [color, setColor] = useState(() => {
    if (initialData?.color) return initialData.color;
    return selectableColors[Math.floor(Math.random() * selectableColors.length)];
  });
  const [projectType, setProjectType] = useState<'Principal' | 'Comodín'>(initialData?.projectType || 'Principal');
  const [status, setStatus] = useState<'En tiempo' | 'Desfasado' | 'En pausa'>(initialData?.status || 'En tiempo');
  
  const [phases, setPhases] = useState<Phase[]>(
    initialData?.phases || [
      { id: uid(), name: 'Fase 1', process: 'Bocetaje', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], notes: '', status: 'Pendiente' }
    ]
  );

  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>(
    initialData?.prerequisites || []
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPhase = () => {
    const newStartDate = phases.length > 0 ? phases[phases.length - 1].endDate : new Date().toISOString().split('T')[0];
    setPhases([...phases, { id: uid(), name: `Fase ${phases.length + 1}`, process: 'Impresión', startDate: newStartDate, endDate: newStartDate, notes: '', status: 'Pendiente' }]);
  };

  const updatePhase = (id: string, field: keyof Phase, value: string) => {
    setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePhase = (id: string) => {
    setPhases(phases.filter(p => p.id !== id));
  };

  const addPrerequisite = () => {
    setPrerequisites([...prerequisites, { id: uid(), name: '', type: 'Material', dueDate: new Date().toISOString().split('T')[0], isFulfilled: false, owner: '' }]);
  };

  const updatePrerequisite = (id: string, field: keyof Prerequisite, value: string | boolean) => {
    setPrerequisites(prerequisites.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePrerequisite = (id: string) => {
    setPrerequisites(prerequisites.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      id: initialData?.id || uid(),
      name,
      color,
      imageUrl: imageUrl || '',
      isMain: initialData ? initialData.isMain : false,
      projectType,
      status,
      phases,
      prerequisites
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-slate-900 border border-white/10 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          {/* Status Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">Categoría del Proyecto</label>
                <div className="flex bg-black/30 p-1 rounded-lg border border-white/5">
                  <button type="button" onClick={() => setProjectType('Principal')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${projectType === 'Principal' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                    Principal
                  </button>
                  <button type="button" onClick={() => setProjectType('Comodín')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${projectType === 'Comodín' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                    Comodín (Ambulante)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">Estado Actual</label>
                 <div className="flex bg-black/30 p-1 rounded-lg border border-white/5">
                  <button type="button" onClick={() => setStatus('En tiempo')} title="En Tiempo" className={`flex-1 flex justify-center py-2 rounded-md transition-all ${status === 'En tiempo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'}`}><CheckCircle className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setStatus('Desfasado')} title="Desfasado" className={`flex-1 flex justify-center py-2 rounded-md transition-all ${status === 'Desfasado' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-slate-300'}`}><AlertCircle className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setStatus('En pausa')} title="En Pausa" className={`flex-1 flex justify-center py-2 rounded-md transition-all ${status === 'En pausa' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}><Clock className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Nombre de la Pieza</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors" placeholder="Ej. Máscara de Dragón" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Foto de Referencia</label>
                <label className="w-full h-[52px] bg-black/30 border border-white/10 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-black/50 hover:border-orange-500 transition-colors group">
                  <ImagePlus className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
                  <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                    {imageUrl ? (isEditing ? 'Cambiar Imagen' : 'Imagen Lista - Cambiar') : 'Seleccionar Archivo...'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-4">
               <div className="w-full h-24 bg-black/20 rounded-lg border border-white/5 flex items-center justify-center overflow-hidden relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-600 font-medium">Sin imagen</span>
                  )}
               </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">Color del Proyecto</label>
                <div className="grid grid-cols-5 gap-2">
                  {selectableColors.map(c => (
                    <button 
                      key={c} 
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 rounded-lg bg-gradient-to-br ${c} border-2 transition-all cursor-pointer ${color === c ? 'border-white scale-110 shadow-lg relative z-10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                  {isEditing && !selectableColors.includes(color) && (
                     <button 
                      type="button"
                      onClick={() => setColor(color)}
                      className={`h-8 rounded-lg bg-gradient-to-br ${color} border-2 transition-all cursor-pointer border-white scale-110 shadow-lg relative z-10`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/10">
            {/* PREREQUISITOS / SUMINISTROS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" /> Suministros & Entregables
                </h3>
                <button type="button" onClick={addPrerequisite} className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Requisito
                </button>
              </div>

              {prerequisites.length === 0 && (
                <div className="text-center p-6 bg-white/5 border border-white/5 rounded-xl border-dashed">
                  <p className="text-xs text-slate-500">No hay pre-requisitos críticos definidos.</p>
                </div>
              )}

              {prerequisites.map((req) => (
                <div key={req.id} className="p-3 bg-white/5 border border-white/5 rounded-xl relative overflow-hidden group">
                   <div className="grid grid-cols-2 gap-3 mb-3">
                     <div>
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Necesidad</label>
                        <input type="text" required value={req.name} onChange={e => updatePrerequisite(req.id, 'name', e.target.value)} placeholder="Ej. Filamento TPU Flex..." className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                     </div>
                     <div>
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Tipo</label>
                        <select value={req.type} onChange={e => updatePrerequisite(req.id, 'type', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 appearance-none">
                          {PREREQUISITE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                     <div>
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Responsable</label>
                        <input type="text" required value={req.owner} onChange={e => updatePrerequisite(req.id, 'owner', e.target.value)} placeholder="Ej. Depto Compras" className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500" />
                     </div>
                     <div>
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Para la Fase (Opcional)</label>
                        <select value={req.linkedPhaseId || ''} onChange={e => updatePrerequisite(req.id, 'linkedPhaseId', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 appearance-none">
                          <option value="">(Global) No aplica</option>
                          {phases.map(p => <option key={p.id} value={p.id}>{p.process} - {p.name}</option>)}
                        </select>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                     <div>
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Fecha Falsa/Compromiso</label>
                        <input type="date" required value={req.dueDate} onChange={e => updatePrerequisite(req.id, 'dueDate', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 [color-scheme:dark]" />
                     </div>
                     <div className="flex items-end justify-end">
                        <button type="button" onClick={() => removePrerequisite(req.id)} className="px-3 py-1.5 mb-0.5 bg-red-500/10 hover:bg-red-500/20 text-[10px] uppercase font-bold text-red-400 rounded-md transition-colors flex items-center gap-1.5">
                          <Trash2 className="w-3 h-3" /> Borrar
                        </button>
                     </div>
                   </div>
                </div>
              ))}
            </div>

            {/* FASES / CHECKLIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                   Plan de Fases
                </h3>
                <button type="button" onClick={addPhase} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Agregar Fase
                </button>
              </div>

              {phases.map((phase) => (
                <div key={phase.id} className="p-3 bg-white/5 border border-white/5 rounded-xl relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${color} opacity-50`}></div>
                  <div className="pl-2 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Proceso</label>
                        <select value={phase.process} onChange={e => updatePhase(phase.id, 'process', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 appearance-none">
                          {STANDARD_PROCESSES.map(proc => <option key={proc} value={proc}>{proc}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end">
                         <button type="button" onClick={() => removePhase(phase.id)} disabled={phases.length === 1} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors disabled:opacity-30">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Inicio</label>
                        <input type="date" required value={phase.startDate} onChange={e => updatePhase(phase.id, 'startDate', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 [color-scheme:dark]" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[9px] uppercase text-slate-500 mb-1">Fin</label>
                        <input type="date" required value={phase.endDate} onChange={e => updatePhase(phase.id, 'endDate', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 [color-scheme:dark]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-white/10 bg-slate-950/50 rounded-b-2xl flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 hover:bg-white/5 text-slate-300 rounded-lg transition-colors text-sm font-medium">
            Cancelar
          </button>
          <button onClick={handleSubmit} type="submit" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-lg transition-colors text-sm font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            {isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
          </button>
        </div>
      </div>
    </div>
  );
}
