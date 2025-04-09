const Contact = require("../models/contact");
const nodemailer = require("nodemailer");


exports.getAllContacts = async (req, res) => {
    try {
        // Extract query parameters
        const { name, email } = req.query;
    
        // Build the filter object dynamically
        const filter = {};
        if (name || email) {
          filter.$or = [];
          if (name) {
            filter.$or.push({ name: { $regex: name, $options: 'i' } });
          }
          if (email) {
            filter.$or.push({ email: { $regex: email, $options: 'i' } });
          }
        }
    
        // Fetch contacts from the database based on the filter
        const contacts = await Contact.find(filter); // Exclude the password
    
        // Check if contacts exist
        if (!contacts || contacts.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No queries found.',
          });
        }
    
        // Respond with the owners data
        return res.status(200).json({
          success: true,
          data: contacts,
        });
      } catch (error) {
        // Handle any errors
        console.error('Error fetching queries:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error. Please try again later.',
        });
      }
};

exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: "Inquiry not found." });
        }
        res.status(200).json(contact);
    } catch (error) {
        console.error("Error fetching inquiry:", error);
        res.status(500).json({ error: "Server error." });
    }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { response, status } = req.body;
    const queryId = req.params.id;

    // Validate status
    if (!["Resolved", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Find the query by ID
    let query = await Contact.findById(queryId);
    if (!query) {
      return res.status(404).json({ message: "Query not found." });
    }

    // Prevent changing status if already closed
    if (query.status === "Closed") {
      return res.status(400).json({ message: "This query is already closed." });
    }

    // Update the query
    query.status = status;
    if (response) query.response = response; // Save response only if provided
    query.updatedAt = new Date();

    await query.save();
    // console.log(status);
    
    // Send Email Notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: query.email,
      subject: `Your Query Status: ${status}`,
      html: `
        <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #333;
        background-color: #f4f4f4;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
      }
      .header h1 {
        color: #4CAF50;
      }
      .content {
        font-size: 16px;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
      .button {
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        text-align: center;
        display: inline-block;
        font-size: 16px;
        border-radius: 5px;
        text-decoration: none;
      }
      .button:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Query Status Update</h1>
      </div>
      <div class="content">
        <p>Hello <strong>${query.name}</strong>,</p>
        
        <p>Your query regarding <strong>${query.subject}</strong> has been marked as <strong>${status}</strong>.</p>
        
        ${response ? `
          <p><strong>Admin Response:</strong> ${response}</p>
        ` : ""}
        
        <p>Thank you for reaching out to us!</p>
        
        <p>Best regards,<br/>The Support Team</p>
      </div>
      <div class="footer">
        <p>&copy; 2025 RentRide. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>

      `,
    };
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: `Query marked as ${status} and email sent.`,
      query,
    });
  } catch (error) {
    console.error("Error updating query status:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};
