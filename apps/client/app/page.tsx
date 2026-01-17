'use client';

import BoardList from "@/components/BoardList";
import NotificationsPopover from "@/components/NotificationsPopover";
import { Search, User, Zap, LayoutDashboard, Shield, Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Zap className="text-white w-5 h-5 fill-current" />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">Friday</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Link 
                  href="/dashboards" 
                  className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md font-medium text-sm transition-all"
                >
                  <LayoutDashboard size={18} />
                  Dashboards
                </Link>

                {(user.is_admin || user.email === 'admin@friday.app') && (
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md font-medium text-sm transition-all"
                  >
                    <Shield size={18} />
                    Admin
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-1.5 text-sm bg-slate-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all w-64"
                />
              </div>

              <button
                type="button"
                className="md:hidden p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} />
              </button>
              
              <NotificationsPopover />
              
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs cursor-pointer ring-2 ring-transparent hover:ring-blue-200 transition-all"
                style={{ backgroundColor: user.color }}
              >
                {getInitials(user.name)}
              </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 pb-3">
              <div className="pt-2 flex flex-col gap-1">
                <Link
                  href="/dashboards"
                  className="flex items-center gap-2 px-2 py-2 text-slate-700 hover:bg-slate-100 rounded-md text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboards</span>
                </Link>
                {(user.is_admin || user.email === 'admin@friday.app') && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-2 py-2 text-slate-700 hover:bg-slate-100 rounded-md text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield size={18} />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {user.name}! 👋</h1>
          <p className="text-slate-500">Here&apos;s what&apos;s happening in your workspace today.</p>
        </div>

        {/* Board List */}
        <BoardList />
      </div>
    </main>
  );
}
