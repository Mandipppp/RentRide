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
    registrationCertificate: "",
    insuranceCertificate: "",
  });
  const [remData, setRemData] = useState({
    registrationCertificate: { status: "", comments: "" },
    insuranceCertificate: { status: "", comments: "" },
  });
  const [previewImages, setPreviewImages] = useState({
    registrationCertificate: null,
    insuranceCertificate: null
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
          // console.log(vehicleDatas);
        })
        .catch((err) => {
          setError("Failed to fetch vehicle data.");
          toast.error("Failed to fetch vehicle data.");
        });
    }
  }, [vehicleId, navigate]);
  
  useEffect(() => {
    if (vehicleData) {
      setFormData({
        registrationCertificate: vehicleData.registrationCertificate?.file || "",
        insuranceCertificate: vehicleData.insuranceCertificate?.file || "",
      });
  
      setRemData({
        registrationCertificate: {
          status: vehicleData.registrationCertificate?.status || "pending",
          comments: vehicleData.registrationCertificate?.comments || "",
        },
        insuranceCertificate: {
          status: vehicleData.insuranceCertificate?.status || "pending",
          comments: vehicleData.insuranceCertificate?.comments || "",
        },
      });
    }
  }, [vehicleData]);
  

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

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImages(prev => ({
          ...prev,
          [id]: reader.result
        }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const canSubmit = () => {
    const regRejected = remData.registrationCertificate.status === "Rejected";
    const insRejected = remData.insuranceCertificate.status === "Rejected";
    const regUploaded = formData.registrationCertificate instanceof File;
    const insUploaded = formData.insuranceCertificate instanceof File;
  
    // If both rejected, both must be uploaded
    if (regRejected && insRejected) {
      return regUploaded && insUploaded;
    }
    
    // If only registration is rejected, it must be uploaded
    if (regRejected) {
      return regUploaded;
    }
    
    // If only insurance is rejected, it must be uploaded
    if (insRejected) {
      return insUploaded;
    }
  
    return false;
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
    let missingDocs = [];

    if (remData.registrationCertificate.status === "Rejected") {
      if (formData.registrationCertificate instanceof File) {
        updatePayload.append("registrationCert", formData.registrationCertificate);
      } else {
        missingDocs.push("Registration Certificate");
      }
    }

    if (remData.insuranceCertificate.status === "Rejected") {
      if (formData.insuranceCertificate instanceof File) {
        updatePayload.append("insuranceCert", formData.insuranceCertificate);
      } else {
        missingDocs.push("Insurance Certificate");
      }
    }

    if (missingDocs.length > 0) {
      toast.error(`Please upload all rejected documents: ${missingDocs.join(", ")}`);
      return;
    }

    if ([...updatePayload.keys()].length === 0) {
      toast.info("No changes made.");
      return;
    }
  
    // console.log([...updatePayload.entries()]); // Debugging payload
  
    axios
      .put(`http://localhost:3000/api/owner/updatevehicle/${vehicleId}`, updatePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setvehicleData(response.data.updatedVehicle);
        toast.success("Vehicle updated successfully!");
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to update vehicle. Please try again.");
      });
  };
  

  return (
    <section className="flex-1 bg-white shadow-md rounded-md p-6">
      <ToastContainer />
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/ownervehicle")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back
        </button>
        <h2 className="text-2xl font-bold ml-4">Vehicle Document Details</h2>
      </div>
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
              <label htmlFor="registrationCertificate" className="block text-gray-700 font-medium">
                Registration Certificate{" "}
              {remData.registrationCertificate.status && (
                <span
                  className={
                    remData.registrationCertificate.status === "Rejected"
                      ? "text-red-500"
                      : remData.registrationCertificate.status === "Verified"
                      ? "text-green-500"
                      : "text-yellow-500"
                  }
                >
                  ({remData.registrationCertificate.status.toUpperCase()}: {remData.registrationCertificate.comments || "No comments"})
                </span>
              )}
              </label>
              {/* {formData.registrationCertificate && (
                <img
                  src={`http://localhost:3000/${formData.registrationCertificate}`}
                  alt="Registration Certificate"
                  className="w-60 h-44 border mt-2"
                />
              )} */}
              {(previewImages.registrationCertificate || formData.registrationCertificate) && (
                <img
                  src={previewImages.registrationCertificate || `http://localhost:3000/${formData.registrationCertificate}`}
                  alt="Registration Certificate"
                  className="w-60 h-44 border mt-2 object-contain"
                />
              )}

              {remData.registrationCertificate.status === "Rejected" && (
              <input
                type="file"
                id="registrationCertificate"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
              />)}
            </div>

            <div>
              <label htmlFor="insuranceCertificate" className="block text-gray-700 font-medium">
                Insurance Certificate{" "}
              {remData.insuranceCertificate.status && (
                <span
                  className={
                    remData.insuranceCertificate.status === "Rejected"
                      ? "text-red-500"
                      : remData.insuranceCertificate.status === "Verified"
                      ? "text-green-500"
                      : "text-yellow-500"
                  }
                >
                  ({remData.insuranceCertificate.status.toUpperCase()}: {remData.insuranceCertificate.comments || "No comments"})
                </span>
              )}
              </label>
              {/* {formData.insuranceCertificate && (
                <img
                  src={`http://localhost:3000/${formData.insuranceCertificate}`}
                  alt="Citizenship Front"
                  className="w-60 h-44 border mt-2"
                />
              )} */}
              {(previewImages.insuranceCertificate || formData.insuranceCertificate) && (
                <img
                  src={previewImages.insuranceCertificate || `http://localhost:3000/${formData.insuranceCertificate}`}
                  alt="Insurance Certificate"
                  className="w-60 h-44 border mt-2 object-contain"
                />
              )}
              {remData.insuranceCertificate.status === "Rejected" && (
              <input
                type="file"
                id="insuranceCertificate"
                accept="image/*"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
              />)}
            </div>
          </div>
        
          {(remData.registrationCertificate.status === "Rejected" || 
            remData.insuranceCertificate.status === "Rejected") && (
            <button
              type="submit"
              className={`w-full text-white rounded-md py-2 ${
                canSubmit()
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!canSubmit()}
            >
              {canSubmit() ? "Update Documents" : "Upload All Rejected Documents"}
            </button>
          )}
      </form>
    </section>
  );
}

export default OwnerVehicleDocuments;
