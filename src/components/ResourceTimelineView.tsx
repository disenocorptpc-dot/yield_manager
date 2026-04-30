import React, { useState, useRef, useEffect } from 'react';
import type { Project } from '../App';
import {
  format, addDays, subDays, startOfWeek, endOfWeek,
  eachDayOfInterval, parseISO, isToday, differenceInCalendarDays,
  startOfDay, endOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  'Acabados',
];

const PX_PER_DAY = 56; // px width per day column
const ROW_HEIGHT = 80; // px per resource row
const BAR_HEIGHT = 28;
const BAR_GAP = 4;

export default function ResourceTimelineView({ projects, onProjectClick }: ResourceTimelineViewProps) {
  const [anchorDate, setAnchorDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const WINDOW_DAYS = 28; // 4 weeks visible

  const startDate = anchorDate;
  const endDate   = addDays(anchorDate, WINDOW_DAYS - 1);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll today into view on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const todayOffset = differenceInCalendarDays(new Date(), startDate) * PX_PER_DAY;
    scrollRef.current.scrollLeft = Math.max(0, todayOffset - 120);
  }, [anchorDate]);

  const prevWindow = () => setAnchorDate(d => subDays(d, 14));
  const nextWindow = () => setAnchorDate(d => addDays(d, 14));
  const goToday    = () => setAnchorDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  function getBar(startDateStr: string, endDateStr: string) {
    const s = startOfDay(parseISO(startDateStr));
    const e = endOfDay(parseISO(endDateStr));
    const cs = s < startDate ? startDate : s;
    const ce = e > endDate   ? endDate   : e;
    if (cs > endDate || ce < startDate) return null;

    const offset   = differenceInCalendarDays(cs, startDate);
    const duration = differenceInCalendarDays(ce, cs) + 1;
    return {
      left:          offset   * PX_PER_DAY,
      width:         Math.max(duration * PX_PER_DAY - 4, 20),
      isClipLeft:    s < startDate,
      isClipRight:   e > endDate,
    };
  }

  const totalWidth = WINDOW_DAYS * PX_PER_DAY;

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/5 bg-slate-950/40">

      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-slate-900/70 border-b border-white/5 backdrop-blur-md gap-4 flex-wrap">
        <span className="text-sm font-bold text-white capitalize">
          {format(startDate, "d 'de' MMMM", { locale: es })}
          <span className="text-slate-500 mx-2">→</span>
          {format(endDate, "d 'de' MMMM yyyy", { locale: es })}
        </span>

        <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-0.5 rounded-lg">
          <button onClick={prevWindow} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-md hover:bg-white/10 transition-colors">
            Hoy
          </button>
          <button onClick={nextWindow} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Resource labels */}
        <div className="w-44 shrink-0 border-r border-white/5 bg-slate-950/60 z-10 flex flex-col">
          {/* Header spacer */}
          <div className="h-[52px] border-b border-white/5" />
          {/* Rows */}
          {RESOURCES.map(res => {
            const count = projects.flatMap(p => p.phases.filter(ph => ph.process === res)).length;
            return (
              <div
                key={res}
                className="border-b border-white/[0.04] px-3 flex items-center gap-2"
                style={{ height: ROW_HEIGHT }}
              >
                <div>
                  <p className="text-xs font-bold text-slate-300">{res}</p>
                  {count > 0 && (
                    <span className="text-[9px] font-bold text-orange-400/70 bg-orange-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      {count} {count === 1 ? 'tarea' : 'tareas'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable day grid */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div style={{ width: totalWidth }}>

            {/* Day header */}
            <div className="sticky top-0 z-10 flex border-b border-white/5 bg-slate-900/90 backdrop-blur-md" style={{ height: 52 }}>
              {days.map((d, i) => {
                const isMon = d.getDay() === 1;
                const isSun = d.getDay() === 0;
                const isTd  = isToday(d);
                return (
                  <div
                    key={i}
                    style={{ width: PX_PER_DAY }}
                    className={`shrink-0 flex flex-col items-center justify-center border-r border-white/[0.04] ${
                      isMon ? 'border-r-white/10' : ''
                    } ${isTd ? 'bg-orange-500/10' : isSun ? 'bg-slate-950/40' : ''}`}
                  >
                    <span className={`text-[9px] uppercase font-bold ${isTd ? 'text-orange-400' : 'text-slate-600'}`}>
                      {format(d, 'EEE', { locale: es })}
                    </span>
                    <span className={`text-sm font-bold leading-none mt-0.5 ${isTd ? 'text-orange-300' : isSun ? 'text-slate-700' : 'text-slate-400'}`}>
                      {format(d, 'd')}
                    </span>
                    {isMon && (
                      <span className="text-[7px] text-slate-600 capitalize">{format(d, 'MMM', { locale: es })}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Resource rows */}
            {RESOURCES.map(res => {
              const phases = projects.flatMap(proj =>
                proj.phases
                  .filter(ph => ph.process === res)
                  .map(ph => ({ proj, phase: ph }))
              );

              // Compute non-overlapping Y-tracks for bars
              type Track = { end: Date };
              const tracks: Track[] = [];
              const barsWithTrack = phases
                .map(({ proj, phase }) => {
                  const bar = getBar(phase.startDate, phase.endDate);
                  return bar ? { proj, phase, bar } : null;
                })
                .filter(Boolean) as { proj: Project; phase: any; bar: ReturnType<typeof getBar> & {}; track: number }[];

              // Assign tracks greedily
              barsWithTrack.forEach(item => {
                const phaseEnd = endOfDay(parseISO(item.phase.endDate));
                let assigned = false;
                for (let t = 0; t < tracks.length; t++) {
                  if (tracks[t].end < startOfDay(parseISO(item.phase.startDate))) {
                    tracks[t].end = phaseEnd;
                    (item as any).track = t;
                    assigned = true;
                    break;
                  }
                }
                if (!assigned) {
                  tracks.push({ end: phaseEnd });
                  (item as any).track = tracks.length - 1;
                }
              });

              const numTracks = Math.max(tracks.length, 1);
              const dynamicHeight = Math.max(numTracks * (BAR_HEIGHT + BAR_GAP) + 24, ROW_HEIGHT);

              return (
                <div
                  key={res}
                  className="relative border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors"
                  style={{ height: dynamicHeight }}
                >
                  {/* Sunday highlights */}
                  {days.map((d, i) => d.getDay() === 0 ? (
                    <div key={i} className="absolute top-0 bottom-0 bg-slate-950/30 pointer-events-none" style={{ left: i * PX_PER_DAY, width: PX_PER_DAY }} />
                  ) : null)}

                  {/* Today column highlight */}
                  {days.map((d, i) => isToday(d) ? (
                    <div key={`t${i}`} className="absolute top-0 bottom-0 bg-orange-500/5 pointer-events-none" style={{ left: i * PX_PER_DAY, width: PX_PER_DAY }}>
                      <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-orange-500/40" />
                    </div>
                  ) : null)}

                  {/* Phase bars */}
                  {(barsWithTrack as any[]).map((item, idx) => {
                    if (!item.bar) return null;
                    const isDone = item.phase.status === 'Terminada';
                    const trackY = 12 + (item.track ?? 0) * (BAR_HEIGHT + BAR_GAP);

                    return (
                      <div
                        key={idx}
                        onClick={() => onProjectClick(item.proj.id)}
                        title={`${item.proj.name} — ${item.phase.process}\n${item.phase.startDate} → ${item.phase.endDate}`}
                        className={`absolute cursor-pointer hover:z-20 hover:brightness-110 transition-all ${isDone ? 'opacity-40 grayscale' : ''}`}
                        style={{
                          left:   item.bar.left + 2,
                          width:  item.bar.width,
                          top:    trackY,
                          height: BAR_HEIGHT,
                          borderTopLeftRadius:    item.bar.isClipLeft  ? 0 : 7,
                          borderBottomLeftRadius: item.bar.isClipLeft  ? 0 : 7,
                          borderTopRightRadius:    item.bar.isClipRight ? 0 : 7,
                          borderBottomRightRadius: item.bar.isClipRight ? 0 : 7,
                        }}
                      >
                        {/* Gradient border */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${item.proj.color} rounded-[inherit]`} />
                        {/* Dark inner */}
                        <div
                          className="absolute inset-[1.5px] bg-slate-950 flex items-center overflow-hidden"
                          style={{
                            borderTopLeftRadius:    item.bar.isClipLeft  ? 0 : 6,
                            borderBottomLeftRadius: item.bar.isClipLeft  ? 0 : 6,
                            borderTopRightRadius:    item.bar.isClipRight ? 0 : 6,
                            borderBottomRightRadius: item.bar.isClipRight ? 0 : 6,
                          }}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.proj.color} opacity-[0.13]`} />
                          {item.proj.imageUrl && (
                            <div className="w-5 h-full shrink-0 overflow-hidden">
                              <img src={item.proj.imageUrl} className="h-full w-auto object-cover opacity-50" alt="" />
                            </div>
                          )}
                          {item.bar.width > 30 && (
                            <span className="relative z-10 px-2 text-[10px] font-bold text-slate-100 truncate drop-shadow">
                              {item.proj.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {phases.length === 0 && (
                    <div className="absolute inset-0 flex items-center">
                      <span className="text-[10px] text-slate-700 italic ml-2">Sin asignación en este período</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
