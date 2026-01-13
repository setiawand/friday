'use client';

import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Board, Item, ColumnType } from '@/types';

interface KanbanBoardProps {
  board: Board;
  items: Item[];
  onUpdateItem: (itemId: string, columnId: string, value: any) => void;
}

export default function KanbanBoard({ board, items, onUpdateItem }: KanbanBoardProps) {
  // 1. Find the Status column
  const statusColumn = useMemo(() => {
    return board.columns?.find(col => col.type === ColumnType.STATUS);
  }, [board.columns]);

  // 2. Get options (columns for Kanban)
  const columns = useMemo(() => {
    if (!statusColumn) return [];
    const options = statusColumn.settings?.options || [];
    // Ensure we have unique options and handle empty/undefined
    return Array.isArray(options) ? options : [];
  }, [statusColumn]);

  // 3. Group items by status
  const itemsByStatus = useMemo(() => {
    const grouped: Record<string, Item[]> = {};
    columns.forEach(col => grouped[col] = []);
    // Also handle "No Status" or unmapped items? 
    // For simplicity, maybe just default to first column or a "No Status" column if we want.
    // Let's stick to defined options for now.
    
    items.forEach(item => {
      const val = item.column_values?.find(cv => cv.column_id === statusColumn?.id);
      const status = val?.value; // Assuming value is the string option directly
      
      // If status matches one of our columns, add it
      if (status && grouped[status]) {
        grouped[status].push(item);
      } else if (columns.length > 0) {
        // Fallback: Add to first column (often "To Do" or similar) if no value set?
        // Or maybe a separate "No Status" column. 
        // For this MVP, let's put undefined status in the first column if available.
        if (columns[0]) {
             if (!status) grouped[columns[0]].push(item); 
        }
      }
    });
    
    // Sort items by position within each group?
    // Items have a global position or group-based position. 
    // In Kanban, we might want to respect that, but for now simple order is fine.
    return grouped;
  }, [items, columns, statusColumn]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Identify the new status
    const newStatus = destination.droppableId;
    
    // Call parent updater
    if (statusColumn) {
        onUpdateItem(draggableId, statusColumn.id, newStatus);
    }
  };

  if (!statusColumn) {
    return <div className="p-8 text-center text-slate-500">No Status column found to generate Kanban view.</div>;
  }

  return (
    <div className="flex h-full overflow-x-auto gap-6 pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        {columns.map((status) => (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col h-full max-h-[calc(100vh-200px)]">
            {/* Column Header */}
            <div className="mb-4 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                ></div>
                <h3 className="font-semibold text-slate-700">{status}</h3>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                {itemsByStatus[status]?.length || 0}
              </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 bg-slate-100/50 rounded-xl p-2 transition-all border border-transparent ${
                    snapshot.isDraggingOver ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-100/50' : ''
                  }`}
                >
                  <div className="flex flex-col gap-3 min-h-[100px]">
                    {itemsByStatus[status]?.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group ${
                              snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500/20 rotate-1 z-50' : ''
                            }`}
                            style={provided.draggableProps.style}
                          >
                            {/* Card Content */}
                            <div className="text-sm text-slate-800 font-medium leading-snug">
                               <ItemTitle item={item} board={board} />
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <div className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
                                    #{item.id.slice(0,4)}
                                </div>
                                {/* Add more metadata here later if needed */}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
}

// Helper for status colors
function getStatusColor(status: string) {
  switch (status) {
    case 'Done': return '#00c875';
    case 'In Progress': return '#fdab3d';
    case 'To Do': return '#c4c4c4';
    default: return '#e2e8f0';
  }
}

// Helper to find the title/name of an item
function ItemTitle({ item, board }: { item: Item, board: Board }) {
    // Try to find the first text column or one named "Item" or "Name"
    const nameColumn = board.columns?.find(c => c.type === ColumnType.TEXT && (c.title === 'Item' || c.title === 'Name' || c.title === 'Title')) 
                    || board.columns?.find(c => c.type === ColumnType.TEXT);
    
    if (!nameColumn) return <span>Item {item.id.slice(0,4)}</span>;

    const val = item.column_values?.find(cv => cv.column_id === nameColumn.id);
    return <span>{val?.value || 'Untitled'}</span>;
}
