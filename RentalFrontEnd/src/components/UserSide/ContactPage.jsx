import React from 'react'
import Navigation from './Navigation';
import Footer from './Footer';

export default function ContactPage() {
    return (
      <div className="bg-pink-50 min-h-screen flex flex-col">
        <Navigation />
  
        <div className="container mx-auto flex flex-col md:flex-row gap-6 p-10">
          <div className="bg-white p-8 rounded-lg shadow-md flex-1">
            <h2 className="text-2xl font-bold mb-4">Get in touch with us!</h2>
            <p className="mb-4">Please fill up the form</p>
            <form className="space-y-4">
              <input type="text" placeholder="Your Name" className="w-full p-2 border-b border-black focus:outline-none" />
              <input type="email" placeholder="Email Address" className="w-full p-2 border-b border-black focus:outline-none" />
              <input type="text" placeholder="Phone Number" className="w-full p-2 border-b border-black focus:outline-none" />
              <textarea placeholder="Message" className="w-full p-2 border-b border-black focus:outline-none"></textarea>
              <button className="bg-black text-white px-4 py-2 w-full">Send Message</button>
            </form>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md flex-1">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p><i className="fa-solid fa-location-dot"></i> Kapan, Kathmandu</p>
            <p><i className="fa-solid fa-envelope"></i> rentride@gmail.com</p>
            <p><i className="fa-solid fa-phone"></i> +977 23456789</p>
            <div className="mt-4 flex space-x-4">
              <span><i className="fa-brands fa-facebook"></i></span>
              <span><i className="fa-brands fa-instagram"></i></span>
              <span><i class="fa-brands fa-square-x-twitter"></i></span>
            </div>
          </div>
        </div>
  
        <Footer />
      </div>
    );
  }