import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom"; // For navigation

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State to hold the search query
  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getDetails(token); // Fetch all owner details initially
    }
  }, []);

  const getDetails = (token, query = "") => {
    // Construct the API URL with the search query if present
    const url = query
      ? `http://localhost:3000/api/admin/getOwners?name=${query}&email=${query}`
      : "http://localhost:3000/api/admin/getOwners";

    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in Authorization header
        },
      })
      .then((res) => {
        // Set the owners data into state
        setOwners(res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          // Navigate to error page if the user is not an admin
          navigate("/unauthorized");
        } else {
          console.error("Error fetching owner details:", error);
          setOwners([]);
        }
      });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Fetch owners based on the search query
    if (accessToken) {
      getDetails(accessToken, query);
    }
  };

  // Function to handle navigation to the user's details page
  const handleUserClick = (userId) => {
    navigate(`/owners/${userId}`); // Navigate to the user's details page
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      {/* Navbar */}
      <Navbar />

      {/* Title */}
      <h2 className="text-4xl font-bold mb-4">Owners</h2>

      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange} // Update search query and fetch filtered data
          placeholder="Search by name or email"
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
            <th className="py-3 px-4 text-gray-600 font-medium">Contact</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Email</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Status</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {owners.length > 0 ? (
            owners.map((owner, index) => (
              <tr
                key={owner._id}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
                onClick={() => handleUserClick(owner._id)} // Navigate on click
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4 flex items-center">
                  <img
                    src={`http://localhost:3000/${owner.profilePicture}`} // Assuming the server serves profile pictures from this path
                    alt={owner.name}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  {owner.name}
                </td>
                <td className="py-3 px-4">
                  {owner.contactNumber || "No Contact Number"}
                </td>
                <td className="py-3 px-4">{owner.email}</td>
                <td
                  className={`py-3 px-4 font-medium ${
                    owner.kycStatus === "verified"
                      ? "text-green-500"
                      : owner.kycStatus === "pending"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {owner.kycStatus === "verified"
                    ? "Owner Approved"
                    : owner.kycStatus === "pending"
                    ? "Approval Pending"
                    : "Approval Denied"}
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
                colSpan="6"
                className="text-center py-4 text-gray-500 font-medium"
              >
                No owners found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOwners;
