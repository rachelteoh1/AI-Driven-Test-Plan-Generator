"use client"

import { useState } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { User } from "lucide-react"
import useModal from '../../modal/useModal';
import TickedModal from '../../modal/TickModal';

export function Profile() {
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(false)

  // Input states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [dateJoined, setDateJoined] = useState("")
  const [role, setRole] = useState("")

  // Modal state
  const { showModal, hideModal } = useModal();

  // Handle Save button click
  const handleSave = () => {
    showModal({
      modal: (
        <TickedModal
          title="Changes Saved!"
          description="Your profile settings have been updated successfully."
        />
      ),
    });
    setTimeout(() => {
      hideModal();
    }, 2500);
  }


  return (
    <div className="flex justify-center items-center min-h-full w-full">
      <div className="w-full max-w-2xl space-y-8">
        {/* Profile Avatar */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-8">
          {/* Name and Email Row */}
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name
              </Label>
              <Input
                id="name"
                placeholder={name || "Your Name"}
                className="h-10 border-gray-300 rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={email || "Your Email Address"}
                className="h-10 border-gray-300 rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Date Joined and Role Row */}
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-3">
              <Label htmlFor="dateJoined" className="text-sm font-medium text-gray-700">
                Date Joined
              </Label>
              <Input
                id="dateJoined"
                placeholder={dateJoined || "14/5/2025"}
                className="h-10 border-gray-300 rounded-md"
                value={dateJoined}
                disabled
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                Role
              </Label>
              <Input
                id="role"
                placeholder={role || "Your Role"}
                className="h-10 border-gray-300 rounded-md"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-6 pt-10">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Dark Mode</Label>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                id="darkMode"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <label htmlFor="darkMode" className="flex items-center cursor-pointer">
                <div className="relative">
                  <div
                    className={`w-12 h-6 rounded-full shadow-inner transition-colors duration-300 ${darkMode ? "bg-blue-500" : "bg-gray-300"
                      }`}
                  ></div>
                  <div
                    className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-transform duration-300 ease-in-out ${darkMode ? "translate-x-6" : "translate-x-0.5"
                      }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Auto Save Test History</Label>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                id="autoSave"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              <label htmlFor="autoSave" className="flex items-center cursor-pointer">
                <div className="relative">
                  <div
                    className={`w-12 h-6 rounded-full shadow-inner transition-colors duration-300 ${autoSave ? "bg-blue-500" : "bg-gray-300"
                      }`}
                  ></div>
                  <div
                    className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-transform duration-300 ease-in-out ${autoSave ? "translate-x-6" : "translate-x-0.5"
                      }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center pt-1">
          <Button
            className="w-32 h-12 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
