import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

import LoginPage from './component/LoginPage';
import AdminDashboard from './component/AdminDashboard';
import UserDashboard from './component/UserDashboard';

function App() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    setRole(userRole);
  }, []);

  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!role) {
      return <Navigate to="/" />;
    }
    if (allowedRole && role !== allowedRole) {
      return <Navigate to={role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} />;
    }
    return children;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans antialiased">
        <ToastContainer position="top-center" />
        <Routes>
          <Route path="/" element={<LoginPage setRole={setRole} />} />
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/user-dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
