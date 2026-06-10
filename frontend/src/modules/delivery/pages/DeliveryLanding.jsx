import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../user/data/UserContext';
import logo from '../../../assets/transparent_logo.png';

const DeliveryLanding = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in as delivery, redirect to dashboard
    if (user?.role === 'delivery' && user?.token) {
      navigate('/delivery/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col justify-center items-center px-6 gap-10">
      <div className="flex flex-col items-center w-full max-w-sm">
        <img
          src={logo}
          alt="Interio Mega Mart"
          className="w-56 md:w-64 object-contain"
        />
        <h1 className="text-[15px] font-bold text-black text-center px-4 tracking-tight mt-2">
          India's Largest Interior Supply Hub
        </h1>
      </div>

      <div className="w-full max-w-[320px] space-y-3">
        <Link
          to="/delivery/login"
          className="block w-full py-3.5 bg-[#2A458A] text-white text-center font-semibold text-lg rounded-full shadow hover:bg-[#1f346b] transition-colors active:scale-[0.98]"
        >
          Login
        </Link>
        <Link
          to="/delivery/signup"
          className="block w-full py-2 text-[#1f346b] text-center font-medium text-[15px] hover:opacity-80 transition-opacity"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default DeliveryLanding;
