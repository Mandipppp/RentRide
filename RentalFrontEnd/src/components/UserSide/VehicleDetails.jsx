// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Star } from "lucide-react";
import React from 'react';
import { Button } from '../Ui/Button';
import { Card } from '../Ui/Card';
import car from '../Images/HomeCar.png';



export default function VehicleDetails() {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        {/* Car Image and Info */}
        <div className="flex flex-col items-left">
            <img
            src={car}
            alt="Jeep Grand Wagoneer"
            className="w-full h-64 object-contain"
            />
            <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold mt-4">Jeep Grand Wagoneer</h2>
                    <p className="text-gray-500">SUV - 2021</p>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center mt-2">
                        <i className="fa-solid fa-star text-yellow-500"></i>
                        <span className="ml-1 text-gray-600">4.5</span>
                    </div>
                    <p className="text-lg font-bold mt-2">3000 NPR/day</p>
                </div>
            </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center mt-8 bg-gray-50 p-2 rounded-full shadow-md">
          <img
            src={car}
            alt="Owner"
            className="w-12 h-12 rounded-full border-gray-300"
          />
          <div className="ml-4">
            <p className="text-green-600 font-semibold">Owner</p>
            <p className="text-gray-800 text-lg">Ritesh Karki</p>
          </div>
        </div>

        {/* Car Specifications */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 shadow-md rounded-lg mt-6">
            <div className="flex flex-col items-center">
                <p><strong>Seats</strong></p>
                <p>6</p>
            </div>
            <div className="flex flex-col items-center">
                <p><strong>Fuel Type</strong></p>
                <p>Petrol</p>
            </div>
            <div className="flex flex-col items-center">
                <p><strong>Transmission</strong></p>
                <p>Automatic</p>
            </div>
            <div className="flex flex-col items-center">
                <p><strong>Fuel Usage</strong></p>
                <p>10Km/1L</p>
            </div>
        </div>

         {/* Available Add-Ons */}
         <div className="bg-gray-50 p-6 rounded-lg mt-8 shadow-md">
          <h3 className="font-semibold text-lg text-gray-800">Available Add-Ons</h3>
          <ul className="mt-4 text-gray-700">
            <li className="flex justify-between py-2">
              <span>Child Seat</span> <span className="text-green-600">+200 NPR/day</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Roof Rack</span> <span className="text-green-600">+300 NPR/day</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Car Charger</span> <span className="text-green-600">+50 NPR/day</span>
            </li>
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

       {/* Reviews */}
       <div className="mt-8">
          <h3 className="font-semibold text-lg text-gray-800">Reviews</h3>
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
              <img src={car} alt="Reviewer" className="w-8 h-8 rounded-full border-gray-300" />
              <p className="ml-3 text-gray-800">Raju Narayan</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
