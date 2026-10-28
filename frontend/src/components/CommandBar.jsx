import React from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

const CommandBar = ({
    textInput,
    setTextInput,
    isSubmittingText,
    voiceEnabled,
    listening,
    awaitingCommand,
    isSpeakingRef,
    onSubmit,
    onToggleVoice,
}) => {
    return (
        <div className="w-full max-w-[650px] px-4 absolute bottom-6 z-30 flex flex-col items-center gap-2">
            {/* Voice status pill */}
            {voiceEnabled && (
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-4 py-1 rounded-full text-white text-xs border border-white/10 shadow-md">
                    {listening ? (
                        <><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span>Listening...</span></>
                    ) : awaitingCommand ? (
                        <><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" /><span>Waiting for your command...</span></>
                    ) : isSpeakingRef.current ? (
                        <><div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /><span>Speaking...</span></>
                    ) : (
                        <><div className="w-2 h-2 bg-gray-400 rounded-full" /><span>Voice Ready</span></>
                    )}
                </div>
            )}

            {/* Input form */}
            <form
                onSubmit={onSubmit}
                className="w-full flex items-center gap-2 bg-black/85 backdrop-blur-xl border border-white/20 p-2 pl-5 rounded-full shadow-2xl transition-all focus-within:border-blue-500"
            >
                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a command or use mic..."
                    className="w-full bg-transparent outline-none text-white placeholder:text-gray-400 text-[15px]"
                    disabled={isSubmittingText}
                />

                {/* Mic toggle button */}
                <button
                    type="button"
                    onClick={onToggleVoice}
                    title={voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
                    className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${voiceEnabled ? 'bg-green-600 text-white hover:bg-green-700 shadow-md animate-pulse' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                    {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={!textInput.trim() || isSubmittingText}
                    title="Send Command"
                    className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${textInput.trim() && !isSubmittingText ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default CommandBar;
