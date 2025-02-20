import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import Navigation from './Navigation';
import Footer from './Footer';
import { reactLocalStorage } from 'reactjs-localstorage';
import { useNavigate } from 'react-router-dom';


export default function ContactPage() {
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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
  

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = reactLocalStorage.get("access_token");
    if (!token) {
        toast.error("Unauthorized. Please log in.");
        navigate("/login");
        return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/users/contact-query', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      toast.success('Message sent successfully!');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="bg-pink-50 min-h-screen flex flex-col">
      <ToastContainer />

      <Navigation />
      <div className="container mx-auto flex flex-col md:flex-row gap-6 p-10">
        <div className="bg-white p-8 rounded-lg shadow-md flex-1">
          <h2 className="text-2xl font-bold mb-4">Get in touch with us!</h2>
          <p className="mb-4">Please fill up the form</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className="w-full p-2 border-b border-black focus:outline-none" required />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full p-2 border-b border-black focus:outline-none" required />
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full p-2 border-b border-black focus:outline-none" />
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" className="w-full p-2 border-b border-black focus:outline-none" required />
            <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Message" className="w-full p-2 border-b border-black focus:outline-none resize-none overflow-y-auto max-h-40" rows={3} required></textarea>
            <button type="submit" className="bg-black text-white px-4 py-2 w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <div className="flex items-center space-x-4 mb-4">
              <i className="fa-solid fa-location-dot"></i>
              <p>{contact.address}</p>
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <i className="fa-solid fa-envelope"></i>
              <p>{contact.email}</p>
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <i className="fa-solid fa-phone"></i>
              <p>{contact.phone}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-4 justify-start">
            <span><a href={contact.socials.facebook}><i className="fa-brands fa-facebook text-xl"></i></a></span>
            <span><a href={contact.socials.instagram}><i className="fa-brands fa-instagram text-xl"></i></a></span>
            <span><a href={contact.socials.twitter}><i className="fa-brands fa-square-x-twitter text-xl"></i></a></span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
