
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Item, Update, Column, ActivityLog, File as ItemFile, TimeLog, User as AppUser } from '@/types';
import { fetchUpdates, createUpdate, fetchItemActivityLogs, fetchFiles, createFile, deleteFile, fetchTimeLogs, startTimer, stopTimer, updateItem } from '@/lib/api';
import { X, Send, User, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface ItemSidePanelProps {
  item: Item;
  columns: Column[];
  onClose: () => void;
  socket: any;
  users: AppUser[];
}

export default function ItemSidePanel({ item, columns, onClose, socket, users }: ItemSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'updates' | 'files' | 'time' | 'log'>('updates');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [files, setFiles] = useState<ItemFile[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [timerProcessing, setTimerProcessing] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [description, setDescription] = useState(item.description || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    setDescription(item.description || '');
  }, [item.description]);

  const handleSaveDescription = async () => {
    if (description === item.description) return;
    if (!user) return;
    try {
      await updateItem(item.id, { description, user_id: user.id });
    } catch (error) {
      console.error('Failed to save description', error);
    }
  };

  const loadUpdates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUpdates(item.id);
      const enriched = user
        ? data.map(u =>
            !u.user && u.user_id === user.id
              ? { ...u, user }
              : u,
          )
        : data;
      setUpdates(enriched);
    } catch (error) {
      console.error('Failed to load updates', error);
    } finally {
      setLoading(false);
    }
  }, [item.id, user]);

  const loadLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const data = await fetchItemActivityLogs(item.board_id, item.id);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs', error);
    } finally {
      setLogsLoading(false);
    }
  }, [item.board_id, item.id]);

  const loadFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      const data = await fetchFiles(item.id);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files', error);
    } finally {
      setFilesLoading(false);
    }
  }, [item.id]);

  const loadTimeLogs = useCallback(async () => {
    try {
      setTimeLoading(true);
      const data = await fetchTimeLogs(item.id);
      setTimeLogs(data);
    } catch (error) {
      console.error('Failed to load time logs', error);
    } finally {
      setTimeLoading(false);
    }
  }, [item.id]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  useEffect(() => {
    if (activeTab === 'log') {
      loadLogs();
    }
    if (activeTab === 'files') {
      loadFiles();
    }
    if (activeTab === 'time') {
      loadTimeLogs();
    }
  }, [activeTab, loadLogs, loadFiles, loadTimeLogs]);

  useEffect(() => {
    if (!socket) return;

    const handleNewUpdate = (newUpdate: Update) => {
      if (newUpdate.item_id === item.id) {
        const enriched = user && !newUpdate.user && newUpdate.user_id === user.id
          ? { ...newUpdate, user }
          : newUpdate;
        setUpdates(prev => [enriched, ...prev]);
      }
    };

    socket.on('update.created', handleNewUpdate);

    return () => {
      socket.off('update.created', handleNewUpdate);
    };
  }, [socket, item.id, user]);

  const handleSendUpdate = async () => {
    if (!newUpdateContent.trim() || !user) return;
    try {
      await createUpdate(item.id, newUpdateContent, user.id);
      setNewUpdateContent('');
      // Optimistic update is handled by socket
    } catch (error) {
      console.error('Failed to send update', error);
    }
  };

  const handleAddFile = async () => {
    if (!newFileName || !newFileUrl || !user) return;
    try {
      const file = await createFile(item.id, {
        name: newFileName,
        url: newFileUrl,
        type: 'link',
        user_id: user.id
      });
      setFiles(prev => [file, ...prev]);
      setIsAddingFile(false);
      setNewFileName('');
      setNewFileUrl('');
    } catch (error) {
      console.error('Failed to add file', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to remove this file?')) return;
    try {
      await deleteFile(item.id, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file', error);
    }
  };

  const getItemDisplayName = (target: Item) => {
    const textColumn = columns.find(c => c.type === 'text');
    if (textColumn) {
      const val = target.column_values?.find(cv => cv.column_id === textColumn.id);
      return val?.value || 'Untitled Item';
    }
    return 'Untitled Item';
  };

  const getItemName = () => {
    return getItemDisplayName(item);
  };

  const formatLogAction = (log: ActivityLog) => {
    switch (log.action) {
      case 'create_item': return 'Created this item';
      case 'update_value': 
        const col = columns.find(c => c.id === log.details?.column_id);
        const val = log.details?.value;
        // Simple value formatting
        let displayValue = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (displayValue.length > 30) displayValue = displayValue.substring(0, 30) + '...';
        return `Updated ${col?.title || 'column'} to "${displayValue}"`;
      case 'archive_item': return 'Archived this item';
      default: return log.action.replace(/_/g, ' ');
    }
  };

  const getLogUserLabel = (log: ActivityLog) => {
    if (user && log.user_id === user.id) {
      return 'You';
    }
    const match = users.find(u => u.id === log.user_id);
    if (match) {
      return match.name;
    }
    return `User ${log.user_id}`;
  };

  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleStartTimer = async () => {
    if (!user) return;
    try {
      setTimerProcessing(true);
      await startTimer(item.id, user.id);
      await loadTimeLogs();
    } catch (error) {
      console.error('Failed to start timer', error);
    } finally {
      setTimerProcessing(false);
    }
  };

  const handleStopTimer = async () => {
    if (!user) return;
    try {
      setTimerProcessing(true);
      await stopTimer(item.id, user.id);
      await loadTimeLogs();
    } catch (error) {
      console.error('Failed to stop timer', error);
    } finally {
      setTimerProcessing(false);
    }
  };

  const activeTimeLogForUser = user
    ? timeLogs.find(log => log.is_running && log.user_id === user.id)
    : undefined;

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{getItemName()}</h2>
          <p className="text-sm text-slate-500 mt-1">Item Details & Updates</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Description */}
      <div className="px-6 py-4 bg-white border-b border-slate-100">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleSaveDescription}
          placeholder="Add a detailed description..."
          className="w-full min-h-[60px] p-2 text-sm text-slate-700 placeholder:text-slate-400 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md focus:outline-none resize-none transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-200 bg-white">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('updates')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'updates' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Updates
            <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
              {updates.length}
            </span>
          </button>
          <button 
             onClick={() => setActiveTab('files')}
             className={`py-3 text-sm font-medium border-b-2 transition-colors ${
               activeTab === 'files' 
                 ? 'border-blue-500 text-blue-600' 
                 : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
          >
            Files
          </button>
          <button 
            onClick={() => setActiveTab('time')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'time' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Time
          </button>
          <button 
             onClick={() => setActiveTab('log')}
             className={`py-3 text-sm font-medium border-b-2 transition-colors ${
               activeTab === 'log' 
                 ? 'border-blue-500 text-blue-600' 
                 : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
          >
            Activity Log
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {activeTab === 'updates' && (
          <div className="space-y-6">
            {/* Input Area */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <textarea
                value={newUpdateContent}
                onChange={(e) => setNewUpdateContent(e.target.value)}
                placeholder="Write an update..."
                className="w-full min-h-[80px] p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendUpdate();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                 <div className="text-xs text-slate-400">Press Enter to send</div>
                 <button
                   onClick={handleSendUpdate}
                   disabled={!newUpdateContent.trim()}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Send className="w-3 h-3" />
                   Update
                 </button>
              </div>
            </div>

            {/* Updates List */}
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading updates...</div>
            ) : updates.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Send className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No updates yet</p>
                <p className="text-sm text-slate-400 mt-1">Write the first update above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map(update => (
                  <div key={update.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                         {update.user_id.charAt(0).toUpperCase()}
                       </div>
                       <div>
                        <div className="text-sm font-medium text-slate-800">
                           {update.user
                             ? update.user.name
                             : user && update.user_id === user.id
                               ? 'You'
                               : `User ${update.user_id}`}
                        </div>
                         <div className="text-xs text-slate-400">
                           {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                         </div>
                       </div>
                    </div>
                    <div className="p-4 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {update.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Add File Button */}
            {!isAddingFile ? (
              <button 
                onClick={() => setIsAddingFile(true)}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Add File Link
              </button>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <input
                  type="text"
                  placeholder="File Name (e.g., Project Specs)"
                  className="w-full p-2 border border-slate-200 rounded text-sm"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                />
                <input
                  type="url"
                  placeholder="File URL (e.g., https://...)"
                  className="w-full p-2 border border-slate-200 rounded text-sm"
                  value={newFileUrl}
                  onChange={e => setNewFileUrl(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setIsAddingFile(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddFile}
                    disabled={!newFileName || !newFileUrl}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            )}

            {/* Files List */}
            {filesLoading ? (
              <div className="text-center py-8 text-slate-400">Loading files...</div>
            ) : files.length === 0 && !isAddingFile ? (
              <div className="text-center py-12 text-slate-400">
                <p>No files attached</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map(file => (
                  <div key={file.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow flex items-center justify-between group">
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 hover:underline truncate block">
                            {file.name}
                          </a>
                          <div className="text-xs text-slate-400">
                            Added by {file.user?.name || 'User'} • {formatDistanceToNow(new Date(file.created_at))} ago
                          </div>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleDeleteFile(file.id)}
                       className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && (
           <div className="space-y-4">
             {logsLoading ? (
               <div className="text-center py-8 text-slate-400">Loading activity...</div>
             ) : logs.length === 0 ? (
               <div className="text-center py-12 text-slate-400">
                 <p>No activity yet</p>
               </div>
             ) : (
               logs.map(log => (
                 <div key={log.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex gap-3">
                       <div className="mt-1">
                         <Activity className="w-4 h-4 text-slate-400" />
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                           <span className="font-medium text-slate-700 text-sm">{getLogUserLabel(log)}</span>
                           <span className="text-slate-400 text-xs">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                         </div>
                         <div className="text-slate-600 text-sm mt-0.5">
                           {formatLogAction(log)}
                         </div>
                       </div>
                    </div>
                 </div>
               ))
             )}
           </div>
        )}
        {activeTab === 'time' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">
                  Time tracking
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {activeTimeLogForUser
                    ? `Running since ${formatDistanceToNow(new Date(activeTimeLogForUser.start_time), { addSuffix: true })}`
                    : 'No active timer'}
                </div>
              </div>
              {activeTimeLogForUser ? (
                <button
                  onClick={handleStopTimer}
                  disabled={timerProcessing}
                  className="px-4 py-1.5 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleStartTimer}
                  disabled={timerProcessing || !user}
                  className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Start
                </button>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              {timeLoading ? (
                <div className="text-center py-6 text-slate-400">
                  Loading time logs...
                </div>
              ) : timeLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  No time logs yet
                </div>
              ) : (
                <div className="space-y-3">
                  {timeLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium text-slate-800">
                          {log.user?.name || `User ${log.user_id}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(log.start_time).toLocaleString()}
                          {log.end_time && (
                            <> → {new Date(log.end_time).toLocaleString()}</>
                          )}
                          {!log.end_time && log.is_running && (
                            <> • running</>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {log.end_time || !log.is_running
                          ? formatDuration(log.duration_seconds)
                          : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fix missing icon import
function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
