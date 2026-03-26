import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Assessment, Alert, Patient } from '../types';
import { Activity, AlertTriangle, Users, TrendingUp, Clock, ChevronRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';
import { AssessmentDetails } from '../components/AssessmentDetails';

export function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, assessments: 0, alerts: 0 });
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    // Fetch counts
    const fetchStats = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'patients'));
        const aSnap = await getDocs(collection(db, 'assessments'));
        const alSnap = await getDocs(query(collection(db, 'alerts'), where('status', '==', 'active')));
        setStats({
          patients: pSnap.size,
          assessments: aSnap.size,
          alerts: alSnap.size
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'stats');
      }
    };
    fetchStats();

    // Listen for recent assessments
    const q = query(collection(db, 'assessments'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeAssess = onSnapshot(q, (snapshot) => {
      setRecentAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assessments'));

    // Listen for active alerts
    const qAlerts = query(collection(db, 'alerts'), where('status', '==', 'active'), orderBy('timestamp', 'desc'), limit(3));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      setActiveAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'alerts'));

    return () => {
      unsubscribeAssess();
      unsubscribeAlerts();
    };
  }, []);

  const handleAssessmentClick = async (a: Assessment) => {
    setSelectedAssessment(a);
    try {
      const pSnap = await getDocs(query(collection(db, 'patients'), where('__name__', '==', a.patientId)));
      if (!pSnap.empty) {
        setSelectedPatient({ id: pSnap.docs[0].id, ...pSnap.docs[0].data() } as Patient);
      }
    } catch (err) {
      console.error("Error fetching patient for dashboard detail", err);
    }
  };

  const statCards = [
    { label: 'Total Patients', value: stats.patients, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Assessments', value: stats.assessments, icon: Activity, color: 'bg-green-50 text-green-600' },
    { label: 'Active Alerts', value: stats.alerts, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Dashboard</h2>
          <p className="text-[#5A5A40]/60 italic">Overview of community health status</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-4 py-2 rounded-full">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[32px] shadow-sm border border-[#5A5A40]/5 flex items-center gap-4"
          >
            <div className={`p-4 rounded-2xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-[#5A5A40]/40">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assessments */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-[#5A5A40]/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#5A5A40]" />
              Recent Assessments
            </h3>
            <button className="text-sm font-bold text-[#5A5A40] hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentAssessments.length === 0 ? (
              <p className="text-center py-8 text-[#5A5A40]/40 italic">No assessments yet</p>
            ) : (
              recentAssessments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleAssessmentClick(a)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F0]/50 border border-[#5A5A40]/5 hover:border-[#5A5A40]/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#5A5A40]/10 flex items-center justify-center group-hover:bg-white transition-colors">
                      <Activity className="w-5 h-5 text-[#5A5A40]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1a1a1a] capitalize">{a.verdict || a.type.replace('_', ' ')}</p>
                      <p className="text-xs text-[#5A5A40]/60">{formatDate(a.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      a.result.toLowerCase().includes('positive') || a.result.toLowerCase().includes('red') 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {a.result}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#5A5A40]/20 group-hover:text-[#5A5A40] transition-all" />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Active Alerts */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-[#5A5A40]/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Outbreak Alerts
            </h3>
          </div>
          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-100">
                <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-700 font-bold">No active outbreaks</p>
                <p className="text-green-600/60 text-xs italic">Community health is stable</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-2xl bg-red-50 border border-red-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-100 px-2 py-1 rounded">
                      {alert.type}
                    </span>
                    <span className="text-xs text-red-400">{formatDate(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-red-900 font-medium">{alert.message}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                    <Users className="w-3 h-3" />
                    {alert.count} cases in {alert.district}
                  </div>
                </div>
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
