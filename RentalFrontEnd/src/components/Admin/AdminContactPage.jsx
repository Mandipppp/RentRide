import React from 'react'
import Navbar from './Navbar'

function AdminContactPage() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mt-6 pt-16">
        <Navbar />
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Contact Us</h2>

        {/* Email Section */}
        <div className='space-x-4'>
            <label className="text-gray-700 font-medium text-lg">Email</label>
            <input
                type="email"
                placeholder="Enter your email"
                className="w-full max-w-xl py-3 px-5 border border-gray-300 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition duration-200"
            />
        </div>

        {/* Address Section */}
        <div className='space-x-4 mt-6'>
            <label className="text-gray-700 font-medium text-lg">Address</label>
            <input
                type="text"
                placeholder="Enter your address"
                className="w-full max-w-xl py-3 px-5 border border-gray-300 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition duration-200"
            />
        </div>

        {/* Phone Section */}
        <div className='space-x-4 mt-6'>
            <label className="text-gray-700 font-medium text-lg">Phone</label>
            <input
                type="tel"
                placeholder="Enter your phone number"
                className="w-full max-w-xl py-3 px-5 border border-gray-300 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition duration-200"
            />
        </div>

        {/* Social Media Section */}
        <div className='mt-8'>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Socials</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Instagram */}
                <div className="space-y-2">
                    <label className="text-gray-700 font-medium">Instagram</label>
                    <input
                        type="url"
                        placeholder="https://instagram.com/yourusername"
                        className="w-full py-3 px-5 border border-gray-300 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition duration-200"
                    />
                </div>

                {/* Facebook */}
                <div className="space-y-2">
                    <label className="text-gray-700 font-medium">Facebook</label>
                    <input
                        type="url"
                        placeholder="https://facebook.com/yourusername"
                        className="w-full py-3 px-5 border border-gray-300 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition duration-200"
                    />
                </div>

                {/* YouTube */}
                <div className="space-y-2">
                    <label className="text-gray-700 font-medium">YouTube</label>
                    <input
                        type="url"
                        placeholder="https://youtube.com/c/yourchannel"
                        className="w-full py-3 px-5 border border-gray-300 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition duration-200"
                    />
                </div>

                {/* Twitter */}
                <div className="space-y-2">
                    <label className="text-gray-700 font-medium">Twitter</label>
                    <input
                        type="url"
                        placeholder="https://twitter.com/yourusername"
                        className="w-full py-3 px-5 border border-gray-300 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-400 focus:outline-none transition duration-200"
                    />
                </div>
            </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition duration-300 mt-8 w-full max-w-xs mx-auto"
        >
          Update Contact
        </button>
    </div>
  )
}

export default AdminContactPage
