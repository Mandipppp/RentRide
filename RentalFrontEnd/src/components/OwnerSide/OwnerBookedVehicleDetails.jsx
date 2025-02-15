import React, { useEffect, useState } from 'react';
import { Button } from '../Ui/Button';
import { useLocation, useNavigate, useParams} from 'react-router-dom';
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


export default function OwnerBookedVehicleDetails() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [baseCost, setBaseCost] = useState(0);
  const [addOnsCost, setAddOnsCost] = useState(0);
  
  const [totalCost, setTotalCost] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  // Form field states
  const [updatedPickAndDropLocation, setUpdatedPickAndDropLocation] = useState("");
  const [updatedStartDate, setUpdatedStartDate] = useState("");
  const [updatedEndDate, setUpdatedEndDate] = useState("");
  const [updatedPickUpTime, setUpdatedPickUpTime] = useState("");
  const [updatedDropTime, setUpdatedDropTime] = useState("");

  
  useEffect(() => {
    const access_token = reactLocalStorage.get("access_token");
    if (access_token) {
      setToken(access_token);
    }
  }, []);

  useEffect(() => {
    if (token) {
      const fetchBooking= async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/owner/booking/getOwnerBooking/${bookingId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setBooking(response.data.booking);
          // console.log("booking", response.data.booking);

        //   console.log(response.data);
        } catch (err) {
          console.log("Failed to fetch booking details.");
        }
      };
      fetchBooking();
    }
  }, [bookingId, token]);

  useEffect(() => {
    // Recalculate the total cost whenever selected add-ons change
    const addOnsCost = selectedAddOns.reduce(
      (acc, addon) => acc + addon.pricePerDay * calculateDaysDifference(booking.startDate, booking.endDate),
      0
    );
    setAddOnsCost(addOnsCost);
    setTotalCost(baseCost + addOnsCost);
  }, [selectedAddOns, baseCost]);

  useEffect(() => {
      if (booking) {
        const initialAddOns = booking.addOns || [];
        setSelectedAddOns(initialAddOns);
  
        if (booking.startDate && booking.endDate) {
          // Calculate number of days
          const numDays = calculateDaysDifference(booking.startDate, booking.endDate);
  
          // Calculate base vehicle cost
          const onlyVehicleCost = booking.vehicleId.dailyPrice * numDays;
  
          // Set total cost
          setBaseCost(onlyVehicleCost);
          // Set initial values for editing
        setUpdatedPickAndDropLocation(booking.pickAndDropLocation);
        setUpdatedStartDate(booking.startDate);
        setUpdatedEndDate(booking.endDate);
        setUpdatedPickUpTime(booking.pickupTime);
        setUpdatedDropTime(booking.dropTime);
        }
      }
    }, [booking]);



    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Add padding for months less than 10
        const day = date.getDate().toString().padStart(2, '0'); // Add padding for days less than 10
        return `${year}-${month}-${day}`;
      };
  // Auto change image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % (booking?.vehicleId?.imageUrls?.length || 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [currentImage, booking?.vehicleId?.imageUrls]);

  const handleAddOnToggle = (addon) => {
    setSelectedAddOns((prevSelected) => {
      if (prevSelected.some((item) => item.name === addon.name)) {
        return prevSelected.filter((item) => item.name !== addon.name); // Remove addon
      } else {
        return [...prevSelected, addon]; // Add addon
      }
    });
  };

  const handleDateChange = (e, type) => {
    const newDate = e.target.value;
    let updatedBooking = { ...booking };
  
    if (type === "start") {
      updatedBooking.startDate = newDate;
    } else {
      updatedBooking.endDate = newDate;
    }
  
    if (isDateConflict(updatedBooking.startDate, updatedBooking.endDate)) {
      toast.error("Selected dates conflict with another booking. Please choose different dates.");
      return;
    }
  
    setBooking(updatedBooking);
  };
  
  

  const handleDeleteAddOn = (addon) => {
    setSelectedAddOns((prevSelected) =>
      prevSelected.filter((item) => item.name !== addon.name)
    );
  };

  const handleAcceptBooking = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/owner/booking/acceptBooking', {
        bookingId,
        approvedAddOns: selectedAddOns
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('Booking updated successfully:', response.data);
    } catch (error) {
      console.error('Error accepting booking:', error.response?.data || error.message);
    }
  };
  
  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-2">
      
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
      <ToastContainer />

      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/ownerbookings")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back
        </button>
        <h2 className="font-bold text-xl text-gray-800 ml-6">Booking Details</h2>
      </div>
     
        {/* Car Image and Info */}
        <div className="flex flex-col items-left">
            {/* Image Carousel */}
        <div className="relative">
          <img
            src={`http://localhost:3000/${booking?.vehicleId?.imageUrls[currentImage]}`}
            alt="Vehicle"
            className="w-full h-64 object-contain rounded-md transition-opacity duration-500 ease-in-out"
          />
          {/* Next & Previous Buttons */}
          <button
            onClick={() => setCurrentImage((prev) => (prev > 0 ? prev - 1 : booking.vehicleId.imageUrls.length - 1))}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-white hover:bg-gray-800 px-3 py-1 rounded-full"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev < booking.vehicleId.imageUrls.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-white hover:bg-gray-800 px-3 py-1 rounded-full"
          >
            <i className="fa-solid fa-chevron-left fa-rotate-180"></i>
          </button>
        </div>

        {/* Thumbnail Selector */}
        <div className="flex gap-2 mt-3 justify-center">
          {booking.vehicleId.imageUrls.map((img, index) => (
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
                    <h2 className="text-xl font-bold mt-4">{booking.vehicleId.name}</h2>
                    <p className="text-gray-500">{booking.vehicleId.type} - {booking.vehicleId.builtYear || "N\A"}</p>
                    <p className={booking.vehicleId.isVerified ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                      {booking.vehicleId.isVerified ? "Admin Verified" : "Not Admin Verified"}
                    </p>


                </div>
                <div className="flex flex-col">
                    <div className="flex items-center mt-2">
                        <i className="fa-solid fa-star text-yellow-500"></i>
                        <span className="ml-1 text-gray-600">4.5</span>
                    </div>
                    <p className="text-lg font-bold mt-2">{booking.vehicleId.dailyPrice} NPR/day</p>
                </div>
            </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center mt-8 bg-gray-50 p-2 rounded-full shadow-md">
          <img
            src={`http://localhost:3000/${booking.ownerId.kycId.documents.profilePicture.file}`}
            alt="Owner"
            className="w-12 h-12 rounded-full border-gray-300 object-cover"
          />
          <div className="ml-4">
            <p className="text-green-600 font-semibold">Owner</p>
            <p className="text-gray-800 text-lg">{booking.ownerId.name}</p>
          </div>
        </div>

         {/* Display Booking Criteria */}

            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 mx-auto mt-6">
            <div className="flex items-center mb-4">
                <div className="bg-yellow-200 p-2 rounded-full">
                  <i className="fa-solid fa-circle-info text-yellow-600"></i>
                </div>
                <h2 className="text-xl font-semibold ml-2">Rental Details</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-4 text-sm text-gray-700">
                <div>
                    <h3 className="font-medium">Dates & Times</h3>
                    <p>{new Date(booking.startDate).toLocaleDateString()}{booking.pickupTime && (", "+booking.pickupTime)}</p>
                    <p>{new Date(booking.endDate).toLocaleDateString()}{booking.dropTime && (", "+booking.dropTime)}</p>
                </div>
                <div>
                    <h3 className="font-medium">Pick-up & Return Location</h3>
                    <p>{booking.pickAndDropLocation || 'N/A'}</p>
                </div>
                <div>
                    <h3 className="font-medium">Renter's Details</h3>
                    <p>Name: {booking.renterId.name}</p>
                    <p>Email: {booking.renterId.email}</p>
                </div>
                <div>
                    <h3 className="font-medium">Add-Ons Selected</h3>
                    <ul className="list-disc list-inside text-gray-600">
                        {booking.addOns.map((addOn) => (
                            <li key={addOn._id} className="text-sm">
                                {addOn.name}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            </div>


        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            {/* Car Specifications */}
            <div className="bg-gray-50 grid grid-cols-2 border border-gray-50 rounded-lg shadow-md mt-6 text-center">
              <div className="border-r border-gray-300 p-4">
                  <p className="text-gray-500">Seats</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.seats || "N/A"}</p>
              </div>
              <div className="p-4">
                  <p className="text-gray-500">Fuel Type</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.fuel || "N/A"}</p>
              </div>
              <div className="border-t border-r border-gray-300 p-4">
                  <p className="text-gray-500">Transmission</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.transmission || "N/A"}</p>
              </div>
              <div className="border-t p-4">
                  <p className="text-gray-500">Fuel Usage</p>
                  <p className="text-lg font-semibold">{booking.vehicleId.mileage + "KM/ 1L" || "N/A"}</p>
              </div>
          </div>

 {/* Add-Ons Section */}
 <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-md">
          <h3 className="font-semibold text-lg text-gray-800">Requested Add-Ons</h3>
          <ul className="mt-4 text-gray-700">
            {booking.addOns?.map((addon, index) => (
              <li key={index} className="flex justify-between py-2">
                <span>{addon.name} - {addon.pricePerDay} NPR/day</span>
                <div className="flex items-center">
                  
                  <button
                    onClick={() => handleAddOnToggle(addon)}
                    className={`ml-4 text-blue-500 ${selectedAddOns.some((item) => item.name === addon.name) ? 'text-red-500' : ''}`}
                  >
                    {selectedAddOns.some((item) => item.name === addon.name) ? 'Decline' : 'Undo'}
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
                {booking.vehicleId.features?.map((feature, index) => <li key={index}>{feature}</li>)}
              </ul>
            </div>


            {/* Bill Section */}
            <div className="bg-gray-50 p-6 shadow-md rounded-lg mt-6">
              <h3 className="font-semibold text-lg">Vehicle Cost</h3>
              <p className="mt-2 flex justify-between "><span>{calculateDaysDifference(booking.startDate, booking.endDate)} Days - {booking.vehicleId.dailyPrice} NPR/day</span> <span>Rs {baseCost}</span></p>
              
              <h3 className="font-semibold text-lg mt-4">Add Ons</h3>
              {selectedAddOns.length > 0 ? (selectedAddOns.map((addon, index) => (
                <div key={index} className="flex justify-between mt-2">
                  <span>{addon.name} - {addon.pricePerDay} NPR/day</span>
                  <div>
                  <span className='pr-3'>Rs {calculateDaysDifference(booking.startDate, booking.endDate)*addon.pricePerDay}</span>
                  {booking.bookingStatus === "Pending" && (
                  <button
                    onClick={() => handleDeleteAddOn(addon)}
                    className="text-red-500"
                  >
                    Delete
                  </button>)}
                  </div>
                </div>
              ))
            ):(
              <p className="text-gray-500 mt-2">No add-ons selected</p> // Message when no add-ons are selected
            )
            }

              <p className="font-bold mt-4 flex justify-between"><span>Total</span> <span>Rs {totalCost}</span></p>
            </div>

           
           <div>
    
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg" onClick={()=>handleAcceptBooking()}>
                Accept Booking
            </Button>
            <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg">
                Decline Booking
            </Button>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
}
