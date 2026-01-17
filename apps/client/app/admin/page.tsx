'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Workspace, User, Team, TeamMember } from '@/types';
import { fetchWorkspaces, createWorkspace, fetchAuditLogs, updateWorkspace, fetchUsers, updateUser, register, fetchTeams, createTeam, fetchTeamMembers, addTeamMember, removeTeamMember, deleteTeam } from '@/lib/api';
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
  const [teamsByWorkspace, setTeamsByWorkspace] = useState<Record<string, Team[]>>({});
  const [teamMembersByTeam, setTeamMembersByTeam] = useState<Record<string, TeamMember[]>>({});
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

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

  useEffect(() => {
    if (!loadingWorkspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [loadingWorkspaces, workspaces, selectedWorkspaceId]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadTeamsForWorkspace(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

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

  const loadTeamsForWorkspace = async (workspaceId: string) => {
    try {
      setLoadingTeams(true);
      const data: Team[] = await fetchTeams(workspaceId);
      setTeamsByWorkspace(prev => ({ ...prev, [workspaceId]: data }));
    } catch (e) {
      console.error('Failed to load teams', e);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadMembersForTeam = async (workspaceId: string, teamId: string) => {
    try {
      setLoadingTeamMembers(true);
      const data: TeamMember[] = await fetchTeamMembers(workspaceId, teamId);
      setTeamMembersByTeam(prev => ({ ...prev, [teamId]: data }));
    } catch (e) {
      console.error('Failed to load team members', e);
    } finally {
      setLoadingTeamMembers(false);
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || !newTeamName.trim()) return;
    try {
      const created = await createTeam(selectedWorkspaceId, newTeamName.trim());
      setTeamsByWorkspace(prev => ({
        ...prev,
        [selectedWorkspaceId]: [...(prev[selectedWorkspaceId] || []), created],
      }));
      setNewTeamName('');
    } catch (e) {
      console.error('Failed to create team', e);
    }
  };

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    if (selectedWorkspaceId) {
      loadMembersForTeam(selectedWorkspaceId, teamId);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || !selectedTeamId || !newMemberUserId) return;
    try {
      const member = await addTeamMember(selectedWorkspaceId, selectedTeamId, newMemberUserId, newMemberRole || 'member');
      setTeamMembersByTeam(prev => {
        const existing = prev[selectedTeamId] || [];
        const withoutDup = existing.filter(m => m.user_id !== member.user_id);
        return { ...prev, [selectedTeamId]: [...withoutDup, member] };
      });
      setNewMemberUserId('');
      setNewMemberRole('');
    } catch (e) {
      console.error('Failed to add team member', e);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!selectedWorkspaceId || !selectedTeamId) return;
    try {
      await removeTeamMember(selectedWorkspaceId, selectedTeamId, memberId);
      setTeamMembersByTeam(prev => {
        const existing = prev[selectedTeamId] || [];
        return {
          ...prev,
          [selectedTeamId]: existing.filter(m => m.id !== memberId),
        };
      });
    } catch (e) {
      console.error('Failed to remove team member', e);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedWorkspaceId || !selectedTeamId) return;
    try {
      await deleteTeam(selectedWorkspaceId, selectedTeamId);
      setTeamsByWorkspace(prev => {
        const teams = prev[selectedWorkspaceId] || [];
        return {
          ...prev,
          [selectedWorkspaceId]: teams.filter(t => t.id !== selectedTeamId),
        };
      });
      setTeamMembersByTeam(prev => {
        const updated = { ...prev };
        delete updated[selectedTeamId];
        return updated;
      });
      setSelectedTeamId(null);
    } catch (e) {
      console.error('Failed to delete team', e);
    }
  };

  const teamsForSelectedWorkspace: Team[] = useMemo(() => {
    if (!selectedWorkspaceId) return [];
    return teamsByWorkspace[selectedWorkspaceId] || [];
  }, [selectedWorkspaceId, teamsByWorkspace]);

  const selectedTeamMembers: TeamMember[] = useMemo(() => {
    if (!selectedTeamId) return [];
    return teamMembersByTeam[selectedTeamId] || [];
  }, [selectedTeamId, teamMembersByTeam]);

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
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
            <p className="text-sm text-slate-500 mt-1">
              Workspace management and account-level audit logs.
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
              Workspaces
            </h2>

            <form onSubmit={handleCreateOrg} className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                placeholder="New workspace name"
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
              <div className="text-sm text-slate-400">Loading workspaces...</div>
            ) : workspaces.length === 0 ? (
              <div className="text-sm text-slate-400">No workspaces yet.</div>
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
            Teams
          </h2>

          {workspaces.length === 0 ? (
            <div className="text-sm text-slate-400">
              Create a workspace first to start adding teams.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Workspace</span>
                  <select
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    value={selectedWorkspaceId || ''}
                    onChange={(e) => {
                      const id = e.target.value || null;
                      setSelectedWorkspaceId(id);
                      setSelectedTeamId(null);
                      if (id) {
                        loadTeamsForWorkspace(id);
                      }
                    }}
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>
                <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="New team name (e.g. Sales / Enterprise)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!selectedWorkspaceId || !newTeamName.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add team
                  </button>
                </form>
              </div>

              {(!selectedWorkspaceId || loadingTeams) && (
                <div className="text-sm text-slate-400">Loading teams...</div>
              )}

              {selectedWorkspaceId && !loadingTeams && teamsForSelectedWorkspace.length === 0 && (
                <div className="text-sm text-slate-400">
                  No teams yet in this workspace. Use the form above to create one.
                </div>
              )}

              {selectedWorkspaceId && teamsForSelectedWorkspace.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Teams in workspace
                    </div>
                    <div className="space-y-2">
                      {teamsForSelectedWorkspace.map(team => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => handleSelectTeam(team.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                            selectedTeamId === team.id
                              ? 'border-blue-500 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate">{team.name}</span>
                        </button>
                      ))}
                    </div>
                    {selectedTeamId && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleDeleteTeam}
                          className="text-xs px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Delete selected team
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Team members
                    </div>
                    {!selectedTeamId ? (
                      <div className="text-sm text-slate-400">
                        Select a team to view and manage its members.
                      </div>
                    ) : (
                      <>
                        <form onSubmit={handleAddTeamMember} className="mb-3 space-y-3">
                          <div className="text-xs text-slate-500">
                            Choose a user and optionally give them a role label in this team.
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <div className="mb-1 text-xs font-medium text-slate-500">
                                User
                              </div>
                              <select
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                value={newMemberUserId}
                                onChange={(e) => setNewMemberUserId(e.target.value)}
                              >
                                <option value="">Select user to add</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-medium text-slate-500">
                                  Role label
                                </div>
                                <div className="text-[10px] uppercase tracking-wide text-slate-400">
                                  Optional
                                </div>
                              </div>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                placeholder="e.g. member, lead, manager"
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value)}
                              />
                            </div>
                            <div className="sm:self-end">
                              <button
                                type="submit"
                                disabled={!newMemberUserId}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                              >
                                Add to team
                              </button>
                            </div>
                          </div>
                        </form>

                        {loadingTeamMembers && (
                          <div className="text-sm text-slate-400">Loading team members...</div>
                        )}

                        {!loadingTeamMembers && selectedTeamMembers.length === 0 && (
                          <div className="text-sm text-slate-400">
                            No members in this team yet.
                          </div>
                        )}

                        {!loadingTeamMembers && selectedTeamMembers.length > 0 && (
                          <div className="space-y-1">
                            {selectedTeamMembers.map(m => {
                              const memberUser = users.find(u => u.id === m.user_id) || m.user;
                              return (
                                <div
                                  key={m.id}
                                  className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                                >
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {memberUser ? memberUser.name : m.user_id}
                                    </div>
                                    {memberUser && (
                                      <div className="text-xs text-slate-500">
                                        {memberUser.email}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 rounded-full border border-slate-300 bg-white text-slate-700">
                                      {m.role || 'member'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTeamMember(m.id)}
                                      className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
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
