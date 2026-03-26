import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Patient, Assessment } from '../types';
import { analyzeMalariaRDT, estimateMUAC, performSymptomTriage, generateOutbreakAlert } from '../lib/gemini';
import { Camera, Activity, Shield, AlertTriangle, CheckCircle, Loader2, ChevronRight, X, Users, Search, ChevronLeft, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { subHours } from 'date-fns';

export function AssessmentPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [step, setStep] = useState<'select_patient' | 'choose_type' | 'capture' | 'result'>('select_patient');
  const [type, setType] = useState<'malaria_rdt' | 'muac' | 'symptom_triage' | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState({ fever: false, cough: false, breathingRate: '', lethargy: false });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'patients'));
    return () => {
      unsubscribe();
      stopCamera();
    };
  }, []);

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
      if (type === 'malaria_rdt' && image) {
        aiResult = await analyzeMalariaRDT(image.split(',')[1]);
      } else if (type === 'muac' && image) {
        aiResult = await estimateMUAC(image.split(',')[1]);
      } else if (type === 'symptom_triage') {
        aiResult = await performSymptomTriage(symptoms);
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
        result: type === 'malaria_rdt' ? aiResult.result : (type === 'muac' ? aiResult.status : aiResult.prediction),
        verdict: aiResult.verdict || '',
        analysis: aiResult.analysis || aiResult.explanation || '',
        confidence: aiResult.confidence || 1,
        recommendation: aiResult.recommendation || '',
        district: selectedPatient.district,
        location,
        timestamp: new Date().toISOString(),
        symptoms: type === 'symptom_triage' ? symptoms : null
      };

      await addDoc(collection(db, 'assessments'), assessmentData);

      // Check for outbreak alert
      if (type === 'malaria_rdt' && aiResult.result === 'positive') {
        await checkOutbreak(selectedPatient.district);
      }
    } catch (err) {
      console.error("Error processing assessment:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkOutbreak = async (district: string) => {
    const twoHoursAgo = subHours(new Date(), 2).toISOString();
    const q = query(
      collection(db, 'assessments'),
      where('district', '==', district),
      where('type', '==', 'malaria_rdt'),
      where('result', '==', 'positive'),
      where('timestamp', '>=', twoHoursAgo)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.size >= 3) {
      // Trigger alert
      const message = await generateOutbreakAlert(district, snapshot.size, 'Malaria');
      await addDoc(collection(db, 'alerts'), {
        district,
        type: 'Malaria Outbreak',
        message,
        count: snapshot.size,
        timestamp: new Date().toISOString(),
        status: 'active'
      });
    }
  };

  const reset = () => {
    setSelectedPatient(null);
    setStep('select_patient');
    setType(null);
    setImage(null);
    setResult(null);
    setSymptoms({ fever: false, cough: false, breathingRate: '', lethargy: false });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'select_patient' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#5A5A40]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#5A5A40]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1a1a1a]">Select Patient</h2>
              <p className="text-[#5A5A40]/60 italic">Who are you assessing today?</p>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A5A40]/40" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#5A5A40]/10 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-serif"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {paginatedPatients.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[32px] border border-dashed border-[#5A5A40]/20">
                  <p className="text-[#5A5A40]/40 italic">No patients found</p>
                </div>
              ) : (
                paginatedPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPatient(p);
                      setStep('choose_type');
                    }}
                    className="bg-white p-6 rounded-[32px] shadow-sm border border-[#5A5A40]/5 flex items-center justify-between hover:border-[#5A5A40]/20 transition-all text-left"
                  >
                    <div>
                      <p className="font-bold text-[#1a1a1a]">{p.name}</p>
                      <p className="text-xs text-[#5A5A40]/60">{p.age} years • {p.district}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#5A5A40]/20" />
                  </button>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-3 bg-white rounded-full shadow-sm disabled:opacity-30 text-[#5A5A40]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-[#5A5A40]/60 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-3 bg-white rounded-full shadow-sm disabled:opacity-30 text-[#5A5A40]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 'choose_type' && selectedPatient && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('select_patient')} className="p-2 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5 text-[#5A5A40]" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-[#1a1a1a]">Assessment Type</h2>
                <p className="text-xs text-[#5A5A40]/60 italic">Patient: {selectedPatient.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'malaria_rdt', label: 'Malaria RDT', icon: Shield, desc: 'Analyze test strip photo' },
                { id: 'muac', label: 'Malnutrition (MUAC)', icon: Activity, desc: 'Estimate arm circumference' },
                { id: 'symptom_triage', label: 'Symptom Triage', icon: AlertTriangle, desc: 'Input symptoms for diagnosis' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.id as any);
                    if (t.id === 'symptom_triage') {
                      setStep('capture');
                    } else {
                      setStep('capture');
                      startCamera();
                    }
                  }}
                  className="bg-white p-8 rounded-[32px] shadow-sm border border-[#5A5A40]/5 flex items-center gap-6 hover:border-[#5A5A40]/20 transition-all text-left"
                >
                  <div className="w-14 h-14 bg-[#5A5A40]/10 rounded-2xl flex items-center justify-center">
                    <t.icon className="w-7 h-7 text-[#5A5A40]" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-[#1a1a1a]">{t.label}</p>
                    <p className="text-sm text-[#5A5A40]/60">{t.desc}</p>
                  </div>
                </button>
              ))}
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
              <button onClick={() => setStep('choose_type')} className="p-2 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5 text-[#5A5A40]" />
              </button>
              <h2 className="text-xl font-bold text-[#1a1a1a] capitalize">{type?.replace('_', ' ')}</h2>
            </div>

            {type === 'symptom_triage' ? (
              <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6">
                <div className="space-y-4">
                  {[
                    { id: 'fever', label: 'Fever' },
                    { id: 'cough', label: 'Cough' },
                    { id: 'lethargy', label: 'Lethargy/Weakness' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSymptoms({ ...symptoms, [s.id]: !symptoms[s.id as keyof typeof symptoms] })}
                      className={cn(
                        "w-full p-4 rounded-2xl border flex items-center justify-between transition-all",
                        symptoms[s.id as keyof typeof symptoms] ? "bg-[#5A5A40]/10 border-[#5A5A40]" : "bg-white border-[#5A5A40]/10"
                      )}
                    >
                      <span className="font-bold">{s.label}</span>
                      {symptoms[s.id as keyof typeof symptoms] && <CheckCircle className="w-5 h-5 text-[#5A5A40]" />}
                    </button>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 block mb-1">Breathing Rate (breaths/min)</label>
                    <input
                      type="number"
                      value={symptoms.breathingRate}
                      onChange={(e) => setSymptoms({ ...symptoms, breathingRate: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 font-serif"
                      placeholder="e.g. 45"
                    />
                  </div>
                </div>
                <button
                  onClick={handleProcess}
                  disabled={loading}
                  className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get AI Triage'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {!image ? (
                  <div className="space-y-6">
                    <div className="relative aspect-square bg-black rounded-[32px] overflow-hidden shadow-2xl">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-white/20 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-dashed border-white/40 rounded-2xl" />
                      </div>
                      <button
                        onClick={captureImage}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all"
                      >
                        <div className="w-16 h-16 border-4 border-[#5A5A40] rounded-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-[#5A5A40]" />
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
                        className="w-full bg-white border-2 border-dashed border-[#5A5A40]/20 p-8 rounded-[32px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#5A5A40]/40 transition-all"
                      >
                        <Upload className="w-8 h-8 text-[#5A5A40]/40" />
                        <span className="text-sm font-bold text-[#5A5A40]/60 uppercase tracking-widest">Or Upload Existing Image</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <img src={image} alt="Captured" className="w-full aspect-square object-cover rounded-[32px] shadow-xl" />
                    <div className="flex gap-4">
                      <button
                        onClick={() => { setImage(null); startCamera(); }}
                        className="flex-1 py-4 rounded-full font-bold text-[#5A5A40] bg-white shadow-sm"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleProcess}
                        disabled={loading}
                        className="flex-1 bg-[#5A5A40] text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze with AI'}
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
            className="space-y-6"
          >
            <div className="bg-white rounded-[32px] p-8 shadow-xl text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#1a1a1a]">Assessment Complete</h2>
                <p className="text-[#5A5A40]/60 italic">AI Analysis Result</p>
              </div>

              <div className="p-6 bg-[#F5F5F0] rounded-2xl text-left space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Verdict</label>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    {result.verdict || (type === 'malaria_rdt' ? result.result : (type === 'muac' ? result.status : result.prediction))}
                  </p>
                </div>
                {result.analysis && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Analysis</label>
                    <p className="text-sm text-[#1a1a1a] leading-relaxed">{result.analysis || result.explanation}</p>
                  </div>
                )}
                {result.confidence && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Confidence</label>
                    <div className="w-full bg-white rounded-full h-2 mt-1">
                      <div className="bg-[#5A5A40] h-full rounded-full" style={{ width: `${result.confidence * 100}%` }} />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">Recommendation</label>
                  <p className="text-sm text-[#1a1a1a] leading-relaxed font-bold">{result.recommendation}</p>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-bold hover:bg-[#4A4A30] transition-all"
              >
                Finish & Back Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
