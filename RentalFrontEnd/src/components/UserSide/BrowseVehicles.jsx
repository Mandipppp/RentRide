import { useState } from "react";
import Navigation from "./Navigation";


export default function BrowseVehicles() {
  const [filters, setFilters] = useState({
    pickAndDropLocation: "",
    pickupDate: "",
    pickupTime: "",
    dropDate: "",
    dropTime: "",
    type: "",
    fuel: "",
    transmission: "",
  });

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className=" min-h-screen flex flex-col">
    <Navigation />
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Browse Vehicles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input className="border p-2 rounded w-full" name="pickAndDropLocation" placeholder="Pickup & Drop Location" onChange={handleInputChange} />
        <input className="border p-2 rounded w-full" name="pickupDate" type="date" onChange={handleInputChange} />
        <input className="border p-2 rounded w-full" name="pickupTime" type="time" onChange={handleInputChange} />
        <input className="border p-2 rounded w-full" name="dropDate" type="date" onChange={handleInputChange} />
        <input className="border p-2 rounded w-full" name="dropTime" type="time" onChange={handleInputChange} />
        <select className="border p-2 rounded w-full" name="type" onChange={handleInputChange}>
          <option value="">Select Vehicle Type</option>
          <option value="Car">Car</option>
          <option value="Bike">Bike</option>
          <option value="SUV">SUV</option>
          <option value="Truck">Truck</option>
          <option value="Van">Van</option>
        </select>
        <select className="border p-2 rounded w-full" name="fuel" onChange={handleInputChange}>
          <option value="">Select Fuel Type</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
        </select>
        <select className="border p-2 rounded w-full" name="transmission" onChange={handleInputChange}>
          <option value="">Select Transmission</option>
          <option value="Manual">Manual</option>
          <option value="Automatic">Automatic</option>
        </select>
      </div>
      <button className="w-full bg-green-500 text-white p-2 rounded">Search</button>
      
    </div>
    </div>
  );
}
