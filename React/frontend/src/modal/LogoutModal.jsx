import { useState } from "react";
import styled from "styled-components";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";
import { Button } from "@mui/material";
import TickedModal from "./TickModal";
import CrossedModal from "./CrossedModal";
import { useNavigate } from "react-router-dom";

const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  min-height: 30vh;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  background-color: ${({ theme }) => theme.background};
`;

const Title = styled.h1`
  font-size: ${FONTSIZE["2xl"]};
  font-weight: ${FONTWEIGHT.medium};
  color: ${({ theme }) => theme.text};
`;

const RowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 5rem;
`;

export default function LogoutModal({
  title,
  onLogout,
  hideModal,
  navigateTo = "/signin",
}) {
  const [status, setStatus] = useState(null);
  const navigate = useNavigate(); // <-- Use the hook

  const handleLogout = async () => {
    try {
      await onLogout?.();
      setStatus("success");
      setTimeout(() => {
        hideModal();
        navigate(navigateTo);
      }, 6000);
    } catch {
      setStatus("fail");
    }
  };

  if (status === "success") {
    return (
      <TickedModal title="Logout successfully!" hideModal={hideModal} />
    );
  }

  if (status === "fail") {
    return (
      <CrossedModal
        title="Unable to Logout"
        description="Please try again later"
        hideModal={hideModal}
      />
    );
  }

  return (
    <CenteredDiv>
      {title && <Title>{title}</Title>}
      <RowDiv>
        <Button
          onClick={hideModal}
          variant="contained"
          sx={{ backgroundColor: COLORS.greyblue }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLogout}
          variant="contained"
          sx={{ backgroundColor: COLORS.red }}
        >
          Confirm
        </Button>
      </RowDiv>
    </CenteredDiv>
  );
}