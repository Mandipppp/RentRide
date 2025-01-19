import React from 'react'
import { Link } from 'react-router-dom'

function OwnerNavigation() {
  return (
    <header className="bg-white shadow">
    <nav className="flex justify-between items-center px-10 py-4">
      {/* Logo */}
      <h1 className="text-xl font-bold text-gray-800">Owner Panel</h1>

      {/* Menu Links */}
      <ul className="flex space-x-8 text-gray-600">
        <li className="hover:text-black">
          <a href="#">Dashboard</a>
        </li>
        <li className="hover:text-black">
          <a href="#">My Vehicles</a>
        </li>
        <li className="hover:text-black">
            <a href="#">Bookings</a>
        </li>
      </ul>
    <Link to="/ownerprofile">
        <i className="fas fa-user text-gray-600 hover:text-black"></i>
    </Link>
    </nav>
    </header>
  )
}

export default OwnerNavigation