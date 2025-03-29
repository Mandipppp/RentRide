import { useEffect, useState } from "react";
import { reactLocalStorage } from 'reactjs-localstorage';
import Navigation from "./Navigation";
import axios from "axios";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';



export default function BrowseVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [allAddOns, setAllAddOns] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();
  const [requestedVehicleIds, setRequestedVehicleIds] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);


  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    pickAndDropLocation: searchParams.get("pickAndDropLocation") || "",
    pickupDate: searchParams.get("pickupDate") || today,
    pickupTime: searchParams.get("pickupTime") || "",
    dropDate: searchParams.get("dropDate") || "",
    dropTime: searchParams.get("dropTime") || "",
    verified: searchParams.get("verified") === "true",
    addOns: searchParams.get("addOns") ? searchParams.get("addOns").split(",") : [],
    fuel: searchParams.get("fuel") || "Petrol"
  });

  //fetch all the vehicles id that the user has requested
  useEffect(() => {
    // console.log("data i have: ", filters);
    if(filters.dropDate != ""){
      handleSearch();
    }
    fetchRequestedBookings();
  }, []);

  useEffect(() => {
    fetchAddOns(); // Fetch add-ons on load
  }, []);

  const fetchRequestedBookings = async () => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      setRequestedVehicleIds([]); // No bookings if user isn't logged in
      return;
    }

    try {
      const response = await axios.get("http://localhost:3000/api/user/booking/getUsersBookings", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookedIds = response.data.map(booking => booking);
      setRequestedVehicleIds(bookedIds);
      // console.log("Booking ids",response.data.map(booking => booking));

    } catch (err) {
      console.log(err.response?.data?.message || "Failed to fetch booking requests.");
    }
  };

  const fetchAddOns = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/users/getalladdons");
      const vehiclesData = response.data;
      // console.log(vehiclesData);

      setAllAddOns(Array.from(vehiclesData).sort()); // Convert Set to Array and Sort
      // console.log(Array.from(vehiclesData).sort());
    } catch (err) {
      console.log(err.response?.data?.message || "Failed to fetch vehicles.");
    }
  };

  // Update URL when search parameters change
  const updateURLParams = () => {
    setSearchParams({
      pickAndDropLocation: filters.pickAndDropLocation,
      pickupDate: filters.pickupDate,
      pickupTime: filters.pickupTime,
      dropDate: filters.dropDate,
      dropTime: filters.dropTime,
      verified: filters.verified,
      addOns: filters.addOns.join(","),
      fuel: filters.fuel
    });
  };

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
    setHasSearched(true);
    updateURLParams();

    // localStorage.setItem("searchFilters", JSON.stringify(filters));

    const token = reactLocalStorage.get("access_token");
    // console.log("Filters: ", filters);
    if (!filters.pickupDate || !filters.dropDate) {
      toast.error("Please select both pickup and drop dates before searching.");
      return;
    }

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
      console.log(err.response?.data?.message || "Failed to fetch vehicles.");
    }
  };

  const handleVehicleClick = (vehicleId) => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      setSelectedVehicleId(vehicleId); // Store vehicle ID in case they log in
      // Store vehicleId and filters state in local storage
      reactLocalStorage.setObject("pendingVehicle", {
        vehicleId: vehicleId,
        filters: filters
      });
      setShowLoginModal(true); // Show the modal
      return;
    }
    
    const isRequested = requestedVehicleIds.includes(vehicleId);
    navigate(`/vehicleDetails/${vehicleId}`, {
      state: { filters , isRequested}  // Pass the filters state along with navigation
    });
  };

  const handleContinueBrowsing = () => {
    reactLocalStorage.remove("pendingVehicle"); // Clear any stored vehicle data
    setShowLoginModal(false); // Close the modal
  };
  


  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer />
      <Navigation />
      <div className="flex w-full p-6">
        {/* Search Panel */}
        <div className="w-1/3 border p-6 rounded-lg shadow-lg bg-white">
          <input className="border p-3 rounded w-full mb-4" name="pickAndDropLocation" placeholder="Pick-up and return location" value={filters.pickAndDropLocation} onChange={handleInputChange} />
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="border p-3 rounded">
              <label className="block text-sm font-semibold">Pick-up Date</label>
              <input className="w-full" name="pickupDate" type="date" min={today} value={filters.pickupDate} onChange={handleInputChange} />
            </div>
            <div className="border p-3 rounded">
              <label className="block text-sm font-semibold">Pick-up Time</label>
              <input className="w-full" name="pickupTime" type="time" value={filters.pickupTime} onChange={handleInputChange} />
            </div>
            <div className="border p-3 rounded">
              <label className="block text-sm font-semibold">Return Date</label>
              <input className="w-full" name="dropDate" type="date" min={filters.pickupDate} value={filters.dropDate} onChange={handleInputChange} />
            </div>
            <div className="border p-3 rounded">
              <label className="block text-sm font-semibold">Return Time</label>
              <input className="w-full" name="dropTime" type="time" value={filters.dropTime} onChange={handleInputChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
          

          {/* <div className="border p-4 rounded-lg">
            <p className="font-semibold mb-2">Add-On</p>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input type="checkbox" name="Child-Seat" checked = {filters.addOns.includes("Child-Seat")} onChange={handleCheckboxChange} />
                <span>Child-Seat</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" name="Roof Rack/Carrier" checked = {filters.addOns.includes("Roof Rack/Carrier")} onChange={handleCheckboxChange} />
                <span>Roof Rack/Carrier</span>
              </label>
            </div>
          </div> */}
           <div className="border p-4 rounded-lg mt-4">
            <p className="font-semibold mb-2">Add-Ons</p>
            <div className="space-y-2">
              {allAddOns.map((addOn) => (
                <label key={addOn} className="flex items-center space-x-3">
                  <input type="checkbox" name={addOn} checked={filters.addOns.includes(addOn)} onChange={handleCheckboxChange} />
                  <span>{addOn.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border p-4 rounded-lg">
            <p className="font-semibold mb-2">Fuel</p>
            <div className="flex flex-wrap gap-2">
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
        <div
          className={`border mb-6 p-2 rounded-lg flex items-center justify-center cursor-pointer transition ${filters.verified ? "bg-green-500 text-white" : "bg-gray-100"}`}
          onClick={() => setFilters({ ...filters, verified: !filters.verified })}
        >
          <i className="fa-solid fa-file-shield text-xl mr-2"></i>
          <span className="font-semibold">Verified</span>
        </div>
          <button className="w-full bg-green-500 text-white p-3 rounded disabled:opacity-50" onClick={handleSearch} disabled={!filters.pickupDate || !filters.dropDate}>Search</button>
        </div>

      {/* Results Panel */}
      <div className="w-2/3 p-6">
      <h2 className="text-2xl font-bold mb-4">Results</h2>
      {!hasSearched ? (
    <p className="text-gray-500 text-center mt-4">Start searching for vehicles by entering your details.</p>
  ) : vehicles.length === 0 ? (
            <p className="text-gray-500 text-center mt-4">No vehicles found.</p>
          ) : (
        <div className="grid grid-cols-1 gap-6 items-start">
          {vehicles.map((vehicle, index) => {
              const isRequested = requestedVehicleIds.includes(vehicle._id);
              return (
            <div 
            key={index} 
            className="bg-white border p-6 rounded-lg shadow-lg flex flex-col w-full"
            onClick={() => handleVehicleClick(vehicle._id)}>
            {isRequested && (
              <p className="text-yellow-500 px-3 py-1 rounded">
                Booking Requested
              </p>
            )}
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
                <p><i className="fa-solid fa-gas-pump mr-2"></i> {vehicle.fuel}</p>
              </div>
            </div>
          );
        })}
        </div>
          )}
      </div>

    </div>
    {showLoginModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Login Required</h2>
        <p className="text-gray-600 mb-4">To proceed with booking, you need to log in.</p>
        <div className="flex flex-col gap-3">
          <button
            className="bg-blue-500 text-white py-2 rounded hover:bg-green-600 transition"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
          <button
            className="bg-green-500 text-white py-2 rounded hover:bg-blue-600 transition"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
          <button
            className="bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition"
            onClick={handleContinueBrowsing}
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  )}

    </div>
  );
}
