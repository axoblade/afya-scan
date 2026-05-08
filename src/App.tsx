import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, signOut } from './lib/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { AssessmentPage } from './pages/AssessmentPage';
import { AssessmentHistory } from './pages/AssessmentHistory';
import { LandingPage } from './pages/LandingPage';
import { LegalPages, LegalPageType } from './pages/LegalPages';
import { LogIn, Heart, Shield, Activity, Users, Clock, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPageType | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-emerald-500/10 border border-slate-100 dark:border-slate-800"
        >
          <Heart className="w-16 h-16 text-emerald-500 fill-current" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    if (legalPage) {
      return <LegalPages type={legalPage} onClose={() => setLegalPage(null)} />;
    }

    if (!showLogin) {
      return <LandingPage onSignIn={() => setShowLogin(true)} onLegalClick={(type) => setLegalPage(type)} />;
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-6 left-6 z-50">
          <button 
            onClick={() => setShowLogin(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-3xl" />

          <div className="flex-1 flex flex-col justify-center space-y-12 max-w-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="flex justify-center"
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform rotate-6 scale-110">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <div className="text-center space-y-4">
              <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">AfyaScan</h1>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl uppercase tracking-widest">Village AI Diagnostic Portal</p>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left space-y-5 shadow-inner">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  AfyaScan empowers <strong className="text-slate-900 dark:text-slate-200">Community Health Volunteers (CHVs)</strong> with clinical-grade AI tools to bridge the diagnostic gap in remote regions.
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Computer Vision</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Malaria & HIV RDT Analysis</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Nutritional Screening</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">AI MUAC Estimation</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-50 dark:bg-sky-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Voice Triage</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Multi-lingual Symptom Parsing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <button
                onClick={signIn}
                className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] text-lg font-black flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-[0.98] shadow-2xl shadow-emerald-500/20 group"
              >
                <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                Sign in with Google
              </button>
              
              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black">Authorized Personnel Only</p>
                <a 
                  href="https://axoblade.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-emerald-500 transition-colors font-medium flex items-center gap-1 opacity-60 hover:opacity-100"
                >
                  built with love by <span className="font-bold border-b border-slate-300 dark:border-slate-700">Axoblade</span>
                </a>
              </div>
            </div>
          </div>
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
