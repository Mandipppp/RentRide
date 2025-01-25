import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";

const AdminVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State to hold the search query
  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getVehicles(token); // Fetch all vehicle details initially
    }
  }, []);

  const getVehicles = (token, query = "") => {
    // Construct the API URL with the search query if present
    const url = query
      ? `http://localhost:3000/api/admin/getVehicles?name=${query}&registrationNumber=${query}`
      : "http://localhost:3000/api/admin/getVehicles";

    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in Authorization header
        },
      })
      .then((res) => {
        // Set the vehicles data into state
        setVehicles(res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          // Navigate to error page if the user is not an admin
          navigate("/unauthorized");
        } else {
          console.error("Error fetching vehicle details:", error);
          setVehicles([]);
        }
      });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Fetch vehicles based on the search query
    if (accessToken) {
      getVehicles(accessToken, query);
    }
  };

  // Function to handle navigation to the vehicle's details page
  const handleVehicleClick = (vehicleId) => {
    // navigate(`/vehicles/${vehicleId}`); // Navigate to the vehicle's details page
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      {/* Navbar */}
      <Navbar />

      {/* Title */}
      <h2 className="text-4xl font-bold mb-4">Vehicles</h2>

      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange} // Update search query and fetch filtered data
          placeholder="Search by name or registration number"
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500">
          <i className="fas fa-search"></i>
        </span>
      </div>

      {/* Table */}
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Name</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Type</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Category</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Registration</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Status</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle, index) => (
              <tr
                key={vehicle._id}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
                onClick={() => handleVehicleClick(vehicle._id)} // Navigate on click
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4 flex items-center">
                  <img
                    src={vehicle.imageUrls[0] || "/placeholder.png"} // Use a placeholder if no image exists
                    alt={vehicle.name}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  {vehicle.name}
                </td>
                <td className="py-3 px-4">{vehicle.type}</td>
                <td className="py-3 px-4">{vehicle.category}</td>
                <td className="py-3 px-4">{vehicle.registrationNumber}</td>
                <td
                  className={`py-3 px-4 font-medium ${
                    vehicle.status === "Available"
                      ? "text-green-500"
                      : vehicle.status === "Booked"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {vehicle.status}
                </td>
                <td className="py-3 px-4">
                  <button className="text-gray-500 hover:text-blue-500">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="7"
                className="text-center py-4 text-gray-500 font-medium"
              >
                No vehicles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminVehicles;
