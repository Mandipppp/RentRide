import React from 'react';
import { Button } from '../Ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../Ui/Card';
import OwnerNavigation from './OwnerNavigation';
import carImg from "../Images/HomeCar.png";
import { Link } from 'react-router-dom';


const OwnerVehicles = () => {
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

      <p className="text-sm text-red-500 mb-4">*Your documents are under review. Meanwhile, you can add your vehicles.*</p>

      <Card className="bg-white shadow-md rounded-lg overflow-hidden">
        <CardHeader className="p-4 flex items-center justify-between border-b">
          <div>
            <h2 className="text-lg font-bold">3000 NPR / day</h2>
          </div>
          <span className="bg-green-100 text-green-600 text-sm font-semibold px-3 py-1 rounded">Vehicle Verified</span>
        </CardHeader>

        <CardContent className="p-4 flex flex-col md:flex-row items-center md:items-start">
            <div className="w-full md:w-1/3 flex justify-center md:justify-start">
                <img
                src={carImg}
                alt="Jeep Grand Wagoneer"
                className="rounded-lg"
                />
            </div>

            <div className="w-full md:w-2/3 mt-4 md:mt-0 md:ml-6 space-y-2">
                <h3 className="text-xl font-semibold">Jeep Grand Wagoneer</h3>
                <p className="text-sm text-gray-600">SUV</p>

                <div className="flex space-x-4 items-center">
                <div className="flex space-x-2 items-center">
                    <i className="fa-solid fa-couch"></i>
                    <span>6</span>
                </div>

                <div className="flex space-x-2 items-center">
                    <i className="fa-solid fa-gas-pump"></i>
                    <span>Petrol</span>
                </div>
                </div>

                <CardFooter className='flex items-center'>
                    <div className="flex items-center space-x-1 text-yellow-500">
                        <i className="fa-solid fa-star"></i>
                        <span className="text-lg font-bold">4.5</span>
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
    </div>
    </div>
  );
};

export default OwnerVehicles;
