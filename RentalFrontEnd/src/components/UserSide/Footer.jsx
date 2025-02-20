import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reactLocalStorage } from "reactjs-localstorage";

const Footer = () => {
  const [contact, setContact] = useState({
    email: '',
    address: '',
    phone: '',
    socials: { instagram: '', facebook: '', youtube: '', twitter: '' }
  });

  useEffect(() => {
  const fetchContactDetails = async () => {
    try {
      const token = reactLocalStorage.get("access_token");
      const response = await axios.get(`http://localhost:3000/api/admin/page/contact`);
      // console.log(response.data);
      setContact(response.data);
      
    } catch (error) {
      console.error("Error fetching contact details:", error);
    }
  };

  fetchContactDetails();
  }, []);
  return (
    <footer className="bg-gray-800 text-white py-10">
      <div className="grid grid-cols-3 px-10">
        {/* Left Section */}
        <div>
          <h3 className="text-lg font-bold">RentRide</h3>
          <div className="pt-5 space-y-2">
            <p>{contact.address || 'N/A'}</p>
            <p>{contact.phone || 'N/A'}</p>
            <p>{contact.email|| 'N/A'}</p>
          </div>
        </div>

        {/* Center Section */}
        <div>
          <h3 className="text-lg font-bold">About Rentcars</h3>
          <ul className="space-y-2 pt-5">
            <li>
              <Link to="/about-us" className="hover:text-gray-400">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-gray-400">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms-and-conditions" className="hover:text-gray-400">
                  Terms and Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Section */}
        <div>
          <h3 className="text-lg font-bold">Follow Us</h3>
          <div className="flex space-x-4 pt-5">
            <a href={contact.socials.facebook} className="hover:text-gray-400 text-2xl">
              <i className="fab fa-facebook"></i>
            </a>
            <a href={contact.socials.instagram} className="hover:text-gray-400 text-2xl">
              <i className="fab fa-instagram"></i>
            </a>
            <a href={contact.socials.youtube} className="hover:text-gray-400 text-2xl">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
        <div className="mt-8 text-gray-500">
          Copyright 2023 · RentRide, All Rights Reserved
        </div>
      </div>

     
      
    </footer>
  );
};

export default Footer;
