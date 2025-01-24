import React, { useState } from "react";
import AddVehicleStep1 from "./AddVehicleStep1";
import AddVehicleStep2 from "./AddVehicleStep2";

const OwnerAddVehicle = () => {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(step + 1);
  const handlePrevious = () => setStep(step - 1);

  return (
    <div>
      {step === 1 && <AddVehicleStep1 onNext={handleNext} onCancel={() => alert("Canceled")} />}
      {step === 2 && <AddVehicleStep2 onPrevious={handlePrevious} onSubmit={() => alert("Submitted!")} />}
    </div>
  );
};

export default OwnerAddVehicle;
