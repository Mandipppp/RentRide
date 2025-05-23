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
  const [errors, setErrors] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  const handleBlockClick = (admin, e) => {
    e.stopPropagation();
    setSelectedAdmin(admin);
    setShowBlockModal(true);
    setDropdownVisible(false);
  };

  const handleBlockSubmit = async () => {
    if (!blockReason.trim() && selectedAdmin.blockStatus !== 'blocked') {
      toast.error('Please provide a reason for blocking');
      return;
    }
  
    try {
      await axios.patch(
        `http://localhost:3000/api/admin/${selectedAdmin._id}/toggle-block`,
        {
          action: selectedAdmin.blockStatus === 'blocked' ? 'unblock' : 'block',
          reason: blockReason
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
  
      toast.success(
        `Admin successfully ${
          selectedAdmin.blockStatus === 'blocked' ? 'unblocked' : 'blocked'
        }`
      );
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedAdmin(null);
      getDetails(accessToken); // Refresh the admin list
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update admin status'
      );
    }
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', email: '' };
    
    // Name validation
    if (!newAdmin.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (newAdmin.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
      isValid = false;
    }
  
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newAdmin.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(newAdmin.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
  
    setErrors(newErrors);
    return isValid;
  };

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
        // console.log("Fetched Admins:", res.data);
        setAdmins(res.data.data);
        setCurrentUserRole(res.data.currentAdmin.role); // Set current user role
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
    if (validateForm()) {
      setShowAddForm(false);
      setShowConfirmation(true);
    }
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: "bg-blue-100 text-blue-800 border border-blue-200",
      superadmin: "bg-purple-100 text-purple-800 border border-purple-200",
      renter: "bg-green-100 text-green-800 border border-green-200"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleStyles[role] || "bg-gray-100 text-gray-800"}`}>
        {role === "admin" ? "Admin" : role === "superadmin" ? "Super Admin" : "User"}
      </span>
    );
  };

  const handleSubmit = () => {
    setIsLoading(true);
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
    .catch(() => toast.error("Failed to add admin"))
    .finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <ToastContainer />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-4xl font-bold">Admins</h2>
        {currentUserRole === "superadmin" && (
        <button
          onClick={handleAddAdmin}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150"
        >
          Add Admin
        </button>
        )}
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
          <div className="mb-4">
            <input
              type="text"
              name="name"
              placeholder="Admin Name"
              value={newAdmin.name}
              onChange={handleInputChange}
              className={`w-full py-2 px-4 border rounded ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Admin Email"
              value={newAdmin.email}
              onChange={handleInputChange}
              className={`w-full py-2 px-4 border rounded ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleCancel} 
              className="bg-gray-400 text-white px-4 py-2 rounded mr-2"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmAddAdmin} 
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add Admin
            </button>
          </div>
        </div>
      )}

    {showConfirmation && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
          <p className="mb-4">Do you confirm to add another admin?</p>
          <div className="flex justify-center gap-2"> 
          <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className={`bg-blue-500 text-white px-4 py-2 rounded mr-2 flex items-center justify-center min-w-[100px] ${
              isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              'Confirm'
            )}
          </button>
          <button 
            onClick={() => setShowConfirmation(false)} 
            disabled={isLoading}
            className={`bg-gray-400 text-white px-4 py-2 rounded ${
              isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-gray-500'
            }`}
          >
            Cancel
          </button>
          </div>
        </div>
      )}


      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Name</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Contact</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Role</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Email</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Status</th>
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
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4 flex items-center">
                  {user.name}
                </td>
                <td className="py-3 px-4">
                  {user.contactNumber || "No Contact Number"}
                </td>
                <td className="py-3 px-4 flex items-center">
                  {getRoleBadge(user.role)}
                </td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.blockStatus === 'blocked'
                        ? 'bg-red-100 text-red-800'
                        : user.blockStatus === 'pending_block'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.blockStatus === 'blocked'
                      ? 'Blocked'
                      : user.blockStatus === 'pending_block'
                      ? 'Pending Block'
                      : 'Active'}
                  </span>
                </td>
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
                      className="absolute bg-white border border-gray-300 mt-2 w-58 rounded-lg shadow-lg z-50"
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
                        {currentUserRole === 'superadmin' && user.role !== 'superadmin' && (
                          <li
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                            onClick={(e) => handleBlockClick(user, e)}
                          >
                            {user.blockStatus === 'blocked' ? (
                              <>
                                Unblock Admin
                              </>
                            ) : (
                              <>
                                Block Admin
                              </>
                            )}
                          </li>
                        )}
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
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {selectedAdmin?.blockStatus === 'blocked'
                ? 'Unblock Admin'
                : 'Block Admin'}
            </h3>
            {selectedAdmin?.blockStatus !== 'blocked' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for blocking
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  required
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                  setSelectedAdmin(null);
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  selectedAdmin?.blockStatus === 'blocked'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                onClick={handleBlockSubmit}
              >
                {selectedAdmin?.blockStatus === 'blocked' ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdmins;
