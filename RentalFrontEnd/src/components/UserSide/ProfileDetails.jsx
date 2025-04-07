import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';

function ProfileDetails() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
      name: "",
      phone: "",
  });
  const navigate = useNavigate();

  const validateName = (name) => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (name.length > 50) return "Name must be less than 50 characters";
    if (!/^[a-zA-Z\s]*$/.test(name)) return "Name can only contain letters and spaces";
    return "";
  };
  
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return '';
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) return "Phone number must be exactly 10 digits";
    return "";
  };

  useEffect(() => {
    // Fetch the user's data from the server
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      navigate("/login"); // If no token, redirect to login
    } else {
      axios
        .get("http://localhost:3000/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setUserData(response.data); // Store the user data
          setFormData({
            name: response.data?.name || "",
            email: response.data?.email || "",
            phone: response.data?.contactNumber || "",
          });
        })
        .catch((err) => {
          setError("Failed to fetch user data.");
          toast.error("Failed to fetch user data.");
        });
    }
  }, [navigate]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!userData) {
    return <div>Loading...</div>; // Show a loading state while waiting for the data
  }

  // Handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'name') {
      // Only allow letters and spaces
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({ ...prev, [id]: sanitizedValue }));
      setErrors(prev => ({ ...prev, [id]: validateName(sanitizedValue) }));
    } 
    else if (id === 'phone') {
      // Only allow numbers and limit to 10 digits
      const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [id]: sanitizedValue }));
      setErrors(prev => ({ ...prev, [id]: validatePhone(sanitizedValue) }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameError = validateName(formData.name);
    const phoneError = validatePhone(formData.phone);
    setErrors({
      name: nameError,
      phone: phoneError,
    });

    // Check if there are any errors
    if (nameError || phoneError) {
      toast.error("Please fix the errors before submitting");
      return;
    }
  
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      toast.error("Unauthorized. Please log in.");
      navigate("/login");
      return;
    }
  
    // Prepare the update payload
    const updatePayload = {};
    if (formData.name !== userData.name) updatePayload.name = formData.name;
    if (formData.phone !== userData.contactNumber) updatePayload.contactNumber = formData.phone;
  
    if (Object.keys(updatePayload).length === 0) {
      toast.info("No changes made.");
      return;
    }
  
    axios
      .put("http://localhost:3000/api/users/me", updatePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUserData(response.data); // Update local user data
        toast.success("Profile updated successfully!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to update profile. Please try again.");
      });
  };
  

  return (
    <section className="flex-1 bg-white shadow-md rounded-md p-6">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-6">Details</h2>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            placeholder="Email"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
            readOnly
          />
          <span className="text-sm text-red-500 ml-2">*uneditable</span>
        </div>

        <div>
          <label htmlFor="name" className="block text-gray-700 font-medium">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            className={`w-full border rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring ${
              errors.name 
                ? 'border-red-500 focus:ring-red-300' 
                : formData.name 
                  ? 'border-green-500 focus:ring-green-300' 
                  : 'border-gray-300 focus:ring-blue-300'
            }`}
          />
          {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-gray-700 font-medium">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            maxLength="10"
            className={`w-full border rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring ${
              errors.phone 
                ? 'border-red-500 focus:ring-red-300' 
                : formData.phone 
                  ? 'border-green-500 focus:ring-green-300' 
                  : 'border-gray-300 focus:ring-blue-300'
            }`}
          />
           {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!!errors.name || !!errors.phone}
          className={`w-full py-2 px-4 rounded-md ${
            errors.name || errors.phone
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
        >
          Update
        </button>
      </form>
    </section>
  );
}

export default ProfileDetails;
