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
        <Route path="/signup/owner" element={<SignupOwner />} />

        {/*ADMIN PART*/}
        <Route path="/adminowners" element={<AdminOwners />} />
        <Route path="/owners/:id" element={<AdminOwnerProfile />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/adminprofile" element={<AdminProfile />} />

        <Route path="/adminusers" element={<AdminUsers />} />
        {/* <Route path="/users/:id" element={<AdminOwnerProfile />} /> */}




        {/* <Route path="/home" element={<HomePage isAuthenticated={isAuthenticated}/>} /> */}

        <Route path="/profile" element={<Profile />} />

        {/* <Route path="/ownerProfile" element={<OwnerProfile />} /> */}

        <Route path="/ownerdashboard" element={<OwnerDashboard />} />
        <Route path="/ownerprofile" element={<OwnerProfilePage />} />




        
        

      </Routes>
    </Router>
    </UserProvider>
  );
};

export default App;
