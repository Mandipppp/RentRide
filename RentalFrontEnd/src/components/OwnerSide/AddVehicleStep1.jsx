import React, { useState } from "react";

const AddVehicleStep1 = ({
  vehicleDetails,
  setVehicleDetails,
  onNext,
  onCancel,
}) => {
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleDetails({ ...vehicleDetails, [name]: value });
  };

  const handleFileChange = (files, field) => {
    if (files && files.length > 0) {
      setVehicleDetails((prevDetails) => ({
        ...prevDetails,
        [field]: files,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if required fields are filled
    if (!vehicleDetails.category) newErrors.category = "Category is required.";
    if (!vehicleDetails.type) newErrors.type = "Vehicle type is required.";
    if (!vehicleDetails.brand) newErrors.brand = "Brand is required.";
    if (
      !vehicleDetails.builtYear ||
      vehicleDetails.builtYear < 1900 ||
      vehicleDetails.builtYear > new Date().getFullYear()
    ) {
      newErrors.builtYear = "Enter a valid built year.";
    }
    if (!vehicleDetails.name) newErrors.name = "Vehicle Name is required.";
    if (!vehicleDetails.registrationNumber)
      newErrors.registrationNumber = "Registration Number is required.";
    if (!vehicleDetails.pictures || vehicleDetails.pictures.length === 0)
      newErrors.pictures = "At least one picture is required.";
    if (!vehicleDetails.registrationCert || vehicleDetails.registrationCert.length === 0)
      newErrors.registrationCert = "Registration Certificate is required.";
    if (!vehicleDetails.insuranceCert || vehicleDetails.insuranceCert.length === 0)
      newErrors.insuranceCert = "Insurance Certificate is required.";

    setErrors(newErrors);

    // Return true if there are no errors, false if there are errors
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Validate the form before moving to the next step
    if (validateForm()) {
      onNext(); // Proceed to the next step if validation passes
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">My Vehicles / Add Vehicle</h1>

      {/* Category Selection */}
      <div className="flex gap-4">
        <button
          className={`py-2 px-4 rounded ${
            vehicleDetails.category === "Two Wheeler"
              ? "bg-gray-800 text-white"
              : "bg-gray-200"
          }`}
          onClick={() =>
            setVehicleDetails({ ...vehicleDetails, category: "Two Wheeler" })
          }
        >
          Two Wheeler
        </button>
        <button
          className={`py-2 px-4 rounded ${
            vehicleDetails.category === "Four Wheeler"
              ? "bg-gray-800 text-white"
              : "bg-gray-200"
          }`}
          onClick={() =>
            setVehicleDetails({ ...vehicleDetails, category: "Four Wheeler" })
          }
        >
          Four Wheeler
        </button>
      </div>
      {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}

      {/* Vehicle Type and Built Year */}
      <div className="flex gap-4 mb-4 mt-4">
        <div className="w-1/2">
          <select
            name="type"
            className="border px-4 py-2 rounded w-full"
            value={vehicleDetails.type || ""}
            onChange={handleInputChange}
          >
            <option value="">Select Type</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Bike">Bike</option>
          </select>
          {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
        </div>

        <div className="w-1/2">
          <input
            type="text"
            name="brand"
            placeholder="Brand"
            value={vehicleDetails.brand || ""}
            className="border px-4 py-2 rounded w-full"
            onChange={handleInputChange}
          />
          {errors.brand && <p className="text-red-500 text-sm">{errors.brand}</p>}
        </div>

        <div className="w-1/2">
          <input
            type="number"
            name="builtYear"
            placeholder="Built Year"
            value={vehicleDetails.builtYear || ""}
            className="border px-4 py-2 rounded w-full"
            onChange={handleInputChange}
          />
          {errors.builtYear && <p className="text-red-500 text-sm">{errors.builtYear}</p>}
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-1/2">
          {/* Vehicle Name */}
          <input
            type="text"
            name="name"
            placeholder="Vehicle Name"
            className="border px-4 py-2 rounded w-full"
            value={vehicleDetails.name || ""}
            onChange={handleInputChange}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div className="w-1/2">
          {/* Registration Number */}
          <input
            type="text"
            name="registrationNumber"
            placeholder="Registration Number"
            className="border px-4 py-2 rounded w-full"
            value={vehicleDetails.registrationNumber || ""}
            onChange={handleInputChange}
          />
          {errors.registrationNumber && (
            <p className="text-red-500 text-sm">{errors.registrationNumber}</p>
          )}
        </div>
      </div>

      {/* Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1">
          <UploadField
            label="Upload Pictures"
            multiple={true}
            onChange={(files) => handleFileChange(files, "pictures")}
          />
          {errors.pictures && <p className="text-red-500 text-sm">{errors.pictures}</p>}
        </div>

        <div className="col-span-1">
          <UploadField
            label="Upload Registration Certificate"
            onChange={(files) => handleFileChange(files, "registrationCert")}
          />
          {errors.registrationCert && (
            <p className="text-red-500 text-sm">{errors.registrationCert}</p>
          )}
        </div>

        <div className="col-span-1">
          <UploadField
            label="Upload Insurance Certificate"
            onChange={(files) => handleFileChange(files, "insuranceCert")}
          />
          {errors.insuranceCert && (
            <p className="text-red-500 text-sm">{errors.insuranceCert}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={handleNext} // Use handleNext to validate before proceeding
        >
          Next
        </button>
      </div>
    </div>
  );
};

const UploadField = ({ label, onChange, multiple = false }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    setUploadedFiles((prev) =>
      multiple ? [...prev, ...fileArray] : fileArray.slice(0, 1)
    );
    onChange(multiple ? [...uploadedFiles, ...fileArray] : fileArray);
  };

  return (
    <div>
      <label className="block font-semibold mb-2">{label}</label>
      <div className="border rounded p-4">
        <input
          type="file"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="block w-full"
        />
        {uploadedFiles.length > 0 && (
          <div className="mt-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="text-sm">
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddVehicleStep1;
