import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Patient } from '../types';
import { suggestDistrict } from '../lib/gemini';
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

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'patients'));

    return () => unsubscribe();
  }, []);

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
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Patients</h2>
          <p className="text-[#5A5A40]/60 italic">Manage community health records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5A5A40] text-white p-4 rounded-full shadow-lg hover:bg-[#4A4A30] transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A5A40]/40" />
        <input
          type="text"
          placeholder="Search patients by name or district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#5A5A40]/10 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-sans"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-[#5A5A40]/20">
            <Users className="w-12 h-12 text-[#5A5A40]/20 mx-auto mb-4" />
            <p className="text-[#5A5A40]/40 italic">No patients found</p>
          </div>
        ) : (
          filteredPatients.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedPatient(p)}
              className="bg-white p-6 rounded-[32px] shadow-sm border border-[#5A5A40]/5 flex items-center justify-between group hover:border-[#5A5A40]/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40] font-bold text-xl group-hover:bg-white transition-colors">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1a1a1a]">{p.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#5A5A40]/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {p.age} years
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.district}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#5A5A40]/20 group-hover:text-[#5A5A40] transition-all" />
            </motion.div>
          ))
        )}
      </div>

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
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-6">New Patient</h3>
              <form onSubmit={handleAddPatient} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60 block mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-sans"
                    placeholder="Enter name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60 block mb-1">Age</label>
                    <input
                      required
                      type="number"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-sans"
                      placeholder="Years..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60 block mb-1">Gender</label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as any })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-sans appearance-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60 block mb-1">Place of Residence</label>
                  <input
                    required
                    type="text"
                    value={newPatient.residence}
                    onChange={(e) => setNewPatient({ ...newPatient, residence: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-sans"
                    placeholder="e.g. Village, Street..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60 block">Current Location (District)</label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locating}
                      className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] flex items-center gap-1 hover:underline"
                    >
                      {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                      Use GPS
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    value={newPatient.district}
                    onChange={(e) => setNewPatient({ ...newPatient, district: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-sans"
                    placeholder="e.g. Kisumu East..."
                  />
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 rounded-full font-bold text-[#5A5A40] hover:bg-[#F5F5F0] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#5A5A40] text-white py-4 rounded-full font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Patient
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
