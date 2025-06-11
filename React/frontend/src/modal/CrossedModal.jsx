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
    gap: 1rem;
    min-height: 65vh;
`;

const Title = styled.h1`
    font-size: ${FONTSIZE['2xl']};
    font-weight: ${FONTWEIGHT.medium};
    color: ${COLORS.black};
`;

const Description = styled.p`
    font-size: ${FONTSIZE.lg};
    font-weight: ${FONTWEIGHT.normal};
    color: ${COLORS.darkGrey};
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
            <Button onClick = {hideModal} variant="contained" sx={{ backgroundColor: COLORS.blue } }>Ok</Button>
        </CenteredDiv>
    );
}