import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';

function OwnerProfileDetails() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePicture: "",
    citizenshipFront: "",
    citizenshipBack: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      navigate("/login");
    } else {
      axios
        .get("http://localhost:3000/api/owner/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setUserData(response.data);
          setFormData({
            name: response.data?.name || "",
            email: response.data?.email || "",
            phone: response.data?.contactNumber || "",
            profilePicture: response.data?.profilePicture || "",
            citizenshipFront: response.data?.citizenshipFront || "",
            citizenshipBack: response.data?.citizenshipBack || "",
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
    return <div>Loading...</div>;
  }

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [id]: files[0] });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      toast.error("Unauthorized. Please log in.");
      navigate("/login");
      return;
    }
  
    const updatePayload = new FormData();
    if (formData.name && formData.name !== userData.name) {
      updatePayload.append("name", formData.name);
    }
    if (formData.phone && formData.phone !== userData.contactNumber) {
      updatePayload.append("contactNumber", formData.phone);
    }
    if (formData.profilePicture instanceof File) {
      updatePayload.append("profilePicture", formData.profilePicture);
    }
    if (formData.citizenshipFront instanceof File) {
      updatePayload.append("citizenshipFront", formData.citizenshipFront);
    }
    if (formData.citizenshipBack instanceof File) {
      updatePayload.append("citizenshipBack", formData.citizenshipBack);
    }
  
    if ([...updatePayload.keys()].length === 0) {
      toast.info("No changes made.");
      return;
    }
  
    console.log([...updatePayload.entries()]); // Debugging payload
  
    axios
      .put("http://localhost:3000/api/owner/me", updatePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setUserData(response.data);
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

        {/* KYC Verification Zone */}
        {userData.kycStatus !== "verified" && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">KYC Verification</h3>

            <div>
              <label htmlFor="profilePicture" className="block text-gray-700 font-medium">
                Profile Picture
              </label>
              {formData.profilePicture && (
                <img
                  src={`http://localhost:3000/${formData.profilePicture}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border mt-2"
                />
              )}
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label htmlFor="citizenshipFront" className="block text-gray-700 font-medium">
                Citizenship Front
              </label>
              {formData.citizenshipFront && (
                <img
                  src={`http://localhost:3000/${formData.citizenshipFront}`}
                  alt="Citizenship Front"
                  className="w-48 h-32 border mt-2"
                />
              )}
              <input
                type="file"
                id="citizenshipFront"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label htmlFor="citizenshipBack" className="block text-gray-700 font-medium">
                Citizenship Back
              </label>
              {formData.citizenshipBack && (
                <img
                  src={`http://localhost:3000/${formData.citizenshipBack}`}
                  alt="Citizenship Back"
                  className="w-48 h-32 border mt-2"
                />
              )}
              <input
                type="file"
                id="citizenshipBack"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>
          </div>
        )}

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

export default OwnerProfileDetails;
