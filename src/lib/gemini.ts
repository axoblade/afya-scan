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
  prediction: 'malaria' | 'pneumonia' | 'malnutrition' | 'other';
  verdict: string;
  recommendation: string;
  urgency: 'high' | 'medium' | 'low';
  analysis: string;
}

export async function analyzeMalariaRDT(base64Image: string): Promise<RDTResult> {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Analyze this Malaria Rapid Diagnostic Test (RDT) strip. Determine if it's positive, negative, or invalid. Provide a confidence score (0-1), a clear verdict (e.g., 'Malaria Detected'), a brief explanation, and a recommendation. Return JSON format." },
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

export async function performSymptomTriage(symptoms: any): Promise<TriageResult> {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Perform a medical triage based on these symptoms: ${JSON.stringify(symptoms)}. 
    Predict the most likely condition (malaria, pneumonia, malnutrition, or other), provide a clear verdict, a detailed analysis of the symptoms, a treatment recommendation, and an urgency level. 
    Return JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prediction: { type: Type.STRING, enum: ["malaria", "pneumonia", "malnutrition", "other"] },
          verdict: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          urgency: { type: Type.STRING, enum: ["high", "medium", "low"] },
          analysis: { type: Type.STRING }
        },
        required: ["prediction", "verdict", "recommendation", "urgency", "analysis"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || '{}');
}

export async function generateOutbreakAlert(district: string, count: number, type: string): Promise<string> {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a natural language alert message for district health officials. 
    There have been ${count} positive cases of ${type} in the ${district} district within the last 2 hours. 
    The message should be urgent but professional, highlighting the need for immediate investigation.`,
  });

  const response = await model;
  return response.text || "Urgent alert: Multiple cases detected.";
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
