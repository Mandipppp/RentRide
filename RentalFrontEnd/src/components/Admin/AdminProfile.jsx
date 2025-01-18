import React, {useState } from "react";

import { useNavigate } from "react-router-dom";
import { reactLocalStorage } from "reactjs-localstorage";
import Navbar from "./Navbar";
import ProfileDetails from "../UserSide/ProfileDetails";
import PasswordDetails from "../UserSide/PasswordDetails";

const AdminProfile = () => {
  const [activeView, setActiveView] = useState("profile");
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Clear the token from local storage
    reactLocalStorage.remove("access_token");
    // Redirect to the login page
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row px-8 py-8 gap-8 mt-10">
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
    </div>
  );
};

export default AdminProfile;
