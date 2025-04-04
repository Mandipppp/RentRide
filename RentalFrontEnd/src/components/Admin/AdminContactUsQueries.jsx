import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';


const AdminContactUsQueries = () => {
  const [Queries, setQueries] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [responseTexts, setResponseTexts] = useState({}); // Stores responses for each query
  const navigate = useNavigate();
  const [processingQueries, setProcessingQueries] = useState({});

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getDetails(token);
    }
  }, []);

  const getDetails = (token, query = "") => {
    const url = query
      ? `http://localhost:3000/api/admin/getContactQueries?name=${query}&email=${query}`
      : "http://localhost:3000/api/admin/getContactQueries";

    axios
      .get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setQueries(res.data.data))
      .catch((error) => {
        if (error.response?.status === 403) {
          navigate("/unauthorized");
        } else {
          console.error("Error fetching queries:", error);
          setQueries([]);
        }
      });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (accessToken) getDetails(accessToken, query);
  };

  const handleStatusChange = async (queryId, newStatus) => {
    const responseText = responseTexts[queryId] || ""; // Get text for specific query
    
    setProcessingQueries(prev => ({ ...prev, [queryId]: true }));
    try {
      await axios.put(
        `http://localhost:3000/api/admin/contact-query/${queryId}/respond`,
        { response: responseText, status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      toast.success(`Query marked as ${newStatus}`);
      getDetails(accessToken); // Refresh queries
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update query status.");
    } finally {
      // Clear loading state
      setProcessingQueries(prev => ({ ...prev, [queryId]: false }));
    }
  };

  const handleResponseChange = (queryId, value) => {
    setResponseTexts((prev) => ({ ...prev, [queryId]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <ToastContainer />

      <h2 className="text-4xl font-bold mb-4">Contact-Us Queries</h2>

      {/* Search Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name or email"
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Queries Table */}
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Name</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Email</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Subject</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Message</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Created At</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Status</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Response</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {Queries.length > 0 ? (
            Queries.map((query, index) => (
              <tr key={query._id} className="border-b hover:bg-gray-50 transition duration-150">
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4">{query.name}</td>
                <td className="py-3 px-4">{query.email}</td>
                <td className="py-3 px-4">{query.subject}</td>
                <td className="py-3 px-4">{query.message}</td>
                <td className="py-3 px-4">{new Date(query.createdAt).toLocaleDateString()}</td>
                <td
                  className={`py-3 px-4 font-semibold ${
                    query.status === "Pending"
                      ? "text-yellow-500"
                      : query.status === "Resolved"
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  {query.status}
                </td>

                <td className="py-3 px-4">
                    {query.status === "Pending" ? (
                        <textarea
                        value={responseTexts[query._id] || ""}
                        onChange={(e) => handleResponseChange(query._id, e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none 
                                    resize-none h-20 max-h-32 overflow-y-auto"
                        placeholder="Write a response (optional)..."
                        />
                    ) : (
                        <div className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700 
                                        h-20 max-h-32 overflow-y-auto">
                        {query.response || "N/A"}
                        </div>
                    )}
                    </td>


                {/* Action Buttons */}
                <td className="py-3 px-4">
                  {query.status === "Pending" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusChange(query._id, "Resolved")}
                      disabled={processingQueries[query._id]}
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                        processingQueries[query._id]
                          ? 'bg-green-400 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white`}
                    >
                      {processingQueries[query._id] ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        "Resolve"
                      )}
                    </button>
                    <button
                      onClick={() => handleStatusChange(query._id, "Closed")}
                      disabled={processingQueries[query._id]}
                      className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                        processingQueries[query._id]
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
                    >
                      {processingQueries[query._id] ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        "Close"
                      )}
                    </button>
                  </div>
                )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center py-4 text-gray-500 font-medium">
                No Queries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminContactUsQueries;
