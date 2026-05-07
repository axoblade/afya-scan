import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Patient, Assessment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Activity, Shield, AlertTriangle, ChevronRight, User, Heart, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { AssessmentDetails } from './AssessmentDetails';

interface PatientDetailsProps {
  patient: Patient;
  onClose: () => void;
}

export function PatientDetails({ patient, onClose }: PatientDetailsProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'assessments'),
      where('patientId', '==', patient.id),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assessments'));

    return () => unsubscribe();
  }, [patient.id]);

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'rdt': return Shield;
      case 'muac': return Activity;
      case 'symptom_triage': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-800"
      >
        <div className="p-8 border-b border-slate-800 bg-slate-950">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-emerald-400 font-bold text-3xl shadow-xl">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white tracking-tight uppercase">{patient.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> {patient.age} years</span>
                  <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800"><User className="w-3.5 h-3.5 text-emerald-400" /> {patient.gender}</span>
                  <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {patient.district}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-900 rounded-full transition-all text-slate-500 hover:text-rose-500">
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800/50 space-y-1 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-emerald-500 to-transparent rounded-bl-full transition-all group-hover:opacity-10" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 relative z-10">Total Assessments</p>
              <p className="text-3xl font-bold text-white relative z-10">{assessments.length}</p>
            </div>
            <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800/50 space-y-1 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-sky-500 to-transparent rounded-bl-full transition-all group-hover:opacity-10" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 relative z-10">Registered On</p>
              <p className="text-xl font-bold text-white relative z-10">{format(new Date(patient.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assessment History</h4>
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            
            <div className="space-y-3">
              {assessments.length === 0 ? (
                <div className="text-center py-12 bg-slate-950 rounded-[32px] border-2 border-dashed border-slate-800">
                  <Activity className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">No assessments yet</p>
                </div>
              ) : (
                assessments.map(a => {
                  const Icon = getAssessmentIcon(a.type);
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssessment(a)}
                      className="w-full bg-slate-900 p-6 rounded-[32px] border border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 hover:bg-slate-800 transition-all text-left shadow-xl shadow-slate-950/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 transition-colors group-hover:text-emerald-400">
                          <Icon className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-white capitalize tracking-tight">
                            {a.type === 'rdt' ? (a.rdtType || 'RDT') : a.type.replace('_', ' ')}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{format(new Date(a.timestamp), 'MMM d, yyyy • p')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("text-xs font-bold uppercase tracking-widest",
                           (a.verdict || a.result || '').toLowerCase().includes('positive') || (a.result || '').toLowerCase() === 'red' ? "text-rose-400" :
                           (a.result || '').toLowerCase() === 'yellow' ? "text-amber-400" : "text-emerald-400"
                        )}>{a.verdict || a.result}</span>
                        <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-emerald-400 transition-all" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedAssessment && (
          <AssessmentDetails
            assessment={selectedAssessment}
            patient={patient}
            onClose={() => setSelectedAssessment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
