import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";


const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pageIdToDelete, setPageIdToDelete] = useState(null);
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
      ? `http://localhost:3000/api/admin/page/getPages?title=${query}&slug=${query}`
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

  const handleAddPage = () => {
    navigate('/adminaddpage');
  };

  const handleEdit = (pageId) => {
    navigate(`/adminpage/${pageId}`);
  };

  const handleDelete = async (pageId) => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/admin/page/deletepage/${pageIdToDelete}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success("Page deleted successfully!");
      setShowDeleteModal(false);
      setPageIdToDelete(null); 

      getDetails(accessToken);
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("Error deleting page. Please try again.");
    }
  };

  const showDeleteConfirmation = (pageId) => {
    setPageIdToDelete(pageId); // Set the page id to delete
    setShowDeleteModal(true); // Show the delete confirmation modal
  };

  const hideDeleteConfirmation = () => {
    setShowDeleteModal(false); // Hide the modal
    setPageIdToDelete(null); // Reset the page id
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      {/* Navbar */}
      <Navbar />
      <ToastContainer />

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
          placeholder="Search by page title or slug"
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
                
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4">{page.title}</td>
                <td className="py-3 px-4">{page.slug}</td>
                <td className="py-3 px-4">{new Date(page.updatedAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 flex justify-start space-x-2">
                    {/* Edit Button */}
                    <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering onClick for the row
                        handleEdit(page._id);
                    }}
                    >
                    Edit
                    </button>
                    
                    {/* Delete Button */}
                    <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering onClick for the row
                        showDeleteConfirmation(page._id);
                    }}
                    >
                    Delete
                    </button>
                </td>
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

       {/* Delete Confirmation Modal */}
       {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-100">
            <h3 className="text-xl font-semibold mb-4">Are you sure you want to delete this page?</h3>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={hideDeleteConfirmation} // Hide the modal
                className="bg-gray-500 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete} // Proceed with delete
                className="bg-red-500 text-white py-2 px-4 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPages;
