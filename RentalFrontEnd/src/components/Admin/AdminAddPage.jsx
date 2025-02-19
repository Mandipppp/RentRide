import React, { useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast, ToastContainer } from "react-toastify";
import { reactLocalStorage } from "reactjs-localstorage";
import axios from "axios";


const AdminAddPage = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleSlugChange = (e) =>{
    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  }

  const handleContentChange = (value) => {
    setContent(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Page Data:", { title, slug, content });
    try {
        const token = reactLocalStorage.get("access_token");
  
        const response = await axios.post("http://localhost:3000/api/admin/page/addpage",
        {
            title,
            slug,
            content
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        toast.success("Page added successfully!");

      // Navigate after the delay
    setTimeout(() => {
        navigate("/adminpages");
      }, 2000);
      } catch (error) {
        console.error("Error adding page:", error.response.data.message);
        toast.error(error.response.data.message || "Error adding page. Please try again.");
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <ToastContainer />

      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate("/adminpages")}
          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-150"
        >
          Back
        </button>
        <h2 className="text-4xl font-bold ml-4">
          Pages <span className="text-2xl font-light">/ Add Page</span>
        </h2>
        
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium">Page Title</label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium">Content</label>
          <ReactQuill value={content} onChange={handleContentChange} className="bg-white h-64 mb-12"/>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150"
        >
          Save Page
        </button>
      </form>
    </div>
  );
};

export default AdminAddPage;
