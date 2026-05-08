import { motion } from 'motion/react';
import { X, Shield, Lock, FileText, ChevronLeft, Heart } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export type LegalPageType = 'privacy' | 'terms' | 'security';

interface LegalPagesProps {
  type: LegalPageType;
  onClose: () => void;
}

export function LegalPages({ type, onClose }: LegalPagesProps) {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      icon: Lock,
      subtitle: 'How we protect patient and volunteer data',
      sections: [
        {
          title: 'Data Collection',
          text: 'AfyaScan collects minimal personal information required for clinical diagnostics. This includes patient name, age, gender, and district. For volunteers (CHVs), we collect authentication data via Google Login.'
        },
        {
          title: 'AI Processing',
          text: 'Images generated during RDT or MUAC assessments and voice recordings are processed in real-time using Gemini AI models. These assets are encrypted and used solely for diagnostic support.'
        },
        {
          title: 'User Rights',
          text: 'Under international health data protection standards, patients have the right to request the deletion of their diagnostic history. CHVs can manage their profiles through the clinical portal.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      subtitle: 'Guidelines for clinical usage and volunteer conduct',
      sections: [
        {
          title: 'Professional Use',
          text: 'AfyaScan is a diagnostic support tool intended for use by trained Community Health Volunteers (CHVs). It does not replace professional medical judgment.'
        },
        {
          title: 'Verification Requirement',
          text: 'CHVs must verify AI-generated results against physical test kit observations whenever possible. The "AI Confidence" score must be factored into every clinical decision.'
        },
        {
          title: 'Confidentiality',
          text: 'Volunteers are strictly prohibited from sharing patient diagnostic results outside of authorized clinical reporting channels.'
        }
      ]
    },
    security: {
      title: 'Security Overview',
      icon: Shield,
      subtitle: 'Clinical-grade infrastructure and encryption',
      sections: [
        {
          title: 'End-to-End Encryption',
          text: 'All data transmitted between the AfyaScan portal and our backend is encrypted using TLS 1.3. Firestore database records are encrypted at rest.'
        },
        {
          title: 'Authentication',
          text: 'We utilize Google OAuth 2.0 for secure identity management, ensuring that only authorized personnel can access the diagnostic portal.'
        },
        {
          title: 'Local Government Standards',
          text: 'AfyaScan aligns with regional health data residency requirements, ensuring that diagnostic data is handled with the highest level of sovereignty.'
        }
      ]
    }
  };

  const active = content[type];
  const Icon = active.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-500 fill-current" />
            <span className="font-bold text-lg tracking-tight">AfyaScan</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight uppercase text-slate-900 dark:text-white">{active.title}</h1>
            <p className="text-slate-500 font-medium">{active.subtitle}</p>
          </div>

          <div className="space-y-10">
            {active.sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4">
                  {section.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last updated: May 2026</p>
            <button
              onClick={onClose}
              className="mt-8 px-8 py-4 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
            >
              Back to Portal
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
