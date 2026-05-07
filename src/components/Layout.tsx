import { ReactNode, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Home, Users, Activity, LogOut, Heart, Wifi, WifiOff, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSignOut: () => void;
}

export function Layout({ children, user, activeTab, setActiveTab, onSignOut }: LayoutProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'patients', icon: Users, label: 'Patients' },
    { id: 'assess', icon: Activity, label: 'Assess' },
    { id: 'history', icon: Clock, label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-24 font-sans text-slate-50">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-10 shadow-lg shadow-slate-950/20 transition-all duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3 transform transition-transform hover:rotate-0">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none">AfyaScan</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400 mt-1">Community Health</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
              isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Active' : 'Offline'}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-none mb-1">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Volunteer</p>
            </div>
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-emerald-500/20 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onSignOut}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 px-6 py-4 pb-8 z-10 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all min-w-[64px] group",
                  isActive ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
                )}
                aria-label={tab.label}
              >
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-300",
                  isActive ? "bg-emerald-500/10 shadow-lg scale-110" : "bg-transparent group-hover:bg-slate-800"
                )}>
                  <Icon className={cn("w-6 h-6 transition-transform duration-300", isActive && "scale-110")} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
