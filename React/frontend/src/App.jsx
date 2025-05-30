"use client"

import React from "react"

import { useState } from "react"
import { Home } from "./pages/Home"
import { Profile } from "./pages/Profile"

// Create a simple navigation context
export const NavigationContext = React.createContext()

function App() {
  const [currentPage, setCurrentPage] = useState("home")

  const navigate = (page) => {
    setCurrentPage(page)
  }

  const renderPage = () => {
    switch (currentPage) {
      case "profile":
        return <Profile />
      case "home":
      default:
        return <Home />
    }
  }

  return <NavigationContext.Provider value={{ navigate, currentPage }}>{renderPage()}</NavigationContext.Provider>
}

export default App
