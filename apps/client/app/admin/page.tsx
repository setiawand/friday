'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Workspace, User } from '@/types';
import { fetchWorkspaces, createWorkspace, fetchAuditLogs, updateWorkspace, fetchUsers, updateUser, register } from '@/lib/api';
import Link from 'next/link';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [newOrgName, setNewOrgName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!user.is_admin && user.email !== 'admin@friday.app') {
        router.push('/');
        return;
      }
      loadWorkspaces();
      loadLogs();
      loadUsers();
    }
  }, [user, isLoading, router]);

  const loadWorkspaces = async () => {
    try {
      setLoadingWorkspaces(true);
      const data = await fetchWorkspaces();
      setWorkspaces(data);
    } catch (e) {
      console.error('Failed to load workspaces', e);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !user) return;
    try {
      const ws = await createWorkspace({
        name: newOrgName.trim(),
        owner_id: user.id,
        is_active: true,
      });
      setWorkspaces(prev => [...prev, ws]);
      setNewOrgName('');
      loadLogs();
    } catch (e) {
      console.error('Failed to create workspace', e);
    }
  };

  const handleToggleOrgActive = async (workspace: Workspace) => {
    try {
      const updated = await updateWorkspace(workspace.id, {
        is_active: !workspace.is_active,
      });
      setWorkspaces(prev =>
        prev.map(ws => (ws.id === workspace.id ? updated : ws)),
      );
      loadLogs();
    } catch (e) {
      console.error('Failed to update workspace', e);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleAdmin = async (target: User) => {
    try {
      const updated = await updateUser(target.id, { is_admin: !target.is_admin });
      setUsers(prev => prev.map(u => (u.id === target.id ? updated : u)));
    } catch (e) {
      console.error('Failed to update user', e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
    try {
      setCreatingUser(true);
      await register({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      loadUsers();
    } catch (err) {
      console.error('Failed to create user', err);
    } finally {
      setCreatingUser(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
            <p className="text-sm text-slate-500 mt-1">
              Organization management and account-level audit logs.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Organizations
            </h2>

            <form onSubmit={handleCreateOrg} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New organization name"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={!newOrgName.trim()}
              >
                Create
              </button>
            </form>

            {loadingWorkspaces ? (
              <div className="text-sm text-slate-400">Loading organizations...</div>
            ) : workspaces.length === 0 ? (
              <div className="text-sm text-slate-400">No organizations yet.</div>
            ) : (
              <div className="space-y-2">
                {workspaces.map(ws => (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {ws.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {ws.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-500">
                        {ws.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleOrgActive(ws)}
                        className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        {ws.is_active ? 'Set inactive' : 'Set active'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Audit Logs
            </h2>
            {loadingLogs ? (
              <div className="text-sm text-slate-400">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-sm text-slate-400">No audit logs yet.</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                  >
                    <div className="flex justify-between">
                      <div className="font-medium text-slate-900">
                        {log.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {log.entity_type} {log.entity_id}
                      {log.user_id ? ` • by ${log.user_id}` : ' • by system'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Users & Roles
          </h2>
          <form onSubmit={handleCreateUser} className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Full name"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Temporary password"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={
                !newUserName.trim() ||
                !newUserEmail.trim() ||
                !newUserPassword.trim() ||
                creatingUser
              }
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {creatingUser ? 'Creating...' : 'Create user'}
            </button>
          </form>
          {loadingUsers ? (
            <div className="text-sm text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-slate-400">No users yet.</div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {u.name} {u.id === user.id ? '(you)' : ''}
                    </div>
                    <div className="text-xs text-slate-500">
                      {u.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full border border-slate-300 text-slate-700 bg-white">
                      {u.is_admin ? 'Admin' : 'Member'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAdmin(u)}
                      disabled={u.id === user.id}
                      className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {u.is_admin ? 'Revoke admin' : 'Make admin'}
                    </button>
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
