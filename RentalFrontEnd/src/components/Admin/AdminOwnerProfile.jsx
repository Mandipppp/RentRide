import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';

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
  });

  const [visitedStatus, setVisitedStatus] = useState({
    profilePicture: false,
    citizenshipFront: false,
    citizenshipBack: false,
  });

  const [message, setMessage] = useState({
    profilePicture: "",
    citizenshipFront: "",
    citizenshipBack: "",
  });

  const [activeDecline, setActiveDecline] = useState({
    profilePicture: false,
    citizenshipFront: false,
    citizenshipBack: false,
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
        toast.error("Error loading owner details. Please try again later.");
      });
  };

  const handleSubmit = async () => {
    const updates = {};
    for (const section in verificationStatus) {
      if (visitedStatus[section] && verificationStatus[section] !== undefined) {
      updates[section] = {
        status: verificationStatus[section] ? "verified" : "rejected",
        reason: message[section].startsWith("Rejected") ? message[section].split(": ")[1] : "",
      };
    }
    }

    if (Object.keys(updates).length === 0) {
      toast.warn("No changes made.");
      return;
    }
  
    try {
      const response = await axios.post(
        `http://localhost:3000/api/admin/kyc/${owner._id}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success(response.data.message);
    } catch (error) {
      console.error("Error updating KYC:", error.response?.data || error.message);
      toast.error("Failed to update KYC. Please try again.");
    }
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
    setVisitedStatus((prev) => ({
      ...prev,
      [section]: true,
    }));
  };

  const handleDecline = (section, reason) => {
    if (reason.trim() === "") {
      toast.warn("Please enter a reason for rejection");
      return;
    }
    setMessage((prev) => ({
      ...prev,
      [section]: `Rejected: ${reason}`,
    }));
    setVerificationStatus((prev) => ({
      ...prev,
      [section]: false,
    }));
    setVisitedStatus((prev) => ({
      ...prev,
      [section]: true,
    }));
    setActiveDecline((prev) => ({
      ...prev,
      [section]: false,
    }));
  };

  const allPendingSectionsVisited = owner?.kycId?.documents 
    ? Object.keys(owner.kycId.documents).every((section) => {
        const status = owner.kycId.documents[section].status;
        return status !== "pending" || visitedStatus[section];
      })
    : true; // Return true if owner.kycId.documents is not available (for safety)

  const isDoneButtonDisabled = owner?.kycId?.overallStatus == "pending";

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
      <div className="flex items-center w-full max-w-4xl mb-6">
        <button
          className="mr-4 text-blue-800 hover:underline"
          onClick={() => navigate("/adminowners")}
        >
          Back
        </button>
        <h1 className="text-4xl font-bold">Owners/ Profile</h1>
      </div>

      <div className="flex flex-wrap justify-left gap-6 w-full">
        <ToastContainer />
        
        {["profilePicture", "citizenshipFront", "citizenshipBack"].map(
          (section) => {
            const status = owner?.kycId?.documents[section]?.status;
            const comments = owner?.kycId?.documents[section]?.comments;
            return (
              <div
                key={section}
                className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3"
              >
                <h2 className="text-lg font-semibold mb-4">
                  {section.replace(/([A-Z])/g, " $1")}
                </h2>
                <img
                  src={`http://localhost:3000/${owner?.kycId?.documents[section]?.file}`}
                  alt={owner.name}
                  className="w-60 h-60 object-cover mx-auto mb-4"
                  onClick={() =>
                    openModal(
                      `http://localhost:3000/${owner?.kycId?.documents[section]?.file}`
                    )
                  }
                />
                <div className="flex justify-between">
                  {status === "pending" && (
                    <>
                      <button
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        onClick={() => handleAccept(section)}
                      >
                        Accept
                      </button>
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        onClick={() =>
                          setActiveDecline((prev) => ({
                            ...prev,
                            [section]: !prev[section],
                          }))
                        }
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>

                {activeDecline[section] && (
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
                        handleDecline(section, reason);
                      }}
                    >
                      Confirm Decline
                    </button>
                  </div>
                )}
                
                {status === "rejected" && comments && (
                  <p className="mt-4 text-red-500">{comments}</p>
                )}
                {status === "verified" && (
                  <p className="mt-4 text-green-500">Accepted</p>
                )}
                {message[section] && (
                  <p
                    className={`mt-4 ${
                      message[section].startsWith("Rejected")
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {message[section]}
                  </p>
                )}
              </div>
            );
          }
        )}

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
          </div>
        </div>
      </div>

        {isDoneButtonDisabled &&(
      <div className="w-full max-w-4xl mt-6 flex justify-left">
        <button
          className={`bg-green-600 text-white px-6 py-2 rounded hover:bg-green-800 ${
            !allPendingSectionsVisited ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!allPendingSectionsVisited}
          onClick={handleSubmit}
        >
          DONE
        </button>
      </div>)}

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
