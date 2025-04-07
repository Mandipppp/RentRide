import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password must contain at least one special character (@$!%*?&)");
  }
  return errors;
};

function PasswordDetails() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false
  });

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    });
  };

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (id === 'newPassword') {
      checkPasswordStrength(value);
    }
    setError('');
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmNewPassword } = formData;

    // Validate current password
    if (!currentPassword.trim()) {
      toast.error("Current password is required");
      return;
    }

    // Validate new password
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      passwordErrors.forEach(error => toast.error(error));
      return;
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      toast.error("New password cannot be the same as current password");
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords don't match!");
      return;
    }

    // Get the token from localStorage
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      toast.error("Unauthorized. Please log in.");
      navigate("/login");
      return;
    }

    // Prepare the request payload
    const requestData = {
      currentPassword,
      newPassword,
    };

    // Make the API call to change the password
    axios
      .put("http://localhost:3000/api/users/change-password", requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        toast.success("Password updated successfully!");
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        }); // Reset form fields
        setError('')
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to update password. Please try again.");
        setError("Failed to update password.");
      });
  };

  return (
    <section className="flex-1 bg-white shadow-md rounded-md p-6">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-6">Password</h2>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="currentPassword" className="block text-gray-700 font-medium">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPassword.currentPassword ? 'text' : 'password'}
              id="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Current Password"
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
            />

            <button
              type="button"
              onClick={() => togglePasswordVisibility('currentPassword')}
              className="absolute inset-y-7 right-3 flex items-center text-gray-600"
            >
              {showPassword.currentPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-gray-700 font-medium">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.newPassword ? 'text' : 'password'}
              id="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="New Password"
              className={`w-full border rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring ${
                formData.newPassword && Object.values(passwordStrength).every(Boolean)
                  ? 'border-green-500 focus:ring-green-300'
                  : 'border-gray-300 focus:ring-blue-300'
              }`}
            />
            <button
                type="button"
                onClick={() => togglePasswordVisibility('newPassword')}
                className="absolute inset-y-7 right-3 flex items-center text-gray-600"
              >
                {showPassword.newPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
            </button>
            </div>
            <ul className="text-xs text-gray-500 mt-1 list-disc pl-5">
              <li className={passwordStrength.hasMinLength ? "text-green-600" : ""}>
                At least 8 characters
              </li>
              <li className={passwordStrength.hasUpperCase ? "text-green-600" : ""}>
                One uppercase letter
              </li>
              <li className={passwordStrength.hasLowerCase ? "text-green-600" : ""}>
                One lowercase letter
              </li>
              <li className={passwordStrength.hasNumber ? "text-green-600" : ""}>
                One number
              </li>
              <li className={passwordStrength.hasSpecialChar ? "text-green-600" : ""}>
                One special character
              </li>
            </ul>
        </div>
        <div>
          <label htmlFor="confirmNewPassword" className="block text-gray-700 font-medium">
            Confirm New Password
          </label>
          <div className="relative">
          <input
            type={showPassword.confirmNewPassword ? 'text' : 'password'}
            id="confirmNewPassword"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            placeholder="Confirm New Password"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmNewPassword')}
              className="absolute inset-y-7 right-3 flex items-center text-gray-600"
            >
              {showPassword.confirmNewPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
            </button>
            </div>
        </div>
        <button
          type="submit"
          disabled={
            !formData.currentPassword ||
            !Object.values(passwordStrength).every(Boolean) ||
            formData.newPassword !== formData.confirmNewPassword
          }
          className={`w-full py-2 px-4 rounded-md transition-colors ${
            !formData.currentPassword ||
            !Object.values(passwordStrength).every(Boolean) ||
            formData.newPassword !== formData.confirmNewPassword
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          Update Password
        </button>
      </form>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </section>
  );
}

export default PasswordDetails;
