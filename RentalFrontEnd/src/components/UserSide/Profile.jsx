// Profile.jsx
import React, { useContext, useEffect, useState } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import ProfileSidebar from "./ProfileSidebar";
import ProfileDetails from "./ProfileDetails";
import PasswordDetails from "./PasswordDetails";
// import { UserContext } from "../../App";
import { useLocation, useNavigate } from "react-router-dom";
import { reactLocalStorage } from "reactjs-localstorage";
import { UserContext } from "../UserContext/UserContext";

const Profile = () => {
  // const [activeView, setActiveView] = useState("profile");
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [activeView, setActiveView] = useState(searchParams.get("section") || "profile");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { isAuthenticated, setIsAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  useEffect(() => {
        setActiveView(searchParams.get("section") || "profile");
      }, [location.search]);

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

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row px-8 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4 bg-white shadow-md rounded-md p-4">

          <h1 className="text-4xl font-bold text-gray-700">Profile</h1>
          <ul className="flex flex-col gap-4 pt-6">
              
            <li className={`text-gray-600 hover:text-gray-800 cursor-pointer ${
                activeView === "profile" ? "font-bold text-gray-800" : ""}`}
                onClick={() => setActiveView("profile")}
            >
              Profile Details
            </li>
            <li className={`text-gray-600 hover:text-gray-800 cursor-pointer ${
              activeView === "password" ? "font-bold text-gray-800" : ""}`}
              onClick={() => setActiveView("password")}
            >
              Update Password
            </li>
            <li className="text-gray-600 hover:text-gray-800 cursor-pointer"
              onClick={handleSignOut}>
              
              Sign Out
            </li>
          </ul>
        </aside>

        {/* Profile Details */}
        {activeView === "profile" && <ProfileDetails />}
        {activeView === "password" && <PasswordDetails />}
        
      </main>

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

      <Footer />
    </div>
  );
};

export default Profile;
