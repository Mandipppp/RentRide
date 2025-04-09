const Vehicle = require('../models/vehicle');
const Booking = require('../models/Booking');
const Review = require('../models/review');
const haversine = require("haversine-distance"); 

exports.getAvailableVehicles = async (req, res) => {
  try {
    const { pickAndDropLocation, latitude, longitude, pickupDate, dropDate, fuel, verified, addOns } = req.query;

    let matchQuery = { status: "Available" };

    // console.log(latitude, longitude);

    // Filter by fuel type
    if (fuel) {
      matchQuery.fuel = fuel;
    }

    // Filter by verified vehicles
    if (verified === "true") {
      matchQuery.isVerified = true;
    }

    if (addOns) {
      const addOnList = addOns.split(",").map(addOn =>
        addOn.toLowerCase().replace(/[-\s]/g, "_") // Normalize user input
      );
      matchQuery["addOns.name"] = {
        $in: addOnList.map(addOn => new RegExp(`^${addOn.replace(/_/g, "[-_\\s]")}$`, "i"))
      };
    }

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
        minRentalPeriod: { $lte: rentalPeriod },
        maxRentalPeriod: { $gte: rentalPeriod }
      };

      // Find vehicle IDs with conflicting bookings
      const bookedVehicles = await Booking.find({
        bookingStatus: { $in: ["Confirmed", "Active"] },
        $or: [
          { startDate: { $lt: drop }, endDate: { $gt: pickup } }
        ]
      }).distinct("vehicleId");
      
      matchQuery._id = { $nin: bookedVehicles };
    }

    let vehicles = await Vehicle.aggregate([
      // Match Vehicles that are Available
      { $match: matchQuery },

      // Join with Owner Collection
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

      //Join with KYC Collection
      {
        $lookup: {
          from: "kycs",
          localField: "owner.kycId",
          foreignField: "_id",
          as: "kyc"
        }
      },
      { $unwind: "$kyc" }, // Convert array to object

      // Filter by KYC Status
      { $match: { "kyc.overallStatus": "verified" } },

      // Apply rental period filter if needed
      { $match: rentalPeriodQuery }
    ]);

    // Calculate distance if latitude and longitude are provided
    if (latitude && longitude) {
      const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      
      const sortedVehicles = vehicles.map(vehicle => {
        if (vehicle.latitude && vehicle.longitude) {
          const vehicleLocation = { latitude: vehicle.latitude, longitude: vehicle.longitude };
          vehicle.distance = haversine(userLocation, vehicleLocation);
        } else {
          vehicle.distance = Infinity; // Place vehicles without location data at the end
        }
        return vehicle;
      });
    
      // sortedVehicles.sort((a, b) => a.distance - b.distance);
      vehicles = sortedVehicles; 
    }

    for (let vehicle of vehicles) {
      const reviews = await Review.find({ vehicleId: vehicle._id, status: "Approved" });
      vehicle.averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) : null;
    }
    // vehicles.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    // Sort vehicles by distance first, then by rating
    vehicles.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance; // Sort by nearest first
      }
      return (b.averageRating || 0) - (a.averageRating || 0); // Higher rated first
    });

    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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

// Get all unique add-ons from available vehicles
exports.getAllAddOns = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}, "addOns");

    let addOnsSet = new Set();

    vehicles.forEach(vehicle => {
      if (Array.isArray(vehicle.addOns)) {
        vehicle.addOns.forEach(addOn => {
          if (addOn && addOn.name && typeof addOn.name === "string") {
            // Normalize add-on names
            const normalizedAddOn = addOn.name.trim().toLowerCase().replace(/[-_\s]+/g, " ");
            addOnsSet.add(normalizedAddOn);
          }
        });
      }
    });

    res.status(200).json([...addOnsSet]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};