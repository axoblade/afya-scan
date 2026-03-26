import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Assessment, Patient } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Activity, Shield, AlertTriangle, ChevronRight, Filter, Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { AssessmentDetails } from '../components/AssessmentDetails';

export function AssessmentHistory() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'malaria_rdt' | 'muac' | 'symptom_triage'>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'assessments'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const assessmentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment));
      setAssessments(assessmentData);

      // Fetch patient data for these assessments
      const patientIds = Array.from(new Set(assessmentData.map(a => a.patientId)));
      const patientData: Record<string, Patient> = { ...patients };
      
      for (const id of patientIds) {
        if (!patientData[id]) {
          const patientSnap = await getDocs(query(collection(db, 'patients'), where('__name__', '==', id)));
          if (!patientSnap.empty) {
            patientData[id] = { id: patientSnap.docs[0].id, ...patientSnap.docs[0].data() } as Patient;
          }
        }
      }
      setPatients(patientData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assessments'));

    return () => unsubscribe();
  }, []);

  const filteredAssessments = assessments.filter(a => {
    const patientName = patients[a.patientId]?.name.toLowerCase() || '';
    const matchesSearch = patientName.includes(search.toLowerCase()) || 
                          a.district.toLowerCase().includes(search.toLowerCase()) ||
                          (a.verdict || a.result).toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'malaria_rdt': return Shield;
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
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Assessment History</h2>
          <p className="text-[#5A5A40]/60 italic">Review past health records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-[#5A5A40]/10 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#5A5A40]/40 ml-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-transparent text-sm font-bold text-[#5A5A40] focus:outline-none pr-4 py-2"
            >
              <option value="all">All Types</option>
              <option value="malaria_rdt">Malaria RDT</option>
              <option value="muac">MUAC</option>
              <option value="symptom_triage">Triage</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A5A40]/40" />
        <input
          type="text"
          placeholder="Search by patient name, district, or result..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#5A5A40]/10 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-serif"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-[#5A5A40]/20">
            <Clock className="w-12 h-12 text-[#5A5A40]/20 mx-auto mb-4" />
            <p className="text-[#5A5A40]/40 italic">No assessments found</p>
          </div>
        ) : (
          filteredAssessments.map((a) => {
            const Icon = getIcon(a.type);
            const patient = patients[a.patientId];
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedAssessment(a)}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-[#5A5A40]/5 flex items-center justify-between group hover:border-[#5A5A40]/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#5A5A40] group-hover:bg-white transition-colors">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-[#1a1a1a]">{patient?.name || 'Loading...'}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 bg-[#F5F5F0] px-2 py-0.5 rounded-full">
                        {a.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#5A5A40]/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(a.timestamp), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {a.district}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-[#1a1a1a]">{a.verdict || a.result}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Result</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#5A5A40]/20 group-hover:text-[#5A5A40] transition-all" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selectedAssessment && (
          <AssessmentDetails
            assessment={selectedAssessment}
            patient={patients[selectedAssessment.patientId]}
            onClose={() => setSelectedAssessment(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
