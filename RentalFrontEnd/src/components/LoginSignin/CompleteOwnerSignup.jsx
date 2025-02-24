import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";


const CompleteOwnerSignup = () => {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false); // Check if token is valid
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword:"",
    role: "owner",
    contactNumber: "",
    profilePicture: null,
    citizenshipFront: null,
    citizenshipBack: null,
    walletId: "",
  });
  const [error, setError] = useState("");
  const [isWalletSameAsContact, setIsWalletSameAsContact] = useState(false);

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

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  // Handle checkbox change for wallet ID
  const handleCheckboxChange = (e) => {
    setIsWalletSameAsContact(e.target.checked);
    if (e.target.checked) {
      setFormData({ ...formData, walletId: formData.contactNumber });
    } else {
      setFormData({ ...formData, walletId: "" });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Frontend validation for matching passwords
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

    axios
      .post("http://localhost:3000/api/auth/registerOwner", dataToSubmit, {headers: { "Content-Type": "multipart/form-data" }})
      .then((res) => {
        toast.success("Signup successful!");
         // Add delay before navigation
         setTimeout(() => {
          navigate("/login");
        }, 1000); // 1 seconds delay
      })
      .catch((err) => {
        if (err.response) {
          toast.error(err.response.data.message || "Signup failed. Please try again.");
          setError(err.response.data.message);
        } else if (err.request) {
          toast.error("Server is not responding. Please try again later.");
        } else {
          toast.error("An error occurred. Please try again.");
        }
        console.error("Error during signup:", err);
      });
  };

  if (!isVerified) {
    return <div>Verifying your email...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer />
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Signup</h2>
        <form onSubmit={handleSignup} className="space-y-4" encType="multipart/form-data">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name"
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
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <input
              type="file"
              name="profilePicture"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleFileChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Citizenship Front</label>
            <input
              type="file"
              name="citizenshipFront"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleFileChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Citizenship Back</label>
            <input
              type="file"
              name="citizenshipBack"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleFileChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Wallet ID</label>
            <input
              type="text"
              name="walletId"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wallet ID"
              value={formData.walletId}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isWalletSameAsContact}
              onChange={handleCheckboxChange}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Same as Contact Number</label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-800 text-white rounded-full"
          >
            Signup
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteOwnerSignup;
