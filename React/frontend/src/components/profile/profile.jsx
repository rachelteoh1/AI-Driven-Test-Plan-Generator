"use client"

import { useState } from "react"
import styled from "styled-components"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { User } from "lucide-react"
import useModal from "../../modal/useModal"
import TickedModal from "../../modal/TickModal"

// Styled Components
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  width: 100%;
`

const FormContainer = styled.div`
  width: 100%;
  max-width: 48rem; /* ~768px */
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const Avatar = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: white;
  border: 4px solid #d1d5db; /* gray-300 */
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3rem;
`

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const ToggleWrapper = styled.div`
  padding-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const ToggleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const SwitchWrapper = styled.div`
  position: relative;
`

const SwitchBackground = styled.div`
  width: 3rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: ${props => (props.active ? "#3B82F6" : "#D1D5DB")}; /* blue-500 or gray-300 */
  transition: background-color 0.3s;
`

const SwitchThumb = styled.div`
  position: absolute;
  top: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
  transform: ${props => (props.active ? "translateX(1.5rem)" : "translateX(0.125rem)")};
  transition: transform 0.3s ease-in-out;
`

const SaveButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 0.25rem;
`

export function Profile() {
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [dateJoined, setDateJoined] = useState("")
  const [role, setRole] = useState("")

  const { showModal, hideModal } = useModal()

  const handleSave = () => {
    showModal({
      modal: (
        <TickedModal
          title="Changes Saved!"
          description="Your profile settings have been updated successfully."
        />
      ),
    })
    setTimeout(() => {
      hideModal()
    }, 2500)
  }

  return (
    <Wrapper>
      <FormContainer>
        <AvatarWrapper>
          <Avatar>
            <User size={24} color="#9CA3AF" /> {/* gray-400 */}
          </Avatar>
        </AvatarWrapper>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <FieldRow>
            <FieldWrapper>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={name || "Your Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={email || "Your Email Address"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FieldWrapper>
          </FieldRow>

          <FieldRow>
            <FieldWrapper>
              <Label htmlFor="dateJoined">Date Joined</Label>
              <Input
                id="dateJoined"
                placeholder={dateJoined || "14/5/2025"}
                value={dateJoined}
                disabled
              />
            </FieldWrapper>
            <FieldWrapper>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder={role || "Your Role"}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </FieldWrapper>
          </FieldRow>
        </div>

        <ToggleWrapper>
          <ToggleRow>
            <Label>Dark Mode</Label>
            <SwitchWrapper>
              <input
                type="checkbox"
                id="darkMode"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                style={{ display: "none" }}
              />
              <label htmlFor="darkMode" style={{ cursor: "pointer" }}>
                <SwitchBackground active={darkMode} />
                <SwitchThumb active={darkMode} />
              </label>
            </SwitchWrapper>
          </ToggleRow>

          <ToggleRow>
            <Label>Auto Save Test History</Label>
            <SwitchWrapper>
              <input
                type="checkbox"
                id="autoSave"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                style={{ display: "none" }}
              />
              <label htmlFor="autoSave" style={{ cursor: "pointer" }}>
                <SwitchBackground active={autoSave} />
                <SwitchThumb active={autoSave} />
              </label>
            </SwitchWrapper>
          </ToggleRow>
        </ToggleWrapper>

        <SaveButtonWrapper>
          <Button
            className="w-32 h-12 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md"
            onClick={handleSave}
          >
            Save
          </Button>
        </SaveButtonWrapper>
      </FormContainer>
    </Wrapper>
  )
}
