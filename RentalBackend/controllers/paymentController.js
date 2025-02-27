const axios = require("axios");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
require('dotenv').config();
const nodemailer = require("nodemailer");



const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL;
const headers = {
  Authorization: `Key ${KHALTI_SECRET_KEY}`,
  "Content-Type": "application/json",
};

// Initiate Payment
const initiatePayment = async (req, res) => {
  try {
    const { amount, purchase_order_id, purchase_order_name, return_url, website_url, totalAmount, ownerId } = req.body;
    const roundedAmount = amount;
    // Check if the amountPaid is at least 10% of totalAmount
    // console.log(userid=req.user.id);
    if (amount < totalAmount * 0.1) {
      return res.status(400).json({ success: false, message: "At least 10% of the total amount is required to lock the booking." });
    }

    // Find booking to ensure it exists
    const booking = await Booking.findById(purchase_order_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Check for overlapping confirmed bookings for the same vehicle
    const overlappingBookings = await Booking.find({
      vehicleId: booking.vehicleId,
      bookingStatus: 'Confirmed',
      _id: { $ne: purchase_order_id }, // Exclude the current booking
      $or: [
        { startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } },
        { startDate: { $gte: booking.startDate }, startDate: { $lte: booking.endDate } }
      ]
    });

    if (overlappingBookings.length > 0) {
      booking.bookingStatus = 'Pending';
      await booking.save();
      return res.status(400).json({ message: 'Sorry, but there has been another booking confirmed with these dates.' });
    }

    const payload = {
      return_url,
      website_url,
      amount: roundedAmount,
      purchase_order_id,
      purchase_order_name,
    };

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/initiate/`,
      payload,
      { headers }
    );
    // Save payment record
    const newPayment = new Payment({
      senderType: "User",
      senderId: booking.renterId,
      receiverType: "Owner",
      receiverId: ownerId,
      bookingId: booking._id,
      amountPaid: amount/100,
      totalAmount,
      paymentMethod: "Khalti",
      paymentType: "Payment",
      paymentStatus: "Pending",
      transactionId: response.data.pidx, // Store Khalti transaction ID
      isFullPayment: amount/100 >= totalAmount, // Check if full payment
    });

    await newPayment.save();

    res.json(response.data);
  } catch (error) {
    console.error("Khalti Payment Error:", error);

    if (error.response) {
      res.status(error.response.status || 400).json(error.response.data);
    } else if (error.request) {
      res.status(500).json({ message: "No response from Khalti. Check your internet or API URL." });
    } else {
      res.status(500).json({ message: "Request failed before reaching Khalti.", error: error.message });
    }
  }
};

// Initiate Payment
const initiateRefund = async (req, res) => {
  try {
    const { purchase_order_id, purchase_order_name, return_url, website_url, totalAmount, ownerId } = req.body;

    // Find booking to ensure it exists
    const booking = await Booking.findById(purchase_order_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (!booking.bookingStatus === "Cancelled") {
      return res.status(404).json({ success: false, message: "Booking not cancelled." });
    }

    if (booking.paymentStatus === "Refunded") {
      return res.status(404).json({ success: false, message: "Booking already refunded." });
    }

    if (!booking.refundRequest.requested) {
      return res.status(404).json({ success: false, message: "Refund not requested." });
    }

    // if (booking.cancellationFee <= 0) {
    //   return res.status(404).json({ success: false, message: "No cancellation fee to refund." });
    // }

    const payload = {
      return_url,
      website_url,
      amount: (booking.amountPaid-booking.cancellationFee)*100,
      purchase_order_id,
      purchase_order_name,
    };

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/initiate/`,
      payload,
      { headers }
    );
    // Save payment record
    const newPayment = new Payment({
      senderType: "Owner",
      senderId: ownerId,
      receiverType: "User",
      receiverId: booking.renterId,
      bookingId: booking._id,
      amountPaid: booking.amountPaid-booking.cancellationFee,
      totalAmount,
      paymentMethod: "Khalti",
      paymentType: "Refund",
      paymentStatus: "Pending",
      transactionId: response.data.pidx, // Store Khalti transaction ID
      isFullPayment: false, // Check if full payment
    });

    await newPayment.save();

    res.json(response.data);
  } catch (error) {
    console.error("Khalti Payment Error:", error);

    if (error.response) {
      res.status(error.response.status || 400).json(error.response.data);
    } else if (error.request) {
      res.status(500).json({ message: "No response from Khalti. Check your internet or API URL." });
    } else {
      res.status(500).json({ message: "Request failed before reaching Khalti.", error: error.message });
    }
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/lookup/`,
      { pidx },
      { headers }
    );

    if (response.data.status !== "Completed") {
      return res.status(400).json({ success: false, message: "Payment not completed yet." });
    }

    // Find the payment entry
    const payment = await Payment.findOne({ transactionId: pidx });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    // Update payment status
    payment.paymentStatus = "Completed";
    await payment.save();

    // Update booking details
    // const booking = await Booking.findById(payment.bookingId).populate('renterId');
    const booking = await Booking.findById(payment.bookingId)
          .populate('vehicleId')
          .populate('renterId')
          .populate({
            path: 'ownerId',
            populate: { path: 'kycId' } // Get owner details along with KYC
          });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Check for overlapping confirmed bookings for the same vehicle
    const overlappingBookings = await Booking.find({
      vehicleId: booking.vehicleId._id,
      bookingStatus: 'Confirmed',
      _id: { $ne: payment.bookingId }, // Exclude the current booking
      $or: [
        { startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } },
        { startDate: { $gte: booking.startDate }, startDate: { $lte: booking.endDate } }
      ]
    });

    if (overlappingBookings.length > 0) {
      booking.bookingStatus = 'Pending';
      await booking.save();
      return res.status(400).json({ message: 'Sorry, but there has been another booking confirmed with these dates.' });
    }

    booking.amountPaid += payment.amountPaid;

    // Update payment status in booking
    if (booking.amountPaid >= booking.amountDue) {
      booking.paymentStatus = "Full";
    } else {
      booking.paymentStatus = "Partial";
    }

    booking.amountDue -= payment.amountPaid;

    // Change the bookingStatus to "Confirmed" if payment is successful
    booking.bookingStatus = "Confirmed";
    await booking.save();

    // Generate Receipt PDF
    const receiptsDir = path.join(__dirname, "../receipts");
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    const filePath = path.join(receiptsDir, `receipt-${pidx}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("Payment Receipt", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Transaction ID: ${pidx}`, { align: "center" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(12).text(`Amount Paid: NPR ${payment.amountPaid}`);
    doc.text(`Total Amount: NPR ${payment.totalAmount}`);
    doc.text(`Payment Status: ${payment.paymentStatus}`);
    doc.text(`Payment Method: ${payment.paymentMethod}`);
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(14).text("Booking Details", { underline: true });
    doc.fontSize(12).text(`Renter ID: ${booking.renterId._id}`);
    doc.text(`Vehicle ID: ${booking.vehicleId._id}`);
    doc.text(`Rental Start: ${new Date(booking.startDate).toLocaleDateString()}`);
    doc.text(`Rental End: ${new Date(booking.endDate).toLocaleDateString()}`);
    doc.text(`Pickup Location: ${booking.pickAndDropLocation || "N/A"}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(10).text("Thank you for your payment!", { align: "center" });
    doc.fontSize(8).text("This is a system-generated receipt.", { align: "center" });

    doc.end();

    stream.on("finish", async () => {
      try {
        // Send Email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: booking.renterId.email,
          subject: "Payment Successful - Receipt Attached",
          text: `Dear Customer,\n\nYour payment of NPR ${payment.amountPaid} has been successfully processed.\n\nPlease find the attached invoice for your reference.\n\nThank you for choosing us!`,
          attachments: [
            {
              filename: `Receipt-${pidx}.pdf`,
              path: filePath,
            },
          ],
        };

        await transporter.sendMail(mailOptions);

        // res.json(response.data);
        res.status(200).json({
          success: true,
          message: 'Payment Success',
          data: response.data,
          booking
        });

      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        res.status(500).json({ success: false, message: "Payment verified but failed to send email." });
      }
    });
  } catch (error) {
    res.status(400).json(error.response.data);
  }
};

