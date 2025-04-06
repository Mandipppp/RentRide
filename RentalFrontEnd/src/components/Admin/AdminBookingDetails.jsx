import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Navbar from "./Navbar";

const AdminBookingDetails = () => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { bookingId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/admin/getBookings/${bookingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBooking(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching booking details:", error);
        if (error.response?.status === 403) {
          navigate("/unauthorized");
        }
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">Booking not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Booking Details
            </h1>
            <button
              onClick={() => navigate("/adminbooking")}
              className="text-blue-500 hover:text-blue-700"
            >
              ← Back to Bookings
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
              <div className="grid gap-2">
                <p>
                  <span className="font-medium">Name:</span> {booking.vehicleId.name}
                </p>
                <p>
                  <span className="font-medium">Registration:</span>{" "}
                  {booking.vehicleId.registrationNumber}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {booking.vehicleId.type}
                </p>
                <p>
                  <span className="font-medium">Category:</span>{" "}
                  {booking.vehicleId.category}
                </p>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Booking Information</h2>
              <div className="grid gap-2">
                <p>
                  <span className="font-medium">Start Date:</span>{" "}
                  {new Date(booking.startDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">End Date:</span>{" "}
                  {new Date(booking.endDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`font-medium ${
                      booking.bookingStatus === "Confirmed"
                        ? "text-green-600"
                        : booking.bookingStatus === "Pending"
                        ? "text-yellow-600"
                        : booking.bookingStatus === "Completed"
                        ? "text-blue-600"
                        : booking.bookingStatus === "Active"
                        ? "text-green-800"
                        : "text-red-600"
                    }`}
                  >
                    {booking.bookingStatus}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Payment Status:</span>{" "}
                  {booking.paymentStatus}
                </p>
              </div>
            </div>

            {/* Renter Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Renter Information</h2>
              <div className="grid gap-2">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {booking.renterId.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {booking.renterId.email}
                </p>
                <p>
                  <span className="font-medium">Contact:</span>{" "}
                  {booking.renterId.contactNumber}
                </p>
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
              <div className="grid gap-2">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {booking.ownerId.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {booking.ownerId.email}
                </p>
                <p>
                  <span className="font-medium">Contact:</span>{" "}
                  {booking.ownerId.contactNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingDetails;