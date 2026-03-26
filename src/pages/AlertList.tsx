import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Alert } from '../types';
import { AlertTriangle, CheckCircle, Clock, MapPin, Users, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';

export function AlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');

  useEffect(() => {
    const q = query(collection(db, 'alerts'), where('status', '==', filter), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'alerts'));

    return () => unsubscribe();
  }, [filter]);

  const resolveAlert = async (id: string) => {
    try {
      await updateDoc(doc(db, 'alerts', id), { status: 'resolved' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'alerts');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Outbreak Alerts</h2>
          <p className="text-[#5A5A40]/60 italic">Real-time surveillance monitoring</p>
        </div>
        <div className="flex bg-white p-1 rounded-full shadow-sm border border-[#5A5A40]/10">
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filter === 'active' ? 'bg-red-500 text-white shadow-md' : 'text-[#5A5A40]/40'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filter === 'resolved' ? 'bg-[#5A5A40] text-white shadow-md' : 'text-[#5A5A40]/40'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {alerts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-[#5A5A40]/20">
            <Shield className="w-16 h-16 text-green-500/20 mx-auto mb-4" />
            <p className="text-[#5A5A40]/40 italic">No {filter} alerts found</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-[32px] p-8 shadow-sm border ${
                alert.status === 'active' ? 'border-red-100' : 'border-[#5A5A40]/10'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${alert.status === 'active' ? 'bg-red-50 text-red-500' : 'bg-[#5A5A40]/10 text-[#5A5A40]'}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#1a1a1a]">{alert.type}</h4>
                    <div className="flex items-center gap-3 text-xs text-[#5A5A40]/60 mt-1 italic">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.district}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
                {alert.status === 'active' && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-all"
                    title="Mark as Resolved"
                  >
                    <CheckCircle className="w-6 h-6" />
                  </button>
                )}
              </div>

              <div className="p-6 bg-[#F5F5F0]/50 rounded-2xl border border-[#5A5A40]/5 mb-6">
                <p className="text-[#1a1a1a] leading-relaxed italic">"{alert.message}"</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-4 py-2 rounded-full">
                  <Users className="w-4 h-4" />
                  {alert.count} Cases Detected
                </div>
                <div className="text-xs font-bold text-[#5A5A40]/40 uppercase tracking-widest">
                  Surveillance ID: {alert.id.slice(0, 8)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
