
import logo from "../assets/keysight.png"
import { X } from "lucide-react"
import styled from "styled-components"
import { COLORS, SPACING, FONTSIZE, FONTWEIGHT } from "../lib/styles"

// Styled Components
const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${SPACING.lg};
  background-color: ${COLORS.background.light};
  border-bottom: 1px ;
`

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.md};
`

const LogoImage = styled.img`
  width: 4rem;
  height: 4rem;
  object-fit: contain;
`

const LogoText = styled.span`
  font-size: ${FONTSIZE["3xl"]};
  font-weight: ${FONTWEIGHT.bold};
  color: ${COLORS.black};
`




const CloseIcon = styled(X)`
  width: ${FONTSIZE.md};
  height: ${FONTSIZE.md};
   position: absolute;
   margin-top:-2rem;
  right: 3rem;
  cursor: pointer;
`

// Component
export function Header() {
  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoContainer>
          <LogoImage src={logo} alt="KeysightGPT Logo" />
          <LogoText>KeysightGPT</LogoText>
        </LogoContainer>
      </LogoContainer>
     
        <CloseIcon />
  
    </HeaderContainer>
  )
}