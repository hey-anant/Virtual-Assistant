import React, { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Customize from './pages/Customize';
import Customize2 from './pages/Customize2';
import Home from './pages/Home';
import { userDataContext } from './context/UserContext';

const App = () => {
    const { userData, loading } = useContext(userDataContext);

    if (loading) {
        return (
            <div className="w-full h-[100vh] bg-gradient-to-t from-[#000000] to-[#030353] flex justify-center items-center text-white text-xl">
                Loading...
            </div>
        );
    }

    return (
        <Routes>
            <Route
                path="/"
                element={(userData?.user?.assistantImage && userData?.user?.assistantName) ? <Home /> : <Navigate to="/customize" replace />}
            />
            <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" replace />} />
            <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to="/" replace />} />
            <Route path="/customize" element={!userData ? <Navigate to="/signin" replace /> : <Customize />} />
            <Route path="/customize2" element={!userData ? <Navigate to="/signin" replace /> : <Customize2 />} />
        </Routes>
    );
};

export default App;
