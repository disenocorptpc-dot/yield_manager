import React, { useRef, useEffect, useState } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, parseISO, isToday, differenceInCalendarDays,
  startOfDay, endOfDay, isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Project } from '../App';

interface HorizontalGanttViewProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

type ViewMode = 1 | 3 | 4;

const VIEW_CONFIG: Record<ViewMode, { label: string; pxPerDay: number }> = {
  1: { label: 'Mes', pxPerDay: 38 },
  3: { label: 'Trimestre', pxPerDay: 16 },
  4: { label: 'Cuatrimestre', pxPerDay: 12 },
};

const STATUS_STYLES = {
  'En tiempo':  { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'Desfasado':  { dot: 'bg-red-400',     badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'En pausa':   { dot: 'bg-amber-400',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

function getStatusStyle(status: Project['status']) {
  return STATUS_STYLES[status] ?? STATUS_STYLES['En tiempo'];
}

export default function HorizontalGanttView({ projects, onProjectClick }: HorizontalGanttViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(1);
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayLineRef = useRef<HTMLDivElement>(null);
  const { pxPerDay } = VIEW_CONFIG[viewMode];

  const periodStart = startOfMonth(currentDate);
  const periodEnd = endOfMonth(addMonths(periodStart, viewMode - 1));
  const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
  const totalWidth = days.length * pxPerDay;

  // Build month headers (group days by month)
  const monthGroups: { label: string; dayCount: number }[] = [];
  let lastMonth = -1;
  days.forEach((d) => {
    if (d.getMonth() !== lastMonth) {
      monthGroups.push({ label: format(d, 'MMMM yyyy', { locale: es }), dayCount: 0 });
      lastMonth = d.getMonth();
    }
    monthGroups[monthGroups.length - 1].dayCount++;
  });

  // Scroll to today on mount or when view changes
  useEffect(() => {
    if (!scrollRef.current) return;
    const todayOffset = differenceInCalendarDays(new Date(), periodStart) * pxPerDay;
    const containerWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = Math.max(0, todayOffset - containerWidth / 2);
  }, [viewMode, currentDate]);

  const prevPeriod = () => setCurrentDate(d => subMonths(d, viewMode));
  const nextPeriod = () => setCurrentDate(d => addMonths(d, viewMode));
  const goToToday  = () => setCurrentDate(startOfMonth(new Date()));

  // Compute bar position for a phase within the current period
  function getBarStyle(startDate: string, endDate: string) {
    const s = startOfDay(parseISO(startDate));
    const e = endOfDay(parseISO(endDate));
    const clampedStart = s < periodStart ? periodStart : s;
    const clampedEnd   = e > periodEnd   ? periodEnd   : e;

    if (clampedStart > periodEnd || clampedEnd < periodStart) return null;

    const offsetDays = differenceInCalendarDays(clampedStart, periodStart);
    const durationDays = differenceInCalendarDays(clampedEnd, clampedStart) + 1;

    return {
      left:  offsetDays   * pxPerDay,
      width: Math.max(durationDays * pxPerDay - 4, 24),
      isClippedLeft:  s < periodStart,
      isClippedRight: e > periodEnd,
    };
  }

  const todayOffset = differenceInCalendarDays(new Date(), periodStart) * pxPerDay;
  const isTodayInRange = new Date() >= periodStart && new Date() <= periodEnd;

  // WEEK separators — every monday
  const weekSeps = days
    .filter(d => d.getDay() === 1 && !isSameDay(d, periodStart))
    .map(d => differenceInCalendarDays(d, periodStart) * pxPerDay);

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/5 bg-slate-950/40">

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-slate-900/70 border-b border-white/5 backdrop-blur-md gap-4 flex-wrap">

        {/* Period label */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-base font-bold text-white capitalize tracking-tight">
            {viewMode === 1
              ? format(periodStart, 'MMMM yyyy', { locale: es })
              : `${format(periodStart, 'MMM', { locale: es })} – ${format(periodEnd, 'MMM yyyy', { locale: es })}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode selector */}
          <div className="flex bg-black/40 border border-white/5 p-0.5 rounded-lg">
            {([1, 3, 4] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  viewMode === m
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {VIEW_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-0.5 rounded-lg">
            <button onClick={prevPeriod} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-md hover:bg-white/10 transition-colors">
              Hoy
            </button>
            <button onClick={nextPeriod} className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid Area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Project labels */}
        <div className="w-52 shrink-0 flex flex-col border-r border-white/5 bg-slate-950/60 z-10">
          {/* Column header spacer (matches day header height) */}
          <div className="h-[52px] border-b border-white/5 flex items-end pb-2 px-4">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">Proyectos</span>
          </div>
          {/* Project rows */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {projects.map(proj => {
              const s = getStatusStyle(proj.status);
              return (
                <div
                  key={proj.id}
                  onClick={() => onProjectClick(proj.id)}
                  className="h-16 border-b border-white/[0.04] px-3 flex items-center gap-2.5 cursor-pointer hover:bg-white/5 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className={`w-9 h-9 rounded-lg shrink-0 overflow-hidden bg-gradient-to-br ${proj.color} relative border border-white/10`}>
                    {proj.imageUrl && (
                      <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate leading-tight">{proj.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      <span className="text-[9px] uppercase text-slate-500 font-semibold truncate">{proj.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Empty rows for visual padding */}
            {projects.length === 0 && (
              <div className="flex items-center justify-center h-32 text-slate-600 text-xs italic">Sin proyectos</div>
            )}
          </div>
        </div>

        {/* Right: Scrollable timeline */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
          <div style={{ width: totalWidth }} className="flex flex-col h-full min-h-full">

            {/* Month headers */}
            <div className="flex sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-white/5 h-7 shrink-0">
              {monthGroups.map((mg, i) => (
                <div
                  key={i}
                  className="border-r border-white/5 px-2 flex items-center"
                  style={{ width: mg.dayCount * pxPerDay }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400/80 capitalize truncate">
                    {mg.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Day numbers header */}
            <div className="flex sticky top-7 z-20 bg-slate-900/80 backdrop-blur-md border-b border-white/5 h-[25px] shrink-0">
              {days.map((d, i) => {
                const isMon  = d.getDay() === 1;
                const isSun  = d.getDay() === 0;
                const isTd   = isToday(d);
                return (
                  <div
                    key={i}
                    style={{ width: pxPerDay }}
                    className={`shrink-0 flex items-center justify-center border-r border-white/[0.03] ${
                      isTd ? 'bg-orange-500/10' : isSun ? 'bg-slate-900/40' : ''
                    } ${isMon ? 'border-r border-white/10' : ''}`}
                  >
                    <span className={`text-[8px] font-bold ${
                      isTd ? 'text-orange-400' : isSun ? 'text-slate-700' : 'text-slate-600'
                    }`}>
                      {format(d, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Project rows */}
            <div className="flex-1 relative">
              {/* Background grid: week separators */}
              {weekSeps.map((x, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-white/[0.04] pointer-events-none"
                  style={{ left: x }}
                />
              ))}

              {/* Day column highlights (Sundays + today) */}
              {days.map((d, i) => {
                const x = i * pxPerDay;
                if (d.getDay() === 0) {
                  return <div key={i} className="absolute top-0 bottom-0 bg-slate-950/30 pointer-events-none" style={{ left: x, width: pxPerDay }} />;
                }
                return null;
              })}

              {/* Today vertical line */}
              {isTodayInRange && (
                <div
                  ref={todayLineRef}
                  className="absolute top-0 bottom-0 w-[2px] bg-orange-500/70 pointer-events-none z-10"
                  style={{ left: todayOffset + pxPerDay / 2 }}
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full absolute -top-1 -left-[3px] shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                </div>
              )}

              {/* Project rows */}
              {projects.map((proj) => (
                <div key={proj.id} className="h-16 border-b border-white/[0.04] relative flex items-center">
                  {proj.phases.map((phase) => {
                    const bar = getBarStyle(phase.startDate, phase.endDate);
                    if (!bar) return null;
                    const isDone = phase.status === 'Terminada';

                    return (
                      <div
                        key={phase.id}
                        onClick={() => onProjectClick(proj.id)}
                        title={`${proj.name} — ${phase.process}\n${phase.startDate} → ${phase.endDate}`}
                        className={`absolute h-8 cursor-pointer group/bar transition-all duration-150 hover:z-20 hover:brightness-110 ${isDone ? 'opacity-40 grayscale' : ''}`}
                        style={{
                          left:  bar.left + 2,
                          width: bar.width,
                          borderTopLeftRadius:    bar.isClippedLeft  ? 0 : 8,
                          borderBottomLeftRadius: bar.isClippedLeft  ? 0 : 8,
                          borderTopRightRadius:    bar.isClippedRight ? 0 : 8,
                          borderBottomRightRadius: bar.isClippedRight ? 0 : 8,
                        }}
                      >
                        {/* Gradient border shell */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${proj.color} opacity-90 pointer-events-none`}
                          style={{
                            borderTopLeftRadius:    bar.isClippedLeft  ? 0 : 8,
                            borderBottomLeftRadius: bar.isClippedLeft  ? 0 : 8,
                            borderTopRightRadius:    bar.isClippedRight ? 0 : 8,
                            borderBottomRightRadius: bar.isClippedRight ? 0 : 8,
                          }}
                        />
                        {/* Dark inner fill */}
                        <div
                          className="absolute inset-[1.5px] bg-slate-950 flex items-center overflow-hidden"
                          style={{
                            borderTopLeftRadius:    bar.isClippedLeft  ? 0 : 7,
                            borderBottomLeftRadius: bar.isClippedLeft  ? 0 : 7,
                            borderTopRightRadius:    bar.isClippedRight ? 0 : 7,
                            borderBottomRightRadius: bar.isClippedRight ? 0 : 7,
                          }}
                        >
                          {/* Color tint */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${proj.color} opacity-[0.12]`} />
                          {/* Label */}
                          {bar.width > 40 && (
                            <span className="relative z-10 px-2.5 text-[10px] font-bold text-slate-100 truncate leading-none tracking-wide drop-shadow">
                              {phase.process}
                              {bar.width > 90 && (
                                <span className="text-white/50 font-normal ml-1.5">{proj.name}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {projects.length === 0 && (
                <div className="flex items-center justify-center h-40 text-slate-600 text-sm italic">
                  No hay proyectos. Crea uno nuevo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
