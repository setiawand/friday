'use client';

import React, { useEffect, useState } from 'react';
import { Board, Workspace } from '@/types';
import { fetchBoards, createBoard, fetchWorkspaces, createWorkspace } from '@/lib/api';
import Link from 'next/link';
import { Layout, Plus, MoreHorizontal, Clock, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BoardList() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [boardsData, workspacesData] = await Promise.all([
          fetchBoards(),
          fetchWorkspaces(),
        ]);

        let finalWorkspaces = workspacesData;

        if (!finalWorkspaces || finalWorkspaces.length === 0) {
          const defaultWorkspace = await createWorkspace({
            name: `${user.name}'s Workspace`,
            owner_id: user.id,
            is_active: true,
          });
          finalWorkspaces = [defaultWorkspace];
        }

        setBoards(boardsData);
        setWorkspaces(finalWorkspaces);
      } catch (error) {
        console.error('Failed to load boards or workspaces', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || workspaces.length === 0 || !user) return;

    try {
      // Use first workspace for MVP
      const workspaceId = workspaces[0].id;
      const newBoard = await createBoard({
        name: newBoardName,
        workspace_id: workspaceId,
        created_by: user.id,
        description: 'New board'
      });
      setBoards([...boards, newBoard]);
      setIsCreating(false);
      setNewBoardName('');
    } catch (error) {
      console.error('Failed to create board', error);
      alert('Failed to create board');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Your Boards</h2>
          <p className="text-slate-500 mt-1">Manage your projects and tasks</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
        >
          <Plus size={18} /> New Board
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Create New Board</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Board Name</label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g. Marketing Roadmap"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newBoardName.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
                >
                  Create Board
                </button>
              </div>
            </form>
            {workspaces.length === 0 && (
               <p className="text-sm text-red-500 mt-3 text-center">No workspaces found. Cannot create board.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map(board => (
          <Link 
            href={`/boards/${board.id}`} 
            key={board.id}
            className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col h-48"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Layout size={24} />
              </div>
              <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal size={20} />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              {board.name}
            </h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-auto">
              {board.description || "No description provided."}
            </p>

            <div className="flex items-center text-slate-400 text-xs mt-4 pt-4 border-t border-slate-50">
              <Clock size={14} className="mr-1.5" />
              <span>Updated recently</span>
              <ArrowRight size={14} className="ml-auto transform translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
            </div>
          </Link>
        ))}
        
        {/* Add New Board Card Placeholder */}
        <button
          onClick={() => setIsCreating(true)}
          className="group flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200"
        >
          <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-3">
            <Plus size={24} />
          </div>
          <span className="font-medium text-slate-600 group-hover:text-blue-700">Create New Board</span>
        </button>
      </div>
    </div>
  );
}
