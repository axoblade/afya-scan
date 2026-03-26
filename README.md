# AfyaScan: AI-Powered Community Health Tool

AfyaScan is a mobile-first web application designed for Community Health Volunteers (CHVs) in rural East Africa. It leverages Google's Gemini AI to provide rapid, accurate health assessments for common conditions like Malaria, Malnutrition (MUAC), and Pneumonia (via symptom triage).

## 🌍 Vision
To empower frontline health workers with advanced diagnostic tools, bridging the gap between rural communities and clinical expertise, and enabling early detection of outbreaks.

## ✨ Key Features

- **AI-Powered Assessments**:
  - **Malaria RDT Analysis**: Instant interpretation of Rapid Diagnostic Test strips using computer vision.
  - **MUAC Estimation**: AI-assisted estimation of Mid-Upper Arm Circumference to detect malnutrition in children.
  - **Symptom Triage**: Guided triage for pneumonia and other common illnesses based on WHO IMCI guidelines.
- **Real-Time Outbreak Detection**: Automatically triggers alerts when multiple positive cases are detected in the same district within a short timeframe.
- **Patient Management**: Securely manage community health records, including patient history and assessment trends.
- **Offline-Ready**: Built with Firestore persistence to ensure functionality in areas with intermittent connectivity.
- **Accessibility First**: Designed with large touch targets, high-contrast typography, and a simple, non-technical interface for diverse users.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend/Database**: Firebase (Authentication, Firestore)
- **AI Engine**: Google Gemini API (Multimodal analysis for images and text)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Firebase Project
- Google AI Studio API Key (for Gemini)

### Environment Variables

Create a `.env` file in the root directory and add the following:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📱 Accessibility & Design

AfyaScan is designed for users who may not be tech-savvy or may have visual impairments:
- **Large Typography**: Base font sizes are increased for better readability.
- **High Contrast**: Colors are chosen to ensure maximum legibility.
- **Touch Targets**: All interactive elements meet the minimum 44x44px touch target requirement.
- **Simple Language**: AI results are translated into human-readable "Verdicts" and "Recommendations".

## 🔒 Security

- **Firestore Rules**: Granular security rules ensure that CHVs can only access data relevant to their community.
- **Authentication**: Secure Google-based authentication for all volunteers.

## 📄 License

This project is licensed under the MIT License.
