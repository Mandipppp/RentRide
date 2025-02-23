import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [accessToken, setAccessToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");

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

  const getData = (token, query = "", status = "", type="") => {
    let url = "http://localhost:3000/api/admin/getPayments";
    let params = [];

    if (query) {
      params.push(`transactionId=${query}`);
      params.push(`senderName=${query}`);
      params.push(`receiverName=${query}`);
    };
    if (status) params.push(`paymentStatus=${status}`);
    if (type) params.push(`paymentType=${type}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPayments(res.data.data);
        console.log(res.data.data);
      })
      .catch((error) => {
        console.error("Error fetching payment details:", error);
        setPayments([]);
      });
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (accessToken) {
      getData(accessToken, query, selectedStatus, selectedType);
    }
  };

  const handleStatusClick = (status) => {
    const newStatus = selectedStatus === status ? "" : status;
    setSelectedStatus(newStatus);
    if (accessToken) {
      getData(accessToken, searchQuery, newStatus, selectedType);
    }
  };

  const handleTypeClick = (type) => {
    const newType = selectedType === type ? "" : type;
    setSelectedType(newType);
    if (accessToken) {
      getData(accessToken, searchQuery, selectedStatus, newType);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedType("");

    if (accessToken) {
      getData(accessToken);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 pt-16">
      <Navbar />
      <h2 className="text-4xl font-bold mb-4">Payments</h2>

      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by transaction ID"
          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500">
          <FaSearch />
        </span>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {["Pending", "Completed", "Failed", "Refunded"].map((status) => (
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
        </div>
        <div className="flex flex-wrap gap-2">
         {["Payment", "Refund"].map((type) => (
          <button
            key={type}
            className={`py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedType === type ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleTypeClick(type)}
          >
            {type}
          </button>
        ))}
        </div>
        <div className="mt-4">
        <button
          onClick={handleClearFilters}
          className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 ease-in-out"
        >
          Clear Filters
        </button>
      </div>
      </div>

      {/* Payments Table */}
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">Transaction ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Booking ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Sender</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Receiver</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Type</th>

            <th className="py-3 px-4 text-gray-600 font-medium">Amount</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Method</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Status</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Date</th>

          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <tr key={payment._id} className="border-b hover:bg-gray-50 transition duration-150">
                <td className="py-3 px-4">{payment.transactionId}</td>
                <td 
                className="py-3 px-4 text-blue-500 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                  navigate(`/adminbooking?highlight=${payment.bookingId}`);
                }}
                >{payment.bookingId}</td>
                <td 
                className="py-3 px-4 text-blue-500 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                  if(payment.senderType === "User"){
                    navigate(`/adminusers?highlight=${payment.senderId._id}`);
                  }else{
                    navigate(`/adminowners?highlight=${payment.senderId._id}`);
                  }
                }}
                >{payment.senderId.name} ({payment.senderType})</td>
                <td 
                className="py-3 px-4 text-blue-500 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                  if(payment.receiverType === "User"){
                    navigate(`/adminusers?highlight=${payment.receiverId._id}`);
                  }else{
                    navigate(`/adminowners?highlight=${payment.receiverId._id}`);
                  }
                }}
                >{payment.receiverId.name} ({payment.receiverType})</td>
                <td className="py-3 px-4">{payment.paymentType}</td>

                <td className="py-3 px-4">Rs. {payment.amountPaid}</td>
                <td className="py-3 px-4">{payment.paymentMethod}</td>
                <td
                  className={`py-3 px-4 font-medium ${
                    payment.paymentStatus === "Completed"
                      ? "text-green-500"
                      : payment.paymentStatus === "Pending"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {payment.paymentStatus}
                </td>
                <td className="py-3 px-4">{new Date(payment.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-500 font-medium">
                No payments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPayments;
