import React, { useState } from 'react'
import { useContext } from 'react';
const bg = '/assets/authBg.gif';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from "react-router-dom"
import { userDataContext } from '../context/UserContext';
import Home from './Home';
import axios from "axios";
const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { serverUrl, userData, setUserData } = useContext(userDataContext)

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result = await axios.post(`${serverUrl}/api/auth/login`, { email, password }, { withCredentials: true })
      setUserData(result.data);
      // console.log(result)
      setLoading(false);
      navigate("/");
    } catch (error) {
      console.error("SignIn error details:", error);
      setUserData(null);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        setError("Backend server is not reachable. Make sure server is running on http://localhost:3000");
      } else {
        setError(error.message || "Connection error. Please try again.");
      }
      setLoading(false);
    }
  }
  return (
    <div className='w-full min-h-screen flex justify-center items-center p-4 bg-cover bg-center' style={{ backgroundImage: `url(${bg})` }}>
      <form onSubmit={handleSignIn} className='w-full max-w-[400px] bg-[#00000055] backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl shadow-blue-950/50 flex flex-col items-center justify-center gap-4 p-5 md:p-6'>
        <h1 className='text-white text-[22px] md:text-[24px] font-semibold text-center mb-2'>Login into <span className='text-blue-400'>Virtual Assistant</span></h1>

        <input type='text' placeholder='Enter Your Email' onChange={(e) => setEmail(e.target.value)} value={email} className='w-full outline-none h-[50px] border-2 border-white/80 bg-transparent text-white placeholder:text-gray-300 px-5 rounded-full text-[16px]' />
        
        <div className='border-2 border-white/80 bg-transparent w-full rounded-full text-[16px] relative h-[50px] flex items-center'>
          <input type={showPassword ? "text" : "password"} onChange={(e) => { setPassword(e.target.value) }} value={password} placeholder='Enter Your Password' className='w-full outline-none bg-transparent rounded-full h-full text-white placeholder:text-gray-300 px-5 pr-12' />
          {!showPassword && <Eye onClick={() => { setShowPassword(true) }} className='absolute right-4 text-white cursor-pointer w-5 h-5' />}
          {showPassword && <EyeOff onClick={() => { setShowPassword(false) }} className='absolute right-4 text-white cursor-pointer w-5 h-5' />}
        </div>
        
        {error.length > 0 && <p className='text-red-400 text-sm font-medium text-center'>*{error}</p>}
        
        <button className='w-[140px] h-[48px] bg-white hover:bg-gray-100 transition-colors rounded-full font-semibold text-black mt-2 text-[16px] cursor-pointer' disabled={loading}>{loading ? "signing in" : "Sign In"}</button>

        <p className='text-white/90 text-[15px] mt-1'>Want to create a new account? <span onClick={() => navigate('/signup')} className='text-blue-400 font-medium cursor-pointer hover:underline'>Sign Up</span></p>
      </form>
    </div>
  )
}

export default SignIn