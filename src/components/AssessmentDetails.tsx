import { motion } from 'motion/react';
import { Assessment, Patient } from '../types';
import { X, Calendar, MapPin, Activity, Shield, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface AssessmentDetailsProps {
  assessment: Assessment;
  patient?: Patient;
  onClose: () => void;
}

export function AssessmentDetails({ assessment, patient, onClose }: AssessmentDetailsProps) {
  const getTypeIcon = () => {
    switch (assessment.type) {
      case 'rdt': return Shield;
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
        className="relative w-full max-w-lg bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-800"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl">
              <Icon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight capitalize">
                {assessment.type === 'rdt' ? (assessment.rdtType ? `${assessment.rdtType} Test` : 'Rapid Test') : assessment.type.replace('_', ' ')}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{format(new Date(assessment.timestamp), 'PPP p')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-900 rounded-full transition-colors text-slate-500 hover:text-rose-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
          {patient && (
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Patient Information</h4>
              <div className="bg-slate-950 p-4 rounded-2xl flex items-center gap-4 border border-slate-800/50">
                <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-emerald-400 font-bold">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white uppercase tracking-tight">{patient.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{patient.age} years • {patient.gender}</p>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assessment Result</h4>
            <div className="p-8 bg-slate-950 rounded-[32px] border border-slate-800 space-y-6 shadow-inner">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Verdict</label>
                  <p className={cn("text-3xl font-bold tracking-tight", 
                    assessment.type === 'symptom_triage'
                      ? (assessment.urgency === 'high' ? "text-rose-500" : assessment.urgency === 'medium' ? "text-amber-500" : "text-emerald-400")
                      : (assessment.verdict || assessment.result || '').toLowerCase().includes('positive') || (assessment.result || '').toLowerCase() === 'red'
                        ? "text-rose-500" 
                        : (assessment.result || '').toLowerCase() === 'yellow' ? "text-amber-500" : "text-emerald-400"
                  )}>{assessment.verdict || assessment.result}</p>
                </div>
                {assessment.confidence !== undefined && (
                  <div className="text-right">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">AI Confidence</label>
                    <span className="text-lg font-bold text-white">{(assessment.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {assessment.confidence !== undefined && (
                <div className="bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000",
                      assessment.type === 'symptom_triage'
                        ? (assessment.urgency === 'high' ? "bg-rose-500" : assessment.urgency === 'medium' ? "bg-amber-400" : "bg-emerald-500")
                        : (assessment.verdict || assessment.result || '').toLowerCase().includes('positive') || (assessment.result || '').toLowerCase() === 'red'
                          ? "bg-rose-500"
                          : (assessment.result || '').toLowerCase() === 'yellow' ? "bg-amber-400" : "bg-emerald-500"
                    )}
                    style={{ width: `${assessment.confidence * 100}%` }} 
                  />
                </div>
              )}

              {assessment.transcription && (
                <div className="pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Voice Account</label>
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-sm text-slate-400 leading-relaxed italic">
                    "{assessment.transcription}"
                  </div>
                </div>
              )}

              {assessment.symptoms && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(assessment.symptoms).map(([key, value]) => {
                    if (typeof value === 'boolean' && value) {
                      return (
                        <span key={key} className="px-3 py-1.5 bg-slate-900 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                      );
                    }
                    if (typeof value === 'number' || (typeof value === 'string' && value)) {
                       return (
                        <span key={key} className="px-3 py-1.5 bg-slate-900 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800">
                          {key.replace(/([A-Z])/g, ' $1')}: {value}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
              
              {assessment.analysis && (
                <div className="pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Detailed Analysis</label>
                  <p className="text-sm text-slate-400 leading-relaxed font-bold italic">"{assessment.analysis}"</p>
                </div>
              )}
            </div>
          </section>

          {assessment.recommendation && (
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recommendation</h4>
              <div className={cn("p-6 rounded-[32px] border-2 flex gap-4 shadow-xl",
                assessment.type === 'symptom_triage'
                  ? (assessment.urgency === 'high' ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5" : assessment.urgency === 'medium' ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/5" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5")
                  : (assessment.verdict || assessment.result || '').toLowerCase().includes('positive') || (assessment.result || '').toLowerCase() === 'red'
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5"
                    : (assessment.result || '').toLowerCase() === 'yellow' ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/5" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5"
              )}>
                <CheckCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm leading-relaxed font-bold">{assessment.recommendation}</p>
              </div>
            </section>
          )}

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">District</h4>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {assessment.district}
              </div>
            </div>
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CHV ID</h4>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <User className="w-4 h-4 text-emerald-400" />
                {assessment.chvId.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
