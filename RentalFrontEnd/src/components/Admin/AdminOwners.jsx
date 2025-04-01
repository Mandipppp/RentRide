import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useLocation, useNavigate } from "react-router-dom"; // For navigation
import { toast, ToastContainer } from "react-toastify";


const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State to hold the search query
  const navigate = useNavigate(); // Initialize navigate hook
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightOwnerId = params.get("highlight");
    const [activeUserId, setActiveUserId] = useState(null); // Track active user for dropdown
  
   const [dropdownVisible, setDropdownVisible] = useState(false); // Track visibility of dropdown
    const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0 }); // State for dropdown position
     const [showBlockModal, setShowBlockModal] = useState(false); // Show/Hide block modal
      const [blockReason, setBlockReason] = useState(""); // Store block reason
      const [userToBlock, setUserToBlock] = useState(null); // Store user being blocked
      const dropdownRef = useRef(null); // Reference for dropdown
    

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getDetails(token); // Fetch all owner details initially
    }
  }, []);

  useEffect(() => {
    if (highlightOwnerId) {
      setTimeout(() => {
        const ownerRow = document.getElementById(`owner-${highlightOwnerId}`);
        if (ownerRow) {
          ownerRow.scrollIntoView({ behavior: "smooth", block: "center" });
          ownerRow.classList.add("bg-yellow-200");

          setTimeout(() => ownerRow.classList.remove("bg-yellow-200"), 2000);
        }
      }, 500); // Delay to ensure the table loads first
    }
  }, [owners, highlightOwnerId]);

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

  const openBlockModal = (userId) => {
    setUserToBlock(userId);
    setShowBlockModal(true);
    setDropdownVisible(false);
  };

  const closeBlockModal = () => {
    setShowBlockModal(false);
    setBlockReason("");
    setUserToBlock(null);
  };

  const confirmBlockUser = () => {
    if (!blockReason.trim()) {
      toast.error("Please provide a reason for blocking.");
      return;
    }

    // console.log("Id: ", userToBlock);
    // console.log("Reason: ", blockReason);


    axios
      .put(
        `http://localhost:3000/api/admin/blockowner/${userToBlock}`,
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
      {/* Navbar */}
      <Navbar />
      <ToastContainer />
      

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
                id={`owner-${owner._id}`}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
                onClick={() => handleUserClick(owner._id)} // Navigate on click
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4 flex items-center">
                  <img
                    src={`http://localhost:3000/${owner.kycId.documents.profilePicture.file}`} 
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
                    owner.kycId.overallStatus === "verified"
                      ? "text-green-500"
                      : owner.kycId.overallStatus === "pending"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {owner.kycId.overallStatus === "verified"
                    ? "Owner Approved"
                    : owner.kycId.overallStatus === "pending"
                    ? "Approval Pending"
                    : "Approval Denied"}
                </td>
                <td className="py-3 px-4"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  toggleDropdown(owner._id, e);
                }}>
                  <button 
                  className="text-gray-500 hover:text-blue-500"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownVisible && activeUserId === owner._id && (
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
                          onClick={() => openBlockModal(owner._id)}
                        >
                          Block User
                        </li>
                        <li
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                          onClick={() => handleSendResetPassword(owner._id)}
                        >
                          Send Reset Password Link
                        </li>
                        <li
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleCopyId(owner._id)} // Copy User ID
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
                No owners found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showBlockModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Block User</h3>
            <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Enter reason..." className="w-full p-2 border rounded-lg mb-4"/>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2" onClick={confirmBlockUser}>Confirm Blocking</button>
            <button className="bg-gray-300 px-4 py-2 rounded-lg" onClick={closeBlockModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOwners;
