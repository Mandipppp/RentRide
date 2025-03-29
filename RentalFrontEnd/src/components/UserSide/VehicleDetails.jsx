import React, { useEffect, useState } from 'react';
import { Button } from '../Ui/Button';
import { Card } from '../Ui/Card';
import car from '../Images/HomeCar.png';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { reactLocalStorage } from 'reactjs-localstorage';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';


// Helper function to calculate the number of days between two dates
const calculateDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDifference = end - start;
  return Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert time difference to days
};


export default function VehicleDetails() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  
  const [currentImage, setCurrentImage] = useState(0);
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [baseCost, setBaseCost] = useState(0);
  const [addOnsCost, setAddOnsCost] = useState(0);

  const [totalCost, setTotalCost] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);

  // Get filters from location state
  const location = useLocation();
  const { filters } = location.state || {};  // Destructure filters from the state
  const {isRequested} = location.state;
  const [isBooked, setIsBooked] = useState(isRequested);
  const [bookingId, setBookingId] = useState(null);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [agreements, setAgreements] = useState({
    terms: false,
    cancellationPolicy: false,
    damagePolicy: false
  });

  const handleAgreementChange = (e) => {
    setAgreements({ ...agreements, [e.target.name]: e.target.checked });
  };

  const fetchTermsAndConditions = async () => {
    try {
      const response = await axios
      .get(`http://localhost:3000/api/admin/page/getpagebyslug/terms-and-conditions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTermsContent(response.data.data.content);
    } catch (error) {
      console.error("Failed to fetch terms:", error);
      setTermsContent("<p>Failed to load terms. Please try again later.</p>");
    }
  };
  
  useEffect(() => {
    const access_token = reactLocalStorage.get("access_token");
    if (access_token) {
      setToken(access_token);
    }
  }, []);

  useEffect(() => {
    if (token) {
      const fetchVehicle = async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/users/vehicles/${vehicleId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setVehicle(response.data);

          // console.log(response.data);
        } catch (err) {
          console.log("Failed to fetch vehicle details.");
        }
      };
      fetchVehicle();
    }
  }, [vehicleId, token]);

  // Fetch reviews for the vehicle
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/user/review/vehicle/${vehicleId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setReviews(response.data.reviews); // Store the fetched reviews
        setAverageRating(response.data.averageRating);
      } catch (err) {
        console.log("Failed to fetch reviews.");
      }
    };
    if (vehicleId) {
      fetchReviews();
    }
  }, [vehicleId, token]);

  useEffect(() => {
    if (vehicle && filters) {
      const { pickupDate, dropDate } = filters;

      if (pickupDate && dropDate) {
        // Calculate number of days
        const numDays = calculateDaysDifference(pickupDate, dropDate);

        // Calculate base vehicle cost
        const onlyVehicleCost = vehicle.dailyPrice * numDays;

        // Set total cost
        setBaseCost(onlyVehicleCost);
      }
    }
  }, [vehicle, filters]);

  useEffect(() => {
    // Recalculate the total cost whenever selected add-ons change
    const addOnsCost = selectedAddOns.reduce(
      (acc, addon) => acc + addon.pricePerDay * calculateDaysDifference(filters?.pickupDate, filters?.dropDate),
      0
    );
    setAddOnsCost(addOnsCost);
    setTotalCost(baseCost + addOnsCost);
  }, [selectedAddOns, baseCost, filters]);

  // Auto change image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % (vehicle?.imageUrls?.length || 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [currentImage,vehicle?.imageUrls]);

  const handleAddOnToggle = (addon) => {
    setSelectedAddOns((prevSelected) => {
      if (prevSelected.some((item) => item.name === addon.name)) {
        return prevSelected.filter((item) => item.name !== addon.name); // Remove addon
      } else {
        return [...prevSelected, addon]; // Add addon
      }
    });
  };

  useEffect(() => {
    if (token) {
      const fetchBookingStatus = async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/user/booking/${vehicleId}`, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data && response.data.status !== "cancelled") {
            setBookingId(response.data._id)
          }
        } catch (error) {
          console.error("Failed to fetch booking status:", error);
        }
      };
      fetchBookingStatus();
    }
  }, [vehicleId, token, isBooked]);
  

  const handleDeleteAddOn = (addon) => {
    setSelectedAddOns((prevSelected) =>
      prevSelected.filter((item) => item.name !== addon.name)
    );
  };

  useEffect(() => {
    if (vehicle) {
        const fetchExistingBookings = async () => {
        try {
            const response = await axios.get(
            `http://localhost:3000/api/user/booking/getVehicleBookings/${vehicleId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
            );
            setExistingBookings(response.data.bookings); // Store all bookings
        // console.log("gg",response.data.bookings);

        } catch (err) {
            console.error("Failed to fetch existing bookings.");
        }
        };

        fetchExistingBookings();
    }
    }, [vehicle, token]);

  const isDateConflict = (newStartDate, newEndDate) => {
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);
  
    return existingBookings.some((existingBooking) => {
  
      const existingStart = new Date(existingBooking.startDate);
      const existingEnd = new Date(existingBooking.endDate);
  
      return (
        (newStart >= existingStart && newStart <= existingEnd) || // New start date falls within an existing booking
        (newEnd >= existingStart && newEnd <= existingEnd) || // New end date falls within an existing booking
        (newStart <= existingStart && newEnd >= existingEnd) // New range fully covers an existing booking
      );
    });
  };

  const handleBackClick = () => {
    const queryParams = new URLSearchParams(filters).toString();
    // console.log(queryParams);
    const url = `/browsevehicles?${queryParams}`;
    navigate(url);
  }

  const handleBooking = async () => {
    if (!agreements.terms || !agreements.cancellationPolicy || !agreements.damagePolicy) {
      toast.error("Please accept all terms before continuing.");
      return;
    }
    setIsTermsModalOpen(false);

    if (!filters) {
      toast.error("Please select booking criteria.");
      return;
    }
    if (isDateConflict(filters.pickupDate, filters.dropDate)) {
        toast.error("Selected dates conflict with another booking. Please choose different dates.");
        return;
      }
    try {
      const bookingData = {
        vehicleId: vehicle._id,
        startDate: filters.pickupDate,
        endDate: filters.dropDate,
        pickAndDropLocation: filters.pickAndDropLocation,
        pickupTime: filters.pickupTime,
        dropTime: filters.dropTime,
        addOns: selectedAddOns,
      };

      // console.log("Booking data:",bookingData);
  
      const response = await axios.post(
        "http://localhost:3000/api/user/booking/createBooking",
        bookingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      toast.success("Booking request sent successfully!");
      setIsBooked(true);
      // isRequested = true;
      // navigate("/bookings"); // Redirect to bookings page
    } catch (error) {
      console.error("Booking failed:", error.response?.data || error.message);
      toast.error(error.response?.data.message || "Failed to create booking. Please try again.");
    }
  };
  
  const handleCancelBooking = async () => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/user/booking/cancel/${bookingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      toast.success("Booking cancelled successfully!");
      setIsBooked(false); //Update local state
    } catch (error) {
      console.error("Cancellation failed:", error.response?.data || error.message);
      toast.error("Failed to cancel booking. Please try again.");
    }
  };
  
  if (!vehicle) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-2">
      
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
      <ToastContainer />

      <div className="flex items-center mb-6">
        <button
          onClick={handleBackClick}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back
        </button>
        <h2 className="font-bold text-xl text-gray-800 ml-6">Vehicle Details</h2>
      </div>
     
        {/* Car Image and Info */}
        <div className="flex flex-col items-left">
            {/* Image Carousel */}
        <div className="relative">
          <img
            src={`http://localhost:3000/${vehicle.imageUrls[currentImage]}`}
            alt="Vehicle"
            className="w-full h-64 object-contain rounded-md transition-opacity duration-500 ease-in-out"
          />
          {/* Next & Previous Buttons */}
          <button
            onClick={() => setCurrentImage((prev) => (prev > 0 ? prev - 1 : vehicle.imageUrls.length - 1))}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-white hover:bg-gray-800 px-3 py-1 rounded-full"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev < vehicle.imageUrls.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-white hover:bg-gray-800 px-3 py-1 rounded-full"
          >
            <i className="fa-solid fa-chevron-left fa-rotate-180"></i>
          </button>
        </div>

        {/* Thumbnail Selector */}
        <div className="flex gap-2 mt-3 justify-center">
          {vehicle.imageUrls.map((img, index) => (
            <img
              key={index}
              src={`http://localhost:3000/${img}`}
              alt={`Thumbnail ${img}`}
              className={`w-16 h-16 object-cover cursor-pointer rounded-md ${currentImage === index ? 'border-2 border-green-500' : ''}`}
              onClick={() => setCurrentImage(index)}
            />
          ))}
        </div>

            <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold mt-4">{vehicle.name}</h2>
                    <p className="text-gray-500">{vehicle.type} - {vehicle.builtYear || "N\A"}</p>
                    <p className={vehicle.isVerified ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                      {vehicle.isVerified ? "Admin Verified" : "Not Admin Verified"}
                    </p>


                </div>
                <div className="flex flex-col">
                    <div className="flex items-center mt-2">
                        <i className="fa-solid fa-star text-yellow-500"></i>
                        <span className="ml-1 text-gray-600">{averageRating || "No reviews yet"}</span>
                    </div>
                    <p className="text-lg font-bold mt-2">{vehicle.dailyPrice} NPR/day</p>
                </div>
            </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center mt-8 bg-gray-50 p-2 rounded-full shadow-md">
          <img
            src={`http://localhost:3000/${vehicle.ownerId.kycId.documents.profilePicture.file}`}
            alt="Owner"
            className="w-12 h-12 rounded-full border-gray-300 object-cover"
          />
          <div className="ml-4">
            <p className="text-green-600 font-semibold">Owner</p>
            <p className="text-gray-800 text-lg">{vehicle.ownerId.name}</p>
          </div>
        </div>

         {/* Display Booking Criteria (Filters) */}
         <div className="bg-gray-50 p-4 rounded-lg shadow-md mb-4 mt-6">
        <h3 className="font-semibold text-lg text-gray-800">Your Booking Criteria</h3>
        <div className="overflow-x-auto mt-4">
          <table className="table-auto w-full text-gray-700">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Pick-up Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Pick-up Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Pick-up Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-300">Return Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Return Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">{filters?.pickAndDropLocation || "N/A"}</td>
                <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">{filters?.pickupDate || "N/A"}</td>
                <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">{filters?.pickupTime || "N/A"}</td>
                <td className="px-6 py-4 text-sm font-medium border-r border-gray-300">{filters?.dropDate || "N/A"}</td>
                <td className="px-6 py-4 text-sm font-medium">{filters?.dropTime || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            {/* Car Specifications */}
            <div className="bg-gray-50 grid grid-cols-2 border border-gray-50 rounded-lg shadow-md mt-6 text-center">
              <div className="border-r border-gray-300 p-4">
                  <p className="text-gray-500">Seats</p>
                  <p className="text-lg font-semibold">{vehicle.seats || "N/A"}</p>
              </div>
              <div className="p-4">
                  <p className="text-gray-500">Fuel Type</p>
                  <p className="text-lg font-semibold">{vehicle.fuel || "N/A"}</p>
              </div>
              <div className="border-t border-r border-gray-300 p-4">
                  <p className="text-gray-500">Transmission</p>
                  <p className="text-lg font-semibold">{vehicle.transmission || "N/A"}</p>
              </div>
              <div className="border-t p-4">
                  <p className="text-gray-500">Fuel Usage</p>
                  <p className="text-lg font-semibold">{vehicle.mileage + "KM/ 1L" || "N/A"}</p>
              </div>
          </div>

          {/* Add-Ons Section */}
          <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">Available Add-Ons</h3>
              <ul className="mt-4 text-gray-700">
                {vehicle.addOns?.map((addon, index) => (
                  <li key={index} className="flex justify-between py-2">
                    <span>{addon.name}</span>
                    <div className="flex items-center">
                      <span className="text-green-600">+{addon.pricePerDay} NPR/day</span>
                      <button
                        onClick={() => handleAddOnToggle(addon)}
                        className={`ml-4 text-blue-500 ${selectedAddOns.some((item) => item.name === addon.name) ? 'text-red-500' : ''}`}
                      >
                        {selectedAddOns.some((item) => item.name === addon.name) ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            </div>

          <div>
            {/* Features */}
            <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">Features</h3>
              <ul className="mt-4 text-gray-700">
                {vehicle.features?.map((feature, index) => <li key={index}>{feature}</li>)}
              </ul>
            </div>


            {/* Bill Section */}
            <div className="bg-gray-50 p-6 shadow-md rounded-lg mt-6">
              <h3 className="font-semibold text-lg">Vehicle Cost</h3>
              <p className="mt-2 flex justify-between "><span>{calculateDaysDifference(filters?.pickupDate, filters?.dropDate)} Days - {vehicle.dailyPrice} NPR/day</span> <span>Rs {baseCost}</span></p>
              
              <h3 className="font-semibold text-lg mt-4">Add Ons</h3>
              {selectedAddOns.length > 0 ? (selectedAddOns.map((addon, index) => (
                <div key={index} className="flex justify-between mt-2">
                  <span>{addon.name} - {addon.pricePerDay} NPR/day</span>
                  <div>
                  <span className='pr-3'>Rs {calculateDaysDifference(filters?.pickupDate, filters?.dropDate)*addon.pricePerDay}</span>
                  <button
                    onClick={() => handleDeleteAddOn(addon)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                  </div>
                </div>
              ))
            ):(
              <p className="text-gray-500 mt-2">No add-ons selected</p> // Message when no add-ons are selected
            )
            }

              <p className="font-bold mt-4 flex justify-between"><span>Total</span> <span>Rs {totalCost}</span></p>
            </div>

            {/* Book Now Button */}
            {isBooked ? (
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg" onClick={handleCancelBooking}>
                Cancel Booking
              </Button>
            ):(
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg" 
            onClick={()=>{
              setIsTermsModalOpen(true);
              fetchTermsAndConditions();
              }}>
              Book Now
            </Button>
          )}
          </div>
        </div>

       
      </div>
      {/* Reviews
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 mt-8">
          <h3 className="font-bold text-xl text-gray-800">Reviews</h3>
          <Card className="p-6 mt-4 bg-green-50 rounded-lg shadow-md">
            <div className="flex items-center">
              <i className="fa-solid fa-star text-yellow-500" />
              <i className="fa-solid fa-star text-yellow-500" />
              <i className="fa-solid fa-star text-yellow-500" />
              <i className="fa-solid fa-star text-yellow-500" />
              <i className="fa-solid fa-star text-gray-300" />
            </div>
            <p className="mt-4 text-gray-700">“Smooth ride and super clean! The car was delivered on time and exceeded my expectations.”</p>
            <div className="flex items-center mt-4">
              <img src={car} alt="Reviewer" className="w-8 h-8 rounded-full border-gray-300 object-cover" />
              <p className="ml-3 text-gray-800">Raju Narayan</p>
            </div>
          </Card>
        </div> */}
        {/* Reviews */}
        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 mt-8">
          <h3 className="font-bold text-xl text-gray-800">Reviews</h3>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review._id} className="p-6 mt-4 bg-green-50 rounded-lg shadow-md">
                <div className="flex items-center">
                  {[...Array(review.rating)].map((_, index) => (
                    <i key={index} className="fa-solid fa-star text-yellow-500" />
                  ))}
                  {[...Array(5 - review.rating)].map((_, index) => (
                    <i key={index} className="fa-solid fa-star text-gray-300" />
                  ))}
                </div>
                <p className="mt-4 text-gray-700">"{review.comment}"</p>
                <div className="flex items-center mt-4">
                  <img
                    src={car}
                    alt="Reviewer"
                    className="w-8 h-8 rounded-full border-gray-300 object-cover"
                  />
                  <p className="ml-3 text-gray-800">{review.userId.name}</p>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-gray-500 mt-2">No reviews yet</p>
          )}
        </div>

        {isTermsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-150 max-h-[80vh] overflow-auto">
            <h2 className="text-lg font-bold mb-4">Terms & Conditions</h2>
            {/* Render Terms & Conditions dynamically */}
            <div className="mb-4 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: termsContent }} />
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="terms" checked={agreements.terms} onChange={handleAgreementChange} />
                <span>I agree to the general terms and conditions.</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="cancellationPolicy" checked={agreements.cancellationPolicy} onChange={handleAgreementChange} />
                <span>I understand the cancellation policy.</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="damagePolicy" checked={agreements.damagePolicy} onChange={handleAgreementChange} />
                <span>I accept responsibility for any damages.</span>
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={() => setIsTermsModalOpen(false)}>Cancel</button>
              <button 
                className={`px-4 py-2 rounded-md ${agreements.terms && agreements.cancellationPolicy && agreements.damagePolicy ? 'bg-green-600 text-white' : 'bg-gray-400 cursor-not-allowed'}`}
                onClick={handleBooking}
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
