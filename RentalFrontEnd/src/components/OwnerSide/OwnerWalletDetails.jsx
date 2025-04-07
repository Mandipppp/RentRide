import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';

function OwnerWalletDetails() {
  const [walletId, setWalletId] = useState("");
  const [currentWalletId, setCurrentWalletId] = useState("");
  const [error, setError] = useState("");
  const [walletError, setWalletError] = useState("");
  const navigate = useNavigate();

  const validateWalletId = (walletId) => {
    if (!walletId) return "Wallet ID is required";
    const walletRegex = /^[0-9]{10}$/;
    if (!walletRegex.test(walletId)) return "Wallet ID must be exactly 10 digits";
    return "";
  };

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      navigate("/login");
    } else {
      axios
        .get("http://localhost:3000/api/owner/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          // console.log(response.data)
          setWalletId(response.data.walletId || "");
          setCurrentWalletId(response.data.walletId || "");
        })
        .catch((err) => {
          setError("Failed to fetch wallet details.");
          toast.error("Failed to fetch wallet details.");
        });
    }
  }, [navigate]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!currentWalletId) {
    return <div>Loading...</div>;
  }

  const handleWalletIdChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 10 digits
    const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    setWalletId(sanitizedValue);
    setWalletError(validateWalletId(sanitizedValue));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate wallet ID
    const error = validateWalletId(walletId);
    if (error) {
      toast.error(error);
      setWalletError(error);
      return;
    }

    const token = reactLocalStorage.get("access_token");
    if (!token) {
      toast.error("Unauthorized. Please log in.");
      navigate("/login");
      return;
    }

    if (walletId === currentWalletId) {
      toast.info("No changes made to the wallet ID.");
      return;
    }

    const updatePayload = new FormData();
    updatePayload.append("walletId", walletId);

    axios
      .put("http://localhost:3000/api/owner/me", updatePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setCurrentWalletId(walletId);
        toast.success("Wallet ID updated successfully!");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to update Wallet ID. Please try again.");
      });
  };

  return (
    <section className="flex-1 bg-white shadow-md rounded-md p-6">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-6">Update Wallet ID</h2>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="walletId" className="block text-gray-700 font-medium">
            Wallet ID
          </label>
          <div className="relative">
            <input
              type="text"
              id="walletId"
              value={walletId}
              onChange={handleWalletIdChange}
              placeholder="Enter 10-digit Wallet ID"
              maxLength="10"
              className={`w-full border rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring ${
                walletError 
                  ? 'border-red-500 focus:ring-red-300' 
                  : walletId && !walletError
                    ? 'border-green-500 focus:ring-green-300'
                    : 'border-gray-300 focus:ring-blue-300'
              }`}
            />
            {walletId && (
              <span 
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                  walletError ? 'text-red-500' : 'text-green-500'
                }`}
              >
                <i className={`fas ${walletError ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
              </span>
            )}
          </div>
          {walletError && (
            <p className="text-red-500 text-sm mt-1">{walletError}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Must be exactly 10 digits
          </p>
        </div>
        <button
          type="submit"
          disabled={!!walletError || !walletId || walletId === currentWalletId}
          className={`w-full py-2 px-4 rounded-md transition-colors ${
            walletError || !walletId || walletId === currentWalletId
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {walletId === currentWalletId ? "No Changes to Update" : "Update Wallet ID"}
        </button>
      </form>
    </section>
  );
}

export default OwnerWalletDetails;
