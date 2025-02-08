const Vehicle = require('../models/vehicle');

// Get available vehicles based on search filters
exports.getAvailableVehicles = async (req, res) => {
    try {
      const { pickAndDropLocation, pickupDate, dropDate, fuel, verified, addOns } = req.query;
  
      let query = { status: "Available" };
  
    //   // Filter by location
    //   if (pickAndDropLocation) {
    //     query.pickupLocation = { $regex: new RegExp(pickAndDropLocation, "i") };
    //   }
  
      // Filter by fuel type
      if (fuel) {
        query.fuel = fuel;
      }
  
      // Filter by verified vehicles
      if (verified === "true") {
        query.isVerified = true;
      }


      if (addOns) {
        const addOnList = addOns.split(",").map(addOn => 
          addOn.toLowerCase().replace(/[-\s]/g, "_")  // Convert to lowercase and replace spaces/hyphens with _
        );
        // console.log(addOnList);
        query["addOns.name"] = { $all: addOnList };  // Search for all required add-ons
      }
  
      // Filter by rental date availability
      if (pickupDate && dropDate) {
        const pickup = new Date(pickupDate);
        const drop = new Date(dropDate);
        const rentalPeriod = (drop - pickup) / (1000 * 60 * 60 * 24);
  
        if (drop <= pickup) {
          return res.status(400).json({ message: "Return date must be after pickup date." });
        }
  
        query.$or = [
        { bookings: { $not: { $elemMatch: { startDate: { $lt: drop }, endDate: { $gt: pickup } } } } },
        { bookings: { $exists: false } },
      ];

      // Ensure rental period is within min and max limits
      query.minRentalPeriod = { $lte: rentalPeriod };
      query.maxRentalPeriod = { $gte: rentalPeriod };
      }
  
      // Fetch vehicles based on query
      const vehicles = await Vehicle.find(query);
      res.status(200).json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };