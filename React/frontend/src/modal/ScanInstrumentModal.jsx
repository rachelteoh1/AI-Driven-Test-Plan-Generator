// import { useEffect, useState, useRef } from "react";
// import { Button } from "@mui/material";
// import styled from "styled-components";
// import instrumentScanning from "../assets/instrumentScanning.png";
// import { COLORS, FONTSIZE, FONTWEIGHT } from "../lib/styles";
// import CrossedModal from "./CrossedModal";
// import ScanResultModal from "./ScantResultModal";

// const CenteredDiv = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   gap: 1rem;
//   min-height: 65vh;
//   background-color: ${({ theme }) => theme.background};
// `;

// const Title = styled.h1`
//   font-size: ${FONTSIZE["2xl"]};
//   font-weight: ${FONTWEIGHT.medium};
//   color: ${({ theme }) => theme.text};
//   margin-bottom: 0rem;
// `;

// const StyledButton = styled(Button)`
//   width: 5rem;
//   height: 3rem;
//   margin-top: 5rem;
//   background-color: ${COLORS.blue} !important;
// `;

// export default function ScanInstrumentModal({ hideModal, showModal ,  detectedInstruments,onSelectInstrument,selectedInstrument,}) {
//   const [scanning, setScanning] = useState(false);
//   const abortRef = useRef(null);

//   const onScanClick = async () => {
//     setScanning(true);
//     abortRef.current = new AbortController();
//     try {
//       const res = await fetch("/instruments/scan", {
//         signal: abortRef.current.signal,
//       });
//       const data = await res.json();

      
//       if (data.length > 0) {
//         showModal({
//           modal: <ScanResultModal results={data} hideModal={hideModal} detectedInstruments={detectedInstruments} onSelectInstrument={onSelectInstrument} selectedInstrument={selectedInstrument} />,
//         });
//       } else {
//         showModal({
//           modal: <CrossedModal hideModal={hideModal} />,
//         });
//       }
//     } catch (e) {
//       if (e.name !== "AbortError") {
//         console.error(e);
//         hideModal();
//         showModal({
//           modal: <CrossedModal hideModal={hideModal} />,
//         });
//       }
//     } finally {
//       setScanning(false);
//     }
//   };

//   const cancelScan = () => {
//     abortRef.current?.abort();
//     setScanning(false);
//     hideModal();
//   };

//   // 🔹 Auto-start scan when modal opens
//   useEffect(() => {
//     onScanClick();
//   }, []);

//   return (
//     <CenteredDiv>
//       <img src={instrumentScanning} alt="instrument" height={100} width={100} />
//       <Title>{scanning ? "Scanning instrument..." : "Preparing result..."}</Title>
//       <StyledButton onClick={cancelScan} variant="contained">
//         Cancel
//       </StyledButton>
//     </CenteredDiv>
//   );
// }
