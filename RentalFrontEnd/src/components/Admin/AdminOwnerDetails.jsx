import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // To get the user ID from the URL
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";

const AdminOwnerDetails = () => {
    const [accessToken, setAccessToken] = useState("");
    const { id } = useParams(); // Extract the user ID from the URL
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = reactLocalStorage.get("access_token");
        if (token) {
            setAccessToken(token);
            getDetails(token); // Fetch all owner details initially
        }
        }, []);

    const getDetails = (token = "") => {
        // Construct the API URL with the search query if present
        const url = `http://localhost:3000/api/admin/${id}`;
    
        axios
        .get(url, {
            headers: {
            Authorization: `Bearer ${token}`, // Include token in Authorization header
            },
        })
        .then((res) => {
            // Set the owners data into state
            setOwner(res.data.data);
            setLoading(false);
        })
        .catch((error) => {
            console.error("Error fetching owner details:", error);
            setOwner([]); // Reset owners in case of an error
            setLoading(false);
        });
    };


    if (loading) {
        return <div>Loading...</div>;
    }

    if (!owner) {
        return <div>Owner not found.</div>;
    }

    return (
        <div className="p-6">
        <h2 className="text-3xl font-bold mb-4">Owner Details</h2>
        <p><strong>Name:</strong> {owner.name}</p>
        <p><strong>Email:</strong> {owner.email}</p>
        <p><strong>Contact Number:</strong> {owner.contactNumber || "N/A"}</p>
        <p><strong>KYC Status:</strong> {owner.kycStatus}</p>
        <p><strong>Profile Picture:</strong></p>
        <img
            src={`http://localhost:3000/${owner.profilePicture}`}
            alt={owner.name}
            className="w-24 h-24 rounded-full"
        />
        </div>
    );
};

export default AdminOwnerDetails;
