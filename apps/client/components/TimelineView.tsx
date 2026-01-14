'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Board, Item, ColumnType, Column } from '@/types';

interface TimelineViewProps {
  board: Board;
  items: Item[];
  onUpdateItem: (itemId: string, columnId: string, value: any) => void;
}

interface TimelineItem {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  hasEndDate: boolean;
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

function daysBetween(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDay(date: Date) {
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

function formatDateForInput(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getItemName(item: Item, columns: Column[] | undefined) {
  const textColumn = getTextColumn(columns);
  if (textColumn) {
    const val = item.column_values?.find((cv) => cv.column_id === textColumn.id);
    if (val?.value) return String(val.value);
  }
  return 'Untitled Item';
}

export default function TimelineView({ board, items, onUpdateItem }: TimelineViewProps) {
  const dateColumns = getDateColumns(board.columns);
  const [startColumnId, setStartColumnId] = useState<string | null>(
    dateColumns.length > 0 ? dateColumns[0].id : null,
  );
  const [endColumnId, setEndColumnId] = useState<string | 'none'>(
    dateColumns.length > 1 ? dateColumns[1].id : 'none',
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    itemId: string;
    originalStart: Date;
    originalEnd: Date;
    hasEndDate: boolean;
    startX: number;
    pxPerDay: number;
    mode: 'move' | 'resize-start' | 'resize-end';
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    itemId: string;
    startDate: Date;
    endDate: Date;
  } | null>(null);

  const effectiveStartColumnId =
    startColumnId && dateColumns.some((c) => c.id === startColumnId)
      ? startColumnId
      : dateColumns.length > 0
      ? dateColumns[0].id
      : null;

  const effectiveEndColumnId =
    endColumnId !== 'none' && dateColumns.some((c) => c.id === endColumnId)
      ? endColumnId
      : 'none';

  const { timelineItems, startDate, endDate } = useMemo(() => {
    if (dateColumns.length === 0) {
      return { timelineItems: [] as TimelineItem[], startDate: null as Date | null, endDate: null as Date | null };
    }

    if (!effectiveStartColumnId) {
      return { timelineItems: [] as TimelineItem[], startDate: null as Date | null, endDate: null as Date | null };
    }

    const primary = dateColumns.find((c) => c.id === effectiveStartColumnId)!;
    const secondary =
      effectiveEndColumnId !== 'none' ? dateColumns.find((c) => c.id === effectiveEndColumnId) : undefined;

    const mapped: TimelineItem[] = [];

    items.forEach((item) => {
      const startVal = item.column_values?.find((cv) => cv.column_id === primary.id)?.value;
      const start = parseDate(startVal);
      if (!start) return;

      let end = start;
      let hasEndDate = false;
      if (secondary) {
        const endVal = item.column_values?.find((cv) => cv.column_id === secondary.id)?.value;
        const parsedEnd = parseDate(endVal);
        if (parsedEnd) {
          end = parsedEnd;
          hasEndDate = true;
        }
      }

      if (end < start) {
        end = start;
      }

      mapped.push({
        id: item.id,
        name: getItemName(item, board.columns),
        startDate: start,
        endDate: end,
        hasEndDate,
      });
    });

    if (mapped.length === 0) {
      return { timelineItems: [], startDate: null as Date | null, endDate: null as Date | null };
    }

    let min = mapped[0].startDate;
    let max = mapped[0].endDate;

    mapped.forEach((ti) => {
      if (ti.startDate < min) min = ti.startDate;
      if (ti.endDate > max) max = ti.endDate;
    });

    min = addDays(min, -1);
    max = addDays(max, 1);

    return { timelineItems: mapped, startDate: min, endDate: max };
  }, [items, board.columns, dateColumns, effectiveStartColumnId, effectiveEndColumnId]);

  if (dateColumns.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Add at least one Date column to use the Timeline view.
      </div>
    );
  }

  if (!startDate || !endDate) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        No items with dates yet. Set dates in the Date column to see them on the timeline.
      </div>
    );
  }

  const totalDays = Math.max(1, daysBetween(startDate, endDate) + 1);
  const dayColumns = Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));

  const startDrag = (
    event: React.MouseEvent,
    ti: TimelineItem,
    mode: 'move' | 'resize-start' | 'resize-end',
  ) => {
    if (event.button !== 0) return;
    if (!containerRef.current) return;
    if (!effectiveStartColumnId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const timelineWidth = rect.width - 240;
    if (timelineWidth <= 0) return;

    const pxPerDay = timelineWidth / totalDays;

    dragStateRef.current = {
      itemId: ti.id,
      originalStart: ti.startDate,
      originalEnd: ti.endDate,
      hasEndDate: ti.hasEndDate,
      startX: event.clientX,
      pxPerDay,
      mode,
    };

    setDragPreview({
      itemId: ti.id,
      startDate: ti.startDate,
      endDate: ti.endDate,
    });

    event.preventDefault();
  };

  const handleBarMouseDown = (event: React.MouseEvent, ti: TimelineItem) => {
    startDrag(event, ti, 'move');
  };

  const handleResizeStartMouseDown = (event: React.MouseEvent, ti: TimelineItem) => {
    event.stopPropagation();
    startDrag(event, ti, 'resize-start');
  };

  const handleResizeEndMouseDown = (event: React.MouseEvent, ti: TimelineItem) => {
    event.stopPropagation();
    startDrag(event, ti, 'resize-end');
  };

  const handleContainerMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state) return;
    event.preventDefault();

    const dx = event.clientX - state.startX;
    const deltaDays = Math.round(dx / state.pxPerDay);

    let previewStart = state.originalStart;
    let previewEnd = state.originalEnd;

    if (deltaDays !== 0) {
      if (state.mode === 'move') {
        previewStart = addDays(state.originalStart, deltaDays);
        if (state.hasEndDate) {
          previewEnd = addDays(state.originalEnd, deltaDays);
        }
      } else if (state.mode === 'resize-start') {
        let newStart = addDays(state.originalStart, deltaDays);
        if (state.hasEndDate && newStart > state.originalEnd) {
          newStart = state.originalEnd;
        }
        previewStart = newStart;
      } else if (state.mode === 'resize-end') {
        if (!state.hasEndDate) {
          return;
        }
        let newEnd = addDays(state.originalEnd, deltaDays);
        if (newEnd < state.originalStart) {
          newEnd = state.originalStart;
        }
        previewEnd = newEnd;
      }
    }

    setDragPreview({
      itemId: state.itemId,
      startDate: previewStart,
      endDate: previewEnd,
    });
  };

  const handleContainerMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state) return;

    dragStateRef.current = null;
    setDragPreview(null);

    const dx = event.clientX - state.startX;
    const deltaDays = Math.round(dx / state.pxPerDay);

    if (deltaDays === 0) return;

    if (!effectiveStartColumnId) return;

    if (state.mode === 'move') {
      const newStart = addDays(state.originalStart, deltaDays);
      const newStartStr = formatDateForInput(newStart);
      onUpdateItem(state.itemId, effectiveStartColumnId, newStartStr);

      if (effectiveEndColumnId !== 'none' && state.hasEndDate) {
        const newEnd = addDays(state.originalEnd, deltaDays);
        const newEndStr = formatDateForInput(newEnd);
        onUpdateItem(state.itemId, effectiveEndColumnId, newEndStr);
      }
      return;
    }

    if (state.mode === 'resize-start') {
      let newStart = addDays(state.originalStart, deltaDays);
      if (state.hasEndDate && newStart > state.originalEnd) {
        newStart = state.originalEnd;
      }
      const newStartStr = formatDateForInput(newStart);
      onUpdateItem(state.itemId, effectiveStartColumnId, newStartStr);
      return;
    }

    if (state.mode === 'resize-end') {
      if (effectiveEndColumnId === 'none' || !state.hasEndDate) {
        return;
      }
      let newEnd = addDays(state.originalEnd, deltaDays);
      if (newEnd < state.originalStart) {
        newEnd = state.originalStart;
      }
      const newEndStr = formatDateForInput(newEnd);
      onUpdateItem(state.itemId, effectiveEndColumnId, newEndStr);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-medium text-slate-900">Timeline</div>
              <div className="text-xs text-slate-500">
              Drag bars to shift dates, or drag edges to resize. End dates move only if they already exist.
              </div>
            </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">Start</span>
            <select
              className="border border-slate-200 rounded-md px-2 py-1 bg-white text-xs"
              value={effectiveStartColumnId || ''}
              onChange={(e) => setStartColumnId(e.target.value || null)}
            >
              {dateColumns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
            <span className="font-medium ml-3">End</span>
            <select
              className="border border-slate-200 rounded-md px-2 py-1 bg-white text-xs"
              value={effectiveEndColumnId}
              onChange={(e) => setEndColumnId(e.target.value as string | 'none')}
            >
              <option value="none">None</option>
              {dateColumns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="min-w-[600px]"
          ref={containerRef}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
        >
          <div className="grid" style={{ gridTemplateColumns: `240px repeat(${totalDays}, minmax(40px, 1fr))` }}>
            <div className="border-b border-slate-200 bg-slate-50 sticky left-0 z-20"></div>
            {dayColumns.map((d, idx) => (
              <div
                key={idx}
                className="border-b border-l border-slate-200 bg-slate-50 text-xs text-slate-500 px-2 py-1 text-center"
              >
                {formatDay(d)}
              </div>
            ))}
          </div>

          {timelineItems.map((ti, rowIdx) => {
            const previewForItem =
              dragPreview && dragPreview.itemId === ti.id ? dragPreview : null;

            const effectiveItemStart = previewForItem ? previewForItem.startDate : ti.startDate;
            const effectiveItemEnd = previewForItem ? previewForItem.endDate : ti.endDate;

            const startOffset = Math.max(0, daysBetween(startDate, effectiveItemStart));
            const endOffset = Math.max(startOffset, daysBetween(startDate, effectiveItemEnd));
            const gridColumnStart = startOffset + 2;
            const gridColumnEnd = endOffset + 3;

            return (
              <div
                key={ti.id}
                className="grid items-center"
                style={{ gridTemplateColumns: `240px repeat(${totalDays}, minmax(40px, 1fr))` }}
              >
                <div className="border-b border-slate-100 px-4 py-2 text-sm text-slate-800 bg-white sticky left-0 z-10">
                  {ti.name}
                </div>
                {dayColumns.map((_, idx) => (
                  <div
                    key={idx}
                    className="border-b border-l border-slate-100 h-10 bg-slate-50"
                  ></div>
                ))}
                <div
                  className="relative h-6 rounded-full bg-blue-500/80 shadow-sm row-start-auto col-start-auto col-span-1 -mt-8 mx-1 cursor-move"
                  style={{ gridColumn: `${gridColumnStart} / ${gridColumnEnd}` }}
                  onMouseDown={(e) => handleBarMouseDown(e, ti)}
                >
                  <div
                    className="absolute left-0 top-0 h-full w-1 bg-blue-700 cursor-ew-resize"
                    onMouseDown={(e) => handleResizeStartMouseDown(e, ti)}
                  />
                  {ti.hasEndDate && effectiveEndColumnId !== 'none' && (
                    <div
                      className="absolute right-0 top-0 h-full w-1 bg-blue-700 cursor-ew-resize"
                      onMouseDown={(e) => handleResizeEndMouseDown(e, ti)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
