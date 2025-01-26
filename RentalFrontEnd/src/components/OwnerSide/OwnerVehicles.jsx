import React, { useEffect, useState } from 'react';
import { Button } from '../Ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../Ui/Card';
import OwnerNavigation from './OwnerNavigation';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { reactLocalStorage } from 'reactjs-localstorage';

const OwnerVehicles = () => {
  const [vehicles, setVehicles] = useState([]); // State to store the vehicles
  const [owner, setOwner] = useState(null); // Separate state for owner details
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to track errors

  useEffect(() => {
    // Function to fetch the vehicles
    const fetchVehicles = () => {
      const token = reactLocalStorage.get("access_token");

      axios
        .get("http://localhost:3000/api/owner/myvehicles", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setVehicles(response.data.vehicles || []);
          setOwner(response.data.owner || null);
          // console.log("Fetched vehicles:", response.data.vehicle);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to fetch vehicles.');
          setLoading(false);
        });
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return <div className="p-6 bg-gray-100 min-h-screen">Loading...</div>;
  }

  return (
    <div>
      <OwnerNavigation />
      <div className="p-6 bg-gray-100 min-h-screen">
        <header className="flex justify-between items-center pb-6">
          <h1 className="text-2xl font-semibold">My Vehicles</h1>
          <Button variant='primary'>
            <Link to="/owneraddvehicle">
              <span className="text-lg">Add Vehicle</span>
              <i className="fa-solid fa-plus px-2"></i>
            </Link>
          </Button>
        </header>

        {/* KYC Status Message */}
        {owner.kyc.overallStatus !== 'verified' && (
          <p className="text-sm text-red-500 mb-4">
            *Your documents are under review. Meanwhile, you can add your vehicles.*
          </p>
        )}

         {/* Conditional rendering for error or vehicle list */}
         {vehicles.length === 0 ? (
          <div className="text-center p-12 bg-white shadow-lg rounded-lg">
            <h2 className="text-3xl font-semibold text-gray-700">Welcome to Your Vehicle Dashboard!</h2>
            <p className="text-base text-gray-500 mt-6">
              You have not added any vehicles yet. Click the "Add Vehicle" button below to add your first vehicle.
            </p>
          </div>
        ) : (
          vehicles.map(vehicle => (
          <Card key={vehicle._id} className="bg-white shadow-md rounded-lg overflow-hidden mb-4">
            <CardHeader className="p-4 flex items-center justify-between border-b">
              <div>
                <h2 className="text-lg font-bold">{vehicle.dailyPrice} NPR / day</h2>
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded ${vehicle.isVerified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {vehicle.isVerified ? 'Vehicle Verified' : 'Pending Verification'}
              </span>
            </CardHeader>

            <CardContent className="p-4 flex flex-col md:flex-row items-center md:items-start">
              <div className="w-full md:w-1/3 flex justify-center md:justify-start">
                <img
                  src={`http://localhost:3000/${vehicle.imageUrls[0]}`}
                  alt={vehicle.name}
                  className="rounded-lg"
                />
              </div>

              <div className="w-full md:w-2/3 mt-4 md:mt-0 md:ml-6 space-y-2">
                <h3 className="text-xl font-semibold">{vehicle.name}</h3>
                <p className="text-sm text-gray-600">{vehicle.type}</p>

                <div className="flex space-x-4 items-center">
                  <div className="flex space-x-2 items-center">
                    <i className="fa-solid fa-couch"></i>
                    <span>{vehicle.seatingCapacity || 2}</span>
                  </div>

                  <div className="flex space-x-2 items-center">
                    <i className="fa-solid fa-gas-pump"></i>
                    <span>{vehicle.fuel}</span>
                  </div>
                </div>

                <CardFooter className='flex items-center'>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <i className="fa-solid fa-star"></i>
                    <span className="text-lg font-bold">{vehicle.rating || 'N/A'}</span>
                  </div>
                  <div className="mt-0 flex space-x-4 justify-end md:ml-auto">
                    <Button variant="secondary">Edit Vehicle</Button>
                    <Button variant="destructive">Remove Vehicle</Button>
                    <Button variant="warning">Disable Vehicle</Button>
                  </div>
                </CardFooter>
              </div>
            </CardContent>

          </Card>
        ))
      )}
      </div>
    </div>
  );
};

export default OwnerVehicles;