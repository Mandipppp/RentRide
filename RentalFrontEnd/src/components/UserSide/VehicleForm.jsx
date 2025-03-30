import React, { useState } from "react";
import LocationInput from "./LocationInput";

const VehicleForm = () => {
    const [location, setLocation] = useState(null);

    return (
        <div>
            <h2>Add New Vehicle</h2>
            <LocationInput onSelect={setLocation} />
            {console.log(location)}
            {location && <p>Selected: {location.address} (Lat: {location.lat}, Lng: {location.lon})</p>}
        </div>
    );
};

export default VehicleForm;
