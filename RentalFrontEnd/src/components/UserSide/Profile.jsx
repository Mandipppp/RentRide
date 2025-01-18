// Profile.jsx
import React, { useContext, useState } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import ProfileSidebar from "./ProfileSidebar";
import ProfileDetails from "./ProfileDetails";
import PasswordDetails from "./PasswordDetails";
// import { UserContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { reactLocalStorage } from "reactjs-localstorage";
import { UserContext } from "../UserContext/UserContext";

const Profile = () => {
  const [activeView, setActiveView] = useState("profile");
  const { isAuthenticated, setIsAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Clear the token from local storage
    reactLocalStorage.remove("access_token");

    if (setIsAuthenticated) {
      setIsAuthenticated(false); // Mark as logged out
    }

    // Redirect to the login page
    navigate("/login");
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

      <Footer />
    </div>
  );
};

export default Profile;