// Verify Payment
const verifyRefund = async (req, res) => {
  try {
    const { pidx } = req.body;

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/lookup/`,
      { pidx },
      { headers }
    );

    if (response.data.status !== "Completed") {
      return res.status(400).json({ success: false, message: "Payment not completed yet." });
    }

    // Find the payment entry
    const payment = await Payment.findOne({ transactionId: pidx });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    // Update payment status
    payment.paymentStatus = "Completed";
    await payment.save();

    // Update booking details
    // const booking = await Booking.findById(payment.bookingId).populate("ownerId");
    const booking = await Booking.findById(payment.bookingId)
    .populate('vehicleId')
    .populate({
      path: 'ownerId',
      populate: { path: 'kycId' } // Get owner details along with KYC
    })
    .populate('renterId');

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if(!((booking.amountPaid-booking.cancellationFee) === payment.amountPaid)){
      return res.status(404).json({ success: false, message: "Refund amount not valid." });
    }

    booking.paymentStatus = "Refunded";
    await booking.save();

    // Generate Receipt PDF
    const receiptsDir = path.join(__dirname, "../receipts");
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    const filePath = path.join(receiptsDir, `receipt-${pidx}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("Payment Receipt", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Transaction ID: ${pidx}`, { align: "center" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(12).text(`Amount Paid: NPR ${payment.amountPaid}`);
    doc.text(`Total Amount: NPR ${payment.totalAmount}`);
    doc.text(`Payment Status: ${payment.paymentStatus}`);
    doc.text(`Payment Method: ${payment.paymentMethod}`);
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(14).text("Booking Details", { underline: true });
    doc.fontSize(12).text(`Renter ID: ${booking.renterId._id}`);
    doc.text(`Vehicle ID: ${booking.vehicleId._id}`);
    doc.text(`Rental Start: ${new Date(booking.startDate).toLocaleDateString()}`);
    doc.text(`Rental End: ${new Date(booking.endDate).toLocaleDateString()}`);
    doc.text(`Pickup Location: ${booking.pickAndDropLocation || "N/A"}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(10).text("Thank you for your payment!", { align: "center" });
    doc.fontSize(8).text("This is a system-generated receipt.", { align: "center" });

    doc.end();

    stream.on("finish", async () => {
      try {
        // Send Email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: booking.ownerId.email,
          subject: "Payment Successful - Receipt Attached",
          text: `Dear Customer,\n\nYour payment of NPR ${payment.amountPaid} has been successfully processed.\n\nPlease find the attached invoice for your reference.\n\nThank you for choosing us!`,
          attachments: [
            {
              filename: `Receipt-${pidx}.pdf`,
              path: filePath,
            },
          ],
        };

        await transporter.sendMail(mailOptions);

        // res.json(response.data);
        res.status(200).json({
          success: true,
          message: 'Payment Success',
          data: response.data,
          booking
        });

      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        res.status(500).json({ success: false, message: "Payment verified but failed to send email." });
      }
    });
  } catch (error) {
    res.status(400).json(error.response.data);
  }
};

