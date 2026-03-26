import { motion } from 'motion/react';
import { Assessment, Patient } from '../types';
import { X, Calendar, MapPin, Activity, Shield, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { format } from 'date-fns';

interface AssessmentDetailsProps {
  assessment: Assessment;
  patient?: Patient;
  onClose: () => void;
}

export function AssessmentDetails({ assessment, patient, onClose }: AssessmentDetailsProps) {
  const getTypeIcon = () => {
    switch (assessment.type) {
      case 'malaria_rdt': return Shield;
      case 'muac': return Activity;
      case 'symptom_triage': return AlertTriangle;
      default: return Activity;
    }
  };

  const Icon = getTypeIcon();

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
        className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-[#5A5A40]/10 flex items-center justify-between bg-[#F5F5F0]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Icon className="w-6 h-6 text-[#5A5A40]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1a1a1a] capitalize">{assessment.type.replace('_', ' ')}</h3>
              <p className="text-xs text-[#5A5A40]/60">{format(new Date(assessment.timestamp), 'PPP p')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-[#5A5A40]" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {patient && (
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Patient Information</h4>
              <div className="bg-[#F5F5F0] p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#5A5A40] font-bold">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a]">{patient.name}</p>
                  <p className="text-xs text-[#5A5A40]/60">{patient.age} years • {patient.gender}</p>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Assessment Result</h4>
            <div className="p-6 bg-[#5A5A40]/5 rounded-[32px] border border-[#5A5A40]/10 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Verdict</label>
                <p className="text-2xl font-bold text-[#1a1a1a]">{assessment.verdict || assessment.result}</p>
              </div>
              
              {assessment.analysis && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Analysis</label>
                  <p className="text-sm text-[#1a1a1a] leading-relaxed italic">"{assessment.analysis}"</p>
                </div>
              )}

              {assessment.confidence !== undefined && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">AI Confidence</label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 bg-white rounded-full h-2">
                      <div 
                        className="bg-[#5A5A40] h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${assessment.confidence * 100}%` }} 
                      />
                    </div>
                    <span className="text-xs font-bold text-[#5A5A40]">{(assessment.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {assessment.recommendation && (
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Recommendation</h4>
              <div className="bg-green-50 p-6 rounded-[32px] border border-green-100 flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                <p className="text-sm text-green-900 leading-relaxed font-medium">{assessment.recommendation}</p>
              </div>
            </section>
          )}

          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">District</h4>
              <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                <MapPin className="w-4 h-4 text-[#5A5A40]" />
                {assessment.district}
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">CHV ID</h4>
              <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                <User className="w-4 h-4 text-[#5A5A40]" />
                {assessment.chvId.slice(0, 8)}...
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
