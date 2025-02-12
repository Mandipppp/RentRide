import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from '../Ui/Button';
import { Card, CardContent } from '../Ui/Card';
import Navigation from "./Navigation";
import { toast, ToastContainer } from "react-toastify";
import car from '../Images/HomeCar.png';
import { reactLocalStorage } from "reactjs-localstorage";

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
        const token = reactLocalStorage.get("access_token");
      try {
        const response = await axios.get("http://localhost:3000/api/user/booking/getAllBookings", {
            headers: { Authorization: `Bearer ${token}` }
          });
        setBookings(response.data.bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500";
      case "Accepted":
        return "bg-blue-500";
      case "Confirmed":
        return "bg-green-500";
      case "Cancelled":
        return "bg-red-500";
      case "Completed":
        return "bg-gray-500";
      default:
        return "bg-orange-500";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer />
      <Navigation />
      <div className="w-full bg-white p-6 rounded-2xl shadow-lg mt-6">
        <h2 className="text-2xl font-bold mb-6">Bookings</h2>
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="text-center text-gray-500 text-lg font-semibold py-10">
            No bookings available. Start booking your first ride!
          </div>
        ) : (
          bookings.map((booking) => (
            <Card key={booking._id} className="p-6 rounded-lg border shadow-sm mb-4">
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex justify-center">
                  <img
                    src={car} // Replace with actual vehicle image if available
                    alt={booking.vehicleId?.name || "Vehicle"}
                    className="rounded-lg shadow-md w-full md:w-auto"
                  />
                </div>
                <div className="md:w-2/3 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">
                      {booking.vehicleId?.name} {booking.vehicleId?.type} <span className="text-gray-500 text-sm">{booking.vehicleId?.builtYear}</span>
                    </h3>
                    <span className={`${getStatusColor(booking.bookingStatus)} text-white text-sm px-3 py-1 rounded-full`}>
                      {booking.bookingStatus}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    {booking.vehicleId?.dailyPrice} NPR <span className="text-sm font-normal text-gray-600">/ day</span>
                  </p>
                  <div>
                    <p className="font-bold text-gray-900">Dates & Times</p>
                    <p className="text-gray-700">From: <span className="font-semibold">{new Date(booking.startDate).toLocaleDateString()}</span></p>
                    <p className="text-gray-700">To: <span className="font-semibold">{new Date(booking.endDate).toLocaleDateString()}</span></p>
                    <p className="text-gray-700">Duration: <span className="font-semibold">{booking.totalDays} days</span></p>
                  </div>
                  <div className="text-xl font-bold text-gray-900 border-t pt-4">
                    Total: <span className="text-orange-600">Rs {booking.amountDue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UserBookings;