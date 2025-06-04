import Lottie from 'lottie-react';
import styled from 'styled-components';
import {COLORS,FONTSIZE, FONTWEIGHT} from '../lib/styles';
import lottieCrossed from '../animation/lottieCrossed.json';
import { Button } from '@mui/material';


const CenteredDiv = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    min-height: 50vh;
`;

const Title = styled.h1`
    font-size: ${FONTSIZE.lg};
    font-weight: ${FONTWEIGHT.medium};
    color: ${COLORS.black};
`;

const Description = styled.p`
    font-size: ${FONTSIZE.sm};
    font-weight: ${FONTWEIGHT.normal};
    color: ${COLORS.darkGrey};
`;
const StyledButton = styled(Button)`
  width: 5rem;
  height: 3rem;
  background-color: ${COLORS.blue} !important;
`;


export default function CrossedModal({ title, description, hideModal }) {
    return (
        <CenteredDiv>
            <Lottie
               animationData={lottieCrossed}
                      loop
                      autoplay
                      style={{ width: 200, height: 200 }}
                isClickToPauseDisabled
            />
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
            <StyledButton onClick = {hideModal} variant="contained">Ok</StyledButton>
        </CenteredDiv>
    );
}
