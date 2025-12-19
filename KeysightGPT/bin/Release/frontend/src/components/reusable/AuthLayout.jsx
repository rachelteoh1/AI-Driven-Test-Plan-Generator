import styled from 'styled-components';
import { Button } from "@mui/material"
import { X } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import { COLORS, SPACING } from "../../lib/styles"

// Styled containers
const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, ${COLORS.background.light}, ${COLORS.background.medium});
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${SPACING.md};
`

const Container = styled.div`
  width: 100%;
  max-width: 35rem;
`

const CloseButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
 
`

const StyledCard = styled.div`
  background: white;
  border-radius: 1.5rem;
  padding: ${SPACING.xl};
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`

export default function AuthLayout({ children, showCloseButton = true }) {
  const navigate = useNavigate()

  return (
    <Wrapper>
      <Container>
        
        <StyledCard>{showCloseButton && (
          <CloseButtonContainer>
            <Button
              variant="ghost"
              size="icon"
              style={{ color: COLORS.medium }}
              onClick={() => navigate("/")}
            >
              <X style={{ width: 20, height: 20, paddingLeft:470}} />
            </Button>
          </CloseButtonContainer>
        )}
        {children}
        </StyledCard>
      </Container>
    </Wrapper>
  )
}
