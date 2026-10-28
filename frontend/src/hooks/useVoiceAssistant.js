import { useRef, useState, useEffect, useCallback } from 'react';

// Open a URL with a popup-blocker fallback
const safeOpenUrl = (url) => {
    try {
        const win = window.open(url, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = url;
        }
    } catch {
        window.location.href = url;
    }
};

// Execute the browser action for a given AI command type
const executeCommand = (type, userInput) => {
    switch (type) {
        case 'google_search':
            safeOpenUrl(`https://www.google.com/search?q=${encodeURIComponent(userInput || 'search')}`);
            break;
        case 'youtube_search':
        case 'youtube_play':
            safeOpenUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(userInput || 'youtube')}`);
            break;
        case 'calculator_open':
            safeOpenUrl('https://www.google.com/search?q=calculator');
            break;
        case 'instagram_open':
            safeOpenUrl('https://www.instagram.com');
            break;
        case 'facebook_open':
            safeOpenUrl('https://www.facebook.com');
            break;
        case 'weather_show':
            safeOpenUrl(`https://www.google.com/search?q=${encodeURIComponent(userInput || 'weather')}`);
            break;
        default:
            break;
    }
};

const useVoiceAssistant = ({ userName, assistantName, getGeminiResponse, voiceEnabled, setVoiceEnabled }) => {
    const [listening, setListening] = useState(false);
    const [userText, setUserText] = useState('');
    const [aiText, setAiText] = useState('');
    const [awaitingCommand, setAwaitingCommand] = useState(false);

    const synth = window.speechSynthesis;
    const isSpeakingRef = useRef(false);
    const recognitionRef = useRef(null);
    const isRecognizingRef = useRef(false);
    const isMountedRef = useRef(true);
    const greetingUtteranceRef = useRef(null);
    const awaitingCommandRef = useRef(false);
    const assistantNameRef = useRef(assistantName || 'assistant');
    // Keep a live ref to voiceEnabled so callbacks always read the current value
    const voiceEnabledRef = useRef(voiceEnabled);
    useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);
    useEffect(() => {
        if (voiceEnabled) return;

        awaitingCommandRef.current = false;
        setAwaitingCommand(false);
        if (recognitionRef.current && isRecognizingRef.current) {
            try { recognitionRef.current.stop(); } catch { /* ignore */ }
        }
        isRecognizingRef.current = false;
        setListening(false);
    }, [voiceEnabled]);
    useEffect(() => {
        assistantNameRef.current = (assistantName || 'assistant').trim().toLowerCase() || 'assistant';
    }, [assistantName]);

    // ── Speech synthesis ─────────────────────────────────────────────────────

    const applyPreferredVoice = useCallback((utterance) => {
        const voices = synth.getVoices();
        const preferred = voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;
    }, [synth]);

    // startRecognition declared early so speak() can reference it
    const startRecognition = useCallback(() => {
        if (!voiceEnabledRef.current || !recognitionRef.current || isRecognizingRef.current || isSpeakingRef.current) return;

        try {
            recognitionRef.current.start();
            isRecognizingRef.current = true;
            setListening(true);
        } catch (err) {
            if (err.name !== 'InvalidStateError') console.error('Recognition start error:', err);
            isRecognizingRef.current = false;
            setListening(false);
        }
    }, []);

    const speak = useCallback((text) => {
        if (!voiceEnabledRef.current || !text) return;

        try {
            if (synth.paused) synth.resume();
            if (!greetingUtteranceRef.current) synth.cancel();
        } catch { /* ignore */ }

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.volume = 1.0;

        if (synth.getVoices().length > 0) {
            applyPreferredVoice(utter);
        } else {
            synth.onvoiceschanged = () => applyPreferredVoice(utter);
        }

        isSpeakingRef.current = true;
        utter.onstart = () => { isSpeakingRef.current = true; };
        utter.onend = () => {
            isSpeakingRef.current = false;
            setAiText('');
            setTimeout(() => { if (isMountedRef.current && voiceEnabledRef.current) startRecognition(); }, 500);
        };
        utter.onerror = () => {
            isSpeakingRef.current = false;
            setAiText('');
            setTimeout(() => { if (isMountedRef.current && voiceEnabledRef.current) startRecognition(); }, 500);
        };

        synth.speak(utter);
    }, [applyPreferredVoice, startRecognition, synth]);

    // ── Command handler ───────────────────────────────────────────────────────

    const handleCommand = useCallback((data) => {
        const { type, userInput, response } = data;
        if (response) speak(response);
        executeCommand(type, userInput);
    }, [speak]);

    // ── Voice enable (greeting) ───────────────────────────────────────────────

    const enableVoice = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
            return;
        }

        const greeting = new SpeechSynthesisUtterance(
            `Hello ${userName}. Say ${assistantName || 'assistant'} whenever you need me.`
        );
        greeting.lang = 'en-US';
        greetingUtteranceRef.current = greeting;

        applyPreferredVoice(greeting);

        greeting.onstart = () => { isSpeakingRef.current = true; };
        greeting.onend = () => {
            isSpeakingRef.current = false;
            greetingUtteranceRef.current = null;
            // voiceEnabledRef is already true at this point (set before speak)
            setTimeout(() => { if (isMountedRef.current) startRecognition(); }, 500);
        };
        greeting.onerror = (e) => {
            isSpeakingRef.current = false;
            greetingUtteranceRef.current = null;
            if (e.error !== 'interrupted') {
                setTimeout(() => { if (isMountedRef.current) startRecognition(); }, 500);
            }
        };

        // Set ref immediately so callbacks inside greeting.onend see true
        voiceEnabledRef.current = true;
        setVoiceEnabled(true);

        setTimeout(() => {
            isSpeakingRef.current = true;
            synth.speak(greeting);
        }, 100);
    }, [applyPreferredVoice, assistantName, startRecognition, synth, userName, setVoiceEnabled]);

    // ── Recognition useEffect ─────────────────────────────────────────────────

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognitionRef.current = recognition;
        isMountedRef.current = true;

        recognition.onstart = () => {
            isRecognizingRef.current = true;
            setListening(true);
        };

        recognition.onend = () => {
            isRecognizingRef.current = false;
            setListening(false);
            // Use ref instead of closed-over voiceEnabled state
            if (isMountedRef.current && !isSpeakingRef.current && voiceEnabledRef.current) {
                setTimeout(() => {
                    if (isMountedRef.current && !isSpeakingRef.current && voiceEnabledRef.current) startRecognition();
                }, 1000);
            }
        };

        recognition.onerror = (event) => {
            isRecognizingRef.current = false;
            setListening(false);

            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert('Microphone access is required for voice assistant. Please enable it in your browser settings.');
                return;
            }

            if (
                event.error !== 'aborted' &&
                event.error !== 'no-speech' &&
                isMountedRef.current &&
                !isSpeakingRef.current &&
                voiceEnabledRef.current
            ) {
                setTimeout(() => {
                    if (isMountedRef.current && !isSpeakingRef.current && voiceEnabledRef.current) startRecognition();
                }, 2000);
            }
        };

        recognition.onresult = async (e) => {
            if (!voiceEnabledRef.current) return;
            const transcript = e.results[e.results.length - 1][0].transcript.trim();

            try { recognition.stop(); } catch { /* ignore */ }
            isRecognizingRef.current = false;
            setListening(false);

            const lowerTranscript = transcript.toLowerCase();
            const wakeWord = assistantNameRef.current;
            const wakeIndex = lowerTranscript.indexOf(wakeWord);
            const command = awaitingCommandRef.current
                ? transcript
                : wakeIndex >= 0
                    ? transcript.slice(wakeIndex + wakeWord.length).trim()
                    : '';

            if (!awaitingCommandRef.current && wakeIndex < 0) {
                // Ignore conversations and other sounds while waiting for the wake word.
                setTimeout(() => {
                    if (isMountedRef.current && voiceEnabledRef.current) startRecognition();
                }, 300);
                return;
            }

            if (!command) {
                awaitingCommandRef.current = true;
                setAwaitingCommand(true);
                setUserText('');
                speak(`Yes, I'm listening.`);
                return;
            }

            awaitingCommandRef.current = false;
            setAwaitingCommand(false);
            setUserText(command);
            try {
                setAiText('Processing...');
                const data = await getGeminiResponse(command);
                if (data?.response) {
                    setUserText('');
                    setAiText(data.response);
                    handleCommand(data);
                } else {
                    setAiText('');
                    setUserText('');
                    speak("Sorry, I couldn't process that request.");
                }
            } catch {
                setAiText('');
                setUserText('');
                speak('Sorry, an error occurred. Please try again.');
            }
        };

        // Fallback: keep recognition alive
        const fallbackInterval = setInterval(() => {
            if (isMountedRef.current && !isRecognizingRef.current && !isSpeakingRef.current && voiceEnabledRef.current) {
                startRecognition();
            }
        }, 15000);

        return () => {
            isMountedRef.current = false;
            awaitingCommandRef.current = false;
            setAwaitingCommand(false);
            clearInterval(fallbackInterval);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                    recognitionRef.current.onstart = null;
                    recognitionRef.current.onend = null;
                    recognitionRef.current.onerror = null;
                    recognitionRef.current.onresult = null;
                } catch { /* ignore */ }
            }
            isRecognizingRef.current = false;
            setListening(false);
            if (!greetingUtteranceRef.current) synth.cancel();
        };
    }, [getGeminiResponse, handleCommand, speak, startRecognition, synth]);

    return {
        listening,
        userText,
        setUserText,
        aiText,
        setAiText,
        isSpeakingRef,
        awaitingCommand,
        speak,
        handleCommand,
        startRecognition,
        enableVoice,
    };
};

export default useVoiceAssistant;
