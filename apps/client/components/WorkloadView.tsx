'use client';

import React, { useMemo, useState } from 'react';
import { Board, Item, Column, ColumnType } from '@/types';

interface WorkloadViewProps {
  board: Board;
  items: Item[];
  onSelectPerson?: (personKey: string, personColumnId: string) => void;
  activePersonFilter?: {
    personKey: string;
    columnId: string;
  } | null;
}

interface PersonWorkload {
  key: string;
  label: string;
  color: string;
  count: number;
  byWeek: Record<string, number>;
}

interface WeekBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

function getPersonColumns(columns: Column[] | undefined) {
  if (!columns) return [];
  return columns.filter((c) => c.type === ColumnType.PERSON);
}

function getDateColumns(columns: Column[] | undefined) {
  if (!columns) return [];
  return columns.filter((c) => c.type === ColumnType.DATE);
}

function getStatusColumns(columns: Column[] | undefined) {
  if (!columns) return [];
  return columns.filter((c) => c.type === ColumnType.STATUS);
}

function getTextColumn(columns: Column[] | undefined) {
  if (!columns) return undefined;
  return columns.find((c) => c.type === ColumnType.TEXT);
}

function getItemName(item: Item, columns: Column[] | undefined) {
  const textColumn = getTextColumn(columns);
  if (textColumn) {
    const val = item.column_values?.find((cv) => cv.column_id === textColumn.id);
    if (val?.value) return String(val.value);
  }
  return 'Untitled Item';
}

function normalizePerson(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  return [String(value)];
}

