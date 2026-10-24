# 🤖 AI Virtual Assistant

A full-stack, voice-activated AI Virtual Assistant web application built with **React**, **Node.js**, **Express**, **MongoDB**, and powered by **Google Gemini AI**.

---

## ✨ Features

- 🎤 **Voice Recognition & Speech Synthesis**: Real-time voice interaction using the native Web Speech API.
- 🧠 **Google Gemini AI Engine**: Parses voice commands dynamically and returns structured action responses.
- 🎨 **Assistant Customization**: Choose preset avatars or upload custom avatar images (via Cloudinary) and name your personal assistant.
- 🔐 **User Authentication**: Secure Signup/Login authentication using JWT tokens stored in HTTP-only cookies and Bcrypt password hashing.
- 🌐 **Smart Actions Execution**:
  - 🔍 **Google & YouTube Searches**: Automatically opens search results or plays video queries.
  - ⏰ **Date, Time & Calendar**: Provides current time, date, day, and month upon request.
  - 🌦️ **Weather & Utilities**: Quick access to weather forecasts, calculator, Instagram, Facebook, and more.
  - 💬 **Conversational AI**: Handles greetings, questions, and chitchat effortlessly.
- 📜 **Voice Command History**: View past interactions in the assistant drawer.
- 📱 **Modern & Responsive UI**: Styled with TailwindCSS with a clean neutral aesthetic (`rgb(218, 218, 211)`).

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React.js (Vite)
- **Styling**: TailwindCSS
- **Icons**: Lucide React, React Icons
- **HTTP Client**: Axios (with credentials)
- **Routing**: React Router DOM v7
- **Voice Capabilities**: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`)

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **AI Integration**: Google Gemini API (`@google/genai`, Axios)
- **Authentication**: JSON Web Tokens (JWT), Cookie Parser, BcryptJS
- **File Uploads**: Multer, Cloudinary

---

## 📁 Project Structure

```
virtualAssistant/
├── backend/
│   ├── config/          # Database, JWT token & Cloudinary configuration
│   ├── controllers/     # Auth and User controllers
│   ├── middlewares/     # JWT authentication & Multer file upload middlewares
│   ├── models/          # Mongoose User schema
│   ├── routes/          # Express route definitions
│   ├── gemini.js        # Google Gemini AI integration logic
│   ├── index.js         # Backend server entry point
│   └── package.json
│
├── frontend/
│   ├── public/          # Static assets (images, gifs)
│   ├── src/
│   │   ├── component/   # Reusable UI components
│   │   ├── context/     # User Context Provider
│   │   ├── pages/       # Home, SignIn, SignUp, Customize pages
│   │   ├── App.jsx      # Main application router
│   │   └── main.jsx     # Frontend entry point
│   └── package.json
│
├── .gitignore           # Git ignore configurations (protects .env files)
└── README.md            # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas Cluster URI)
- **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/))

---

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database & Authentication
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Google Gemini API (Required for Voice AI)
GEMINI_API_KEY=your_google_gemini_api_key

# Cloudinary (Optional: required only for custom image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```


---

### 3. Installation & Running Locally

#### **Start Backend Server**
```bash
cd backend
npm install
npm run dev
```
*Backend server will start at `http://localhost:3000`*

#### **Start Frontend App**
```bash
cd frontend
npm install
npm run dev
```
*Frontend application will start at `http://localhost:5173`*

---
