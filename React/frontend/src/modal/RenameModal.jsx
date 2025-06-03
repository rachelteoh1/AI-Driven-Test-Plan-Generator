import styled from "styled-components";
import { Button } from "@mui/material";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";
import { useState } from "react";
import CrossedModal from "./CrossedModal";
import TickedModal from "./TickModal";

const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  min-height: 40vh;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: ${FONTSIZE["xl"]};
  font-weight: ${FONTWEIGHT.semiBold};
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  text-align: center;
  border: none;
  background-color: #f9fafb;
  border-radius: 16px;
  padding: 12px 0;
  color: #6b7280;
  font-size: 1rem;
  &::placeholder {
    color: #9ca3af;
  }
  outline: none;
`;

const RowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 5rem;
`;

export default function RenameModal({ chat, onRename, hideModal }) {
  const [newTitle, setNewTitle] = useState(chat.name || ""); // see wan leave chatname not
  const [isLoading, setIsLoading] = useState(false);
const [status, setStatus] = useState('editing');
  const handleDone = async () => {
    if (!newTitle.trim()) return;

    setIsLoading(true);
    try {
      const success = await onRename(newTitle);
      setStatus(success ? 'success' : 'error');
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <TickedModal 
        title="Renamed Successfully!" 
        hideModal={hideModal}
      />
    );
  }

  if (status === 'error') {
    return (
      <CrossedModal 
        title="Error occurred" 
        subtitle="Please try again later"
        hideModal={hideModal}
      />
    );
  }


  return (
    <CenteredDiv>
      <Title>Rename Chat</Title>
      <Input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Enter new chat name"
        autoFocus
      />
      <RowDiv>
        <Button
          variant="contained"
          onClick={hideModal}
          sx={{ backgroundColor: COLORS.grey }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: COLORS.blue }}
          onClick={handleDone}
          disabled={!newTitle.trim() || isLoading}
        >
          {isLoading ? "Saving..." : "Done"}
        </Button>
      </RowDiv>
    </CenteredDiv>
  );
}
