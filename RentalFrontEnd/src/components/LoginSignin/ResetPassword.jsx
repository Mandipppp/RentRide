import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { token } = useParams(); // Extract token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("Password must be at least 8 characters long.");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter.");
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter.");
    if (!/\d/.test(password)) errors.push("Password must contain at least one number.");
    if (!/[@$!%*?&]/.test(password)) errors.push("Password must contain at least one special character (e.g., @, #, $, %).");
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
     // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      passwordErrors.forEach((error) => {
        toast.error(`${error}`);  // Each error is shown in a separate toast
      });
      
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/auth/reset-password", {
        token,
        newPassword: password,
      });
      toast.success("Password reset successfully.");
      setTimeout(() => navigate("/login"), 3000); // Redirect to login page
    } catch (error) {
      console.error("Error in reset password:", error);
      toast.error(error.response?.data?.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer />
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-medium mb-6 text-center">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-800 text-white rounded-full"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
