import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

const AdminReviews = () => {
  const [Reviews, setReviews] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getData(token);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const getData = (token, query = "", status = "") => {
    let url = "http://localhost:3000/api/admin/reviews";
    let params = [];

    if (query) {
        params.push(`userName=${query}`);
        params.push(`vehicleName=${query}`);
    }
    if (status) params.push(`status=${status}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    axios
      .get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setReviews(res.data.data);
        // console.log(res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          navigate("/unauthorized");
        } else {
          console.error("Error fetching review details:", error);
          setReviews([]);
        }
      });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (accessToken) {
      getData(accessToken, query, selectedStatus);
    }
  };

  const handleStatusClick = (status) => {
    const newStatus = selectedStatus === status ? "" : status;
    setSelectedStatus(newStatus);
    if (accessToken) {
      getData(accessToken, searchQuery, newStatus);
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus("");
    setSearchQuery("");
    if (accessToken) {
      getData(accessToken);
    }
  };

  const toggleReviewStatus = (reviewId, currentStatus) => {
    const newStatus = currentStatus === "Approved" ? "Rejected" : "Approved";
    axios
      .put(
        `http://localhost:3000/api/admin/updatereview/${reviewId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .then(() => {
        getData(accessToken, searchQuery, selectedStatus);
      })
      .catch((error) => {
        console.error("Error updating review status:", error);
      });
  };


  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <h2 className="text-4xl font-bold mb-4">Reviews</h2>

      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by User or Vehicle name."
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500">
          <FaSearch />
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["Pending", "Approved", "Rejected"].map((status) => (
          <button
            key={status}
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedStatus === status ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleStatusClick(status)}
          >
            {status}
          </button>
        ))}
        <button
          onClick={handleClearFilters}
          className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 ease-in-out"
        >
          Clear Filters
        </button>
      </div>

      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">User</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Vehicle</th>
            <th className="py-3 px-4 text-gray-600 font-medium">BookingId</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Rating</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Comment</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Date</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Status</th>
            <th className="py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {Reviews.length > 0 ? (
            Reviews.map((review, index) => (
              <tr
                key={review._id}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4">{review.userId.name}</td>
                <td className="py-3 px-4">{review.vehicleId.name}</td>
                <td className="py-3 px-4">{review.bookingId._id}</td>
                <td className="py-3 px-4">{review.rating}</td>
                <td className="py-3 px-4">{review.comment}</td>
                <td className="py-3 px-4">{new Date(review.createdAt).toLocaleDateString()}</td>
                <td className={`py-3 px-4 font-medium text-${
                  review.status === "Pending" ? "yellow" :
                  review.status === "Approved" ? "green" : "red"
                }-500`}>
                  {review.status}
                </td>
                <td className="py-3 px-4">
                <button
                    onClick={() => toggleReviewStatus(review._id, review.status)}
                    className={`py-2 px-4 flex items-center gap-2 rounded-lg text-white font-medium transition duration-200 ease-in-out ${
                    review.status === "Approved"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                >
                    {review.status === "Approved" ? "Reject" : "Approve"}
                </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-4 text-gray-500 font-medium">
                No Reviews found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminReviews;