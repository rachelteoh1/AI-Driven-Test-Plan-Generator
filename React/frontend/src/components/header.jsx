
// import logo from "../assets/keysight.png"
// import { X } from "lucide-react"
// import styled from "styled-components"
// import { COLORS, SPACING, FONTSIZE, FONTWEIGHT, lightTheme, darkTheme } from "../lib/styles"

// // Styled Components
// const HeaderContainer = styled.header`
//   display: flex;
//   width: 100%
//   align-items: center;
//   justify-content: center;
//   padding: ${SPACING.sm};
//   background-color: ${({ theme }) => theme.card};  // was COLORS.background.light
// `;


// const LogoContainer = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: ${SPACING.md};
// `

// const LogoImage = styled.img`
//   width: 4rem;
//   height: 4rem;
//   object-fit: contain;
// `

// const LogoText = styled.span`
//   font-size: ${FONTSIZE["3xl"]};
//   font-weight: ${FONTWEIGHT.bold};
//   color: ${({ theme }) => theme.text};
// `;




// const CloseIcon = styled(X)`
//   width: ${FONTSIZE.md};
//   height: ${FONTSIZE.md};
//   color: ${({ theme }) => theme.text};
//   position: absolute;
//   margin-top: -2rem;
//   right: 3rem;
//   cursor: pointer;
// `;


// // Component
// export function Header() {
//   return (
//     <HeaderContainer>
//       <LogoContainer>
//         <LogoContainer>
//           <LogoImage src={logo} alt="KeysightGPT Logo" />
//           <LogoText>KeysightGPT</LogoText>
//         </LogoContainer>
//       </LogoContainer>
     
//         <CloseIcon />
  
//     </HeaderContainer>
//   )
// }

import styled, { keyframes } from "styled-components";
import logo from "../assets/keysight.png";
import { X } from "lucide-react";
import { SPACING, FONTSIZE, FONTWEIGHT } from "../lib/styles";

const fadeInSlide = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const logoAppear = keyframes`
  0% {
    opacity: 0;
    transform: scale(0) translateY(100px);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

// const HeaderContainer = styled.header`
//   display: flex;
//   width: 100%
//   align-items: center;
//   justify-content: center;
//   padding: ${SPACING.sm};
//   background-color: ${({ theme }) => theme.card};  // was COLORS.background.light
// `;
const HeaderContainer = styled.header`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding: ${SPACING.md} ${SPACING.xl};
  background-color: ${({ theme }) => theme.card};
  height: 10%;
  position: relative;
  animation: ${fadeInSlide} 0.4s ease-out;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.md};
  animation: ${logoAppear} 0.6s ease-out 0.2s backwards;
`;

const LogoImage = styled.img`
  width: 3rem;
  height: 3rem;
  object-fit: contain;
`;

const LogoText = styled.span`
  font-size: ${FONTSIZE["2xl"]};
  font-weight: ${FONTWEIGHT.bold};
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;




export function Header() {
  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoImage src={logo} alt="KeysightGPT Logo" />
        <LogoText>KeysightGPT</LogoText>
      </LogoContainer>
      

    </HeaderContainer>
  );
}