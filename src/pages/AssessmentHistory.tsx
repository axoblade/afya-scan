import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Assessment, Patient } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Activity, Shield, AlertTriangle, ChevronRight, Filter, Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { AssessmentDetails } from '../components/AssessmentDetails';
import { cn } from '../lib/utils';

export function AssessmentHistory() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'rdt' | 'muac' | 'symptom_triage'>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'assessments'), 
      where('chvId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assessmentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
      setAssessments(assessmentData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assessments'));

    return () => unsubscribe();
  }, [auth.currentUser]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'patients'),
      where('chvId', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData: Record<string, Patient> = {};
      snapshot.forEach(doc => {
        newData[doc.id] = { id: doc.id, ...doc.data() } as Patient;
      });
      setPatients(newData);
      setPatientsLoaded(true);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'patients');
      setPatientsLoaded(true);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const filteredAssessments = assessments.filter(a => {
    const isSelf = a.patientId === auth.currentUser?.uid;
    const name = isSelf ? (auth.currentUser?.displayName || 'Self') : (patients[a.patientId]?.name || '');
    const patientName = name.toLowerCase();
    const matchesSearch = patientName.includes(search.toLowerCase()) || 
                          (a.verdict || a.result).toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.type === filter;
    return matchesSearch && matchesFilter;
  });

  const safeFormatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy · hh:mm a');
    } catch {
      return 'Invalid Date';
    }
  };

  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'rdt': return Shield;
      case 'muac': return Activity;
      case 'symptom_triage': return AlertTriangle;
      default: return Activity;
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Diagnostic Logs</h2>
          <p className="text-emerald-600/60 dark:text-emerald-400/60 font-medium">Review community assessment history</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none pr-4 py-2 uppercase tracking-widest cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Logs</option>
              <option value="rdt" className="bg-white dark:bg-slate-900">Rapid Tests</option>
              <option value="muac" className="bg-white dark:bg-slate-900">MUAC Stats</option>
              <option value="symptom_triage" className="bg-white dark:bg-slate-900">AI Triage</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors" />
        <input
          type="text"
          placeholder="Search by patient or diagnostic result..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl shadow-slate-100 dark:shadow-slate-950/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paginatedAssessments.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800 italic">
            <Clock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-400 dark:text-slate-500 font-medium">No assessment history found</p>
          </div>
        ) : (
          paginatedAssessments.map((a) => {
            const Icon = getIcon(a.type);
            const isSelf = a.patientId === auth.currentUser?.uid;
            const patientName = isSelf 
              ? (auth.currentUser?.displayName || 'Volunteer (Self)') 
              : (patients[a.patientId]?.name || (patientsLoaded ? 'Unknown Patient' : 'Loading...'));
            
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedAssessment(a)}
                className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-xl shadow-slate-200 dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-colors shadow-lg border shrink-0",
                    a.type === 'rdt' 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/20" 
                      : a.type === 'muac' 
                        ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/20" 
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/20"
                  )}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate">{patientName}</h4>
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-100 dark:border-slate-700 whitespace-nowrap">
                        {a.type === 'rdt' ? (a.rdtType || 'RDT') : a.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded-lg whitespace-nowrap">
                        <Calendar className="w-3 h-3 text-sky-500 dark:text-sky-400" /> {safeFormatDate(a.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <p className={cn("text-base sm:text-lg font-bold tracking-tight", 
                      a.type === 'symptom_triage'
                        ? (a.urgency === 'high' ? "text-rose-500 dark:text-rose-400" : a.urgency === 'medium' ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400")
                        : (a.verdict || a.result || '').toLowerCase().includes('positive') || (a.result || '').toLowerCase() === 'red'
                          ? "text-rose-500 dark:text-rose-400" 
                          : (a.result || '').toLowerCase() === 'yellow' ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {a.verdict || a.result}
                    </p>
                    <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">Observation</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:border-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all text-slate-300 dark:text-slate-700 shrink-0">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-lg"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl text-xs font-bold transition-all",
                  currentPage === page 
                    ? "bg-emerald-500 text-white shadow-lg" 
                    : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedAssessment && (
          <AssessmentDetails
            assessment={selectedAssessment}
            patient={selectedAssessment.patientId === auth.currentUser?.uid 
              ? { 
                  name: auth.currentUser?.displayName || 'Volunteer (Self)', 
                  age: 0, 
                  gender: 'other' as any, 
                  id: auth.currentUser?.uid,
                  district: selectedAssessment.district,
                  residence: 'Self'
                } as Patient 
              : patients[selectedAssessment.patientId]
            }
            onClose={() => setSelectedAssessment(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
