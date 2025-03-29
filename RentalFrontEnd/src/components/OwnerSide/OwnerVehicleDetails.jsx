import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditVehicle = () => {
  const navigate = useNavigate();

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
      if (key === "addOns") return;
      if (key === "features") return;
      
      //needs to be updated for a better location service
      if (key === "latitude") return;
      if (key === "longitude") return;



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

    const updatedAddOns = addOns.map((addOn) => ({
      name: addOn.name,
      pricePerDay: isNaN(addOn.pricePerDay) ? 0 : addOn.pricePerDay,
    }));

    form.append("addOns", JSON.stringify(updatedAddOns));
    form.append("features", JSON.stringify(features));

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

  if (!vehicleData) return <div className="text-center text-gray-500 mt-8">Loading vehicle details...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <ToastContainer />
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/ownervehicle")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back
        </button>
        <h2 className="text-3xl font-bold ml-6">Edit Vehicle Details</h2>
      </div>
      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            readOnly
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
        </div>

        <div>
          <label className="block font-semibold mb-1">Type</label>
          <input
            name="type"
            value={formData.type}
            readOnly
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">Category</label>
            <input
              name="category"
              value={formData.category}
              readOnly
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Fuel</label>
            <input
              name="fuel"
              value={formData.fuel}
              readOnly
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Seats</label>
            <input
              type="number"
              name="seats"
              value={formData.seats}
              readOnly
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">Transmission</label>
            <input
              name="transmission"
              value={formData.transmission}
              readOnly
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              readOnly
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Built Year</label>
            <input
              type="number"
              name="builtYear"
              value={formData.builtYear}
              readOnly
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-red-500 mt-1">*This field is uneditable</p>
          </div>
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Built Year</label>
            <input
              type="number"
              name="builtYear"
              value={formData.builtYear || ""}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div> */}

        <div>
            <label className="block font-semibold mb-1">Daily Price</label>
            <input
              type="number"
              name="dailyPrice"
              value={formData.dailyPrice || ""}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

        <div>
          <label className="block font-semibold mb-1">Features</label>
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-4 mb-3">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Feature"
                required
              />
              <button
                type="button"
                onClick={() => handleDeleteFeature(index)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddFeature}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2"
          >
            Add Feature
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Add-Ons</h3>
          {addOns.map((addOn, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 mb-3"
            >
              <input
                type="text"
                placeholder="Add-On Name"
                value={addOn.name}
                onChange={(e) =>
                  handleAddOnChange(index, "name", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Price Per Day"
                value={addOn.pricePerDay}
                onChange={(e) =>
                  handleAddOnChange(index, "pricePerDay", e.target.value)
                }
                className="p-3 border border-gray-300 rounded w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => handleDeleteAddOn(index)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAddOn}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2"
          >
            Add Add-On
          </button>
        </div>

        <div>
          <label className="block font-semibold mb-1">Upload Images</label>
          <input
            type="file"
            name="pictures"
            multiple
            onChange={handleFileChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Vehicle"}
        </button>
      </form>
    </div>
  );
};

export default EditVehicle;
