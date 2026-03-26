import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, signOut } from './lib/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientList } from './pages/PatientList';
import { AssessmentPage } from './pages/AssessmentPage';
import { AssessmentHistory } from './pages/AssessmentHistory';
import { AlertList } from './pages/AlertList';
import { LogIn, Heart, Shield, Activity, Users, AlertTriangle, Clock } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5F0]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Heart className="w-12 h-12 text-[#5A5A40] fill-current" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 font-serif">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2">AfyaScan</h1>
          <p className="text-[#5A5A40] italic mb-8">AI-Enabled Health Support for CHVs</p>
          
          <div className="space-y-4 mb-8 text-left text-sm text-[#1a1a1a]/70">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-[#5A5A40] shrink-0" />
              <p>Rapid Malaria RDT analysis using computer vision.</p>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#5A5A40] shrink-0" />
              <p>Malnutrition detection and symptom-based triage.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#5A5A40] shrink-0" />
              <p>Real-time outbreak alerts for district officials.</p>
            </div>
          </div>

          <button
            onClick={signIn}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#4A4A30] transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
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
        {activeTab === 'alerts' && <AlertList key="alerts" />}
      </AnimatePresence>
    </Layout>
  );
}
