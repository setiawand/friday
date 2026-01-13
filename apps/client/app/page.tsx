import BoardList from "@/components/BoardList";
import { Search, Bell, User, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Zap className="text-white w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Friday</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-1.5 text-sm bg-slate-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all w-64"
                />
              </div>
              
              <button className="text-slate-500 hover:text-slate-700 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs cursor-pointer ring-2 ring-transparent hover:ring-blue-200 transition-all">
                DS
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Deni! 👋</h1>
          <p className="text-slate-500">Here's what's happening in your workspace today.</p>
        </div>

        {/* Board List */}
        <BoardList />
      </div>
    </main>
  );
}
