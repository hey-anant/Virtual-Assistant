import React from "react";
import Card from "../component/Card";
import { useState, useRef, useContext } from "react";

import { RiImageAddLine } from "react-icons/ri";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { MdKeyboardBackspace } from "react-icons/md"

const Customize = () => {
  const images = ['/assets/image1.png', '/assets/image2.png', '/assets/image7.png', '/assets/image4.png', '/assets/image5.png', '/assets/image6.png']
  const navigate = useNavigate();
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
  const inputImage = useRef(null);
  const handleImage = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setFrontendImage(reader.result);
      setBackendImage(file);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center flex-col p-4 relative" style={{ backgroundColor: 'rgb(218, 218, 211)' }}>
      <MdKeyboardBackspace className='text-gray-800 w-[30px] h-[30px] cursor-pointer absolute top-[20px] left-[20px]' onClick={() => window.history.back()} />
      <h1 className="text-gray-900 mb-[30px] text-[30px] font-semibold">
        Select your <span className="text-blue-700">Assistant Image</span>
      </h1>
      <div className="w-full max-w-[900px] flex justify-center items-center flex-wrap gap-[15px] ">
        <Card image={images[0]} />
        <Card image={images[1]} />
        <Card image={images[2]} />
        <Card image={images[3]} />
        <Card image={images[4]} />
        <Card image={images[5]} />
        <div
          className={`w-[80px] h-[160px]  lg:w-[150px] lg:h-[250px] bg-[#020220] border-2 border-[#0000ff66] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer hover:border-4 hover:border-white flex items-center justify-center ${selectedImage == "input" ? "border-4 border-white shadow-2xl shadow-blue-950" : null}`}
          onClick={() => {
            inputImage.current.click()
            setSelectedImage("input")
          }}
        >
          {!frontendImage && (
            <RiImageAddLine className="text-white w-[25px] h-[25px]" />
          )}
          {frontendImage && (
            <img
              src={frontendImage}
              alt="custom"
              className="w-full h-full object-cover rounded-2xl"
            />
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            ref={inputImage}
            onChange={handleImage}
          />
        </div>
      </div>
      {selectedImage && <button className="cursor-pointer min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px]  " onClick={() => navigate("/customize2")}>
        Next
      </button>}

    </div>
  );
};

export default Customize;
