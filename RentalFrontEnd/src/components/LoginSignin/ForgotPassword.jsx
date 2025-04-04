import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "role") {
      setRole(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      toast.error("Please select your role");
      return;
    }
    setLoading(true);


    try {
      await axios.post("http://localhost:3000/api/auth/forgot-password", { email, role });
      toast.success("Password reset link has been sent to your email.");
      setCountdown(60);
    } catch (error) {
      console.error("Error in forgot password:", error);
      toast.error(error.response?.data?.message || "An error occurred. Please try again.");
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
      if (countdown > 0) {
        const timer = setInterval(() => {
          setCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);
  
        return () => clearInterval(timer); // Clean up the timer
      }
    }, [countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer />
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-medium mb-6 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 mt-2 border-b-4 border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-gray-700 mb-2">Select your role:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="renter"
                  checked={role === "renter"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Renter
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={role === "owner"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Owner
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === "admin"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Admin
              </label>
            </div>
          </div>
          {countdown === 0 ? (
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-800 text-white rounded-full flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              ) : (
                "Send Reset Link"
              )}
            </button>
          ) : (
            <p className="text-gray-600 text-center">Please wait {countdown} seconds to resend.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
