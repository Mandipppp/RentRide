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

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^[0-9]{10}$/;  // Exactly 10 digits
    if (!phoneRegex.test(number)) {
      return "Contact number must be exactly 10 digits";
    }
    return "";
  };

  const validateName = (name) => {
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (name.length > 50) return "Name must be less than 50 characters";
    if (!/^[a-zA-Z\s]*$/.test(name)) return "Name can only contain letters and spaces";
    return "";
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
    if (name === 'contactNumber') {
      // Only allow numbers and limit to 10 digits
      const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: sanitizedValue });
    } // Name validation
    else if (name === 'name') {
      // Only allow letters and spaces
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    }
    else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    
    const nameError = validateName(formData.name);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    // Validate contact number
    if(formData.contactNumber) {
      const phoneError = validatePhoneNumber(formData.contactNumber);
      if (phoneError) {
        toast.error(phoneError);
        return;
      }
    }

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
    // console.log("Data to submit:", formData);

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
            <div className="relative">
              <input
                type="text"
                name="name"
                className={`w-full px-4 py-2 mt-2 border-b-4 ${
                  formData.name && !validateName(formData.name) 
                    ? 'border-green-700' 
                    : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {formData.name && !validateName(formData.name) && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600">
                  <i className="fas fa-check-circle"></i>
                </span>
              )}
            </div>
            {formData.name && validateName(formData.name) && (
              <p className="text-red-500 text-sm mt-1">{validateName(formData.name)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              value={formData.email}
              disabled
              readOnly
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
              <i className="fas fa-lock"></i>
            </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">Email verified and cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                className={`w-full px-4 py-2 mt-2 border-b-4 ${
                  formData.password && validatePassword(formData.password).length === 0
                    ? 'border-green-700'
                    : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              {formData.password && validatePassword(formData.password).length === 0 && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600">
                  <i className="fas fa-check-circle"></i>
                </span>
              )}
            </div>
            <ul className="text-xs text-gray-500 mt-1 list-disc pl-5">
              <li className={formData.password?.length >= 8 ? "text-green-600" : ""}>At least 8 characters</li>
              <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : ""}>One uppercase letter</li>
              <li className={/[a-z]/.test(formData.password) ? "text-green-600" : ""}>One lowercase letter</li>
              <li className={/\d/.test(formData.password) ? "text-green-600" : ""}>One number</li>
              <li className={/[@$!%*?&]/.test(formData.password) ? "text-green-600" : ""}>One special character</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                className={`w-full px-4 py-2 mt-2 border-b-4 ${
                  formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-700'
                    : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600">
                  <i className="fas fa-check-circle"></i>
                </span>
              )}
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <div className="relative">
              <input
                type="text"
                name="contactNumber"
                className={`w-full px-4 py-2 mt-2 border-b-4 ${
                  formData.contactNumber && !validatePhoneNumber(formData.contactNumber)
                    ? 'border-green-700'
                    : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="10-digit Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                maxLength="10"
              />
              {formData.contactNumber && !validatePhoneNumber(formData.contactNumber) && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600">
                  <i className="fas fa-check-circle"></i>
                </span>
              )}
            </div>
            {formData.contactNumber && validatePhoneNumber(formData.contactNumber) && (
              <p className="text-red-500 text-sm mt-1">{validatePhoneNumber(formData.contactNumber)}</p>
            )}
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
