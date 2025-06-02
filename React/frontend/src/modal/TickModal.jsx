import Lottie from 'lottie-react';
import styled from 'styled-components';
import {COLORS,FONTSIZE, FONTWEIGHT} from '../lib/styles';
import lottieTicked from '../animation/lottieTicked.json';


const CenteredDiv = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    min-height: 50vh;
`;

const Title = styled.h1`
    font-size: ${FONTSIZE['2xl']};
    font-weight: ${FONTWEIGHT.medium};
    color: ${COLORS.black};
`;

const Description = styled.p`
    font-size: ${FONTSIZE.xl};
    font-weight: ${FONTWEIGHT.normal};
    color: ${COLORS.darkGrey};
`;

export default function TickedModal({ title, description }) {
    return (
        <CenteredDiv>
            <Lottie
                options={{ animationData: lottieTicked, autoplay: true, loop: true }}
                width={200}
                height={200}
                isClickToPauseDisabled
            />
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
        </CenteredDiv>
    );
}
