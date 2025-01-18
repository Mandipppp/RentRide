import React, { useState } from 'react'
import OwnerNavigation from './OwnerNavigation'
import OwnerProfileDetails from './OwnerProfileDetails'
import OwnerPasswordDetails from './OwnerPasswordDetails'
import { reactLocalStorage } from 'reactjs-localstorage';
import { useNavigate } from 'react-router-dom';
import OwnerWalletDetails from './OwnerWalletDetails';

function OwnerProfilePage() {
  const [activeView, setActiveView] = useState("ownerprofile");
  const navigate = useNavigate();

  const handleSignOut = () => {
      // Clear the token from local storage
      reactLocalStorage.remove("access_token");
      // Redirect to the login page
      navigate("/login");
    };
  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <OwnerNavigation />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row px-8 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4 bg-white shadow-md rounded-md p-4">

          <h1 className="text-4xl font-bold text-gray-700">Profile</h1>
          <ul className="flex flex-col gap-4 pt-6">
              
            <li className={`text-gray-600 hover:text-gray-800 cursor-pointer ${
                activeView === "ownerprofile" ? "font-bold text-gray-800" : ""}`}
                onClick={() => setActiveView("ownerprofile")}
            >
              Profile Details
            </li>
            <li className={`text-gray-600 hover:text-gray-800 cursor-pointer ${
              activeView === "ownerwallet" ? "font-bold text-gray-800" : ""}`}
              onClick={() => setActiveView("ownerwallet")}
            >
              Update Wallet
            </li>
            <li className={`text-gray-600 hover:text-gray-800 cursor-pointer ${
              activeView === "ownerpassword" ? "font-bold text-gray-800" : ""}`}
              onClick={() => setActiveView("ownerpassword")}
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
        {activeView === "ownerprofile" && <OwnerProfileDetails />}
        {activeView === "ownerpassword" && <OwnerPasswordDetails />}
        {activeView === "ownerwallet" && <OwnerWalletDetails />}

        
      </main>

    </div>
  )
}

export default OwnerProfilePage