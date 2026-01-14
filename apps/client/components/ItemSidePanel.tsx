
import React, { useState, useEffect, useRef } from 'react';
import { Item, Update, Column, ActivityLog, File as ItemFile } from '@/types';
import { fetchUpdates, createUpdate, fetchItemActivityLogs, fetchFiles, createFile, deleteFile } from '@/lib/api';
import { X, Send, User, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface ItemSidePanelProps {
  item: Item;
  columns: Column[];
  onClose: () => void;
  socket: any;
}

export default function ItemSidePanel({ item, columns, onClose, socket }: ItemSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'updates' | 'files' | 'log'>('updates');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [files, setFiles] = useState<ItemFile[]>([]);
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Load updates on mount
  useEffect(() => {
    loadUpdates();
  }, [item.id]);

  // Load logs when tab changes
  useEffect(() => {
    if (activeTab === 'log') {
      loadLogs();
    }
    if (activeTab === 'files') {
      loadFiles();
    }
  }, [activeTab, item.id]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewUpdate = (newUpdate: Update) => {
      if (newUpdate.item_id === item.id) {
        setUpdates(prev => [newUpdate, ...prev]);
      }
    };

    socket.on('update.created', handleNewUpdate);

    return () => {
      socket.off('update.created', handleNewUpdate);
    };
  }, [socket, item.id]);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      const data = await fetchUpdates(item.id);
      setUpdates(data);
    } catch (error) {
      console.error('Failed to load updates', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const data = await fetchItemActivityLogs(item.board_id, item.id);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      setFilesLoading(true);
      const data = await fetchFiles(item.id);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files', error);
    } finally {
      setFilesLoading(false);
    }
  };

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

  const getItemName = () => {
    const textColumn = columns.find(c => c.type === 'text');
    if (textColumn) {
      const val = item.column_values?.find(cv => cv.column_id === textColumn.id);
      return val?.value || 'Untitled Item';
    }
    return 'Untitled Item';
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
                           {update.user ? update.user.name : `User ${update.user_id}`}
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
                           <span className="font-medium text-slate-700 text-sm">User {log.user_id}</span>
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
