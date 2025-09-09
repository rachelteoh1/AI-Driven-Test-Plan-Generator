import styled, { keyframes } from "styled-components";
import { Button } from "@mui/material";
import { useRef, useState } from "react";
import { X, Loader2, UploadCloud } from "lucide-react";
import { COLORS, FONTSIZE, SPACING } from "../lib/styles";
import * as service from "../services/pdfServices";
import TickedModal from "./TickModal";
import CrossedModal from "./CrossedModal";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const ModalWrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  inset: 0;
  z-index: 50;
`;

const ModalCard = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 0.5rem;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  padding: 2.5rem 2rem 2rem 2rem;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: ${FONTSIZE.xl};
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
`;

const Description = styled.div`
  color: ${({ theme }) => theme.greys.light};
  font-size: ${FONTSIZE.sm};
  margin-bottom: 0.5rem;
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

const DropZone = styled.label`
  border: 2px dashed ${({ theme }) => theme.status.cancel};
  border-radius: 1rem;
  background: ${({ theme }) => theme.background};
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.secondary};
  }
`;

const UploadIcon = styled(UploadCloud)`
  width: 2.5rem;
  height: 2.5rem;
  color: ${({ theme }) => theme.greys.light};
  margin-bottom: 0.5rem;
`;

const ChooseFileButton = styled(Button)`
  && {
    margin-top: 1rem;
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    border: 1px solid #d3d3d3;
    border-radius: 0.5rem;
    font-weight: 500;
    text-transform: none;
    box-shadow: none;
    &:hover {
      background: ${({ theme }) => theme.background};
      border-color: ${({ theme }) => theme.secondary};
      color: ${({ theme }) => theme.secondary};
    }
  }
`;

const FileInput = styled.input`
  display: none;
`;

const InfoText = styled.div`
  color: ${({ theme }) => theme.greys.light};
  font-size: ${FONTSIZE.sm};
  text-align: left;
  line-height: 1.5;
`;

const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
`;

const LoadingIcon = styled(Loader2)`
  height: 1.5rem;
  width: 1.5rem;
  animation: ${spin} 1s linear infinite;
`;

const UploadPdfButton = styled(Button)`
  && {
    width: 100%;
    margin-top: 1rem;
    background: ${({ theme }) => theme.secondary};
    color: ${({ theme }) => theme.primaryLight};
    box-shadow: none;
    border-radius: 0.5rem;
    font-weight: 500;
    text-transform: none;
    &:hover {
      background: ${({ theme }) => theme.accent};
      color: ${({ theme }) => theme.hover};
    }
    &.Mui-disabled {
      background: ${({ theme }) => theme.greys.light};
      color: ${({ theme }) => theme.background.medium};
      cursor: not-allowed;
    }
  }
`;

export default function PdfModal({ hideModal, onUploadSuccess, selectedInstrument }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const fileInputRef = useRef();

  // console.log("selectedInstrument in PdfModal:", selectedInstrument);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        await service.uploadPdf(formData);
        if (onUploadSuccess) onUploadSuccess();
        setShowSuccessModal(true);
      } catch (error) {
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    }
  };

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
      <ModalCard>
        <Title>
          <span style={{ color: "#d32f2f", fontWeight: 700 }}>
            Import PDF Manual
          </span>
          <CloseButton onClick={hideModal}>
            <X className="h-5 w-5" />
          </CloseButton>
        </Title>
        <Description>
          Please import a PDF manual to get started with KeysightGPT. This will
          help me understand your device and provide accurate assistance.
        </Description>
        <DropZone htmlFor="pdf-upload">
          <UploadIcon />
          <div
            style={{
              color: "#888",
              fontSize: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            Drag and drop your PDF here, or click to browse
          </div>
          <FileInput
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            ref={fileInputRef}
          />
          <ChooseFileButton component="span" variant="outlined" disabled={loading}>
            Choose PDF File
          </ChooseFileButton>
          {selectedFile && (
            <div
              style={{
                color: "#1976d2",
                marginTop: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              {selectedFile.name}
            </div>
          )}
          {!selectedFile && selectedInstrument?.instrument_filename && (
            <div
              style={{
                color: "#1976d2",
                marginTop: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              Existing PDF: {selectedInstrument.instrument_filename}
            </div>
          )}
        </DropZone>
        {loading ? (
          <LoadingContent>
            <LoadingIcon />
            Uploading...
          </LoadingContent>
        ) : (
          <UploadPdfButton
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            Upload PDF
          </UploadPdfButton>
        )}
        <InfoText>
          • Supported format: PDF only
          <br />
          • Device manuals work best for accurate responses
        </InfoText>
      </ModalCard>
    </ModalWrapper>
  );
}