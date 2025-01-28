import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';

function OwnerVehicleDocuments() {
    const { vehicleId } = useParams();
  const [vehicleData, setvehicleData] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    profilePicture: "",
    citizenshipFront: "",
  });
  const [remData, setRemData] = useState({
    profilePicture: { status: "", comments: "" },
    citizenshipFront: { status: "", comments: "" },
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      navigate("/login");
    } else {
      axios
        .get(`http://localhost:3000/api/owner/vehicle/${vehicleId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          const vehicleDatas = response.data.data;
          setvehicleData(vehicleDatas);
        //   console.log(vehicleData?.insuranceCertificate?.file);
  
          setFormData({
            profilePicture: vehicleData?.registrationCertificate?.file || "",
            citizenshipFront: vehicleData?.insuranceCertificate?.file || "",
          });

          setRemData({
            profilePicture: {
              status: vehicleData?.registrationCertificate?.status || "pending",
              comments: vehicleData?.registrationCertificate?.comments || "",
            },
            citizenshipFront: {
              status: vehicleData?.insuranceCertificate?.status || "pending",
              comments: vehicleData?.insuranceCertificate?.comments || "",
            },
          });
          
        })
        .catch((err) => {
          setError("Failed to fetch vehicle data.");
          toast.error("Failed to fetch vehicle data.");
        });
    }
  }, [navigate]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!vehicleData) {
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

    if (remData.profilePicture.status === "Rejected" && formData.profilePicture instanceof File) {
      updatePayload.append("registationCert", formData.profilePicture);
    }
    if (remData.citizenshipFront.status === "Rejected" && formData.citizenshipFront instanceof File) {
      updatePayload.append("insuranceCert", formData.citizenshipFront);
    }
  
    if ([...updatePayload.keys()].length === 0) {
      toast.info("No changes made.");
      return;
    }
  
    console.log([...updatePayload.entries()]); // Debugging payload
  
    axios
      .put(`http://localhost:3000/api/owner/updatevehicle/${vehicleId}`, updatePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setvehicleData(response.data);
        toast.success("Vehicle updated successfully!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to update vehicle. Please try again.");
      });
  };
  

  return (
    <section className="flex-1 bg-white shadow-md rounded-md p-6">
      <ToastContainer />
      <h2 className="text-2xl font-bold">Vehicle Document Details</h2>
      <span
      className={
    vehicleData?.registrationCertificate?.status === "Verified" &&  vehicleData?.insuranceCertificate?.status === "Verified"
        ? "text-green-500 text-sm"
        : vehicleData?.registrationCertificate?.status === "Rejected" &&  vehicleData?.insuranceCertificate?.status === "Rejected"
        ? "text-red-500 text-sm"
        : "text-yellow-500 text-sm"
        }>
        {vehicleData?.registrationCertificate?.status === "Verified" &&  vehicleData?.insuranceCertificate?.status === "Verified"
        ? "*Your Vehicle is verified."
        : vehicleData?.registrationCertificate?.status === "Rejected" &&  vehicleData?.insuranceCertificate?.status === "Rejected"
        ? "*Your Vehicle was rejected."
        : "*Your Vehicle verification is pending."}
    </span>
      <form className="flex flex-col gap-6 mt-6" onSubmit={handleSubmit}>
        
          <div className='flex flex-col gap-6'>
            <div>
              <label htmlFor="profilePicture" className="block text-gray-700 font-medium">
                Registration Certificate{" "}
              {remData.profilePicture.status && (
                <span
                  className={
                    remData.profilePicture.status === "Rejected"
                      ? "text-red-500"
                      : remData.profilePicture.status === "Verified"
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
                  alt="Registration Certificate"
                  className="w-32 h-32 rounded-full border mt-2"
                />
              )}
              {remData.profilePicture.status === "Rejected" && (
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
                Insurance Certificate{" "}
              {remData.citizenshipFront.status && (
                <span
                  className={
                    remData.citizenshipFront.status === "Rejected"
                      ? "text-red-500"
                      : remData.citizenshipFront.status === "Verified"
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
              {remData.citizenshipFront.status === "Rejected" && (
              <input
                type="file"
                id="citizenshipFront"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
              />)}
            </div>
          </div>
        
          {vehicleData?.registrationCertificate?.status === "Rejected" ||  vehicleData?.insuranceCertificate?.status === "Rejected" && (
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

export default OwnerVehicleDocuments;
