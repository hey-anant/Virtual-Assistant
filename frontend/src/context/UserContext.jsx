import React, { createContext, useEffect, useState } from 'react'
import axios from 'axios';
export const userDataContext = createContext()
function UserContext({ children }) {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
    var [userData, setUserData] = useState(null);
    var [frontendImage, setFrontendImage] = useState(null);
    const [backendImage, setBackendImage] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const [error, setError] = useState(null); // Add error state

    const handleCurrentUser = async () => {
        try {
            setLoading(true);
            const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true });
            console.log("Current user response:", result.data);
            setUserData(result.data || null);
            setError(null); 

        } catch (error) {
            console.error("Error fetching current user:", error);
            setUserData(null);
            if (error.response && error.response.status === 401) {
                setError(null);
            } else {
                setError(error.message || "An error occurred");
            }
        }finally{
            setLoading(false);
        }
    }


    const getGeminiResponse = async(command)=>{
        try {
           const result = await axios.post(`${serverUrl}/api/user/askAssistant`,{command},{ withCredentials: true }); 
           return result.data 
        } catch (error) {
            console.log("Error in Gemini Response",error);
            return {
                type: "error",
                userInput: command,
                response: "Sorry, I couldn't process your request. Please try again."
            };
        }
    }


    useEffect(() => {
        handleCurrentUser();
    }, [])


    const value = {
        serverUrl, userData, setUserData, selectedImage, setSelectedImage, frontendImage, setFrontendImage, backendImage, setBackendImage,loading, 
        error,getGeminiResponse
    }


    return (

        <userDataContext.Provider value={value}>{children}</userDataContext.Provider>


    )
}

export default UserContext