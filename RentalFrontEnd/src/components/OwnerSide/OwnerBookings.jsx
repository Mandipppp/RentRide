import React, { useEffect, useState } from "react";
import OwnerNavigation from "./OwnerNavigation";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { reactLocalStorage } from "reactjs-localstorage";
import axios from "axios";
import { ClipLoader } from "react-spinners";

const TABS = ["Pending", "Active", "Completed", "Cancelled"];

function OwnerBookings() {
    const [activeTab, setActiveTab] = useState("Pending");
    const [bookings, setBookings] = useState({ upcoming: [], active : [], completed: [], cancelled: [] });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookings = async () => {
            const token = reactLocalStorage.get("access_token");
            try {
                const response = await axios.get("http://localhost:3000/api/owner/booking/getOwnerBookings", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBookings(response.data.bookings);
                // console.log(response.data.bookings);
            } catch (error) {
                console.error("Error fetching bookings:", error);
                toast.error("Failed to load bookings");
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const getBookingsForTab = () => {
        switch (activeTab) {
            case "Pending": return bookings.upcoming;
            case "Active": return bookings.active;
            case "Completed": return bookings.completed;
            case "Cancelled": return bookings.cancelled;
            default: return [];
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <OwnerNavigation />
            <ToastContainer />
            <div className="mx-auto w-full mt-6 p-4">
                {/* Tabs */}
                <div className="flex justify-around bg-white shadow-md rounded-xl p-3 mb-4">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-4 py-2 text-lg font-medium transition-all rounded-full ${
                                activeTab === tab 
                                    ? "bg-pink-600 text-white shadow-md transform scale-105" 
                                    : "text-gray-500 hover:bg-gray-200"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
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
                                    <span className="text-gray-700 text-sm">Total:</span> <span className="text-orange-600">Rs {booking.amountDue}</span>
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
