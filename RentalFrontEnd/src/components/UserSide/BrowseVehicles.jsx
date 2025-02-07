import { useState } from "react";
import Navigation from "./Navigation";
import { reactLocalStorage } from "reactjs-localstorage";
import axios from "axios";

export default function BrowseVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  
  const [filters, setFilters] = useState({
    pickAndDropLocation: "",
    pickupDate: today,
    pickupTime: "",
    dropDate: "",
    dropTime: "",
    verified: false,
    addOns: [],
    fuel: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => {
      let updatedFilters = { ...prevFilters, [name]: value };
      
      if (name === "pickupDate" && updatedFilters.dropDate && value >= updatedFilters.dropDate) {
        let nextDay = new Date(value);
        nextDay.setDate(nextDay.getDate() + 1);
        updatedFilters.dropDate = nextDay.toISOString().split("T")[0];
      }
      
      return updatedFilters;
    });
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

  const handleSearch = async () => {
    const token = reactLocalStorage.get("access_token");
    // console.log("Filters: ", filters);

    try {
      const response = await axios.get("http://localhost:3000/api/users/vehicles", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          pickAndDropLocation: filters.pickAndDropLocation,
          pickupDate: filters.pickupDate,
          dropDate: filters.dropDate,
          fuel: filters.fuel,
          verified: filters.verified,
          addOns: filters.addOns.join(",")
        }
      });
      setVehicles(response.data);
      // console.log(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch vehicles.");
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="w-full border p-6 rounded-lg shadow-lg mb-10">
        <input className="border p-3 rounded w-full mb-4" name="pickAndDropLocation" placeholder="Pick-up and return location" onChange={handleInputChange} />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Pick-up Date</label>
            <input className="w-full" name="pickupDate" type="date" min={today} value={filters.pickupDate} onChange={handleInputChange} />
          </div>
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Pick-up Time</label>
            <input className="w-full" name="pickupTime" type="time" onChange={handleInputChange} />
          </div>
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Return Date</label>
            <input className="w-full" name="dropDate" type="date" min={new Date(filters.pickupDate).toISOString().split("T")[0]} value={filters.dropDate} onChange={handleInputChange} />
          </div>
          <div className="border p-3 rounded">
            <label className="block text-sm font-semibold">Return Time</label>
            <input className="w-full" name="dropTime" type="time" onChange={handleInputChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className={`border p-2 rounded-lg flex items-center justify-center cursor-pointer transition ${filters.verified ? "bg-green-500 text-white" : "bg-gray-100"}`}
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
                  className={`px-4 py-2 rounded transition ${filters.fuel === fuelType ? "bg-green-500 text-white" : "border"}`}
                  onClick={() => setFilters({ ...filters, fuel: fuelType })}
                >
                  {fuelType}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="w-full bg-green-500 text-white p-3 rounded" onClick={handleSearch}>Search</button>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle, index) => (
          <div key={index} className="bg-white border p-6 rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold">Rs. {vehicle.dailyPrice} <span className="text-sm font-normal">/ day</span></p>
              </div>
              <img src={`http://localhost:3000/${vehicle.imageUrls[0]}`} alt={vehicle.name} className="w-40 h-24 object-cover rounded" />
            </div>
            <hr className="my-4" />
            <div className="flex justify-between">
              <p className="font-semibold">{vehicle.name} <span className="text-gray-500">{vehicle.type}</span></p>
              <p className="text-yellow-500 flex items-center">⭐ {vehicle.rating}</p>
            </div>
            <div className="flex justify-between text-gray-600 mt-2">
              {/* <p>{vehicle.seats} Seats</p> */}
              <p><i className="fa-solid fa-gas-pump mr-2"></i> {vehicle.fuel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
