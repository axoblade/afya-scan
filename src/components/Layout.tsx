import { ReactNode, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Home, Users, Activity, AlertTriangle, LogOut, Heart, Wifi, WifiOff, Clock } from 'lucide-react';
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
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-24 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#5A5A40]/10 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#5A5A40] fill-current" />
            <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">AfyaScan</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
              isOnline ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#1a1a1a]">{user.displayName}</p>
              <p className="text-xs text-[#5A5A40]/60 italic">CHV Volunteer</p>
            </div>
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-[#5A5A40]/20"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onSignOut}
              className="p-2 text-[#5A5A40]/60 hover:text-[#5A5A40] transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#5A5A40]/10 px-6 py-4 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all min-w-[64px]",
                  isActive ? "text-[#5A5A40]" : "text-[#5A5A40]/40"
                )}
                aria-label={tab.label}
              >
                <div className={cn(
                  "p-3 rounded-2xl transition-all",
                  isActive ? "bg-[#5A5A40]/10" : "bg-transparent"
                )}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-xs uppercase tracking-widest font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
