import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast, ToastContainer } from "react-toastify";
import { reactLocalStorage } from "reactjs-localstorage";
import axios from "axios";

const AdminPageDetail = () => {
  const { id } = useParams(); // Get the page id from URL params
  const [page, setPage] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Fetch the page details by ID when the component mounts
  useEffect(() => {
    const fetchPageDetails = async () => {
      try {
        const token = reactLocalStorage.get("access_token");
        const response = await axios.get(`http://localhost:3000/api/admin/page/getPage/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const pageData = response.data.data;
        setPage(pageData);
        setTitle(pageData.title);
        setSlug(pageData.slug);
        setContent(pageData.content);
      } catch (error) {
        console.error("Error fetching page details:", error);
        toast.error("Error fetching page details.");
      }
    };

    fetchPageDetails();
  }, [id]);

  // Handle editing the page
  const handleEdit = async () => {
    try {
      const token = reactLocalStorage.get("access_token");
      const response = await axios.put(
        `http://localhost:3000/api/admin/page/editpage/${id}`,
        {
          title,
          slug,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Page updated successfully!");
    } catch (error) {
      console.error("Error updating page:", error);
      toast.error(error.response.data.message || "Error updating page. Please try again.");
    }
  };

  // Handle editing the page
  const handleEditAndNotify = async () => {
    setLoading(true);
    try {
      const token = reactLocalStorage.get("access_token");
      const response = await axios.put(
        `http://localhost:3000/api/admin/page/editpageandnotify/${id}`,
        {
          title,
          slug,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Page updated successfully!");
      toast.success("Notified Users!");
    } catch (error) {
      console.error("Error updating page:", error);
      toast.error(error.response.data.message || "Error updating page. Please try again.");
    }finally {
      setLoading(false);
    }
  };

  // Handle deleting the page
  const handleDelete = async () => {
    try {
      const token = reactLocalStorage.get("access_token");
      const response = await axios.delete(`http://localhost:3000/api/admin/page/deletepage/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Page deleted successfully!");

      // Navigate after deletion
      setTimeout(() => {
        navigate("/adminpages");
      }, 2000);
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error(error.response.data.message || "Error deleting page. Please try again.");
    }
  };

  // Show the delete modal
  const showDeleteConfirmation = () => setShowDeleteModal(true);
  const hideDeleteConfirmation = () => setShowDeleteModal(false);

  if (!page) {
    return <div>Loading...</div>; // Show loading state if the page data hasn't loaded
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <ToastContainer />
      {loading && (
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="text-white">Processing... Please wait</div>
      </div>
    )}

      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate("/adminpages")}
          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-150"
        >
          Back
        </button>
        <h2 className="text-4xl font-bold ml-4">
          Pages <span className="text-2xl font-light">/ {page.title}</span>
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium">Page Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Content</label>
          <ReactQuill value={content} onChange={(value) => setContent(value)} className="bg-white h-64 mb-14" />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleEdit}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150"
          >
            Edit Page
          </button>

          <button
            onClick={handleEditAndNotify}
            className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition duration-150"
          >
            Edit & Notify Users
          </button>
          <button
            onClick={showDeleteConfirmation}
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-150"
          >
            Delete Page
          </button>
        </div>
      </div>

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

export default AdminPageDetail;
