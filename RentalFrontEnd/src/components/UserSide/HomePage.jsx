import React from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import carImg from "../Images/HomeCar.png";


const HomePage = () => {
  return (
    <div className="bg-pink-50 min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="relative px-10 py-20">
        <div className="flex items-center justify-between">
          {/* Text Section */}
          <div className="w-1/2 space-y-6">
            <h2 className="text-red-500 text-xl tracking-widest">RENT. RIDE. EXPLORE.</h2>
            <h1 className="text-6xl font-bold text-black leading-tight">
              Rent What 
              <br />&emsp;Suits You
            </h1>
            <p className="text-gray-700 tracking-widest">
              Explore the road your way. Rent cars or bikes quickly and
              hassle-free!
            </p>
          </div>
          {/* Image Section */}
          <div className="flex justify-end w-full -mr-10">
            <img
              src={carImg}
              alt="Vehicle"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="text-center py-10">
        <h3 className="text-7xl font-bold text-orange-500">
          SUVs . Jeeps . Bikes . Scooters . Electrics .
        </h3>
      </section>

      {/* Features */}
      <section className="px-10 py-20 bg-white">
        <div className="grid grid-cols-2 gap-10">
          {/* Left Column */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold">No hidden charges</h2>
            <p className="text-gray-700">
              Transparent pricing, no surprises! Enjoy your ride with our clear
              and upfront rental charges—no hidden fees, no extra costs.
            </p>
          </div>
          {/* Right Column */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg">Easy Cancellation</h3>
              <p className="text-gray-600">
                Plans changed? No worries! Cancel your booking effortlessly with
                our flexible and hassle-free cancellation policy.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg">Add-On Options</h3>
              <p className="text-gray-600">
                Customize your ride with convenient add-ons like baby seats, or
                extra helmets for a tailored experience.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg">Hourly Rental</h3>
              <p className="text-gray-600">
                Need a ride for just a few hours? Choose hourly rentals for
                ultimate flexibility and cost-efficiency.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg">Owner Interaction</h3>
              <p className="text-gray-600">
                Stay connected! Directly chat with vehicle owners to clarify
                details, ensure smooth pickups, and address queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
