import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenAI({ apiKey });

export interface RDTResult {
  result: 'positive' | 'negative' | 'invalid';
  confidence: number;
  verdict: string;
  explanation: string;
  recommendation: string;
}

export interface MUACResult {
  muac: number;
  status: 'Green' | 'Yellow' | 'Red';
  verdict: string;
  analysis: string;
  recommendation: string;
}

export interface TriageResult {
  transcription: string;
  prediction: string;
  verdict: string;
  recommendation: string;
  urgency: 'high' | 'medium' | 'low';
  analysis: string;
}

export async function analyzeRDT(testType: string, base64Image: string, clinicalContext?: any): Promise<RDTResult> {
  const contextText = clinicalContext ? `Clinical Context: ${JSON.stringify(clinicalContext)}.` : "";
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `Analyze this ${testType} strip. Determine if it's positive, negative, or invalid. ${contextText} Use the clinical context (if provided) to verify if it aligns with the RDT result. Provide a confidence score (0-1), a clear verdict, a brief explanation, and a recommendation. Return JSON format.` },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          result: { type: Type.STRING, enum: ["positive", "negative", "invalid"] },
          confidence: { type: Type.NUMBER },
          verdict: { type: Type.STRING },
          explanation: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        },
        required: ["result", "confidence", "verdict", "explanation", "recommendation"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || '{}');
}

export async function estimateMUAC(base64Image: string): Promise<MUACResult> {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Estimate the Mid-Upper Arm Circumference (MUAC) in cm from this photo of a child's arm. Provide the estimated measurement, the nutritional status color (Green, Yellow, Red), a human-understandable verdict (e.g., 'Well Nourished'), a detailed analysis, and a recommendation. Return JSON format." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          muac: { type: Type.NUMBER },
          status: { type: Type.STRING, enum: ["Green", "Yellow", "Red"] },
          verdict: { type: Type.STRING },
          analysis: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        },
        required: ["muac", "status", "verdict", "analysis", "recommendation"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || '{}');
}

export async function performSymptomTriage(audioBase64: string): Promise<TriageResult> {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "This is a recording of a patient in Uganda explaining their symptoms (possibly in Swahili, Luganda, Runyankore, or Iteso). 1. Transcribe the symptoms accurately into English. 2. Perform a general medical triage/assessment based on the transcribed symptoms. 3. Predict the likely health condition (it can be anything, from common cold to serious illness). 4. Provide a clear verdict, a detailed analysis, a professional recommendation (e.g., first aid, or immediate visit to a doctor), and an urgency level. Return JSON format." },
          { inlineData: { mimeType: "audio/webm", data: audioBase64 } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          prediction: { type: Type.STRING },
          verdict: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          urgency: { type: Type.STRING, enum: ["high", "medium", "low"] },
          analysis: { type: Type.STRING }
        },
        required: ["transcription", "prediction", "verdict", "recommendation", "urgency", "analysis"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || '{}');
}

export async function suggestDistrict(input: string, lat?: number, lng?: number): Promise<string> {
  const context = lat && lng ? `near coordinates ${lat}, ${lng}` : "";
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest the official district name in East Africa for the input: "${input}" ${context}. Return only the district name.`,
  });

  const response = await model;
  return response.text?.trim() || input;
}
