import styled from "styled-components";
import { Button } from "@mui/material";
import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";
import Lottie from "lottie-react";
import lottieTicked from "../animation/lottieTicked.json";
import lottieCrossed from "../animation/lottieCrossed.json";

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 32rem;                 /* FIXED SIZE */
  padding: 2.5rem 2rem;
  background-color: ${({ theme }) => theme.background};
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h1`
  font-size: ${FONTSIZE["2xl"]};
  font-weight: ${FONTWEIGHT.medium};
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const Description = styled.p`
  font-size: ${FONTSIZE.lg};
  font-weight: ${FONTWEIGHT.normal};
  color: ${({ theme }) => theme.greys.dark};
  text-align: center;
  max-width: 420px;
`;

export default function PTEMResultModal({
  status,
  errorMessage,
  hideModal,
}) {
  const isSuccess = status === "success";

  return (
    <ModalWrapper>
      <ModalCard>
        <Lottie
          animationData={isSuccess ? lottieTicked : lottieCrossed}
          loop
          autoplay
          style={{ width: 200, height: 200 }}
          isClickToPauseDisabled
        />

        <Title>
          {isSuccess ? "Upload Successful!" : "Upload Failed"}
        </Title>

        <Description>
          {isSuccess
            ? "Your optimized test sequence has been loaded to PTEM successfully."
            : errorMessage || "Failed to upload the test sequence. Please try again."}
        </Description>

        <Button
          onClick={hideModal}
          variant="contained"
          sx={{ backgroundColor: isSuccess ? COLORS.blue : COLORS.red }}
        >
          {isSuccess ? "Done" : "Close"}
        </Button>
      </ModalCard>
    </ModalWrapper>
  );
}
