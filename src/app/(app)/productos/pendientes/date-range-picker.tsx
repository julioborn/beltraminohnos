"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toISODate } from "@/lib/date-range";

export type DateRange = { start: string | null; end: string | null };

const WEEKDAYS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildGrid(viewMonth: Date): (Date | null)[] {
  const first = startOfMonth(viewMonth);
  const firstWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const totalDays = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatShort(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (range: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(value.start ? new Date(`${value.start}T00:00:00`) : new Date()),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const grid = useMemo(() => buildGrid(viewMonth), [viewMonth]);

  function handleDayClick(date: Date) {
    const iso = toISODate(date);
    if (!value.start || (value.start && value.end)) {
      onChange({ start: iso, end: null });
    } else if (iso < value.start) {
      onChange({ start: iso, end: null });
    } else {
      onChange({ start: value.start, end: iso });
      setOpen(false);
    }
  }

  const label =
    value.start && value.end
      ? `${formatShort(value.start)} – ${formatShort(value.end)}`
      : value.start
        ? `${formatShort(value.start)} – …`
        : "Elegir rango de fechas";

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          <CalendarIcon />
          {label}
        </button>
        {(value.start || value.end) && (
          <button
            type="button"
            onClick={() => onChange({ start: null, end: null })}
            className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-red"
          >
            Limpiar
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-2 w-72 rounded-lg border border-black/15 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-btm-navy hover:bg-btm-navy/10"
            >
              <ChevronLeft />
            </button>
            <span className="font-display text-xs font-bold uppercase tracking-wide text-btm-navy">
              {capitalize(MONTH_FORMATTER.format(viewMonth))}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-btm-navy hover:bg-btm-navy/10"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-center text-[10px] font-semibold uppercase tracking-wide text-btm-black/40">
                {w}
              </span>
            ))}
            {grid.map((date, i) => {
              if (!date) return <span key={`empty-${i}`} />;
              const iso = toISODate(date);
              const isStart = value.start === iso;
              const isEnd = value.end === iso;
              const inRange = Boolean(value.start && value.end && iso > value.start && iso < value.end);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => handleDayClick(date)}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center justify-self-center text-xs transition-colors ${
                    isStart || isEnd
                      ? "rounded-full bg-btm-navy font-bold text-white"
                      : inRange
                        ? "bg-btm-navy/10 text-btm-navy"
                        : "rounded-full text-btm-black/80 hover:bg-btm-navy/10"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-center text-[11px] text-btm-black/50">
            {!value.start ? "Elegí la fecha desde" : !value.end ? "Elegí la fecha hasta" : "Rango seleccionado"}
          </p>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M7.3 16.7a1 1 0 010-1.4L11.6 11H2a1 1 0 110-2h9.6L7.3 4.7a1 1 0 111.4-1.4l6 6a1 1 0 010 1.4l-6 6a1 1 0 01-1.4 0z" />
    </svg>
  );
}
