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
    let url = "http://localhost:3000/api/admin/getPayments";
    let params = [];

    if (query) params.push(`transactionId=${query}`);
    if (status) params.push(`paymentStatus=${status}`);

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
    setSearchQuery("");
    setSelectedStatus("");
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
        <button
          onClick={handleClearFilters}
          className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 ease-in-out"
        >
          Clear Filters
        </button>
      </div>

      {/* Payments Table */}
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-600 font-medium">Transaction ID</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Sender</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Receiver</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Amount</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Method</th>
            <th className="py-3 px-4 text-gray-600 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <tr key={payment._id} className="border-b hover:bg-gray-50 transition duration-150">
                <td className="py-3 px-4">{payment.transactionId}</td>
                <td className="py-3 px-4">{payment.senderType} ({payment.senderId})</td>
                <td className="py-3 px-4">{payment.receiverType} ({payment.receiverId})</td>
                <td className="py-3 px-4">${payment.amountPaid}</td>
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