const showReciept = async (req, res) => {
  const { pidx } = req.query;
    if (!pidx) {
        return res.status(400).json({ error: "Missing pidx" });
    }

    try {
        // Fetch payment details
        const payment = await Payment.findOne({ transactionId: pidx }).populate("bookingId");
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        const booking = payment.bookingId;
        if (!booking) {
            return res.status(404).json({ error: "Booking details not found" });
        }

        // Define the directory where receipts are stored
        const receiptsDir = path.join(__dirname, "../receipts");

        // Ensure the directory exists
        if (!fs.existsSync(receiptsDir)) {
            fs.mkdirSync(receiptsDir, { recursive: true });
        }

        // Define the file path
        const filePath = path.join(receiptsDir, `receipt-${pidx}.pdf`);

        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text("Payment Receipt", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Transaction ID: ${pidx}`, { align: "center" });
        doc.moveDown();

        // doc.fontSize(20).fillColor('#444444')
        // .fontSize(20)
        // .text('RentRide', 50, 65)
        // .fontSize(10)
        // .text('Kapan, Kathmandu', 200, 65, { align: 'right' })
        // .text('rentride15@gmail.com', 200, 80, { align: 'right' })
        // .moveDown();

        

        // Draw line separator
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Payment Details
        doc.fontSize(12).text(`Amount Paid: NPR ${payment.amountPaid}`, { bold: true });
        doc.text(`Total Amount: NPR ${payment.totalAmount}`);
        doc.text(`Payment Status: ${payment.paymentStatus}`);
        doc.text(`Payment Method: ${payment.paymentMethod}`);
        doc.text(`Payment Type: ${payment.paymentType}`);
        doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
        doc.moveDown();

        // Booking Details
        doc.fontSize(14).text("Booking Details", { underline: true });
        doc.fontSize(12).text(`Renter ID: ${booking.renterId}`);
        doc.text(`Owner ID: ${booking.ownerId}`);
        doc.text(`Vehicle ID: ${booking.vehicleId}`);
        doc.text(`Rental Start: ${new Date(booking.startDate).toLocaleDateString()}`);
        doc.text(`Rental End: ${new Date(booking.endDate).toLocaleDateString()}`);
        doc.text(`Total Days: ${booking.totalDays}`);
        doc.text(`Pickup Location: ${booking.pickAndDropLocation || "N/A"}`);
        doc.text(`Pickup Time: ${booking.pickupTime || "N/A"}`);
        doc.text(`Drop-off Time: ${booking.dropTime || "N/A"}`);
        doc.moveDown();

        // Booking Status
        doc.fontSize(12).text(`Booking Status: ${booking.bookingStatus}`, { bold: true });
        doc.text(`Payment Status: ${booking.paymentStatus}`);
        doc.text(`Amount Due: NPR ${booking.amountDue}`);
        doc.text(`Amount Paid: NPR ${booking.amountPaid}`);
        doc.text(`Payment Method: ${booking.paymentMethod}`);
        doc.text(`Cancellation Fee: NPR ${booking.cancellationFee}`);
        doc.moveDown();

        // Add-ons (if any)
        if (booking.addOns.length > 0) {
            doc.fontSize(14).text("Add-Ons", { underline: true });
            booking.addOns.forEach((addon, index) => {
                doc.fontSize(12).text(`${index + 1}. ${addon.name} - NPR ${addon.totalPrice}`);
            });
            doc.moveDown();
        }

        // Footer
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(10).text("Thank you for your payment!", { align: "center" });
        doc.fontSize(8).text("This is a system-generated receipt.", { align: "center" });

        doc.end();

        stream.on("finish", () => {
            res.download(filePath, `Receipt-${pidx}.pdf`);
        });

    } catch (error) {
        console.error("Error generating receipt:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = { initiatePayment, verifyPayment, showReciept, initiateRefund, verifyRefund };
