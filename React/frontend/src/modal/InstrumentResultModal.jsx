import { Button } from "@mui/material";
import styled from "styled-components";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";
import * as service from "../services/pdfServices"

const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  min-height: 65vh;
  background-color: ${({ theme }) => theme.background};
`;

const Title = styled.h1`
  font-size: ${FONTSIZE["2xl"]};
  font-weight: ${FONTWEIGHT.bold};
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const ListWrapper = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  width: 90%;
`;

const ListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${COLORS.gray};
  border-radius: 8px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  font-size: ${FONTSIZE.base};
  color: ${({ theme }) => theme.text};
`;

const StyledButton = styled(Button)`
  background-color: ${COLORS.blue} !important;
`;

export default function ResultModal({ results, hideModal }) {
const handleInstrumentSelect = async (instrument) => {
  await service.selectInstrument(instrument.id); // calls backend
  hideModal();
  alert(`${instrument.name} selected as active instrument.`);
};

  return (
    <CenteredDiv>
      <Title>Instruments Found</Title>

      <ListWrapper>
        {results.map((instrument, index) => (
          <ListItem key={index}>
            <span>
              {instrument.name || `Instrument ${index + 1}`} –{" "}
              {instrument.address || "Unknown Address"}
            </span>
            <StyledButton
              variant="contained"
              onClick={() => handleInstrumentSelect(instrument)}
            >
              Select
            </StyledButton>
          </ListItem>
        ))}
      </ListWrapper>

      <Button variant="outlined" onClick={hideModal}>
        Close
      </Button>
    </CenteredDiv>
  );
}
