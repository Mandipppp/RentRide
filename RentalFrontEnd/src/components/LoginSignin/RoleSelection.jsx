import React from "react";
import { Link } from "react-router-dom";


const RoleSelection = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-white-100">
    <h2 className="text-4xl font-bold text-gray-800 mt-10">Sign Up</h2>
      <h2 className="text-4xl font-bold text-gray-800 mt-20">I am a</h2>
      <div className="mt-10 flex space-x-8">
        <Link
          to="/signup/renter"
          className="flex flex-col items-center justify-center w-64 h-64 bg-white border border-gray-300 shadow-md hover:shadow-lg rounded-lg hover:bg-blue-50 transition"
        >
          <h3 className="text-xl font-semibold text-gray-700">Renter</h3>
        </Link>
        
        <Link
          to="/signup/owner"
          className="flex flex-col items-center justify-center w-64 h-64 bg-white border border-gray-300 shadow-md hover:shadow-lg rounded-lg hover:bg-blue-50 transition"
        >
          <h3 className="text-xl font-semibold text-gray-700">Owner</h3>
        </Link>
      </div>
    </div>
  );
};

export default RoleSelection;
