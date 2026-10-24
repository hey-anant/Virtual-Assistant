import React from 'react';
import { IoMenu } from 'react-icons/io5';
import { RxCross1 } from 'react-icons/rx';
import { useNavigate } from 'react-router-dom';

const MobileMenu = ({ ham, setHam, history, onLogout }) => {
    const navigate = useNavigate();

    return (
        <>
            {/* Hamburger icon */}
            <IoMenu
                className={`lg:hidden text-gray-800 absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer z-50 ${ham ? 'hidden' : 'block'}`}
                onClick={() => setHam(true)}
            />

            {/* Slide-out overlay */}
            <div
                className={`absolute top-0 left-0 w-full h-full bg-[#00000053] backdrop-blur-lg ${ham ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 z-40 flex flex-col items-center justify-start pt-20 gap-5`}
            >
                <RxCross1
                    className="text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer"
                    onClick={() => setHam(false)}
                />

                <button
                    className="min-w-auto cursor-pointer h-auto px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-semibold transition-all shadow-md"
                    onClick={() => { setHam(false); navigate('/customize'); }}
                >
                    Customize
                </button>

                <button
                    className="min-w-auto cursor-pointer h-auto px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-full font-semibold transition-all shadow-md"
                    onClick={onLogout}
                >
                    Log Out
                </button>

                {/* Command history */}
                <div className="w-[90%] max-h-[400px] overflow-y-auto bg-[#ffffff1a] rounded-lg p-4 mt-5">
                    <h1 className="text-white font-semibold text-[19px] mb-3">History</h1>
                    <div className="flex flex-col gap-2">
                        {history?.length > 0 ? (
                            history.map((item, index) => (
                                <span key={index} className="text-gray-200 text-[16px] truncate">{item}</span>
                            ))
                        ) : (
                            <span className="text-gray-400 text-[14px]">No history yet</span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
