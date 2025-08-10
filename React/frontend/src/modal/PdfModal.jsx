import styled from "styled-components";
import { Button } from "@mui/material";
import { useState } from "react";
import { X } from "lucide-react";
import { COLORS, FONTSIZE } from "../lib/styles";
import * as service from "../services/pdfServices"; // Import the service for backend calls

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

export default function PdfModal({ hideModal }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        // Call the backend to process the PDF
        const response = await service.uploadPdf(formData);
        console.log("SCPI commands extracted:", response.data);
        hideModal(); // Close the modal after successful upload
      } catch (error) {
        console.error("Error uploading PDF:", error);
      }
    }
  };

  return (
    <ModalWrapper>
      <CenteredDiv>
        <RowDiv>
          <Input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <Button
            onClick={hideModal}
            variant="text"
            size="small"
            style={{ position: "absolute", right: 0 }}
          >
            <X className="h-5 w-5" />
          </Button>
        </RowDiv>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile}
        >
          Upload PDF
        </Button>
      </CenteredDiv>
    </ModalWrapper>
  );
}