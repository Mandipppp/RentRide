import React from "react";

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-2">
          Only Admin Can Access This Page
        </h2>
        <p className="text-gray-600">You do not have permission to view this page.</p>
      </div>
    </div>
  );
};

export default Unauthorized;
