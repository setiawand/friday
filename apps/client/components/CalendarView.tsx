'use client';

import React, { useMemo, useState } from 'react';
import { Board, Item, ColumnType, Column } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  board: Board;
  items: Item[];
  onCreateItemForDate: (date: Date, columnId: string) => void;
  onSelectItem: (item: Item) => void;
}

interface CalendarDay {
  date: Date;
  items: Item[];
}

function getDateColumns(columns: Column[] | undefined) {
  if (!columns) return [];
  return columns.filter((c) => c.type === ColumnType.DATE);
}

function getTextColumn(columns: Column[] | undefined) {
  if (!columns) return undefined;
  return columns.find((c) => c.type === ColumnType.TEXT);
}

function parseDate(value: any) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getItemName(item: Item, columns: Column[] | undefined) {
  const textColumn = getTextColumn(columns);
  if (textColumn) {
    const val = item.column_values?.find((cv) => cv.column_id === textColumn.id);
    if (val?.value) return String(val.value);
  }
  return 'Untitled Item';
}

function getMonthMatrix(anchor: Date): CalendarDay[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startDay);

  const weeks: CalendarDay[][] = [];
  let current = new Date(startDate);

  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day++) {
      days.push({ date: new Date(current), items: [] });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}

export default function CalendarView({ board, items, onCreateItemForDate, onSelectItem }: CalendarViewProps) {
  const dateColumns = getDateColumns(board.columns);
  const [selectedDateColumnId, setSelectedDateColumnId] = useState<string | null>(
    dateColumns.length > 0 ? dateColumns[0].id : null,
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const effectiveDateColumnId =
    selectedDateColumnId && dateColumns.some((c) => c.id === selectedDateColumnId)
      ? selectedDateColumnId
      : dateColumns.length > 0
      ? dateColumns[0].id
      : null;

  const today = stripTime(new Date());

  const { weeks, monthLabel } = useMemo(() => {
    const matrix = getMonthMatrix(currentMonth);

    if (!effectiveDateColumnId) {
      return { weeks: matrix, monthLabel: currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    }

    const daysFlat = matrix.flat();

    const byDay: { date: Date; items: Item[] }[] = daysFlat.map((d) => ({
      date: d.date,
      items: [],
    }));

    items.forEach((item) => {
      const value = item.column_values?.find((cv) => cv.column_id === effectiveDateColumnId)?.value;
      const parsed = parseDate(value);
      if (!parsed) return;
      const stripped = stripTime(parsed);
      const slot = byDay.find((d) => isSameDay(d.date, stripped));
      if (!slot) return;
      slot.items.push(item);
    });

    const filledWeeks: CalendarDay[][] = [];
    for (let i = 0; i < byDay.length; i += 7) {
      filledWeeks.push(
        byDay.slice(i, i + 7).map((d) => ({
          date: d.date,
          items: d.items,
        })),
      );
    }

    return {
      weeks: filledWeeks,
      monthLabel: currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  }, [items, effectiveDateColumnId, currentMonth]);

  if (dateColumns.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Add at least one Date column to use the Calendar view.
      </div>
    );
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-900">Calendar</div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">Date column</span>
            <select
              className="border border-slate-200 rounded-md px-2 py-1 bg-white text-xs"
              value={effectiveDateColumnId || ''}
              onChange={(e) => setSelectedDateColumnId(e.target.value || null)}
            >
              {dateColumns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-medium text-slate-900 min-w-[140px] text-center">{monthLabel}</div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden text-xs font-medium text-slate-500 mb-1">
          {weekDayLabels.map((label) => (
            <div key={label} className="bg-slate-50 px-2 py-2 text-center">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden text-xs">
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const inCurrentMonth = day.date.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(stripTime(day.date), today);

              const handleDayClick = () => {
                if (!effectiveDateColumnId) return;
                onCreateItemForDate(day.date, effectiveDateColumnId);
              };

              return (
                <div
                  key={`${wi}-${di}`}
                  className={`min-h-[90px] bg-white px-2 py-1.5 align-top ${
                    inCurrentMonth ? '' : 'bg-slate-50 text-slate-300'
                  }`}
                  onDoubleClick={handleDayClick}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[11px] ${
                        inCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                      } ${isToday ? 'font-semibold' : ''}`}
                    >
                      {day.date.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {day.items.map((item) => (
                      <div
                        key={item.id}
                        className="truncate px-2 py-1 rounded-md bg-blue-50 text-[11px] text-blue-700"
                        title={getItemName(item, board.columns)}
                        onClick={() => onSelectItem(item)}
                      >
                        {getItemName(item, board.columns)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
