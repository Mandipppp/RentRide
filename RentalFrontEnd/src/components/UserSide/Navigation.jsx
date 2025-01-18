import React, { useContext } from "react";
// import { UserContext } from "../../App";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext/UserContext";

const Navigation = () => {
  const { isAuthenticated, loading } = useContext(UserContext);

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
            <a href="#">Home</a>
          </li>
          <li className="hover:text-black">
            <a href="#">Vehicles</a>
          </li>
          <li className="hover:text-black">
            <a href="#">Contact Us</a>
          </li>
          {isAuthenticated && (
            <li className="hover:text-black">
              <a href="#">My Bookings</a>
            </li>
          )}
        </ul>

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
      </nav>
    </header>
  );
};

export default Navigation;
