import React, { useState } from "react";
import AddVehicleStep1 from "./AddVehicleStep1";
import AddVehicleStep2 from "./AddVehicleStep2";

const OwnerAddVehicle = () => {
  const [step, setStep] = useState(1);
  const [vehicleDetails, setVehicleDetails] = useState({
    category: "",
    type: "",
    builtYear: "",
    name: "",
    pictures: [],
    registrationCert: null,
    insuranceCert: null,
  });

  const [contVehicleDetails, setcontVehicleDetails] = useState({
    seats: 0,
    transmission: "",
    fuelType: "",
    mileage: "",
    pricePerDay: "",
    pricePerHour: "",
    addOns: [],
    features: [],
    minRentalDays: 0,
    maxRentalDays: 0,
    description: "",
    condition: "Good",
    pickupLocation: "",
    latitude: 0,
    longitude: 0,
  });

  const handleNext = () => setStep(step + 1);
  const handlePrevious = () => setStep(step - 1);
  const handleCancel = () => {
    // Reset or redirect as needed
    setStep(1);
  };

  const handleSubmit = () => {
    const combinedData = { ...vehicleDetails, ...contVehicleDetails };
    console.log("Submitted Data:", combinedData);
    // Send combinedData to your API
  };

  return (
    <div>
      {step === 1 && (
        <AddVehicleStep1
          vehicleDetails={vehicleDetails}
          setVehicleDetails={setVehicleDetails}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}
      {step === 2 && (
        <AddVehicleStep2
          contVehicleDetails={contVehicleDetails}
          setcontVehicleDetails={setcontVehicleDetails}
          onPrevious={handlePrevious}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default OwnerAddVehicle;
