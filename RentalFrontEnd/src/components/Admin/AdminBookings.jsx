import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useLocation, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightBookingId = params.get("highlight");

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
      getData(token);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
      if (highlightBookingId) {
        setTimeout(() => {
          const bookingRow = document.getElementById(`booking-${highlightBookingId}`);
          if (bookingRow) {
            bookingRow.scrollIntoView({ behavior: "smooth", block: "center" });
            bookingRow.classList.add("bg-yellow-200");
  
            setTimeout(() => bookingRow.classList.remove("bg-yellow-200"), 2000);
          }
        }, 500); // Delay to ensure the table loads first
      }
    }, [bookings, highlightBookingId]);

  const getData = (token, query = "", status = "") => {
    let url = "http://localhost:3000/api/admin/getBookings";
    let params = [];

    if (query) {
        params.push(`renterName=${query}`);
        params.push(`ownerName=${query}`);
        params.push(`vehicleName=${query}`);
    }
    if (status) params.push(`bookingStatus=${status}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    axios
      .get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setBookings(res.data.data);
        // console.log(res.data.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          navigate("/unauthorized");
        } else {
          console.error("Error fetching booking details:", error);
          setBookings([]);
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

  const handleBookingClick = (bookingId) => {
    navigate(`/adminbooking/${bookingId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <h2 className="text-4xl font-bold mb-4">Bookings</h2>

      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by renter, vehicle, or booking ID"
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500">
          <FaSearch />
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["Pending", "Confirmed", "Cancelled", "Completed"].map((status) => (
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
            <th className="py-3 px-4 text-gray-600 font-medium">Renter</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Vehicle</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Owner</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Start Date</th>
            <th className="py-3 px-4 text-gray-600 font-medium">End Date</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Booking Status</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {bookings.length > 0 ? (
            bookings.map((booking, index) => (
              <tr
                key={booking._id}
                id={`booking-${booking._id}`}
                className="border-b hover:bg-gray-50 transition duration-150 cursor-pointer"
                onClick={() => handleBookingClick(booking._id)}
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td 
                className="py-3 px-4 text-blue-500 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                  navigate(`/adminusers?highlight=${booking.renterId._id}`);
                }}
                >{booking.renterId.name}</td>
                <td 
                className="py-3 px-4 text-blue-500 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                  navigate(`/adminvehicles?highlight=${booking.vehicleId._id}`);
                }}
                >{booking.vehicleId.name}</td>
                <td 
                className="py-3 px-4 text-blue-500 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                  navigate(`/adminowners?highlight=${booking.ownerId._id}`);
                }}
                >{booking.ownerId.name}</td>
                <td className="py-3 px-4">{new Date(booking.startDate).toLocaleDateString()}</td>
                <td className="py-3 px-4">{new Date(booking.endDate).toLocaleDateString()}</td>
                <td className={`py-3 px-4 font-medium text-${
                  booking.bookingStatus === "Pending" ? "yellow" :
                  booking.bookingStatus === "Confirmed" ? "green" :
                  booking.bookingStatus === "Completed" ? "blue" :
                  booking.bookingStatus === "Active" ? "green" : "red"
                }-500`}>
                  {booking.bookingStatus}
                </td>
                <td className="py-3 px-4">
                  <button className="text-gray-500 hover:text-blue-500">...
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-4 text-gray-500 font-medium">
                No bookings found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBookings;