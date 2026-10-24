import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import { logoutUser } from '../api/assistant';
import useVoiceAssistant from '../hooks/useVoiceAssistant';
import MobileMenu from '../components/MobileMenu';
import CommandBar from '../components/CommandBar';

const aiImg = '/assets/ai.gif';
const userImg = '/assets/user.gif';

const Home = () => {
    const { userData, setUserData, getGeminiResponse, loading, error } = useContext(userDataContext);
    const navigate = useNavigate();

    const [ham, setHam] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [isSubmittingText, setIsSubmittingText] = useState(false);

    const {
        listening,
        userText,
        setUserText,
        aiText,
        setAiText,
        isSpeakingRef,
        speak,
        handleCommand,
        enableVoice,
    } = useVoiceAssistant({
        userName: userData?.user?.name,
        assistantName: userData?.user?.assistantName,
        getGeminiResponse,
        voiceEnabled,
        setVoiceEnabled,
    });

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUserData(null);
            navigate('/signin');
        }
    };

    const handleSendText = async (e) => {
        if (e) e.preventDefault();
        const command = textInput.trim();
        if (!command || isSubmittingText) return;

        setUserText(command);
        setTextInput('');
        setIsSubmittingText(true);
        setAiText('Processing...');

        try {
            const data = await getGeminiResponse(command);
            if (data?.response) {
                setAiText(data.response);
                handleCommand(data);
            } else {
                setAiText("Sorry, I couldn't process that request.");
                speak("Sorry, I couldn't process that request.");
            }
        } catch {
            setAiText('Sorry, an error occurred. Please try again.');
            speak('Sorry, an error occurred. Please try again.');
        } finally {
            setIsSubmittingText(false);
        }
    };

    const handleToggleVoice = () => {
        if (voiceEnabled) {
            setVoiceEnabled(false);
            window.speechSynthesis.cancel();
        } else {
            enableVoice();
        }
    };

    if (loading) {
        return (
            <div className="w-full h-[100vh] flex justify-center items-center" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
                <p className="text-gray-900 text-xl font-semibold">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-[100vh] flex justify-center items-center" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
                <p className="text-red-500 text-xl">Error: {error}</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="w-full h-[100vh] flex justify-center items-center" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
                <p className="text-gray-900 text-xl font-semibold">No user data available</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[100vh] flex justify-center items-center flex-col gap-[20px] relative overflow-hidden" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
            {/* Mobile menu */}
            <MobileMenu
                ham={ham}
                setHam={setHam}
                history={userData?.user?.history}
                onLogout={handleLogout}
            />

            {/* Desktop nav */}
            <div className="hidden lg:flex flex-row gap-4 right-5 mt-[30px] top-[20px] absolute z-50">
                <button
                    className="min-w-auto cursor-pointer h-auto px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-semibold transition-all shadow-md"
                    onClick={() => navigate('/customize')}
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

            {/* Assistant image */}
            <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-xl">
                <img
                    src={userData?.user?.assistantImage}
                    alt="Assistant"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = '/assets/image1.png';
                        e.target.style.display = 'none';
                    }}
                />
            </div>

            {/* Assistant name */}
            <h1 className="text-gray-900 text-[20px] font-bold">{`I'm ${userData?.user?.assistantName}`}</h1>

            {/* Voice GIFs */}
            {voiceEnabled && !aiText && (
                <img className="max-h-[300px] h-[100px] w-[120px] max-w-[300px]" src={userImg} alt="User speaking" />
            )}
            {voiceEnabled && aiText && (
                <img className="max-h-[300px] h-[100px] w-[120px] max-w-[300px]" src={aiImg} alt="AI speaking" />
            )}

            {/* Transcript display */}
            {(userText || aiText) && (
                <h1 className="text-gray-900 text-[18px] font-semibold text-wrap text-center max-w-[90%] px-4">
                    {userText || aiText}
                </h1>
            )}

            {/* Command bar */}
            <CommandBar
                textInput={textInput}
                setTextInput={setTextInput}
                isSubmittingText={isSubmittingText}
                voiceEnabled={voiceEnabled}
                listening={listening}
                isSpeakingRef={isSpeakingRef}
                onSubmit={handleSendText}
                onToggleVoice={handleToggleVoice}
            />
        </div>
    );
};

export default Home;
