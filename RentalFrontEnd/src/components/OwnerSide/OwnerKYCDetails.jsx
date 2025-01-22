import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';

function OwnerKYCDetails() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    profilePicture: "",
    citizenshipFront: "",
    citizenshipBack: "",
  });
  const [remData, setRemData] = useState({
    profilePicture: { status: "", comments: "" },
    citizenshipFront: { status: "", comments: "" },
    citizenshipBack: { status: "", comments: "" },
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
          const userData = response.data;
          setUserData(userData);
  
          // Extract KYC details from response
          const kycDetails = userData.kycDetails || {};
  
          setFormData({
            profilePicture: kycDetails?.profilePicture || "",
            citizenshipFront: kycDetails?.citizenshipFront || "",
            citizenshipBack: kycDetails?.citizenshipBack || "",
          });

          setRemData({
            profilePicture: {
              status: kycDetails?.profilePictureStatus || "pending",
              comments: kycDetails?.profilePictureComment || "",
            },
            citizenshipFront: {
              status: kycDetails?.citizenshipFrontStatus || "pending",
              comments: kycDetails?.citizenshipFrontComment || "",
            },
            citizenshipBack: {
              status: kycDetails?.citizenshipBackStatus || "pending",
              comments: kycDetails?.citizenshipBackComment || "",
            },
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

    if (remData.profilePicture.status === "rejected" && formData.profilePicture instanceof File) {
      updatePayload.append("profilePicture", formData.profilePicture);
    }
    if (remData.citizenshipFront.status === "rejected" && formData.citizenshipFront instanceof File) {
      updatePayload.append("citizenshipFront", formData.citizenshipFront);
    }
    if (remData.citizenshipBack.status === "rejected" && formData.citizenshipBack instanceof File) {
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
      <h2 className="text-2xl font-bold">KYC Details</h2>
      <span
      className={
      userData.kycStatus === "verified"
        ? "text-green-500 text-sm"
        : userData.kycStatus === "rejected"
        ? "text-red-500 text-sm"
        : "text-yellow-500 text-sm"
        }>
        {userData.kycStatus === "verified"
        ? "*Your KYC is verified."
        : userData.kycStatus === "rejected"
        ? "*Your KYC was rejected."
        : "*Your KYC verification is pending."}
    </span>
      <form className="flex flex-col gap-6 mt-6" onSubmit={handleSubmit}>

        {/* KYC Verification Zone */}
        
          <div className='flex flex-col gap-6'>
            <div>
              <label htmlFor="profilePicture" className="block text-gray-700 font-medium">
                Profile Picture {" "}
              {remData.profilePicture.status && (
                <span
                  className={
                    remData.profilePicture.status === "rejected"
                      ? "text-red-500"
                      : remData.profilePicture.status === "verified"
                      ? "text-green-500"
                      : "text-yellow-500"
                  }
                >
                  ({remData.profilePicture.status.toUpperCase()}: {remData.profilePicture.comments || "No comments"})
                </span>
              )}
              </label>
              {formData.profilePicture && (
                <img
                  src={`http://localhost:3000/${formData.profilePicture}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border mt-2"
                />
              )}
              {remData.profilePicture.status === "rejected" && (
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
              />)}
            </div>

            <div>
              <label htmlFor="citizenshipFront" className="block text-gray-700 font-medium">
                Citizenship Front{" "}
              {remData.citizenshipFront.status && (
                <span
                  className={
                    remData.citizenshipFront.status === "rejected"
                      ? "text-red-500"
                      : remData.citizenshipFront.status === "verified"
                      ? "text-green-500"
                      : "text-yellow-500"
                  }
                >
                  ({remData.citizenshipFront.status.toUpperCase()}: {remData.citizenshipFront.comments || "No comments"})
                </span>
              )}
              </label>
              {formData.citizenshipFront && (
                <img
                  src={`http://localhost:3000/${formData.citizenshipFront}`}
                  alt="Citizenship Front"
                  className="w-48 h-32 border mt-2"
                />
              )}
              {remData.citizenshipFront.status === "rejected" && (
              <input
                type="file"
                id="citizenshipFront"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
                disabled={remData.citizenshipFront.status === "verified"}

              />)}
            </div>

            <div>
              <label htmlFor="citizenshipBack" className="block text-gray-700 font-medium">
                Citizenship Back{" "}
              {remData.citizenshipBack.status && (
                <span
                  className={
                    remData.citizenshipBack.status === "rejected"
                      ? "text-red-500"
                      : remData.citizenshipBack.status === "verified"
                      ? "text-green-500"
                      : "text-yellow-500"
                  }
                >
                  ({remData.citizenshipBack.status.toUpperCase()}: {remData.citizenshipBack.comments || "No comments"})
                </span>
              )}
              </label>
              {formData.citizenshipBack && (
                <img
                  src={`http://localhost:3000/${formData.citizenshipBack}`}
                  alt="Citizenship Back"
                  className="w-48 h-32 border mt-2"
                />
              )}
              {remData.citizenshipBack.status === "rejected" && (
              <input
                type="file"
                id="citizenshipBack"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
                disabled={remData.citizenshipBack.status === "verified"}
              />)}
            </div>
          </div>
        
          {userData.kycStatus == "rejected" && (
        <button
          type="submit"
          className="w-full bg-green-500 text-white rounded-md py-2 hover:bg-green-600"
        >
          Update
        </button>)}
      </form>
    </section>
  );
}

export default OwnerKYCDetails;
