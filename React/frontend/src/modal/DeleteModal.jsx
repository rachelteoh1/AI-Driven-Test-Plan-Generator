
import styled from "styled-components";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";

import { Button } from "@mui/material";
import TickedModal from "./TickModal";
import CrossedModal from "./CrossedModal";
import { useState } from "react";


const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
   min-height: 40vh;
   max-width: 300px;      
  margin: 0 auto;  
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
  gap: 5rem;
`;
const Description = styled.p`
    font-size: ${FONTSIZE.sm};
    font-weight: ${FONTWEIGHT.normal};
    color: ${COLORS.darkGrey};
`;

export default function DeleteModal({ chatName, onDelete ,hideModal}) {
  const [status, setStatus] = useState(false);

  const handleDelete = async () => {
    try {
      const result = await onDelete(); 
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
    return <TickedModal title="Chat deleted successfully!" />;
  }

  if (status === "fail") {
    return (
      <CrossedModal title="Error Occured. Please try again later."  hideModal={hideModal}/>
    );
  }

  return (
    <CenteredDiv>
      <Title>Delete Chat?</Title>
      {chatName && <Description>This will delete <strong>{chatName}</strong>.</Description>}

      <RowDiv>
        <Button onClick={hideModal} variant="contained" sx={{ backgroundColor: COLORS.greyblue }}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" sx={{ backgroundColor: COLORS.red }}>
          Delete
        </Button>
      </RowDiv>
    </CenteredDiv>
  );
}
