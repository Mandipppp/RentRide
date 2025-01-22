import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // To get the user ID from the URL
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";

const AdminOwnerProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [accessToken, setAccessToken] = useState("");
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);
  
    const [verificationStatus, setVerificationStatus] = useState({
      profilePicture: false,
      citizenshipFront: false,
      citizenshipBack: false,
      otherDetails: false,
    });
  
    const [message, setMessage] = useState({
      profilePicture: "",
      citizenshipFront: "",
      citizenshipBack: "",
      otherDetails: "",
    });
  
    const [activeDecline, setActiveDecline] = useState({
      profilePicture: false,
      citizenshipFront: false,
      citizenshipBack: false,
      otherDetails: false,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");
  
    useEffect(() => {
      const token = reactLocalStorage.get("access_token");
      if (token) {
        setAccessToken(token);
        getDetails(token);
      } else {
        setLoading(false);
      }
    }, []);
  
    const getDetails = (token) => {
      const url = `http://localhost:3000/api/admin/${id}`;
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setOwner(res.data.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching owner details:", error);
          setOwner(null);
          setLoading(false);
        });
    };
  
    const handleAccept = (section) => {
      setMessage((prev) => ({
        ...prev,
        [section]: `${section} accepted`,
      }));
      setVerificationStatus((prev) => ({
        ...prev,
        [section]: true,
      }));
    };
  
    const handleDecline = (section, reason) => {
      if (reason.trim() === "") {
        alert("Please enter a reason for rejection");
        return;
      }
      setMessage((prev) => ({
        ...prev,
        [section]: `Rejected: ${reason}`,
      }));
      setVerificationStatus((prev) => ({
        ...prev,
        [section]: true,
      }));
      setActiveDecline((prev) => ({
        ...prev,
        [section]: false,
      }));
    };
  
    const allSectionsVerified = Object.values(verificationStatus).every(
      (status) => status
    );

    const openModal = (image) => {
        setModalImage(image);
        setIsModalOpen(true);
      };
    
      const closeModal = () => {
        setIsModalOpen(false);
        setModalImage("");
      };
  
    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (!owner) {
      return <div>Error loading owner details. Please try again later.</div>;
    }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-left">
      {/* Header */}
      <div className="flex items-center w-full max-w-4xl mb-6">
        <button
          className="mr-4 text-blue-800 hover:underline"
          onClick={() => navigate("/adminowners")}
        >
          Back
        </button>
        <h1 className="text-4xl font-bold">Owners/ Profile</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-wrap justify-left gap-6 w-full">
        {/* Profile Section */}
        <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
          <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
          <img
            src={`http://localhost:3000/${owner.kycId.documents.profilePicture.file}`}
            alt={owner.name}
            className="w-60 h-60 object-cover mx-auto mb-4"
            onClick={() => openModal(`http://localhost:3000/${owner.kycId.documents.profilePicture.file}`)}
          />
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={() => handleAccept("profilePicture")}
            >
              Accept
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => setActiveDecline((prev) => ({
                ...prev,
                profilePicture: !prev.profilePicture,
              }))}
            >
              Decline
            </button>
          </div>
          {activeDecline.profilePicture && (
            <div className="mt-4 border-t pt-4">
              <input
                type="text"
                placeholder="Enter reason for rejection"
                className="w-full px-4 py-2 border rounded mb-2"
              />
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => {
                  const reason = document.querySelector(
                    'input[placeholder="Enter reason for rejection"]'
                  ).value;
                  handleDecline("profilePicture", reason);
                }}
              >
                Confirm Decline
              </button>
            </div>
          )}
          {message.profilePicture && (
            <p
              className={`mt-4 ${
                message.profilePicture.startsWith("Rejected")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {message.profilePicture}
            </p>
          )}
        </div>

        {/* Citizenship Front Section */}
        <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
          <h2 className="text-lg font-semibold mb-4">Citizenship Front</h2>
          <img
            src={`http://localhost:3000/${owner.kycId.documents.citizenshipFront.file}`}
            alt={owner.name}
            className="w-60 h-60 object-cover mx-auto mb-4"
            onClick={() => openModal(`http://localhost:3000/${owner.kycId.documents.citizenshipFront.file}`)}
          />
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={() => handleAccept("citizenshipFront")}
            >
              Accept
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => setActiveDecline((prev) => ({
                ...prev,
                citizenshipFront: !prev.citizenshipFront,
              }))}
            >
              Decline
            </button>
          </div>
          {activeDecline.citizenshipFront && (
            <div className="mt-4 border-t pt-4">
              <input
                type="text"
                placeholder="Enter reason for rejection"
                className="w-full px-4 py-2 border rounded mb-2"
              />
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => {
                  const reason = document.querySelector(
                    'input[placeholder="Enter reason for rejection"]'
                  ).value;
                  handleDecline("citizenshipFront", reason);
                }}
              >
                Confirm Decline
              </button>
            </div>
          )}
          {message.citizenshipFront && (
            <p
              className={`mt-4 ${
                message.citizenshipFront.startsWith("Rejected")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {message.citizenshipFront}
            </p>
          )}
        </div>

        {/* Citizenship Back Section */}
        <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
        <h2 className="text-lg font-semibold mb-4">Citizenship Back</h2>

        <img
            src={`http://localhost:3000/${owner.kycId.documents.citizenshipBack.file}`}
            alt={owner.name}
            className="w-60 h-60 object-cover mx-auto mb-4"
            onClick={() => openModal(`http://localhost:3000/${owner.kycId.documents.citizenshipBack.file}`)}
          />
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={() => handleAccept("citizenshipBack")}
            >
              Accept
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => setActiveDecline((prev) => ({
                ...prev,
                citizenshipBack: !prev.citizenshipBack,
              }))}
            >
              Decline
            </button>
          </div>
          {activeDecline.citizenshipBack && (
            <div className="mt-4 border-t pt-4">
              <input
                type="text"
                placeholder="Enter reason for rejection"
                className="w-full px-4 py-2 border rounded mb-2"
              />
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => {
                  const reason = document.querySelector(
                    'input[placeholder="Enter reason for rejection"]'
                  ).value;
                  handleDecline("citizenshipBack", reason);
                }}
              >
                Confirm Decline
              </button>
            </div>
          )}
          {message.citizenshipBack && (
            <p
              className={`mt-4 ${
                message.citizenshipBack.startsWith("Rejected")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {message.citizenshipBack}
            </p>
          )}
        </div>

        {/* Other Details Section */}
        <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
          <h2 className="text-lg font-semibold mb-4">Other Details</h2>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p className="mb-2">
              <strong>Name:</strong> {owner.name}
            </p>
            <p className="mb-2">
              <strong>Phone:</strong> {owner.contactNumber || "N/A"}
            </p>
            <p className="mb-2">
              <strong>Email:</strong> {owner.email}
            </p>
            {/* <p className="mb-2">
              <strong>Address:</strong> Kapan, Kathmandu
            </p> */}
          </div>
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={() => handleAccept("otherDetails")}
            >
              Accept
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => setActiveDecline((prev) => ({
                ...prev,
                otherDetails: !prev.otherDetails,
              }))}
            >
              Decline
            </button>
          </div>
          {activeDecline.otherDetails && (
            <div className="mt-4 border-t pt-4">
              <input
                type="text"
                placeholder="Enter reason for rejection"
                className="w-full px-4 py-2 border rounded mb-2"
              />
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => {
                  const reason = document.querySelector(
                    'input[placeholder="Enter reason for rejection"]'
                  ).value;
                  handleDecline("otherDetails", reason);
                }}
              >
                Confirm Decline
              </button>
            </div>
          )}
          {message.otherDetails && (
            <p
              className={`mt-4 ${
                message.otherDetails.startsWith("Rejected")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {message.otherDetails}
            </p>
          )}
        </div>
      </div>

      {/* DONE Button */}
      <div className="w-full max-w-4xl mt-6 flex justify-left">
        <button
          className={`bg-green-600 text-white px-6 py-2 rounded hover:bg-green-800 ${
            !allSectionsVerified ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!allSectionsVerified}
          onClick={() => {
            if (allSectionsVerified) {
              alert("All sections verified!");
            }
          }}
        >
          DONE
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="relative">
            <img
              src={modalImage}
              alt="Expanded View"
              className="max-w-screen max-h-screen"
            />
            <button
              className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-800 rounded-full p-2"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOwnerProfile;
