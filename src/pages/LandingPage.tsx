import { motion } from 'motion/react';
import { Shield, Activity, Users, Zap, Heart, CheckCircle, ArrowRight, Smartphone, Globe, Lock, Play } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { cn } from '../lib/utils';

const heroImg = "https://res.cloudinary.com/dxibh23n3/image/upload/v1778264186/client_logos/afya-scan-bg_1_yhzgem.png";
import rdtImg from '../assets/images/rdt_scanner_feature_1778152258310.png';
import muacImg from '../assets/images/muac_measurement_feature_1778152278279.png';
import voiceImg from '../assets/images/voice_triage_feature_1778152296824.png';

interface LandingPageProps {
  onSignIn: () => void;
  onLegalClick: (type: 'privacy' | 'terms' | 'security') => void;
}

export function LandingPage({ onSignIn, onLegalClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">AfyaScan</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600 dark:text-emerald-400 mt-1">AI Diagnostic Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={onSignIn}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-full font-bold text-sm transition-all hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Empowering Community Health
            </div>
            <h2 className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              Clinical-Grade AI <br />
              <span className="text-emerald-500">In Every Village.</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              AfyaScan provides Community Health Volunteers with advanced diagnostic tools powered by Gemini AI. 
              Reduce diagnostic delays, improve accuracy, and save lives in remote regions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onSignIn}
                className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:bg-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/30 group active:scale-95"
              >
                Get Started Now
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                How it Works
              </a>
            </div>
            <div className="flex items-center gap-6 pt-4 opacity-60">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?u=${i}`}
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    alt="CHV Avatar"
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-500">Trusted by 500+ Volunteers across Uganda</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full" />
            <motion.img
              src={heroImg}
              alt="AI Health Dashboard"
              className="relative w-full max-w-2xl mx-auto drop-shadow-2xl"
              referrerPolicy="no-referrer"
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 1, 0, -1, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 px-6 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400">Our Technology</h3>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">The AI Diagnostic Toolkit</h2>
            <p className="text-slate-500 font-medium">Three powerful modules designed for the field, requiring only a smartphone camera and microphone.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'RDT Computer Vision',
                desc: 'Instant, lab-accurate capture and analysis of Malaria, HIV, and Pregnancy test strips. Eliminates human interpretation errors.',
                img: rdtImg,
                icon: Shield,
                color: 'emerald'
              },
              {
                title: 'AI MUAC Estimation',
                desc: "Estimate Mid-Upper Arm Circumference and nutritional status through photo analysis. Faster and more hygienic than physical tape.",
                img: muacImg,
                icon: Activity,
                color: 'sky'
              },
              {
                title: 'Voice Symptom Triage',
                desc: 'Records patient symptoms in local languages (Swahili, Luganda, etc.) and uses Gemini to transcribe, translate, and triage urgency.',
                img: voiceImg,
                icon: Users,
                color: 'amber'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-8 bg-slate-50 dark:bg-slate-950 rounded-[48px] border border-slate-200 dark:border-slate-800/50 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-black/40 transition-all duration-500"
              >
                <div className="mb-8 overflow-hidden rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-inner">
                  <img src={feature.img} alt={feature.title} className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                    feature.color === 'emerald' ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                    feature.color === 'sky' ? "bg-sky-500 text-white shadow-sky-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
                  )}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{feature.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-6 overflow-hidden relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 relative">
          <div className="space-y-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-600 dark:text-sky-400">Impact In Action</h3>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Real-World Use Cases</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Emergency Outbreak Triage",
                  desc: "When a village reports matching symptoms, voice triage patterns alert regional clinics of potential outbreaks before they spread."
                },
                {
                  title: "Remote Malaria Screening",
                  desc: "Volunteers visit distant households and screen for Malaria instantly, ensuring same-day treatment start."
                },
                {
                  title: "Nutritional Surveillance",
                  desc: "Track child nutritional progress monthly with photographic evidence, creating a digital growth record."
                }
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-black">
                      0{idx + 1}
                    </div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h4>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 pl-12">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[56px] p-10 sm:p-16 text-white space-y-10 shadow-3xl shadow-emerald-500/20 relative">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Smartphone className="w-32 h-32" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">Documentation</h3>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold uppercase tracking-widest text-emerald-400 text-sm mb-1">Step 01: Capture</h5>
                  <p className="text-sm text-slate-400 leading-relaxed">Ensure good lighting. Use the built-in camera to take a clear top-down photo of the RDT strip or the child's upper arm.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-sky-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold uppercase tracking-widest text-sky-400 text-sm mb-1">Step 02: AI Processing</h5>
                  <p className="text-sm text-slate-400 leading-relaxed">Our clinical-grade Gemini AI models analyze the capture in under 5 seconds, providing a verdict and confidence score.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold uppercase tracking-widest text-amber-400 text-sm mb-1">Step 03: Decision Support</h5>
                  <p className="text-sm text-slate-400 leading-relaxed">Receive instant recommendations on whether to provide first aid, repeat the test, or initiate an urgent clinic referral.</p>
                </div>
              </div>
            </div>
            <button
              onClick={onSignIn}
              className="w-full bg-white text-slate-900 py-5 rounded-[2rem] font-black text-lg transition-all hover:bg-emerald-400 hover:text-white active:scale-95"
            >
              Learn More in Portal
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-24 px-6 bg-slate-100 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <Lock className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">HIPAA Compliant</h4>
            <p className="text-slate-500 text-sm leading-relaxed">All patient data is encrypted end-to-end and stored securely on clinical-grade infrastructure.</p>
          </div>
          <div className="space-y-4 border-slate-200 dark:border-slate-800 md:border-x px-12">
            <Globe className="w-12 h-12 text-sky-500 mx-auto" />
            <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Offline First</h4>
            <p className="text-slate-500 text-sm leading-relaxed">Continue assessing patients even without an active internet connection. Data syncs when you reach a network.</p>
          </div>
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">98.4% Accuracy</h4>
            <p className="text-slate-500 text-sm leading-relaxed">Our vision models are trained on thousands of clinical samples to match or exceed expert interpretation.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 py-16 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">AfyaScan</h1>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
            © 2026 Developed by <a href="https://axoblade.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">Axoblade</a> for Global Health Initiatives.
          </p>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onLegalClick('privacy')} 
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors"
            >
              Privacy
            </button>
            <button 
              onClick={() => onLegalClick('terms')} 
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors"
            >
              Terms
            </button>
            <button 
              onClick={() => onLegalClick('security')} 
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors"
            >
              Security
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
