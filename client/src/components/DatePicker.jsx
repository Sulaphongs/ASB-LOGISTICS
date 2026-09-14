import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const LAO_MONTHS = [
  'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
  'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ',
];
const LAO_WEEKDAYS = ['ອາ', 'ຈ', 'ອ', 'ພ', 'ພຫ', 'ສຸ', 'ສ'];

function pad(n) {
  return String(n).padStart(2, '0');
}
function toISO(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function parseISO(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

export default function DatePicker({ value, onChange, className = '', placeholder = 'ເລືອກວັນທີ' }) {
  const parsed = parseISO(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed ? parsed.y : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.m : today.getMonth());
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openPicker = () => {
    const p = parseISO(value);
    setViewYear(p ? p.y : today.getFullYear());
    setViewMonth(p ? p.m : today.getMonth());
    setOpen((o) => !o);
  };

  const emit = (iso) => onChange({ target: { value: iso } });

  const selectDay = (d) => { emit(toISO(viewYear, viewMonth, d)); setOpen(false); };

  const goToday = () => {
    emit(toISO(today.getFullYear(), today.getMonth(), today.getDate()));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setOpen(false);
  };

  const clear = () => { emit(''); setOpen(false); };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ d: daysInPrevMonth - firstWeekday + 1 + i, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, outside: false });
  let nextDay = 1;
  while (cells.length < totalCells) cells.push({ d: nextDay++, outside: true });

  const isToday = (c) => !c.outside && viewYear === today.getFullYear() && viewMonth === today.getMonth() && c.d === today.getDate();
  const isSelected = (c) => !c.outside && parsed && parsed.y === viewYear && parsed.m === viewMonth && parsed.d === c.d;

  const display = parsed ? `${pad(parsed.d)}/${pad(parsed.m + 1)}/${parsed.y}` : '';

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={openPicker}
        className={`inline-flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${className}`}
      >
        <CalendarDays className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
        <span className={display ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>{display || placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" aria-label="ເດືອນກ່ອນ">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{LAO_MONTHS[viewMonth]} {viewYear}</div>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" aria-label="ເດືອນຖັດໄປ">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {LAO_WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => (
              <button
                key={i}
                type="button"
                disabled={c.outside}
                onClick={() => selectDay(c.d)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                  c.outside
                    ? 'text-slate-300 dark:text-slate-600 cursor-default'
                    : isSelected(c)
                      ? 'bg-teal-600 text-white font-semibold hover:bg-teal-600'
                      : isToday(c)
                        ? 'border border-teal-500 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-500/10'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {c.d}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={goToday} className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline">ມື້ນີ້</button>
            {!!value && (
              <button type="button" onClick={clear} className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400">ລ້າງ</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
