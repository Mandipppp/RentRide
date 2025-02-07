import { useState } from "react";
import Navigation from "./Navigation";

export default function BrowseVehicles() {
  const [filters, setFilters] = useState({
    pickAndDropLocation: "",
    pickupDate: "",
    pickupTime: "",
    dropDate: "",
    dropTime: "",
    verified: false,
    addOns: [],
    fuel: ""
  });

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFilters((prevFilters) => {
      if (checked) {
        return { ...prevFilters, addOns: [...prevFilters.addOns, name] };
      } else {
        return { ...prevFilters, addOns: prevFilters.addOns.filter((item) => item !== name) };
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="w-full border p-6 rounded-lg shadow-lg">
        <input className="border p-3 rounded w-full mb-4" name="pickAndDropLocation" placeholder="Pick-up and return location" onChange={handleInputChange} />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Pick-up Date</label>
            <input className="w-full" name="pickupDate" type="date" onChange={handleInputChange} />
          </div>
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Pick-up Time</label>
            <input className="w-full" name="pickupTime" type="time" onChange={handleInputChange} />
          </div>
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Return Date</label>
            <input className="w-full" name="dropDate" type="date" onChange={handleInputChange} />
          </div>
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Return Time</label>
            <input className="w-full" name="dropTime" type="time" onChange={handleInputChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Verified Box */}
          <div
            className={`border p-2 rounded-lg flex items-center justify-center cursor-pointer transition ${
              filters.verified ? "bg-green-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => setFilters({ ...filters, verified: !filters.verified })}
          >
            <i className="fa-solid fa-file-shield text-xl mr-2"></i>
            <span className="font-semibold">Verified</span>
          </div>

          <div className="border p-4 rounded-lg">
            <p className="font-semibold mb-2">Add-On</p>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input type="checkbox" name="Child-Seat" onChange={handleCheckboxChange} />
                <span>Child-Seat</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" name="Roof Rack/Carrier" onChange={handleCheckboxChange} />
                <span>Roof Rack/Carrier</span>
              </label>
            </div>
          </div>

          <div className="border p-4 rounded-lg">
            <p className="font-semibold mb-2">Fuel</p>
            <div className="flex space-x-2">
              {["Petrol", "Diesel", "Electric", "Hybrid"].map((fuelType) => (
                <button
                  key={fuelType}
                  className={`px-4 py-2 rounded transition ${
                    filters.fuel === fuelType ? "bg-green-500 text-white" : "border"
                  }`}
                  onClick={() => setFilters({ ...filters, fuel: fuelType })}
                >
                  {fuelType}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="w-full bg-green-500 text-white p-3 rounded">Search</button>
      </div>
    </div>
  );
}
