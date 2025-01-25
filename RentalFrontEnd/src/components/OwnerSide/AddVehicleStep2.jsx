import axios from "axios";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";


const AddVehicleStep2 = ({
  contVehicleDetails,
  setcontVehicleDetails,
  onPrevious,
  onSubmit,
}) => {

  const [currentAddOn, setCurrentAddOn] = useState({ name: "", pricePerDay: "" });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "features") {
      // Split the features string into an array and store it
      setcontVehicleDetails({ ...contVehicleDetails, [name]: value.split(",").map((feature) => feature.trim()) });
    } else {
      setcontVehicleDetails({ ...contVehicleDetails, [name]: value });
    }
  };

  const handleAddOnChange = (e) => {
    const { name, value } = e.target;
    setCurrentAddOn({ ...currentAddOn, [name]: value });
  };

  const handleAddAddOn = () => {
    if (currentAddOn.name && currentAddOn.pricePerDay) {
      setcontVehicleDetails({
        ...contVehicleDetails,
        addOns: [...contVehicleDetails.addOns, currentAddOn],
      });
      setCurrentAddOn({ name: "", pricePerDay: "" });
    }
  };

  const handleRemoveAddOn = (index) => {
    const updatedAddOns = contVehicleDetails.addOns.filter((_, i) => i !== index);
    setcontVehicleDetails({ ...contVehicleDetails, addOns: updatedAddOns });
  };

  // Validate required fields
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!contVehicleDetails.seats) newErrors.seats = "Seats are required.";
    if (!contVehicleDetails.transmission) newErrors.transmission = "Transmission type is required.";
    if (!contVehicleDetails.fuelType) newErrors.fuelType = "Fuel type is required.";
    if (!contVehicleDetails.pricePerDay) newErrors.pricePerDay = "Price per day is required.";
    if (!contVehicleDetails.condition) newErrors.condition = "Condition is required.";
    if (!contVehicleDetails.minRentalDays) newErrors.minRentalDays = "Minimum rental days are required.";
    if (!contVehicleDetails.maxRentalDays) newErrors.maxRentalDays = "Maximum rental days are required.";
    if (!contVehicleDetails.pickupLocation) newErrors.pickupLocation = "Pickup location is required.";

    setErrors(newErrors);

    // Return true if there are no errors, false if there are errors
    return Object.keys(newErrors).length === 0;
  };


  // Fetch location suggestions from Nominatim API (OpenStreetMap)
  const fetchLocationSuggestions = async (query) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsFetchingLocations(true);

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`, {
          params: {
            q: query,
            format: "json",
            limit: 5, // Limit results
          },
        }
      );
      setLocationSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocationSuggestions([]);
    } finally {
      setIsFetchingLocations(false);
    }
  };

  const handleLocationSelect = (address, lat, lon) => {
    setcontVehicleDetails({
      ...contVehicleDetails,
      pickupLocation: address,
      latitude: lat,
      longitude: lon,
    });
    setLocationSuggestions([]); // Clear suggestions after selection
  };

  // Custom Marker Component to update location
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        setcontVehicleDetails({
          ...contVehicleDetails,
          latitude: lat,
          longitude: lon,
        });

        // Reverse geocoding to get the address from coordinates
        axios
          .get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
              lat: lat,
              lon: lon,
              format: "json",
            },
          })
          .then((response) => {
            const address = response.data.display_name;
            setcontVehicleDetails((prev) => ({
              ...prev,
              pickupLocation: address,
            }));
          })
          .catch((err) => console.error("Error fetching address:", err));
      },
    });

    return (
      <Marker position={[contVehicleDetails.latitude, contVehicleDetails.longitude]} />
    );
  };

  useEffect(() => {
    if (contVehicleDetails.pickupLocation) {
      fetchLocationSuggestions(contVehicleDetails.pickupLocation);
    }
  }, [contVehicleDetails.pickupLocation]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">My Vehicles / Add Vehicle</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          name="seats"
          placeholder="Seats"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        />
        {errors.seats && <p className="text-red-500 text-sm">{errors.seats}</p>}
        <select
          name="transmission"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        >
          <option value="">Select Transmission</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
        {errors.transmission && <p className="text-red-500 text-sm">{errors.transmission}</p>}

        <select
          name="fuelType"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        >
          <option value="">Select Fuel</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
        </select>
        {errors.fuelType && <p className="text-red-500 text-sm">{errors.fuelType}</p>}
        <input
          type="number"
          name="mileage"
          placeholder="Mileage/1L"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          name="pricePerDay"
          placeholder="Price Per Day"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        />
        {errors.pricePerDay && <p className="text-red-500 text-sm">{errors.pricePerDay}</p>}
      </div>

    
      {/* Condition */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Condition</h3>
        <select
          name="condition"
          className="border px-4 py-2 rounded"
          value={contVehicleDetails.condition}
          onChange={handleInputChange}
        >
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
        </select>
        {errors.condition && <p className="text-red-500 text-sm">{errors.condition}</p>}
      </div>

       {/* Features */}
       <div className="mb-4">
        <h3 className="font-semibold mb-2">Features</h3>
        <textarea
          name="features"
          placeholder="Write features separated by commas (e.g., GPS, Air Conditioning, Sunroof)"
          className="border px-4 py-2 rounded w-full h-20"
          value={contVehicleDetails.features.join(" ,")}
          onChange={handleInputChange}
        ></textarea>
        <ul className="mt-2 list-disc list-inside">
          {contVehicleDetails.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      {/* Description */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Vehicle Description</h3>
        <textarea
          name="description"
          placeholder="Write a short description about your vehicle..."
          className="border px-4 py-2 rounded w-full h-24"
          onChange={handleInputChange}
        ></textarea>
      </div>

      {/* Add-Ons */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Add-Ons</h3>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            name="name"
            value={currentAddOn.name}
            placeholder="Add-On Name"
            className="border px-4 py-2 rounded"
            onChange={handleAddOnChange}
          />
          <input
            type="number"
            name="pricePerDay"
            value={currentAddOn.pricePerDay}
            placeholder="Price / Day"
            className="border px-4 py-2 rounded"
            onChange={handleAddOnChange}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={handleAddAddOn}
          >
            +
          </button>
        </div>
        <ul>
          {contVehicleDetails.addOns.map((addOn, index) => (
            <li key={index} className="flex gap-4 mb-2">
              <span>
                {addOn.name} - Rs. {addOn.pricePerDay}/day
              </span>
              <button
                className="bg-red-500 text-white px-2 py-0 rounded"
                onClick={() => handleRemoveAddOn(index)}
              >
                -
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Rental Days */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          type="number"
          name="minRentalDays"
          placeholder="Minimum Rental Days"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        />
        {errors.minRentalDays && <p className="text-red-500 text-sm">{errors.minRentalDays}</p>}
        <input
          type="number"
          name="maxRentalDays"
          placeholder="Maximum Rental Days"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        />
        {errors.maxRentalDays && <p className="text-red-500 text-sm">{errors.maxRentalDays}</p>}
      </div>

      {/* Pickup Location Section */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Pickup Location</h3>
        <MapContainer
          center={[contVehicleDetails.latitude || 51.505, contVehicleDetails.longitude || -0.09]} // Default location
          zoom={13}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <LocationMarker />
        </MapContainer>
        <div className="mt-4">
          <input
            type="text"
            name="pickupLocation"
            placeholder="Search for a location"
            className="border px-4 py-2 rounded w-full"
            value={contVehicleDetails.pickupLocation}
            onChange={(e) => handleInputChange(e)}
            onBlur={() => fetchLocationSuggestions(contVehicleDetails.pickupLocation)} // Fetch when the input loses focus
          />
          {errors.pickupLocation && <p className="text-red-500 text-sm">{errors.pickupLocation}</p>}
          <ul className="mt-2">
            {locationSuggestions.map((loc) => (
              <li
                key={loc.place_id}
                className="cursor-pointer"
                onClick={() => handleLocationSelect(loc.display_name, loc.lat, loc.lon)}
              >
                {loc.display_name}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-sm text-gray-600">
            Selected Coordinates: Latitude: {contVehicleDetails.latitude}, Longitude:{" "}
            {contVehicleDetails.longitude}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between">
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={onPrevious}
        >
          Previous
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={() => {
            if (validateForm()) {
              onSubmit();
            }
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default AddVehicleStep2;
