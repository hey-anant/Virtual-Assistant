import React, { createContext, useCallback, useEffect, useState } from 'react';
import { fetchCurrentUser, askAssistant } from '../api/assistant';

export const userDataContext = createContext();

const UserContextProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [frontendImage, setFrontendImage] = useState(null);
    const [backendImage, setBackendImage] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleCurrentUser = async () => {
        try {
            setLoading(true);
            const result = await fetchCurrentUser();
            setUserData(result.data || null);
            setError(null);
        } catch (err) {
            setUserData(null);
            if (err.response && err.response.status === 401) {
                setError(null);
            } else {
                setError(err.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const getGeminiResponse = useCallback(async (command) => {
        try {
            const result = await askAssistant(command);
            return result.data;
        } catch (err) {
            console.error('Gemini response error:', err);
            return {
                type: 'error',
                userInput: command,
                response: "Sorry, I couldn't process your request. Please try again.",
            };
        }
    }, []);

    useEffect(() => {
        handleCurrentUser();
    }, []);

    const value = {
        userData,
        setUserData,
        selectedImage,
        setSelectedImage,
        frontendImage,
        setFrontendImage,
        backendImage,
        setBackendImage,
        loading,
        error,
        getGeminiResponse,
    };

    return (
        <userDataContext.Provider value={value}>
            {children}
        </userDataContext.Provider>
    );
};

export default UserContextProvider;
