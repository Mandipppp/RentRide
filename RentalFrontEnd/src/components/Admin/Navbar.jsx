import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation(); // Hook to get the current path

  const menuItems = [
    { name: "Dashboard", path: "/admindashboard" },
    { name: "Users", path: "/adminusers" },
    { name: "Owners", path: "/adminowners" },
    { name: "Vehicles", path: "/adminvehicles" },
    { name: "Booking", path: "/adminbooking" },
    { name: "Payments", path: "/adminpayment" },
    { name: "Reviews", path: "/adminreviews" },
    { name: "Pages", path: "/adminpages" },
    { name: "Contact Us", path: "/admincontactpage" },
    { name: "Queries", path: "/admincontactqueries" },
  ];

  return (
    <header className="bg-white shadow fixed top-0 left-0 w-full z-50">
      <nav className="flex items-center justify-between px-6 py-4">
        {/* Logo/Title */}
        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>

        {/* Menu Items */}
        <div className="flex space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`${
                location.pathname === item.path
                  ? "text-blue-500 font-bold" // Active style
                  : "text-gray-600 hover:text-blue-500"
              } transition duration-200`}
            >
              {item.name}
            </Link>
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
