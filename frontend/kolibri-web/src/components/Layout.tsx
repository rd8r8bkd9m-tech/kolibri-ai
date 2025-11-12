import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud, LogOut } from 'react-icons/fa'
import api from '../services/api'

function Layout({ children }) {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Cloud className="text-blue-600 text-2xl" />
            <h1 className="text-2xl font-bold text-gray-800">Kolibri Storage</h1>
          </div>
          <div className="flex gap-4 items-center">
            {isLoggedIn && (
              <>
                <a href="/storage" className="text-blue-600 hover:text-blue-800">Storage</a>
                <span className="text-gray-600">{localStorage.getItem('username')}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
