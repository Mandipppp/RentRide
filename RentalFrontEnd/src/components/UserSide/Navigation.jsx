import React, { useContext, useEffect, useState } from "react";
// import { UserContext } from "../../App";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../UserContext/UserContext";
import axios from "axios";

const Navigation = () => {
  const location = useLocation(); // Hook to get the current path

  const { isAuthenticated, loading } = useContext(UserContext);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

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

        // Calculate unread notifications
        const unread = fetchedNotifications.filter((notification) => notification.status === 'unread');
        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [token]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
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


  if (loading) {
    return (
      <header className="bg-white shadow">
        <nav className="flex justify-between items-center px-10 py-4">
          <h1 className="text-xl font-bold text-gray-800">RentRide</h1>
          <div>Loading...</div>
        </nav>
      </header>
    );
  }
  return (
    <header className="bg-white shadow">
      <nav className="flex justify-between items-center px-10 py-4">
        {/* Logo */}
        <h1 className="text-xl font-bold text-gray-800">RentRide</h1>

        {/* Menu Links */}
        <ul className="flex space-x-8 text-gray-600">
          <li className="hover:text-black">
          <Link to="/home"  
            className={`${
                location.pathname === "/home"
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
              >
                Home</Link>
          </li>
          <li className="hover:text-black">
            <Link to="/browsevehicles"  
            className={`${
                location.pathname === "/browsevehicles"
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
              >
                Vehicles</Link>
          </li>
          <li className="hover:text-black">
            <Link to="/contact"  
            className={`${
                location.pathname === "/contact"
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
              >
                Contact Us</Link>
          </li>
          {isAuthenticated && (
            <li className="hover:text-black">
              <Link to="/myBookings"  
            className={`${
                location.pathname === "/myBookings"
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
              >
                My Bookings</Link>
            </li>
          )}
        </ul>

        <div className="flex items-center space-x-8">
          {/* Notification Button */}
          {isAuthenticated && (
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
            
          </div>)}

        {/* User Options */}
        {isAuthenticated ? (
          <Link to="/profile">
            <i className="fas fa-user text-gray-600 hover:text-black"></i>
          </Link>
        ) : (
          <div className="flex space-x-4">
            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800">LOGIN</Link>
            <Link to="/signup" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800">SIGN UP</Link>
          </div>
        )}
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
