const express = require('express');
const router = express.Router();
const { getAllOwners, getOwnerById, updateKyc, adminBlockOwner, adminUnBlockOwner} = require('../controllers/adminOwnerController');
const { authenticate, checkAdmin, checkSuperAdmin } = require('../middlewares/authMiddleware');
const { getAllUsers, getUserById, adminBlockUser, adminUnBlockUser } = require('../controllers/adminUserController');
const { addAdmin, setupPassword, getDashboardStats, sendAdminNotification, getAllAdmins } = require('../controllers/adminAdminController');
const { getAllVehicles, getVehicleById, verifyVehicle } = require('../controllers/adminVehicleController');
const { getAllContacts, updateContactStatus } = require('../controllers/adminContactController');
const { getAllBookings, getBooking } = require('../controllers/adminBookingController');
const { getAllPayments } = require('../controllers/adminPaymentController');
const { getAllReviews, updateReviewStatus } = require('../controllers/adminReviewController');
// Route to get all owners
router.get('/getOwners',authenticate, checkAdmin, getAllOwners);

router.get('/getUsers',authenticate, checkAdmin, getAllUsers);
router.get('/getAdmins',authenticate, checkAdmin, getAllAdmins);
router.put('/blockuser/:userId', authenticate, checkAdmin, adminBlockUser);
router.put('/unblockuser/:userId', authenticate, checkAdmin, adminUnBlockUser);
router.put('/blockowner/:ownerId', authenticate, checkAdmin, adminBlockOwner);
router.put('/unblockowner/:ownerId', authenticate, checkAdmin, adminUnBlockOwner);




router.get('/getVehicles', authenticate, checkAdmin, getAllVehicles);


// Route to get a specific owner by ID
router.get('/owner/:id', authenticate, checkAdmin, getOwnerById);
router.get('/renter/:id', authenticate, checkAdmin, getUserById);

router.post('/add-admin', authenticate, checkSuperAdmin, addAdmin);
router.post('/setup-password/:token', setupPassword);

router.post('/kyc/:ownerId',authenticate, checkAdmin, updateKyc);

router.put('/verify-vehicle/:vehicleId', authenticate, checkAdmin, verifyVehicle);

//vehicles
router.get('/vehicle/:vehicleId', authenticate, checkAdmin, getVehicleById);

//contact-us-queries
router.get('/getContactQueries', authenticate, checkAdmin, getAllContacts);
router.put("/contact-query/:id/respond", authenticate, checkAdmin, updateContactStatus);

// bookings
router.get('/getBookings', authenticate, checkAdmin, getAllBookings);
router.get('/getBookings/:bookingId', authenticate, checkAdmin, getBooking);

// payments
router.get('/getPayments', authenticate, checkAdmin, getAllPayments);

// reviews
router.get('/reviews', authenticate, checkAdmin, getAllReviews);
router.put('/updatereview/:reviewId', authenticate, checkAdmin, updateReviewStatus);

router.get('/dashboardStats', authenticate, checkAdmin, getDashboardStats);
router.post('/makeannouncemnet', authenticate, checkAdmin, sendAdminNotification);




module.exports = router;

