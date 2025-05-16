import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from "socket.io-client";
import { reactLocalStorage } from 'reactjs-localstorage';

const socket = io("http://localhost:3000");

function OwnerNavigation() {
  const location = useLocation(); // Hook to get the current path

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [hasRejectedDocuments, setHasRejectedDocuments] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuTimeout = useRef(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    // Fetch notifications on component mount
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/notification/view', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const fetchedNotifications = response.data.notifications;
        setNotifications(fetchedNotifications);
        if (response.data.id) {
          socket.emit("register", response.data.id);
        }

        // Calculate unread notifications
        const unread = fetchedNotifications.filter((notification) => notification.status === 'unread');
        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [token]);

  useEffect(() => {
    const checkKycRejection = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/owner/getkycinfo', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHasRejectedDocuments(response.data.hasRejectedDocuments);
      } catch (error) {
        console.error('Error checking KYC rejection status:', error);
      }
    };

    if (token) {
      checkKycRejection();
    }
  }, [token]);

  useEffect(() => {
      socket.on("newNotification", (notification) => {
        setNotifications((prev) => {
          const updatedNotifications = [notification, ...prev];
          const unread = updatedNotifications.filter((n) => n.status === 'unread');
          setUnreadCount(unread.length);
          return updatedNotifications;
        });
      });
    
      return () => {
        socket.off("newNotification");
      };
    }, [token]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleSignOut = () => {
    // Open the confirmation dialog when the sign-out is clicked
    setIsDialogOpen(true);
  };

  const confirmSignOut = () => {
    // Clear the token from local storage
    reactLocalStorage.remove("access_token");
    // Redirect to the login page
    navigate("/login");
  };

  const cancelSignOut = () => {
    // Close the confirmation dialog without signing out
    setIsDialogOpen(false);
  };

  const handleMouseEnter = () => {
    if (userMenuTimeout.current) {
      clearTimeout(userMenuTimeout.current); // Clear any existing timeout
    }
    setIsUserMenuOpen(true);
  };
  
  const handleMouseLeave = () => {
    userMenuTimeout.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 300); // Delay before closing the dropdown
  };

  const markAsRead = async (notificationId) => {
    try {
      // Call backend API to mark the notification as read
      await axios.put(
        `http://localhost:3000/api/notification/${notificationId}/read`, 
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update local state to mark the notification as read
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, status: 'read' }
            : notification
        )
      );
      // Update unread count
      setUnreadCount((prevCount) => prevCount - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to format date in a readable way
  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  // Filtered notifications based on the selected filter
  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(notification => notification.status === 'unread');

  return (
    <header className="bg-white shadow">
      <nav className="flex justify-between items-center px-10 py-4">
        {/* Logo */}
        <h1 className="text-xl font-bold text-gray-800">Owner Panel</h1>

        {/* Menu Links */}
        <ul className="flex space-x-8 text-gray-600">
          <li className="hover:text-black">
            <Link to="/ownerdashboard"  
            className={`${
                location.pathname === "/ownerdashboard"
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
              >
                Dashboard</Link>
          </li>
          <li className="hover:text-black">
          <Link to="/ownervehicle"  
            className={`${
                location.pathname === "/ownervehicle"
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
              >My Vehicles</Link>
          </li>
          <li className="hover:text-black">
          <Link to="/ownerbookings"  
            className={`${
                location.pathname === "/ownerbookings"
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
              >Bookings</Link>
          </li>
        </ul>

        <div className="flex items-center space-x-8">
          {/* Notification Button */}
          <div className="relative">
            <button
              className="relative text-gray-600 hover:text-black focus:outline-none"
              onClick={toggleNotifications}
            >
              <i className="fas fa-bell"></i>
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {isNotificationsOpen && (
              <div className="absolute top-8 right-0 w-80 bg-white border shadow-md rounded-lg overflow-y-auto z-50 max-h-96">
                {/* Filter Buttons */}
                <div className="flex justify-start items-center border-b p-2">
                  <button
                    className={`text-sm font-semibold ${filter === 'all' ? 'text-black' : 'text-gray-500'} mr-4`}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`text-sm font-semibold ${filter === 'unread' ? 'text-black' : 'text-gray-500'}`}
                    onClick={() => setFilter('unread')}
                  >
                    Unread
                  </button>
                </div>

                {/* Notification List */}
                {filteredNotifications.length > 0 ? (
                  <ul className="p-4 pr-6 text-sm text-gray-700">
                    {filteredNotifications.map((notification) => (
                      <li
                      key={notification._id}
                      className="py-3 px-0 pr-8 border-b relative" 
                      onClick={() => markAsRead(notification._id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{notification.type.toUpperCase()}</span>
                      </div>
                      <p
                        className={`${
                          notification.priority === 'high'
                            ? 'text-red-600'
                            : notification.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
              
                      {/* Blue Dot for Unread Notifications */}
                      {notification.status === 'unread' && (
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                      )}
                    </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-gray-500">No notifications available.</p>
                )}
              </div>
            )}
            
          </div>

          {/* Owner Profile Icon */}
          {/* <Link to="/ownerprofile" className="relative">
            <i className="fas fa-user text-gray-600 hover:text-black"></i>
            {hasRejectedDocuments && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </Link> */}

           <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <i className="fas fa-user text-gray-600 hover:text-black cursor-pointer"
            onClick={()=>navigate("/ownerprofile")}
            ></i>
            {hasRejectedDocuments && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute top-8 right-0 w-48 bg-white border shadow-md rounded-lg overflow-hidden z-50">
                <Link to="/ownerprofile?section=ownerprofile" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                  Profile Details
                </Link>
                <Link to="/ownerprofile?section=kyc" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                  <div className="flex items-center gap-2">
                    KYC
                    {hasRejectedDocuments && (
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                </Link>
                <Link to="/ownerprofile?section=ownerwallet" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                  Wallet Update
                </Link>
                <Link to="/ownerprofile?section=ownerpassword" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                  Password Update
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-200"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Confirmation Dialog */}
        {isDialogOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full flex flex-col space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 text-center">
                Are you sure you want to sign out?
              </h3>
              <p className="text-gray-600 text-xs text-center">
                You will be logged out of your account. Please confirm your action.
              </p>
              <div className="flex justify-between mt-6">
                <button
                  className="bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                  onClick={confirmSignOut}
                >
                  Yes, Sign Out
                </button>
                <button
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                  onClick={cancelSignOut}
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
          )}
      </nav>
    </header>
  );
}

export default OwnerNavigation;
