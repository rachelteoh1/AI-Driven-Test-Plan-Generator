import styled from "styled-components";
import { Button } from "@mui/material";
import { X } from "lucide-react";
import { COLORS, FONTSIZE, SPACING } from "../lib/styles";

const ModalWrapper = styled.div`
  background-color: rgba(0,0,0,0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  inset: 0;
  z-index: 100;
`;

const ModalCard = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 0.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 2rem 2.5rem;
  min-width: 340px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const Title = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 1rem;
`;

const Message = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const CloseButton = styled(Button)`
  && {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    min-width: 0;
    padding: 0;
    color: #888;
  }
`;

export default function InstrumentNotFoundModal({ hideModal }) {
  return (
    <ModalWrapper>
      <ModalCard>
        <CloseButton onClick={hideModal}>
          <X className="h-5 w-5" />
        </CloseButton>
        <Title>Instrument Not Found</Title>
        <Message>
          Import a PDF to get started.
        </Message>
        <Button variant="contained" color="primary" onClick={hideModal}>
          OK
        </Button>
      </ModalCard>
    </ModalWrapper>
  );
}