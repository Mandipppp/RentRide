import React, { useEffect, useState } from 'react';
import { Button } from '../Ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../Ui/Card';
import OwnerNavigation from './OwnerNavigation';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { reactLocalStorage } from 'reactjs-localstorage';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from "react-router-dom";



const OwnerVehicles = () => {
  const [vehicles, setVehicles] = useState([]); // State to store the vehicles
  const [reviews, setReviews] = useState([]); // State to store the reviews 
  const [owner, setOwner] = useState(null); // Separate state for owner details
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to track errors
  const [showModal, setShowModal] = useState(false); // Modal visibility state
  const [vehicleToDelete, setVehicleToDelete] = useState(null); // Vehicle to delete
  const navigate = useNavigate(); // Initialize navigate hook
  


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
          // console.log("Fetched vehicles:", response.data.vehicles);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to fetch vehicles.');
          setLoading(false);
        });
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    // Function to fetch the reviews
    const fetchReviews = () => {
      const token = reactLocalStorage.get("access_token");
      axios
        .get("http://localhost:3000/api/owner/myreviews", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setReviews(response.data.data|| []);
          // console.log("Fetched reviews:", response.data.data);
        })
        .catch((err) => {
          console.error('Error fetching reviews:', err);
          // toast.error(err.response?.data?.message || 'Failed to fetch reviews.'); 
        });
    };
    fetchReviews();
  }, []);

  // Function to handle vehicle deletion
  const handleRemoveVehicle = () => {
    if (!vehicleToDelete) return;

    const token = reactLocalStorage.get("access_token");

    axios
      .delete(`http://localhost:3000/api/owner/vehicle/${vehicleToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setVehicles(vehicles.filter(vehicle => vehicle._id !== vehicleToDelete));
        toast.success('Vehicle removed successfully!');
        setShowModal(false);
        setVehicleToDelete(null);
      })
      .catch((err) => {
        console.error('Error removing vehicle:', err);
        toast.error(err.response.data.message ||'Failed to remove vehicle. Please try again later.');
        setShowModal(false);
      });
  };

  const handleDisableVehicle = (vehicleId) => {
    const token = reactLocalStorage.get("access_token");

    axios
      .patch(`http://localhost:3000/api/owner/vehicle/${vehicleId}/disable`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setVehicles(vehicles.map(vehicle => 
          vehicle._id === vehicleId ? { ...vehicle, status: 'Under Maintenance' } : vehicle
        ));
        toast.success('Vehicle disabled successfully!');
      })
      .catch((err) => {
        console.error('Error disabling vehicle:', err);
        toast.error(err.response.data.message || 'Failed to disable vehicle. Please try again later.');
      });
  };

  const handleEnableVehicle = (vehicleId) => {
    const token = reactLocalStorage.get("access_token");

    axios
      .patch(`http://localhost:3000/api/owner/vehicle/${vehicleId}/enable`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setVehicles(vehicles.map(vehicle => 
          vehicle._id === vehicleId ? { ...vehicle, status: 'Available' } : vehicle
        ));
        toast.success('Vehicle enabled successfully!');
      })
      .catch((err) => {
        console.error('Error enabling vehicle:', err);
        toast.error('Failed to enable vehicle. Please try again later.');
      });
  };

  const handleUserClick = (vehicleId) => {
    navigate(`/ownervehicle/${vehicleId}`); // Navigate to the user's details page
  };

  const handleDocumentsClick = (vehicleId) => {
    navigate(`/ownervehicledocuments/${vehicleId}`); // Navigate to the user's details page
  };

  const getVehicleRating = (vehicleId, reviews) => {
    const review = reviews.find(review => review.vehicleId === vehicleId);
    return review ? review.averageRating : 0;
  };

  if (loading) {
    return <div className="p-6 bg-gray-100 min-h-screen">Loading...</div>;
  }

  return (
    <div>
      <ToastContainer />
      <OwnerNavigation />
      <div className="p-6 bg-gray-100 min-h-screen">
        <header className="flex justify-between items-center pb-6">
          <h1 className="text-2xl font-semibold">My Vehicles</h1>
          {owner.blockStatus !== 'blocked' && (
          <Button variant='primary'>
            <Link to="/owneraddvehicle">
              <span className="text-lg">Add Vehicle</span>
              <i className="fa-solid fa-plus px-2"></i>
            </Link>
          </Button>)}
          {owner.blockStatus === 'blocked' && (<p className="text-sm text-red-500">
            *Your account is blocked. Please contact support for assistance.*<br />
            Reason: {owner.blockReason}<br />
          </p>)}
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
              <span 
                className={`text-sm font-semibold px-3 py-1 rounded ${
                  vehicle.insuranceCertificate.status === "Rejected" || vehicle.registrationCertificate.status === "Rejected"
                    ? 'bg-red-100 text-red-600'
                    : vehicle.insuranceCertificate.status === "Verified" && vehicle.registrationCertificate.status === "Verified"
                    ? 'bg-green-100 text-green-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}
              >
                {vehicle.insuranceCertificate.status === "Rejected" || vehicle.registrationCertificate.status === "Rejected"
                  ? 'Documents Rejected'
                  : vehicle.insuranceCertificate.status === "Verified" && vehicle.registrationCertificate.status === "Verified"
                  ? 'Vehicle Verified'
                  : 'Verification Pending'}
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
                    <span>{vehicle.seats || 'Nan'}</span>
                  </div>

                  <div className="flex space-x-2 items-center">
                    <i className="fa-solid fa-gas-pump"></i>
                    <span>{vehicle.fuel}</span>
                  </div>
                </div>

                <CardFooter className='flex items-center'>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <i className="fa-solid fa-star"></i>
                    <span className="text-lg font-bold">
                      {getVehicleRating(vehicle._id, reviews) > 0 
                        ? getVehicleRating(vehicle._id, reviews).toFixed(1) 
                        : 'No reviews yet'}
                    </span>
                  </div>
                  <div className="mt-0 flex space-x-4 justify-end md:ml-auto">
                    <Button variant="secondary" onClick={() => handleDocumentsClick(vehicle._id)}>Edit Vehicle Documents</Button>
                    <Button variant="secondary" onClick={() => handleUserClick(vehicle._id)}>Edit Vehicle</Button>
                    <Button variant="destructive" onClick={() => {
                        setShowModal(true);
                        setVehicleToDelete(vehicle._id);
                      }}>
                        Remove Vehicle
                      </Button>
                      {vehicle.status === 'Available' ? (
                      <Button variant="warning" onClick={() => handleDisableVehicle(vehicle._id)}>
                        Disable Vehicle
                      </Button>
                    ) : (
                      <Button variant="success" onClick={() => handleEnableVehicle(vehicle._id)}>
                        Enable Vehicle
                      </Button>)}
                      {/* Add View Reviews Button */}
                      <Button variant="warning" onClick={() => navigate(`/owner/vehicle/${vehicle._id}/reviews`)}>
                        View Reviews
                      </Button>
                  </div>
                </CardFooter>
              </div>
            </CardContent>

          </Card>
        ))
      )}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveVehicle}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerVehicles;