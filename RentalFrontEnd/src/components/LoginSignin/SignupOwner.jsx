import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignupOwner = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    axios
      .post("http://localhost:3000/api/auth/registerEmail", { email, type: 'owner'})
      .then((res) => {
        toast.success("Verification email sent!");
        setCountdown(60); // Start 60-second timer
      })
      .catch((err) => {
        if (err.response) {
          toast.error(err.response.data.message || "Something went wrong.");
        }
        setError(err.response ? err.response.data.message : "Error occurred");
      }).finally(() => {
        setLoading(false);
      });
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
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Signup</h2>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              value={email}
              onChange={handleInputChange}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {countdown === 0 ? (
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-800 text-white rounded-full flex justify-center items-center"
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
                "Send Verification Email"
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

export default SignupOwner;
