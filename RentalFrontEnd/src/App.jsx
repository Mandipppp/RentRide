import React, { createContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./components/LoginSignin/Login";
import SignupRenter from "./components/LoginSignin/SignupRenter";
import SignupOwner from "./components/LoginSignin/SignupOwner";

import RoleSelection from "./components/LoginSignin/RoleSelection";
import HomePage from "./components/UserSide/HomePage";
import Profile from "./components/UserSide/Profile";
import axios from "axios";
import Navigation from "./components/UserSide/Navigation";
import { UserProvider } from "./components/UserContext/UserContext";
import OwnerDashboard from "./components/OwnerSide/OwnerDashboard";
import OwnerProfilePage from "./components/OwnerSide/OwnerProfilePage";
import AdminOwners from "./components/Admin/AdminOwners";
import AdminOwnerProfile from "./components/Admin/AdminOwnerProfile";
import Unauthorized from "./components/Admin/Unauthorized";
import AdminProfile from "./components/Admin/AdminProfile";
import AdminUsers from "./components/Admin/AdminUsers";
import ForgotPassword from "./components/LoginSignin/ForgotPassword";
import ResetPassword from "./components/LoginSignin/ResetPassword";
import CompleteRenterSignup from "./components/LoginSignin/CompleteRenterSignup";
import CompleteOwnerSignup from "./components/LoginSignin/CompleteOwnerSignup";
import OwnerAddVehicle from "./components/OwnerSide/OwnerAddVehicle";
import AdminVehicles from "./components/Admin/AdminVehicles";
import OwnerVehicles from "./components/OwnerSide/OwnerVehicles";
import AdminVehicleDetails from "./components/Admin/AdminVehicleDetails";
import OwnerVehicleDetails from "./components/OwnerSide/OwnerVehicleDetails";
import OwnerVehicleDocuments from "./components/OwnerSide/OwnerVehicleDocuments";
import BrowseVehicles from "./components/UserSide/BrowseVehicles";
import ContactPage from "./components/UserSide/ContactPage";



// export const UserContext = createContext(null);

const App = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // Store user details
  const [loading, setLoading] = useState(true); // New state for loading

  // Check for authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
  
    // If there's a token, attempt to fetch user details to validate the token
    if (token) {
      axios
        .get("http://localhost:3000/api/auth/getUserinfo", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          // If successful, set user as authenticated and store user details
          const userData = res.data.data;
          setUserInfo(userData);
          if (userData.role === "renter") {
            setIsAuthenticated(true);
          }
        })
        .catch((error) => {
          console.error("Error fetching user stats:", error);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setLoading(false); // Mark as done loading
        });
    }else {
      setLoading(false); // No token, no need to fetch
    }
  }, []); // Empty dependency array ensures it runs only once on mount.
  

  return (
    <UserProvider value={{ isAuthenticated, userInfo, setIsAuthenticated, loading}}>
    <Router>

      <Routes>
        {/* Redirect root to login page */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* Login and Signup routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<RoleSelection />} /> {/* Redirect to RoleSelection on signup */}
        {/* Other routes for renter or owner pages */}
        <Route path="/signup/renter" element={<SignupRenter />} />
        <Route path="/complete-renter-registration/:token" element={<CompleteRenterSignup />} />

        <Route path="/signup/owner" element={<SignupOwner />} />
        <Route path="/complete-owner-registration/:token" element={<CompleteOwnerSignup />} />
        {/* Forgot Password route for renter or owner pages */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/*ADMIN PART*/}
        <Route path="/adminowners" element={<AdminOwners />} />
        <Route path="/owners/:id" element={<AdminOwnerProfile />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/adminprofile" element={<AdminProfile />} />

        <Route path="/adminusers" element={<AdminUsers />} />
        {/* <Route path="/users/:id" element={<AdminOwnerProfile />} /> */}

        <Route path="/adminvehicles" element={<AdminVehicles />} />
        <Route path="/adminvehicles/:id" element={<AdminVehicleDetails />} />






        {/* <Route path="/home" element={<HomePage isAuthenticated={isAuthenticated}/>} /> */}

        <Route path="/profile" element={<Profile />} />

        {/* OWNER */}

        <Route path="/ownerdashboard" element={<OwnerDashboard />} />
        <Route path="/ownerprofile" element={<OwnerProfilePage />} />
        <Route path="/owneraddvehicle" element={<OwnerAddVehicle />} />
        <Route path="/ownervehicle" element={<OwnerVehicles />} />
        <Route path="/ownervehicle/:vehicleId" element={<OwnerVehicleDetails />} />
        <Route path="/ownervehicledocuments/:vehicleId" element={<OwnerVehicleDocuments />} />



      {/* USER */}


      <Route path="/browsevehicles" element={<BrowseVehicles />} />
      <Route path="/contact" element={<ContactPage />} />



        
        

      </Routes>
    </Router>
    </UserProvider>
  );
};

export default App;
