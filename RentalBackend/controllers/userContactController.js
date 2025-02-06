const Contact = require("../models/contact");

exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "Please fill all required fields." });
        }

        const newContact = new Contact({ name, email, phone, subject, message });
        await newContact.save();

        res.status(201).json({ message: "Form submitted successfully!" });
    } catch (error) {
        console.error("Error submitting contact form:", error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};
