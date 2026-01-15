'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createAutomation, fetchAutomations } from '@/lib/api';
import { Column, ColumnType } from '@/types';
import { X, Plus, Zap } from 'lucide-react';

interface AutomationModalProps {
  boardId: string;
  columns: Column[];
  isOpen: boolean;
  onClose: () => void;
}

interface Automation {
  id: string;
  trigger: string;
  conditions: any;
  action: string;
  is_active: boolean;
}

export default function AutomationModal({ boardId, columns, isOpen, onClose }: AutomationModalProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [action, setAction] = useState('archive_item');

  const loadAutomations = useCallback(async () => {
    try {
      const data = await fetchAutomations(boardId);
      setAutomations(data);
    } catch (error) {
      console.error('Failed to load automations', error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      loadAutomations();
    }
  }, [isOpen, loadAutomations]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumnId || !targetValue) return;

    try {
      const newAuto = await createAutomation(boardId, {
        trigger: 'column_value_changed',
        conditions: {
          column_id: selectedColumnId,
          value: targetValue
        },
        action: action,
      });
      setAutomations([...automations, newAuto]);
      setIsCreating(false);
      // Reset form
      setTargetValue('');
    } catch (error) {
      console.error('Failed to create automation', error);
      alert('Failed to create automation');
    }
  };

  if (!isOpen) return null;

  const statusColumns = columns.filter(c => c.type === ColumnType.STATUS);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Zap className="text-purple-600 w-5 h-5 fill-current" />
            </div>
            Board Automations
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* List existing automations */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Active Automations</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : automations.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 text-sm">No automations set up yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map(auto => {
                  const col = columns.find(c => c.id === auto.conditions.column_id);
                  return (
                    <div key={auto.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 shadow-sm">
                       <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                         <Zap size={16} className="text-purple-600 fill-purple-100" />
                       </div>
                       <div className="text-slate-700 text-sm">
                         When <strong className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{col?.title || 'Column'}</strong> changes to <strong className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{auto.conditions.value}</strong>, then <strong className="font-semibold text-purple-700">{auto.action.replace('_', ' ')}</strong>.
                       </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create new automation */}
          {!isCreating ? (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={18} /> Add New Automation
            </button>
          ) : (
            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h3 className="font-semibold text-slate-900 mb-4">New Automation Rule</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-slate-600 text-sm">
                  <span>When</span>
                  <select 
                    value={selectedColumnId}
                    onChange={e => setSelectedColumnId(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer"
                    required
                  >
                    <option value="">Select Column...</option>
                    {statusColumns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <span>changes to</span>
                  <input 
                    type="text" 
                    placeholder="Value (e.g. Done)"
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-40 shadow-sm"
                    required
                  />
                  <span>, then</span>
                  <select 
                    value={action}
                    onChange={e => setAction(e.target.value)}
                    className="p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer font-medium text-purple-700"
                  >
                    <option value="archive_item">Archive Item</option>
                  </select>
                </div>
                
                <div className="flex gap-3 justify-end mt-6 pt-2 border-t border-blue-100">
                  <button 
                    type="button" 
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200/50 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm shadow-blue-600/20 transition-all"
                  >
                    Create Automation
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
