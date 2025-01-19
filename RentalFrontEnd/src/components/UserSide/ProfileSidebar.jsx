import React from 'react'

function ProfileSidebar() {
  return (
    <aside className="w-full md:w-1/4 bg-white shadow-md rounded-md p-4">

        <h1 className="text-4xl font-bold text-gray-700">Profile</h1>
          <ul className="flex flex-col gap-4 pt-6">
            
            <li className="text-gray-600 hover:text-gray-800 cursor-pointer">
              Profile Details
            </li>
            <li className="text-gray-600 hover:text-gray-800 cursor-pointer">
              Update Password
            </li>
            <li className="text-gray-600 hover:text-gray-800 cursor-pointer">
              Sign Out
            </li>
          </ul>
    </aside>
  )
}

export default ProfileSidebar