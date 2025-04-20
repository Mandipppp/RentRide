import React, { useEffect, useState } from 'react'
import OwnerNavigation from './OwnerNavigation'
import OwnerProfileDetails from './OwnerProfileDetails'
import OwnerPasswordDetails from './OwnerPasswordDetails'
import { reactLocalStorage } from 'reactjs-localstorage';
import { useNavigate } from 'react-router-dom';
import OwnerWalletDetails from './OwnerWalletDetails';
import OwnerKYCDetails from './OwnerKYCDetails';
import axios from 'axios';

function OwnerProfilePage() {
  const [activeView, setActiveView] = useState("ownerprofile");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const [hasRejectedDocuments, setHasRejectedDocuments] = useState(false);
  
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
                activeView === "kyc" ? "font-bold text-gray-800" : ""}`}
                onClick={() => setActiveView("kyc")}
            >
              <div className="flex items-center gap-2">
                KYC
                {hasRejectedDocuments && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
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
        {activeView === "kyc" && <OwnerKYCDetails />}


        
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

    </div>
  )
}

export default OwnerProfilePage