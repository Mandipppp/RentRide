import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmNewPassword } = formData;

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
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
                type="button"
                onClick={() => togglePasswordVisibility('newPassword')}
                className="absolute inset-y-7 right-3 flex items-center text-gray-600"
              >
                {showPassword.newPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
            </button>
            </div>
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
          className="w-full bg-green-500 text-white rounded-md py-2 hover:bg-green-600"
        >
          Update Password
        </button>
      </form>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </section>
  );
}

export default PasswordDetails;
