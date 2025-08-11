import styled, { keyframes } from "styled-components";
import { Button } from "@mui/material";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { COLORS, FONTSIZE, SPACING } from "../lib/styles";
import * as service from "../services/pdfServices";
import TickedModal from "./TickModal"; // Import TickedModal
import CrossedModal from "./CrossedModal"; // Import CrossedModal

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

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

const RowDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  position: relative;
`;

const Input = styled.input`
  width: 30rem;
  min-height: 2.5rem;
  padding: 12px 16px;
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

const LoadingContainer = styled.div`
  color: ${({ theme }) => theme.text};
  line-height: 1.625;
  max-width: 64rem;
`;

const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.sm};
  color: ${({ theme }) => theme.text};
`;

const LoadingIcon = styled(Loader2)`
  height: ${FONTSIZE.lg};
  width: ${FONTSIZE.lg};
  animation: ${spin} 1s linear infinite;
`;

export default function PdfModal({ hideModal }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false); // Track loading state
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Track success modal
  const [showErrorModal, setShowErrorModal] = useState(false); // Track error modal

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setLoading(true); // Set loading to true when upload starts
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        // Call the backend to process the PDF
        const response = await service.uploadPdf(formData);

        // Show success modal on successful upload
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Error uploading PDF:", error);

        // Show error modal on failed upload
        setShowErrorModal(true);
      } finally {
        setLoading(false); // Set loading to false when upload finishes
      }
    }
  };

  // Hide all modals and reset state
  const handleCloseModals = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    hideModal();
  };

  if (showSuccessModal) {
    return (
      <TickedModal
        title="Upload Successful"
        description="Your PDF has been uploaded successfully."
        hideModal={handleCloseModals}
      />
    );
  }

  if (showErrorModal) {
    return (
      <CrossedModal
        title="Upload Failed"
        description="There was an error uploading your PDF. Please try again."
        hideModal={handleCloseModals}
      />
    );
  }

  return (
    <ModalWrapper>
      <CenteredDiv>
        <RowDiv>
          <Input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading} // Disable input while loading
          />
          <Button
            onClick={hideModal}
            variant="text"
            size="small"
            style={{ position: "absolute", right: 0 }}
            disabled={loading} // Disable close button while loading
          >
            <X className="h-5 w-5" />
          </Button>
        </RowDiv>
        {loading ? (
          <LoadingContainer>
            <LoadingContent>
              <LoadingIcon />
              Uploading...
            </LoadingContent>
          </LoadingContainer>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!selectedFile || loading} // Disable button if no file or loading
          >
            Upload PDF
          </Button>
        )}
      </CenteredDiv>
    </ModalWrapper>
  );
}