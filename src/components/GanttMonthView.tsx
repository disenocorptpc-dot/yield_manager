import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Project } from '../App';

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface GanttProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

export default function GanttMonthView({ projects, onProjectClick }: GanttProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // Starts in April 2026

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for the first and last weeks to align with Mon-Sun grid
  const startingDayIndex = (getDay(monthStart) + 6) % 7; 
  const paddingDays = Array.from({ length: startingDayIndex }).map((_, i) => {
    return new Date(monthStart.getFullYear(), monthStart.getMonth(), -startingDayIndex + i + 1);
  });
  
  const endingDayIndex = (getDay(monthEnd) + 6) % 7;
  const trailingDays = Array.from({ length: 6 - endingDayIndex }).map((_, i) => {
    return new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, i + 1);
  });

  const allDays = [...paddingDays, ...daysInMonth, ...trailingDays];
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Pre-process events from projects (Color is mapped by project)
  const allEvents = projects.flatMap(proj => 
    proj.phases.map(phase => ({
      ...phase,
      projectId: proj.id,
      projectName: proj.name,
      projectColor: proj.color,
      projectImageUrl: proj.imageUrl,
      isMain: proj.isMain
    }))
  );

  return (
    <div className="h-full print:h-auto flex print:block flex-col rounded-xl overflow-hidden print:overflow-visible glass-panel border-white/5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-900/60 backdrop-blur-md">
        <h2 className="text-2xl font-light text-white capitalize flex items-center gap-3">
          <span className="font-bold tracking-tight">{format(currentDate, 'MMMM', { locale: es })}</span>
          <span className="text-slate-500 font-mono text-xl">{format(currentDate, 'yyyy')}</span>
        </h2>
        <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date(2026, 3, 1))} className="px-4 py-1.5 font-medium text-sm rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors bg-white/5">
            Abr '26
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex print:block flex-col overflow-hidden print:overflow-visible">
        {/* Header Days */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-slate-900/80">
          {WEEKDAYS.map(day => (
            <div key={day} className="py-2.5 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 print:block overflow-y-auto bg-slate-950/40 flex flex-col custom-scrollbar">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex-1 grid grid-cols-7 min-h-[140px] print:min-h-[90px] relative group/week">
              {week.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <div key={dayIdx} className={`border-b border-r border-white/5 p-2 transition-colors ${isCurrentMonth ? 'bg-transparent hover:bg-white/[0.02]' : 'bg-black/20'}`}>
                    <span className={`text-sm font-semibold p-1 inline-flex items-center justify-center ${isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
              
              {/* Event Bars Overlay for the week */}
              <div className="absolute top-10 left-0 right-0 bottom-0 pointer-events-none flex flex-col gap-1.5 py-1 z-10 overflow-hidden">
                {allEvents.map(event => {
                  const weekStart = week[0];
                  const weekEnd = week[6];
                  
                  // Parse ISO strings from phases
                  const eStart = startOfDay(parseISO(event.startDate));
                  const eEnd = endOfDay(parseISO(event.endDate));
                  const wStart = startOfDay(weekStart);
                  const wEnd = endOfDay(weekEnd);

                  if (eStart <= wEnd && eEnd >= wStart) {
                    let startDayIndex = 0;
                    if (eStart > wStart) {
                      const diffTime = Math.abs(eStart.getTime() - wStart.getTime());
                      startDayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    }
                    
                    let endDayIndex = 6;
                    if (eEnd < wEnd) {
                      const diffTime = Math.abs(eEnd.getTime() - wStart.getTime());
                      endDayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    }

                    // Calculation based on grid % 
                    const width = ((endDayIndex - startDayIndex + 1) / 7) * 100;
                    const left = (startDayIndex / 7) * 100;
                    
                    const isContinuousLeft = eStart < wStart;
                    const isContinuousRight = eEnd > wEnd;

                    return (
                      <div 
                        key={`${event.id}-${weekIdx}`} 
                        onClick={() => onProjectClick(event.projectId)}
                        className={`pointer-events-auto text-xs font-semibold truncate shadow-lg event-bar cursor-pointer border border-white/5 backdrop-blur-md flex items-center gap-2 ${event.isMain ? 'ring-1 ring-white/50 shadow-white/10' : 'hover:border-white/20'} text-slate-200`}
                        style={{ 
                          width: `calc(${width}% - 12px)`, 
                          left: `calc(${left}% + 6px)`, 
                          position: 'relative',
                          borderTopLeftRadius: isContinuousLeft ? '0' : '8px',
                          borderBottomLeftRadius: isContinuousLeft ? '0' : '8px',
                          borderTopRightRadius: isContinuousRight ? '0' : '8px',
                          borderBottomRightRadius: isContinuousRight ? '0' : '8px',
                          backgroundColor: 'rgba(15, 23, 42, 0.7)' // Fondo slate-900 translúcido
                        }}
                        title={`${event.projectName}: ${event.process}`}
                      >
                        {/* Tinte de color sutil de fondo */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${event.projectColor} opacity-20 pointer-events-none`}></div>
                        
                        {/* Marca de agua fotográfica texturizada */}
                        {event.projectImageUrl && (
                          <div 
                            className="absolute inset-0 opacity-[0.08] mix-blend-screen pointer-events-none" 
                            style={{ 
                              backgroundImage: `url(${event.projectImageUrl})`, 
                              backgroundSize: '30px 30px', 
                              backgroundRepeat: 'repeat',
                              backgroundPosition: 'center'
                            }}
                          />
                        )}

                        {/* Borde brillante izquierdo para denotar color rápidamente */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${event.projectColor} ${isContinuousLeft ? 'opacity-30' : 'opacity-100'}`}></div>

                        <div className="relative z-10 flex items-center gap-2 w-full px-2.5 py-1.5 truncate">
                          {event.projectImageUrl && (
                             <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-white/20 shadow-sm bg-black/40">
                               <img src={event.projectImageUrl} className="w-full h-full object-cover" alt="" />
                             </div>
                          )}
                          <span className="truncate drop-shadow-md text-white">{event.projectName} <span className="text-white/60 font-normal ml-1">— {event.process}</span></span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
