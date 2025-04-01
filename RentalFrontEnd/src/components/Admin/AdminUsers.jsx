import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useLocation, useNavigate } from "react-router-dom"; // For navigation
import { toast, ToastContainer } from "react-toastify";


const AdminUsers = () => {
  const [Users, setUsers] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State to hold the search query
  const [activeUserId, setActiveUserId] = useState(null); // Track active user for dropdown
  const [dropdownVisible, setDropdownVisible] = useState(false); // Track visibility of dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0 }); // State for dropdown position
  const [showBlockModal, setShowBlockModal] = useState(false); // Show/Hide block modal
  const [blockReason, setBlockReason] = useState(""); // Store block reason
  const [userToBlock, setUserToBlock] = useState(null); // Store user being blocked
  const dropdownRef = useRef(null); // Reference for dropdown
  const navigate = useNavigate(); // Initialize navigate hook
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightUserId = params.get("highlight");

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

  useEffect(() => {
        if (highlightUserId) {
          setTimeout(() => {
            const userRow = document.getElementById(`user-${highlightUserId}`);
            if (userRow) {
              userRow.scrollIntoView({ behavior: "smooth", block: "center" });
              userRow.classList.add("bg-yellow-200");
    
              setTimeout(() => userRow.classList.remove("bg-yellow-200"), 2000);
            }
          }, 500); // Delay to ensure the table loads first
        }
      }, [Users, highlightUserId]);

  const getDetails = (token, query = "") => {
    const url = query
      ? `http://localhost:3000/api/admin/getUsers?name=${query}&email=${query}`
      : "http://localhost:3000/api/admin/getUsers";

    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in Authorization header
        },
      })
      .then((res) => {
        setUsers(res.data.data);
        // console.log("Users data:", res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          navigate("/unauthorized");
        } else {
          console.error("Error fetching user details:", error);
          setUsers([]);
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

  const handleUserClick = (userId) => {
    // navigate(`/users/${userId}`); // Navigate to the user's details page
  };

  const toggleDropdown = (userId, e) => {
    if (activeUserId === userId) {
      setDropdownVisible(!dropdownVisible); 
    } else {
      setActiveUserId(userId);
      setDropdownVisible(true);

      const rect = e.target.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = 200;
      const newLeft = rect.right + dropdownWidth > windowWidth ? rect.left - dropdownWidth : rect.left;

      setDropdownPosition({
        left: newLeft,
        top: rect.bottom,
      });
    }
  };

  const openBlockModal = (user) => {
    setUserToBlock(user);
    setShowBlockModal(true);
    setDropdownVisible(false);
  };

  const closeBlockModal = () => {
    setShowBlockModal(false);
    setBlockReason("");
    setUserToBlock(null);
  };

  const confirmBlockUser = () => {
    if (!blockReason.trim() && userToBlock.blockStatus==="active") {
      toast.error("Please provide a reason for blocking.");
      return;
    }

    // console.log("Id: ", userToBlock._id);
    // console.log("Reason: ", blockReason);

    if (userToBlock.blockStatus==="active") {
      axios
      .put(
        `http://localhost:3000/api/admin/blockuser/${userToBlock._id}`,
        { reason: blockReason },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then(() => {
        toast.success("User blocked successfully.");
        getDetails(accessToken);
        closeBlockModal();
      })
      .catch((error) => {
        console.error("Error blocking user:", error);
        toast.error(error.response.data.message || "Failed to block user.");
      });
    }else { 
      axios
      .put(
        `http://localhost:3000/api/admin/unblockuser/${userToBlock._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then(() => {
        toast.success("User unblocked successfully.");
        getDetails(accessToken);
        closeBlockModal();
      })
      .catch((error) => {
        console.error("Error unblocking user:", error);
        toast.error(error.response.data.message || "Failed to unblock user.");
      });
    }
  };

  const handleBlockUser = (userId) => {
    console.log(`Blocking user with ID: ${userId}`);
  };

  const handleSendResetPassword = (userId) => {
    console.log(`Sending reset password link to user with ID: ${userId}`);
  };

  const handleCopyId = (userId) => {
    navigator.clipboard.writeText(userId).then(() => {
      toast.success("User ID copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <ToastContainer />
      
      <h2 className="text-4xl font-bold mb-4">Users</h2>
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

      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Name</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Contact</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Email</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Blocked Status</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Created At</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {Users.length > 0 ? (
            Users.map((user, index) => (
              <tr
                key={user._id}
                id={`user-${user._id}`}
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
                <td
                  className={`py-3 px-4 font-medium ${
                    user.blockStatus === "active"
                      ? "text-green-500"
                      : user.blockStatus === "blocked"
                      ? "text-red-500"
                      : "text-yellow-500"
                  }`}
                >
                  {user.blockStatus === "active"
                    ? "Active"
                    : user.blockStatus === "blocked"
                    ? "Bocked"
                    : "Denied"}
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
                      ref={dropdownRef} // Attach ref to the dropdown div
                      className="absolute bg-white border border-gray-300 mt-2 w-58 rounded-lg shadow-lg"
                      style={{
                        left: `${dropdownPosition.left}px`,
                        top: `${dropdownPosition.top}px`,
                      }}
                    >
                      <ul className="py-2">
                        <li
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                          onClick={() => openBlockModal(user)}
                        >
                          {user.blockStatus==="active" ? "Block User" : "Unblock User"}
                        </li>
                        <li
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                          onClick={() => handleSendResetPassword(user._id)}
                        >
                          Send Reset Password Link
                        </li>
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
                No Users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showBlockModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">{userToBlock.blockStatus==="active" ? "Block User" : "Unblock User"}</h3>
            {userToBlock.blockStatus==="active" && <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Enter reason..." className="w-full p-2 border rounded-lg mb-4"/>}
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2" onClick={confirmBlockUser}>{userToBlock.blockStatus==="active" ? "Confirm Blocking" : "Confirm Unblock"}</button>
            <button className="bg-gray-300 px-4 py-2 rounded-lg" onClick={closeBlockModal}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;
