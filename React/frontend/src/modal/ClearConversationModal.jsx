import { useState } from "react";

import styled from "styled-components";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";

import { Button } from "@mui/material";
import TickedModal from "./TickModal";
import CrossedModal from "./CrossedModal"; 

// Styled components
const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  min-height: 50vh;
`;

const Title = styled.h1`
  font-size: ${FONTSIZE["2xl"]};
  font-weight: ${FONTWEIGHT.medium};
  color: ${COLORS.black};
`;

const RowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 1rem;
`;



export default function ClearModal({ title, onSetChat, activeChat,hideModal }) {
  const [status, setStatus] = useState(null);

  const handleClear = () => {
    try {
      if (!activeChat) {
        setStatus("fail");
        return;
      }

      onSetChat((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat.id ? { ...chat, messages: [] } : chat
        )
      );

      setStatus("success");
    } catch (error) {
      setStatus("fail");
    }
  };

  if (status === "success") {
    return <TickedModal title="Conversation cleared successfully!" />;
  }

  if (status === "fail") {
    return (
      <CrossedModal
        title="Unable to clear the chat"
        description="Please try again later"
      />
    );
  }

  return (
    <CenteredDiv>
      {title && <Title>{title}</Title>}
      <RowDiv>
        <Button onClick={hideModal} variant="contained" sx={{ backgroundColor: COLORS.greyblue }}>
          Cancel
        </Button>
        <Button onClick={handleClear} variant="contained" sx={{ backgroundColor: COLORS.red }}>
          Clear
        </Button>
      </RowDiv>
    </CenteredDiv>
  );
}
