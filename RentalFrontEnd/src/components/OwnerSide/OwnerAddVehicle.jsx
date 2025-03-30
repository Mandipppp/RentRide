import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import LocationInput from "../UserSide/LocationInput";


const AddVehicleForm = () => {
  const [vehicleData, setVehicleData] = useState({
    name: "",
    type: "Car",
    category: "Four-Wheeler",
    fuel: "Petrol",
    transmission: "Manual",
    brand: "",
    builtYear: "",
    mileage: "",
    seats: 2,
    registrationNumber: "",
    description: "",
    dailyPrice: "",
    minRentalPeriod: 1,
    maxRentalPeriod: "",
    features: [],
    addOns: [],
    condition: "Good",
    status: "Available",
    pickupLocation: "",
    latitude: "",
    longitude: "",
    registrationCert: null,
    insuranceCert: null,
    pictures: [],
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [addOnsList, setAddOnsList] = useState([{ name: "", pricePerDay: "" }]);
  const [featuresList, setFeaturesList] = useState([{ name: "" }]);
  const [showDialog, setShowDialog] = useState(false);
  const [location, setLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // if (name === "features") {
    //   // Convert comma-separated values into an array
    //   const featuresArray = value.split(",")
    //   .map((feature) => feature.trim())
    //   // .filter(feature => feature !== '');
      
    //   setVehicleData({
    //     ...vehicleData,
    //     [name]: featuresArray,
    //   });
    // } else {
      setVehicleData({
        ...vehicleData,
        [name]: value,
      });
    // }
  };



  const handleYearChange = (date) => {
    setVehicleData({
      ...vehicleData,
      builtYear: date.getFullYear(), // Store only the year
    });
  };

   const handleAddOnChange = (index, e) => {
    const { name, value } = e.target;
    const updatedAddOnsList = [...addOnsList];
    updatedAddOnsList[index] = { ...updatedAddOnsList[index], [name]: value };
    setAddOnsList(updatedAddOnsList);
  };

  const handleFeatureChange = (index, e) => {
    const { value } = e.target;
    const updatedFeaturesList = [...featuresList];
    updatedFeaturesList[index] = { name: value };
    setFeaturesList(updatedFeaturesList);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === "pictures") {
      setVehicleData({
        ...vehicleData,
        [name]: files,
      });
    } else {
      setVehicleData({
        ...vehicleData,
        [name]: files[0],
      });
    }
  };

  const handleAddAddOn = () => {
    setAddOnsList([...addOnsList, { name: "", pricePerDay: "" }]);
  };

  const handleRemoveAddOn = (index) => {
    const updatedAddOnsList = addOnsList.filter((_, i) => i !== index);
    setAddOnsList(updatedAddOnsList);
  };

  // Add a new feature field
  const handleAddFeature = () => {
    setFeaturesList([...featuresList, { name: "" }]);
  };

  // Remove a feature field
  const handleRemoveFeature = (index) => {
    const updatedFeaturesList = featuresList.filter((_, i) => i !== index);
    setFeaturesList(updatedFeaturesList);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert addOns array to JSON before submitting
    const formData = new FormData();
    // Convert addOnsList to JSON and add to vehicleData
    vehicleData.addOns = JSON.stringify(addOnsList);

    // vehicleData.features = JSON.stringify(vehicleData.features);
    // Ensure features is always an array before stringifying
    // const featuresToSubmit = Array.isArray(vehicleData.features) 
    //   ? vehicleData.features 
    //   : [];

    const featuresArray = featuresList
      .map(feature => feature.name.trim())
      .filter(name => name !== '');
    
    // Convert features to JSON
    vehicleData.features = JSON.stringify(featuresArray);

    if((location==null)){
      toast.error("No Location Selected!!!");
      return;
    }
    
    vehicleData.pickupLocation = location.name || "";
    vehicleData.latitude = location.lat || "";
    vehicleData.longitude = location.lon || "";
     
    for (const key in vehicleData) {
      if (key !== "pictures") {
        formData.append(key, vehicleData[key]);
      } else {
        for (let i = 0; i < vehicleData.pictures.length; i++) {
          formData.append("pictures", vehicleData.pictures[i]);
        }
      }
    }

    // Log the formData entries using for...of loop
    //   for (let [key, value] of formData.entries()) {
    //     console.log(`${key}:`, value);
    // }

    try {
      const token = reactLocalStorage.get("access_token");

      const response = await axios.post("http://localhost:3000/api/owner/addVehicle", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log(response.data); 
      toast.success("Vehicle added successfully!");

      // Reset the form fields to initial state
    setVehicleData({
      name: "",
      type: "Car",
      category: "Four-Wheeler",
      fuel: "Petrol",
      transmission: "Manual",
      brand: "",
      builtYear: "",
      mileage: "",
      seats: 2,
      registrationNumber: "",
      description: "",
      dailyPrice: "",
      minRentalPeriod: 1,
      maxRentalPeriod: "",
      features: [],
      addOns: [],
      condition: "Good",
      status: "Available",
      pickupLocation: "",
      latitude: "",
      longitude: "",
      registrationCert: null,
      insuranceCert: null,
      pictures: [],
    });
    setAddOnsList([{ name: "", pricePerDay: "" }]); // Reset add-ons list
    setFeaturesList([{ name: "" }]);

    // Navigate to ownersvehicle page
    navigate("/ownervehicle");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast.error(error.response.data.message || "Error adding vehicle. Please try again.");
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <ToastContainer />
      <div className="relative flex items-center justify-center mb-10">
        <button
          type="button"
          onClick={() => setShowDialog(true)} // Navigate to the previous page
          className="absolute left-0 bg-gray-400 text-white py-2 px-6 rounded-md font-semibold hover:bg-gray-500 transition duration-300"
        >
          Back
        </button>
        <h2 className="text-3xl font-semibold text-gray-800">
          {"Add Vehicle"}
        </h2>
    </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentPage === 1 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="name" className="block text-lg font-medium text-gray-700">Vehicle Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Vehicle Name"
                  value={vehicleData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type" className="block text-lg font-medium text-gray-700">Vehicle Type</label>
                <select
                  name="type"
                  id="type"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={vehicleData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="category" className="block text-lg font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  id="category"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={vehicleData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="Two-Wheeler">Two-Wheeler</option>
                  <option value="Four-Wheeler">Four-Wheeler</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fuel" className="block text-lg font-medium text-gray-700">Fuel Type</label>
                <select
                  name="fuel"
                  id="fuel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={vehicleData.fuel}
                  onChange={handleChange}
                  required
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="transmission" className="block text-lg font-medium text-gray-700">Transmission</label>
                <select
                  name="transmission"
                  id="transmission"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={vehicleData.transmission}
                  onChange={handleChange}
                >
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="brand" className="block text-lg font-medium text-gray-700">Brand</label>
                <input
                  type="text"
                  name="brand"
                  id="brand"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brand"
                  value={vehicleData.brand}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* <div className="form-group">
                <label htmlFor="builtYear" className="block text-lg font-medium text-gray-700">Built Year</label>
                <input
                  type="number"
                  name="builtYear"
                  id="builtYear"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Built Year"
                  value={vehicleData.builtYear}
                  onChange={handleChange}
                />
              </div> */}

              <div className="form-group">
                    <label htmlFor="builtYear" className="block text-lg font-medium text-gray-700">
                      Built Year
                    </label>
                    <DatePicker
                      selected={vehicleData.builtYear ? new Date(vehicleData.builtYear, 0, 1) : null}
                      onChange={handleYearChange}
                      showYearPicker // Enables only year selection
                      dateFormat="yyyy" // Displays only the year
                      maxDate={new Date()} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

              <div className="form-group">
                <label htmlFor="mileage" className="block text-lg font-medium text-gray-700">Mileage</label>
                <input
                  type="number"
                  name="mileage"
                  id="mileage"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mileage"
                  value={vehicleData.mileage}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="seats" className="block text-lg font-medium text-gray-700">Seats</label>
                <input
                  type="number"
                  name="seats"
                  id="seats"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Seats"
                  value={vehicleData.seats}
                  onChange={handleChange}
                  min={1}
                  max={12}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="registrationNumber" className="block text-lg font-medium text-gray-700">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                id="registrationNumber"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Registration Number"
                value={vehicleData.registrationNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dailyPrice" className="block text-lg font-medium text-gray-700">Daily Price</label>
              <input
                type="number"
                name="dailyPrice"
                id="dailyPrice"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Daily Price"
                value={vehicleData.dailyPrice}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleNextPage}
                className="bg-blue-500 text-white py-2 px-6 rounded-md font-semibold hover:bg-blue-600 transition duration-300"
              >
                Next
              </button>
            </div>
          </>
        )}

        {currentPage === 2 && (
          <>
            <div className="form-group">
              <label htmlFor="description" className="block text-lg font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                id="description"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Vehicle Description"
                value={vehicleData.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="minRentalPeriod" className="block text-lg font-medium text-gray-700">Min Rental Period</label>
                <input
                  type="number"
                  name="minRentalPeriod"
                  id="minRentalPeriod"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Min Rental Period"
                  value={vehicleData.minRentalPeriod}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxRentalPeriod" className="block text-lg font-medium text-gray-700">Max Rental Period</label>
                <input
                  type="number"
                  name="maxRentalPeriod"
                  id="maxRentalPeriod"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Max Rental Period"
                  value={vehicleData.maxRentalPeriod}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* <div className="form-group">
              <label htmlFor="features" className="block text-lg font-medium text-gray-700">Features</label>
              <textarea
                name="features"
                id="features"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Seperate features with comma. (Eg: Sunroof, Gps,...)"
                value={vehicleData.features}
                onChange={handleChange}
              />
            </div> */}

              <div className="form-group">
              <label htmlFor="features" className="block text-lg font-medium text-gray-700">Features</label>
              <div>
                {featuresList.map((feature, index) => (
                  <div key={index} className="flex gap-4 mb-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Feature (e.g., Sunroof, GPS, etc.)"
                      value={feature.name}
                      onChange={(e) => handleFeatureChange(index, e)}
                      className="w-3/4 px-4 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="text-red-500"
                    >
                      - Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="bg-green-500 text-white py-2 px-6 rounded-md font-semibold hover:bg-green-600 transition duration-300"
                >
                  + Add Feature
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="addOns" className="block text-lg font-medium text-gray-700">Add-ons</label>
              <div>
                {addOnsList.map((addOn, index) => (
                  <div key={index} className="flex gap-4 mb-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Add-on Name"
                      value={addOn.name}
                      onChange={(e) => handleAddOnChange(index, e)}
                      className="w-1/2 px-4 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      name="pricePerDay"
                      placeholder="Add-on Price"
                      value={addOn.pricePerDay}
                      onChange={(e) => handleAddOnChange(index, e)}
                      className="w-1/4 px-4 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAddOn(index)}
                      className="text-red-500"
                    >
                      - Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAddOn}
                  className="bg-green-500 text-white py-2 px-6 rounded-md font-semibold hover:bg-green-600 transition duration-300"
                >
                  + Add Add-on
                </button>
              </div>
            </div>

            <div className="form-group">
                <label htmlFor="condition" className="block text-lg font-medium text-gray-700">Condition</label>
                <select
                  name="condition"
                  id="condition"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={vehicleData.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

            <div className="form-group">
              <label htmlFor="pickupLocation" className="block text-lg font-medium text-gray-700">Pickup Location</label>
              {/* <input
                type="text"
                name="pickupLocation"
                id="pickupLocation"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Pickup Location"
                value={vehicleData.pickupLocation}
                onChange={handleChange}
              /> */}
              <LocationInput onSelect={setLocation} />

            </div>

            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="latitude" className="block text-lg font-medium text-gray-700">Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  id="latitude"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Latitude"
                  value={vehicleData.latitude}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude" className="block text-lg font-medium text-gray-700">Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  id="longitude"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Longitude"
                  value={vehicleData.longitude}
                  onChange={handleChange}
                />
              </div>
            </div> */}

            <div className="form-group">
              <label htmlFor="registrationCert" className="block text-lg font-medium text-gray-700">Registration Certificate</label>
              <input
                type="file"
                name="registrationCert"
                id="registrationCert"
                onChange={handleFileChange}
                className="w-full border border-gray-300 p-2 rounded-md"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="insuranceCert" className="block text-lg font-medium text-gray-700">Insurance Certificate</label>
              <input
                type="file"
                name="insuranceCert"
                id="insuranceCert"
                onChange={handleFileChange}
                className="w-full border border-gray-300 p-2 rounded-md"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pictures" className="block text-lg font-medium text-gray-700">Vehicle Pictures</label>
              <input
                type="file"
                name="pictures"
                id="pictures"
                onChange={handleFileChange}
                className="w-full border border-gray-300 p-2 rounded-md"
                multiple
                required
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevPage}
                className="bg-gray-400 text-white py-2 px-6 rounded-md font-semibold hover:bg-gray-500 transition duration-300"
              >
                Previous
              </button>
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-6 rounded-md font-semibold hover:bg-green-600 transition duration-300"
              >
                Submit
              </button>
            </div>
          </>
        )}
      </form>
      {/* Custom Dialog Box */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-90">
            <h2 className="text-lg font-semibold mb-4">Confirm Navigation</h2>
            <p>Are you sure you want to go back? Any unsaved changes will be lost.</p>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVehicleForm;
