# AfyaScan: AI-Powered Community Health Tool

**AfyaScan placed in the top 10 at the hackathon and is officially live.**

AfyaScan is an AI-powered health tool designed specifically for Community Health Volunteers (CHVs) in rural East Africa. It aims to close the diagnostic gap for treatable diseases by providing advanced tools that work within the critical 24-hour window.

## 🌍 The Mission

This project isn't about building a profitable startup. It was about answering one urgent question: 
**How can we help a Community Health Volunteer in rural East Africa diagnose a child with malaria, pneumonia, or any general illness within the critical 24-hour window?**

AfyaScan is 100% free for anyone in the developing world to use. Our goal is to close the diagnostic gap for the 1.5 million children who die from preventable and treatable diseases each year.

## ✨ What AfyaScan Does

- **📱 Mobile-First & Offline-Ready**: Designed for the realities of rural clinics with intermittent connectivity through Firestore persistence.
- **🦟 Instant Malaria RDT Analysis**: Uses Google Gemini AI to interpret rapid diagnostic test (RDT) strips via a phone camera, eliminating human interpretation errors.
- **📏 AI-Assisted Malnutrition Detection**: Estimates Mid-Upper Arm Circumference (MUAC) and nutritional status through photo analysis to help identify at-risk children faster and more hygienically.
- **🧠 Symptom Triage for Pneumonia**: Guides volunteers through WHO-based protocols (IMCI) to transcribe, translate, and triage urgency levels.
- **🚨 Real-Time Outbreak Alerts**: Automatically flags case clusters based on geographic and temporal trends to enable faster responses from health officials.

## 🛠 Tech Stack

Built on **Google Cloud** for scale and reliability:
- **AI**: Gemini Pro & Pro Vision (Multimodal analysis, translation, and triage)
- **Database**: Firebase Firestore (with offline persistence)
- **Auth**: Firebase Authentication
- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Architecture**: Secure by design with granular Firestore security rules (ABAC/Zero-Trust).

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
