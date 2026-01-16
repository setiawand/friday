'use client';

import React, { useEffect, useState } from 'react';
import { fetchDashboardStats, fetchUsers } from '@/lib/api';
import type { User } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, LayoutDashboard, CheckCircle, List, Layers } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchUsers()])
      .then(([statsResult, usersResult]) => {
        setStats(statsResult);
        setUsers(usersResult);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Transform data for Recharts
  const data = stats?.statusCounts 
    ? Object.entries(stats.statusCounts).map(([name, value]) => ({ name, value }))
    : [];
    
  // Sort by value desc
  data.sort((a, b) => (b.value as number) - (a.value as number));

  const TASK_TYPE_LABELS: Record<string, string> = {
    feature: 'Feature',
    bugfix: 'Bug Fix',
    chore: 'Chore',
    research: 'Research',
    meeting: 'Meeting',
  };

  const workloadData = stats?.taskTypeCounts
    ? Object.entries(stats.taskTypeCounts).map(([key, value]) => ({
        name: TASK_TYPE_LABELS[key] || key,
        value,
      }))
    : [];

  workloadData.sort((a, b) => (b.value as number) - (a.value as number));

  const personWorkloadData = stats?.personWorkload
    ? Object.entries(stats.personWorkload).map(([userId, value]) => {
        const match = users.find((u) => u.id === userId);
        const name = match ? match.name : `User ${userId.slice(0, 6)}`;
        return { name, value };
      })
    : [];

  personWorkloadData.sort((a, b) => (b.value as number) - (a.value as number));

  const getStatusColor = (name: string) => {
      switch (name) {
        case 'Done': return '#00c875';
        case 'In Progress': return '#fdab3d';
        case 'Stuck': return '#e2445c';
        case 'To Do': return '#c4c4c4'; 
        default: return '#579bfc';
      }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors" title="Back to Home">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xl">
             <LayoutDashboard className="text-blue-600" />
             Global Dashboard
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 mb-2">
                    <List size={20} />
                    <span className="font-medium">Total Items</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{stats?.totalItems || 0}</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 mb-2">
                    <Layers size={20} />
                    <span className="font-medium">Total Boards</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{stats?.totalBoards || 0}</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 mb-2">
                    <CheckCircle size={20} />
                    <span className="font-medium">Completion Rate</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    {stats?.totalItems ? Math.round(((stats.statusCounts?.['Done'] || 0) / stats.totalItems) * 100) : 0}%
                </div>
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Items by Status</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Items by Task Type</h3>
              {workloadData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No task types set yet. Assign task types to items to see workload.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
        </div>

        {/* Workload by Person */}
        <div className="mt-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Workload by Person</h3>
            {personWorkloadData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No assignees yet. Set assignees on items to see workload by person.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personWorkloadData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
