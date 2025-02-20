const PageContact = require('../models/pageContact');

// Get Contact Details
exports.getContact = async (req, res) => {
    try {
        const contact = await PageContact.findOne();
        if (!contact) {
            return res.status(404).json({ message: 'Contact details not found' });
        }
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update Contact Details
exports.updateContact = async (req, res) => {
    try {
        const updatedData = req.body;
        let contact = await PageContact.findOne();

        if (!contact) {
            contact = new PageContact(updatedData);
        } else {
            Object.assign(contact, updatedData);
        }

        await contact.save();
        res.status(200).json({ message: 'Contact details updated successfully', contact });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
