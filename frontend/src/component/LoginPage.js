import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
// Updated icons to include FaLaptop for hardware theme
import { FaUser, FaLock, FaCalendarAlt, FaSignInAlt, FaLaptop } from 'react-icons/fa';

const LoginPage = ({ setRole }) => {
  const [mobileNo, setMobileNo] = useState('');
  const [dob, setDob] = useState('');
  const [userType, setUserType] = useState('user');
  const navigate = useNavigate();
  const backend_Url= process.env.REACT_APP_BACKEND_URL

  useEffect(() => {
    // Clear the dob field when user type changes to prevent type mismatch
    setDob('');
  }, [userType]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const loginPayload = {
        mobileNo: mobileNo,
        dob: dob
      };

      // API call remains the same, but the system context is now Hardware Management
      const response = await axios.post(backend_Url+'/api/auth/login', loginPayload);
      const { token, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (setRole) {
        setRole(role);
      }

      toast.success('Login successful!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Login failed.', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 justify-center items-center p-4 sm:p-8 font-sans">
      <ToastContainer />
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl">
        {/* Left Section (Visuals and Info) - Updated for Hardware Theme */}
        <div className="relative md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-center text-center text-white bg-gradient-to-br from-indigo-600 to-purple-700">
          <FaLaptop className="text-6xl mb-4 text-white" />
          <h1 className="text-4xl font-extrabold mb-2">Hardware Inventory Management</h1>
          <p className="text-lg mb-6 opacity-80">Your secure portal for tracking and managing IT asset records.</p>
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute bottom-4 text-xs opacity-60">© 2025 IT Dept.</div>
        </div>

        {/* Right Section (Login Form) */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Asset Portal Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex justify-center space-x-4 mb-4 bg-gray-100 rounded-full p-1">
              {/* User Login Toggle */}
              <label className={`flex-1 flex items-center justify-center p-2 rounded-full cursor-pointer transition-all duration-300 ${userType === 'user' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600'}`}>
                <input
                  type="radio"
                  name="userType"
                  value="user"
                  checked={userType === 'user'}
                  onChange={() => setUserType('user')}
                  className="hidden"
                />
                <span className="font-semibold">Staff Login</span>
              </label>
              {/* Admin Login Toggle */}
              <label className={`flex-1 flex items-center justify-center p-2 rounded-full cursor-pointer transition-all duration-300 ${userType === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600'}`}>
                <input
                  type="radio"
                  name="userType"
                  value="admin"
                  checked={userType === 'admin'}
                  onChange={() => setUserType('admin')}
                  className="hidden"
                />
                <span className="font-semibold">Admin Login</span>
              </label>
            </div>
            
            {/* Mobile/User ID Input */}
            <div>
              <label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline-block mr-2 text-gray-400" /> Employee ID / Mobile No.
              </label>
              <input
                type="text"
                id="mobileNo"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              />
            </div>
            
            {/* DOB/Password Input */}
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                {userType === 'admin' ? (
                  <>
                    <FaLock className="inline-block mr-2 text-gray-400" /> Password
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="inline-block mr-2 text-gray-400" /> Date of Birth (for verification)
                  </>
                )}
              </label>
              <input
                type={userType === 'admin' ? 'password' : 'date'}
                id="dob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-md text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 transform hover:scale-105"
              >
                <FaSignInAlt className="mr-2" /> Log In to Portal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
