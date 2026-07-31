import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const aiImg = "/assets/ai.gif";
const userImg = "/assets/user.gif";
import { IoMenu } from "react-icons/io5";
import { RxCross1 } from "react-icons/rx";

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

  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [listening, setListening] = useState(false);
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;
  const [ham, setHam] = useState(false);
  const isMountedRef = useRef(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const greetingUtteranceRef = useRef(null); // Track greeting separately

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.error("Error during logout:", error);
    }
  };

  // Enable voice with user interaction
  const enableVoice = () => {
    console.log("Enabling voice assistant...");

    // Don't cancel during initial greeting
    const greeting = new SpeechSynthesisUtterance(
      `Hello ${userData?.user.name}, how can I help you today?`
    );
    greeting.lang = "en-US";

    greetingUtteranceRef.current = greeting; // Store reference

    // Set voice if available
    const voices = synth.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang === "en-US" || v.lang.startsWith("en")
    );
    if (preferredVoice) greeting.voice = preferredVoice;

    greeting.onstart = () => {
      console.log("Greeting started");
      isSpeakingRef.current = true;
    };

    greeting.onend = () => {
      console.log("Greeting complete, starting recognition");
      isSpeakingRef.current = false;
      greetingUtteranceRef.current = null; // Clear reference

      // Start recognition after greeting completes
      setTimeout(() => {
        if (isMountedRef.current && voiceEnabled) {
          startRecognition();
        }
      }, 500);
    };

    greeting.onerror = (e) => {
      console.error("Greeting error:", e.error);
      isSpeakingRef.current = false;
      greetingUtteranceRef.current = null; // Clear reference

      // Start recognition anyway if greeting fails (unless it's the initial interrupt)
      if (e.error !== "interrupted") {
        setTimeout(() => {
          if (isMountedRef.current && voiceEnabled) {
            startRecognition();
          }
        }, 500);
      }
    };

    // Set voice enabled FIRST, then speak
    setVoiceEnabled(true);

    // Small delay to ensure state has updated before speaking
    setTimeout(() => {
      isSpeakingRef.current = true;
      synth.speak(greeting);
    }, 100);
  };

  // Start speech recognition
  const startRecognition = () => {
    // Don't start if voice is not enabled yet
    if (!voiceEnabled) {
      console.log("Voice not enabled yet, skipping recognition start");
      return;
    }

    // Don't start if already recognizing or speaking
    if (
      !recognitionRef.current ||
      isRecognizingRef.current ||
      isSpeakingRef.current
    ) {
      console.log("Cannot start recognition - already active or speaking");
      return;
    }

    try {
      recognitionRef.current.start();
      isRecognizingRef.current = true;
      setListening(true);
      console.log("Recognition started successfully");
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        console.error("Error starting recognition:", error);
      }
      isRecognizingRef.current = false;
      setListening(false);
    }
  };

  // Text-to-speech function
  const speak = (text) => {
    if (!voiceEnabled) {
      console.warn("Voice not enabled yet");
      return;
    }

    if (!text) {
      console.warn("No text to speak");
      return;
    }

    // Only cancel if we're not in the middle of the initial greeting
    if (!greetingUtteranceRef.current) {
      synth.cancel();
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    const setVoice = () => {
      const voices = synth.getVoices();
      const preferred = voices.find(
        (v) => v.lang === "en-US" || v.lang.startsWith("en")
      );
      if (preferred) utter.voice = preferred;
    };

    if (synth.getVoices().length > 0) {
      setVoice();
    } else {
      synth.onvoiceschanged = setVoice;
    }

    isSpeakingRef.current = true;

    utter.onstart = () => {
      console.log("Speech started");
      isSpeakingRef.current = true;
    };

    utter.onend = () => {
      console.log("Speech ended, restarting recognition...");
      isSpeakingRef.current = false;
      setAiText("");

      setTimeout(() => {
        if (isMountedRef.current && voiceEnabled) {
          startRecognition();
        }
      }, 800);
    };

    utter.onerror = (e) => {
      console.error("Speech synthesis error:", e.error);
      isSpeakingRef.current = false;
      setAiText("");

      setTimeout(() => {
        if (isMountedRef.current && voiceEnabled) {
          startRecognition();
        }
      }, 800);
    };

    synth.speak(utter);
  };

  // Handle voice commands
  const handleCommand = (data) => {
    const { type, userInput, response } = data;

    // Speak the response
    if (response) {
      speak(response);
    }

    // Execute command actions
    if (type === "google_search") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }

    if (type === "youtube_search" || type === "youtube_play") {
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

    if (type === "weather_show") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }
  };

  // Main useEffect for speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    isMountedRef.current = true;

    // Recognition event handlers
    recognition.onstart = () => {
      console.log("Speech recognition started");
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      isRecognizingRef.current = false;
      setListening(false);

      // Restart recognition if voice is enabled and not speaking
      if (isMountedRef.current && !isSpeakingRef.current && voiceEnabled) {
        setTimeout(() => {
          if (isMountedRef.current && !isSpeakingRef.current && voiceEnabled) {
            startRecognition();
          }
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);

      // Handle specific errors
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        console.error("Permission to use microphone is denied.");
        alert(
          "Microphone access is required for voice assistant. Please enable it in your browser settings."
        );
        return;
      }

      // Restart recognition after error (except if aborted or no-speech)
      if (
        event.error !== "aborted" &&
        event.error !== "no-speech" &&
        isMountedRef.current &&
        !isSpeakingRef.current &&
        voiceEnabled
      ) {
        setTimeout(() => {
          if (isMountedRef.current && !isSpeakingRef.current && voiceEnabled) {
            startRecognition();
          }
        }, 2000);
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("Recognized text:", transcript);
      setUserText(transcript);

      // Stop recognition to process the command
      try {
        recognition.stop();
      } catch (err) {
        console.log("Error stopping recognition:", err);
      }
      isRecognizingRef.current = false;
      setListening(false);

      // Check if the transcript contains the assistant name (with fuzzy matching)
      const transcriptLower = transcript.toLowerCase();
      const assistantNameLower = userData?.user.assistantName?.toLowerCase() || "";
      
      // Simple Levenshtein distance for fuzzy matching
      const levenshteinDistance = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
          matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        return matrix[b.length][a.length];
      };

      // Check for exact match or fuzzy match
      const words = transcriptLower.split(' ');
      let nameDetected = false;
      
      for (const word of words) {
        // Exact match
        if (word === assistantNameLower) {
          nameDetected = true;
          break;
        }
        // Fuzzy match (allow 1-2 character difference for names 4+ chars)
        const distance = levenshteinDistance(word, assistantNameLower);
        const threshold = assistantNameLower.length >= 4 ? 2 : 1;
        if (distance <= threshold) {
          nameDetected = true;
          console.log(`Fuzzy match found: "${word}" ≈ "${assistantNameLower}" (distance: ${distance})`);
          break;
        }
      }
      
      console.log("Transcript:", transcript);
      console.log("Assistant name:", userData?.user.assistantName);
      console.log("Name detected:", nameDetected);
      
      if (nameDetected) {
        try {
          setAiText("Processing...");
          const data = await getGeminiResponse(transcript);

          if (data && data.response) {
            setUserText("");
            setAiText(data.response);
            console.log("Response data:", data);

            // Handle the command
            handleCommand(data);
          } else {
            console.error("Invalid response data:", data);
            setAiText("");
            setUserText("");
            speak("Sorry, I couldn't process that request.");
          }
        } catch (error) {
          console.error("Error getting Gemini response:", error);
          setAiText("");
          setUserText("");
          speak("Sorry, an error occurred. Please try again.");
        }
      } else {
        // If assistant name not mentioned, clear text and restart
        console.log("Assistant name not detected, restarting...");
        setTimeout(() => {
          setUserText("");
          if (isMountedRef.current && voiceEnabled) {
            startRecognition();
          }
        }, 1500);
      }
    };

    // Fallback interval to ensure recognition is running
    const fallbackInterval = setInterval(() => {
      if (
        isMountedRef.current &&
        !isRecognizingRef.current &&
        !isSpeakingRef.current &&
        voiceEnabled
      ) {
        console.log("Fallback: Restarting recognition");
        startRecognition();
      }
    }, 15000);

    // Cleanup function
    return () => {
      console.log("Cleaning up speech recognition...");
      isMountedRef.current = false;
      clearInterval(fallbackInterval);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
        } catch (error) {
          console.log("Error stopping recognition during cleanup:", error);
        }
      }

      isRecognizingRef.current = false;
      setListening(false);

      // Only cancel if we're not in the middle of the initial greeting
      if (!greetingUtteranceRef.current) {
        synth.cancel();
      }
    };
  }, [userData?.user.assistantName, userData?.user.name, getGeminiResponse, voiceEnabled]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-[100vh] flex justify-center items-center" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
        <p className="text-gray-900 text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-[100vh] flex justify-center items-center" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
        <p className="text-red-500 text-xl">Error: {error}</p>
      </div>
    );
  }

  // No user data state
  if (!userData) {
    return (
      <div className="w-full h-[100vh] flex justify-center items-center" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
        <p className="text-gray-900 text-xl font-semibold">No user data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[100vh] flex justify-center items-center flex-col gap-[20px] relative overflow-hidden" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
      {/* Hamburger Menu Icon */}
      <IoMenu
        className={`lg:hidden text-gray-800 absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer z-50 ${ham ? "hidden" : "block"
          }`}
        onClick={() => setHam(true)}
      />

      {/* Mobile Menu */}
      <div
        className={`absolute top-0 left-0 w-full h-full bg-[#00000053] backdrop-blur-lg ${ham ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 z-40 flex flex-col items-center justify-start pt-20 gap-5`}
      >
        <RxCross1
          className="text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer"
          onClick={() => setHam(false)}
        />

        <button
          className="min-w-auto cursor-pointer h-auto px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-semibold transition-all shadow-md"
          onClick={() => {
            setHam(false);
            navigate("/customize");
          }}
        >
          Customize
        </button>

        <button
          className="min-w-auto cursor-pointer h-auto px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-semibold transition-all shadow-md"
          onClick={handleLogout}
        >
          Log Out
        </button>

        <div className="w-[90%] max-h-[400px] overflow-y-auto bg-[#ffffff1a] rounded-lg p-4 mt-5">
          <h1 className="text-white font-semibold text-[19px] mb-3">
            History
          </h1>

          <div className="flex flex-col gap-2">
            {userData?.user.history && userData.user.history.length > 0 ? (
              userData.user.history.map((his, index) => (
                <span
                  key={index}
                  className="text-gray-200 text-[16px] truncate"
                >
                  {his}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-[14px]">No history yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex flex-row gap-4 right-5 mt-[30px] top-[20px] absolute z-50">
        <button
          className="min-w-auto cursor-pointer h-auto px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-semibold transition-all shadow-md"
          onClick={() => {
            navigate("/customize");
          }}
        >
          Customize
        </button>

        <button
          className="min-w-auto cursor-pointer h-auto px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-semibold transition-all shadow-md"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      {/* Assistant Image */}
      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-xl">
        <img
          src={userData?.user.assistantImage}
          alt="Assistant Image"
          className="w-full h-full object-cover"
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

      {/* Assistant Name */}
      <h1 className="text-gray-900 text-[20px] font-bold">{`I'm ${userData?.user.assistantName}`}</h1>

      {/* Status Indicators - Show GIFs when voice is enabled */}
      {voiceEnabled && !aiText && (
        <img
          className="max-h-[300px] h-[100px] w-[120px] max-w-[300px]"
          src={userImg}
          alt="User speaking"
        />
      )}
      {voiceEnabled && aiText && (
        <img
          className="max-h-[300px] h-[100px] w-[120px] max-w-[300px]"
          src={aiImg}
          alt="AI speaking"
        />
      )}

      {/* Text Display */}
      {(userText || aiText) && (
        <h1 className="text-gray-900 text-[18px] font-semibold text-wrap text-center max-w-[90%] px-4">
          {userText || aiText}
        </h1>
      )}

      {/* Enable Voice Button - Shows when voice is not enabled */}
      {!voiceEnabled && (
        <button
          onClick={enableVoice}
          className="absolute bottom-10 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
        >
          Enable Voice Assistant
        </button>
      )}

      {/* Listening Indicator - Shows when voice is enabled */}
      {voiceEnabled && (
        <div className="absolute bottom-10">
          {listening ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-white text-sm font-medium">Listening...</p>
            </div>
          ) : isSpeakingRef.current ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-white text-sm font-medium">Speaking...</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <p className="text-gray-400 text-sm font-medium">Ready</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
