const Vehicle = require('../models/vehicle');

exports.getAvailableVehicles = async (req, res) => {
  try {
    const { pickAndDropLocation, pickupDate, dropDate, fuel, verified, addOns } = req.query;

    let matchQuery = { status: "Available" };

    // Filter by fuel type
    if (fuel) {
      matchQuery.fuel = fuel;
    }

    // Filter by verified vehicles
    if (verified === "true") {
      matchQuery.isVerified = true;
    }

    // Filter by add-ons
    if (addOns) {
      const addOnList = addOns.split(",").map(addOn => 
        addOn.toLowerCase().replace(/[-\s]/g, "_")  // Convert to lowercase and replace spaces/hyphens with "_"
      );
      matchQuery["addOns.name"] = { $all: addOnList };
    }

    // // Filter by add-ons if provided
    // if (addOns) {
    //   const addOnList = addOns.split(",");
    //   // console.log(addOnList);
    //   query["addOns.name"] = { $all: addOnList };
    // }

    // Filter by rental date availability
    let rentalPeriodQuery = {};
    if (pickupDate && dropDate) {
      const pickup = new Date(pickupDate);
      const drop = new Date(dropDate);
      const rentalPeriod = (drop - pickup) / (1000 * 60 * 60 * 24);

      if (drop <= pickup) {
        return res.status(400).json({ message: "Return date must be after pickup date." });
      }

      rentalPeriodQuery = {
        $or: [
          { bookings: { $not: { $elemMatch: { startDate: { $lt: drop }, endDate: { $gt: pickup } } } } },
          { bookings: { $exists: false } }
        ],
        minRentalPeriod: { $lte: rentalPeriod },
        maxRentalPeriod: { $gte: rentalPeriod }
      };
    }

    // MongoDB Aggregation Pipeline
    const vehicles = await Vehicle.aggregate([
      // Step 1: Match Vehicles that are Available
      { $match: matchQuery },

      // Step 2: Join with Owner Collection
      {
        $lookup: {
          from: "owners",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner"
        }
      },
      { $unwind: "$owner" }, // Convert array to object
      { $match: { "owner.blockStatus": "active" } },

      // Step 3: Join with KYC Collection
      {
        $lookup: {
          from: "kycs",
          localField: "owner.kycId",
          foreignField: "_id",
          as: "kyc"
        }
      },
      { $unwind: "$kyc" }, // Convert array to object

      // Step 4: Filter by KYC Status
      { $match: { "kyc.overallStatus": "verified" } },

      // Step 5: Apply rental period filter if needed
      { $match: rentalPeriodQuery }
    ]);

    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

  // Get a vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
      const { vehicleId } = req.params;

      // Find vehicle by ID
      const vehicle = await Vehicle.findById(vehicleId)
      .populate({
        path: 'ownerId',
        select: 'name email contactNumber', // Include only specific fields from the owner
        populate: {
          path: 'kycId',
          select: 'documents.profilePicture.file', // Include only the profile picture
        }
      });

      if (!vehicle) {
          return res.status(404).json({ message: "Vehicle not found" });
      }

      res.status(200).json(vehicle);
  } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
  }
};