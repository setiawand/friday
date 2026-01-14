import React, { useEffect, useState } from 'react';
import { X, Clock, Activity, User } from 'lucide-react';
import { fetchActivityLogs } from '@/lib/api';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  created_at: string;
  details: any;
}

interface ActivityLogModalProps {
  boardId: string;
  onClose: () => void;
}

export default function ActivityLogModal({ boardId, onClose }: ActivityLogModalProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [boardId]);

  const loadLogs = async () => {
    try {
      const data = await fetchActivityLogs(boardId);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load activity logs', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto transform transition-all scale-100">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="text-blue-600 w-5 h-5" />
            </div>
            Board Activity Log
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-slate-100 rounded-full">
                        <User size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {log.user_id === 'user-1' ? 'You' : log.user_id} 
                          <span className="text-slate-500 font-normal"> {formatAction(log.action)}</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          {log.entity_type === 'item' && log.details?.value && (
                             <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                               Changed to "{log.details.value}"
                             </span>
                          )}
                          {log.entity_type === 'item' && log.action === 'create_item' && (
                             <span className="text-slate-400">New item created</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
