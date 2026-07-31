import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const {
    userData,
    serverUrl,
    setUserData,
    getGeminiResponse,
    loading,
    error,
  } = useContext(userDataContext);
  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const synth = window.speechSynthesis;

  const handleLogout = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.error("Error during logout:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[100vh] bg-gradient-to-t from-[#000000] to-[#030353] flex justify-center items-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[100vh] bg-gradient-to-t from-[#000000] to-[#030353] flex justify-center items-center">
        <p className="text-red-500 text-xl">Error: {error}</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="w-full h-[100vh] bg-gradient-to-t from-[#000000] to-[#030353] flex justify-center items-center">
        <p className="text-white text-xl">No user data available</p>
      </div>
    );
  }

  const speak = (text) => {
    const utterence = new SpeechSynthesisUtterance(text);
    utterence.lang = "en-US";
    isSpeakingRef.current = true;
    
    utterence.onend = () => {
      isSpeakingRef.current = false;
      console.log("Speech synthesis ended");
    };
    
    utterence.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      isSpeakingRef.current = false;
    };
    
    synth.speak(utterence);
  };

  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);

    if (type === "google_search") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }

    if (type === "youtube_search") {
      const query = encodeURIComponent(userInput);
      window.open(
        `https://www.youtube.com/results?search_query=${query}`,
        "_blank"
      );
    }

    if (type === "youtube_play") {
      const query = encodeURIComponent(userInput);
      window.open(
        `https://www.youtube.com/results?search_query=${query}`,
        "_blank"
      );
    }

    if (type === "calculator_open") {
      window.open("https://www.google.com/search?q=calculator", "_blank");
    }

    if (type === "instagram_open") {
      window.open("https://www.instagram.com", "_blank");
    }
    
    if (type === "facebook_open") {
      window.open("https://www.facebook.com", "_blank");
    }
    
    if (type === "weather-show") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }
  };

  const startRecognition = () => {
    if (!recognitionRef.current || isRecognizingRef.current || isSpeakingRef.current) {
      return;
    }

    try {
      recognitionRef.current.start();
      isRecognizingRef.current = true;
      setListening(true);
      console.log("Recognition started");
    } catch (error) {
      if (error.name === "InvalidStateError") {
        console.warn("Recognition already started");
        isRecognizingRef.current = false;
      } else {
        console.error("Error starting recognition:", error);
        isRecognizingRef.current = false;
        setListening(false);
      }
    }
  };

  const scheduleRestart = (delay = 1000) => {
    // Clear any existing timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    restartTimeoutRef.current = setTimeout(() => {
      if (!isSpeakingRef.current && !isRecognizingRef.current) {
        startRecognition();
      }
    }, delay);
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Changed to false for better stability
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      isRecognizingRef.current = false;
      setListening(false);

      // Automatically restart after a short delay
      scheduleRestart(1000);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);

      // Handle different error types
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        console.error("Microphone permission denied. Please allow microphone access.");
        return; // Don't restart if permission denied
      }

      if (event.error === "network") {
        console.log("Network error - will retry in 2 seconds");
        scheduleRestart(2000);
        return;
      }

      if (event.error === "no-speech") {
        console.log("No speech detected - restarting");
        scheduleRestart(500);
        return;
      }

      if (event.error === "aborted") {
        console.log("Recognition aborted - restarting");
        scheduleRestart(500);
        return;
      }

      // For other errors, restart after a delay
      scheduleRestart(1500);
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("Recognized text:", transcript);

      if (
        transcript
          .toLowerCase()
          .includes(userData?.user.assistantName.toLowerCase())
      ) {
        try {
          const data = await getGeminiResponse(transcript);
          console.log(data);
          handleCommand(data);
        } catch (error) {
          console.error("Error getting Gemini response:", error);
        }
      }
    };

    // Initial start
    startRecognition();

    // Cleanup
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log("Error stopping recognition:", error);
        }
      }
      isRecognizingRef.current = false;
      setListening(false);
    };
  }, [userData?.user.assistantName]);

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[#000000] to-[#030353] flex justify-center items-center flex-col gap-[20px] relative ">
      <div className="flex flex-row gap-5 right-5 mt-[30px] top-[20px] absolute ">
        <button
          className="min-w-auto cursor-pointer  h-auto px-6 py-2 bg-white  rounded-full font-semibold text-black"
          onClick={() => {
            navigate("/customize");
          }}
        >
          Customize
        </button>
        <button
          className="min-w-auto cursor-pointer  h-auto px-6 py-2 bg-white rounded-full font-semibold text-black "
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl  ">
        <img
          src={userData?.user.assistantImage}
          alt="Assistant Image"
          className="w-full h-full object-cover "
          onError={(e) => {
            console.error(
              "Image failed to load:",
              userData?.user.assistantImage
            );
            e.target.src = "/assets/image1.png";
            e.target.style.display = "none";
          }}
        />
      </div>
      <h1 className="text-white text-[18px] font-semibold">{`I'm ${userData?.user.assistantName}`}</h1>
      
      {/* Listening indicator */}
      <div className="absolute bottom-10">
        {listening ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-white text-sm">Listening...</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <p className="text-gray-400 text-sm">Idle</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;