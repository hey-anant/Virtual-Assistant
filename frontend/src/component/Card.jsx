import React, { useState, useContext } from 'react'
import { userDataContext } from "../context/UserContext";

const Card = ({ image }) => {
    const {
        serverUrl,
        userData,
        setUserData,
        selectedImage,
        setSelectedImage,
        frontendImage,
        setFrontendImage,
        backendImage,
        setBackendImage,
    } = useContext(userDataContext);
    return (
        <div className={`w-[80px] h-[160px] bg-[#020220] border-2 border-[#0000ff66] rounded-2xl overflow-hidden hovere:shadow-2xl hover:shadow-blue-950 cursor-pointer hover:border-white  ${selectedImage == image ? "border-4 border-white shadow-2xl shadow-blue-950" : null}`} onClick={() => {
            setSelectedImage(image)
            setBackendImage(null)
            setFrontendImage(null)
        }}>
            <img src={image} alt="card" className='w-full h-full object-cover rounded-2xl' />
        </div>
    )
}

export default Card