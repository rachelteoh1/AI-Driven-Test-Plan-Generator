"use client"

import { useState } from "react"
import { Header } from "../header"
import { Profile } from "./profile"
import { DashboardContent } from "./dashboard-content"

export function MainDashboard() {
  const [activeTab, setActiveTab] = useState("edit-profile")

  // Function to handle tab changes
  const handleTabChange = (value) => {
    setActiveTab(value)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header Component */}
      <Header />

      {/* Tabs */}
      <div className="px-6 bg-white border-b border-gray-200">
        <div className="w-full max-w-md grid grid-cols-2">
          <button
            onClick={() => handleTabChange("edit-profile")}
            className={`py-4 text-center font-medium ${
              activeTab === "edit-profile"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 border-b-2 border-transparent"
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => handleTabChange("summary-dashboard")}
            className={`py-4 text-center font-medium ${
              activeTab === "summary-dashboard"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 border-b-2 border-transparent"
            }`}
          >
            Summary Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-10 overflow-auto bg-gray-50">
        {activeTab === "edit-profile" && <Profile />}
        {activeTab === "summary-dashboard" && <DashboardContent />}
      </div>
    </div>
  )
}
