import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';

const AdminVehicleDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [accessToken, setAccessToken] = useState("");
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const vehicleId = id;
  
    const [verificationStatus, setVerificationStatus] = useState({
      registrationCertificate: false,
      insuranceCertificate: false,
    });
  
    const [visitedStatus, setVisitedStatus] = useState({
      registrationCertificate: false,
      insuranceCertificate: false,
    });
  
    const [message, setMessage] = useState({
      registrationCertificate: "",
      insuranceCertificate: "",
    });
  
    const [activeDecline, setActiveDecline] = useState({
      registrationCertificate: false,
      insuranceCertificate: false,
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
      const url = `http://localhost:3000/api/admin/vehicle/${vehicleId}`;
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setVehicle(res.data.data);
          setLoading(false);
          console.log(res.data.data);
        })
        .catch((error) => {
          console.error("Error fetching vehicle details:", error);
          setVehicle(null);
          setLoading(false);
          toast.error("Error loading vehicle details. Please try again later.");
        });
    };
  
    const handleSubmit = async () => {
      const updates = {};
      for (const section in verificationStatus) {
        if (visitedStatus[section] && verificationStatus[section] !== undefined) {
          updates[section] = {
            status: verificationStatus[section] ? "Verified" : "Rejected",
            reason: message[section].startsWith("Rejected")
              ? message[section].split(": ")[1]
              : "",
          };
        }
      }
      console.log("updates: ", updates);
  
      if (Object.keys(updates).length === 0) {
        toast.warn("No changes made.");
        return;
      }
  
      try {
        // Prepare the payload dynamically based on available updates
        const payload = {};

        if (updates.registrationCertificate?.status) {
          payload.registrationStatus = updates.registrationCertificate.status;
          payload.registrationCertificateComments = updates.registrationCertificate.reason || ''; // Optional comment
        }

        if (updates.insuranceCertificate?.status) {
          payload.insuranceStatus = updates.insuranceCertificate.status;
          payload.insuranceCertificateComments = updates.insuranceCertificate.reason || ''; // Optional comment
        }

        // Make the API request only with the necessary fields
        const response = await axios.put(
          `http://localhost:3000/api/admin/verify-vehicle/${vehicle._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        toast.success(response.data.message);

        // Reload the page after a successful response
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error updating Vehicle:", error.response?.data || error.message);
        toast.error("Failed to update Vehicle. Please try again.");
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
  
    const allPendingSectionsVisited = ["registrationCertificate", "insuranceCertificate"].every(
        (section) => {
          const document = vehicle?.[section];
          return (
            document?.status !== "Pending" || visitedStatus[section]
          );
        }
      );
      
      
  
    const isDoneButtonDisabled = vehicle?.registrationCertificate?.status == "Pending" || vehicle?.insuranceCertificate?.status == "Pending";
  
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
  
    if (!vehicle) {
      return <div>Error loading vehicle details. Please try again later.</div>;
    }
  
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-left">
        <div className="flex items-center w-full max-w-4xl mb-6">
          <button
            className="mr-4 text-blue-800 hover:underline"
            onClick={() => navigate("/adminvehicles")}
          >
            Back
          </button>
          <h1 className="text-4xl font-bold">Vehicles/ Profile</h1>
        </div>
  
        <div className="flex flex-wrap justify-left gap-6 w-full">
          <ToastContainer />
  
          {["registrationCertificate", "insuranceCertificate"].map((section) => {
            const status = vehicle?.[section]?.status;
            const comments = vehicle?.[section]?.comments;
            return (
              <div
                key={section}
                className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3"
              >
                <h2 className="text-lg font-semibold mb-4">
                {section
                .replace(/([A-Z])/g, " $1") // Add space between camel case words
                .replace(/^./, (str) => str.toUpperCase())} {/* Capitalize first letter */}
                </h2>
                <img
                  src={`http://localhost:3000/${vehicle?.[section]?.file}`}
                  alt={vehicle.name}
                  className="w-60 h-60 object-cover mx-auto mb-4"
                  onClick={() =>
                    openModal(`http://localhost:3000/${vehicle?.[section]?.file}`)
                  }
                />
                <div className="flex justify-between">
                  {(vehicle.status != "Deleted" && status === "Pending") && (
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
  
                {status === "Rejected" && comments && (
                  <p className="mt-4 text-red-500">{comments}</p>
                )}
                {status === "Verified" && (
                  <p className="mt-4 text-green-500">Accepted</p>
                )}
                {vehicle?.[section]?.verifiedBy && (
                    <p className="mt-4">
                    <strong>Verified By:</strong> {vehicle[section].verifiedBy.name}
                    </p>
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
          })}
  
          {/* Display additional images */}
          {vehicle?.imageUrls && vehicle.imageUrls.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
              <h2 className="text-lg font-semibold mb-4">Vehicles Images</h2>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.imageUrls.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={`http://localhost:3000/${image}`}
                      alt={`Vehicle Image ${index + 1}`}
                      className="w-full h-32 object-cover mb-4 rounded"
                      onClick={() => openModal(`http://localhost:3000/${image}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
  
          <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
            <h2 className="text-lg font-semibold mb-4">Other Details</h2>
            <div className="bg-gray-100 p-4 rounded mb-4">
              <p className="mb-2">
                <strong>Name:</strong> {vehicle.name}
              </p>
              <p className="mb-2">
                <strong>Registration Number:</strong> {vehicle.registrationNumber}
              </p>
              <p className="mb-2">
                <strong>Type:</strong> {vehicle.type || "N/A"}
              </p>
              <p className="mb-2">
                <strong>Category:</strong> {vehicle.category}
              </p>
              <p className="mb-2">
                <strong>Brand:</strong> {vehicle.brand || "N/A"}
              </p>
              <p className="mb-2">
                <strong>Fuel:</strong> {vehicle.fuel || "N/A"}
              </p>
              <p className="mb-2">
                <strong>Built Year:</strong> {vehicle.builtYear || "N/A"}
              </p>
            </div>
          </div>
        </div>
  
        {(vehicle.status != "Deleted" && isDoneButtonDisabled) && (
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
          </div>
        )}
  
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
                x
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default AdminVehicleDetails;
  
