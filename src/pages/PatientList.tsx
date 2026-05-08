import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Patient } from '../types';
import { suggestDistrict } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Users, Plus, Search, MapPin, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PatientDetails } from '../components/PatientDetails';

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: 'male', district: '', residence: '', location: null as { lat: number, lng: number } | null });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'patients'), 
      where('chvId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'patients'));

    return () => unsubscribe();
  }, [auth.currentUser]);

  const getCurrentLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Use Gemini as a "Places Service" to suggest the district
        const suggested = await suggestDistrict(`${lat}, ${lng}`, lat, lng);
        
        setNewPatient(prev => ({
          ...prev,
          location: { lat, lng },
          district: suggested
        }));
        setLocating(false);
      },
      (err) => {
        console.error(err);
        setLocating(false);
      }
    );
  };

  const handleAddPatient = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'patients'), {
        ...newPatient,
        chvId: auth.currentUser?.uid,
        age: Number(newPatient.age),
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewPatient({ name: '', age: '', gender: 'male', district: '', residence: '', location: null });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'patients');
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Community Records</h2>
          <p className="text-emerald-600/60 dark:text-emerald-400/60 font-medium">Manage and track patient data</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 border border-slate-200 dark:border-slate-800"
        >
          <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors" />
        <input
          type="text"
          placeholder="Search patients by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl shadow-slate-100 dark:shadow-slate-950/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedPatients.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800 italic">
            <Users className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-400 dark:text-slate-500 font-medium">No patient records found</p>
          </div>
        ) : (
          paginatedPatients.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedPatient(p)}
              className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-xl shadow-slate-200 dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg sm:text-xl group-hover:bg-white dark:group-hover:bg-slate-700 border border-slate-100 dark:border-slate-700 transition-colors shadow-lg shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate uppercase tracking-tight">{p.name}</h4>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded-lg whitespace-nowrap">
                      <Calendar className="w-3 h-3 text-sky-500 dark:text-sky-400" /> {p.age} Yrs
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:border-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all text-slate-300 dark:text-slate-700 shrink-0">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </motion.div>
          ))
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
        {selectedPatient && (
          <PatientDetails
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 sm:mb-8">New Patient</h3>
              <form onSubmit={handleAddPatient} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-2">Full Identity</label>
                  <input
                    required
                    type="text"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    placeholder="Enter full name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-2">Age</label>
                    <input
                      required
                      type="number"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      placeholder="Years..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-2">Gender</label>
                    <div className="relative">
                      <select
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as any })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all outline-none font-bold text-slate-900 dark:text-white appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-2">Residence / Village</label>
                  <input
                    required
                    type="text"
                    value={newPatient.residence}
                    onChange={(e) => setNewPatient({ ...newPatient, residence: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    placeholder="e.g. Village Name..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block">District Location</label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locating}
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
                    >
                      {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                      {locating ? "Locating..." : "Auto-Set GPS"}
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    value={newPatient.district}
                    onChange={(e) => setNewPatient({ ...newPatient, district: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    placeholder="e.g. District Name..."
                  />
                </div>
                <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-10">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] bg-emerald-500 text-white py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 shadow-xl shadow-emerald-500/20 text-sm sm:text-base"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 text-white" />}
                    Log Patient
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
