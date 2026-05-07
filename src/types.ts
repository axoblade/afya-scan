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
  type: 'rdt' | 'muac' | 'symptom_triage';
  rdtType?: string;
  result: string;
  verdict?: string;
  analysis?: string;
  transcription?: string;
  confidence?: number;
  symptoms?: Record<string, any>;
  recommendation?: string;
  urgency?: 'high' | 'medium' | 'low';
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