function parseDateValue(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function stripToDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getWeekKey(date: Date): WeekBucket {
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const key = `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
  const label = `${monday.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} - ${sunday.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;

  return { key, label, start: stripToDate(monday), end: stripToDate(sunday) };
}

export default function WorkloadView({ board, items, onSelectPerson, activePersonFilter }: WorkloadViewProps) {
  const personColumns = getPersonColumns(board.columns);
  const dateColumns = getDateColumns(board.columns);
  const statusColumns = getStatusColumns(board.columns);
  const [selectedPersonColumnId, setSelectedPersonColumnId] = useState<string | null>(
    personColumns.length > 0 ? personColumns[0].id : null,
  );

  const [selectedDateColumnId, setSelectedDateColumnId] = useState<string | null>(
    dateColumns.length > 0 ? dateColumns[0].id : null,
  );

  const [selectedStatusColumnId, setSelectedStatusColumnId] = useState<string | null>(
    statusColumns.length > 0 ? statusColumns[0].id : null,
  );

  const [statusFilterValue, setStatusFilterValue] = useState<string>('all');

  const effectivePersonColumnId =
    selectedPersonColumnId && personColumns.some((c) => c.id === selectedPersonColumnId)
      ? selectedPersonColumnId
      : personColumns.length > 0
      ? personColumns[0].id
      : null;
  const effectiveDateColumnId =
    selectedDateColumnId && dateColumns.some((c) => c.id === selectedDateColumnId)
      ? selectedDateColumnId
      : dateColumns.length > 0
      ? dateColumns[0].id
      : null;

  const effectiveStatusColumnId =
    selectedStatusColumnId && statusColumns.some((c) => c.id === selectedStatusColumnId)
      ? selectedStatusColumnId
      : statusColumns.length > 0
      ? statusColumns[0].id
      : null;

  const statusOptions = useMemo(() => {
    const col = statusColumns.find((c) => c.id === effectiveStatusColumnId);
    const opts = col?.settings?.options || [];
    return Array.isArray(opts) ? opts : [];
  }, [statusColumns, effectiveStatusColumnId]);

  const { workloads, totalUnassigned, weekBuckets } = useMemo(() => {
    if (!effectivePersonColumnId) {
      return { workloads: [] as PersonWorkload[], totalUnassigned: items.length, weekBuckets: [] as WeekBucket[] };
    }

    const counts: Record<string, PersonWorkload> = {};
    const weeksMap: Record<string, WeekBucket> = {};
    let unassigned = 0;

    items.forEach((item) => {
      if (effectiveStatusColumnId && statusFilterValue !== 'all') {
        const statusVal = item.column_values?.find((cv) => cv.column_id === effectiveStatusColumnId)?.value;
        if (statusVal !== statusFilterValue) {
          return;
        }
      }

      const personVal = item.column_values?.find((cv) => cv.column_id === effectivePersonColumnId)?.value;
      const assignees = normalizePerson(personVal);

      const dateVal = effectiveDateColumnId
        ? item.column_values?.find((cv) => cv.column_id === effectiveDateColumnId)?.value
        : null;
      const parsedDate = dateVal ? parseDateValue(dateVal) : null;
      const dateForBucket = parsedDate ? stripToDate(parsedDate) : null;

      if (assignees.length === 0) {
        unassigned += 1;
        return;
      }

      let weekKey: string | null = null;
      if (dateForBucket) {
        const bucket = getWeekKey(dateForBucket);
        weeksMap[bucket.key] = bucket;
        weekKey = bucket.key;
      }

      assignees.forEach((a) => {
        const key = a || 'Unassigned';
        if (!counts[key]) {
          counts[key] = {
            key,
            label: a || 'Unassigned',
            color: '#4f46e5',
            count: 0,
            byWeek: {},
          };
        }
        counts[key].count += 1;
        if (weekKey) {
          counts[key].byWeek[weekKey] = (counts[key].byWeek[weekKey] || 0) + 1;
        }
      });
    });

    const list = Object.values(counts).sort((a, b) => b.count - a.count);
    const weekList = Object.values(weeksMap).sort((a, b) => a.start.getTime() - b.start.getTime());

    return { workloads: list, totalUnassigned: unassigned, weekBuckets: weekList };
  }, [
    items,
    effectivePersonColumnId,
    effectiveDateColumnId,
    effectiveStatusColumnId,
    statusFilterValue,
  ]);

  if (personColumns.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Add a Person column to use the Workload view.
      </div>
    );
  }

  const totalAssigned = workloads.reduce((sum, w) => sum + w.count, 0);
  const totalItems = items.length;
  const maxCount = workloads.length > 0 ? workloads[0].count : 0;

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium text-slate-900">Workload</div>
          <div className="text-xs text-slate-500">
            Shows how many items are assigned to each person on this board.
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Person</span>
              <select
                className="border border-slate-200 rounded-md px-2 py-1 bg-white text-xs"
                value={effectivePersonColumnId || ''}
                onChange={(e) => setSelectedPersonColumnId(e.target.value || null)}
              >
                {personColumns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
            {dateColumns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Date</span>
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
            )}
            {statusColumns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Status</span>
                <select
                  className="border border-slate-200 rounded-md px-2 py-1 bg-white text-xs"
                  value={statusFilterValue}
                  onChange={(e) => setStatusFilterValue(e.target.value)}
                >
                  <option value="all">All</option>
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              Total items: <span className="font-semibold text-slate-900">{totalItems}</span>
            </span>
            <span className="text-slate-500">
              Assigned: <span className="font-semibold text-slate-900">{totalAssigned}</span>
            </span>
            <span className="text-slate-500">
              Unassigned: <span className="font-semibold text-slate-900">{totalUnassigned}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {effectiveDateColumnId && weekBuckets.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="text-xs font-semibold text-slate-500 mb-2">Per week</div>
              <div className="grid" style={{ gridTemplateColumns: `160px repeat(${weekBuckets.length}, minmax(80px, 1fr))` }}>
                <div></div>
                {weekBuckets.map((w) => (
                  <div
                    key={w.key}
                    className="text-[11px] text-slate-500 text-center px-2 py-1 border-b border-slate-200"
                  >
                    {w.label}
                  </div>
                ))}
              </div>
              {workloads.map((w) => (
                <div
                  key={w.key}
                  className="grid items-center"
                  style={{ gridTemplateColumns: `160px repeat(${weekBuckets.length}, minmax(80px, 1fr))` }}
                >
                  <div className="text-xs font-medium text-slate-700 px-2 py-2 truncate">
                    {w.label}
                  </div>
                  {weekBuckets.map((bucket) => {
                    const count = w.byWeek[bucket.key] || 0;
                    const ratio = count > 0 ? count / (w.count || 1) : 0;
                    const width = `${Math.max(0, ratio * 100)}%`;
                    return (
                      <div key={bucket.key} className="px-2 py-1 border-t border-slate-100">
                        {count > 0 && (
                          <div className="h-4 bg-indigo-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full text-[10px] text-indigo-50 flex items-center justify-center"
                              style={{ width }}
                            >
                              {count}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {workloads.length === 0 && (
          <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg px-4 py-3 bg-slate-50">
            No items are assigned in this Person column yet.
          </div>
        )}

        {workloads.map((w) => {
          const ratio = maxCount > 0 ? w.count / maxCount : 0;
          const width = `${Math.max(8, ratio * 100)}%`;

          return (
            <div key={w.key} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!effectivePersonColumnId || !onSelectPerson) return;
                  const isActive =
                    activePersonFilter &&
                    activePersonFilter.columnId === effectivePersonColumnId &&
                    activePersonFilter.personKey === w.key;
                  if (isActive) {
                    onSelectPerson('', effectivePersonColumnId);
                  } else {
                    onSelectPerson(w.key, effectivePersonColumnId);
                  }
                }}
                className={`w-36 text-left text-xs font-medium truncate px-2 py-1 rounded ${
                  activePersonFilter &&
                  activePersonFilter.columnId === effectivePersonColumnId &&
                  activePersonFilter.personKey === w.key
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {w.label}
              </button>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 flex items-center justify-between px-2 text-[11px] text-indigo-50"
                  style={{ width }}
                >
                  <span>{w.count} items</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
