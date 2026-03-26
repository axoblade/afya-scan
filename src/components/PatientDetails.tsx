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
      case 'malaria_rdt': return Shield;
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
        className="relative w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-[#5A5A40]/10 bg-[#F5F5F0]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-[#5A5A40] font-bold text-3xl shadow-sm">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-[#1a1a1a]">{patient.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-[#5A5A40]/60">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {patient.age} years</span>
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {patient.gender}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {patient.district}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
              <X className="w-6 h-6 text-[#5A5A40]" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-[#F5F5F0] p-6 rounded-[32px] space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Total Assessments</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">{assessments.length}</p>
            </div>
            <div className="bg-[#F5F5F0] p-6 rounded-[32px] space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Registered On</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{format(new Date(patient.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Assessment History</h4>
              <Clock className="w-4 h-4 text-[#5A5A40]/40" />
            </div>
            
            <div className="space-y-3">
              {assessments.length === 0 ? (
                <div className="text-center py-12 bg-[#F5F5F0] rounded-[32px] border border-dashed border-[#5A5A40]/20">
                  <Activity className="w-10 h-10 text-[#5A5A40]/20 mx-auto mb-3" />
                  <p className="text-[#5A5A40]/40 italic">No assessments yet</p>
                </div>
              ) : (
                assessments.map(a => {
                  const Icon = getAssessmentIcon(a.type);
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssessment(a)}
                      className="w-full bg-white p-6 rounded-[32px] border border-[#5A5A40]/5 flex items-center justify-between group hover:border-[#5A5A40]/20 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center group-hover:bg-white transition-colors">
                          <Icon className="w-6 h-6 text-[#5A5A40]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1a1a1a] capitalize">{a.type.replace('_', ' ')}</p>
                          <p className="text-xs text-[#5A5A40]/60">{format(new Date(a.timestamp), 'MMM d, yyyy • p')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-[#5A5A40]">{a.verdict || a.result}</span>
                        <ChevronRight className="w-5 h-5 text-[#5A5A40]/20 group-hover:text-[#5A5A40] transition-all" />
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
