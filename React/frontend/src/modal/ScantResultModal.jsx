"use client";

import styled from "styled-components";
import { useState } from "react";
import { Button } from "@mui/material";
import { Badge } from "@mui/material";
import { CheckCircle2, Wifi, X } from "lucide-react";
import { COLORS } from "../lib/styles";

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;

  /* Semi-transparent background with blur effect */
  background-color: rgba(255, 255, 255, 0.2); /* adjust transparency */
  backdrop-filter: blur(8px); /* blur strength */
  -webkit-backdrop-filter: blur(8px); /* for Safari */
`;

const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 1rem;
  width: 32rem;
  max-height: 90vh;
  background-color: ${({ theme }) => theme.background};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.2);
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InstrumentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 15rem;
  overflow-y: auto;
`;

const InstrumentCard = styled.div`
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid
    ${({ isSelected, theme }) => (isSelected ? COLORS.blue : theme.border)};
  background-color: ${({ isSelected, theme }) =>
    isSelected ? "rgba(0, 123, 255, 0.05)" : theme.backgroundMedium};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundHover};
  }
`






export default function ScanResultsModal({
  hideModal,
  detectedInstruments,
  onSelectInstrument,
  selectedInstrument,
}) {
  const [localSelectedInstrument, setLocalSelectedInstrument] =
    useState(selectedInstrument);

  const handleSelectInstrument = (instrument) => {
    setLocalSelectedInstrument(instrument);
    console.log("Selected instrument:", instrument)
    console.log("Local state:", localSelectedInstrument)
  };

  const handleConfirmSelection = () => {
    if (localSelectedInstrument) {
      onSelectInstrument(localSelectedInstrument);
    }
    hideModal();
  };

  const handleCancel = () => {
    setLocalSelectedInstrument(selectedInstrument);
    hideModal();
  };

  return (
    <ModalWrapper>
      <CenteredDiv>
        {/* Title Row */}
        <TitleRow>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Wifi className="h-5 w-5 text-green-500" />
            Scan Complete
          </h2>
          <Button onClick={hideModal} variant="text" size="small">
            <X className="h-5 w-5" />
          </Button>
        </TitleRow>

        {/* Description */}
        <p className="text-sm text-gray-500">
          {detectedInstruments.length === 0
            ? "No instruments were detected during the scan."
            : `Found ${detectedInstruments.length} instrument${
                detectedInstruments.length === 1 ? "" : "s"
              }. Select one to use for this chat session.`}
        </p>

        {/* Instrument List */}
        <InstrumentsList>
          {detectedInstruments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No instruments detected</p>
              <p className="text-sm">
                Make sure instruments are connected and powered on.
              </p>
            </div>
          ) : (
            detectedInstruments.map((instrument) => (
              <InstrumentCard
                key={instrument.id}
                isSelected={localSelectedInstrument?.resource_string === instrument.resource_string}
                onClick={() => handleSelectInstrument(instrument)}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {instrument.model || ""}{" "}
                    </span>
                    {instrument.serial && (
                      <Badge variant="outlined">{instrument.serial}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {instrument.resource_string}
                  </div>
                   <div className="text-sm text-gray-500">
                    {instrument.manufacturer || "Unknown"} - Firmware: {instrument.firmware || "N/A"}
                  </div>
                </div>
                {localSelectedInstrument?.id === instrument.id && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                )}
              </InstrumentCard>
            ))
          )}
        </InstrumentsList>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outlined" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!localSelectedInstrument}
            className="flex-1"
            variant="contained"
            sx={{ backgroundColor: COLORS.blue }}
          >
            {localSelectedInstrument ? "Select Instrument" : "No Selection"}
          </Button>
        </div>
      </CenteredDiv>
    </ModalWrapper>
  );
}
