import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";

const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getDetails(token);
    }
  }, []);

  const getDetails = (token, query = "") => {
    const url = query
      ? `http://localhost:3000/api/admin/page/getPages?title=${query}`
      : "http://localhost:3000/api/admin/page/getPages";

    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPages(res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          navigate("/unauthorized");
        } else {
          console.error("Error fetching page details:", error);
          setPages([]);
        }
      });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (accessToken) {
      getDetails(accessToken, query);
    }
  };

  const handleUserClick = (pageId) => {
    navigate(`/page/${pageId}`); // Navigate to the user's details page
  };

  const handleAddPage = () => {
    navigate('/adminaddpage');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      {/* Navbar */}
      <Navbar />

     {/* Title and Add Page Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-4xl font-bold">Pages</h2>
        <button
          onClick={handleAddPage}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150"
        >
          Add Page
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by page"
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500">
          <i className="fas fa-search"></i>
        </span>
      </div>

      {/* Table */}
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">Id</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Page Title</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Slug</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Last Updated</th>
            <th className="py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.length > 0 ? (
            pages.map((page, index) => (
              <tr
                key={page._id}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
                onClick={() => handleUserClick(page._id)}
              >
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="6"
                className="text-center py-4 text-gray-500 font-medium"
              >
                No Pages found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPages;
