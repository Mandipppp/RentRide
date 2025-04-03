import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaCar, FaUsers, FaClipboardList, FaEnvelope, FaBell } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";


const AdminDashboard = () => {
  const [stats, setStats] = useState({
    admins: 0,
    renters: 0,
    owners: 0,
    vehicles: 0,
    bookings: 0,
    queries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [announcementType, setAnnouncementType] = useState("system");
  const [priority, setPriority] = useState("medium");
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:3000/api/admin/dashboardStats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard data.");
        setLoading(false);
      });
  }, []);

  const handleAnnounce = (recipientGroup) => {
    if (!announcement.trim()) {
      toast.error("Please enter an announcement message.");
      return;
    }
    setSelectedRecipient(recipientGroup);
    setShowConfirmDialog(true);
  };

  const confirmAnnouncement = () => {
    const token = reactLocalStorage.get("access_token");
    setIsSending(true);
    setShowConfirmDialog(false);
  
    axios
      .post(
        "http://localhost:3000/api/admin//makeannouncemnet",
        {
          message: announcement,
          recipientGroup: selectedRecipient,
          type: announcementType,
          priority,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        toast.success(res.data.message);
        setAnnouncement("");
      })
      .catch((err) => {
        console.error("Error sending announcement:", err);
        toast.error("Failed to send announcement.");
      })
      .finally(() => {
        setIsSending(false);
        setSelectedRecipient(null);
      });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <Navbar />
      <ToastContainer />

      <div className="pt-16">
        <h2 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Announcement Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Make an Announcement</h3>
            <i className="fa-solid fa-bullhorn text-2xl"></i>
            </div>
            <textarea
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows="4"
              placeholder="Write your announcement here..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
            ></textarea>
            
            <h4 className="text-lg font-medium mt-4">Type:</h4>
            <div className="flex space-x-2 mt-2">
              {['booking', 'kyc', 'payment', 'system', 'vehicle'].map(type => (
                <button
                  key={type}
                  className={`px-4 py-2 rounded-lg ${announcementType === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setAnnouncementType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            
            <h4 className="text-lg font-medium mt-4">Priority:</h4>
            <div className="flex space-x-2 mt-2">
              {['high', 'medium', 'low'].map(level => (
                <button
                  key={level}
                  className={`px-4 py-2 rounded-lg ${
                    level === 'high' ? 'bg-red-600 text-white' :
                    level === 'medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  } ${priority === level ? 'ring-2 ring-offset-2 ring-brown' : ''}`}
                  onClick={() => setPriority(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            
            <h4 className="text-lg font-medium mt-4">Announce to:</h4>
            <div className="flex space-x-2 mt-2">
            {isSending ? (
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                disabled
              >
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Sending...
              </button>
            ) : (
              <>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white"
                onClick={() => handleAnnounce("all", announcement, announcementType, priority)}
              >
                All
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white"
                onClick={() => handleAnnounce("users", announcement, announcementType, priority)}
              >
                Users
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white"
                onClick={() => handleAnnounce("owners", announcement, announcementType, priority)}
              >
                Owners
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white"
                onClick={() => handleAnnounce("renters", announcement, announcementType, priority)}
              >
                Renters
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white"
                onClick={() => handleAnnounce("admins", announcement, announcementType, priority)}
              >
                Admins
              </button>
              </>
              )}
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="lg:col-span-2">
            {loading ? (
              <p className="text-center text-gray-600">Loading data...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard title="Total Admins" count={stats.admins} />
                <DashboardCard title="Total Renters" count={stats.renters} />
                <DashboardCard title="Total Owners" count={stats.owners} />
                <DashboardCard title="Total Vehicles" count={stats.vehicles} />
                <DashboardCard title="Ongoing Bookings" count={stats.bookings} />
                <DashboardCard title="Queries Received" count={stats.queries} />
              </div>
            )}
            {/* Quick Actions Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-center">
                <QuickActionButton title="Add Admin" icon={<FaUserPlus />} onClick={() => navigate("/adminadmins")} />
                <QuickActionButton title="Add Page" icon={<FaUserPlus />} onClick={() => navigate("/adminaddpage")} />
                
                <QuickActionButton title="Edit Contact Details" icon={<FaUserPlus />} onClick={() => navigate("/admincontactpage")} />
                <QuickActionButton title="View Users" icon={<FaUsers />} onClick={() => navigate("/adminusers")} />
                <QuickActionButton title="View Owners" icon={<FaUsers />} onClick={() => navigate("/adminowners")} />
                <QuickActionButton title="View Bookings" icon={<FaClipboardList />} onClick={() => navigate("/adminbooking")} />
                <QuickActionButton title="View Payments" icon={<FaClipboardList />} onClick={() => navigate("/adminpayment")} />
                <QuickActionButton title="View Reviews" icon={<FaClipboardList />} onClick={() => navigate("/adminreviews")} />
                <QuickActionButton title="View Queries" icon={<FaEnvelope />} onClick={() => navigate("/admincontactqueries")} />
                {/* <QuickActionButton title="Send Notification" icon={<FaBell />} onClick={() => console.log("Send Notification")} /> */}
              </div>
            </div>
          </div>
          
          
        </div>

        
      </div>
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%] shadow-xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Announcement
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium text-gray-700">Message:</p>
                <p className="text-gray-600 mt-1">{announcement}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-700">Type:</p>
                  <p className="text-gray-600 capitalize">{announcementType}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Priority:</p>
                  <p className="text-gray-600 capitalize">{priority}</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Sending to:</p>
                <p className="text-gray-600 capitalize">{selectedRecipient}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAnnouncement}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isSending ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </div>
                ) : (
                  "Confirm & Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardCard = ({ title, count }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
    <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
    <p className="text-4xl font-bold text-orange-500">{count}</p>
  </div>
);

const QuickActionButton = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center space-x-2 bg-gray-700 text-white py-4 px-3 rounded-lg shadow-md hover:bg-gray-900 transition duration-300"
  >
    <span className="text-lg">{icon}</span>
    <span className="font-semibold">{title}</span>
  </button>
);

export default AdminDashboard;
