import React, { useEffect, useState } from 'react'
import OwnerNavigation from './OwnerNavigation'
import { Link, useNavigate } from 'react-router-dom'
import { reactLocalStorage } from 'reactjs-localstorage';
import axios from 'axios';

function OwnerDashboard() {
    const [myVehilces, setMyVehicles] = useState(null);
    const [myPendings, setMyPendings] = useState(null);
    const [myEarnings, setMyEarnings] = useState(null);

    
  const navigate = useNavigate();

    useEffect(() => {
        const token = reactLocalStorage.get("access_token");
        if (!token) {
          navigate("/login");
        } else {
          axios
            .get("http://localhost:3000/api/owner/getmystats", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((response) => {
            //   console.log(response.data)
              setMyVehicles(response.data.totalVehicles);
              setMyPendings(response.data.totalPendingBookings);
              setMyEarnings(response.data.totalEarnings);
            })
            .catch((err) => {
              console.log("Error: ", err);
            });
        }
      }, [navigate]);

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
        <OwnerNavigation />
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white py-16">
            <div className="max-w-screen-xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold">Welcome to Your Dashboard!</h1>
                <p className="text-lg mt-4">Here’s an overview of your vehicles and performance.</p>
            </div>
        </section>

        {/* Stats Section */}
        <section className="px-8 py-8 mt-4 bg-white shadow-md rounded-md">
            <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Dashboard Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="p-6 bg-blue-100 rounded-md shadow-lg">
                    <div className="flex items-center space-x-10">
                        <i className="fa-solid fa-car text-6xl"></i>
                        <div>
                            <p className="text-gray-700 text-2xl">Vehicles Listed</p>
                            <p className="text-4xl font-bold mt-4">{myVehilces || '0'}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-yellow-100 rounded-md shadow-lg">
                    <div className="flex items-center space-x-10">
                        <i className="fa-solid fa-book text-6xl"></i>
                        <div>
                            <p className="text-gray-700 text-2xl">Pending Bookings</p>
                            <p className="text-4xl font-bold mt-4">{myPendings || '0'}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-green-100 rounded-md shadow-lg">
                    <div className="flex items-center space-x-10">
                        <i className="fa-solid fa-piggy-bank text-6xl"></i>
                        <div>
                            <p className="text-gray-700 text-2xl">Total Earnings</p>
                            <p className="text-4xl font-bold mt-4">Rs. {myEarnings || '0'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Actionable Section */}
    <section className="px-8 py-8 mt-8 bg-gray-50 shadow-md rounded-md">
        <div className="max-w-screen-xl text-left">
            <h2 className="text-3xl font-semibold text-gray-800">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                <div className="bg-white p-6 rounded-md shadow-md hover:bg-gray-100 transition">
                    <Link to="/owneraddvehicle" className="text-lg font-semibold text-blue-600">Add New Vehicle</Link>
                </div>
                <div className="bg-white p-6 rounded-md shadow-md hover:bg-gray-100 transition">
                    <Link to="/ownerbookings" className="text-lg font-semibold text-blue-600">View Pending Bookings</Link>
                </div>
            </div>
        </div>
    </section>
    </div>
  )
}

export default OwnerDashboard
