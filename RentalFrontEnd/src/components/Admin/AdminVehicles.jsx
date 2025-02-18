import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { FaCar, FaMotorcycle, FaTruck, FaSearch } from "react-icons/fa"; // Import icons

const AdminVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State to hold the search query
  const [selectedType, setSelectedType] = useState(""); // Selected type filter
  const [selectedCategory, setSelectedCategory] = useState(""); // Selected category filter
  const [selectedStatus, setSelectedStatus] = useState(""); // Selected status filter
  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getData(token); // Fetch all vehicle details initially
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const getData = (token, query = "", type = "", category = "", status = "") => {
    let url = "http://localhost:3000/api/admin/getVehicles";
    let params = [];

    if (query) {
      params.push(`name=${query}`);
      params.push(`registrationNumber=${query}`);
    }
    if (type) params.push(`type=${type}`);
    if (category) params.push(`category=${category}`);
    if (status) params.push(`status=${status}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setVehicles(res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
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
    if (accessToken) {
      getData(accessToken, query, selectedType, selectedCategory, selectedStatus);
    }
  };

  const handleTypeClick = (type) => {
    const newType = selectedType === type ? "" : type;
    setSelectedType(newType);
    if (accessToken) {
      getData(accessToken, searchQuery, newType, selectedCategory, selectedStatus);
    }
  };

  const handleCategoryClick = (category) => {
    const newCategory = selectedCategory === category ? "" : category;
    setSelectedCategory(newCategory);
    if (accessToken) {
      getData(accessToken, searchQuery, selectedType, newCategory, selectedStatus);
    }
  };

  const handleStatusClick = (status) => {
    const newStatus = selectedStatus === status ? "" : status;
    setSelectedStatus(newStatus);
    if (accessToken) {
      getData(accessToken, searchQuery, selectedType, selectedCategory, newStatus);
    }
  };

  const handleClearFilters = () => {
    setSelectedType("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSearchQuery("");
    if (accessToken) {
      getData(accessToken); // Reset all filters and fetch all data
    }
  };

  // Function to handle navigation to the user's details page
  const handleUserClick = (vehicleId) => {
    navigate(`/adminvehicles/${vehicleId}`); // Navigate to the user's details page
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <h2 className="text-4xl font-bold mb-4">Vehicles</h2>

      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name or registration number"
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500">
          <FaSearch />
        </span>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedType === "Car" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleTypeClick("Car")}
          >
            <FaCar className="inline mr-2" /> Car
          </button>
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedType === "Bike" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleTypeClick("Bike")}
          >
            <FaMotorcycle className="inline mr-2" /> Bike
          </button>
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedType === "SUV" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleTypeClick("SUV")}
          >
            <FaCar className="inline mr-2" /> SUV
          </button>
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedType === "Truck" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleTypeClick("Truck")}
          >
            <FaTruck className="inline mr-2" /> Truck
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedCategory === "Two-Wheeler" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleCategoryClick("Two-Wheeler")}
          >
            Two-Wheeler
          </button>
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedCategory === "Four-Wheeler" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleCategoryClick("Four-Wheeler")}
          >
            Four-Wheeler
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedStatus === "Available" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleStatusClick("Available")}
          >
            Available
          </button>
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedStatus === "Booked" ? "bg-yellow-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleStatusClick("Booked")}
          >
            Booked
          </button>
          <button
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedStatus === "Under Maintenance" ? "bg-red-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleStatusClick("Under Maintenance")}
          >
            Under Maintenance
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={handleClearFilters}
            className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 ease-in-out"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Vehicle Table */}
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Name</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Type</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Category</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Registration</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Avaibality Status</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Verification Status</th>

            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle, index) => (
              <tr
                key={vehicle._id}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
                onClick={() => handleUserClick(vehicle._id)}
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4 flex items-center">
                  <img
                    src={`http://localhost:3000/${vehicle.imageUrls[0]}`}
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
                <td
                  className={`py-3 px-4 font-medium ${
                    vehicle.registrationCertificate.status === "Verified" && vehicle.insuranceCertificate.status === "Verified"
                      ? "text-green-500"
                      : vehicle.registrationCertificate.status === "Pending" || vehicle.insuranceCertificate.status === "Pending"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {
                    vehicle.registrationCertificate.status === "Verified" && vehicle.insuranceCertificate.status === "Verified"
                      ? "Verified"
                      : vehicle.registrationCertificate.status === "Pending" || vehicle.insuranceCertificate.status === "Pending"
                      ? "Pending"
                      : "Rejected"
                  }
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
