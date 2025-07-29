import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Directly navigate to dashboard without authentication
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Manager</h1>
          <p className="text-gray-600 mt-2">Development Mode - No Authentication Required</p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
          Authentication has been disabled for development. Click below to access the application.
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Enter Application
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Authentication can be added back later
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;