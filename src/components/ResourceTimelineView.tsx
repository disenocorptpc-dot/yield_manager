import React from 'react';
import type { Project } from '../App';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResourceTimelineViewProps {
  projects: Project[];
  onProjectClick: (id: string) => void;
}

const RESOURCES = [
  'Bocetaje',
  'Modelado en 3D',
  'Impresión',
  'Lijado / Preparación',
  'Ensamble',
  'Pintura',
  'Acabados'
];

export default function ResourceTimelineView({ projects, onProjectClick }: ResourceTimelineViewProps) {
  const today = new Date();
  const startDate = startOfWeek(addDays(today, -7), { weekStartsOn: 1 });
  const endDate = endOfWeek(addDays(today, 21), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="h-full w-full flex flex-col overflow-auto custom-scrollbar relative">
      {/* Header Fijo */}
      <div className="flex sticky top-0 z-20 bg-slate-900 border-b border-white/10">
        <div className="w-56 shrink-0 border-r border-white/5 p-3 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estación / Recurso</span>
        </div>
        <div className="flex-1 flex min-w-max bg-slate-900/90 backdrop-blur-md">
          {days.map((day, idx) => (
            <div key={idx} className={`w-16 shrink-0 border-r border-white/5 p-2 flex flex-col items-center justify-center ${format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? 'bg-orange-500/10' : ''}`}>
              <span className="text-[10px] text-slate-500 uppercase">{format(day, 'EE', { locale: es })}</span>
              <span className={`text-sm font-bold ${format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? 'text-orange-400' : 'text-slate-300'}`}>{format(day, 'd')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Recursos */}
      <div className="flex-1 relative min-w-max pb-10">
        {RESOURCES.map(resource => {
          // Extraer las fases de todos los proyectos que pertenecen a este recurso
          const resourcePhases = projects.flatMap(proj => 
            proj.phases
              .filter(ph => ph.process === resource)
              .map(ph => ({ project: proj, phase: ph }))
          );

          // Agrupar visualmente si hay solapamientos (apilamiento simple Y-sorting)
          // Para este MVP, las mostraremos solapadas si chocan o apiladas si hay espacio
          
          return (
            <div key={resource} className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors relative group min-h-[80px]">
              {/* Etiqueta del recurso fija a la izquierda */}
              <div className="w-56 shrink-0 border-r border-white/5 p-4 flex items-center bg-slate-950/50 group-hover:bg-slate-900 transition-colors sticky left-0 z-10 backdrop-blur-xl shadow-[4px_0_15px_rgba(0,0,0,0.3)]">
                <span className="text-sm font-bold text-slate-200">{resource}</span>
                {resourcePhases.length > 0 && (
                   <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/50">{resourcePhases.length}</span>
                )}
              </div>
              
              <div className="flex-1 flex relative">
                {/* Lineas de la grilla verticales */}
                {days.map((day, idx) => (
                  <div key={idx} className={`w-16 shrink-0 border-r border-white/5 ${format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? 'bg-orange-500/5' : ''}`}></div>
                ))}

                {/* Barras de Tareas (Cápsulas de Cristal) */}
                {resourcePhases.map((rp, idx) => {
                  const pStart = parseISO(rp.phase.startDate);
                  const pEnd = parseISO(rp.phase.endDate);
                  
                  // Solo renderizar si cae en la ventana visible
                  if (pEnd < startDate || pStart > endDate) return null;

                  const actualStart = pStart < startDate ? startDate : pStart;
                  const actualEnd = pEnd > endDate ? endDate : pEnd;

                  const startDiff = Math.floor((actualStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const duration = Math.floor((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  const leftOffset = startDiff * 4; // 4rem = w-16 = 64px
                  const width = duration * 4;

                  // Simple vertical stacking si hay múltiples
                  const topOffset = 16 + (idx * 10); 

                  return (
                    <div
                      key={`${rp.project.id}-${rp.phase.id}-${idx}`}
                      onClick={() => onProjectClick(rp.project.id)}
                      className={`absolute h-10 rounded-lg shadow-lg cursor-pointer hover:scale-[1.02] transition-all z-10 hover:z-20 ${rp.phase.status === 'Terminada' ? 'opacity-50 grayscale' : ''} p-[1px] bg-gradient-to-r ${rp.project.color}`}
                      style={{ 
                        left: `${leftOffset}rem`, 
                        width: `calc(${width}rem - 8px)`,
                        marginLeft: '4px',
                        top: `${topOffset}px`,
                      }}
                      title={`${rp.project.name} - ${rp.phase.status}`}
                    >
                      <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center gap-2 overflow-hidden relative">
                        {/* Tinte de cristal */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${rp.project.color} opacity-[0.15] pointer-events-none`}></div>
                        
                        {/* Contenido */}
                        <div className="relative z-10 flex items-center px-2 w-full">
                          {rp.project.imageUrl && (
                            <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 shadow-sm bg-black/40 mr-2">
                              <img src={rp.project.imageUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-100 truncate drop-shadow-md tracking-wide">{rp.project.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
