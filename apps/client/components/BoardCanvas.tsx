'use client';

import React, { useEffect, useState } from 'react';
import { Board, Group, Item, Column, ColumnType } from '@/types';
import { fetchItems, createItem, updateColumnValue, fetchBoard, createColumn, deleteColumn, reorderColumns, createGroup, updateGroup, deleteGroup, deleteItem } from '@/lib/api';
import { Plus, LayoutGrid, List, Zap, MoreHorizontal, Trash2, GripVertical, ArrowUpDown, ArrowUp, ArrowDown, Settings, ChevronDown, ArrowLeft, X, Activity, MessageSquare, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import KanbanBoard from './KanbanBoard';
import AutomationModal from './AutomationModal';
import ActivityLogModal from './ActivityLogModal';
import ItemSidePanel from './ItemSidePanel';
import { io } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TimelineView from './TimelineView';

interface BoardCanvasProps {
  boardId: string;
}

interface SortConfig {
  columnId: string | null;
  direction: 'asc' | 'desc';
}

export default function BoardCanvas({ boardId }: BoardCanvasProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'timeline'>('table');
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>(ColumnType.TEXT);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ columnId: null, direction: 'asc' });
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    loadData();

    // Socket.IO Connection
    const newSocket = io('http://localhost:3002');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // console.log('Connected to WebSocket');
      newSocket.emit('joinBoard', { boardId });
    });

    newSocket.on('item.created', (newItem: Item) => {
      setItems(prev => {
        // Prevent duplicates if we already added it locally
        if (prev.find(i => i.id === newItem.id)) return prev;
        return [...prev, newItem];
      });
    });

    newSocket.on('column_value.updated', (data: any) => {
      setItems(prev => prev.map(item => {
        if (item.id === data.item_id) {
          const newValues = item.column_values ? [...item.column_values] : [];
          const idx = newValues.findIndex(cv => cv.column_id === data.column_id);
          
          // Check if value is different to avoid unnecessary updates/loops
          if (idx >= 0) {
            if (newValues[idx].value === data.value) return item; // No change
            newValues[idx] = { ...newValues[idx], value: data.value };
          } else {
            newValues.push({
              id: 'socket-update',
              item_id: data.item_id,
              column_id: data.column_id,
              value: data.value,
              updated_at: new Date().toISOString()
            });
          }
          return { ...item, column_values: newValues };
        }
        return item;
      }));
    });

    newSocket.on('item.archived', (data: any) => {
        setItems(prev => prev.filter(item => item.id !== data.id));
    });

    newSocket.on('item.deleted', (data: any) => {
      setItems(prev => prev.filter(item => item.id !== data.id));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [boardId]);

  const loadData = async () => {
    try {
      const [boardData, itemsData] = await Promise.all([
        fetchBoard(boardId),
        fetchItems(boardId)
      ]);
      setBoard(boardData);
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to load board data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (groupId: string) => {
    if (!board) return;
    try {
      const newItem = await createItem({
        board_id: board.id,
        group_id: groupId,
        created_by: 'user-1', // Mock user
      });
      setItems([...items, newItem]);
    } catch (error) {
      console.error('Failed to create item', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      // Optimistic update
      setItems(prev => prev.filter(i => i.id !== itemId));
      await deleteItem(itemId);
    } catch (error) {
      console.error('Failed to delete item', error);
      loadData(); // Revert
    }
  };

  const handleUpdateValue = async (itemId: string, columnId: string, value: any) => {
    try {
      // Optimistic update
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const newValues = item.column_values ? [...item.column_values] : [];
          const existingValueIndex = newValues.findIndex(cv => cv.column_id === columnId);
          if (existingValueIndex >= 0) {
            newValues[existingValueIndex] = { ...newValues[existingValueIndex], value };
          } else {
            newValues.push({
              id: 'temp', // Temp ID
              item_id: itemId,
              column_id: columnId,
              value,
              updated_at: new Date().toISOString(),
            });
          }
          return { ...item, column_values: newValues };
        }
        return item;
      }));

      await updateColumnValue(itemId, columnId, value);
    } catch (error) {
      console.error('Failed to update value', error);
      loadData(); // Revert on error
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim() || !board) return;
    try {
      await createColumn(board.id, {
        title: newColumnName,
        type: newColumnType,
      });
      setIsAddingColumn(false);
      setNewColumnName('');
      loadData(); // Reload to see new column
    } catch (error) {
      console.error('Failed to create column', error);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!board || !confirm('Are you sure you want to delete this column?')) return;
    try {
      await deleteColumn(board.id, columnId);
      loadData();
    } catch (error) {
      console.error('Failed to delete column', error);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination || !board || !board.columns) return;
    
    // Check if we are dragging a column (based on droppableId prefix)
    if (result.source.droppableId.startsWith('group-headers-')) {
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      
      if (sourceIndex === destinationIndex) return;
      
      const newColumns = Array.from(board.columns);
      const [reorderedColumn] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(destinationIndex, 0, reorderedColumn);
      
      // Optimistic update
      setBoard({ ...board, columns: newColumns });
      
      try {
        await reorderColumns(board.id, newColumns.map(c => c.id));
      } catch (error) {
        console.error('Failed to reorder columns', error);
        loadData(); // Revert
      }
    }
  };


  const handleSort = (columnId: string) => {
    setSortConfig(prev => ({
      columnId,
      direction: prev.columnId === columnId && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setIsSortMenuOpen(false);
  };

  const handleAddGroup = async () => {
    if (!board) return;
    try {
      await createGroup(board.id, { name: 'New Group' });
      loadData();
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  const handleUpdateGroup = async (groupId: string, name: string) => {
    if (!board) return;
    try {
      // Optimistic update
      const newGroups = board.groups?.map(g => g.id === groupId ? { ...g, name } : g) || [];
      setBoard({ ...board, groups: newGroups });
      
      await updateGroup(board.id, groupId, { name });
    } catch (error) {
      console.error('Failed to update group', error);
      loadData();
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!board || !confirm('Are you sure you want to delete this group?')) return;
    try {
      await deleteGroup(board.id, groupId);
      loadData();
    } catch (error) {
      console.error('Failed to delete group', error);
    }
  };

  const getSortedItems = (items: Item[]) => {
    if (!sortConfig.columnId) return items;
    
    return [...items].sort((a, b) => {
      const valA = a.column_values?.find(v => v.column_id === sortConfig.columnId)?.value;
      const valB = b.column_values?.find(v => v.column_id === sortConfig.columnId)?.value;

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      return sortConfig.direction === 'asc' 
        ? (valA > valB ? 1 : -1) 
        : (valA < valB ? 1 : -1);
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!board) return <div className="p-8 text-center text-slate-500">Board not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4 mb-1">
            <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors" title="Back to Home">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{board.name}</h1>
          </div>
          <p className="text-slate-500 text-sm ml-10 mb-6">{board.description || 'No description'}</p>

          {/* View Switcher and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <List size={16} /> Table
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <LayoutGrid size={16} /> Kanban
              </button>
              <button 
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <CalendarDays size={16} /> Timeline
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    sortConfig.columnId 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <ArrowUpDown size={16} /> 
                  {sortConfig.columnId 
                    ? `Sorted by ${board?.columns?.find(c => c.id === sortConfig.columnId)?.title}`
                    : 'Sort'}
                </button>
                
                {isSortMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sort by</div>
                    <button 
                      onClick={() => {
                        setSortConfig({ columnId: null, direction: 'asc' });
                        setIsSortMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      None (Default)
                    </button>
                    {board?.columns?.map(col => (
                      <button
                        key={col.id}
                        onClick={() => handleSort(col.id)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors"
                      >
                        {col.title}
                        {sortConfig.columnId === col.id && (
                          sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isAddingColumn ? (
                 <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <input 
                      autoFocus
                      placeholder="Column Name" 
                      className="px-3 py-1.5 text-sm border-none bg-transparent focus:outline-none w-32 placeholder:text-slate-400"
                      value={newColumnName}
                      onChange={e => setNewColumnName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                    />
                    <div className="h-4 w-px bg-slate-200"></div>
                    <select 
                      className="px-2 py-1.5 text-sm border-none bg-transparent focus:outline-none text-slate-600 cursor-pointer"
                      value={newColumnType}
                      onChange={e => setNewColumnType(e.target.value as ColumnType)}
                    >
                      <option value={ColumnType.TEXT}>Text</option>
                      <option value={ColumnType.STATUS}>Status</option>
                      <option value={ColumnType.NUMBERS}>Numbers</option>
                      <option value={ColumnType.DATE}>Date</option>
                      <option value={ColumnType.PERSON}>Person</option>
                      <option value={ColumnType.FILES}>Files</option>
                    </select>
                    <button onClick={handleAddColumn} className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"><Plus size={16} /></button>
                    <button onClick={() => setIsAddingColumn(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"><X size={16} /></button>
                 </div>
              ) : (
                <button 
                  onClick={() => setIsAddingColumn(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                >
                  <Plus size={16} /> New Column
                </button>
              )}

              <button 
                onClick={() => setIsAutomationOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Zap size={16} />
                Automations
              </button>
              <button 
                onClick={() => setIsActivityLogOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Activity size={16} />
                Activity
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-[1400px] mx-auto">
          <AutomationModal
            isOpen={isAutomationOpen}
            onClose={() => setIsAutomationOpen(false)}
            boardId={boardId}
            columns={board.columns || []}
          />

          {isActivityLogOpen && (
            <ActivityLogModal
              boardId={boardId}
              onClose={() => setIsActivityLogOpen(false)}
            />
          )}

          {viewMode === 'table' && (
            <DragDropContext onDragEnd={onDragEnd}>
              {board.groups?.map(group => (
                <GroupView
                  key={group.id}
                  group={group}
                  columns={board.columns || []}
                  items={getSortedItems(items.filter(i => i.group_id === group.id))}
                  onCreateItem={() => handleCreateItem(group.id)}
                  onUpdateValue={handleUpdateValue}
                  onDeleteColumn={handleDeleteColumn}
                  onUpdateGroup={handleUpdateGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onDeleteItem={handleDeleteItem}
                  onItemClick={setSelectedItem}
                />
              ))}
              <button
                onClick={handleAddGroup}
                className="flex items-center gap-2 mt-4 px-4 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all font-medium text-sm"
              >
                <Plus size={18} /> Add New Group
              </button>
            </DragDropContext>
          )}
          {viewMode === 'kanban' && (
            <KanbanBoard 
              board={board} 
              items={items} 
              onUpdateItem={handleUpdateValue} 
            />
          )}
          {viewMode === 'timeline' && (
            <TimelineView
              board={board}
              items={items}
              onUpdateItem={handleUpdateValue}
            />
          )}
    </div>
    
    {/* Side Panel */}
    {selectedItem && (
        <ItemSidePanel
          item={selectedItem}
          columns={board.columns || []}
          onClose={() => setSelectedItem(null)}
          socket={socket}
        />
      )}
    </div>
    </div>
  );
}

function GroupView({
  group,
  columns,
  items,
  onCreateItem,
  onUpdateValue,
  onDeleteColumn,
  onUpdateGroup,
  onDeleteGroup,
  onDeleteItem,
  onItemClick
}: {
  group: Group;
  columns: Column[];
  items: Item[];
  onCreateItem: () => void;
  onUpdateValue: (itemId: string, columnId: string, value: any) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateGroup: (groupId: string, name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onItemClick: (item: Item) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(group.name);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (name !== group.name) {
      onUpdateGroup(group.id, name);
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4 group/header">
        <ChevronDown size={20} className="text-slate-400" />
        {isEditingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            className="text-lg font-bold text-blue-600 border-b-2 border-blue-600 focus:outline-none bg-transparent"
          />
        ) : (
          <h2 
            onClick={() => setIsEditingName(true)}
            className="text-lg font-bold text-blue-600 cursor-pointer hover:bg-blue-50 px-2 rounded -ml-2 transition-colors"
          >
            {group.name}
          </h2>
        )}
        <span className="text-slate-400 text-sm font-medium bg-slate-100 px-2 py-0.5 rounded-full">{items.length} items</span>
        
        <div className="opacity-0 group-hover/header:opacity-100 transition-opacity flex items-center gap-1 ml-2">
          <button 
            onClick={() => onDeleteGroup(group.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Group"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <Droppable droppableId={`group-headers-${group.id}`} direction="horizontal">
              {(provided) => (
                <tr 
                  className="bg-slate-50/50 border-b border-slate-200"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <th className="p-3 border-r border-slate-200 w-10"></th>
                  {columns.map((col, index) => (
                    <Draggable key={col.id} draggableId={col.id} index={index}>
                      {(provided, snapshot) => (
                        <th 
                          key={col.id}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-3 border-r border-slate-200 min-w-[150px] text-xs font-semibold uppercase tracking-wider text-slate-500 group relative transition-colors ${snapshot.isDragging ? 'bg-slate-100 shadow-lg' : ''}`}
                          style={{ ...provided.draggableProps.style }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                {...provided.dragHandleProps} 
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <GripVertical size={14} />
                              </div>
                              {col.title}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteColumn(col.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </th>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <th className="p-3 border-slate-200 min-w-[100px]"></th>
                </tr>
              )}
            </Droppable>
          </thead>
          <tbody>
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                columns={columns}
                onUpdateValue={onUpdateValue}
                onDeleteItem={onDeleteItem}
                onItemClick={onItemClick}
              />
            ))}
            <tr>
              <td className="border-r border-slate-200 p-2 bg-slate-50/30 sticky left-0 z-10"></td>
              <td className="p-1" colSpan={columns.length + 1}>
                <button
                  onClick={onCreateItem}
                  className="flex items-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 text-sm px-3 py-2 rounded-lg w-full transition-all group"
                >
                  <div className="bg-slate-200 group-hover:bg-blue-100 rounded p-0.5 mr-2 transition-colors">
                    <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <span className="font-medium">Add Item</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  columns,
  onUpdateValue,
  onDeleteItem,
  onItemClick
}: {
  item: Item;
  columns: Column[];
  onUpdateValue: (itemId: string, columnId: string, value: any) => void;
  onDeleteItem: (itemId: string) => void;
  onItemClick: (item: Item) => void;
}) {
  return (
    <tr className="group hover:bg-slate-50/50 border-b border-slate-100 last:border-b-0 transition-colors">
      <td className="p-3 border-r border-slate-200 bg-slate-50/30 text-center text-slate-400 sticky left-0 z-10">
        <div className="w-1 h-full bg-blue-500 absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center bg-slate-50/90 z-20 gap-1">
          <button
            onClick={() => onItemClick(item)}
            className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
            title="Open Updates"
          >
            <MessageSquare size={14} />
          </button>
          <button
            onClick={() => onDeleteItem(item.id)}
            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Item"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="group-hover:opacity-0 transition-opacity">
           <MessageSquare size={14} className="mx-auto text-slate-300" />
        </div>
      </td>
      {columns.map(col => {
        const val = item.column_values?.find(v => v.column_id === col.id)?.value;
        return (
          <td key={col.id} className="p-0 border-r border-slate-200 bg-white relative">
            <CellEditor
              column={col}
              value={val}
              onChange={(newVal) => onUpdateValue(item.id, col.id, newVal)}
            />
          </td>
        );
      })}
      <td className="p-0 bg-white"></td>
    </tr>
  );
}

function CellEditor({
  column,
  value,
  onChange
}: {
  column: Column;
  value: any;
  onChange: (val: any) => void;
}) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleBlur = () => {
    if (localValue !== (value || '')) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  switch (column.type) {
    case ColumnType.STATUS:
      return (
        <div className="h-full w-full p-1.5">
          <div className="relative h-full">
            <select
              className="w-full h-full px-3 py-1.5 rounded-md text-white font-medium text-center text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/20 transition-all shadow-sm"
              style={{
                backgroundColor: getStatusColor(value),
              }}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="" className="text-slate-800 bg-white">Select Status</option>
              {column.settings.options?.map((opt: string) => (
                <option key={opt} value={opt} className="text-slate-800 bg-white">
                  {opt}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      );
    case ColumnType.DATE:
      return (
        <input
          type="date"
          className="w-full h-full px-4 py-2 text-sm text-slate-700 outline-none bg-transparent focus:bg-slate-50 transition-colors"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case ColumnType.NUMBERS:
      return (
        <div className="relative w-full h-full group">
           <input
            type="number"
            className="w-full h-full px-4 py-2 text-sm text-slate-700 outline-none bg-transparent focus:bg-slate-50 placeholder:text-slate-300 transition-colors text-right font-mono"
            placeholder="0"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
              #
           </div>
        </div>
      );
    case ColumnType.FILES:
      return (
        <div className="w-full h-full px-2 flex items-center">
          {value && Array.isArray(value) && value.length > 0 ? (
            <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all">
              {value.map((file: any, i: number) => (
                <a 
                  key={i} 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[10px] text-blue-600 font-bold"
                  title={file.name}
                >
                  F
                </a>
              ))}
              <button 
                className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-slate-400 hover:bg-slate-200"
                onClick={() => {
                   const url = prompt('Enter file URL:');
                   const name = prompt('Enter file name:') || 'File';
                   if (url) {
                      const newFiles = [...value, { url, name, type: 'link' }];
                      onChange(newFiles);
                   }
                }}
              >
                +
              </button>
            </div>
          ) : (
            <button 
              className="text-slate-400 hover:text-blue-600 text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 w-full"
              onClick={() => {
                 const url = prompt('Enter file URL:');
                 const name = prompt('Enter file name:') || 'File';
                 if (url) {
                    onChange([{ url, name, type: 'link' }]);
                 }
              }}
            >
              <Plus size={14} /> Add File
            </button>
          )}
        </div>
      );
    case ColumnType.TEXT:
    default:
      return (
        <input
          type="text"
          className="w-full h-full px-4 py-2 text-sm text-slate-700 outline-none bg-transparent focus:bg-slate-50 placeholder:text-slate-300 transition-colors"
          placeholder="Empty"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      );
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Done': return '#00c875';
    case 'In Progress': return '#fdab3d';
    case 'To Do': return '#c4c4c4'; // Grey
    default: return '#c4c4c4';
  }
}
