import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';

function OwnerWalletDetails() {
  const [walletId, setWalletId] = useState("");
  const [currentWalletId, setCurrentWalletId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    setWalletId(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
          <input
            type="text"
            id="walletId"
            value={walletId}
            onChange={handleWalletIdChange}
            placeholder="Wallet ID"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white rounded-md py-2 hover:bg-green-600"
        >
          Update Wallet ID
        </button>
      </form>
    </section>
  );
}

export default OwnerWalletDetails;
