import React, { useEffect, useState } from 'react';
import { Button } from '../Ui/Button';
import { Card } from '../Ui/Card';
import car from '../Images/HomeCar.png';
import { useNavigate, useParams } from 'react-router-dom';
import { reactLocalStorage } from 'reactjs-localstorage';
import axios from 'axios';


export default function VehicleDetails() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  
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

          console.log(response.data);
        } catch (err) {
          setError("Failed to fetch vehicle details.");
        }
      };
      fetchVehicle();
    }
  }, [vehicleId, token]);

  // Auto change image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % (vehicle?.imageUrls?.length || 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [currentImage]);

  if (!vehicle) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-2">
      
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/browsevehicles")}
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
                        <span className="ml-1 text-gray-600">4.5</span>
                    </div>
                    <p className="text-lg font-bold mt-2">{vehicle.dailyPrice} NPR/day</p>
                </div>
            </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center mt-8 bg-gray-50 p-2 rounded-full shadow-md">
          <img
            src={car}
            alt="Owner"
            className="w-12 h-12 rounded-full border-gray-300 object-cover"
          />
          <div className="ml-4">
            <p className="text-green-600 font-semibold">Owner</p>
            <p className="text-gray-800 text-lg">{vehicle.ownerId.name}</p>
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


            {/* Available Add-Ons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-md">
              <h3 className="font-semibold text-lg text-gray-800">Available Add-Ons</h3>
              <ul className="mt-4 text-gray-700">
                  {vehicle.addOns?.map((addon, index) => (
                  <li key={index} className="flex justify-between py-2">
                    <span>{addon.name}</span> <span className="text-green-600">+{addon.pricePerDay} NPR/day</span>
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


            {/* Cost Breakdown */}
            <div className="bg-gray-50 p-6 shadow-md rounded-lg mt-6">
              <h3 className="font-semibold text-lg">Vehicle Cost</h3>
              <p className="mt-2 flex justify-between "><span>4 Days - 3000 NPR/day</span> <span>Rs 12,000</span></p>
              <h3 className="font-semibold text-lg mt-2">Add Ons</h3>
              <p className="mt-2 flex justify-between"><span>Child Seat - 200 NPR/day</span> <span>Rs 800</span></p>
              <p className="font-bold mt-4 flex justify-between"><span>Total</span> <span>Rs 12,800</span></p>
            </div>

            {/* Book Now Button */}
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg">
              Book Now
            </Button>
          </div>
        </div>

       
      </div>
      {/* Reviews */}
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
        </div>
    </div>
  );
}
