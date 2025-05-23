import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from '../Ui/Button';
import { Card, CardContent } from '../Ui/Card';
import Navigation from "./Navigation";
import { toast, ToastContainer } from "react-toastify";
import car from '../Images/HomeCar.png';
import { reactLocalStorage } from "reactjs-localstorage";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
const socket = io("http://localhost:3000");

const UserBookings = () => {
  const [bookings, setBookings] = useState({ upcoming: [], active: [], completed: [], cancelled: [], refunds: [] });
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({
    upcoming: false,
    active: false,
    completed: true,
    cancelled: true,
    refunds: false,
  });
  const navigate = useNavigate();


  useEffect(() => {
    const fetchBookings = async () => {
        const token = reactLocalStorage.get("access_token");
      try {
        const response = await axios.get("http://localhost:3000/api/user/booking/getAllBookings", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBookings(response.data.bookings);
          // console.log(response.data);

          if(response.data.userId){
            socket.emit('register', response.data.userId);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        // toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

    useEffect(() => {
           socket.on("bookingUpdated", (updatedBooking) => {
               console.log("Booking update received:", updatedBooking);
               setBookings((prevBookings) => {
                // Categorize the updated booking
                const categorizedBookings = {
                  upcoming: [],
                  active: [],
                  completed: [],
                  cancelled: [],
                  refunds: [],
                };
        
                // Merge updated booking into correct category
                Object.keys(prevBookings).forEach(category => {
                  categorizedBookings[category] = prevBookings[category].filter(b => b._id !== updatedBooking._id);
                });
        
                if (["Pending", "Accepted", "RevisionRequired", "Confirmed"].includes(updatedBooking.bookingStatus)) {
                  categorizedBookings.upcoming.push(updatedBooking);
                } else if (updatedBooking.bookingStatus === "Active") {
                  categorizedBookings.active.push(updatedBooking);
                } else if (updatedBooking.bookingStatus === "Completed") {
                  categorizedBookings.completed.push(updatedBooking);
                } else if (updatedBooking.bookingStatus === "Cancelled" && ["Pending", "Refunded"].includes(updatedBooking.paymentStatus)) {
                  categorizedBookings.cancelled.push(updatedBooking);
                } else if (updatedBooking.bookingStatus === "Cancelled" && ["Partial", "Full"].includes(updatedBooking.paymentStatus)) {
                  categorizedBookings.refunds.push(updatedBooking);
                }
        
                return categorizedBookings;
              });
            toast.info(`Booking updated: ${updatedBooking.bookingStatus}`);
           });
   
           return () => {
               socket.off("bookingUpdated");
           };
       }, []);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500";
      case "Accepted":
        return "bg-blue-500";
      case "Confirmed":
        return "bg-green-500";
      case "Active":
      return "bg-green-700";
      case "Cancelled":
        return "bg-red-500";
      case "Completed":
        return "bg-gray-500";
      default:
        return "bg-orange-500";
    }
  };
  const isUrgent = (startDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const difference = (start - today) / (1000 * 60 * 60 * 24); // Convert ms to days
    return difference <= 3; // Consider urgent if start date is within 3 days
  };
  const getCountdown = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = start - now;
  
    if (diffMs <= 0) return; // If it's already started
  
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
    return `${days}d ${hours}h ${minutes}m left`;
  };

  const handleBookingClick = (bookingId) => {
    // console.log("Navigating to:", `/bookingVehicleDetails/${bookingId}`);
    navigate(`/bookingVehicleDetails/${bookingId}`);
  };
    
  const renderBookings = (title, list, section) => (
    
    <div className="mt-6">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => toggleSection(section)}
      >
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <span className="text-lg font-bold">{collapsedSections[section] ? <i className="fa-solid fa-chevron-up fa-rotate-180"></i> : <i className="fa-solid fa-chevron-up"></i>}</span>
      </div>
      {!collapsedSections[section] && (
        <div className="mt-4">
      {list.length === 0 ? (
        <p className="text-center text-gray-500">No {title.toLowerCase()}.</p>
      ) : (
        list.map((booking) => (
          <div key={booking._id} onClick={() => handleBookingClick(booking._id)} >
          <Card  className="p-6 rounded-lg border shadow-sm mb-4">
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex justify-center">
                  <img
                    src={`http://localhost:3000/${booking.vehicleId?.imageUrls[0]}`}
                    alt={booking.vehicleId?.name || "Vehicle"}
                    className="rounded-lg shadow-md w-full md:w-auto"
                  />
                </div>
                <div className="md:w-2/3 space-y-4">
                  <p className="text-sm text-red-500">{isUrgent(booking.startDate) && booking.bookingStatus == "Accepted" ? getCountdown(booking.startDate) : ""}</p>

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
                  <div className="flex justify-between items-start border-t">
                  <div className="text-xl font-bold text-gray-900 pt-4">
                    Total: <span className="text-orange-600">Rs {booking.amountDue+booking.amountPaid}</span>
                  </div>
                  {/* Show Edit and Cancel buttons only if status is Pending */}
                  {booking.bookingStatus === "Pending" && (
                    <div className="flex gap-4 mt-4">
                      <Button variant="primary" onClick={() => handleEditBooking(booking._id)}>
                        Edit
                      </Button>
                      <Button variant="destructive" onClick={() => handleCancelBooking(booking._id)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
        ))
      )}
      </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer />
      <Navigation />
      <div className="w-full bg-white p-6 rounded-2xl shadow-lg mt-6">
        <h2 className="text-2xl font-bold mb-6">Bookings</h2>
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <>
            {renderBookings("Active Bookings", bookings.active, "active")}
          {renderBookings("Refunds", bookings.refunds, "refunds")}
          {renderBookings("Upcoming Bookings", bookings.upcoming, "upcoming")}
          {renderBookings("Completed Bookings", bookings.completed, "completed")}
          {renderBookings("Cancelled Bookings", bookings.cancelled, "cancelled")}
          </>
        )}
      </div>
    </div>
  );
};

export default UserBookings;