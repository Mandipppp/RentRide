import axios from "axios";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";


const AddVehicleStep2 = ({ onPrevious, onSubmit }) => {
  const [pricingDetails, setPricingDetails] = useState({
    seats: 0,
    transmission: "",
    fuelType: "",
    mileage: "",
    pricePerDay: "",
    pricePerHour: "",
    addOns: [],
    features: "",
    minRentalDays: 1,
    maxRentalDays: 1,
    description: "",
    condition: "Good",
    pickupLocation: "",
    latitude: 0,
    longitude: 0,
  });

  const [currentAddOn, setCurrentAddOn] = useState({ name: "", pricePerDay: "" });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPricingDetails({ ...pricingDetails, [name]: value });
  };

  const handleAddOnChange = (e) => {
    const { name, value } = e.target;
    setCurrentAddOn({ ...currentAddOn, [name]: value });
  };

  const handleAddAddOn = () => {
    if (currentAddOn.name && currentAddOn.pricePerDay) {
      setPricingDetails({
        ...pricingDetails,
        addOns: [...pricingDetails.addOns, currentAddOn],
      });
      setCurrentAddOn({ name: "", pricePerDay: "" });
    }
  };

  const handleRemoveAddOn = (index) => {
    const updatedAddOns = pricingDetails.addOns.filter((_, i) => i !== index);
    setPricingDetails({ ...pricingDetails, addOns: updatedAddOns });
  };

  const handleSubmit = () => {
    const formattedDetails = {
        ...pricingDetails,
        features: pricingDetails.features.split(",").map((feature) => feature.trim()), // Split and trim features
      };
    onSubmit(pricingDetails);
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
    setPricingDetails({
      ...pricingDetails,
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

        setPricingDetails({
          ...pricingDetails,
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
            setPricingDetails((prev) => ({
              ...prev,
              pickupLocation: address,
            }));
          })
          .catch((err) => console.error("Error fetching address:", err));
      },
    });

    return (
      <Marker position={[pricingDetails.latitude, pricingDetails.longitude]} />
    );
  };

  useEffect(() => {
    if (pricingDetails.pickupLocation) {
      fetchLocationSuggestions(pricingDetails.pickupLocation);
    }
  }, [pricingDetails.pickupLocation]);

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
        <select
          name="transmission"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        >
          <option value="">Select Transmission</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
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
      </div>

    
      {/* Condition */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Condition</h3>
        <select
          name="condition"
          className="border px-4 py-2 rounded"
          value={pricingDetails.condition}
          onChange={handleInputChange}
        >
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
        </select>
      </div>

       {/* Features */}
       <div className="mb-4">
        <h3 className="font-semibold mb-2">Features</h3>
        <textarea
          name="features"
          placeholder="Write features separated by commas (e.g., GPS, Air Conditioning, Sunroof)"
          className="border px-4 py-2 rounded w-full h-20"
          onChange={handleInputChange}
        ></textarea>
        <ul className="mt-2 list-disc list-inside">
          {pricingDetails.features
            .split(",")
            .filter((feature) => feature.trim() !== "")
            .map((feature, index) => (
              <li key={index}>{feature.trim()}</li>
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
          {pricingDetails.addOns.map((addOn, index) => (
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
        <input
          type="number"
          name="maxRentalDays"
          placeholder="Maximum Rental Days"
          className="border px-4 py-2 rounded"
          onChange={handleInputChange}
        />
      </div>

      {/* Pickup Location Section */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Pickup Location</h3>
        <MapContainer
          center={[pricingDetails.latitude || 51.505, pricingDetails.longitude || -0.09]} // Default location
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
            value={pricingDetails.pickupLocation}
            onChange={(e) => handleInputChange(e)}
            onBlur={() => fetchLocationSuggestions(pricingDetails.pickupLocation)} // Fetch when the input loses focus
          />
          <p className="mt-2 text-sm text-gray-600">
            Type a location to see suggestions.
          </p>
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
            Selected Coordinates: Latitude: {pricingDetails.latitude}, Longitude:{" "}
            {pricingDetails.longitude}
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
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default AddVehicleStep2;
