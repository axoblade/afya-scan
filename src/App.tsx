import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, signOut } from './lib/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { AssessmentPage } from './pages/AssessmentPage';
import { AssessmentHistory } from './pages/AssessmentHistory';
import { LogIn, Heart, Shield, Activity, Users, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-emerald-500/10 border border-slate-800"
        >
          <Heart className="w-16 h-16 text-emerald-500 fill-current" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="max-w-md w-full bg-slate-900 rounded-[48px] p-10 shadow-2xl shadow-slate-950/50 text-center relative z-10 border border-slate-800"
        >
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-[32px] flex items-center justify-center shadow-xl shadow-emerald-500/30 transform rotate-6 scale-110">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">AfyaScan</h1>
          <p className="text-emerald-400/70 text-lg font-medium mb-10 leading-snug">AI-Powered Health Support for CHVs</p>
          
          <div className="space-y-6 mb-10 text-left">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Computer Vision Diagnosis</p>
                <p className="text-slate-400 text-xs">Rapid Malaria RDT & MUAC analysis.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Community Management</p>
                <p className="text-slate-400 text-xs">Structured patient tracking & triage.</p>
              </div>
            </div>
          </div>

          <button
            onClick={signIn}
            className="w-full bg-emerald-500 text-white py-5 rounded-3xl text-base font-bold flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20"
            aria-label="Sign in with Google"
          >
            <LogIn className="w-5 h-5 text-white" />
            Sign in with Google
          </button>

          <p className="mt-8 text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">Secure Healthcare Portal</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={signOut}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
        {activeTab === 'patients' && <PatientList key="patients" />}
        {activeTab === 'assess' && <AssessmentPage key="assess" />}
        {activeTab === 'history' && <AssessmentHistory key="history" />}
      </AnimatePresence>
    </Layout>
  );
}
