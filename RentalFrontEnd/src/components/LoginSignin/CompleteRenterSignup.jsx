import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";

const CompleteRenterSignup = () => {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false); // Check if token is valid
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    email: "", // Pre-filled from backend after token verification
  });
  const [error, setError] = useState("");
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

  useEffect(() => {
    // Verify the token when the component loads
    const verifyToken = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/auth/verify-email/${token}`);
        setIsVerified(true);
        setFormData({ ...formData, email: response.data.email }); // Set email from backend
      } catch (err) {
        toast.error("Invalid or expired token. Please request a new verification email.");
        console.error(err);
        navigate("/signup"); // Redirect to signup if token is invalid
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError("Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.");
      passwordErrors.forEach((error) => {
        toast.error(`${error}`);  // Each error is shown in a separate toast
      });
      
      return;
    }

    // Prepare data without confirmPassword
    const { confirmPassword, ...dataToSubmit } = formData;

    try {
      const response = await axios.post("http://localhost:3000/api/auth/registerUser", dataToSubmit);
      toast.success("Registration successful!");
      setTimeout(() => {
        navigate("/login"); // Redirect to login page after successful registration
      }, 1000);
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data.message || "Something went wrong.");
        setError(err.response.data.message);
      } else {
        toast.error("An error occurred. Please try again.");
        console.error(err);
      }
    }
  };

  if (!isVerified) {
    return <div>Verifying your email...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer />
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Complete Registration</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={handleInputChange}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-800 text-white rounded-full"
          >
            Complete Registration
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteRenterSignup;
