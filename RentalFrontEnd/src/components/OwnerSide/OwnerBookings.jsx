import React, { useEffect, useState } from "react";
import OwnerNavigation from "./OwnerNavigation";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { reactLocalStorage } from "reactjs-localstorage";
import axios from "axios";
import { ClipLoader } from "react-spinners";
////////////////
import io from "socket.io-client";
const socket = io("http://localhost:3000");

const TABS = ["Pending","Confirmed", "Active", "Completed", "Cancelled","Refund"];

function OwnerBookings() {
    const [activeTab, setActiveTab] = useState("Pending");
    const [bookings, setBookings] = useState({ upcoming: [], confirmed: [], active : [], completed: [], cancelled: [], refunds: [] });
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState("");
    const navigate = useNavigate();

    // Load tab state from localStorage on mount
    useEffect(() => {
        const storedTab = localStorage.getItem("activeTab");
        if (storedTab && TABS.includes(storedTab)) {
            setActiveTab(storedTab);
        }
    }, []);

    useEffect(() => {
        const fetchBookings = async () => {
            const token = reactLocalStorage.get("access_token");
            try {
                const response = await axios.get("http://localhost:3000/api/owner/booking/getOwnerBookings", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBookings(response.data.bookings);
                // console.log(response.data.bookings);

                ////////////////
                setUserId(response.data.ownerId);
                if(response.data.ownerId){
                    socket.emit('register', response.data.ownerId);
                }
            } catch (error) {
                console.error("Error fetching bookings:", error);
                toast.error("Failed to load bookings");
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

////////////////
    // WebSocket - Handle booking updates in real-time
    useEffect(() => {
        socket.on("bookingUpdated", (updatedBooking) => {
            // console.log("Booking update received:", updatedBooking);

            setBookings((prev) => {
                const newBookings = { ...prev };

                // Find the old category of the booking
                let oldCategory = null;
                Object.keys(newBookings).forEach((category) => {
                    if (newBookings[category].some((b) => b._id === updatedBooking._id)) {
                        oldCategory = category;
                    }
                });

                // Remove booking from the old category
                if (oldCategory) {
                    newBookings[oldCategory] = newBookings[oldCategory].filter(
                        (b) => b._id !== updatedBooking._id
                    );
                }

                // Determine new category
                let newCategory = "";
                if (["Pending", "Accepted", "RevisionRequired"].includes(updatedBooking.bookingStatus)) {
                    newCategory = "upcoming";
                } else if (updatedBooking.bookingStatus === "Confirmed") {
                    newCategory = "confirmed";
                } else if (updatedBooking.bookingStatus === "Active") {
                    newCategory = "active";
                } else if (updatedBooking.bookingStatus === "Completed") {
                    newCategory = "completed";
                } else if (
                    updatedBooking.bookingStatus === "Cancelled" &&
                    ["Pending", "Refunded"].includes(updatedBooking.paymentStatus)
                ) {
                    newCategory = "cancelled";
                } else if (
                    updatedBooking.bookingStatus === "Cancelled" &&
                    ["Partial", "Full"].includes(updatedBooking.paymentStatus)
                ) {
                    newCategory = "refunds";
                }

                if (newCategory) {
                    newBookings[newCategory] = [...newBookings[newCategory], updatedBooking];
                }

                return newBookings;
            });

            toast.info(`Booking updated: ${updatedBooking.bookingStatus}`);
        });

        return () => {
            socket.off("bookingUpdated");
        };
    }, []);

    const getBookingsForTab = () => {
        switch (activeTab) {
            case "Pending": return bookings.upcoming;
            case "Confirmed": return bookings.confirmed;
            case "Active": return bookings.active;
            case "Completed": return bookings.completed;
            case "Cancelled": return bookings.cancelled;
            case "Refund": return bookings.refunds;
            default: return [];
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem("activeTab", tab); // Save to localStorage
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <OwnerNavigation />
            <ToastContainer />
            <div className="mx-auto w-full mt-6 p-4">
                {/* Tabs */}
                <div className="flex justify-around bg-white shadow-md rounded-xl p-3 mb-4">
                {TABS.map((tab) => {
                    const count = {
                        "Pending": bookings.upcoming.length,
                        "Confirmed": bookings.confirmed.length,
                        "Active": bookings.active.length,
                        "Completed": bookings.completed.length,
                        "Cancelled": bookings.cancelled.length,
                        "Refund": bookings.refunds.length
                    }[tab] || 0; 

                    return (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`relative px-4 py-2 text-lg font-medium transition-all rounded-full ${
                                activeTab === tab 
                                    ? "bg-pink-600 text-white shadow-md transform scale-105" 
                                    : "text-gray-500 hover:bg-gray-200"
                            }`}
                        >
                            {tab}
                            {count > 0 && (
                                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>


                {/* Booking List */}
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <ClipLoader size={40} color={"#ff69b4"} loading={loading} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {getBookingsForTab().length > 0 ? (
                            getBookingsForTab().map((booking, index) => (
                                <div key={index} className="bg-white p-6 shadow-lg rounded-lg border-l-4 border-pink-500 hover:shadow-xl transition-all">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                                        {booking.vehicleId?.name} <span className="text-gray-500 text-sm">{booking.vehicleId?.type}</span>
                                    </h3>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                        booking.bookingStatus === "Pending" ? "bg-yellow-100 text-yellow-600" :
                                        booking.bookingStatus === "Active" ? "bg-green-100 text-green-600" :
                                        "bg-gray-100 text-gray-600"
                                    }`}>
                                        {booking.bookingStatus}
                                    </span>
                                </div>
                                
                                <p className="text-lg font-bold text-gray-600 mt-2">{booking.vehicleId?.dailyPrice} NPR <span className="text-sm font-normal">/ day</span></p>
                                
                                <div className="grid grid-cols-3 gap-2 text-gray-600 mt-3">
                                    <div>
                                        <p>From: <span className="font-semibold">{new Date(booking.startDate).toLocaleDateString()}</span></p>
                                        <p>To: <span className="font-semibold">{new Date(booking.endDate).toLocaleDateString()}</span></p>
                                    </div>
                                    <div>
                                        <p>Duration: <span className="font-semibold">{booking.totalDays} days</span></p>
                                        <p>Booked At: <span className="font-medium">{new Date(booking.createdAt).toLocaleString()}</span></p>
                                    </div>
                                    <div>
                                        <p>Renter: <span className="font-semibold">{booking.renterId.name}</span></p>
                                        <p>Email: <span className="font-medium">{booking.renterId.email}</span></p>
                                    </div>
                                </div>
                                {booking.addOns && booking.addOns.length > 0 && (
                                    <div className="mt-3">
                                        <h4 className="text-lg font-semibold text-gray-700">Add-Ons:</h4>
                                        <ul className="list-disc list-inside text-gray-600">
                                            {booking.addOns.map((addOn) => (
                                                <li key={addOn._id} className="text-sm">
                                                    {addOn.name} - {addOn.pricePerDay} NPR/day (Total: {addOn.totalPrice} NPR)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                

                                <div className="mt-4">
                                    <div className="text-xl font-bold text-gray-900">
                                    <span className="text-gray-700 text-sm">Total:</span> <span className="text-orange-600">Rs {booking.amountDue + booking.amountPaid}</span>
                                    </div>
                                    <button
                                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all mt-4"
                                        onClick={() => navigate(`/ownerVehicleDetails/${booking._id}`)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>

                            ))
                        ) : (
                            <p className="text-gray-500 text-center pt-5">No bookings found for this category.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OwnerBookings;
