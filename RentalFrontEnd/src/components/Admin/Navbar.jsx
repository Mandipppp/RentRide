import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { reactLocalStorage } from "reactjs-localstorage";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const Navbar = () => {
  const location = useLocation(); // Hook to get the current path
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const token = localStorage.getItem('access_token');
  const [userId, setUserId] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuTimeout = useRef(null);
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({
    pendingKYC: 0,
    pendingVehicles: 0,
    pendingQueries: 0,
    totalPending: 0
  });

  

  

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
        setUserId(response.data.id);
        if (response.data.id) {
          socket.emit("register", response.data.id);
        }
        // console.log(response.data.id);

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
    const fetchPendingCounts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/admin/pending-counts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data.data);
        setPendingCounts(response.data.data);
      } catch (error) {
        console.error('Error fetching pending counts:', error);
      }
    };

    // Fetch initially and then every 5 minutes
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 300000);

    return () => clearInterval(interval);
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



  const menuItems = [
    { name: "Dashboard", path: "/admindashboard" },
    { name: "Users", path: "/adminusers" },
    { name: "Owners", path: "/adminowners", badge: pendingCounts.pendingKYC > 0 ? pendingCounts.pendingKYC : null,
      badgeColor: "bg-red-500" },
    { name: "Vehicles", path: "/adminvehicles", badge: pendingCounts.pendingVehicles > 0 ? pendingCounts.pendingVehicles : null,
      badgeColor: "bg-red-500" },
    { name: "Booking", path: "/adminbooking" },
    { name: "Payments", path: "/adminpayment" },
    { name: "Reviews", path: "/adminreviews" },
    { name: "Pages", path: "/adminpages" },
    { name: "Contact Us", path: "/admincontactpage" },
    { name: "Queries", path: "/admincontactqueries", badge: pendingCounts.pendingQueries > 0 ? pendingCounts.pendingQueries : null,
      badgeColor: "bg-red-500" },
    { name: "Admins", path: "/adminadmins" },
  ];

  return (
    <header className="bg-white shadow fixed top-0 left-0 w-full z-50">
      <nav className="flex items-center justify-between px-6 py-4">
        {/* Logo/Title */}
        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>

        {/* Menu Items */}
        <div className="flex space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`relative ${
                location.pathname === item.path
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
            >
              {item.name}
              {item.badge && (
            <span className={`absolute -top-2 -right-2 ${item.badgeColor} text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center`}>
              {item.badge}
            </span>
          )}
            </Link>
          ))}
        </div>

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
        {/* User Icon */}
        {/* <div>
          <Link to="/adminprofile">
            <i className="fas fa-user"></i>
          </Link>
        </div> */}
                  {/* User Icon & Dropdown Menu */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <i className="fas fa-user text-gray-600 hover:text-black cursor-pointer"
          onClick={()=>navigate("/adminprofile")}
          ></i>
          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute top-8 right-0 w-48 bg-white border shadow-md rounded-lg overflow-hidden z-50">
              <Link to="/adminprofile?section=profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                Profile Details
              </Link>
              <Link to="/adminprofile?section=password" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
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
};

export default Navbar;
