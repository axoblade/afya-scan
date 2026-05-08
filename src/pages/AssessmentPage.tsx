import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Patient, Assessment } from '../types';
import { analyzeRDT, estimateMUAC, performSymptomTriage } from '../lib/gemini';
import { Camera, Activity, Shield, AlertTriangle, CheckCircle, Loader2, ChevronRight, X, Users, Search, ChevronLeft, Upload, Mic, Square, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { subHours } from 'date-fns';

export function AssessmentPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [step, setStep] = useState<'select_patient' | 'choose_type' | 'rdt_selection' | 'quiz' | 'capture' | 'result'>('select_patient');
  const [type, setType] = useState<'rdt' | 'muac' | 'symptom_triage' | null>(null);
  const [rdtType, setRdtType] = useState<'Malaria' | 'Pregnancy' | 'HIV' | 'Other' | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState({ fever: false, cough: false, breathingRate: '', lethargy: false });
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_AUDIO_SECONDS = Number(import.meta.env.VITE_MAX_AUDIO_SECONDS) || 60;
  const [malariaQuiz, setMalariaQuiz] = useState({
    fever: false,
    duration: '',
    headache: 0,
    jointPain: false,
    chills: false,
    vomiting: false
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'patients'), 
      where('chvId', '==', auth.currentUser.uid),
      orderBy('name', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'patients'));
    return () => {
      unsubscribe();
      stopCamera();
    };
  }, [auth.currentUser]);

  useEffect(() => {
    if (step !== 'capture') {
      stopCamera();
    }
  }, [step]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1024 },
          height: { ideal: 1024 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      setRecordingTime(0);
      mediaRecorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_AUDIO_SECONDS - 1) {
            stopRecording();
            return MAX_AUDIO_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const video = videoRef.current;
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFileError("File size exceeds 2MB limit.");
        return;
      }
      setFileError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!type || !selectedPatient) return;
    setLoading(true);
    try {
      let aiResult;
      if (type === 'rdt' && image && rdtType) {
        aiResult = await analyzeRDT(rdtType, image.split(',')[1], rdtType === 'Malaria' ? malariaQuiz : null);
      } else if (type === 'muac' && image) {
        aiResult = await estimateMUAC(image.split(',')[1]);
      } else if (type === 'symptom_triage' && audioUrl) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(blob);
        const base64Audio = await base64Promise;
        aiResult = await performSymptomTriage(base64Audio);
      }

      setResult(aiResult);
      setStep('result');

      // Get current location for assessment
      let location = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        console.warn("Could not get location for assessment", e);
      }

      // Save to Firestore
      const assessmentData = {
        patientId: selectedPatient.id,
        chvId: auth.currentUser?.uid || 'anonymous',
        type,
        rdtType,
        result: type === 'rdt' ? aiResult.result : (type === 'muac' ? aiResult.status : aiResult.prediction),
        verdict: aiResult.verdict || '',
        analysis: aiResult.analysis || aiResult.explanation || '',
        transcription: aiResult.transcription || '',
        confidence: aiResult.confidence || 1,
        recommendation: aiResult.recommendation || '',
        urgency: aiResult.urgency,
        district: selectedPatient.district,
        location,
        timestamp: new Date().toISOString(),
        symptoms: type === 'symptom_triage' ? symptoms : (type === 'rdt' && rdtType === 'Malaria' ? malariaQuiz : null)
      };

      await addDoc(collection(db, 'assessments'), assessmentData);
    } catch (err) {
      console.error("Error processing assessment:", err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedPatient(null);
    setStep('select_patient');
    setType(null);
    setRdtType(null);
    setImage(null);
    setResult(null);
    setFileError(null);
    setAudioUrl(null);
    setRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    setSymptoms({ fever: false, cough: false, breathingRate: '', lethargy: false });
    setMalariaQuiz({
      fever: false,
      duration: '',
      headache: 0,
      jointPain: false,
      chills: false,
      vomiting: false
    });
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 'select_patient' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200 dark:shadow-slate-950/20 rotate-3 transition-transform">
                <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Select Patient</h2>
              <p className="text-slate-500 font-medium mt-1">Who are you assessing today?</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
              <div className="lg:col-span-3 space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] py-3.5 sm:py-4 pl-12 pr-6 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl shadow-slate-100 dark:shadow-slate-950"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const selfPatient: Patient = {
                        id: auth.currentUser?.uid || 'self',
                        name: auth.currentUser?.displayName || 'Self (CHV)',
                        age: 0,
                        gender: 'male',
                        district: 'Local',
                        residence: 'Local',
                        chvId: auth.currentUser?.uid || 'self',
                        createdAt: new Date().toISOString()
                      };
                      setSelectedPatient(selfPatient);
                      setStep('choose_type');
                    }}
                    className="bg-white dark:bg-slate-900 px-6 py-3.5 sm:py-4 rounded-[24px] shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 border border-slate-200 dark:border-slate-800 flex items-center justify-center sm:justify-start gap-3 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
                    title="Assess Myself"
                  >
                    <User className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    <span className="font-bold text-sm">Self Assess</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedPatients.length === 0 ? (
                    <div className="col-span-full text-center py-10 sm:py-16 bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                      <p className="text-slate-400 dark:text-slate-600 font-medium text-sm">No patients found in community</p>
                    </div>
                  ) : (
                    paginatedPatients.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setStep('choose_type');
                        }}
                        className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-xl shadow-slate-200 dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate">{p.name}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">{p.age} years • {p.district}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 dark:shadow-slate-950/20 shrink-0">
                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 disabled:opacity-30 text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 disabled:opacity-30 text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar Info/Quick Tips */}
              <div className="hidden lg:block space-y-6">
                <div className="bg-emerald-600 text-white p-8 rounded-[40px] shadow-2xl shadow-emerald-600/20">
                  <Activity className="w-10 h-10 mb-4 opacity-50" />
                  <h3 className="text-xl font-bold tracking-tight mb-2">Protocol First</h3>
                  <p className="text-sm text-emerald-100 leading-relaxed font-bold">Always verify the patient's identity and obtain verbal consent before starting any diagnostic capture.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Field Requirements</h4>
                  <ul className="space-y-4">
                    <li className="flex gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      Good daylight or bright white lamp
                    </li>
                    <li className="flex gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                      Clean, flat surface for RDT strips
                    </li>
                    <li className="flex gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      Minimal background noise for voice triage
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'choose_type' && selectedPatient && (
          <motion.div
            key="type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep('select_patient')} 
                  className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Assessment Type</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Patient: {selectedPatient.name}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'rdt', label: 'Rapid Diagnostic (RDT)', icon: Shield, desc: 'Analyze medical test kit results with camera focus and AI interpretation.', color: 'emerald' },
                { id: 'muac', label: 'Malnutrition (MUAC)', icon: Activity, desc: 'Estimate arm circumference for quick nutritional screening of children.', color: 'sky' },
                { id: 'symptom_triage', label: 'Symptom Triage', icon: AlertTriangle, desc: 'Record and analyze voice accounts of symptoms in local languages.', color: 'amber' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.id as any);
                    if (t.id === 'rdt') {
                      setStep('rdt_selection');
                    } else if (t.id === 'symptom_triage') {
                      setStep('capture');
                    } else {
                      setStep('capture');
                      startCamera();
                    }
                  }}
                  className="group bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-800 flex flex-col gap-4 sm:gap-6 hover:border-sky-500/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left overflow-hidden relative min-h-[280px] sm:min-h-[320px] justify-between"
                >
                  <div className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[28px] flex items-center justify-center transition-all group-hover:scale-110 shadow-lg",
                    t.color === 'emerald' ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                    t.color === 'sky' ? "bg-sky-500 text-white shadow-sky-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
                  )}>
                    <t.icon className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <div className="space-y-2 sm:space-y-4">
                    <h3 className="font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-tight">{t.label}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium leading-relaxed italic">{t.desc}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 group-hover:translate-x-2 transition-transform">
                    Start Assessment <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'rdt_selection' && (
          <motion.div
            key="rdt_selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setStep('choose_type')} 
                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Select Test Kit</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Medical Diagnostic Protocol</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'Malaria', label: 'Malaria RDT', desc: 'Standard Malaria Diagnostic strip', color: 'emerald' },
                { id: 'HIV', label: 'HIV Rapid Test', desc: 'Antibody screening test kit', color: 'rose' },
                { id: 'Other', label: 'Additional Screening', desc: 'Custom diagnostic protocols', color: 'slate' },
              ].map(kit => (
                <button
                  key={kit.id}
                  onClick={() => {
                    setRdtType(kit.id as any);
                    if (kit.id === 'Malaria') {
                      setStep('quiz');
                    } else {
                      setStep('capture');
                      startCamera();
                    }
                  }}
                  className="group bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all text-left relative overflow-hidden"
                >
                  <p className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">{kit.label}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">{kit.desc}</p>
                  <div className={cn(
                    "absolute top-0 right-0 w-24 h-full opacity-5 transform translate-x-8 transition-transform group-hover:translate-x-4",
                    kit.color === 'emerald' ? "bg-emerald-500 dark:bg-emerald-400" : kit.color === 'sky' ? "bg-sky-500 dark:bg-sky-400" : kit.color === 'rose' ? "bg-rose-500 dark:bg-rose-400" : "bg-slate-500 dark:bg-slate-400"
                  )} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'quiz' && type === 'rdt' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setStep('rdt_selection')} 
                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Malaria Assessment</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Pre-Test Diagnostic Quiz</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-6 sm:space-y-10">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Symptom Checklist</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'fever', label: 'Fever' },
                    { id: 'jointPain', label: 'Joint Pain' },
                    { id: 'chills', label: 'Chills' },
                    { id: 'vomiting', label: 'Vomiting' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setMalariaQuiz({ ...malariaQuiz, [s.id]: !malariaQuiz[s.id as keyof typeof malariaQuiz] })}
                      className={cn(
                        "w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center gap-2 transition-all font-bold text-sm",
                        malariaQuiz[s.id as keyof typeof malariaQuiz] ? "bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/20" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                      )}
                    >
                      {s.label}
                      {malariaQuiz[s.id as keyof typeof malariaQuiz] && <CheckCircle className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Headache Severity</h3>
                <div className="flex justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setMalariaQuiz({ ...malariaQuiz, headache: level })}
                      className={cn(
                        "flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all",
                        malariaQuiz.headache === level 
                          ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xl" 
                          : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Duration (Days)</h3>
                <input
                  type="number"
                  value={malariaQuiz.duration}
                  onChange={(e) => setMalariaQuiz({ ...malariaQuiz, duration: e.target.value })}
                  placeholder="Days symptomatic?"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 font-sans text-lg sm:text-xl font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
              </div>

              <button
                onClick={() => {
                  setStep('capture');
                  startCamera();
                }}
                className="w-full bg-emerald-500 text-white py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-bold text-lg hover:shadow-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 group"
              >
                Continue to RDT Capture
                <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setStep(type === 'rdt' ? 'rdt_selection' : 'choose_type')} 
                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight capitalize">{type === 'rdt' ? rdtType : type?.replace('_', ' ')}</h2>
            </div>            {type === 'symptom_triage' ? (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-6 sm:space-y-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                
                <div className="space-y-3 sm:space-y-4 relative z-10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] flex items-center justify-center mx-auto relative group">
                    <Mic className={cn("w-8 h-8 sm:w-10 sm:h-10 transition-all duration-500", recording ? "text-rose-500 dark:text-rose-400 scale-125 animate-pulse" : "text-sky-600 dark:text-sky-400 group-hover:scale-110")} />
                    {recording && (
                      <div className="absolute -top-3 -right-3 bg-rose-500 dark:bg-rose-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/20">
                        {MAX_AUDIO_SECONDS - recordingTime}s
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Focus on Symptoms</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Please speak clearly or record the patient describing their condition.</p>
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                  {!recording && !audioUrl && (
                    <button
                      onClick={startRecording}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-bold text-lg hover:bg-white dark:hover:bg-slate-700 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-slate-200 dark:border-slate-700"
                    >
                      <Mic className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      Start Voice Capture
                    </button>
                  )}

                  {recording && (
                    <button
                      onClick={stopRecording}
                      className="w-full bg-rose-500 dark:bg-rose-500 text-white py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-bold text-lg shadow-xl shadow-rose-500/20 dark:shadow-rose-500/10 hover:bg-rose-600 dark:hover:bg-rose-400 transition-all flex items-center justify-center gap-3"
                    >
                      <Square className="w-5 h-5 fill-current" />
                      Stop Recording
                    </button>
                  )}

                  {audioUrl && !recording && (
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 italic text-slate-400 dark:text-slate-500 text-sm">
                        Voice captured successfully
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => { setAudioUrl(null); startRecording(); }}
                          className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          Discard
                        </button>
                        <button
                          onClick={handleProcess}
                          disabled={loading}
                          className="flex-[2] bg-emerald-500 text-white py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Analyze with AI <ChevronRight className="w-5 h-5" /></>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {!image ? (
                  <div className="space-y-6">
                    <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-900">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-slate-900/5 dark:border-white/5 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-slate-900/10 dark:border-white/10 rounded-[32px] sm:rounded-[40px] flex items-center justify-center">
                           <div className="w-4 h-4 bg-slate-900/5 dark:bg-white/5 rounded-full" />
                        </div>
                      </div>
                      <button
                        onClick={captureImage}
                        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 bg-white/40 dark:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all group scale-110 border border-white/50 dark:border-white/20"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-emerald-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                        </div>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className={cn(
                          "w-full bg-white dark:bg-slate-900 border-2 border-dashed p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all shadow-xl shadow-slate-100 dark:shadow-slate-950/20",
                          fileError ? "border-rose-500 dark:border-rose-400 bg-rose-500/10" : "border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5"
                        )}
                      >
                        <Upload className={cn("w-8 h-8 sm:w-10 sm:h-10", fileError ? "text-rose-500 dark:text-rose-400" : "text-sky-500")} />
                        <span className={cn("text-xs font-bold uppercase tracking-[0.2em]", fileError ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500")}>
                          {fileError || "Capture via File Upload"}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-square">
                      <img src={image} alt="Captured" className="w-full h-full object-cover" />
                      <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
                        <div className="bg-emerald-500 text-white p-2 rounded-xl sm:rounded-2xl shadow-lg ring-4 ring-white dark:ring-slate-800">
                          <CheckCircle className="w-4 h-4 sm:w-5 h-5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => { setImage(null); startCamera(); }}
                        className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleProcess}
                        disabled={loading}
                        className="flex-[2] bg-emerald-500 text-white py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Run AI Diagnostic <ChevronRight className="w-5 h-5" /></>}
                      </button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-12"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 text-center space-y-6 sm:space-y-8 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-emerald-500" />
              
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500/10 rounded-[28px] sm:rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">AI Report Ready</h2>
                <p className="text-emerald-600/60 dark:text-emerald-400/60 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Certified Diagnostic Insight</p>
              </div>

              {image && (
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 dark:border-slate-800 group">
                  <img src={image} alt="Assessment Resource" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 dark:from-slate-950/40 to-transparent" />
                </div>
              )}

              <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-950 rounded-[28px] sm:rounded-[32px] text-left space-y-6 sm:space-y-8 border border-slate-100 dark:border-slate-800 shadow-inner">
                {result.transcription && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-2">Patient Account</label>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 italic text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                       "{result.transcription}"
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">Diagnostic Verdict</label>
                    <p className={cn("text-2xl sm:text-3xl font-bold tracking-tight",
                      type === 'symptom_triage' 
                        ? (result.urgency === 'high' ? "text-rose-500 dark:text-rose-400" : result.urgency === 'medium' ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400")
                        : (result.verdict || '').toLowerCase().includes('positive') || (result.result || '').toLowerCase().includes('positive') || (result.status || '').toLowerCase() === 'red'
                          ? "text-rose-500 dark:text-rose-400"
                          : (result.status || '').toLowerCase() === 'yellow' ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {result.verdict || (type === 'rdt' ? result.result : (type === 'muac' ? result.status : result.prediction))}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">Confidence</label>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.round((result.confidence || 0.95) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                   <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000",
                        type === 'symptom_triage'
                          ? (result.urgency === 'high' ? "bg-rose-500 dark:bg-rose-400" : result.urgency === 'medium' ? "bg-amber-400" : "bg-emerald-500")
                          : (result.verdict || '').toLowerCase().includes('positive') || (result.result || '').toLowerCase().includes('positive') || (result.status || '').toLowerCase() === 'red'
                            ? "bg-rose-500 dark:bg-rose-400"
                            : (result.status || '').toLowerCase() === 'yellow' ? "bg-amber-400" : "bg-emerald-500"
                      )} style={{ width: `${(result.confidence || 0.95) * 100}%` }} />
                    </div>
                </div>

                {result.analysis && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-2">Medical Analysis</label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{result.analysis || result.explanation}</p>
                  </div>
                )}
                
                <div className={cn("p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl",
                  type === 'symptom_triage'
                    ? (result.urgency === 'high' ? "bg-rose-500 dark:bg-rose-600 shadow-rose-500/20 dark:shadow-rose-900/20" : result.urgency === 'medium' ? "bg-amber-500 dark:bg-amber-600 shadow-amber-500/20 dark:shadow-amber-900/20" : "bg-emerald-500 dark:bg-emerald-600 shadow-emerald-500/20 dark:shadow-emerald-900/20")
                    : (result.verdict || '').toLowerCase().includes('positive') || (result.result || '').toLowerCase().includes('positive') || (result.status || '').toLowerCase() === 'red'
                      ? "bg-rose-500 dark:bg-rose-600 shadow-rose-500/20 dark:shadow-rose-900/20"
                      : (result.status || '').toLowerCase() === 'yellow' ? "bg-amber-500 dark:bg-amber-600 shadow-amber-500/20 dark:shadow-amber-900/20" : "bg-emerald-500 dark:bg-emerald-600 shadow-emerald-500/20 dark:shadow-emerald-900/20"
                )}>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 block mb-2">Required Action</label>
                  <p className="text-xs sm:text-sm leading-relaxed font-bold">{result.recommendation}</p>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-4 sm:py-5 rounded-[24px] font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xl shadow-slate-100 dark:shadow-slate-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                Archive Report & Reset
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
