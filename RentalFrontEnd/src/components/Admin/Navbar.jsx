import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const menuItems = [
    "Users",
    "Owners",
    "Vehicles",
    "Booking",
    "Reviews",
    "Pages",
    "Contact Us",
    "Queries",
  ];

  return (
    <header className="bg-white shadow fixed top-0 left-0 w-full z-50">
      <nav className="flex items-center justify-between px-6 py-4">
        {/* Logo/Title */}
        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
        
        {/* Menu Items */}
        <div className="flex space-x-6">
          {menuItems.map((item) => (
            <a
              key={item}
              href="#"
              className="text-gray-600 hover:text-blue-500 transition duration-200"
            >
              {item}
            </a>
          ))}
        </div>

        {/* User Icon */}
        <div>
          <Link to="/adminprofile">
            <i className="fas fa-user"></i>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
