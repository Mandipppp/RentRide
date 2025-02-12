const axios = require("axios");
require('dotenv').config();


const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL;
const headers = {
  Authorization: `Key ${KHALTI_SECRET_KEY}`,
  "Content-Type": "application/json",
};

// Initiate Payment
const initiatePayment = async (req, res) => {
  try {
    const { amount, purchase_order_id, purchase_order_name, return_url, website_url } = req.body;

    const payload = {
      return_url,
      website_url,
      amount,
      purchase_order_id,
      purchase_order_name,
    };

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/initiate/`,
      payload,
      { headers }
    );

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

    res.json(response.data);
  } catch (error) {
    res.status(400).json(error.response.data);
  }
};

module.exports = { initiatePayment, verifyPayment };
