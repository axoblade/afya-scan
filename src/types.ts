export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  district: string;
  residence: string;
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface Assessment {
  id: string;
  patientId: string;
  chvId: string;
  type: 'malaria_rdt' | 'muac' | 'symptom_triage';
  result: string;
  verdict?: string;
  analysis?: string;
  confidence?: number;
  symptoms?: Record<string, any>;
  recommendation?: string;
  district: string;
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: string;
}

export interface Alert {
  id: string;
  district: string;
  type: string;
  message: string;
  count: number;
  timestamp: string;
  status: 'active' | 'resolved';
}
