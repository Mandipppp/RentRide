import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from 'react-toastify';


const EditVehicle = () => {
    const { vehicleId } = useParams();
    const [vehicleData, setVehicleData] = useState(null);
    const [formData, setFormData] = useState({});
    const [addOns, setAddOns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState("");
    const [features, setFeatures] = useState([]);
  
    useEffect(() => {
      const access_token = reactLocalStorage.get("access_token");
      if (access_token) {
        setToken(access_token);
      }
    }, []);
  
    useEffect(() => {
      if (token) {
        const fetchVehicle = async () => {
          try {
            const response = await axios.get(
              `http://localhost:3000/api/owner/vehicle/${vehicleId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const { data } = response.data;
            setVehicleData(data);
            setFormData(data);
            setAddOns(data.addOns || []);
            setFeatures(data.features || []);
          } catch (err) {
            setError("Failed to fetch vehicle details.");
          }
        };
        fetchVehicle();
      }
    }, [vehicleId, token]);
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };
  
    const handleFileChange = (e) => {
      const { name } = e.target;
      setFormData({ ...formData, [name]: e.target.files });
    };
  
    const handleAddOnChange = (index, field, value) => {
      const updatedAddOns = [...addOns];
      if (field === "pricePerDay") {
        updatedAddOns[index][field] = value ? Number(value) : "";
      } else {
        updatedAddOns[index][field] = value;
      }
      setAddOns(updatedAddOns);
    };
  
    const handleAddAddOn = () => {
      setAddOns([...addOns, { name: "", pricePerDay: "" }]);
    };

    const handleFeatureChange = (index, value) => {
        const updatedFeatures = [...features];
        updatedFeatures[index] = value;
        setFeatures(updatedFeatures);
      };

      const handleAddFeature = () => {
        setFeatures([...features, ""]);
      };

      const handleDeleteFeature = (index) => {
        const updatedFeatures = features.filter((_, i) => i !== index);
        setFeatures(updatedFeatures);
      };
  
    const handleDeleteAddOn = (index) => {
      const updatedAddOns = addOns.filter((_, i) => i !== index);
      setAddOns(updatedAddOns);
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
  
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'addOns') return;
        if (key === 'features') return;

        if (formData[key] instanceof FileList) {
          for (let i = 0; i < formData[key].length; i++) {
            form.append(key, formData[key][i]);
          }
        } else if (Array.isArray(formData[key])) {
          form.append(key, JSON.stringify(formData[key]));
        } else {
          form.append(key, formData[key]);
        }
      });
  
     // Ensure addOns is properly formatted and pricePerDay is a number
  const updatedAddOns = addOns.map(addOn => ({
    name: addOn.name,
    pricePerDay: isNaN(addOn.pricePerDay) ? 0 : addOn.pricePerDay, // Default to 0 if NaN
  }));

  form.append("addOns", JSON.stringify(updatedAddOns));
  form.append("features", JSON.stringify(features));

  // Logging the FormData object
  console.log("Form data being sent:");
  for (let pair of form.entries()) {
    console.log(pair[0] + ": ", pair[1]);
  } 
  
      try {
        const response = await axios.put(
          `http://localhost:3000/api/owner/updatevehicle/${vehicleId}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Vehicle details updated successfully!");
        setVehicleData(response.data.updatedVehicle);
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to update vehicle details."
        );
      } finally {
        setLoading(false);
      }
    };

  if (!vehicleData) return <div>Loading vehicle details...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-4">Edit Vehicle Details</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {/* {success && <div className="text-green-500 mb-4">{success}</div>} */}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Type</label>
          <select
            name="type"
            value={formData.type || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="SUV">SUV</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Category</label>
          <select
            name="category"
            value={formData.category || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="Two-Wheeler">Two-Wheeler</option>
            <option value="Four-Wheeler">Four-Wheeler</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Fuel</label>
          <select
            name="fuel"
            value={formData.fuel || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Transmission</label>
          <select
            name="transmission"
            value={formData.transmission || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Brand</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Built Year</label>
          <input
            type="text"
            name="builtYear"
            value={formData.builtYear || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Daily Price</label>
          <input
            type="number"
            name="dailyPrice"
            value={formData.dailyPrice || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Features</label>
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-4 mb-2 p-2 border rounded">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="Feature"
                required
              />
              <button
                type="button"
                onClick={() => handleDeleteFeature(index)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddFeature}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Feature
          </button>
        </div>

         {/* Add-Ons Section */}
         <div>
          <h3 className="text-lg font-medium mb-2">Add-Ons</h3>
          {addOns.map((addOn, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 mb-2 p-2 border rounded"
            >
              <input
                type="text"
                placeholder="Add-On Name"
                value={addOn.name}
                onChange={(e) =>
                  handleAddOnChange(index, "name", e.target.value)
                }
                className="p-2 border rounded w-full"
                required
              />
              <input
                type="number"
                placeholder="Price Per Day"
                value={addOn.pricePerDay}
                onChange={(e) =>
                  handleAddOnChange(index, "pricePerDay", e.target.value)
                }
                className="p-2 border rounded w-32"
                required
              />
              <button
                type="button"
                onClick={() => handleDeleteAddOn(index)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAddOn}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Add-On
          </button>
        </div>

        <div>
          <label className="block font-medium">Upload Images</label>
          <input
            type="file"
            name="pictures"
            multiple
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Vehicle"}
        </button>
      </form>
    </div>
  );
};

export default EditVehicle;
