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
  const navigate = useNavigate();

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
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
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
            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
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
            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white rounded-md py-2 hover:bg-green-600"
        >
          Update
        </button>
      </form>
    </section>
  );
}

export default ProfileDetails;
