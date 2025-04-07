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

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^[0-9]{10}$/;  // Exactly 10 digits
    if (!phoneRegex.test(number)) {
      return "Contact number must be exactly 10 digits";
    }
    return "";
  };

  const validateWalletId = (walletId) => {
    const walletRegex = /^[0-9]{10}$/;  // Exactly 10 digits
    if (!walletRegex.test(walletId)) {
      return "Wallet ID must be exactly 10 digits";
    }
    return "";
  };

  const validateName = (name) => {
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (name.length > 50) return "Name must be less than 50 characters";
    if (!/^[a-zA-Z\s]*$/.test(name)) return "Name can only contain letters and spaces";
    return "";
  };

  const validateFile = (file, maxSize = 5) => {
    if (!file) return "File is required";
    
    // Check file size (maxSize in MB)
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
  
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, JPEG & PNG files are allowed";
    }
  
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
    // setFormData({ ...formData, [name]: value });
    if (name === 'contactNumber' || name === 'walletId') {
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

  const handleFileChange = (e) => {
    // const { name, files } = e.target;
    // setFormData({ ...formData, [name]: files[0] });
    const { name, files } = e.target;
    const file = files[0];

    const fileError = validateFile(file);
    if (fileError) {
      toast.error(fileError);
      e.target.value = ''; // Clear the file input
      return;
    }

    setFormData(prev => ({ ...prev, [name]: file }));
  };

  // Handle checkbox change for wallet ID
  const handleCheckboxChange = (e) => {
    setIsWalletSameAsContact(e.target.checked);
    if (e.target.checked) {
      const phoneError = validatePhoneNumber(formData.contactNumber);
      if (phoneError) {
        toast.error("Please enter a valid contact number first");
        setIsWalletSameAsContact(false);
        return;
      }
      setFormData({ ...formData, walletId: formData.contactNumber });
    } else {
      setFormData({ ...formData, walletId: "" });
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

    // Frontend validation for matching passwords
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    // Validate contact number
    const phoneError = validatePhoneNumber(formData.contactNumber);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    const walletError = validateWalletId(formData.walletId);
    if (walletError) {
      toast.error(walletError);
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

    // File validations
    const profilePicError = validateFile(formData.profilePicture);
    const citizenshipFrontError = validateFile(formData.citizenshipFront);
    const citizenshipBackError = validateFile(formData.citizenshipBack);

    if (profilePicError || citizenshipFrontError || citizenshipBackError) {
      if (profilePicError) toast.error(`Profile Picture: ${profilePicError}`);
      if (citizenshipFrontError) toast.error(`Citizenship Front: ${citizenshipFrontError}`);
      if (citizenshipBackError) toast.error(`Citizenship Back: ${citizenshipBackError}`);
      return;
    }

    // Wallet ID validation
    if (!formData.walletId.trim()) {
      toast.error("Wallet ID is required");
      return;
    }

    // Prepare data without confirmPassword
    const { confirmPassword, ...dataToSubmit } = formData;
    dataToSubmit.token = token;
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
          const errorMessage = err.response.data.message || err.response.data.error;
          toast.error(errorMessage);
          
          // If token has expired, redirect to signup
          if (err.response.data.tokenExpired) {
            toast.error("Your session has expired. Please restart the registration process.");
            setTimeout(() => {
              navigate("/signup");
            }, 2000);
            return;
          }
          
          setError(errorMessage);
        } else {
          toast.error("An error occurred. Please try again.");
          console.error(err);
        }
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
                required
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <input
              type="file"
              name="profilePicture"
              accept="image/*"
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
              accept="image/*"
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
              accept="image/*"
              className="w-full px-4 py-2 mt-2 border-b-4 border-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleFileChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Wallet ID</label>
            <div className="relative">
              <input
                type="text"
                name="walletId"
                className={`w-full px-4 py-2 mt-2 border-b-4 ${
                  formData.walletId && !validateWalletId(formData.walletId)
                    ? 'border-green-700'
                    : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isWalletSameAsContact ? 'bg-gray-50' : ''
                }`}
                placeholder="10-digit Wallet ID"
                value={formData.walletId}
                onChange={handleInputChange}
                required
                maxLength="10"
                disabled={isWalletSameAsContact}
              />
              {formData.walletId && !validateWalletId(formData.walletId) && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600">
                  <i className="fas fa-check-circle"></i>
                </span>
              )}
            </div>
            {formData.walletId && validateWalletId(formData.walletId) && (
              <p className="text-red-500 text-sm mt-1">{validateWalletId(formData.walletId)}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Enter a 10-digit wallet ID number</p>
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
