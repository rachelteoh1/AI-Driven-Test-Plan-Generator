
import styled from "styled-components";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";

import { Button } from "@mui/material";
import TickedModal from "./TickModal";
import CrossedModal from "./CrossedModal";
import { useState } from "react";

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
   max-width: 300px;      
  margin: 0 auto;  
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
  background-color: ${({ theme }) => theme.background};
`;
const Description = styled.p`
    font-size: ${FONTSIZE.sm};
    font-weight: ${FONTWEIGHT.normal};
    color: ${({ theme }) => theme.text};
`;

export default function DeleteModal({ chat, onDelete ,hideModal}) {
  const [status, setStatus] = useState(false);

  const handleDelete = async () => {
    try {
      const result = await onDelete(chat.session_id); 
      if (result) {
        setStatus("success");
      } else {
        setStatus("fail");
      }
    } catch (error) {
      setStatus("fail");
    }
  };

  if (status === "success") {
    return <TickedModal title="Chat deleted successfully!"  hideModal={hideModal}/>;
  }

  if (status === "fail") {
    return (
      <CrossedModal title="Unable to delete chat. Please try again later."  hideModal={hideModal}/>
    );
  }

  return (
    <ModalWrapper>
    <CenteredDiv>
      <Title>Delete Chat?</Title>
      {chat.name && <Description>This will delete <strong>{chat.name}</strong>.</Description>}

      <RowDiv>
        <Button onClick={hideModal} variant="contained" sx={{ backgroundColor: COLORS.greyblue }}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" sx={{ backgroundColor: COLORS.red }}>
          Delete
        </Button>
      </RowDiv>
    </CenteredDiv>
    </ModalWrapper>
  );
}
