import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const PaymentButton = () => {
  const [paymentUrl, setPaymentUrl] = useState("");
  const [status, setStatus] = useState(null); // 'null', 'verifying', 'success', 'failed'
  const [searchParams] = useSearchParams();

  // Initiate payment
  const initiatePayment = async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/auth/payment/initiate", {
        amount: 1300, // Amount in paisa (Rs. 13.00)
        purchase_order_id: "order_12345",
        purchase_order_name: "T-Shirt",
        return_url: "http://localhost:5173/payment-button", // Redirect URL after payment
        website_url: "http://localhost:5173/payment-button",
      });

      setPaymentUrl(response.data.payment_url);
      window.location.href = response.data.payment_url; // Redirect to Khalti
    } catch (error) {
      console.error("Payment initiation failed:", error.response?.data);
      setStatus("failed");
    }
  };

  // Verify payment when payment is successful and pidx is available in the URL
  useEffect(() => {
    const verifyPayment = async () => {
      const pidx = searchParams.get("pidx");
      if (pidx) {
        try {
          setStatus("verifying");
          const response = await axios.post("http://localhost:3000/api/auth/payment/verify", { pidx });
          if (response.data.status === "Completed") {
            setStatus("success");
          } else {
            setStatus("failed");
          }
        } catch (error) {
          setStatus("failed");
        }
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div>
      {status === null && (
        <div>
          <button
            onClick={initiatePayment}
            style={{
              padding: "10px",
              background: "purple",
              color: "white",
              cursor: "pointer",
            }}
          >
            Pay with Khalti
          </button>
        </div>
      )}

      {status === "verifying" && <h2>Verifying Payment...</h2>}

      {status === "success" && (
        <h2 style={{ color: "green" }}>Payment Successful! ✅</h2>
      )}

      {status === "failed" && (
        <h2 style={{ color: "red" }}>Payment Failed. Please try again. ⚠️</h2>
      )}
    </div>
  );
};

export default PaymentButton;
