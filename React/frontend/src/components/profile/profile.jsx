"use client";

import { useState, useEffect } from "react";
import { useUserProfile, useUpdateProfile } from "../../hook/useProfile";
import styled from "styled-components";
import { User } from "lucide-react";
import useModal from "../../modal/useModal";
import TickedModal from "../../modal/TickModal";
import { COLORS, FONTSIZE, FONTWEIGHT, SPACING, lightTheme, darkTheme } from "../../lib/styles";

// Styled Components
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 48rem;
  display: flex;
  flex-direction: column;
  gap: ${SPACING.xl};
`;

const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const Avatar = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: ${({ theme }) => theme.card};
  border: 4px solid ${({ theme }) => theme.status.cancel};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${SPACING["2xl"]};
`;

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.sm};

  label {
    font-size: ${FONTSIZE.base};
    font-weight: ${FONTWEIGHT.medium};
    color: ${({ theme }) => theme.text};
  }
`;

const ToggleWrapper = styled.div`
  padding-top: ${SPACING.xl};
  display: flex;
  flex-direction: column;
  gap: ${SPACING.lg};
`;

const ToggleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  label {
    font-size: ${FONTSIZE.base};
    font-weight: ${FONTWEIGHT.medium};
    color: ${({ theme }) => theme.text};
  }
`;

const SwitchWrapper = styled.div`
  position: relative;
`;

const SwitchBackground = styled.div`
  width: 3rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: ${(props) => (props.$active ? COLORS.secondary : COLORS.grey)};
  transition: background-color 0.3s;
`;

const SwitchThumb = styled.div`
  position: absolute;
  top: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
  transform: ${(props) => (props.$active ? "translateX(1.5rem)" : "translateX(0.125rem)")};
  transition: transform 0.3s ease-in-out;
`;

const StyledLabel = styled.label`
  font-size: ${FONTSIZE.sm};
  font-weight: ${FONTWEIGHT.medium};
  line-height: 1.25rem;
  color: ${({ theme }) => theme.greys.dark};

  &[disabled] {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
const StyledInput = styled.input`
  height: 2.5rem;
  width: 100%;
  padding: 0 ${SPACING.md};
  font-size: ${FONTSIZE.sm};
  border: 1px solid ${({ theme }) => theme.greys.medium};
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.greys.dark};
  border-radius: 0.375rem;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.greys.light};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;


const SaveButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding-top: ${SPACING.sm};
`;

const StyledButton = styled.button`
  width: 8rem;
  height: 3rem;
  border-radius: 0.375rem;
  background-color: ${({ theme }) => theme.newChat};
  color: ${({ theme }) => theme.greys.dark};
  font-weight: ${FONTWEIGHT.medium};
  font-size: ${FONTSIZE.base};
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.accent};
    outline-offset: 2px;
  }
`;


export function Profile() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { showModal, hideModal } = useModal();

  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.username || "");
      setEmail(profile.email || "");
      setDateJoined(profile.date_joined?.split("T")[0] || "");
      setRole(profile.role || "");
      setDarkMode(profile.pref_darkmode || false);
      setAutoSave(profile.pref_autosave || false);
    }
  }, [profile]);

  const handleSave = () => {
    const updated = {
      username: name,
      email,
      role,
      pref_darkmode: darkMode,
      pref_autosave: autoSave,
    };

    updateProfile.mutate(updated, {
      onSuccess: () => {
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
      },
    });
  };

  if (isLoading) return <div>Loading profile...</div>;

  return (
    <Wrapper>
      <FormContainer>
        <AvatarWrapper>
          <Avatar>
            <User size={24} color={COLORS.light} />
          </Avatar>
        </AvatarWrapper>

        <div style={{ display: "flex", flexDirection: "column", gap: SPACING.xl }}>
          <FieldRow>
            <FieldWrapper>
              <StyledLabel htmlFor="name">Name</StyledLabel>
              <StyledInput id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </FieldWrapper>
            <FieldWrapper>
              <StyledLabel htmlFor="email">Email</StyledLabel>
              <StyledInput
                id="email"
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FieldWrapper>
          </FieldRow>

          <FieldRow>
            <FieldWrapper>
              <StyledLabel htmlFor="dateJoined">Date Joined</StyledLabel>
              <StyledInput id="dateJoined" value={dateJoined} disabled />
            </FieldWrapper>
            <FieldWrapper>
              <StyledLabel htmlFor="role">Role</StyledLabel>
              <StyledInput
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </FieldWrapper>
          </FieldRow>
        </div>

        <ToggleWrapper>
          <ToggleRow>
            <StyledLabel>Dark Mode</StyledLabel>
            <SwitchWrapper>
              <input
                type="checkbox"
                id="darkMode"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                style={{ display: "none" }}
              />
              <label htmlFor="darkMode" style={{ cursor: "pointer" }}>
                <SwitchBackground $active={darkMode} />
                <SwitchThumb $active={darkMode} />
              </label>
            </SwitchWrapper>
          </ToggleRow>

          <ToggleRow>
            <StyledLabel>Auto Save Test History</StyledLabel>
            <SwitchWrapper>
              <input
                type="checkbox"
                id="autoSave"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                style={{ display: "none" }}
              />
              <label htmlFor="autoSave" style={{ cursor: "pointer" }}>
                <SwitchBackground $active={autoSave} />
                <SwitchThumb $active={autoSave} />
              </label>
            </SwitchWrapper>
          </ToggleRow>
        </ToggleWrapper>

        <SaveButtonWrapper>
          <StyledButton
            onClick={handleSave}
          >
            Save
          </StyledButton>
        </SaveButtonWrapper>
      </FormContainer>
    </Wrapper>
  );
}
