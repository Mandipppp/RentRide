import React, { useState } from "react";

const AddVehicleStep1 = ({ onNext, onCancel }) => {
  const [vehicleDetails, setVehicleDetails] = useState({
    category: "",
    type: "",
    builtYear: "",
    name: "",
    pictures: null,
    registrationCert: null,
    insuranceCert: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleDetails({ ...vehicleDetails, [name]: value });
  };

  const handleFileChange = (e, field) => {
    setVehicleDetails({ ...vehicleDetails, [field]: e.target.files });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">My Vehicles / Add Vehicle</h1>
      
      {/* Category Selection */}
      <div className="flex gap-4 mb-4">
        <button
          className={`py-2 px-4 rounded ${vehicleDetails.category === "Two Wheeler" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
          onClick={() => setVehicleDetails({ ...vehicleDetails, category: "Two Wheeler" })}
        >
          Two Wheeler
        </button>
        <button
          className={`py-2 px-4 rounded ${vehicleDetails.category === "Four Wheeler" ? "bg-gray-800 text-white" : "bg-gray-200"}`}
          onClick={() => setVehicleDetails({ ...vehicleDetails, category: "Four Wheeler" })}
        >
          Four Wheeler
        </button>
      </div>

      {/* Vehicle Type and Built Year */}
      <div className="flex gap-4 mb-4">
        <select
          name="type"
          className="border px-4 py-2 rounded w-1/2"
          onChange={handleInputChange}
        >
          <option value="">Select Type</option>
          <option value="Sedan">Sedan</option>
          <option value="SUV">SUV</option>
          <option value="Bike">Bike</option>
        </select>
        <input
          type="text"
          name="brand"
          placeholder="Brand"
          value={vehicleDetails.builtYear}
          className="border px-4 py-2 rounded w-1/2"
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="builtYear"
          placeholder="Built Year"
          value={vehicleDetails.builtYear}
          className="border px-4 py-2 rounded w-1/2"
          onChange={handleInputChange}
        />
      </div>

    <div className="flex gap-4 mb-4">
      {/* Vehicle Name */}
      <input
        type="text"
        name="name"
        placeholder="Vehicle Name"
        className="border px-4 py-2 rounded w-1/2 mb-4"
        onChange={handleInputChange}
      />

       {/* Vehicle Name */}
       <input
        type="number"
        name="registrationNumber"
        placeholder="Registration Number"
        className="border px-4 py-2 rounded w-1/2 mb-4"
        onChange={handleInputChange}
      />
      </div>

      {/* Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <UploadField label="Upload Pictures" onChange={(e) => handleFileChange(e, "pictures")} />
        <UploadField label="Upload Registration Certificate" onChange={(e) => handleFileChange(e, "registrationCert")} />
        <UploadField label="Upload Insurance Certificate" onChange={(e) => handleFileChange(e, "insuranceCert")} />
      </div>

      {/* Buttons */}
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={onCancel}>
          Cancel
        </button>
        <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
};

const UploadField = ({ label, onChange }) => (
  <div>
    <label className="block font-semibold mb-2">{label}</label>
    <div className="border rounded p-4 flex items-center justify-center cursor-pointer">
      <input type="file" onChange={onChange} className="hidden" />
      <div className="text-gray-500 text-center">
        <span className="text-2xl">⬆️</span>
        <p className="text-sm">Drag & drop or click to upload</p>
      </div>
    </div>
  </div>
);

export default AddVehicleStep1;
