import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom"; // For navigation
import { toast, ToastContainer } from "react-toastify";


const AdminAdmins = () => {
  const [Admins, setAdmins] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State to hold the search query
  const [activeUserId, setActiveUserId] = useState(null); // Track active user for dropdown
  const [dropdownVisible, setDropdownVisible] = useState(false); // Track visibility of dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0 }); // State for dropdown position
  const dropdownRef = useRef(null); // Reference for dropdown
  const navigate = useNavigate(); // Initialize navigate hook
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getDetails(token); // Fetch all user details initially
    }

    // Close the dropdown if clicked outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownVisible(false); // Close the dropdown
      }
    };

    document.addEventListener("click", handleClickOutside);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const getDetails = (token, query = "") => {
    const url = query
      ? `http://localhost:3000/api/admin/getAdmins?name=${query}&email=${query}`
      : "http://localhost:3000/api/admin/getAdmins";

    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in Authorization header
        },
      })
      .then((res) => {
        setAdmins(res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          navigate("/unauthorized");
        } else {
          console.error("Error fetching user details:", error);
          setAdmins([]);
        }
      });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (accessToken) {
      getDetails(accessToken, query);
    }
  };


  const toggleDropdown = (userId, e) => {
    if (activeUserId === userId) {
      setDropdownVisible(!dropdownVisible); 
    } else {
      setActiveUserId(userId);
      setDropdownVisible(true);

      const rect = e.target.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = 100;
      const newLeft = rect.right + dropdownWidth > windowWidth ? rect.left - dropdownWidth : rect.left;

      setDropdownPosition({
        left: newLeft,
        top: rect.bottom,
      });
    }
  };

  const handleCopyId = (userId) => {
    navigator.clipboard.writeText(userId).then(() => {
      toast.success("User ID copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy text: ", err);
    });
  };

  const handleAddAdmin = () => setShowAddForm(true);
  const handleCancel = () => {
    setShowAddForm(false);
    setNewAdmin({ name: "", email: "" });
  };

  const handleInputChange = (e) => {
    setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });
  };

  const handleConfirmAddAdmin = () => {
    setShowAddForm(false);
    setShowConfirmation(true);
  };

  const handleSubmit = () => {
    axios.post("http://localhost:3000/api/admin/add-admin", newAdmin, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .then(() => {
      toast.success("Admin added successfully!");
      setShowConfirmation(false);
      setShowAddForm(false);
      setNewAdmin({ name: "", email: "" });
      getDetails(accessToken);
    })
    .catch(() => toast.error("Failed to add admin"));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <ToastContainer />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-4xl font-bold">Admins</h2>
        <button
          onClick={handleAddAdmin}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150"
        >
          Add Admin
        </button>
      </div>
      
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name or email"
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500">
          <i className="fas fa-search"></i>
        </span>
      </div>

      {showAddForm && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <input
            type="text"
            name="name"
            placeholder="Admin Name"
            value={newAdmin.name}
            onChange={handleInputChange}
            className="w-full mb-2 py-2 px-4 border rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            value={newAdmin.email}
            onChange={handleInputChange}
            className="w-full mb-2 py-2 px-4 border rounded"
          />
          <div className="flex justify-end">
            <button onClick={handleCancel} className="bg-gray-400 text-white px-4 py-2 rounded mr-2">Cancel</button>
            <button onClick={handleConfirmAddAdmin} className="bg-green-500 text-white px-4 py-2 rounded">Add Admin</button>
          </div>
        </div>
      )}

{showConfirmation && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
          <p className="mb-4">Do you confirm to add another admin?</p>
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Confirm</button>
          <button onClick={() => setShowConfirmation(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      )}


      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Name</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Contact</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Email</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Created At</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {Admins.length > 0 ? (
            Admins.map((user, index) => (
              <tr
                key={user._id}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
                onClick={() => handleUserClick(user._id)}
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4 flex items-center">
                  {user.name}
                </td>
                <td className="py-3 px-4">
                  {user.contactNumber || "No Contact Number"}
                </td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <button
                    className="text-gray-500 hover:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      toggleDropdown(user._id, e); // Pass the event for position calculation
                    }}
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownVisible && activeUserId === user._id && (
                    <div
                      ref={dropdownRef}
                      className="absolute bg-white border border-gray-300 mt-2 w-58 rounded-lg shadow-lg"
                      style={{
                        left: `${dropdownPosition.left}px`,
                        top: `${dropdownPosition.top}px`,
                      }}
                    >
                      <ul className="py-2">
                        <li
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleCopyId(user._id)} // Copy User ID
                        >
                          Copy ID
                        </li>
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                className="text-center py-4 text-gray-500 font-medium"
              >
                No Admins found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAdmins;
