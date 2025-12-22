import styled from "styled-components";
import { Button } from "@mui/material";
import { COLORS, FONTSIZE, FONTWEIGHT, lightTheme, darkTheme } from "../lib/styles";
import { useState } from "react";
import CrossedModal from "./CrossedModal";
import TickedModal from "./TickModal";

const ModalWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  min-height: 40vh;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.background};
`;

const Title = styled.h1`
  font-size: ${FONTSIZE["xl"]};
  font-weight: ${FONTWEIGHT.semiBold};
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const Input = styled.input`
  width: 30rem;
  max-width: 30rem;
  min-height: 2.5rem;
  padding: 12px 40px 12px 16px;
  background-color: ${({ theme }) => theme.backgroundMedium};
  border: 1px solid ${({ theme }) => theme.status.tick};
  border-radius: 1rem;
  outline: none;
  color: ${({ theme }) => theme.text};
  font-size: ${FONTSIZE.base};
  font-family: inherit;
  opacity: 1;
  line-height: 1.5;
  box-sizing: border-box;
  &::placeholder {
    color: ${({ theme }) => theme.greys.dark};
  }
`;

const RowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 5rem;
  background-color: ${({ theme }) => theme.background};
`;

export default function RenameModal({ chat, onRename, hideModal }) {
  const [newTitle, setNewTitle] = useState(chat.name || ""); 
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
        title="Unable to rename chat" 
        subtitle="Please try again later"
        hideModal={hideModal}
      />
    );
  }


  return (
    <ModalWrapper>
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
    </ModalWrapper>
  );
}
