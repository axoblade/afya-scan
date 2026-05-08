import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Assessment, Patient } from '../types';
import { Activity, Users, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate, cn } from '../lib/utils';
import { AssessmentDetails } from '../components/AssessmentDetails';

export function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, assessments: 0 });
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    // Fetch counts
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      try {
        const pSnap = await getDocs(query(collection(db, 'patients'), where('chvId', '==', auth.currentUser.uid)));
        const aSnap = await getDocs(query(collection(db, 'assessments'), where('chvId', '==', auth.currentUser.uid)));
        setStats({
          patients: pSnap.size,
          assessments: aSnap.size
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'stats');
      }
    };
    fetchStats();

    // Listen for recent assessments
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'assessments'), 
      where('chvId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'), 
      limit(5)
    );
    const unsubscribeAssess = onSnapshot(q, (snapshot) => {
      setRecentAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assessments'));

    return () => {
      unsubscribeAssess();
    };
  }, [auth.currentUser]);

  const handleAssessmentClick = async (a: Assessment) => {
    setSelectedAssessment(a);
    if (!a.patientId) return;
    try {
      const pSnap = await getDocs(query(collection(db, 'patients'), where('__name__', '==', a.patientId)));
      if (!pSnap.empty) {
        setSelectedPatient({ id: pSnap.docs[0].id, ...pSnap.docs[0].data() } as Patient);
      }
    } catch (err) {
      console.error("Error fetching patient for dashboard detail:", err);
    }
  };

  const statCards = [
    { label: 'Total Patients', value: stats.patients, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Assessments', value: stats.assessments, icon: Activity, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">Health Overview</h2>
          <p className="text-emerald-600/60 dark:text-emerald-400/60 italic mt-1">Real-time community health monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full shadow-lg shadow-slate-200 dark:shadow-slate-950/20">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl shadow-slate-200 dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-800 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4`}>
              <stat.icon className="w-24 h-24 text-slate-950 dark:text-white" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 dark:text-slate-500 mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-medium text-slate-900 dark:text-white">{stat.value}</p>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Active
              </span>
            </div>
          </motion.div>
        ))}
        {/* Quick Summary Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-emerald-600 to-sky-600 text-white p-6 rounded-[32px] shadow-lg shadow-emerald-600/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h4 className="text-lg font-light">Community Status</h4>
            <p className="text-white/80 text-xs mt-1 font-medium">Status: Stable Network</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="w-8 h-8 rounded-full border-2 border-emerald-500 bg-white/20 flex items-center justify-center text-[10px] font-bold backdrop-blur-sm">
                  {String.fromCharCode(64 + n)}
                </div>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold">CHVs Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Assessments */}
        <section className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-800">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-light text-slate-900 dark:text-white">Recent Diagnostics</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 font-bold">Latest patient interactions</p>
            </div>
            <button className="text-[10px] uppercase tracking-[0.2em] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-4 py-2 rounded-full transition-all">
              View Log
            </button>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentAssessments.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-slate-400 dark:text-slate-500 italic text-lg">No assessment history recorded yet.</p>
              </div>
            ) : (
              recentAssessments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleAssessmentClick(a)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 border border-slate-100 dark:border-slate-700 group-hover:border-sky-500/30 transition-all shadow-lg">
                      <Activity className={cn("w-6 h-6", 
                        a.type === 'symptom_triage'
                          ? (a.urgency === 'high' ? "text-rose-500 dark:text-rose-400" : a.urgency === 'medium' ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400")
                          : (a.result.toLowerCase().includes('positive') || a.result.toLowerCase() === 'red')
                            ? "text-rose-500 dark:text-rose-400" 
                            : (a.result.toLowerCase() === 'yellow' ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400")
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          {a.type === 'rdt' ? (a.rdtType ? `${a.rdtType} Test` : 'Rapid Test') : a.type.replace('_', ' ')}
                        </span>
                        <div className={cn("w-1.5 h-1.5 rounded-full",
                          a.type === 'symptom_triage'
                            ? (a.urgency === 'high' ? 'bg-rose-500 dark:bg-rose-400 animate-pulse' : a.urgency === 'medium' ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-400')
                            : (a.result.toLowerCase().includes('positive') || a.result.toLowerCase() === 'red')
                              ? 'bg-rose-500 dark:bg-rose-400 animate-pulse' 
                              : (a.result.toLowerCase() === 'yellow' ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-400')
                        )} />
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-white leading-tight">
                        {a.verdict || a.result}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1 font-bold">
                          <Clock className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                          {formatDate(a.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-sky-500 group-hover:bg-sky-500/10 transition-all text-slate-300 dark:text-slate-700">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-all" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>


      <AnimatePresence>
        {selectedAssessment && (
          <AssessmentDetails
            assessment={selectedAssessment}
            patient={selectedPatient || undefined}
            onClose={() => {
              setSelectedAssessment(null);
              setSelectedPatient(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
